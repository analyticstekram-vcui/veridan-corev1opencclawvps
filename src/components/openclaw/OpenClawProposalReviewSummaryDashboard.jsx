/**
 * OpenClawProposalReviewSummaryDashboard
 * Read-only local summary of openclawProposalReviews.
 * No writes, no network, no SDK, no execution, no credentials.
 */
import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';

const REVIEWS_KEY = 'openclawProposalReviews';

const SAFETY_FLAGS = [
  'openClawCalled','backendCalled','apiCalled','dispatchPerformed',
  'executionPerformed','tradingPerformed','moneyMovementPerformed',
  'browserAutomationPerformed','schedulerPerformed','pollingPerformed',
  'secretValueAccessed','rawResponseBodyAccessed',
];

function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function hasDangerousFlag(review) {
  return SAFETY_FLAGS.some(f => review[f] === true);
}

function SummaryCard({ label, value, color = 'slate', sub }) {
  const textColor = { green: 'text-primary', red: 'text-destructive', amber: 'text-amber-500', slate: 'text-slate-300' }[color] || 'text-slate-300';
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-3 space-y-0.5">
      <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className={`text-[18px] font-bold leading-none ${textColor}`}>{value}</div>
      {sub && <div className="text-[7px] text-slate-500 font-mono truncate">{sub}</div>}
    </div>
  );
}

function StatusPill({ pass }) {
  return pass
    ? <span className="text-[7px] font-bold px-2 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">PASS</span>
    : <span className="text-[7px] font-bold px-2 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">FAIL</span>;
}

