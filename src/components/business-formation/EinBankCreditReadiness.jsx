/**
 * EinBankCreditReadiness — Planning-only readiness tracker.
 * localStorage only. No EIN submission. No bank API calls. No credit bureau calls.
 * No credential storage. No sensitive identity data collection.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, AlertCircle } from 'lucide-react';

const STORAGE_KEY_READINESS = 'veridanEinBankCreditReadiness';
const STORAGE_KEY_ENTITIES = 'veridanBusinessEntityRegistry';
const MAX_RECORDS = 100;

const READINESS_TYPES = [
  'EIN',
  'Business Bank Account',
  'Business Credit Profile',
  'Business Address',
  'Business Phone',
  'Website / Domain',
  'Merchant Account',
  'Other',
];

const TARGET_PROVIDERS = [
  'IRS Offline/External',
  'Chase',
  'Mercury',
  'Relay',
  'Nav',
  'Dun & Bradstreet',
  'Experian Business',
  'Equifax Business',
  'Stripe',
  'Custom',
  'Not Decided',
];

const READINESS_STATUSES = [
  'NOT_STARTED',
  'REQUIREMENTS_REVIEW',
  'READY_FOR_OFFLINE_ACTION',
  'STARTED_EXTERNALLY',
  'COMPLETED_EXTERNALLY',
  'DISABLED',
];

const READINESS_STATUS_COLORS = {
  'NOT_STARTED':              'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'REQUIREMENTS_REVIEW':      'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'READY_FOR_OFFLINE_ACTION': 'text-primary border-primary/30 bg-primary/5',
  'STARTED_EXTERNALLY':       'text-blue-400 border-blue-500/30 bg-blue-500/5',
  'COMPLETED_EXTERNALLY':     'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  'DISABLED':                 'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'EIN bank credit readiness planning only',
  'No EIN submission',
  'No bank account opening',
  'No business credit API calls',
  'No credential storage',
  'No sensitive identity data collection',
  'No payment processing',
  'No backend mutation',
  'Browser-only export',
];

const READINESS_REQUIREMENT_MESSAGE =
  'READY_FOR_OFFLINE_ACTION requires external entity formation, operating agreement, offline responsible-party review, credential plan, and confirmation that sensitive data is not stored.';

const BLANK = {
  readinessName: '',
  selectedEntityId: '',
  readinessType: 'EIN',
  targetProvider: 'Not Decided',
  readinessStatus: 'NOT_STARTED',
  entityFormedExternally: false,
  operatingAgreementReady: false,
  responsiblePartyReviewedOffline: false,
  businessAddressReady: false,
  businessPhoneReady: false,
  websiteOrDomainReady: false,
  credentialPlanDefined: false,
  noSensitiveDataStoredConfirmed: false,
  notes: '',
};

function loadReadiness() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_READINESS) || '[]'); } catch { return []; }
}
function saveReadiness(d) {
  try { localStorage.setItem(STORAGE_KEY_READINESS, JSON.stringify(d)); } catch {}
}

function loadEntities() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ENTITIES) || '[]'); } catch { return []; }
}

function evaluateReadiness(form) {
  const allRequirementsMet =
    form.entityFormedExternally &&
    form.operatingAgreementReady &&
    form.responsiblePartyReviewedOffline &&
    form.credentialPlanDefined &&
    form.noSensitiveDataStoredConfirmed;

  const finalStatus =
    form.readinessStatus === 'READY_FOR_OFFLINE_ACTION' && !allRequirementsMet
      ? 'REQUIREMENTS_REVIEW'
      : form.readinessStatus;

  const warning =
    form.readinessStatus === 'READY_FOR_OFFLINE_ACTION' && !allRequirementsMet
      ? READINESS_REQUIREMENT_MESSAGE
      : null;

  return { finalStatus, warning };
}

export default function EinBankCreditReadiness() {
  const [records, setRecords] = useState([]);
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setRecords(loadReadiness());
    setEntities(loadEntities());
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.readinessName.trim()) return;

    const { finalStatus, warning } = evaluateReadiness(form);

    const record = {
      ...form,
      readinessStatus: finalStatus,
      readinessWarning: warning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    saveReadiness(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveReadiness(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_EIN_BANK_CREDIT_READINESS',
      readinessRecords: records,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-ein-bank-credit-readiness-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:               records.length,
    requirementsReview:  records.filter(r => r.readinessStatus === 'REQUIREMENTS_REVIEW').length,
    readyForOffline:     records.filter(r => r.readinessStatus === 'READY_FOR_OFFLINE_ACTION').length,
    startedExternally:   records.filter(r => r.readinessStatus === 'STARTED_EXTERNALLY').length,
    completedExternally: records.filter(r => r.readinessStatus === 'COMPLETED_EXTERNALLY').length,
    disabled:            records.filter(r => r.readinessStatus === 'DISABLED').length,
  };

  const allRequirementsMet =
    form.entityFormedExternally &&
    form.operatingAgreementReady &&
    form.responsiblePartyReviewedOffline &&
    form.credentialPlanDefined &&
    form.noSensitiveDataStoredConfirmed;

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">EIN / Bank / Credit Readiness</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan readiness · No EIN submission · No bank calls · No credential storage</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Readiness'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No EIN submission, bank account opening, credit bureau call, credential storage, or sensitive identity collection occurs from this system.</div>
          <div className="text-[8px] text-destructive/70">No EIN submission · No bank API calls · No business credit API calls · No credential storage · No sensitive data collection</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">EIN / Bank / Credit Readiness Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Total Records',            value: counts.total,               color: 'text-slate-200' },
            { label: 'Requirements Review',      value: counts.requirementsReview,  color: 'text-amber-400' },
            { label: 'Ready for Offline Action', value: counts.readyForOffline,     color: 'text-primary' },
            { label: 'Started Externally',       value: counts.startedExternally,   color: 'text-blue-400' },
            { label: 'Completed Externally',     value: counts.completedExternally, color: 'text-emerald-400' },
            { label: 'Disabled',                 value: counts.disabled,            color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {[
            { label: 'EIN Submission',           value: 'DISABLED' },
            { label: 'Bank Account Opening',     value: 'DISABLED' },
            { label: 'Business Credit API',      value: 'DISABLED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New EIN / Bank / Credit Readiness Record</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Readiness Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.readinessName}
                onChange={e => set('readinessName', e.target.value)}
                placeholder="e.g. Delaware LLC — EIN Application Readiness"
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
              <label className="text-[8px] text-slate-400 block mb-1">Readiness Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.readinessType} onChange={e => set('readinessType', e.target.value)}>
                {READINESS_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Provider</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetProvider} onChange={e => set('targetProvider', e.target.value)}>
                {TARGET_PROVIDERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Readiness Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.readinessStatus} onChange={e => set('readinessStatus', e.target.value)}>
                {READINESS_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {form.readinessStatus === 'READY_FOR_OFFLINE_ACTION' && !allRequirementsMet && (
              <div className="md:col-span-2 flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[8px] text-amber-400/90 leading-tight">{READINESS_REQUIREMENT_MESSAGE}</div>
              </div>
            )}

            <div>
              <label className="text-[8px] text-slate-400 block mb-2">Entity & Agreement Readiness</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.entityFormedExternally}
                    onChange={e => set('entityFormedExternally', e.target.checked)} className="w-3 h-3" />
                  Entity Formed Externally
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.operatingAgreementReady}
                    onChange={e => set('operatingAgreementReady', e.target.checked)} className="w-3 h-3" />
                  Operating Agreement Ready
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.responsiblePartyReviewedOffline}
                    onChange={e => set('responsiblePartyReviewedOffline', e.target.checked)} className="w-3 h-3" />
                  Responsible Party Reviewed Offline
                </label>
              </div>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-2">Supporting Infrastructure</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.businessAddressReady}
                    onChange={e => set('businessAddressReady', e.target.checked)} className="w-3 h-3" />
                  Business Address Ready
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.businessPhoneReady}
                    onChange={e => set('businessPhoneReady', e.target.checked)} className="w-3 h-3" />
                  Business Phone Ready
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.websiteOrDomainReady}
                    onChange={e => set('websiteOrDomainReady', e.target.checked)} className="w-3 h-3" />
                  Website / Domain Ready
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-2">Security & Compliance</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.credentialPlanDefined}
                    onChange={e => set('credentialPlanDefined', e.target.checked)} className="w-3 h-3" />
                  Credential Plan Defined
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.noSensitiveDataStoredConfirmed}
                    onChange={e => set('noSensitiveDataStoredConfirmed', e.target.checked)} className="w-3 h-3" />
                  No Sensitive Data Stored in Browser Confirmed
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes (no SSN, no DOB, no EIN, no credentials)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="High-level planning notes only"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.readinessName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save EIN / Bank / Credit Readiness
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No readiness records yet. Click "+ New Readiness" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Readiness Records</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Readiness Name', 'Type', 'Target Provider', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.readinessName}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[120px] truncate">{r.readinessType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[120px] truncate">{r.targetProvider}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${READINESS_STATUS_COLORS[r.readinessStatus] || ''}`}>
                        {r.readinessStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.readinessWarning && (
                        <AlertCircle className="w-3 h-3 text-amber-400" title={r.readinessWarning} />
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