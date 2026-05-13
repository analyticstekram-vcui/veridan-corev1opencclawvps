import React, { useState, useEffect } from 'react';
import { Download, Copy, CheckCircle2, XCircle } from 'lucide-react';

/**
 * GateDecisionExporter - Handles gate decision export, SHA-256 hashing, and history management.
 * Used by SystemVerificationPanel.
 */
export default function GateDecisionExporter({
  gateState,
  gateReasons,
  overallReadiness,
  prodBlockingFailed,
  manualReviewItemCount,
  failedTests,
  backendEnforcementPassed,
  snapshotHash,
  approvalRecords,
}) {
  const [gateDecisionHash, setGateDecisionHash] = useState(null);
  const [gateDecisionHashCopied, setGateDecisionHashCopied] = useState(false);
  const [gateDecisionHistory, setGateDecisionHistory] = useState([]);

  useEffect(() => {
    loadGateDecisionHistory();
  }, []);

  const generateSHA256Hash = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const loadGateDecisionHistory = () => {
    try {
      const stored = localStorage.getItem('systemVerifyGateDecisionHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setGateDecisionHistory(history);
      }
    } catch (err) {
      console.error('Error loading gate decision history:', err);
    }
  };

  const saveGateDecisionToHistory = async (hash) => {
    try {
      const latestApprovalDecision = approvalRecords.length > 0 ? approvalRecords[0].approvalDecision : null;
      const metadata = {
        gateDecisionHash: hash,
        gateState,
        readinessStatus: overallReadiness,
        latestApprovalDecision,
        exportedAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem('systemVerifyGateDecisionHistory') || '[]';
      const history = JSON.parse(stored);
      history.unshift(metadata);
      const trimmed = history.slice(0, 10);
      localStorage.setItem('systemVerifyGateDecisionHistory', JSON.stringify(trimmed));
      setGateDecisionHistory(trimmed);
    } catch (err) {
      console.error('Error saving gate decision to history:', err);
    }
  };

  const clearGateDecisionHistory = () => {
    if (confirm('Clear all gate decision exports from local storage?')) {
      localStorage.removeItem('systemVerifyGateDecisionHistory');
      setGateDecisionHistory([]);
    }
  };

  const copyGateDecisionHashToClipboard = () => {
    if (gateDecisionHash) {
      navigator.clipboard.writeText(gateDecisionHash);
      setGateDecisionHashCopied(true);
      setTimeout(() => setGateDecisionHashCopied(false), 2000);
    }
  };

  const exportGateDecision = async () => {
    const latestApprovalDecision = approvalRecords.length > 0 ? approvalRecords[0].approvalDecision : null;

    const gateDecision = {
      exportedAt: new Date().toISOString(),
      gateState,
      gateReasons,
      readinessStatus: overallReadiness,
      blockingIssueCount: prodBlockingFailed.length,
      manualReviewItemCount,
      failedTestCount: failedTests,
      backendEnforcementPassed,
      latestSnapshotHash: snapshotHash || null,
      latestApprovalDecision,
      note: 'Gate decision is preview-only and does not enable execution.',
    };

    const jsonStr = JSON.stringify(gateDecision, null, 2);
    const hash = await generateSHA256Hash(jsonStr);

    const gateDecisionWithHash = {
      ...gateDecision,
      gateDecisionHash: hash,
    };

    const finalJsonStr = JSON.stringify(gateDecisionWithHash, null, 2);
    const blob = new Blob([finalJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gate-decision-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setGateDecisionHash(hash);
    await saveGateDecisionToHistory(hash);
  };

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <button
        type="button"
        onClick={exportGateDecision}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[10px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded"
      >
        <Download className="w-3.5 h-3.5" />
        Export Gate Decision
      </button>

      {/* Gate Decision Hash Display */}
      {gateDecisionHash && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-primary/60 font-semibold">Gate Decision Hash (SHA-256)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[8px] font-mono bg-secondary/50 border border-border/30 px-2 py-1.5 rounded break-all text-foreground/80">
              {gateDecisionHash}
            </code>
            <button
              type="button"
              onClick={copyGateDecisionHashToClipboard}
              className="px-2 py-1.5 text-[8px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded whitespace-nowrap"
            >
              {gateDecisionHashCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-[8px] text-primary/70">Hash proves gate decision integrity. If hash changes after export, the file was modified.</div>
        </div>
      )}

      {/* Gate Decision History */}
      {gateDecisionHistory.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-foreground">Gate Decision History</div>
            <button
              type="button"
              onClick={clearGateDecisionHistory}
              className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors font-semibold rounded"
            >
              Clear History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead className="border-b border-border/30">
                <tr className="text-muted-foreground/60 uppercase tracking-widest">
                  <th className="text-left px-3 py-2 font-semibold">Exported At</th>
                  <th className="text-left px-3 py-2 font-semibold">Gate State</th>
                  <th className="text-left px-3 py-2 font-semibold">Readiness Status</th>
                  <th className="text-left px-3 py-2 font-semibold">Latest Approval</th>
                  <th className="text-left px-3 py-2 font-semibold">Hash (first 16 chars)</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {gateDecisionHistory.map((record, idx) => {
                  const stateColor = record.gateState === 'LOCKED' ? 'text-destructive' :
                                     record.gateState === 'REVIEW_LOCKED' ? 'text-amber-500' :
                                     'text-primary';
                  const statusColor = record.readinessStatus === 'READY' ? 'text-primary' :
                                     record.readinessStatus === 'REVIEW REQUIRED' ? 'text-amber-500' :
                                     'text-destructive';
                  const approvalColor = record.latestApprovalDecision === 'APPROVED' ? 'text-primary' :
                                       record.latestApprovalDecision === 'NEEDS_REVIEW' ? 'text-amber-500' :
                                       record.latestApprovalDecision === 'REJECTED' ? 'text-destructive' :
                                       'text-slate-400';
                  return (
                    <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2 font-mono text-foreground/60 text-[8px]">{new Date(record.exportedAt).toLocaleString()}</td>
                      <td className={`px-3 py-2 font-semibold ${stateColor}`}>{record.gateState}</td>
                      <td className={`px-3 py-2 font-semibold ${statusColor}`}>{record.readinessStatus}</td>
                      <td className={`px-3 py-2 font-semibold ${approvalColor}`}>{record.latestApprovalDecision || '—'}</td>
                      <td className="px-3 py-2 font-mono text-foreground/60 text-[8px]">{record.gateDecisionHash.substring(0, 16)}...</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-[8px] text-muted-foreground/60 border-t border-border/30 pt-2">
            Latest 10 gate decision exports stored locally. Metadata only—no sensitive data. Clear anytime to reset.
          </div>
        </div>
      )}
    </div>
  );
}