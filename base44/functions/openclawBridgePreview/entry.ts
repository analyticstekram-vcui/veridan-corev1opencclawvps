import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// PHASE 1: BACKEND ROUTE SCAFFOLD - DRY-RUN VALIDATION ONLY + AUDIT LOGGING
// ============================================================================
// WARNING: DO NOT CALL OPENCLAW HERE
// WARNING: DO NOT EXECUTE ACTIONS HERE
// WARNING: PHASE 1 IS VALIDATION ONLY
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
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'FAIL',
          replayCheckMessages: replayCheck.messages,
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
          policyGateResult: 'PASS',
          policyGateMessages: [],
          replayCheckResult: 'FAIL',
          replayCheckMessages: replayCheck.messages,
          note: 'Request rejected by replay check. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // All checks passed - log to audit
    const validatedAt = new Date().toISOString();
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
        targetUrl: body.bridgeRequest?.targetUrl || null,
        commandType: body.bridgeRequest?.commandType || null,
        riskTier: body.bridgeRequest?.riskTier || null,
        receivedAt,
        validatedAt,
        validationMessages: [],
        inputTextPresent: !!body.bridgeRequest?.inputText,
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        note: 'Dry-run validation and policy check passed. No OpenClaw call was made.',
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
        policyGateResult: 'PASS',
        policyGateMessages: [],
        replayCheckResult: 'PASS',
        replayCheckMessages: [],
        note: 'Dry-run validation and policy check passed. No OpenClaw call was made.',
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
        policyGateResult: null,
        policyGateMessages: [],
        replayCheckResult: null,
        replayCheckMessages: [],
        note: 'Request rejected. No OpenClaw call was made.',
      },
      { status: 500 }
    );
  }
});