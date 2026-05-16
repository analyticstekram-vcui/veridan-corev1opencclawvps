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

function getLatestCheck(checks) {
  if (!checks || checks.length === 0) return null;
  // Sort by createdAt/recordedAt descending to get the newest
  return [...checks].sort((a, b) => {
    const ta = new Date(a.createdAt || a.recordedAt || a.timestamp || 0).getTime();
    const tb = new Date(b.createdAt || b.recordedAt || b.timestamp || 0).getTime();
    return tb - ta;
  })[0];
}

function computeVpsStatus() {
  const checks = loadJSON(CHECKS_KEY, []);
  if (!checks || checks.length === 0) {
    return {
      status: 'NOT_CHECKED', icon: AlertCircle, color: 'text-slate-400',
      bg: 'bg-slate-500/5 border-slate-500/20', label: 'OpenClaw VPS: NOT CHECKED',
      debug: { status: '—', httpStatus: '—', gatewayReachable: '—', checkedAt: '—' },
    };
  }

  const latest = getLatestCheck(checks);
  if (!latest) {
    return {
      status: 'NOT_CHECKED', icon: AlertCircle, color: 'text-slate-400',
      bg: 'bg-slate-500/5 border-slate-500/20', label: 'OpenClaw VPS: NOT CHECKED',
      debug: { status: '—', httpStatus: '—', gatewayReachable: '—', checkedAt: '—' },
    };
  }

  const debug = {
    status: latest.status ?? '—',
    httpStatus: latest.httpStatus != null ? String(latest.httpStatus) : 'N/A',
    gatewayReachable: latest.gatewayReachable != null ? String(latest.gatewayReachable) : '—',
    checkedAt: latest.createdAt || latest.recordedAt || latest.timestamp || '—',
  };

  // CONNECTED only if latest record passes all criteria
  if (
    latest.status === 'SUCCESS' &&
    (latest.httpStatus === 200 || latest.httpStatus === '200') &&
    latest.gatewayReachable === true &&
    latest.executionLock === 'LOCKED' &&
    latest.dispatchAllowed === false
  ) {
    return { status: 'CONNECTED', icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/30', label: 'OpenClaw VPS: CONNECTED', debug };
  }

  if (latest.status === 'HOLD_FOR_AUTH_BOUNDARY') {
    return { status: 'AUTH_REQUIRED', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: AUTH REQUIRED', debug };
  }

  if (latest.status === 'HOLD_FOR_BACKEND_ENV') {
    return { status: 'ENV_MISSING', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: ENV MISSING', debug };
  }

  if (latest.status === 'HOLD_FOR_GATEWAY_CONNECTIVITY' || latest.status === 'HOLD') {
    return { status: 'NOT_CONNECTED', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OpenClaw VPS: NOT CONNECTED', debug };
  }

  if (latest.status === 'BLOCKED_BY_SAFETY_FAILURE') {
    return { status: 'BLOCKED', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OpenClaw VPS: BLOCKED', debug };
  }

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
        <div>Latest Check Status: <span className="text-slate-400">{vpsStatus.debug.status}</span></div>
        <div>Latest HTTP: <span className="text-slate-400">{vpsStatus.debug.httpStatus}</span></div>
        <div>Latest Gateway Reachable: <span className="text-slate-400">{vpsStatus.debug.gatewayReachable}</span></div>
        <div>Latest Check Time: <span className="text-slate-400">{vpsStatus.debug.checkedAt !== '—' ? new Date(vpsStatus.debug.checkedAt).toLocaleTimeString() : '—'}</span></div>
      </div>
    </div>
  );
}