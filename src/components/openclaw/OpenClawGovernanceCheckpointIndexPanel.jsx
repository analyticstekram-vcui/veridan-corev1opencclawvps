/**
 * OpenClawGovernanceCheckpointIndexPanel — Phase 27 Checkpoint Index
 * Local-only governance checkpoint summarizing Phases 14-26 completion.
 * No OpenClaw calls, no runtime activation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { CheckCircle2, Copy, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

const CHECKPOINT_KEY = 'openclawGovernanceCheckpointIndex';

const SAFETY_ASSERTIONS = {
  localOnly: true,
  planningOnly: true,
  previewOnly: true,
  readOnly: true,
  nonExecutable: true,
  runtimeBridgeDisabled: true,
  noOpenClawCalls: true,
  noBackendForwarding: true,
  noBrowserAutomationApis: true,
  noRealBrowserActions: true,
  noClick: true,
  noTyping: true,
  noFormSubmit: true,
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

const PROHIBITED_CAPABILITIES = [
  'OpenClaw calls',
  'runtime bridge activation',
  'backend forwarding',
  'browser automation APIs',
  'real browser actions',
  'clicking',
  'typing',
  'form submission',
  'credential entry',
  'command dispatch',
  'scheduler',
  'polling',
  'trading',
  'broker actions',
  'wallet actions',
  'money movement',
  'external forwarding',
];

const ACTIVE_SAFETY_BOUNDARY = [
  'LOCAL_ONLY',
  'PLANNING_ONLY',
  'PREVIEW_ONLY',
  'READ_ONLY',
  'NON_EXECUTABLE',
  'RUNTIME_BRIDGE_DISABLED',
];

const FINAL_WARNING = 'This checkpoint index is local-only, planning-only, preview-only, read-only, and non-executable. It does not authorize OpenClaw calls, runtime bridge activation, backend forwarding, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function generateCheckpointIndex() {
  const phase14To23Summary = loadJSON('openclawGovernancePhase14To23Summary', null);
  const operatorApprovalRecords = loadJSON('openclawOperatorApprovalWorkflowRecords', []);
  const runtimePlan = loadJSON('openclawRuntimeImplementationPlan', null);
  const phase25FinalLock = loadJSON('openclawRuntimeImplementationPlanFinalLock', null);
  const phase26Review = loadJSON('openclawRuntimeBridgeImplementationPlanReview', null);
  const phase26FinalLock = loadJSON('openclawRuntimeBridgeImplementationPlanReviewFinalLock', null);

  const phaseStatusTable = [
    {
      phase: '14-23',
      name: 'Phase 14–23 Governance Summary',
      localStorageKey: 'openclawGovernancePhase14To23Summary',
      present: !!phase14To23Summary,
      status: phase14To23Summary?.overallStatus ?? null,
      generatedAt: phase14To23Summary?.generatedAt ?? null,
    },
    {
      phase: '24',
      name: 'Phase 24 Operator Approval Workflow',
      localStorageKey: 'openclawOperatorApprovalWorkflowRecords',
      present: operatorApprovalRecords.length > 0,
      status: operatorApprovalRecords.length > 0 ? operatorApprovalRecords[0]?.approvalDecision ?? null : null,
      generatedAt: operatorApprovalRecords.length > 0 ? operatorApprovalRecords[0]?.createdAt ?? null : null,
    },
    {
      phase: '25',
      name: 'Phase 25 Runtime Implementation Plan',
      localStorageKey: 'openclawRuntimeImplementationPlan',
      present: !!runtimePlan,
      status: runtimePlan?.implementationStatus ?? null,
      generatedAt: runtimePlan?.generatedAt ?? null,
    },
    {
      phase: '25-Lock',
      name: 'Phase 25 Runtime Implementation Plan Final Lock',
      localStorageKey: 'openclawRuntimeImplementationPlanFinalLock',
      present: !!phase25FinalLock,
      status: phase25FinalLock?.lockStatus ?? null,
      generatedAt: phase25FinalLock?.generatedAt ?? null,
    },
    {
      phase: '26',
      name: 'Phase 26 Runtime Bridge Implementation Plan Review',
      localStorageKey: 'openclawRuntimeBridgeImplementationPlanReview',
      present: !!phase26Review,
      status: phase26Review?.reviewDecision ?? null,
      generatedAt: phase26Review?.generatedAt ?? null,
    },
    {
      phase: '26-Lock',
      name: 'Phase 26 Runtime Bridge Implementation Plan Review Final Lock',
      localStorageKey: 'openclawRuntimeBridgeImplementationPlanReviewFinalLock',
      present: !!phase26FinalLock,
      status: phase26FinalLock?.lockStatus ?? null,
      generatedAt: phase26FinalLock?.generatedAt ?? null,
    },
  ];

  return {
    checkpointName: 'OPENCLAW_GOVERNANCE_CHECKPOINT_INDEX',
    generatedAt: new Date().toISOString(),
    checkpointLabel: 'VERIDAN_CORE_OPENCLAW_GOVERNANCE_CHECKPOINT_PHASE_26_LOCK_READY',
    highestCompletedPhase: 'PHASE_26_RUNTIME_BRIDGE_IMPLEMENTATION_PLAN_REVIEW',
    highestLockName: phase26FinalLock?.lockName ?? null,
    highestLockStatus: phase26FinalLock?.lockStatus ?? 'HOLD_FOR_REVIEW',
    phase14To23SummaryPresent: !!phase14To23Summary,
    phase24OperatorApprovalPresent: operatorApprovalRecords.length > 0,
    phase25RuntimePlanPresent: !!runtimePlan,
    phase25FinalLockPresent: !!phase25FinalLock,
    phase26ReviewPresent: !!phase26Review,
    phase26FinalLockPresent: !!phase26FinalLock,
    phaseStatusTable,
    activeSafetyBoundary: ACTIVE_SAFETY_BOUNDARY,
    prohibitedCapabilities: PROHIBITED_CAPABILITIES,
    nextSafePhase: 'PHASE_28_RUNTIME_BRIDGE_BOUNDARY_SPECIFICATION_PLANNING_ONLY',
    nextUnsafePhase: 'RUNTIME_BRIDGE_ACTIVATION_NOT_AUTHORIZED',
    authorizationFlags: AUTHORIZATION_FLAGS,
    safetyAssertions: SAFETY_ASSERTIONS,
    finalWarning: FINAL_WARNING,
  };
}

export default function OpenClawGovernanceCheckpointIndexPanel() {
  const [checkpoint, setCheckpoint] = useState(() => loadJSON(CHECKPOINT_KEY, null));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleGenerate = () => {
    try {
      const result = generateCheckpointIndex();
      try { localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(result, null, 2)); } catch {}
      setCheckpoint(result);
      setLastAction('Governance checkpoint index generated locally at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Checkpoint generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!checkpoint) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(checkpoint, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Checkpoint JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(CHECKPOINT_KEY);
      setCheckpoint(null);
      setLastAction('Checkpoint index cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 27 · Governance Cleanup + Checkpoint Index</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Governance Checkpoint Index
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 27 checkpoint summarizing Phases 14-26 completion status. No OpenClaw calls, no runtime activation, no execution.</div>
      </div>

      {/* Checkpoint name chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">OPENCLAW_GOVERNANCE_CHECKPOINT_INDEX</span>
      </div>

      {/* Highest checkpoint status card */}
      {checkpoint && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Checkpoint Label</div>
              <div className="text-[10px] text-primary font-bold mt-0.5">{checkpoint.checkpointLabel}</div>
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold text-right">Highest Lock Status</div>
              <div className={`text-[10px] font-bold mt-0.5 ${checkpoint.highestLockStatus === 'LOCK_READY' ? 'text-primary' : 'text-amber-500'}`}>
                {checkpoint.highestLockStatus}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-primary/10">
            <div className="text-[8px] text-slate-500">Highest Completed Phase: <span className="text-primary font-bold">{checkpoint.highestCompletedPhase}</span></div>
            {checkpoint.highestLockName && (
              <div className="text-[8px] text-slate-500 mt-1">Highest Lock: <span className="text-primary font-bold font-mono text-[7px]">{checkpoint.highestLockName}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Phase status table */}
      {checkpoint && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Phase Status Summary</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Present</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {checkpoint.phaseStatusTable.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-1.5 text-slate-500 font-bold">{row.phase}</td>
                    <td className="px-3 py-1.5 text-slate-300">{row.name}</td>
                    <td className="px-3 py-1.5">
                      <span className={`font-bold ${row.present ? 'text-primary' : 'text-slate-500'}`}>
                        {row.present ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-slate-400">{row.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active safety boundary chips */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Active Safety Boundary</div>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVE_SAFETY_BOUNDARY.map(boundary => (
            <span key={boundary} className="text-[7px] px-2 py-1 border border-primary/30 bg-primary/5 text-primary rounded font-bold uppercase tracking-wider">
              {boundary}
            </span>
          ))}
        </div>
      </div>

      {/* Prohibited capabilities list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Prohibited Capabilities</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {PROHIBITED_CAPABILITIES.map(cap => (
            <div key={cap} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300">{cap}</span>
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

      {/* Next phase info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
          <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Next Safe Phase</div>
          <div className="text-[9px] text-primary font-bold mt-1.5 break-words">PHASE_28_RUNTIME_BRIDGE_BOUNDARY_SPECIFICATION_PLANNING_ONLY</div>
        </div>
        <div className="bg-card border border-destructive/20 rounded-lg px-4 py-3">
          <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Next Unsafe Phase</div>
          <div className="text-[9px] text-destructive font-bold mt-1.5">RUNTIME_BRIDGE_ACTIVATION_NOT_AUTHORIZED</div>
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
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Governance Checkpoint Index
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!checkpoint}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Checkpoint JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!checkpoint}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Checkpoint Index
        </button>
      </div>

      {/* JSON preview */}
      {checkpoint && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Governance Checkpoint — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(checkpoint.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(checkpoint, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{CHECKPOINT_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only checkpoint index. No OpenClaw calls, no runtime activation, no backend forwarding, no browser automation, no execution, no dispatch, no scheduler, no polling.
      </div>
    </div>
  );
}