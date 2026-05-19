/**
 * BusinessFormationModuleStatusSummary — Planning-only module status summary.
 * localStorage read-only. Shows counts and safety status. Browser-only export.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { loadFromStorage } from '../../utils/localStorageManager';

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Business Formation Module Current Status</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only status · No legal filing · No API calls · No credential storage</div>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
          <Download className="w-3 h-3" /> Export Status
        </button>
      </div>

      {/* Counts Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Planning Counts</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
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
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Status */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Safety Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { label: 'Module Mode',                      value: 'PLANNING_ONLY',  color: 'text-amber-400' },
            { label: 'Legal Filing',                     value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Registered Agent API Calls',       value: 'DISABLED',       color: 'text-destructive' },
            { label: 'EIN Submission',                   value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Bank Account Opening',             value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Payment Processing',               value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Client Data Submission',           value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Credential Storage in Frontend',   value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Backend Mutation',                 value: 'DISABLED',       color: 'text-destructive' },
          ].map(item => (
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

      {/* Safety Claims */}
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