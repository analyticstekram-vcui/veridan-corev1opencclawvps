/**
 * BureauMonitoringChecklist — Planning-only bureau monitoring task tracker.
 * localStorage only. No bureau calls. No credential storage. No client data.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanPublicCreditBureauMonitoring';
const MAX_RECORDS = 100;

const BUREAUS         = ['Equifax', 'Experian', 'TransUnion', 'All Three'];
const TASK_TYPES      = ['Pull Report', 'Review Inquiries', 'Review Accounts', 'Check Dispute Status', 'Freeze/Unfreeze Review', 'Identity Monitoring', 'Other'];
const TASK_STATUSES   = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'COMPLETE', 'DISABLED'];

const SAFETY_CLAIMS = [
  'Bureau monitoring planning only',
  'No bureau API calls',
  'No credential storage',
  'No client data submission',
  'Planning-only',
  'Browser-only export',
];

const BLANK = {
  taskLabel: '',
  targetBureau: 'All Three',
  taskType: 'Review Accounts',
  taskStatus: 'NOT_STARTED',
  plannedDate: '',
  taskNotes: '',
};

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

export default function BureauMonitoringChecklist() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRecords(load()); }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.taskLabel.trim()) return;
    const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    save(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    save(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), snapshotType: 'VERIDAN_BUREAU_MONITORING_CHECKLIST', records, safetyClaims: SAFETY_CLAIMS }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-bureau-monitoring-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total: records.length,
    notStarted: records.filter(r => r.taskStatus === 'NOT_STARTED').length,
    planned: records.filter(r => r.taskStatus === 'PLANNED').length,
    inProgress: records.filter(r => r.taskStatus === 'IN_PROGRESS').length,
    complete: records.filter(r => r.taskStatus === 'COMPLETE').length,
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Bureau Monitoring Checklist</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan monitoring tasks · No bureau connections · No credential storage</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Total',       value: counts.total,      color: 'text-slate-200' },
          { label: 'Not Started', value: counts.notStarted, color: 'text-slate-400' },
          { label: 'Planned',     value: counts.planned,    color: 'text-amber-400' },
          { label: 'In Progress', value: counts.inProgress, color: 'text-blue-400' },
          { label: 'Complete',    value: counts.complete,   color: 'text-primary' },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center px-2 py-2 bg-secondary/20 border border-border/30 rounded-sm">
            <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
            <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        Planning only · No bureau API calls · No credential storage · No client data submission
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300">New Monitoring Task</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Task Label *</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.taskLabel} onChange={e => set('taskLabel', e.target.value)} placeholder="e.g. Review Equifax accounts Q3 2026" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Bureau</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetBureau} onChange={e => set('targetBureau', e.target.value)}>
                {BUREAUS.map(b => <option key={b}>{b}</option>)}
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
              <label className="text-[8px] text-slate-400 block mb-1">Task Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.taskStatus} onChange={e => set('taskStatus', e.target.value)}>
                {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Planned Date</label>
              <input type="date" className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.plannedDate} onChange={e => set('plannedDate', e.target.value)} />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Task Notes</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.taskNotes} onChange={e => set('taskNotes', e.target.value)} placeholder="High-level planning notes only" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.taskLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Task
          </button>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No monitoring tasks yet. Click "+ New Task" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Monitoring Tasks</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Task', 'Bureau', 'Type', 'Planned Date', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[130px] truncate">{r.taskLabel}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap">{r.targetBureau}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.taskType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.plannedDate || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="px-1.5 py-0.5 border border-border/40 rounded text-[7px] font-bold text-amber-400">{r.taskStatus}</span></td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleRemove(r.id)} className="text-[7px] text-destructive/50 hover:text-destructive transition-colors">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>)}
        </div>
      </div>
    </div>
  );
}