/**
 * McpDetailDrawer
 * Modal showing full MCP trace, payload, checklist, score, risk gate, audit hash, and recommendation.
 * Read-only — no dispatch, no execution.
 */
import React, { useState } from 'react';
import { X, Download, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CHECKLIST_ITEMS, MCP_TRACE_STEPS, RISK_COLORS, SCORE_COLORS } from './mcpTradingViewContracts';

export default function McpDetailDrawer({ result, onClose }) {
  const [showTrace,   setShowTrace]   = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  if (!result) return null;

  const risk   = RISK_COLORS[result.riskLevel]  || RISK_COLORS.LOW;
  const scoreC = SCORE_COLORS[result.scoreBand] || 'text-slate-400';

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `mcp-detail-${result.previewId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border/60 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col font-mono shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
          <span className="text-[10px] font-bold text-foreground flex-1 truncate">
            {result.payload?.symbol} · {result.payload?.timeframe} · {result.payload?.side}
          </span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${risk.text} ${risk.bg} ${risk.border}`}>
            {result.riskLevel}
          </span>
          <span className="px-2 py-0.5 text-[7px] font-bold uppercase border border-destructive/30 bg-destructive/10 text-destructive rounded-sm">
            NOT_EXECUTED
          </span>
          <button type="button" onClick={onClose} className="ml-2 text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* IDs & hashes */}
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'previewId',      v: result.previewId,      c: 'text-primary' },
              { k: 'auditHash',      v: result.auditHash,       c: 'text-amber-400' },
              { k: 'approvalState',  v: result.approvalState,   c: 'text-amber-400' },
              { k: 'tradeStatus',    v: result.tradeStatus,     c: 'text-destructive font-bold' },
              { k: 'executionStatus',v: result.executionStatus, c: 'text-destructive font-bold' },
              { k: 'dispatchStatus', v: result.dispatchStatus,  c: 'text-destructive font-bold' },
              { k: 'signal',         v: result.payload?.signalName, c: 'text-slate-300' },
              { k: 'createdAt',      v: result.createdAt?.slice(0,19).replace('T',' '), c: 'text-slate-300' },
            ].map(({ k, v, c }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Score + Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
              <div className="text-[7px] uppercase text-slate-500">Signal Confluence Score</div>
              <div className={`text-[22px] font-bold ${scoreC}`}>
                {result.score?.score}<span className="text-[10px] text-slate-500">/10</span>
              </div>
              <div className="text-[7px] text-slate-400">Band: {result.scoreBand} · {result.score?.passed}/{result.score?.total} items passed</div>
            </div>
            <div className={`border rounded-sm p-3 space-y-1 ${risk.border} ${risk.bg}`}>
              <div className="text-[7px] uppercase text-slate-500">Risk Gate</div>
              <div className={`text-[22px] font-bold ${risk.text}`}>{result.riskLevel}</div>
              <div className="text-[7px] text-slate-400">
                {result.riskLevel === 'CRITICAL' ? 'Gate FAIL' : result.riskLevel === 'HIGH' ? 'Gate WARNING' : 'Gate PASS'}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-2">Visual Checklist Result</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {CHECKLIST_ITEMS.map(item => {
                const ok = result.checklist?.[item.key];
                return (
                  <div key={item.key} className="flex items-center gap-1.5 text-[8px]">
                    {ok ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                        : <XCircle      className="w-3 h-3 text-destructive shrink-0" />}
                    <span className={ok ? 'text-primary' : 'text-slate-500'}>
                      {item.label(result.payload?.side || 'LONG')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next step */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Next Step Recommendation</div>
            <div className="text-[8px] text-primary/80">{result.nextStepRecommendation}</div>
          </div>

          {/* MCP trace collapsible */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <button type="button" onClick={() => setShowTrace(!showTrace)}
              className="w-full flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-colors">
              {showTrace ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              <span className="text-[8px] font-bold uppercase text-slate-300">MCP Trace ({MCP_TRACE_STEPS.length} steps)</span>
              <span className="ml-auto text-[7px] text-amber-400">SIMULATED</span>
            </button>
            {showTrace && (
              <div className="p-2 space-y-1">
                {result.mcpTrace?.map((t, i) => (
                  <div key={t.step} className="flex items-center gap-2 text-[8px] bg-secondary/10 border border-border/20 rounded-sm px-2 py-1.5">
                    <span className="text-slate-600 w-3">{i+1}</span>
                    <span className="font-mono text-primary/80 flex-1">{t.step}</span>
                    <span className="text-[7px] text-amber-400">{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payload collapsible */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <button type="button" onClick={() => setShowPayload(!showPayload)}
              className="w-full flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-colors">
              {showPayload ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              <span className="text-[8px] font-bold uppercase text-slate-300">Payload JSON</span>
            </button>
            {showPayload && (
              <div className="p-2">
                <pre className="text-[8px] font-mono text-slate-300 whitespace-pre-wrap max-h-36 overflow-auto">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-[7px] font-mono text-destructive font-bold">NOT_EXECUTED · NO_ORDER_CREATED · NOT_DISPATCHED</div>
          <button type="button" onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors">
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}