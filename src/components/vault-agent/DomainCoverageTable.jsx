import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const PRIORITY_COLOR = {
  CRITICAL: 'text-destructive border-destructive/40 bg-destructive/10',
  HIGH: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  MEDIUM: 'text-primary border-primary/30 bg-primary/10',
  LOW: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

const STATUS_CONFIG = {
  WRITTEN:      { label: 'WRITTEN',      color: 'text-primary',     icon: CheckCircle2 },
  APPROVED:     { label: 'APPROVED',     color: 'text-primary/70',  icon: CheckCircle2 },
  DRAFT_EXISTS: { label: 'DRAFT EXISTS', color: 'text-amber-400',   icon: Clock },
  MISSING:      { label: 'MISSING',      color: 'text-destructive', icon: XCircle },
};

function CoverageBar({ pct }) {
  const color = pct >= 70 ? 'bg-primary' : pct >= 40 ? 'bg-amber-400' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[8px] font-mono font-bold text-slate-300 w-8 text-right">{pct}%</span>
    </div>
  );
}

function DomainRow({ coverage }) {
  const [open, setOpen] = useState(false);
  const { domain, priority, total, written, missing, coveragePct, docs } = coverage;

  return (
    <div className="border border-border/30 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-secondary/20 text-left transition-colors">
        <span className={`shrink-0 px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${PRIORITY_COLOR[priority]}`}>
          {priority}
        </span>
        <span className="text-[9px] font-bold text-slate-200 flex-1">{domain}</span>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[7px] font-mono">
            <span className="text-primary">{written}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{total}</span>
            <span className="text-slate-600 ml-1">written</span>
          </div>
          <div className="w-20 hidden sm:block">
            <CoverageBar pct={coveragePct} />
          </div>
          {missing > 0 && (
            <span className="text-[7px] font-mono text-destructive/80">{missing} missing</span>
          )}
          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-border/20 bg-background/40 overflow-x-auto">
          <table className="w-full text-[7px] font-mono">
            <thead>
              <tr className="border-b border-border/20">
                {['Document', 'Status', 'Priority', 'Path'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 text-slate-500 uppercase font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => {
                const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.MISSING;
                const StatusIcon = cfg.icon;
                return (
                  <tr key={i} className="border-b border-border/10 hover:bg-card/30">
                    <td className="px-3 py-1.5 text-slate-300">{doc.title}</td>
                    <td className={`px-3 py-1.5 font-bold ${cfg.color}`}>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </div>
                    </td>
                    <td className={`px-3 py-1.5 font-bold ${PRIORITY_COLOR[doc.priority]?.split(' ')[0]}`}>{doc.priority}</td>
                    <td className="px-3 py-1.5 text-slate-500 max-w-[200px] truncate">{doc.path}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DomainCoverageTable({ domainCoverage, loading }) {
  if (loading || !domainCoverage.length) {
    return (
      <div className="border border-border/40 bg-card rounded-sm p-6 text-center text-[8px] font-mono text-slate-500">
        {loading ? 'Computing domain coverage…' : 'Run analysis to compute coverage.'}
      </div>
    );
  }

  const totalDocs = domainCoverage.reduce((a, d) => a + d.total, 0);
  const totalWritten = domainCoverage.reduce((a, d) => a + d.written, 0);
  const totalMissing = domainCoverage.reduce((a, d) => a + d.missing, 0);
  const overallPct = Math.round((totalWritten / totalDocs) * 100);

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80 flex-wrap">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Knowledge Domain Coverage</span>
        <div className="flex items-center gap-3 text-[7px] font-mono">
          <span className="text-slate-500">Total: <span className="text-slate-300 font-bold">{totalDocs}</span></span>
          <span className="text-slate-500">Written: <span className="text-primary font-bold">{totalWritten}</span></span>
          <span className="text-slate-500">Missing: <span className="text-destructive font-bold">{totalMissing}</span></span>
          <span className="text-slate-500">Overall: <span className="text-amber-400 font-bold">{overallPct}%</span></span>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {domainCoverage.map(d => <DomainRow key={d.domain} coverage={d} />)}
      </div>
    </div>
  );
}