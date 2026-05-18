/**
 * OpenClawDryRunValidatorIntakeBinding
 * Phase 45 — Dry-Run Validator Intake Binding for Veridan Core
 * UI + localStorage + browser-only export only.
 *
 * Does NOT:
 *   - Make backend / fetch / OpenClaw / SafeBridge / MCP calls
 *   - Call broker / bank / bureau / payment systems
 *   - Handle credentials
 *   - Execute browser automation
 *   - Use API mutation logic
 *   - Use timers / polling / schedulers
 */

import React, { useState } from 'react';
import { AlertCircle, Download, ShieldCheck, CheckCircle2, XCircle, PlusCircle } from 'lucide-react';

const PHASE44_LS_KEY = 'openclawPhase44ProposalRegistryValidationRecords';
const INTAKE_LS_KEY  = 'openclawPhase45DryRunValidatorIntakeRecords';
const MAX_RECORDS    = 50;

const BLOCKED_EXECUTION_MODES = ['BLOCKED_EXECUTION'];

const INTAKE_SAFETY_CLAIMS = [
  'Registry validation passed',
  'Dry-run intake only',
  'Execution remains disabled',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'Browser-only local record',
];

const EXPORT_SAFETY_CLAIMS = [
  'Dry-run validator intake only',
  'No live execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'No OpenClaw command dispatch',
  'No backend mutation',
  'Browser-only export',
];

function loadRecords(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // Storage quota — skip silently
  }
}

function isEligible(rec) {
  return (
    rec.registryMatch === true &&
    rec.approvedForReview === true &&
    rec.approvedForDryRun === true &&
    rec.executionAllowed === false &&
    Array.isArray(rec.rejectionReasons) &&
    rec.rejectionReasons.length === 0 &&
    !BLOCKED_EXECUTION_MODES.includes(rec.requestedMode) &&
    !(rec.registrySnapshot?.commandGroup === 'BLOCKED_EXECUTION')
  );
}

