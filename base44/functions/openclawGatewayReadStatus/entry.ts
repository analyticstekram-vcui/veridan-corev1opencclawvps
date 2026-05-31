/**
 * openclawGatewayReadStatus
 * READ-ONLY. Calls GET /health, /models, /agents, /commands on the OpenClaw gateway.
 * Returns sanitized summaries only — no raw secrets, no full response bodies.
 * No dispatch, no execution, no browser automation, no vault write, no trading.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');
  const serviceToken = Deno.env.get('OPENCLAW_SERVICE_TOKEN');
  const cfClientId = Deno.env.get('CF_ACCESS_CLIENT_ID');
  const cfClientSecret = Deno.env.get('CF_ACCESS_CLIENT_SECRET');

  if (!gatewayUrl) {
    return Response.json({ status: 'GATEWAY_NOT_CONNECTED', checkedAt: new Date().toISOString() });
  }

  const headers = { 'Accept': 'application/json' };
  if (serviceToken) headers['Authorization'] = `Bearer ${serviceToken}`;
  if (cfClientId) headers['CF-Access-Client-Id'] = cfClientId;
  if (cfClientSecret) headers['CF-Access-Client-Secret'] = cfClientSecret;

  const checkedAt = new Date().toISOString();

  // Helper: safe GET with sanitized response
  async function safeGet(path) {
    try {
      const res = await fetch(`${gatewayUrl}${path}`, { method: 'GET', headers });
      const httpStatus = res.status;
      let bodyText = '';
      try { bodyText = await res.text(); } catch { bodyText = ''; }

      let parsed = null;
      try { parsed = JSON.parse(bodyText); } catch { parsed = null; }

      return { ok: res.ok, httpStatus, bodyText: bodyText.slice(0, 800), parsed };
    } catch (e) {
      const msg = e?.message || '';
      const isCors = msg.includes('CORS') || msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch');
      return { ok: false, httpStatus: null, bodyText: '', parsed: null, error: isCors ? 'CORS_OR_ACCESS_BLOCKED' : msg.slice(0, 200) };
    }
  }

  // ── /health ────────────────────────────────────────────────────────────────
  const health = await safeGet('/health');
  let healthStatus = 'HEALTH_CHECK_FAILED';
  let healthRaw = null;
  if (health.ok) {
    const p = health.parsed;
    const s = (p?.status || p?.health || '').toString().toLowerCase();
    healthStatus = (p?.ok === true || s === 'live' || s === 'healthy' || s === 'ok') ? 'live' : (s || 'HEALTH_CHECK_FAILED');
    healthRaw = { ok: p?.ok, status: p?.status, health: p?.health };
  } else if (health.error === 'CORS_OR_ACCESS_BLOCKED') {
    healthStatus = 'CORS_OR_ACCESS_BLOCKED';
  }

  // ── /models ────────────────────────────────────────────────────────────────
  const models = await safeGet('/models');
  let defaultModel = 'MODEL_UNKNOWN';
  let modelsRaw = null;
  if (models.ok) {
    const body = models.bodyText || '';
    const p = models.parsed;
    if (body.includes('gpt-4.1-mini') || body.includes('gpt-4.1')) {
      defaultModel = 'gpt-4.1-mini';
    } else if (body.includes('gpt-4o')) {
      defaultModel = 'gpt-4o';
    } else if (body.includes('gpt-4')) {
      defaultModel = 'gpt-4';
    } else if (p?.defaultModel) {
      defaultModel = String(p.defaultModel).slice(0, 80);
    } else if (p?.model) {
      defaultModel = String(p.model).slice(0, 80);
    } else if (Array.isArray(p) && p.length > 0) {
      defaultModel = String(p[0]?.id || p[0]?.name || p[0]).slice(0, 80);
    } else if (body.trim().length > 0) {
      defaultModel = 'DETECTED';
    }
    modelsRaw = Array.isArray(p) ? { count: p.length, first: p[0] } : (p ? { summary: Object.keys(p).slice(0, 5) } : { raw: body.slice(0, 100) });
  } else if (models.error === 'CORS_OR_ACCESS_BLOCKED') {
    defaultModel = 'CORS_OR_ACCESS_BLOCKED';
  } else if (!models.ok) {
    defaultModel = 'MODELS_CHECK_FAILED';
  }

  // ── /agents ────────────────────────────────────────────────────────────────
  const agents = await safeGet('/agents');
  let agentsAvailable = 'AGENTS_UNKNOWN';
  let agentsRaw = null;
  if (agents.ok) {
    const p = agents.parsed;
    const body = agents.bodyText || '';
    if (Array.isArray(p)) {
      agentsAvailable = p.length;
      agentsRaw = { count: p.length, names: p.slice(0, 5).map(a => a?.name || a?.id || String(a)).filter(Boolean) };
    } else if (p && typeof p === 'object') {
      const keys = Object.keys(p);
      agentsAvailable = keys.length > 0 ? keys.length : 'DETECTED';
      agentsRaw = { keys: keys.slice(0, 5) };
    } else if (body.trim().length > 0) {
      agentsAvailable = 'DETECTED';
      agentsRaw = { raw: body.slice(0, 100) };
    }
  } else if (agents.error === 'CORS_OR_ACCESS_BLOCKED') {
    agentsAvailable = 'CORS_OR_ACCESS_BLOCKED';
  } else if (!agents.ok) {
    agentsAvailable = 'AGENTS_CHECK_FAILED';
  }

  // ── /commands ──────────────────────────────────────────────────────────────
  const commands = await safeGet('/commands');
  let commandsAvailable = 'COMMANDS_UNKNOWN';
  let commandsRaw = null;
  if (commands.ok) {
    const p = commands.parsed;
    const body = commands.bodyText || '';
    if (Array.isArray(p)) {
      commandsAvailable = p.length;
      commandsRaw = { count: p.length, names: p.slice(0, 5).map(c => c?.name || c?.id || String(c)).filter(Boolean) };
    } else if (p && typeof p === 'object') {
      const keys = Object.keys(p);
      commandsAvailable = keys.length > 0 ? keys.length : 'DETECTED';
      commandsRaw = { keys: keys.slice(0, 5) };
    } else if (body.trim().length > 0) {
      commandsAvailable = 'DETECTED';
      commandsRaw = { raw: body.slice(0, 100) };
    }
  } else if (commands.error === 'CORS_OR_ACCESS_BLOCKED') {
    commandsAvailable = 'CORS_OR_ACCESS_BLOCKED';
  } else if (!commands.ok) {
    commandsAvailable = 'COMMANDS_CHECK_FAILED';
  }

  return Response.json({
    status: 'READ_ONLY_STATUS_COMPLETE',
    checkedAt,
    health: healthStatus,
    httpStatus: health.httpStatus,
    gatewayOnline: health.ok,
    defaultModel,
    agentsAvailable,
    commandsAvailable,
    uptime: 'NOT_REPORTED',
    rawPreviews: {
      health: healthRaw,
      models: modelsRaw,
      agents: agentsRaw,
      commands: commandsRaw,
    },
    endpointResults: {
      health: health.ok ? 'OK' : (health.error || `HTTP_${health.httpStatus}`),
      models: models.ok ? 'OK' : (models.error || `HTTP_${models.httpStatus}`),
      agents: agents.ok ? 'OK' : (agents.error || `HTTP_${agents.httpStatus}`),
      commands: commands.ok ? 'OK' : (commands.error || `HTTP_${commands.httpStatus}`),
    },
    // Safety attestation
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    browserAutomationPerformed: false,
    vaultWritePerformed: false,
    credentialsExposed: false,
    backendCheckMode: 'OPENCLAW_READ_ONLY_MULTI_ENDPOINT_STATUS',
  });
});