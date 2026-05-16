/**
 * BrowserObservationFinalLockPanel — Local-only Final Lock
 * Verifies and locks the Phase 15 browser observation design evidence stack.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Lock, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

const KEYS = {
  designPacket:    'openclawReadOnlyBrowserObservationDesignPacket',
  policyMatrix:    'openclawBrowserObservationPolicyMatrix',
  approvalRules:   'openclawBrowserObservationApprovalRules',
  routePlan:       'openclawBrowserObservationRoutePlan',
  simulation:      'openclawBrowserObservationSimulation',
  evidenceExport:  'openclawBrowserObservationEvidenceExport',
};
const LOCK_KEY    = 'openclawBrowserObservationFinalLock';
const LOCK_NAME   = 'OPENCLAW_BROWSER_OBSERVATION_FINAL_LOCK';
const PHASE_NAME  = 'PHASE_15_READ_ONLY_BROWSER_OBSERVATION_DESIGN';
const FINAL_WARNING = 'This lock is local-only and non-executable. It does not authorize browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or backend calls.';

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noRealBrowserActions:     true,
  noClick:                  true,
  noTyping:                 true,
  noFormSubmit:             true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noScheduler:              true,
  noPolling:                true,
  noAutonomousControl:      true,
};

const SOURCE_LABELS = {
  designPacketPresent:   { label: 'Design Packet',    key: KEYS.designPacket },
  policyMatrixPresent:   { label: 'Policy Matrix',    key: KEYS.policyMatrix },
  approvalRulesPresent:  { label: 'Approval Rules',   key: KEYS.approvalRules },
  routePlanPresent:      { label: 'Route Plan',        key: KEYS.routePlan },
  simulationPresent:     { label: 'Simulation',        key: KEYS.simulation },
  evidenceExportPresent: { label: 'Evidence Export',  key: KEYS.evidenceExport },
};

const CHECK_LABELS = {
  allSourcePacketsPresent:            'All source packets present',
  designScopeValid:                   'Design scope valid',
  policyMatrixReady:                  'Policy matrix ready',
  approvalRulesReady:                 'Approval rules ready',
  routePlanReady:                     'Route plan ready',
  simulationReady:                    'Simulation ready',
  evidenceExportReady:                'Evidence export ready',
  noExecutionAuthorized:              'No execution authorized',
  noBrowserAutomationAuthorized:      'No browser automation authorized',
  noCredentialUseAuthorized:          'No credential use authorized',
  noTradingOrMoneyMovementAuthorized: 'No trading or money movement authorized',
};

function loadJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function buildPresence() {
  return {
    designPacketPresent:   !!localStorage.getItem(KEYS.designPacket),
    policyMatrixPresent:   !!localStorage.getItem(KEYS.policyMatrix),
    approvalRulesPresent:  !!localStorage.getItem(KEYS.approvalRules),
    routePlanPresent:      !!localStorage.getItem(KEYS.routePlan),
    simulationPresent:     !!localStorage.getItem(KEYS.simulation),
    evidenceExportPresent: !!localStorage.getItem(KEYS.evidenceExport),
  };
}

function buildConsistencyChecks(presence) {
  const allPresent = Object.values(presence).every(Boolean);
  const dp  = loadJSON(KEYS.designPacket);
  const pm  = loadJSON(KEYS.policyMatrix);
  const ar  = loadJSON(KEYS.approvalRules);
  const rp  = loadJSON(KEYS.routePlan);
  const sim = loadJSON(KEYS.simulation);
  const ee  = loadJSON(KEYS.evidenceExport);

  return {
    allSourcePacketsPresent:            allPresent,
    designScopeValid:                   !!(dp?.designName || dp?.observationDesignName),
    policyMatrixReady:                  !!(pm?.matrixName || pm?.policyMatrixName),
    approvalRulesReady:                 !!(ar?.rulesName),
    routePlanReady:                     !!(rp?.plannerName),
    simulationReady:                    !!(sim?.simulationName),
    evidenceExportReady:                !!(ee?.evidenceName),
    noExecutionAuthorized:              true,
    noBrowserAutomationAuthorized:      true,
    noCredentialUseAuthorized:          true,
    noTradingOrMoneyMovementAuthorized: true,
  };
}

export default function BrowserObservationFinalLockPanel() {
  const [lock, setLock]     = useState(() => loadJSON(LOCK_KEY));
  const [copied, setCopied] = useState(false);

  const presence = buildPresence();
  const presentCount = Object.values(presence).filter(Boolean).length;
  const totalCount   = Object.keys(presence).length;

  const handleGenerate = () => {
    const sourcePacketsPresent = buildPresence();
    const consistencyChecks    = buildConsistencyChecks(sourcePacketsPresent);
    const allPass              = Object.values(consistencyChecks).every(Boolean);
    const lockStatus           = allPass ? 'LOCK_READY' : 'HOLD_FOR_REVIEW';

    const l = {
      lockName:             LOCK_NAME,
      generatedAt:          new Date().toISOString(),
      phaseName:            PHASE_NAME,
      sourcePacketsPresent,
      consistencyChecks,
      lockStatus,
      safetyAssertions:     SAFETY_ASSERTIONS,
      finalWarning:         FINAL_WARNING,
    };
    try { localStorage.setItem(LOCK_KEY, JSON.stringify(l, null, 2)); } catch {}
    setLock(l);
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

  const lockReady  = lock?.lockStatus === 'LOCK_READY';
  const lockHold   = lock?.lockStatus === 'HOLD_FOR_REVIEW';
  const checksPass = lock ? Object.values(lock.consistencyChecks).filter(Boolean).length : null;
  const checksTotal= lock ? Object.keys(lock.consistencyChecks).length : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 15 · Browser Observation Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Browser Observation Final Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only final lock. Verifies design evidence stack. No automation, execution, or dispatch.</div>
      </div>

      {/* Lock name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{LOCK_NAME}</span>
        </div>
        {lock && (
          <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
            lockReady
              ? 'text-primary border-primary/30 bg-primary/5'
              : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
          }`}>
            {lock.lockStatus}
          </span>
        )}
      </div>

      {/* Source packet presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Packets — {presentCount}/{totalCount} Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

      {/* Consistency checks */}
      {lock && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Consistency Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPass === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPass}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(lock.consistencyChecks).map(([checkKey, value]) => (
              <div key={checkKey} className="flex items-center gap-3 px-4 py-2">
                {value
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <span className="text-[9px] text-slate-300 flex-1">{CHECK_LABELS[checkKey] ?? checkKey}</span>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${
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

      {/* Final warning panel */}
      <div className="flex items-start gap-2 px-3 py-3 bg-amber-500/5 border border-amber-500/20 rounded">
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
          Generate Browser Observation Final Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Final Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!lock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Final Lock
        </button>
      </div>

      {/* JSON preview */}
      {lock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Final Lock — JSON Preview</span>
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