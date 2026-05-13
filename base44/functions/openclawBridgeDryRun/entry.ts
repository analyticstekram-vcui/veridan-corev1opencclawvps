import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// PHASE 5A: DRY-RUN BRIDGE ROUTE - VALIDATION + AUDIT LOGGING ONLY
// ============================================================================
// PURPOSE: Accept signed bridge request, verify all phases, create preview record
// DO NOT CALL OPENCLAW
// DO NOT EXECUTE BROWSER/API/TRADING ACTIONS
// ============================================================================

const ALLOWED_DOMAINS = [
  'veridancore.com',
  'openclaw.veridancore.com',
  'base44.com',
  'tradingview.com',
  'tradovate.com',
];

const ALLOWED_COMMAND_TYPES = ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const ALLOWED_RISK_TIERS = ['LOW', 'MEDIUM'];
const SUSPICIOUS_PATH_KEYWORDS = ['delete', 'transfer', 'withdraw', 'password', 'settings/security', 'api-key', 'billing', 'checkout', 'trade', 'order', 'execute'];

const generateDryRunId = () => `dryrun_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 9)}`;

const buildCanonicalPayload = (requestId, proposalId, previewHash, operatorId, submittedAt, signedAt, commandType, targetUrl, riskTier, governanceMode, dryRun, liveExecution) => {
  return [
    requestId,
    proposalId,
    previewHash,
    operatorId,
    submittedAt,
    signedAt,
    commandType,
    targetUrl,
    riskTier,
    governanceMode,
    String(dryRun),
    String(liveExecution),
  ].join('|');
};

const timingSafeCompare = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

const generateHmacSignature = async (canonical, secret) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBuffer = encoder.encode(canonical);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const isUrlAllowlisted = (urlString) => {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    const domain = url.hostname;
    return ALLOWED_DOMAINS.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
  } catch {
    return false;
  }
};

