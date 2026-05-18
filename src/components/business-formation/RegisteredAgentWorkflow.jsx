/**
 * RegisteredAgentWorkflow — Planning-only registered agent workflow tracker.
 * localStorage only. No registered agent API calls. No legal filing. No entity submission.
 * No payment processing. No credential storage.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const STORAGE_KEY_WORKFLOWS = 'veridanRegisteredAgentWorkflows';
const STORAGE_KEY_ENTITIES = 'veridanBusinessEntityRegistry';
const MAX_RECORDS = 100;

const PROVIDER_TARGETS = [
  'WyomingAgents',
  'Northwest Registered Agent',
  'LegalZoom',
  'Stripe Atlas',
  'Custom Provider',
  'Not Decided',
];

const JURISDICTIONS = [
  'Wyoming',
  'Delaware',
  'Nevada',
  'Ohio',
  'Other',
  'Not Decided',
];

const WORKFLOW_PURPOSES = [
  'New Entity Formation',
  'Registered Agent Setup',
  'Annual Report Tracking',
  'Address Service',
  'Compliance Reminder',
  'Affiliate Referral',
  'Other',
];

const PROVIDER_STATUSES = [
  'NOT_STARTED',
  'RESEARCHING',
  'SELECTED_FOR_OFFLINE_REVIEW',
  'STARTED_EXTERNALLY',
  'COMPLETED_EXTERNALLY',
  'DISABLED',
];

const PROVIDER_STATUS_COLORS = {
  'NOT_STARTED':                'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'RESEARCHING':                'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'SELECTED_FOR_OFFLINE_REVIEW': 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  'STARTED_EXTERNALLY':          'text-blue-400 border-blue-500/30 bg-blue-500/5',
  'COMPLETED_EXTERNALLY':        'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  'DISABLED':                    'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Registered agent workflow planning only',
  'No registered agent API calls',
  'No legal filing',
  'No payment processing',
  'No entity submission',
  'No credential storage',
  'No backend mutation',
  'Browser-only export',
];

const BLANK = {
  workflowName: '',
  selectedEntityId: '',
  providerTarget: 'Not Decided',
  jurisdiction: 'Not Decided',
  workflowPurpose: 'New Entity Formation',
  providerStatus: 'NOT_STARTED',
  affiliateLinkPlanned: false,
  paymentRequiredExternally: false,
  formationFiledExternally: false,
  annualReportTrackingNeeded: false,
  complianceReminderNeeded: false,
  notes: '',
};

function loadWorkflows() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_WORKFLOWS) || '[]'); } catch { return []; }
}
function saveWorkflows(d) {
  try { localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(d)); } catch {}
}

function loadEntities() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ENTITIES) || '[]'); } catch { return []; }
}

export default function RegisteredAgentWorkflow() {
  const [records, setRecords] = useState([]);
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setRecords(loadWorkflows());
    setEntities(loadEntities());
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.workflowName.trim()) return;
    const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    saveWorkflows(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveWorkflows(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_REGISTERED_AGENT_WORKFLOWS',
      registeredAgentWorkflows: records,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-registered-agent-workflows-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:                    records.length,
    researching:              records.filter(r => r.providerStatus === 'RESEARCHING').length,
    selectedForOfflineReview: records.filter(r => r.providerStatus === 'SELECTED_FOR_OFFLINE_REVIEW').length,
    startedExternally:        records.filter(r => r.providerStatus === 'STARTED_EXTERNALLY').length,
    completedExternally:      records.filter(r => r.providerStatus === 'COMPLETED_EXTERNALLY').length,
    disabled:                 records.filter(r => r.providerStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Registered Agent Workflow</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan registered agent steps · No API calls · No legal filing · No entity submission</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Workflow'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No registered agent API call, legal filing, payment processing, or entity submission occurs from this system.</div>
          <div className="text-[8px] text-destructive/70">No registered agent API calls · No legal filing · No entity submission · No payment processing · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Registered Agent Workflow Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Total Workflows',              value: counts.total,                    color: 'text-slate-200' },
            { label: 'Researching',                  value: counts.researching,              color: 'text-amber-400' },
            { label: 'Selected for Offline Review',  value: counts.selectedForOfflineReview, color: 'text-orange-400' },
            { label: 'Started Externally',           value: counts.startedExternally,        color: 'text-blue-400' },
            { label: 'Completed Externally',         value: counts.completedExternally,      color: 'text-emerald-400' },
            { label: 'Disabled',                     value: counts.disabled,                 color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'Registered Agent API Calls', value: 'DISABLED' },
            { label: 'Legal Filing',               value: 'DISABLED' },
            { label: 'Payment Processing',         value: 'DISABLED' },
            { label: 'Backend Mutation',           value: 'DISABLED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Registered Agent Workflow</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Workflow Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.workflowName}
                onChange={e => set('workflowName', e.target.value)}
                placeholder="e.g. Delaware LLC — Registered Agent Setup"
              />
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Associated Entity (optional)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.selectedEntityId} onChange={e => set('selectedEntityId', e.target.value)}>
                <option value="">— None —</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.entityLabel} ({e.entityType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Provider Target</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.providerTarget} onChange={e => set('providerTarget', e.target.value)}>
                {PROVIDER_TARGETS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Jurisdiction</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.jurisdiction} onChange={e => set('jurisdiction', e.target.value)}>
                {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Workflow Purpose</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.workflowPurpose} onChange={e => set('workflowPurpose', e.target.value)}>
                {WORKFLOW_PURPOSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Provider Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.providerStatus} onChange={e => set('providerStatus', e.target.value)}>
                {PROVIDER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-2">Planning Flags</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.affiliateLinkPlanned}
                    onChange={e => set('affiliateLinkPlanned', e.target.checked)} className="w-3 h-3" />
                  Affiliate Link Planned
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.paymentRequiredExternally}
                    onChange={e => set('paymentRequiredExternally', e.target.checked)} className="w-3 h-3" />
                  Payment Required Externally
                </label>
              </div>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-2">Tracking Needs</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.formationFiledExternally}
                    onChange={e => set('formationFiledExternally', e.target.checked)} className="w-3 h-3" />
                  Formation Filed Externally
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.annualReportTrackingNeeded}
                    onChange={e => set('annualReportTrackingNeeded', e.target.checked)} className="w-3 h-3" />
                  Annual Report Tracking Needed
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.complianceReminderNeeded}
                  onChange={e => set('complianceReminderNeeded', e.target.checked)} className="w-3 h-3" />
                Compliance Reminder Needed
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes (no credentials, no SSN, no EIN)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="High-level planning notes only"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.workflowName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Registered Agent Workflow
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No registered agent workflows yet. Click "+ New Workflow" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Registered Agent Workflows</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Workflow Name', 'Provider Target', 'Jurisdiction', 'Purpose', 'Provider Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.workflowName}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[130px] truncate">{r.providerTarget}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.jurisdiction}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[140px] truncate">{r.workflowPurpose}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${PROVIDER_STATUS_COLORS[r.providerStatus] || ''}`}>
                        {r.providerStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleRemove(r.id)}
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