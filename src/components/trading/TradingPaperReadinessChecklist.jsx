/**
 * TradingPaperReadinessChecklist — Planning-only paper trading readiness tracker.
 * Reads from veridanTradingStrategyRegistry + veridanTradingRiskRules.
 * Writes to veridanTradingPaperReadinessRecords.
 * localStorage only. No API. No broker calls. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const WRITE_KEY    = 'veridanTradingPaperReadinessRecords';
const STRATEGY_KEY = 'veridanTradingStrategyRegistry';
const RISK_KEY     = 'veridanTradingRiskRules';
const MAX_RECORDS  = 100;

const TARGET_MARKETS     = ['Futures', 'Crypto', 'Stocks', 'Forex'];
const TARGET_INSTRUMENTS = ['MNQ', 'NQ', 'ES', 'MES', 'BTC', 'ETH', 'Custom'];
const PAPER_BROKERS      = ['Tradovate', 'TradingView Paper', 'Alpaca Paper', 'BloFin Demo', 'Custom'];
const READINESS_STATUSES = ['NOT_READY', 'NEEDS_REVIEW', 'PAPER_READY', 'DISABLED'];

const STATUS_COLORS = {
  NOT_READY:    'text-destructive border-destructive/30 bg-destructive/5',
  NEEDS_REVIEW: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  PAPER_READY:  'text-primary border-primary/30 bg-primary/5',
  DISABLED:     'text-slate-400 border-slate-500/30 bg-slate-500/5',
};

const SAFETY_CLAIMS = [
  'Paper trading readiness records only',
  'No live trading',
  'No broker API calls',
  'No order placement',
  'No execution',
  'Browser-only export',
];

const PAPER_READY_WARNING =
  'PAPER_READY requires strategy, risk rule, backtest, risk limits, stop loss, take profit, and session rules.';

const BLANK = {
  readinessName: '',
  selectedStrategyId: '',
  selectedRiskRuleId: '',
  targetMarket: 'Futures',
  targetInstrument: 'MNQ',
  paperBrokerTarget: 'Tradovate',
  requiredBacktestCompleted: false,
  riskRuleAttached: false,
  maxDailyLossDefined: false,
  maxTradeCountDefined: false,
  stopLossDefined: false,
  takeProfitDefined: false,
  sessionRulesDefined: false,
  readinessStatus: 'NOT_READY',
  operatorNotes: '',
};

function loadKey(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveKey(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

/** Returns true if all PAPER_READY requirements are met */
function checkPaperReady(f, strategies, riskRules) {
  const strategyExists = strategies.some(s => s.id === f.selectedStrategyId);
  const riskRuleExists = riskRules.some(r => r.id === f.selectedRiskRuleId);
  return (
    strategyExists &&
    riskRuleExists &&
    f.requiredBacktestCompleted &&
    f.riskRuleAttached &&
    f.maxDailyLossDefined &&
    f.maxTradeCountDefined &&
    f.stopLossDefined &&
    f.takeProfitDefined &&
    f.sessionRulesDefined
  );
}

