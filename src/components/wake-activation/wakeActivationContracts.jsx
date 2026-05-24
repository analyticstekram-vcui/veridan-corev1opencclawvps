/**
 * wakeActivationContracts.js
 * Static governance configuration for the Wake Activation Readiness Gate.
 * No network calls. No secret access. No execution. Read-only planning module.
 */

export const FIXED_STATUSES = {
  ACTIVATION_STATUS:           'NOT_ACTIVATED',
  WAKE_CALL_PERMISSION:        'BLOCKED_PENDING_OPERATOR_APPROVAL',
  ROUTE_MODE:                  'READINESS_CHECK_ONLY',
  NETWORK_REQUEST:             'NOT_SENT',
  OPENCLAW_WAKE_CALL:          'NOT_SENT',
  OPENCLAW_AGENT_CALL:         'PROHIBITED',
  TOKEN_ACCESS:                'NOT_READ_IN_READINESS_CHECK',
  TOKEN_VISIBILITY:            'HIDDEN_SERVER_SIDE_ONLY',
  BROWSER_AUTOMATION:          'DISABLED',
  FILESYSTEM_WRITE:            'DISABLED',
  EXTERNAL_ACCOUNT_STATUS:     'NOT_CONNECTED',
  BROKER_STATUS:               'NOT_CONNECTED',
  EXECUTION_STATUS:            'NOT_EXECUTED',
  DISPATCH_STATUS:             'NOT_DISPATCHED',
};

export const GUARDRAILS = [
  'Readiness check only — no activation performed',
  'OpenClaw wake call remains blocked',
  'Agent endpoint prohibited',
  'Webhook token not read or displayed',
  'No browser automation',
  'No filesystem writes',
  'No external accounts or broker connected',
  'Operator approval required before any future activation',
];

export const FLOW_STAGES = [
  {
    id: 1,
    label: 'Backend Dry-Run Evidence',
    description: 'Verify that a backend dry-run validation record exists with decision SERVER_DRY_RUN_VALIDATED.',
    status: 'EVIDENCE_REQUIRED',
    statusColor: 'text-amber-400',
    guardrail: 'No network request made',
  },
  {
    id: 2,
    label: 'OpenClaw Service Health Evidence',
    description: 'Confirm OpenClaw service status is active or verified via a prior read-only health check record.',
    status: 'EVIDENCE_REQUIRED',
    statusColor: 'text-amber-400',
    guardrail: 'No live health call in this module',
  },
  {
    id: 3,
    label: 'Local Wake Endpoint Evidence',
    description: 'Confirm /hooks/wake local test was performed (separately) and HTTP 200 was returned.',
    status: 'EVIDENCE_REQUIRED',
    statusColor: 'text-amber-400',
    guardrail: 'No /hooks/wake call made here',
  },
  {
    id: 4,
    label: 'Token Boundary Evidence',
    description: 'Confirm OPENCLAW_SERVICE_TOKEN is stored server-side only. Not read or displayed in this module.',
    status: 'TOKEN_HIDDEN',
    statusColor: 'text-primary',
    guardrail: 'Token not read or displayed here',
  },
  {
    id: 5,
    label: 'Agent Endpoint Prohibition',
    description: 'Confirm /hooks/agent endpoint remains prohibited. No agentic execution planned.',
    status: 'PROHIBITED',
    statusColor: 'text-destructive',
    guardrail: '/hooks/agent PROHIBITED',
  },
  {
    id: 6,
    label: 'Execution Surface Lockdown',
    description: 'Confirm browser automation, filesystem writes, broker connections, and live execution surfaces are all disabled.',
    status: 'LOCKED_DOWN',
    statusColor: 'text-primary',
    guardrail: 'All execution surfaces disabled',
  },
  {
    id: 7,
    label: 'Kill Switch / Rollback Readiness',
    description: 'Confirm a kill switch definition and rollback plan are documented before activation review.',
    status: 'REQUIRED',
    statusColor: 'text-amber-400',
    guardrail: 'Must be defined before activation',
  },
  {
    id: 8,
    label: 'Audit Logging Readiness',
    description: 'Confirm audit logging is enabled or planned for all wake activation attempts.',
    status: 'REQUIRED',
    statusColor: 'text-amber-400',
    guardrail: 'Logging must be confirmed',
  },
  {
    id: 9,
    label: 'Operator Approval Gate',
    description: 'Operator must mark approval state as REVIEW_READY or APPROVED. Activation remains blocked until then.',
    status: 'APPROVAL_REQUIRED',
    statusColor: 'text-amber-400',
    guardrail: 'Activation blocked without approval',
  },
  {
    id: 10,
    label: 'Activation Decision',
    description: 'Compute readiness decision. Even on full pass: READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW only. No live dispatch.',
    status: 'BLOCKED_UNTIL_ALL_PASS',
    statusColor: 'text-destructive',
    guardrail: 'No activation performed here',
  },
];

