/**
 * McpHistoryTable
 * Filterable history of visual confirmation preview runs.
 * All entries locked NOT_EXECUTED / NO_ORDER_CREATED.
 */
import React, { useState } from 'react';
import { SIDES, SCORE_BANDS, RISK_LEVELS, APPROVAL_STATES, RISK_COLORS, SCORE_COLORS } from './mcpTradingViewContracts';

export default function McpHistoryTable({ runs, onSelect }) {
  const [filterSymbol,   setFilterSymbol]   = useState('');
  const [filterSide,     setFilterSide]     = useState('');
  const [filterBand,     setFilterBand]     = useState('');
  const [filterRisk,     setFilterRisk]     = useState('');
  const [filterApproval, setFilterApproval] = useState('');

  const symbols = [...new Set(runs.map(r => r.payload?.symbol).filter(Boolean))];

  const filtered = runs.filter(r => {
    if (filterSymbol   && r.payload?.symbol !== filterSymbol)  return false;
    if (filterSide     && r.payload?.side   !== filterSide)    return false;
    if (filterBand     && r.scoreBand       !== filterBand)    return false;
    if (filterRisk     && r.riskLevel       !== filterRisk)    return false;
    if (filterApproval && r.approvalState   !== filterApproval)return false;
    return true;
  });

  if (runs.length === 0) {
    return (
      <div className="bg-secondary/10 border border-border/40 rounded-sm px-4 py-6 text-center text-[8px] font-mono text-slate-500">
        No preview runs yet. Use the generator to create your first preview.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {symbols.length > 0 && (
          <select value={filterSymbol} onChange={e => setFilterSymbol(e.target.value)}
            className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none">
            <option value="">All Symbols</option>
            {symbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={filterSide} onChange={e => setFilterSide(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none">
          <option value="">All Sides</option>
          {SIDES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterBand} onChange={e => setFilterBand(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none">
          <option value="">All Score Bands</option>
          {SCORE_BANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none">
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterApproval} onChange={e => setFilterApproval(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none">
          <option value="">All Approval States</option>
          {APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-[7px] text-slate-500 ml-auto">{filtered.length} / {runs.length} runs</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[8px]">
          <thead>
            <tr className="border-b border-border/40">
              {['Symbol','TF','Side','Signal','Score','Band','Risk','Approval','Trade Status','Created',''].map(h => (
                <th key={h} className="text-left px-2 py-1.5 text-[7px] uppercase text-slate-500 font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const risk   = RISK_COLORS[r.riskLevel]  || RISK_COLORS.LOW;
              const scoreC = SCORE_COLORS[r.scoreBand] || 'text-slate-400';
              return (
                <tr key={r.previewId || i}
                  className="border-b border-border/20 hover:bg-secondary/20 cursor-pointer transition-colors"
                  onClick={() => onSelect(r)}>
                  <td className="px-2 py-2 font-bold text-foreground whitespace-nowrap">{r.payload?.symbol}</td>
                  <td className="px-2 py-2 text-slate-400">{r.payload?.timeframe}</td>
                  <td className={`px-2 py-2 font-bold ${r.payload?.side === 'LONG' ? 'text-primary' : 'text-destructive'}`}>{r.payload?.side}</td>
                  <td className="px-2 py-2 text-slate-400 max-w-28 truncate">{r.payload?.signalName}</td>
                  <td className={`px-2 py-2 font-bold ${scoreC}`}>{r.score?.score}/10</td>
                  <td className={`px-2 py-2 font-bold ${scoreC}`}>{r.scoreBand}</td>
                  <td className="px-2 py-2">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[7px] font-bold border ${risk.text} ${risk.bg} ${risk.border}`}>
                      {r.riskLevel}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-amber-400">{r.approvalState}</td>
                  <td className="px-2 py-2 text-destructive font-bold whitespace-nowrap">NO_ORDER_CREATED</td>
                  <td className="px-2 py-2 text-slate-500 whitespace-nowrap">{r.createdAt?.slice(0,10)}</td>
                  <td className="px-2 py-2 text-slate-500 text-[7px] hover:text-primary">detail →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}