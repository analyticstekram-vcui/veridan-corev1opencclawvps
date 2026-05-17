/**
 * OpenClawStatusVersionCapabilitiesReadOnlyRoute — Phase 54
 * Controlled read-only OpenClaw status/version/capabilities route.
 * Invokes only openclawStatusVersionCapabilities backend function.
 * Calls only GET /status, GET /version, GET /capabilities.
 * Secret values never returned, displayed, or stored.
 * Raw OpenClaw response bodies never exposed.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, CheckCircle2, Trash2, ShieldCheck, Loader2, XCircle } from 'lucide-react';

const PHASE53_LOCKS_KEY = 'openclawPhase53StatusVersionCapabilitiesActivationLocks';
const RESULTS_KEY = 'openclawPhase54StatusVersionCapabilitiesReadOnlyResults';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function findValidActivationLock() {
  const batches = loadJSON(PHASE53_LOCKS_KEY, []);
  for (const batch of batches) {
    const lock = (batch.activationLocks || []).find(l =>
      l.activationLockMode === 'OPENCLAW_STATUS_VERSION_CAPABILITIES_ACTIVATION_LOCK' &&
      l.lockedBackendRoute === '/api/openclaw/read-only/status-version-capabilities' &&
      Array.isArray(l.lockedOpenClawEndpoints) &&
      l.lockedOpenClawEndpoints.includes('/status') &&
      l.lockedOpenClawEndpoints.includes('/version') &&
      l.lockedOpenClawEndpoints.includes('/capabilities') &&
      l.lockedOpenClawMethod === 'GET' &&
      l.nextAllowedPhase === 'PHASE_54_OPENCLAW_STATUS_VERSION_CAPABILITIES_READ_ONLY_ROUTE' &&
      l.activationStatus === 'LOCKED_PENDING_OPERATOR_CONFIRMATION' &&
      l.backendImplementationAllowedNow === false &&
      l.openClawCallAllowedNow === false &&
      l.secretValueExposureAllowed === false &&
      l.rawResponseExposureAllowed === false &&
      l.dispatchAllowed === false &&
      l.executionAllowed === false &&
      l.tradingAllowed === false &&
      l.moneyMovementAllowed === false &&
      l.browserAutomationAllowed === false &&
      l.schedulerAllowed === false &&
      l.pollingAllowed === false &&
      l.allowedFutureBackendBehavior === 'READ_ONLY_OPENCLAW_STATUS_VERSION_CAPABILITIES' &&
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

function SummaryCellRow({ label, summary }) {
  if (!summary) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-1.5">
      <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className="flex flex-wrap gap-1.5 text-[8px]">
        <span className={`font-bold px-1.5 py-0.5 rounded border ${summary.reachable ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
          {summary.reachable ? 'REACHABLE' : 'UNREACHABLE'}
        </span>
        <span className="font-mono text-foreground px-1.5 py-0.5 border border-border rounded">HTTP {summary.httpStatus ?? '—'}</span>
        <span className="text-slate-400 px-1.5 py-0.5 border border-border/40 rounded">{summary.summaryType}</span>
      </div>
    </div>
  );
}

export default function OpenClawStatusVersionCapabilitiesReadOnlyRoute() {
  const [results, setResults] = useState(() => loadJSON(RESULTS_KEY, []));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const validLock = findValidActivationLock();
  const canRun = Boolean(validLock);
  const latestResult = results.length > 0 ? results[0] : null;
  const r = latestResult?.result;

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setLastAction(null);
    const response = await base44.functions.invoke('openclawStatusVersionCapabilities', {});
    const data = response.data;

    const record = {
      recordId: `phase54-${Date.now()}`,
      invokedAt: new Date().toISOString(),
      sourceActivationLockId: validLock.svcActivationLockId,
      result: data,
    };

    const updated = [record, ...results].slice(0, 50);
    try { localStorage.setItem(RESULTS_KEY, JSON.stringify(updated)); } catch {}
    setResults(updated);
    setLoading(false);
    setLastAction(`Check complete — routeStatus: ${data.routeStatus}, backendCheckMode: ${data.backendCheckMode}`);
  };

  const handleCopy = () => {
    if (!latestResult) return;
    navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest result copied to clipboard');
    });
  };

  const handleClear = () => {
    try { localStorage.removeItem(RESULTS_KEY); } catch {}
    setResults([]);
    setLastAction('All results cleared from localStorage');
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 54 · OpenClaw Status / Version / Capabilities Read-Only Route</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Status / Version / Capabilities Read-Only Route
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Controlled read-only check of OpenClaw /status, /version, /capabilities. Secret values never returned. Raw response bodies never exposed.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_54_OPENCLAW_STATUS_VERSION_CAPABILITIES_READ_ONLY_ROUTE</span>
      </div>

      {/* Phase 53 lock gate */}
      <div className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${canRun ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
        {canRun
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${canRun ? 'text-primary' : 'text-destructive'}`}>
            {canRun ? 'Phase 53 Activation Lock — FOUND' : 'Phase 53 Activation Lock — NOT FOUND'}
          </div>
          <div className="text-[8px] text-slate-400 mt-0.5">
            {canRun
              ? `Lock ID: ${validLock.svcActivationLockId} — All 21 gate conditions satisfied`
              : 'Generate a Phase 53 activation lock first before running the check'}
          </div>
        </div>
      </div>

      {/* Latest result summary */}
      {r && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className={`border rounded-lg px-4 py-3 ${ROUTE_STATUS_STYLES[r.routeStatus] || 'border-border bg-card'}`}>
              <div className="text-[8px] uppercase tracking-widest font-semibold mb-1 opacity-70">Route Status</div>
              <div className="text-[9px] font-bold">{r.routeStatus}</div>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Backend Mode</div>
              <div className="text-[8px] font-mono font-bold text-primary">{r.backendCheckMode}</div>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Checked At</div>
              <div className="text-[8px] font-mono text-slate-300">{r.checkedAt ? new Date(r.checkedAt).toLocaleTimeString() : '—'}</div>
            </div>
            <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Endpoints</div>
              <div className="text-[8px] font-mono text-primary">{r.openClawEndpoints?.length ?? 0} locked</div>
            </div>
          </div>

          {/* Per-endpoint summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <SummaryCellRow label="/status" summary={r.openClawStatusSummary} />
            <SummaryCellRow label="/version" summary={r.openClawVersionSummary} />
            <SummaryCellRow label="/capabilities" summary={r.openClawCapabilitiesSummary} />
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
          {loading ? 'Checking…' : 'Run OpenClaw Status / Version / Capabilities Read-Only Check'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Read-Only Result JSON'}
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Result Fields</span>
            <span className="text-[8px] font-mono text-slate-500">{latestResult.invokedAt}</span>
          </div>
          <div className="divide-y divide-border/20">
            {[
              ['routeStatus', r.routeStatus],
              ['checkedAt', r.checkedAt],
              ['backendRoute', r.backendRoute],
              ['openClawMethod', r.openClawMethod],
              ['openClawResponsesRedacted', String(r.openClawResponsesRedacted)],
              ['rawResponseBodiesReturned', String(r.rawResponseBodiesReturned)],
              ['secretValuesReturned', String(r.secretValuesReturned)],
              ['dispatchPerformed', String(r.dispatchPerformed)],
              ['executionPerformed', String(r.executionPerformed)],
              ['tradingPerformed', String(r.tradingPerformed)],
              ['moneyMovementPerformed', String(r.moneyMovementPerformed)],
              ['browserAutomationPerformed', String(r.browserAutomationPerformed)],
              ['schedulerPerformed', String(r.schedulerPerformed)],
              ['pollingPerformed', String(r.pollingPerformed)],
              ['backendCheckMode', r.backendCheckMode],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center px-4 py-2 text-[8px]">
                <span className="w-52 text-slate-500 font-mono shrink-0">{label}</span>
                <span className="font-mono font-semibold text-primary">{val}</span>
              </div>
            ))}
          </div>
          {/* openClawEndpoints */}
          {r.openClawEndpoints && (
            <div className="px-4 py-3 border-t border-border/20 flex items-start gap-3">
              <span className="w-52 text-slate-500 font-mono text-[8px] shrink-0">openClawEndpoints</span>
              <div className="flex flex-wrap gap-1.5">
                {r.openClawEndpoints.map(ep => (
                  <span key={ep} className="text-[8px] font-mono px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded">{ep}</span>
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
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Read-Only Route Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This route only calls OpenClaw /status, /version, and /capabilities',
            'Secret values are never returned',
            'Raw OpenClaw response bodies are not exposed',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Result — JSON</span>
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
        Only calls GET /status, /version, /capabilities. No secret values returned. No raw response bodies. No dispatch, execution, trading, or money movement. Gated by Phase 53 activation lock.
      </div>
    </div>
  );
}