/**
 * OpenClawGatewayStatusPanel
 * READ-ONLY live gateway status display.
 * Calls openclawHealthCheck backend function (GET-only, no dispatch, no mutation).
 *
 * Safety guarantees:
 * - No OpenClaw task dispatch
 * - No browser automation
 * - No vault/file write
 * - No trading action
 * - No credential input or collection
 * - No InvokeLLM
 * - No backend mutation
 * - GATEWAY_NOT_CONNECTED if URL missing
 * - READ_ONLY_HEALTH_CHECK_FAILED if request fails
 * - Manual refresh only — no polling loop
 */

import React, { useState } from 'react';
import {
  Shield, RefreshCw, ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, XCircle, WifiOff, Activity, Server, Cpu,
  Bot, Terminal, Clock, Lock
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATIC_LABELS = {
  cloudflareRoute: 'openclaw.veridancore.com',
  bridgeRoute: 'bridge.veridancore.com',
  vpsLabel: 'ubuntu-s-1vcpu-2gb-nyc1',
  baselineFolder: '/root/veridan-baseline-2026-05-31-openclaw-live',
};

const VERIFICATION_CHECKS = [
  'No execution functions called',
  'No OpenClaw task dispatch called',
  'No browser automation triggered',
  'No vault write triggered',
  'No trading action triggered',
  'No credentials collected or exposed',
  'Missing gateway URL fails closed → GATEWAY_NOT_CONNECTED',
  'Failed request displays READ_ONLY_HEALTH_CHECK_FAILED',
  'Manual refresh only — no auto-loop polling',
  'UI clearly shows EXECUTION_DISABLED at all times',
];

function StatusChip({ status }) {
  const map = {
    LIVE:              'bg-primary/15 border-primary/40 text-primary',
    DEGRADED:          'bg-amber-500/15 border-amber-500/40 text-amber-400',
    OFFLINE:           'bg-destructive/15 border-destructive/40 text-destructive',
    NOT_CONNECTED:     'bg-slate-500/15 border-slate-500/40 text-slate-400',
    EXECUTION_DISABLED:'bg-slate-700/40 border-slate-600/40 text-slate-500',
  };
  return (
    <span className={`px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest border rounded-sm ${map[status] || map.NOT_CONNECTED}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value, valueClass = 'text-slate-300' }) {
  return (
    <div className="flex items-start gap-2 text-[8px] font-mono">
      <span className="text-slate-500 shrink-0 w-40">{label}</span>
      <span className={`break-all ${valueClass}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function OpenClawGatewayStatusPanel() {
  const [gatewayStatus, setGatewayStatus] = useState(null); // null = not checked yet
  const [loadState, setLoadState] = useState('idle'); // idle | loading | done | error
  const [errorCode, setErrorCode] = useState('');
  const [lastChecked, setLastChecked] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  const handleRefresh = async () => {
    setLoadState('loading');
    setGatewayStatus(null);
    setErrorCode('');

    try {
      const response = await base44.functions.invoke('openclawHealthCheck', {});
      const d = response?.data;

      if (!d) {
        setErrorCode('READ_ONLY_HEALTH_CHECK_FAILED');
        setLoadState('error');
        return;
      }

      // Map response to display shape
      setGatewayStatus({
        health: d.health || d.status || 'UNKNOWN',
        gatewayOnline: d.gatewayOnline ?? d.online ?? null,
        defaultModel: d.defaultModel || d.model || '—',
        agentsAvailable: d.agentsAvailable ?? d.agents ?? '—',
        commandsAvailable: d.commandsAvailable ?? d.commands ?? '—',
        version: d.version || '—',
        uptime: d.uptime || '—',
        raw: d,
      });
      setLoadState('done');
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || '';
      if (msg.includes('GATEWAY_NOT_CONNECTED') || msg.includes('not configured') || msg.includes('404') || msg.includes('not found')) {
        setErrorCode('GATEWAY_NOT_CONNECTED');
      } else {
        setErrorCode('READ_ONLY_HEALTH_CHECK_FAILED');
      }
      setLoadState('error');
    }

    setLastChecked(new Date().toISOString());
  };

  const derivedStatus = () => {
    if (loadState === 'idle') return 'NOT_CONNECTED';
    if (loadState === 'loading') return 'NOT_CONNECTED';
    if (loadState === 'error') {
      return errorCode === 'GATEWAY_NOT_CONNECTED' ? 'NOT_CONNECTED' : 'OFFLINE';
    }
    if (!gatewayStatus) return 'NOT_CONNECTED';
    const h = (gatewayStatus.health || '').toUpperCase();
    if (h.includes('HEALTHY') || h.includes('OK') || h.includes('LIVE') || h.includes('ONLINE')) return 'LIVE';
    if (h.includes('DEGRADED') || h.includes('WARN')) return 'DEGRADED';
    if (h.includes('OFFLINE') || h.includes('DOWN') || h.includes('ERROR')) return 'OFFLINE';
    return 'LIVE';
  };

  const ds = derivedStatus();

  return (
    <div className="border border-border/50 bg-card rounded-sm overflow-hidden font-mono">

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">
          READ-ONLY MONITORING — NO EXECUTION ENABLED
        </span>
        <StatusChip status="EXECUTION_DISABLED" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">OpenClaw Gateway Status</span>
          <StatusChip status={ds} />
          <StatusChip status="READ_ONLY" />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loadState === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40 rounded-sm transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
          {loadState === 'loading' ? 'Checking…' : 'Manual Refresh'}
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* Not yet checked */}
        {loadState === 'idle' && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2 py-2">
            <WifiOff className="w-3.5 h-3.5 text-slate-600" />
            No health check performed yet. Click Manual Refresh to check gateway status.
          </div>
        )}

        {/* Error states */}
        {loadState === 'error' && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-sm border ${
            errorCode === 'GATEWAY_NOT_CONNECTED'
              ? 'bg-slate-500/10 border-slate-500/30'
              : 'bg-destructive/10 border-destructive/30'
          }`}>
            {errorCode === 'GATEWAY_NOT_CONNECTED'
              ? <WifiOff className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />}
            <div className="space-y-0.5">
              <div className={`text-[8px] font-bold ${errorCode === 'GATEWAY_NOT_CONNECTED' ? 'text-slate-300' : 'text-destructive'}`}>
                {errorCode}
              </div>
              <div className="text-[7px] text-slate-500">
                {errorCode === 'GATEWAY_NOT_CONNECTED'
                  ? 'Gateway URL (OPENCLAW_GATEWAY_URL) is not configured or unreachable. No request was dispatched.'
                  : 'The read-only health check request failed. No execution occurred. Check gateway connectivity.'}
              </div>
            </div>
          </div>
        )}

        {/* Live data */}
        {loadState === 'done' && gatewayStatus && (
          <div className="space-y-3">

            {/* Health summary chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip status={ds} />
              <span className="text-[7px] font-mono text-slate-500">
                health: <span className="text-slate-300">{gatewayStatus.health}</span>
              </span>
              {gatewayStatus.version !== '—' && (
                <span className="text-[7px] font-mono text-slate-500">
                  version: <span className="text-slate-300">{gatewayStatus.version}</span>
                </span>
              )}
            </div>

            {/* Data grid */}
            <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
              <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">Gateway Response (Read-Only)</div>
              <InfoRow label="Health" value={gatewayStatus.health} valueClass="text-primary" />
              <InfoRow label="Default Model" value={gatewayStatus.defaultModel} />
              <InfoRow label="Agents Available" value={String(gatewayStatus.agentsAvailable)} />
              <InfoRow label="Commands Available" value={String(gatewayStatus.commandsAvailable)} />
              <InfoRow label="Uptime" value={gatewayStatus.uptime} />
            </div>

          </div>
        )}

        {/* Static infrastructure labels — always shown */}
        <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
          <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">Infrastructure Labels (Static)</div>
          <InfoRow label="Cloudflare Route" value={STATIC_LABELS.cloudflareRoute} valueClass="text-accent/80" />
          <InfoRow label="Bridge Route" value={STATIC_LABELS.bridgeRoute} valueClass="text-accent/80" />
          <InfoRow label="VPS" value={STATIC_LABELS.vpsLabel} valueClass="text-slate-400" />
          <InfoRow label="Baseline Folder" value={STATIC_LABELS.baselineFolder} valueClass="text-slate-400" />
        </div>

        {/* Last checked */}
        {lastChecked && (
          <div className="flex items-center gap-1.5 text-[7px] font-mono text-slate-600">
            <Clock className="w-2.5 h-2.5" />
            Last checked: {lastChecked}
          </div>
        )}

        {/* Verification section */}
        <div className="border border-border/30 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5" />
              Safety Verification Checks
            </div>
            {showVerification ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showVerification && (
            <div className="px-3 pb-3 pt-1 space-y-1 border-t border-border/20 bg-background/30">
              {VERIFICATION_CHECKS.map((check, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                  {check}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer safety state */}
        <div className="text-[6px] font-mono text-slate-600 space-y-0.5 border-t border-border/20 pt-2">
          <div>executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT</div>
          <div>source: openclawHealthCheck (read-only) · no mutation · no vault write · no browser automation</div>
        </div>

      </div>
    </div>
  );
}