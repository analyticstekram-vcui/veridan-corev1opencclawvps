import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Radio, TrendingUp, CreditCard, Briefcase, BookOpen } from 'lucide-react';

export default function ModuleNav() {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Control Room', path: '/control-room', icon: Radio },
    { label: 'Trading', path: '/trading-operations', icon: TrendingUp },
    { label: 'Credit', path: '/credit-public-side', icon: CreditCard },
    { label: 'Business', path: '/business-operations', icon: Briefcase },
    { label: 'Knowledge', path: '/knowledge-vault', icon: BookOpen },
    { label: 'System Map', path: '/system-map', icon: Layers },
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