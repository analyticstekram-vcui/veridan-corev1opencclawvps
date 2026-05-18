/**
 * SystemBriefPanel — Planning-only system brief placeholder.
 * No AI runtime calls. No external API mutation. localStorage-only future expansion.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SystemBriefPanel() {
  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div>
        <div className="text-[11px] font-bold uppercase text-primary">System Brief</div>
        <div className="text-[8px] text-slate-500 mt-0.5">Planning-only brief collection · No AI runtime calls</div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No AI runtime calls, Codex execution, OpenClaw dispatch, or external API mutation.</div>
          <div className="text-[8px] text-destructive/70">No AI runtime · No Codex execution · No OpenClaw dispatch · No external API mutation · No credential storage</div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-card border border-border/50 rounded-sm p-6">
        <div className="text-center py-8 text-slate-500">
          <div className="text-[9px] font-bold uppercase mb-2">System Brief Panel</div>
          <div className="text-[8px] text-slate-500 max-w-md mx-auto leading-relaxed">
            This panel is a planning-only placeholder for organizing system briefs and operational context.
            Future expansion: localStorage-only brief collection and export (no AI runtime integration).
          </div>
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {[
            'System brief planning only',
            'No AI runtime calls',
            'No Codex execution',
            'No OpenClaw dispatch',
            'No external API mutation',
            'No credential handling',
            'No backend mutation',
            'Browser-only localStorage',
          ].map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>

    </div>
  );
}