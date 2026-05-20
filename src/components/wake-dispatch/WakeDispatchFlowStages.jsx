/**
 * WakeDispatchFlowStages
 * 8-stage pipeline visualization for OpenClaw Wake Dispatch Preview Gate.
 * Read-only display only.
 */
import React from 'react';
import { FLOW_STAGES } from './wakeDispatchContracts';

const STAGE_COLORS = [
  'border-primary/40 bg-primary/5',
  'border-amber-500/40 bg-amber-500/5',
  'border-purple-500/40 bg-purple-500/5',
  'border-blue-500/40 bg-blue-500/5',
  'border-cyan-500/40 bg-cyan-500/5',
  'border-orange-500/40 bg-orange-500/5',
  'border-slate-400/40 bg-slate-400/5',
  'border-green-500/40 bg-green-500/5',
];

const STATUS_COLORS = {
  GOVERNANCE_INPUT: 'text-primary',
  GATE_CHECKS:      'text-amber-400',
  TOKEN_HIDDEN:     'text-purple-400',
  PAYLOAD_BUILT:    'text-blue-400',
  PREVIEW_ONLY:     'text-cyan-400',
  DECISION:         'text-orange-400',
  AUDITED:          'text-slate-400',
  OPERATOR_REQUIRED:'text-green-400',
};

export default function WakeDispatchFlowStages() {
  return (
    <div className="space-y-3">
      {/* Linear connector bar */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {FLOW_STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <div className={`shrink-0 flex flex-col items-center justify-center px-3 py-2 border rounded-sm text-center min-w-[90px] ${STAGE_COLORS[i]}`}>
              <div className="text-[14px] mb-0.5">{stage.icon}</div>
              <div className="text-[7px] font-bold text-foreground leading-tight">{stage.label}</div>
              <div className={`text-[6px] font-bold mt-0.5 ${STATUS_COLORS[stage.status]}`}>{stage.status}</div>
            </div>
            {i < FLOW_STAGES.length - 1 && (
              <div className="shrink-0 text-slate-600 text-[10px] px-1">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {FLOW_STAGES.map((stage, i) => (
          <div key={stage.id} className={`border rounded-sm p-3 space-y-1 ${STAGE_COLORS[i]}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">{stage.icon}</span>
              <span className="text-[8px] font-bold text-foreground">{stage.id}. {stage.label}</span>
            </div>
            <div className="text-[7px] text-slate-400 leading-relaxed">{stage.desc}</div>
            <div className={`text-[6px] font-bold uppercase ${STATUS_COLORS[stage.status]}`}>{stage.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}