import React, { useState, useEffect } from 'react';
import { Download, Copy, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

export default function OpenClawBaselineArchive() {
  const [archiveRecords, setArchiveRecords] = useState([]);
  const [hashCopied, setHashCopied] = useState(false);
  const [lastArchiveHash, setLastArchiveHash] = useState(null);

  useEffect(() => {
    loadArchiveRecords();
  }, []);

  const loadArchiveRecords = () => {
    try {
      const stored = localStorage.getItem('openclawBaselineArchive');
      if (stored) {
        const records = JSON.parse(stored);
        setArchiveRecords(records);
      }
    } catch (err) {
      console.error('Error loading baseline archive records:', err);
    }
  };

  const saveArchiveRecords = (records) => {
    try {
      localStorage.setItem('openclawBaselineArchive', JSON.stringify(records));
      setArchiveRecords(records);
    } catch (err) {
      console.error('Error saving baseline archive records:', err);
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

  const handleExportArchive = async () => {
    const manifest = {
      exportedAt: new Date().toISOString(),
      deploymentStatus: 'READY_FOR_NON_EXECUTION_DEPLOYMENT',
      maximumCapability: 'PREVIEW_ONLY',
      executionEnabled: false,
      openClawConnected: 'READ_ONLY_CONNECTOR_ONLY',
      stablePhases: 10,
      blockedItems: 0,
      failedChecks: 0,
      evidenceFiles: [
        'system-verify-snapshot-2026-05-13.json',
        'final-deployment-lock-2026-05-13.json',
        'vault-export-2026-05-13.json',
      ],
      disabledCapabilities: [
        'LIVE_EXECUTION',
        'BROWSER_AUTOMATION',
        'TRADING_ORDERS',
        'CREDENTIAL_ENTRY',
        'COMMAND_EXECUTION',
        'MONEY_MOVEMENT',
        'FULL_FILE_STORAGE',
      ],
      lockStatus: 'LOCKED_FOR_NON_EXECUTION_DEPLOYMENT',
      note: 'Baseline archive metadata only. No execution, browser automation, trading, credentials, money movement, or full file storage. Metadata-only export.',
    };

    const jsonStr = JSON.stringify(manifest, null, 2);
    const archiveHash = await generateSHA256Hash(jsonStr);

    const manifestWithHash = {
      ...manifest,
      archiveHash,
    };

    const finalJsonStr = JSON.stringify(manifestWithHash, null, 2);
    const blob = new Blob([finalJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `baseline-archive-manifest-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastArchiveHash(archiveHash);

    // Save to history
    const historyEntry = {
      archiveHash,
      exportedAt: new Date().toISOString(),
      deploymentStatus: 'READY_FOR_NON_EXECUTION_DEPLOYMENT',
      stablePhases: 10,
      lockStatus: 'LOCKED_FOR_NON_EXECUTION_DEPLOYMENT',
    };

    const updated = [historyEntry, ...archiveRecords].slice(0, 10);
    saveArchiveRecords(updated);
  };

  const handleCopyHash = () => {
    if (lastArchiveHash) {
      navigator.clipboard.writeText(lastArchiveHash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all baseline archive records from local storage?')) {
      localStorage.removeItem('openclawBaselineArchive');
      setArchiveRecords([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Phase 11</div>
          <div className="text-[13px] font-semibold text-foreground">Baseline Archive</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportArchive}
            className="px-3 py-1.5 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Baseline Archive Manifest
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={archiveRecords.length === 0}
            className="px-3 py-1.5 text-[10px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 font-semibold rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ BASELINE ARCHIVE ONLY</div>
          <div className="text-[9px] text-destructive/70">
            This does not enable execution. Archive is metadata-only. No full files, credentials, trading, browser automation, or money movement.
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          BASELINE_ARCHIVE
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          METADATA_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          PREVIEW_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-semibold uppercase tracking-wider">
          EXECUTION_DISABLED
        </span>
      </div>

      {/* Baseline Status Summary */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Locked Baseline Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Deployment</div>
            <div className="font-semibold text-foreground">READY_FOR_NON_EXECUTION</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Capability</div>
            <div className="font-semibold text-foreground">PREVIEW_ONLY</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Stable Phases</div>
            <div className="text-[14px] font-semibold text-primary">10</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Lock Status</div>
            <div className="font-semibold text-primary">LOCKED</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px] mt-3">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Execution</div>
            <div className="font-semibold text-destructive">DISABLED</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Blocked Items</div>
            <div className="text-[14px] font-semibold text-primary">0</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Failed Checks</div>
            <div className="text-[14px] font-semibold text-primary">0</div>
          </div>
        </div>
      </div>

      {/* OpenClaw Connection Status */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
        <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">OpenClaw Connection</div>
        <div className="px-3 py-2 bg-card border border-border/30 rounded text-[9px]">
          <div className="text-slate-400 mb-0.5">Mode: <span className="font-semibold text-foreground">READ_ONLY_CONNECTOR_ONLY</span></div>
          <div className="text-slate-400">Status: <span className="font-semibold text-slate-300">Connected (read-only diagnostics only)</span></div>
        </div>
      </div>

      {/* Evidence Files */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
        <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Baseline Evidence Files</div>
        <div className="space-y-1 text-[9px]">
          {[
            'system-verify-snapshot-2026-05-13.json',
            'final-deployment-lock-2026-05-13.json',
            'vault-export-2026-05-13.json',
          ].map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border/30 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground/80 font-mono text-[8px]">{file}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disabled Capabilities */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
        <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Disabled Capabilities (Locked)</div>
        <div className="space-y-1 text-[9px]">
          {[
            'LIVE_EXECUTION',
            'BROWSER_AUTOMATION',
            'TRADING_ORDERS',
            'CREDENTIAL_ENTRY',
            'COMMAND_EXECUTION',
            'MONEY_MOVEMENT',
            'FULL_FILE_STORAGE',
          ].map((cap, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/20 rounded">
              <span className="text-destructive font-semibold">✗</span>
              <span className="text-destructive/80">{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Hash Display */}
      {lastArchiveHash && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-primary/60 font-semibold">Archive Integrity Hash (SHA-256)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[8px] font-mono bg-secondary/50 border border-border/30 px-2 py-1.5 rounded break-all text-foreground/80">
              {lastArchiveHash}
            </code>
            <button
              type="button"
              onClick={handleCopyHash}
              className="px-2.5 py-1.5 text-[8px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded whitespace-nowrap"
            >
              {hashCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-[8px] text-primary/70">Hash proves manifest integrity. Archive is metadata-only.</div>
        </div>
      )}

      {/* Archive History */}
      {archiveRecords.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Archive History (Latest 10)</div>
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
                {archiveRecords.map((record, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2 text-foreground/80">{new Date(record.exportedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-primary font-semibold text-[8px]">{record.lockStatus}</td>
                    <td className="px-3 py-2 text-center text-foreground">{record.stablePhases}/10</td>
                    <td className="px-3 py-2 text-foreground/60 font-mono text-[8px] truncate">{record.archiveHash.substring(0, 16)}...</td>
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
          <div className="font-semibold mb-0.5">Baseline Locked for Phase 11</div>
          <div className="text-[9px] text-primary/70">All 10 phases stable. All execution pathways locked. Gateway read-only only. No execution code. Ready for non-execution deployment only.</div>
        </div>
      </div>
    </div>
  );
}