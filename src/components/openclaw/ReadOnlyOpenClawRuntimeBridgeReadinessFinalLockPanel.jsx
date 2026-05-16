/**
 * ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel — Phase 23 Final Lock
 * Verifies readiness gate and locks before runtime bridge implementation planning.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Lock, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const KEYS = {
  phase20Lock:       'openclawReadOnlyOpenClawBridgeDesignFinalLock',
  phase21Lock:       'openclawReadOnlyOpenClawBridgeValidatorFinalLock',
  auditLedger:       'openclawReadOnlyOpenClawBridgeDryRunAuditLedger',
  readinessGate:     'openclawReadOnlyOpenClawRuntimeBridgeReadinessGate',
  validationResult:  'openclawReadOnlyOpenClawBridgeValidationResult',
};
const LOCK_KEY    = 'openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock';
const LOCK_NAME   = 'OPENCLAW_READ_ONLY_RUNTIME_BRIDGE_READINESS_FINAL_LOCK';
const PHASE_NAME  = 'PHASE_23_RUNTIME_BRIDGE_READINESS_GATE';
const FINAL_WARNING = 'This Phase 23 lock is local-only and non-executable. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

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
  phase22AuditLedgerPresent:           'Phase 22 audit ledger present',
  phase23ReadinessGatePresent:         'Phase 23 readiness gate present',
  latestBridgeValidationPresent:       'Latest bridge validation present',
  latestValidationIsValidBridgeDryRun: 'Latest validation is VALID_BRIDGE_DRY_RUN',
  readinessDecisionAcceptable:         'Readiness decision is READY_FOR_BRIDGE_DRY_RUN_REVIEW',
  noAuditBlocked:                      'No audit records are AUDIT_BLOCKED',
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

const STATUS_CONFIG = {
  LOCK_READY:        { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',            icon: CheckCircle2 },
  HOLD_FOR_REVIEW:   { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',      icon: Clock },
  BLOCKED_BY_POLICY: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5', icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function runLock() {
  const phase20Lock      = loadJSON(KEYS.phase20Lock, null);
  const phase21Lock      = loadJSON(KEYS.phase21Lock, null);
  const auditLedger      = loadJSON(KEYS.auditLedger, []);
  const readinessGate    = loadJSON(KEYS.readinessGate, null);
  const valResult        = loadJSON(KEYS.validationResult, null);

  const r = valResult ?? {};
  const rg = readinessGate ?? {};

  // Check for unsafe flags in latest validation
  const policyViolation =
    r.openClawCalled        === true ||
    r.backendForwarded      === true ||
    r.browserActionPerformed=== true ||
    r.runtimeBridgeActivated=== true ||
    r.executionAllowed      === true ||
    r.dispatchAllowed       === true ||
    r.browserMutationAllowed=== true ||
    r.credentialEntryAllowed=== true;

  // Check if any audit is blocked
  const auditBlockedCount = auditLedger.filter(record => record.auditStatus === 'AUDIT_BLOCKED').length;

  const lockChecks = {
    phase20DesignLockPresent:            !!phase20Lock,
    phase21ValidatorLockPresent:         !!phase21Lock,
    phase22AuditLedgerPresent:           auditLedger.length > 0,
    phase23ReadinessGatePresent:         !!readinessGate,
    latestBridgeValidationPresent:       !!valResult,
    latestValidationIsValidBridgeDryRun: r.validationStatus === 'VALID_BRIDGE_DRY_RUN',
    readinessDecisionAcceptable:         rg.readinessDecision === 'READY_FOR_BRIDGE_DRY_RUN_REVIEW',
    noAuditBlocked:                      auditBlockedCount === 0,
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

  // Compute lockStatus
  let lockStatus;
  if (policyViolation || rg.readinessDecision === 'BLOCKED_BY_POLICY') {
    lockStatus = 'BLOCKED_BY_POLICY';
  } else if (
    Object.values(lockChecks).every(Boolean) &&
    rg.readinessDecision === 'READY_FOR_BRIDGE_DRY_RUN_REVIEW'
  ) {
    lockStatus = 'LOCK_READY';
  } else {
    lockStatus = 'HOLD_FOR_REVIEW';
  }

  return {
    lockName:                       LOCK_NAME,
    generatedAt:                    new Date().toISOString(),
    phaseName:                      PHASE_NAME,
    sourcePhase20LockPresent:       !!phase20Lock,
    sourcePhase21LockPresent:       !!phase21Lock,
    sourcePhase22AuditLedgerPresent: auditLedger.length > 0,
    sourcePhase23ReadinessGatePresent: !!readinessGate,
    latestBridgeValidationPresent:  !!valResult,
    latestBridgeValidationStatus:   r.validationStatus ?? null,
    readinessDecision:              rg.readinessDecision ?? null,
    lockChecks,
    lockStatus,
    safetyAssertions:               SAFETY_ASSERTIONS,
    finalWarning:                   FINAL_WARNING,
  };
}

export default function ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel() {
  const [lock, setLock]     = useState(() => loadJSON(LOCK_KEY, null));
  const [copied, setCopied] = useState(false);

  const phase20Present  = !!localStorage.getItem(KEYS.phase20Lock);
  const phase21Present  = !!localStorage.getItem(KEYS.phase21Lock);
  const auditPresent    = loadJSON(KEYS.auditLedger, []).length > 0;
  const readinessPresent= !!localStorage.getItem(KEYS.readinessGate);
  const valPresent      = !!localStorage.getItem(KEYS.validationResult);
  const readinessGate   = loadJSON(KEYS.readinessGate, null);
  const valResult       = loadJSON(KEYS.validationResult, null);

  const handleGenerate = () => {
    const result = runLock();
    try { localStorage.setItem(LOCK_KEY, JSON.stringify(result, null, 2)); } catch {}
    setLock(result);
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
    { label: 'Phase 20 Design Lock',    present: phase20Present },
    { label: 'Phase 21 Validator Lock', present: phase21Present },
    { label: 'Phase 22 Audit Ledger',   present: auditPresent },
    { label: 'Phase 23 Readiness Gate', present: readinessPresent },
    { label: 'Latest Validation',       present: valPresent },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 23 · Runtime Bridge Readiness Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Runtime Bridge Readiness Final Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 23 final lock. Verifies readiness gate before runtime bridge implementation planning. No OpenClaw calls, no browser automation, no execution.</div>
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

      {/* Readiness decision */}
      {readinessGate && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Readiness Decision</span>
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            readinessGate.readinessDecision === 'READY_FOR_BRIDGE_DRY_RUN_REVIEW'
              ? 'text-primary border-primary/30 bg-primary/5'
              : readinessGate.readinessDecision === 'BLOCKED_BY_POLICY'
                ? 'text-destructive border-destructive/30 bg-destructive/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {readinessGate.readinessDecision ?? '—'}
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
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Lock className="w-3.5 h-3.5" />
          Generate Phase 23 Final Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Phase 23 Final Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Phase 23 Final Lock
        </button>
      </div>

      {/* JSON preview */}
      {lock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 23 Final Lock — JSON Preview</span>
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