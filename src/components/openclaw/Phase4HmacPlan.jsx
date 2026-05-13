import React from 'react';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Phase4HmacPlan() {
  return (
    <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-500/20">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-[10px] font-semibold text-slate-400">Phase 4: Real HMAC Validation Plan</div>
            <div className="text-[9px] text-slate-500 mt-1">Future plan to replace MOCK_SIGNATURE_VALIDATION with REAL_HMAC_VALIDATION using server-side secrets.</div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-slate-400" />
            <span className="text-[8px] font-semibold text-slate-400">PLAN_ONLY</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-3">
        {/* Purpose */}
        <div className="space-y-2">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Purpose</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <p>Replace MOCK_SIGNATURE_VALIDATION with REAL_HMAC_VALIDATION using a server-side secret.</p>
            <p>Frontend submits pre-signed payloads. Backend verifies HMAC-SHA256 authenticity using OPENCLAW_BRIDGE_HMAC_SECRET.</p>
            <p>Ensures request tampering is detected and rejected at validation gate.</p>
          </div>
        </div>

        {/* Required Future Secret */}
        <div className="space-y-2 bg-card/50 border border-border/30 px-3 py-2 rounded">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Required Future Secret</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <div className="font-mono text-foreground text-[8px]">OPENCLAW_BRIDGE_HMAC_SECRET</div>
            <div className="text-[8px] text-slate-500">
              • Stored server-side only (environment variable, not in code)<br/>
              • Never exposed to frontend or client<br/>
              • Never saved in localStorage or local state<br/>
              • Never included in audit records or logs<br/>
              • Rotated periodically per security policy
            </div>
          </div>
        </div>

        {/* Future Signing Model */}
        <div className="space-y-2 bg-card/50 border border-border/30 px-3 py-2 rounded">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Future Signing Model</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <div className="text-foreground font-semibold mb-1">❌ What Frontend Should NOT Do:</div>
            <div className="text-[8px] text-slate-500 ml-3">
              • Do not generate real HMAC signatures in browser code<br/>
              • Do not embed OPENCLAW_BRIDGE_HMAC_SECRET in frontend<br/>
              • Do not compute HMAC-SHA256 with secret on client
            </div>
            <div className="text-foreground font-semibold mt-2 mb-1">✅ What Frontend SHOULD Do:</div>
            <div className="text-[8px] text-slate-500 ml-3">
              • Submit canonical payload to trusted backend signing endpoint<br/>
              • Backend creates HMAC signature using server-side secret<br/>
              • Backend returns signed payload to frontend<br/>
              • Frontend includes signature in bridge request to validation endpoint
            </div>
          </div>
        </div>

        {/* Future Verification Model */}
        <div className="space-y-2 bg-card/50 border border-border/30 px-3 py-2 rounded">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Future Verification Model</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <div className="text-[8px] text-slate-500">
              1. Backend receives bridge request with signature<br/>
              2. Backend rebuilds exact canonical payload (same field order)<br/>
              3. Backend computes HMAC-SHA256(canonical, OPENCLAW_BRIDGE_HMAC_SECRET)<br/>
              4. Backend uses timing-safe comparison (not ===) to verify signature<br/>
              5. Backend rejects if missing, invalid, stale, or future-dated<br/>
              6. Only PASS signatures proceed to Phase 1 contract validation
            </div>
          </div>
        </div>

        {/* Required Safeguards */}
        <div className="space-y-2 bg-card/50 border border-border/30 px-3 py-2 rounded">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Required Safeguards (Unchanged from Phase 3)</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <div className="text-[8px] text-slate-500">
              • signedAt freshness window: 5 minutes past only<br/>
              • signedAt future tolerance: 60 seconds max<br/>
              • signingVersion: exactly "OPENCLAW_BRIDGE_V1"<br/>
              • Canonical payload field order: immutable<br/>
              • Phase 1, 2, 3 validation checks: active and enforced<br/>
              • Timing-safe comparison: required for HMAC verification<br/>
              • No OpenClaw calls during validation (dry-run only)
            </div>
          </div>
        </div>

        {/* Implementation Phases */}
        <div className="space-y-2 bg-card/50 border border-border/30 px-3 py-2 rounded">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Implementation Phases</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <div className="text-[8px] text-slate-500">
              <div className="font-semibold text-foreground mb-1">Phase 4A: Secret Configuration Check</div>
              Backend verifies OPENCLAW_BRIDGE_HMAC_SECRET is configured and non-empty. Returns standardized failure response if missing.<br/><br/>
              <div className="font-semibold text-foreground mb-1">Phase 4B: Add HMAC Verifier</div>
              Add real HMAC-SHA256 verifier to openclawBridgePreview dry-run route. Keep signatureMode as REAL_HMAC_VALIDATION flag. Still rejects gracefully without execution.<br/><br/>
              <div className="font-semibold text-foreground mb-1">Phase 4C: Backend Signer Endpoint</div>
              Create /api/openclaw/sign backend route. Frontend submits canonical payload. Backend returns signed version using secret.<br/><br/>
              <div className="font-semibold text-foreground mb-1">Phase 4D: Deterministic Test Cases</div>
              Add Phase 4 test suite: valid HMAC, invalid HMAC, stale signedAt with HMAC, future signedAt with HMAC, etc.<br/><br/>
              <div className="font-semibold text-foreground mb-1">Phase 4E: Stabilize and Lock</div>
              Comprehensive audit. Update Phase 3 SignatureGenerator component to use signer endpoint. Lock Phase 4 before Phase 5.
            </div>
          </div>
        </div>

        {/* Phase 4A Secret Configuration Check Spec */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-500/20 bg-slate-500/10">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="text-[9px] font-semibold text-slate-400">Phase 4A: Secret Configuration Check Spec</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Future backend check: verify OPENCLAW_BRIDGE_HMAC_SECRET is configured before HMAC verification.</div>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                <span className="text-[7px] font-semibold text-slate-400">SPEC_ONLY</span>
              </div>
            </div>
          </div>
          
          <div className="px-3 py-2 space-y-2">
            {/* Server-Side Configuration Check */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Server-Side Configuration Check</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>1. Backend loads OPENCLAW_BRIDGE_HMAC_SECRET from environment (startup or request time)</div>
                <div>2. If env var exists and non-empty → proceed to HMAC verification logic</div>
                <div>3. If env var missing or empty → return standardized failure response (see below)</div>
                <div>4. Never expose or return secret value to client in any response</div>
                <div>5. Never log or include secret in audit records</div>
              </div>
            </div>

            {/* Missing Secret Failure Response */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Missing Secret Failure Response</div>
              <div className="text-[8px] text-slate-500 font-mono space-y-0.5">
                <div className="bg-secondary/30 px-1.5 py-1 rounded mt-1">
                  {`{
  "accepted": false,
  "rejectedReason": "HMAC_SECRET_NOT_CONFIGURED",
  "bridgeMode": "DRY_RUN_ONLY",
  "executionStatus": "REJECTED_NOT_EXECUTED",
  "signatureMode": "REAL_HMAC_VALIDATION",
  "note": "HMAC secret missing. No OpenClaw call was made."
}`}
                </div>
              </div>
            </div>

            {/* Secret Safeguards */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Secret Safeguards</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>✓ Secret never returned in HTTP response</div>
                <div>✓ Secret never included in audit trail records</div>
                <div>✓ Secret never logged to console or error messages</div>
                <div>✓ Secret stored only in environment variables (not hardcoded)</div>
                <div>✓ Secret never stored in frontend localStorage</div>
                <div>✓ Secret access is read-only (no modification endpoints)</div>
              </div>
            </div>

            {/* Configuration Checklist */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Configuration Checklist</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">☐</span>
                  <span>Environment variable name defined: OPENCLAW_BRIDGE_HMAC_SECRET</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">☐</span>
                  <span>Backend checks env var on startup or per-request</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">☐</span>
                  <span>Missing secret returns standardized rejection response</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">☐</span>
                  <span>Audit logs redact/exclude secret value entirely</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">☐</span>
                  <span>No execution enabled if secret check fails</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">☐</span>
                  <span>Phase 4B (HMAC verifier) blocks until secret is present</span>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Phase 4A Status</div>
              <div className="flex flex-wrap gap-1">
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SPEC_ONLY
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SECRET_NOT_CREATED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  HMAC_NOT_IMPLEMENTED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  EXECUTION_DISABLED
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-[8px] text-slate-500 border-t border-slate-500/20 pt-1.5 mt-1.5">
              Phase 4A defines the safety mechanism for detecting missing secrets. If OPENCLAW_BRIDGE_HMAC_SECRET is not configured, all HMAC-signed requests are rejected without calling OpenClaw. No execution, no mutation, no action. Fails safely and logs audit trail.
            </div>
          </div>
        </div>

        {/* Phase 4B HMAC Verifier Spec */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-500/20 bg-slate-500/10">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="text-[9px] font-semibold text-slate-400">Phase 4B: HMAC Verifier Spec</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Future backend HMAC-SHA256 signature verification logic. Compares submitted signature against computed canonical payload.</div>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                <span className="text-[7px] font-semibold text-slate-400">SPEC_ONLY</span>
              </div>
            </div>
          </div>
          
          <div className="px-3 py-2 space-y-2">
            {/* Canonical Payload Reconstruction */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Canonical Payload Reconstruction</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div className="font-mono text-slate-400 text-[7px] space-y-0.5">
                  <div>requestId | proposalId | previewHash | operatorId | submittedAt | signedAt | commandType | targetUrl | riskTier | governanceMode | dryRun | liveExecution</div>
                </div>
                <div className="text-[8px] text-slate-500 mt-1">
                  Backend must rebuild exact canonical payload in this field order. Any reordering will break signature verification. Phase 3 order is now immutable.
                </div>
              </div>
            </div>

            {/* HMAC Computation */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">HMAC Computation</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>Algorithm: HMAC-SHA256</div>
                <div>Key source: OPENCLAW_BRIDGE_HMAC_SECRET (environment variable)</div>
                <div>Message: canonical payload string (pipe-delimited)</div>
                <div>Output format: hexadecimal (lowercase)</div>
                <div className="text-[7px] text-slate-500 mt-1">Pseudocode: signature = hex(HMAC-SHA256(canonical, secret))</div>
              </div>
            </div>

            {/* Signature Comparison */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Signature Comparison</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>1. Extract submitted signature from request body</div>
                <div>2. Compute expected signature using canonical payload + secret</div>
                <div>3. Use timing-safe comparison (e.g., crypto.timingSafeEqual or equivalent)</div>
                <div>4. Do NOT use === or simple string equality</div>
                <div>5. Reject if mismatch detected</div>
                <div className="text-[7px] text-slate-500 mt-1">Timing-safe comparison prevents timing attacks that could leak signature bytes.</div>
              </div>
            </div>

            {/* Validation Sequence */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Validation Sequence</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>1. Check HMAC secret is configured (Phase 4A)</div>
                <div>2. Check signature field exists</div>
                <div>3. Check signingVersion == OPENCLAW_BRIDGE_V1</div>
                <div>4. Check signedAt is valid ISO timestamp</div>
                <div>5. Check signedAt ≤ now (not in future, &gt;60 sec)</div>
                <div>6. Check signedAt ≥ now - 5 minutes (not expired)</div>
                <div>7. Rebuild canonical payload</div>
                <div>8. Compute HMAC-SHA256</div>
                <div>9. Timing-safe comparison of signatures</div>
                <div>10. If all pass → proceed to Phase 1 validation</div>
              </div>
            </div>

            {/* Rejection Reasons */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Rejection Reasons</div>
              <div className="text-[8px] text-slate-500 font-mono space-y-0.5">
                <div className="text-slate-400">HMAC_SECRET_NOT_CONFIGURED</div>
                <div className="text-slate-400">SIGNATURE_MISSING</div>
                <div className="text-slate-400">SIGNING_VERSION_INVALID</div>
                <div className="text-slate-400">SIGNED_AT_INVALID</div>
                <div className="text-slate-400">SIGNED_AT_EXPIRED</div>
                <div className="text-slate-400">SIGNED_AT_FUTURE</div>
                <div className="text-slate-400">HMAC_SIGNATURE_INVALID</div>
              </div>
            </div>

            {/* Audit Record Requirements */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Audit Record Requirements</div>
              <div className="space-y-1">
                <div>
                  <div className="text-[8px] font-semibold text-slate-400 mb-0.5">✓ Must Include:</div>
                  <div className="text-[8px] text-slate-500 space-y-0.5">
                    <div>• signatureCheckResult (PASS or FAIL)</div>
                    <div>• signatureCheckMessages (array of reasons)</div>
                    <div>• signingVersion (e.g., OPENCLAW_BRIDGE_V1)</div>
                    <div>• signedAt (ISO timestamp)</div>
                    <div>• signaturePresent (boolean)</div>
                    <div>• signatureMode (REAL_HMAC_VALIDATION)</div>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-1">
                  <div className="text-[8px] font-semibold text-destructive mb-0.5">✗ Must NOT Include:</div>
                  <div className="text-[8px] text-slate-500 space-y-0.5">
                    <div>• OPENCLAW_BRIDGE_HMAC_SECRET (ever)</div>
                    <div>• raw inputText (sensitive data)</div>
                    <div>• computed HMAC signature (not useful for audit)</div>
                    <div>• any secret-derived material</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Phase 4B Status</div>
              <div className="flex flex-wrap gap-1">
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SPEC_ONLY
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  HMAC_NOT_IMPLEMENTED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SECRET_NOT_CREATED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  EXECUTION_DISABLED
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-[8px] text-slate-500 border-t border-slate-500/20 pt-1.5 mt-1.5">
              Phase 4B defines real HMAC verification logic. Canonical payload order is locked and immutable. Timing-safe comparison required. If verification fails, request is rejected without calling OpenClaw. No execution, no mutation, no action.
            </div>
          </div>
        </div>

        {/* Phase 4C Backend Signer Flow Spec */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-500/20 bg-slate-500/10">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="text-[9px] font-semibold text-slate-400">Phase 4C: Backend Signer Flow Spec</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Future server-side signing. Frontend never receives secret. Signatures generated only on backend.</div>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                <span className="text-[7px] font-semibold text-slate-400">SPEC_ONLY</span>
              </div>
            </div>
          </div>
          
          <div className="px-3 py-2 space-y-2">
            {/* Frontend Constraints */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Frontend Constraints</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div className="text-destructive font-semibold">✗ Frontend Must NOT:</div>
                <div className="ml-2">
                  <div>• Generate real HMAC signatures in browser code</div>
                  <div>• Receive OPENCLAW_BRIDGE_HMAC_SECRET</div>
                  <div>• Compute HMAC-SHA256 with secret</div>
                  <div>• Store secret in localStorage or session storage</div>
                  <div>• Attempt to derive or reverse-engineer secret</div>
                </div>
              </div>
            </div>

            {/* Signing Options */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Future Signing Options</div>
              <div className="space-y-1">
                <div>
                  <div className="text-[8px] font-semibold text-foreground mb-0.5">Option A: Server-Side Signer Endpoint</div>
                  <div className="text-[8px] text-slate-500 space-y-0.5 ml-2">
                    <div>Route: POST /api/openclaw/bridge/sign-preview</div>
                    <div>Input: unsigned bridge request preview (no signature)</div>
                    <div>Server validates proposal/request eligibility</div>
                    <div>Server adds signedAt, signingVersion, signature</div>
                    <div>Server returns signed request (without exposing secret)</div>
                    <div>Frontend includes signature in validation request</div>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-1">
                  <div className="text-[8px] font-semibold text-foreground mb-0.5">Option B: Server-Side Session Signer</div>
                  <div className="text-[8px] text-slate-500 space-y-0.5 ml-2">
                    <div>Authenticated operator session triggers signing</div>
                    <div>Server derives operator identity from session token</div>
                    <div>Server only signs eligible requests</div>
                    <div>No standalone secret leaves server boundary</div>
                    <div>Signing tied to operator authentication lifecycle</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signer Safeguards */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Signer Safeguards</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div className="font-semibold text-foreground mb-0.5">✓ Only sign if:</div>
                <div className="ml-2">
                  <div>• Request passes Phase 1 contract validation</div>
                  <div>• Request passes Phase 2 policy gating</div>
                  <div>• dryRun === true (always)</div>
                  <div>• liveExecution === false (always)</div>
                  <div>• riskTier is LOW or MEDIUM only</div>
                  <div>• commandType is READ, NAVIGATE, EXTRACT, VERIFY only</div>
                  <div>• Proposal is not expired</div>
                  <div>• Domain is allowlisted</div>
                  <div>• URL path contains no suspicious keywords</div>
                </div>
                <div className="font-semibold text-destructive mt-1 mb-0.5">✗ Never sign:</div>
                <div className="ml-2">
                  <div>• CLICK or TYPE commands (write operations)</div>
                  <div>• HIGH or CRITICAL risk requests</div>
                  <div>• Expired proposals</div>
                  <div>• Non-allowlisted domains</div>
                  <div>• Paths with suspicious keywords</div>
                  <div>• Requests that fail any earlier validation phase</div>
                </div>
              </div>
            </div>

            {/* Signing Audit Trail */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Signing Audit Trail Requirements</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div className="font-semibold text-foreground mb-0.5">✓ Must Include:</div>
                <div className="ml-2">
                  <div>• signerAuditId (unique signing event ID)</div>
                  <div>• requestId (request being signed)</div>
                  <div>• proposalId (proposal being signed)</div>
                  <div>• operatorId (who requested signing)</div>
                  <div>• signingAllowed (true or false)</div>
                  <div>• rejectedReason (if not signed)</div>
                  <div>• signingVersion (OPENCLAW_BRIDGE_V1)</div>
                  <div>• signatureMode (REAL_HMAC_VALIDATION)</div>
                  <div>• signedAt (ISO timestamp of signing)</div>
                  <div>• createdAt (audit record timestamp)</div>
                  <div>• note: "Signing only. No OpenClaw call was made."</div>
                </div>
                <div className="font-semibold text-destructive mt-1 mb-0.5">✗ Must NOT Include:</div>
                <div className="ml-2">
                  <div>• OPENCLAW_BRIDGE_HMAC_SECRET (ever)</div>
                  <div>• raw inputText (sensitive data)</div>
                  <div>• computed HMAC signature (not useful for audit)</div>
                  <div>• any secret-derived material</div>
                </div>
              </div>
            </div>

            {/* Signer Constraints */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Signer Operational Constraints</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>• Server validates request eligibility before signing</div>
                <div>• Server rejects ineligible requests without creating signature</div>
                <div>• Server logs every signing attempt (approved or rejected)</div>
                <div>• Server does NOT call OpenClaw during signing</div>
                <div>• Server does NOT execute any actions during signing</div>
                <div>• Signing is read-only operation only</div>
                <div>• Signature generation uses HMAC-SHA256</div>
                <div>• Canonical payload order is immutable</div>
                <div>• signedAt is current server time (not client time)</div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Phase 4C Status</div>
              <div className="flex flex-wrap gap-1">
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SPEC_ONLY
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SIGNER_NOT_IMPLEMENTED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SECRET_NOT_CREATED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  EXECUTION_DISABLED
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-[8px] text-slate-500 border-t border-slate-500/20 pt-1.5 mt-1.5">
              Phase 4C defines server-side signing only. Frontend never receives or computes real signatures. All signing happens on backend with full access to secret. Signing validates request eligibility but does not call OpenClaw.
            </div>
          </div>
        </div>

        {/* Phase 4D HMAC Test Cases Spec */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-500/20 bg-slate-500/10">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="text-[9px] font-semibold text-slate-400">Phase 4D: HMAC Test Cases Spec</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Future deterministic test coverage for verifier and signer. All tests are read-only, no execution.</div>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                <span className="text-[7px] font-semibold text-slate-400">SPEC_ONLY</span>
              </div>
            </div>
          </div>
          
          <div className="px-3 py-2 space-y-2">
            {/* Verifier Test Cases */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Verifier Test Cases (9 tests)</div>
              <div className="text-[8px] text-slate-500 font-mono space-y-0.5">
                <div className="text-slate-400">1. Missing HMAC_SECRET_NOT_CONFIGURED</div>
                <div className="text-slate-400">2. Missing signature → SIGNATURE_MISSING</div>
                <div className="text-slate-400">3. Wrong signingVersion → SIGNING_VERSION_INVALID</div>
                <div className="text-slate-400">4. signedAt &gt; 5 minutes old → SIGNED_AT_EXPIRED</div>
                <div className="text-slate-400">5. signedAt &gt; 60 sec future → SIGNED_AT_FUTURE</div>
                <div className="text-slate-400">6. Invalid HMAC signature → HMAC_SIGNATURE_INVALID</div>
                <div className="text-slate-400">7. Tampered targetUrl → HMAC_SIGNATURE_INVALID</div>
                <div className="text-slate-400">8. Tampered riskTier → HMAC_SIGNATURE_INVALID</div>
                <div className="text-slate-400">9. Valid signature + canonical payload → PASS</div>
              </div>
            </div>

            {/* Signer Test Cases */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Signer Test Cases (12 tests)</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div className="text-foreground font-semibold mb-0.5">✓ Can Sign:</div>
                <div className="ml-2">
                  <div>1. LOW READ request → SIGNED</div>
                  <div>2. MEDIUM VERIFY request → SIGNED</div>
                </div>
                <div className="text-destructive font-semibold mt-1 mb-0.5">✗ Cannot Sign:</div>
                <div className="ml-2">
                  <div>3. CLICK command → REJECTED_WRITE_OPERATION</div>
                  <div>4. TYPE command → REJECTED_WRITE_OPERATION</div>
                  <div>5. HIGH risk → REJECTED_RISK_TIER</div>
                  <div>6. CRITICAL risk → REJECTED_RISK_TIER</div>
                  <div>7. Expired proposal → REJECTED_EXPIRED</div>
                  <div>8. Non-allowlisted domain → REJECTED_DOMAIN_NOT_ALLOWLISTED</div>
                  <div>9. Suspicious path keyword → REJECTED_SUSPICIOUS_PATH</div>
                </div>
                <div className="text-slate-400 font-semibold mt-1 mb-0.5">Audit & Safety:</div>
                <div className="ml-2">
                  <div>10. Signing attempt creates signer audit record</div>
                  <div>11. Signing does NOT call OpenClaw</div>
                  <div>12. Signing does NOT store raw inputText</div>
                </div>
              </div>
            </div>

            {/* Test Case Template */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Test Case Template</div>
              <div className="text-[8px] text-slate-500 font-mono space-y-0.5">
                <div className="bg-secondary/30 px-1.5 py-1 rounded">
                  {`{
  testName: "string",
  category: "VERIFIER|SIGNER",
  inputCondition: "string",
  expectedOutcome: "PASS|REJECTED",
  expectedRejectionReason: "string or null",
  executionExpected: false
}`}
                </div>
              </div>
            </div>

            {/* Test Execution Rules */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Test Execution Rules</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>• All tests are deterministic (no randomness)</div>
                <div>• All tests are read-only (no state mutation)</div>
                <div>• All tests have executionExpected: false</div>
                <div>• Tests should run against mock/test HMAC secret only</div>
                <div>• Tests must not call real OpenClaw gateway</div>
                <div>• Tests must not create real proposals or requests</div>
                <div>• Tests must clean up audit records after execution</div>
                <div>• Tests should validate all rejection reasons exactly</div>
              </div>
            </div>

            {/* Test Coverage Summary */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Test Coverage Summary</div>
              <div className="text-[8px] text-slate-500 space-y-0.5">
                <div>Verifier tests: 9 (all rejection paths + happy path)</div>
                <div>Signer tests: 12 (safeguards + eligibility checks)</div>
                <div>Total coverage: 21 deterministic test cases</div>
                <div className="mt-1">Coverage areas:</div>
                <div className="ml-2">
                  <div>• Secret configuration (1 test)</div>
                  <div>• Signature validation (5 tests)</div>
                  <div>• Payload tampering detection (2 tests)</div>
                  <div>• Timestamp validation (2 tests)</div>
                  <div>• Request eligibility (7 tests)</div>
                  <div>• Audit trail (2 tests)</div>
                  <div>• Safety constraints (1 test)</div>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-1.5 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Phase 4D Status</div>
              <div className="flex flex-wrap gap-1">
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  SPEC_ONLY
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  TESTS_NOT_IMPLEMENTED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  HMAC_NOT_IMPLEMENTED
                </div>
                <div className="px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-semibold text-slate-400">
                  EXECUTION_DISABLED
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-[8px] text-slate-500 border-t border-slate-500/20 pt-1.5 mt-1.5">
              Phase 4D defines 21 deterministic test cases covering verifier and signer. All tests are read-only. No execution, no OpenClaw calls, no secret exposure. Test suite validates all rejection paths and happy path scenarios.
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="border border-destructive/20 bg-destructive/5 rounded px-3 py-2 space-y-1">
          <div className="text-[9px] font-semibold text-destructive uppercase tracking-wider">Critical Warnings</div>
          <div className="text-[8px] text-destructive/80 space-y-0.5">
            <div>⚠️ Do not store OPENCLAW_BRIDGE_HMAC_SECRET in frontend code.</div>
            <div>⚠️ Do not store OPENCLAW_BRIDGE_HMAC_SECRET in localStorage.</div>
            <div>⚠️ Do not include OPENCLAW_BRIDGE_HMAC_SECRET in audit records or logs.</div>
            <div>⚠️ Phase 4 still does not enable OpenClaw execution. Dry-run only.</div>
            <div>⚠️ Use timing-safe comparison for HMAC verification (not simple === operator).</div>
            <div>⚠️ Canonical payload field order must never change after Phase 3 is locked.</div>
          </div>
        </div>

        {/* Status */}
        <div className="border border-slate-500/20 bg-slate-500/10 rounded px-3 py-2 space-y-1">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
          <div className="text-[9px] text-slate-400 space-y-0.5">
            <div>🔒 PLAN_ONLY — No implementation started</div>
            <div>🔒 HMAC_NOT_IMPLEMENTED — Mock validation active through Phase 3</div>
            <div>🔒 EXECUTION_DISABLED — No OpenClaw calls authorized</div>
            <div>🔒 BLOCKED_UNTIL_PHASE_3_APPROVAL — Phase 3 must be stable first</div>
          </div>
        </div>
      </div>
    </div>
  );
}