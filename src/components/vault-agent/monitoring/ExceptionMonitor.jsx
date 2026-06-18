/**
 * ExceptionMonitor — Phase 4 Read-Only
 * Exception register status. No mutations.
 */
import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ExceptionMonitor({ exceptions }) {
  const isClear = exceptions.openCount === 0;

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-card/80">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Exception Monitor</span>
        <span className={`ml-auto px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${
          isClear ? 'text-primary border-primary/30 bg-primary/10' : 'text-destructive border-destructive/30 bg-destructive/10'
        }`}>{exceptions.status}</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Open', value: exceptions.openCount, color: exceptions.openCount > 0 ? 'text-destructive' : 'text-primary' },
            { label: 'Resolved', value: exceptions.resolvedCount, color: 'text-slate-300' },
            { label: 'Historical', value: exceptions.totalHistorical, color: 'text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center px-2 py-2 bg-background/60 border border-border/30 rounded-sm">
              <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
              <span className="text-[6px] font-mono text-slate-600 mt-0.5">{label}</span>
            </div>
          ))}
        </div>
        {isClear && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[7px] font-mono text-slate-400">{exceptions.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}