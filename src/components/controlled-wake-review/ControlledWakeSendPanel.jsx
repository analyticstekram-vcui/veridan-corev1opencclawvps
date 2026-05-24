/**
 * ControlledWakeSendPanel
 * UI for sending the controlled wake notification via the backend route.
 * Enforces operator confirmation dialog, displays full result + verification.
 * Token never exposed — backend-only. No agent call. No execution.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, Lock,
  Send, ShieldCheck, ShieldX, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const VERIFICATION_CLAIMS = [
  { label: 'OPENCLAW_SERVICE_TOKEN',     key: 'tokenExposed',         expectedFalse: true,  pass: 'Token read server-side only — not exposed to client' },
  { label: 'AGENT_ENDPOINT_CALLED',      key: 'agentEndpointCalled',  expectedFalse: true,  pass: '/hooks/agent was NOT called' },
  { label: 'WAKE_ENDPOINT_ONLY',         key: 'wakeEndpointCalled',   expectedValue: '/hooks/wake', pass: 'Only /hooks/wake was contacted' },
  { label: 'EXECUTION_STATUS',           key: 'executionStatus',      expectedValue: 'NOT_EXECUTED', pass: 'No execution performed' },
  { label: 'BROWSER_AUTOMATION',         key: 'browserAutomation',    expectedFalse: true,  pass: 'No browser automation' },
  { label: 'FILESYSTEM_WRITE',           key: 'filesystemWrite',      expectedFalse: true,  pass: 'No filesystem writes' },
  { label: 'BROKER_ACTION',             key: 'brokerAction',          expectedFalse: true,  pass: 'No broker actions' },
  { label: 'AUDIT_RECORD',              key: 'auditId',               expectedExists: true, pass: 'Audit record created' },
];

function claimPass(claim, result) {
  if (!result) return null;
  const v = result[claim.key];
  if (claim.expectedFalse)  return v === false;
  if (claim.expectedValue)  return v === claim.expectedValue;
  if (claim.expectedExists) return v != null && v !== '';
  return false;
}

export default function ControlledWakeSendPanel({ evidence }) {
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [error,          setError]          = useState(null);
  const [showVerify,     setShowVerify]     = useState(false);
  const [operatorNote,   setOperatorNote]   = useState('');

  // Determine if evidence qualifies
  const evidenceReady = evidence &&
    evidence.allPass === true &&
    evidence.decision === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW' &&
    evidence.activationStatus === 'NOT_ACTIVATED' &&
    ['APPROVED', 'REVIEW_READY'].includes(evidence.form?.operatorApprovalState);

  const handleSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('openclawControlledWake', {
        operatorConfirmed: true,
        operatorNote: operatorNote || '',
        readinessEvidence: evidence,
      });
      setResult(response.data);
      setShowVerify(true);
    } catch (err) {
      const data = err.response?.data || {};
      setError(data.error || data.detail || err.message || 'Request failed');
      if (data.auditId || data.executionStatus) setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const successColor = result?.dispatchStatus === 'WAKE_NOTIFICATION_SENT_ONLY'
    ? 'border-primary/40 bg-primary/5'
    : 'border-destructive/40 bg-destructive/5';

  return (
    <div className="space-y-4">

      {/* Gate check */}
      <div className={`border rounded-sm p-4 space-y-2 ${evidenceReady ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <div className={`text-[9px] font-bold uppercase tracking-wide ${evidenceReady ? 'text-primary' : 'text-amber-400'}`}>
          {evidenceReady ? '✓ Readiness Evidence Verified — Wake Send Unlocked' : '⚠ Readiness Evidence Not Ready'}
        </div>
        <div className="grid grid-cols-2 gap-1 text-[7px] font-mono">
          {[
            { label: 'allPass',          val: String(evidence?.allPass), ok: evidence?.allPass === true },
            { label: 'decision',         val: evidence?.decision || '—', ok: evidence?.decision === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW' },
            { label: 'activationStatus', val: evidence?.activationStatus || '—', ok: evidence?.activationStatus === 'NOT_ACTIVATED' },
            { label: 'approvalState',    val: evidence?.form?.operatorApprovalState || '—', ok: ['APPROVED','REVIEW_READY'].includes(evidence?.form?.operatorApprovalState) },
          ].map(({ label, val, ok }) => (
            <div key={label} className="flex items-center gap-1">
              {ok ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />}
              <span className="text-slate-500">{label}:</span>
              <span className={ok ? 'text-primary' : 'text-destructive'}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety notice */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-sm p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-amber-500">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          CONTROLLED WAKE NOTIFICATION — NOT AN EXECUTION COMMAND
        </div>
        <ul className="text-[7px] text-amber-400/80 space-y-0.5 ml-4 list-disc">
          <li>Sends a single POST to /hooks/wake only</li>
          <li>Token is read server-side — never sent to this browser</li>
          <li>/hooks/agent is never called</li>
          <li>No execution, no browser automation, no broker action</li>
          <li>Audit record written to OpenClawBridgeDryRunAudit</li>
        </ul>
      </div>

      {/* Operator note */}
      <div>
        <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Operator Note (optional)</label>
        <textarea
          value={operatorNote}
          onChange={e => setOperatorNote(e.target.value)}
          rows={2}
          className="w-full bg-secondary/30 border border-border/40 rounded-sm text-[8px] font-mono text-foreground px-3 py-2 resize-none focus:outline-none focus:border-primary/40"
          placeholder="e.g. Sending controlled wake notification per operator approval 2026-05-24"
        />
      </div>

      {/* Send button */}
      {!result && (
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={loading || !evidenceReady}
          className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-widest disabled:opacity-40"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Sending Wake Notification…</>
          ) : (
            <><Send className="w-3.5 h-3.5 mr-2" />SEND CONTROLLED WAKE NOTIFICATION</>
          )}
        </Button>
      )}

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-amber-500/40 rounded-sm p-6 max-w-md w-full space-y-4 font-mono">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Confirm: Send Controlled Wake Notification</div>
            </div>
            <div className="text-[8px] text-slate-400 leading-relaxed space-y-1.5">
              <p>You are about to send a POST to the OpenClaw <span className="text-primary font-bold">/hooks/wake</span> endpoint.</p>
              <p>This is a <span className="text-primary font-bold">notification-only</span> call. No execution is performed.</p>
              <p>The service token is read server-side only and will <span className="text-destructive font-bold">never</span> be exposed to this browser.</p>
              <p className="text-amber-400">Are you sure you want to proceed?</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmOpen(false)} variant="outline" className="flex-1 text-[8px]">
                Cancel
              </Button>
              <Button onClick={handleSend} className="flex-1 bg-primary text-primary-foreground text-[8px] font-bold uppercase">
                Confirm — Send Wake
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !result && (
        <div className="border border-destructive/40 bg-destructive/5 rounded-sm p-3 text-[8px] text-destructive">
          <div className="font-bold mb-1">Request Failed</div>
          <div>{error}</div>
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div className={`border rounded-sm p-4 space-y-3 ${successColor}`}>
          <div className="flex items-center gap-2">
            {result.dispatchStatus === 'WAKE_NOTIFICATION_SENT_ONLY'
              ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
            <span className={`text-[10px] font-bold uppercase ${result.dispatchStatus === 'WAKE_NOTIFICATION_SENT_ONLY' ? 'text-primary' : 'text-destructive'}`}>
              {result.dispatchStatus || result.error || 'UNKNOWN'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[7px] font-mono">
            {[
              ['wakeStatus',      result.wakeStatus],
              ['httpStatus',      result.httpStatus ?? '—'],
              ['executionStatus', result.executionStatus],
              ['dispatchStatus',  result.dispatchStatus],
              ['auditId',         result.auditId],
              ['timestamp',       result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '—'],
              ['wakeEndpoint',    result.wakeEndpointCalled || '/hooks/wake'],
              ['agentCalled',     String(result.agentEndpointCalled ?? false)],
              ['tokenExposed',    String(result.tokenExposed ?? false)],
              ['browserAutomation', String(result.browserAutomation ?? false)],
              ['filesystemWrite', String(result.filesystemWrite ?? false)],
              ['brokerAction',    String(result.brokerAction ?? false)],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <span className="text-slate-500">{k}:</span>
                <span className={
                  v === 'NOT_EXECUTED' || v === 'false' || v === '/hooks/wake'
                    ? 'text-primary'
                    : v === 'true' || v === 'NOT_DISPATCHED'
                    ? 'text-destructive'
                    : 'text-slate-300'
                }>{String(v)}</span>
              </div>
            ))}
          </div>

          {/* Verification toggle */}
          <button type="button" onClick={() => setShowVerify(v => !v)}
            className="text-[7px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
            {showVerify ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showVerify ? 'Hide' : 'Show'} Verification Report
          </button>

          {showVerify && (
            <div className="border border-border/30 rounded-sm p-3 space-y-1.5 bg-secondary/20">
              <div className="text-[8px] font-bold text-slate-300 uppercase mb-2">Security & Boundary Verification</div>
              {VERIFICATION_CLAIMS.map(claim => {
                const passed = claimPass(claim, result);
                return (
                  <div key={claim.key} className="flex items-start gap-2 text-[7px]">
                    {passed === null
                      ? <div className="w-3 h-3 border border-slate-600 rounded-full shrink-0 mt-0.5" />
                      : passed
                      ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      : <ShieldX className="w-3 h-3 text-destructive shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-bold text-slate-400">{claim.label}: </span>
                      <span className={passed ? 'text-primary' : passed === false ? 'text-destructive' : 'text-slate-500'}>
                        {passed ? claim.pass : passed === false ? `FAILED — value: ${String(result[claim.key])}` : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}