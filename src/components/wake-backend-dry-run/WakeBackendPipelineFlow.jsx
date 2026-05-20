import React from 'react';
import { PIPELINE_STAGES } from './wakeBackendDryRunContracts';

export default function WakeBackendPipelineFlow() {
  return (
    <div className="space-y-3 font-mono">
      {/* Linear stage flow bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {PIPELINE_STAGES.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`px-2 py-1 border rounded-sm text-[7px] font-bold whitespace-nowrap ${s.color}`}>
              {s.id}. {s.label}
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <span className="text-slate-600 text-[8px]">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stage cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {PIPELINE_STAGES.map(s => (
          <div key={s.key} className={`border rounded-sm p-3 space-y-1.5 ${s.color}`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{s.icon}</span>
              <div>
                <div className="text-[7px] font-bold uppercase opacity-60">{s.status}</div>
                <div className="text-[8px] font-bold leading-tight">{s.label}</div>
              </div>
            </div>
            <p className="text-[7px] opacity-70 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}