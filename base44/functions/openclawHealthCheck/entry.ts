/**
 * openclawHealthCheck — Phase 50 Backend: OpenClaw Read-Only Health Check Route
 * POST /api/openclaw/read-only/health-check
 *
 * Calls ONLY GET ${OPENCLAW_GATEWAY_URL}/health
 * Never returns, logs, displays, exports, or stores secret values.
 * Does not dispatch commands, execute actions, trade, use broker/wallet/scheduler/polling/browser automation, or move money.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REQUIRED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();

  // Check env presence (values never returned)
  const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');
  const serviceToken = Deno.env.get('OPENCLAW_SERVICE_TOKEN');
  const cfClientId = Deno.env.get('CF_ACCESS_CLIENT_ID');
  const cfClientSecret = Deno.env.get('CF_ACCESS_CLIENT_SECRET');

  const missingKeys = REQUIRED_ENV_KEYS.filter(k => !Deno.env.get(k));
  if (missingKeys.length > 0) {
    return Response.json({
      routeStatus: 'MISSING_REQUIRED_ENV',
      checkedAt,
      backendRoute: '/api/openclaw/read-only/health-check',
      openClawEndpoint: '/health',
      openClawMethod: 'GET',
      openClawReachable: false,
      openClawHealthStatus: 'UNKNOWN',
      httpStatus: null,
      responseSummary: {
        type: 'REDACTED_HEALTH_SUMMARY',
        receivedResponse: false,
        responseBodyReturned: false,
      },
      secretValuesReturned: false,
      openClawResponseRedacted: true,
      dispatchPerformed: false,
      executionPerformed: false,
      tradingPerformed: false,
      moneyMovementPerformed: false,
      browserAutomationPerformed: false,
      schedulerPerformed: false,
      pollingPerformed: false,
      backendCheckMode: 'OPENCLAW_READ_ONLY_HEALTH_CHECK',
    });
  }

  // Build headers — only auth headers, no secret values in response
  const headers = {
    'Accept': 'application/json',
  };
  if (serviceToken) headers['Authorization'] = `Bearer ${serviceToken}`;
  if (cfClientId) headers['CF-Access-Client-Id'] = cfClientId;
  if (cfClientSecret) headers['CF-Access-Client-Secret'] = cfClientSecret;

  // Call ONLY GET /health — no other endpoints
  let httpStatus = null;
  let openClawReachable = false;
  let openClawHealthStatus = 'UNKNOWN';
  let receivedResponse = false;

  const response = await fetch(`${gatewayUrl}/health`, {
    method: 'GET',
    headers,
  });

  httpStatus = response.status;
  receivedResponse = true;
  openClawReachable = response.ok || (httpStatus >= 200 && httpStatus < 500);

  // Determine health status from HTTP code only — body is never returned
  if (httpStatus === 200) {
    openClawHealthStatus = 'HEALTHY';
  } else if (httpStatus >= 500) {
    openClawHealthStatus = 'UNHEALTHY';
  } else if (httpStatus === 401 || httpStatus === 403) {
    openClawHealthStatus = 'UNKNOWN'; // reachable but auth issue
  } else {
    openClawHealthStatus = 'UNKNOWN';
  }

  // Consume body without returning it
  await response.text().catch(() => {});

  return Response.json({
    routeStatus: openClawReachable ? 'READY' : 'OPENCLAW_UNREACHABLE',
    checkedAt,
    backendRoute: '/api/openclaw/read-only/health-check',
    openClawEndpoint: '/health',
    openClawMethod: 'GET',
    openClawReachable,
    openClawHealthStatus,
    httpStatus,
    responseSummary: {
      type: 'REDACTED_HEALTH_SUMMARY',
      receivedResponse,
      responseBodyReturned: false,
    },
    secretValuesReturned: false,
    openClawResponseRedacted: true,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    browserAutomationPerformed: false,
    schedulerPerformed: false,
    pollingPerformed: false,
    backendCheckMode: 'OPENCLAW_READ_ONLY_HEALTH_CHECK',
  });
});