/**
 * VeridanVaultAgent v1
 * AI-assisted operator knowledge vault analysis and report page.
 *
 * SAFETY: Read-only analysis. Draft creation only — no vault writes.
 * All drafted records enter the existing VeridanObsidianDraft approval/write workflow.
 *
 * executionStatus: NOT_EXECUTED
 * dispatchStatus: NOT_DISPATCHED
 * openclawCall: NOT_SENT
 * brokerAccess: DISABLED
 * bankAccess: DISABLED
 * obsidianWrite: APPROVAL_REQUIRED
 */

import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, BotMessageSquare, Database } from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';
import { base44 } from '@/api/base44Client';
import { computeDomainCoverage, computeHealthScore, TOTAL_EXPECTED_DOCS } from '../components/vault-agent/vaultAgentDomains';
import VaultAgentStatusCard from '../components/vault-agent/VaultAgentStatusCard';
import VaultHealthSummary from '../components/vault-agent/VaultHealthSummary';
import DomainCoverageTable from '../components/vault-agent/DomainCoverageTable';
import MissingDocRecommendations from '../components/vault-agent/MissingDocRecommendations';
import DailyVaultBrief from '../components/vault-agent/DailyVaultBrief';
import VaultAgentVerification from '../components/vault-agent/VaultAgentVerification';
import CoreReportsDashboard from '../components/vault-agent/CoreReportsDashboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isArchived(r) {
  if (!r) return false;
  if (r.archived === true || r.archived === 'true') return true;
  if (r.isArchived === true || r.isArchived === 'true') return true;
  if (r.status === 'ARCHIVED') return true;
  if (r.archiveStatus === 'ARCHIVED') return true;
  return false;
}

