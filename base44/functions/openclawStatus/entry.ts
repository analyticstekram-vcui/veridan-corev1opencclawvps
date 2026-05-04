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
  if (url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'VeridanCore-HealthCheck/1.0' },
      });
      gatewayStatus = res.status;
      online = res.status < 500 || res.status === 401 || res.status === 403;
    } catch (_) {
      online = false;
    } finally {
      clearTimeout(timeout);
    }
  }

  return Response.json({
    online,
    url,
    wsUrl: GATEWAY_WS,
    lastChecked,
    gatewayStatus,
    authLayer: 'Cloudflare Access',
    mode: 'external-control',
    protected: gatewayStatus === 401 || gatewayStatus === 403,
    version: OPENCLAW_VERSION,
    cdpPort: CDP_PORT,
    browserAutomation: 'operational',
    baselineNote: 'Stable backend baseline saved at /root/VERIDAN_OPENCLAW_STABLE_BASELINE.md',
  });
});