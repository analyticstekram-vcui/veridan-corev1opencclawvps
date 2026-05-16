import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  CreditCard,
  Building2,
  TrendingUp,
  Lock,
  ScrollText,
  Settings,
  Bot,
  Globe,
  Radio
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', href: '/' },
  { icon: Terminal, label: 'AI Command', id: 'command', href: null },
  { icon: Radio, label: 'Control Room', id: 'controlroom', href: '/control-room' },
  { icon: CreditCard, label: 'Credit Ledger', id: 'personal', href: '/credit-ledger' },
  { icon: Building2, label: 'Business Credit', id: 'business', href: null },
  { icon: TrendingUp, label: 'Trading', id: 'trading', href: null },
  { icon: Lock, label: 'Obsidian Vault', id: 'vault', href: null },
  { icon: Bot, label: 'OpenClaw Control', id: 'openclaw', href: '/openclaw-control' },
  { icon: Globe, label: 'Browser Control', id: 'browser', href: '/browser-control' },
  { icon: ScrollText, label: 'Logs', id: 'logs', href: null },
  { icon: Settings, label: 'Settings', id: 'settings', href: null },
];

export default function LeftIconRail({ activeModule, onModuleChange }) {
  const location = useLocation();
  return (
    <div className="w-11 bg-card border-r border-border flex flex-col items-center py-2 gap-0.5 shrink-0 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href ? location.pathname === item.href : activeModule === item.id;
        const cls = `group relative w-9 h-9 flex items-center justify-center transition-all duration-150 ${
          isActive ? 'text-primary bg-primary/10 border-l-2 border-primary -ml-px' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        }`;
        const tooltip = (
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-[10px] font-mono text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {item.label}
          </div>
        );
        if (item.href) {
          return (
            <Link key={item.id} to={item.href} title={item.label} className={cls}>
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {tooltip}
            </Link>
          );
        }
        return (
          <button key={item.id} onClick={() => onModuleChange(item.id)} title={item.label} className={cls}>
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            {tooltip}
          </button>
        );
      })}
    </div>
  );
}