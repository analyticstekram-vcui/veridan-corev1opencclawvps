/**
 * ObsidianWorkbenchPreview
 * Preview-only Obsidian vault planning from OpenClaw Task Queue items.
 * No filesystem writes, no OpenClaw calls, no browser automation, no token access, no execution/dispatch.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertTriangle, Folder, FileText, Clock, ArrowRight, Zap } from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';
import ObsidianTaskPlanVerification from '../components/obsidian-vault/ObsidianTaskPlanVerification';

const VAULT_FOLDERS = [
  'Veridan Core/00_Master_Index.md',
  'Veridan Core/01_OpenClaw/',
  'Veridan Core/02_Trading/',
  'Veridan Core/03_Public_Credit/',
  'Veridan Core/04_Business_Formation/',
  'Veridan Core/05_Trust_and_LLC/',
  'Veridan Core/06_Audit_Evidence/',
  'Veridan Core/07_API_and_Credentials/',
  'Veridan Core/08_SOPs/',
  'Veridan Core/09_Risk_and_Governance/',
];

const VAULT_TASKS = [
  'Create Veridan Core Master Index',
  'Create OpenClaw SOP',
  'Create Trading Module SOP',
  'Create Public Credit Module SOP',
  'Create Business Formation SOP',
  'Create API and Credentials Inventory Template',
  'Create Execution Safety Policy',
];

const REQUIRED_SOPS = [
  'OpenClaw Command Execution SOP',
  'Emergency Rollback SOP',
  'Credential Rotation SOP',
  'Audit Event Escalation SOP',
  'Trading Safety Boundaries SOP',
  'Credit Line Management SOP',
  'Business Entity Formation SOP',
];

// ── VaultStatusCard ────────────────────────────────────────────────────────

function VaultStatusCard() {
  return (
    <div className="border border-primary/40 bg-primary/5 rounded-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Obsidian Vault Status
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">Preview-only planning mode</div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['folders', `${VAULT_FOLDERS.length}`],
          ['tasks', `${VAULT_TASKS.length}`],
          ['missing SOPs', `${REQUIRED_SOPS.length}`],
          ['execution', 'NOT_EXECUTED'],
        ].map(([k, v]) => (
          <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2.5 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
            <div className="text-[8px] font-bold font-mono text-slate-200">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProposedFolderMap ──────────────────────────────────────────────────────

function ProposedFolderMap() {
  return (
    <div className="border border-border/40 rounded-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Folder className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">
          Proposed Folder Map
        </div>
      </div>
      <div className="space-y-1">
        {VAULT_FOLDERS.map((folder, i) => (
          <div key={i} className="flex items-center gap-2 text-[8px] font-mono text-slate-400 pl-5">
            <span className="text-slate-600">├─</span>
            <span>{folder}</span>
          </div>
        ))}
      </div>
      <div className="text-[7px] text-slate-500 italic pt-2 border-t border-border/20">
        Preview-only structure · no filesystem write performed
      </div>
    </div>
  );
}

// ── MissingSOPsList ────────────────────────────────────────────────────────

function MissingSOPsList() {
  return (
    <div className="border border-border/40 rounded-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">
          Missing SOPs
        </div>
      </div>
      <div className="space-y-1">
        {REQUIRED_SOPS.map((sop, i) => (
          <div key={i} className="flex items-center gap-2 text-[8px] text-slate-400 font-mono pl-5">
            <span className="text-amber-400/50">⊘</span>
            <span>{sop}</span>
          </div>
        ))}
      </div>
      <div className="text-[7px] text-slate-500 italic pt-2 border-t border-border/20">
        {REQUIRED_SOPS.length} SOPs required before production execution
      </div>
    </div>
  );
}

// ── PendingAITasks ────────────────────────────────────────────────────────

function PendingAITasks() {
  return (
    <div className="border border-border/40 rounded-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">
          Pending AI Tasks
        </div>
      </div>
      <div className="space-y-1">
        {VAULT_TASKS.map((task, i) => (
          <div key={i} className="flex items-center gap-2 text-[8px] text-slate-400 font-mono pl-5">
            <span className="text-slate-600">→</span>
            <span>{task}</span>
          </div>
        ))}
      </div>
      <div className="text-[7px] text-slate-500 italic pt-2 border-t border-border/20">
        Tasks queued for vault SOP generation
      </div>
    </div>
  );
}

// ── VaultPlanCard ─────────────────────────────────────────────────────────

function VaultPlanCard({ plan }) {
  if (!plan) {
    return (
      <div className="border border-border/40 rounded-sm p-5 text-[8px] text-slate-500 text-center py-8">
        No vault plan generated yet. Click GENERATE OBSIDIAN VAULT PLAN to create one.
      </div>
    );
  }

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-bold uppercase text-primary tracking-widest">
            Generated Vault Plan
          </div>
          <div className="text-[7px] font-mono text-slate-500 mt-1 space-y-0.5">
            <div>planId: <span className="text-slate-300">{plan.planId}</span></div>
            <div>createdAt: <span className="text-slate-300">{new Date(plan.createdAt).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Status chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['FILESYSTEM_WRITE', plan.filesystemWrite, 'text-destructive'],
          ['OPENCLAW_CALL', plan.openclawCall, 'text-destructive'],
          ['EXECUTION', plan.executionStatus, 'text-destructive'],
          ['APPROVAL', plan.approvalStatus, 'text-primary'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-secondary/30 border border-border/30 rounded-sm px-2.5 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">{label}</div>
            <div className={`text-[7px] font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Folders & tasks summary */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <div className="text-[7px] uppercase font-bold text-slate-400 mb-1.5">Folders ({plan.folders.length})</div>
          <div className="space-y-0.5">
            {plan.folders.slice(0, 3).map((f, i) => (
              <div key={i} className="text-[7px] font-mono text-slate-400">{f}</div>
            ))}
            {plan.folders.length > 3 && (
              <div className="text-[7px] font-mono text-slate-500 italic">+{plan.folders.length - 3} more</div>
            )}
          </div>
        </div>
        <div>
          <div className="text-[7px] uppercase font-bold text-slate-400 mb-1.5">Tasks ({plan.tasks.length})</div>
          <div className="space-y-0.5">
            {plan.tasks.slice(0, 3).map((t, i) => (
              <div key={i} className="text-[7px] font-mono text-slate-400">{t}</div>
            ))}
            {plan.tasks.length > 3 && (
              <div className="text-[7px] font-mono text-slate-500 italic">+{plan.tasks.length - 3} more</div>
            )}
          </div>
        </div>
      </div>

      <div className="text-[7px] text-slate-500 italic pt-2 border-t border-border/20">
        Preview-only plan · no filesystem write · source: {plan.source}
      </div>
    </div>
  );
}

