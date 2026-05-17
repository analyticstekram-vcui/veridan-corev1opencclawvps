/**
 * OpenClawBackendEnvironmentPresenceCheckPlan — Phase 40
 * Creates a plan for how a future backend route will check environment key presence without exposing secrets.
 * No secret values read, displayed, logged, or exported. Presence check plan design only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const BOUNDARY_CONTRACT_KEY = 'openclawPhase39BackendEnvironmentSecretBoundaryContracts';
const PRESENCE_PLAN_KEY = 'openclawPhase40BackendEnvironmentPresenceCheckPlans';

const REQUIRED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

const PROHIBITED_RETURN_FIELDS = [
  'secretValue',
  'rawValue',
  'token',
  'credential',
  'password',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generatePresenceCheckPlan(boundaryContract) {
  return {
    presenceCheckPlanId: `plan-${boundaryContract.environmentBoundaryId}-${Date.now()}`,
    sourceEnvironmentBoundaryId: boundaryContract.environmentBoundaryId,
    sourceRouteContractId: boundaryContract.sourceRouteContractId,
    sourceRequestId: boundaryContract.sourceRequestId,
    generatedAt: new Date().toISOString(),
    planMode: 'BACKEND_ENV_PRESENCE_CHECK_PLAN',
    requiredEnvironmentKeys: REQUIRED_ENV_KEYS,
    futureBackendCheckMode: 'BOOLEAN_PRESENCE_ONLY',
    allowedResultShape: {
      keyName: 'string',
      present: 'boolean',
      value: 'REDACTED_NEVER_RETURNED',
    },
    prohibitedReturnFields: PROHIBITED_RETURN_FIELDS,
    secretValueExposureAllowed: false,
    clientSideSecretAccessAllowed: false,
    backendOnlySecretAccessRequired: true,
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

export default function OpenClawBackendEnvironmentPresenceCheckPlan() {
  const [presencePlans, setPresencePlans] = useState(() => loadJSON(PRESENCE_PLAN_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  const handleGeneratePresenceCheckPlan = () => {
    try {
      const boundaryContractBatches = loadJSON(BOUNDARY_CONTRACT_KEY, []);

      if (boundaryContractBatches.length === 0) {
        setLastAction('No Phase 39 boundary contracts found');
        return;
      }

      const latestBatch = boundaryContractBatches[0];

      if (!latestBatch.boundaryContracts || latestBatch.boundaryContracts.length === 0) {
        setLastAction('No boundary contracts in latest batch');
        return;
      }

      // Filter for valid boundary contracts
      const validContracts = latestBatch.boundaryContracts.filter(
        contract =>
          contract.boundaryMode === 'BACKEND_ENV_SECRET_BOUNDARY' &&
          contract.requiredEnvironmentKeys &&
          contract.requiredEnvironmentKeys.includes('OPENCLAW_GATEWAY_URL') &&
          contract.requiredEnvironmentKeys.includes('OPENCLAW_SERVICE_TOKEN') &&
          contract.requiredEnvironmentKeys.includes('CF_ACCESS_CLIENT_ID') &&
          contract.requiredEnvironmentKeys.includes('CF_ACCESS_CLIENT_SECRET') &&
          contract.secretValueExposureAllowed === false &&
          contract.clientSideSecretAccessAllowed === false &&
          contract.backendOnlySecretAccessRequired === true &&
          contract.allowedSecretCheckMode === 'PRESENCE_ONLY' &&
          contract.prohibitedSecretBehaviors &&
          contract.prohibitedSecretBehaviors.includes('DISPLAY_SECRET_VALUE') &&
          contract.prohibitedSecretBehaviors.includes('LOG_SECRET_VALUE') &&
          contract.prohibitedSecretBehaviors.includes('SEND_SECRET_TO_CLIENT') &&
          contract.prohibitedSecretBehaviors.includes('STORE_SECRET_IN_LOCALSTORAGE') &&
          contract.prohibitedSecretBehaviors.includes('INCLUDE_SECRET_IN_EXPORT') &&
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
        setLastAction('No valid boundary contracts found (all safety flags must match BACKEND_ENV_SECRET_BOUNDARY specification)');
        return;
      }

      // Generate presence check plans
      const generatedPlans = validContracts.map(contract => generatePresenceCheckPlan(contract));

      const planBatch = {
        planBatchId: `batch-${Date.now()}`,
        planType: 'PHASE_40_BACKEND_ENV_PRESENCE_CHECK_PLAN',
        generatedAt: new Date().toISOString(),
        sourceBoundaryContractBatchId: latestBatch.contractBatchId,
        totalPresenceCheckPlans: generatedPlans.length,
        presenceCheckPlans: generatedPlans,
      };

      try {
        localStorage.setItem(PRESENCE_PLAN_KEY, JSON.stringify([planBatch, ...presencePlans].slice(0, 50)));
      } catch {}

      setPresencePlans([planBatch, ...presencePlans].slice(0, 50));
      setLastAction(`Generated ${generatedPlans.length} presence check plans from valid boundary contracts`);
    } catch (err) {
      setLastAction('Presence check plan generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (presencePlans.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(presencePlans[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest presence check plan batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(PRESENCE_PLAN_KEY);
      setPresencePlans([]);
      setLastAction('All presence check plans cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = presencePlans.length > 0 ? presencePlans[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 40 · Backend Environment Presence Check Plan</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Environment Presence Check Plan
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Creates a plan for how a future backend will check environment key presence without reading or exposing secret values.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_40_BACKEND_ENV_PRESENCE_CHECK_PLAN</span>
      </div>

      {/* Presence check plan summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Plans</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalPresenceCheckPlans}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Required Keys</div>
            <div className="text-[18px] font-bold text-primary">{REQUIRED_ENV_KEYS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Prohibited Fields</div>
            <div className="text-[18px] font-bold text-destructive">{PROHIBITED_RETURN_FIELDS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Presence check plan specification */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Presence Check Plan Specification</span>
        </div>
        <div className="space-y-2 px-4 py-3">
          <div className="text-[8px] space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Mode: <span className="font-mono font-semibold text-primary">BACKEND_ENV_PRESENCE_CHECK_PLAN</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Check Mode: <span className="font-mono font-semibold text-primary">BOOLEAN_PRESENCE_ONLY</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Result Shape: <span className="font-mono font-semibold text-primary">{'{ keyName, present, value: REDACTED }'}</span></span>
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
              <span className="text-slate-300">Prohibited Fields: <span className="font-mono font-semibold text-destructive">{PROHIBITED_RETURN_FIELDS.join(', ')}</span></span>
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
          onClick={handleGeneratePresenceCheckPlan}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Backend Environment Presence Check Plan
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Presence Plan JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={presencePlans.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Plans
        </button>
      </div>

      {/* Presence check plans table */}
      {latestBatch && latestBatch.presenceCheckPlans && latestBatch.presenceCheckPlans.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Presence Check Plans ({latestBatch.presenceCheckPlans.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Plan Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Check Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.presenceCheckPlans.map((plan, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{plan.sourceRequestId}</td>
                    <td className="px-3 py-2.5 text-primary font-semibold text-[8px]">PRESENCE_PLAN</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px]">{plan.futureBackendCheckMode}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[8px] font-semibold text-primary">LOCKED</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedPlan(expandedPlan === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedPlan === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded plan details */}
          {expandedPlan !== null && latestBatch.presenceCheckPlans[expandedPlan] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Presence Check Plan Details — {latestBatch.presenceCheckPlans[expandedPlan].sourceRequestId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.presenceCheckPlans[expandedPlan], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Presence Check Plan Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is a presence check plan only. It does NOT read actual secret values, call backend functions, call OpenClaw, dispatch commands, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. Future result shape must only return boolean presence, never secret values.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>This is a presence check plan only</span>
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
            <span>Future result shape must only return boolean presence, never values</span>
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
            <span>Local-only presence check plan design work</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Presence Check Plan Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{PRESENCE_PLAN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only presence check plan. No fetch, no OpenClaw calls, no backend calls, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}