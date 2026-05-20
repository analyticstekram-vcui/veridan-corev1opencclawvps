/**
 * WakeDispatchHistoryTable
 * Filterable table of generated wake dispatch preview records.
 * Read-only.
 */
import React, { useState } from 'react';
import { SOURCE_EVENT_TYPES, APPROVAL_STATES, RISK_LEVELS, DECISION_OUTCOMES, DECISION_COLORS, RISK_COLORS } from './wakeDispatchContracts';

export default function WakeDispatchHistoryTable({ history, onSelect }) {
  const [filterEvent,    setFilterEvent]    = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');
  const [filterRisk,     setFilterRisk]     = useState('all');
  const [filterDecision, setFilterDecision] = useState('all');

  const filtered = history.filter(r => {
    if (filterEvent    !== 'all' && r.form?.eventType    !== filterEvent)    return false;
    if (filterApproval !== 'all' && r.form?.approvalState !== filterApproval) return false;
    if (filterRisk     !== 'all' && r.form?.riskLevel    !== filterRisk)     return false;
    if (filterDecision !== 'all' && r.decision           !== filterDecision) return false;
    return true;
  });

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-sm p-8 text-center">
        <div className="text-[9px] text-slate-500 font-mono">No preview records yet. Use the Generator tab to create one.</div>
      </div>
    );
  }

  const selectClass = "bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[8px] font-mono text-slate-200 focus:outline-none focus:border-primary/40";

  return (
    <div className="space-y-3 font-mono">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterEvent}    onChange={e => setFilterEvent(e.target.value)}    className={selectClass}>
          <option value="all">All Event Types</option>
          {SOURCE_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterApproval} onChange={e => setFilterApproval(e.target.value)} className={selectClass}>
          <option value="all">All Approval States</option>
          {APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterRisk}     onChange={e => setFilterRisk(e.target.value)}     className={selectClass}>
          <option value="all">All Risk Levels</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)} className={selectClass}>
          <option value="all">All Decisions</option>
          {DECISION_OUTCOMES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-[7px] text-slate-500 ml-auto">
          {filtered.length} / {history.length} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/20">
                {['Preview ID', 'Event Type', 'Risk', 'Approval', 'Decision', 'Created', 'Exec Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[7px] font-bold uppercase text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const dec  = DECISION_COLORS[r.decision]         || {};
                const risk = RISK_COLORS[r.form?.riskLevel]      || {};
                return (
                  <tr key={r.previewId}
                    onClick={() => onSelect(r)}
                    className={`border-b border-border/20 cursor-pointer hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                    <td className="px-3 py-2 font-mono text-primary whitespace-nowrap">{r.previewId}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.form?.eventType}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded-sm text-[7px] font-bold ${risk.text} ${risk.bg} ${risk.border}`}>
                        {r.form?.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.form?.approvalState}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded-sm text-[7px] font-bold ${dec.text} ${dec.bg} ${dec.border}`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.createdAt?.slice(0,19).replace('T',' ')}</td>
                    <td className="px-3 py-2 text-destructive font-bold whitespace-nowrap">{r.executionStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}