/**
 * obsidianBridgeHealthCheck
 * READ-ONLY health check for the Obsidian bridge service.
 * Only calls GET /health, GET /, GET /status.
 * No vault write · No file creation · No OpenClaw dispatch · No InvokeLLM · No mutation.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_READ_ENDPOINTS = ['/health', '/', '/status'];

function sanitizePreview(text, maxLen = 600) {
  if (!text) return null;
  const cleaned = text.slice(0, maxLen);
  // Remove anything that looks like a secret/token/key pattern
  return cleaned.replace(/(sk-[a-zA-Z0-9]{10,}|Bearer\s+\S+|Authorization:\s*\S+|password\s*[:=]\s*\S+)/gi, '[REDACTED]');
}

function classifyResponse(text, httpStatus) {
  if (!text) return 'EMPTY_RESPONSE';
  const lower = text.toLowerCase().trim();
  // Try JSON parse
  try {
    const parsed = JSON.parse(text);
    const health = (parsed.health || parsed.status || parsed.ok || '').toString().toLowerCase();
    if (health === 'true' || health === 'ok' || health === 'live' || health === 'healthy') return 'BRIDGE_LIVE';
    if (health === 'degraded' || health === 'warn') return 'BRIDGE_DEGRADED';
    return 'BRIDGE_LIVE'; // any valid JSON response means bridge is responding
  } catch {
    // Not JSON
    if (lower.includes('cannot get')) return 'BRIDGE_RESPONDING_NO_ROOT_ROUTE';
    if (lower.startsWith('<!doctype') || lower.startsWith('<html')) return 'DETECTED_TEXT_RESPONSE';
    if (httpStatus === 200) return 'BRIDGE_RESPONDING_NO_ROOT_ROUTE';
    return 'DETECTED_TEXT_RESPONSE';
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Primary secret: VERIDAN_OBSIDIAN_BRIDGE_URL
    // Legacy fallback: VERIDAN_BRIDGE_URL (labeled — will be removed once primary is configured)
    const bridgeUrl = Deno.env.get('VERIDAN_OBSIDIAN_BRIDGE_URL') || Deno.env.get('VERIDAN_BRIDGE_URL') || '';
    const bridgeToken = Deno.env.get('VERIDAN_BRIDGE_TOKEN') || '';

    if (!bridgeUrl) {
      return Response.json({
        status: 'BRIDGE_NOT_CONNECTED',
        bridgeLive: false,
        health: 'NOT_CONFIGURED',
        message: 'VERIDAN_OBSIDIAN_BRIDGE_URL is not set. Bridge URL must be configured in app secrets. Legacy fallback VERIDAN_BRIDGE_URL also absent.',
        checkedAt: new Date().toISOString(),
        vaultWrite: 'DISABLED',
        openclawDispatch: 'DISABLED',
      });
    }

    const baseUrl = bridgeUrl.replace(/\/$/, '');
    const checkedAt = new Date().toISOString();

    // Try /health first, then / if /health 404s, then /status
    const endpointsToTry = ['/health', '/', '/status'];
    let lastHttpStatus = null;
    let lastText = null;
    let lastEndpoint = null;
    let latencyMs = null;
    let corsBlocked = false;

    for (const ep of endpointsToTry) {
      const url = `${baseUrl}${ep}`;
      const start = Date.now();
      try {
        const headers = { Accept: 'application/json, text/plain, */*' };
        if (bridgeToken) headers['Authorization'] = `Bearer ${bridgeToken}`;

        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(8000),
        });

        latencyMs = Date.now() - start;
        lastHttpStatus = res.status;
        lastText = await res.text();
        lastEndpoint = ep;

        // Stop on first successful/meaningful response
        if (res.status !== 404) break;
      } catch (fetchErr) {
        latencyMs = Date.now() - start;
        const msg = fetchErr?.message || '';
        if (msg.includes('CORS') || msg.includes('blocked') || msg.includes('NetworkError')) {
          corsBlocked = true;
        }
        // Try next endpoint
      }
    }

    if (corsBlocked && !lastText) {
      return Response.json({
        status: 'CORS_OR_ACCESS_BLOCKED',
        bridgeLive: false,
        health: 'CORS_OR_ACCESS_BLOCKED',
        message: 'Bridge access blocked — check VERIDAN_BRIDGE_TOKEN and VERIDAN_OBSIDIAN_BRIDGE_URL config.',
        checkedAt,
        latencyMs,
        vaultWrite: 'DISABLED',
        openclawDispatch: 'DISABLED',
      });
    }

    if (!lastText && lastHttpStatus === null) {
      return Response.json({
        status: 'BRIDGE_NOT_CONNECTED',
        bridgeLive: false,
        health: 'UNREACHABLE',
        message: 'Bridge did not respond to any allowed endpoint.',
        checkedAt,
        latencyMs,
        vaultWrite: 'DISABLED',
        openclawDispatch: 'DISABLED',
      });
    }

    const responseStatus = classifyResponse(lastText, lastHttpStatus);
    const bridgeLive = responseStatus === 'BRIDGE_LIVE';

    // Parse health field from JSON if possible
    let healthField = responseStatus;
    let rawPreview = null;
    try {
      const parsed = JSON.parse(lastText);
      healthField = parsed.health || parsed.status || (parsed.ok ? 'live' : responseStatus);
      rawPreview = parsed; // already an object, safe
    } catch {
      rawPreview = { rawText: sanitizePreview(lastText, 400) };
      healthField = responseStatus;
    }

    return Response.json({
      status: responseStatus,
      bridgeLive,
      health: String(healthField),
      httpStatus: lastHttpStatus,
      latencyMs,
      endpointChecked: lastEndpoint,
      responseType: (() => {
        try { JSON.parse(lastText); return 'JSON'; } catch { return 'TEXT'; }
      })(),
      message: bridgeLive
        ? 'Bridge is live and responding to health check.'
        : `Bridge responded but health status is: ${responseStatus}`,
      rawPreview,
      checkedAt,
      vaultWrite: 'DISABLED',
      openclawDispatch: 'DISABLED',
      browserAutomation: 'DISABLED',
    });
  } catch (error) {
    return Response.json({ error: error.message, status: 'HEALTH_UNKNOWN' }, { status: 500 });
  }
});