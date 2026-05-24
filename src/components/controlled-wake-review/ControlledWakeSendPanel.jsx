/**
 * ControlledWakeSendPanel
 * Loads readiness evidence from localStorage (multi-key fallback + field normalization).
 * Enforces operator confirmation before sending controlled wake notification.
 * Token never exposed. No agent call. No execution. No network during hydration.
 */
import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, Lock,
  Send, ShieldX, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── localStorage multi-key fallback ─────────────────────────────────────────

const LS_CANDIDATE_KEYS = [
  'wake_activation_readiness_history',
  'wakeActivationReadinessHistory',
  'openclawWakeActivationReadinessHistory',
  'controlled_wake_activation_review_history',
];

const REQUIRED_DECISION = 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW';

/** Normalize a raw record from any key/format into a canonical shape. */
function normalizeRecord(r) {
  if (!r || typeof r !== 'object') return null;
  const approvalState =
    r.approvalState ||
    r.approvalstate ||
    r.form?.operatorApprovalState ||
    r.form?.approvalState ||
    r.reviewApprovalState ||
    null;
  return {
    evidenceId:       r.evidenceId || r.evidenceID || r.id || null,
    auditHash:        r.auditHash  || r.audithash  || null,
    allPass:          r.allPass    === true || r.allpass === true,
    decision:         r.decision   || null,
    activationStatus: r.activationStatus || r.activationstatus || null,
    approvalState,
    createdAt:        r.createdAt  || null,
    // keep raw for forwarding to backend
    _raw: r,
  };
}

/** Try all candidate keys; return { records, sourceKey } for the first that has entries. */
function scanLocalStorage() {
  for (const key of LS_CANDIDATE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      return { records: parsed.map(normalizeRecord).filter(Boolean), sourceKey: key };
    } catch { /* ignore malformed */ }
  }
  return { records: [], sourceKey: null };
}

/** Pick the best valid record: newest where allPass + correct decision + NOT_ACTIVATED. */
function pickBestRecord(records) {
  const valid = records.filter(r =>
    r.allPass === true &&
    r.decision === REQUIRED_DECISION &&
    r.activationStatus === 'NOT_ACTIVATED'
  );
  // records are already newest-first from WakeActivationForm
  return valid[0] || records[0] || null;
}

function isEvidenceReady(ev) {
  if (!ev) return false;
  return (
    ev.allPass === true &&
    ev.decision === REQUIRED_DECISION &&
    ev.activationStatus === 'NOT_ACTIVATED' &&
    ['APPROVED', 'REVIEW_READY'].includes(ev.approvalState)
  );
}

// ── Post-send verification claims ───────────────────────────────────────────

const SEND_VERIFICATION_CLAIMS = [
  { label: 'TOKEN_NOT_EXPOSED',     key: 'tokenExposed',        expectedFalse: true,  pass: 'Token read server-side only — never returned to client' },
  { label: 'AGENT_ENDPOINT_CALLED', key: 'agentEndpointCalled', expectedFalse: true,  pass: '/hooks/agent was NOT called' },
  { label: 'WAKE_ENDPOINT_ONLY',    key: 'wakeEndpointCalled',  expectedValue: '/hooks/wake', pass: 'Only /hooks/wake was contacted' },
  { label: 'EXECUTION_STATUS',      key: 'executionStatus',     expectedValue: 'NOT_EXECUTED', pass: 'No execution performed' },
  { label: 'BROWSER_AUTOMATION',    key: 'browserAutomation',   expectedFalse: true,  pass: 'No browser automation' },
  { label: 'FILESYSTEM_WRITE',      key: 'filesystemWrite',     expectedFalse: true,  pass: 'No filesystem writes' },
  { label: 'BROKER_ACTION',         key: 'brokerAction',        expectedFalse: true,  pass: 'No broker actions' },
  { label: 'AUDIT_RECORD_CREATED',  key: 'auditId',             expectedExists: true, pass: 'Audit record written to OpenClawBridgeDryRunAudit' },
];

