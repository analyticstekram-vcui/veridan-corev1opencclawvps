import React, { useState } from 'react';
import { RISK_META } from './tvMcpContracts';
import { Trash2 } from 'lucide-react';

export default function TvMcpAuditLog({ entries, onClear }) {
  const [expanded, setExpanded] = useState(null);

  if (entries.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-sm p-5 text-center">
        <div className="text-[8px] text-slate-500 font-mono">No audit entries yet. Run a command to generate audit records.</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-secondary/20">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase text-slate-300">Local Audit Log</span>
          <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] rounded-sm">{entries.length}</span>
          <span className="text-[7px] text-slate-500">localStorage only · NOT_EXECUTED · NOT_DISPATCHED</span>
        </div>
        <button type="button" onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 bg-secondary/30 border border-border/40 text-slate-500 text-[7px] rounded-sm hover:text-destructive hover:border-destructive/30 transition-colors">
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[8px] font-mono">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/10">
              {['Audit ID','Command','Result','Risk','Symbol','Execution','Timestamp'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[7px] font-bold uppercase text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const rm = RISK_META[e.risk] || RISK_META.SAFE_READ;
              return (
                <tr key={e.auditId}
                  onClick={() => setExpanded(expanded === e.auditId ? null : e.auditId)}
                  className={`border-b border-border/20 cursor-pointer hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-2 text-primary whitespace-nowrap">{e.auditId}</td>
                  <td className="px-3 py-2 text-foreground whitespace-nowrap font-bold">{e.command}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={e.ok ? 'text-primary font-bold' : 'text-destructive font-bold'}>{e.ok ? 'OK' : 'ERROR'}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 text-[6px] font-bold border rounded-sm ${rm.text} ${rm.bg} ${rm.border}`}>{rm.label}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-[7px]">{e.symbol || '—'}</td>
                  <td className="px-3 py-2 text-destructive font-bold whitespace-nowrap text-[7px]">NOT_EXECUTED</td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{e.timestamp?.slice(0,19).replace('T',' ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}