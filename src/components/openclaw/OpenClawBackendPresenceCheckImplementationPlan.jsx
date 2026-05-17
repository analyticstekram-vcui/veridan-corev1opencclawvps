/**
 * OpenClawBackendPresenceCheckImplementationPlan — Phase 43
 * Creates a local-only implementation plan for the future backend presence-check route after Phase 42 validation.
 * No process.env access, no secret reading, no backend API calls, no route implementation. Plan only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const VALIDATION_RESULTS_KEY = 'openclawPhase42BackendPresenceCheckRouteValidationResults';
const IMPLEMENTATION_PLAN_KEY = 'openclawPhase43BackendPresenceCheckImplementationPlans';

const PLANNED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

const PROHIBITED_BEHAVIORS = [
  'RETURN_SECRET_VALUE',
  'LOG_SECRET_VALUE',
  'SEND_SECRET_TO_CLIENT',
  'STORE_SECRET_IN_LOCALSTORAGE',
  'INCLUDE_SECRET_IN_EXPORT',
  'CALL_OPENCLAW',
  'DISPATCH_COMMAND',
  'EXECUTE_ACTION',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateImplementationPlan(validationResult) {
  return {
    implementationPlanId: `plan-${validationResult.presenceRouteValidationId}-${Date.now()}`,
    sourcePresenceRouteValidationId: validationResult.presenceRouteValidationId,
    sourcePresenceRouteContractId: validationResult.sourcePresenceRouteContractId,
    sourcePresenceCheckPlanId: validationResult.sourcePresenceCheckPlanId,
    sourceEnvironmentBoundaryId: validationResult.sourceEnvironmentBoundaryId,
    sourceRouteContractId: validationResult.sourceRouteContractId,
    sourceRequestId: validationResult.sourceRequestId,
    generatedAt: new Date().toISOString(),
    implementationMode: 'BACKEND_PRESENCE_CHECK_IMPLEMENTATION_PLAN',
    plannedRoute: '/api/openclaw/read-only/env-presence-check',
    plannedMethod: 'POST',
    plannedBackendBehavior: 'CHECK_ENV_KEY_PRESENCE_ONLY',
    plannedEnvKeys: PLANNED_ENV_KEYS,
    allowedReturnShape: {
      routeStatus: 'READY | MISSING_REQUIRED_ENV | BLOCKED_BY_SECRET_POLICY',
      checkedAt: 'ISO_TIMESTAMP',
      keys: PLANNED_ENV_KEYS.map(k => ({
        keyName: k,
        present: 'boolean',
        value: 'REDACTED_NEVER_RETURNED',
      })),
      secretValuesReturned: false,
    },
    prohibitedImplementationBehaviors: PROHIBITED_BEHAVIORS,
    implementationAllowedNow: false,
    processEnvAccessAllowedInFrontend: false,
    processEnvAccessAllowedInBackendFutureOnly: true,
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

export default function OpenClawBackendPresenceCheckImplementationPlan() {
  const [plans, setPlans] = useState(() => loadJSON(IMPLEMENTATION_PLAN_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  const handleGenerate = () => {
    try {
      const validationBatches = loadJSON(VALIDATION_RESULTS_KEY, []);

      if (validationBatches.length === 0) {
        setLastAction('No Phase 42 validation results found');
        return;
      }

      const latestBatch = validationBatches[0];

      if (!latestBatch.validationResults || latestBatch.validationResults.length === 0) {
        setLastAction('No validation results in latest batch');
        return;
      }

      // Filter for valid PASS results only
      const eligibleResults = latestBatch.validationResults.filter(
        r =>
          r.validationStatus === 'PASS' &&
          r.secretSafetyStatus === 'LOCKED' &&
          r.futureBackendImplementationEligible === true &&
          r.actualExecutionStatus === 'NOT_EXECUTED'
      );

      if (eligibleResults.length === 0) {
        setLastAction('No eligible PASS results found (validationStatus=PASS, secretSafetyStatus=LOCKED, futureBackendImplementationEligible=true required)');
        return;
      }

      const generatedPlans = eligibleResults.map(r => generateImplementationPlan(r));

      const planBatch = {
        planBatchId: `batch-${Date.now()}`,
        planType: 'PHASE_43_BACKEND_PRESENCE_CHECK_IMPLEMENTATION_PLAN',
        generatedAt: new Date().toISOString(),
        sourceValidationBatchId: latestBatch.validationBatchId,
        totalImplementationPlans: generatedPlans.length,
        implementationPlans: generatedPlans,
      };

      try {
        localStorage.setItem(IMPLEMENTATION_PLAN_KEY, JSON.stringify([planBatch, ...plans].slice(0, 50)));
      } catch {}

      setPlans([planBatch, ...plans].slice(0, 50));
      setLastAction(`Generated ${generatedPlans.length} implementation plans from eligible PASS validation results`);
    } catch (err) {
      setLastAction('Plan generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (plans.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(plans[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest implementation plan batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(IMPLEMENTATION_PLAN_KEY);
      setPlans([]);
      setLastAction('All implementation plans cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = plans.length > 0 ? plans[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 43 · Backend Presence Check Implementation Plan</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Presence Check Implementation Plan
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Creates a local-only implementation plan for the future backend presence-check route after Phase 42 validation. Does not implement the route.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_43_BACKEND_PRESENCE_CHECK_IMPLEMENTATION_PLAN</span>
      </div>

      {/* Summary stats */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Plans</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalImplementationPlans}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Planned Env Keys</div>
            <div className="text-[18px] font-bold text-primary">{PLANNED_ENV_KEYS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Prohibited Behaviors</div>
            <div className="text-[18px] font-bold text-destructive">{PROHIBITED_BEHAVIORS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Plan specification */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Implementation Plan Specification</span>
        </div>
        <div className="px-4 py-3 text-[8px] space-y-1">
          {[
            ['Mode', 'BACKEND_PRESENCE_CHECK_IMPLEMENTATION_PLAN', 'text-primary'],
            ['Planned Route', '/api/openclaw/read-only/env-presence-check', 'text-primary'],
            ['Planned Method', 'POST', 'text-primary'],
            ['Planned Behavior', 'CHECK_ENV_KEY_PRESENCE_ONLY', 'text-primary'],
            ['Implementation Allowed Now', 'false', 'text-destructive'],
            ['process.env (Frontend)', 'false', 'text-destructive'],
            ['process.env (Backend, Future Only)', 'true — BOOLEAN PRESENCE ONLY', 'text-amber-500'],
            ['Secret Exposure', 'false', 'text-destructive'],
            ['Backend-Only Secret Access', 'true', 'text-primary'],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">{label}: <span className={`font-mono font-semibold ${color}`}>{value}</span></span>
            </div>
          ))}
          <div className="flex items-start gap-2 mt-1">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
            <span className="text-slate-300">Planned Keys: <span className="font-mono font-semibold text-primary">{PLANNED_ENV_KEYS.join(', ')}</span></span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <span className="text-slate-300">Prohibited Behaviors: <span className="font-mono font-semibold text-destructive">{PROHIBITED_BEHAVIORS.join(', ')}</span></span>
          </div>
        </div>
      </div>

      {/* Last action */}
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
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Backend Presence Check Implementation Plan
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Implementation Plan JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={plans.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Plans
        </button>
      </div>

      {/* Plans table */}
      {latestBatch && latestBatch.implementationPlans && latestBatch.implementationPlans.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Implementation Plans ({latestBatch.implementationPlans.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Impl. Allowed Now</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.implementationPlans.map((plan, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{plan.sourceRequestId || '—'}</td>
                    <td className="px-3 py-2.5 text-primary font-semibold text-[8px]">/env-presence-check</td>
                    <td className="px-3 py-2.5 text-destructive font-bold text-[7px]">{String(plan.implementationAllowedNow)}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{plan.safetyLockStatus}</td>
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
          {expandedPlan !== null && latestBatch.implementationPlans[expandedPlan] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Implementation Plan Details — {latestBatch.implementationPlans[expandedPlan].sourceRequestId || latestBatch.implementationPlans[expandedPlan].implementationPlanId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.implementationPlans[expandedPlan], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Implementation Plan Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is an implementation plan only. It does NOT implement the backend route, access process.env, read actual secret values, call backend functions, call OpenClaw, or dispatch commands. It does not trade, enter credentials, schedule, poll, use browser automation, use wallets, or move money.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This is an implementation plan only',
            'Does not implement the backend route',
            'Does not access process.env',
            'Does not read actual secret values',
            'Does not call backend functions',
            'Does not call OpenClaw',
            'Does not dispatch commands',
            'Does not trade, enter credentials, schedule, poll, or move money',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Implementation Plan Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{IMPLEMENTATION_PLAN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only implementation plan. No fetch, no OpenClaw calls, no backend calls, no process.env, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}