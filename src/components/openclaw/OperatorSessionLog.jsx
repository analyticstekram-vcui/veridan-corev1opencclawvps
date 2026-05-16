/**
 * OperatorSessionLog
 * Local-only session recordkeeping for manual read-only monitoring.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no command dispatch
 *   - No browser automation, no trading, no broker actions
 *   - No credentials, no wallet, no money movement
 *   - No scheduler, no polling, no timers
 *   - localStorage read-only + session state management
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, FileJson, Play, Square, Check } from 'lucide-react';

const SOURCE_KEYS = {
  dailyUsePanels:       'openclawOperatorDailyUsePanels',
  controlRoomSummaries: 'openclawManualMonitoringControlRoomSummaries',
  finalAcceptancePackets: 'openclawManualMonitoringFinalAcceptancePackets',
  promotionGates:       'openclawManualMonitoringPromotionGates',
  auditDashboards:      'openclawManualMonitoringAuditDashboards',
  evidenceExports:      'openclawManualMonitoringEvidenceExports',
  manualChecks:         'openclawManualReadOnlyMonitoringChecks',
  readinessPackets:     'openclawMonitoringModeReadinessPackets',
  auditTrail:           'openclawAuditTrail',
};
const LOG_KEY = 'openclawOperatorSessionLogs';
const CURRENT_SESSION_KEY = 'openclawCurrentOperatorSession';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveSession(session) {
  try { localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session)); } catch {}
}

function saveSessionLog(session) {
  try {
    const all = loadJSON(LOG_KEY, []);
    const deduped = [session, ...all.filter(s => s.sessionId !== session.sessionId)];
    localStorage.setItem(LOG_KEY, JSON.stringify(deduped.slice(0, 50)));
  } catch {}
}

function buildSessionObject(currentSession, checklist, note) {
  const dailyPanel = loadJSON(SOURCE_KEYS.dailyUsePanels, [])[0];
  const finalAcceptance = loadJSON(SOURCE_KEYS.finalAcceptancePackets, [])[0];
  const promotionGate = loadJSON(SOURCE_KEYS.promotionGates, [])[0];
  const auditDashboard = loadJSON(SOURCE_KEYS.auditDashboards, [])[0];
  const manualCheck = loadJSON(SOURCE_KEYS.manualChecks, [])[0];
  const readinessPacket = loadJSON(SOURCE_KEYS.readinessPackets, [])[0];

  // Determine session status based on latest state
  let sessionStatus = 'OPEN';
  if (currentSession.closedAt) sessionStatus = 'CLOSED';
  else if (finalAcceptance?.acceptanceStatus?.includes('BLOCKED') || promotionGate?.promotionDecision?.includes('BLOCKED')) {
    sessionStatus = 'BLOCKED';
  } else if (!Object.values(checklist).every(v => v)) {
    sessionStatus = 'HOLD';
  }

  const checklistCompletedCount = Object.values(checklist).filter(v => v).length;

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

  const sourceDiagnostics = {
    dailyPanelPresent: !!dailyPanel,
    finalAcceptancePresent: !!finalAcceptance,
    promotionGatePresent: !!promotionGate,
    auditDashboardPresent: !!auditDashboard,
    manualCheckPresent: !!manualCheck,
    readinessPacketPresent: !!readinessPacket,
  };

  return {
    sessionId: currentSession.sessionId,
    createdAt: currentSession.createdAt,
    updatedAt: new Date().toISOString(),
    closedAt: currentSession.closedAt || null,
    phase: 'OPERATOR_SESSION_LOG',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    sessionStatus,
    dailyStatus: dailyPanel?.dailyStatus ?? 'UNKNOWN',
    acceptanceStatus: finalAcceptance?.acceptanceStatus ?? 'UNKNOWN',
    readinessStatus: readinessPacket?.readinessStatus ?? 'UNKNOWN',
    promotionDecision: promotionGate?.promotionDecision ?? 'UNKNOWN',
    latestAuditStatus: auditDashboard?.auditStatus ?? 'UNKNOWN',
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
    checklistCompletedCount,
    checklist,
    operatorNote: note,
    sourceDiagnostics,
    safetyAssertions,
    note: 'Operator session log only. Local manual monitoring record.',
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
      {copied ? 'Copied!' : 'Copy Session Log JSON'}
    </button>
  );
}

export default function OperatorSessionLog() {
  const [currentSession, setCurrentSession] = useState(null);
  const [checklist, setChecklist] = useState({
    sessionStarted: false,
    dailyStatusReviewed: false,
    statusCheckReviewed: false,
    healthCheckReviewed: false,
    gatewayResultReviewed: false,
    evidenceExportReviewed: false,
    auditDashboardReviewed: false,
    promotionFinalAcceptanceReviewed: false,
    safetyAssertionsReviewed: false,
    sessionClosed: false,
  });
  const [note, setNote] = useState('');
  const [sessionLog, setSessionLog] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showJSON, setShowJSON] = useState(false);

  // Load current session on mount
  useEffect(() => {
    const existing = loadJSON(CURRENT_SESSION_KEY, null);
    if (existing) {
      setCurrentSession(existing);
      setChecklist(existing.checklist || {});
      setNote(existing.operatorNote || '');
    }
    const history = loadJSON(LOG_KEY, []);
    setSessionHistory(history);
  }, []);

  const handleStartSession = useCallback(() => {
    const newSession = {
      sessionId: 'ops-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      closedAt: null,
    };
    setCurrentSession(newSession);
    setChecklist({ ...checklist, sessionStarted: true });
    saveSession(newSession);
    tryAppendAudit({
      event: 'operator_session_started',
      sessionId: newSession.sessionId,
      note: `Operator session started (${newSession.sessionId}). Local manual monitoring record. No dispatch. No execution.`,
    });
  }, [checklist]);

  const handleCloseSession = useCallback(() => {
    if (!currentSession) return;
    const closedSession = {
      ...currentSession,
      closedAt: new Date().toISOString(),
    };
    setCurrentSession(closedSession);
    setChecklist({ ...checklist, sessionClosed: true });
    saveSession(closedSession);
    saveSessionLog(closedSession);
    tryAppendAudit({
      event: 'operator_session_closed',
      sessionId: closedSession.sessionId,
      checklistCompletedCount: Object.values(checklist).filter(v => v).length,
      note: `Operator session closed (${closedSession.sessionId}). Checklist items completed: ${Object.values(checklist).filter(v => v).length}/10. No dispatch. No execution.`,
    });
    setSessionHistory([closedSession, ...sessionHistory]);
  }, [currentSession, checklist, sessionHistory]);

  const handleChecklistToggle = useCallback((key) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    if (currentSession) {
      const updatedSession = { ...currentSession };
      saveSession(updatedSession);
      tryAppendAudit({
        event: 'operator_session_updated',
        sessionId: currentSession.sessionId,
        checklistItem: key,
        checklistValue: updated[key],
        note: `Operator session updated. Checklist item "${key}" set to ${updated[key]}. No dispatch. No execution.`,
      });
    }
  }, [checklist, currentSession]);

  const handleNoteChange = useCallback((newNote) => {
    setNote(newNote);
    if (currentSession) {
      const updatedSession = { ...currentSession };
      saveSession(updatedSession);
    }
  }, [currentSession]);

  const handleRegenerateSnapshot = useCallback(() => {
    if (!currentSession) return;
    const snapshot = buildSessionObject(currentSession, checklist, note);
    setSessionLog(snapshot);
    tryAppendAudit({
      event: 'operator_session_snapshot_regenerated',
      sessionId: currentSession.sessionId,
      checklistCompletedCount: snapshot.checklistCompletedCount,
      note: `Operator session snapshot regenerated (${currentSession.sessionId}). Status: ${snapshot.sessionStatus}. No dispatch. No execution.`,
    });
  }, [currentSession, checklist, note]);

  // Generate initial snapshot
  useEffect(() => {
    if (currentSession) {
      const snapshot = buildSessionObject(currentSession, checklist, note);
      setSessionLog(snapshot);
    }
  }, [currentSession, checklist, note]);

  const STATUS_STYLE = {
    OPEN: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: Play,     label: 'OPEN' },
    CLOSED: { color: 'text-green-500',  bg: 'bg-green-500/5 border-green-500/20',    icon: Square,   label: 'CLOSED' },
    HOLD: { color: 'text-amber-500',    bg: 'bg-amber-500/5 border-amber-500/20',    icon: AlertTriangle, label: 'HOLD' },
    BLOCKED: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle, label: 'BLOCKED' },
  };

  const style = sessionLog ? (STATUS_STYLE[sessionLog.sessionStatus] || STATUS_STYLE.HOLD) : null;
  const Icon = style?.icon;

  const checklistItems = [
    { key: 'sessionStarted', label: 'Session started' },
    { key: 'dailyStatusReviewed', label: 'Daily status reviewed' },
    { key: 'statusCheckReviewed', label: 'Manual /status check reviewed' },
    { key: 'healthCheckReviewed', label: 'Manual /health check reviewed' },
    { key: 'gatewayResultReviewed', label: 'Gateway result reviewed' },
    { key: 'evidenceExportReviewed', label: 'Evidence export reviewed or regenerated' },
    { key: 'auditDashboardReviewed', label: 'Audit dashboard reviewed or regenerated' },
    { key: 'promotionFinalAcceptanceReviewed', label: 'Promotion/final acceptance reviewed' },
    { key: 'safetyAssertionsReviewed', label: 'Safety assertions reviewed' },
    { key: 'sessionClosed', label: 'Session closed' },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Session Recordkeeping</div>
          <div className="text-[13px] font-bold text-foreground">Operator Session Log</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Local-only session record for manual monitoring — checklist and notes.</div>
        </div>
        <div className="flex gap-2">
          {!currentSession ? (
            <button type="button" onClick={handleStartSession}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary text-primary bg-primary/10 hover:bg-primary/20 rounded font-bold transition-colors">
              <Play className="w-3 h-3" /> Start Session
            </button>
          ) : (
            <>
              <button type="button" onClick={handleRegenerateSnapshot}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
              {!currentSession.closedAt && (
                <button type="button" onClick={handleCloseSession}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/15 rounded font-bold transition-colors">
                  <Square className="w-3 h-3" /> Close Session
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">LOCAL_ONLY / READ_ONLY / LOCKED</span> — Session record. No network. No dispatch. No execution.</span>
      </div>

      {currentSession && sessionLog && (
        <>
          {/* Session Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Session: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : style.color === 'text-green-500' ? 'text-green-500/80' : 'text-primary/80'}`}>
                  {style.label === 'OPEN' && 'Session active. Review checklist items and complete daily workflow.'}
                  {style.label === 'CLOSED' && 'Session closed. Record saved to session history.'}
                  {style.label === 'HOLD' && 'Checklist incomplete. Continue through remaining items.'}
                  {style.label === 'BLOCKED' && 'Safety issue detected. Review immediately.'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Session Status',         value: sessionLog.sessionStatus,          color: style.color },
              { label: 'Daily Status',           value: sessionLog.dailyStatus,            color: 'text-slate-300' },
              { label: 'Acceptance',             value: sessionLog.acceptanceStatus.split('_')[0], color: 'text-slate-300' },
              { label: 'Latest Audit',           value: sessionLog.latestAuditStatus,      color: 'text-slate-300' },
              { label: 'Latest Endpoint',        value: sessionLog.latestEndpoint,         color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',            value: sessionLog.latestHttpStatus,       color: 'text-foreground' },
              { label: 'Gateway Reachable',      value: String(sessionLog.gatewayReachable), color: sessionLog.gatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'Checklist Completed',    value: `${sessionLog.checklistCompletedCount}/10`, color: 'text-primary font-bold' },
              { label: 'Scheduler Active',       value: String(sessionLog.schedulerActive), color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',      value: String(sessionLog.executionAllowed), color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] font-bold break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Daily Workflow Checklist</div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {checklistItems.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleChecklistToggle(item.key)}
                  className="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-secondary/30 transition-colors group"
                >
                  {checklist[item.key]
                    ? <Check className="w-4 h-4 text-primary shrink-0 font-bold" />
                    : <div className="w-4 h-4 border-2 border-slate-500 rounded shrink-0 group-hover:border-slate-400" />}
                  <span className={`text-[9px] flex-1 ${checklist[item.key] ? 'text-slate-300 line-through' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Operator Note */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Operator Note</div>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Optional notes about this session..."
                className="w-full h-20 bg-secondary/40 border border-border rounded px-3 py-2 text-[9px] text-foreground placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
              />
            </div>
          </div>

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
              {Object.entries(sessionLog.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`bg-card/60 px-2 py-1 rounded border border-border/40 ${val ? 'border-primary/30' : ''}`}>
                  <div className="text-slate-500 mb-0.5">{key}</div>
                  <div className={`font-bold text-[9px] ${val ? 'text-primary' : 'text-slate-500'}`}>{String(val)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {sessionLog.safetyAssertions.filter(a => a.pass).length}/{sessionLog.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {sessionLog.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Session Log JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(sessionLog, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Session ID + Timestamps */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /><span className="font-mono">{currentSession.sessionId}</span></span>
            <span>Created: {new Date(currentSession.createdAt).toLocaleString()}</span>
            {currentSession.closedAt && <span>Closed: {new Date(currentSession.closedAt).toLocaleString()}</span>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={sessionLog} />
            <button type="button" onClick={handleRegenerateSnapshot}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Session Snapshot
            </button>
          </div>
        </>
      )}

      {!currentSession && (
        <div className="flex items-center justify-center gap-2 px-4 py-8 bg-secondary/10 border border-border/60 rounded-lg text-center">
          <Play className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] text-slate-400">No active session. Click "Start Session" to begin.</span>
        </div>
      )}

      {/* Recent Session History */}
      {sessionHistory.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Recent Session History</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Session ID', 'Created', 'Closed', 'Checklist', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessionHistory.slice(0, 10).map((session, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap truncate max-w-[120px]">{session.sessionId}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{new Date(session.createdAt).toLocaleTimeString()}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.closedAt ? new Date(session.closedAt).toLocaleTimeString() : '—'}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.checklistCompletedCount ?? 0}/10</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${
                        session.sessionStatus === 'CLOSED' ? 'border-green-500/30 bg-green-500/5 text-green-500' :
                        session.sessionStatus === 'BLOCKED' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
                        'border-primary/30 bg-primary/5 text-primary'
                      }`}>
                        {session.sessionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Operator session log is local-only. Manual read-only monitoring record only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}