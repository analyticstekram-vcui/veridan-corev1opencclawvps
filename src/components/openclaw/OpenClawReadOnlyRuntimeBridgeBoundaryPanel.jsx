/**
 * OpenClawReadOnlyRuntimeBridgeBoundaryPanel — Phase 28 Boundary Definition
 * Defines the exact first permitted read-only runtime bridge boundary.
 * No bridge activation, no execution, no dispatch, no credentials, no trading.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const BOUNDARY_KEY = 'openclawReadOnlyRuntimeBridgeBoundaryDefinition';

const ALLOWED_OBSERVATION_TYPES = [
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
  'OBSERVATION_EVIDENCE_RECORD',
];

const PROHIBITED_RUNTIME_ACTIONS = [
  'clicking',
  'typing',
  'form submission',
  'credential entry',
  'password entry',
  'API key entry',
  'file upload',
  'trading',
  'broker actions',
  'wallet actions',
  'money movement',
  'command dispatch',
  'autonomous browser control',
  'bypassing Cloudflare or login walls',
  'scraping protected data without authorization',
  'OpenClaw runtime activation',
  'external forwarding without separate approval',
];

const REQUIRED_INPUTS = [
  'requestId',
  'proposalId',
  'observationType',
  'targetUrl',
  'selector',
  'allowedReadOnlyFields',
  'approvalStatus',
  'safetyMode',
  'operatorId',
  'sourceLockId',
];

const REQUIRED_PRECONDITIONS = [
  'Phase 27 checkpoint present',
  'Phase 26 final lock present',
  'Phase 26 lockStatus equals LOCK_READY',
  'Phase 27 checkpoint status indicates ready or complete',
  'request must be read-only',
  'request must use allowed observation type only',
  'executionAllowed must be false',
  'dispatchAllowed must be false',
  'browserMutationAllowed must be false',
  'credentialEntryAllowed must be false',
  'tradingAllowed must be false',
  'moneyMovementAllowed must be false',
  'separate runtime activation approval still required',
];

const REQUIRED_RESPONSE_FIELDS = [
  'requestId',
  'boundaryValidationId',
  'observationType',
  'targetUrl',
  'boundaryStatus',
  'sanitizedPayloadPreview',
  'safetyGateResults',
  'executionPerformed: false',
  'dispatchPerformed: false',
  'browserMutationPerformed: false',
  'credentialEntryPerformed: false',
  'openClawCalled: false',
  'backendForwarded: false',
  'runtimeBridgeActivated: false',
];

const AUTHORIZATION_FLAGS = {
  runtimeBridgeActivationAllowed: false,
  openClawCallAllowed: false,
  backendForwardingAllowed: false,
  browserAutomationAllowed: false,
  realBrowserActionAllowed: false,
  executionAllowed: false,
  dispatchAllowed: false,
  credentialEntryAllowed: false,
  tradingAllowed: false,
  brokerActionAllowed: false,
  walletActionAllowed: false,
  moneyMovementAllowed: false,
};

const SAFETY_ASSERTIONS = {
  localOnly: true,
  boundaryDefinitionOnly: true,
  previewOnly: true,
  readOnly: true,
  noRuntimeBridgeActivation: true,
  noOpenClawCalls: true,
  noBackendForwarding: true,
  noBrowserAutomationApis: true,
  noRealBrowserActions: true,
  noClick: true,
  noTyping: true,
  noCredentialEntry: true,
  noTrading: true,
  noBrokerActions: true,
  noWalletActions: true,
  noMoneyMovement: true,
  noCommandDispatch: true,
  noScheduler: true,
  noPolling: true,
  separateApprovalRequiredForRuntime: true,
};

const FINAL_WARNING = 'This boundary definition is local-only, preview-only, read-only, and does not authorize OpenClaw calls, runtime bridge activation, backend forwarding, browser automation, execution, dispatch, credentials, trading, broker actions, wallet actions, money movement, or external forwarding. Separate approval required for runtime bridge activation.';

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function generateBoundaryDefinition() {
  const phase27Checkpoint = loadJSON('openclawGovernanceCheckpointIndex', null);
  const phase26FinalLock = loadJSON('openclawRuntimeBridgeImplementationPlanReviewFinalLock', null);

  const boundaryChecks = {
    phase27CheckpointPresent: !!phase27Checkpoint,
    phase26FinalLockPresent: !!phase26FinalLock,
    phase26LockReady: phase26FinalLock?.lockStatus === 'LOCK_READY',
    boundaryScopeDefinitionOnly: true,
    allowedTypesDefined: ALLOWED_OBSERVATION_TYPES.length > 0,
    prohibitedActionsDefined: PROHIBITED_RUNTIME_ACTIONS.length > 0,
    requiredInputsDefined: REQUIRED_INPUTS.length > 0,
    requiredPreconditionsDefined: REQUIRED_PRECONDITIONS.length > 0,
    requiredResponseFieldsDefined: REQUIRED_RESPONSE_FIELDS.length > 0,
    authorizationFlagsAllFalse: Object.values(AUTHORIZATION_FLAGS).every(v => v === false),
    noRuntimeBridgeActivationAuthorized: true,
    noOpenClawCallsAuthorized: true,
    noBackendForwardingAuthorized: true,
    noBrowserAutomationAuthorized: true,
    noExecutionAuthorized: true,
    noCredentialUseAuthorized: true,
    noTradingOrMoneyMovementAuthorized: true,
    separateRuntimeApprovalRequired: true,
  };

  let boundaryDecision;
  const hasAnyAuthorizationTrue = Object.values(AUTHORIZATION_FLAGS).some(v => v === true);
  if (hasAnyAuthorizationTrue) {
    boundaryDecision = 'BLOCKED_BY_POLICY';
  } else if (Object.values(boundaryChecks).every(Boolean)) {
    boundaryDecision = 'BOUNDARY_READY';
  } else {
    boundaryDecision = 'HOLD_FOR_REVIEW';
  }

  return {
    boundaryName: 'OPENCLAW_READ_ONLY_RUNTIME_BRIDGE_BOUNDARY',
    generatedAt: new Date().toISOString(),
    phaseName: 'PHASE_28_READ_ONLY_RUNTIME_BRIDGE_BOUNDARY_DEFINITION',
    sourcePhase27CheckpointPresent: !!phase27Checkpoint,
    sourcePhase26FinalLockPresent: !!phase26FinalLock,
    phase27CheckpointStatus: phase27Checkpoint?.highestLockStatus ?? null,
    phase26LockStatus: phase26FinalLock?.lockStatus ?? null,
    boundaryScope: 'READ_ONLY_RUNTIME_BRIDGE_BOUNDARY_DEFINITION_ONLY',
    firstAllowedRuntimeIntent: 'VALIDATE_AND_PREPARE_READ_ONLY_OBSERVATION_REQUEST_ONLY',
    allowedObservationTypes: ALLOWED_OBSERVATION_TYPES,
    prohibitedRuntimeActions: PROHIBITED_RUNTIME_ACTIONS,
    requiredInputs: REQUIRED_INPUTS,
    requiredPreconditions: REQUIRED_PRECONDITIONS,
    requiredResponseFields: REQUIRED_RESPONSE_FIELDS,
    boundaryChecks,
    boundaryDecision,
    authorizationFlags: AUTHORIZATION_FLAGS,
    safetyAssertions: SAFETY_ASSERTIONS,
    finalWarning: FINAL_WARNING,
  };
}

export default function OpenClawReadOnlyRuntimeBridgeBoundaryPanel() {
  const [boundary, setBoundary] = useState(() => loadJSON(BOUNDARY_KEY, null));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const phase27Checkpoint = loadJSON('openclawGovernanceCheckpointIndex', null);
  const phase26FinalLock = loadJSON('openclawRuntimeBridgeImplementationPlanReviewFinalLock', null);

  const handleGenerate = () => {
    try {
      const result = generateBoundaryDefinition();
      try { localStorage.setItem(BOUNDARY_KEY, JSON.stringify(result, null, 2)); } catch {}
      setBoundary(result);
      setLastAction('Boundary definition generated locally at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Boundary generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!boundary) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(boundary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Boundary JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(BOUNDARY_KEY);
      setBoundary(null);
      setLastAction('Boundary definition cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const statusCfg = boundary
    ? boundary.boundaryDecision === 'BOUNDARY_READY'
      ? { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', badge: 'text-primary border-primary/30 bg-primary/5' }
      : boundary.boundaryDecision === 'BLOCKED_BY_POLICY'
        ? { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5' }
        : { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' }
    : null;

  const checksPassCount = boundary ? Object.values(boundary.boundaryChecks).filter(Boolean).length : null;
  const checksTotal = boundary ? Object.keys(boundary.boundaryChecks).length : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 28 · Read-Only Runtime Bridge Boundary Definition</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Read-Only Runtime Bridge Boundary Definition
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only boundary definition for first permitted read-only runtime bridge observation. No execution, no dispatch, no credentials, no trading, no bridge activation.</div>
      </div>

      {/* Boundary name chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">OPENCLAW_READ_ONLY_RUNTIME_BRIDGE_BOUNDARY</span>
      </div>

      {/* Source packet presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Required Source Packets — {[!!phase27Checkpoint, !!phase26FinalLock].filter(Boolean).length}/2 Present
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${!!phase27Checkpoint ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
            {!!phase27Checkpoint ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <div>
              <div className={`text-[9px] font-semibold ${!!phase27Checkpoint ? 'text-primary' : 'text-slate-500'}`}>Phase 27 Checkpoint</div>
              <div className={`text-[7px] uppercase font-bold tracking-wider ${!!phase27Checkpoint ? 'text-primary/70' : 'text-slate-600'}`}>{!!phase27Checkpoint ? 'PRESENT' : 'MISSING'}</div>
            </div>
          </div>
          <div className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${!!phase26FinalLock ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
            {!!phase26FinalLock ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <div>
              <div className={`text-[9px] font-semibold ${!!phase26FinalLock ? 'text-primary' : 'text-slate-500'}`}>Phase 26 Final Lock</div>
              <div className={`text-[7px] uppercase font-bold tracking-wider ${!!phase26FinalLock ? 'text-primary/70' : 'text-slate-600'}`}>{!!phase26FinalLock ? 'PRESENT' : 'MISSING'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Boundary decision (large) — only when generated */}
      {boundary && statusCfg && (
        <div className={`border rounded-lg p-4 flex items-center gap-3 ${statusCfg.bg}`}>
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Boundary Decision</div>
            <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${statusCfg.color}`}>{boundary.boundaryDecision}</div>
            <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{boundary.phaseName}</div>
          </div>
        </div>
      )}

      {/* Allowed observation types */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Allowed Observation Types</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {ALLOWED_OBSERVATION_TYPES.map(type => (
            <div key={type} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prohibited runtime actions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Prohibited Runtime Actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {PROHIBITED_RUNTIME_ACTIONS.map(action => (
            <div key={action} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required inputs */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Inputs</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {REQUIRED_INPUTS.map(input => (
            <div key={input} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{input}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required preconditions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Preconditions</span>
        </div>
        <div className="space-y-0">
          {REQUIRED_PRECONDITIONS.map((cond, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-border/20 last:border-b-0">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-[8px] text-slate-300">{cond}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required response fields */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Response Fields</span>
        </div>
        <div className="space-y-0">
          {REQUIRED_RESPONSE_FIELDS.map((field, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-border/20 last:border-b-0">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-[8px] text-slate-300 font-mono">{field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Boundary checks table */}
      {boundary && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Boundary Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPassCount === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : boundary.boundaryDecision === 'BLOCKED_BY_POLICY'
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(boundary.boundaryChecks).map(([key, value]) => {
              const blocked = boundary.boundaryDecision === 'BLOCKED_BY_POLICY' && !value;
              const Icon = value ? CheckCircle2 : blocked ? XCircle : Clock;
              const color = value ? 'text-primary' : blocked ? 'text-destructive' : 'text-amber-500';
              const badge = value
                ? 'text-primary border-primary/30 bg-primary/5'
                : blocked
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5';
              const label = value ? 'PASS' : blocked ? 'BLOCKED' : 'HOLD';
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                  <span className="text-[9px] text-slate-300 flex-1">{key}</span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Authorization flags */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Authorization Flags — All FALSE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(AUTHORIZATION_FLAGS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-destructive font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-primary font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Final warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Final Warning: </span>{FINAL_WARNING}
        </p>
      </div>

      {/* Last action feedback */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Boundary Definition
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!boundary}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Boundary JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!boundary}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Boundary Definition
        </button>
      </div>

      {/* JSON preview */}
      {boundary && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Boundary Definition — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(boundary.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(boundary, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{BOUNDARY_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only boundary definition. No OpenClaw calls, no bridge activation, no execution, no dispatch, no credentials, no trading, no money movement.
      </div>
    </div>
  );
}