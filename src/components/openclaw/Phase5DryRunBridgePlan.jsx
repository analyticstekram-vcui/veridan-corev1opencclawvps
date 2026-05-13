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

        {/* Phase 5A Dry-Run Bridge Route Spec */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Phase 5A: Dry-Run Bridge Route Spec</div>
          <div className="bg-card/50 border border-border/30 rounded-lg overflow-hidden">
            {/* Route Definition */}
            <div className="px-3 py-2 border-b border-border/20 space-y-2">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider">Route Definition</div>
              <div className="bg-secondary/30 rounded px-2 py-1.5 font-mono text-[8px] text-slate-400">
                POST /api/openclaw/bridge/dry-run
              </div>
              <div className="text-[8px] text-slate-400">
                Future route to create dry-run execution preview. Validates all earlier phases. Creates audit record. Does not call OpenClaw.
              </div>
            </div>

            {/* Purpose */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Purpose</div>
              <div className="text-[8px] text-slate-400 space-y-0.5">
                <div>• Accept a signed bridge request (HMAC verified)</div>
                <div>• Re-run Phase 1 contract validation</div>
                <div>• Re-run Phase 2 policy gate & replay protection</div>
                <div>• Re-run Phase 4 HMAC signature verification</div>
                <div>• Create dry-run bridge preview record</div>
                <div>• Return PREVIEW_ONLY status</div>
                <div>• Do NOT call OpenClaw gateway</div>
                <div>• Do NOT execute browser or API actions</div>
              </div>
            </div>

            {/* Request Body */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Required Request Body Fields</div>
              <div className="bg-secondary/30 rounded px-2 py-1.5 font-mono text-[8px] text-slate-400">
                <div>{`{
  signedRequest: {...},    // Signed bridge request (from Phase 4)
  operatorId: string,      // Email of operator
  submittedAt: ISO         // Submission timestamp
}`}</div>
              </div>
            </div>

            {/* Required Validations */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Required Validations (19 items)</div>
              <div className="text-[8px] text-slate-400 space-y-0.5">
                <div className="text-amber-600 font-semibold">Body-Level:</div>
                <div className="ml-2">• Body exists</div>
                <div className="ml-2">• signedRequest exists</div>
                <div className="ml-2">• operatorId exists</div>
                <div className="ml-2">• submittedAt exists</div>
                <div className="text-amber-600 font-semibold mt-1">Phase 4 Signature:</div>
                <div className="ml-2">• HMAC signature valid (timing-safe comparison)</div>
                <div className="ml-2">• signedAt is fresh (≤ 5 min old)</div>
                <div className="ml-2">• signedAt not in future (&gt; 60 sec)</div>
                <div className="ml-2">• signingVersion OPENCLAW_BRIDGE_V1</div>
                <div className="text-amber-600 font-semibold mt-1">Phase 2 Protection:</div>
                <div className="ml-2">• Request not replayed (no duplicate requestId)</div>
                <div className="ml-2">• Request not replayed (no duplicate previewHash)</div>
                <div className="ml-2">• Policy gate passes (no forbidden commands)</div>
                <div className="text-amber-600 font-semibold mt-1">Phase 1 Contract:</div>
                <div className="ml-2">• commandType in [READ, NAVIGATE, EXTRACT, VERIFY]</div>
                <div className="ml-2">• riskTier in [LOW, MEDIUM]</div>
                <div className="ml-2">• targetUrl HTTPS & allowlisted</div>
                <div className="ml-2">• targetUrl contains no suspicious keywords</div>
                <div className="ml-2">• dryRun true, liveExecution false</div>
                <div className="ml-2">• governanceMode SAFE_REQUIRES_APPROVAL</div>
                <div className="ml-2">• approvalStatus APPROVED, validationResult PASS</div>
                <div className="ml-2">• executionEligibility ELIGIBLE_PREVIEW</div>
              </div>
            </div>

            {/* Response: Accepted */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Response if Accepted</div>
              <div className="bg-secondary/30 rounded px-2 py-1.5 font-mono text-[8px] text-slate-400">
                <div>{`{
  acceptedForDryRun: true,
  rejectedReason: null,
  dryRunId: string,
  requestId: string,
  bridgeMode: "OPENCLAW_DRY_RUN_PREVIEW",
  executionStatus: "PREVIEW_ONLY",
  note: "Dry-run bridge preview created. No OpenClaw action was executed."
}`}</div>
              </div>
            </div>

            {/* Response: Rejected */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Response if Rejected</div>
              <div className="bg-secondary/30 rounded px-2 py-1.5 font-mono text-[8px] text-slate-400">
                <div>{`{
  acceptedForDryRun: false,
  rejectedReason: string,     // Reason for rejection
  dryRunId: string,           // Audit ID
  requestId: string,          // If available
  bridgeMode: "OPENCLAW_DRY_RUN_PREVIEW",
  executionStatus: "REJECTED_NOT_EXECUTED",
  note: "Dry-run bridge request rejected. No OpenClaw action was executed."
}`}</div>
              </div>
            </div>

            {/* Audit Requirements */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Audit Record Requirements</div>
              <div className="text-[8px] text-slate-400 space-y-0.5">
                <div className="text-amber-600 font-semibold">Must Include:</div>
                <div className="ml-2">• dryRunAuditId (unique audit event ID)</div>
                <div className="ml-2">• requestId</div>
                <div className="ml-2">• proposalId</div>
                <div className="ml-2">• operatorId</div>
                <div className="ml-2">• acceptedForDryRun (boolean)</div>
                <div className="ml-2">• rejectedReason (if rejected)</div>
                <div className="ml-2">• hmacCheckResult</div>
                <div className="ml-2">• policyGateResult</div>
                <div className="ml-2">• replayCheckResult</div>
                <div className="ml-2">• executionStatus</div>
                <div className="text-destructive font-semibold mt-1">Must NOT Include:</div>
                <div className="ml-2">• OPENCLAW_BRIDGE_HMAC_SECRET</div>
                <div className="ml-2">• raw inputText (sensitive data)</div>
                <div className="ml-2">• computed HMAC internals</div>
              </div>
            </div>

            {/* Safety Constraints */}
            <div className="px-3 py-2">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Safety Constraints</div>
              <div className="text-[8px] text-slate-400 space-y-0.5">
                <div>✓ Do NOT call OpenClaw gateway (dry-run preview only)</div>
                <div>✓ Do NOT execute browser automation</div>
                <div>✓ Do NOT trigger API mutations</div>
                <div>✓ Do NOT place trading orders</div>
                <div>✓ executionStatus must be PREVIEW_ONLY or REJECTED_NOT_EXECUTED only</div>
                <div>✓ bridgeMode must be OPENCLAW_DRY_RUN_PREVIEW (never LIVE)</div>
                <div>✓ All earlier phases must be re-verified before accepting</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 5A Test Cases Spec */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Phase 5A: Dry-Run Bridge Route Test Cases Spec</div>
          <div className="bg-card/50 border border-border/30 rounded-lg overflow-hidden">
            {/* Test Overview */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Test Coverage Overview</div>
              <div className="text-[8px] text-slate-400">
                28 deterministic test cases covering acceptance, rejection, and safety scenarios. All tests are read-only. No OpenClaw calls. No execution.
              </div>
            </div>

            {/* Acceptance Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Acceptance Tests (2)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-amber-500 font-semibold">T1:</span>
                  <span> Valid signed READ request creates PREVIEW_ONLY dry-run record</span>
                </div>
                <div>
                  <span className="text-amber-500 font-semibold">T2:</span>
                  <span> Valid signed VERIFY request creates PREVIEW_ONLY dry-run record</span>
                </div>
              </div>
            </div>

            {/* Request Body Validation Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-destructive uppercase tracking-wider mb-1">Request Body Rejection Tests (3)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-destructive font-semibold">T3:</span>
                  <span> Missing signedRequest rejects with validation error</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T4:</span>
                  <span> Missing operatorId rejects with validation error</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T5:</span>
                  <span> Missing submittedAt rejects with validation error</span>
                </div>
              </div>
            </div>

            {/* Phase 4 Signature Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-destructive uppercase tracking-wider mb-1">Phase 4 Signature Rejection Tests (4)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-destructive font-semibold">T6:</span>
                  <span> Invalid HMAC signature rejects with HMAC_SIGNATURE_INVALID</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T7:</span>
                  <span> Stale signedAt (&gt; 5 min) rejects with SIGNED_AT_EXPIRED</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T8:</span>
                  <span> Future signedAt (&gt; 60 sec) rejects with SIGNED_AT_FUTURE</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T9:</span>
                  <span> Tampered payload (e.g., targetUrl changed) rejects with HMAC_SIGNATURE_INVALID</span>
                </div>
              </div>
            </div>

            {/* Phase 2 Protection Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-destructive uppercase tracking-wider mb-1">Phase 2 Protection Rejection Tests (2)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-destructive font-semibold">T10:</span>
                  <span> Replay requestId rejects with DUPLICATE_REQUEST_ID</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T11:</span>
                  <span> Replay previewHash rejects with DUPLICATE_PREVIEW_HASH</span>
                </div>
              </div>
            </div>

            {/* Phase 2 Policy Gate Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-destructive uppercase tracking-wider mb-1">Phase 2 Policy Gate Rejection Tests (4)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-destructive font-semibold">T12:</span>
                  <span> CLICK command rejects (write operation forbidden)</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T13:</span>
                  <span> TYPE command rejects (keyboard input forbidden)</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T14:</span>
                  <span> HIGH risk tier rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T15:</span>
                  <span> CRITICAL risk tier rejects</span>
                </div>
              </div>
            </div>

            {/* Phase 1 Contract Validation Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-destructive uppercase tracking-wider mb-1">Phase 1 Contract Validation Rejection Tests (9)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-destructive font-semibold">T16:</span>
                  <span> Non-allowlisted domain rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T17:</span>
                  <span> Suspicious URL path keyword rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T18:</span>
                  <span> liveExecution true rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T19:</span>
                  <span> dryRun false rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T20:</span>
                  <span> governanceMode != SAFE_REQUIRES_APPROVAL rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T21:</span>
                  <span> approvalStatus != APPROVED rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T22:</span>
                  <span> validationResult != PASS rejects</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">T23:</span>
                  <span> executionEligibility != ELIGIBLE_PREVIEW rejects</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Tests */}
            <div className="px-3 py-2 border-b border-border/20">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Audit Trail Tests (3)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-amber-500 font-semibold">T24:</span>
                  <span> Dry-run audit record created for accepted request (dryRunAuditId, requestId, acceptedForDryRun: true)</span>
                </div>
                <div>
                  <span className="text-amber-500 font-semibold">T25:</span>
                  <span> Dry-run audit record created for rejected request (dryRunAuditId, requestId, rejectedReason)</span>
                </div>
                <div>
                  <span className="text-amber-500 font-semibold">T26:</span>
                  <span> Audit record excludes secret, raw inputText, HMAC internals (secretExposed: false)</span>
                </div>
              </div>
            </div>

            {/* Safety Constraint Tests */}
            <div className="px-3 py-2">
              <div className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Safety Constraint Tests (3)</div>
              <div className="text-[8px] text-slate-400 space-y-1">
                <div>
                  <span className="text-amber-500 font-semibold">T27:</span>
                  <span> No OpenClaw call occurs (verified in function logs)</span>
                </div>
                <div>
                  <span className="text-amber-500 font-semibold">T28:</span>
                  <span> No browser/API/trading execution occurs (no side effects)</span>
                </div>
                <div>
                  <span className="text-amber-500 font-semibold">T29:</span>
                  <span> executionStatus is PREVIEW_ONLY (accepted) or REJECTED_NOT_EXECUTED (rejected) only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Case Template */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Test Case Template</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2">
            <div className="bg-secondary/30 rounded px-2 py-1.5 font-mono text-[8px] text-slate-400">
              <div>{`{
  testId: "T1",
  testName: "Valid signed READ request creates PREVIEW_ONLY dry-run record",
  category: "ACCEPTANCE|REJECTION|SAFETY",
  expectedOutcome: "ACCEPTED|REJECTED",
  expectedRejectedReason: string or null,
  executionExpected: false   // Always false - no execution in Phase 5A
}`}</div>
            </div>
          </div>
        </div>

        {/* Test Execution Rules */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Test Execution Rules</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 text-[8px] text-slate-400 space-y-0.5">
            <div>• All tests are deterministic (no randomness)</div>
            <div>• All tests are read-only (no database mutations beyond audit)</div>
            <div>• All tests have executionExpected: false</div>
            <div>• Tests must run against test HMAC secret only</div>
            <div>• Tests must NOT call real OpenClaw gateway</div>
            <div>• Tests must NOT create real browser sessions</div>
            <div>• Tests must validate all rejection reasons exactly</div>
            <div>• Test suite must pass 100% before Phase 5A goes live</div>
          </div>
        </div>

        {/* Test Coverage Summary */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Test Coverage Summary</div>
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 text-[8px] text-slate-400 space-y-0.5">
            <div>Total test cases: 29</div>
            <div>Acceptance tests: 2 (happy path)</div>
            <div>Request body rejection: 3 tests</div>
            <div>Phase 4 signature rejection: 4 tests</div>
            <div>Phase 2 protection rejection: 2 tests</div>
            <div>Phase 2 policy gate rejection: 4 tests</div>
            <div>Phase 1 contract rejection: 9 tests</div>
            <div>Audit trail tests: 3 tests</div>
            <div>Safety constraint tests: 3 tests</div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="border border-amber-500/20 bg-amber-500/10 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Phase 5A Test Status</div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">SPEC_DEFINED</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">TESTS_NOT_IMPLEMENTED</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">OPENCLAW_NOT_CONNECTED</span>
            <span className="text-[7px] font-semibold text-amber-600 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">EXECUTION_DISABLED</span>
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