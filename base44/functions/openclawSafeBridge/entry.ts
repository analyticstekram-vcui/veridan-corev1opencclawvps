import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENCLAW_GATEWAY_URL = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'https://openclaw.veridancore.com';
const OPENCLAW_SERVICE_TOKEN = Deno.env.get('OPENCLAW_SERVICE_TOKEN') || '';
const CDP_PORT = 18800;

const ALLOWED_COMMAND_TYPES = new Set(['OPEN_URL_AND_READ_TITLE', 'OPEN_URL_AND_SCREENSHOT']);

// In-memory audit log (ephemeral per function instance)
const auditLog = [];

// ─────────────────────────────────────────────
// Security validation (unchanged)
// ─────────────────────────────────────────────
function validateRequest({ commandType, targetUrl, governanceLevel }) {
  if (!targetUrl || typeof targetUrl !== 'string') return 'targetUrl is required';
  if (!targetUrl.startsWith('https://')) {
    return 'targetUrl must use https://. http://, file://, javascript:, about:, and chrome:// are not allowed.';
  }
  const lower = targetUrl.toLowerCase();
  const blockedPatterns = [
    'localhost', '127.0.0.1', '0.0.0.0',
    '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
    '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    'file://', 'chrome://', 'about:', 'javascript:',
    'login', 'signin', 'auth', 'password', 'credential',
    'payment', 'checkout', 'trade', 'order', 'account/delete',
  ];
  for (const pattern of blockedPatterns) {
    if (lower.includes(pattern)) {
      return `targetUrl contains a blocked pattern: "${pattern}". Only safe public HTTPS URLs are permitted.`;
    }
  }
  if (!ALLOWED_COMMAND_TYPES.has(commandType)) {
    return `Unknown commandType "${commandType}". Allowed: ${[...ALLOWED_COMMAND_TYPES].join(', ')}`;
  }
  if (governanceLevel !== 'SAFE_READ_ONLY') return 'governanceLevel must be SAFE_READ_ONLY';
  return null;
}

// ─────────────────────────────────────────────
// Build auth headers for OpenClaw gateway
// Supports Cloudflare Access service token (CF-Access-Client-Id / CF-Access-Client-Secret)
// or a plain Bearer token via OPENCLAW_SERVICE_TOKEN
// ─────────────────────────────────────────────
function buildAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'VeridanCore-SafeBridge/1.0',
  };
  if (OPENCLAW_SERVICE_TOKEN) {
    // Support both "cfid:cfsecret" format (Cloudflare service token pair) and plain Bearer
    if (OPENCLAW_SERVICE_TOKEN.includes(':')) {
      const [cfId, cfSecret] = OPENCLAW_SERVICE_TOKEN.split(':');
      headers['CF-Access-Client-Id'] = cfId.trim();
      headers['CF-Access-Client-Secret'] = cfSecret.trim();
    } else {
      headers['Authorization'] = `Bearer ${OPENCLAW_SERVICE_TOKEN}`;
    }
  }
  return headers;
}

