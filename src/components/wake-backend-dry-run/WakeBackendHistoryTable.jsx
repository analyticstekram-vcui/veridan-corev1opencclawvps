import React, { useState } from 'react';
import { ALLOWED_EVENT_TYPES, APPROVAL_STATES, RISK_LEVELS, DECISIONS, DECISION_META } from './wakeBackendDryRunContracts';

const RISK_COLORS = { LOW: 'text-primary', MEDIUM: 'text-amber-400', HIGH: 'text-orange-400', CRITICAL: 'text-destructive' };

export default function WakeBackendHistoryTable({ history, onSelect }) {
  const [fEvent,    setFEvent]    = useState('all');
  const [fApproval, setFApproval] = useState('all');
  const [fRisk,     setFRisk]     = useState('all');
  const [fDecision, setFDecision] = useState('all');

  const filtered = history.filter(r => {
    if (fEvent    !== 'all' && r.form?.eventType    !== fEvent)    return false;
    if (fApproval !== 'all' && r.form?.approvalState !== fApproval) return false;
    if (fRisk     !== 'all' && r.form?.riskLevel    !== fRisk)     return false;
    if (fDecision !== 'all' && r.decision           !== fDecision) return false;
    return true;
  });

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-sm p-8 text-center">
        <div className="text-[9px] text-slate-500 font-mono">No dry-run records yet. Use the Dry-Run Builder tab to generate one.</div>
      </div>
    );
  }

  const sel = "bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[8px] font-mono text-slate-200 focus:outline-none focus:border-primary/40";

  return (
    <div className="space-y-3 font-mono">
      <div className="flex flex-wrap items-center gap-2">
        <select value={fEvent}    onChange={e => setFEvent(e.target.value)}    className={sel}>
          <option value="all">All Event Types</option>
          {ALLOWED_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={fApproval} onChange={e => setFApproval(e.target.value)} className={sel}>
          <option value="all">All Approval States</option>
          {APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={fRisk}     onChange={e => setFRisk(e.target.value)}     className={sel}>
          <option value="all">All Risk Levels</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={fDecision} onChange={e => setFDecision(e.target.value)} className={sel}>
          <option value="all">All Decisions</option>
          {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-[7px] text-slate-500 ml-auto">{filtered.length} / {history.length}</span>
      </div>

      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/20">
                {['Evidence ID', 'Event Type', 'Approval', 'Risk', 'Decision', 'Created', 'Exec'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[7px] font-bold uppercase text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const dm = DECISION_META[r.decision] || DECISION_META.SERVER_DRY_RUN_VALIDATED;
                return (
                  <tr key={r.evidenceId}
                    onClick={() => onSelect(r)}
                    className={`border-b border-border/20 cursor-pointer hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                    <td className="px-3 py-2 font-mono text-primary whitespace-nowrap">{r.evidenceId}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.form?.eventType}</td>
                    <td className="px-3 py-2 text-amber-400 whitespace-nowrap">{r.form?.approvalState}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-bold ${RISK_COLORS[r.form?.riskLevel] || 'text-slate-300'}`}>{r.form?.riskLevel}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded-sm text-[7px] font-bold ${dm.text} ${dm.bg} ${dm.border}`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.createdAt?.slice(0,19).replace('T',' ')}</td>
                    <td className="px-3 py-2 text-destructive font-bold whitespace-nowrap">NOT_EXECUTED</td>
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