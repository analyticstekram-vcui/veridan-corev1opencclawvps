/**
 * OpenClawOperatorFlowDashboard
 * Read-only dashboard summarizing the entire OpenClaw local governance
 * and dry-run preparation chain in plain language.
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
 * Writes: NOTHING — strictly read-only.
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * No localStorage.setItem, no localStorage.removeItem, no timers, no events.
 */
import React, { useState } from 'react';
import {
  ShieldCheck, AlertCircle, CheckCircle2, Clock,
  RefreshCw, ChevronRight, XCircle, Activity, ChevronDown
} from 'lucide-react';

// ── Storage keys (READ ONLY) ───────────────────────────────────────────────────
const KEYS = {
  proposals:              'openclawCommandProposals',
  reviews:                'openclawProposalReviews',
  evidenceExports:        'openclawProposalReviewEvidenceExports',
  baselineLocks:          'openclawReadOnlyGovernanceBaselineLocks',
  planningGates:          'openclawDryRunExecutionPlanningGates',
  contracts:              'openclawDryRunActionContracts',
  contractValidations:    'openclawDryRunActionContractValidationResults',
  drafts:                 'openclawDryRunActionDrafts',
  draftValidations:       'openclawDryRunActionDraftValidationResults',
  simPreviews:            'openclawDryRunSimulationPreviews',
  previewValidations:     'openclawDryRunSimulationPreviewValidationResults',
  resultPackages:         'openclawDryRunResultPackages',
};

