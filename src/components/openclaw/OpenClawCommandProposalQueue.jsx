import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function OpenClawCommandProposalQueue() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    commandType: 'READ',
    target: 'gateway',
    url: '',
    riskTier: 'LOW',
  });

  const fetchProposals = async (status = null) => {
    setLoading(true);
    try {
      const action = status ? 'list_by_status' : 'list';
      const response = await base44.functions.invoke('openclawProposalManagement', {
        action,
        status,
        limit: 50,
      });
      setProposals(response.data?.proposals || []);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals(filter === 'all' ? null : filter);
  }, [filter]);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      await base44.functions.invoke('openclawProposalManagement', {
        action: 'create',
        data: formData,
      });
      setShowForm(false);
      setFormData({ commandType: 'READ', target: 'gateway', url: '', riskTier: 'LOW' });
      fetchProposals(filter === 'all' ? null : filter);
    } catch (err) {
      alert(`Failed to create proposal: ${err.message}`);
    }
  };

  const handleApproveProposal = async (proposalId) => {
    try {
      await base44.functions.invoke('openclawProposalManagement', {
        action: 'update_status',
        proposalId,
        newStatus: 'APPROVED',
        reviewNote: 'Approved from queue. Approval does not execute.',
      });
      fetchProposals(filter === 'all' ? null : filter);
    } catch (err) {
      alert(`Failed to approve: ${err.message}`);
    }
  };

  const handleDenyProposal = async (proposalId) => {
    const reason = prompt('Denial reason (optional):');
    try {
      await base44.functions.invoke('openclawProposalManagement', {
        action: 'update_status',
        proposalId,
        newStatus: 'DENIED',
        reviewNote: reason || 'Denied from queue',
      });
      fetchProposals(filter === 'all' ? null : filter);
    } catch (err) {
      alert(`Failed to deny: ${err.message}`);
    }
  };

  const statusConfig = {
    DRAFT: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/5 border-slate-500/20' },
    PENDING_APPROVAL: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
    APPROVED: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
    DENIED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
    EXPIRED: { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/5 border-slate-500/20' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Proposal Queue</div>
          <div className="text-[13px] font-semibold text-foreground">Read-Only Command Proposals</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchProposals(filter === 'all' ? null : filter)}
            disabled={loading}
            className="px-3 py-1.5 text-[10px] border border-border text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 font-semibold rounded flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            New Proposal
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <form onSubmit={handleCreateProposal} className="space-y-3">
            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">Command Type</label>
              <select
                value={formData.commandType}
                onChange={(e) => setFormData({ ...formData, commandType: e.target.value })}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
              >
                <option value="READ">READ</option>
                <option value="VERIFY">VERIFY</option>
                <option value="NAVIGATE_READ_ONLY">NAVIGATE_READ_ONLY</option>
                <option value="SNAPSHOT">SNAPSHOT</option>
                <option value="EXPORT_LOG">EXPORT_LOG</option>
                <option value="PROPOSE_WORKFLOW">PROPOSE_WORKFLOW</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">Target</label>
              <input
                type="text"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                placeholder="gateway, browser, audit-log, etc"
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">URL (optional)</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">Risk Tier</label>
              <select
                value={formData.riskTier}
                onChange={(e) => setFormData({ ...formData, riskTier: e.target.value })}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-[10px] border border-border text-foreground hover:bg-secondary/50 transition-colors font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded"
              >
                Create Proposal
              </button>
            </div>
          </form>

          <div className="text-[8px] text-primary/70 border-t border-border/30 pt-2">
            New proposals start in DRAFT status. They cannot execute. Approval does not execute.
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED'].map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-[10px] border font-semibold rounded transition-colors ${
              filter === status
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border text-foreground hover:bg-secondary/50'
            }`}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-2">
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-[10px] text-muted-foreground">
            No proposals found
          </div>
        ) : (
          proposals.map(proposal => {
            const cfg = statusConfig[proposal.status] || statusConfig.DRAFT;
            const StatusIcon = cfg.icon;
            return (
              <div key={proposal.id} className={`border rounded-lg p-3 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold ${cfg.color} uppercase tracking-wider`}>
                        {proposal.commandType}
                      </div>
                      <div className="text-[9px] text-foreground mt-0.5">{proposal.target}</div>
                      {proposal.url && (
                        <div className="text-[8px] text-blue-400 font-mono mt-0.5 truncate">{proposal.url}</div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 border rounded font-semibold whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
                    {proposal.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-[8px] text-muted-foreground mb-2">
                  <div>Created: {new Date(proposal.createdAt).toLocaleString()}</div>
                  {proposal.proposedBy && <div>By: {proposal.proposedBy}</div>}
                </div>

                {/* Action Buttons */}
                {proposal.status === 'DRAFT' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const response = prompt('Move to PENDING_APPROVAL? (yes/no)');
                        if (response?.toLowerCase() === 'yes') {
                          base44.functions.invoke('openclawProposalManagement', {
                            action: 'update_status',
                            proposalId: proposal.id,
                            newStatus: 'PENDING_APPROVAL',
                            reviewNote: 'Moved to PENDING_APPROVAL',
                          }).then(() => fetchProposals(filter === 'all' ? null : filter));
                        }
                      }}
                      className="px-2 py-1 text-[8px] border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors rounded font-semibold"
                    >
                      Submit for Review
                    </button>
                  </div>
                )}

                {proposal.status === 'PENDING_APPROVAL' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveProposal(proposal.id)}
                      className="px-2 py-1 text-[8px] border border-primary/30 text-primary hover:bg-primary/10 transition-colors rounded font-semibold"
                    >
                      Approve (No Execute)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDenyProposal(proposal.id)}
                      className="px-2 py-1 text-[8px] border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors rounded font-semibold"
                    >
                      Deny
                    </button>
                  </div>
                )}

                {proposal.reviewNote && (
                  <div className="text-[8px] text-slate-400 border-t border-border/30 mt-2 pt-2">
                    Review: {proposal.reviewNote}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-0.5">⚠️ APPROVAL DOES NOT EXECUTE</div>
          <div className="text-[9px] text-destructive/70">Approved proposals remain non-executable. Execution can only be enabled in a future phase after explicit governance authorization.</div>
        </div>
      </div>
    </div>
  );
}