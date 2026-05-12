/**
 * OPENCLAW VALIDATION TEST HARNESS
 * Read-only testing of validation rules.
 * Does NOT execute commands, call brokers, expose secrets, or bypass governance.
 * Uses simulated data only.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { validateCommand, createValidationAuditRecord } from './openclawCommandValidator.js';
import { OPENCLAW_SECURITY_POLICY } from './openclawSecurityPolicy.js';

// Simulated test scenarios - no real data
const TEST_SCENARIOS = [
  {
    id: 'test_live_blocked',
    name: 'Live execution globally blocked',
    command: { commandType: 'READ_TITLE', targetUrl: 'https://tradingview.com', executionMode: 'LIVE' },
    expectedValid: false,
    expectedViolation: 'Live execution is globally disabled',
  },
  {
    id: 'test_simulated_allowed',
    name: 'Simulated mode allowed',
    command: {
      commandType: 'READ_PAGE_TEXT',
      targetUrl: 'https://tradingview.com',
      executionMode: 'SIMULATED',
      auditTraceId: 'trace-abc123',
      hmacSignatureMetadata: { algorithm: 'sha256' },
      riskLevel: 'LOW',
      approvedBy: 'test@example.com',
    },
    expectedValid: true,
  },
  {
    id: 'test_forbidden_command',
    name: 'Forbidden command type blocked',
    command: { commandType: 'PLACE_ORDER', targetUrl: 'https://tradingview.com', executionMode: 'SIMULATED' },
    expectedValid: false,
    expectedViolation: 'forbidden',
  },
  {
    id: 'test_missing_audit_trace',
    name: 'Missing audit trace blocked',
    command: { commandType: 'READ_TITLE', targetUrl: 'https://tradingview.com', executionMode: 'SIMULATED' },
    expectedValid: false,
    expectedViolation: 'Audit trace ID',
  },
  {
    id: 'test_domain_allowlist',
    name: 'Non-allowlisted domain blocked',
    command: {
      commandType: 'READ_TITLE',
      targetUrl: 'https://malicious.com',
      executionMode: 'SIMULATED',
      auditTraceId: 'trace-123',
    },
    expectedValid: false,
    expectedViolation: 'allowlist',
  },
  {
    id: 'test_secret_detection',
    name: 'Secrets in payload blocked',
    command: {
      commandType: 'READ_TITLE',
      targetUrl: 'https://tradingview.com',
      executionMode: 'SIMULATED',
      auditTraceId: 'trace-123',
      payload: { token: 'Bearer sk_live_abcdefghijklmnopqrst123456' },
    },
    expectedValid: false,
    expectedViolation: 'secret',
  },
  {
    id: 'test_bypass_flag_blocked',
    name: 'Bypass flags blocked',
    command: {
      commandType: 'READ_TITLE',
      targetUrl: 'https://tradingview.com',
      executionMode: 'SIMULATED',
      auditTraceId: 'trace-123',
      bypassApproval: true,
    },
    expectedValid: false,
    expectedViolation: 'bypass',
  },
  {
    id: 'test_missing_approval_high_risk',
    name: 'High risk without approval blocked',
    command: {
      commandType: 'READ_TITLE',
      targetUrl: 'https://tradingview.com',
      executionMode: 'SIMULATED',
      auditTraceId: 'trace-123',
      riskLevel: 'HIGH',
      // No approvedBy
    },
    expectedValid: false,
    expectedViolation: 'approval',
  },
  {
    id: 'test_missing_hmac_metadata',
    name: 'Missing HMAC metadata blocked',
    command: {
      commandType: 'READ_TITLE',
      targetUrl: 'https://tradingview.com',
      executionMode: 'SIMULATED',
      auditTraceId: 'trace-123',
      // No hmacSignatureMetadata
    },
    expectedValid: false,
    expectedViolation: 'HMAC',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Run all test scenarios
    if (action === 'run_all_tests') {
      const results = [];

      for (const scenario of TEST_SCENARIOS) {
        const validationResult = await validateCommand(base44, user, scenario.command);

        const passed = validationResult.valid === scenario.expectedValid;
        const violationMatches =
          !scenario.expectedViolation ||
          validationResult.violations.some(v => v.toLowerCase().includes(scenario.expectedViolation.toLowerCase()));

        results.push({
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          passed: passed && violationMatches,
          expected_valid: scenario.expectedValid,
          actual_valid: validationResult.valid,
          expected_violation: scenario.expectedViolation,
          violations: validationResult.violations,
          policy_enforced: validationResult.policy_enforced,
        });

        // Create audit record for test
        await createValidationAuditRecord(base44, user, scenario.command, validationResult);
      }

      const passedCount = results.filter(r => r.passed).length;
      return Response.json({
        status: 'success',
        total_tests: TEST_SCENARIOS.length,
        passed: passedCount,
        failed: TEST_SCENARIOS.length - passedCount,
        results,
        policy_version: OPENCLAW_SECURITY_POLICY.POLICY_VERSION,
        tested_at: new Date().toISOString(),
      });
    }

    // Run single test
    if (action === 'run_test') {
      const { scenario_id } = body;
      const scenario = TEST_SCENARIOS.find(s => s.id === scenario_id);

      if (!scenario) {
        return Response.json({ error: 'Test scenario not found' }, { status: 404 });
      }

      const validationResult = await validateCommand(base44, user, scenario.command);
      await createValidationAuditRecord(base44, user, scenario.command, validationResult);

      return Response.json({
        status: 'success',
        scenario: {
          id: scenario.id,
          name: scenario.name,
          expected_valid: scenario.expectedValid,
          actual_valid: validationResult.valid,
          violations: validationResult.violations,
          policy_enforced: validationResult.policy_enforced,
        },
      });
    }

    // Get policy
    if (action === 'get_policy') {
      return Response.json({
        status: 'success',
        policy: OPENCLAW_SECURITY_POLICY,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Validation test harness error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});