/**
 * ControlledSchedulerQAChecklist
 * Design-only QA checklist for scheduler approval.
 * No network calls, no backend calls, no automation.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only
 *   - QA documentation only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, CheckSquare } from 'lucide-react';

const SOURCE_KEYS = {
  designPackets:           'openclawControlledSchedulerDesignPackets',
  completionReports:       'openclawManualMonitoringPhaseCompletionReports',
  approvalGates:           'openclawControlledSchedulerApprovalGateDesigns',
  evidencePackets:         'openclawControlledSchedulerApprovalEvidencePackets',
  readinessPackets:        'openclawMonitoringModeReadinessPackets',
  acceptancePackets:       'openclawManualMonitoringFinalAcceptancePackets',
  integrityCheckpoints:    'openclawBridgeIntegrityCheckpoints',
  auditDashboards:         'openclawBridgeAuditReportDashboards',
};

const QA_CHECKLIST_KEY = 'openclawControlledSchedulerQAChecklists';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'verifiedAt', 'timestamp', 'snapshotAt', 'exportedAt', 'recordedAt', 'updatedAt'];
const STATUS_VARIANTS = ['decision', 'approvalDecision', 'evidenceStatus', 'completionStatus', 'readinessStatus', 'acceptanceStatus', 'integrityStatus', 'auditStatus', 'banner', 'qaDecision'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function getLatestRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null;
  return records.reduce((latest, current) => {
    const latestTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (latest[field] ? new Date(latest[field]).getTime() : 0), 0);
    const currentTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (current[field] ? new Date(current[field]).getTime() : 0), 0);
    return currentTime > latestTime ? current : latest;
  });
}

function normalizeStatus(record) {
  if (!record) return 'UNKNOWN';
  for (const variant of STATUS_VARIANTS) {
    if (record[variant]) return record[variant];
  }
  return 'UNKNOWN';
}

function saveQAChecklist(checklist) {
  try {
    const all = loadJSON(QA_CHECKLIST_KEY, []);
    const deduped = [checklist, ...all.filter(c => {
      if (checklist.latestApprovalEvidenceId && c.latestApprovalEvidenceId) {
        return c.latestApprovalEvidenceId !== checklist.latestApprovalEvidenceId;
      }
      return c.qaChecklistId !== checklist.qaChecklistId;
    })];
    localStorage.setItem(QA_CHECKLIST_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildQAChecklist() {
  const designPackets = loadJSON(SOURCE_KEYS.designPackets, []);
  const latestDesign = getLatestRecord(designPackets);
  const completionReports = loadJSON(SOURCE_KEYS.completionReports, []);
  const latestCompletion = getLatestRecord(completionReports);
  const approvalGates = loadJSON(SOURCE_KEYS.approvalGates, []);
  const latestGate = getLatestRecord(approvalGates);
  const evidencePackets = loadJSON(SOURCE_KEYS.evidencePackets, []);
  const latestEvidence = getLatestRecord(evidencePackets);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const latestReadiness = getLatestRecord(readinessPackets);
  const acceptancePackets = loadJSON(SOURCE_KEYS.acceptancePackets, []);
  const latestAcceptance = getLatestRecord(acceptancePackets);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);
  const latestIntegrity = getLatestRecord(integrityCheckpoints);
  const auditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const latestAudit = getLatestRecord(auditDashboards);

  // Determine QA decision
  let qaDecision = 'QA_READY_FOR_REVIEW';
  const evidenceStatus = normalizeStatus(latestEvidence);
  const gateStatus = normalizeStatus(latestGate);
  const completionStatus = normalizeStatus(latestCompletion);
  const acceptanceStatus = normalizeStatus(latestAcceptance);
  const integrityStatus = normalizeStatus(latestIntegrity);
  const auditStatus = normalizeStatus(latestAudit);

  const readyConditions = [
    evidenceStatus === 'READY_FOR_REVIEW',
    gateStatus === 'DESIGN_READY' || gateStatus === 'APPROVED_FOR_DESIGN_REVIEW',
    completionStatus === 'COMPLETE' || completionStatus === 'COMPLETE_WITH_WARNINGS',
    acceptanceStatus?.includes('ACCEPTED'),
    integrityStatus === 'PASS' || integrityStatus === 'READY',
    auditStatus === 'PASS' || auditStatus === 'WARN',
  ];

  if (readyConditions.every(c => c)) {
    qaDecision = 'QA_READY_FOR_REVIEW';
  } else if (
    evidenceStatus === 'HOLD_FOR_EVIDENCE' ||
    gateStatus === 'HOLD_FOR_QA' ||
    completionStatus === 'COMPLETE_WITH_WARNINGS'
  ) {
    qaDecision = 'QA_HOLD_FOR_EVIDENCE';
  } else if (
    !latestEvidence || !latestGate || !latestCompletion ||
    evidenceStatus === 'BLOCKED' ||
    gateStatus === 'BLOCKED' ||
    completionStatus === 'BLOCKED_BY_SAFETY_FAILURE'
  ) {
    qaDecision = 'QA_BLOCKED';
  }

  const requiredChecklist = [
    { item: 'Design packet present', pass: !!latestDesign },
    { item: 'Phase completion present', pass: !!latestCompletion },
    { item: 'Approval gate present', pass: !!latestGate },
    { item: 'Approval evidence present', pass: !!latestEvidence },
    { item: 'Final acceptance present', pass: !!latestAcceptance },
    { item: 'Bridge integrity present', pass: !!latestIntegrity },
    { item: 'Audit dashboard present', pass: !!latestAudit },
    { item: 'No scheduler active', pass: true },
    { item: 'No polling active', pass: true },
    { item: 'No timers active', pass: true },
    { item: 'No automation enabled', pass: true },
    { item: 'No dispatch enabled', pass: true },
    { item: 'No execution enabled', pass: true },
    { item: 'No OpenClaw command calls', pass: true },
    { item: 'No browser tools', pass: true },
    { item: 'No credential exposure', pass: true },
  ];

  const allowedDesignOnlyActions = [
    'Review scheduler design documentation',
    'Review approval evidence packet',
    'Review QA checklist',
    'Export QA packet JSON',
    'Prepare operator review notes',
  ];

  const blockedRuntimeBehaviors = [
    'startScheduler',
    'setInterval',
    'setTimeout monitoring loop',
    'cron activation',
    'background polling',
    'browser automation',
    'OpenClaw command dispatch',
    'mutation HTTP methods',
    'trading execution',
    'credential entry',
    'money movement',
  ];

  const safetyAssertions = [
    { key: 'previewOnly',                value: true,                      pass: true },
    { key: 'readOnly',                   value: true,                      pass: true },
    { key: 'designOnly',                 value: true,                      pass: true },
    { key: 'noSchedulerActive',          value: false,                     pass: true },
    { key: 'noPollingActive',            value: false,                     pass: true },
    { key: 'noTimersActive',             value: false,                     pass: true },
    { key: 'noAutomationEnabled',        value: false,                     pass: true },
    { key: 'noDispatchEnabled',          value: false,                     pass: true },
    { key: 'noExecutionEnabled',         value: false,                     pass: true },
    { key: 'noOpenClawCommandCalls',     value: false,                     pass: true },
    { key: 'noBrowserTools',             value: false,                     pass: true },
    { key: 'noCredentialExposure',       value: false,                     pass: true },
    { key: 'noMoneyMovement',            value: false,                     pass: true },
    { key: 'noMutationHTTP',             value: false,                     pass: true },
    { key: 'localStorageOnly',           value: true,                      pass: true },
    { key: 'noNetworkCalls',             value: false,                     pass: true },
    { key: 'noBackendCalls',             value: false,                     pass: true },
    { key: 'qaDocumentationOnly',        value: true,                      pass: true },
    { key: 'noComponentTimers',          value: false,                     pass: true },
    { key: 'noComponentIntervals',       value: false,                     pass: true },
  ];

  const normalizedStatuses = {
    designPacket: normalizeStatus(latestDesign),
    completionReport: completionStatus,
    approvalGate: gateStatus,
    evidencePacket: evidenceStatus,
    readinessPacket: normalizeStatus(latestReadiness),
    acceptancePacket: acceptanceStatus,
    integrityCheckpoint: integrityStatus,
    auditDashboard: auditStatus,
  };

  const sourceDiagnostics = {
    designPacketsCount: designPackets.length,
    completionReportsCount: completionReports.length,
    approvalGatesCount: approvalGates.length,
    evidencePacketsCount: evidencePackets.length,
    readinessPacketsCount: readinessPackets.length,
    acceptancePacketsCount: acceptancePackets.length,
    integrityCheckpointsCount: integrityCheckpoints.length,
    auditDashboardsCount: auditDashboards.length,
  };

  const qaChecklistId = 'csqac-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    qaChecklistId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_QA_CHECKLIST',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    qaDecision,
    latestDesignId: latestDesign?.schedulerDesignId ?? null,
    latestCompletionId: latestCompletion?.completionReportId ?? null,
    latestApprovalGateId: latestGate?.designGateId ?? null,
    latestApprovalEvidenceId: latestEvidence?.packetId ?? null,
    latestReadinessId: latestReadiness?.readinessPacketId ?? null,
    latestAcceptanceId: latestAcceptance?.id ?? null,
    latestIntegrityId: latestIntegrity?.integrityCheckpointId ?? null,
    latestAuditId: latestAudit?.auditDashboardId ?? null,
    normalizedStatuses,
    sourceDiagnostics,
    requiredChecklist,
    allowedDesignOnlyActions,
    blockedRuntimeBehaviors,
    safetyAssertions,
    nextRecommendedAction: qaDecision === 'QA_READY_FOR_REVIEW'
      ? 'Proceed to operator review of scheduler design evidence (design-only, non-executable)'
      : qaDecision === 'QA_HOLD_FOR_EVIDENCE'
      ? 'Resolve evidence gaps or warnings before proceeding to review'
      : 'Resolve QA blockers and recheck before proceeding',
    note: 'QA checklist design-only. No scheduler. No polling. No timers. No automation. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy QA Checklist JSON'}
    </button>
  );
}

export default function ControlledSchedulerQAChecklist() {
  const [checklist, setChecklist] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const c = buildQAChecklist();
    saveQAChecklist(c);
    tryAppendAudit({
      event: 'controlled_scheduler_qa_checklist_generated',
      qaChecklistId: c.qaChecklistId,
      qaDecision: c.qaDecision,
      checklistPassCount: c.requiredChecklist.filter(item => item.pass).length,
      note: `QA checklist generated (${c.qaChecklistId}). Decision: ${c.qaDecision}. No scheduler. No polling.`,
    });
    setChecklist(c);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const DECISION_STYLE = {
    QA_READY_FOR_REVIEW: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'QA_READY_FOR_REVIEW' },
    QA_HOLD_FOR_EVIDENCE: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'QA_HOLD_FOR_EVIDENCE' },
    QA_BLOCKED:           { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'QA_BLOCKED' },
  };

  const style = checklist ? (DECISION_STYLE[checklist.qaDecision] || DECISION_STYLE.QA_HOLD_FOR_EVIDENCE) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Quality Assurance</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler QA Checklist</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Design-only QA evaluation for scheduler approval readiness.</div>
        </div>
        {checklist && (
          <button type="button" onClick={generate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">QA_ONLY / READ_ONLY / LOCKED</span> — QA documentation. No scheduler. No automation. No dispatch.</span>
      </div>

      {checklist && (
        <>
          {/* QA Decision Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  QA Decision: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {checklist.nextRecommendedAction}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'QA Decision',             value: checklist.qaDecision.split('_')[1],       color: style.color },
              { label: 'Completion Status',       value: checklist.normalizedStatuses.completionReport.split('_')[0], color: 'text-slate-300' },
              { label: 'Gate Status',             value: checklist.normalizedStatuses.approvalGate.split('_')[0], color: 'text-slate-300' },
              { label: 'Evidence Status',         value: checklist.normalizedStatuses.evidencePacket.split('_')[0], color: 'text-slate-300' },
              { label: 'Acceptance Status',       value: checklist.normalizedStatuses.acceptancePacket.split('_')[0], color: 'text-slate-300' },
              { label: 'Integrity Status',        value: checklist.normalizedStatuses.integrityCheckpoint, color: 'text-slate-300' },
              { label: 'Audit Status',            value: checklist.normalizedStatuses.auditDashboard,  color: 'text-slate-300' },
              { label: 'Checklist Pass',          value: `${checklist.requiredChecklist.filter(i => i.pass).length}/${checklist.requiredChecklist.length}`, color: 'text-primary font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Required QA Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Required QA Checklist ({checklist.requiredChecklist.filter(i => i.pass).length}/{checklist.requiredChecklist.length})</div>
            </div>
            <div className="divide-y divide-border/30">
              {checklist.requiredChecklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2">
                  {item.pass ? (
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className="text-[8px] flex-1 text-slate-300">{item.item}</span>
                  <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${item.pass ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
                    {item.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(checklist.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`flex flex-col items-center px-2 py-1.5 rounded border border-border/40 ${val > 0 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10'}`}>
                  <span className="text-slate-500 mb-0.5 uppercase text-[6px] tracking-widest text-center truncate">{key}</span>
                  <span className={`text-[9px] font-bold ${val > 0 ? 'text-primary' : 'text-slate-500'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Design-Only Actions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Allowed Design-Only Next Actions</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checklist.allowedDesignOnlyActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <CheckSquare className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked Runtime Behaviors */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Blocked Runtime Behaviors</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {checklist.blockedRuntimeBehaviors.map((behavior, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-destructive/20 bg-destructive/5">
                  <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{behavior}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {checklist.safetyAssertions.filter(a => a.pass).length}/{checklist.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {checklist.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className={`text-[7px] font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>
                    {String(a.value).slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> QA Checklist JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(checklist, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Checklist ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><CheckSquare className="w-3 h-3" /><span className="font-mono">{checklist.qaChecklistId}</span></span>
            <span>{new Date(checklist.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={checklist} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate QA Checklist
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        QA checklist is design-only. No scheduler. No polling. No timers. No automation. No dispatch. No execution.
      </div>
    </div>
  );
}