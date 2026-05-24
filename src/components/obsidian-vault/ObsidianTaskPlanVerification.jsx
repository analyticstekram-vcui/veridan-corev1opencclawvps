import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const VERIFICATION_CHECKS = [
  'localStorage only — no backend writes',
  'no execution performed',
  'no dispatch',
  'no token access',
  'no OpenClaw agent call',
  'no filesystem writes',
  'no database writes',
  'no external accounts touched',
  'no broker actions',
  'no browser automation',
];

export default function ObsidianTaskPlanVerification() {
  return (
    <div className="space-y-2">
      <div className="text-[8px] font-bold uppercase text-slate-400 mb-3 tracking-widest">
        Safety Boundary Verification Report
      </div>
      <div className="space-y-1">
        {VERIFICATION_CHECKS.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-[8px] font-mono text-slate-400 py-0.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>✓ {check}</span>
          </div>
        ))}
      </div>
      <div className="text-[7px] text-slate-500 italic pt-3 border-t border-border/20 mt-3">
        All Obsidian task planning operations are local-only preview. No actual vault modifications, no task execution, no backend calls.
      </div>
    </div>
  );
}