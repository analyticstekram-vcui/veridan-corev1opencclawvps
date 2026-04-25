import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  CreditCard,
  Building2,
  TrendingUp,
  Lock,
  ScrollText,
  Settings
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Terminal, label: 'AI Command', id: 'command' },
  { icon: CreditCard, label: 'Personal Credit', id: 'personal' },
  { icon: Building2, label: 'Business Credit', id: 'business' },
  { icon: TrendingUp, label: 'Trading', id: 'trading' },
  { icon: Lock, label: 'Obsidian Vault', id: 'vault' },
  { icon: ScrollText, label: 'Logs', id: 'logs' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function LeftIconRail({ activeModule, onModuleChange }) {
  return (
    <div className="w-11 bg-card border-r border-border flex flex-col items-center py-2 gap-0.5 shrink-0 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onModuleChange(item.id)}
            title={item.label}
            className={`
              group relative w-9 h-9 flex items-center justify-center transition-all duration-150
              ${isActive
                ? 'text-primary bg-primary/10 border-l-2 border-primary -ml-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }
            `}
          >
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-[10px] font-mono text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}