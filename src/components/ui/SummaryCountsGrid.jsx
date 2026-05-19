/**
 * SummaryCountsGrid — Shared counts grid for module status summaries.
 * Renders grid of count items with labels and colors.
 */

import React from 'react';

export default function SummaryCountsGrid({ title, items }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm p-4">
      <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">{title}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(item => (
          <div
            key={item.label}
            className="flex flex-col items-center px-3 py-2.5 bg-secondary/20 border border-border/30 rounded-sm"
          >
            <span className={`text-[18px] font-bold font-mono ${item.color}`}>
              {item.value}
            </span>
            <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}