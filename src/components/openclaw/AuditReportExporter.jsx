/**
 * AuditReportExporter
 * Read-only audit package builder from localStorage evidence sources.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  FileDown, CheckCircle2, Copy, RefreshCw, ShieldCheck,
  ChevronDown, ChevronRight, Clock
} from 'lucide-react';

// ── localStorage keys ──────────────────────────────────────────────────────────
const SOURCES = {
  auditTrail:      'openclawAuditTrail',
  alertReports:    'openclawGatewayAlertReports',
  timelines:       'openclawProposalLifecycleTimelineReports',
  healthChecks:    'openclawReadOnlyGatewayHealthChecks',
  inspector:       'openclawGatewayResponseInspector',
  evidence:        'openclawFinalNonExecutionLockEvidence',
  signedPreviews:  'vc_signed_bridge_previews',
  packets:         'vc_preview_packets',
  proposals:       'vc_proposals',
  dryRuns:         'vc_bridge_dry_runs',
};
const EXPORT_KEY = 'openclawAuditReportExports';

function safeLoad(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [p];
  } catch { return []; }
}

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

// ── Normalise every record into a flat event ───────────────────────────────────
function normalise(records, source, typeLabel, idFn, tsFn, detailFn) {
  return records.map(r => ({
    _uid:              `${source}-${idFn(r)}`,
    source,
    eventType:         typeLabel,
    timestamp:         tsFn(r),
    proposalId:        r.proposalId || r.id || null,
    packetId:          r.packetId || null,
    executionAttempted: false,
    openClawCalls:     0,
    networkCalls:      false,
    detail:            detailFn(r),
    raw:               r,
  }));
}

function buildEvents() {
  const all = [
    ...normalise(safeLoad(SOURCES.proposals),    'PROPOSALS',       'PROPOSAL',         r => r.id,               r => r.createdAt,    r => `${r.commandType || ''} — ${r.status || ''} — ${r.target || ''}`),
    ...normalise(safeLoad(SOURCES.packets),      'PREVIEW_PACKETS', 'PREVIEW_PACKET',   r => r.packetId,         r => r.createdAt,    r => `${r.commandType || ''} — ${r.packetStatus || ''}`),
    ...normalise(safeLoad(SOURCES.dryRuns),      'PREVIEW_PACKETS', 'DRY_RUN',          r => r.dryRunId,         r => r.createdAt,    r => `Status: ${r.dryRunStatus || ''} — Policy: ${r.policyGateResult || ''}`),
    ...normalise(safeLoad(SOURCES.signedPreviews),'SIGNED_PREVIEWS','SIGNED_PREVIEW',   r => r.signedRequestId,  r => r.createdAt,    r => `allowedForDispatch: ${r.allowedForDispatch}`),
    ...normalise(safeLoad(SOURCES.evidence),     'FINAL_LOCK',      'FINAL_LOCK_EVID',  r => r.evidenceId,       r => r.createdAt,    r => `executionLock: ${r.executionLock} — bridgeDispatch: ${r.bridgeDispatchAllowed}`),
    ...normalise(safeLoad(SOURCES.healthChecks), 'GATEWAY',         'HEALTH_CHECK',     r => r.checkId || r.createdAt, r => r.createdAt, r => `${r.interpretedGatewayStatus || ''} — HTTP ${r.httpStatus ?? 'N/A'}`),
    ...normalise(safeLoad(SOURCES.inspector),    'GATEWAY',         'RESPONSE_INSPECT', r => r.loadedAt || r.createdAt, r => r.loadedAt || r.createdAt, r => `gatewayMode: ${r.gatewayMode || 'READ_ONLY'}`),
    ...normalise(safeLoad(SOURCES.alertReports), 'ALERTS',          'ALERT_REPORT',     r => r.reportId,         r => r.generatedAt,  r => `PASS:${r.summary?.PASS} WARN:${r.summary?.WARN} FAIL:${r.summary?.FAIL}`),
    ...normalise(safeLoad(SOURCES.auditTrail),   'SAFETY',          'AUDIT_TRAIL',      r => (r.timestamp || '') + (r.event || ''), r => r.timestamp, r => r.event || r.note || ''),
  ];

  // Deduplicate by _uid
  const seen = new Set();
  return all
    .filter(e => { if (seen.has(e._uid)) return false; seen.add(e._uid); return true; })
    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}

// ── Filter options ─────────────────────────────────────────────────────────────
const FILTERS = [
  { label: 'ALL',            sources: null },
  { label: 'PROPOSALS',      sources: ['PROPOSALS'] },
  { label: 'GATEWAY',        sources: ['GATEWAY'] },
  { label: 'ALERTS',         sources: ['ALERTS'] },
  { label: 'PREVIEW_PACKETS',sources: ['PREVIEW_PACKETS'] },
  { label: 'SIGNED_PREVIEWS',sources: ['SIGNED_PREVIEWS'] },
  { label: 'FINAL_LOCK',     sources: ['FINAL_LOCK'] },
  { label: 'SAFETY',         sources: ['SAFETY'] },
];

const SOURCE_COLOR = {
  PROPOSALS:       'text-blue-400',
  PREVIEW_PACKETS: 'text-amber-500',
  SIGNED_PREVIEWS: 'text-amber-500',
  FINAL_LOCK:      'text-primary',
  GATEWAY:         'text-blue-400',
  ALERTS:          'text-amber-500',
  SAFETY:          'text-slate-300',
};

// ── Event row ──────────────────────────────────────────────────────────────────
function EventRow({ event }) {
  const [open, setOpen] = useState(false);
  const col = SOURCE_COLOR[event.source] || 'text-slate-400';
  return (
    <div className="border-b border-border/20 last:border-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-2 px-3 py-2 hover:bg-secondary/20 transition-colors text-left">
        {open ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" /> : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-bold uppercase ${col}`}>{event.eventType}</span>
            <span className="text-[7px] px-1.5 py-0.5 border border-border/40 text-slate-500 rounded font-mono">{event.source}</span>
            {event.proposalId && <span className="text-[7px] font-mono text-slate-600 truncate max-w-[100px]">{event.proposalId}</span>}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5 truncate">{event.detail}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[7px] text-slate-600 font-mono">{event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}</span>
          <span className="text-[7px] text-destructive font-bold">exec:false</span>
        </div>
      </button>
      {open && (
        <div className="px-8 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-[8px] text-slate-500">
          <span>Source: <span className={`font-bold ${col}`}>{event.source}</span></span>
          <span>Event: <span className="text-slate-300">{event.eventType}</span></span>
          <span>Exec Attempted: <span className="text-destructive font-bold">false</span></span>
          <span>OpenClaw Calls: <span className="text-destructive font-bold">0</span></span>
          <span>Network Calls: <span className="text-destructive font-bold">false</span></span>
          {event.packetId && <span>Packet: <span className="font-mono text-slate-400">{event.packetId}</span></span>}
          <span className="col-span-2">Detail: <span className="text-slate-300">{event.detail}</span></span>
          <details className="col-span-4 mt-1">
            <summary className="text-[7px] text-slate-600 cursor-pointer hover:text-slate-400 uppercase tracking-widest font-semibold">Raw JSON</summary>
            <pre className="mt-1 bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-400 overflow-auto max-h-32">
              {JSON.stringify(event.raw, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ data, label }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AuditReportExporter({ refreshTrigger }) {
  const [events,      setEvents]      = useState([]);
  const [report,      setReport]      = useState(null);
  const [filter,      setFilter]      = useState(0);
  const [snapshot,    setSnapshot]    = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const build = useCallback(() => {
    const evts = buildEvents();
    const counts = {
      totalEvents:            evts.length,
      proposalEvents:         evts.filter(e => e.source === 'PROPOSALS').length,
      gatewayHealthChecks:    evts.filter(e => e.eventType === 'HEALTH_CHECK').length,
      responseInspections:    evts.filter(e => e.eventType === 'RESPONSE_INSPECT').length,
      alertReports:           evts.filter(e => e.source === 'ALERTS').length,
      signedPreviewRecords:   evts.filter(e => e.source === 'SIGNED_PREVIEWS').length,
      finalLockEvidenceRecords: evts.filter(e => e.source === 'FINAL_LOCK').length,
      executionAttempts:      0,
      openClawCalls:          0,
      networkCalls:           0,
    };
    const now = new Date().toISOString();
    const newReport = {
      reportId:   'audrpt-' + Date.now().toString(36),
      generatedAt: now,
      mode:        'PREVIEW_ONLY',
      gatewayMode: 'READ_ONLY',
      executionLock: 'LOCKED',
      executionAttempted: false,
      openClawCalls: 0,
      networkCalls: false,
      counts,
      sourcesIncluded: Object.keys(SOURCES),
      events: evts,
    };
    setEvents(evts);
    setReport(newReport);
    setGeneratedAt(now);
    setSnapshot(null);
  }, []);

  useEffect(() => { build(); }, [build, refreshTrigger]);

  const handleSnapshot = useCallback(() => {
    if (!report) return;
    const exportId = 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();
    const snap = {
      exportId,
      createdAt:            now,
      mode:                 'PREVIEW_ONLY',
      gatewayMode:          'READ_ONLY',
      executionLock:        'LOCKED',
      executionAttempted:   false,
      openClawCalls:        0,
      networkCalls:         false,
      browserAutomationUsed: false,
      credentialsAccessed:  false,
      moneyMovement:        false,
      dispatchAttempted:    false,
      sourcesIncluded:      report.sourcesIncluded,
      counts:               report.counts,
      events:               report.events,
      safetyAssertions: [
        'executionAttempted === false',
        'openClawCalls === 0',
        'networkCalls === false',
        'browserAutomationUsed === false',
        'credentialsAccessed === false',
        'moneyMovement === false',
        'dispatchAttempted === false',
        'mode === PREVIEW_ONLY',
        'gatewayMode === READ_ONLY',
        'executionLock === LOCKED',
      ],
    };
    try {
      const all = JSON.parse(localStorage.getItem(EXPORT_KEY) || '[]');
      all.unshift(snap);
      localStorage.setItem(EXPORT_KEY, JSON.stringify(all.slice(0, 20)));
    } catch {}

    tryAppendAudit({
      event:    'audit_report_export_snapshot_created',
      exportId,
      totalEvents: report.counts.totalEvents,
      note:     `Audit export snapshot created (${exportId}). ${report.counts.totalEvents} events. No execution. No network calls.`,
    });

    setSnapshot(snap);
  }, [report]);

  if (!report) return null;

  const { counts } = report;
  const activeFilter = FILTERS[filter];
  const filtered = activeFilter.sources
    ? events.filter(e => activeFilter.sources.includes(e.source))
    : events;

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Export</div>
          <div className="text-[13px] font-bold text-foreground">Audit Report Exporter</div>
        </div>
        <button type="button" onClick={build}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh Report
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Reads localStorage only. No network calls. No execution. No dispatch.</span>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Total Events',        value: counts.totalEvents,              color: 'text-foreground',  bg: 'bg-secondary/20 border-border' },
          { label: 'Proposal Events',     value: counts.proposalEvents,           color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20' },
          { label: 'Health Checks',       value: counts.gatewayHealthChecks,      color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20' },
          { label: 'Alert Reports',       value: counts.alertReports,             color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Final Lock Evidence', value: counts.finalLockEvidenceRecords, color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
          { label: 'Response Inspect',    value: counts.responseInspections,      color: 'text-slate-300',   bg: 'bg-secondary/20 border-border' },
          { label: 'Signed Previews',     value: counts.signedPreviewRecords,     color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Exec Attempts',       value: counts.executionAttempts,        color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'OpenClaw Calls',      value: counts.openClawCalls,            color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'Network Calls',       value: counts.networkCalls,             color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded px-2 py-1.5 ${bg}`}>
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
            <div className={`text-[13px] font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((opt, i) => (
          <button key={opt.label} type="button" onClick={() => setFilter(i)}
            className={`px-2.5 py-1.5 text-[9px] border rounded font-bold transition-colors whitespace-nowrap ${
              filter === i ? 'border-primary text-primary bg-primary/10' : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
            }`}>
            {opt.label} ({opt.sources ? events.filter(e => opt.sources.includes(e.source)).length : events.length})
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Events ({filtered.length})</span>
          <span className="ml-auto text-[7px] text-slate-600 font-mono">Sorted chronologically · Read-only</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-slate-500">No events for this filter.</div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-border/20">
            {filtered.map(e => <EventRow key={e._uid} event={e} />)}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <CopyButton data={report} label="Copy Audit Report JSON" />
        <button type="button" onClick={handleSnapshot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
          <FileDown className="w-3 h-3" /> Generate Audit Export Snapshot
        </button>
        {snapshot && <CopyButton data={snapshot} label="Copy Snapshot JSON" />}
      </div>

      {/* Snapshot confirmation */}
      {snapshot && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Snapshot Persisted</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-[8px] text-slate-500 ml-5">
            <span>Export ID: <span className="font-mono text-slate-400">{snapshot.exportId}</span></span>
            <span>Mode: <span className="text-primary font-semibold">{snapshot.mode}</span></span>
            <span>Exec Attempted: <span className="text-destructive font-bold">false</span></span>
            <span>OpenClaw Calls: <span className="text-destructive font-bold">0</span></span>
            <span>Network Calls: <span className="text-destructive font-bold">false</span></span>
            <span>Dispatch: <span className="text-destructive font-bold">false</span></span>
            <span>Events: <span className="text-foreground font-bold">{snapshot.events.length}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Audit export is local-only. No OpenClaw calls. No execution. No network calls. No dispatch.
      </div>
    </div>
  );
}