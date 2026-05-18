/**
 * TradingBrokerSandboxRequirements — Planning-only broker sandbox tracker.
 * localStorage only. No API. No broker calls. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanBrokerSandboxRequirements';

const KNOWN_BROKERS = ['Tradovate', 'Alpaca', 'TradingView', 'BloFin', 'Interactive Brokers', 'TD Ameritrade', 'Webull', 'Custom'];
const SANDBOX_MODES = ['PAPER', 'DEMO', 'SIMULATION'];
const READINESS_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'REQUIREMENTS_DEFINED', 'BLOCKED'];

const STATUS_COLORS = {
  NOT_STARTED: 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  IN_PROGRESS: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  REQUIREMENTS_DEFINED: 'text-primary border-primary/30 bg-primary/5',
  BLOCKED: 'text-destructive border-destructive/30 bg-destructive/5',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const BLANK = {
  brokerName: 'Tradovate',
  sandboxMode: 'PAPER',
  envVarNames: '',
  allowedScopes: '',
  tradingModeAllowed: 'READ_ONLY',
  readinessStatus: 'NOT_STARTED',
  blockers: '',
  notes: '',
};

const REQUIREMENT_CHECKLIST = [
  { id: 'sandbox_env_defined', label: 'Sandbox env variable names defined (no values stored here)' },
  { id: 'sandbox_mode_confirmed', label: 'Sandbox/paper mode confirmed with broker documentation' },
  { id: 'live_blocked', label: 'Live trading confirmed inaccessible in sandbox' },
  { id: 'rate_limits_documented', label: 'API rate limits documented' },
  { id: 'auth_method_documented', label: 'Authentication method documented (type only, no credentials)' },
  { id: 'order_types_documented', label: 'Supported order types documented' },
  { id: 'instruments_documented', label: 'Available instruments documented' },
  { id: 'vault_plan_defined', label: 'Credential vault plan defined before any API work' },
];

export default function TradingBrokerSandboxRequirements() {
  const [brokers, setBrokers] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [checks, setChecks] = useState({});
  const [expandedBroker, setExpandedBroker] = useState(null);

  useEffect(() => {
    setBrokers(load());
    try { setChecks(JSON.parse(localStorage.getItem(STORAGE_KEY + '_checks') || '{}')); } catch {}
  }, []);

  const saveChecks = (c) => {
    setChecks(c);
    try { localStorage.setItem(STORAGE_KEY + '_checks', JSON.stringify(c)); } catch {}
  };

  const toggleCheck = (key) => saveChecks({ ...checks, [key]: !checks[key] });

  const handleAdd = () => {
    if (!form.brokerName.trim()) return;
    const updated = [...brokers, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }];
    setBrokers(updated);
    save(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = brokers.filter(b => b.id !== id);
    setBrokers(updated);
    save(updated);
  };

  const handleStatusChange = (id, readinessStatus) => {
    const updated = brokers.map(b => b.id === id ? { ...b, readinessStatus } : b);
    setBrokers(updated);
    save(updated);
  };

  const handleExport = () => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_BROKER_SANDBOX_REQUIREMENTS',
      executionMode: 'PLANNING_ONLY',
      liveApiCallsEnabled: false,
      brokers,
      requirementChecklist: REQUIREMENT_CHECKLIST.map(i => ({ ...i, checked: !!checks[i.id] })),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broker-sandbox-requirements-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Broker Sandbox Requirements</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Document broker sandbox requirements · No broker API calls · Planning only</div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button type="button" onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            + Add Broker
          </button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm text-[8px] text-destructive/80">
        <strong>No broker API calls are made here.</strong> This module documents requirements only. Credentials must never be entered in this form.
      </div>

      {/* General checklist */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
          <div className="text-[9px] font-bold uppercase text-slate-300">General Sandbox Requirement Checklist</div>
        </div>
        <div className="divide-y divide-border/20">
          {REQUIREMENT_CHECKLIST.map(item => (
            <label key={item.id} className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/10 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={!!checks[item.id]}
                onChange={() => toggleCheck(item.id)}
                className="accent-primary w-3 h-3 shrink-0"
              />
              <span className={`text-[8px] ${checks[item.id] ? 'line-through text-slate-600' : 'text-slate-300'}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">New Broker Sandbox Profile</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Broker Name</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.brokerName} onChange={e => setForm({ ...form, brokerName: e.target.value })}>
                {KNOWN_BROKERS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Sandbox Mode</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.sandboxMode} onChange={e => setForm({ ...form, sandboxMode: e.target.value })}>
                {SANDBOX_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Env Variable Names (no values)</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.envVarNames} onChange={e => setForm({ ...form, envVarNames: e.target.value })}
                placeholder="e.g. TRADOVATE_API_KEY, TRADOVATE_SECRET" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Allowed Scopes</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.allowedScopes} onChange={e => setForm({ ...form, allowedScopes: e.target.value })}
                placeholder="e.g. read_positions, view_charts" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Trading Mode Allowed</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.tradingModeAllowed} onChange={e => setForm({ ...form, tradingModeAllowed: e.target.value })}>
                {['NONE', 'READ_ONLY', 'PAPER_ONLY', 'LIVE_BLOCKED'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Blockers</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.blockers} onChange={e => setForm({ ...form, blockers: e.target.value })}
                placeholder="Known blockers or missing requirements" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Notes</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Operator notes" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleAdd}
              className="px-4 py-1.5 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm">
              Save Profile
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(BLANK); }}
              className="px-4 py-1.5 bg-secondary/30 border border-border text-slate-400 text-[9px] hover:bg-secondary/50 transition-colors rounded-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {brokers.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No broker profiles defined yet. Add one above.
        </div>
      ) : (
        <div className="space-y-2">
          {brokers.map(b => (
            <div key={b.id} className="bg-card border border-border/60 rounded-sm">
              <button type="button"
                onClick={() => setExpandedBroker(expandedBroker === b.id ? null : b.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/10 transition-colors text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-foreground">{b.brokerName}</span>
                  <span className="text-[7px] px-1.5 py-0.5 bg-secondary/30 border border-border/40 text-slate-400 rounded">{b.sandboxMode}</span>
                  <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold ${STATUS_COLORS[b.readinessStatus] || ''}`}>{b.readinessStatus}</span>
                </div>
                <span className={`text-[9px] text-slate-400 transition-transform ${expandedBroker === b.id ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedBroker === b.id && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-border/30 pt-2">
                  {b.envVarNames && <div className="text-[8px] text-slate-400">Env vars: <span className="font-mono text-blue-400">{b.envVarNames}</span></div>}
                  {b.allowedScopes && <div className="text-[8px] text-slate-400">Allowed scopes: {b.allowedScopes}</div>}
                  <div className="text-[8px] text-slate-400">Trading mode: <span className="text-amber-400 font-bold">{b.tradingModeAllowed}</span></div>
                  {b.blockers && <div className="text-[8px] text-destructive/80">Blockers: {b.blockers}</div>}
                  {b.notes && <div className="text-[8px] text-slate-500 italic">{b.notes}</div>}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[8px] text-slate-400">Status:</label>
                    <select className="bg-secondary/30 border border-border text-[8px] text-foreground px-1.5 py-1 rounded-sm outline-none"
                      value={b.readinessStatus} onChange={e => handleStatusChange(b.id, e.target.value)}>
                      {READINESS_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={() => handleRemove(b.id)}
                      className="ml-auto text-[7px] text-destructive/60 hover:text-destructive transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}