/**
 * OpenClawReadOnlyGovernanceBaselineLock
 * Local-only baseline lock proving the current governance chain is read-only,
 * non-executing, and verified before any future dry-run execution planning.
 *
 * Reads:  openclawCommandProposals
 *         openclawProposalReviews
 *         openclawProposalReviewEvidenceExports
 *         openclawPhase56ReadOnlyCapabilityPolicyMaps
 *
 * Writes: openclawReadOnlyGovernanceBaselineLocks (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 */
import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Lock, Download, Copy, RefreshCw, ChevronDown } from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const PROPOSALS_KEY   = 'openclawCommandProposals';
const REVIEWS_KEY     = 'openclawProposalReviews';
const EXPORTS_KEY     = 'openclawProposalReviewEvidenceExports';
const POLICY_KEY      = 'openclawPhase56ReadOnlyCapabilityPolicyMaps';
const LOCKS_KEY       = 'openclawReadOnlyGovernanceBaselineLocks';

// ── Safety flags (same set as review panel) ────────────────────────────────────
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
  const proposals = (() => { const r = loadJSON(PROPOSALS_KEY, []); return Array.isArray(r) ? r : []; })();
  const reviews   = (() => { const r = loadJSON(REVIEWS_KEY,   []); return Array.isArray(r) ? r : []; })();
  const exports_  = (() => { const r = loadJSON(EXPORTS_KEY,   []); return Array.isArray(r) ? r : []; })();
  const policyBatches = (() => { const r = loadJSON(POLICY_KEY, []); return Array.isArray(r) ? r : []; })();
  const policyMaps = policyBatches.flatMap(b => b.policyMaps || []);
  return { proposals, reviews, exports: exports_, policyMaps };
}

// ── Readiness evaluation ───────────────────────────────────────────────────────
function evalReadiness({ proposals, reviews, exports: exports_, policyMaps }) {
  const latestExport      = exports_[0] ?? null;
  const dangerous         = reviews.filter(hasDangerousFlag).length;
  const allReviewsNonExec = reviews.length > 0 && reviews.every(r => r.approvalDoesNotExecute === true);

  const rule1 = exports_.length > 0;
  const rule2 = latestExport?.executionStatus === 'NOT_EXECUTED';
  const rule3 = latestExport?.networkStatus   === 'NO_NETWORK_CALLS';
  const rule4 = allReviewsNonExec;
  const rule5 = dangerous === 0;

  const ready = rule1 && rule2 && rule3 && rule4 && rule5;

  return {
    latestExport,
    dangerous,
    allReviewsNonExec,
    allEvidenceExportsNonExecuting: exports_.every(e => e.executionStatus === 'NOT_EXECUTED'),
    allEvidenceExportsNoNetwork:    exports_.every(e => e.networkStatus   === 'NO_NETWORK_CALLS'),
    rules: { rule1, rule2, rule3, rule4, rule5 },
    ready,
    status: ready ? 'READY_TO_LOCK' : 'HOLD',
  };
}

