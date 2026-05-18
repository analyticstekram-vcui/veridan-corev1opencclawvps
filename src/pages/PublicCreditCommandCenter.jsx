/**
 * PublicCreditCommandCenter — Planning-Only Module
 * Tracks credit profile status, dispute planning, bureau monitoring, tradelines, and credit goals.
 * No bureau API calls · No credential storage · No client data submission · No execution.
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import PublicCreditModuleStatusSummary from '../components/public-credit/PublicCreditModuleStatusSummary';
import CreditProfilePlanning from '../components/public-credit/CreditProfilePlanning';
import CreditDisputePlanner from '../components/public-credit/CreditDisputePlanner';
import BureauMonitoringChecklist from '../components/public-credit/BureauMonitoringChecklist';
import CreditTradelineTracker from '../components/public-credit/CreditTradelineTracker';
import CreditGoalPlanner from '../components/public-credit/CreditGoalPlanner';

const TABS = [
  { id: 'profile',  label: 'Credit Profile' },
  { id: 'dispute',  label: 'Dispute Planner' },
  { id: 'bureau',   label: 'Bureau Monitoring' },
  { id: 'tradeline',label: 'Tradeline Tracker' },
  { id: 'goals',    label: 'Credit Goals' },
];

export default function PublicCreditCommandCenter() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Public Credit Command Center
            </div>
            <h1 className="text-lg font-bold text-foreground">Public Credit Command Center</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Planning-only module · Credit profile · Dispute planning · Bureau monitoring · Tradelines · Goals
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
              PLANNING ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
              BUREAU API DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* Module Status Summary Card */}
      <div className="border-b border-border bg-card px-6 py-4">
        <PublicCreditModuleStatusSummary />
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0 overflow-x-auto">
          {[
            { id: 'profile',  label: 'Credit Profile' },
            { id: 'dispute',  label: 'Dispute Planner' },
            { id: 'bureau',   label: 'Bureau Monitoring' },
            { id: 'tradeline',label: 'Tradeline Tracker' },
            { id: 'goals',    label: 'Credit Goals' },
          ].map(tab => (
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
        {activeTab === 'profile'   && <CreditProfilePlanning />}
        {activeTab === 'dispute'   && <CreditDisputePlanner />}
        {activeTab === 'bureau'    && <BureauMonitoringChecklist />}
        {activeTab === 'tradeline' && <CreditTradelineTracker />}
        {activeTab === 'goals'     && <CreditGoalPlanner />}
      </div>
    </div>
  );
}