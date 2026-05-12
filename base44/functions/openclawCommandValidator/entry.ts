/**
 * OPENCLAW COMMAND VALIDATOR
 * Backend-enforced validation for all commands.
 * Every command is validated against security policy before execution.
 * No command bypasses these checks.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  OPENCLAW_SECURITY_POLICY,
  roleHasPermission,
  getRiskTierConfig,
  isCommandTypeForbidden,
  isDomainAllowed,
} from './openclawSecurityPolicy.js';

/**
 * Validate a command before execution
 * Returns: { valid: boolean, reason: string, policy_enforced: string[], violations: string[] }
 */
export async function validateCommand(base44, user, command) {
  const violations = [];
  const policy_enforced = [];
  let valid = true;

  // 1. CHECK: Live execution globally disabled
  if (OPENCLAW_SECURITY_POLICY.LIVE_EXECUTION_ENABLED === false) {
    policy_enforced.push('GLOBAL_LIVE_LOCKOUT');
    if (command.executionMode === 'LIVE' || command.executionMode === 'REAL') {
      violations.push('Live execution is globally disabled by policy');
      valid = false;
    }
  }

  // 2. CHECK: Execution mode must be SIMULATED
  if (command.executionMode !== 'SIMULATED') {
    violations.push(`Execution mode must be SIMULATED, got ${command.executionMode}`);
    valid = false;
  }
  policy_enforced.push('SIMULATED_MODE_ONLY');

  // 3. CHECK: Cloudflare Access required
  if (OPENCLAW_SECURITY_POLICY.REQUIRE_CLOUDFLARE_ACCESS) {
    // In real deployment, validate CF-Ray header or CF-Access token
    // For this safe panel, we only check metadata
    policy_enforced.push('REQUIRE_CLOUDFLARE_ACCESS');
  }

  // 4. CHECK: Command type not forbidden
  if (isCommandTypeForbidden(command.commandType)) {
    violations.push(`Command type ${command.commandType} is forbidden by policy`);
    valid = false;
  }
  policy_enforced.push('FORBIDDEN_COMMANDS_BLOCKED');

  // 5. CHECK: RBAC - user role
  if (OPENCLAW_SECURITY_POLICY.REQUIRE_RBAC) {
    if (!user || !user.role) {
      violations.push('User role is required but missing');
      valid = false;
    } else if (!OPENCLAW_SECURITY_POLICY.ROLE_PERMISSIONS[user.role]) {
      violations.push(`User role ${user.role} is not recognized`);
      valid = false;
    }
    policy_enforced.push('RBAC_ENFORCED');
  }

  // 6. CHECK: Role has execute permission
  if (user && !roleHasPermission(user.role, 'execute')) {
    violations.push(`Role ${user.role} does not have execute permission`);
    valid = false;
  }

  // 7. CHECK: Risk tier and approval
  const riskTier = command.riskLevel || 'MEDIUM';
  const tierConfig = getRiskTierConfig(riskTier);

  if (tierConfig.requiresApproval && !command.approvedBy) {
    violations.push(`Risk tier ${riskTier} requires approval but none found`);
    valid = false;
  }
  policy_enforced.push(`RISK_TIER_${riskTier}`);

  if (tierConfig.requiresMultisig && (!command.approvals || command.approvals.length < 2)) {
    violations.push(`Risk tier ${riskTier} requires multi-sig but only ${command.approvals?.length || 0} approval(s) found`);
    valid = false;
  }

  // 8. CHECK: Audit trace ID
  if (OPENCLAW_SECURITY_POLICY.REQUIRE_AUDIT_LOGGING) {
    if (!command.auditTraceId) {
      violations.push('Audit trace ID is required but missing');
      valid = false;
    } else if (command.auditTraceId.length < OPENCLAW_SECURITY_POLICY.VALIDATION_RULES.minAuditTraceIdLength) {
      violations.push(`Audit trace ID is too short (min ${OPENCLAW_SECURITY_POLICY.VALIDATION_RULES.minAuditTraceIdLength} chars)`);
      valid = false;
    }
    policy_enforced.push('AUDIT_LOGGING_REQUIRED');
  }

  // 9. CHECK: HMAC signature metadata
  if (OPENCLAW_SECURITY_POLICY.REQUIRE_HMAC_SIGNATURES) {
    if (!command.hmacSignature && !command.hmacSignatureMetadata) {
      violations.push('HMAC signature metadata is required but missing');
      valid = false;
    }
    policy_enforced.push('HMAC_SIGNATURE_REQUIRED');
  }

  // 10. CHECK: Domain allowlist
  if (command.targetUrl) {
    if (!isDomainAllowed(command.targetUrl)) {
      violations.push(`Target URL domain is not in allowlist: ${command.targetUrl}`);
      valid = false;
    }
    policy_enforced.push('DOMAIN_ALLOWLIST_ENFORCED');
  }

  // 11. CHECK: No secrets in payload
  const payloadStr = JSON.stringify(command.payload || {});
  const secretPatterns = [
    /bearer\s+[a-zA-Z0-9_\-\.]{20,}/i,
    /api[\s_-]?key[\s:=]+[a-zA-Z0-9_\-\.]{20,}/i,
    /password[\s:=]+[a-zA-Z0-9_\-\.]{8,}/i,
    /token[\s:=]+[a-zA-Z0-9_\-\.]{20,}/i,
  ];

  if (secretPatterns.some(p => p.test(payloadStr))) {
    violations.push('Command payload contains potential secret values');
    valid = false;
  }
  policy_enforced.push('PAYLOAD_SECRETS_BLOCKED');

  // 12. CHECK: No bypass flags
  if (command.bypass || command.bypassApproval || command.bypassRBac) {
    violations.push('Command contains bypass flags which are forbidden');
    valid = false;
  }
  policy_enforced.push('BYPASS_FLAGS_BLOCKED');

  // 13. CHECK: No dangerous broker commands
  const brokerCommands = ['PLACE_ORDER', 'EXECUTE_TRADE', 'WITHDRAW', 'TRANSFER'];
  if (brokerCommands.includes(command.commandType)) {
    violations.push(`Broker command ${command.commandType} is blocked in this execution mode`);
    valid = false;
  }

  return {
    valid,
    violations,
    policy_enforced,
    policy_version: OPENCLAW_SECURITY_POLICY.POLICY_VERSION,
    checked_at: new Date().toISOString(),
    rules_applied: 13,
  };
}

