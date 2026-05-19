/**
 * PublicCreditModuleStatusSummary — Planning-only module status overview.
 * Reads all 5 public credit localStorage keys. Exports status snapshot.
 * No bureau calls. No submissions. No credentials. No sensitive data.
 */

import React, { useState, useEffect } from 'react';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { loadFromStorage } from '../../utils/localStorageManager';
import SummaryCardHeader from '../ui/SummaryCardHeader';
import SummaryCountsGrid from '../ui/SummaryCountsGrid';
import SummarySafetyStatusGrid from '../ui/SummarySafetyStatusGrid';
import SummaryWhatThisMeans from '../ui/SummaryWhatThisMeans';
import SummarySafetyClaimsFooter from '../ui/SummarySafetyClaimsFooter';

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
      <SummaryCardHeader
        title="Public Credit Module Current Status"
        subtitle="Planning-only status · No bureau connectivity · No client data transmission"
        onExport={handleExport}
      />

      <SummaryCountsGrid
        title="Planning Records Summary"
        items={[
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
        ]}
      />

      <SummarySafetyStatusGrid title="Safety Status" items={SAFETY_ROWS} />

      <SummaryWhatThisMeans text={WHAT_THIS_MEANS} />
      <SummarySafetyClaimsFooter claims={SAFETY_CLAIMS} />
    </div>
  );
}