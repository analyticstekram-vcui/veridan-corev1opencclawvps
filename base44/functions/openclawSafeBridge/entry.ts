import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Veridan Bridge (primary) — read at request time, not module-load time ─────
// NOTE: Do NOT cache these at module level; Deno may snapshot env before
//       secrets are injected. Always read fresh on each invocation.
function getBridgeUrl()   { return Deno.env.get('VERIDAN_BRIDGE_URL')   || 'https://bridge.veridancore.com/api/safe-command'; }
function getBridgeToken() { return Deno.env.get('VERIDAN_BRIDGE_TOKEN') || ''; }

// ── Legacy OpenClaw gateway (fallback) ────────────────────────────────────────
const OPENCLAW_GATEWAY_URL   = Deno.env.get('OPENCLAW_GATEWAY_URL')   || 'https://openclaw.veridancore.com';
const CF_CLIENT_ID           = Deno.env.get('CF_ACCESS_CLIENT_ID')    || '';
const CF_CLIENT_SECRET       = Deno.env.get('CF_ACCESS_CLIENT_SECRET')|| '';
const OPENCLAW_SERVICE_TOKEN = Deno.env.get('OPENCLAW_SERVICE_TOKEN') || '';

const ALLOWED_COMMAND_TYPES = new Set([
  'OPEN_URL_AND_READ_TITLE',
  'OPEN_URL_AND_SCREENSHOT',
  'START_SESSION',
  'SESSION_STATUS',
]);

const auditLog = [];

// ── Security validation ───────────────────────────────────────────────────────
function validateRequest({ commandType, targetUrl }) {
  if (!targetUrl || typeof targetUrl !== 'string') return 'targetUrl is required';
  if (!targetUrl.startsWith('https://')) {
    return 'targetUrl must use https://. http://, file://, javascript:, and chrome:// are not allowed.';
  }
  const lower = targetUrl.toLowerCase();
  const blocked = [
    'localhost', '127.0.0.1', '0.0.0.0',
    '192.168.', '10.0.', '10.1.', '10.2.', '10.3.', '10.4.', '10.5.',
    '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.',
    '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
    '172.28.', '172.29.', '172.30.', '172.31.',
    'file://', 'chrome://', 'about:', 'javascript:',
  ];
  for (const p of blocked) {
    if (lower.includes(p)) return `targetUrl contains a blocked pattern: "${p}"`;
  }
  if (!ALLOWED_COMMAND_TYPES.has(commandType)) {
    return `Unknown commandType "${commandType}". Allowed: ${[...ALLOWED_COMMAND_TYPES].join(', ')}`;
  }
  return null;
}

