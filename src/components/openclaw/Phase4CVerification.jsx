import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export default function Phase4CVerification() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [expandedTest, setExpandedTest] = useState(null);

  const TEST_CASES = [
    {
      id: 1,
      name: 'Eligible LOW READ request signs successfully',
      request: {
        bridgeRequest: {
          requestId: 'test_low_read_001',
          proposalId: 'prop_001',
          bundleHash: 'hash_001',
          commandType: 'READ',
          targetUrl: 'https://tradingview.com/chart',
          riskTier: 'LOW',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_001',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_ALLOWED',
    },
    {
      id: 2,
      name: 'Eligible MEDIUM VERIFY request signs successfully',
      request: {
        bridgeRequest: {
          requestId: 'test_medium_verify_002',
          proposalId: 'prop_002',
          bundleHash: 'hash_002',
          commandType: 'VERIFY',
          targetUrl: 'https://base44.com/docs',
          riskTier: 'MEDIUM',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_002',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_ALLOWED',
    },
    {
      id: 3,
      name: 'CLICK command is rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_click_003',
          proposalId: 'prop_003',
          bundleHash: 'hash_003',
          commandType: 'CLICK',
          targetUrl: 'https://tradingview.com/chart',
          riskTier: 'LOW',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_003',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
    {
      id: 4,
      name: 'TYPE command is rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_type_004',
          proposalId: 'prop_004',
          bundleHash: 'hash_004',
          commandType: 'TYPE',
          targetUrl: 'https://tradingview.com/chart',
          riskTier: 'LOW',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_004',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
    {
      id: 5,
      name: 'HIGH risk request is rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_high_005',
          proposalId: 'prop_005',
          bundleHash: 'hash_005',
          commandType: 'READ',
          targetUrl: 'https://tradingview.com/chart',
          riskTier: 'HIGH',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_005',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
    {
      id: 6,
      name: 'CRITICAL risk request is rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_critical_006',
          proposalId: 'prop_006',
          bundleHash: 'hash_006',
          commandType: 'READ',
          targetUrl: 'https://tradingview.com/chart',
          riskTier: 'CRITICAL',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_006',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
    {
      id: 7,
      name: 'Expired request is rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_expired_007',
          proposalId: 'prop_007',
          bundleHash: 'hash_007',
          commandType: 'READ',
          targetUrl: 'https://tradingview.com/chart',
          riskTier: 'LOW',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() - 1000).toISOString(),
        },
        previewHash: 'preview_hash_007',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
    {
      id: 8,
      name: 'Non-allowlisted domain is rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_domain_008',
          proposalId: 'prop_008',
          bundleHash: 'hash_008',
          commandType: 'READ',
          targetUrl: 'https://malicious.com/chart',
          riskTier: 'LOW',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_008',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
    {
      id: 9,
      name: 'Suspicious path keywords are rejected',
      request: {
        bridgeRequest: {
          requestId: 'test_suspicious_009',
          proposalId: 'prop_009',
          bundleHash: 'hash_009',
          commandType: 'READ',
          targetUrl: 'https://tradingview.com/api-key/change',
          riskTier: 'LOW',
          approvalStatus: 'APPROVED',
          validationResult: 'PASS',
          executionEligibility: 'ELIGIBLE_PREVIEW',
          governanceMode: 'SAFE_REQUIRES_APPROVAL',
          dryRun: true,
          liveExecution: false,
          expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        previewHash: 'preview_hash_009',
        operatorId: 'test@example.com',
        submittedAt: new Date().toISOString(),
      },
      expectedResult: 'SIGNING_REJECTED',
    },
  ];

  const runVerification = async () => {
    setRunning(true);
    const testResults = [];

    for (const test of TEST_CASES) {
      try {
        const response = await fetch('/api/openclaw/bridge/signer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.request),
        });
        const data = await response.json();

        const actualResult = data.signingAllowed ? 'SIGNING_ALLOWED' : 'SIGNING_REJECTED';
        const passed = actualResult === test.expectedResult;

        testResults.push({
          id: test.id,
          name: test.name,
          expected: test.expectedResult,
          actual: actualResult,
          passed,
          details: {
            signingAllowed: data.signingAllowed,
            rejectedReason: data.rejectedReason,
            signerAuditId: data.signerAuditId,
            hasSignedRequest: !!data.signedRequest,
            signatureMode: data.signatureMode,
          },
        });
      } catch (err) {
        testResults.push({
          id: test.id,
          name: test.name,
          expected: test.expectedResult,
          actual: 'ERROR',
          passed: false,
          error: err.message,
        });
      }
    }

    setResults(testResults);
    setRunning(false);
  };

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Phase 4C Verification</div>
          <div className="text-[13px] font-semibold text-foreground">Backend Signer Endpoint Test Suite</div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-500/80">
          <div className="font-semibold mb-0.5">Phase 4C: Signer endpoint tests — validation only.</div>
          <div className="text-[9px] text-amber-500/70">Tests signing behavior, rejection rules, audit logging. No OpenClaw calls. No execution. All tests read-only.</div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={runVerification}
        disabled={running}
        className="w-full px-4 py-2.5 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Running Tests...
          </>
        ) : (
          '▶ Run Verification Suite (9 tests)'
        )}
      </button>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className={`border rounded-lg px-4 py-3 ${
          failCount === 0 ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {failCount === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <div className={`text-[11px] font-semibold ${failCount === 0 ? 'text-primary' : 'text-amber-500'}`}>
                  {failCount === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}
                </div>
                <div className={`text-[9px] ${failCount === 0 ? 'text-primary/70' : 'text-amber-500/70'}`}>
                  {passCount} / {results.length} tests passed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={result.id}
              className={`border rounded overflow-hidden transition-colors ${
                result.passed
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-destructive/5 border-destructive/20'
              }`}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:opacity-80"
                onClick={() => setExpandedTest(expandedTest === result.id ? null : result.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="shrink-0">
                    {expandedTest === result.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {result.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-foreground truncate">{result.name}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {result.passed ? (
                    <span className="text-[8px] font-semibold text-primary">✓ PASS</span>
                  ) : (
                    <span className="text-[8px] font-semibold text-destructive">✗ FAIL</span>
                  )}
                </div>
              </div>

              {expandedTest === result.id && (
                <div className="border-t border-current/20 px-4 py-3 space-y-2 text-[9px] bg-card/30">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                      <div className="text-[8px] text-slate-400 font-semibold mb-0.5">EXPECTED</div>
                      <div className={`font-semibold ${result.passed ? 'text-primary' : 'text-destructive'}`}>
                        {result.expected}
                      </div>
                    </div>
                    <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                      <div className="text-[8px] text-slate-400 font-semibold mb-0.5">ACTUAL</div>
                      <div className={`font-semibold ${result.passed ? 'text-primary' : 'text-destructive'}`}>
                        {result.actual}
                      </div>
                    </div>
                  </div>

                  {result.details && (
                    <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded space-y-1">
                      <div>
                        <span className="text-slate-400">Signer Audit ID:</span>{' '}
                        <span className="font-mono text-[8px] text-foreground/70">{result.details.signerAuditId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Signing Allowed:</span>{' '}
                        <span className="font-semibold text-foreground">{String(result.details.signingAllowed)}</span>
                      </div>
                      {result.details.rejectedReason && (
                        <div>
                          <span className="text-slate-400">Reason:</span>{' '}
                          <span className="text-destructive text-[8px]">{result.details.rejectedReason}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Signed Request:</span>{' '}
                        <span className="font-semibold">{result.details.hasSignedRequest ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Signature Mode:</span>{' '}
                        <span className="font-mono text-[8px]">{result.details.signatureMode}</span>
                      </div>
                    </div>
                  )}

                  {result.error && (
                    <div className="bg-destructive/10 border border-destructive/30 px-2 py-1.5 rounded text-destructive text-[8px]">
                      {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      {results.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-[9px] text-primary/80">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Verification completed.</div>
            <div className="text-[8px] text-primary/70 space-y-0.5">
              <p>✓ {passCount} tests passed (signing logic, validation rules, rejection cases)</p>
              {failCount > 0 && <p>✗ {failCount} tests failed (see details above)</p>}
              <p className="mt-1">Note: This test suite verifies the signer endpoint only. Tamper detection, replay protection, and verifier acceptance require separate integration tests with openclawBridgePreview.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}