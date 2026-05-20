/**
 * McpArchitectureFlow
 * Visual staged architecture diagram for the MCP TradingView workflow.
 * Static display only. No execution.
 */
import React from 'react';
import { ARCHITECTURE_STAGES } from './mcpTradingViewContracts';

const STAGE_COLORS = [
  'border-slate-500/40  bg-slate-500/5',
  'border-blue-500/30   bg-blue-500/5',
  'border-chart-3/40    bg-chart-3/5',
  'border-amber-500/30  bg-amber-500/5',
  'border-primary/30    bg-primary/5',
  'border-primary/30    bg-primary/5',
  'border-orange-500/30 bg-orange-500/5',
  'border-chart-4/30    bg-chart-4/5',
  'border-amber-500/30  bg-amber-500/5',
  'border-primary/30    bg-primary/5',
];

export default function McpArchitectureFlow() {
  return (
    <div className="space-y-2 font-mono">
      <div className="text-[8px] text-slate-500 mb-3">
        Architecture contract — 10-stage visual confirmation pipeline · All stages simulated/preview only
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        {ARCHITECTURE_STAGES.map((stage, i) => (
          <div key={stage.id} className={`border rounded-sm p-3 relative ${STAGE_COLORS[i % STAGE_COLORS.length]}`}>
            {/* Stage number */}
            <div className="absolute top-2 right-2 text-[8px] font-bold text-slate-600">
              #{stage.id}
            </div>
            {/* Icon */}
            <div className="text-xl mb-2">{stage.icon}</div>
            {/* Label */}
            <div className="text-[9px] font-bold text-foreground leading-snug mb-1">{stage.label}</div>
            {/* System */}
            <div className="text-[7px] text-slate-400 mb-1.5">{stage.system}</div>
            {/* Status note */}
            <div className="text-[7px] font-mono text-amber-400/80 bg-secondary/30 border border-border/20 rounded-sm px-1.5 py-0.5 inline-block">
              {stage.note}
            </div>
          </div>
        ))}
      </div>
      {/* Flow arrow row */}
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {ARCHITECTURE_STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            <span className="text-[7px] text-slate-500 font-mono whitespace-nowrap shrink-0">{s.id}</span>
            {i < ARCHITECTURE_STAGES.length - 1 && (
              <span className="text-slate-600 shrink-0">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}