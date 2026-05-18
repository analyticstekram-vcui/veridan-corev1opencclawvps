import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Terminal, TrendingUp, CreditCard, Briefcase, BookOpen, AlertCircle, Cpu } from 'lucide-react';
import VeridanCoreBranchDashboard from '../components/dashboard/VeridanCoreBranchDashboard';
import CurrentBuildStateCard from '../components/governance/CurrentBuildStateCard';
import GovernanceControlIndex from '../components/governance/GovernanceControlIndex';

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
      {/* AI Operator Console Banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Cpu className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <h1 className="text-[12px] font-mono font-bold uppercase text-amber-500 tracking-wide">AI Operator Console — Internal Use Only</h1>
            <p className="text-[10px] font-mono text-amber-400/70 mt-1">This system is designed for AI-assisted operator workflows. It is not a public client portal.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-1 text-[7px] font-mono font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-sm">AI_OPERATOR_ONLY</span>
            <span className="px-2 py-1 text-[7px] font-mono font-bold uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded-sm">HUMAN_REVIEW_REQUIRED</span>
          </div>
        </div>
      </div>

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

      {/* Current Build State */}
      <CurrentBuildStateCard />

      {/* Governance Control Index */}
      <GovernanceControlIndex />

      {/* Main Dashboard */}
      <VeridanCoreBranchDashboard />
    </div>
  );
}