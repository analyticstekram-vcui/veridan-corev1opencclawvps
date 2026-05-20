/**
 * tradingViewMcpStatus
 * Read-only status check relay for the TradingView MCP bridge.
 * SAFETY CONTRACT:
 *   - GET-only requests to the local relay
 *   - Allowlisted commands only — blocked list enforced
 *   - No secrets exposed in response
 *   - No arbitrary URL input accepted
 *   - No arbitrary shell commands
 *   - No browser write actions
 *   - No trading, no broker, no credentials, no money movement
 *   - Returns standardized JSON envelopes only
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_COMMANDS = ['health', 'status', 'quote', 'values', 'screenshot', 'ui-state', 'discover', 'range', 'stream'];
const BLOCKED_COMMANDS = ['trade', 'order', 'buy', 'sell', 'close', 'flatten', 'broker', 'login', 'password', 'credential', 'withdraw', 'deposit', 'transfer'];

function makeEnvelope({ command, status, httpStatus = null, relayReachable = false, data = null, error = null, notes = null }) {
  return {
    ok: status === 'SUCCESS',
    command,
    status,
    httpStatus,
    relayReachable,
    data,
    error,
    notes,
    executionStatus: 'NOT_EXECUTED',
    dispatchAllowed: false,
    executionAllowed: false,
    liveTrading: 'DISABLED',
    brokerConnection: 'DISABLED',
    credentialAccess: 'DISABLED',
    moneyMovement: 'DISABLED',
    timestamp: new Date().toISOString(),
  };
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

    // Reject blocked commands
    if (BLOCKED_COMMANDS.some(b => command === b || command.startsWith(b))) {
      return Response.json(makeEnvelope({
        command,
        status: 'BLOCKED_BY_POLICY',
        error: `Command "${command}" is on the blocked list. No trade/order/broker/credential commands allowed.`,
        notes: `Blocked commands: ${BLOCKED_COMMANDS.join(', ')}`,
      }));
    }

    // Reject commands not on allowlist
    if (!ALLOWED_COMMANDS.includes(command)) {
      return Response.json(makeEnvelope({
        command,
        status: 'BLOCKED_BY_POLICY',
        error: `Command "${command}" is not on the allowlist.`,
        notes: `Allowed: ${ALLOWED_COMMANDS.join(', ')}`,
      }));
    }

    // Check for required env var
    const relayUrl = Deno.env.get('TRADINGVIEW_MCP_RELAY_URL');
    if (!relayUrl) {
      return Response.json(makeEnvelope({
        command,
        status: 'HOLD_FOR_BACKEND_ENV',
        error: 'TRADINGVIEW_MCP_RELAY_URL environment variable is not set.',
        notes: 'Set TRADINGVIEW_MCP_RELAY_URL to the local relay endpoint.',
      }));
    }

    // Optional relay token (never exposed in response)
    const relayToken = Deno.env.get('TRADINGVIEW_MCP_RELAY_TOKEN') || null;

    // Build headers — token presence only, value never returned
    const headers = { 'Content-Type': 'application/json' };
    if (relayToken) {
      headers['Authorization'] = `Bearer ${relayToken}`;
    }

    // Make GET-only request to relay
    const startTime = Date.now();
    let fetchResponse;
    try {
      fetchResponse = await fetch(`${relayUrl}/mcp/${command}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(8000),
      });
    } catch (fetchErr) {
      return Response.json(makeEnvelope({
        command,
        status: 'HOLD_FOR_MCP_RELAY',
        relayReachable: false,
        error: fetchErr.message || 'Relay unreachable',
        notes: 'Verify the local relay process (veridan-tv-mcp) is running and TRADINGVIEW_MCP_RELAY_URL is correct.',
      }));
    }

    const durationMs = Date.now() - startTime;
    const httpStatus = fetchResponse.status;
    let responseData = null;

    try {
      responseData = await fetchResponse.json();
    } catch {
      responseData = null;
    }

    const relayReachable = httpStatus >= 200 && httpStatus < 500;

    if (!fetchResponse.ok) {
      return Response.json(makeEnvelope({
        command,
        status: 'HOLD_FOR_MCP_RELAY',
        httpStatus,
        relayReachable,
        data: responseData,
        error: `Relay returned HTTP ${httpStatus}`,
        notes: 'Check relay process health.',
      }));
    }

    // Strip any secret-like fields from relay response before forwarding
    const safeData = responseData ? sanitizeRelayResponse(responseData) : null;

    return Response.json({
      ...makeEnvelope({
        command,
        status: 'SUCCESS',
        httpStatus,
        relayReachable: true,
        data: safeData,
      }),
      durationMs,
      cdpConnected: safeData?.cdp_connected ?? null,
      chartSymbol: safeData?.chart_symbol ?? null,
      chartResolution: safeData?.chart_resolution ?? null,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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