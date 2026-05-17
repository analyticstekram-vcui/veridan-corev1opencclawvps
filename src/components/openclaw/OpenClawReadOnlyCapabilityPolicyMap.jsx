/**
 * OpenClawReadOnlyCapabilityPolicyMap — Phase 56
 * Local-only capability policy map generated from Phase 55 evidence records.
 * No OpenClaw calls, no backend calls, no network, no secrets, no dispatch, no execution.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PHASE55_EVIDENCE_KEY = 'openclawPhase55StatusVersionCapabilitiesEvidenceRecords';
const POLICY_MAP_KEY = 'openclawPhase56ReadOnlyCapabilityPolicyMaps';

const ALLOWED_CAPABILITIES = ['HEALTH_CHECK', 'STATUS_READ', 'VERSION_READ', 'CAPABILITIES_READ'];
const BLOCKED_CAPABILITIES = [
  'COMMAND_DISPATCH', 'ACTION_EXECUTION', 'BROKER_CONNECTOR', 'WALLET_ACTION',
  'CREDENTIAL_ENTRY', 'AUTOMATION_ENGINE', 'SCHEDULED_RUNNER', 'REPEATING_CHECK',
  'VALUE_TRANSFER', 'SECRET_VALUE_ACCESS', 'RAW_RESPONSE_BODY_EXPOSURE',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isValidPhase55Record(r) {
  if (!r) return false;
  if (r.evidenceMode !== 'OPENCLAW_STATUS_VERSION_CAPABILITIES_EVIDENCE') return false;
  if (r.routeChecked !== '/api/openclaw/read-only/status-version-capabilities') return false;
  if (!Array.isArray(r.openClawEndpoints)) return false;
  if (!r.openClawEndpoints.includes('/status')) return false;
  if (!r.openClawEndpoints.includes('/version')) return false;
  if (!r.openClawEndpoints.includes('/capabilities')) return false;
  if (r.openClawMethod !== 'GET') return false;
  if (r.backendCheckMode !== 'OPENCLAW_READ_ONLY_STATUS_VERSION_CAPABILITIES') return false;
  if (!r.statusSummary || r.statusSummary.responseBodyReturned !== false) return false;
  if (!r.versionSummary || r.versionSummary.responseBodyReturned !== false) return false;
  if (!r.capabilitiesSummary || r.capabilitiesSummary.responseBodyReturned !== false) return false;
  if (r.responseRedactionVerified !== true) return false;
  if (r.rawResponseBodiesReturned !== false) return false;
  if (r.secretValuesReturned !== false) return false;
  if (r.openClawResponsesRedacted !== true) return false;
  if (r.dispatchPerformed !== false) return false;
  if (r.executionPerformed !== false) return false;
  if (r.browserAutomationPerformed !== false) return false;
  if (r.schedulerPerformed !== false) return false;
  if (r.pollingPerformed !== false) return false;
  if (r.evidenceStatus !== 'RECORDED') return false;
  if (r.nextAllowedPhase !== 'PHASE_56_OPENCLAW_READ_ONLY_CAPABILITY_POLICY_MAP') return false;
  if (r.actualExecutionStatus !== 'READ_ONLY_STATUS_VERSION_CAPABILITIES_ONLY') return false;
  if (r.safetyLockStatus !== 'LOCKED') return false;
  return true;
}

function generatePolicyMap(record) {
  return {
    policyMapId: `polmap56-${record.evidenceRecordId}-${Date.now()}`,
    sourceSvcEvidenceRecordId: record.evidenceRecordId,
    sourcePhase54ResultId: record.sourcePhase54ResultId,
    sourceSvcActivationLockId: record.sourceSvcActivationLockId,
    generatedAt: new Date().toISOString(),
    policyMapMode: 'OPENCLAW_READ_ONLY_CAPABILITY_POLICY_MAP',
    evidenceSource: 'PHASE_55_STATUS_VERSION_CAPABILITIES_EVIDENCE',
    allowedReadOnlyCapabilities: ALLOWED_CAPABILITIES,
    allowedOpenClawEndpoints: ['/health', '/status', '/version', '/capabilities'],
    allowedOpenClawMethod: 'GET',
    allowedBackendRoutes: [
      '/api/openclaw/read-only/health-check',
      '/api/openclaw/read-only/status-version-capabilities',
    ],
    allowedPurpose: 'READ_ONLY_OBSERVABILITY_ONLY',
    blockedCapabilities: BLOCKED_CAPABILITIES,
    policyDecisions: {
      healthCheck: 'ALLOW_READ_ONLY',
      statusRead: 'ALLOW_READ_ONLY',
      versionRead: 'ALLOW_READ_ONLY',
      capabilitiesRead: 'ALLOW_READ_ONLY',
      commandDispatch: 'BLOCK',
      actionExecution: 'BLOCK',
      valueTransfer: 'BLOCK',
      rawResponseBodies: 'BLOCK',
      secretValues: 'BLOCK',
    },
    requiredFutureGateBeforeAnyNewEndpoint: true,
    nextAllowedPhase: 'PHASE_57_READ_ONLY_OBSERVABILITY_DASHBOARD_CONTRACT',
    openClawCallAllowedNow: false,
    backendImplementationAllowedNow: false,
    dispatchAllowed: false,
    executionAllowed: false,
    automationAllowed: false,
    scheduledRunnerAllowed: false,
    repeatingCheckAllowed: false,
    secretValueExposureAllowed: false,
    rawResponseExposureAllowed: false,
    actualExecutionStatus: 'POLICY_MAP_ONLY_NOT_EXECUTED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawReadOnlyCapabilityPolicyMap() {
  const [policyMaps, setPolicyMaps] = useState(() => loadJSON(POLICY_MAP_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedMap, setExpandedMap] = useState(null);

  const handleGenerate = () => {
    try {
      const batches = loadJSON(PHASE55_EVIDENCE_KEY, []);

      if (batches.length === 0) {
        setLastAction('No Phase 55 evidence batches found — generate evidence records first');
        return;
      }

      const allRecords = batches.flatMap(b => b.evidenceRecords || []);
      const validRecords = allRecords.filter(isValidPhase55Record);

      if (validRecords.length === 0) {
        setLastAction('No valid Phase 55 records found — all 21 gate conditions must be satisfied');
        return;
      }

      const generated = validRecords.map(generatePolicyMap);

      const batch = {
        policyMapBatchId: `batch-${Date.now()}`,
        batchType: 'PHASE_56_READ_ONLY_CAPABILITY_POLICY_MAP',
        generatedAt: new Date().toISOString(),
        totalMaps: generated.length,
        policyMaps: generated,
      };

      const updated = [batch, ...policyMaps].slice(0, 50);
      try { localStorage.setItem(POLICY_MAP_KEY, JSON.stringify(updated)); } catch {}
      setPolicyMaps(updated);
      setLastAction(`Generated ${generated.length} policy maps from valid Phase 55 evidence records`);
    } catch (err) {
      setLastAction('Policy map generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (policyMaps.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(policyMaps[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest policy map batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try { localStorage.removeItem(POLICY_MAP_KEY); } catch {}
    setPolicyMaps([]);
    setLastAction('All policy maps cleared from localStorage');
  };

  const latestBatch = policyMaps.length > 0 ? policyMaps[0] : null;
  const latestMap = latestBatch?.policyMaps?.[0] ?? null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 56 · OpenClaw Read-Only Capability Policy Map</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Read-Only Capability Policy Map
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only policy map generated from Phase 55 evidence. No network calls. No new runtime routes.</div>
      </div>

      {/* Phase chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_56_OPENCLAW_READ_ONLY_CAPABILITY_POLICY_MAP</span>
      </div>

      {/* Summary cards */}
      {latestMap && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Maps</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalMaps}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[8px] font-mono text-slate-300">{new Date(latestBatch.generatedAt).toLocaleTimeString()}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Allowed</div>
            <div className="text-[18px] font-bold text-primary">{latestMap.allowedReadOnlyCapabilities.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Blocked</div>
            <div className="text-[18px] font-bold text-destructive">{latestMap.blockedCapabilities.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 col-span-2 sm:col-span-1">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Next Phase</div>
            <div className="text-[7px] font-mono text-primary break-words">PHASE_57</div>
          </div>
        </div>
      )}

      {/* Allowed / blocked capability chips */}
      {latestMap && (
        <div className="space-y-2">
          <div className="bg-card border border-primary/20 rounded-lg p-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Allowed Read-Only Capabilities</div>
            <div className="flex flex-wrap gap-1.5">
              {latestMap.allowedReadOnlyCapabilities.map(c => (
                <span key={c} className="text-[8px] font-mono px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded">{c}</span>
              ))}
            </div>
          </div>
          <div className="bg-card border border-destructive/20 rounded-lg p-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Blocked Capabilities</div>
            <div className="flex flex-wrap gap-1.5">
              {latestMap.blockedCapabilities.map(c => (
                <span key={c} className="text-[7px] font-mono px-2 py-0.5 bg-destructive/5 border border-destructive/20 text-destructive rounded">{c}</span>
              ))}
            </div>
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
          Generate OpenClaw Read-Only Capability Policy Map
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Policy Map JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={policyMaps.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Policy Maps
        </button>
      </div>

      {/* Policy maps table */}
      {latestBatch && latestBatch.policyMaps && latestBatch.policyMaps.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Policy Maps ({latestBatch.policyMaps.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Map ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Mode</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Exec Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Safety Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.policyMaps.map((m, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{m.policyMapId}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[7px]">{m.policyMapMode}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">{m.actualExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{m.safetyLockStatus}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedMap(expandedMap === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedMap === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {expandedMap !== null && latestBatch.policyMaps[expandedMap] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Policy Map — {latestBatch.policyMaps[expandedMap].policyMapId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.policyMaps[expandedMap], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Policy Map Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This is a policy map only — it classifies read-only capabilities',
            'It introduces no new runtime route or network operation',
            'Raw OpenClaw response bodies are never returned',
            'Secret values are never accessed, displayed, or exported',
            'No dispatch, execution, trading, or money movement occurs',
            'No browser automation, scheduler, or polling occurs',
            'No wallet or broker actions occur',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Policy Map Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{POLICY_MAP_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only policy map. No fetch, no OpenClaw calls, no backend calls, no secrets, no execution, no dispatch.
      </div>
    </div>
  );
}