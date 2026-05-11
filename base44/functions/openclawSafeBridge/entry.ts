import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENCLAW_GATEWAY_URL = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'https://openclaw.veridancore.com';
const CF_CLIENT_ID     = Deno.env.get('CF_ACCESS_CLIENT_ID')     || '';
const CF_CLIENT_SECRET = Deno.env.get('CF_ACCESS_CLIENT_SECRET') || '';

// Also support legacy combined token format: "cfid:cfsecret"
const OPENCLAW_SERVICE_TOKEN = Deno.env.get('OPENCLAW_SERVICE_TOKEN') || '';

const ALLOWED_COMMAND_TYPES = new Set(['OPEN_URL_AND_READ_TITLE', 'OPEN_URL_AND_SCREENSHOT']);

const auditLog = [];

// ── Security validation ───────────────────────────────────────────────────────
function validateRequest({ commandType, targetUrl }) {
  if (!targetUrl || typeof targetUrl !== 'string') return 'targetUrl is required';
  if (!targetUrl.startsWith('https://')) {
    return 'targetUrl must use https://. http://, file://, javascript:, about:, and chrome:// are not allowed.';
  }
  const lower = targetUrl.toLowerCase();
  const blocked = [
    'localhost', '127.0.0.1', '0.0.0.0',
    '192.168.', '10.0.', '10.1.', '10.2.', '10.3.', '10.4.', '10.5.',
    '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.',
    '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
    '172.28.', '172.29.', '172.30.', '172.31.',
    'file://', 'chrome://', 'about:', 'javascript:',
    'login', 'signin', 'auth', 'password', 'credential',
    'payment', 'checkout', 'trade', 'order', 'account/delete',
  ];
  for (const p of blocked) {
    if (lower.includes(p)) return `targetUrl contains a blocked pattern: "${p}"`;
  }
  if (!ALLOWED_COMMAND_TYPES.has(commandType)) {
    return `Unknown commandType "${commandType}". Allowed: ${[...ALLOWED_COMMAND_TYPES].join(', ')}`;
  }
  return null;
}

// ── Auth headers ──────────────────────────────────────────────────────────────
function buildAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'VeridanCore-SafeBridge/1.0',
  };

  // Prefer explicit split secrets
  if (CF_CLIENT_ID && CF_CLIENT_SECRET) {
    headers['CF-Access-Client-Id']     = CF_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = CF_CLIENT_SECRET;
    return headers;
  }

  // Fall back to combined token format "cfid:cfsecret" or plain Bearer
  if (OPENCLAW_SERVICE_TOKEN) {
    if (OPENCLAW_SERVICE_TOKEN.includes(':')) {
      const [id, secret] = OPENCLAW_SERVICE_TOKEN.split(':');
      headers['CF-Access-Client-Id']     = id.trim();
      headers['CF-Access-Client-Secret'] = secret.trim();
    } else {
      headers['Authorization'] = `Bearer ${OPENCLAW_SERVICE_TOKEN}`;
    }
  }

  return headers;
}