// ─────────────────────────────────────────────
// Real OpenClaw gateway execution
// Calls POST /api/safe-command on the OpenClaw gateway.
// Falls back to simulation only if gateway is unreachable.
// ─────────────────────────────────────────────
async function executeViaOpenClaw(commandType, targetUrl) {
  const diagnostics = [];

  // Step 1: Probe gateway reachability
  let gatewayReachable = false;
  try {
    const probeCtrl = new AbortController();
    const probeTimeout = setTimeout(() => probeCtrl.abort(), 6000);
    const probeRes = await fetch(OPENCLAW_GATEWAY_URL, {
      method: 'HEAD',
      redirect: 'manual',
      signal: probeCtrl.signal,
      headers: buildAuthHeaders(),
    });
    clearTimeout(probeTimeout);
    // 200, 3xx (Cloudflare redirect), 401/403 all mean the host is up
    gatewayReachable = probeRes.status < 500;
    diagnostics.push(`bridge_reachable: HTTP ${probeRes.status}`);
  } catch (err) {
    diagnostics.push(`bridge_reachable: FAILED — ${err?.message || 'network error'}`);
  }

  if (!gatewayReachable) {
    // Fallback to simulation — gateway is truly down
    diagnostics.push('openclaw_agent_reachable: NO — falling back to simulation');
    return await simulateFallback(commandType, targetUrl, diagnostics);
  }

  // Step 2: Send command to OpenClaw /api/safe-command endpoint
  diagnostics.push('openclaw_agent_reachable: YES');
  diagnostics.push('command_sent: true');

  let agentRes;
  try {
    const cmdCtrl = new AbortController();
    const cmdTimeout = setTimeout(() => cmdCtrl.abort(), 20000);
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/api/safe-command`, {
      method: 'POST',
      signal: cmdCtrl.signal,
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        commandType,
        targetUrl,
        cdpPort: CDP_PORT,
        governanceLevel: 'SAFE_READ_ONLY',
      }),
    });
    clearTimeout(cmdTimeout);

    if (response.ok) {
      agentRes = await response.json();
      diagnostics.push('command_executed: true');
      return {
        pageTitle: agentRes.pageTitle ?? agentRes.title ?? null,
        screenshotCaptured: agentRes.screenshotCaptured ?? false,
        screenshotUrl: agentRes.screenshotUrl ?? agentRes.screenshot_url ?? null,
        executionMode: 'REAL',
        diagnostics,
      };
    }

    // Non-2xx from agent — try to read body for error detail
    let errBody = '';
    try { errBody = await response.text(); } catch (_) {}

    // If 401/403 with no token configured, the endpoint exists but needs auth
    if (response.status === 401 || response.status === 403) {
      diagnostics.push(`command_failed: HTTP ${response.status} — Cloudflare Access blocked. Set OPENCLAW_SERVICE_TOKEN secret.`);
    } else {
      diagnostics.push(`command_failed: HTTP ${response.status} — ${errBody.slice(0, 200)}`);
    }
  } catch (err) {
    const isTimeout = err?.name === 'AbortError';
    diagnostics.push(`command_failed: ${isTimeout ? 'timed out after 20s' : err?.message || 'unknown error'}`);
  }

  // Agent returned error — fall back to simulation so the UI still gets a response
  return await simulateFallback(commandType, targetUrl, diagnostics);
}

// ─────────────────────────────────────────────
// Simulation fallback (mock mode)
// ─────────────────────────────────────────────
async function simulateFallback(commandType, targetUrl, diagnostics = []) {
  await new Promise(r => setTimeout(r, 400));
  if (commandType === 'OPEN_URL_AND_READ_TITLE') {
    let pageTitle = null;
    try {
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      const name = domain.split('.')[0];
      pageTitle = name.charAt(0).toUpperCase() + name.slice(1) + ' — ' + domain + ' [SIMULATED: OpenClaw agent not reachable]';
    } catch (_) {
      pageTitle = '[SIMULATED] Could not parse URL';
    }
    return { pageTitle, screenshotCaptured: false, screenshotUrl: null, executionMode: 'SIMULATED', diagnostics };
  }
  if (commandType === 'OPEN_URL_AND_SCREENSHOT') {
    return { pageTitle: null, screenshotCaptured: false, screenshotUrl: null, executionMode: 'SIMULATED', diagnostics };
  }
  throw new Error('Unhandled commandType in simulateFallback');
}

// ─────────────────────────────────────────────
// Audit helper
// ─────────────────────────────────────────────
function appendAudit(entry) {
  auditLog.push({ ...entry, timestamp: new Date().toISOString() });
  if (auditLog.length > 200) auditLog.shift();
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (req.method === 'GET') {
    return Response.json({ auditLog, gatewayUrl: OPENCLAW_GATEWAY_URL, cdpPort: CDP_PORT });
  }

  let body;
  try { body = await req.json(); } catch (_) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    commandType = '',
    targetUrl = '',
    operator = 'VeridanCore',
    governanceLevel = '',
  } = body;

  const commandId = 'cmd_' + Date.now();
  const startedAt = new Date().toISOString();

  const validationError = validateRequest({ commandType, targetUrl, governanceLevel });
  if (validationError) {
    appendAudit({ commandId, commandType, targetUrl, operator, governanceLevel, status: 'rejected', error: validationError });
    return Response.json({
      commandId, status: 'failed', commandType, targetUrl,
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
    execResult = { pageTitle: null, screenshotCaptured: false, screenshotUrl: null, executionMode: 'SIMULATED', diagnostics: [`command_failed: ${err.message}`] };
  }

  const completedAt = new Date().toISOString();
  const status = execError ? 'failed' : 'success';

  appendAudit({ commandId, commandType, targetUrl, operator, governanceLevel, status, executionMode: execResult.executionMode, error: execError || null });

  return Response.json({
    commandId,
    status,
    commandType,
    targetUrl,
    pageTitle: execResult.pageTitle ?? null,
    screenshotCaptured: execResult.screenshotCaptured ?? false,
    screenshotUrl: execResult.screenshotUrl ?? null,
    executionMode: execResult.executionMode ?? 'SIMULATED',
    diagnostics: execResult.diagnostics ?? [],
    startedAt,
    completedAt,
    error: execError || null,
  });
});