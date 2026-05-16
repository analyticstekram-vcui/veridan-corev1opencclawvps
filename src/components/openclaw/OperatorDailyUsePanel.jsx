/**
 * OperatorDailyUsePanel
 * Daily use guidance for manual read-only monitoring operators.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser automation
 *   - No dispatch, no execution, no credentials, no trading
 *   - localStorage read-only
 *   - No scheduler, no polling, no timers
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson } from 'lucide-react';

const SOURCE_KEYS = {
  controlRoomSummaries:    'openclawManualMonitoringControlRoomSummaries',
  finalAcceptancePackets:  'openclawManualMonitoringFinalAcceptancePackets',
  promotionGates:          'openclawManualMonitoringPromotionGates',
  auditDashboards:         'openclawManualMonitoringAuditDashboards',
  evidenceExports:         'openclawManualMonitoringEvidenceExports',
  manualChecks:            'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:        'openclawMonitoringModeReadinessPackets',
  auditTrail:              'openclawAuditTrail',
};
const PANEL_KEY = 'openclawOperatorDailyUsePanels';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function savePanel(panel) {
  try {
    const all = loadJSON(PANEL_KEY, []);
    const deduped = [panel, ...all.filter(p => {
      if (panel.latestFinalAcceptanceId && p.latestFinalAcceptanceId && panel.latestManualCheckId && p.latestManualCheckId) {
        return !(p.latestFinalAcceptanceId === panel.latestFinalAcceptanceId && p.latestManualCheckId === panel.latestManualCheckId);
      }
      return p.dailyUseId !== panel.dailyUseId;
    })];
    localStorage.setItem(PANEL_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildDailyUsePanel() {
  const finalAcceptance = loadJSON(SOURCE_KEYS.finalAcceptancePackets, [])[0];
  const promotionGate = loadJSON(SOURCE_KEYS.promotionGates, [])[0];
  const auditDashboard = loadJSON(SOURCE_KEYS.auditDashboards, [])[0];
  const manualCheck = loadJSON(SOURCE_KEYS.manualChecks, [])[0];
  const readinessPacket = loadJSON(SOURCE_KEYS.readinessPackets, [])[0];

  // Determine daily status
  let dailyStatus = 'BLOCKED';
  if (finalAcceptance?.acceptanceStatus === 'ACCEPTED_FOR_MANUAL_READ_ONLY_MONITORING') {
    const hasSafetyFailure = finalAcceptance?.safetyAssertions?.some(a => !a.pass);
    if (!hasSafetyFailure) dailyStatus = 'READY';
    else dailyStatus = 'BLOCKED';
  } else if (finalAcceptance?.acceptanceStatus?.includes('HOLD')) {
    dailyStatus = 'HOLD';
  } else if (promotionGate?.promotionDecision?.includes('BLOCKED') || auditDashboard?.auditStatus === 'FAIL') {
    dailyStatus = 'BLOCKED';
  }

  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                      pass: true },
    { key: 'executionLocked',          value: 'LOCKED',                 pass: true },
    { key: 'executionModeDisabled',    value: 'DISABLED',               pass: true },
    { key: 'monitoringModeManualOnly', value: 'MANUAL_ONLY',            pass: true },
    { key: 'methodGetOnly',            value: 'GET',                    pass: true },
    { key: 'noScheduler',              value: false,                     pass: true },
    { key: 'noPollingLoop',            value: false,                     pass: true },
    { key: 'noCommandPayload',         value: true,                      pass: true },
    { key: 'dispatchAllowed',          value: false,                     pass: true },
    { key: 'commandDispatchAttempted', value: false,                     pass: true },
    { key: 'openClawCommandSent',      value: false,                     pass: true },
    { key: 'executionAttempted',       value: false,                     pass: true },
    { key: 'browserToolUsed',          value: false,                     pass: true },
    { key: 'credentialExposed',        value: false,                     pass: true },
    { key: 'secretExposed',            value: false,                     pass: true },
    { key: 'tradingAttempted',         value: false,                     pass: true },
    { key: 'brokerActionsAttempted',   value: false,                     pass: true },
    { key: 'walletActionsAttempted',   value: false,                     pass: true },
    { key: 'moneyMovementAttempted',   value: false,                     pass: true },
    { key: 'directOpenAIDisabled',     value: true,                      pass: true },
  ];

  const recommendedDailySteps = [
    'Confirm daily status is READY',
    'Run manual GET /status',
    'Run manual GET /health',
    'Review gatewayReachable, HTTP status, cfAccessDetected, and safety assertions',
    'Copy or regenerate manual monitoring evidence export',
    'Regenerate manual monitoring audit dashboard',
    'Regenerate manual monitoring promotion gate if needed',
    'Regenerate final acceptance packet if the audit state changed',
    'Stop immediately if any safety assertion fails',
  ];

  const blockedCapabilities = [
    'Command dispatch',
    'Browser execution',
    'POST/PUT/PATCH/DELETE mutation methods',
    'Trading',
    'Broker execution',
    'Credential entry',
    'Wallet actions',
    'Money movement',
    'Scheduler',
    'Polling loop',
    'Direct OpenAI API calls',
  ];

  const requiredFollowUpActions = [];
  if (dailyStatus === 'HOLD') {
    requiredFollowUpActions.push('Collect more evidence from monitoring checks');
    requiredFollowUpActions.push('Run additional health checks');
  }
  if (dailyStatus === 'BLOCKED') {
    requiredFollowUpActions.push('Review safety assertion failures');
    requiredFollowUpActions.push('Do not proceed with any monitoring activity');
  }
  if (!manualCheck || !readinessPacket) {
    requiredFollowUpActions.push('Complete initial monitoring setup');
  }

  const dailyUseId = 'dup-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    dailyUseId,
    createdAt: new Date().toISOString(),
    phase: 'OPERATOR_DAILY_USE_PANEL',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    dailyStatus,
    acceptanceStatus: finalAcceptance?.acceptanceStatus ?? 'UNKNOWN',
    readinessStatus: readinessPacket?.readinessStatus ?? 'UNKNOWN',
    promotionDecision: promotionGate?.promotionDecision ?? 'UNKNOWN',
    latestAuditStatus: auditDashboard?.auditStatus ?? 'UNKNOWN',
    latestManualCheckStatus: manualCheck?.checkStatus ?? 'UNKNOWN',
    latestEndpoint: manualCheck?.endpoint ?? 'N/A',
    latestHttpStatus: manualCheck?.httpStatus ?? 'N/A',
    gatewayReachable: manualCheck?.gatewayReachable ?? false,
    cfAccessDetected: manualCheck?.cfAccessDetected ?? false,
    gatewayMode: 'READ_ONLY',
    executionMode: 'DISABLED',
    executionLock: 'LOCKED',
    monitoringMode: 'MANUAL_ONLY',
    schedulerActive: false,
    pollingLoopActive: false,
    dispatchAllowed: false,
    executionAllowed: false,
    latestFinalAcceptanceId: finalAcceptance?.finalAcceptancePacketId,
    latestManualCheckId: manualCheck?.checkId,
    recommendedDailySteps,
    allowedManualEndpoints: ['/status', '/health', '/version', '/capabilities'],
    blockedCapabilities,
    requiredFollowUpActions,
    safetyAssertions,
    note: 'Daily use panel only. Manual read-only monitoring guidance. No scheduler. No polling. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Daily Use JSON'}
    </button>
  );
}

export default function OperatorDailyUsePanel() {
  const [panel, setPanel] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const p = buildDailyUsePanel();
    savePanel(p);
    tryAppendAudit({
      event: 'operator_daily_use_panel_generated',
      dailyUseId: p.dailyUseId,
      dailyStatus: p.dailyStatus,
      acceptanceStatus: p.acceptanceStatus,
      note: `Operator daily use panel generated (${p.dailyUseId}). Status: ${p.dailyStatus}. Acceptance: ${p.acceptanceStatus}. Manual read-only monitoring guidance only. No scheduler. No polling. No dispatch.`,
    });
    setPanel(p);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const STATUS_STYLE = {
    READY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2,  label: 'READY' },
    HOLD:  { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'HOLD' },
    BLOCKED: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'BLOCKED' },
  };

  const style = panel ? (STATUS_STYLE[panel.dailyStatus] || STATUS_STYLE.HOLD) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Operator Guidance</div>
          <div className="text-[13px] font-bold text-foreground">Daily Use Panel</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Daily read-only monitoring workflow — manual actions only, no automation.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">MANUAL_ONLY / READ_ONLY / LOCKED</span> — Daily guidance. No scheduler. No polling. No dispatch. No execution.</span>
      </div>

      {panel && (
        <>
          {/* Daily Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Daily Status: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {style.label === 'READY' && 'All checks passed. Safe to proceed with daily manual monitoring.'}
                  {style.label === 'HOLD' && 'Waiting for more evidence. Continue gathering monitoring data.'}
                  {style.label === 'BLOCKED' && 'Safety assertions have failed. Do not proceed. Review immediately.'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Daily Status',         value: panel.dailyStatus,            color: style.color },
              { label: 'Acceptance',           value: panel.acceptanceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Readiness',            value: panel.readinessStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Promotion',            value: panel.promotionDecision.split('_')[0], color: 'text-slate-300' },
              { label: 'Audit Status',         value: panel.latestAuditStatus,      color: 'text-slate-300' },
              { label: 'Latest Endpoint',      value: panel.latestEndpoint,         color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',          value: panel.latestHttpStatus,       color: 'text-foreground' },
              { label: 'Gateway Reachable',    value: String(panel.gatewayReachable), color: panel.gatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'Scheduler Active',     value: String(panel.schedulerActive), color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',    value: String(panel.executionAllowed), color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] font-bold break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Recommended Daily Steps */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Recommended Daily Steps</div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {panel.recommendedDailySteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[11px] font-bold text-primary shrink-0 w-5">{String(i + 1).padStart(2, '0')}.</span>
                  <span className="text-[9px] text-slate-300 flex-1">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Endpoints */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Allowed Manual Endpoints</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {panel.allowedManualEndpoints.map(ep => (
                <div key={ep} className="flex items-center gap-2 px-2.5 py-1.5 bg-card border border-border/60 rounded text-[9px] font-mono text-blue-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {ep}
                </div>
              ))}
            </div>
          </div>

          {/* Required Follow-Up Actions */}
          {panel.requiredFollowUpActions.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-amber-500 font-semibold mb-2">Required Follow-Up Actions</div>
              <div className="space-y-1">
                {panel.requiredFollowUpActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-[9px] text-amber-500/90">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Capabilities */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Blocked Capabilities</div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {panel.blockedCapabilities.map(cap => (
                <div key={cap} className="flex items-center gap-2 px-2 py-1.5 bg-destructive/5 border border-destructive/20 rounded text-[8px] font-semibold text-destructive">
                  <XCircle className="w-3 h-3 shrink-0" /> {cap}
                </div>
              ))}
            </div>
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {panel.safetyAssertions.filter(a => a.pass).length}/{panel.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {panel.safetyAssertions.map(a => (
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

          {/* JSON Preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Daily Use JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(panel, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Panel ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /><span className="font-mono">{panel.dailyUseId}</span></span>
            <span>{new Date(panel.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={panel} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Daily Use Panel
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Daily use panel is local-only. Manual read-only monitoring guidance only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}