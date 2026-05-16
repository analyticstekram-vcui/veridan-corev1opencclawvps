import React from 'react';
import { Eye, AlertCircle } from 'lucide-react';

const PANEL_CONFIGS = {
  monitoring_setup: {
    title: 'Monitoring Setup',
    description: 'Configure which systems are monitored. Rules are read-only preview — no live alert delivery is active.',
    items: [
      'OpenClaw Gateway health polling (active — every 15s)',
      'Proposal Queue depth monitor (active — via entity)',
      'Audit failure scan (active — via dry-run audit entity)',
      'TradingView signal receiver (planned — webhook not yet active)',
      'Broker status polling (placeholder — no broker connected)',
      'Credit / business module sync (placeholder — entity exists)',
    ],
  },
  watch_rules: {
    title: 'Watch Rules',
    description: 'Define conditions that trigger monitoring events. All rules are UI-only placeholders until alert routing is configured.',
    items: [
      'Gateway offline > 60s → alert (placeholder)',
      'Proposal queue depth > 10 → alert (placeholder)',
      'Audit FAIL rate > 3 in 5 min → alert (placeholder)',
      'Execution lock status change → alert (placeholder)',
      'Kill switch activated → alert (placeholder)',
    ],
  },
  alert_routes: {
    title: 'Alert Routes',
    description: 'Configure where monitoring alerts are sent. No live routing is active. All routes are placeholders.',
    items: [
      'Email (not configured)',
      'Slack webhook (not configured)',
      'PagerDuty (not configured)',
      'In-app notification (placeholder)',
      'VPS syslog (not configured from UI)',
    ],
  },
  tradingview_signals: {
    title: 'TradingView Signals',
    description: 'Planned webhook receiver for TradingView alerts. No live market data, no trading execution. Preview only.',
    items: [
      'Webhook endpoint: NOT YET ACTIVE',
      'Signal parsing: planned',
      'Alert → Proposal conversion: planned (governance-gated)',
      'No live trades — signals only create governed proposals',
      'Broker execution: DISABLED globally',
    ],
  },
  openclaw_health: {
    title: 'OpenClaw Health',
    description: 'Health status of the OpenClaw gateway and Playwright runtime on the VPS. Read-only diagnostics.',
    items: [
      'Gateway reachability: polled via openclawStatus function',
      'Playwright process: reported by gateway (read-only)',
      'Session count: available via gateway connector',
      'Latency tracking: via OpenClawGatewayConnectorLog entity',
      'Error rate: tracked in audit log',
    ],
  },
};

export default function MonitoringPlaceholderPanel({ tabId }) {
  const cfg = PANEL_CONFIGS[tabId] || PANEL_CONFIGS.monitoring_setup;
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <h2 className="text-[13px] font-semibold text-foreground">{cfg.title}</h2>
        <span className="ml-auto text-[8px] px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-bold uppercase">Preview Only</span>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[9px] text-amber-500/90">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        {cfg.description}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border text-[9px] font-semibold uppercase tracking-widest text-slate-400">
          Configuration Items
        </div>
        <div className="divide-y divide-border/30">
          {cfg.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
              <span className="text-primary/40 text-[9px] font-mono mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[10px] text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[8px] text-slate-500 text-center uppercase tracking-widest">
        No live alerts active · Read-only preview · No credential entry · No execution
      </div>
    </div>
  );
}