import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const RUNBOOK_SECTIONS = [
  {
    id: 'daily_startup',
    title: 'Daily Startup Check',
    purpose: 'Verify all core OpenClaw systems are operational before beginning work.',
    severity: 'CRITICAL',
    relatedPanel: 'Status',
    steps: [
      'Open OpenClaw Control dashboard.',
      'Navigate to Status tab.',
      'Confirm Gateway status shows "ONLINE".',
      'Confirm Browser Session shows "READY".',
      'Confirm CDP shows "READY" on port 18800.',
      'Confirm Cloudflare Access shows "PROTECTED".',
      'Navigate to Execution Readiness tab.',
      'Confirm all 11 checklist items show "READY".',
      'If any item shows "BLOCKED" or "WARNING", stop and troubleshoot before proceeding.',
      'Log startup completion timestamp.',
    ],
    expectedGoodState: 'All core connectors online. Execution Readiness shows "ALL SYSTEMS READY". No BLOCKED or WARNING items.',
    warningSigns: 'Gateway unreachable. Browser Session inactive. CDP port not listening. Cloudflare Access not protected. Execution Readiness shows WARNING or BLOCKED.',
    correctiveActions: 'Restart browser session. Check network connectivity. Verify Cloudflare credentials. Contact infrastructure team if gateway remains unreachable.',
  },
  {
    id: 'readiness_check',
    title: 'Execution Readiness Check',
    purpose: 'Validate that the system is ready to execute approved read-only commands safely.',
    severity: 'CRITICAL',
    relatedPanel: 'Execution Readiness',
    steps: [
      'Navigate to Execution Readiness tab.',
      'Review the 11-item checklist.',
      'Confirm Gateway reachable.',
      'Confirm Cloudflare Access protected.',
      'Confirm Command queue active.',
      'Confirm Governance approval required.',
      'Confirm Audit logging active.',
      'Confirm Execution bridge wired.',
      'Confirm Emergency stop available.',
      'Confirm all statuses are READY (green).',
      'Execution mode should show SIMULATED.',
      'Kill Switch should show ACTIVE or RELEASED.',
    ],
    expectedGoodState: 'All 11 items show READY. Execution mode is SIMULATED. Kill Switch status is clear.',
    warningSigns: 'Any item shows BLOCKED or WARNING. Execution mode is LIVE. Kill Switch shows ACTIVE unexpectedly.',
    correctiveActions: 'Resolve BLOCKED items before executing. Do not enable LIVE mode. Engage kill switch if uncertain.',
  },
  {
    id: 'safety_tests',
    title: 'Safety Tests Procedure',
    purpose: 'Run automated validation to ensure governance rules and domain allowlists are enforced.',
    severity: 'CRITICAL',
    relatedPanel: 'Safety Tests',
    steps: [
      'Navigate to Safety Tests tab.',
      'Review all 7 test scenarios.',
      'Click "Run All Tests" button.',
      'Wait for all tests to complete (typically < 30 seconds).',
      'Confirm 7/7 tests passed (green checkmarks).',
      'Review individual test results if any fail.',
      'Verify "Approved safe proposal should simulate successfully" passes.',
      'Verify "Draft proposal should be blocked" passes.',
      'Verify "Denied proposal should be blocked" passes.',
      'Verify "Non-allowlisted domain should be blocked" passes.',
      'Verify "HIGH risk proposal should be blocked" passes.',
      'Verify "Unsupported command type should be blocked" passes.',
      'Verify "Wrong governance mode should be blocked" passes.',
    ],
    expectedGoodState: '7/7 tests passed. All GOVERNANCE_BLOCK tests show controlled blocking. No TRANSPORT_ERROR entries.',
    warningSigns: 'Any test fails (red X). Transport errors detected. Validation errors in test details.',
    correctiveActions: 'Do not execute commands if any test fails. Review error messages. Restart backend functions if transport errors persist.',
  },
  {
    id: 'readonly_bridge',
    title: 'Read-Only Bridge Dry Run Procedure',
    purpose: 'Validate that the safe bridge can execute read-only commands without errors.',
    severity: 'WARNING',
    relatedPanel: 'Execution Readiness',
    steps: [
      'Navigate to Execution Readiness tab.',
      'Scroll to "Live Bridge Dry Run" section.',
      'Confirm all 3 read-only commands are listed: system.status, logs.fetch, session.list.',
      'Click "Run Dry Run" button.',
      'Wait for execution to complete.',
      'Confirm system.status shows SUCCESS.',
      'Confirm logs.fetch shows SUCCESS.',
      'Confirm session.list shows SUCCESS.',
      'Review execution times (expect < 5 seconds each).',
      'Review audit trace IDs for each command.',
    ],
    expectedGoodState: 'All 3 commands execute successfully. Execution times < 5 seconds. Audit traces logged.',
    warningSigns: 'Any command shows FAILED or ERROR status. Execution times > 10 seconds. No audit trace IDs.',
    correctiveActions: 'Check gateway connectivity. Verify backend bridge function is deployed. Review error logs.',
  },
  {
    id: 'approval_procedure',
    title: 'Command Approval Procedure',
    purpose: 'Safely review and approve command proposals following governance rules.',
    severity: 'CRITICAL',
    relatedPanel: 'Approval Workflow',
    steps: [
      'Navigate to Approval Workflow tab.',
      'Review pending proposals in DRAFT status.',
      'Select a proposal to review.',
      'Read the proposal prompt and rationale.',
      'Confirm estimated risk is LOW (not MEDIUM or HIGH).',
      'Confirm execution mode is SIMULATED (not LIVE).',
      'Confirm command type is read-only (READ_ELEMENT_TEXT, READ_TITLE, SCREENSHOT).',
      'Confirm target URL is in allowlist (tradingview.com, etc.).',
      'Confirm selector/parameters are safe.',
      'If all conditions pass, approve the proposal.',
      'If any condition fails, deny the proposal.',
      'Never approve HIGH risk or MEDIUM risk proposals.',
      'Never approve non-read-only commands.',
    ],
    expectedGoodState: 'Approved proposals show status APPROVED. Only LOW risk, SIMULATED, read-only commands approved.',
    warningSigns: 'Approving MEDIUM or HIGH risk proposals. Approving non-read-only commands. Approving proposals targeting non-allowlisted URLs.',
    correctiveActions: 'Deny problematic proposals. Review policy registry to understand risk tiers. Ask governance team if uncertain.',
  },
  {
    id: 'audit_review',
    title: 'Executed Command Audit Review',
    purpose: 'Review the complete history of executed commands for compliance and safety.',
    severity: 'INFO',
    relatedPanel: 'Executed Commands',
    steps: [
      'Navigate to Executed Commands tab.',
      'Review the command audit list.',
      'Click on any executed command to expand.',
      'Confirm command status is EXECUTED or FAILED.',
      'Review execution time and timestamp.',
      'Confirm execution mode was SIMULATED.',
      'Review result summary and diagnostic logs.',
      'Confirm no service tokens or secrets are exposed in logs.',
      'Check block reasons for any BLOCKED commands.',
      'Review audit trace ID for correlation.',
      'Look for patterns of repeated failures.',
      'Note any unusual commands for investigation.',
    ],
    expectedGoodState: 'Audit log shows only EXECUTED and FAILED commands. No secrets exposed. Block reasons are clear and expected.',
    warningSigns: 'Service tokens or secrets visible in audit logs. Unexpected block reasons. No audit trail for executed commands.',
    correctiveActions: 'Report exposed secrets immediately. Review policy for blocked commands. Contact infrastructure if audit logs are missing.',
  },
  {
    id: 'connector_troubleshooting',
    title: 'Connector Health Troubleshooting',
    purpose: 'Diagnose and resolve connector health issues.',
    severity: 'WARNING',
    relatedPanel: 'Connectors',
    steps: [
      'Navigate to Connectors tab.',
      'Review Connector Health Matrix.',
      'Look for connectors with status OFFLINE or BLOCKED.',
      'Expand offline connector details.',
      'Review last checked timestamp.',
      'Review evidence field for error details.',
      'For CORE connectors (OpenClaw Gateway, Veridan Bridge, CDP): restart the service.',
      'For BROWSER connectors (Browser Session): check port 18800 is listening.',
      'For SECURITY connectors (Cloudflare Access): verify credentials and token expiry.',
      'For DATA connectors (Audit Store, Command Queue): check database connectivity.',
      'For TRADING connectors (PLACEHOLDER): note they require separate approval.',
      'Re-run health check after remediation.',
    ],
    expectedGoodState: 'All CORE, BROWSER, SECURITY, DATA connectors show ONLINE or READY. Trading connectors show PLACEHOLDER.',
    warningSigns: 'CORE connectors show OFFLINE or BLOCKED. Health check timestamps stale (> 1 hour old). Evidence shows connectivity errors.',
    correctiveActions: 'Restart affected services. Verify network routes. Check firewall rules. Contact infrastructure team.',
  },
  {
    id: 'risk_matrix',
    title: 'Risk Matrix Interpretation',
    purpose: 'Understand OpenClaw action permissions and constraints.',
    severity: 'INFO',
    relatedPanel: 'Risk Matrix',
    steps: [
      'Navigate to Risk Matrix tab.',
      'Review summary counters at top.',
      'Understand permission categories: ALLOWED, READ_ONLY_ONLY, SIMULATED_ONLY, BLOCKED, FORBIDDEN.',
      'GREEN (ALLOWED) = Safe in any mode. Examples: system.status, logs.fetch.',
      'CYAN (READ_ONLY_ONLY) = Safe only in read-only mode. Examples: browser.read, browser.screenshot.',
      'AMBER (SIMULATED_ONLY) = Safe only in simulated mode. Examples: trading.order.preview.',
      'AMBER (BLOCKED) = Currently blocked pending review. Examples: browser.navigate, browser.click.',
      'RED (FORBIDDEN) = Permanently forbidden. Examples: trading.order.place, funds.transfer, credential.read.',
      'Expand any action to review rationale and related policy.',
      'Use filters to view actions by category or permission.',
      'Reference the risk matrix before approving commands.',
    ],
    expectedGoodState: 'Clear understanding of which actions are safe, restricted, blocked, and forbidden. All LIVE actions are FORBIDDEN.',
    warningSigns: 'Confusion about permission categories. Attempting to execute FORBIDDEN or BLOCKED actions.',
    correctiveActions: 'Review risk tier definitions. Ask governance team for clarification.',
  },
  {
    id: 'emergency_stop',
    title: 'Emergency Stop Procedure',
    purpose: 'Immediately halt all execution if unexpected, unsafe, or unknown activity occurs.',
    severity: 'CRITICAL',
    relatedPanel: 'Execution Readiness',
    steps: [
      'Identify the condition requiring emergency stop: unexpected execution, unsafe command detected, unknown status, policy mismatch, or suspected breach.',
      'Navigate to Execution Readiness tab immediately.',
      'Locate "Emergency Kill Switch" section.',
      'Confirm execution mode indicator shows status.',
      'Click "Engage Kill Switch" button.',
      'Wait for confirmation that kill switch is ACTIVE.',
      'Execution mode will revert to SIMULATED.',
      'All pending commands will be halted.',
      'Review audit logs to understand what triggered the stop.',
      'Only release kill switch after investigation and approval from governance team.',
      'Document the incident timestamp and root cause.',
    ],
    expectedGoodState: 'Kill switch engages immediately. Execution mode reverts to SIMULATED. No further commands execute.',
    warningSigns: 'Kill switch fails to engage. Execution continues after kill switch activation.',
    correctiveActions: 'Force-stop the browser session. Contact infrastructure immediately. Review logs for security incidents.',
  },
  {
    id: 'what_not_to_do',
    title: 'What Not To Do',
    purpose: 'Critical safety constraints to prevent unsafe operations.',
    severity: 'CRITICAL',
    relatedPanel: 'All',
    steps: [
      'DO NOT enable LIVE mode from the UI. Live execution is globally disabled by policy.',
      'DO NOT execute click, type, submit, or form commands. These are BLOCKED.',
      'DO NOT approve or execute trading commands (order.place, funds.transfer, broker.withdraw). These are FORBIDDEN.',
      'DO NOT put service tokens, API keys, or secrets in frontend code.',
      'DO NOT bypass the approval workflow. All commands require governance review.',
      'DO NOT treat SIMULATED readiness as LIVE trading readiness. Simulated and live are different.',
      'DO NOT connect broker execution without separate governance approval, paper testing, and audit.',
      'DO NOT execute commands targeting URLs outside the domain allowlist.',
      'DO NOT read, render, or expose credentials or secrets.',
      'DO NOT modify audit logs or tamper with command history.',
      'DO NOT disable Cloudflare Access authentication.',
      'DO NOT run safety tests once; run them before every execution session.',
      'If you feel pressure to bypass these constraints, escalate to governance team.',
    ],
    expectedGoodState: 'Operator understands all constraints. No attempts to circumvent governance.',
    warningSigns: 'Requests to bypass approval. Attempts to enable LIVE mode. Executing non-allowlisted commands.',
    correctiveActions: 'Deny the request immediately. Review governance policies with requester. Escalate security concerns.',
  },
];

