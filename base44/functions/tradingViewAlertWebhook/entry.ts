/**
 * tradingViewAlertWebhook
 *
 * Public webhook endpoint for TradingView alert intake.
 * Auth: VERIDAN_TV_SECRET in query param (?secret=...) or X-Veridan-Secret header.
 * Push: governed by VERIDAN_PUSH_DRY_RUN (default true — no real APNs calls).
 *
 * SAFETY: NO broker execution · NO trading · NO banking
 * Dry-run by default — set VERIDAN_PUSH_DRY_RUN=false only after live APNs testing.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method === 'GET') {
      return Response.json({ ok: true, endpoint: 'tradingViewAlertWebhook', status: 'LISTENING' });
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // ── Auth: validate VERIDAN_TV_SECRET ──────────────────────────────────────
    const expectedSecret = Deno.env.get('VERIDAN_TV_SECRET');
    if (!expectedSecret) {
      return Response.json({ error: 'Webhook not configured: VERIDAN_TV_SECRET not set' }, { status: 503 });
    }

    const url = new URL(req.url);
    const providedSecret =
      url.searchParams.get('secret') ||
      req.headers.get('x-veridan-secret') || '';

    if (providedSecret !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse payload ─────────────────────────────────────────────────────────
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = { message: await req.text() };
    }

    const dryRun = Deno.env.get('VERIDAN_PUSH_DRY_RUN') !== 'false';

    // ── Store alert ───────────────────────────────────────────────────────────
    const base44 = createClientFromRequest(req);

    const alert = await base44.asServiceRole.entities.VeridanTVAlert.create({
      ticker:      body.ticker || body.symbol || '',
      alertType:   body.alertType || body.type || body.strategy || 'SIGNAL',
      price:       body.price ? String(body.price) : '',
      interval:    body.interval || body.timeframe || '',
      message:     body.message || body.alert_message || JSON.stringify(body),
      rawPayload:  JSON.stringify(body),
      receivedAt:  new Date().toISOString(),
      pushStatus:  dryRun ? 'DRY_RUN_SKIPPED' : 'PENDING',
      dryRun,
      devicesTargeted: 0,
    });

    // ── Push to registered devices ────────────────────────────────────────────
    let pushResult = { skipped: true, reason: 'VERIDAN_PUSH_DRY_RUN=true' };

    if (!dryRun) {
      const devices = await base44.asServiceRole.entities.VeridanDevice.filter({ active: true });
      if (devices.length === 0) {
        pushResult = { skipped: true, reason: 'No registered devices' };
      } else {
        // APNs push — requires APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY_PATH, APNS_ENVIRONMENT
        const teamId  = Deno.env.get('APNS_TEAM_ID');
        const keyId   = Deno.env.get('APNS_KEY_ID');
        const pemKey  = Deno.env.get('APNS_PRIVATE_KEY_PATH'); // PEM content in serverless
        const apnsEnv = Deno.env.get('APNS_ENVIRONMENT') || 'sandbox';

        if (!teamId || !keyId || !pemKey) {
          await base44.asServiceRole.entities.VeridanTVAlert.update(alert.id, {
            pushStatus: 'FAILED',
            pushError: 'APNs credentials not fully configured (APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY_PATH required)',
          });
          return Response.json({
            ok: false,
            alertId: alert.id,
            dryRun: false,
            error: 'APNs credentials missing — set APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY_PATH',
          }, { status: 500 });
        }

        // JWT generation for APNs
        const host = apnsEnv === 'production'
          ? 'api.push.apple.com'
          : 'api.sandbox.push.apple.com';

        const bundleId = Deno.env.get('VERIDAN_IOS_BUNDLE_ID') || '';
        const issuedAt = Math.floor(Date.now() / 1000);

        const header  = { alg: 'ES256', kid: keyId };
        const payload = { iss: teamId, iat: issuedAt };

        const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const signingInput = `${encode(header)}.${encode(payload)}`;

        let jwt = '';
        let jwtError = '';
        try {
          const pemContent = pemKey.includes('-----') ? pemKey : `-----BEGIN PRIVATE KEY-----\n${pemKey}\n-----END PRIVATE KEY-----`;
          const pemLines = pemContent.split('\n').filter(l => !l.startsWith('-----')).join('');
          const rawKey = Uint8Array.from(atob(pemLines), c => c.charCodeAt(0));
          const cryptoKey = await crypto.subtle.importKey(
            'pkcs8', rawKey.buffer,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false, ['sign']
          );
          const sig = await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            cryptoKey,
            new TextEncoder().encode(signingInput)
          );
          const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
          jwt = `${signingInput}.${sigB64}`;
        } catch (e) {
          jwtError = e.message;
        }

        if (!jwt) {
          await base44.asServiceRole.entities.VeridanTVAlert.update(alert.id, {
            pushStatus: 'FAILED',
            pushError: `JWT signing failed: ${jwtError}`,
          });
          return Response.json({ ok: false, alertId: alert.id, error: `JWT error: ${jwtError}` }, { status: 500 });
        }

        const pushPayload = JSON.stringify({
          aps: {
            alert: {
              title: `Veridan Alert: ${alert.ticker || 'Signal'}`,
              body: alert.message || `${alert.alertType} @ ${alert.price}`,
            },
            sound: 'default',
          },
          ticker:    alert.ticker,
          alertType: alert.alertType,
          price:     alert.price,
        });

        let sent = 0;
        let failed = 0;

        for (const device of devices) {
          try {
            const resp = await fetch(`https://${host}/3/device/${device.deviceToken}`, {
              method: 'POST',
              headers: {
                'authorization': `bearer ${jwt}`,
                'apns-topic': bundleId,
                'apns-push-type': 'alert',
                'content-type': 'application/json',
              },
              body: pushPayload,
            });
            if (resp.ok) { sent++; } else { failed++; }
          } catch {
            failed++;
          }
        }

        await base44.asServiceRole.entities.VeridanTVAlert.update(alert.id, {
          pushStatus: failed === 0 ? 'SENT' : (sent > 0 ? 'SENT' : 'FAILED'),
          devicesTargeted: devices.length,
        });

        pushResult = { sent, failed, total: devices.length };
      }
    }

    return Response.json({
      ok: true,
      alertId: alert.id,
      dryRun,
      pushResult,
      message: dryRun ? 'Alert stored. Push skipped (VERIDAN_PUSH_DRY_RUN=true).' : 'Alert stored and push attempted.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});