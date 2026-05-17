/**
 * OpenClawBackendEnvPresenceEvidenceRecord — Phase 47
 * Creates evidence records from Phase 46 backend env presence boolean results.
 * No OpenClaw calls, no secret values, no dispatch, no execution, no trading, no money movement.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

const PHASE46_RESULTS_KEY = 'openclawPhase46BackendEnvPresenceBooleanResults';
const EVIDENCE_RECORDS_KEY = 'openclawPhase47BackendEnvPresenceEvidenceRecords';

const REQUIRED_KEYS = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SERVICE_TOKEN',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isValidPhase46Result(r) {
  if (!r || !r.result) return false;
  const res = r.result;
  if (res.backendCheckMode !== 'BOOLEAN_PRESENCE_ONLY') return false;
  if (res.secretValuesReturned !== false) return false;
  if (res.openClawCalled !== false) return false;
  if (res.dispatchPerformed !== false) return false;
  if (res.executionPerformed !== false) return false;
  if (res.tradingPerformed !== false) return false;
  if (res.moneyMovementPerformed !== false) return false;
  if (!Array.isArray(res.keys)) return false;
  if (!res.keys.every(k => k.value === 'REDACTED_NEVER_RETURNED')) return false;
  if (!res.keys.every(k => typeof k.present === 'boolean')) return false;
  return true;
}

function generateEvidenceRecord(phase46Record) {
  const res = phase46Record.result;
  const presentCount = res.keys.filter(k => k.present).length;
  const missingCount = res.keys.filter(k => !k.present).length;

  const requiredKeys = {};
  REQUIRED_KEYS.forEach(keyName => {
    const found = res.keys.find(k => k.keyName === keyName);
    requiredKeys[keyName] = found ? found.present : false;
  });

  return {
    evidenceRecordId: `ev47-${phase46Record.recordId}-${Date.now()}`,
    sourcePhase46ResultId: phase46Record.recordId,
    sourceActivationLockId: phase46Record.sourceActivationLockId,
    generatedAt: new Date().toISOString(),
    evidenceMode: 'BACKEND_ENV_PRESENCE_BOOLEAN_EVIDENCE',
    routeChecked: '/api/openclaw/read-only/env-presence-check',
    checkedAtFromBackend: res.checkedAt,
    backendCheckMode: 'BOOLEAN_PRESENCE_ONLY',
    routeStatus: res.routeStatus,
    keyPresenceSummary: {
      totalKeys: res.keys.length,
      presentCount,
      missingCount,
      requiredKeys,
    },
    redactionVerified: true,
    secretValuesReturned: false,
    openClawCalled: false,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    evidenceStatus: 'RECORDED',
    nextAllowedPhase: 'PHASE_48_OPENCLAW_HEALTH_CHECK_CONTRACT',
    dryRunOnly: false,
    actualExecutionStatus: 'BACKEND_BOOLEAN_CHECK_ONLY',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawBackendEnvPresenceEvidenceRecord() {
  const [evidenceRecords, setEvidenceRecords] = useState(() => loadJSON(EVIDENCE_RECORDS_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const handleGenerate = () => {
    try {
      const phase46Results = loadJSON(PHASE46_RESULTS_KEY, []);

      if (phase46Results.length === 0) {
        setLastAction('No Phase 46 results found — run the backend presence check first');
        return;
      }

      const validResults = phase46Results.filter(isValidPhase46Result);

      if (validResults.length === 0) {
        setLastAction('No valid Phase 46 results found — all safety conditions must be satisfied');
        return;
      }

      const generated = validResults.map(r => generateEvidenceRecord(r));

      const batch = {
        evidenceBatchId: `batch-${Date.now()}`,
        batchType: 'PHASE_47_BACKEND_ENV_PRESENCE_EVIDENCE',
        generatedAt: new Date().toISOString(),
        totalEvidenceRecords: generated.length,
        evidenceRecords: generated,
      };

      try {
        localStorage.setItem(EVIDENCE_RECORDS_KEY, JSON.stringify([batch, ...evidenceRecords].slice(0, 50)));
      } catch {}

      setEvidenceRecords([batch, ...evidenceRecords].slice(0, 50));
      setLastAction(`Generated ${generated.length} evidence records from valid Phase 46 results`);
    } catch (err) {
      setLastAction('Evidence generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (evidenceRecords.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(evidenceRecords[0], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest evidence batch copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(EVIDENCE_RECORDS_KEY);
      setEvidenceRecords([]);
      setLastAction('All evidence records cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const latestBatch = evidenceRecords.length > 0 ? evidenceRecords[0] : null;
  const latestRecord = latestBatch?.evidenceRecords?.[0] ?? null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 47 · Backend Env Presence Evidence Record</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Backend Env Presence Evidence Record
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Records backend boolean presence evidence from Phase 46 before any OpenClaw health check is allowed.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_47_BACKEND_ENV_PRESENCE_BOOLEAN_EVIDENCE</span>
      </div>

      {/* Summary stats */}
      {latestRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Records</div>
            <div className="text-[18px] font-bold text-primary">{latestBatch.totalEvidenceRecords}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Keys Present</div>
            <div className="text-[18px] font-bold text-primary">{latestRecord.keyPresenceSummary.presentCount}</div>
          </div>
          <div className={`bg-card border rounded-lg px-4 py-3 ${latestRecord.keyPresenceSummary.missingCount > 0 ? 'border-destructive/20' : 'border-border'}`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Keys Missing</div>
            <div className={`text-[18px] font-bold ${latestRecord.keyPresenceSummary.missingCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>
              {latestRecord.keyPresenceSummary.missingCount}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Route Status</div>
            <div className={`text-[10px] font-bold ${latestRecord.routeStatus === 'READY' ? 'text-primary' : 'text-destructive'}`}>
              {latestRecord.routeStatus}
            </div>
          </div>
        </div>
      )}

      {/* Required key presence display */}
      {latestRecord && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Required Key Presence Summary</span>
            <span className="text-[8px] font-mono text-slate-500">{latestRecord.checkedAtFromBackend}</span>
          </div>
          <div className="divide-y divide-border/20">
            {REQUIRED_KEYS.map(keyName => {
              const present = latestRecord.keyPresenceSummary.requiredKeys[keyName];
              return (
                <div key={keyName} className="flex items-center justify-between px-4 py-2.5 text-[8px]">
                  <span className="font-mono text-slate-300">{keyName}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${present ? 'text-primary' : 'text-destructive'}`}>{String(present)}</span>
                    <span className="font-mono text-destructive font-semibold">REDACTED_NEVER_RETURNED</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-border/30 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
            {[
              ['redactionVerified', latestRecord.redactionVerified],
              ['secretValuesReturned', latestRecord.secretValuesReturned],
              ['openClawCalled', latestRecord.openClawCalled],
              ['dispatchPerformed', latestRecord.dispatchPerformed],
              ['executionPerformed', latestRecord.executionPerformed],
              ['tradingPerformed', latestRecord.tradingPerformed],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-400">{label}: <span className={`font-bold ${val === true || val === false ? (val ? 'text-primary' : 'text-primary') : 'text-primary'}`}>{String(val)}</span></span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-border/30 flex items-center gap-4 text-[8px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-400">evidenceStatus: <span className="font-bold text-primary">{latestRecord.evidenceStatus}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-400">nextAllowedPhase: <span className="font-bold text-amber-500">{latestRecord.nextAllowedPhase}</span></span>
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
          Generate Backend Env Presence Evidence Record
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
          disabled={evidenceRecords.length === 0}
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
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Source Result ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Route Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Present</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Lock</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {latestBatch.evidenceRecords.map((rec, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate max-w-[100px]">{rec.sourcePhase46ResultId || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold text-[7px] ${rec.routeStatus === 'READY' ? 'text-primary' : 'text-destructive'}`}>{rec.routeStatus}</span>
                    </td>
                    <td className="px-3 py-2.5 text-primary font-bold text-[8px]">{rec.keyPresenceSummary.presentCount}/{rec.keyPresenceSummary.totalKeys}</td>
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
            'This records backend boolean presence evidence only',
            'Secret values are never returned',
            'Secret values are never displayed',
            'Secret values are never stored',
            'OpenClaw is not called',
            'No dispatch occurs',
            'No execution occurs',
            'No trading or money movement occurs',
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
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{EVIDENCE_RECORDS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only evidence record. No fetch, no OpenClaw calls, no backend calls, no secret values, no execution, no dispatch.
      </div>
    </div>
  );
}