const severityConfig = {
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
  CRITICAL: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
};

function RunbookSection({ section }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[section.severity];
  const SeverityIcon = cfg.icon;

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" /> : <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground">{section.title}</div>
            <div className="text-[8px] text-slate-400 mt-0.5 line-clamp-1 font-semibold">{section.purpose}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${cfg.bg} ${cfg.color} flex items-center gap-1`}>
            <SeverityIcon className="w-2.5 h-2.5" />
            {section.severity}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-3 space-y-4 text-[10px]">
          {/* Purpose */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Purpose</div>
            <div className="text-foreground/80">{section.purpose}</div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">Steps</div>
            <ol className="space-y-1.5 bg-secondary/30 border border-border rounded p-3">
              {section.steps.map((step, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="text-slate-400 font-semibold shrink-0">{idx + 1}.</span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Expected, warnings, corrective */}
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-primary mb-1.5 font-semibold">Expected Good State</div>
              <div className="text-foreground/80 text-[9px]">{section.expectedGoodState}</div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-amber-500 mb-1.5 font-semibold">Warning Signs</div>
              <div className="text-foreground/80 text-[9px]">{section.warningSigns}</div>
            </div>
            <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-destructive mb-1.5 font-semibold">Corrective Actions</div>
              <div className="text-foreground/80 text-[9px]">{section.correctiveActions}</div>
            </div>
          </div>

          {/* Metadata footer */}
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Related Panel</div>
              <div className="text-blue-400 font-mono text-[8px]">{section.relatedPanel}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Severity</div>
              <div className={`font-semibold ${cfg.color}`}>{section.severity}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OperatorRunbookPanel() {
  const [filter, setFilter] = useState('ALL');

  const filtered = RUNBOOK_SECTIONS.filter(s => {
    if (filter === 'ALL') return true;
    return s.severity === filter;
  });

  const summaryStats = {
    total: RUNBOOK_SECTIONS.length,
    info: RUNBOOK_SECTIONS.filter(s => s.severity === 'INFO').length,
    warning: RUNBOOK_SECTIONS.filter(s => s.severity === 'WARNING').length,
    critical: RUNBOOK_SECTIONS.filter(s => s.severity === 'CRITICAL').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Operator Runbook</div>
          <div className="text-[13px] font-semibold text-foreground">Step-by-Step Safety Procedures for OpenClaw Control</div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold">{filtered.length} of {summaryStats.total} shown</span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total Sections</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 px-3 py-2 rounded">
          <div className="text-blue-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Info</div>
          <div className="text-[14px] font-semibold text-blue-400">{summaryStats.info}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500 uppercase tracking-wider mb-1 text-[8px] font-semibold">Warnings</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.warning}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive uppercase tracking-wider mb-1 text-[8px] font-semibold">Critical</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.critical}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 text-[9px] border rounded whitespace-nowrap transition-colors font-semibold ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Runbook sections */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">No {filter.toLowerCase()} sections found</div>
        ) : (
          filtered.map(section => <RunbookSection key={section.id} section={section} />)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-slate-300">
        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold mb-1 text-foreground">Runbook is procedural guidance only</div>
          <div className="text-slate-400">It does not execute commands or change permissions. Always follow all steps before operating OpenClaw Control.</div>
        </div>
      </div>
    </div>
  );
}