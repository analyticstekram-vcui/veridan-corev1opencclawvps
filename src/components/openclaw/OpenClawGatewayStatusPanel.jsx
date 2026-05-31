/**
 * OpenClawGatewayStatusPanel
 * READ-ONLY gateway status panel.
 * Uses openclawGatewayReadStatus backend function (GET /health /models /agents /commands).
 * No dispatch · No execution · No vault write · No trading · No credentials · Manual refresh only.
 */

import React, { useState } from 'react';
import {
  Shield, RefreshCw, ChevronDown, ChevronUp, CheckCircle2,
  XCircle, WifiOff, Activity, Clock, Lock, AlertTriangle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATIC_LABELS = {
  cloudflareRoute: 'openclaw.veridancore.com',
  bridgeRoute: 'bridge.veridancore.com',
  vpsLabel: 'ubuntu-s-1vcpu-2gb-nyc1',
  baselineFolder: '/root/veridan-baseline-2026-05-31-openclaw-live',
};

const VERIFICATION_CHECKS = [
  'No execution endpoints are called (dispatch, execute, trade, automate)',
  'No OpenClaw dispatch is called',
  'No browser automation is triggered',
  'No vault write is triggered',
  'No trading endpoint is called',
  'No credential field exists in this panel',
  'Only manual refresh exists — no auto-loop polling',
  'Blank values replaced with UNKNOWN / NOT_REPORTED labels',
  'Raw response previews are sanitized (no secrets, max 800 chars)',
  'READ_ONLY mode is preserved — EXECUTION_DISABLED at all times',
];

const CHIP_STYLES = {
  LIVE:              'bg-primary/15 border-primary/40 text-primary',
  DEGRADED:          'bg-amber-500/15 border-amber-500/40 text-amber-400',
  OFFLINE:           'bg-destructive/15 border-destructive/40 text-destructive',
  NOT_CONNECTED:     'bg-slate-500/15 border-slate-500/40 text-slate-400',
  EXECUTION_DISABLED:'bg-slate-700/40 border-slate-600/40 text-slate-500',
  READ_ONLY:         'bg-primary/10 border-primary/20 text-primary',
};

function StatusChip({ status }) {
  return (
    <span className={`px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest border rounded-sm ${CHIP_STYLES[status] || CHIP_STYLES.NOT_CONNECTED}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value, valueClass = 'text-slate-300' }) {
  return (
    <div className="flex items-start gap-2 text-[8px] font-mono">
      <span className="text-slate-500 shrink-0 w-44">{label}</span>
      <span className={`break-all ${valueClass}`}>{value ?? 'NOT_REPORTED'}</span>
    </div>
  );
}

function EndpointBadge({ label, result }) {
  const ok = result === 'OK';
  const cls = ok ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5';
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-sm text-[6px] font-mono ${cls}`}>
      <span className="font-bold">{label}</span>
      <span>{result || '—'}</span>
    </div>
  );
}

function RawPreviewSection({ rawPreviews, endpointResults }) {
  const [open, setOpen] = useState(false);
  if (!rawPreviews) return null;
  return (
    <div className="border border-border/30 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
      >
        <span>Raw Read-Only Response Previews (Sanitized)</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/20 bg-background/30">
          {[
            { key: 'health', label: '/health' },
            { key: 'models', label: '/models' },
            { key: 'agents', label: '/agents' },
            { key: 'commands', label: '/commands' },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[7px] font-bold font-mono text-slate-400">{label}</span>
                <span className={`text-[6px] px-1.5 py-0.5 border rounded-sm font-mono ${
                  endpointResults?.[key] === 'OK'
                    ? 'text-primary border-primary/30'
                    : 'text-destructive border-destructive/30'
                }`}>{endpointResults?.[key] || '—'}</span>
              </div>
              <pre className="text-[6px] font-mono text-slate-500 bg-background/60 border border-border/20 rounded-sm p-2 overflow-x-auto whitespace-pre-wrap break-all">
                {rawPreviews[key]
                  ? JSON.stringify(rawPreviews[key], null, 2).slice(0, 400)
                  : 'NO_DATA'}
              </pre>
            </div>
          ))}
          <div className="text-[6px] font-mono text-slate-600">
            ⚠ Previews are sanitized server-side. No secrets, tokens, or credentials are ever returned.
          </div>
        </div>
      )}
    </div>
  );
}

function deriveGatewayStatus(data) {
  if (!data) return 'NOT_CONNECTED';
  if (data.status === 'GATEWAY_NOT_CONNECTED') return 'NOT_CONNECTED';
  const h = (data.health || '').toLowerCase();
  if (h === 'live' || h === 'healthy' || h === 'ok') return 'LIVE';
  if (h.includes('degraded') || h.includes('warn')) return 'DEGRADED';
  if (h.includes('failed') || h.includes('error') || h.includes('offline') || h.includes('unhealthy')) return 'OFFLINE';
  if (data.gatewayOnline) return 'LIVE';
  return 'NOT_CONNECTED';
}

