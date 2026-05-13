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