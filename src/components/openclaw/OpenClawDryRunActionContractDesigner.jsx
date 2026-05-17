/**
 * OpenClawDryRunActionContractDesigner
 * Local-only contract designer that defines the allowed shape of future dry-run
 * action contracts. Requires the Dry-Run Execution Planning Gate to be PLANNING_ALLOWED.
 *
 * Reads:  openclawDryRunExecutionPlanningGates
 *         openclawReadOnlyGovernanceBaselineLocks
 *         openclawProposalReviewEvidenceExports
 *         openclawProposalReviews
 *
 * Writes: openclawDryRunActionContracts (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This component only defines the future dry-run contract schema — it does NOT
 * create, simulate, or execute any actions.
 */
import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, Download, Copy, RefreshCw, ChevronDown } from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const GATES_KEY   = 'openclawDryRunExecutionPlanningGates';
const LOCKS_KEY   = 'openclawReadOnlyGovernanceBaselineLocks';
const EXPORTS_KEY = 'openclawProposalReviewEvidenceExports';
const REVIEWS_KEY = 'openclawProposalReviews';
const CONTRACTS_KEY = 'openclawDryRunActionContracts';

// ── Static contract schema definitions ────────────────────────────────────────
const ALLOWED_DRY_RUN_ACTION_TYPES = [
  'READ_ONLY_STATUS_CHECK',
  'READ_ONLY_DATA_PARSE',
  'READ_ONLY_PROPOSAL_SIMULATION',
  'READ_ONLY_POLICY_MATCH',
  'READ_ONLY_EVIDENCE_REPLAY',
  'READ_ONLY_AUDIT_REVIEW',
];

const PROHIBITED_ACTION_TYPES = [
  'LIVE_TRADE',
  'PAPER_TRADE',
  'BROKER_ORDER',
  'BANK_TRANSFER',
  'CRYPTO_TRANSFER',
  'BROWSER_CLICK',
  'BROWSER_TYPE',
  'BROWSER_SUBMIT',
  'API_POST',
  'API_PATCH',
  'API_DELETE',
  'CREDENTIAL_READ',
  'SECRET_EXPOSURE',
  'FILE_DELETE',
  'SCHEDULED_EXECUTION',
];

