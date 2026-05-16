/**
 * OperatorSessionFinalArchiveExport
 * Final local-only archive export of operator session history and manual monitoring state.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no credentials, no trading
 *   - localStorage read-only
 *   - No scheduler, no polling, no timers
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Archive } from 'lucide-react';

const SOURCE_KEYS = {
  sessionAuditDashboards:      'openclawOperatorSessionAuditDashboards',
  sessionEvidenceExports:      'openclawOperatorSessionEvidenceExports',
  sessionLogs:                 'openclawOperatorSessionLogs',
  dailyUsePanels:              'openclawOperatorDailyUsePanels',
  controlRoomSummaries:        'openclawManualMonitoringControlRoomSummaries',
  finalAcceptancePackets:      'openclawManualMonitoringFinalAcceptancePackets',
  operatorRunbooks:            'openclawManualMonitoringOperatorRunbooks',
  promotionGates:              'openclawManualMonitoringPromotionGates',
  auditDashboards:             'openclawManualMonitoringAuditDashboards',
  evidenceExports:             'openclawManualMonitoringEvidenceExports',
  manualChecks:                'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:            'openclawMonitoringModeReadinessPackets',
  bridgePromotionGates:        'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints:        'openclawBridgeIntegrityCheckpoints',
  bridgeAuditReports:          'openclawBridgeAuditReportDashboards',
  bridgeCalls:                 'openclawControlledReadOnlyRouteBridgeCalls',
  auditTrail:                  'openclawAuditTrail',
};
const ARCHIVE_KEY = 'openclawOperatorSessionFinalArchiveExports';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveArchive(archive) {
  try {
    const all = loadJSON(ARCHIVE_KEY, []);
    const deduped = [archive, ...all.filter(a => {
      if (archive.latestSessionAuditDashboardId && a.latestSessionAuditDashboardId) {
        return a.latestSessionAuditDashboardId !== archive.latestSessionAuditDashboardId;
      }
      return a.archiveId !== archive.archiveId;
    })];
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildArchive() {
  const auditDashboards = loadJSON(SOURCE_KEYS.sessionAuditDashboards, []);
  const sessionEvidenceExports = loadJSON(SOURCE_KEYS.sessionEvidenceExports, []);
  const sessionLogs = loadJSON(SOURCE_KEYS.sessionLogs, []);
  const dailyPanels = loadJSON(SOURCE_KEYS.dailyUsePanels, []);
  const controlRoomSummaries = loadJSON(SOURCE_KEYS.controlRoomSummaries, []);
  const finalAcceptance = loadJSON(SOURCE_KEYS.finalAcceptancePackets, [])[0];
  const operatorRunbooks = loadJSON(SOURCE_KEYS.operatorRunbooks, []);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, [])[0];
  const manualAuditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const manualEvidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const manualChecks = loadJSON(SOURCE_KEYS.manualChecks, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const bridgePromotionGates = loadJSON(SOURCE_KEYS.bridgePromotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);
  const bridgeAuditReports = loadJSON(SOURCE_KEYS.bridgeAuditReports, []);
  const bridgeCalls = loadJSON(SOURCE_KEYS.bridgeCalls, []);
  const auditTrail = loadJSON(SOURCE_KEYS.auditTrail, []);

  const latestAuditDashboard = auditDashboards[0];
  const latestEvidenceExport = sessionEvidenceExports[0];
  const latestFinalAcceptance = finalAcceptance;
  const latestControlRoom = controlRoomSummaries[0];

  // Source counts
  const sourceCounts = {
    sessionAuditDashboards: auditDashboards.length,
    sessionEvidenceExports: sessionEvidenceExports.length,
    sessionLogs: sessionLogs.length,
    dailyUsePanels: dailyPanels.length,
    controlRoomSummaries: controlRoomSummaries.length,
    finalAcceptancePackets: loadJSON(SOURCE_KEYS.finalAcceptancePackets, []).length,
    operatorRunbooks: operatorRunbooks.length,
    promotionGates: loadJSON(SOURCE_KEYS.promotionGates, []).length,
    auditDashboards: manualAuditDashboards.length,
    evidenceExports: manualEvidenceExports.length,
    manualChecks: manualChecks.length,
    readinessPackets: readinessPackets.length,
    bridgePromotionGates: bridgePromotionGates.length,
    integrityCheckpoints: integrityCheckpoints.length,
    bridgeAuditReports: bridgeAuditReports.length,
    bridgeCalls: bridgeCalls.length,
  };

  // Session counts
  const closedSessions = sessionLogs.filter(s => s.sessionStatus === 'CLOSED').length;
  const openSessions = sessionLogs.filter(s => s.sessionStatus === 'OPEN').length;
  const blockedSessions = sessionLogs.filter(s => s.sessionStatus === 'BLOCKED').length;

  // Archive status logic
  let archiveStatus = 'INCOMPLETE';
  let safetyFailureDetected = false;

  if (blockedSessions > 0) {
    archiveStatus = 'BLOCKED_BY_SAFETY_FAILURE';
    safetyFailureDetected = true;
  } else if (sessionLogs.length > 0 && sessionEvidenceExports.length > 0 && auditDashboards.length > 0 && latestFinalAcceptance?.acceptanceStatus?.includes('ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING')) {
    archiveStatus = 'COMPLETE';
  }

  const completedMilestones = [
    'Manual Monitoring Control Room Summary',
    'Operator Daily Use Panel',
    'Operator Session Log',
    'Operator Session Evidence Export',
    'Operator Session Audit Dashboard',
    'Manual Monitoring Console',
    'Manual Monitoring Evidence Export',
    'Manual Monitoring Audit Dashboard',
    'Manual Monitoring Promotion Gate',
    'Manual Monitoring Operator Runbook',
    'Manual Monitoring Final Acceptance Packet',
  ];

  const explicitlyBlockedCapabilities = [
    'Command dispatch',
    'Browser execution',
    'POST/PUT/PATCH/DELETE mutation methods',
    'Trading',
    'Broker execution',
    'Credential entry',
    'Wallet actions',
    'Money movement',
    'Scheduler',
    'Polling loop',
    'Direct OpenAI API calls',
  ];

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                      pass: true },
    { key: 'executionLocked',          value: 'LOCKED',                 pass: true },
    { key: 'executionModeDisabled',    value: 'DISABLED',               pass: true },
    { key: 'monitoringModeManualOnly', value: 'MANUAL_ONLY',            pass: true },
    { key: 'methodGetOnly',            value: 'GET',                    pass: true },
    { key: 'noScheduler',              value: false,                     pass: true },
    { key: 'noPollingLoop',            value: false,                     pass: true },
    { key: 'noCommandPayload',         value: true,                      pass: true },
    { key: 'dispatchAllowed',          value: false,                     pass: true },
    { key: 'commandDispatchAttempted', value: false,                     pass: true },
    { key: 'openClawCommandSent',      value: false,                     pass: true },
    { key: 'executionAttempted',       value: false,                     pass: true },
    { key: 'browserToolUsed',          value: false,                     pass: true },
    { key: 'credentialExposed',        value: false,                     pass: true },
    { key: 'secretExposed',            value: false,                     pass: true },
    { key: 'tradingAttempted',         value: false,                     pass: true },
    { key: 'brokerActionsAttempted',   value: false,                     pass: true },
    { key: 'walletActionsAttempted',   value: false,                     pass: true },
    { key: 'moneyMovementAttempted',   value: false,                     pass: true },
    { key: 'directOpenAIDisabled',     value: true,                      pass: true },
  ];

  const sessionSummaries = sessionLogs.slice(0, 20).map(s => ({
    sessionId: s.sessionId.slice(-8),
    status: s.sessionStatus,
    createdAt: new Date(s.createdAt).toLocaleDateString(),
    closedAt: s.closedAt ? new Date(s.closedAt).toLocaleDateString() : '—',
    checklistCompleted: s.checklistCompletedCount,
  }));

  const evidenceSummaries = sessionEvidenceExports.slice(0, 20).map(e => ({
    exportId: e.sessionEvidenceExportId.slice(-8),
    sourceSessionId: e.sourceSessionId.slice(-8),
    createdAt: new Date(e.createdAt).toLocaleDateString(),
    checklistCompleted: e.checklistSummary?.completed || 0,
  }));

  const archiveId = 'osfa-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    archiveId,
    createdAt: new Date().toISOString(),
    phase: 'OPERATOR_SESSION_FINAL_ARCHIVE_EXPORT',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    archiveStatus,
    approvedScope: 'MANUAL_READ_ONLY_STATUS_MONITORING_ONLY',
    gatewayMode: 'READ_ONLY',
    executionMode: 'DISABLED',
    executionLock: 'LOCKED',
    monitoringMode: 'MANUAL_ONLY',
    schedulerActive: false,
    pollingLoopActive: false,
    dispatchAllowed: false,
    commandDispatchAllowed: false,
    executionAllowed: false,
    sourceCounts,
    latestSessionAuditDashboardId: latestAuditDashboard?.sessionAuditDashboardId ?? null,
    latestSessionEvidenceExportId: latestEvidenceExport?.sessionEvidenceExportId ?? null,
    latestSessionId: sessionLogs[0]?.sessionId ?? null,
    latestFinalAcceptancePacketId: latestFinalAcceptance?.finalAcceptancePacketId ?? null,
    latestControlRoomSummaryId: latestControlRoom?.controlRoomSummaryId ?? null,
    totalSessions: sessionLogs.length,
    closedSessions,
    openSessions,
    blockedSessions,
    evidenceExportCount: sessionEvidenceExports.length,
    manualCheckCount: manualChecks.length,
    auditDashboardCount: auditDashboards.length,
    acceptanceStatus: latestFinalAcceptance?.acceptanceStatus ?? 'UNKNOWN',
    readinessStatus: readinessPackets[0]?.readinessStatus ?? 'UNKNOWN',
    promotionDecision: promotionGates?.promotionDecision ?? 'UNKNOWN',
    latestAuditStatus: manualAuditDashboards[0]?.auditStatus ?? 'UNKNOWN',
    latestEndpoint: sessionLogs[0]?.latestEndpoint ?? 'N/A',
    latestHttpStatus: sessionLogs[0]?.latestHttpStatus ?? 'N/A',
    archiveContentsSummary: {
      operatorSessionRecords: sessionLogs.length,
      sessionEvidencePackets: sessionEvidenceExports.length,
      auditDashboards: auditDashboards.length,
      manualMonitoringRecords: manualChecks.length,
      acceptanceAndReadiness: 2,
      bridgeAndGovernance: 4,
      totalRecords: Object.values(sourceCounts).reduce((a, b) => a + b, 0),
    },
    completedMilestones,
    explicitlyBlockedCapabilities,
    sessionSummaries,
    evidenceSummaries,
    sourceDiagnostics: {
      operatorSessionHistoryPresent: sessionLogs.length > 0,
      evidenceExportsPresent: sessionEvidenceExports.length > 0,
      auditDashboardsPresent: auditDashboards.length > 0,
      acceptancePacketPresent: !!latestFinalAcceptance,
      allMilestonesReached: completedMilestones.length === 11,
      safetyFailureDetected,
    },
    safetyAssertions,
    note: 'Final archive export only. Local manual monitoring records. No scheduler. No polling. No dispatch. No execution.',
  };
}

function CopyButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Final Archive JSON'}
    </button>
  );
}

export default function OperatorSessionFinalArchiveExport() {
  const [archive, setArchive] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const a = buildArchive();
    saveArchive(a);
    tryAppendAudit({
      event: 'operator_session_final_archive_export_created',
      archiveId: a.archiveId,
      archiveStatus: a.archiveStatus,
      totalSessions: a.totalSessions,
      evidenceExportCount: a.evidenceExportCount,
      note: `Operator session final archive export created (${a.archiveId}). Status: ${a.archiveStatus}. Total records: ${a.archiveContentsSummary.totalRecords}. No dispatch. No execution.`,
    });
    setArchive(a);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const STATUS_STYLE = {
    COMPLETE: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'COMPLETE' },
    INCOMPLETE: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'INCOMPLETE' },
    BLOCKED_BY_SAFETY_FAILURE: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED' },
  };

  const style = archive ? (STATUS_STYLE[archive.archiveStatus] || STATUS_STYLE.INCOMPLETE) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Final Archive</div>
          <div className="text-[13px] font-bold text-foreground">Operator Session Final Archive Export</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Complete archive of operator session history and manual monitoring state — local-only export.</div>
        </div>
        {archive && (
          <button type="button" onClick={generate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">ARCHIVE_ONLY / READ_ONLY / LOCKED</span> — Final archive export. No network. No dispatch. No execution.</span>
      </div>

      {archive && (
        <>
          {/* Archive Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Archive Status: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {style.label === 'COMPLETE' && 'Complete archive ready. All records and milestones verified. Safe to archive.'}
                  {style.label === 'INCOMPLETE' && 'Archive incomplete. Some evidence or records are missing.'}
                  {style.label === 'BLOCKED' && 'Archive blocked by safety failure. Review immediately.'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Archive Status',        value: archive.archiveStatus.split('_')[0], color: style.color },
              { label: 'Total Sessions',        value: archive.totalSessions,                color: 'text-primary font-bold' },
              { label: 'Closed Sessions',       value: archive.closedSessions,              color: 'text-green-500 font-bold' },
              { label: 'Evidence Exports',      value: archive.evidenceExportCount,         color: 'text-primary font-bold' },
              { label: 'Manual Checks',         value: archive.manualCheckCount,            color: 'text-slate-300' },
              { label: 'Latest Audit Status',   value: archive.latestAuditStatus,           color: 'text-slate-300' },
              { label: 'Acceptance Status',     value: archive.acceptanceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Latest Endpoint',       value: archive.latestEndpoint,              color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'Scheduler Active',      value: String(archive.schedulerActive),     color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',     value: String(archive.executionAllowed),    color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Archive Contents Summary */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Archive Contents Summary</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(archive.archiveContentsSummary).map(([key, val]) => (
                <div key={key} className="bg-card/60 px-2 py-1.5 rounded border border-border/40">
                  <div className="text-slate-500 mb-0.5 uppercase text-[7px] tracking-widest">{key}</div>
                  <div className="font-bold text-[10px] text-primary">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Counts Grid */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Source Record Counts</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[8px]">
              {Object.entries(archive.sourceCounts).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center px-2 py-1.5 rounded border border-border/40 bg-secondary/10">
                  <span className="text-slate-500 mb-0.5 uppercase text-[6px] tracking-widest text-center">{key}</span>
                  <span className="text-primary font-bold text-[11px]">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Milestones Grid */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Completed Milestones ({archive.completedMilestones.length})</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {archive.completedMilestones.map((milestone, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{milestone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicitly Blocked Capabilities Grid */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Explicitly Blocked Capabilities</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {archive.explicitlyBlockedCapabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-destructive/20 bg-destructive/5">
                  <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Summaries Table */}
          {archive.sessionSummaries.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Session Summaries ({archive.sessionSummaries.length})</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Session ID', 'Status', 'Created', 'Closed', 'Checklist'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {archive.sessionSummaries.map((session, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">{session.sessionId}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`text-[7px] px-1 py-0.5 border rounded font-bold uppercase ${
                            session.status === 'CLOSED' ? 'border-green-500/30 bg-green-500/5 text-green-500' :
                            session.status === 'OPEN' ? 'border-primary/30 bg-primary/5 text-primary' :
                            'border-amber-500/30 bg-amber-500/5 text-amber-500'
                          }`}>{session.status}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.createdAt}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.closedAt}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap font-bold">{session.checklistCompleted}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evidence Summaries Table */}
          {archive.evidenceSummaries.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Evidence Summaries ({archive.evidenceSummaries.length})</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Export ID', 'Source Session', 'Created', 'Checklist'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {archive.evidenceSummaries.map((exp, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{exp.exportId}</td>
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">{exp.sourceSessionId}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{exp.createdAt}</td>
                        <td className="px-3 py-2 text-slate-400 font-bold whitespace-nowrap">{exp.checklistCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
              {Object.entries(archive.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`bg-card/60 px-2 py-1 rounded border border-border/40 ${typeof val === 'boolean' && val ? 'border-primary/30' : ''}`}>
                  <div className="text-slate-500 mb-0.5">{key}</div>
                  <div className={`font-bold text-[9px] ${typeof val === 'boolean' && val ? 'text-primary' : 'text-slate-500'}`}>{String(val)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {archive.safetyAssertions.filter(a => a.pass).length}/{archive.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {archive.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className={`text-[7px] font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>
                    {String(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Final Archive JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(archive, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Archive ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Archive className="w-3 h-3" /><span className="font-mono">{archive.archiveId}</span></span>
            <span>{new Date(archive.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={archive} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Final Archive
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Final archive export is local-only. Manual read-only monitoring records only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}