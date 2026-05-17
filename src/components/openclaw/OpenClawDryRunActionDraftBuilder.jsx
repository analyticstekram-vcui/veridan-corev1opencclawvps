/**
 * OpenClawDryRunActionDraftBuilder
 * Local-only draft builder that generates draft dry-run action objects ONLY after
 * the latest dry-run action contract validation result is VALID_CONTRACT.
 *
 * Reads:  openclawDryRunActionContractValidationResults
 *         openclawDryRunActionContracts
 *         openclawProposalReviews
 *         openclawCommandProposals
 *
 * Writes: openclawDryRunActionDrafts (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This builder only creates local draft records — it does NOT simulate or execute actions.
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertCircle, FileEdit,
  Download, Copy, RefreshCw, ChevronDown, XCircle
} from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const VALIDATION_KEY = 'openclawDryRunActionContractValidationResults';
const CONTRACTS_KEY  = 'openclawDryRunActionContracts';
const REVIEWS_KEY    = 'openclawProposalReviews';
const PROPOSALS_KEY  = 'openclawCommandProposals';
const DRAFTS_KEY     = 'openclawDryRunActionDrafts';

// ── Allowed action types ───────────────────────────────────────────────────────
const ALLOWED_ACTION_TYPES = [
  'READ_ONLY_STATUS_CHECK',
  'READ_ONLY_DATA_PARSE',
  'READ_ONLY_PROPOSAL_SIMULATION',
  'READ_ONLY_POLICY_MATCH',
  'READ_ONLY_EVIDENCE_REPLAY',
  'READ_ONLY_AUDIT_REVIEW',
];

const RISK_TIERS = ['LOW', 'MEDIUM'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function loadSourceData() {
  const validations = (() => { const r = loadJSON(VALIDATION_KEY, []); return Array.isArray(r) ? r : []; })();
  const contracts   = (() => { const r = loadJSON(CONTRACTS_KEY,  []); return Array.isArray(r) ? r : []; })();
  const reviews     = (() => { const r = loadJSON(REVIEWS_KEY,    []); return Array.isArray(r) ? r : []; })();
  const proposals   = (() => { const r = loadJSON(PROPOSALS_KEY,  []); return Array.isArray(r) ? r : []; })();
  return { validations, contracts, reviews, proposals };
}

// ── Readiness evaluation (9 rules) ────────────────────────────────────────────
function evalReadiness(source, selectedActionType) {
  const { validations, reviews } = source;
  const latestVal = validations[0] ?? null;

  const rule1 = validations.length > 0;
  const rule2 = latestVal?.validationStatus    === 'VALID_CONTRACT';
  const rule3 = latestVal?.executionStatus     === 'NOT_EXECUTED';
  const rule4 = latestVal?.simulationStatus    === 'NOT_STARTED';
  const rule5 = latestVal?.liveExecutionStatus === 'DISABLED';
  const rule6 = latestVal?.tradingStatus       === 'DISABLED';
  const rule7 = latestVal?.credentialStatus    === 'NOT_ACCESSED';
  const rule8 = reviews.length > 0;
  const rule9 = ALLOWED_ACTION_TYPES.includes(selectedActionType);

  const ready = rule1 && rule2 && rule3 && rule4 && rule5 && rule6 && rule7 && rule8 && rule9;

  return {
    latestVal,
    rules: { rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9 },
    ready,
    status: ready ? 'DRAFT_READY' : 'HOLD',
  };
}

// ── Draft builder ──────────────────────────────────────────────────────────────
function buildDraft(source, readiness, form) {
  const { contracts, reviews, proposals } = source;
  const { latestVal } = readiness;

  const latestContract  = contracts[0]  ?? null;
  const selectedReview  = reviews.find(r => r.id === form.reviewId) ?? reviews[0] ?? null;
  const selectedProposal = proposals.find(p => p.id === form.proposalId) ?? proposals[0] ?? null;

  return {
    draftActionId: `dry-run-action-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt:     new Date().toISOString(),
    draftMode:     'DRY_RUN_ACTION_DRAFT',
    draftStatus:   readiness.status,

    executionStatus:         'NOT_EXECUTED',
    simulationStatus:        'NOT_STARTED',
    liveExecutionStatus:     'DISABLED',
    tradingStatus:           'DISABLED',
    browserAutomationStatus: 'DISABLED',
    apiCallStatus:           'DISABLED',
    credentialStatus:        'NOT_ACCESSED',
    moneyMovementStatus:     'DISABLED',

    sourceValidationResultId: latestVal?.validationResultId ?? null,
    sourceValidationStatus:   latestVal?.validationStatus    ?? null,
    sourceContractId:         latestVal?.sourceContractId    ?? latestContract?.dryRunActionContractId ?? null,
    sourceProposalId:         selectedProposal?.id           ?? selectedProposal?.requestId ?? null,
    sourceReviewId:           selectedReview?.id             ?? selectedReview?.reviewId    ?? null,

    actionId:     `action-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actionType:   form.actionType,
    riskTier:     form.riskTier,
    intendedEffect:   form.intendedEffect   || '(not specified)',
    expectedInputs:   form.expectedInputs   || '(not specified)',
    expectedOutputs:  form.expectedOutputs  || '(not specified)',
    executionMode:    'DRY_RUN_ONLY',
    approvalRequired: true,

    nonExecutionGuarantee:
      'This draft action record does NOT authorize, simulate, or execute any action. ' +
      'It is a local draft schema record only. No OpenClaw calls, no browser automation, ' +
      'no trading, no API calls, and no credentials are involved.',

    prohibitedCapabilities: [
      'LIVE_TRADE', 'PAPER_TRADE', 'BROKER_ORDER', 'BANK_TRANSFER', 'CRYPTO_TRANSFER',
      'BROWSER_CLICK', 'BROWSER_TYPE', 'BROWSER_SUBMIT',
      'API_POST', 'API_PATCH', 'API_DELETE',
      'CREDENTIAL_READ', 'SECRET_EXPOSURE', 'FILE_DELETE', 'SCHEDULED_EXECUTION',
    ],

    auditTags: form.auditTags
      ? form.auditTags.split(',').map(t => t.trim()).filter(Boolean)
      : [],

    draftReadinessRules: {
      rule1_atLeastOneValidationResultExists:                   readiness.rules.rule1,
      rule2_latestValidationStatusIsVALID_CONTRACT:             readiness.rules.rule2,
      rule3_latestValidationExecutionStatusIsNOT_EXECUTED:      readiness.rules.rule3,
      rule4_latestValidationSimulationStatusIsNOT_STARTED:      readiness.rules.rule4,
      rule5_latestValidationLiveExecutionStatusIsDISABLED:      readiness.rules.rule5,
      rule6_latestValidationTradingStatusIsDISABLED:            readiness.rules.rule6,
      rule7_latestValidationCredentialStatusIsNOT_ACCESSED:     readiness.rules.rule7,
      rule8_atLeastOneProposalReviewExists:                     readiness.rules.rule8,
      rule9_selectedActionTypeIsAllowed:                        readiness.rules.rule9,
      allRulesPass: readiness.ready,
      resultingDraftStatus: readiness.status,
    },

    safetyBoundary: {
      statement: 'This draft action record does NOT authorize any of the following.',
      draftCreatesActions:           false,
      draftSimulatesActions:         false,
      draftExecutesActions:          false,
      dryRunExecutionAuthorized:     false,
      liveExecutionAuthorized:       false,
      tradingAuthorized:             false,
      browserAutomationAuthorized:   false,
      apiCallsAuthorized:            false,
      credentialAccessAuthorized:    false,
      moneyMovementAuthorized:       false,
      scheduledRunnerAuthorized:     false,
      secretValueExposureAuthorized: false,
      rawResponseExposureAuthorized: false,
      nextRequiredStep:
        readiness.ready
          ? 'OPERATOR_MAY_SUBMIT_THIS_DRAFT_FOR_APPROVAL_REVIEW'
          : 'RESOLVE_ALL_HOLD_CONDITIONS_BEFORE_DRAFT_CREATION_IS_ALLOWED',
    },

    nonExecutionProof: {
      fetchCalled:                false,
      axiosCalled:                false,
      base44SdkCalled:            false,
      openClawCalled:             false,
      apiCalled:                  false,
      browserAutomationPerformed: false,
      tradingPerformed:           false,
      credentialHandled:          false,
      processEnvAccessed:         false,
      denoEnvAccessed:            false,
      networkCallsMade:           false,
      executionDispatched:        false,
      customEventsFired:          false,
      validationResultsModified:  false,
      contractsModified:          false,
      proposalReviewsModified:    false,
      commandProposalsModified:   false,
      writeTargetKey:             DRAFTS_KEY,
    },
  };
}

// ── UI sub-components ──────────────────────────────────────────────────────────
function RuleRow({ label, pass, failNote }) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 bg-secondary/20 rounded">
      {pass
        ? <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        : <XCircle className="w-3 h-3 shrink-0 mt-0.5 text-destructive" />}
      <div className="flex-1">
        <span className="text-[8px] text-slate-300">{label}</span>
        {!pass && failNote && <div className="text-[7px] text-destructive/80 mt-0.5">{failNote}</div>}
      </div>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${pass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {pass ? 'PASS' : 'HOLD'}
      </span>
    </div>
  );
}

function DraftRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const isReady = record.draftStatus === 'DRAFT_READY';
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${isReady ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
              {record.draftStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-slate-400 border-slate-400/20 bg-slate-400/5">
              {record.actionType}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.draftActionId}</div>
          <div className="text-[7px] text-slate-600">{new Date(record.createdAt).toLocaleString()} · risk: {record.riskTier}</div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[7px] text-primary font-bold hover:text-primary/80 shrink-0">
          JSON <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3">
          <pre className="text-[7px] font-mono text-slate-400 bg-secondary/20 rounded p-2 border border-border/40 overflow-auto max-h-48">
            {JSON.stringify(record, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  actionType:      'READ_ONLY_STATUS_CHECK',
  riskTier:        'LOW',
  intendedEffect:  '',
  expectedInputs:  '',
  expectedOutputs: '',
  auditTags:       '',
  reviewId:        '',
  proposalId:      '',
};

export default function OpenClawDryRunActionDraftBuilder() {
  const [source, setSource]         = useState(() => loadSourceData());
  const [drafts, setDrafts]         = useState(() => loadJSON(DRAFTS_KEY, []));
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]         = useState(false);

  const latestDraft = drafts[0] ?? null;
  const recent5     = drafts.slice(0, 5);

  const readiness = useMemo(
    () => evalReadiness(source, form.actionType),
    [source, form.actionType]
  );

  const { latestVal, rules, status } = readiness;
  const latestContract  = source.contracts[0]  ?? null;
  const latestReview    = source.reviews[0]     ?? null;
  const latestProposal  = source.proposals[0]   ?? null;
  const isReady = status === 'DRAFT_READY';

  const handleRefresh = () => {
    setSource(loadSourceData());
    setDrafts(loadJSON(DRAFTS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleGenerate = () => {
    const draft   = buildDraft(source, readiness, form);
    const updated = [draft, ...drafts].slice(0, 20);
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated)); } catch {}
    setDrafts(updated);
    setLastAction(`Draft generated — ${draft.draftActionId} — ${draft.draftStatus}`);
  };

  const handleCopy = () => {
    if (!latestDraft) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestDraft, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest draft JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestDraft) return;
    try {
      const blob = new Blob([JSON.stringify(latestDraft, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-action-draft-${latestDraft.draftActionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Draft JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const statusCfg = isReady
    ? { border: 'border-primary/30',   bg: 'bg-primary/5',   icon: CheckCircle2, iconColor: 'text-primary',   text: 'text-primary',   badge: 'text-primary border-primary/30 bg-primary/5' }
    : { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: AlertCircle,  iconColor: 'text-amber-500', text: 'text-amber-500', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' };
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Draft Builder</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-primary" /> Dry-Run Action Draft Builder
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Generates draft dry-run action objects after contract validation passes.
            Does not simulate or execute actions. Writes only to <span className="font-mono">openclawDryRunActionDrafts</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Draft readiness status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${statusCfg.border} ${statusCfg.bg}`}>
        <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.iconColor}`} />
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.text}`}>
            {isReady
              ? 'DRAFT_READY — All 9 readiness rules satisfied'
              : 'HOLD — One or more readiness rules not satisfied'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.validations.length} validation result(s) · {source.contracts.length} contract(s) · {source.reviews.length} review(s) · {source.proposals.length} proposal(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusCfg.badge}`}>{status}</span>
      </div>

      {/* Source reference strip */}
      <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-1.5">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Source References</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
          <div>
            <span className="text-slate-500">Latest Validation ID: </span>
            <span className={`font-mono text-[7px] ${latestVal ? 'text-slate-300' : 'text-slate-600'}`}>{latestVal?.validationResultId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Validation Status: </span>
            <span className={`font-bold font-mono ${latestVal?.validationStatus === 'VALID_CONTRACT' ? 'text-primary' : 'text-destructive'}`}>
              {latestVal?.validationStatus ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Latest Contract ID: </span>
            <span className={`font-mono text-[7px] ${latestContract ? 'text-slate-300' : 'text-slate-600'}`}>{latestContract?.dryRunActionContractId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Available Reviews: </span>
            <span className="text-slate-300">{source.reviews.length}</span>
            <span className="text-slate-600 ml-1">/ Proposals: {source.proposals.length}</span>
          </div>
        </div>
      </div>

      {/* Draft readiness rules */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Draft Readiness Rules</div>
        <div className="space-y-1.5">
          <RuleRow label="Rule 1 — At least one validation result exists"
            pass={rules.rule1} failNote="Generate a contract validation result first." />
          <RuleRow label='Rule 2 — Latest validationStatus === "VALID_CONTRACT"'
            pass={rules.rule2} failNote={`Found: ${latestVal?.validationStatus ?? 'none'}`} />
          <RuleRow label='Rule 3 — Latest validation executionStatus === "NOT_EXECUTED"'
            pass={rules.rule3} failNote={`Found: ${latestVal?.executionStatus ?? 'none'}`} />
          <RuleRow label='Rule 4 — Latest validation simulationStatus === "NOT_STARTED"'
            pass={rules.rule4} failNote={`Found: ${latestVal?.simulationStatus ?? 'none'}`} />
          <RuleRow label='Rule 5 — Latest validation liveExecutionStatus === "DISABLED"'
            pass={rules.rule5} failNote={`Found: ${latestVal?.liveExecutionStatus ?? 'none'}`} />
          <RuleRow label='Rule 6 — Latest validation tradingStatus === "DISABLED"'
            pass={rules.rule6} failNote={`Found: ${latestVal?.tradingStatus ?? 'none'}`} />
          <RuleRow label='Rule 7 — Latest validation credentialStatus === "NOT_ACCESSED"'
            pass={rules.rule7} failNote={`Found: ${latestVal?.credentialStatus ?? 'none'}`} />
          <RuleRow label="Rule 8 — At least one proposal review exists"
            pass={rules.rule8} failNote="Create a proposal review first." />
          <RuleRow label="Rule 9 — Selected actionType is in the allowed read-only types list"
            pass={rules.rule9} failNote={`Selected: "${form.actionType}"`} />
        </div>
      </div>

      {/* Draft input form */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Draft Action Fields</div>

        {/* Action type + Risk tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">Action Type *</label>
            <select
              value={form.actionType}
              onChange={e => handleField('actionType', e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground font-mono focus:outline-none focus:border-primary"
            >
              {ALLOWED_ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">Risk Tier *</label>
            <select
              value={form.riskTier}
              onChange={e => handleField('riskTier', e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground font-mono focus:outline-none focus:border-primary"
            >
              {RISK_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Source proposal/review selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">
              Source Review (defaults to latest)
            </label>
            <select
              value={form.reviewId}
              onChange={e => handleField('reviewId', e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground font-mono focus:outline-none focus:border-primary"
            >
              <option value="">— Latest review ({latestReview?.id ?? latestReview?.reviewId ?? 'none'}) —</option>
              {source.reviews.slice(0, 10).map(r => {
                const rid = r.id ?? r.reviewId ?? '';
                return <option key={rid} value={rid}>{rid || '(no id)'}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">
              Source Proposal (defaults to latest)
            </label>
            <select
              value={form.proposalId}
              onChange={e => handleField('proposalId', e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground font-mono focus:outline-none focus:border-primary"
            >
              <option value="">— Latest proposal ({latestProposal?.id ?? latestProposal?.requestId ?? 'none'}) —</option>
              {source.proposals.slice(0, 10).map(p => {
                const pid = p.id ?? p.requestId ?? '';
                return <option key={pid} value={pid}>{pid || '(no id)'}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Text fields */}
        <div>
          <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">Intended Effect</label>
          <input
            type="text"
            value={form.intendedEffect}
            onChange={e => handleField('intendedEffect', e.target.value)}
            placeholder="e.g. Read current gateway status for audit review"
            className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground focus:outline-none focus:border-primary placeholder-slate-600"
          />
        </div>
        <div>
          <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">Expected Inputs</label>
          <input
            type="text"
            value={form.expectedInputs}
            onChange={e => handleField('expectedInputs', e.target.value)}
            placeholder="e.g. proposalId, reviewId, contractId"
            className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground focus:outline-none focus:border-primary placeholder-slate-600"
          />
        </div>
        <div>
          <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">Expected Outputs</label>
          <input
            type="text"
            value={form.expectedOutputs}
            onChange={e => handleField('expectedOutputs', e.target.value)}
            placeholder="e.g. statusSnapshot, auditRecord"
            className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground focus:outline-none focus:border-primary placeholder-slate-600"
          />
        </div>
        <div>
          <label className="block text-[8px] text-slate-400 uppercase tracking-wider mb-1">Audit Tags (comma-separated)</label>
          <input
            type="text"
            value={form.auditTags}
            onChange={e => handleField('auditTags', e.target.value)}
            placeholder="e.g. phase57, dry-run, status-check"
            className="w-full bg-secondary/40 border border-border rounded px-2 py-1.5 text-[9px] text-foreground focus:outline-none focus:border-primary placeholder-slate-600"
          />
        </div>
      </div>

      {/* Last action */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded">
          <FileEdit className="w-3.5 h-3.5" />
          Generate Dry-Run Action Draft
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestDraft}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Draft JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestDraft}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Draft JSON
        </button>
      </div>

      {/* Latest draft preview */}
      {latestDraft && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Draft Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestDraft.createdAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Draft Mode',        v: latestDraft.draftMode,               mono: true },
              { k: 'Draft Status',      v: latestDraft.draftStatus,             mono: true },
              { k: 'Action Type',       v: latestDraft.actionType,              mono: true },
              { k: 'Risk Tier',         v: latestDraft.riskTier,                mono: true },
              { k: 'Exec Status',       v: latestDraft.executionStatus,         mono: true },
              { k: 'Simulation',        v: latestDraft.simulationStatus,        mono: true },
              { k: 'Live Execution',    v: latestDraft.liveExecutionStatus,     mono: true },
              { k: 'Trading',           v: latestDraft.tradingStatus,           mono: true },
              { k: 'Browser Auto',      v: latestDraft.browserAutomationStatus, mono: true },
              { k: 'API Calls',         v: latestDraft.apiCallStatus,           mono: true },
              { k: 'Credentials',       v: latestDraft.credentialStatus,        mono: true },
              { k: 'Money Movement',    v: latestDraft.moneyMovementStatus,     mono: true },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          {/* intendedEffect + safetyBoundary strip */}
          <div className="px-4 pb-4 space-y-2">
            <div className="text-[8px] text-slate-400"><span className="font-semibold text-slate-500 uppercase tracking-wider">Intended Effect: </span>{latestDraft.intendedEffect}</div>
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Safety Boundary</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {Object.entries(latestDraft.safetyBoundary)
                .filter(([, v]) => typeof v === 'boolean')
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-[7px]">
                    <CheckCircle2 className={`w-2.5 h-2.5 shrink-0 ${!v ? 'text-primary' : 'text-destructive'}`} />
                    <span className="font-mono text-slate-400">{k}: {String(v)}</span>
                  </div>
                ))}
            </div>
            <div className="text-[7px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1 mt-1">
              nextRequiredStep: {latestDraft.safetyBoundary.nextRequiredStep}
            </div>
          </div>
        </div>
      )}

      {/* Last 5 drafts */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Drafts ({recent5.length} of {drafts.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <DraftRecord key={rec.draftActionId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Draft Builder Safety Guarantee</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 text-[8px] text-slate-400">
          {[
            'No fetch or axios',
            'No Base44 SDK call',
            'No OpenClaw call',
            'No API or network call',
            'No browser automation',
            'No trading logic',
            'No credential handling',
            'No process.env or Deno.env',
            'No execution dispatch',
            'No CustomEvent or dispatchEvent',
            'No actions simulated or executed',
            'Validation results never modified',
            'Contracts never modified',
            'Proposal reviews never modified',
            'Command proposals never modified',
            'Writes only to openclawDryRunActionDrafts',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <FileEdit className="w-3 h-3 shrink-0" />
        draftMode = DRY_RUN_ACTION_DRAFT · executionStatus = NOT_EXECUTED · simulationStatus = NOT_STARTED · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}