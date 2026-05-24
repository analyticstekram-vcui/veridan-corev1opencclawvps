/**
 * Shared isPassingRecord logic — used identically by:
 *   - /wake-control-center
 *   - /controlled-wake-activation-review
 *   - /wake-activation-readiness
 *
 * SAFETY: Read-only evaluation only. No network. No activation. No token read.
 */

export const VALID_APPROVAL = ['REVIEW_READY', 'APPROVED'];

/**
 * Returns true if a readiness record meets ALL safety gates:
 *   - checksPassed >= 16 AND checksTotal >= 16
 *   - approvalState in REVIEW_READY | APPROVED
 *   - decision includes READY_FOR_CONTROLLED_WAKE
 *   - activationStatus is NOT_ACTIVATED (or missing)
 *   - executionStatus is NOT_EXECUTED (or missing)
 *   - dispatchStatus is NOT_DISPATCHED (or missing)
 *   - networkRequest is NOT_SENT (or missing when openclawWakeCall is also NOT_SENT)
 *   - openclawWakeCall is NOT_SENT (or missing)
 */
export function isPassingRecord(r) {
  if (!r) return false;
  const cp = Number(r.checksPassed ?? 0);
  const ct = Number(r.checksTotal  ?? 0);
  const checksOk   = r.allPass === true || (cp >= 16 && ct >= 16 && cp === ct);
  const approval   = (r.operatorApprovalState || r.approvalState || r.approval || r.form?.operatorApprovalState || '').trim().toUpperCase();
  const approvalOk = VALID_APPROVAL.includes(approval);
  const decisionOk = typeof r.decision === 'string' && r.decision.includes('READY_FOR_CONTROLLED_WAKE');
  const activationOk = !r.activationStatus || r.activationStatus === 'NOT_ACTIVATED';
  const execOk       = !r.executionStatus   || r.executionStatus   === 'NOT_EXECUTED';
  const dispatchOk   = !r.dispatchStatus    || r.dispatchStatus    === 'NOT_DISPATCHED';
  const nr  = (r.networkRequest   || '').trim().toUpperCase();
  const owc = (r.openclawWakeCall || '').trim().toUpperCase();
  const networkOk = !nr || nr === 'NOT_SENT' || (!nr && (!owc || owc === 'NOT_SENT'));
  const wakeCallOk = !owc || owc === 'NOT_SENT';
  return checksOk && approvalOk && decisionOk && activationOk && execOk && dispatchOk && networkOk && wakeCallOk;
}

export const LS_HISTORY_KEY = 'wake_activation_readiness_history';

export function loadLatestPassingRecord() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || '[]');
    const sorted = [...arr].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return sorted.find(r => isPassingRecord(r)) || null;
  } catch { return null; }
}