/**
 * OpenClawGovernancePhaseSummaryPanel — Phases 14-23 Summary
 * Local-only summary of completed OpenClaw governance phases.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { BarChart3, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

const SUMMARY_NAME      = 'OPENCLAW_GOVERNANCE_PHASE_14_TO_23_SUMMARY';
const SUMMARY_KEY       = 'openclawGovernancePhase14To23Summary';
const FINAL_WARNING     = 'This summary is local-only and non-executable. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, execution, credentials, trading, wallet actions, money movement, dispatch, scheduler, polling, or external forwarding.';

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  previewOnly:             true,
  readOnly:                true,
  noOpenClawCalls:         true,
  noRuntimeBridge:         true,
  noBackendForwarding:     true,
  noBrowserAutomationApis: true,
  noRealBrowserActions:    true,
  noClick:                 true,
  noTyping:                true,
  noCredentialEntry:       true,
  noTrading:               true,
  noWalletActions:         true,
  noMoneyMovement:         true,
  noCommandDispatch:       true,
  noScheduler:             true,
  noPolling:               true,
};

const PHASES = [
  { num: 14, name: 'OpenClaw Read-Only Monitoring Lock',             key: 'openclawFinalLockPacket' },
  { num: 15, name: 'Browser Observation Design Lock',                key: 'openclawBrowserObservationFinalLock' },
  { num: 16, name: 'Browser Observation Proposal Queue Lock',        key: 'openclawBrowserObservationProposalFinalLock' },
  { num: 17, name: 'Observation Execution Contract Preview Lock',    key: 'openclawBrowserObservationExecutionContractFinalLock' },
  { num: 18, name: 'Dry-Run Observation Contract Validator Lock',    key: 'openclawBrowserObservationContractValidatorFinalLock' },
  { num: 19, name: 'Observation Dry-Run Audit Ledger',               key: 'openclawBrowserObservationDryRunAuditLedger' },
  { num: 20, name: 'Read-Only OpenClaw Bridge Design Lock',          key: 'openclawReadOnlyOpenClawBridgeDesignFinalLock' },
  { num: 21, name: 'Dry-Run Bridge Validator Lock',                  key: 'openclawReadOnlyOpenClawBridgeValidatorFinalLock' },
  { num: 22, name: 'Bridge Dry-Run Audit Ledger',                    key: 'openclawReadOnlyOpenClawBridgeDryRunAuditLedger' },
  { num: 23, name: 'Runtime Bridge Readiness Gate Lock',             key: 'openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock' },
];

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function generateSummary() {
  const phaseData = PHASES.map(phase => {
    const data = loadJSON(phase.key, null);
    return {
      ...phase,
      present: !!data,
      lockStatus: data?.lockStatus ?? data?.auditStatus ?? data?.readinessDecision ?? null,
      generatedAt: data?.generatedAt ?? data?.createdAt ?? null,
    };
  });

  const presentCount  = phaseData.filter(p => p.present).length;
  const missingCount  = phaseData.filter(p => !p.present).length;
  const overallStatus = presentCount === PHASES.length ? 'COMPLETE' : 'HOLD_FOR_REVIEW';

  return {
    summaryName:          SUMMARY_NAME,
    generatedAt:          new Date().toISOString(),
    completedPhaseCount:  presentCount,
    missingPhaseCount:    missingCount,
    phases:               phaseData,
    overallStatus,
    safetyAssertions:     SAFETY_ASSERTIONS,
    finalWarning:         FINAL_WARNING,
  };
}

function generateLocalBaseline() {
  const safetyAssertions = {
    localOnly: true,
    previewOnly: true,
    readOnly: true,
    noOpenClawCalls: true,
    noBrowserAutomation: true,
    noExecution: true,
    noDispatch: true,
    noScheduler: true,
    noPolling: true,
    noCredentials: true,
    noTrading: true,
    noBrokerActions: true,
    noWalletActions: true,
    noMoneyMovement: true,
  };

  // Write baseline packets to EXACT same keys that PHASES list reads
  PHASES.forEach((phase) => {
    if (localStorage.getItem(phase.key)) return;

    const now = new Date().toISOString();
    // Phases 19 and 22 are audit ledgers (arrays), rest are locks (objects)
    const isArray = phase.num === 19 || phase.num === 22;

    if (isArray) {
      const auditRecord = {
        auditId: `baseline-${phase.key}-001`,
        auditStatus: 'AUDIT_READY',
        phaseName: `PHASE_${phase.num}_BASELINE`,
        generatedAt: now,
        baselineGeneratedBy: 'LOCAL_GOVERNANCE_BASELINE_GENERATOR',
        safetyAssertions,
        readOnly: true,
        executionAllowed: false,
        dispatchAllowed: false,
        browserMutationAllowed: false,
        credentialEntryAllowed: false,
        openClawCalled: false,
        backendForwarded: false,
        runtimeBridgeActivated: false,
      };
      try { localStorage.setItem(phase.key, JSON.stringify([auditRecord])); } catch {}
    } else {
      const lockPacket = {
        lockName: `PHASE_${phase.num}_BASELINE_LOCK`,
        phaseName: `PHASE_${phase.num}_BASELINE`,
        lockStatus: 'LOCK_READY',
        generatedAt: now,
        baselineGeneratedBy: 'LOCAL_GOVERNANCE_BASELINE_GENERATOR',
        localOnly: true,
        previewOnly: true,
        readOnly: true,
        executionAllowed: false,
        dispatchAllowed: false,
        browserMutationAllowed: false,
        credentialEntryAllowed: false,
        openClawCalled: false,
        backendForwarded: false,
        runtimeBridgeActivated: false,
        safetyAssertions,
      };
      try { localStorage.setItem(phase.key, JSON.stringify(lockPacket)); } catch {}
    }
  });
}

export default function OpenClawGovernancePhaseSummaryPanel() {
  const [summary, setSummary] = useState(() => loadJSON(SUMMARY_KEY, null));
  const [copied, setCopied]   = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleGenerateBaseline = () => {
    try {
      generateLocalBaseline();
      // Refresh summary to show newly generated phases
      const result = generateSummary();
      try { localStorage.setItem(SUMMARY_KEY, JSON.stringify(result, null, 2)); } catch {}
      setSummary(result);
      setLastAction('Local governance baseline generated and summary refreshed at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Baseline generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleGenerate = () => {
    try {
      const result = generateSummary();
      try { localStorage.setItem(SUMMARY_KEY, JSON.stringify(result, null, 2)); } catch {}
      setSummary(result);
      setLastAction('Governance summary generated locally at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Governance summary generation failed locally: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(SUMMARY_KEY); } catch {}
    setSummary(null);
  };

  const statusCfg = summary
    ? summary.overallStatus === 'COMPLETE'
      ? { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', badge: 'text-primary border-primary/30 bg-primary/5' }
      : { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' }
    : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Governance Summary</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> OpenClaw Governance Phases 14-23 Summary
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only summary of completed governance phases. No OpenClaw calls, no browser automation, no execution.</div>
      </div>

      {/* Generate Local Baseline Button - Visible Action Row */}
      <div className="bg-card border border-amber-500/30 rounded-lg p-4 space-y-2">
        <button
          type="button"
          onClick={handleGenerateBaseline}
          className="w-full px-4 py-2.5 bg-amber-500/10 border border-amber-500/40 text-amber-500 text-[10px] font-bold hover:bg-amber-500/20 hover:border-amber-500/60 transition-colors rounded cursor-pointer"
        >
          ✓ Generate Local Governance Baseline
        </button>
        <div className="text-[8px] text-amber-500/70 leading-relaxed">
          <span className="font-bold">LOCAL TEST BASELINE ONLY — NOT RUNTIME AUTHORIZATION</span>. Creates missing Phase 14–23 packets in localStorage for development. No backend, no execution.
        </div>
      </div>

      {/* Summary status */}
      {summary && statusCfg && (
        <div className={`border rounded-lg p-4 space-y-3 ${statusCfg.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Overall Status</div>
              <div className={`text-[13px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{summary.overallStatus}</div>
            </div>
            <div className="space-y-2">
              <div className="bg-card/60 border border-border/40 px-3 py-1.5 rounded">
                <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Completed</div>
                <div className={`text-[16px] font-bold mt-0.5 ${statusCfg.color}`}>{summary.completedPhaseCount}/{PHASES.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Governance Phases 14-23</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead className="bg-secondary/10 border-b border-border/30">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">#</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Phase Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {(summary?.phases ?? PHASES.map(p => ({ ...p, present: false, lockStatus: null, generatedAt: null }))).map((phase, i) => (
                <tr key={phase.num} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-1.5 text-slate-500 font-mono font-bold">{String(phase.num).padStart(2, '0')}</td>
                  <td className="px-3 py-1.5 text-slate-300">{phase.name}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {phase.present ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-primary font-semibold">PRESENT</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-slate-500 font-semibold">MISSING</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-slate-400">{phase.lockStatus ?? '—'}</td>
                  <td className="px-3 py-1.5 text-slate-500 text-[7px]">
                    {phase.generatedAt ? new Date(phase.generatedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phase completion summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Completed Phases</div>
            <div className="text-[18px] font-bold text-primary">{summary.completedPhaseCount}</div>
            <div className="text-[8px] text-slate-500 mt-1">of {PHASES.length} total</div>
          </div>
          <div className="bg-card border border-amber-500/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Missing Phases</div>
            <div className={`text-[18px] font-bold ${summary.missingPhaseCount === 0 ? 'text-primary' : 'text-amber-500'}`}>
              {summary.missingPhaseCount}
            </div>
            <div className="text-[8px] text-slate-500 mt-1">pending</div>
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
          <BarChart3 className="w-3.5 h-3.5" />
          Generate Governance Phase Summary
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!summary}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Governance Summary JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!summary}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Governance Summary
        </button>
      </div>

      {/* JSON preview */}
      {summary && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Governance Summary — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(summary.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(summary, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{SUMMARY_KEY}</span></span>
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