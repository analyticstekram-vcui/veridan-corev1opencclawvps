import React from 'react';
import { ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react';

export default function OpenClawBoundaryPanel({ openclawBoundary }) {
  const { status, mode, executionEnabled, dispatchEnabled, docs, note } = openclawBoundary;

  const statusColor = !executionEnabled && !dispatchEnabled ? 'text-primary' : 'text-destructive';
  const statusLabel = !executionEnabled && !dispatchEnabled ? 'BOUNDARY HELD' : 'BOUNDARY RISK';

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">OpenClaw Boundary</span>
        <span className="text-[7px] font-mono text-slate-500 ml-1">— OpenClaw Boundary Report</span>
        <span className={`ml-auto text-[8px] font-bold font-mono px-2 py-0.5 border rounded-sm ${statusColor} border-current/30 bg-current/5`}>
          {statusLabel}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Status line */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
          <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          <span className="text-[8px] font-mono text-slate-300">{status}</span>
        </div>

        {/* Boundary flags */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Mode',              value: mode,                                color: 'text-primary' },
            { label: 'Execution',         value: executionEnabled ? 'ENABLED' : 'DISABLED', color: executionEnabled ? 'text-destructive' : 'text-primary' },
            { label: 'Dispatch',          value: dispatchEnabled  ? 'ENABLED' : 'DISABLED', color: dispatchEnabled  ? 'text-destructive' : 'text-primary' },
            { label: 'Bridge Access',     value: 'READ_ONLY',     color: 'text-primary' },
            { label: 'Governance Activation', value: 'NOT_TRIGGERED', color: 'text-primary' },
            { label: 'OpenClaw Call',     value: 'NOT_SENT',      color: 'text-primary' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-3 py-2 bg-background/60 border border-border/30 rounded-sm space-y-0.5">
              <div className="text-[6px] font-mono text-slate-500 uppercase">{label}</div>
              <div className={`text-[8px] font-bold font-mono ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Documented OpenClaw files */}
        <div className="space-y-1.5">
          <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400">OpenClaw Documentation Present</div>
          <div className="space-y-1">
            {docs.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 text-[7px] font-mono text-slate-400">
                <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="text-slate-300">{doc.title}</span>
                <span className="text-slate-600 truncate">· {doc.path}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        {note && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-background/40 border border-border/30 rounded-sm">
            <XCircle className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[7px] font-mono text-slate-500 leading-relaxed">{note}</p>
          </div>
        )}
      </div>
    </div>
  );
}