/**
 * CodexTasksPanel — localStorage-only Codex task draft tracker.
 * Reads 1 localStorage key, stores task drafts, automatic safety evaluation.
 * No Codex execution, shell commands, GitHub calls, repo mutations, or external APIs.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download } from 'lucide-react';

const STORAGE_KEY_PROPOSED_ACTIONS = 'veridanAiProposedActions';
const CODEX_TASKS_KEY = 'veridanAiCodexTaskDrafts';
const MAX_RECORDS = 100;

const TARGET_REPOS = [
  'veridan-core',
  'veridan-core-base44-export',
  'openclaw-integration',
  'docs-only',
  'Not Decided',
];

const TARGET_AREAS = [
  'Trading',
  'Public Credit',
  'Business Formation',
  'AI Command Center',
  'OpenClaw Governance',
  'Shared Components',
  'Docs',
  'Other',
];

const TASK_TYPES = [
  'Refactor',
  'Bug Fix',
  'Create Component',
  'Write Tests',
  'Documentation',
  'Repo Cleanup',
  'Safety Review',
  'Other',
];

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TASK_RISKS = ['Low', 'Medium', 'High', 'Critical'];

const TASK_STATUSES = ['DRAFT', 'NEEDS_REVIEW', 'APPROVED_FOR_MANUAL_CODEX_RUN', 'REJECTED', 'DISABLED'];

const STATUS_COLORS = {
  'DRAFT': 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'NEEDS_REVIEW': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'APPROVED_FOR_MANUAL_CODEX_RUN': 'text-primary border-primary/30 bg-primary/5',
  'REJECTED': 'text-destructive border-destructive/30 bg-destructive/5',
  'DISABLED': 'text-slate-500 border-slate-500/30 bg-slate-500/5',
};

const RISK_COLORS = {
  'Low': 'text-emerald-400',
  'Medium': 'text-amber-400',
  'High': 'text-orange-400',
  'Critical': 'text-destructive',
};

const SAFETY_CLAIMS = [
  'Codex task drafts only',
  'No Codex execution',
  'No shell commands',
  'No GitHub calls',
  'No repo mutation',
  'No deployment',
  'No OpenClaw dispatch',
  'No external API mutation',
  'No credential handling',
  'Browser-only export',
];

const BLANK = {
  taskTitle: '',
  sourceProposedActionId: '',
  targetRepo: 'Not Decided',
  targetArea: 'Other',
  taskType: 'Refactor',
  taskPriority: 'Medium',
  taskRisk: 'Low',
  codexInstruction: '',
  preservationRules: '',
  forbiddenActions: '',
  taskStatus: 'DRAFT',
  operatorNotes: '',
};

function loadCodexTasks() {
  try { return JSON.parse(localStorage.getItem(CODEX_TASKS_KEY) || '[]'); } catch { return []; }
}

function saveCodexTasks(tasks) {
  try { localStorage.setItem(CODEX_TASKS_KEY, JSON.stringify(tasks)); } catch {}
}

function loadProposedActions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PROPOSED_ACTIONS) || '[]'); } catch { return []; }
}

function evaluateTask(form) {
  const isCriticalWithApproval =
    form.taskRisk === 'Critical' && form.taskStatus === 'APPROVED_FOR_MANUAL_CODEX_RUN';

  const finalStatus = isCriticalWithApproval ? 'NEEDS_REVIEW' : form.taskStatus;
  const warning = isCriticalWithApproval
    ? 'CRITICAL risk Codex tasks require separate operator review and cannot be directly approved for manual Codex run.'
    : null;

  return { finalStatus, warning };
}

export default function CodexTasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [proposedActions, setProposedActions] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setTasks(loadCodexTasks());
    setProposedActions(loadProposedActions());
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.taskTitle.trim()) return;

    const { finalStatus, warning } = evaluateTask(form);

    const record = {
      ...form,
      taskStatus: finalStatus,
      taskWarning: warning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...tasks].slice(0, MAX_RECORDS);
    setTasks(updated);
    saveCodexTasks(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveCodexTasks(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AI_CODEX_TASK_DRAFTS',
      codexTaskDrafts: tasks,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-codex-task-drafts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total: tasks.length,
    draft: tasks.filter(t => t.taskStatus === 'DRAFT').length,
    needsReview: tasks.filter(t => t.taskStatus === 'NEEDS_REVIEW').length,
    approved: tasks.filter(t => t.taskStatus === 'APPROVED_FOR_MANUAL_CODEX_RUN').length,
    rejected: tasks.filter(t => t.taskStatus === 'REJECTED').length,
    disabled: tasks.filter(t => t.taskStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Codex Task Drafts</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only task tracker · No execution · No shell commands</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. Codex task drafts do not execute Codex, run shell commands, call GitHub, mutate repos, or deploy code.</div>
          <div className="text-[8px] text-destructive/70">No Codex execution · No shell commands · No GitHub calls · No repo mutation · No deployment · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Codex Task Drafts Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
          {[
            { label: 'Total', value: counts.total, color: 'text-slate-200' },
            { label: 'Draft', value: counts.draft, color: 'text-slate-400' },
            { label: 'Needs Review', value: counts.needsReview, color: 'text-amber-400' },
            { label: 'Approved', value: counts.approved, color: 'text-primary' },
            { label: 'Rejected', value: counts.rejected, color: 'text-destructive' },
            { label: 'Disabled', value: counts.disabled, color: 'text-slate-500' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {[
            { label: 'Codex Execution', value: 'DISABLED' },
            { label: 'Shell Commands', value: 'DISABLED' },
            { label: 'GitHub Mutation', value: 'DISABLED' },
            { label: 'Repo Mutation', value: 'DISABLED' },
            { label: 'Deployment', value: 'DISABLED' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[8px] font-bold font-mono text-destructive">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-4">
          <div className="text-[9px] font-bold uppercase text-slate-300">New Codex Task Draft</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Task Title *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.taskTitle}
                onChange={e => set('taskTitle', e.target.value)}
                placeholder="e.g. Refactor Trading Module Status Display"
              />
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Source Proposed Action (optional)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.sourceProposedActionId} onChange={e => set('sourceProposedActionId', e.target.value)}>
                <option value="">— None —</option>
                {proposedActions.map(a => (
                  <option key={a.id} value={a.id}>{a.actionTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Repo</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetRepo} onChange={e => set('targetRepo', e.target.value)}>
                {TARGET_REPOS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Area</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetArea} onChange={e => set('targetArea', e.target.value)}>
                {TARGET_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Task Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.taskType} onChange={e => set('taskType', e.target.value)}>
                {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Task Priority</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.taskPriority} onChange={e => set('taskPriority', e.target.value)}>
                {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Task Risk</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.taskRisk} onChange={e => set('taskRisk', e.target.value)}>
                {TASK_RISKS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Task Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.taskStatus} onChange={e => set('taskStatus', e.target.value)}>
                {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Codex Instruction</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.codexInstruction}
                onChange={e => set('codexInstruction', e.target.value)}
                placeholder="What should Codex do? (e.g., refactor component, add tests, etc.)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Preservation Rules</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.preservationRules}
                onChange={e => set('preservationRules', e.target.value)}
                placeholder="What must be preserved? (e.g., API signatures, data structures, etc.)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Forbidden Actions</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.forbiddenActions}
                onChange={e => set('forbiddenActions', e.target.value)}
                placeholder="What should NOT be done? (e.g., no breaking changes, no new dependencies, etc.)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Operator Notes</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.operatorNotes}
                onChange={e => set('operatorNotes', e.target.value)}
                placeholder="Additional planning notes or context"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.taskTitle.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Codex Task Draft
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No Codex task drafts yet. Click "+ New Task" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Codex Task Drafts</div>
            <div className="text-[8px] text-slate-500">{tasks.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Title', 'Repo', 'Area', 'Type', 'Priority', 'Risk', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{t.taskTitle}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[120px] truncate">{t.targetRepo}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{t.targetArea}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[100px] truncate">{t.taskType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{t.taskPriority}</td>
                    <td className={`px-3 py-2 whitespace-nowrap font-bold ${RISK_COLORS[t.taskRisk] || 'text-slate-400'}`}>{t.taskRisk}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[t.taskStatus] || ''}`}>
                        {t.taskStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {t.taskWarning && (
                        <AlertTriangle className="w-3 h-3 text-amber-400" title={t.taskWarning} />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleRemove(t.id)}
                        className="text-[7px] text-destructive/50 hover:text-destructive transition-colors">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>

    </div>
  );
}