import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Copy, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProposalReviewPacketExporter() {
  const [loading, setLoading] = useState(false);
  const [packetHash, setPacketHash] = useState(null);
  const [hashCopied, setHashCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [proposalCount, setProposalCount] = useState(25);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('proposalReviewPacketHistory');
      if (stored) {
        const packets = JSON.parse(stored);
        setHistory(packets);
      }
    } catch (err) {
      console.error('Error loading history:', err);
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

  const fetchProposals = async () => {
    try {
      const res = await base44.functions.invoke('openclawProposalManagement', {
        action: 'list',
        limit: proposalCount,
      });
      return res.data?.proposals || [];
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      return [];
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const logs = await base44.entities.CommandAuditTrailPanel.list('-createdAt', 50);
      return logs.filter(log => log.eventType && log.eventType.includes('PROPOSAL'));
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
      return [];
    }
  };

  const exportReviewPacket = async () => {
    setLoading(true);
    try {
      // Fetch all necessary data
      const proposals = await fetchProposals();
      const auditTrail = await fetchAuditTrail();

      // Calculate statistics
      const stats = {
        total: proposals.length,
        draft: proposals.filter(p => p.status === 'DRAFT').length,
        pending: proposals.filter(p => p.status === 'PENDING_APPROVAL').length,
        approved: proposals.filter(p => p.status === 'APPROVED').length,
        denied: proposals.filter(p => p.status === 'DENIED').length,
      };

      // Risk tier distribution
      const riskDistribution = {
        LOW: proposals.filter(p => p.riskTier === 'LOW').length,
        MEDIUM: proposals.filter(p => p.riskTier === 'MEDIUM').length,
      };

      // Policy gate distribution
      const policyDistribution = {
        PASS: proposals.filter(p => p.policyGate === 'PASS').length,
        FAIL: proposals.filter(p => p.policyGate === 'FAIL').length,
      };

      // Build packet (before hashing) - NO SECRETS, NO CREDENTIALS, NO EXECUTION
      const packet = {
        exportedAt: new Date().toISOString(),
        packetType: 'PROPOSAL_REVIEW_PACKET',
        note: 'Review packet only. Approval does not execute. Execution requires explicit future authorization.',
        warning: 'APPROVAL DOES NOT EXECUTE - Proposals remain non-executable until explicit execution phase.',
        
        // Summary data
        summary: {
          proposalCount: stats.total,
          approvedCount: stats.approved,
          deniedCount: stats.denied,
          pendingCount: stats.pending,
          draftCount: stats.draft,
        },

        // Risk and policy
        riskTierDistribution: riskDistribution,
        policyGateDistribution: policyDistribution,

        // Proposals - SAFE FIELDS ONLY (no payloadPreview secrets, no selector internals)
        proposals: proposals.map(p => ({
          requestId: p.requestId,
          proposedBy: p.proposedBy,
          commandType: p.commandType,
          target: p.target,
          url: p.url,
          riskTier: p.riskTier,
          policyGate: p.policyGate,
          status: p.status,
          createdAt: p.createdAt,
          reviewedAt: p.reviewedAt,
          reviewedBy: p.reviewedBy,
          reviewNote: p.reviewNote,
        })),

        // Audit trail (proposal-related events only) - NO SENSITIVE DATA
        auditTrail: auditTrail.map(log => ({
          eventType: log.eventType,
          timestamp: log.timestamp,
          operatorEmail: log.operatorEmail,
          message: log.message,
          severity: log.severity,
        })),

        // Disabled capabilities - LOCKED
        disabledCapabilities: [
          'LIVE_EXECUTION',
          'BROWSER_AUTOMATION',
          'TRADING_ORDERS',
          'CREDENTIAL_ENTRY',
          'COMMAND_EXECUTION',
          'PROPOSAL_APPROVAL_EXECUTES',
        ],

        // Status - ALL EXPLICITLY DISABLED FOR SAFETY
        maximumCapability: 'PREVIEW_ONLY',
        executionEnabled: false,
        openClawConnected: 'READ_ONLY_CONNECTOR_ONLY',
        baselineStatus: 'LOCKED_NON_EXECUTION',
      };

      // Hash the packet (before adding hash to prevent circular hashing)
      const jsonStr = JSON.stringify(packet, null, 2);
      const hash = await generateSHA256Hash(jsonStr);

      // Add hash to packet for verification
      const packetWithHash = {
        ...packet,
        packetHash: hash,
      };

      // Export to file
      const finalJsonStr = JSON.stringify(packetWithHash, null, 2);
      const blob = new Blob([finalJsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposal-review-packet-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save METADATA ONLY to localStorage (NO FULL PACKET)
      const metadata = {
        packetHash: hash,
        exportedAt: new Date().toISOString(),
        proposalCount: stats.total,
        approvedCount: stats.approved,
        deniedCount: stats.denied,
        pendingCount: stats.pending,
        maximumCapability: 'PREVIEW_ONLY',
      };

      const stored = localStorage.getItem('proposalReviewPacketHistory') || '[]';
      const packets = JSON.parse(stored);
      packets.unshift(metadata); // Add to beginning
      const trimmed = packets.slice(0, 10); // Keep only latest 10
      localStorage.setItem('proposalReviewPacketHistory', JSON.stringify(trimmed));

      setPacketHash(hash);
      setHistory(trimmed);
    } catch (err) {
      alert(`Failed to export packet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyHashToClipboard = () => {
    if (packetHash) {
      navigator.clipboard.writeText(packetHash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all packet history from local storage?')) {
      localStorage.removeItem('proposalReviewPacketHistory');
      setHistory([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Proposal Review Packet</div>
          <div className="text-[13px] font-semibold text-foreground">Export Review + Audit Bundle</div>
        </div>
        <button
          type="button"
          onClick={exportReviewPacket}
          disabled={loading}
          className="px-4 py-2 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 font-semibold rounded flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {loading ? 'Generating...' : 'Export Packet'}
        </button>
      </div>

      {/* Warning Banner - CRITICAL */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ PROPOSAL REVIEW PACKET ONLY</div>
          <div className="text-[9px] text-destructive/70">
            This does not execute approved proposals. Proposals remain non-executable. Execution requires explicit future phase authorization.
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <label className="text-[9px] font-semibold text-foreground block uppercase tracking-wider">
          Proposals to Include
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={proposalCount}
            onChange={(e) => setProposalCount(Math.max(1, parseInt(e.target.value) || 25))}
            className="w-16 px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
          />
          <span className="text-[9px] text-muted-foreground">proposals (latest first, max 100)</span>
        </div>
      </div>

      {/* Status Badges - ALL DISABLED */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-primary/30 bg-primary/10 text-primary rounded font-semibold uppercase tracking-wider">
          REVIEW_PACKET
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-destructive/30 bg-destructive/10 text-destructive rounded font-semibold uppercase tracking-wider">
          APPROVAL_DOES_NOT_EXECUTE
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          PREVIEW_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-semibold uppercase tracking-wider">
          EXECUTION_DISABLED
        </span>
      </div>

      {/* Packet Hash Display */}
      {packetHash && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-primary/60 font-semibold">Packet Integrity Hash (SHA-256)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[8px] font-mono bg-secondary/50 border border-border/30 px-2 py-1.5 rounded break-all text-foreground/80">
              {packetHash}
            </code>
            <button
              type="button"
              onClick={copyHashToClipboard}
              className="px-2 py-1.5 text-[8px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded whitespace-nowrap"
            >
              {hashCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-[8px] text-primary/70">Hash verifies packet integrity. If hash changes after export, packet was modified.</div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Packet Export History</div>
            <button
              type="button"
              onClick={clearHistory}
              className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors font-semibold rounded flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="border-b border-border/30">
                <tr className="text-muted-foreground/60 uppercase tracking-widest">
                  <th className="text-left px-2 py-1.5 font-semibold">Exported At</th>
                  <th className="text-center px-2 py-1.5 font-semibold">Total</th>
                  <th className="text-center px-2 py-1.5 font-semibold">Approved</th>
                  <th className="text-center px-2 py-1.5 font-semibold">Denied</th>
                  <th className="text-center px-2 py-1.5 font-semibold">Pending</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Hash (first 16)</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {history.map((packet, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-2 py-1.5 text-foreground/70 font-mono">
                      {new Date(packet.exportedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-center font-semibold text-foreground">{packet.proposalCount}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-primary">{packet.approvedCount}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-destructive">{packet.deniedCount}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-amber-500">{packet.pendingCount}</td>
                    <td className="px-2 py-1.5 text-foreground/60 font-mono">{packet.packetHash.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[8px] text-muted-foreground/60 border-t border-border/30 pt-2">
            Metadata only in localStorage (no full packet content). Latest 10 exports. Each packet has unique SHA-256 hash.
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Review-Only Export</div>
          <div className="text-[9px] text-primary/70">Packet is for governance review and record-keeping only. No execution, no browser automation, no trading, no credential access. Baseline non-execution is locked.</div>
        </div>
      </div>
    </div>
  );
}