import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

/**
 * SystemVerifyOperatorChecklist
 * Provides a read-only pre-execution review sequence.
 * Derives status from current UI/local state.
 */
export default function SystemVerifyOperatorChecklist({
  prodBlockingFailed,
  manualReviewItemCount,
  failedTests,
  snapshotHash,
  snapshotHistory,
  approvalRecords,
  gateDecisionHistory,
}) {
  // Define checklist items
  const checklist = [
    {
      id: 'review_readiness_summary',
      name: 'Review Production Readiness Summary',
      description: 'Examine the readiness status, issue counts, and backend enforcement status.',
      getStatus: () => 'COMPLETE', // Always visible on page
    },
    {
      id: 'blocking_issues_zero',
      name: 'Confirm Blocking Issues count is 0',
      description: `Current blocking issues: ${prodBlockingFailed.length}`,
      getStatus: () => prodBlockingFailed.length === 0 ? 'COMPLETE' : 'ATTENTION',
    },
    {
      id: 'review_manual_items',
      name: 'Review Manual Review Items',
      description: `Current manual review items: ${manualReviewItemCount}`,
      getStatus: () => manualReviewItemCount === 0 ? 'COMPLETE' : 'ATTENTION',
    },
    {
      id: 'verify_tests_pass',
      name: 'Confirm all System Verify Test Results pass',
      description: `Failed tests: ${failedTests}`,
      getStatus: () => failedTests === 0 ? 'COMPLETE' : 'ATTENTION',
    },
    {
      id: 'export_snapshot',
      name: 'Export Verification Snapshot',
      description: snapshotHistory.length > 0
        ? `${snapshotHistory.length} snapshot(s) exported`
        : 'No snapshots exported yet',
      getStatus: () => snapshotHistory.length > 0 ? 'COMPLETE' : 'MISSING',
    },
    {
      id: 'save_snapshot_hash',
      name: 'Copy/save Snapshot Hash',
      description: snapshotHash
        ? `Hash: ${snapshotHash.substring(0, 16)}...`
        : 'No snapshot hash available',
      getStatus: () => snapshotHash ? 'COMPLETE' : 'MISSING',
    },
    {
      id: 'create_approval_record',
      name: 'Create Release Approval Record',
      description: approvalRecords.length > 0
        ? `${approvalRecords.length} approval record(s) created`
        : 'No approval records created yet',
      getStatus: () => approvalRecords.length > 0 ? 'COMPLETE' : 'MISSING',
    },
    {
      id: 'review_gate_preview',
      name: 'Review Execution Readiness Gate Preview',
      description: 'Examine the gate state, reasons, and unlock criteria.',
      getStatus: () => 'COMPLETE', // Always visible on page
    },
    {
      id: 'export_gate_decision',
      name: 'Export Gate Decision',
      description: gateDecisionHistory.length > 0
        ? `${gateDecisionHistory.length} gate decision(s) exported`
        : 'No gate decisions exported yet',
      getStatus: () => gateDecisionHistory.length > 0 ? 'COMPLETE' : 'MISSING',
    },
    {
      id: 'save_gate_hash',
      name: 'Copy/save Gate Decision Hash',
      description: gateDecisionHistory.length > 0 && gateDecisionHistory[0].gateDecisionHash
        ? `Hash: ${gateDecisionHistory[0].gateDecisionHash.substring(0, 16)}...`
        : 'No gate decision hash available',
      getStatus: () => gateDecisionHistory.length > 0 && gateDecisionHistory[0].gateDecisionHash ? 'COMPLETE' : 'MISSING',
    },
    {
      id: 'review_consistency_audit',
      name: 'Review Local Governance Consistency Audit',
      description: 'Verify all governance records are consistent with current state.',
      getStatus: () => 'COMPLETE', // Always visible on page
    },
  ];

  // Calculate statuses
  const items = checklist.map(item => ({
    ...item,
    status: item.getStatus(),
  }));

  const completeCount = items.filter(i => i.status === 'COMPLETE').length;
  const attentionCount = items.filter(i => i.status === 'ATTENTION').length;
  const missingCount = items.filter(i => i.status === 'MISSING').length;

  // Overall checklist status
  let overallStatus = 'COMPLETE';
  let statusColor = 'text-primary border-primary/20 bg-primary/5';

  if (missingCount > 0 || attentionCount > 0) {
    overallStatus = 'ACTION REQUIRED';
    statusColor = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
  }

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${statusColor}`}>
      <div className="flex items-start gap-3 mb-3">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <div className={`text-[11px] font-semibold mb-0.5 ${statusColor.split(' ')[0]}`}>System Verify Operator Checklist</div>
          <div className={`text-[9px] ${statusColor.split(' ')[0]}/80`}>Pre-execution review sequence. All items are read-only and derive status from current UI state.</div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="px-4 py-3 border rounded-lg bg-card/50">
        <div className={`text-[12px] font-semibold ${statusColor.split(' ')[0]} mb-1 uppercase tracking-wider`}>
          {overallStatus}
        </div>
        <div className={`text-[9px] ${statusColor.split(' ')[0]}/80`}>
          {overallStatus === 'COMPLETE'
            ? `All ${completeCount} checklist items completed.`
            : `${missingCount + attentionCount} item${missingCount + attentionCount !== 1 ? 's' : ''} require action. ${completeCount} complete, ${attentionCount} need attention, ${missingCount} missing.`}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Progress</div>
        <div className="h-2 bg-secondary/30 border border-border/30 rounded overflow-hidden flex">
          <div
            style={{ width: `${(completeCount / items.length) * 100}%` }}
            className="bg-primary transition-all"
          />
        </div>
        <div className="text-[8px] text-slate-400 flex justify-between">
          <span>{completeCount} complete</span>
          <span>{completeCount} / {items.length}</span>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const statusCfg = item.status === 'COMPLETE'
            ? { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' }
            : item.status === 'ATTENTION'
            ? { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' }
            : { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-400/5 border-slate-400/20' };

          const StatusIcon = statusCfg.icon;

          return (
            <div key={item.id} className={`border rounded-lg p-3 ${statusCfg.bg}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-semibold ${statusCfg.color}`}>
                    {idx + 1}. {item.name}
                  </div>
                  <div className="text-[9px] text-foreground/70 mt-0.5">{item.description}</div>
                </div>
                <span className={`text-[8px] px-2 py-0.5 border rounded font-semibold shrink-0 uppercase whitespace-nowrap ${statusCfg.bg} ${statusCfg.color}`}>
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-[8px] text-foreground/60 border-t border-border/30 pt-2 mt-2">
        This checklist is read-only and derived from current UI state. No approvals, exports, or OpenClaw actions are executed automatically. Operator must manually complete each step as needed.
      </div>
    </div>
  );
}