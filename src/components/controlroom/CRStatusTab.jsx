import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Wifi, WifiOff, Lock, Shield } from 'lucide-react';

const Row = ({ label, value, valueClass = 'text-foreground' }) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 last:border-0">
    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
    <span className={`text-[10px] font-mono font-semibold ${valueClass}`}>{value}</span>
  </div>
);

export default function CRStatusTab() {
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('openclawStatus', {});
      setGatewayStatus(res.data);
    } catch {
      setGatewayStatus(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const online = gatewayStatus?.online;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">System Status</h2>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-slate-400 hover:bg-secondary/50 transition-colors rounded disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Gateway Status Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <div className="flex items-center gap-2">
            {online ? <Wifi className="w-3.5 h-3.5 text-primary" /> : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">OpenClaw Gateway</span>
            <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded border ${online ? 'text-primary bg-primary/10 border-primary/30' : 'text-destructive bg-destructive/10 border-destructive/30'}`}>
              {loading ? 'CHECKING…' : online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <div>
          <Row label="Gateway URL" value={gatewayStatus?.url || 'openclaw.veridancore.com'} valueClass="text-blue-400" />
          <Row label="HTTP Status" value={gatewayStatus?.gatewayStatus ? `HTTP ${gatewayStatus.gatewayStatus}` : '—'} />
          <Row label="Version" value={gatewayStatus?.version || '2026.5.2'} />
          <Row label="CF Access" value={gatewayStatus?.protected ? 'PROTECTED' : online ? 'OPEN' : '—'} valueClass={gatewayStatus?.protected ? 'text-amber-500' : 'text-slate-400'} />
          <Row label="Last Heartbeat" value={lastChecked ? lastChecked.toLocaleTimeString() : '—'} />
        </div>
      </div>

      {/* Governance State Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">Governance State</span>
          </div>
        </div>
        <div>
          <Row label="Current Mode" value="GOVERNED_PREVIEW" valueClass="text-amber-500" />
          <Row label="Execution Status" value="LOCKED" valueClass="text-destructive" />
          <Row label="Browser Automation" value="GOVERNED" valueClass="text-amber-500" />
          <Row label="API Trading" value="DISABLED" valueClass="text-destructive" />
          <Row label="Money Movement" value="DISABLED" valueClass="text-destructive" />
          <Row label="Credential Entry" value="DISABLED" valueClass="text-destructive" />
          <Row label="Live Broker Calls" value="DISABLED" valueClass="text-destructive" />
        </div>
      </div>

      {/* VPS Placeholder */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">VPS Status</span>
            <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded border text-slate-400 bg-secondary/50 border-border">PREVIEW ONLY</span>
          </div>
        </div>
        <div>
          <Row label="VPS Region" value="us-east-1 (configured)" />
          <Row label="OpenClaw Process" value="Running (gateway reports)" valueClass="text-primary" />
          <Row label="Playwright" value="Installed" valueClass="text-primary" />
          <Row label="Direct SSH" value="Not available from UI" valueClass="text-slate-400" />
        </div>
      </div>
    </div>
  );
}