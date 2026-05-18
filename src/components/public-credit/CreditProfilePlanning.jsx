/**
 * CreditProfilePlanning — Planning-only credit profile tracker.
 * localStorage only. No bureau calls. No SSN. No DOB. No credential storage. No client data submission.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanPublicCreditProfilePlans';
const MAX_RECORDS = 100;

const PROFILE_TYPES     = ['Personal', 'Business', 'Authorized User', 'Client Placeholder'];
const SCORE_RANGES      = ['Below 500', '500-579', '580-619', '620-679', '680-719', '720+', 'Unknown'];
const UTILIZATION_RANGES= ['0-9%', '10-29%', '30-49%', '50-74%', '75%+', 'Unknown'];
const INQUIRY_LEVELS    = ['None', 'Low', 'Medium', 'High', 'Unknown'];
const DEROGATORY_LEVELS = ['None', 'Low', 'Medium', 'High', 'Unknown'];
const TRADELINE_COUNTS  = ['0', '1-2', '3-5', '6-10', '10+', 'Unknown'];
const MONITORING_STATUSES = ['Not Started', 'Monitoring Planned', 'Monitoring Active Manually', 'Needs Review'];
const PLANNING_STATUSES = ['DRAFT', 'NEEDS_REVIEW', 'ACTIVE_FOR_PLANNING', 'DISABLED'];

const PLANNING_STATUS_COLORS = {
  DRAFT:                'text-slate-400 border-slate-500/30 bg-slate-500/5',
  NEEDS_REVIEW:         'text-amber-400 border-amber-500/30 bg-amber-500/5',
  ACTIVE_FOR_PLANNING:  'text-primary border-primary/30 bg-primary/5',
  DISABLED:             'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Credit profile planning only',
  'No credit bureau calls',
  'No dispute submission',
  'No credential storage',
  'No SSN collection',
  'No full DOB collection',
  'No document upload',
  'Browser-only export',
];

const BLANK = {
  profileLabel: '',
  profileType: 'Personal',
  scoreRange: 'Unknown',
  utilizationRange: 'Unknown',
  inquiryLevel: 'Unknown',
  derogatoryLevel: 'Unknown',
  positiveTradelineCountRange: 'Unknown',
  monitoringStatus: 'Not Started',
  planningStatus: 'DRAFT',
  notes: '',
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
    const exportData = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_PUBLIC_CREDIT_PROFILE_PLANS',
      profilePlans: records,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-credit-profile-plans-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:            records.length,
    activeForPlanning: records.filter(r => r.planningStatus === 'ACTIVE_FOR_PLANNING').length,
    needsReview:      records.filter(r => r.planningStatus === 'NEEDS_REVIEW').length,
    disabled:         records.filter(r => r.planningStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Credit Profile Planning</div>
          <div className="text-[8px] text-slate-500 mt-0.5">High-level profile status only · No SSN · No bureau calls · No credentials</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export Credit Profile Plans
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Profile Plan'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Profile Plans Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total Profiles',      value: counts.total,             color: 'text-slate-200' },
            { label: 'Active for Planning', value: counts.activeForPlanning, color: 'text-primary' },
            { label: 'Needs Review',        value: counts.needsReview,       color: 'text-amber-400' },
            { label: 'Disabled',            value: counts.disabled,          color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
          {[
            { label: 'Bureau API Calls',           value: 'DISABLED' },
            { label: 'Credential Storage',         value: 'DISABLED' },
            { label: 'Sensitive Identity Data',    value: 'NOT COLLECTED' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[8px] font-bold font-mono text-destructive">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        Planning only · No bureau API calls · No SSN · No full DOB · No credential storage · No document upload
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-4">
          <div className="text-[9px] font-bold uppercase text-slate-300">New Credit Profile Plan</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Profile Label */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Profile Label * (no account numbers, no SSN)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.profileLabel} onChange={e => set('profileLabel', e.target.value)}
                placeholder="e.g. Personal Credit Profile Q3 2026" />
            </div>

            {/* Profile Type */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Profile Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.profileType} onChange={e => set('profileType', e.target.value)}>
                {PROFILE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Score Range */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Estimated Score Range</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.scoreRange} onChange={e => set('scoreRange', e.target.value)}>
                {SCORE_RANGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Utilization Range */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Estimated Utilization Range</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.utilizationRange} onChange={e => set('utilizationRange', e.target.value)}>
                {UTILIZATION_RANGES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            {/* Inquiry Level */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Inquiry Level</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.inquiryLevel} onChange={e => set('inquiryLevel', e.target.value)}>
                {INQUIRY_LEVELS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Derogatory Level */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Derogatory Level</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.derogatoryLevel} onChange={e => set('derogatoryLevel', e.target.value)}>
                {DEROGATORY_LEVELS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Positive Tradeline Count Range */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Positive Tradeline Count Range</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.positiveTradelineCountRange} onChange={e => set('positiveTradelineCountRange', e.target.value)}>
                {TRADELINE_COUNTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Monitoring Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Monitoring Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.monitoringStatus} onChange={e => set('monitoringStatus', e.target.value)}>
                {MONITORING_STATUSES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Planning Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Planning Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.planningStatus} onChange={e => set('planningStatus', e.target.value)}>
                {PLANNING_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Notes (no SSN, no DOB, no credentials, no account numbers)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="High-level planning notes only" />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.profileLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Credit Profile Plan
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No profile plans saved yet. Click "+ New Profile Plan" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Profile Plans</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Label', 'Type', 'Score Range', 'Utilization', 'Derogatory', 'Monitoring', 'Planning Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[130px] truncate">{r.profileLabel}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.profileType}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap">{r.scoreRange}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.utilizationRange}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.derogatoryLevel}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{r.monitoringStatus}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${PLANNING_STATUS_COLORS[r.planningStatus] || ''}`}>
                        {r.planningStatus}
                      </span>
                    </td>
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