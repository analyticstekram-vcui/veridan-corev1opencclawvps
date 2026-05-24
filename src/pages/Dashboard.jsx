import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Terminal, TrendingUp, CreditCard, Briefcase, BookOpen, AlertCircle, Cpu, Plus, CheckCircle2, Shield, ArrowRight, Clock } from 'lucide-react';
import OpenClawTaskQueueItem from '../components/dashboard/OpenClawTaskQueueItem';
import VeridanCoreBranchDashboard from '../components/dashboard/VeridanCoreBranchDashboard';
import CurrentBuildStateCard from '../components/governance/CurrentBuildStateCard';
import CurrentCapabilitiesBoundary from '../components/governance/CurrentCapabilitiesBoundary';
import FinalGovernanceBaselineLockSummary from '../components/governance/FinalGovernanceBaselineLockSummary';
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

      {/* Current Capabilities Boundary */}
      <CurrentCapabilitiesBoundary />

      {/* Final Governance Baseline Lock Summary */}
      <FinalGovernanceBaselineLockSummary />

      {/* Governance Control Index */}
      <GovernanceControlIndex />

      {/* Unified Status Card */}
      <VeridanCoreUnifiedStatusCard />

      {/* OpenClaw Task Queue Preview */}
      <OpenClawTaskQueuePreview />

      {/* Main Dashboard */}
      <VeridanCoreBranchDashboard />
    </div>
  );
}

// ── OpenClaw Task Queue Preview Component ──────────────────────────────────

function VeridanCoreUnifiedStatusCard() {
  const [taskCount, setTaskCount] = useState(0);
  const [obsidianStatus, setObsidianStatus] = useState('IDLE');

  useEffect(() => {
    try {
      const tasks = JSON.parse(localStorage.getItem('veridan_openclaw_task_queue') || '[]');
      setTaskCount(tasks.length);
      const obsidianTasks = tasks.filter(t => t.source === 'OBSIDIAN_WORKBENCH');
      setObsidianStatus(obsidianTasks.length > 0 ? 'TASKS_GENERATED' : 'IDLE');
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OpenClaw Safe Review */}
        <Link to="/openclaw-control"
          className="border border-primary/40 bg-primary/5 rounded-sm p-4 space-y-2 hover:bg-primary/10 transition-colors">
          <div className="text-[8px] font-bold uppercase text-primary tracking-widest">OpenClaw Safe Review</div>
          <div className="flex items-baseline gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[9px] font-mono text-slate-300">READY</span>
          </div>
          <div className="text-[7px] text-slate-500">→ Control Room</div>
        </Link>

        {/* Obsidian Workbench */}
        <Link to="/obsidian-workbench-preview"
          className={`border rounded-sm p-4 space-y-2 hover:bg-secondary/10 transition-colors ${
            obsidianStatus === 'TASKS_GENERATED'
              ? 'border-accent/40 bg-accent/5'
              : 'border-border/40 bg-card'
          }`}>
          <div className={`text-[8px] font-bold uppercase tracking-widest ${
            obsidianStatus === 'TASKS_GENERATED' ? 'text-accent' : 'text-slate-400'
          }`}>Obsidian Workbench</div>
          <div className="flex items-baseline gap-2">
            <Clock className={`w-3.5 h-3.5 shrink-0 ${obsidianStatus === 'TASKS_GENERATED' ? 'text-accent' : 'text-slate-400'}`} />
            <span className="text-[9px] font-mono text-slate-300">{obsidianStatus}</span>
          </div>
          <div className="text-[7px] text-slate-500">→ Build Task Plan</div>
        </Link>

        {/* Task Queue */}
        <Link to="/openclaw-control"
          className="border border-border/40 bg-card rounded-sm p-4 space-y-2 hover:bg-secondary/10 transition-colors">
          <div className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Task Queue</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-primary">{taskCount}</span>
            <span className="text-[7px] text-slate-500">tasks</span>
          </div>
          <div className="text-[7px] text-slate-500">→ View Queue</div>
        </Link>

        {/* Next Action */}
        <div className="border border-amber-500/40 bg-amber-500/5 rounded-sm p-4 space-y-2">
          <div className="text-[8px] font-bold uppercase text-amber-500 tracking-widest">Next Action</div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[8px] font-mono text-slate-300">
              {taskCount === 0 ? 'Create tasks' : 'Review queue'}
            </span>
          </div>
          <div className="text-[7px] text-slate-500">
            {taskCount === 0 ? 'Start with Obsidian' : 'Then approve'}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpenClawTaskQueuePreview() {
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem('veridan_openclaw_task_queue');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('veridan_openclaw_task_queue') || '[]');
        setTasks(stored);
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTasks = filter === 'All'
    ? tasks
    : tasks.filter(t => {
        const source = t.source || 'OPENCLAW';
        if (filter === 'Obsidian') return source === 'OBSIDIAN_WORKBENCH';
        if (filter === 'Trading') return source === 'TRADING_MODULE';
        if (filter === 'Credit') return source === 'CREDIT_MODULE';
        if (filter === 'Business') return source === 'BUSINESS_MODULE';
        if (filter === 'OpenClaw') return source === 'OPENCLAW';
        return true;
      });

  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide">OpenClaw Task Queue</h2>
            <p className="text-[9px] text-slate-500 mt-1 font-mono">localStorage-only tasks — no execution, no dispatch, no token access</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[8px] text-slate-500">Filter:</span>
            {['All', 'Obsidian', 'Trading', 'Credit', 'Business', 'OpenClaw'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[8px] font-mono font-bold uppercase rounded-sm border transition-colors ${
                  filter === f
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/40 bg-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {filteredTasks.length > 0 ? (
          <div className="grid gap-2">
            {filteredTasks.map((task) => (
              <OpenClawTaskQueueItem key={task.taskId} task={task} />
            ))}
          </div>
        ) : (
          <div className="border border-border/40 rounded-sm p-4 text-[8px] text-slate-400 text-center">
            {filter === 'All'
              ? 'No tasks yet. Go to Obsidian Workbench to build a task plan.'
              : `No ${filter} tasks. Switch filter to view other sources.`}
          </div>
        )}
      </div>
    </div>
  );
}