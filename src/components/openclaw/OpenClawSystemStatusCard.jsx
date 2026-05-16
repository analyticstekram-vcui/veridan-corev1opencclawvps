/**
 * OpenClawSystemStatusCard
 * Top-level OpenClaw VPS status indicator.
 * Reads from authenticated manual monitoring checks.
 * Local-only, no network calls.
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Lock, RefreshCw } from 'lucide-react';

const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

// Extract best available timestamp from a check record, in priority order
function getCheckTimestamp(c) {
  const raw = c.createdAt || c.timestamp || c.recordedAt || c.checkedAt || c.completedAt;
  if (raw) {
    const t = new Date(raw).getTime();
    if (!isNaN(t)) return { t, source: Object.keys(c).find(k => c[k] === raw) || 'createdAt' };
  }
  return { t: 0, source: 'array-order' };
}

function getLatestCheck(checks) {
  if (!checks || checks.length === 0) return null;
  // Sort descending by best available timestamp; ties fall back to array order (first = newest)
  let best = null;
  let bestT = -1;
  let bestSource = 'array-order';
  checks.forEach((c, i) => {
    const { t, source } = getCheckTimestamp(c);
    // Use array index as tiebreaker: earlier index = more recent (array is prepended)
    if (best === null || t > bestT || (t === bestT && i < checks.indexOf(best))) {
      best = c;
      bestT = t;
      bestSource = t === 0 ? 'array-order' : source;
    }
  });
  return { check: best, timestampSource: bestSource };
}

// Normalize field values for robust comparison
function norm(val) { return String(val ?? '').trim().toUpperCase(); }
function isTrue(val) { return val === true || String(val).toLowerCase() === 'true'; }
function isFalse(val) { return val === false || String(val).toLowerCase() === 'false'; }

function computeVpsStatus() {
  const checks = loadJSON(CHECKS_KEY, []);
  const empty = {
    status: 'NOT_CHECKED', icon: AlertCircle, color: 'text-slate-400',
    bg: 'bg-slate-500/5 border-slate-500/20', label: 'OpenClaw VPS: NOT CHECKED',
    debug: { endpoint: '—', status: '—', httpStatus: '—', gatewayReachable: '—', executionLock: '—', dispatchAllowed: '—', checkedAt: '—', timestampSource: '—', resolvedStatus: 'NOT_CHECKED' },
  };

  if (!checks || checks.length === 0) return empty;

  const result = getLatestCheck(checks);
  if (!result || !result.check) return empty;
  const { check: c, timestampSource } = result;

  const rawTs = c.createdAt || c.timestamp || c.recordedAt || c.checkedAt || c.completedAt || '—';
  const debug = {
    endpoint:        c.endpoint ?? '—',
    status:          c.status ?? '—',
    httpStatus:      c.httpStatus != null ? String(c.httpStatus) : 'N/A',
    gatewayReachable: c.gatewayReachable != null ? String(c.gatewayReachable) : '—',
    executionLock:   c.executionLock ?? '—',
    dispatchAllowed: c.dispatchAllowed != null ? String(c.dispatchAllowed) : '—',
    checkedAt:       rawTs,
    timestampSource,
    resolvedStatus:  '(computing...)',
  };

  // CONNECTED: normalized comparison on all criteria
  if (
    norm(c.status) === 'SUCCESS' &&
    norm(c.httpStatus) === '200' &&
    isTrue(c.gatewayReachable) &&
    norm(c.executionLock) === 'LOCKED' &&
    isFalse(c.dispatchAllowed)
  ) {
    debug.resolvedStatus = 'CONNECTED';
    return { status: 'CONNECTED', icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/30', label: 'OpenClaw VPS: CONNECTED', debug };
  }

  const s = norm(c.status);

  if (s === 'HOLD_FOR_AUTH_BOUNDARY') {
    debug.resolvedStatus = 'AUTH_REQUIRED';
    return { status: 'AUTH_REQUIRED', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: AUTH REQUIRED', debug };
  }
  if (s === 'HOLD_FOR_BACKEND_ENV') {
    debug.resolvedStatus = 'ENV_MISSING';
    return { status: 'ENV_MISSING', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: ENV MISSING', debug };
  }
  if (s === 'HOLD_FOR_GATEWAY_CONNECTIVITY' || s === 'HOLD') {
    debug.resolvedStatus = 'NOT_CONNECTED';
    return { status: 'NOT_CONNECTED', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OpenClaw VPS: NOT CONNECTED', debug };
  }
  if (s === 'BLOCKED_BY_SAFETY_FAILURE') {
    debug.resolvedStatus = 'BLOCKED';
    return { status: 'BLOCKED', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OpenClaw VPS: BLOCKED', debug };
  }

  debug.resolvedStatus = 'HOLD';
  return { status: 'HOLD', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: HOLD', debug };
}

export default function OpenClawSystemStatusCard() {
  const [vpsStatus, setVpsStatus] = useState(computeVpsStatus());

  const handleRefresh = () => {
    setVpsStatus(computeVpsStatus());
  };

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      setVpsStatus(computeVpsStatus());
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for manual monitoring evidence chain regeneration event
    const handleEvidenceChainRefresh = () => {
      setVpsStatus(computeVpsStatus());
    };
    window.addEventListener('veridan:regenerate-manual-monitoring-evidence-chain', handleEvidenceChainRefresh);
    
    // Listen for manual monitoring check recorded event (if it exists)
    const handleCheckRecorded = () => {
      setVpsStatus(computeVpsStatus());
    };
    window.addEventListener('veridan:manual-monitoring-check-recorded', handleCheckRecorded);
    
    // Also poll every 2 seconds for local changes
    const interval = setInterval(handleRefresh, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('veridan:regenerate-manual-monitoring-evidence-chain', handleEvidenceChainRefresh);
      window.removeEventListener('veridan:manual-monitoring-check-recorded', handleCheckRecorded);
      clearInterval(interval);
    };
  }, []);

  const Icon = vpsStatus.icon;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${vpsStatus.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${vpsStatus.color} shrink-0`} />
          <div className={`text-[11px] font-bold uppercase tracking-wide ${vpsStatus.color}`}>
            {vpsStatus.label}
          </div>
        </div>
        <button type="button" onClick={handleRefresh} className="p-1 hover:bg-secondary/50 rounded transition-colors">
          <RefreshCw className="w-3 h-3 text-slate-400 hover:text-foreground" />
        </button>
      </div>
      <div className="text-[8px] text-slate-500 flex items-center gap-1">
        <Lock className="w-2.5 h-2.5" /> Read-only monitoring • Manual checks only
      </div>
      <div className="text-[7px] text-slate-600 font-mono space-y-0.5 pt-1 border-t border-border/20">
        <div>Latest endpoint: <span className="text-slate-400">{vpsStatus.debug.endpoint}</span></div>
        <div>Latest status: <span className="text-slate-400">{vpsStatus.debug.status}</span></div>
        <div>Latest httpStatus: <span className="text-slate-400">{vpsStatus.debug.httpStatus}</span></div>
        <div>Latest gatewayReachable: <span className="text-slate-400">{vpsStatus.debug.gatewayReachable}</span></div>
        <div>Latest executionLock: <span className="text-slate-400">{vpsStatus.debug.executionLock}</span></div>
        <div>Latest dispatchAllowed: <span className="text-slate-400">{vpsStatus.debug.dispatchAllowed}</span></div>
        <div>Timestamp source: <span className="text-slate-400">{vpsStatus.debug.timestampSource}</span></div>
        <div>Resolved top status: <span className="text-slate-300 font-bold">{vpsStatus.debug.resolvedStatus}</span></div>
      </div>
    </div>
  );
}