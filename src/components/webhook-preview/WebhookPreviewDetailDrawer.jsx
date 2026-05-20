/**
 * WebhookPreviewDetailDrawer
 * Modal/drawer showing full packet details for a preview event.
 * Read-only — no dispatch, no execution.
 */

import React from 'react';
import { X, Download } from 'lucide-react';
import { RISK_COLORS, APPROVAL_COLORS } from './webhookContracts';

const HARD_CONSTRAINTS = [
  'No live dispatch',
  'No filesystem write',
  'No OpenClaw dispatch',
  'No external webhook exposure',
  'No agent/API execution',
  'No browser automation',
  'No credential display',
  'No live mode',
  'Preview only — NOT_EXECUTED · NOT_DISPATCHED',
];

export default function WebhookPreviewDetailDrawer({ event, onClose }) {
  if (!event) return null;

  const risk     = RISK_COLORS[event.riskLevel]     || RISK_COLORS.LOW;
  const approval = APPROVAL_COLORS[event.approvalState] || 'text-slate-400';

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(event, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `webhook-preview-${event.previewId || event.eventType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border/60 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col font-mono shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
          <span className="text-[10px] font-bold text-foreground flex-1 truncate">{event.eventType}</span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${risk.text} ${risk.bg} ${risk.border}`}>
            {event.riskLevel}
          </span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border border-border/30 bg-secondary/20 rounded-sm ${approval}`}>
            {event.approvalState}
          </span>
          <button type="button" onClick={onClose} className="ml-2 text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'previewId',      v: event.previewId || '(contract)' },
              { k: 'createdAt',      v: event.createdAt || event.updatedAt || '—' },
              { k: 'allowedRoute',   v: event.allowedRoute },
              { k: 'destination',    v: event.destinationSystem },
              { k: 'previewHash',    v: event.previewHash || '—' },
              { k: 'auditHash',      v: event.auditHash   || '—' },
              { k: 'executionStatus',v: 'NOT_EXECUTED' },
              { k: 'dispatchStatus', v: 'NOT_DISPATCHED' },
            ].map(({ k, v }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all ${v === 'NOT_EXECUTED' || v === 'NOT_DISPATCHED' ? 'text-destructive font-bold' : 'text-slate-300'}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Description</div>
            <div className="text-[8px] text-slate-300">{event.description}</div>
          </div>

          {/* Payload JSON */}
          <div className="space-y-1">
            <div className="text-[7px] uppercase text-slate-500 font-bold">Full Payload JSON</div>
            <pre className="bg-secondary/30 border border-border/40 rounded-sm p-3 text-[8px] font-mono text-slate-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
              {JSON.stringify(event.payload || event.samplePayload, null, 2)}
            </pre>
          </div>

          {/* Hard constraints */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-3">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-2">Hard Constraints</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {HARD_CONSTRAINTS.map((c, i) => (
                <div key={i} className="text-[8px] text-destructive/80 font-mono flex items-center gap-1.5">
                  <span className="text-destructive">✗</span> {c}
                </div>
              ))}
            </div>
          </div>

          {/* Next step */}
          {event.nextStepRecommendation && (
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
              <div className="text-[6px] uppercase text-slate-500 mb-0.5">Next Step Recommendation</div>
              <div className="text-[8px] text-primary/80">{event.nextStepRecommendation}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-[7px] font-mono text-slate-600">Preview only · NOT_EXECUTED · NOT_DISPATCHED</div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}