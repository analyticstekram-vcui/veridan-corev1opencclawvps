import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Upload } from 'lucide-react';

export default function ProposalReviewPacketVerifier() {
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  const generateSHA256Hash = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleVerifyPacket = async (file) => {
    setVerifyLoading(true);
    setVerifyResult(null);

    try {
      const fileContent = await file.text();
      let packet;

      // Safe JSON parsing
      try {
        packet = JSON.parse(fileContent);
      } catch (err) {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: `JSON parsing failed: ${err.message}`,
        });
        setVerifyLoading(false);
        return;
      }

      // Validate required fields
      const requiredFields = {
        exportedAt: packet.exportedAt,
        packetType: packet.packetType,
        note: packet.note,
        maximumCapability: packet.maximumCapability,
        executionEnabled: packet.executionEnabled,
        openClawConnected: packet.openClawConnected,
        disabledCapabilities: packet.disabledCapabilities,
        summary: packet.summary,
        proposals: packet.proposals,
        auditTrail: packet.auditTrail,
        packetHash: packet.packetHash,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => value === undefined)
        .map(([key, _]) => key);

      if (missingFields.length > 0) {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
        setVerifyLoading(false);
        return;
      }

      // Validate packetType and note
      if (packet.packetType !== 'PROPOSAL_REVIEW_PACKET') {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: `Invalid packetType: expected PROPOSAL_REVIEW_PACKET, got ${packet.packetType}`,
        });
        setVerifyLoading(false);
        return;
      }

      if (!packet.note || !packet.note.includes('Review packet only')) {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: 'Note must include "Review packet only"',
        });
        setVerifyLoading(false);
        return;
      }

      // Safety validation: executionEnabled must be false
      if (packet.executionEnabled !== false) {
        setVerifyResult({
          status: 'TAMPERED',
          message: 'SAFETY VIOLATION: executionEnabled is not false',
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety validation: maximumCapability must be PREVIEW_ONLY
      if (packet.maximumCapability !== 'PREVIEW_ONLY') {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: maximumCapability must be PREVIEW_ONLY, got ${packet.maximumCapability}`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety validation: openClawConnected must indicate read-only
      if (packet.openClawConnected !== 'READ_ONLY_CONNECTOR_ONLY') {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: openClawConnected is not READ_ONLY_CONNECTOR_ONLY`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety validation: disabled capabilities must include critical ones
      const requiredDisabledCaps = [
        'LIVE_EXECUTION',
        'BROWSER_AUTOMATION',
        'TRADING_ORDERS',
        'CREDENTIAL_ENTRY',
        'COMMAND_EXECUTION',
        'PROPOSAL_APPROVAL_EXECUTES',
      ];

      const missingCaps = requiredDisabledCaps.filter(
        cap => !packet.disabledCapabilities.includes(cap)
      );

      if (missingCaps.length > 0) {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: Missing disabled capabilities: ${missingCaps.join(', ')}`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety validation: proposals must not include payloadPreview or raw credential fields
      const unsafeProposals = packet.proposals.filter(p =>
        p.payloadPreview || p.inputText || p.selector
      );

      if (unsafeProposals.length > 0) {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: ${unsafeProposals.length} proposal(s) contain unsafe fields (payloadPreview/inputText/selector)`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety validation: auditTrail must not contain HMAC secrets or raw inputText
      const unsafeAuditEvents = packet.auditTrail.filter(log =>
        (log.message && (log.message.includes('HMAC') || log.message.includes('secret'))) ||
        (log.inputText !== undefined)
      );

      if (unsafeAuditEvents.length > 0) {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: ${unsafeAuditEvents.length} audit event(s) contain unsafe data (HMAC/secrets/inputText)`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Hash verification
      const storedHash = packet.packetHash;
      const packetForHash = { ...packet };
      delete packetForHash.packetHash;

      const jsonStr = JSON.stringify(packetForHash, null, 2);
      const recalculatedHash = await generateSHA256Hash(jsonStr);

      const isValid = storedHash === recalculatedHash;

      setVerifyResult({
        status: isValid ? 'VALID' : 'TAMPERED',
        isValid,
        storedHash,
        recalculatedHash,
        summary: {
          exportedAt: packet.exportedAt,
          packetType: packet.packetType,
          proposalCount: packet.summary?.proposalCount || 0,
          approvedCount: packet.summary?.approvedCount || 0,
          deniedCount: packet.summary?.deniedCount || 0,
          pendingCount: packet.summary?.pendingCount || 0,
          maximumCapability: packet.maximumCapability,
          executionEnabled: packet.executionEnabled,
        },
        message: isValid ? 'Packet is VALID and unmodified.' : 'Packet has been TAMPERED with after export.',
      });
    } catch (err) {
      setVerifyResult({
        status: 'ERROR',
        message: `Error reading file: ${err.message}`,
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      handleVerifyPacket(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Packet Verification</div>
          <div className="text-[13px] font-semibold text-foreground">Verify Proposal Review Packet Integrity</div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ PACKET VERIFICATION ONLY</div>
          <div className="text-[9px] text-destructive/70">
            This does not execute approved proposals. Packet verification only validates integrity and safety constraints.
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <label className="text-[9px] font-semibold text-foreground block uppercase tracking-wider mb-2">
          Upload Packet JSON
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            disabled={verifyLoading}
            className="flex-1 text-[10px] file:px-3 file:py-1.5 file:border file:border-primary/50 file:bg-primary/10 file:text-primary file:hover:bg-primary/20 file:transition-colors file:rounded file:font-semibold file:text-[9px] file:cursor-pointer disabled:opacity-50"
          />
          {uploadedFileName && (
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">{uploadedFileName}</span>
          )}
        </div>
        {verifyLoading && <span className="text-[9px] text-primary/70">Verifying...</span>}
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-primary/30 bg-primary/10 text-primary rounded font-semibold uppercase tracking-wider">
          VERIFY_PACKET
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

      {/* Verification Result */}
      {verifyResult && (
        <div className="space-y-3">
          {verifyResult.status === 'VALID' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-primary/90">
                <div className="font-semibold mb-0.5">✓ Packet is VALID</div>
                <div className="text-[9px] text-primary/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {verifyResult.status === 'TAMPERED' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[10px] text-destructive/90">
                <div className="font-semibold mb-0.5">✗ Packet is TAMPERED or INVALID</div>
                <div className="text-[9px] text-destructive/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {verifyResult.status === 'INVALID_FORMAT' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-500/90">
                <div className="font-semibold mb-0.5">⚠ Invalid Format</div>
                <div className="text-[9px] text-amber-500/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {verifyResult.status === 'ERROR' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[10px] text-destructive/90">
                <div className="font-semibold mb-0.5">Error Reading File</div>
                <div className="text-[9px] text-destructive/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {/* Summary */}
          {verifyResult.summary && (
            <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
              <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Packet Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Exported</div>
                  <div className="text-foreground/70 font-mono text-[8px]">
                    {new Date(verifyResult.summary.exportedAt).toLocaleString()}
                  </div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Type</div>
                  <div className="text-foreground font-semibold text-[9px]">{verifyResult.summary.packetType}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Proposals</div>
                  <div className="text-[14px] font-semibold text-foreground">{verifyResult.summary.proposalCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Approved</div>
                  <div className="text-[14px] font-semibold text-primary">{verifyResult.summary.approvedCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Denied</div>
                  <div className="text-[14px] font-semibold text-destructive">{verifyResult.summary.deniedCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Pending</div>
                  <div className="text-[14px] font-semibold text-amber-500">{verifyResult.summary.pendingCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Max Capability</div>
                  <div className="text-foreground font-semibold text-[9px]">{verifyResult.summary.maximumCapability}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Execution</div>
                  <div className={`font-semibold text-[9px] ${verifyResult.summary.executionEnabled ? 'text-destructive' : 'text-primary'}`}>
                    {verifyResult.summary.executionEnabled ? 'ENABLED' : 'DISABLED'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hash Comparison */}
          {verifyResult.storedHash && (
            <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
              <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Hash Verification</div>
              <div className="space-y-2">
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5 font-semibold">Stored Hash</div>
                  <code className="text-[8px] font-mono text-foreground/70 break-all">{verifyResult.storedHash}</code>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5 font-semibold">Recalculated Hash</div>
                  <code className="text-[8px] font-mono text-foreground/70 break-all">{verifyResult.recalculatedHash}</code>
                </div>
                <div className="border-t border-border/30 pt-2">
                  <div className={`text-[8px] uppercase tracking-widest font-semibold mb-0.5 ${verifyResult.isValid ? 'text-primary' : 'text-destructive'}`}>
                    {verifyResult.isValid ? '✓ Hashes Match' : '✗ Hashes Do Not Match'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Verification-Only Tool</div>
          <div className="text-[9px] text-primary/70">This tool verifies packet integrity and safety constraints only. No execution, no credential access, no data mutation. Baseline non-execution is locked.</div>
        </div>
      </div>
    </div>
  );
}