function ReviewRow({ review, idx }) {
  const [expanded, setExpanded] = useState(false);
  const dangerous = hasDangerousFlag(review);

  return (
    <div className={`border-b border-border/20 last:border-0 ${dangerous ? 'bg-destructive/5' : ''}`}>
      <div className="flex items-start justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            {review.reviewStatus === 'APPROVED_READ_ONLY' && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">APPROVED</span>
            )}
            {review.reviewStatus === 'DENIED' && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">DENIED</span>
            )}
            {review.reviewStatus === 'NEEDS_CHANGES' && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-amber-500 border-amber-500/30 bg-amber-500/5">NEEDS_CHANGES</span>
            )}
            {dangerous && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/10">⚠ DANGEROUS FLAG</span>
            )}
            {!dangerous && review.approvalDoesNotExecute === true && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/20 bg-primary/5">SAFE</span>
            )}
          </div>
          <div className="text-[8px] text-slate-300 truncate font-medium">{review.requestText || '—'}</div>
          <div className="text-[7px] font-mono text-slate-500">{review.classifiedIntent} · {review.recommendedManualAction}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[7px] font-mono text-slate-600">{review.reviewedAt ? new Date(review.reviewedAt).toLocaleTimeString() : '—'}</span>
          <button type="button" onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[7px] text-primary font-bold hover:text-primary/80">
            JSON <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3">
          <pre className="text-[7px] font-mono text-slate-400 bg-secondary/20 rounded p-2 border border-border/40 overflow-auto max-h-40">
            {JSON.stringify(review, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function OpenClawProposalReviewSummaryDashboard() {
  const [reviews, setReviews] = useState(() => loadReviews());
  const [localCleared, setLocalCleared] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(() => new Date().toISOString());

  const displayReviews = localCleared ? [] : reviews;

  const stats = useMemo(() => {
    const total      = displayReviews.length;
    const approved   = displayReviews.filter(r => r.reviewStatus === 'APPROVED_READ_ONLY').length;
    const denied     = displayReviews.filter(r => r.reviewStatus === 'DENIED').length;
    const needsChg   = displayReviews.filter(r => r.reviewStatus === 'NEEDS_CHANGES').length;
    const safeCount  = displayReviews.filter(r => r.approvalDoesNotExecute === true).length;
    const dangerous  = displayReviews.filter(hasDangerousFlag);
    const last       = displayReviews[0] ?? null;

    const allSafe = total > 0 &&
      safeCount === total &&
      dangerous.length === 0;

    return { total, approved, denied, needsChg, safeCount, dangerous, last, allSafe };
  }, [displayReviews]);

  const handleRefresh = () => {
    setReviews(loadReviews());
    setLocalCleared(false);
    setLastRefresh(new Date().toISOString());
  };

  const handleClearLocalView = () => {
    setLocalCleared(true);
  };

  const recent = displayReviews.slice(0, 10);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Read-Only Summary</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Proposal Review Summary Dashboard
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Local read-only view of openclawProposalReviews. No writes. No network.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[7px] font-mono text-slate-600">Last refresh: {new Date(lastRefresh).toLocaleTimeString()}</span>
          <button type="button" onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button type="button" onClick={handleClearLocalView}
            disabled={localCleared || displayReviews.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-slate-600 text-slate-500 hover:text-slate-300 hover:bg-secondary/30 rounded font-bold transition-colors disabled:opacity-40">
            Clear Local View Only
          </button>
        </div>
      </div>

      {/* Global safety status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 ${stats.allSafe ? 'bg-primary/5 border-primary/30' : stats.total === 0 ? 'bg-slate-500/5 border-slate-500/20' : 'bg-destructive/5 border-destructive/30'}`}>
        {stats.allSafe
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          : stats.total === 0
          ? <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          : <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${stats.allSafe ? 'text-primary' : stats.total === 0 ? 'text-slate-400' : 'text-destructive'}`}>
            {stats.allSafe ? 'Safety Check PASS — All reviews are safe' : stats.total === 0 ? 'No reviews loaded' : 'Safety Check — Issues detected'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {stats.total === 0
              ? 'Refresh to load review records from localStorage.'
              : stats.allSafe
              ? `${stats.safeCount}/${stats.total} reviews have approvalDoesNotExecute=true and all safety flags are false.`
              : `${stats.dangerous.length} review(s) have at least one dangerous safety flag set to true.`}
          </div>
        </div>
        <div className="ml-auto shrink-0"><StatusPill pass={stats.allSafe && stats.total > 0} /></div>
      </div>

      {/* Dangerous flag warning */}
      {stats.dangerous.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border-2 border-destructive/40 rounded-lg">
          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold text-destructive uppercase tracking-wider">WARNING — Dangerous Safety Flags Detected</div>
            <div className="text-[8px] text-destructive/80 mt-0.5">
              {stats.dangerous.length} review record(s) have one or more safety flags set to true. This should not happen in a read-only review system.
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {stats.dangerous.map(r => (
                <span key={r.reviewId} className="text-[7px] font-mono px-1.5 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive rounded">
                  {r.reviewId?.slice(0, 20)}…
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryCard label="Total Reviews"        value={stats.total}    color="slate" />
        <SummaryCard label="Approved"             value={stats.approved} color={stats.approved > 0 ? 'green' : 'slate'} />
        <SummaryCard label="Denied"               value={stats.denied}   color={stats.denied > 0 ? 'red' : 'slate'} />
        <SummaryCard label="Needs Changes"        value={stats.needsChg} color={stats.needsChg > 0 ? 'amber' : 'slate'} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <SummaryCard
          label="approvalDoesNotExecute = true"
          value={stats.safeCount}
          color={stats.safeCount === stats.total && stats.total > 0 ? 'green' : 'amber'}
        />
        <SummaryCard
          label="Dangerous Safety Flags"
          value={stats.dangerous.length}
          color={stats.dangerous.length === 0 ? 'green' : 'red'}
        />
        <SummaryCard
          label="Last Review"
          value={stats.last ? new Date(stats.last.reviewedAt).toLocaleTimeString() : '—'}
          color="slate"
          sub={stats.last?.proposalId ?? ''}
        />
      </div>

      {/* Last review detail strip */}
      {stats.last && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-1.5">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Latest Review</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[8px]">
            <div>
              <span className="text-slate-500 font-semibold">Proposal ID: </span>
              <span className="font-mono text-slate-300">{stats.last.proposalId}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Status: </span>
              <span className="font-mono text-primary">{stats.last.reviewStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Recommended Action: </span>
              <span className="font-mono text-primary/80 text-[7px]">{stats.last.recommendedManualAction}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent reviews table */}
      {recent.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Most Recent Reviews ({recent.length} of {stats.total})
            </span>
            <span className="text-[7px] font-mono text-slate-600">read-only · no writes</span>
          </div>
          <div>
            {recent.map((r, i) => <ReviewRow key={r.reviewId || i} review={r} idx={i} />)}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[9px] text-slate-400">
            {localCleared ? 'Local view cleared — click Refresh to reload from localStorage.' : 'No review records found in localStorage.'}
          </span>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Dashboard Safety Guarantee</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 text-[8px] text-slate-400">
          {['Read-only localStorage only','No writes to openclawProposalReviews','No fetch or axios',
            'No Base44 SDK call','No OpenClaw call','No API call',
            'No execution','No trading','No credential access',
            'No browser automation','No scheduler or polling','No new phases created'].map(item => (
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
        localStorage key read: openclawProposalReviews (read-only). No writes. No network. No SDK.
      </div>
    </div>
  );
}