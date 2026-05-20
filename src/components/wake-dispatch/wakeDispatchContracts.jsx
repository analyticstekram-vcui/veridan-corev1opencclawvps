/**
 * wakeDispatchContracts.js
 * Static governance contracts for OpenClaw Wake Dispatch Preview Gate.
 * No live dispatch. No /hooks/wake calls. No /hooks/agent calls.
 * No token exposure. No broker connection. No trade execution.
 */

export const FIXED_STATUSES = {
  DISPATCH_MODE:           'PREVIEW_ONLY',
  OPENCLAW_ENDPOINT:       'LOCAL_ONLY_127_0_0_1',
  OPENCLAW_WAKE_CALL:      'DISABLED',
  OPENCLAW_AGENT_CALL:     'DISABLED',
  TOKEN_VISIBILITY:        'HIDDEN_SERVER_SIDE_ONLY',
  NETWORK_REQUEST:         'NOT_SENT',
  EXECUTION_STATUS:        'NOT_EXECUTED',
  DISPATCH_STATUS:         'NOT_DISPATCHED',
  TRADE_STATUS:            'NO_ORDER_CREATED',
  BROKER_STATUS:           'NOT_CONNECTED',
};

export const GUARDRAILS = [
  'Preview only — no OpenClaw request sent',
  '/hooks/wake disabled until explicit backend activation',
  '/hooks/agent prohibited in this phase',
  'Webhook token never displayed in UI',
  'No browser automation',
  'No file writes',
  'No broker or order execution',
];

export const SOURCE_EVENT_TYPES = [
  'OPENCLAW_WAKE_ONLY',
  'TRADINGVIEW_ALERT_PREVIEW',
  'MCP_VISUAL_CONFIRMATION_PREVIEW',
  'GOVERNANCE_APPROVAL_EVENT',
  'DAILY_BRIEF_EVENT',
];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const APPROVAL_STATES = [
  'APPROVED',
  'REVIEW_READY',
  'PENDING',
  'DENIED',
  'DRAFT',
];

export const DESTINATION_CHANNELS = [
  'openclaw-local',
  'veridan-core-ops',
  'trading-module',
  'governance-audit',
  'daily-brief',
];

export const DECISION_OUTCOMES = [
  'PREVIEW_READY_FOR_FUTURE_WAKE',
  'BLOCKED_NOT_APPROVED',
  'BLOCKED_CRITICAL_RISK',
  'BLOCKED_EXECUTION_NOT_ALLOWED',
];

export const FLOW_STAGES = [
  {
    id: 1,
    key: 'approved_preview_event',
    label: 'Approved Preview Event',
    icon: '✓',
    desc: 'An approved or review-ready preview event is received from a governance source.',
    status: 'GOVERNANCE_INPUT',
  },
  {
    id: 2,
    key: 'backend_safety_gate',
    label: 'Backend Safety Gate',
    icon: '🛡',
    desc: 'Server-side gate validates approval state, risk tier, execution flags, and broker status.',
    status: 'GATE_CHECKS',
  },
  {
    id: 3,
    key: 'token_handling_boundary',
    label: 'Token Handling Boundary',
    icon: '🔒',
    desc: 'OpenClaw webhook token injected server-side only. Never exposed to frontend or logs.',
    status: 'TOKEN_HIDDEN',
  },
  {
    id: 4,
    key: 'local_wake_payload',
    label: 'Local Wake Payload Builder',
    icon: '📦',
    desc: 'Constructs the /hooks/wake JSON payload locally. No network request is made.',
    status: 'PAYLOAD_BUILT',
  },
  {
    id: 5,
    key: 'wake_preview',
    label: 'OpenClaw /hooks/wake Preview',
    icon: '👁',
    desc: 'Preview of what would be sent to local OpenClaw. Endpoint: 127.0.0.1 only. Call disabled.',
    status: 'PREVIEW_ONLY',
  },
  {
    id: 6,
    key: 'dispatch_decision',
    label: 'Dispatch Decision',
    icon: '⊘',
    desc: 'Safety gate outcome determines dispatch decision. Default: PREVIEW_READY_FOR_FUTURE_WAKE.',
    status: 'DECISION',
  },
  {
    id: 7,
    key: 'audit_record',
    label: 'Audit Record',
    icon: '📋',
    desc: 'Immutable local audit record generated with preview hash, gate results, and operator state.',
    status: 'AUDITED',
  },
  {
    id: 8,
    key: 'operator_approval_state',
    label: 'Operator Approval State',
    icon: '👤',
    desc: 'Operator confirms review. Approval required before any future live dispatch is considered.',
    status: 'OPERATOR_REQUIRED',
  },
];

