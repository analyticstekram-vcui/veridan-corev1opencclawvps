/**
 * TradingRiskRuleBuilder — Planning-only risk rules tracker.
 * localStorage only. No API. No broker calls. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanTradingRiskRules';
const MAX_RECORDS = 100;

const MARKET_TYPES = ['All', 'Futures', 'Crypto', 'Stocks', 'Forex'];
const INSTRUMENTS = ['All', 'MNQ', 'NQ', 'ES', 'MES', 'BTC', 'ETH', 'Custom'];
const RULE_STATUSES = ['DRAFT', 'ACTIVE_FOR_PLANNING', 'PAPER_READY', 'DISABLED'];

const STATUS_COLORS = {
  DRAFT:               'text-slate-400 border-slate-500/30 bg-slate-500/5',
  ACTIVE_FOR_PLANNING: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  PAPER_READY:         'text-primary border-primary/30 bg-primary/5',
  DISABLED:            'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Risk rules only',
  'No live trading',
  'No broker API calls',
  'No order placement',
  'No execution',
  'Browser-only export',
];

const BLANK = {
  ruleName: '',
  marketType: 'All',
  instrument: 'All',
  maxRiskPerTrade: '',
  maxDailyLoss: '',
  maxDailyProfit: '',
  maxTradesPerDay: '',
  stopLossModel: '',
  takeProfitModel: '',
  trailingStopModel: '',
  sessionRestriction: '',
  newsFilterRequired: false,
  approvalRequired: true,
  ruleStatus: 'DRAFT',
  notes: '',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function TradingRiskRuleBuilder() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRules(load()); }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.ruleName.trim()) return;
    const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [record, ...rules].slice(0, MAX_RECORDS);
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
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADING_RISK_RULES',
      riskRules: rules,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-risk-rules-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary counts
  const counts = {
    total: rules.length,
    activePlanning: rules.filter(r => r.ruleStatus === 'ACTIVE_FOR_PLANNING').length,
    paperReady: rules.filter(r => r.ruleStatus === 'PAPER_READY').length,
    disabled: rules.filter(r => r.ruleStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Risk Rule Builder</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Define risk limits and circuit breakers · localStorage only · No execution
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm"
          >
            <Download className="w-3 h-3" />
            Export Risk Rules
          </button>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm"
          >
            {showForm ? 'Cancel' : '+ New Risk Rule'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-3">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">Risk Rules Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total Rules',          value: counts.total,          color: 'text-slate-200' },
            { label: 'Active for Planning',  value: counts.activePlanning,  color: 'text-amber-400' },
            { label: 'Paper Ready',          value: counts.paperReady,      color: 'text-primary' },
            { label: 'Disabled',             value: counts.disabled,        color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
          {[
            { label: 'Live Trading',    value: 'DISABLED' },
            { label: 'Broker API Calls', value: 'DISABLED' },
            { label: 'Order Placement', value: 'DISABLED' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[8px] font-bold text-destructive font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        All rules are planning definitions only. No enforcement logic runs in this module.
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-1">New Risk Rule</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Rule Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.ruleName}
                onChange={e => set('ruleName', e.target.value)}
                placeholder="e.g. MNQ Daily Loss Cap"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Market Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.marketType} onChange={e => set('marketType', e.target.value)}>
                {MARKET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Instrument</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.instrument} onChange={e => set('instrument', e.target.value)}>
                {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Rule Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.ruleStatus} onChange={e => set('ruleStatus', e.target.value)}>
                {RULE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Max Risk Per Trade</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.maxRiskPerTrade} onChange={e => set('maxRiskPerTrade', e.target.value)}
                placeholder="e.g. $100, 1%" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Max Daily Loss</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.maxDailyLoss} onChange={e => set('maxDailyLoss', e.target.value)}
                placeholder="e.g. $500, 3%" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Max Daily Profit</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.maxDailyProfit} onChange={e => set('maxDailyProfit', e.target.value)}
                placeholder="e.g. $1000 (optional cap)" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Max Trades Per Day</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.maxTradesPerDay} onChange={e => set('maxTradesPerDay', e.target.value)}
                placeholder="e.g. 5" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Stop Loss Model</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.stopLossModel} onChange={e => set('stopLossModel', e.target.value)}
                placeholder="e.g. Fixed 10 ticks, ATR 1.5x" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Take Profit Model</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.takeProfitModel} onChange={e => set('takeProfitModel', e.target.value)}
                placeholder="e.g. 2R, Fixed 20 ticks" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Trailing Stop Model</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.trailingStopModel} onChange={e => set('trailingStopModel', e.target.value)}
                placeholder="e.g. Break-even at 1R, trail 5 ticks" />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Session Restriction</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.sessionRestriction} onChange={e => set('sessionRestriction', e.target.value)}
                placeholder="e.g. NY Open 9:30–11am EST only" />
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary w-3 h-3"
                  checked={form.newsFilterRequired}
                  onChange={e => set('newsFilterRequired', e.target.checked)} />
                <span className="text-[8px] text-slate-300">News Filter Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary w-3 h-3"
                  checked={form.approvalRequired}
                  onChange={e => set('approvalRequired', e.target.checked)} />
                <span className="text-[8px] text-slate-300">Approval Required</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Notes</label>
              <input className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Operator notes" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!form.ruleName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Risk Rule
          </button>
        </div>
      )}

      {/* Rules Table */}
      {rules.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No risk rules saved yet. Click "+ New Risk Rule" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Risk Rules</div>
            <div className="text-[8px] text-slate-500">{rules.length} / {MAX_RECORDS} records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Rule Name', 'Market', 'Instrument', 'Max Risk/Trade', 'Max Daily Loss', 'Max Trades/Day', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.ruleName}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.marketType}</td>
                    <td className="px-3 py-2 text-primary/80 font-mono whitespace-nowrap">{r.instrument}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.maxRiskPerTrade || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.maxDailyLoss || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.maxTradesPerDay || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[r.ruleStatus] || ''}`}>
                        {r.ruleStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => handleRemove(r.id)}
                        className="text-[7px] text-destructive/50 hover:text-destructive transition-colors">
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