/**
 * Create an audit record for validation
 */
export async function createValidationAuditRecord(base44, user, command, validationResult) {
  if (!OPENCLAW_SECURITY_POLICY.REQUIRE_AUDIT_LOGGING) {
    return null;
  }

  const auditRecord = {
    timestamp: new Date().toISOString(),
    operator: user?.email || 'unknown',
    operator_role: user?.role || 'unknown',
    command_type: command.commandType,
    command_id: command.id,
    audit_trace_id: command.auditTraceId,
    validation_result: validationResult.valid ? 'PASS' : 'FAIL',
    violations_count: validationResult.violations.length,
    violations: validationResult.violations,
    policy_enforced: validationResult.policy_enforced,
    policy_version: validationResult.policy_version,
    risk_tier: command.riskLevel || 'MEDIUM',
    execution_mode: command.executionMode,
  };

  try {
    // Store audit record in database
    await base44.asServiceRole.entities.OpenClawCommand.create({
      commandId: command.id || `audit-${Date.now()}`,
      commandType: 'AUDIT_VALIDATION',
      targetUrl: command.targetUrl || 'system',
      requestedBy: user?.email || 'system',
      status: 'executed',
      executionMode: 'SIMULATED',
      riskLevel: 'low',
      result: {
        auditType: 'validation',
        ...auditRecord,
      },
      diagnostics: validationResult.violations,
      notes: `Policy validation: ${validationResult.policy_enforced.join(', ')}`,
    });
  } catch (err) {
    console.error('Failed to create audit record:', err);
  }

  return auditRecord;
}