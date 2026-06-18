/**
 * OpenClawBoundaryMonitor — Phase 4 Read-Only
 * Compact boundary compliance monitor. No execution. No dispatch.
 */
import React from 'react';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

function BoolFlag({ label, enabled }) {
  const Icon = enabled ? XCircle : CheckCircle2;
  const color = enabled ? 'text-destructive' : 'text-primary';
  const val = enabled ? 'ENABLED' : 'DISABLED';
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
      <span className="text-[7px] font-mono text-slate-500">{label}</span>
      <div className="flex items-center gap-1">
        <Icon className={`w-2.5 h-2.5 ${color}`} />
        <span className={`text-[8px] font-mono font-bold ${color}`}>{val}</span>
      </div>
    </div>
  );
}

export default function OpenClawBoundaryMonitor({ oc }) {
  const compliant = oc.boundaryCompliant;
  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-card/80">
        <Shield className="w-3 h-3 text-primary" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">OpenClaw Boundary</span>
        <span className={`ml-auto px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${
          compliant ? 'text-primary border-primary/30 bg-primary/10' : 'text-destructive border-destructive/30 bg-destructive/10'
        }`}>{compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</span>
      </div>
      <div className="p-3 space-y-1">
        <BoolFlag label="Execution" enabled={oc.executionEnabled} />
        <BoolFlag label="Dispatch"  enabled={oc.dispatchEnabled} />
        <div className="flex items-center justify-between py-1.5 border-b border-border/10">
          <span className="text-[7px] font-mono text-slate-500">Mode</span>
          <span className="text-[8px] font-mono font-bold text-primary">{oc.mode}</span>
        </div>
        <div className="flex items-center justify-between py-1.5 border-b border-border/10">
          <span className="text-[7px] font-mono text-slate-500">Docs Coverage</span>
          <span className="text-[8px] font-mono font-bold text-primary">{oc.docsPresent}/{oc.docsRequired} ({oc.coveragePercent}%)</span>
        </div>
        <div className="text-[7px] font-mono text-slate-500 pt-1">{oc.boundaryStatus}</div>
      </div>
    </div>
  );
}