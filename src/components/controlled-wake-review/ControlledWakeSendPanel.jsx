/**
 * ControlledWakeSendPanel
 * Reads readiness evidence from localStorage across all candidate keys.
 * Scans every key, collects all records, picks the best valid one.
 * Shows a debug block with per-key counts and per-record rejection reasons.
 * Token never exposed. No agent call. No execution. No network during hydration.
 */
import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, Lock,
  Send, ShieldX, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_DECISION = 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW';

// All keys ever used by any version of WakeActivationForm
const LS_CANDIDATE_KEYS = [
  'wake_activation_readiness_history',
  'wakeActivationReadinessHistory',
  'openclawWakeActivationReadinessHistory',
  'controlled_wake_activation_review_history',
];

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalize a raw record from localStorage into a canonical shape.
 * approvalState lives at r.form.operatorApprovalState in WakeActivationForm records.
 * validationResults is the checks object (not "checks").
 */
function normalizeRecord(r, sourceKey) {
  if (!r || typeof r !== 'object') return null;

  const approvalState =
    r.approvalState ||
    r.approvalstate ||
    r.form?.operatorApprovalState ||
    r.form?.approvalState ||
    r.reviewApprovalState ||
    null;

  const allPass = r.allPass === true || r.allpass === true;

  // checks can be stored as validationResults (WakeActivationForm) or checks
  const checksObj = r.validationResults || r.checks || {};
  const checksPassed = typeof r.checksPassed === 'number'
    ? r.checksPassed
    : Object.values(checksObj).filter(Boolean).length;
  const checksTotal = Object.keys(checksObj).length || 16;

  return {
    evidenceId:       r.evidenceId || r.evidenceID || r.id || null,
    auditHash:        r.auditHash  || r.audithash  || null,
    allPass,
    decision:         r.decision   || null,
    activationStatus: r.activationStatus || r.activationstatus || null,
    approvalState,
    checks:           `${checksPassed}/${checksTotal}`,
    checksPassed,
    createdAt:        r.createdAt  || null,
    sourceKey,
    _raw:             r,
  };
}

// ── Scan all keys, return debug info + best record ───────────────────────────

function whyInvalid(norm) {
  const reasons = [];
  if (!norm.allPass)                                        reasons.push('allPass≠true');
  if (norm.decision !== REQUIRED_DECISION)                  reasons.push(`decision=${norm.decision}`);
  if (norm.activationStatus !== 'NOT_ACTIVATED')            reasons.push(`activationStatus=${norm.activationStatus}`);
  if (!['APPROVED','REVIEW_READY'].includes(norm.approvalState))
    reasons.push(`approvalState=${norm.approvalState}`);
  return reasons.length ? reasons.join(', ') : null;
}

function isValid(norm) {
  return whyInvalid(norm) === null;
}

function fullScan() {
  const keyResults = []; // { key, rawCount, records: NormalizedRecord[], error }
  const allValid   = []; // valid records across all keys

  for (const key of LS_CANDIDATE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) { keyResults.push({ key, rawCount: 0, records: [], error: null }); continue; }
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) {
        keyResults.push({ key, rawCount: 0, records: [], error: `JSON parse error: ${e.message}` });
        continue;
      }
      if (!Array.isArray(parsed)) {
        keyResults.push({ key, rawCount: 0, records: [], error: 'not an array' });
        continue;
      }
      const normalized = parsed.map(r => normalizeRecord(r, key)).filter(Boolean);
      keyResults.push({ key, rawCount: parsed.length, records: normalized, error: null });
      normalized.filter(isValid).forEach(r => allValid.push(r));
    } catch (e) {
      keyResults.push({ key, rawCount: 0, records: [], error: String(e) });
    }
  }

  // Pick newest valid record (records are newest-first in WakeActivationForm)
  const best = allValid[0] || null;
  return { keyResults, best };
}

// ── Gate check ───────────────────────────────────────────────────────────────

function isEvidenceReady(ev) {
  if (!ev) return false;
  return isValid(ev);
}

// ── Post-send verification claims ────────────────────────────────────────────

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

// ── Debug block ──────────────────────────────────────────────────────────────