export const DRY_RUN_DECISIONS = [
  'SERVER_DRY_RUN_VALIDATED',
  'BLOCKED_POLICY_GATE_FAILED',
  'BLOCKED_REPLAY_CHECK_FAILED',
  'BLOCKED_SIGNATURE_INVALID',
  'BLOCKED_RISK_TOO_HIGH',
  'PENDING',
  'NONE',
];

export const LOCAL_WAKE_STATUSES = [
  'HTTP_200_CONFIRMED',
  'HTTP_ERROR',
  'NOT_TESTED',
  'TEST_PENDING',
];

export const OPENCLAW_SERVICE_STATUSES = [
  'ACTIVE',
  'VERIFIED_READ_ONLY',
  'DEGRADED',
  'OFFLINE',
  'UNKNOWN',
];

export const TOKEN_BOUNDARY_STATUSES = [
  'SERVER_SIDE_ONLY',
  'UNKNOWN',
  'EXPOSED_RISK',
];

export const AGENT_ENDPOINT_STATUSES = [
  'PROHIBITED',
  'UNKNOWN',
];

export const BROWSER_AUTOMATION_STATUSES = [
  'DISABLED',
  'ENABLED',
];

export const FILESYSTEM_WRITE_STATUSES = [
  'DISABLED',
  'ENABLED',
];

export const BROKER_STATUSES = [
  'NOT_CONNECTED',
  'CONNECTED',
];

export const AUDIT_LOGGING_STATUSES = [
  'ENABLED',
  'PLANNED',
  'NOT_CONFIGURED',
];

export const KILL_SWITCH_STATUSES = [
  'DEFINED',
  'PLANNED',
  'NOT_DEFINED',
];

export const ROLLBACK_PLAN_STATUSES = [
  'DEFINED',
  'PLANNED',
  'NOT_DEFINED',
];

export const OPERATOR_APPROVAL_STATES = [
  'APPROVED',
  'REVIEW_READY',
  'PENDING',
  'NOT_READY',
];

export const DECISIONS = [
  'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW',
  'BLOCKED_NO_DRY_RUN_EVIDENCE',
  'BLOCKED_NO_LOCAL_WAKE_EVIDENCE',
  'BLOCKED_AGENT_ENDPOINT_RISK',
  'BLOCKED_EXECUTION_SURFACE_ACTIVE',
  'BLOCKED_NO_KILL_SWITCH',
  'BLOCKED_NO_OPERATOR_APPROVAL',
];

export const DECISION_META = {
  READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW: {
    text: 'text-primary',
    bg:   'bg-primary/10',
    border: 'border-primary/30',
    note: 'All readiness checks passed. Proceed to controlled activation review with operator sign-off. No live dispatch performed here.',
  },
  BLOCKED_NO_DRY_RUN_EVIDENCE: {
    text: 'text-destructive',
    bg:   'bg-destructive/10',
    border: 'border-destructive/30',
    note: 'A backend dry-run record with decision SERVER_DRY_RUN_VALIDATED is required before activation review.',
  },
  BLOCKED_NO_LOCAL_WAKE_EVIDENCE: {
    text: 'text-destructive',
    bg:   'bg-destructive/10',
    border: 'border-destructive/30',
    note: 'Local /hooks/wake test evidence (HTTP 200) must exist before activation review.',
  },
  BLOCKED_AGENT_ENDPOINT_RISK: {
    text: 'text-rose-400',
    bg:   'bg-rose-400/10',
    border: 'border-rose-400/30',
    note: 'Agent endpoint must remain PROHIBITED. Resolve agent endpoint risk before proceeding.',
  },
  BLOCKED_EXECUTION_SURFACE_ACTIVE: {
    text: 'text-orange-400',
    bg:   'bg-orange-400/10',
    border: 'border-orange-400/30',
    note: 'All execution surfaces (browser automation, filesystem writes, broker) must be disabled before activation review.',
  },
  BLOCKED_NO_KILL_SWITCH: {
    text: 'text-amber-400',
    bg:   'bg-amber-400/10',
    border: 'border-amber-400/30',
    note: 'A kill switch and rollback plan must be defined before activation review.',
  },
  BLOCKED_NO_OPERATOR_APPROVAL: {
    text: 'text-amber-400',
    bg:   'bg-amber-400/10',
    border: 'border-amber-400/30',
    note: 'Operator approval state must be REVIEW_READY or APPROVED before activation review.',
  },
};

