import React from 'react';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';

const FIELD_COLOR = (v) => {
  if (v === true || v === 'CONNECTED' || v === 'true') return 'text-primary';
  if (v === false || v === 'DISCONNECTED' || v === 'false') return 'text-destructive';
  if (v === 'UNKNOWN' || v == null) return 'text-slate-500';
  return 'text-slate-300';
};

export default function TvMcpConnectionStatus({ status, loading, onRefresh }) {
  const serverStatus = status
    ? (status.data?.cdp_connected === true ? 'CONNECTED' : status.data?.mcp_server || 'UNKNOWN')
    : 'UNKNOWN';

  const fields = [
    { label: 'MCP Server',   value: serverStatus },
    { label: 'CDP Connected', value: status?.data?.cdp_connected != null ? String(status.data.cdp_connected) : '—' },
    { label: 'API Available', value: status?.data?.api_available  != null ? String(status.data.api_available)  : '—' },
    { label: 'Symbol',        value: status?.data?.chart_symbol   || 'CME_MINI_DL:MNQH2026' },
    { label: 'Resolution',    value: status?.data?.chart_resolution || '240' },
    { label: 'Last Checked',  value: status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : '—' },
    { label: 'Bridge Mode',   value: 'READ_ONLY' },
    { label: 'Execution',     value: 'DISABLED' },
    { label: 'Dry Run',       value: status?.isDryRun ? 'YES (local relay not yet configured)' : (status ? 'NO' : '—') },
  ];

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-secondary/20">
        <div className="flex items-center gap-2">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            : serverStatus === 'CONNECTED'
              ? <Wifi className="w-3.5 h-3.5 text-primary" />
              : <WifiOff className="w-3.5 h-3.5 text-slate-500" />
          }
          <span className="text-[9px] font-bold uppercase text-slate-300">Connection Status</span>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 bg-secondary/30 border border-border/40 text-slate-400 text-[8px] font-bold rounded-sm hover:text-slate-200 hover:border-border/60 disabled:opacity-40 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fields.map(({ label, value }) => (
          <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
            <div className="text-[7px] uppercase text-slate-500 mb-0.5 font-bold">{label}</div>
            <div className={`text-[9px] font-mono font-bold ${FIELD_COLOR(value)}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}