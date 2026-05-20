/**
 * TradingViewMcpMonitor
 * Veridan Core — TradingView MCP Monitoring Console page
 * PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import TvMcpMonitoringConsole from '../components/tradingview-mcp-monitor/TvMcpMonitoringConsole';
import { Shield } from 'lucide-react';

export default function TradingViewMcpMonitor() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-mono">
      <ModuleNav />

      {/* Safety boundary banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-2.5 flex items-start gap-3">
        <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-400 leading-relaxed">
          <span className="font-bold">TradingView MCP Monitoring is governed READ_ONLY.</span>{' '}
          It can check relay health, MCP server status, quote data, chart state, and indicator values.
          It <span className="font-bold text-destructive">cannot</span> place trades, connect to brokers, enter credentials, move funds, or execute any live orders.
        </p>
      </div>

      {/* Page header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              Veridan Core · Trading Module
            </div>
            <h1 className="text-sm font-bold text-foreground">TradingView MCP Monitoring Console</h1>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Manual Read-Only Monitoring · Local Relay: veridan-tv-mcp · No execution · No broker
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">READ_ONLY</span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-bold rounded-sm">EXECUTION: DISABLED</span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-bold rounded-sm">LIVE_TRADING: DISABLED</span>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-5 max-w-5xl w-full mx-auto">
        <TvMcpMonitoringConsole />
      </main>
    </div>
  );
}