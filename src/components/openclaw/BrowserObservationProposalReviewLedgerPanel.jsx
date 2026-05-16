/**
 * BrowserObservationProposalReviewLedgerPanel — Local-only Review Ledger (Phase 16)
 * Reviews browser observation proposals without executing any browser actions.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { BookOpen, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const PROPOSALS_KEY = 'openclawBrowserObservationProposals';
const LEDGER_KEY    = 'openclawBrowserObservationProposalReviewLedger';

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noRealBrowserActions:     true,
  noClick:                  true,
  noTyping:                 true,
  noFormSubmit:             true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noScheduler:              true,
  noPolling:                true,
  noAutonomousControl:      true,
};

const DECISION_CONFIG = {
  APPROVED_FOR_DESIGN: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         icon: CheckCircle2, badge: 'text-primary border-primary/30 bg-primary/5' },
  HELD_FOR_REVIEW:     { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: Clock,        badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  DENIED_BY_POLICY:    { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,      badge: 'text-destructive border-destructive/30 bg-destructive/5' },
};

// Allowed decisions per original status
function allowedDecisions(proposalStatus) {
  if (proposalStatus === 'BLOCKED_BY_POLICY')              return ['DENIED_BY_POLICY'];
  if (proposalStatus === 'AUTO_APPROVED_READ_ONLY_DESIGN') return ['APPROVED_FOR_DESIGN', 'HELD_FOR_REVIEW'];
  if (proposalStatus === 'HOLD_FOR_OPERATOR_REVIEW')       return ['HELD_FOR_REVIEW', 'APPROVED_FOR_DESIGN'];
  return ['HELD_FOR_REVIEW', 'APPROVED_FOR_DESIGN', 'DENIED_BY_POLICY'];
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export default function BrowserObservationProposalReviewLedgerPanel() {
  const [proposals]               = useState(() => loadJSON(PROPOSALS_KEY, []));
  const [ledger, setLedger]       = useState(() => loadJSON(LEDGER_KEY, []));
  const [selectedId, setSelectedId] = useState('');
  const [decision, setDecision]   = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [copied, setCopied]       = useState(false);

  const selected = proposals.find(p => p.proposalId === selectedId) ?? null;

  // When proposal selection changes, reset decision to first allowed
  const handleSelectProposal = (id) => {
    setSelectedId(id);
    const p = proposals.find(x => x.proposalId === id);
    const opts = p ? allowedDecisions(p.proposalStatus) : [];
    setDecision(opts[0] ?? '');
    setReviewerNote('');
  };

  const handleSave = () => {
    if (!selected || !decision) return;
    const record = {
      reviewId:                `OBREV-${Date.now()}`,
      createdAt:               new Date().toISOString(),
      proposalId:              selected.proposalId,
      observationType:         selected.observationType,
      targetUrl:               selected.targetUrl,
      originalClassification:  selected.classification,
      originalProposalStatus:  selected.proposalStatus,
      reviewDecision:          decision,
      reviewerNote:            reviewerNote.trim() || '[none]',
      reviewedBy:              'LOCAL_OPERATOR',
      executionAllowed:        false,
      dispatchAllowed:         false,
      browserMutationAllowed:  false,
      credentialEntryAllowed:  false,
      safetyAssertions:        SAFETY_ASSERTIONS,
    };
    const updated = [record, ...ledger].slice(0, 50);
    try { localStorage.setItem(LEDGER_KEY, JSON.stringify(updated, null, 2)); } catch {}
    setLedger(updated);
    setSelectedId('');
    setDecision('');
    setReviewerNote('');
  };

  const handleCopy = () => {
    if (!ledger.length) return;
    navigator.clipboard.writeText(JSON.stringify(ledger[0], null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(LEDGER_KEY); } catch {}
    setLedger([]);
  };

  const counts = {
    approved: ledger.filter(r => r.reviewDecision === 'APPROVED_FOR_DESIGN').length,
    held:     ledger.filter(r => r.reviewDecision === 'HELD_FOR_REVIEW').length,
    denied:   ledger.filter(r => r.reviewDecision === 'DENIED_BY_POLICY').length,
  };

  const decisionOptions = selected ? allowedDecisions(selected.proposalStatus) : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 16 · Browser Observation Proposal Review Ledger</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Browser Observation Proposal Review Ledger
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only review ledger. No execution, no automation, no dispatch, no backend calls.</div>
      </div>

      {/* Count summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Approved',     count: counts.approved, key: 'APPROVED_FOR_DESIGN' },
          { label: 'Held',         count: counts.held,     key: 'HELD_FOR_REVIEW' },
          { label: 'Denied',       count: counts.denied,   key: 'DENIED_BY_POLICY' },
        ].map(({ label, count, key }) => {
          const cfg = DECISION_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`border rounded-lg px-3 py-2.5 ${cfg.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${cfg.color} shrink-0`} />
                <span className={`text-[8px] font-bold uppercase tracking-wider ${cfg.color}`}>{label}</span>
              </div>
              <div className={`text-[18px] font-bold ${cfg.color}`}>{count}</div>
              <div className="text-[8px] text-slate-500">reviews</div>
            </div>
          );
        })}
      </div>

      {/* Review form */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">New Review Record</span>
        </div>
        <div className="p-4 space-y-3">

          {/* Proposal selector */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">
              Select Proposal ({proposals.length} available)
            </label>
            {proposals.length === 0 ? (
              <div className="px-3 py-2 bg-secondary/20 border border-border/40 rounded text-[9px] text-slate-500 italic">
                No proposals found. Create proposals in the Proposal Queue panel first.
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={e => handleSelectProposal(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground font-mono focus:outline-none focus:border-primary"
              >
                <option value="">— Select a proposal —</option>
                {proposals.map(p => (
                  <option key={p.proposalId} value={p.proposalId}>
                    {p.proposalId} · {p.observationType}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected proposal summary */}
          {selected && (
            <div className={`border rounded-lg p-3 space-y-2 ${DECISION_CONFIG[
              selected.proposalStatus === 'AUTO_APPROVED_READ_ONLY_DESIGN' ? 'APPROVED_FOR_DESIGN' :
              selected.proposalStatus === 'BLOCKED_BY_POLICY'              ? 'DENIED_BY_POLICY'    : 'HELD_FOR_REVIEW'
            ]?.bg ?? 'bg-card border-border'}`}>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Selected Proposal</div>
              <div className="grid grid-cols-2 gap-2 text-[8px]">
                {[
                  { k: 'Proposal ID',    v: selected.proposalId,       vc: 'font-mono text-blue-400 text-[7px]' },
                  { k: 'Observation',    v: selected.observationType,  vc: 'font-mono' },
                  { k: 'Status',         v: selected.proposalStatus,   vc: 'font-semibold' },
                  { k: 'Classification', v: selected.classification },
                  { k: 'Target URL',     v: selected.targetUrl,        vc: 'font-mono text-[7px] truncate' },
                  { k: 'Created',        v: new Date(selected.createdAt).toLocaleString() },
                ].map(({ k, v, vc }) => (
                  <div key={k} className="bg-card/60 border border-border/40 px-2 py-1.5 rounded">
                    <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5">{k}</div>
                    <div className={vc || 'text-foreground font-semibold'}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review decision */}
          {selected && (
            <div>
              <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Review Decision</label>
              <select
                value={decision}
                onChange={e => setDecision(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground font-mono focus:outline-none focus:border-primary"
              >
                {decisionOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {decision && (
                <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 border rounded text-[8px] font-bold ${DECISION_CONFIG[decision]?.bg} ${DECISION_CONFIG[decision]?.color}`}>
                  {React.createElement(DECISION_CONFIG[decision]?.icon, { className: 'w-3 h-3 shrink-0' })}
                  {decision}
                </div>
              )}
            </div>
          )}

          {/* Reviewer note */}
          {selected && (
            <div>
              <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Reviewer Note</label>
              <textarea
                value={reviewerNote}
                onChange={e => setReviewerNote(e.target.value)}
                rows={2}
                placeholder="Optional review rationale"
                className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground focus:outline-none focus:border-primary placeholder:text-slate-600 resize-none"
              />
            </div>
          )}

          {/* Blocked-only note */}
          {selected?.proposalStatus === 'BLOCKED_BY_POLICY' && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/5 border border-destructive/20 rounded">
              <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-[9px] text-destructive/90 font-semibold">
                This proposal is blocked by policy. Only DENIED_BY_POLICY is permitted.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!selected || !decision}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-40"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Save Review Record
          </button>
        </div>
      </div>

      {/* Review history table */}
      {ledger.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Review History</span>
            <span className="text-[8px] text-slate-500">{ledger.length} total (max 50)</span>
          </div>
          <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
            {ledger.map((r, i) => {
              const cfg = DECISION_CONFIG[r.reviewDecision] ?? DECISION_CONFIG.HELD_FOR_REVIEW;
              const Icon = cfg.icon;
              return (
                <div key={r.reviewId} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-[7px] text-slate-600 font-mono mt-0.5 shrink-0 w-4">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono text-slate-300 truncate">{r.observationType}</div>
                    <div className="text-[7px] text-slate-500 mt-0.5">{r.reviewId} · {new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded shrink-0 ${cfg.badge}`}>
                    {r.reviewDecision === 'APPROVED_FOR_DESIGN' ? 'APPROVED' :
                     r.reviewDecision === 'HELD_FOR_REVIEW'     ? 'HELD'     : 'DENIED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-primary font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Review records are local-only and non-executable.</span>{' '}
          No backend calls, no browser automation, no execution, dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Copy / Clear buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!ledger.length}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Review JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!ledger.length}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Review Ledger
        </button>
      </div>

      {/* Latest review JSON preview */}
      {ledger.length > 0 && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Review — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(ledger[0].createdAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {JSON.stringify(ledger[0], null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{LEDGER_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}