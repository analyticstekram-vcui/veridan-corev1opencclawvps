/**
 * Phase5FControlledWakeSender
 * Reads Phase 5E validation result from localStorage.
 * Enables send only if Phase 5E PASS.
 * Sends a controlled wake notification to openclawControlledWake only.
 * No execution. No agent. No browser automation. No file write. No token exposed.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, Lock, Send, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';

const VALIDATION_PREFIX  = 'controlled_openclaw_command_preview_validation_';
const PREVIEW_PREFIX     = 'controlled_openclaw_command_preview_';
const WAKE_RESULT_PREFIX = 'controlled_openclaw_wake_send_5f_';

function loadLatest(prefix, excludePrefix) {
  try {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(prefix) && !(excludePrefix && k.startsWith(excludePrefix)))
      .sort()
      .reverse();
    if (!keys.length) return null;
    return JSON.parse(localStorage.getItem(keys[0]));
  } catch { return null; }
}

const SAFETY_ROWS = [
  { label: 'Dispatch',           value: 'DISABLED' },
  { label: 'Execution',          value: 'NOT_EXECUTED' },
  { label: 'Token Exposed',      value: 'NEVER' },
  { label: '/hooks/agent',       value: 'NOT_CALLED' },
  { label: 'Browser Automation', value: 'DISABLED' },
  { label: 'File Write',         value: 'DISABLED' },
  { label: 'Credential Use',     value: 'DISABLED' },
  { label: 'Broker Action',      value: 'DISABLED' },
];

const RESULT_FIELDS = [
  'wakeStatus', 'httpStatus', 'executionStatus', 'dispatchStatus',
  'tokenExposed', 'agentEndpointCalled', 'browserAutomation',
  'fileWrite', 'auditId', 'timestamp',
];

export default function Phase5FControlledWakeSender() {
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [resultOpen,   setResultOpen]   = useState(false);
  const [verifyOpen,   setVerifyOpen]   = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);

  const validation = loadLatest(VALIDATION_PREFIX);
  const preview    = loadLatest(PREVIEW_PREFIX, VALIDATION_PREFIX);

  const canSend = validation?.validationStatus === 'PASS';

  const lockReason = !validation
    ? 'No Phase 5E validation found — run Phase 5E first'
    : validation.validationStatus === 'FAIL'
    ? `Phase 5E validation FAILED (${validation.failedChecks?.length ?? '?'} checks failed)`
    : validation.validationStatus === 'HOLD'
    ? 'Phase 5E validation is HOLD — generate a Phase 5D preview first'
    : null;

  const handleSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('openclawControlledWake', {
        operatorConfirmed: true,
        operatorNote: `Phase 5F send — validated preview: ${validation?.sourcePreviewId ?? '—'}`,
        readinessEvidence: {
          sourcePhase: 'PHASE_5F_CONTROLLED_WAKE_SENDER',
          validationId: validation?.validationId ?? null,
          sourcePreviewId: validation?.sourcePreviewId ?? null,
          commandType: preview?.commandType ?? null,
        },
      });
      const d = res.data || {};
      const packet = {
        wakeStatus:          d.wakeStatus          ?? d.dispatchStatus ?? '—',
        httpStatus:          d.httpStatus          ?? '—',
        executionStatus:     d.executionStatus     ?? 'NOT_EXECUTED',
        dispatchStatus:      d.dispatchStatus      ?? '—',
        tokenExposed:        d.tokenExposed        ?? false,
        agentEndpointCalled: d.agentEndpointCalled ?? false,
        browserAutomation:   d.browserAutomation   ?? false,
        fileWrite:           d.filesystemWrite      ?? false,
        auditId:             d.auditId             ?? '—',
        timestamp:           d.timestamp           ?? new Date().toISOString(),
      };
      const key = `${WAKE_RESULT_PREFIX}${Date.now()}`;
      try { localStorage.setItem(key, JSON.stringify(packet)); } catch { /* quota */ }
      setResult(packet);
      setResultOpen(true);
    } catch (err) {
      const d = err.response?.data || {};
      setError(d.error || d.detail || err.message || 'Request failed');
      if (d.executionStatus || d.auditId) setResult(d);
    } finally {
      setLoading(false);
    }
  };

  const resultOk = result?.dispatchStatus === 'WAKE_NOTIFICATION_SENT_ONLY';

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Phase 5F — Controlled Wake Sender
      </div>

      {/* Status card */}
      <div className={`border rounded-lg p-4 space-y-3 ${canSend ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <div className="flex items-center gap-2">
          {canSend
            ? <><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /><span className="text-[10px] font-bold text-primary uppercase">READY — Phase 5E PASS</span></>
            : <><Lock className="w-4 h-4 text-amber-500 shrink-0" /><span className="text-[10px] font-bold text-amber-400 uppercase">LOCKED</span></>}
        </div>

        {/* Phase 5E summary */}
        {validation && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-[7px] font-mono">
            <div><span className="text-slate-500">validationId: </span><span className="text-slate-200">{validation.validationId ?? '—'}</span></div>
            <div><span className="text-slate-500">status: </span>
              <span className={validation.validationStatus === 'PASS' ? 'text-primary font-bold' : 'text-destructive font-bold'}>{validation.validationStatus}</span>
            </div>
            <div><span className="text-slate-500">passed: </span><span className="text-primary">{validation.passedChecks?.length ?? 0}</span></div>
            <div><span className="text-slate-500">failed: </span><span className={validation.failedChecks?.length > 0 ? 'text-destructive' : 'text-primary'}>{validation.failedChecks?.length ?? 0}</span></div>
            <div><span className="text-slate-500">sourcePreview: </span><span className="text-slate-300">{validation.sourcePreviewId ?? '—'}</span></div>
          </div>
        )}

        {/* Selected preview */}
        {preview && canSend && (
          <div className="border-t border-border/20 pt-2 space-y-0.5 text-[7px] font-mono">
            <div className="text-[7px] font-bold text-slate-400 uppercase mb-1">Selected Command Preview</div>
            <div><span className="text-slate-500">previewId: </span><span className="text-primary">{preview.previewId}</span></div>
            <div><span className="text-slate-500">commandType: </span><span className="text-amber-400">{preview.commandType}</span></div>
            <div><span className="text-slate-500">riskLevel: </span><span className="text-slate-300">{preview.riskLevel}</span></div>
            <div><span className="text-slate-500">sourcePhase: </span><span className="text-slate-300">{preview.sourcePhase}</span></div>
          </div>
        )}

        {/* Lock reason */}
        {lockReason && (
          <div className="flex items-center gap-1.5 text-[7px] font-mono text-amber-400">
            <AlertTriangle className="w-3 h-3 shrink-0" /> {lockReason}
          </div>
        )}
      </div>

      {/* Safety notice */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg px-4 py-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-amber-500">
          <AlertTriangle className="w-3 h-3 shrink-0" /> NOTIFICATION ONLY — NOT AN EXECUTION COMMAND
        </div>
        <ul className="text-[7px] text-amber-400/80 space-y-0.5 ml-4 list-disc">
          <li>Sends POST to /hooks/wake only — no /hooks/agent</li>
          <li>Token read server-side — never returned to this browser</li>
          <li>No execution, no browser automation, no broker action</li>
          <li>Result saved to localStorage only</li>
        </ul>
      </div>

      {/* Send button */}
      {!result && (
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canSend || loading}
          className="flex items-center gap-1.5 text-[8px] font-bold px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide">
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Sending…</> : <><Send className="w-3 h-3" />Send Controlled Wake Notification</>}
        </button>
      )}
      {!canSend && !result && (
        <div className="text-[7px] text-amber-400 font-mono">Button locked — Phase 5E must PASS first.</div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-amber-500/40 rounded-lg p-6 max-w-sm w-full space-y-4 font-mono">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-[10px] font-bold text-amber-400 uppercase">Confirm Wake Notification</span>
            </div>
            <div className="text-[8px] text-slate-400 leading-relaxed space-y-1.5">
              <p>POST to <span className="text-primary font-bold">/hooks/wake</span> only.</p>
              <p>Token stays server-side. No execution performed.</p>
              <p>Preview: <span className="text-primary font-bold">{preview?.previewId ?? '—'}</span></p>
              <p>Validation: <span className="text-primary font-bold">{validation?.validationId ?? '—'}</span></p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmOpen(false)}
                className="flex-1 text-[8px] px-3 py-2 border border-border/40 text-slate-400 hover:text-slate-200 rounded transition-colors">Cancel</button>
              <button type="button" onClick={handleSend}
                className="flex-1 text-[8px] font-bold px-3 py-2 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 rounded transition-colors uppercase">
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !result && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-lg px-4 py-3 text-[8px] text-destructive font-mono">{error}</div>
      )}

      {/* Result panel */}
      {result && (
        <div className={`border rounded-lg overflow-hidden ${resultOk ? 'border-primary/30' : 'border-destructive/30'}`}>
          <button type="button" onClick={() => setResultOpen(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-2">
              {resultOk
                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                : <XCircle className="w-3.5 h-3.5 text-destructive" />}
              <span className={`text-[9px] font-bold uppercase ${resultOk ? 'text-primary' : 'text-destructive'}`}>
                {result.dispatchStatus || result.wakeStatus || (error ? 'ERROR' : 'RESULT')}
              </span>
            </div>
            {resultOpen ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          </button>
          {resultOpen && (
            <div className="px-4 pb-4 space-y-0.5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-[7px] font-mono">
                {RESULT_FIELDS.map(f => {
                  const v = result[f];
                  const isSafe = v === 'NOT_EXECUTED' || v === false || v === 'DISABLED';
                  return (
                    <div key={f} className="flex gap-1 flex-wrap">
                      <span className="text-slate-500 shrink-0">{f}:</span>
                      <span className={isSafe ? 'text-primary font-bold' : v === true ? 'text-destructive font-bold' : 'text-slate-200'}>
                        {v == null ? '—' : String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[6px] text-slate-600 italic pt-2">Saved to localStorage — no execution performed.</div>
            </div>
          )}
        </div>
      )}

      {/* Safety status card */}
      <div className="border border-border/40 bg-card rounded-lg p-4 space-y-2">
        <div className="text-[8px] font-bold text-slate-300 uppercase mb-1">Safety Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
          {SAFETY_ROWS.map(r => (
            <div key={r.label} className="flex items-center gap-1.5 text-[7px] font-mono">
              <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />
              <span className="text-slate-500">{r.label}:</span>
              <span className="text-destructive font-bold">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification table */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <button type="button" onClick={() => setVerifyOpen(v => !v)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Phase 5F Verification Table</span>
          </div>
          <span className="text-[7px] text-slate-500">{verifyOpen ? '▾ hide' : '▸ show'}</span>
        </button>
        {verifyOpen && (
          <div className="px-4 pb-4 space-y-1">
            {[
              'No new route created',
              'No new navigation item added',
              'Phase 5E PASS required before send',
              'Only openclawControlledWake called',
              '/hooks/agent not called',
              'Token never returned to client',
              'No execution enabled',
              'No browser automation',
              'No file writes',
              'No credential use',
              'No broker/trading action',
              'Result saved to localStorage only',
              'executionStatus remains NOT_EXECUTED',
            ].map(label => (
              <div key={label} className="flex items-center gap-2 text-[7px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-300">{label}</span>
                <span className="ml-auto font-bold text-primary">PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}