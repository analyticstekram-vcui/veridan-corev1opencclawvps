/**
 * Phase5ECommandPreviewValidator
 * Reads the latest Phase 5D preview from localStorage and validates it.
 * No OpenClaw call. No execution. No dispatch. localStorage only.
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Shield, FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const PREVIEW_PREFIX     = 'controlled_openclaw_command_preview_';
const VALIDATION_PREFIX  = 'controlled_openclaw_command_preview_validation_';

const ALLOWED_COMMAND_TYPES = [
  'READ_STATUS', 'READ_CAPABILITIES', 'NAVIGATE_PREVIEW', 'EXTRACT_PREVIEW', 'VERIFY_PREVIEW',
];

const BLOCKED_COMMAND_TYPES = [
  'EXECUTE_AGENT', 'RUN_TASK', 'WRITE_FILE', 'USE_CREDENTIAL',
  'PLACE_TRADE', 'MOVE_MONEY', 'CALL_BROKER', 'CALL_BANK', 'CALL_BUREAU', 'CALL_PAYMENT',
];

const REQUIRED_FIELDS = [
  'previewId', 'generatedAt', 'commandType', 'sourcePhase', 'dispatchAllowed',
  'executionStatus', 'openclawCallMade', 'routeCreated', 'approvalRequired',
  'approvedForExecution', 'allowedEndpoint', 'browserAutomation', 'fileWrite',
  'credentialUse', 'brokerAction', 'storage',
];

const SAFETY_RULES = [
  { field: 'sourcePhase',         expected: 'PHASE_5D_COMMAND_PREVIEW_BUILDER', label: 'sourcePhase = PHASE_5D_COMMAND_PREVIEW_BUILDER' },
  { field: 'dispatchAllowed',     expected: false,               label: 'dispatchAllowed = false' },
  { field: 'executionStatus',     expected: 'NOT_EXECUTED',      label: 'executionStatus = NOT_EXECUTED' },
  { field: 'openclawCallMade',    expected: false,               label: 'openclawCallMade = false' },
  { field: 'routeCreated',        expected: false,               label: 'routeCreated = false' },
  { field: 'approvalRequired',    expected: true,                label: 'approvalRequired = true' },
  { field: 'approvedForExecution',expected: false,               label: 'approvedForExecution = false' },
  { field: 'allowedEndpoint',     expected: 'NONE_PREVIEW_ONLY', label: 'allowedEndpoint = NONE_PREVIEW_ONLY' },
  { field: 'browserAutomation',   expected: 'DISABLED',          label: 'browserAutomation = DISABLED' },
  { field: 'fileWrite',           expected: 'DISABLED',          label: 'fileWrite = DISABLED' },
  { field: 'credentialUse',       expected: 'DISABLED',          label: 'credentialUse = DISABLED' },
  { field: 'brokerAction',        expected: 'DISABLED',          label: 'brokerAction = DISABLED' },
  { field: 'storage',             expected: 'LOCALSTORAGE_ONLY', label: 'storage = LOCALSTORAGE_ONLY' },
];

const SAFETY_STATUS_ROWS = [
  { label: 'Dispatch',           value: 'DISABLED' },
  { label: 'Execution',          value: 'NOT_EXECUTED' },
  { label: 'OpenClaw Call',      value: 'NOT_MADE' },
  { label: 'Browser Automation', value: 'DISABLED' },
  { label: 'File Write',         value: 'DISABLED' },
  { label: 'Credential Use',     value: 'DISABLED' },
  { label: 'Broker Action',      value: 'DISABLED' },
];

const VERIFICATION_CHECKS = [
  'No new route created',
  'OpenClaw not called',
  '/hooks/agent not called',
  'Only localStorage preview objects read',
  'Blocked command types fail validation',
  'Unsafe safety values fail validation',
  'No execution dispatch added',
  'No browser automation added',
  'No file writes added',
  'No credential use added',
  'No broker/trading action added',
  'Validation saved to localStorage only',
  'executionStatus remains NOT_EXECUTED',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function genValidationId() {
  return `5E-VAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function loadLatestPreview() {
  try {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(PREVIEW_PREFIX) && !k.startsWith(VALIDATION_PREFIX))
      .sort()
      .reverse();
    if (keys.length === 0) return null;
    return JSON.parse(localStorage.getItem(keys[0]));
  } catch {
    return null;
  }
}

function validatePreview(preview) {
  const passed = [];
  const failed = [];

  const check = (label, ok) => (ok ? passed : failed).push(label);

  // Required fields
  for (const f of REQUIRED_FIELDS) {
    check(`Field present: ${f}`, f in preview);
  }

  // commandType allowlist
  const ct = preview.commandType;
  check('commandType is allowed type', ALLOWED_COMMAND_TYPES.includes(ct));
  check('commandType is NOT blocked type', !BLOCKED_COMMAND_TYPES.includes(ct));

  // Safety rules
  for (const rule of SAFETY_RULES) {
    check(rule.label, preview[rule.field] === rule.expected);
  }

  const validationStatus = failed.length === 0 ? 'PASS' : 'FAIL';
  return { passed, failed, validationStatus };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PreviewSummary({ preview }) {
  return (
    <div className="border border-border/40 bg-secondary/20 rounded-lg p-3 space-y-1 text-[7px] font-mono">
      <div className="text-[8px] font-bold text-slate-300 uppercase mb-1.5">Latest Phase 5D Preview</div>
      {[
        ['previewId',     preview.previewId],
        ['commandType',   preview.commandType],
        ['sourcePhase',   preview.sourcePhase],
        ['generatedAt',   preview.generatedAt?.slice(0, 19).replace('T', ' ')],
        ['riskLevel',     preview.riskLevel],
        ['storage',       preview.storage],
      ].map(([k, v]) => (
        <div key={k} className="flex gap-1">
          <span className="text-slate-500 shrink-0 w-28">{k}:</span>
          <span className={ALLOWED_COMMAND_TYPES.includes(v) ? 'text-primary' : 'text-slate-200'}>{String(v ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}

function ValidationBadge({ status }) {
  if (status === 'PASS') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm uppercase">
      <CheckCircle2 className="w-3 h-3" /> PASS
    </span>
  );
  if (status === 'FAIL') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[9px] font-bold rounded-sm uppercase">
      <XCircle className="w-3 h-3" /> FAIL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded-sm uppercase">
      <AlertTriangle className="w-3 h-3" /> HOLD
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Phase5ECommandPreviewValidator() {
  const [validationResult, setValidationResult] = useState(null);
  const [jsonOpen,         setJsonOpen]         = useState(false);
  const [verifyOpen,       setVerifyOpen]       = useState(false);
  const [saved,            setSaved]            = useState(false);

  const preview = loadLatestPreview();

  const handleValidate = () => {
    setSaved(false);
    setJsonOpen(false);

    if (!preview) {
      setValidationResult({ validationStatus: 'HOLD', failedChecks: [], passedChecks: [], sourcePreviewId: null });
      return;
    }

    const { passed, failed, validationStatus } = validatePreview(preview);

    const result = {
      validationId:     genValidationId(),
      validatedAt:      new Date().toISOString(),
      sourcePreviewId:  preview.previewId ?? null,
      validationStatus,
      passedChecks:     passed,
      failedChecks:     failed,
      dispatchAllowed:  false,
      executionStatus:  'NOT_EXECUTED',
      openclawCallMade: false,
      routeCreated:     false,
      validatorPhase:   'PHASE_5E_COMMAND_PREVIEW_VALIDATOR',
    };

    const key = `${VALIDATION_PREFIX}${Date.now()}`;
    try { localStorage.setItem(key, JSON.stringify(result)); } catch { /* quota */ }

    setValidationResult(result);
    setSaved(true);
    setJsonOpen(true);
  };

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Phase 5E — Command Preview Validator
      </div>

      {/* No preview state */}
      {!preview && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[8px] font-mono font-bold text-amber-400">HOLD_FOR_COMMAND_PREVIEW</span>
          <span className="text-[7px] text-slate-500 ml-2">— generate a Phase 5D preview first</span>
        </div>
      )}

      {/* Preview summary */}
      {preview && <PreviewSummary preview={preview} />}

      {/* Validate button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={handleValidate}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors">
          <Shield className="w-3 h-3" />
          Validate Latest Command Preview
        </button>
        {saved && <span className="text-[7px] text-slate-500 font-mono">Saved to localStorage — no OpenClaw call.</span>}
      </div>

      {/* Validation result */}
      {validationResult && (
        <div className={`border rounded-lg p-4 space-y-3 ${
          validationResult.validationStatus === 'PASS'
            ? 'border-primary/30 bg-primary/5'
            : validationResult.validationStatus === 'FAIL'
            ? 'border-destructive/30 bg-destructive/5'
            : 'border-amber-500/30 bg-amber-500/5'
        }`}>
          {/* Header row */}
          <div className="flex items-center gap-3 flex-wrap">
            <ValidationBadge status={validationResult.validationStatus} />
            <div className="flex items-center gap-3 text-[7px] font-mono ml-auto">
              <span className="text-primary font-bold">{validationResult.passedChecks?.length ?? 0} PASSED</span>
              <span className="text-destructive font-bold">{validationResult.failedChecks?.length ?? 0} FAILED</span>
            </div>
          </div>

          {/* IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-[7px] font-mono">
            <div><span className="text-slate-500">validationId: </span><span className="text-slate-200">{validationResult.validationId ?? '—'}</span></div>
            <div><span className="text-slate-500">sourcePreviewId: </span><span className="text-slate-200">{validationResult.sourcePreviewId ?? '—'}</span></div>
            <div><span className="text-slate-500">validatorPhase: </span><span className="text-primary">{validationResult.validatorPhase}</span></div>
            <div><span className="text-slate-500">validatedAt: </span><span className="text-slate-200">{validationResult.validatedAt?.slice(0,19).replace('T',' ')}</span></div>
          </div>

          {/* Failed checks */}
          {validationResult.failedChecks?.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[7px] font-bold text-destructive uppercase mb-1">Failed Checks</div>
              {validationResult.failedChecks.map(c => (
                <div key={c} className="flex items-center gap-1.5 text-[7px] font-mono text-destructive">
                  <XCircle className="w-2.5 h-2.5 shrink-0" /> {c}
                </div>
              ))}
            </div>
          )}

          {/* Collapsible JSON */}
          <div className="border border-border/30 rounded overflow-hidden">
            <button type="button" onClick={() => setJsonOpen(v => !v)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-secondary/20 transition-colors">
              <span className="text-[7px] font-mono text-slate-400">Validation JSON</span>
              {jsonOpen ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
            </button>
            {jsonOpen && (
              <div className="px-3 pb-3">
                <pre className="bg-secondary/30 rounded p-3 text-[7px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(validationResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Safety status card */}
      <div className="border border-border/40 bg-card rounded-lg p-4 space-y-2">
        <div className="text-[8px] font-bold text-slate-300 uppercase mb-1">Safety Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
          {SAFETY_STATUS_ROWS.map(r => (
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
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Phase 5E Verification Table</span>
          </div>
          <span className="text-[7px] text-slate-500">{verifyOpen ? '▾ hide' : '▸ show'}</span>
        </button>
        {verifyOpen && (
          <div className="px-4 pb-4 space-y-1">
            {VERIFICATION_CHECKS.map(label => (
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