import React from 'react';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

export default function Phase5DryRunBridgePlan() {
  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-500/20">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-[10px] font-semibold text-amber-600">Phase 5: OpenClaw Dry-Run Bridge Plan</div>
            <div className="text-[9px] text-amber-500/80 mt-1">Future bridge layer to prepare OpenClaw calls without executing live actions. Planning only—no implementation.</div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[8px] font-semibold text-amber-500">PLAN_ONLY</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-3">
        {/* Critical Warning */}
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-[9px] text-destructive">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">Phase 5 is a plan only.</div>
            <div className="text-[8px] text-destructive/80">It does not connect to OpenClaw or execute actions. No implementation has been started. Dry-run preview only.</div>
          </div>
        </div>

        {/* Phase 5 Status */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Phase 5 Status</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-semibold text-amber-500 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">PLAN_ONLY</span>
              <span className="text-[8px] text-slate-400">No implementation started</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-semibold text-amber-500 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">OPENCLAW_NOT_CONNECTED</span>
              <span className="text-[8px] text-slate-400">No OpenClaw gateway integration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-semibold text-amber-500 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">EXECUTION_DISABLED</span>
              <span className="text-[8px] text-slate-400">No live actions, dry-run preview only</span>
            </div>
          </div>
        </div>

        {/* Required Prerequisite Locks */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Required Prerequisite Locks</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-1 text-[8px] text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Phase 0 governance shell locked</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Phase 1 validation locked (contract validation enforced)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Phase 2 policy gate locked (CLICK/TYPE rejected, HIGH/CRITICAL rejected)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Phase 2 replay protection locked (duplicate prevention active)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Phase 4 HMAC chain locked (signature verification active)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>System Verify READY or REVIEW_REQUIRED with no blocking issues</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Proposal status APPROVED</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>executionEligibility ELIGIBLE_PREVIEW</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold">✓</span>
              <span>Signed request verified by backend (HMAC valid)</span>
            </div>
          </div>
        </div>

        {/* Future Dry-Run Bridge Behavior */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Future Dry-Run Bridge Behavior</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-1 text-[8px] text-slate-400">
            <div>1. Receive signed bridge request (verified by Phase 4 HMAC)</div>
            <div>2. Verify HMAC-SHA256 signature matches canonical payload</div>
            <div>3. Verify policy gate passes (no forbidden commands)</div>
            <div>4. Verify replay protection (no duplicates)</div>
            <div>5. Create dry-run execution preview record</div>
            <div>6. Do NOT call live OpenClaw execution gateway</div>
            <div>7. Do NOT click, type, or navigate in browser</div>
            <div>8. Do NOT trigger trading orders or API mutations</div>
            <div>9. Return preview-only acknowledgment to frontend</div>
            <div>10. Log dry-run audit trail for future reference</div>
          </div>
        </div>

        {/* Future OpenClaw Dry-Run Payload Shape */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Future OpenClaw Dry-Run Payload Shape</div>
          <div className="bg-secondary/30 rounded-lg px-3 py-2 text-[8px] text-slate-400 font-mono space-y-1">
            <div>{`{
  dryRunId: string,               // Unique dry-run execution ID
  requestId: string,              // Bridge request ID
  proposalId: string,             // Proposal ID
  commandType: string,            // READ, NAVIGATE, EXTRACT, VERIFY
  targetUrl: string,              // HTTPS URL (allowlisted)
  selector: string,               // DOM selector (if applicable)
  reason: string,                 // User-provided reason
  riskTier: string,               // LOW, MEDIUM
  governanceMode: string,         // SAFE_REQUIRES_APPROVAL
  bridgeMode: string,             // OPENCLAW_DRY_RUN_PREVIEW
  executionStatus: string,        // PREVIEW_ONLY
  signedAt: ISO timestamp,        // Request signature timestamp
  verifiedAt: ISO timestamp,      // When HMAC verified
  createdAt: ISO timestamp        // Record creation time
}`}</div>
          </div>
        </div>

        {/* Explicitly Prohibited in Phase 5 */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-destructive uppercase tracking-wider">Explicitly Prohibited in Phase 5</div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 space-y-1 text-[8px] text-destructive">
            <div>✗ liveExecution true (must remain false)</div>
            <div>✗ CLICK execution (write operations forbidden)</div>
            <div>✗ TYPE execution (keyboard input forbidden)</div>
            <div>✗ Trading orders or financial actions</div>
            <div>✗ Money movement or fund transfers</div>
            <div>✗ Credential entry or authentication</div>
            <div>✗ External API mutation calls</div>
            <div>✗ Browser automation or form submission</div>
            <div>✗ OpenClaw live action calls (dry-run only)</div>
          </div>
        </div>

        {/* Future Audit Requirements */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Future Audit Requirements</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-1 text-[8px] text-slate-400">
            <div>✓ dryRunAuditId — Unique audit trail identifier</div>
            <div>✓ requestId — Bridge request identifier</div>
            <div>✓ proposalId — Proposal identifier</div>
            <div>✓ acceptedForDryRun — Boolean (passed all checks)</div>
            <div>✓ rejectedReason — If rejected, reason code</div>
            <div>✓ policyGateResult — PASS or FAIL</div>
            <div>✓ replayCheckResult — PASS or FAIL</div>
            <div>✓ signatureCheckResult — PASS or FAIL</div>
            <div>✓ executionStatus — PREVIEW_ONLY or REJECTED_NOT_EXECUTED</div>
            <div>✓ note — "Phase 5 dry-run bridge preview only. No OpenClaw action was executed."</div>
          </div>
        </div>

        {/* Future Test Requirements */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Future Test Requirements</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-1 text-[8px] text-slate-400">
            <div className="text-foreground font-semibold mb-1">✓ Must Pass:</div>
            <div className="ml-2 space-y-0.5">
              <div>• Valid signed READ request creates dry-run preview</div>
              <div>• Valid signed NAVIGATE request creates dry-run preview</div>
              <div>• Valid signed EXTRACT request creates dry-run preview</div>
              <div>• Valid signed VERIFY request creates dry-run preview</div>
            </div>
            <div className="text-destructive font-semibold mt-1 mb-1">✗ Must Reject:</div>
            <div className="ml-2 space-y-0.5">
              <div>• Invalid HMAC signature rejected</div>
              <div>• Replay detected (duplicate requestId or previewHash) rejected</div>
              <div>• CLICK command rejected (forbidden write operation)</div>
              <div>• TYPE command rejected (forbidden write operation)</div>
              <div>• HIGH risk tier rejected</div>
              <div>• CRITICAL risk tier rejected</div>
              <div>• Suspicious URL path rejected</div>
              <div>• Non-allowlisted domain rejected</div>
            </div>
            <div className="text-slate-400 font-semibold mt-1 mb-1">⚠️ Constraints:</div>
            <div className="ml-2 space-y-0.5">
              <div>• OpenClaw not called (dry-run preview only)</div>
              <div>• executionStatus remains PREVIEW_ONLY or REJECTED_NOT_EXECUTED</div>
              <div>• No mutations to external systems</div>
              <div>• No browser automation triggered</div>
            </div>
          </div>
        </div>

        {/* Phase 5 Roadmap */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Phase 5 Implementation Roadmap (Future)</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-2 text-[8px]">
            <div>
              <div className="font-semibold text-amber-600 mb-0.5">Phase 5A: Dry-Run Bridge Route</div>
              <div className="text-slate-400">Create POST /api/openclaw/bridge/dryrun endpoint. Verify all Phase 1-4 checks. Create execution preview record. Return preview summary. No OpenClaw gateway call.</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600 mb-0.5">Phase 5B: Dry-Run Audit Trail</div>
              <div className="text-slate-400">Implement OpenClawBridgeDryRunAudit entity. Log all dry-run attempts (accepted & rejected). Track which phases rejected requests. Preserve full audit chain.</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600 mb-0.5">Phase 5C: Preview UI Component</div>
              <div className="text-slate-400">Create frontend component to display dry-run preview. Show what would happen if request were executed. No actual execution. Read-only display.</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600 mb-0.5">Phase 5D: Test Suite</div>
              <div className="text-slate-400">Implement Phase 5 test cases covering all acceptance & rejection scenarios. Verify preview creation. Verify OpenClaw is not called. Deterministic tests only.</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600 mb-0.5">Phase 5E: Stabilization & Lock</div>
              <div className="text-slate-400">Comprehensive audit before enabling OpenClaw connection. Ensure all earlier phases remain locked. Lock Phase 5 before Phase 6. Document all constraints.</div>
            </div>
          </div>
        </div>

        {/* Prerequisites Before Phase 6 */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Prerequisites Before Phase 6 (Live OpenClaw)</div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 space-y-1 text-[8px] text-amber-600">
            <div>→ Phase 5 must be LOCKED with all tests passing</div>
            <div>→ Dry-run bridge must reliably reject invalid requests</div>
            <div>→ Dry-run bridge must never call OpenClaw live endpoint</div>
            <div>→ All audit trails must be comprehensive and immutable</div>
            <div>→ OpenClaw node connectivity must be verified (Phase 6 prerequisite)</div>
            <div>→ Operator training and runbooks must be complete</div>
            <div>→ Emergency kill switch procedures must be documented</div>
            <div>→ 14-day observation period on dry-run bridge required before Phase 6 approval</div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="border border-amber-500/20 bg-amber-500/10 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Current Status</div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">PLAN_ONLY</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">NOT_IMPLEMENTED</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">OPENCLAW_NOT_CONNECTED</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">EXECUTION_DISABLED</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">PHASE_4_LOCKED</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Next Steps</div>
          <div className="text-[8px] text-blue-600/80 space-y-0.5">
            <div>1. Phase 4E audit LOCKED ✓ (current status)</div>
            <div>2. Phase 5 planning defined (this document)</div>
            <div>3. Phase 5A implementation to begin after Phase 4 stabilization</div>
            <div>4. Phase 5B-D follow after 5A approval</div>
            <div>5. Phase 5E lock before Phase 6 gateway connection</div>
          </div>
        </div>
      </div>
    </div>
  );
}