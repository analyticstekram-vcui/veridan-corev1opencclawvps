/**
 * tradingViewMcpBridge
 * Phase 2: Local Relay Simulation
 * Backend route for TradingView MCP local CLI bridge.
 *
 * PHASE 2 CHANGES:
 *   - Result normalization schema enforced on all responses
 *   - Relay path preview metadata included in responses
 *   - localStorage audit key: tradingViewMcpBridgeRelayAudit
 *   - Manually verified results for status/quote/screenshot/values/info
 *   - info error classified REVIEW_REQUIRED (TVMCP-21)
 *
 * TODO (Phase 3 — when local relay agent is deployed):
 *   Wire TRADINGVIEW_MCP_BRIDGE_URL + VERIDAN_BRIDGE_TOKEN secrets, then:
 *
 *   const bridgeUrl = Deno.env.get('TRADINGVIEW_MCP_BRIDGE_URL');
 *   const bridgeToken = Deno.env.get('VERIDAN_BRIDGE_TOKEN');
 *   const relayRes = await fetch(`${bridgeUrl}/run`, {
 *     method: 'POST',
 *     headers: { 'Authorization': `Bearer ${bridgeToken}`, 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ command }),
 *   });
 *   const relayData = await relayRes.json();
 *
 * GOVERNANCE CONSTRAINTS (all phases):
 *   - Only SAFE_READ commands allowed: status, quote, ohlcv, values, screenshot, ui-state, discover
 *   - info is REVIEW_REQUIRED (upstream "evaluate is not defined" bug — TVMCP-21)
 *   - Blocked: trade, order, broker, login, credential, password, withdraw, deposit
 *   - executionAllowed: false
 *   - No credentials stored or transmitted
 *   - No trading, order placement, or fund movement
 *   - Relay remains simulation only until Phase 3
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_COMMANDS    = ['status', 'quote', 'ohlcv', 'values', 'screenshot', 'ui-state', 'discover', 'info'];
const BLOCKED_COMMANDS    = ['trade', 'order', 'broker', 'login', 'credential', 'password', 'withdraw', 'deposit'];
const REVIEW_REQUIRED_COMMANDS = ['info'];

const KNOWN_ISSUES = {
  info: 'evaluate is not defined — upstream MCP CLI bug, not a bridge failure. Classified REVIEW_REQUIRED (TVMCP-21).',
};

// Phase 2: manually verified terminal results used as simulation payloads
const VERIFIED_PAYLOADS = {
  status: {
    success: true,
    cdp_connected: true,
    api_available: true,
    chart_symbol: 'CME_MINI_DL:MNQH2026',
    chart_resolution: '240',
    verifiedTerminal: true,
    note: 'Manually verified on local machine. Cloud relay not yet active.',
  },
  quote: {
    success: true,
    symbol: 'CME_MINI_DL:MNQH2026',
    price: null,
    change: null,
    verifiedTerminal: true,
    note: 'Quote structure verified locally. Live price not transmitted in simulation mode.',
  },
  screenshot: {
    success: true,
    filePath: 'C:\\Users\\peter\\tradingview-mcp\\screenshots\\<timestamp>.png',
    savedLocally: true,
    imageDataTransmitted: false,
    verifiedTerminal: true,
    note: 'Screenshot saves to local disk only. No image data sent to cloud.',
  },
  values: {
    success: true,
    indicators: ['EMA_2', 'EMA_25', 'EMA_200', 'MACD'],
    valuesDetected: true,
    verifiedTerminal: true,
    note: 'Indicator values verified on local chart. Live values require relay.',
  },
  ohlcv: {
    symbol: 'CME_MINI_DL:MNQH2026',
    resolution: '240',
    candles: [],
    note: 'OHLCV structure defined. Live candles require active relay.',
  },
  'ui-state': {
    uiState: null,
    note: 'UI state not available until local relay is configured.',
  },
  discover: {
    paths: [],
    note: 'API discovery not available until local relay is configured.',
  },
  info: {
    success: false,
    error: 'evaluate is not defined',
    classification: 'REVIEW_REQUIRED',
    verifiedTerminal: true,
    note: 'Known upstream MCP CLI bug. Not a bridge failure. TVMCP-21.',
  },
};

function normalizeResult({ command, payload, risk, isDryRun, knownIssue, auditId }) {
  return {
    // Normalized schema (TVMCP-15 to TVMCP-22)
    success:            payload.success !== false,
    command,
    symbol:             payload.symbol || payload.chart_symbol || null,
    resolution:         payload.resolution || payload.chart_resolution || null,
    timestamp:          new Date().toISOString(),
    payload,
    riskClass:          risk,
    executionStatus:    'NOT_EXECUTED',
    auditId,
    reviewedByOperator: false,
    // Bridge metadata
    ok:                 payload.success !== false,
    risk,
    isDryRun,
    bridgeMode:         'READ_ONLY',
    executionAllowed:   false,
    dispatchStatus:     'NOT_DISPATCHED',
    relayStatus:        'NOT_CONNECTED_TO_LIVE_BACKEND',
    localPath:          'C:\\Users\\peter\\tradingview-mcp',
    cliFormat:          `npm run tv -- ${command}`,
    phase:              'PHASE_2_LOCAL_RELAY_SIMULATION',
    knownIssue:         knownIssue || null,
    // Audit key reference for frontend
    auditLogKey:        'tradingViewMcpBridgeRelayAudit',
    data:               payload,
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
    const { command } = body;

    if (!command) {
      return Response.json({ error: 'command is required' }, { status: 400 });
    }

    // Block forbidden commands
    if (BLOCKED_COMMANDS.includes(command.toLowerCase())) {
      return Response.json({
        ok: false,
        success: false,
        command,
        risk: 'BLOCKED',
        riskClass: 'BLOCKED',
        error: `Command "${command}" is blocked by bridge governance policy.`,
        blockedCommands: BLOCKED_COMMANDS,
        executionAllowed: false,
        executionStatus: 'BLOCKED',
        bridgeMode: 'READ_ONLY',
        timestamp: new Date().toISOString(),
        phase: 'PHASE_2_LOCAL_RELAY_SIMULATION',
      });
    }

    // Only allow known commands
    if (!ALLOWED_COMMANDS.includes(command.toLowerCase())) {
      return Response.json({
        ok: false,
        success: false,
        command,
        risk: 'BLOCKED',
        riskClass: 'BLOCKED',
        error: `Command "${command}" is not in the allowed command list.`,
        allowedCommands: ALLOWED_COMMANDS,
        executionAllowed: false,
        executionStatus: 'BLOCKED',
        bridgeMode: 'READ_ONLY',
        timestamp: new Date().toISOString(),
        phase: 'PHASE_2_LOCAL_RELAY_SIMULATION',
      });
    }

    const risk = REVIEW_REQUIRED_COMMANDS.includes(command.toLowerCase()) ? 'REVIEW_REQUIRED' : 'SAFE_READ';
    const payload = VERIFIED_PAYLOADS[command] || { note: 'No simulation payload for this command.' };
    const auditId = `TVMCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    return Response.json(normalizeResult({
      command,
      payload,
      risk,
      isDryRun: true,
      knownIssue: KNOWN_ISSUES[command] || null,
      auditId,
    }));

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});