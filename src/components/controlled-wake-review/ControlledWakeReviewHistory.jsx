import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ControlledWakeReviewHistory({ packets }) {
  const [expanded, setExpanded] = useState(null);

  if (packets.length === 0) {
    return (
      <div className="text-[8px] text-slate-500 font-mono italic border border-border/40 bg-card rounded-sm p-4">
        No review packets generated yet this session. Generate one from the Review tab.
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono">
      <div className="text-[8px] text-slate-500">
        {packets.length} review packet{packets.length !== 1 ? 's' : ''} · All locked NOT_ACTIVATED / NOT_SENT
      </div>
      {packets.map((p, i) => {
        const isOpen = expanded === i;
        const passed = p.allPass;
        return (
          <div key={p.reviewId} className={`border rounded-sm overflow-hidden ${passed ? 'border-primary/20' : 'border-destructive/20'}`}>
            <button type="button"
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-2">
                {passed
                  ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                <span className="text-[8px] text-slate-200 font-bold">{p.reviewId}</span>
                <span className={`text-[7px] font-mono ${passed ? 'text-primary' : 'text-destructive'}`}>
                  {passed ? 'REVIEW_PASSED' : 'REVIEW_BLOCKED'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[7px] text-slate-500">{new Date(p.createdAt).toLocaleString()}</span>
                {isOpen ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-border/20 pt-3 grid grid-cols-2 gap-2">
                {[
                  'reviewId', 'sourceReadinessEvidenceId', 'reviewDecision', 'allPass',
                  'activationStatus', 'networkRequest', 'openclawWakeCall', 'executionStatus',
                  'dispatchStatus', 'auditHash', 'createdAt',
                ].map(k => (
                  <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                    <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                    <div className={`font-mono text-[8px] break-all ${
                      ['activationStatus','networkRequest','openclawWakeCall','executionStatus','dispatchStatus'].includes(k)
                        ? 'text-destructive font-bold'
                        : k === 'reviewDecision' && p.allPass ? 'text-primary font-bold'
                        : 'text-slate-300'
                    }`}>{String(p[k] ?? '—')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}