import React, { useState } from 'react';
import {
  ALLOWED_EVENT_TYPES, APPROVAL_STATES, RISK_LEVELS, DESTINATION_CHANNELS,
  VALIDATION_CHECKS, DECISION_META, NEXT_STEP,
  generateEvidenceId, generateAuditHash, runValidation,
} from './wakeBackendDryRunContracts';
import { CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_FORM = {
  previewId:        '',
  eventType:        '',
  approvalState:    '',
  riskLevel:        'LOW',
  destinationChannel: '',
  notificationText: '',
  executionStatus:  'NOT_EXECUTED',
  dispatchStatus:   'NOT_DISPATCHED',
  sourcePage:       '/wake-dispatch-preview',
  operatorNote:     '',
};

export default function WakeBackendDryRunForm({ onResult }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGenerate = () => {
    const { results, allPass, decision } = runValidation(form);
    const evidenceId = generateEvidenceId();
    const requestPreview = {
      previewId:         form.previewId,
      eventType:         form.eventType,
      approvalState:     form.approvalState,
      riskLevel:         form.riskLevel,
      destinationChannel:form.destinationChannel,
      notificationText:  form.notificationText,
      executionStatus:   form.executionStatus,
      dispatchStatus:    form.dispatchStatus,
      sourcePage:        form.sourcePage,
      operatorNote:      form.operatorNote,
      dryRunMode:        true,
      openClawCall:      'SUPPRESSED',
      agentEndpoint:     'PROHIBITED',
    };
    const auditHash = generateAuditHash(requestPreview);
    const responsePreview = {
      ok:              allPass,
      routeMode:       'DRY_RUN_ONLY',
      backendRoute:    '/api/openclaw/wake/dry-run',
      openClawCall:    'SUPPRESSED',
      networkRequest:  'NOT_SENT',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus:  'NOT_DISPATCHED',
      decision,
      evidenceId,
      auditHash,
    };
    const record = {
      form: { ...form },
      requestPreview,
      responsePreview,
      validationResults: results,
      allPass,
      decision,
      evidenceId,
      auditHash,
      createdAt: new Date().toISOString(),
      nextStepRecommendation: NEXT_STEP[decision],
    };
    setResult(record);
    onResult(record);
  };

  const inputCls = "w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40";
  const selectCls = inputCls;

  return (
    <div className="space-y-4 font-mono">
      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { k: 'previewId',       label: 'Preview ID',         type: 'text',   ph: 'e.g. WDP-ABC123' },
          { k: 'notificationText',label: 'Notification Text',  type: 'text',   ph: 'e.g. MNQ signal confirmed' },
          { k: 'sourcePage',      label: 'Source Page',        type: 'text',   ph: '/wake-dispatch-preview' },
          { k: 'operatorNote',    label: 'Operator Note',      type: 'text',   ph: 'Optional governance note' },
        ].map(({ k, label, ph }) => (
          <div key={k} className="space-y-1">
            <label className="text-[7px] uppercase font-bold text-slate-500">{label}</label>
            <input type="text" value={form[k]} onChange={e => set(k, e.target.value)}
              placeholder={ph} className={inputCls} />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-[7px] uppercase font-bold text-slate-500">Event Type</label>
          <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className={selectCls}>
            <option value="">— Select event type —</option>
            {ALLOWED_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[7px] uppercase font-bold text-slate-500">Approval State</label>
          <select value={form.approvalState} onChange={e => set('approvalState', e.target.value)} className={selectCls}>
            <option value="">— Select state —</option>
            {APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[7px] uppercase font-bold text-slate-500">Risk Level</label>
          <select value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)} className={selectCls}>
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[7px] uppercase font-bold text-slate-500">Destination Channel</label>
          <select value={form.destinationChannel} onChange={e => set('destinationChannel', e.target.value)} className={selectCls}>
            <option value="">— Select channel —</option>
            {DESTINATION_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Fixed read-only fields */}
        {[
          { k: 'executionStatus', label: 'Execution Status (fixed)' },
          { k: 'dispatchStatus',  label: 'Dispatch Status (fixed)' },
        ].map(({ k, label }) => (
          <div key={k} className="space-y-1">
            <label className="text-[7px] uppercase font-bold text-slate-500">{label}</label>
            <div className="w-full bg-destructive/5 border border-destructive/20 rounded-sm px-3 py-2 text-[9px] font-mono font-bold text-destructive">
              {form[k]}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={handleGenerate}
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 transition-colors">
        Generate Backend Dry-Run Request Preview (No Network Call)
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Decision */}
          <div className={`border rounded-sm px-4 py-3 ${DECISION_META[result.decision]?.border} ${DECISION_META[result.decision]?.bg}`}>
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Dry-Run Decision</div>
            <div className={`text-[13px] font-bold ${DECISION_META[result.decision]?.text}`}>{result.decision}</div>
          </div>

          {/* Validation checks */}
          <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1">
            <div className="text-[7px] uppercase font-bold text-slate-500 mb-1.5">Server-Side Validation Checks</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {VALIDATION_CHECKS.map(c => {
                const pass = result.validationResults[c.key];
                return (
                  <div key={c.key} className="flex items-center gap-1.5 text-[8px]">
                    {pass
                      ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                      : <XCircle      className="w-3 h-3 text-destructive shrink-0" />}
                    <span className={pass ? 'text-primary' : 'text-destructive'}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request / Response side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
              <div className="bg-secondary/20 px-3 py-1.5 text-[7px] font-bold uppercase text-slate-400 border-b border-border/30">
                Backend Dry-Run Request Preview
              </div>
              <pre className="text-[7px] font-mono text-slate-300 p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(result.requestPreview, null, 2)}
              </pre>
            </div>
            <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
              <div className="bg-primary/5 px-3 py-1.5 text-[7px] font-bold uppercase text-primary border-b border-primary/20">
                Dry-Run Response Preview (Simulated)
              </div>
              <pre className="text-[7px] font-mono text-slate-300 p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(result.responsePreview, null, 2)}
              </pre>
            </div>
          </div>

          {/* Evidence meta */}
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            <div className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
              <div className="text-[6px] text-slate-500 uppercase mb-0.5">Evidence ID</div>
              <div className="text-primary font-bold">{result.evidenceId}</div>
            </div>
            <div className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
              <div className="text-[6px] text-slate-500 uppercase mb-0.5">Audit Hash</div>
              <div className="text-amber-400 font-bold">{result.auditHash}</div>
            </div>
          </div>

          {/* Next step */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
            <div className="text-[6px] uppercase text-slate-500 mb-0.5">Next Step</div>
            <div className="text-[8px] text-primary/80 leading-relaxed">{result.nextStepRecommendation}</div>
          </div>
        </div>
      )}
    </div>
  );
}