const REQUIRED_CONTRACT_FIELDS = [
  'actionId',
  'createdAt',
  'actionType',
  'sourceProposalId',
  'sourceReviewId',
  'riskTier',
  'intendedEffect',
  'expectedInputs',
  'expectedOutputs',
  'executionMode',
  'approvalRequired',
  'nonExecutionGuarantee',
  'prohibitedCapabilities',
  'auditTags',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function loadSourceData() {
  const gates   = (() => { const r = loadJSON(GATES_KEY,   []); return Array.isArray(r) ? r : []; })();
  const locks   = (() => { const r = loadJSON(LOCKS_KEY,   []); return Array.isArray(r) ? r : []; })();
  const exports_ = (() => { const r = loadJSON(EXPORTS_KEY, []); return Array.isArray(r) ? r : []; })();
  const reviews  = (() => { const r = loadJSON(REVIEWS_KEY, []); return Array.isArray(r) ? r : []; })();
  return { gates, locks, exports: exports_, reviews };
}

// ── Readiness evaluation (8 rules) ────────────────────────────────────────────
function evalReadiness({ gates }) {
  const latestGate = gates[0] ?? null;

  const rule1 = gates.length > 0;
  const rule2 = latestGate?.gateStatus          === 'PLANNING_ALLOWED';
  const rule3 = latestGate?.executionStatus      === 'NOT_EXECUTED';
  const rule4 = latestGate?.dryRunStatus         === 'PLANNING_ONLY';
  const rule5 = latestGate?.liveExecutionStatus  === 'DISABLED';
  const rule6 = latestGate?.tradingStatus        === 'DISABLED';
  const rule7 = latestGate?.credentialStatus     === 'NOT_ACCESSED';
  const rule8 = latestGate?.moneyMovementStatus  === 'DISABLED';

  const ready = rule1 && rule2 && rule3 && rule4 && rule5 && rule6 && rule7 && rule8;

  return {
    latestGate,
    rules: { rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8 },
    ready,
    status: ready ? 'CONTRACT_READY' : 'HOLD',
  };
}

// ── Contract builder ───────────────────────────────────────────────────────────
function buildContract(source, readiness) {
  const { locks, exports: exports_ } = source;
  const { latestGate, status } = readiness;

  const latestLock   = locks[0]   ?? null;
  const latestExport = exports_[0] ?? null;

  return {
    dryRunActionContractId: `dry-run-action-contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt:   new Date().toISOString(),
    contractMode: 'DRY_RUN_ACTION_CONTRACT_DESIGN',
    contractStatus: status,

    executionStatus:         'NOT_EXECUTED',
    dryRunExecutionStatus:   'NOT_STARTED',
    liveExecutionStatus:     'DISABLED',
    tradingStatus:           'DISABLED',
    browserAutomationStatus: 'DISABLED',
    apiCallStatus:           'DISABLED',
    credentialStatus:        'NOT_ACCESSED',
    moneyMovementStatus:     'DISABLED',

    latestPlanningGateId:     latestGate?.dryRunPlanningGateId  ?? null,
    latestPlanningGateStatus: latestGate?.gateStatus             ?? null,
    latestBaselineLockId:     latestLock?.baselineLockId         ?? null,
    latestEvidenceExportId:   latestExport?.exportId             ?? null,

    allowedDryRunActionTypes: ALLOWED_DRY_RUN_ACTION_TYPES,
    prohibitedActionTypes:    PROHIBITED_ACTION_TYPES,
    requiredContractFields:   REQUIRED_CONTRACT_FIELDS,

    contractValidationRules: {
      rule1_atLeastOnePlanningGateExists:                          readiness.rules.rule1,
      rule2_latestGateStatusIsPLANNING_ALLOWED:                    readiness.rules.rule2,
      rule3_latestGateExecutionStatusIsNOT_EXECUTED:               readiness.rules.rule3,
      rule4_latestGateDryRunStatusIsPLANNING_ONLY:                 readiness.rules.rule4,
      rule5_latestGateLiveExecutionStatusIsDISABLED:               readiness.rules.rule5,
      rule6_latestGateTradingStatusIsDISABLED:                     readiness.rules.rule6,
      rule7_latestGateCredentialStatusIsNOT_ACCESSED:              readiness.rules.rule7,
      rule8_latestGateMoneyMovementStatusIsDISABLED:               readiness.rules.rule8,
      allRulesPass: readiness.ready,
      resultingContractStatus: status,
    },

    safetyBoundary: {
      statement: 'This contract ONLY defines the schema and constraints for future dry-run actions. It does NOT authorize any of the following.',
      contractCreatesActions:            false,
      contractSimulatesActions:          false,
      contractExecutesActions:           false,
      dryRunExecutionAuthorized:         false,
      liveExecutionAuthorized:           false,
      tradingAuthorized:                 false,
      browserAutomationAuthorized:       false,
      apiCallsAuthorized:                false,
      credentialAccessAuthorized:        false,
      moneyMovementAuthorized:           false,
      scheduledRunnerAuthorized:         false,
      secretValueExposureAuthorized:     false,
      rawResponseExposureAuthorized:     false,
      nextRequiredStep:
        status === 'CONTRACT_READY'
          ? 'OPERATOR_MAY_USE_THIS_CONTRACT_SCHEMA_TO_DEFINE_FUTURE_DRY_RUN_ACTIONS'
          : 'RESOLVE_ALL_HOLD_CONDITIONS_BEFORE_CONTRACT_DESIGN_IS_ALLOWED',
    },

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
      dryRunActionCreated:          false,
      sourcePlanningGatesModified:  false,
      sourceBaselineLocksModified:  false,
      sourceExportsModified:        false,
      sourceReviewsModified:        false,
      writeTargetKey:               CONTRACTS_KEY,
    },
  };
}

// ── UI sub-components ──────────────────────────────────────────────────────────
function RuleRow({ label, pass, failNote }) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 bg-secondary/20 rounded">
      <CheckCircle2 className={`w-3 h-3 shrink-0 mt-0.5 ${pass ? 'text-primary' : 'text-destructive'}`} />
      <div className="flex-1">
        <span className="text-[8px] text-slate-300">{label}</span>
        {!pass && failNote && <div className="text-[7px] text-destructive/80 mt-0.5">{failNote}</div>}
      </div>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${pass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {pass ? 'PASS' : 'HOLD'}
      </span>
    </div>
  );
}

function ContractRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const ready = record.contractStatus === 'CONTRACT_READY';
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${ready ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
              {record.contractStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/20 bg-primary/5">
              {record.contractMode}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.dryRunActionContractId}</div>
          <div className="text-[7px] text-slate-600">{new Date(record.createdAt).toLocaleString()}</div>
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
export default function OpenClawDryRunActionContractDesigner() {
  const [source, setSource]         = useState(() => loadSourceData());
  const [contracts, setContracts]   = useState(() => loadJSON(CONTRACTS_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]         = useState(false);

  const readiness     = useMemo(() => evalReadiness(source), [source]);
  const latestContract = contracts[0] ?? null;
  const recent5        = contracts.slice(0, 5);

  const handleRefresh = () => {
    setSource(loadSourceData());
    setContracts(loadJSON(CONTRACTS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleGenerate = () => {
    const contract = buildContract(source, readiness);
    const updated  = [contract, ...contracts].slice(0, 20);
    try { localStorage.setItem(CONTRACTS_KEY, JSON.stringify(updated)); } catch {}
    setContracts(updated);
    setLastAction(`Contract generated — ${contract.dryRunActionContractId}`);
  };

  const handleCopy = () => {
    if (!latestContract) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestContract, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest contract JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestContract) return;
    try {
      const blob = new Blob([JSON.stringify(latestContract, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-action-contract-${latestContract.dryRunActionContractId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Contract JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const { rules, status, latestGate } = readiness;
  const isReady = status === 'CONTRACT_READY';
  const latestLock   = source.locks[0]   ?? null;
  const latestExport = source.exports[0] ?? null;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Contract Designer</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Dry-Run Action Contract Designer
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Defines the allowed schema and constraints for future dry-run action contracts.
            Does not create, simulate, or execute actions. Writes only to <span className="font-mono">openclawDryRunActionContracts</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Contract readiness status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${isReady ? 'bg-primary/5 border-primary/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
        {isReady
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isReady ? 'text-primary' : 'text-amber-500'}`}>
            {isReady
              ? 'CONTRACT_READY — All 8 readiness rules satisfied'
              : 'HOLD — One or more readiness rules not satisfied'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.gates.length} planning gate(s) · {source.locks.length} baseline lock(s) · {source.exports.length} evidence export(s) · {source.reviews.length} review(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${isReady ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
          {status}
        </span>
      </div>

      {/* Reference IDs */}
      <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Source Reference IDs</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
          <div>
            <span className="text-slate-500">Latest Planning Gate ID: </span>
            <span className={`font-mono text-[7px] ${latestGate ? 'text-slate-300' : 'text-slate-600'}`}>
              {latestGate?.dryRunPlanningGateId ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Planning Gate Status: </span>
            <span className={`font-bold font-mono ${latestGate?.gateStatus === 'PLANNING_ALLOWED' ? 'text-primary' : 'text-amber-500'}`}>
              {latestGate?.gateStatus ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Latest Baseline Lock ID: </span>
            <span className={`font-mono text-[7px] ${latestLock ? 'text-slate-300' : 'text-slate-600'}`}>
              {latestLock?.baselineLockId ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Latest Evidence Export ID: </span>
            <span className={`font-mono text-[7px] ${latestExport ? 'text-slate-300' : 'text-slate-600'}`}>
              {latestExport?.exportId ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Contract readiness rules */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Contract Readiness Rules</div>
        <div className="space-y-1.5">
          <RuleRow label="Rule 1 — At least one dry-run planning gate exists"
            pass={rules.rule1} failNote="Generate a Dry-Run Execution Planning Gate first." />
          <RuleRow label="Rule 2 — Latest planning gate has gateStatus = PLANNING_ALLOWED"
            pass={rules.rule2} failNote={`Found: ${latestGate?.gateStatus ?? 'none'}`} />
          <RuleRow label="Rule 3 — Latest planning gate has executionStatus = NOT_EXECUTED"
            pass={rules.rule3} failNote={`Found: ${latestGate?.executionStatus ?? 'none'}`} />
          <RuleRow label="Rule 4 — Latest planning gate has dryRunStatus = PLANNING_ONLY"
            pass={rules.rule4} failNote={`Found: ${latestGate?.dryRunStatus ?? 'none'}`} />
          <RuleRow label="Rule 5 — Latest planning gate has liveExecutionStatus = DISABLED"
            pass={rules.rule5} failNote={`Found: ${latestGate?.liveExecutionStatus ?? 'none'}`} />
          <RuleRow label="Rule 6 — Latest planning gate has tradingStatus = DISABLED"
            pass={rules.rule6} failNote={`Found: ${latestGate?.tradingStatus ?? 'none'}`} />
          <RuleRow label="Rule 7 — Latest planning gate has credentialStatus = NOT_ACCESSED"
            pass={rules.rule7} failNote={`Found: ${latestGate?.credentialStatus ?? 'none'}`} />
          <RuleRow label="Rule 8 — Latest planning gate has moneyMovementStatus = DISABLED"
            pass={rules.rule8} failNote={`Found: ${latestGate?.moneyMovementStatus ?? 'none'}`} />
        </div>
      </div>

      {/* Allowed action types */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Allowed Dry-Run Action Types</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {ALLOWED_DRY_RUN_ACTION_TYPES.map(t => (
            <div key={t} className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/20 rounded text-[8px]">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="font-mono text-primary/80">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prohibited action types */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Prohibited Action Types</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {PROHIBITED_ACTION_TYPES.map(t => (
            <div key={t} className="flex items-center gap-1.5 px-2 py-1 bg-destructive/5 border border-destructive/20 rounded text-[8px]">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span className="font-mono text-destructive/70">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required contract fields */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Required Contract Fields (for future dry-run actions)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {REQUIRED_CONTRACT_FIELDS.map(f => (
            <div key={f} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/30 rounded text-[8px]">
              <CheckCircle2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-300">{f}</span>
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
          <FileText className="w-3.5 h-3.5" />
          Generate Dry-Run Action Contract
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestContract}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Contract JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestContract}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Contract JSON
        </button>
      </div>

      {/* Latest contract preview */}
      {latestContract && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Contract Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestContract.createdAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Contract Mode',    v: latestContract.contractMode,            mono: true },
              { k: 'Contract Status',  v: latestContract.contractStatus,          mono: true },
              { k: 'Exec Status',      v: latestContract.executionStatus,         mono: true },
              { k: 'Dry-Run Exec',     v: latestContract.dryRunExecutionStatus,   mono: true },
              { k: 'Live Execution',   v: latestContract.liveExecutionStatus,     mono: true },
              { k: 'Trading',          v: latestContract.tradingStatus,           mono: true },
              { k: 'Browser Auto',     v: latestContract.browserAutomationStatus, mono: true },
              { k: 'API Calls',        v: latestContract.apiCallStatus,           mono: true },
              { k: 'Credentials',      v: latestContract.credentialStatus,        mono: true },
              { k: 'Money Movement',   v: latestContract.moneyMovementStatus,     mono: true },
              { k: 'Allowed Types',    v: latestContract.allowedDryRunActionTypes?.length ?? 0 },
              { k: 'Prohibited Types', v: latestContract.prohibitedActionTypes?.length ?? 0 },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          {/* safetyBoundary strip */}
          <div className="px-4 pb-4">
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Safety Boundary</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {Object.entries(latestContract.safetyBoundary)
                .filter(([, v]) => typeof v === 'boolean')
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-[7px]">
                    <CheckCircle2 className={`w-2.5 h-2.5 shrink-0 ${!v ? 'text-primary' : 'text-destructive'}`} />
                    <span className="font-mono text-slate-400">{k}: {String(v)}</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-[7px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
              nextRequiredStep: {latestContract.safetyBoundary.nextRequiredStep}
            </div>
          </div>
        </div>
      )}

      {/* Last 5 contract records */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Contracts ({recent5.length} of {contracts.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <ContractRecord key={rec.dryRunActionContractId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Contract Designer Safety Guarantee</div>
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
            'Source records never modified',
            'No external event listeners',
            'Writes only to openclawDryRunActionContracts',
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
        <FileText className="w-3 h-3 shrink-0" />
        contractMode = DRY_RUN_ACTION_CONTRACT_DESIGN · executionStatus = NOT_EXECUTED · dryRunExecutionStatus = NOT_STARTED · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}