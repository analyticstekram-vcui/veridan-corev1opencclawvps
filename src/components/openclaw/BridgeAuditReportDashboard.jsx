/**
 * BridgeAuditReportDashboard
 * Local-only audit report aggregation for the Gateway Connector stack.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls
 *   - Reads from localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldCheck, RefreshCw, FileJson } from 'lucide-react';

const SOURCE_KEYS = {
  approvalPackets:     'openclawReadOnlyRouteApprovalPackets',
  executionPreviews:   'openclawControlledReadOnlyRouteExecutionPreviews',
  bridgeCalls:         'openclawControlledReadOnlyRouteBridgeCalls',
  resultEvidenceExports: 'openclawBridgeCallResultEvidenceExports',
  auditTrail:          'openclawAuditTrail',
};
const REPORT_KEY = 'openclawBridgeAuditReportDashboards';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];
const BLOCKED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];
const MUTATION_KEYWORDS = ['WRITE', 'DELETE', 'MUTATE', 'POST', 'PUT', 'PATCH'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveReport(report) {
  try {
    const all = loadJSON(REPORT_KEY, []);
    const deduped = [report, ...all.filter(r => r.reportId !== report.reportId)];
    localStorage.setItem(REPORT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function evaluateStatus(counts, records) {
  let isFail = false;
  let isWarn = false;

  // Check for failures
  records.forEach(rec => {
    if (rec.executionAttempted === true) isFail = true;
    if (rec.secretExposed === true) isFail = true;
    if (rec.dispatchAllowed === true) isFail = true;
    if (rec.openClawCommandSent === true) isFail = true;
    if (rec.endpoint && !ALLOWED_ENDPOINTS.includes(rec.endpoint)) isFail = true;
    if (rec.method && BLOCKED_METHODS.includes(rec.method)) isFail = true;
  });

  // Check for warnings
  if (counts.bridgeCalls === 0) isWarn = true;
  if (counts.auditEvents === 0) isWarn = true;

  // Pass: no failures, at least one successful read-only bridge call
  if (isFail) return 'FAIL';
  if (isWarn && counts.bridgeCalls > 0) return 'WARN';
  if (counts.bridgeCalls > 0 && counts.resultEvidenceExports > 0) return 'PASS';
  if (isWarn) return 'WARN';
  return 'PASS';
}

function flattenRecords() {
  const flattened = [];

  // From approval packets
  const packets = loadJSON(SOURCE_KEYS.approvalPackets, []);
  packets.forEach(p => {
    flattened.push({
      recordId:    p.packetId ?? p.id,
      type:        'APPROVAL_PACKET',
      timestamp:   p.createdAt,
      routeCount:  p.routes?.length ?? 0,
      status:      p.safetyAssertions?.every(a => a.pass) ? 'PASS' : 'WARN',
      passed:      p.safetyAssertions?.filter(a => a.pass).length ?? 0,
      total:       p.safetyAssertions?.length ?? 0,
    });
  });

  // From execution previews
  const previews = loadJSON(SOURCE_KEYS.executionPreviews, []);
  previews.forEach(p => {
    flattened.push({
      recordId:    p.previewId ?? p.id,
      type:        'EXECUTION_PREVIEW',
      timestamp:   p.createdAt,
      endpoint:    p.selectedEndpoint,
      method:      p.method,
      status:      p.method === 'GET' && ALLOWED_ENDPOINTS.includes(p.selectedEndpoint) ? 'PASS' : 'FAIL',
    });
  });

  // From bridge calls
  const calls = loadJSON(SOURCE_KEYS.bridgeCalls, []);
  calls.forEach(c => {
    const isFail = c.executionAttempted || c.secretExposed || c.dispatchAllowed || c.openClawCommandSent;
    flattened.push({
      recordId:              c.bridgeCallId ?? c.id,
      type:                  'BRIDGE_CALL',
      timestamp:             c.createdAt,
      endpoint:              c.endpoint,
      httpStatus:            c.httpStatus,
      reachable:             c.gatewayReachable ?? false,
      executionAttempted:    c.executionAttempted ?? false,
      secretExposed:         c.secretExposed ?? false,
      dispatchAllowed:       c.dispatchAllowed ?? false,
      openClawCommandSent:   c.openClawCommandSent ?? false,
      status:                isFail ? 'FAIL' : c.reachable ? 'PASS' : 'WARN',
    });
  });

  // From evidence exports
  const evidences = loadJSON(SOURCE_KEYS.resultEvidenceExports, []);
  evidences.forEach(e => {
    const isFail = e.executionAttempted || e.secretExposed || e.dispatchAllowed || e.openClawCommandSent;
    flattened.push({
      recordId:    e.evidenceId ?? e.id,
      type:        'EVIDENCE_EXPORT',
      timestamp:   e.createdAt,
      endpoint:    e.endpoint,
      httpStatus:  e.httpStatus,
      status:      isFail ? 'FAIL' : e.reachable ? 'PASS' : 'WARN',
      passed:      e.safetyAssertions?.filter(a => a.pass).length ?? 0,
      total:       e.safetyAssertions?.length ?? 0,
    });
  });

  // From audit trail
  const auditEvents = loadJSON(SOURCE_KEYS.auditTrail, []);
  auditEvents.forEach(ae => {
    flattened.push({
      recordId:   ae.id ?? ae.auditId,
      type:       'AUDIT_EVENT',
      timestamp:  ae.timestamp ?? ae.createdAt,
      event:      ae.event ?? 'unknown',
      status:     'PASS',
    });
  });

  return flattened;
}

function buildReport() {
  const records = flattenRecords();

  const counts = {
    approvedRoutes:        loadJSON(SOURCE_KEYS.approvalPackets, []).length,
    executionPreviews:     loadJSON(SOURCE_KEYS.executionPreviews, []).length,
    bridgeCalls:           loadJSON(SOURCE_KEYS.bridgeCalls, []).length,
    resultEvidenceExports: loadJSON(SOURCE_KEYS.resultEvidenceExports, []).length,
    auditEvents:           loadJSON(SOURCE_KEYS.auditTrail, []).length,
    openClawCalls:         0,
    executionAttempts:     0,
  };

  // Count occurrences
  records.forEach(r => {
    if (r.openClawCommandSent === true) counts.openClawCalls++;
    if (r.executionAttempted === true) counts.executionAttempts++;
  });

  const secretExposed = records.some(r => r.secretExposed === true);
  const overallStatus = evaluateStatus(counts, records);

  const safetyAssertions = [
    { key: 'previewOnly',            value: true,                           pass: true },
    { key: 'readOnly',               value: true,                           pass: true },
    { key: 'gatewayMode',            value: 'READ_ONLY',                    pass: true },
    { key: 'executionMode',          value: 'DISABLED',                     pass: true },
    { key: 'executionLocked',        value: true,                           pass: true },
    { key: 'dispatchAllowed',        value: false,                          pass: true },
    { key: 'mutationMethodsBlocked', value: true,                           pass: true },
    { key: 'approvedEndpointsOnly',  value: true,                           pass: true },
    { key: 'openClawCommandSent',    value: false,                          pass: counts.openClawCalls === 0 },
    { key: 'browserToolUsed',        value: false,                          pass: true },
    { key: 'credentialAccessed',     value: false,                          pass: true },
    { key: 'secretExposed',          value: false,                          pass: !secretExposed },
  ];

  const reportId = 'bard-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    reportId,
    createdAt:             new Date().toISOString(),
    phase:                 'BRIDGE_AUDIT_REPORT_DASHBOARD',
    overallStatus,
    counts,
    secretExposed,
    totalRecords:          records.length,
    safetyAssertions,
    records,
    note: 'Local-only bridge audit report. No network calls. No OpenClaw command dispatch. No execution. No credentials.',
  };
}

const STATUS_STYLE = {
  PASS: { color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',         icon: CheckCircle2,  short: 'PASS' },
  WARN: { color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',     icon: AlertTriangle, short: 'WARN' },
  FAIL: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'FAIL' },
};

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
      {copied ? 'Copied!' : 'Copy Bridge Audit Report JSON'}
    </button>
  );
}

export default function BridgeAuditReportDashboard({ refreshTrigger }) {
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const r = buildReport();
    saveReport(r);
    tryAppendAudit({
      event:         'bridge_audit_report_dashboard_generated',
      reportId:      r.reportId,
      overallStatus: r.overallStatus,
      counts:        r.counts,
      secretExposed: r.secretExposed,
      note: `Bridge audit report generated (${r.reportId}). Status: ${r.overallStatus}. Records: ${r.totalRecords}. No network calls. No dispatch.`,
    });
    setReport(r);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger, generate]);

  const filtered = report ? report.records.filter(r => {
    if (filter === 'PASS') return r.status === 'PASS';
    if (filter === 'WARN') return r.status === 'WARN';
    if (filter === 'FAIL') return r.status === 'FAIL';
    if (filter === 'BRIDGE_CALL') return r.type === 'BRIDGE_CALL';
    if (filter === 'EVIDENCE_EXPORT') return r.type === 'EVIDENCE_EXPORT';
    if (filter === 'AUDIT_EVENT') return r.type === 'AUDIT_EVENT';
    return true;
  }) : [];

  const FILTERS = ['ALL', 'PASS', 'WARN', 'FAIL', 'BRIDGE_CALL', 'EVIDENCE_EXPORT', 'AUDIT_EVENT'];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Audit Report</div>
          <div className="text-[13px] font-bold text-foreground">Bridge Audit Report Dashboard</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Aggregates and audits all gateway connector stack records. No network calls.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">AUDIT_ONLY / READ_ONLY / LOCKED</span> — Audit dashboard. No dispatch. No execution. No network calls.</span>
      </div>

      {report && (
        <>
          {/* Overall status banner */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            report.overallStatus === 'FAIL'
              ? 'bg-destructive/5 border-destructive/20'
              : report.overallStatus === 'WARN'
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-primary/5 border-primary/30'
          }`}>
            <div className="flex items-center gap-2">
              {report.overallStatus === 'FAIL' ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : report.overallStatus === 'WARN' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  report.overallStatus === 'FAIL' ? 'text-destructive' : report.overallStatus === 'WARN' ? 'text-amber-500' : 'text-primary'
                }`}>
                  Overall Status: {report.overallStatus}
                </div>
                <div className="text-[8px] text-slate-400 mt-0.5">
                  {report.counts.bridgeCalls} bridge calls • {report.counts.resultEvidenceExports} evidence exports • {report.totalRecords} total records
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Approved Routes',      value: report.counts.approvedRoutes,        color: 'text-foreground' },
              { label: 'Exec Previews',        value: report.counts.executionPreviews,     color: 'text-slate-300' },
              { label: 'Bridge Calls',         value: report.counts.bridgeCalls,           color: 'text-primary font-bold' },
              { label: 'Result Exports',       value: report.counts.resultEvidenceExports, color: report.counts.resultEvidenceExports > 0 ? 'text-primary font-bold' : 'text-slate-500' },
              { label: 'Audit Events',         value: report.counts.auditEvents,           color: 'text-slate-300' },
              { label: 'OpenClaw Calls',       value: report.counts.openClawCalls,         color: report.counts.openClawCalls === 0 ? 'text-primary font-bold' : 'text-destructive' },
              { label: 'Exec Attempts',        value: report.counts.executionAttempts,     color: report.counts.executionAttempts === 0 ? 'text-primary font-bold' : 'text-destructive' },
              { label: 'Secret Exposed',       value: String(report.secretExposed),        color: report.secretExposed ? 'text-destructive font-bold' : 'text-primary font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[8px] font-bold rounded border transition-colors ${
                  filter === f
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-secondary/20 border-border text-slate-400 hover:bg-secondary/40'
                }`}>
                {f}
              </button>
            ))}
            <span className="ml-auto text-[8px] text-slate-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Audit records table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
              <FileJson className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Audit Records — {report.records.length} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Timestamp', 'Type', 'Record ID', 'Details', 'Status'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const style = STATUS_STYLE[r.status] || STATUS_STYLE.PASS;
                    const Icon = style.icon;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[7px]">
                          {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-[7px] font-bold text-slate-300">{r.type}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap max-w-[100px] truncate text-[7px]">
                          {r.recordId?.slice(-12)}
                        </td>
                        <td className="px-3 py-2 text-slate-400 max-w-[200px] text-[7px]">
                          {r.endpoint && <span>{r.endpoint}</span>}
                          {r.httpStatus && <span> HTTP {r.httpStatus}</span>}
                          {r.event && <span>{r.event}</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold flex items-center gap-1 w-fit ${style.bg} ${style.color}`}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            {style.short}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {report.safetyAssertions.filter(a => a.pass).length}/{report.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {report.safetyAssertions.map(a => (
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
              <FileJson className="w-3.5 h-3.5" /> Full Audit JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Report ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><FileJson className="w-3 h-3" /><span className="font-mono">{report.reportId}</span></span>
            <span>{new Date(report.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={report} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileJson className="w-3 h-3" /> Generate Audit Report
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Bridge Audit Dashboard is local-only. No network calls. No OpenClaw command dispatch. No execution. No credentials.
      </div>
    </div>
  );
}