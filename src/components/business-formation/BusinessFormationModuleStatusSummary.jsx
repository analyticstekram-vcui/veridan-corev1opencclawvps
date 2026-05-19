/**
 * BusinessFormationModuleStatusSummary — Planning-only module status summary.
 * localStorage read-only. Shows counts and safety status. Browser-only export.
 */

import React, { useState, useEffect } from 'react';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { loadFromStorage } from '../../utils/localStorageManager';
import SummaryCardHeader from '../ui/SummaryCardHeader';
import SummaryCountsGrid from '../ui/SummaryCountsGrid';
import SummarySafetyStatusGrid from '../ui/SummarySafetyStatusGrid';
import SummaryWhatThisMeans from '../ui/SummaryWhatThisMeans';
import SummarySafetyClaimsFooter from '../ui/SummarySafetyClaimsFooter';

const STORAGE_KEY_SNAPSHOT = 'veridanBusinessFormationModuleStatusSnapshot';

const SAFETY_CLAIMS = [
  'Business formation module status only',
  'Planning-only',
  'No legal filing',
  'No registered agent API calls',
  'No EIN submission',
  'No bank account opening',
  'No payment processing',
  'No client data submission',
  'No credential storage in frontend',
  'No backend mutation',
  'Browser-only export',
];

const WHAT_THIS_MEANS =
  'The Business Formation Command Center can track entity plans, structure relationships, registered agent workflows, EIN/bank/credit readiness, and affiliate revenue plans. It cannot file legal documents, call registered agent APIs, submit EIN applications, open bank accounts, process payments, submit client data, store credentials, or mutate backend systems.';

function loadCounts() {
  const entityPlans = loadFromStorage('veridanBusinessEntityRegistry');
  const structurePlans = loadFromStorage('veridanBusinessStructurePlans');
  const workflows = loadFromStorage('veridanRegisteredAgentWorkflows');
  const readiness = loadFromStorage('veridanEinBankCreditReadiness');
  const revenuePlans = loadFromStorage('veridanAffiliateRevenuePlans');

  return {
    entityPlans,
    structurePlans,
    workflows,
    readiness,
    revenuePlans,
  };
}

