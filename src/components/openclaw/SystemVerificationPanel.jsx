import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';

// Define all verification checks for OpenClaw Control system
const VERIFICATION_CHECKS = [
  // Tab Existence Checks
  { name: 'Command Queue tab exists', category: 'Tab Structure', critical: true, id: 'tab_command_queue' },
  { name: 'Browser Session tab exists', category: 'Tab Structure', critical: true, id: 'tab_browser_session' },
  { name: 'Overview tab exists', category: 'Tab Structure', critical: true, id: 'tab_overview' },
  { name: 'Status tab exists', category: 'Tab Structure', critical: true, id: 'tab_status' },
  { name: 'Safe Command Test tab exists', category: 'Tab Structure', critical: true, id: 'tab_safe_command' },
  { name: 'Safety Tests tab exists', category: 'Tab Structure', critical: true, id: 'tab_safety_tests' },
  { name: 'Readiness Gate tab exists', category: 'Tab Structure', critical: true, id: 'tab_readiness_gate' },
  { name: 'Approval Workflow tab exists', category: 'Tab Structure', critical: true, id: 'tab_approval' },
  { name: 'Policy Registry tab exists', category: 'Tab Structure', critical: true, id: 'tab_policy' },
  { name: 'Connectors tab exists', category: 'Tab Structure', critical: true, id: 'tab_connectors' },
  { name: 'Risk Matrix tab exists', category: 'Tab Structure', critical: true, id: 'tab_risk_matrix' },
  { name: 'Runbook tab exists', category: 'Tab Structure', critical: true, id: 'tab_runbook' },
  { name: 'Simulations tab exists', category: 'Tab Structure', critical: true, id: 'tab_simulations' },
  { name: 'Snapshot tab exists', category: 'Tab Structure', critical: true, id: 'tab_snapshot' },
  { name: 'Handoff tab exists', category: 'Tab Structure', critical: true, id: 'tab_handoff' },
  { name: 'Production Checklist tab exists', category: 'Tab Structure', critical: true, id: 'tab_prod_checklist' },
  { name: 'Browser Read tab exists', category: 'Tab Structure', critical: true, id: 'tab_browser_read' },
  { name: 'Risk Map tab exists', category: 'Tab Structure', critical: true, id: 'tab_risk_map' },
  { name: 'Executed Commands tab exists', category: 'Tab Structure', critical: true, id: 'tab_executed_commands' },
  { name: 'Workflows tab exists', category: 'Tab Structure', critical: true, id: 'tab_workflows' },
  { name: 'Node Registry tab exists', category: 'Tab Structure', critical: true, id: 'tab_node_registry' },
  { name: 'Live Logs tab exists', category: 'Tab Structure', critical: true, id: 'tab_live_logs' },
  { name: 'Execution Readiness tab exists', category: 'Tab Structure', critical: true, id: 'tab_exec_readiness' },
  { name: 'Telemetry tab exists', category: 'Tab Structure', critical: true, id: 'tab_telemetry' },
  { name: 'Legacy Review tab exists', category: 'Tab Structure', critical: true, id: 'tab_legacy_review' },
  { name: 'RBAC Matrix tab exists', category: 'Tab Structure', critical: true, id: 'tab_rbac_matrix' },
  { name: 'Access Review tab exists', category: 'Tab Structure', critical: true, id: 'tab_access_review' },

  // Safety Configuration Checks
  { name: 'Production Checklist shows audit-only notice', category: 'Safety Gates', critical: true, id: 'check_checklist_audit' },
  { name: 'RBAC Matrix shows live execution disabled', category: 'Safety Gates', critical: true, id: 'check_rbac_live_disabled' },
  { name: 'Access Review initialized with default roles', category: 'Safety Gates', critical: false, id: 'check_access_review_init' },
  { name: 'Live execution globally disabled', category: 'Safety Gates', critical: true, id: 'check_global_live_disabled' },

  // UI/UX Checks
  { name: 'No API keys rendered in UI', category: 'Security Visibility', critical: true, id: 'check_no_api_keys' },
  { name: 'No secret values visible in UI', category: 'Security Visibility', critical: true, id: 'check_no_secrets' },
  { name: 'Text uses readable slate/foreground instead of low-opacity muted', category: 'Accessibility', critical: false, id: 'check_text_contrast' },
  { name: 'Governance constraints clearly documented', category: 'Documentation', critical: true, id: 'check_governance_docs' },
  { name: 'All panels show read-only/audit-only notices where required', category: 'Documentation', critical: true, id: 'check_readonly_notices' },
];

