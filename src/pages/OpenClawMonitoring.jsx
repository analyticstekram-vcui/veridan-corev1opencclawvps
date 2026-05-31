/**
 * OpenClawMonitoring — Manual Read-Only Monitoring Console page.
 * Routes to the live gateway check console, NOT the governance planning page.
 * READ_ONLY · GET_ONLY · NO_EXECUTION · NO_DISPATCH
 */
import React from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import ManualReadOnlyMonitoringConsole from '../components/openclaw/ManualReadOnlyMonitoringConsole';
import OpenClawGatewayStatusPanel from '../components/openclaw/OpenClawGatewayStatusPanel';
import OpenClawGatewayConnectorContract from '../components/openclaw/OpenClawGatewayConnectorContract';
import OpenClawReadOnlyEvidenceSnapshot from '../components/openclaw/OpenClawReadOnlyEvidenceSnapshot';
import { Shield } from 'lucide-react';

export default function OpenClawMonitoring() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-mono">
      <ModuleNav />

      {/* Page header */}
      <div className="px-6 pt-5 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3 flex-wrap">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">OpenClaw Gateway</div>
            <h1 className="text-sm font-bold text-foreground">Manual Read-Only Monitoring Console</h1>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Operator-triggered GET-only health checks · READ_ONLY · EXECUTION_DISABLED · No credentials exposed
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">READ_ONLY</span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-bold rounded-sm">EXECUTION: DISABLED</span>
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[7px] font-bold rounded-sm">GET ONLY</span>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-5 max-w-5xl w-full mx-auto space-y-6">
        <OpenClawGatewayStatusPanel />
        <OpenClawGatewayConnectorContract />
        <OpenClawReadOnlyEvidenceSnapshot />
        <ManualReadOnlyMonitoringConsole />
      </main>
    </div>
  );
}