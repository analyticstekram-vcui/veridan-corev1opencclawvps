/**
 * Phase5ApprovalBindingTestCases
 * Operator-visible test packet for Phase 5 approval binding validation.
 * Displays 8 test scenarios without auto-running them.
 * PREVIEW_ONLY / NOT_EXECUTED
 */
import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const TEST_CASES = [
  {
    id: 1,
    title: 'Missing proposalId',
    description: 'bridgeRequest has no proposalId field',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'proposalId field missing from bridgeRequest',
  },
  {
    id: 2,
    title: 'Forged approvalStatus only, no DB proposal',
    description: 'bridgeRequest.approvalStatus=APPROVED but no matching proposal in DB',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'No approved proposal found with proposalId',
  },
  {
    id: 3,
    title: 'Existing proposal but status !== APPROVED',
    description: 'Proposal found in DB but status is DRAFT, PENDING_APPROVAL, or DENIED',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'Proposal status is [status], not APPROVED',
  },
  {
    id: 4,
    title: 'Approved proposal with mismatched commandType',
    description: 'Proposal is APPROVED but proposal.commandType !== bridgeRequest.commandType (e.g. READ vs VERIFY)',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'Proposal commandType [X] does not match bridgeRequest [Y]',
  },
  {
    id: 5,
    title: 'Approved proposal with mismatched targetUrl',
    description: 'Proposal is APPROVED but proposal.url/target !== bridgeRequest.targetUrl',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'Proposal targetUrl does not match bridgeRequest targetUrl',
  },
  {
    id: 6,
    title: 'Approved proposal with mismatched riskTier',
    description: 'Proposal is APPROVED but proposal.riskTier !== bridgeRequest.riskTier (e.g. LOW vs MEDIUM)',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'Proposal riskTier [X] does not match bridgeRequest [Y]',
  },
  {
    id: 7,
    title: 'Approved proposal with mismatched operatorId',
    description: 'Proposal is APPROVED but proposal.proposedBy !== bridgeRequest.operatorId',
    expectedOutcome: 'REJECTED_NOT_EXECUTED',
    expectedStatus: 'FAIL',
    failureReason: 'Proposal proposedBy [X] does not match operatorId [Y]',
  },
  {
    id: 8,
    title: 'Approved matching proposal',
    description: 'Proposal is APPROVED and all fields match: commandType, targetUrl, riskTier, proposedBy',
    expectedOutcome: 'DRY_RUN_ONLY / NOT_EXECUTED',
    expectedStatus: 'PASS',
    failureReason: null,
  },
];

export default function Phase5ApprovalBindingTestCases() {
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/20 bg-primary/10">
        <div className="flex items-start gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Phase 5: Approval Binding Validation Test Cases
            </div>
            <div className="text-[8px] text-primary/70 mt-0.5">
              8 operator-visible test scenarios. PREVIEW_ONLY / NOT_EXECUTED. Do not auto-run.
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases Grid */}
      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        {TEST_CASES.map((testCase) => {
          const isFail = testCase.expectedStatus === 'FAIL';
          const borderColor = isFail ? 'border-destructive/30' : 'border-primary/30';
          const bgColor = isFail ? 'bg-destructive/5' : 'bg-primary/5';
          const statusColor = isFail ? 'text-destructive' : 'text-primary';
          const icon = isFail ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />;

          return (
            <div key={testCase.id} className={`border rounded-sm p-2.5 space-y-1 ${borderColor} ${bgColor}`}>
              {/* Case title + outcome */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[9px] font-bold text-foreground">
                    #{testCase.id}: {testCase.title}
                  </div>
                  <div className="text-[8px] text-slate-400 mt-0.5">{testCase.description}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {icon}
                  <span className={`text-[8px] font-bold uppercase ${statusColor}`}>
                    {testCase.expectedStatus}
                  </span>
                </div>
              </div>

              {/* Expected outcome */}
              <div className="text-[8px] text-slate-500 font-semibold pt-1 border-t border-current/10">
                <span className="text-slate-400">Expected Outcome:</span>{' '}
                <span className={`font-mono font-bold ${statusColor}`}>
                  {testCase.expectedOutcome}
                </span>
              </div>

              {/* Failure reason (if applicable) */}
              {testCase.failureReason && (
                <div className="text-[7px] text-destructive/80 font-mono italic pl-2 border-l border-destructive/30">
                  {testCase.failureReason}
                </div>
              )}

              {/* Safety note */}
              <div className="text-[7px] text-primary/60 flex items-center gap-1">
                <Info className="w-2.5 h-2.5 shrink-0" />
                <span>Dry-run validation only. No OpenClaw call. No execution.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 border-t border-primary/20 bg-primary/5 text-[8px] text-primary/70 font-mono">
        All test cases validate the Phase 5 Approval Binding phase: proposal must exist, be APPROVED, and match all command/target/risk/operator fields. Tests are PREVIEW_ONLY.
      </div>
    </div>
  );
}