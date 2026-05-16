/**
 * ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel — Phase 23 Readiness Gate
 * Evaluates readiness for future read-only runtime bridge. Local-only, non-executable.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Zap, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock, FileCheck } from 'lucide-react';

const KEYS = {
  phase20Lock:       'openclawReadOnlyOpenClawBridgeDesignFinalLock',
  phase21Lock:       'openclawReadOnlyOpenClawBridgeValidatorFinalLock',
  auditLedger:       'openclawReadOnlyOpenClawBridgeDryRunAuditLedger',
  validationResult:  'openclawReadOnlyOpenClawBridgeValidationResult',
};
const GATE_KEY       = 'openclawReadOnlyOpenClawRuntimeBridgeReadinessGate';
const GATE_NAME      = 'OPENCLAW_READ_ONLY_RUNTIME_BRIDGE_READINESS_GATE';
const PHASE_NAME     = 'PHASE_23_RUNTIME_BRIDGE_READINESS_GATE';
const FINAL_WARNING  = 'This readiness gate is local-only and non-executable. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  previewOnly:             true,
  dryRunOnly:              true,
  readOnly:                true,
  noOpenClawCalls:         true,
  noRuntimeBridge:         true,
  noBackendForwarding:     true,
  noBrowserAutomationApis: true,
  noRealBrowserActions:    true,
  noClick:                 true,
  noTyping:                true,
  noFormSubmit:            true,
  noCredentialEntry:       true,
  noTrading:               true,
  noBrokerActions:         true,
  noWalletActions:         true,
  noMoneyMovement:         true,
  noCommandDispatch:       true,
  noScheduler:             true,
  noPolling:               true,
  noAutonomousControl:     true,
};

const CHECK_LABELS = {
  phase20DesignLockPresent:            'Phase 20 design lock present',
  phase21ValidatorLockPresent:         'Phase 21 validator lock present',
  bridgeAuditLedgerPresent:            'Bridge audit ledger present',
  latestBridgeValidationPresent:       'Latest bridge validation present',
  latestValidationIsValidDryRun:       'Latest validation is VALID_BRIDGE_DRY_RUN',
  atLeastOneAuditReady:                'At least one audit record is AUDIT_READY',
  noAuditBlocked:                      'No audit records are AUDIT_BLOCKED',
  latestValidationDryRunOnly:          'Latest validation has dryRunOnly: true',
  openClawNotCalled:                   'openClawCalled is false',
  backendNotForwarded:                 'backendForwarded is false',
  browserActionNotPerformed:           'browserActionNotPerformed is false',
  runtimeBridgeNotActivated:           'runtimeBridgeNotActivated is false',
  executionDisabled:                   'executionAllowed is false',
  dispatchDisabled:                    'dispatchAllowed is false',
  browserMutationDisabled:             'browserMutationAllowed is false',
  credentialEntryDisabled:             'credentialEntryAllowed is false',
  noTradingOrMoneyMovementAuthorized:  'No trading or money movement authorized',
};

const DECISION_CONFIG = {
  READY_FOR_BRIDGE_DRY_RUN_REVIEW: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',            icon: CheckCircle2 },
  HOLD_FOR_REVIEW:                 { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',      icon: Clock },
  BLOCKED_BY_POLICY:               { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5', icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function computeReadinessGate() {
  const phase20Lock      = loadJSON(KEYS.phase20Lock, null);
  const phase21Lock      = loadJSON(KEYS.phase21Lock, null);
  const auditLedger      = loadJSON(KEYS.auditLedger, []);
  const valResult        = loadJSON(KEYS.validationResult, null);

  // Audit counts
  const auditReadyCount  = auditLedger.filter(r => r.auditStatus === 'AUDIT_READY').length;
  const auditBlockedCount= auditLedger.filter(r => r.auditStatus === 'AUDIT_BLOCKED').length;
  const auditHoldCount   = auditLedger.filter(r => r.auditStatus === 'AUDIT_HOLD_FOR_REVIEW').length;

  const r = valResult ?? {};

  // Policy violations in latest validation
  const policyViolation =
    r.openClawCalled        === true ||
    r.backendForwarded      === true ||
    r.browserActionPerformed=== true ||
    r.runtimeBridgeActivated=== true ||
    r.executionAllowed      === true ||
    r.dispatchAllowed       === true ||
    r.browserMutationAllowed=== true ||
    r.credentialEntryAllowed=== true;

  const readinessChecks = {
    phase20DesignLockPresent:            !!phase20Lock,
    phase21ValidatorLockPresent:         !!phase21Lock,
    bridgeAuditLedgerPresent:            auditLedger.length > 0,
    latestBridgeValidationPresent:       !!valResult,
    latestValidationIsValidDryRun:       r.validationStatus === 'VALID_BRIDGE_DRY_RUN',
    atLeastOneAuditReady:                auditReadyCount > 0,
    noAuditBlocked:                      auditBlockedCount === 0,
    latestValidationDryRunOnly:          r.dryRunOnly === true,
    openClawNotCalled:                   r.openClawCalled === false,
    backendNotForwarded:                 r.backendForwarded === false,
    browserActionNotPerformed:           r.browserActionPerformed === false,
    runtimeBridgeNotActivated:           r.runtimeBridgeActivated === false,
    executionDisabled:                   r.executionAllowed === false,
    dispatchDisabled:                    r.dispatchAllowed === false,
    browserMutationDisabled:             r.browserMutationAllowed === false,
    credentialEntryDisabled:             r.credentialEntryAllowed === false,
    noTradingOrMoneyMovementAuthorized:  true,
  };

  // Compute readiness decision
  let readinessDecision;
  if (policyViolation || auditBlockedCount > 0) {
    readinessDecision = 'BLOCKED_BY_POLICY';
  } else if (
    !phase20Lock || !phase21Lock || auditLedger.length === 0 || !valResult ||
    auditReadyCount === 0 ||
    r.validationStatus !== 'VALID_BRIDGE_DRY_RUN'
  ) {
    readinessDecision = 'HOLD_FOR_REVIEW';
  } else if (Object.values(readinessChecks).every(Boolean)) {
    readinessDecision = 'READY_FOR_BRIDGE_DRY_RUN_REVIEW';
  } else {
    readinessDecision = 'HOLD_FOR_REVIEW';
  }

  return {
    gateName:                       GATE_NAME,
    generatedAt:                    new Date().toISOString(),
    phaseName:                      PHASE_NAME,
    sourcePhase20LockPresent:       !!phase20Lock,
    sourcePhase21LockPresent:       !!phase21Lock,
    bridgeAuditLedgerPresent:       auditLedger.length > 0,
    latestBridgeValidationPresent:  !!valResult,
    latestBridgeValidationStatus:   r.validationStatus ?? null,
    auditReadyCount,
    auditBlockedCount,
    auditHoldCount,
    readinessChecks,
    readinessDecision,
    safetyAssertions:               SAFETY_ASSERTIONS,
    finalWarning:                   FINAL_WARNING,
  };
}

export default function ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel() {
  const [gate, setGate]     = useState(() => loadJSON(GATE_KEY, null));
  const [copied, setCopied] = useState(false);

  const valResult    = loadJSON(KEYS.validationResult, null);
  const auditLedger  = loadJSON(KEYS.auditLedger, []);

  const handleEvaluate = () => {
    const result = computeReadinessGate();
    try { localStorage.setItem(GATE_KEY, JSON.stringify(result, null, 2)); } catch {}
    setGate(result);
  };

  const handleCopy = () => {
    if (!gate) return;
    navigator.clipboard.writeText(JSON.stringify(gate, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(GATE_KEY); } catch {}
    setGate(null);
  };

  const decisionCfg = gate ? (DECISION_CONFIG[gate.readinessDecision] ?? DECISION_CONFIG.HOLD_FOR_REVIEW) : null;
  const checksPassCount = gate ? Object.values(gate.readinessChecks).filter(Boolean).length : null;
  const checksTotal     = gate ? Object.keys(gate.readinessChecks).length : null;

  const SOURCE_CARDS = [
    { label: 'Phase 20 Design Lock',    present: !!loadJSON(KEYS.phase20Lock, null) },
    { label: 'Phase 21 Validator Lock', present: !!loadJSON(KEYS.phase21Lock, null) },
    { label: 'Bridge Audit Ledger',     present: auditLedger.length > 0 },
    { label: 'Latest Validation',       present: !!valResult },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 23 · Runtime Bridge Readiness Gate</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Runtime Bridge Readiness Gate
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 23 readiness gate. Evaluates readiness for future read-only runtime bridge. Non-executable preview. No OpenClaw calls, no browser automation, no execution.</div>
      </div>

      {/* Gate name chip + decision badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <FileCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{GATE_NAME}</span>
        </div>
        {gate && (
          <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${decisionCfg?.badge}`}>
            {gate.readinessDecision}
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

      {/* Latest validation status */}
      {valResult && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Bridge Validation Status</span>
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            valResult.validationStatus === 'VALID_BRIDGE_DRY_RUN'
              ? 'text-primary border-primary/30 bg-primary/5'
              : valResult.validationStatus === 'BLOCKED_BY_POLICY'
                ? 'text-destructive border-destructive/30 bg-destructive/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {valResult.validationStatus ?? '—'}
          </span>
        </div>
      )}

      {/* Audit count cards */}
      {gate && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
            Audit Ledger Summary — {gate.auditReadyCount + gate.auditBlockedCount + gate.auditHoldCount} Total
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Ready', count: gate.auditReadyCount, color: 'text-primary border-primary/30 bg-primary/5' },
              { label: 'Blocked', count: gate.auditBlockedCount, color: 'text-destructive border-destructive/30 bg-destructive/5' },
              { label: 'Hold', count: gate.auditHoldCount, color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`border rounded-lg px-3 py-2.5 ${color}`}>
                <div className="text-[9px] font-semibold">{label}</div>
                <div className="text-[14px] font-bold mt-0.5">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Readiness decision (large) — only when generated */}
      {gate && decisionCfg && (() => {
        const DecisionIcon = decisionCfg.icon;
        return (
          <div className={`border rounded-lg p-4 flex items-center gap-3 ${decisionCfg.bg}`}>
            <DecisionIcon className={`w-5 h-5 ${decisionCfg.color} shrink-0`} />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Readiness Decision</div>
              <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${decisionCfg.color}`}>{gate.readinessDecision}</div>
              <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{gate.phaseName}</div>
            </div>
          </div>
        );
      })()}

      {/* Readiness checks table */}
      {gate && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Readiness Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPassCount === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : gate.readinessDecision === 'BLOCKED_BY_POLICY'
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(gate.readinessChecks).map(([key, value]) => {
              const blocked = gate.readinessDecision === 'BLOCKED_BY_POLICY' && !value;
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
          onClick={handleEvaluate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Zap className="w-3.5 h-3.5" />
          Evaluate Runtime Bridge Readiness
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!gate}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Runtime Bridge Readiness JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!gate}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Runtime Bridge Readiness
        </button>
      </div>

      {/* JSON preview */}
      {gate && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Runtime Bridge Readiness Gate — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(gate.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(gate, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{GATE_KEY}</span></span>
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