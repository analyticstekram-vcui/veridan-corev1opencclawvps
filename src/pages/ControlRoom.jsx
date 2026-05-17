import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Radio, Eye, Terminal, Layers, Shield, Wrench, FileText, Activity } from 'lucide-react';
import SafetyBoundaryBanner from '@/components/controlroom/SafetyBoundaryBanner';
import CRStatusTab from '@/components/controlroom/CRStatusTab';
import CRMonitoringTab from '@/components/controlroom/CRMonitoringTab';
import CRSafeCommandTab from '@/components/controlroom/CRSafeCommandTab';
import CRProposedActionsTab from '@/components/controlroom/CRProposedActionsTab';
import CRGovernanceTab from '@/components/controlroom/CRGovernanceTab';
import CRToolRegistryTab from '@/components/controlroom/CRToolRegistryTab';
import CRAuditLogTab from '@/components/controlroom/CRAuditLogTab';

// Gateway Health stub component (placeholder for future OpenClawGatewayHealthPanel)
function GatewayHealthStub() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-card border border-border rounded p-4">
        <h2 className="text-[12px] font-semibold text-slate-100 uppercase tracking-widest mb-3">OpenClaw Gateway Health</h2>
        <p className="text-[10px] text-slate-300">Monitor gateway connectivity, latency, and system diagnostics.</p>
      </div>
      <div className="bg-secondary/30 border border-border rounded p-4 text-[10px] text-slate-300">
        Gateway health monitoring coming soon. This tab will display real-time health status, node status, error rates, and diagnostic information.
      </div>
    </div>
  );
}

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
        {activeTab === 'gateway'    && <GatewayHealthStub />}
        {activeTab === 'audit'      && <CRAuditLogTab />}
      </div>
    </div>
  );
}