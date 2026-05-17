/**
 * OpenClawBackendEnvPresenceBooleanRoute — Phase 46
 * First controlled backend presence check. Only returns boolean env key presence.
 * Secret values are never returned, displayed, logged, or stored.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ACTIVATION_LOCK_KEY = 'openclawPhase45BackendPresenceCheckActivationLocks';
const RESULTS_KEY = 'openclawPhase46BackendEnvPresenceBooleanResults';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function findValidActivationLock() {
  const batches = loadJSON(ACTIVATION_LOCK_KEY, []);
  if (batches.length === 0) return null;
  const latestBatch = batches[0];
  if (!latestBatch.activationLocks) return null;
  return latestBatch.activationLocks.find(
    l =>
      l.activationLockMode === 'BACKEND_PRESENCE_CHECK_ACTIVATION_LOCK' &&
      l.lockedRoute === '/api/openclaw/read-only/env-presence-check' &&
      l.nextAllowedPhase === 'PHASE_46_BACKEND_ENV_PRESENCE_BOOLEAN_ROUTE' &&
      l.activationStatus === 'LOCKED_PENDING_OPERATOR_CONFIRMATION' &&
      l.backendImplementationAllowedNow === false &&
      l.processEnvAccessAllowedNow === false &&
      l.secretValueReadAllowed === false &&
      l.secretValueReturnAllowed === false &&
      l.openClawCallAllowed === false &&
      l.dispatchAllowed === false &&
      l.executionAllowed === false &&
      l.tradingAllowed === false &&
      l.moneyMovementAllowed === false &&
      l.allowedFutureBackendBehavior === 'BOOLEAN_ENV_KEY_PRESENCE_ONLY' &&
      l.dryRunOnly === true &&
      l.actualExecutionStatus === 'NOT_EXECUTED' &&
      l.safetyLockStatus === 'LOCKED'
  ) || null;
}

const STATUS_COLORS = {
  READY: 'text-primary border-primary/30 bg-primary/5',
  MISSING_REQUIRED_ENV: 'text-destructive border-destructive/30 bg-destructive/5',
  BLOCKED_BY_SECRET_POLICY: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
};

export default function OpenClawBackendEnvPresenceBooleanRoute() {
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
      const response = await base44.functions.invoke('openclawEnvPresenceCheck', {});
      const data = response.data;

      const record = {
        recordId: `phase46-${Date.now()}`,
        invokedAt: new Date().toISOString(),
        sourceActivationLockId: validLock.activationLockId,
        result: data,
      };

      const updated = [record, ...results].slice(0, 50);
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(updated));
      } catch {}

      setResults(updated);
      setLastAction(`Presence check complete — routeStatus: ${data.routeStatus}`);
    } catch (err) {
      setLastAction('Check failed: ' + (err?.message || String(err)));
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

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 46 · Backend Env Presence Boolean Route</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Env Presence Boolean Route
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">First controlled backend presence check. Returns boolean env key presence only. Secret values are never returned.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_46_BACKEND_ENV_PRESENCE_BOOLEAN_ROUTE</span>
      </div>

      {/* Phase 45 lock gate */}
      <div className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${canRun ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
        {canRun
          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${canRun ? 'text-primary' : 'text-destructive'}`}>
            {canRun ? 'Phase 45 Activation Lock — FOUND' : 'Phase 45 Activation Lock — NOT FOUND'}
          </div>
          <div className="text-[8px] text-slate-400 mt-0.5">
            {canRun
              ? `Lock ID: ${validLock.activationLockId} — All 17 gate conditions satisfied`
              : 'Generate a Phase 45 activation lock first before running the backend presence check'}
          </div>
        </div>
      </div>

      {/* Latest result summary */}
      {latestResult?.result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className={`border rounded-lg px-4 py-3 ${STATUS_COLORS[latestResult.result.routeStatus] || 'border-border bg-card'}`}>
            <div className="text-[8px] uppercase tracking-widest font-semibold mb-1 opacity-70">Route Status</div>
            <div className="text-[10px] font-bold">{latestResult.result.routeStatus}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Keys Checked</div>
            <div className="text-[18px] font-bold text-primary">{latestResult.result.keys?.length ?? 0}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Present</div>
            <div className="text-[18px] font-bold text-primary">{latestResult.result.keys?.filter(k => k.present).length ?? 0}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Checked At</div>
            <div className="text-[9px] font-mono text-slate-300">{latestResult.result.checkedAt ? new Date(latestResult.result.checkedAt).toLocaleTimeString() : '—'}</div>
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
          {loading ? 'Checking…' : 'Run Backend Env Presence Boolean Check'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestResult}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Presence Result JSON'}
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

      {/* Keys result table */}
      {latestResult?.result?.keys && latestResult.result.keys.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Environment Key Presence Results</span>
            <span className="text-[8px] font-mono text-slate-500">{latestResult.result.checkedAt}</span>
          </div>
          <table className="w-full text-[8px]">
            <thead className="bg-secondary/10 border-b border-border/30">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Key Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Present</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {latestResult.result.keys.map((k, i) => (
                <tr key={i} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-slate-300">{k.keyName}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-bold ${k.present ? 'text-primary' : 'text-destructive'}`}>
                      {String(k.present)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-destructive font-semibold">{k.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Safety flags row */}
          <div className="px-4 py-3 border-t border-border/30 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
            {[
              ['secretValuesReturned', latestResult.result.secretValuesReturned],
              ['openClawCalled', latestResult.result.openClawCalled],
              ['dispatchPerformed', latestResult.result.dispatchPerformed],
              ['executionPerformed', latestResult.result.executionPerformed],
              ['tradingPerformed', latestResult.result.tradingPerformed],
              ['moneyMovementPerformed', latestResult.result.moneyMovementPerformed],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-400">{label}: <span className="font-bold text-primary">{String(val)}</span></span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-border/30 flex items-center gap-2 text-[8px]">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span className="text-slate-400">backendCheckMode: <span className="font-mono font-bold text-primary">{latestResult.result.backendCheckMode}</span></span>
          </div>
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Presence Check Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This route checks presence only',
            'Secret values are never returned',
            'Secret values are never displayed',
            'Secret values are never stored in localStorage',
            'OpenClaw is not called',
            'No dispatch occurs',
            'No execution occurs',
            'No trading or money movement occurs',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Presence Result — JSON</span>
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
        Boolean presence only. No secret values returned, displayed, or stored. No OpenClaw, no dispatch, no execution, no trading.
      </div>
    </div>
  );
}