// ── callVeridanBridge ─────────────────────────────────────────────────────────
// Primary: POST to VERIDAN_BRIDGE_URL with Bearer token auth
async function callVeridanBridge(commandType, targetUrl) {
  const VERIDAN_BRIDGE_URL   = getBridgeUrl();
  const VERIDAN_BRIDGE_TOKEN = getBridgeToken();

  // Safe diagnostics — host only, never token value
  let bridgeUrlHost = '(unset)';
  try { bridgeUrlHost = new URL(VERIDAN_BRIDGE_URL).host; } catch (_) { bridgeUrlHost = VERIDAN_BRIDGE_URL.slice(0, 40); }

  const safeDiag = {
    hasBridgeUrl:   !!VERIDAN_BRIDGE_URL && VERIDAN_BRIDGE_URL !== 'https://bridge.veridancore.com/api/safe-command',
    hasBridgeToken: !!VERIDAN_BRIDGE_TOKEN,
    bridgeUrlHost,
  };

  console.log('[openclawSafeBridge] env check:', JSON.stringify(safeDiag));

  if (!VERIDAN_BRIDGE_TOKEN) {
    return {
      status: 'failed',
      error: 'VERIDAN_BRIDGE_TOKEN is not configured. Please set this secret in the dashboard.',
      diagnostics: [
        `bridge_token: MISSING`,
        `bridge_url_host: ${bridgeUrlHost}`,
        `has_bridge_url: ${safeDiag.hasBridgeUrl}`,
      ],
      safeDiag,
      executionMode: 'FAILED',
    };
  }

  const diagnostics = [];
  diagnostics.push(`bridge_url_host: ${bridgeUrlHost}`);
  diagnostics.push(`command_type: ${commandType}`);
  diagnostics.push(`target_url: ${targetUrl}`);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);

  let response;
  try {
    response = await fetch(VERIDAN_BRIDGE_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VERIDAN_BRIDGE_TOKEN}`,
      },
      body: JSON.stringify({ commandType, targetUrl }),
    });
    clearTimeout(t);
  } catch (err) {
    clearTimeout(t);
    const msg = err?.name === 'AbortError' ? 'bridge request timed out after 25s' : (err?.message || 'network error reaching bridge');
    diagnostics.push(`bridge_request: FAILED — ${msg}`);
    return { status: 'failed', error: msg, diagnostics, executionMode: 'FAILED' };
  }

  diagnostics.push(`bridge_http_status: ${response.status}`);

  // Handle auth errors
  if (response.status === 401 || response.status === 403) {
    const msg = `Bridge request unauthorized (HTTP ${response.status}). Check VERIDAN_BRIDGE_TOKEN.`;
    diagnostics.push(`bridge_auth: REJECTED`);
    return { status: 'failed', error: msg, diagnostics, executionMode: 'FAILED' };
  }

  // Handle not found
  if (response.status === 404) {
    const msg = `Bridge endpoint not found (HTTP 404). Verify VERIDAN_BRIDGE_URL is correct.`;
    diagnostics.push(`bridge_endpoint: NOT_FOUND`);
    return { status: 'failed', error: msg, diagnostics, executionMode: 'FAILED' };
  }

  // Handle non-OK responses
  if (!response.ok) {
    let body = '';
    try { body = await response.text(); } catch (_) {}
    const msg = `Bridge returned HTTP ${response.status}: ${body.slice(0, 200)}`;
    diagnostics.push(`bridge_response: ERROR — ${msg}`);
    return { status: 'failed', error: msg, diagnostics, executionMode: 'FAILED' };
  }

  // Parse JSON
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json') && !ct.includes('json')) {
    let raw = '';
    try { raw = await response.text(); } catch (_) {}
    const msg = `Bridge returned non-JSON response (Content-Type: ${ct}): ${raw.slice(0, 120)}`;
    diagnostics.push(`bridge_response: INVALID_JSON — ${msg}`);
    return { status: 'failed', error: msg, diagnostics, executionMode: 'FAILED' };
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const msg = `Bridge response could not be parsed as JSON: ${err.message}`;
    diagnostics.push(`bridge_response: PARSE_ERROR`);
    return { status: 'failed', error: msg, diagnostics, executionMode: 'FAILED' };
  }

  // Normalise response fields
  const pageTitle     = data.title ?? data.pageTitle ?? null;
  const screenshotUrl = data.screenshotUrl ?? data.screenshot_url ?? null;

  const isMockTitle = typeof pageTitle === 'string' && (
    pageTitle === 'Safe Bridge received URL' ||
    pageTitle.startsWith('[REAL PAGE TITLE')
  );

  // Flatten nested diagnostics if present
  if (data.diagnostics && typeof data.diagnostics === 'object' && !Array.isArray(data.diagnostics)) {
    for (const [k, v] of Object.entries(data.diagnostics)) {
      diagnostics.push(`${k}: ${v}`);
    }
  } else if (Array.isArray(data.diagnostics)) {
    diagnostics.push(...data.diagnostics);
  }

  diagnostics.push(`bridge_response: OK`);
  if (data.mode)      diagnostics.push(`bridge_mode: ${data.mode}`);
  if (data.timestamp) diagnostics.push(`bridge_timestamp: ${data.timestamp}`);

  return {
    status: 'success',
    commandId:          data.commandId          ?? 'cmd_bridge_' + Date.now(),
    commandType,
    targetUrl,
    pageTitle,
    isMockTitle,
    screenshotCaptured: !!(screenshotUrl),
    screenshotUrl,
    executionMode:      'REAL',
    diagnostics,
    raw: data,
  };
}

// ── Audit helper ──────────────────────────────────────────────────────────────
function appendAudit(entry) {
  auditLog.push({ ...entry, timestamp: new Date().toISOString() });
  if (auditLog.length > 200) auditLog.shift();
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (req.method === 'GET') {
    let bridgeUrlHost = '(unset)';
    try { bridgeUrlHost = new URL(getBridgeUrl()).host; } catch (_) {}
    return Response.json({
      auditLog,
      safeDiag: {
        hasBridgeUrl:   !!getBridgeUrl(),
        hasBridgeToken: !!getBridgeToken(),
        bridgeUrlHost,
      },
    });
  }

  let body;
  try { body = await req.json(); } catch (_) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { commandType = '', targetUrl = '', operator = 'VeridanCore' } = body;
  const commandId = 'cmd_' + Date.now();
  const startedAt = new Date().toISOString();

  // Security validation (skip strict URL check for session commands)
  const isSessionCommand = commandType === 'START_SESSION' || commandType === 'SESSION_STATUS';
  if (!isSessionCommand) {
    const validationError = validateRequest({ commandType, targetUrl });
    if (validationError) {
      appendAudit({ commandId, commandType, targetUrl, operator, status: 'blocked', error: validationError });
      return Response.json({
        commandId, status: 'blocked', commandType, targetUrl,
        startedAt, completedAt: new Date().toISOString(), error: validationError,
      }, { status: 400 });
    }
  } else {
    // Still require a valid commandType
    if (!ALLOWED_COMMAND_TYPES.has(commandType)) {
      return Response.json({ error: `Unknown commandType: ${commandType}` }, { status: 400 });
    }
  }

  const result = await callVeridanBridge(commandType, targetUrl);
  const completedAt = new Date().toISOString();

  appendAudit({
    commandId,
    commandType,
    targetUrl,
    operator,
    status: result.status,
    executionMode: result.executionMode,
    error: result.error || null,
  });

  return Response.json({
    commandId,
    status:             result.status,
    commandType,
    targetUrl,
    pageTitle:          result.pageTitle          ?? null,
    isMockTitle:        result.isMockTitle        ?? false,
    screenshotCaptured: result.screenshotCaptured ?? false,
    screenshotUrl:      result.screenshotUrl      ?? null,
    executionMode:      result.executionMode      ?? 'FAILED',
    diagnostics:        result.diagnostics        ?? [],
    safeDiag:           result.safeDiag           ?? null,
    raw:                result.raw                ?? null,
    startedAt,
    completedAt,
    error: result.error || null,
  });
});