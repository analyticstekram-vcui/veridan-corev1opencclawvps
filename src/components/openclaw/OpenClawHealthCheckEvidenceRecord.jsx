/**
 * OpenClawHealthCheckEvidenceRecord — Phase 51
 * Creates evidence records from Phase 50 OpenClaw read-only health check results.
 * No OpenClaw calls, no backend calls, no secret values, no dispatch, no execution, no trading, no money movement.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PHASE50_RESULTS_KEY = 'openclawPhase50OpenClawReadOnlyHealthCheckResults';
const EVIDENCE_KEY = 'openclawPhase51HealthCheckEvidenceRecords';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isValidPhase50Result(r) {
  if (!r) return false;
  if (r.backendCheckMode !== 'OPENCLAW_READ_ONLY_HEALTH_CHECK') return false;
  if (r.backendRoute !== '/api/openclaw/read-only/health-check') return false;
  if (r.openClawEndpoint !== '/health') return false;
  if (r.openClawMethod !== 'GET') return false;
  if (r.openClawResponseRedacted !== true) return false;
  if (!r.responseSummary) return false;
  if (r.responseSummary.type !== 'REDACTED_HEALTH_SUMMARY') return false;
  if (r.responseSummary.responseBodyReturned !== false) return false;
  if (r.secretValuesReturned !== false) return false;
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
    evidenceRecordId: `ev51-${record.recordId}-${Date.now()}`,
    sourcePhase50ResultId: record.recordId,
    sourceHealthCheckActivationLockId: record.sourceActivationLockId,
    generatedAt: new Date().toISOString(),
    evidenceMode: 'OPENCLAW_READ_ONLY_HEALTH_CHECK_EVIDENCE',
    routeChecked: '/api/openclaw/read-only/health-check',
    openClawEndpoint: '/health',
    openClawMethod: 'GET',
    checkedAtFromBackend: r.checkedAt,
    backendCheckMode: 'OPENCLAW_READ_ONLY_HEALTH_CHECK',
    routeStatus: r.routeStatus,
    openClawReachable: r.openClawReachable,
    openClawHealthStatus: r.openClawHealthStatus,
    httpStatus: r.httpStatus,
    responseRedactionVerified: true,
    rawResponseBodyReturned: false,
    secretValuesReturned: false,
    openClawResponseRedacted: true,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    browserAutomationPerformed: false,
    schedulerPerformed: false,
    pollingPerformed: false,
    evidenceStatus: 'RECORDED',
    nextAllowedPhase: 'PHASE_52_OPENCLAW_STATUS_VERSION_CAPABILITIES_CONTRACT',
    actualExecutionStatus: 'READ_ONLY_HEALTH_CHECK_ONLY',
    safetyLockStatus: 'LOCKED',
  };
}

const HEALTH_STATUS_STYLES = {
  HEALTHY: 'text-primary',
  UNHEALTHY: 'text-destructive',
  UNKNOWN: 'text-amber-500',
};

export default function OpenClawHealthCheckEvidenceRecord() {
  const [evidenceBatches, setEvidenceBatches] = useState(() => loadJSON(EVIDENCE_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const handleGenerate = () => {
    try {
      const phase50Records = loadJSON(PHASE50_RESULTS_KEY, []);

      if (phase50Records.length === 0) {
        setLastAction('No Phase 50 health check results found — run the health check first');
        return;
      }

      const validRecords = phase50Records.filter(rec => rec.result && isValidPhase50Result(rec.result));

      if (validRecords.length === 0) {
        setLastAction('No valid Phase 50 results found — all 15 gate conditions must be satisfied');
        return;
      }

      const generated = validRecords.map(r => generateEvidenceRecord(r));

      const batch = {
        evidenceBatchId: `batch-${Date.now()}`,
        batchType: 'PHASE_51_OPENCLAW_HEALTH_CHECK_EVIDENCE',
        generatedAt: new Date().toISOString(),
        totalEvidenceRecords: generated.length,
        evidenceRecords: generated,
      };

      try {
        localStorage.setItem(EVIDENCE_KEY, JSON.stringify([batch, ...evidenceBatches].slice(0, 50)));
      } catch {}

      setEvidenceBatches([batch, ...evidenceBatches].slice(0, 50));
      setLastAction(`Generated ${generated.length} evidence records from valid Phase 50 results`);
    } catch (err) {
      setLastAction('Evidence generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (evidenceBatches.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(evidenceBatches[0], null, 2));
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
      setEvidenceBatches([]);
      setLastAction('All evidence records cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = evidenceBatches.length > 0 ? evidenceBatches[0] : null;
  const latestRecord = latestBatch?.evidenceRecords?.[0] ?? null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 51 · OpenClaw Health Check Evidence Record</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Health Check Evidence Record
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Records evidence from Phase 50 health check results. No OpenClaw calls. Secret values never included.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_51_OPENCLAW_HEALTH_CHECK_EVIDENCE_RECORD</span>
      </div>

      {/* Summary stats */}
      {latestRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Records</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalEvidenceRecords}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Route Status</div>
            <div className="text-[9px] font-bold text-primary">{latestRecord.routeStatus}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">OpenClaw Health</div>
            <div className={`text-[10px] font-bold ${HEALTH_STATUS_STYLES[latestRecord.openClawHealthStatus] || 'text-slate-400'}`}>
              {latestRecord.openClawHealthStatus}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">HTTP Status</div>
            <div className="text-[18px] font-bold text-primary">{latestRecord.httpStatus ?? '—'}</div>
          </div>
        </div>
      )}

      {/* Latest record spec */}
      {latestRecord && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Evidence Record Specification</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestRecord.generatedAt).toLocaleString()}</span>
          </div>

          {/* Key fields */}
          <div className="px-4 py-3 border-b border-border/30 grid grid-cols-2 gap-3 text-[8px]">
            {[
              ['evidenceMode', latestRecord.evidenceMode],
              ['routeChecked', latestRecord.routeChecked],
              ['openClawEndpoint', latestRecord.openClawEndpoint],
              ['openClawMethod', latestRecord.openClawMethod],
              ['backendCheckMode', latestRecord.backendCheckMode],
              ['evidenceStatus', latestRecord.evidenceStatus],
              ['nextAllowedPhase', latestRecord.nextAllowedPhase],
              ['actualExecutionStatus', latestRecord.actualExecutionStatus],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[7px]">{label}</span>
                <span className="font-mono font-semibold text-primary text-[8px] break-words">{val}</span>
              </div>
            ))}
          </div>

          {/* Safety flags */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
            {[
              ['responseRedactionVerified', latestRecord.responseRedactionVerified],
              ['rawResponseBodyReturned', latestRecord.rawResponseBodyReturned],
              ['secretValuesReturned', latestRecord.secretValuesReturned],
              ['openClawResponseRedacted', latestRecord.openClawResponseRedacted],
              ['dispatchPerformed', latestRecord.dispatchPerformed],
              ['executionPerformed', latestRecord.executionPerformed],
              ['tradingPerformed', latestRecord.tradingPerformed],
              ['moneyMovementPerformed', latestRecord.moneyMovementPerformed],
              ['safetyLockStatus', latestRecord.safetyLockStatus],
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
          Generate OpenClaw Health Check Evidence Record
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
          disabled={evidenceBatches.length === 0}
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
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Evidence ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Route Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Health Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.evidenceRecords.map((rec, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{rec.evidenceRecordId}</td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[7px]">{rec.routeStatus}</td>
                    <td className={`px-3 py-2.5 font-bold text-[7px] ${HEALTH_STATUS_STYLES[rec.openClawHealthStatus] || 'text-slate-400'}`}>{rec.openClawHealthStatus}</td>
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
            'This records OpenClaw read-only health-check evidence only',
            'Raw OpenClaw response body is never returned',
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
        Local-only evidence record. No fetch, no OpenClaw calls, no backend calls, no secret values, no raw response body, no execution, no dispatch.
      </div>
    </div>
  );
}