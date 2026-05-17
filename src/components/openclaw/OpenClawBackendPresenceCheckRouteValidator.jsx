/**
 * OpenClawBackendPresenceCheckRouteValidator — Phase 42
 * Validates Phase 41 backend presence check route contracts locally.
 * No process.env access, no secret reading, no backend API calls. Local validation only.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown, XCircle } from 'lucide-react';

const ROUTE_CONTRACT_KEY = 'openclawPhase41BackendPresenceCheckRouteContracts';
const VALIDATION_RESULTS_KEY = 'openclawPhase42BackendPresenceCheckRouteValidationResults';

const REQUIRED_ENV_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

const REQUIRED_PROHIBITED_FIELDS = [
  'secretValue',
  'rawValue',
  'token',
  'credential',
  'password',
  'clientSecret',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function validateRouteContract(contract) {
  const failures = [];

  if (!contract.presenceRouteContractId) failures.push('presenceRouteContractId is missing');
  if (contract.routeContractMode !== 'BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT') failures.push('routeContractMode must be BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT');
  if (contract.proposedBackendRoute !== '/api/openclaw/read-only/env-presence-check') failures.push('proposedBackendRoute must be /api/openclaw/read-only/env-presence-check');
  if (contract.allowedBackendMethod !== 'POST') failures.push('allowedBackendMethod must be POST');
  if (contract.backendBehavior !== 'CHECK_ENV_KEY_PRESENCE_ONLY') failures.push('backendBehavior must be CHECK_ENV_KEY_PRESENCE_ONLY');

  // Required env keys
  const contractKeys = contract.requiredEnvironmentKeys || [];
  for (const key of REQUIRED_ENV_KEYS) {
    if (!contractKeys.includes(key)) failures.push(`requiredEnvironmentKeys missing: ${key}`);
  }

  // allowedResponseShape checks
  if (!contract.allowedResponseShape) {
    failures.push('allowedResponseShape is missing');
  } else {
    if (contract.allowedResponseShape.secretValuesReturned !== false) failures.push('allowedResponseShape.secretValuesReturned must be false');
    const keys = contract.allowedResponseShape.keys || [];
    const hasRedacted = keys.some(k => k.value === 'REDACTED_NEVER_RETURNED');
    if (!hasRedacted) failures.push('allowedResponseShape.keys must contain value marker REDACTED_NEVER_RETURNED');
  }

  // Prohibited response fields
  const contractProhibited = contract.prohibitedResponseFields || [];
  for (const field of REQUIRED_PROHIBITED_FIELDS) {
    if (!contractProhibited.includes(field)) failures.push(`prohibitedResponseFields missing: ${field}`);
  }

  // Safety flags
  if (contract.processEnvAccessAllowedInFrontend !== false) failures.push('processEnvAccessAllowedInFrontend must be false');
  if (contract.secretValueExposureAllowed !== false) failures.push('secretValueExposureAllowed must be false');
  if (contract.clientSideSecretAccessAllowed !== false) failures.push('clientSideSecretAccessAllowed must be false');
  if (contract.backendOnlySecretAccessRequired !== true) failures.push('backendOnlySecretAccessRequired must be true');
  if (contract.openClawCallAllowed !== false) failures.push('openClawCallAllowed must be false');
  if (contract.apiCallAllowed !== false) failures.push('apiCallAllowed must be false');
  if (contract.executionAllowed !== false) failures.push('executionAllowed must be false');
  if (contract.dispatchAllowed !== false) failures.push('dispatchAllowed must be false');
  if (contract.dryRunOnly !== true) failures.push('dryRunOnly must be true');
  if (contract.actualExecutionStatus !== 'NOT_EXECUTED') failures.push('actualExecutionStatus must be NOT_EXECUTED');
  if (contract.safetyLockStatus !== 'LOCKED') failures.push('safetyLockStatus must be LOCKED');

  const passed = failures.length === 0;
  return {
    presenceRouteValidationId: `val-${contract.presenceRouteContractId}-${Date.now()}`,
    sourcePresenceRouteContractId: contract.presenceRouteContractId,
    sourcePresenceCheckPlanId: contract.sourcePresenceCheckPlanId,
    sourceEnvironmentBoundaryId: contract.sourceEnvironmentBoundaryId,
    sourceRouteContractId: contract.sourceRouteContractId,
    sourceRequestId: contract.sourceRequestId,
    validatedAt: new Date().toISOString(),
    validationStatus: passed ? 'PASS' : 'FAIL',
    failureReasons: failures,
    secretSafetyStatus: passed ? 'LOCKED' : 'BROKEN',
    futureBackendImplementationEligible: passed,
    actualExecutionStatus: 'NOT_EXECUTED',
  };
}

export default function OpenClawBackendPresenceCheckRouteValidator() {
  const [validationResults, setValidationResults] = useState(() => loadJSON(VALIDATION_RESULTS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);

  const handleValidate = () => {
    try {
      const contractBatches = loadJSON(ROUTE_CONTRACT_KEY, []);

      if (contractBatches.length === 0) {
        setLastAction('No Phase 41 route contracts found');
        return;
      }

      const latestBatch = contractBatches[0];

      if (!latestBatch.presenceCheckRouteContracts || latestBatch.presenceCheckRouteContracts.length === 0) {
        setLastAction('No route contracts in latest batch');
        return;
      }

      const results = latestBatch.presenceCheckRouteContracts.map(validateRouteContract);
      const passCount = results.filter(r => r.validationStatus === 'PASS').length;
      const failCount = results.filter(r => r.validationStatus === 'FAIL').length;

      const resultBatch = {
        validationBatchId: `batch-${Date.now()}`,
        validationType: 'PHASE_42_BACKEND_PRESENCE_CHECK_ROUTE_VALIDATOR',
        validatedAt: new Date().toISOString(),
        sourceContractBatchId: latestBatch.contractBatchId,
        totalContractsChecked: results.length,
        passCount,
        failCount,
        validationResults: results,
      };

      try {
        localStorage.setItem(VALIDATION_RESULTS_KEY, JSON.stringify([resultBatch, ...validationResults].slice(0, 50)));
      } catch {}

      setValidationResults([resultBatch, ...validationResults].slice(0, 50));
      setLastAction(`Validated ${results.length} contracts — ${passCount} PASS, ${failCount} FAIL`);
    } catch (err) {
      setLastAction('Validation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (validationResults.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(validationResults[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest validation batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(VALIDATION_RESULTS_KEY);
      setValidationResults([]);
      setLastAction('All validation results cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = validationResults.length > 0 ? validationResults[0] : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 42 · Backend Presence Check Route Validator</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Presence Check Route Validator
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Validates Phase 41 backend presence check route contracts locally before any future backend implementation.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_42_BACKEND_PRESENCE_CHECK_ROUTE_VALIDATOR</span>
      </div>

      {/* Summary stats */}
      {latestBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Checked</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalContractsChecked}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Passed</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.passCount}</div>
          </div>
          <div className={`bg-card border ${latestBatch.failCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Failed</div>
            <div className={`text-[18px] font-bold ${latestBatch.failCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>{latestBatch.failCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Validated</div>
            <div className="text-[9px] font-mono text-slate-300">{new Date(latestBatch.validatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Validation rules reference */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Rules (21 checks)</span>
        </div>
        <div className="px-4 py-3 text-[8px] space-y-0.5 text-slate-300">
          {[
            'presenceRouteContractId exists',
            'routeContractMode === BACKEND_PRESENCE_CHECK_ROUTE_CONTRACT',
            'proposedBackendRoute === /api/openclaw/read-only/env-presence-check',
            'allowedBackendMethod === POST',
            'backendBehavior === CHECK_ENV_KEY_PRESENCE_ONLY',
            'requiredEnvironmentKeys includes all 4 OpenClaw keys',
            'allowedResponseShape.secretValuesReturned === false',
            'allowedResponseShape.keys has REDACTED_NEVER_RETURNED marker',
            'prohibitedResponseFields includes all 6 secret field names',
            'processEnvAccessAllowedInFrontend === false',
            'secretValueExposureAllowed === false',
            'clientSideSecretAccessAllowed === false',
            'backendOnlySecretAccessRequired === true',
            'openClawCallAllowed === false',
            'apiCallAllowed === false',
            'executionAllowed === false',
            'dispatchAllowed === false',
            'dryRunOnly === true',
            'actualExecutionStatus === NOT_EXECUTED',
            'safetyLockStatus === LOCKED',
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last action */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleValidate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Validate Backend Presence Check Route Contracts
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Validation JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={validationResults.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Results
        </button>
      </div>

      {/* Results table */}
      {latestBatch && latestBatch.validationResults && latestBatch.validationResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Results ({latestBatch.validationResults.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Secret Safety</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Backend Eligible</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.validationResults.map((result, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{result.sourceRequestId || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {result.validationStatus === 'PASS'
                          ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                          : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                        <span className={`font-bold ${result.validationStatus === 'PASS' ? 'text-primary' : 'text-destructive'}`}>
                          {result.validationStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold text-[7px] ${result.secretSafetyStatus === 'LOCKED' ? 'text-primary' : 'text-destructive'}`}>
                        {result.secretSafetyStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold text-[7px] ${result.futureBackendImplementationEligible ? 'text-primary' : 'text-destructive'}`}>
                        {String(result.futureBackendImplementationEligible)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedResult === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded details */}
          {expandedResult !== null && latestBatch.validationResults[expandedResult] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Validation Details — {latestBatch.validationResults[expandedResult].sourceRequestId || latestBatch.validationResults[expandedResult].presenceRouteValidationId}
              </div>
              {latestBatch.validationResults[expandedResult].failureReasons?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[8px] font-semibold text-destructive uppercase tracking-wider">Failure Reasons:</div>
                  {latestBatch.validationResults[expandedResult].failureReasons.map((reason, ri) => (
                    <div key={ri} className="flex items-center gap-2 text-[8px] text-destructive/80">
                      <XCircle className="w-3 h-3 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.validationResults[expandedResult], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Validator Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          Validator is local-only. It does NOT access process.env, read actual secret values, call backend functions, call OpenClaw, or dispatch commands. PASS only means eligible for future backend implementation, not execution. It does not trade, enter credentials, schedule, poll, use browser automation, use wallets, or move money.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          {[
            'Validator is local-only',
            'Does not access process.env',
            'Does not read actual secret values',
            'Does not call backend functions',
            'Does not call OpenClaw',
            'Does not dispatch commands',
            'PASS only means eligible for future backend implementation, not execution',
            'Does not trade, enter credentials, schedule, poll, or move money',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest batch JSON */}
      {latestBatch && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Validation Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.validatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{VALIDATION_RESULTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only validator. No fetch, no OpenClaw calls, no backend calls, no process.env, no secret reading, no execution, no dispatch.
      </div>
    </div>
  );
}