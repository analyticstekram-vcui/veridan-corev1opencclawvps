/**
 * OpenClawStatusRollup
 * Compact read-only card for the main Command Center Inspector panel.
 * Reads localStorage to summarize the current OpenClaw Evidence Archive state.
 *
 * Reads:  openclawCommandProposals
 *         openclawProposalReviews
 *         openclawProposalReviewEvidenceExports
 *         openclawReadOnlyGovernanceBaselineLocks
 *         openclawDryRunExecutionPlanningGates
 *         openclawDryRunActionContracts
 *         openclawDryRunActionContractValidationResults
 *         openclawDryRunActionDrafts
 *         openclawDryRunActionDraftValidationResults
 *         openclawDryRunSimulationPreviews
 *         openclawDryRunSimulationPreviewValidationResults
 *         openclawDryRunResultPackages
 *
 * Writes: NOTHING
 * Network: NONE
 * Execution: NONE
 */
import React, { useState } from 'react';
import { RefreshCw, ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const KEYS = {
  proposals:           'openclawCommandProposals',
  reviews:             'openclawProposalReviews',
  evidenceExports:     'openclawProposalReviewEvidenceExports',
  baselineLocks:       'openclawReadOnlyGovernanceBaselineLocks',
  planningGates:       'openclawDryRunExecutionPlanningGates',
  contracts:           'openclawDryRunActionContracts',
  contractValidations: 'openclawDryRunActionContractValidationResults',
  drafts:              'openclawDryRunActionDrafts',
  draftValidations:    'openclawDryRunActionDraftValidationResults',
  simPreviews:         'openclawDryRunSimulationPreviews',
  previewValidations:  'openclawDryRunSimulationPreviewValidationResults',
  resultPackages:      'openclawDryRunResultPackages',
};

// ── Helpers (same logic as OpenClawOperatorFlowDashboard) ─────────────────────
function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch { return []; }
}

function loadAll() {
  return Object.fromEntries(
    Object.entries(KEYS).map(([k, storageKey]) => [k, readJSON(storageKey)])
  );
}

function computeStage(data) {
  if (!data.proposals.length)           return { stage: 'NO_PROPOSAL_CREATED',            next: 'Create or load a command proposal' };
  if (!data.reviews.length)             return { stage: 'AWAITING_PROPOSAL_REVIEW',        next: 'Review latest proposal' };
  if (!data.evidenceExports.length)     return { stage: 'AWAITING_EVIDENCE_EXPORT',        next: 'Generate proposal review evidence export' };
  if (!data.baselineLocks.length)       return { stage: 'AWAITING_BASELINE_LOCK',          next: 'Generate read-only governance baseline lock' };
  if (!data.planningGates.length)       return { stage: 'AWAITING_DRY_RUN_PLANNING_GATE',  next: 'Generate dry-run planning gate' };
  if (!data.contracts.length)           return { stage: 'AWAITING_ACTION_CONTRACT',        next: 'Generate dry-run action contract' };
  if (!data.contractValidations.length) return { stage: 'AWAITING_CONTRACT_VALIDATION',   next: 'Validate dry-run action contract' };
  if (!data.drafts.length)              return { stage: 'AWAITING_DRAFT',                  next: 'Generate dry-run action draft' };
  if (!data.draftValidations.length)    return { stage: 'AWAITING_DRAFT_VALIDATION',       next: 'Validate dry-run action draft' };
  if (!data.simPreviews.length)         return { stage: 'AWAITING_SIMULATION_PREVIEW',     next: 'Generate dry-run simulation preview' };
  if (!data.previewValidations.length)  return { stage: 'AWAITING_PREVIEW_VALIDATION',     next: 'Validate simulation preview' };
  if (!data.resultPackages.length)      return { stage: 'AWAITING_RESULT_PACKAGE',         next: 'Generate dry-run result package' };
  return                                       { stage: 'LOCAL_DRY_RUN_PACKAGE_READY',     next: 'Review operator summary before further build' };
}

function checkSafe(record) {
  if (!record) return true;
  return [
    record.executionStatus     === undefined || record.executionStatus     === 'NOT_EXECUTED',
    record.liveExecutionStatus === undefined || record.liveExecutionStatus === 'DISABLED',
    record.tradingStatus       === undefined || record.tradingStatus       === 'DISABLED',
    record.credentialStatus    === undefined || record.credentialStatus    === 'NOT_ACCESSED',
    record.moneyMovementStatus === undefined || record.moneyMovementStatus === 'DISABLED',
  ].every(Boolean);
}

function computeSafety(data) {
  const records = [
    data.contractValidations[0], data.draftValidations[0],
    data.previewValidations[0],  data.resultPackages[0],
    data.simPreviews[0],         data.drafts[0],
    data.contracts[0],           data.planningGates[0],
    data.baselineLocks[0],
  ];
  return records.every(checkSafe) ? 'SAFE_LOCAL_ONLY' : 'HOLD';
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function OpenClawStatusRollup() {
  const [data, setData] = useState(() => loadAll());

  const { stage, next } = computeStage(data);
  const safety = computeSafety(data);
  const isComplete = stage === 'LOCAL_DRY_RUN_PACKAGE_READY';
  const isSafe     = safety === 'SAFE_LOCAL_ONLY';
  const hasPackage = data.resultPackages.length > 0;

  return (
    <div className="px-3 py-2 border-b border-border/50 space-y-2">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">OpenClaw Archive</div>
        <button
          type="button"
          onClick={() => setData(loadAll())}
          className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Refresh OpenClaw status"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Stage */}
      <div>
        <div className="text-[8px] font-mono text-muted-foreground/40 uppercase mb-0.5">Stage</div>
        <div className={`text-[9px] font-mono font-bold leading-tight ${isComplete ? 'text-primary' : 'text-amber-400'}`}>
          {stage}
        </div>
      </div>

      {/* Safety Status */}
      <div className="flex items-center gap-1.5">
        {isSafe
          ? <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          : <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}
        <span className={`text-[9px] font-mono font-bold ${isSafe ? 'text-primary' : 'text-destructive'}`}>
          {safety}
        </span>
      </div>

      {/* Next Allowed Action */}
      <div>
        <div className="text-[8px] font-mono text-muted-foreground/40 uppercase mb-0.5">Next Action</div>
        <div className="text-[9px] font-mono text-muted-foreground/80 leading-tight">{next}</div>
      </div>

      {/* System Mode Grid */}
      <div className="grid grid-cols-2 gap-0.5 text-[8px] font-mono">
        {[
          { label: 'Execution',  value: 'DISABLED' },
          { label: 'Trading',    value: 'DISABLED' },
          { label: 'Creds',      value: 'NOT ACCESSED' },
          { label: 'Money',      value: 'DISABLED' },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col px-1.5 py-1 bg-primary/5 border border-primary/10 rounded-sm">
            <span className="text-muted-foreground/40 uppercase text-[7px]">{label}</span>
            <span className="text-primary font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Result Package status */}
      <div className="flex items-center gap-1.5">
        {hasPackage
          ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
          : <Clock className="w-3 h-3 text-slate-500 shrink-0" />}
        <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">Result Package:</span>
        <span className={`text-[8px] font-mono font-bold ${hasPackage ? 'text-primary' : 'text-slate-500'}`}>
          {hasPackage ? 'READY' : 'NOT READY'}
        </span>
      </div>

    </div>
  );
}