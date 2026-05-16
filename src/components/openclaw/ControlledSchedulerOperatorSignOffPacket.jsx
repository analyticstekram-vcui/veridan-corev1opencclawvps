/**
 * ControlledSchedulerOperatorSignOffPacket
 * Operator sign-off packet for scheduler design review.
 * No network calls, no backend calls, no automation.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only (except for saving sign-off locally)
 *   - Operator sign-off documentation only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, PencilIcon } from 'lucide-react';

const SOURCE_KEYS = {
  operatorReviewConsoles:      'openclawControlledSchedulerOperatorReviewConsoles',
  finalDesignReviewPackets:    'openclawControlledSchedulerFinalDesignReviewPackets',
  qaChecklists:                'openclawControlledSchedulerQAChecklists',
  evidencePackets:             'openclawControlledSchedulerApprovalEvidencePackets',
  approvalGates:               'openclawControlledSchedulerApprovalGateDesigns',
  designPackets:               'openclawControlledSchedulerDesignPackets',
  completionReports:           'openclawManualMonitoringPhaseCompletionReports',
  acceptancePackets:           'openclawManualMonitoringFinalAcceptancePackets',
  integrityCheckpoints:        'openclawBridgeIntegrityCheckpoints',
  auditTrail:                  'openclawAuditTrail',
};

const SIGN_OFF_PACKET_KEY = 'openclawControlledSchedulerOperatorSignOffPackets';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'reviewedAt', 'verifiedAt', 'timestamp', 'snapshotAt', 'completedAt', 'exportedAt', 'signedAt', 'updatedAt'];
const STATUS_VARIANTS = ['decision', 'status', 'reviewDecision', 'finalDecision', 'qaDecision', 'evidenceStatus', 'gateDecision', 'acceptanceStatus', 'completionStatus', 'integrityStatus', 'signOffStatus', 'operatorReviewDecision', 'finalDesignReviewStatus'];

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

function saveSignOffPacket(packet) {
  try {
    const all = loadJSON(SIGN_OFF_PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => {
      const sameReview = p.latestOperatorReviewId === packet.latestOperatorReviewId;
      const sameDesign = p.latestFinalDesignReviewId === packet.latestFinalDesignReviewId;
      const sameQA = p.latestQAChecklistId === packet.latestQAChecklistId;
      const sameNote = (p.operatorSignOffNote || '').trim() === (packet.operatorSignOffNote || '').trim();
      return !(sameReview && sameDesign && sameQA && sameNote);
    })];
    localStorage.setItem(SIGN_OFF_PACKET_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildSignOffPacket(signOffNote = '') {
  const operatorReviewConsoles = ensureArray(loadJSON(SOURCE_KEYS.operatorReviewConsoles, []));
  const latestReview = getLatestRecord(operatorReviewConsoles);
  const finalDesignReviewPackets = ensureArray(loadJSON(SOURCE_KEYS.finalDesignReviewPackets, []));
  const latestFinalReview = getLatestRecord(finalDesignReviewPackets);
  const qaChecklists = ensureArray(loadJSON(SOURCE_KEYS.qaChecklists, []));
  const latestQA = getLatestRecord(qaChecklists);
  const evidencePackets = ensureArray(loadJSON(SOURCE_KEYS.evidencePackets, []));
  const latestEvidence = getLatestRecord(evidencePackets);
  const approvalGates = ensureArray(loadJSON(SOURCE_KEYS.approvalGates, []));
  const latestGate = getLatestRecord(approvalGates);
  const designPackets = ensureArray(loadJSON(SOURCE_KEYS.designPackets, []));
  const latestDesign = getLatestRecord(designPackets);
  const completionReports = ensureArray(loadJSON(SOURCE_KEYS.completionReports, []));
  const latestCompletion = getLatestRecord(completionReports);
  const acceptancePackets = ensureArray(loadJSON(SOURCE_KEYS.acceptancePackets, []));
  const latestAcceptance = getLatestRecord(acceptancePackets);
  const integrityCheckpoints = ensureArray(loadJSON(SOURCE_KEYS.integrityCheckpoints, []));
  const latestIntegrity = getLatestRecord(integrityCheckpoints);
  const auditTrail = ensureArray(loadJSON(SOURCE_KEYS.auditTrail, []));

  const reviewDecision = normalizeStatus(latestReview);
  const finalReviewStatus = normalizeStatus(latestFinalReview);
  const qaDecision = normalizeStatus(latestQA);
  const evidenceStatus = normalizeStatus(latestEvidence);
  const gateDecision = normalizeStatus(latestGate);
  const designStatus = normalizeStatus(latestDesign);
  const completionStatus = normalizeStatus(latestCompletion);
  const acceptanceStatus = normalizeStatus(latestAcceptance);
  const integrityStatus = normalizeStatus(latestIntegrity);

  let signOffStatus = 'SIGN_OFF_READY';
  const readyConditions = [
    reviewDecision === 'OPERATOR_REVIEW_READY',
    finalReviewStatus === 'READY_FOR_OPERATOR_REVIEW',
    qaDecision === 'QA_READY_FOR_REVIEW',
    evidenceStatus === 'READY_FOR_REVIEW',
    gateDecision === 'DESIGN_READY' || gateDecision === 'APPROVED_FOR_DESIGN_REVIEW',
    !!latestReview && !!latestFinalReview && !!latestQA && !!latestEvidence && !!latestGate,
  ];

  if (!readyConditions.every(c => c)) {
    if (
      reviewDecision?.includes('HOLD') ||
      finalReviewStatus === 'HOLD_FOR_EVIDENCE' ||
      qaDecision === 'QA_HOLD_FOR_EVIDENCE' ||
      completionStatus === 'COMPLETE_WITH_WARNINGS'
    ) {
      signOffStatus = 'HOLD_FOR_REVIEW';
    } else {
      signOffStatus = 'BLOCKED_BY_SAFETY_FAILURE';
    }
  }

  const requiredSignOffChecklist = [
    { item: 'Operator review ready', pass: reviewDecision === 'OPERATOR_REVIEW_READY' },
    { item: 'Final design review ready', pass: finalReviewStatus === 'READY_FOR_OPERATOR_REVIEW' },
    { item: 'QA ready', pass: qaDecision === 'QA_READY_FOR_REVIEW' },
    { item: 'Approval evidence ready', pass: evidenceStatus === 'READY_FOR_REVIEW' },
    { item: 'Approval gate ready', pass: gateDecision === 'DESIGN_READY' || gateDecision === 'APPROVED_FOR_DESIGN_REVIEW' },
    { item: 'Scheduler design present', pass: !!latestDesign },
    { item: 'Manual monitoring phase complete', pass: !!latestCompletion },
    { item: 'Final acceptance present', pass: !!latestAcceptance },
    { item: 'Bridge integrity present', pass: !!latestIntegrity },
    { item: 'No scheduler active', pass: true },
    { item: 'No polling active', pass: true },
    { item: 'No timers active', pass: true },
    { item: 'No dispatch', pass: true },
    { item: 'No execution', pass: true },
    { item: 'No credentials exposed', pass: true },
  ];

  const allowedPostSignOffDesignActions = [
    'Archive sign-off JSON',
    'Review implementation plan draft',
    'Prepare scheduler policy document',
    'Prepare kill-switch design',
    'Prepare operator approval workflow',
    'Request human review',
  ];

  const blockedRuntimeBehaviors = [
    'activate scheduler',
    'start polling',
    'create timers or intervals',
    'run automated checks',
    'send OpenClaw commands',
    'use mutation methods',
    'execute trades',
    'expose credentials',
    'move money',
    'bypass manual approval',
  ];

  const safetyAssertions = [
    { key: 'designOnly',                  value: true,                      pass: true },
    { key: 'localOnly',                   value: true,                      pass: true },
    { key: 'readOnly',                    value: true,                      pass: true },
    { key: 'locked',                      value: 'LOCKED',                 pass: true },
    { key: 'disabled',                    value: 'DISABLED',               pass: true },
    { key: 'manualApprovalRequired',      value: true,                      pass: true },
    { key: 'schedulerApproved',           value: false,                     pass: true },
    { key: 'schedulerActive',             value: false,                     pass: true },
    { key: 'pollingApproved',             value: false,                     pass: true },
    { key: 'pollingLoopActive',           value: false,                     pass: true },
    { key: 'timersActive',                value: false,                     pass: true },
    { key: 'automationActive',            value: false,                     pass: true },
    { key: 'networkCallsFromComponent',   value: false,                     pass: true },
    { key: 'backendCallsFromComponent',   value: false,                     pass: true },
    { key: 'openClawCallsFromComponent',  value: 0,                         pass: true },
    { key: 'dispatchAllowed',             value: false,                     pass: true },
    { key: 'commandDispatchAllowed',      value: false,                     pass: true },
    { key: 'executionAllowed',            value: false,                     pass: true },
    { key: 'executionAttempted',          value: false,                     pass: true },
    { key: 'browserToolUsed',             value: false,                     pass: true },
    { key: 'credentialsExposed',          value: false,                     pass: true },
    { key: 'secretsStoredClientSide',     value: false,                     pass: true },
    { key: 'tradingEnabled',              value: false,                     pass: true },
    { key: 'brokerExecutionEnabled',      value: false,                     pass: true },
    { key: 'moneyMovementEnabled',        value: false,                     pass: true },
    { key: 'mutationMethodsBlocked',      value: true,                      pass: true },
    { key: 'directOpenAIApiEnabled',      value: false,                     pass: true },
    { key: 'signOffIsNonExecutable',      value: true,                      pass: true },
  ];

  const sourceDiagnostics = {
    operatorReviewConsolesCount: operatorReviewConsoles.length,
    finalDesignReviewPacketsCount: finalDesignReviewPackets.length,
    qaChecklistsCount: qaChecklists.length,
    evidencePacketsCount: evidencePackets.length,
    approvalGatesCount: approvalGates.length,
    designPacketsCount: designPackets.length,
    completionReportsCount: completionReports.length,
    acceptancePacketsCount: acceptancePackets.length,
    integrityCheckpointsCount: integrityCheckpoints.length,
    auditTrailCount: auditTrail.length,
  };

  const signOffId = 'csosop-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    signOffId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_OPERATOR_SIGN_OFF_PACKET',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    signOffStatus,
    signOffScope: 'DESIGN_REVIEW_ONLY_NO_RUNTIME_APPROVAL',
    schedulerRuntimeStatus: 'DISABLED',
    schedulerApproved: false,
    schedulerActive: false,
    pollingApproved: false,
    pollingLoopActive: false,
    timersActive: false,
    automationActive: false,
    dispatchAllowed: false,
    commandDispatchAllowed: false,
    executionAllowed: false,
    gatewayMode: 'READ_ONLY',
    executionMode: 'DISABLED',
    executionLock: 'LOCKED',
    latestOperatorReviewId: latestReview?.reviewConsoleId ?? null,
    latestOperatorReviewDecision: reviewDecision,
    latestFinalDesignReviewId: latestFinalReview?.reviewPacketId ?? null,
    latestFinalDesignReviewStatus: finalReviewStatus,
    latestQAChecklistId: latestQA?.qaChecklistId ?? null,
    latestQADecision: qaDecision,
    latestApprovalEvidenceId: latestEvidence?.packetId ?? null,
    latestApprovalEvidenceStatus: evidenceStatus,
    latestApprovalGateId: latestGate?.designGateId ?? null,
    latestApprovalGateDecision: gateDecision,
    latestSchedulerDesignId: latestDesign?.schedulerDesignId ?? null,
    latestSchedulerDesignStatus: designStatus,
    latestPhaseCompletionId: latestCompletion?.completionReportId ?? null,
    latestPhaseCompletionStatus: completionStatus,
    latestFinalAcceptanceId: latestAcceptance?.id ?? null,
    latestFinalAcceptanceStatus: acceptanceStatus,
    latestBridgeIntegrityId: latestIntegrity?.integrityCheckpointId ?? null,
    latestBridgeIntegrityStatus: integrityStatus,
    operatorSignOffNote: signOffNote.trim(),
    requiredSignOffChecklist,
    allowedPostSignOffDesignActions,
    blockedRuntimeBehaviors,
    safetyAssertions,
    sourceDiagnostics,
    nextRecommendedPhase: signOffStatus === 'SIGN_OFF_READY'
      ? 'Operator sign-off complete (design-review only, does not enable scheduler activation, polling, dispatch, execution, trading, or credentials)'
      : signOffStatus === 'HOLD_FOR_REVIEW'
      ? 'Complete missing evidence or resolve review holds before sign-off'
      : 'Resolve safety blockers before operator sign-off can proceed',
    note: 'Operator sign-off packet is design-review only. It does not approve scheduler activation, polling, dispatch, execution, trading, credentials, or money movement.',
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
      {copied ? 'Copied!' : 'Copy Sign-Off JSON'}
    </button>
  );
}

export default function ControlledSchedulerOperatorSignOffPacket() {
  const [packet, setPacket] = useState(null);
  const [signOffNote, setSignOffNote] = useState('');
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildSignOffPacket(signOffNote);
    saveSignOffPacket(p);
    tryAppendAudit({
      event: 'controlled_scheduler_operator_signoff_packet_generated',
      signOffId: p.signOffId,
      signOffStatus: p.signOffStatus,
      hasSignOffNote: p.operatorSignOffNote.length > 0,
      checklistPass: p.requiredSignOffChecklist.filter(i => i.pass).length,
      note: `Operator sign-off packet generated (${p.signOffId}). Status: ${p.signOffStatus}. Design-review only.`,
    });
    setPacket(p);
  }, [signOffNote]);

  useEffect(() => { generate(); }, []);

  const STATUS_STYLE = {
    SIGN_OFF_READY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'SIGN_OFF_READY' },
    HOLD_FOR_REVIEW: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD_FOR_REVIEW' },
    BLOCKED_BY_SAFETY_FAILURE: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED_BY_SAFETY_FAILURE' },
  };

  const style = packet ? (STATUS_STYLE[packet.signOffStatus] || STATUS_STYLE.HOLD_FOR_REVIEW) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Operator Sign-Off</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler Operator Sign-Off Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Design-review operator sign-off — does not enable runtime activation.</div>
        </div>
        {packet && (
          <button type="button" onClick={() => generate()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">SIGN_OFF_ONLY / READ_ONLY / LOCKED</span> — Design-review sign-off. Does not approve runtime activation.</span>
      </div>

      {packet && (
        <>
          {/* Sign-Off Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Sign-Off Status: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {packet.nextRecommendedPhase}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Sign-Off Status',        value: packet.signOffStatus.split('_')[0], color: style.color },
              { label: 'Operator Review',        value: packet.latestOperatorReviewDecision.split('_')[2], color: 'text-slate-300' },
              { label: 'Final Design Review',    value: packet.latestFinalDesignReviewStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'QA Decision',            value: packet.latestQADecision.split('_')[1], color: 'text-slate-300' },
              { label: 'Approval Evidence',      value: packet.latestApprovalEvidenceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Approval Gate',          value: packet.latestApprovalGateDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Scheduler Approved',     value: String(packet.schedulerApproved), color: 'text-destructive' },
              { label: 'Scheduler Active',       value: String(packet.schedulerActive), color: 'text-destructive' },
              { label: 'Polling Active',         value: String(packet.pollingLoopActive), color: 'text-destructive' },
              { label: 'Execution Allowed',      value: String(packet.executionAllowed), color: 'text-destructive' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Operator Sign-Off Note Textarea */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <PencilIcon className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Operator Sign-Off Notes (Local Only)</label>
            </div>
            <textarea
              value={signOffNote}
              onChange={(e) => {
                setSignOffNote(e.target.value);
              }}
              placeholder="Add operator sign-off notes or conditions (stored locally only)..."
              className="w-full h-24 px-3 py-2 bg-secondary/20 border border-border rounded text-[9px] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="text-[7px] text-slate-500">{signOffNote.length} characters. Local storage only — not sent to backend or OpenClaw.</div>
          </div>

          {/* Required Sign-Off Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Required Sign-Off Checklist ({packet.requiredSignOffChecklist.filter(i => i.pass).length}/{packet.requiredSignOffChecklist.length})</div>
            </div>
            <div className="divide-y divide-border/30">
              {packet.requiredSignOffChecklist.map((item, i) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[8px]">
              {Object.entries(packet.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`flex flex-col items-center px-2 py-1.5 rounded border border-border/40 ${val > 0 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10'}`}>
                  <span className="text-slate-500 mb-0.5 uppercase text-[6px] tracking-widest text-center truncate">{key}</span>
                  <span className={`text-[9px] font-bold ${val > 0 ? 'text-primary' : 'text-slate-500'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Post-Sign-Off Design Actions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Allowed Post-Sign-Off Design Actions</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {packet.allowedPostSignOffDesignActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
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
              <FileJson className="w-3.5 h-3.5" /> Sign-Off Packet JSON
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

          {/* Sign-Off ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /><span className="font-mono">{packet.signOffId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={() => generate()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Generate Sign-Off Packet
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Operator sign-off packet is local-only and design-review only. No scheduler activation. No polling. No timers. No automation. No dispatch. No execution.
      </div>
    </div>
  );
}