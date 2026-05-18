/**
 * CreditDisputePlanner — Planning-only dispute idea tracker.
 * Reads veridanPublicCreditProfilePlans. Writes veridanPublicCreditDisputePlans.
 * localStorage only. No bureau calls. No dispute submission. No credential storage. No client data.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const WRITE_KEY   = 'veridanPublicCreditDisputePlans';
const PROFILE_KEY = 'veridanPublicCreditProfilePlans';
const MAX_RECORDS = 100;

const BUREAU_TARGETS = ['Experian', 'Equifax', 'TransUnion', 'Multi-Bureau', 'Other'];

const ITEM_TYPES = [
  'Collection', 'Charge-Off', 'Late Payment', 'Inquiry',
  'Personal Information', 'Public Record', 'Mixed File', 'Other',
];

const DISPUTE_REASON_CATEGORIES = [
  'Not Mine',
  'Inaccurate Balance',
  'Incorrect Dates',
  'Duplicate Account',
  'Account Paid',
  'Obsolete / Too Old',
  'Incomplete Reporting',
  'Identity Concern',
  'Needs Investigation',
  'Other',
];

const EVIDENCE_STATUSES = [
  'Not Started',
  'Need Documents',
  'Evidence Collected Offline',
  'Needs Review',
];

const PLANNED_METHODS = [
  'Mail',
  'Online Portal',
  'Phone',
  'Do Not Submit Yet',
];

const DISPUTE_STATUSES = ['IDEA', 'NEEDS_REVIEW', 'READY_FOR_OFFLINE_REVIEW', 'DISABLED'];

const DISPUTE_STATUS_COLORS = {
  IDEA:                      'text-slate-400 border-slate-500/30 bg-slate-500/5',
  NEEDS_REVIEW:              'text-amber-400 border-amber-500/30 bg-amber-500/5',
  READY_FOR_OFFLINE_REVIEW:  'text-primary border-primary/30 bg-primary/5',
  DISABLED:                  'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Dispute planning only',
  'No credit bureau calls',
  'No dispute submission',
  'No credential storage',
  'No SSN collection',
  'No full DOB collection',
  'No document upload',
  'Offline review only',
  'Browser-only export',
];

const BLANK = {
  disputeLabel: '',
  selectedProfilePlanId: '',
  bureauTarget: 'Experian',
  itemType: 'Collection',
  disputeReasonCategory: 'Not Mine',
  evidenceStatus: 'Not Started',
  plannedMethod: 'Do Not Submit Yet',
  disputeStatus: 'IDEA',
  operatorNotes: '',
};

function load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function save(key, d) { try { localStorage.setItem(key, JSON.stringify(d)); } catch {} }

export default function CreditDisputePlanner() {
  const [records, setRecords]       = useState([]);
  const [profilePlans, setProfilePlans] = useState([]);
  const [form, setForm]             = useState(BLANK);
  const [showForm, setShowForm]     = useState(false);

  useEffect(() => {
    setRecords(load(WRITE_KEY));
    setProfilePlans(load(PROFILE_KEY));
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.disputeLabel.trim()) return;
    const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    save(WRITE_KEY, updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    save(WRITE_KEY, updated);
  };

  const handleExport = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_PUBLIC_CREDIT_DISPUTE_PLANS',
      disputePlans: records,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-dispute-plans-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:                 records.length,
    needsReview:           records.filter(r => r.disputeStatus === 'NEEDS_REVIEW').length,
    readyForOfflineReview: records.filter(r => r.disputeStatus === 'READY_FOR_OFFLINE_REVIEW').length,
    disabled:              records.filter(r => r.disputeStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Dispute Planner</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan dispute ideas · No bureau submissions · No credential storage · No client data</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export Dispute Plans
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Dispute Plan'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No bureau submission occurs from this system.</div>
          <div className="text-[8px] text-destructive/70">No bureau API calls · No dispute letters sent · No credentials stored · No SSN · No DOB · No document upload</div>
        </div>
      </div>

      {/* Profile Plans availability */}
      <div className={`px-3 py-2 border rounded-sm text-[8px] ${profilePlans.length > 0 ? 'border-primary/30 bg-primary/5 text-primary' : 'border-amber-500/30 bg-amber-500/5 text-amber-400'}`}>
        Credit Profile Plans: <span className="font-bold">{profilePlans.length} plans available</span>
        {profilePlans.length === 0 && <span className="block text-[7px] opacity-70 mt-0.5">Add credit profile plans in the Credit Profile tab to link them here.</span>}
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Dispute Plans Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total Plans',              value: counts.total,                 color: 'text-slate-200' },
            { label: 'Needs Review',             value: counts.needsReview,           color: 'text-amber-400' },
            { label: 'Ready Offline Review',     value: counts.readyForOfflineReview, color: 'text-primary' },
            { label: 'Disabled',                 value: counts.disabled,              color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'Bureau Submissions',       value: 'DISABLED' },
            { label: 'Bureau API Calls',         value: 'DISABLED' },
            { label: 'Credential Storage',       value: 'DISABLED' },
            { label: 'Sensitive Identity Data',  value: 'NOT COLLECTED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Dispute Plan</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Dispute Label */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Dispute Label * (no account numbers, no SSN)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.disputeLabel} onChange={e => set('disputeLabel', e.target.value)}
                placeholder="e.g. Incorrect late payment — general reference only" />
            </div>

            {/* Profile Plan selector */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">
                Link to Credit Profile Plan {profilePlans.length === 0 && <span className="text-amber-400">(none available)</span>}
              </label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.selectedProfilePlanId} onChange={e => set('selectedProfilePlanId', e.target.value)}>
                <option value="">-- Select Profile Plan (optional) --</option>
                {profilePlans.map(p => (
                  <option key={p.id} value={p.id}>{p.profileLabel} ({p.profileType} · {p.planningStatus})</option>
                ))}
              </select>
            </div>

            {/* Bureau Target */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Bureau Target</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.bureauTarget} onChange={e => set('bureauTarget', e.target.value)}>
                {BUREAU_TARGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>

            {/* Item Type */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Item Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.itemType} onChange={e => set('itemType', e.target.value)}>
                {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Dispute Reason Category */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Dispute Reason Category</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.disputeReasonCategory} onChange={e => set('disputeReasonCategory', e.target.value)}>
                {DISPUTE_REASON_CATEGORIES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Evidence Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Evidence Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.evidenceStatus} onChange={e => set('evidenceStatus', e.target.value)}>
                {EVIDENCE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Planned Method */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Planned Method</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.plannedMethod} onChange={e => set('plannedMethod', e.target.value)}>
                {PLANNED_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Dispute Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Dispute Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.disputeStatus} onChange={e => set('disputeStatus', e.target.value)}>
                {DISPUTE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Operator Notes */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Operator Notes (no SSN, no DOB, no credentials, no account numbers)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.operatorNotes} onChange={e => set('operatorNotes', e.target.value)}
                placeholder="High-level planning notes only" />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.disputeLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Dispute Plan
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No dispute plans saved yet. Click "+ New Dispute Plan" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Dispute Plans</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Label', 'Bureau', 'Item Type', 'Reason', 'Evidence', 'Method', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[120px] truncate">{r.disputeLabel}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap">{r.bureauTarget}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.itemType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{r.disputeReasonCategory}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{r.evidenceStatus}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.plannedMethod}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${DISPUTE_STATUS_COLORS[r.disputeStatus] || ''}`}>
                        {r.disputeStatus}
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