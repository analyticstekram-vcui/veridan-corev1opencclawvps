/**
 * TvMcpKnownResults
 * Phase 2: Manually verified terminal results from local MCP CLI runs.
 * Operator evidence capture — no execution, no live data.
 */
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { KNOWN_MCP_RESULTS, RISK_META } from './tvMcpContracts';

export default function TvMcpKnownResults() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[9px] font-bold uppercase text-slate-300">Known MCP Command Results</span>
          <span className="ml-2 text-[7px] text-slate-500 font-mono">manually verified terminal output · TVMCP-20</span>
        </div>
        <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">
          {KNOWN_MCP_RESULTS.length} verified
        </span>
      </div>

      <div className="divide-y divide-border/20">
        {KNOWN_MCP_RESULTS.map((r) => {
          const rm = RISK_META[r.riskClass] || RISK_META.SAFE_READ;
          const isOpen = expanded === r.command;
          const isReview = r.riskClass === 'REVIEW_REQUIRED';

          return (
            <div key={r.command}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : r.command)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors text-left"
              >
                {isReview
                  ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                }
                <span className="text-[9px] font-bold font-mono text-foreground w-20 shrink-0">{r.command}</span>
                <span className={`px-1.5 py-0.5 text-[7px] font-bold border rounded-sm shrink-0 ${rm.text} ${rm.bg} ${rm.border}`}>
                  {rm.label}
                </span>
                <span className="text-[8px] text-slate-400 flex-1">{r.summary}</span>
                {isOpen
                  ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                  : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-4 pb-3 space-y-2 bg-secondary/10">
                  <div className="text-[7px] text-slate-500 font-mono italic">{r.note}</div>
                  <pre className="text-[8px] font-mono text-slate-300 bg-secondary/30 border border-border/30 rounded-sm p-3 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(r.detail, null, 2)}
                  </pre>
                  <div className="flex items-center gap-2 flex-wrap text-[7px] font-mono">
                    <span className="text-slate-500">source: <span className="text-amber-400 font-bold">LOCAL_TERMINAL_VERIFIED</span></span>
                    <span className="text-slate-500">executionStatus: <span className="text-destructive font-bold">NOT_EXECUTED_IN_CLOUD</span></span>
                    <span className="text-slate-500">liveData: <span className="text-destructive font-bold">NOT_TRANSMITTED</span></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-border/20 bg-secondary/5">
        <div className="text-[7px] text-slate-500 font-mono">
          These results were captured from manual operator terminal runs on the local machine.
          No live data is stored or transmitted. See TVMCP-20 for evidence chain.
        </div>
      </div>
    </div>
  );
}