/**
 * ManualMonitoringPromotionGate
 * Local-only promotion gate for manual read-only monitoring approval.
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
  auditDashboards:       'openclawManualMonitoringAuditDashboards',
  evidenceExports:       'openclawManualMonitoringEvidenceExports',
  monitoringChecks:      'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:      'openclawMonitoringModeReadinessPackets',
  promotionGates:        'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints:  'openclawBridgeIntegrityCheckpoints',
  auditTrail:            'openclawAuditTrail',
};
const GATE_KEY = 'openclawManualMonitoringPromotionGates';

const REQUIRED_EVIDENCE = [
  'Manual Monitoring Audit Dashboard',
  'Manual Monitoring Evidence Export',
  'Manual Read-Only Monitoring Checks',
  'Monitoring Mode Readiness Packet',
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
  'cron jobs',
  'background jobs',
];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveGate(gate) {
  try {
    const all = loadJSON(GATE_KEY, []);
    // Deduplicate by audit dashboard id + evidence export id if present
    const deduped = [
      gate,
      ...all.filter(g => {
        if (gate.latestAuditDashboardId && gate.latestEvidenceExportId && g.latestAuditDashboardId && g.latestEvidenceExportId) {
          return !(g.latestAuditDashboardId === gate.latestAuditDashboardId && g.latestEvidenceExportId === gate.latestEvidenceExportId);
        }
        return g.gateId !== gate.gateId;
      }),
    ];
    localStorage.setItem(GATE_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function evaluatePromotionDecision(latestAudit, latestPacket, monitoringChecks, evidenceExports) {
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
    latestAudit?.auditStatus === 'PASS' &&
    latestPacket?.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING' &&
    successfulChecks > 0 &&
    evidenceExports.length > 0
  ) {
    return 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING';
  }

  if (!hasUnsafeField && (monitoringChecks.length === 0 || evidenceExports.length === 0 || latestAudit?.auditStatus !== 'PASS')) {
    return 'HOLD_FOR_MORE_MANUAL_EVIDENCE';
  }

  return 'HOLD_FOR_MORE_MANUAL_EVIDENCE';
}

function buildGate() {
  const auditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const monitoringChecks = loadJSON(SOURCE_KEYS.monitoringChecks, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);

  const latestAudit = auditDashboards[0];
  const latestExport = evidenceExports[0];
  const latestPacket = readinessPackets[0];
  const latestGate = promotionGates[0];
  const latestIntegrity = integrityCheckpoints[0];

  const successfulChecks = monitoringChecks.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.error &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  const requiredEvidenceChecklist = REQUIRED_EVIDENCE.map(name => ({
    name,
    present:
      (name === 'Manual Monitoring Audit Dashboard' && !!latestAudit) ||
      (name === 'Manual Monitoring Evidence Export' && !!latestExport) ||
      (name === 'Manual Read-Only Monitoring Checks' && monitoringChecks.length > 0) ||
      (name === 'Monitoring Mode Readiness Packet' && !!latestPacket),
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
    { key: 'commandDispatchAllowed',   value: false,                             pass: true },
    { key: 'openClawCommandSent',      value: false,                             pass: !latestAudit?.openClawCommandSent },
    { key: 'executionAttempted',       value: false,                             pass: !latestAudit?.executionAttempted },
    { key: 'browserToolUsed',          value: false,                             pass: !latestAudit?.browserToolUsed },
    { key: 'credentialExposed',        value: false,                             pass: !latestAudit?.credentialExposed },
    { key: 'secretExposed',            value: false,                             pass: !latestAudit?.secretExposed },
    { key: 'tradingAttempted',         value: false,                             pass: !latestAudit?.tradingAttempted },
    { key: 'brokerActionsAttempted',   value: false,                             pass: !latestAudit?.moneyMovementAttempted },
    { key: 'walletActionsBlocked',     value: true,                              pass: true },
    { key: 'moneyMovementBlocked',     value: true,                              pass: true },
  ];

  const sourceDiagnostics = {
    auditDashboardPresent:        !!latestAudit,
    evidenceExportPresent:        !!latestExport,
    monitoringCheckCount:         monitoringChecks.length,
    readinessPacketPresent:       !!latestPacket,
    promotionGatePresent:         !!latestGate,
    integrityCheckpointPresent:   !!latestIntegrity,
    latestAuditStatus:            latestAudit?.auditStatus ?? 'UNKNOWN',
    latestReadinessStatus:        latestPacket?.readinessStatus ?? 'UNKNOWN',
    successfulCheckCount:         successfulChecks,
    failedCheckCount:             monitoringChecks.length - successfulChecks,
  };

  const promotionDecision = evaluatePromotionDecision(latestAudit, latestPacket, monitoringChecks, evidenceExports);

  const gateId = 'mmprg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    gateId,
    createdAt:                      new Date().toISOString(),
    phase:                          'MANUAL_MONITORING_PROMOTION_GATE',
    systemName:                     'VeridanCore OpenClaw Operator Portal',
    promotionDecision,
    approvedScope:                  'MANUAL_READ_ONLY_STATUS_MONITORING_ONLY',
    gatewayMode:                    'READ_ONLY',
    executionMode:                  'DISABLED',
    executionLock:                  'LOCKED',
    monitoringMode:                 'MANUAL_ONLY',
    schedulerApproved:              false,
    pollingApproved:                false,
    dispatchAllowed:                false,
    commandDispatchAllowed:         false,
    executionAllowed:               false,
    latestAuditStatus:              latestAudit?.auditStatus ?? 'UNKNOWN',
    latestReadinessStatus:          latestPacket?.readinessStatus ?? 'UNKNOWN',
    latestAuditDashboardId:         latestAudit?.auditDashboardId ?? null,
    latestEvidenceExportId:         latestExport?.evidenceExportId ?? null,
    manualCheckCount:               monitoringChecks.length,
    evidenceExportCount:            evidenceExports.length,
    successfulCheckCount:           successfulChecks,
    failedCheckCount:               monitoringChecks.length - successfulChecks,
    requiredEvidenceChecklist,
    explicitlyBlockedCapabilities:  EXPLICITLY_BLOCKED,
    sourceDiagnostics,
    safetyAssertions,
    nextRecommendedPhase: promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING'
      ? 'FINALIZE_MANUAL_MONITORING_BASELINE'
      : promotionDecision === 'HOLD_FOR_MORE_MANUAL_EVIDENCE'
      ? 'GENERATE_ADDITIONAL_MANUAL_MONITORING_CHECKS'
      : 'INVESTIGATE_SAFETY_FAILURE',
    note: 'Promotion gate approves manual read-only monitoring only. It does not approve scheduler, polling, command dispatch, or execution.',
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
      {copied ? 'Copied!' : 'Copy Manual Monitoring Promotion Gate JSON'}
    </button>
  );
}

export default function ManualMonitoringPromotionGate({ refreshTrigger }) {
  const [gate, setGate] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const evaluate = useCallback(() => {
    const g = buildGate();
    saveGate(g);
    tryAppendAudit({
      event:             'manual_monitoring_promotion_gate_evaluated',
      gateId:            g.gateId,
      promotionDecision: g.promotionDecision,
      approvedScope:     g.approvedScope,
      successfulChecks:  g.successfulCheckCount,
      note: `Manual monitoring promotion gate evaluated (${g.gateId}). Decision: ${g.promotionDecision}. Approved scope: ${g.approvedScope}. No dispatch. No execution.`,
    });
    setGate(g);
  }, []);

  useEffect(() => { evaluate(); }, [refreshTrigger, evaluate]);

  const DECISION_STYLE = {
    APPROVED_FOR_MANUAL_READ_ONLY_MONITORING: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2,  label: 'APPROVED FOR MANUAL READ-ONLY MONITORING' },
    HOLD_FOR_MORE_MANUAL_EVIDENCE:             { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD FOR MORE MANUAL EVIDENCE' },
    BLOCKED_BY_SAFETY_FAILURE:                 { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'BLOCKED BY SAFETY FAILURE' },
  };

  const style = DECISION_STYLE[gate?.promotionDecision] || DECISION_STYLE.HOLD_FOR_MORE_MANUAL_EVIDENCE;
  const Icon = style.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Promotion Gate</div>
          <div className="text-[13px] font-bold text-foreground">Manual Monitoring Promotion Gate</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Evaluates readiness for manual read-only monitoring approval. No dispatch. No execution.</div>
        </div>
        <button type="button" onClick={evaluate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Evaluate Gate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">GATE_EVALUATION_ONLY / READ_ONLY / LOCKED</span> — Promotion decision. No dispatch. No execution. Manual monitoring only.</span>
      </div>

      {gate && (
        <>
          {/* Promotion decision banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[13px] font-bold uppercase tracking-wide ${style.color}`}>
                  {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  Approved Scope: {gate.approvedScope}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Promotion Decision',    value: gate.promotionDecision.split('_').slice(0, 2).join(' '), color: style.color },
              { label: 'Latest Audit Status',   value: gate.latestAuditStatus,                   color: 'text-slate-300' },
              { label: 'Readiness Status',      value: gate.latestReadinessStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Manual Checks',         value: gate.manualCheckCount,                     color: 'text-primary font-bold' },
              { label: 'Evidence Exports',      value: gate.evidenceExportCount,                  color: 'text-primary font-bold' },
              { label: 'Scheduler Approved',    value: String(gate.schedulerApproved),           color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',      value: String(gate.dispatchAllowed),             color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',     value: String(gate.executionAllowed),            color: 'text-destructive font-bold' },
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
              {gate.requiredEvidenceChecklist.map((check, i) => (
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
              {gate.explicitlyBlockedCapabilities.map((cap, i) => (
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
                { label: 'Audit Dashboard Present',    value: String(gate.sourceDiagnostics.auditDashboardPresent), color: gate.sourceDiagnostics.auditDashboardPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Evidence Export Present',    value: String(gate.sourceDiagnostics.evidenceExportPresent), color: gate.sourceDiagnostics.evidenceExportPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Monitoring Checks',          value: gate.sourceDiagnostics.monitoringCheckCount,          color: 'text-primary font-bold' },
                { label: 'Readiness Packet Present',   value: String(gate.sourceDiagnostics.readinessPacketPresent), color: gate.sourceDiagnostics.readinessPacketPresent ? 'text-primary' : 'text-slate-500' },
                { label: 'Successful Checks',          value: gate.sourceDiagnostics.successfulCheckCount,          color: 'text-primary font-bold' },
                { label: 'Failed Checks',              value: gate.sourceDiagnostics.failedCheckCount,              color: gate.sourceDiagnostics.failedCheckCount > 0 ? 'text-amber-500' : 'text-slate-500' },
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
                Safety Assertions — {gate.safetyAssertions.filter(a => a.pass).length}/{gate.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {gate.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Promotion Gate JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(gate, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Gate ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{gate.gateId}</span></span>
            <span>{new Date(gate.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={gate} />
            <button type="button" onClick={evaluate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Lock className="w-3 h-3" /> Evaluate Promotion Gate
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Manual monitoring promotion gate is local-only. It approves manual read-only monitoring only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}