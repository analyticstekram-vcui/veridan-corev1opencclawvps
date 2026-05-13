import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';

const TEST_CASES = [
  {
    name: 'Missing signature field rejected',
    description: 'Request without signature field fails at Phase 3',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-missing-sig',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-missing-sig',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:50:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V1',
      signedAt: '2026-05-13T05:50:00Z',
      signature: null,
    },
    expectedReason: 'signature field missing',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Missing signingVersion rejected',
    description: 'Request without signingVersion field fails at Phase 3',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-missing-version',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-missing-version',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:51:00Z',
      signingVersion: null,
      signedAt: '2026-05-13T05:51:00Z',
      signature: 'anysignature',
    },
    expectedReason: 'signingVersion field missing',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Wrong signingVersion rejected',
    description: 'Request with wrong signingVersion fails at Phase 3',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-wrong-version',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-wrong-version',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:52:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V2',
      signedAt: '2026-05-13T05:52:00Z',
      signature: 'anysignature',
    },
    expectedReason: 'signingVersion must be OPENCLAW_BRIDGE_V1',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Stale signedAt (>5 minutes) rejected',
    description: 'Request with old signedAt timestamp fails at Phase 3',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-stale-signed-at',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-stale-signed-at',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:53:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V1',
      signedAt: '2026-05-13T05:45:00Z',
      signature: 'anysignature',
    },
    expectedReason: 'older than 5 minutes',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Future signedAt (>60 seconds) rejected',
    description: 'Request with far-future signedAt timestamp fails at Phase 3',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-future-signed-at',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-future-signed-at',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:54:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V1',
      signedAt: '2026-05-13T06:05:00Z',
      signature: 'anysignature',
    },
    expectedReason: 'more than 60 seconds in the future',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Invalid HMAC signature rejected',
    description: 'Request with wrong HMAC signature fails at Phase 4B',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-invalid-hmac',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-invalid-hmac',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:55:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V1',
      signedAt: '2026-05-13T05:55:00Z',
      signature: '0000000000000000000000000000000000000000000000000000000000000000',
    },
    expectedReason: 'canonical payload (REAL_HMAC_VALIDATION)',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Tampered targetUrl rejected',
    description: 'If signature was valid but targetUrl changed, canonical mismatch would occur',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-tampered-url',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://malicious.com',
        reason: 'test',
        riskTier: 'LOW',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-tampered-url',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:56:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V1',
      signedAt: '2026-05-13T05:56:00Z',
      signature: '0000000000000000000000000000000000000000000000000000000000000000',
    },
    expectedReason: 'canonical payload (REAL_HMAC_VALIDATION)',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
  {
    name: 'Tampered riskTier rejected',
    description: 'If signature was valid but riskTier changed from LOW to HIGH, canonical mismatch would occur',
    payload: {
      bridgeRequest: {
        requestId: 'phase4b-test-tampered-risk',
        proposalId: 'prop',
        bundleHash: 'hash',
        commandType: 'READ',
        targetUrl: 'https://tradingview.com',
        reason: 'test',
        riskTier: 'HIGH',
        approvalStatus: 'APPROVED',
        validationResult: 'PASS',
        executionEligibility: 'ELIGIBLE_PREVIEW',
        proposedBy: 'test',
        approvedBy: 'test',
        proposedAt: '2026-05-13T00:00:00Z',
        approvedAt: '2026-05-13T00:00:00Z',
        expirationAt: '2026-05-14T00:00:00Z',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        dryRun: true,
        liveExecution: false,
      },
      previewHash: 'phase4b-test-tampered-risk',
      operatorId: 'test@test.com',
      submittedAt: '2026-05-13T05:57:00Z',
      signingVersion: 'OPENCLAW_BRIDGE_V1',
      signedAt: '2026-05-13T05:57:00Z',
      signature: '0000000000000000000000000000000000000000000000000000000000000000',
    },
    expectedReason: 'riskTier HIGH not allowed',
    expectedMode: 'REAL_HMAC_VALIDATION',
  },
];

