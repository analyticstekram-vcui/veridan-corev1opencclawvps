/**
 * OpenClawDryRunActionContractValidator
 * Local-only validator that checks dry-run action contracts against the verified
 * contract schema before any future simulation layer is designed.
 *
 * Reads:  openclawDryRunActionContracts
 *         openclawDryRunExecutionPlanningGates
 *         openclawReadOnlyGovernanceBaselineLocks
 *
 * Writes: openclawDryRunActionContractValidationResults (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This validator only validates the contract schema — it does NOT create,
 * simulate, or execute any actions.
 */
import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ClipboardCheck, Download, Copy, RefreshCw, ChevronDown, XCircle } from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const CONTRACTS_KEY   = 'openclawDryRunActionContracts';
const GATES_KEY       = 'openclawDryRunExecutionPlanningGates';
const LOCKS_KEY       = 'openclawReadOnlyGovernanceBaselineLocks';
const RESULTS_KEY     = 'openclawDryRunActionContractValidationResults';

// ── Expected values ────────────────────────────────────────────────────────────
const EXPECTED_ALLOWED_TYPES = [
  'READ_ONLY_STATUS_CHECK',
  'READ_ONLY_DATA_PARSE',
  'READ_ONLY_PROPOSAL_SIMULATION',
  'READ_ONLY_POLICY_MATCH',
  'READ_ONLY_EVIDENCE_REPLAY',
  'READ_ONLY_AUDIT_REVIEW',
];

const EXPECTED_PROHIBITED_TYPES = [
  'LIVE_TRADE', 'PAPER_TRADE', 'BROKER_ORDER', 'BANK_TRANSFER', 'CRYPTO_TRANSFER',
  'BROWSER_CLICK', 'BROWSER_TYPE', 'BROWSER_SUBMIT',
  'API_POST', 'API_PATCH', 'API_DELETE',
  'CREDENTIAL_READ', 'SECRET_EXPOSURE', 'FILE_DELETE', 'SCHEDULED_EXECUTION',
];

