import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Terminal, TrendingUp, CreditCard, Briefcase, BookOpen } from 'lucide-react';
import VeridanCoreBranchDashboard from '../components/dashboard/VeridanCoreBranchDashboard';

export default function Dashboard() {
  const navItems = [
    { label: 'Control Room', path: '/control-room', icon: Radio },
    { label: 'OpenClaw Panel', path: '/openclaw-control', icon: Terminal },
    { label: 'Trading Operations', path: '/trading-operations', icon: TrendingUp },
    { label: 'Credit / Public Side', path: '/credit-public-side', icon: CreditCard },
    { label: 'Business Operations', path: '/business-operations', icon: Briefcase },
    { label: 'Knowledge Vault', path: '/knowledge-vault', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Quick Navigation Section */}
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-secondary/30 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors rounded-sm text-center"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-mono font-bold uppercase text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <VeridanCoreBranchDashboard />
    </div>
  );
}