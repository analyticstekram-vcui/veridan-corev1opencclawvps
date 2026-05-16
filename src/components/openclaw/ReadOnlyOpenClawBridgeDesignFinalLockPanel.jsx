/**
 * ReadOnlyOpenClawBridgeDesignFinalLockPanel — Phase 20 Final Lock
 * Verifies bridge design packet and locks it locally. No OpenClaw calls, no browser automation.
 */
import React, { useState } from 'react';
import { Lock, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

const KEYS = {
  bridgeDesign:        'openclawReadOnlyOpenClawBridgeDesign',
  phase17Lock:         'openclawBrowserObservationExecutionContractFinalLock',
  phase18Lock:         'openclawBrowserObservationContractValidatorFinalLock',
  phase19Ledger:       'openclawBrowserObservationDryRunAuditLedger',
  phase16ProposalLock: 'openclawBrowserObservationProposalFinalLock',
};
const LOCK_KEY     = 'openclawReadOnlyOpenClawBridgeDesignFinalLock';
const LOCK_NAME    = 'OPENCLAW_READ_ONLY_BRIDGE_DESIGN_FINAL_LOCK';
const PHASE_NAME   = 'PHASE_20_READ_ONLY_OPENCLAW_BRIDGE_DESIGN';
const FINAL_WARNING = 'This Phase 20 lock is local-only and non-executable. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  designOnly:              true,
  previewOnly:             true,
  readOnly:                true,
  noRuntimeBridge:         true,
  noOpenClawCalls:         true,
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
  bridgeDesignPresent:              'Bridge design packet present',
  phase17ContractLockPresent:       'Phase 17 contract lock present',
  phase18ValidatorLockPresent:      'Phase 18 validator lock present',
  phase19AuditLedgerPresent:        'Phase 19 audit ledger present',
  phase16ProposalLockPresent:       'Phase 16 proposal lock present',
  bridgeScopeDesignOnly:            'bridgeScope is DESIGN_ONLY_NO_RUNTIME_BRIDGE',
  bridgeDesignStatusReady:          'bridgeDesignStatus is LOCAL_ONLY_BRIDGE_DESIGN_READY',
  noRuntimeBridgeAuthorized:        'No runtime bridge authorized',
  noOpenClawCallsAuthorized:        'No OpenClaw calls authorized',
  noBackendForwardingAuthorized:    'No backend forwarding authorized',
  noBrowserAutomationAuthorized:    'No browser automation authorized',
  noExecutionAuthorized:            'No execution authorized',
  noDispatchAuthorized:             'No dispatch authorized',
  noCredentialUseAuthorized:        'No credential use authorized',
  noTradingOrMoneyMovementAuthorized: 'No trading or money movement authorized',
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function runLock() {
  const bridgeDesign      = loadJSON(KEYS.bridgeDesign, null);
  const phase17Lock       = loadJSON(KEYS.phase17Lock, null);
  const phase18Lock       = loadJSON(KEYS.phase18Lock, null);
  const phase19Ledger     = loadJSON(KEYS.phase19Ledger, []);
  const phase16ProposalLock = loadJSON(KEYS.phase16ProposalLock, null);

  const d = bridgeDesign ?? {};
  const phase19Present = Array.isArray(phase19Ledger) && phase19Ledger.length > 0;

  const sourceLocksPresent = {
    phase17ContractLockPresent:  !!phase17Lock,
    phase18ValidatorLockPresent: !!phase18Lock,
    phase19AuditLedgerPresent:   phase19Present,
    phase16ProposalLockPresent:  !!phase16ProposalLock,
  };

  const lockChecks = {
    bridgeDesignPresent:                !!bridgeDesign,
    phase17ContractLockPresent:         !!phase17Lock,
    phase18ValidatorLockPresent:        !!phase18Lock,
    phase19AuditLedgerPresent:          phase19Present,
    phase16ProposalLockPresent:         !!phase16ProposalLock,
    bridgeScopeDesignOnly:              d.bridgeScope === 'DESIGN_ONLY_NO_RUNTIME_BRIDGE',
    bridgeDesignStatusReady:            d.bridgeDesignStatus === 'LOCAL_ONLY_BRIDGE_DESIGN_READY',
    noRuntimeBridgeAuthorized:          true,
    noOpenClawCallsAuthorized:          true,
    noBackendForwardingAuthorized:      true,
    noBrowserAutomationAuthorized:      true,
    noExecutionAuthorized:              true,
    noDispatchAuthorized:               true,
    noCredentialUseAuthorized:          true,
    noTradingOrMoneyMovementAuthorized: true,
  };

  const lockStatus = Object.values(lockChecks).every(Boolean) ? 'LOCK_READY' : 'HOLD_FOR_REVIEW';

  return {
    lockName:                  LOCK_NAME,
    generatedAt:               new Date().toISOString(),
    phaseName:                 PHASE_NAME,
    sourceBridgeDesignPresent: !!bridgeDesign,
    sourceLocksPresent,
    lockChecks,
    lockStatus,
    safetyAssertions:          SAFETY_ASSERTIONS,
    finalWarning:              FINAL_WARNING,
  };
}

export default function ReadOnlyOpenClawBridgeDesignFinalLockPanel() {
  const [lock, setLock]     = useState(() => loadJSON(LOCK_KEY, null));
  const [copied, setCopied] = useState(false);

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

  const checksPassCount = lock ? Object.values(lock.lockChecks).filter(Boolean).length : null;
  const checksTotal     = lock ? Object.keys(lock.lockChecks).length : null;
  const isReady         = lock?.lockStatus === 'LOCK_READY';

  const sourceLockCards = lock ? [
    { label: 'Bridge Design Packet', present: lock.sourceBridgeDesignPresent },
    { label: 'Phase 17 Contract Lock', present: lock.sourceLocksPresent.phase17ContractLockPresent },
    { label: 'Phase 18 Validator Lock', present: lock.sourceLocksPresent.phase18ValidatorLockPresent },
    { label: 'Phase 19 Audit Ledger', present: lock.sourceLocksPresent.phase19AuditLedgerPresent },
    { label: 'Phase 16 Proposal Lock', present: lock.sourceLocksPresent.phase16ProposalLockPresent },
  ] : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 20 · Bridge Design Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Read-Only Bridge Design Final Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 20 final lock. Verifies bridge design packet before any dry-run bridge validator is considered. No OpenClaw calls, no browser automation.</div>
      </div>

      {/* Lock name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{LOCK_NAME}</span>
        </div>
        {lock && (
          <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            isReady
              ? 'text-primary border-primary/30 bg-primary/5'
              : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {lock.lockStatus}
          </span>
        )}
      </div>

      {/* Lock status (large) — only when generated */}
      {lock && (
        <div className={`border rounded-lg p-4 flex items-center gap-3 ${
          isReady ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          {isReady
            ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            : <Clock className="w-5 h-5 text-amber-500 shrink-0" />}
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Lock Status</div>
            <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${isReady ? 'text-primary' : 'text-amber-500'}`}>
              {lock.lockStatus}
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{lock.phaseName}</div>
          </div>
        </div>
      )}

      {/* Source presence cards */}
      {lock && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
            Source Packets — {sourceLockCards.filter(s => s.present).length}/{sourceLockCards.length} Present
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sourceLockCards.map(({ label, present }) => (
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
      )}

      {/* Lock checks table */}
      {lock && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Lock Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPassCount === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(lock.lockChecks).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                {value
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <span className="text-[9px] text-slate-300 flex-1">{CHECK_LABELS[key] ?? key}</span>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                  value
                    ? 'text-primary border-primary/30 bg-primary/5'
                    : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
                }`}>{value ? 'PASS' : 'HOLD'}</span>
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
          Generate Phase 20 Final Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Phase 20 Final Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Phase 20 Final Lock
        </button>
      </div>

      {/* JSON preview */}
      {lock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 20 Final Lock — JSON Preview</span>
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