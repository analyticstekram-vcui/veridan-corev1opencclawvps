/**
 * tradingViewMcpStatus
 * Read-only status/quote relay for the TradingView MCP bridge.
 *
 * Endpoint routing:
 *   health check  → GET {RELAY_BASE_URL}/health
 *   status check  → GET {RELAY_BASE_URL}/relay?command=status
 *   quote check   → GET {RELAY_BASE_URL}/relay?command=quote
 *
 * SAFETY CONTRACT:
 *   - GET-only, allowlisted commands only
 *   - No trade, broker, credential, money movement terms sent
 *   - No secrets exposed in response
 *   - executionStatus always NOT_EXECUTED
 *   - liveTrading, brokerConnection, moneyMovement, credentialAccess always DISABLED
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_COMMANDS = ['status', 'quote'];

function makeEnvelope({ command, status, httpStatus = null, relayReachable = false, data = null, error = null, notes = null }) {
  return {
    ok:               status === 'SUCCESS' || status === 'CONNECTED_READ_ONLY' || status === 'QUOTE_CONNECTED',
    command,
    status,
    httpStatus,
    relayReachable,
    data,
    error,
    notes,
    executionStatus:  'NOT_EXECUTED',
    dispatchAllowed:  false,
    executionAllowed: false,
    liveTrading:      'DISABLED',
    brokerConnection: 'DISABLED',
    credentialAccess: 'DISABLED',
    moneyMovement:    'DISABLED',
    riskClass:        'SAFE_READ',
    timestamp:        new Date().toISOString(),
  };
}

function sanitizeRelayResponse(data) {
  if (typeof data !== 'object' || data === null) return data;
  const BLOCKED_KEYS = ['password', 'secret', 'token', 'apiKey', 'api_key', 'credential', 'auth', 'private_key', 'access_token', 'refresh_token'];
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (BLOCKED_KEYS.some(bk => k.toLowerCase().includes(bk))) continue;
    out[k] = typeof v === 'object' && v !== null ? sanitizeRelayResponse(v) : v;
  }
  return out;
}

async function fetchRelay(url, headers) {
  const res = await fetch(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(8000),
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { ok: res.ok, httpStatus: res.status, body };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const command = (body?.command || '').toLowerCase().trim();

    if (!ALLOWED_COMMANDS.includes(command)) {
      return Response.json(makeEnvelope({
        command,
        status: 'BLOCKED_BY_POLICY',
        error: `Command "${command}" is not allowed. Allowed: ${ALLOWED_COMMANDS.join(', ')}`,
      }));
    }

    const relayBase = Deno.env.get('TRADINGVIEW_MCP_RELAY_URL');
    if (!relayBase) {
      return Response.json(makeEnvelope({
        command,
        status: 'HOLD_FOR_BACKEND_ENV',
        error: 'TRADINGVIEW_MCP_RELAY_URL is not set.',
      }));
    }

    const relayToken = Deno.env.get('TRADINGVIEW_MCP_RELAY_TOKEN') || null;
    const headers = { 'Content-Type': 'application/json' };
    if (relayToken) headers['Authorization'] = `Bearer ${relayToken}`;

    // Step 1 — health check
    let healthOk = false;
    try {
      const health = await fetchRelay(`${relayBase}/health`, headers);
      healthOk = health.ok;
    } catch {
      healthOk = false;
    }

    // Step 2 — relay command
    const relayUrl = `${relayBase}/relay?command=${encodeURIComponent(command)}`;
    let relayResult;
    try {
      relayResult = await fetchRelay(relayUrl, headers);
    } catch (fetchErr) {
      // Health worked but relay failed
      const notes = healthOk
        ? '/health reachable but /relay?command=' + command + ' failed.'
        : 'Relay unreachable. Verify veridan-tv-mcp process is running.';
      return Response.json(makeEnvelope({
        command,
        status: 'HOLD_FOR_MCP_RELAY',
        relayReachable: healthOk,
        error: fetchErr.message || 'Relay fetch error',
        notes,
      }));
    }

    const { ok: relayOk, httpStatus, body: responseData } = relayResult;
    const relayReachable = httpStatus >= 200 && httpStatus < 500;

    if (!relayOk) {
      return Response.json(makeEnvelope({
        command,
        status: 'HOLD_FOR_MCP_RELAY',
        httpStatus,
        relayReachable,
        data: responseData,
        error: `/relay?command=${command} returned HTTP ${httpStatus}`,
        notes: healthOk ? '/health OK but relay command failed.' : 'Relay unreachable.',
      }));
    }

    const safeData = responseData ? sanitizeRelayResponse(responseData) : null;

    // Status label based on command
    const successStatus = command === 'quote' ? 'QUOTE_CONNECTED' : 'CONNECTED_READ_ONLY';

    return Response.json({
      ...makeEnvelope({
        command,
        status: successStatus,
        httpStatus,
        relayReachable: true,
        data: safeData,
      }),
      healthOk,
      // Convenience fields for the monitoring console
      cdpConnected:    safeData?.cdp_connected    ?? null,
      chartSymbol:     safeData?.chart_symbol     ?? safeData?.symbol     ?? null,
      chartResolution: safeData?.chart_resolution ?? null,
      stdout:          safeData?.stdout           ?? null,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});