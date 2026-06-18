import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function PendingApprovalsPanel({ pendingApprovals }) {
  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Pending Approvals</span>
        <span className="text-[7px] font-mono text-slate-500 ml-1">— Pending Approval Report</span>
        <span className="ml-auto text-[8px] font-bold font-mono text-amber-400">{pendingApprovals.length} pending</span>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="px-4 py-6 text-[8px] font-mono text-slate-500 text-center">No pending approvals.</div>
      ) : (
        <div className="divide-y divide-border/20">
          {pendingApprovals.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] font-mono font-bold text-amber-400">{item.id}</span>
                  <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-400 rounded-sm">
                    {item.status}
                  </span>
                </div>
                <div className="text-[8px] font-mono text-slate-200">{item.title}</div>
                <div className="text-[7px] font-mono text-slate-500">Approver: {item.approver}</div>
              </div>
              <span className="shrink-0 text-[6px] font-bold uppercase border border-slate-600/40 text-slate-500 px-1.5 py-0.5 rounded-sm">
                READ_ONLY
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-2 border-t border-border/20 text-[7px] font-mono text-slate-600">
        This panel is read-only. Approval decisions must be made in the governance authority workflow, not from this view.
      </div>
    </div>
  );
}