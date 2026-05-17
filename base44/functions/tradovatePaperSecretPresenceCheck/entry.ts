/**
 * tradovatePaperSecretPresenceCheck
 * Backend-only read-only check for Tradovate paper/sandbox env var presence.
 * Returns ONLY whether env vars are present, never their values.
 *
 * Does NOT:
 *   - Return secret values
 *   - Connect to Tradovate
 *   - Attempt broker operations
 *   - Attempt order routing
 *   - Execute trades
 *   - Move money
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REQUIRED_ENV_KEYS = [
  'TRADOVATE_PAPER_API_KEY',
  'TRADOVATE_PAPER_API_SECRET',
  'TRADOVATE_PAPER_ACCOUNT_ID',
  'TRADOVATE_PAPER_ENVIRONMENT',
  'TRADOVATE_PAPER_BASE_URL',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check presence of each required env var (never return values)
    const requiredKeys = REQUIRED_ENV_KEYS.map(keyName => ({
      keyName,
      present: Deno.env.get(keyName) ? true : false,
      value: 'REDACTED_NEVER_RETURNED',
    }));

    // Identify missing keys
    const missingKeys = requiredKeys
      .filter(k => !k.present)
      .map(k => k.keyName);

    // Determine readiness status
    const readinessStatus = missingKeys.length === 0
      ? 'READY_FOR_BACKEND_SECRET_POLICY_REVIEW'
      : 'HOLD_FOR_MISSING_ENV';

    // Safety boundary: all false (no operations attempted)
    const safetyBoundary = {
      noSecretValuesReturned: true,
      noBrokerConnectionAttempted: true,
      noOrderRoutingAttempted: true,
      noExecutionAttempted: true,
      noMoneyMovementAttempted: true,
    };

    const response = {
      checkMode: 'TRADOVATE_PAPER_SECRET_PRESENCE_CHECK',
      checkedAt: new Date().toISOString(),
      secretValuesReturned: false,
      brokerConnectionAttempted: false,
      orderRoutingAttempted: false,
      executionAttempted: false,
      moneyMovementAttempted: false,
      requiredKeys,
      missingKeys,
      readinessStatus,
      safetyBoundary,
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});