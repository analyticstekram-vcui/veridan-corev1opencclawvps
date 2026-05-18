/**
 * TradingStrategyRegistry — Planning-only strategy tracker.
 * localStorage only. No API. No broker calls. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanTradingStrategyRegistry';
const MAX_RECORDS = 100;

const MARKET_TYPES = ['Futures', 'Crypto', 'Stocks', 'Forex'];
const INSTRUMENTS = ['MNQ', 'NQ', 'ES', 'MES', 'BTC', 'ETH', 'Custom'];
const STRATEGY_TYPES = [
  'EMA 2/25/200',
  'MACD Zero-Line Cross',
  'RSI Overbought/Oversold',
  'Liquidity Delta',
  'Support/Resistance Zones',
  'Smart Trail / Trend Filter',
  'Custom',
];
const STRATEGY_STATUSES = ['IDEA', 'TESTING', 'PAPER_READY', 'DISABLED'];

const STATUS_COLORS = {
  IDEA:        'text-slate-400 border-slate-500/30 bg-slate-500/5',
  TESTING:     'text-amber-400 border-amber-500/30 bg-amber-500/5',
  PAPER_READY: 'text-primary border-primary/30 bg-primary/5',
  DISABLED:    'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Strategy registry only',
  'No live trading',
  'No broker API calls',
  'No order placement',
  'No execution',
  'Browser-only export',
];

const BLANK = {
  strategyName: '',
  marketType: 'Futures',
  instrument: 'MNQ',
  timeframe: '',
  strategyType: 'EMA 2/25/200',
  entryRules: '',
  exitRules: '',
  riskModel: '',
  sessionFilter: '',
  strategyStatus: 'IDEA',
  notes: '',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function TradingStrategyRegistry() {
  const [strategies, setStrategies] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setStrategies(load()); }, []);

  const handleSave = () => {
    if (!form.strategyName.trim()) return;
    const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [record, ...strategies].slice(0, MAX_RECORDS);
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

  const handleExport = () => {
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADING_STRATEGY_REGISTRY',
      strategies,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-strategy-registry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Strategy Registry</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Plan and track trading strategies · localStorage only · No execution
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm"
          >
            <Download className="w-3 h-3" />
            Export Strategy Registry
          </button>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm"
          >
            {showForm ? 'Cancel' : '+ New Strategy'}
          </button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        Planning only · No live trading · No broker API calls · No order placement · No execution
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-1">New Strategy</div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Strategy Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.strategyName}
                onChange={e => set('strategyName', e.target.value)}
                placeholder="e.g. EMA Cross Morning Fade"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Market Type</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.marketType}
                onChange={e => set('marketType', e.target.value)}
              >
                {MARKET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Instrument</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.instrument}
                onChange={e => set('instrument', e.target.value)}
              >
                {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Timeframe</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.timeframe}
                onChange={e => set('timeframe', e.target.value)}
                placeholder="e.g. 1m, 5m, 15m, 1H"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Strategy Type</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.strategyType}
                onChange={e => set('strategyType', e.target.value)}
              >
                {STRATEGY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Strategy Status</label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.strategyStatus}
                onChange={e => set('strategyStatus', e.target.value)}
              >
                {STRATEGY_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 — text areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Entry Rules</label>
              <textarea
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50 h-16 resize-none"
                value={form.entryRules}
                onChange={e => set('entryRules', e.target.value)}
                placeholder="Describe entry conditions"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Exit Rules</label>
              <textarea
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50 h-16 resize-none"
                value={form.exitRules}
                onChange={e => set('exitRules', e.target.value)}
                placeholder="Describe exit conditions"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Risk Model</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.riskModel}
                onChange={e => set('riskModel', e.target.value)}
                placeholder="e.g. 1% per trade, 2R target"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Session Filter</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.sessionFilter}
                onChange={e => set('sessionFilter', e.target.value)}
                placeholder="e.g. NY Open 9:30–11am EST only"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Notes</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Operator notes, backtest ideas, etc."
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!form.strategyName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Strategy
          </button>
        </div>
      )}

      {/* Strategy Table */}
      {strategies.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No strategies saved yet. Click "+ New Strategy" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Strategies</div>
            <div className="text-[8px] text-slate-500">{strategies.length} / {MAX_RECORDS} records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Name', 'Market', 'Instrument', 'Timeframe', 'Type', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {strategies.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{s.strategyName}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{s.marketType}</td>
                    <td className="px-3 py-2 text-primary/80 font-mono whitespace-nowrap">{s.instrument}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{s.timeframe || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[120px] truncate">{s.strategyType}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[s.strategyStatus] || ''}`}>
                        {s.strategyStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemove(s.id)}
                        className="text-[7px] text-destructive/50 hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
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
          {SAFETY_CLAIMS.map(claim => (
            <span key={claim} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">
              {claim}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}