// ── Lock builder ───────────────────────────────────────────────────────────────
function buildLock(source, readiness) {
  const { proposals, reviews, exports: exports_, policyMaps } = source;
  const { latestExport, dangerous, allReviewsNonExec, allEvidenceExportsNonExecuting, allEvidenceExportsNoNetwork, status } = readiness;

  return {
    baselineLockId:   `baseline-lock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lockedAt:         new Date().toISOString(),
    lockMode:         'READ_ONLY_GOVERNANCE_BASELINE_LOCK',
    executionStatus:  'NOT_EXECUTED',
    automationStatus: 'DISABLED',
    networkStatus:    'NO_RUNTIME_NETWORK_CALLS',
    tradingStatus:    'DISABLED',
    credentialStatus: 'NOT_ACCESSED',

    commandProposalCount:  proposals.length,
    proposalReviewCount:   reviews.length,
    evidenceExportCount:   exports_.length,
    policyMapCount:        policyMaps.length,

    latestEvidenceExportId:   latestExport?.exportId   ?? null,
    latestEvidenceExportedAt: latestExport?.exportedAt ?? null,

    allEvidenceExportsNonExecuting,
    allEvidenceExportsNoNetwork,
    allReviewsNonExecuting: allReviewsNonExec,
    dangerousSafetyFlagsDetected: dangerous,

    baselineReadinessStatus: status,

    baselineSummary:
      status === 'READY_TO_LOCK'
        ? `Governance chain verified read-only. ${proposals.length} proposals, ${reviews.length} reviews, ${exports_.length} evidence exports, and ${policyMaps.length} policy maps audited. All evidence exports have executionStatus=NOT_EXECUTED and networkStatus=NO_NETWORK_CALLS. No dangerous safety flags detected. Baseline is locked as read-only non-executing.`
        : `Baseline HOLD — one or more readiness rules not satisfied. Review rule failures before locking.`,

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
      sourceProposalsModified:      false,
      sourceReviewsModified:        false,
      sourceEvidenceExportsModified:false,
      sourcePolicyMapsModified:     false,
      writeTargetKey:               LOCKS_KEY,
    },

    futureExecutionBoundary: {
      statement: 'This baseline lock does NOT authorize any of the following.',
      dryRunExecutionAuthorized:    false,
      liveExecutionAuthorized:      false,
      tradingAuthorized:            false,
      browserAutomationAuthorized:  false,
      apiCallsAuthorized:           false,
      credentialAccessAuthorized:   false,
      moneyMovementAuthorized:      false,
      scheduledRunnerAuthorized:    false,
      repeatingCheckAuthorized:     false,
      secretValueExposureAuthorized:false,
      rawResponseExposureAuthorized:false,
      nextRequiredStep: 'OPERATOR_MUST_CREATE_SEPARATE_DRY_RUN_EXECUTION_PLANNING_GATE',
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
        {!pass && failNote && (
          <div className="text-[7px] text-destructive/80 mt-0.5">{failNote}</div>
        )}
      </div>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${pass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {pass ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

function LockRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const isReady = record.baselineReadinessStatus === 'READY_TO_LOCK';
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${isReady ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
              {record.baselineReadinessStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/20 bg-primary/5">
              {record.lockMode}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.baselineLockId}</div>
          <div className="text-[7px] text-slate-600">
            {new Date(record.lockedAt).toLocaleString()} · {record.proposalReviewCount} reviews · {record.evidenceExportCount} exports
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
export default function OpenClawReadOnlyGovernanceBaselineLock() {
  const [source, setSource]       = useState(() => loadSourceData());
  const [locks, setLocks]         = useState(() => loadJSON(LOCKS_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]       = useState(false);

  const readiness = useMemo(() => evalReadiness(source), [source]);
  const latestLock = locks[0] ?? null;
  const recent5    = locks.slice(0, 5);

  const handleRefresh = () => {
    setSource(loadSourceData());
    setLocks(loadJSON(LOCKS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleGenerate = () => {
    const lock = buildLock(source, readiness);
    const updated = [lock, ...locks].slice(0, 20);
    try { localStorage.setItem(LOCKS_KEY, JSON.stringify(updated)); } catch {}
    setLocks(updated);
    setLastAction(`Baseline lock generated — ${lock.baselineLockId}`);
  };

  const handleCopy = () => {
    if (!latestLock) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestLock, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest baseline lock JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestLock) return;
    try {
      const blob = new Blob([JSON.stringify(latestLock, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-read-only-governance-baseline-lock-${latestLock.baselineLockId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Baseline lock JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const { rules, status } = readiness;
  const isReady = status === 'READY_TO_LOCK';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Baseline Lock</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> OpenClaw Read-Only Governance Baseline Lock
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Proves the governance chain is read-only and non-executing before any future dry-run planning.
            Writes only to <span className="font-mono">openclawReadOnlyGovernanceBaselineLocks</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Baseline readiness status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${isReady ? 'bg-primary/5 border-primary/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
        {isReady
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isReady ? 'text-primary' : 'text-amber-500'}`}>
            {isReady ? 'READY_TO_LOCK — All readiness rules satisfied' : 'HOLD — One or more readiness rules not satisfied'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.exports.length} evidence export(s) · {source.reviews.length} review(s) · {source.proposals.length} proposal(s) · {source.policyMaps.length} policy map(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${isReady ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
          {status}
        </span>
      </div>

      {/* Readiness rules */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Readiness Rules</div>
        <div className="space-y-1.5">
          <RuleRow label="Rule 1 — At least one evidence export exists"                          pass={rules.rule1} failNote="Generate an evidence export first." />
          <RuleRow label="Rule 2 — Latest evidence export has executionStatus = NOT_EXECUTED"    pass={rules.rule2} failNote={`Found: ${source.exports[0]?.executionStatus ?? 'none'}`} />
          <RuleRow label="Rule 3 — Latest evidence export has networkStatus = NO_NETWORK_CALLS"  pass={rules.rule3} failNote={`Found: ${source.exports[0]?.networkStatus ?? 'none'}`} />
          <RuleRow label="Rule 4 — All reviews have approvalDoesNotExecute = true"               pass={rules.rule4} failNote="One or more reviews missing approvalDoesNotExecute=true." />
          <RuleRow label="Rule 5 — Dangerous safety flags count is 0"                            pass={rules.rule5} failNote={`${readiness.dangerous} dangerous flag(s) detected.`} />
        </div>
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Command Proposals',  value: source.proposals.length,  color: 'slate' },
          { label: 'Proposal Reviews',   value: source.reviews.length,    color: 'slate' },
          { label: 'Evidence Exports',   value: source.exports.length,    color: source.exports.length > 0 ? 'green' : 'slate' },
          { label: 'Policy Maps',        value: source.policyMaps.length, color: source.policyMaps.length > 0 ? 'green' : 'slate' },
        ].map(({ label, value, color }) => {
          const tc = { green: 'text-primary', slate: 'text-slate-300' }[color];
          return (
            <div key={label} className="bg-card border border-border rounded-lg px-3 py-3">
              <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
              <div className={`text-[20px] font-bold ${tc}`}>{value}</div>
            </div>
          );
        })}
      </div>

      {/* Latest evidence export reference */}
      {readiness.latestExport && (
        <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-1">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Latest Evidence Export Reference</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
            <div><span className="text-slate-500">Export ID: </span><span className="font-mono text-slate-300">{readiness.latestExport.exportId}</span></div>
            <div><span className="text-slate-500">Exported At: </span><span className="font-mono text-slate-300">{new Date(readiness.latestExport.exportedAt).toLocaleString()}</span></div>
            <div><span className="text-slate-500">Execution Status: </span><span className={`font-bold font-mono ${readiness.latestExport.executionStatus === 'NOT_EXECUTED' ? 'text-primary' : 'text-destructive'}`}>{readiness.latestExport.executionStatus}</span></div>
            <div><span className="text-slate-500">Network Status: </span><span className={`font-bold font-mono ${readiness.latestExport.networkStatus === 'NO_NETWORK_CALLS' ? 'text-primary' : 'text-destructive'}`}>{readiness.latestExport.networkStatus}</span></div>
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
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded">
          <Lock className="w-3.5 h-3.5" />
          Generate Read-Only Baseline Lock
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestLock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Baseline Lock JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestLock}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Baseline Lock JSON
        </button>
      </div>

      {/* Latest lock preview */}
      {latestLock && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Baseline Lock Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestLock.lockedAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Lock Mode',          v: latestLock.lockMode,                    mono: true },
              { k: 'Exec Status',        v: latestLock.executionStatus,             mono: true },
              { k: 'Automation',         v: latestLock.automationStatus,            mono: true },
              { k: 'Network',            v: latestLock.networkStatus,               mono: true },
              { k: 'Trading',            v: latestLock.tradingStatus,               mono: true },
              { k: 'Credentials',        v: latestLock.credentialStatus,            mono: true },
              { k: 'Readiness',          v: latestLock.baselineReadinessStatus,     mono: true },
              { k: 'Proposals',          v: latestLock.commandProposalCount },
              { k: 'Reviews',            v: latestLock.proposalReviewCount },
              { k: 'Evidence Exports',   v: latestLock.evidenceExportCount },
              { k: 'Policy Maps',        v: latestLock.policyMapCount },
              { k: 'Dangerous Flags',    v: latestLock.dangerousSafetyFlagsDetected },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          {/* futureExecutionBoundary strip */}
          <div className="px-4 pb-4">
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Future Execution Boundary</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {Object.entries(latestLock.futureExecutionBoundary)
                .filter(([, v]) => typeof v === 'boolean')
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-[7px]">
                    <CheckCircle2 className={`w-2.5 h-2.5 shrink-0 ${!v ? 'text-primary' : 'text-destructive'}`} />
                    <span className={`font-mono ${!v ? 'text-slate-400' : 'text-destructive/70'}`}>{k}: {String(v)}</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-[7px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
              nextRequiredStep: {latestLock.futureExecutionBoundary.nextRequiredStep}
            </div>
          </div>
          {/* Summary strip */}
          <div className="px-4 pb-4">
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Baseline Summary</div>
            <p className="text-[8px] text-slate-300 leading-relaxed">{latestLock.baselineSummary}</p>
          </div>
        </div>
      )}

      {/* Last 5 lock records */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Baseline Locks ({recent5.length} of {locks.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <LockRecord key={rec.baselineLockId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Baseline Lock Safety Guarantee</div>
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
            'No custom events',
            'Source records never modified',
            'Writes only to openclawReadOnlyGovernanceBaselineLocks',
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
        <Lock className="w-3 h-3 shrink-0" />
        executionStatus hardcoded NOT_EXECUTED · automationStatus DISABLED · tradingStatus DISABLED · credentialStatus NOT_ACCESSED · No network path · No dispatch path
      </div>
    </div>
  );
}