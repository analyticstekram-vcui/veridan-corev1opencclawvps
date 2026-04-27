import React from 'react';
import { CheckCircle2, AlertTriangle, OctagonX, Loader2 } from 'lucide-react';

const config = {
  NORMAL:  { icon: CheckCircle2,  color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         label: 'NORMAL — All systems operating within parameters' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     label: 'WARNING — Anomaly detected. Review telemetry.' },
  BLOCKED: { icon: OctagonX,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'BLOCKED — Auto-pause triggered. Execution halted.' },
};

export default function TelemetryStatusBanner({ systemState, anomalies = [], loading, onAcknowledge }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-border bg-card/50">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-[11px] font-mono text-muted-foreground/50">Connecting to telemetry stream...</span>
      </div>
    );
  }

  const state = systemState || 'NORMAL';
  const { icon: Icon, color, bg, label } = config[state] || config.NORMAL;

  return (
    <div className={`border ${bg} px-4 py-3 font-mono`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 shrink-0 ${color}`} />
          <div>
            <div className={`text-[12px] font-semibold ${color}`}>{state}</div>
            <div className="text-[10px] text-muted-foreground/70">{label}</div>
          </div>
        </div>
        {state !== 'NORMAL' && onAcknowledge && (
          <button
            onClick={onAcknowledge}
            className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0"
          >
            Acknowledge
          </button>
        )}
      </div>

      {anomalies.length > 0 && (
        <div className="mt-3 space-y-1">
          {anomalies.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground/70">
              <span className={`shrink-0 uppercase ${a.type === 'OPENCLAW_ANOMALY_BLOCKED' ? 'text-destructive' : 'text-amber-500'}`}>
                [{a.rule}]
              </span>
              <span>{a.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}