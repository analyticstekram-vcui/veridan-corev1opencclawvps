/**
 * TradingPaperReadinessChecklist — Planning-only paper trading readiness tracker.
 * localStorage only. No API. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'veridanPaperTradingReadiness';

const CHECKLIST = [
  {
    category: 'Broker Sandbox',
    items: [
      { id: 'broker_selected', label: 'Paper trading broker / sandbox selected', required: true },
      { id: 'broker_env_defined', label: 'Broker API env variable names defined (no values stored here)', required: true },
      { id: 'broker_paper_mode', label: 'Broker confirmed in paper/demo mode', required: true },
      { id: 'broker_live_blocked', label: 'Live trading confirmed blocked', required: true },
    ],
  },
  {
    category: 'Strategy Readiness',
    items: [
      { id: 'strategy_defined', label: 'At least one strategy defined in Strategy Registry', required: true },
      { id: 'strategy_approved', label: 'At least one strategy status: APPROVED_FOR_PAPER', required: true },
      { id: 'instruments_defined', label: 'Target instruments defined', required: true },
    ],
  },
  {
    category: 'Risk Rules',
    items: [
      { id: 'max_loss_defined', label: 'Max daily loss limit defined', required: true },
      { id: 'max_position_defined', label: 'Max position size defined', required: true },
      { id: 'max_order_defined', label: 'Max order size defined', required: true },
      { id: 'kill_switch_defined', label: 'Kill switch / circuit breaker rule defined', required: true },
    ],
  },
  {
    category: 'Governance',
    items: [
      { id: 'operator_review', label: 'Operator review completed for paper trading plan', required: true },
      { id: 'audit_plan', label: 'Audit logging plan defined', required: false },
      { id: 'evidence_export', label: 'Evidence export planned', required: false },
    ],
  },
];

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function TradingPaperReadinessChecklist() {
  const [checked, setChecked] = useState({});

  useEffect(() => { setChecked(load()); }, []);

  const toggle = (id) => {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    save(updated);
  };

  const allRequired = CHECKLIST.flatMap(c => c.items.filter(i => i.required));
  const completedRequired = allRequired.filter(i => checked[i.id]);
  const pct = allRequired.length ? Math.round((completedRequired.length / allRequired.length) * 100) : 0;
  const ready = pct === 100;

  const handleExport = () => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_PAPER_TRADING_READINESS_CHECKLIST',
      readinessStatus: ready ? 'READY_FOR_PAPER_REVIEW' : 'NOT_READY',
      completionPct: pct,
      items: CHECKLIST.flatMap(c => c.items.map(i => ({ ...i, checked: !!checked[i.id] }))),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paper-trading-readiness-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Paper Trading Readiness</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Track what's needed before paper trading can begin · No execution</div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border/50 rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-slate-300">Required Items Completed</span>
          <span className={`text-[10px] font-bold font-mono ${ready ? 'text-primary' : 'text-amber-400'}`}>{completedRequired.length}/{allRequired.length} ({pct}%)</span>
        </div>
        <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${ready ? 'bg-primary' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`text-[8px] font-bold mt-1.5 ${ready ? 'text-primary' : 'text-amber-400'}`}>
          {ready ? 'READY FOR PAPER REVIEW' : 'NOT READY — complete required items'}
        </div>
      </div>

      {/* Checklist */}
      {CHECKLIST.map(cat => (
        <div key={cat.category} className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
            <div className="text-[9px] font-bold uppercase text-slate-300">{cat.category}</div>
          </div>
          <div className="divide-y divide-border/20">
            {cat.items.map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/10 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)}
                  className="accent-primary w-3 h-3 shrink-0"
                />
                <span className={`text-[8px] flex-1 ${checked[item.id] ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                  {item.label}
                </span>
                {item.required && (
                  <span className="text-[7px] text-amber-400/70 border border-amber-500/20 px-1 rounded shrink-0">REQUIRED</span>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}