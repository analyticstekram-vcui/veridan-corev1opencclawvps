/**
 * OpenClawTasksPanel — localStorage-only OpenClaw task plan tracker.
 * Reads 4 localStorage keys, stores task plans, automatic safety evaluation.
 * No OpenClaw dispatch, MCP calls, browser automation, tool execution, or external APIs.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download } from 'lucide-react';

const STORAGE_KEYS = {
  PROPOSED_ACTIONS: 'veridanAiProposedActions',
  CODEX_TASKS: 'veridanAiCodexTaskDrafts',
  OPENCLAW_CHECKPOINT: 'openclawGovernanceDryRunChainCheckpointLockPhases43To49',
  EXECUTION_READINESS: 'openclawPhase50ExecutionReadinessBoundaryMap',
};

const OPENCLAW_TASKS_KEY = 'veridanAiOpenClawTaskPlans';
const MAX_RECORDS = 100;

const OPENCLAW_TASK_TYPES = [
  'Read Status',
  'Analyze Module',
  'Prepare Proposal',
  'Review Evidence',
  'Draft Codex Task',
  'TradingView MCP Planning',
  'Browser Automation Planning',
  'Other',
];

const TARGET_AREAS = [
  'Trading',
  'Public Credit',
  'Business Formation',
  'AI Command Center',
  'OpenClaw Governance',
  'Codex Workflow',
  'TradingView MCP',
  'Other',
];

const TOOL_MODES = [
  'No Tool',
  'Local Read Only',
  'MCP Planning Only',
  'Browser Planning Only',
  'Codex Planning Only',
];

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TASK_RISKS = ['Low', 'Medium', 'High', 'Critical'];

const TASK_STATUSES = ['DRAFT', 'NEEDS_REVIEW', 'APPROVED_FOR_PLANNING', 'REJECTED', 'DISABLED'];

const STATUS_COLORS = {
  'DRAFT': 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'NEEDS_REVIEW': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'APPROVED_FOR_PLANNING': 'text-primary border-primary/30 bg-primary/5',
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
  'OpenClaw task plans only',
  'No OpenClaw dispatch',
  'No MCP calls',
  'No browser automation',
  'No tool execution',
  'No Codex execution',
  'No external API mutation',
  'No backend mutation',
  'No credential handling',
  'Browser-only export',
];

const BLANK = {
  taskTitle: '',
  sourceProposedActionId: '',
  sourceCodexTaskDraftId: '',
  openClawTaskType: 'Read Status',
  targetArea: 'Other',
  toolMode: 'No Tool',
  taskPriority: 'Medium',
  taskRisk: 'Low',
  taskInstruction: '',
  requiredEvidence: '',
  forbiddenActions: '',
  taskStatus: 'DRAFT',
  operatorNotes: '',
};

function loadOpenClawTasks() {
  try { return JSON.parse(localStorage.getItem(OPENCLAW_TASKS_KEY) || '[]'); } catch { return []; }
}

function saveOpenClawTasks(tasks) {
  try { localStorage.setItem(OPENCLAW_TASKS_KEY, JSON.stringify(tasks)); } catch {}
}

function loadProposedActions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROPOSED_ACTIONS) || '[]'); } catch { return []; }
}

function loadCodexTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CODEX_TASKS) || '[]'); } catch { return []; }
}

function evaluateTask(form) {
  const isCriticalWithApproval =
    form.taskRisk === 'Critical' && form.taskStatus === 'APPROVED_FOR_PLANNING';

  const finalStatus = isCriticalWithApproval ? 'NEEDS_REVIEW' : form.taskStatus;
  const warning = isCriticalWithApproval
    ? 'CRITICAL risk OpenClaw tasks require separate operator review and cannot be directly approved for planning.'
    : null;

  return { finalStatus, warning };
}

export default function OpenClawTasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [proposedActions, setProposedActions] = useState([]);
  const [codexTasks, setCodexTasks] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setTasks(loadOpenClawTasks());
    setProposedActions(loadProposedActions());
    setCodexTasks(loadCodexTasks());
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
    saveOpenClawTasks(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveOpenClawTasks(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AI_OPENCLAW_TASK_PLANS',
      openClawTaskPlans: tasks,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-openclaw-task-plans-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total: tasks.length,
    draft: tasks.filter(t => t.taskStatus === 'DRAFT').length,
    needsReview: tasks.filter(t => t.taskStatus === 'NEEDS_REVIEW').length,
    approved: tasks.filter(t => t.taskStatus === 'APPROVED_FOR_PLANNING').length,
    rejected: tasks.filter(t => t.taskStatus === 'REJECTED').length,
    disabled: tasks.filter(t => t.taskStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">OpenClaw Task Plans</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only task tracker · No dispatch · No automation</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Plan'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. OpenClaw task plans do not dispatch OpenClaw, call MCP, automate browsers, run tools, or mutate systems.</div>
          <div className="text-[8px] text-destructive/70">No OpenClaw dispatch · No MCP calls · No browser automation · No tool execution · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">OpenClaw Task Plans Summary</div>
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
            { label: 'OpenClaw Dispatch', value: 'DISABLED' },
            { label: 'MCP Calls', value: 'DISABLED' },
            { label: 'Browser Automation', value: 'DISABLED' },
            { label: 'Tool Execution', value: 'DISABLED' },
            { label: 'External API Mutation', value: 'DISABLED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New OpenClaw Task Plan</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Task Title *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.taskTitle}
                onChange={e => set('taskTitle', e.target.value)}
                placeholder="e.g. Analyze Trading Module Status Evidence"
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
              <label className="text-[8px] text-slate-400 block mb-1">Source Codex Task Draft (optional)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.sourceCodexTaskDraftId} onChange={e => set('sourceCodexTaskDraftId', e.target.value)}>
                <option value="">— None —</option>
                {codexTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.taskTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">OpenClaw Task Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.openClawTaskType} onChange={e => set('openClawTaskType', e.target.value)}>
                {OPENCLAW_TASK_TYPES.map(t => <option key={t}>{t}</option>)}
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
              <label className="text-[8px] text-slate-400 block mb-1">Tool Mode</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.toolMode} onChange={e => set('toolMode', e.target.value)}>
                {TOOL_MODES.map(m => <option key={m}>{m}</option>)}
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
              <label className="text-[8px] text-slate-400 block mb-1">Task Instruction</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.taskInstruction}
                onChange={e => set('taskInstruction', e.target.value)}
                placeholder="What should OpenClaw do? (planning purposes only)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Required Evidence</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.requiredEvidence}
                onChange={e => set('requiredEvidence', e.target.value)}
                placeholder="What evidence is needed for this task?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Forbidden Actions</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.forbiddenActions}
                onChange={e => set('forbiddenActions', e.target.value)}
                placeholder="What actions are forbidden? (e.g., no repo mutations, no API calls)"
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
            Save OpenClaw Task Plan
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No OpenClaw task plans yet. Click "+ New Plan" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">OpenClaw Task Plans</div>
            <div className="text-[8px] text-slate-500">{tasks.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Title', 'Task Type', 'Area', 'Tool Mode', 'Priority', 'Risk', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{t.taskTitle}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[120px] truncate">{t.openClawTaskType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{t.targetArea}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[120px] truncate">{t.toolMode}</td>
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