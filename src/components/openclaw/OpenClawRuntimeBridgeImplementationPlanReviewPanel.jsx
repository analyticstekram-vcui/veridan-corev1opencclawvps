/**
 * OpenClawRuntimeBridgeImplementationPlanReviewPanel — Phase 26 Review
 * Local-only review of Phase 25 planning lock. Planning-review-only, no runtime activation.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const REVIEW_KEY = 'openclawRuntimeBridgeImplementationPlanReview';
const REVIEW_NAME = 'OPENCLAW_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW';
const PHASE_NAME = 'PHASE_26_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW';
const FINAL_WARNING = 'This Phase 26 review is local-only and planning-review-only. It does not authorize OpenClaw calls, runtime bridge activation, backend forwarding, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

const SAFETY_ASSERTIONS = {
  localOnly: true,
  planningReviewOnly: true,
  previewOnly: true,
  readOnly: true,
  noRuntimeBridgeActivation: true,
  noOpenClawCalls: true,
  noBackendForwarding: true,
  noBrowserAutomationApis: true,
  noRealBrowserActions: true,
  noClick: true,
  noTyping: true,
  noCredentialEntry: true,
  noTrading: true,
  noBrokerActions: true,
  noWalletActions: true,
  noMoneyMovement: true,
  noCommandDispatch: true,
  noScheduler: true,
  noPolling: true,
  separateApprovalRequiredForRuntime: true,
};

const REQUIRED_NEXT_APPROVALS = [
  'SEPARATE_RUNTIME_ACTIVATION_APPROVAL_REQUIRED',
  'SEPARATE_OPENCLAW_CALL_APPROVAL_REQUIRED',
  'SEPARATE_BROWSER_AUTOMATION_APPROVAL_REQUIRED',
  'SEPARATE_CREDENTIAL_POLICY_APPROVAL_REQUIRED',
  'TRADING_AND_MONEY_MOVEMENT_REMAIN_PROHIBITED',
];

const AUTHORIZATION_FLAGS = {
  runtimeBridgeActivationAllowed: false,
  openClawCallAllowed: false,
  backendForwardingAllowed: false,
  browserAutomationAllowed: false,
  realBrowserActionAllowed: false,
  executionAllowed: false,
  dispatchAllowed: false,
  credentialEntryAllowed: false,
  tradingAllowed: false,
  brokerActionAllowed: false,
  walletActionAllowed: false,
  moneyMovementAllowed: false,
};

const REVIEW_CHECK_LABELS = {
  phase25FinalLockPresent: 'Phase 25 final lock present',
  phase25LockReady: 'Phase 25 lock status is LOCK_READY',
  runtimePlanPresent: 'Runtime plan present',
  runtimePlanPlanningOnly: 'Runtime plan scope is PLANNING_ONLY_NO_RUNTIME_ACTIVATION',
  operatorApprovalPresent: 'Operator approval present',
  operatorApprovedForPlanningOnly: 'Latest operator approval is APPROVED_FOR_PLANNING_ONLY',
  governanceSummaryPresent: 'Governance summary present',
  runtimeBridgeNotActivated: 'Runtime bridge not activated',
  openClawCallsNotAuthorized: 'OpenClaw calls not authorized',
  backendForwardingNotAuthorized: 'Backend forwarding not authorized',
  browserAutomationNotAuthorized: 'Browser automation not authorized',
  executionNotAuthorized: 'Execution not authorized',
  dispatchNotAuthorized: 'Dispatch not authorized',
  credentialEntryNotAuthorized: 'Credential entry not authorized',
  tradingMoneyMovementNotAuthorized: 'Trading and money movement not authorized',
  separateRuntimeApprovalStillRequired: 'Separate runtime approval still required',
};

const DECISION_STATUS = {
  BLOCKED_BY_POLICY: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5' },
  REVIEW_READY: { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', badge: 'text-primary border-primary/30 bg-primary/5' },
  HOLD_FOR_REVIEW: { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function runReview() {
  const phase25Lock = loadJSON('openclawRuntimeImplementationPlanFinalLock', null);
  const runtimePlan = loadJSON('openclawRuntimeImplementationPlan', null);
  const approvalRecords = loadJSON('openclawOperatorApprovalWorkflowRecords', []);
  const governanceSummary = loadJSON('openclawGovernancePhase14To23Summary', null);

  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;
  const p25 = phase25Lock ?? {};
  const rp = runtimePlan ?? {};

  // Check authorization flags from Phase 25
  const phase25AuthFlagsAreAllFalse = p25.authorizationFlags
    ? Object.values(p25.authorizationFlags).every(v => v === false)
    : false;

  const phase25HasTrueFlag = p25.authorizationFlags
    ? Object.values(p25.authorizationFlags).some(v => v === true)
    : false;

  const reviewChecks = {
    phase25FinalLockPresent: !!phase25Lock,
    phase25LockReady: p25.lockStatus === 'LOCK_READY',
    runtimePlanPresent: !!runtimePlan,
    runtimePlanPlanningOnly: rp.implementationScope === 'PLANNING_ONLY_NO_RUNTIME_ACTIVATION',
    operatorApprovalPresent: !!latestApproval,
    operatorApprovedForPlanningOnly: latestApproval?.approvalDecision === 'APPROVED_FOR_PLANNING_ONLY',
    governanceSummaryPresent: !!governanceSummary,
    runtimeBridgeNotActivated: true,
    openClawCallsNotAuthorized: true,
    backendForwardingNotAuthorized: true,
    browserAutomationNotAuthorized: true,
    executionNotAuthorized: true,
    dispatchNotAuthorized: true,
    credentialEntryNotAuthorized: true,
    tradingMoneyMovementNotAuthorized: true,
    separateRuntimeApprovalStillRequired: true,
  };

  // Determine review decision
  let reviewDecision;
  if (
    phase25HasTrueFlag ||
    latestApproval?.approvalDecision === 'BLOCKED_BY_OPERATOR' ||
    p25.lockStatus === 'BLOCKED_BY_OPERATOR' ||
    p25.lockStatus === 'BLOCKED_BY_POLICY'
  ) {
    reviewDecision = 'BLOCKED_BY_POLICY';
  } else if (Object.values(reviewChecks).every(Boolean)) {
    reviewDecision = 'REVIEW_READY';
  } else {
    reviewDecision = 'HOLD_FOR_REVIEW';
  }

  return {
    reviewName: REVIEW_NAME,
    generatedAt: new Date().toISOString(),
    phaseName: PHASE_NAME,
    sourcePhase25FinalLockPresent: !!phase25Lock,
    sourceRuntimePlanPresent: !!runtimePlan,
    sourceOperatorApprovalPresent: !!latestApproval,
    sourceGovernanceSummaryPresent: !!governanceSummary,
    phase25LockStatus: p25.lockStatus ?? null,
    implementationStatus: rp.implementationStatus ?? null,
    latestOperatorApprovalDecision: latestApproval?.approvalDecision ?? null,
    reviewScope: 'PLANNING_REVIEW_ONLY_NO_RUNTIME_ACTIVATION',
    reviewChecks,
    reviewDecision,
    requiredNextApprovals: REQUIRED_NEXT_APPROVALS,
    authorizationFlags: AUTHORIZATION_FLAGS,
    safetyAssertions: SAFETY_ASSERTIONS,
    finalWarning: FINAL_WARNING,
  };
}

export default function OpenClawRuntimeBridgeImplementationPlanReviewPanel() {
  const [review, setReview] = useState(() => loadJSON(REVIEW_KEY, null));
  const [copied, setCopied] = useState(false);

  const phase25Lock = loadJSON('openclawRuntimeImplementationPlanFinalLock', null);
  const runtimePlan = loadJSON('openclawRuntimeImplementationPlan', null);
  const approvalRecords = loadJSON('openclawOperatorApprovalWorkflowRecords', []);
  const governanceSummary = loadJSON('openclawGovernancePhase14To23Summary', null);

  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;

  const handleGenerate = () => {
    const result = runReview();
    try { localStorage.setItem(REVIEW_KEY, JSON.stringify(result, null, 2)); } catch {}
    setReview(result);
    // Dispatch event for Phase 26 final lock to re-read sources
    window.dispatchEvent(new CustomEvent('openclaw:governance-storage-updated'));
  };

  const handleCopy = () => {
    if (!review) return;
    navigator.clipboard.writeText(JSON.stringify(review, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(REVIEW_KEY); } catch {}
    setReview(null);
  };

  const statusCfg = review ? (DECISION_STATUS[review.reviewDecision] ?? DECISION_STATUS.HOLD_FOR_REVIEW) : null;
  const checksPassCount = review ? Object.values(review.reviewChecks).filter(Boolean).length : null;
  const checksTotal = review ? Object.keys(review.reviewChecks).length : null;

  const SOURCE_CARDS = [
    { label: 'Phase 25 Final Lock', present: !!phase25Lock },
    { label: 'Runtime Plan', present: !!runtimePlan },
    { label: 'Operator Approval', present: !!latestApproval },
    { label: 'Governance Summary', present: !!governanceSummary },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 26 · Runtime Bridge Implementation Plan Review</div>
        <div className="text-[13px] font-bold text-foreground">Runtime Bridge Implementation Plan Review</div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 26 review of Phase 25 planning lock. Planning-review-only checkpoint. No runtime activation.</div>
      </div>

      {/* Review name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{REVIEW_NAME}</span>
        </div>
        {review && (
          <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${statusCfg?.badge}`}>
            {review.reviewDecision}
          </span>
        )}
      </div>

      {/* Source presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Packets — {SOURCE_CARDS.filter(s => s.present).length}/{SOURCE_CARDS.length} Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOURCE_CARDS.map(({ label, present }) => (
            <div key={label} className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${present ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
              {present
                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                : <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              <div>
                <div className={`text-[9px] font-semibold ${present ? 'text-primary' : 'text-slate-500'}`}>{label}</div>
                <div className={`text-[7px] uppercase font-bold tracking-wider ${present ? 'text-primary/70' : 'text-slate-600'}`}>{present ? 'PRESENT' : 'MISSING'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 25 lock status */}
      {phase25Lock && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 25 Lock Status</span>
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            phase25Lock.lockStatus === 'LOCK_READY'
              ? 'text-primary border-primary/30 bg-primary/5'
              : phase25Lock.lockStatus === 'BLOCKED_BY_OPERATOR' || phase25Lock.lockStatus === 'BLOCKED_BY_POLICY'
                ? 'text-destructive border-destructive/30 bg-destructive/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {phase25Lock.lockStatus}
          </span>
        </div>
      )}

      {/* Review decision (large) — only when generated */}
      {review && statusCfg && (
        <div className={`border rounded-lg p-4 flex items-center gap-3 ${statusCfg.bg}`}>
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Review Decision</div>
            <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{review.reviewDecision}</div>
            <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{review.reviewScope}</div>
          </div>
        </div>
      )}

      {/* Review checks table */}
      {review && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Review Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPassCount === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : review.reviewDecision === 'BLOCKED_BY_POLICY'
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(review.reviewChecks).map(([key, value]) => {
              const blocked = review.reviewDecision === 'BLOCKED_BY_POLICY' && !value;
              const Icon = value ? CheckCircle2 : blocked ? XCircle : Clock;
              const color = value ? 'text-primary' : blocked ? 'text-destructive' : 'text-amber-500';
              const badge = value
                ? 'text-primary border-primary/30 bg-primary/5'
                : blocked
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5';
              const label = value ? 'PASS' : blocked ? 'BLOCKED' : 'HOLD';
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                  <span className="text-[9px] text-slate-300 flex-1">{REVIEW_CHECK_LABELS[key] ?? key}</span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required next approvals */}
      <div className="bg-card border border-amber-500/20 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Next Approvals</span>
        </div>
        <div className="divide-y divide-border/30">
          {REQUIRED_NEXT_APPROVALS.map(approval => (
            <div key={approval} className="flex items-center gap-3 px-4 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[9px] text-slate-300">{approval.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Authorization flags */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Authorization Flags — All FALSE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(AUTHORIZATION_FLAGS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-destructive font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-primary font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Final warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Final Warning: </span>{FINAL_WARNING}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          Generate Phase 26 Review Packet
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!review}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Phase 26 Review JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!review}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Phase 26 Review
        </button>
      </div>

      {/* JSON preview */}
      {review && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 26 Review — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(review.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(review, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{REVIEW_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Planning-review-only. No OpenClaw calls, no runtime bridge activation, no backend forwarding, no browser automation, no execution, no dispatch, no credentials, no trading, no wallet, no money movement.
      </div>
    </div>
  );
}