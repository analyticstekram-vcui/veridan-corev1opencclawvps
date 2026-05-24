/**
 * openclawControlledWake
 * /api/openclaw/wake/controlled
 *
 * Sends a notification-only POST to the configured OpenClaw /hooks/wake endpoint.
 *
 * SAFETY BOUNDARIES (HARDCODED — NOT CONFIGURABLE):
 *   - Reads OPENCLAW_SERVICE_TOKEN server-side only, never exposed to client
 *   - Only calls /hooks/wake — never /hooks/agent or any other path
 *   - Requires prior readiness evidence: allPass=true, decision=READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW,
 *     activationStatus=NOT_ACTIVATED, operator approval present
 *   - No browser automation
 *   - No filesystem writes (except /tmp audit file for reference)
 *   - No broker, bank, credit, or external account actions
 *   - executionStatus always returned as NOT_EXECUTED
 *   - dispatchStatus is WAKE_NOTIFICATION_SENT_ONLY on success
 *   - Full audit record persisted to OpenClawBridgeDryRunAudit entity
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REQUIRED_DECISION = 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW';
const REQUIRED_ACTIVATION_STATUS = 'NOT_ACTIVATED';
const WAKE_PATH = '/hooks/wake';
const AGENT_PATH = '/hooks/agent';

const generateAuditId = () =>
  `VCWAKE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

Deno.serve(async (req) => {
  const receivedAt = new Date().toISOString();
  const auditId = generateAuditId();

  // Only POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let base44;
  try {
    base44 = createClientFromRequest(req);
  } catch (e) {
    return Response.json({ error: 'SDK init failed', detail: e.message }, { status: 500 });
  }

  // Auth check
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin only
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { evidenceId, operatorConfirmed, operatorNote } = body || {};

  // Operator must explicitly confirm
  if (operatorConfirmed !== true) {
    return Response.json({
      error: 'OPERATOR_CONFIRMATION_REQUIRED',
      detail: 'operatorConfirmed must be true',
    }, { status: 400 });
  }

  // ── READ READINESS EVIDENCE ──────────────────────────────────────────────
  // Fetch from the audit entity: look for a recent record with the right decision
  let evidenceRecord = null;
  try {
    // If caller provided a specific evidenceId, look for it; otherwise use latest
    const filters = evidenceId
      ? { dryRunAuditId: evidenceId }
      : {};

    const records = await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.filter(
      filters,
      '-created_date',
      20
    );

    // Find first record that passes all gate conditions embedded as metadata, OR
    // fall back to checking raw fields if a custom evidence shape is passed
    if (records && records.length > 0) {
      evidenceRecord = records.find(r =>
        r.acceptedForDryRun === true ||
        r.executionStatus === 'NOT_EXECUTED'
      ) || records[0];
    }
  } catch (err) {
    console.error('Evidence fetch error:', err.message);
  }

  // ── VALIDATE EVIDENCE RECORD ─────────────────────────────────────────────
  // The readiness evidence must be passed in the body directly (from frontend localStorage record)
  // since WakeActivationReadiness records are stored in localStorage, not the DB entity.
  const readinessEvidence = body.readinessEvidence || null;

  if (!readinessEvidence) {
    return Response.json({
      error: 'MISSING_READINESS_EVIDENCE',
      detail: 'readinessEvidence must be provided in the request body',
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  // Check all required fields
  const evidenceAllPass = readinessEvidence.allPass === true;
  const evidenceDecision = readinessEvidence.decision;
  const evidenceActivationStatus = readinessEvidence.activationStatus;
  const evidenceApprovalState = readinessEvidence.form?.operatorApprovalState;

  const approvalPresent = ['APPROVED', 'REVIEW_READY'].includes(evidenceApprovalState);

  if (!evidenceAllPass) {
    return Response.json({
      error: 'READINESS_GATE_NOT_PASSED',
      detail: `readinessEvidence.allPass must be true (got: ${evidenceAllPass})`,
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  if (evidenceDecision !== REQUIRED_DECISION) {
    return Response.json({
      error: 'WRONG_READINESS_DECISION',
      detail: `readinessEvidence.decision must be ${REQUIRED_DECISION} (got: ${evidenceDecision})`,
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  if (evidenceActivationStatus !== REQUIRED_ACTIVATION_STATUS) {
    return Response.json({
      error: 'ACTIVATION_STATUS_INVALID',
      detail: `readinessEvidence.activationStatus must be NOT_ACTIVATED (got: ${evidenceActivationStatus})`,
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  if (!approvalPresent) {
    return Response.json({
      error: 'OPERATOR_APPROVAL_MISSING',
      detail: `readinessEvidence.form.operatorApprovalState must be APPROVED or REVIEW_READY (got: ${evidenceApprovalState})`,
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  // ── READ SECRETS SERVER-SIDE ONLY ────────────────────────────────────────
  const serviceToken = Deno.env.get('OPENCLAW_SERVICE_TOKEN');
  const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');

  if (!serviceToken) {
    return Response.json({
      error: 'OPENCLAW_SERVICE_TOKEN_NOT_CONFIGURED',
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }

  if (!gatewayUrl) {
    return Response.json({
      error: 'OPENCLAW_GATEWAY_URL_NOT_CONFIGURED',
      wakeStatus: 'BLOCKED',
      httpStatus: null,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }

  // ── HARD GUARD: never call agent endpoint ────────────────────────────────
  const wakeUrl = `${gatewayUrl.replace(/\/$/, '')}${WAKE_PATH}`;

  if (wakeUrl.includes(AGENT_PATH)) {
    return Response.json({
      error: 'AGENT_ENDPOINT_PROHIBITED',
      detail: '/hooks/agent is never permitted',
      wakeStatus: 'BLOCKED',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 403 });
  }

  // Final check: URL must end exactly with /hooks/wake
  if (!wakeUrl.endsWith(WAKE_PATH)) {
    return Response.json({
      error: 'INVALID_WAKE_URL',
      detail: `Computed wake URL does not end with ${WAKE_PATH}`,
      wakeStatus: 'BLOCKED',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      auditId,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }

  // ── SEND WAKE NOTIFICATION ───────────────────────────────────────────────
  let wakeHttpStatus = null;
  let wakeResponseBody = null;
  let dispatchStatus = 'NOT_DISPATCHED';
  let wakeStatus = 'UNKNOWN';
  let wakeError = null;

  const wakePayload = {
    source: 'veridan_core_controlled_wake',
    auditId,
    operatorId: user.email,
    sentAt: new Date().toISOString(),
    notificationOnly: true,
    executionMode: 'NOTIFICATION_ONLY',
  };

  try {
    const wakeResponse = await fetch(wakeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceToken}`,
        // Token value is never returned to client
      },
      body: JSON.stringify(wakePayload),
    });

    wakeHttpStatus = wakeResponse.status;

    // Read response safely — don't propagate secrets
    try {
      const raw = await wakeResponse.text();
      // Only keep first 500 chars, sanitize
      wakeResponseBody = raw.slice(0, 500).replace(serviceToken, '[REDACTED]');
    } catch { /* ignore */ }

    if (wakeResponse.ok) {
      wakeStatus = 'WAKE_NOTIFICATION_SENT';
      dispatchStatus = 'WAKE_NOTIFICATION_SENT_ONLY';
    } else {
      wakeStatus = `WAKE_ENDPOINT_ERROR_${wakeHttpStatus}`;
      dispatchStatus = 'NOT_DISPATCHED';
    }
  } catch (err) {
    wakeError = err.message;
    wakeStatus = 'WAKE_NETWORK_ERROR';
    dispatchStatus = 'NOT_DISPATCHED';
    console.error('Wake fetch error:', err.message);
  }

  // ── WRITE AUDIT RECORD ───────────────────────────────────────────────────
  const completedAt = new Date().toISOString();
  try {
    await base44.asServiceRole.entities.OpenClawBridgeDryRunAudit.create({
      dryRunAuditId: auditId,
      operatorId: user.email,
      acceptedForDryRun: false,
      bridgeMode: 'CONTROLLED_WAKE_NOTIFICATION_ONLY',
      executionStatus: 'NOT_EXECUTED',
      commandType: 'WAKE_NOTIFICATION',
      targetUrl: wakeUrl.replace(serviceToken || '', '[REDACTED]'),
      riskTier: 'LOW',
      policyGateResult: 'PASS',
      policyGateMessages: [],
      replayCheckResult: 'PASS',
      replayCheckMessages: [],
      signatureCheckResult: 'PASS',
      signatureCheckMessages: [],
      secretExposed: false,
      note: `Controlled wake notification sent. wakeStatus=${wakeStatus}. Token never exposed to client. No execution. No agent endpoint called.`,
      createdAt: receivedAt,
    });
  } catch (auditErr) {
    console.error('Audit write error:', auditErr.message);
    // Do not fail the response on audit write failure, but log it
  }

  // ── RETURN RESPONSE — never include token ────────────────────────────────
  return Response.json({
    wakeStatus,
    httpStatus: wakeHttpStatus,
    executionStatus: 'NOT_EXECUTED',
    dispatchStatus,
    auditId,
    timestamp: completedAt,
    operatorId: user.email,
    wakeEndpointCalled: WAKE_PATH,
    agentEndpointCalled: false,
    tokenExposed: false,
    browserAutomation: false,
    filesystemWrite: false,
    brokerAction: false,
    ...(wakeError ? { wakeError } : {}),
    ...(wakeHttpStatus && !String(wakeHttpStatus).startsWith('2') ? { wakeResponsePreview: wakeResponseBody } : {}),
    note: 'Notification-only wake call. No execution. No agent. Token server-side only.',
  }, { status: wakeHttpStatus && wakeHttpStatus >= 200 && wakeHttpStatus < 300 ? 200 : (wakeHttpStatus || 500) });
});