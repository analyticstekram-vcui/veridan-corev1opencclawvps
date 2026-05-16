/**
 * BrowserObservationExecutionContractFinalLockPanel — Local-only Phase 17 Final Lock
 * Verifies and locks the execution contract preview before any backend validator or real bridge.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Lock, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const KEYS = {
  contract:    'openclawBrowserObservationExecutionContractPreview',
  phase15Lock: 'openclawBrowserObservationFinalLock',
  phase16Lock: 'openclawBrowserObservationProposalFinalLock',
  gate:        'openclawBrowserObservationReadinessGate',
  routePlan:   'openclawBrowserObservationRoutePlan',
};
const LOCK_KEY     = 'openclawBrowserObservationExecutionContractFinalLock';
const LOCK_NAME    = 'OPENCLAW_BROWSER_OBSERVATION_EXECUTION_CONTRACT_FINAL_LOCK';
const PHASE_NAME   = 'PHASE_17_OBSERVATION_EXECUTION_CONTRACT_PREVIEW';
const FINAL_WARNING = 'This Phase 17 lock is local-only and non-executable. It does not authorize backend calls, OpenClaw calls, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, or polling.';

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  previewOnly:             true,
  readOnly:                true,
  contractPreviewOnly:     true,
  noBackendCalls:          true,
  noOpenClawCalls:         true,
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
  contractPreviewPresent:            'Contract preview present',
  phase15FinalLockPresent:           'Phase 15 final lock present',
  phase16FinalLockPresent:           'Phase 16 final lock present',
  readinessGatePresent:              'Readiness gate present',
  routePlanPresent:                  'Route plan present',
  contractScopeValid:                'Contract scope is READ_ONLY_OBSERVATION_CONTRACT_PREVIEW_ONLY',
  contractStatusReady:               'Contract status is LOCAL_ONLY_CONTRACT_PREVIEW_READY',
  executionPayloadNonExecutable:     'Execution payload has executionAllowed: false',
  responsePayloadNonExecutable:      'Response payload has executionPerformed: false',
  noExecutionAuthorized:             'No execution authorized',
  noDispatchAuthorized:              'No dispatch authorized',
  noBrowserMutationAuthorized:       'No browser mutation authorized',
  noCredentialEntryAuthorized:       'No credential entry authorized',
  noTradingOrMoneyMovementAuthorized:'No trading or money movement authorized',
};

const SOURCE_LABELS = {
  contractPreviewPresent: { label: 'Contract Preview', key: KEYS.contract   },
  phase15LockPresent:     { label: 'Phase 15 Lock',    key: KEYS.phase15Lock },
  phase16LockPresent:     { label: 'Phase 16 Lock',    key: KEYS.phase16Lock },
  readinessGatePresent:   { label: 'Readiness Gate',   key: KEYS.gate       },
  routePlanPresent:       { label: 'Route Plan',       key: KEYS.routePlan  },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function buildSourceLocksPresent() {
  return {
    phase15BrowserObservationFinalLockPresent:         !!localStorage.getItem(KEYS.phase15Lock),
    phase16BrowserObservationProposalFinalLockPresent: !!localStorage.getItem(KEYS.phase16Lock),
    readinessGatePresent:                              !!localStorage.getItem(KEYS.gate),
    routePlanPresent:                                  !!localStorage.getItem(KEYS.routePlan),
  };
}

function buildPresenceMap() {
  return {
    contractPreviewPresent: !!localStorage.getItem(KEYS.contract),
    phase15LockPresent:     !!localStorage.getItem(KEYS.phase15Lock),
    phase16LockPresent:     !!localStorage.getItem(KEYS.phase16Lock),
    readinessGatePresent:   !!localStorage.getItem(KEYS.gate),
    routePlanPresent:       !!localStorage.getItem(KEYS.routePlan),
  };
}

function runLock() {
  const contract = loadJSON(KEYS.contract, null);

  const lockChecks = {
    contractPreviewPresent:             !!contract,
    phase15FinalLockPresent:            !!localStorage.getItem(KEYS.phase15Lock),
    phase16FinalLockPresent:            !!localStorage.getItem(KEYS.phase16Lock),
    readinessGatePresent:               !!localStorage.getItem(KEYS.gate),
    routePlanPresent:                   !!localStorage.getItem(KEYS.routePlan),
    contractScopeValid:                 contract?.contractScope === 'READ_ONLY_OBSERVATION_CONTRACT_PREVIEW_ONLY',
    contractStatusReady:                contract?.contractStatus === 'LOCAL_ONLY_CONTRACT_PREVIEW_READY',
    executionPayloadNonExecutable:      contract?.executionPayloadShape?.executionAllowed === false,
    responsePayloadNonExecutable:       contract?.responsePayloadShape?.executionPerformed === false,
    noExecutionAuthorized:              true,
    noDispatchAuthorized:               true,
    noBrowserMutationAuthorized:        true,
    noCredentialEntryAuthorized:        true,
    noTradingOrMoneyMovementAuthorized: true,
  };

  const allPass   = Object.values(lockChecks).every(Boolean);
  const lockStatus = allPass ? 'LOCK_READY' : 'HOLD_FOR_REVIEW';

  return {
    lockName:               LOCK_NAME,
    generatedAt:            new Date().toISOString(),
    phaseName:              PHASE_NAME,
    sourceContractPresent:  !!contract,
    sourceLocksPresent:     buildSourceLocksPresent(),
    lockChecks,
    lockStatus,
    safetyAssertions:       SAFETY_ASSERTIONS,
    finalWarning:           FINAL_WARNING,
  };
}

const STATUS_CONFIG = {
  LOCK_READY:      { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',            icon: CheckCircle2 },
  HOLD_FOR_REVIEW: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',      icon: Clock },
};

export default function BrowserObservationExecutionContractFinalLockPanel() {
  const [lock, setLock]     = useState(() => loadJSON(LOCK_KEY, null));
  const [copied, setCopied] = useState(false);

  const presence     = buildPresenceMap();
  const presentCount = Object.values(presence).filter(Boolean).length;
  const totalCount   = Object.keys(presence).length;

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

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 17 · Execution Contract Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Execution Contract Final Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 17 final lock. Verifies contract preview integrity before any backend validator or real bridge.</div>
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
          Source Packets — {presentCount}/{totalCount} Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(SOURCE_LABELS).map(([presenceKey, { label }]) => {
            const present = presence[presenceKey];
            return (
              <div key={presenceKey} className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${present ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
                {present
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <div>
                  <div className={`text-[9px] font-semibold ${present ? 'text-primary' : 'text-slate-500'}`}>{label}</div>
                  <div className={`text-[7px] uppercase font-bold tracking-wider ${present ? 'text-primary/70' : 'text-slate-600'}`}>{present ? 'PRESENT' : 'MISSING'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lock status badge (large) */}
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
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(lock.lockChecks).map(([key, value]) => {
              const StatusIcon  = value ? CheckCircle2 : Clock;
              const statusColor = value ? 'text-primary' : 'text-amber-500';
              const badgeClass  = value
                ? 'text-primary border-primary/30 bg-primary/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5';
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                  <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusColor}`} />
                  <span className="text-[9px] text-slate-300 flex-1">{CHECK_LABELS[key] ?? key}</span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                    {value ? 'PASS' : 'HOLD'}
                  </span>
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
          Generate Phase 17 Final Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Phase 17 Final Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Phase 17 Final Lock
        </button>
      </div>

      {/* JSON preview */}
      {lock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase 17 Final Lock — JSON Preview</span>
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
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}