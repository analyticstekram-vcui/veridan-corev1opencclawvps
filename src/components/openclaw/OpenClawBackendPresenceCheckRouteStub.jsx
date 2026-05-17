/**
 * OpenClawBackendPresenceCheckRouteStub — Phase 44
 * Creates the first locked backend route stub for the future OpenClaw environment presence check.
 * No process.env access, no secret reading, no backend API calls, no route implementation. Stub only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const IMPLEMENTATION_PLAN_KEY = 'openclawPhase43BackendPresenceCheckImplementationPlans';
const ROUTE_STUB_KEY = 'openclawPhase44BackendPresenceCheckRouteStubs';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateRouteStub(plan) {
  return {
    routeStubId: `stub-${plan.implementationPlanId}-${Date.now()}`,
    sourceImplementationPlanId: plan.implementationPlanId,
    sourcePresenceRouteValidationId: plan.sourcePresenceRouteValidationId,
    sourcePresenceRouteContractId: plan.sourcePresenceRouteContractId,
    sourcePresenceCheckPlanId: plan.sourcePresenceCheckPlanId,
    sourceEnvironmentBoundaryId: plan.sourceEnvironmentBoundaryId,
    sourceRouteContractId: plan.sourceRouteContractId,
    sourceRequestId: plan.sourceRequestId,
    generatedAt: new Date().toISOString(),
    stubMode: 'BACKEND_ROUTE_STUB_ONLY',
    plannedRoute: '/api/openclaw/read-only/env-presence-check',
    plannedMethod: 'POST',
    stubResponseShape: {
      routeStatus: 'STUB_ONLY',
      checkedAt: 'ISO_TIMESTAMP',
      keys: [],
      secretValuesReturned: false,
      actualEnvReadPerformed: false,
      openClawCalled: false,
      backendRouteImplemented: false,
      executionPerformed: false,
    },
    implementationStatus: 'STUB_ONLY_NOT_IMPLEMENTED',
    processEnvAccessPerformed: false,
    secretValueReadPerformed: false,
    secretValueReturned: false,
    openClawCallPerformed: false,
    backendCallPerformed: false,
    apiCallPerformed: false,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawBackendPresenceCheckRouteStub() {
  const [stubs, setStubs] = useState(() => loadJSON(ROUTE_STUB_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedStub, setExpandedStub] = useState(null);

  const handleGenerate = () => {
    try {
      const planBatches = loadJSON(IMPLEMENTATION_PLAN_KEY, []);

      if (planBatches.length === 0) {
        setLastAction('No Phase 43 implementation plans found');
        return;
      }

      const latestBatch = planBatches[0];

      if (!latestBatch.implementationPlans || latestBatch.implementationPlans.length === 0) {
        setLastAction('No implementation plans in latest batch');
        return;
      }

      // Filter for valid plans only
      const eligiblePlans = latestBatch.implementationPlans.filter(
        p =>
          p.implementationMode === 'BACKEND_PRESENCE_CHECK_IMPLEMENTATION_PLAN' &&
          p.plannedRoute === '/api/openclaw/read-only/env-presence-check' &&
          p.plannedMethod === 'POST' &&
          p.plannedBackendBehavior === 'CHECK_ENV_KEY_PRESENCE_ONLY' &&
          p.implementationAllowedNow === false &&
          p.processEnvAccessAllowedInFrontend === false &&
          p.processEnvAccessAllowedInBackendFutureOnly === true &&
          p.secretValueExposureAllowed === false &&
          p.clientSideSecretAccessAllowed === false &&
          p.backendOnlySecretAccessRequired === true &&
          p.openClawCallAllowed === false &&
          p.backendCallAllowed === false &&
          p.apiCallAllowed === false &&
          p.executionAllowed === false &&
          p.dispatchAllowed === false &&
          p.dryRunOnly === true &&
          p.actualExecutionStatus === 'NOT_EXECUTED' &&
          p.safetyLockStatus === 'LOCKED'
      );

      if (eligiblePlans.length === 0) {
        setLastAction('No eligible implementation plans found — all 18 safety flags must match');
        return;
      }

      const generatedStubs = eligiblePlans.map(p => generateRouteStub(p));

      const stubBatch = {
        stubBatchId: `batch-${Date.now()}`,
        stubType: 'PHASE_44_BACKEND_PRESENCE_CHECK_ROUTE_STUB',
        generatedAt: new Date().toISOString(),
        sourceImplementationPlanBatchId: latestBatch.planBatchId,
        totalRouteStubs: generatedStubs.length,
        routeStubs: generatedStubs,
      };

      try {
        localStorage.setItem(ROUTE_STUB_KEY, JSON.stringify([stubBatch, ...stubs].slice(0, 50)));
      } catch {}

      setStubs([stubBatch, ...stubs].slice(0, 50));
      setLastAction(`Generated ${generatedStubs.length} route stubs from eligible implementation plans`);
    } catch (err) {
      setLastAction('Stub generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (stubs.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(stubs[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest stub batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(ROUTE_STUB_KEY);
      setStubs([]);
      setLastAction('All route stubs cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = stubs.length > 0 ? stubs[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 44 · Backend Presence Check Route Stub</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Presence Check Route Stub
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Creates the first locked backend route stub for the future OpenClaw environment presence check. Does not implement the route or read secrets.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_44_BACKEND_PRESENCE_CHECK_ROUTE_STUB</span>
      </div>

      {/* Summary stats */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Stubs</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalRouteStubs}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Route Path</div>
            <div className="text-[9px] font-mono text-primary truncate">/env-presence-check</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Stub Mode</div>
            <div className="text-[9px] font-mono text-amber-500">STUB_ONLY</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Stub response shape spec */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Route Stub Specification</span>
        </div>
        <div className="px-4 py-3 text-[8px] space-y-1">
          {[
            ['Stub Mode', 'BACKEND_ROUTE_STUB_ONLY', 'text-primary'],
            ['Planned Route', '/api/openclaw/read-only/env-presence-check', 'text-primary'],
            ['Planned Method', 'POST', 'text-primary'],
            ['Implementation Status', 'STUB_ONLY_NOT_IMPLEMENTED', 'text-amber-500'],
            ['Stub routeStatus', 'STUB_ONLY', 'text-amber-500'],
            ['keys[]', '[] (empty — no env read performed)', 'text-slate-400'],
            ['secretValuesReturned', 'false', 'text-destructive'],
            ['actualEnvReadPerformed', 'false', 'text-destructive'],
            ['openClawCalled', 'false', 'text-destructive'],
            ['backendRouteImplemented', 'false', 'text-destructive'],
            ['executionPerformed', 'false', 'text-destructive'],
            ['safetyLockStatus', 'LOCKED', 'text-primary'],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">{label}: <span className={`font-mono font-semibold ${color}`}>{value}</span></span>
            </div>
          ))}
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
          Generate Backend Presence Check Route Stub
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Stub JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={stubs.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Stubs
        </button>
      </div>

      {/* Stubs table */}
      {latestBatch && latestBatch.routeStubs && latestBatch.routeStubs.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Route Stubs ({latestBatch.routeStubs.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Stub Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Impl. Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.routeStubs.map((stub, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{stub.sourceRequestId || '—'}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">{stub.stubMode}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">{stub.implementationStatus}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{stub.safetyLockStatus}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedStub(expandedStub === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedStub === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded stub details */}
          {expandedStub !== null && latestBatch.routeStubs[expandedStub] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Route Stub Details — {latestBatch.routeStubs[expandedStub].sourceRequestId || latestBatch.routeStubs[expandedStub].routeStubId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.routeStubs[expandedStub], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Route Stub Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is a route stub only. It does NOT implement the backend route, access process.env, read actual secret values, call backend functions, call OpenClaw, or dispatch commands. It does not trade, enter credentials, schedule, poll, use browser automation, use wallets, or move money.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This is a route stub only',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Route Stub Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{ROUTE_STUB_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only route stub. No fetch, no OpenClaw calls, no backend calls, no process.env, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}