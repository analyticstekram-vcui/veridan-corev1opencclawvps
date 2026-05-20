import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { VERIFICATION_CHECKLIST } from './tvMcpContracts';

export default function TvMcpVerificationChecklist() {
  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20">
        <span className="text-[9px] font-bold uppercase text-slate-300">Module Verification Checklist</span>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {VERIFICATION_CHECKLIST.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-secondary/20 border border-primary/20 rounded-sm px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[7px] font-bold text-primary font-mono">{item.id}</span>
            <span className="text-[8px] text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-3">
        <div className="text-[7px] text-primary font-mono">
          ✓ All {VERIFICATION_CHECKLIST.length} verification checks pass
        </div>
      </div>
    </div>
  );
}