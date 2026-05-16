import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Lock, Radio } from 'lucide-react';

const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(CHECKS_KEY) || '[]'); } catch { return []; }
}

function norm(val) { return String(val ?? '').trim().toUpperCase(); }
function isTrue(val) { return val === true || String(val).toLowerCase() === 'true'; }
function isFalse(val) { return val === false || String(val).toLowerCase() === 'false'; }

function getBestTimestamp(c) {
  const raw = c.createdAt || c.timestamp || c.recordedAt || c.checkedAt || c.completedAt;
  if (raw) { const t = new Date(raw).getTime(); if (!isNaN(t)) return t; }
  return 0;
}

function resolveVpsStatus(checks) {
  if (!checks || checks.length === 0) {
    return { label: 'NOT CHECKED', valueClass: 'text-slate-400', resolvedStatus: 'NOT_CHECKED', latest: null, count: 0 };
  }
  // Find latest by best timestamp, fallback to first in array
  const sorted = [...checks].sort((a, b) => getBestTimestamp(b) - getBestTimestamp(a));
  const c = sorted[0];
  const count = checks.length;

  const isConnected =
    norm(c.status) === 'SUCCESS' &&
    norm(c.httpStatus) === '200' &&
    isTrue(c.gatewayReachable) &&
    norm(c.executionLock) === 'LOCKED' &&
    isFalse(c.dispatchAllowed);

  if (isConnected) {
    return { label: 'CONNECTED', valueClass: 'text-primary', resolvedStatus: 'CONNECTED', latest: c, count };
  }
  const s = norm(c.status);
  if (s === 'HOLD_FOR_AUTH_BOUNDARY') return { label: 'AUTH REQUIRED', valueClass: 'text-amber-500', resolvedStatus: 'AUTH_REQUIRED', latest: c, count };
  if (s === 'HOLD_FOR_BACKEND_ENV')   return { label: 'ENV MISSING',   valueClass: 'text-amber-500', resolvedStatus: 'ENV_MISSING',   latest: c, count };
  if (s === 'HOLD_FOR_GATEWAY_CONNECTIVITY' || s === 'HOLD') return { label: 'NOT CONNECTED', valueClass: 'text-destructive', resolvedStatus: 'NOT_CONNECTED', latest: c, count };
  if (s === 'BLOCKED_BY_SAFETY_FAILURE') return { label: 'BLOCKED', valueClass: 'text-destructive', resolvedStatus: 'BLOCKED', latest: c, count };
  return { label: 'HOLD', valueClass: 'text-amber-500', resolvedStatus: 'HOLD', latest: c, count };
}

const StatusCell = ({ label, value, valueClass = 'text-slate-300', children }) => (
  <div className="bg-card border border-border/60 rounded px-3 py-2">
    <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
    <div className={`text-[10px] font-bold font-mono ${valueClass}`}>{value}</div>
    {children}
  </div>
);

export default function PortalStatusSummary({ loading, operatorMode }) {
  const [vps, setVps] = useState(() => resolveVpsStatus(loadChecks()));

  const refresh = () => setVps(resolveVpsStatus(loadChecks()));

  useEffect(() => {
    window.addEventListener('storage', refresh);
    window.addEventListener('veridan:regenerate-manual-monitoring-evidence-chain', refresh);
    window.addEventListener('veridan:manual-monitoring-check-recorded', refresh);
    const interval = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('veridan:regenerate-manual-monitoring-evidence-chain', refresh);
      window.removeEventListener('veridan:manual-monitoring-check-recorded', refresh);
      clearInterval(interval);
    };
  }, []);

  const c = vps.latest;

  return (
    <div className="border-b border-border bg-secondary/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-3 h-3 text-primary" />
        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">System Status Summary</span>
        {loading && <span className="text-[8px] text-amber-500 animate-pulse ml-auto">POLLING…</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
        <StatusCell label="OpenClaw VPS" value={loading ? 'CHECKING…' : vps.label} valueClass={loading ? 'text-amber-500' : vps.valueClass}>
          {/* Debug strip — TOP_CARD_RENDER_SOURCE */}
          <div className="mt-1 pt-1 border-t border-border/20 text-[6px] font-mono text-slate-600 space-y-0.5">
            <div>source: <span className="text-slate-500">TOP_CARD_RENDER_SOURCE</span></div>
            <div>records: <span className="text-slate-500">{vps.count}</span></div>
            <div>endpoint: <span className="text-slate-500">{c?.endpoint ?? '—'}</span></div>
            <div>status: <span className="text-slate-500">{c?.status ?? '—'}</span></div>
            <div>httpStatus: <span className="text-slate-500">{c?.httpStatus != null ? String(c.httpStatus) : '—'}</span></div>
            <div>gatewayReachable: <span className="text-slate-500">{c?.gatewayReachable != null ? String(c.gatewayReachable) : '—'}</span></div>
            <div>executionLock: <span className="text-slate-500">{c?.executionLock ?? '—'}</span></div>
            <div>dispatchAllowed: <span className="text-slate-500">{c?.dispatchAllowed != null ? String(c.dispatchAllowed) : '—'}</span></div>
            <div>resolved: <span className="text-slate-400 font-bold">{vps.resolvedStatus}</span></div>
          </div>
        </StatusCell>
        <StatusCell label="Gateway Mode"   value="READ_ONLY"          valueClass="text-amber-500" />
        <StatusCell label="Operator Mode"  value={operatorMode}       valueClass="text-slate-300" />
        <StatusCell label="Execution Lock" value="LOCKED"             valueClass="text-destructive" />
        <StatusCell label="API Trading"    value="DISABLED"           valueClass="text-destructive" />
        <StatusCell label="Direct OpenAI"  value="DISABLED"           valueClass="text-destructive" />
        <StatusCell label="AI Route"       value="OpenClaw / Codex"   valueClass="text-primary" />
      </div>
    </div>
  );
}