/**
 * openclawEnvPresenceCheck — Phase 46 Backend Env Presence Boolean Route
 * POST /api/openclaw/read-only/env-presence-check
 *
 * Checks ONLY whether required OpenClaw environment keys are present.
 * NEVER returns, logs, exposes, exports, or stores secret values.
 * Does not call OpenClaw, dispatch commands, execute actions, trade, or move money.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REQUIRED_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Build presence-only results — never read or return actual values
  const keys = REQUIRED_KEYS.map(keyName => ({
    keyName,
    present: Boolean(Deno.env.get(keyName)),
    value: 'REDACTED_NEVER_RETURNED',
  }));

  const allPresent = keys.every(k => k.present);

  const routeStatus = allPresent
    ? 'READY'
    : 'MISSING_REQUIRED_ENV';

  return Response.json({
    routeStatus,
    checkedAt: new Date().toISOString(),
    keys,
    secretValuesReturned: false,
    openClawCalled: false,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    backendCheckMode: 'BOOLEAN_PRESENCE_ONLY',
  });
});