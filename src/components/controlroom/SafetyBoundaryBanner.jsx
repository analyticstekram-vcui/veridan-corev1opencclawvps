import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function SafetyBoundaryBanner() {
  return (
    <div className="bg-amber-500/5 border-b-2 border-amber-500/30 px-6 py-3 flex flex-wrap items-start gap-3">
      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">PREVIEW / GOVERNED MODE</span>
        <span className="text-[10px] text-amber-500/80 ml-2">— No live trading, money movement, credential entry, or broker execution is enabled.</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: 'Live Trading: OFF', danger: true },
          { label: 'Money Movement: OFF', danger: true },
          { label: 'Broker Execution: OFF', danger: true },
          { label: 'Credential Entry: OFF', danger: true },
          { label: 'Browser: GOVERNED', danger: false },
        ].map(({ label, danger }) => (
          <span
            key={label}
            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
              danger
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}