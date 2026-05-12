/**
 * OPENCLAW SECURITY POLICY MODULE
 * Central enforcement configuration and registry.
 * This is the source of truth for all security decisions.
 * Read-only at runtime; changes require deployment review.
 */

export const OPENCLAW_SECURITY_POLICY = {
  // Global execution lockouts
  LIVE_EXECUTION_ENABLED: false,
  SIMULATED_MODE_ONLY: true,

  // Access control
  REQUIRE_CLOUDFLARE_ACCESS: true,
  REQUIRE_RBAC: true,
  RBAC_ROLES: ['OWNER', 'ADMIN', 'OPERATOR', 'AUDITOR', 'READ_ONLY'],
  DEFAULT_ROLE: 'READ_ONLY',

  // Command validation
  REQUIRE_HMAC_SIGNATURES: true,
  REQUIRE_AUDIT_LOGGING: true,
  REQUIRE_APPROVAL_FOR_HIGH_RISK: true,
  REQUIRE_MULTISIG_FOR_CRITICAL: true,

  // Domain allowlist
  ALLOWED_DOMAINS: [
    'tradingview.com',
    'www.tradingview.com',
    'chart.tradingview.com',
    'docs.tradingview.com',
  ],

  // Forbidden operations (always blocked)
  FORBIDDEN_COMMAND_TYPES: [
    'PLACE_ORDER',
    'EXECUTE_TRADE',
    'TRANSFER_FUNDS',
    'WITHDRAW',
    'EXECUTE_REAL',
    'EXECUTE_LIVE',
  ],

  // Risk tiers and approval requirements
  RISK_TIERS: {
    LOW: { name: 'LOW', requiresApproval: false, requiresMultisig: false, requiresAudit: true },
    MEDIUM: { name: 'MEDIUM', requiresApproval: true, requiresMultisig: false, requiresAudit: true },
    HIGH: { name: 'HIGH', requiresApproval: true, requiresMultisig: false, requiresAudit: true },
    CRITICAL: { name: 'CRITICAL', requiresApproval: true, requiresMultisig: true, requiresAudit: true },
  },

  // Role permissions
  ROLE_PERMISSIONS: {
    OWNER: ['read', 'approve', 'execute', 'configure', 'deploy'],
    ADMIN: ['read', 'approve', 'execute', 'configure'],
    OPERATOR: ['read', 'approve', 'execute'],
    AUDITOR: ['read', 'audit'],
    READ_ONLY: ['read'],
  },

  // Policy version for audit trail
  POLICY_VERSION: '1.0.0',
  POLICY_EFFECTIVE_DATE: '2026-05-12',

  // Validation rules (immutable at runtime)
  VALIDATION_RULES: {
    maxCommandPayloadSize: 10000, // bytes
    maxUrlLength: 2048,
    minAuditTraceIdLength: 8,
    sessionTimeoutMs: 15 * 60 * 1000, // 15 minutes
  },

  // Audit requirements
  AUDIT_EVENTS_REQUIRED: [
    'command.submitted',
    'command.validated',
    'command.approved',
    'command.rejected',
    'command.executed',
    'command.blocked',
    'validation.failed',
    'policy.enforced',
  ],
};

/**
 * Get current policy (read-only)
 */
export function getCurrentPolicy() {
  return Object.freeze({ ...OPENCLAW_SECURITY_POLICY });
}

/**
 * Check if a role has permission for an action
 */
export function roleHasPermission(role, action) {
  const permissions = OPENCLAW_SECURITY_POLICY.ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}

/**
 * Get risk tier config
 */
export function getRiskTierConfig(tier) {
  return OPENCLAW_SECURITY_POLICY.RISK_TIERS[tier] || OPENCLAW_SECURITY_POLICY.RISK_TIERS.MEDIUM;
}

/**
 * Check if command type is forbidden
 */
export function isCommandTypeForbidden(commandType) {
  return OPENCLAW_SECURITY_POLICY.FORBIDDEN_COMMAND_TYPES.includes(commandType);
}

/**
 * Check if domain is allowed
 */
export function isDomainAllowed(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    return OPENCLAW_SECURITY_POLICY.ALLOWED_DOMAINS.some(allowed =>
      allowed.replace('www.', '') === domain
    );
  } catch {
    return false;
  }
}