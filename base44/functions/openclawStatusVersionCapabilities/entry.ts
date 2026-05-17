/**
 * openclawStatusVersionCapabilities — Phase 54 Backend
 * Calls ONLY GET /status, GET /version, GET /capabilities from OpenClaw.
 * Never returns, logs, displays, exports, or stores actual secret values.
 * Never returns raw OpenClaw response bodies.
 * No dispatch, execution, trading, broker, wallet, money movement, browser automation, scheduler, polling.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REQUIRED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

const ALLOWED_ENDPOINTS = ['/status', '/version', '/capabilities'];

async function callEndpoint(baseUrl, path, headers) {
  let httpStatus = null;
  let reachable = false;
  let receivedResponse = false;

  const response = await fetch(`${baseUrl}${path}`, { method: 'GET', headers });
  httpStatus = response.status;
  receivedResponse = true;
  reachable = response.ok || (httpStatus >= 200 && httpStatus < 500);

  // Consume body without returning it
  await response.text().catch(() => {});

  return { reachable, httpStatus, receivedResponse };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();

  const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');
  const serviceToken = Deno.env.get('OPENCLAW_SERVICE_TOKEN');
  const cfClientId = Deno.env.get('CF_ACCESS_CLIENT_ID');
  const cfClientSecret = Deno.env.get('CF_ACCESS_CLIENT_SECRET');

  const missingKeys = REQUIRED_ENV_KEYS.filter(k => !Deno.env.get(k));
  if (missingKeys.length > 0) {
    return Response.json({
      routeStatus: 'MISSING_REQUIRED_ENV',
      checkedAt,
      backendRoute: '/api/openclaw/read-only/status-version-capabilities',
      openClawEndpoints: ALLOWED_ENDPOINTS,
      openClawMethod: 'GET',
      openClawStatusSummary: { reachable: false, httpStatus: null, receivedResponse: false, responseBodyReturned: false, summaryType: 'REDACTED_STATUS_SUMMARY' },
      openClawVersionSummary: { reachable: false, httpStatus: null, receivedResponse: false, responseBodyReturned: false, summaryType: 'REDACTED_VERSION_SUMMARY' },
      openClawCapabilitiesSummary: { reachable: false, httpStatus: null, receivedResponse: false, responseBodyReturned: false, summaryType: 'REDACTED_CAPABILITIES_SUMMARY' },
      openClawResponsesRedacted: true,
      rawResponseBodiesReturned: false,
      secretValuesReturned: false,
      dispatchPerformed: false,
      executionPerformed: false,
      tradingPerformed: false,
      moneyMovementPerformed: false,
      browserAutomationPerformed: false,
      schedulerPerformed: false,
      pollingPerformed: false,
      backendCheckMode: 'OPENCLAW_READ_ONLY_STATUS_VERSION_CAPABILITIES',
    });
  }

  // Build auth headers — values never returned in response
  const headers = { 'Accept': 'application/json' };
  if (serviceToken) headers['Authorization'] = `Bearer ${serviceToken}`;
  if (cfClientId) headers['CF-Access-Client-Id'] = cfClientId;
  if (cfClientSecret) headers['CF-Access-Client-Secret'] = cfClientSecret;

  // Call ONLY the three allowed endpoints — never any command/dispatch/execution endpoint
  const [statusResult, versionResult, capabilitiesResult] = await Promise.all([
    callEndpoint(gatewayUrl, '/status', headers),
    callEndpoint(gatewayUrl, '/version', headers),
    callEndpoint(gatewayUrl, '/capabilities', headers),
  ]);

  const allReachable = statusResult.reachable && versionResult.reachable && capabilitiesResult.reachable;

  return Response.json({
    routeStatus: allReachable ? 'READY' : 'OPENCLAW_UNREACHABLE',
    checkedAt,
    backendRoute: '/api/openclaw/read-only/status-version-capabilities',
    openClawEndpoints: ALLOWED_ENDPOINTS,
    openClawMethod: 'GET',
    openClawStatusSummary: {
      reachable: statusResult.reachable,
      httpStatus: statusResult.httpStatus,
      receivedResponse: statusResult.receivedResponse,
      responseBodyReturned: false,
      summaryType: 'REDACTED_STATUS_SUMMARY',
    },
    openClawVersionSummary: {
      reachable: versionResult.reachable,
      httpStatus: versionResult.httpStatus,
      receivedResponse: versionResult.receivedResponse,
      responseBodyReturned: false,
      summaryType: 'REDACTED_VERSION_SUMMARY',
    },
    openClawCapabilitiesSummary: {
      reachable: capabilitiesResult.reachable,
      httpStatus: capabilitiesResult.httpStatus,
      receivedResponse: capabilitiesResult.receivedResponse,
      responseBodyReturned: false,
      summaryType: 'REDACTED_CAPABILITIES_SUMMARY',
    },
    openClawResponsesRedacted: true,
    rawResponseBodiesReturned: false,
    secretValuesReturned: false,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    browserAutomationPerformed: false,
    schedulerPerformed: false,
    pollingPerformed: false,
    backendCheckMode: 'OPENCLAW_READ_ONLY_STATUS_VERSION_CAPABILITIES',
  });
});