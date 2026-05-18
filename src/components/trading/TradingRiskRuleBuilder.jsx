/**
 * TradingRiskRuleBuilder — Planning-only risk rule tracker.
 * localStorage only. No API. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanTradingRiskRules';

const RULE_TYPES = [
  'MAX_DAILY_LOSS',
  'MAX_POSITION_SIZE',
  'MAX_ORDER_SIZE',
  'MAX_OPEN_POSITIONS',
  'KILL_SWITCH',
  'DRAWDOWN_LIMIT',
  'LOSS_STREAK_LIMIT',
  'TIME_BOUNDARY',
  'INSTRUMENT_BLOCK',
  'CUSTOM',
];

const ENFORCEMENT_MODES = ['DEFINED_NOT_ACTIVE', 'ACTIVE_FOR_PAPER', 'ACTIVE_FOR_LIVE'];

const ENFORCEMENT_COLORS = {
  DEFINED_NOT_ACTIVE: 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  ACTIVE_FOR_PAPER: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  ACTIVE_FOR_LIVE: 'text-primary border-primary/30 bg-primary/5',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const BLANK = { ruleType: 'MAX_DAILY_LOSS', label: '', value: '', unit: '', enforcement: 'DEFINED_NOT_ACTIVE', notes: '' };

export default function TradingRiskRuleBuilder() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRules(load()); }, []);

  const handleAdd = () => {
    if (!form.label.trim()) return;
    const updated = [...rules, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }];
    setRules(updated);
    save(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    save(updated);
  };

  const handleExport = () => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADING_RISK_RULES',
      executionMode: 'PLANNING_ONLY',
      rules,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-risk-rules-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Risk Rule Builder</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Define risk limits and circuit breakers · Planning only · No enforcement active</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        All rules are <strong>DEFINED_NOT_ACTIVE</strong> by default. No enforcement logic runs in this module.
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">New Risk Rule</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Label *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Daily Loss Limit"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Rule Type</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.ruleType}
                onChange={e => setForm({ ...form, ruleType: e.target.value })}
              >
                {RULE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Value</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Unit</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. USD, %, contracts"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Enforcement Mode</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.enforcement}
                onChange={e => setForm({ ...form, enforcement: e.target.value })}
              >
                {ENFORCEMENT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Notes</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Operator notes"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleAdd}
              className="px-4 py-1.5 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm">
              Save Rule
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(BLANK); }}
              className="px-4 py-1.5 bg-secondary/30 border border-border text-slate-400 text-[9px] hover:bg-secondary/50 transition-colors rounded-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No risk rules defined yet. Add one above.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="bg-card border border-border/60 rounded-sm p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-foreground">{r.label}</span>
                    <span className="text-[7px] px-1.5 py-0.5 bg-secondary/30 border border-border/40 text-slate-400 rounded font-mono">{r.ruleType}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold ${ENFORCEMENT_COLORS[r.enforcement] || ''}`}>{r.enforcement}</span>
                  </div>
                  {(r.value || r.unit) && (
                    <div className="text-[8px] text-primary/80 font-mono mt-1">{r.value} {r.unit}</div>
                  )}
                  {r.notes && <div className="text-[8px] text-slate-500 mt-1 italic">{r.notes}</div>}
                </div>
                <button type="button" onClick={() => handleRemove(r.id)}
                  className="text-[7px] text-destructive/60 hover:text-destructive transition-colors shrink-0">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}