import React, { useState } from 'react';
import { X, Download, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { READINESS_CHECKS, DECISION_META, FIXED_STATUSES } from './wakeActivationContracts';

function Collapsible({ label, open, onToggle, tag, tagColor = 'text-amber-400', children }) {
  return (
    <div className="bg-secondary/10 border border-border/30 rounded-sm overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/20 hover:bg-secondary/40 transition-colors">
        {open ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
        <span className="text-[8px] font-bold uppercase text-slate-300 flex-1 text-left">{label}</span>
        {tag && <span className={`text-[7px] ${tagColor}`}>{tag}</span>}
      </button>
      {open && <div className="p-3 border-t border-border/20">{children}</div>}
    </div>
  );
}

export default function WakeActivationDetailDrawer({ record, onClose }) {
  const [showForm,   setShowForm]   = useState(false);
  const [showFlags,  setShowFlags]  = useState(false);
  const [showChecks, setShowChecks] = useState(true);

  if (!record) return null;

  const dm = DECISION_META[record.decision] || DECISION_META.BLOCKED_NO_DRY_RUN_EVIDENCE;
  const passCount = Object.values(record.validationResults || {}).filter(Boolean).length;
  const total     = Object.keys(record.validationResults || {}).length;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `wake-activation-readiness-${record.evidenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border/60 rounded-sm w-full max-w-2xl max-h-[92vh] flex flex-col font-mono shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0 flex-wrap">
          <span className="text-[10px] font-bold text-foreground flex-1 truncate">Readiness Record — {record.evidenceId}</span>
          <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${dm.text} ${dm.bg} ${dm.border}`}>
            {record.decision?.length > 30 ? record.decision?.slice(0, 30) + '…' : record.decision}
          </span>
          <span className="px-2 py-0.5 text-[7px] font-bold uppercase border border-destructive/30 bg-destructive/10 text-destructive rounded-sm">
            NOT_ACTIVATED
          </span>
          <button type="button" onClick={onClose} className="ml-1 text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'evidenceId',        v: record.evidenceId,                           c: 'text-primary' },
              { k: 'auditHash',         v: record.auditHash,                            c: 'text-amber-400' },
              { k: 'createdAt',         v: record.createdAt?.slice(0,19).replace('T',' '), c: 'text-slate-300' },
              { k: 'allPass',           v: String(record.allPass),                      c: record.allPass ? 'text-primary' : 'text-amber-400' },
              { k: 'passCount',         v: `${passCount} / ${total}`,                  c: 'text-slate-300' },
              { k: 'activationStatus',  v: 'NOT_ACTIVATED',                             c: 'text-destructive font-bold' },
              { k: 'networkRequest',    v: 'NOT_SENT',                                  c: 'text-destructive font-bold' },
              { k: 'openClawWakeCall',  v: 'NOT_SENT',                                  c: 'text-destructive font-bold' },
              { k: 'openClawAgentCall', v: 'PROHIBITED',                                c: 'text-destructive font-bold' },
              { k: 'tokenAccess',       v: 'NOT_READ_IN_READINESS_CHECK',               c: 'text-rose-400 font-bold' },
            ].map(({ k, v, c }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Decision block */}
          <div className={`border rounded-sm px-4 py-3 space-y-1 ${dm.border} ${dm.bg}`}>
            <div className="text-[7px] uppercase text-slate-500 font-bold">Activation Decision</div>
            <div className={`text-[11px] font-bold font-mono ${dm.text}`}>{record.decision}</div>
            <div className={`text-[8px] leading-relaxed ${dm.text} opacity-70`}>{record.nextStepRecommendation}</div>
          </div>

          {/* Readiness checks collapsible */}
          <Collapsible label={`Readiness Checks (${passCount}/${total})`} open={showChecks} onToggle={() => setShowChecks(o => !o)}
            tag={record.allPass ? 'ALL PASS' : `${total - passCount} FAILING`}
            tagColor={record.allPass ? 'text-primary' : 'text-destructive'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {READINESS_CHECKS.map(c => {
                const pass = record.validationResults?.[c.key];
                return (
                  <div key={c.key} className="flex items-center gap-1.5 text-[8px]">
                    {pass ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                    <span className={pass ? 'text-slate-300' : 'text-destructive'}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </Collapsible>

          {/* Form inputs collapsible */}
          <Collapsible label="Form Input Evidence" open={showForm} onToggle={() => setShowForm(o => !o)} tag="READ_ONLY">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(record.form || {}).filter(([k]) => k !== 'operatorNote').map(([k, v]) => (
                <div key={k} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1">
                  <div className="text-[6px] uppercase text-slate-500">{k}</div>
                  <div className="text-[7px] font-mono text-slate-300 break-all">{v || '(empty)'}</div>
                </div>
              ))}
              {record.form?.operatorNote && (
                <div className="col-span-2 bg-secondary/20 border border-border/20 rounded-sm px-2 py-1">
                  <div className="text-[6px] uppercase text-slate-500">operatorNote</div>
                  <div className="text-[7px] font-mono text-slate-300">{record.form.operatorNote}</div>
                </div>
              )}
            </div>
          </Collapsible>

          {/* Fixed status flags collapsible */}
          <Collapsible label="Fixed Status Flags" open={showFlags} onToggle={() => setShowFlags(o => !o)}>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(FIXED_STATUSES).map(([k, v]) => (
                <div key={k} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1">
                  <div className="text-[6px] uppercase text-slate-500">{k}</div>
                  <div className={`text-[7px] font-bold font-mono ${
                    ['NOT_ACTIVATED','NOT_SENT','PROHIBITED','NOT_READ_IN_READINESS_CHECK',
                     'HIDDEN_SERVER_SIDE_ONLY','DISABLED','NOT_CONNECTED','NOT_EXECUTED','NOT_DISPATCHED'].includes(v)
                      ? 'text-destructive' : 'text-amber-400'}`}>{v}</div>
                </div>
              ))}
            </div>
          </Collapsible>

        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between shrink-0 gap-2 flex-wrap">
          <div className="text-[7px] font-mono text-destructive font-bold">
            NOT_ACTIVATED · NOT_EXECUTED · NOT_DISPATCHED · OPENCLAW_WAKE: NOT_SENT · AGENT: PROHIBITED
          </div>
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