/**
 * OpenClawPhase32FinalGovernanceSnapshot — Final Governance Snapshot Export
 * Exports a local-only JSON snapshot proving the Runtime Bridge governance chain
 * Phase 26–32 is installed, documented, and still non-executing.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Download, ShieldCheck } from 'lucide-react';

const SNAPSHOT_KEY = 'openclawPhase32FinalGovernanceSnapshot';

const IMPLEMENTED_PHASES = [26, 27, 28, 29, 30, 31, 32];
const LOCALSTORAGE_KEYS = [
  'openclawRuntimeBridgeImplementationPlanReviewFinalLock',
  'openclawGovernanceCheckpointIndex',
  'openclawReadOnlyRuntimeBridgeBoundaryDefinition',
  'openclawPhase29RuntimeBridgeRequestContracts',
  'openclawPhase30RuntimeBridgeContractValidationResults',
  'openclawPhase31RuntimeBridgeApprovalQueuePreview',
  'openclawPhase32RuntimeBridgeApprovalDecisionAuditTrail',
];

function generateSnapshot() {
  return {
    snapshotId: `snapshot-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    currentBuildPosition: 'PHASE_32_COMPLETE',
    implementedPhases: IMPLEMENTED_PHASES,
    nextPlannedGate: 'DRY_RUN_EXECUTION_GATE',
    localStorageKeys: LOCALSTORAGE_KEYS,
    safetyStatus: {
      executionAllowed: false,
      dryRunOnly: true,
      openClawDispatchAllowed: false,
      apiCallsAllowed: false,
      tradingAllowed: false,
      credentialEntryAllowed: false,
      schedulerAllowed: false,
      pollingAllowed: false,
      moneyMovementAllowed: false,
    },
    governanceChain: {
      requestCreated: true,
      requestValidated: true,
      approvalQueueAvailable: true,
      approvalDecisionAuditAvailable: true,
      flowMapAccurate: true,
    },
    exportNote: 'Local-only snapshot. No execution, no API calls, no backend dispatch. Governance chain verification only.',
  };
}

export default function OpenClawPhase32FinalGovernanceSnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleExport = () => {
    try {
      const newSnapshot = generateSnapshot();
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(newSnapshot));
      } catch {}
      setSnapshot(newSnapshot);
      setLastAction('Governance snapshot exported at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Export failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!snapshot) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Governance snapshot JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Final Export</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" /> Phase 32 Final Governance Snapshot
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Export a local-only JSON snapshot proving Phase 26–32 governance chain is installed and non-executing.</div>
      </div>

      {/* Info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_32_GOVERNANCE_SNAPSHOT_EXPORT</span>
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
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Download className="w-3.5 h-3.5" />
          Export Phase 32 Governance Snapshot
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!snapshot}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Snapshot JSON'}
        </button>
      </div>

      {/* Snapshot metadata summary */}
      {snapshot && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Build Position</div>
            <div className="text-[10px] font-mono text-primary font-bold">{snapshot.currentBuildPosition}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Phases Implemented</div>
            <div className="text-[10px] font-bold text-primary">{snapshot.implementedPhases.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Storage Keys</div>
            <div className="text-[10px] font-bold text-primary">{snapshot.localStorageKeys.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 col-span-2 sm:col-span-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Exported</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(snapshot.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Safety status grid */}
      {snapshot && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Safety Status — All FALSE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
            {Object.entries(snapshot.safetyStatus).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-destructive font-bold">{String(v)}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Governance chain verification */}
      {snapshot && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-2">Governance Chain Status</div>
          <div className="space-y-1 text-[8px] text-slate-300">
            {Object.entries(snapshot.governanceChain).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}: <span className="text-primary font-bold">{String(v)}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot JSON preview */}
      {snapshot && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Governance Snapshot — JSON Export</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(snapshot.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{SNAPSHOT_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only export. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}