/**
 * VaultFreshnessMonitor — Phase 4 Read-Only
 * Displays data freshness score and last refresh time.
 * No mutations. No execution.
 */
import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

const STATUS_STYLE = {
  FRESH:   'text-primary border-primary/30 bg-primary/10',
  STALE:   'text-amber-400 border-amber-500/30 bg-amber-500/10',
  EXPIRED: 'text-destructive border-destructive/30 bg-destructive/10',
};

export default function VaultFreshnessMonitor({ monitoring }) {
  const { lastRefreshTime, freshnessHours, freshnessScore, freshnessStatus, dataAsOf } = monitoring;
  const cls = STATUS_STYLE[freshnessStatus] || STATUS_STYLE.STALE;

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-card/80">
        <Clock className="w-3 h-3 text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Vault Freshness</span>
        <span className={`ml-auto px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${cls}`}>{freshnessStatus}</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center px-2 py-2 bg-background/60 border border-border/30 rounded-sm">
            <span className={`text-lg font-mono font-bold ${freshnessScore >= 80 ? 'text-primary' : freshnessScore >= 50 ? 'text-amber-400' : 'text-destructive'}`}>{freshnessScore}</span>
            <span className="text-[6px] font-mono text-slate-600 mt-0.5">Freshness Score</span>
          </div>
          <div className="flex flex-col items-center px-2 py-2 bg-background/60 border border-border/30 rounded-sm">
            <span className="text-lg font-mono font-bold text-slate-200">{freshnessHours}h</span>
            <span className="text-[6px] font-mono text-slate-600 mt-0.5">Data Age</span>
          </div>
          <div className="flex flex-col items-center px-2 py-2 bg-background/60 border border-border/30 rounded-sm">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
            <span className="text-[6px] font-mono text-slate-600">Last Refresh</span>
          </div>
        </div>
        <div className="text-[7px] font-mono text-slate-500 space-y-0.5">
          <div>Last refresh: <span className="text-slate-300">{lastRefreshTime}</span></div>
          <div>Data as of: <span className="text-slate-300">{dataAsOf}</span></div>
        </div>
      </div>
    </div>
  );
}