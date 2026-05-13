import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Shield, TrendingUp, Zap } from 'lucide-react';

export default function OpenClawControlTower() {
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [proposalStats, setProposalStats] = useState({ total: 0, draft: 0, pending: 0, approved: 0, denied: 0 });
  const [evidenceStats, setEvidenceStats] = useState({ total: 0, valid: 0, tampered: 0, notVerified: 0, latestLocks: {} });

  useEffect(() => {
    loadSystemState();
  }, []);

  const loadSystemState = () => {
    // Load gateway status from localStorage if available
    try {
      const stored = localStorage.getItem('openclawGatewayStatus');
      if (stored) {
        setGatewayStatus(JSON.parse(stored));
      }
    } catch (_) {}

    // Load proposal stats
    try {
      const proposals = localStorage.getItem('openclawProposals');
      if (proposals) {
        const list = JSON.parse(proposals);
        const stats = {
          total: list.length,
          draft: list.filter(p => p.status === 'DRAFT').length,
          pending: list.filter(p => p.status === 'PENDING_APPROVAL').length,
          approved: list.filter(p => p.status === 'APPROVED').length,
          denied: list.filter(p => p.status === 'DENIED').length,
        };
        setProposalStats(stats);
      }
    } catch (_) {}

    // Load evidence stats
    try {
      const evidence = localStorage.getItem('auditEvidenceVault');
      const lockHistory = localStorage.getItem('finalDeploymentLockHistory');
      const archiveRecords = localStorage.getItem('openclawBaselineArchive');

      const evidenceList = evidence ? JSON.parse(evidence) : [];
      const locks = lockHistory ? JSON.parse(lockHistory) : [];
      const archives = archiveRecords ? JSON.parse(archiveRecords) : [];

      const stats = {
        total: evidenceList.length,
        valid: evidenceList.filter(e => e.verificationStatus === 'VALID').length,
        tampered: evidenceList.filter(e => e.verificationStatus === 'TAMPERED').length,
        notVerified: evidenceList.filter(e => e.verificationStatus === 'NOT_VERIFIED').length,
        latestLocks: {
          finalLock: locks.length > 0 ? locks[0].lockHash.substring(0, 16) + '...' : 'NOT_AVAILABLE',
          archive: archives.length > 0 ? archives[0].archiveHash.substring(0, 16) + '...' : 'NOT_AVAILABLE',
        },
      };
      setEvidenceStats(stats);
    } catch (_) {}
  };

  // Determine recommended action
  const getRecommendedAction = () => {
    if (evidenceStats.total === 0) {
      return { action: 'Add/verify evidence record', severity: 'warn' };
    }
    if (evidenceStats.latestLocks.finalLock === 'NOT_AVAILABLE') {
      return { action: 'Export Final Lock', severity: 'warn' };
    }
    if (proposalStats.total === 0 && evidenceStats.total > 0) {
      return { action: 'No action required. System locked for non-execution deployment.', severity: 'pass' };
    }
    return { action: 'Monitor system state. Deployment ready for non-execution only.', severity: 'pass' };
  };

  const recommendation = getRecommendedAction();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">OpenClaw</div>
          <div className="text-[13px] font-semibold text-foreground">Control Tower</div>
        </div>
        <Zap className="w-5 h-5 text-primary" />
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ CONTROL TOWER IS READ-ONLY</div>
          <div className="text-[9px] text-destructive/70">Summarizes system state only. Does not execute actions, enable execution, or modify configuration.</div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          CONTROL_TOWER
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          NON_EXECUTION_READY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          PREVIEW_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-semibold uppercase tracking-wider">
          EXECUTION_DISABLED
        </span>
      </div>

      {/* 1. Deployment Lock Status */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Deployment Lock Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
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
        </div>
      </div>

      {/* 2. Gateway Summary */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Gateway Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Mode</div>
            <div className="font-semibold text-foreground">READ_ONLY_CONNECTOR</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Status</div>
            <div className={`font-semibold ${gatewayStatus?.online ? 'text-primary' : 'text-slate-400'}`}>
              {gatewayStatus?.online ? 'Online' : 'Offline / Unknown'}
            </div>
          </div>
          {gatewayStatus?.latencyMs && (
            <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Latency</div>
              <div className="font-semibold text-foreground">{gatewayStatus.latencyMs}ms</div>
            </div>
          )}
          {gatewayStatus?.version && (
            <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Version</div>
              <div className="font-mono text-[8px] text-foreground">{gatewayStatus.version}</div>
            </div>
          )}
          {gatewayStatus?.lastSuccessAt && (
            <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Last Success</div>
              <div className="text-[8px] text-foreground">{new Date(gatewayStatus.lastSuccessAt).toLocaleTimeString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Proposal Summary */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Proposal Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total</div>
            <div className="text-[14px] font-semibold text-foreground">{proposalStats.total}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Draft</div>
            <div className="text-[14px] font-semibold text-slate-300">{proposalStats.draft}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Pending</div>
            <div className="text-[14px] font-semibold text-amber-500">{proposalStats.pending}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Approved</div>
            <div className="text-[14px] font-semibold text-primary">{proposalStats.approved}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Denied</div>
            <div className="text-[14px] font-semibold text-destructive">{proposalStats.denied}</div>
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

      {/* 4. Evidence Summary */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Evidence Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] mb-3">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total</div>
            <div className="text-[14px] font-semibold text-foreground">{evidenceStats.total}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Valid</div>
            <div className="text-[14px] font-semibold text-primary">{evidenceStats.valid}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Tampered</div>
            <div className="text-[14px] font-semibold text-destructive">{evidenceStats.tampered}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Not Verified</div>
            <div className="text-[14px] font-semibold text-slate-400">{evidenceStats.notVerified}</div>
          </div>
        </div>
        <div className="space-y-2 text-[8px]">
          <div className="flex items-center justify-between px-3 py-1.5 bg-card border border-border/30 rounded">
            <span className="text-muted-foreground">Final Lock Hash</span>
            <span className="font-mono text-foreground">{evidenceStats.latestLocks.finalLock}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-card border border-border/30 rounded">
            <span className="text-muted-foreground">Archive Hash</span>
            <span className="font-mono text-foreground">{evidenceStats.latestLocks.archive}</span>
          </div>
        </div>
      </div>

      {/* 5. Safety Boundaries */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Safety Boundaries (All Disabled)</div>
        <div className="space-y-1 text-[9px]">
          {[
            'liveExecutionEnabled: false',
            'browserAutomationEnabled: false',
            'apiTradingExecutionEnabled: false',
            'credentialEntryEnabled: false',
            'moneyMovementEnabled: false',
            'fullFileStorageEnabled: false',
          ].map((boundary, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/20 rounded">
              <span className="text-destructive font-semibold">✗</span>
              <span className="text-destructive/80 font-mono text-[8px]">{boundary}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Next Recommended Action */}
      <div className={`border rounded-lg p-4 space-y-3 ${recommendation.severity === 'pass' ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <div className={`text-[11px] font-semibold uppercase tracking-wider ${recommendation.severity === 'pass' ? 'text-primary' : 'text-amber-500'}`}>
          Next Recommended Action
        </div>
        <div className={`flex items-start gap-3 px-3 py-2 rounded ${recommendation.severity === 'pass' ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
          {recommendation.severity === 'pass' ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className={`text-[10px] ${recommendation.severity === 'pass' ? 'text-primary/90' : 'text-amber-500/90'}`}>
            {recommendation.action}
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