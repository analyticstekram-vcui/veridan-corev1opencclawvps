/**
 * ObsidianWorkflowStatusCard
 * Compact status showing the 6-step controlled Obsidian workflow.
 * Uses localStorage keys only, no live execution, no external calls.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const WORKFLOW_STEPS = [
  { key: 'task_created', label: 'Draft task created', storageKey: 'veridan_openclaw_task_queue' },
  { key: 'preview_sent', label: 'Preview bridge sent', storageKey: 'veridan_obsidian_vault_plans' },
  { key: 'draft_generated', label: 'Draft generated', storageKey: 'veridan_obsidian_drafts' },
  { key: 'draft_approved', label: 'Draft approved', storageKey: 'veridan_obsidian_drafts' },
  { key: 'write_attempted', label: 'Controlled write attempted', storageKey: 'veridan_obsidian_write_audits' },
  { key: 'audit_saved', label: 'Audit record saved', storageKey: 'veridan_obsidian_write_audits' },
];

function getWorkflowState() {
  const state = {
    task_created: false,
    preview_sent: false,
    draft_generated: false,
    draft_approved: false,
    write_attempted: false,
    audit_saved: false,
  };

  try {
    // 1. Task created: check task queue for OBSIDIAN tasks
    const tasks = JSON.parse(localStorage.getItem('veridan_openclaw_task_queue') || '[]');
    if (tasks.some(t => t.source === 'OBSIDIAN_WORKBENCH')) {
      state.task_created = true;
    }

    // 2. Preview sent: check vault plans exist
    const plans = JSON.parse(localStorage.getItem('veridan_obsidian_vault_plans') || '[]');
    if (plans.length > 0) {
      state.preview_sent = true;
    }

    // 3. Draft generated: check drafts exist
    const drafts = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
    if (drafts.length > 0) {
      state.draft_generated = true;
    }

    // 4. Draft approved: check if any draft is APPROVED
    if (drafts.some(d => d.approvalStatus === 'APPROVED')) {
      state.draft_approved = true;
    }

    // 5 & 6. Write attempted and audit saved: check write audits
    const audits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');
    if (audits.length > 0) {
      state.write_attempted = true;
      // Audit saved if most recent one exists
      if (audits[0]) {
        state.audit_saved = true;
      }
    }
  } catch { /* ignore */ }

  return state;
}

export default function ObsidianWorkflowStatusCard() {
  const [state, setState] = useState(getWorkflowState());

  useEffect(() => {
    setState(getWorkflowState());
    // Recheck on interval
    const interval = setInterval(() => {
      setState(getWorkflowState());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = Object.values(state).filter(Boolean).length;
  const progressPercent = (completedCount / WORKFLOW_STEPS.length) * 100;

  return (
    <div className="border border-border/40 rounded-sm bg-card p-4 space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
        Obsidian Workflow Progress
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-1.5">
        {WORKFLOW_STEPS.map((step, i) => {
          const isComplete = state[step.key];
          return (
            <div key={step.key} className="flex items-center gap-2">
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={`text-[8px] font-mono ${isComplete ? 'text-slate-200' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status footer */}
      <div className="text-[7px] text-slate-500 pt-2 border-t border-border/20">
        {completedCount === 0 && 'Start at Obsidian Workbench'}
        {completedCount > 0 && completedCount < 6 && `${completedCount}/6 steps complete`}
        {completedCount === 6 && '✓ Workflow complete'}
      </div>
    </div>
  );
}