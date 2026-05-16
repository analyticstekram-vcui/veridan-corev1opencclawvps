/**
 * BrowserObservationContractValidatorPanel — Phase 18 Dry-Run Contract Validator
 * Calls validateBrowserObservationContract backend function to validate payload shape, policy, and safety flags.
 * No OpenClaw calls, no fetch to external services, no browser automation, no execution.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FlaskConical, Copy, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

const RESULT_KEY = 'openclawBrowserObservationContractValidationResult';

const SAFE_PRESET = {
  requestId:              `REQ-PRESET-${Date.now()}`,
  proposalId:             'PROP-PRESET-001',
  observationType:        'PAGE_TITLE_READ',
  targetUrl:              'https://example.com',
  selector:               '',
  allowedReadOnlyFields:  ['title'],
  executionAllowed:       false,
  dispatchAllowed:        false,
  browserMutationAllowed: false,
  credentialEntryAllowed: false,
  safetyMode:             'READ_ONLY_OBSERVATION',
};

const STATUS_CONFIG = {
  VALID_DRY_RUN:        { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',            icon: CheckCircle2 },
  REJECTED_BY_CONTRACT: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',      icon: AlertTriangle },
  BLOCKED_BY_POLICY:    { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5', icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export default function BrowserObservationContractValidatorPanel() {
  const [form, setForm] = useState({
    requestId:              '',
    proposalId:             '',
    observationType:        'PAGE_TITLE_READ',
    targetUrl:              '',
    selector:               '',
    allowedReadOnlyFields:  '',
    executionAllowed:       false,
    dispatchAllowed:        false,
    browserMutationAllowed: false,
    credentialEntryAllowed: false,
    safetyMode:             'READ_ONLY_OBSERVATION',
  });
  const [result, setResult]   = useState(() => loadJSON(RESULT_KEY, null));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState(null);

  const applyPreset = () => {
    setForm({
      requestId:              `REQ-PRESET-${Date.now()}`,
      proposalId:             'PROP-PRESET-001',
      observationType:        'PAGE_TITLE_READ',
      targetUrl:              'https://example.com',
      selector:               '',
      allowedReadOnlyFields:  'title',
      executionAllowed:       false,
      dispatchAllowed:        false,
      browserMutationAllowed: false,
      credentialEntryAllowed: false,
      safetyMode:             'READ_ONLY_OBSERVATION',
    });
    setError(null);
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      requestId:              form.requestId.trim() || undefined,
      proposalId:             form.proposalId.trim() || undefined,
      observationType:        form.observationType.trim() || undefined,
      targetUrl:              form.targetUrl.trim() || undefined,
      selector:               form.selector.trim() || undefined,
      allowedReadOnlyFields:  form.allowedReadOnlyFields.split(',').map(s => s.trim()).filter(Boolean),
      executionAllowed:       form.executionAllowed,
      dispatchAllowed:        form.dispatchAllowed,
      browserMutationAllowed: form.browserMutationAllowed,
      credentialEntryAllowed: form.credentialEntryAllowed,
      safetyMode:             form.safetyMode.trim(),
    };
    const response = await base44.functions.invoke('validateBrowserObservationContract', payload);
    const data = response.data;
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(data, null, 2)); } catch {}
    setResult(data);
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusCfg = result ? (STATUS_CONFIG[result.validationStatus] ?? STATUS_CONFIG.REJECTED_BY_CONTRACT) : null;

  const field = (label, key, type = 'text', extra = {}) => (
    <div>
      <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] font-mono text-foreground focus:outline-none focus:border-primary placeholder:text-slate-600"
        {...extra}
      />
    </div>
  );

  const boolToggle = (label, key) => (
    <div className="flex items-center justify-between px-3 py-2 bg-secondary/20 border border-border/40 rounded">
      <span className="text-[9px] font-mono text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
        className={`text-[8px] font-bold px-2 py-1 rounded border ${
          form[key]
            ? 'text-destructive border-destructive/30 bg-destructive/10'
            : 'text-primary border-primary/30 bg-primary/10'
        }`}
      >
        {String(form[key]).toUpperCase()}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 18 · Dry-Run Contract Validator</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Browser Observation Contract Validator
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Dry-run validation only. No OpenClaw calls. No external forwarding. No browser actions. No execution.</div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Payload</span>
          <button
            type="button"
            onClick={applyPreset}
            className="text-[8px] font-bold px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Load Safe PAGE_TITLE_READ Preset
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('Request ID', 'requestId', 'text', { placeholder: 'REQ-...' })}
            {field('Proposal ID', 'proposalId', 'text', { placeholder: 'PROP-...' })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Observation Type</label>
              <input
                type="text"
                value={form.observationType}
                onChange={e => setForm(f => ({ ...f, observationType: e.target.value }))}
                className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] font-mono text-foreground focus:outline-none focus:border-primary placeholder:text-slate-600"
                placeholder="PAGE_TITLE_READ"
              />
            </div>
            {field('Safety Mode', 'safetyMode', 'text', { placeholder: 'READ_ONLY_OBSERVATION' })}
          </div>
          {field('Target URL', 'targetUrl', 'text', { placeholder: 'https://...' })}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('Selector (optional)', 'selector', 'text', { placeholder: 'CSS selector or blank' })}
            {field('Allowed Read-Only Fields (comma-separated)', 'allowedReadOnlyFields', 'text', { placeholder: 'title, url, ...' })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {boolToggle('executionAllowed',       'executionAllowed')}
            {boolToggle('dispatchAllowed',        'dispatchAllowed')}
            {boolToggle('browserMutationAllowed', 'browserMutationAllowed')}
            {boolToggle('credentialEntryAllowed', 'credentialEntryAllowed')}
          </div>
          <div className="text-[8px] text-slate-500 italic">Safe payload: all four flags must be false. safetyMode must be READ_ONLY_OBSERVATION.</div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded">
              <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              <span className="text-[9px] text-destructive">{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleValidate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            {loading ? 'Validating…' : 'Validate Dry-Run Payload'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && statusCfg && (() => {
        const StatusIcon = statusCfg.icon;
        return (
          <div className={`border rounded-lg p-4 space-y-3 ${statusCfg.bg}`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-5 h-5 ${statusCfg.color} shrink-0`} />
              <div>
                <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Validation Status</div>
                <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{result.validationStatus}</div>
                <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{result.validationId}</div>
              </div>
            </div>

            {result.validationErrors?.length > 0 && (
              <div className="space-y-1">
                <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Validation Errors ({result.validationErrors.length})</div>
                {result.validationErrors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-1.5 bg-card/60 border border-border/40 rounded">
                    <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <span className="text-[8px] text-slate-300">{e}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {[
                { k: 'dryRunOnly',             v: result.dryRunOnly },
                { k: 'openClawCalled',         v: result.openClawCalled },
                { k: 'backendForwarded',       v: result.backendForwarded },
                { k: 'browserActionPerformed', v: result.browserActionPerformed },
              ].map(({ k, v }) => (
                <div key={k} className="bg-card/60 border border-border/40 px-2 py-1.5 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5">{k}</div>
                  <div className={`font-bold ${v === false ? 'text-primary' : 'text-destructive'}`}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Copy + JSON preview */}
      {result && (
        <>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Response JSON'}
          </button>

          <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Response — JSON</span>
              <span className="text-[8px] font-mono text-slate-500">{new Date(result.createdAt).toLocaleString()}</span>
            </div>
            <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
              {JSON.stringify(result, null, 2)}
            </pre>
            <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{RESULT_KEY}</span></span>
            </div>
          </div>
        </>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Dry-Run Only: </span>This validator checks payload shape, policy, and safety flags only. No OpenClaw calls. No browser actions. No external forwarding.
        </p>
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Calls <span className="font-mono mx-1">validateBrowserObservationContract</span> only. No OpenClaw. No browser automation. No execution. No dispatch.
      </div>
    </div>
  );
}