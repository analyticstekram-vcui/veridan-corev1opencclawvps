import React from 'react';
import { Calendar } from 'lucide-react';
import { getDaysUntil } from '@/lib/vaultAgentReportAdapter';

const DOMAIN_COLOR = {
  dashboard:  'text-primary border-primary/30 bg-primary/10',
  governance: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  operations: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

export default function ReviewsDuePanel({ reviewsDue }) {
  const sorted = [...reviewsDue].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Reviews Due</span>
        <span className="text-[7px] font-mono text-slate-500 ml-1">— Review Cycle Report</span>
        <span className="ml-auto text-[8px] font-bold font-mono text-primary">{reviewsDue.length} due within 7 days</span>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-[8px] font-mono text-slate-500 text-center">No reviews due.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[7px] font-mono">
            <thead>
              <tr className="border-b border-border/20 bg-card/60">
                <th className="text-left px-4 py-2 text-slate-500 uppercase font-bold">Document</th>
                <th className="text-left px-4 py-2 text-slate-500 uppercase font-bold">Domain</th>
                <th className="text-left px-4 py-2 text-slate-500 uppercase font-bold">Due Date</th>
                <th className="text-left px-4 py-2 text-slate-500 uppercase font-bold">Days</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const days = getDaysUntil(r.dueDate);
                const daysColor = days <= 2 ? 'text-destructive' : days <= 5 ? 'text-amber-400' : 'text-slate-300';
                const domainCls = DOMAIN_COLOR[r.domain] || DOMAIN_COLOR.operations;
                return (
                  <tr key={i} className="border-b border-border/10 hover:bg-card/40">
                    <td className="px-4 py-2 text-slate-200">{r.title}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${domainCls}`}>
                        {r.domain}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-400">{r.dueDate}</td>
                    <td className={`px-4 py-2 font-bold ${daysColor}`}>
                      {days === 0 ? 'TODAY' : days < 0 ? 'OVERDUE' : `${days}d`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}