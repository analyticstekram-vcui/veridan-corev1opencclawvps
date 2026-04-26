import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = Deno.env.get('OPENCLAW_GATEWAY_URL') || '';
  const lastChecked = new Date().toISOString();

  let online = false;
  if (url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      online = res.ok || res.status === 401 || res.status === 403; // CF Access returns 401/403 — gateway is still up
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
    authLayer: 'Cloudflare Access',
    mode: 'external-control',
  });
});