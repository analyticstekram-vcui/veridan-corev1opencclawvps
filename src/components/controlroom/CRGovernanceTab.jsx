import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, XCircle, AlertCircle, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

export default function CRGovernanceTab() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [killActive, setKillActive] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('openclawProposalManagement', { action: 'list_by_status', status: 'PENDING_APPROVAL', limit: 20 });
      setProposals(res.data?.proposals || []);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <h2 className="text-[13px] font-semibold text-foreground">Governance Queue</h2>
        <button onClick={fetchPending} disabled={loading} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-slate-400 hover:bg-secondary/50 transition-colors rounded disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Kill Switch */}
      <div className={`border rounded-lg p-4 ${killActive ? 'bg-destructive/10 border-destructive/40' : 'bg-secondary/10 border-border'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${killActive ? 'text-destructive' : 'text-slate-400'}`} />
            <div>
              <div className={`text-[11px] font-bold ${killActive ? 'text-destructive' : 'text-slate-300'}`}>Emergency Kill Switch</div>
              <div className="text-[9px] text-slate-400">{killActive ? 'ALL actions blocked. No commands can proceed.' : 'All systems nominal — kill switch inactive.'}</div>
            </div>
          </div>
          <button
            onClick={() => setKillActive(v => !v)}
            className={`px-4 py-2 text-[10px] font-bold border rounded transition-colors ${
              killActive
                ? 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/80'
                : 'border-destructive/40 text-destructive hover:bg-destructive/10'
            }`}
          >
            {killActive ? '🔴 KILL ACTIVE — Reset' : 'Activate Kill Switch'}
          </button>
        </div>
      </div>

      {/* Approval Requirements */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approval Requirements</div>
        <div className="divide-y divide-border/30">
          {[
            { label: 'READ / INSPECT commands',     req: 'OPERATOR review',   tier: 'LOW' },
            { label: 'NAVIGATE commands',            req: 'ADMIN approval',    tier: 'MEDIUM' },
            { label: 'SNAPSHOT / EXPORT',            req: 'OPERATOR review',   tier: 'LOW' },
            { label: 'Any execution command',        req: 'BLOCKED globally',  tier: 'HIGH' },
            { label: 'Browser mutations',            req: 'BLOCKED globally',  tier: 'HIGH' },
            { label: 'API / Trading calls',          req: 'DISABLED',          tier: 'HIGH' },
          ].map(({ label, req, tier }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 text-[9px]">
              <span className="text-slate-300">{label}</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold px-1.5 py-0.5 border rounded text-[8px] ${
                  tier === 'HIGH' ? 'text-destructive bg-destructive/10 border-destructive/30' :
                  tier === 'MEDIUM' ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' :
                  'text-primary bg-primary/10 border-primary/30'
                }`}>{tier}</span>
                <span className="text-slate-400">{req}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Queue */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Actions</span>
          <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded font-bold">{proposals.length} pending</span>
        </div>
        {proposals.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-slate-400">No pending actions</div>
        ) : (
          <div className="divide-y divide-border/30">
            {proposals.map(p => (
              <div key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-[9px]">
                <div>
                  <span className="text-amber-500 font-bold">{p.commandType || 'READ'}</span>
                  <span className="text-slate-400 ml-2">{p.target || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-500 font-semibold">AWAITING REVIEW</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked Action List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Permanently Blocked Actions</div>
        <div className="divide-y divide-border/30">
          {[
            'Live browser mutations (click, type, submit)',
            'Broker API order placement',
            'Bank account transfers',
            'Credential / API key entry',
            'Money movement of any kind',
            'Live trading execution',
          ].map(action => (
            <div key={action} className="px-4 py-2.5 flex items-center gap-2 text-[9px]">
              <XCircle className="w-3 h-3 text-destructive shrink-0" />
              <span className="text-destructive/80">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}