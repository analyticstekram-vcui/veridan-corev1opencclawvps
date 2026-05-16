import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GATEWAY_URL = 'https://openclaw.veridancore.com';
const GATEWAY_WS  = 'wss://openclaw.veridancore.com';
const OPENCLAW_VERSION = '2026.5.2';
const CDP_PORT = 18800;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Parse request body for authenticated endpoint checks
  let payload = {};
  try {
    if (req.method === 'POST') {
      payload = await req.json();
    }
  } catch {}

  const endpoint = payload.endpoint || '';
  const method = payload.method || 'GET';
  const requestId = payload.requestId || '';
  const mode = payload.mode || 'READ_ONLY';

  // Allowlist endpoints
  const ALLOWLISTED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

  // Validate request (frontend must only send these)
  if (method !== 'GET') {
    return Response.json({
      ok: false,
      status: 'REJECTED_BY_BACKEND',
      reason: 'Only GET method allowed',
      gatewayReachable: false,
      executionLock: 'LOCKED',
      dispatchAllowed: false,
    }, { status: 400 });
  }

  // If endpoint is specified, validate it's allowlisted
  if (endpoint && !ALLOWLISTED_ENDPOINTS.includes(endpoint)) {
    return Response.json({
      ok: false,
      status: 'REJECTED_BY_BACKEND',
      reason: 'Endpoint not allowlisted',
      gatewayReachable: false,
      executionLock: 'LOCKED',
      dispatchAllowed: false,
    }, { status: 400 });
  }

  // Backend reads secrets only from environment
  const baseUrl = Deno.env.get('OPENCLAW_GATEWAY_URL') || Deno.env.get('OPENCLAW_BASE_URL') || GATEWAY_URL;
  const openclawToken = Deno.env.get('OPENCLAW_SERVICE_TOKEN') || '';
  const cfClientId = Deno.env.get('CF_ACCESS_CLIENT_ID') || '';
  const cfClientSecret = Deno.env.get('CF_ACCESS_CLIENT_SECRET') || '';

  // Diagnostic booleans (no secret values exposed)
  const hasGatewayUrl = !!baseUrl;
  const hasOpenClawToken = !!openclawToken;
  const hasCfClientId = !!cfClientId;
  const hasCfClientSecret = !!cfClientSecret;

  // Check if required env vars are present
  if (!baseUrl || !hasGatewayUrl) {
    return Response.json({
      ok: false,
      status: 'HOLD_FOR_BACKEND_ENV',
      httpStatus: null,
      gatewayReachable: false,
      cfAccessDetected: false,
      endpoint,
      method: 'GET',
      responseSummary: 'Backend configuration missing',
      durationMs: 0,
      requestId,
      mode: 'READ_ONLY',
      executionLock: 'LOCKED',
      dispatchAllowed: false,
      executionAllowed: false,
      openClawCommandSent: false,
      executionAttempted: false,
      browserToolUsed: false,
      credentialExposed: false,
      secretExposed: false,
      tradingAttempted: false,
      brokerActionsAttempted: false,
      walletActionsAttempted: false,
      moneyMovementAttempted: false,
      mutationMethodUsed: false,
      hasGatewayUrl,
      hasOpenClawToken,
      hasCfClientId,
      hasCfClientSecret,
      redirectDetected: false,
    });
  }

  // Build request URL (endpoint or base URL)
  const targetUrl = endpoint ? `${baseUrl}${endpoint}` : baseUrl;
  const startTime = Date.now();

  // Build headers with secrets injected server-side only
  const headers = new Headers({
    'User-Agent': 'VeridanCore-HealthCheck/1.0',
  });

  // Inject Cloudflare Access headers if available (server-side only)
  if (cfClientId && cfClientSecret) {
    headers.set('CF-Access-Client-Id', cfClientId);
    headers.set('CF-Access-Client-Secret', cfClientSecret);
  }

  // Inject OpenClaw token if available (server-side only)
  if (openclawToken) {
    headers.set('Authorization', `Bearer ${openclawToken}`);
  }

  let httpStatus = null;
  let gatewayReachable = false;
  let cfAccessDetected = false;
  let responseSummary = '';
  let errorMessage = null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers,
    });

    httpStatus = res.status;
    const durationMs = Date.now() - startTime;
    let redirectDetected = false;

    if (res.status === 200) {
      gatewayReachable = true;
      responseSummary = 'OpenClaw gateway returned HTTP 200 — endpoint accessible.';
    } else if ([301, 302, 307, 308].includes(res.status)) {
      gatewayReachable = true;
      cfAccessDetected = true;
      redirectDetected = true;
      responseSummary = `Cloudflare Access redirect (HTTP ${res.status}) — authentication required.`;
    } else if ([401, 403].includes(res.status)) {
      gatewayReachable = true;
      cfAccessDetected = true;
      responseSummary = `Cloudflare Access enforced (HTTP ${res.status}).`;
    } else if (res.status >= 500) {
      gatewayReachable = false;
      responseSummary = `OpenClaw gateway server error HTTP ${res.status}.`;
    } else {
      gatewayReachable = true;
      responseSummary = `OpenClaw gateway responded HTTP ${res.status}.`;
    }

    clearTimeout(timeout);

    const status = gatewayReachable ? (cfAccessDetected ? 'HOLD_FOR_AUTH_BOUNDARY' : 'SUCCESS') : 'HOLD_FOR_GATEWAY_CONNECTIVITY';

    return Response.json({
      ok: status === 'SUCCESS',
      status,
      httpStatus,
      gatewayReachable,
      cfAccessDetected,
      endpoint,
      method: 'GET',
      responseSummary,
      durationMs,
      requestId,
      mode: 'READ_ONLY',
      executionLock: 'LOCKED',
      dispatchAllowed: false,
      executionAllowed: false,
      openClawCommandSent: false,
      executionAttempted: false,
      browserToolUsed: false,
      credentialExposed: false,
      secretExposed: false,
      tradingAttempted: false,
      brokerActionsAttempted: false,
      walletActionsAttempted: false,
      moneyMovementAttempted: false,
      mutationMethodUsed: false,
      hasGatewayUrl,
      hasOpenClawToken,
      hasCfClientId,
      hasCfClientSecret,
      redirectDetected,
    });
  } catch (err) {
    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    let status = 'HOLD_FOR_GATEWAY_CONNECTIVITY';
    let summary = 'OpenClaw gateway unreachable.';

    if (err?.name === 'AbortError') {
      summary = 'Health check timed out after 8s.';
    } else {
      summary = `OpenClaw gateway error: ${err?.message || 'network error'}`;
    }

    return Response.json({
      ok: false,
      status,
      httpStatus: null,
      gatewayReachable: false,
      cfAccessDetected: false,
      endpoint,
      method: 'GET',
      responseSummary: summary,
      durationMs,
      requestId,
      mode: 'READ_ONLY',
      executionLock: 'LOCKED',
      dispatchAllowed: false,
      executionAllowed: false,
      openClawCommandSent: false,
      executionAttempted: false,
      browserToolUsed: false,
      credentialExposed: false,
      secretExposed: false,
      tradingAttempted: false,
      brokerActionsAttempted: false,
      walletActionsAttempted: false,
      moneyMovementAttempted: false,
      mutationMethodUsed: false,
      hasGatewayUrl,
      hasOpenClawToken,
      hasCfClientId,
      hasCfClientSecret,
      redirectDetected: false,
    });
  }
});