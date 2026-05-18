/**
 * OpenClawDryRunIntakeValidatorRecordBinding — Phase 46
 * Binds Phase 45 dry-run intake records to formal dry-run validator records.
 * UI-only · localStorage-only · browser-only · no execution.
 *
 * Does NOT:
 *   - Call OpenClaw, SafeBridge, MCP, brokers, banks, bureaus
 *   - Execute commands or dispatch actions
 *   - Make backend routes, fetch calls, or API mutations
 *   - Use timers, polling, or schedulers
 *   - Handle credentials or browser automation
 */

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const INTAKE_KEY = 'openclawPhase45DryRunValidatorIntakeRecords';
const VALIDATOR_KEY = 'openclawPhase46DryRunValidatorRecords';
const MAX_RECORDS = 50;

const SAFETY_CLAIMS = [
  'Created from eligible Phase 45 intake',
  'Validator record only',
  'Dry-run only',
  'Execution remains disabled',
  'Dispatch remains disabled',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'Browser-only local record',
];

const EXPORT_SAFETY_CLAIMS = [
  'Dry-run validator records only',
  'No live execution',
  'No dispatch',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'No OpenClaw command dispatch',
  'No backend mutation',
  'Browser-only export',
];

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isEligible(record) {
  return (
    record.dryRunStatus === 'READY_FOR_DRY_RUN_VALIDATION' &&
    record.executionAllowed === false &&
    record.executionStatus === 'NOT_EXECUTED' &&
    !!record.commandType &&
    !!record.intakeId &&
    !!record.sourceProposalId &&
    !!record.sourceValidationId
  );
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function OpenClawDryRunIntakeValidatorRecordBinding() {
  const [intakeRecords, setIntakeRecords] = useState([]);
  const [validatorRecords, setValidatorRecords] = useState([]);
  const [createdIds, setCreatedIds] = useState(new Set());
  const [lastAction, setLastAction] = useState(null);

  // Load on mount
  useEffect(() => {
    setIntakeRecords(loadFromStorage(INTAKE_KEY, []));
    setValidatorRecords(loadFromStorage(VALIDATOR_KEY, []));
  }, []);

  // Sync created IDs from existing validator records
  useEffect(() => {
    const ids = new Set(validatorRecords.map(r => r.sourceIntakeId).filter(Boolean));
    setCreatedIds(ids);
  }, [validatorRecords]);

  const handleCreateValidatorRecord = (intake) => {
    const newRecord = {
      validatorRecordId: generateId('phase46-validator'),
      createdAt: new Date().toISOString(),
      sourcePhase: 'PHASE_45_DRY_RUN_VALIDATOR_INTAKE',
      sourceIntakeId: intake.intakeId,
      sourceProposalId: intake.sourceProposalId,
      sourceValidationId: intake.sourceValidationId,
      commandType: intake.commandType,
      validatorStatus: 'READY_FOR_VALIDATOR_REVIEW',
      validationMode: 'DRY_RUN_ONLY',
      executionAllowed: false,
      executionStatus: 'NOT_EXECUTED',
      dispatchAllowed: false,
      dispatchStatus: 'NOT_DISPATCHED',
      safetyClaims: SAFETY_CLAIMS,
    };

    const updated = [newRecord, ...validatorRecords].slice(0, MAX_RECORDS);
    saveToStorage(VALIDATOR_KEY, updated);
    setValidatorRecords(updated);
    setCreatedIds(prev => new Set([...prev, intake.intakeId]));
    setLastAction(`Validator record created for intake ${intake.intakeId}`);
  };

  const handleExport = () => {
    const snapshot = {
      snapshotType: 'VERIDAN_DRY_RUN_VALIDATOR_RECORDS_PHASE_46',
      generatedAt: new Date().toISOString(),
      validatorRecords,
      recordCount: validatorRecords.length,
      safetyClaims: EXPORT_SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase46-dry-run-validator-records-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eligibleCount = intakeRecords.filter(isEligible).length;

  return (
    <div className="space-y-5 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-violet-500/5 border border-violet-500/20 rounded-sm">
        <div className="text-[11px] font-bold uppercase tracking-wide text-violet-400 mb-1">
          Phase 46 · Dry-Run Intake → Validator Record Binding
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Binds eligible Phase 45 intake records to formal dry-run validator record structure.
          Read-only · localStorage-only · no execution · no dispatch.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION LOCKED</span> — All validator records are created with
          executionAllowed=false, executionStatus=NOT_EXECUTED, dispatchAllowed=false, dispatchStatus=NOT_DISPATCHED.
        </p>
      </div>

      {/* Last Action Feedback */}
      {lastAction && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/5 border border-violet-500/20 rounded-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-[9px] text-violet-400">{lastAction}</span>
        </div>
      )}

      {/* ── Phase 45 Intake Records ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-200">Phase 45 Intake Records</div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Read from: <span className="text-blue-400">{INTAKE_KEY}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] px-2 py-0.5 border border-violet-500/30 bg-violet-500/5 text-violet-400 rounded font-bold uppercase">
              {eligibleCount} eligible
            </span>
            <span className="text-[8px] px-2 py-0.5 border border-border/40 bg-secondary/40 text-slate-400 rounded font-bold uppercase">
              {intakeRecords.length} total
            </span>
          </div>
        </div>

        {intakeRecords.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[10px] text-slate-400">
              No Phase 45 dry-run intake records found. Prepare dry-run intake before creating validator records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20">
                  {['createdAt', 'intakeId', 'sourceProposalId', 'sourceValidationId', 'commandType', 'dryRunStatus', 'executionAllowed', 'executionStatus', 'action'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {intakeRecords.map((rec, i) => {
                  const eligible = isEligible(rec);
                  const alreadyCreated = createdIds.has(rec.intakeId);
                  return (
                    <tr key={rec.intakeId || i} className={`${eligible ? 'hover:bg-secondary/10' : 'opacity-50'}`}>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                        {rec.createdAt ? new Date(rec.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-blue-400 font-mono max-w-[120px] truncate" title={rec.intakeId}>
                        {rec.intakeId || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-300 font-mono max-w-[100px] truncate" title={rec.sourceProposalId}>
                        {rec.sourceProposalId || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-300 font-mono max-w-[100px] truncate" title={rec.sourceValidationId}>
                        {rec.sourceValidationId || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{rec.commandType || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase ${
                          rec.dryRunStatus === 'READY_FOR_DRY_RUN_VALIDATION'
                            ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                            : 'border-slate-500/30 bg-slate-500/5 text-slate-400'
                        }`}>
                          {rec.dryRunStatus || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rec.executionAllowed === false
                          ? <span className="text-primary font-bold">false ✓</span>
                          : <span className="text-destructive font-bold">{String(rec.executionAllowed)}</span>
                        }
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase ${
                          rec.executionStatus === 'NOT_EXECUTED'
                            ? 'border-primary/30 bg-primary/5 text-primary'
                            : 'border-destructive/30 bg-destructive/5 text-destructive'
                        }`}>
                          {rec.executionStatus || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {alreadyCreated ? (
                          <span className="flex items-center gap-1 text-[7px] text-primary font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Created
                          </span>
                        ) : eligible ? (
                          <button
                            type="button"
                            onClick={() => handleCreateValidatorRecord(rec)}
                            className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors rounded-sm text-[7px] font-bold uppercase whitespace-nowrap"
                          >
                            Create Validator Record
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-[7px] text-slate-500">
                            <XCircle className="w-3 h-3" /> Ineligible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Eligibility Rules Reference ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Eligibility Rules</div>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {[
            'dryRunStatus === "READY_FOR_DRY_RUN_VALIDATION"',
            'executionAllowed === false',
            'executionStatus === "NOT_EXECUTED"',
            'commandType must exist',
            'intakeId must exist',
            'sourceProposalId must exist',
            'sourceValidationId must exist',
          ].map(rule => (
            <div key={rule} className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Validator Records History ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-200">Validator Records</div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Stored in: <span className="text-blue-400">{VALIDATOR_KEY}</span>
            </div>
          </div>
          <span className="text-[8px] px-2 py-0.5 border border-border/40 bg-secondary/40 text-slate-400 rounded font-bold uppercase">
            {validatorRecords.length} / {MAX_RECORDS} max
          </span>
        </div>

        {validatorRecords.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[9px] text-slate-500">No validator records created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20">
                  {['createdAt', 'validatorRecordId', 'sourceIntakeId', 'sourceProposalId', 'commandType', 'validatorStatus', 'validationMode', 'executionAllowed', 'dispatchAllowed', 'dispatchStatus'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {validatorRecords.map((rec, i) => (
                  <tr key={rec.validatorRecordId || i} className="hover:bg-secondary/10">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-violet-400 font-mono max-w-[120px] truncate" title={rec.validatorRecordId}>
                      {rec.validatorRecordId || '—'}
                    </td>
                    <td className="px-3 py-2 text-blue-400 font-mono max-w-[100px] truncate" title={rec.sourceIntakeId}>
                      {rec.sourceIntakeId || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono max-w-[100px] truncate" title={rec.sourceProposalId}>
                      {rec.sourceProposalId || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{rec.commandType || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-violet-500/30 bg-violet-500/10 text-violet-400">
                        {rec.validatorStatus || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-primary/30 bg-primary/5 text-primary">
                        {rec.validationMode || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-primary font-bold">false ✓</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-primary font-bold">false ✓</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-slate-500/30 bg-slate-500/5 text-slate-400">
                        {rec.dispatchStatus || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Export ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            disabled={validatorRecords.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Dry-Run Validator Records
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] font-mono text-muted-foreground/60 text-center italic">
          snapshotType: VERIDAN_DRY_RUN_VALIDATOR_RECORDS_PHASE_46 · Browser-local JSON export only · No backend writes
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 46 Safety Claims</div>
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