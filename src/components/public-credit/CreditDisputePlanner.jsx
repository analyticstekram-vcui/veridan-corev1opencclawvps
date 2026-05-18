/**
 * CreditDisputePlanner — Planning-only dispute idea tracker.
 * localStorage only. No bureau calls. No dispute submission. No credential storage. No client data.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanPublicCreditDisputePlanner';
const MAX_RECORDS = 100;

const BUREAUS       = ['Equifax', 'Experian', 'TransUnion', 'All Three'];
const DISPUTE_TYPES = ['Incorrect Balance', 'Wrong Account Status', 'Not My Account', 'Duplicate Account', 'Outdated Information', 'Other'];
const PLAN_STATUSES = ['IDEA', 'NEEDS_REVIEW', 'READY_TO_PLAN', 'PENDING_LEGAL_REVIEW', 'DISABLED'];

const SAFETY_CLAIMS = [
  'Dispute planning only',
  'No bureau API calls',
  'No dispute submission',
  'No credential storage',
  'No client data transmission',
  'Planning-only',
  'Browser-only export',
];

const BLANK = {
  disputeLabel: '',
  targetBureau: 'All Three',
  disputeType: 'Incorrect Balance',
  planStatus: 'IDEA',
  planningNotes: '',
};

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

export default function CreditDisputePlanner() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRecords(load()); }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.disputeLabel.trim()) return;
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
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), snapshotType: 'VERIDAN_CREDIT_DISPUTE_PLANNER', records, safetyClaims: SAFETY_CLAIMS }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-credit-dispute-planner-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Dispute Planner</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan dispute ideas · No bureau submissions · No client data</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Dispute Idea'}
          </button>
        </div>
      </div>

      <div className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm text-[8px] text-destructive/80">
        <strong>No disputes are submitted here.</strong> This is a planning-only tracker. No bureau calls, no credential storage, no client data.
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300">New Dispute Idea</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Dispute Label * (no account numbers or SSN)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.disputeLabel} onChange={e => set('disputeLabel', e.target.value)} placeholder="e.g. Incorrect balance on auto loan" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Bureau</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetBureau} onChange={e => set('targetBureau', e.target.value)}>
                {BUREAUS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Dispute Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.disputeType} onChange={e => set('disputeType', e.target.value)}>
                {DISPUTE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Plan Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.planStatus} onChange={e => set('planStatus', e.target.value)}>
                {PLAN_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes (no sensitive data)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.planningNotes} onChange={e => set('planningNotes', e.target.value)} placeholder="High-level notes only" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.disputeLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Dispute Idea
          </button>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No dispute ideas yet. Click "+ New Dispute Idea" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Dispute Ideas</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Label', 'Bureau', 'Type', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.disputeLabel}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap">{r.targetBureau}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.disputeType}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="px-1.5 py-0.5 border border-border/40 rounded text-[7px] font-bold text-amber-400">{r.planStatus}</span></td>
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