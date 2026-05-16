/**
 * ProposalLifecycleTimeline
 * Read-only chronological lifecycle timeline built entirely from localStorage evidence.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools
 *   - No credentials / secrets / trading / money movement
 *   - Reads localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback, useEffect } from 'react';
import { GitBranch, CheckCircle2, Copy, RefreshCw, ShieldCheck, Clock, Filter } from 'lucide-react';

// ── localStorage keys ──────────────────────────────────────────────────────────
const KEYS = {
  proposals:    'vc_proposals',
  packets:      'vc_preview_packets',
  dryRuns:      'vc_bridge_dry_runs',
  signed:       'vc_signed_bridge_previews',
  evidence:     'openclawFinalNonExecutionLockEvidence',
  health:       'openclawReadOnlyGatewayHealthChecks',
  inspector:    'openclawGatewayResponseInspector',
  alerts:       'openclawGatewayAlertReports',
  timeline:     'openclawProposalLifecycleTimelineReports',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch { return []; }
}

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

// ── Stage config ───────────────────────────────────────────────────────────────
const STAGE_ORDER = [
  'CREATED', 'SUBMITTED_FOR_REVIEW', 'APPROVED_FOR_PREVIEW',
  'PREVIEW_PACKET_GENERATED', 'READY_FOR_BRIDGE_TEST',
  'DRY_RUN_PASSED', 'DRY_RUN_FAILED',
  'SIGNED_REQUEST_PREVIEW_GENERATED', 'FINAL_NON_EXECUTION_LOCK_RECORDED',
  'GATEWAY_HEALTH_CHECKED', 'RESPONSE_INSPECTED', 'ALERT_REPORT_GENERATED',
];

const STAGE_COLORS = {
  CREATED:                           'text-slate-400  border-slate-500/30 bg-slate-500/5',
  SUBMITTED_FOR_REVIEW:              'text-amber-500  border-amber-500/30 bg-amber-500/5',
  APPROVED_FOR_PREVIEW:              'text-primary    border-primary/30   bg-primary/5',
  PREVIEW_PACKET_GENERATED:          'text-blue-400   border-blue-400/30  bg-blue-400/5',
  READY_FOR_BRIDGE_TEST:             'text-blue-400   border-blue-400/30  bg-blue-400/5',
  DRY_RUN_PASSED:                    'text-primary    border-primary/30   bg-primary/5',
  DRY_RUN_FAILED:                    'text-destructive border-destructive/30 bg-destructive/5',
  SIGNED_REQUEST_PREVIEW_GENERATED:  'text-amber-500  border-amber-500/30 bg-amber-500/5',
  FINAL_NON_EXECUTION_LOCK_RECORDED: 'text-primary    border-primary/30   bg-primary/5',
  GATEWAY_HEALTH_CHECKED:            'text-blue-400   border-blue-400/30  bg-blue-400/5',
  RESPONSE_INSPECTED:                'text-slate-300  border-slate-500/30 bg-slate-500/5',
  ALERT_REPORT_GENERATED:            'text-amber-500  border-amber-500/30 bg-amber-500/5',
};

const FILTER_OPTIONS = [
  { label: 'All',                  stages: null },
  { label: 'Approved',             stages: ['APPROVED_FOR_PREVIEW'] },
  { label: 'Pending Approval',     stages: ['SUBMITTED_FOR_REVIEW'] },
  { label: 'Ready for Bridge Test',stages: ['READY_FOR_BRIDGE_TEST'] },
  { label: 'Dry Run Passed',       stages: ['DRY_RUN_PASSED'] },
  { label: 'Signed Preview',       stages: ['SIGNED_REQUEST_PREVIEW_GENERATED'] },
  { label: 'Final Lock',           stages: ['FINAL_NON_EXECUTION_LOCK_RECORDED'] },
  { label: 'Gateway Health',       stages: ['GATEWAY_HEALTH_CHECKED', 'RESPONSE_INSPECTED'] },
  { label: 'Alerts',               stages: ['ALERT_REPORT_GENERATED'] },
];

// ── Build timeline events ──────────────────────────────────────────────────────
function buildTimeline() {
  const events = [];

  // Proposals
  for (const p of load(KEYS.proposals)) {
    const base = {
      proposalId: p.id,
      riskTier:   p.riskTier || 'LOW',
      safetyMode: p.safetyMode || 'PREVIEW_ONLY',
      executionAttempted: false,
      openClawCalls: 0,
    };
    events.push({ ...base, stage: 'CREATED',             ts: p.createdAt,   source: 'proposals',   id: `prop-created-${p.id}`,   commandType: p.commandType, target: p.target });
    if (['PENDING_APPROVAL','APPROVED','DENIED','QUEUED_PREVIEW','BLOCKED_PREVIEW','READY_FOR_BRIDGE_TEST'].includes(p.status))
      events.push({ ...base, stage: 'SUBMITTED_FOR_REVIEW', ts: p.createdAt, source: 'proposals', id: `prop-submitted-${p.id}`, reviewedBy: p.reviewedBy });
    if (['APPROVED','QUEUED_PREVIEW','READY_FOR_BRIDGE_TEST'].includes(p.status))
      events.push({ ...base, stage: 'APPROVED_FOR_PREVIEW', ts: p.reviewedAt || p.createdAt, source: 'proposals', id: `prop-approved-${p.id}`, reviewedBy: p.reviewedBy, reviewNote: p.reviewNote });
  }

  // Preview packets
  for (const pk of load(KEYS.packets)) {
    const base = { proposalId: pk.proposalId, riskTier: pk.riskTier, safetyMode: pk.safetyMode || 'PREVIEW_ONLY', executionAttempted: false, openClawCalls: 0, evidenceId: pk.packetId };
    events.push({ ...base, stage: 'PREVIEW_PACKET_GENERATED', ts: pk.createdAt, source: 'packets', id: `pkt-gen-${pk.packetId}`, commandType: pk.commandType });
    if (pk.packetStatus === 'READY_FOR_BRIDGE_TEST')
      events.push({ ...base, stage: 'READY_FOR_BRIDGE_TEST', ts: pk.createdAt, source: 'packets', id: `pkt-ready-${pk.packetId}` });
  }

  // Dry runs
  for (const dr of load(KEYS.dryRuns)) {
    events.push({
      proposalId: dr.proposalId, riskTier: dr.riskTier, safetyMode: 'PREVIEW_ONLY',
      executionAttempted: false, openClawCalls: 0,
      stage: dr.dryRunStatus === 'PASSED' ? 'DRY_RUN_PASSED' : 'DRY_RUN_FAILED',
      ts: dr.createdAt, source: 'dryRuns', id: `dr-${dr.dryRunId}`,
      evidenceId: dr.dryRunId, auditRecordId: dr.auditRecordId || null,
    });
  }

  // Signed bridge previews
  for (const sp of load(KEYS.signed)) {
    events.push({
      proposalId: sp.proposalId, riskTier: sp.riskTier, safetyMode: sp.safetyMode || 'PREVIEW_ONLY',
      executionAttempted: false, openClawCalls: 0,
      stage: 'SIGNED_REQUEST_PREVIEW_GENERATED',
      ts: sp.createdAt, source: 'signedPreviews', id: `sp-${sp.signedRequestId}`,
      evidenceId: sp.signedRequestId, allowedForDispatch: false,
    });
  }

  // Final lock evidence
  for (const ev of load(KEYS.evidence)) {
    events.push({
      proposalId: ev.proposalId, riskTier: null, safetyMode: 'PREVIEW_ONLY',
      executionAttempted: false, openClawCalls: 0,
      stage: 'FINAL_NON_EXECUTION_LOCK_RECORDED',
      ts: ev.createdAt, source: 'evidence', id: `evid-${ev.evidenceId}`,
      evidenceId: ev.evidenceId, executionLock: 'LOCKED',
    });
  }

  // Gateway health checks
  for (const hc of load(KEYS.health)) {
    events.push({
      proposalId: null, riskTier: null, safetyMode: 'PREVIEW_ONLY',
      executionAttempted: false, openClawCalls: 0,
      stage: 'GATEWAY_HEALTH_CHECKED',
      ts: hc.createdAt, source: 'healthChecks', id: `hc-${hc.checkId || hc.createdAt}`,
      evidenceId: hc.checkId || null, httpStatus: hc.httpStatus, gatewayStatus: hc.interpretedGatewayStatus,
    });
  }

  // Response inspector
  const inspector = load(KEYS.inspector);
  for (const ri of inspector) {
    events.push({
      proposalId: null, riskTier: null, safetyMode: 'PREVIEW_ONLY',
      executionAttempted: false, openClawCalls: 0,
      stage: 'RESPONSE_INSPECTED',
      ts: ri.loadedAt || ri.createdAt, source: 'inspector', id: `ri-${ri.loadedAt || ri.createdAt}`,
    });
  }

  // Alert reports
  for (const ar of load(KEYS.alerts)) {
    events.push({
      proposalId: null, riskTier: null, safetyMode: 'PREVIEW_ONLY',
      executionAttempted: false, openClawCalls: 0,
      stage: 'ALERT_REPORT_GENERATED',
      ts: ar.generatedAt, source: 'alertReports', id: `ar-${ar.reportId}`,
      evidenceId: ar.reportId, summary: ar.summary,
    });
  }

  // Deduplicate by id
  const seen = new Set();
  const deduped = events.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });

  // Sort chronologically
  return deduped.sort((a, b) => new Date(a.ts || 0) - new Date(b.ts || 0));
}

// ── Timeline event row ─────────────────────────────────────────────────────────
function TimelineEvent({ event, isLast }) {
  const colorCls = STAGE_COLORS[event.stage] || 'text-slate-400 border-slate-500/30 bg-slate-500/5';
  const [textColor, borderBg] = colorCls.split('  ');

  return (
    <div className="flex gap-3">
      {/* Spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full border-2 mt-1 shrink-0 ${borderBg}`} />
        {!isLast && <div className="w-px flex-1 bg-border/40 mt-1" />}
      </div>

      {/* Content */}
      <div className={`mb-3 flex-1 border rounded-lg px-3 py-2.5 ${borderBg}`}>
        <div className="flex items-start gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${textColor}`}>{event.stage.replace(/_/g, ' ')}</span>
          {event.proposalId && (
            <span className="text-[7px] font-mono text-slate-500 bg-secondary/40 px-1.5 py-0.5 rounded truncate max-w-[120px]">{event.proposalId}</span>
          )}
          {event.riskTier && (
            <span className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded border ${event.riskTier === 'HIGH' ? 'text-destructive border-destructive/30' : event.riskTier === 'MEDIUM' ? 'text-amber-500 border-amber-500/30' : 'text-primary border-primary/30'}`}>{event.riskTier}</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 mt-1.5 text-[8px] text-slate-500">
          {event.ts && <span><Clock className="w-2.5 h-2.5 inline mr-1" />{new Date(event.ts).toLocaleString()}</span>}
          <span>Source: <span className="text-slate-400">{event.source}</span></span>
          <span>Safety: <span className="text-primary font-semibold">{event.safetyMode || 'PREVIEW_ONLY'}</span></span>
          <span>Exec Attempted: <span className="text-destructive font-bold">false</span></span>
          <span>OpenClaw Calls: <span className="text-destructive font-bold">0</span></span>
          {event.executionLock && <span>Exec Lock: <span className="text-primary font-bold">{event.executionLock}</span></span>}
          {event.commandType && <span>Cmd: <span className="text-slate-300">{event.commandType}</span></span>}
          {event.httpStatus !== undefined && <span>HTTP: <span className="text-slate-300">{event.httpStatus}</span></span>}
          {event.gatewayStatus && <span>Gateway: <span className="text-amber-500">{event.gatewayStatus}</span></span>}
          {event.evidenceId && <span className="col-span-2 truncate">Evidence ID: <span className="text-slate-400 font-mono">{event.evidenceId}</span></span>}
          {event.auditRecordId && <span className="col-span-2 truncate">Audit ID: <span className="text-slate-400 font-mono">{event.auditRecordId}</span></span>}
          {event.reviewedBy && <span>Reviewed by: <span className="text-slate-300">{event.reviewedBy}</span></span>}
          {event.summary && <span className="col-span-2">Alerts: P:{event.summary.PASS} I:{event.summary.INFO} W:{event.summary.WARN} F:{event.summary.FAIL}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ report }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(JSON.stringify(report, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Timeline JSON'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProposalLifecycleTimeline({ refreshTrigger }) {
  const [events,     setEvents]     = useState([]);
  const [report,     setReport]     = useState(null);
  const [filter,     setFilter]     = useState(0); // index into FILTER_OPTIONS
  const [generatedAt, setGeneratedAt] = useState(null);

  const generate = useCallback(() => {
    const timeline = buildTimeline();
    const now = new Date().toISOString();
    const reportId = 'tl-' + Date.now().toString(36);

    const proposalIds = [...new Set(timeline.map(e => e.proposalId).filter(Boolean))];
    const approvedIds = [...new Set(
      timeline.filter(e => e.stage === 'APPROVED_FOR_PREVIEW').map(e => e.proposalId).filter(Boolean)
    )];
    const finalLocks  = timeline.filter(e => e.stage === 'FINAL_NON_EXECUTION_LOCK_RECORDED').length;

    const newReport = {
      reportId,
      generatedAt:             now,
      mode:                    'PREVIEW_ONLY',
      gatewayMode:             'READ_ONLY',
      executionLocked:         true,
      executionAttempted:      false,
      openClawCalls:           0,
      networkCalls:            false,
      browserAutomation:       false,
      summary: {
        totalEvents:           timeline.length,
        proposalsRepresented:  proposalIds.length,
        approvedProposals:     approvedIds.length,
        finalLockEvidenceCount: finalLocks,
        executionAttempted:    0,
        openClawCallCount:     0,
      },
      events: timeline,
    };

    // Persist
    try {
      const all = JSON.parse(localStorage.getItem(KEYS.timeline) || '[]');
      all.unshift(newReport);
      localStorage.setItem(KEYS.timeline, JSON.stringify(all.slice(0, 20)));
    } catch {}

    tryAppendAudit({
      event:     'proposal_lifecycle_timeline_generated',
      reportId,
      totalEvents: timeline.length,
      note:      `Lifecycle timeline generated (${reportId}). ${timeline.length} events. No execution. No network calls.`,
    });

    setEvents(timeline);
    setReport(newReport);
    setGeneratedAt(now);
  }, []);

  useEffect(() => { generate(); }, [generate, refreshTrigger]);

  if (!report) return null;

  const { summary } = report;
  const activeFilter = FILTER_OPTIONS[filter];
  const filtered = activeFilter.stages
    ? events.filter(e => activeFilter.stages.includes(e.stage))
    : events;

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Lifecycle</div>
          <div className="text-[13px] font-bold text-foreground">Proposal Lifecycle Timeline</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Reads localStorage only. No network calls. No execution.</span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total Events',       value: summary.totalEvents,            color: 'text-foreground',  bg: 'bg-secondary/20 border-border' },
          { label: 'Proposals',          value: summary.proposalsRepresented,   color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20' },
          { label: 'Approved',           value: summary.approvedProposals,      color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
          { label: 'Final Locks',        value: summary.finalLockEvidenceCount, color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
          { label: 'Exec Attempted',     value: summary.executionAttempted,     color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'OpenClaw Calls',     value: summary.openClawCallCount,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded px-2 py-1.5 ${bg}`}>
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
            <div className={`text-[14px] font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt, i) => (
          <button key={opt.label} type="button" onClick={() => setFilter(i)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] border rounded font-bold transition-colors whitespace-nowrap ${
              filter === i ? 'border-primary text-primary bg-primary/10' : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
            }`}>
            {i === 0 && <Filter className="w-2.5 h-2.5" />} {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-500 bg-secondary/5 border border-border/30 rounded-lg">
          {events.length === 0 ? 'No lifecycle events found. Run health checks and create proposals to populate timeline.' : `No events for filter: ${activeFilter.label}`}
        </div>
      ) : (
        <div className="pl-1 pt-1">
          {filtered.map((ev, i) => (
            <TimelineEvent key={ev.id} event={ev} isLast={i === filtered.length - 1} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <CopyButton report={report} />
        {generatedAt && (
          <span className="text-[7px] text-slate-600 font-mono ml-auto">Generated: {new Date(generatedAt).toLocaleString()}</span>
        )}
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Read-only lifecycle timeline only. Local evidence inspection. No network calls. No OpenClaw dispatch. No execution.
      </div>
    </div>
  );
}