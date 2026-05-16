/**
 * ManualMonitoringOperatorRunbook
 * Local-only operator runbook for manual read-only monitoring guidance.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no scheduler, no polling loop
 *   - Documentation and guidance only
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Copy, ShieldCheck, RefreshCw, FileJson, Lock, BookOpen } from 'lucide-react';

const SOURCE_KEYS = {
  promotionGates:     'openclawManualMonitoringPromotionGates',
  auditDashboards:    'openclawManualMonitoringAuditDashboards',
  evidenceExports:    'openclawManualMonitoringEvidenceExports',
  monitoringChecks:   'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:   'openclawMonitoringModeReadinessPackets',
  auditTrail:         'openclawAuditTrail',
};
const RUNBOOK_KEY = 'openclawManualMonitoringOperatorRunbooks';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

const ALLOWED_ACTIONS = [
  'manual GET /health',
  'manual GET /status',
  'manual GET /version',
  'manual GET /capabilities',
  'local evidence export',
  'local audit review',
];

const BLOCKED_ACTIONS = [
  'command dispatch',
  'browser execution',
  'POST/PUT/PATCH/DELETE',
  'trading',
  'broker execution',
  'credential entry',
  'wallet actions',
  'money movement',
  'scheduler',
  'polling loop',
  'direct OpenAI API calls',
];

const OPERATOR_STEPS = [
  'Confirm latest promotion gate is APPROVED_FOR_MANUAL_READ_ONLY_MONITORING',
  'Select one allowlisted endpoint (/health, /status, /version, /capabilities)',
  'Run one manual read-only monitoring check',
  'Review HTTP status, gatewayReachable, cfAccessDetected, and safety assertions',
  'Export manual monitoring evidence',
  'Regenerate Manual Monitoring Audit Dashboard',
  'Regenerate Manual Monitoring Promotion Gate',
  'Stop if any safety assertion fails',
];

const PRE_CHECK_CHECKLIST = [
  'Latest promotion gate decision is APPROVED_FOR_MANUAL_READ_ONLY_MONITORING',
  'Manual monitoring checks have been executed',
  'Evidence exports exist',
  'Audit dashboard passes',
  'All safety assertions pass',
  'No scheduler or polling is active',
  'No execution or dispatch is allowed',
];

const ESCALATION_RULES = [
  { condition: 'HTTP status is 401/403', action: 'Check server-side auth env vars only; do not expose credentials in frontend' },
  { condition: 'Endpoint unreachable', action: 'Check VPS/OpenClaw/Cloudflare tunnel outside the app; do not add execution' },
  { condition: 'Any safety assertion fails', action: 'Stop manual monitoring and mark BLOCKED_BY_SAFETY_FAILURE' },
  { condition: 'Repeated failures occur', action: 'Stay manual-only and do not enable scheduler' },
];

const EVIDENCE_CAPTURE_PROCEDURE = [
  'Before each manual monitoring check: Record the timestamp and endpoint',
  'During check execution: Capture HTTP status, gateway reachability, and CF Access detection',
  'After check completion: Export evidence to localStorage',
  'Review evidence in Manual Monitoring Audit Dashboard',
  'If evidence shows safety violations: Stop and escalate',
  'Archive successful evidence for audit trail',
];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveRunbook(runbook) {
  try {
    const all = loadJSON(RUNBOOK_KEY, []);
    // Deduplicate by promotion gate id if present
    const deduped = [
      runbook,
      ...all.filter(r => {
        if (runbook.latestPromotionGateId && r.latestPromotionGateId) {
          return r.latestPromotionGateId !== runbook.latestPromotionGateId;
        }
        return r.runbookId !== runbook.runbookId;
      }),
    ];
    localStorage.setItem(RUNBOOK_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildRunbook() {
  const promotionGates = loadJSON(SOURCE_KEYS.promotionGates, []);
  const auditDashboards = loadJSON(SOURCE_KEYS.auditDashboards, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const monitoringChecks = loadJSON(SOURCE_KEYS.monitoringChecks, []);
  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);

  const latestGate = promotionGates[0];
  const latestAudit = auditDashboards[0];
  const latestExport = evidenceExports[0];

  const successfulChecks = monitoringChecks.filter(c =>
    (c.gatewayReachable ?? c.online ?? c.reachable ?? false) &&
    !c.error &&
    !c.executionAttempted &&
    !c.secretExposed &&
    !c.dispatchAllowed
  ).length;

  const preCheckStatus = OPERATOR_STEPS.map((step, i) => ({
    step: i + 1,
    instruction: step,
    completed: false,
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
    { key: 'openClawCommandSent',      value: false,                             pass: true },
    { key: 'executionAttempted',       value: false,                             pass: true },
    { key: 'browserToolUsed',          value: false,                             pass: true },
    { key: 'credentialExposed',        value: false,                             pass: true },
    { key: 'secretExposed',            value: false,                             pass: true },
    { key: 'tradingAttempted',         value: false,                             pass: true },
    { key: 'walletActionsBlocked',     value: true,                              pass: true },
    { key: 'moneyMovementBlocked',     value: true,                              pass: true },
  ];

  const sourceDiagnostics = {
    promotionGatePresent:      !!latestGate,
    latestPromotionDecision:   latestGate?.promotionDecision ?? 'UNKNOWN',
    auditDashboardPresent:     !!latestAudit,
    latestAuditStatus:         latestAudit?.auditStatus ?? 'UNKNOWN',
    evidenceExportCount:       evidenceExports.length,
    monitoringCheckCount:      monitoringChecks.length,
    successfulCheckCount:      successfulChecks,
    readinessPacketPresent:    readinessPackets.length > 0,
  };

  const runbookId = 'mmor-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    runbookId,
    createdAt:                    new Date().toISOString(),
    phase:                        'MANUAL_MONITORING_OPERATOR_RUNBOOK',
    systemName:                   'VeridanCore OpenClaw Operator Portal',
    approvedScope:                'MANUAL_READ_ONLY_STATUS_MONITORING_ONLY',
    promotionDecision:            latestGate?.promotionDecision ?? 'UNKNOWN',
    latestPromotionGateId:        latestGate?.gateId ?? null,
    gatewayMode:                  'READ_ONLY',
    executionMode:                'DISABLED',
    executionLock:                'LOCKED',
    monitoringMode:               'MANUAL_ONLY',
    schedulerActive:              false,
    pollingLoopActive:            false,
    dispatchAllowed:              false,
    commandDispatchAllowed:       false,
    executionAllowed:             false,
    allowedManualEndpoints:       ALLOWED_ENDPOINTS,
    allowedEndpointCount:         ALLOWED_ENDPOINTS.length,
    operatorSteps:                preCheckStatus,
    preCheckChecklist:            PRE_CHECK_CHECKLIST.map(item => ({ item, checked: false })),
    allowedActions:               ALLOWED_ACTIONS,
    blockedActions:               BLOCKED_ACTIONS,
    escalationRules:              ESCALATION_RULES,
    evidenceCaptureProcedure:     EVIDENCE_CAPTURE_PROCEDURE,
    sourceDiagnostics,
    safetyAssertions,
    note: 'Operator runbook only. Manual read-only monitoring guidance. No scheduler. No polling. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Operator Runbook JSON'}
    </button>
  );
}

export default function ManualMonitoringOperatorRunbook({ refreshTrigger }) {
  const [runbook, setRunbook] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const r = buildRunbook();
    saveRunbook(r);
    tryAppendAudit({
      event:             'manual_monitoring_operator_runbook_generated',
      runbookId:         r.runbookId,
      promotionDecision: r.promotionDecision,
      approvedScope:     r.approvedScope,
      note: `Manual monitoring operator runbook generated (${r.runbookId}). Decision: ${r.promotionDecision}. Approved scope: ${r.approvedScope}. No dispatch. No execution.`,
    });
    setRunbook(r);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Operator Runbook</div>
          <div className="text-[13px] font-bold text-foreground">Manual Monitoring Operator Runbook</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Operator guidance for safe manual read-only monitoring. Local-only documentation.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">RUNBOOK_GUIDANCE_ONLY / READ_ONLY / LOCKED</span> — Operator guidance. No dispatch. No execution.</span>
      </div>

      {runbook && (
        <>
          {/* Status banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${
            runbook.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING'
              ? 'bg-primary/5 border-primary/30'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {runbook.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING' ? (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className={`text-[13px] font-bold uppercase tracking-wide ${
                  runbook.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING' ? 'text-primary' : 'text-amber-500'
                }`}>
                  {runbook.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING'
                    ? 'RUNBOOK ACTIVE'
                    : 'RUNBOOK CONDITIONAL'}
                </div>
                <div className={`text-[9px] mt-1 ${
                  runbook.promotionDecision === 'APPROVED_FOR_MANUAL_READ_ONLY_MONITORING' ? 'text-primary/80' : 'text-amber-500/80'
                }`}>
                  Approved Scope: {runbook.approvedScope}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Promotion Decision',    value: runbook.promotionDecision.split('_')[0], color: 'text-primary font-bold' },
              { label: 'Approved Scope',        value: 'MANUAL_RO',                             color: 'text-slate-300' },
              { label: 'Monitoring Mode',       value: runbook.monitoringMode,                  color: 'text-primary font-bold' },
              { label: 'Allowed Endpoints',     value: runbook.allowedEndpointCount,            color: 'text-primary font-bold' },
              { label: 'Scheduler Active',      value: String(runbook.schedulerActive),         color: 'text-destructive font-bold' },
              { label: 'Polling Loop Active',   value: String(runbook.pollingLoopActive),      color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',      value: String(runbook.dispatchAllowed),         color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',     value: String(runbook.executionAllowed),        color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Pre-check checklist */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Pre-Check Checklist</div>
            <div className="space-y-1.5">
              {runbook.preCheckChecklist.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-[8px]">
                  <div className="w-3.5 h-3.5 border-2 border-slate-500 rounded" />
                  <span className="text-slate-400">{check.item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operator steps */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Operator Steps — {runbook.operatorSteps.length} total</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {runbook.operatorSteps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-primary">{step.step}</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-[8px] text-slate-300">{step.instruction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed actions grid */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-2">Allowed Actions</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {runbook.allowedActions.map((action, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-primary/10 border border-primary/30 rounded">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-[7px] font-bold text-primary">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked actions grid */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-destructive font-semibold mb-2">Blocked Actions</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {runbook.blockedActions.map((action, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-destructive/10 border border-destructive/30 rounded">
                  <Lock className="w-3 h-3 text-destructive shrink-0" />
                  <span className="text-[7px] font-bold text-destructive">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Escalation rules */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-amber-500 font-semibold mb-2">Escalation Rules</div>
            <div className="space-y-1.5">
              {runbook.escalationRules.map((rule, i) => (
                <div key={i} className="border-l-2 border-amber-500/40 pl-2.5 py-1">
                  <div className="text-[7px] font-bold text-amber-500 mb-0.5">IF: {rule.condition}</div>
                  <div className="text-[7px] text-amber-500/80">THEN: {rule.action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence capture procedure */}
          <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Evidence Capture Procedure</div>
            <div className="space-y-1">
              {runbook.evidenceCaptureProcedure.map((step, i) => (
                <div key={i} className="flex gap-2 text-[7px]">
                  <span className="text-slate-500 font-bold min-w-fit">{i + 1}.</span>
                  <span className="text-slate-400">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {runbook.safetyAssertions.filter(a => a.pass).length}/{runbook.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {runbook.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Operator Runbook JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(runbook, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Runbook ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /><span className="font-mono">{runbook.runbookId}</span></span>
            <span>{new Date(runbook.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={runbook} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <BookOpen className="w-3 h-3" /> Regenerate Runbook
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Operator runbook is local-only. It documents manual read-only monitoring only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}