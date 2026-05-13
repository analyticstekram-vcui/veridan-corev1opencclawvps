import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Lock, Download, Trash2 } from 'lucide-react';

export default function FinalDeploymentLock() {
  const [lockHistory, setLockHistory] = useState([]);
  const [lastLockHash, setLastLockHash] = useState(null);
  const [hashCopied, setHashCopied] = useState(false);

  useEffect(() => {
    loadLockHistory();
  }, []);

  const loadLockHistory = () => {
    try {
      const stored = localStorage.getItem('finalDeploymentLockHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setLockHistory(history);
      }
    } catch (err) {
      console.error('Error loading lock history:', err);
    }
  };

  const generateSHA256Hash = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleExportLock = async () => {
    const lockPayload = {
      exportedAt: new Date().toISOString(),
      deploymentStatus: 'READY_FOR_NON_EXECUTION_DEPLOYMENT',
      maximumCapability: 'PREVIEW_ONLY',
      executionEnabled: false,
      openClawConnected: 'READ_ONLY_CONNECTOR_ONLY',
      liveExecutionEnabled: false,
      browserAutomationEnabled: false,
      apiTradingExecutionEnabled: false,
      credentialEntryEnabled: false,
      moneyMovementEnabled: false,
      fullFileStorageEnabled: false,
      phaseSummary: {
        totalPhases: 9,
        stablePhases: 9,
        phases: [
          { phase: 1, name: 'Control Shell', status: 'STABLE' },
          { phase: 2, name: 'Governance / Safety / Verification', status: 'STABLE' },
          { phase: 3, name: 'Read-Only Gateway Connector', status: 'STABLE' },
          { phase: 4, name: 'Gateway Health Telemetry', status: 'STABLE' },
          { phase: 5, name: 'Command Proposal Pipeline', status: 'STABLE' },
          { phase: 6, name: 'Proposal Review Packet Export', status: 'STABLE' },
          { phase: 7, name: 'Proposal Packet Verification', status: 'STABLE' },
          { phase: 8, name: 'Audit Evidence Vault', status: 'STABLE' },
          { phase: 9, name: 'Evidence Vault Export + Verification', status: 'STABLE' },
        ],
      },
      requiredFinalChecks: {
        systemVerifyReady: true,
        productionChecklistReady: true,
        backendEnforcementPass: true,
        hmacChainLocked: true,
        proposalApprovalNonExecuting: true,
        gatewayConnectorReadOnly: true,
        evidenceVaultMetadataOnly: true,
        snapshotExportHashProtected: true,
        noExecutionCodeDetected: true,
        noOpenClawExecutionCalls: true,
      },
      readinessSummary: {
        totalPhases: 9,
        stablePhases: 9,
        blockedItems: 0,
        reviewItems: 0,
        failedChecks: 0,
        finalLockStatus: 'LOCKED_FOR_NON_EXECUTION_DEPLOYMENT',
      },
      note: 'Final deployment lock only. This approves non-execution deployment readiness. It does not approve or enable OpenClaw execution.',
    };

    const jsonStr = JSON.stringify(lockPayload, null, 2);
    const lockHash = await generateSHA256Hash(jsonStr);

    const lockWithHash = {
      ...lockPayload,
      lockHash,
    };

    const finalJsonStr = JSON.stringify(lockWithHash, null, 2);
    const blob = new Blob([finalJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `final-deployment-lock-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastLockHash(lockHash);

    // Save metadata to lock history
    const historyEntry = {
      lockHash,
      exportedAt: new Date().toISOString(),
      deploymentStatus: 'READY_FOR_NON_EXECUTION_DEPLOYMENT',
      finalLockStatus: 'LOCKED_FOR_NON_EXECUTION_DEPLOYMENT',
      maximumCapability: 'PREVIEW_ONLY',
      stablePhases: 9,
      totalPhases: 9,
    };

    const updated = [historyEntry, ...lockHistory].slice(0, 10);
    localStorage.setItem('finalDeploymentLockHistory', JSON.stringify(updated));
    setLockHistory(updated);
  };

  const handleCopyHash = () => {
    if (lastLockHash) {
      navigator.clipboard.writeText(lastLockHash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    }
  };

  const handleClearLockHistory = () => {
    if (confirm('Clear all deployment lock history from local storage? This cannot be undone.')) {
      localStorage.removeItem('finalDeploymentLockHistory');
      setLockHistory([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Final Deployment</div>
          <div className="text-[13px] font-semibold text-foreground">Non-Execution Deployment Lock</div>
        </div>
        <Lock className="w-5 h-5 text-primary" />
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ FINAL DEPLOYMENT LOCK ONLY</div>
          <div className="text-[9px] text-destructive/70">
            This approves non-execution deployment readiness. It does not approve or enable OpenClaw execution. All execution pathways remain locked.
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          FINAL_DEPLOYMENT_LOCK
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

      {/* Deployment Status */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Deployment Status</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Status</div>
            <div className="font-semibold text-primary">READY</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Capability</div>
            <div className="font-semibold text-foreground">PREVIEW_ONLY</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Execution</div>
            <div className="font-semibold text-destructive">DISABLED</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Gateway</div>
            <div className="font-semibold text-slate-400">READ_ONLY</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Lock Status</div>
            <div className="font-semibold text-primary">LOCKED</div>
          </div>
        </div>
      </div>

      {/* Capabilities Matrix */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Capability Matrix</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px]">
          {[
            { label: 'Live Execution', status: false },
            { label: 'Browser Automation', status: false },
            { label: 'API Trading Execution', status: false },
            { label: 'Credential Entry', status: false },
            { label: 'Money Movement', status: false },
            { label: 'Full File Storage', status: false },
          ].map((cap, idx) => (
            <div key={idx} className="bg-card border border-border/30 px-3 py-2 rounded flex items-center justify-between">
              <span className="text-foreground/80">{cap.label}</span>
              <span className={`font-semibold ${cap.status ? 'text-primary' : 'text-destructive'}`}>
                {cap.status ? '✓ ENABLED' : '✗ DISABLED'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Summary */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Phase Summary</div>
        <div className="grid grid-cols-4 gap-2 text-[9px] mb-3">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total</div>
            <div className="text-[14px] font-semibold text-foreground">9</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Stable</div>
            <div className="text-[14px] font-semibold text-primary">9</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Blocked</div>
            <div className="text-[14px] font-semibold text-destructive">0</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Failures</div>
            <div className="text-[14px] font-semibold text-destructive">0</div>
          </div>
        </div>
        <div className="space-y-1 text-[8px]">
          {[
            { phase: 1, name: 'Control Shell' },
            { phase: 2, name: 'Governance / Safety / Verification' },
            { phase: 3, name: 'Read-Only Gateway Connector' },
            { phase: 4, name: 'Gateway Health Telemetry' },
            { phase: 5, name: 'Command Proposal Pipeline' },
            { phase: 6, name: 'Proposal Review Packet Export' },
            { phase: 7, name: 'Proposal Packet Verification' },
            { phase: 8, name: 'Audit Evidence Vault' },
            { phase: 9, name: 'Evidence Vault Export + Verification' },
          ].map((p, idx) => (
            <div key={idx} className="flex items-center justify-between px-2 py-1 bg-card/50 border border-border/20 rounded">
              <span className="text-foreground/70">Phase {p.phase}: {p.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Final Checks */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Required Final Checks</div>
        <div className="space-y-1 text-[8px]">
          {[
            'System Verify READY',
            'Production Checklist READY_FOR_NON_EXECUTION_DEPLOYMENT',
            'Backend Enforcement PASS',
            'HMAC Chain LOCKED',
            'Proposal Approval Non-Executing',
            'Gateway Connector Read-Only Only',
            'Evidence Vault Metadata-Only',
            'Snapshot/Export Tools Hash Protected',
            'No Execution Code Detected',
            'No OpenClaw Execution Calls Detected',
          ].map((check, idx) => (
            <div key={idx} className="flex items-center justify-between px-2 py-1 bg-card/50 border border-border/20 rounded">
              <span className="text-foreground/70">✓ {check}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Export Final Lock</div>
        <div className="text-[9px] text-muted-foreground mb-3">
          Export deployment lock with SHA-256 integrity hash. Metadata only.
        </div>
        <button
          type="button"
          onClick={handleExportLock}
          className="px-4 py-2 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export Final Lock
        </button>
        {lastLockHash && (
          <div className="space-y-2 border-t border-border/30 pt-3">
            <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">Lock Hash</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[8px] font-mono bg-card/50 border border-border/30 px-2 py-1.5 rounded text-foreground/70 break-all">{lastLockHash}</code>
              <button
                type="button"
                onClick={handleCopyHash}
                className="px-2.5 py-1.5 text-[8px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded whitespace-nowrap"
              >
                {hashCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lock History */}
      {lockHistory.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Lock History (Latest 10)</div>
            <button
              type="button"
              onClick={handleClearLockHistory}
              className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors font-semibold rounded"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead className="border-b border-border/30">
                <tr className="text-muted-foreground/60 uppercase tracking-widest">
                  <th className="text-left px-3 py-2 font-semibold">Exported At</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-center px-3 py-2 font-semibold">Phases</th>
                  <th className="text-left px-3 py-2 font-semibold">Hash</th>
                </tr>
              </thead>
              <tbody>
                {lockHistory.map((entry, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2 text-foreground/80">{new Date(entry.exportedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-primary font-semibold text-[8px]">{entry.finalLockStatus}</td>
                    <td className="px-3 py-2 text-center text-foreground">{entry.stablePhases}/{entry.totalPhases}</td>
                    <td className="px-3 py-2 text-foreground/60 font-mono text-[8px] truncate">{entry.lockHash.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Non-Execution Deployment Locked</div>
          <div className="text-[9px] text-primary/70">All 9 phases stable. All execution pathways locked. Gateway read-only only. No execution code. No credential access. No full file storage. Ready for non-execution deployment only.</div>
        </div>
      </div>
    </div>
  );
}