function computeStats(drafts, audits) {
  const activeDrafts = drafts.filter(d => !isArchived(d));
  const activeAudits = audits.filter(a => !isArchived(a));

  const archivedDrafts = drafts.filter(isArchived).length;
  const totalDrafts = activeDrafts.length;
  const approvedDrafts = activeDrafts.filter(d =>
    d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT').length;
  const pendingDrafts = activeDrafts.filter(d =>
    d.approvalStatus === 'PENDING_REVIEW' || d.approvalState === 'PENDING_REVIEW' || !d.approvalStatus).length;
  const writtenDrafts = activeDrafts.filter(d =>
    d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').length;
  const failedWrites = activeAudits.filter(a =>
    a.filesystemWrite && a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY' && a.filesystemWrite !== 'DISABLED').length;

  // Duplicate candidates: active drafts sharing filePath
  const filePathCount = {};
  for (const d of activeDrafts) {
    if (d.filePath) filePathCount[d.filePath] = (filePathCount[d.filePath] || 0) + 1;
  }
  const duplicateCandidates = Object.values(filePathCount).filter(c => c > 1).length;

  // Orphan candidates: audits with no matching draft
  const draftIdSet = new Set(activeDrafts.map(d => d.draftId || d.id).filter(Boolean));
  const orphanCandidates = activeAudits.filter(a => a.draftId && !draftIdSet.has(a.draftId)).length;

  const lastWriteTimestamp = [...activeAudits]
    .map(a => a.timestamp || a.created_date || '')
    .filter(Boolean)
    .sort()
    .reverse()[0] || '—';

  const domainCoverage = computeDomainCoverage(activeDrafts, activeAudits);
  const totalMissingDocs = domainCoverage.reduce((a, d) => a + d.missing, 0);
  const coveragePct = Math.round(
    (TOTAL_EXPECTED_DOCS - totalMissingDocs) / TOTAL_EXPECTED_DOCS * 100
  );

  const healthScore = computeHealthScore({
    totalDrafts, writtenDrafts, approvedDrafts, pendingDrafts,
    failedWrites, duplicateCandidates, coveragePct,
  });

  return {
    totalDrafts, approvedDrafts, pendingDrafts, writtenDrafts,
    archivedDrafts, failedWrites, duplicateCandidates, orphanCandidates,
    lastWriteTimestamp, domainCoverage, coveragePct, healthScore,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'core',       label: 'Core Reports' },
  { id: 'brief',      label: 'Daily Brief' },
  { id: 'health',     label: 'Health Summary' },
  { id: 'coverage',   label: 'Domain Coverage' },
  { id: 'missing',    label: 'Missing Docs' },
  { id: 'status',     label: 'Agent Status' },
  { id: 'verify',     label: 'Verification' },
];

export default function VeridanVaultAgent() {
  const [activeTab, setActiveTab] = useState('core');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const [allDrafts, allAudits] = await Promise.all([
        base44.entities.VeridanObsidianDraft.list('-created_date', 1000),
        base44.entities.VeridanObsidianWriteAudit.list('-created_date', 1000),
      ]);
      setDrafts(allDrafts);
      setAudits(allAudits);
      setStats(computeStats(allDrafts, allAudits));
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('[VaultAgent] Analysis failed:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { runAnalysis(); }, [runAnalysis]);

  // Derived data for sub-components
  const pendingDraftsList = drafts.filter(d =>
    !isArchived(d) && (d.approvalStatus === 'PENDING_REVIEW' || !d.approvalStatus));
  const recentWritesList = audits
    .filter(a => !isArchived(a) && a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY')
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, 10);

  const missingDocs = (stats?.domainCoverage || []).flatMap(d =>
    d.docs.filter(doc => doc.status === 'MISSING').map(doc => ({ ...doc, domain: d.domain }))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Knowledge Management
            </div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BotMessageSquare className="w-5 h-5 text-primary" />
              Veridan Vault Agent v1
              <span className="text-[8px] font-mono text-slate-500 font-normal">Phase 3 · Core Integration</span>
            </h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Governance-safe read-only reporting · Phase 2 report integration · Knowledge vault analysis
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['READ_ONLY', 'REPORTING_ONLY', 'NO_EXECUTION', 'OPENCLAW_DISABLED'].map(chip => (
                <span key={chip} className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${
                  chip === 'READ_ONLY' || chip === 'REPORTING_ONLY' ? 'border-primary/30 bg-primary/10 text-primary' :
                  'border-destructive/30 bg-destructive/10 text-destructive'
                }`}>{chip}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastRefreshed && (
              <span className="text-[7px] font-mono text-slate-500 flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> entity data refreshed {lastRefreshed}
              </span>
            )}
            <button type="button" onClick={runAnalysis} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-accent/40 text-accent hover:border-accent/60 rounded-sm transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {stats ? 'Refresh Analysis' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-4">

        {activeTab === 'core' && <CoreReportsDashboard />}

        {activeTab === 'brief' && (
          <DailyVaultBrief
            stats={stats || {
              healthScore: 0, failedWrites: 0, duplicateCandidates: 0,
              orphanCandidates: 0, coveragePct: 0
            }}
            domainCoverage={stats?.domainCoverage || []}
            recentWrites={recentWritesList}
            pendingDrafts={pendingDraftsList}
            loading={loading}
          />
        )}

        {activeTab === 'health' && (
          <VaultHealthSummary
            stats={stats || {
              healthScore: 0, totalDrafts: 0, approvedDrafts: 0, pendingDrafts: 0,
              writtenDrafts: 0, archivedDrafts: 0, failedWrites: 0,
              duplicateCandidates: 0, orphanCandidates: 0, lastWriteTimestamp: '—'
            }}
            loading={loading}
          />
        )}

        {activeTab === 'coverage' && (
          <DomainCoverageTable
            domainCoverage={stats?.domainCoverage || []}
            loading={loading}
          />
        )}

        {activeTab === 'missing' && (
          <MissingDocRecommendations
            missingDocs={missingDocs}
            onDraftCreated={runAnalysis}
          />
        )}

        {activeTab === 'status' && <VaultAgentStatusCard />}

        {activeTab === 'verify' && <VaultAgentVerification />}

      </div>
    </div>
  );
}