/**
 * OpenClawDryRunSimulationPreview
 * Local-only simulation preview that reads the latest VALID_DRAFT result and
 * latest dry-run action draft, then produces a non-executing preview of what
 * would be simulated later.
 *
 * Reads:  openclawDryRunActionDraftValidationResults
 *         openclawDryRunActionDrafts
 *         openclawDryRunActionContracts
 *
 * Writes: openclawDryRunSimulationPreviews (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This preview only creates local text/JSON — it does NOT execute or simulate
 * against any real system.
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertCircle, Eye,
  Download, Copy, RefreshCw, ChevronDown, XCircle
} from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const DRAFT_VALIDATIONS_KEY = 'openclawDryRunActionDraftValidationResults';
const DRAFTS_KEY            = 'openclawDryRunActionDrafts';
const CONTRACTS_KEY         = 'openclawDryRunActionContracts';
const PREVIEWS_KEY          = 'openclawDryRunSimulationPreviews';

// ── Allowed action types ───────────────────────────────────────────────────────
const ALLOWED_ACTION_TYPES = [
  'READ_ONLY_STATUS_CHECK',
  'READ_ONLY_DATA_PARSE',
  'READ_ONLY_PROPOSAL_SIMULATION',
  'READ_ONLY_POLICY_MATCH',
  'READ_ONLY_EVIDENCE_REPLAY',
  'READ_ONLY_AUDIT_REVIEW',
];

const BLOCKED_CAPABILITIES = [
  'LIVE_TRADE', 'PAPER_TRADE', 'BROKER_ORDER', 'BANK_TRANSFER', 'CRYPTO_TRANSFER',
  'BROWSER_CLICK', 'BROWSER_TYPE', 'BROWSER_SUBMIT',
  'API_POST', 'API_PATCH', 'API_DELETE',
  'CREDENTIAL_READ', 'SECRET_EXPOSURE', 'FILE_DELETE', 'SCHEDULED_EXECUTION',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function loadSourceData() {
  const draftValidations = (() => { const r = loadJSON(DRAFT_VALIDATIONS_KEY, []); return Array.isArray(r) ? r : []; })();
  const drafts           = (() => { const r = loadJSON(DRAFTS_KEY,            []); return Array.isArray(r) ? r : []; })();
  const contracts        = (() => { const r = loadJSON(CONTRACTS_KEY,         []); return Array.isArray(r) ? r : []; })();
  return { draftValidations, drafts, contracts };
}

// ── Simulated steps generator (local text only, no execution) ──────────────────
function generateSimulatedSteps(draft) {
  if (!draft) return [];
  const actionType = draft.actionType ?? 'UNKNOWN';
  const riskTier   = draft.riskTier ?? 'LOW';
  const effect     = draft.intendedEffect ?? '(not specified)';
  const inputs     = draft.expectedInputs ?? '(not specified)';
  const outputs    = draft.expectedOutputs ?? '(not specified)';

  const common = [
    { step: 'step_0_preflight',  description: 'Verify draft schema fields are present and non-null' },
    { step: 'step_0_safety',     description: `Confirm riskTier=${riskTier} is within approved LOW/MEDIUM boundary` },
  ];

  const typeSteps = {
    READ_ONLY_STATUS_CHECK: [
      { step: 'step_1_identify',  description: 'Identify local status fields referenced by the draft' },
      { step: 'step_2_compare',   description: `Compare expected status values from intendedEffect: "${effect}"` },
      { step: 'step_3_preview',   description: 'Produce local preview summary — no external call made' },
    ],
    READ_ONLY_DATA_PARSE: [
      { step: 'step_1_identify',  description: `Identify local input fields from expectedInputs: "${inputs}"` },
      { step: 'step_2_parse',     description: 'Parse expectedInputs text locally in preview context only' },
      { step: 'step_3_preview',   description: 'Produce local data-parse preview summary — no external call made' },
    ],
    READ_ONLY_PROPOSAL_SIMULATION: [
      { step: 'step_1_identify',  description: `Identify source proposal ID: "${draft.sourceProposalId ?? '—'}" and review ID: "${draft.sourceReviewId ?? '—'}"` },
      { step: 'step_2_impact',    description: `Preview proposed action impact in text only — intendedEffect: "${effect}"` },
      { step: 'step_3_preview',   description: 'Produce local proposal simulation preview — no execution dispatched' },
    ],
    READ_ONLY_POLICY_MATCH: [
      { step: 'step_1_compare',   description: `Compare draft actionType="${actionType}" against ALLOWED_ACTION_TYPES list` },
      { step: 'step_2_tier',      description: `Compare draft riskTier="${riskTier}" against allowed LOW/MEDIUM values` },
      { step: 'step_3_preview',   description: 'Produce local policy-match preview summary — no network query made' },
    ],
    READ_ONLY_EVIDENCE_REPLAY: [
      { step: 'step_1_refs',      description: `Preview evidence references: proposal="${draft.sourceProposalId ?? '—'}", review="${draft.sourceReviewId ?? '—'}", contract="${draft.sourceContractId ?? '—'}"` },
      { step: 'step_2_audit',     description: `Preview audit tags: ${(draft.auditTags ?? []).join(', ') || '(none)'}` },
      { step: 'step_3_preview',   description: 'Produce local evidence-replay preview summary — no replay execution made' },
    ],
    READ_ONLY_AUDIT_REVIEW: [
      { step: 'step_1_tags',      description: `Preview audit tags: ${(draft.auditTags ?? []).join(', ') || '(none)'}` },
      { step: 'step_2_safety',    description: 'Preview safety proof fields from draft nonExecutionProof object' },
      { step: 'step_3_preview',   description: 'Produce local audit-review preview summary — no audit system queried' },
    ],
  }[actionType] ?? [
    { step: 'step_1_unknown',   description: `Unknown actionType "${actionType}" — preview limited to schema fields only` },
  ];

  const finalStep = {
    step: 'step_final_boundary',
    description: `Preview boundary enforced — outputs="${outputs}" — NO execution, NO network, NO credentials`,
  };

  return [...common, ...typeSteps, finalStep];
}

// ── Readiness evaluation (12 rules) ───────────────────────────────────────────
function evalReadiness(source) {
  const { draftValidations, drafts } = source;
  const latestVal   = draftValidations[0] ?? null;
  const latestDraft = drafts[0]           ?? null;

  const rule1  = draftValidations.length > 0;
  const rule2  = latestVal?.validationStatus    === 'VALID_DRAFT';
  const rule3  = latestVal?.executionStatus     === 'NOT_EXECUTED';
  const rule4  = latestVal?.simulationStatus    === 'NOT_STARTED';
  const rule5  = latestVal?.liveExecutionStatus === 'DISABLED';
  const rule6  = latestVal?.tradingStatus       === 'DISABLED';
  const rule7  = latestVal?.browserAutomationStatus === 'DISABLED';
  const rule8  = latestVal?.apiCallStatus       === 'DISABLED';
  const rule9  = latestVal?.credentialStatus    === 'NOT_ACCESSED';
  const rule10 = latestVal?.moneyMovementStatus === 'DISABLED';
  const rule11 = drafts.length > 0;
  const rule12 = ALLOWED_ACTION_TYPES.includes(latestDraft?.actionType);

  const ready = rule1 && rule2 && rule3 && rule4 && rule5 && rule6 &&
                rule7 && rule8 && rule9 && rule10 && rule11 && rule12;

  return {
    latestVal,
    latestDraft,
    rules: { rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9, rule10, rule11, rule12 },
    ready,
    status: ready ? 'PREVIEW_READY' : 'HOLD',
  };
}

// ── Preview builder ────────────────────────────────────────────────────────────
function buildPreview(source, readiness) {
  const { contracts } = source;
  const { latestVal, latestDraft, status } = readiness;
  const latestContract = contracts[0] ?? null;

  const steps = generateSimulatedSteps(latestDraft);

  return {
    simulationPreviewId: `dry-run-sim-preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    previewedAt:         new Date().toISOString(),
    previewMode:         'DRY_RUN_SIMULATION_PREVIEW',
    previewStatus:       status,

    executionStatus:         'NOT_EXECUTED',
    simulationStatus:        'PREVIEW_ONLY',
    liveExecutionStatus:     'DISABLED',
    tradingStatus:           'DISABLED',
    browserAutomationStatus: 'DISABLED',
    apiCallStatus:           'DISABLED',
    credentialStatus:        'NOT_ACCESSED',
    moneyMovementStatus:     'DISABLED',

    sourceDraftValidationResultId: latestVal?.draftValidationResultId ?? null,
    sourceDraftValidationStatus:   latestVal?.validationStatus        ?? null,
    sourceDraftActionId:           latestDraft?.draftActionId         ?? null,
    sourceActionType:              latestDraft?.actionType            ?? null,
    sourceRiskTier:                latestDraft?.riskTier              ?? null,
    sourceContractId:              latestVal?.sourceContractId        ?? latestContract?.dryRunActionContractId ?? null,

    intendedEffectPreview:  latestDraft?.intendedEffect  ?? '(not specified)',
    expectedInputsPreview:  latestDraft?.expectedInputs  ?? '(not specified)',
    expectedOutputsPreview: latestDraft?.expectedOutputs ?? '(not specified)',

    simulatedStepsPreview: steps,
    blockedCapabilities:   BLOCKED_CAPABILITIES,

    previewReadinessRules: {
      rule1_atLeastOneDraftValidationResultExists:                      readiness.rules.rule1,
      rule2_latestValidationStatusIsVALID_DRAFT:                        readiness.rules.rule2,
      rule3_latestValidationExecutionStatusIsNOT_EXECUTED:              readiness.rules.rule3,
      rule4_latestValidationSimulationStatusIsNOT_STARTED:              readiness.rules.rule4,
      rule5_latestValidationLiveExecutionStatusIsDISABLED:              readiness.rules.rule5,
      rule6_latestValidationTradingStatusIsDISABLED:                    readiness.rules.rule6,
      rule7_latestValidationBrowserAutomationStatusIsDISABLED:          readiness.rules.rule7,
      rule8_latestValidationApiCallStatusIsDISABLED:                    readiness.rules.rule8,
      rule9_latestValidationCredentialStatusIsNOT_ACCESSED:             readiness.rules.rule9,
      rule10_latestValidationMoneyMovementStatusIsDISABLED:             readiness.rules.rule10,
      rule11_atLeastOneActionDraftExists:                               readiness.rules.rule11,
      rule12_latestDraftActionTypeIsInAllowedList:                      readiness.rules.rule12,
      allRulesPass: readiness.ready,
      resultingPreviewStatus: status,
    },

    safetyBoundary: {
      statement: 'This preview record does NOT authorize any of the following.',
      previewExecutesActions:          false,
      previewSimulatesAgainstRealData: false,
      previewCallsExternalAPIs:        false,
      liveExecutionAuthorized:         false,
      tradingAuthorized:               false,
      browserAutomationAuthorized:     false,
      apiCallsAuthorized:              false,
      credentialAccessAuthorized:      false,
      moneyMovementAuthorized:         false,
      scheduledRunnerAuthorized:       false,
      secretValueExposureAuthorized:   false,
      rawResponseExposureAuthorized:   false,
      nextRequiredStep:
        status === 'PREVIEW_READY'
          ? 'OPERATOR_MAY_REVIEW_THIS_PREVIEW_BEFORE_FUTURE_SIMULATION_DESIGN'
          : 'RESOLVE_ALL_HOLD_CONDITIONS_BEFORE_PREVIEW_GENERATION_IS_ALLOWED',
    },

    nonExecutionProof: {
      fetchCalled:                       false,
      axiosCalled:                       false,
      base44SdkCalled:                   false,
      openClawCalled:                    false,
      apiCalled:                         false,
      browserAutomationPerformed:        false,
      tradingPerformed:                  false,
      credentialHandled:                 false,
      processEnvAccessed:                false,
      denoEnvAccessed:                   false,
      networkCallsMade:                  false,
      executionDispatched:               false,
      customEventsFired:                 false,
      draftValidationResultsModified:    false,
      draftsModified:                    false,
      contractsModified:                 false,
      writeTargetKey:                    PREVIEWS_KEY,
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

function PreviewRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const isReady = record.previewStatus === 'PREVIEW_READY';
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${isReady ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
              {record.previewStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-slate-400 border-slate-400/20 bg-slate-400/5">
              {record.sourceActionType ?? '—'}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.simulationPreviewId}</div>
          <div className="text-[7px] text-slate-600">{new Date(record.previewedAt).toLocaleString()} · risk: {record.sourceRiskTier ?? '—'}</div>
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
export default function OpenClawDryRunSimulationPreview() {
  const [source, setSource]         = useState(() => loadSourceData());
  const [previews, setPreviews]     = useState(() => loadJSON(PREVIEWS_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]         = useState(false);

  const latestPreview = previews[0] ?? null;
  const recent5       = previews.slice(0, 5);

  const readiness = useMemo(() => evalReadiness(source), [source]);
  const { latestVal, latestDraft, rules, status } = readiness;
  const latestContract = source.contracts[0] ?? null;
  const isReady = status === 'PREVIEW_READY';

  const handleRefresh = () => {
    setSource(loadSourceData());
    setPreviews(loadJSON(PREVIEWS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleGenerate = () => {
    const preview = buildPreview(source, readiness);
    const updated = [preview, ...previews].slice(0, 20);
    try { localStorage.setItem(PREVIEWS_KEY, JSON.stringify(updated)); } catch {}
    setPreviews(updated);
    setLastAction(`Preview generated — ${preview.simulationPreviewId} — ${preview.previewStatus}`);
  };

  const handleCopy = () => {
    if (!latestPreview) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestPreview, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest simulation preview JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestPreview) return;
    try {
      const blob = new Blob([JSON.stringify(latestPreview, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-sim-preview-${latestPreview.simulationPreviewId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Simulation preview JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const statusCfg = isReady
    ? { border: 'border-primary/30',   bg: 'bg-primary/5',   icon: CheckCircle2, iconColor: 'text-primary',   text: 'text-primary',   badge: 'text-primary border-primary/30 bg-primary/5' }
    : { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: AlertCircle,  iconColor: 'text-amber-500', text: 'text-amber-500', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' };
  const StatusIcon = statusCfg.icon;

  // Pre-compute simulated steps for live display
  const liveSteps = useMemo(() => generateSimulatedSteps(latestDraft), [latestDraft]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Simulation Preview</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Dry-Run Simulation Preview
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Reads the latest VALID_DRAFT result and produces a non-executing preview of what would be simulated.
            Does not execute or simulate against any real system. Writes only to <span className="font-mono">openclawDryRunSimulationPreviews</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Readiness status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${statusCfg.border} ${statusCfg.bg}`}>
        <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.iconColor}`} />
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.text}`}>
            {isReady
              ? 'PREVIEW_READY — All 12 readiness rules satisfied'
              : 'HOLD — One or more readiness rules not satisfied'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.draftValidations.length} draft validation result(s) · {source.drafts.length} draft(s) · {source.contracts.length} contract(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusCfg.badge}`}>{status}</span>
      </div>

      {/* Source reference strip */}
      <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-1.5">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Source References</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
          <div>
            <span className="text-slate-500">Draft Validation Result ID: </span>
            <span className={`font-mono text-[7px] ${latestVal ? 'text-slate-300' : 'text-slate-600'}`}>{latestVal?.draftValidationResultId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Validation Status: </span>
            <span className={`font-bold font-mono ${latestVal?.validationStatus === 'VALID_DRAFT' ? 'text-primary' : 'text-destructive'}`}>
              {latestVal?.validationStatus ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Draft Action ID: </span>
            <span className={`font-mono text-[7px] ${latestDraft ? 'text-slate-300' : 'text-slate-600'}`}>{latestDraft?.draftActionId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Action Type: </span>
            <span className={`font-mono text-[7px] ${latestDraft ? 'text-slate-300' : 'text-slate-600'}`}>{latestDraft?.actionType ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Risk Tier: </span>
            <span className={`font-bold font-mono ${latestDraft?.riskTier === 'LOW' ? 'text-primary' : latestDraft?.riskTier === 'MEDIUM' ? 'text-amber-500' : 'text-slate-600'}`}>
              {latestDraft?.riskTier ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Source Contract ID: </span>
            <span className={`font-mono text-[7px] ${latestContract ? 'text-slate-300' : 'text-slate-600'}`}>{latestContract?.dryRunActionContractId ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Readiness rules */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview Readiness Rules</div>
        <div className="space-y-1.5">
          <RuleRow label="Rule 1 — At least one draft validation result exists"
            pass={rules.rule1} failNote="Generate a draft validation result first." />
          <RuleRow label='Rule 2 — Latest draft validationStatus === "VALID_DRAFT"'
            pass={rules.rule2} failNote={`Found: ${latestVal?.validationStatus ?? 'none'}`} />
          <RuleRow label='Rule 3 — Latest draft validation executionStatus === "NOT_EXECUTED"'
            pass={rules.rule3} failNote={`Found: ${latestVal?.executionStatus ?? 'none'}`} />
          <RuleRow label='Rule 4 — Latest draft validation simulationStatus === "NOT_STARTED"'
            pass={rules.rule4} failNote={`Found: ${latestVal?.simulationStatus ?? 'none'}`} />
          <RuleRow label='Rule 5 — Latest draft validation liveExecutionStatus === "DISABLED"'
            pass={rules.rule5} failNote={`Found: ${latestVal?.liveExecutionStatus ?? 'none'}`} />
          <RuleRow label='Rule 6 — Latest draft validation tradingStatus === "DISABLED"'
            pass={rules.rule6} failNote={`Found: ${latestVal?.tradingStatus ?? 'none'}`} />
          <RuleRow label='Rule 7 — Latest draft validation browserAutomationStatus === "DISABLED"'
            pass={rules.rule7} failNote={`Found: ${latestVal?.browserAutomationStatus ?? 'none'}`} />
          <RuleRow label='Rule 8 — Latest draft validation apiCallStatus === "DISABLED"'
            pass={rules.rule8} failNote={`Found: ${latestVal?.apiCallStatus ?? 'none'}`} />
          <RuleRow label='Rule 9 — Latest draft validation credentialStatus === "NOT_ACCESSED"'
            pass={rules.rule9} failNote={`Found: ${latestVal?.credentialStatus ?? 'none'}`} />
          <RuleRow label='Rule 10 — Latest draft validation moneyMovementStatus === "DISABLED"'
            pass={rules.rule10} failNote={`Found: ${latestVal?.moneyMovementStatus ?? 'none'}`} />
          <RuleRow label="Rule 11 — At least one action draft exists"
            pass={rules.rule11} failNote="Generate a dry-run action draft first." />
          <RuleRow label="Rule 12 — Latest draft actionType is in the allowed read-only list"
            pass={rules.rule12} failNote={`Found: ${latestDraft?.actionType ?? 'none'}`} />
        </div>
      </div>

      {/* Simulated steps preview */}
      {latestDraft && liveSteps.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Simulated Steps Preview — {latestDraft.actionType ?? '—'}
            <span className="ml-2 text-[8px] text-primary/60 normal-case font-normal">(local text only — no execution)</span>
          </div>
          <div className="space-y-1.5">
            {liveSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-1.5 bg-secondary/20 rounded">
                <span className="text-[7px] font-mono text-slate-500 shrink-0 mt-0.5 w-28">{s.step}</span>
                <span className="text-[8px] text-slate-300 flex-1">{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked capabilities */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Blocked Capabilities ({BLOCKED_CAPABILITIES.length})</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {BLOCKED_CAPABILITIES.map(cap => (
            <div key={cap} className="flex items-center gap-1.5 px-2 py-1 bg-destructive/5 border border-destructive/20 rounded text-[8px]">
              <XCircle className="w-3 h-3 text-destructive shrink-0" />
              <span className="font-mono text-destructive/70">{cap}</span>
            </div>
          ))}
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
          <Eye className="w-3.5 h-3.5" />
          Generate Dry-Run Simulation Preview
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestPreview}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Simulation Preview JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestPreview}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Simulation Preview JSON
        </button>
      </div>

      {/* Latest preview JSON */}
      {latestPreview && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Simulation Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestPreview.previewedAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Preview Mode',    v: latestPreview.previewMode,               mono: true },
              { k: 'Preview Status',  v: latestPreview.previewStatus,             mono: true },
              { k: 'Action Type',     v: latestPreview.sourceActionType ?? '—',   mono: true },
              { k: 'Risk Tier',       v: latestPreview.sourceRiskTier  ?? '—',    mono: true },
              { k: 'Exec Status',     v: latestPreview.executionStatus,           mono: true },
              { k: 'Simulation',      v: latestPreview.simulationStatus,          mono: true },
              { k: 'Live Execution',  v: latestPreview.liveExecutionStatus,       mono: true },
              { k: 'Trading',         v: latestPreview.tradingStatus,             mono: true },
              { k: 'Browser Auto',    v: latestPreview.browserAutomationStatus,   mono: true },
              { k: 'API Calls',       v: latestPreview.apiCallStatus,             mono: true },
              { k: 'Credentials',     v: latestPreview.credentialStatus,          mono: true },
              { k: 'Money Movement',  v: latestPreview.moneyMovementStatus,       mono: true },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 space-y-1.5">
            <div className="text-[8px] text-slate-400"><span className="font-semibold text-slate-500 uppercase tracking-wider">Intended Effect: </span>{latestPreview.intendedEffectPreview}</div>
            <div className="text-[8px] text-slate-400"><span className="font-semibold text-slate-500 uppercase tracking-wider">Expected Inputs: </span>{latestPreview.expectedInputsPreview}</div>
            <div className="text-[8px] text-slate-400"><span className="font-semibold text-slate-500 uppercase tracking-wider">Expected Outputs: </span>{latestPreview.expectedOutputsPreview}</div>
            <div className="text-[7px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1 mt-1">
              nextRequiredStep: {latestPreview.safetyBoundary?.nextRequiredStep}
            </div>
          </div>
        </div>
      )}

      {/* Last 5 preview records */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Simulation Previews ({recent5.length} of {previews.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <PreviewRecord key={rec.simulationPreviewId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Simulation Preview Safety Guarantee</div>
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
            'No real system simulated or executed',
            'Draft validation results never modified',
            'Drafts never modified',
            'Contracts never modified',
            'Writes only to openclawDryRunSimulationPreviews',
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
        <Eye className="w-3 h-3 shrink-0" />
        previewMode = DRY_RUN_SIMULATION_PREVIEW · executionStatus = NOT_EXECUTED · simulationStatus = PREVIEW_ONLY · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}