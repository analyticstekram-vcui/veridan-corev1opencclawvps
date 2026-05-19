/**
 * ObsidianOpenClawTaskQueue — OpenClaw task queue preview for Obsidian vault operations.
 * Preview-only. No OpenClaw dispatch. No backend calls. PREVIEW_ONLY / NOT_EXECUTED always.
 * Allowed types: READ, RESEARCH, WRITE_NOTE_PREVIEW, UPDATE_NOTE_PREVIEW, SUMMARIZE, VERIFY, PROPOSE_ACTION
 * Blocked types enforced with UI-level gate.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { ShieldAlert, Plus, Ban } from 'lucide-react';

const STORAGE_KEY = 'veridanObsidianOpenClawTaskQueue';

const ALLOWED_TASK_TYPES = [
  'READ', 'RESEARCH', 'WRITE_NOTE_PREVIEW',
  'UPDATE_NOTE_PREVIEW', 'SUMMARIZE', 'VERIFY', 'PROPOSE_ACTION',
];

const BLOCKED_TASK_TYPES = [
  'EXECUTE_TRADE', 'MOVE_MONEY', 'ENTER_PASSWORD',
  'SUBMIT_FORM', 'SEND_ORDER', 'CHANGE_ACCOUNT', 'LIVE_BROWSER_CONTROL',
];

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const riskColor = { LOW: 'text-primary', MEDIUM: 'text-amber-400', HIGH: 'text-destructive' };
const riskBg = { LOW: 'bg-primary/5', MEDIUM: 'bg-amber-500/5', HIGH: 'bg-destructive/5' };
const riskBorder = { LOW: 'border-primary/20', MEDIUM: 'border-amber-500/20', HIGH: 'border-destructive/20' };

const statusColor = {
  PREVIEW_ONLY: 'text-amber-400',
  NOT_EXECUTED: 'text-slate-500',
  PENDING_APPROVAL: 'text-blue-400',
  APPROVED_PREVIEW: 'text-primary',
  DENIED: 'text-destructive',
};

export default function ObsidianOpenClawTaskQueue() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    taskType: 'READ',
    target: '',
    description: '',
    riskLevel: 'LOW',
  });
  const [blockedAttempt, setBlockedAttempt] = useState('');

  useEffect(() => {
    setTasks(loadFromStorage(STORAGE_KEY));
  }, []);

  const save = (updated) => {
    setTasks(updated);
    saveToStorage(STORAGE_KEY, updated);
  };

  const submit = () => {
    if (!form.target.trim()) return;
    const task = {
      taskId: `oclaw-vault-${Date.now()}`,
      taskType: form.taskType,
      target: form.target.trim(),
      description: form.description.trim(),
      riskLevel: form.riskLevel,
      executionStatus: 'PREVIEW_ONLY',
      approvalStatus: 'PENDING_REVIEW',
      dispatchStatus: 'NOT_DISPATCHED',
      openClawDispatch: 'DISABLED',
      createdAt: new Date().toISOString(),
    };
    save([task, ...tasks]);
    setForm({ taskType: 'READ', target: '', description: '', riskLevel: 'LOW' });
  };

  const tryBlockedType = (type) => {
    if (BLOCKED_TASK_TYPES.includes(type)) {
      setBlockedAttempt(type);
      setTimeout(() => setBlockedAttempt(''), 3000);
      return;
    }
    setForm(p => ({ ...p, taskType: type }));
  };

  const updateStatus = (taskId, approvalStatus) => {
    save(tasks.map(t => t.taskId === taskId ? { ...t, approvalStatus } : t));
  };

  const remove = (taskId) => save(tasks.filter(t => t.taskId !== taskId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">OpenClaw Task Queue Preview</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Vault task planning only · No OpenClaw dispatch · No execution</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
            PREVIEW_ONLY
          </span>
          <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
            DISPATCH DISABLED
          </span>
        </div>
      </div>

      {/* Blocked types reference */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <Ban className="w-3 h-3 text-destructive" />
          <span className="text-[8px] font-bold uppercase text-destructive">Blocked Task Types (UI enforced)</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {BLOCKED_TASK_TYPES.map(t => (
            <span key={t} className="px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[8px] font-mono rounded-sm line-through">{t}</span>
          ))}
        </div>
        {blockedAttempt && (
          <div className="mt-2 text-[8px] text-destructive font-bold">
            ⛔ BLOCKED: {blockedAttempt} is a prohibited task type and cannot be queued.
          </div>
        )}
      </div>

      {/* Task Builder */}
      <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
        <div className="text-[8px] font-bold uppercase text-slate-400">Queue New Task (Preview Only)</div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Task Type</label>
            <select
              value={form.taskType}
              onChange={e => setForm(p => ({ ...p, taskType: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              {ALLOWED_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Target *</label>
            <input
              type="text"
              placeholder="Note path or vault target..."
              value={form.target}
              onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Risk Level</label>
            <select
              value={form.riskLevel}
              onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Description</label>
          <input
            type="text"
            placeholder="What should this task accomplish?"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[8px] text-slate-500">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            OpenClaw dispatch: <span className="text-destructive font-bold ml-1">DISABLED</span>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!form.target.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" /> Queue Task
          </button>
        </div>
      </div>

      {/* Task List */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-[8px] font-bold uppercase text-slate-400">Task Queue ({tasks.length})</div>
          {tasks.map(task => (
            <div key={task.taskId} className={`${riskBg[task.riskLevel]} border ${riskBorder[task.riskLevel]} rounded-sm p-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold font-mono text-slate-200">{task.taskType}</span>
                    <span className={`text-[8px] font-bold ${riskColor[task.riskLevel]}`}>RISK:{task.riskLevel}</span>
                    <span className={`text-[8px] font-bold ${statusColor[task.executionStatus]}`}>{task.executionStatus}</span>
                    <span className="text-[8px] text-destructive font-mono">DISPATCH:{task.dispatchStatus}</span>
                  </div>
                  <div className="text-[8px] text-slate-400 truncate">Target: {task.target}</div>
                  {task.description && <div className="text-[8px] text-slate-500 truncate">{task.description}</div>}
                  <div className="text-[8px] text-slate-600">{new Date(task.createdAt).toLocaleString()}</div>
                  <div className="flex gap-1 pt-1">
                    {['PENDING_REVIEW', 'APPROVED_PREVIEW', 'DENIED'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateStatus(task.taskId, s)}
                        className={`px-2 py-0.5 text-[7px] font-bold border rounded-sm transition-colors ${
                          task.approvalStatus === s
                            ? 'bg-primary/20 border-primary/40 text-primary'
                            : 'border-border/30 text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => remove(task.taskId)} className="text-destructive/50 hover:text-destructive shrink-0 text-[8px]">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}