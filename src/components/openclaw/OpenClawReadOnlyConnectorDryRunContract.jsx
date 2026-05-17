/**
 * OpenClawReadOnlyConnectorDryRunContract — Phase 35
 * Defines local-only dry-run contracts for future OpenClaw read-only connector requests.
 * No OpenClaw calls, no backend APIs, no execution. Contract definition only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, Link2, ChevronDown } from 'lucide-react';

const SIMULATION_RESULTS_KEY = 'openclawPhase34DryRunExecutionSimulationResults';
const CONTRACTS_KEY = 'openclawPhase35ReadOnlyConnectorDryRunContracts';

const ALLOWED_CONNECTOR_ACTIONS = ['HEALTH_CHECK', 'STATUS_READ', 'VERSION_READ', 'CAPABILITY_READ'];
const BLOCKED_CONNECTOR_ACTIONS = ['EXECUTE', 'DISPATCH', 'TRADE', 'CREDENTIAL_ENTRY', 'MONEY_MOVEMENT', 'BROWSER_AUTOMATION', 'SCHEDULER', 'POLLING'];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateConnectorContract(simulationRecord) {
  return {
    connectorContractId: `contract-${simulationRecord.simulationId}-${Date.now()}`,
    sourceSimulationId: simulationRecord.simulationId,
    sourceDryRunGateId: simulationRecord.sourceDryRunGateId,
    sourceApprovalId: simulationRecord.sourceApprovalId,
    sourceRequestId: simulationRecord.sourceRequestId,
    generatedAt: new Date().toISOString(),
    connectorMode: 'READ_ONLY_DRY_RUN',
    allowedConnectorActions: ALLOWED_CONNECTOR_ACTIONS,
    blockedConnectorActions: BLOCKED_CONNECTOR_ACTIONS,
    openClawCallAllowed: false,
    backendCallAllowed: false,
    apiCallAllowed: false,
    executionAllowed: false,
    dispatchAllowed: false,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawReadOnlyConnectorDryRunContract() {
  const [contracts, setContracts] = useState(() => loadJSON(CONTRACTS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedContract, setExpandedContract] = useState(null);

  const handleGenerateContracts = () => {
    try {
      const simulationResults = loadJSON(SIMULATION_RESULTS_KEY, []);

      if (simulationResults.length === 0) {
        setLastAction('No Phase 34 simulation results found');
        return;
      }

      const latestBatch = simulationResults[0];

      if (!latestBatch.simulationRecords || latestBatch.simulationRecords.length === 0) {
        setLastAction('No simulation records in latest batch');
        return;
      }

      // Filter for successful simulations with all safety flags locked
      const validSimulations = latestBatch.simulationRecords.filter(
        r =>
          r.simulatedResultStatus === 'SIMULATED_SUCCESS' &&
          r.actualExecutionStatus === 'NOT_EXECUTED' &&
          r.executionAllowed === false &&
          r.dispatchAllowed === false &&
          r.openClawCalled === false &&
          r.backendCalled === false &&
          r.apiCalled === false &&
          r.dryRunOnly === true &&
          r.safetyLockStatus === 'LOCKED'
      );

      if (validSimulations.length === 0) {
        setLastAction('No valid simulations found (safety requirements not met)');
        return;
      }

      // Generate connector contracts
      const contractBatch = {
        contractBatchId: `batch-${Date.now()}`,
        contractType: 'PHASE_35_READONLY_CONNECTOR_DRY_RUN_CONTRACT',
        generatedAt: new Date().toISOString(),
        sourceSimulationBatchId: latestBatch.simulationBatchId,
        totalContracts: validSimulations.length,
        allowedActionCount: ALLOWED_CONNECTOR_ACTIONS.length,
        blockedActionCount: BLOCKED_CONNECTOR_ACTIONS.length,
        connectorContracts: validSimulations.map(sim => generateConnectorContract(sim)),
      };

      try {
        localStorage.setItem(CONTRACTS_KEY, JSON.stringify([contractBatch, ...contracts].slice(0, 50)));
      } catch {}

      setContracts([contractBatch, ...contracts].slice(0, 50));
      setLastAction(`Generated ${validSimulations.length} connector contracts at ${new Date().toLocaleString()}`);
    } catch (err) {
      setLastAction('Contract generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (contracts.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(contracts[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest contracts copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(CONTRACTS_KEY);
      setContracts([]);
      setLastAction('All connector contracts cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = contracts.length > 0 ? contracts[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 35 · OpenClaw Read-Only Connector</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" /> Read-Only Connector Dry-Run Contract
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Defines local-only dry-run contracts for future OpenClaw read-only connector requests without calling anything.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_35_READONLY_CONNECTOR_DRY_RUN_CONTRACT</span>
      </div>

      {/* Contract summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Contracts</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalContracts}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Allowed Actions</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.allowedActionCount}</div>
          </div>
          <div className="bg-card border border-destructive/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Blocked Actions</div>
            <div className="text-[18px] font-bold text-destructive">{latestBatch.blockedActionCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Connector actions reference */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Connector Actions</span>
        </div>
        <div className="space-y-3 px-4 py-3">
          <div>
            <div className="text-[8px] text-primary font-semibold mb-1.5 uppercase tracking-widest">✓ Allowed</div>
            <div className="text-[8px] text-slate-300 space-y-0.5">
              {ALLOWED_CONNECTOR_ACTIONS.map(action => (
                <div key={action} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono">{action}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border/40 pt-2">
            <div className="text-[8px] text-destructive font-semibold mb-1.5 uppercase tracking-widest">✗ Blocked</div>
            <div className="text-[8px] text-slate-300 space-y-0.5">
              {BLOCKED_CONNECTOR_ACTIONS.map(action => (
                <div key={action} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-destructive shrink-0" />
                  <span className="font-mono">{action}</span>
                </div>
              ))}
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
          onClick={handleGenerateContracts}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Link2 className="w-3.5 h-3.5" />
          Generate OpenClaw Read-Only Connector Dry-Run Contract
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Contracts JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={contracts.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Contracts
        </button>
      </div>

      {/* Contracts table */}
      {latestBatch && latestBatch.connectorContracts && latestBatch.connectorContracts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Connector Contracts ({latestBatch.connectorContracts.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Connector Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Execution Allowed</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.connectorContracts.map((contract, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{contract.sourceRequestId}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-primary font-semibold text-[8px]">{contract.connectorMode}</span>
                    </td>
                    <td className="px-3 py-2.5 text-destructive font-bold text-[7px]">{String(contract.executionAllowed)}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedContract(expandedContract === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedContract === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded contract details */}
          {expandedContract !== null && latestBatch.connectorContracts[expandedContract] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Contract Details — {latestBatch.connectorContracts[expandedContract].sourceRequestId}
              </div>
              <div className="text-[8px] text-slate-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Contract ID:</span>
                  <span className="text-primary font-mono">{latestBatch.connectorContracts[expandedContract].connectorContractId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Lock Status:</span>
                  <span className="text-primary font-bold">{latestBatch.connectorContracts[expandedContract].safetyLockStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Execution Status:</span>
                  <span className="text-destructive font-bold">{latestBatch.connectorContracts[expandedContract].actualExecutionStatus}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Connector Contract Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This does NOT call OpenClaw, backend APIs, dispatch commands, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. It only defines the future read-only connector contract.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
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
            <span>Only defines the future read-only connector contract</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Connector Contracts — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{CONTRACTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only contract definition. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}