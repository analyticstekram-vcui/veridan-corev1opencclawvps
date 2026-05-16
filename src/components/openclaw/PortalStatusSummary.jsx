import React from 'react';
import { Wifi, WifiOff, Lock, Radio } from 'lucide-react';

const StatusCell = ({ label, value, valueClass = 'text-slate-300' }) => (
  <div className="bg-card border border-border/60 rounded px-3 py-2">
    <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
    <div className={`text-[10px] font-bold font-mono ${valueClass}`}>{value}</div>
  </div>
);

export default function PortalStatusSummary({ gatewayOnline, loading, operatorMode }) {
  return (
    <div className="border-b border-border bg-secondary/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-3 h-3 text-primary" />
        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">System Status Summary</span>
        {loading && <span className="text-[8px] text-amber-500 animate-pulse ml-auto">POLLING…</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
        <StatusCell
          label="OpenClaw VPS"
          value={loading ? 'CHECKING…' : gatewayOnline ? 'CONNECTED' : 'NOT CONNECTED'}
          valueClass={loading ? 'text-amber-500' : gatewayOnline ? 'text-primary' : 'text-destructive'}
        />
        <StatusCell label="Gateway Mode"   value="READ_ONLY"          valueClass="text-amber-500" />
        <StatusCell label="Operator Mode"  value={operatorMode}       valueClass="text-slate-300" />
        <StatusCell label="Execution Lock" value="LOCKED"             valueClass="text-destructive" />
        <StatusCell label="API Trading"    value="DISABLED"           valueClass="text-destructive" />
        <StatusCell label="Direct OpenAI"  value="DISABLED"           valueClass="text-destructive" />
        <StatusCell label="AI Route"       value="OpenClaw / Codex"   valueClass="text-primary" />
      </div>
    </div>
  );
}