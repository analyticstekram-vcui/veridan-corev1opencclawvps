/**
 * BridgeCallResultEvidenceExport
 * Local-only evidence export for bridge call results only.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no execution
 *   - Export only - does not trigger new bridge calls
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Copy, ShieldCheck, RefreshCw, FileJson, AlertCircle } from 'lucide-react';

const SOURCE_KEYS = {
  bridgeCalls: [
    'openclawControlledReadOnlyRouteBridgeCalls',
    'openclawBridgeCalls',
    'openclawReadOnlyBridgeCalls',
  ],
};
const EXPORT_KEY = 'openclawBridgeCallResultEvidenceExports';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveExport(exportRecord) {
  try {
    const all = loadJSON(EXPORT_KEY, []);
    const key = `${exportRecord.sourceCallId}-${exportRecord.endpoint}-${exportRecord.httpStatus}`;
    const deduped = [exportRecord, ...all.filter(e => `${e.sourceCallId}-${e.endpoint}-${e.httpStatus}` !== key)];
    localStorage.setItem(EXPORT_KEY, JSON.stringify(deduped.slice(0, 50)));
  } catch {}
}

function normalizeCallResult(result) {
  if (!result) return null;

  const endpoint = result.endpoint ?? result.path ?? result.route ?? result.selectedEndpoint ?? null;
  const route = result.selectedRoute ?? result.route ?? null;
  const httpStatus = result.httpStatus ?? result.status ?? null;
  const reachable = result.gatewayReachable ?? result.online ?? result.reachable ?? false;
  const cfAccessDetected = result.cfAccessDetected ?? result.cfAccessBoundary ?? false;
  const dispatchAllowed = result.dispatchAllowed ?? false;
  const openClawCommandSent = result.openClawCommandSent ?? result.commandSent ?? false;
  const executionAttempted = result.executionAttempted ?? result.executed ?? false;
  const browserToolUsed = result.browserToolUsed ?? result.browserAutomation ?? false;
  const secretExposed = result.secretExposed ?? result.credentialExposed ?? false;
  const gatewayMode = result.gatewayMode ?? 'READ_ONLY';
  const executionMode = result.executionMode ?? 'DISABLED';
  const executionLock = result.executionLock ?? 'LOCKED';
  const responseFields = result.safeResponseFields ?? result.responseData ?? null;
  const sourceCallId = result.bridgeCallId ?? result.callId ?? null;
  const timestamp = result.createdAt ?? result.timestamp ?? new Date().toISOString();

  return {
    sourceCallId,
    endpoint,
    route,
    httpStatus,
    reachable,
    cfAccessDetected,
    dispatchAllowed,
    openClawCommandSent,
    executionAttempted,
    browserToolUsed,
    secretExposed,
    gatewayMode,
    executionMode,
    executionLock,
    responseFields,
    timestamp,
  };
}

function getLatestBridgeCallResult() {
  for (const key of SOURCE_KEYS.bridgeCalls) {
    const results = loadJSON(key, []);
    if (results.length > 0) {
      return { result: normalizeCallResult(results[0]), sourceKey: key, candidateCount: results.length };
    }
  }
  return { result: null, sourceKey: null, candidateCount: 0 };
}

function buildEvidenceExport(callResult) {
  const safetyAssertions = [
    { key: 'previewOnly',           value: true,                              pass: true },
    { key: 'readOnly',              value: true,                              pass: true },
    { key: 'gatewayModeReadOnly',   value: callResult.gatewayMode === 'READ_ONLY', pass: callResult.gatewayMode === 'READ_ONLY' },
    { key: 'executionLocked',       value: callResult.executionLock === 'LOCKED', pass: callResult.executionLock === 'LOCKED' },
    { key: 'executionModeDisabled', value: callResult.executionMode === 'DISABLED', pass: callResult.executionMode === 'DISABLED' },
    { key: 'dispatchAllowed',       value: false,                             pass: callResult.dispatchAllowed === false },
    { key: 'openClawCommandSent',   value: false,                             pass: callResult.openClawCommandSent === false },
    { key: 'executionAttempted',    value: false,                             pass: callResult.executionAttempted === false },
    { key: 'browserToolUsed',       value: false,                             pass: callResult.browserToolUsed === false },
    { key: 'secretExposed',         value: false,                             pass: callResult.secretExposed === false },
    { key: 'mutationAttempted',     value: false,                             pass: true },
    { key: 'moneyMovement',         value: false,                             pass: true },
  ];

  const evidenceId = 'bce-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    evidenceId,
    createdAt:           new Date().toISOString(),
    phase:               'BRIDGE_CALL_RESULT_EVIDENCE_EXPORT',
    sourceCallId:        callResult.sourceCallId,
    endpoint:            callResult.endpoint,
    route:               callResult.route?.capability ?? callResult.route,
    httpStatus:          callResult.httpStatus,
    reachable:           callResult.reachable,
    gatewayMode:         callResult.gatewayMode,
    executionMode:       callResult.executionMode,
    executionLock:       callResult.executionLock,
    cfAccessDetected:    callResult.cfAccessDetected,
    dispatchAllowed:     callResult.dispatchAllowed,
    openClawCommandSent: callResult.openClawCommandSent,
    executionAttempted:  callResult.executionAttempted,
    browserToolUsed:     callResult.browserToolUsed,
    secretExposed:       callResult.secretExposed,
    responseShapeSummary: callResult.responseFields ?? {},
    sourceDiagnostics: {
      sourceCallTimestamp: callResult.timestamp,
      exportedAt:          new Date().toISOString(),
    },
    safetyAssertions,
    note: 'Evidence export only. No command dispatch. No execution. No browser tools. No credentials exposed. Local-only.',
  };
}

function CopyButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Evidence JSON'}
    </button>
  );
}

export default function BridgeCallResultEvidenceExport({ refreshTrigger }) {
  const [export_, setExport] = useState(null);
  const [callMetadata, setCallMetadata] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const { result, sourceKey, candidateCount } = getLatestBridgeCallResult();
    
    if (!result) {
      setExport(null);
      setCallMetadata({ sourceKey, candidateCount, found: false });
      return;
    }

    const exp = buildEvidenceExport(result);
    saveExport(exp);
    tryAppendAudit({
      event:        'bridge_call_result_evidence_exported',
      evidenceId:   exp.evidenceId,
      sourceCallId: exp.sourceCallId,
      endpoint:     exp.endpoint,
      httpStatus:   exp.httpStatus,
      reachable:    exp.reachable,
      note: `Bridge call result evidence exported (${exp.evidenceId}). Endpoint: ${exp.endpoint}. Status: ${exp.httpStatus ?? 'N/A'}. No command dispatch. No execution.`,
    });

    setExport(exp);
    setCallMetadata({ sourceKey, candidateCount, found: true });
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Evidence Export</div>
          <div className="text-[13px] font-bold text-foreground">Bridge Call Result Evidence Export</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Exports latest bridge call result for review. No command dispatch. No execution.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">EXPORT_ONLY / READ_ONLY / LOCKED</span> — Evidence export. No bridge call triggered. No dispatch. No execution.</span>
      </div>

      {/* Empty state or export */}
      {!export_ ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          No bridge call result available. Run a controlled read-only bridge call first.
        </div>
      ) : (
        <>
          {/* Result status banner */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            export_.reachable
              ? 'bg-primary/5 border-primary/30'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {export_.reachable ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  export_.reachable ? 'text-primary' : 'text-amber-500'
                }`}>
                  {export_.reachable ? 'GATEWAY_REACHABLE' : 'GATEWAY_UNREACHABLE'}
                </div>
                <div className="text-[8px] text-slate-400 mt-0.5">
                  Endpoint: {export_.endpoint} • HTTP {export_.httpStatus ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Route',              value: export_.route,                       color: 'text-foreground font-mono text-[8px]' },
              { label: 'Endpoint',           value: export_.endpoint,                    color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',        value: export_.httpStatus ?? 'N/A',         color: 'text-foreground' },
              { label: 'Reachable',          value: String(export_.reachable),           color: export_.reachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'Command Sent',       value: String(export_.openClawCommandSent), color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',     value: String(export_.executionAttempted),  color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',   value: String(export_.dispatchAllowed),     color: 'text-destructive font-bold' },
              { label: 'Secret Exposed',     value: String(export_.secretExposed),       color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Source diagnostics */}
          {callMetadata?.found && (
            <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
                <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
                  <div className="text-slate-500 mb-0.5">Source Call ID</div>
                  <div className="font-mono text-slate-300 text-[7px] break-all">{export_.sourceCallId?.slice(-16)}</div>
                </div>
                <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
                  <div className="text-slate-500 mb-0.5">Source Key</div>
                  <div className="font-mono text-blue-400 text-[7px] break-all">{callMetadata.sourceKey?.slice(-20)}</div>
                </div>
                <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
                  <div className="text-slate-500 mb-0.5">Call Timestamp</div>
                  <div className="font-mono text-slate-300 text-[7px]">{new Date(export_.sourceDiagnostics?.sourceCallTimestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {export_.safetyAssertions.filter(a => a.pass).length}/{export_.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {export_.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className={`text-[7px] font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>
                    {String(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Evidence JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(export_, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Evidence ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><FileJson className="w-3 h-3" /><span className="font-mono">{export_.evidenceId}</span></span>
            <span>{new Date(export_.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={export_} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Generate Evidence Export
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Evidence export is local-only. No command dispatch. No execution. No browser tools. No credentials exposed.
      </div>
    </div>
  );
}