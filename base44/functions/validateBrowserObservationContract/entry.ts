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

const URL_REQUIRED_TYPES = new Set([
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
]);

const FINAL_WARNING = 'This is a dry-run validation only. No OpenClaw calls, no browser actions, no external forwarding, no execution, no dispatch, no credentials, no trading, no money movement.';

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
    requestId,
    proposalId,
    observationType,
    targetUrl,
    selector,
    allowedReadOnlyFields,
    executionAllowed,
    dispatchAllowed,
    browserMutationAllowed,
    credentialEntryAllowed,
    safetyMode,
  } = payload;

  const validationId = `OBVAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const validationErrors = [];
  let policyBlocked = false;

  // Rule 1: requestId required
  if (!requestId) validationErrors.push('requestId is required');

  // Rule 2: proposalId required
  if (!proposalId) validationErrors.push('proposalId is required');

  // Rule 3: observationType required
  if (!observationType) {
    validationErrors.push('observationType is required');
  } else {
    // Rule 11: Reject blocked types immediately
    if (BLOCKED_OBSERVATION_TYPES.has(observationType)) {
      policyBlocked = true;
      validationErrors.push(`observationType '${observationType}' is BLOCKED_BY_POLICY — not permitted`);
    } else if (!ALLOWED_OBSERVATION_TYPES.has(observationType)) {
      // Rule 4: Must be in allowed list
      validationErrors.push(`observationType '${observationType}' is not a recognized allowed observation type`);
    }
  }

  // Rule 5: targetUrl required for URL/page observations
  if (observationType && URL_REQUIRED_TYPES.has(observationType) && !targetUrl) {
    validationErrors.push(`targetUrl is required for observationType '${observationType}'`);
  }

  // Rule 6: executionAllowed must be false
  if (executionAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('executionAllowed must be false — execution is not permitted');
  }

  // Rule 7: dispatchAllowed must be false
  if (dispatchAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('dispatchAllowed must be false — dispatch is not permitted');
  }

  // Rule 8: browserMutationAllowed must be false
  if (browserMutationAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('browserMutationAllowed must be false — browser mutation is not permitted');
  }

  // Rule 9: credentialEntryAllowed must be false
  if (credentialEntryAllowed !== false) {
    policyBlocked = true;
    validationErrors.push('credentialEntryAllowed must be false — credential entry is not permitted');
  }

  // Rule 10: safetyMode must equal READ_ONLY_OBSERVATION
  if (safetyMode !== 'READ_ONLY_OBSERVATION') {
    policyBlocked = true;
    validationErrors.push(`safetyMode must be 'READ_ONLY_OBSERVATION', got '${safetyMode}'`);
  }

  let validationStatus;
  if (policyBlocked) {
    validationStatus = 'BLOCKED_BY_POLICY';
  } else if (validationErrors.length > 0) {
    validationStatus = 'REJECTED_BY_CONTRACT';
  } else {
    validationStatus = 'VALID_DRY_RUN';
  }

  return Response.json({
    validationId,
    createdAt,
    requestId:              requestId ?? null,
    proposalId:             proposalId ?? null,
    observationType:        observationType ?? null,
    validationStatus,
    validationErrors,
    allowedReadOnlyFields:  Array.isArray(allowedReadOnlyFields) ? allowedReadOnlyFields : [],
    executionAllowed:       false,
    dispatchAllowed:        false,
    browserMutationAllowed: false,
    credentialEntryAllowed: false,
    dryRunOnly:             true,
    openClawCalled:         false,
    backendForwarded:       false,
    browserActionPerformed: false,
    finalWarning:           FINAL_WARNING,
  });
});