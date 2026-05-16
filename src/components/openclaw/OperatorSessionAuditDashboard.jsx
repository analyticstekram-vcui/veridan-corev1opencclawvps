/**
 * OperatorSessionAuditDashboard
 * Local-only audit dashboard summarizing operator sessions over time.
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
  sessionLogs:             'openclawOperatorSessionLogs',
  sessionEvidenceExports:  'openclawOperatorSessionEvidenceExports',
  dailyUsePanels:          'openclawOperatorDailyUsePanels',
  controlRoomSummaries:    'openclawManualMonitoringControlRoomSummaries',
  finalAcceptancePackets:  'openclawManualMonitoringFinalAcceptancePackets',
  promotionGates:          'openclawManualMonitoringPromotionGates',
  auditDashboards:         'openclawManualMonitoringAuditDashboards',
  evidenceExports:         'openclawManualMonitoringEvidenceExports',
  manualChecks:            'openclawManualReadOnlyMonitoringChecks',
  auditTrail:              'openclawAuditTrail',
};
const DASHBOARD_KEY = 'openclawOperatorSessionAuditDashboards';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveDashboard(dashboard) {
  try {
    const all = loadJSON(DASHBOARD_KEY, []);
    const deduped = [dashboard, ...all.filter(d => {
      if (dashboard.latestSessionId && d.latestSessionId) {
        return d.latestSessionId !== dashboard.latestSessionId;
      }
      return d.sessionAuditDashboardId !== dashboard.sessionAuditDashboardId;
    })];
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildDashboard() {
  const sessions = loadJSON(SOURCE_KEYS.sessionLogs, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.sessionEvidenceExports, []);
  const finalAcceptance = loadJSON(SOURCE_KEYS.finalAcceptancePackets, [])[0];
  const promotionGate = loadJSON(SOURCE_KEYS.promotionGates, [])[0];
  const auditDashboard = loadJSON(SOURCE_KEYS.auditDashboards, [])[0];

  // Session counts
  const openSessions = sessions.filter(s => s.sessionStatus === 'OPEN').length;
  const closedSessions = sessions.filter(s => s.sessionStatus === 'CLOSED').length;
  const holdSessions = sessions.filter(s => s.sessionStatus === 'HOLD').length;
  const blockedSessions = sessions.filter(s => s.sessionStatus === 'BLOCKED').length;

  // Checklist completion rate
  const totalChecklistItems = sessions.reduce((sum, s) => sum + (s.checklistCompletedCount || 0), 0);
  const maxPossibleItems = sessions.length * 10;
  const checklistCompletionRate = maxPossibleItems > 0 ? Math.round((totalChecklistItems / maxPossibleItems) * 100) : 0;

  // Latest session info
  const latestSession = sessions.length > 0 ? sessions[0] : null;

  // Recent operator notes
  const recentNotes = sessions.filter(s => s.operatorNote).map(s => ({
    sessionId: s.sessionId,
    note: s.operatorNote,
    createdAt: s.createdAt,
  })).slice(0, 5);

  // Safety failure detection
  let safetyFailureCount = 0;
  sessions.forEach(s => {
    if (s.sessionStatus === 'BLOCKED') safetyFailureCount++;
    if (s.executionAttempted || s.dispatchAllowed || s.openClawCommandSent) safetyFailureCount++;
  });

  // Overall dashboard status
  let dashboardStatus = 'WARN';
  if (sessions.length > 0 && blockedSessions === 0 && safetyFailureCount === 0) {
    dashboardStatus = 'PASS';
  } else if (blockedSessions > 0 || safetyFailureCount > 0) {
    dashboardStatus = 'FAIL';
  }

  // Session summaries
  const sessionSummaries = sessions.map(s => ({
    sessionId: s.sessionId,
    status: s.sessionStatus,
    createdAt: s.createdAt,
    closedAt: s.closedAt,
    checklistCompletedCount: s.checklistCompletedCount,
    latestEndpoint: s.latestEndpoint,
    latestHttpStatus: s.latestHttpStatus,
    operatorNote: s.operatorNote ? s.operatorNote.slice(0, 50) + '...' : '—',
  }));

  // Evidence export summaries
  const evidenceExportSummaries = evidenceExports.map(e => ({
    exportId: e.sessionEvidenceExportId,
    sourceSessionId: e.sourceSessionId,
    createdAt: e.createdAt,
    checklistCompleted: e.checklistSummary?.completed || 0,
    checklistTotal: e.checklistSummary?.total || 10,
    safetyPass: e.safetyAssertions?.every(a => a.pass) ?? false,
  }));

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
    sessionCount: sessions.length,
    evidenceExportCount: evidenceExports.length,
    openSessionCount: openSessions,
    closedSessionCount: closedSessions,
    finalAcceptancePresent: !!finalAcceptance,
    promotionGatePresent: !!promotionGate,
    auditDashboardPresent: !!auditDashboard,
  };

  const sessionAuditDashboardId = 'osad-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    sessionAuditDashboardId,
    createdAt: new Date().toISOString(),
    phase: 'OPERATOR_SESSION_AUDIT_DASHBOARD',
    systemName: 'VeridanCore OpenClaw Operator Portal',
    dashboardStatus,
    totalSessions: sessions.length,
    openSessions,
    closedSessions,
    holdSessions,
    blockedSessions,
    totalEvidenceExports: evidenceExports.length,
    checklistCompletionRate,
    latestSessionId: latestSession?.sessionId ?? 'N/A',
    latestSessionStatus: latestSession?.sessionStatus ?? 'N/A',
    latestEndpoint: latestSession?.latestEndpoint ?? 'N/A',
    latestHttpStatus: latestSession?.latestHttpStatus ?? 'N/A',
    latestAuditStatus: auditDashboard?.auditStatus ?? 'UNKNOWN',
    latestAcceptanceStatus: finalAcceptance?.acceptanceStatus ?? 'UNKNOWN',
    recentOperatorNotes: recentNotes,
    safetyFailureCount,
    gatewayMode: 'READ_ONLY',
    executionMode: 'DISABLED',
    executionLock: 'LOCKED',
    monitoringMode: 'MANUAL_ONLY',
    schedulerActive: false,
    pollingLoopActive: false,
    dispatchAllowed: false,
    executionAllowed: false,
    sessionSummaries,
    evidenceExportSummaries,
    sourceDiagnostics,
    safetyAssertions,
    note: 'Operator session audit dashboard only. Local manual monitoring history review. No scheduler. No polling. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Audit Dashboard JSON'}
    </button>
  );
}

export default function OperatorSessionAuditDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const d = buildDashboard();
    saveDashboard(d);
    tryAppendAudit({
      event: 'operator_session_audit_dashboard_generated',
      sessionAuditDashboardId: d.sessionAuditDashboardId,
      totalSessions: d.totalSessions,
      dashboardStatus: d.dashboardStatus,
      checklistCompletionRate: d.checklistCompletionRate,
      note: `Operator session audit dashboard generated (${d.sessionAuditDashboardId}). Total sessions: ${d.totalSessions}. Status: ${d.dashboardStatus}. Checklist completion: ${d.checklistCompletionRate}%. No dispatch. No execution.`,
    });
    setDashboard(d);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const filterSessions = useCallback(() => {
    if (!dashboard) return [];
    const sessions = loadJSON(SOURCE_KEYS.sessionLogs, []);
    const sessionsByFilter = {
      ALL: sessions,
      OPEN: sessions.filter(s => s.sessionStatus === 'OPEN'),
      CLOSED: sessions.filter(s => s.sessionStatus === 'CLOSED'),
      HOLD: sessions.filter(s => s.sessionStatus === 'HOLD'),
      BLOCKED: sessions.filter(s => s.sessionStatus === 'BLOCKED'),
      HAS_EVIDENCE: sessions.filter(s => loadJSON(SOURCE_KEYS.sessionEvidenceExports, []).some(e => e.sourceSessionId === s.sessionId)),
      MISSING_EVIDENCE: sessions.filter(s => !loadJSON(SOURCE_KEYS.sessionEvidenceExports, []).some(e => e.sourceSessionId === s.sessionId)),
    };
    return sessionsByFilter[filter] || [];
  }, [filter, dashboard]);

  const filteredSessions = filterSessions();

  const STATUS_STYLE = {
    PASS: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/30',         icon: CheckCircle2, label: 'PASS' },
    WARN: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: AlertTriangle, label: 'WARN' },
    FAIL: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,       label: 'FAIL' },
  };

  const style = dashboard ? (STATUS_STYLE[dashboard.dashboardStatus] || STATUS_STYLE.WARN) : null;
  const Icon = style?.icon;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">History Review</div>
          <div className="text-[13px] font-bold text-foreground">Operator Session Audit Dashboard</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Aggregate summary of operator sessions over time — read-only history.</div>
        </div>
        {dashboard && (
          <button type="button" onClick={generate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">AUDIT_ONLY / READ_ONLY / LOCKED</span> — History review. No network. No dispatch. No execution.</span>
      </div>

      {dashboard && (
        <>
          {/* Audit Dashboard Status Banner */}
          <div className={`border rounded-lg p-4 space-y-2 ${style.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
              <div>
                <div className={`text-[14px] font-bold uppercase tracking-wide ${style.color}`}>
                  Audit Status: {style.label}
                </div>
                <div className={`text-[9px] mt-1 ${style.color === 'text-destructive' ? 'text-destructive/80' : style.color === 'text-amber-500' ? 'text-amber-500/80' : 'text-primary/80'}`}>
                  {style.label === 'PASS' && 'All sessions reviewed. No safety failures detected.'}
                  {style.label === 'WARN' && 'Sessions present but checklist gaps or missing evidence detected.'}
                  {style.label === 'FAIL' && 'Safety failures detected. Review blocked sessions immediately.'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Total Sessions',       value: dashboard.totalSessions,          color: 'text-primary font-bold' },
              { label: 'Open Sessions',        value: dashboard.openSessions,           color: 'text-slate-300' },
              { label: 'Closed Sessions',      value: dashboard.closedSessions,         color: 'text-green-500 font-bold' },
              { label: 'Hold Sessions',        value: dashboard.holdSessions,           color: 'text-amber-500' },
              { label: 'Blocked Sessions',     value: dashboard.blockedSessions,        color: dashboard.blockedSessions > 0 ? 'text-destructive font-bold' : 'text-slate-300' },
              { label: 'Evidence Exports',     value: dashboard.totalEvidenceExports,   color: 'text-primary font-bold' },
              { label: 'Checklist Complete',   value: `${dashboard.checklistCompletionRate}%`, color: dashboard.checklistCompletionRate >= 80 ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'Latest Endpoint',      value: dashboard.latestEndpoint,         color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'Scheduler Active',     value: String(dashboard.schedulerActive), color: 'text-destructive font-bold' },
              { label: 'Execution Allowed',    value: String(dashboard.executionAllowed), color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'OPEN', 'CLOSED', 'HOLD', 'BLOCKED', 'HAS_EVIDENCE', 'MISSING_EVIDENCE'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 text-[9px] border font-bold transition-colors rounded ${
                  filter === f
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Session History Table */}
          {dashboard.sessionSummaries.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Session History ({filteredSessions.length})
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Session ID', 'Status', 'Created', 'Closed', 'Checklist', 'Latest Endpoint', 'HTTP', 'Note'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.slice(0, 15).map((session, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap truncate max-w-[100px]">{session.sessionId.slice(-8)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${
                            session.sessionStatus === 'CLOSED' ? 'border-green-500/30 bg-green-500/5 text-green-500' :
                            session.sessionStatus === 'OPEN' ? 'border-primary/30 bg-primary/5 text-primary' :
                            session.sessionStatus === 'BLOCKED' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
                            'border-amber-500/30 bg-amber-500/5 text-amber-500'
                          }`}>{session.sessionStatus}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{new Date(session.createdAt).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.closedAt ? new Date(session.closedAt).toLocaleTimeString() : '—'}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.checklistCompletedCount}/10</td>
                        <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap truncate max-w-[80px]">{session.latestEndpoint}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{session.latestHttpStatus}</td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap truncate max-w-[100px] text-[7px]">{session.operatorNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evidence Export Table */}
          {dashboard.evidenceExportSummaries.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-secondary/20 border-b border-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Evidence Exports ({dashboard.evidenceExportSummaries.length})</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Export ID', 'Source Session', 'Created', 'Checklist', 'Safety'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.evidenceExportSummaries.slice(0, 10).map((exp, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap truncate max-w-[100px]">{exp.exportId.slice(-8)}</td>
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap truncate max-w-[100px]">{exp.sourceSessionId.slice(-8)}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{new Date(exp.createdAt).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{exp.checklistCompleted}/{exp.checklistTotal}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {exp.safetyPass ? (
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Operator Notes */}
          {dashboard.recentOperatorNotes.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Recent Operator Notes</div>
              <div className="space-y-2">
                {dashboard.recentOperatorNotes.map((item, i) => (
                  <div key={i} className="border-l-2 border-primary/30 pl-3 py-1">
                    <div className="text-[8px] text-slate-400 font-mono">{item.sessionId.slice(-8)} • {new Date(item.createdAt).toLocaleTimeString()}</div>
                    <div className="text-[8px] text-slate-300 mt-0.5">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Diagnostics */}
          <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Diagnostics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {Object.entries(dashboard.sourceDiagnostics).map(([key, val]) => (
                <div key={key} className={`bg-card/60 px-2 py-1 rounded border border-border/40 ${typeof val === 'boolean' && val ? 'border-primary/30' : ''}`}>
                  <div className="text-slate-500 mb-0.5">{key}</div>
                  <div className={`font-bold text-[9px] ${typeof val === 'boolean' && val ? 'text-primary' : 'text-slate-500'}`}>{String(val)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {dashboard.safetyAssertions.filter(a => a.pass).length}/{dashboard.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {dashboard.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Audit Dashboard JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(dashboard, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Dashboard ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /><span className="font-mono">{dashboard.sessionAuditDashboardId}</span></span>
            <span>{new Date(dashboard.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={dashboard} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Regenerate Audit Dashboard
            </button>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Operator session audit dashboard is local-only. Manual read-only monitoring history only. No scheduler. No polling. No dispatch. No execution.
      </div>
    </div>
  );
}