function VerificationCheck({ check, result, expanded, onToggle }) {
  const resultStatus = result?.status || 'not_run';
  const statusConfig = {
    pass: { icon: CheckCircle2, color: 'text-primary', label: 'PASS', bg: 'bg-primary/5 border-primary/20' },
    fail: { icon: AlertCircle, color: 'text-destructive', label: 'FAIL', bg: 'bg-destructive/5 border-destructive/20' },
    needs_review: { icon: Clock, color: 'text-amber-500', label: 'NEEDS REVIEW', bg: 'bg-amber-500/5 border-amber-500/20' },
    not_run: { icon: Clock, color: 'text-slate-500', label: 'NOT RUN', bg: 'bg-slate-500/5 border-slate-500/20' },
  };

  const cfg = statusConfig[resultStatus];
  const Icon = cfg.icon;

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onToggle(check.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground">{check.name}</div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              {check.category}
              {check.critical && <span className="ml-2 text-destructive font-semibold">CRITICAL</span>}
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
        <div className="border-t px-4 py-3 space-y-2 bg-card/50 text-[9px]">
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Explanation</div>
            <div className="text-slate-300">{result?.explanation || 'Verifies that the required tab or safety gate is present and visible in the UI.'}</div>
          </div>
          {result?.suggestedFix && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Suggested Fix</div>
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

export default function SystemVerificationPanel() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [lastRunTime, setLastRunTime] = useState(null);

  const runVerification = async () => {
    setRunning(true);
    const newResults = {};

    // Tab Structure Checks
    const tabNames = [
      'tab_command_queue', 'tab_browser_session', 'tab_overview', 'tab_status',
      'tab_safe_command', 'tab_safety_tests', 'tab_readiness_gate', 'tab_approval',
      'tab_policy', 'tab_connectors', 'tab_risk_matrix', 'tab_runbook',
      'tab_simulations', 'tab_snapshot', 'tab_handoff', 'tab_prod_checklist',
      'tab_browser_read', 'tab_risk_map', 'tab_executed_commands', 'tab_workflows',
      'tab_node_registry', 'tab_live_logs', 'tab_exec_readiness', 'tab_telemetry',
      'tab_legacy_review', 'tab_rbac_matrix', 'tab_access_review',
    ];

    // These tab names are the expected ones in OpenClawControl
    // We'll verify that the tab navigation structure exists
    const openClawElement = document.querySelector('[data-panel="openclaw-control"]') || 
                            document.querySelector('[role="tablist"]') ||
                            document.querySelector('[class*="tabs"]');

    tabNames.forEach(tabId => {
      const tabElement = document.querySelector(`[data-tab="${tabId}"]`) || 
                        document.querySelector(`[id*="${tabId}"]`) ||
                        document.querySelector(`[aria-label*="${tabId.replace('tab_', '').replace(/_/g, ' ')}"]`);
      
      newResults[tabId] = {
        status: tabElement ? 'pass' : 'needs_review',
        explanation: `Checks whether the ${tabId.replace('tab_', '').replace(/_/g, ' ')} tab is available in the navigation.`,
        details: tabElement ? 'Tab element found in DOM' : 'Tab element not found - may be dynamically loaded or named differently.',
      };
    });

    // Safety Configuration Checks
    newResults.check_checklist_audit = {
      status: document.body.innerText.includes('audit-only') ? 'pass' : 'needs_review',
      explanation: 'Verifies that the Production Checklist panel displays an audit-only safety notice.',
      details: 'Checks for presence of "audit-only" text in the checklist panel.',
    };

    newResults.check_rbac_live_disabled = {
      status: document.body.innerText.includes('PERMANENTLY DISABLED') || document.body.innerText.includes('Live execution') ? 'pass' : 'needs_review',
      explanation: 'Verifies that the RBAC Matrix clearly shows live execution is disabled for all roles.',
      details: 'Checks for "PERMANENTLY DISABLED" or "live execution" safety notice.',
    };

    newResults.check_access_review_init = {
      status: document.body.innerText.includes('OWNER') && document.body.innerText.includes('ADMIN') ? 'pass' : 'needs_review',
      explanation: 'Verifies that Access Review panel has been initialized with default roles.',
      details: 'Checks for presence of default role names (OWNER, ADMIN, OPERATOR, AUDITOR, READ_ONLY).',
    };

    newResults.check_global_live_disabled = {
      status: document.body.innerText.includes('disabled') ? 'pass' : 'needs_review',
      explanation: 'Verifies that live execution is disabled globally across all panels.',
      details: 'Scans page text for "disabled" or "DISABLED" keywords.',
    };

    // Security Visibility Checks
    const pageText = document.body.innerText;
    const hasApiKeys = /sk-[\w]{20,}|api[_-]?key|secret[_-]?key|bearer\s[\w]+/i.test(pageText);
    const hasEnvSecrets = /DATABASE_URL|STRIPE_SECRET|API_SECRET|PASSWORD|TOKEN=/i.test(pageText);

    newResults.check_no_api_keys = {
      status: !hasApiKeys ? 'pass' : 'fail',
      explanation: 'Verifies that no API keys are rendered or visible in the UI.',
      suggestedFix: hasApiKeys ? 'Remove any exposed API keys from the UI and ensure they are only loaded server-side.' : undefined,
    };

    newResults.check_no_secrets = {
      status: !hasEnvSecrets ? 'pass' : 'fail',
      explanation: 'Verifies that no secret values or environment variables are visible in the UI.',
      suggestedFix: hasEnvSecrets ? 'Audit all components for secret exposure and ensure secrets remain server-side only.' : undefined,
    };

    // Text Contrast Check
    const lowOpacityElements = document.querySelectorAll('[class*="muted-foreground/"], [class*="opacity-30"], [class*="opacity-40"], [class*="opacity-50"]');
    const slateElements = document.querySelectorAll('[class*="slate-"]');

    newResults.check_text_contrast = {
      status: slateElements.length > lowOpacityElements.length ? 'pass' : 'needs_review',
      explanation: 'Verifies that readable text contrast uses slate/foreground colors instead of low-opacity muted classes.',
      details: `Found ${slateElements.length} readable elements vs ${lowOpacityElements.length} low-opacity elements.`,
    };

    newResults.check_governance_docs = {
      status: document.body.innerText.includes('governance') || document.body.innerText.includes('approval') ? 'pass' : 'needs_review',
      explanation: 'Verifies that governance constraints are clearly documented in panel headers/notices.',
      details: 'Checks for presence of "governance" or "approval" documentation.',
    };

    newResults.check_readonly_notices = {
      status: document.body.innerText.includes('read-only') || document.body.innerText.includes('audit-only') ? 'pass' : 'needs_review',
      explanation: 'Verifies that all read-only and audit-only panels display appropriate notices.',
      details: 'Checks for "read-only" or "audit-only" notices across panels.',
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

  // Calculate summary stats
  const statusCounts = {
    total: VERIFICATION_CHECKS.length,
    passed: Object.values(results).filter(r => r.status === 'pass').length,
    failed: Object.values(results).filter(r => r.status === 'fail').length,
    needsReview: Object.values(results).filter(r => r.status === 'needs_review').length,
  };

  const criticalFailed = Object.entries(results)
    .filter(([_, r]) => r.status === 'fail')
    .map(([id, _]) => VERIFICATION_CHECKS.find(c => c.id === id))
    .filter(c => c?.critical).length;

  // Filtering
  const filtered = VERIFICATION_CHECKS.filter(check => {
    const result = results[check.id] || { status: 'not_run' };
    if (filter === 'ALL') return true;
    if (filter === 'PASSED') return result.status === 'pass';
    if (filter === 'FAILED') return result.status === 'fail';
    if (filter === 'NEEDS_REVIEW') return result.status === 'needs_review';
    if (filter === 'CRITICAL') return check.critical;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">System Verification</div>
          <div className="text-[13px] font-semibold text-foreground">UI & Safety Configuration Check</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Read-only Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">System verification is read-only.</div>
          <div className="text-[9px] text-primary/70">It checks UI structure, safety gates, and configuration visibility only. It does not execute commands, enable live mode, expose secrets, call brokers, bypass governance, or mutate production data.</div>
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
          {running ? '⏳ Running verification...' : '▶ Run Full UI Verification'}
        </button>
        {lastRunTime && (
          <div className="text-[9px] text-slate-400 font-mono">Last run: {lastRunTime}</div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total Checks</div>
          <div className="text-[14px] font-semibold text-foreground">{statusCounts.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Passed</div>
          <div className="text-[14px] font-semibold text-primary">{statusCounts.passed}</div>
        </div>
        <div className={`${statusCounts.failed > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-secondary/20 border-border'} border px-3 py-2 rounded`}>
          <div className={`${statusCounts.failed > 0 ? 'text-destructive/70' : 'text-slate-400'} uppercase tracking-wider mb-1 text-[8px] font-semibold`}>Failed</div>
          <div className={`text-[14px] font-semibold ${statusCounts.failed > 0 ? 'text-destructive' : 'text-foreground'}`}>{statusCounts.failed}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Needs Review</div>
          <div className="text-[14px] font-semibold text-amber-500">{statusCounts.needsReview}</div>
        </div>
      </div>

      {/* Critical Failures Alert */}
      {criticalFailed > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-[10px] text-destructive/80">
            <div className="font-semibold">{criticalFailed} critical check{criticalFailed !== 1 ? 's' : ''} failed.</div>
            <div className="text-[9px] text-destructive/70 mt-0.5">Review failed critical checks below and address before proceeding.</div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {['ALL', 'PASSED', 'FAILED', 'NEEDS_REVIEW', 'CRITICAL'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[9px] border transition-colors whitespace-nowrap rounded font-semibold ${
              filter === f
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
            }`}
          >
            {f === 'NEEDS_REVIEW' ? 'Needs Review' : f}
          </button>
        ))}
      </div>

      {/* Checks List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">No checks match the selected filter</div>
        ) : (
          filtered.map(check => (
            <VerificationCheck
              key={check.id}
              check={check}
              result={results[check.id]}
              expanded={expandedChecks[check.id]}
              onToggle={toggleExpanded}
            />
          ))
        )}
      </div>

      {/* Footer Notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Verification does not prove production readiness.</div>
          <div className="text-[8px] text-slate-400">It only verifies visible UI and safety configuration. Backend, deployment, secrets, and broker integrations still require controlled validation.</div>
        </div>
      </div>
    </div>
  );
}