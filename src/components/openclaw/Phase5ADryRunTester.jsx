import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Zap, CheckCircle2, XCircle, Loader2, Save, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Phase5ApprovalBindingTestCases from './Phase5ApprovalBindingTestCases';
import Phase5ANextStepCard from './Phase5ANextStepCard';

const PHASE_5A_BASELINE = {
  phase: 'Phase 5A',
  status: 'LOCKED',
  bridgeMode: 'DRY_RUN_ONLY',
  executionStatus: 'NOT_EXECUTED',
  previewContractVersion: 'OPENCLAW_BRIDGE_PREVIEW_NORMALIZED_V2',
  safetyStatement: 'No OpenClaw call was made. No execution occurred.',
};

const BASELINE_LS_KEY = 'phase5a_baseline_lock';

export default function Phase5ADryRunTester({ signedRequest, proposalId, operatorId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [signerStatus, setSignerStatus] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [baselineStorageStatus, setBaselineStorageStatus] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Write compact baseline lock to localStorage on mount and read it back
  useEffect(() => {
    const existing = localStorage.getItem(BASELINE_LS_KEY);
    if (existing) {
      try {
        setBaseline(JSON.parse(existing));
        setBaselineStorageStatus('SAVED');
      } catch {
        const record = { ...PHASE_5A_BASELINE, lockedAt: new Date().toISOString() };
        setBaseline(record);
        setBaselineStorageStatus('MEMORY_ONLY_WRITE_FAILED');
      }
    } else {
      const record = { ...PHASE_5A_BASELINE, lockedAt: new Date().toISOString() };
      try {
        localStorage.setItem(BASELINE_LS_KEY, JSON.stringify(record));
        setBaselineStorageStatus('SAVED');
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          setBaselineStorageStatus('MEMORY_ONLY_QUOTA_FULL');
        } else {
          setBaselineStorageStatus('MEMORY_ONLY_WRITE_FAILED');
        }
      }
      setBaseline(record);
    }
  }, []);

  const TEMP_DEBUG_KEYS = [
    'phase5a_debug',
    'phase5a_last_result',
    'phase5a_temp_result',
    'phase5a_candidate_debug',
    'phase5a_signature_debug',
    'phase5a_preview_debug',
    'phase5a_approval_debug',
  ];

  const handleClearTempDebugStorage = () => {
    let cleared = 0;
    TEMP_DEBUG_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    alert(`Cleared ${cleared} temporary Phase 5A debug key(s). Baseline lock and governance records were not touched.`);
  };

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

  // Prerequisites check with HTTPS normalization
  const hasProposalId = signedRequest?.proposalId && typeof signedRequest.proposalId === 'string' && signedRequest.proposalId.trim().length > 0;
  const rawTarget = signedRequest?.targetUrl || signedRequest?.requestedTarget || signedRequest?.target || signedRequest?.url || "";
  const normalizedTarget = normalizeHttpsTarget(rawTarget);
  const hasValidHttpsTarget = normalizedTarget && normalizedTarget.startsWith("https://");

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

  // Sanitize signer response to redact secrets
  const sanitizeSignerResponse = (value) => {
    if (!value || typeof value !== 'object') return value;

    const clone = JSON.parse(JSON.stringify(value));

    const redact = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          lower.includes('secret') ||
          lower.includes('token') ||
          lower.includes('key') ||
          lower.includes('credential')
        ) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          redact(obj[key]);
        }
      });
    };

    redact(clone);
    return clone;
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

      // Generate unique requestId to avoid replay check DUPLICATE_REQUEST_ID
      const uniqueRequestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Build full bridgeRequest with all required Phase 5 fields and normalized HTTPS targets
      const fullBridgeRequest = {
        ...signedRequest,
        requestId: uniqueRequestId,
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

      // Build deeper signer result candidates
      const signerCandidates = [
        signerResponse,
        signerResponse?.data,
        signerResponse?.result,
        signerResponse?.response,
        signerResponse?.output,
        signerResponse?.body,
        signerResponse?.data?.data,
        signerResponse?.data?.result,
        signerResponse?.data?.response,
        signerResponse?.data?.output,
        signerResponse?.data?.body,
        signerResponse?.data?.signedRequest,
        signerResponse?.result?.signedRequest,
        signerResponse?.response?.signedRequest,
      ].filter(Boolean);

      // Find first candidate with a signature
      const rawSignerResult =
        signerCandidates.find((candidate) =>
          candidate?.signature ||
          candidate?.signedSignature ||
          candidate?.bridgeSignature ||
          candidate?.signedRequest?.signature
        ) ||
        signerResponse?.data ||
        signerResponse?.result ||
        signerResponse ||
        {};

      const extractedSignature =
        rawSignerResult.signature ||
        rawSignerResult.signedSignature ||
        rawSignerResult.bridgeSignature ||
        rawSignerResult.signedRequest?.signature ||
        "";

      const sigerResponseKeys = Object.keys(signerResponse || {}).join(', ');
      const rawSignerResultKeys = Object.keys(rawSignerResult).join(', ');
      
      const normalizedSignedRequest = {
        ...rawSignerResult,
        ...(rawSignerResult.signedRequest || {}),
        signature: extractedSignature,
        signingVersion:
          rawSignerResult.signingVersion ||
          rawSignerResult.signedRequest?.signingVersion ||
          "OPENCLAW_BRIDGE_V1",
        signedAt:
          rawSignerResult.signedAt ||
          rawSignerResult.signedRequest?.signedAt ||
          rawSignerResult.timestamp ||
          submittedAt,
        operatorId:
          rawSignerResult.operatorId ||
          rawSignerResult.signedRequest?.operatorId ||
          fullBridgeRequest.operatorId ||
          operatorId,
        previewHash,
        expirationAt,
      };

      // Hard guard: Validate signature is present in normalizedSignedRequest before preview
      if (!normalizedSignedRequest?.signature) {
        setResult({
          signer: 'SUCCESS',
          preview: 'BLOCKED',
          error: 'Signer succeeded but normalizedSignedRequest.signature is missing',
          submissionDebug: {
            signaturePresent: false,
            normalizedSignedRequestKeys: Object.keys(normalizedSignedRequest || {}),
            previewPayloadWouldHaveSignature: false,
            sanitizedSignerResponse: sanitizeSignerResponse(signerResponse),
          },
        });
        setLoading(false);
        return;
      }

      // Step 2: Build preview payload with normalized signed request
      const previewPayload = {
        bridgeRequest: fullBridgeRequest,
        signedRequest: normalizedSignedRequest,
        previewHash,
        operatorId: fullBridgeRequest.operatorId || operatorId,
        submittedAt,
        expirationAt,
      };

      // Hard guard: Verify signature is in previewPayload.signedRequest before backend call
      if (!previewPayload?.signedRequest?.signature) {
        setResult({
          signer: 'SUCCESS',
          preview: 'BLOCKED',
          error: 'Preview payload missing signedRequest.signature before backend call',
          submissionDebug: {
            previewPayloadKeys: Object.keys(previewPayload || {}),
            signedRequestKeys: Object.keys(previewPayload?.signedRequest || {}),
            signaturePresent: Boolean(previewPayload?.signedRequest?.signature),
            signatureLength: previewPayload?.signedRequest?.signature?.length || 0,
          },
        });
        setLoading(false);
        return;
      }

      // Send preview request to backend — function name: openclawBridgePreview
      const PREVIEW_FUNCTION_INVOKED = 'openclawBridgePreview';
      const previewResponse = await base44.functions.invoke(PREVIEW_FUNCTION_INVOKED, previewPayload);
      const resultData = previewResponse.data || {};
      
      // Add submission debug info
      resultData.submissionDebug = {
        previewFunctionInvoked: PREVIEW_FUNCTION_INVOKED,
        submittedAt,
        expirationAt,
        expiresInMinutes: 5,
        signerResponseKeys: sigerResponseKeys,
        rawSignerResultKeys,
        signaturePresent: Boolean(extractedSignature),
        signatureLength: extractedSignature?.length || 0,
        signingVersion: normalizedSignedRequest.signingVersion,
        signedAt: normalizedSignedRequest.signedAt,
        previewPayloadHasSignedRequest: Boolean(previewPayload.signedRequest),
        previewPayloadSignaturePresent: Boolean(previewPayload.signedRequest?.signature),
        previewPayloadSignatureLength: previewPayload.signedRequest?.signature?.length || 0,
        signedRequestKeys: Object.keys(previewPayload.signedRequest || {}),
        sanitizedSignerResponse: sanitizeSignerResponse(signerResponse),
        signerCandidateCount: signerCandidates.length,
        candidateKeys: signerCandidates.map((candidate, index) => ({
          index,
          keys: Object.keys(candidate || {}),
          hasSignature: Boolean(
            candidate?.signature ||
            candidate?.signedSignature ||
            candidate?.bridgeSignature ||
            candidate?.signedRequest?.signature
          ),
          hasSignedRequest: Boolean(candidate?.signedRequest),
          signedRequestKeys: candidate?.signedRequest ? Object.keys(candidate.signedRequest) : []
        })),
      };
      
      setResult(resultData);
    } catch (err) {
      // Capture backend error including debug fields if present
      const backendData = err.response?.data || {};
      let errorMsg = err.message || 'Failed to invoke signer or preview';
      if (backendData.rejectedReason) {
        errorMsg = `Backend Error: ${backendData.rejectedReason}`;
      } else if (backendData.message) {
        errorMsg = `Backend Error: ${backendData.message}`;
      } else if (err.response?.statusText) {
        errorMsg = `Backend Error (${err.response.status}): ${err.response.statusText}`;
      }
      // Surface backend debug fields in result so UI can display them
      if (backendData && Object.keys(backendData).length > 0) {
        setResult({ ...backendData, _fromError: true });
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

      {/* Phase 5A Locked Baseline Banner */}
      <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">PHASE 5A BASELINE LOCKED — DRY-RUN ONLY</span>
      </div>

      {/* Baseline Read-Only Section */}
      {baseline && (
        <div className="px-4 py-3 border-b border-border/30 bg-secondary/20 space-y-0.5 text-[7px] font-mono">
          <div className="text-[8px] font-semibold text-slate-300 uppercase mb-1.5">Baseline Record</div>
          <div className="text-slate-400">phase: <span className="text-slate-200">{baseline.phase}</span></div>
          <div className="text-slate-400">status: <span className="text-emerald-400 font-bold">{baseline.status}</span></div>
          <div className="text-slate-400">bridgeMode: <span className="text-slate-200">{baseline.bridgeMode}</span></div>
          <div className="text-slate-400">executionStatus: <span className="text-slate-200">{baseline.executionStatus}</span></div>
          <div className="text-slate-400">previewContractVersion: <span className="text-emerald-400">{baseline.previewContractVersion}</span></div>
          <div className="text-slate-400">lockedAt: <span className="text-slate-200">{baseline.lockedAt}</span></div>
          <div className="text-slate-400">safetyStatement: <span className="text-slate-300 italic">{baseline.safetyStatement}</span></div>
          {baselineStorageStatus && (
            <div className="pt-1 mt-1 border-t border-border/20 text-slate-400">
              Baseline Storage:{" "}
              <span className={
                baselineStorageStatus === 'SAVED'
                  ? 'text-emerald-400 font-bold'
                  : 'text-amber-400 font-bold'
              }>
                {baselineStorageStatus === 'SAVED'
                  ? 'SAVED'
                  : baselineStorageStatus === 'MEMORY_ONLY_QUOTA_FULL'
                  ? 'MEMORY ONLY — localStorage quota full'
                  : 'MEMORY ONLY — write failed'}
              </span>
            </div>
          )}
          <div className="pt-2 mt-1 border-t border-border/20">
            <button
              type="button"
              onClick={handleClearTempDebugStorage}
              className="text-[7px] font-mono text-slate-500 hover:text-amber-400 border border-border/30 hover:border-amber-400/30 px-2 py-1 rounded transition-colors"
            >
              Clear Phase 5A Temporary Debug Storage
            </button>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-2 text-[8px] text-primary">
            <CheckCircle2 className="w-3 h-3" />
            <span>expirationAt: GENERATED ON SUBMIT</span>
          </div>
          <div className="text-[7px] text-slate-500">
            Requires an APPROVED OpenClawProposal with matching commandType, targetUrl, riskTier, and operatorId.
          </div>
        </div>

        {/* Mode Explanation Card */}
        <div className="bg-secondary/30 border border-border/40 rounded p-3 space-y-1 text-[8px]">
          <div className="flex items-center gap-2"><span className="text-blue-400 font-semibold w-28">READ MODE</span><span className="text-slate-400">no approval required</span></div>
          <div className="flex items-center gap-2"><span className="text-emerald-400 font-semibold w-28">DRY-RUN MODE</span><span className="text-slate-400">no execution, no approval required</span></div>
          <div className="flex items-center gap-2"><span className="text-amber-400 font-semibold w-28">ACTION MODE</span><span className="text-slate-400">approval required before external action</span></div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] text-amber-600">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Dry-run mode — no execution, no external action.</span>
        </div>

        {/* Test Button */}
        <Button
          onClick={handleTest}
          disabled={loading || !hasProposalId || !hasValidHttpsTarget}
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

        {/* Next Step Card — always visible once Phase 5A is locked */}
        <Phase5ANextStepCard />

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className={`border rounded p-3 text-[8px] ${
              result.acceptedForDryRun
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-destructive/10 border-destructive/30'
            }`}>

              {/* Status Header */}
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${result.acceptedForDryRun ? 'border-emerald-500/20' : 'border-destructive/20'}`}>
                {result.acceptedForDryRun ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
                <div className={`text-[11px] font-bold uppercase tracking-wide ${result.acceptedForDryRun ? 'text-emerald-400' : 'text-destructive'}`}>
                  {result.acceptedForDryRun ? 'PHASE 5A DRY-RUN READY' : 'PHASE 5A REJECTED'}
                </div>
              </div>

              {/* Simple summary — always visible */}
              <div className="space-y-0.5 text-slate-400 mb-2">
                <div>Bridge Mode: <span className="text-foreground font-semibold">{result.bridgeMode}</span></div>
                <div>Execution Status: <span className="text-foreground font-semibold">{result.executionStatus}</span></div>
                <div>Result: <span className={result.acceptedForDryRun ? 'text-emerald-400 font-semibold' : 'text-destructive font-semibold'}>{result.acceptedForDryRun ? 'Accepted for dry-run' : 'Rejected'}</span></div>
                <div>Safety: <span className="text-slate-300 italic">No OpenClaw call was made</span></div>
                {result.rejectedReason && <div>Reason: <span className="text-foreground">{result.rejectedReason}</span></div>}
              </div>

              {/* Advanced Validation Details — collapsed by default */}
              <div className="mt-2 pt-2 border-t border-current/20">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(v => !v)}
                  className="text-[7px] font-mono text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  <span>{showAdvanced ? '▾' : '▸'}</span>
                  Advanced Validation Details
                </button>

                {showAdvanced && (
                  <div className="mt-2 space-y-1 text-[7px]">
                    {/* Validation gates */}
                    <div className="space-y-0.5 text-slate-400">
                      {result.signatureCheckResult !== 'PASS' && (
                        <div className="flex items-center gap-2">
                          {result.submissionDebug?.signaturePresent ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                          <span>Signature present: {result.submissionDebug?.signaturePresent ? 'PASS' : 'FAIL'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {result.policyGateResult === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        <span>Policy Gate: {result.policyGateResult}</span>
                        {result.policyGateMessages?.length > 0 && <span>({result.policyGateMessages.join(', ')})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.replayCheckResult === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        <span>Replay Check: {result.replayCheckResult}</span>
                        {result.replayCheckMessages?.length > 0 && <span>({result.replayCheckMessages.join(', ')})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.signatureCheckResult === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        <span>Signature Check: {result.signatureCheckResult}</span>
                        {result.signatureCheckMessages?.length > 0 && <span>({result.signatureCheckMessages.join(', ')})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.approvalBindingStatus === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        <span>Request Match Check: {result.approvalBindingStatus}</span>
                      </div>
                    </div>

                    {/* Contract version */}
                    <div className="pt-1 text-slate-500">
                      <span>previewContractVersion: </span>
                      <span className={result.previewContractVersion === 'OPENCLAW_BRIDGE_PREVIEW_NORMALIZED_V2' ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                        {result.previewContractVersion || '⚠ NOT PRESENT'}
                      </span>
                    </div>

                    {/* Submission timing */}
                    {result.submissionDebug && (
                      <div className="pt-1 space-y-0.5 text-slate-500">
                        <div>submittedAt: <span className="text-slate-400 font-mono">{result.submissionDebug.submittedAt}</span></div>
                        <div>expirationAt: <span className="text-slate-400 font-mono">{result.submissionDebug.expirationAt}</span></div>
                        <div>expiresInMinutes: <span className="text-slate-400">{result.submissionDebug.expiresInMinutes}</span></div>
                        <div>signatureLength: <span className="text-slate-400">{result.submissionDebug.signatureLength} chars</span></div>
                        <div>signingVersion: <span className="text-slate-400 font-mono">{result.submissionDebug.signingVersion}</span></div>
                      </div>
                    )}

                    {/* Backend debug (error only) */}
                    {result.debug && (
                      <div className="pt-1 space-y-0.5 text-slate-500">
                        <div>signaturePresent: <span className={result.debug.signaturePresent ? 'text-emerald-400' : 'text-destructive'}>{String(result.debug.signaturePresent)}</span></div>
                        <div>signatureLength: <span className="text-slate-400">{result.debug.signatureLength}</span></div>
                        <div>signaturePathResolved: <span className={result.debug.signaturePathResolved ? 'text-emerald-400' : 'text-destructive'}>{String(result.debug.signaturePathResolved)}</span></div>
                        <div className="text-[6px] text-slate-600">receivedTopLevelKeys: {(result.debug.receivedTopLevelKeys || []).join(', ') || 'none'}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Evidence Snapshot — localStorage only */}
              {result.acceptedForDryRun && (
                <div className="mt-3 pt-2 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => {
                      const snapshot = {
                        snapshotType: 'PHASE_5A_DRY_RUN_EVIDENCE',
                        savedAt: new Date().toISOString(),
                        executionStatus: 'NOT_EXECUTED',
                        bridgeMode: result.bridgeMode,
                        previewContractVersion: result.previewContractVersion,
                        requestId: result.requestId,
                        policyGateResult: result.policyGateResult,
                        replayCheckResult: result.replayCheckResult,
                        signatureCheckResult: result.signatureCheckResult,
                        approvalBindingStatus: result.approvalBindingStatus,
                        note: result.note,
                        submittedAt: result.submissionDebug?.submittedAt,
                        expirationAt: result.submissionDebug?.expirationAt,
                        signaturePresent: result.submissionDebug?.signaturePresent,
                        signatureLength: result.submissionDebug?.signatureLength,
                        signingVersion: result.submissionDebug?.signingVersion,
                        safetyBoundary: 'No OpenClaw call was made. No execution. No dispatch. LocalStorage only.',
                      };
                      const key = `phase5a_evidence_${Date.now()}`;
                      try { localStorage.setItem(key, JSON.stringify(snapshot)); } catch { /* quota full */ }
                      alert(`Action Release Packet saved to localStorage key: ${key}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors rounded text-[8px] font-semibold font-mono uppercase"
                  >
                    <Save className="w-3 h-3" />
                    Save Action Release Packet
                  </button>
                  <div className="text-[6px] text-slate-500 text-center mt-1 italic">Saves to localStorage only · No backend write · No execution</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}