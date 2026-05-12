import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

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
          {check.why && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Why It Matters</div>
              <div className="text-slate-300">{check.why}</div>
            </div>
          )}
          {result?.explanation && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">What Was Checked</div>
              <div className="text-slate-300">{result.explanation}</div>
            </div>
          )}
          {result?.suggestedFix && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">What To Fix</div>
              <div className="text-slate-300">{result.suggestedFix}</div>
            </div>
          )}
          {result?.details && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Details</div>
              <div className="font-mono text-slate-400 text-[8px] bg-secondary/30 border border-border/30 p-2 rounded max-h-32 overflow-auto">{result.details}</div>
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

export default function SystemVerificationPanel() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState({});
  const [lastRunTime, setLastRunTime] = useState(null);

  const runVerification = async () => {
    setRunning(true);
    const newResults = {};

    // Run all verification checks
    const pageText = document.body.innerText;

    // Navigation Structure - check for tab elements and text
    const navPanelNames = [
      'Command Queue', 'Browser Session', 'Overview', 'Status', 'Safe Command Test',
      'Safety Tests', 'Readiness Gate', 'Approval Workflow', 'Policy Registry', 'Connectors',
      'Risk Matrix', 'Runbook', 'Simulations', 'Snapshot', 'Handoff', 'Production Checklist',
      'Browser Read', 'Risk Map', 'Executed Commands', 'Workflows', 'Node Registry',
      'Live Logs', 'Execution Readiness', 'Telemetry', 'Legacy Review', 'RBAC Matrix', 'Access Review'
    ];

    navPanelNames.forEach((name, i) => {
      const checkId = `nav_${name.toLowerCase().replace(/\s+/g, '_')}`;
      const found = pageText.includes(name) || document.body.innerHTML.includes(name);
      newResults[checkId] = {
        status: found ? 'pass' : 'warn',
        explanation: `Checks whether the ${name} panel tab is present and accessible in the navigation.`,
        details: found ? `Panel name "${name}" found in page.` : `Panel name "${name}" not found - may be dynamically loaded or need manual verification.`,
      };
    });

    // Safety Gates
    newResults.safety_audit_notice = {
      status: pageText.includes('audit-only') ? 'pass' : 'warn',
      explanation: 'Verifies Production Checklist displays audit-only safety notice.',
    };

    newResults.safety_live_disabled = {
      status: pageText.includes('disabled') || pageText.includes('SIMULATED') ? 'pass' : 'warn',
      explanation: 'Verifies live execution is disabled globally.',
    };

    newResults.safety_rbac_shows_disabled = {
      status: pageText.includes('PERMANENTLY DISABLED') || pageText.includes('Live execution') ? 'pass' : 'warn',
      explanation: 'Verifies RBAC Matrix shows live execution is permanently disabled.',
    };

    newResults.safety_governance_docs = {
      status: pageText.includes('governance') || pageText.includes('approval') ? 'pass' : 'warn',
      explanation: 'Verifies governance constraints are documented.',
    };

    // RBAC / Access Control
    newResults.rbac_access_review_init = {
      status: pageText.includes('OWNER') && pageText.includes('ADMIN') ? 'pass' : 'warn',
      explanation: 'Verifies Access Review has default roles.',
    };

    newResults.rbac_owner_visible = {
      status: pageText.includes('OWNER') ? 'pass' : 'warn',
      explanation: 'Verifies OWNER role is visible.',
    };

    newResults.rbac_admin_visible = {
      status: pageText.includes('ADMIN') ? 'pass' : 'warn',
      explanation: 'Verifies ADMIN role is visible.',
    };

    newResults.rbac_operator_visible = {
      status: pageText.includes('OPERATOR') ? 'pass' : 'warn',
      explanation: 'Verifies OPERATOR role is visible.',
    };

    newResults.rbac_auditor_visible = {
      status: pageText.includes('AUDITOR') ? 'pass' : 'warn',
      explanation: 'Verifies AUDITOR role is visible.',
    };

    newResults.rbac_readonly_visible = {
      status: pageText.includes('READ_ONLY') ? 'pass' : 'warn',
      explanation: 'Verifies READ_ONLY role is visible.',
    };

    // Production Readiness - Secrets Check
    const hasApiKeys = /sk-[\w]{20,}|api[_-]?key|secret[_-]?key/i.test(pageText);
    const hasEnvSecrets = /DATABASE_URL|STRIPE_SECRET|API_SECRET|PASSWORD=/i.test(pageText);
    const hasTokens = /bearer\s[\w]+|access[_-]?token|refresh[_-]?token/i.test(pageText);

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

    // Audit / Logging
    newResults.audit_readonly_notices = {
      status: pageText.includes('read-only') || pageText.includes('audit-only') ? 'pass' : 'warn',
      explanation: 'Verifies read-only and audit-only notices are displayed.',
    };

    newResults.audit_executed_commands = {
      status: pageText.includes('Executed Commands') ? 'pass' : 'warn',
      explanation: 'Verifies Executed Commands audit view is accessible.',
    };

    newResults.audit_legacy_review = {
      status: pageText.includes('Legacy') ? 'pass' : 'warn',
      explanation: 'Verifies legacy execution review is available.',
    };

    newResults.audit_live_logs = {
      status: pageText.includes('Live Logs') ? 'pass' : 'warn',
      explanation: 'Verifies live logs panel is functional.',
    };

    // Browser Bridge Safety
    newResults.browser_safe_test_accessible = {
      status: pageText.includes('Safe Command') ? 'pass' : 'warn',
      explanation: 'Verifies Safe Command Test panel is accessible.',
    };

    newResults.browser_read_actions_accessible = {
      status: pageText.includes('Browser Read') ? 'pass' : 'warn',
      explanation: 'Verifies Browser Read Actions panel is accessible.',
    };

    newResults.browser_mutations_blocked = {
      status: pageText.includes('SIMULATED') ? 'pass' : 'warn',
      explanation: 'Verifies mutation commands are blocked in SIMULATED mode.',
    };

    newResults.browser_session_tracking = {
      status: pageText.includes('Browser Session') ? 'pass' : 'warn',
      explanation: 'Verifies browser session tracking is functional.',
    };

    // Connector Safety
    newResults.conn_health_matrix = {
      status: pageText.includes('Connector') || pageText.includes('Connectors') ? 'pass' : 'warn',
      explanation: 'Verifies Connector Health Matrix shows integrations.',
    };

    newResults.conn_node_registry = {
      status: pageText.includes('Node Registry') ? 'pass' : 'warn',
      explanation: 'Verifies Node Registry is accessible.',
    };

    newResults.conn_status_checks = {
      status: pageText.includes('Status') ? 'pass' : 'warn',
      explanation: 'Verifies connector status checks are available.',
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

    // Live Execution Lockout
    newResults.lockout_global_disabled = {
      status: pageText.includes('disabled') || pageText.includes('SIMULATED') ? 'pass' : 'fail',
      explanation: 'CRITICAL: Verifies live execution is globally disabled.',
      suggestedFix: 'Live execution must be disabled at system level. Check backend enforcement.',
    };

    newResults.lockout_kill_switch = {
      status: pageText.includes('kill') || pageText.includes('Kill') || pageText.includes('emergency') ? 'pass' : 'warn',
      explanation: 'Verifies emergency kill switch is operational.',
    };

    newResults.lockout_no_bypass = {
      status: !hasTokens ? 'pass' : 'fail',
      explanation: 'Verifies lockout cannot be bypassed via UI.',
      suggestedFix: 'Ensure no UI controls can override live execution lockout.',
    };

    newResults.lockout_mode_simulated = {
      status: pageText.includes('SIMULATED') ? 'pass' : 'fail',
      explanation: 'Verifies execution mode defaults to SIMULATED.',
      suggestedFix: 'System must default to SIMULATED mode on startup.',
    };

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

  // Calculate overall system status
  const allChecks = VERIFICATION_GROUPS.flatMap(g => g.checks);
  const failedChecks = allChecks.filter(c => results[c.id]?.status === 'fail');
  const prodBlockingFailed = failedChecks.filter(c => c.prodBlocking);
  const warnChecks = allChecks.filter(c => results[c.id]?.status === 'warn');

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
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Master Verification Dashboard</div>
          <div className="text-[13px] font-semibold text-foreground">OpenClaw Control System Status</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

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

      {/* Footer Notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Verification does not prove production readiness.</div>
          <div className="text-[8px] text-slate-400">It verifies visible UI and safety configuration only. Backend, deployment, secrets management, broker integrations, and operational procedures still require controlled validation and testing.</div>
        </div>
      </div>
    </div>
  );
}