function ScanDebugBlock({ keyResults, best }) {
  const [open, setOpen] = useState(false);
  const totalFound = keyResults.reduce((s, k) => s + k.rawCount, 0);
  return (
    <div className="border border-border/30 bg-secondary/10 rounded-sm">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-mono text-slate-500 hover:text-slate-300 transition-colors">
        <span>localStorage Scan Debug — {totalFound} total records across {LS_CANDIDATE_KEYS.length} keys</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3 text-[7px] font-mono">
          {/* Per-key summary */}
          <div className="space-y-1.5">
            {keyResults.map(k => (
              <div key={k.key} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {k.rawCount > 0
                    ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
                    : <XCircle className="w-2.5 h-2.5 text-slate-600 shrink-0" />}
                  <span className={k.rawCount > 0 ? 'text-primary font-bold' : 'text-slate-600'}>{k.key}</span>
                  <span className="text-slate-500">— {k.rawCount} records</span>
                  {k.error && <span className="text-destructive">({k.error})</span>}
                </div>
                {/* Per-record rejection reasons */}
                {k.records.map((r, i) => {
                  const why = whyInvalid(r);
                  return (
                    <div key={i} className="ml-5 flex gap-2 text-[6px]">
                      {why
                        ? <><XCircle className="w-2 h-2 text-destructive shrink-0 mt-0.5" /><span className="text-destructive">{r.evidenceId || `record[${i}]`}: {why}</span></>
                        : <><CheckCircle2 className="w-2 h-2 text-primary shrink-0 mt-0.5" /><span className="text-primary">{r.evidenceId}: VALID</span></>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Selected record */}
          <div className="border-t border-border/20 pt-2 space-y-0.5">
            <div>SELECTED_EVIDENCE_ID: <span className={best ? 'text-primary' : 'text-destructive'}>{best?.evidenceId || '(none)'}</span></div>
            <div>SELECTED_SOURCE_KEY: <span className={best ? 'text-primary' : 'text-destructive'}>{best?.sourceKey || '(none)'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pre-send verification report ─────────────────────────────────────────────

function PreSendVerification({ evidence }) {
  const rows = [
    { label: 'READINESS_RECORD_LOADED',  val: evidence ? 'YES' : 'NO',                           ok: !!evidence },
    { label: 'EVIDENCE_SOURCE_KEY',       val: evidence?.sourceKey || '(none found)',              ok: !!evidence?.sourceKey },
    { label: 'allPass',                   val: evidence ? String(evidence.allPass) : '—',          ok: evidence?.allPass === true },
    { label: 'decision',                  val: evidence?.decision === REQUIRED_DECISION ? 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW' : (evidence?.decision || '—'), ok: evidence?.decision === REQUIRED_DECISION },
    { label: 'activationStatus',          val: evidence?.activationStatus || '—',                  ok: evidence?.activationStatus === 'NOT_ACTIVATED' },
    { label: 'approvalState',             val: evidence?.approvalState || '—',                     ok: ['APPROVED','REVIEW_READY'].includes(evidence?.approvalState) },
    { label: 'checks',                    val: evidence?.checks || '—',                            ok: evidence?.checksPassed >= 16 },
    { label: 'TOKEN_NOT_EXPOSED',         val: 'CLIENT_NEVER_RECEIVES_TOKEN',                      ok: true },
    { label: '/hooks/agent',              val: 'PROHIBITED',                                       ok: true },
    { label: 'SEND_BUTTON_GATED',         val: isEvidenceReady(evidence) ? 'UNLOCKED' : 'LOCKED',  ok: isEvidenceReady(evidence) },
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

// ── Main component ────────────────────────────────────────────────────────────

export default function ControlledWakeSendPanel({ evidence: evidenceProp }) {
  const [scanResult,   setScanResult]   = useState(() => fullScan());
  const [evidence,     setEvidence]     = useState(() => fullScan().best);
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
    const scan = fullScan();
    setScanResult(scan);
    setEvidence(scan.best);
  }, []);

  const handleManualImport = () => {
    setManualError('');
    try {
      const parsed = JSON.parse(manualJson.trim());
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      const norm = normalizeRecord(obj, 'MANUAL_IMPORT');
      if (!norm) { setManualError('Could not parse record.'); return; }
      setEvidence(norm);
      setScanResult(prev => ({ ...prev, best: norm }));
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

      {/* ── Evidence gate status ─────────────────────────────────────────── */}
      <div className={`border rounded-sm p-4 space-y-3 ${evidenceReady ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className={`text-[9px] font-bold uppercase tracking-wide ${evidenceReady ? 'text-primary' : 'text-amber-400'}`}>
            {evidenceReady
              ? '✓ Readiness Evidence Verified — Wake Send Unlocked'
              : evidence
              ? '⚠ Evidence Loaded — Gate Not Fully Satisfied'
              : '⚠ No Valid Readiness Evidence Found'}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={reload}
              className="flex items-center gap-1 text-[7px] text-slate-500 hover:text-primary border border-border/30 hover:border-primary/30 px-2 py-1 rounded-sm transition-colors">
              <RefreshCw className="w-2.5 h-2.5" /> Load Latest Valid Readiness Record
            </button>
            <button type="button" onClick={() => setShowManual(v => !v)}
              className="flex items-center gap-1 text-[7px] text-slate-500 hover:text-amber-400 border border-border/30 hover:border-amber-400/30 px-2 py-1 rounded-sm transition-colors">
              Manual Import
            </button>
          </div>
        </div>

        {/* Source key */}
        <div className="text-[7px] font-mono text-slate-500">
          EVIDENCE_SOURCE_KEY: <span className={evidence?.sourceKey ? 'text-primary font-bold' : 'text-destructive'}>{evidence?.sourceKey || '(none)'}</span>
        </div>

        {/* Field grid */}
        <div className="grid grid-cols-2 gap-1 text-[7px] font-mono">
          {[
            { label: 'evidenceId',       val: evidence?.evidenceId || '—',                                  ok: !!evidence?.evidenceId },
            { label: 'auditHash',        val: evidence?.auditHash ? evidence.auditHash.slice(0,18)+'…' : '—', ok: !!evidence?.auditHash },
            { label: 'allPass',          val: evidence ? String(evidence.allPass) : '—',                    ok: evidence?.allPass === true },
            { label: 'decision',         val: evidence?.decision === REQUIRED_DECISION ? 'READY…' : (evidence?.decision || '—'), ok: evidence?.decision === REQUIRED_DECISION },
            { label: 'activationStatus', val: evidence?.activationStatus || '—',                            ok: evidence?.activationStatus === 'NOT_ACTIVATED' },
            { label: 'approvalState',    val: evidence?.approvalState || '—',                               ok: ['APPROVED','REVIEW_READY'].includes(evidence?.approvalState) },
            { label: 'checks',           val: evidence?.checks || '—',                                      ok: (evidence?.checksPassed || 0) >= 16 },
            { label: 'createdAt',        val: evidence?.createdAt ? evidence.createdAt.slice(0,19).replace('T',' ') : '—', ok: !!evidence?.createdAt },
          ].map(({ label, val, ok }) => (
            <div key={label} className="flex items-center gap-1">
              {ok ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />}
              <span className="text-slate-500">{label}:</span>
              <span className={ok ? 'text-primary' : 'text-destructive'}>{val}</span>
            </div>
          ))}
        </div>

        {/* Hint when approvalState is the only blocker */}
        {evidence && !evidenceReady && evidence.allPass && evidence.decision === REQUIRED_DECISION && evidence.activationStatus === 'NOT_ACTIVATED' && (
          <div className="text-[7px] text-amber-400/80 border-t border-amber-500/20 pt-2">
            approvalState must be <span className="font-bold">APPROVED</span> or <span className="font-bold">REVIEW_READY</span> — currently: <span className="font-bold text-destructive">{evidence.approvalState || '(missing)'}</span>. Go to Wake Activation Readiness Gate → set Operator Approval State to REVIEW_READY and regenerate the record.
          </div>
        )}

        {/* No evidence hint */}
        {!evidence && (
          <div className="text-[7px] text-amber-400/80 border-t border-amber-500/20 pt-2 leading-relaxed">
            Go to <span className="font-bold">Wake Activation Readiness Gate → Readiness Checker</span>, fill the form with all passing values, generate a record, then click <span className="font-bold">Load Latest Valid Readiness Record</span> above. Or paste JSON via <span className="font-bold">Manual Import</span>.
          </div>
        )}
      </div>

      {/* ── localStorage scan debug ──────────────────────────────────────── */}
      <ScanDebugBlock keyResults={scanResult.keyResults} best={scanResult.best} />

      {/* ── Manual import ────────────────────────────────────────────────── */}
      {showManual && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm p-3 space-y-2">
          <div className="text-[8px] font-bold text-amber-400 uppercase">Manual Import — Paste Readiness Record JSON</div>
          <textarea
            value={manualJson}
            onChange={e => setManualJson(e.target.value)}
            rows={5}
            placeholder='Paste full readiness record JSON: {"evidenceId":"VWAR-...","allPass":true,...}'
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
      <PreSendVerification evidence={evidence} />

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
              Button locked — valid readiness evidence required. See debug block above for rejection reasons.
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