/**
 * DryRunBackendValidatorTestPanel
 * Tests the dry-run validator by calling /api/dry-run/bridge/preview.
 * Wired to validator endpoint only. No persistence, no external calls.
 *
 * Does NOT:
 *   - Call any endpoint other than /api/dry-run/bridge/preview
 *   - Use axios
 *   - Write to database
 *   - Execute any commands
 *   - Persist requests or results
 *   - Make outbound network calls
 *   - Use OpenClaw, SafeBridge, MCP, browsers, brokers, banks, bureaus, payments, credentials, uploads, parsers, AI indexing, or persistence systems
 */

import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

const VALID_REQUEST_PAYLOAD = {
  requestId: 'dry-run-valid-preview-001',
  createdAt: new Date().toISOString(),
  operatorId: 'operator-local-preview',
  commandType: 'READ',
  targetSystem: 'OpenClaw',
  requestedAction: 'Check read-only gateway status',
  requestedTarget: '/status',
  riskTier: 'LOW',
  approvalStatus: 'DRAFT',
  executionMode: 'DRY_RUN_ONLY',
  executionStatus: 'NOT_EXECUTED',
  validationStatus: 'NOT_VALIDATED',
  denialReason: null,
  auditRequired: true,
};

const REJECTED_REQUEST_PAYLOAD = {
  requestId: 'dry-run-rejected-preview-001',
  createdAt: new Date().toISOString(),
  operatorId: 'operator-local-preview',
  commandType: 'TRADE',
  targetSystem: 'Broker',
  requestedAction: 'Execute buy trade',
  requestedTarget: 'broker/order/submit',
  riskTier: 'HIGH',
  approvalStatus: 'APPROVED',
  executionMode: 'LIVE',
  executionStatus: 'EXECUTED',
  validationStatus: 'NOT_VALIDATED',
  denialReason: null,
  auditRequired: true,
};

export default function DryRunBackendValidatorTestPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const handleTestRequest = async (payload) => {
    setLoading(true);
    setError(null);
    setLastRequest(payload);
    setLastResponse(null);

    try {
      const response = await fetch('/api/dry-run/bridge/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLastResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">I. Dry-Run Backend Validator Test Panel</h2>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/5 border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Test Panel Only</div>
            <p className="text-[9px] text-amber-600/90">
              This panel tests the dry-run validator only. It does not execute commands, persist requests, or make outbound calls.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Endpoint Reference */}
        <div className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
          <div className="text-[9px] font-mono font-semibold text-slate-300 mb-1">Allowed Endpoint</div>
          <div className="text-[10px] font-mono text-blue-400">/api/dry-run/bridge/preview only</div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTestRequest(VALID_REQUEST_PAYLOAD)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm font-semibold text-[10px] font-mono uppercase hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Test Valid Dry-Run Request
          </button>
          <button
            type="button"
            onClick={() => handleTestRequest(REJECTED_REQUEST_PAYLOAD)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive/80 rounded-sm font-semibold text-[10px] font-mono uppercase hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Test Rejected Dry-Run Request
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-3 py-2.5 bg-destructive/5 border border-destructive/20 rounded-sm">
            <div className="text-[9px] font-mono font-semibold text-destructive/80 mb-1">Error</div>
            <div className="text-[8px] font-mono text-slate-300 break-all">{error}</div>
          </div>
        )}

        {/* Last Request Display */}
        {lastRequest && (
          <div className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
            <div className="text-[9px] font-mono font-semibold text-slate-300 mb-2">Last Request</div>
            <pre className="bg-secondary/50 px-2 py-1.5 rounded-sm text-[7px] text-blue-400 font-mono overflow-x-auto">
              {JSON.stringify(lastRequest, null, 2)}
            </pre>
          </div>
        )}

        {/* Last Response Display */}
        {lastResponse && (
          <div className="space-y-2">
            <div className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
              <div className="text-[9px] font-mono font-semibold text-slate-300 mb-2">Response Summary</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                  <span className="text-[8px] text-slate-400">accepted:</span>
                  <span className="text-[8px] font-mono text-slate-200">{lastResponse.accepted ? 'true' : 'false'}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                  <span className="text-[8px] text-slate-400">validationStatus:</span>
                  <span className="text-[8px] font-mono text-slate-200">{lastResponse.validationStatus}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                  <span className="text-[8px] text-slate-400">decision:</span>
                  <span className="text-[8px] font-mono text-slate-200">{lastResponse.decision}</span>
                </div>
                {lastResponse.denialReason && (
                  <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                    <span className="text-[8px] text-slate-400">denialReason:</span>
                    <span className="text-[8px] font-mono text-destructive/80">{lastResponse.denialReason}</span>
                  </div>
                )}
                {lastResponse.failCodes && lastResponse.failCodes.length > 0 && (
                  <div className="px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                    <span className="text-[8px] text-slate-400">failCodes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lastResponse.failCodes.map((code) => (
                        <span key={code} className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 rounded text-[7px] font-mono text-destructive/80">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                  <span className="text-[8px] text-slate-400">executionStatus:</span>
                  <span className="text-[8px] font-mono text-slate-200">{lastResponse.executionStatus}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                  <span className="text-[8px] text-slate-400">outboundCallsMade:</span>
                  <span className="text-[8px] font-mono text-slate-200">{lastResponse.outboundCallsMade ? 'true' : 'false'}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                  <span className="text-[8px] text-slate-400">persistenceWritten:</span>
                  <span className="text-[8px] font-mono text-slate-200">{lastResponse.persistenceWritten ? 'true' : 'false'}</span>
                </div>
              </div>
            </div>

            {/* Safety Assertion Block */}
            {(() => {
              const executionOk = lastResponse.executionStatus === 'NOT_EXECUTED';
              const outboundOk = lastResponse.outboundCallsMade === false;
              const persistenceOk = lastResponse.persistenceWritten === false;
              const allPassed = executionOk && outboundOk && persistenceOk;
              const status = allPassed ? 'SAFETY_ASSERTION_PASSED' : 'SAFETY_ASSERTION_FAILED';

              return (
                <div
                  className={`px-3 py-2.5 border rounded-sm ${
                    allPassed
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-destructive/5 border-destructive/20'
                  }`}
                >
                  <div className={`text-[9px] font-mono font-semibold mb-2 ${
                    allPassed ? 'text-emerald-400' : 'text-destructive/80'
                  } uppercase`}>
                    Safety Assertion
                  </div>

                  {/* Safety Checks */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between px-2 py-1 text-[8px]">
                      <span className="text-slate-400">executionStatus === "NOT_EXECUTED"</span>
                      <span className={`font-mono font-bold ${executionOk ? 'text-emerald-400' : 'text-destructive/80'}`}>
                        {executionOk ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 text-[8px]">
                      <span className="text-slate-400">outboundCallsMade === false</span>
                      <span className={`font-mono font-bold ${outboundOk ? 'text-emerald-400' : 'text-destructive/80'}`}>
                        {outboundOk ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 text-[8px]">
                      <span className="text-slate-400">persistenceWritten === false</span>
                      <span className={`font-mono font-bold ${persistenceOk ? 'text-emerald-400' : 'text-destructive/80'}`}>
                        {persistenceOk ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="px-2 py-1.5 bg-secondary/50 rounded-sm border border-border/30">
                    <span className="text-[8px] text-slate-400">Status: </span>
                    <span className={`font-mono font-bold ${allPassed ? 'text-emerald-400' : 'text-destructive/80'}`}>
                      {status}
                    </span>
                  </div>

                  {/* Failure Warning */}
                  {!allPassed && (
                    <div className="mt-2 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded-sm">
                      <div className="text-[8px] font-mono text-destructive/80">
                        Stop. The dry-run validator response violated the non-execution boundary.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Full Response JSON */}
            <div className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
              <div className="text-[9px] font-mono font-semibold text-slate-300 mb-2">Full Response</div>
              <pre className="bg-secondary/50 px-2 py-1.5 rounded-sm text-[7px] text-blue-400 font-mono overflow-x-auto">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Boundary Note */}
        <div className="px-3 py-2.5 bg-slate-500/5 border border-slate-500/20 rounded-sm">
          <div className="text-[9px] font-mono font-semibold text-slate-400 mb-1 uppercase">Endpoint Boundary</div>
          <p className="text-[10px] text-slate-400">
            Allowed endpoint: /api/dry-run/bridge/preview only. No other URLs, no database writes, no persistence.
          </p>
        </div>
      </div>
    </div>
  );
}