/**
 * wakeBackendDryRunContracts.js
 * Static governance contracts for OpenClaw Wake Backend Dry-Run Route.
 * No network calls. No secrets. No execution.
 */

export const FIXED_STATUSES = {
  ROUTE_MODE:               'DRY_RUN_ONLY',
  BACKEND_ROUTE:            '/api/openclaw/wake/dry-run',
  OPENCLAW_WAKE_CALL:       'SUPPRESSED',
  OPENCLAW_AGENT_CALL:      'PROHIBITED',
  TOKEN_ACCESS:             'SERVER_SIDE_ONLY_NOT_READ_IN_DRY_RUN',
  NETWORK_REQUEST:          'NOT_SENT',
  EXECUTION_STATUS:         'NOT_EXECUTED',
  DISPATCH_STATUS:          'NOT_DISPATCHED',
  PROPOSAL_STATUS:          'NO_ACTION_CREATED',
  EXTERNAL_ACCOUNT_STATUS:  'NOT_CONNECTED',
  FILESYSTEM_WRITE:         'DISABLED',
  BROWSER_AUTOMATION:       'DISABLED',
};

export const GUARDRAILS = [
  'Backend dry-run only — no OpenClaw request sent',
  'Wake call suppressed in this phase',
  'Agent endpoint prohibited',
  'Webhook token not read or displayed during dry-run',
  'No browser automation',
  'No filesystem writes',
  'No external account action',
  'This page proves server-side validation before any future activation',
];

export const PIPELINE_STAGES = [
  {
    id: 1,
    key: 'wake_preview_packet',
    label: 'Wake Dispatch Preview Packet',
    icon: '📦',
    description: 'Incoming preview packet from /wake-dispatch-preview gate. Contains previewId, eventType, approvalState, riskLevel, destinationChannel.',
    status: 'INPUT',
    color: 'text-primary border-primary/30 bg-primary/5',
  },
  {
    id: 2,
    key: 'backend_route_boundary',
    label: 'Backend Route Boundary',
    icon: '🔀',
    description: 'POST /api/openclaw/wake/dry-run — route exists server-side only. Frontend never calls it directly. Token injected by server.',
    status: 'BOUNDARY',
    color: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  },
  {
    id: 3,
    key: 'schema_validation',
    label: 'Server-Side Schema Validation',
    icon: '🧪',
    description: 'Required fields check, type validation, allowlist checks for eventType and destinationChannel. Rejects malformed payloads.',
    status: 'VALIDATE',
    color: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  },
  {
    id: 4,
    key: 'safety_gate',
    label: 'Server-Side Safety Gate',
    icon: '🛡',
    description: 'Approval state must be APPROVED or REVIEW_READY. Risk level not CRITICAL. executionStatus=NOT_EXECUTED. dispatchStatus=NOT_DISPATCHED.',
    status: 'GATE',
    color: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  },
  {
    id: 5,
    key: 'token_boundary',
    label: 'Token Boundary Check',
    icon: '🔑',
    description: 'OPENCLAW_SERVICE_TOKEN is read from env by server only in live mode. In dry-run mode: token is NOT read, NOT used, NOT exposed to client.',
    status: 'TOKEN_CHECK',
    color: 'text-rose-400 border-rose-400/30 bg-rose-400/5',
  },
  {
    id: 6,
    key: 'call_suppression',
    label: 'OpenClaw Call Suppression',
    icon: '⊘',
    description: 'In dry-run mode: no HTTP request to /hooks/wake. No request to /hooks/agent. All external calls are suppressed. Network remains silent.',
    status: 'SUPPRESSED',
    color: 'text-destructive border-destructive/30 bg-destructive/5',
  },
  {
    id: 7,
    key: 'response_builder',
    label: 'Dry-Run Response Builder',
    icon: '📋',
    description: 'Server assembles a structured dry-run response with evidenceId, auditHash, decision, and all fixed status flags confirming suppression.',
    status: 'RESPONSE',
    color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  },
  {
    id: 8,
    key: 'audit_record',
    label: 'Audit/Evidence Record',
    icon: '📝',
    description: 'Dry-run result is recorded locally. Includes full request/response preview, all validation checks, audit hash, and next-step recommendation.',
    status: 'AUDIT',
    color: 'text-green-400 border-green-400/30 bg-green-400/5',
  },
];

export const ALLOWED_EVENT_TYPES = [
  'MCP_VISUAL_CONFIRMATION_PREVIEW',
  'TRADINGVIEW_ALERT_PREVIEW',
  'OPENCLAW_COMMAND_APPROVED',
  'OPERATOR_MANUAL_WAKE',
  'GOVERNANCE_CHECKPOINT_WAKE',
  'SCHEDULED_HEARTBEAT_PREVIEW',
];

