import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Play, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { RUNBOOKS, CATEGORY_COLORS } from '@/lib/runbooks';

const RISK_COLORS = {
  low:    'text-primary border-primary/30',
  medium: 'text-amber-500 border-amber-500/30',
};

export default function RunbooksPanel({ currentUser, onLoad }) {
  const [expanded, setExpanded]   = useState({});
  const [loading, setLoading]     = useState({});
  const [catFilter, setCatFilter] = useState('all');

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleLoad = async (runbook) => {
    setLoading(p => ({ ...p, [runbook.id]: true }));

    // Audit event — fire and forget
    base44.integrations.Core.InvokeLLM({
      prompt: JSON.stringify({
        eventType: 'OPENCLAW_RUNBOOK_USED',
        runbookId: runbook.id,
        runbookName: runbook.name,
        usedBy: currentUser?.email,
        timestamp: new Date().toISOString(),
      }),
      response_json_schema: { type: 'object', properties: { logged: { type: 'boolean' } } },
    }).catch(() => {});

    setLoading(p => ({ ...p, [runbook.id]: false }));
    onLoad(runbook);
  };

  const categories = ['all', ...new Set(RUNBOOKS.map(r => r.category))];
  const visible = catFilter === 'all' ? RUNBOOKS : RUNBOOKS.filter(r => r.category === catFilter);

  return (
    <div className="space-y-3 font-mono">
      {/* Header + filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground">Incident Runbooks</span>
        </div>
        <div className="ml-auto flex gap-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider transition-colors ${catFilter === c ? (CATEGORY_COLORS[c] || 'text-primary border-primary/30 bg-primary/5') : 'border-border text-muted-foreground/50 hover:text-foreground hover:border-border/80'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Runbook cards */}
      <div className="space-y-1.5">
        {visible.map(rb => (
          <div key={rb.id} className="bg-secondary/20 border border-border">
            {/* Row */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <button onClick={() => toggle(rb.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                {expanded[rb.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-foreground font-semibold">{rb.name}</div>
                <div className="text-[10px] text-muted-foreground/60 truncate">{rb.description}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${CATEGORY_COLORS[rb.category] || ''}`}>{rb.category}</span>
                <span className="text-[9px] text-muted-foreground/40">{rb.steps.length} steps</span>
                <button
                  onClick={() => handleLoad(rb)}
                  disabled={loading[rb.id]}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {loading[rb.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Load
                </button>
              </div>
            </div>

            {/* Expanded step list */}
            {expanded[rb.id] && (
              <div className="border-t border-border/40 px-3 py-2.5 space-y-1">
                {rb.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] px-2 py-1 bg-background/40 border border-border/30">
                    <span className="text-muted-foreground/30">#{i + 1}</span>
                    <code className="text-foreground">{step.capabilityId}</code>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-muted-foreground/60">{step.stepId}</span>
                    <span className={`ml-auto px-1.5 py-0.5 border text-[9px] uppercase ${RISK_COLORS[step.riskLevel] || ''}`}>{step.riskLevel}</span>
                    <span className="text-muted-foreground/40 text-[9px]">{step.entityScope}</span>
                    {step.onFailure !== 'STOP' && <span className="text-[9px] text-muted-foreground/30">{step.onFailure}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-widest pt-1">
        Runbooks load into the builder · Full approval required before execution
      </div>
    </div>
  );
}