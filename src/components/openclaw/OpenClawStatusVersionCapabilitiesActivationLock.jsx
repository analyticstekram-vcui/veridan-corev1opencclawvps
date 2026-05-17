/**
 * OpenClawStatusVersionCapabilitiesActivationLock — Phase 53
 * Final activation lock before the OpenClaw read-only status/version/capabilities backend route is implemented.
 * No OpenClaw calls, no backend calls, no secret values, no dispatch, no execution, no trading, no money movement.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PHASE52_CONTRACTS_KEY = 'openclawPhase52StatusVersionCapabilitiesContracts';
const LOCKS_KEY = 'openclawPhase53StatusVersionCapabilitiesActivationLocks';

const LOCKED_ENDPOINTS = ['/status', '/version', '/capabilities'];

const PROHIBITED_FUTURE_BEHAVIORS = [
  'RETURN_SECRET_VALUE',
  'LOG_SECRET_VALUE',
  'SEND_SECRET_TO_CLIENT',
  'RETURN_RAW_OPENCLAW_RESPONSE_BODY',
  'DISPATCH_COMMAND',
  'EXECUTE_ACTION',
  'TRADE',
  'MOVE_MONEY',
  'BROWSER_AUTOMATION',
  'SCHEDULER',
  'POLLING',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isValidPhase52Contract(c) {
  if (!c) return false;
  if (c.contractMode !== 'OPENCLAW_STATUS_VERSION_CAPABILITIES_CONTRACT') return false;
  if (c.proposedBackendRoute !== '/api/openclaw/read-only/status-version-capabilities') return false;
  if (c.proposedBackendMethod !== 'POST') return false;
  if (!Array.isArray(c.allowedOpenClawEndpoints)) return false;
  if (!c.allowedOpenClawEndpoints.includes('/status')) return false;
  if (!c.allowedOpenClawEndpoints.includes('/version')) return false;
  if (!c.allowedOpenClawEndpoints.includes('/capabilities')) return false;
  if (c.allowedOpenClawMethod !== 'GET') return false;
  if (c.allowedPurpose !== 'READ_ONLY_STATUS_VERSION_CAPABILITIES') return false;
  if (c.requiredPriorHealthEvidence !== true) return false;
  if (c.requiredPriorHealthEndpoint !== '/health') return false;
  if (!c.expectedResponseShape) return false;
  if (c.expectedResponseShape.openClawResponsesRedacted !== true) return false;
  if (c.expectedResponseShape.rawResponseBodiesReturned !== false) return false;
  if (c.expectedResponseShape.secretValuesReturned !== false) return false;
  if (c.expectedResponseShape.dispatchPerformed !== false) return false;
  if (c.expectedResponseShape.executionPerformed !== false) return false;
  if (c.expectedResponseShape.tradingPerformed !== false) return false;
  if (c.expectedResponseShape.moneyMovementPerformed !== false) return false;
  if (c.openClawCallAllowedNow !== false) return false;
  if (c.backendImplementationAllowedNow !== false) return false;
  if (c.dispatchAllowed !== false) return false;
  if (c.executionAllowed !== false) return false;
  if (c.tradingAllowed !== false) return false;
  if (c.moneyMovementAllowed !== false) return false;
  if (c.browserAutomationAllowed !== false) return false;
  if (c.schedulerAllowed !== false) return false;
  if (c.pollingAllowed !== false) return false;
  if (c.secretValueExposureAllowed !== false) return false;
  if (c.rawResponseExposureAllowed !== false) return false;
  if (c.dryRunOnly !== true) return false;
  if (c.actualExecutionStatus !== 'NOT_EXECUTED') return false;
  if (c.safetyLockStatus !== 'LOCKED') return false;
  return true;
}

function generateActivationLock(contract) {
  return {
    svcActivationLockId: `svclock53-${contract.svcContractId}-${Date.now()}`,
    sourceSvcContractId: contract.svcContractId,
    sourceHealthEvidenceRecordId: contract.sourceHealthEvidenceRecordId,
    sourcePhase50ResultId: contract.sourcePhase50ResultId,
    sourceHealthCheckActivationLockId: contract.sourceHealthCheckActivationLockId,
    generatedAt: new Date().toISOString(),
    activationLockMode: 'OPENCLAW_STATUS_VERSION_CAPABILITIES_ACTIVATION_LOCK',
    lockedBackendRoute: '/api/openclaw/read-only/status-version-capabilities',
    lockedOpenClawEndpoints: LOCKED_ENDPOINTS,
    lockedOpenClawMethod: 'GET',
    nextAllowedPhase: 'PHASE_54_OPENCLAW_STATUS_VERSION_CAPABILITIES_READ_ONLY_ROUTE',
    activationStatus: 'LOCKED_PENDING_OPERATOR_CONFIRMATION',
    backendImplementationAllowedNow: false,
    openClawCallAllowedNow: false,
    secretValueExposureAllowed: false,
    rawResponseExposureAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    tradingAllowed: false,
    moneyMovementAllowed: false,
    browserAutomationAllowed: false,
    schedulerAllowed: false,
    pollingAllowed: false,
    allowedFutureBackendBehavior: 'READ_ONLY_OPENCLAW_STATUS_VERSION_CAPABILITIES',
    allowedFutureResponseShape: {
      routeStatus: 'string',
      checkedAt: 'ISO_TIMESTAMP',
      openClawStatusSummary: 'object',
      openClawVersionSummary: 'object',
      openClawCapabilitiesSummary: 'object',
      openClawResponsesRedacted: true,
      rawResponseBodiesReturned: false,
      secretValuesReturned: false,
      dispatchPerformed: false,
      executionPerformed: false,
      tradingPerformed: false,
      moneyMovementPerformed: false,
      browserAutomationPerformed: false,
      schedulerPerformed: false,
      pollingPerformed: false,
    },
    prohibitedFutureBehaviors: PROHIBITED_FUTURE_BEHAVIORS,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawStatusVersionCapabilitiesActivationLock() {
  const [locks, setLocks] = useState(() => loadJSON(LOCKS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedLock, setExpandedLock] = useState(null);

  const handleGenerate = () => {
    try {
      const contractBatches = loadJSON(PHASE52_CONTRACTS_KEY, []);

      if (contractBatches.length === 0) {
        setLastAction('No Phase 52 contract batches found — generate contracts first');
        return;
      }

      const allContracts = contractBatches.flatMap(b => b.contracts || []);
      const validContracts = allContracts.filter(isValidPhase52Contract);

      if (validContracts.length === 0) {
        setLastAction('No valid Phase 52 contracts found — all 31 gate conditions must be satisfied');
        return;
      }

      const generated = validContracts.map(c => generateActivationLock(c));

      const batch = {
        lockBatchId: `batch-${Date.now()}`,
        batchType: 'PHASE_53_STATUS_VERSION_CAPABILITIES_ACTIVATION_LOCK',
        generatedAt: new Date().toISOString(),
        totalLocks: generated.length,
        activationLocks: generated,
      };

      try {
        localStorage.setItem(LOCKS_KEY, JSON.stringify([batch, ...locks].slice(0, 50)));
      } catch {}

      setLocks([batch, ...locks].slice(0, 50));
      setLastAction(`Generated ${generated.length} activation locks from valid Phase 52 contracts`);
    } catch (err) {
      setLastAction('Activation lock generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (locks.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(locks[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest lock batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(LOCKS_KEY);
      setLocks([]);
      setLastAction('All activation locks cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = locks.length > 0 ? locks[0] : null;
  const latestLock = latestBatch?.activationLocks?.[0] ?? null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 53 · OpenClaw Status / Version / Capabilities Activation Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Status / Version / Capabilities Activation Lock
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Final checkpoint before Phase 54 backend route implementation. Does not call OpenClaw or implement the route.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_53_OPENCLAW_STATUS_VERSION_CAPABILITIES_ACTIVATION_LOCK</span>
      </div>

      {/* Summary stats */}
      {latestLock && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Locks</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalLocks}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Locked Route</div>
            <div className="text-[7px] font-mono text-primary truncate">/read-only/status-version-capabilities</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Activation Status</div>
            <div className="text-[8px] font-bold text-amber-500">{latestLock.activationStatus}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Next Phase</div>
            <div className="text-[7px] font-mono text-primary">PHASE_54</div>
          </div>
        </div>
      )}

      {/* Lock spec */}
      {latestLock && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Activation Lock Specification</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestLock.generatedAt).toLocaleString()}</span>
          </div>

          {/* Key fields */}
          <div className="px-4 py-3 border-b border-border/30 grid grid-cols-2 gap-3 text-[8px]">
            {[
              ['activationLockMode', latestLock.activationLockMode],
              ['lockedBackendRoute', latestLock.lockedBackendRoute],
              ['lockedOpenClawMethod', latestLock.lockedOpenClawMethod],
              ['nextAllowedPhase', latestLock.nextAllowedPhase],
              ['activationStatus', latestLock.activationStatus],
              ['allowedFutureBackendBehavior', latestLock.allowedFutureBackendBehavior],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[7px]">{label}</span>
                <span className="font-mono font-semibold text-primary text-[8px] break-words">{val}</span>
              </div>
            ))}
          </div>

          {/* Locked endpoints */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Locked OpenClaw Endpoints</div>
            <div className="flex flex-wrap gap-1.5">
              {latestLock.lockedOpenClawEndpoints.map(ep => (
                <span key={ep} className="text-[8px] font-mono px-2 py-1 bg-primary/5 border border-primary/20 text-primary rounded">{ep}</span>
              ))}
            </div>
          </div>

          {/* Prohibited future behaviors */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Prohibited Future Behaviors ({PROHIBITED_FUTURE_BEHAVIORS.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {PROHIBITED_FUTURE_BEHAVIORS.map(b => (
                <span key={b} className="text-[7px] font-mono px-2 py-1 bg-destructive/5 border border-destructive/20 text-destructive rounded">{b}</span>
              ))}
            </div>
          </div>

          {/* Safety flags */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
            {[
              ['backendImplementationAllowedNow', latestLock.backendImplementationAllowedNow],
              ['openClawCallAllowedNow', latestLock.openClawCallAllowedNow],
              ['dispatchAllowed', latestLock.dispatchAllowed],
              ['executionAllowed', latestLock.executionAllowed],
              ['tradingAllowed', latestLock.tradingAllowed],
              ['moneyMovementAllowed', latestLock.moneyMovementAllowed],
              ['secretValueExposureAllowed', latestLock.secretValueExposureAllowed],
              ['rawResponseExposureAllowed', latestLock.rawResponseExposureAllowed],
              ['safetyLockStatus', latestLock.safetyLockStatus],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-400">{label}: <span className="font-bold text-primary">{String(val)}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate OpenClaw Status / Version / Capabilities Activation Lock
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Activation Lock JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={locks.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Locks
        </button>
      </div>

      {/* Activation locks table */}
      {latestBatch && latestBatch.activationLocks && latestBatch.activationLocks.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Activation Locks ({latestBatch.activationLocks.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Exec Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Safety Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.activationLocks.map((l, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{l.svcActivationLockId}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[7px]">{l.activationLockMode}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">{l.actualExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{l.safetyLockStatus}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedLock(expandedLock === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedLock === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded lock details */}
          {expandedLock !== null && latestBatch.activationLocks[expandedLock] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Activation Lock — {latestBatch.activationLocks[expandedLock].svcActivationLockId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.activationLocks[expandedLock], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Activation Lock Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This is an activation lock only',
            'It does not call OpenClaw',
            'It does not implement the backend route',
            'It does not dispatch commands',
            'It does not execute actions',
            'It does not expose secrets',
            'It does not expose raw OpenClaw response bodies',
            'It does not trade or move money',
            'It only prepares the final checkpoint before Phase 54',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Lock Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{LOCKS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only activation lock. No fetch, no OpenClaw calls, no backend calls, no secret values, no raw response body, no execution, no dispatch.
      </div>
    </div>
  );
}