/**
 * OpenClawDryRunExecutionResultSimulator — Phase 34
 * Generates local-only simulated execution results from Phase 33 PASS checks.
 * No execution, no dispatch, no backend calls. Simulation only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, Zap, ChevronDown } from 'lucide-react';

const GATE_RESULTS_KEY = 'openclawPhase33DryRunExecutionGateResults';
const SIMULATION_RESULTS_KEY = 'openclawPhase34DryRunExecutionSimulationResults';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getSimulatedOutput(commandType) {
  const outputs = {
    READ: 'Would read target state in a future dry-run connector.',
    NAVIGATE: 'Would simulate navigation path validation only.',
    EXTRACT: 'Would simulate extraction schema validation only.',
    VERIFY: 'Would simulate verification checklist evaluation only.',
  };
  return outputs[commandType] || 'No executable simulation available.';
}

function generateSimulationRecord(dryRunResult) {
  return {
    simulationId: `sim-${dryRunResult.dryRunGateId}-${Date.now()}`,
    sourceDryRunGateId: dryRunResult.dryRunGateId,
    sourceApprovalId: dryRunResult.sourceApprovalId,
    sourceRequestId: dryRunResult.sourceRequestId,
    simulatedAt: new Date().toISOString(),
    simulatedActionType: dryRunResult.sourceRequestId ? 'SIMULATED_READ_OPERATION' : 'SIMULATED_GENERIC',
    simulatedResultStatus: 'SIMULATED_SUCCESS',
    simulatedOutput: getSimulatedOutput(dryRunResult.sourceRequestId ? 'READ' : 'UNKNOWN'),
    actualExecutionStatus: 'NOT_EXECUTED',
    executionAllowed: false,
    dispatchAllowed: false,
    openClawCalled: false,
    backendCalled: false,
    apiCalled: false,
    tradingCalled: false,
    credentialUsed: false,
    moneyMovementTriggered: false,
    dryRunOnly: true,
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawDryRunExecutionResultSimulator() {
  const [simulationResults, setSimulationResults] = useState(() => loadJSON(SIMULATION_RESULTS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);

  const handleGenerateSimulations = () => {
    try {
      const gateResults = loadJSON(GATE_RESULTS_KEY, []);

      if (gateResults.length === 0) {
        setLastAction('No Phase 33 gate results found');
        return;
      }

      const latestGate = gateResults[0];

      // Filter for PASS results with all safety flags locked
      if (latestGate.gateCheckResult !== 'PASS') {
        setLastAction('Latest gate check did not PASS');
        return;
      }

      if (!latestGate.dryRunResults || latestGate.dryRunResults.length === 0) {
        setLastAction('No dry-run results in latest gate batch');
        return;
      }

      const validResults = latestGate.dryRunResults.filter(
        r =>
          r.gateStatus === 'PASS' &&
          r.simulatedExecutionStatus === 'SIMULATED_ONLY' &&
          r.actualExecutionStatus === 'NOT_EXECUTED' &&
          r.executionAllowed === false &&
          r.dispatchAllowed === false &&
          r.dryRunOnly === true &&
          r.safetyLockStatus === 'LOCKED'
      );

      if (validResults.length === 0) {
        setLastAction('No valid PASS results found (safety requirements not met)');
        return;
      }

      // Generate simulation records
      const simulationBatch = {
        simulationBatchId: `batch-${Date.now()}`,
        simulationType: 'PHASE_34_DRY_RUN_EXECUTION_RESULT_SIMULATOR',
        generatedAt: new Date().toISOString(),
        sourceGateBatchId: latestGate.gateBatchId,
        totalSimulations: validResults.length,
        simulatedSuccessCount: validResults.length, // All valid results simulate success
        simulatedBlockedCount: 0,
        simulationRecords: validResults.map(result => generateSimulationRecord(result)),
      };

      try {
        localStorage.setItem(SIMULATION_RESULTS_KEY, JSON.stringify([simulationBatch, ...simulationResults].slice(0, 50)));
      } catch {}

      setSimulationResults([simulationBatch, ...simulationResults].slice(0, 50));
      setLastAction(`Generated ${validResults.length} dry-run simulations at ${new Date().toLocaleString()}`);
    } catch (err) {
      setLastAction('Simulation generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (simulationResults.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(simulationResults[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest simulation results copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(SIMULATION_RESULTS_KEY);
      setSimulationResults([]);
      setLastAction('All simulation results cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = simulationResults.length > 0 ? simulationResults[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 34 · Dry-Run Execution Result Simulator</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Dry-Run Execution Result Simulator
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Generates local-only simulated execution results from Phase 33 PASS checks without executing anything.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_34_DRY_RUN_EXECUTION_RESULT_SIMULATOR</span>
      </div>

      {/* Simulation summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Simulations</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalSimulations}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Success</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.simulatedSuccessCount}</div>
          </div>
          <div className={`bg-card border ${latestBatch.simulatedBlockedCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Blocked</div>
            <div className={`text-[18px] font-bold ${latestBatch.simulatedBlockedCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>{latestBatch.simulatedBlockedCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Safety flags reference */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Simulation Safety Flags — All FALSE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {[
            'executionAllowed',
            'dispatchAllowed',
            'openClawCalled',
            'backendCalled',
            'apiCalled',
            'tradingCalled',
            'credentialUsed',
            'moneyMovementTriggered',
            'dryRunOnly',
          ].map((flag) => (
            <div key={flag} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{flag}: <span className={flag === 'dryRunOnly' ? 'text-primary' : 'text-destructive'} className="font-bold">{flag === 'dryRunOnly' ? 'true' : 'false'}</span></span>
            </div>
          ))}
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
          onClick={handleGenerateSimulations}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Zap className="w-3.5 h-3.5" />
          Generate Dry-Run Simulation Results
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Simulation JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={simulationResults.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Results
        </button>
      </div>

      {/* Simulation results table */}
      {latestBatch && latestBatch.simulationRecords && latestBatch.simulationRecords.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Simulation Results ({latestBatch.simulationRecords.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Sim Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Actual Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Execution Allowed</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.simulationRecords.map((record, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{record.sourceRequestId}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-primary font-semibold">{record.simulatedResultStatus}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[7px] font-mono">{record.actualExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-destructive font-bold text-[7px]">{String(record.executionAllowed)}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedResult === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded record details */}
          {expandedResult !== null && latestBatch.simulationRecords[expandedResult] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Simulation Details — {latestBatch.simulationRecords[expandedResult].sourceRequestId}
              </div>
              <div className="text-[8px] text-slate-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Sim ID:</span>
                  <span className="text-primary font-mono">{latestBatch.simulationRecords[expandedResult].simulationId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Output:</span>
                  <span className="text-slate-300 italic">{latestBatch.simulationRecords[expandedResult].simulatedOutput}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Lock Status:</span>
                  <span className="text-primary font-bold">{latestBatch.simulationRecords[expandedResult].safetyLockStatus}</span>
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
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Simulation Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          Simulation does NOT execute anything, dispatch commands, call backend APIs, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. SIMULATED_SUCCESS does not mean live execution approval.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Simulation does not execute anything</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Simulation does not call OpenClaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Simulation does not call backend APIs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Simulation does not trade, enter credentials, schedule, poll, or move money</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>SIMULATED_SUCCESS does not mean live execution approval</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Simulation Results — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{SIMULATION_RESULTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only simulator. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}