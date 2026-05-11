import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Trash2, AlertTriangle } from 'lucide-react';
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

export function clearProposals() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

function AuditRow({ proposal, index }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = proposal.status === 'DRAFT' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-secondary/30 border-border text-muted-foreground';
  const riskColor = proposal.riskTier === 'LOW' ? 'text-primary' : proposal.riskTier === 'MEDIUM' ? 'text-amber-500' : 'text-destructive';

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
        <div className="bg-secondary/10 border-t border-border/20 px-4 py-3 space-y-2.5">
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
            <AuditRow key={idx} proposal={proposal} index={idx} />
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