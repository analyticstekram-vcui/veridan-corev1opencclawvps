/**
 * OpenClawStatusVersionCapabilitiesEvidenceRecord — Phase 55
 * Records evidence from Phase 54 OpenClaw status/version/capabilities read-only results.
 * No OpenClaw calls, no backend calls, no secret values, no dispatch, no execution, no trading, no money movement.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PHASE54_RESULTS_KEY = 'openclawPhase54StatusVersionCapabilitiesReadOnlyResults';
const EVIDENCE_KEY = 'openclawPhase55StatusVersionCapabilitiesEvidenceRecords';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isValidPhase54Result(r) {
  if (!r) return false;
  if (r.backendCheckMode !== 'OPENCLAW_READ_ONLY_STATUS_VERSION_CAPABILITIES') return false;
  if (r.backendRoute !== '/api/openclaw/read-only/status-version-capabilities') return false;
  if (!Array.isArray(r.openClawEndpoints)) return false;
  if (!r.openClawEndpoints.includes('/status')) return false;
  if (!r.openClawEndpoints.includes('/version')) return false;
  if (!r.openClawEndpoints.includes('/capabilities')) return false;
  if (r.openClawMethod !== 'GET') return false;
  if (r.openClawResponsesRedacted !== true) return false;
  if (r.rawResponseBodiesReturned !== false) return false;
  if (r.secretValuesReturned !== false) return false;
  if (!r.openClawStatusSummary || r.openClawStatusSummary.responseBodyReturned !== false) return false;
  if (!r.openClawVersionSummary || r.openClawVersionSummary.responseBodyReturned !== false) return false;
  if (!r.openClawCapabilitiesSummary || r.openClawCapabilitiesSummary.responseBodyReturned !== false) return false;
  if (r.dispatchPerformed !== false) return false;
  if (r.executionPerformed !== false) return false;
  if (r.tradingPerformed !== false) return false;
  if (r.moneyMovementPerformed !== false) return false;
  if (r.browserAutomationPerformed !== false) return false;
  if (r.schedulerPerformed !== false) return false;
  if (r.pollingPerformed !== false) return false;
  return true;
}

function generateEvidenceRecord(record) {
  const r = record.result;
  return {
    evidenceRecordId: `svcevid55-${record.recordId}-${Date.now()}`,
    sourcePhase54ResultId: record.recordId,
    sourceSvcActivationLockId: record.sourceActivationLockId,
    generatedAt: new Date().toISOString(),
    evidenceMode: 'OPENCLAW_STATUS_VERSION_CAPABILITIES_EVIDENCE',
    routeChecked: '/api/openclaw/read-only/status-version-capabilities',
    openClawEndpoints: ['/status', '/version', '/capabilities'],
    openClawMethod: 'GET',
    checkedAtFromBackend: r.checkedAt,
    backendCheckMode: 'OPENCLAW_READ_ONLY_STATUS_VERSION_CAPABILITIES',
    routeStatus: r.routeStatus,
    statusSummary: {
      reachable: r.openClawStatusSummary.reachable,
      httpStatus: r.openClawStatusSummary.httpStatus,
      receivedResponse: r.openClawStatusSummary.receivedResponse,
      responseBodyReturned: false,
      summaryType: 'REDACTED_STATUS_SUMMARY',
    },
    versionSummary: {
      reachable: r.openClawVersionSummary.reachable,
      httpStatus: r.openClawVersionSummary.httpStatus,
      receivedResponse: r.openClawVersionSummary.receivedResponse,
      responseBodyReturned: false,
      summaryType: 'REDACTED_VERSION_SUMMARY',
    },
    capabilitiesSummary: {
      reachable: r.openClawCapabilitiesSummary.reachable,
      httpStatus: r.openClawCapabilitiesSummary.httpStatus,
      receivedResponse: r.openClawCapabilitiesSummary.receivedResponse,
      responseBodyReturned: false,
      summaryType: 'REDACTED_CAPABILITIES_SUMMARY',
    },
    responseRedactionVerified: true,
    rawResponseBodiesReturned: false,
    secretValuesReturned: false,
    openClawResponsesRedacted: true,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    browserAutomationPerformed: false,
    schedulerPerformed: false,
    pollingPerformed: false,
    evidenceStatus: 'RECORDED',
    nextAllowedPhase: 'PHASE_56_OPENCLAW_READ_ONLY_CAPABILITY_POLICY_MAP',
    actualExecutionStatus: 'READ_ONLY_STATUS_VERSION_CAPABILITIES_ONLY',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawStatusVersionCapabilitiesEvidenceRecord() {
  const [batches, setBatches] = useState(() => loadJSON(EVIDENCE_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const handleGenerate = () => {
    try {
      const phase54Records = loadJSON(PHASE54_RESULTS_KEY, []);

      if (phase54Records.length === 0) {
        setLastAction('No Phase 54 results found — run the read-only route check first');
        return;
      }

      const validRecords = phase54Records.filter(rec => rec.result && isValidPhase54Result(rec.result));

      if (validRecords.length === 0) {
        setLastAction('No valid Phase 54 results found — all 17 gate conditions must be satisfied');
        return;
      }

      const generated = validRecords.map(rec => generateEvidenceRecord(rec));

      const batch = {
        evidenceBatchId: `batch-${Date.now()}`,
        batchType: 'PHASE_55_STATUS_VERSION_CAPABILITIES_EVIDENCE',
        generatedAt: new Date().toISOString(),
        totalRecords: generated.length,
        evidenceRecords: generated,
      };

      try {
        localStorage.setItem(EVIDENCE_KEY, JSON.stringify([batch, ...batches].slice(0, 50)));
      } catch {}

      setBatches([batch, ...batches].slice(0, 50));
      setLastAction(`Generated ${generated.length} evidence records from valid Phase 54 results`);
    } catch (err) {
      setLastAction('Evidence generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (batches.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(batches[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest evidence batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(EVIDENCE_KEY);
      setBatches([]);
      setLastAction('All evidence records cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = batches.length > 0 ? batches[0] : null;
  const latestRecord = latestBatch?.evidenceRecords?.[0] ?? null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 55 · OpenClaw Status / Version / Capabilities Evidence Record</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Status / Version / Capabilities Evidence Record
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Records evidence from Phase 54 read-only results. Does not call OpenClaw or any backend.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_55_OPENCLAW_STATUS_VERSION_CAPABILITIES_EVIDENCE_RECORD</span>
      </div>

      {/* Summary stats */}
      {latestRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Records</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalRecords}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Route Status</div>
            <div className="text-[9px] font-bold text-primary">{latestRecord.routeStatus}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Evidence Status</div>
            <div className="text-[9px] font-bold text-primary">{latestRecord.evidenceStatus}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Safety Lock</div>
            <div className="text-[9px] font-bold text-primary">{latestRecord.safetyLockStatus}</div>
          </div>
        </div>
      )}

      {/* Per-endpoint summary */}
      {latestRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            ['/status', latestRecord.statusSummary],
            ['/version', latestRecord.versionSummary],
            ['/capabilities', latestRecord.capabilitiesSummary],
          ].map(([ep, s]) => s && (
            <div key={ep} className="bg-card border border-border rounded-lg px-4 py-3 space-y-1.5">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{ep}</div>
              <div className="flex flex-wrap gap-1.5 text-[8px]">
                <span className={`font-bold px-1.5 py-0.5 rounded border ${s.reachable ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
                  {s.reachable ? 'REACHABLE' : 'UNREACHABLE'}
                </span>
                <span className="font-mono text-foreground px-1.5 py-0.5 border border-border rounded">HTTP {s.httpStatus ?? '—'}</span>
                <span className="text-slate-400 px-1.5 py-0.5 border border-border/40 rounded text-[7px]">{s.summaryType}</span>
              </div>
            </div>
          ))}
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
          Generate OpenClaw Status / Version / Capabilities Evidence Record
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestBatch}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Evidence JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={batches.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Evidence
        </button>
      </div>

      {/* Evidence records table */}
      {latestBatch && latestBatch.evidenceRecords && latestBatch.evidenceRecords.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Evidence Records ({latestBatch.evidenceRecords.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Record ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Route Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Exec Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Safety Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.evidenceRecords.map((rec, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{rec.evidenceRecordId}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[7px]">{rec.routeStatus}</td>
                    <td className="px-3 py-2.5 text-amber-500 font-bold text-[7px]">{rec.actualExecutionStatus}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{rec.safetyLockStatus}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedRecord(expandedRecord === i ? null : i)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-bold text-[7px]">VIEW</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedRecord === i ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded record details */}
          {expandedRecord !== null && latestBatch.evidenceRecords[expandedRecord] && (
            <div className="bg-secondary/10 border-t border-border p-4 space-y-2">
              <div className="text-[9px] font-semibold text-primary">
                Evidence Record — {latestBatch.evidenceRecords[expandedRecord].evidenceRecordId}
              </div>
              <pre className="text-[8px] font-mono text-slate-300 overflow-auto max-h-48 bg-card rounded p-2 border border-border/40">
                {JSON.stringify(latestBatch.evidenceRecords[expandedRecord], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety guarantee */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Evidence Record Safety Guarantee</div>
        </div>
        <div className="pt-1 text-[8px] text-slate-400 space-y-0.5">
          {[
            'This records OpenClaw read-only status/version/capabilities evidence only',
            'Raw OpenClaw response bodies are never returned',
            'Secret values are never returned',
            'No dispatch occurs',
            'No execution occurs',
            'No trading occurs',
            'No browser automation occurs',
            'No scheduler or polling occurs',
            'No wallet or money movement occurs',
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
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Evidence Batch — JSON</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestBatch.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestBatch, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{EVIDENCE_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only evidence record. No fetch, no OpenClaw calls, no backend calls, no secret values, no raw response bodies, no execution, no dispatch.
      </div>
    </div>
  );
}