/**
 * CreditGoalPlanner — Planning-only credit goal tracker.
 * localStorage only. No bureau calls. No credential storage. No client data.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanPublicCreditGoalPlanner';
const MAX_RECORDS = 100;

const GOAL_TYPES    = ['Score Target', 'Pay Down Debt', 'Open New Account', 'Remove Negative Item', 'Freeze Credit', 'Dispute Resolution', 'Monitoring', 'Other'];
const GOAL_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'ON_HOLD', 'CANCELLED'];
const TIMEFRAMES    = ['1 Month', '3 Months', '6 Months', '1 Year', '2 Years', 'Ongoing'];

const SAFETY_CLAIMS = [
  'Credit goal planning only',
  'No bureau API calls',
  'No credential storage',
  'No client data submission',
  'Planning-only',
  'Browser-only export',
];

const BLANK = {
  goalLabel: '',
  goalType: 'Score Target',
  goalStatus: 'NOT_STARTED',
  targetTimeframe: '6 Months',
  targetDescription: '',
  planningNotes: '',
};

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

export default function CreditGoalPlanner() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRecords(load()); }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.goalLabel.trim()) return;
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
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), snapshotType: 'VERIDAN_CREDIT_GOAL_PLANNER', records, safetyClaims: SAFETY_CLAIMS }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-credit-goal-planner-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:      records.length,
    notStarted: records.filter(r => r.goalStatus === 'NOT_STARTED').length,
    inProgress: records.filter(r => r.goalStatus === 'IN_PROGRESS').length,
    achieved:   records.filter(r => r.goalStatus === 'ACHIEVED').length,
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Credit Goal Planner</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan credit goals · No bureau calls · No client data</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Goal'}
          </button>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Total',       value: counts.total,      color: 'text-slate-200' },
          { label: 'Not Started', value: counts.notStarted, color: 'text-slate-400' },
          { label: 'In Progress', value: counts.inProgress, color: 'text-amber-400' },
          { label: 'Achieved',    value: counts.achieved,   color: 'text-primary' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Credit Goal</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Goal Label *</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.goalLabel} onChange={e => set('goalLabel', e.target.value)} placeholder="e.g. Reach 750 credit score by Q4 2026" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Goal Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.goalType} onChange={e => set('goalType', e.target.value)}>
                {GOAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Goal Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.goalStatus} onChange={e => set('goalStatus', e.target.value)}>
                {GOAL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Timeframe</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetTimeframe} onChange={e => set('targetTimeframe', e.target.value)}>
                {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Description</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.targetDescription} onChange={e => set('targetDescription', e.target.value)} placeholder="e.g. Score 750+, 0 negative items" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.planningNotes} onChange={e => set('planningNotes', e.target.value)} placeholder="High-level planning notes only" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.goalLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Goal
          </button>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No goals yet. Click "+ New Goal" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Credit Goals</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Goal', 'Type', 'Status', 'Timeframe', 'Target', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[130px] truncate">{r.goalLabel}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.goalType}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="px-1.5 py-0.5 border border-border/40 rounded text-[7px] font-bold text-primary">{r.goalStatus}</span></td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.targetTimeframe}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[100px] truncate">{r.targetDescription || '—'}</td>
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