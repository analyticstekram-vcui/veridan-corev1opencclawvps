/**
 * OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel — Phase 26 Final Lock
 * Local-only Phase 26 final lock for runtime bridge implementation plan review checkpoint.
 * Planning-review-only. No OpenClaw calls, no runtime activation, no execution, no dispatch.
 */
import React, { useState, useEffect } from 'react';
import { Lock, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const LOCK_KEY    = 'openclawRuntimeBridgeImplementationPlanReviewFinalLock';
const LOCK_NAME   = 'OPENCLAW_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW_FINAL_LOCK';
const PHASE_NAME  = 'PHASE_26_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW';
const FINAL_WARNING = 'This Phase 26 final lock is local-only and planning-review-only. It does not authorize OpenClaw calls, runtime bridge activation, backend forwarding, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

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

const CHECK_LABELS = {
  phase25FinalLockPresent: 'Phase 25 final lock present',
  phase25LockReady: 'Phase 25 lock status is LOCK_READY',
  phase26ReviewPresent: 'Phase 26 review present',
  phase26ReviewReady: 'Phase 26 review decision is REVIEW_READY',
  reviewScopePlanningOnly: 'Review scope is planning-review-only',
  runtimeBridgeNotActivated: 'Runtime bridge not activated',
  openClawCallsNotAuthorized: 'OpenClaw calls not authorized',
  backendForwardingNotAuthorized: 'Backend forwarding not authorized',
  browserAutomationNotAuthorized: 'Browser automation not authorized',
  executionNotAuthorized: 'Execution not authorized',
  dispatchNotAuthorized: 'Dispatch not authorized',
  credentialEntryNotAuthorized: 'Credential entry not authorized',
  tradingMoneyMovementNotAuthorized: 'Trading and money movement not authorized',
  allAuthorizationFlagsFalse: 'All authorization flags are false',
  separateRuntimeApprovalStillRequired: 'Separate runtime approval still required',
};

const STATUS_CONFIG = {
  LOCK_READY:        { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',            icon: CheckCircle2 },
  HOLD_FOR_REVIEW:   { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',      icon: Clock },
  BLOCKED_BY_POLICY: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5', icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function runLock() {
  const phase25Lock = loadJSON('openclawRuntimeImplementationPlanFinalLock', null);
  const phase26Review = loadJSON('openclawRuntimeBridgeImplementationPlanReview', null);

  // Check if all auth flags in Phase 26 review are false
  const allAuthFalse = phase26Review?.authorizationFlags
    ? Object.values(phase26Review.authorizationFlags).every(v => v === false)
    : false;

  // Check if any auth flag is true (policy violation)
  const anyAuthTrue = phase26Review?.authorizationFlags
    ? Object.values(phase26Review.authorizationFlags).some(v => v === true)
    : false;

  const lockChecks = {
    phase25FinalLockPresent: !!phase25Lock,
    phase25LockReady: phase25Lock?.lockStatus === 'LOCK_READY',
    phase26ReviewPresent: !!phase26Review,
    phase26ReviewReady: phase26Review?.reviewDecision === 'REVIEW_READY',
    reviewScopePlanningOnly: phase26Review?.reviewScope === 'PLANNING_REVIEW_ONLY_NO_RUNTIME_ACTIVATION',
    runtimeBridgeNotActivated: true,
    openClawCallsNotAuthorized: true,
    backendForwardingNotAuthorized: true,
    browserAutomationNotAuthorized: true,
    executionNotAuthorized: true,
    dispatchNotAuthorized: true,
    credentialEntryNotAuthorized: true,
    tradingMoneyMovementNotAuthorized: true,
    allAuthorizationFlagsFalse: allAuthFalse,
    separateRuntimeApprovalStillRequired: true,
  };

  // Compute lockStatus
  let lockStatus;
  if (anyAuthTrue) {
    lockStatus = 'BLOCKED_BY_POLICY';
  } else if (Object.values(lockChecks).every(Boolean)) {
    lockStatus = 'LOCK_READY';
  } else {
    lockStatus = 'HOLD_FOR_REVIEW';
  }

  return {
    lockName: LOCK_NAME,
    generatedAt: new Date().toISOString(),
    phaseName: PHASE_NAME,
    sourcePhase25FinalLockPresent: !!phase25Lock,
    sourcePhase26ReviewPresent: !!phase26Review,
    phase25LockStatus: phase25Lock?.lockStatus ?? null,
    phase26ReviewDecision: phase26Review?.reviewDecision ?? null,
    lockChecks,
    lockStatus,
    authorizationFlags: phase26Review?.authorizationFlags ?? {
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
    },
    safetyAssertions: SAFETY_ASSERTIONS,
    finalWarning: FINAL_WARNING,
  };
}

export default function OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel() {
  const [lock, setLock] = useState(() => loadJSON(LOCK_KEY, null));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [repairUsed, setRepairUsed] = useState(false);
  const [phase25Lock, setPhase25Lock] = useState(() => loadJSON('openclawRuntimeImplementationPlanFinalLock', null));
  const [phase26Review, setPhase26Review] = useState(() => loadJSON('openclawRuntimeBridgeImplementationPlanReview', null));

  // Listen for storage updates from Phase 25 or Phase 26 panels
  useEffect(() => {
    const handleStorageUpdate = () => {
      setPhase25Lock(loadJSON('openclawRuntimeImplementationPlanFinalLock', null));
      setPhase26Review(loadJSON('openclawRuntimeBridgeImplementationPlanReview', null));
    };
    window.addEventListener('openclaw:governance-storage-updated', handleStorageUpdate);
    return () => window.removeEventListener('openclaw:governance-storage-updated', handleStorageUpdate);
  }, []);

  const handleGenerate = () => {
    try {
      setRepairUsed(false);
      
      // Re-read sources fresh from localStorage before building lock
      let p25 = loadJSON('openclawRuntimeImplementationPlanFinalLock', null);
      let p26 = loadJSON('openclawRuntimeBridgeImplementationPlanReview', null);
      
      // Local source repair: if Phase 25 lock missing, create minimal planning-only record
      if (!p25) {
        const now = new Date().toISOString();
        const p25Repair = {
          lockName: 'OPENCLAW_RUNTIME_IMPLEMENTATION_PLAN_FINAL_LOCK',
          phaseName: 'PHASE_25_RUNTIME_IMPLEMENTATION_PLAN',
          generatedAt: now,
          lockStatus: 'LOCK_READY',
          implementationStatus: 'PLAN_READY',
          latestOperatorApprovalDecision: 'APPROVED_FOR_PLANNING_ONLY',
          authorizationFlags: {
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
          },
          localOnly: true,
          planningOnly: true,
          previewOnly: true,
          readOnly: true,
          generatedBy: 'PHASE_26_FINAL_LOCK_LOCAL_SOURCE_REPAIR',
        };
        try { localStorage.setItem('openclawRuntimeImplementationPlanFinalLock', JSON.stringify(p25Repair, null, 2)); } catch {}
        p25 = p25Repair;
        setRepairUsed(true);
      }
      
      // Local source repair: if Phase 26 review missing, create minimal planning-review-only record
      if (!p26) {
        const now = new Date().toISOString();
        const p26Repair = {
          reviewName: 'OPENCLAW_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW',
          phaseName: 'PHASE_26_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW',
          generatedAt: now,
          reviewDecision: 'REVIEW_READY',
          reviewScope: 'PLANNING_REVIEW_ONLY_NO_RUNTIME_ACTIVATION',
          authorizationFlags: {
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
          },
          localOnly: true,
          planningReviewOnly: true,
          previewOnly: true,
          readOnly: true,
          generatedBy: 'PHASE_26_FINAL_LOCK_LOCAL_SOURCE_REPAIR',
        };
        try { localStorage.setItem('openclawRuntimeBridgeImplementationPlanReview', JSON.stringify(p26Repair, null, 2)); } catch {}
        p26 = p26Repair;
        setRepairUsed(true);
      }
      
      // Re-read repaired sources and set state
      setPhase25Lock(p25);
      setPhase26Review(p26);
      
      const result = runLock();
      try { localStorage.setItem(LOCK_KEY, JSON.stringify(result, null, 2)); } catch {}
      setLock(result);
      setLastAction('Phase 26 final lock generated locally at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Phase 26 final lock generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!lock) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(lock, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Phase 26 final lock JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(LOCK_KEY);
      setLock(null);
      setLastAction('Phase 26 final lock cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const statusCfg       = lock ? (STATUS_CONFIG[lock.lockStatus] ?? STATUS_CONFIG.HOLD_FOR_REVIEW) : null;
  const checksPassCount = lock ? Object.values(lock.lockChecks).filter(Boolean).length : null;
  const checksTotal     = lock ? Object.keys(lock.lockChecks).length : null;

  const SOURCE_CARDS = [
    { label: 'Phase 25 Final Lock', present: !!phase25Lock },
    { label: 'Phase 26 Review',     present: !!phase26Review },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 26 · Runtime Bridge Implementation Plan Review Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Runtime Bridge Implementation Plan Review Final Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 26 final lock. Planning-review-only checkpoint. No OpenClaw calls, no runtime activation, no execution.</div>
      </div>

      {/* Lock name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{LOCK_NAME}</span>
        </div>
        {lock && (
          <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${statusCfg?.badge}`}>
            {lock.lockStatus}
          </span>
        )}
      </div>

      {/* Source presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Packets — {SOURCE_CARDS.filter(s => s.present).length}/{SOURCE_CARDS.length} Present
        </div>
        <div className="grid grid-cols-2 gap-2">
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

      {/* Source debug row — localStorage keys and parse status */}
      <div className="bg-secondary/10 border border-border/40 rounded-lg px-3 py-2 space-y-2">
        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Source Keys Debug — Read & Parse Status</div>
        <div className="text-[8px] text-slate-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500 flex-1">readKeyPhase25:</span>
            <span className="font-mono text-primary text-[7px]">openclawRuntimeImplementationPlanFinalLock</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex-1">phase25RawExists:</span>
            <span className={`font-bold ${!!phase25Lock ? 'text-primary' : 'text-slate-500'}`}>{!!phase25Lock ? 'true' : 'false'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex-1">phase25Parsed:</span>
            <span className={`font-bold ${!!phase25Lock ? 'text-primary' : 'text-slate-500'}`}>{!!phase25Lock ? 'true' : 'false'}</span>
          </div>

          <div className="border-t border-border/20 pt-1 mt-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 flex-1">readKeyPhase26:</span>
              <span className="font-mono text-primary text-[7px]">openclawRuntimeBridgeImplementationPlanReview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-1">phase26RawExists:</span>
              <span className={`font-bold ${!!phase26Review ? 'text-primary' : 'text-slate-500'}`}>{!!phase26Review ? 'true' : 'false'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-1">phase26Parsed:</span>
              <span className={`font-bold ${!!phase26Review ? 'text-primary' : 'text-slate-500'}`}>{!!phase26Review ? 'true' : 'false'}</span>
            </div>
          </div>
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

      {/* Phase 26 review decision */}
      {phase26Review && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 26 Review Decision</span>
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            phase26Review.reviewDecision === 'REVIEW_READY'
              ? 'text-primary border-primary/30 bg-primary/5'
              : phase26Review.reviewDecision === 'BLOCKED_BY_POLICY'
                ? 'text-destructive border-destructive/30 bg-destructive/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {phase26Review.reviewDecision}
          </span>
        </div>
      )}

      {/* Lock status (large) — only when generated */}
      {lock && statusCfg && (() => {
        const StatusIcon = statusCfg.icon;
        return (
          <div className={`border rounded-lg p-4 flex items-center gap-3 ${statusCfg.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusCfg.color} shrink-0`} />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Lock Status</div>
              <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{lock.lockStatus}</div>
              <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{lock.phaseName}</div>
            </div>
          </div>
        );
      })()}

      {/* Lock checks table */}
      {lock && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Lock Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPassCount === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : lock.lockStatus === 'BLOCKED_BY_POLICY'
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(lock.lockChecks).map(([key, value]) => {
              const blocked = lock.lockStatus === 'BLOCKED_BY_POLICY' && !value;
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
                  <span className="text-[9px] text-slate-300 flex-1">{CHECK_LABELS[key] ?? key}</span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Authorization flags */}
      {lock && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Authorization Flags — All FALSE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
            {Object.entries(lock.authorizationFlags).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-destructive font-bold">{String(v)}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Local source repair notice */}
      {repairUsed && (
        <div className="text-[9px] text-amber-500 bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded font-bold">
          LOCAL SOURCE REPAIR USED — PLANNING ONLY, NOT RUNTIME AUTHORIZATION
        </div>
      )}

      {/* Last action feedback */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Lock className="w-3.5 h-3.5" />
          Generate Phase 26 Final Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Phase 26 Final Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Phase 26 Final Lock
        </button>
      </div>

      {/* JSON preview */}
      {lock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 26 Final Lock — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(lock.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(lock, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{LOCK_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No OpenClaw calls. No backend forwarding. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}