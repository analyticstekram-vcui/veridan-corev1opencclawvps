/**
 * DRY-RUN BRIDGE PREVIEW VALIDATOR
 * 
 * POST /api/dry-run/bridge/preview
 * 
 * DRY-RUN VALIDATION ONLY — NO EXECUTION, NO PERSISTENCE, NO OUTBOUND CALLS.
 * 
 * This endpoint validates dry-run bridge requests against defined rules.
 * It does NOT execute, persist, or call any external systems.
 */

const ALLOWED_COMMAND_TYPES = ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const FORBIDDEN_COMMAND_TYPES = ['CLICK', 'TYPE', 'SUBMIT', 'TRADE', 'TRANSFER', 'LOGIN', 'UPLOAD', 'DELETE', 'MODIFY', 'EXECUTE'];
const ALLOWED_RISK_TIERS = ['LOW', 'MEDIUM'];
const FORBIDDEN_RISK_TIERS = ['HIGH', 'CRITICAL'];
const ALLOWED_APPROVAL_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED'];
const ALLOWED_EXECUTION_MODES = ['DRY_RUN_ONLY'];
const FORBIDDEN_EXECUTION_MODES = ['LIVE', 'PAPER_EXECUTION', 'REAL_EXECUTION'];
const ALLOWED_EXECUTION_STATUSES = ['NOT_EXECUTED'];
const FORBIDDEN_EXECUTION_STATUSES = ['EXECUTED', 'PARTIALLY_EXECUTED'];
const ALLOWED_VALIDATION_STATUSES = ['NOT_VALIDATED', 'PASSED', 'FAILED'];

const FORBIDDEN_KEYWORDS = [
  'password',
  'secret',
  'token',
  'api_key',
  'private_key',
  'login',
  'transfer',
  'trade',
  'buy',
  'sell',
  'execute',
  'submit',
  'delete',
  'upload',
];

const SENSITIVE_TARGET_KEYWORDS = [
  'credentials',
  'password',
  'secret',
  'token',
  'private_key',
  'bank',
  'broker',
  'bureau',
  'payment',
  'wallet',
];

const REQUIRED_FIELDS = [
  'requestId',
  'createdAt',
  'operatorId',
  'commandType',
  'targetSystem',
  'requestedAction',
  'requestedTarget',
  'riskTier',
  'approvalStatus',
  'executionMode',
  'executionStatus',
  'validationStatus',
  'denialReason',
  'auditRequired',
];

/**
 * Perform comprehensive validation of dry-run bridge request.
 * @param {Object} request - The request body
 * @returns {Object} Validation results { passed: boolean, failCodes: string[], failReasons: string[] }
 */
