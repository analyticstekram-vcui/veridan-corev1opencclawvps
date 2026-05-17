/**
 * OpenClawRuntimeBridgeRequestContractPreview — Phase 29
 * Defines the structure of a future runtime bridge request without executing anything.
 * Local-only, preview-only, read-only governance panel.
 * No fetch, no API calls, no execution, no dispatch, no credentials, no trading.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';

const STORAGE_KEY = 'openclawPhase29RuntimeBridgeRequestContracts';

const ALLOWED_COMMAND_TYPES = ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const ALLOWED_RISK_TIERS = ['LOW', 'MEDIUM'];

const SAFETY_ASSERTIONS = {
  localOnly: true,
  previewOnly: true,
  readOnly: true,
  noLiveExecution: true,
  noApiTrading: true,
  noCredentialEntry: true,
  noMoneyMovement: true,
  noScheduler: true,
  noPolling: true,
  noBridgeDispatch: true,
  noBrowserAutomation: true,
  noWalletActions: true,
  noBrokerActions: true,
};

const EXECUTION_FLAGS = {
  executionAllowed: false,
  dispatchAllowed: false,
  browserMutationAllowed: false,
  credentialEntryAllowed: false,
  tradingAllowed: false,
  brokerActionAllowed: false,
  walletActionAllowed: false,
  moneyMovementAllowed: false,
  schedulerAllowed: false,
  pollingAllowed: false,
};

function generatePreviewContract() {
  const now = new Date().toISOString();
  return {
    contractId: `phase29-contract-${Date.now()}`,
    contractType: 'PHASE_29_RUNTIME_BRIDGE_REQUEST_CONTRACT_PREVIEW',
    generatedAt: now,
    phaseName: 'PHASE_29_RUNTIME_BRIDGE_REQUEST_CONTRACT_PREVIEW',
    requestId: `req-${Date.now()}`,
    operatorId: 'operator@example.com',
    commandType: 'READ',
    targetModule: 'gateway.readOnlyBridge',
    riskTier: 'LOW',
    approvalRequired: true,
    executionAllowed: false,
    dryRunOnly: true,
    sourceBoundaryPhase: 'PHASE_28_READ_ONLY_RUNTIME_BRIDGE_BOUNDARY_DEFINITION',
    createdAt: now,
    policyFlags: {
      allowedCommandTypes: ALLOWED_COMMAND_TYPES,
      allowedRiskTiers: ALLOWED_RISK_TIERS,
      executionAllowed: false,
      dryRunOnly: true,
      approvalRequired: true,
    },
    safetyAssertions: SAFETY_ASSERTIONS,
    executionFlags: EXECUTION_FLAGS,
    finalWarning: 'This is a preview-only contract definition. No execution, API calls, trading, credentials, scheduler, polling, or dispatch logic is active or authorized.',
  };
}

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function OpenClawRuntimeBridgeRequestContractPreview() {
  const [contracts, setContracts] = useState(() => loadJSON(STORAGE_KEY, []));
  const [latestContract, setLatestContract] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleGenerate = () => {
    try {
      const newContract = generatePreviewContract();
      const updated = [newContract, ...contracts].slice(0, 50); // Keep latest 50
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setContracts(updated);
      setLatestContract(newContract);
      setLastAction('Preview contract generated locally at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Contract generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!latestContract) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestContract, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Preview contract JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setContracts([]);
      setLatestContract(null);
      setLastAction('All preview contracts cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 29 · Runtime Bridge Request Contract</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Runtime Bridge Request Contract Preview
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only preview of future runtime bridge request contract structure. No execution, no API calls, no trading, no credentials, no bridge dispatch.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_29_RUNTIME_BRIDGE_REQUEST_CONTRACT_PREVIEW</span>
      </div>

      {/* Contract structure info */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Contract Structure</span>
        </div>
        <div className="space-y-1 px-4 py-3">
          <div className="text-[8px] text-slate-300 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">requestId:</span>
              <span className="text-primary">Unique request identifier</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">operatorId:</span>
              <span className="text-primary">Operator email/identifier</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">commandType:</span>
              <span className="text-primary">READ | NAVIGATE | EXTRACT | VERIFY only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">targetModule:</span>
              <span className="text-primary">Target system module</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">riskTier:</span>
              <span className="text-primary">LOW | MEDIUM only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">executionAllowed:</span>
              <span className="text-destructive font-bold">Always false</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">dryRunOnly:</span>
              <span className="text-destructive font-bold">Always true</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">approvalRequired:</span>
              <span className="text-destructive font-bold">Always true</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">sourceBoundaryPhase:</span>
              <span className="text-primary">PHASE_28 reference</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allowed command types */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Allowed Command Types</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
          {ALLOWED_COMMAND_TYPES.map(cmd => (
            <div key={cmd} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{cmd}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Allowed risk tiers */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Allowed Risk Tiers</span>
        </div>
        <div className="grid grid-cols-2 gap-0">
          {ALLOWED_RISK_TIERS.map(tier => (
            <div key={tier} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution flags — all FALSE */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Execution Flags — All FALSE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(EXECUTION_FLAGS).map(([k, v]) => (
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
          <span className="font-bold">Final Warning: </span>This is a preview-only contract definition. No execution, API calls, trading, credentials, scheduler, polling, or bridge dispatch logic is active or authorized.
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
          <FileText className="w-3.5 h-3.5" />
          Generate Preview Contract
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestContract}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Contract JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={contracts.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Contracts
        </button>
      </div>

      {/* Contract history */}
      {contracts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Generated Contracts ({contracts.length})</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {contracts.map((contract, i) => (
              <div key={i} className="px-4 py-2.5 border-b border-border/20 last:border-b-0 text-[8px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono">{contract.contractId}</span>
                  <span className="text-slate-500 text-[7px]">{new Date(contract.generatedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Command:</span>
                  <span className="text-primary font-mono">{contract.commandType}</span>
                  <span className="text-slate-500">Risk:</span>
                  <span className="text-primary font-mono">{contract.riskTier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON preview */}
      {latestContract && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Preview Contract — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestContract.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestContract, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{STORAGE_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Preview-only, local-only. No execution, API calls, trading, credentials, scheduler, polling, or dispatch.
      </div>
    </div>
  );
}