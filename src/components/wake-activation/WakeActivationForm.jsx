import React, { useState } from 'react';
import {
  DRY_RUN_DECISIONS, LOCAL_WAKE_STATUSES, OPENCLAW_SERVICE_STATUSES,
  TOKEN_BOUNDARY_STATUSES, AGENT_ENDPOINT_STATUSES, BROWSER_AUTOMATION_STATUSES,
  FILESYSTEM_WRITE_STATUSES, BROKER_STATUSES, AUDIT_LOGGING_STATUSES,
  KILL_SWITCH_STATUSES, ROLLBACK_PLAN_STATUSES, OPERATOR_APPROVAL_STATES,
  READINESS_CHECKS, DECISION_META,
  evaluateReadiness, generateEvidenceId, generateAuditHash,
} from './wakeActivationContracts';
import { CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_FORM = {
  dryRunEvidenceId:      '',
  dryRunDecision:        'NONE',
  localWakeTestStatus:   'NOT_TESTED',
  localWakeHttpStatus:   '',
  openClawServiceStatus: 'UNKNOWN',
  tokenBoundaryStatus:   'SERVER_SIDE_ONLY',
  agentEndpointStatus:   'PROHIBITED',
  browserAutomationStatus: 'DISABLED',
  filesystemWriteStatus: 'DISABLED',
  brokerStatus:          'NOT_CONNECTED',
  auditLoggingStatus:    'NOT_CONFIGURED',
  killSwitchStatus:      'NOT_DEFINED',
  rollbackPlanStatus:    'NOT_DEFINED',
  operatorApprovalState: 'PENDING',
  operatorNote:          '',
};

const sel = "w-full bg-secondary/30 border border-border/40 rounded-sm px-2.5 py-1.5 text-[9px] font-mono text-slate-200 focus:outline-none focus:border-primary/40";
const inp = "w-full bg-secondary/30 border border-border/40 rounded-sm px-2.5 py-1.5 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40";

function Field({ label, note, children }) {
  return (
    <div className="space-y-1">
      <div className="text-[7px] font-bold uppercase text-slate-500">{label}</div>
      {children}
      {note && <div className="text-[6px] text-slate-600">{note}</div>}
    </div>
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={sel}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function WakeActivationForm({ onResult }) {
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [result, setResult]   = useState(null);
  const [approved, setApproved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!approved) return;
    const { checks, allPass, decision } = evaluateReadiness(form);
    const ts = new Date().toISOString();
    const evidenceId = generateEvidenceId();
    const auditHash  = generateAuditHash(form, evidenceId, ts);
    const dm = DECISION_META[decision];
    const record = {
      evidenceId,
      auditHash,
      createdAt: ts,
      form: { ...form },
      validationResults: checks,
      allPass,
      decision,
      nextStepRecommendation: dm?.note || '',
      activationStatus:   'NOT_ACTIVATED',
      networkRequest:     'NOT_SENT',
      openClawWakeCall:   'NOT_SENT',
      openClawAgentCall:  'PROHIBITED',
      tokenAccess:        'NOT_READ_IN_READINESS_CHECK',
    };
    setResult(record);
    onResult(record);
  };

  const { checks, allPass, decision } = evaluateReadiness(form);
  const dm = DECISION_META[decision];
  const passCount = Object.values(checks).filter(Boolean).length;

  return (
    <div className="space-y-5 font-mono">
      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Dry-Run Evidence ID" note="Reference ID from a prior backend dry-run record">
          <input value={form.dryRunEvidenceId} onChange={e => set('dryRunEvidenceId', e.target.value)}
            placeholder="e.g. VWBDR-ABC123…" className={inp} />
        </Field>

        <Field label="Dry-Run Decision">
          <Sel value={form.dryRunDecision} onChange={v => set('dryRunDecision', v)} options={DRY_RUN_DECISIONS} />
        </Field>

        <Field label="Local Wake Test Status" note="Result of prior /hooks/wake local test (done separately)">
          <Sel value={form.localWakeTestStatus} onChange={v => set('localWakeTestStatus', v)} options={LOCAL_WAKE_STATUSES} />
        </Field>

        <Field label="Local Wake HTTP Status" note="HTTP status code returned from /hooks/wake test (e.g. 200)">
          <input value={form.localWakeHttpStatus} onChange={e => set('localWakeHttpStatus', e.target.value)}
            placeholder="200" className={inp} />
        </Field>

        <Field label="OpenClaw Service Status">
          <Sel value={form.openClawServiceStatus} onChange={v => set('openClawServiceStatus', v)} options={OPENCLAW_SERVICE_STATUSES} />
        </Field>

        <Field label="Token Boundary Status" note="OPENCLAW_SERVICE_TOKEN must be server-side only">
          <Sel value={form.tokenBoundaryStatus} onChange={v => set('tokenBoundaryStatus', v)} options={TOKEN_BOUNDARY_STATUSES} />
        </Field>

        <Field label="Agent Endpoint Status" note="/hooks/agent must remain PROHIBITED">
          <Sel value={form.agentEndpointStatus} onChange={v => set('agentEndpointStatus', v)} options={AGENT_ENDPOINT_STATUSES} />
        </Field>

        <Field label="Browser Automation Status">
          <Sel value={form.browserAutomationStatus} onChange={v => set('browserAutomationStatus', v)} options={BROWSER_AUTOMATION_STATUSES} />
        </Field>

        <Field label="Filesystem Write Status">
          <Sel value={form.filesystemWriteStatus} onChange={v => set('filesystemWriteStatus', v)} options={FILESYSTEM_WRITE_STATUSES} />
        </Field>

        <Field label="Broker Status">
          <Sel value={form.brokerStatus} onChange={v => set('brokerStatus', v)} options={BROKER_STATUSES} />
        </Field>

        <Field label="Audit Logging Status">
          <Sel value={form.auditLoggingStatus} onChange={v => set('auditLoggingStatus', v)} options={AUDIT_LOGGING_STATUSES} />
        </Field>

        <Field label="Kill Switch Status">
          <Sel value={form.killSwitchStatus} onChange={v => set('killSwitchStatus', v)} options={KILL_SWITCH_STATUSES} />
        </Field>

        <Field label="Rollback Plan Status">
          <Sel value={form.rollbackPlanStatus} onChange={v => set('rollbackPlanStatus', v)} options={ROLLBACK_PLAN_STATUSES} />
        </Field>

        <Field label="Operator Approval State">
          <Sel value={form.operatorApprovalState} onChange={v => set('operatorApprovalState', v)} options={OPERATOR_APPROVAL_STATES} />
        </Field>
      </div>

      <Field label="Operator Note">
        <textarea value={form.operatorNote} onChange={e => set('operatorNote', e.target.value)}
          rows={3} placeholder="Optional operator notes, context, or rationale…"
          className={`${inp} resize-none`} />
      </Field>

      {/* Live readiness checks */}
      <div className="bg-secondary/20 border border-border/40 rounded-sm p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[7px] font-bold uppercase text-slate-400">Live Readiness Checks ({passCount} / {READINESS_CHECKS.length})</div>
          <span className={`px-2 py-0.5 text-[7px] font-bold border rounded-sm ${allPass ? 'text-primary border-primary/30 bg-primary/10' : 'text-amber-400 border-amber-400/30 bg-amber-400/10'}`}>
            {allPass ? 'ALL PASS' : `${READINESS_CHECKS.length - passCount} FAILING`}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
          {READINESS_CHECKS.map(c => {
            const pass = checks[c.key];
            return (
              <div key={c.key} className="flex items-center gap-1.5 text-[8px]">
                {pass
                  ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                <span className={pass ? 'text-slate-300' : 'text-destructive'}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision preview */}
      <div className={`border rounded-sm p-3 space-y-1 ${dm?.border} ${dm?.bg}`}>
        <div className="text-[7px] uppercase text-slate-500 font-bold">Current Decision Preview</div>
        <div className={`text-[11px] font-bold ${dm?.text}`}>{decision}</div>
        <div className={`text-[8px] ${dm?.text} opacity-70`}>{dm?.note}</div>
      </div>

      {/* Operator approval */}
      <div className={`border rounded-sm p-3 flex items-start gap-3 ${approved ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
        <input type="checkbox" id="war-operator-approval" checked={approved} onChange={e => setApproved(e.target.checked)}
          className="mt-0.5 accent-green-500 w-4 h-4 shrink-0" />
        <label htmlFor="war-operator-approval" className="text-[9px] text-slate-300 cursor-pointer leading-relaxed">
          <span className="font-bold text-slate-100">Operator Approval — </span>
          I confirm this is a readiness assessment only. No activation is performed. No wake call is made. No token is accessed. No execution occurs. This record is for audit planning only.
        </label>
      </div>

      <button type="button" onClick={handleSubmit} disabled={!approved}
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Generate Readiness Evidence Record (No Activation)
      </button>

      {!approved && (
        <div className="text-[8px] text-amber-400 font-mono text-center">Operator approval checkbox required before generating readiness record.</div>
      )}

      {/* Latest result */}
      {result && (
        <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
          <div className="bg-primary/10 px-4 py-2.5 border-b border-primary/20">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Latest Readiness Evidence Record — NOT_ACTIVATED</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'evidenceId',       v: result.evidenceId,            c: 'text-primary' },
              { k: 'auditHash',        v: result.auditHash,             c: 'text-amber-400' },
              { k: 'decision',         v: result.decision,              c: dm?.text },
              { k: 'allPass',          v: String(result.allPass),       c: result.allPass ? 'text-primary' : 'text-destructive' },
              { k: 'activationStatus', v: 'NOT_ACTIVATED',              c: 'text-destructive font-bold' },
              { k: 'networkRequest',   v: 'NOT_SENT',                   c: 'text-destructive font-bold' },
            ].map(({ k, v, c }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all text-[8px] ${c}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}