/**
 * BrowserObservationExecutionContractPreviewPanel — Local-only Phase 17 Contract Preview
 * Defines the minimum contract for future read-only browser observation execution.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { FileText, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

const KEYS = {
  phase15Lock: 'openclawBrowserObservationFinalLock',
  phase16Lock: 'openclawBrowserObservationProposalFinalLock',
  gate:        'openclawBrowserObservationReadinessGate',
  routePlan:   'openclawBrowserObservationRoutePlan',
};
const CONTRACT_KEY    = 'openclawBrowserObservationExecutionContractPreview';
const CONTRACT_NAME   = 'OPENCLAW_BROWSER_OBSERVATION_EXECUTION_CONTRACT_PREVIEW';
const PHASE_NAME      = 'PHASE_17_OBSERVATION_EXECUTION_CONTRACT_PREVIEW';
const CONTRACT_SCOPE  = 'READ_ONLY_OBSERVATION_CONTRACT_PREVIEW_ONLY';
const CONTRACT_STATUS = 'LOCAL_ONLY_CONTRACT_PREVIEW_READY';
const FINAL_WARNING   = 'This is a contract preview only. It does not authorize browser automation, OpenClaw calls, backend calls, clicking, typing, credential entry, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, or polling.';

const ALLOWED_EXECUTION_TYPES = [
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
  'OBSERVATION_EVIDENCE_RECORD',
];

const PROHIBITED_EXECUTION_TYPES = [
  'CLICK_ACTION',
  'TYPE_ACTION',
  'FORM_SUBMISSION',
  'CREDENTIAL_ENTRY',
  'PASSWORD_ENTRY',
  'API_KEY_ENTRY',
  'FILE_UPLOAD',
  'TRADE_ACTION',
  'BROKER_ACTION',
  'WALLET_ACTION',
  'MONEY_MOVEMENT',
  'COMMAND_DISPATCH',
  'AUTONOMOUS_BROWSER_CONTROL',
  'CLOUDFLARE_OR_LOGIN_BYPASS',
  'UNAUTHORIZED_PROTECTED_DATA_SCRAPE',
];

const REQUIRED_PRECONDITIONS = {
  phase15FinalLockRequired:                    true,
  phase16FinalLockRequired:                    true,
  readinessGateRequired:                       true,
  approvedProposalRequired:                    true,
  operatorReviewRequiredForSensitivePages:     true,
  executionLockMustRemainLocked:               true,
  dispatchMustRemainDisabled:                  true,
  credentialEntryMustRemainDisabled:           true,
  browserMutationMustRemainDisabled:           true,
  tradingAndMoneyMovementMustRemainDisabled:   true,
};

const EXECUTION_PAYLOAD_SHAPE = {
  requestId:              '<string: unique request identifier>',
  proposalId:             '<string: reference to approved proposal>',
  observationType:        '<string: one of allowedExecutionTypes>',
  targetUrl:              '<string: target URL>',
  selector:               '<string | null: CSS selector if applicable>',
  allowedReadOnlyFields:  '<array: fields permitted to read>',
  executionAllowed:       false,
  dispatchAllowed:        false,
  browserMutationAllowed: false,
  credentialEntryAllowed: false,
  safetyMode:             'READ_ONLY_OBSERVATION',
};

const RESPONSE_PAYLOAD_SHAPE = {
  requestId:                '<string: echoed from request>',
  observationId:            '<string: unique observation record ID>',
  status:                   '<string: SUCCESS | FAILED | BLOCKED>',
  observationType:          '<string: echoed from request>',
  targetUrl:                '<string: echoed from request>',
  readOnlyResult:           '<object: safe read-only observation data>',
  evidenceRecord:           '<object: immutable audit evidence record>',
  executionPerformed:       false,
  dispatchPerformed:        false,
  browserMutationPerformed: false,
  credentialEntryPerformed: false,
};

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  contractPreviewOnly:      true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noRealBrowserActions:     true,
  noClick:                  true,
  noTyping:                 true,
  noFormSubmit:             true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noScheduler:              true,
  noPolling:                true,
  noAutonomousControl:      true,
};

const PRECONDITION_LABELS = {
  phase15FinalLockRequired:                  'Phase 15 final lock required',
  phase16FinalLockRequired:                  'Phase 16 final lock required',
  readinessGateRequired:                     'Readiness gate required',
  approvedProposalRequired:                  'Approved proposal required',
  operatorReviewRequiredForSensitivePages:   'Operator review required for sensitive pages',
  executionLockMustRemainLocked:             'Execution lock must remain locked',
  dispatchMustRemainDisabled:                'Dispatch must remain disabled',
  credentialEntryMustRemainDisabled:         'Credential entry must remain disabled',
  browserMutationMustRemainDisabled:         'Browser mutation must remain disabled',
  tradingAndMoneyMovementMustRemainDisabled: 'Trading and money movement must remain disabled',
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function buildSourceLocksPresent() {
  return {
    phase15BrowserObservationFinalLockPresent:        !!localStorage.getItem(KEYS.phase15Lock),
    phase16BrowserObservationProposalFinalLockPresent: !!localStorage.getItem(KEYS.phase16Lock),
    readinessGatePresent:                              !!localStorage.getItem(KEYS.gate),
    routePlanPresent:                                  !!localStorage.getItem(KEYS.routePlan),
  };
}

function buildContract() {
  return {
    contractName:             CONTRACT_NAME,
    generatedAt:              new Date().toISOString(),
    phaseName:                PHASE_NAME,
    sourceLocksPresent:       buildSourceLocksPresent(),
    contractScope:            CONTRACT_SCOPE,
    allowedExecutionTypes:    ALLOWED_EXECUTION_TYPES,
    prohibitedExecutionTypes: PROHIBITED_EXECUTION_TYPES,
    requiredPreconditions:    REQUIRED_PRECONDITIONS,
    executionPayloadShape:    EXECUTION_PAYLOAD_SHAPE,
    responsePayloadShape:     RESPONSE_PAYLOAD_SHAPE,
    contractStatus:           CONTRACT_STATUS,
    safetyAssertions:         SAFETY_ASSERTIONS,
    finalWarning:             FINAL_WARNING,
  };
}

export default function BrowserObservationExecutionContractPreviewPanel() {
  const [contract, setContract] = useState(() => loadJSON(CONTRACT_KEY, null));
  const [copied, setCopied]     = useState(false);

  const sourceLocks    = buildSourceLocksPresent();
  const presentCount   = Object.values(sourceLocks).filter(Boolean).length;
  const totalCount     = Object.keys(sourceLocks).length;

  const SOURCE_LOCK_LABELS = {
    phase15BrowserObservationFinalLockPresent:         'Phase 15 Final Lock',
    phase16BrowserObservationProposalFinalLockPresent: 'Phase 16 Final Lock',
    readinessGatePresent:                              'Readiness Gate',
    routePlanPresent:                                  'Route Plan',
  };

  const handleGenerate = () => {
    const result = buildContract();
    try { localStorage.setItem(CONTRACT_KEY, JSON.stringify(result, null, 2)); } catch {}
    setContract(result);
  };

  const handleCopy = () => {
    if (!contract) return;
    navigator.clipboard.writeText(JSON.stringify(contract, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(CONTRACT_KEY); } catch {}
    setContract(null);
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 17 · Observation Execution Contract Preview</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Observation Execution Contract Preview
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only contract preview. Defines minimum contract for future real observation bridge. No execution, no automation, no backend calls.</div>
      </div>

      {/* Contract name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{CONTRACT_NAME}</span>
        </div>
        <span className="text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider text-primary border-primary/30 bg-primary/5">
          {CONTRACT_STATUS}
        </span>
      </div>

      {/* Source lock presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Locks — {presentCount}/{totalCount} Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(SOURCE_LOCK_LABELS).map(([key, label]) => {
            const present = sourceLocks[key];
            return (
              <div key={key} className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${present ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
                {present
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <div>
                  <div className={`text-[9px] font-semibold ${present ? 'text-primary' : 'text-slate-500'}`}>{label}</div>
                  <div className={`text-[7px] uppercase font-bold tracking-wider ${present ? 'text-primary/70' : 'text-slate-600'}`}>{present ? 'PRESENT' : 'MISSING'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allowed / Prohibited types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Allowed */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-primary/5 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">Allowed Execution Types ({ALLOWED_EXECUTION_TYPES.length})</span>
          </div>
          <div className="divide-y divide-border/30">
            {ALLOWED_EXECUTION_TYPES.map(t => (
              <div key={t} className="flex items-center gap-2 px-4 py-2">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] font-mono text-slate-300">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-destructive/5 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-destructive font-semibold">Prohibited Execution Types ({PROHIBITED_EXECUTION_TYPES.length})</span>
          </div>
          <div className="divide-y divide-border/30">
            {PROHIBITED_EXECUTION_TYPES.map(t => (
              <div key={t} className="flex items-center gap-2 px-4 py-2">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[8px] font-mono text-slate-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Required preconditions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Preconditions ({Object.keys(REQUIRED_PRECONDITIONS).length})</span>
        </div>
        <div className="divide-y divide-border/30">
          {Object.entries(REQUIRED_PRECONDITIONS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 px-4 py-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[9px] text-slate-300 flex-1">{PRECONDITION_LABELS[key] ?? key}</span>
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">
                {String(value).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payload shapes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Execution Payload Shape</span>
          </div>
          <pre className="px-4 py-3 text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
            {JSON.stringify(EXECUTION_PAYLOAD_SHAPE, null, 2)}
          </pre>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Response Payload Shape</span>
          </div>
          <pre className="px-4 py-3 text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
            {JSON.stringify(RESPONSE_PAYLOAD_SHAPE, null, 2)}
          </pre>
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <FileText className="w-3.5 h-3.5" />
          Generate Execution Contract Preview
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!contract}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Contract Preview JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!contract}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Contract Preview
        </button>
      </div>

      {/* JSON preview */}
      {contract && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Contract Preview — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(contract.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(contract, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{CONTRACT_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}