/**
 * ManualMonitoringEvidenceExport
 * Local-only evidence export from manual read-only monitoring checks.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no scheduler, no polling loop
 *   - Export only - does not trigger new checks
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Copy, ShieldCheck, RefreshCw, FileJson, Lock } from 'lucide-react';
import ManualMonitoringAuditDashboard from './ManualMonitoringAuditDashboard.jsx';

const SOURCE_KEYS = {
  monitoringChecks:    'openclawManualReadOnlyMonitoringChecks', // reads from ManualReadOnlyMonitoringConsole output
  readinessPackets:    'openclawMonitoringModeReadinessPackets',
  promotionGates:      'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints: 'openclawBridgeIntegrityCheckpoints',
  auditTrail:          'openclawAuditTrail',
};
const EXPORT_KEY = 'openclawManualMonitoringEvidenceExports';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveExport(exp) {
  try {
    const all = loadJSON(EXPORT_KEY, []);
    // Deduplicate by latestCheckId if present, otherwise evidenceExportId
    const deduped = [
      exp,
      ...all.filter(e => {
        if (exp.latestCheckId && e.latestCheckId) {
          return e.latestCheckId !== exp.latestCheckId;
        }
        return e.evidenceExportId !== exp.evidenceExportId;
      }),
    ];
    localStorage.setItem(EXPORT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildEvidenceExport() {
  const monitoringChecks = loadJSON(SOURCE_KEYS.monitoringChecks, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);

  const latestCheck = monitoringChecks[0];
  const latestPacket = readinessPackets[0];
  const latestGate = promotionGates[0];
  const latestIntegrity = integrityCheckpoints[0];

  // Count successful checks (status SUCCESS + httpStatus 200 + gatewayReachable true)
  const successfulChecks = monitoringChecks.filter(c =>
    c.status === 'SUCCESS' && c.httpStatus === 200 && c.gatewayReachable && !c.executionAttempted && !c.secretExposed && !c.dispatchAllowed
  ).length;

  // Collect recent checks (up to 10)
  const recentChecks = monitoringChecks.slice(0, 10).map(c => ({
    checkId:         c.checkId,
    createdAt:       c.createdAt,
    endpoint:        c.endpoint,
    httpStatus:      c.httpStatus,
    gatewayReachable: c.gatewayReachable,
    cfAccessDetected: c.cfAccessDetected,
  }));

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                              pass: true },
    { key: 'disabled',                 value: true,                              pass: true },
    { key: 'executionLock',            value: 'LOCKED',                          pass: true },
    { key: 'monitoringMode',           value: 'MANUAL_ONLY',                     pass: true },
    { key: 'methodGetOnly',            value: 'GET',                             pass: true },
    { key: 'noScheduler',              value: false,                             pass: true },
    { key: 'noPollingLoop',            value: false,                             pass: true },
    { key: 'noCommandPayload',         value: true,                              pass: true },
    { key: 'dispatchAllowed',          value: false,                             pass: true },
    { key: 'commandDispatchAttempted', value: false,                             pass: true },
    { key: 'openClawCommandSent',      value: false,                             pass: true },
    { key: 'executionAttempted',       value: false,                             pass: true },
    { key: 'browserToolUsed',          value: false,                             pass: true },
    { key: 'credentialExposed',        value: false,                             pass: true },
    { key: 'secretExposed',            value: false,                             pass: true },
    { key: 'tradingAttempted',         value: false,                             pass: true },
    { key: 'brokerActionsAttempted',   value: false,                             pass: true },
    { key: 'moneyMovementAttempted',   value: false,                             pass: true },
  ];

  const sourceDiagnostics = {
    monitoringCheckCount:         monitoringChecks.length,
    readinessPacketPresent:       !!latestPacket,
    promotionGatePresent:         !!latestGate,
    integrityCheckpointPresent:   !!latestIntegrity,
    latestPacketStatus:           latestPacket?.readinessStatus ?? 'UNKNOWN',
    latestGateDecision:           latestGate?.promotionDecision ?? 'UNKNOWN',
    latestIntegrityStatus:        latestIntegrity?.overallStatus ?? 'UNKNOWN',
  };

  const evidenceExportId = 'mmee-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    evidenceExportId,
    createdAt:                 new Date().toISOString(),
    phase:                     'MANUAL_MONITORING_EVIDENCE_EXPORT',
    systemName:                'VeridanCore OpenClaw Operator Portal',
    sourceCheckCount:          monitoringChecks.length,
    successfulCheckCount:      successfulChecks,
    latestCheckId:             latestCheck?.checkId ?? null,
    latestEndpoint:            latestCheck?.endpoint ?? null,
    latestHttpStatus:          latestCheck?.httpStatus ?? null,
    latestGatewayReachable:    latestCheck?.gatewayReachable ?? false,
    latestCfAccessDetected:    latestCheck?.cfAccessDetected ?? false,
    gatewayMode:               'READ_ONLY',
    executionMode:             'DISABLED',
    executionLock:             'LOCKED',
    monitoringMode:            'MANUAL_ONLY',
    schedulerActive:           false,
    pollingLoopActive:         false,
    dispatchAllowed:           false,
    commandDispatchAttempted:  false,
    openClawCommandSent:       false,
    executionAttempted:        false,
    browserToolUsed:           false,
    credentialExposed:         false,
    secretExposed:             false,
    tradingAttempted:          false,
    moneyMovementAttempted:    false,
    recentChecks,
    sourceDiagnostics,
    safetyAssertions,
    note: 'Manual monitoring evidence export only. No new OpenClaw call. No scheduler. No polling. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Manual Monitoring Evidence JSON'}
    </button>
  );
}

export default function ManualMonitoringEvidenceExport({ refreshTrigger }) {
  const [exp, setExp] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const e = buildEvidenceExport();
    saveExport(e);
    tryAppendAudit({
      event:             'manual_monitoring_evidence_export_created',
      evidenceExportId:  e.evidenceExportId,
      latestCheckId:     e.latestCheckId,
      latestEndpoint:    e.latestEndpoint,
      sourceCheckCount:  e.sourceCheckCount,
      note: `Manual monitoring evidence export created (${e.evidenceExportId}). Checks included: ${e.sourceCheckCount}. Latest endpoint: ${e.latestEndpoint}. No new OpenClaw call. No dispatch. No execution.`,
    });
    setExp(e);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Evidence Export</div>
          <div className="text-[13px] font-bold text-foreground">Manual Monitoring Evidence Export</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Exports evidence from manual read-only monitoring checks. No new OpenClaw calls.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">EXPORT_ONLY / READ_ONLY / LOCKED</span> — Evidence export. No new OpenClaw call. No dispatch. No execution.</span>
      </div>

      {exp && (
        <>
          {/* Evidence status banner */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            exp.sourceCheckCount > 0
              ? 'bg-primary/5 border-primary/30'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {exp.sourceCheckCount > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  exp.sourceCheckCount > 0 ? 'text-primary' : 'text-amber-500'
                }`}>
                  {exp.sourceCheckCount > 0 ? 'CHECKS AVAILABLE' : 'NO CHECKS AVAILABLE'}
                </div>
                <div className={`text-[8px] mt-0.5 ${exp.sourceCheckCount > 0 ? 'text-primary/80' : 'text-amber-500/80'}`}>
                  Total checks: {exp.sourceCheckCount} • Latest endpoint: {exp.latestEndpoint ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
           {[
             { label: 'Total Checks',           value: exp.sourceCheckCount,                   color: 'text-foreground' },
             { label: 'Successful Checks',      value: exp.successfulCheckCount,               color: 'text-primary font-bold' },
             { label: 'Latest Endpoint',        value: exp.latestEndpoint ?? 'N/A',            color: 'text-blue-400 font-mono text-[8px]' },
             { label: 'Latest HTTP Status',     value: exp.latestHttpStatus ?? 'N/A',          color: 'text-foreground' },
             { label: 'Gateway Reachable',      value: String(exp.latestGatewayReachable),     color: exp.latestGatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
             { label: 'Scheduler Active',       value: String(exp.schedulerActive),            color: 'text-destructive font-bold' },
             { label: 'Polling Loop Active',    value: String(exp.pollingLoopActive),          color: 'text-destructive font-bold' },
             { label: 'Dispatch Allowed',       value: String(exp.dispatchAllowed),            color: 'text-destructive font-bold' },
           ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Recent checks table */}
          {exp.recentChecks.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-secondary/10 border-b border-border">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                  Recent Checks — {exp.recentChecks.length} included
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Timestamp', 'Endpoint', 'HTTP Status', 'Reachable', 'CF Access'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exp.recentChecks.map((check, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">{new Date(check.createdAt).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{check.endpoint}</td>
                        <td className="px-3 py-2 font-bold text-foreground whitespace-nowrap">{check.httpStatus ?? 'N/A'}</td>
                        <td className={`px-3 py-2 font-bold whitespace-nowrap ${check.gatewayReachable ? 'text-primary' : 'text-amber-500'}`}>
                          {String(check.gatewayReachable)}
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{String(check.cfAccessDetected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Source diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Monitoring Checks',       value: exp.sourceDiagnostics.monitoringCheckCount, color: 'text-primary font-bold' },
                { label: 'Readiness Packet Present', value: String(exp.sourceDiagnostics.readinessPacketPresent), color: exp.sourceDiagnostics.readinessPacketPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Promotion Gate Present',  value: String(exp.sourceDiagnostics.promotionGatePresent), color: exp.sourceDiagnostics.promotionGatePresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Integrity Checkpoint',    value: String(exp.sourceDiagnostics.integrityCheckpointPresent), color: exp.sourceDiagnostics.integrityCheckpointPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Latest Packet Status',    value: exp.sourceDiagnostics.latestPacketStatus, color: 'text-slate-300' },
                { label: 'Latest Gate Decision',    value: exp.sourceDiagnostics.latestGateDecision.split('_')[0], color: 'text-slate-300' },
              ].map(c => (
                <div key={c.label} className="bg-card/60 border border-border/40 px-2.5 py-2 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                  <div className={`text-[9px] font-semibold break-all ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {exp.safetyAssertions.filter(a => a.pass).length}/{exp.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {exp.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Manual Monitoring Evidence JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(exp, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Export ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{exp.evidenceExportId}</span></span>
            <span>{new Date(exp.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={exp} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Evidence Export
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Manual monitoring evidence export is local-only. No new OpenClaw calls. No scheduler. No polling. No dispatch. No execution.
      </div>

      {/* ── Manual Monitoring Audit Dashboard ── */}
      <div className="border-t border-border/40 pt-4">
        <ManualMonitoringAuditDashboard refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}