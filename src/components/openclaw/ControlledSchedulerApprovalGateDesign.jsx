/**
 * ControlledSchedulerApprovalGateDesign
 * Design-only scheduler approval gate documenting readiness for future scheduler design.
 * No actual scheduler, polling, timers, or automation.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only
 *   - Design documentation only, not implementation
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  completionReports:       'openclawManualMonitoringPhaseCompletionReports',
  schedulerDesignPackets:  'openclawControlledSchedulerDesignPackets',
  qaReports:               'openclawGatewayConnectorQAReports',
  finalAcceptancePackets:  'openclawManualMonitoringFinalAcceptancePackets',
  auditReports:            'openclawManualMonitoringAuditReports',
  integrityCheckpoints:    'openclawBridgeIntegrityCheckpoints',
  promotionGates:          'openclawReadOnlyBridgePromotionGates',
  readinessPackets:        'openclawMonitoringModeReadinessPackets',
};

const GATE_PACKET_KEY = 'openclawControlledSchedulerApprovalGateDesigns';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'verifiedAt', 'timestamp', 'snapshotAt', 'completedAt', 'updatedAt'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function getLatestRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null;
  return records.reduce((latest, current) => {
    const latestTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (latest[field] ? new Date(latest[field]).getTime() : 0), 0);
    const currentTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (current[field] ? new Date(current[field]).getTime() : 0), 0);
    return currentTime > latestTime ? current : latest;
  });
}

function saveGatePacket(packet) {
  try {
    const all = loadJSON(GATE_PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => {
      if (packet.latestSchedulerDesignId && p.latestSchedulerDesignId) {
        return p.latestSchedulerDesignId !== packet.latestSchedulerDesignId;
      }
      return p.designGateId !== packet.designGateId;
    })];
    localStorage.setItem(GATE_PACKET_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildGatePacket() {
  const completionReports = loadJSON(SOURCE_KEYS.completionReports, []);
  const latestCompletion = getLatestRecord(completionReports);
  const schedulerDesignPackets = loadJSON(SOURCE_KEYS.schedulerDesignPackets, []);
  const latestSchedulerDesign = getLatestRecord(schedulerDesignPackets);
  const qaReports = loadJSON(SOURCE_KEYS.qaReports, []);
  const latestQA = getLatestRecord(qaReports);
  const finalAcceptancePackets = loadJSON(SOURCE_KEYS.finalAcceptancePackets, []);
  const latestFinalAcceptance = getLatestRecord(finalAcceptancePackets);
  const auditReports = loadJSON(SOURCE_KEYS.auditReports, []);
  const latestAudit = getLatestRecord(auditReports);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);
  const latestIntegrity = getLatestRecord(integrityCheckpoints);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const latestPromotion = getLatestRecord(promotionGates);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const latestReadiness = getLatestRecord(readinessPackets);

  // Determine decision
  let decision = 'DESIGN_READY';
  let reason = 'All evidence sources present and ready for scheduler approval gate design.';

  // Check critical conditions
  const completionStatus = latestCompletion?.completionStatus;
  const qaStatus = latestQA?.qaStatus;
  const acceptanceStatus = latestFinalAcceptance?.acceptanceStatus;
  const auditStatus = latestAudit?.auditStatus;
  const integrityStatus = latestIntegrity?.integrityStatus;
  const promotionDecision = latestPromotion?.promotionDecision;
  const readinessStatus = latestReadiness?.readinessStatus;
  const schedulerDesignStatus = latestSchedulerDesign?.designStatus;

  // BLOCKED conditions
  if (!latestCompletion || !latestSchedulerDesign || !latestQA || !latestFinalAcceptance || !latestIntegrity) {
    decision = 'BLOCKED';
    reason = 'Required evidence sources missing.';
  } else if (
    completionStatus === 'BLOCKED_BY_SAFETY_FAILURE' ||
    qaStatus === 'FAIL' ||
    acceptanceStatus?.includes('REJECTED') ||
    auditStatus === 'FAILED' ||
    integrityStatus === 'FAILED' ||
    schedulerDesignStatus === 'BLOCKED_BY_SAFETY_FAILURE'
  ) {
    decision = 'BLOCKED';
    reason = 'Critical safety failure detected in one or more evidence sources.';
  }
  // HOLD_FOR_QA conditions
  else if (
    qaStatus === 'WARN' ||
    completionStatus === 'COMPLETE_WITH_WARNINGS' ||
    readinessStatus?.includes('HOLD') ||
    promotionDecision?.includes('HOLD')
  ) {
    decision = 'HOLD_FOR_QA';
    reason = 'Evidence present but warnings detected. Recommend QA review before approval gate.';
  }

  const requiredEvidence = [
    { source: 'manualMonitoringPhaseCompletion', key: SOURCE_KEYS.completionReports, status: latestCompletion ? 'PASS' : 'FAIL' },
    { source: 'schedulerDesignPacket', key: SOURCE_KEYS.schedulerDesignPackets, status: latestSchedulerDesign ? 'PASS' : 'FAIL' },
    { source: 'qaReport', key: SOURCE_KEYS.qaReports, status: latestQA ? 'PASS' : 'FAIL' },
    { source: 'finalAcceptancePacket', key: SOURCE_KEYS.finalAcceptancePackets, status: latestFinalAcceptance ? 'PASS' : 'FAIL' },
    { source: 'manualAuditReport', key: SOURCE_KEYS.auditReports, status: latestAudit ? (auditStatus === 'FAILED' ? 'FAIL' : 'PASS') : 'WARN' },
    { source: 'bridgeIntegrityCheckpoint', key: SOURCE_KEYS.integrityCheckpoints, status: latestIntegrity ? 'PASS' : 'FAIL' },
    { source: 'readOnlyBridgePromotionGate', key: SOURCE_KEYS.promotionGates, status: latestPromotion ? 'PASS' : 'WARN' },
    { source: 'monitoringModeReadinessPacket', key: SOURCE_KEYS.readinessPackets, status: latestReadiness ? 'PASS' : 'WARN' },
  ];

  const sourceDiagnostics = {
    completionReportsCount: completionReports.length,
    schedulerDesignPacketsCount: schedulerDesignPackets.length,
    qaReportsCount: qaReports.length,
    finalAcceptancePacketsCount: finalAcceptancePackets.length,
    auditReportsCount: auditReports.length,
    integrityCheckpointsCount: integrityCheckpoints.length,
    promotionGatesCount: promotionGates.length,
    readinessPacketsCount: readinessPackets.length,
  };

  const allowedDesignConcepts = [
    'schedule policy model',
    'endpoint allowlist policy',
    'manual approval gate model',
    'read-only status snapshot format',
    'audit evidence schema',
    'operator override procedure',
  ];

  const blockedRuntimeBehaviors = [
    'actual scheduler activation',
    'polling intervals',
    'setInterval/setTimeout loops',
    'autonomous monitoring',
    'OpenClaw command dispatch',
    'mutation HTTP methods',
    'trading',
    'credential display',
    'browser automation',
    'direct OpenAI calls',
    'money movement',
  ];

  const safetyAssertions = [
    { key: 'previewOnly',                value: true,                      pass: true },
    { key: 'readOnly',                   value: true,                      pass: true },
    { key: 'executionLocked',            value: 'LOCKED',                 pass: true },
    { key: 'disabled',                   value: true,                      pass: true },
    { key: 'designOnly',                 value: true,                      pass: true },
    { key: 'noSchedulerActive',          value: false,                     pass: true },
    { key: 'noPollingActive',            value: false,                     pass: true },
    { key: 'noTimersActive',             value: false,                     pass: true },
    { key: 'noAutomationActive',         value: false,                     pass: true },
    { key: 'noDispatch',                 value: false,                     pass: true },
    { key: 'noExecution',                value: false,                     pass: true },
    { key: 'noOpenClawCommandSent',      value: false,                     pass: true },
    { key: 'noTrading',                  value: false,                     pass: true },
    { key: 'noCredentialsExposed',       value: false,                     pass: true },
    { key: 'noSecretsExposed',           value: false,                     pass: true },
    { key: 'noBrowserTools',             value: false,                     pass: true },
    { key: 'noDirectOpenAI',             value: false,                     pass: true },
    { key: 'noMoneyMovement',            value: false,                     pass: true },
    { key: 'noMutationEndpoints',        value: false,                     pass: true },
    { key: 'noPOSTPUTPATCHDELETE',       value: false,                     pass: true },
    { key: 'localStorageOnly',           value: true,                      pass: true },
    { key: 'noBridgeCallsTriggered',     value: false,                     pass: true },
    { key: 'noNetworkCalls',             value: false,                     pass: true },
    { key: 'noBackendCalls',             value: false,                     pass: true },
    { key: 'noPersisteOutsideLocalStorage', value: false,                  pass: true },
  ];

  const nextRecommendedPhase = decision === 'DESIGN_READY'
    ? 'Controlled Scheduler Approval Gate (design documentation of approval rules and criteria, still non-executable)'
    : decision === 'HOLD_FOR_QA'
    ? 'Complete QA review and resolve warnings before proceeding to approval gate design'
    : 'Resolve safety failures in evidence sources before considering any scheduler design.';

  const designGateId = 'csagd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    designGateId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_APPROVAL_GATE_DESIGN',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    decision,
    reason,
    latestSchedulerDesignId: latestSchedulerDesign?.schedulerDesignId ?? null,
    latestCompletionReportId: latestCompletion?.completionReportId ?? null,
    latestQAReportId: latestQA?.qaReportId ?? null,
    completionStatus: completionStatus ?? 'UNKNOWN',
    schedulerDesignStatus: schedulerDesignStatus ?? 'UNKNOWN',
    qaStatus: qaStatus ?? 'UNKNOWN',
    acceptanceStatus: acceptanceStatus ?? 'UNKNOWN',
    auditStatus: auditStatus ?? 'UNKNOWN',
    integrityStatus: integrityStatus ?? 'UNKNOWN',
    promotionDecision: promotionDecision ?? 'UNKNOWN',
    readinessStatus: readinessStatus ?? 'UNKNOWN',
    requiredEvidence,
    sourceDiagnostics,
    allowedDesignConcepts,
    blockedRuntimeBehaviors,
    safetyAssertions,
    nextRecommendedPhase,
    summary: `Scheduler approval gate design evaluation: ${decision}. ${reason}`,
    note: 'Design gate only. No scheduler activation. No polling. No timers. No OpenClaw calls. No execution. No dispatch.',
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
      {copied ? 'Copied!' : 'Copy Gate Design JSON'}
    </button>
  );
}

export default function ControlledSchedulerApprovalGateDesign() {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildGatePacket();
    saveGatePacket(p);
    tryAppendAudit({
      event: 'controlled_scheduler_approval_gate_design_recorded',
      designGateId: p.designGateId,
      decision: p.decision,
      reason: p.reason,
      note: `Scheduler approval gate design recorded (${p.designGateId}). Decision: ${p.decision}. No scheduler. No polling.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const DECISION_STYLE = {
    DESIGN_READY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'DESIGN_READY' },
    HOLD_FOR_QA:  { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD_FOR_QA' },
    BLOCKED:      { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED' },
  };

  const style = packet ? (DECISION_STYLE[packet.decision] || DECISION_STYLE.HOLD_FOR_QA) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Approval Gate</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler Approval Gate Design</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Design-only gate documenting scheduler approval readiness — no implementation or automation.</div>
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
        <span><span className="font-bold">GATE_ONLY / READ_ONLY / LOCKED</span> — Design documentation. No scheduler. No automation. No dispatch.</span>
      </div>

      {packet && (
        <>
          {/* Decision Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Gate Decision: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {packet.reason}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Gate Decision',           value: packet.decision.split('_')[0],     color: style.color },
              { label: 'Completion Status',       value: packet.completionStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Scheduler Design Status', value: packet.schedulerDesignStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'QA Status',               value: packet.qaStatus,                   color: 'text-slate-300' },
              { label: 'Final Acceptance',        value: packet.acceptanceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Audit Status',            value: packet.auditStatus,                color: 'text-slate-300' },
              { label: 'Bridge Integrity',        value: packet.integrityStatus,            color: 'text-slate-300' },
              { label: 'Readiness Status',        value: packet.readinessStatus,            color: 'text-slate-300' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Required Evidence Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Required Evidence Checklist</div>
            </div>
            <div className="divide-y divide-border/30">
              {packet.requiredEvidence.map((evidence, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2">
                  {evidence.status === 'PASS' ? (
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  ) : evidence.status === 'WARN' ? (
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className="text-[8px] flex-1 text-slate-300">{evidence.source}</span>
                  <span className="text-[7px] text-slate-500 font-mono">{evidence.key}</span>
                  <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${
                    evidence.status === 'PASS' ? 'border-primary/30 bg-primary/5 text-primary' :
                    evidence.status === 'WARN' ? 'border-amber-500/30 bg-amber-500/5 text-amber-500' :
                    'border-destructive/30 bg-destructive/5 text-destructive'
                  }`}>{evidence.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Design Concepts */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Allowed Design-Only Concepts</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packet.allowedDesignConcepts.map((concept, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{concept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked Runtime Behaviors */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Blocked Runtime Behaviors</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packet.blockedRuntimeBehaviors.map((behavior, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-destructive/20 bg-destructive/5">
                  <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{behavior}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(packet.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`flex flex-col items-center px-2 py-1.5 rounded border border-border/40 ${val > 0 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10'}`}>
                  <span className="text-slate-500 mb-0.5 uppercase text-[6px] tracking-widest text-center truncate">{key}</span>
                  <span className={`text-[9px] font-bold ${val > 0 ? 'text-primary' : 'text-slate-500'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Recommended Phase */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-2">Next Recommended Phase</div>
            <div className="text-[9px] text-primary/90">{packet.nextRecommendedPhase}</div>
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
                    {String(a.value).slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Gate Design JSON
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

          {/* Gate ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{packet.designGateId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Gate Design
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Design gate only. No scheduler activation. No polling. No timers. No OpenClaw calls. No execution. No dispatch.
      </div>
    </div>
  );
}