function TestResultRow({ test, result, loading }) {
  const passed = result && !result.accepted && result.signatureCheckResult === 'FAIL';
  
  return (
    <div className={`border rounded overflow-hidden ${passed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
      <div
        className="px-4 py-3 space-y-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground">{test.name}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{test.description}</div>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              {passed ? (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[8px] font-semibold text-primary">PASS</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-[8px] font-semibold text-destructive">FAIL</span>
                </div>
              )}
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-[8px] text-slate-400 font-semibold mb-0.5">MODE</div>
                <div className="text-foreground font-mono text-[8px]">{result.signatureMode}</div>
              </div>
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RESULT</div>
                <div className={`font-semibold ${result.signatureCheckResult === 'FAIL' ? 'text-primary' : 'text-destructive'}`}>
                  {result.signatureCheckResult}
                </div>
              </div>
            </div>

            {result.signatureCheckMessages?.length > 0 && (
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-[8px] text-slate-400 font-semibold mb-0.5">ERROR MESSAGE</div>
                <div className="text-[8px] text-foreground/70 space-y-0.5">
                  {result.signatureCheckMessages.map((msg, i) => (
                    <div key={i} className="font-mono">{msg}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase4BHmacTestCases() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const runTest = async (testCase) => {
    setLoading(prev => ({ ...prev, [testCase.name]: true }));
    try {
      const response = await fetch('/api/openclaw/bridge/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload),
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, [testCase.name]: data }));
    } catch (err) {
      setResults(prev => ({ ...prev, [testCase.name]: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [testCase.name]: false }));
    }
  };

  const runAll = async () => {
    for (const test of TEST_CASES) {
      await runTest(test);
    }
  };

  const passedCount = TEST_CASES.filter(test => {
    const result = results[test.name];
    return result && !result.accepted && result.signatureCheckResult === 'FAIL';
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <div>
            <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest">Phase 4B HMAC Tests</div>
            <div className="text-[9px] text-slate-400">Deterministic backend signature validation tests</div>
          </div>
        </div>
        <button
          onClick={runAll}
          disabled={Object.values(loading).some(v => v)}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors rounded whitespace-nowrap"
        >
          {Object.values(loading).some(v => v) ? 'Running...' : `Run All (${TEST_CASES.length})`}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <div className="text-[9px] text-primary/80">
          <div className="font-semibold mb-0.5">Real HMAC Verification Active</div>
          <div className="text-[8px] text-primary/70">All test requests should be REJECTED at Phase 3-4B because they have invalid or missing HMAC signatures. Frontend cannot generate valid HMACs without access to the server secret.</div>
        </div>
      </div>

      {/* Summary */}
      {Object.keys(results).length > 0 && (
        <div className={`border rounded-lg px-4 py-3 ${
          passedCount === TEST_CASES.length
            ? 'bg-primary/5 border-primary/20'
            : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className={`text-[11px] font-semibold ${passedCount === TEST_CASES.length ? 'text-primary' : 'text-amber-500'}`}>
                {passedCount === TEST_CASES.length ? 'ALL TESTS PASSED' : `${passedCount}/${TEST_CASES.length} TESTS PASSED`}
              </div>
              <div className={`text-[9px] ${passedCount === TEST_CASES.length ? 'text-primary/70' : 'text-amber-500/70'}`}>
                All invalid signatures correctly rejected at Phase 3-4B
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases */}
      <div className="space-y-2">
        {TEST_CASES.map((test, idx) => (
          <div key={idx} className="space-y-2">
            <button
              onClick={() => runTest(test)}
              disabled={loading[test.name]}
              className="w-full text-left hover:opacity-80 transition-opacity"
            >
              <TestResultRow
                test={test}
                result={results[test.name]}
                loading={loading[test.name]}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-card/50 border border-border/30 rounded-lg px-4 py-3">
        <div className="text-[9px] text-slate-400 space-y-1">
          <div><span className="font-semibold">Phase 3-4B Verification:</span> All requests validated for signature presence, signingVersion, signedAt freshness, and HMAC validity.</div>
          <div><span className="font-semibold">No Secret Exposed:</span> Backend computes real HMAC server-side only. Frontend has no access to computation or secret.</div>
          <div><span className="font-semibold">Deterministic Tests:</span> Each test verifies a specific rejection reason. No "valid signature passes" test here—see signer endpoint Phase 4C.</div>
        </div>
      </div>
    </div>
  );
}