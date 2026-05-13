import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, AlertCircle, CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';

export default function Phase1BridgePreviewTester({ proposal }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!proposal) {
    return (
      <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg px-4 py-3 text-[9px] text-slate-400">
        No proposal selected. Select an APPROVED proposal from the Proposal Queue.
      </div>
    );
  }

  const testBridgePreview = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build the bridge request payload
      const bridgeRequest = {
        requestId: `test_${Date.now()}`,
        proposalId: proposal.id || 'test-proposal',
        bundleHash: `sha256_${Math.random().toString(36).substr(2, 9)}`,
        commandType: proposal.commandType || 'READ',
        targetUrl: proposal.targetUrl || 'https://tradingview.com',
        selector: proposal.selector || null,
        reason: proposal.reason || 'Phase 1 test',
        riskTier: proposal.riskTier || 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: proposal.proposedBy || 'test@example.com',
        approvedBy: proposal.approvedBy || 'test@example.com',
        proposedAt: proposal.proposedAt || new Date().toISOString(),
        approvedAt: proposal.approvedAt || new Date().toISOString(),
        expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      };

      const payload = {
        bridgeRequest,
        previewHash: `sha256_${Math.random().toString(36).substr(2, 9)}`,
        operatorId: 'test-operator@veridancore.com',
        submittedAt: new Date().toISOString(),
      };

      // Call the backend route
      const response = await fetch('/api/openclaw/bridge/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data,
        payload,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Phase 1 Dry-Run Route Tester</div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-500">
        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-0.5">PHASE 2: VALIDATION ONLY · NO EXECUTION</div>
          <div className="text-[8px] text-amber-500/70">Backend policy gating + replay protection enabled. DRY_RUN_ONLY mode. No OpenClaw calls. No browser actions. No trading. No mutations.</div>
        </div>
      </div>

      {/* Proposal Summary */}
      <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2">
        <div className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Test Proposal</div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span className="text-slate-400">Type:</span>{' '}
            <span className="text-foreground font-semibold">{proposal.commandType || 'READ'}</span>
          </div>
          <div>
            <span className="text-slate-400">Risk:</span>{' '}
            <span className="text-foreground font-semibold">{proposal.riskTier || 'LOW'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400">URL:</span>{' '}
            <span className="text-blue-400 font-mono text-[8px] truncate">{proposal.targetUrl || 'https://tradingview.com'}</span>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={testBridgePreview}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-amber-500 text-amber-900 text-[10px] font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Zap className="w-3 h-3" />
            Test Phase 1 Dry-Run Route
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-[9px] text-destructive">
          <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-2">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 border rounded ${
            result.data.accepted
              ? 'bg-primary/5 border-primary/20'
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            {result.data.accepted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-[10px] font-semibold text-primary">ACCEPTED</div>
                  <div className="text-[8px] text-primary/70">Request passed validation & policy gate. DRY_RUN_ONLY—no action executed.</div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-destructive" />
                <div>
                  <div className="text-[10px] font-semibold text-destructive">REJECTED</div>
                  <div className="text-[8px] text-destructive/70">{result.data.rejectedReason}</div>
                </div>
              </>
            )}
          </div>

          {/* Response Summary */}
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div>
                <div className="text-slate-400 text-[8px] font-semibold mb-0.5">BRIDGE MODE</div>
                <div className="text-foreground font-mono">{result.data.bridgeMode}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[8px] font-semibold mb-0.5">EXECUTION STATUS</div>
                <div className="text-foreground font-mono">{result.data.executionStatus}</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-[8px] font-semibold mb-0.5">AUDIT ID</div>
                <div className="text-foreground font-mono text-[8px]">{result.data.auditId}</div>
              </div>
            </div>

            {/* Phase 2: Policy Gate */}
            {result.data.policyGateResult !== undefined && (
              <div className={`px-2 py-1.5 rounded border ${
                result.data.policyGateResult === 'PASS'
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="text-[8px] font-semibold mb-0.5 flex items-center gap-1">
                  <span className={result.data.policyGateResult === 'PASS' ? 'text-primary' : 'text-destructive'}>
                    POLICY GATE
                  </span>
                  <span className={`px-1 py-0.5 rounded text-[7px] font-semibold ${
                    result.data.policyGateResult === 'PASS'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {result.data.policyGateResult}
                  </span>
                </div>
                {result.data.policyGateMessages?.length > 0 && (
                  <div className="text-[7px] space-y-0.5 ml-2">
                    {result.data.policyGateMessages.map((msg, i) => (
                      <div key={i} className="text-destructive/80">✗ {msg}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Phase 2: Replay Check */}
            {result.data.replayCheckResult !== undefined && (
              <div className={`px-2 py-1.5 rounded border ${
                result.data.replayCheckResult === 'PASS'
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="text-[8px] font-semibold mb-0.5 flex items-center gap-1">
                  <span className={result.data.replayCheckResult === 'PASS' ? 'text-primary' : 'text-destructive'}>
                    REPLAY CHECK
                  </span>
                  <span className={`px-1 py-0.5 rounded text-[7px] font-semibold ${
                    result.data.replayCheckResult === 'PASS'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {result.data.replayCheckResult}
                  </span>
                </div>
                {result.data.replayCheckMessages?.length > 0 && (
                  <div className="text-[7px] space-y-0.5 ml-2">
                    {result.data.replayCheckMessages.map((msg, i) => (
                      <div key={i} className="text-destructive/80">✗ {msg}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Phase 3: Signature Check */}
            {result.data.signatureCheckResult !== undefined && (
              <div className={`px-2 py-1.5 rounded border ${
                result.data.signatureCheckResult === 'PASS'
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="text-[8px] font-semibold mb-0.5 flex items-center gap-1">
                  <span className={result.data.signatureCheckResult === 'PASS' ? 'text-primary' : 'text-destructive'}>
                    SIGNATURE CHECK ({result.data.signatureMode || 'N/A'})
                  </span>
                  <span className={`px-1 py-0.5 rounded text-[7px] font-semibold ${
                    result.data.signatureCheckResult === 'PASS'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {result.data.signatureCheckResult}
                  </span>
                </div>
                {result.data.signatureCheckMessages?.length > 0 && (
                  <div className="text-[7px] space-y-0.5 ml-2">
                    {result.data.signatureCheckMessages.map((msg, i) => (
                      <div key={i} className="text-destructive/80">✗ {msg}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <div className="text-[9px] text-primary/80">
              <span className="font-semibold">Note:</span> {result.data.note}
            </div>
          </div>

          {/* Full Response Toggle */}
          <button
            onClick={() => setShowRawResponse(!showRawResponse)}
            className="w-full px-3 py-1.5 border border-border text-[9px] text-slate-400 hover:text-foreground hover:bg-secondary/50 transition-colors font-semibold"
          >
            {showRawResponse ? 'Hide' : 'Show'} Full Response
          </button>

          {/* Full Response */}
          {showRawResponse && (
            <div className="space-y-2">
              <div className="bg-card/50 border border-border/30 rounded overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                  <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Full Response</div>
                  <button
                    onClick={copyToClipboard}
                    className="px-2 py-1 text-[8px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/30 transition-colors"
                  >
                    {copied ? '✓ Copied' : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="text-[8px] font-mono text-foreground/70 p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-card/50 border border-border/30 rounded-lg px-3 py-2 space-y-1 text-[8px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Received:</span>
              <span className="text-foreground font-mono">{new Date(result.data.receivedAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Validated:</span>
              <span className="text-foreground font-mono">{new Date(result.data.validatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}