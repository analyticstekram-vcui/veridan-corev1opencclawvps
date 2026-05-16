/**
 * ManualMonitoringHistoricalStatusDashboard
 * Displays historical status from successful manual monitoring checks.
 * Local-only, no network calls.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, RefreshCw, FileJson, Lock } from 'lucide-react';

const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';
const DASHBOARD_KEY = 'openclawManualMonitoringHistoricalStatusDashboards';

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveDashboard(dashboard) {
  try {
    const all = loadJSON(DASHBOARD_KEY, []);
    const deduped = [dashboard, ...all.filter(d => d.dashboardId !== dashboard.dashboardId)];
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildDashboard() {
  const checks = loadJSON(CHECKS_KEY, []);
  const latestCheck = checks[0];
  const successfulChecks = checks.filter(c => c.status === 'SUCCESS' && c.httpStatus === 200 && c.gatewayReachable);
  const lastSuccessfulCheck = successfulChecks[0];

  return {
    dashboardId: 'mhsd-' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    totalChecks: checks.length,
    successfulChecks: successfulChecks.length,
    failedHoldChecks: checks.length - successfulChecks.length,
    latestEndpoint: latestCheck?.endpoint ?? 'N/A',
    latestHttpStatus: latestCheck?.httpStatus ?? 'N/A',
    latestGatewayReachable: latestCheck?.gatewayReachable ?? false,
    lastSuccessfulCheckTime: lastSuccessfulCheck?.createdAt ?? null,
    lastSuccessfulEndpoint: lastSuccessfulCheck?.endpoint ?? 'N/A',
  };
}

export default function ManualMonitoringHistoricalStatusDashboard() {
  const [dashboard, setDashboard] = useState(() => {
    const d = buildDashboard();
    saveDashboard(d);
    return d;
  });

  const generate = useCallback(() => {
    const d = buildDashboard();
    saveDashboard(d);
    setDashboard(d);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Historical Status</div>
          <div className="text-[12px] font-bold text-foreground">Manual Monitoring Status History</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2 py-1 text-[8px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: 'Total Checks', value: dashboard.totalChecks, color: 'text-foreground' },
          { label: 'Successful', value: dashboard.successfulChecks, color: 'text-primary font-bold' },
          { label: 'Failed/Hold', value: dashboard.failedHoldChecks, color: dashboard.failedHoldChecks > 0 ? 'text-amber-500' : 'text-slate-300' },
          { label: 'Latest Endpoint', value: dashboard.latestEndpoint, color: 'text-blue-400 font-mono text-[8px]' },
          { label: 'Latest HTTP', value: dashboard.latestHttpStatus, color: 'text-foreground' },
          { label: 'Gateway Reachable', value: String(dashboard.latestGatewayReachable), color: dashboard.latestGatewayReachable ? 'text-primary' : 'text-amber-500' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border/60 rounded px-2 py-1.5">
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
            <div className={`text-[9px] break-all ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {dashboard.lastSuccessfulCheckTime && (
        <div className="text-[8px] text-slate-500 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-primary" /> Last successful: {new Date(dashboard.lastSuccessfulCheckTime).toLocaleString()} ({dashboard.lastSuccessfulEndpoint})
        </div>
      )}
    </div>
  );
}