const containsSuspiciousKeywords = (urlString) => {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    const fullUrlLower = (url.pathname + url.search).toLowerCase();
    for (const keyword of SUSPICIOUS_PATH_KEYWORDS) {
      if (fullUrlLower.includes(keyword)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

const validateSignedRequest = async (signedRequest, hmacSecret) => {
  const errors = [];

  if (!signedRequest.signature) {
    errors.push('signature field missing');
    return { result: 'FAIL', errors };
  }

  if (!signedRequest.signingVersion || signedRequest.signingVersion !== 'OPENCLAW_BRIDGE_V1') {
    errors.push('signingVersion must be OPENCLAW_BRIDGE_V1');
    return { result: 'FAIL', errors };
  }

  if (!signedRequest.signedAt) {
    errors.push('signedAt field missing');
    return { result: 'FAIL', errors };
  }

  let signedAtDate;
  try {
    signedAtDate = new Date(signedRequest.signedAt);
    if (isNaN(signedAtDate.getTime())) {
      errors.push('signedAt is not a valid ISO timestamp');
      return { result: 'FAIL', errors };
    }
  } catch {
    errors.push('signedAt is not a valid ISO timestamp');
    return { result: 'FAIL', errors };
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  if (signedAtDate < fiveMinutesAgo) {
    errors.push('SIGNED_AT_EXPIRED');
    return { result: 'FAIL', errors };
  }

  const sixtySecondsFromNow = new Date(now.getTime() + 60 * 1000);
  if (signedAtDate > sixtySecondsFromNow) {
    errors.push('SIGNED_AT_FUTURE');
    return { result: 'FAIL', errors };
  }

  const br = signedRequest.bridgeRequest;
  const canonical = buildCanonicalPayload(
    br.requestId,
    br.proposalId,
    signedRequest.previewHash,
    signedRequest.operatorId,
    signedRequest.submittedAt,
    signedRequest.signedAt,
    br.commandType,
    br.targetUrl,
    br.riskTier,
    br.governanceMode,
    br.dryRun,
    br.liveExecution
  );

  if (hmacSecret) {
    const expectedSignature = await generateHmacSignature(canonical, hmacSecret);
    if (!timingSafeCompare(signedRequest.signature, expectedSignature)) {
      errors.push('HMAC_SIGNATURE_INVALID');
      return { result: 'FAIL', errors };
    }
  }

  return { result: 'PASS', errors: [] };
};

const checkPolicy = (bridgeRequest) => {
  const messages = [];

  if (!ALLOWED_COMMAND_TYPES.includes(bridgeRequest.commandType)) {
    messages.push(`commandType ${bridgeRequest.commandType} not allowed`);
  }

  if (!ALLOWED_RISK_TIERS.includes(bridgeRequest.riskTier)) {
    messages.push(`riskTier ${bridgeRequest.riskTier} not allowed`);
  }

  if (containsSuspiciousKeywords(bridgeRequest.targetUrl)) {
    messages.push('targetUrl contains suspicious keyword');
  }

  return {
    result: messages.length === 0 ? 'PASS' : 'FAIL',
    messages,
  };
};

const checkReplay = async (base44, requestId, previewHash) => {
  const messages = [];

  try {
    if (requestId) {
      const duplicateById = await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.filter(
        { requestId },
        '-created_date',
        1
      );
      if (duplicateById && duplicateById.length > 0) {
        messages.push('DUPLICATE_REQUEST_ID');
      }
    }

    if (previewHash) {
      const duplicateByHash = await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.filter(
        { previewHash },
        '-created_date',
        1
      );
      if (duplicateByHash && duplicateByHash.length > 0) {
        messages.push('DUPLICATE_PREVIEW_HASH');
      }
    }
  } catch (err) {
    console.error('Replay check error:', err.message);
    messages.push('replay_check_error');
  }

  return {
    result: messages.length === 0 ? 'PASS' : 'FAIL',
    messages,
  };
};

Deno.serve(async (req) => {
  const receivedAt = new Date().toISOString();
  const dryRunId = generateDryRunId();
  let requestId = null;
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: 'HTTP method must be POST',
        dryRunId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 405 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: 'request body is not valid JSON',
        dryRunId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 400 });
    }

    if (!body || !body.signedRequest || !body.operatorId || !body.submittedAt) {
      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: 'Missing required fields: signedRequest, operatorId, submittedAt',
        dryRunId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 400 });
    }

    const sr = body.signedRequest;
    const br = sr.bridgeRequest || {};
    requestId = br.requestId;

    // Phase 4: HMAC Verification
    const hmacSecret = Deno.env.get('OPENCLAW_BRIDGE_HMAC_SECRET');
    const signatureCheck = await validateSignedRequest(sr, hmacSecret);

    if (signatureCheck.result === 'FAIL') {
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          dryRunAuditId: dryRunId,
          dryRunId,
          requestId,
          proposalId: br.proposalId || null,
          operatorId: body.operatorId,
          acceptedForDryRun: false,
          rejectedReason: signatureCheck.errors.join('; '),
          commandType: br.commandType || null,
          riskTier: br.riskTier || null,
          targetUrl: br.targetUrl || null,
          previewHash: sr.previewHash || null,
          policyGateResult: null,
          policyGateMessages: [],
          replayCheckResult: null,
          replayCheckMessages: [],
          signatureCheckResult: 'FAIL',
          signatureCheckMessages: signatureCheck.errors,
          bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          secretExposed: false,
          inputTextPresent: !!br.inputText,
          createdAt: new Date().toISOString(),
          note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
        });
      } catch (err) {
        console.error('Failed to create audit record:', err.message);
      }

      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: signatureCheck.errors.join('; '),
        dryRunId,
        requestId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        signatureCheckResult: 'FAIL',
        signatureCheckMessages: signatureCheck.errors,
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 400 });
    }

    // Phase 2: Replay Protection
    const replayCheck = await checkReplay(base44, requestId, sr.previewHash);

    if (replayCheck.result === 'FAIL') {
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          dryRunAuditId: dryRunId,
          dryRunId,
          requestId,
          proposalId: br.proposalId || null,
          operatorId: body.operatorId,
          acceptedForDryRun: false,
          rejectedReason: replayCheck.messages.join('; '),
          commandType: br.commandType || null,
          riskTier: br.riskTier || null,
          targetUrl: br.targetUrl || null,
          previewHash: sr.previewHash || null,
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'FAIL',
          replayCheckMessages: replayCheck.messages,
          signatureCheckResult: 'PASS',
          signatureCheckMessages: [],
          bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          secretExposed: false,
          inputTextPresent: !!br.inputText,
          createdAt: new Date().toISOString(),
          note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
        });
      } catch (err) {
        console.error('Failed to create audit record:', err.message);
      }

      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: replayCheck.messages.join('; '),
        dryRunId,
        requestId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'FAIL',
        replayCheckMessages: replayCheck.messages,
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 400 });
    }

    // Phase 2: Policy Gate
    const policyCheck = checkPolicy(br);

    if (policyCheck.result === 'FAIL') {
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          dryRunAuditId: dryRunId,
          dryRunId,
          requestId,
          proposalId: br.proposalId || null,
          operatorId: body.operatorId,
          acceptedForDryRun: false,
          rejectedReason: policyCheck.messages.join('; '),
          commandType: br.commandType || null,
          riskTier: br.riskTier || null,
          targetUrl: br.targetUrl || null,
          previewHash: sr.previewHash || null,
          policyGateResult: 'FAIL',
          policyGateMessages: policyCheck.messages,
          replayCheckResult: 'PASS',
          replayCheckMessages: [],
          signatureCheckResult: 'PASS',
          signatureCheckMessages: [],
          bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          secretExposed: false,
          inputTextPresent: !!br.inputText,
          createdAt: new Date().toISOString(),
          note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
        });
      } catch (err) {
        console.error('Failed to create audit record:', err.message);
      }

      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: policyCheck.messages.join('; '),
        dryRunId,
        requestId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        policyGateResult: 'FAIL',
        policyGateMessages: policyCheck.messages,
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 400 });
    }

    // Phase 1: Contract Validation (basic checks)
    const validationErrors = [];
    if (br.dryRun !== true) validationErrors.push('dryRun must be true');
    if (br.liveExecution !== false) validationErrors.push('liveExecution must be false');
    if (br.governanceMode !== 'SAFE_REQUIRES_APPROVAL') validationErrors.push('governanceMode must be SAFE_REQUIRES_APPROVAL');
    if (br.approvalStatus !== 'APPROVED') validationErrors.push('approvalStatus must be APPROVED');
    if (br.validationResult !== 'PASS') validationErrors.push('validationResult must be PASS');
    if (br.executionEligibility !== 'ELIGIBLE_PREVIEW') validationErrors.push('executionEligibility must be ELIGIBLE_PREVIEW');
    if (!br.targetUrl || !br.targetUrl.startsWith('https://')) validationErrors.push('targetUrl must start with https://');
    if (!isUrlAllowlisted(br.targetUrl)) validationErrors.push('targetUrl domain not allowlisted');
    
    if (!br.expirationAt) {
      validationErrors.push('expirationAt missing');
    } else {
      try {
        const expDate = new Date(br.expirationAt);
        if (expDate <= new Date()) validationErrors.push('expirationAt must be in the future');
      } catch {
        validationErrors.push('expirationAt is not a valid date');
      }
    }

    if (validationErrors.length > 0) {
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          dryRunAuditId: dryRunId,
          dryRunId,
          requestId,
          proposalId: br.proposalId || null,
          operatorId: body.operatorId,
          acceptedForDryRun: false,
          rejectedReason: validationErrors.join('; '),
          commandType: br.commandType || null,
          riskTier: br.riskTier || null,
          targetUrl: br.targetUrl || null,
          previewHash: sr.previewHash || null,
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'PASS',
          replayCheckMessages: [],
          signatureCheckResult: 'PASS',
          signatureCheckMessages: [],
          bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          secretExposed: false,
          inputTextPresent: !!br.inputText,
          createdAt: new Date().toISOString(),
          note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
        });
      } catch (err) {
        console.error('Failed to create audit record:', err.message);
      }

      return Response.json({
        acceptedForDryRun: false,
        rejectedReason: validationErrors.join('; '),
        dryRunId,
        requestId,
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
      }, { status: 400 });
    }

    // All validations passed - create dry-run preview record
    try {
      await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
        dryRunAuditId: dryRunId,
        dryRunId,
        requestId,
        proposalId: br.proposalId || null,
        operatorId: body.operatorId,
        acceptedForDryRun: true,
        rejectedReason: null,
        commandType: br.commandType,
        riskTier: br.riskTier,
        targetUrl: br.targetUrl,
        previewHash: sr.previewHash,
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        signatureCheckResult: 'PASS',
        signatureCheckMessages: [],
        bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus: 'PREVIEW_ONLY',
        secretExposed: false,
        inputTextPresent: !!br.inputText,
        createdAt: new Date().toISOString(),
        note: 'Dry-run bridge preview created. No OpenClaw action was executed.',
      });
    } catch (err) {
      console.error('Failed to create audit record:', err.message);
    }

    return Response.json({
      acceptedForDryRun: true,
      rejectedReason: null,
      dryRunId,
      requestId,
      bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
      executionStatus: 'PREVIEW_ONLY',
      policyGateResult: 'PASS',
      policyGateMessages: [],
      replayCheckResult: 'PASS',
      replayCheckMessages: [],
      signatureCheckResult: 'PASS',
      signatureCheckMessages: [],
      note: 'Dry-run bridge preview created. No OpenClaw action was executed.',
    }, { status: 200 });

  } catch (error) {
    return Response.json({
      acceptedForDryRun: false,
      rejectedReason: `Server error: ${error.message}`,
      dryRunId,
      requestId,
      bridgeMode: 'OPENCLAW_DRY_RUN_PREVIEW',
      executionStatus: 'REJECTED_NOT_EXECUTED',
      note: 'Dry-run bridge request rejected. No OpenClaw action was executed.',
    }, { status: 500 });
  }
});