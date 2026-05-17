/**
 * OpenClawDryRunExecutionGatePreview — Phase 33
 * Simulates an execution gate for approved Runtime Bridge requests without executing anything.
 * Local-only, preview-only, no execution, no dispatch, no backend calls.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';

const APPROVAL_QUEUE_KEY = 'openclawPhase31RuntimeBridgeApprovalQueuePreview';
const AUDIT_TRAIL_KEY = 'openclawPhase32RuntimeBridgeApprovalDecisionAuditTrail';
const SNAPSHOT_KEY = 'openclawPhase32FinalGovernanceSnapshot';
const RESULTS_KEY = 'openclawPhase33DryRunExecutionGateResults';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function runDryRunGateCheck(approvalQueue, auditTrail, snapshot) {
  const failureReasons = [];

  // Check Phase 32 snapshot exists and is complete
  if (!snapshot || snapshot.currentBuildPosition !== 'PHASE_32_COMPLETE') {
    failureReasons.push('Phase 32 snapshot not found or not complete');
    return { gateStatus: 'FAIL', failureReasons };
  }

  if (snapshot.nextPlannedGate !== 'DRY_RUN_EXECUTION_GATE') {
    failureReasons.push('Phase 32 snapshot nextPlannedGate is not DRY_RUN_EXECUTION_GATE');
    return { gateStatus: 'FAIL', failureReasons };
  }

  // Check all safety flags are false
  const safetyFlags = snapshot.safetyStatus || {};
  const allSafetyFalse = Object.values(safetyFlags).every(v => v === false);
  if (!allSafetyFalse) {
    failureReasons.push('Phase 32 snapshot safety flags are not all false');
    return { gateStatus: 'FAIL', failureReasons };
  }

  // Check audit trail exists
  if (!auditTrail || !auditTrail.auditRecords || auditTrail.auditRecords.length === 0) {
    failureReasons.push('Phase 32 audit trail not found or empty');
    return { gateStatus: 'FAIL', failureReasons };
  }

  // Check approval queue exists with approved items
  if (!approvalQueue || !approvalQueue.approvalItems || approvalQueue.approvalItems.length === 0) {
    failureReasons.push('Phase 31 approval queue not found or empty');
    return { gateStatus: 'FAIL', failureReasons };
  }

  // Filter for APPROVED items in queue
  const approvedItems = approvalQueue.approvalItems.filter(
    item =>
      item.approvalStatus === 'APPROVED' &&
      item.executionAllowed === false &&
      item.dryRunOnly === true
  );

  if (approvedItems.length === 0) {
    failureReasons.push('No APPROVED items found in Phase 31 approval queue');
    return { gateStatus: 'FAIL', failureReasons };
  }

  // Validate each approved item has matching audit record
  for (const item of approvedItems) {
    const matchingAudit = auditTrail.auditRecords.find(
      r =>
        r.sourceApprovalId === item.approvalId &&
        r.decisionStatus === 'APPROVED' &&
        r.executionStatus === 'NOT_EXECUTED' &&
        r.safetyLockStatus === 'LOCKED'
    );

    if (!matchingAudit) {
      failureReasons.push(`No matching audit record for approval ${item.approvalId}`);
    }
  }

  if (failureReasons.length > 0) {
    return { gateStatus: 'FAIL', failureReasons };
  }

  return { gateStatus: 'PASS', failureReasons: [] };
}

function generateDryRunGateResult(approvalItem, auditRecord, gateStatus) {
  return {
    dryRunGateId: `dryrun-${approvalItem.approvalId}-${Date.now()}`,
    sourceApprovalId: approvalItem.approvalId,
    sourceRequestId: approvalItem.sourceRequestId,
    sourceAuditId: auditRecord.auditId,
    checkedAt: new Date().toISOString(),
    gateStatus,
    simulatedExecutionStatus: 'SIMULATED_ONLY',
    actualExecutionStatus: 'NOT_EXECUTED',
    executionAllowed: false,
    dryRunOnly: true,
    dispatchAllowed: false,
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawDryRunExecutionGatePreview() {
  const [results, setResults] = useState(() => loadJSON(RESULTS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedFailure, setExpandedFailure] = useState(null);

  const handleRunGateCheck = () => {
    try {
      const approvalQueue = loadJSON(APPROVAL_QUEUE_KEY, {});
      const auditTrail = loadJSON(AUDIT_TRAIL_KEY, {});
      const snapshot = loadJSON(SNAPSHOT_KEY, {});

      // Run gate check
      const checkResult = runDryRunGateCheck(approvalQueue, auditTrail, snapshot);

      if (checkResult.gateStatus === 'FAIL') {
        setLastAction(`Gate check FAILED: ${checkResult.failureReasons[0]}`);
        return;
      }

      // Gate PASS — generate results for each approved item
      const approvedItems = approvalQueue.approvalItems.filter(
        item =>
          item.approvalStatus === 'APPROVED' &&
          item.executionAllowed === false &&
          item.dryRunOnly === true
      );

      const gateResults = {
        gateBatchId: `batch-${Date.now()}`,
        gateType: 'PHASE_33_DRY_RUN_EXECUTION_GATE_PREVIEW',
        checkedAt: new Date().toISOString(),
        gateCheckResult: checkResult.gateStatus,
        totalItemsChecked: approvedItems.length,
        passCount: approvedItems.length,
        failCount: 0,
        dryRunResults: approvedItems.map(item => {
          const auditRecord = auditTrail.auditRecords.find(
            r => r.sourceApprovalId === item.approvalId
          );
          return generateDryRunGateResult(item, auditRecord, 'PASS');
        }),
      };

      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify([gateResults, ...results].slice(0, 50)));
      } catch {}

      setResults([gateResults, ...results].slice(0, 50));
      setLastAction(`Dry-run gate check PASSED — ${approvedItems.length} items eligible for simulation`);
    } catch (err) {
      setLastAction('Gate check failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(results[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest gate results copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(RESULTS_KEY);
      setResults([]);
      setLastAction('All dry-run gate results cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = results.length > 0 ? results[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 33 · Dry-Run Execution Gate</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Dry-Run Execution Gate Preview
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Simulates an execution gate for approved requests without executing anything. Local-only preview.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_33_DRY_RUN_EXECUTION_GATE_PREVIEW</span>
      </div>

      {/* Gate results summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Gate Status</div>
            <div className={`text-[14px] font-bold uppercase ${latestBatch.gateCheckResult === 'PASS' ? 'text-primary' : 'text-destructive'}`}>
              {latestBatch.gateCheckResult}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Items Checked</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalItemsChecked}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Passed</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.passCount}</div>
          </div>
          <div className={`bg-card border ${latestBatch.failCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Failed</div>
            <div className={`text-[18px] font-bold ${latestBatch.failCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>{latestBatch.failCount}</div>
          </div>
        </div>
      )}

      {/* Gate requirements */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Gate Requirements</span>
        </div>
        <div className="space-y-0.5 px-4 py-3">
          <div className="text-[8px] text-slate-300 space-y-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>Phase 32 snapshot exists and is COMPLETE</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>Phase 32 nextPlannedGate equals DRY_RUN_EXECUTION_GATE</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>All Phase 32 safety execution flags are false</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>Phase 32 audit trail exists with APPROVED records</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>Phase 31 approval queue has APPROVED items (executionAllowed=false, dryRunOnly=true)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>Each approved item has matching audit record (APPROVED, NOT_EXECUTED, LOCKED)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last action feedback */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRunGateCheck}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Run Dry-Run Gate Check
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Results JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={results.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Results
        </button>
      </div>

      {/* Dry-run results table */}
      {latestBatch && latestBatch.dryRunResults && latestBatch.dryRunResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Dry-Run Results ({latestBatch.dryRunResults.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Gate Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Simulated Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Actual Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Execution Allowed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.dryRunResults.map((result, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{result.sourceRequestId}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-primary font-semibold">{result.gateStatus}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[7px] font-mono">{result.simulatedExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-primary font-mono text-[7px]">{result.actualExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-destructive font-bold text-[7px]">{String(result.executionAllowed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Dry-Run Gate Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This gate does NOT execute anything, dispatch any commands, call any backend APIs, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. PASS only means eligible for dry-run simulation, not live execution.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not execute anything</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call OpenClaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call backend APIs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not trade, enter credentials, schedule, poll, or move money</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>PASS only means eligible for simulation, not authorization for live execution</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Dry-Run Gate Results — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.checkedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{RESULTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only gate preview. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}