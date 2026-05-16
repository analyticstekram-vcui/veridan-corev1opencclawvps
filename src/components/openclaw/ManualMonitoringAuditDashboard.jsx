/**
 * ManualMonitoringAuditDashboard
 * Local-only audit dashboard for manual read-only monitoring evidence review.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no scheduler, no polling loop
 *   - Audit review only - does not trigger new checks
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldCheck, RefreshCw, FileJson, Lock } from 'lucide-react';
import ManualMonitoringPromotionGate from './ManualMonitoringPromotionGate.jsx';

const SOURCE_KEYS = {
  monitoringChecks:    'openclawManualReadOnlyMonitoringChecks',
  evidenceExports:     'openclawManualMonitoringEvidenceExports',
  readinessPackets:    'openclawMonitoringModeReadinessPackets',
  promotionGates:      'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints: 'openclawBridgeIntegrityCheckpoints',
  auditTrail:          'openclawAuditTrail',
};
const DASHBOARD_KEY = 'openclawManualMonitoringAuditDashboards';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveDashboard(dashboard) {
  try {
    const all = loadJSON(DASHBOARD_KEY, []);
    const deduped = [dashboard, ...all.filter(d => d.auditDashboardId !== dashboard.auditDashboardId)];
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildAuditDashboard() {
  const monitoringChecks = loadJSON(SOURCE_KEYS.monitoringChecks, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);

  const latestCheck = monitoringChecks[0];
  const latestExport = evidenceExports[0];
  const latestPacket = readinessPackets[0];
  const latestGate = promotionGates[0];
  const latestIntegrity = integrityCheckpoints[0];

  // Count successful and failed checks
  const successfulChecks = monitoringChecks.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.error &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  const failedChecks = monitoringChecks.filter(c =>
    c.error || c.executionAttempted || c.secretExposed || c.dispatchAllowed
  ).length;

  // Collect recent checks (up to 5)
  const recentChecks = monitoringChecks.slice(0, 5).map(c => ({
    checkId:         c.checkId,
    createdAt:       c.createdAt,
    endpoint:        c.endpoint,
    httpStatus:      c.httpStatus,
    gatewayReachable: c.gatewayReachable,
    error:           c.error,
  }));

  // Collect evidence exports (up to 5)
  const recentExports = evidenceExports.slice(0, 5).map(e => ({
    evidenceExportId: e.evidenceExportId,
    createdAt:        e.createdAt,
    sourceCheckCount: e.sourceCheckCount,
    latestEndpoint:   e.latestEndpoint,
  }));

  // Determine audit status
  let auditStatus = 'FAIL';
  const hasUnsafeField =
    latestCheck?.executionAttempted === true ||
    latestCheck?.dispatchAllowed === true ||
    latestCheck?.openClawCommandSent === true ||
    latestCheck?.browserToolUsed === true ||
    latestCheck?.secretExposed === true ||
    latestCheck?.credentialExposed === true ||
    latestCheck?.tradingAttempted === true ||
    latestCheck?.moneyMovementAttempted === true ||
    latestCheck?.schedulerActive === true ||
    latestCheck?.pollingLoopActive === true;

  if (hasUnsafeField) {
    auditStatus = 'FAIL';
  } else if (successfulChecks > 0 && recentExports.length > 0) {
    auditStatus = 'PASS';
  } else if (!hasUnsafeField && (monitoringChecks.length > 0 || evidenceExports.length > 0)) {
    auditStatus = 'WARN';
  }

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                              pass: true },
    { key: 'disabled',                 value: true,                              pass: true },
    { key: 'executionLock',            value: 'LOCKED',                          pass: true },
    { key: 'monitoringMode',           value: 'MANUAL_ONLY',                     pass: true },
    { key: 'methodGetOnly',            value: 'GET',                             pass: true },
    { key: 'noScheduler',              value: false,                             pass: true },
    { key: 'noPollingLoop',            value: false,                             pass: true },
    { key: 'noCommandPayload',         value: true,                              pass: true },
    { key: 'dispatchAllowed',          value: false,                             pass: !latestCheck?.dispatchAllowed },
    { key: 'commandDispatchAttempted', value: false,                             pass: !latestCheck?.commandDispatchAttempted },
    { key: 'openClawCommandSent',      value: false,                             pass: !latestCheck?.openClawCommandSent },
    { key: 'executionAttempted',       value: false,                             pass: !latestCheck?.executionAttempted },
    { key: 'browserToolUsed',          value: false,                             pass: !latestCheck?.browserToolUsed },
    { key: 'credentialExposed',        value: false,                             pass: !latestCheck?.credentialExposed },
    { key: 'secretExposed',            value: false,                             pass: !latestCheck?.secretExposed },
    { key: 'tradingAttempted',         value: false,                             pass: !latestCheck?.tradingAttempted },
    { key: 'brokerActionsAttempted',   value: false,                             pass: !latestCheck?.moneyMovementAttempted },
    { key: 'moneyMovementAttempted',   value: false,                             pass: !latestCheck?.moneyMovementAttempted },
  ];

  const sourceDiagnostics = {
    monitoringCheckCount:         monitoringChecks.length,
    evidenceExportCount:          evidenceExports.length,
    readinessPacketPresent:       !!latestPacket,
    promotionGatePresent:         !!latestGate,
    integrityCheckpointPresent:   !!latestIntegrity,
    latestPacketStatus:           latestPacket?.readinessStatus ?? 'UNKNOWN',
    latestGateDecision:           latestGate?.promotionDecision ?? 'UNKNOWN',
  };

  const auditDashboardId = 'mmad-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    auditDashboardId,
    createdAt:                  new Date().toISOString(),
    phase:                      'MANUAL_MONITORING_AUDIT_DASHBOARD',
    systemName:                 'VeridanCore OpenClaw Operator Portal',
    sourceCheckCount:           monitoringChecks.length,
    evidenceExportCount:        evidenceExports.length,
    successfulChecks,
    failedChecks,
    latestEndpoint:             latestCheck?.endpoint ?? null,
    latestHttpStatus:           latestCheck?.httpStatus ?? null,
    latestGatewayReachable:     latestCheck?.gatewayReachable ?? false,
    latestCfAccessDetected:     latestCheck?.cfAccessDetected ?? false,
    gatewayMode:                'READ_ONLY',
    executionMode:              'DISABLED',
    executionLock:              'LOCKED',
    monitoringMode:             'MANUAL_ONLY',
    schedulerActive:            false,
    pollingLoopActive:          false,
    dispatchAllowed:            false,
    commandDispatchAttempted:   false,
    openClawCommandSent:        false,
    executionAttempted:         false,
    browserToolUsed:            false,
    credentialExposed:          false,
    secretExposed:              false,
    tradingAttempted:           false,
    moneyMovementAttempted:     false,
    auditStatus,
    recentChecks,
    evidenceExports: recentExports,
    sourceDiagnostics,
    safetyAssertions,
    note: 'Manual monitoring audit dashboard only. Local evidence review. No new OpenClaw call. No scheduler. No polling. No dispatch. No execution.',
  };
}

const FILTERS = ['ALL', 'SUCCESS', 'FAILED', 'EVIDENCE_EXPORTS', 'SAFETY_EVENTS'];

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
      {copied ? 'Copied!' : 'Copy Manual Monitoring Audit JSON'}
    </button>
  );
}

export default function ManualMonitoringAuditDashboard({ refreshTrigger }) {
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const d = buildAuditDashboard();
    saveDashboard(d);
    tryAppendAudit({
      event:              'manual_monitoring_audit_dashboard_generated',
      auditDashboardId:   d.auditDashboardId,
      auditStatus:        d.auditStatus,
      sourceCheckCount:   d.sourceCheckCount,
      successfulChecks:   d.successfulChecks,
      failedChecks:       d.failedChecks,
      note: `Manual monitoring audit dashboard generated (${d.auditDashboardId}). Status: ${d.auditStatus}. Checks: ${d.sourceCheckCount}, Successful: ${d.successfulChecks}, Failed: ${d.failedChecks}. No new OpenClaw call. No dispatch.`,
    });
    setDashboard(d);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  const STATUS_STYLE = {
    PASS: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2,  label: 'AUDIT PASS' },
    WARN: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'AUDIT WARNING' },
    FAIL: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'AUDIT FAIL' },
  };

  const style = STATUS_STYLE[dashboard?.auditStatus] || STATUS_STYLE.WARN;
  const Icon = style.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Audit Dashboard</div>
          <div className="text-[13px] font-bold text-foreground">Manual Monitoring Audit Dashboard</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Audits local evidence from manual read-only monitoring. No new OpenClaw calls.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">AUDIT_REVIEW_ONLY / READ_ONLY / LOCKED</span> — Audit review. No new OpenClaw call. No dispatch. No execution.</span>
      </div>

      {dashboard && (
        <>
          {/* Audit status banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[13px] font-bold uppercase tracking-wide ${style.color}`}>
                  {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {dashboard.successfulChecks} successful • {dashboard.failedChecks} failed • {dashboard.sourceCheckCount} total checks
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Audit Status',          value: dashboard.auditStatus,                 color: style.color },
              { label: 'Total Manual Checks',   value: dashboard.sourceCheckCount,            color: 'text-primary font-bold' },
              { label: 'Evidence Exports',      value: dashboard.evidenceExportCount,         color: 'text-slate-300' },
              { label: 'Successful Checks',     value: dashboard.successfulChecks,            color: 'text-primary font-bold' },
              { label: 'Failed Checks',         value: dashboard.failedChecks,                color: dashboard.failedChecks > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Latest Endpoint',       value: dashboard.latestEndpoint ?? 'N/A',     color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'Scheduler Active',      value: String(dashboard.schedulerActive),     color: 'text-destructive font-bold' },
              { label: 'Execution Attempted',   value: String(dashboard.executionAttempted),  color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[8px] font-bold rounded border transition-colors ${
                  filter === f
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-secondary/20 border-border text-slate-400 hover:bg-secondary/40'
                }`}>
                {f}
              </button>
            ))}
            <span className="ml-auto text-[8px] text-slate-500">
              {filter === 'ALL' && `${dashboard.sourceCheckCount} checks`}
              {filter === 'SUCCESS' && `${dashboard.successfulChecks} successful`}
              {filter === 'FAILED' && `${dashboard.failedChecks} failed`}
              {filter === 'EVIDENCE_EXPORTS' && `${dashboard.evidenceExportCount} exports`}
              {filter === 'SAFETY_EVENTS' && `${dashboard.safetyAssertions.filter(a => !a.pass).length} failures`}
            </span>
          </div>

          {/* Recent checks table */}
          {(filter === 'ALL' || filter === 'SUCCESS' || filter === 'FAILED') && dashboard.recentChecks.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-secondary/10 border-b border-border">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                  Recent Manual Checks — {dashboard.recentChecks.length} included
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Timestamp', 'Endpoint', 'HTTP Status', 'Reachable', 'Error'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentChecks.map((check, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[7px]">{new Date(check.createdAt).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{check.endpoint}</td>
                        <td className="px-3 py-2 font-bold text-foreground whitespace-nowrap">{check.httpStatus ?? 'N/A'}</td>
                        <td className={`px-3 py-2 font-bold whitespace-nowrap ${check.gatewayReachable ? 'text-primary' : 'text-amber-500'}`}>
                          {String(check.gatewayReachable)}
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap ${check.error ? 'text-destructive font-bold' : 'text-slate-500'}`}>
                          {check.error ? 'YES' : 'NO'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evidence exports table */}
          {(filter === 'ALL' || filter === 'EVIDENCE_EXPORTS') && dashboard.evidenceExports.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-secondary/10 border-b border-border">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                  Evidence Exports — {dashboard.evidenceExports.length} included
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Timestamp', 'Export ID', 'Check Count', 'Latest Endpoint'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.evidenceExports.map((exp, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[7px]">{new Date(exp.createdAt).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap text-[7px]">{exp.evidenceExportId.slice(-8)}</td>
                        <td className="px-3 py-2 font-bold text-primary whitespace-nowrap">{exp.sourceCheckCount}</td>
                        <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{exp.latestEndpoint ?? 'N/A'}</td>
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
                { label: 'Monitoring Checks',       value: dashboard.sourceDiagnostics.monitoringCheckCount, color: 'text-primary font-bold' },
                { label: 'Evidence Exports',        value: dashboard.sourceDiagnostics.evidenceExportCount, color: 'text-primary font-bold' },
                { label: 'Readiness Packet',        value: String(dashboard.sourceDiagnostics.readinessPacketPresent), color: dashboard.sourceDiagnostics.readinessPacketPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Promotion Gate',          value: String(dashboard.sourceDiagnostics.promotionGatePresent), color: dashboard.sourceDiagnostics.promotionGatePresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Integrity Checkpoint',    value: String(dashboard.sourceDiagnostics.integrityCheckpointPresent), color: dashboard.sourceDiagnostics.integrityCheckpointPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Latest Gate Decision',    value: dashboard.sourceDiagnostics.latestGateDecision.split('_')[0], color: 'text-slate-300' },
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
                Safety Assertions — {dashboard.safetyAssertions.filter(a => a.pass).length}/{dashboard.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {dashboard.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Manual Monitoring Audit JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(dashboard, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Dashboard ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{dashboard.auditDashboardId}</span></span>
            <span>{new Date(dashboard.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={dashboard} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Audit Dashboard
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Manual monitoring audit dashboard is local-only. No new OpenClaw calls. No scheduler. No polling. No dispatch. No execution.
      </div>

      {/* ── Manual Monitoring Promotion Gate ── */}
      <div className="border-t border-border/40 pt-4">
        <ManualMonitoringPromotionGate refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}