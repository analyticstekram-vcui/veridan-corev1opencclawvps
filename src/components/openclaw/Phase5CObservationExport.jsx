import React, { useState, useEffect } from 'react';
import { Download, Copy, Trash2, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXPORT_HISTORY_KEY = 'phase5c_export_history';

export default function Phase5CObservationExport({ metrics, records, filters }) {
  const [exporting, setExporting] = useState(false);
  const [exportHash, setExportHash] = useState(null);
  const [exportedAt, setExportedAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // Load export history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(EXPORT_HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load export history:', err);
      }
    }
  }, []);

  // Generate SHA-256 hash
  const generateHash = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Export metrics and records
  const handleExport = async () => {
    setExporting(true);
    try {
      const now = new Date().toISOString();

      // Build export payload
      const exportData = {
        exportedAt: now,
        note: 'Phase 5C observation export only. No OpenClaw action was executed.',
        phase: 'PHASE_5C_OBSERVATION_EXPORT',
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatusBoundary: ['PREVIEW_ONLY', 'REJECTED_NOT_EXECUTED'],
        metrics: {
          total: metrics.total,
          accepted: metrics.accepted,
          rejected: metrics.rejected,
          acceptanceRate: metrics.acceptanceRate,
          rejectionRate: metrics.rejectionRate,
          byCommandType: metrics.byCommandType,
          byRiskTier: metrics.byRiskTier,
          byDomain: metrics.byDomain,
          byRejectedReason: metrics.byRejectedReason,
          byPolicyGateResult: metrics.byPolicyGateResult,
          byReplayCheckResult: metrics.byReplayCheckResult,
          bySignatureCheckResult: metrics.bySignatureCheckResult,
          latestAcceptedTime: metrics.latestAcceptedTime,
          latestRejectedTime: metrics.latestRejectedTime,
        },
        records: records.slice(0, 25),
        filtersApplied: filters,
      };

      // Generate hash of payload (before adding hash itself)
      const payloadString = JSON.stringify(exportData, null, 2);
      const hash = await generateHash(payloadString);

      // Add hash to export
      exportData.exportHash = hash;
      const finalExport = JSON.stringify(exportData, null, 2);

      // Save to file
      const blob = new Blob([finalExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `phase5c-observation-export-${now.replace(/[^0-9]/g, '')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save to localStorage history
      const historyEntry = {
        exportHash: hash,
        exportedAt: now,
        recordCount: records.length,
        totalDryRunAttempts: metrics.total,
        acceptedCount: metrics.accepted,
        rejectedCount: metrics.rejected,
        filtersApplied: filters,
      };

      const updatedHistory = [historyEntry, ...history].slice(0, 10);
      localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      // Set UI state
      setExportHash(hash);
      setExportedAt(now);
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setExporting(false);
    }
  };

  // Copy hash to clipboard
  const copyHashToClipboard = () => {
    navigator.clipboard.writeText(exportHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear export history
  const clearHistory = () => {
    if (confirm('Clear all export history? This cannot be undone.')) {
      localStorage.removeItem(EXPORT_HISTORY_KEY);
      setHistory([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-blue-500/20 bg-blue-500/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Phase 5C: Observation Export</div>
            <div className="text-[8px] text-blue-400/70 mt-1">Client-side export of Phase 5B metrics as tamper-evident audit artifact.</div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[8px] text-amber-600">Observation export only. This does not call OpenClaw or execute actions.</span>
        </div>

        {/* Status Badges */}
        <div className="px-4 py-2 border-b border-blue-500/20 flex items-center gap-1.5">
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">EXPORT_ONLY</span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">OPENCLAW_NOT_CONNECTED</span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">EXECUTION_DISABLED</span>
        </div>
      </div>

      {/* Export Controls */}
      <div className="border border-blue-500/20 bg-blue-500/5 rounded p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[8px] font-semibold text-blue-400 uppercase">Export Current Snapshot</div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="text-[8px] h-7"
          >
            {exporting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Export JSON
              </>
            )}
          </Button>
        </div>

        <div className="text-[7px] text-blue-400/70">
          Exports metrics, latest 25 records, and applied filters. JSON includes SHA-256 hash for tamper detection.
        </div>
      </div>

      {/* Export Hash Display */}
      {exportHash && (
        <div className="border border-green-500/20 bg-green-500/5 rounded p-3">
          <div className="text-[8px] font-semibold text-green-600 mb-2">Export Hash (SHA-256)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[7px] font-mono bg-secondary p-2 rounded border border-border truncate">
              {exportHash}
            </code>
            <Button
              onClick={copyHashToClipboard}
              variant="outline"
              size="sm"
              className="text-[8px] h-7 shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="text-[7px] text-green-600/70 mt-1">
            Exported at: {exportedAt ? new Date(exportedAt).toLocaleString() : '-'}
          </div>
        </div>
      )}

      {/* Export History */}
      {history.length > 0 && (
        <div className="border border-slate-500/20 bg-slate-500/5 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10 flex items-center justify-between">
            <div className="text-[8px] font-semibold text-slate-400 uppercase">Export History ({history.length})</div>
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              className="text-[8px] h-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>

          <div className="px-4 py-3 overflow-x-auto">
            <table className="w-full text-[7px]">
              <thead>
                <tr className="border-b border-slate-500/20">
                  <th className="text-left py-1.5 px-2 text-slate-400">Export Hash</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Exported At</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Records</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Total</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Accepted</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, idx) => (
                  <tr key={idx} className="border-b border-slate-500/10 hover:bg-secondary/10">
                    <td className="py-1 px-2 font-mono truncate max-w-32 text-slate-400">{entry.exportHash.substring(0, 16)}...</td>
                    <td className="py-1 px-2 text-slate-400">{new Date(entry.exportedAt).toLocaleString()}</td>
                    <td className="py-1 px-2 font-mono">{entry.recordCount}</td>
                    <td className="py-1 px-2 font-mono">{entry.totalDryRunAttempts}</td>
                    <td className="py-1 px-2 font-mono text-green-600">{entry.acceptedCount}</td>
                    <td className="py-1 px-2 font-mono text-red-600">{entry.rejectedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length === 0 && exportHash === null && (
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
          <div className="text-[8px] text-slate-400">No exports yet. Click "Export JSON" to create the first export.</div>
        </div>
      )}
    </div>
  );
}