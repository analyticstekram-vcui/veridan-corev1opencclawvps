import React from 'react';
import { TrendingUp, Clock, Activity, AlertTriangle } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border border-border p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">{label}</span>
      </div>
      <div className={`text-[22px] font-mono font-semibold leading-none ${color}`}>{value ?? '—'}</div>
      {sub && <div className="text-[10px] text-muted-foreground/50 font-mono">{sub}</div>}
    </div>
  );
}

export default function TelemetryKpiCards({ metrics }) {
  const m = metrics?.['1m'] || {};
  const successPct = m.successRate != null ? `${(m.successRate * 100).toFixed(1)}%` : '—';
  const errorPct   = m.errorRate   != null ? `${(m.errorRate   * 100).toFixed(1)}%` : '—';
  const latency    = m.avgLatency  != null ? `${m.avgLatency}ms` : '—';
  const rpm        = m.requestCount != null ? `${m.requestCount}` : '—';

  const successColor = (m.successRate ?? 1) >= 0.8 ? 'text-primary' : 'text-destructive';
  const errorColor   = (m.errorRate   ?? 0) > 0.2  ? 'text-destructive' : 'text-muted-foreground';
  const latencyColor = (m.avgLatency  ?? 0) > 400   ? 'text-amber-500' : 'text-foreground';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard icon={TrendingUp}    label="Success Rate"  value={successPct} sub="last 1m window"  color={successColor} />
      <KpiCard icon={Clock}         label="Avg Latency"   value={latency}    sub="last 1m window"  color={latencyColor} />
      <KpiCard icon={Activity}      label="Requests/min"  value={rpm}        sub="rolling 1m"       color="text-foreground" />
      <KpiCard icon={AlertTriangle} label="Error Rate"    value={errorPct}   sub="last 1m window"  color={errorColor} />
    </div>
  );
}