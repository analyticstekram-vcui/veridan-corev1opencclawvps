/**
 * LocalOnlyBusinessTaskTracker
 * Local-only planning task tracker for Veridan Core business operations.
 *
 * Does NOT:
 *   - Call backends
 *   - Collect client data (names, SSNs, etc.)
 *   - Collect payment data
 *   - Collect bank data
 *   - Collect credentials or API keys
 *   - Submit legal or tax filings
 *   - Execute automation
 *   - Move money
 *   - Use timers
 *   - Dispatch custom events
 *
 * localStorage: veridanBusinessOpsLocalTasks (capped at 100 records)
 */
import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2, CheckCircle2, Clock, Pause, PlayCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'veridanBusinessOpsLocalTasks';
const MAX_TASKS = 100;

const BUSINESS_UNITS = [
  'Tekram Analytics',
  'MetaEdge Capital',
  'Credit Repair Operation',
  'Tradeline Vendor Operation',
  'Wyoming Agent Affiliate Operation',
  'General Veridan Core',
];

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Planning', 'In Progress', 'Waiting', 'Complete', 'Hold'];

const SEED_TASKS = [
  {
    id: 'seed-5',
    title: 'Build Veridan Core weekly operating review',
    businessUnit: 'General Veridan Core',
    priority: 'High',
    status: 'Planning',
    dueWindow: 'This week',
    revenueImpact: 'Medium',
    complianceImpact: 'Low',
    aiOperatorNote: 'Create weekly review habit for all branches.',
    createdAt: new Date(Date.now() - 0).toISOString(),
  },
  {
    id: 'seed-4',
    title: 'Map Wyoming agent affiliate funnel',
    businessUnit: 'Wyoming Agent Affiliate Operation',
    priority: 'Medium',
    status: 'Planning',
    dueWindow: 'Next week',
    revenueImpact: 'Medium',
    complianceImpact: 'Low',
    aiOperatorNote: 'Outline landing page and affiliate flow.',
    createdAt: new Date(Date.now() - 1000).toISOString(),
  },
  {
    id: 'seed-3',
    title: 'Define tradeline vendor offer',
    businessUnit: 'Tradeline Vendor Operation',
    priority: 'Medium',
    status: 'Planning',
    dueWindow: 'Next week',
    revenueImpact: 'High',
    complianceImpact: 'Medium',
    aiOperatorNote: 'No client intake yet. Define package structure only.',
    createdAt: new Date(Date.now() - 2000).toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Map credit repair service workflow',
    businessUnit: 'Credit Repair Operation',
    priority: 'High',
    status: 'Planning',
    dueWindow: 'This week',
    revenueImpact: 'Medium',
    complianceImpact: 'Medium',
    aiOperatorNote: 'Keep all disputes manual review only.',
    createdAt: new Date(Date.now() - 3000).toISOString(),
  },
  {
    id: 'seed-1',
    title: 'Build Tekram Analytics offer page',
    businessUnit: 'Tekram Analytics',
    priority: 'High',
    status: 'Planning',
    dueWindow: 'This week',
    revenueImpact: 'Medium',
    complianceImpact: 'Low',
    aiOperatorNote: 'Define offer, pricing, and delivery steps.',
    createdAt: new Date(Date.now() - 4000).toISOString(),
  },
];

const EMPTY_FORM = {
  title: '',
  businessUnit: 'General Veridan Core',
  priority: 'Medium',
  status: 'Planning',
  dueWindow: '',
  revenueImpact: '',
  complianceImpact: '',
  aiOperatorNote: '',
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, MAX_TASKS)));
  } catch {
    // localStorage quota exceeded — skip persist, in-memory state still intact
  }
}

