/**
 * TradingCommandCenter — Planning-Only Module
 * Tracks strategies, paper trading readiness, risk rules, and broker sandbox requirements.
 * No live trading · No broker API calls · No backend routes · No execution.
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import TradingStrategyRegistry from '../components/trading/TradingStrategyRegistry';
import TradingPaperReadinessChecklist from '../components/trading/TradingPaperReadinessChecklist';
import TradingRiskRuleBuilder from '../components/trading/TradingRiskRuleBuilder';
import TradingBrokerSandboxRequirements from '../components/trading/TradingBrokerSandboxRequirements';
import TradingModuleStatusSummary from '../components/trading/TradingModuleStatusSummary';
import TradingViewMcpReadinessPanel from '../components/trading/TradingViewMcpReadinessPanel';

const TABS = [
  { id: 'strategies', label: 'Strategy Registry' },
  { id: 'readiness',  label: 'Paper Trading Readiness' },
  { id: 'risk',       label: 'Risk Rules' },
  { id: 'broker',     label: 'Broker Sandbox Requirements' },
  { id: 'mcp',        label: 'TradingView MCP Readiness' },
];

export default function TradingCommandCenter() {
  const [activeTab, setActiveTab] = useState('strategies');

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Trading Command Center
            </div>
            <h1 className="text-lg font-bold text-foreground">Trading Command Center</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Planning-only module · Strategy design · Paper trading readiness · Risk rules · Broker sandbox requirements
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
              PLANNING ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
              LIVE TRADING DISABLED
            </span>
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: 'Live Trading', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Broker API', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Order Execution', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Money Movement', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Paper Trading Mode', value: 'PLANNING_ONLY', color: 'text-amber-400' },
            { label: 'Strategy Design', value: 'ENABLED', color: 'text-primary' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[7px] text-slate-500">{item.label}:</span>
              <span className={`text-[7px] font-bold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Status Summary */}
      <div className="border-b border-border bg-card px-6 py-4">
        <TradingModuleStatusSummary />
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'strategies' && <TradingStrategyRegistry />}
        {activeTab === 'readiness' && <TradingPaperReadinessChecklist />}
        {activeTab === 'risk' && <TradingRiskRuleBuilder />}
        {activeTab === 'broker' && <TradingBrokerSandboxRequirements />}
        {activeTab === 'mcp'    && <TradingViewMcpReadinessPanel />}
      </div>
    </div>
  );
}