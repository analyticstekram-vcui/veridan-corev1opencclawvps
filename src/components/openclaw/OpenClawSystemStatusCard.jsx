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

function computeVpsStatus() {
  const checks = loadJSON(CHECKS_KEY, []);
  if (!checks || checks.length === 0) {
    return { status: 'NOT_CHECKED', icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/5 border-slate-500/20', label: 'OpenClaw VPS: NOT CHECKED' };
  }

  // Find any valid successful check (any record, not just latest)
  const successfulCheck = checks.find(c =>
    c.status === 'SUCCESS' &&
    (c.httpStatus === 200 || c.httpStatus === '200') &&
    c.gatewayReachable === true &&
    c.executionLock === 'LOCKED' &&
    c.dispatchAllowed === false
  );
  if (successfulCheck) {
    return { status: 'CONNECTED', icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/30', label: 'OpenClaw VPS: CONNECTED' };
  }

  const latestCheck = checks[0];
  if (!latestCheck) {
    return { status: 'NOT_CHECKED', icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/5 border-slate-500/20', label: 'OpenClaw VPS: NOT CHECKED' };
  }

  if (latestCheck.status === 'HOLD_FOR_AUTH_BOUNDARY') {
    return { status: 'AUTH_REQUIRED', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: AUTH REQUIRED' };
  }

  if (latestCheck.status === 'HOLD_FOR_BACKEND_ENV') {
    return { status: 'ENV_MISSING', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: ENV MISSING' };
  }

  if (latestCheck.status === 'HOLD_FOR_GATEWAY_CONNECTIVITY') {
    return { status: 'NOT_CONNECTED', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OpenClaw VPS: NOT CONNECTED' };
  }

  if (latestCheck.status === 'BLOCKED_BY_SAFETY_FAILURE') {
    return { status: 'BLOCKED', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OpenClaw VPS: BLOCKED' };
  }

  return { status: 'HOLD', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'OpenClaw VPS: HOLD' };
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
    </div>
  );
}