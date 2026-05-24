import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Terminal, TrendingUp, CreditCard, Briefcase, BookOpen, AlertCircle, Cpu, Plus, CheckCircle2, Clock, Shield } from 'lucide-react';
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

      {/* OpenClaw Task Queue Preview */}
      <OpenClawTaskQueuePreview />

      {/* Main Dashboard */}
      <VeridanCoreBranchDashboard />
    </div>
  );
}

// ── OpenClaw Task Queue Preview Component ──────────────────────────────────

function OpenClawTaskQueuePreview() {
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem('openclaw_task_queue_preview');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const handleCreateTask = useCallback(() => {
    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const newTask = {
      taskId,
      taskType: 'SAFE_PREVIEW_ONLY',
      title: `OpenClaw Preview Task ${tasks.length + 1}`,
      status: 'DRAFT',
      riskLevel: 'LOW',
      createdAt: new Date().toISOString(),
      auditNote: 'Local preview only — no execution, no dispatch, no token access, no browser automation, no filesystem writes',
    };

    const updated = [newTask, ...tasks];
    if (updated.length > 10) updated.length = 10; // cap at 10
    setTasks(updated);

    try {
      localStorage.setItem('openclaw_task_queue_preview', JSON.stringify(updated));
    } catch { /* quota */ }
  }, [tasks]);

  const statusConfig = {
    DRAFT: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
    READY_FOR_REVIEW: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
    APPROVED_PREVIEW: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    REJECTED: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  };

  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide">OpenClaw Task Queue Preview</h2>
            <p className="text-[9px] text-slate-500 mt-1 font-mono">localStorage-only tasks — no execution, no dispatch, no token access</p>
          </div>
          <button
            type="button"
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> CREATE SAFE OPENCLAW TASK PREVIEW
          </button>
        </div>

        {/* Task list */}
        {tasks.length > 0 ? (
          <div className="grid gap-2">
            {tasks.map((task) => {
              const cfg = statusConfig[task.status] || statusConfig.DRAFT;
              const Icon = cfg.icon;
              return (
                <div key={task.taskId} className={`border rounded-sm p-3 ${cfg.border} ${cfg.bg} space-y-1.5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold text-slate-100 break-words">{task.title}</div>
                        <div className="text-[7px] text-slate-500 font-mono mt-0.5 space-x-2">
                          <span>{task.taskId}</span>
                          <span>·</span>
                          <span className={`font-bold ${cfg.color}`}>{task.status}</span>
                          <span>·</span>
                          <span>{task.riskLevel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[6px] text-slate-500 shrink-0 text-right font-mono">
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  {task.auditNote && (
                    <div className="text-[7px] text-slate-400 font-mono pl-5">{task.auditNote}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-border/40 rounded-sm p-4 text-[8px] text-slate-400 text-center">
            No OpenClaw preview tasks yet. Click CREATE SAFE OPENCLAW TASK PREVIEW to add one.
          </div>
        )}
      </div>
    </div>
  );
}