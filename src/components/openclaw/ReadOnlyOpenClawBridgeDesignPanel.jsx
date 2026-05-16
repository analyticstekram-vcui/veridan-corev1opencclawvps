/**
 * ReadOnlyOpenClawBridgeDesignPanel — Phase 20 Read-Only OpenClaw Bridge Design
 * Defines bridge contract and safety gates locally. No OpenClaw calls, no browser automation.
 */
import React, { useState } from 'react';
import { Zap, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

const KEYS = {
  phase17Lock:           'openclawBrowserObservationExecutionContractFinalLock',
  phase18Lock:           'openclawBrowserObservationContractValidatorFinalLock',
  phase19Ledger:         'openclawBrowserObservationDryRunAuditLedger',
  phase16ProposalLock:   'openclawBrowserObservationProposalFinalLock',
};
const DESIGN_KEY        = 'openclawReadOnlyOpenClawBridgeDesign';
const DESIGN_NAME       = 'OPENCLAW_READ_ONLY_BRIDGE_DESIGN';
const PHASE_NAME        = 'PHASE_20_READ_ONLY_OPENCLAW_BRIDGE_DESIGN';
const BRIDGE_SCOPE      = 'DESIGN_ONLY_NO_RUNTIME_BRIDGE';
const DESIGN_STATUS     = 'LOCAL_ONLY_BRIDGE_DESIGN_READY';
const FINAL_WARNING     = 'This is a bridge design only. It does not authorize OpenClaw calls, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or runtime bridge activation.';

const ALLOWED_BRIDGE_OPERATIONS = [
  'validate read-only observation request',
  'check final locks are present',
  'verify proposal approval status',
  'verify dry-run audit exists',
  'prepare sanitized OpenClaw read-only observation payload',
  'receive sanitized read-only result',
  'record observation evidence locally',
  'return non-executable response',
];

const PROHIBITED_BRIDGE_OPERATIONS = [
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
  'bypassing Cloudflare/login walls',
  'scraping protected data without authorization',
  'runtime bridge activation without final approval',
];

const REQUIRED_INPUTS = [
  'requestId',
  'proposalId',
  'observationType',
  'targetUrl',
  'selector',
  'allowedReadOnlyFields',
  'approvalStatus',
  'dryRunValidationId',
  'auditId',
];

const REQUIRED_SAFETY_GATES = [
  'phase17FinalLockRequired',
  'phase18FinalLockRequired',
  'phase19AuditRecordRequired',
  'phase16ProposalLockRequired',
  'approvedProposalRequired',
  'validatorMustReturnValidDryRun',
  'auditMustBeReady',
  'executionMustRemainDisabled',
  'dispatchMustRemainDisabled',
  'browserMutationMustRemainDisabled',
  'credentialEntryMustRemainDisabled',
  'tradingAndMoneyMovementMustRemainDisabled',
];

const REQUIRED_EVIDENCE_OUTPUTS = [
  'bridgeRequestId',
  'observationId',
  'sanitizedPayload',
  'sanitizedResult',
  'safetyGateResults',
  'evidenceRecord',
  'executionPerformed: false',
  'dispatchPerformed: false',
  'browserMutationPerformed: false',
  'credentialEntryPerformed: false',
  'openClawCalled: false',
];

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  designOnly:              true,
  previewOnly:             true,
  readOnly:                true,
  noRuntimeBridge:         true,
  noOpenClawCalls:         true,
  noBackendForwarding:     true,
  noBrowserAutomationApis: true,
  noRealBrowserActions:    true,
  noClick:                 true,
  noTyping:                true,
  noFormSubmit:            true,
  noCredentialEntry:       true,
  noTrading:               true,
  noBrokerActions:         true,
  noWalletActions:         true,
  noMoneyMovement:         true,
  noCommandDispatch:       true,
  noScheduler:             true,
  noPolling:               true,
  noAutonomousControl:     true,
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function buildDesign() {
  const phase17Lock      = loadJSON(KEYS.phase17Lock, null);
  const phase18Lock      = loadJSON(KEYS.phase18Lock, null);
  const phase19Ledger    = loadJSON(KEYS.phase19Ledger, []);
  const phase16ProposalLock = loadJSON(KEYS.phase16ProposalLock, null);

  const sourceLocksPresent = {
    phase17ContractLockPresent: !!phase17Lock,
    phase18ValidatorLockPresent: !!phase18Lock,
    phase19AuditLedgerPresent: Array.isArray(phase19Ledger) && phase19Ledger.length > 0,
    phase16ProposalLockPresent: !!phase16ProposalLock,
  };

  return {
    designName:               DESIGN_NAME,
    generatedAt:              new Date().toISOString(),
    phaseName:                PHASE_NAME,
    sourceLocksPresent,
    bridgeScope:              BRIDGE_SCOPE,
    allowedBridgeOperations:  ALLOWED_BRIDGE_OPERATIONS,
    prohibitedBridgeOperations: PROHIBITED_BRIDGE_OPERATIONS,
    requiredInputs:           REQUIRED_INPUTS,
    requiredSafetyGates:      REQUIRED_SAFETY_GATES,
    requiredEvidenceOutputs:  REQUIRED_EVIDENCE_OUTPUTS,
    bridgeDesignStatus:       DESIGN_STATUS,
    safetyAssertions:         SAFETY_ASSERTIONS,
    finalWarning:             FINAL_WARNING,
  };
}

export default function ReadOnlyOpenClawBridgeDesignPanel() {
  const [design, setDesign]   = useState(() => loadJSON(DESIGN_KEY, null));
  const [copied, setCopied]   = useState(false);

  const phase17Present    = !!localStorage.getItem(KEYS.phase17Lock);
  const phase18Present    = !!localStorage.getItem(KEYS.phase18Lock);
  const phase19Present    = Array.isArray(loadJSON(KEYS.phase19Ledger, [])) && loadJSON(KEYS.phase19Ledger, []).length > 0;
  const phase16Present    = !!localStorage.getItem(KEYS.phase16ProposalLock);

  const handleGenerate = () => {
    const result = buildDesign();
    try { localStorage.setItem(DESIGN_KEY, JSON.stringify(result, null, 2)); } catch {}
    setDesign(result);
  };

  const handleCopy = () => {
    if (!design) return;
    navigator.clipboard.writeText(JSON.stringify(design, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(DESIGN_KEY); } catch {}
    setDesign(null);
  };

  const sourceLocks    = [
    { label: 'Phase 17 Contract Lock', present: phase17Present },
    { label: 'Phase 18 Validator Lock', present: phase18Present },
    { label: 'Phase 19 Audit Ledger', present: phase19Present },
    { label: 'Phase 16 Proposal Lock', present: phase16Present },
  ];
  const presentCount   = sourceLocks.filter(s => s.present).length;
  const totalCount     = sourceLocks.length;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 20 · Read-Only Bridge Design</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Read-Only OpenClaw Bridge Design
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 20 bridge design. Defines contract and safety gates. No runtime bridge, no OpenClaw calls, no browser automation.</div>
      </div>

      {/* Design name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{DESIGN_NAME}</span>
        </div>
        <span className="text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider text-primary border-primary/30 bg-primary/5">
          {DESIGN_STATUS}
        </span>
      </div>

      {/* Source locks presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Locks — {presentCount}/{totalCount} Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sourceLocks.map(({ label, present }) => (
            <div key={label} className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${present ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
              {present
                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              <div>
                <div className={`text-[9px] font-semibold ${present ? 'text-primary' : 'text-slate-500'}`}>{label}</div>
                <div className={`text-[7px] uppercase font-bold tracking-wider ${present ? 'text-primary/70' : 'text-slate-600'}`}>{present ? 'PRESENT' : 'MISSING'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allowed / Prohibited operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Allowed */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-primary/5 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">Allowed Bridge Operations ({ALLOWED_BRIDGE_OPERATIONS.length})</span>
          </div>
          <div className="divide-y divide-border/30">
            {ALLOWED_BRIDGE_OPERATIONS.map(op => (
              <div key={op} className="flex items-center gap-2 px-4 py-2">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] text-slate-300">{op}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-destructive/5 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-destructive font-semibold">Prohibited Bridge Operations ({PROHIBITED_BRIDGE_OPERATIONS.length})</span>
          </div>
          <div className="divide-y divide-border/30">
            {PROHIBITED_BRIDGE_OPERATIONS.map(op => (
              <div key={op} className="flex items-center gap-2 px-4 py-2">
                <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[8px] text-slate-400">{op}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Required inputs */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Inputs ({REQUIRED_INPUTS.length})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {REQUIRED_INPUTS.map(input => (
            <div key={input} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <ArrowRight className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{input}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required safety gates */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Safety Gates ({REQUIRED_SAFETY_GATES.length})</span>
        </div>
        <div className="divide-y divide-border/30">
          {REQUIRED_SAFETY_GATES.map(gate => (
            <div key={gate} className="flex items-center gap-3 px-4 py-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[9px] text-slate-300">{gate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required evidence outputs */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Evidence Outputs ({REQUIRED_EVIDENCE_OUTPUTS.length})</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {REQUIRED_EVIDENCE_OUTPUTS.map(output => (
            <div key={output} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{output}</span>
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Zap className="w-3.5 h-3.5" />
          Generate Read-Only Bridge Design
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!design}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Bridge Design JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!design}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Bridge Design
        </button>
      </div>

      {/* JSON preview */}
      {design && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Bridge Design — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(design.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(design, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{DESIGN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No OpenClaw calls. No backend forwarding. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}