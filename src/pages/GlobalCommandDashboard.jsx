/**
 * GlobalCommandDashboard — Global Veridan Core planning status.
 * Reads 5 localStorage keys, displays planning-only status across all modules.
 * No execution, Codex, OpenClaw, MCP, broker, bank, credit bureau, API, credential, or backend logic.
 */

import React, { useState, useEffect } from 'react';
import { exportSnapshotAndSave } from '../utils/exportSnapshot';
import ModuleNav from '../components/navigation/ModuleNav';
import SummaryCardHeader from '../components/ui/SummaryCardHeader';
import SummarySafetyStatusGrid from '../components/ui/SummarySafetyStatusGrid';
import SummaryWhatThisMeans from '../components/ui/SummaryWhatThisMeans';
import SummarySafetyClaimsFooter from '../components/ui/SummarySafetyClaimsFooter';

const STORAGE_KEYS = {
  TRADING: 'veridanTradingModuleStatusSnapshot',
  PUBLIC_CREDIT: 'veridanPublicCreditModuleStatusSnapshot',
  BUSINESS_FORMATION: 'veridanBusinessFormationModuleStatusSnapshot',
  AI_COMMAND_CENTER: 'veridanAiCommandCenterModuleStatusSnapshot',
  OPENCLAW_CHECKPOINT: 'openclawGovernanceDryRunChainCheckpointLockPhases43To49',
};

const STATUS_SNAPSHOT_KEY = 'veridanGlobalCommandDashboardStatusSnapshot';

const WHAT_THIS_MEANS = 'Veridan Core can summarize planning status across Trading, Public Credit, Business Formation, AI Command Center, and OpenClaw Governance. It cannot execute trades, call brokers, contact credit bureaus, file legal documents, open bank accounts, process payments, run Codex, dispatch OpenClaw, call MCP tools, automate browsers, handle credentials, or mutate backend systems.';

const SAFETY_CLAIMS = [
  'Global dashboard status only',
  'Planning-only',
  'No trading execution',
  'No broker API calls',
  'No credit bureau calls',
  'No legal filing',
  'No bank account opening',
  'No payment processing',
  'No Codex execution',
  'No OpenClaw dispatch',
  'No MCP calls',
  'No browser automation',
  'No credential handling',
  'No backend mutation',
  'Browser-only export',
];

export default function GlobalCommandDashboard() {
  const [snapshotPresence, setSnapshotPresence] = useState({
    trading: false,
    publicCredit: false,
    businessFormation: false,
    aiCommandCenter: false,
    openClawCheckpoint: false,
  });

  useEffect(() => {
    loadSnapshotPresence();
  }, []);

  const loadSnapshotPresence = () => {
    const presence = {
      trading: !!localStorage.getItem(STORAGE_KEYS.TRADING),
      publicCredit: !!localStorage.getItem(STORAGE_KEYS.PUBLIC_CREDIT),
      businessFormation: !!localStorage.getItem(STORAGE_KEYS.BUSINESS_FORMATION),
      aiCommandCenter: !!localStorage.getItem(STORAGE_KEYS.AI_COMMAND_CENTER),
      openClawCheckpoint: !!localStorage.getItem(STORAGE_KEYS.OPENCLAW_CHECKPOINT),
    };
    setSnapshotPresence(presence);
  };

  const handleExport = () => {
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_GLOBAL_COMMAND_DASHBOARD_STATUS',
      data: {
        snapshotPresence: {
          'Trading module snapshot present': snapshotPresence.trading,
          'Public Credit module snapshot present': snapshotPresence.publicCredit,
          'Business Formation module snapshot present': snapshotPresence.businessFormation,
          'AI Command Center snapshot present': snapshotPresence.aiCommandCenter,
          'OpenClaw governance checkpoint present': snapshotPresence.openClawCheckpoint,
        },
        globalMode: {
          'Global mode': 'PLANNING_ONLY',
          'Execution readiness': 'NOT_READY_FOR_EXECUTION',
          'OpenClaw governance': 'LOCKED_EXECUTION_DISABLED',
          'Trading automation': 'DISABLED',
          'Broker API calls': 'DISABLED',
          'Credit bureau calls': 'DISABLED',
          'Legal filing': 'DISABLED',
          'Bank account opening': 'DISABLED',
          'Payment processing': 'DISABLED',
          'Codex execution': 'DISABLED',
          'OpenClaw dispatch': 'DISABLED',
          'MCP calls': 'DISABLED',
          'Browser automation': 'DISABLED',
          'Credential handling': 'DISABLED',
          'Backend mutation': 'DISABLED',
        },
      },
      filename: 'veridan-global-command-dashboard',
      safetyClaims: SAFETY_CLAIMS,
      storageKey: STATUS_SNAPSHOT_KEY,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Global Command Dashboard
            </div>
            <h1 className="text-lg font-bold text-foreground">Global Command Dashboard</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Planning-only module overview · Trading · Public Credit · Business Formation · AI Command Center · OpenClaw Governance
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
              PLANNING ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
              EXECUTION DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-4">

        <SummaryCardHeader
          title="Veridan Core Global Status"
          subtitle="Planning-only · All modules · No execution · No external mutations"
          onExport={handleExport}
        />

        {/* Module Snapshot Presence */}
        <div className="bg-card border border-border/50 rounded-sm p-4">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Module Snapshot Presence</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { label: 'Trading module snapshot present', value: snapshotPresence.trading },
              { label: 'Public Credit module snapshot present', value: snapshotPresence.publicCredit },
              { label: 'Business Formation module snapshot present', value: snapshotPresence.businessFormation },
              { label: 'AI Command Center snapshot present', value: snapshotPresence.aiCommandCenter },
              { label: 'OpenClaw governance checkpoint present', value: snapshotPresence.openClawCheckpoint },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[8px] text-slate-400">{item.label}:</span>
                <span className={`text-[8px] font-bold font-mono ${item.value ? 'text-primary' : 'text-slate-500'}`}>
                  {item.value ? 'true' : 'false'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <SummarySafetyStatusGrid
          title="Global Mode"
          items={[
            { label: 'Global mode', value: 'PLANNING_ONLY', color: 'text-amber-400' },
            { label: 'Execution readiness', value: 'NOT_READY_FOR_EXECUTION', color: 'text-destructive' },
            { label: 'OpenClaw governance', value: 'LOCKED_EXECUTION_DISABLED', color: 'text-destructive' },
            { label: 'Trading automation', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Broker API calls', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Credit bureau calls', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Legal filing', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Bank account opening', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Payment processing', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Codex execution', value: 'DISABLED', color: 'text-destructive' },
            { label: 'OpenClaw dispatch', value: 'DISABLED', color: 'text-destructive' },
            { label: 'MCP calls', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Browser automation', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Credential handling', value: 'DISABLED', color: 'text-destructive' },
            { label: 'Backend mutation', value: 'DISABLED', color: 'text-destructive' },
          ]}
        />

        <SummaryWhatThisMeans text={WHAT_THIS_MEANS} />
        <SummarySafetyClaimsFooter claims={SAFETY_CLAIMS} />

      </div>
    </div>
  );
}