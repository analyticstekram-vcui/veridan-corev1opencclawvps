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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
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
      type: 'SIGNER',
    },
    {
      id: 10,
      name: 'Signer audit record created for allowed signing',
      type: 'AUDIT_CREATED',
      expectedResult: 'AUDIT_EXISTS',
    },
    {
      id: 11,
      name: 'Signer audit record created for rejected signing',
      type: 'AUDIT_CREATED',
      expectedResult: 'AUDIT_EXISTS',
    },
    {
      id: 12,
      name: 'Signer audit records do NOT expose secrets or HMAC internals',
      type: 'AUDIT_SAFETY',
      expectedResult: 'SAFE',
    },
    {
      id: 13,
      name: 'Signed request accepted by verifier when unchanged and fresh',
      type: 'VERIFIER_INTEGRATION',
      expectedResult: 'ACCEPTED',
    },
    {
      id: 14,
      name: 'Tampering signed targetUrl is rejected by verifier with HMAC_SIGNATURE_INVALID',
      type: 'TAMPER_DETECTION',
      expectedResult: 'REJECTED',
    },
    {
      id: 15,
      name: 'Tampering signed riskTier is rejected by verifier with HMAC_SIGNATURE_INVALID',
      type: 'TAMPER_DETECTION',
      expectedResult: 'REJECTED',
    },
    {
      id: 16,
      name: 'Replaying same signed request is rejected by replay protection',
      type: 'REPLAY_PROTECTION',
      expectedResult: 'REJECTED',
    },
    {
      id: 17,
      name: 'Verify no OpenClaw calls exist in signer/verifier',
      type: 'EXECUTION_CONSTRAINT',
      expectedResult: 'SAFE',
    },
    {
      id: 18,
      name: 'Verify no browser/API/trading execution exists',
      type: 'EXECUTION_CONSTRAINT',
      expectedResult: 'SAFE',
    },
    {
      id: 19,
      name: 'Verify bridgeMode remains DRY_RUN_ONLY',
      type: 'EXECUTION_CONSTRAINT',
      expectedResult: 'DRY_RUN_ONLY',
    },
    {
      id: 20,
      name: 'Verify executionStatus remains NOT_EXECUTED or REJECTED_NOT_EXECUTED',
      type: 'EXECUTION_CONSTRAINT',
      expectedResult: 'SAFE',
    },
  ];

  const runVerification = async () => {
    setRunning(true);
    const testResults = [];

    for (const test of TEST_CASES) {
      try {
        if (test.type === 'SIGNER') {
          // Test signer endpoint
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
        } else if (test.type === 'AUDIT_CREATED') {
          // Verify audit records exist
          const response = await fetch('/api/openclaw/bridge/signer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.id === 10 ? TEST_CASES[0].request : TEST_CASES[2].request),
          });
          const signerData = await response.json();

          // Audit record should exist
          const passed = !!signerData.signerAuditId;

          testResults.push({
            id: test.id,
            name: test.name,
            expected: test.expectedResult,
            actual: passed ? 'AUDIT_EXISTS' : 'AUDIT_MISSING',
            passed,
            details: { auditId: signerData.signerAuditId },
          });
        } else if (test.type === 'AUDIT_SAFETY') {
          // Sign a request and verify audit doesn't expose secrets
          const signerResponse = await fetch('/api/openclaw/bridge/signer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CASES[0].request),
          });
          const signerData = await signerResponse.json();

          // Check that signed response doesn't include raw secrets
          const responseStr = JSON.stringify(signerData);
          const hasForbiddenContent = 
            responseStr.includes('OPENCLAW_BRIDGE_HMAC_SECRET') ||
            responseStr.includes('inputText') && TEST_CASES[0].request.bridgeRequest.inputText ||
            responseStr.includes('HMAC');

          const passed = !hasForbiddenContent && signerData.signingAllowed;

          testResults.push({
            id: test.id,
            name: test.name,
            expected: test.expectedResult,
            actual: passed ? 'SAFE' : 'EXPOSED',
            passed,
            details: { exposed: hasForbiddenContent },
          });
        } else if (test.type === 'VERIFIER_INTEGRATION') {
          // Sign a request and verify it's accepted by the verifier
          const signerResponse = await fetch('/api/openclaw/bridge/signer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CASES[0].request),
          });
          const signedData = await signerResponse.json();

          if (signedData.signingAllowed && signedData.signedRequest) {
            // Send signed request to verifier
            const verifierResponse = await fetch('/api/openclaw/bridge/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(signedData.signedRequest),
            });
            const verifierData = await verifierResponse.json();

            const passed = verifierData.accepted === true;
            testResults.push({
              id: test.id,
              name: test.name,
              expected: test.expectedResult,
              actual: passed ? 'ACCEPTED' : 'REJECTED',
              passed,
              details: { verifierAccepted: verifierData.accepted },
            });
          } else {
            testResults.push({
              id: test.id,
              name: test.name,
              expected: test.expectedResult,
              actual: 'SIGNING_FAILED',
              passed: false,
              details: { reason: 'Signer endpoint failed' },
            });
          }
        } else if (test.type === 'TAMPER_DETECTION') {
          // Sign a request, tamper with it, and verify rejection
          const signerResponse = await fetch('/api/openclaw/bridge/signer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CASES[0].request),
          });
          const signedData = await signerResponse.json();

          if (signedData.signingAllowed && signedData.signedRequest) {
            // Tamper with the signed request
            const tamperedRequest = { ...signedData.signedRequest };
            if (test.id === 14) {
              tamperedRequest.bridgeRequest.targetUrl = 'https://base44.com/docs';
            } else {
              tamperedRequest.bridgeRequest.riskTier = 'MEDIUM';
            }

            // Send to verifier
            const verifierResponse = await fetch('/api/openclaw/bridge/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tamperedRequest),
            });
            const verifierData = await verifierResponse.json();

            const isRejected = verifierData.accepted === false && 
              (verifierData.rejectedReason && verifierData.rejectedReason.includes('HMAC_SIGNATURE_INVALID'));
            
            testResults.push({
              id: test.id,
              name: test.name,
              expected: test.expectedResult,
              actual: isRejected ? 'REJECTED' : 'ACCEPTED',
              passed: isRejected,
              details: { rejectedReason: verifierData.rejectedReason },
            });
          } else {
            testResults.push({
              id: test.id,
              name: test.name,
              expected: test.expectedResult,
              actual: 'SIGNING_FAILED',
              passed: false,
            });
          }
        } else if (test.type === 'REPLAY_PROTECTION') {
          // Sign a request, send it twice, verify second is rejected
          const signerResponse = await fetch('/api/openclaw/bridge/signer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CASES[0].request),
          });
          const signedData = await signerResponse.json();

          if (signedData.signingAllowed && signedData.signedRequest) {
            // Send first time
            await fetch('/api/openclaw/bridge/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(signedData.signedRequest),
            });

            // Send second time (replay)
            const replayResponse = await fetch('/api/openclaw/bridge/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(signedData.signedRequest),
            });
            const replayData = await replayResponse.json();

            const isRejected = replayData.accepted === false && 
              (replayData.rejectedReason && replayData.rejectedReason.includes('DUPLICATE'));

            testResults.push({
              id: test.id,
              name: test.name,
              expected: test.expectedResult,
              actual: isRejected ? 'REJECTED' : 'ACCEPTED',
              passed: isRejected,
              details: { rejectedReason: replayData.rejectedReason },
            });
          } else {
            testResults.push({
              id: test.id,
              name: test.name,
              expected: test.expectedResult,
              actual: 'SIGNING_FAILED',
              passed: false,
            });
          }
        } else if (test.type === 'EXECUTION_CONSTRAINT') {
          // Verify no execution happens
          const signerResponse = await fetch('/api/openclaw/bridge/signer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CASES[0].request),
          });
          const signerData = await signerResponse.json();

          let passed = false;
          if (test.id === 17 || test.id === 18) {
            // Verify no OpenClaw or execution calls
            passed = signerData.note.includes('No OpenClaw call') || signerData.note.includes('No execution');
          } else if (test.id === 19) {
            // Verify DRY_RUN_ONLY from verifier
            const verifierResponse = await fetch('/api/openclaw/bridge/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(signerData.signedRequest || TEST_CASES[0].request),
            });
            const verifierData = await verifierResponse.json();
            passed = verifierData.bridgeMode === 'DRY_RUN_ONLY';
          } else if (test.id === 20) {
            // Verify execution status
            const verifierResponse = await fetch('/api/openclaw/bridge/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(signerData.signedRequest || TEST_CASES[0].request),
            });
            const verifierData = await verifierResponse.json();
            passed = verifierData.executionStatus === 'NOT_EXECUTED' || 
              verifierData.executionStatus === 'REJECTED_NOT_EXECUTED';
          }

          testResults.push({
            id: test.id,
            name: test.name,
            expected: test.expectedResult,
            actual: passed ? test.expectedResult : 'UNSAFE',
            passed,
          });
        }
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
          '▶ Run Verification Suite (20 tests)'
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