/**
 * CoreReportsDashboard.jsx
 * Phase 5 — Live Read-Only Bridge Integration
 *
 * Read-only dashboard panel presenting Vault Agent report data.
 * Data source: localhost GET-only bridge when verified, mock fallback otherwise.
 *
 * SAFETY: READ_ONLY · REPORTING_ONLY · NO_EXECUTION · NO_DISPATCH
 */

import React, { useEffect, useState } from 'react';
import { FileText, Activity } from 'lucide-react';
import Phase3SafetyStrip from './Phase3SafetyStrip';
import BridgeStatusBadges from './BridgeStatusBadges';
import GovernanceScorePanel from './GovernanceScorePanel';
import PendingApprovalsPanel from './PendingApprovalsPanel';
import ReviewsDuePanel from './ReviewsDuePanel';
import OpenClawBoundaryPanel from './OpenClawBoundaryPanel';
import RecommendedActionsPanel from './RecommendedActionsPanel';
import Phase4MonitoringLayer from './monitoring/Phase4MonitoringLayer';
import { getVaultAgentMockFallbackData, loadVaultAgentReportData } from '@/lib/vaultAgentLiveAdapter';

function VaultKpiStrip({ dailyBrief }) {
  const kpis = [
    { label: 'Total Notes',        value: dailyBrief.totalNotes,           color: 'text-slate-200' },
    { label: 'Wiki-Links',         value: dailyBrief.totalWikiLinks,       color: 'text-slate-200' },
    { label: 'Metadata Domains',   value: dailyBrief.metadataDomains,      color: 'text-slate-200' },
    { label: 'Readiness Score',    value: `${dailyBrief.governanceReadinessScore}/100`, color: 'text-primary' },
    { label: 'Maturity Score',     value: `${dailyBrief.governanceMaturityScore}/100`,  color: 'text-primary' },
    { label: 'Activation Score',   value: `${dailyBrief.governanceActivationScore}/100`, color: dailyBrief.governanceActivationScore >= 90 ? 'text-primary' : 'text-amber-400' },
    { label: 'Pending Approvals',  value: dailyBrief.pendingApprovalsCount, color: dailyBrief.pendingApprovalsCount > 0 ? 'text-amber-400' : 'text-primary' },
    { label: 'Reviews Due (7d)',   value: dailyBrief.reviewsDueWithin7Days, color: dailyBrief.reviewsDueWithin7Days > 0 ? 'text-amber-400' : 'text-primary' },
    { label: 'Open Exceptions',    value: dailyBrief.openExceptions,       color: dailyBrief.openExceptions > 0 ? 'text-destructive' : 'text-primary' },
  ];

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Vault Overview</span>
        <span className="text-[7px] font-mono text-slate-500 ml-1">— Daily Vault Brief · {dailyBrief.reportDate}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 divide-x divide-border/20">
        {kpis.map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center px-3 py-3 text-center">
            <span className={`text-[13px] font-bold font-mono ${color}`}>{value}</span>
            <span className="text-[6px] font-mono text-slate-600 mt-0.5 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataSourceNote({ meta }) {
  const isLive = meta.mode === 'LIVE_READ_ONLY';

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-border/30 bg-card/40 rounded-sm text-[7px] font-mono text-slate-500">
      <FileText className="w-3 h-3 shrink-0 text-slate-600" />
      <span>
        Data source: <span className="text-slate-300 font-bold">{meta.mode}</span>
        {' · '}As of: <span className="text-slate-300">{meta.dataAsOf}</span>
        {' · '}Local vault: <span className="text-slate-500 italic">{meta.localVaultPath}</span>
        {' · '}
        <span className={isLive ? 'text-primary' : 'text-amber-400'}>
          {isLive
            ? 'Live bridge verified: localhost GET-only reporting data accepted.'
            : 'Mock fallback active: live bridge unavailable or rejected by safety verification.'}
        </span>
      </span>
    </div>
  );
}

export default function CoreReportsDashboard() {
  const [data, setData] = useState(() => getVaultAgentMockFallbackData());

  useEffect(() => {
    let mounted = true;

    loadVaultAgentReportData().then(nextData => {
      if (mounted) setData(nextData);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const { dailyBrief, pendingApprovals, reviewsDue, openclawBoundary,
          weeklyGovernanceBrief, recommendedActions, monitoring, adapterMeta, bridgeStatus } = data;

  return (
    <div className="space-y-4">
      <Phase3SafetyStrip adapterMode={adapterMeta.mode} />
      <BridgeStatusBadges bridgeStatus={bridgeStatus} />
      <DataSourceNote meta={adapterMeta} />
      <VaultKpiStrip dailyBrief={dailyBrief} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GovernanceScorePanel weeklyBrief={weeklyGovernanceBrief} />
        <OpenClawBoundaryPanel openclawBoundary={openclawBoundary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendingApprovalsPanel pendingApprovals={pendingApprovals} />
        <ReviewsDuePanel reviewsDue={reviewsDue} />
      </div>

      <RecommendedActionsPanel actions={recommendedActions} />

      <Phase4MonitoringLayer monitoring={monitoring} />
    </div>
  );
}
