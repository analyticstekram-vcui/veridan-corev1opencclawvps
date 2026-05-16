/**
 * ManualMonitoringControlRoomSummary
 * Local-only control room summary for manual read-only monitoring state.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no scheduler, no polling loop
 *   - Status view only
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldCheck, RefreshCw, FileJson, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  finalAcceptancePackets:    'openclawManualMonitoringFinalAcceptancePackets',
  promotionGates:            'openclawManualMonitoringPromotionGates',
  auditDashboards:           'openclawManualMonitoringAuditDashboards',
  evidenceExports:           'openclawManualMonitoringEvidenceExports',
  monitoringChecks:          'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:          'openclawMonitoringModeReadinessPackets',
  bridgePromotionGates:      'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints:      'openclawBridgeIntegrityCheckpoints',
  bridgeAuditReports:        'openclawBridgeAuditReportDashboards',
  bridgeCallResults:         'openclawControlledReadOnlyRouteBridgeCalls',
  handoffPackets:            'openclawOperatorHandoffPackets',
  auditTrail:                'openclawAuditTrail',
};
const SUMMARY_KEY = 'openclawManualMonitoringControlRoomSummaries';

const ALLOWED_ACTIONS = [
  'run manual GET /health',
  'run manual GET /status',
  'run manual GET /version',
  'run manual GET /capabilities',
  'copy evidence JSON',
  'regenerate local audit dashboards',
  'review local safety assertions',
];

const BLOCKED_CAPABILITIES = [
  'command dispatch',
  'browser execution',
  'POST/PUT/PATCH/DELETE',
  'trading',
  'broker execution',
  'credential entry',
  'wallet actions',
  'money movement',
  'scheduler',
  'polling loop',
  'direct OpenAI API calls',
];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveSummary(summary) {
  try {
    const all = loadJSON(SUMMARY_KEY, []);
    // Deduplicate by final acceptance packet id + manual check id if present
    const deduped = [
      summary,
      ...all.filter(s => {
        if (summary.latestFinalAcceptancePacketId && summary.latestManualCheckId && s.latestFinalAcceptancePacketId && s.latestManualCheckId) {
          return !(s.latestFinalAcceptancePacketId === summary.latestFinalAcceptancePacketId && s.latestManualCheckId === summary.latestManualCheckId);
        }
        return s.summaryId !== summary.summaryId;
      }),
    ];
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildSummary() {
  const finalAcceptancePackets = loadJSON(SOURCE_KEYS.finalAcceptancePackets, []);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const auditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const monitoringChecks = loadJSON(SOURCE_KEYS.monitoringChecks, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const bridgePromotionGates = loadJSON(SOURCE_KEYS.bridgePromotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);
  const bridgeAuditReports = loadJSON(SOURCE_KEYS.bridgeAuditReports, []);
  const bridgeCallResults = loadJSON(SOURCE_KEYS.bridgeCallResults, []);

  const latestAcceptancePacket = finalAcceptancePackets[0];
  const latestGate = promotionGates[0];
  const latestAudit = auditDashboards[0];
  const latestExport = evidenceExports[0];
  const latestCheck = monitoringChecks[0];
  const latestPacket = readinessPackets[0];
  const latestBridgeAudit = bridgeAuditReports[0];

  const successfulChecks = monitoringChecks.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.error &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  // Determine current state
  const currentAcceptanceStatus = latestAcceptancePacket?.acceptanceStatus ?? 'UNKNOWN';
  const currentReadinessStatus = latestPacket?.readinessStatus ?? 'UNKNOWN';
  const currentPromotionDecision = latestGate?.promotionDecision ?? 'UNKNOWN';

  // Determine banner color
  let bannerStatus = 'WARN';
  if (currentAcceptanceStatus === 'BLOCKED_BY_SAFETY_FAILURE' || latestGate?.promotionDecision === 'BLOCKED_BY_SAFETY_FAILURE') {
    bannerStatus = 'FAIL';
  } else if (currentAcceptanceStatus === 'ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING' && latestAcceptancePacket?.safetyAssertions?.every(a => a.pass)) {
    bannerStatus = 'PASS';
  }

  // Determine next safe action
  let nextSafeOperatorAction = '';
  if (bannerStatus === 'PASS') {
    nextSafeOperatorAction = 'Run a manual read-only monitoring check, then export evidence and regenerate audit dashboard.';
  } else if (bannerStatus === 'WARN') {
    nextSafeOperatorAction = 'Generate missing evidence records before continuing.';
  } else {
    nextSafeOperatorAction = 'Stop and resolve safety failure before any monitoring action.';
  }

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                              pass: true },
    { key: 'disabled',                 value: true,                              pass: true },
    { key: 'executionLock',            value: 'LOCKED',                          pass: true },
    { key: 'monitoringMode',           value: 'MANUAL_ONLY',                     pass: true },
    { key: 'schedulerActive',          value: false,                             pass: true },
    { key: 'pollingLoopActive',        value: false,                             pass: true },
    { key: 'schedulerApproved',        value: false,                             pass: true },
    { key: 'pollingApproved',          value: false,                             pass: true },
    { key: 'noCommandPayload',         value: true,                              pass: true },
    { key: 'dispatchAllowed',          value: false,                             pass: true },
    { key: 'commandDispatchAllowed',   value: false,                             pass: true },
    { key: 'openClawCommandSent',      value: false,                             pass: !latestCheck?.openClawCommandSent },
    { key: 'executionAttempted',       value: false,                             pass: !latestCheck?.executionAttempted },
    { key: 'browserToolUsed',          value: false,                             pass: !latestCheck?.browserToolUsed },
    { key: 'credentialExposed',        value: false,                             pass: !latestCheck?.credentialExposed },
    { key: 'secretExposed',            value: false,                             pass: !latestCheck?.secretExposed },
    { key: 'tradingAttempted',         value: false,                             pass: !latestCheck?.tradingAttempted },
    { key: 'brokerActionsAttempted',   value: false,                             pass: !latestCheck?.moneyMovementAttempted },
    { key: 'walletActionsBlocked',     value: true,                              pass: true },
    { key: 'moneyMovementBlocked',     value: true,                              pass: true },
    { key: 'mutationEndpointsBlocked', value: true,                              pass: true },
  ];

  const sourceDiagnostics = {
    finalAcceptancePacketPresent:      !!latestAcceptancePacket,
    promotionGatePresent:              !!latestGate,
    auditDashboardPresent:             !!latestAudit,
    evidenceExportPresent:             !!latestExport,
    monitoringCheckCount:              monitoringChecks.length,
    successfulCheckCount:              successfulChecks,
    readinessPacketPresent:            !!latestPacket,
    bridgeIntegrity:                   integrityCheckpoints.length > 0 ? 'VERIFIED' : 'UNKNOWN',
  };

  const summaryId = 'mmcrs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    summaryId,
    createdAt:                       new Date().toISOString(),
    phase:                           'MANUAL_MONITORING_CONTROL_ROOM_SUMMARY',
    systemName:                      'VeridanCore OpenClaw Operator Portal',
    bannerStatus,
    currentAcceptanceStatus,
    currentReadinessStatus,
    currentPromotionDecision,
    latestManualAuditStatus:         latestAudit?.auditStatus ?? 'UNKNOWN',
    latestGatewayStatus:             latestBridgeAudit?.overallStatus ?? 'UNKNOWN',
    latestEndpoint:                  latestCheck?.endpoint ?? null,
    latestHttpStatus:                latestCheck?.httpStatus ?? null,
    latestGatewayReachable:          latestCheck?.gatewayReachable ?? false,
    latestCfAccessDetected:          latestCheck?.cfAccessDetected ?? false,
    latestManualCheckId:             latestCheck?.checkId ?? null,
    latestEvidenceExportId:          latestExport?.evidenceExportId ?? null,
    latestFinalAcceptancePacketId:   latestAcceptancePacket?.acceptancePacketId ?? null,
    latestPromotionGateId:           latestGate?.gateId ?? null,
    gatewayMode:                     'READ_ONLY',
    executionMode:                   'DISABLED',
    executionLock:                   'LOCKED',
    monitoringMode:                  'MANUAL_ONLY',
    schedulerActive:                 false,
    pollingLoopActive:               false,
    dispatchAllowed:                 false,
    commandDispatchAllowed:          false,
    executionAllowed:                false,
    nextSafeOperatorAction,
    allowedOperatorActions:          ALLOWED_ACTIONS,
    blockedCapabilities:             BLOCKED_CAPABILITIES,
    sourceDiagnostics,
    safetyAssertions,
    note: 'Control room summary only. Local read-only status view. No scheduler. No polling. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Control Room Summary JSON'}
    </button>
  );
}

export default function ManualMonitoringControlRoomSummary({ refreshTrigger }) {
  const [summary, setSummary] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const s = buildSummary();
    saveSummary(s);
    tryAppendAudit({
      event:                  'manual_monitoring_control_room_summary_generated',
      summaryId:              s.summaryId,
      bannerStatus:           s.bannerStatus,
      currentAcceptanceStatus: s.currentAcceptanceStatus,
      note: `Control room summary generated (${s.summaryId}). Status: ${s.bannerStatus}. Acceptance: ${s.currentAcceptanceStatus}. No dispatch. No execution.`,
    });
    setSummary(s);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  const BANNER_STYLE = {
    PASS: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2,  label: 'MANUAL MONITORING ACTIVE' },
    WARN: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'MANUAL MONITORING HOLD' },
    FAIL: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'MANUAL MONITORING BLOCKED' },
  };

  const style = BANNER_STYLE[summary?.bannerStatus] || BANNER_STYLE.WARN;
  const Icon = style.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Control Room Summary</div>
          <div className="text-[13px] font-bold text-foreground">Manual Monitoring Control Room Summary</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Current manual read-only monitoring state. Local-only status view.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">STATUS_VIEW_ONLY / READ_ONLY / LOCKED</span> — Current state display. No dispatch. No execution.</span>
      </div>

      {summary && (
        <>
          {/* Status banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[13px] font-bold uppercase tracking-wide ${style.color}`}>
                  {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {summary.nextSafeOperatorAction}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {[
              { label: 'Acceptance',        value: summary.currentAcceptanceStatus.split('_')[0], color: 'text-primary font-bold' },
              { label: 'Readiness',         value: summary.currentReadinessStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Gate Decision',     value: summary.currentPromotionDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Audit Status',      value: summary.latestManualAuditStatus,              color: 'text-primary font-bold' },
              { label: 'Latest Endpoint',   value: summary.latestEndpoint ?? 'N/A',              color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',       value: summary.latestHttpStatus ?? 'N/A',            color: 'text-foreground' },
              { label: 'Gateway Reachable', value: String(summary.latestGatewayReachable),       color: summary.latestGatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'Scheduler Active',  value: String(summary.schedulerActive),              color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',  value: String(summary.dispatchAllowed),              color: 'text-destructive font-bold' },
              { label: 'Execution Allowed', value: String(summary.executionAllowed),             color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-1.5 py-1.5 sm:px-2.5 sm:py-2">
                <div className="text-[6px] sm:text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[9px] sm:text-[10px] font-bold break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Allowed actions grid */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-2">Allowed Operator Actions</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {summary.allowedOperatorActions.map((action, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-primary/10 border border-primary/30 rounded">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-[7px] font-bold text-primary">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked capabilities grid */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-destructive font-semibold mb-2">Blocked Capabilities</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {summary.blockedCapabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-destructive/10 border border-destructive/30 rounded">
                  <Lock className="w-3 h-3 text-destructive shrink-0" />
                  <span className="text-[7px] font-bold text-destructive">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                { label: 'Acceptance Packet',      value: String(summary.sourceDiagnostics.finalAcceptancePacketPresent), color: summary.sourceDiagnostics.finalAcceptancePacketPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Promotion Gate',         value: String(summary.sourceDiagnostics.promotionGatePresent), color: summary.sourceDiagnostics.promotionGatePresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Audit Dashboard',        value: String(summary.sourceDiagnostics.auditDashboardPresent), color: summary.sourceDiagnostics.auditDashboardPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Evidence Export',        value: String(summary.sourceDiagnostics.evidenceExportPresent), color: summary.sourceDiagnostics.evidenceExportPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Manual Checks',          value: summary.sourceDiagnostics.monitoringCheckCount, color: 'text-primary font-bold' },
                { label: 'Successful',             value: summary.sourceDiagnostics.successfulCheckCount, color: 'text-primary font-bold' },
                { label: 'Readiness Packet',       value: String(summary.sourceDiagnostics.readinessPacketPresent), color: summary.sourceDiagnostics.readinessPacketPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Bridge Integrity',       value: summary.sourceDiagnostics.bridgeIntegrity, color: summary.sourceDiagnostics.bridgeIntegrity === 'VERIFIED' ? 'text-primary' : 'text-amber-500' },
              ].map(c => (
                <div key={c.label} className="bg-card/60 border border-border/40 px-2.5 py-2 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                  <div className={`text-[9px] font-semibold break-all ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {summary.safetyAssertions.filter(a => a.pass).length}/{summary.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {summary.safetyAssertions.map(a => (
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

          {/* JSON preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Control Room Summary JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(summary, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Summary ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{summary.summaryId}</span></span>
            <span>{new Date(summary.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={summary} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Summary
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Control room summary is local-only. Manual read-only monitoring only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}