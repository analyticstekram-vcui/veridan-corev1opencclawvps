import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  Clock, AlertTriangle, RefreshCw, ScrollText, Package
} from 'lucide-react';
import {
  loadProposals, loadAudit, loadPackets,
  approveProposal, denyProposal,
  submitForApproval, queuePreview, blockPreview,
} from '@/lib/proposalStore';
import PreviewCommandPacket from './PreviewCommandPacket';

// ── Config ─────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  DRAFT:            { label: 'DRAFT',             color: 'text-slate-400',   bg: 'bg-slate-500/5 border-slate-500/20' },
  PENDING_APPROVAL: { label: 'PENDING APPROVAL',  color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
  APPROVED:         { label: 'APPROVED',           color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
  DENIED:           { label: 'DENIED',             color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  QUEUED_PREVIEW:   { label: 'QUEUED PREVIEW',     color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20' },
  BLOCKED_PREVIEW:  { label: 'BLOCKED PREVIEW',    color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
};

const FILTER_OPTIONS = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED', 'QUEUED_PREVIEW', 'BLOCKED_PREVIEW'];

// ── Review Form ────────────────────────────────────────────────────────────────
function ReviewForm({ proposal, onApprove, onDeny, onClose }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const canApprove = proposal.riskTier !== 'HIGH' && !proposal.blockedReasons?.length;

  const handleApprove = () => {
    if (!note.trim()) { setError('Review note is required'); return; }
    const result = onApprove(proposal.id, note);
    if (result?.error) setError(result.error);
  };

  const handleDeny = () => {
    if (!note.trim()) { setError('Review note is required'); return; }
    onDeny(proposal.id, note);
  };

  return (
    <div className="mt-2 p-3 bg-secondary/20 border border-border/50 rounded-lg space-y-3">
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Governance Review</div>

      {!canApprove && (
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          {proposal.riskTier === 'HIGH'
            ? 'HIGH risk proposals cannot be approved.'
            : 'Proposals with blocked reasons cannot be approved.'}
        </div>
      )}

      <div>
        <label className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
          Review Note <span className="text-destructive">*</span>
        </label>
        <textarea
          value={note}
          onChange={e => { setNote(e.target.value); setError(''); }}
          rows={2}
          placeholder="Required — enter your review justification…"
          className="w-full px-2 py-1.5 bg-secondary/40 border border-border text-[10px] font-mono text-foreground rounded outline-none resize-none focus:border-primary/50 placeholder:text-slate-600"
        />
        {error && <div className="text-[9px] text-destructive mt-0.5">{error}</div>}
      </div>

      <div className="flex gap-2">
        {canApprove && (
          <button type="button" onClick={handleApprove}
            className="px-3 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 rounded font-bold transition-colors">
            ✓ Approve for Preview Queue
          </button>
        )}
        <button type="button" onClick={handleDeny}
          className="px-3 py-1.5 text-[9px] border border-destructive/40 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded font-bold transition-colors">
          ✗ Deny
        </button>
        <button type="button" onClick={onClose}
          className="px-3 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors ml-auto">
          Cancel
        </button>
      </div>

      <div className="text-[8px] text-slate-500 border-t border-border/30 pt-2">
        APPROVED = Approved for preview queue only. Not execution.
        Governance decision logged to audit trail.
      </div>
    </div>
  );
}

// ── Proposal Row ───────────────────────────────────────────────────────────────
function ProposalRow({ proposal, packets, onRefresh, currentUser }) {
  const [expanded,     setExpanded]     = useState(false);
  const [showReview,   setShowReview]   = useState(false);
  const [actionError,  setActionError]  = useState('');

  const cfg = STATUS_CFG[proposal.status] || STATUS_CFG.DRAFT;
  const riskColor = proposal.riskTier === 'HIGH' ? 'text-destructive' : proposal.riskTier === 'MEDIUM' ? 'text-amber-500' : 'text-primary';

  const handleApprove = (id, note) => {
    const result = approveProposal(id, currentUser || 'operator', note);
    if (result.error) return result;
    onRefresh();
    setShowReview(false);
    return result;
  };

  const handleDeny = (id, note) => {
    denyProposal(id, currentUser || 'operator', note);
    onRefresh();
    setShowReview(false);
  };

  const handleQueuePreview = () => {
    queuePreview(proposal.id);
    onRefresh();
  };

  const handleBlockPreview = () => {
    const reason = window.prompt('Block reason (optional):') || 'Blocked during preview review.';
    blockPreview(proposal.id, reason);
    onRefresh();
  };

  const handleSubmit = () => {
    submitForApproval(proposal.id);
    onRefresh();
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
      {/* Row header */}
      <div
        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-black/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-foreground font-mono">{proposal.commandType}</span>
            <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className={`text-[7px] font-bold uppercase ${riskColor}`}>{proposal.riskTier}</span>
          </div>
          <div className="text-[9px] text-blue-400 font-mono truncate mt-0.5">{proposal.target || '—'}</div>
        </div>
        <span className="text-[8px] text-slate-500 font-mono shrink-0">{new Date(proposal.createdAt).toLocaleTimeString()}</span>
      </div>

      {expanded && (
        <div className="border-t border-border/20 px-3 py-3 space-y-3 bg-black/10">

          {/* Blocked reasons */}
          {proposal.blockedReasons?.length > 0 && (
            <div className="px-2 py-2 bg-destructive/5 border border-destructive/20 rounded space-y-0.5">
              <div className="text-[8px] uppercase tracking-widest text-destructive font-semibold mb-1">Blocked Reasons</div>
              {proposal.blockedReasons.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[8px] text-destructive">
                  <XCircle className="w-2.5 h-2.5 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-slate-500">
            <span>ID: <span className="text-slate-300 font-mono">{proposal.id}</span></span>
            <span>Approval: <span className="text-slate-300">{proposal.requiredApproval}</span></span>
            <span>Purpose: <span className="text-slate-300">{proposal.purpose || '—'}</span></span>
            <span>Expected: <span className="text-slate-300">{proposal.expectedResult || '—'}</span></span>
            <span>Safety: <span className="text-primary font-semibold">{proposal.safetyMode}</span></span>
            <span>Executed: <span className="text-destructive font-semibold">{String(proposal.executionAttempted)}</span></span>
            {proposal.governanceDecision && (
              <span className="col-span-2">Decision: <span className="text-amber-500 font-semibold">{proposal.governanceDecision}</span></span>
            )}
            {proposal.reviewedBy && <span>Reviewed by: <span className="text-slate-300">{proposal.reviewedBy}</span></span>}
            {proposal.reviewedAt && <span>Reviewed at: <span className="text-slate-300 font-mono">{new Date(proposal.reviewedAt).toLocaleString()}</span></span>}
            {proposal.reviewNote && <span className="col-span-2">Review note: <span className="text-slate-300">{proposal.reviewNote}</span></span>}
          </div>

          {/* State transitions */}
          <div className="flex flex-wrap gap-2">
            {proposal.status === 'DRAFT' && (
              <button type="button" onClick={handleSubmit}
                className="px-2.5 py-1.5 text-[9px] border border-amber-500/40 text-amber-500 bg-amber-500/5 hover:bg-amber-500/15 rounded font-bold transition-colors">
                Submit for Approval →
              </button>
            )}
            {proposal.status === 'PENDING_APPROVAL' && !showReview && (
              <button type="button" onClick={() => setShowReview(true)}
                className="px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
                Review →
              </button>
            )}
            {proposal.status === 'APPROVED' && (
              <button type="button" onClick={handleQueuePreview}
                className="px-2.5 py-1.5 text-[9px] border border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15 rounded font-bold transition-colors">
                Queue for Preview →
              </button>
            )}
            {proposal.status === 'QUEUED_PREVIEW' && (
              <button type="button" onClick={handleBlockPreview}
                className="px-2.5 py-1.5 text-[9px] border border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/15 rounded font-bold transition-colors">
                Block Preview →
              </button>
            )}
          </div>

          {/* Review form */}
          {showReview && (
            <ReviewForm
              proposal={proposal}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onClose={() => setShowReview(false)}
            />
          )}

          {actionError && (
            <div className="text-[9px] text-destructive">{actionError}</div>
          )}

          {/* Preview Command Packet — available for APPROVED and QUEUED_PREVIEW */}
          {['APPROVED', 'QUEUED_PREVIEW'].includes(proposal.status) && (
            <div className="border-t border-border/20 pt-3">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Preview Command Packet</div>
              <PreviewCommandPacket proposal={proposal} packets={packets} onRefresh={onRefresh} />
            </div>
          )}

          {/* Full JSON */}
          <details>
            <summary className="text-[8px] text-slate-500 cursor-pointer hover:text-slate-300 uppercase tracking-widest font-semibold">
              Full JSON
            </summary>
            <pre className="mt-1.5 bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-400 overflow-auto max-h-48">
              {JSON.stringify(proposal, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function CommandApprovalWorkflowPanel() {
  const [proposals, setProposals] = useState([]);
  const [auditLog,  setAuditLog]  = useState([]);
  const [packets,   setPackets]   = useState([]);
  const [filter,    setFilter]    = useState('ALL');
  const [currentUser, setCurrentUser] = useState('operator');
  const [showAudit, setShowAudit] = useState(false);

  const refresh = useCallback(() => {
    setProposals(loadProposals());
    setAuditLog(loadAudit());
    setPackets(loadPackets());
  }, []);

  useEffect(() => {
    refresh();
    // sync on other-tab writes
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [refresh]);

  // Try to get current user
  useEffect(() => {
    import('@/api/base44Client').then(({ base44 }) => {
      base44.auth.me().then(u => { if (u?.email) setCurrentUser(u.email); }).catch(() => {});
    });
  }, []);

  const filtered = filter === 'ALL' ? proposals : proposals.filter(p => p.status === filter);

  const stats = {
    total:          proposals.length,
    pending:        proposals.filter(p => p.status === 'PENDING_APPROVAL').length,
    approvedPreview:proposals.filter(p => p.status === 'APPROVED' || p.status === 'QUEUED_PREVIEW').length,
    denied:         proposals.filter(p => p.status === 'DENIED').length,
    blocked:        proposals.filter(p => p.status === 'BLOCKED_PREVIEW' || p.blockedReasons?.length > 0).length,
    executionAttempted: 0,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Approval Workflow</div>
          <div className="text-[13px] font-semibold text-foreground">Command Proposal Governance</div>
        </div>
        <button type="button" onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-semibold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-amber-500/90">
          <span className="font-bold">Approval = Preview Queue only.</span> Approving a proposal does NOT execute any command.
          Gateway Mode: READ_ONLY. Execution: DISABLED.
        </div>
      </div>

      {/* Packet Summary Card */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Preview Packet Summary</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Total Packets',          value: packets.length,                                                    color: 'text-foreground',  bg: 'bg-secondary/20 border-border' },
            { label: 'Ready for Bridge Test',  value: packets.filter(p => p.packetStatus === 'READY_FOR_BRIDGE_TEST').length, color: 'text-blue-400', bg: 'bg-blue-400/5 border-blue-400/20' },
            { label: 'Blocked Packets',        value: packets.filter(p => !p.allowedCommand).length,                    color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
            { label: 'OpenClaw Calls Attempted', value: 0,                                                              color: 'text-slate-400',   bg: 'bg-secondary/10 border-border' },
            { label: 'Execution Attempted',    value: 0,                                                                color: 'text-slate-400',   bg: 'bg-secondary/10 border-border' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`border rounded px-2 py-1.5 ${bg}`}>
              <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
              <div className={`text-[13px] font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Governance Summary Card */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total',              value: stats.total,            color: 'text-foreground',  bg: 'bg-secondary/20 border-border' },
          { label: 'Pending Approval',   value: stats.pending,          color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Approved / Queued',  value: stats.approvedPreview,  color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
          { label: 'Denied',             value: stats.denied,           color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'Blocked',            value: stats.blocked,          color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'Execution Attempted',value: stats.executionAttempted, color: 'text-slate-400', bg: 'bg-secondary/10 border-border' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded px-3 py-2 ${bg}`}>
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
            <div className={`text-[14px] font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(opt => (
          <button key={opt} type="button" onClick={() => setFilter(opt)}
            className={`px-2.5 py-1.5 text-[9px] border rounded font-bold transition-colors whitespace-nowrap ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
            }`}>
            {opt === 'ALL' ? `ALL (${proposals.length})` : `${opt.replace(/_/g, ' ')} (${proposals.filter(p => p.status === opt).length})`}
          </button>
        ))}
      </div>

      {/* Proposal list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-[10px] text-slate-500 bg-secondary/5 border border-border/30 rounded-lg">
            {proposals.length === 0
              ? 'No proposals yet — create one in the Safe Command Test tab.'
              : `No proposals with status: ${filter}`}
          </div>
        ) : (
          filtered.map(p => (
            <ProposalRow key={p.id} proposal={p} packets={packets} onRefresh={refresh} currentUser={currentUser} />
          ))
        )}
      </div>

      {/* Audit Trail */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAudit(a => !a)}
          className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/10 hover:bg-secondary/20 transition-colors"
        >
          <ScrollText className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Audit Trail</span>
          <span className="text-[8px] text-slate-600">({auditLog.length} entries)</span>
          <span className="ml-auto text-[8px] text-slate-500">{showAudit ? '▲ hide' : '▼ show'}</span>
        </button>
        {showAudit && (
          auditLog.length === 0 ? (
            <div className="flex items-center justify-center h-10 text-[10px] text-slate-600">No audit entries yet</div>
          ) : (
            <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
              {auditLog.map((e, i) => (
                <div key={i} className="px-4 py-2 text-[8px] space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-slate-400 font-mono">{new Date(e.timestamp).toLocaleString()}</span>
                    <span className="font-bold text-primary ml-1 uppercase tracking-wide">{e.event}</span>
                  </div>
                  <div className="text-slate-500">
                    {e.proposalId && <span className="text-slate-600 font-mono mr-2">{e.proposalId}</span>}
                    {e.note}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Safety Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-slate-300">
        <Shield className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <span className="font-semibold text-foreground">Read-only governance workflow.</span>
          {' '}Execution remains DISABLED. Approvals are for preview queue only. No live commands. No mutations. No OpenClaw execution calls.
        </div>
      </div>
    </div>
  );
}