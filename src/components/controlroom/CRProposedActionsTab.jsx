import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Shield } from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT:            { icon: Clock,        color: 'text-slate-400',  bg: 'bg-secondary/20 border-border' },
  PENDING_APPROVAL: { icon: AlertCircle,  color: 'text-amber-500',  bg: 'bg-amber-500/5 border-amber-500/20' },
  APPROVED:         { icon: CheckCircle2, color: 'text-primary',    bg: 'bg-primary/5 border-primary/20' },
  DENIED:           { icon: XCircle,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  BLOCKED:          { icon: Shield,       color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
};

const RISK_COLORS = {
  LOW:    'text-primary bg-primary/10 border-primary/20',
  MEDIUM: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  HIGH:   'text-destructive bg-destructive/10 border-destructive/20',
};

function normalizeProposal(r) {
  return {
    id: r.id,
    commandType: r.commandType || 'READ',
    target: r.target || '—',
    url: r.url || '',
    riskTier: r.riskTier || 'LOW',
    status: r.status || 'DRAFT',
    proposedBy: r.proposedBy || r.created_by || 'system',
    reason: r.reviewNote || r.notes || '—',
    createdAt: r.createdAt || r.created_date || null,
  };
}

export default function CRProposedActionsTab() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('openclawProposalManagement', { action: 'list', limit: 30 });
      setProposals((res.data?.proposals || []).map(normalizeProposal));
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus, note) => {
    await base44.functions.invoke('openclawProposalManagement', {
      action: 'update_status',
      proposalId: id,
      newStatus,
      reviewNote: note,
    });
    fetchProposals();
  };

  useEffect(() => { fetchProposals(); }, []);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Proposed Actions</h2>
        <button onClick={fetchProposals} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-slate-400 hover:bg-secondary/50 transition-colors rounded disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex items-start gap-3 px-4 py-2.5 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive/80">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Approve/Deny is governance-only. Approval does not trigger execution. Live mode is globally disabled.
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-10 text-[10px] text-slate-400 bg-card border border-border rounded-lg">No proposals found</div>
      ) : (
        <div className="space-y-2">
          {proposals.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.DRAFT;
            const Icon = cfg.icon;
            return (
              <div key={p.id} className={`border rounded-lg p-4 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
                    <div>
                      <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{p.commandType}</span>
                      <span className="text-[9px] text-slate-400 ml-2">{p.target}</span>
                      {p.url && <div className="text-[8px] text-blue-400 font-mono mt-0.5 truncate">{p.url}</div>}
                      <div className="text-[8px] text-slate-400 mt-0.5">By: {p.proposedBy}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[8px] px-1.5 py-0.5 border rounded font-bold ${RISK_COLORS[p.riskTier] || RISK_COLORS.LOW}`}>{p.riskTier}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 border rounded font-bold ${cfg.color} ${cfg.bg}`}>{p.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                {p.status === 'PENDING_APPROVAL' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateStatus(p.id, 'APPROVED', 'Approved from Control Room (governance only)')}
                      className="px-2.5 py-1 text-[8px] border border-primary/30 text-primary hover:bg-primary/10 rounded font-semibold"
                    >Approve (No Execute)</button>
                    <button
                      onClick={() => updateStatus(p.id, 'DENIED', 'Denied from Control Room')}
                      className="px-2.5 py-1 text-[8px] border border-destructive/30 text-destructive hover:bg-destructive/10 rounded font-semibold"
                    >Deny</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}