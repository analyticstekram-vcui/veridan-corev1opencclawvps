import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENCLAW_GATEWAY_URL = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'https://openclaw.veridancore.com';
const OPENCLAW_WS_URL      = 'wss://openclaw.veridancore.com';
const CDP_PORT             = 18800;

const ALLOWED_COMMAND_TYPES = new Set(['OPEN_URL_AND_READ_TITLE', 'OPEN_URL_AND_SCREENSHOT']);

// In-memory audit log (ephemeral per function instance, for inspection via test tool)
const auditLog = [];

// ─────────────────────────────────────────────
// Security validation
// ─────────────────────────────────────────────
function validateRequest({ commandType, targetUrl, governanceLevel }) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return 'targetUrl is required';
  }
  if (!targetUrl.startsWith('https://')) {
    return 'targetUrl must use https://. http://, file://, javascript:, about:, and chrome:// are not allowed.';
  }

  // Block private / loopback / dangerous URL targets
  const lower = targetUrl.toLowerCase();
  const blockedPatterns = [
    'localhost', '127.0.0.1', '0.0.0.0',
    '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
    '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    'file://', 'chrome://', 'about:', 'javascript:',
    // Block destructive keyword targets
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

  if (governanceLevel !== 'SAFE_READ_ONLY') {
    return 'governanceLevel must be SAFE_READ_ONLY';
  }

  return null; // valid
}

// ─────────────────────────────────────────────
// Real OpenClaw execution stub
// Replace the mock body here when the agent is live.
// ─────────────────────────────────────────────
async function executeViaOpenClaw(commandType, targetUrl) {
  // TODO: Establish WebSocket connection to OpenClaw agent
  //   const ws = new WebSocket(`${OPENCLAW_WS_URL}/agent`);
  //   await waitForOpen(ws);

  // TODO: Authenticate with OpenClaw gateway (Cloudflare Access service token)
  //   ws.send(JSON.stringify({ type: 'AUTH', token: Deno.env.get('OPENCLAW_SERVICE_TOKEN') }));

  // TODO: Send command payload to the OpenClaw CDP agent
  //   ws.send(JSON.stringify({
  //     type: 'COMMAND',
  //     commandType,
  //     targetUrl,
  //     cdpPort: CDP_PORT,
  //     governanceLevel: 'SAFE_READ_ONLY',
  //   }));

  // TODO: Await response with timeout
  //   const result = await waitForMessage(ws, 15000);
  //   ws.close();
  //   return result;

  // ── MOCK IMPLEMENTATION (remove when live agent is wired) ──
  await new Promise(r => setTimeout(r, 600)); // simulate network round-trip

  if (commandType === 'OPEN_URL_AND_READ_TITLE') {
    let pageTitle = null;
    try {
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      const name   = domain.split('.')[0];
      pageTitle    = name.charAt(0).toUpperCase() + name.slice(1) + ' — ' + domain + ' [MOCK: live read requires OpenClaw agent]';
    } catch (_) {
      pageTitle = '[MOCK] Could not parse URL';
    }
    return { pageTitle, screenshotCaptured: false, screenshotUrl: null };
  }

  if (commandType === 'OPEN_URL_AND_SCREENSHOT') {
    return {
      pageTitle: null,
      screenshotCaptured: true,
      // TODO: replace with signed URL returned from real OpenClaw agent
      screenshotUrl: null,
    };
  }

  throw new Error('Unhandled commandType in executeViaOpenClaw');
  // ── END MOCK ──
}

// ─────────────────────────────────────────────
// Audit helper
// ─────────────────────────────────────────────
function appendAudit(entry) {
  auditLog.push({ ...entry, timestamp: new Date().toISOString() });
  if (auditLog.length > 200) auditLog.shift(); // cap in-memory buffer
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user   = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow GET /audit for inspection
  if (req.method === 'GET') {
    return Response.json({ auditLog, gatewayUrl: OPENCLAW_GATEWAY_URL, cdpPort: CDP_PORT });
  }

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    commandType    = '',
    targetUrl      = '',
    operator       = 'VeridanCore',
    governanceLevel = '',
  } = body;

  const commandId = 'cmd_' + Date.now();
  const startedAt = new Date().toISOString();

  // ── Validate ──
  const validationError = validateRequest({ commandType, targetUrl, governanceLevel });
  if (validationError) {
    appendAudit({ commandId, commandType, targetUrl, operator, governanceLevel, status: 'rejected', error: validationError });
    return Response.json({
      commandId,
      status: 'failed',
      commandType,
      targetUrl,
      pageTitle: null,
      screenshotCaptured: false,
      screenshotUrl: null,
      startedAt,
      completedAt: new Date().toISOString(),
      error: validationError,
    }, { status: 400 });
  }

  // ── Execute ──
  let execResult;
  let execError = null;
  try {
    execResult = await executeViaOpenClaw(commandType, targetUrl);
  } catch (err) {
    execError  = err.message;
    execResult = { pageTitle: null, screenshotCaptured: false, screenshotUrl: null };
  }

  const completedAt = new Date().toISOString();
  const status      = execError ? 'failed' : 'success';

  appendAudit({ commandId, commandType, targetUrl, operator, governanceLevel, status, error: execError || null });

  return Response.json({
    commandId,
    status,
    commandType,
    targetUrl,
    pageTitle:           execResult.pageTitle   ?? null,
    screenshotCaptured:  execResult.screenshotCaptured ?? false,
    screenshotUrl:       execResult.screenshotUrl ?? null,
    startedAt,
    completedAt,
    error: execError || null,
  });
});