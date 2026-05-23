import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// PHASES 1-4A: BACKEND ROUTE SCAFFOLD - DRY-RUN VALIDATION ONLY + AUDIT LOGGING
// ============================================================================
// PHASE 1: Request structure & contract validation
// PHASE 2: Policy gating + replay protection
// PHASE 3: Signed request validation (MOCK signature, no HMAC yet)
// PHASE 4A: HMAC secret configuration check (fail-closed if missing)
// ============================================================================
// WARNING: DO NOT CALL OPENCLAW HERE
// WARNING: DO NOT EXECUTE ACTIONS HERE
// WARNING: ALL PHASES ARE VALIDATION ONLY
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

const generateAuditId = () => `audit_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 9)}`;

// Phase 4B: Real HMAC-SHA256 Signature Validation
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

// Timing-safe comparison for HMAC signatures
const timingSafeCompare = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

// Real HMAC-SHA256 signature generation (server-side only)
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

const validateSignedRequest = async (body, hmacSecretConfigured, hmacSecret) => {
  const errors = [];

  // Check signature field existence
  if (!body.signature) {
    errors.push('signature field missing');
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  // Check signingVersion
  if (!body.signingVersion) {
    errors.push('signingVersion field missing');
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  if (body.signingVersion !== 'OPENCLAW_BRIDGE_V1') {
    errors.push(`signingVersion must be OPENCLAW_BRIDGE_V1, got ${body.signingVersion}`);
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  // Check signedAt field existence
  if (!body.signedAt) {
    errors.push('signedAt field missing');
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  // Validate signedAt is a valid ISO timestamp
  let signedAtDate;
  try {
    signedAtDate = new Date(body.signedAt);
    if (isNaN(signedAtDate.getTime())) {
      errors.push('signedAt is not a valid ISO timestamp');
      return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
    }
  } catch {
    errors.push('signedAt is not a valid ISO timestamp');
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  // Check signedAt is not too old (older than 5 minutes) - EXPLICIT error
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  if (signedAtDate < fiveMinutesAgo) {
    errors.push('SIGNED_AT_EXPIRED');
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  // Check signedAt is not too far in future (more than 60 seconds) - EXPLICIT error
  const sixtySecondsFromNow = new Date(now.getTime() + 60 * 1000);
  if (signedAtDate > sixtySecondsFromNow) {
    errors.push('SIGNED_AT_FUTURE');
    return { result: 'FAIL', errors, mode: hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC' };
  }

  // ALL TIMESTAMP VALIDATION COMPLETE - now proceed to HMAC verification
  // Build canonical payload for signature verification
  const br = body.bridgeRequest;
  const canonical = buildCanonicalPayload(
    body.bridgeRequest.requestId,
    body.bridgeRequest.proposalId,
    body.previewHash,
    body.operatorId,
    body.submittedAt,
    body.signedAt,
    br.commandType,
    br.targetUrl,
    br.riskTier,
    br.governanceMode,
    br.dryRun,
    br.liveExecution
  );

  const mode = hmacSecretConfigured ? 'REAL_HMAC_VALIDATION' : 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC';

  // Phase 4B: Real HMAC verification (if secret is configured)
  // Only happens AFTER signedAt freshness validation passes
  if (hmacSecretConfigured && hmacSecret) {
    const expectedSignature = await generateHmacSignature(canonical, hmacSecret);
    
    // Timing-safe comparison to prevent timing attacks
    if (!timingSafeCompare(body.signature, expectedSignature)) {
      errors.push('HMAC_SIGNATURE_INVALID');
      return { result: 'FAIL', errors, mode };
    }
  }

  return { result: 'PASS', errors: [], mode };
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

const validateBridgeRequest = (body) => {
  const errors = [];

  // Body-level validations
  if (!body) {
    errors.push('request body does not exist');
    return { isValid: false, errors };
  }

  if (!body.bridgeRequest) {
    errors.push('bridgeRequest field missing');
  }

  if (!body.previewHash) {
    errors.push('previewHash field missing');
  }

  if (!body.operatorId) {
    errors.push('operatorId field missing');
  }

  if (!body.submittedAt) {
    errors.push('submittedAt field missing');
  }

  // Early exit if critical fields are missing
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const br = body.bridgeRequest;

  // Execution mode validations
  if (br.dryRun !== true) {
    errors.push('dryRun must be true');
  }

  if (br.liveExecution !== false) {
    errors.push('liveExecution must be false');
  }

  // Governance mode validation
  if (br.governanceMode !== 'SAFE_REQUIRES_APPROVAL') {
    errors.push('governanceMode must be SAFE_REQUIRES_APPROVAL');
  }

  // Approval status validation
  if (br.approvalStatus !== 'APPROVED') {
    errors.push('approvalStatus must be APPROVED');
  }

  // Validation result
  if (br.validationResult !== 'PASS') {
    errors.push('validationResult must be PASS');
  }

  // Execution eligibility
  if (br.executionEligibility !== 'ELIGIBLE_PREVIEW') {
    errors.push('executionEligibility must be ELIGIBLE_PREVIEW');
  }

  // Expiration validation
  if (!br.expirationAt) {
    errors.push('expirationAt field missing');
  } else {
    try {
      const expirationDate = new Date(br.expirationAt);
      if (isNaN(expirationDate.getTime())) {
        errors.push('expirationAt is not a valid date');
      } else if (expirationDate <= new Date()) {
        errors.push('expirationAt must be in the future');
      }
    } catch {
      errors.push('expirationAt is not a valid date');
    }
  }

  // URL validation
  if (!br.targetUrl) {
    errors.push('targetUrl field missing');
  } else {
    const urlLower = br.targetUrl.toLowerCase();
    if (!urlLower.startsWith('https://')) {
      errors.push('targetUrl must use https://');
    } else if (!isUrlAllowlisted(br.targetUrl)) {
      errors.push('targetUrl domain not allowlisted');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const checkPolicy = (bridgeRequest) => {
  const messages = [];

  // Command type policy (case-sensitive, must match exactly)
  if (!ALLOWED_COMMAND_TYPES.includes(bridgeRequest.commandType)) {
    messages.push(`commandType ${bridgeRequest.commandType} not allowed (must be one of: ${ALLOWED_COMMAND_TYPES.join(', ')})`);
  }

  // Risk tier policy (case-sensitive, must match exactly)
  if (!ALLOWED_RISK_TIERS.includes(bridgeRequest.riskTier)) {
    messages.push(`riskTier ${bridgeRequest.riskTier} not allowed (must be LOW or MEDIUM)`);
  }

  // Suspicious path keywords (check both pathname and search query)
  try {
    const url = new URL(bridgeRequest.targetUrl);
    const urlPathLower = url.pathname.toLowerCase();
    const urlSearchLower = url.search.toLowerCase();
    const fullUrlLower = (urlPathLower + urlSearchLower).toLowerCase();
    
    for (const keyword of SUSPICIOUS_PATH_KEYWORDS) {
      if (fullUrlLower.includes(keyword)) {
        messages.push(`targetUrl contains suspicious keyword: ${keyword}`);
        break; // Report only first match to avoid duplicate messages
      }
    }
  } catch (err) {
    messages.push('failed to parse targetUrl for keyword check');
  }

  return {
    result: messages.length === 0 ? 'PASS' : 'FAIL',
    messages,
  };
};

const checkReplay = async (base44, requestId, previewHash) => {
  const messages = [];

  try {
    // Check for duplicate requestId
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

    // Check for duplicate previewHash
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

// Phase 4A: HMAC Secret Configuration Check
const checkHmacSecretConfigured = () => {
  const secret = Deno.env.get('OPENCLAW_BRIDGE_HMAC_SECRET');
  return {
    configured: !!secret && secret.length > 0,
    // Note: never return actual secret value
  };
};

Deno.serve(async (req) => {
  const receivedAt = new Date().toISOString();
  const auditId = generateAuditId();
  let requestId = null;
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    // Only accept POST
    if (req.method !== 'POST') {
      return Response.json(
        {
          accepted: false,
          rejectedReason: 'HTTP method must be POST',
          requestId: null,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt: new Date().toISOString(),
          note: 'Request rejected. No OpenClaw call was made.',
        },
        { status: 405 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        {
          accepted: false,
          rejectedReason: 'request body is not valid JSON',
          requestId: null,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt: new Date().toISOString(),
          note: 'Request rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // Extract requestId if available
    if (body?.bridgeRequest?.requestId) {
      requestId = body.bridgeRequest.requestId;
    }

    // ========================================================================
    // PHASE 4A: HMAC SECRET CONFIGURATION CHECK
    // Fail-closed: if secret is missing, reject immediately
    // ========================================================================
    const hmacSecretCheck = checkHmacSecretConfigured();
    
    if (!hmacSecretCheck.configured) {
      const validatedAt = new Date().toISOString();
      const rejectionReason = 'HMAC_SECRET_NOT_CONFIGURED';
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          auditId,
          requestId,
          previewHash: body.previewHash || null,
          operatorId: body.operatorId || null,
          accepted: false,
          rejectedReason: rejectionReason,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          targetUrl: body.bridgeRequest?.targetUrl || null,
          commandType: body.bridgeRequest?.commandType || null,
          riskTier: body.bridgeRequest?.riskTier || null,
          receivedAt,
          validatedAt,
          validationMessages: [],
          inputTextPresent: !!body.bridgeRequest?.inputText,
          policyGateResult: null,
          policyGateMessages: [],
          replayCheckResult: null,
          replayCheckMessages: [],
          signatureCheckResult: null,
          signatureCheckMessages: [],
          signingVersion: null,
          signedAt: null,
          signaturePresent: false,
          signatureMode: 'REAL_HMAC_VALIDATION',
          hmacSecretConfigured: false,
          secretExposed: false,
          note: 'HMAC secret missing. No OpenClaw call was made.',
        });
      } catch (auditErr) {
        console.error('Failed to create HMAC secret check audit record:', auditErr.message);
      }

      return Response.json(
        {
          accepted: false,
          rejectedReason: 'HMAC_SECRET_NOT_CONFIGURED',
          requestId,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt,
          hmacSecretConfigured: false,
          secretExposed: false,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'HMAC secret missing. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // PHASE 1: VALIDATION ONLY
    // DO NOT CALL OPENCLAW
    // DO NOT EXECUTE ACTIONS
    // ========================================================================

    const validation = validateBridgeRequest(body);

    if (!validation.isValid) {
      const validatedAt = new Date().toISOString();
      const rejectionReason = `Validation failed: ${validation.errors.join('; ')}`;
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          auditId,
          requestId,
          previewHash: body.previewHash || null,
          operatorId: body.operatorId || null,
          accepted: false,
          rejectedReason: rejectionReason,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          targetUrl: body.bridgeRequest?.targetUrl || null,
          commandType: body.bridgeRequest?.commandType || null,
          riskTier: body.bridgeRequest?.riskTier || null,
          receivedAt,
          validatedAt,
          validationMessages: validation.errors,
          inputTextPresent: !!body.bridgeRequest?.inputText,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC',
          policyGateResult: null,
          policyGateMessages: [],
          replayCheckResult: null,
          replayCheckMessages: [],
          note: 'Request rejected. No OpenClaw call was made.',
          });
      } catch (auditErr) {
        console.error('Failed to create rejection audit record:', auditErr.message);
      }

      return Response.json(
        {
          accepted: false,
          rejectedReason: rejectionReason,
          requestId,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC',
          policyGateResult: null,
          policyGateMessages: [],
          replayCheckResult: null,
          replayCheckMessages: [],
          note: 'Request rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // Phase 2: Policy gating
    const policyCheck = checkPolicy(body.bridgeRequest);

    if (policyCheck.result === 'FAIL') {
      const validatedAt = new Date().toISOString();
      const rejectionReason = `Policy gate failed: ${policyCheck.messages.join('; ')}`;
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          auditId,
          requestId,
          previewHash: body.previewHash || null,
          operatorId: body.operatorId || null,
          accepted: false,
          rejectedReason: rejectionReason,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          targetUrl: body.bridgeRequest?.targetUrl || null,
          commandType: body.bridgeRequest?.commandType || null,
          riskTier: body.bridgeRequest?.riskTier || null,
          receivedAt,
          validatedAt,
          validationMessages: [],
          inputTextPresent: !!body.bridgeRequest?.inputText,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC',
          policyGateResult: 'FAIL',
          policyGateMessages: policyCheck.messages,
          replayCheckResult: null,
          replayCheckMessages: [],
          note: 'Request rejected by policy gate. No OpenClaw call was made.',
          });
          } catch (auditErr) {
          console.error('Failed to create policy rejection audit record:', auditErr.message);
          }

          return Response.json(
          {
          accepted: false,
          rejectedReason: rejectionReason,
          requestId,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC',
          policyGateResult: 'FAIL',
          policyGateMessages: policyCheck.messages,
          replayCheckResult: null,
          replayCheckMessages: [],
          note: 'Request rejected by policy gate. No OpenClaw call was made.',
          },
        { status: 400 }
      );
    }

    // Phase 2: Replay protection
    const replayCheck = await checkReplay(base44, requestId, body.previewHash);

    if (replayCheck.result === 'FAIL') {
      const validatedAt = new Date().toISOString();
      const rejectionReason = `Replay check failed: ${replayCheck.messages.join(', ')}`;
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          auditId,
          requestId,
          previewHash: body.previewHash || null,
          operatorId: body.operatorId || null,
          accepted: false,
          rejectedReason: rejectionReason,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          targetUrl: body.bridgeRequest?.targetUrl || null,
          commandType: body.bridgeRequest?.commandType || null,
          riskTier: body.bridgeRequest?.riskTier || null,
          receivedAt,
          validatedAt,
          validationMessages: [],
          inputTextPresent: !!body.bridgeRequest?.inputText,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC',
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'FAIL',
          replayCheckMessages: replayCheck.messages,
          signatureCheckResult: null,
          signatureCheckMessages: [],
          signingVersion: null,
          signedAt: null,
          signaturePresent: false,
          note: 'Request rejected by replay check. No OpenClaw call was made.',
          });
          } catch (auditErr) {
          console.error('Failed to create replay rejection audit record:', auditErr.message);
          }

          return Response.json(
          {
          accepted: false,
          rejectedReason: rejectionReason,
          requestId,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: 'MOCK_SIGNATURE_VALIDATION_PENDING_REAL_HMAC',
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'FAIL',
          replayCheckMessages: replayCheck.messages,
          signatureCheckResult: null,
          signatureCheckMessages: [],
          note: 'Request rejected by replay check. No OpenClaw call was made.',
          },
        { status: 400 }
      );
    }

    // Phase 3-4B: Signed request validation (Phase 4B: Real HMAC if secret configured)
    const hmacSecret = Deno.env.get('OPENCLAW_BRIDGE_HMAC_SECRET');
    const signatureCheck = await validateSignedRequest(body, hmacSecretCheck.configured, hmacSecret);

    if (signatureCheck.result === 'FAIL') {
      const validatedAt = new Date().toISOString();
      const rejectionReason = `Signature validation failed: ${signatureCheck.errors.join('; ')}`;
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          auditId,
          requestId,
          previewHash: body.previewHash || null,
          operatorId: body.operatorId || null,
          accepted: false,
          rejectedReason: rejectionReason,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          targetUrl: body.bridgeRequest?.targetUrl || null,
          commandType: body.bridgeRequest?.commandType || null,
          riskTier: body.bridgeRequest?.riskTier || null,
          receivedAt,
          validatedAt,
          validationMessages: [],
          inputTextPresent: !!body.bridgeRequest?.inputText,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: signatureCheck.mode,
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'PASS',
          replayCheckMessages: [],
          signatureCheckResult: 'FAIL',
          signatureCheckMessages: signatureCheck.errors,
          signingVersion: body.signingVersion || null,
          signedAt: body.signedAt || null,
          signaturePresent: !!body.signature,
          note: 'Request rejected by signature validation. No OpenClaw call was made.',
          });
          } catch (auditErr) {
          console.error('Failed to create signature rejection audit record:', auditErr.message);
          }

          return Response.json(
          {
          accepted: false,
          rejectedReason: rejectionReason,
          requestId,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: signatureCheck.mode,
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'PASS',
          replayCheckMessages: [],
          signatureCheckResult: 'FAIL',
          signatureCheckMessages: signatureCheck.errors,
          note: 'Request rejected by signature validation. No OpenClaw call was made.',
          },
        { status: 400 }
      );
    }

    // ========================================================================
    // PHASE 5: APPROVAL BINDING — SERVER-SIDE VERIFICATION
    // Verify proposalId exists in DB with status=APPROVED and fields match
    // ========================================================================
    const br = body.bridgeRequest;
    const proposalId = br?.proposalId;
    const validatedAt = new Date().toISOString();
    
    let approvalBindingStatus = 'PASS';
    let approvalBindingReason = null;

    if (!proposalId) {
      approvalBindingStatus = 'FAIL';
      approvalBindingReason = 'proposalId field missing from bridgeRequest';
    } else {
      try {
        const proposals = await base44.asServiceRole.entities.OpenClawProposal.filter(
          { requestId: proposalId },
          '-createdAt',
          1
        );

        if (!proposals || proposals.length === 0) {
          approvalBindingStatus = 'FAIL';
          approvalBindingReason = 'No approved proposal found with proposalId';
        } else {
          const proposal = proposals[0];

          // Check proposal status
          if (proposal.status !== 'APPROVED') {
            approvalBindingStatus = 'FAIL';
            approvalBindingReason = `Proposal status is ${proposal.status}, not APPROVED`;
          }
          // Check commandType match
          else if (proposal.commandType !== br.commandType) {
            approvalBindingStatus = 'FAIL';
            approvalBindingReason = `Proposal commandType ${proposal.commandType} does not match bridgeRequest ${br.commandType}`;
          }
          // Check targetUrl match
          else if (proposal.url && proposal.url !== br.targetUrl && proposal.target !== br.targetUrl) {
            approvalBindingStatus = 'FAIL';
            approvalBindingReason = `Proposal targetUrl does not match bridgeRequest targetUrl`;
          }
          // Check riskTier match
          else if (proposal.riskTier !== br.riskTier) {
            approvalBindingStatus = 'FAIL';
            approvalBindingReason = `Proposal riskTier ${proposal.riskTier} does not match bridgeRequest ${br.riskTier}`;
          }
          // Check operatorId match
          else if (proposal.proposedBy && proposal.proposedBy !== body.operatorId) {
            approvalBindingStatus = 'FAIL';
            approvalBindingReason = `Proposal proposedBy ${proposal.proposedBy} does not match operatorId ${body.operatorId}`;
          }
        }
      } catch (err) {
        approvalBindingStatus = 'FAIL';
        approvalBindingReason = `Approval binding check error: ${err.message}`;
      }
    }

    // If approval binding failed, reject request
    if (approvalBindingStatus === 'FAIL') {
      const rejectionReason = `Approval binding failed: ${approvalBindingReason}`;
      try {
        await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
          auditId,
          requestId,
          previewHash: body.previewHash || null,
          operatorId: body.operatorId || null,
          accepted: false,
          rejectedReason: rejectionReason,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          targetUrl: br?.targetUrl || null,
          commandType: br?.commandType || null,
          riskTier: br?.riskTier || null,
          receivedAt,
          validatedAt,
          validationMessages: [],
          inputTextPresent: !!br?.inputText,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: signatureCheck.mode,
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'PASS',
          replayCheckMessages: [],
          signatureCheckResult: 'PASS',
          signatureCheckMessages: [],
          signingVersion: body.signingVersion || null,
          signedAt: body.signedAt || null,
          signaturePresent: !!body.signature,
          approvalBindingStatus,
          note: 'Request rejected by approval binding check. No OpenClaw call was made.',
        });
      } catch (auditErr) {
        console.error('Failed to create approval binding rejection audit record:', auditErr.message);
      }

      return Response.json(
        {
          accepted: false,
          rejectedReason: rejectionReason,
          requestId,
          bridgeMode: 'DRY_RUN_ONLY',
          executionStatus: 'REJECTED_NOT_EXECUTED',
          auditId,
          receivedAt,
          validatedAt,
          hmacSecretConfigured: hmacSecretCheck.configured,
          secretExposed: false,
          signatureMode: signatureCheck.mode,
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'PASS',
          replayCheckMessages: [],
          signatureCheckResult: 'PASS',
          signatureCheckMessages: [],
          approvalBindingStatus,
          note: 'Request rejected by approval binding check. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // All checks passed - log to audit
    try {
      await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
        auditId,
        requestId,
        previewHash: body.previewHash || null,
        operatorId: body.operatorId || null,
        accepted: true,
        rejectedReason: null,
        bridgeMode: 'DRY_RUN_ONLY',
        executionStatus: 'NOT_EXECUTED',
        targetUrl: br?.targetUrl || null,
        commandType: br?.commandType || null,
        riskTier: br?.riskTier || null,
        receivedAt,
        validatedAt,
        validationMessages: [],
        inputTextPresent: !!br?.inputText,
        hmacSecretConfigured: hmacSecretCheck.configured,
        secretExposed: false,
        signatureMode: signatureCheck.mode,
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        signatureCheckResult: 'PASS',
        signatureCheckMessages: [],
        signingVersion: body.signingVersion || null,
        signedAt: body.signedAt || null,
        signaturePresent: !!body.signature,
        approvalBindingStatus: 'PASS',
        note: 'Phases 1-5 validation passed. DRY_RUN_ONLY mode. No OpenClaw call was made.',
        });
        } catch (auditErr) {
        console.error('Failed to create audit record:', auditErr.message);
        }

        return Response.json(
        {
        accepted: true,
        rejectedReason: null,
        requestId,
        bridgeMode: 'DRY_RUN_ONLY',
        executionStatus: 'NOT_EXECUTED',
        auditId,
        receivedAt,
        validatedAt,
        hmacSecretConfigured: hmacSecretCheck.configured,
        secretExposed: false,
        signatureMode: signatureCheck.mode,
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        signatureCheckResult: 'PASS',
        signatureCheckMessages: [],
        approvalBindingStatus: 'PASS',
        note: 'Phases 1-5 validation passed. DRY_RUN_ONLY mode. No OpenClaw call was made.',
        },
      { status: 200 }
    );

  } catch (error) {
    return Response.json(
      {
        accepted: false,
        rejectedReason: `Server error: ${error.message}`,
        requestId,
        bridgeMode: 'DRY_RUN_ONLY',
        executionStatus: 'REJECTED_NOT_EXECUTED',
        auditId,
        receivedAt,
        validatedAt: new Date().toISOString(),
        hmacSecretConfigured: false,
        secretExposed: false,
        signatureMode: 'REAL_HMAC_VALIDATION',
        policyGateResult: null,
        policyGateMessages: [],
        replayCheckResult: null,
        replayCheckMessages: [],
        signatureCheckResult: null,
        signatureCheckMessages: [],
        note: 'Request rejected. No OpenClaw call was made.',
      },
      { status: 500 }
    );
  }
  });