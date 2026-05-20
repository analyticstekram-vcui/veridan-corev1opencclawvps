import React, { useState } from 'react';
import { DRY_RUN_DECISIONS, LOCAL_WAKE_STATUSES, OPERATOR_APPROVAL_STATES, DECISIONS, DECISION_META } from './wakeActivationContracts';

export default function WakeActivationHistoryTable({ history, onSelect }) {
  const [fDry,      setFDry]      = useState('all');
  const [fWake,     setFWake]     = useState('all');
  const [fApproval, setFApproval] = useState('all');
  const [fDecision, setFDecision] = useState('all');

  const filtered = history.filter(r => {
    if (fDry      !== 'all' && r.form?.dryRunDecision      !== fDry)      return false;
    if (fWake     !== 'all' && r.form?.localWakeTestStatus !== fWake)     return false;
    if (fApproval !== 'all' && r.form?.operatorApprovalState !== fApproval) return false;
    if (fDecision !== 'all' && r.decision                  !== fDecision) return false;
    return true;
  });

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-sm p-8 text-center">
        <div className="text-[9px] text-slate-500 font-mono">No readiness records yet. Use the Readiness Checker tab to generate one.</div>
      </div>
    );
  }

  const sel = "bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[8px] font-mono text-slate-200 focus:outline-none focus:border-primary/40";

  return (
    <div className="space-y-3 font-mono">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={fDry}      onChange={e => setFDry(e.target.value)}      className={sel}>
          <option value="all">All Dry-Run Decisions</option>
          {DRY_RUN_DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={fWake}     onChange={e => setFWake(e.target.value)}     className={sel}>
          <option value="all">All Wake Statuses</option>
          {LOCAL_WAKE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fApproval} onChange={e => setFApproval(e.target.value)} className={sel}>
          <option value="all">All Approval States</option>
          {OPERATOR_APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
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
                {['Evidence ID','Dry-Run Decision','Wake Status','Approval','Decision','Checks','Created','Activation'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[7px] font-bold uppercase text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const dm = DECISION_META[r.decision] || DECISION_META.BLOCKED_NO_DRY_RUN_EVIDENCE;
                const passCount = Object.values(r.validationResults || {}).filter(Boolean).length;
                const total = Object.keys(r.validationResults || {}).length;
                return (
                  <tr key={r.evidenceId} onClick={() => onSelect(r)}
                    className={`border-b border-border/20 cursor-pointer hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                    <td className="px-3 py-2 font-mono text-primary whitespace-nowrap">{r.evidenceId}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap text-[7px]">{r.form?.dryRunDecision}</td>
                    <td className="px-3 py-2 text-amber-400 whitespace-nowrap text-[7px]">{r.form?.localWakeTestStatus}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap text-[7px]">{r.form?.operatorApprovalState}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded-sm text-[6px] font-bold ${dm.text} ${dm.bg} ${dm.border}`}>
                        {r.decision?.replace(/BLOCKED_|READY_FOR_/g, '').slice(0, 28)}…
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-bold ${r.allPass ? 'text-primary' : 'text-amber-400'}`}>{passCount}/{total}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.createdAt?.slice(0,19).replace('T',' ')}</td>
                    <td className="px-3 py-2 text-destructive font-bold whitespace-nowrap">NOT_ACTIVATED</td>
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