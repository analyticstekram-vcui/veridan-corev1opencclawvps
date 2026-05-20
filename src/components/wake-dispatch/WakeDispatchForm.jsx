/**
 * WakeDispatchForm
 * Input form for generating a local /hooks/wake payload preview.
 * No network calls. No dispatch. No token exposure.
 */
import React, { useState } from 'react';
import {
  SOURCE_EVENT_TYPES, RISK_LEVELS, APPROVAL_STATES, DESTINATION_CHANNELS,
  runSafetyGate, computeDecision, buildWakePayload, generatePreviewId, generateAuditHash,
} from './wakeDispatchContracts';

const DEFAULT_FORM = {
  eventType:       'MCP_VISUAL_CONFIRMATION_PREVIEW',
  notificationText:'',
  eventId:         '',
  riskLevel:       'LOW',
  approvalState:   'REVIEW_READY',
  destinationChannel: 'openclaw-local',
};

export default function WakeDispatchForm({ onResult }) {
  const [form,     setForm]     = useState(DEFAULT_FORM);
  const [approved, setApproved] = useState(false);
  const [error,    setError]    = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGenerate = () => {
    setError('');
    if (!approved) { setError('Operator approval checkbox required.'); return; }
    if (!form.eventType) { setError('Event type required.'); return; }

    const gate     = runSafetyGate(form);
    const decision = computeDecision(form, gate.results);
    const payload  = buildWakePayload(form);
    const previewId = generatePreviewId();
    const auditHash = generateAuditHash(payload);

    const result = {
      previewId,
      auditHash,
      createdAt:    new Date().toISOString(),
      form:         { ...form },
      payload,
      gateResults:  gate.results,
      allGatePass:  gate.allPass,
      decision,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus:  'NOT_DISPATCHED',
      tradeStatus:     'NO_ORDER_CREATED',
      brokerStatus:    'NOT_CONNECTED',
      nextStepRecommendation: decision === 'PREVIEW_READY_FOR_FUTURE_WAKE'
        ? 'All gate checks passed. Preview payload generated locally. No dispatch performed. Retain for governance audit. Operator approval required before any future live wake dispatch is considered.'
        : `Dispatch blocked: ${decision}. Resolve the flagged gate condition before re-attempting.`,
    };
    onResult(result);
    setApproved(false);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Event type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[8px] font-bold uppercase text-slate-400">Source Event Type</label>
          <select
            value={form.eventType}
            onChange={e => set('eventType', e.target.value)}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 focus:outline-none focus:border-primary/40"
          >
            {SOURCE_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] font-bold uppercase text-slate-400">Event ID <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.eventId}
            onChange={e => set('eventId', e.target.value)}
            placeholder="e.g. EVT-2026-001 (auto-generated if blank)"
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] font-bold uppercase text-slate-400">Risk Level</label>
          <select
            value={form.riskLevel}
            onChange={e => set('riskLevel', e.target.value)}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 focus:outline-none focus:border-primary/40"
          >
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] font-bold uppercase text-slate-400">Approval State</label>
          <select
            value={form.approvalState}
            onChange={e => set('approvalState', e.target.value)}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 focus:outline-none focus:border-primary/40"
          >
            {APPROVAL_STATES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[8px] font-bold uppercase text-slate-400">Destination Channel</label>
          <select
            value={form.destinationChannel}
            onChange={e => set('destinationChannel', e.target.value)}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 focus:outline-none focus:border-primary/40"
          >
            {DESTINATION_CHANNELS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[8px] font-bold uppercase text-slate-400">
            Safe Notification Text <span className="text-slate-600 normal-case font-normal">(optional — default used if blank)</span>
          </label>
          <textarea
            value={form.notificationText}
            onChange={e => set('notificationText', e.target.value)}
            rows={3}
            placeholder="Veridan Core approved preview event received. Notification only. Do not execute tools, browser actions, file writes, trading, or external requests."
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-y"
          />
          <div className="text-[7px] text-slate-600">No credentials, tokens, secrets, or executable instructions allowed in this field.</div>
        </div>
      </div>

      {/* Operator approval */}
      <div className={`border rounded-sm p-3 flex items-start gap-3 ${approved ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
        <input
          type="checkbox"
          id="wake-operator-approval"
          checked={approved}
          onChange={e => setApproved(e.target.checked)}
          className="mt-0.5 accent-green-500 w-4 h-4 shrink-0"
        />
        <label htmlFor="wake-operator-approval" className="text-[8px] text-slate-300 cursor-pointer leading-relaxed">
          <span className="font-bold text-slate-100">Operator Approval — </span>
          I confirm this is a local preview packet only. No OpenClaw /hooks/wake request will be sent. No agent call. No trade. No file write. No token will be exposed. For governance preview and future planning only.
        </label>
      </div>

      {error && <div className="text-[8px] text-destructive font-mono">{error}</div>}

      <button
        type="button"
        onClick={handleGenerate}
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 transition-colors"
      >
        Generate Local Wake Dispatch Preview (No Dispatch)
      </button>
    </div>
  );
}