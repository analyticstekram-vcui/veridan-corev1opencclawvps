import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Wifi, WifiOff, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';

const ENDPOINT = 'https://openclaw.veridancore.com';

// Map backend diagnostic keys → display config
const DIAGNOSTIC_DISPLAY = {
  openclaw_online: {
    label: 'OPENCLAW_ONLINE',
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
    icon: CheckCircle2,
  },
  cloudflare_protected_reachable: {
    label: 'CLOUDFLARE_PROTECTED_REACHABLE',
    color: 'text-amber-500',
    bg: 'bg-amber-500/5 border-amber-500/20',
    icon: ShieldCheck,
  },
  gateway_unreachable: {
    label: 'GATEWAY_UNREACHABLE',
    color: 'text-destructive',
    bg: 'bg-destructive/5 border-destructive/20',
    icon: WifiOff,
  },
  gateway_error: {
    label: 'GATEWAY_ERROR',
    color: 'text-destructive',
    bg: 'bg-destructive/5 border-destructive/20',
    icon: AlertCircle,
  },
  backend_unreachable: {
    label: 'CONFIG_MISSING',
    color: 'text-slate-400',
    bg: 'bg-slate-500/5 border-slate-500/20',
    icon: AlertCircle,
  },
};

export default function OpenClawGatewayConnectorPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);

  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('openclawStatus', {});
      const data = response.data;
      setResult(data);

      // Write local audit preview entry
      const entry = {
        timestamp: new Date().toISOString(),
        action: 'OpenClaw gateway status check performed — read-only.',
        endpoint: data?.url || ENDPOINT,
        httpStatus: data?.gatewayStatus ?? 'N/A',
        gatewayStatus: DIAGNOSTIC_DISPLAY[data?.diagnostic]?.label || data?.diagnostic?.toUpperCase() || 'UNKNOWN',
        mode: 'READ_ONLY',
        note: 'No command execution was attempted.',
      };
      setAuditLog(prev => [entry, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message || 'Status check failed');
    } finally {
      setLoading(false);
    }
  };

  const diag = result ? (DIAGNOSTIC_DISPLAY[result.diagnostic] || DIAGNOSTIC_DISPLAY.backend_unreachable) : null;
  const DiagIcon = diag?.icon || AlertCircle;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Gateway Connector</div>
        <div className="text-[13px] font-semibold text-foreground">OpenClaw Gateway Status Check</div>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-amber-500/90">
          <span className="font-bold">READ_ONLY / PREVIEW_ONLY</span> — This check requests only safe status/health information.
          No commands are executed. No browser actions. No trading commands. No credentials requested. No live execution enabled.
        </div>
      </div>

      {/* Endpoint + Button */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Endpoint</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-secondary/40 border border-border rounded text-[10px] font-mono text-blue-400 select-all">
            {ENDPOINT}
          </div>
          <span className="text-[8px] px-2 py-1 border border-slate-500/30 bg-slate-500/5 text-slate-400 rounded font-bold uppercase whitespace-nowrap">
            GET · manual redirect
          </span>
        </div>
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking…' : 'Check Gateway Status'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-[10px] text-destructive">
            <div className="font-semibold mb-0.5">Check Failed</div>
            <div className="text-[9px] text-destructive/80">{error}</div>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && diag && (
        <div className={`border rounded-lg p-4 space-y-4 ${diag.bg}`}>
          {/* Status Row */}
          <div className="flex items-center gap-3">
            <DiagIcon className={`w-5 h-5 ${diag.color} shrink-0`} />
            <div>
              <div className={`text-[12px] font-bold uppercase tracking-wide ${diag.color}`}>
                {diag.label}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">{result.diagnosticDetail}</div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px]">
            <div className="bg-card/60 border border-border/40 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Endpoint Checked</div>
              <div className="font-mono text-blue-400 text-[8px] truncate">{result.url || ENDPOINT}</div>
            </div>
            <div className="bg-card/60 border border-border/40 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">HTTP Status</div>
              <div className="font-semibold text-foreground">{result.gatewayStatus ?? 'N/A'}</div>
            </div>
            <div className="bg-card/60 border border-border/40 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Gateway Status</div>
              <div className={`font-bold ${diag.color}`}>{diag.label}</div>
            </div>
            <div className="bg-card/60 border border-border/40 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Timestamp</div>
              <div className="text-foreground/80 text-[8px]">{result.lastChecked ? new Date(result.lastChecked).toLocaleString() : '—'}</div>
            </div>
            <div className="bg-card/60 border border-border/40 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Mode</div>
              <div className="font-bold text-amber-500">READ_ONLY</div>
            </div>
            <div className="bg-card/60 border border-border/40 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">CF Access</div>
              <div className="font-semibold text-foreground">{result.protected ? 'Protected' : result.online ? 'Open' : '—'}</div>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-center gap-2 px-3 py-2 bg-card/40 border border-border/30 rounded text-[9px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            No command execution was attempted.
          </div>
        </div>
      )}

      {/* Local Audit Preview Log */}
      {auditLog.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Local Audit Preview</div>
            <span className="ml-auto text-[8px] text-slate-500 uppercase tracking-widest">Session only — not persisted</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {auditLog.map((entry, i) => (
              <div key={i} className="bg-card border border-border/30 rounded px-3 py-2 text-[8px] space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-slate-400 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className={`ml-auto font-bold px-1.5 py-0.5 rounded border text-[7px] uppercase ${
                    entry.gatewayStatus === 'OPENCLAW_ONLINE' ? 'text-primary border-primary/30 bg-primary/5' :
                    entry.gatewayStatus === 'CLOUDFLARE_PROTECTED_REACHABLE' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' :
                    'text-destructive border-destructive/30 bg-destructive/5'
                  }`}>{entry.gatewayStatus}</span>
                </div>
                <div className="text-slate-300">{entry.action}</div>
                <div className="text-slate-500 grid grid-cols-2 gap-x-4">
                  <span>Endpoint: <span className="text-blue-400 font-mono">{entry.endpoint}</span></span>
                  <span>HTTP: <span className="text-foreground">{entry.httpStatus}</span></span>
                  <span>Mode: <span className="text-amber-500 font-semibold">{entry.mode}</span></span>
                  <span>{entry.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Footer */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[9px] text-primary/80">
          <span className="font-semibold">Read-Only Gateway Connector</span> — Only safe status/health information is requested.
          Uses <code className="text-primary/70">redirect: manual</code> to detect Cloudflare Access responses without following redirects.
          No credentials, no execution, no trading, no mutations.
        </div>
      </div>
    </div>
  );
}