import React from 'react';
import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

const TOOLS = [
  {
    name: 'Browser (OpenClaw / Playwright)',
    category: 'Automation',
    status: 'governed',
    route: 'OpenClaw Gateway → Playwright on VPS',
    notes: 'Read-only and inspect commands only. Mutations blocked. All commands require approval.',
  },
  {
    name: 'OpenClaw / Codex AI',
    category: 'AI Route',
    status: 'primary',
    route: 'OpenClaw Gateway → Codex / LLM backend',
    notes: 'Primary AI execution route. Governed and preview-only from this UI.',
  },
  {
    name: 'TradingView MCP',
    category: 'Market Data',
    status: 'planned',
    route: 'Webhook → VeridanCore backend (not yet active)',
    notes: 'Alert receiver planned. No live market data or trading connection yet.',
  },
  {
    name: 'Broker API',
    category: 'Trading',
    status: 'disabled',
    route: '—',
    notes: 'Broker API integration is not connected. Placeholder only. No order execution.',
  },
  {
    name: 'Bank API',
    category: 'Finance',
    status: 'disabled',
    route: '—',
    notes: 'Bank API not connected. No money movement. No credential entry.',
  },
  {
    name: 'OpenAI API (direct)',
    category: 'AI',
    status: 'disabled',
    route: '—',
    notes: 'Direct OpenAI API calls from this UI are disabled. Use OpenClaw AI route instead.',
  },
];

const STATUS_CONFIG = {
  governed: { icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'GOVERNED' },
  primary:  { icon: Zap,          color: 'text-primary',   bg: 'bg-primary/5 border-primary/20',     label: 'PRIMARY ROUTE' },
  planned:  { icon: Clock,        color: 'text-slate-400', bg: 'bg-secondary/20 border-border',      label: 'PLANNED' },
  disabled: { icon: XCircle,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'DISABLED' },
};

export default function CRToolRegistryTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-[13px] font-semibold text-foreground">Tool Registry</h2>

      <div className="space-y-2">
        {TOOLS.map(tool => {
          const cfg = STATUS_CONFIG[tool.status];
          const Icon = cfg.icon;
          return (
            <div key={tool.name} className={`border rounded-lg p-4 ${cfg.bg}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-semibold text-foreground">{tool.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 border border-border rounded text-slate-400 font-semibold uppercase">{tool.category}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 border rounded font-bold ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                  </div>
                  {tool.route !== '—' && (
                    <div className="text-[9px] font-mono text-blue-400 mb-1">{tool.route}</div>
                  )}
                  <p className="text-[9px] text-slate-400">{tool.notes}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}