export default function OpenClawGatewayStatusPanel() {
  const [data, setData] = useState(null);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | done | error
  const [errorCode, setErrorCode] = useState('');
  const [lastChecked, setLastChecked] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  const handleRefresh = async () => {
    setLoadState('loading');
    setData(null);
    setErrorCode('');

    try {
      const response = await base44.functions.invoke('openclawGatewayReadStatus', {});
      const d = response?.data;

      if (!d) {
        setErrorCode('READ_ONLY_HEALTH_CHECK_FAILED');
        setLoadState('error');
        setLastChecked(new Date().toISOString());
        return;
      }

      if (d.status === 'GATEWAY_NOT_CONNECTED') {
        setErrorCode('GATEWAY_NOT_CONNECTED');
        setLoadState('error');
        setLastChecked(d.checkedAt || new Date().toISOString());
        return;
      }

      setData(d);
      setLoadState('done');
      setLastChecked(d.checkedAt || new Date().toISOString());
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || '';
      const isNotConnected = msg.includes('GATEWAY_NOT_CONNECTED') || msg.includes('not configured');
      setErrorCode(isNotConnected ? 'GATEWAY_NOT_CONNECTED' : 'READ_ONLY_HEALTH_CHECK_FAILED');
      setLoadState('error');
      setLastChecked(new Date().toISOString());
    }
  };

  const ds = loadState === 'done' && data ? deriveGatewayStatus(data) : 'NOT_CONNECTED';

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

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">OpenClaw Gateway Status</span>
          <StatusChip status={loadState === 'done' ? ds : 'NOT_CONNECTED'} />
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

        {/* Idle */}
        {loadState === 'idle' && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2 py-2">
            <WifiOff className="w-3.5 h-3.5 text-slate-600" />
            No health check performed yet. Click Manual Refresh to check gateway status.
          </div>
        )}

        {/* Error */}
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
                  ? 'OPENCLAW_GATEWAY_URL is not configured. No request was dispatched. Fails closed.'
                  : 'Read-only health check failed. No execution occurred. Check gateway connectivity.'}
              </div>
            </div>
          </div>
        )}

        {/* Live data */}
        {loadState === 'done' && data && (
          <div className="space-y-3">

            {/* Derived status chip + health string */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip status={ds} />
              <span className="text-[7px] font-mono text-slate-500">
                health: <span className="text-slate-300">{data.health || 'UNKNOWN'}</span>
              </span>
              {data.httpStatus && (
                <span className="text-[7px] font-mono text-slate-500">
                  HTTP: <span className="text-slate-300">{data.httpStatus}</span>
                </span>
              )}
            </div>

            {/* Endpoint result badges */}
            {data.endpointResults && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.endpointResults).map(([ep, result]) => (
                  <EndpointBadge key={ep} label={`/${ep}`} result={result} />
                ))}
              </div>
            )}

            {/* Data grid */}
            <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
              <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                Gateway Response (Read-Only · Sanitized)
              </div>
              <InfoRow
                label="Health"
                value={data.health || 'UNKNOWN'}
                valueClass={ds === 'LIVE' ? 'text-primary' : ds === 'DEGRADED' ? 'text-amber-400' : 'text-destructive'}
              />
              <InfoRow
                label="Default Model"
                value={data.defaultModel || 'MODEL_UNKNOWN'}
                valueClass={data.defaultModel && !data.defaultModel.includes('FAILED') && !data.defaultModel.includes('UNKNOWN') ? 'text-slate-300' : 'text-slate-500'}
              />
              <InfoRow
                label="Agents Available"
                value={data.agentsAvailable !== undefined ? String(data.agentsAvailable) : 'AGENTS_UNKNOWN'}
                valueClass={typeof data.agentsAvailable === 'number' ? 'text-slate-300' : 'text-slate-500'}
              />
              <InfoRow
                label="Commands Available"
                value={data.commandsAvailable !== undefined ? String(data.commandsAvailable) : 'COMMANDS_UNKNOWN'}
                valueClass={typeof data.commandsAvailable === 'number' ? 'text-slate-300' : 'text-slate-500'}
              />
              <InfoRow
                label="Uptime"
                value={data.uptime || 'NOT_REPORTED'}
                valueClass="text-slate-500"
              />
            </div>

            {/* Raw previews */}
            <RawPreviewSection rawPreviews={data.rawPreviews} endpointResults={data.endpointResults} />
          </div>
        )}

        {/* Static infra labels */}
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
          <div>executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT</div>
          <div>source: openclawGatewayReadStatus · endpoints: /health /models /agents /commands · READ_ONLY</div>
        </div>

      </div>
    </div>
  );
}