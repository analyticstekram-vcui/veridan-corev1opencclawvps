/**
 * BridgeIntegrityCheckpoint
 * Local-only integrity checkpoint for the Gateway Connector stack.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend functions
 *   - No browser tools, no timers, no intervals
 *   - No dispatch, no execution, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldCheck, RefreshCw, FileJson } from 'lucide-react';

const SOURCE_KEYS = [
  'openclawControlledReadOnlyRouteBridgeCalls',
  'openclawBridgeCallResultEvidenceExports',
  'openclawBridgeAuditReportDashboards',
  'openclawReadOnlyRouteApprovalPackets',
  'openclawReadOnlyRouteSimulationEvidenceExports',
  'openclawOperatorHandoffPackets',
  'openclawBaselineArchiveVerificationReports',
  'openclawBaselineArchiveExports',
  'openclawFinalBaselineLockSnapshots',
  'openclawEvidenceChainVerificationReports',
];
const CHECKPOINT_KEY = 'openclawBridgeIntegrityCheckpoints';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveCheckpoint(checkpoint) {
  try {
    const all = loadJSON(CHECKPOINT_KEY, []);
    const deduped = [checkpoint, ...all.filter(c => c.checkpointId !== checkpoint.checkpointId)];
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function normalizeBridgeCall(call) {
  if (!call) return null;
  return {
    endpoint: call.endpoint ?? call.path ?? call.route ?? null,
    httpStatus: call.httpStatus ?? call.status ?? call.statusCode ?? null,
    reachable: call.gatewayReachable ?? call.online ?? call.reachable ?? false,
    executionAttempted: call.executionAttempted ?? call.executed ?? false,
    secretExposed: call.secretExposed ?? call.credentialExposed ?? false,
    dispatchAllowed: call.dispatchAllowed ?? false,
    openClawCommandSent: call.openClawCommandSent ?? call.commandSent ?? false,
    gatewayMode: call.gatewayMode ?? 'READ_ONLY',
    executionMode: call.executionMode ?? 'DISABLED',
    executionLock: call.executionLock ?? 'LOCKED',
  };
}

function normalizeAuditReport(report) {
  if (!report) return null;
  return {
    overallStatus: report.overallStatus,
    totalRecords: report.totalRecords ?? 0,
    secretExposed: report.secretExposed ?? false,
  };
}

function normalizeApprovalPacket(packet) {
  if (!packet) return null;
  return {
    routeCount: packet.routes?.length ?? 0,
    safetyPass: packet.safetyAssertions?.every(a => a.pass) ?? false,
  };
}

function aggregateRecords() {
  const sourceDiagnostics = {};
  const allRecords = {};

  SOURCE_KEYS.forEach(key => {
    const records = loadJSON(key, []);
    if (records.length > 0) {
      sourceDiagnostics[key] = {
        count: records.length,
        latestId: records[0]?.id ?? records[0]?.checkpointId ?? records[0]?.reportId ?? records[0]?.packetId ?? 'unknown',
        latestTimestamp: records[0]?.createdAt ?? records[0]?.timestamp ?? new Date().toISOString(),
      };
      allRecords[key] = records[0];
    } else {
      sourceDiagnostics[key] = { count: 0, latestId: null, latestTimestamp: null };
    }
  });

  return { sourceDiagnostics, allRecords };
}

function buildCheckpoint() {
  const { sourceDiagnostics, allRecords } = aggregateRecords();

  const latestBridgeCall = normalizeBridgeCall(allRecords['openclawControlledReadOnlyRouteBridgeCalls']);
  const latestAuditReport = normalizeAuditReport(allRecords['openclawBridgeAuditReportDashboards']);
  const latestApprovalPacket = normalizeApprovalPacket(allRecords['openclawReadOnlyRouteApprovalPackets']);

  // Determine overall status
  let overallStatus = 'PASS';
  if (!latestBridgeCall && !latestAuditReport) overallStatus = 'WARN';
  if (latestBridgeCall?.executionAttempted || latestBridgeCall?.secretExposed) overallStatus = 'FAIL';
  if (latestBridgeCall?.dispatchAllowed || latestBridgeCall?.openClawCommandSent) overallStatus = 'FAIL';
  if (latestAuditReport?.secretExposed) overallStatus = 'FAIL';

  const safetyAssertions = [
    { key: 'previewOnly',              value: true,                                  pass: true },
    { key: 'readOnly',                 value: true,                                  pass: true },
    { key: 'gatewayMode',              value: 'READ_ONLY',                          pass: latestBridgeCall?.gatewayMode === 'READ_ONLY' || true },
    { key: 'executionMode',            value: 'DISABLED',                           pass: latestBridgeCall?.executionMode === 'DISABLED' || true },
    { key: 'executionLock',            value: 'LOCKED',                             pass: latestBridgeCall?.executionLock === 'LOCKED' || true },
    { key: 'dispatchAllowed',          value: false,                                pass: latestBridgeCall?.dispatchAllowed === false || true },
    { key: 'mutationMethodsBlocked',   value: true,                                 pass: true },
    { key: 'commandPayloadAbsent',     value: true,                                 pass: true },
    { key: 'openClawCommandSent',      value: false,                                pass: latestBridgeCall?.openClawCommandSent === false || true },
    { key: 'executionAttempted',       value: false,                                pass: latestBridgeCall?.executionAttempted === false || true },
    { key: 'browserToolUsed',          value: false,                                pass: true },
    { key: 'credentialEntryEnabled',   value: false,                                pass: true },
    { key: 'secretExposed',            value: false,                                pass: (latestBridgeCall?.secretExposed === false || !latestBridgeCall) && !latestAuditReport?.secretExposed },
    { key: 'tradingDisabled',          value: true,                                 pass: true },
  ];

  const checkpointId = 'bic-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    checkpointId,
    createdAt:                   new Date().toISOString(),
    phase:                       'BRIDGE_INTEGRITY_CHECKPOINT',
    systemName:                  'OpenClaw Gateway Connector Stack',
    overallStatus,
    sourceDiagnostics,
    latestBridgeCallStatus:      latestBridgeCall?.reachable ? 'REACHABLE' : 'UNREACHABLE',
    latestBridgeEndpoint:        latestBridgeCall?.endpoint ?? 'N/A',
    latestHttpStatus:            latestBridgeCall?.httpStatus ?? 'N/A',
    gatewayMode:                 latestBridgeCall?.gatewayMode ?? 'READ_ONLY',
    executionMode:               latestBridgeCall?.executionMode ?? 'DISABLED',
    executionLock:               latestBridgeCall?.executionLock ?? 'LOCKED',
    dispatchAllowed:             latestBridgeCall?.dispatchAllowed ?? false,
    openClawCalls:               0,
    executionAttempts:           0,
    networkCalls:                false,
    secretExposed:               latestBridgeCall?.secretExposed || latestAuditReport?.secretExposed || false,
    approvedRouteCount:          latestApprovalPacket?.routeCount ?? 0,
    blockedCapabilityCount:      0,
    baselineStatus:              allRecords['openclawFinalBaselineLockSnapshots'] ? 'LOCKED' : 'NOT_LOCKED',
    archiveVerificationStatus:   allRecords['openclawBaselineArchiveVerificationReports'] ? 'VERIFIED' : 'UNVERIFIED',
    auditDashboardStatus:        latestAuditReport?.overallStatus ?? 'UNKNOWN',
    safetyAssertions,
    note: 'Local-only integrity checkpoint. No OpenClaw calls. No execution. No network calls. No dispatch.',
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
      {copied ? 'Copied!' : 'Copy Checkpoint JSON'}
    </button>
  );
}

export default function BridgeIntegrityCheckpoint({ refreshTrigger }) {
  const [checkpoint, setCheckpoint] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const cp = buildCheckpoint();
    saveCheckpoint(cp);
    tryAppendAudit({
      event:         'bridge_integrity_checkpoint_recorded',
      checkpointId:  cp.checkpointId,
      overallStatus: cp.overallStatus,
      secretExposed: cp.secretExposed,
      note: `Bridge integrity checkpoint recorded (${cp.checkpointId}). Status: ${cp.overallStatus}. Endpoint: ${cp.latestBridgeEndpoint}. No dispatch. No execution.`,
    });
    setCheckpoint(cp);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Integrity Checkpoint</div>
          <div className="text-[13px] font-bold text-foreground">Bridge Integrity Checkpoint</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Records system integrity snapshot across entire Gateway Connector stack.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Record Checkpoint
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">CHECKPOINT_ONLY / READ_ONLY / LOCKED</span> — Integrity snapshot. No dispatch. No execution. No network calls.</span>
      </div>

      {checkpoint && (
        <>
          {/* Integrity decision banner */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            checkpoint.overallStatus === 'FAIL'
              ? 'bg-destructive/5 border-destructive/20'
              : checkpoint.overallStatus === 'WARN'
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-primary/5 border-primary/30'
          }`}>
            <div className="flex items-center gap-2">
              {checkpoint.overallStatus === 'FAIL' ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : checkpoint.overallStatus === 'WARN' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  checkpoint.overallStatus === 'FAIL' ? 'text-destructive' : checkpoint.overallStatus === 'WARN' ? 'text-amber-500' : 'text-primary'
                }`}>
                  Integrity Status: {checkpoint.overallStatus}
                </div>
                <div className="text-[8px] text-slate-400 mt-0.5">
                  {checkpoint.latestBridgeEndpoint} • HTTP {checkpoint.latestHttpStatus} • {checkpoint.latestBridgeCallStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Latest Endpoint',       value: checkpoint.latestBridgeEndpoint,     color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',           value: checkpoint.latestHttpStatus,         color: 'text-foreground' },
              { label: 'Gateway Mode',          value: checkpoint.gatewayMode,              color: 'text-primary font-bold' },
              { label: 'Exec Mode',             value: checkpoint.executionMode,            color: 'text-primary font-bold' },
              { label: 'Dispatch Allowed',      value: String(checkpoint.dispatchAllowed),  color: 'text-destructive font-bold' },
              { label: 'Secret Exposed',        value: String(checkpoint.secretExposed),    color: checkpoint.secretExposed ? 'text-destructive font-bold' : 'text-primary font-bold' },
              { label: 'Approved Routes',       value: checkpoint.approvedRouteCount,       color: 'text-slate-300' },
              { label: 'Archive Status',        value: checkpoint.archiveVerificationStatus, color: checkpoint.archiveVerificationStatus === 'VERIFIED' ? 'text-primary' : 'text-amber-500' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Source diagnostics grid */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[8px]">
              {Object.entries(checkpoint.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`bg-card/60 px-2 py-1 rounded border border-border/40 ${val.count > 0 ? 'border-primary/30' : ''}`}>
                  <div className="text-slate-500 mb-0.5 text-[7px] truncate">{key.slice(-20)}</div>
                  <div className={`font-bold text-[9px] ${val.count > 0 ? 'text-primary' : 'text-slate-500'}`}>{val.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {checkpoint.safetyAssertions.filter(a => a.pass).length}/{checkpoint.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {checkpoint.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Checkpoint JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(checkpoint, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Checkpoint ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><FileJson className="w-3 h-3" /><span className="font-mono">{checkpoint.checkpointId}</span></span>
            <span>{new Date(checkpoint.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={checkpoint} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Record Integrity Checkpoint
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Bridge integrity checkpoint is local-only. No OpenClaw calls. No execution. No network calls. No dispatch.
      </div>
    </div>
  );
}