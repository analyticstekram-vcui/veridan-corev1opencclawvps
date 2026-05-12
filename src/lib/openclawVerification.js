/**
 * OpenClaw Verification Helpers
 * Centralized reusable verification logic for all panels
 * Eliminates duplication across ExecutionReadiness, SecretEnforcement, BrokerVault, etc.
 */

import { base44 } from '@/api/base44Client';

/**
 * Fetch backend enforcement test results
 * Returns: { passed: boolean, tests: array, count: number, error?: string }
 */
export async function fetchBackendEnforcement() {
  try {
    const res = await base44.functions.invoke('openclawEnforcement', { action: 'run_all_tests' });
    const tests = res?.data?.results || [];
    const passed = tests.length > 0 && tests.every(t => t?.passed === true);
    return { passed, tests, count: tests.length };
  } catch (err) {
    return { passed: false, tests: [], count: 0, error: err?.message || 'Unknown error' };
  }
}

/**
 * Fetch backend security policy
 * Returns: { LIVE_EXECUTION_ENABLED, SIMULATED_MODE_ONLY, REQUIRE_RBAC, etc. }
 */
export async function fetchBackendPolicy() {
  try {
    const res = await base44.functions.invoke('openclawEnforcement', { action: 'get_policy' });
    return res?.data?.policy || {};
  } catch (err) {
    console.error('Failed to fetch backend policy:', err);
    return {};
  }
}

/**
 * Check if live execution is locked out (SIMULATED_MODE_ONLY)
 * Returns: { locked: boolean, mode: string, reason?: string }
 */
export async function checkLiveExecutionLockout() {
  const policy = await fetchBackendPolicy();
  const locked = policy.LIVE_EXECUTION_ENABLED === false && policy.SIMULATED_MODE_ONLY === true;
  return {
    locked,
    mode: locked ? 'SIMULATED' : 'UNKNOWN',
    reason: locked ? 'Live execution globally disabled, SIMULATED_MODE_ONLY enforced' : undefined,
  };
}

/**
 * Verify secret enforcement status
 * Returns: { status: 'PASS'|'WARN'|'BLOCKED', violations: array, missing: number, exposed: number }
 */
export async function verifySecretEnforcement() {
  try {
    const metadata = await base44.entities.OpenClawSecretReference.list('-created_date', 500);
    const metadataMap = {};
    if (metadata) {
      metadata.forEach(m => {
        metadataMap[m.secretName] = m;
      });
    }

    const requiredSecrets = [
      'OPENAI_API_KEY',
      'OPENCLAW_SERVICE_TOKEN',
      'OPENCLAW_BASE_URL',
      'CLOUDFLARE_ACCESS_CLIENT_ID',
      'CLOUDFLARE_ACCESS_CLIENT_SECRET',
      'HMAC_SIGNING_SECRET',
      'BROKER_API_KEY',
      'BROKER_API_SECRET',
    ];

    const violations = [];
    let missingCount = 0;
    let exposedCount = 0;

    for (const secretName of requiredSecrets) {
      const meta = metadataMap[secretName];
      if (!meta || meta.status === 'NOT_CONFIGURED' || meta.status === 'DISABLED') {
        violations.push(`${secretName} is not configured`);
        missingCount++;
      }
      if (meta?.storageLocation === 'hardcoded' || meta?.storageLocation === 'unknown') {
        violations.push(`${secretName} has uncertain storage location`);
      }
    }

    const status = missingCount > 0 || exposedCount > 0 ? 'BLOCKED' : violations.length > 0 ? 'WARN' : 'PASS';

    return { status, violations, missing: missingCount, exposed: exposedCount };
  } catch (err) {
    console.error('Error verifying secrets:', err);
    return { status: 'UNKNOWN', violations: [`Error: ${err.message}`], missing: 0, exposed: 0 };
  }
}

/**
 * Check broker vault readiness
 * Returns: { vaulted: number, pending: number, disabled: number, liveBlocked: number }
 */
