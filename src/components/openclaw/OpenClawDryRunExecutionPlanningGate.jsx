/**
 * OpenClawDryRunExecutionPlanningGate
 * Local-only planning gate that authorizes Veridan Core to begin designing
 * dry-run execution logic ONLY AFTER the read-only governance baseline is locked.
 *
 * Reads:  openclawReadOnlyGovernanceBaselineLocks
 *         openclawProposalReviewEvidenceExports
 *         openclawProposalReviews
 *
 * Writes: openclawDryRunExecutionPlanningGates (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This gate does NOT create dry-run execution — it only authorizes future design/planning.
 */
import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, GitBranch, Download, Copy, RefreshCw, ChevronDown } from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const LOCKS_KEY   = 'openclawReadOnlyGovernanceBaselineLocks';
const EXPORTS_KEY = 'openclawProposalReviewEvidenceExports';
const REVIEWS_KEY = 'openclawProposalReviews';
const GATES_KEY   = 'openclawDryRunExecutionPlanningGates';

// ── Safety flags ───────────────────────────────────────────────────────────────
const SAFETY_FLAGS = [
  'openClawCalled','backendCalled','apiCalled','dispatchPerformed',
  'executionPerformed','tradingPerformed','moneyMovementPerformed',
  'browserAutomationPerformed','schedulerPerformed','pollingPerformed',
  'secretValueAccessed','rawResponseBodyAccessed',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function hasDangerousFlag(review) {
  return SAFETY_FLAGS.some(f => review[f] === true);
}

function loadSourceData() {
  const locks   = (() => { const r = loadJSON(LOCKS_KEY,   []); return Array.isArray(r) ? r : []; })();
  const exports_ = (() => { const r = loadJSON(EXPORTS_KEY, []); return Array.isArray(r) ? r : []; })();
  const reviews  = (() => { const r = loadJSON(REVIEWS_KEY, []); return Array.isArray(r) ? r : []; })();
  return { locks, exports: exports_, reviews };
}

// ── Readiness evaluation ───────────────────────────────────────────────────────
function evalReadiness({ locks, reviews }) {
  const latestLock = locks[0] ?? null;
  const dangerous  = reviews.filter(hasDangerousFlag).length;

  const rule1 = locks.length > 0;
  const rule2 = latestLock?.baselineReadinessStatus === 'READY_TO_LOCK';
  const rule3 = latestLock?.executionStatus          === 'NOT_EXECUTED';
  const rule4 = latestLock?.automationStatus         === 'DISABLED';
  const rule5 = latestLock?.tradingStatus            === 'DISABLED';
  const rule6 = latestLock?.credentialStatus         === 'NOT_ACCESSED';
  const rule7 = dangerous === 0;

  const ready = rule1 && rule2 && rule3 && rule4 && rule5 && rule6 && rule7;

  return {
    latestLock,
    dangerous,
    rules: { rule1, rule2, rule3, rule4, rule5, rule6, rule7 },
    ready,
    status: ready ? 'PLANNING_ALLOWED' : 'HOLD',
  };
}

// ── Gate builder ───────────────────────────────────────────────────────────────
function buildGate(source, readiness) {
  const { locks, exports: exports_, reviews } = source;
  const { latestLock, dangerous, status } = readiness;

  const approved     = reviews.filter(r => r.reviewStatus === 'APPROVED_READ_ONLY').length;
  const denied       = reviews.filter(r => r.reviewStatus === 'DENIED').length;
  const needsChanges = reviews.filter(r => r.reviewStatus === 'NEEDS_CHANGES').length;
  const latestExport = exports_[0] ?? null;

  return {
    dryRunPlanningGateId: `dry-run-planning-gate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt:            new Date().toISOString(),
    gateMode:             'DRY_RUN_EXECUTION_PLANNING_GATE',
    gateStatus:           status,

    executionStatus:        'NOT_EXECUTED',
    dryRunStatus:           'PLANNING_ONLY',
    liveExecutionStatus:    'DISABLED',
    tradingStatus:          'DISABLED',
    browserAutomationStatus:'DISABLED',
    apiCallStatus:          'DISABLED',
    credentialStatus:       'NOT_ACCESSED',
    moneyMovementStatus:    'DISABLED',

    latestBaselineLockId:     latestLock?.baselineLockId   ?? null,
    latestBaselineLockStatus: latestLock?.baselineReadinessStatus ?? null,
    latestEvidenceExportId:   latestExport?.exportId       ?? null,

    reviewCount:              reviews.length,
    approvedReviewCount:      approved,
    deniedReviewCount:        denied,
    needsChangesReviewCount:  needsChanges,
    dangerousSafetyFlagsDetected: dangerous,

    planningReadinessRules: {
      rule1_atLeastOneBaselineLockExists:                  readiness.rules.rule1,
      rule2_latestLockBaselineReadinessIsREADY_TO_LOCK:    readiness.rules.rule2,
      rule3_latestLockExecutionStatusIsNOT_EXECUTED:       readiness.rules.rule3,
      rule4_latestLockAutomationStatusIsDISABLED:          readiness.rules.rule4,
      rule5_latestLockTradingStatusIsDISABLED:             readiness.rules.rule5,
      rule6_latestLockCredentialStatusIsNOT_ACCESSED:      readiness.rules.rule6,
      rule7_dangerousSafetyFlagsDetectedIsZero:            readiness.rules.rule7,
      allRulesPass: readiness.ready,
      resultingGateStatus: status,
    },

    planningBoundary: {
      statement: 'This gate authorizes PLANNING and DESIGN of future dry-run execution logic only. It does NOT authorize any of the following.',
      dryRunExecutionAuthorized:       false,
      liveExecutionAuthorized:         false,
      tradingAuthorized:               false,
      browserAutomationAuthorized:     false,
      apiCallsAuthorized:              false,
      credentialAccessAuthorized:      false,
      moneyMovementAuthorized:         false,
      scheduledRunnerAuthorized:       false,
      repeatingCheckAuthorized:        false,
      secretValueExposureAuthorized:   false,
      rawResponseExposureAuthorized:   false,
      planningAndDesignAuthorized:     status === 'PLANNING_ALLOWED',
      nextRequiredStep:
        status === 'PLANNING_ALLOWED'
          ? 'OPERATOR_MAY_BEGIN_DESIGNING_DRY_RUN_EXECUTION_LOGIC'
          : 'RESOLVE_ALL_HOLD_CONDITIONS_BEFORE_PLANNING_IS_ALLOWED',
    },

    nonExecutionProof: {
      fetchCalled:                     false,
      axiosCalled:                     false,
      base44SdkCalled:                 false,
      openClawCalled:                  false,
      apiCalled:                       false,
      browserAutomationPerformed:      false,
      tradingPerformed:                false,
      credentialHandled:               false,
      processEnvAccessed:              false,
      denoEnvAccessed:                 false,
      networkCallsMade:                false,
      executionDispatched:             false,
      customEventsFired:               false,
      dryRunExecutionPerformed:        false,
      sourceLocksModified:             false,
      sourceExportsModified:           false,
      sourceReviewsModified:           false,
      writeTargetKey:                  GATES_KEY,
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

function GateRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const allowed = record.gateStatus === 'PLANNING_ALLOWED';
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${allowed ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
              {record.gateStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/20 bg-primary/5">
              {record.gateMode}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.dryRunPlanningGateId}</div>
          <div className="text-[7px] text-slate-600">
            {new Date(record.createdAt).toLocaleString()} · {record.reviewCount} reviews · {record.dangerousSafetyFlagsDetected} dangerous flags
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
export default function OpenClawDryRunExecutionPlanningGate() {
  const [source, setSource]       = useState(() => loadSourceData());
  const [gates, setGates]         = useState(() => loadJSON(GATES_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]       = useState(false);

  const readiness  = useMemo(() => evalReadiness(source), [source]);
  const latestGate = gates[0] ?? null;
  const recent5    = gates.slice(0, 5);

  const handleRefresh = () => {
    setSource(loadSourceData());
    setGates(loadJSON(GATES_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleGenerate = () => {
    const gate    = buildGate(source, readiness);
    const updated = [gate, ...gates].slice(0, 20);
    try { localStorage.setItem(GATES_KEY, JSON.stringify(updated)); } catch {}
    setGates(updated);
    setLastAction(`Planning gate generated — ${gate.dryRunPlanningGateId}`);
  };

  const handleCopy = () => {
    if (!latestGate) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestGate, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest planning gate JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestGate) return;
    try {
      const blob = new Blob([JSON.stringify(latestGate, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-planning-gate-${latestGate.dryRunPlanningGateId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Planning gate JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const { rules, status, latestLock, dangerous } = readiness;
  const isAllowed = status === 'PLANNING_ALLOWED';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Planning Gate</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" /> Controlled Dry-Run Execution Planning Gate
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Authorizes future dry-run planning ONLY after governance baseline is locked.
            Does not create dry-run execution. Writes only to <span className="font-mono">openclawDryRunExecutionPlanningGates</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Gate status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${isAllowed ? 'bg-primary/5 border-primary/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
        {isAllowed
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isAllowed ? 'text-primary' : 'text-amber-500'}`}>
            {isAllowed
              ? 'PLANNING_ALLOWED — All readiness rules satisfied'
              : 'HOLD — One or more readiness rules not satisfied'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.locks.length} baseline lock(s) · {source.exports.length} evidence export(s) · {source.reviews.length} review(s) · {dangerous} dangerous flag(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${isAllowed ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
          {status}
        </span>
      </div>

      {/* Latest baseline lock reference */}
      {latestLock && (
        <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-1.5">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Latest Baseline Lock Reference</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
            <div><span className="text-slate-500">Lock ID: </span><span className="font-mono text-slate-300 text-[7px]">{latestLock.baselineLockId}</span></div>
            <div><span className="text-slate-500">Locked At: </span><span className="font-mono text-slate-300">{new Date(latestLock.lockedAt).toLocaleString()}</span></div>
            <div><span className="text-slate-500">Baseline Readiness: </span>
              <span className={`font-bold font-mono ${latestLock.baselineReadinessStatus === 'READY_TO_LOCK' ? 'text-primary' : 'text-destructive'}`}>
                {latestLock.baselineReadinessStatus}
              </span>
            </div>
            <div><span className="text-slate-500">Execution Status: </span>
              <span className={`font-bold font-mono ${latestLock.executionStatus === 'NOT_EXECUTED' ? 'text-primary' : 'text-destructive'}`}>
                {latestLock.executionStatus}
              </span>
            </div>
            <div><span className="text-slate-500">Automation: </span><span className="font-mono text-slate-300">{latestLock.automationStatus}</span></div>
            <div><span className="text-slate-500">Trading: </span><span className="font-mono text-slate-300">{latestLock.tradingStatus}</span></div>
          </div>
        </div>
      )}

      {/* Review + Export counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Baseline Locks',   value: source.locks.length,   color: source.locks.length > 0 ? 'green' : 'slate' },
          { label: 'Evidence Exports', value: source.exports.length, color: source.exports.length > 0 ? 'green' : 'slate' },
          { label: 'Reviews',          value: source.reviews.length, color: 'slate' },
          { label: 'Dangerous Flags',  value: dangerous,             color: dangerous === 0 ? 'green' : 'red' },
        ].map(({ label, value, color }) => {
          const tc = { green: 'text-primary', red: 'text-destructive', slate: 'text-slate-300' }[color];
          return (
            <div key={label} className="bg-card border border-border rounded-lg px-3 py-3">
              <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
              <div className={`text-[20px] font-bold ${tc}`}>{value}</div>
            </div>
          );
        })}
      </div>

      {/* Readiness rules */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Planning Readiness Rules</div>
        <div className="space-y-1.5">
          <RuleRow label="Rule 1 — At least one baseline lock exists"
            pass={rules.rule1} failNote="Generate a Read-Only Governance Baseline Lock first." />
          <RuleRow label="Rule 2 — Latest baseline lock has baselineReadinessStatus = READY_TO_LOCK"
            pass={rules.rule2} failNote={`Found: ${latestLock?.baselineReadinessStatus ?? 'none'}`} />
          <RuleRow label="Rule 3 — Latest baseline lock has executionStatus = NOT_EXECUTED"
            pass={rules.rule3} failNote={`Found: ${latestLock?.executionStatus ?? 'none'}`} />
          <RuleRow label="Rule 4 — Latest baseline lock has automationStatus = DISABLED"
            pass={rules.rule4} failNote={`Found: ${latestLock?.automationStatus ?? 'none'}`} />
          <RuleRow label="Rule 5 — Latest baseline lock has tradingStatus = DISABLED"
            pass={rules.rule5} failNote={`Found: ${latestLock?.tradingStatus ?? 'none'}`} />
          <RuleRow label="Rule 6 — Latest baseline lock has credentialStatus = NOT_ACCESSED"
            pass={rules.rule6} failNote={`Found: ${latestLock?.credentialStatus ?? 'none'}`} />
          <RuleRow label="Rule 7 — dangerousSafetyFlagsDetected = 0"
            pass={rules.rule7} failNote={`${dangerous} dangerous flag(s) detected in reviews.`} />
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
          <GitBranch className="w-3.5 h-3.5" />
          Generate Dry-Run Planning Gate
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestGate}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Planning Gate JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestGate}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Planning Gate JSON
        </button>
      </div>

      {/* Latest gate preview */}
      {latestGate && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Planning Gate Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestGate.createdAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Gate Mode',          v: latestGate.gateMode,                mono: true },
              { k: 'Gate Status',        v: latestGate.gateStatus,              mono: true },
              { k: 'Exec Status',        v: latestGate.executionStatus,         mono: true },
              { k: 'Dry-Run Status',     v: latestGate.dryRunStatus,            mono: true },
              { k: 'Live Execution',     v: latestGate.liveExecutionStatus,     mono: true },
              { k: 'Trading',            v: latestGate.tradingStatus,           mono: true },
              { k: 'Browser Auto',       v: latestGate.browserAutomationStatus, mono: true },
              { k: 'API Calls',          v: latestGate.apiCallStatus,           mono: true },
              { k: 'Credentials',        v: latestGate.credentialStatus,        mono: true },
              { k: 'Money Movement',     v: latestGate.moneyMovementStatus,     mono: true },
              { k: 'Reviews',            v: latestGate.reviewCount },
              { k: 'Dangerous Flags',    v: latestGate.dangerousSafetyFlagsDetected },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          {/* planningBoundary strip */}
          <div className="px-4 pb-4">
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Planning Boundary</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {Object.entries(latestGate.planningBoundary)
                .filter(([, v]) => typeof v === 'boolean')
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-[7px]">
                    <CheckCircle2 className={`w-2.5 h-2.5 shrink-0 ${k === 'planningAndDesignAuthorized' ? (v ? 'text-primary' : 'text-destructive') : (!v ? 'text-primary' : 'text-destructive')}`} />
                    <span className="font-mono text-slate-400">{k}: {String(v)}</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-[7px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
              nextRequiredStep: {latestGate.planningBoundary.nextRequiredStep}
            </div>
          </div>
        </div>
      )}

      {/* Last 5 gate records */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Planning Gates ({recent5.length} of {gates.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <GateRecord key={rec.dryRunPlanningGateId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Planning Gate Safety Guarantee</div>
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
            'No dry-run execution created',
            'No CustomEvent or dispatchEvent',
            'Source records never modified',
            'No external event listeners',
            'Writes only to openclawDryRunExecutionPlanningGates',
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
        <GitBranch className="w-3 h-3 shrink-0" />
        gateMode = DRY_RUN_EXECUTION_PLANNING_GATE · executionStatus = NOT_EXECUTED · dryRunStatus = PLANNING_ONLY · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}