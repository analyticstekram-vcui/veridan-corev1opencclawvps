import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Terminal, RefreshCw, ExternalLink, Copy, ShieldCheck, Clock, Wifi, WifiOff } from 'lucide-react';
import CommandQueuePanel from '@/components/openclaw/CommandQueuePanel';
import ExecutionReadinessPanel from '@/components/openclaw/ExecutionReadinessPanel';
import TelemetryPanel from '@/components/openclaw/TelemetryPanel';
import WorkflowPanel from '@/components/openclaw/WorkflowPanel';

export default function OpenClawControl() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('status'); // 'status' | 'queue'
  const intervalRef = useRef(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('openclawStatus', {});
      setStatus(res.data);
    } catch (_) {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 15000);
    base44.auth.me().then(setCurrentUser).catch(() => {});
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleOpen = async () => {
    // Audit event
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: JSON.stringify({
          eventType: 'OPENCLAW_PANEL_OPENED',
          source: 'VeridanCore.UI',
          target: 'OpenClawGateway',
          status: 'USER_INITIATED',
          timestamp: new Date().toISOString(),
        }),
        response_json_schema: { type: 'object', properties: { logged: { type: 'boolean' } } },
      });
    } catch (_) { /* non-blocking */ }

    if (status?.url) window.open(status.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    if (status?.url) {
      navigator.clipboard.writeText(status.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const online = status?.online;

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wider text-foreground">OPENCLAW CONTROL</h1>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Gateway monitor · Governance queue · Veridan Core</p>
        </div>
      </div>
        {/* View Toggle */}
        <div className="flex gap-1">
          {[['status', 'Status'], ['queue', 'Command Queue'], ['workflows', 'Workflows'], ['readiness', 'Execution Readiness'], ['telemetry', 'Telemetry']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveView(id)}
              className={`px-3 py-1.5 text-[11px] border transition-colors ${activeView === id ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Command Queue View */}
      {activeView === 'queue' && (
        <div className="h-[calc(100vh-56px)]">
          <CommandQueuePanel currentUser={currentUser} />
        </div>
      )}

      {/* Workflows View */}
      {activeView === 'workflows' && (
        <div className="h-[calc(100vh-56px)]">
          <WorkflowPanel currentUser={currentUser} executionMode="SIMULATED" executionPaused={false} />
        </div>
      )}

      {/* Execution Readiness View */}
      {activeView === 'readiness' && (
        <div className="overflow-auto h-[calc(100vh-56px)]">
          <ExecutionReadinessPanel gatewayOnline={status?.online} />
        </div>
      )}

      {/* Telemetry View */}
      {activeView === 'telemetry' && (
        <div className="overflow-auto h-[calc(100vh-56px)]">
          <TelemetryPanel executionMode="SIMULATED" gatewayOnline={status?.online} />
        </div>
      )}

      {/* Status View */}
      {activeView === 'status' && <div className="p-6 max-w-2xl space-y-4">
        {/* Status Card */}
        <div className="bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Gateway Status</span>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[13px] text-amber-500">CHECKING...</span>
              </div>
            ) : online ? (
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-primary">ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-[13px] font-semibold text-destructive">OFFLINE</span>
              </div>
            )}
          </div>

          {/* URL Field */}
          <div className="mb-4">
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Gateway URL</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border text-[11px] text-muted-foreground truncate select-all">
                {status?.url || '—'}
              </div>
              <button
                onClick={handleCopy}
                disabled={!status?.url}
                className="px-2.5 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-30"
              >
                <Copy className="w-3 h-3" />
              </button>
              {copied && <span className="text-[10px] text-primary">Copied!</span>}
            </div>
          </div>

          {/* Last Checked */}
          {status?.lastChecked && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-4">
              <Clock className="w-3 h-3" />
              Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
            </div>
          )}

          {/* Metadata */}
          {status && (
            <div className="grid grid-cols-2 gap-2 mb-5 text-[10px]">
              <div className="bg-secondary/30 border border-border px-3 py-2">
                <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Auth Layer</div>
                <div className="text-foreground">{status.authLayer}</div>
              </div>
              <div className="bg-secondary/30 border border-border px-3 py-2">
                <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Mode</div>
                <div className="text-foreground capitalize">{status.mode?.replace('-', ' ')}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              disabled={!status?.url}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-3 h-3" />
              Open OpenClaw
            </button>
          </div>
        </div>

        {/* Security Warning */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 px-4 py-3">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-semibold text-amber-500 mb-0.5">Protected by Cloudflare Access</div>
            <div className="text-[10px] text-muted-foreground/70">
              Authentication is enforced at the gateway layer. This panel does not bypass or store Cloudflare credentials.
              Command execution is disabled pending governance approval.
            </div>
          </div>
        </div>

        {/* Iframe area */}
        <div className="bg-card border border-border">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Embedded View</span>
            <span className="text-[9px] text-muted-foreground/40">May be blocked by browser security policy</span>
          </div>
          {!iframeBlocked && status?.url ? (
            <iframe
              src={status.url}
              className="w-full h-64 bg-secondary/20"
              title="OpenClaw Gateway"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onError={() => setIframeBlocked(true)}
            />
          ) : (
            <div className="h-32 flex flex-col items-center justify-center gap-3 text-center px-4">
              <div className="text-[11px] text-muted-foreground/50">
                {iframeBlocked
                  ? 'Iframe blocked by browser or Cloudflare X-Frame-Options policy.'
                  : 'No gateway URL configured.'}
              </div>
              {status?.url && (
                <button
                  onClick={handleOpen}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Open in new tab instead
                </button>
              )}
            </div>
          )}
        </div>

        {/* Poll indicator */}
        <div className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-widest">
          Status polling every 15 seconds · Read-only mode
        </div>
      </div>}
    </div>
  );
}