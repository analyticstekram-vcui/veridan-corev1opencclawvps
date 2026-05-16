/**
 * SignedBridgeRequestPreview
 * Generates a local signed-request preview after a dry run passes.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw calls
 *   - No browser tools
 *   - No command execution
 *   - No ExecutionQueue records
 *   - No OpenClawCommand records
 *   - Execution: DISABLED
 *   - Gateway Mode: READ_ONLY
 *   - allowedForDispatch: false — NEVER dispatchable
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, RefreshCw, KeyRound, ShieldCheck, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { appendAudit } from '@/lib/proposalStore';

const SIGNED_KEY = 'vc_signed_bridge_previews';

// ── localStorage helpers ───────────────────────────────────────────────────────
export function loadSignedPreviews() {
  try { return JSON.parse(localStorage.getItem(SIGNED_KEY) || '[]'); } catch { return []; }
}
function saveSignedPreview(preview) {
  const all = loadSignedPreviews();
  all.unshift(preview);
  localStorage.setItem(SIGNED_KEY, JSON.stringify(all.slice(0, 200)));
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validateForSignedPreview(run, packet) {
  const failures = [];
  if (!['LOW', 'MEDIUM'].includes(packet?.riskTier))             failures.push(`riskTier must be LOW or MEDIUM, got "${packet?.riskTier}"`);
  if (run.dryRunStatus !== 'PASSED' && !run.acceptedForDryRun)   failures.push('dry run must have PASSED');
  if (run.policyGateResult !== 'PASS')                            failures.push('policyGateResult must be PASS');
  if (run.replayCheckResult !== 'PASS')                           failures.push('replayCheckResult must be PASS');
  if (run.signatureCheckResult !== 'PASS')                        failures.push('signatureCheckResult must be PASS');
  if (run.secretExposed !== false)                                failures.push('secretExposed must be false');
  if (run.executionStatus !== 'PREVIEW_ONLY')                     failures.push('executionStatus must be PREVIEW_ONLY');
  if (!run.persistedProposalId && !packet?.proposalId)            failures.push('proposalId is missing');
  if (!packet?.target && !packet?.url)                            failures.push('targetUrl is missing');
  return failures;
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyPreviewButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Signed Request Preview JSON'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SignedBridgeRequestPreview({ run, packet }) {
  const [generating, setGenerating] = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [failures,   setFailures]   = useState([]);

  const canGenerate = run.dryRunStatus === 'PASSED' || run.acceptedForDryRun === true;

  const handleGenerate = async () => {
    setGenerating(true);
    setPreview(null);
    setFailures([]);

    const validationFailures = validateForSignedPreview(run, packet);
    if (validationFailures.length > 0) {
      setFailures(validationFailures);
      setGenerating(false);
      return;
    }

    const operatorId = await base44.auth.me().then(u => u?.email || 'operator').catch(() => 'operator');
    const now        = new Date().toISOString();
    const expiresAt  = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const signedRequestId = 'sreq-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const replayNonce     = 'nonce-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const targetUrl       = packet?.target || packet?.url || '';

    const requestBodyPreview = {
      commandType:           packet?.commandType || run.commandType || '',
      targetUrl,
      riskTier:              packet?.riskTier || run.riskTier || '',
      safetyMode:            'PREVIEW_ONLY',
      gatewayMode:           'READ_ONLY',
      executionAttempted:    false,
      openclawCallAttempted: false,
      dryRunId:              run.dryRunId,
      proposalId:            run.proposalId,
      replayNonce,
    };
    const canonicalPayloadHash = 'sha256-placeholder-' + btoa(JSON.stringify(requestBodyPreview)).slice(0, 24);

    const signedPreview = {
      signedRequestId,
      dryRunId:              run.dryRunId,
      dryRunAuditId:         run.auditRecordId || null,
      proposalId:            run.proposalId,
      persistedProposalId:   run.persistedProposalId || null,
      packetId:              run.packetId,
      createdAt:             now,
      expiresAt,
      operatorId,
      commandType:           packet?.commandType || run.commandType || '',
      targetUrl,
      riskTier:              packet?.riskTier || run.riskTier || '',
      bridgeMode:            'SIGNED_REQUEST_PREVIEW_ONLY',
      gatewayMode:           'READ_ONLY',
      safetyMode:            'PREVIEW_ONLY',
      executionAttempted:    false,
      openclawCallAttempted: false,
      requestBodyPreview,
      canonicalPayloadHash,
      signaturePlaceholder:  'HMAC-SHA256-PLACEHOLDER-NOT-REAL',
      signatureStatus:       'PLACEHOLDER_ONLY',
      replayNonce,
      replayWindowSeconds:   300,
      allowedForDispatch:    false,
    };

    saveSignedPreview(signedPreview);

    appendAudit({
      event:          'signed_bridge_request_preview_created',
      signedRequestId,
      dryRunId:       run.dryRunId,
      proposalId:     run.proposalId,
      note:           `Signed request preview created (${signedRequestId}). Not dispatchable. No OpenClaw call. No execution.`,
    });

    setPreview(signedPreview);
    setGenerating(false);
  };

  if (!canGenerate) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Warning banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/30 rounded text-[8px] text-amber-500/90">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
        <span><span className="font-bold">Signed Bridge Request Preview only</span> — not dispatchable, not sent to OpenClaw.</span>
      </div>

      {/* Generate button */}
      {!preview && (
        <button type="button" onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors disabled:opacity-50">
          {generating
            ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating…</>
            : <><KeyRound className="w-3 h-3" /> Generate Signed Bridge Request Preview</>}
        </button>
      )}

      {/* Validation failures */}
      {failures.length > 0 && (
        <div className="px-2 py-2 bg-destructive/5 border border-destructive/20 rounded space-y-0.5">
          <div className="text-[7px] uppercase tracking-widest text-destructive font-semibold mb-1">Validation Failed</div>
          {failures.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[8px] text-destructive">
              <Ban className="w-2.5 h-2.5 shrink-0" /> {f}
            </div>
          ))}
        </div>
      )}

      {/* Preview result */}
      {preview && (
        <div className="bg-card border border-primary/20 rounded-lg px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Signed Request Preview Generated</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[8px] text-slate-500">
            <span>ID: <span className="text-slate-300 font-mono">{preview.signedRequestId}</span></span>
            <span>Dry Run ID: <span className="text-slate-300 font-mono">{preview.dryRunId}</span></span>
            <span>Bridge Mode: <span className="text-amber-500 font-semibold">{preview.bridgeMode}</span></span>
            <span>Signature Status: <span className="text-amber-500 font-semibold">{preview.signatureStatus}</span></span>
            <span>Allowed for Dispatch: <span className="text-destructive font-bold">{String(preview.allowedForDispatch)}</span></span>
            <span>Execution Attempted: <span className="text-destructive font-bold">{String(preview.executionAttempted)}</span></span>
            <span>Expires At: <span className="text-slate-300 font-mono text-[7px]">{new Date(preview.expiresAt).toLocaleTimeString()}</span></span>
            <span>Replay Window: <span className="text-slate-300">{preview.replayWindowSeconds}s</span></span>
            <span>Payload Hash: <span className="text-slate-400 font-mono text-[7px] break-all">{preview.canonicalPayloadHash}</span></span>
            <span>Sig Placeholder: <span className="text-slate-500 font-mono text-[7px]">{preview.signaturePlaceholder}</span></span>
          </div>

          <div>
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Full Preview JSON (read-only)</div>
            <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-40">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyPreviewButton text={JSON.stringify(preview, null, 2)} />
            <button type="button" onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            Preview only · allowedForDispatch: false · No OpenClaw call · No execution · Signature is a placeholder
          </div>
        </div>
      )}
    </div>
  );
}