import React from 'react';
import { Shield, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

/**
 * LocalGovernanceConsistencyAudit
 * Compares current System Verify state against:
 * - Latest verification snapshot metadata
 * - Latest release approval record
 * - Latest gate decision export metadata
 * 
 * All data from localStorage, client-side only, no OpenClaw calls.
 */
export default function LocalGovernanceConsistencyAudit({
  overallReadiness,
  backendEnforcementPassed,
  failedTests,
  manualReviewItemCount,
  snapshotHistory,
  approvalRecords,
}) {
  // Load latest gate decision history from localStorage
  const gateDecisionHistory = (() => {
    try {
      const stored = localStorage.getItem('systemVerifyGateDecisionHistory');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const latestSnapshot = snapshotHistory.length > 0 ? snapshotHistory[0] : null;
  const latestApproval = approvalRecords.length > 0 ? approvalRecords[0] : null;
  const latestGateDecision = gateDecisionHistory.length > 0 ? gateDecisionHistory[0] : null;

  // Calculate current gate state
  let currentGateState = 'UNLOCKABLE';
  if (overallReadiness === 'BLOCKED' || !backendEnforcementPassed || failedTests > 0) {
    currentGateState = 'LOCKED';
  } else if (overallReadiness === 'REVIEW REQUIRED' || manualReviewItemCount > 0) {
    currentGateState = 'REVIEW LOCKED';
  }

  // Run consistency checks
  const checks = [];

  // Check 1: Current readiness matches latest snapshot readiness
  if (latestSnapshot) {
    const match = overallReadiness === latestSnapshot.readinessStatus;
    checks.push({
      id: 'snapshot_readiness_match',
      name: 'Current readiness matches latest snapshot readiness',
      status: match ? 'pass' : 'warn',
      reason: match
        ? `Current: ${overallReadiness}, Latest snapshot: ${latestSnapshot.readinessStatus}`
        : `MISMATCH: Current is ${overallReadiness}, latest snapshot is ${latestSnapshot.readinessStatus}`,
    });
  } else {
    checks.push({
      id: 'snapshot_readiness_match',
      name: 'Current readiness matches latest snapshot readiness',
      status: 'warn',
      reason: 'No snapshot history available yet',
    });
  }

  // Check 2: Current readiness matches latest gate decision readiness
  if (latestGateDecision) {
    const match = overallReadiness === latestGateDecision.readinessStatus;
    checks.push({
      id: 'gate_readiness_match',
      name: 'Current readiness matches latest gate decision readiness',
      status: match ? 'pass' : 'warn',
      reason: match
        ? `Current: ${overallReadiness}, Latest gate: ${latestGateDecision.readinessStatus}`
        : `MISMATCH: Current is ${overallReadiness}, latest gate is ${latestGateDecision.readinessStatus}`,
    });
  } else {
    checks.push({
      id: 'gate_readiness_match',
      name: 'Current readiness matches latest gate decision readiness',
      status: 'warn',
      reason: 'No gate decision history available yet',
    });
  }

  // Check 3: Latest approval decision is not APPROVED when current readiness is BLOCKED
  if (latestApproval) {
    const isBlocked = overallReadiness === 'BLOCKED';
    const isApproved = latestApproval.approvalDecision === 'APPROVED';
    const pass = !(isBlocked && isApproved);
    checks.push({
      id: 'approval_blocked_mismatch',
      name: 'Latest approval decision is not APPROVED when current readiness is BLOCKED',
      status: pass ? 'pass' : 'fail',
      reason: pass
        ? `OK: Current readiness is ${overallReadiness}, latest approval is ${latestApproval.approvalDecision}`
        : `INCONSISTENT: Current readiness is BLOCKED but latest approval is APPROVED`,
    });
  } else {
    checks.push({
      id: 'approval_blocked_mismatch',
      name: 'Latest approval decision is not APPROVED when current readiness is BLOCKED',
      status: 'warn',
      reason: 'No approval records available yet',
    });
  }

  // Check 4: Gate state is not UNLOCKABLE when current readiness is not READY
  const gateNotUnlockableWhenNotReady = !(currentGateState === 'UNLOCKABLE' && overallReadiness !== 'READY');
  checks.push({
    id: 'gate_unlockable_consistency',
    name: 'Gate state is not UNLOCKABLE when current readiness is not READY',
    status: gateNotUnlockableWhenNotReady ? 'pass' : 'fail',
    reason: gateNotUnlockableWhenNotReady
      ? `OK: Current readiness is ${overallReadiness}, gate state is ${currentGateState}`
      : `INCONSISTENT: Current readiness is ${overallReadiness} but gate state is UNLOCKABLE`,
  });

  // Check 5: Gate state is not UNLOCKABLE when latest approval decision is REJECTED
  if (latestApproval) {
    const isRejected = latestApproval.approvalDecision === 'REJECTED';
    const isUnlockable = currentGateState === 'UNLOCKABLE';
    const pass = !(isRejected && isUnlockable);
    checks.push({
      id: 'gate_rejected_mismatch',
      name: 'Gate state is not UNLOCKABLE when latest approval decision is REJECTED',
      status: pass ? 'pass' : 'fail',
      reason: pass
        ? `OK: Latest approval is ${latestApproval.approvalDecision}, gate state is ${currentGateState}`
        : `INCONSISTENT: Latest approval is REJECTED but gate state is UNLOCKABLE`,
    });
  } else {
    checks.push({
      id: 'gate_rejected_mismatch',
      name: 'Gate state is not UNLOCKABLE when latest approval decision is REJECTED',
      status: 'warn',
      reason: 'No approval records available yet',
    });
  }

  // Check 6: Snapshot hash exists before approval if approval references a snapshot hash
  if (latestApproval && latestApproval.snapshotHash) {
    const hashExists = latestSnapshot && latestSnapshot.hash === latestApproval.snapshotHash;
    checks.push({
      id: 'approval_snapshot_hash_exists',
      name: 'Snapshot hash referenced by approval exists in history',
      status: hashExists ? 'pass' : 'fail',
      reason: hashExists
        ? `Approval references snapshot hash: ${latestApproval.snapshotHash.substring(0, 16)}...`
        : `MISSING: Approval references snapshot hash but it not found in history`,
    });
  } else {
    checks.push({
      id: 'approval_snapshot_hash_exists',
      name: 'Snapshot hash referenced by approval exists in history',
      status: 'warn',
      reason: 'No approval with snapshot hash reference yet',
    });
  }

  // Check 7: Gate decision hash exists for latest gate export
  if (latestGateDecision) {
    const hashExists = !!latestGateDecision.gateDecisionHash;
    checks.push({
      id: 'gate_decision_hash_exists',
      name: 'Gate decision hash exists for latest gate export',
      status: hashExists ? 'pass' : 'fail',
      reason: hashExists
        ? `Gate decision hash: ${latestGateDecision.gateDecisionHash.substring(0, 16)}...`
        : `MISSING: Gate decision export missing integrity hash`,
    });
  } else {
    checks.push({
      id: 'gate_decision_hash_exists',
      name: 'Gate decision hash exists for latest gate export',
      status: 'warn',
      reason: 'No gate decision exports yet',
    });
  }

  // Calculate overall consistency status
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  let consistencyStatus = 'CONSISTENT';
  let statusColor = 'text-primary border-primary/20 bg-primary/5';

  if (failCount > 0) {
    consistencyStatus = 'INCONSISTENT';
    statusColor = 'text-destructive border-destructive/20 bg-destructive/5';
  } else if (warnCount > 0) {
    consistencyStatus = 'REVIEW NEEDED';
    statusColor = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
  }

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${statusColor}`}>
      <div className="flex items-start gap-3 mb-3">
        <Shield className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <div className={`text-[11px] font-semibold mb-0.5 ${statusColor.split(' ')[0]}`}>Local Governance Consistency Audit</div>
          <div className={`text-[9px] ${statusColor.split(' ')[0]}/80`}>Compares current verification state against latest snapshot, approval, and gate decision records.</div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="px-4 py-3 border rounded-lg bg-card/50">
        <div className={`text-[12px] font-semibold ${statusColor.split(' ')[0]} mb-1 uppercase tracking-wider`}>
          {consistencyStatus}
        </div>
        <div className={`text-[9px] ${statusColor.split(' ')[0]}/80`}>
          {consistencyStatus === 'CONSISTENT' && 'All governance records are consistent with current system state.'}
          {consistencyStatus === 'REVIEW NEEDED' && `${warnCount} check${warnCount !== 1 ? 's' : ''} require attention. Some historical records may be stale.`}
          {consistencyStatus === 'INCONSISTENT' && `${failCount} critical inconsistenc${failCount !== 1 ? 'ies' : 'y'} detected. Review approval and gate decision records.`}
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-2">
        {checks.map(check => {
          const statusCfg = check.status === 'pass'
            ? { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' }
            : check.status === 'warn'
            ? { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' }
            : { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' };

          const StatusIcon = statusCfg.icon;

          return (
            <div key={check.id} className={`border rounded p-2.5 ${statusCfg.bg}`}>
              <div className="flex items-start gap-2">
                <StatusIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${statusCfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[9px] font-semibold ${statusCfg.color}`}>{check.name}</div>
                  <div className="text-[8px] text-foreground/70 mt-0.5">{check.reason}</div>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold shrink-0 uppercase ${statusCfg.bg} ${statusCfg.color}`}>
                  {check.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[8px] text-foreground/60 border-t border-border/30 pt-2 mt-2">
        This audit is local and read-only. It detects mismatches between verification snapshots, approval records, and gate decision exports stored in browser localStorage. No OpenClaw calls or live actions are executed.
      </div>
    </div>
  );
}