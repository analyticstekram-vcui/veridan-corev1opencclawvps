/**
 * SummaryWhatThisMeans — Shared "What This Means" section for module status summaries.
 */

import React from 'react';

export default function SummaryWhatThisMeans({ text }) {
  return (
    <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-sm">
      <div className="text-[9px] font-bold uppercase text-primary mb-2">What This Means</div>
      <p className="text-[8px] text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}