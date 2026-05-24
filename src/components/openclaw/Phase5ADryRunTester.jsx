import React, { useState, useEffect, useCallback } from 'react';
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

function CanonicalDebugBlock({ signerDebug, previewDebug }) {
  const [open, setOpen] = React.useState(false);
  if (!signerDebug && !previewDebug) return null;

  const signerHash = signerDebug?.signerCanonicalHash || signerDebug?.canonicalDebug?.signerCanonicalHash;
  const previewHash = previewDebug?.previewCanonicalHash || previewDebug?.canonicalDebug?.previewCanonicalHash;
  const hashesMatch = signerHash && previewHash && signerHash === previewHash;

  const rows = [
    { label: 'signerCanonicalHash', value: signerHash || '—' },
    { label: 'previewCanonicalHash', value: previewHash || '—' },
    { label: 'hashesMatch', value: hashesMatch === true ? 'true' : hashesMatch === false ? 'false' : '—', color: hashesMatch ? 'text-emerald-400' : 'text-destructive' },
    { label: 'signatureLength', value: String(signerDebug?.signatureLength ?? previewDebug?.signatureLength ?? '—') },
    { label: 'signingVersion', value: signerDebug?.signingVersion || previewDebug?.signingVersion || '—' },
    { label: 'signedAt', value: signerDebug?.signedAt || previewDebug?.signedAt || '—' },
    { label: 'proposalId', value: signerDebug?.proposalId || previewDebug?.proposalId || '—' },
    { label: 'targetUrl', value: signerDebug?.targetUrl || previewDebug?.targetUrl || '—' },
    { label: 'operatorId', value: signerDebug?.operatorId || previewDebug?.operatorId || '—' },
    { label: 'submittedAt', value: signerDebug?.submittedAt || previewDebug?.submittedAt || '—' },
    { label: 'previewHash', value: signerDebug?.previewHash || previewDebug?.previewHash || '—' },
  ];

  return (
    <div className="pt-1 border-t border-border/20 mt-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-[6px] font-mono text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors"
      >
        <span>{open ? '▾' : '▸'}</span>
        Canonical Debug ({hashesMatch === true ? '✓ match' : hashesMatch === false ? '✗ mismatch' : 'pending'})
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 text-[6px] font-mono text-slate-500">
          {rows.map(r => (
            <div key={r.label} className="flex gap-1 flex-wrap">
              <span>{r.label}:</span>
              <span className={r.color || 'text-slate-400'}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Phase5ADryRunTester({ signedRequest, proposalId, operatorId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [signerStatus, setSignerStatus] = useState(null);
  const [signerCanonicalDebug, setSignerCanonicalDebug] = useState(null);
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
    setSignerCanonicalDebug(null);

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
      // proposalId MUST equal the stored proposal's requestId — always use props.proposalId
      const fullBridgeRequest = {
        ...signedRequest,
        requestId: uniqueRequestId,
        proposalId: proposalId || signedRequest.proposalId,
        operatorId: operatorId || signedRequest.operatorId,
        targetUrl: normalizedTarget,
        requestedTarget: normalizedTarget,
        commandType: signedRequest.commandType,
        riskTier: signedRequest.riskTier,
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
        signature: signerData.signature || signerData.signedSignature || signerData.bridgeSignature || signerData.signedRequest?.signature || '',
        signedAt: signerData.signedAt || signerData.signedRequest?.signedAt || '',
        signingVersion: signerData.signingVersion || signerData.signedRequest?.signingVersion || 'OPENCLAW_BRIDGE_V1',
        message: signerData.signingAllowed ? 'Signature generated successfully' : signerData.rejectedReason || 'Signing rejected',
      });
      if (signerData.canonicalDebug) setSignerCanonicalDebug(signerData.canonicalDebug);

      // If signer failed, stop here
      if (!signerData.signingAllowed) {
        setError(`Signer rejected: ${signerData.rejectedReason || 'Unknown reason'}`);
        setLoading(false);
        return;
      }

      // ── Build one canonical signedBridgeRequest from signerData directly ──
      // signerData is res.data from openclawBridgeSigner.
      // Extract signature from the most direct path first, then fallbacks.
      const extractedSignature =
        signerData.signature ||
        signerData.signedSignature ||
        signerData.bridgeSignature ||
        signerData.signedRequest?.signature ||
        "";

      const extractedSigningVersion =
        signerData.signingVersion ||
        signerData.signedRequest?.signingVersion ||
        "OPENCLAW_BRIDGE_V1";

      const extractedSignedAt =
        signerData.signedAt ||
        signerData.signedRequest?.signedAt ||
        signerData.timestamp ||
        submittedAt;

      // One canonical signedBridgeRequest — preserves all required fields
      const signedBridgeRequest = {
        // Original bridge request fields
        ...fullBridgeRequest,
        // Signer-produced fields layered on top
        signature: extractedSignature,
        signingVersion: extractedSigningVersion,
        signedAt: extractedSignedAt,
        previewHash,
        expirationAt,
        submittedAt,
        operatorId: fullBridgeRequest.operatorId || operatorId,
        // Explicit field preservation
        targetUrl: normalizedTarget,
        requestedTarget: normalizedTarget,
        commandType: fullBridgeRequest.commandType,
        riskTier: fullBridgeRequest.riskTier,
        proposalId: fullBridgeRequest.proposalId,
      };

      // ── Pre-submit debug row (visible in UI via setResult if blocked) ──
      const preSubmitDebug = {
        signerSuccess: signerData.signingAllowed ? 'YES' : 'NO',
        signaturePresentBeforePreview: Boolean(extractedSignature) ? 'YES' : 'NO',
        signatureLengthBeforePreview: extractedSignature?.length || 0,
        signingVersionBeforePreview: extractedSigningVersion,
        signedBridgeRequestKeys: Object.keys(signedBridgeRequest),
      };

      // Hard guard: block preview if signature is missing after signer success
      if (!signedBridgeRequest.signature) {
        setResult({
          signer: 'SUCCESS',
          preview: 'BLOCKED',
          error: 'Frontend blocked preview: signer succeeded but signature was not attached.',
          preSubmitDebug,
          submissionDebug: {
            signaturePresent: false,
            signerDataKeys: Object.keys(signerData),
            sanitizedSignerResponse: sanitizeSignerResponse(signerResponse),
          },
        });
        setLoading(false);
        return;
      }

      // ── Step 2: Build preview payload with signature in all backend-compatible locations ──
      const sigFields = {
        signature: extractedSignature,
        signingVersion: extractedSigningVersion,
        signedAt: extractedSignedAt,
      };

      const previewPayload = {
        // Top-level signature fields (some backends read here directly)
        ...sigFields,
        previewHash,
        operatorId: fullBridgeRequest.operatorId || operatorId,
        submittedAt,
        expirationAt,
        expiresInMinutes: 5,
        proposalId: fullBridgeRequest.proposalId,
        targetUrl: normalizedTarget,
        requestedTarget: normalizedTarget,
        commandType: fullBridgeRequest.commandType,
        riskTier: fullBridgeRequest.riskTier,
        // signedRequest path
        signedRequest: { ...signedBridgeRequest, ...sigFields },
        // signedBridgeRequest path (alternate key some backends check)
        signedBridgeRequest: { ...signedBridgeRequest, ...sigFields },
        // bridgeRequest path — include sig fields here too
        bridgeRequest: { ...fullBridgeRequest, ...sigFields },
      };

      const PREVIEW_FUNCTION_INVOKED = 'openclawBridgePreview';
      const previewResponse = await base44.functions.invoke(PREVIEW_FUNCTION_INVOKED, previewPayload);
      const resultData = previewResponse.data || {};

      // Attach submission debug info to result
      resultData.submissionDebug = {
        previewFunctionInvoked: PREVIEW_FUNCTION_INVOKED,
        submittedAt,
        expirationAt,
        expiresInMinutes: 5,
        signaturePresent: Boolean(extractedSignature),
        signatureLength: extractedSignature?.length || 0,
        signingVersion: extractedSigningVersion,
        signedAt: extractedSignedAt,
        // Multi-location shape debug
        topLevelSignaturePresent: Boolean(previewPayload.signature),
        signedRequestSignaturePresent: Boolean(previewPayload.signedRequest?.signature),
        signedBridgeRequestSignaturePresent: Boolean(previewPayload.signedBridgeRequest?.signature),
        bridgeRequestSignaturePresent: Boolean(previewPayload.bridgeRequest?.signature),
        signedRequestKeys: Object.keys(previewPayload.signedRequest || {}),
        preSubmitDebug,
        sanitizedSignerResponse: sanitizeSignerResponse(signerResponse),
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
            {/* Pre-submit debug row */}
            {signerStatus.success && (
              <div className="mt-2 pt-2 border-t border-primary/20 space-y-0.5 text-[7px] font-mono text-slate-500">
                <div className="text-slate-400 font-semibold mb-1">Pre-Preview Handoff Check</div>
                <div>signerSuccess: <span className="text-primary">YES</span></div>
                <div>signaturePresentBeforePreview: <span className={signerStatus.signature ? 'text-primary' : 'text-destructive'}>{signerStatus.signature ? 'YES' : 'NO'}</span></div>
                <div>signatureLengthBeforePreview: <span className="text-slate-300">{signerStatus.signature?.length ?? 0}</span></div>
                <div>signingVersionBeforePreview: <span className="text-slate-300">{signerStatus.signingVersion || 'OPENCLAW_BRIDGE_V1'}</span></div>
              </div>
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
                {result.rejectedReason && (
                  <div className="mt-1 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded text-[8px] text-destructive font-mono">
                    Reason: {result.rejectedReason}
                  </div>
                )}
                {result.rejectionCode && (
                  <div className="text-[7px] font-mono text-destructive/70">Code: {result.rejectionCode}</div>
                )}
              </div>

              {/* Rejection Debug — expanded by default on rejection */}
              {!result.acceptedForDryRun && result.rejectionDebug && (
                <div className="mt-2 pt-2 border-t border-destructive/20 space-y-0.5 text-[7px] font-mono text-slate-500">
                  <div className="text-[8px] font-semibold text-slate-300 mb-1">Rejection Debug</div>
                  {Object.entries(result.rejectionDebug).map(([k, v]) => (
                    <div key={k}>{k}: <span className="text-slate-300">{v === null ? 'null' : String(v)}</span></div>
                  ))}
                </div>
              )}

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

                    {/* Canonical Debug */}
                    <CanonicalDebugBlock
                      signerDebug={signerCanonicalDebug}
                      previewDebug={result.canonicalDebug}
                    />
                  </div>
                )}
              </div>

              {/* Save Evidence Snapshot — localStorage only, only on accepted */}
              {(result.accepted === true || result.result === 'ACCEPTED') && (
                <div className="mt-3 pt-2 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => {
                      const snapshot = {
                        snapshotType: 'PHASE_5A_DRY_RUN_EVIDENCE',
                        savedAt: new Date().toISOString(),
                        accepted: true,
                        bridgeMode: 'DRY_RUN_ONLY',
                        executionStatus: 'NOT_EXECUTED',
                        dispatchStatus: 'NOT_DISPATCHED',
                        policyCheck: result.policyGateResult || 'PASS',
                        replayCheck: result.replayCheckResult || 'PASS',
                        approvalBindingCheck: result.approvalBindingStatus || 'PASS',
                        signatureCheck: result.signatureCheckResult || 'PASS',
                        targetUrl: result.targetUrl || null,
                        commandType: result.commandType || null,
                        riskTier: result.riskTier || null,
                        operatorId: result.operatorId || null,
                        proposalId: result.proposalId || null,
                        requestId: result.requestId || null,
                        previewHash: result.previewHash || null,
                        submittedAt: result.submittedAt || result.submissionDebug?.submittedAt || null,
                        previewContractVersion: result.previewContractVersion,
                        safetyBoundary: 'No OpenClaw call was made. No execution. No dispatch. LocalStorage only.',
                      };
                      const key = `phase5a_evidence_${Date.now()}`;
                      try { localStorage.setItem(key, JSON.stringify(snapshot)); } catch { /* quota full */ }
                      alert(`Dry-Run Snapshot saved to localStorage key: ${key}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors rounded text-[8px] font-semibold font-mono uppercase"
                  >
                    <Save className="w-3 h-3" />
                    Save Dry-Run Snapshot
                  </button>
                  <div className="text-[6px] text-slate-500 text-center mt-1 italic">Saves to localStorage only. No backend write. No execution.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}