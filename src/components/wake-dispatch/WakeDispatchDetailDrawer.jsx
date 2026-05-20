/**
 * WakeDispatchDetailDrawer
 * Modal showing full wake dispatch preview details.
 * Read-only — no dispatch, no execution.
 */
import React, { useState } from 'react';
import { X, Download, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { SAFETY_GATE_CHECKS, DECISION_COLORS, RISK_COLORS, FIXED_STATUSES } from './wakeDispatchContracts';

export default function WakeDispatchDetailDrawer({ result, onClose }) {
  const [showPayload, setShowPayload] = useState(false);
  const [showFlags,   setShowFlags]   = useState(false);

  if (!result) return null;

  const dec  = DECISION_COLORS[result.decision]    || DECISION_COLORS['PREVIEW_READY_FOR_FUTURE_WAKE'];
  const risk = RISK_COLORS[result.form?.riskLevel] || RISK_COLORS.LOW;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border/60 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col font-mono shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
          <span className="text-[10px] font-bold text-foreground flex-1 truncate">
            {result.form?.eventType} · {result.form?.approvalState}
          </span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${risk.text} ${risk.bg} ${risk.border}`}>
            {result.form?.riskLevel}
          </span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${dec.text} ${dec.bg} ${dec.border}`}>
            {result.decision?.replace(/_/g,' ')}
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

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'previewId',       v: result.previewId,      c: 'text-primary' },
              { k: 'auditHash',       v: result.auditHash,       c: 'text-amber-400' },
              { k: 'eventId',         v: result.payload?.eventId, c: 'text-slate-300' },
              { k: 'createdAt',       v: result.createdAt?.slice(0,19).replace('T',' '), c: 'text-slate-300' },
              { k: 'channel',         v: result.form?.destinationChannel, c: 'text-slate-300' },
              { k: 'approvalState',   v: result.form?.approvalState, c: 'text-amber-400' },
              { k: 'executionStatus', v: result.executionStatus, c: 'text-destructive font-bold' },
              { k: 'dispatchStatus',  v: result.dispatchStatus,  c: 'text-destructive font-bold' },
            ].map(({ k, v, c }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Safety gate */}
          <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[7px] uppercase text-slate-500 font-bold">Safety Gate Results</div>
              <span className={`px-2 py-0.5 text-[7px] font-bold border rounded-sm ${result.allGatePass ? 'text-primary border-primary/30 bg-primary/10' : 'text-destructive border-destructive/30 bg-destructive/10'}`}>
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
                      : <XCircle      className="w-3 h-3 text-destructive shrink-0" />}
                    <span className={pass ? 'text-primary' : 'text-destructive'}>{check.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dispatch decision */}
          <div className={`border rounded-sm p-3 ${dec.border} ${dec.bg}`}>
            <div className="text-[7px] uppercase text-slate-500 mb-1">Dispatch Decision</div>
            <div className={`text-[14px] font-bold ${dec.text}`}>{result.decision}</div>
          </div>

          {/* Payload collapsible */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <button type="button" onClick={() => setShowPayload(!showPayload)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/20 hover:bg-secondary/40 transition-colors">
              {showPayload ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              <span className="text-[8px] font-bold uppercase text-slate-300">Wake Payload Preview</span>
              <span className="ml-auto text-[7px] text-amber-400">NOT_SENT</span>
            </button>
            {showPayload && (
              <div className="p-2 border-t border-border/30">
                <pre className="text-[8px] font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-auto">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Fixed status flags collapsible */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <button type="button" onClick={() => setShowFlags(!showFlags)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/20 hover:bg-secondary/40 transition-colors">
              {showFlags ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              <span className="text-[8px] font-bold uppercase text-slate-300">Fixed Status Flags</span>
            </button>
            {showFlags && (
              <div className="p-2 border-t border-border/30 grid grid-cols-2 gap-1">
                {Object.entries(FIXED_STATUSES).map(([k, v]) => (
                  <div key={k} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1">
                    <div className="text-[6px] uppercase text-slate-500">{k}</div>
                    <div className={`text-[7px] font-bold font-mono ${v.includes('DISABLED') || v.includes('NOT_') || v.includes('NO_') || v.includes('HIDDEN') ? 'text-destructive' : 'text-amber-400'}`}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Next Step Recommendation</div>
            <div className="text-[8px] text-primary/80 leading-relaxed">{result.nextStepRecommendation}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-[7px] font-mono text-destructive font-bold">NOT_EXECUTED · NO_ORDER_CREATED · NOT_DISPATCHED · NETWORK_NOT_SENT</div>
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