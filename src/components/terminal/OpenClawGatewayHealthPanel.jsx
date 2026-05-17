/**
 * OpenClawGatewayHealthPanel
 * Focused, operator-friendly read-only health/status/version/capabilities
 * check panel for the main dashboard.
 *
 * Calls:
 *   - openclawHealthCheck        → GET /health
 *   - openclawStatusVersionCapabilities → GET /status + /version + /capabilities
 *
 * Does NOT:
 *   - Execute commands
 *   - Trade
 *   - Use browser automation
 *   - Access credentials
 *   - Move money
 *   - Write localStorage
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Activity, ShieldCheck } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusColor(ok, checking) {
  if (checking) return 'text-amber-400';
  return ok ? 'text-primary' : 'text-destructive';
}

function httpBadge(code) {
  if (!code) return { label: '—', cls: 'text-slate-500 border-slate-700 bg-slate-800/40' };
  if (code === 200) return { label: '200 OK', cls: 'text-primary border-primary/30 bg-primary/5' };
  if (code >= 300 && code < 400) return { label: `${code} REDIRECT`, cls: 'text-amber-400 border-amber-400/30 bg-amber-400/5' };
  if (code === 401 || code === 403) return { label: `${code} AUTH`, cls: 'text-amber-400 border-amber-400/30 bg-amber-400/5' };
  return { label: `${code} ERR`, cls: 'text-destructive border-destructive/30 bg-destructive/5' };
}

function EndpointRow({ path, result }) {
  if (!result) return null;
  const badge = httpBadge(result.httpStatus);
  const ok = result.reachable || result.openClawReachable;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 last:border-0">
      <span className="font-mono text-[10px] text-slate-400 w-28 shrink-0">{path}</span>
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border rounded-sm shrink-0 ${badge.cls}`}>{badge.label}</span>
      {ok
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0 ml-auto" />
        : <XCircle className="w-3 h-3 text-destructive shrink-0 ml-auto" />}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OpenClawGatewayHealthPanel() {
  const [healthResult, setHealthResult] = useState(null);
  const [svcResult, setSvcResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  const runChecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, sRes] = await Promise.all([
        base44.functions.invoke('openclawHealthCheck', {}),
        base44.functions.invoke('openclawStatusVersionCapabilities', {}),
      ]);
      setHealthResult(hRes.data);
      setSvcResult(sRes.data);
      setLastChecked(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  // Derive overall state
  const healthOk   = healthResult?.openClawReachable === true;
  const svcOk      = svcResult?.routeStatus === 'READY';
  const allOk      = healthOk && svcOk;
  const anyChecked = healthResult || svcResult;

  const overallLabel = !anyChecked ? 'NOT CHECKED'
    : allOk ? 'ONLINE — ALL ENDPOINTS REACHABLE'
    : (healthOk || svcOk) ? 'PARTIAL — SOME ENDPOINTS UNREACHABLE'
    : 'OFFLINE — GATEWAY UNREACHABLE';

  const overallColor = !anyChecked ? 'text-slate-500'
    : allOk ? 'text-primary'
    : (healthOk || svcOk) ? 'text-amber-400'
    : 'text-destructive';

  // Env presence: backend returns routeStatus='MISSING_REQUIRED_ENV' if any key is absent.
  // If we got a real HTTP response (httpStatus present), all 4 keys were present and used.
  const allEnvPresent = healthResult?.httpStatus != null;
  const envMissing    = healthResult?.routeStatus === 'MISSING_REQUIRED_ENV';
  const envFlags = healthResult ? [
    { k: 'GATEWAY_URL',      ok: allEnvPresent && !envMissing },
    { k: 'SERVICE_TOKEN',    ok: allEnvPresent && !envMissing },
    { k: 'CF_CLIENT_ID',     ok: allEnvPresent && !envMissing },
    { k: 'CF_CLIENT_SECRET', ok: allEnvPresent && !envMissing },
  ] : [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">GATEWAY HEALTH CHECK</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">read-only · no execution</span>
        <div className="ml-auto flex items-center gap-2">
          {lastChecked && (
            <span className="text-[9px] font-mono text-muted-foreground/40">
              {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={runChecks}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold border border-primary/40 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 rounded-sm"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking…' : 'Run Check'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-[10px] font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Overall Status */}
        <div className={`flex items-center gap-2 px-3 py-2.5 border rounded-sm ${allOk && anyChecked ? 'bg-primary/5 border-primary/20' : anyChecked ? 'bg-amber-500/5 border-amber-500/20' : 'bg-secondary/20 border-border/40'}`}>
          {!anyChecked
            ? <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            : allOk
              ? <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Overall Gateway Status</div>
            <div className={`text-[11px] font-mono font-bold ${overallColor}`}>{overallLabel}</div>
          </div>
        </div>

        {/* Not yet checked prompt */}
        {!anyChecked && !loading && !error && (
          <div className="text-[10px] font-mono text-muted-foreground/50 text-center py-4">
            Press <span className="text-primary">Run Check</span> to ping the OpenClaw gateway.
          </div>
        )}

        {/* Health Endpoint */}
        {healthResult && (
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase text-slate-300">GET /health</span>
              <span className={`text-[9px] font-mono font-bold ${healthOk ? 'text-primary' : 'text-destructive'}`}>
                {healthResult.openClawHealthStatus ?? (healthOk ? 'REACHABLE' : 'UNREACHABLE')}
              </span>
            </div>
            <EndpointRow path="/health" result={{
              reachable: healthResult.openClawReachable,
              httpStatus: healthResult.httpStatus,
            }} />
            {healthResult.responseSummary && (
              <div className="px-3 py-1.5 text-[9px] font-mono text-muted-foreground/70">
                {typeof healthResult.responseSummary === 'object'
                  ? JSON.stringify(healthResult.responseSummary)
                  : healthResult.responseSummary}
              </div>
            )}
          </div>
        )}

        {/* Status / Version / Capabilities */}
        {svcResult && (
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Status · Version · Capabilities</span>
              <span className={`text-[9px] font-mono font-bold ${svcOk ? 'text-primary' : 'text-amber-400'}`}>
                {svcResult.routeStatus}
              </span>
            </div>
            <EndpointRow path="/status"       result={svcResult.openClawStatusSummary} />
            <EndpointRow path="/version"      result={svcResult.openClawVersionSummary} />
            <EndpointRow path="/capabilities" result={svcResult.openClawCapabilitiesSummary} />
          </div>
        )}

        {/* Env Config Presence */}
        {envFlags.length > 0 && (
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
              <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Backend Config Presence</span>
              <span className="text-[8px] font-mono text-muted-foreground/40 ml-2">(values never returned)</span>
            </div>
            <div className="grid grid-cols-2 gap-0">
              {envFlags.map(({ k, ok }) => (
                <div key={k} className="flex items-center gap-1.5 px-3 py-1.5 border-b border-r border-border/20 last:border-b-0">
                  {ok
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="text-[8px] font-mono text-muted-foreground/70">{k}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          READ_ONLY · GET only · No execution · No trading · No credentials · No money movement
        </div>
      </div>
    </div>
  );
}