/**
 * tradingViewMcpNavigateChart
 * Phase 5 — Governed Read-Only Chart Verification
 *
 * The VPS relay only supports /health and /relay?command=status|quote.
 * This function runs a governed verification sequence:
 *   1. GET {RELAY_BASE_URL}/health
 *   2. GET {RELAY_BASE_URL}/relay?command=status
 *   3. GET {RELAY_BASE_URL}/relay?command=quote
 *
 * SAFETY CONTRACT:
 *   - NOT trading. NOT broker execution. Does NOT place orders.
 *   - Does NOT access credentials. Does NOT move money.
 *   - Does NOT call navigate or any mutation command.
 *   - Requires explicit operatorApproval = true.
 *   - executionStatus always READ_ONLY_CHECK_ONLY
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BLOCKED_FREEFORM_WORDS = ['login', 'password', 'credential', 'withdraw', 'deposit', 'transfer'];

function generateAuditId() {
  return `TVNAV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function containsBlockedWord(str) {
  if (!str) return false;
  const lower = str.toLowerCase();
  return BLOCKED_FREEFORM_WORDS.some(w => lower.includes(w));
}

function makeSafetyEnvelope(extra = {}) {
  return {
    executionStatus:         'READ_ONLY_CHECK_ONLY',
    tradingAttempted:        false,
    brokerActionsAttempted:  false,
    walletActionsAttempted:  false,
    moneyMovementAttempted:  false,
    credentialExposed:       false,
    liveTrading:             'DISABLED',
    brokerConnection:        'DISABLED',
    credentialAccess:        'DISABLED',
    moneyMovement:           'DISABLED',
    riskClass:               'SAFE_READ',
    operatorApproval:        true,
    ...extra,
  };
}

function sanitize(data) {
  if (typeof data !== 'object' || data === null) return data;
  const BLOCKED_KEYS = ['password', 'secret', 'token', 'apiKey', 'api_key', 'credential', 'auth', 'private_key', 'access_token', 'refresh_token'];
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (BLOCKED_KEYS.some(bk => k.toLowerCase().includes(bk))) continue;
    out[k] = typeof v === 'object' && v !== null ? sanitize(v) : v;
  }
  return out;
}

async function getRelay(url, headers) {
  const res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(8000) });
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
    const { symbol, timeframe, chartType = 'candlestick', operatorReason, operatorNote, operatorApproval } = body;

    const auditId = generateAuditId();

    if (operatorApproval !== true) {
      return Response.json({ ...makeSafetyEnvelope({ operatorApproval: false }), auditId, status: 'REJECTED_NO_APPROVAL', error: 'operatorApproval must be explicitly true.' });
    }
    if (!symbol?.trim()) {
      return Response.json({ ...makeSafetyEnvelope(), auditId, status: 'REJECTED_VALIDATION', error: 'symbol is required.' });
    }
    if (!timeframe?.trim()) {
      return Response.json({ ...makeSafetyEnvelope(), auditId, status: 'REJECTED_VALIDATION', error: 'timeframe is required.' });
    }
    if (!operatorReason?.trim()) {
      return Response.json({ ...makeSafetyEnvelope(), auditId, status: 'REJECTED_VALIDATION', error: 'operatorReason is required.' });
    }

    for (const str of [operatorReason, operatorNote || '']) {
      if (containsBlockedWord(str)) {
        return Response.json({ ...makeSafetyEnvelope(), auditId, status: 'REJECTED_BLOCKED_WORD', error: 'Operator reason/note contains a blocked word (login, password, credential, withdraw, deposit, transfer).' });
      }
    }

    const relayBase = Deno.env.get('TRADINGVIEW_MCP_RELAY_URL');
    if (!relayBase) {
      return Response.json({ ...makeSafetyEnvelope(), auditId, status: 'HOLD_FOR_BACKEND_ENV', error: 'TRADINGVIEW_MCP_RELAY_URL is not set.' });
    }

    const relayToken = Deno.env.get('TRADINGVIEW_MCP_RELAY_TOKEN') || null;
    const headers = { 'Content-Type': 'application/json' };
    if (relayToken) headers['Authorization'] = `Bearer ${relayToken}`;

    // Step 1 — health
    let healthOk = false;
    try {
      const h = await getRelay(`${relayBase}/health`, headers);
      healthOk = h.ok;
    } catch { healthOk = false; }

    // Step 2 — status
    let statusResult = null;
    let statusOk = false;
    try {
      const s = await getRelay(`${relayBase}/relay?command=status`, headers);
      statusOk = s.ok && s.body?.success === true;
      statusResult = s.body ? sanitize(s.body) : null;
    } catch { statusOk = false; }

    // Step 3 — quote
    let quoteResult = null;
    let quoteOk = false;
    try {
      const q = await getRelay(`${relayBase}/relay?command=quote`, headers);
      quoteOk = q.ok && q.body?.success === true;
      quoteResult = q.body ? sanitize(q.body) : null;
    } catch { quoteOk = false; }

    const overallOk = statusOk || quoteOk;

    if (!overallOk) {
      return Response.json({
        ...makeSafetyEnvelope(),
        auditId,
        timestamp:       new Date().toISOString(),
        status:          'HOLD_FOR_MCP_RELAY',
        healthOk,
        statusOk,
        quoteOk,
        error:           healthOk ? '/health OK but relay commands failed.' : 'Relay unreachable.',
        requestedSymbol: symbol.trim().toUpperCase(),
        requestedTf:     timeframe.trim(),
      });
    }

    const chartSymbol =
      quoteResult?.symbol ??
      statusResult?.chart_symbol ??
      symbol.trim().toUpperCase();

    const chartResolution =
      statusResult?.chart_resolution ??
      timeframe.trim();

    return Response.json({
      ...makeSafetyEnvelope(),
      auditId,
      timestamp:       new Date().toISOString(),
      status:          quoteOk ? 'QUOTE_CONNECTED' : 'CONNECTED_READ_ONLY',
      healthOk,
      statusOk,
      quoteOk,
      requestedSymbol: symbol.trim().toUpperCase(),
      requestedTf:     timeframe.trim(),
      chartSymbol,
      chartResolution,
      statusData:      statusResult,
      quoteData:       quoteResult,
      notes:           'Read-only verification complete. navigate_chart is not sent to relay. Chart changes require VPS operator action.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});