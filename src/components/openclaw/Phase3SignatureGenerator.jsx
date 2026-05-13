import React, { useState } from 'react';
import { Copy, AlertCircle, CheckCircle2 } from 'lucide-react';

// Mock deterministic signature generation (same as backend)
const buildCanonicalPayload = (requestId, proposalId, previewHash, operatorId, submittedAt, signedAt, commandType, targetUrl, riskTier, governanceMode, dryRun, liveExecution) => {
  return [
    requestId,
    proposalId,
    previewHash,
    operatorId,
    submittedAt,
    signedAt,
    commandType,
    targetUrl,
    riskTier,
    governanceMode,
    String(dryRun),
    String(liveExecution),
  ].join('|');
};

const generateMockSignature = async (canonical) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function Phase3SignatureGenerator({ bridgeRequest, previewHash, operatorId, submittedAt }) {
  const [signedAt, setSignedAt] = useState(new Date().toISOString());
  const [signature, setSignature] = useState('');
  const [canonical, setCanonical] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!bridgeRequest) {
    return (
      <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg px-4 py-3 text-[9px] text-slate-400">
        No bridge request selected. Select an APPROVED proposal first.
      </div>
    );
  }

  const generateSignature = async () => {
    setLoading(true);
    try {
      const payload = buildCanonicalPayload(
        bridgeRequest.requestId,
        bridgeRequest.proposalId,
        previewHash,
        operatorId,
        submittedAt,
        signedAt,
        bridgeRequest.commandType,
        bridgeRequest.targetUrl,
        bridgeRequest.riskTier,
        bridgeRequest.governanceMode,
        bridgeRequest.dryRun,
        bridgeRequest.liveExecution
      );

      const sig = await generateMockSignature(payload);
      setSignature(sig);
      setCanonical(payload);
    } catch (err) {
      console.error('Signature generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copySignature = () => {
    navigator.clipboard.writeText(signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-primary" />
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Phase 3 Signature Generator</div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-500">
        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-0.5">MOCK DETERMINISTIC SIGNATURE ONLY</div>
          <div className="text-[8px] text-amber-500/70">Frontend uses SHA-256 canonical payload hash. Real HMAC/server secrets disabled. Development preview only.</div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-2">
        <label className="text-[9px] font-semibold text-foreground uppercase tracking-widest block">signedAt (ISO 8601)</label>
        <input
          type="datetime-local"
          value={signedAt.slice(0, 16)}
          onChange={(e) => setSignedAt(new Date(e.target.value).toISOString())}
          className="w-full px-3 py-1.5 text-[10px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
        />
        <div className="text-[8px] text-slate-400">Must be within 5 minutes past or 60 seconds future.</div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateSignature}
        disabled={loading}
        className="w-full px-3 py-2 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors rounded"
      >
        {loading ? 'Generating...' : 'Generate Mock Signature'}
      </button>

      {/* Signature Output */}
      {signature && (
        <div className="space-y-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="text-[9px] font-semibold text-foreground uppercase tracking-widest">Generated Signature</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[8px] font-mono bg-secondary/50 border border-border/30 px-2 py-1.5 rounded break-all text-foreground/80">
              {signature}
            </code>
            <button
              type="button"
              onClick={copySignature}
              className="px-2 py-1.5 text-[8px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded whitespace-nowrap"
            >
              {copied ? '✓ Copied' : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Canonical Payload */}
          <div className="border-t border-primary/20 pt-2">
            <div className="text-[8px] text-slate-400 mb-1">Canonical Payload:</div>
            <div className="bg-secondary/50 border border-border/30 px-2 py-1.5 rounded text-[7px] font-mono text-foreground/70 overflow-x-auto whitespace-pre-wrap break-all max-h-32">
              {canonical}
            </div>
          </div>
        </div>
      )}

      {/* Signing Version */}
      <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2">
        <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Signing Version</div>
        <div className="text-[10px] font-mono text-foreground">OPENCLAW_BRIDGE_V1</div>
      </div>
    </div>
  );
}