export default function TradingPaperReadinessChecklist() {
  const [records, setRecords]     = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [riskRules, setRiskRules] = useState([]);
  const [form, setForm]           = useState(BLANK);
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => {
    setRecords(loadKey(WRITE_KEY));
    setStrategies(loadKey(STRATEGY_KEY));
    setRiskRules(loadKey(RISK_KEY));
  }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.readinessName.trim()) return;

    let finalStatus = form.readinessStatus;
    let readinessWarning = null;

    if (finalStatus === 'PAPER_READY' && !checkPaperReady(form, strategies, riskRules)) {
      finalStatus = 'NEEDS_REVIEW';
      readinessWarning = PAPER_READY_WARNING;
    }

    const record = {
      ...form,
      readinessStatus: finalStatus,
      readinessWarning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    saveKey(WRITE_KEY, updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveKey(WRITE_KEY, updated);
  };

  const handleExport = () => {
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADING_PAPER_READINESS',
      readinessRecords: records,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-paper-readiness-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary counts
  const counts = {
    total:       records.length,
    notReady:    records.filter(r => r.readinessStatus === 'NOT_READY').length,
    needsReview: records.filter(r => r.readinessStatus === 'NEEDS_REVIEW').length,
    paperReady:  records.filter(r => r.readinessStatus === 'PAPER_READY').length,
    disabled:    records.filter(r => r.readinessStatus === 'DISABLED').length,
  };

  // Live readiness preview for form
  const formReady = checkPaperReady(form, strategies, riskRules);

  const BOOL_CHECKS = [
    { field: 'requiredBacktestCompleted', label: 'Backtest Completed' },
    { field: 'riskRuleAttached',          label: 'Risk Rule Attached' },
    { field: 'maxDailyLossDefined',       label: 'Max Daily Loss Defined' },
    { field: 'maxTradeCountDefined',      label: 'Max Trade Count Defined' },
    { field: 'stopLossDefined',           label: 'Stop Loss Defined' },
    { field: 'takeProfitDefined',         label: 'Take Profit Defined' },
    { field: 'sessionRulesDefined',       label: 'Session Rules Defined' },
  ];

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Paper Trading Readiness</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Link strategies to risk rules before paper trading · localStorage only · No execution
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" />
            Export Paper Trading Readiness
          </button>
          <button type="button" onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Readiness Record'}
          </button>
        </div>
      </div>

      {/* Source data availability */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`px-3 py-2 border rounded-sm text-[8px] ${strategies.length > 0 ? 'border-primary/30 bg-primary/5 text-primary' : 'border-amber-500/30 bg-amber-500/5 text-amber-400'}`}>
          Strategy Registry: <span className="font-bold">{strategies.length} strategies loaded</span>
          {strategies.length === 0 && <span className="block text-[7px] opacity-70 mt-0.5">Add strategies in the Strategy Registry tab first.</span>}
        </div>
        <div className={`px-3 py-2 border rounded-sm text-[8px] ${riskRules.length > 0 ? 'border-primary/30 bg-primary/5 text-primary' : 'border-amber-500/30 bg-amber-500/5 text-amber-400'}`}>
          Risk Rules: <span className="font-bold">{riskRules.length} rules loaded</span>
          {riskRules.length === 0 && <span className="block text-[7px] opacity-70 mt-0.5">Add risk rules in the Risk Rules tab first.</span>}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-3">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">Readiness Summary</div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          {[
            { label: 'Total',        value: counts.total,       color: 'text-slate-200' },
            { label: 'Not Ready',    value: counts.notReady,    color: 'text-destructive' },
            { label: 'Needs Review', value: counts.needsReview, color: 'text-amber-400' },
            { label: 'Paper Ready',  value: counts.paperReady,  color: 'text-primary' },
            { label: 'Disabled',     value: counts.disabled,    color: 'text-slate-500' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
          {['Live Trading', 'Broker API Calls', 'Order Placement'].map(label => (
            <div key={label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{label}:</span>
              <span className="text-[8px] font-bold text-destructive font-mono">DISABLED</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
        Planning only · No live trading · No broker API calls · No order placement · No execution
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-1">New Paper Readiness Record</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Readiness Name */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Readiness Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.readinessName}
                onChange={e => set('readinessName', e.target.value)}
                placeholder="e.g. MNQ EMA Cross Paper Plan v1"
              />
            </div>

            {/* Strategy selector */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">
                Select Strategy {strategies.length === 0 && <span className="text-amber-400">(none available)</span>}
              </label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.selectedStrategyId}
                onChange={e => set('selectedStrategyId', e.target.value)}
              >
                <option value="">-- Select Strategy --</option>
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.strategyName} ({s.instrument} · {s.strategyStatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Risk rule selector */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">
                Select Risk Rule {riskRules.length === 0 && <span className="text-amber-400">(none available)</span>}
              </label>
              <select
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.selectedRiskRuleId}
                onChange={e => set('selectedRiskRuleId', e.target.value)}
              >
                <option value="">-- Select Risk Rule --</option>
                {riskRules.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.ruleName} ({r.instrument} · {r.ruleStatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Market */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Market</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetMarket} onChange={e => set('targetMarket', e.target.value)}>
                {TARGET_MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Target Instrument */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Target Instrument</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.targetInstrument} onChange={e => set('targetInstrument', e.target.value)}>
                {TARGET_INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Paper Broker Target */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Paper Broker Target</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.paperBrokerTarget} onChange={e => set('paperBrokerTarget', e.target.value)}>
                {PAPER_BROKERS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>

            {/* Readiness Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Readiness Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.readinessStatus} onChange={e => set('readinessStatus', e.target.value)}>
                {READINESS_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Boolean Checklist */}
          <div className="bg-secondary/10 border border-border/40 rounded-sm p-3">
            <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Readiness Checklist</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {BOOL_CHECKS.map(({ field, label }) => (
                <label key={field} className="flex items-center gap-2.5 cursor-pointer hover:bg-secondary/20 px-2 py-1 rounded-sm transition-colors">
                  <input
                    type="checkbox"
                    className="accent-primary w-3 h-3 shrink-0"
                    checked={!!form[field]}
                    onChange={e => set(field, e.target.checked)}
                  />
                  <span className={`text-[8px] ${form[field] ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Live readiness preview */}
          <div className={`px-3 py-2 border rounded-sm text-[8px] font-bold ${
            formReady && form.readinessStatus === 'PAPER_READY'
              ? 'border-primary/40 bg-primary/5 text-primary'
              : form.readinessStatus === 'PAPER_READY' && !formReady
              ? 'border-amber-500/40 bg-amber-500/5 text-amber-400'
              : 'border-border/40 bg-secondary/10 text-slate-400'
          }`}>
            {form.readinessStatus === 'PAPER_READY' && !formReady
              ? '⚠ PAPER_READY selected but requirements not met — will be saved as NEEDS_REVIEW'
              : formReady
              ? '✓ All PAPER_READY requirements met'
              : 'Complete checklist and select strategy + risk rule to qualify for PAPER_READY'
            }
          </div>

          {/* Notes */}
          <div>
            <label className="text-[8px] text-slate-400 block mb-1">Operator Notes</label>
            <input
              className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
              value={form.operatorNotes}
              onChange={e => set('operatorNotes', e.target.value)}
              placeholder="Operator notes, observations, blockers"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!form.readinessName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Paper Readiness Record
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No readiness records saved yet. Click "+ New Readiness Record" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Readiness Records</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS} records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Name', 'Market', 'Instrument', 'Broker Target', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.readinessName}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.targetMarket}</td>
                    <td className="px-3 py-2 text-primary/80 font-mono whitespace-nowrap">{r.targetInstrument}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.paperBrokerTarget}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[r.readinessStatus] || ''}`}>
                        {r.readinessStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.readinessWarning
                        ? <span title={r.readinessWarning} className="flex items-center gap-1 text-amber-400 cursor-help">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[7px]">Auto-downgraded</span>
                          </span>
                        : <span className="text-[7px] text-slate-600">—</span>
                      }
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