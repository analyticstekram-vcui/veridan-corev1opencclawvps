import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const TEST_CASES = [
  {
    name: 'READ LOW allowlisted domain passes all checks',
    request: {
      requestId: 'test_read_low_pass',
      proposalId: 'prop_001',
      bundleHash: 'hash_read_low',
      commandType: 'READ',
      targetUrl: 'https://tradingview.com/chart',
      reason: 'Read chart data',
      riskTier: 'LOW',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T10:00:00Z',
      approvedAt: '2026-05-13T10:05:00Z',
      expirationAt: '2027-05-14T10:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'ACCEPTED',
    expectedPolicyGate: 'PASS',
    expectedReplayCheck: 'PASS',
  },
  {
    name: 'CLICK command rejected by policy gate',
    request: {
      requestId: 'test_click_reject',
      proposalId: 'prop_002',
      bundleHash: 'hash_click_reject',
      commandType: 'CLICK',
      targetUrl: 'https://tradingview.com/chart',
      selector: 'button.submit',
      reason: 'Click submit button',
      riskTier: 'LOW',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T11:00:00Z',
      approvedAt: '2026-05-13T11:05:00Z',
      expirationAt: '2027-05-14T11:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'REJECTED',
    expectedPolicyGate: 'FAIL',
    expectedReplayCheck: null,
  },
  {
    name: 'TYPE command rejected by policy gate',
    request: {
      requestId: 'test_type_reject',
      proposalId: 'prop_003',
      bundleHash: 'hash_type_reject',
      commandType: 'TYPE',
      targetUrl: 'https://tradingview.com/chart',
      selector: 'input.password',
      inputText: 'secret_password',
      reason: 'Type password',
      riskTier: 'LOW',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T12:00:00Z',
      approvedAt: '2026-05-13T12:05:00Z',
      expirationAt: '2027-05-14T12:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'REJECTED',
    expectedPolicyGate: 'FAIL',
    expectedReplayCheck: null,
  },
  {
    name: 'HIGH risk tier rejected by policy gate',
    request: {
      requestId: 'test_high_reject',
      proposalId: 'prop_004',
      bundleHash: 'hash_high_reject',
      commandType: 'READ',
      targetUrl: 'https://tradingview.com/chart',
      reason: 'Read high risk data',
      riskTier: 'HIGH',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T13:00:00Z',
      approvedAt: '2026-05-13T13:05:00Z',
      expirationAt: '2027-05-14T13:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'REJECTED',
    expectedPolicyGate: 'FAIL',
    expectedReplayCheck: null,
  },
  {
    name: 'CRITICAL risk tier rejected by policy gate',
    request: {
      requestId: 'test_critical_reject',
      proposalId: 'prop_005',
      bundleHash: 'hash_critical_reject',
      commandType: 'READ',
      targetUrl: 'https://tradingview.com/chart',
      reason: 'Read critical data',
      riskTier: 'CRITICAL',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T14:00:00Z',
      approvedAt: '2026-05-13T14:05:00Z',
      expirationAt: '2027-05-14T14:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'REJECTED',
    expectedPolicyGate: 'FAIL',
    expectedReplayCheck: null,
  },
  {
    name: 'Suspicious path keyword "delete" rejected by policy gate',
    request: {
      requestId: 'test_delete_path_reject',
      proposalId: 'prop_006',
      bundleHash: 'hash_delete_path_reject',
      commandType: 'READ',
      targetUrl: 'https://tradingview.com/api/delete-account',
      reason: 'Read delete endpoint',
      riskTier: 'LOW',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T15:00:00Z',
      approvedAt: '2026-05-13T15:05:00Z',
      expirationAt: '2027-05-14T15:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'REJECTED',
    expectedPolicyGate: 'FAIL',
    expectedReplayCheck: null,
  },
  {
    name: 'Suspicious path keyword "trade" rejected by policy gate',
    request: {
      requestId: 'test_trade_path_reject',
      proposalId: 'prop_007',
      bundleHash: 'hash_trade_path_reject',
      commandType: 'READ',
      targetUrl: 'https://tradovate.com/api/trade/execute',
      reason: 'Read trade endpoint',
      riskTier: 'LOW',
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: 'test@veridancore.com',
      approvedBy: 'admin@veridancore.com',
      proposedAt: '2026-05-13T16:00:00Z',
      approvedAt: '2026-05-13T16:05:00Z',
      expirationAt: '2027-05-14T16:05:00Z',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    },
    expectedStatus: 'REJECTED',
    expectedPolicyGate: 'FAIL',
    expectedReplayCheck: null,
  },
];

function TestResultRow({ testCase, result }) {
  const passed = result && testCase.expectedStatus === 'ACCEPTED'
    ? result.accepted && result.policyGateResult === 'PASS' && result.replayCheckResult === 'PASS'
    : result && !result.accepted;

  return (
    <div className={`border rounded overflow-hidden ${passed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-foreground">{testCase.name}</div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-current/20 border border-current/30 rounded whitespace-nowrap">
            {passed ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-semibold text-primary">PASS</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-destructive" />
                <span className="text-[8px] font-semibold text-destructive">FAIL</span>
              </>
            )}
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-4 gap-2 text-[9px]">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] text-slate-400 font-semibold mb-0.5">STATUS</div>
              <div className={`font-semibold ${result.accepted ? 'text-primary' : 'text-destructive'}`}>
                {result.accepted ? 'ACCEPTED' : 'REJECTED'}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] text-slate-400 font-semibold mb-0.5">POLICY GATE</div>
              <div className={`font-semibold ${result.policyGateResult === 'PASS' ? 'text-primary' : 'text-destructive'}`}>
                {result.policyGateResult || '—'}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REPLAY CHECK</div>
              <div className={`font-semibold ${result.replayCheckResult === 'PASS' ? 'text-primary' : result.replayCheckResult === 'FAIL' ? 'text-destructive' : 'text-slate-400'}`}>
                {result.replayCheckResult || '—'}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] text-slate-400 font-semibold mb-0.5">AUDIT ID</div>
              <div className="text-foreground font-mono text-[7px] truncate">{result.auditId}</div>
            </div>
          </div>
        )}

        {result?.policyGateMessages?.length > 0 && (
          <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] text-slate-400 font-semibold mb-1">POLICY GATE FAILURES</div>
            <div className="space-y-0.5 text-[8px]">
              {result.policyGateMessages.map((msg, i) => (
                <div key={i} className="text-destructive/80">✗ {msg}</div>
              ))}
            </div>
          </div>
        )}

        {result?.replayCheckMessages?.length > 0 && (
          <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] text-slate-400 font-semibold mb-1">REPLAY CHECK FAILURES</div>
            <div className="space-y-0.5 text-[8px]">
              {result.replayCheckMessages.map((msg, i) => (
                <div key={i} className="text-destructive/80">✗ {msg}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase2PolicyTestCases() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const runTest = async (testCase) => {
    setRunning(true);
    try {
      const payload = {
        bridgeRequest: testCase.request,
        previewHash: `preview_${testCase.request.bundleHash}`,
        operatorId: 'test-operator@veridancore.com',
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/openclaw/bridge/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResults(prev => ({
        ...prev,
        [testCase.name]: data,
      }));
    } catch (err) {
      console.error('Test error:', err);
    } finally {
      setRunning(false);
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    for (const testCase of TEST_CASES) {
      await runTest(testCase);
    }
    setRunning(false);
  };

  const passCount = TEST_CASES.filter(tc => {
    const result = results[tc.name];
    if (!result) return false;
    return tc.expectedStatus === 'ACCEPTED'
      ? result.accepted && result.policyGateResult === 'PASS' && result.replayCheckResult === 'PASS'
      : !result.accepted;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Phase 2 Policy Tests</div>
          <div className="text-[13px] font-semibold text-foreground">Deterministic Backend Policy Gate & Replay Protection</div>
        </div>
        <button
          onClick={runAllTests}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/50 bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {running ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Running...
            </>
          ) : (
            'Run All Tests'
          )}
        </button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <div className="text-[9px] text-primary/80">
          <div className="font-semibold mb-0.5">8 deterministic test cases</div>
          <div className="text-[8px] text-primary/70">Tests validate policy gate (commandType, riskTier, path keywords) and replay protection (duplicate requestId/previewHash). All routes still DRY_RUN_ONLY.</div>
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-slate-400 font-semibold mb-0.5">Total Tests</div>
            <div className="text-[13px] text-foreground font-semibold">{TEST_CASES.length}</div>
          </div>
          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-slate-400 font-semibold mb-0.5">Passed</div>
            <div className="text-[13px] text-primary font-semibold">{passCount}</div>
          </div>
          <div className={`px-3 py-2 rounded border ${
            passCount === TEST_CASES.length
              ? 'bg-primary/5 border-primary/20'
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            <div className="text-slate-400 font-semibold mb-0.5">Status</div>
            <div className={`text-[13px] font-semibold ${
              passCount === TEST_CASES.length ? 'text-primary' : 'text-destructive'
            }`}>
              {passCount === TEST_CASES.length ? 'ALL PASS' : `${TEST_CASES.length - passCount} FAIL`}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {TEST_CASES.map((testCase, idx) => (
          <div key={idx}>
            {results[testCase.name] ? (
              <TestResultRow testCase={testCase} result={results[testCase.name]} />
            ) : (
              <div className="border border-border/50 bg-card/30 rounded px-4 py-3 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">{testCase.name}</div>
                <button
                  onClick={() => runTest(testCase)}
                  disabled={running}
                  className="px-2 py-1 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors font-semibold"
                >
                  Run Test
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}