/**
 * TradingStrategyRegistry — Planning-only strategy tracker.
 * localStorage only. No API. No execution.
 */

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'veridanTradingStrategyRegistry';

const STRATEGY_TYPES = ['Momentum', 'Mean Reversion', 'Breakout', 'Scalping', 'Swing', 'Arbitrage', 'Market Making', 'Other'];
const STATUS_OPTIONS = ['DRAFT', 'UNDER_REVIEW', 'APPROVED_FOR_PAPER', 'BLOCKED'];
const RISK_TIERS = ['LOW', 'MEDIUM', 'HIGH'];

const STATUS_COLORS = {
  DRAFT: 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  UNDER_REVIEW: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  APPROVED_FOR_PAPER: 'text-primary border-primary/30 bg-primary/5',
  BLOCKED: 'text-destructive border-destructive/30 bg-destructive/5',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const BLANK = { name: '', type: 'Momentum', description: '', status: 'DRAFT', riskTier: 'LOW', instruments: '', notes: '' };

export default function TradingStrategyRegistry() {
  const [strategies, setStrategies] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setStrategies(load()); }, []);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const updated = [...strategies, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }];
    setStrategies(updated);
    save(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = strategies.filter(s => s.id !== id);
    setStrategies(updated);
    save(updated);
  };

  const handleStatusChange = (id, status) => {
    const updated = strategies.map(s => s.id === id ? { ...s, status } : s);
    setStrategies(updated);
    save(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Strategy Registry</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Plan and track trading strategies · No execution · Planning only</div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm"
        >
          + Add Strategy
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">New Strategy</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Strategy name"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Type</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                {STRATEGY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Risk Tier</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.riskTier}
                onChange={e => setForm({ ...form, riskTier: e.target.value })}
              >
                {RISK_TIERS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Instruments (comma-separated)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.instruments}
                onChange={e => setForm({ ...form, instruments: e.target.value })}
                placeholder="e.g. ES, NQ, SPY"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Description</label>
              <textarea
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50 h-16 resize-none"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Strategy description and logic"
              />
            </div>
            <div className="md:col-span-2">
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
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-1.5 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm"
            >
              Save Strategy
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(BLANK); }}
              className="px-4 py-1.5 bg-secondary/30 border border-border text-slate-400 text-[9px] hover:bg-secondary/50 transition-colors rounded-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {strategies.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No strategies defined yet. Add one above.
        </div>
      ) : (
        <div className="space-y-2">
          {strategies.map(s => (
            <div key={s.id} className="bg-card border border-border/60 rounded-sm p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-foreground">{s.name}</span>
                    <span className="text-[7px] px-1.5 py-0.5 bg-secondary/30 border border-border/40 text-slate-400 rounded">{s.type}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold ${STATUS_COLORS[s.status] || ''}`}>{s.status}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold ${s.riskTier === 'HIGH' ? 'text-destructive border-destructive/30 bg-destructive/5' : s.riskTier === 'MEDIUM' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-primary border-primary/30 bg-primary/5'}`}>
                      {s.riskTier}
                    </span>
                  </div>
                  {s.instruments && <div className="text-[8px] text-slate-500 mt-1">Instruments: {s.instruments}</div>}
                  {s.description && <div className="text-[8px] text-slate-400 mt-1 leading-relaxed">{s.description}</div>}
                  {s.notes && <div className="text-[8px] text-slate-500 mt-1 italic">{s.notes}</div>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <select
                    className="bg-secondary/30 border border-border text-[8px] text-foreground px-1.5 py-1 rounded-sm outline-none"
                    value={s.status}
                    onChange={e => handleStatusChange(s.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemove(s.id)}
                    className="text-[7px] text-destructive/60 hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}