export default function BusinessFormationModuleStatusSummary() {
  const [counts, setCounts] = useState({
    totalEntityPlans: 0,
    planningEntityPlans: 0,
    readyForOfflineEntityPlans: 0,
    totalStructurePlans: 0,
    offlineReviewStructurePlans: 0,
    totalWorkflows: 0,
    selectedForOfflineReviewWorkflows: 0,
    totalReadiness: 0,
    readyForOfflineActionReadiness: 0,
    totalRevenuePlans: 0,
    activeForPlanningRevenuePlans: 0,
  });

  useEffect(() => {
    const data = loadCounts();

    const totalEntityPlans = data.entityPlans.length;
    const planningEntityPlans = data.entityPlans.filter(e => e.planStatus === 'IDEA').length;
    const readyForOfflineEntityPlans = data.entityPlans.filter(e => e.planStatus === 'READY_TO_FILE').length;

    const totalStructurePlans = data.structurePlans.length;
    const offlineReviewStructurePlans = data.structurePlans.filter(s => s.documentationStatus === 'Offline Review Needed').length;

    const totalWorkflows = data.workflows.length;
    const selectedForOfflineReviewWorkflows = data.workflows.filter(w => w.providerStatus === 'SELECTED_FOR_OFFLINE_REVIEW').length;

    const totalReadiness = data.readiness.length;
    const readyForOfflineActionReadiness = data.readiness.filter(r => r.readinessStatus === 'READY_FOR_OFFLINE_ACTION').length;

    const totalRevenuePlans = data.revenuePlans.length;
    const activeForPlanningRevenuePlans = data.revenuePlans.filter(rp => rp.planStatus === 'ACTIVE_FOR_PLANNING').length;

    setCounts({
      totalEntityPlans,
      planningEntityPlans,
      readyForOfflineEntityPlans,
      totalStructurePlans,
      offlineReviewStructurePlans,
      totalWorkflows,
      selectedForOfflineReviewWorkflows,
      totalReadiness,
      readyForOfflineActionReadiness,
      totalRevenuePlans,
      activeForPlanningRevenuePlans,
    });
  }, []);

  const handleExport = () => {
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_BUSINESS_FORMATION_MODULE_STATUS',
      data: {
        counts: {
          totalEntityPlans: counts.totalEntityPlans,
          planningEntityPlans: counts.planningEntityPlans,
          readyForOfflineEntityPlans: counts.readyForOfflineEntityPlans,
          totalStructurePlans: counts.totalStructurePlans,
          offlineReviewStructurePlans: counts.offlineReviewStructurePlans,
          totalWorkflows: counts.totalWorkflows,
          selectedForOfflineReviewWorkflows: counts.selectedForOfflineReviewWorkflows,
          totalReadiness: counts.totalReadiness,
          readyForOfflineActionReadiness: counts.readyForOfflineActionReadiness,
          totalRevenuePlans: counts.totalRevenuePlans,
          activeForPlanningRevenuePlans: counts.activeForPlanningRevenuePlans,
        },
        safetyStatus: {
          moduleName: 'Business Formation Command Center',
          moduleMode: 'PLANNING_ONLY',
          legalFiling: 'DISABLED',
          registeredAgentApiCalls: 'DISABLED',
          einSubmission: 'DISABLED',
          bankAccountOpening: 'DISABLED',
          paymentProcessing: 'DISABLED',
          clientDataSubmission: 'DISABLED',
          credentialStorageInFrontend: 'DISABLED',
          backendMutation: 'DISABLED',
        },
      },
      filename: 'veridan-business-formation-module-status',
      safetyClaims: SAFETY_CLAIMS,
      storageKey: STORAGE_KEY_SNAPSHOT,
    });
  };

  return (
    <div className="space-y-4 font-mono">
      <SummaryCardHeader
        title="Business Formation Module Current Status"
        subtitle="Planning-only status · No legal filing · No API calls · No credential storage"
        onExport={handleExport}
      />

      <SummaryCountsGrid
        title="Planning Counts"
        items={[
          { label: 'Total Entities',              value: counts.totalEntityPlans,                color: 'text-slate-200' },
          { label: 'Planning Entities',           value: counts.planningEntityPlans,            color: 'text-slate-400' },
          { label: 'Ready for Offline Entities',  value: counts.readyForOfflineEntityPlans,    color: 'text-primary' },
          { label: 'Total Structures',            value: counts.totalStructurePlans,           color: 'text-slate-200' },
          { label: 'Offline Review Structures',   value: counts.offlineReviewStructurePlans,   color: 'text-orange-400' },
          { label: 'Total RA Workflows',          value: counts.totalWorkflows,                color: 'text-slate-200' },
          { label: 'Offline Review Workflows',    value: counts.selectedForOfflineReviewWorkflows, color: 'text-orange-400' },
          { label: 'Total EIN/Bank/Credit',       value: counts.totalReadiness,                color: 'text-slate-200' },
          { label: 'Ready for Offline Readiness', value: counts.readyForOfflineActionReadiness, color: 'text-primary' },
          { label: 'Total Affiliate Plans',       value: counts.totalRevenuePlans,             color: 'text-slate-200' },
          { label: 'Active Affiliate Plans',      value: counts.activeForPlanningRevenuePlans, color: 'text-primary' },
        ]}
      />

      <SummarySafetyStatusGrid
        title="Safety Status"
        items={[
          { label: 'Module Mode',                      value: 'PLANNING_ONLY',  color: 'text-amber-400' },
          { label: 'Legal Filing',                     value: 'DISABLED',       color: 'text-destructive' },
          { label: 'Registered Agent API Calls',       value: 'DISABLED',       color: 'text-destructive' },
          { label: 'EIN Submission',                   value: 'DISABLED',       color: 'text-destructive' },
          { label: 'Bank Account Opening',             value: 'DISABLED',       color: 'text-destructive' },
          { label: 'Payment Processing',               value: 'DISABLED',       color: 'text-destructive' },
          { label: 'Client Data Submission',           value: 'DISABLED',       color: 'text-destructive' },
          { label: 'Credential Storage in Frontend',   value: 'DISABLED',       color: 'text-destructive' },
          { label: 'Backend Mutation',                 value: 'DISABLED',       color: 'text-destructive' },
        ]}
      />

      <SummaryWhatThisMeans text={WHAT_THIS_MEANS} />
      <SummarySafetyClaimsFooter claims={SAFETY_CLAIMS} />
    </div>
  );
}