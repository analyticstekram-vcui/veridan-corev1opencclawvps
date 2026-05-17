import React from 'react';
import { Wifi, Lock, Shield } from 'lucide-react';

const Row = ({ label, value, valueClass = 'text-foreground' }) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 last:border-0">
    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
    <span className={`text-[10px] font-mono font-semibold ${valueClass}`}>{value}</span>
  </div>
);

export default function CRStatusTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">System Status</h2>
      </div>

      {/* Gateway Status Card — conservative, non-contradictory */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">OpenClaw Gateway</span>
            <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded border text-slate-400 bg-secondary/50 border-border">
              NOT CHECKED HERE
            </span>
          </div>
        </div>
        <div>
          <Row label="Live Status" value="Use Gateway Health tab for live read-only status" valueClass="text-amber-400" />
          <Row label="Status Source" value="Gateway Health tab → Run Check" valueClass="text-slate-400" />
          <Row label="Last Checked Here" value="N/A — no auto-poll" valueClass="text-slate-500" />
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