export async function checkBrokerVaultReadiness() {
  try {
    const credentials = await base44.entities.OpenClawBrokerCredentialReference.list('-created_date', 500);
    return {
      vaulted: credentials.filter(c => c.credentialStatus === 'VAULTED').length,
      pending: credentials.filter(c => c.credentialStatus === 'VAULT_PENDING').length,
      disabled: credentials.filter(c => c.credentialStatus === 'DISABLED').length,
      liveBlocked: credentials.filter(c => c.environment === 'live').length,
    };
  } catch (err) {
    console.error('Error checking broker vault readiness:', err);
    return { vaulted: 0, pending: 0, disabled: 0, liveBlocked: 0 };
  }
}

/**
 * Determine overall production readiness status
 * Aggregates all verification checks
 * Returns: { status: 'PRODUCTION_READY'|'READ_ONLY_READY'|'NOT_PRODUCTION_READY', blockers: array, percentage: number }
 */
export async function determineProductionReadiness(checklistResults) {
  const [enforcement, secrets, brokerVault, lockout] = await Promise.all([
    fetchBackendEnforcement(),
    verifySecretEnforcement(),
    checkBrokerVaultReadiness(),
    checkLiveExecutionLockout(),
  ]);

  const blockers = [];

  // Backend enforcement is CRITICAL
  if (!enforcement.passed) {
    blockers.push('Backend enforcement tests failed');
  }

  // Live execution lockout is CRITICAL
  if (!lockout.locked) {
    blockers.push('Live execution not locked - SIMULATED mode not enforced');
  }

  // Secrets enforcement
  if (secrets.status === 'BLOCKED') {
    blockers.push(`Secret enforcement failed: ${secrets.missing} missing`);
  }

  // Broker vault critical issues (live credentials)
  if (brokerVault.liveBlocked > 0) {
    blockers.push(`Live broker credentials detected: ${brokerVault.liveBlocked}`);
  }

  let status = 'NOT_PRODUCTION_READY';
  let percentage = 0;

  if (blockers.length === 0) {
    // All critical gates passed
    if (enforcement.passed && lockout.locked && secrets.status !== 'BLOCKED') {
      status = 'PRODUCTION_READY';
      percentage = 100;
    } else {
      status = 'READ_ONLY_READY';
      percentage = 85;
    }
  } else if (blockers.length <= 2) {
    status = 'READ_ONLY_READY';
    percentage = 70;
  } else {
    status = 'NOT_PRODUCTION_READY';
    percentage = 50;
  }

  return { status, blockers, percentage, enforcement, secrets, brokerVault, lockout };
}

/**
 * Get production readiness status without async await
 * For use in effects that need synchronous initial status
 * Returns: { status: string, loading: true }
 */
export function getInitialProductionStatus() {
  return { status: 'LOADING', loading: true, blockers: [], percentage: 0 };
}

/**
 * Format enforcement status for UI display
 * Returns: { label: string, color: string, icon: string, blocked: boolean }
 */
export function formatEnforcementStatus(passed) {
  if (passed) {
    return {
      label: '✓ BACKEND_ENFORCEMENT_ACTIVE',
      color: 'text-primary bg-primary/5 border-primary/20',
      icon: 'check',
      blocked: false,
    };
  }
  return {
    label: '⚠️ BACKEND_ENFORCEMENT_FAILED',
    color: 'text-destructive bg-destructive/5 border-destructive/20',
    icon: 'alert',
    blocked: true,
  };
}

/**
 * Format secret enforcement status for UI display
 */
export function formatSecretStatus(status) {
  const configs = {
    PASS: { label: '✓ SECRET_ENFORCEMENT_PASS', color: 'text-primary bg-primary/5 border-primary/20' },
    WARN: { label: '⚠️ SECRET_ENFORCEMENT_WARN', color: 'text-amber-500 bg-amber-500/5 border-amber-500/20' },
    BLOCKED: { label: '🚫 SECRET_ENFORCEMENT_BLOCKED', color: 'text-destructive bg-destructive/5 border-destructive/20' },
  };
  return configs[status] || configs.WARN;
}

/**
 * Format live execution lockout status for UI display
 */
export function formatLockoutStatus(locked) {
  if (locked) {
    return {
      label: '🔒 LIVE_EXECUTION_LOCKED',
      color: 'text-primary bg-primary/5 border-primary/20',
      blocked: false,
    };
  }
  return {
    label: '⚠️ LIVE_EXECUTION_UNLOCKED',
    color: 'text-destructive bg-destructive/5 border-destructive/20',
    blocked: true,
  };
}