function StatusBadge({ status }) {
  const colors = {
    'Planning': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
    'In Progress': 'text-green-500 border-green-500/30 bg-green-500/5',
    'Waiting': 'text-amber-500 border-amber-500/30 bg-amber-500/5',
    'Complete': 'text-slate-400 border-slate-400/30 bg-slate-400/5',
    'Hold': 'text-destructive border-destructive/30 bg-destructive/5',
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm border text-[8px] font-mono font-bold ${colors[status] || 'text-slate-400'}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    'Low': 'text-slate-400 border-slate-400/30 bg-slate-400/5',
    'Medium': 'text-amber-500 border-amber-500/30 bg-amber-500/5',
    'High': 'text-destructive border-destructive/30 bg-destructive/5',
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm border text-[8px] font-mono font-bold ${colors[priority] || 'text-slate-400'}`}>
      {priority}
    </span>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-mono text-muted-foreground/70 uppercase">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "bg-secondary/30 border border-border/50 rounded-sm px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 w-full";
const selectClass = `${inputClass} cursor-pointer`;

export default function LocalOnlyBusinessTaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);

  // Load on mount; seed default tasks if localStorage is empty
  useEffect(() => {
    const existing = loadTasks();
    if (existing.length === 0) {
      saveTasks(SEED_TASKS);
      setTasks(SEED_TASKS);
    } else {
      setTasks(existing);
    }
  }, []);

  const persistTasks = (updated) => {
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAddTask = () => {
    if (!form.title.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      ...form,
      title: form.title.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks].slice(0, MAX_TASKS);
    persistTasks(updated);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    persistTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id) => {
    persistTasks(tasks.filter(t => t.id !== id));
    if (expandedTask === id) setExpandedTask(null);
  };

  const clearAll = () => {
    persistTasks([]);
    setExpandedTask(null);
  };

  return (
    <div className="mt-6 bg-card border border-border/50 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-mono font-bold uppercase text-foreground">Local Business Task Tracker</h2>
          <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">
            Local-only planning tasks · Stored in browser only · Not synced to backend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-muted-foreground/50">{tasks.length}/{MAX_TASKS}</span>
          {tasks.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-destructive/70 border border-destructive/30 rounded-sm hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-primary border border-primary/30 rounded-sm hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Task
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="px-4 py-2.5 bg-destructive/5 border-b border-destructive/20 flex items-start gap-2">
        <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
        <div className="text-[9px] font-mono text-destructive/80 leading-relaxed">
          <span className="font-bold">BLOCKED CONTENT WARNING:</span> Do not enter real client names, SSNs, bank details, payment details, passwords, API keys, legal filing data, or tax filing data.
          <span className="ml-2 text-muted-foreground/60">· Local-only · No client data · No payment data · No bank data · No credentials · No legal/tax submission · No automation</span>
        </div>
      </div>

      {/* Task Creation Form */}
      {showForm && (
        <div className="p-4 border-b border-border/40 bg-secondary/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold text-foreground">New Planning Task</span>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Title */}
            <div className="md:col-span-2">
              <FormField label="Task Title" required>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g., Set up Tekram Analytics paper trading pipeline"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                />
              </FormField>
            </div>

            {/* Business Unit */}
            <FormField label="Business Unit">
              <select
                className={selectClass}
                value={form.businessUnit}
                onChange={e => setForm(f => ({ ...f, businessUnit: e.target.value }))}
              >
                {BUSINESS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </FormField>

            {/* Priority */}
            <FormField label="Priority">
              <select
                className={selectClass}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>

            {/* Status */}
            <FormField label="Status">
              <select
                className={selectClass}
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>

            {/* Due Window */}
            <FormField label="Due Window">
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Q3 2026, End of June, ASAP"
                value={form.dueWindow}
                onChange={e => setForm(f => ({ ...f, dueWindow: e.target.value }))}
                maxLength={100}
              />
            </FormField>

            {/* Revenue Impact */}
            <FormField label="Revenue Impact">
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Unlocks signal sales pipeline"
                value={form.revenueImpact}
                onChange={e => setForm(f => ({ ...f, revenueImpact: e.target.value }))}
                maxLength={200}
              />
            </FormField>

            {/* Compliance Impact */}
            <FormField label="Compliance Impact">
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Entity formation required first"
                value={form.complianceImpact}
                onChange={e => setForm(f => ({ ...f, complianceImpact: e.target.value }))}
                maxLength={200}
              />
            </FormField>

            {/* AI Operator Note */}
            <div className="md:col-span-2">
              <FormField label="AI Operator Note">
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="e.g., Coordinate with trading paper contract before enabling"
                  value={form.aiOperatorNote}
                  onChange={e => setForm(f => ({ ...f, aiOperatorNote: e.target.value }))}
                  maxLength={500}
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground border border-border/50 rounded-sm hover:bg-secondary/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              disabled={!form.title.trim()}
              className="px-3 py-1.5 text-[10px] font-mono text-primary border border-primary/30 rounded-sm hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="divide-y divide-border/30">
        {tasks.length === 0 && (
          <div className="px-4 py-8 text-center text-[10px] font-mono text-muted-foreground/40">
            No local tasks yet. Click "New Task" to add one.
          </div>
        )}

        {tasks.map(task => (
          <div key={task.id} className="px-4 py-3 hover:bg-secondary/10 transition-colors">
            {/* Task header row */}
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="text-[9px] font-mono text-muted-foreground/60">{task.businessUnit}</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-foreground leading-snug">{task.title}</div>
                {task.dueWindow && (
                  <div className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">
                    Due: {task.dueWindow}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Toggle details"
                >
                  {expandedTask === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => updateStatus(task.id, 'In Progress')}
                  className="p-1 text-green-500/70 hover:text-green-500 transition-colors"
                  title="Mark In Progress"
                >
                  <PlayCircle className="w-3 h-3" />
                </button>
                <button
                  onClick={() => updateStatus(task.id, 'Complete')}
                  className="p-1 text-primary/70 hover:text-primary transition-colors"
                  title="Mark Complete"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => updateStatus(task.id, 'Hold')}
                  className="p-1 text-amber-500/70 hover:text-amber-500 transition-colors"
                  title="Mark Hold"
                >
                  <Pause className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-destructive/60 hover:text-destructive transition-colors"
                  title="Delete task"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expandedTask === task.id && (
              <div className="mt-2 ml-0 space-y-1.5 pl-3 border-l-2 border-border/30">
                {task.revenueImpact && (
                  <div className="text-[9px] font-mono">
                    <span className="text-muted-foreground/60">Revenue Impact: </span>
                    <span className="text-foreground/80">{task.revenueImpact}</span>
                  </div>
                )}
                {task.complianceImpact && (
                  <div className="text-[9px] font-mono">
                    <span className="text-muted-foreground/60">Compliance Impact: </span>
                    <span className="text-foreground/80">{task.complianceImpact}</span>
                  </div>
                )}
                {task.aiOperatorNote && (
                  <div className="text-[9px] font-mono">
                    <span className="text-muted-foreground/60">AI Operator Note: </span>
                    <span className="text-foreground/80">{task.aiOperatorNote}</span>
                  </div>
                )}
                <div className="text-[8px] font-mono text-muted-foreground/40">
                  Created: {new Date(task.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-secondary/20 border-t border-border/30 flex items-center gap-2">
        <Clock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        <span className="text-[8px] font-mono text-muted-foreground/50">
          Local storage only · Key: {STORAGE_KEY} · Max {MAX_TASKS} tasks · No backend sync
        </span>
      </div>
    </div>
  );
}