const EXPECTED_REQUIRED_FIELDS = [
  'actionId', 'createdAt', 'actionType', 'sourceProposalId', 'sourceReviewId',
  'riskTier', 'intendedEffect', 'expectedInputs', 'expectedOutputs',
  'executionMode', 'approvalRequired', 'nonExecutionGuarantee',
  'prohibitedCapabilities', 'auditTags',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function loadSourceData() {
  const contracts = (() => { const r = loadJSON(CONTRACTS_KEY, []); return Array.isArray(r) ? r : []; })();
  const gates     = (() => { const r = loadJSON(GATES_KEY,     []); return Array.isArray(r) ? r : []; })();
  const locks     = (() => { const r = loadJSON(LOCKS_KEY,     []); return Array.isArray(r) ? r : []; })();
  return { contracts, gates, locks };
}

// ── Validation logic (26 checks) ──────────────────────────────────────────────
function arraysMatch(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function arrayContainsAll(arr, expected) {
  if (!Array.isArray(arr)) return false;
  return expected.every(v => arr.includes(v));
}

function runValidation(contracts, gates, locks) {
  const contract  = contracts[0] ?? null;
  const gate      = gates[0]    ?? null;
  const lock      = locks[0]    ?? null;

  // No contract → HOLD immediately
  if (!contract) {
    return {
      validationStatus: 'HOLD',
      checks: [],
      failedChecks: [],
      contract: null, gate, lock,
      allowedDryRunActionTypesConfirmed: false,
      prohibitedActionTypesConfirmed: false,
      requiredContractFieldsConfirmed: false,
      safetyBoundaryConfirmed: false,
    };
  }

  const sb  = contract.safetyBoundary   ?? {};
  const nep = contract.nonExecutionProof ?? {};

  const checks = [
    { id: 'check1',  label: 'At least one dry-run action contract exists',                         pass: contracts.length > 0 },
    { id: 'check2',  label: 'contractStatus === "CONTRACT_READY"',                                  pass: contract.contractStatus === 'CONTRACT_READY' },
    { id: 'check3',  label: 'executionStatus === "NOT_EXECUTED"',                                   pass: contract.executionStatus === 'NOT_EXECUTED' },
    { id: 'check4',  label: 'dryRunExecutionStatus === "NOT_STARTED"',                              pass: contract.dryRunExecutionStatus === 'NOT_STARTED' },
    { id: 'check5',  label: 'liveExecutionStatus === "DISABLED"',                                   pass: contract.liveExecutionStatus === 'DISABLED' },
    { id: 'check6',  label: 'tradingStatus === "DISABLED"',                                         pass: contract.tradingStatus === 'DISABLED' },
    { id: 'check7',  label: 'browserAutomationStatus === "DISABLED"',                               pass: contract.browserAutomationStatus === 'DISABLED' },
    { id: 'check8',  label: 'apiCallStatus === "DISABLED"',                                         pass: contract.apiCallStatus === 'DISABLED' },
    { id: 'check9',  label: 'credentialStatus === "NOT_ACCESSED"',                                  pass: contract.credentialStatus === 'NOT_ACCESSED' },
    { id: 'check10', label: 'moneyMovementStatus === "DISABLED"',                                   pass: contract.moneyMovementStatus === 'DISABLED' },
    { id: 'check11', label: 'allowedDryRunActionTypes matches exactly the 6 allowed types',         pass: arraysMatch(contract.allowedDryRunActionTypes, EXPECTED_ALLOWED_TYPES) },
    { id: 'check12', label: 'prohibitedActionTypes contains all 15 prohibited types',               pass: arrayContainsAll(contract.prohibitedActionTypes, EXPECTED_PROHIBITED_TYPES) },
    { id: 'check13', label: 'requiredContractFields contains all 14 required fields',               pass: arrayContainsAll(contract.requiredContractFields, EXPECTED_REQUIRED_FIELDS) },
    { id: 'check14', label: 'safetyBoundary.contractCreatesActions === false',                      pass: sb.contractCreatesActions === false },
    { id: 'check15', label: 'safetyBoundary.contractSimulatesActions === false',                    pass: sb.contractSimulatesActions === false },
    { id: 'check16', label: 'safetyBoundary.contractExecutesActions === false',                     pass: sb.contractExecutesActions === false },
    { id: 'check17', label: 'safetyBoundary.dryRunExecutionAuthorized === false',                   pass: sb.dryRunExecutionAuthorized === false },
    { id: 'check18', label: 'safetyBoundary.liveExecutionAuthorized === false',                     pass: sb.liveExecutionAuthorized === false },
    { id: 'check19', label: 'safetyBoundary.tradingAuthorized === false',                           pass: sb.tradingAuthorized === false },
    { id: 'check20', label: 'safetyBoundary.browserAutomationAuthorized === false',                 pass: sb.browserAutomationAuthorized === false },
    { id: 'check21', label: 'safetyBoundary.apiCallsAuthorized === false',                          pass: sb.apiCallsAuthorized === false },
    { id: 'check22', label: 'safetyBoundary.credentialAccessAuthorized === false',                  pass: sb.credentialAccessAuthorized === false },
    { id: 'check23', label: 'safetyBoundary.moneyMovementAuthorized === false',                     pass: sb.moneyMovementAuthorized === false },
    { id: 'check24', label: 'nonExecutionProof.networkCallsMade === false',                         pass: nep.networkCallsMade === false },
    { id: 'check25', label: 'nonExecutionProof.executionDispatched === false',                      pass: nep.executionDispatched === false },
    { id: 'check26', label: 'nonExecutionProof.dryRunActionCreated === false',                      pass: nep.dryRunActionCreated === false },
  ];

  const failedChecks = checks.filter(c => !c.pass).map(c => c.id);
  const allPass      = failedChecks.length === 0;

  const allowedOk    = arraysMatch(contract.allowedDryRunActionTypes, EXPECTED_ALLOWED_TYPES);
  const prohibitedOk = arrayContainsAll(contract.prohibitedActionTypes, EXPECTED_PROHIBITED_TYPES);
  const fieldsOk     = arrayContainsAll(contract.requiredContractFields, EXPECTED_REQUIRED_FIELDS);
  const safetyOk     = checks.slice(13, 23).every(c => c.pass); // checks 14–23

  return {
    validationStatus: allPass ? 'VALID_CONTRACT' : 'INVALID_CONTRACT',
    checks,
    failedChecks,
    contract, gate, lock,
    allowedDryRunActionTypesConfirmed: allowedOk,
    prohibitedActionTypesConfirmed: prohibitedOk,
    requiredContractFieldsConfirmed: fieldsOk,
    safetyBoundaryConfirmed: safetyOk,
  };
}

// ── Result builder ─────────────────────────────────────────────────────────────
function buildResult(v) {
  return {
    validationResultId:   `dry-run-contract-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    validatedAt:          new Date().toISOString(),
    validatorMode:        'DRY_RUN_ACTION_CONTRACT_VALIDATOR',
    validationStatus:     v.validationStatus,

    executionStatus:         'NOT_EXECUTED',
    simulationStatus:        'NOT_STARTED',
    liveExecutionStatus:     'DISABLED',
    tradingStatus:           'DISABLED',
    browserAutomationStatus: 'DISABLED',
    apiCallStatus:           'DISABLED',
    credentialStatus:        'NOT_ACCESSED',
    moneyMovementStatus:     'DISABLED',

    sourceContractId:     v.contract?.dryRunActionContractId  ?? null,
    sourceContractStatus: v.contract?.contractStatus           ?? null,
    latestPlanningGateId: v.gate?.dryRunPlanningGateId         ?? null,
    latestBaselineLockId: v.lock?.baselineLockId               ?? null,

    validationChecks:    v.checks.map(c => ({ id: c.id, label: c.label, pass: c.pass })),
    failedChecks:        v.failedChecks,

    allowedDryRunActionTypesConfirmed: v.allowedDryRunActionTypesConfirmed,
    prohibitedActionTypesConfirmed:    v.prohibitedActionTypesConfirmed,
    requiredContractFieldsConfirmed:   v.requiredContractFieldsConfirmed,
    safetyBoundaryConfirmed:           v.safetyBoundaryConfirmed,

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
      contractsModified:            false,
      planningGatesModified:        false,
      baselineLocksModified:        false,
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
    VALID_CONTRACT:   'text-primary border-primary/30 bg-primary/5',
    INVALID_CONTRACT: 'text-destructive border-destructive/30 bg-destructive/5',
    HOLD:             'text-amber-500 border-amber-500/30 bg-amber-500/5',
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
          <div className="text-[7px] font-mono text-slate-500">{record.validationResultId}</div>
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
export default function OpenClawDryRunActionContractValidator() {
  const [source, setSource]         = useState(() => loadSourceData());
  const [results, setResults]       = useState(() => loadJSON(RESULTS_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]         = useState(false);

  const latestResult = results[0] ?? null;
  const recent5      = results.slice(0, 5);

  const previewValidation = useMemo(
    () => runValidation(source.contracts, source.gates, source.locks),
    [source]
  );

  const handleRefresh = () => {
    setSource(loadSourceData());
    setResults(loadJSON(RESULTS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleValidate = () => {
    const v       = runValidation(source.contracts, source.gates, source.locks);
    const result  = buildResult(v);
    const updated = [result, ...results].slice(0, 20);
    try { localStorage.setItem(RESULTS_KEY, JSON.stringify(updated)); } catch {}
    setResults(updated);
    setLastAction(`Validation complete — ${result.validationResultId} — ${result.validationStatus}`);
  };

  const handleCopy = () => {
    if (!latestResult) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest validation JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestResult) return;
    try {
      const blob = new Blob([JSON.stringify(latestResult, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-contract-validation-${latestResult.validationResultId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Validation JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const { validationStatus, checks, failedChecks, contract, gate, lock } = previewValidation;
  const isValid = validationStatus === 'VALID_CONTRACT';
  const isHold  = validationStatus === 'HOLD';

  const statusCfg = {
    VALID_CONTRACT:   { border: 'border-primary/30',     bg: 'bg-primary/5',     icon: CheckCircle2, iconColor: 'text-primary',     text: 'text-primary',     badge: 'text-primary border-primary/30 bg-primary/5' },
    INVALID_CONTRACT: { border: 'border-destructive/30', bg: 'bg-destructive/5', icon: XCircle,      iconColor: 'text-destructive', text: 'text-destructive', badge: 'text-destructive border-destructive/30 bg-destructive/5' },
    HOLD:             { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   icon: AlertCircle,  iconColor: 'text-amber-500',   text: 'text-amber-500',   badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  }[validationStatus] ?? { border: 'border-slate-500/30', bg: 'bg-slate-500/5', icon: AlertCircle, iconColor: 'text-slate-400', text: 'text-slate-400', badge: 'text-slate-400 border-slate-400/30' };

  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Contract Validator</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Dry-Run Action Contract Validator
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Validates dry-run action contracts against the verified schema before any future simulation layer.
            Does not create, simulate, or execute actions. Writes only to <span className="font-mono">openclawDryRunActionContractValidationResults</span>.
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
              ? 'HOLD — No dry-run action contracts found in localStorage'
              : isValid
              ? `VALID_CONTRACT — All ${checks.length} validation checks pass`
              : `INVALID_CONTRACT — ${failedChecks.length} of ${checks.length} check(s) failed`}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.contracts.length} contract(s) · {source.gates.length} planning gate(s) · {source.locks.length} baseline lock(s)
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
          <div><span className="text-slate-500">Source Contract ID: </span><span className={`font-mono text-[7px] ${contract ? 'text-slate-300' : 'text-slate-600'}`}>{contract?.dryRunActionContractId ?? '—'}</span></div>
          <div><span className="text-slate-500">Contract Status: </span><span className={`font-bold font-mono ${contract?.contractStatus === 'CONTRACT_READY' ? 'text-primary' : 'text-amber-500'}`}>{contract?.contractStatus ?? '—'}</span></div>
          <div><span className="text-slate-500">Latest Planning Gate: </span><span className={`font-mono text-[7px] ${gate ? 'text-slate-300' : 'text-slate-600'}`}>{gate?.dryRunPlanningGateId ?? '—'}</span></div>
          <div><span className="text-slate-500">Latest Baseline Lock: </span><span className={`font-mono text-[7px] ${lock ? 'text-slate-300' : 'text-slate-600'}`}>{lock?.baselineLockId ?? '—'}</span></div>
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
              { label: 'allowedDryRunActionTypesConfirmed', value: previewValidation.allowedDryRunActionTypesConfirmed },
              { label: 'prohibitedActionTypesConfirmed',    value: previewValidation.prohibitedActionTypesConfirmed },
              { label: 'requiredContractFieldsConfirmed',   value: previewValidation.requiredContractFieldsConfirmed },
              { label: 'safetyBoundaryConfirmed',           value: previewValidation.safetyBoundaryConfirmed },
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
          Validate Latest Dry-Run Action Contract
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Validation JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Validation JSON
        </button>
      </div>

      {/* Latest result preview */}
      {latestResult && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Validation Result Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestResult.validatedAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Validator Mode',    v: latestResult.validatorMode,            mono: true },
              { k: 'Validation Status', v: latestResult.validationStatus,         mono: true },
              { k: 'Exec Status',       v: latestResult.executionStatus,          mono: true },
              { k: 'Simulation',        v: latestResult.simulationStatus,         mono: true },
              { k: 'Live Execution',    v: latestResult.liveExecutionStatus,      mono: true },
              { k: 'Trading',           v: latestResult.tradingStatus,            mono: true },
              { k: 'Browser Auto',      v: latestResult.browserAutomationStatus,  mono: true },
              { k: 'API Calls',         v: latestResult.apiCallStatus,            mono: true },
              { k: 'Credentials',       v: latestResult.credentialStatus,         mono: true },
              { k: 'Money Movement',    v: latestResult.moneyMovementStatus,      mono: true },
              { k: 'Checks Total',      v: latestResult.validationChecks?.length ?? 0 },
              { k: 'Failed Checks',     v: latestResult.failedChecks?.length ?? 0 },
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
              Recent Validation Results ({recent5.length} of {results.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <ResultRecord key={rec.validationResultId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Contract Validator Safety Guarantee</div>
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
            'No actions created or simulated',
            'Contracts never modified',
            'Planning gates never modified',
            'Baseline locks never modified',
            'Writes only to openclawDryRunActionContractValidationResults',
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
        validatorMode = DRY_RUN_ACTION_CONTRACT_VALIDATOR · executionStatus = NOT_EXECUTED · simulationStatus = NOT_STARTED · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}