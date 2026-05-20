/**
 * WakeDispatchResultPanel
 * Displays safety gate results, payload preview, dispatch decision, and audit record.
 * Read-only — no dispatch, no execution.
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Copy, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { SAFETY_GATE_CHECKS, DECISION_COLORS, RISK_COLORS } from './wakeDispatchContracts';

export default function WakeDispatchResultPanel({ result }) {
  const [showPayload, setShowPayload] = useState(false);
  const [copied,      setCopied]      = useState(false);

  if (!result) return null;

  const decision = DECISION_COLORS[result.decision] || DECISION_COLORS['PREVIEW_READY_FOR_FUTURE_WAKE'];
  const risk     = RISK_COLORS[result.form?.riskLevel] || RISK_COLORS.LOW;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `wake-dispatch-preview-${result.previewId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* ID + hashes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8px]">
        {[
          { k: 'previewId',  v: result.previewId,   c: 'text-primary' },
          { k: 'auditHash',  v: result.auditHash,    c: 'text-amber-400' },
          { k: 'eventType',  v: result.form?.eventType,  c: 'text-slate-300' },
          { k: 'createdAt',  v: result.createdAt?.slice(0,19).replace('T',' '), c: 'text-slate-300' },
        ].map(({ k, v, c }) => (
          <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
            <div className={`font-mono break-all ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Decision */}
      <div className={`border rounded-sm p-4 ${decision.border} ${decision.bg}`}>
        <div className="text-[7px] uppercase text-slate-500 mb-1">Dispatch Decision</div>
        <div className={`text-[16px] font-bold ${decision.text}`}>{result.decision}</div>
        <div className="text-[7px] text-slate-400 mt-1">
          {result.decision === 'PREVIEW_READY_FOR_FUTURE_WAKE'
            ? 'All gate checks passed. Payload built locally. No network request sent. No dispatch performed.'
            : 'Dispatch blocked by safety gate. Resolve the flagged condition before re-attempting.'}
        </div>
      </div>

      {/* Safety gate */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[8px] font-bold uppercase text-slate-400">Safety Gate Results</div>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${result.allGatePass ? 'text-primary border-primary/30 bg-primary/10' : 'text-destructive border-destructive/30 bg-destructive/10'}`}>
            {result.allGatePass ? 'ALL PASS' : 'GATE FAIL'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {SAFETY_GATE_CHECKS.map(check => {
            const pass = result.gateResults?.[check.key];
            return (
              <div key={check.key} className="flex items-center gap-1.5 text-[8px]">
                {pass
                  ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  : <XCircle      className="w-3 h-3 text-destructive shrink-0" />
                }
                <span className={pass ? 'text-primary' : 'text-destructive'}>{check.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payload preview collapsible */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <button type="button" onClick={() => setShowPayload(!showPayload)}
          className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-colors">
          {showPayload ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          <span className="text-[8px] font-bold uppercase text-slate-300">Local /hooks/wake Payload Preview</span>
          <span className="ml-auto text-[7px] text-amber-400">NOT_SENT · PREVIEW_ONLY</span>
        </button>
        {showPayload && (
          <div className="p-3 space-y-2">
            <pre className="text-[8px] font-mono text-slate-300 whitespace-pre-wrap max-h-64 overflow-auto bg-secondary/20 border border-border/30 rounded-sm p-2">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
            <button type="button" onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border/40 text-slate-300 text-[8px] font-bold rounded-sm hover:text-slate-100 hover:border-border/80 transition-colors">
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy Payload JSON'}
            </button>
          </div>
        )}
      </div>

      {/* Audit record */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Audit Record</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[7px]">
          {[
            { k: 'EXECUTION_STATUS', v: result.executionStatus,  c: 'text-destructive font-bold' },
            { k: 'DISPATCH_STATUS',  v: result.dispatchStatus,   c: 'text-destructive font-bold' },
            { k: 'TRADE_STATUS',     v: result.tradeStatus,      c: 'text-destructive font-bold' },
            { k: 'BROKER_STATUS',    v: result.brokerStatus,     c: 'text-destructive font-bold' },
            { k: 'NETWORK_REQUEST',  v: 'NOT_SENT',              c: 'text-destructive font-bold' },
            { k: 'DISPATCH_MODE',    v: 'PREVIEW_ONLY',          c: 'text-amber-400 font-bold' },
          ].map(({ k, v, c }) => (
            <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1">
              <div className="text-[6px] uppercase text-slate-500">{k}</div>
              <div className={`font-mono ${c}`}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
        <div className="text-[7px] uppercase text-slate-500 mb-0.5">Next Step Recommendation</div>
        <div className="text-[8px] text-primary/80 leading-relaxed">{result.nextStepRecommendation}</div>
      </div>

      {/* Export */}
      <button type="button" onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export Full Preview Packet JSON
      </button>
    </div>
  );
}