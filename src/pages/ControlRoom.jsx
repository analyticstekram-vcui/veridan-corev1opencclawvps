import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Radio, Eye, Terminal, Layers, Shield, Wrench, FileText, Activity } from 'lucide-react';
import SafetyBoundaryBanner from '@/components/controlroom/SafetyBoundaryBanner';
import OpenClawGatewayHealthPanel from '@/components/terminal/OpenClawGatewayHealthPanel';
import CRStatusTab from '@/components/controlroom/CRStatusTab';
import CRMonitoringTab from '@/components/controlroom/CRMonitoringTab';
import CRSafeCommandTab from '@/components/controlroom/CRSafeCommandTab';
import CRProposedActionsTab from '@/components/controlroom/CRProposedActionsTab';
import CRGovernanceTab from '@/components/controlroom/CRGovernanceTab';
import CRToolRegistryTab from '@/components/controlroom/CRToolRegistryTab';
import CRAuditLogTab from '@/components/controlroom/CRAuditLogTab';



const TABS = [
  { id: 'status',     label: 'Status',            icon: Radio },
  { id: 'monitoring', label: 'Monitoring Setup',   icon: Eye },
  { id: 'safe_cmd',   label: 'Safe Command Test',  icon: Terminal },
  { id: 'proposed',   label: 'Proposed Actions',   icon: Layers },
  { id: 'governance', label: 'Governance Queue',   icon: Shield },
  { id: 'tools',      label: 'Tool Registry',      icon: Wrench },
  { id: 'gateway',    label: 'Gateway Health',    icon: Activity },
  { id: 'audit',      label: 'Audit Log',          icon: FileText },
];

