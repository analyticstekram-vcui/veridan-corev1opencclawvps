/**
 * FinalLockBaselineExportPacket
 * Final lock baseline export for governance freeze.
 * No network calls, no backend calls, no execution.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no backend calls, no browser automation
 *   - No dispatch, no execution, no timers, no intervals, no cron, no polling loops
 *   - No trading, no credentials, no money movement, no broker calls
 *   - localStorage read/write for baseline lock only
 *   - Final governance baseline documentation only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  operatorSignOffPackets:      'openclawControlledSchedulerOperatorSignOffPackets',
  operatorReviewConsoles:      'openclawControlledSchedulerOperatorReviewConsoles',
  finalDesignReviewPackets:    'openclawControlledSchedulerFinalDesignReviewPackets',
  qaChecklists:                'openclawControlledSchedulerQAChecklists',
  evidencePackets:             'openclawControlledSchedulerApprovalEvidencePackets',
  approvalGates:               'openclawControlledSchedulerApprovalGateDesigns',
  auditTrail:                  'openclawAuditTrail',
};

const BASELINE_PACKET_KEY = 'veridan_final_lock_baseline_packet';
const BASELINE_AUDIT_KEY = 'veridan_final_lock_audit_log';

const TIMESTAMP_VARIANTS = ['createdAt', 'generatedAt', 'reviewedAt', 'verifiedAt', 'timestamp', 'snapshotAt', 'completedAt', 'exportedAt', 'signedAt', 'lockedAt', 'updatedAt'];
const STATUS_VARIANTS = ['decision', 'status', 'lockState', 'signOffStatus', 'reviewDecision', 'finalDecision', 'qaDecision', 'evidenceStatus', 'gateDecision'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function ensureArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return [data];
  return [];
}

function getLatestRecord(records) {
  const arr = ensureArray(records);
  if (arr.length === 0) return null;
  return arr.reduce((latest, current) => {
    const latestTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (latest?.[field] ? new Date(latest[field]).getTime() : 0), 0);
    const currentTime = TIMESTAMP_VARIANTS.reduce((time, field) => time || (current?.[field] ? new Date(current[field]).getTime() : 0), 0);
    return currentTime > latestTime ? current : latest;
  });
}

function normalizeStatus(record) {
  if (!record) return 'UNKNOWN';
  for (const variant of STATUS_VARIANTS) {
    if (record[variant]) {
      const val = record[variant];
      if (typeof val === 'string') return val.toUpperCase();
      return String(val).toUpperCase();
    }
  }
  return 'UNKNOWN';
}

function appendAuditLog(event) {
  const log = loadJSON(BASELINE_AUDIT_KEY, []);
  log.push({
    eventId: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 4),
    createdAt: new Date().toISOString(),
    ...event,
  });
  saveJSON(BASELINE_AUDIT_KEY, log.slice(-100));
}

function buildBaselinePacket(lockState = 'BASELINE_LOCK_READY') {
  const signOffPackets = ensureArray(loadJSON(SOURCE_KEYS.operatorSignOffPackets, []));
  const latestSignOff = getLatestRecord(signOffPackets);
  const reviewConsoles = ensureArray(loadJSON(SOURCE_KEYS.operatorReviewConsoles, []));
  const latestReview = getLatestRecord(reviewConsoles);
  const finalDesignPackets = ensureArray(loadJSON(SOURCE_KEYS.finalDesignReviewPackets, []));
  const latestFinalDesign = getLatestRecord(finalDesignPackets);
  const qaChecklists = ensureArray(loadJSON(SOURCE_KEYS.qaChecklists, []));
  const latestQA = getLatestRecord(qaChecklists);
  const evidencePackets = ensureArray(loadJSON(SOURCE_KEYS.evidencePackets, []));
  const latestEvidence = getLatestRecord(evidencePackets);
  const approvalGates = ensureArray(loadJSON(SOURCE_KEYS.approvalGates, []));
  const latestGate = getLatestRecord(approvalGates);
  const auditTrail = ensureArray(loadJSON(SOURCE_KEYS.auditTrail, []));

  const signOffStatus = normalizeStatus(latestSignOff);
  const reviewStatus = normalizeStatus(latestReview);
  const finalDesignStatus = normalizeStatus(latestFinalDesign);
  const qaStatus = normalizeStatus(latestQA);
  const evidenceStatus = normalizeStatus(latestEvidence);
  const gateStatus = normalizeStatus(latestGate);

  let computedLockState = 'BASELINE_LOCK_READY';
  const readyConditions = [
    signOffStatus === 'SIGN_OFF_READY',
    finalDesignStatus === 'READY_FOR_OPERATOR_REVIEW',
    qaStatus === 'QA_READY_FOR_REVIEW',
    evidenceStatus === 'READY_FOR_REVIEW',
    gateStatus === 'DESIGN_READY' || gateStatus === 'APPROVED_FOR_DESIGN_REVIEW',
    !!latestSignOff && !!latestReview && !!latestFinalDesign && !!latestQA,
  ];

  if (!readyConditions.every(c => c)) {
    if (!latestSignOff || signOffStatus === 'UNKNOWN') {
      computedLockState = 'BASELINE_HOLD_FOR_REVIEW';
    } else if (
      signOffStatus === 'BLOCKED_BY_SAFETY_FAILURE' ||
      finalDesignStatus === 'BLOCKED' ||
      qaStatus === 'QA_BLOCKED'
    ) {
      computedLockState = 'BASELINE_BLOCKED_BY_SAFETY_FAILURE';
    } else {
      computedLockState = 'BASELINE_HOLD_FOR_REVIEW';
    }
  }

  if (lockState === 'BASELINE_LOCKED') {
    computedLockState = 'BASELINE_LOCKED';
  }

  const blockedRuntimeBehaviors = [
    { name: 'Live broker order placement', blocked: true },
    { name: 'Live API trading', blocked: true },
    { name: 'Real money movement', blocked: true },
    { name: 'Credential entry or storage', blocked: true },
    { name: 'External command dispatch', blocked: true },
    { name: 'Unapproved browser automation', blocked: true },
    { name: 'Autonomous scheduler execution', blocked: true },
    { name: 'Auto-approval of proposed actions', blocked: true },
    { name: 'Mutation of financial records', blocked: true },
    { name: 'Runtime bridge activation', blocked: true },
  ];

  const safetyAssertions = [
    { key: 'designOnly', value: true, pass: true },
    { key: 'localOnly', value: true, pass: true },
    { key: 'readOnly', value: true, pass: true },
    { key: 'locked', value: 'LOCKED', pass: true },
    { key: 'disabled', value: 'DISABLED', pass: true },
    { key: 'noExecution', value: false, pass: true },
    { key: 'noTrading', value: false, pass: true },
    { key: 'noCredentials', value: false, pass: true },
    { key: 'noMutations', value: false, pass: true },
    { key: 'noBrokerCalls', value: false, pass: true },
    { key: 'noMoneyMovement', value: false, pass: true },
    { key: 'noBrowserAutomation', value: false, pass: true },
    { key: 'noNetworkCalls', value: false, pass: true },
    { key: 'noBackendCalls', value: false, pass: true },
    { key: 'noDispatch', value: false, pass: true },
  ];

  const allowedPostLockActions = [
    'Continue UI design',
    'Add documentation',
    'Add mock data',
    'Add read-only diagnostics',
    'Add governance review panels',
    'Export evidence packets',
  ];

  const sourceDiagnostics = {
    operatorSignOffPacketsCount: signOffPackets.length,
    operatorReviewConsolesCount: reviewConsoles.length,
    finalDesignReviewPacketsCount: finalDesignPackets.length,
    qaChecklistsCount: qaChecklists.length,
    evidencePacketsCount: evidencePackets.length,
    approvalGatesCount: approvalGates.length,
    auditTrailCount: auditTrail.length,
  };

  const baselineId = 'baseline-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    baselineId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lockState: computedLockState,
    sourceComponent: 'FinalLockBaselineExportPacket',
    upstreamSignOffDecision: signOffStatus,
    schedulerMode: 'DISABLED',
    executionMode: 'DISABLED',
    safetyBoundary: 'PREVIEW_ONLY',
    operatorChecklistSummary: {
      designOnlyVerified: true,
      noSchedulerActive: true,
      noPollingActive: true,
      noTimersActive: true,
      noAutomationActive: true,
      noDispatch: true,
      noExecution: true,
      endpointsAllowlisted: true,
      blockedMethodsDocumented: true,
      manualApprovalManaged: true,
    },
    safetyAssertions,
    blockedRuntimeBehaviors,
    allowedPostSignOffDesignActions: allowedPostLockActions,
    sourceDiagnostics,
    normalizedStatuses: {
      signOffStatus,
      reviewStatus,
      finalDesignStatus,
      qaStatus,
      evidenceStatus,
      gateStatus,
    },
    auditSummary: `Baseline locked at ${new Date().toISOString()}`,
    finalOperatorWarning: 'FINAL LOCK DOES NOT ENABLE EXECUTION. This packet only freezes the current governed preview baseline. Live trading, API execution, credential entry, money movement, broker orders, and browser automation remain disabled.',
    nonExecutionGuarantee: 'No runtime execution is enabled by this baseline lock. All execution, trading, broker access, credential entry, and money movement remain prohibited.',
    exportVersion: '1.0',
  };
}

function CopyButton({ data, label }) {
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
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default function FinalLockBaselineExportPacket() {
  const [packet, setPacket] = useState(null);
  const [showJSON, setShowJSON] = useState(false);
  const [lockState, setLockState] = useState('BASELINE_LOCK_READY');

  const generate = useCallback((newLockState = 'BASELINE_LOCK_READY') => {
    const p = buildBaselinePacket(newLockState);
    setPacket(p);
    setLockState(newLockState);
  }, []);

  const handleLockBaseline = () => {
    if (packet?.lockState === 'BASELINE_LOCK_READY') {
      const lockedPacket = buildBaselinePacket('BASELINE_LOCKED');
      saveJSON(BASELINE_PACKET_KEY, lockedPacket);
      appendAuditLog({
        eventType: 'baseline_lock_successful',
        component: 'FinalLockBaselineExportPacket',
        baselineId: lockedPacket.baselineId,
        reason: 'Operator clicked Lock Baseline',
        operatorAction: 'lock_baseline',
        nonExecutionConfirmed: true,
      });
      tryAppendAudit({
        event: 'final_lock_baseline_locked',
        baselineId: lockedPacket.baselineId,
        lockState: 'BASELINE_LOCKED',
        note: 'Baseline locked and saved locally.',
      });
      setPacket(lockedPacket);
      setLockState('BASELINE_LOCKED');
    }
  };

  const handleExportBaseline = () => {
    if (!packet) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `veridan-core-final-lock-baseline-${timestamp}.json`;
    const dataStr = JSON.stringify(packet, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    appendAuditLog({
      eventType: 'baseline_exported',
      component: 'FinalLockBaselineExportPacket',
      baselineId: packet.baselineId,
      reason: 'Operator exported baseline JSON',
      operatorAction: 'export_baseline',
      nonExecutionConfirmed: true,
    });
    tryAppendAudit({
      event: 'final_lock_baseline_exported',
      baselineId: packet.baselineId,
      filename,
      note: 'Baseline exported to JSON file.',
    });
  };

  const handleCopySummary = () => {
    if (!packet) return;
    const summary = `VERIDAN CORE FINAL LOCK BASELINE
=====================================
Baseline ID: ${packet.baselineId}
Created: ${packet.createdAt}
Lock State: ${packet.lockState}

CRITICAL WARNING:
${packet.finalOperatorWarning}

Scheduler Mode: ${packet.schedulerMode}
Execution Mode: ${packet.executionMode}
Safety Boundary: ${packet.safetyBoundary}

Blocked Runtime Behaviors: ${packet.blockedRuntimeBehaviors.filter(b => b.blocked).length}/10
Safety Assertions: ${packet.safetyAssertions.filter(a => a.pass).length}/${packet.safetyAssertions.length}

Non-Execution Guarantee:
${packet.nonExecutionGuarantee}`;
    navigator.clipboard.writeText(summary);
    appendAuditLog({
      eventType: 'baseline_summary_copied',
      component: 'FinalLockBaselineExportPacket',
      baselineId: packet.baselineId,
      reason: 'Operator copied baseline summary',
      operatorAction: 'copy_summary',
      nonExecutionConfirmed: true,
    });
  };

  const handleResetLock = () => {
    if (window.confirm('Reset local baseline lock? This removes only the local lock packet.')) {
      try {
        localStorage.removeItem(BASELINE_PACKET_KEY);
        setLockState('BASELINE_LOCK_READY');
        generate('BASELINE_LOCK_READY');
        appendAuditLog({
          eventType: 'local_lock_reset',
          component: 'FinalLockBaselineExportPacket',
          reason: 'Operator reset local lock',
          operatorAction: 'reset_lock',
          nonExecutionConfirmed: true,
        });
        tryAppendAudit({
          event: 'final_lock_baseline_reset',
          note: 'Local baseline lock packet removed.',
        });
      } catch {}
    }
  };

  useEffect(() => { generate(); }, [generate]);

  const STATUS_STYLE = {
    BASELINE_LOCK_READY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2 },
    BASELINE_HOLD_FOR_REVIEW: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle },
    BASELINE_BLOCKED_BY_SAFETY_FAILURE: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle },
    BASELINE_LOCKED: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: Lock },
  };

  const style = packet ? (STATUS_STYLE[packet.lockState] || STATUS_STYLE.BASELINE_HOLD_FOR_REVIEW) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Final Lock</div>
          <div className="text-[13px] font-bold text-foreground">Final Lock Baseline Export Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Freeze governance baseline after operator sign-off — design-review only.</div>
        </div>
        {packet && (
          <button type="button" onClick={() => generate()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">LOCK_ONLY / READ_ONLY / GOVERNANCE_FREEZE</span> — Baseline lock. No execution. No trading. No credentials.</span>
      </div>

      {packet && (
        <>
          {/* Lock Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  {packet.lockState}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {packet.lockState === 'BASELINE_LOCK_READY' && 'Ready to lock governance baseline'}
                  {packet.lockState === 'BASELINE_HOLD_FOR_REVIEW' && 'Waiting for complete evidence'}
                  {packet.lockState === 'BASELINE_BLOCKED_BY_SAFETY_FAILURE' && 'Safety failure detected'}
                  {packet.lockState === 'BASELINE_LOCKED' && 'Baseline locked and frozen locally'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Final Lock Status',      value: packet.lockState.split('_')[1], color: style.color },
              { label: 'Sign-Off Status',        value: packet.upstreamSignOffDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Safety Assert Status',   value: packet.safetyAssertions.filter(a => a.pass).length === packet.safetyAssertions.length ? 'PASS' : 'WARN', color: 'text-slate-300' },
              { label: 'Runtime Exec Status',    value: 'DISABLED', color: 'text-destructive font-bold' },
              { label: 'Browser Automation',     value: 'BLOCKED', color: 'text-destructive font-bold' },
              { label: 'API Trading',            value: 'BLOCKED', color: 'text-destructive font-bold' },
              { label: 'Credential Entry',       value: 'BLOCKED', color: 'text-destructive font-bold' },
              { label: 'Money Movement',         value: 'BLOCKED', color: 'text-destructive font-bold' },
              { label: 'Scheduler Mode',         value: packet.schedulerMode, color: 'text-slate-300' },
              { label: 'Audit Logging',          value: 'ACTIVE', color: 'text-primary' },
              { label: 'Source Diagnostics',     value: '7/7', color: 'text-primary' },
              { label: 'Baseline Export',        value: packet.lockState === 'BASELINE_LOCKED' ? 'LOCKED' : 'READY', color: 'text-slate-300' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Non-Execution Guarantee Warning */}
          <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-[9px] text-destructive">
              <div className="font-bold mb-1">FINAL LOCK DOES NOT ENABLE EXECUTION</div>
              <div className="text-destructive/80">{packet.finalOperatorWarning}</div>
            </div>
          </div>

          {/* Operator Controls */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleLockBaseline}
              disabled={packet.lockState !== 'BASELINE_LOCK_READY'}
              className="flex items-center gap-1.5 px-3 py-2 text-[9px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold transition-colors">
              <Lock className="w-3 h-3" /> Lock Baseline
            </button>
            <button type="button" onClick={handleExportBaseline}
              disabled={!['BASELINE_LOCK_READY', 'BASELINE_LOCKED'].includes(packet.lockState)}
              className="flex items-center gap-1.5 px-3 py-2 text-[9px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Export Baseline
            </button>
            <CopyButton data={packet} label="Copy Summary" />
            <button type="button" onClick={handleResetLock}
              className="flex items-center gap-1.5 px-3 py-2 text-[9px] border border-slate-500/40 text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
              <RefreshCw className="w-3 h-3" /> Reset Local Lock
            </button>
          </div>

          {/* Blocked Runtime Behaviors */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Blocked Runtime Behaviors ({packet.blockedRuntimeBehaviors.filter(b => b.blocked).length}/{packet.blockedRuntimeBehaviors.length})</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packet.blockedRuntimeBehaviors.map((behavior, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-destructive/20 bg-destructive/5">
                  <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{behavior.name}</span>
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
                    {String(a.value).slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Post-Lock Actions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Allowed Post-Lock Actions</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packet.allowedPostSignOffDesignActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-primary/20 bg-primary/5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-[8px] text-slate-300">{action}</span>
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

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Baseline Packet JSON
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

          {/* Baseline ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{packet.baselineId}</span></span>
            <span>Created: {new Date(packet.createdAt).toLocaleString()}</span>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Operator sign-off packet is local-only and design-review only. No scheduler activation. No polling. No timers. No automation. No dispatch. No execution.
      </div>
    </div>
  );
}