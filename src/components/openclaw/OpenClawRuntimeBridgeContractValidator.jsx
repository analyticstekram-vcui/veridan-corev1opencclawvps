/**
 * OpenClawRuntimeBridgeContractValidator — Phase 30
 * Validates Phase 29 runtime bridge request contracts locally.
 * Local-only, preview-only, no OpenClaw calls, no backend calls, no execution.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';

const CONTRACTS_KEY = 'openclawPhase29RuntimeBridgeRequestContracts';
const RESULTS_KEY = 'openclawPhase30RuntimeBridgeContractValidationResults';

const ALLOWED_COMMAND_TYPES = ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const ALLOWED_RISK_TIERS = ['LOW', 'MEDIUM'];

const PROHIBITED_POLICY_FLAGS = [
  'executionAllowed',
  'tradingAllowed',
  'credentialEntryAllowed',
  'schedulerAllowed',
  'pollingAllowed',
  'dispatchAllowed',
  'brokerActionAllowed',
  'walletActionAllowed',
  'moneyMovementAllowed',
];

const REQUIRED_SAFETY_ASSERTIONS = [
  'localOnly',
  'previewOnly',
  'readOnly',
  'noLiveExecution',
  'noApiTrading',
  'noCredentialEntry',
  'noMoneyMovement',
  'noScheduler',
  'noPolling',
  'noBridgeDispatch',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function validateContract(contract) {
  const failureReasons = [];

  // Check required fields
  if (!contract.requestId) failureReasons.push('Missing requestId');
  if (!contract.operatorId) failureReasons.push('Missing operatorId');

  // Check commandType
  if (!ALLOWED_COMMAND_TYPES.includes(contract.commandType)) {
    failureReasons.push(`Invalid commandType: ${contract.commandType} (must be one of ${ALLOWED_COMMAND_TYPES.join(', ')})`);
  }

  // Check riskTier
  if (!ALLOWED_RISK_TIERS.includes(contract.riskTier)) {
    failureReasons.push(`Invalid riskTier: ${contract.riskTier} (must be one of ${ALLOWED_RISK_TIERS.join(', ')})`);
  }

  // Check execution flags
  if (contract.executionAllowed !== false) {
    failureReasons.push('executionAllowed must be false');
  }
  if (contract.dryRunOnly !== true) {
    failureReasons.push('dryRunOnly must be true');
  }
  if (contract.approvalRequired !== true) {
    failureReasons.push('approvalRequired must be true');
  }

  // Check boundary phase reference
  if (!contract.sourceBoundaryPhase || !contract.sourceBoundaryPhase.includes('PHASE_28')) {
    failureReasons.push('sourceBoundaryPhase must reference PHASE_28');
  }

  // Check policyFlags
  if (contract.policyFlags) {
    PROHIBITED_POLICY_FLAGS.forEach(flag => {
      if (contract.policyFlags[flag] === true) {
        failureReasons.push(`policyFlags.${flag} must not be true`);
      }
    });
  }

  // Check safetyAssertions
  let safetyLockStatus = 'LOCKED';
  if (contract.safetyAssertions) {
    REQUIRED_SAFETY_ASSERTIONS.forEach(assertion => {
      if (contract.safetyAssertions[assertion] !== true) {
        failureReasons.push(`safetyAssertions.${assertion} must be true`);
        safetyLockStatus = 'BROKEN';
      }
    });
  } else {
    failureReasons.push('Missing safetyAssertions');
    safetyLockStatus = 'BROKEN';
  }

  return {
    validationId: `validation-${contract.contractId}-${Date.now()}`,
    sourceRequestId: contract.requestId,
    sourceContractId: contract.contractId,
    validatedAt: new Date().toISOString(),
    validationStatus: failureReasons.length === 0 ? 'PASS' : 'FAIL',
    failureReasons,
    safetyLockStatus,
    executionStatus: 'NOT_EXECUTED',
  };
}

export default function OpenClawRuntimeBridgeContractValidator() {
  const [contracts, setContracts] = useState(() => loadJSON(CONTRACTS_KEY, []));
  const [results, setResults] = useState(() => loadJSON(RESULTS_KEY, []));
  const [expandedFailure, setExpandedFailure] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleValidate = () => {
    try {
      const freshContracts = loadJSON(CONTRACTS_KEY, []);
      setContracts(freshContracts);

      const validationBatch = {
        batchId: `batch-${Date.now()}`,
        batchType: 'PHASE_30_CONTRACT_VALIDATION_BATCH',
        validatedAt: new Date().toISOString(),
        totalContracts: freshContracts.length,
        validationResults: freshContracts.map(contract => validateContract(contract)),
      };

      // Calculate summary
      const passCount = validationBatch.validationResults.filter(r => r.validationStatus === 'PASS').length;
      const failCount = validationBatch.validationResults.filter(r => r.validationStatus === 'FAIL').length;
      validationBatch.passCount = passCount;
      validationBatch.failCount = failCount;
      validationBatch.overallStatus = failCount === 0 ? 'ALL_PASS' : 'SOME_FAILED';

      const updated = [validationBatch, ...results].slice(0, 50); // Keep latest 50 batches
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(updated));
      } catch {}

      setResults(updated);
      setLastAction('Contracts validated locally at ' + new Date().toLocaleString());
    } catch (err) {
      setLastAction('Validation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(results[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest validation batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(RESULTS_KEY);
      setResults([]);
      setLastAction('All validation results cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = results.length > 0 ? results[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 30 · Runtime Bridge Contract Validator</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Runtime Bridge Contract Validator
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only validator for Phase 29 runtime bridge request contracts. No OpenClaw calls, no backend calls, no execution.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_30_RUNTIME_BRIDGE_CONTRACT_VALIDATOR</span>
      </div>

      {/* Validation summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Contracts</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalContracts}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Passed</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.passCount}</div>
          </div>
          <div className={`bg-card border ${latestBatch.failCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Failed</div>
            <div className={`text-[18px] font-bold ${latestBatch.failCount > 0 ? 'text-destructive' : 'text-primary'}`}>{latestBatch.failCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Status</div>
            <div className={`text-[12px] font-bold ${latestBatch.overallStatus === 'ALL_PASS' ? 'text-primary' : 'text-amber-500'}`}>
              {latestBatch.overallStatus === 'ALL_PASS' ? 'ALL PASS' : 'SOME FAILED'}
            </div>
          </div>
        </div>
      )}

      {/* Validation rules */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Rules</span>
        </div>
        <div className="space-y-0.5 px-4 py-3">
          <div className="text-[8px] text-slate-300 space-y-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>requestId exists</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>operatorId exists</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>commandType ∈ [READ, NAVIGATE, EXTRACT, VERIFY]</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>riskTier ∈ [LOW, MEDIUM]</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>executionAllowed === false</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>dryRunOnly === true</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>approvalRequired === true</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>sourceBoundaryPhase references PHASE_28</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>policyFlags: all prohibited flags are false</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>safetyAssertions: all required assertions are true</span>
            </div>
          </div>
        </div>
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
          onClick={handleValidate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Validate Contracts
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Validation Batch JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={results.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Results
        </button>
      </div>

      {/* Validation results table */}
      {latestBatch && latestBatch.validationResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Results ({latestBatch.validationResults.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Safety Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Failures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.validationResults.map((result, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{result.sourceRequestId}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {result.validationStatus === 'PASS' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-primary font-semibold">PASS</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-destructive shrink-0" />
                            <span className="text-destructive font-semibold">FAIL</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[7px] font-bold ${result.safetyLockStatus === 'LOCKED' ? 'text-primary' : 'text-destructive'}`}>
                        {result.safetyLockStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {result.failureReasons.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedFailure(expandedFailure === i ? null : i)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <span className="font-bold">{result.failureReasons.length}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedFailure === i ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <span className="text-primary font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded failure details */}
      {latestBatch && expandedFailure !== null && latestBatch.validationResults[expandedFailure]?.failureReasons.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="text-[9px] font-semibold text-destructive mb-2">
            Failure Details — {latestBatch.validationResults[expandedFailure].sourceRequestId}
          </div>
          <div className="space-y-1 text-[8px] text-destructive/80">
            {latestBatch.validationResults[expandedFailure].failureReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Final Warning: </span>This validator is local-only, preview-only. No OpenClaw calls, no backend calls, no execution, no dispatch, no scheduler, no polling, no credentials, no trading, no wallet actions.
        </p>
      </div>

      {/* Latest validation batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Validation Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.validatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{RESULTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only validator. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch, no credentials, no trading.
      </div>
    </div>
  );
}