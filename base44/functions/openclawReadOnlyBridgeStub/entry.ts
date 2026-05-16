/**
 * openclawReadOnlyBridgeStub
 * STUB ONLY — no real OpenClaw calls, no dispatch, no execution.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw command dispatch
 *   - No browser automation
 *   - No credentials exposed
 *   - No mutation methods
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];
const BLOCKED_METHODS   = ['POST', 'PUT', 'PATCH', 'DELETE'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user   = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));

  // Block all mutation methods
  if (BLOCKED_METHODS.includes(req.method)) {
    return Response.json({
      allowed:             false,
      rejectedReason:      `Method ${req.method} is not allowed. Only GET-style stub requests are accepted.`,
      dispatchAllowed:     false,
      executionAttempted:  false,
      openClawCommandSent: false,
      browserToolUsed:     false,
      secretExposed:       false,
      gatewayMode:         'READ_ONLY',
      executionMode:       'DISABLED',
      executionLock:       'LOCKED',
      note:                'Stub only. No OpenClaw call. No execution. No dispatch.',
    }, { status: 405 });
  }

  const requestedEndpoint = endpoint || '/status';

  if (!ALLOWED_ENDPOINTS.includes(requestedEndpoint)) {
    return Response.json({
      allowed:             false,
      endpointRequested:   requestedEndpoint,
      rejectedReason:      `Endpoint "${requestedEndpoint}" is not in the allowed read-only set: ${ALLOWED_ENDPOINTS.join(', ')}`,
      dispatchAllowed:     false,
      executionAttempted:  false,
      openClawCommandSent: false,
      browserToolUsed:     false,
      secretExposed:       false,
      gatewayMode:         'READ_ONLY',
      executionMode:       'DISABLED',
      executionLock:       'LOCKED',
      note:                'Stub only. No OpenClaw call. No execution. No dispatch.',
    }, { status: 400 });
  }

  const stubId = 'stub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return Response.json({
    stubId,
    endpointRequested:   requestedEndpoint,
    method:              'GET',
    allowed:             true,
    dispatchAllowed:     false,
    executionAttempted:  false,
    openClawCommandSent: false,
    browserToolUsed:     false,
    secretExposed:       false,
    gatewayMode:         'READ_ONLY',
    executionMode:       'DISABLED',
    executionLock:       'LOCKED',
    operatorId:          user.email,
    generatedAt:         new Date().toISOString(),
    previewResponseShape: {
      online:          true,
      status:          'healthy',
      gatewayMode:     'READ_ONLY',
      executionLocked: true,
      cfAccessLayer:   true,
      endpoint:        requestedEndpoint,
    },
    note: 'Stub only. No OpenClaw call. No execution. No dispatch.',
  });
});