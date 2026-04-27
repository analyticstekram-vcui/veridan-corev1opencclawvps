import React, { useState, useEffect } from 'react';
import { PanelRightClose, PanelRightOpen, ShieldAlert } from 'lucide-react';

const InspectorRow = ({ label, value, color }) => (
  <div className="px-3 py-2 border-b border-border/50">
    <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">{label}</div>
    <div className={`text-[11px] font-mono ${color}`}>{value ?? '—'}</div>
  </div>
);

export default function InspectorPanel({ collapsed, onToggle, pendingApprovals = [], openClawOnline, veridanStatus }) {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const ui = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(ui);
  }, []);

  const fmtUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const resolvedOnline = openClawOnline ?? null;
  const openclawStatus = resolvedOnline === null ? 'CHECKING' : resolvedOnline ? 'ONLINE' : 'OFFLINE';

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-8 bg-card border-l border-border flex items-start pt-3 justify-center shrink-0 hover:bg-secondary/30 transition-colors"
        title="Open Inspector"
      >
        <PanelRightOpen className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="w-56 bg-card border-l border-border flex flex-col shrink-0 select-none">
      <div className="h-8 border-b border-border flex items-center justify-between px-3 shrink-0">
        <span className="text-[11px] font-mono text-muted-foreground">INSPECTOR</span>
        <button onClick={onToggle} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          <PanelRightClose className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <InspectorRow label="Active Module" value="AI Command" color="text-primary" />
        <InspectorRow label="Active Vault" value={veridanStatus?.vault.name} color="text-foreground" />
        <InspectorRow label="AI Model" value={veridanStatus?.ai.model} color="text-blue-400" />
        <InspectorRow
          label="OpenClaw"
          value={openclawStatus}
          color={resolvedOnline === null ? 'text-amber-500' : resolvedOnline ? 'text-primary' : 'text-destructive'}
        />
        <InspectorRow
          label="System State"
          value={veridanStatus ? 'NOMINAL' : 'INITIALIZING'}
          color={veridanStatus ? 'text-primary' : 'text-amber-500'}
        />

        {/* Pending Approvals */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-1.5">
            Pending Approval ({pendingApprovals.length})
          </div>
          {pendingApprovals.length === 0 ? (
            <div className="text-[10px] font-mono text-muted-foreground/30">None</div>
          ) : (
            <div className="space-y-1">
              {pendingApprovals.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/5 border border-amber-500/20">
                  <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-amber-500">{p.action}</div>
                    <div className="text-[9px] font-mono text-muted-foreground/50">risk: {p.riskLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-3 py-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-muted-foreground/40">SESSION</span>
          <span className="text-[9px] font-mono text-muted-foreground/60">{fmtUptime(uptime)}</span>
        </div>
      </div>
    </div>
  );
}