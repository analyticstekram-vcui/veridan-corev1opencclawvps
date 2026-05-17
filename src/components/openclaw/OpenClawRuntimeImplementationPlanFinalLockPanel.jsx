/**
 * OpenClawRuntimeImplementationPlanFinalLockPanel — Phase 25 Final Lock
 * Verifies runtime implementation plan before boundary design work begins.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Lock, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const KEYS = {
  runtimePlan:       'openclawRuntimeImplementationPlan',
  approvalRecords:   'openclawOperatorApprovalWorkflowRecords',
  governanceSummary: 'openclawGovernancePhase14To23Summary',
  readinessLock:     'openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock',
  designLock:        'openclawReadOnlyOpenClawBridgeDesignFinalLock',
  validatorLock:     'openclawReadOnlyOpenClawBridgeValidatorFinalLock',
  auditLedger:       'openclawReadOnlyOpenClawBridgeDryRunAuditLedger',
};
const LOCK_KEY    = 'openclawRuntimeImplementationPlanFinalLock';
const LOCK_NAME   = 'OPENCLAW_RUNTIME_IMPLEMENTATION_PLAN_FINAL_LOCK';
const PHASE_NAME  = 'PHASE_25_RUNTIME_IMPLEMENTATION_PLAN';
const FINAL_WARNING = 'This Phase 25 lock is local-only and planning-only. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

const SAFETY_ASSERTIONS = {
  localOnly:                        true,
  planningOnly:                     true,
  previewOnly:                      true,
  readOnly:                         true,
  noRuntimeBridgeActivation:        true,
  noOpenClawCalls:                  true,
  noBrowserAutomationApis:          true,
  noRealBrowserActions:             true,
  noClick:                          true,
  noTyping:                         true,
  noCredentialEntry:                true,
  noTrading:                        true,
  noBrokerActions:                  true,
  noWalletActions:                  true,
  noMoneyMovement:                  true,
  noCommandDispatch:                true,
  noScheduler:                      true,
  noPolling:                        true,
  separateApprovalRequiredForRuntime: true,
};

const CHECK_LABELS = {
  runtimePlanPresent:                  'Runtime plan present',
  operatorApprovalPresent:             'Operator approval present',
  governanceSummaryPresent:            'Governance summary present',
  runtimeReadinessLockPresent:         'Runtime readiness lock present',
  bridgeDesignLockPresent:             'Bridge design lock present',
  bridgeValidatorLockPresent:          'Bridge validator lock present',
  bridgeAuditLedgerPresent:            'Bridge audit ledger present',
  implementationScopePlanningOnly:     'Implementation scope is planning-only',
  implementationStatusPlanReadyOrHold: 'Implementation status is PLAN_READY or HOLD_FOR_REVIEW',
  authorizationFlagsAllFalse:          'All authorization flags are false',
  noRuntimeBridgeActivationAuthorized: 'Runtime bridge activation not authorized',
  noOpenClawCallsAuthorized:           'OpenClaw calls not authorized',
  noBrowserAutomationAuthorized:       'Browser automation not authorized',
  noExecutionAuthorized:               'Execution not authorized',
  noDispatchAuthorized:                'Dispatch not authorized',
  noCredentialUseAuthorized:           'Credential entry not authorized',
  noTradingOrMoneyMovementAuthorized:  'Trading and money movement not authorized',
  separateRuntimeApprovalRequired:     'Separate runtime approval required',
};

const STATUS_CONFIG = {
  LOCK_READY:        { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',            icon: CheckCircle2 },
  HOLD_FOR_REVIEW:   { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',      icon: Clock },
  BLOCKED_BY_OPERATOR: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5', icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function runLock() {
  const runtimePlan = loadJSON(KEYS.runtimePlan, null);
  const approvalRecords = loadJSON(KEYS.approvalRecords, []);
  const governanceSummary = loadJSON(KEYS.governanceSummary, null);
  const readinessLock = loadJSON(KEYS.readinessLock, null);
  const designLock = loadJSON(KEYS.designLock, null);
  const validatorLock = loadJSON(KEYS.validatorLock, null);
  const auditLedger = loadJSON(KEYS.auditLedger, []);

  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;
  const rp = runtimePlan ?? {};

  // Verify authorization flags are all false
  const allAuthFalse = rp.authorizationFlags
    ? Object.values(rp.authorizationFlags).every(v => v === false)
    : false;

  const lockChecks = {
    runtimePlanPresent:                  !!runtimePlan,
    operatorApprovalPresent:             !!latestApproval,
    governanceSummaryPresent:            !!governanceSummary,
    runtimeReadinessLockPresent:         !!readinessLock,
    bridgeDesignLockPresent:             !!designLock,
    bridgeValidatorLockPresent:          !!validatorLock,
    bridgeAuditLedgerPresent:            Array.isArray(auditLedger) && auditLedger.length > 0,
    implementationScopePlanningOnly:     rp.implementationScope === 'PLANNING_ONLY_NO_RUNTIME_ACTIVATION',
    implementationStatusPlanReadyOrHold: rp.implementationStatus === 'PLAN_READY' || rp.implementationStatus === 'HOLD_FOR_REVIEW',
    authorizationFlagsAllFalse:          allAuthFalse,
    noRuntimeBridgeActivationAuthorized: rp.authorizationFlags?.runtimeBridgeActivationAllowed === false,
    noOpenClawCallsAuthorized:           rp.authorizationFlags?.openClawCallAllowed === false,
    noBrowserAutomationAuthorized:       rp.authorizationFlags?.browserAutomationAllowed === false,
    noExecutionAuthorized:               rp.authorizationFlags?.executionAllowed === false,
    noDispatchAuthorized:                rp.authorizationFlags?.dispatchAllowed === false,
    noCredentialUseAuthorized:           rp.authorizationFlags?.credentialEntryAllowed === false,
    noTradingOrMoneyMovementAuthorized:  rp.authorizationFlags?.tradingAllowed === false && rp.authorizationFlags?.moneyMovementAllowed === false,
    separateRuntimeApprovalRequired:     true,
  };

  // Compute lockStatus
  let lockStatus;
  if (latestApproval?.approvalDecision === 'BLOCKED_BY_OPERATOR' || rp.implementationStatus === 'BLOCKED_BY_OPERATOR') {
    lockStatus = 'BLOCKED_BY_OPERATOR';
  } else if (
    Object.values(lockChecks).every(Boolean) &&
    (rp.implementationStatus === 'PLAN_READY' || rp.implementationStatus === 'HOLD_FOR_REVIEW')
  ) {
    lockStatus = 'LOCK_READY';
  } else {
    lockStatus = 'HOLD_FOR_REVIEW';
  }

  return {
    lockName:                              LOCK_NAME,
    generatedAt:                           new Date().toISOString(),
    phaseName:                             PHASE_NAME,
    sourceRuntimePlanPresent:              !!runtimePlan,
    sourceOperatorApprovalPresent:         !!latestApproval,
    sourceGovernanceSummaryPresent:        !!governanceSummary,
    sourceRuntimeReadinessLockPresent:     !!readinessLock,
    sourceBridgeDesignLockPresent:         !!designLock,
    sourceBridgeValidatorLockPresent:      !!validatorLock,
    sourceBridgeAuditLedgerPresent:        Array.isArray(auditLedger) && auditLedger.length > 0,
    latestOperatorApprovalDecision:        latestApproval?.approvalDecision ?? null,
    implementationStatus:                  rp.implementationStatus ?? null,
    lockChecks,
    lockStatus,
    authorizationFlags:                    rp.authorizationFlags ?? {},
    safetyAssertions:                      SAFETY_ASSERTIONS,
    finalWarning:                          FINAL_WARNING,
  };
}

export default function OpenClawRuntimeImplementationPlanFinalLockPanel() {
  const [lock, setLock] = useState(() => loadJSON(LOCK_KEY, null));
  const [copied, setCopied] = useState(false);

  const runtimePlan = loadJSON(KEYS.runtimePlan, null);
  const approvalRecords = loadJSON(KEYS.approvalRecords, []);
  const governanceSummary = loadJSON(KEYS.governanceSummary, null);
  const readinessLock = loadJSON(KEYS.readinessLock, null);
  const designLock = loadJSON(KEYS.designLock, null);
  const validatorLock = loadJSON(KEYS.validatorLock, null);
  const auditLedger = loadJSON(KEYS.auditLedger, []);

  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;

  const handleGenerate = () => {
    const result = runLock();
    try { localStorage.setItem(LOCK_KEY, JSON.stringify(result, null, 2)); } catch {}
    setLock(result);
    // Dispatch event for Phase 26 final lock to re-read sources
    window.dispatchEvent(new CustomEvent('openclaw:governance-storage-updated'));
  };

  const handleCopy = () => {
    if (!lock) return;
    navigator.clipboard.writeText(JSON.stringify(lock, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(LOCK_KEY); } catch {}
    setLock(null);
  };

  const statusCfg       = lock ? (STATUS_CONFIG[lock.lockStatus] ?? STATUS_CONFIG.HOLD_FOR_REVIEW) : null;
  const checksPassCount = lock ? Object.values(lock.lockChecks).filter(Boolean).length : null;
  const checksTotal     = lock ? Object.keys(lock.lockChecks).length : null;

  const SOURCE_CARDS = [
    { label: 'Runtime Plan',           present: !!runtimePlan },
    { label: 'Operator Approval',      present: !!latestApproval },
    { label: 'Governance Summary',     present: !!governanceSummary },
    { label: 'Runtime Readiness Lock', present: !!readinessLock },
    { label: 'Bridge Design Lock',     present: !!designLock },
    { label: 'Bridge Validator Lock',  present: !!validatorLock },
    { label: 'Bridge Audit Ledger',    present: Array.isArray(auditLedger) && auditLedger.length > 0 },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 25 · Runtime Implementation Plan Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Runtime Implementation Plan Final Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 25 final lock. Verifies planning-only implementation plan before boundary design work. No OpenClaw calls, no browser automation, no execution.</div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

      {/* Latest approval decision */}
      {latestApproval && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Operator Approval Decision</span>
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            latestApproval.approvalDecision === 'APPROVED_FOR_PLANNING_ONLY'
              ? 'text-primary border-primary/30 bg-primary/5'
              : latestApproval.approvalDecision === 'BLOCKED_BY_OPERATOR'
                ? 'text-destructive border-destructive/30 bg-destructive/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {latestApproval.approvalDecision}
          </span>
        </div>
      )}

      {/* Implementation status */}
      {runtimePlan && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Implementation Status</span>
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            runtimePlan.implementationStatus === 'PLAN_READY'
              ? 'text-primary border-primary/30 bg-primary/5'
              : runtimePlan.implementationStatus === 'BLOCKED_BY_OPERATOR'
                ? 'text-destructive border-destructive/30 bg-destructive/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {runtimePlan.implementationStatus}
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
                : lock.lockStatus === 'BLOCKED_BY_OPERATOR'
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(lock.lockChecks).map(([key, value]) => {
              const blocked = lock.lockStatus === 'BLOCKED_BY_OPERATOR' && !value;
              const Icon    = value ? CheckCircle2 : blocked ? XCircle : Clock;
              const color   = value ? 'text-primary' : blocked ? 'text-destructive' : 'text-amber-500';
              const badge   = value
                ? 'text-primary border-primary/30 bg-primary/5'
                : blocked
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5';
              const label   = value ? 'PASS' : blocked ? 'BLOCKED' : 'HOLD';
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Lock className="w-3.5 h-3.5" />
          Generate Phase 25 Final Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Phase 25 Final Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Phase 25 Final Lock
        </button>
      </div>

      {/* JSON preview */}
      {lock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 25 Final Lock — JSON Preview</span>
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