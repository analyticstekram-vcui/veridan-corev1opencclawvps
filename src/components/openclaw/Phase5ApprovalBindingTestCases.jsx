/**
 * Phase5ApprovalBindingTestCases
 * Operator-visible test packet for Phase 5 approval binding validation.
 * Displays 8 test scenarios with manual result capture.
 * LOCAL_ONLY / MANUAL_EVIDENCE / NOT_EXECUTED
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Edit2 } from 'lucide-react';

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

const STORAGE_KEY = 'phase5_approval_binding_manual_results';

function loadResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResults(results) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {}
}

export default function Phase5ApprovalBindingTestCases() {
  const [results, setResults] = useState(loadResults());
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    saveResults(results);
  }, [results]);

  const handleStatusChange = (testCaseId, status) => {
    setResults(prev => ({
      ...prev,
      [testCaseId]: { ...prev[testCaseId], status }
    }));
  };

  const handleNotesChange = (testCaseId, notes) => {
    setResults(prev => ({
      ...prev,
      [testCaseId]: { ...prev[testCaseId], notes }
    }));
  };

  const getResultStatus = (testCaseId) => results[testCaseId]?.status || 'NOT_RUN';
  const getNotes = (testCaseId) => results[testCaseId]?.notes || '';

  const counts = TEST_CASES.reduce(
    (acc, tc) => {
      const status = getResultStatus(tc.id);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  const passCount = counts['PASS'] || 0;
  const failCount = counts['FAIL'] || 0;
  const notRunCount = counts['NOT_RUN'] || 0;

  return (
    <div className="border border-primary/20 bg-primary/5 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/20 bg-primary/10 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Phase 5: Approval Binding Validation — Manual Test Evidence
            </div>
            <div className="text-[8px] text-primary/70 mt-0.5">
              8 test scenarios with operator manual result capture. LOCAL_ONLY / MANUAL_EVIDENCE.
            </div>
          </div>
        </div>
        {/* Summary */}
        <div className="flex items-center gap-3 text-[8px] font-semibold ml-6">
          <span className="text-primary">✓ PASS: {passCount}</span>
          <span className="text-destructive">✗ FAIL: {failCount}</span>
          <span className="text-slate-400">○ NOT_RUN: {notRunCount}</span>
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

          const resultStatus = getResultStatus(testCase.id);
          const notes = getNotes(testCase.id);
          const isEditing = editingId === testCase.id;

          let resultBgColor = 'bg-slate-500/5';
          let resultTextColor = 'text-slate-500';
          if (resultStatus === 'PASS') {
            resultBgColor = 'bg-primary/10';
            resultTextColor = 'text-primary';
          } else if (resultStatus === 'FAIL') {
            resultBgColor = 'bg-destructive/10';
            resultTextColor = 'text-destructive';
          }

          return (
            <div key={testCase.id} className={`border rounded-sm p-2.5 space-y-1.5 ${borderColor} ${bgColor}`}>
              {/* Case title + expected outcome */}
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
                <span className="text-slate-400">Expected:</span>{' '}
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

              {/* Manual result capture */}
              <div className={`rounded-sm p-2 space-y-1.5 ${resultBgColor} border border-current/20`}>
                <div className="text-[7px] font-semibold uppercase text-slate-500">Manual Result Capture</div>

                {/* Status buttons */}
                <div className="flex gap-1.5">
                  {['NOT_RUN', 'PASS', 'FAIL'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(testCase.id, status)}
                      className={`flex-1 px-2 py-1 rounded text-[7px] font-bold uppercase border transition-colors ${
                        resultStatus === status
                          ? status === 'PASS'
                            ? 'bg-primary/30 border-primary text-primary'
                            : status === 'FAIL'
                            ? 'bg-destructive/30 border-destructive text-destructive'
                            : 'bg-slate-500/30 border-slate-500 text-slate-400'
                          : 'bg-secondary/20 border-border text-slate-500 hover:text-foreground'
                      }`}
                    >
                      {status === 'NOT_RUN' ? '○ Not Run' : status === 'PASS' ? '✓ Pass' : '✗ Fail'}
                    </button>
                  ))}
                </div>

                {/* Notes field */}
                <div className="space-y-0.5">
                  {isEditing || notes ? (
                    <div className="space-y-0.5">
                      <textarea
                        value={notes}
                        onChange={(e) => handleNotesChange(testCase.id, e.target.value)}
                        placeholder="Notes (optional)..."
                        className="w-full px-2 py-1 bg-secondary/20 border border-border/40 rounded text-[7px] font-mono text-foreground placeholder:text-slate-600 resize-none focus:outline-none focus:border-primary/50 h-12"
                        onBlur={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingId(testCase.id)}
                      className="text-[7px] text-slate-500 hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      {notes ? `Notes: ${notes.substring(0, 40)}${notes.length > 40 ? '...' : ''}` : 'Add notes (optional)'}
                    </button>
                  )}
                </div>
              </div>

              {/* Safety note */}
              <div className="text-[7px] text-primary/60 flex items-center gap-1">
                <Info className="w-2.5 h-2.5 shrink-0" />
                <span>Manual operator test. No auto-run. No OpenClaw. Local-only storage.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 border-t border-primary/20 bg-primary/5 text-[8px] text-primary/70 font-mono space-y-0.5">
        <div>All test cases validate Phase 5 Approval Binding: proposal exists, is APPROVED, matches all fields (commandType/targetUrl/riskTier/proposedBy).</div>
        <div className="text-primary/60">LOCAL_ONLY / MANUAL_EVIDENCE — Results saved to localStorage. No auto-run. No OpenClaw calls. No execution.</div>
      </div>
    </div>
  );
}