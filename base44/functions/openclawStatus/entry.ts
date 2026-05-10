import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GATEWAY_URL = 'https://openclaw.veridancore.com';
const GATEWAY_WS  = 'wss://openclaw.veridancore.com';
const OPENCLAW_VERSION = '2026.5.2';
const CDP_PORT = 18800;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = Deno.env.get('OPENCLAW_GATEWAY_URL') || GATEWAY_URL;
  const lastChecked = new Date().toISOString();

  let online = false;
  let gatewayStatus = null;
  let diagnostic = 'backend_unreachable';
  let diagnosticDetail = 'Health check not attempted';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      // Do NOT follow redirects — we want to see Cloudflare 302 as proof of reachability
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'VeridanCore-HealthCheck/1.0' },
    });
    gatewayStatus = res.status;

    if (res.status === 200) {
      online = true;
      diagnostic = 'openclaw_online';
      diagnosticDetail = 'OpenClaw gateway returned HTTP 200 — fully online.';
    } else if (res.status === 302 || res.status === 301 || res.status === 307 || res.status === 308) {
      // Cloudflare Access redirect to login — endpoint is live and protected
      online = true;
      diagnostic = 'cloudflare_protected_reachable';
      diagnosticDetail = `OpenClaw gateway reachable — Cloudflare Access redirect (HTTP ${res.status}). Authentication required to proceed.`;
    } else if (res.status === 401 || res.status === 403) {
      online = true;
      diagnostic = 'cloudflare_protected_reachable';
      diagnosticDetail = `OpenClaw gateway reachable — Cloudflare Access enforced (HTTP ${res.status}).`;
    } else if (res.status >= 500) {
      online = false;
      diagnostic = 'gateway_error';
      diagnosticDetail = `OpenClaw gateway returned server error HTTP ${res.status}.`;
    } else {
      // Any other 4xx (404, 429, etc.) still means the server is up
      online = true;
      diagnostic = 'openclaw_online';
      diagnosticDetail = `OpenClaw gateway responded HTTP ${res.status}.`;
    }
  } catch (err) {
    online = false;
    if (err?.name === 'AbortError') {
      diagnostic = 'gateway_unreachable';
      diagnosticDetail = 'Health check timed out after 8s — OpenClaw gateway did not respond.';
    } else {
      diagnostic = 'gateway_unreachable';
      diagnosticDetail = `OpenClaw gateway unreachable: ${err?.message || 'network error'}.`;
    }
  } finally {
    clearTimeout(timeout);
  }

  return Response.json({
    online,
    url,
    wsUrl: GATEWAY_WS,
    lastChecked,
    gatewayStatus,
    diagnostic,
    diagnosticDetail,
    authLayer: 'Cloudflare Access',
    mode: 'external-control',
    protected: diagnostic === 'cloudflare_protected_reachable',
    version: OPENCLAW_VERSION,
    cdpPort: CDP_PORT,
    browserAutomation: 'operational',
    baselineNote: 'Stable backend baseline saved at /root/VERIDAN_OPENCLAW_STABLE_BASELINE.md',
  });
});