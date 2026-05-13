import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, CheckCircle2, XCircle, Clock, Trash2, Send } from 'lucide-react';

const COMMAND_TYPES = ['READ', 'CLICK', 'TYPE', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const RISK_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED', 'EXPIRED'];

const STATUS_CONFIG = {
  DRAFT: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-400/5 border-slate-400/20' },
  PENDING_APPROVAL: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
  APPROVED: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
  DENIED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  EXPIRED: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/5 border-slate-500/20' },
};

const RISK_COLORS = {
  LOW: 'text-blue-400',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-destructive',
};

function ProposalForm({ onSubmit, onCancel, currentUser }) {
  const [formData, setFormData] = useState({
    commandTitle: '',
    commandType: 'READ',
    targetUrl: '',
    selector: '',
    inputText: '',
    reason: '',
    riskTier: 'LOW',
    requiresApproval: true,
    proposedBy: currentUser || 'Anonymous',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.commandTitle.trim() || !formData.targetUrl.trim()) {
      alert('Title and URL are required.');
      return;
    }
    onSubmit(formData);
    setFormData({
      commandTitle: '',
      commandType: 'READ',
      targetUrl: '',
      selector: '',
      inputText: '',
      reason: '',
      riskTier: 'LOW',
      requiresApproval: true,
      proposedBy: currentUser || 'Anonymous',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/50 rounded-lg bg-secondary/10 p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Command Title</label>
          <input
            type="text"
            value={formData.commandTitle}
            onChange={(e) => setFormData({ ...formData, commandTitle: e.target.value })}
            placeholder="e.g., Read page title"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Command Type</label>
          <select
            value={formData.commandType}
            onChange={(e) => setFormData({ ...formData, commandType: e.target.value })}
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground outline-none focus:border-primary/50 rounded"
          >
            {COMMAND_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Target URL</label>
          <input
            type="text"
            value={formData.targetUrl}
            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
            placeholder="https://example.com"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">CSS Selector (optional)</label>
          <input
            type="text"
            value={formData.selector}
            onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
            placeholder=".button-class"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Input Text (optional)</label>
          <input
            type="text"
            value={formData.inputText}
            onChange={(e) => setFormData({ ...formData, inputText: e.target.value })}
            placeholder="Text to type"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Risk Tier</label>
          <select
            value={formData.riskTier}
            onChange={(e) => setFormData({ ...formData, riskTier: e.target.value })}
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground outline-none focus:border-primary/50 rounded"
          >
            {RISK_TIERS.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-semibold text-foreground block mb-1">Reason for Proposal</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Explain why this command is needed..."
          rows={2}
          className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[9px] text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requiresApproval}
            onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
            className="w-3 h-3 rounded"
          />
          <span>Requires Approval</span>
        </label>
        <div className="flex-1" />
        <input
          type="text"
          value={formData.proposedBy}
          onChange={(e) => setFormData({ ...formData, proposedBy: e.target.value })}
          placeholder="Your name/email"
          className="bg-card border border-border text-[9px] px-2 py-1 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded w-40"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[9px] border border-border text-foreground hover:bg-secondary/50 transition-colors rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-[9px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Create Proposal
        </button>
      </div>
    </form>
  );
}

function ProposalRow({ proposal, index, onApprove, onDeny, onExpire, onDelete, onSubmitForApproval }) {
  const statusCfg = STATUS_CONFIG[proposal.status];
  const StatusIcon = statusCfg.icon;

  return (
    <tr className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
      <td className="px-3 py-2 text-[10px] font-semibold text-foreground">{proposal.commandTitle}</td>
      <td className="px-3 py-2 text-[9px]">
        <span className="text-slate-400">{proposal.commandType}</span>
      </td>
      <td className="px-3 py-2 text-[9px]">
        <span className={`font-semibold ${RISK_COLORS[proposal.riskTier]}`}>{proposal.riskTier}</span>
      </td>
      <td className="px-3 py-2 text-[9px]">
        {proposal.requiresApproval ? (
          <span className="text-amber-500 font-semibold">Yes</span>
        ) : (
          <span className="text-slate-400">No</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className={`inline-flex items-center gap-1 text-[8px] px-2 py-0.5 border rounded font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
          <StatusIcon className="w-2.5 h-2.5" />
          {proposal.status}
        </div>
      </td>
      <td className="px-3 py-2 text-[8px] text-foreground/60 font-mono">
        {new Date(proposal.proposedAt).toLocaleString()}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          {proposal.status === 'DRAFT' && (
            <>
              <button
                onClick={() => onSubmitForApproval(index)}
                className="px-2 py-1 text-[8px] border border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 transition-colors rounded"
              >
                <Send className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => onDelete(index)}
                className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors rounded"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </>
          )}

          {proposal.status === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={() => onApprove(index)}
                className="px-2 py-1 text-[8px] border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors rounded"
              >
                Approve
              </button>
              <button
                onClick={() => onDeny(index)}
                className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors rounded"
              >
                Deny
              </button>
            </>
          )}

          {proposal.status === 'APPROVED' && (
            <button
              onClick={() => onExpire(index)}
              className="px-2 py-1 text-[8px] border border-slate-500/30 bg-slate-500/5 text-slate-400 hover:bg-slate-500/10 transition-colors rounded"
            >
              Expire
            </button>
          )}

          {(proposal.status === 'DENIED' || proposal.status === 'EXPIRED') && (
            <button
              onClick={() => onDelete(index)}
              className="px-2 py-1 text-[8px] border border-slate-500/30 bg-slate-500/5 text-slate-400 hover:bg-slate-500/10 transition-colors rounded"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function OpenClawCommandProposalQueue() {
  const [proposals, setProposals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Load proposals from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('openclawProposalQueue');
      if (stored) {
        setProposals(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
    }
  }, []);

  // Save proposals to localStorage whenever they change
  const saveProposals = (updated) => {
    setProposals(updated);
    try {
      localStorage.setItem('openclawProposalQueue', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving proposals:', err);
    }
  };

  const handleCreateProposal = (formData) => {
    const proposal = {
      ...formData,
      id: Date.now().toString(),
      status: formData.requiresApproval ? 'PENDING_APPROVAL' : 'DRAFT',
      proposedAt: new Date().toISOString(),
    };
    saveProposals([proposal, ...proposals]);
    setShowForm(false);
  };

  const handleSubmitForApproval = (index) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], status: 'PENDING_APPROVAL' };
    saveProposals(updated);
  };

  const handleApprove = (index) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], status: 'APPROVED' };
    saveProposals(updated);
  };

  const handleDeny = (index) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], status: 'DENIED' };
    saveProposals(updated);
  };

  const handleExpire = (index) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], status: 'EXPIRED' };
    saveProposals(updated);
  };

  const handleDelete = (index) => {
    const updated = proposals.filter((_, i) => i !== index);
    saveProposals(updated);
  };

  const filteredProposals = filterStatus === 'ALL'
    ? proposals
    : proposals.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">OpenClaw Module</div>
          <div className="text-[13px] font-semibold text-foreground">Command Proposal Queue</div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-[10px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </button>
        )}
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-500/80">
          <div className="font-semibold mb-0.5">This queue stores proposed commands only.</div>
          <div className="text-[9px] text-amber-500/70">It does not call OpenClaw and does not execute browser actions. All data is stored locally.</div>
        </div>
      </div>

      {/* Proposal Form */}
      {showForm && (
        <ProposalForm
          onSubmit={handleCreateProposal}
          onCancel={() => setShowForm(false)}
          currentUser="Operator"
        />
      )}

      {/* Filter & Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {['ALL', ...STATUSES].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 text-[9px] border rounded font-semibold transition-colors ${
                filterStatus === status
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[9px] text-slate-400">
          {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''} · {proposals.length} total
        </div>
      </div>

      {/* Proposals Table */}
      {filteredProposals.length > 0 ? (
        <div className="border border-border/50 rounded-lg overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead className="border-b border-border/30 bg-secondary/10">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Title</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Risk</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Approval</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Status</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Proposed</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal, idx) => (
                <ProposalRow
                  key={proposal.id}
                  proposal={proposal}
                  index={proposals.indexOf(proposal)}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onExpire={handleExpire}
                  onDelete={handleDelete}
                  onSubmitForApproval={handleSubmitForApproval}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 px-4 bg-secondary/10 border border-border/50 rounded-lg">
          <div className="text-[10px] text-slate-400">No proposals matching filter</div>
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="text-[9px] text-primary hover:underline mt-1"
            >
              Show all proposals
            </button>
          )}
        </div>
      )}

      {/* Footer Notice */}
      <div className="text-[8px] text-foreground/60 px-4 py-3 bg-secondary/10 border border-border/30 rounded-lg">
        Proposal queue is local-only. All data stored in browser localStorage. No backend integration or OpenClaw execution wiring yet.
      </div>
    </div>
  );
}