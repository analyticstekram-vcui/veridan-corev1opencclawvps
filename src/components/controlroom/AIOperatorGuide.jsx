import React from 'react';
import { Cpu, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AIOperatorGuide() {
  return (
    <div className="bg-card border border-amber-500/20 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-500" />
          <h2 className="text-[11px] font-mono font-bold uppercase text-amber-500">AI Operator Guide</h2>
        </div>
        <p className="text-[9px] font-mono text-slate-400 mt-1">Essential workflow for AI operator interactions with this console.</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Start Here Section */}
        <div className="space-y-2">
          <div className="text-[9px] font-mono font-semibold uppercase text-slate-300 mb-2">Workflow Steps</div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="text-[9px] font-mono text-foreground"><span className="font-bold">1. Start Here:</span> Control Room</div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="text-[9px] font-mono text-foreground"><span className="font-bold">2. Check Safety:</span> Master Baseline Index</div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="text-[9px] font-mono text-foreground"><span className="font-bold">3. Check Gateway:</span> Gateway Health tab</div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="text-[9px] font-mono text-foreground"><span className="font-bold">4. Create Drafts:</span> Controlled Local Drafts</div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="text-[9px] font-mono text-foreground"><span className="font-bold">5. Review Evidence:</span> Evidence Archive</div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="text-[9px] font-mono text-foreground"><span className="font-bold">6. Export Proof:</span> Master System Snapshot Export</div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Allowed Actions Section */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          <div className="text-[9px] font-mono font-semibold uppercase text-primary mb-2">Allowed AI Actions</div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-1.5 px-2 bg-primary/5 border border-primary/20 rounded-sm">
              <span>✓ Read status</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-1.5 px-2 bg-primary/5 border border-primary/20 rounded-sm">
              <span>✓ Review baselines</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-1.5 px-2 bg-primary/5 border border-primary/20 rounded-sm">
              <span>✓ Create local drafts</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-1.5 px-2 bg-primary/5 border border-primary/20 rounded-sm">
              <span>✓ Update draft status</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-1.5 px-2 bg-primary/5 border border-primary/20 rounded-sm">
              <span>✓ Export local JSON proof</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-1.5 px-2 bg-primary/5 border border-primary/20 rounded-sm">
              <span>✓ Recommend next action</span>
            </div>
          </div>
        </div>

        {/* Restricted Actions Section */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          <div className="text-[9px] font-mono font-semibold uppercase text-destructive mb-2">Restricted Actions</div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex items-center gap-2 text-[8px] font-mono text-destructive/70 py-1.5 px-2 bg-destructive/5 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>✗ Live operations</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-destructive/70 py-1.5 px-2 bg-destructive/5 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>✗ External connections</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-destructive/70 py-1.5 px-2 bg-destructive/5 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>✗ Financial actions</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-destructive/70 py-1.5 px-2 bg-destructive/5 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>✗ Credential storage</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-destructive/70 py-1.5 px-2 bg-destructive/5 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>✗ Private documents</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-destructive/70 py-1.5 px-2 bg-destructive/5 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>✗ Automatic submissions</span>
            </div>
          </div>
        </div>

        {/* Safety Chips Section */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          <div className="text-[9px] font-mono font-semibold uppercase text-slate-400 mb-2">Safety Profile</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-1 text-[7px] font-mono font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-sm">AI_OPERATOR_ONLY</span>
            <span className="px-2 py-1 text-[7px] font-mono font-bold uppercase bg-secondary/30 text-slate-300 border border-border/40 rounded-sm">HUMAN_REVIEW_REQUIRED</span>
            <span className="px-2 py-1 text-[7px] font-mono font-bold uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded-sm">EXECUTION_DISABLED</span>
            <span className="px-2 py-1 text-[7px] font-mono font-bold uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded-sm">EXTERNAL_DISABLED</span>
          </div>
        </div>
      </div>
    </div>
  );
}