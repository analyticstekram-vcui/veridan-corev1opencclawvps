/**
 * OpenClawProposalReviewEvidenceExport
 * Local-only export package combining proposal, review, policy, and safety summary evidence.
 * Reads: openclawCommandProposals, openclawProposalReviews, openclawPhase56ReadOnlyCapabilityPolicyMaps
 * Writes: openclawProposalReviewEvidenceExports
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 */
import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Download, Copy, RefreshCw, ChevronDown } from 'lucide-react';

// ── Storage keys ──────────────────────────────────────────────────────────────
const PROPOSALS_KEY   = 'openclawCommandProposals';
const REVIEWS_KEY     = 'openclawProposalReviews';
const POLICY_KEY      = 'openclawPhase56ReadOnlyCapabilityPolicyMaps';
const EXPORTS_KEY     = 'openclawProposalReviewEvidenceExports';

// ── Safety flag names (same set used by review panel) ─────────────────────────
const SAFETY_FLAGS = [
  'openClawCalled','backendCalled','apiCalled','dispatchPerformed',
  'executionPerformed','tradingPerformed','moneyMovementPerformed',
  'browserAutomationPerformed','schedulerPerformed','pollingPerformed',
  'secretValueAccessed','rawResponseBodyAccessed',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  const proposals   = (() => { const r = loadJSON(PROPOSALS_KEY, []); return Array.isArray(r) ? r : []; })();
  const reviews     = (() => { const r = loadJSON(REVIEWS_KEY,   []); return Array.isArray(r) ? r : []; })();
  const policyBatches = (() => { const r = loadJSON(POLICY_KEY,  []); return Array.isArray(r) ? r : []; })();
  const policyMaps  = policyBatches.flatMap(b => b.policyMaps || []);
  return { proposals, reviews, policyMaps };
}

