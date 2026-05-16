/**
 * ReadOnlyGatewayHealthCheck
 * Runs a read-only health check against the OpenClaw gateway.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw command dispatch
 *   - No signed bridge request dispatch
 *   - No browser tools
 *   - No ExecutionQueue records
 *   - No OpenClawCommand records
 *   - No credentials / secrets used
 *   - No trading / money movement
 *   - Gateway Mode: READ_ONLY
 *   - Execution: LOCKED / DISABLED
 */
import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Copy, Clock, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { appendAudit } from '@/lib/proposalStore';
import GatewayResponseInspector from './GatewayResponseInspector.jsx';

const ENDPOINT        = 'https://openclaw.veridancore.com';
const HEALTH_KEY      = 'openclawReadOnlyGatewayHealthChecks';
const ATTEMPTED_PATHS = ['/health', '/status', '/version', '/capabilities'];

const STATUS_MAP = {
  openclaw_online:                { label: 'OPENCLAW_ONLINE',                color: 'text-primary',     bg: 'bg-primary/5 border-primary/30' },
  cloudflare_protected_reachable: { label: 'CLOUDFLARE_PROTECTED_REACHABLE', color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/30' },
  gateway_unreachable:            { label: 'GATEWAY_UNREACHABLE',            color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/30' },
  gateway_error:                  { label: 'GATEWAY_ERROR',                  color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/30' },
  backend_unreachable:            { label: 'CONFIG_MISSING',                 color: 'text-slate-400',   bg: 'bg-slate-500/5 border-slate-500/30' },
};

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadHealthChecks() {
  try { return JSON.parse(localStorage.getItem(HEALTH_KEY) || '[]'); } catch { return []; }
}
function saveHealthCheck(record) {
  const all = loadHealthChecks();
  all.unshift(record);
  localStorage.setItem(HEALTH_KEY, JSON.stringify(all.slice(0, 100)));
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Result JSON'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ReadOnlyGatewayHealthCheck() {
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [error,          setError]          = useState(null);
  const [history,        setHistory]        = useState([]);
  const [inspectTrigger, setInspectTrigger] = useState(0);

  useEffect(() => {
    const checks = loadHealthChecks();
    setHistory(checks);
    if (checks.length > 0) setResult(checks[0]);
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError(null);

    const operatorId = await base44.auth.me().then(u => u?.email || 'operator').catch(() => 'operator');
    const now        = new Date().toISOString();
    const checkId    = 'ghc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    let rawData = null;
    try {
      const response = await base44.functions.invoke('openclawStatus', {});
      rawData = response.data;
    } catch (err) {
      setError(err.message || 'Health check failed — backend unreachable');
      setLoading(false);
      return;
    }

    const diag = rawData?.diagnostic || 'backend_unreachable';
    const statusCfg = STATUS_MAP[diag] || STATUS_MAP.backend_unreachable;

    const record = {
      checkId,
      createdAt:               now,
      operatorId,
      endpointChecked:         rawData?.url || ENDPOINT,
      attemptedPaths:          ATTEMPTED_PATHS,
      httpStatus:              rawData?.gatewayStatus ?? null,
      interpretedGatewayStatus: statusCfg.label,
      diagnosticDetail:        rawData?.diagnosticDetail || '',
      timestamp:               now,
      gatewayMode:             'READ_ONLY',
      executionLock:           'LOCKED',
      openClawCommandSent:     false,
      browserToolUsed:         false,
      executionAttempted:      false,
      cfAccessDetected:        rawData?.protected ?? false,
      gatewayOnline:           rawData?.online ?? false,
      note:                    'Read-only health check only. No OpenClaw command dispatch. No browser action. No execution.',
    };

    saveHealthCheck(record);
    appendAudit({
      event:     'read_only_openclaw_gateway_health_check_performed',
      checkId,
      endpoint:  record.endpointChecked,
      status:    record.interpretedGatewayStatus,
      note:      `Read-only gateway health check performed (${checkId}). Status: ${record.interpretedGatewayStatus}. No command dispatch. No execution.`,
    });

    const updated = loadHealthChecks();
    setHistory(updated);
    setResult(record);
    setInspectTrigger(t => t + 1);
    setLoading(false);
  };

  const statusCfg = result ? (STATUS_MAP[
    Object.entries(STATUS_MAP).find(([, v]) => v.label === result.interpretedGatewayStatus)?.[0]
    || 'backend_unreachable'
  ]) : null;

  const lastCheck = history[0];

  return (
    <div className="space-y-4">

      {/* Section header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Phase: Gateway Health</div>
        <div className="text-[13px] font-bold text-foreground">Read-Only OpenClaw Gateway Health Call</div>
        <div className="text-[9px] text-slate-500 mt-0.5">
          Verifies VeridanCore can see the OpenClaw VPS/Gateway without executing commands.
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-3 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-amber-500/90">
          <span className="font-bold">READ_ONLY / LOCKED</span> — Only safe health/status metadata is requested.
          No commands. No dispatch. No browser tools. No trading. No credentials.
        </div>
      </div>

      {/* Endpoint + Run button */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-secondary/40 border border-border rounded text-[10px] font-mono text-blue-400 select-all">
            {ENDPOINT}
          </div>
          <span className="text-[7px] px-2 py-1 border border-slate-500/20 bg-slate-500/5 text-slate-500 rounded font-bold uppercase whitespace-nowrap">
            GET · health only
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ATTEMPTED_PATHS.map(p => (
            <span key={p} className="px-2 py-1 bg-secondary/40 border border-border/50 rounded text-[8px] font-mono text-slate-400">{p}</span>
          ))}
        </div>

        <button type="button" onClick={handleRun} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50 w-full justify-center">
          <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Running Health Check…' : 'Run Read-Only Gateway Health Check'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Summary card — always shown once data exists */}
      {lastCheck && (
        <div className="bg-card border border-border/60 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Gateway Health Summary</span>
            <span className="ml-auto text-[8px] text-slate-500 font-mono">{new Date(lastCheck.createdAt).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Last Health Check',         value: new Date(lastCheck.createdAt).toLocaleTimeString(), color: 'text-foreground' },
              { label: 'Gateway Status',            value: lastCheck.interpretedGatewayStatus,                color: lastCheck.gatewayOnline ? 'text-primary font-bold' : 'text-destructive font-bold' },
              { label: 'OpenClaw Commands Sent',    value: '0',                                               color: 'text-destructive font-bold' },
              { label: 'Browser Tools Used',        value: '0',                                               color: 'text-destructive font-bold' },
              { label: 'Executions Attempted',      value: '0',                                               color: 'text-destructive font-bold' },
              { label: 'Gateway Mode',              value: 'READ_ONLY',                                       color: 'text-amber-500 font-bold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                <div className={`text-[10px] ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full result card */}
      {result && statusCfg && (
        <div className={`border rounded-lg p-3 space-y-3 ${statusCfg.bg}`}>
          <div className="flex items-start gap-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.color}`} />
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wide ${statusCfg.color}`}>
                {result.interpretedGatewayStatus}
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5">{result.diagnosticDetail}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-slate-500">
            <span>Endpoint: <span className="text-blue-400 font-mono text-[7px]">{result.endpointChecked}</span></span>
            <span>HTTP Status: <span className="text-foreground font-semibold">{result.httpStatus ?? 'N/A'}</span></span>
            <span>Timestamp: <span className="text-slate-300 font-mono text-[7px]">{new Date(result.timestamp).toLocaleString()}</span></span>
            <span>CF Access: <span className="text-amber-500 font-semibold">{result.cfAccessDetected ? 'DETECTED' : 'Not detected'}</span></span>
            <span>Gateway Mode: <span className="text-amber-500 font-semibold">{result.gatewayMode}</span></span>
            <span>Execution Lock: <span className="text-amber-500 font-semibold">{result.executionLock}</span></span>
            <span>OpenClaw Command Sent: <span className="text-destructive font-bold">{String(result.openClawCommandSent)}</span></span>
            <span>Browser Tool Used: <span className="text-destructive font-bold">{String(result.browserToolUsed)}</span></span>
            <span>Execution Attempted: <span className="text-destructive font-bold">{String(result.executionAttempted)}</span></span>
            <span className="col-span-2">Attempted Paths: <span className="text-slate-300 font-mono">{result.attemptedPaths?.join(', ')}</span></span>
          </div>

          <div className="text-[8px] text-slate-500 italic">{result.note}</div>

          <div className="flex flex-wrap gap-2">
            <CopyButton text={JSON.stringify(result, null, 2)} />
          </div>

          <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            Read-only health check only · No command dispatch · No execution · Gateway Mode: READ_ONLY
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <details>
          <summary className="text-[8px] text-slate-500 cursor-pointer hover:text-slate-300 uppercase tracking-widest font-semibold">
            Check History ({history.length} records)
          </summary>
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {history.slice(1).map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-secondary/10 border border-border/30 rounded text-[8px]">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-400 font-mono">{new Date(h.createdAt).toLocaleString()}</span>
                <span className={`font-bold ml-auto ${
                  h.interpretedGatewayStatus === 'OPENCLAW_ONLINE' ? 'text-primary' :
                  h.interpretedGatewayStatus === 'CLOUDFLARE_PROTECTED_REACHABLE' ? 'text-amber-500' : 'text-destructive'
                }`}>{h.interpretedGatewayStatus}</span>
                <span className="text-slate-500">HTTP {h.httpStatus ?? 'N/A'}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Gateway Response Inspector ── */}
      <div className="border-t border-border/40 pt-4">
        <GatewayResponseInspector refreshTrigger={inspectTrigger} />
      </div>
    </div>
  );
}