/**
 * tradingViewMcpNavigateChart
 * Phase 5 — Governed Chart Navigation for TradingView MCP
 *
 * SAFETY CONTRACT:
 *   - NOT trading. NOT broker execution. Does NOT place orders.
 *   - Does NOT access credentials. Does NOT move money.
 *   - ONLY changes the TradingView browser chart symbol/timeframe view.
 *   - Requires explicit operatorApproval = true in payload.
 *   - Allowlisted command only: navigate_chart
 *   - Blocked word validation on all user inputs.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_TIMEFRAMES = ['1', '5', '15', '30', '60', '240', 'D', 'W'];
const ALLOWED_CHART_TYPES = ['candlestick', 'bars', 'line'];
const BLOCKED_WORDS = ['buy', 'sell', 'order', 'trade', 'close', 'flatten', 'broker', 'login', 'password', 'credential', 'withdraw', 'deposit', 'transfer'];

function generateAuditId() {
  return `TVNAV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function containsBlockedWord(str) {
  if (!str) return false;
  const lower = str.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

function makeEnvelope({ auditId, status, relayReachable = false, data = null, error = null, symbol = null, timeframe = null, chartType = null, operatorApproval = false }) {
  return {
    auditId,
    timestamp:               new Date().toISOString(),
    command:                 'navigate_chart',
    status,
    relayReachable,
    data,
    error,
    symbol,
    timeframe,
    chartType,
    executionStatus:         'BROWSER_NAVIGATION_ONLY',
    tradingAttempted:        false,
    brokerActionsAttempted:  false,
    walletActionsAttempted:  false,
    moneyMovementAttempted:  false,
    credentialExposed:       false,
    liveTrading:             'DISABLED',
    brokerConnection:        'DISABLED',
    credentialAccess:        'DISABLED',
    moneyMovement:           'DISABLED',
    riskClass:               'SAFE_BROWSER_NAVIGATION',
    operatorApproval,
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
    const { symbol, timeframe, chartType = 'candlestick', operatorReason, operatorNote, operatorApproval } = body;

    const auditId = generateAuditId();

    // Require explicit operator approval
    if (operatorApproval !== true) {
      return Response.json(makeEnvelope({
        auditId, status: 'REJECTED_NO_APPROVAL',
        error: 'operatorApproval must be explicitly true. This is a governed navigation action.',
        operatorApproval: false,
      }));
    }

    // Validate required fields
    if (!symbol || !symbol.trim()) {
      return Response.json(makeEnvelope({ auditId, status: 'REJECTED_VALIDATION', error: 'symbol is required.', operatorApproval: true }));
    }
    if (!timeframe || !timeframe.trim()) {
      return Response.json(makeEnvelope({ auditId, status: 'REJECTED_VALIDATION', error: 'timeframe is required.', operatorApproval: true }));
    }
    if (!operatorReason || !operatorReason.trim()) {
      return Response.json(makeEnvelope({ auditId, status: 'REJECTED_VALIDATION', error: 'operatorReason is required.', operatorApproval: true }));
    }

    // Validate timeframe allowlist
    if (!ALLOWED_TIMEFRAMES.includes(timeframe.trim())) {
      return Response.json(makeEnvelope({
        auditId, status: 'REJECTED_VALIDATION',
        error: `timeframe "${timeframe}" is not allowed. Allowed: ${ALLOWED_TIMEFRAMES.join(', ')}`,
        operatorApproval: true,
      }));
    }

    // Validate chartType allowlist
    if (!ALLOWED_CHART_TYPES.includes(chartType.trim())) {
      return Response.json(makeEnvelope({
        auditId, status: 'REJECTED_VALIDATION',
        error: `chartType "${chartType}" is not allowed. Allowed: ${ALLOWED_CHART_TYPES.join(', ')}`,
        operatorApproval: true,
      }));
    }

    // Blocked word check on all string inputs
    const toCheck = [symbol, timeframe, chartType, operatorReason, operatorNote || ''];
    for (const str of toCheck) {
      if (containsBlockedWord(str)) {
        return Response.json(makeEnvelope({
          auditId, status: 'REJECTED_BLOCKED_WORD',
          error: `Input contains a blocked word. Trading, broker, credential, and money-movement terms are prohibited.`,
          operatorApproval: true,
        }));
      }
    }

    const cleanSymbol    = symbol.trim().toUpperCase();
    const cleanTimeframe = timeframe.trim();
    const cleanChartType = chartType.trim();

    // Check relay URL env var
    const relayUrl = Deno.env.get('TRADINGVIEW_MCP_RELAY_URL');
    if (!relayUrl) {
      return Response.json(makeEnvelope({
        auditId, status: 'HOLD_FOR_BACKEND_ENV',
        error: 'TRADINGVIEW_MCP_RELAY_URL environment variable is not set.',
        symbol: cleanSymbol, timeframe: cleanTimeframe, chartType: cleanChartType,
        operatorApproval: true,
      }));
    }

    const relayToken = Deno.env.get('TRADINGVIEW_MCP_RELAY_TOKEN') || null;
    const headers = { 'Content-Type': 'application/json' };
    if (relayToken) headers['Authorization'] = `Bearer ${relayToken}`;

    // Call relay
    const url = `${relayUrl}/relay?command=navigate_chart&symbol=${encodeURIComponent(cleanSymbol)}&timeframe=${encodeURIComponent(cleanTimeframe)}&chartType=${encodeURIComponent(cleanChartType)}`;

    let fetchResponse;
    try {
      fetchResponse = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });
    } catch (fetchErr) {
      return Response.json(makeEnvelope({
        auditId, status: 'HOLD_FOR_MCP_RELAY',
        relayReachable: false,
        error: fetchErr.message || 'Relay unreachable',
        symbol: cleanSymbol, timeframe: cleanTimeframe, chartType: cleanChartType,
        operatorApproval: true,
      }));
    }

    const httpStatus = fetchResponse.status;
    let responseData = null;
    try { responseData = await fetchResponse.json(); } catch { responseData = null; }

    const relayReachable = httpStatus >= 200 && httpStatus < 500;

    if (!fetchResponse.ok) {
      return Response.json({
        ...makeEnvelope({
          auditId, status: 'HOLD_FOR_MCP_RELAY',
          relayReachable, data: responseData,
          error: `Relay returned HTTP ${httpStatus}`,
          symbol: cleanSymbol, timeframe: cleanTimeframe, chartType: cleanChartType,
          operatorApproval: true,
        }),
        httpStatus,
      });
    }

    return Response.json({
      ...makeEnvelope({
        auditId, status: 'SUCCESS',
        relayReachable: true,
        data: responseData,
        symbol: cleanSymbol, timeframe: cleanTimeframe, chartType: cleanChartType,
        operatorApproval: true,
      }),
      httpStatus,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});