function buildExport({ proposals, reviews, policyMaps }) {
  const approved     = reviews.filter(r => r.reviewStatus === 'APPROVED_READ_ONLY');
  const denied       = reviews.filter(r => r.reviewStatus === 'DENIED');
  const needsChanges = reviews.filter(r => r.reviewStatus === 'NEEDS_CHANGES');
  const dangerous    = reviews.filter(hasDangerousFlag);

  const allApprovalsNonExecuting =
    approved.length > 0 &&
    approved.every(r => r.approvalDoesNotExecute === true && r.executionStatus === 'NOT_EXECUTED');

  const allSafetyFlagsFalse = reviews.length > 0 && dangerous.length === 0;

  const exportId = `evidence-export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    exportId,
    exportedAt: new Date().toISOString(),
    exportMode: 'LOCAL_ONLY_EVIDENCE_EXPORT',
    executionStatus: 'NOT_EXECUTED',
    networkStatus: 'NO_NETWORK_CALLS',
    proposalsIncluded: proposals.length,
    reviewsIncluded: reviews.length,
    policyMapsIncluded: policyMaps.length,
    approvedReviews: approved.length,
    deniedReviews: denied.length,
    needsChangesReviews: needsChanges.length,
    dangerousSafetyFlags: dangerous.length,
    allApprovalsNonExecuting,
    allSafetyFlagsFalse,
    proposalRecords: proposals,
    reviewRecords: reviews,
    policyMapRecords: policyMaps,
    safetySummary: {
      fetchCalled: false,
      axiosCalled: false,
      base44SdkCalled: false,
      openClawCalled: false,
      apiCalled: false,
      browserAutomationPerformed: false,
      tradingPerformed: false,
      credentialHandled: false,
      processEnvAccessed: false,
      denoEnvAccessed: false,
      networkCallsMade: false,
      executionDispatched: false,
      customEventsFired: false,
      sourceRecordsModified: false,
    },
    nonExecutionProof: {
      allExportedApprovalsHaveApprovalDoesNotExecute: allApprovalsNonExecuting,
      allExportedApprovalsHaveExecutionStatusNotExecuted: approved.every(r => r.executionStatus === 'NOT_EXECUTED'),
      exportModeIsLocalOnly: true,
      noNetworkPathPresent: true,
      noDispatchPathPresent: true,
      dangerousSafetyFlagsCount: dangerous.length,
      dangerousFlagIds: dangerous.map(r => r.reviewId),
    },
  };
}

// ── UI sub-components ─────────────────────────────────────────────────────────
function CountRow({ label, value, color = 'slate' }) {
  const c = { green: 'text-primary', red: 'text-destructive', amber: 'text-amber-500', slate: 'text-slate-300' }[color] || 'text-slate-300';
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 rounded">
      <span className="text-[8px] text-slate-400">{label}</span>
      <span className={`text-[12px] font-bold ${c}`}>{value}</span>
    </div>
  );
}

function BoolRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 rounded">
      <span className="text-[8px] text-slate-400">{label}</span>
      <span className={`text-[8px] font-bold ${value ? 'text-primary' : 'text-destructive'}`}>
        {value ? 'TRUE' : 'FALSE'}
      </span>
    </div>
  );
}

function ExportRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">
              {record.exportMode}
            </span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${record.dangerousSafetyFlags === 0 ? 'text-primary border-primary/20 bg-primary/5' : 'text-destructive border-destructive/20 bg-destructive/5'}`}>
              {record.dangerousSafetyFlags === 0 ? 'SAFE' : `⚠ ${record.dangerousSafetyFlags} DANGEROUS`}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.exportId}</div>
          <div className="text-[7px] text-slate-600">{new Date(record.exportedAt).toLocaleString()} · {record.reviewsIncluded} reviews · {record.proposalsIncluded} proposals</div>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function OpenClawProposalReviewEvidenceExport() {
  const [exports, setExports]     = useState(() => loadJSON(EXPORTS_KEY, []));
  const [sourceData, setSourceData] = useState(() => loadSourceData());
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]       = useState(false);

  // Refresh source data from localStorage (no writes)
  const handleRefresh = () => {
    setSourceData(loadSourceData());
    setExports(loadJSON(EXPORTS_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  // Derived readiness summary from current source data
  const readiness = useMemo(() => {
    const { proposals, reviews, policyMaps } = sourceData;
    const approved     = reviews.filter(r => r.reviewStatus === 'APPROVED_READ_ONLY').length;
    const denied       = reviews.filter(r => r.reviewStatus === 'DENIED').length;
    const needsChanges = reviews.filter(r => r.reviewStatus === 'NEEDS_CHANGES').length;
    const dangerous    = reviews.filter(hasDangerousFlag).length;
    const ready        = reviews.length > 0;
    return { proposals: proposals.length, reviews: reviews.length, policyMaps: policyMaps.length, approved, denied, needsChanges, dangerous, ready };
  }, [sourceData]);

  // Generate export — only writes to EXPORTS_KEY
  const handleGenerate = () => {
    const pkg = buildExport(sourceData);
    const updated = [pkg, ...exports].slice(0, 20);
    try { localStorage.setItem(EXPORTS_KEY, JSON.stringify(updated)); } catch {}
    setExports(updated);
    setLastAction(`Export generated — ${pkg.exportId}`);
  };

  const latestExport = exports[0] ?? null;

  // Copy latest export JSON
  const handleCopy = () => {
    if (!latestExport) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestExport, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest export JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  // Download latest export JSON
  const handleDownload = () => {
    if (!latestExport) return;
    try {
      const blob = new Blob([JSON.stringify(latestExport, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-proposal-review-evidence-${latestExport.exportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Export JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const recent5 = exports.slice(0, 5);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Evidence Export</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Proposal Review Evidence Chain Export
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Combines proposals, reviews, policy maps, and safety proof into a single exportable package.
            Writes only to <span className="font-mono">openclawProposalReviewEvidenceExports</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Export readiness status */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${readiness.ready ? 'bg-primary/5 border-primary/30' : 'bg-slate-500/5 border-slate-500/20'}`}>
        {readiness.ready
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
        <div className="flex-1">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${readiness.ready ? 'text-primary' : 'text-slate-400'}`}>
            {readiness.ready ? 'Export Ready — Source Data Found' : 'No Source Data — Refresh or Create Reviews First'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {readiness.reviews} review(s) · {readiness.proposals} proposal(s) · {readiness.policyMaps} policy map(s) loaded
          </div>
          {readiness.dangerous > 0 && (
            <div className="text-[8px] text-destructive mt-1 font-semibold">
              ⚠ {readiness.dangerous} dangerous safety flag(s) detected — will be included in export as evidence
            </div>
          )}
        </div>
        <span className={`text-[7px] font-bold px-2 py-0.5 rounded border ${readiness.ready ? 'text-primary border-primary/30 bg-primary/5' : 'text-slate-500 border-slate-500/30 bg-slate-500/5'}`}>
          {readiness.ready ? 'READY' : 'NOT READY'}
        </span>
      </div>

      {/* Source data counts */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Source Data Summary</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <CountRow label="Proposals (openclawCommandProposals)"        value={readiness.proposals}   color="slate" />
          <CountRow label="Reviews (openclawProposalReviews)"           value={readiness.reviews}     color="slate" />
          <CountRow label="Policy Maps (Phase 56)"                      value={readiness.policyMaps}  color="slate" />
          <CountRow label="Approved Reviews"                            value={readiness.approved}    color={readiness.approved > 0 ? 'green' : 'slate'} />
          <CountRow label="Denied Reviews"                              value={readiness.denied}      color={readiness.denied > 0 ? 'red' : 'slate'} />
          <CountRow label="Needs Changes Reviews"                       value={readiness.needsChanges} color={readiness.needsChanges > 0 ? 'amber' : 'slate'} />
          <CountRow label="Dangerous Safety Flags"                      value={readiness.dangerous}   color={readiness.dangerous === 0 ? 'green' : 'red'} />
          <CountRow label="Prior Exports Stored"                        value={exports.length}        color="slate" />
        </div>
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <BoolRow label="All approvals have approvalDoesNotExecute = true"
            value={readiness.approved > 0 && sourceData.reviews.filter(r => r.reviewStatus === 'APPROVED_READ_ONLY').every(r => r.approvalDoesNotExecute === true)} />
          <BoolRow label="All safety flags false (no dangerous reviews)"
            value={readiness.dangerous === 0 && readiness.reviews > 0} />
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
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Local Evidence Export
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestExport}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Export JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestExport}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Export JSON
        </button>
      </div>

      {/* Latest export preview */}
      {latestExport && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Export Preview</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestExport.exportedAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Export Mode',    v: latestExport.exportMode,      mono: true },
              { k: 'Exec Status',    v: latestExport.executionStatus, mono: true },
              { k: 'Network Status', v: latestExport.networkStatus,   mono: true },
              { k: 'Proposals',      v: latestExport.proposalsIncluded },
              { k: 'Reviews',        v: latestExport.reviewsIncluded },
              { k: 'Policy Maps',    v: latestExport.policyMapsIncluded },
              { k: 'Approved',       v: latestExport.approvedReviews },
              { k: 'Denied',         v: latestExport.deniedReviews },
              { k: 'Needs Changes',  v: latestExport.needsChangesReviews },
              { k: 'Dangerous Flags',v: latestExport.dangerousSafetyFlags },
              { k: 'All Non-Executing', v: String(latestExport.allApprovalsNonExecuting) },
              { k: 'All Flags Safe', v: String(latestExport.allSafetyFlagsFalse) },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`text-[9px] font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : ''}`}>{v}</div>
              </div>
            ))}
          </div>
          {/* nonExecutionProof strip */}
          <div className="px-4 pb-4">
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Non-Execution Proof</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {Object.entries(latestExport.nonExecutionProof).filter(([, v]) => typeof v === 'boolean').map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-[7px]">
                  <CheckCircle2 className={`w-2.5 h-2.5 shrink-0 ${v ? 'text-primary' : 'text-destructive'}`} />
                  <span className={`font-mono ${v ? 'text-slate-400' : 'text-destructive/70'}`}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Last 5 export records */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Exports ({recent5.length} of {exports.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <ExportRecord key={rec.exportId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Evidence Export Safety Guarantee</div>
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
            'No custom events fired',
            'Source records never modified',
            'Writes only to openclawProposalReviewEvidenceExports',
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
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only export. executionStatus hardcoded as NOT_EXECUTED. No network path. No dispatch path.
      </div>
    </div>
  );
}