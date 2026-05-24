/**
 * controlledWakeReviewContracts.js
 * Static governance configuration for Controlled Wake Activation Review.
 * No network calls. No secret access. No execution. Local-only review packet generation.
 */

export const FIXED_SAFETY_STATUSES = {
  OPENCLAW_WAKE_CALL:  'NOT_SENT',
  OPENCLAW_AGENT_CALL: 'PROHIBITED',
  TOKEN_ACCESS:        'SERVER_SIDE_ONLY_NOT_READ',
  NETWORK_REQUEST:     'NOT_SENT',
  EXECUTION_STATUS:    'NOT_EXECUTED',
  DISPATCH_STATUS:     'NOT_DISPATCHED',
  BROWSER_AUTOMATION:  'DISABLED',
  FILESYSTEM_WRITE:    'DISABLED',
  BROKER_ACTION:       'DISABLED',
};

export const REVIEW_GUARDRAILS = [
  'No OpenClaw wake call performed',
  'No network request sent',
  'Token not read or displayed',
  '/hooks/agent remains PROHIBITED',
  'No browser automation',
  'No filesystem writes',
  'No broker actions',
  'No execution or dispatch',
  'Local-only packet generation',
];

export const REVIEW_REQUIREMENTS = [
  { key: 'dryRunDecisionValid',    label: 'dryRunDecision === SERVER_DRY_RUN_VALIDATED' },
  { key: 'wakeStatusConfirmed',    label: 'wakeStatus === HTTP_200_CONFIRMED' },
  { key: 'approvalReady',          label: 'approval is REVIEW_READY or APPROVED' },
  { key: 'allChecksPass',          label: 'All 16 readiness checks passed (16/16)' },
  { key: 'decisionCorrect',        label: 'decision === READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW' },
  { key: 'activationLocked',       label: 'activationStatus === NOT_ACTIVATED' },
  { key: 'networkLocked',          label: 'networkRequest === NOT_SENT' },
];

export function evaluateReviewRequirements(record) {
  if (!record) return { checks: {}, allPass: false };
  const checks = {
    dryRunDecisionValid: record.form?.dryRunDecision === 'SERVER_DRY_RUN_VALIDATED',
    wakeStatusConfirmed: record.form?.localWakeTestStatus === 'HTTP_200_CONFIRMED' || String(record.form?.localWakeHttpStatus) === '200',
    approvalReady:       ['APPROVED', 'REVIEW_READY'].includes(record.form?.operatorApprovalState),
    allChecksPass:       record.allPass === true,
    decisionCorrect:     record.decision === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW',
    activationLocked:    record.activationStatus === 'NOT_ACTIVATED',
    networkLocked:       record.networkRequest === 'NOT_SENT',
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass };
}

export function generateReviewId() {
  return `VCWR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateReviewAuditHash(reviewId, sourceEvidenceId, decision, ts) {
  const raw = `${reviewId}|${sourceEvidenceId}|${decision}|${ts}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) { h = ((h << 5) - h) + raw.charCodeAt(i); h |= 0; }
  return `VCWR-HASH-${Math.abs(h).toString(16).toUpperCase().padStart(8, '0')}`;
}

export const LS_REVIEW_KEY = 'controlled_wake_review_packets';

export function loadReviewPackets() {
  try {
    return JSON.parse(localStorage.getItem(LS_REVIEW_KEY) || '[]');
  } catch { return []; }
}

export function saveReviewPacket(packet) {
  const existing = loadReviewPackets();
  const updated = [packet, ...existing].slice(0, 50);
  try { localStorage.setItem(LS_REVIEW_KEY, JSON.stringify(updated)); } catch { /* quota */ }
  return updated;
}