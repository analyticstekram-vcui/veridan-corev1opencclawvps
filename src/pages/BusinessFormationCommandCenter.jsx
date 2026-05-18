/**
 * BusinessFormationCommandCenter — Planning-Only Module
 * Tracks entity setup, trust/LLC structure, registered agent workflow, EIN/bank/credit readiness, and affiliate revenue.
 * No legal filing · No payment processing · No registered agent API calls · No EIN submission · No credential storage.
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import BusinessFormationModuleStatusSummary from '../components/business-formation/BusinessFormationModuleStatusSummary';
import BusinessEntityRegistry from '../components/business-formation/BusinessEntityRegistry';
import TrustLlcStructurePlanner from '../components/business-formation/TrustLlcStructurePlanner';
import RegisteredAgentWorkflow from '../components/business-formation/RegisteredAgentWorkflow';
import EinBankCreditReadiness from '../components/business-formation/EinBankCreditReadiness';
import AffiliateRevenuePlanner from '../components/business-formation/AffiliateRevenuePlanner';

const TABS = [
  { id: 'entity',     label: 'Entity Registry' },
  { id: 'trust',      label: 'Trust / LLC Structure' },
  { id: 'agent',      label: 'Registered Agent Workflow' },
  { id: 'ein',        label: 'EIN / Bank / Credit Readiness' },
  { id: 'affiliate',  label: 'Affiliate Revenue Planner' },
];



export default function BusinessFormationCommandCenter() {
  const [activeTab, setActiveTab] = useState('entity');

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Business Formation Command Center
            </div>
            <h1 className="text-lg font-bold text-foreground">Business Formation Command Center</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Planning-only module · Entity setup · Trust/LLC structure · Registered agent · EIN/bank/credit · Affiliate revenue
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
              PLANNING ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
              LEGAL FILING DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* Business Formation Module Status Summary */}
      <div className="border-b border-border bg-card px-6 py-4">
        <BusinessFormationModuleStatusSummary />
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
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
        {activeTab === 'entity'    && <BusinessEntityRegistry />}
        {activeTab === 'trust'     && <TrustLlcStructurePlanner />}
        {activeTab === 'agent'     && <RegisteredAgentWorkflow />}
        {activeTab === 'ein'       && <EinBankCreditReadiness />}
        {activeTab === 'affiliate' && <AffiliateRevenuePlanner />}
      </div>
    </div>
  );
}