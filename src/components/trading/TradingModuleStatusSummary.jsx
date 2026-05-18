/**
 * TradingModuleStatusSummary — Trading module status overview.
 * Reads from all 4 trading localStorage keys. Exports status snapshot.
 * No API calls · No broker calls · No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STRATEGY_KEY   = 'veridanTradingStrategyRegistry';
const RISK_KEY       = 'veridanTradingRiskRules';
const READINESS_KEY  = 'veridanTradingPaperReadinessRecords';
const BROKER_KEY     = 'veridanTradingBrokerSandboxRequirements';
const SNAPSHOT_KEY   = 'veridanTradingModuleStatusSnapshot';

const SAFETY_CLAIMS = [
  'Trading module status only',
  'Planning-only',
  'No live trading',
  'No broker API calls',
  'No order placement',
  'No credential storage in frontend',
  'No execution',
  'Browser-only export',
];

const WHAT_THIS_MEANS =
  'The Trading Command Center can track strategies, risk rules, paper readiness, and broker sandbox requirements. It cannot place trades, call broker APIs, store credentials, or execute orders.';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export default function TradingModuleStatusSummary() {
  const [counts, setCounts] = useState({
    totalStrategies: 0,
    paperReadyStrategies: 0,
    totalRiskRules: 0,
    paperReadyRiskRules: 0,
    totalReadinessRecords: 0,
    paperReadyReadinessRecords: 0,
    totalBrokerRequirements: 0,
    sandboxReadyBrokerRequirements: 0,
  });

  useEffect(() => {
    const strategies = load(STRATEGY_KEY);
    const riskRules = load(RISK_KEY);
    const readiness = load(READINESS_KEY);
    const broker = load(BROKER_KEY);

    setCounts({
      totalStrategies: strategies.length,
      paperReadyStrategies: strategies.filter(s => s.strategyStatus === 'PAPER_READY').length,
      totalRiskRules: riskRules.length,
      paperReadyRiskRules: riskRules.filter(r => r.ruleStatus === 'PAPER_READY').length,
      totalReadinessRecords: readiness.length,
      paperReadyReadinessRecords: readiness.filter(r => r.readinessStatus === 'PAPER_READY').length,
      totalBrokerRequirements: broker.length,
      sandboxReadyBrokerRequirements: broker.filter(b => b.accountStatus === 'SANDBOX_READY').length,
    });
  }, []);

  const handleExport = () => {
    const strategies = load(STRATEGY_KEY);
    const riskRules = load(RISK_KEY);
    const readiness = load(READINESS_KEY);
    const broker = load(BROKER_KEY);

    const exportData = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADING_MODULE_STATUS',
      counts: {
        totalStrategies: strategies.length,
        paperReadyStrategies: strategies.filter(s => s.strategyStatus === 'PAPER_READY').length,
        totalRiskRules: riskRules.length,
        paperReadyRiskRules: riskRules.filter(r => r.ruleStatus === 'PAPER_READY').length,
        totalReadinessRecords: readiness.length,
        paperReadyReadinessRecords: readiness.filter(r => r.readinessStatus === 'PAPER_READY').length,
        totalBrokerRequirements: broker.length,
        sandboxReadyBrokerRequirements: broker.filter(b => b.accountStatus === 'SANDBOX_READY').length,
      },
      safetyStatus: {
        tradingModuleMode: 'PLANNING_ONLY',
        liveTradingDisabled: true,
        brokerAPICallsDisabled: true,
        orderPlacementDisabled: true,
        credentialStorageDisabled: true,
        backendMutationDisabled: true,
      },
      safetyClaims: SAFETY_CLAIMS,
    };

    save(SNAPSHOT_KEY, exportData);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-trading-module-status-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Trading Module Current Status</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only status snapshot · All 4 trading modules</div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm"
        >
          <Download className="w-3 h-3" />
          Export Trading Module Status
        </button>
      </div>

      {/* Counts Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Module Counts</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Strategies', value: counts.totalStrategies, color: 'text-slate-200' },
            { label: 'Paper-Ready Strategies', value: counts.paperReadyStrategies, color: 'text-primary' },
            { label: 'Total Risk Rules', value: counts.totalRiskRules, color: 'text-slate-200' },
            { label: 'Paper-Ready Risk Rules', value: counts.paperReadyRiskRules, color: 'text-primary' },
            { label: 'Total Readiness Records', value: counts.totalReadinessRecords, color: 'text-slate-200' },
            { label: 'Paper-Ready Readiness', value: counts.paperReadyReadinessRecords, color: 'text-primary' },
            { label: 'Total Broker Requirements', value: counts.totalBrokerRequirements, color: 'text-slate-200' },
            { label: 'Sandbox-Ready Brokers', value: counts.sandboxReadyBrokerRequirements, color: 'text-primary' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-3 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[18px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Status Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Safety Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { label: 'Trading Module Mode', value: 'PLANNING_ONLY', color: 'text-amber-400' },
            { label: 'Live Trading', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Broker API Calls', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Order Placement', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Credential Storage in Frontend', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Backend Mutation', value: 'DISABLED', color: 'text-destructive' },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border border-border/30 rounded-sm"
            >
              <span className="text-[9px] text-slate-400">{item.label}:</span>
              <span className={`text-[8px] font-bold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What This Means */}
      <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-sm">
        <div className="text-[9px] font-bold uppercase text-primary mb-2">What This Means</div>
        <p className="text-[8px] text-slate-300 leading-relaxed">
          {WHAT_THIS_MEANS}
        </p>
      </div>

      {/* Safety Claims */}
      <div className="px-4 py-3 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-2">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(claim => (
            <span key={claim} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">
              {claim}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}