function validateRequest(request) {
  const failures = [];
  const failCodes = [];

  // 1. Required fields check
  for (const field of REQUIRED_FIELDS) {
    if (request[field] === undefined || request[field] === null) {
      failures.push(`Missing required field: ${field}`);
      failCodes.push('REJECTED_MISSING_FIELD');
      break;
    }
  }

  // 2. commandType allowlist check
  if (!ALLOWED_COMMAND_TYPES.includes(request.commandType)) {
    failures.push(`commandType "${request.commandType}" is not in allowlist`);
    failCodes.push('REJECTED_FORBIDDEN_COMMAND');
  }

  // 3. commandType forbidden check
  if (FORBIDDEN_COMMAND_TYPES.includes(request.commandType)) {
    failures.push(`commandType "${request.commandType}" is forbidden`);
    failCodes.push('REJECTED_FORBIDDEN_COMMAND');
  }

  // 4. riskTier check
  if (!ALLOWED_RISK_TIERS.includes(request.riskTier)) {
    failures.push(`riskTier "${request.riskTier}" must be LOW or MEDIUM`);
    failCodes.push('REJECTED_HIGH_RISK');
  }

  // 5. approvalStatus check
  if (!ALLOWED_APPROVAL_STATUSES.includes(request.approvalStatus)) {
    failures.push(`approvalStatus "${request.approvalStatus}" is invalid`);
    failCodes.push('REJECTED_INVALID_APPROVAL_STATUS');
  }

  // 6. executionMode must equal DRY_RUN_ONLY
  if (request.executionMode !== 'DRY_RUN_ONLY') {
    failures.push(`executionMode must be "DRY_RUN_ONLY", got "${request.executionMode}"`);
    failCodes.push('REJECTED_EXECUTION_MODE');
  }

  // 7. executionStatus must equal NOT_EXECUTED
  if (request.executionStatus !== 'NOT_EXECUTED') {
    failures.push(`executionStatus must be "NOT_EXECUTED", got "${request.executionStatus}"`);
    failCodes.push('REJECTED_ALREADY_EXECUTED');
  }

  // 8. validationStatus check
  if (!ALLOWED_VALIDATION_STATUSES.includes(request.validationStatus)) {
    failures.push(`validationStatus "${request.validationStatus}" is invalid`);
    failCodes.push('REJECTED_INVALID_APPROVAL_STATUS');
  }

  // 9. auditRequired must be true
  if (request.auditRequired !== true) {
    failures.push(`auditRequired must be true`);
    failCodes.push('REJECTED_AUDIT_REQUIRED_FALSE');
  }

  // 10. targetSystem must be declared
  if (!request.targetSystem || request.targetSystem.trim().length === 0) {
    failures.push(`targetSystem must be declared`);
    failCodes.push('REJECTED_MISSING_FIELD');
  }

  // 11. requestedAction must be plain-language only
  const plainLanguageRegex = /^[a-zA-Z0-9\s\-.,!?'()]+$/;
  if (!plainLanguageRegex.test(request.requestedAction)) {
    failures.push(`requestedAction must contain only plain text`);
    failCodes.push('REJECTED_FORBIDDEN_KEYWORD');
  }

  // 12. requestedTarget must be non-sensitive
  const targetLower = request.requestedTarget.toLowerCase();
  for (const keyword of SENSITIVE_TARGET_KEYWORDS) {
    if (targetLower.includes(keyword)) {
      failures.push(`requestedTarget contains sensitive keyword: "${keyword}"`);
      failCodes.push('REJECTED_SENSITIVE_TARGET');
      break;
    }
  }

  // 13. forbidden keywords check in requestedAction and requestedTarget
  const combinedText = `${request.requestedAction} ${request.requestedTarget}`.toLowerCase();
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      failures.push(`forbidden keyword detected: "${keyword}"`);
      failCodes.push('REJECTED_FORBIDDEN_KEYWORD');
      break;
    }
  }

  // 14. denialReason required if validationStatus is FAILED
  if (request.validationStatus === 'FAILED' && (!request.denialReason || request.denialReason.trim().length === 0)) {
    failures.push(`denialReason is required when validationStatus is FAILED`);
    failCodes.push('REJECTED_DENIAL_REASON_REQUIRED');
  }

  return {
    passed: failures.length === 0,
    failReasons: failures,
    failCodes: [...new Set(failCodes)],
  };
}

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();

    // DRY-RUN VALIDATION ONLY — NO EXECUTION, NO PERSISTENCE, NO OUTBOUND CALLS.
    const validation = validateRequest(body);

    const dryRunId = `dry-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const receivedAt = new Date().toISOString();

    if (validation.passed) {
      return Response.json({
        accepted: true,
        requestId: body.requestId,
        dryRunId: dryRunId,
        receivedAt: receivedAt,
        validationStatus: 'PASSED',
        decision: 'ACCEPTED_FOR_DRY_RUN_PREVIEW',
        denialReason: null,
        executionStatus: 'NOT_EXECUTED',
        outboundCallsMade: false,
        persistenceWritten: false,
      });
    } else {
      return Response.json({
        accepted: false,
        requestId: body.requestId,
        dryRunId: dryRunId,
        receivedAt: receivedAt,
        validationStatus: 'FAILED',
        decision: 'REJECTED_BY_SERVER_VALIDATION',
        denialReason: validation.failReasons.join('; '),
        failCodes: validation.failCodes,
        executionStatus: 'NOT_EXECUTED',
        outboundCallsMade: false,
        persistenceWritten: false,
      });
    }
  } catch (error) {
    return Response.json({
      accepted: false,
      error: 'Invalid request body',
      details: error.message,
      executionStatus: 'NOT_EXECUTED',
      outboundCallsMade: false,
      persistenceWritten: false,
    }, { status: 400 });
  }
});