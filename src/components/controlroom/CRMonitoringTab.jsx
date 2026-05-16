import React from 'react';
import { Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const MONITORED_SYSTEMS = [
  { name: 'OpenClaw Gateway', type: 'Infrastructure', status: 'active', notes: 'Polled every 15s via openclawStatus function' },
  { name: 'TradingView Alerts', type: 'Market Signal', status: 'planned', notes: 'Webhook receiver planned — not yet active' },
  { name: 'OpenClaw Health', type: 'Infrastructure', status: 'active', notes: 'Health check via gateway connector' },
  { name: 'Proposal Queue', type: 'Governance', status: 'active', notes: 'Monitored via OpenClawProposal entity' },
  { name: 'Audit Failures', type: 'Security', status: 'active', notes: 'Dry-run audit log scanned for FAIL status' },
  { name: 'Broker Status', type: 'Trading', status: 'placeholder', notes: 'Broker API not connected — metadata only' },
  { name: 'Credit / Business Module', type: 'Finance', status: 'placeholder', notes: 'CreditFacility entity exists — live sync not configured' },
  { name: 'Execution Queue', type: 'Governance', status: 'active', notes: 'ExecutionQueue entity monitored for QUEUED items' },
];

const statusConfig = {
  active:      { icon: CheckCircle2, color: 'text-primary',   bg: 'bg-primary/5 border-primary/20',      label: 'ACTIVE' },
  planned:     { icon: Clock,        color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20',  label: 'PLANNED' },
  placeholder: { icon: AlertCircle,  color: 'text-slate-400', bg: 'bg-secondary/30 border-border',       label: 'PLACEHOLDER' },
};

export default function CRMonitoringTab() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <h2 className="text-[13px] font-semibold text-foreground">Monitoring Setup</h2>
        <span className="ml-auto text-[9px] px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-bold">PREVIEW ONLY — no live alerts</span>
      </div>

      <div className="space-y-2">
        {MONITORED_SYSTEMS.map(sys => {
          const cfg = statusConfig[sys.status];
          const Icon = cfg.icon;
          return (
            <div key={sys.name} className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${cfg.bg}`}>
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">{sys.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 border border-border rounded text-slate-400 font-semibold uppercase">{sys.type}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 border rounded font-bold uppercase ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">{sys.notes}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-lg text-[9px] text-destructive/80">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        All monitoring rules are preview only. No live data is pushed or consumed. No webhooks are active.
      </div>
    </div>
  );
}