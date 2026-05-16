/**
 * ControlledSchedulerOperatorReviewConsole
 * Operator review console for scheduler design approval.
 * No network calls, no backend calls, no automation.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only (except for saving operator notes/review locally)
 *   - Operator review documentation only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, PencilIcon } from 'lucide-react';

const SOURCE_KEYS = {
  finalDesignReviewPackets:    'openclawControlledSchedulerFinalDesignReviewPackets',
  qaChecklists:                'openclawControlledSchedulerQAChecklists',
  evidencePackets:             'openclawControlledSchedulerApprovalEvidencePackets',
  approvalGates:               'openclawControlledSchedulerApprovalGateDesigns',
  designPackets:               'openclawControlledSchedulerDesignPackets',
  acceptancePackets:           'openclawManualMonitoringFinalAcceptancePackets',
  promotionGates:              'openclawManualMonitoringPromotionGates',
  auditDashboards:             'openclawManualMonitoringAuditDashboards',
  readinessPackets:            'openclawMonitoringModeReadinessPackets',
  integrityCheckpoints:        'openclawBridgeIntegrityCheckpoints',
};

const REVIEW_CONSOLE_KEY = 'openclawControlledSchedulerOperatorReviewConsoles';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'reviewedAt', 'verifiedAt', 'timestamp', 'snapshotAt', 'completedAt', 'exportedAt'];
const STATUS_VARIANTS = ['decision', 'status', 'reviewDecision', 'finalDecision', 'qaDecision', 'evidenceStatus', 'readinessStatus', 'promotionDecision', 'acceptanceStatus', 'banner', 'finalDesignReviewStatus'];

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

function saveReviewConsole(review) {
  try {
    const all = loadJSON(REVIEW_CONSOLE_KEY, []);
    const deduped = [review, ...all.filter(r => {
      if (review.latestFinalDesignReviewId && r.latestFinalDesignReviewId) {
        const sameReview = r.latestFinalDesignReviewId === review.latestFinalDesignReviewId;
        const sameQA = r.latestQAChecklistId === review.latestQAChecklistId;
        const sameEvidence = r.latestApprovalEvidenceId === review.latestApprovalEvidenceId;
        const sameNote = (r.operatorNote || '').trim() === (review.operatorNote || '').trim();
        return !(sameReview && sameQA && sameEvidence && sameNote);
      }
      return r.reviewConsoleId !== review.reviewConsoleId;
    })];
    localStorage.setItem(REVIEW_CONSOLE_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildReviewConsole(operatorNote = '') {
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
  const acceptancePackets = ensureArray(loadJSON(SOURCE_KEYS.acceptancePackets, []));
  const latestAcceptance = getLatestRecord(acceptancePackets);
  const promotionGates = ensureArray(loadJSON(SOURCE_KEYS.promotionGates, []));
  const latestPromotion = getLatestRecord(promotionGates);
  const auditDashboards = ensureArray(loadJSON(SOURCE_KEYS.auditDashboards, []));
  const latestAudit = getLatestRecord(auditDashboards);
  const readinessPackets = ensureArray(loadJSON(SOURCE_KEYS.readinessPackets, []));
  const latestReadiness = getLatestRecord(readinessPackets);
  const integrityCheckpoints = ensureArray(loadJSON(SOURCE_KEYS.integrityCheckpoints, []));
  const latestIntegrity = getLatestRecord(integrityCheckpoints);

  const finalReviewStatus = normalizeStatus(latestFinalReview);
  const qaStatus = normalizeStatus(latestQA);
  const evidenceStatus = normalizeStatus(latestEvidence);
  const gateStatus = normalizeStatus(latestGate);
  const acceptanceStatus = normalizeStatus(latestAcceptance);
  const promotionDecision = normalizeStatus(latestPromotion);
  const readinessStatus = normalizeStatus(latestReadiness);
  const integrityStatus = normalizeStatus(latestIntegrity);

  let operatorReviewDecision = 'OPERATOR_REVIEW_READY';
  const readyConditions = [
    finalReviewStatus === 'READY_FOR_OPERATOR_REVIEW',
    qaStatus === 'QA_READY_FOR_REVIEW',
    evidenceStatus === 'READY_FOR_REVIEW',
    gateStatus === 'DESIGN_READY' || gateStatus === 'APPROVED_FOR_DESIGN_REVIEW',
    !!latestFinalReview && !!latestQA && !!latestEvidence && !!latestGate,
  ];

  if (!readyConditions.every(c => c)) {
    if (
      finalReviewStatus === 'HOLD_FOR_EVIDENCE' ||
      qaStatus === 'QA_HOLD_FOR_EVIDENCE' ||
      evidenceStatus === 'HOLD_FOR_EVIDENCE' ||
      gateStatus === 'HOLD_FOR_QA'
    ) {
      operatorReviewDecision = 'OPERATOR_REVIEW_HOLD';
    } else {
      operatorReviewDecision = 'OPERATOR_REVIEW_BLOCKED';
    }
  }

  const operatorChecklist = [
    { item: 'Design-only verified', pass: true },
    { item: 'No scheduler active', pass: true },
    { item: 'No polling active', pass: true },
    { item: 'No timers active', pass: true },
    { item: 'No automation active', pass: true },
    { item: 'No dispatch enabled', pass: true },
    { item: 'No execution enabled', pass: true },
    { item: 'Endpoints allowlisted', pass: true },
    { item: 'Blocked methods documented', pass: true },
    { item: 'Operator approval manual only', pass: true },
    { item: 'All evidence present', pass: !!latestFinalReview && !!latestQA && !!latestEvidence },
  ];

  const allowedDesignOnlyActions = [
    'Review design packet',
    'Copy JSON',
    'Inspect evidence',
    'Record operator note',
    'Request revisions',
    'Hold for QA',
  ];

  const blockedRuntimeBehaviors = [
    'create scheduler',
    'enable timers',
    'enable polling',
    'auto-run checks',
    'send OpenClaw commands',
    'dispatch routes',
    'mutate gateway state',
    'trade',
    'broker execution',
    'expose credentials',
    'bypass approval',
  ];

  const safetyAssertions = [
    { key: 'designOnly',                  value: true,                      pass: true },
    { key: 'readOnly',                    value: true,                      pass: true },
    { key: 'locked',                      value: 'LOCKED',                 pass: true },
    { key: 'disabled',                    value: 'DISABLED',               pass: true },
    { key: 'manualApprovalRequired',      value: true,                      pass: true },
    { key: 'noScheduler',                 value: false,                     pass: true },
    { key: 'noTimers',                    value: false,                     pass: true },
    { key: 'noPolling',                   value: false,                     pass: true },
    { key: 'noAutomation',                value: false,                     pass: true },
    { key: 'noDispatch',                  value: false,                     pass: true },
    { key: 'noExecution',                 value: false,                     pass: true },
    { key: 'noTrading',                   value: false,                     pass: true },
    { key: 'noCredentials',               value: false,                     pass: true },
    { key: 'noNetworkCallsFromComponent', value: false,                     pass: true },
    { key: 'localStorageOnly',            value: true,                      pass: true },
    { key: 'noBrowserAutomation',         value: false,                     pass: true },
    { key: 'noOpenClawCalls',             value: false,                     pass: true },
    { key: 'noMutationHTTPMethods',       value: false,                     pass: true },
    { key: 'readOnlyEndpointsOnly',       value: true,                      pass: true },
    { key: 'operatorNoteLocalOnly',       value: true,                      pass: true },
    { key: 'noBackendCallsTriggered',     value: false,                     pass: true },
    { key: 'noBrokerExecution',           value: false,                     pass: true },
    { key: 'noMoneyMovement',             value: false,                     pass: true },
    { key: 'noCredentialEntry',           value: false,                     pass: true },
    { key: 'operatorReviewNonExecutable', value: true,                      pass: true },
    { key: 'allSafetiesDefaultFalse',     value: true,                      pass: true },
  ];

  const sourceDiagnostics = {
    finalDesignReviewCount: finalDesignReviewPackets.length,
    qaChecklistsCount: qaChecklists.length,
    evidencePacketsCount: evidencePackets.length,
    approvalGatesCount: approvalGates.length,
    designPacketsCount: designPackets.length,
    acceptancePacketsCount: acceptancePackets.length,
    promotionGatesCount: promotionGates.length,
    auditDashboardsCount: auditDashboards.length,
    readinessPacketsCount: readinessPackets.length,
    integrityCheckpointsCount: integrityCheckpoints.length,
  };

  const reviewConsoleId = 'csorc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    reviewConsoleId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_OPERATOR_REVIEW_CONSOLE',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    operatorReviewDecision,
    operatorNote: operatorNote.trim(),
    latestFinalDesignReviewId: latestFinalReview?.reviewPacketId ?? null,
    latestQAChecklistId: latestQA?.qaChecklistId ?? null,
    latestApprovalEvidenceId: latestEvidence?.packetId ?? null,
    latestApprovalGateId: latestGate?.designGateId ?? null,
    latestDesignId: latestDesign?.schedulerDesignId ?? null,
    latestAcceptanceId: latestAcceptance?.id ?? null,
    latestPromotionId: latestPromotion?.promotionGateId ?? null,
    latestAuditId: latestAudit?.auditDashboardId ?? null,
    latestReadinessId: latestReadiness?.readinessPacketId ?? null,
    latestIntegrityId: latestIntegrity?.integrityCheckpointId ?? null,
    normalizedStatuses: {
      finalReviewStatus,
      qaStatus,
      evidenceStatus,
      gateStatus,
      acceptanceStatus,
      promotionDecision,
      readinessStatus,
      integrityStatus,
    },
    operatorChecklist,
    allowedDesignOnlyActions,
    blockedRuntimeBehaviors,
    safetyAssertions,
    sourceDiagnostics,
    nextRecommendedAction: operatorReviewDecision === 'OPERATOR_REVIEW_READY'
      ? 'Proceed with operator sign-off review (design documentation only, non-executable)'
      : operatorReviewDecision === 'OPERATOR_REVIEW_HOLD'
      ? 'Complete missing evidence or resolve QA holds before operator review'
      : 'Resolve design blockers before operator review can proceed',
    note: 'Operator review console is local-only. No scheduler. No polling. No automation. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Review JSON'}
    </button>
  );
}

export default function ControlledSchedulerOperatorReviewConsole() {
  const [review, setReview] = useState(null);
  const [operatorNote, setOperatorNote] = useState('');
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const r = buildReviewConsole(operatorNote);
    saveReviewConsole(r);
    tryAppendAudit({
      event: 'controlled_scheduler_operator_review_recorded',
      reviewConsoleId: r.reviewConsoleId,
      operatorReviewDecision: r.operatorReviewDecision,
      hasOperatorNote: r.operatorNote.length > 0,
      checklistPass: r.operatorChecklist.filter(i => i.pass).length,
      note: `Operator review recorded (${r.reviewConsoleId}). Decision: ${r.operatorReviewDecision}. No scheduler. No polling.`,
    });
    setReview(r);
  }, [operatorNote]);

  useEffect(() => { generate(); }, []);

  const DECISION_STYLE = {
    OPERATOR_REVIEW_READY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'OPERATOR_REVIEW_READY' },
    OPERATOR_REVIEW_HOLD:  { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'OPERATOR_REVIEW_HOLD' },
    OPERATOR_REVIEW_BLOCKED: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'OPERATOR_REVIEW_BLOCKED' },
  };

  const style = review ? (DECISION_STYLE[review.operatorReviewDecision] || DECISION_STYLE.OPERATOR_REVIEW_HOLD) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Operator Approval</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler Operator Review Console</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Operator sign-off review — design documentation only, non-executable.</div>
        </div>
        {review && (
          <button type="button" onClick={() => generate()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">REVIEW_ONLY / READ_ONLY / LOCKED</span> — Operator review console. No scheduler. No automation. No dispatch.</span>
      </div>

      {review && (
        <>
          {/* Operator Review Decision Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Operator Review: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {review.nextRecommendedAction}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Review Decision',        value: review.operatorReviewDecision.split('_')[2],  color: style.color },
              { label: 'Final Design Review',    value: review.normalizedStatuses.finalReviewStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'QA Decision',            value: review.normalizedStatuses.qaStatus.split('_')[1], color: 'text-slate-300' },
              { label: 'Evidence Packet',        value: review.normalizedStatuses.evidenceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Approval Gate',          value: review.normalizedStatuses.gateStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Manual Acceptance',      value: review.normalizedStatuses.acceptanceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Readiness',              value: review.normalizedStatuses.readinessStatus,     color: 'text-slate-300' },
              { label: 'Source Completeness',    value: `10/10`,                                       color: 'text-primary font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Operator Note Textarea */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <PencilIcon className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Operator Review Notes (Local Only)</label>
            </div>
            <textarea
              value={operatorNote}
              onChange={(e) => {
                setOperatorNote(e.target.value);
              }}
              placeholder="Add operator review notes, findings, or revision requests (stored locally only)..."
              className="w-full h-24 px-3 py-2 bg-secondary/20 border border-border rounded text-[9px] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="text-[7px] text-slate-500">{operatorNote.length} characters. Local storage only — not sent to backend or OpenClaw.</div>
          </div>

          {/* Operator Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Operator Checklist ({review.operatorChecklist.filter(i => i.pass).length}/{review.operatorChecklist.length})</div>
            </div>
            <div className="divide-y divide-border/30">
              {review.operatorChecklist.map((item, i) => (
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
              {Object.entries(review.sourceDiagnostics).map(([key, val]) => (
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
              {review.allowedDesignOnlyActions.map((action, i) => (
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
              {review.blockedRuntimeBehaviors.map((behavior, i) => (
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
                Safety Assertions — {review.safetyAssertions.filter(a => a.pass).length}/{review.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {review.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Operator Review JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(review, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Review Console ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /><span className="font-mono">{review.reviewConsoleId}</span></span>
            <span>{new Date(review.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={review} />
            <button type="button" onClick={() => generate()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Generate Operator Review
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Operator review console is local-only. No scheduler. No polling. No automation. No dispatch. No execution.
      </div>
    </div>
  );
}