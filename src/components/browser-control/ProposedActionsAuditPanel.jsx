import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const STORAGE_KEY = 'veridan_browser_action_proposals_v1';
const MAX_PROPOSALS = 100;

export function loadProposals() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveProposal(proposal) {
  try {
    let proposals = loadProposals();
    proposals.push({
      ...proposal,
      timestamp: new Date().toISOString(),
    });
    // Cap at 100 entries
    if (proposals.length > MAX_PROPOSALS) {
      proposals = proposals.slice(-MAX_PROPOSALS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
    return proposal;
  } catch (err) {
    console.error('Failed to save proposal:', err);
    return null;
  }
}

export function updateProposal(index, updatedProposal) {
  try {
    let proposals = loadProposals();
    if (index >= 0 && index < proposals.length) {
      proposals[index] = updatedProposal;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
      return updatedProposal;
    }
    return null;
  } catch (err) {
    console.error('Failed to update proposal:', err);
    return null;
  }
}

export function clearProposals() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

function AuditRow({ proposal, index, onUpdateProposal }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewNote, setReviewNote] = useState(proposal.reviewNote || '');

  // Status color mapping
  const statusColors = {
    DRAFT: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    PENDING_APPROVAL: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    APPROVED: 'bg-primary/10 border-primary/30 text-primary',
    DENIED: 'bg-destructive/10 border-destructive/30 text-destructive',
    REVOKED: 'bg-muted/30 border-border text-muted-foreground/60',
  };

  const statusColor = statusColors[proposal.status] || 'bg-secondary/30 border-border text-muted-foreground';
  const riskColor = proposal.riskTier === 'LOW' ? 'text-primary' : proposal.riskTier === 'MEDIUM' ? 'text-amber-500' : 'text-destructive';

  // Valid state transitions
  const validTransitions = {
    DRAFT: ['PENDING_APPROVAL'],
    PENDING_APPROVAL: ['APPROVED', 'DENIED'],
    APPROVED: ['REVOKED'],
    DENIED: ['DRAFT'],
    REVOKED: [],
  };

  const handleStatusChange = (newStatus) => {
    const updated = {
      ...proposal,
      status: newStatus,
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Veridan Operator',
      reviewNote: reviewNote,
      executionAllowed: false,
    };
    onUpdateProposal(index, updated);
  };

  return (
    <div key={index} className="border-b border-border/20 last:border-0">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-3 py-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="grid grid-cols-[20px_60px_1fr_70px_60px_auto] gap-2 items-center text-[10px] font-mono">
          <div className="text-muted-foreground/30">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
          <div className="text-muted-foreground/60">
            {format(new Date(proposal.timestamp), 'HH:mm:ss')}
          </div>
          <div className="text-foreground truncate">{proposal.commandType}</div>
          <div className={`text-[9px] px-1.5 py-0.5 border rounded-sm ${riskColor}`}>
            {proposal.riskTier}
          </div>
          <div className={`text-[9px] px-1.5 py-0.5 border rounded-sm font-semibold ${statusColor}`}>
            {proposal.status}
          </div>
          <div className="text-muted-foreground/40">
            {(proposal.elementText || '—').slice(0, 30)}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-secondary/10 border-t border-border/20 px-4 py-3 space-y-3">
          {/* Approval warning for APPROVED proposals */}
          {proposal.status === 'APPROVED' && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-[9px] text-amber-500/80 uppercase tracking-wider">
                Approved for governance review only. Backend execution is not enabled yet.
              </span>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Selector</div>
              <div className="text-foreground font-mono break-all text-[9px]">{proposal.selector || '—'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Tag</div>
              <div className="text-foreground font-mono text-[9px]">{proposal.tag || '—'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Href</div>
              <div className="text-blue-400 font-mono break-all text-[9px]">{proposal.href || '—'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Governance Mode</div>
              <div className="text-foreground font-mono text-[9px]">{proposal.governanceMode || '—'}</div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Target URL</div>
              <div className="text-blue-400 font-mono break-all text-[9px]">{proposal.targetUrl || '—'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Requires Approval</div>
              <div className="text-foreground text-[9px]">{String(proposal.requiresApproval)}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Execution Allowed</div>
              <div className={`text-[9px] font-semibold ${proposal.executionAllowed ? 'text-primary' : 'text-destructive'}`}>
                {String(proposal.executionAllowed)}
              </div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Proposal ID</div>
              <div className="text-muted-foreground/60 font-mono text-[9px] break-all">{proposal.proposalId}</div>
            </div>
            {proposal.reviewedAt && (
              <div className="bg-secondary/30 border border-border px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Reviewed At</div>
                <div className="text-muted-foreground/60 font-mono text-[9px]">{format(new Date(proposal.reviewedAt), 'HH:mm:ss')}</div>
              </div>
            )}
            {proposal.reviewedBy && (
              <div className="bg-secondary/30 border border-border px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Reviewed By</div>
                <div className="text-muted-foreground/60 text-[9px]">{proposal.reviewedBy}</div>
              </div>
            )}
          </div>

          {/* Review note input */}
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40">Review Note</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add a review note..."
              className="w-full bg-secondary/30 border border-border px-2 py-1.5 text-[9px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors resize-none h-16"
            />
          </div>

          {/* State action buttons */}
          <div className="flex flex-wrap gap-1.5">
            {proposal.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('PENDING_APPROVAL')}
                className="px-2.5 py-1 border border-blue-500/30 bg-blue-500/10 text-[9px] text-blue-400 uppercase tracking-wider hover:bg-blue-500/20 transition-colors font-semibold"
              >
                Submit for Approval
              </button>
            )}
            {proposal.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  className="px-2.5 py-1 border border-primary/30 bg-primary/10 text-[9px] text-primary uppercase tracking-wider hover:bg-primary/20 transition-colors font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange('DENIED')}
                  className="px-2.5 py-1 border border-destructive/30 bg-destructive/10 text-[9px] text-destructive uppercase tracking-wider hover:bg-destructive/20 transition-colors font-semibold"
                >
                  Deny
                </button>
              </>
            )}
            {proposal.status === 'APPROVED' && (
              <button
                onClick={() => handleStatusChange('REVOKED')}
                className="px-2.5 py-1 border border-muted/30 bg-muted/10 text-[9px] text-muted-foreground uppercase tracking-wider hover:bg-muted/20 transition-colors font-semibold"
              >
                Revoke Approval
              </button>
            )}
            {proposal.status === 'DENIED' && (
              <button
                onClick={() => handleStatusChange('DRAFT')}
                className="px-2.5 py-1 border border-amber-500/30 bg-amber-500/10 text-[9px] text-amber-500 uppercase tracking-wider hover:bg-amber-500/20 transition-colors font-semibold"
              >
                Return to Draft
              </button>
            )}
          </div>

          {/* Raw JSON */}
          <details className="text-[9px]">
            <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-widest text-[8px]">
              Full Proposal JSON
            </summary>
            <pre className="mt-1 bg-secondary/30 border border-border/30 px-2 py-1 overflow-auto max-h-40 text-muted-foreground/60 font-mono text-[8px] leading-tight">
              {JSON.stringify(proposal, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function ProposedActionsAuditPanel() {
  const [proposals, setProposals] = useState(() => loadProposals());

  const handleClear = () => {
    if (confirm('Clear all saved proposals? This cannot be undone.')) {
      clearProposals();
      setProposals([]);
    }
  };

  const handleRefresh = () => {
    setProposals(loadProposals());
  };

  const handleUpdateProposal = (index, updatedProposal) => {
    updateProposal(index, updatedProposal);
    setProposals(loadProposals());
  };

  if (proposals.length === 0) return null;

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Proposed Actions Audit</span>
          <span className="text-[9px] text-muted-foreground/30 ml-1">{proposals.length} saved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="px-2 py-1 border border-border text-[9px] text-muted-foreground/60 hover:text-muted-foreground uppercase tracking-wider transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 border border-destructive/20 bg-destructive/5 text-[9px] text-destructive hover:bg-destructive/10 uppercase tracking-wider transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Proposals list */}
      <div className="max-h-96 overflow-auto">
        {proposals.length > 0 ? (
          proposals.map((proposal, idx) => (
            <AuditRow key={idx} proposal={proposal} index={idx} onUpdateProposal={handleUpdateProposal} />
          ))
        ) : (
          <div className="px-4 py-2 text-[10px] text-muted-foreground/40 font-mono">No proposals saved.</div>
        )}
      </div>

      {/* Footer info */}
      {proposals.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/30 bg-secondary/10 text-[9px] text-muted-foreground/40">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Proposals are stored locally. Max {MAX_PROPOSALS} entries.</span>
        </div>
      )}
    </div>
  );
}