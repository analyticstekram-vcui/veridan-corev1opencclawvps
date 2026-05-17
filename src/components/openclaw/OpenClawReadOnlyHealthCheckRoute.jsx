/**
 * OpenClawReadOnlyHealthCheckRoute — Phase 50
 * First controlled read-only OpenClaw health check route.
 * Invokes only openclawHealthCheck backend function — which calls only GET /health.
 * Secret values are never returned, displayed, or stored.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, Loader2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PHASE49_LOCKS_KEY = 'openclawPhase49HealthCheckActivationLocks';
const RESULTS_KEY = 'openclawPhase50OpenClawReadOnlyHealthCheckResults';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function findValidActivationLock() {
  const batches = loadJSON(PHASE49_LOCKS_KEY, []);
  for (const batch of batches) {
    const lock = (batch.activationLocks || []).find(l =>
      l.activationLockMode === 'OPENCLAW_HEALTH_CHECK_ACTIVATION_LOCK' &&
      l.lockedBackendRoute === '/api/openclaw/read-only/health-check' &&
      l.lockedOpenClawEndpoint === '/health' &&
      l.lockedOpenClawMethod === 'GET' &&
      l.nextAllowedPhase === 'PHASE_50_OPENCLAW_READ_ONLY_HEALTH_CHECK_ROUTE' &&
      l.activationStatus === 'LOCKED_PENDING_OPERATOR_CONFIRMATION' &&
      l.backendImplementationAllowedNow === false &&
      l.openClawCallAllowedNow === false &&
      l.secretValueExposureAllowed === false &&
      l.dispatchAllowed === false &&
      l.executionAllowed === false &&
      l.tradingAllowed === false &&
      l.moneyMovementAllowed === false &&
      l.allowedFutureBackendBehavior === 'READ_ONLY_OPENCLAW_HEALTH_CHECK' &&
      l.dryRunOnly === true &&
      l.actualExecutionStatus === 'NOT_EXECUTED' &&
      l.safetyLockStatus === 'LOCKED'
    );
    if (lock) return lock;
  }
  return null;
}

const ROUTE_STATUS_STYLES = {
  READY: 'text-primary border-primary/30 bg-primary/5',
  OPENCLAW_UNREACHABLE: 'text-destructive border-destructive/30 bg-destructive/5',
  MISSING_REQUIRED_ENV: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  BLOCKED_BY_POLICY: 'text-destructive border-destructive/30 bg-destructive/5',
};

const HEALTH_STATUS_STYLES = {
  HEALTHY: 'text-primary',
  UNHEALTHY: 'text-destructive',
  UNKNOWN: 'text-amber-500',
};

export default function OpenClawReadOnlyHealthCheckRoute() {
  const [results, setResults] = useState(() => loadJSON(RESULTS_KEY, []));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const validLock = findValidActivationLock();
  const canRun = Boolean(validLock);
  const latestResult = results.length > 0 ? results[0] : null;

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setLastAction(null);
    try {
      const response = await base44.functions.invoke('openclawHealthCheck', {});
      const data = response.data;

      const record = {
        recordId: `phase50-${Date.now()}`,
        invokedAt: new Date().toISOString(),
        sourceActivationLockId: validLock.healthCheckActivationLockId,
        result: data,
      };

      const updated = [record, ...results].slice(0, 50);
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(updated));
      } catch {}

      setResults(updated);
      setLastAction(`Health check complete — routeStatus: ${data.routeStatus}, openClawHealthStatus: ${data.openClawHealthStatus}`);
    } catch (err) {
      setLastAction('Health check failed: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!latestResult) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest result copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(RESULTS_KEY);
      setResults([]);
      setLastAction('All results cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const r = latestResult?.result;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 50 · OpenClaw Read-Only Health Check Route</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Read-Only Health Check Route
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">First controlled read-only OpenClaw health check. Calls only GET /health. Secret values never returned.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_50_OPENCLAW_READ_ONLY_HEALTH_CHECK_ROUTE</span>
      </div>

      {/* Phase 49 lock gate */}
      <div className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${canRun ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
        {canRun
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${canRun ? 'text-primary' : 'text-destructive'}`}>
            {canRun ? 'Phase 49 Activation Lock — FOUND' : 'Phase 49 Activation Lock — NOT FOUND'}
          </div>
          <div className="text-[8px] text-slate-400 mt-0.5">
            {canRun
              ? `Lock ID: ${validLock.healthCheckActivationLockId} — All 17 gate conditions satisfied`
              : 'Generate a Phase 49 activation lock first before running the health check'}
          </div>
        </div>
      </div>

      {/* Latest result summary grid */}
      {r && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className={`border rounded-lg px-4 py-3 ${ROUTE_STATUS_STYLES[r.routeStatus] || 'border-border bg-card'}`}>
            <div className="text-[8px] uppercase tracking-widest font-semibold mb-1 opacity-70">Route Status</div>
            <div className="text-[9px] font-bold">{r.routeStatus}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">HTTP Status</div>
            <div className="text-[18px] font-bold text-primary">{r.httpStatus ?? '—'}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">OpenClaw Health</div>
            <div className={`text-[10px] font-bold ${HEALTH_STATUS_STYLES[r.openClawHealthStatus] || 'text-slate-400'}`}>{r.openClawHealthStatus}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Checked At</div>
            <div className="text-[8px] font-mono text-slate-300">{r.checkedAt ? new Date(r.checkedAt).toLocaleTimeString() : '—'}</div>
          </div>
        </div>
      )}

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
          onClick={handleRun}
          disabled={!canRun || loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {loading ? 'Checking…' : 'Run OpenClaw Read-Only Health Check'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Health Check Result JSON'}
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

      {/* Full result fields table */}
      {r && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Health Check Result Fields</span>
            <span className="text-[8px] font-mono text-slate-500">{latestResult.invokedAt}</span>
          </div>
          <div className="divide-y divide-border/20">
            {[
              ['routeStatus', r.routeStatus],
              ['checkedAt', r.checkedAt],
              ['backendRoute', r.backendRoute],
              ['openClawEndpoint', r.openClawEndpoint],
              ['openClawMethod', r.openClawMethod],
              ['openClawReachable', String(r.openClawReachable)],
              ['openClawHealthStatus', r.openClawHealthStatus],
              ['httpStatus', String(r.httpStatus ?? 'null')],
              ['secretValuesReturned', String(r.secretValuesReturned)],
              ['openClawResponseRedacted', String(r.openClawResponseRedacted)],
              ['dispatchPerformed', String(r.dispatchPerformed)],
              ['executionPerformed', String(r.executionPerformed)],
              ['tradingPerformed', String(r.tradingPerformed)],
              ['moneyMovementPerformed', String(r.moneyMovementPerformed)],
              ['backendCheckMode', r.backendCheckMode],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center px-4 py-2 text-[8px]">
                <span className="w-48 text-slate-500 font-mono shrink-0">{label}</span>
                <span className="font-mono font-semibold text-primary">{val}</span>
              </div>
            ))}
          </div>
          {/* Response summary */}
          {r.responseSummary && (
            <div className="px-4 py-3 border-t border-border/30 bg-secondary/5">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">responseSummary</div>
              <div className="space-y-1 text-[8px]">
                {Object.entries(r.responseSummary).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-slate-400 font-mono">{k}: <span className="font-bold text-primary">{String(v)}</span></span>
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
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Health Check Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This route only calls OpenClaw /health',
            'Secret values are never returned',
            'Raw OpenClaw response body is not exposed',
            'No dispatch occurs',
            'No execution occurs',
            'No trading occurs',
            'No browser automation occurs',
            'No scheduler or polling occurs',
            'No wallet or money movement occurs',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest result JSON */}
      {latestResult && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Health Check Result — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{latestResult.invokedAt}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestResult, null, 2)}
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
        Only calls GET /health. No secret values returned. No dispatch, execution, trading, or money movement. Gated by Phase 49 activation lock.
      </div>
    </div>
  );
}