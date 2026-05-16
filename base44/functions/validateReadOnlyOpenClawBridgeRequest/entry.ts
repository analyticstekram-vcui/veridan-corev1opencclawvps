import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_OBSERVATION_TYPES = new Set([
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
  'OBSERVATION_EVIDENCE_RECORD',
]);

const BLOCKED_OBSERVATION_TYPES = new Set([
  'CLICK_ACTION',
  'TYPE_ACTION',
  'FORM_SUBMISSION',
  'CREDENTIAL_ENTRY',
  'PASSWORD_ENTRY',
  'API_KEY_ENTRY',
  'FILE_UPLOAD',
  'TRADE_ACTION',
  'BROKER_ACTION',
  'WALLET_ACTION',
  'MONEY_MOVEMENT',
  'COMMAND_DISPATCH',
  'AUTONOMOUS_BROWSER_CONTROL',
  'CLOUDFLARE_OR_LOGIN_BYPASS',
  'UNAUTHORIZED_PROTECTED_DATA_SCRAPE',
]);

const ALLOWED_APPROVAL_STATUSES = new Set([
  'APPROVED_FOR_DESIGN',
  'AUTO_APPROVED_READ_ONLY_DESIGN',
]);

const FINAL_WARNING = 'This is a dry-run bridge validation only. No OpenClaw calls, no runtime bridge activation, no browser actions, no external forwarding, no execution, no dispatch, no credentials, no trading, no money movement.';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. POST only.' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json();

  const {
    bridgeRequestId,
    requestId,
    proposalId,
    observationType,
    targetUrl,
    selector,
    allowedReadOnlyFields,
    approvalStatus,
    dryRunValidationId,
    auditId,
    executionAllowed,
    dispatchAllowed,
    browserMutationAllowed,
    credentialEntryAllowed,
    safetyMode,
  } = payload;

  const bridgeValidationId = `BVAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const validationErrors = [];
  let policyBlocked = false;

  // Rule 1: bridgeRequestId required
  if (!bridgeRequestId) validationErrors.push('bridgeRequestId is required');

  // Rule 2: requestId required
  if (!requestId) validationErrors.push('requestId is required');

  // Rule 3: proposalId required
  if (!proposalId) validationErrors.push('proposalId is required');

  // Rule 4 & 5: observationType required and must be allowed
  if (!observationType) {
    validationErrors.push('observationType is required');
  } else if (BLOCKED_OBSERVATION_TYPES.has(observationType)) {
    // Rule 15: blocked types return BLOCKED_BY_POLICY
    policyBlocked = true;
    validationErrors.push(`observationType '${observationType}' is BLOCKED_BY_POLICY — not permitted`);
  } else if (!ALLOWED_OBSERVATION_TYPES.has(observationType)) {
    validationErrors.push(`observationType '${observationType}' is not a recognized allowed observation type`);
  }

  // Rule 6: targetUrl required
  if (!targetUrl) validationErrors.push('targetUrl is required');

  // Rule 7: approvalStatus must be in allowed set
  if (!approvalStatus || !ALLOWED_APPROVAL_STATUSES.has(approvalStatus)) {
    policyBlocked = true;
    validationErrors.push(`approvalStatus must be APPROVED_FOR_DESIGN or AUTO_APPROVED_READ_ONLY_DESIGN, got '${approvalStatus}'`);
  }

  // Rule 8: dryRunValidationId required
  if (!dryRunValidationId) validationErrors.push('dryRunValidationId is required');

  // Rule 9: auditId required
  if (!auditId) validationErrors.push('auditId is required');

  // Rule 10: executionAllowed must be false
  if (executionAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('executionAllowed must be false — execution is not permitted');
  }

  // Rule 11: dispatchAllowed must be false
  if (dispatchAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('dispatchAllowed must be false — dispatch is not permitted');
  }

  // Rule 12: browserMutationAllowed must be false
  if (browserMutationAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('browserMutationAllowed must be false — browser mutation is not permitted');
  }

  // Rule 13: credentialEntryAllowed must be false
  if (credentialEntryAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('credentialEntryAllowed must be false — credential entry is not permitted');
  }

  // Rule 14: safetyMode must equal READ_ONLY_BRIDGE_DRY_RUN
  if (safetyMode !== 'READ_ONLY_BRIDGE_DRY_RUN') {
    policyBlocked = true;
    validationErrors.push(`safetyMode must be 'READ_ONLY_BRIDGE_DRY_RUN', got '${safetyMode}'`);
  }

  let validationStatus;
  if (policyBlocked) {
    validationStatus = 'BLOCKED_BY_POLICY';
  } else if (validationErrors.length > 0) {
    validationStatus = 'REJECTED_BY_BRIDGE_CONTRACT';
  } else {
    validationStatus = 'VALID_BRIDGE_DRY_RUN';
  }

  // Build sanitized payload preview (no credentials, no secrets)
  const sanitizedPayloadPreview = {
    bridgeRequestId: bridgeRequestId ?? null,
    requestId:       requestId ?? null,
    proposalId:      proposalId ?? null,
    observationType: observationType ?? null,
    targetUrl:       targetUrl ?? null,
    selector:        selector ?? null,
    allowedReadOnlyFieldsCount: Array.isArray(allowedReadOnlyFields) ? allowedReadOnlyFields.length : 0,
    approvalStatus:  approvalStatus ?? null,
    safetyMode:      safetyMode ?? null,
  };

  // Safety gate results summary
  const safetyGateResults = {
    bridgeRequestIdPresent:     !!bridgeRequestId,
    requestIdPresent:           !!requestId,
    proposalIdPresent:          !!proposalId,
    observationTypeAllowed:     !!observationType && ALLOWED_OBSERVATION_TYPES.has(observationType),
    targetUrlPresent:           !!targetUrl,
    approvalStatusValid:        !!approvalStatus && ALLOWED_APPROVAL_STATUSES.has(approvalStatus),
    dryRunValidationIdPresent:  !!dryRunValidationId,
    auditIdPresent:             !!auditId,
    executionDisabled:          executionAllowed === false,
    dispatchDisabled:           dispatchAllowed === false,
    browserMutationDisabled:    browserMutationAllowed === false,
    credentialEntryDisabled:    credentialEntryAllowed === false,
    safetyModeCorrect:          safetyMode === 'READ_ONLY_BRIDGE_DRY_RUN',
  };

  return Response.json({
    bridgeValidationId,
    createdAt,
    bridgeRequestId:        bridgeRequestId ?? null,
    requestId:              requestId ?? null,
    proposalId:             proposalId ?? null,
    observationType:        observationType ?? null,
    validationStatus,
    validationErrors,
    sanitizedPayloadPreview,
    safetyGateResults,
    dryRunOnly:             true,
    openClawCalled:         false,
    backendForwarded:       false,
    browserActionPerformed: false,
    runtimeBridgeActivated: false,
    executionAllowed:       false,
    dispatchAllowed:        false,
    browserMutationAllowed: false,
    credentialEntryAllowed: false,
    finalWarning:           FINAL_WARNING,
  });
});