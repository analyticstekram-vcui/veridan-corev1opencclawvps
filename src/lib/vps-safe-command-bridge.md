# OpenClaw VPS — /api/safe-command Bridge Server

This Node/Express server must run on your VPS behind Cloudflare Access to expose
the `/api/safe-command` JSON endpoint that `openclawSafeBridge` expects.

---

## 1. Install dependencies

```bash
cd /opt/openclaw-bridge
npm init -y
npm install express puppeteer-core
```

---

## 2. Server code — `/opt/openclaw-bridge/server.js`

```js
'use strict';
const express = require('express');
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const CDP_WS = process.env.OPENCLAW_CDP_WS || 'ws://localhost:18800';
const ALLOWED_COMMAND_TYPES = new Set(['OPEN_URL_AND_READ_TITLE', 'OPEN_URL_AND_SCREENSHOT']);

// Health check
app.get('/', (req, res) => res.json({ ok: true, service: 'openclaw-safe-command-bridge', version: '1.0.0' }));

app.post('/api/safe-command', async (req, res) => {
  const { commandType, targetUrl, governanceMode } = req.body || {};
  const commandId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Basic validation
  if (!targetUrl || !targetUrl.startsWith('https://')) {
    return res.status(400).json({ ok: false, error: 'targetUrl must be a valid https:// URL' });
  }
  if (!ALLOWED_COMMAND_TYPES.has(commandType)) {
    return res.status(400).json({ ok: false, error: `Unknown commandType: ${commandType}` });
  }
  if (governanceMode !== 'SAFE_READ_ONLY') {
    return res.status(400).json({ ok: false, error: 'governanceMode must be SAFE_READ_ONLY' });
  }

  let browser;
  try {
    browser = await puppeteer.connect({ browserWSEndpoint: CDP_WS });
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    let title = null;
    let screenshotUrl = null;

    if (commandType === 'OPEN_URL_AND_READ_TITLE') {
      title = await page.title();
    }

    if (commandType === 'OPEN_URL_AND_SCREENSHOT') {
      const buf = await page.screenshot({ type: 'png', encoding: 'base64' });
      // Return as data URI — replace with your preferred storage/CDN URL
      screenshotUrl = `data:image/png;base64,${buf}`;
    }

    await page.close();

    return res.json({
      ok: true,
      mode: 'REAL',
      commandId,
      commandType,
      targetUrl,
      title,
      screenshotUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      diagnostics: { bridge: 'ok', openclaw: 'ok', execution: 'real' },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      commandId,
      error: err.message,
      diagnostics: { bridge: 'ok', openclaw: 'error', execution: 'failed' },
    });
  } finally {
    if (browser) await browser.disconnect().catch(() => {});
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[openclaw-bridge] Listening on 127.0.0.1:${PORT}`);
});
```

---

## 3. systemd service — `/etc/systemd/system/openclaw-bridge.service`

```ini
[Unit]
Description=OpenClaw Safe-Command Bridge
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/opt/openclaw-bridge
ExecStart=/usr/bin/node /opt/openclaw-bridge/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=4242
Environment=OPENCLAW_CDP_WS=ws://localhost:18800

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-bridge
sudo systemctl start openclaw-bridge
sudo systemctl status openclaw-bridge
```

---

## 4. Nginx reverse-proxy snippet (add inside your existing `server {}` block)

```nginx
location /api/safe-command {
    proxy_pass         http://127.0.0.1:4242;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_read_timeout 30s;
}
```

Reload nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Cloudflare Access service token

Cloudflare Access enforces authentication at the edge.  
The `openclawSafeBridge` backend function reads `OPENCLAW_SERVICE_TOKEN` and sends:

```
CF-Access-Client-Id:     <your-service-token-id>
CF-Access-Client-Secret: <your-service-token-secret>
```

Set the secret in Base44 as:
```
OPENCLAW_SERVICE_TOKEN=<CF-Access-Client-Id>:<CF-Access-Client-Secret>
```

---

## 6. Quick test (from VPS shell)

```bash
curl -s -X POST http://localhost:4242/api/safe-command \
  -H 'Content-Type: application/json' \
  -d '{"commandType":"OPEN_URL_AND_READ_TITLE","targetUrl":"https://example.com","governanceMode":"SAFE_READ_ONLY"}' | jq .
```

Expected output:
```json
{
  "ok": true,
  "mode": "REAL",
  "commandId": "...",
  "commandType": "OPEN_URL_AND_READ_TITLE",
  "targetUrl": "https://example.com",
  "title": "Example Domain",
  "screenshotUrl": null,
  "startedAt": "...",
  "completedAt": "...",
  "diagnostics": { "bridge": "ok", "openclaw": "ok", "execution": "real" }
}
``