// ── AuditEvidenceCard ──────────────────────────────────────────────────────

function AuditEvidenceCard() {
  return (
    <div className="border border-border/40 rounded-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">
            Audit / Evidence
          </div>
        </div>
        <Link
          to="/audit-evidence"
          className="flex items-center gap-1 text-[7px] text-slate-400 hover:text-slate-200 transition-colors font-mono"
        >
          View Evidence <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="space-y-1 text-[8px] font-mono text-slate-400">
        <div>✓ Vault plans stored in localStorage</div>
        <div>✓ No execution, dispatch, or filesystem writes performed</div>
        <div>✓ No OpenClaw calls made</div>
        <div>✓ No token access or external account access</div>
        <div>✓ All operations preview-only</div>
      </div>
      <div className="text-[7px] text-slate-500 italic pt-2 border-t border-border/20">
        Generated vault plans available in Developer Diagnostics section
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ObsidianWorkbenchPreview() {
  const [latestPlan, setLatestPlan] = useState(null);
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Load latest plan on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('veridan_obsidian_vault_plans');
      if (stored) {
        const plans = JSON.parse(stored);
        if (Array.isArray(plans) && plans.length > 0) {
          setLatestPlan(plans[0]);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleGenerateVaultPlan = useCallback(() => {
    const planId = `VAULT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const plan = {
      planId,
      createdAt: new Date().toISOString(),
      status: 'PREVIEW_ONLY',
      executionStatus: 'NOT_EXECUTED',
      filesystemWrite: 'DISABLED',
      openclawCall: 'NOT_SENT',
      approvalStatus: 'READY_FOR_REVIEW',
      source: 'OBSIDIAN_WORKBENCH_PREVIEW',
      folders: VAULT_FOLDERS,
      tasks: VAULT_TASKS,
    };

    try {
      const stored = localStorage.getItem('veridan_obsidian_vault_plans') || '[]';
      const plans = JSON.parse(stored);
      plans.unshift(plan);
      if (plans.length > 10) plans.length = 10;
      localStorage.setItem('veridan_obsidian_vault_plans', JSON.stringify(plans));
      setLatestPlan(plan);
    } catch { /* quota */ }
  }, []);

  const handleBuildTaskPlan = useCallback(() => {
    const ts = new Date().toISOString();
    const tasks = [];

    // Missing SOPs as tasks
    REQUIRED_SOPS.forEach((sop, i) => {
      tasks.push({
        taskId: `TASK-${Date.now().toString(36).toUpperCase()}-SOP-${i}`,
        source: 'OBSIDIAN_WORKBENCH',
        taskType: 'CREATE_SOP',
        title: sop,
        description: `Create standard operating procedure: ${sop}`,
        targetFolder: 'Veridan Core/08_SOPs/',
        proposedFileName: `${sop.toLowerCase().replace(/\s+/g, '_')}.md`,
        status: 'PROPOSED_NOT_EXECUTED',
        approvalState: 'REQUIRED',
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        openclawCall: 'NOT_SENT',
        filesystemWrite: 'DISABLED',
        createdAt: ts,
      });
    });

    // Pending AI tasks
    VAULT_TASKS.forEach((task, i) => {
      tasks.push({
        taskId: `TASK-${Date.now().toString(36).toUpperCase()}-PLAN-${i}`,
        source: 'OBSIDIAN_WORKBENCH',
        taskType: 'VAULT_SETUP',
        title: task,
        description: `Vault setup task: ${task}`,
        targetFolder: 'Veridan Core/',
        proposedFileName: `${task.toLowerCase().replace(/\s+/g, '_')}.md`,
        status: 'PROPOSED_NOT_EXECUTED',
        approvalState: 'REQUIRED',
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        openclawCall: 'NOT_SENT',
        filesystemWrite: 'DISABLED',
        createdAt: ts,
      });
    });

    try {
      const stored = localStorage.getItem('veridan_openclaw_task_queue') || '[]';
      const allTasks = JSON.parse(stored);
      allTasks.unshift(...tasks);
      if (allTasks.length > 100) allTasks.length = 100;
      localStorage.setItem('veridan_openclaw_task_queue', JSON.stringify(allTasks));
      setBuildSuccess(true);
      setTimeout(() => setBuildSuccess(false), 3000);
    } catch { /* quota */ }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Knowledge Management
            </div>
            <h1 className="text-lg font-bold text-foreground">Obsidian Workbench Preview</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Preview-only vault planning from OpenClaw Task Queue — no filesystem writes · no execution
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold uppercase rounded-sm">PREVIEW_ONLY</span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">NO_FILESYSTEM_WRITE</span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">NO_EXECUTION</span>
          </div>
        </div>
      </div>

      {/* Safety banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-2 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide">
          PREVIEW-ONLY VAULT PLANNING — NO FILESYSTEM WRITES · NO OPENCLAW CALLS · NO TOKEN ACCESS
        </span>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5">

        {/* Primary buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGenerateVaultPlan}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 rounded-sm transition-colors font-bold uppercase tracking-widest text-[10px]"
          >
            <Clock className="w-5 h-5" /> GENERATE OBSIDIAN VAULT PLAN
          </button>
          <button
            type="button"
            onClick={handleBuildTaskPlan}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 rounded-sm transition-colors font-bold uppercase tracking-widest text-[10px]"
          >
            <Zap className="w-5 h-5" /> BUILD OBSIDIAN TASK PLAN
          </button>
        </div>

        {/* Success message */}
        {buildSuccess && (
          <div className="bg-primary/10 border border-primary/30 rounded-sm p-3 text-[8px] font-mono text-primary">
            ✓ OBSIDIAN TASK PLAN CREATED — NO FILES WRITTEN
          </div>
        )}

        {/* 1. Vault Status */}
        <VaultStatusCard />

        {/* 2. Proposed Folder Map */}
        <ProposedFolderMap />

        {/* 3. Missing SOPs */}
        <MissingSOPsList />

        {/* 4. Pending AI Tasks */}
        <PendingAITasks />

        {/* 5. Generated Vault Plan */}
        <div>
          <div className="text-[9px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Latest Generated Plan</div>
          <VaultPlanCard plan={latestPlan} />
        </div>

        {/* 6. Audit / Evidence */}
        <AuditEvidenceCard />

        {/* 7. Verification Panel */}
        <div className="border border-border/40 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-card hover:bg-secondary/20 transition-colors"
          >
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Verification Panel</span>
            {showVerification
              ? <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              : <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
          </button>

          {showVerification && (
            <div className="border-t border-border/40 bg-card p-5">
              <ObsidianTaskPlanVerification />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}