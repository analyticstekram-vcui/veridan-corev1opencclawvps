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
          note: 'Request rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // All validations passed - log to audit
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
        note: 'Dry-run validation only. No OpenClaw call was made.',
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
        note: 'Dry-run validation only. No OpenClaw call was made.',
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
        note: 'Request rejected. No OpenClaw call was made.',
      },
      { status: 500 }
    );
  }
});