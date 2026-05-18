/**
 * OpenClawExecutionReadinessBoundaryMap — Phase 50
 * Browser-only panel showing what is still required before Veridan Core can move
 * from governance/dry-run mode toward any controlled execution mode.
 * This phase does NOT enable execution.
 * UI + localStorage read/export only. No execution. No dispatch.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, XCircle, Lock } from 'lucide-react';

const CHECKPOINT_KEY = 'openclawGovernanceDryRunChainCheckpointLockPhases43To49';
const EXPORT_KEY = 'openclawPhase50ExecutionReadinessBoundaryMap';

const SAFETY_CLAIMS = [
  'Execution readiness map only',
  'No live execution',
  'No dispatch',
  'No backend mutation',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'Planning and sandbox design only',
  'Browser-only export',
];

const READINESS_CATEGORIES = [
  {
    id: 'security',
    label: 'A. Security Boundary',
    items: [
      'Secret storage model defined',
      'Backend environment variable policy defined',
      'Credential handling policy defined',
      'Cloudflare Access boundary confirmed',
      'Operator authentication boundary confirmed',
    ],
  },
  {
    id: 'execution_policy',
    label: 'B. Execution Policy Boundary',
    items: [
      'Command allowlist for execution mode defined',
      'High-risk command blocklist confirmed',
      'Approval thresholds defined',
      'Rollback/kill-switch policy defined',
      'Rate limits defined',
    ],
  },
  {
    id: 'backend',
    label: 'C. Backend Boundary',
    items: [
      'Backend route allowlist defined',
      'Mutation route policy defined',
      'Audit logging policy defined',
      'Replay protection policy defined',
      'Error handling policy defined',
    ],
  },
  {
    id: 'openclaw',
    label: 'D. OpenClaw Boundary',
    items: [
      'OpenClaw gateway health confirmed',
      'OpenClaw auth boundary confirmed',
      'OpenClaw dispatch policy defined',
      'MCP usage policy defined',
      'Browser automation policy defined',
    ],
  },
  {
    id: 'trading_money',
    label: 'E. Trading / Money Boundary',
    items: [
      'Broker API sandbox selected',
      'Paper trading mode confirmed',
      'Max loss limits defined',
      'Max order size defined',
      'Live trading disabled until separate approval',
      'Bank/money movement disabled until separate approval',
    ],
  },
  {
    id: 'evidence',
    label: 'F. Evidence Boundary',
    items: [
      'Dry-run chain checkpoint locked',
      'Evidence export available',
      'Operator review records available',
      'Result package records available',
      'Future execution evidence format defined',
    ],
  },
];

function loadKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function OpenClawExecutionReadinessBoundaryMap() {
  const [checkpoint, setCheckpoint] = useState(null);
  const [lastExportedAt, setLastExportedAt] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    setCheckpoint(loadKey(CHECKPOINT_KEY));
  }, []);

  const checkpointPresent = checkpoint !== null;

  const handleExport = () => {
    const categoriesForExport = READINESS_CATEGORIES.map(cat => ({
      category: cat.label,
      status: 'NOT_READY',
      items: cat.items.map(item => ({ requirement: item, status: 'NOT_READY' })),
    }));

    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_EXECUTION_READINESS_BOUNDARY_MAP_PHASE_50',
      currentMode: 'GOVERNANCE_DRY_RUN_LOCKED',
      checkpointPresent,
      readinessStatus: 'NOT_READY_FOR_EXECUTION',
      executionGate: 'CLOSED',
      nextAllowedMode: 'PLANNING_AND_SANDBOX_DESIGN_ONLY',
      readinessCategories: categoriesForExport,
      safetyClaims: SAFETY_CLAIMS,
    };

    try { localStorage.setItem(EXPORT_KEY, JSON.stringify(exportPackage)); } catch {}

    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase50-execution-readiness-boundary-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportedAt(new Date().toISOString());
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <div className="text-[12px] font-bold uppercase tracking-wide text-amber-400 mb-1">
          Execution Readiness Boundary Map
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Phase 50 · Defines what remains required before any controlled execution mode is permitted.
          This phase does not enable execution.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION GATE: CLOSED</span> — readinessStatus is NOT_READY_FOR_EXECUTION.
          nextAllowedMode is PLANNING_AND_SANDBOX_DESIGN_ONLY.
        </p>
      </div>

      {/* Missing checkpoint warning */}
      {!checkpointPresent && (
        <div className="flex items-start gap-2 px-3 py-3 bg-destructive/5 border border-destructive/20 rounded-sm">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[9px] text-destructive/90">
            Governance Dry-Run Chain checkpoint lock not found. Lock Phases 43–49 before reviewing execution readiness.
          </p>
        </div>
      )}

      {/* Current State Card */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Current State</div>
        </div>
        <div className="p-3 grid grid-cols-1 gap-1.5">
          {[
            { label: 'Current mode',           value: 'GOVERNANCE_DRY_RUN_LOCKED',          color: 'text-amber-400' },
            { label: 'Checkpoint required',    value: 'GOVERNANCE_DRY_RUN_CHAIN_PHASES_43_49', color: 'text-slate-300' },
            { label: 'Checkpoint present',     value: checkpointPresent ? 'true' : 'false',  color: checkpointPresent ? 'text-primary' : 'text-destructive' },
            { label: 'Readiness status',       value: 'NOT_READY_FOR_EXECUTION',             color: 'text-destructive' },
            { label: 'Execution gate',         value: 'CLOSED',                              color: 'text-destructive' },
            { label: 'Next allowed mode',      value: 'PLANNING_AND_SANDBOX_DESIGN_ONLY',    color: 'text-amber-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{row.label}:</span>
              <span className={`text-[8px] font-bold font-mono ${row.color}`}>{row.value}</span>
            </div>
          ))}

          {/* Disabled gates */}
          {[
            'Live execution',
            'Dispatch',
            'Backend mutation',
            'OpenClaw dispatch',
            'Browser automation execution',
            'External API mutation',
          ].map(label => (
            <div key={label} className="flex items-center justify-between gap-3 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{label}:</span>
              <span className="text-[8px] px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded font-bold uppercase">DISABLED</span>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Categories */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Readiness Categories</div>
          <div className="text-[8px] text-slate-500 mt-0.5">All categories status: NOT_READY</div>
        </div>
        <div className="divide-y divide-border/20">
          {READINESS_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-200">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/5 text-amber-400 rounded font-bold uppercase">NOT_READY</span>
                  <span className={`text-[9px] text-slate-400 transition-transform ${expandedCategory === cat.id ? 'rotate-90' : ''}`}>▶</span>
                </div>
              </button>
              {expandedCategory === cat.id && (
                <div className="px-4 pb-3 space-y-1">
                  {cat.items.map(item => (
                    <div key={item} className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 border border-border/20 rounded-sm">
                      <XCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
                      <span className="text-[8px] text-slate-400">{item}</span>
                      <span className="ml-auto text-[7px] text-amber-500/70 font-bold">NOT_READY</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-sm space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-[10px] font-bold text-destructive uppercase">Execution Gate Closed</span>
        </div>
        {[
          { label: 'readinessStatus', value: 'NOT_READY_FOR_EXECUTION' },
          { label: 'executionGate',   value: 'CLOSED' },
          { label: 'nextAllowedMode', value: 'PLANNING_AND_SANDBOX_DESIGN_ONLY' },
        ].map(row => (
          <div key={row.label} className="flex items-center gap-2 text-[8px] pl-5">
            <span className="text-slate-500">{row.label}:</span>
            <span className="text-slate-300 font-mono font-bold">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase"
          >
            <Download className="w-4 h-4" />
            Export Execution Readiness Boundary Map
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 space-y-0.5">
          <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
            snapshotType: VERIDAN_EXECUTION_READINESS_BOUNDARY_MAP_PHASE_50 · Browser-local JSON only · No backend writes
          </div>
          <div className="text-[8px] font-mono text-blue-400/60 text-center">
            Stores to: {EXPORT_KEY}
          </div>
          {lastExportedAt && (
            <div className="text-[8px] font-mono text-primary/70 text-center">
              ✓ Last exported: {new Date(lastExportedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 50 Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(claim => (
            <span key={claim} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">
              {claim}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}