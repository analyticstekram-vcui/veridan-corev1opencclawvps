/**
 * OpenClawStatusVersionCapabilitiesContract — Phase 52
 * Defines a local-only contract for the next OpenClaw read-only expansion.
 * No OpenClaw calls, no backend calls, no secret values, no dispatch, no execution, no trading, no money movement.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PHASE51_EVIDENCE_KEY = 'openclawPhase51HealthCheckEvidenceRecords';
const CONTRACTS_KEY = 'openclawPhase52StatusVersionCapabilitiesContracts';

const ALLOWED_ENDPOINTS = ['/status', '/version', '/capabilities'];

const PROHIBITED_BEHAVIORS = [
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

function isValidPhase51Evidence(r) {
  if (!r) return false;
  if (r.evidenceMode !== 'OPENCLAW_READ_ONLY_HEALTH_CHECK_EVIDENCE') return false;
  if (r.routeChecked !== '/api/openclaw/read-only/health-check') return false;
  if (r.openClawEndpoint !== '/health') return false;
  if (r.openClawMethod !== 'GET') return false;
  if (r.backendCheckMode !== 'OPENCLAW_READ_ONLY_HEALTH_CHECK') return false;
  if (r.responseRedactionVerified !== true) return false;
  if (r.rawResponseBodyReturned !== false) return false;
  if (r.secretValuesReturned !== false) return false;
  if (r.openClawResponseRedacted !== true) return false;
  if (r.dispatchPerformed !== false) return false;
  if (r.executionPerformed !== false) return false;
  if (r.tradingPerformed !== false) return false;
  if (r.moneyMovementPerformed !== false) return false;
  if (r.browserAutomationPerformed !== false) return false;
  if (r.schedulerPerformed !== false) return false;
  if (r.pollingPerformed !== false) return false;
  if (r.evidenceStatus !== 'RECORDED') return false;
  if (r.nextAllowedPhase !== 'PHASE_52_OPENCLAW_STATUS_VERSION_CAPABILITIES_CONTRACT') return false;
  if (r.actualExecutionStatus !== 'READ_ONLY_HEALTH_CHECK_ONLY') return false;
  if (r.safetyLockStatus !== 'LOCKED') return false;
  return true;
}

function generateContract(evidenceRecord) {
  return {
    svcContractId: `svc52-${evidenceRecord.evidenceRecordId}-${Date.now()}`,
    sourceHealthEvidenceRecordId: evidenceRecord.evidenceRecordId,
    sourcePhase50ResultId: evidenceRecord.sourcePhase50ResultId,
    sourceHealthCheckActivationLockId: evidenceRecord.sourceHealthCheckActivationLockId,
    generatedAt: new Date().toISOString(),
    contractMode: 'OPENCLAW_STATUS_VERSION_CAPABILITIES_CONTRACT',
    proposedBackendRoute: '/api/openclaw/read-only/status-version-capabilities',
    proposedBackendMethod: 'POST',
    allowedOpenClawEndpoints: ALLOWED_ENDPOINTS,
    allowedOpenClawMethod: 'GET',
    allowedPurpose: 'READ_ONLY_STATUS_VERSION_CAPABILITIES',
    requiredPriorHealthEvidence: true,
    requiredPriorHealthEndpoint: '/health',
    expectedResponseShape: {
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
    },
    prohibitedBehaviors: PROHIBITED_BEHAVIORS,
    openClawCallAllowedNow: false,
    backendImplementationAllowedNow: false,
    dispatchAllowed: false,
    executionAllowed: false,
    tradingAllowed: false,
    moneyMovementAllowed: false,
    browserAutomationAllowed: false,
    schedulerAllowed: false,
    pollingAllowed: false,
    secretValueExposureAllowed: false,
    rawResponseExposureAllowed: false,
    dryRunOnly: true,
    actualExecutionStatus: 'NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawStatusVersionCapabilitiesContract() {
  const [contracts, setContracts] = useState(() => loadJSON(CONTRACTS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedContract, setExpandedContract] = useState(null);

  const handleGenerate = () => {
    try {
      const evidenceBatches = loadJSON(PHASE51_EVIDENCE_KEY, []);

      if (evidenceBatches.length === 0) {
        setLastAction('No Phase 51 evidence batches found — generate evidence records first');
        return;
      }

      const allRecords = evidenceBatches.flatMap(b => b.evidenceRecords || []);
      const validRecords = allRecords.filter(isValidPhase51Evidence);

      if (validRecords.length === 0) {
        setLastAction('No valid Phase 51 evidence records found — all 20 gate conditions must be satisfied');
        return;
      }

      const generated = validRecords.map(r => generateContract(r));

      const batch = {
        contractBatchId: `batch-${Date.now()}`,
        batchType: 'PHASE_52_STATUS_VERSION_CAPABILITIES_CONTRACT',
        generatedAt: new Date().toISOString(),
        totalContracts: generated.length,
        contracts: generated,
      };

      try {
        localStorage.setItem(CONTRACTS_KEY, JSON.stringify([batch, ...contracts].slice(0, 50)));
      } catch {}

      setContracts([batch, ...contracts].slice(0, 50));
      setLastAction(`Generated ${generated.length} contracts from valid Phase 51 evidence records`);
    } catch (err) {
      setLastAction('Contract generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (contracts.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(contracts[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest contract batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(CONTRACTS_KEY);
      setContracts([]);
      setLastAction('All contracts cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = contracts.length > 0 ? contracts[0] : null;
  const latestContract = latestBatch?.contracts?.[0] ?? null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 52 · OpenClaw Status / Version / Capabilities Contract</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Status / Version / Capabilities Contract
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Defines a local-only contract for the next read-only OpenClaw expansion. Does not call OpenClaw.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_52_OPENCLAW_STATUS_VERSION_CAPABILITIES_CONTRACT</span>
      </div>

      {/* Summary stats */}
      {latestContract && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Contracts</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalContracts}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Proposed Route</div>
            <div className="text-[7px] font-mono text-primary truncate">/read-only/status-version-capabilities</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Allowed Endpoints</div>
            <div className="text-[18px] font-bold text-primary">{ALLOWED_ENDPOINTS.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Exec Status</div>
            <div className="text-[9px] font-bold text-amber-500">{latestContract.actualExecutionStatus}</div>
          </div>
        </div>
      )}

      {/* Contract spec */}
      {latestContract && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Contract Specification</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestContract.generatedAt).toLocaleString()}</span>
          </div>

          {/* Route info */}
          <div className="px-4 py-3 border-b border-border/30 grid grid-cols-2 gap-3 text-[8px]">
            {[
              ['contractMode', latestContract.contractMode],
              ['proposedBackendRoute', latestContract.proposedBackendRoute],
              ['proposedBackendMethod', latestContract.proposedBackendMethod],
              ['allowedOpenClawMethod', latestContract.allowedOpenClawMethod],
              ['allowedPurpose', latestContract.allowedPurpose],
              ['safetyLockStatus', latestContract.safetyLockStatus],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[7px]">{label}</span>
                <span className="font-mono font-semibold text-primary text-[8px] break-words">{val}</span>
              </div>
            ))}
          </div>

          {/* Allowed endpoints */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Allowed OpenClaw Endpoints ({ALLOWED_ENDPOINTS.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_ENDPOINTS.map(ep => (
                <span key={ep} className="text-[8px] font-mono px-2 py-1 bg-primary/5 border border-primary/20 text-primary rounded">{ep}</span>
              ))}
            </div>
          </div>

          {/* Prohibited behaviors */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Prohibited Behaviors ({PROHIBITED_BEHAVIORS.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {PROHIBITED_BEHAVIORS.map(b => (
                <span key={b} className="text-[7px] font-mono px-2 py-1 bg-destructive/5 border border-destructive/20 text-destructive rounded">{b}</span>
              ))}
            </div>
          </div>

          {/* Safety flags */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
            {[
              ['openClawCallAllowedNow', latestContract.openClawCallAllowedNow],
              ['backendImplementationAllowedNow', latestContract.backendImplementationAllowedNow],
              ['dispatchAllowed', latestContract.dispatchAllowed],
              ['executionAllowed', latestContract.executionAllowed],
              ['tradingAllowed', latestContract.tradingAllowed],
              ['moneyMovementAllowed', latestContract.moneyMovementAllowed],
              ['secretValueExposureAllowed', latestContract.secretValueExposureAllowed],
              ['rawResponseExposureAllowed', latestContract.rawResponseExposureAllowed],
              ['dryRunOnly', latestContract.dryRunOnly],
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
          Generate OpenClaw Status / Version / Capabilities Contract
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Contract JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={contracts.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Contracts
        </button>
      </div>

      {/* Contracts table */}
      {latestBatch && latestBatch.contracts && latestBatch.contracts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Contracts ({latestBatch.contracts.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Contract ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Exec Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.contracts.map((c, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{c.svcContractId}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[7px]">{c.contractMode}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">{c.actualExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{c.safetyLockStatus}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedContract(expandedContract === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedContract === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded contract details */}
          {expandedContract !== null && latestBatch.contracts[expandedContract] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Contract — {latestBatch.contracts[expandedContract].svcContractId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.contracts[expandedContract], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Contract Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This is a contract only',
            'It does not call OpenClaw',
            'It does not call backend functions',
            'It does not dispatch commands',
            'It does not execute actions',
            'It does not expose secrets',
            'It does not expose raw OpenClaw response bodies',
            'It does not trade or move money',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Contract Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{CONTRACTS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only contract. No fetch, no OpenClaw calls, no backend calls, no secret values, no raw response body, no execution, no dispatch.
      </div>
    </div>
  );
}