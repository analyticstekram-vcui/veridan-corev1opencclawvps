/**
 * tradingViewMcpBridge
 * Backend route placeholder for TradingView MCP local CLI bridge.
 *
 * TODO: This route is a dry-run placeholder. The local TradingView MCP CLI runs on
 * a Windows machine at C:\Users\peter\tradingview-mcp and cannot be reached
 * directly from a cloud backend. To activate this route:
 *
 *   Option A — VPS/local bridge agent:
 *     Deploy a small HTTP relay agent on the local machine that:
 *     1. Accepts POST requests from this backend (authenticated via VERIDAN_BRIDGE_TOKEN)
 *     2. Executes: npm run tv -- <command> in C:\Users\peter\tradingview-mcp
 *     3. Returns stdout/stderr as JSON
 *
 *   Option B — ngrok/cloudflared tunnel:
 *     Expose the local MCP server via a secure tunnel and call it directly.
 *
 *   Option C — Obsidian VPS bridge extension:
 *     Extend the existing obsidianVpsDryRunBridge pattern to support MCP CLI commands.
 *
 * GOVERNANCE CONSTRAINTS:
 *   - Only SAFE_READ commands are allowed: status, quote, ohlcv, values, screenshot, ui-state, discover
 *   - info is classified REVIEW_REQUIRED due to upstream "evaluate is not defined" bug
 *   - Blocked commands: trade, order, broker, login, credential, password, withdraw, deposit
 *   - executionAllowed: false
 *   - No credentials are stored or transmitted
 *   - No trading, order placement, or fund movement
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_COMMANDS = ['status', 'quote', 'ohlcv', 'values', 'screenshot', 'ui-state', 'discover', 'info'];
const BLOCKED_COMMANDS = ['trade', 'order', 'broker', 'login', 'credential', 'password', 'withdraw', 'deposit'];

const REVIEW_REQUIRED_COMMANDS = ['info'];

// Known issues per command
const KNOWN_ISSUES = {
  info: 'evaluate is not defined — upstream MCP CLI bug, not a bridge failure. Classified REVIEW_REQUIRED.',
};

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

    // Block explicitly forbidden commands
    if (BLOCKED_COMMANDS.includes(command.toLowerCase())) {
      return Response.json({
        ok: false,
        command,
        risk: 'BLOCKED',
        error: `Command "${command}" is blocked by bridge governance policy.`,
        blockedCommands: BLOCKED_COMMANDS,
        executionAllowed: false,
        bridgeMode: 'READ_ONLY',
        timestamp: new Date().toISOString(),
      });
    }

    // Only allow known commands
    if (!ALLOWED_COMMANDS.includes(command.toLowerCase())) {
      return Response.json({
        ok: false,
        command,
        risk: 'BLOCKED',
        error: `Command "${command}" is not in the allowed command list.`,
        allowedCommands: ALLOWED_COMMANDS,
        executionAllowed: false,
        bridgeMode: 'READ_ONLY',
        timestamp: new Date().toISOString(),
      });
    }

    const isReviewRequired = REVIEW_REQUIRED_COMMANDS.includes(command.toLowerCase());
    const risk = isReviewRequired ? 'REVIEW_REQUIRED' : 'SAFE_READ';

    // TODO: Replace this dry-run placeholder with actual local relay call.
    // When the local bridge agent is running, replace the block below with:
    //
    //   const bridgeUrl = Deno.env.get('TRADINGVIEW_MCP_BRIDGE_URL');
    //   const bridgeToken = Deno.env.get('VERIDAN_BRIDGE_TOKEN');
    //   const relayRes = await fetch(`${bridgeUrl}/run`, {
    //     method: 'POST',
    //     headers: { 'Authorization': `Bearer ${bridgeToken}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ command }),
    //   });
    //   const relayData = await relayRes.json();
    //   return Response.json({ ok: true, command, risk, data: relayData, ... });

    const DRY_RUN_PLACEHOLDERS = {
      status: {
        mcp_server: 'UNKNOWN',
        cdp_connected: null,
        api_available: null,
        chart_symbol: 'CME_MINI_DL:MNQH2026',
        chart_resolution: '240',
        note: 'DRY_RUN — local MCP CLI not yet reachable from cloud backend',
      },
      quote: {
        symbol: 'CME_MINI_DL:MNQH2026',
        price: null,
        change: null,
        note: 'DRY_RUN — quote not available until local relay is configured',
      },
      ohlcv: {
        symbol: 'CME_MINI_DL:MNQH2026',
        resolution: '240',
        candles: [],
        note: 'DRY_RUN — OHLCV not available until local relay is configured',
      },
      values: {
        indicators: [],
        note: 'DRY_RUN — indicator values not available until local relay is configured',
      },
      screenshot: {
        imageData: null,
        note: 'DRY_RUN — screenshot not available until local relay is configured',
      },
      'ui-state': {
        uiState: null,
        note: 'DRY_RUN — UI state not available until local relay is configured',
      },
      discover: {
        paths: [],
        note: 'DRY_RUN — API discovery not available until local relay is configured',
      },
      info: {
        error: 'evaluate is not defined',
        classification: 'REVIEW_REQUIRED',
        note: 'Known upstream MCP CLI bug. Not a bridge failure. Command classified REVIEW_REQUIRED.',
      },
    };

    return Response.json({
      ok: true,
      command,
      risk,
      isDryRun: true,
      bridgeMode: 'READ_ONLY',
      executionAllowed: false,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      knownIssue: KNOWN_ISSUES[command] || null,
      data: DRY_RUN_PLACEHOLDERS[command] || { note: 'DRY_RUN — no placeholder available for this command' },
      timestamp: new Date().toISOString(),
      localPath: 'C:\\Users\\peter\\tradingview-mcp',
      cliFormat: `npm run tv -- ${command}`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});