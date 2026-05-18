/**
 * BusinessEntityRegistry — Planning-only entity registry tracker.
 * localStorage only. No legal filing. No EIN submission. No bank calls.
 * No payment processing. No registered agent API calls. No credential storage.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'veridanBusinessEntityRegistry';
const MAX_RECORDS = 100;

const ENTITY_TYPES = [
  'LLC',
  'S-Corp',
  'C-Corp',
  'Sole Proprietorship',
  'General Partnership',
  'Limited Partnership',
  'Series LLC',
  'Trust',
  'Nonprofit',
  'Other',
];

const FORMATION_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','District of Columbia','Foreign/International',
];

const PLAN_STATUSES = [
  'IDEA',
  'RESEARCHING',
  'READY_TO_FILE',
  'FILED_EXTERNALLY',
  'ACTIVE',
  'SUSPENDED',
  'DISSOLVED',
  'ON_HOLD',
];

const PLAN_STATUS_COLORS = {
  IDEA:              'text-slate-400 border-slate-500/30 bg-slate-500/5',
  RESEARCHING:       'text-amber-400 border-amber-500/30 bg-amber-500/5',
  READY_TO_FILE:     'text-primary border-primary/30 bg-primary/5',
  FILED_EXTERNALLY:  'text-blue-400 border-blue-500/30 bg-blue-500/5',
  ACTIVE:            'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  SUSPENDED:         'text-orange-400 border-orange-500/30 bg-orange-500/5',
  DISSOLVED:         'text-destructive border-destructive/30 bg-destructive/5',
  ON_HOLD:           'text-slate-400 border-slate-500/30 bg-slate-500/5',
};

const PURPOSES = [
  'Holding Company',
  'Operating Company',
  'Real Estate Holding',
  'IP Holding',
  'Trading Entity',
  'Affiliate / Marketing',
  'Consulting',
  'E-Commerce',
  'Service Business',
  'Non-Profit / Charitable',
  'Other',
];

const SAFETY_CLAIMS = [
  'Planning only',
  'No legal filing',
  'No EIN submission',
  'No bank API calls',
  'No payment processing',
  'No registered agent API calls',
  'No credential storage',
  'No SSN collection',
  'No document upload',
  'Browser-only export',
];

const BLANK = {
  entityLabel: '',
  entityType: 'LLC',
  formationState: 'Delaware',
  purpose: 'Holding Company',
  planStatus: 'IDEA',
  parentEntityLabel: '',
  registeredAgentNote: '',
  operatorNotes: '',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

export default function BusinessEntityRegistry() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRecords(load()); }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.entityLabel.trim()) return;
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
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_BUSINESS_ENTITY_REGISTRY',
      records,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-entity-registry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:           records.length,
    idea:            records.filter(r => r.planStatus === 'IDEA').length,
    researching:     records.filter(r => r.planStatus === 'RESEARCHING').length,
    readyToFile:     records.filter(r => r.planStatus === 'READY_TO_FILE').length,
    filedExternally: records.filter(r => r.planStatus === 'FILED_EXTERNALLY').length,
    active:          records.filter(r => r.planStatus === 'ACTIVE').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Entity Registry</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan entity formations · No legal filing · No EIN submission · No credential storage</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Entity'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No legal filing, EIN submission, bank calls, or credential storage occur from this system.</div>
          <div className="text-[8px] text-destructive/70">No legal filing · No EIN submission · No bank API calls · No payment processing · No registered agent API calls</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Entity Registry Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
          {[
            { label: 'Total Entities',    value: counts.total,           color: 'text-slate-200' },
            { label: 'Idea',              value: counts.idea,            color: 'text-slate-400' },
            { label: 'Researching',       value: counts.researching,     color: 'text-amber-400' },
            { label: 'Ready to File',     value: counts.readyToFile,     color: 'text-primary' },
            { label: 'Filed Externally',  value: counts.filedExternally, color: 'text-blue-400' },
            { label: 'Active',            value: counts.active,          color: 'text-emerald-400' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'Legal Filing',                value: 'DISABLED' },
            { label: 'EIN Submission',              value: 'DISABLED' },
            { label: 'Bank API Calls',              value: 'DISABLED' },
            { label: 'Credential Storage',          value: 'DISABLED' },
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
          <div className="text-[9px] font-bold uppercase text-slate-300">New Entity Record</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Entity Label * (no EIN, no SSN, no account numbers)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.entityLabel}
                onChange={e => set('entityLabel', e.target.value)}
                placeholder="e.g. Veridan Holdings LLC (general reference only)"
              />
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Entity Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.entityType} onChange={e => set('entityType', e.target.value)}>
                {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Formation State</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.formationState} onChange={e => set('formationState', e.target.value)}>
                {FORMATION_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Purpose</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                {PURPOSES.map(p => <option key={p}>{p}</option>)}
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
              <label className="text-[8px] text-slate-400 block mb-1">Parent Entity Label (optional)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.parentEntityLabel}
                onChange={e => set('parentEntityLabel', e.target.value)}
                placeholder="e.g. Parent Holding LLC"
              />
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Registered Agent Note (general, no API calls)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.registeredAgentNote}
                onChange={e => set('registeredAgentNote', e.target.value)}
                placeholder="e.g. Plan to use third-party RA service"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Operator Notes (no EIN, no SSN, no credentials)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.operatorNotes}
                onChange={e => set('operatorNotes', e.target.value)}
                placeholder="High-level planning notes only"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.entityLabel.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Entity
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No entities yet. Click "+ New Entity" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Entities</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Label', 'Type', 'State', 'Purpose', 'Parent', 'Plan Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.entityLabel}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap">{r.entityType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.formationState}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{r.purpose}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap max-w-[110px] truncate">{r.parentEntityLabel || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${PLAN_STATUS_COLORS[r.planStatus] || ''}`}>
                        {r.planStatus}
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