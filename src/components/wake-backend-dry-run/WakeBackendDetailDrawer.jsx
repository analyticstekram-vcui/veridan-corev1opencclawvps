import React, { useState } from 'react';
import { X, Download, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { VALIDATION_CHECKS, DECISION_META, FIXED_STATUSES } from './wakeBackendDryRunContracts';

export default function WakeBackendDetailDrawer({ record, onClose }) {
  const [showReq,   setShowReq]   = useState(false);
  const [showRes,   setShowRes]   = useState(false);
  const [showFlags, setShowFlags] = useState(false);

  if (!record) return null;

  const dm = DECISION_META[record.decision] || DECISION_META.SERVER_DRY_RUN_VALIDATED;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `wake-backend-dry-run-${record.evidenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border/60 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col font-mono shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0 flex-wrap">
          <span className="text-[10px] font-bold text-foreground truncate flex-1">{record.form?.eventType} · {record.form?.approvalState}</span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${dm.text} ${dm.bg} ${dm.border}`}>
            {record.decision?.replace(/_/g, ' ')}
          </span>
          <span className="px-2 py-0.5 text-[7px] font-bold uppercase border border-destructive/30 bg-destructive/10 text-destructive rounded-sm">NOT_EXECUTED</span>
          <button type="button" onClick={onClose} className="ml-1 text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'evidenceId',   v: record.evidenceId,  c: 'text-primary' },
              { k: 'auditHash',    v: record.auditHash,   c: 'text-amber-400' },
              { k: 'createdAt',    v: record.createdAt?.slice(0,19).replace('T',' '), c: 'text-slate-300' },
              { k: 'riskLevel',    v: record.form?.riskLevel,    c: 'text-slate-300' },
              { k: 'channel',      v: record.form?.destinationChannel, c: 'text-slate-300' },
              { k: 'sourcePage',   v: record.form?.sourcePage,   c: 'text-slate-300' },
              { k: 'execStatus',   v: 'NOT_EXECUTED',             c: 'text-destructive font-bold' },
              { k: 'dispatchStatus',v: 'NOT_DISPATCHED',          c: 'text-destructive font-bold' },
            ].map(({ k, v, c }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Validation checks */}
          <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[7px] uppercase text-slate-500 font-bold">Server-Side Validation Checks</div>
              <span className={`px-2 py-0.5 text-[7px] font-bold border rounded-sm ${record.allPass ? 'text-primary border-primary/30 bg-primary/10' : 'text-destructive border-destructive/30 bg-destructive/10'}`}>
                {record.allPass ? 'ALL PASS' : 'BLOCKED'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {VALIDATION_CHECKS.map(c => {
                const pass = record.validationResults?.[c.key];
                return (
                  <div key={c.key} className="flex items-center gap-1.5 text-[8px]">
                    {pass ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                    <span className={pass ? 'text-primary' : 'text-destructive'}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request preview collapsible */}
          <Collapsible label="Backend Dry-Run Request Preview" open={showReq} onToggle={() => setShowReq(o => !o)} tag="NOT_SENT">
            <pre className="text-[7px] font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-auto">
              {JSON.stringify(record.requestPreview, null, 2)}
            </pre>
          </Collapsible>

          {/* Response preview collapsible */}
          <Collapsible label="Dry-Run Response Preview" open={showRes} onToggle={() => setShowRes(o => !o)} tag="SIMULATED" tagColor="text-primary">
            <pre className="text-[7px] font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-auto">
              {JSON.stringify(record.responsePreview, null, 2)}
            </pre>
          </Collapsible>

          {/* Fixed status flags collapsible */}
          <Collapsible label="Fixed Status Flags" open={showFlags} onToggle={() => setShowFlags(o => !o)}>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(FIXED_STATUSES).map(([k, v]) => (
                <div key={k} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1">
                  <div className="text-[6px] uppercase text-slate-500">{k}</div>
                  <div className={`text-[7px] font-bold font-mono ${
                    v.includes('DISABLED') || v.includes('NOT_') || v.includes('SUPPRESSED') || v.includes('PROHIBITED') || v.includes('NO_')
                      ? 'text-destructive' : 'text-amber-400'}`}>{v}</div>
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Next step */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Next Step Recommendation</div>
            <div className="text-[8px] text-primary/80 leading-relaxed">{record.nextStepRecommendation}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-[7px] font-mono text-destructive font-bold">NOT_EXECUTED · NOT_DISPATCHED · OPENCLAW_WAKE: SUPPRESSED · NETWORK: NOT_SENT</div>
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

function Collapsible({ label, open, onToggle, tag, tagColor = 'text-amber-400', children }) {
  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/20 hover:bg-secondary/40 transition-colors">
        {open ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
        <span className="text-[8px] font-bold uppercase text-slate-300">{label}</span>
        {tag && <span className={`ml-auto text-[7px] ${tagColor}`}>{tag}</span>}
      </button>
      {open && <div className="p-2 border-t border-border/30">{children}</div>}
    </div>
  );
}