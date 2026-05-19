/**
 * TradingModuleStatusSummary — Trading module status overview.
 * Reads from all 4 trading localStorage keys. Exports status snapshot.
 * No API calls · No broker calls · No execution.
 */

import React, { useState, useEffect } from 'react';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { loadFromStorage } from '../../utils/localStorageManager';
import SummaryCardHeader from '../ui/SummaryCardHeader';
import SummaryCountsGrid from '../ui/SummaryCountsGrid';
import SummarySafetyStatusGrid from '../ui/SummarySafetyStatusGrid';
import SummaryWhatThisMeans from '../ui/SummaryWhatThisMeans';
import SummarySafetyClaimsFooter from '../ui/SummarySafetyClaimsFooter';

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
    const strategies = loadFromStorage(STRATEGY_KEY);
    const riskRules = loadFromStorage(RISK_KEY);
    const readiness = loadFromStorage(READINESS_KEY);
    const broker = loadFromStorage(BROKER_KEY);

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
    const strategies = loadFromStorage(STRATEGY_KEY);
    const riskRules = loadFromStorage(RISK_KEY);
    const readiness = loadFromStorage(READINESS_KEY);
    const broker = loadFromStorage(BROKER_KEY);

    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_TRADING_MODULE_STATUS',
      data: {
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
      },
      filename: 'veridan-trading-module-status',
      safetyClaims: SAFETY_CLAIMS,
      storageKey: SNAPSHOT_KEY,
    });
  };

  return (
    <div className="space-y-4 font-mono">
      <SummaryCardHeader
        title="Trading Module Current Status"
        subtitle="Planning-only status snapshot · All 4 trading modules"
        onExport={handleExport}
      />

      <SummaryCountsGrid
        title="Module Counts"
        items={[
          { label: 'Total Strategies', value: counts.totalStrategies, color: 'text-slate-200' },
          { label: 'Paper-Ready Strategies', value: counts.paperReadyStrategies, color: 'text-primary' },
          { label: 'Total Risk Rules', value: counts.totalRiskRules, color: 'text-slate-200' },
          { label: 'Paper-Ready Risk Rules', value: counts.paperReadyRiskRules, color: 'text-primary' },
          { label: 'Total Readiness Records', value: counts.totalReadinessRecords, color: 'text-slate-200' },
          { label: 'Paper-Ready Readiness', value: counts.paperReadyReadinessRecords, color: 'text-primary' },
          { label: 'Total Broker Requirements', value: counts.totalBrokerRequirements, color: 'text-slate-200' },
          { label: 'Sandbox-Ready Brokers', value: counts.sandboxReadyBrokerRequirements, color: 'text-primary' },
        ]}
      />

      <SummarySafetyStatusGrid
        title="Safety Status"
        items={[
          { label: 'Trading Module Mode', value: 'PLANNING_ONLY', color: 'text-amber-400' },
          { label: 'Live Trading', value: 'DISABLED', color: 'text-destructive' },
          { label: 'Broker API Calls', value: 'DISABLED', color: 'text-destructive' },
          { label: 'Order Placement', value: 'DISABLED', color: 'text-destructive' },
          { label: 'Credential Storage in Frontend', value: 'DISABLED', color: 'text-destructive' },
          { label: 'Backend Mutation', value: 'DISABLED', color: 'text-destructive' },
        ]}
      />

      <SummaryWhatThisMeans text={WHAT_THIS_MEANS} />
      <SummarySafetyClaimsFooter claims={SAFETY_CLAIMS} />
    </div>
  );
}