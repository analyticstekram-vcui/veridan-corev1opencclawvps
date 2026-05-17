/**
 * OpenClawReadOnlyConnectorContractValidator — Phase 36
 * Validates Phase 35 OpenClaw read-only connector dry-run contracts locally.
 * No OpenClaw calls, no backend APIs, no execution. Validation only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertCircle, XCircle, ChevronDown } from 'lucide-react';

const CONTRACTS_KEY = 'openclawPhase35ReadOnlyConnectorDryRunContracts';
const VALIDATION_RESULTS_KEY = 'openclawPhase36ReadOnlyConnectorContractValidationResults';

const ALLOWED_ACTIONS = ['HEALTH_CHECK', 'STATUS_READ', 'VERSION_READ', 'CAPABILITY_READ'];
const BLOCKED_ACTIONS = ['EXECUTE', 'DISPATCH', 'TRADE', 'CREDENTIAL_ENTRY', 'MONEY_MOVEMENT', 'BROWSER_AUTOMATION', 'SCHEDULER', 'POLLING'];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function validateConnectorContract(contract) {
  const failures = [];

  // Check contract ID exists
  if (!contract.connectorContractId) {
    failures.push('Missing connectorContractId');
  }

  // Check connector mode
  if (contract.connectorMode !== 'READ_ONLY_DRY_RUN') {
    failures.push('connectorMode is not READ_ONLY_DRY_RUN');
  }

  // Check allowed actions
  if (!contract.allowedConnectorActions || 
      JSON.stringify(contract.allowedConnectorActions.sort()) !== JSON.stringify(ALLOWED_ACTIONS.sort())) {
    failures.push('allowedConnectorActions does not match expected list');
  }

  // Check blocked actions
  if (!contract.blockedConnectorActions || 
      JSON.stringify(contract.blockedConnectorActions.sort()) !== JSON.stringify(BLOCKED_ACTIONS.sort())) {
    failures.push('blockedConnectorActions does not match expected list');
  }

  // Check execution flags
  if (contract.openClawCallAllowed !== false) failures.push('openClawCallAllowed is not false');
  if (contract.backendCallAllowed !== false) failures.push('backendCallAllowed is not false');
  if (contract.apiCallAllowed !== false) failures.push('apiCallAllowed is not false');
  if (contract.executionAllowed !== false) failures.push('executionAllowed is not false');
  if (contract.dispatchAllowed !== false) failures.push('dispatchAllowed is not false');
  if (contract.dryRunOnly !== true) failures.push('dryRunOnly is not true');
  if (contract.actualExecutionStatus !== 'NOT_EXECUTED') failures.push('actualExecutionStatus is not NOT_EXECUTED');
  if (contract.safetyLockStatus !== 'LOCKED') failures.push('safetyLockStatus is not LOCKED');

  return {
    isValid: failures.length === 0,
    failures,
  };
}

function generateValidationResult(contract, isValid, failures) {
  return {
    connectorValidationId: `val-${contract.connectorContractId}-${Date.now()}`,
    sourceConnectorContractId: contract.connectorContractId,
    sourceSimulationId: contract.sourceSimulationId,
    sourceDryRunGateId: contract.sourceDryRunGateId,
    sourceApprovalId: contract.sourceApprovalId,
    sourceRequestId: contract.sourceRequestId,
    validatedAt: new Date().toISOString(),
    validationStatus: isValid ? 'PASS' : 'FAIL',
    failureReasons: failures,
    connectorSafetyStatus: isValid ? 'LOCKED' : 'BROKEN',
    actualExecutionStatus: 'NOT_EXECUTED',
    futureConnectorEligible: isValid,
  };
}

export default function OpenClawReadOnlyConnectorContractValidator() {
  const [results, setResults] = useState(() => loadJSON(VALIDATION_RESULTS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedFailure, setExpandedFailure] = useState(null);

  const handleValidateContracts = () => {
    try {
      const contractBatches = loadJSON(CONTRACTS_KEY, []);

      if (contractBatches.length === 0) {
        setLastAction('No Phase 35 connector contracts found');
        return;
      }

      const latestBatch = contractBatches[0];

      if (!latestBatch.connectorContracts || latestBatch.connectorContracts.length === 0) {
        setLastAction('No connector contracts in latest batch');
        return;
      }

      // Validate each contract
      const validationResults = latestBatch.connectorContracts.map(contract => {
        const { isValid, failures } = validateConnectorContract(contract);
        return generateValidationResult(contract, isValid, failures);
      });

      const passCount = validationResults.filter(r => r.validationStatus === 'PASS').length;
      const failCount = validationResults.filter(r => r.validationStatus === 'FAIL').length;

      const validationBatch = {
        validationBatchId: `batch-${Date.now()}`,
        validationType: 'PHASE_36_READONLY_CONNECTOR_CONTRACT_VALIDATOR',
        validatedAt: new Date().toISOString(),
        sourceContractBatchId: latestBatch.contractBatchId,
        totalContractsChecked: validationResults.length,
        passCount,
        failCount,
        validationResults,
      };

      try {
        localStorage.setItem(VALIDATION_RESULTS_KEY, JSON.stringify([validationBatch, ...results].slice(0, 50)));
      } catch {}

      setResults([validationBatch, ...results].slice(0, 50));
      setLastAction(`Validated ${validationResults.length} contracts — ${passCount} PASS, ${failCount} FAIL`);
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
      setLastAction('Latest validation results copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(VALIDATION_RESULTS_KEY);
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
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 36 · Read-Only Connector Validator</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Read-Only Connector Contract Validator
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Validates Phase 35 OpenClaw read-only connector contracts locally without calling anything.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_36_READONLY_CONNECTOR_CONTRACT_VALIDATOR</span>
      </div>

      {/* Validation summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Checked</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalContractsChecked}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Passed</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.passCount}</div>
          </div>
          <div className={`bg-card border ${latestBatch.failCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Failed</div>
            <div className={`text-[18px] font-bold ${latestBatch.failCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>{latestBatch.failCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Validated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.validatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Validation requirements */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Requirements</span>
        </div>
        <div className="space-y-1 px-4 py-3">
          <div className="text-[8px] text-slate-300 space-y-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>connectorMode === READ_ONLY_DRY_RUN</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>allowedConnectorActions exactly: HEALTH_CHECK, STATUS_READ, VERSION_READ, CAPABILITY_READ</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>blockedConnectorActions exactly: EXECUTE, DISPATCH, TRADE, CREDENTIAL_ENTRY, MONEY_MOVEMENT, BROWSER_AUTOMATION, SCHEDULER, POLLING</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>All execution flags false (openClawCallAllowed, backendCallAllowed, apiCallAllowed, executionAllowed, dispatchAllowed)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>dryRunOnly === true</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>actualExecutionStatus === NOT_EXECUTED</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>safetyLockStatus === LOCKED</span>
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
          onClick={handleValidateContracts}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Validate Read-Only Connector Contracts
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Validation JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={results.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Results
        </button>
      </div>

      {/* Validation results table */}
      {latestBatch && latestBatch.validationResults && latestBatch.validationResults.length > 0 && (
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
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Safety Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Eligible</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
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
                      <span className={`text-[8px] font-semibold ${result.connectorSafetyStatus === 'LOCKED' ? 'text-primary' : 'text-destructive'}`}>
                        {result.connectorSafetyStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[8px] font-bold text-primary">{String(result.futureConnectorEligible)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {result.validationStatus === 'FAIL' && result.failureReasons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedFailure(expandedFailure === i ? null : i)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <span className="font-bold text-[7px]">VIEW</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedFailure === i ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded failure details */}
          {expandedFailure !== null && latestBatch.validationResults[expandedFailure] && (
            <div className="bg-destructive/5 border-t border-destructive/20 p-4 space-y-2">
              <div className="text-[9px] font-semibold text-destructive">
                Failure Reasons — {latestBatch.validationResults[expandedFailure].sourceRequestId}
              </div>
              <div className="text-[8px] text-slate-300 space-y-1">
                {latestBatch.validationResults[expandedFailure].failureReasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Contract Validator Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          Validator is local-only and does NOT call OpenClaw, backend APIs, dispatch commands, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. PASS only means eligible for future read-only connector testing, not live execution.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Validator is local-only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call OpenClaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call backend APIs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not dispatch commands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not trade, enter credentials, schedule, poll, or move money</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>PASS only means eligible for future testing, not execution approval</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Validation Results — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.validatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{VALIDATION_RESULTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only validator. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}