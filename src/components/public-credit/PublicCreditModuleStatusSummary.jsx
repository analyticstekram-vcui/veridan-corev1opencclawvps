/**
 * PublicCreditModuleStatusSummary — Planning-only module status overview.
 * Reads all 5 public credit localStorage keys. Exports status snapshot.
 * No bureau calls. No submissions. No credentials. No sensitive data.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { loadFromStorage } from '../../utils/localStorageManager';

const PROFILE_KEY       = 'veridanPublicCreditProfilePlans';
const DISPUTE_KEY       = 'veridanPublicCreditDisputePlans';
const BUREAU_KEY        = 'veridanPublicCreditBureauMonitoringTasks';
const TRADELINE_KEY     = 'veridanPublicCreditTradelinePlans';
const GOALS_KEY         = 'veridanPublicCreditGoals';
const SNAPSHOT_KEY      = 'veridanPublicCreditModuleStatusSnapshot';

const SAFETY_CLAIMS = [
  'Public credit module status only',
  'Planning-only',
  'No credit bureau calls',
  'No credit bureau submissions',
  'No bureau login automation',
  'No credential storage in frontend',
  'No sensitive identity data collection',
  'No client document upload',
  'No backend mutation',
  'Browser-only export',
];

const WHAT_THIS_MEANS =
  'The Public Credit Command Center can track credit profile plans, dispute ideas, manual monitoring tasks, tradeline plans, and credit goals. It cannot contact credit bureaus, submit disputes, automate bureau logins, store credentials, collect sensitive identity data, upload client documents, or mutate backend systems.';

const SAFETY_ROWS = [
  { label: 'Public Credit Module Mode',              value: 'PLANNING_ONLY',       color: 'text-amber-400' },
  { label: 'Bureau API Calls',                       value: 'DISABLED',            color: 'text-destructive' },
  { label: 'Credit Bureau Submissions',              value: 'DISABLED',            color: 'text-destructive' },
  { label: 'Bureau Login Automation',                value: 'DISABLED',            color: 'text-destructive' },
  { label: 'Credential Storage in Frontend',         value: 'DISABLED',            color: 'text-destructive' },
  { label: 'Sensitive Identity Data Collection',     value: 'DISABLED',            color: 'text-destructive' },
  { label: 'Client Document Upload',                 value: 'DISABLED',            color: 'text-destructive' },
  { label: 'Backend Mutation',                       value: 'DISABLED',            color: 'text-destructive' },
];

export default function PublicCreditModuleStatusSummary() {
  const [counts, setCounts] = useState({
    totalProfilePlans: 0,
    activeProfilePlans: 0,
    totalDisputePlans: 0,
    readyOfflineReviewDisputePlans: 0,
    totalBureauMonitoringTasks: 0,
    activeBureauMonitoringTasks: 0,
    totalTradelinePlans: 0,
    activeTradelinePlans: 0,
    totalCreditGoals: 0,
    activeCreditGoals: 0,
    completedCreditGoals: 0,
  });

  useEffect(() => {
    const profiles = loadFromStorage(PROFILE_KEY);
    const disputes = loadFromStorage(DISPUTE_KEY);
    const bureauTasks = loadFromStorage(BUREAU_KEY);
    const tradelines = loadFromStorage(TRADELINE_KEY);
    const goals = loadFromStorage(GOALS_KEY);

    setCounts({
      totalProfilePlans: profiles.length,
      activeProfilePlans: profiles.filter(p => p.planningStatus === 'ACTIVE_FOR_PLANNING').length,
      totalDisputePlans: disputes.length,
      readyOfflineReviewDisputePlans: disputes.filter(d => d.disputeStatus === 'READY_FOR_OFFLINE_REVIEW').length,
      totalBureauMonitoringTasks: bureauTasks.length,
      activeBureauMonitoringTasks: bureauTasks.filter(b => b.monitoringStatus === 'Monitoring Active Manually').length,
      totalTradelinePlans: tradelines.length,
      activeTradelinePlans: tradelines.filter(t => t.tradelineStatus === 'ACTIVE_FOR_PLANNING').length,
      totalCreditGoals: goals.length,
      activeCreditGoals: goals.filter(g => g.goalStatus === 'ACTIVE_FOR_PLANNING').length,
      completedCreditGoals: goals.filter(g => g.goalStatus === 'COMPLETED').length,
    });
  }, []);

  const handleExport = () => {
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_PUBLIC_CREDIT_MODULE_STATUS',
      data: {
        counts,
        safetyStatus: {
          moduleName: 'Public Credit Command Center',
          mode: 'PLANNING_ONLY',
          bureauAPICallsEnabled: false,
          creditBureauSubmissionsEnabled: false,
          bureauLoginAutomationEnabled: false,
          credentialStorageEnabled: false,
          sensitiveIdentityDataCollectionEnabled: false,
          clientDocumentUploadEnabled: false,
          backendMutationEnabled: false,
        },
      },
      filename: 'veridan-public-credit-module-status',
      safetyClaims: SAFETY_CLAIMS,
      storageKey: SNAPSHOT_KEY,
    });
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Public Credit Module Current Status</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only status · No bureau connectivity · No client data transmission</div>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
          <Download className="w-3 h-3" /> Export Module Status
        </button>
      </div>

      {/* Counts Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Planning Records Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Total Profile Plans',           value: counts.totalProfilePlans,              color: 'text-slate-200' },
            { label: 'Active Profile Plans',          value: counts.activeProfilePlans,             color: 'text-primary' },
            { label: 'Total Dispute Plans',           value: counts.totalDisputePlans,              color: 'text-slate-200' },
            { label: 'Ready Offline Review',          value: counts.readyOfflineReviewDisputePlans, color: 'text-primary' },
            { label: 'Total Bureau Monitoring',       value: counts.totalBureauMonitoringTasks,     color: 'text-slate-200' },
            { label: 'Active Bureau Monitoring',      value: counts.activeBureauMonitoringTasks,    color: 'text-primary' },
            { label: 'Total Tradeline Plans',         value: counts.totalTradelinePlans,            color: 'text-slate-200' },
            { label: 'Active Tradeline Plans',        value: counts.activeTradelinePlans,           color: 'text-primary' },
            { label: 'Total Credit Goals',            value: counts.totalCreditGoals,               color: 'text-slate-200' },
            { label: 'Active Credit Goals',           value: counts.activeCreditGoals,              color: 'text-primary' },
            { label: 'Completed Credit Goals',        value: counts.completedCreditGoals,           color: 'text-emerald-400' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Status Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Safety Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SAFETY_ROWS.map(item => (
            <div key={item.label}
              className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] text-slate-400">{item.label}:</span>
              <span className={`text-[8px] font-bold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What This Means */}
      <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-sm">
        <div className="text-[9px] font-bold uppercase text-primary mb-2">What This Means</div>
        <p className="text-[8px] text-slate-300 leading-relaxed">{WHAT_THIS_MEANS}</p>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>

    </div>
  );
}