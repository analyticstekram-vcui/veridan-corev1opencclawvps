/**
 * McpResultPanel
 * Displays MCP trace, score, risk gate, proposal preview after form submission.
 * NOT_EXECUTED · NO_ORDER_CREATED
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Copy, Download, ChevronDown, ChevronRight } from 'lucide-react';
import {
  MCP_TRACE_STEPS, CHECKLIST_ITEMS, RISK_COLORS, SCORE_COLORS,
} from './mcpTradingViewContracts';
import McpChartPreviewPanel from './McpChartPreviewPanel';

export default function McpResultPanel({ result }) {
  const [showTrace,    setShowTrace]    = useState(false);
  const [showPayload,  setShowPayload]  = useState(false);
  const [showProposal, setShowProposal] = useState(true);
  const [copied,       setCopied]       = useState(false);

  if (!result) return null;

  const risk   = RISK_COLORS[result.riskLevel] || RISK_COLORS.LOW;
  const scoreC = SCORE_COLORS[result.scoreBand] || 'text-slate-400';
  const passed = result.score.passed;
  const total  = result.score.total;
  const pct    = Math.round((passed / total) * 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `mcp-preview-${result.previewId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header summary */}
      <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
        <div className="bg-primary/10 px-4 py-2.5 flex items-center gap-2 border-b border-primary/20">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">MCP Visual Confirmation Preview Generated</span>
          <span className="ml-auto text-[7px] font-mono text-primary/60">NOT_EXECUTED · NO_ORDER_CREATED</span>
        </div>

        <div className="p-4 space-y-3">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8px]">
            {[
              { k: 'Preview ID',      v: result.previewId,       color: 'text-primary' },
              { k: 'Audit Hash',      v: result.auditHash,        color: 'text-amber-400' },
              { k: 'Created At',      v: result.createdAt.slice(0,19).replace('T',' '), color: 'text-slate-300' },
              { k: 'Approval State',  v: result.approvalState,    color: 'text-amber-400' },
              { k: 'Trade Status',    v: result.tradeStatus,      color: 'text-destructive font-bold' },
              { k: 'Execution Status',v: result.executionStatus,  color: 'text-destructive font-bold' },
              { k: 'Dispatch Status', v: result.dispatchStatus,   color: 'text-destructive font-bold' },
              { k: 'Symbol / TF',     v: `${result.payload.symbol} / ${result.payload.timeframe}`, color: 'text-slate-300' },
            ].map(({ k, v, color }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all ${color}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Score + Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Score bar */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[7px] uppercase text-slate-500">Signal Confluence Score</span>
                <span className={`text-[18px] font-bold ${scoreC}`}>{result.score.score}<span className="text-[10px] text-slate-500">/10</span></span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[7px] text-slate-400">{passed}/{total} checklist items passed ({pct}%)</div>
            </div>

            {/* Risk gate */}
            <div className={`border rounded-sm p-3 space-y-1 ${risk.border} ${risk.bg}`}>
              <div className="text-[7px] uppercase text-slate-500">Risk Gate</div>
              <div className={`text-[18px] font-bold ${risk.text}`}>{result.riskLevel}</div>
              <div className="text-[7px] text-slate-400">
                {result.riskLevel === 'CRITICAL'
                  ? 'Risk gate FAIL — not sufficient for paper trade proposal'
                  : result.riskLevel === 'HIGH'
                  ? 'Risk gate WARNING — review required'
                  : 'Risk gate PASS — eligible for operator review'}
              </div>
            </div>
          </div>

          {/* Checklist result */}
          <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-2">Visual Checklist Result</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {CHECKLIST_ITEMS.map(item => {
                const ok = result.checklist[item.key];
                return (
                  <div key={item.key} className="flex items-center gap-1.5 text-[8px]">
                    {ok
                      ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                      : <XCircle      className="w-3 h-3 text-destructive shrink-0" />
                    }
                    <span className={ok ? 'text-primary' : 'text-slate-500'}>
                      {item.label(result.payload.side)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next step */}
          <div className={`border rounded-sm px-3 py-2 ${result.score.score >= 7 ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Next Step Recommendation</div>
            <div className={`text-[8px] ${result.score.score >= 7 ? 'text-primary/80' : 'text-amber-400/80'}`}>
              {result.nextStepRecommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Chart preview */}
      <McpChartPreviewPanel payload={result.payload} />

      {/* Proposal preview */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProposal(!showProposal)}
          className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors"
        >
          {showProposal ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[9px] font-bold uppercase text-slate-300">Paper Trade Proposal Preview</span>
          <span className="ml-auto text-[7px] font-mono text-destructive font-bold">NOT_EXECUTED · NO_ORDER_CREATED</span>
        </button>
        {showProposal && (
          <div className="p-4 space-y-3 text-[8px]">
            {/* Big warnings */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: 'TRADE_STATUS',     v: 'NO_ORDER_CREATED',  c: 'text-destructive' },
                { k: 'EXECUTION_STATUS', v: 'NOT_EXECUTED',       c: 'text-destructive' },
                { k: 'DISPATCH_STATUS',  v: 'NOT_DISPATCHED',     c: 'text-destructive' },
                { k: 'OPENCLAW_DISPATCH',v: 'DISABLED',           c: 'text-destructive' },
                { k: 'BROKER_CONNECTION',v: 'NOT_CONNECTED',      c: 'text-destructive' },
                { k: 'ORDER_TYPE',       v: 'PAPER_PREVIEW_ONLY', c: 'text-amber-400' },
              ].map(({ k, v, c }) => (
                <div key={k} className="bg-destructive/5 border border-destructive/20 rounded-sm px-2 py-1.5">
                  <div className="text-[6px] text-slate-500 uppercase mb-0.5">{k}</div>
                  <div className={`font-bold font-mono ${c}`}>{v}</div>
                </div>
              ))}
            </div>
            <pre className="bg-secondary/30 border border-border/40 rounded-sm p-3 text-[8px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-52">
{JSON.stringify({
  proposalType: 'PAPER_TRADE_PREVIEW',
  previewId:    result.previewId,
  symbol:       result.payload.symbol,
  timeframe:    result.payload.timeframe,
  side:         result.payload.side,
  price:        result.payload.price,
  signalName:   result.payload.signalName,
  strategyVersion: result.payload.strategyVersion,
  sessionName:  result.payload.sessionName,
  confluenceScore: result.score.score,
  riskLevel:    result.riskLevel,
  tradeStatus:  'NO_ORDER_CREATED',
  executionStatus: 'NOT_EXECUTED',
  dispatchStatus:  'NOT_DISPATCHED',
  openClawDispatch: 'DISABLED',
  brokerConnection: 'NOT_CONNECTED',
  orderType:    'PAPER_PREVIEW_ONLY',
  approvalState: result.approvalState,
  auditHash:    result.auditHash,
  createdAt:    result.createdAt,
  safetyClaims: [
    'No order created',
    'No broker connected',
    'No OpenClaw dispatch',
    'No execution',
    'Operator approval required before any future dispatch',
  ],
}, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* MCP trace */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTrace(!showTrace)}
          className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors"
        >
          {showTrace ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[9px] font-bold uppercase text-slate-300">MCP Trace ({MCP_TRACE_STEPS.length} steps)</span>
          <span className="ml-auto text-[7px] font-mono text-amber-400">SIMULATED</span>
        </button>
        {showTrace && (
          <div className="p-3 space-y-2">
            {result.mcpTrace.map((t, i) => (
              <div key={t.step} className="flex items-start gap-3 text-[8px]">
                <span className="text-slate-600 shrink-0 w-4">{i + 1}</span>
                <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary/80">{t.step}</span>
                    <span className="ml-auto text-[7px] text-amber-400">{t.status}</span>
                  </div>
                  {t.scoreSnapshot && (
                    <div className="text-[7px] text-slate-400 mt-0.5">
                      Score: {t.scoreSnapshot.score}/10 · {t.scoreSnapshot.passed}/{t.scoreSnapshot.total} passed
                    </div>
                  )}
                  {t.riskSnapshot && (
                    <div className="text-[7px] text-slate-400 mt-0.5">
                      Risk: {t.riskSnapshot.riskLevel} · Gate: {t.riskSnapshot.passed ? 'PASS' : 'FAIL'}
                    </div>
                  )}
                  {t.auditHash && (
                    <div className="text-[7px] text-amber-400/70 mt-0.5">auditHash: {t.auditHash}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payload JSON */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPayload(!showPayload)}
          className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors"
        >
          {showPayload ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[9px] font-bold uppercase text-slate-300">Sample JSON Payload</span>
        </button>
        {showPayload && (
          <div className="p-3">
            <pre className="bg-secondary/30 border border-border/40 rounded-sm p-3 text-[8px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-48">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border/40 text-slate-300 text-[8px] font-bold rounded-sm hover:border-border/80 transition-colors">
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy Full Preview JSON'}
        </button>
        <button type="button" onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors">
          <Download className="w-3 h-3" />
          Export JSON
        </button>
      </div>
    </div>
  );
}