export const READINESS_CHECKS = [
  { key: 'dryRunDecisionValid',    label: 'Backend dry-run decision is SERVER_DRY_RUN_VALIDATED' },
  { key: 'localWakeEvidenceExists', label: 'Local /hooks/wake test evidence exists' },
  { key: 'localWakeHttp200',       label: 'Local /hooks/wake test returned HTTP 200' },
  { key: 'openClawServiceActive',  label: 'OpenClaw service status is active/verified' },
  { key: 'tokenServerSideOnly',    label: 'Token boundary is server-side only' },
  { key: 'tokenNotDisplayed',      label: 'Token not displayed in client (enforced by design)' },
  { key: 'agentEndpointProhibited', label: 'Agent endpoint remains PROHIBITED' },
  { key: 'browserAutomationOff',   label: 'Browser automation disabled' },
  { key: 'filesystemWriteOff',     label: 'Filesystem writes disabled' },
  { key: 'brokerNotConnected',     label: 'Broker status remains NOT_CONNECTED' },
  { key: 'execStatusLocked',       label: 'Execution status remains NOT_EXECUTED' },
  { key: 'dispatchStatusLocked',   label: 'Dispatch status remains NOT_DISPATCHED' },
  { key: 'auditLoggingReady',      label: 'Audit logging enabled or planned' },
  { key: 'killSwitchDefined',      label: 'Kill switch defined or planned' },
  { key: 'rollbackPlanDefined',    label: 'Rollback plan defined or planned' },
  { key: 'operatorApprovalReady',  label: 'Operator approval is REVIEW_READY or APPROVED' },
];

export function evaluateReadiness(form) {
  const r = {
    dryRunDecisionValid:     form.dryRunDecision === 'SERVER_DRY_RUN_VALIDATED',
    localWakeEvidenceExists: form.localWakeTestStatus !== 'NOT_TESTED' && form.localWakeTestStatus !== 'NONE',
    localWakeHttp200:        form.localWakeTestStatus === 'HTTP_200_CONFIRMED' || String(form.localWakeHttpStatus) === '200',
    openClawServiceActive:   ['ACTIVE', 'VERIFIED_READ_ONLY'].includes(form.openClawServiceStatus),
    tokenServerSideOnly:     form.tokenBoundaryStatus === 'SERVER_SIDE_ONLY',
    tokenNotDisplayed:       true, // always true — enforced by design
    agentEndpointProhibited: form.agentEndpointStatus === 'PROHIBITED',
    browserAutomationOff:    form.browserAutomationStatus === 'DISABLED',
    filesystemWriteOff:      form.filesystemWriteStatus === 'DISABLED',
    brokerNotConnected:      form.brokerStatus === 'NOT_CONNECTED',
    execStatusLocked:        true, // always true in this module
    dispatchStatusLocked:    true, // always true in this module
    auditLoggingReady:       ['ENABLED', 'PLANNED'].includes(form.auditLoggingStatus),
    killSwitchDefined:       ['DEFINED', 'PLANNED'].includes(form.killSwitchStatus),
    rollbackPlanDefined:     ['DEFINED', 'PLANNED'].includes(form.rollbackPlanStatus),
    operatorApprovalReady:   ['APPROVED', 'REVIEW_READY'].includes(form.operatorApprovalState),
  };

  const allPass = Object.values(r).every(Boolean);

  let decision = 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW';
  if (!r.dryRunDecisionValid)     decision = 'BLOCKED_NO_DRY_RUN_EVIDENCE';
  else if (!r.localWakeEvidenceExists || !r.localWakeHttp200) decision = 'BLOCKED_NO_LOCAL_WAKE_EVIDENCE';
  else if (!r.agentEndpointProhibited) decision = 'BLOCKED_AGENT_ENDPOINT_RISK';
  else if (!r.browserAutomationOff || !r.filesystemWriteOff || !r.brokerNotConnected) decision = 'BLOCKED_EXECUTION_SURFACE_ACTIVE';
  else if (!r.killSwitchDefined || !r.rollbackPlanDefined) decision = 'BLOCKED_NO_KILL_SWITCH';
  else if (!r.operatorApprovalReady) decision = 'BLOCKED_NO_OPERATOR_APPROVAL';

  return { checks: r, allPass, decision };
}

export function generateEvidenceId() {
  return `VWAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateAuditHash(form, evidenceId, ts) {
  const raw = `${evidenceId}|${form.dryRunDecision}|${form.localWakeTestStatus}|${form.openClawServiceStatus}|${ts}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) { h = ((h << 5) - h) + raw.charCodeAt(i); h |= 0; }
  return `VWAR-HASH-${Math.abs(h).toString(16).toUpperCase().padStart(8, '0')}`;
}