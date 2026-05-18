/**
 * AffiliateRevenuePlanner — Planning-only affiliate revenue planner.
 * localStorage only. No affiliate API calls. No payment processing. No client data submission.
 * No credential storage.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, AlertCircle } from 'lucide-react';

const STORAGE_KEY_PLANS = 'veridanAffiliateRevenuePlans';
const STORAGE_KEY_ENTITIES = 'veridanBusinessEntityRegistry';
const STORAGE_KEY_WORKFLOWS = 'veridanRegisteredAgentWorkflows';
const MAX_RECORDS = 100;

const OFFER_TYPES = [
  'LLC Formation Referral',
  'Registered Agent Referral',
  'EIN Setup Guidance',
  'Business Credit Setup Guidance',
  'Operating Agreement Template',
  'Compliance Reminder Service',
  'Upsell Package',
  'Other',
];

const PROVIDER_TARGETS = [
  'WyomingAgents',
  'Northwest Registered Agent',
  'LegalZoom',
  'Stripe Atlas',
  'Custom Provider',
  'Not Decided',
];

const REVENUE_MODELS = [
  'Affiliate Commission',
  'Service Fee',
  'Package Upsell',
  'Subscription',
  'Referral Fee',
  'Other',
];

const REVENUE_RANGES = [
  '0-99',
  '100-249',
  '250-499',
  '500-999',
  '1000+',
  'Unknown',
];

const INTERACTION_MODES = [
  'Self-Service Link',
  'Manual Consultation',
  'Internal Planning Only',
  'Not Decided',
];

const PAYMENT_STATUSES = [
  'No Payment Handling',
  'External Provider Handles Payment',
  'Manual Invoice Planned',
  'Disabled',
];

const PLAN_STATUSES = [
  'IDEA',
  'NEEDS_REVIEW',
  'READY_FOR_OFFLINE_REVIEW',
  'ACTIVE_FOR_PLANNING',
  'DISABLED',
];

const PLAN_STATUS_COLORS = {
  'IDEA':                    'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'NEEDS_REVIEW':            'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'READY_FOR_OFFLINE_REVIEW': 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  'ACTIVE_FOR_PLANNING':     'text-primary border-primary/30 bg-primary/5',
  'DISABLED':                'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Affiliate revenue planning only',
  'No affiliate API calls',
  'No payment processing',
  'No client data submission',
  'No credential storage',
  'No backend mutation',
  'External provider/payment handling only',
  'Browser-only export',
];

const ACTIVE_REQUIREMENT_MESSAGE =
  'ACTIVE_FOR_PLANNING requires affiliate link stored externally, no client sensitive data stored, and no payment processing confirmed.';

const BLANK = {
  revenuePlanName: '',
  selectedEntityId: '',
  selectedRegisteredAgentWorkflowId: '',
  offerType: 'Upsell Package',
  providerTarget: 'Not Decided',
  revenueModel: 'Affiliate Commission',
  estimatedRevenueRange: 'Unknown',
  clientInteractionMode: 'Not Decided',
  paymentStatus: 'No Payment Handling',
  planStatus: 'IDEA',
  affiliateLinkStoredExternally: false,
  noClientSensitiveDataStoredConfirmed: false,
  noPaymentProcessingConfirmed: false,
  notes: '',
};

function loadPlans() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PLANS) || '[]'); } catch { return []; }
}
function savePlans(d) {
  try { localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(d)); } catch {}
}

function loadEntities() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ENTITIES) || '[]'); } catch { return []; }
}

function loadWorkflows() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_WORKFLOWS) || '[]'); } catch { return []; }
}

function evaluatePlan(form) {
  const allRequirementsMet =
    form.affiliateLinkStoredExternally &&
    form.noClientSensitiveDataStoredConfirmed &&
    form.noPaymentProcessingConfirmed;

  const finalStatus =
    form.planStatus === 'ACTIVE_FOR_PLANNING' && !allRequirementsMet
      ? 'NEEDS_REVIEW'
      : form.planStatus;

  const warning =
    form.planStatus === 'ACTIVE_FOR_PLANNING' && !allRequirementsMet
      ? ACTIVE_REQUIREMENT_MESSAGE
      : null;

  return { finalStatus, warning };
}

export default function AffiliateRevenuePlanner() {
  const [records, setRecords] = useState([]);
  const [entities, setEntities] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setRecords(loadPlans());
    setEntities(loadEntities());
    setWorkflows(loadWorkflows());
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.revenuePlanName.trim()) return;

    const { finalStatus, warning } = evaluatePlan(form);

    const record = {
      ...form,
      planStatus: finalStatus,
      revenueWarning: warning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    savePlans(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    savePlans(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AFFILIATE_REVENUE_PLANS',
      affiliateRevenuePlans: records,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-affiliate-revenue-plans-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:                 records.length,
    needsReview:           records.filter(r => r.planStatus === 'NEEDS_REVIEW').length,
    readyForOfflineReview: records.filter(r => r.planStatus === 'READY_FOR_OFFLINE_REVIEW').length,
    activeForPlanning:     records.filter(r => r.planStatus === 'ACTIVE_FOR_PLANNING').length,
    disabled:              records.filter(r => r.planStatus === 'DISABLED').length,
  };

  const allRequirementsMet =
    form.affiliateLinkStoredExternally &&
    form.noClientSensitiveDataStoredConfirmed &&
    form.noPaymentProcessingConfirmed;

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Affiliate Revenue Planner</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan affiliate streams · No API calls · No payment processing · No credential storage</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Revenue Plan'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No affiliate API calls, payment processing, client data submission, or credential storage occurs from this system.</div>
          <div className="text-[8px] text-destructive/70">No affiliate API calls · No payment processing · No client data submission · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Affiliate Revenue Plans Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          {[
            { label: 'Total Plans',              value: counts.total,                 color: 'text-slate-200' },
            { label: 'Needs Review',             value: counts.needsReview,           color: 'text-amber-400' },
            { label: 'Ready for Offline Review', value: counts.readyForOfflineReview, color: 'text-orange-400' },
            { label: 'Active for Planning',      value: counts.activeForPlanning,     color: 'text-primary' },
            { label: 'Disabled',                 value: counts.disabled,              color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {[
            { label: 'Affiliate API Calls',     value: 'DISABLED' },
            { label: 'Payment Processing',      value: 'DISABLED' },
            { label: 'Client Data Submission',  value: 'DISABLED' },
            { label: 'Credential Storage',      value: 'DISABLED' },
            { label: 'Backend Mutation',        value: 'DISABLED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Affiliate Revenue Plan</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Revenue Plan Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.revenuePlanName}
                onChange={e => set('revenuePlanName', e.target.value)}
                placeholder="e.g. Wyoming LLC Formation Upsell Program"
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
              <label className="text-[8px] text-slate-400 block mb-1">Associated RA Workflow (optional)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.selectedRegisteredAgentWorkflowId} onChange={e => set('selectedRegisteredAgentWorkflowId', e.target.value)}>
                <option value="">— None —</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>{w.workflowName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Offer Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.offerType} onChange={e => set('offerType', e.target.value)}>
                {OFFER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Provider Target</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.providerTarget} onChange={e => set('providerTarget', e.target.value)}>
                {PROVIDER_TARGETS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Revenue Model</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.revenueModel} onChange={e => set('revenueModel', e.target.value)}>
                {REVENUE_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Estimated Revenue Range (USD)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.estimatedRevenueRange} onChange={e => set('estimatedRevenueRange', e.target.value)}>
                {REVENUE_RANGES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Client Interaction Mode</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.clientInteractionMode} onChange={e => set('clientInteractionMode', e.target.value)}>
                {INTERACTION_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Payment Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                {PAYMENT_STATUSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Plan Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.planStatus} onChange={e => set('planStatus', e.target.value)}>
                {PLAN_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {form.planStatus === 'ACTIVE_FOR_PLANNING' && !allRequirementsMet && (
              <div className="md:col-span-2 flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[8px] text-amber-400/90 leading-tight">{ACTIVE_REQUIREMENT_MESSAGE}</div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-2">Security & Compliance</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.affiliateLinkStoredExternally}
                    onChange={e => set('affiliateLinkStoredExternally', e.target.checked)} className="w-3 h-3" />
                  Affiliate Link Stored Externally
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.noClientSensitiveDataStoredConfirmed}
                    onChange={e => set('noClientSensitiveDataStoredConfirmed', e.target.checked)} className="w-3 h-3" />
                  No Client Sensitive Data Stored in Browser Confirmed
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.noPaymentProcessingConfirmed}
                    onChange={e => set('noPaymentProcessingConfirmed', e.target.checked)} className="w-3 h-3" />
                  No Payment Processing Confirmed
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes (no credentials, no client PII, no payment info)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="High-level planning notes only"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.revenuePlanName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Affiliate Revenue Plan
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No revenue plans yet. Click "+ New Revenue Plan" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Affiliate Revenue Plans</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Plan Name', 'Offer Type', 'Provider', 'Revenue Model', 'Est. Range', 'Payment Status', 'Plan Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[120px] truncate">{r.revenuePlanName}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[110px] truncate">{r.offerType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{r.providerTarget}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{r.revenueModel}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.estimatedRevenueRange}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[130px] truncate">{r.paymentStatus}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${PLAN_STATUS_COLORS[r.planStatus] || ''}`}>
                        {r.planStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.revenueWarning && (
                        <AlertCircle className="w-3 h-3 text-amber-400" title={r.revenueWarning} />
                      )}
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