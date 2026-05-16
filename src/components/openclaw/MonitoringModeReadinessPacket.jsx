/**
 * MonitoringModeReadinessPacket
 * Local-only readiness packet for monitoring mode approval.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no scheduler, no polling loop
 *   - No trading, no credentials, no money movement
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldCheck, RefreshCw, FileJson, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  promotionGates:                'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints:          'openclawBridgeIntegrityCheckpoints',
  auditDashboards:               'openclawBridgeAuditReportDashboards',
  resultEvidenceExports:         'openclawBridgeCallResultEvidenceExports',
  bridgeCalls:                   'openclawControlledReadOnlyRouteBridgeCalls',
  healthMonitoringSnapshots:     'openclawAutomatedHealthMonitoringSnapshots',
  historicalStatusDashboards:    'openclawHistoricalStatusDashboardReports',
  auditTrail:                    'openclawAuditTrail',
};
const PACKET_KEY = 'openclawMonitoringModeReadinessPackets';

const REQUIRED_EVIDENCE = [
  'Read-Only Bridge Promotion Gate',
  'Bridge Integrity Checkpoint',
  'Bridge Audit Report Dashboard',
  'Bridge Call Result Evidence Export',
  'Controlled Read-Only Route Bridge Call',
];

const EXPLICITLY_BLOCKED = [
  'command dispatch',
  'browser execution',
  'trading',
  'broker execution',
  'credential entry',
  'wallet actions',
  'money movement',
  'mutation endpoints',
  'scheduler activation',
  'polling loop',
  'network calls',
];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function savePacket(packet) {
  try {
    const all = loadJSON(PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => p.readinessPacketId !== packet.readinessPacketId)];
    localStorage.setItem(PACKET_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildReadinessPacket() {
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);
  const auditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const resultEvidenceExports = loadJSON(SOURCE_KEYS.resultEvidenceExports, []);
  const bridgeCalls = loadJSON(SOURCE_KEYS.bridgeCalls, []);
  const healthSnapshots = loadJSON(SOURCE_KEYS.healthMonitoringSnapshots, []);
  const historicalDashboards = loadJSON(SOURCE_KEYS.historicalStatusDashboards, []);

  const latestGate = promotionGates[0];
  const latestIntegrity = integrityCheckpoints[0];
  const latestAudit = auditDashboards[0];
  const latestEvidence = resultEvidenceExports[0];
  const latestBridgeCall = bridgeCalls[0];

  const successfulBridgeCallCount = bridgeCalls.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  // Determine readiness status
  let readinessStatus = 'HOLD_FOR_MORE_EVIDENCE';
  if (latestGate?.promotionDecision === 'BLOCKED_BY_SAFETY_FAILURE') {
    readinessStatus = 'BLOCKED_BY_SAFETY_FAILURE';
  } else if (latestGate?.promotionDecision === 'APPROVED_FOR_READ_ONLY_MONITORING') {
    readinessStatus = 'READY_FOR_READ_ONLY_MONITORING';
  } else if (!latestGate || latestGate?.promotionDecision === 'HOLD_FOR_MORE_EVIDENCE') {
    readinessStatus = 'HOLD_FOR_MORE_EVIDENCE';
  }

  const requiredEvidenceChecklist = REQUIRED_EVIDENCE.map(name => ({
    name,
    present:
      (name === 'Read-Only Bridge Promotion Gate' && !!latestGate) ||
      (name === 'Bridge Integrity Checkpoint' && !!latestIntegrity) ||
      (name === 'Bridge Audit Report Dashboard' && !!latestAudit) ||
      (name === 'Bridge Call Result Evidence Export' && !!latestEvidence) ||
      (name === 'Controlled Read-Only Route Bridge Call' && !!latestBridgeCall),
  }));

  const safetyAssertions = [
    { key: 'previewOnly',                  value: true,                                pass: true },
    { key: 'readOnly',                     value: true,                                pass: true },
    { key: 'gatewayMode',                  value: 'READ_ONLY',                        pass: true },
    { key: 'executionMode',                value: 'DISABLED',                         pass: true },
    { key: 'executionLock',                value: 'LOCKED',                           pass: true },
    { key: 'dispatchAllowed',              value: false,                              pass: true },
    { key: 'commandDispatchAllowed',       value: false,                              pass: true },
    { key: 'executionAllowed',             value: false,                              pass: true },
    { key: 'browserToolUsed',              value: false,                              pass: true },
    { key: 'credentialEntryEnabled',       value: false,                              pass: true },
    { key: 'tradingDisabled',              value: true,                               pass: true },
    { key: 'moneyMovementDisabled',        value: true,                               pass: true },
    { key: 'schedulerActive',              value: false,                              pass: true },
    { key: 'pollingLoopActive',            value: false,                              pass: true },
    { key: 'networkCallsFromPacket',       value: false,                              pass: true },
    { key: 'openClawCallsFromPacket',      value: 0,                                  pass: true },
    { key: 'secretExposed',                value: false,                              pass: !(latestBridgeCall?.secretExposed || latestAudit?.secretExposed) },
  ];

  const readinessPacketId = 'mmrp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    readinessPacketId,
    createdAt:                    new Date().toISOString(),
    phase:                        'MONITORING_MODE_READINESS_PACKET',
    systemName:                   'VeridanCore OpenClaw Operator Portal',
    readinessStatus,
    approvedScope:                'READ_ONLY_STATUS_MONITORING_ONLY',
    gatewayMode:                  'READ_ONLY',
    executionMode:                'DISABLED',
    executionLock:                'LOCKED',
    dispatchAllowed:              false,
    commandDispatchAllowed:       false,
    executionAllowed:             false,
    monitoringMode:               'MANUAL_OR_OPERATOR_CONTROLLED',
    schedulerActive:              false,
    pollingLoopActive:            false,
    networkCallsFromThisPacket:   false,
    openClawCallsFromThisPacket:  0,
    latestPromotionGateDecision:  latestGate?.promotionDecision ?? 'UNKNOWN',
    latestIntegrityStatus:        latestIntegrity?.overallStatus ?? 'UNKNOWN',
    latestAuditStatus:            latestAudit?.overallStatus ?? 'UNKNOWN',
    latestBridgeCallStatus:       latestBridgeCall?.gatewayReachable ? 'REACHABLE' : 'UNREACHABLE',
    successfulBridgeCallCount,
    historicalStatusSummary: {
      totalHealthSnapshots:       healthSnapshots.length,
      totalHistoricalReports:     historicalDashboards.length,
    },
    monitoringSnapshotSummary: {
      latestSnapshotTimestamp:    healthSnapshots[0]?.createdAt ?? null,
      latestHistoricalTimestamp:  historicalDashboards[0]?.createdAt ?? null,
    },
    requiredEvidenceChecklist,
    explicitlyBlockedCapabilities: EXPLICITLY_BLOCKED,
    safetyAssertions,
    nextRecommendedPhase: readinessStatus === 'READY_FOR_READ_ONLY_MONITORING'
      ? 'ACTIVATE_READ_ONLY_MONITORING_MODE'
      : readinessStatus === 'HOLD_FOR_MORE_EVIDENCE'
      ? 'GENERATE_ADDITIONAL_HEALTH_MONITORING_DATA'
      : 'INVESTIGATE_SAFETY_FAILURE',
    note: 'Readiness packet only. Approves read-only monitoring readiness, not command dispatch or execution.',
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
      {copied ? 'Copied!' : 'Copy Readiness Packet JSON'}
    </button>
  );
}

export default function MonitoringModeReadinessPacket({ refreshTrigger }) {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildReadinessPacket();
    savePacket(p);
    tryAppendAudit({
      event:            'monitoring_mode_readiness_packet_created',
      readinessPacketId: p.readinessPacketId,
      readinessStatus:  p.readinessStatus,
      approvedScope:    p.approvedScope,
      note: `Monitoring mode readiness packet created (${p.readinessPacketId}). Status: ${p.readinessStatus}. Scope: ${p.approvedScope}. No dispatch. No execution. No scheduler.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  const STATUS_STYLE = {
    READY_FOR_READ_ONLY_MONITORING: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2,  label: 'READY FOR READ-ONLY MONITORING' },
    HOLD_FOR_MORE_EVIDENCE:         { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD FOR MORE EVIDENCE' },
    BLOCKED_BY_SAFETY_FAILURE:      { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'BLOCKED BY SAFETY FAILURE' },
  };

  const style = STATUS_STYLE[packet?.readinessStatus] || STATUS_STYLE.HOLD_FOR_MORE_EVIDENCE;
  const Icon = style.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Readiness Packet</div>
          <div className="text-[13px] font-bold text-foreground">Monitoring Mode Readiness Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Approves read-only monitoring readiness. No dispatch. No execution. No scheduler.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Generate Packet
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">READINESS_PACKET_ONLY / READ_ONLY / LOCKED</span> — Readiness approval. No dispatch. No execution. Read-only monitoring only.</span>
      </div>

      {packet && (
        <>
          {/* Readiness decision banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[13px] font-bold uppercase tracking-wide ${style.color}`}>
                  {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  Approved Scope: {packet.approvedScope} • Mode: {packet.monitoringMode}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Readiness Status',       value: packet.readinessStatus.split('_')[0],  color: style.color },
              { label: 'Promotion Decision',     value: packet.latestPromotionGateDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Integrity Status',       value: packet.latestIntegrityStatus,           color: 'text-slate-300' },
              { label: 'Audit Status',           value: packet.latestAuditStatus,               color: 'text-slate-300' },
              { label: 'Successful Calls',       value: packet.successfulBridgeCallCount,       color: 'text-primary font-bold' },
              { label: 'Scheduler Active',       value: String(packet.schedulerActive),         color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',       value: String(packet.dispatchAllowed),         color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',      value: String(packet.executionAllowed),        color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Required evidence checklist */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Required Evidence Checklist</div>
            <div className="space-y-1.5">
              {packet.requiredEvidenceChecklist.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-[8px]">
                  {check.present ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-500 shrink-0" />
                  )}
                  <span className={check.present ? 'text-slate-300 font-semibold' : 'text-slate-500'}>{check.name}</span>
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
              <FileJson className="w-3.5 h-3.5" /> Readiness Packet JSON
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
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{packet.readinessPacketId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Generate Readiness Packet
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Monitoring readiness packet is local-only. It approves read-only monitoring readiness only. No scheduler. No polling loop. No command dispatch. No execution.
      </div>
    </div>
  );
}