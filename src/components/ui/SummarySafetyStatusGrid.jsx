/**
 * SummarySafetyStatusGrid — Shared safety status grid for module status summaries.
 * Renders grid of safety status items with labels and colors.
 */

import React from 'react';

export default function SummarySafetyStatusGrid({ title, items }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm p-4">
      <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map(item => (
          <div
            key={item.label}
            className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border border-border/30 rounded-sm"
          >
            <span className="text-[9px] text-slate-400">{item.label}:</span>
            <span className={`text-[8px] font-bold font-mono ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}