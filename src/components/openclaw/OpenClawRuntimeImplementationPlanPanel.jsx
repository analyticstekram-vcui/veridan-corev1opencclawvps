/**
 * OpenClawRuntimeImplementationPlanPanel — Phase 25 Runtime Implementation Plan
 * Local-only planning for future read-only OpenClaw bridge. No runtime activation.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { CheckCircle2, Copy, Trash2, ShieldCheck, AlertTriangle, Clock, Zap } from 'lucide-react';

const PLAN_KEY       = 'openclawRuntimeImplementationPlan';
const PLAN_NAME      = 'OPENCLAW_RUNTIME_IMPLEMENTATION_PLAN';
const PHASE_NAME     = 'PHASE_25_RUNTIME_IMPLEMENTATION_PLAN';
const FINAL_WARNING  = 'This implementation plan is local-only and planning-only. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

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

const IMPLEMENTATION_STEPS = [
  'Confirm all source locks remain present',
  'Confirm latest operator approval permits planning only',
  'Define runtime bridge function boundaries',
  'Define backend validation gates',
  'Define OpenClaw call boundary but keep disabled',
  'Define browser observation payload sanitizer',
  'Define response sanitizer',
  'Define local evidence record format',
  'Define rollback and kill-switch requirements',
  'Require separate operator approval before runtime activation',
];

const BLOCKED_UNTIL = [
  'RUNTIME_ACTIVATION_REQUIRES_SEPARATE_PHASE',
  'OPENCLAW_CALLS_REQUIRE_SEPARATE_OPERATOR_APPROVAL',
  'BROWSER_AUTOMATION_REQUIRES_SEPARATE_RUNTIME_LOCK',
  'CREDENTIAL_ENTRY_REMAINS_PROHIBITED',
  'TRADING_AND_MONEY_MOVEMENT_REMAIN_PROHIBITED',
];

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function generatePlan() {
  const approvalRecords = loadJSON('openclawOperatorApprovalWorkflowRecords', []);
  const governanceSummary = loadJSON('openclawGovernancePhase14To23Summary', null);
  const readinessLock = loadJSON('openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock', null);
  const designLock = loadJSON('openclawReadOnlyOpenClawBridgeDesignFinalLock', null);
  const validatorLock = loadJSON('openclawReadOnlyOpenClawBridgeValidatorFinalLock', null);
  const auditLedger = loadJSON('openclawReadOnlyOpenClawBridgeDryRunAuditLedger', []);

  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;

  // Determine implementation status
  let implementationStatus;
  if (!latestApproval) {
    implementationStatus = 'HOLD_FOR_REVIEW';
  } else if (
    latestApproval.approvalDecision === 'BLOCKED_BY_OPERATOR'
  ) {
    implementationStatus = 'BLOCKED_BY_OPERATOR';
  } else if (
    latestApproval.approvalDecision === 'APPROVED_FOR_PLANNING_ONLY' &&
    latestApproval.allowedNextStep === 'PLANNING_ONLY_NEXT_STEP_ALLOWED'
  ) {
    implementationStatus = 'PLAN_READY';
  } else {
    implementationStatus = 'HOLD_FOR_REVIEW';
  }

  return {
    planName:                            PLAN_NAME,
    generatedAt:                         new Date().toISOString(),
    phaseName:                           PHASE_NAME,
    sourceOperatorApprovalPresent:       !!latestApproval,
    latestOperatorApproval:              latestApproval,
    sourceGovernanceSummaryPresent:      !!governanceSummary,
    sourceRuntimeReadinessLockPresent:   !!readinessLock,
    sourceBridgeDesignLockPresent:       !!designLock,
    sourceBridgeValidatorLockPresent:    !!validatorLock,
    sourceBridgeAuditLedgerPresent:      Array.isArray(auditLedger) && auditLedger.length > 0,
    implementationScope:                 'PLANNING_ONLY_NO_RUNTIME_ACTIVATION',
    implementationStatus,
    implementationSteps:                 IMPLEMENTATION_STEPS,
    blockedUntil:                        BLOCKED_UNTIL,
    authorizationFlags: {
      runtimeBridgeActivationAllowed:    false,
      openClawCallAllowed:               false,
      browserAutomationAllowed:          false,
      executionAllowed:                  false,
      dispatchAllowed:                   false,
      credentialEntryAllowed:            false,
      tradingAllowed:                    false,
      brokerActionAllowed:               false,
      walletActionAllowed:               false,
      moneyMovementAllowed:              false,
    },
    safetyAssertions:                    SAFETY_ASSERTIONS,
    finalWarning:                        FINAL_WARNING,
  };
}

export default function OpenClawRuntimeImplementationPlanPanel() {
  const [plan, setPlan] = useState(() => loadJSON(PLAN_KEY, null));
  const [copied, setCopied] = useState(false);

  const approvalRecords = loadJSON('openclawOperatorApprovalWorkflowRecords', []);
  const governanceSummary = loadJSON('openclawGovernancePhase14To23Summary', null);
  const readinessLock = loadJSON('openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock', null);
  const designLock = loadJSON('openclawReadOnlyOpenClawBridgeDesignFinalLock', null);
  const validatorLock = loadJSON('openclawReadOnlyOpenClawBridgeValidatorFinalLock', null);
  const auditLedger = loadJSON('openclawReadOnlyOpenClawBridgeDryRunAuditLedger', []);

  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;

  const sourceLocks = {
    approvalPresent: !!latestApproval,
    summaryPresent: !!governanceSummary,
    readinessPresent: !!readinessLock,
    designPresent: !!designLock,
    validatorPresent: !!validatorLock,
    auditPresent: Array.isArray(auditLedger) && auditLedger.length > 0,
  };

  const allSourcesPresent = Object.values(sourceLocks).every(Boolean);

  const handleGenerate = () => {
    const result = generatePlan();
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(result, null, 2)); } catch {}
    setPlan(result);
  };

  const handleCopy = () => {
    if (!plan) return;
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (!confirm('Clear runtime implementation plan? This cannot be undone.')) return;
    try { localStorage.removeItem(PLAN_KEY); } catch {}
    setPlan(null);
  };

  const statusCfg = plan
    ? plan.implementationStatus === 'PLAN_READY'
      ? { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', badge: 'text-primary border-primary/30 bg-primary/5' }
      : plan.implementationStatus === 'BLOCKED_BY_OPERATOR'
        ? { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5' }
        : { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' }
    : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 25 · Runtime Implementation Plan</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Runtime Implementation Plan
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 25 plan for future read-only bridge. Planning-only, no runtime activation. No OpenClaw calls, no browser automation, no execution.</div>
      </div>

      {/* Implementation status */}
      {plan && statusCfg && (
        <div className={`border rounded-lg p-4 space-y-2 ${statusCfg.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Implementation Status</div>
              <div className={`text-[13px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{plan.implementationStatus}</div>
            </div>
            <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${statusCfg.badge}`}>
              {plan.implementationScope.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Source presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Packets — {Object.values(sourceLocks).filter(Boolean).length}/6 Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Operator Approval', present: sourceLocks.approvalPresent },
            { label: 'Governance Summary', present: sourceLocks.summaryPresent },
            { label: 'Runtime Readiness Lock', present: sourceLocks.readinessPresent },
            { label: 'Bridge Design Lock', present: sourceLocks.designPresent },
            { label: 'Bridge Validator Lock', present: sourceLocks.validatorPresent },
            { label: 'Bridge Audit Ledger', present: sourceLocks.auditPresent },
          ].map(({ label, present }) => (
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

      {/* Latest operator approval summary */}
      {latestApproval && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Latest Operator Approval</div>
              <div className="text-[10px] font-bold text-foreground mt-0.5">{latestApproval.approvalScope.replace(/_/g, ' ')}</div>
              <div className="text-[8px] font-mono text-slate-500 mt-1">{latestApproval.approvalId}</div>
            </div>
            <span className={`text-[8px] font-bold px-2 py-1 rounded border inline-block ${
              latestApproval.approvalDecision === 'APPROVED_FOR_PLANNING_ONLY'
                ? 'text-primary border-primary/30 bg-primary/5'
                : latestApproval.approvalDecision === 'BLOCKED_BY_OPERATOR'
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>
              {latestApproval.approvalDecision.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="bg-secondary/10 border border-border/30 rounded px-3 py-2 text-[8px] text-slate-300 max-h-16 overflow-y-auto">
            {latestApproval.approvalNote}
          </div>
        </div>
      )}

      {/* Implementation steps checklist */}
      {plan && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Implementation Steps — {IMPLEMENTATION_STEPS.length} Total</span>
          </div>
          <div className="divide-y divide-border/30">
            {IMPLEMENTATION_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-[8px] text-slate-600 font-mono mt-0.5 shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-[9px] text-slate-300">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked until list */}
      {plan && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Blocked Until — {BLOCKED_UNTIL.length} Constraints</span>
          </div>
          <div className="divide-y divide-border/30">
            {BLOCKED_UNTIL.map((constraint, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-[8px] text-slate-600 font-mono mt-0.5 shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[9px] text-slate-300">{constraint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authorization flags */}
      {plan && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Authorization Flags — All FALSE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
            {Object.entries(plan.authorizationFlags).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] text-slate-300 font-mono">{k.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}: <span className="text-destructive font-bold">{String(v)}</span></span>
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
          disabled={!allSourcesPresent}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Generate Runtime Implementation Plan
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!plan}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Runtime Plan JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!plan}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Runtime Plan
        </button>
      </div>

      {/* JSON preview */}
      {plan && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Runtime Implementation Plan — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(plan.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(plan, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{PLAN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Planning-only, no runtime activation. No OpenClaw calls, no browser automation, no execution, no credentials, no trading, no wallet actions, no money movement.
      </div>
    </div>
  );
}