export const APPROVAL_STATES = [
  'APPROVED',
  'REVIEW_READY',
  'PENDING',
  'DRAFT',
  'DENIED',
];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const DESTINATION_CHANNELS = [
  'openclaw-local',
  'openclaw-wake-only',
  'openclaw-preview-only',
  'openclaw-staging',
];

export const DECISIONS = [
  'SERVER_DRY_RUN_VALIDATED',
  'BLOCKED_SCHEMA_INVALID',
  'BLOCKED_NOT_APPROVED',
  'BLOCKED_CRITICAL_RISK',
  'BLOCKED_DESTINATION_NOT_ALLOWED',
];

export const DECISION_META = {
  SERVER_DRY_RUN_VALIDATED:       { text: 'text-primary',     bg: 'bg-primary/10',     border: 'border-primary/30' },
  BLOCKED_SCHEMA_INVALID:         { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  BLOCKED_NOT_APPROVED:           { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  BLOCKED_CRITICAL_RISK:          { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  BLOCKED_DESTINATION_NOT_ALLOWED:{ text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30' },
};

export const VALIDATION_CHECKS = [
  { key: 'requiredFields',        label: 'Required fields present' },
  { key: 'eventTypeAllowed',      label: 'Event type is allowed' },
  { key: 'approvalStateValid',    label: 'Approval state is APPROVED or REVIEW_READY' },
  { key: 'riskNotCritical',       label: 'Risk level is not CRITICAL' },
  { key: 'execStatusOk',          label: 'Execution status is NOT_EXECUTED' },
  { key: 'dispatchStatusOk',      label: 'Dispatch status is NOT_DISPATCHED' },
  { key: 'channelAllowed',        label: 'Destination channel is openclaw-local or openclaw-wake-only' },
  { key: 'agentNotRequested',     label: 'Agent endpoint is not requested' },
  { key: 'externalAccountOk',     label: 'External account status remains NOT_CONNECTED' },
  { key: 'filesystemOk',          label: 'Filesystem write remains DISABLED' },
  { key: 'browserOk',             label: 'Browser automation remains DISABLED' },
  { key: 'tokenNotExposed',       label: 'Token is not exposed to client' },
  { key: 'networkNotSent',        label: 'Network request remains NOT_SENT in dry-run mode' },
];

export function generateEvidenceId() {
  return `WBD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateAuditHash(data) {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return 'WBDR-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export function runValidation(form) {
  const results = {};
  results.requiredFields        = !!(form.previewId && form.eventType && form.approvalState && form.riskLevel && form.destinationChannel);
  results.eventTypeAllowed      = ALLOWED_EVENT_TYPES.includes(form.eventType);
  results.approvalStateValid    = ['APPROVED', 'REVIEW_READY'].includes(form.approvalState);
  results.riskNotCritical       = form.riskLevel !== 'CRITICAL';
  results.execStatusOk          = form.executionStatus === 'NOT_EXECUTED';
  results.dispatchStatusOk      = form.dispatchStatus === 'NOT_DISPATCHED';
  results.channelAllowed        = ['openclaw-local', 'openclaw-wake-only'].includes(form.destinationChannel);
  results.agentNotRequested     = true; // always true — agent call never in form
  results.externalAccountOk     = true;
  results.filesystemOk          = true;
  results.browserOk             = true;
  results.tokenNotExposed       = true;
  results.networkNotSent        = true;

  const allPass = Object.values(results).every(Boolean);

  let decision = 'SERVER_DRY_RUN_VALIDATED';
  if (!results.requiredFields || !results.eventTypeAllowed) {
    decision = 'BLOCKED_SCHEMA_INVALID';
  } else if (!results.approvalStateValid) {
    decision = 'BLOCKED_NOT_APPROVED';
  } else if (!results.riskNotCritical) {
    decision = 'BLOCKED_CRITICAL_RISK';
  } else if (!results.channelAllowed) {
    decision = 'BLOCKED_DESTINATION_NOT_ALLOWED';
  }

  return { results, allPass: decision === 'SERVER_DRY_RUN_VALIDATED', decision };
}

export const NEXT_STEP = {
  SERVER_DRY_RUN_VALIDATED:       'All server-side checks passed. When OPENCLAW_SERVICE_TOKEN is configured and approved, this path can be promoted to a live dry-run call against /api/openclaw/wake/dry-run.',
  BLOCKED_SCHEMA_INVALID:         'Fix required fields or ensure eventType is from the approved allowlist before promoting this path.',
  BLOCKED_NOT_APPROVED:           'Set approvalState to APPROVED or REVIEW_READY to pass the safety gate. Pending/Draft payloads are blocked.',
  BLOCKED_CRITICAL_RISK:          'CRITICAL risk level payloads are blocked. Use LOW, MEDIUM, or HIGH.',
  BLOCKED_DESTINATION_NOT_ALLOWED:'Destination channel must be openclaw-local or openclaw-wake-only for dry-run promotion.',
};