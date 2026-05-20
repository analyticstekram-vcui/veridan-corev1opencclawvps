/**
 * WebhookPreviewHistoryTable
 * Filterable list of generated preview events.
 * All statuses locked to NOT_EXECUTED / NOT_DISPATCHED.
 */

import React, { useState } from 'react';
import { RISK_LEVELS, APPROVAL_STATES, RISK_COLORS, APPROVAL_COLORS } from './webhookContracts';

export default function WebhookPreviewHistoryTable({ events, onSelect }) {
  const [filterType,     setFilterType]     = useState('');
  const [filterRisk,     setFilterRisk]     = useState('');
  const [filterApproval, setFilterApproval] = useState('');

  const eventTypes = [...new Set(events.map(e => e.eventType))];

  const filtered = events.filter(e => {
    if (filterType     && e.eventType     !== filterType)     return false;
    if (filterRisk     && e.riskLevel     !== filterRisk)     return false;
    if (filterApproval && e.approvalState !== filterApproval) return false;
    return true;
  });

  if (events.length === 0) {
    return (
      <div className="bg-secondary/10 border border-border/40 rounded-sm px-4 py-6 text-center text-[8px] font-mono text-slate-500">
        No preview events generated yet. Use the generator above.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none focus:border-primary/40"
        >
          <option value="">All Event Types</option>
          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none focus:border-primary/40"
        >
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterApproval}
          onChange={e => setFilterApproval(e.target.value)}
          className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1 text-[8px] text-slate-300 focus:outline-none focus:border-primary/40"
        >
          <option value="">All Approval States</option>
          {APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-[7px] text-slate-500 self-center ml-auto">{filtered.length} of {events.length} events</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[8px]">
          <thead>
            <tr className="border-b border-border/40">
              {['Event Type', 'Risk', 'Approval', 'Route', 'Preview Hash', 'Execution', 'Dispatch', 'Created'].map(h => (
                <th key={h} className="text-left px-2 py-1.5 text-[7px] uppercase text-slate-500 font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const risk     = RISK_COLORS[e.riskLevel]     || RISK_COLORS.LOW;
              const approval = APPROVAL_COLORS[e.approvalState] || 'text-slate-400';
              return (
                <tr
                  key={e.previewId || i}
                  className="border-b border-border/20 hover:bg-secondary/20 cursor-pointer transition-colors"
                  onClick={() => onSelect(e)}
                >
                  <td className="px-2 py-2 font-bold text-foreground whitespace-nowrap">{e.eventType}</td>
                  <td className="px-2 py-2">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[7px] font-bold border ${risk.text} ${risk.bg} ${risk.border}`}>
                      {e.riskLevel}
                    </span>
                  </td>
                  <td className={`px-2 py-2 font-bold ${approval}`}>{e.approvalState}</td>
                  <td className="px-2 py-2 text-primary/70 whitespace-nowrap">{e.allowedRoute}</td>
                  <td className="px-2 py-2 text-amber-400/80">{(e.previewHash || '—').slice(0, 16)}</td>
                  <td className="px-2 py-2 text-destructive font-bold">NOT_EXECUTED</td>
                  <td className="px-2 py-2 text-destructive font-bold">NOT_DISPATCHED</td>
                  <td className="px-2 py-2 text-slate-500 whitespace-nowrap">{e.createdAt ? e.createdAt.slice(0, 10) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}