// Safety gate check definitions
export const SAFETY_GATE_CHECKS = [
  {
    key: 'approvalStateValid',
    label: 'Approval state is APPROVED or REVIEW_READY',
    evaluate: (form) => ['APPROVED', 'REVIEW_READY'].includes(form.approvalState),
  },
  {
    key: 'riskNotCritical',
    label: 'Risk level is not CRITICAL',
    evaluate: (form) => form.riskLevel !== 'CRITICAL',
  },
  {
    key: 'executionNotExecuted',
    label: 'Execution status is NOT_EXECUTED',
    evaluate: () => true, // hardcoded
  },
  {
    key: 'dispatchNotDispatched',
    label: 'Dispatch status is NOT_DISPATCHED',
    evaluate: () => true, // hardcoded
  },
  {
    key: 'agentCallDisabled',
    label: 'OpenClaw agent call disabled',
    evaluate: () => true, // hardcoded
  },
  {
    key: 'brokerDisconnected',
    label: 'Broker disconnected',
    evaluate: () => true, // hardcoded
  },
  {
    key: 'tokenHidden',
    label: 'Token hidden server-side only',
    evaluate: () => true, // hardcoded
  },
  {
    key: 'networkDisabled',
    label: 'Network request disabled in preview mode',
    evaluate: () => true, // hardcoded
  },
];

export function runSafetyGate(form) {
  const results = {};
  let allPass = true;
  for (const check of SAFETY_GATE_CHECKS) {
    const pass = check.evaluate(form);
    results[check.key] = pass;
    if (!pass) allPass = false;
  }
  return { results, allPass };
}

export function computeDecision(form, gateResults) {
  if (!['APPROVED', 'REVIEW_READY'].includes(form.approvalState)) return 'BLOCKED_NOT_APPROVED';
  if (form.riskLevel === 'CRITICAL') return 'BLOCKED_CRITICAL_RISK';
  if (!gateResults.executionNotExecuted || !gateResults.dispatchNotDispatched) return 'BLOCKED_EXECUTION_NOT_ALLOWED';
  return 'PREVIEW_READY_FOR_FUTURE_WAKE';
}

export function buildWakePayload(form) {
  return {
    text: form.notificationText ||
      `Veridan Core approved preview event received. Notification only. Do not execute tools, browser actions, file writes, trading, or external requests.`,
    mode: 'next-heartbeat',
    source: 'Veridan Core',
    eventType: form.eventType,
    eventId: form.eventId || `EVT-${Date.now().toString(36).toUpperCase()}`,
    riskLevel: form.riskLevel,
    approvalState: form.approvalState,
    destinationChannel: form.destinationChannel,
    executionStatus: 'NOT_EXECUTED',
    dispatchStatus: 'NOT_DISPATCHED',
    tradeStatus: 'NO_ORDER_CREATED',
    brokerStatus: 'NOT_CONNECTED',
    openClawWakeCall: 'DISABLED',
    openClawAgentCall: 'DISABLED',
    tokenVisibility: 'HIDDEN_SERVER_SIDE_ONLY',
    networkRequest: 'NOT_SENT',
    endpointTarget: '127.0.0.1 (local only — not sent)',
    dispatchMode: 'PREVIEW_ONLY',
    previewTimestamp: new Date().toISOString(),
  };
}

export function generatePreviewId() {
  return `WAKE-PR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

export function generateAuditHash(payload) {
  const str = JSON.stringify(payload);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return `WAKE-AH-${Math.abs(h).toString(16).toUpperCase().padStart(8,'0')}`;
}

// Decision outcome display config
export const DECISION_COLORS = {
  PREVIEW_READY_FOR_FUTURE_WAKE: { text: 'text-primary',     bg: 'bg-primary/10',     border: 'border-primary/30' },
  BLOCKED_NOT_APPROVED:          { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  BLOCKED_CRITICAL_RISK:         { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  BLOCKED_EXECUTION_NOT_ALLOWED: { text: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
};

export const RISK_COLORS = {
  LOW:      { text: 'text-primary',     bg: 'bg-primary/10',     border: 'border-primary/30' },
  MEDIUM:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  HIGH:     { text: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  CRITICAL: { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};