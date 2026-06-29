/**
 * registerVeridanDevice
 *
 * Registers (or updates) an iOS device APNs token for Veridan alert delivery.
 * Auth: VERIDAN_TV_SECRET in Authorization header (Bearer) or request body field.
 *
 * POST body: { deviceToken, bundleId?, environment?, label? }
 * GET: returns endpoint status only (no auth required).
 *
 * SAFETY: NO broker · NO trading · NO banking · DEVICE REGISTRATION ONLY
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method === 'GET') {
      return Response.json({ ok: true, endpoint: 'registerVeridanDevice', status: 'READY' });
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // ── Auth: validate VERIDAN_TV_SECRET ──────────────────────────────────────
    const expectedSecret = Deno.env.get('VERIDAN_TV_SECRET');
    if (!expectedSecret) {
      return Response.json({ error: 'Not configured: VERIDAN_TV_SECRET not set' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const providedSecret = bearerToken || body.secret || '';
    if (providedSecret !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Validate input ────────────────────────────────────────────────────────
    const { deviceToken, bundleId, environment, label } = body;
    if (!deviceToken) {
      return Response.json({ error: 'deviceToken is required' }, { status: 400 });
    }

    const resolvedBundle = bundleId || Deno.env.get('VERIDAN_IOS_BUNDLE_ID') || '';
    if (!resolvedBundle) {
      return Response.json({ error: 'bundleId required (or set VERIDAN_IOS_BUNDLE_ID)' }, { status: 400 });
    }

    const resolvedEnv = environment || Deno.env.get('APNS_ENVIRONMENT') || 'sandbox';

    // ── Upsert device record ──────────────────────────────────────────────────
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    const existing = await base44.asServiceRole.entities.VeridanDevice.filter({ deviceToken });

    if (existing.length > 0) {
      await base44.asServiceRole.entities.VeridanDevice.update(existing[0].id, {
        bundleId: resolvedBundle,
        environment: resolvedEnv,
        updatedAt: now,
        active: true,
        ...(label ? { label } : {}),
      });
      return Response.json({ ok: true, deviceId: existing[0].id, action: 'updated' });
    }

    const device = await base44.asServiceRole.entities.VeridanDevice.create({
      deviceToken,
      bundleId: resolvedBundle,
      environment: resolvedEnv,
      registeredAt: now,
      active: true,
      ...(label ? { label } : {}),
    });

    return Response.json({ ok: true, deviceId: device.id, action: 'registered' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});