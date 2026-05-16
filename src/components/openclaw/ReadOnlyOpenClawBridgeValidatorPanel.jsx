/**
 * ReadOnlyOpenClawBridgeValidatorPanel — Phase 21 Dry-Run Bridge Validator
 * Validates bridge requests against Phase 20 contract locally. No OpenClaw calls.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Copy, CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw } from 'lucide-react';

const RESULT_KEY = 'openclawReadOnlyOpenClawBridgeValidationResult';

const ALLOWED_TYPES = [
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
  'OBSERVATION_EVIDENCE_RECORD',
];

const SAFE_PRESET = {
  bridgeRequestId:       `BREQ-PRESET-${Date.now()}`,
  requestId:             'REQ-PRESET-001',
  proposalId:            'PROP-PRESET-001',
  observationType:       'PAGE_TITLE_READ',
  targetUrl:             'https://openclaw.veridancore.com',
  selector:              '',
  allowedReadOnlyFields: 'title,url',
  approvalStatus:        'APPROVED_FOR_DESIGN',
  dryRunValidationId:    'OBVAL-PRESET-001',
  auditId:               'AUDIT-PRESET-001',
  executionAllowed:      'false',
  dispatchAllowed:       'false',
  browserMutationAllowed:'false',
  credentialEntryAllowed:'false',
  safetyMode:            'READ_ONLY_BRIDGE_DRY_RUN',
};

const STATUS_CONFIG = {
  VALID_BRIDGE_DRY_RUN:        { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         icon: CheckCircle2 },
  REJECTED_BY_BRIDGE_CONTRACT: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle },
  BLOCKED_BY_POLICY:           { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

const EMPTY_FORM = {
  bridgeRequestId:       '',
  requestId:             '',
  proposalId:            '',
  observationType:       'PAGE_TITLE_READ',
  targetUrl:             '',
  selector:              '',
  allowedReadOnlyFields: '',
  approvalStatus:        'APPROVED_FOR_DESIGN',
  dryRunValidationId:    '',
  auditId:               '',
  executionAllowed:      'false',
  dispatchAllowed:       'false',
  browserMutationAllowed:'false',
  credentialEntryAllowed:'false',
  safetyMode:            'READ_ONLY_BRIDGE_DRY_RUN',
};

export default function ReadOnlyOpenClawBridgeValidatorPanel() {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [result, setResult]     = useState(() => loadJSON(RESULT_KEY, null));
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [copied, setCopied]     = useState(false);

  const handlePreset = () => {
    setForm({ ...SAFE_PRESET, bridgeRequestId: `BREQ-PRESET-${Date.now()}` });
    setResult(null);
    setError(null);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const payload = {
      ...form,
      allowedReadOnlyFields: form.allowedReadOnlyFields
        ? form.allowedReadOnlyFields.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      executionAllowed:       form.executionAllowed === 'false' ? false : true,
      dispatchAllowed:        form.dispatchAllowed === 'false' ? false : true,
      browserMutationAllowed: form.browserMutationAllowed === 'false' ? false : true,
      credentialEntryAllowed: form.credentialEntryAllowed === 'false' ? false : true,
    };
    const response = await base44.functions.invoke('validateReadOnlyOpenClawBridgeRequest', payload);
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

  const statusCfg = result ? (STATUS_CONFIG[result.validationStatus] ?? STATUS_CONFIG.REJECTED_BY_BRIDGE_CONTRACT) : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 21 · Dry-Run Bridge Validator</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Read-Only OpenClaw Bridge Validator
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Validates bridge requests against the Phase 20 contract. Dry-run only. No OpenClaw calls, no browser automation, no execution.</div>
      </div>

      {/* Safety chip row */}
      <div className="flex flex-wrap gap-1.5">
        {['DRY_RUN_ONLY', 'NO_OPENCLAW_CALLS', 'NO_EXECUTION', 'NO_DISPATCH', 'READ_ONLY'].map(s => (
          <span key={s} className="text-[7px] px-2 py-1 border border-primary/30 bg-primary/5 text-primary rounded font-bold uppercase tracking-wider">{s}</span>
        ))}
      </div>

      {/* Preset button */}
      <button
        type="button"
        onClick={handlePreset}
        className="flex items-center gap-2 px-3 py-2 border border-amber-500/40 text-amber-400 bg-amber-500/5 text-[10px] font-bold rounded hover:bg-amber-500/10 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Load Safe PAGE_TITLE_READ Preset
      </button>

      {/* Form grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Bridge Request Payload</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {[
            { field: 'bridgeRequestId', label: 'Bridge Request ID', placeholder: 'BREQ-...' },
            { field: 'requestId', label: 'Request ID', placeholder: 'REQ-...' },
            { field: 'proposalId', label: 'Proposal ID', placeholder: 'PROP-...' },
            { field: 'targetUrl', label: 'Target URL', placeholder: 'https://...' },
            { field: 'selector', label: 'Selector (optional)', placeholder: '.css-selector' },
            { field: 'allowedReadOnlyFields', label: 'Allowed Read-Only Fields (comma-separated)', placeholder: 'title,url' },
            { field: 'dryRunValidationId', label: 'Dry-Run Validation ID', placeholder: 'OBVAL-...' },
            { field: 'auditId', label: 'Audit ID', placeholder: 'AUDIT-...' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">{label}</label>
              <input
                type="text"
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-1.5 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground placeholder-slate-600 focus:outline-none focus:border-primary/50"
              />
            </div>
          ))}

          {/* observationType select */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Observation Type</label>
            <select
              value={form.observationType}
              onChange={e => handleChange('observationType', e.target.value)}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50"
            >
              {ALLOWED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* approvalStatus select */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Approval Status</label>
            <select
              value={form.approvalStatus}
              onChange={e => handleChange('approvalStatus', e.target.value)}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="APPROVED_FOR_DESIGN">APPROVED_FOR_DESIGN</option>
              <option value="AUTO_APPROVED_READ_ONLY_DESIGN">AUTO_APPROVED_READ_ONLY_DESIGN</option>
              <option value="PENDING">PENDING (will fail)</option>
            </select>
          </div>

          {/* safetyMode */}
          <div className="sm:col-span-2">
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Safety Mode</label>
            <input
              type="text"
              value={form.safetyMode}
              onChange={e => handleChange('safetyMode', e.target.value)}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Boolean flags */}
          {[
            { field: 'executionAllowed', label: 'executionAllowed' },
            { field: 'dispatchAllowed', label: 'dispatchAllowed' },
            { field: 'browserMutationAllowed', label: 'browserMutationAllowed' },
            { field: 'credentialEntryAllowed', label: 'credentialEntryAllowed' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">{label}</label>
              <select
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                className="w-full px-3 py-1.5 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="false">false (safe)</option>
                <option value="true">true (will be blocked)</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <span className="text-[9px] text-destructive">{error}</span>
        </div>
      )}

      {/* Validate button */}
      <button
        type="button"
        onClick={handleValidate}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
        {loading ? 'Validating…' : 'Validate Bridge Dry-Run'}
      </button>

      {/* Result */}
      {result && statusCfg && (() => {
        const Icon = statusCfg.icon;
        return (
          <div className={`border rounded-lg p-4 space-y-4 ${statusCfg.bg}`}>
            {/* Status header */}
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${statusCfg.color} shrink-0`} />
              <div>
                <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Validation Status</div>
                <div className={`text-[13px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{result.validationStatus}</div>
                <div className="text-[8px] font-mono text-slate-500 mt-0.5">{result.bridgeValidationId}</div>
              </div>
            </div>

            {/* Safety flags grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {[
                { k: 'dryRunOnly',             v: result.dryRunOnly },
                { k: 'openClawCalled',          v: result.openClawCalled },
                { k: 'backendForwarded',        v: result.backendForwarded },
                { k: 'runtimeBridgeActivated',  v: result.runtimeBridgeActivated },
                { k: 'browserActionPerformed',  v: result.browserActionPerformed },
                { k: 'executionAllowed',        v: result.executionAllowed },
                { k: 'dispatchAllowed',         v: result.dispatchAllowed },
                { k: 'credentialEntryAllowed',  v: result.credentialEntryAllowed },
              ].map(({ k, v }) => (
                <div key={k} className="bg-card/60 border border-border/40 px-2 py-1.5 rounded">
                  <div className="text-[7px] text-slate-500 mb-0.5 uppercase tracking-wider">{k}</div>
                  <div className={`font-bold font-mono ${v === false ? 'text-primary' : v === true ? 'text-destructive' : 'text-slate-400'}`}>
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>

            {/* Validation errors */}
            {result.validationErrors?.length > 0 && (
              <div className="space-y-1">
                <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Validation Errors ({result.validationErrors.length})</div>
                {result.validationErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <span className="text-[8px] text-slate-300">{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Safety gate results */}
            {result.safetyGateResults && (
              <div className="bg-card/40 border border-border/30 rounded p-3 space-y-1">
                <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Safety Gate Results</div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(result.safetyGateResults).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      {v ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                      <span className="text-[7px] text-slate-400 font-mono">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Validation Response JSON'}
            </button>
          </div>
        );
      })()}

      {/* JSON preview */}
      {result && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Response — JSON Preview</span>
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
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Dry-run validation only. No OpenClaw calls. No backend forwarding. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}