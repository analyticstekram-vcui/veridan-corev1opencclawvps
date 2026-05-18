/**
 * CreditProfilePlanning — Planning-only credit profile status tracker.
 * localStorage only. No bureau calls. No credential storage. No client data submission.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanPublicCreditProfilePlanning';
const MAX_RECORDS = 100;

const SCORE_RANGES   = ['300–579 (Poor)', '580–669 (Fair)', '670–739 (Good)', '740–799 (Very Good)', '800–850 (Exceptional)', 'Unknown'];
const BUREAUS        = ['Equifax', 'Experian', 'TransUnion', 'All Three'];
const PROFILE_STATUSES = ['NOT_STARTED', 'IN_REVIEW', 'MONITORING', 'NEEDS_ACTION', 'DISABLED'];

const SAFETY_CLAIMS = [
  'Credit profile planning only',
  'No bureau API calls',
  'No credential storage',
  'No client data submission',
  'Planning-only',
  'Browser-only export',
];

const BLANK = {
  profileLabel: '',
  estimatedScoreRange: 'Unknown',
  primaryBureau: 'All Three',
  profileStatus: 'NOT_STARTED',
  openAccounts: '',
  negativeItems: '',
  planningNotes: '',
};

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

export default function CreditProfilePlanning() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRecords(load()); }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.profileLabel.trim()) return;
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
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), snapshotType: 'VERIDAN_CREDIT_PROFILE_PLANNING', records, safetyClaims: SAFETY_CLAIMS }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-credit-profile-planning-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Credit Profile Planning</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Track credit profile status · No bureau calls · No credential storage</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Profile Record'}
          </button>
        </div>
      </div>

      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        Planning only · No bureau API calls · No SSN fields · No credential storage · No client data submission
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300">New Profile Record</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Profile Label *</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.profileLabel} onChange={e => set('profileLabel', e.target.value)} placeholder="e.g. Personal Credit Profile Q2 2026" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Estimated Score Range</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.estimatedScoreRange} onChange={e => set('estimatedScoreRange', e.target.value)}>
                {SCORE_RANGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Primary Bureau Focus</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.primaryBureau} onChange={e => set('primaryBureau', e.target.value)}>
                {BUREAUS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Profile Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.profileStatus} onChange={e => set('profileStatus', e.target.value)}>
                {PROFILE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Open Accounts (count, no details)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.openAccounts} onChange={e => set('openAccounts', e.target.value)} placeholder="e.g. 5" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Negative Items (count, no details)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.negativeItems} onChange={e => set('negativeItems', e.target.value)} placeholder="e.g. 2" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes (no SSN, no DOB, no credentials)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.planningNotes} onChange={e => set('planningNotes', e.target.value)} placeholder="High-level planning notes only" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.profileLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Profile Record
          </button>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No profile records yet. Click "+ New Profile Record" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Profile Records</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Label', 'Score Range', 'Bureau', 'Status', 'Open Accts', 'Negative Items', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[120px] truncate">{r.profileLabel}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.estimatedScoreRange}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap">{r.primaryBureau}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="px-1.5 py-0.5 border border-border/40 rounded text-[7px] font-bold text-amber-400">{r.profileStatus}</span></td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.openAccounts || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.negativeItems || '—'}</td>
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