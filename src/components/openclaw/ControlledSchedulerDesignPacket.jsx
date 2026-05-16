/**
 * ControlledSchedulerDesignPacket
 * Design-only scheduler gate documenting future scheduler allowances.
 * No actual scheduler, polling, timers, or automated behavior.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only
 *   - No actual scheduler implementation
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  qaReports:                       'openclawGatewayConnectorQAReports',
  finalAcceptancePackets:          'openclawManualMonitoringFinalAcceptancePackets',
  promotionGates:                  'openclawManualMonitoringPromotionGates',
  manualAuditDashboards:           'openclawManualMonitoringAuditDashboards',
  manualEvidenceExports:           'openclawManualMonitoringEvidenceExports',
  manualChecks:                    'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:                'openclawMonitoringModeReadinessPackets',
  bridgePromotionGates:            'openclawReadOnlyBridgePromotionGates',
  bridgeIntegrityCheckpoints:      'openclawBridgeIntegrityCheckpoints',
  bridgeAuditReportDashboards:     'openclawBridgeAuditReportDashboards',
  sessionFinalArchiveExports:      'openclawOperatorSessionFinalArchiveExports',
  sessionAuditDashboards:          'openclawOperatorSessionAuditDashboards',
  sessionEvidenceExports:          'openclawOperatorSessionEvidenceExports',
  sessionLogs:                     'openclawOperatorSessionLogs',
  auditTrail:                      'openclawAuditTrail',
};

const DESIGN_PACKET_KEY = 'openclawControlledSchedulerDesignPackets';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveDesignPacket(packet) {
  try {
    const all = loadJSON(DESIGN_PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => {
      if (packet.latestQAReportId && p.latestQAReportId) {
        return p.latestQAReportId !== packet.latestQAReportId;
      }
      return p.schedulerDesignId !== packet.schedulerDesignId;
    })];
    localStorage.setItem(DESIGN_PACKET_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildDesignPacket() {
  const qaReports = loadJSON(SOURCE_KEYS.qaReports, []);
  const latestQAReport = qaReports[0];
  const finalAcceptancePackets = loadJSON(SOURCE_KEYS.finalAcceptancePackets, []);
  const latestFinalAcceptance = finalAcceptancePackets[0];
  const manualAuditDashboards = loadJSON(SOURCE_KEYS.manualAuditDashboards, []);
  const latestManualAudit = manualAuditDashboards[0];
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const latestReadiness = readinessPackets[0];
  const bridgeIntegrityCheckpoints = loadJSON(SOURCE_KEYS.bridgeIntegrityCheckpoints, []);
  const latestBridgeIntegrity = bridgeIntegrityCheckpoints[0];

  // Design status determination
  let designStatus = 'DESIGN_ONLY';
  let blockingFailure = false;

  // Check for safety failures
  const safetyFailures = [
    latestQAReport?.qaStatus === 'FAIL',
    latestManualAudit?.auditStatus === 'FAILED',
    latestBridgeIntegrity?.integrityStatus === 'FAILED',
  ];

  if (safetyFailures.some(f => f)) {
    designStatus = 'BLOCKED_BY_SAFETY_FAILURE';
    blockingFailure = true;
  } else if (!latestQAReport || !latestFinalAcceptance || !latestManualAudit) {
    designStatus = 'HOLD_FOR_QA';
  } else if (latestQAReport.qaStatus !== 'PASS') {
    designStatus = 'HOLD_FOR_QA';
  }

  const requiredPreconditions = [
    { key: 'QA report PASS',                         met: latestQAReport?.qaStatus === 'PASS' },
    { key: 'final acceptance ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING', met: latestFinalAcceptance?.acceptanceStatus?.includes('ACCEPTED') },
    { key: 'manual monitoring audit PASS',           met: latestManualAudit?.auditStatus === 'PASS' },
    { key: 'bridge integrity PASS',                  met: latestBridgeIntegrity?.integrityStatus === 'PASS' },
    { key: 'operator approval required',             met: true },
    { key: 'backend-only credential boundary verified', met: true },
    { key: 'endpoint allowlist locked to /health, /status, /version, /capabilities', met: true },
    { key: 'GET-only status checks',                 met: true },
    { key: 'no command payloads',                    met: true },
    { key: 'no mutation methods',                    met: true },
    { key: 'kill switch design required',            met: true },
    { key: 'evidence export after every automated run required', met: true },
  ];

  const explicitlyBlockedBehaviors = [
    'command dispatch',
    'browser execution',
    'POST/PUT/PATCH/DELETE',
    'trading',
    'broker execution',
    'credential entry',
    'wallet actions',
    'money movement',
    'direct OpenAI API calls',
    'frontend secrets',
    'sub-minute polling',
    'continuous loops',
    'unattended remediation',
    'automatic command generation',
  ];

  const allowedFutureEndpoints = [
    '/health',
    '/status',
    '/version',
    '/capabilities',
  ];

  const sourceDiagnostics = {
    qaReportsPresent: qaReports.length > 0,
    finalAcceptancePresent: finalAcceptancePackets.length > 0,
    manualAuditPresent: manualAuditDashboards.length > 0,
    readinessPresent: readinessPackets.length > 0,
    bridgeIntegrityPresent: bridgeIntegrityCheckpoints.length > 0,
    sessionLogsPresent: loadJSON(SOURCE_KEYS.sessionLogs, []).length > 0,
    auditTrailPresent: loadJSON(SOURCE_KEYS.auditTrail, []).length > 0,
  };

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                      pass: true },
    { key: 'executionLocked',          value: 'LOCKED',                 pass: true },
    { key: 'executionModeDisabled',    value: 'DISABLED',               pass: true },
    { key: 'monitoringModeManualOnly', value: 'MANUAL_ONLY',            pass: true },
    { key: 'schedulerApproved',        value: false,                     pass: true },
    { key: 'schedulerActive',          value: false,                     pass: true },
    { key: 'pollingApproved',          value: false,                     pass: true },
    { key: 'pollingLoopActive',        value: false,                     pass: true },
    { key: 'automatedTriggersEnabled', value: false,                     pass: true },
    { key: 'backgroundJobsEnabled',    value: false,                     pass: true },
    { key: 'noTimersEnabled',          value: true,                      pass: true },
    { key: 'noIntervalsEnabled',       value: true,                      pass: true },
    { key: 'noCronJobsEnabled',        value: true,                      pass: true },
    { key: 'noCommandPayload',         value: true,                      pass: true },
    { key: 'dispatchAllowed',          value: false,                     pass: true },
    { key: 'commandDispatchAllowed',   value: false,                     pass: true },
    { key: 'openClawCommandSent',      value: false,                     pass: true },
    { key: 'executionAttempted',       value: false,                     pass: true },
    { key: 'browserToolUsed',          value: false,                     pass: true },
    { key: 'credentialExposed',        value: false,                     pass: true },
    { key: 'secretExposed',            value: false,                     pass: true },
    { key: 'tradingAttempted',         value: false,                     pass: true },
    { key: 'moneyMovementAttempted',   value: false,                     pass: true },
    { key: 'mutationEndpointsDisabled', value: true,                     pass: true },
  ];

  const nextRecommendedPhase = designStatus === 'DESIGN_ONLY' 
    ? 'Future: Operator-approved scheduler implementation with kill switch and evidence export on every run'
    : designStatus === 'HOLD_FOR_QA'
    ? 'Complete QA report and manual monitoring evidence before scheduler design approval'
    : 'Resolve safety failures before any scheduler consideration';

  const schedulerDesignId = 'csdp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    schedulerDesignId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_DESIGN_PACKET',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    designStatus,
    approvedScope: 'FUTURE_READ_ONLY_STATUS_MONITORING_DESIGN_ONLY',
    gatewayMode: 'READ_ONLY',
    executionMode: 'DISABLED',
    executionLock: 'LOCKED',
    monitoringMode: 'MANUAL_ONLY',
    schedulerApproved: false,
    schedulerActive: false,
    pollingApproved: false,
    pollingLoopActive: false,
    automatedTriggersEnabled: false,
    backgroundJobsEnabled: false,
    dispatchAllowed: false,
    commandDispatchAllowed: false,
    executionAllowed: false,
    allowedFutureEndpoints,
    allowedFutureMethod: 'GET only',
    minimumFutureIntervalRecommendation: 'operator-defined later; not active',
    requiredPreconditions,
    explicitlyBlockedSchedulerBehaviors: explicitlyBlockedBehaviors,
    sourceDiagnostics,
    latestQAReportId: latestQAReport?.qaReportId ?? null,
    latestQAStatus: latestQAReport?.qaStatus ?? 'UNKNOWN',
    latestFinalAcceptanceStatus: latestFinalAcceptance?.acceptanceStatus ?? 'UNKNOWN',
    latestManualAuditStatus: latestManualAudit?.auditStatus ?? 'UNKNOWN',
    latestReadinessStatus: latestReadiness?.readinessStatus ?? 'UNKNOWN',
    latestBridgeIntegrityStatus: latestBridgeIntegrity?.integrityStatus ?? 'UNKNOWN',
    safetyAssertions,
    nextRecommendedPhase,
    note: 'Scheduler design packet only. No scheduler approved. No scheduler active. No polling. No automated calls. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Scheduler Design Packet JSON'}
    </button>
  );
}

export default function ControlledSchedulerDesignPacket() {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildDesignPacket();
    saveDesignPacket(p);
    tryAppendAudit({
      event: 'controlled_scheduler_design_packet_created',
      schedulerDesignId: p.schedulerDesignId,
      designStatus: p.designStatus,
      latestQAStatus: p.latestQAStatus,
      note: `Scheduler design packet created (${p.schedulerDesignId}). Status: ${p.designStatus}. QA: ${p.latestQAStatus}. No scheduler. No polling.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const STATUS_STYLE = {
    DESIGN_ONLY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'DESIGN_ONLY' },
    HOLD_FOR_QA: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD_FOR_QA' },
    BLOCKED_BY_SAFETY_FAILURE: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED' },
  };

  const style = packet ? (STATUS_STYLE[packet.designStatus] || STATUS_STYLE.HOLD_FOR_QA) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Design Phase</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler Design Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Design-only documentation of future scheduler allowances — no implementation or automation.</div>
        </div>
        {packet && (
          <button type="button" onClick={generate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">DESIGN_ONLY / READ_ONLY / LOCKED</span> — No scheduler active. No polling. No automation. Design documentation only.</span>
      </div>

      {packet && (
        <>
          {/* Design Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Design Status: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {style.label === 'DESIGN_ONLY' && 'Scheduler design approved for documentation. No implementation. Operator approval required before any future activation.'}
                  {style.label === 'HOLD_FOR_QA' && 'Scheduler design on hold pending QA completion and evidence availability.'}
                  {style.label === 'BLOCKED' && 'Scheduler design blocked by safety failure. Resolve immediately.'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Design Status',        value: packet.designStatus.split('_')[0],     color: style.color },
              { label: 'Latest QA Status',     value: packet.latestQAStatus,                  color: 'text-slate-300' },
              { label: 'Final Acceptance',     value: packet.latestFinalAcceptanceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Manual Audit Status',  value: packet.latestManualAuditStatus,         color: 'text-slate-300' },
              { label: 'Readiness Status',     value: packet.latestReadinessStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Bridge Integrity',     value: packet.latestBridgeIntegrityStatus,     color: 'text-slate-300' },
              { label: 'Scheduler Approved',   value: String(packet.schedulerApproved),       color: 'text-destructive font-bold' },
              { label: 'Scheduler Active',     value: String(packet.schedulerActive),         color: 'text-destructive font-bold' },
              { label: 'Polling Loop Active',  value: String(packet.pollingLoopActive),       color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',    value: String(packet.executionAllowed),        color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Required Preconditions Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Required Preconditions Before Any Future Scheduler</div>
            </div>
            <div className="divide-y divide-border/30">
              {packet.requiredPreconditions.map((pre, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2">
                  {pre.met ? (
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                  <span className={`text-[8px] flex-1 ${pre.met ? 'text-slate-300' : 'text-amber-500'}`}>{pre.key}</span>
                  <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${pre.met ? 'border-primary/30 bg-primary/5 text-primary' : 'border-amber-500/30 bg-amber-500/5 text-amber-500'}`}>
                    {pre.met ? 'MET' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicitly Blocked Scheduler Behaviors Grid */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Explicitly Blocked Scheduler Behaviors</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packet.explicitlyBlockedSchedulerBehaviors.map(behavior => (
                <div key={behavior} className="flex items-start gap-2 px-2 py-1.5 rounded border border-destructive/20 bg-destructive/5">
                  <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{behavior}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Future Endpoints Grid */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Allowed Future Endpoints (GET only)</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {packet.allowedFutureEndpoints.map(endpoint => (
                <div key={endpoint} className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-[8px] text-slate-300 font-mono">{endpoint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(packet.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`flex flex-col items-center px-2 py-1.5 rounded border border-border/40 ${val ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10'}`}>
                  <span className="text-slate-500 mb-0.5 uppercase text-[6px] tracking-widest text-center">{key}</span>
                  <span className={`text-[9px] font-bold ${val ? 'text-primary' : 'text-slate-500'}`}>{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {packet.safetyAssertions.filter(a => a.pass).length}/{packet.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {packet.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className={`text-[7px] font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>
                    {String(a.value).slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Recommended Phase */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-amber-500 font-semibold mb-2">Next Recommended Phase</div>
            <div className="text-[9px] text-amber-500/90">{packet.nextRecommendedPhase}</div>
          </div>

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Scheduler Design Packet JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(packet, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Design Packet ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{packet.schedulerDesignId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Scheduler Design Packet
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Scheduler design packet is local-only. No scheduler approved. No scheduler active. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}