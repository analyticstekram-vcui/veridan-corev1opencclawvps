/**
 * OpenClawProposalReviewPanel
 * Local-only operator review panel for proposals from OpenClawCommandProposalBox.
 * Never executes, calls OpenClaw, calls backend, dispatches, trades, moves money,
 * exposes secrets, or uses browser automation.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { ShieldCheck, Copy, CheckCircle2, Trash2, ChevronDown, RefreshCw, XCircle, AlertCircle } from 'lucide-react';

// ── Storage keys ──────────────────────────────────────────────────────────────
const PROPOSALS_KEY = 'openclawCommandProposals';
const REVIEWS_KEY   = 'openclawProposalReviews';
const POLICY_KEY    = 'openclawPhase56ReadOnlyCapabilityPolicyMaps';
// (read keys available for future expansion — not actively consumed beyond proposals + policy)
// 'openclawPhase50OpenClawReadOnlyHealthCheckResults'
// 'openclawPhase54StatusVersionCapabilitiesReadOnlyResults'

// ── Safe JSON helpers ─────────────────────────────────────────────────────────
function loadJSON(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Data loaders ──────────────────────────────────────────────────────────────
function loadProposals() {
  const raw = loadJSON(PROPOSALS_KEY, []);
  return Array.isArray(raw) ? raw : [];
}
function loadReviews() {
  const raw = loadJSON(REVIEWS_KEY, []);
  return Array.isArray(raw) ? raw : [];
}
function loadPolicyMap() {
  const raw = loadJSON(POLICY_KEY, []);
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const maps = raw.flatMap(b => b.policyMaps || []);
  return maps.length > 0 ? maps[0] : null;
}

// ── Recommended manual action ─────────────────────────────────────────────────
const INTENT_ACTION_MAP = {
  READ_ONLY_HEALTH:         'USE_EXISTING_HEALTH_CHECK_PANEL',
  READ_ONLY_STATUS:         'USE_EXISTING_STATUS_VERSION_CAPABILITIES_PANEL',
  READ_ONLY_VERSION:        'USE_EXISTING_STATUS_VERSION_CAPABILITIES_PANEL',
  READ_ONLY_CAPABILITIES:   'USE_EXISTING_STATUS_VERSION_CAPABILITIES_PANEL',
  READ_ONLY_SAFETY_SUMMARY: 'USE_OBSERVABILITY_DASHBOARD',
  BLOCKED_HIGH_RISK:        'NO_ACTION_BLOCKED_BY_POLICY',
  NEEDS_REVIEW:             'OPERATOR_CLARIFICATION_REQUIRED',
};

const INTENT_GUIDANCE = {
  READ_ONLY_HEALTH:         'Navigate to the Read-Only Health Check panel and run the check manually.',
  READ_ONLY_STATUS:         'Navigate to the Status / Version / Capabilities Read-Only Route panel and run the check manually.',
  READ_ONLY_VERSION:        'Navigate to the Status / Version / Capabilities Read-Only Route panel and run the check manually.',
  READ_ONLY_CAPABILITIES:   'Navigate to the Status / Version / Capabilities Read-Only Route panel and run the check manually.',
  READ_ONLY_SAFETY_SUMMARY: 'Navigate to the OpenClaw Read-Only Observability Dashboard and refresh the view.',
  BLOCKED_HIGH_RISK:        'This action is blocked by policy. No manual action should be taken.',
  NEEDS_REVIEW:             'Clarify the request before taking any action.',
};

const READ_ONLY_INTENTS = new Set([
  'READ_ONLY_HEALTH','READ_ONLY_STATUS','READ_ONLY_VERSION',
  'READ_ONLY_CAPABILITIES','READ_ONLY_SAFETY_SUMMARY',
]);

function canApprove(proposal, policyMap) {
  if (!proposal) return false;
  if (proposal.decision === 'ALLOW_READ_ONLY_PROPOSAL') return true;
  if (proposal.decision === 'BLOCKED_PROPOSAL') return false;
  // NEEDS_REVIEW — allow only if intent is read-only and policy map exists
  return READ_ONLY_INTENTS.has(proposal.classifiedIntent) && Boolean(policyMap);
}

function buildReview(proposal, reviewStatus, reviewNote, policyMap) {
  const intent = proposal.classifiedIntent ?? 'NEEDS_REVIEW';
  return {
    reviewId: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    proposalId: proposal.proposalId,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'OPERATOR',
    requestText: proposal.requestText,
    classifiedIntent: intent,
    originalDecision: proposal.decision,
    reviewStatus,
    reviewNote: reviewNote || '',
    recommendedManualAction: INTENT_ACTION_MAP[intent] ?? 'OPERATOR_CLARIFICATION_REQUIRED',
    approvalDoesNotExecute: true,
    executionStatus: 'NOT_EXECUTED',
    openClawCalled: false,
    backendCalled: false,
    apiCalled: false,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    browserAutomationPerformed: false,
    schedulerPerformed: false,
    pollingPerformed: false,
    secretValueAccessed: false,
    rawResponseBodyAccessed: false,
    safetyStatus: 'REVIEW_ONLY_LOCKED',
  };
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
function DecisionBadge({ decision }) {
  if (decision === 'ALLOW_READ_ONLY_PROPOSAL')
    return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">ALLOW_READ_ONLY</span>;
  if (decision === 'BLOCKED_PROPOSAL')
    return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">BLOCKED</span>;
  return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-amber-500 border-amber-500/30 bg-amber-500/5">NEEDS_REVIEW</span>;
}

function ReviewBadge({ status }) {
  if (!status) return <span className="text-[7px] text-slate-600 font-bold">PENDING</span>;
  if (status === 'APPROVED_READ_ONLY')
    return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">APPROVED</span>;
  if (status === 'DENIED')
    return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">DENIED</span>;
  return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-amber-500 border-amber-500/30 bg-amber-500/5">NEEDS_CHANGES</span>;
}

function SummaryCard({ label, value, color }) {
  const colors = { green: 'text-primary', red: 'text-destructive', amber: 'text-amber-500', slate: 'text-slate-400' };
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-3">
      <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-1">{label}</div>
      <div className={`text-[20px] font-bold ${colors[color] || colors.slate}`}>{value}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OpenClawProposalReviewPanel() {
  const [tick, setTick]           = useState(0);
  const [reviews, setReviews]     = useState(() => loadReviews());
  const [noteInputs, setNoteInputs] = useState({});   // proposalId → string
  const [expanded, setExpanded]   = useState(null);   // proposalId
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]       = useState(false);
  const [approvedGuidance, setApprovedGuidance] = useState(null); // latest approved review

  // Derived data — re-computed when tick changes
  const proposals = React.useMemo(() => loadProposals(), [tick]);       // eslint-disable-line react-hooks/exhaustive-deps
  const policyMap = React.useMemo(() => loadPolicyMap(), [tick]);       // eslint-disable-line react-hooks/exhaustive-deps

  // Build a lookup of latest review per proposalId
  const latestReviewByProposal = React.useMemo(() => {
    const map = {};
    [...reviews].reverse().forEach(r => { map[r.proposalId] = r; });
    return map;
  }, [reviews]);

  const handleRefresh = () => {
    setReviews(loadReviews());
    setTick(t => t + 1);
    setLastAction('Panel refreshed from localStorage.');
  };

  const submitReview = useCallback((proposal, reviewStatus) => {
    const note = noteInputs[proposal.proposalId] || '';
    const review = buildReview(proposal, reviewStatus, note, policyMap);

    const updated = [review, ...reviews].slice(0, 100);
    saveJSON(REVIEWS_KEY, updated);
    setReviews(updated);

    // Clear note input for this proposal
    setNoteInputs(prev => { const n = { ...prev }; delete n[proposal.proposalId]; return n; });

    if (reviewStatus === 'APPROVED_READ_ONLY') {
      setApprovedGuidance(review);
    }
    setLastAction(`Review saved — ${reviewStatus} for proposal ${proposal.proposalId.slice(0, 16)}…`);
  }, [noteInputs, reviews, policyMap]);

  const handleCopy = () => {
    if (reviews.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(reviews.slice(0, 20), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Reviews JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleClearReviews = () => {
    try { localStorage.removeItem(REVIEWS_KEY); } catch {}
    setReviews([]);
    setApprovedGuidance(null);
    setLastAction('Review history cleared.');
  };

  // ── Summary counts ──
  const pending      = proposals.filter(p => !latestReviewByProposal[p.proposalId]).length;
  const approved     = reviews.filter(r => r.reviewStatus === 'APPROVED_READ_ONLY').length;
  const denied       = reviews.filter(r => r.reviewStatus === 'DENIED').length;
  const needsChanges = reviews.filter(r => r.reviewStatus === 'NEEDS_CHANGES').length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Operator Tool</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Proposal Review Panel
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Review safe proposals before taking any manual read-only action. This panel does not execute anything.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button type="button" onClick={handleCopy} disabled={reviews.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-primary/40 text-primary hover:bg-primary/10 rounded font-bold transition-colors disabled:opacity-40">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Reviews JSON'}
          </button>
          <button type="button" onClick={handleClearReviews} disabled={reviews.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40">
            <Trash2 className="w-3.5 h-3.5" /> Clear Reviews
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <SummaryCard label="Total Proposals"  value={proposals.length} color="slate" />
        <SummaryCard label="Pending Review"   value={pending}          color={pending > 0 ? 'amber' : 'slate'} />
        <SummaryCard label="Approved"         value={approved}         color={approved > 0 ? 'green' : 'slate'} />
        <SummaryCard label="Denied"           value={denied}           color={denied > 0 ? 'red' : 'slate'} />
        <SummaryCard label="Needs Changes"    value={needsChanges}     color={needsChanges > 0 ? 'amber' : 'slate'} />
      </div>

      {/* ── Approved guidance card ── */}
      {approvedGuidance && (
        <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border-2 border-primary/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-primary">Proposal Approved — Recommended Manual Action</div>
            <div className="text-[9px] text-slate-300">{INTENT_GUIDANCE[approvedGuidance.classifiedIntent] ?? 'Refer to governance chain panels.'}</div>
            <div className="text-[8px] font-mono text-primary/70">{approvedGuidance.recommendedManualAction}</div>
            <div className="text-[8px] text-slate-500 italic">Approval does not execute anything. Use the listed panel manually.</div>
            <button type="button" onClick={() => setApprovedGuidance(null)}
              className="text-[7px] text-slate-500 hover:text-slate-300 underline mt-1">Dismiss</button>
          </div>
        </div>
      )}

      {/* ── Last action feedback ── */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* ── No proposals ── */}
      {proposals.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[9px] text-slate-400">No proposals yet. Use the Command Proposal Box above to create proposals.</span>
        </div>
      )}

      {/* ── Proposal review table ── */}
      {proposals.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Proposals ({proposals.length})</span>
          </div>
          <div className="divide-y divide-border/20">
            {proposals.map((p) => {
              const existingReview = latestReviewByProposal[p.proposalId];
              const approveEnabled = canApprove(p, policyMap);
              const isExpanded = expanded === p.proposalId;
              const note = noteInputs[p.proposalId] ?? '';

              return (
                <div key={p.proposalId} className="p-4 space-y-3">
                  {/* Row header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleString()}
                        </span>
                        <DecisionBadge decision={p.decision} />
                        <ReviewBadge status={existingReview?.reviewStatus} />
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/20 bg-primary/5">REVIEW_ONLY_LOCKED</span>
                      </div>
                      <div className="text-[9px] text-slate-200 font-medium truncate">{p.requestText}</div>
                      <div className="text-[8px] font-mono text-slate-500">{p.classifiedIntent}</div>
                    </div>
                    <button type="button" onClick={() => setExpanded(isExpanded ? null : p.proposalId)}
                      className="flex items-center gap-1 text-[8px] text-primary font-bold hover:text-primary/80 shrink-0">
                      DETAILS <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Recommended action (if reviewed) */}
                  {existingReview && (
                    <div className="text-[8px] text-slate-400 pl-0.5">
                      <span className="text-slate-500 font-semibold">Manual action: </span>
                      <span className="font-mono text-primary/80">{existingReview.recommendedManualAction}</span>
                    </div>
                  )}

                  {/* Note input + action buttons */}
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={e => setNoteInputs(prev => ({ ...prev, [p.proposalId]: e.target.value }))}
                      placeholder="Optional review note…"
                      rows={2}
                      className="w-full px-2 py-1.5 bg-secondary/20 border border-border/60 rounded text-[9px] text-foreground placeholder:text-slate-600 font-mono resize-none focus:outline-none focus:border-primary/40 transition-colors"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="button"
                        onClick={() => submitReview(p, 'APPROVED_READ_ONLY')}
                        disabled={!approveEnabled}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold border border-primary text-primary bg-primary/5 hover:bg-primary/15 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <CheckCircle2 className="w-3 h-3" /> Approve Read-Only Proposal
                      </button>
                      <button type="button"
                        onClick={() => submitReview(p, 'DENIED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold border border-destructive/40 text-destructive/80 hover:bg-destructive/5 rounded transition-colors">
                        <XCircle className="w-3 h-3" /> Deny Proposal
                      </button>
                      <button type="button"
                        onClick={() => submitReview(p, 'NEEDS_CHANGES')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold border border-amber-500/40 text-amber-500/80 hover:bg-amber-500/5 rounded transition-colors">
                        <AlertCircle className="w-3 h-3" /> Needs Changes
                      </button>
                    </div>
                    {!approveEnabled && p.decision !== 'ALLOW_READ_ONLY_PROPOSAL' && (
                      <div className="text-[8px] text-slate-500 italic">
                        {p.decision === 'BLOCKED_PROPOSAL'
                          ? 'Approve is disabled — proposal is blocked by policy.'
                          : 'Approve is disabled — generate a Phase 56 policy map first or clarify the request.'}
                      </div>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-border/30">
                      <div className="text-[8px] text-slate-400">
                        <span className="text-slate-500 font-semibold">Reason: </span>{p.reason}
                      </div>
                      {p.allowedActions?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[7px] text-slate-500 font-semibold mr-1">Allowed:</span>
                          {p.allowedActions.map(a => (
                            <span key={a} className="text-[7px] font-mono px-1.5 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded">{a}</span>
                          ))}
                        </div>
                      )}
                      {p.blockedReasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[7px] text-slate-500 font-semibold mr-1">Blocked by:</span>
                          {p.blockedReasons.map(b => (
                            <span key={b} className="text-[7px] font-mono px-1.5 py-0.5 bg-destructive/5 border border-destructive/20 text-destructive rounded">{b}</span>
                          ))}
                        </div>
                      )}
                      <div>
                        <div className="text-[8px] text-slate-500 font-semibold mb-1">Proposal JSON</div>
                        <pre className="text-[7px] font-mono text-slate-400 bg-secondary/20 rounded p-2 border border-border/40 overflow-auto max-h-36">
                          {JSON.stringify(p, null, 2)}
                        </pre>
                      </div>
                      {existingReview && (
                        <div>
                          <div className="text-[8px] text-slate-500 font-semibold mb-1">Review JSON</div>
                          <pre className="text-[7px] font-mono text-slate-400 bg-secondary/20 rounded p-2 border border-border/40 overflow-auto max-h-36">
                            {JSON.stringify(existingReview, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Safety block ── */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Review-Only Safety Guarantee</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 text-[8px] text-slate-400">
          {['Review only','Approval does not execute','No OpenClaw call',
            'No backend call','No dispatch','No execution',
            'No trading','No money movement','No secret access',
            'No raw response body access','No scheduler or polling','No browser automation'].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Safety footer ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        All review decisions are local-only. No fetch, no axios, no SDK, no backend calls, no secrets, no dispatch, no execution.
      </div>
    </div>
  );
}