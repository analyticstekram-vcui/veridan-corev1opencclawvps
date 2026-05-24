import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Radio, TrendingUp, CreditCard, Briefcase, BookOpen, Layers, FileText, Cpu, Archive } from 'lucide-react';

export default function ModuleNav() {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Global Command Dashboard', path: '/global-command-dashboard', icon: Cpu },
    { label: 'AI Command Center', path: '/ai-command-center', icon: Cpu },
    { label: 'Baselines', path: '/baseline-evidence', icon: Archive },
    { label: 'Audit / Evidence', path: '/audit-evidence', icon: FileText },
    { label: 'Dry-Run Bridge', path: '/dry-run-bridge-planning', icon: Layers },
    { label: 'Backend Contract', path: '/dry-run-backend-contract', icon: FileText },
    { label: 'Approval Workflow', path: '/approval-workflow-planning', icon: FileText },
    { label: 'OpenClaw Monitoring', path: '/openclaw-monitoring', icon: Cpu },
    { label: 'OpenClaw Governance', path: '/openclaw-governance', icon: Cpu },
    { label: 'System Map', path: '/system-map', icon: Layers },
    { label: 'Trading CMD', path: '/trading-command-center', icon: TrendingUp },
    { label: 'Trading', path: '/trading-operations', icon: TrendingUp },
    { label: 'Public Credit CMD', path: '/public-credit-command-center', icon: CreditCard },
    { label: 'Biz Formation CMD', path: '/business-formation-command-center', icon: Briefcase },
    { label: 'Credit', path: '/credit-public-side', icon: CreditCard },
    { label: 'Business', path: '/business-operations', icon: Briefcase },
    { label: 'Knowledge', path: '/knowledge-vault', icon: BookOpen },
    { label: 'Control Room', path: '/control-room', icon: Radio },
    { label: 'Obsidian Vault', path: '/obsidian-vault', icon: BookOpen },
    { label: 'Webhook Contracts', path: '/webhook-contract-preview', icon: Layers },
    { label: 'MCP TradingView', path: '/mcp-tradingview-preview', icon: TrendingUp },
    { label: 'Wake Dispatch Gate', path: '/wake-dispatch-preview', icon: Layers },
    { label: '⚡ Wake Control Center', path: '/wake-control-center', icon: Layers },
    { label: '[dev] Wake Backend Dry-Run', path: '/wake-backend-dry-run', icon: Layers },
    { label: '[dev] Wake Activation Gate', path: '/wake-activation-readiness', icon: Layers },
    { label: 'TV MCP Bridge', path: '/tradingview-mcp-bridge', icon: TrendingUp },
    { label: 'TradingView MCP', path: '/tradingview-mcp-monitor', icon: TrendingUp },
  ];

  return (
    <div className="shrink-0 border-b border-border bg-card px-4 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        {navItems.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono font-bold border border-border/40 text-slate-300 hover:text-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-colors rounded-sm whitespace-nowrap"
          >
            <Icon className="w-3 h-3" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}