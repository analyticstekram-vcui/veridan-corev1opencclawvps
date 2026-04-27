import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, ThumbsUp, ThumbsDown, ArrowRight, Loader2, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Shield } from 'lucide-react';
import ScopeBadge from './ScopeBadge';

const RISK_COLORS = {
  LOW:    'text-primary border-primary/30 bg-primary/5',
  MEDIUM: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  low:    'text-primary border-primary/30 bg-primary/5',
  medium: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
};

const STATUS_COLORS = {
  DRAFT:     'text-muted-foreground border-border',
  REVIEW:    'text-amber-500 border-amber-500/40 bg-amber-500/5',
  APPROVED:  'text-primary border-primary/40 bg-primary/5',
  REJECTED:  'text-destructive border-destructive/40 bg-destructive/5',
  CONVERTED: 'text-blue-400 border-blue-400/40 bg-blue-400/5',
};

// ── Convert Modal ─────────────────────────────────────────────────────────
function ConvertModal({ proposal, onConverted, onClose }) {
  const [name, setName]             = useState(proposal.prompt?.slice(0, 60) || '');
  const [description, setDescription] = useState(`AI-generated from proposal ${proposal.proposalId}`);
  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    setConverting(true);
    const res = await base44.functions.invoke('openclawProposalEngine', {
      action: 'convert', proposalId: proposal.id, name, description,
    });
    setConverting(false);
    if (res.data?.success) onConverted(res.data.workflowId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border w-full max-w-sm font-mono">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold">Convert to Workflow</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-[10px] text-muted-foreground/70 bg-secondary/30 border border-border px-3 py-2">
            This will create a new Workflow in <span className="text-amber-500">pending_approval</span> status. No execution will occur until fully approved.
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Workflow Name</label>
            <input className="w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Description</label>
            <input className="w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
          <button onClick={handleConvert} disabled={converting || !name.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50">
            {converting && <Loader2 className="w-3 h-3 animate-spin" />} Convert → Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Proposal Card ─────────────────────────────────────────────────────────
function ProposalCard({ proposal, currentUser, onRefresh, onConverted }) {
  const [expanded, setExpanded]       = useState(false);
  const [actioning, setActioning]     = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const act = async (action) => {
    setActioning(true);
    await base44.functions.invoke('openclawProposalEngine', { action, proposalId: proposal.id });
    setActioning(false);
    onRefresh();
  };

  const isReview   = proposal.status === 'REVIEW';
  const isApproved = proposal.status === 'APPROVED';

  return (
    <div className="bg-card border border-border font-mono">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border/50">
        <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-foreground leading-snug">{proposal.prompt}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${STATUS_COLORS[proposal.status] || ''}`}>
              {proposal.status}
            </span>
            {proposal.estimatedRisk && (
              <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${RISK_COLORS[proposal.estimatedRisk] || ''}`}>
                {proposal.estimatedRisk} risk
              </span>
            )}
            <span className="text-[9px] text-muted-foreground/40">{proposal.steps?.length || 0} steps</span>
            {proposal.estimatedLatency > 0 && (
              <span className="text-[9px] text-muted-foreground/40">~{proposal.estimatedLatency}ms</span>
            )}
            {proposal.requiredApprovals > 0 && (
              <span className="text-[9px] text-muted-foreground/40">requires {proposal.requiredApprovals} approval{proposal.requiredApprovals > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isReview && (
            <>
              <button onClick={() => act('approve')} disabled={actioning} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] hover:bg-primary/20 transition-colors disabled:opacity-50">
                {actioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} Approve
              </button>
              <button onClick={() => act('reject')} disabled={actioning} className="flex items-center gap-1 px-2.5 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] hover:bg-destructive/20 transition-colors disabled:opacity-50">
                <ThumbsDown className="w-3 h-3" /> Reject
              </button>
            </>
          )}
          {isApproved && (
            <button onClick={() => setShowConvert(true)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-400/10 border border-blue-400/30 text-blue-400 text-[10px] hover:bg-blue-400/20 transition-colors">
              <ArrowRight className="w-3 h-3" /> Convert
            </button>
          )}
        </div>
      </div>

      {/* Expanded: Rationale + Steps */}
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* Rationale */}
          {proposal.rationale && (
            <div className="bg-secondary/20 border border-border/50 px-3 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI Rationale
              </div>
              <div className="text-[11px] text-muted-foreground/80 leading-relaxed">{proposal.rationale}</div>
            </div>
          )}

          {/* Governance notice */}
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
            <Shield className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-[10px] text-amber-500/80">Read-only proposal · No execution until approved and converted to a Workflow</span>
          </div>

          {/* Step List */}
          <div className="space-y-1.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Proposed Steps</div>
            {(proposal.steps || []).map((step, i) => (
              <div key={i} className="border border-border/50 bg-secondary/10 px-3 py-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[9px] text-muted-foreground/30">#{i + 1}</span>
                  <code className="text-[11px] text-foreground">{step.capabilityId}</code>
                  <span className="text-[9px] text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground/60">{step.stepId}</span>
                  <span className={`ml-auto px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${RISK_COLORS[step.riskLevel] || ''}`}>{step.riskLevel}</span>
                  <ScopeBadge entityScope={step.entityScope} commandText={step.capabilityId} />
                </div>
                {step.params && Object.keys(step.params).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                    {Object.entries(step.params).map(([k, v]) => (
                      <span key={k} className="text-[9px] text-muted-foreground/50">{k}: <span className="text-muted-foreground/70">{String(v)}</span></span>
                    ))}
                  </div>
                )}
                {step.dependsOn?.length > 0 && (
                  <div className="mt-1 text-[9px] text-muted-foreground/40">depends on: {step.dependsOn.join(', ')}</div>
                )}
                <div className="mt-1 text-[9px] text-muted-foreground/30">onFailure: {step.onFailure} · timeout: {step.timeoutMs}ms</div>
              </div>
            ))}
          </div>

          {/* Audit */}
          {proposal.auditLog?.length > 0 && (
            <div className="pt-2 border-t border-border/40 space-y-0.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1">Audit Log</div>
              {proposal.auditLog.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px] text-muted-foreground/50">
                  <span className="text-muted-foreground/30">{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</span>
                  <span className="text-foreground/60">{e.eventType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showConvert && (
        <ConvertModal
          proposal={proposal}
          onConverted={(wfId) => { setShowConvert(false); onConverted(wfId); onRefresh(); }}
          onClose={() => setShowConvert(false)}
        />
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────
export default function ProposalsPanel({ currentUser, onWorkflowCreated }) {
  const [proposals, setProposals]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [prompt, setPrompt]         = useState('');
  const [context, setContext]       = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState(null);   // { message, blocked, classification }

  const [statusFilter, setStatusFilter] = useState('all');

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.OpenClawProposal.list('-created_date', 100);
    setProposals(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError(null);
    const contextObj = context.trim() ? { note: context.trim() } : {};
    const res = await base44.functions.invoke('openclawProposalEngine', {
      action: 'propose', prompt: prompt.trim(), context: contextObj,
    });
    setGenerating(false);
    const data = res.data || {};
    if (data.success) {
      setPrompt('');
      setContext('');
      fetchProposals();
    } else if (data.blocked) {
      // Blocked — do NOT create proposal, show red banner
      setGenError({ message: data.error, blocked: true, classification: data.classification, reason: data.reason });
    } else {
      setGenError({ message: data.error || data.details?.join('; ') || 'Generation failed', blocked: false });
    }
  };

  const visible = proposals.filter(p => statusFilter === 'all' || p.status === statusFilter);
  const counts = { REVIEW: proposals.filter(p => p.status === 'REVIEW').length };

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Input Panel */}
      <div className="shrink-0 border-b border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground">AI Workflow Proposal</span>
          <span className="ml-2 text-[9px] uppercase tracking-widest text-amber-500/70 border border-amber-500/30 px-1.5 py-0.5">read-only · governance-gated</span>
        </div>
        <div className="flex gap-2">
          <textarea
            className="flex-1 px-2.5 py-2 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors resize-none h-16"
            placeholder='Describe what you want done, e.g. "Check system status then fetch recent error logs"'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors disabled:opacity-50 self-end"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {generating ? 'Generating…' : 'Propose'}
          </button>
        </div>
        <input
          className="w-full px-2.5 py-1.5 bg-secondary/30 border border-border/60 text-[10px] font-mono text-muted-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors"
          placeholder="Optional context (e.g. entityScope: gfm_admin, timeframe: last 1h)"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
        {genError && (
          <div className={`flex items-start gap-2 text-[11px] px-3 py-2.5 border ${genError.blocked ? 'bg-destructive/10 border-destructive/40 text-destructive' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{genError.message}</div>
              {genError.blocked && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {genError.classification && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-destructive/40 bg-destructive/10">
                      {genError.classification}
                    </span>
                  )}
                  {genError.reason && <span className="text-[10px] text-destructive/70">{genError.reason}</span>}
                  <span className="text-[9px] text-destructive/50 ml-auto">OPENCLAW_AI_PROPOSAL_BLOCKED_UNSAFE</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-border bg-card/60 flex items-center px-4 py-1.5 gap-2">
        <select className="px-2 py-1 bg-secondary/50 border border-border text-[10px] font-mono text-muted-foreground outline-none focus:border-primary/50"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'CONVERTED'].map(s => (
            <option key={s} value={s}>{s}{s === 'REVIEW' && counts.REVIEW > 0 ? ` (${counts.REVIEW})` : ''}</option>
          ))}
        </select>
        <button onClick={fetchProposals} className="ml-auto p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Proposal List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <Sparkles className="w-6 h-6 text-muted-foreground/20" />
            <div className="text-[11px] text-muted-foreground/40">Describe a goal above to generate an AI-proposed workflow.</div>
          </div>
        ) : (
          visible.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              currentUser={currentUser}
              onRefresh={fetchProposals}
              onConverted={onWorkflowCreated}
            />
          ))
        )}
      </div>
    </div>
  );
}