function claimPass(claim, result) {
  if (!result) return null;
  const v = result[claim.key];
  if (claim.expectedFalse)  return v === false;
  if (claim.expectedValue)  return v === claim.expectedValue;
  if (claim.expectedExists) return v != null && v !== '';
  return false;
}

// ── Pre-send verification report ────────────────────────────────────────────

function PreSendVerification({ evidence, sourceKey }) {
  const rows = [
    { label: 'READINESS_RECORD_LOADED',   val: evidence ? 'YES' : 'NO',                              ok: !!evidence },
    { label: 'EVIDENCE_SOURCE_KEY',        val: sourceKey || '(none found)',                          ok: !!sourceKey },
    { label: 'allPass',                    val: evidence ? String(evidence.allPass) : '—',            ok: evidence?.allPass === true },
    { label: 'decision',                   val: evidence?.decision || '—',                            ok: evidence?.decision === REQUIRED_DECISION },
    { label: 'activationStatus',           val: evidence?.activationStatus || '—',                    ok: evidence?.activationStatus === 'NOT_ACTIVATED' },
    { label: 'approvalState',              val: evidence?.approvalState || '—',                       ok: ['APPROVED', 'REVIEW_READY'].includes(evidence?.approvalState) },
    { label: 'TOKEN_NOT_EXPOSED',          val: 'CLIENT_NEVER_RECEIVES_TOKEN',                        ok: true },
    { label: '/hooks/agent',               val: 'PROHIBITED',                                         ok: true },
    { label: 'SEND_BUTTON_GATED',          val: isEvidenceReady(evidence) ? 'UNLOCKED' : 'LOCKED',    ok: isEvidenceReady(evidence) },
  ];
  const passCount = rows.filter(r => r.ok).length;
  return (
    <div className="border border-border/40 bg-secondary/10 rounded-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[8px] font-bold uppercase text-slate-400">Pre-Send Verification Report</div>
        <span className={`text-[7px] font-bold px-2 py-0.5 rounded-sm border ${passCount === rows.length ? 'text-primary border-primary/30 bg-primary/10' : 'text-amber-400 border-amber-400/30 bg-amber-400/10'}`}>
          {passCount}/{rows.length} PASS
        </span>
      </div>
      <div className="space-y-0.5">
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-2 text-[7px] font-mono">
            {r.ok
              ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
              : <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />}
            <span className="text-slate-500 w-48 shrink-0">{r.label}:</span>
            <span className={r.ok ? 'text-primary' : 'text-destructive'}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ControlledWakeSendPanel({ evidence: evidenceProp }) {
  const [evidence,     setEvidence]     = useState(() => {
    const { records, sourceKey } = scanLocalStorage();
    const best = pickBestRecord(records);
    return best;
  });
  const [sourceKey,    setSourceKey]    = useState(() => {
    const { sourceKey } = scanLocalStorage();
    return sourceKey;
  });
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [showVerify,   setShowVerify]   = useState(false);
  const [operatorNote, setOperatorNote] = useState('');
  const [manualJson,   setManualJson]   = useState('');
  const [manualError,  setManualError]  = useState('');
  const [showManual,   setShowManual]   = useState(false);

  const reload = useCallback(() => {
    const { records, sourceKey: sk } = scanLocalStorage();
    const best = pickBestRecord(records);
    setEvidence(best);
    setSourceKey(sk);
  }, []);

  // Manual import
  const handleManualImport = () => {
    setManualError('');
    try {
      const parsed = JSON.parse(manualJson.trim());
      // Accept single object or array
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      const norm = normalizeRecord(obj);
      if (!norm) { setManualError('Could not parse record — check JSON format.'); return; }
      setEvidence(norm);
      setSourceKey('MANUAL_IMPORT');
      setShowManual(false);
      setManualJson('');
    } catch (e) {
      setManualError(`JSON parse error: ${e.message}`);
    }
  };

  const evidenceReady = isEvidenceReady(evidence);

  const handleSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await base44.functions.invoke('openclawControlledWake', {
        operatorConfirmed: true,
        operatorNote: operatorNote || '',
        readinessEvidence: evidence._raw || evidence,
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

  return (
    <div className="space-y-4">

      {/* ── Evidence gate ───────────────────────────────────────────────── */}
      <div className={`border rounded-sm p-4 space-y-3 ${evidenceReady ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className={`text-[9px] font-bold uppercase tracking-wide ${evidenceReady ? 'text-primary' : 'text-amber-400'}`}>
            {evidenceReady
              ? '✓ Readiness Evidence Verified — Wake Send Unlocked'
              : evidence
              ? '⚠ Evidence Loaded — Gate Not Fully Satisfied'
              : '⚠ No Valid Readiness Evidence Found'}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={reload}
              className="flex items-center gap-1 text-[7px] text-slate-500 hover:text-primary border border-border/30 hover:border-primary/30 px-2 py-1 rounded-sm transition-colors">
              <RefreshCw className="w-2.5 h-2.5" /> Reload localStorage
            </button>
            <button type="button" onClick={() => setShowManual(v => !v)}
              className="flex items-center gap-1 text-[7px] text-slate-500 hover:text-amber-400 border border-border/30 hover:border-amber-400/30 px-2 py-1 rounded-sm transition-colors">
              Manual Import
            </button>
          </div>
        </div>

        {/* Source key */}
        <div className="text-[7px] font-mono text-slate-500">
          EVIDENCE_SOURCE_KEY: <span className={sourceKey ? 'text-primary' : 'text-destructive'}>{sourceKey || '(none)'}</span>
        </div>

        {/* Field grid */}
        <div className="grid grid-cols-2 gap-1 text-[7px] font-mono">
          {[
            { label: 'evidenceId',       val: evidence?.evidenceId || '—',                                                          ok: !!evidence?.evidenceId },
            { label: 'auditHash',        val: evidence?.auditHash ? evidence.auditHash.slice(0, 18) + '…' : '—',                   ok: !!evidence?.auditHash },
            { label: 'allPass',          val: evidence ? String(evidence.allPass) : '—',                                            ok: evidence?.allPass === true },
            { label: 'decision',         val: evidence?.decision ? evidence.decision.replace('READY_FOR_', '').slice(0, 30) : '—',  ok: evidence?.decision === REQUIRED_DECISION },
            { label: 'activationStatus', val: evidence?.activationStatus || '—',                                                    ok: evidence?.activationStatus === 'NOT_ACTIVATED' },
            { label: 'approvalState',    val: evidence?.approvalState || '—',                                                       ok: ['APPROVED', 'REVIEW_READY'].includes(evidence?.approvalState) },
          ].map(({ label, val, ok }) => (
            <div key={label} className="flex items-center gap-1">
              {ok ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />}
              <span className="text-slate-500">{label}:</span>
              <span className={ok ? 'text-primary' : 'text-destructive'}>{val}</span>
            </div>
          ))}
        </div>

        {/* No evidence hint */}
        {!evidence && (
          <div className="text-[7px] text-amber-400/80 border-t border-amber-500/20 pt-2 leading-relaxed">
            Go to <span className="font-bold">Wake Activation Readiness Gate → Readiness Checker</span>, generate a record with allPass=true and decision READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW, then click <span className="font-bold">Reload localStorage</span> above. Or paste the JSON directly via <span className="font-bold">Manual Import</span>.
          </div>
        )}

        {/* approvalState hint when evidence loaded but not ready */}
        {evidence && !evidenceReady && evidence.allPass && (
          <div className="text-[7px] text-amber-400/80 border-t border-amber-500/20 pt-2">
            approvalState must be <span className="font-bold">APPROVED</span> or <span className="font-bold">REVIEW_READY</span> — currently: <span className="font-bold text-destructive">{evidence.approvalState || '(missing)'}</span>
          </div>
        )}
      </div>

      {/* ── Manual import box ────────────────────────────────────────────── */}
      {showManual && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm p-3 space-y-2">
          <div className="text-[8px] font-bold text-amber-400 uppercase">Manual Import — Paste Readiness Record JSON</div>
          <textarea
            value={manualJson}
            onChange={e => setManualJson(e.target.value)}
            rows={5}
            placeholder='Paste the full readiness record JSON here, e.g. {"evidenceId":"VWAR-...","allPass":true,...}'
            className="w-full bg-secondary/40 border border-border/40 rounded-sm text-[7px] font-mono text-slate-200 px-3 py-2 resize-none focus:outline-none focus:border-amber-400/40"
          />
          {manualError && <div className="text-[7px] text-destructive font-mono">{manualError}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={handleManualImport}
              className="text-[8px] font-bold px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 rounded-sm transition-colors">
              Import Record
            </button>
            <button type="button" onClick={() => { setShowManual(false); setManualJson(''); setManualError(''); }}
              className="text-[8px] px-3 py-1.5 border border-border/30 text-slate-500 hover:text-slate-300 rounded-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Pre-send verification report ─────────────────────────────────── */}
      <PreSendVerification evidence={evidence} sourceKey={sourceKey} />

      {/* ── Safety notice ────────────────────────────────────────────────── */}
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

      {/* ── Operator note ────────────────────────────────────────────────── */}
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

      {/* ── Send button ──────────────────────────────────────────────────── */}
      {!result && (
        <>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !evidenceReady}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-widest disabled:opacity-40"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Sending Wake Notification…</>
              : <><Send className="w-3.5 h-3.5 mr-2" />SEND CONTROLLED WAKE NOTIFICATION</>}
          </Button>
          {!evidenceReady && (
            <div className="text-[7px] text-amber-400 font-mono text-center">
              Button locked — valid readiness evidence required (allPass, correct decision, NOT_ACTIVATED, approval present).
            </div>
          )}
        </>
      )}

      {/* ── Confirmation dialog ──────────────────────────────────────────── */}
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
              <p className="text-slate-300">Evidence: <span className="font-bold text-primary">{evidence?.evidenceId || '—'}</span></p>
              <p className="text-amber-400">Are you sure you want to proceed?</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmOpen(false)} variant="outline" className="flex-1 text-[8px]">Cancel</Button>
              <Button onClick={handleSend} className="flex-1 bg-primary text-primary-foreground text-[8px] font-bold uppercase">
                Confirm — Send Wake
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error display ────────────────────────────────────────────────── */}
      {error && !result && (
        <div className="border border-destructive/40 bg-destructive/5 rounded-sm p-3 text-[8px] text-destructive">
          <div className="font-bold mb-1">Request Failed</div>
          <div>{error}</div>
        </div>
      )}

      {/* ── Result panel ─────────────────────────────────────────────────── */}
      {result && (
        <div className={`border rounded-sm p-4 space-y-3 ${result.dispatchStatus === 'WAKE_NOTIFICATION_SENT_ONLY' ? 'border-primary/40 bg-primary/5' : 'border-destructive/40 bg-destructive/5'}`}>
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
              ['wakeStatus',        result.wakeStatus],
              ['httpStatus',        result.httpStatus ?? '—'],
              ['executionStatus',   result.executionStatus],
              ['dispatchStatus',    result.dispatchStatus],
              ['auditId',           result.auditId],
              ['timestamp',         result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '—'],
              ['wakeEndpoint',      result.wakeEndpointCalled || '/hooks/wake'],
              ['agentCalled',       String(result.agentEndpointCalled ?? false)],
              ['tokenExposed',      String(result.tokenExposed ?? false)],
              ['browserAutomation', String(result.browserAutomation ?? false)],
              ['filesystemWrite',   String(result.filesystemWrite ?? false)],
              ['brokerAction',      String(result.brokerAction ?? false)],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <span className="text-slate-500">{k}:</span>
                <span className={v === 'NOT_EXECUTED' || v === 'false' || v === '/hooks/wake' ? 'text-primary' : v === 'true' ? 'text-destructive' : 'text-slate-300'}>{String(v)}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setShowVerify(v => !v)}
            className="text-[7px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
            {showVerify ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showVerify ? 'Hide' : 'Show'} Post-Send Verification Report
          </button>
          {showVerify && (
            <div className="border border-border/30 rounded-sm p-3 space-y-1.5 bg-secondary/20">
              <div className="text-[8px] font-bold text-slate-300 uppercase mb-2">Security & Boundary Verification</div>
              {SEND_VERIFICATION_CLAIMS.map(claim => {
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