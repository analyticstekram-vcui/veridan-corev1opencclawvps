/**
 * CreditGoalPlanner — Planning-only credit goal tracker.
 * Reads veridanPublicCreditProfilePlans. Writes veridanPublicCreditGoals.
 * localStorage only. No bureau calls. No submissions. No credential storage. No sensitive identity data.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const WRITE_KEY   = 'veridanPublicCreditGoals';
const PROFILE_KEY = 'veridanPublicCreditProfilePlans';
const MAX_RECORDS = 100;

const GOAL_TYPES = [
  'Score Improvement',
  'Utilization Reduction',
  'Derogatory Reduction',
  'Inquiry Reduction',
  'Positive Tradeline Growth',
  'Business Credit Readiness',
  'Funding Readiness',
  'Other',
];

const TARGET_SCORE_RANGES = [
  '580-619',
  '620-679',
  '680-719',
  '720+',
  'Unknown / Not Score-Based',
];

const TARGET_UTILIZATION_RANGES = [
  '0-9%',
  '10-29%',
  '30-49%',
  'Not Applicable',
];

const TARGET_TIMEFRAMES = [
  '30 Days',
  '60 Days',
  '90 Days',
  '6 Months',
  '12 Months',
  'Custom',
];

const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const PRIORITY_COLORS = {
  Low:      'text-slate-400 border-slate-500/30 bg-slate-500/5',
  Medium:   'text-amber-400 border-amber-500/30 bg-amber-500/5',
  High:     'text-orange-400 border-orange-500/30 bg-orange-500/5',
  Critical: 'text-destructive border-destructive/30 bg-destructive/5',
};

const RELATED_ACTION_PLANS = [
  'Manual Monitoring',
  'Dispute Planning',
  'Tradeline Planning',
  'Utilization Paydown',
  'Credit Builder',
  'Funding Prep',
  'Other',
];

const GOAL_STATUSES = ['DRAFT', 'ACTIVE_FOR_PLANNING', 'NEEDS_REVIEW', 'COMPLETED', 'DISABLED'];

const GOAL_STATUS_COLORS = {
  DRAFT:                'text-slate-400 border-slate-500/30 bg-slate-500/5',
  ACTIVE_FOR_PLANNING:  'text-primary border-primary/30 bg-primary/5',
  NEEDS_REVIEW:         'text-amber-400 border-amber-500/30 bg-amber-500/5',
  COMPLETED:            'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  DISABLED:             'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Credit goal planning only',
  'No credit bureau calls',
  'No credit bureau submissions',
  'No credential storage',
  'No SSN collection',
  'No full DOB collection',
  'No document upload',
  'Browser-only export',
];

const BLANK = {
  goalName: '',
  selectedProfilePlanId: '',
  goalType: 'Score Improvement',
  targetScoreRange: 'Unknown / Not Score-Based',
  targetUtilizationRange: 'Not Applicable',
  targetTimeframe: '90 Days',
  priorityLevel: 'Medium',
  relatedActionPlan: 'Manual Monitoring',
  goalStatus: 'DRAFT',
  operatorNotes: '',
};

function load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function save(key, d) { try { localStorage.setItem(key, JSON.stringify(d)); } catch {} }

export default function CreditGoalPlanner() {
  const [records, setRecords]           = useState([]);
  const [profilePlans, setProfilePlans] = useState([]);
  const [form, setForm]                 = useState(BLANK);
  const [showForm, setShowForm]         = useState(false);

  useEffect(() => {
    setRecords(load(WRITE_KEY));
    setProfilePlans(load(PROFILE_KEY));
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.goalName.trim()) return;
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
      snapshotType: 'VERIDAN_PUBLIC_CREDIT_GOALS',
      creditGoals: records,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-credit-goals-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:              records.length,
    activeForPlanning:  records.filter(r => r.goalStatus === 'ACTIVE_FOR_PLANNING').length,
    needsReview:        records.filter(r => r.goalStatus === 'NEEDS_REVIEW').length,
    completed:          records.filter(r => r.goalStatus === 'COMPLETED').length,
    disabled:           records.filter(r => r.goalStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Credit Goals</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan credit goals · No bureau calls · No submissions · No sensitive data</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export Credit Goals
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Credit Goal'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No credit bureau calls, submissions, or credential storage occur from this system.</div>
          <div className="text-[8px] text-destructive/70">No bureau API calls · No dispute submission · No credentials · No SSN · No full DOB · No document upload</div>
        </div>
      </div>

      {/* Profile Plans availability */}
      <div className={`px-3 py-2 border rounded-sm text-[8px] ${profilePlans.length > 0 ? 'border-primary/30 bg-primary/5 text-primary' : 'border-amber-500/30 bg-amber-500/5 text-amber-400'}`}>
        Credit Profile Plans: <span className="font-bold">{profilePlans.length} plans available</span>
        {profilePlans.length === 0 && <span className="block text-[7px] opacity-70 mt-0.5">Add credit profile plans in the Credit Profile tab to link them here.</span>}
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Credit Goals Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          {[
            { label: 'Total Goals',         value: counts.total,             color: 'text-slate-200' },
            { label: 'Active for Planning', value: counts.activeForPlanning, color: 'text-primary' },
            { label: 'Needs Review',        value: counts.needsReview,       color: 'text-amber-400' },
            { label: 'Completed',           value: counts.completed,         color: 'text-emerald-400' },
            { label: 'Disabled',            value: counts.disabled,          color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'Bureau API Calls',              value: 'DISABLED' },
            { label: 'Credit Bureau Submissions',     value: 'DISABLED' },
            { label: 'Credential Storage',            value: 'DISABLED' },
            { label: 'Sensitive Identity Data',       value: 'NOT COLLECTED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Credit Goal</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Goal Name */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Goal Name * (no SSN, no account numbers)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.goalName} onChange={e => set('goalName', e.target.value)}
                placeholder="e.g. Improve score to 720+ range by Q4 2026" />
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
                  <option key={p.id} value={p.id}>{p.profileLabel} ({p.profileType})</option>
                ))}
              </select>
            </div>

            {/* Goal Type */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Goal Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.goalType} onChange={e => set('goalType', e.target.value)}>
                {GOAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Target Score Range */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Score Range</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetScoreRange} onChange={e => set('targetScoreRange', e.target.value)}>
                {TARGET_SCORE_RANGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Target Utilization Range */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Utilization Range</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetUtilizationRange} onChange={e => set('targetUtilizationRange', e.target.value)}>
                {TARGET_UTILIZATION_RANGES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            {/* Target Timeframe */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Timeframe</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetTimeframe} onChange={e => set('targetTimeframe', e.target.value)}>
                {TARGET_TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Priority Level */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Priority Level</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.priorityLevel} onChange={e => set('priorityLevel', e.target.value)}>
                {PRIORITY_LEVELS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Related Action Plan */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Related Action Plan</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.relatedActionPlan} onChange={e => set('relatedActionPlan', e.target.value)}>
                {RELATED_ACTION_PLANS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            {/* Goal Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Goal Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.goalStatus} onChange={e => set('goalStatus', e.target.value)}>
                {GOAL_STATUSES.map(s => <option key={s}>{s}</option>)}
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

          <button onClick={handleSave} disabled={!form.goalName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Credit Goal
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No credit goals saved yet. Click "+ New Credit Goal" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Credit Goals</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Goal Name', 'Type', 'Target Score', 'Timeframe', 'Priority', 'Action Plan', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[120px] truncate">{r.goalName}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[100px] truncate">{r.goalType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.targetScoreRange}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.targetTimeframe}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${PRIORITY_COLORS[r.priorityLevel] || ''}`}>
                        {r.priorityLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[100px] truncate">{r.relatedActionPlan}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${GOAL_STATUS_COLORS[r.goalStatus] || ''}`}>
                        {r.goalStatus}
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