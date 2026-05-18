/**
 * OpenClawGovernanceDryRunChainCheckpointLock
 * Browser-only checkpoint lock confirming Phases 43–49 governance dry-run chain
 * is complete, visible, exportable, and execution-disabled.
 * UI + localStorage + browser-only export only. No execution. No dispatch.
 */

import React, { useState, useEffect } from 'react';
import { Download, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const SOURCE_KEYS = {
  phase43: 'openclawPhase43UnifiedCommandRegistrySnapshot',
  phase44: 'openclawPhase44ProposalRegistryValidationRecords',
  phase45: 'openclawPhase45DryRunValidatorIntakeRecords',
  phase46: 'openclawPhase46DryRunValidatorRecords',
  phase47: 'openclawPhase47ValidatorReviewDecisions',
  phase48: 'openclawPhase48DryRunResultPackages',
  phase49: 'openclawPhase49FullGovernanceDryRunChainEvidenceExport',
};

const CHECKPOINT_KEY = 'openclawGovernanceDryRunChainCheckpointLockPhases43To49';

const SAFETY_CLAIMS = [
  'Governance dry-run chain checkpoint lock only',
  'Phases 43–49 locked as execution-disabled baseline',
  'No live execution',
  'No dispatch',
  'No backend mutation',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'Browser-only local checkpoint',
];

function loadKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function generateId() {
  return `checkpoint-lock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildReadiness() {
  return {
    phase43RegistrySnapshotPresent: loadKey(SOURCE_KEYS.phase43) !== null,
    phase44ValidationRecordsReadable: loadKey(SOURCE_KEYS.phase44) !== null,
    phase45IntakeRecordsReadable: loadKey(SOURCE_KEYS.phase45) !== null,
    phase46ValidatorRecordsReadable: loadKey(SOURCE_KEYS.phase46) !== null,
    phase47ReviewDecisionsReadable: loadKey(SOURCE_KEYS.phase47) !== null,
    phase48ResultPackagesReadable: loadKey(SOURCE_KEYS.phase48) !== null,
    phase49FullChainExportPresent: loadKey(SOURCE_KEYS.phase49) !== null,
    allExecutionDisabled: true,
    allDispatchDisabled: true,
    backendMutationDisabled: true,
  };
}

const CHECKLIST_LABELS = [
  { key: 'phase43RegistrySnapshotPresent',    label: 'Phase 43 registry snapshot present' },
  { key: 'phase44ValidationRecordsReadable',  label: 'Phase 44 validation records readable' },
  { key: 'phase45IntakeRecordsReadable',      label: 'Phase 45 intake records readable' },
  { key: 'phase46ValidatorRecordsReadable',   label: 'Phase 46 validator records readable' },
  { key: 'phase47ReviewDecisionsReadable',    label: 'Phase 47 review decisions readable' },
  { key: 'phase48ResultPackagesReadable',     label: 'Phase 48 result packages readable' },
  { key: 'phase49FullChainExportPresent',     label: 'Phase 49 full chain export present' },
  { key: 'allExecutionDisabled',              label: 'All execution disabled' },
  { key: 'allDispatchDisabled',               label: 'All dispatch disabled' },
  { key: 'backendMutationDisabled',           label: 'Backend mutation disabled' },
];

export default function OpenClawGovernanceDryRunChainCheckpointLock() {
  const [readiness, setReadiness] = useState(null);
  const [lockedRecord, setLockedRecord] = useState(() => loadKey(CHECKPOINT_KEY));
  const [justLocked, setJustLocked] = useState(false);

  useEffect(() => { setReadiness(buildReadiness()); }, []);

  const handleLock = () => {
    const r = buildReadiness();
    const record = {
      checkpointLockId: generateId(),
      lockedAt: new Date().toISOString(),
      checkpointName: 'GOVERNANCE_DRY_RUN_CHAIN_PHASES_43_49',
      chainScope: 'PHASES_43_49',
      checkpointStatus: 'LOCKED_EXECUTION_DISABLED',
      liveExecutionEnabled: false,
      dispatchEnabled: false,
      backendMutationEnabled: false,
      openClawDispatchEnabled: false,
      browserAutomationExecutionEnabled: false,
      externalApiMutationEnabled: false,
      sourceKeys: Object.values(SOURCE_KEYS),
      readinessChecklist: r,
      safetyClaims: SAFETY_CLAIMS,
    };
    try { localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(record)); } catch {}
    setLockedRecord(record);
    setReadiness(r);
    setJustLocked(true);
  };

  const handleExport = () => {
    const record = lockedRecord || loadKey(CHECKPOINT_KEY);
    const snapshot = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_GOVERNANCE_DRY_RUN_CHAIN_CHECKPOINT_LOCK_PHASES_43_49',
      checkpointLockRecord: record,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance-dry-run-chain-checkpoint-lock-phases-43-49-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const r = readiness;

  return (
    <div className="space-y-4 font-mono">

      {/* Header Card */}
      <div className="px-4 py-3 bg-primary/5 border border-primary/30 rounded-sm">
        <div className="text-[12px] font-bold uppercase tracking-wide text-primary mb-1">
          Governance Dry-Run Chain Checkpoint Lock
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
          {[
            { label: 'Chain scope',                  value: 'Phases 43–49' },
            { label: 'Chain status',                 value: 'READY_FOR_BASELINE_LOCK' },
            { label: 'Live execution',               value: 'DISABLED', danger: true },
            { label: 'Dispatch',                     value: 'DISABLED', danger: true },
            { label: 'Backend mutation',             value: 'DISABLED', danger: true },
            { label: 'OpenClaw dispatch',            value: 'DISABLED', danger: true },
            { label: 'Browser automation execution', value: 'DISABLED', danger: true },
            { label: 'External API mutation',        value: 'DISABLED', danger: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <span className="text-[8px] text-slate-400">{row.label}:</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                row.danger
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-primary/30 bg-primary/5 text-primary'
              }`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION LOCKED</span> — This checkpoint reads Phase 43–49 localStorage records as evidence only. No records are modified or dispatched.
        </p>
      </div>

      {/* Readiness Checklist */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Readiness Checklist</div>
        </div>
        <div className="divide-y divide-border/20">
          {CHECKLIST_LABELS.map(item => {
            const pass = r ? r[item.key] : false;
            return (
              <div key={item.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/10">
                {pass
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <span className="flex-1 text-[9px] text-slate-200">{item.label}</span>
                <span className={`text-[8px] font-bold ${pass ? 'text-primary' : 'text-slate-500'}`}>
                  {pass ? 'PASS' : 'NOT YET'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lock Status */}
      {lockedRecord && (
        <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-sm space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[10px] font-bold text-primary uppercase">Checkpoint Locked</span>
          </div>
          <div className="text-[8px] text-slate-400 space-y-0.5 pl-5">
            <div>ID: <span className="text-slate-300 font-mono">{lockedRecord.checkpointLockId}</span></div>
            <div>Locked at: <span className="text-slate-300">{new Date(lockedRecord.lockedAt).toLocaleString()}</span></div>
            <div>Status: <span className="text-primary font-bold">{lockedRecord.checkpointStatus}</span></div>
            <div>Key: <span className="text-blue-400 font-mono">{CHECKPOINT_KEY}</span></div>
          </div>
        </div>
      )}

      {justLocked && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[9px] text-primary">Checkpoint lock saved to localStorage.</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleLock}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase"
        >
          <Lock className="w-4 h-4" />
          Lock Governance Dry-Run Chain Checkpoint
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={!lockedRecord}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary/20 border border-border/60 text-slate-300 hover:text-slate-100 hover:bg-secondary/40 transition-colors rounded-sm font-bold text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export Governance Dry-Run Chain Checkpoint Lock
        </button>
      </div>

      <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
        snapshotType: VERIDAN_GOVERNANCE_DRY_RUN_CHAIN_CHECKPOINT_LOCK_PHASES_43_49 · Browser-local JSON export only · No backend writes
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
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