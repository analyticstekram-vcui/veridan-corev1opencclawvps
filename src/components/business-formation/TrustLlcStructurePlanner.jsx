/**
 * TrustLlcStructurePlanner — Planning-only structure planning tracker.
 * localStorage only. No legal filing. No legal document generation. No tax advice.
 * No bank calls. No payment processing. No credential storage.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const STORAGE_KEY_STRUCTURES = 'veridanBusinessStructurePlans';
const STORAGE_KEY_ENTITIES = 'veridanBusinessEntityRegistry';
const MAX_RECORDS = 100;

const RELATIONSHIP_TYPES = [
  'Trust Owns LLC',
  'LLC Owns LLC',
  'Holding Company Owns Operating Company',
  'Trustee/Admin Manages Trust',
  'Management Company Supports Entity',
  'DAO Governance Layer',
  'Other',
];

const STRUCTURE_PURPOSES = [
  'Asset Protection',
  'Trading Operations',
  'Credit Operations',
  'Real Estate Holding',
  'Trust Administration',
  'Business Formation Services',
  'Affiliate Revenue',
  'Other',
];

const CONTROL_MODELS = [
  'Trustee Controlled',
  'Manager Managed',
  'Member Managed',
  'DAO Governed',
  'Not Decided',
];

const DOCUMENTATION_STATUSES = [
  'Not Started',
  'Draft Needed',
  'Offline Review Needed',
  'Completed Externally',
  'Disabled',
];

const DOCUMENTATION_STATUS_COLORS = {
  'Not Started':          'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'Draft Needed':         'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'Offline Review Needed': 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  'Completed Externally': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  'Disabled':             'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Structure planning only',
  'No legal filing',
  'No legal document generation',
  'No tax advice automation',
  'No payment processing',
  'No credential storage',
  'No backend mutation',
  'Browser-only export',
];

const BLANK = {
  structureName: '',
  parentEntityId: '',
  childEntityId: '',
  relationshipType: 'Trust Owns LLC',
  structurePurpose: 'Asset Protection',
  controlModel: 'Not Decided',
  documentationStatus: 'Not Started',
  taxReviewNeeded: false,
  legalReviewNeeded: false,
  operatingAgreementNeeded: false,
  trustDocumentNeeded: false,
  notes: '',
};

function loadStructures() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_STRUCTURES) || '[]'); } catch { return []; }
}
function saveStructures(d) {
  try { localStorage.setItem(STORAGE_KEY_STRUCTURES, JSON.stringify(d)); } catch {}
}

function loadEntities() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ENTITIES) || '[]'); } catch { return []; }
}

export default function TrustLlcStructurePlanner() {
  const [records, setRecords] = useState([]);
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setRecords(loadStructures());
    setEntities(loadEntities());
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.structureName.trim()) return;
    const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    saveStructures(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveStructures(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_BUSINESS_STRUCTURE_PLANS',
      structurePlans: records,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-structure-plans-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:                records.length,
    offlineReviewNeeded:  records.filter(r => r.documentationStatus === 'Offline Review Needed').length,
    completedExternally:  records.filter(r => r.documentationStatus === 'Completed Externally').length,
    disabled:             records.filter(r => r.documentationStatus === 'Disabled').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Trust / LLC Structure Planner</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan entity structures · No legal filing · No document generation · No tax advice</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Structure'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No legal documents generated or filed from this system.</div>
          <div className="text-[8px] text-destructive/70">No legal filing · No legal document generation · No tax advice · No payment processing · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Structure Plans Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total Plans',             value: counts.total,               color: 'text-slate-200' },
            { label: 'Offline Review Needed',   value: counts.offlineReviewNeeded, color: 'text-orange-400' },
            { label: 'Completed Externally',    value: counts.completedExternally, color: 'text-emerald-400' },
            { label: 'Disabled',                value: counts.disabled,            color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'Legal Filing',                   value: 'DISABLED' },
            { label: 'Legal Document Generation',      value: 'DISABLED' },
            { label: 'Tax Advice Automation',          value: 'DISABLED' },
            { label: 'Backend Mutation',               value: 'DISABLED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Structure Plan</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Structure Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.structureName}
                onChange={e => set('structureName', e.target.value)}
                placeholder="e.g. Veridan Trust → Operating LLC Structure"
              />
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Parent Entity (optional)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.parentEntityId} onChange={e => set('parentEntityId', e.target.value)}>
                <option value="">— None —</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.entityLabel} ({e.entityType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Child Entity (optional)</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.childEntityId} onChange={e => set('childEntityId', e.target.value)}>
                <option value="">— None —</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.entityLabel} ({e.entityType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Relationship Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.relationshipType} onChange={e => set('relationshipType', e.target.value)}>
                {RELATIONSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Structure Purpose</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.structurePurpose} onChange={e => set('structurePurpose', e.target.value)}>
                {STRUCTURE_PURPOSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Control Model</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.controlModel} onChange={e => set('controlModel', e.target.value)}>
                {CONTROL_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Documentation Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.documentationStatus} onChange={e => set('documentationStatus', e.target.value)}>
                {DOCUMENTATION_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-2">Documentation Checklist</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.taxReviewNeeded}
                    onChange={e => set('taxReviewNeeded', e.target.checked)} className="w-3 h-3" />
                  Tax Review Needed
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.legalReviewNeeded}
                    onChange={e => set('legalReviewNeeded', e.target.checked)} className="w-3 h-3" />
                  Legal Review Needed
                </label>
              </div>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-2">Document Planning</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.operatingAgreementNeeded}
                    onChange={e => set('operatingAgreementNeeded', e.target.checked)} className="w-3 h-3" />
                  Operating Agreement Needed
                </label>
                <label className="flex items-center gap-2 text-[9px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.trustDocumentNeeded}
                    onChange={e => set('trustDocumentNeeded', e.target.checked)} className="w-3 h-3" />
                  Trust Document Needed
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Planning Notes (no legal advice, no credentials)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="High-level planning notes only"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.structureName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Structure Plan
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No structure plans yet. Click "+ New Structure" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Structure Plans</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Structure Name', 'Relationship', 'Purpose', 'Control Model', 'Documentation', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.structureName}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[110px] truncate">{r.relationshipType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[120px] truncate">{r.structurePurpose}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.controlModel}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${DOCUMENTATION_STATUS_COLORS[r.documentationStatus] || ''}`}>
                        {r.documentationStatus}
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