/**
 * ObsidianWorkflowStatusCard
 * Production operator workflow: 6-step progress card.
 * Task Created → Task Approved → Preview Generated → Draft Approved → Vault Write Completed → Audit Saved
 * Uses localStorage keys only, no live execution, no external calls.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const WORKFLOW_STEPS = [
  { key: 'task_created', label: 'Task Created', check: (data) => data.obsidianTask },
  { key: 'task_approved', label: 'Task Approved', check: (data) => data.obsidianTask?.approvalStatus === 'APPROVED' },
  { key: 'preview_generated', label: 'Preview Generated', check: (data) => data.vaultPlans.length > 0 },
  { key: 'draft_approved', label: 'Draft Approved', check: (data) => data.drafts.some(d => d.approvalStatus === 'APPROVED') },
  { key: 'write_completed', label: 'Vault Write Completed', check: (data) => data.writeAudits.some(a => a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY') },
  { key: 'audit_saved', label: 'Audit Saved', check: (data) => data.writeAudits.length > 0 },
];

function getWorkflowData() {
  try {
    const tasks = JSON.parse(localStorage.getItem('veridan_openclaw_task_queue') || '[]');
    const obsidianTask = tasks.find(t => t.source === 'OBSIDIAN_WORKBENCH');
    const vaultPlans = JSON.parse(localStorage.getItem('veridan_obsidian_vault_plans') || '[]');
    const drafts = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
    const writeAudits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');

    return { obsidianTask, vaultPlans, drafts, writeAudits };
  } catch {
    return { obsidianTask: null, vaultPlans: [], drafts: [], writeAudits: [] };
  }
}

function getWorkflowState(data) {
  const state = {};
  for (const step of WORKFLOW_STEPS) {
    state[step.key] = step.check(data);
  }
  return state;
}

export default function ObsidianWorkflowStatusCard() {
  const [data, setData] = useState(getWorkflowData());
  const [state, setState] = useState(() => getWorkflowState(getWorkflowData()));

  useEffect(() => {
    const updateState = () => {
      const freshData = getWorkflowData();
      setData(freshData);
      setState(getWorkflowState(freshData));
    };
    updateState();
    const interval = setInterval(updateState, 2000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = Object.values(state).filter(Boolean).length;
  const progressPercent = (completedCount / WORKFLOW_STEPS.length) * 100;

  return (
    <div className="border border-border/40 rounded-sm bg-card p-4 space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
        Obsidian Production Workflow
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
        {WORKFLOW_STEPS.map((step) => {
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
        {completedCount === 6 && '✓ Workflow complete — evidence audited'}
      </div>
    </div>
  );
}