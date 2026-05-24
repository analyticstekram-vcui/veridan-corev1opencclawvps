/**
 * Shared wake readiness validation — single source of truth.
 * Used by: /wake-control-center, /controlled-wake-activation-review, /wake-activation-readiness
 *
 * SAFETY: Read-only evaluation only. No network. No activation. No token read.
 */

export const VALID_APPROVAL = ['REVIEW_READY', 'APPROVED'];

export const VALID_DECISIONS = [
  'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW',
  'READY_FOR_CONTROLLED_WAKE_REVIEW',
  'CONTROLLED_WAKE_ACTIVATION_REVIEW',
];

export const LS_HISTORY_KEY = 'wake_activation_readiness_history';

/**
 * Normalize approval from any field path the record may use.
 */
export function normalizeApproval(r) {
  if (!r) return '';
  return (
    r.operatorApprovalState ||
    r.approvalState ||
    r.approval ||
    r.form?.operatorApprovalState ||
    ''
  ).trim().toUpperCase();
}

/**
 * Normalize decision string.
 */
export function normalizeDecision(r) {
  if (!r) return '';
  return (r.decision || '').trim().toUpperCase();
}

/**
 * Returns true if a readiness record meets ALL safety gates:
 *   - checksPassed >= 16 AND checksTotal >= 16
 *   - approvalState normalized to REVIEW_READY | APPROVED
 *   - decision matches VALID_DECISIONS
 *   - activationStatus is NOT_ACTIVATED (or missing)
 *   - executionStatus is NOT_EXECUTED (or missing)
 *   - dispatchStatus is NOT_DISPATCHED (or missing)
 *   - networkRequest is NOT_SENT (or missing when openclawWakeCall is also safe)
 *   - openclawWakeCall is NOT_SENT (or missing)
 */
export function isPassingRecord(r) {
  if (!r) return false;

  const cp = Number(r.checksPassed ?? 0);
  const ct = Number(r.checksTotal  ?? 0);
  const checksOk = r.allPass === true || (cp >= 16 && ct >= 16);

  const approval   = normalizeApproval(r);
  const approvalOk = VALID_APPROVAL.includes(approval);

  const decision   = normalizeDecision(r);
  const decisionOk = VALID_DECISIONS.some(d => decision.includes(d));

  const activationOk = !r.activationStatus || r.activationStatus === 'NOT_ACTIVATED';
  const execOk       = !r.executionStatus   || r.executionStatus   === 'NOT_EXECUTED';
  const dispatchOk   = !r.dispatchStatus    || r.dispatchStatus    === 'NOT_DISPATCHED';

  const nr  = (r.networkRequest   || '').trim().toUpperCase();
  const owc = (r.openclawWakeCall || '').trim().toUpperCase();
  const networkOk  = !nr  || nr  === 'NOT_SENT';
  const wakeCallOk = !owc || owc === 'NOT_SENT';

  return checksOk && approvalOk && decisionOk && activationOk && execOk && dispatchOk && networkOk && wakeCallOk;
}

/**
 * Load the newest passing record from localStorage history.
 */
export function loadLatestPassingRecord() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || '[]');
    const sorted = [...arr].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return sorted.find(r => isPassingRecord(r)) || null;
  } catch { return null; }
}