export default function ControlRoom() {
  const [activeTab, setActiveTab] = useState('status');

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background font-mono">

      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold">
          <Home className="w-3 h-3" />
          Command Center
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 bg-primary/10 border border-primary/30 rounded flex items-center justify-center">
             <Radio className="w-3.5 h-3.5 text-primary" />
           </div>
           <div>
             <h1 className="text-[13px] font-bold text-slate-100 tracking-wide">AI Operator Control Room</h1>
             <p className="text-[9px] text-slate-300">Veridan Core · Governed Preview Mode · OpenClaw Gateway</p>
           </div>
         </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/openclaw-control"
            className="px-3 py-1.5 text-[10px] border border-border text-slate-300 hover:text-slate-100 hover:bg-secondary/50 transition-colors rounded font-semibold"
          >
            OpenClaw Full Panel →
          </Link>
        </div>
      </div>

      {/* Safety Banner */}
      <SafetyBoundaryBanner />

      {/* Safety Summary Card */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4 space-y-3">
        <div>
          <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100 tracking-wide mb-3">Control Room Safety Summary</h2>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            This page can monitor and review system state, but it cannot execute commands, place trades, move money, or reveal secrets.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Mode</div>
            <div className="text-[10px] font-mono font-bold text-slate-300">PREVIEW</div>
          </div>
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">OpenClaw</div>
            <div className="text-[10px] font-mono font-bold text-amber-500">READ_ONLY</div>
          </div>
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Execution</div>
            <div className="text-[10px] font-mono font-bold text-destructive">DISABLED</div>
          </div>
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Browser Control</div>
            <div className="text-[10px] font-mono font-bold text-destructive">NOT ACTIVE</div>
          </div>
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Trading</div>
            <div className="text-[10px] font-mono font-bold text-destructive">DISABLED</div>
          </div>
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Money Movement</div>
            <div className="text-[10px] font-mono font-bold text-destructive">DISABLED</div>
          </div>
          <div className="bg-secondary/30 border border-border/50 rounded-sm px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Credential Values</div>
            <div className="text-[10px] font-mono font-bold text-destructive">NEVER DISPLAYED</div>
          </div>
        </div>
      </div>

      {/* Operator Next Action Card */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="space-y-3">
          <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100 tracking-wide">Operator Next Action</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
            <p className="text-[11px] font-mono font-bold text-primary mb-2">Run a manual Gateway Health check, then review the result.</p>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              This verifies whether OpenClaw is reachable without enabling execution, automation, trading, browser control, or money movement.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono font-semibold uppercase text-muted-foreground/70 mb-2">Action Checklist</div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">☐</span>
              <span className="text-[10px] text-slate-300">Open Gateway Health tab</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">☐</span>
              <span className="text-[10px] text-slate-300">Click Run Check</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">☐</span>
              <span className="text-[10px] text-slate-300">Confirm READ_ONLY status</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">☐</span>
              <span className="text-[10px] text-slate-300">Confirm no credential values are shown</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">☐</span>
              <span className="text-[10px] text-slate-300">Confirm execution remains disabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Room Baseline Card */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="space-y-3">
          <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100 tracking-wide">Control Room Baseline</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Baseline Name</span>
              <span className="text-[10px] font-mono font-bold text-slate-300">Safe Read-Only Control Room</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Baseline Status</span>
              <span className="text-[10px] font-mono font-bold text-primary">APPROVED</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Gateway Health</span>
              <span className="text-[10px] font-mono font-bold text-slate-300">Manual read-only check only</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Status Tab</span>
              <span className="text-[10px] font-mono font-bold text-slate-300">Static safety summary only</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Execution</span>
              <span className="text-[10px] font-mono font-bold text-destructive">Disabled</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Trading</span>
              <span className="text-[10px] font-mono font-bold text-destructive">Disabled</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Money Movement</span>
              <span className="text-[10px] font-mono font-bold text-destructive">Disabled</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Credential Values</span>
              <span className="text-[10px] font-mono font-bold text-destructive">Never displayed</span>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3 mt-2">
            <p className="text-[10px] text-slate-300 leading-relaxed">
              This baseline confirms the Control Room is approved for read-only monitoring and governance review only.
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Snapshot Export Card */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="space-y-3">
          <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100 tracking-wide">Evidence Snapshot Export</h2>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Export a local proof record of the current safe read-only Control Room baseline.
          </p>
          <button
            type="button"
            onClick={() => {
              const snapshot = {
                snapshotType: "CONTROL_ROOM_SAFE_READ_ONLY_BASELINE",
                baselineName: "Safe Read-Only Control Room",
                baselineStatus: "APPROVED",
                mode: "PREVIEW / GOVERNED",
                openClaw: "READ_ONLY",
                gatewayHealth: "MANUAL_READ_ONLY_CHECK_ONLY",
                statusTab: "STATIC_SAFETY_SUMMARY_ONLY",
                execution: "DISABLED",
                trading: "DISABLED",
                moneyMovement: "DISABLED",
                credentialValues: "NEVER_DISPLAYED",
                generatedAt: new Date().toISOString(),
                safetyClaims: [
                  "No command execution",
                  "No browser control",
                  "No trading",
                  "No money movement",
                  "No credential values displayed",
                  "Manual read-only gateway check only",
                ],
              };
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `control-room-baseline-snapshot-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 text-[10px] font-mono font-bold border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-sm"
          >
            Export Baseline Snapshot
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="shrink-0 border-b border-border bg-card px-2 flex items-end gap-0 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-300 hover:text-slate-100'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'status'     && <CRStatusTab />}
        {activeTab === 'monitoring' && <CRMonitoringTab />}
        {activeTab === 'safe_cmd'   && <CRSafeCommandTab />}
        {activeTab === 'proposed'   && <CRProposedActionsTab />}
        {activeTab === 'governance' && <CRGovernanceTab />}
        {activeTab === 'tools'      && <CRToolRegistryTab />}
        {activeTab === 'gateway'    && (
          <div className="space-y-4">
            {/* Safety Explanation Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
                <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Gateway Health — Read-Only Status Check</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  This tab checks whether the OpenClaw gateway is reachable and responsive. It only runs when you click the button and provides read-only diagnostic information about gateway connectivity and health status.
                </p>
                <div className="space-y-2 text-[9px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">✓</span>
                    <span>Runs only when you click the button — no automatic polling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">✓</span>
                    <span>Does not execute commands or control the browser</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">✓</span>
                    <span>Does not place trades or move money</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">✓</span>
                    <span>Does not reveal credential values — only shows presence flags</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 text-[8px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/30 rounded-sm">READ_ONLY</span>
                  <span className="px-2.5 py-1 text-[8px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-sm">MANUAL_CHECK_ONLY</span>
                  <span className="px-2.5 py-1 text-[8px] font-mono font-bold uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded-sm">NO_EXECUTION</span>
                  <span className="px-2.5 py-1 text-[8px] font-mono font-bold uppercase bg-slate-500/10 text-slate-300 border border-slate-500/30 rounded-sm">NO_CREDENTIAL_VALUES</span>
                </div>
              </div>
            </div>

            {/* Gateway Health Panel */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden flex-1">
              <OpenClawGatewayHealthPanel />
            </div>
          </div>
        )}
        {activeTab === 'audit'      && <CRAuditLogTab />}
      </div>
    </div>
  );
}