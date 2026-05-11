import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCw } from 'lucide-react';

const TESTS = [
  {
    id: 'approved_safe',
    name: 'Approved safe proposal should simulate successfully',
    proposal: {
      proposalId: 'test_approved_safe_001',
      status: 'APPROVED',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    },
    expectedResult: 'SUCCESS',
  },
  {
    id: 'draft_blocked',
    name: 'Draft proposal should be blocked',
    proposal: {
      proposalId: 'test_draft_blocked_001',
      status: 'DRAFT',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    },
    expectedResult: 'BLOCKED',
  },
  {
    id: 'denied_blocked',
    name: 'Denied proposal should be blocked',
    proposal: {
      proposalId: 'test_denied_blocked_001',
      status: 'DENIED',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    },
    expectedResult: 'BLOCKED',
  },
  {
    id: 'domain_not_allowlisted',
    name: 'Non-allowlisted domain should be blocked',
    proposal: {
      proposalId: 'test_domain_blocked_001',
      status: 'APPROVED',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://malicious.example.net',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    },
    expectedResult: 'BLOCKED',
  },
  {
    id: 'high_risk_blocked',
    name: 'HIGH risk proposal should be blocked',
    proposal: {
      proposalId: 'test_high_risk_blocked_001',
      status: 'APPROVED',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'HIGH',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    },
    expectedResult: 'BLOCKED',
  },
  {
    id: 'unsupported_command',
    name: 'Unsupported command type should be blocked',
    proposal: {
      proposalId: 'test_unsupported_cmd_001',
      status: 'APPROVED',
      commandType: 'DELETE_ALL_DATA',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    },
    expectedResult: 'BLOCKED',
  },
  {
    id: 'wrong_governance_mode',
    name: 'Wrong governance mode should be blocked',
    proposal: {
      proposalId: 'test_gov_mode_blocked_001',
      status: 'APPROVED',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'UNRESTRICTED',
    },
    expectedResult: 'BLOCKED',
  },
];

function TestRow({ test, result, loading, onRun }) {
  const passed = result && result.expectedResult === test.expectedResult;
  const statusColor = loading ? 'text-amber-500' : passed ? 'text-primary' : 'text-destructive';
  const statusIcon = loading ? <Loader2 className="w-3 h-3 animate-spin" /> : passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />;

  return (
    <div className="border-b border-border/20 last:border-0">
      {/* Summary row */}
      <div className="px-4 py-3 hover:bg-secondary/20 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold ${statusColor}`}>{statusIcon}</span>
              <span className="text-[11px] font-semibold text-foreground">{test.name}</span>
            </div>
            <div className="text-[9px] text-muted-foreground/60 ml-5">
              Expected: <span className="text-muted-foreground">{test.expectedResult}</span>
              {result && (
                <>
                  {' '}• Actual: <span className={passed ? 'text-primary' : 'text-destructive'}>{result.actualResult}</span></>
              )}
            </div>
          </div>
          <button
            onClick={() => onRun(test)}
            disabled={loading}
            className="px-3 py-1.5 text-[9px] border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
            {loading ? 'Running' : 'Run'}
          </button>
        </div>

        {/* Result details */}
        {result && !loading && (
          <div className="mt-2 ml-5 space-y-1 text-[9px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-secondary/20 border border-border/20 px-2 py-1">
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Validation Status</div>
                <div className={`font-mono text-[8px] ${result.backendValidationStatus === 'PASSED' ? 'text-primary' : result.backendValidationStatus === 'BLOCKED' ? 'text-destructive' : 'text-amber-500'}`}>
                  {result.backendValidationStatus}
                </div>
              </div>
              <div className="bg-secondary/20 border border-border/20 px-2 py-1">
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Execution Status</div>
                <div className="font-mono text-[8px] text-foreground">{result.executionStatus || '—'}</div>
              </div>
              <div className="bg-secondary/20 border border-border/20 px-2 py-1">
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Mode</div>
                <div className="font-mono text-[8px] text-foreground">{result.executionMode || '—'}</div>
              </div>
              <div className="bg-secondary/20 border border-border/20 px-2 py-1">
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Trace</div>
                <div className="font-mono text-[8px] text-muted-foreground/70 truncate">{result.auditTraceId?.slice(0, 12)}...</div>
              </div>
              {result.error && (
                <div className="col-span-2 md:col-span-4 bg-destructive/5 border border-destructive/20 px-2 py-1">
                  <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Error</div>
                  <div className="font-mono text-[8px] text-destructive break-all">{result.error}</div>
                </div>
              )}
              {result.validationErrors && result.validationErrors.length > 0 && (
                <div className="col-span-2 md:col-span-4 bg-destructive/5 border border-destructive/20 px-2 py-1">
                  <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Validation Errors</div>
                  <ul className="space-y-0.5">
                    {result.validationErrors.map((err, idx) => (
                      <li key={idx} className="font-mono text-[8px] text-destructive">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.transportError && (
                <div className="col-span-2 md:col-span-4 bg-destructive/5 border border-destructive/20 px-2 py-1">
                  <div className="text-muted-foreground/60 uppercase tracking-wider text-[8px] mb-0.5">Transport Error</div>
                  <div className="font-mono text-[8px] text-destructive">{result.transportError}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExecutionSafetyTests() {
  const [results, setResults] = useState({});
  const [loadingTests, setLoadingTests] = useState(new Set());
  const [overallLoading, setOverallLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      setIsAuthenticated(authed);
    });
  }, []);

  const runTest = async (test) => {
    setLoadingTests(prev => new Set([...prev, test.id]));
    try {
      // Pass the full proposal so backend can validate all fields
      const res = await base44.functions.invoke('executeOpenClawProposal', {
        proposalId: test.proposal.proposalId,
        status: test.proposal.status,
        commandType: test.proposal.commandType,
        targetUrl: test.proposal.targetUrl,
        selector: test.proposal.selector,
        riskTier: test.proposal.riskTier,
        governanceMode: test.proposal.governanceMode,
      });

      // Determine actual result based on backend response
      // BLOCKED is when backend validation fails (validationErrors present or status indicates failure)
      const hasValidationErrors = res.data?.validationErrors && res.data.validationErrors.length > 0;
      const backendStatus = res.data?.backendValidationStatus;
      const actualResult = (hasValidationErrors || backendStatus === 'FAILED') ? 'BLOCKED' : 'SUCCESS';
      const passed = actualResult === test.expectedResult;

      setResults(prev => ({
        ...prev,
        [test.id]: {
          expectedResult: test.expectedResult,
          actualResult,
          passed,
          backendValidationStatus: backendStatus || 'UNKNOWN',
          executionStatus: res.data?.status || res.data?.executionStatus || null,
          executionMode: res.data?.executionMode || null,
          auditTraceId: res.data?.auditTraceId || null,
          error: res.data?.error || null,
          validationErrors: res.data?.validationErrors || null,
          transportError: null,
        },
      }));
    } catch (err) {
      // Distinguish auth errors from other transport errors
      const isAuthError = err.response?.status === 401 || err.response?.status === 403;
      const transportError = isAuthError ? 'AUTH_FAILED' : 'TRANSPORT_ERROR';
      
      setResults(prev => ({
        ...prev,
        [test.id]: {
          expectedResult: test.expectedResult,
          actualResult: 'ERROR',
          passed: false,
          backendValidationStatus: 'ERROR',
          executionStatus: null,
          executionMode: null,
          auditTraceId: null,
          error: err.message,
          validationErrors: null,
          transportError,
        },
      }));
    } finally {
      setLoadingTests(prev => {
        const next = new Set(prev);
        next.delete(test.id);
        return next;
      });
    }
  };

  const runAllTests = async () => {
    setOverallLoading(true);
    try {
      await Promise.all(TESTS.map(test => runTest(test)));
    } finally {
      setOverallLoading(false);
    }
  };

  const passedCount = Object.values(results).filter(r => r?.passed).length;
  const totalRun = Object.keys(results).length;

  // Show auth required message if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="bg-card border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-[11px] font-semibold text-foreground">Execution Safety Tests</div>
              <div className="text-[9px] text-muted-foreground/60">Validate proposal validation and governance enforcement</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Authentication Required</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 max-w-sm mx-auto">
            Tests require an authenticated session. Please log in to run the safety validation suite.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="bg-card border border-border p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-[10px] text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[11px] font-semibold text-foreground">Execution Safety Tests</div>
            <div className="text-[9px] text-muted-foreground/60">Validate proposal validation and governance enforcement</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalRun > 0 && (
            <div className="text-[10px] px-2 py-1 border border-border text-muted-foreground/70 font-mono">
              {passedCount}/{totalRun} passed
            </div>
          )}
          <button
            onClick={runAllTests}
            disabled={overallLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/10 text-[9px] text-primary uppercase tracking-wider font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {overallLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
            Run All Tests
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10 flex items-start gap-2">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-muted-foreground/70 leading-relaxed">
          These tests validate that the backend endpoint correctly enforces governance rules, domain allowlists, and command restrictions.
          Expected BLOCKED results indicate successful governance enforcement. Execution mode is SIMULATED by default.
        </div>
      </div>

      {/* Tests list */}
      <div className="max-h-[600px] overflow-auto">
        {TESTS.map(test => (
          <TestRow
            key={test.id}
            test={test}
            result={results[test.id]}
            loading={loadingTests.has(test.id)}
            onRun={runTest}
          />
        ))}
      </div>

      {/* Footer */}
      {totalRun === 0 && (
        <div className="px-4 py-6 text-center text-[10px] text-muted-foreground/50">
          Run tests to validate safety checks and governance enforcement.
        </div>
      )}
    </div>
  );
}