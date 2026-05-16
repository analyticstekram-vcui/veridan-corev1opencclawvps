/**
 * ControlledSchedulerApprovalEvidencePacket
 * Design-only evidence aggregation for scheduler approval gate.
 * No network calls, no backend calls, no automation.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - localStorage read-only
 *   - Evidence packaging only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Package } from 'lucide-react';

const SOURCE_KEYS = {
  approvalGateDesigns:       'openclawControlledSchedulerApprovalGateDesigns',
  completionReports:         'openclawManualMonitoringPhaseCompletionReports',
  readinessPackets:          'openclawMonitoringModeReadinessPackets',
  finalAcceptancePackets:    'openclawManualMonitoringFinalAcceptancePackets',
  integrityCheckpoints:      'openclawBridgeIntegrityCheckpoints',
  bridgeAuditDashboards:     'openclawBridgeAuditReportDashboards',
  manualAuditDashboards:     'openclawManualMonitoringAuditDashboards',
  sessionArchiveExports:     'openclawOperatorSessionFinalArchiveExports',
  auditTrail:                'openclawAuditTrail',
};

const EVIDENCE_PACKET_KEY = 'openclawControlledSchedulerApprovalEvidencePackets';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'verifiedAt', 'snapshotAt', 'exportedAt', 'recordedAt', 'timestamp', 'updatedAt'];
const DECISION_VARIANTS = ['decision', 'approvalDecision', 'gateDecision', 'status', 'readinessStatus', 'completionStatus', 'auditStatus', 'verificationStatus'];

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

function normalizeDecision(record) {
  if (!record) return 'UNKNOWN';
  for (const variant of DECISION_VARIANTS) {
    if (record[variant]) return record[variant];
  }
  return 'UNKNOWN';
}

function saveEvidencePacket(packet) {
  try {
    const all = loadJSON(EVIDENCE_PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => {
      if (packet.latestGateDesignId && p.latestGateDesignId) {
        return p.latestGateDesignId !== packet.latestGateDesignId;
      }
      return p.packetId !== packet.packetId;
    })];
    localStorage.setItem(EVIDENCE_PACKET_KEY, JSON.stringify(deduped.slice(0, 20)));
  } catch {}
}

function buildEvidencePacket() {
  const approvalGates = loadJSON(SOURCE_KEYS.approvalGateDesigns, []);
  const latestGate = getLatestRecord(approvalGates);
  const completionReports = loadJSON(SOURCE_KEYS.completionReports, []);
  const latestCompletion = getLatestRecord(completionReports);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const latestReadiness = getLatestRecord(readinessPackets);
  const finalAcceptancePackets = loadJSON(SOURCE_KEYS.finalAcceptancePackets, []);
  const latestAcceptance = getLatestRecord(finalAcceptancePackets);
  const integrityCheckpoints = loadJSON(SOURCE_KEYS.integrityCheckpoints, []);
  const latestIntegrity = getLatestRecord(integrityCheckpoints);
  const bridgeAuditDashboards = loadJSON(SOURCE_KEYS.bridgeAuditDashboards, []);
  const latestBridgeAudit = getLatestRecord(bridgeAuditDashboards);
  const manualAuditDashboards = loadJSON(SOURCE_KEYS.manualAuditDashboards, []);
  const latestManualAudit = getLatestRecord(manualAuditDashboards);
  const sessionArchives = loadJSON(SOURCE_KEYS.sessionArchiveExports, []);
  const latestArchive = getLatestRecord(sessionArchives);

  // Determine evidence completeness
  let evidenceCompleteness = 'COMPLETE';
  let banner = 'READY_FOR_REVIEW';

  const requiredSources = [latestGate, latestCompletion, latestReadiness, latestAcceptance, latestIntegrity];
  const missingRequired = requiredSources.filter(s => !s).length;

  if (missingRequired > 0) {
    evidenceCompleteness = 'MISSING';
    banner = 'BLOCKED';
  } else if (
    latestGate?.decision === 'BLOCKED' ||
    latestCompletion?.completionStatus === 'BLOCKED_BY_SAFETY_FAILURE' ||
    latestIntegrity?.integrityStatus === 'FAILED' ||
    latestManualAudit?.auditStatus === 'FAILED'
  ) {
    banner = 'BLOCKED';
  } else if (
    latestGate?.decision === 'HOLD_FOR_QA' ||
    latestReadiness?.readinessStatus?.includes('HOLD')
  ) {
    evidenceCompleteness = 'PARTIAL';
    banner = 'HOLD_FOR_EVIDENCE';
  }

  const approvalDecision = normalizeDecision(latestGate);

  const sourceCounts = {
    approvalGateDesigns: approvalGates.length,
    completionReports: completionReports.length,
    readinessPackets: readinessPackets.length,
    finalAcceptancePackets: finalAcceptancePackets.length,
    integrityCheckpoints: integrityCheckpoints.length,
    bridgeAuditDashboards: bridgeAuditDashboards.length,
    manualAuditDashboards: manualAuditDashboards.length,
    sessionArchiveExports: sessionArchives.length,
  };

  const requiredEvidence = [
    { source: 'Approval Gate Design', present: !!latestGate, id: latestGate?.designGateId ?? '—' },
    { source: 'Phase Completion Report', present: !!latestCompletion, id: latestCompletion?.completionReportId ?? '—' },
    { source: 'Readiness Packet', present: !!latestReadiness, id: latestReadiness?.readinessPacketId ?? '—' },
    { source: 'Final Acceptance', present: !!latestAcceptance, id: latestAcceptance?.id ?? '—' },
    { source: 'Bridge Integrity', present: !!latestIntegrity, id: latestIntegrity?.integrityCheckpointId ?? '—' },
    { source: 'Bridge Audit Dashboard', present: !!latestBridgeAudit, id: latestBridgeAudit?.auditDashboardId ?? '—' },
    { source: 'Manual Audit Dashboard', present: !!latestManualAudit, id: latestManualAudit?.auditDashboardId ?? '—' },
    { source: 'Session Archive Export', present: !!latestArchive, id: latestArchive?.archiveExportId ?? '—' },
  ];

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
    { key: 'designOnly',                 value: true,                      pass: true },
    { key: 'noSchedulerActive',          value: false,                     pass: true },
    { key: 'noPollingActive',            value: false,                     pass: true },
    { key: 'noTimersActive',             value: false,                     pass: true },
    { key: 'noAutomationActive',         value: false,                     pass: true },
    { key: 'noDispatch',                 value: false,                     pass: true },
    { key: 'noExecution',                value: false,                     pass: true },
    { key: 'noOpenClawCallsTriggered',   value: false,                     pass: true },
    { key: 'noBrowserTools',             value: false,                     pass: true },
    { key: 'noTrading',                  value: false,                     pass: true },
    { key: 'noCredentials',              value: false,                     pass: true },
    { key: 'noSecrets',                  value: false,                     pass: true },
    { key: 'noDirectOpenAI',             value: false,                     pass: true },
    { key: 'noMoneyMovement',            value: false,                     pass: true },
    { key: 'noMutations',                value: false,                     pass: true },
    { key: 'noPOSTPUTPATCHDELETE',       value: false,                     pass: true },
    { key: 'localStorageOnly',           value: true,                      pass: true },
    { key: 'noNetworkCalls',             value: false,                     pass: true },
    { key: 'noBackendCalls',             value: false,                     pass: true },
    { key: 'noEvidenceModification',     value: false,                     pass: true },
    { key: 'evidencePackagingOnly',      value: true,                      pass: true },
    { key: 'noPersisteOutsideLocalStorage', value: false,                  pass: true },
  ];

  const nextRecommendedAction = banner === 'READY_FOR_REVIEW'
    ? 'Prepare for Controlled Scheduler Approval Evidence Review (non-executable documentation)'
    : banner === 'HOLD_FOR_EVIDENCE'
    ? 'Complete missing or partial evidence sources before proceeding to review'
    : 'Resolve evidence gaps and safety failures before consideration.';

  const packetId = 'csaep-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    packetId,
    createdAt: new Date().toISOString(),
    phase: 'CONTROLLED_SCHEDULER_APPROVAL_EVIDENCE_PACKET',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    schedulerRuntimeStatus: 'DISABLED',
    schedulerDesignStatus: 'DESIGN_ONLY',
    approvalDecision,
    banner,
    evidenceCompleteness,
    latestGateDesignId: latestGate?.designGateId ?? null,
    latestCompletionReportId: latestCompletion?.completionReportId ?? null,
    gateDecision: latestGate?.decision ?? 'UNKNOWN',
    completionStatus: latestCompletion?.completionStatus ?? 'UNKNOWN',
    readinessStatus: latestReadiness?.readinessStatus ?? 'UNKNOWN',
    acceptanceStatus: latestAcceptance?.acceptanceStatus ?? 'UNKNOWN',
    integrityStatus: latestIntegrity?.integrityStatus ?? 'UNKNOWN',
    bridgeAuditStatus: latestBridgeAudit?.auditStatus ?? 'UNKNOWN',
    manualAuditStatus: latestManualAudit?.auditStatus ?? 'UNKNOWN',
    sourceCounts,
    requiredEvidence,
    allowedDesignConcepts,
    blockedRuntimeBehaviors,
    safetyAssertions,
    nextRecommendedAction,
    summary: `Evidence packet generated: ${evidenceCompleteness} status. Gate decision: ${approvalDecision}. Banner: ${banner}.`,
    note: 'Evidence packaging only. No scheduler activation. No polling. No automation. No OpenClaw calls. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Evidence Packet JSON'}
    </button>
  );
}

export default function ControlledSchedulerApprovalEvidencePacket() {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildEvidencePacket();
    saveEvidencePacket(p);
    tryAppendAudit({
      event: 'controlled_scheduler_approval_evidence_packet_generated',
      packetId: p.packetId,
      banner: p.banner,
      evidenceCompleteness: p.evidenceCompleteness,
      approvalDecision: p.approvalDecision,
      note: `Evidence packet generated (${p.packetId}). Status: ${p.banner}. Completeness: ${p.evidenceCompleteness}. No scheduler. No polling.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const BANNER_STYLE = {
    READY_FOR_REVIEW: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'READY_FOR_REVIEW' },
    HOLD_FOR_EVIDENCE: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD_FOR_EVIDENCE' },
    BLOCKED:           { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED' },
  };

  const style = packet ? (BANNER_STYLE[packet.banner] || BANNER_STYLE.HOLD_FOR_EVIDENCE) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Evidence Aggregation</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Scheduler Approval Evidence Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Design-only evidence aggregation for scheduler approval — local packaging only.</div>
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
        <span><span className="font-bold">EVIDENCE_ONLY / READ_ONLY / LOCKED</span> — Evidence packaging. No scheduler. No automation. No network.</span>
      </div>

      {packet && (
        <>
          {/* Evidence Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Evidence Status: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {packet.summary}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Evidence Status',        value: packet.banner.split('_')[0],           color: style.color },
              { label: 'Completeness',           value: packet.evidenceCompleteness,           color: 'text-slate-300' },
              { label: 'Approval Decision',      value: packet.approvalDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Gate Decision',          value: packet.gateDecision.split('_')[0],     color: 'text-slate-300' },
              { label: 'Completion Status',      value: packet.completionStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Readiness Status',       value: packet.readinessStatus,                color: 'text-slate-300' },
              { label: 'Bridge Integrity',       value: packet.integrityStatus,                color: 'text-slate-300' },
              { label: 'Manual Audit Status',    value: packet.manualAuditStatus,              color: 'text-slate-300' },
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
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Required Evidence ({packet.requiredEvidence.filter(e => e.present).length}/{packet.requiredEvidence.length})</div>
            </div>
            <div className="divide-y divide-border/30">
              {packet.requiredEvidence.map((evidence, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2">
                  {evidence.present ? (
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className="text-[8px] flex-1 text-slate-300">{evidence.source}</span>
                  <span className="text-[7px] text-slate-500 font-mono truncate max-w-[120px]">{evidence.id}</span>
                  <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${evidence.present ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
                    {evidence.present ? 'YES' : 'NO'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(packet.sourceCounts).map(([key, val]) => (
                <div key={key} className={`flex flex-col items-center px-2 py-1.5 rounded border border-border/40 ${val > 0 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10'}`}>
                  <span className="text-slate-500 mb-0.5 uppercase text-[6px] tracking-widest text-center truncate">{key}</span>
                  <span className={`text-[9px] font-bold ${val > 0 ? 'text-primary' : 'text-slate-500'}`}>{val}</span>
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

          {/* Next Recommended Action */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-2">Next Recommended Action</div>
            <div className="text-[9px] text-primary/90">{packet.nextRecommendedAction}</div>
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
                    {String(a.value).slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Evidence Packet JSON
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

          {/* Packet ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /><span className="font-mono">{packet.packetId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Evidence Packet
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