function createIntakeRecord(phase44Record) {
  return {
    intakeId: `phase45-intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    sourcePhase: 'PHASE_44_PROPOSAL_REGISTRY_VALIDATION',
    sourceProposalId: phase44Record.proposalId,
    sourceValidationId: phase44Record.validationId,
    commandType: phase44Record.commandType,
    dryRunStatus: 'READY_FOR_DRY_RUN_VALIDATION',
    executionAllowed: false,
    executionStatus: 'NOT_EXECUTED',
    safetyClaims: INTAKE_SAFETY_CLAIMS,
  };
}

export default function OpenClawDryRunValidatorIntakeBinding() {
  const phase44Records = loadRecords(PHASE44_LS_KEY);
  const [intakeRecords, setIntakeRecords] = useState(() => loadRecords(INTAKE_LS_KEY));
  const [lastIntake, setLastIntake] = useState(null);
  const [preparedIds, setPreparedIds] = useState(new Set());

  if (phase44Records.length === 0) {
    return (
      <div className="flex items-start gap-3 px-4 py-4 bg-amber-500/5 border border-amber-500/30 rounded-sm font-mono">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-400">
          No Phase 44 proposal registry validation records found. Validate a proposal before preparing dry-run intake.
        </p>
      </div>
    );
  }

  const handlePrepareIntake = (rec) => {
    const intake = createIntakeRecord(rec);
    const updated = [intake, ...intakeRecords].slice(0, MAX_RECORDS);
    setIntakeRecords(updated);
    saveRecords(INTAKE_LS_KEY, updated);
    setLastIntake(intake);
    setPreparedIds(prev => new Set([...prev, rec.validationId]));
  };

  const handleExport = () => {
    const snapshot = {
      snapshotType: 'VERIDAN_DRY_RUN_VALIDATOR_INTAKE_PHASE_45',
      generatedAt: new Date().toISOString(),
      totalRecords: intakeRecords.length,
      intakeRecords,
      safetyClaims: EXPORT_SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-dry-run-intake-phase45-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearIntake = () => {
    setIntakeRecords([]);
    try { localStorage.removeItem(INTAKE_LS_KEY); } catch {}
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/30 rounded-sm">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-400 leading-relaxed">
          <span className="font-bold">Phase 45 — Dry-Run Validator Intake Binding</span> — Only Phase 44 registry-validated proposals that passed all checks may be prepared for dry-run intake. No execution. No backend calls.
        </p>
      </div>

      {/* Source Count */}
      <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm text-[9px]">
        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        <span className="text-primary/80">
          Phase 44 records loaded — <span className="font-bold">{phase44Records.length}</span> total,{' '}
          <span className="font-bold text-primary">{phase44Records.filter(isEligible).length}</span> eligible for dry-run intake.
        </span>
      </div>

      {/* Phase 44 Records Table */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Phase 44 Validation Records
          </div>
        </div>

        {/* Column Headers */}
        <div className="hidden md:grid grid-cols-9 gap-1 px-4 py-2 bg-secondary/20 border-b border-border/30 text-[7px] uppercase tracking-wider text-slate-600">
          <span className="col-span-2">Validated At</span>
          <span>Proposal ID</span>
          <span>Command Type</span>
          <span>Match</span>
          <span>Review</span>
          <span>Dry-Run</span>
          <span>Rejections</span>
          <span>Action</span>
        </div>

        <div className="divide-y divide-border/20 max-h-72 overflow-y-auto">
          {phase44Records.map((rec) => {
            const eligible = isEligible(rec);
            const alreadyPrepared = preparedIds.has(rec.validationId);
            return (
              <div key={rec.validationId} className="grid grid-cols-1 md:grid-cols-9 gap-1 px-4 py-2.5 text-[8px] hover:bg-secondary/10 transition-colors items-center">
                <span className="col-span-2 text-slate-400 font-mono">{new Date(rec.validatedAt).toLocaleString()}</span>
                <span className="text-slate-300 truncate">{rec.proposalId}</span>
                <span className="text-slate-300 font-mono truncate">{rec.commandType}</span>
                <span className={rec.registryMatch ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                  {rec.registryMatch ? 'YES' : 'NO'}
                </span>
                <span className={rec.approvedForReview ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                  {rec.approvedForReview ? 'PASS' : 'FAIL'}
                </span>
                <span className={rec.approvedForDryRun ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                  {rec.approvedForDryRun ? 'YES' : 'NO'}
                </span>
                <span className={rec.rejectionReasons?.length > 0 ? 'text-destructive font-bold' : 'text-slate-500'}>
                  {rec.rejectionReasons?.length ?? 0}
                </span>
                <span>
                  {eligible ? (
                    <button
                      type="button"
                      onClick={() => handlePrepareIntake(rec)}
                      disabled={alreadyPrepared}
                      className={`flex items-center gap-1 px-2 py-1 border rounded-sm text-[8px] font-bold uppercase transition-colors ${
                        alreadyPrepared
                          ? 'bg-primary/5 border-primary/20 text-primary/40 cursor-default'
                          : 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <PlusCircle className="w-2.5 h-2.5" />
                      {alreadyPrepared ? 'Prepared' : 'Prepare Dry-Run Intake'}
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-secondary/30 border border-border/30 text-slate-600 text-[8px] rounded-sm uppercase">
                      Not Eligible
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Intake Created */}
      {lastIntake && (
        <div className="bg-card border border-primary/30 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <div className="text-[10px] font-bold uppercase text-primary">Dry-Run Intake Record Created</div>
          </div>
          <div className="p-4 space-y-1.5">
            {[
              { k: 'Intake ID',             v: lastIntake.intakeId },
              { k: 'Created At',            v: new Date(lastIntake.createdAt).toLocaleString() },
              { k: 'Source Phase',          v: lastIntake.sourcePhase },
              { k: 'Source Proposal ID',    v: lastIntake.sourceProposalId },
              { k: 'Source Validation ID',  v: lastIntake.sourceValidationId },
              { k: 'Command Type',          v: lastIntake.commandType },
              { k: 'Dry-Run Status',        v: lastIntake.dryRunStatus },
              { k: 'Execution Allowed',     v: 'false', vc: 'text-destructive font-bold' },
              { k: 'Execution Status',      v: lastIntake.executionStatus, vc: 'text-amber-400 font-bold' },
            ].map(({ k, v, vc }) => (
              <div key={k} className="flex items-start justify-between gap-2 px-3 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                <span className="text-[8px] text-slate-500 uppercase shrink-0">{k}</span>
                <span className={`text-[9px] font-mono text-right break-all ${vc || 'text-slate-200'}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intake History Table */}
      {intakeRecords.length > 0 && (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Dry-Run Intake History <span className="text-slate-500 font-normal">({intakeRecords.length}/{MAX_RECORDS})</span>
            </div>
            <button
              type="button"
              onClick={handleClearIntake}
              className="px-2 py-0.5 border border-border/40 text-slate-400 hover:text-slate-300 text-[8px] uppercase rounded-sm transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Column Headers */}
          <div className="hidden md:grid grid-cols-8 gap-1 px-4 py-2 bg-secondary/20 border-b border-border/30 text-[7px] uppercase tracking-wider text-slate-600">
            <span className="col-span-2">Created At</span>
            <span>Intake ID</span>
            <span>Source Proposal</span>
            <span>Source Validation</span>
            <span>Command Type</span>
            <span>Dry-Run Status</span>
            <span>Exec Status</span>
          </div>

          <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
            {intakeRecords.map((rec) => (
              <div key={rec.intakeId} className="grid grid-cols-1 md:grid-cols-8 gap-1 px-4 py-2 text-[8px] hover:bg-secondary/10 transition-colors">
                <span className="col-span-2 text-slate-400 font-mono">{new Date(rec.createdAt).toLocaleString()}</span>
                <span className="text-slate-300 font-mono truncate">{rec.intakeId}</span>
                <span className="text-slate-300 truncate">{rec.sourceProposalId}</span>
                <span className="text-slate-400 truncate">{rec.sourceValidationId}</span>
                <span className="text-slate-300 font-mono truncate">{rec.commandType}</span>
                <span className="text-amber-400 font-bold text-[7px]">{rec.dryRunStatus}</span>
                <span className="text-destructive font-bold">{rec.executionStatus}</span>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-border/30 text-[8px] text-slate-600 italic">
            localStorage · Last {MAX_RECORDS} records · executionAllowed: false · executionStatus: NOT_EXECUTED for all records
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            disabled={intakeRecords.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Dry-Run Intake Records
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] text-muted-foreground/60 text-center italic">
          Browser-local JSON export only · No backend writes · No API calls · No execution
        </div>
      </div>

      {/* Safety Footer */}
      <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-sm text-[8px] text-primary/70">
        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
        <span>Phase 45 — executionAllowed: false · executionStatus: NOT_EXECUTED for every intake record. Only registry-validated proposals accepted. No live execution. No backend calls.</span>
      </div>
    </div>
  );
}