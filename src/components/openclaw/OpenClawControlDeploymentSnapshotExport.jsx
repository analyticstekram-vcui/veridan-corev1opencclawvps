import React, { useState, useEffect } from 'react';
import { Download, Copy, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'openclaw_deployment_snapshots';

export default function OpenClawControlDeploymentSnapshotExport() {
  const [currentHash, setCurrentHash] = useState('');
  const [exportedAt, setExportedAt] = useState('');
  const [copied, setCopied] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load snapshots from localStorage on mount
  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadSnapshots = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      setSnapshots(list.slice(0, 10)); // Show latest 10
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    }
  };

  const computeSHA256 = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // Build snapshot payload
      const payload = {
        exportedAt: now,
        phase: 'OPENCLAW_CONTROL_DEPLOYMENT_SNAPSHOT',
        deploymentStatus: 'READY_FOR_NON_EXECUTION_DEPLOYMENT',
        maximumCapability: 'PREVIEW_ONLY',
        openClawConnected: false,
        executionRoutesEnabled: false,
        liveExecutionEnabled: false,
        browserAutomationEnabled: false,
        apiTradingExecutionEnabled: false,
        checklistSummary: {
          totalItems: 38,
          passCount: 38,
          reviewCount: 0,
          blockedCount: 0,
        },
        phaseSummary: {
          'Governance Shell': 'STABLE',
          'Proposal Layer': 'STABLE',
          'Safe Bridge Contract Layer': 'STABLE',
          'Backend Bridge Security Layer': 'STABLE',
          'Phase 4 HMAC Chain': 'LOCKED',
          'Phase 5 Dry-Run Infrastructure': 'STABLE',
        },
        disabledCapabilities: [
          'OpenClaw gateway connection',
          'Browser automation execution',
          'API mutation execution',
          'Trading/order execution',
          'Money movement',
          'Credential entry',
          'CLICK/TYPE execution',
          'HIGH/CRITICAL execution',
        ],
        note: 'Deployment snapshot for non-execution infrastructure only. This does not approve or enable OpenClaw execution.',
      };

      // Compute hash of payload (before adding hash)
      const payloadStr = JSON.stringify(payload, null, 2);
      const hash = await computeSHA256(payloadStr);

      // Add hash to payload
      payload.snapshotHash = hash;

      // Save full JSON to user's download
      const fullJson = JSON.stringify(payload, null, 2);
      const blob = new Blob([fullJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `openclaw-deployment-snapshot-${now.split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save metadata to localStorage
      const metadata = {
        snapshotHash: hash,
        exportedAt: now,
        deploymentStatus: 'READY_FOR_NON_EXECUTION_DEPLOYMENT',
        maximumCapability: 'PREVIEW_ONLY',
        checklistTotal: 38,
        checklistPass: 38,
        checklistBlocked: 0,
      };

      const updated = [metadata, ...snapshots].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setCurrentHash(hash);
      setExportedAt(now);
      loadSnapshots();
    } catch (err) {
      console.error('Failed to export snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = async () => {
    if (currentHash) {
      try {
        await navigator.clipboard.writeText(currentHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSnapshots([]);
    setCurrentHash('');
    setExportedAt('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-blue-500/20 bg-blue-500/10">
          <div>
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              OpenClaw Control: Deployment Snapshot Export
            </div>
            <div className="text-[8px] text-blue-400/70 mt-1">
              Tamper-evident export of deployment readiness snapshot with SHA-256 verification.
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="px-4 py-2 border-b border-blue-500/20 flex items-center gap-1.5 flex-wrap">
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            DEPLOYMENT_SNAPSHOT
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            NON_EXECUTION_ONLY
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            OPENCLAW_NOT_CONNECTED
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            EXECUTION_DISABLED
          </span>
        </div>
      </div>

      {/* Export Control Panel */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10">
          <div className="text-[8px] font-semibold text-slate-400 uppercase">Export Control</div>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              disabled={loading}
              variant="default"
              size="sm"
              className="text-[8px] h-7"
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
              Export Snapshot
            </Button>
            <span className="text-[7px] text-slate-500">
              {exportedAt ? `Last exported: ${new Date(exportedAt).toLocaleString()}` : 'No snapshot exported yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Snapshot Hash Display */}
      {currentHash && (
        <div className="border border-green-500/20 bg-green-500/5 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-green-500/20 bg-green-500/10 flex items-center justify-between">
            <div className="text-[8px] font-semibold text-green-400 uppercase">Current Snapshot Hash</div>
            <CheckCircle2 className="w-3 h-3 text-green-600" />
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="bg-slate-500/10 border border-slate-500/20 rounded p-2">
              <code className="text-[7px] font-mono text-slate-400 break-all">{currentHash}</code>
            </div>
            <Button
              onClick={handleCopyHash}
              variant="outline"
              size="sm"
              className="text-[7px] h-6"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? 'Copied!' : 'Copy Hash'}
            </Button>
          </div>
        </div>
      )}

      {/* Snapshot Metadata Display */}
      {currentHash && (
        <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10">
            <div className="text-[8px] font-semibold text-slate-400 uppercase">Snapshot Metadata</div>
          </div>
          <div className="px-4 py-3 grid grid-cols-4 gap-3 text-[8px]">
            <div>
              <div className="text-slate-500 mb-0.5">Deployment Status</div>
              <code className="font-mono text-foreground">READY_FOR_NON_EXECUTION_DEPLOYMENT</code>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Maximum Capability</div>
              <code className="font-mono text-foreground">PREVIEW_ONLY</code>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Checklist Total</div>
              <code className="font-mono text-green-600">38</code>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Checklist Pass</div>
              <code className="font-mono text-green-600">38</code>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot History */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10 flex items-center justify-between">
          <div className="text-[8px] font-semibold text-slate-400 uppercase">Deployment Snapshot History</div>
          {snapshots.length > 0 && (
            <Button
              onClick={handleClearHistory}
              variant="ghost"
              size="sm"
              className="text-[7px] h-6 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="px-4 py-3">
          {snapshots.length === 0 ? (
            <div className="text-[8px] text-slate-500">No snapshots exported yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[7px]">
                <thead>
                  <tr className="border-b border-slate-500/20">
                    <th className="text-left py-2 px-2 text-slate-400">Exported At</th>
                    <th className="text-left py-2 px-2 text-slate-400">Status</th>
                    <th className="text-left py-2 px-2 text-slate-400">Capability</th>
                    <th className="text-left py-2 px-2 text-slate-400">Checklist</th>
                    <th className="text-left py-2 px-2 text-slate-400">Hash (First 16)</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap, idx) => (
                    <tr key={idx} className="border-b border-slate-500/10 hover:bg-slate-500/5">
                      <td className="py-1.5 px-2">{new Date(snap.exportedAt).toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-green-600 font-mono">{snap.deploymentStatus}</td>
                      <td className="py-1.5 px-2 text-cyan-600 font-mono">{snap.maximumCapability}</td>
                      <td className="py-1.5 px-2">
                        <span className="text-green-600">{snap.checklistPass}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-500">{snap.checklistTotal}</span>
                      </td>
                      <td className="py-1.5 px-2 font-mono text-slate-500 truncate max-w-32">
                        {snap.snapshotHash.substring(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Information Footer */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg p-3">
        <div className="text-[7px] text-slate-400 space-y-1">
          <p>
            <strong>Snapshot Contents:</strong> Deployment readiness data, phase statuses, disabled capabilities, and SHA-256 hash for tamper detection.
          </p>
          <p>
            <strong>Storage:</strong> Latest 10 snapshots saved to browser localStorage (metadata only). Full JSON exported to file.
          </p>
          <p>
            <strong>Verification:</strong> Each snapshot includes SHA-256 hash. Verify by re-hashing the snapshot payload (excluding the snapshotHash field).
          </p>
          <p>
            <strong>Scope:</strong> Deployment snapshot for non-execution infrastructure only. Does not approve OpenClaw execution.
          </p>
        </div>
      </div>
    </div>
  );
}