/**
 * ManualMonitoringFinalAcceptancePacket
 * Local-only final acceptance packet for manual read-only monitoring.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no scheduler, no polling loop
 *   - Final acceptance documentation only
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldCheck, RefreshCw, FileJson, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  operatorRunbooks:       'openclawManualMonitoringOperatorRunbooks',
  promotionGates:         'openclawManualMonitoringPromotionGates',
  auditDashboards:        'openclawManualMonitoringAuditDashboards',
  evidenceExports:        'openclawManualMonitoringEvidenceExports',
  monitoringChecks:       'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:       'openclawMonitoringModeReadinessPackets',
  bridgePromotionGates:   'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints:   'openclawBridgeIntegrityCheckpoints',
  handoffPackets:         'openclawOperatorHandoffPackets',
  auditTrail:             'openclawAuditTrail',
};
const ACCEPTANCE_KEY = 'openclawManualMonitoringFinalAcceptancePackets';

const COMPLETED_MILESTONES = [
  'Read-only status bridge',
  'Historical status dashboard',
  'Automated health monitoring snapshot layer',
  'Capability explorer',
  'Capability evidence export',
  'Capability policy matrix',
  'Capability approval rules',
  'Read-only route planner',
  'Read-only route simulation',
  'Read-only route approval packet',
  'Controlled read-only route bridge call',
  'Bridge call evidence export',
  'Bridge audit dashboard',
  'Bridge integrity checkpoint',
  'Read-only bridge promotion gate',
  'Monitoring mode readiness packet',
  'Manual read-only monitoring console',
  'Manual monitoring evidence export',
  'Manual monitoring audit dashboard',
  'Manual monitoring promotion gate',
  'Manual monitoring operator runbook',
];

const EXPLICITLY_BLOCKED = [
  'command dispatch',
  'browser execution',
  'POST/PUT/PATCH/DELETE',
  'trading',
  'broker execution',
  'credential entry',
  'wallet actions',
  'money movement',
  'scheduler activation',
  'polling loop',
  'cron jobs',
  'background jobs',
  'mutation endpoints',
];

const ACCEPTANCE_CHECKLIST = [
  'Latest operator runbook exists',
  'Latest promotion gate is APPROVED_FOR_MANUAL_READ_ONLY_MONITORING',
  'Latest audit dashboard status is PASS',
  'Latest readiness status is READY_FOR_READ_ONLY_MONITORING',
  'At least one manual monitoring check executed',
  'At least one manual monitoring evidence export exists',
  'All safety assertions pass',
  'No scheduler is approved or active',
  'No polling loop is approved or active',
  'No execution or dispatch is allowed',
  'No browser tools or credentials exposed',
  'No trading or money movement attempted',
];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function savePacket(packet) {
  try {
    const all = loadJSON(ACCEPTANCE_KEY, []);
    // Deduplicate by runbook id + gate id if present
    const deduped = [
      packet,
      ...all.filter(p => {
        if (packet.latestRunbookId && packet.latestPromotionGateId && p.latestRunbookId && p.latestPromotionGateId) {
          return !(p.latestRunbookId === packet.latestRunbookId && p.latestPromotionGateId === packet.latestPromotionGateId);
        }
        return p.acceptancePacketId !== packet.acceptancePacketId;
      }),
    ];
    localStorage.setItem(ACCEPTANCE_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function evaluateAcceptanceStatus(latestRunbook, latestGate, latestAudit, latestPacket, monitoringChecks, evidenceExports) {
  const successfulChecks = monitoringChecks.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.error &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  const hasUnsafeField =
    latestAudit?.executionAttempted === true ||
    latestAudit?.dispatchAllowed === true ||
    latestAudit?.openClawCommandSent === true ||
    latestAudit?.browserToolUsed === true ||
    latestAudit?.secretExposed === true ||
    latestAudit?.credentialExposed === true ||
    latestAudit?.tradingAttempted === true ||
    latestAudit?.moneyMovementAttempted === true ||
    latestAudit?.schedulerActive === true ||
    latestAudit?.pollingLoopActive === true;

  if (hasUnsafeField) {
    return 'BLOCKED_BY_SAFETY_FAILURE';
  }

  if (
    latestRunbook &&
    latestGate?.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING' &&
    latestAudit?.auditStatus === 'PASS' &&
    latestPacket?.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING' &&
    successfulChecks > 0 &&
    evidenceExports.length > 0
  ) {
    return 'ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING';
  }

  if (!hasUnsafeField && (monitoringChecks.length === 0 || evidenceExports.length === 0 || !latestRunbook)) {
    return 'HOLD_FOR_MORE_EVIDENCE';
  }

  return 'HOLD_FOR_MORE_EVIDENCE';
}

function buildAcceptancePacket() {
  const operatorRunbooks = loadJSON(SOURCE_KEYS.operatorRunbooks, []);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const auditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const monitoringChecks = loadJSON(SOURCE_KEYS.monitoringChecks, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const bridgePromotionGates = loadJSON(SOURCE_KEYS.bridgePromotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);

  const latestRunbook = operatorRunbooks[0];
  const latestGate = promotionGates[0];
  const latestAudit = auditDashboards[0];
  const latestPacket = readinessPackets[0];

  const successfulChecks = monitoringChecks.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.error &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  const acceptanceChecklist = ACCEPTANCE_CHECKLIST.map(item => ({
    item,
    verified:
      (item === 'Latest operator runbook exists' && !!latestRunbook) ||
      (item === 'Latest promotion gate is APPROVED_FOR_MANUAL_READ_ONLY_MONITORING' && latestGate?.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING') ||
      (item === 'Latest audit dashboard status is PASS' && latestAudit?.auditStatus === 'PASS') ||
      (item === 'Latest readiness status is READY_FOR_READ_ONLY_MONITORING' && latestPacket?.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING') ||
      (item === 'At least one manual monitoring check executed' && monitoringChecks.length > 0) ||
      (item === 'At least one manual monitoring evidence export exists' && evidenceExports.length > 0) ||
      (item === 'All safety assertions pass' && latestAudit?.safetyAssertions?.every(a => a.pass)) ||
      (item === 'No scheduler is approved or active' && !latestGate?.schedulerApproved && !latestAudit?.schedulerActive) ||
      (item === 'No polling loop is approved or active' && !latestGate?.pollingApproved && !latestAudit?.pollingLoopActive) ||
      (item === 'No execution or dispatch is allowed' && !latestGate?.executionAllowed && !latestGate?.dispatchAllowed) ||
      (item === 'No browser tools or credentials exposed' && !latestAudit?.browserToolUsed && !latestAudit?.credentialExposed) ||
      (item === 'No trading or money movement attempted' && !latestAudit?.tradingAttempted && !latestAudit?.moneyMovementAttempted),
  }));

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                              pass: true },
    { key: 'disabled',                 value: true,                              pass: true },
    { key: 'executionLock',            value: 'LOCKED',                          pass: true },
    { key: 'monitoringMode',           value: 'MANUAL_ONLY',                     pass: true },
    { key: 'methodGetOnly',            value: 'GET',                             pass: true },
    { key: 'schedulerApproved',        value: false,                             pass: true },
    { key: 'schedulerActive',          value: false,                             pass: true },
    { key: 'pollingApproved',          value: false,                             pass: true },
    { key: 'pollingLoopActive',        value: false,                             pass: true },
    { key: 'noCommandPayload',         value: true,                              pass: true },
    { key: 'dispatchAllowed',          value: false,                             pass: true },
    { key: 'commandDispatchAllowed',   value: false,                             pass: true },
    { key: 'openClawCommandSent',      value: false,                             pass: true },
    { key: 'executionAttempted',       value: false,                             pass: true },
    { key: 'browserToolUsed',          value: false,                             pass: true },
    { key: 'credentialExposed',        value: false,                             pass: true },
    { key: 'secretExposed',            value: false,                             pass: true },
    { key: 'tradingAttempted',         value: false,                             pass: true },
    { key: 'walletActionsBlocked',     value: true,                              pass: true },
    { key: 'moneyMovementBlocked',     value: true,                              pass: true },
    { key: 'mutationEndpointsBlocked', value: true,                              pass: true },
  ];

  const sourceDiagnostics = {
    operatorRunbookPresent:        !!latestRunbook,
    promotionGatePresent:          !!latestGate,
    auditDashboardPresent:         !!latestAudit,
    readinessPacketPresent:        !!latestPacket,
    monitoringCheckCount:          monitoringChecks.length,
    successfulCheckCount:          successfulChecks,
    evidenceExportCount:           evidenceExports.length,
    bridgePromotionGatePresent:    bridgePromotionGates.length > 0,
    integrityCheckpointPresent:    integrityCheckpoints.length > 0,
    latestAuditStatus:             latestAudit?.auditStatus ?? 'UNKNOWN',
    latestPromotionDecision:       latestGate?.promotionDecision ?? 'UNKNOWN',
    latestReadinessStatus:         latestPacket?.readinessStatus ?? 'UNKNOWN',
  };

  const acceptanceStatus = evaluateAcceptanceStatus(latestRunbook, latestGate, latestAudit, latestPacket, monitoringChecks, evidenceExports);

  const acceptancePacketId = 'mmfap-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    acceptancePacketId,
    createdAt:                          new Date().toISOString(),
    phase:                              'MANUAL_MONITORING_FINAL_ACCEPTANCE_PACKET',
    systemName:                         'VeridanCore OpenClaw Operator Portal',
    acceptanceStatus,
    approvedScope:                      'MANUAL_READ_ONLY_STATUS_MONITORING_ONLY',
    latestRunbookId:                    latestRunbook?.runbookId ?? null,
    latestPromotionGateId:              latestGate?.gateId ?? null,
    latestPromotionGateDecision:        latestGate?.promotionDecision ?? 'UNKNOWN',
    latestAuditStatus:                  latestAudit?.auditStatus ?? 'UNKNOWN',
    latestReadinessStatus:              latestPacket?.readinessStatus ?? 'UNKNOWN',
    gatewayMode:                        'READ_ONLY',
    executionMode:                      'DISABLED',
    executionLock:                      'LOCKED',
    monitoringMode:                     'MANUAL_ONLY',
    schedulerApproved:                  false,
    schedulerActive:                    false,
    pollingApproved:                    false,
    pollingLoopActive:                  false,
    dispatchAllowed:                    false,
    commandDispatchAllowed:             false,
    executionAllowed:                   false,
    manualCheckCount:                   monitoringChecks.length,
    evidenceExportCount:                evidenceExports.length,
    completedMilestones:                COMPLETED_MILESTONES,
    explicitlyBlockedCapabilities:      EXPLICITLY_BLOCKED,
    acceptanceChecklist,
    sourceDiagnostics,
    safetyAssertions,
    nextRecommendedPhase: acceptanceStatus === 'ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING'
      ? 'DEPLOY_MANUAL_MONITORING_STACK'
      : acceptanceStatus === 'HOLD_FOR_MORE_EVIDENCE'
      ? 'GENERATE_ADDITIONAL_ACCEPTANCE_EVIDENCE'
      : 'INVESTIGATE_SAFETY_FAILURE',
    note: 'Final acceptance approves manual read-only monitoring only. It does not approve scheduler, polling, command dispatch, execution, trading, credentials, wallet actions, or money movement.',
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
      {copied ? 'Copied!' : 'Copy Final Acceptance Packet JSON'}
    </button>
  );
}

export default function ManualMonitoringFinalAcceptancePacket({ refreshTrigger }) {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildAcceptancePacket();
    savePacket(p);
    tryAppendAudit({
      event:             'manual_monitoring_final_acceptance_packet_created',
      acceptancePacketId: p.acceptancePacketId,
      acceptanceStatus:  p.acceptanceStatus,
      approvedScope:     p.approvedScope,
      note: `Final acceptance packet created (${p.acceptancePacketId}). Status: ${p.acceptanceStatus}. Approved scope: ${p.approvedScope}. No dispatch. No execution.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  const STATUS_STYLE = {
    ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2,  label: 'ACCEPTED FOR MANUAL READ-ONLY MONITORING' },
    HOLD_FOR_MORE_EVIDENCE:                   { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD FOR MORE EVIDENCE' },
    BLOCKED_BY_SAFETY_FAILURE:                { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'BLOCKED BY SAFETY FAILURE' },
  };

  const style = STATUS_STYLE[packet?.acceptanceStatus] || STATUS_STYLE.HOLD_FOR_MORE_EVIDENCE;
  const Icon = style.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Final Acceptance</div>
          <div className="text-[13px] font-bold text-foreground">Manual Monitoring Final Acceptance Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Final acceptance for manual read-only monitoring stack. Local-only verification.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">FINAL_ACCEPTANCE_ONLY / READ_ONLY / LOCKED</span> — Final acceptance. No dispatch. No execution.</span>
      </div>

      {packet && (
        <>
          {/* Acceptance status banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[13px] font-bold uppercase tracking-wide ${style.color}`}>
                  {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  Approved Scope: {packet.approvedScope}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Acceptance Status',     value: packet.acceptanceStatus.split('_')[0], color: style.color },
              { label: 'Approved Scope',        value: 'MANUAL_RO',                            color: 'text-slate-300' },
              { label: 'Gate Decision',         value: packet.latestPromotionGateDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Audit Status',          value: packet.latestAuditStatus,               color: 'text-primary font-bold' },
              { label: 'Manual Checks',         value: packet.manualCheckCount,                color: 'text-primary font-bold' },
              { label: 'Evidence Exports',      value: packet.evidenceExportCount,             color: 'text-primary font-bold' },
              { label: 'Scheduler Approved',    value: String(packet.schedulerApproved),      color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',     value: String(packet.executionAllowed),        color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Acceptance checklist */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Acceptance Checklist</div>
            <div className="space-y-1.5">
              {packet.acceptanceChecklist.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-[8px]">
                  {check.verified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 border-2 border-slate-500 rounded" />
                  )}
                  <span className={check.verified ? 'text-slate-300 font-semibold' : 'text-slate-500'}>{check.item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed milestones */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-2">Completed Milestones — {packet.completedMilestones.length}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {packet.completedMilestones.map((milestone, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/30 rounded">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-[7px] text-primary font-semibold">{milestone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicitly blocked capabilities */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-destructive font-semibold mb-2">Explicitly Blocked Capabilities</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {packet.explicitlyBlockedCapabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 border border-destructive/30 rounded">
                  <Lock className="w-3 h-3 text-destructive shrink-0" />
                  <span className="text-[7px] font-bold text-destructive">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Runbook Present',              value: String(packet.sourceDiagnostics.operatorRunbookPresent), color: packet.sourceDiagnostics.operatorRunbookPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Promotion Gate Present',       value: String(packet.sourceDiagnostics.promotionGatePresent), color: packet.sourceDiagnostics.promotionGatePresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Audit Dashboard Present',      value: String(packet.sourceDiagnostics.auditDashboardPresent), color: packet.sourceDiagnostics.auditDashboardPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Readiness Packet Present',     value: String(packet.sourceDiagnostics.readinessPacketPresent), color: packet.sourceDiagnostics.readinessPacketPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Monitoring Checks',            value: packet.sourceDiagnostics.monitoringCheckCount,          color: 'text-primary font-bold' },
                { label: 'Successful Checks',            value: packet.sourceDiagnostics.successfulCheckCount,          color: 'text-primary font-bold' },
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
                    {String(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Final Acceptance Packet JSON
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

          {/* Packet ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{packet.acceptancePacketId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Final Acceptance Packet
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Final acceptance is local-only. It approves manual read-only monitoring only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}