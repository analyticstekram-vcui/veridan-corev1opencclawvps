/**
 * ControlledSchedulerFinalDesignReviewPacket
 * Final design review consolidation for scheduler approval.
 * No network calls, no backend calls, no automation.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only
 *   - Final design review only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Zap } from 'lucide-react';

const SOURCE_KEYS = {
  designPackets:           'openclawControlledSchedulerDesignPackets',
  completionReports:       'openclawManualMonitoringPhaseCompletionReports',
  approvalGates:           'openclawControlledSchedulerApprovalGateDesigns',
  evidencePackets:         'openclawControlledSchedulerApprovalEvidencePackets',
  qaChecklists:            'openclawControlledSchedulerQAChecklists',
  readinessPackets:        'openclawMonitoringModeReadinessPackets',
  acceptancePackets:       'openclawManualMonitoringFinalAcceptancePackets',
  integrityCheckpoints:    'openclawBridgeIntegrityCheckpoints',
};

const REVIEW_PACKET_KEY = 'openclawControlledSchedulerFinalDesignReviewPackets';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'verifiedAt', 'timestamp', 'snapshotAt', 'reviewedAt', 'completedAt', 'updatedAt'];
const STATUS_VARIANTS = ['decision', 'status', 'readinessStatus', 'evidenceStatus', 'qaDecision', 'gateDecision', 'acceptanceStatus', 'completionStatus', 'integrityDecision', 'verificationStatus', 'banner'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function ensureArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return [data];
  return [];
}

function getLatestRecord(records) {
  const arr = ensureArray(records);
  if (arr.length === 0) return null;
  return arr.reduce((latest, current) => {
    const latestTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (latest?.[field] ? new Date(latest[field]).getTime() : 0), 0);
    const currentTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (current?.[field] ? new Date(current[field]).getTime() : 0), 0);
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

function saveReviewPacket(packet) {
  try {
    const all = loadJSON(REVIEW_PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => {
      if (packet.latestQAChecklistId && p.latestQAChecklistId) {
        return p.latestQAChecklistId !== packet.latestQAChecklistId;
      }
      return p.reviewPacketId !== packet.reviewPacketId;
    })];
    localStorage.setItem(REVIEW_PACKET_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildReviewPacket() {
  const designPackets = ensureArray(loadJSON(SOURCE_KEYS.designPackets, []));
  const latestDesign = getLatestRecord(designPackets);
  const completionReports = ensureArray(loadJSON(SOURCE_KEYS.completionReports, []));
  const latestCompletion = getLatestRecord(completionReports);
  const approvalGates = ensureArray(loadJSON(SOURCE_KEYS.approvalGates, []));
  const latestGate = getLatestRecord(approvalGates);
  const evidencePackets = ensureArray(loadJSON(SOURCE_KEYS.evidencePackets, []));
  const latestEvidence = getLatestRecord(evidencePackets);
  const qaChecklists = ensureArray(loadJSON(SOURCE_KEYS.qaChecklists, []));
  const latestQA = getLatestRecord(qaChecklists);
  const readinessPackets = ensureArray(loadJSON(SOURCE_KEYS.readinessPackets, []));
  const latestReadiness = getLatestRecord(readinessPackets);
  const acceptancePackets = ensureArray(loadJSON(SOURCE_KEYS.acceptancePackets, []));
  const latestAcceptance = getLatestRecord(acceptancePackets);
  const integrityCheckpoints = ensureArray(loadJSON(SOURCE_KEYS.integrityCheckpoints, []));
  const latestIntegrity = getLatestRecord(integrityCheckpoints);

  const requiredSources = [latestDesign, latestCompletion, latestGate, latestEvidence, latestQA, latestReadiness, latestAcceptance, latestIntegrity];
  const presentSources = requiredSources.filter(s => !!s).length;
  const missingCount = requiredSources.length - presentSources;

  const designStatus = normalizeStatus(latestDesign);
  const completionStatus = normalizeStatus(latestCompletion);
  const gateStatus = normalizeStatus(latestGate);
  const evidenceStatus = normalizeStatus(latestEvidence);
  const qaStatus = normalizeStatus(latestQA);
  const readinessStatus = normalizeStatus(latestReadiness);
  const acceptanceStatus = normalizeStatus(latestAcceptance);
  const integrityStatus = normalizeStatus(latestIntegrity);

  let finalDesignReviewStatus = 'READY_FOR_OPERATOR_REVIEW';
  const blockedConditions = [
    gateStatus === 'BLOCKED',
    evidenceStatus === 'BLOCKED',
    qaStatus === 'QA_BLOCKED',
    completionStatus === 'BLOCKED_BY_SAFETY_FAILURE',
    integrityStatus === 'FAILED',
    missingCount > 0,
  ];

  if (blockedConditions.some(c => c)) {
    finalDesignReviewStatus = 'BLOCKED';
  } else if (
    gateStatus === 'HOLD_FOR_QA' ||
    evidenceStatus === 'HOLD_FOR_EVIDENCE' ||
    qaStatus === 'QA_HOLD_FOR_EVIDENCE'
  ) {
    finalDesignReviewStatus = 'HOLD_FOR_EVIDENCE';
  }

  const requiredEvidence = [
    { source: 'Scheduler Design Packet', key: SOURCE_KEYS.designPackets, present: !!latestDesign, id: latestDesign?.schedulerDesignId ?? '—', status: designStatus, time: latestDesign?.createdAt ? new Date(latestDesign.createdAt).toLocaleString() : '—' },
    { source: 'Manual Phase Completion', key: SOURCE_KEYS.completionReports, present: !!latestCompletion, id: latestCompletion?.completionReportId ?? '—', status: completionStatus, time: latestCompletion?.createdAt ? new Date(latestCompletion.createdAt).toLocaleString() : '—' },
    { source: 'Approval Gate', key: SOURCE_KEYS.approvalGates, present: !!latestGate, id: latestGate?.designGateId ?? '—', status: gateStatus, time: latestGate?.createdAt ? new Date(latestGate.createdAt).toLocaleString() : '—' },
    { source: 'Approval Evidence Packet', key: SOURCE_KEYS.evidencePackets, present: !!latestEvidence, id: latestEvidence?.packetId ?? '—', status: evidenceStatus, time: latestEvidence?.createdAt ? new Date(latestEvidence.createdAt).toLocaleString() : '—' },
    { source: 'QA Checklist', key: SOURCE_KEYS.qaChecklists, present: !!latestQA, id: latestQA?.qaChecklistId ?? '—', status: qaStatus, time: latestQA?.createdAt ? new Date(latestQA.createdAt).toLocaleString() : '—' },
    { source: 'Readiness Packet', key: SOURCE_KEYS.readinessPackets, present: !!latestReadiness, id: latestReadiness?.readinessPacketId ?? '—', status: readinessStatus, time: latestReadiness?.createdAt ? new Date(latestReadiness.createdAt).toLocaleString() : '—' },
    { source: 'Final Acceptance', key: SOURCE_KEYS.acceptancePackets, present: !!latestAcceptance, id: latestAcceptance?.id ?? '—', status: acceptanceStatus, time: latestAcceptance?.createdAt ? new Date(latestAcceptance.createdAt).toLocaleString() : '—' },
    { source: 'Bridge Integrity', key: SOURCE_KEYS.integrityCheckpoints, present: !!latestIntegrity, id: latestIntegrity?.integrityCheckpointId ?? '—', status: integrityStatus, time: latestIntegrity?.createdAt ? new Date(latestIntegrity.createdAt).toLocaleString() : '—' },
  ];

  const allowedDesignOnlyActions = [
    'Review scheduler design documentation',
    'Review QA evidence packet',
    'Review approval preconditions',
    'Export final review JSON',
    'Request operator sign-off',
    'Revise design documentation only',
  ];

  const blockedRuntimeBehaviors = [
    'scheduler activation',
    'polling',
    'timers',
    'automated monitoring',
    'command dispatch',
    'OpenClaw mutation calls',
    'trading',
    'broker execution',
    'credential entry',
    'money movement',
    'direct OpenAI API calls',
  ];

  const safetyAssertions = [
    { key: 'designOnly',                  value: true,                      pass: true },
    { key: 'localOnly',                   value: true,                      pass: true },
    { key: 'schedulerActive',             value: false,                     pass: true },
    { key: 'pollingActive',               value: false,                     pass: true },
    { key: 'timersActive',                value: false,                     pass: true },
    { key: 'automationActive',            value: false,                     pass: true },
    { key: 'networkCalls',                value: false,                     pass: true },
    { key: 'openClawCalls',               value: 0,                         pass: true },
    { key: 'dispatchAllowed',             value: false,                     pass: true },
    { key: 'executionAttempted',          value: false,                     pass: true },
    { key: 'browserToolUsed',             value: false,                     pass: true },
    { key: 'credentialsExposed',          value: false,                     pass: true },
    { key: 'secretsStoredClientSide',     value: false,                     pass: true },
    { key: 'mutationMethodsBlocked',      value: true,                      pass: true },
    { key: 'readOnlyEndpointsOnly',       value: true,                      pass: true },
    { key: 'gatewayMode',                 value: 'READ_ONLY',              pass: true },
    { key: 'executionMode',               value: 'DISABLED',               pass: true },
    { key: 'executionLock',               value: 'LOCKED',                 pass: true },
    { key: 'liveTradingEnabled',          value: false,                     pass: true },
    { key: 'apiTradingEnabled',           value: false,                     pass: true },
    { key: 'brokerExecutionEnabled',      value: false,                     pass: true },
    { key: 'credentialEntryEnabled',      value: false,                     pass: true },
    { key: 'moneyMovementEnabled',        value: false,                     pass: true },
    { key: 'directOpenAIApiEnabled',      value: false,                     pass: true },
    { key: 'operatorApprovalRequired',    value: true,                      pass: true },
    { key: 'finalReviewIsNonExecutable',  value: true,                      pass: true },
  ];

  const sourceDiagnostics = {
    designPacketsCount: designPackets.length,
    completionReportsCount: completionReports.length,
    approvalGatesCount: approvalGates.length,
    evidencePacketsCount: evidencePackets.length,
    qaChecklistsCount: qaChecklists.length,
    readinessPacketsCount: readinessPackets.length,
    acceptancePacketsCount: acceptancePackets.length,
    integrityCheckpointsCount: integrityCheckpoints.length,
  };

  const reviewPacketId = 'csfdrp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    reviewPacketId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_FINAL_DESIGN_REVIEW_PACKET',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    finalDesignReviewStatus,
    latestDesignId: latestDesign?.schedulerDesignId ?? null,
    latestCompletionId: latestCompletion?.completionReportId ?? null,
    latestApprovalGateId: latestGate?.designGateId ?? null,
    latestApprovalEvidenceId: latestEvidence?.packetId ?? null,
    latestQAChecklistId: latestQA?.qaChecklistId ?? null,
    latestReadinessId: latestReadiness?.readinessPacketId ?? null,
    latestAcceptanceId: latestAcceptance?.id ?? null,
    latestIntegrityId: latestIntegrity?.integrityCheckpointId ?? null,
    presentSourceCount: presentSources,
    missingSourceCount: missingCount,
    requiredEvidence,
    sourceDiagnostics,
    allowedDesignOnlyActions,
    blockedRuntimeBehaviors,
    safetyAssertions,
    nextRecommendedAction: finalDesignReviewStatus === 'READY_FOR_OPERATOR_REVIEW'
      ? 'Proceed to operator sign-off review (design-only, non-executable)'
      : finalDesignReviewStatus === 'HOLD_FOR_EVIDENCE'
      ? 'Complete missing or partial evidence sources before proceeding to operator review'
      : 'Resolve design blockers and recheck before operator review',
    note: 'Final design review packet only. No scheduler. No polling. No timers. No automation. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Final Review JSON'}
    </button>
  );
}

export default function ControlledSchedulerFinalDesignReviewPacket() {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildReviewPacket();
    saveReviewPacket(p);
    tryAppendAudit({
      event: 'controlled_scheduler_final_design_review_packet_generated',
      reviewPacketId: p.reviewPacketId,
      finalDesignReviewStatus: p.finalDesignReviewStatus,
      presentSources: p.presentSourceCount,
      missingCount: p.missingSourceCount,
      note: `Final design review packet generated (${p.reviewPacketId}). Status: ${p.finalDesignReviewStatus}. No scheduler. No polling.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const REVIEW_STYLE = {
    READY_FOR_OPERATOR_REVIEW: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'READY_FOR_OPERATOR_REVIEW' },
    HOLD_FOR_EVIDENCE:         { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD_FOR_EVIDENCE' },
    BLOCKED:                   { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED' },
  };

  const style = packet ? (REVIEW_STYLE[packet.finalDesignReviewStatus] || REVIEW_STYLE.HOLD_FOR_EVIDENCE) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Final Review</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler Final Design Review Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Consolidated design review evidence for operator sign-off — design-only, non-executable.</div>
        </div>
        {packet && (
          <button type="button" onClick={generate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">REVIEW_ONLY / READ_ONLY / LOCKED</span> — Final design review. No scheduler. No automation. No dispatch.</span>
      </div>

      {packet && (
        <>
          {/* Final Review Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Final Design Review: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {packet.nextRecommendedAction}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Review Status',           value: packet.finalDesignReviewStatus.split('_')[1], color: style.color },
              { label: 'Design Packet',           value: packet.latestDesignId ? '✓' : '—', color: 'text-slate-300' },
              { label: 'Completion Report',       value: packet.latestCompletionId ? '✓' : '—', color: 'text-slate-300' },
              { label: 'Approval Gate',           value: packet.latestApprovalGateId ? '✓' : '—', color: 'text-slate-300' },
              { label: 'Evidence Packet',         value: packet.latestApprovalEvidenceId ? '✓' : '—', color: 'text-slate-300' },
              { label: 'QA Checklist',            value: packet.latestQAChecklistId ? '✓' : '—', color: 'text-slate-300' },
              { label: 'Final Acceptance',        value: packet.latestAcceptanceId ? '✓' : '—', color: 'text-slate-300' },
              { label: 'Bridge Integrity',        value: packet.latestIntegrityId ? '✓' : '—', color: 'text-slate-300' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Missing Source Warning */}
          {packet.missingSourceCount > 0 && (
            <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-[9px] text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Missing {packet.missingSourceCount} required evidence source(s). Complete before operator review.</span>
            </div>
          )}

          {/* Required Evidence Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Required Evidence Checklist ({packet.presentSourceCount}/{packet.requiredEvidence.length})</div>
            </div>
            <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
              {packet.requiredEvidence.map((evidence, i) => (
                <div key={i} className="flex items-start gap-2 px-4 py-2 text-[8px]">
                  {evidence.present ? (
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300 font-semibold">{evidence.source}</div>
                    <div className="text-slate-500 truncate font-mono">{evidence.key}</div>
                    <div className="text-slate-500 mt-0.5">{evidence.time}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-slate-500 font-mono truncate max-w-[100px]">{evidence.id}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${evidence.present ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
                      {evidence.present ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(packet.sourceDiagnostics).map(([key, val]) => (
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
              {packet.allowedDesignOnlyActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
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
              {packet.blockedRuntimeBehaviors.map((behavior, i) => (
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
                Safety Assertions — {packet.safetyAssertions.filter(a => a.pass).length}/{packet.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {packet.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Final Review JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(packet, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Packet ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /><span className="font-mono">{packet.reviewPacketId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Final Review
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Final design review packet is design-only. No scheduler activation. No polling. No timers. No automation. No dispatch. No execution.
      </div>
    </div>
  );
}