/**
 * OpenClawOperatorGuideCard
 * Plain-English guide explaining the OpenClaw Evidence Archive screen.
 * Static read-only component — no logic, no state, no networking.
 */
import React from 'react';
import { BookOpen, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function OpenClawOperatorGuideCard() {
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <div className="text-[12px] font-bold text-foreground">OpenClaw Evidence Archive Guide</div>
          <div className="text-[8px] text-slate-500">Plain English overview of this screen and what to do next</div>
        </div>
      </div>

      {/* ── 1. What This Screen Is ── */}
      <div className="border border-border/60 rounded-lg px-4 py-3 bg-card/50 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">What This Screen Is</div>
        <div className="text-[9px] text-slate-300 leading-relaxed">
          This screen is the local safety and dry-run preparation area for OpenClaw inside Veridan Core. It is read-only,
          local-only, and never executes commands. You use it to design, review, and package safe OpenClaw dry-run scenarios
          before any future execution authorization.
        </div>
      </div>

      {/* ── 2. What The System Can Do Right Now ── */}
      <div className="border border-primary/30 rounded-lg px-4 py-3 bg-primary/5 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">What The System Can Do Right Now</div>
        <div className="space-y-1">
          {[
            'Create or load command proposals',
            'Review proposals and approve/deny decisions',
            'Export local evidence and audit trails',
            'Lock read-only governance baseline',
            'Prepare dry-run planning records',
            'Design and validate dry-run contracts',
            'Build and validate dry-run action drafts',
            'Generate and validate local simulation previews',
            'Package local dry-run result records',
          ].map(item => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-[8px] text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. What The System Cannot Do Yet ── */}
      <div className="border border-destructive/30 rounded-lg px-4 py-3 bg-destructive/5 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-destructive">What The System Cannot Do Yet</div>
        <div className="space-y-1">
          {[
            'It cannot execute OpenClaw commands',
            'It cannot call APIs or external services',
            'It cannot use browser automation',
            'It cannot trade or place orders',
            'It cannot access credentials or secrets',
            'It cannot move money',
            'It cannot run scheduled jobs',
            'It cannot operate without operator review',
          ].map(item => (
            <div key={item} className="flex items-start gap-2">
              <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <span className="text-[8px] text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Operator Rule ── */}
      <div className="border-2 border-amber-500/40 rounded-lg px-4 py-3 bg-amber-500/5 space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Operator Rule</div>
        </div>
        <div className="text-[9px] text-amber-200/90 font-semibold leading-relaxed">
          If the dashboard says <span className="font-mono text-amber-300">HOLD</span>, stop and fix the missing or unsafe step.
          If it says <span className="font-mono text-primary">SAFE_LOCAL_ONLY</span>, continue only with the next allowed local action.
        </div>
      </div>

      {/* ── 5. Next Build Boundary ── */}
      <div className="border border-slate-700/40 rounded-lg px-4 py-3 bg-slate-700/5 space-y-2">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Next Build Boundary</div>
        </div>
        <div className="text-[8px] text-slate-400 leading-relaxed">
          Next work should improve usability and operator clarity — add checklists, runbooks, and step-by-step guidance.
          <span className="block mt-1.5 font-semibold text-slate-300">Do not add live execution until a separate execution authorization gate exists.</span>
        </div>
      </div>

      {/* ── Safety footer ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded text-[7px] text-primary/70">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        STATIC COMPONENT · No localStorage · No fetch · No SDK · No execution · No network · No timers
      </div>
    </div>
  );
}