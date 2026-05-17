/**
 * OpenClawBackendPresenceCheckRouteContract — Phase 41
 * Defines the local-only contract for a future backend route that checks environment key presence without returning secret values.
 * No process.env access, no secret reading, no backend API calls. Route contract design only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PRESENCE_PLAN_KEY = 'openclawPhase40BackendEnvironmentPresenceCheckPlans';
const ROUTE_CONTRACT_KEY = 'openclawPhase41BackendPresenceCheckRouteContracts';

const REQUIRED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

const PROHIBITED_RESPONSE_FIELDS = [
  'secretValue',
  'rawValue',
  'token',
  'credential',
  'password',
  'clientSecret',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateRouteContract(presenceCheckPlan) {
  return {
    presenceRouteContractId: `route-${presenceCheckPlan.presenceCheckPlanId}-${Date.now()}`,
    sourcePresenceCheckPlanId: presenceCheckPlan.presenceCheckPlanId,
    sourceEnvironmentBoundaryId: presenceCheckPlan.sourceEnvironmentBoundaryId,
    sourceRouteContractId: presenceCheckPlan.sourceRouteContractId,
    sourceRequestId: presenceCheckPlan.sourceRequestId,
    generatedAt: new Date().toISOString(),
    routeContractMode: 'BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT',
    proposedBackendRoute: '/api/openclaw/read-only/env-presence-check',
    allowedBackendMethod: 'POST',
    backendBehavior: 'CHECK_ENV_KEY_PRESENCE_ONLY',
    requiredEnvironmentKeys: REQUIRED_ENV_KEYS,
    allowedResponseShape: {
      routeStatus: 'READY | MISSING_REQUIRED_ENV | BLOCKED_BY_SECRET_POLICY',
      checkedAt: 'ISO_TIMESTAMP',
      keys: [
        {
          keyName: 'OPENCLAW_GATEWAY_URL',
          present: 'true/false',
          value: 'REDACTED_NEVER_RETURNED',
        },
      ],
      secretValuesReturned: false,
    },
    prohibitedResponseFields: PROHIBITED_RESPONSE_FIELDS,
    processEnvAccessAllowedInFrontend: false,
    secretValueExposureAllowed: false,
    clientSideSecretAccessAllowed: false,
    backendOnlySecretAccessRequired: true,
    openClawCallAllowed: false,
    apiCallAllowed: false,
    executionAllowed: false,
    dispatchAllowed: false,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawBackendPresenceCheckRouteContract() {
  const [routeContracts, setRouteContracts] = useState(() => loadJSON(ROUTE_CONTRACT_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedContract, setExpandedContract] = useState(null);

  const handleGenerateRouteContract = () => {
    try {
      const presencePlanBatches = loadJSON(PRESENCE_PLAN_KEY, []);

      if (presencePlanBatches.length === 0) {
        setLastAction('No Phase 40 presence check plans found');
        return;
      }

      const latestBatch = presencePlanBatches[0];

      if (!latestBatch.presenceCheckPlans || latestBatch.presenceCheckPlans.length === 0) {
        setLastAction('No presence check plans in latest batch');
        return;
      }

      // Filter for valid presence check plans
      const validPlans = latestBatch.presenceCheckPlans.filter(
        plan =>
          plan.planMode === 'BACKEND_ENV_PRESENCE_CHECK_PLAN' &&
          plan.futureBackendCheckMode === 'BOOLEAN_PRESENCE_ONLY' &&
          plan.requiredEnvironmentKeys &&
          plan.requiredEnvironmentKeys.includes('OPENCLAW_GATEWAY_URL') &&
          plan.requiredEnvironmentKeys.includes('OPENCLAW_SERVICE_TOKEN') &&
          plan.requiredEnvironmentKeys.includes('CF_ACCESS_CLIENT_ID') &&
          plan.requiredEnvironmentKeys.includes('CF_ACCESS_CLIENT_SECRET') &&
          plan.secretValueExposureAllowed === false &&
          plan.clientSideSecretAccessAllowed === false &&
          plan.backendOnlySecretAccessRequired === true &&
          plan.openClawCallAllowed === false &&
          plan.backendCallAllowed === false &&
          plan.apiCallAllowed === false &&
          plan.executionAllowed === false &&
          plan.dispatchAllowed === false &&
          plan.dryRunOnly === true &&
          plan.actualExecutionStatus === 'NOT_EXECUTED' &&
          plan.safetyLockStatus === 'LOCKED'
      );

      if (validPlans.length === 0) {
        setLastAction('No valid presence check plans found (all safety flags must match BACKEND_ENV_PRESENCE_CHECK_PLAN specification)');
        return;
      }

      // Generate route contracts
      const generatedContracts = validPlans.map(plan => generateRouteContract(plan));

      const contractBatch = {
        contractBatchId: `batch-${Date.now()}`,
        contractType: 'PHASE_41_BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT',
        generatedAt: new Date().toISOString(),
        sourcePresencePlanBatchId: latestBatch.planBatchId,
        totalRouteContracts: generatedContracts.length,
        presenceCheckRouteContracts: generatedContracts,
      };

      try {
        localStorage.setItem(ROUTE_CONTRACT_KEY, JSON.stringify([contractBatch, ...routeContracts].slice(0, 50)));
      } catch {}

      setRouteContracts([contractBatch, ...routeContracts].slice(0, 50));
      setLastAction(`Generated ${generatedContracts.length} route contracts from valid presence check plans`);
    } catch (err) {
      setLastAction('Route contract generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (routeContracts.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(routeContracts[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest route contract batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(ROUTE_CONTRACT_KEY);
      setRouteContracts([]);
      setLastAction('All route contracts cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = routeContracts.length > 0 ? routeContracts[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 41 · Backend Presence Check Route Contract</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Presence Check Route Contract
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Defines the local-only contract for a future backend route that checks environment key presence without returning secret values.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_41_BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT</span>
      </div>

      {/* Route contract summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Contracts</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalRouteContracts}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Required Keys</div>
            <div className="text-[18px] font-bold text-primary">{REQUIRED_ENV_KEYS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Prohibited Fields</div>
            <div className="text-[18px] font-bold text-destructive">{PROHIBITED_RESPONSE_FIELDS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Route contract specification */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Route Contract Specification</span>
        </div>
        <div className="space-y-2 px-4 py-3">
          <div className="text-[8px] space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Mode: <span className="font-mono font-semibold text-primary">BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Route: <span className="font-mono font-semibold text-primary">/api/openclaw/read-only/env-presence-check</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Method: <span className="font-mono font-semibold text-primary">POST</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Behavior: <span className="font-mono font-semibold text-primary">CHECK_ENV_KEY_PRESENCE_ONLY</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Process.env Access: <span className="font-mono font-semibold text-destructive">false</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Secret Exposure: <span className="font-mono font-semibold text-destructive">false</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Backend-Only: <span className="font-mono font-semibold text-primary">true</span></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-slate-300">Required Keys: <span className="font-mono font-semibold text-primary">{REQUIRED_ENV_KEYS.join(', ')}</span></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <span className="text-slate-300">Prohibited Response Fields: <span className="font-mono font-semibold text-destructive">{PROHIBITED_RESPONSE_FIELDS.join(', ')}</span></span>
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
          onClick={handleGenerateRouteContract}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Backend Presence Check Route Contract
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Route Contract JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={routeContracts.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Contracts
        </button>
      </div>

      {/* Route contracts table */}
      {latestBatch && latestBatch.presenceCheckRouteContracts && latestBatch.presenceCheckRouteContracts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Route Contracts ({latestBatch.presenceCheckRouteContracts.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Method</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.presenceCheckRouteContracts.map((contract, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{contract.sourceRequestId}</td>
                    <td className="px-3 py-2.5 text-primary font-semibold text-[8px]">/env-presence-check</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px]">{contract.allowedBackendMethod}</td>
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
          {expandedContract !== null && latestBatch.presenceCheckRouteContracts[expandedContract] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Route Contract Details — {latestBatch.presenceCheckRouteContracts[expandedContract].sourceRequestId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.presenceCheckRouteContracts[expandedContract], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Route Contract Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is a route contract only. It does NOT access process.env, read actual secret values, call backend functions, call OpenClaw, dispatch commands, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. Future route may only return boolean presence and redacted value markers.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>This is a route contract only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not access process.env</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not read actual secret values</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call backend functions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call OpenClaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Future route may only return boolean presence and redacted value markers</span>
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
            <span>Local-only route contract design work</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Route Contract Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{ROUTE_CONTRACT_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only route contract. No fetch, no OpenClaw calls, no backend calls, no process.env, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}