/**
 * OpenClawControlledReadOnlyConnectorTestPlan — Phase 37
 * Creates local-only test plans for future controlled read-only connector checks.
 * No OpenClaw calls, no backend APIs, no execution. Test plan generation only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertCircle, ChevronDown } from 'lucide-react';

const VALIDATION_RESULTS_KEY = 'openclawPhase36ReadOnlyConnectorContractValidationResults';
const TEST_PLAN_KEY = 'openclawPhase37ControlledReadOnlyConnectorTestPlans';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];
const ALLOWED_METHOD = 'GET';
const BLOCKED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateTestPlan(validationResult) {
  return {
    testPlanId: `plan-${validationResult.connectorValidationId}-${Date.now()}`,
    sourceConnectorValidationId: validationResult.connectorValidationId,
    sourceConnectorContractId: validationResult.sourceConnectorContractId,
    sourceRequestId: validationResult.sourceRequestId,
    generatedAt: new Date().toISOString(),
    testPlanMode: 'READ_ONLY_TEST_PLAN',
    allowedEndpoints: ALLOWED_ENDPOINTS,
    allowedMethod: ALLOWED_METHOD,
    blockedMethods: BLOCKED_METHODS,
    openClawCallAllowed: false,
    backendCallAllowed: false,
    apiCallAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawControlledReadOnlyConnectorTestPlan() {
  const [testPlans, setTestPlans] = useState(() => loadJSON(TEST_PLAN_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  const handleGenerateTestPlan = () => {
    try {
      const validationBatches = loadJSON(VALIDATION_RESULTS_KEY, []);

      if (validationBatches.length === 0) {
        setLastAction('No Phase 36 validation results found');
        return;
      }

      const latestBatch = validationBatches[0];

      if (!latestBatch.validationResults || latestBatch.validationResults.length === 0) {
        setLastAction('No validation results in latest batch');
        return;
      }

      // Filter for PASS results only
      const passResults = latestBatch.validationResults.filter(
        r =>
          r.validationStatus === 'PASS' &&
          r.connectorSafetyStatus === 'LOCKED' &&
          r.futureConnectorEligible === true &&
          r.actualExecutionStatus === 'NOT_EXECUTED'
      );

      if (passResults.length === 0) {
        setLastAction('No PASS validation results found (all results must be PASS + LOCKED + ELIGIBLE + NOT_EXECUTED)');
        return;
      }

      // Generate test plans
      const generatedPlans = passResults.map(result => generateTestPlan(result));

      const testPlanBatch = {
        testPlanBatchId: `batch-${Date.now()}`,
        testPlanType: 'PHASE_37_CONTROLLED_READONLY_CONNECTOR_TEST_PLAN',
        generatedAt: new Date().toISOString(),
        sourceValidationBatchId: latestBatch.validationBatchId,
        totalTestPlans: generatedPlans.length,
        testPlans: generatedPlans,
      };

      try {
        localStorage.setItem(TEST_PLAN_KEY, JSON.stringify([testPlanBatch, ...testPlans].slice(0, 50)));
      } catch {}

      setTestPlans([testPlanBatch, ...testPlans].slice(0, 50));
      setLastAction(`Generated ${generatedPlans.length} test plans from PASS validations`);
    } catch (err) {
      setLastAction('Test plan generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (testPlans.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(testPlans[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest test plan batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(TEST_PLAN_KEY);
      setTestPlans([]);
      setLastAction('All test plans cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = testPlans.length > 0 ? testPlans[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 37 · Controlled Read-Only Connector Test Plan</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Controlled Read-Only Connector Test Plan
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Creates local-only test plans for future controlled read-only connector checks without calling anything.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_37_CONTROLLED_READONLY_CONNECTOR_TEST_PLAN</span>
      </div>

      {/* Test plan summary */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Plans</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalTestPlans}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Allowed Endpoints</div>
            <div className="text-[18px] font-bold text-primary">{ALLOWED_ENDPOINTS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Blocked Methods</div>
            <div className="text-[18px] font-bold text-destructive">{BLOCKED_METHODS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Test plan specification */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Test Plan Specification</span>
        </div>
        <div className="space-y-2 px-4 py-3">
          <div className="text-[8px] space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Mode: <span className="font-mono font-semibold text-primary">READ_ONLY_TEST_PLAN</span></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-slate-300">Allowed Endpoints: <span className="font-mono font-semibold text-primary">{ALLOWED_ENDPOINTS.join(', ')}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">Allowed Method: <span className="font-mono font-semibold text-primary">{ALLOWED_METHOD}</span></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <span className="text-slate-300">Blocked Methods: <span className="font-mono font-semibold text-destructive">{BLOCKED_METHODS.join(', ')}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Last action feedback */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateTestPlan}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Read-Only Connector Test Plan
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Test Plan JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={testPlans.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Test Plans
        </button>
      </div>

      {/* Test plans table */}
      {latestBatch && latestBatch.testPlans && latestBatch.testPlans.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Test Plans ({latestBatch.testPlans.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Endpoints</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.testPlans.map((plan, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{plan.sourceRequestId}</td>
                    <td className="px-3 py-2.5 text-primary font-semibold text-[8px]">{plan.testPlanMode}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-[8px]">{plan.allowedEndpoints.length} endpoints</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[8px] font-semibold text-primary">LOCKED</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedPlan(expandedPlan === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedPlan === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded plan details */}
          {expandedPlan !== null && latestBatch.testPlans[expandedPlan] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Test Plan Details — {latestBatch.testPlans[expandedPlan].sourceRequestId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.testPlans[expandedPlan], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Test Plan Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          This is a test plan only. It does NOT call OpenClaw, backend APIs, dispatch commands, trade, enter credentials, schedule tasks, poll, use browser automation, use wallets, or move money. Test plan generation is local-only, non-executable design work.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>This is a plan only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call OpenClaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not call backend APIs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not dispatch commands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Does not trade, enter credentials, schedule, poll, or move money</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Local-only test plan design work</span>
          </div>
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Test Plan Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{TEST_PLAN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only test plan. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}