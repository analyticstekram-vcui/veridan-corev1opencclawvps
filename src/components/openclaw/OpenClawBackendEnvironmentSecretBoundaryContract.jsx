/**
 * OpenClawBackendEnvironmentSecretBoundaryContract — Phase 39
 * Defines backend environment and secret boundary for future controlled read-only connector checks.
 * No secret values read, displayed, logged, or exported. Boundary design only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const ROUTE_CONTRACT_KEY = 'openclawPhase38ReadOnlyBackendRouteContracts';
const BOUNDARY_CONTRACT_KEY = 'openclawPhase39BackendEnvironmentSecretBoundaryContracts';

const REQUIRED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

const PROHIBITED_SECRET_BEHAVIORS = [
  'DISPLAY_SECRET_VALUE',
  'LOG_SECRET_VALUE',
  'SEND_SECRET_TO_CLIENT',
  'STORE_SECRET_IN_LOCALSTORAGE',
  'INCLUDE_SECRET_IN_EXPORT',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateBoundaryContract(routeContract) {
  return {
    environmentBoundaryId: `boundary-${routeContract.routeContractId}-${Date.now()}`,
    sourceRouteContractId: routeContract.routeContractId,
    sourceTestPlanId: routeContract.sourceTestPlanId,
    sourceConnectorValidationId: routeContract.sourceConnectorValidationId,
    sourceConnectorContractId: routeContract.sourceConnectorContractId,
    sourceRequestId: routeContract.sourceRequestId,
    generatedAt: new Date().toISOString(),
    boundaryMode: 'BACKEND_ENV_SECRET_BOUNDARY',
    requiredEnvironmentKeys: REQUIRED_ENV_KEYS,
    secretValueExposureAllowed: false,
    clientSideSecretAccessAllowed: false,
    backendOnlySecretAccessRequired: true,
    allowedSecretCheckMode: 'PRESENCE_ONLY',
    prohibitedSecretBehaviors: PROHIBITED_SECRET_BEHAVIORS,
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

export default function OpenClawBackendEnvironmentSecretBoundaryContract() {
  const [boundaryContracts, setBoundaryContracts] = useState(() => loadJSON(BOUNDARY_CONTRACT_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedContract, setExpandedContract] = useState(null);

  const handleGenerateBoundaryContract = () => {
    try {
      const routeContractBatches = loadJSON(ROUTE_CONTRACT_KEY, []);

      if (routeContractBatches.length === 0) {
        setLastAction('No Phase 38 route contracts found');
        return;
      }

      const latestBatch = routeContractBatches[0];

      if (!latestBatch.routeContracts || latestBatch.routeContracts.length === 0) {
        setLastAction('No route contracts in latest batch');
        return;
      }

      // Filter for valid route contracts
      const validContracts = latestBatch.routeContracts.filter(
        contract =>
          contract.routeMode === 'READ_ONLY_BACKEND_CONTRACT' &&
          contract.proposedBackendRoute === '/api/openclaw/read-only/status-check' &&
          contract.backendActionMode === 'SERVER_SIDE_READ_ONLY_PROXY' &&
          contract.permittedOpenClawMethod === 'GET' &&
          contract.permittedOpenClawEndpoints &&
          contract.permittedOpenClawEndpoints.includes('/health') &&
          contract.permittedOpenClawEndpoints.includes('/status') &&
          contract.permittedOpenClawEndpoints.includes('/version') &&
          contract.permittedOpenClawEndpoints.includes('/capabilities') &&
          contract.openClawCallAllowed === false &&
          contract.backendCallAllowed === false &&
          contract.apiCallAllowed === false &&
          contract.executionAllowed === false &&
          contract.dispatchAllowed === false &&
          contract.dryRunOnly === true &&
          contract.actualExecutionStatus === 'NOT_EXECUTED' &&
          contract.safetyLockStatus === 'LOCKED'
      );

      if (validContracts.length === 0) {
        setLastAction('No valid route contracts found (all safety flags must match READ_ONLY_BACKEND_CONTRACT specification)');
        return;
      }

      // Generate boundary contracts
      const generatedContracts = validContracts.map(contract => generateBoundaryContract(contract));

      const contractBatch = {
        contractBatchId: `batch-${Date.now()}`,
        contractType: 'PHASE_39_BACKEND_ENV_SECRET_BOUNDARY_CONTRACT',
        generatedAt: new Date().toISOString(),
        sourceRouteContractBatchId: latestBatch.contractBatchId,
        totalBoundaryContracts: generatedContracts.length,
        boundaryContracts: generatedContracts,
      };

      try {
        localStorage.setItem(BOUNDARY_CONTRACT_KEY, JSON.stringify([contractBatch, ...boundaryContracts].slice(0, 50)));
      } catch {}

      setBoundaryContracts([contractBatch, ...boundaryContracts].slice(0, 50));
      setLastAction(`Generated ${generatedContracts.length} boundary contracts from valid route contracts`);
    } catch (err) {
      setLastAction('Boundary contract generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (boundaryContracts.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(boundaryContracts[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest boundary contract batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(BOUNDARY_CONTRACT_KEY);
      setBoundaryContracts([]);
      setLastAction('All boundary contracts cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = boundaryContracts.length > 0 ? boundaryContracts[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 39 · Backend Environment & Secret Boundary</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Environment & Secret Boundary Contract
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Defines backend environment and secret boundary for future controlled read-only checks without reading or exposing secret values.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_39_BACKEND_ENV_SECRET_BOUNDARY_CONTRACT</span>
      </div>

      {/* Boundary contract summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Contracts</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalBoundaryContracts}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Required Env Keys</div>
            <div className="text-[18px] font-bold text-primary">{REQUIRED_ENV_KEYS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Prohibited Behaviors</div>
            <div className="text-[18px] font-bold text-destructive">{PROHIBITED_SECRET_BEHAVIORS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Boundary contract specification */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Boundary Contract Specification</span>
        </div>
        <div className="space-y-2 px-4 py-3">
          <div className="text-[8px] space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Mode: <span className="font-mono font-semibold text-primary">BACKEND_ENV_SECRET_BOUNDARY</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Secret Exposure Allowed: <span className="font-mono font-semibold text-destructive">false</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Client-Side Access Allowed: <span className="font-mono font-semibold text-destructive">false</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Backend-Only Required: <span className="font-mono font-semibold text-primary">true</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Check Mode: <span className="font-mono font-semibold text-primary">PRESENCE_ONLY</span></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-slate-300">Required Environment Keys: <span className="font-mono font-semibold text-primary">{REQUIRED_ENV_KEYS.join(', ')}</span></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <span className="text-slate-300">Prohibited Secret Behaviors: <span className="font-mono font-semibold text-destructive">{PROHIBITED_SECRET_BEHAVIORS.join(', ')}</span></span>
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
          onClick={handleGenerateBoundaryContract}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Backend Environment Boundary Contract
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Boundary Contract JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={boundaryContracts.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Contracts
        </button>
      </div>

      {/* Boundary contracts table */}
      {latestBatch && latestBatch.boundaryContracts && latestBatch.boundaryContracts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Boundary Contracts ({latestBatch.boundaryContracts.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Boundary Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Check Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.boundaryContracts.map((contract, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{contract.sourceRequestId}</td>
                    <td className="px-3 py-2.5 text-primary font-semibold text-[8px]">ENV_BOUNDARY</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px]">{contract.allowedSecretCheckMode}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[8px] font-semibold text-primary">LOCKED</span>
                    </td>
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
          {expandedContract !== null && latestBatch.boundaryContracts[expandedContract] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Boundary Contract Details — {latestBatch.boundaryContracts[expandedContract].sourceRequestId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.boundaryContracts[expandedContract], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Secret Boundary Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is a secret boundary contract only. It does NOT read actual secret values, display or export secrets, call OpenClaw, invoke backend functions, dispatch commands, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. Secret boundary design is local-only, non-executable design work.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>This is a secret boundary contract only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not read actual secret values</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not display or export secret values</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call OpenClaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not invoke backend functions</span>
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
            <span>Local-only secret boundary design work</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Boundary Contract Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{BOUNDARY_CONTRACT_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only boundary contract. No fetch, no OpenClaw calls, no backend calls, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}