/**
 * OpenClawDryRunActionDraftValidator
 * Local-only validator that checks dry-run action drafts against the validated
 * contract before any future simulation preview is designed.
 *
 * Reads:  openclawDryRunActionDrafts
 *         openclawDryRunActionContractValidationResults
 *         openclawDryRunActionContracts
 *
 * Writes: openclawDryRunActionDraftValidationResults (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This validator only validates draft schema — it does NOT simulate or execute actions.
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertCircle, ClipboardCheck,
  Download, Copy, RefreshCw, ChevronDown, XCircle
} from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const DRAFTS_KEY      = 'openclawDryRunActionDrafts';
const VALIDATION_KEY  = 'openclawDryRunActionContractValidationResults';
const CONTRACTS_KEY   = 'openclawDryRunActionContracts';
const RESULTS_KEY     = 'openclawDryRunActionDraftValidationResults';

// ── Allowed action types ───────────────────────────────────────────────────────
const ALLOWED_ACTION_TYPES = [
  'READ_ONLY_STATUS_CHECK',
  'READ_ONLY_DATA_PARSE',
  'READ_ONLY_PROPOSAL_SIMULATION',
  'READ_ONLY_POLICY_MATCH',
  'READ_ONLY_EVIDENCE_REPLAY',
  'READ_ONLY_AUDIT_REVIEW',
];

const ALLOWED_RISK_TIERS = ['LOW', 'MEDIUM'];

const REQUIRED_PROHIBITED_CAPABILITIES = [
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
  const drafts      = (() => { const r = loadJSON(DRAFTS_KEY,     []); return Array.isArray(r) ? r : []; })();
  const validations = (() => { const r = loadJSON(VALIDATION_KEY, []); return Array.isArray(r) ? r : []; })();
  const contracts   = (() => { const r = loadJSON(CONTRACTS_KEY,  []); return Array.isArray(r) ? r : []; })();
  return { drafts, validations, contracts };
}

function containsAll(arr, required) {
  if (!Array.isArray(arr)) return false;
  return required.every(v => arr.includes(v));
}

// ── Validation logic (33 checks) ──────────────────────────────────────────────
function runValidation(source) {
  const { drafts, validations, contracts } = source;
  const draft      = drafts[0]      ?? null;
  const valResult  = validations[0] ?? null;
  const contract   = contracts[0]   ?? null;

  if (!draft) {
    return {
      validationStatus: 'HOLD',
      checks: [],
      failedChecks: [],
      draft, valResult, contract,
      allowedActionTypeConfirmed:       false,
      requiredFieldsConfirmed:          false,
      prohibitedCapabilitiesConfirmed:  false,
      safetyBoundaryConfirmed:          false,
    };
  }

  const sb  = draft.safetyBoundary   ?? {};
  const nep = draft.nonExecutionProof ?? {};
  const pc  = draft.prohibitedCapabilities ?? [];

  const checks = [
    { id: 'check1',  label: 'At least one draft exists',                                          pass: drafts.length > 0 },
    { id: 'check2',  label: 'Latest draft draftStatus === "DRAFT_READY"',                         pass: draft.draftStatus === 'DRAFT_READY' },
    { id: 'check3',  label: 'Latest draft executionStatus === "NOT_EXECUTED"',                    pass: draft.executionStatus === 'NOT_EXECUTED' },
    { id: 'check4',  label: 'Latest draft simulationStatus === "NOT_STARTED"',                    pass: draft.simulationStatus === 'NOT_STARTED' },
    { id: 'check5',  label: 'Latest draft liveExecutionStatus === "DISABLED"',                    pass: draft.liveExecutionStatus === 'DISABLED' },
    { id: 'check6',  label: 'Latest draft tradingStatus === "DISABLED"',                          pass: draft.tradingStatus === 'DISABLED' },
    { id: 'check7',  label: 'Latest draft browserAutomationStatus === "DISABLED"',                pass: draft.browserAutomationStatus === 'DISABLED' },
    { id: 'check8',  label: 'Latest draft apiCallStatus === "DISABLED"',                          pass: draft.apiCallStatus === 'DISABLED' },
    { id: 'check9',  label: 'Latest draft credentialStatus === "NOT_ACCESSED"',                   pass: draft.credentialStatus === 'NOT_ACCESSED' },
    { id: 'check10', label: 'Latest draft moneyMovementStatus === "DISABLED"',                    pass: draft.moneyMovementStatus === 'DISABLED' },
    { id: 'check11', label: 'Latest draft actionType is in the allowed read-only list',           pass: ALLOWED_ACTION_TYPES.includes(draft.actionType) },
    { id: 'check12', label: 'Latest draft riskTier is LOW or MEDIUM',                             pass: ALLOWED_RISK_TIERS.includes(draft.riskTier) },
    { id: 'check13', label: 'Latest draft executionMode === "DRY_RUN_ONLY"',                      pass: draft.executionMode === 'DRY_RUN_ONLY' },
    { id: 'check14', label: 'Latest draft approvalRequired === true',                             pass: draft.approvalRequired === true },
    { id: 'check15', label: 'Latest draft has sourceProposalId',                                  pass: !!draft.sourceProposalId },
    { id: 'check16', label: 'Latest draft has sourceReviewId',                                    pass: !!draft.sourceReviewId },
    { id: 'check17', label: 'Latest draft has actionId',                                          pass: !!draft.actionId },
    { id: 'check18', label: 'Latest draft has intendedEffect',                                    pass: !!draft.intendedEffect && draft.intendedEffect !== '(not specified)' },
    { id: 'check19', label: 'Latest draft has expectedInputs',                                    pass: !!draft.expectedInputs && draft.expectedInputs !== '(not specified)' },
    { id: 'check20', label: 'Latest draft has expectedOutputs',                                   pass: !!draft.expectedOutputs && draft.expectedOutputs !== '(not specified)' },
    { id: 'check21', label: 'prohibitedCapabilities includes all 15 required prohibited types',   pass: containsAll(pc, REQUIRED_PROHIBITED_CAPABILITIES) },
    { id: 'check22', label: 'safetyBoundary.draftCreatesActions === false',                       pass: sb.draftCreatesActions === false },
    { id: 'check23', label: 'safetyBoundary.draftSimulatesActions === false',                     pass: sb.draftSimulatesActions === false },
    { id: 'check24', label: 'safetyBoundary.draftExecutesActions === false',                      pass: sb.draftExecutesActions === false },
    { id: 'check25', label: 'safetyBoundary.dryRunExecutionAuthorized === false',                 pass: sb.dryRunExecutionAuthorized === false },
    { id: 'check26', label: 'safetyBoundary.liveExecutionAuthorized === false',                   pass: sb.liveExecutionAuthorized === false },
    { id: 'check27', label: 'safetyBoundary.tradingAuthorized === false',                         pass: sb.tradingAuthorized === false },
    { id: 'check28', label: 'safetyBoundary.browserAutomationAuthorized === false',               pass: sb.browserAutomationAuthorized === false },
    { id: 'check29', label: 'safetyBoundary.apiCallsAuthorized === false',                        pass: sb.apiCallsAuthorized === false },
    { id: 'check30', label: 'safetyBoundary.credentialAccessAuthorized === false',                pass: sb.credentialAccessAuthorized === false },
    { id: 'check31', label: 'safetyBoundary.moneyMovementAuthorized === false',                   pass: sb.moneyMovementAuthorized === false },
    { id: 'check32', label: 'nonExecutionProof.networkCallsMade === false',                       pass: nep.networkCallsMade === false },
    { id: 'check33', label: 'nonExecutionProof.executionDispatched === false',                    pass: nep.executionDispatched === false },
  ];

  const failedChecks = checks.filter(c => !c.pass).map(c => c.id);
  const allPass      = failedChecks.length === 0;

  const actionTypeOk     = ALLOWED_ACTION_TYPES.includes(draft.actionType);
  const requiredFieldsOk = checks.slice(14, 20).every(c => c.pass); // checks 15–20
  const prohibitedOk     = containsAll(pc, REQUIRED_PROHIBITED_CAPABILITIES);
  const safetyOk         = checks.slice(21, 31).every(c => c.pass); // checks 22–31

  return {
    validationStatus: allPass ? 'VALID_DRAFT' : 'INVALID_DRAFT',
    checks,
    failedChecks,
    draft, valResult, contract,
    allowedActionTypeConfirmed:       actionTypeOk,
    requiredFieldsConfirmed:          requiredFieldsOk,
    prohibitedCapabilitiesConfirmed:  prohibitedOk,
    safetyBoundaryConfirmed:          safetyOk,
  };
}

// ── Result builder ─────────────────────────────────────────────────────────────
function buildResult(v) {
  return {
    draftValidationResultId: `dry-run-draft-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    validatedAt:             new Date().toISOString(),
    validatorMode:           'DRY_RUN_ACTION_DRAFT_VALIDATOR',
    validationStatus:        v.validationStatus,

    executionStatus:         'NOT_EXECUTED',
    simulationStatus:        'NOT_STARTED',
    liveExecutionStatus:     'DISABLED',
    tradingStatus:           'DISABLED',
    browserAutomationStatus: 'DISABLED',
    apiCallStatus:           'DISABLED',
    credentialStatus:        'NOT_ACCESSED',
    moneyMovementStatus:     'DISABLED',

    sourceDraftActionId:              v.draft?.draftActionId              ?? null,
    sourceDraftStatus:                v.draft?.draftStatus                ?? null,
    sourceContractValidationResultId: v.valResult?.validationResultId     ?? null,
    sourceContractId:                 v.valResult?.sourceContractId       ?? v.contract?.dryRunActionContractId ?? null,

    validationChecks: v.checks.map(c => ({ id: c.id, label: c.label, pass: c.pass })),
    failedChecks:     v.failedChecks,

    allowedActionTypeConfirmed:      v.allowedActionTypeConfirmed,
    requiredFieldsConfirmed:         v.requiredFieldsConfirmed,
    prohibitedCapabilitiesConfirmed: v.prohibitedCapabilitiesConfirmed,
    safetyBoundaryConfirmed:         v.safetyBoundaryConfirmed,

    nonExecutionProof: {
      fetchCalled:                  false,
      axiosCalled:                  false,
      base44SdkCalled:              false,
      openClawCalled:               false,
      apiCalled:                    false,
      browserAutomationPerformed:   false,
      tradingPerformed:             false,
      credentialHandled:            false,
      processEnvAccessed:           false,
      denoEnvAccessed:              false,
      networkCallsMade:             false,
      executionDispatched:          false,
      customEventsFired:            false,
      draftsModified:               false,
      contractValidationResultsModified: false,
      contractsModified:            false,
      writeTargetKey:               RESULTS_KEY,
    },
  };
}

// ── UI sub-components ──────────────────────────────────────────────────────────
function CheckRow({ check }) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 bg-secondary/20 rounded">
      {check.pass
        ? <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        : <XCircle className="w-3 h-3 shrink-0 mt-0.5 text-destructive" />}
      <span className="flex-1 text-[8px] text-slate-300">{check.id}: {check.label}</span>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${check.pass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {check.pass ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

function ResultRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = {
    VALID_DRAFT:   'text-primary border-primary/30 bg-primary/5',
    INVALID_DRAFT: 'text-destructive border-destructive/30 bg-destructive/5',
    HOLD:          'text-amber-500 border-amber-500/30 bg-amber-500/5',
  }[record.validationStatus] ?? 'text-slate-400 border-slate-400/30';

  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
              {record.validationStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/20 bg-primary/5">
              {record.validatorMode}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.draftValidationResultId}</div>
          <div className="text-[7px] text-slate-600">
            {new Date(record.validatedAt).toLocaleString()}
            {record.failedChecks?.length > 0 && <span className="text-destructive ml-2">· {record.failedChecks.length} failed</span>}
          </div>
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
export default function OpenClawDryRunActionDraftValidator() {
  const [source, setSource]         = useState(() => loadSourceData());
  const [results, setResults]       = useState(() => loadJSON(RESULTS_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]         = useState(false);

  const latestResult = results[0] ?? null;
  const recent5      = results.slice(0, 5);

  const previewValidation = useMemo(
    () => runValidation(source),
    [source]
  );

  const handleRefresh = () => {
    setSource(loadSourceData());
    setResults(loadJSON(RESULTS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleValidate = () => {
    const v       = runValidation(source);
    const result  = buildResult(v);
    const updated = [result, ...results].slice(0, 20);
    try { localStorage.setItem(RESULTS_KEY, JSON.stringify(updated)); } catch {}
    setResults(updated);
    setLastAction(`Validation complete — ${result.draftValidationResultId} — ${result.validationStatus}`);
  };

  const handleCopy = () => {
    if (!latestResult) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest draft validation JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestResult) return;
    try {
      const blob = new Blob([JSON.stringify(latestResult, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-draft-validation-${latestResult.draftValidationResultId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Draft validation JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const { validationStatus, checks, failedChecks, draft, valResult } = previewValidation;
  const isValid = validationStatus === 'VALID_DRAFT';
  const isHold  = validationStatus === 'HOLD';

  const statusCfg = {
    VALID_DRAFT:   { border: 'border-primary/30',     bg: 'bg-primary/5',     icon: CheckCircle2, iconColor: 'text-primary',     text: 'text-primary',     badge: 'text-primary border-primary/30 bg-primary/5' },
    INVALID_DRAFT: { border: 'border-destructive/30', bg: 'bg-destructive/5', icon: XCircle,      iconColor: 'text-destructive', text: 'text-destructive', badge: 'text-destructive border-destructive/30 bg-destructive/5' },
    HOLD:          { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   icon: AlertCircle,  iconColor: 'text-amber-500',   text: 'text-amber-500',   badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  }[validationStatus] ?? { border: 'border-slate-500/30', bg: 'bg-slate-500/5', icon: AlertCircle, iconColor: 'text-slate-400', text: 'text-slate-400', badge: 'text-slate-400 border-slate-400/30' };

  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Draft Validator</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Dry-Run Action Draft Validator
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Validates dry-run action drafts against the verified contract before any future simulation preview.
            Does not simulate or execute actions. Writes only to <span className="font-mono">openclawDryRunActionDraftValidationResults</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Live validation status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${statusCfg.border} ${statusCfg.bg}`}>
        <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.iconColor}`} />
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.text}`}>
            {isHold
              ? 'HOLD — No dry-run action drafts found in localStorage'
              : isValid
              ? `VALID_DRAFT — All ${checks.length} validation checks pass`
              : `INVALID_DRAFT — ${failedChecks.length} of ${checks.length} check(s) failed`}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.drafts.length} draft(s) · {source.validations.length} contract validation result(s) · {source.contracts.length} contract(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusCfg.badge}`}>
          {validationStatus}
        </span>
      </div>

      {/* Source reference strip */}
      <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-1.5">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Source References</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
          <div>
            <span className="text-slate-500">Source Draft ID: </span>
            <span className={`font-mono text-[7px] ${draft ? 'text-slate-300' : 'text-slate-600'}`}>{draft?.draftActionId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Draft Status: </span>
            <span className={`font-bold font-mono ${draft?.draftStatus === 'DRAFT_READY' ? 'text-primary' : 'text-amber-500'}`}>
              {draft?.draftStatus ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Contract Validation Result ID: </span>
            <span className={`font-mono text-[7px] ${valResult ? 'text-slate-300' : 'text-slate-600'}`}>{valResult?.validationResultId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Draft actionType: </span>
            <span className={`font-mono text-[7px] ${draft ? 'text-slate-300' : 'text-slate-600'}`}>{draft?.actionType ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Failed checks alert */}
      {failedChecks.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border-2 border-destructive/30 rounded-lg">
          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold text-destructive uppercase tracking-wider">Failed Checks</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {failedChecks.map(id => (
                <span key={id} className="text-[7px] font-mono px-1.5 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive rounded">{id}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation checks */}
      {!isHold && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Validation Checks ({checks.filter(c => c.pass).length}/{checks.length} passing)
          </div>
          <div className="space-y-1">
            {checks.map(c => <CheckRow key={c.id} check={c} />)}
          </div>
        </div>
      )}

      {/* Confirmation flags */}
      {!isHold && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirmation Flags</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              { label: 'allowedActionTypeConfirmed',      value: previewValidation.allowedActionTypeConfirmed },
              { label: 'requiredFieldsConfirmed',         value: previewValidation.requiredFieldsConfirmed },
              { label: 'prohibitedCapabilitiesConfirmed', value: previewValidation.prohibitedCapabilitiesConfirmed },
              { label: 'safetyBoundaryConfirmed',         value: previewValidation.safetyBoundaryConfirmed },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-secondary/20 rounded">
                {value
                  ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                <span className="text-[8px] font-mono text-slate-300 flex-1">{label}</span>
                <span className={`text-[7px] font-bold ${value ? 'text-primary' : 'text-destructive'}`}>{value ? 'TRUE' : 'FALSE'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last action */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleValidate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded">
          <ClipboardCheck className="w-3.5 h-3.5" />
          Validate Latest Dry-Run Action Draft
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Draft Validation JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Draft Validation JSON
        </button>
      </div>

      {/* Latest result preview */}
      {latestResult && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Draft Validation Result Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestResult.validatedAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Validator Mode',     v: latestResult.validatorMode,           mono: true },
              { k: 'Validation Status',  v: latestResult.validationStatus,        mono: true },
              { k: 'Exec Status',        v: latestResult.executionStatus,         mono: true },
              { k: 'Simulation',         v: latestResult.simulationStatus,        mono: true },
              { k: 'Live Execution',     v: latestResult.liveExecutionStatus,     mono: true },
              { k: 'Trading',            v: latestResult.tradingStatus,           mono: true },
              { k: 'Browser Auto',       v: latestResult.browserAutomationStatus, mono: true },
              { k: 'API Calls',          v: latestResult.apiCallStatus,           mono: true },
              { k: 'Credentials',        v: latestResult.credentialStatus,        mono: true },
              { k: 'Money Movement',     v: latestResult.moneyMovementStatus,     mono: true },
              { k: 'Checks Total',       v: latestResult.validationChecks?.length ?? 0 },
              { k: 'Failed Checks',      v: latestResult.failedChecks?.length ?? 0 },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          {latestResult.failedChecks?.length > 0 && (
            <div className="px-4 pb-3">
              <div className="text-[8px] text-destructive font-semibold uppercase tracking-wider mb-1">Failed Check IDs</div>
              <div className="flex flex-wrap gap-1">
                {latestResult.failedChecks.map(id => (
                  <span key={id} className="text-[7px] font-mono px-1.5 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive rounded">{id}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last 5 results */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Draft Validation Results ({recent5.length} of {results.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <ResultRecord key={rec.draftValidationResultId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Draft Validator Safety Guarantee</div>
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
            'Drafts never modified',
            'Contract validation results never modified',
            'Contracts never modified',
            'Writes only to openclawDryRunActionDraftValidationResults',
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
        <ClipboardCheck className="w-3 h-3 shrink-0" />
        validatorMode = DRY_RUN_ACTION_DRAFT_VALIDATOR · executionStatus = NOT_EXECUTED · simulationStatus = NOT_STARTED · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}