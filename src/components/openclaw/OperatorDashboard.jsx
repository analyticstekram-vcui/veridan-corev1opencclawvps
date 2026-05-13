import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Lock, Database, Shield, Zap } from 'lucide-react';

export default function OperatorDashboard() {
  const [stats, setStats] = useState({
    proposalStats: { total: 0, draft: 0, pending: 0, approved: 0, denied: 0 },
    evidenceStats: { total: 0, valid: 0, notVerified: 0, latestHash: 'NOT_AVAILABLE' },
    deploymentFiles: {
      systemVerifySnapshot: false,
      finalDeploymentLock: false,
      vaultExport: false,
      baselineArchive: false,
    },
  });

  useEffect(() => {
    // Load proposal stats
    try {
      const proposals = localStorage.getItem('openclawProposals');
      if (proposals) {
        const list = JSON.parse(proposals);
        setStats(prev => ({
          ...prev,
          proposalStats: {
            total: list.length,
            draft: list.filter(p => p.status === 'DRAFT').length,
            pending: list.filter(p => p.status === 'PENDING_APPROVAL').length,
            approved: list.filter(p => p.status === 'APPROVED').length,
            denied: list.filter(p => p.status === 'DENIED').length,
          }
        }));
      }
    } catch (_) {}

    // Load evidence stats
    try {
      const evidence = localStorage.getItem('auditEvidenceVault');
      const lockHistory = localStorage.getItem('finalDeploymentLockHistory');
      const archiveRecords = localStorage.getItem('openclawBaselineArchive');
      const snapshotHistory = localStorage.getItem('systemVerifySnapshotHistory');

      const evidenceList = evidence ? JSON.parse(evidence) : [];
      const locks = lockHistory ? JSON.parse(lockHistory) : [];
      const archives = archiveRecords ? JSON.parse(archiveRecords) : [];
      const snapshots = snapshotHistory ? JSON.parse(snapshotHistory) : [];

      setStats(prev => ({
        ...prev,
        evidenceStats: {
          total: evidenceList.length,
          valid: evidenceList.filter(e => e.verificationStatus === 'VALID').length,
          notVerified: evidenceList.filter(e => e.verificationStatus === 'NOT_VERIFIED').length,
          latestHash: locks.length > 0 ? locks[0].lockHash.substring(0, 16) + '...' : 'NOT_AVAILABLE',
        },
        deploymentFiles: {
          systemVerifySnapshot: snapshots.length > 0,
          finalDeploymentLock: locks.length > 0,
          vaultExport: archives.length > 0,
          baselineArchive: archiveRecords !== null && archiveRecords.length > 0,
        }
      }));
    } catch (_) {}
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Operator Command Center</div>
          <div className="text-[13px] font-semibold text-foreground">System Dashboard</div>
        </div>
        <Lock className="w-5 h-5 text-primary" />
      </div>

      {/* Read-Only Warning */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ READ-ONLY DASHBOARD</div>
          <div className="text-[9px] text-destructive/70">All information is read-only. No execution, automation, or configuration changes are possible.</div>
        </div>
      </div>

      {/* Current System State */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Current System State</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Deployment</div>
            <div className="font-semibold text-primary">READY_FOR_NON_EXECUTION</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Lock Status</div>
            <div className="font-semibold text-primary">LOCKED</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Maximum Capability</div>
            <div className="font-semibold text-slate-300">PREVIEW_ONLY</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Execution</div>
            <div className="font-semibold text-destructive">DISABLED</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Gateway Mode</div>
            <div className="font-semibold text-slate-300">READ_ONLY</div>
          </div>
        </div>
      </div>

      {/* Safety Boundaries */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Safety Boundaries</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px]">
          {[
            { label: 'Live Execution', status: 'DISABLED' },
            { label: 'Browser Automation', status: 'DISABLED' },
            { label: 'API Trading', status: 'DISABLED' },
            { label: 'Credential Entry', status: 'DISABLED' },
            { label: 'Money Movement', status: 'DISABLED' },
            { label: 'Full File Storage', status: 'DISABLED' },
          ].map((boundary, idx) => (
            <div key={idx} className="bg-card border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">{boundary.label}</div>
              <div className="font-semibold text-destructive">{boundary.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposal Queue */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Proposal Queue</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[9px] mb-3">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total</div>
            <div className="text-[14px] font-semibold text-foreground">{stats.proposalStats.total}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Draft</div>
            <div className="text-[14px] font-semibold text-slate-300">{stats.proposalStats.draft}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Pending</div>
            <div className="text-[14px] font-semibold text-amber-500">{stats.proposalStats.pending}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Approved</div>
            <div className="text-[14px] font-semibold text-primary">{stats.proposalStats.approved}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Denied</div>
            <div className="text-[14px] font-semibold text-destructive">{stats.proposalStats.denied}</div>
          </div>
        </div>
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded">
          <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
          <div className="text-[8px] text-destructive/80">
            <div className="font-semibold">⚠️ APPROVAL DOES NOT EXECUTE</div>
            <div className="text-[7px] text-destructive/70">Approved proposals remain non-executable.</div>
          </div>
        </div>
      </div>

      {/* Latest Evidence */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Latest Evidence</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total Records</div>
            <div className="text-[14px] font-semibold text-foreground">{stats.evidenceStats.total}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Valid</div>
            <div className="text-[14px] font-semibold text-primary">{stats.evidenceStats.valid}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Not Verified</div>
            <div className="text-[14px] font-semibold text-slate-400">{stats.evidenceStats.notVerified}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Latest Hash</div>
            <div className="font-mono text-[8px] text-foreground truncate">{stats.evidenceStats.latestHash}</div>
          </div>
        </div>
      </div>

      {/* Deployment Files */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Deployment Files</div>
        <div className="space-y-2">
          {[
            { name: 'System Verify Snapshot', status: stats.deploymentFiles.systemVerifySnapshot },
            { name: 'Final Deployment Lock', status: stats.deploymentFiles.finalDeploymentLock },
            { name: 'Vault Export', status: stats.deploymentFiles.vaultExport },
            { name: 'Baseline Archive Manifest', status: stats.deploymentFiles.baselineArchive },
          ].map((file, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-card border border-border/30 rounded">
              <span className="text-[9px] text-foreground">{file.name}</span>
              <span className={`text-[8px] px-2 py-0.5 border rounded font-semibold ${
                file.status
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
              }`}>
                {file.status ? 'Present' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Operator Action */}
      <div className={`border rounded-lg p-4 space-y-3 ${
        stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && stats.deploymentFiles.baselineArchive
          ? 'bg-primary/5 border-primary/20'
          : 'bg-amber-500/5 border-amber-500/20'
      }`}>
        <div className={`text-[11px] font-semibold uppercase tracking-wider ${
          stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && stats.deploymentFiles.baselineArchive
            ? 'text-primary'
            : 'text-amber-500'
        }`}>
          Next Operator Action
        </div>
        <div className={`flex items-start gap-3 px-3 py-2 rounded ${
          stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && stats.deploymentFiles.baselineArchive
            ? 'bg-primary/10'
            : 'bg-amber-500/10'
        }`}>
          {stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && stats.deploymentFiles.baselineArchive ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className={`text-[10px] ${
            stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && stats.deploymentFiles.baselineArchive
              ? 'text-primary/90'
              : 'text-amber-500/90'
          }`}>
            {!stats.deploymentFiles.finalDeploymentLock && "Export Final Lock"}
            {stats.deploymentFiles.finalDeploymentLock && !stats.evidenceStats.total && "Add Evidence Record"}
            {stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && !stats.deploymentFiles.baselineArchive && "Export Baseline Archive"}
            {stats.deploymentFiles.finalDeploymentLock && stats.evidenceStats.total > 0 && stats.deploymentFiles.baselineArchive && "No action required — baseline locked"}
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">System Locked for Non-Execution Deployment</div>
          <div className="text-[9px] text-primary/70">All execution pathways disabled. Gateway read-only only. No execution code. No browser automation. No trading. No credentials. No money movement. No full files.</div>
        </div>
      </div>
    </div>
  );
}