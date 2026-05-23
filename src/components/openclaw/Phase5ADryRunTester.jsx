import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Zap, CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Phase5ApprovalBindingTestCases from './Phase5ApprovalBindingTestCases';

export default function Phase5ADryRunTester({ signedRequest, proposalId, operatorId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [signerStatus, setSignerStatus] = useState(null);

  if (!signedRequest) {
    return (
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 text-[9px] text-amber-600">
        ⚠️ No bridge request available. Use Phase 4 to build a bridge request first.
      </div>
    );
  }

  // HTTPS normalization helper
  const normalizeHttpsTarget = (value) => {
    if (!value) return "";
    const raw = String(value).trim();

    if (raw.startsWith("https://")) return raw;
    if (raw.startsWith("http://")) return raw.replace("http://", "https://");
    if (raw.startsWith("/")) return `https://openclaw.veridancore.com${raw}`;

    return `https://${raw}`;
  };

  // Prerequisites check with HTTPS normalization and expiration
  const hasProposalId = signedRequest?.proposalId && typeof signedRequest.proposalId === 'string' && signedRequest.proposalId.trim().length > 0;
  const rawTarget = signedRequest?.targetUrl || signedRequest?.requestedTarget || signedRequest?.target || signedRequest?.url || "";
  const normalizedTarget = normalizeHttpsTarget(rawTarget);
  const hasValidHttpsTarget = normalizedTarget && normalizedTarget.startsWith("https://");
  const hasExpirationAt = signedRequest?.expirationAt && typeof signedRequest.expirationAt === 'string' && signedRequest.expirationAt.trim().length > 0;

  // Simple deterministic hash helper for previewHash generation
  const generatePreviewHash = (obj) => {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash-${Math.abs(hash).toString(36)}`;
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSignerStatus(null);

    // Check prerequisite before calling signer
    if (!hasProposalId) {
      setError('Missing proposalId: create or select an APPROVED OpenClawProposal before running Phase 5.');
      setLoading(false);
      return;
    }

    try {
      // Create timestamp pair for submission and expiration
      const submittedAt = new Date().toISOString();
      const expirationAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Build full bridgeRequest with all required Phase 5 fields and normalized HTTPS targets
      const fullBridgeRequest = {
        ...signedRequest,
        targetUrl: normalizedTarget,
        requestedTarget: normalizedTarget,
        expirationAt,
        dryRun: true,
        liveExecution: false,
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        approvalStatus: 'APPROVED',
      };

      // Generate previewHash if not present
      const previewHash = signedRequest.previewHash || generatePreviewHash(fullBridgeRequest);

      // Step 1: Send bridge request to openclawBridgeSigner with complete payload
      const signerPayload = {
        bridgeRequest: fullBridgeRequest,
        previewHash,
        operatorId: fullBridgeRequest.operatorId || operatorId,
        submittedAt,
        expirationAt,
      };

      const signerResponse = await base44.functions.invoke('openclawBridgeSigner', signerPayload);
      const signerData = signerResponse.data || {};
      
      setSignerStatus({
        success: signerData.signingAllowed,
        signature: signerData.signature,
        signedAt: signerData.signedAt,
        message: signerData.signingAllowed ? 'Signature generated successfully' : signerData.rejectedReason || 'Signing rejected',
      });

      // If signer failed, stop here
      if (!signerData.signingAllowed) {
        setError(`Signer rejected: ${signerData.rejectedReason || 'Unknown reason'}`);
        setLoading(false);
        return;
      }

      // Step 2: Send signed packet to openclawBridgePreview using signer output
      const previewPayload = {
        bridgeRequest: fullBridgeRequest,
        previewHash,
        operatorId: fullBridgeRequest.operatorId || operatorId,
        submittedAt,
        expirationAt,
        signature: signerData.signature,
        signingVersion: 'OPENCLAW_BRIDGE_V1',
        signedAt: signerData.signedAt,
      };

      const previewResponse = await base44.functions.invoke('openclawBridgePreview', previewPayload);
      setResult(previewResponse.data);
    } catch (err) {
      // Try to extract backend error details from response
      let errorMsg = err.message || 'Failed to invoke signer or preview';
      if (err.response?.data?.rejectedReason) {
        errorMsg = `Backend Error: ${err.response.data.rejectedReason}`;
      } else if (err.response?.data?.message) {
        errorMsg = `Backend Error: ${err.response.data.message}`;
      } else if (err.response?.statusText) {
        errorMsg = `Backend Error (${err.response.status}): ${err.response.statusText}`;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-500/20 bg-amber-500/10">
        <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Phase 5A: Dry-Run Bridge Tester</div>
        <div className="text-[8px] text-amber-500/70 mt-1">Test dry-run bridge preview creation without executing actions.</div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Approval Binding Test Cases */}
        <Phase5ApprovalBindingTestCases />

        {/* Prerequisites Check */}
        <div className="bg-card border border-border/40 rounded p-3 space-y-2">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">Phase 5A Prerequisites</div>
          <div className={`flex items-center gap-2 text-[8px] ${hasProposalId ? 'text-primary' : 'text-destructive'}`}>
            {hasProposalId ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>proposalId: {hasProposalId ? 'PRESENT' : 'MISSING'}</span>
          </div>
          <div className={`flex items-center gap-2 text-[8px] ${hasValidHttpsTarget ? 'text-primary' : 'text-destructive'}`}>
            {hasValidHttpsTarget ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>targetUrl: {hasValidHttpsTarget ? 'HTTPS PRESENT' : 'MISSING/INVALID HTTPS'}</span>
          </div>
          <div className={`flex items-center gap-2 text-[8px] ${hasValidHttpsTarget ? 'text-primary' : 'text-destructive'}`}>
            {hasValidHttpsTarget ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>requestedTarget: {hasValidHttpsTarget ? 'HTTPS PRESENT' : 'MISSING/INVALID HTTPS'}</span>
          </div>
          <div className={`flex items-center gap-2 text-[8px] ${hasExpirationAt ? 'text-primary' : 'text-destructive'}`}>
            {hasExpirationAt ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>expirationAt: {hasExpirationAt ? 'PRESENT' : 'MISSING'}</span>
          </div>
          <div className="text-[7px] text-slate-500">
            Requires an APPROVED OpenClawProposal with matching commandType, targetUrl, riskTier, and operatorId.
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] text-amber-600">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Dry-run preview only. No OpenClaw action is executed.</span>
        </div>

        {/* Test Button */}
        <Button
          onClick={handleTest}
          disabled={loading || !hasProposalId || !hasValidHttpsTarget || !hasExpirationAt}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
              Testing (Signer → Preview)...
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 mr-2" />
              Sign & Submit to Dry-Run Bridge
            </>
          )}
        </Button>

        {/* Signer Status */}
        {signerStatus && (
          <div className={`border rounded p-3 text-[8px] ${
            signerStatus.success
              ? 'bg-primary/10 border-primary/30'
              : 'bg-destructive/10 border-destructive/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {signerStatus.success ? (
                <CheckCircle2 className="w-3 h-3 text-primary" />
              ) : (
                <XCircle className="w-3 h-3 text-destructive" />
              )}
              <span className={signerStatus.success ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                {signerStatus.success ? 'SIGNER: SUCCESS' : 'SIGNER: FAILED'}
              </span>
            </div>
            <div className="text-[7px] text-slate-400">{signerStatus.message}</div>
            {signerStatus.signedAt && (
              <div className="text-[7px] text-slate-500 mt-1">Signed At: {new Date(signerStatus.signedAt).toLocaleTimeString()}</div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-[8px] text-destructive">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className={`border rounded p-3 text-[8px] ${
              result.acceptedForDryRun
                ? 'bg-primary/10 border-primary/30'
                : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.acceptedForDryRun ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={result.acceptedForDryRun ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                  PREVIEW: {result.acceptedForDryRun ? 'ACCEPTED FOR DRY-RUN' : 'REJECTED'}
                </span>
              </div>

              <div className="space-y-1 text-slate-400">
                <div>Dry-Run ID: <span className="text-foreground font-mono text-[7px]">{result.dryRunId}</span></div>
                {result.requestId && <div>Request ID: <span className="text-foreground font-mono text-[7px]">{result.requestId}</span></div>}
                <div>Bridge Mode: <span className="text-foreground font-semibold">{result.bridgeMode}</span></div>
                <div>Execution Status: <span className="text-foreground font-semibold">{result.executionStatus}</span></div>
                {result.rejectedReason && <div>Reason: <span className="text-foreground">{result.rejectedReason}</span></div>}
              </div>

              {/* Validation Results */}
              <div className="mt-2 pt-2 border-t border-current/20 space-y-0.5">
                <div className="flex items-center gap-2">
                  {result.policyGateResult === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                  <span>Policy Gate: {result.policyGateResult}</span>
                  {result.policyGateMessages?.length > 0 && <span className="text-[7px]">({result.policyGateMessages.join(', ')})</span>}
                </div>
                <div className="flex items-center gap-2">
                  {result.replayCheckResult === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                  <span>Replay Check: {result.replayCheckResult}</span>
                  {result.replayCheckMessages?.length > 0 && <span className="text-[7px]">({result.replayCheckMessages.join(', ')})</span>}
                </div>
                <div className="flex items-center gap-2">
                  {result.signatureCheckResult === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                  <span>Signature Check: {result.signatureCheckResult}</span>
                  {result.signatureCheckMessages?.length > 0 && <span className="text-[7px]">({result.signatureCheckMessages.join(', ')})</span>}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-current/20 text-[7px] text-slate-400 italic">{result.note}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}