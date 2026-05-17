/**
 * OpenClawBackendPresenceCheckActivationLock — Phase 45
 * Final local-only activation lock before any real backend environment presence check route is implemented.
 * No process.env access, no secret reading, no backend API calls, no route implementation. Lock only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown, Lock } from 'lucide-react';

const ROUTE_STUB_KEY = 'openclawPhase44BackendPresenceCheckRouteStubs';
const ACTIVATION_LOCK_KEY = 'openclawPhase45BackendPresenceCheckActivationLocks';

const PROHIBITED_FUTURE_BEHAVIORS = [
  'RETURN_SECRET_VALUE',
  'LOG_SECRET_VALUE',
  'SEND_SECRET_TO_CLIENT',
  'STORE_SECRET_IN_LOCALSTORAGE',
  'CALL_OPENCLAW',
  'DISPATCH_COMMAND',
  'EXECUTE_ACTION',
  'TRADE',
  'MOVE_MONEY',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateActivationLock(stub) {
  return {
    activationLockId: `lock-${stub.routeStubId}-${Date.now()}`,
    sourceRouteStubId: stub.routeStubId,
    sourceImplementationPlanId: stub.sourceImplementationPlanId,
    sourcePresenceRouteValidationId: stub.sourcePresenceRouteValidationId,
    sourcePresenceRouteContractId: stub.sourcePresenceRouteContractId,
    sourcePresenceCheckPlanId: stub.sourcePresenceCheckPlanId,
    sourceEnvironmentBoundaryId: stub.sourceEnvironmentBoundaryId,
    sourceRouteContractId: stub.sourceRouteContractId,
    sourceRequestId: stub.sourceRequestId,
    generatedAt: new Date().toISOString(),
    activationLockMode: 'BACKEND_PRESENCE_CHECK_ACTIVATION_LOCK',
    lockedRoute: '/api/openclaw/read-only/env-presence-check',
    nextAllowedPhase: 'PHASE_46_BACKEND_ENV_PRESENCE_BOOLEAN_ROUTE',
    activationStatus: 'LOCKED_PENDING_OPERATOR_CONFIRMATION',
    backendImplementationAllowedNow: false,
    processEnvAccessAllowedNow: false,
    secretValueReadAllowed: false,
    secretValueReturnAllowed: false,
    openClawCallAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    tradingAllowed: false,
    moneyMovementAllowed: false,
    allowedFutureBackendBehavior: 'BOOLEAN_ENV_KEY_PRESENCE_ONLY',
    allowedFutureResponseShape: {
      keyName: 'ENV_KEY_NAME',
      present: 'true/false',
      value: 'REDACTED_NEVER_RETURNED',
      secretValuesReturned: false,
    },
    prohibitedFutureBehaviors: PROHIBITED_FUTURE_BEHAVIORS,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawBackendPresenceCheckActivationLock() {
  const [locks, setLocks] = useState(() => loadJSON(ACTIVATION_LOCK_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedLock, setExpandedLock] = useState(null);

  const handleGenerate = () => {
    try {
      const stubBatches = loadJSON(ROUTE_STUB_KEY, []);

      if (stubBatches.length === 0) {
        setLastAction('No Phase 44 route stubs found');
        return;
      }

      const latestBatch = stubBatches[0];

      if (!latestBatch.routeStubs || latestBatch.routeStubs.length === 0) {
        setLastAction('No route stubs in latest batch');
        return;
      }

      // Filter for valid stubs only — all 17 safety flags must match
      const eligibleStubs = latestBatch.routeStubs.filter(
        s =>
          s.stubMode === 'BACKEND_ROUTE_STUB_ONLY' &&
          s.plannedRoute === '/api/openclaw/read-only/env-presence-check' &&
          s.plannedMethod === 'POST' &&
          s.implementationStatus === 'STUB_ONLY_NOT_IMPLEMENTED' &&
          s.processEnvAccessPerformed === false &&
          s.secretValueReadPerformed === false &&
          s.secretValueReturned === false &&
          s.openClawCallPerformed === false &&
          s.backendCallPerformed === false &&
          s.apiCallPerformed === false &&
          s.dispatchPerformed === false &&
          s.executionPerformed === false &&
          s.tradingPerformed === false &&
          s.moneyMovementPerformed === false &&
          s.dryRunOnly === true &&
          s.actualExecutionStatus === 'NOT_EXECUTED' &&
          s.safetyLockStatus === 'LOCKED'
      );

      if (eligibleStubs.length === 0) {
        setLastAction('No eligible route stubs found — all 17 safety flags must match');
        return;
      }

      const generatedLocks = eligibleStubs.map(s => generateActivationLock(s));

      const lockBatch = {
        lockBatchId: `batch-${Date.now()}`,
        lockType: 'PHASE_45_BACKEND_PRESENCE_CHECK_ACTIVATION_LOCK',
        generatedAt: new Date().toISOString(),
        sourceRouteStubBatchId: latestBatch.stubBatchId,
        totalActivationLocks: generatedLocks.length,
        activationLocks: generatedLocks,
      };

      try {
        localStorage.setItem(ACTIVATION_LOCK_KEY, JSON.stringify([lockBatch, ...locks].slice(0, 50)));
      } catch {}

      setLocks([lockBatch, ...locks].slice(0, 50));
      setLastAction(`Generated ${generatedLocks.length} activation locks from eligible route stubs`);
    } catch (err) {
      setLastAction('Activation lock generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (locks.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(locks[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest activation lock batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(ACTIVATION_LOCK_KEY);
      setLocks([]);
      setLastAction('All activation locks cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = locks.length > 0 ? locks[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 45 · Backend Presence Check Activation Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Backend Presence Check Activation Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Final local-only activation lock before any real backend environment presence check route is implemented. Prepares checkpoint for Phase 46.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <Lock className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_45_BACKEND_PRESENCE_CHECK_ACTIVATION_LOCK</span>
      </div>

      {/* Summary stats */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Locks</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalActivationLocks}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Locked Route</div>
            <div className="text-[9px] font-mono text-primary truncate">/env-presence-check</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Activation Status</div>
            <div className="text-[8px] font-mono text-amber-500 truncate">LOCKED_PENDING</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Activation lock specification */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Activation Lock Specification</span>
        </div>
        <div className="px-4 py-3 text-[8px] space-y-1">
          {[
            ['Lock Mode', 'BACKEND_PRESENCE_CHECK_ACTIVATION_LOCK', 'text-primary'],
            ['Locked Route', '/api/openclaw/read-only/env-presence-check', 'text-primary'],
            ['Next Allowed Phase', 'PHASE_46_BACKEND_ENV_PRESENCE_BOOLEAN_ROUTE', 'text-amber-500'],
            ['Activation Status', 'LOCKED_PENDING_OPERATOR_CONFIRMATION', 'text-amber-500'],
            ['Backend Impl. Allowed Now', 'false', 'text-destructive'],
            ['process.env Allowed Now', 'false', 'text-destructive'],
            ['Secret Value Read Allowed', 'false', 'text-destructive'],
            ['Secret Value Return Allowed', 'false', 'text-destructive'],
            ['Allowed Future Behavior', 'BOOLEAN_ENV_KEY_PRESENCE_ONLY', 'text-primary'],
            ['Future value field', 'REDACTED_NEVER_RETURNED', 'text-destructive'],
            ['safetyLockStatus', 'LOCKED', 'text-primary'],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">{label}: <span className={`font-mono font-semibold ${color}`}>{value}</span></span>
            </div>
          ))}
          <div className="flex items-start gap-2 mt-1">
            <CheckCircle2 className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <span className="text-slate-300">Prohibited Future Behaviors: <span className="font-mono font-semibold text-destructive">{PROHIBITED_FUTURE_BEHAVIORS.join(', ')}</span></span>
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
          <Lock className="w-3.5 h-3.5" />
          Generate Backend Presence Check Activation Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Activation Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={locks.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Locks
        </button>
      </div>

      {/* Locks table */}
      {latestBatch && latestBatch.activationLocks && latestBatch.activationLocks.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Activation Locks ({latestBatch.activationLocks.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Activation Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Next Phase</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.activationLocks.map((lock, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{lock.sourceRequestId || '—'}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">LOCKED_PENDING</td>
                    <td className="px-3 py-2.5 text-primary font-mono text-[7px]">PHASE_46</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{lock.safetyLockStatus}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedLock(expandedLock === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedLock === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded lock details */}
          {expandedLock !== null && latestBatch.activationLocks[expandedLock] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Activation Lock Details — {latestBatch.activationLocks[expandedLock].sourceRequestId || latestBatch.activationLocks[expandedLock].activationLockId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.activationLocks[expandedLock], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Activation Lock Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is an activation lock only. It does NOT implement the backend route, access process.env, read actual secret values, call backend functions, call OpenClaw, or dispatch commands. It only prepares the final checkpoint before Phase 46.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This is an activation lock only',
            'Does not implement the backend route',
            'Does not access process.env',
            'Does not read actual secret values',
            'Does not call backend functions',
            'Does not call OpenClaw',
            'Does not dispatch commands',
            'Does not trade, enter credentials, schedule, poll, or move money',
            'Only prepares the final checkpoint before Phase 46',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Activation Lock Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{ACTIVATION_LOCK_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only activation lock. No fetch, no OpenClaw calls, no backend calls, no process.env, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}