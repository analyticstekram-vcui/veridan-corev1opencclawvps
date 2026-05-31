/**
 * ObsidianBridgeHealthPanel
 * READ-ONLY health check for the Obsidian bridge service.
 * No vault write · No file creation · No append/update/delete · No OpenClaw dispatch
 * No browser automation · No trading · No credentials · No InvokeLLM · No backend mutation
 */

import React, { useState } from 'react';
import {
  Shield, RefreshCw, Activity, WifiOff, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Lock, AlertTriangle, Clock, AlertCircle,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BRIDGE_LABELS = {
  publicRoute:    'bridge.veridancore.com',
  localService:   'http://127.0.0.1:3001',
  vps:            'ubuntu-s-1vcpu-2gb-nyc1',
  baselineFolder: '/root/veridan-baseline-2026-05-31-openclaw-live',
  openclawConfig: '/root/.openclaw/openclaw.json',
};

const ALLOWED_ENDPOINTS = ['/health', '/', '/status'];

const VERIFICATION_CHECKS = [
  'Health panel is read-only — no mutation occurs',
  'Manual refresh only — no auto-polling loop',
  'No vault write function is called',
  'No obsidianWriteApprovedDraft call is made',
  'No OpenClaw dispatch is called',
  'No browser automation is triggered',
  'No file system mutation occurs',
  'No credentials are collected',
  'Missing bridge URL fails closed as BRIDGE_NOT_CONNECTED',
  'UI clearly shows VAULT_WRITE_DISABLED at all times',
];

const CHIP_CFG = {
  BRIDGE_LIVE:                    'text-primary border-primary/30 bg-primary/10',
  BRIDGE_DEGRADED:                'text-amber-400 border-amber-400/30 bg-amber-400/10',
  BRIDGE_NOT_CONNECTED:           'text-slate-400 border-slate-500/30 bg-slate-500/10',
  HEALTH_UNKNOWN:                 'text-slate-400 border-slate-500/30 bg-slate-500/10',
  CORS_OR_ACCESS_BLOCKED:         'text-destructive border-destructive/30 bg-destructive/10',
  BRIDGE_RESPONDING_NO_ROOT_ROUTE:'text-amber-400 border-amber-400/30 bg-amber-400/10',
  DETECTED_TEXT_RESPONSE:         'text-amber-400 border-amber-400/30 bg-amber-400/10',
  VAULT_WRITE_DISABLED:           'text-slate-500 border-slate-600/30 bg-slate-700/30',
};

function StatusChip({ status }) {
  return (
    <span className={`px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest border rounded-sm ${CHIP_CFG[status] || CHIP_CFG.HEALTH_UNKNOWN}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value, valueClass = 'text-slate-400' }) {
  return (
    <div className="flex items-start gap-2 text-[7px] font-mono">
      <span className="text-slate-600 shrink-0 w-36">{label}</span>
      <span className={`break-all ${valueClass}`}>{value ?? 'NOT_REPORTED'}</span>
    </div>
  );
}

function deriveStatus(result) {
  if (!result) return 'HEALTH_UNKNOWN';
  if (result.status === 'BRIDGE_NOT_CONNECTED') return 'BRIDGE_NOT_CONNECTED';
  if (result.status === 'CORS_OR_ACCESS_BLOCKED') return 'CORS_OR_ACCESS_BLOCKED';
  if (result.bridgeLive) return 'BRIDGE_LIVE';
  if (result.status === 'BRIDGE_RESPONDING_NO_ROOT_ROUTE') return 'BRIDGE_RESPONDING_NO_ROOT_ROUTE';
  if (result.status === 'DETECTED_TEXT_RESPONSE') return 'DETECTED_TEXT_RESPONSE';
  if (result.status === 'BRIDGE_DEGRADED') return 'BRIDGE_DEGRADED';
  return 'HEALTH_UNKNOWN';
}

export default function ObsidianBridgeHealthPanel() {
  const [loadState, setLoadState] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorCode, setErrorCode] = useState('');
  const [lastChecked, setLastChecked] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleRefresh = async () => {
    setLoadState('loading');
    setResult(null);
    setErrorCode('');

    try {
      const response = await base44.functions.invoke('obsidianBridgeHealthCheck', {});
      const d = response?.data;

      if (!d) {
        setErrorCode('HEALTH_UNKNOWN');
        setLoadState('error');
        setLastChecked(new Date().toISOString());
        return;
      }

      if (d.status === 'BRIDGE_NOT_CONNECTED') {
        setErrorCode('BRIDGE_NOT_CONNECTED');
        setLoadState('error');
        setLastChecked(d.checkedAt || new Date().toISOString());
        return;
      }

      setResult(d);
      setLoadState('done');
      setLastChecked(d.checkedAt || new Date().toISOString());
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || '';
      const isNotConnected = msg.includes('BRIDGE_NOT_CONNECTED') || msg.includes('not configured') || msg.includes('VERIDAN_BRIDGE_URL');
      const isCors = msg.includes('CORS') || msg.includes('Access') || msg.includes('blocked');
      setErrorCode(isCors ? 'CORS_OR_ACCESS_BLOCKED' : isNotConnected ? 'BRIDGE_NOT_CONNECTED' : 'HEALTH_UNKNOWN');
      setLoadState('error');
      setLastChecked(new Date().toISOString());
    }
  };

  const status = loadState === 'done' && result ? deriveStatus(result) : (loadState === 'error' ? errorCode : 'HEALTH_UNKNOWN');

  const statusIcon = status === 'BRIDGE_LIVE'
    ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
    : status === 'BRIDGE_NOT_CONNECTED'
      ? <WifiOff className="w-3.5 h-3.5 text-slate-500" />
      : status === 'CORS_OR_ACCESS_BLOCKED'
        ? <XCircle className="w-3.5 h-3.5 text-destructive" />
        : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;

  return (
    <div className="border border-border/50 bg-card rounded-sm overflow-hidden font-mono">

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 flex-wrap gap-y-1">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">
          OBSIDIAN BRIDGE HEALTH — READ ONLY / NO VAULT WRITES
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <StatusChip status="VAULT_WRITE_DISABLED" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Obsidian Bridge Health</span>
          <StatusChip status={loadState === 'idle' ? 'HEALTH_UNKNOWN' : status} />
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

      <div className="p-4 space-y-3">

        {/* Idle */}
        {loadState === 'idle' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-slate-500 py-1">
            <WifiOff className="w-3.5 h-3.5 text-slate-600" />
            No health check performed yet. Click Manual Refresh to check bridge status.
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-sm border ${
            errorCode === 'BRIDGE_NOT_CONNECTED'
              ? 'bg-slate-500/10 border-slate-500/30'
              : errorCode === 'CORS_OR_ACCESS_BLOCKED'
                ? 'bg-destructive/10 border-destructive/30'
                : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            {statusIcon}
            <div className="space-y-0.5">
              <div className={`text-[8px] font-bold ${
                errorCode === 'BRIDGE_NOT_CONNECTED' ? 'text-slate-300'
                : errorCode === 'CORS_OR_ACCESS_BLOCKED' ? 'text-destructive'
                : 'text-amber-400'
              }`}>{errorCode}</div>
              <div className="text-[7px] text-slate-500">
                {errorCode === 'BRIDGE_NOT_CONNECTED'
                  ? 'VERIDAN_BRIDGE_URL is not configured or bridge is unreachable. Fails closed. No request dispatched.'
                  : errorCode === 'CORS_OR_ACCESS_BLOCKED'
                    ? 'Bridge access blocked — check VERIDAN_BRIDGE_TOKEN and bridge service auth config.'
                    : 'Bridge health check returned an unexpected result. No vault write attempted.'}
              </div>
            </div>
          </div>
        )}

        {/* Live data */}
        {loadState === 'done' && result && (
          <div className="space-y-3">

            {/* Status + latency */}
            <div className="flex items-center gap-2 flex-wrap">
              {statusIcon}
              <StatusChip status={status} />
              {result.httpStatus && (
                <span className="text-[7px] font-mono text-slate-500">HTTP: <span className="text-slate-300">{result.httpStatus}</span></span>
              )}
              {result.latencyMs !== undefined && (
                <span className="text-[7px] font-mono text-slate-500">latency: <span className="text-slate-300">{result.latencyMs}ms</span></span>
              )}
            </div>

            {/* Info grid */}
            <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
              <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                Bridge Response (Read-Only · Sanitized)
              </div>
              <InfoRow
                label="Bridge Health"
                value={result.health || 'NOT_REPORTED'}
                valueClass={status === 'BRIDGE_LIVE' ? 'text-primary' : status === 'BRIDGE_DEGRADED' ? 'text-amber-400' : 'text-slate-500'}
              />
              <InfoRow label="Bridge Online" value={result.bridgeLive ? 'YES' : 'NO'} valueClass={result.bridgeLive ? 'text-primary' : 'text-slate-500'} />
              <InfoRow label="Endpoint Checked" value={result.endpointChecked || ALLOWED_ENDPOINTS.join(', ')} />
              <InfoRow label="Response Type" value={result.responseType || 'NOT_REPORTED'} />
              <InfoRow label="Message" value={result.message || 'NOT_REPORTED'} />
            </div>

            {/* Raw response preview */}
            <div className="border border-border/30 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRaw(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
              >
                <span>Raw Response Preview (Sanitized)</span>
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showRaw && (
                <div className="px-3 pb-3 pt-1 border-t border-border/20 bg-background/30 space-y-1.5">
                  <pre className="text-[6px] font-mono text-slate-500 bg-background/60 border border-border/20 rounded-sm p-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {result.rawPreview
                      ? JSON.stringify(result.rawPreview, null, 2).slice(0, 600)
                      : 'NO_RAW_PREVIEW'}
                  </pre>
                  <div className="text-[6px] font-mono text-slate-600">
                    ⚠ Sanitized server-side. No secrets, tokens, or credentials returned.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Static bridge labels */}
        <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
          <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">Bridge Labels (Static)</div>
          <InfoRow label="Public Route"    value={BRIDGE_LABELS.publicRoute}    valueClass="text-accent/80" />
          <InfoRow label="Local Service"   value={BRIDGE_LABELS.localService}   valueClass="text-slate-400" />
          <InfoRow label="VPS"             value={BRIDGE_LABELS.vps}            valueClass="text-slate-400" />
          <InfoRow label="Baseline Folder" value={BRIDGE_LABELS.baselineFolder} valueClass="text-slate-400" />
          <InfoRow label="OpenClaw Config" value={BRIDGE_LABELS.openclawConfig} valueClass="text-slate-400" />
          <div className="pt-1 flex flex-wrap gap-1">
            {ALLOWED_ENDPOINTS.map(ep => (
              <span key={ep} className="px-1.5 py-0.5 text-[6px] font-mono border border-primary/20 text-primary/60 rounded-sm">{ep}</span>
            ))}
            <span className="text-[6px] font-mono text-slate-600 self-center">allowed read-only endpoints</span>
          </div>
        </div>

        {/* Last checked */}
        {lastChecked && (
          <div className="flex items-center gap-1.5 text-[7px] font-mono text-slate-600">
            <Clock className="w-2.5 h-2.5" />
            Last checked: {lastChecked}
          </div>
        )}

        {/* Verification */}
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

        {/* Footer */}
        <div className="text-[6px] font-mono text-slate-600 space-y-0.5 border-t border-border/20 pt-2">
          <div>vaultWrite: DISABLED · openclawDispatch: DISABLED · browserAutomation: DISABLED · trading: DISABLED</div>
          <div>allowedEndpoints: {ALLOWED_ENDPOINTS.join(' ')} · mode: READ_ONLY · manualRefreshOnly: TRUE</div>
        </div>

      </div>
    </div>
  );
}