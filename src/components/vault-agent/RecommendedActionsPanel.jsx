import React from 'react';
import { ArrowRight, ListChecks } from 'lucide-react';

export default function RecommendedActionsPanel({ actions }) {
  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <ListChecks className="w-3.5 h-3.5 text-accent" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Recommended Operator Actions</span>
        <span className="text-[7px] font-mono text-slate-500 ml-1">— aggregated from all Phase 2 reports</span>
        <span className="ml-auto px-1.5 py-0.5 text-[6px] font-bold uppercase border border-slate-600/30 text-slate-500 rounded-sm">READ_ONLY</span>
      </div>
      <div className="divide-y divide-border/15">
        {actions.map((action, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="text-[7px] font-mono font-bold text-slate-600 shrink-0 w-4">{i + 1}.</span>
            <ArrowRight className="w-3 h-3 text-accent shrink-0" />
            <span className="text-[8px] font-mono text-slate-300">{action}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-border/20 text-[7px] font-mono text-slate-600">
        These are read-only recommendations from the Vault Agent report layer. No actions are executed automatically.
      </div>
    </div>
  );
}