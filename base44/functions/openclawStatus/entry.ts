import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = Deno.env.get('OPENCLAW_GATEWAY_URL') || '';
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
      // 200-399: direct success or redirect followed
      // 401/403: Cloudflare Access wall — gateway is up but protected
      // 409/503 etc from our own API: gateway is up
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
    lastChecked,
    gatewayStatus,
    authLayer: 'Cloudflare Access',
    mode: 'external-control',
    protected: gatewayStatus === 401 || gatewayStatus === 403,
  });
});