import React, { useState } from 'react';
import { FLOW_STAGES } from './wakeActivationContracts';

const STAGE_BG = [
  'from-slate-700/30',
  'from-slate-700/30',
  'from-slate-700/30',
  'from-primary/10',
  'from-destructive/10',
  'from-primary/10',
  'from-amber-400/10',
  'from-amber-400/10',
  'from-amber-400/10',
  'from-destructive/10',
];

export default function WakeActivationFlowStages() {
  const [active, setActive] = useState(null);

  return (
    <div className="space-y-4">
      {/* Pipeline bar */}
      <div className="flex items-center gap-0 flex-wrap">
        {FLOW_STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <button
              type="button"
              onClick={() => setActive(active === stage.id ? null : stage.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[7px] font-bold uppercase border transition-colors rounded-sm ${
                active === stage.id
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-secondary/20 border-border/30 text-slate-400 hover:text-slate-200 hover:border-border/60'
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center rounded-full border border-current text-[7px] font-bold shrink-0">{stage.id}</span>
              <span className="hidden md:inline">{stage.label}</span>
            </button>
            {i < FLOW_STAGES.length - 1 && (
              <div className="w-3 h-px bg-border/40 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stage cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {FLOW_STAGES.map((stage, i) => (
          <div
            key={stage.id}
            onClick={() => setActive(active === stage.id ? null : stage.id)}
            className={`cursor-pointer bg-gradient-to-b ${STAGE_BG[i]} to-transparent border rounded-sm p-3 space-y-1.5 transition-all ${
              active === stage.id ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/30 hover:border-border/60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-secondary/40 text-[7px] font-bold text-slate-300 shrink-0">{stage.id}</span>
              <div className="text-[8px] font-bold text-foreground leading-tight">{stage.label}</div>
            </div>
            <div className={`text-[7px] font-bold ${stage.statusColor}`}>{stage.status}</div>
            <div className="text-[7px] text-slate-500 leading-relaxed">{stage.description}</div>
            <div className="text-[6px] text-destructive font-mono">⊘ {stage.guardrail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}