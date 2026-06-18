/**
 * GovernanceMonitor — Phase 4 Read-Only
 * Live-style governance readiness monitor.
 * No mutations. No activation. No approval actions.
 */
import React from 'react';
import { ShieldCheck } from 'lucide-react';

function MetricRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
      <span className="text-[7px] font-mono text-slate-500">{label}</span>
      <span className={`text-[9px] font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

export default function GovernanceMonitor({ gov }) {
  const statusColor = gov.readinessScore >= 90 ? 'text-primary' : gov.readinessScore >= 70 ? 'text-amber-400' : 'text-destructive';

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-card/80">
        <ShieldCheck className="w-3 h-3 text-primary" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Governance Monitor</span>
        <span className={`ml-auto px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm border-current/30 bg-current/5 ${statusColor}`}>{gov.status}</span>
      </div>
      <div className="p-3 space-y-1">
        <MetricRow label="Readiness Score"   value={`${gov.readinessScore}/100`} color={statusColor} />
        <MetricRow label="Maturity Score"    value={`${gov.maturityScore}/100`}  color="text-primary" />
        <MetricRow label="Activation Score"  value={`${gov.activationScore}/100`} color={gov.activationScore >= 90 ? 'text-primary' : 'text-amber-400'} />
        <MetricRow label="Activation Gap"    value={`${gov.activationGap} pts`}  color={gov.activationGap > 0 ? 'text-amber-400' : 'text-primary'} />
        <MetricRow label="Pending Approvals" value={gov.pendingApprovals}        color={gov.pendingApprovals > 0 ? 'text-amber-400' : 'text-primary'} />
        <MetricRow label="Reviews Due (7d)"  value={gov.reviewsDue7d}            color={gov.reviewsDue7d > 0 ? 'text-amber-400' : 'text-primary'} />
        <MetricRow label="Open Exceptions"   value={gov.openExceptions}          color={gov.openExceptions > 0 ? 'text-destructive' : 'text-primary'} />
      </div>
    </div>
  );
}