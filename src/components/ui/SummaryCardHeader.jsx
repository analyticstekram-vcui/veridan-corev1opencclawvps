/**
 * SummaryCardHeader — Shared header for module status summaries.
 * Title, subtitle, and export button placement.
 */

import React from 'react';
import { Download } from 'lucide-react';

export default function SummaryCardHeader({ title, subtitle, onExport }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] font-bold uppercase text-primary">{title}</div>
        <div className="text-[8px] text-slate-500 mt-0.5">{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm"
      >
        <Download className="w-3 h-3" />
        Export
      </button>
    </div>
  );
}