const BLOCKED_CAPABILITIES = [
  'LIVE_TRADE', 'PAPER_TRADE', 'BROKER_ORDER', 'BANK_TRANSFER', 'CRYPTO_TRANSFER',
  'BROWSER_CLICK', 'BROWSER_TYPE', 'BROWSER_SUBMIT',
  'API_POST', 'API_PATCH', 'API_DELETE',
  'CREDENTIAL_READ', 'SECRET_EXPOSURE', 'FILE_DELETE', 'SCHEDULED_EXECUTION',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Stage logic ────────────────────────────────────────────────────────────────
function computeStage(data) {
  if (!data.proposals.length)
    return { stage: 'NO_PROPOSAL_CREATED', nextAllowedAction: 'Create or load a command proposal' };
  if (!data.reviews.length)
    return { stage: 'AWAITING_PROPOSAL_REVIEW', nextAllowedAction: 'Review latest proposal' };
  if (!data.evidenceExports.length)
    return { stage: 'AWAITING_EVIDENCE_EXPORT', nextAllowedAction: 'Generate proposal review evidence export' };
  if (!data.baselineLocks.length)
    return { stage: 'AWAITING_BASELINE_LOCK', nextAllowedAction: 'Generate read-only governance baseline lock' };
  if (!data.planningGates.length)
    return { stage: 'AWAITING_DRY_RUN_PLANNING_GATE', nextAllowedAction: 'Generate dry-run planning gate' };
  if (!data.contracts.length)
    return { stage: 'AWAITING_ACTION_CONTRACT', nextAllowedAction: 'Generate dry-run action contract' };
  if (!data.contractValidations.length)
    return { stage: 'AWAITING_CONTRACT_VALIDATION', nextAllowedAction: 'Validate dry-run action contract' };
  if (!data.drafts.length)
    return { stage: 'AWAITING_DRAFT', nextAllowedAction: 'Generate dry-run action draft' };
  if (!data.draftValidations.length)
    return { stage: 'AWAITING_DRAFT_VALIDATION', nextAllowedAction: 'Validate dry-run action draft' };
  if (!data.simPreviews.length)
    return { stage: 'AWAITING_SIMULATION_PREVIEW', nextAllowedAction: 'Generate dry-run simulation preview' };
  if (!data.previewValidations.length)
    return { stage: 'AWAITING_PREVIEW_VALIDATION', nextAllowedAction: 'Validate simulation preview' };
  if (!data.resultPackages.length)
    return { stage: 'AWAITING_RESULT_PACKAGE', nextAllowedAction: 'Generate dry-run result package' };
  return { stage: 'LOCAL_DRY_RUN_PACKAGE_READY', nextAllowedAction: 'Pause and review operator summary before any further build' };
}

// ── Safety status logic ────────────────────────────────────────────────────────
function checkSafe(record) {
  if (!record) return true;
  const checks = [
    record.executionStatus     === undefined || record.executionStatus     === 'NOT_EXECUTED',
    record.liveExecutionStatus === undefined || record.liveExecutionStatus === 'DISABLED',
    record.tradingStatus       === undefined || record.tradingStatus       === 'DISABLED',
    record.credentialStatus    === undefined || record.credentialStatus    === 'NOT_ACCESSED',
    record.moneyMovementStatus === undefined || record.moneyMovementStatus === 'DISABLED',
  ];
  return checks.every(Boolean);
}

function computeSafety(data) {
  const latestRecords = [
    data.contractValidations[0],
    data.draftValidations[0],
    data.previewValidations[0],
    data.resultPackages[0],
    data.simPreviews[0],
    data.drafts[0],
    data.contracts[0],
    data.planningGates[0],
    data.baselineLocks[0],
  ];
  const allSafe = latestRecords.every(checkSafe);
  return allSafe ? 'SAFE_LOCAL_ONLY' : 'HOLD';
}

// ── Stage timeline definition ──────────────────────────────────────────────────
const STAGE_ORDER = [
  { key: 'NO_PROPOSAL_CREATED',            label: 'Proposal' },
  { key: 'AWAITING_PROPOSAL_REVIEW',       label: 'Review' },
  { key: 'AWAITING_EVIDENCE_EXPORT',       label: 'Evidence' },
  { key: 'AWAITING_BASELINE_LOCK',         label: 'Baseline' },
  { key: 'AWAITING_DRY_RUN_PLANNING_GATE', label: 'Gate' },
  { key: 'AWAITING_ACTION_CONTRACT',       label: 'Contract' },
  { key: 'AWAITING_CONTRACT_VALIDATION',   label: 'Contract ✓' },
  { key: 'AWAITING_DRAFT',                 label: 'Draft' },
  { key: 'AWAITING_DRAFT_VALIDATION',      label: 'Draft ✓' },
  { key: 'AWAITING_SIMULATION_PREVIEW',    label: 'Preview' },
  { key: 'AWAITING_PREVIEW_VALIDATION',    label: 'Preview ✓' },
  { key: 'AWAITING_RESULT_PACKAGE',        label: 'Package' },
  { key: 'LOCAL_DRY_RUN_PACKAGE_READY',    label: 'Ready ✓' },
];

function getStageIndex(stage) {
  return STAGE_ORDER.findIndex(s => s.key === stage);
}

// ── Row component for chain status ────────────────────────────────────────────
function StatusRow({ label, record, idField, statusField, timestampField }) {
  if (!record) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/10 rounded">
        <span className="text-[8px] text-slate-500 flex-1">{label}</span>
        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-slate-600 border-slate-600/30 bg-slate-600/5">NONE</span>
      </div>
    );
  }
  const id        = record[idField]         ?? '—';
  const status    = record[statusField]     ?? '—';
  const ts        = record[timestampField]  ?? record.createdAt ?? record.packagedAt ?? record.validatedAt ?? null;
  const isGreen   = ['VALID_DRAFT','VALID_CONTRACT','VALID_PREVIEW','PACKAGE_READY','PREVIEW_READY',
                      'DRAFT_READY','CONTRACT_READY','GATE_AUTHORIZED','LOCK_READY','APPROVED',
                      'LOCAL_DRY_RUN_PACKAGE_READY'].includes(status);
  const isAmber   = ['HOLD','PENDING_APPROVAL','AWAITING_REVIEW'].includes(status);
  const badgeCls  = isGreen ? 'text-primary border-primary/30 bg-primary/5'
                 : isAmber ? 'text-amber-500 border-amber-500/30 bg-amber-500/5'
                 : 'text-slate-400 border-slate-400/20 bg-slate-400/5';

  return (
    <div className="flex items-start gap-2 px-3 py-1.5 bg-secondary/10 rounded">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[8px] text-slate-400">{label}</span>
          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${badgeCls}`}>{status}</span>
        </div>
        <div className="text-[7px] font-mono text-slate-600 truncate">{id}</div>
        {ts && <div className="text-[7px] text-slate-600">{new Date(ts).toLocaleString()}</div>}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OpenClawOperatorFlowDashboard() {
  const [data, setData] = useState(() => loadAll());
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);

  const handleRefresh = () => setData(loadAll());

  const { stage, nextAllowedAction } = computeStage(data);
  const safetyStatus = computeSafety(data);
  const stageIdx     = getStageIndex(stage);
  const isSafe       = safetyStatus === 'SAFE_LOCAL_ONLY';
  const isComplete   = stage === 'LOCAL_DRY_RUN_PACKAGE_READY';

  return (
    <div className="space-y-3">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-[12px] font-bold text-foreground">OpenClaw Local Governance Summary</div>
            <div className="text-[8px] text-slate-500">Read-only · No writes · No network · No execution</div>
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors shrink-0">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* ── 1. CURRENT OPERATOR STAGE — largest primary card ── */}
      <div className={`rounded-xl border-2 px-5 py-4 ${isComplete ? 'border-primary bg-primary/8' : 'border-amber-500/50 bg-amber-500/5'}`}>
        <div className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 mb-1">
          Current Operator Stage — Step {stageIdx + 1} of {STAGE_ORDER.length}
        </div>
        <div className={`text-[18px] font-black uppercase tracking-wide font-mono leading-tight ${isComplete ? 'text-primary' : 'text-amber-400'}`}>
          {stage}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {isComplete
            ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            : <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          <span className={`text-[10px] font-semibold ${isComplete ? 'text-primary' : 'text-amber-400'}`}>
            {isComplete ? 'All local dry-run preparation phases complete.' : 'In progress'}
          </span>
          <span className={`ml-auto text-[8px] font-bold px-2 py-0.5 rounded border ${isComplete ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
            {isComplete ? 'COMPLETE' : 'IN PROGRESS'}
          </span>
        </div>
      </div>

      {/* ── 2. OVERALL SAFETY STATUS — second largest card ── */}
      <div className={`rounded-lg border-2 px-4 py-3 ${isSafe ? 'border-primary/40 bg-primary/5' : 'border-destructive/40 bg-destructive/5'}`}>
        <div className="flex items-center gap-3">
          {isSafe
            ? <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            : <AlertCircle className="w-5 h-5 text-destructive shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className={`text-[13px] font-bold uppercase tracking-wide ${isSafe ? 'text-primary' : 'text-destructive'}`}>
              {safetyStatus}
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              {isSafe
                ? 'All checked records confirm: no execution · no trading · no credentials · no money movement'
                : 'One or more records has an unsafe status — resolve before proceeding'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. NEXT ALLOWED ACTION — highlighted action card ── */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3">
        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <div className="text-[8px] uppercase tracking-widest font-semibold text-slate-500 mb-0.5">Next Allowed Action</div>
          <div className="text-[13px] font-bold text-primary leading-snug">{nextAllowedAction}</div>
        </div>
      </div>

      {/* ── 4. SYSTEM MODE row ── */}
      <div className="bg-card border border-border/60 rounded-lg px-3 py-2.5">
        <div className="text-[8px] uppercase tracking-widest font-semibold text-slate-500 mb-2">System Mode</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {[
            { label: 'Execution',     value: 'NOT EXECUTED',  safe: true },
            { label: 'Trading',       value: 'DISABLED',      safe: true },
            { label: 'Credentials',   value: 'NOT ACCESSED',  safe: true },
            { label: 'Money Movement',value: 'DISABLED',      safe: true },
            { label: 'Network',       value: 'LOCAL ONLY',    safe: true },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded text-center">
              <span className="text-[6px] uppercase tracking-widest text-slate-500 font-semibold">{label}</span>
              <span className="text-[8px] font-bold text-primary font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. COMPACT STAGE TIMELINE ── */}
      <div className="bg-card border border-border/60 rounded-lg px-3 py-2.5">
        <div className="text-[8px] uppercase tracking-widest font-semibold text-slate-500 mb-2">
          Stage Timeline — {stageIdx + 1} / {STAGE_ORDER.length}
        </div>
        <div className="flex flex-wrap gap-1">
          {STAGE_ORDER.map((s, i) => {
            const isPast    = i < stageIdx;
            const isCurrent = i === stageIdx;
            const cls = isPast    ? 'text-primary border-primary/30 bg-primary/5'
                      : isCurrent ? 'text-amber-400 border-amber-400/40 bg-amber-400/10 ring-1 ring-amber-400/30'
                      : 'text-slate-600 border-slate-700/40 bg-slate-700/5';
            return (
              <div key={s.key} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[7px] font-bold ${cls}`}>
                {isPast    && <CheckCircle2 className="w-2 h-2 shrink-0" />}
                {isCurrent && <ChevronRight className="w-2 h-2 shrink-0" />}
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. BLOCKED CAPABILITIES — collapsible ── */}
      <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => setBlockedOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/20 transition-colors">
          <div className="flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
            <span className="text-[8px] uppercase tracking-widest font-semibold text-slate-400">
              Blocked Capabilities ({BLOCKED_CAPABILITIES.length}) — Always Enforced
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${blockedOpen ? 'rotate-180' : ''}`} />
        </button>
        {blockedOpen && (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {BLOCKED_CAPABILITIES.map(cap => (
                <div key={cap} className="flex items-center gap-1.5 px-2 py-1 bg-destructive/5 border border-destructive/20 rounded text-[7px]">
                  <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />
                  <span className="font-mono text-destructive/70">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Chain Status Summary — collapsible ── */}
      <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => setChainOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/20 transition-colors">
          <span className="text-[8px] uppercase tracking-widest font-semibold text-slate-400">
            Chain Status Summary (12 records)
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${chainOpen ? 'rotate-180' : ''}`} />
        </button>
        {chainOpen && (
          <div className="px-3 pb-3 space-y-1">
            <StatusRow label="Latest Proposal"
              record={data.proposals[0]}
              idField="id" statusField="status" timestampField="createdAt" />
            <StatusRow label="Latest Review"
              record={data.reviews[0]}
              idField="id" statusField="decision" timestampField="reviewedAt" />
            <StatusRow label="Latest Evidence Export"
              record={data.evidenceExports[0]}
              idField="exportId" statusField="exportStatus" timestampField="exportedAt" />
            <StatusRow label="Latest Baseline Lock"
              record={data.baselineLocks[0]}
              idField="baselineLockId" statusField="lockStatus" timestampField="lockedAt" />
            <StatusRow label="Latest Planning Gate"
              record={data.planningGates[0]}
              idField="dryRunPlanningGateId" statusField="gateStatus" timestampField="generatedAt" />
            <StatusRow label="Latest Contract"
              record={data.contracts[0]}
              idField="dryRunActionContractId" statusField="contractStatus" timestampField="createdAt" />
            <StatusRow label="Latest Contract Validation"
              record={data.contractValidations[0]}
              idField="validationResultId" statusField="validationStatus" timestampField="validatedAt" />
            <StatusRow label="Latest Draft"
              record={data.drafts[0]}
              idField="draftActionId" statusField="draftStatus" timestampField="createdAt" />
            <StatusRow label="Latest Draft Validation"
              record={data.draftValidations[0]}
              idField="draftValidationResultId" statusField="validationStatus" timestampField="validatedAt" />
            <StatusRow label="Latest Simulation Preview"
              record={data.simPreviews[0]}
              idField="simulationPreviewId" statusField="previewStatus" timestampField="previewedAt" />
            <StatusRow label="Latest Preview Validation"
              record={data.previewValidations[0]}
              idField="previewValidationResultId" statusField="validationStatus" timestampField="validatedAt" />
            <StatusRow label="Latest Result Package"
              record={data.resultPackages[0]}
              idField="dryRunResultPackageId" statusField="packageStatus" timestampField="packagedAt" />
          </div>
        )}
      </div>

      {/* ── Record counts strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
        {[
          { label: 'Proposals',    count: data.proposals.length },
          { label: 'Reviews',      count: data.reviews.length },
          { label: 'Exports',      count: data.evidenceExports.length },
          { label: 'Locks',        count: data.baselineLocks.length },
          { label: 'Gates',        count: data.planningGates.length },
          { label: 'Contracts',    count: data.contracts.length },
          { label: 'C.Valid',      count: data.contractValidations.length },
          { label: 'Drafts',       count: data.drafts.length },
          { label: 'D.Valid',      count: data.draftValidations.length },
          { label: 'Previews',     count: data.simPreviews.length },
          { label: 'P.Valid',      count: data.previewValidations.length },
          { label: 'Packages',     count: data.resultPackages.length },
        ].map(({ label, count }) => (
          <div key={label} className="flex items-center justify-between gap-1 px-2 py-1.5 bg-secondary/20 rounded">
            <span className="text-[7px] text-slate-500 truncate">{label}</span>
            <span className={`text-[9px] font-bold font-mono shrink-0 ${count > 0 ? 'text-primary' : 'text-slate-600'}`}>{count}</span>
          </div>
        ))}
      </div>

      {/* ── Safety footer ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded text-[7px] text-primary/70">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        READ_ONLY · No localStorage.setItem · No localStorage.removeItem · No fetch · No network · No execution · No dispatch · No timers
      </div>
    </div>
  );
}