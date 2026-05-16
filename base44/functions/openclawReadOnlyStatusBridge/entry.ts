/**
 * openclawReadOnlyStatusBridge
 * Real server-side read-only bridge to OpenClaw status endpoints.
 * Injects Cloudflare Access and service token server-side only.
 *
 * SAFETY CONTRACT:
 *   - GET only — no mutation methods
 *   - No command dispatch
 *   - No browser automation
 *   - No secrets exposed to frontend
 *   - Only /health /status /version /capabilities allowed
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user   = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { endpoint, requestId, mode } = body;

  // Block any explicit mutation mode in payload
  if (mode && mode !== 'READ_ONLY') {
    return Response.json({ error: `mode "${mode}" not allowed. Only READ_ONLY is accepted.`, allowed: false }, { status: 400 });
  }

  // Block any command/dispatch/execution payloads
  const forbidden = ['command', 'dispatch', 'execute', 'payload', 'selector', 'inputText', 'trade'];
  for (const key of forbidden) {
    if (key in body) {
      return Response.json({
        error:               `Forbidden field: "${key}" — no command or dispatch payloads allowed`,
        allowed:             false,
        executionAttempted:  false,
        openClawCommandSent: false,
        secretExposed:       false,
      }, { status: 400 });
    }
  }

  const requestedEndpoint = endpoint || '/status';
  const callId = 'robs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  if (!ALLOWED_ENDPOINTS.includes(requestedEndpoint)) {
    return Response.json({
      callId,
      endpoint:            requestedEndpoint,
      allowed:             false,
      rejectedReason:      `Endpoint "${requestedEndpoint}" not in allowed set`,
      executionAttempted:  false,
      openClawCommandSent: false,
      browserToolUsed:     false,
      secretExposed:       false,
      gatewayMode:         'READ_ONLY',
      executionLock:       'LOCKED',
      timestamp:           now,
    }, { status: 400 });
  }

  // ── Real gateway call — credentials injected server-side only ────────────────
  const gatewayUrl  = Deno.env.get('OPENCLAW_GATEWAY_URL') || '';
  const cfClientId  = Deno.env.get('CF_ACCESS_CLIENT_ID') || '';
  const cfClientSec = Deno.env.get('CF_ACCESS_CLIENT_SECRET') || '';
  const svcToken    = Deno.env.get('OPENCLAW_SERVICE_TOKEN') || '';

  let httpStatus      = null;
  let reachable       = false;
  let gatewayStatus   = 'UNKNOWN';
  let cfAccessDetected = false;
  let rawSafeFields   = {};

  if (gatewayUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const headers = { 'Accept': 'application/json' };
    if (cfClientId)  headers['CF-Access-Client-Id']     = cfClientId;
    if (cfClientSec) headers['CF-Access-Client-Secret'] = cfClientSec;
    if (svcToken)    headers['Authorization']           = `Bearer ${svcToken}`;

    const resp = await fetch(gatewayUrl + requestedEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timer);

    if (resp) {
      httpStatus = resp.status;
      reachable  = resp.status < 500;
      cfAccessDetected = !!resp.headers.get('cf-ray') || resp.status === 403;

      if (resp.status === 200) {
        gatewayStatus = 'ONLINE';
        const json = await resp.json().catch(() => ({}));
        // Only surface safe non-sensitive fields
        rawSafeFields = {
          status:      json.status      ?? null,
          version:     json.version     ?? null,
          health:      json.health      ?? null,
          uptime:      json.uptime      ?? null,
          gatewayMode: json.gatewayMode ?? null,
          capabilities: Array.isArray(json.capabilities) ? json.capabilities : null,
        };
      } else if (resp.status === 403) {
        gatewayStatus = 'CLOUDFLARE_PROTECTED';
      } else if (resp.status === 404) {
        gatewayStatus = 'ENDPOINT_NOT_FOUND';
      } else {
        gatewayStatus = `HTTP_${resp.status}`;
      }
    } else {
      gatewayStatus = 'UNREACHABLE';
    }
  } else {
    gatewayStatus = 'GATEWAY_URL_NOT_CONFIGURED';
  }

  return Response.json({
    callId,
    requestId:           requestId || null,
    endpoint:            requestedEndpoint,
    method:              'GET',
    allowed:             true,
    httpStatus,
    reachable,
    gatewayStatus,
    gatewayMode:         'READ_ONLY',
    executionLocked:     true,
    cfAccessDetected,
    timestamp:           now,
    operatorId:          user.email,
    safeResponseFields:  rawSafeFields,
    executionAttempted:  false,
    openClawCommandSent: false,
    browserToolUsed:     false,
    secretExposed:       false,
    note:                'Read-only status bridge. No command dispatch. No execution. No secrets exposed.',
  });
});