// ── Execute via live OpenClaw gateway ─────────────────────────────────────────
async function executeViaOpenClaw(commandType, targetUrl) {
  const diagnostics = [];

  // Step 1: Probe gateway reachability
  let gatewayReachable = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const probe = await fetch(OPENCLAW_GATEWAY_URL, {
      method: 'HEAD',
      redirect: 'manual',
      signal: ctrl.signal,
      headers: buildAuthHeaders(),
    });
    clearTimeout(t);
    gatewayReachable = probe.status < 500;
    diagnostics.push(`bridge_reachable: HTTP ${probe.status}`);
  } catch (err) {
    diagnostics.push(`bridge_reachable: FAILED — ${err?.message || 'network error'}`);
  }

  if (!gatewayReachable) {
    diagnostics.push('openclaw_agent_reachable: NO — falling back to simulation');
    return simulateFallback(commandType, targetUrl, diagnostics);
  }

  diagnostics.push('openclaw_agent_reachable: YES');
  diagnostics.push('command_sent: true');

  // Step 2: POST to /api/safe-command
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/api/safe-command`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: buildAuthHeaders(),
      body: JSON.stringify({ commandType, targetUrl, governanceMode: 'SAFE_READ_ONLY' }),
    });
    clearTimeout(t);

    const ct = response.headers.get('content-type') || '';
    const isHtml = ct.includes('text/html');

    if (isHtml) {
      diagnostics.push(`command_failed: HTTP ${response.status} — HTML response (not JSON). /api/safe-command not deployed on VPS yet. See vps-safe-command-bridge.md.`);
      return simulateFallback(commandType, targetUrl, diagnostics);
    }

    if (!response.ok) {
      let body = '';
      try { body = await response.text(); } catch (_) {}
      if (response.status === 401 || response.status === 403) {
        diagnostics.push(`command_failed: HTTP ${response.status} — Cloudflare Access blocked. Check CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET secrets.`);
      } else if (response.status === 404) {
        diagnostics.push('command_failed: HTTP 404 — /api/safe-command not found. Deploy the bridge server.');
      } else {
        diagnostics.push(`command_failed: HTTP ${response.status} — ${body.slice(0, 200)}`);
      }
      return simulateFallback(commandType, targetUrl, diagnostics);
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (_) {
      const raw = await response.text().catch(() => '');
      diagnostics.push(`command_failed: 200 OK but body is not valid JSON — ${raw.slice(0, 120)}`);
      return simulateFallback(commandType, targetUrl, diagnostics);
    }

    // ── Normalise response — support both old and new VPS shape ──────────────
    // New shape: { ok, mode, title, commandType, targetUrl, timestamp, diagnostics: {...} }
    // Old shape: { pageTitle, screenshotUrl, screenshot_url, ... }
    const pageTitle =
      data.title         ??   // new shape
      data.pageTitle     ??   // old shape
      null;

    const screenshotUrl =
      data.screenshotUrl     ??
      data.screenshot_url    ??
      null;

    // Detect mock/receipt-only response from VPS (not yet running real browser)
    const isMockTitle =
      typeof pageTitle === 'string' &&
      (pageTitle === 'Safe Bridge received URL' ||
       pageTitle.startsWith('[REAL PAGE TITLE FROM VPS'));

    // Flatten new nested diagnostics object into the existing string array
    if (data.diagnostics && typeof data.diagnostics === 'object' && !Array.isArray(data.diagnostics)) {
      for (const [k, v] of Object.entries(data.diagnostics)) {
        diagnostics.push(`${k}: ${v}`);
      }
    }

    if (isMockTitle) {
      diagnostics.push('vps_browser_automation: MOCK — VPS returned receipt response, real browser title not available yet');
    }

    diagnostics.push(`command_executed: REAL`);
    if (data.mode) diagnostics.push(`vps_mode: ${data.mode}`);
    if (data.timestamp) diagnostics.push(`vps_timestamp: ${data.timestamp}`);

    return {
      pageTitle,
      isMockTitle,
      screenshotCaptured: !!(screenshotUrl),
      screenshotUrl,
      executionMode: 'REAL',
      diagnostics,
      raw: data,
    };

  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'timed out after 25s' : (err?.message || 'unknown error');
    diagnostics.push(`command_failed: ${msg}`);
    return simulateFallback(commandType, targetUrl, diagnostics);
  }
}

// ── Simulation fallback ───────────────────────────────────────────────────────
async function simulateFallback(commandType, targetUrl, diagnostics = []) {
  await new Promise(r => setTimeout(r, 300));
  if (commandType === 'OPEN_URL_AND_READ_TITLE') {
    let pageTitle = null;
    try {
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      pageTitle = `${domain.split('.')[0][0].toUpperCase()}${domain.split('.')[0].slice(1)} — ${domain} [SIMULATED]`;
    } catch (_) { pageTitle = '[SIMULATED] Could not parse URL'; }
    return { pageTitle, screenshotCaptured: false, screenshotUrl: null, executionMode: 'SIMULATED', diagnostics };
  }
  return { pageTitle: null, screenshotCaptured: false, screenshotUrl: null, executionMode: 'SIMULATED', diagnostics };
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
    return Response.json({ auditLog, gatewayUrl: OPENCLAW_GATEWAY_URL });
  }

  let body;
  try { body = await req.json(); } catch (_) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { commandType = '', targetUrl = '', operator = 'VeridanCore' } = body;
  const commandId = 'cmd_' + Date.now();
  const startedAt = new Date().toISOString();

  const validationError = validateRequest({ commandType, targetUrl });
  if (validationError) {
    appendAudit({ commandId, commandType, targetUrl, operator, status: 'blocked', error: validationError });
    return Response.json({
      commandId, status: 'blocked', commandType, targetUrl,
      pageTitle: null, screenshotCaptured: false, screenshotUrl: null,
      startedAt, completedAt: new Date().toISOString(), error: validationError,
    }, { status: 400 });
  }

  let execResult;
  let execError = null;
  try {
    execResult = await executeViaOpenClaw(commandType, targetUrl);
  } catch (err) {
    execError = err.message;
    execResult = { pageTitle: null, screenshotCaptured: false, screenshotUrl: null, executionMode: 'SIMULATED', diagnostics: [`exception: ${err.message}`] };
  }

  const completedAt = new Date().toISOString();
  const status = execError ? 'failed' : 'success';

  appendAudit({ commandId, commandType, targetUrl, operator, status, executionMode: execResult.executionMode, error: execError || null });

  return Response.json({
    commandId, status, commandType, targetUrl,
    pageTitle:          execResult.pageTitle          ?? null,
    isMockTitle:        execResult.isMockTitle        ?? false,
    screenshotCaptured: execResult.screenshotCaptured ?? false,
    screenshotUrl:      execResult.screenshotUrl      ?? null,
    executionMode:      execResult.executionMode      ?? 'SIMULATED',
    diagnostics:        execResult.diagnostics        ?? [],
    startedAt,
    completedAt,
    error: execError || null,
  });
});