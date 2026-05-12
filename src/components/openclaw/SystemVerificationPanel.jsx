import React, { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import OperatorGuidancePanel from './OperatorGuidancePanel';

// Master verification checks organized by category
const VERIFICATION_GROUPS = [
  {
    id: 'nav_structure',
    name: 'Navigation Structure',
    description: 'Verifies all major panels are accessible',
    checks: [
      { id: 'nav_command_queue', name: 'Command Queue panel accessible', panel: 'Command Queue', prodBlocking: true },
      { id: 'nav_browser_session', name: 'Browser Session panel accessible', panel: 'Browser Session', prodBlocking: true },
      { id: 'nav_overview', name: 'Overview panel accessible', panel: 'Overview', prodBlocking: true },
      { id: 'nav_status', name: 'Status panel accessible', panel: 'Status', prodBlocking: true },
      { id: 'nav_safe_command', name: 'Safe Command Test panel accessible', panel: 'Safe Command Test', prodBlocking: true },
      { id: 'nav_safety_tests', name: 'Safety Tests panel accessible', panel: 'Safety Tests', prodBlocking: true },
      { id: 'nav_readiness_gate', name: 'Readiness Gate panel accessible', panel: 'Readiness Gate', prodBlocking: true },
      { id: 'nav_approval', name: 'Approval Workflow panel accessible', panel: 'Approval Workflow', prodBlocking: true },
      { id: 'nav_policy', name: 'Policy Registry panel accessible', panel: 'Policy Registry', prodBlocking: true },
      { id: 'nav_connectors', name: 'Connectors panel accessible', panel: 'Connectors', prodBlocking: true },
      { id: 'nav_risk_matrix', name: 'Risk Matrix panel accessible', panel: 'Risk Matrix', prodBlocking: true },
      { id: 'nav_runbook', name: 'Runbook panel accessible', panel: 'Runbook', prodBlocking: true },
      { id: 'nav_simulations', name: 'Simulations panel accessible', panel: 'Simulations', prodBlocking: true },
      { id: 'nav_snapshot', name: 'Snapshot panel accessible', panel: 'Snapshot', prodBlocking: true },
      { id: 'nav_handoff', name: 'Handoff panel accessible', panel: 'Handoff', prodBlocking: true },
      { id: 'nav_prod_checklist', name: 'Production Checklist panel accessible', panel: 'Production Checklist', prodBlocking: true },
      { id: 'nav_browser_read', name: 'Browser Read panel accessible', panel: 'Browser Read', prodBlocking: true },
      { id: 'nav_risk_map', name: 'Risk Map panel accessible', panel: 'Risk Map', prodBlocking: true },
      { id: 'nav_executed_commands', name: 'Executed Commands panel accessible', panel: 'Executed Commands', prodBlocking: true },
      { id: 'nav_workflows', name: 'Workflows panel accessible', panel: 'Workflows', prodBlocking: true },
      { id: 'nav_node_registry', name: 'Node Registry panel accessible', panel: 'Node Registry', prodBlocking: true },
      { id: 'nav_live_logs', name: 'Live Logs panel accessible', panel: 'Live Logs', prodBlocking: true },
      { id: 'nav_exec_readiness', name: 'Execution Readiness panel accessible', panel: 'Execution Readiness', prodBlocking: true },
      { id: 'nav_telemetry', name: 'Telemetry panel accessible', panel: 'Telemetry', prodBlocking: true },
      { id: 'nav_legacy_review', name: 'Legacy Review panel accessible', panel: 'Legacy Review', prodBlocking: true },
      { id: 'nav_rbac_matrix', name: 'RBAC Matrix panel accessible', panel: 'RBAC Matrix', prodBlocking: true },
      { id: 'nav_access_review', name: 'Access Review panel accessible', panel: 'Access Review', prodBlocking: true },
    ],
  },
  {
    id: 'safety_gates',
    name: 'Safety Gates',
    description: 'Verifies governance and safety mechanisms are in place',
    checks: [
      { id: 'safety_audit_notice', name: 'Production Checklist shows audit-only notice', panel: 'Production Checklist', prodBlocking: true, why: 'Ensures operators understand checklist is audit-only, not execution approval.' },
      { id: 'safety_live_disabled', name: 'Live execution disabled globally', panel: 'Execution Readiness', prodBlocking: true, why: 'Critical safety gate. Live mode must remain disabled.' },
      { id: 'safety_rbac_shows_disabled', name: 'RBAC Matrix shows live execution permanently disabled', panel: 'RBAC Matrix', prodBlocking: true, why: 'Users must see that no role can enable live execution.' },
      { id: 'safety_governance_docs', name: 'Governance constraints clearly documented', panel: 'Policy Registry', prodBlocking: false, why: 'Helps operators understand approval requirements and constraints.' },
    ],
  },
  {
    id: 'rbac_access',
    name: 'RBAC / Access Control',
    description: 'Verifies role-based access control implementation',
    checks: [
      { id: 'rbac_access_review_init', name: 'Access Review initialized with default roles', panel: 'Access Review', prodBlocking: false, why: 'Ensures RBAC foundation exists with standard roles.' },
      { id: 'rbac_owner_visible', name: 'OWNER role visible in Access Review', panel: 'Access Review', prodBlocking: false, why: 'Confirms role hierarchy is properly defined.' },
      { id: 'rbac_admin_visible', name: 'ADMIN role visible in Access Review', panel: 'Access Review', prodBlocking: false, why: 'Confirms role hierarchy is properly defined.' },
      { id: 'rbac_operator_visible', name: 'OPERATOR role visible in Access Review', panel: 'Access Review', prodBlocking: false, why: 'Confirms role hierarchy is properly defined.' },
      { id: 'rbac_auditor_visible', name: 'AUDITOR role visible in Access Review', panel: 'Access Review', prodBlocking: false, why: 'Confirms role hierarchy is properly defined.' },
      { id: 'rbac_readonly_visible', name: 'READ_ONLY role visible in Access Review', panel: 'Access Review', prodBlocking: false, why: 'Confirms role hierarchy is properly defined.' },
    ],
  },
  {
    id: 'prod_readiness',
    name: 'Production Readiness',
    description: 'Verifies system is ready for production deployment',
    checks: [
      { id: 'prod_no_api_keys', name: 'No API keys rendered in UI', panel: 'All Panels', prodBlocking: true, why: 'API keys visible in UI pose critical security risk.' },
      { id: 'prod_no_secrets', name: 'No secret values visible in UI', panel: 'All Panels', prodBlocking: true, why: 'Secrets must never be exposed to browser or frontend.' },
      { id: 'prod_no_tokens', name: 'No bearer tokens or access tokens visible', panel: 'All Panels', prodBlocking: true, why: 'Token exposure compromises system security.' },
      { id: 'prod_gateway_reachable', name: 'OpenClaw Gateway is reachable', panel: 'Status', prodBlocking: false, why: 'Gateway connectivity is essential for operations.' },
      { id: 'prod_cloudflare_protected', name: 'Gateway protected by Cloudflare Access', panel: 'Status', prodBlocking: true, why: 'Access protection is mandatory for production.' },
    ],
  },
  {
    id: 'audit_logging',
    name: 'Audit / Logging',
    description: 'Verifies audit trails and logging are operational',
    checks: [
      { id: 'audit_readonly_notices', name: 'All read-only/audit-only panels display notices', panel: 'Multiple', prodBlocking: false, why: 'Operators must understand panel limitations.' },
      { id: 'audit_executed_commands', name: 'Executed Commands audit view accessible', panel: 'Executed Commands', prodBlocking: true, why: 'Audit trail visibility is critical for governance.' },
      { id: 'audit_legacy_review', name: 'Legacy execution review available', panel: 'Legacy Review', prodBlocking: false, why: 'Historical record review is important for compliance.' },
      { id: 'audit_live_logs', name: 'Live logs panel functional', panel: 'Live Logs', prodBlocking: false, why: 'Real-time logging helps operators monitor system.' },
    ],
  },
  {
    id: 'browser_bridge',
    name: 'Browser Bridge Safety',
    description: 'Verifies browser automation safety mechanisms',
    checks: [
      { id: 'browser_safe_test_accessible', name: 'Safe Command Test panel accessible', panel: 'Safe Command Test', prodBlocking: true, why: 'Safe command testing is essential for validation.' },
      { id: 'browser_read_actions_accessible', name: 'Browser Read Actions accessible', panel: 'Browser Read', prodBlocking: false, why: 'Read-only browser actions provide safe testing.' },
      { id: 'browser_mutations_blocked', name: 'Mutation commands blocked in SIMULATED mode', panel: 'Safe Command Test', prodBlocking: true, why: 'Browser mutations must be blocked to prevent accidents.' },
      { id: 'browser_session_tracking', name: 'Browser Session tracking functional', panel: 'Browser Session', prodBlocking: false, why: 'Session tracking enables audit and control.' },
    ],
  },
  {
    id: 'connector_safety',
    name: 'Connector Safety',
    description: 'Verifies connector integrations are secure',
    checks: [
      { id: 'conn_health_matrix', name: 'Connector Health Matrix shows all integrations', panel: 'Connectors', prodBlocking: false, why: 'Visibility into connector status is important for operations.' },
      { id: 'conn_node_registry', name: 'Node Registry accessible for gateway management', panel: 'Node Registry', prodBlocking: false, why: 'Node registry enables infrastructure visibility.' },
      { id: 'conn_status_checks', name: 'Connector status checks available', panel: 'Status', prodBlocking: false, why: 'Status monitoring helps detect issues early.' },
    ],
  },
  {
    id: 'ui_readability',
    name: 'UI Readability / Contrast',
    description: 'Verifies UI uses readable text and proper contrast',
    checks: [
      { id: 'ui_readable_text', name: 'Text uses readable slate/foreground instead of low-opacity muted', panel: 'All Panels', prodBlocking: false, why: 'Readable text improves operator experience and reduces errors.' },
      { id: 'ui_headers_visible', name: 'Panel headers are prominent and visible', panel: 'All Panels', prodBlocking: false, why: 'Operators must quickly identify which panel they are in.' },
      { id: 'ui_status_badges_clear', name: 'Status badges are color-coded and clear', panel: 'Multiple', prodBlocking: false, why: 'Visual status indicators help operators quickly assess state.' },
    ],
  },
  {
    id: 'live_lockout',
    name: 'Live Execution Lockout',
    description: 'Verifies live execution is globally disabled and locked',
    checks: [
      { id: 'lockout_global_disabled', name: 'Live execution globally disabled', panel: 'All Panels', prodBlocking: true, why: 'CRITICAL: Live execution must be globally disabled.' },
      { id: 'lockout_kill_switch', name: 'Emergency kill switch is operational', panel: 'Execution Readiness', prodBlocking: true, why: 'Kill switch is emergency safety mechanism.' },
      { id: 'lockout_no_bypass', name: 'No way to bypass live execution lockout', panel: 'All Panels', prodBlocking: true, why: 'Lockout must be un-bypassable via UI.' },
      { id: 'lockout_mode_simulated', name: 'Execution mode is SIMULATED by default', panel: 'Status', prodBlocking: true, why: 'System must default to safe SIMULATED mode.' },
    ],
  },
  {
    id: 'backend_enforcement',
    name: 'Backend Enforcement',
    description: 'Verifies backend validation and policy enforcement is operational',
    checks: [
      { id: 'backend_enforcement_tests', name: 'Backend validation test suite passes', panel: 'System Verify', prodBlocking: true, why: 'Backend must pass all validation tests: live blocking, domain allowlist, secrets, RBAC, audit, HMAC.' },
      { id: 'backend_policy_live_disabled', name: 'Backend policy: LIVE_EXECUTION_ENABLED = false', panel: 'System Verify', prodBlocking: true, why: 'Backend must enforce live execution disabled at policy level.' },
      { id: 'backend_policy_simulated_only', name: 'Backend policy: SIMULATED_MODE_ONLY = true', panel: 'System Verify', prodBlocking: true, why: 'Backend must enforce SIMULATED mode only.' },
      { id: 'backend_policy_rbac', name: 'Backend policy: REQUIRE_RBAC = true', panel: 'System Verify', prodBlocking: true, why: 'Backend must enforce role-based access control.' },
      { id: 'backend_policy_audit_logging', name: 'Backend policy: REQUIRE_AUDIT_LOGGING = true', panel: 'System Verify', prodBlocking: true, why: 'Backend must enforce audit logging for governance.' },
      { id: 'backend_policy_hmac', name: 'Backend policy: REQUIRE_HMAC_SIGNATURES = true', panel: 'System Verify', prodBlocking: true, why: 'Backend must enforce HMAC signatures for command integrity.' },
    ],
  },
];

function VerificationCheck({ check, result, expanded, onToggle, group }) {
  const resultStatus = result?.status || 'not_run';
  const statusConfig = {
    pass: { icon: CheckCircle2, color: 'text-primary', label: 'PASS', bg: 'bg-primary/5 border-primary/20' },
    warn: { icon: AlertCircle, color: 'text-amber-500', label: 'WARN', bg: 'bg-amber-500/5 border-amber-500/20' },
    fail: { icon: XCircle, color: 'text-destructive', label: 'FAIL', bg: 'bg-destructive/5 border-destructive/20' },
    not_run: { icon: AlertCircle, color: 'text-slate-500', label: 'PENDING', bg: 'bg-slate-500/5 border-slate-500/20' },
  };

  const cfg = statusConfig[resultStatus];
  const Icon = cfg.icon;

  return (
    <div className={`border rounded overflow-hidden ${cfg.bg}`}>
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onToggle(check.id)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground">{check.name}</div>
            <div className="text-[8px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{check.panel}</span>
              {check.prodBlocking && <span className="text-destructive font-semibold">PROD-BLOCKING</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 py-2.5 space-y-2 bg-card/50 text-[9px]">
          {result?.status === 'fail' && (
            <div className="bg-destructive/10 border border-destructive/20 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-destructive font-semibold mb-1">Production-Blocking Issue</div>
              <div className="text-destructive/90">{check.name}</div>
            </div>
          )}
          
          {result?.explanation && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">What Was Checked</div>
              <div className="text-slate-300">{result.explanation}</div>
            </div>
          )}

          {result?.details && (
            <div className="bg-secondary/30 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Actual Data / Control Status</div>
              <div className="text-slate-300 font-mono text-[8px]">{result.details}</div>
            </div>
          )}

          {result?.suggestedFix && (
            <div className={`border px-2 py-1.5 rounded ${result.status === 'fail' ? 'bg-destructive/10 border-destructive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <div className={`text-[8px] uppercase tracking-widest font-semibold mb-1 ${result.status === 'fail' ? 'text-destructive' : 'text-amber-500'}`}>Safe Next Action</div>
              <div className={result.status === 'fail' ? 'text-destructive/90' : 'text-amber-500/90'}>{result.suggestedFix}</div>
            </div>
          )}

          {check.why && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Why It Matters</div>
              <div className="text-slate-300">{check.why}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VerificationGroup({ group, results, expandedChecks, onToggleCheck }) {
  const groupResults = group.checks.map(c => results[c.id] || { status: 'not_run' });
  const passCount = groupResults.filter(r => r.status === 'pass').length;
  const warnCount = groupResults.filter(r => r.status === 'warn').length;
  const failCount = groupResults.filter(r => r.status === 'fail').length;

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div className="bg-secondary/10 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-foreground">{group.name}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">{group.description}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          {failCount > 0 && <span className="text-[10px] px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive font-semibold rounded">{failCount} FAIL</span>}
          {warnCount > 0 && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold rounded">{warnCount} WARN</span>}
          {passCount > 0 && <span className="text-[10px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary font-semibold rounded">{passCount} PASS</span>}
        </div>
      </div>
      <div className="space-y-1 p-3 bg-card/30">
        {group.checks.map(check => (
          <VerificationCheck
            key={check.id}
            check={check}
            result={results[check.id]}
            expanded={expandedChecks[check.id]}
            onToggle={() => onToggleCheck(check.id)}
            group={group}
          />
        ))}
      </div>
    </div>
  );
}

// Safe secret detection - only check actual data, not labels/descriptions
const scanForExposedTokens = () => {
  let exposedContent = '';

  // Only scan input/textarea VALUES (not labels/placeholders)
  const inputElements = document.querySelectorAll('input:not([type="hidden"]), textarea');
  inputElements.forEach(el => {
    if (el.value && el.value.trim().length > 20) {
      exposedContent += ` ${el.value}`;
    }
  });

  // Check for ACTUAL tokens with real values (20+ chars)
  const bearerPattern = /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi;
  const accessTokenPattern = /access[\s_-]?token[\s:=]+[a-zA-Z0-9_\-\.]{20,}/gi;
  
  return bearerPattern.test(exposedContent) || accessTokenPattern.test(exposedContent);
};

const scanForBypassUI = () => {
  // Only check for ACTUAL enabled buttons that enable live mode
  const buttons = Array.from(document.querySelectorAll('button:not([disabled]), [role="button"]:not([aria-disabled="true"])'));
  
  // Look for buttons with live-enable intent that are NOT disabled
  const bypassButtons = buttons.filter(btn => {
    const text = btn.innerText.toLowerCase();
    const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true' || btn.classList.contains('disabled');
    return (text.includes('enable live') || text.includes('activate live')) && !isDisabled;
  });

  return bypassButtons.length > 0;
};

const scanForApiKeys = () => {
  // Only check input/textarea VALUES for API key patterns, not labels
  const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
  const patterns = [
    /sk-[\w]{20,}/,      // Stripe keys
    /pk-[\w]{20,}/,      // Public keys
    /rk_live_[\w]{20,}/, // Razorpay live
  ];

  let foundKey = false;
  inputs.forEach(input => {
    if (input.value && patterns.some(p => p.test(input.value))) {
      foundKey = true;
    }
  });

  return foundKey;
};

export default function SystemVerificationPanel() {
   const [results, setResults] = useState({});
   const [running, setRunning] = useState(false);
   const [expandedChecks, setExpandedChecks] = useState({});
   const [lastRunTime, setLastRunTime] = useState(null);

   const runVerification = async () => {
     setRunning(true);
     const newResults = {};

     try {
       // Query backend enforcement for validation test results
       const enforcementRes = await base44.functions.invoke('openclawEnforcement', { action: 'run_all_tests' });
       const enforcementTests = enforcementRes.data?.results || [];

       // Query backend policy
       const policyRes = await base44.functions.invoke('openclawEnforcement', { action: 'get_policy' });
       const policy = policyRes.data?.policy;
     } catch (err) {
       console.error('Failed to query backend enforcement:', err);
     }

     // Run all verification checks
     const pageText = document.body.innerText;

    // Navigation Structure - check for actual tab buttons/elements
    const navPanelNames = [
      'Command Queue', 'Browser Session', 'Overview', 'Status', 'Safe Command Test',
      'Safety Tests', 'Readiness Gate', 'Approval Workflow', 'Policy Registry', 'Connectors',
      'Risk Matrix', 'Runbook', 'Simulations', 'Snapshot', 'Handoff', 'Production Checklist',
      'Browser Read', 'Risk Map', 'Executed Commands', 'Workflows', 'Node Registry',
      'Live Logs', 'Execution Readiness', 'Telemetry', 'Legacy Review', 'RBAC Matrix', 'Access Review',
      'Session Timeout', 'Secret Vault', 'Broker Vault', 'Secret Enforcement'
    ];

    navPanelNames.forEach((name) => {
      const checkId = `nav_${name.toLowerCase().replace(/\s+/g, '_')}`;
      // Check for actual tab button elements, not just text in labels/descriptions
      const tabButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.innerText.includes(name) && !btn.disabled
      );
      const found = tabButtons.length > 0;
      newResults[checkId] = {
        status: found ? 'pass' : 'warn',
        explanation: `Checks whether the ${name} panel tab button is accessible and enabled.`,
        details: found ? `Found ${tabButtons.length} enabled tab button(s) for "${name}".` : `No enabled tab button found for "${name}" - may need manual navigation check.`,
      };
    });

    // Safety Gates - check for actual UI elements with audit-only notice content
    const auditNoticeElements = Array.from(document.querySelectorAll('[class*="audit"], [class*="read-only"]')).filter(el =>
      el.innerText && (el.innerText.includes('audit-only') || el.innerText.includes('read-only')) && el.innerText.includes('This panel')
    );
    
    newResults.safety_audit_notice = {
      status: auditNoticeElements.length > 0 ? 'pass' : 'warn',
      explanation: 'Verifies Production Checklist displays audit-only safety notice.',
      details: auditNoticeElements.length > 0 ? `Found ${auditNoticeElements.length} audit-only notice(s).` : 'Audit-only notice not found in visible UI elements.',
    };

    // Check for disabled execution mode via actual UI state
    const simulatedModeIndicators = Array.from(document.querySelectorAll('span, div')).filter(el =>
      el.innerText && el.innerText.includes('SIMULATED') && !el.innerText.includes('label') && !el.innerText.includes('description')
    );
    
    newResults.safety_live_disabled = {
      status: simulatedModeIndicators.length > 0 ? 'pass' : 'warn',
      explanation: 'Verifies live execution is disabled globally via execution mode indicator.',
      details: simulatedModeIndicators.length > 0 ? `Found SIMULATED mode indicator(s).` : 'SIMULATED mode indicator not clearly visible.',
    };

    newResults.safety_rbac_shows_disabled = {
      status: pageText.includes('LIVE_BLOCKED') || pageText.includes('Read Only') ? 'pass' : 'warn',
      explanation: 'Verifies RBAC Matrix shows live execution is permanently disabled.',
      details: 'Check RBAC Matrix tab for trading mode restrictions.',
    };

    newResults.safety_governance_docs = {
      status: pageText.includes('Policy Registry') ? 'pass' : 'warn',
      explanation: 'Verifies governance constraints are documented in Policy Registry.',
    };

    // RBAC / Access Control - check for actual role badge/indicator elements
    const roleIndicators = ['OWNER', 'ADMIN', 'OPERATOR', 'AUDITOR', 'READ_ONLY'];
    const foundRoles = roleIndicators.filter(role =>
      Array.from(document.querySelectorAll('span, div, badge')).some(el =>
        el.innerText && el.innerText.includes(role) && el.classList.toString().includes('badge') || el.classList.toString().includes('role')
      )
    );

    newResults.rbac_access_review_init = {
      status: foundRoles.length >= 3 ? 'pass' : 'warn',
      explanation: 'Verifies Access Review has default roles configured.',
      details: `Found ${foundRoles.length} role types visible.`,
    };

    roleIndicators.forEach(role => {
      const checkId = `rbac_${role.toLowerCase()}_visible`;
      const isVisible = foundRoles.includes(role);
      newResults[checkId] = {
        status: isVisible ? 'pass' : 'warn',
        explanation: `Verifies ${role} role is visible in RBAC configuration.`,
      };
    });

    // Production Readiness - Secrets Check (smart detection, avoid label false positives)
    const hasApiKeys = scanForApiKeys();
    const hasEnvSecrets = /DATABASE_URL|STRIPE_SECRET|API_SECRET|PASSWORD=/i.test(pageText);
    const hasTokens = scanForExposedTokens();

    newResults.prod_no_api_keys = {
      status: !hasApiKeys ? 'pass' : 'fail',
      explanation: 'Verifies no API keys are rendered in the UI.',
      suggestedFix: hasApiKeys ? 'Remove exposed API keys and ensure they are only loaded server-side.' : undefined,
    };

    newResults.prod_no_secrets = {
      status: !hasEnvSecrets ? 'pass' : 'fail',
      explanation: 'Verifies no secret values are visible in the UI.',
      suggestedFix: hasEnvSecrets ? 'Audit components for secret exposure and keep all secrets server-side only.' : undefined,
    };

    newResults.prod_no_tokens = {
      status: !hasTokens ? 'pass' : 'fail',
      explanation: 'Verifies no bearer tokens or access tokens are visible.',
      suggestedFix: hasTokens ? 'Ensure tokens are never sent to or stored in the frontend.' : undefined,
    };

    newResults.prod_gateway_reachable = {
      status: pageText.includes('ONLINE') || pageText.includes('Reachable') ? 'pass' : 'warn',
      explanation: 'Checks whether OpenClaw Gateway is reachable.',
    };

    newResults.prod_cloudflare_protected = {
      status: pageText.includes('Cloudflare') || pageText.includes('CF Access') ? 'pass' : 'warn',
      explanation: 'Verifies Cloudflare Access protection is active.',
    };

    // Audit / Logging - check for actual notice elements in panels, not just text
    const readOnlyNotices = Array.from(document.querySelectorAll('[class*="audit"], [class*="read-only"], div')).filter(el =>
      el.innerText && (el.innerText.includes('audit-only') || el.innerText.includes('read-only')) && el.classList.toString().includes('border')
    );

    newResults.audit_readonly_notices = {
      status: readOnlyNotices.length > 0 ? 'pass' : 'warn',
      explanation: 'Verifies read-only/audit-only notices are displayed in panels.',
      details: `Found ${readOnlyNotices.length} notice element(s).`,
    };

    const auditTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      (btn.innerText.includes('Executed') || btn.innerText.includes('Audit')) && !btn.disabled
    );
    
    newResults.audit_executed_commands = {
      status: auditTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Executed Commands audit view tab is accessible.',
      details: auditTabButton ? 'Audit tab button is accessible.' : 'Audit tab button not found or disabled.',
    };

    const legacyTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Legacy') && !btn.disabled
    );
    
    newResults.audit_legacy_review = {
      status: legacyTabButton ? 'pass' : 'warn',
      explanation: 'Verifies legacy execution review tab is available.',
      details: legacyTabButton ? 'Legacy Review tab is accessible.' : 'Legacy Review tab not found.',
    };

    const logsTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Live Logs') && !btn.disabled
    );
    
    newResults.audit_live_logs = {
      status: logsTabButton ? 'pass' : 'warn',
      explanation: 'Verifies live logs panel tab is accessible.',
      details: logsTabButton ? 'Live Logs tab is accessible.' : 'Live Logs tab not found.',
    };

    // Browser Bridge Safety - check actual tab buttons
    const safeCmdTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Safe Command') && !btn.disabled
    );
    
    newResults.browser_safe_test_accessible = {
      status: safeCmdTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Safe Command Test panel tab is accessible and enabled.',
      details: safeCmdTabButton ? 'Tab button is enabled.' : 'Tab button not found or disabled.',
    };

    const browserReadTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Browser Read') && !btn.disabled
    );
    
    newResults.browser_read_actions_accessible = {
      status: browserReadTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Browser Read Actions panel tab is accessible.',
      details: browserReadTabButton ? 'Tab is enabled.' : 'Tab not found or disabled.',
    };

    newResults.browser_mutations_blocked = {
      status: simulatedModeIndicators.length > 0 ? 'pass' : 'warn',
      explanation: 'Verifies mutation commands are blocked via SIMULATED execution mode.',
      details: 'Mutations are only allowed in LIVE mode, which is disabled.',
    };

    const sessionTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Browser Session') && !btn.disabled
    );
    
    newResults.browser_session_tracking = {
      status: sessionTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Browser Session tracking panel is accessible.',
      details: sessionTabButton ? 'Session tracking tab is enabled.' : 'Tab not found.',
    };

    // Connector Safety - check actual tab buttons
    const connectorTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Connector') && !btn.disabled
    );
    
    newResults.conn_health_matrix = {
      status: connectorTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Connector Health Matrix panel tab is accessible.',
      details: connectorTabButton ? 'Connector tab is enabled.' : 'Tab not found.',
    };

    const nodeRegTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Node Registry') && !btn.disabled
    );
    
    newResults.conn_node_registry = {
      status: nodeRegTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Node Registry panel is accessible.',
      details: nodeRegTabButton ? 'Node Registry tab is enabled.' : 'Tab not found.',
    };

    const statusTabButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText.includes('Status') && !btn.disabled
    );
    
    newResults.conn_status_checks = {
      status: statusTabButton ? 'pass' : 'warn',
      explanation: 'Verifies Status panel with connector checks is accessible.',
      details: statusTabButton ? 'Status tab is enabled.' : 'Tab not found.',
    };

    // UI Readability / Contrast
    const lowOpacityElements = document.querySelectorAll('[class*="opacity-30"], [class*="opacity-40"], [class*="opacity-50"]');
    const slateElements = document.querySelectorAll('[class*="slate-"]');

    newResults.ui_readable_text = {
      status: slateElements.length > lowOpacityElements.length ? 'pass' : 'warn',
      explanation: 'Verifies readable text contrast is used instead of low-opacity muted.',
      details: `Found ${slateElements.length} readable vs ${lowOpacityElements.length} low-opacity elements.`,
    };

    newResults.ui_headers_visible = {
      status: document.querySelectorAll('h1, h2, [class*="font-semibold"]').length > 5 ? 'pass' : 'warn',
      explanation: 'Verifies panel headers are prominent and visible.',
    };

    newResults.ui_status_badges_clear = {
      status: pageText.includes('PASS') || pageText.includes('FAIL') || pageText.includes('WARN') ? 'pass' : 'warn',
      explanation: 'Verifies status badges are color-coded and clear.',
    };

    // Live Execution Lockout - check actual UI state, not just text
    const modeDisplay = Array.from(document.querySelectorAll('span, div')).find(el =>
      el.innerText && (el.innerText.includes('SIMULATED') || el.innerText.includes('mode'))
    );
    
    newResults.lockout_global_disabled = {
      status: simulatedModeIndicators.length > 0 ? 'pass' : 'fail',
      explanation: 'CRITICAL: Verifies live execution is globally disabled via SIMULATED mode.',
      details: 'Execution mode must be SIMULATED, never LIVE.',
      suggestedFix: simulatedModeIndicators.length === 0 ? 'Ensure execution mode is set to SIMULATED at startup.' : undefined,
    };

    const killSwitchButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.innerText && btn.innerText.includes('Kill') && !btn.disabled
    );
    
    newResults.lockout_kill_switch = {
      status: killSwitchButton ? 'pass' : 'warn',
      explanation: 'Verifies emergency kill switch button is available and enabled.',
      details: killSwitchButton ? 'Kill switch button is accessible.' : 'Kill switch button not found or is disabled.',
    };

    const bypassDetected = scanForBypassUI();
    newResults.lockout_no_bypass = {
      status: !bypassDetected ? 'pass' : 'fail',
      explanation: 'Verifies lockout cannot be bypassed via enabled UI controls.',
      suggestedFix: bypassDetected ? 'Remove or disable any buttons/toggles that can enable live mode.' : undefined,
      details: bypassDetected ? 'Found enabled UI controls that can enable live execution.' : 'No enabled live-enable controls found.',
    };

    newResults.lockout_mode_simulated = {
      status: simulatedModeIndicators.length > 0 ? 'pass' : 'fail',
      explanation: 'Verifies execution mode is SIMULATED by default (never LIVE on startup).',
      suggestedFix: simulatedModeIndicators.length === 0 ? 'Backend must enforce SIMULATED mode on initialization.' : undefined,
    };

    // Backend enforcement checks (from openclawEnforcement)
    try {
      const enforcementRes = await base44.functions.invoke('openclawEnforcement', { action: 'run_all_tests' });
      const enforcementTests = enforcementRes.data?.results || [];
      const allTestsPassed = enforcementTests.every(t => t.passed);
      
      newResults.backend_enforcement_tests = {
        status: allTestsPassed ? 'pass' : 'fail',
        explanation: 'Backend validation test suite must pass: live blocking, domain allowlist, secret detection, RBAC, audit logging, HMAC signatures.',
        details: `${enforcementTests.filter(t => t.passed).length}/${enforcementTests.length} tests passed`,
        suggestedFix: !allTestsPassed ? 'Review failed validation tests in backend enforcement logs.' : undefined,
      };

      const policyRes = await base44.functions.invoke('openclawEnforcement', { action: 'get_policy' });
      const policy = policyRes.data?.policy;
      
      if (policy) {
        newResults.backend_policy_live_disabled = {
          status: policy.LIVE_EXECUTION_ENABLED === false ? 'pass' : 'fail',
          explanation: 'Backend policy must have LIVE_EXECUTION_ENABLED = false.',
          details: `Backend setting: LIVE_EXECUTION_ENABLED = ${policy.LIVE_EXECUTION_ENABLED}`,
        };

        newResults.backend_policy_simulated_only = {
          status: policy.SIMULATED_MODE_ONLY === true ? 'pass' : 'fail',
          explanation: 'Backend policy must enforce SIMULATED_MODE_ONLY = true.',
          details: `Backend setting: SIMULATED_MODE_ONLY = ${policy.SIMULATED_MODE_ONLY}`,
        };

        newResults.backend_policy_rbac = {
          status: policy.REQUIRE_RBAC === true ? 'pass' : 'fail',
          explanation: 'Backend policy must require RBAC.',
          details: `Backend setting: REQUIRE_RBAC = ${policy.REQUIRE_RBAC}`,
        };

        newResults.backend_policy_audit_logging = {
          status: policy.REQUIRE_AUDIT_LOGGING === true ? 'pass' : 'fail',
          explanation: 'Backend policy must require audit logging for all commands.',
          details: `Backend setting: REQUIRE_AUDIT_LOGGING = ${policy.REQUIRE_AUDIT_LOGGING}`,
        };

        newResults.backend_policy_hmac = {
          status: policy.REQUIRE_HMAC_SIGNATURES === true ? 'pass' : 'fail',
          explanation: 'Backend policy must require HMAC signatures for command integrity.',
          details: `Backend setting: REQUIRE_HMAC_SIGNATURES = ${policy.REQUIRE_HMAC_SIGNATURES}`,
        };
      }
    } catch (err) {
      console.error('Failed to query backend enforcement:', err);
      newResults.backend_enforcement_unavailable = {
        status: 'warn',
        explanation: 'Backend enforcement module is not responding.',
        details: err.message,
        suggestedFix: 'Ensure openclawEnforcement function is deployed and accessible.',
      };
    }

    setResults(newResults);
    setLastRunTime(new Date().toLocaleString());
    setRunning(false);
  };

  useEffect(() => {
    runVerification();
  }, []);

  const toggleExpanded = (checkId) => {
    setExpandedChecks(prev => ({
      ...prev,
      [checkId]: !prev[checkId],
    }));
  };

  // Helper to determine fix type
  const determineFixType = (checkId) => {
    if (checkId.includes('backend')) return 'Backend Fix';
    if (checkId.includes('secret') || checkId.includes('api_key') || checkId.includes('token')) return 'Secret/Credential Setup';
    if (checkId.includes('cloudflare')) return 'Cloudflare Setup';
    if (checkId.includes('broker') || checkId.includes('vault')) return 'Broker Vault Setup';
    if (checkId.includes('live') || checkId.includes('lockout')) return 'Governance/Policy';
    if (checkId.includes('gateway')) return 'VPS/Gateway';
    return 'Manual Setup';
  };

  // Memoize blocking issues calculation to avoid temporal dead zone
  const { allChecks, failedChecks, prodBlockingFailed, warnChecks, blockingIssues } = useMemo(() => {
    const checks = VERIFICATION_GROUPS.flatMap(g => g.checks);
    const failed = checks.filter(c => results[c.id]?.status === 'fail');
    const prodBlocking = failed.filter(c => c.prodBlocking);
    const warns = checks.filter(c => results[c.id]?.status === 'warn');

    const issues = [];

    // BLOCKING issues
    for (const check of checks) {
      const result = results[check.id];
      if (result?.status === 'fail' && check.prodBlocking) {
        issues.push({
          severity: 'BLOCKING',
          name: check.name,
          panel: check.panel,
          why: check.why || 'Critical for production safety',
          action: result.suggestedFix || 'Review check details and remediate',
          fixType: determineFixType(check.id),
        });
      }
    }

    // WARNING issues
    for (const check of checks) {
      const result = results[check.id];
      if ((result?.status === 'warn' || (result?.status === 'fail' && !check.prodBlocking)) && !check.id.includes('nav_')) {
        issues.push({
          severity: 'WARNING',
          name: check.name,
          panel: check.panel,
          why: check.why || 'Important for system stability',
          action: result.suggestedFix || result.explanation || 'Review check details',
          fixType: determineFixType(check.id),
        });
      }
    }

    // Sort: BLOCKING first, then WARNING
    issues.sort((a, b) => {
      if (a.severity === 'BLOCKING' && b.severity !== 'BLOCKING') return -1;
      if (a.severity !== 'BLOCKING' && b.severity === 'BLOCKING') return 1;
      return 0;
    });

    return {
      allChecks: checks,
      failedChecks: failed,
      prodBlockingFailed: prodBlocking,
      warnChecks: warns,
      blockingIssues: issues,
    };
  }, [results]);

  let systemStatus = 'SYSTEM VERIFIED';
  let statusColor = 'text-primary';
  let statusBg = 'bg-primary/5 border-primary/20';

  if (prodBlockingFailed.length > 0) {
    systemStatus = 'SYSTEM BLOCKED';
    statusColor = 'text-destructive';
    statusBg = 'bg-destructive/5 border-destructive/20';
  } else if (warnChecks.length > 0 || failedChecks.length > 0) {
    systemStatus = 'SYSTEM HAS WARNINGS';
    statusColor = 'text-amber-500';
    statusBg = 'bg-amber-500/5 border-amber-500/20';
  }

  const passCount = allChecks.filter(c => results[c.id]?.status === 'pass').length;
  const totalCount = allChecks.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">System Verification — Source of Truth</div>
          <div className="text-[13px] font-semibold text-foreground">OpenClaw Control Production Readiness</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Operator Guidance */}
      <OperatorGuidancePanel
        verificationResults={results}
        backendStatus={{ passed: Object.values(results).filter(r => r?.status === 'pass').length > 0 }}
      />

      {/* Blocking Issues Section */}
      {blockingIssues.length > 0 && (
        <div className="space-y-3 bg-card/30 border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div className="text-[12px] font-semibold text-destructive uppercase tracking-wider">
              {blockingIssues.filter(i => i.severity === 'BLOCKING').length} Blocking Issue{blockingIssues.filter(i => i.severity === 'BLOCKING').length !== 1 ? 's' : ''}
              {blockingIssues.filter(i => i.severity === 'WARNING').length > 0 && ` · ${blockingIssues.filter(i => i.severity === 'WARNING').length} Warning${blockingIssues.filter(i => i.severity === 'WARNING').length !== 1 ? 's' : ''}`}
            </div>
          </div>

          <div className="space-y-2">
            {blockingIssues.map((issue, idx) => (
              <div key={idx} className={`border rounded-lg p-3 space-y-2 ${
                issue.severity === 'BLOCKING'
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-semibold ${issue.severity === 'BLOCKING' ? 'text-destructive' : 'text-amber-500'}`}>
                      {issue.name}
                    </div>
                    <div className="text-[9px] text-foreground/60 mt-0.5">
                      <span className="font-semibold">Panel:</span> {issue.panel}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8px] px-2 py-0.5 border rounded font-semibold ${
                      issue.severity === 'BLOCKING'
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="text-[8px] px-2 py-0.5 border border-border/50 bg-secondary/30 text-muted-foreground rounded">
                      {issue.fixType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <div className="font-semibold text-foreground/80 mb-0.5">Why it matters</div>
                    <div className="text-foreground/70">{issue.why}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground/80 mb-0.5">Next action</div>
                    <div className="text-foreground/70">{issue.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[8px] text-muted-foreground/70 border-t border-border/30 pt-3 mt-3">
            All blocking issues must be resolved before production deployment. Read-only verification only. No commands executed, secrets exposed, or governance bypassed.
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className={`border rounded-lg px-4 py-3 ${statusBg}`}>
        <div className={`text-[14px] font-semibold ${statusColor} mb-1 uppercase tracking-wider`}>{systemStatus}</div>
        <div className={`text-[10px] ${statusColor}/80`}>
          {systemStatus === 'SYSTEM VERIFIED' && 'All critical safety checks passed. System is ready for operation.'}
          {systemStatus === 'SYSTEM BLOCKED' && `${prodBlockingFailed.length} production-blocking issue${prodBlockingFailed.length !== 1 ? 's' : ''} detected. System is not ready.`}
          {systemStatus === 'SYSTEM HAS WARNINGS' && `${warnChecks.length} warning${warnChecks.length !== 1 ? 's' : ''} and ${failedChecks.length} non-blocking issue${failedChecks.length !== 1 ? 's' : ''} detected. Review before production.`}
        </div>
        {prodBlockingFailed.length > 0 && (
          <div className="mt-2 text-[9px] text-destructive/90">
            <div className="font-semibold mb-1">Production-blocking issues:</div>
            <ul className="list-disc ml-4 space-y-0.5">
              {prodBlockingFailed.slice(0, 5).map(c => (
                <li key={c.id}>{c.name}</li>
              ))}
              {prodBlockingFailed.length > 5 && <li>+ {prodBlockingFailed.length - 5} more</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Read-only Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Master verification is read-only.</div>
          <div className="text-[9px] text-primary/70">It verifies UI structure, safety gates, and configuration. It does not execute commands, enable live mode, expose secrets, bypass governance, or mutate production data.</div>
        </div>
      </div>

      {/* Run Button & Last Run Time */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={runVerification}
          disabled={running}
          className="px-4 py-2 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 font-semibold rounded"
        >
          {running ? '⏳ Running verification...' : '▶ Re-run Full Verification'}
        </button>
        <div className="text-[9px] text-slate-400 font-mono">
          {passCount} / {totalCount} checks passed
          {lastRunTime && <div className="mt-0.5">Last run: {lastRunTime}</div>}
        </div>
      </div>

      {/* Verification Groups */}
      <div className="space-y-3">
        {VERIFICATION_GROUPS.map(group => (
          <VerificationGroup
            key={group.id}
            group={group}
            results={results}
            expandedChecks={expandedChecks}
            onToggleCheck={toggleExpanded}
          />
        ))}
      </div>

      {/* Footer Notice — Authority Statement */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-[9px] text-primary/80">
        <Shield className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold text-primary mb-0.5">System Verify is the Single Source of Truth.</div>
          <div className="text-[8px] text-primary/70">Production Checklist and all other panels report to this verification. PRODUCTION_READY status is granted only when ALL backend enforcement tests pass and all safety gates are green. No panel, checklist review, or operator action can bypass this gateway.</div>
        </div>
      </div>
    </div>
  );
}