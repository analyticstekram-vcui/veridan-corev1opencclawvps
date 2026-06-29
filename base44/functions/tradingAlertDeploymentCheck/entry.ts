/**
 * tradingAlertDeploymentCheck
 *
 * Returns deployment readiness status for the Veridan TradingView alert + APNs flow.
 * Checks required env vars, latest alerts, and registered devices.
 * READ-ONLY — no mutations, no push, no execution.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REQUIRED_VARS = [
  { name: 'VERIDAN_TV_SECRET',      sensitive: true,  description: 'TradingView webhook secret' },
  { name: 'VERIDAN_IOS_BUNDLE_ID',  sensitive: false, description: 'iOS app bundle ID' },
  { name: 'APNS_TEAM_ID',           sensitive: false, description: 'Apple Developer Team ID' },
  { name: 'APNS_KEY_ID',            sensitive: false, description: 'APNs Auth Key ID' },
  { name: 'APNS_PRIVATE_KEY_PATH',  sensitive: true,  description: 'APNs .p8 PEM key content (set full PEM, not a file path)' },
  { name: 'APNS_ENVIRONMENT',       sensitive: false, description: 'APNs env: sandbox or production' },
  { name: 'VERIDAN_PUSH_DRY_RUN',   sensitive: false, description: 'Safety gate (true = no real pushes)' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const appId = Deno.env.get('BASE44_APP_ID') || 'unknown';
    const dryRun = Deno.env.get('VERIDAN_PUSH_DRY_RUN') !== 'false';

    // ── Env var status ────────────────────────────────────────────────────────
    const envStatus = REQUIRED_VARS.map(({ name, sensitive, description }) => {
      const raw = Deno.env.get(name);
      return {
        name,
        description,
        present: !!raw,
        value: sensitive ? (raw ? '***set***' : null) : (raw || null),
        sensitive,
      };
    });

    const allPresent    = envStatus.every(v => v.present);
    const webhookReady  = !!Deno.env.get('VERIDAN_TV_SECRET');
    const apnsCredsReady = ['APNS_TEAM_ID','APNS_KEY_ID','APNS_PRIVATE_KEY_PATH'].every(k => !!Deno.env.get(k));
    const missing       = envStatus.filter(v => !v.present).map(v => v.name);

    // ── Latest alerts ─────────────────────────────────────────────────────────
    const latestAlerts = await base44.asServiceRole.entities.VeridanTVAlert.list('-created_date', 10);

    // ── Registered devices ────────────────────────────────────────────────────
    const allDevices    = await base44.asServiceRole.entities.VeridanDevice.list('-created_date', 50);
    const activeDevices = allDevices.filter(d => d.active);

    return Response.json({
      appId,
      deploymentReady: allPresent,
      webhookReady,
      apnsCredsReady,
      dryRun,
      missing,
      envStatus,
      latestAlerts,
      registeredDeviceCount: activeDevices.length,
      totalDeviceCount:      allDevices.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});