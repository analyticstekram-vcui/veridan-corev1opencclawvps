import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ChevronDown, ChevronRight, ShieldAlert, Eye } from 'lucide-react';
import { format } from 'date-fns';

const REVIEW_OPTIONS = [
  { value: 'UNREVIEWED', label: 'Unreviewed', color: 'text-amber-500 border-amber-500/40 bg-amber-500/10' },
  { value: 'REVIEWED_SAFE_HISTORICAL', label: 'Safe Historical', color: 'text-primary border-primary/40 bg-primary/10' },
  { value: 'REVIEWED_POLICY_EXCEPTION', label: 'Policy Exception', color: 'text-blue-400 border-blue-400/40 bg-blue-400/10' },
  { value: 'REVIEWED_REQUIRES_INVESTIGATION', label: 'Requires Investigation', color: 'text-destructive border-destructive/40 bg-destructive/10' },
];

const FILTERS = ['ALL', 'UNREVIEWED', 'REVIEWED_SAFE_HISTORICAL', 'REVIEWED_POLICY_EXCEPTION', 'REVIEWED_REQUIRES_INVESTIGATION', 'REAL', 'LIVE'];

function ReviewBadge({ mode }) {
  if (mode === 'REAL') return (
    <span className="text-[9px] px-1.5 py-0.5 border border-destructive/50 bg-destructive/10 text-destructive font-semibold uppercase tracking-wider">
      LEGACY_REAL_EXECUTION_RECORD
    </span>
  );
  if (mode === 'LIVE') return (
    <span className="text-[9px] px-1.5 py-0.5 border border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold uppercase tracking-wider">
      LEGACY_LIVE_EXECUTION_RECORD
    </span>
  );
  return null;
}

function CommandReviewCard({ command, localReview, onReviewChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const review = localReview || { status: 'UNREVIEWED', reviewNote: '', reviewedBy: '', reviewedAt: null };
  const reviewOpt = REVIEW_OPTIONS.find(r => r.value === review.status) || REVIEW_OPTIONS[0];

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'yyyy-MM-dd HH:mm:ss'); } catch { return d; }
  };

  return (
    <div className="border border-border/40 bg-card mb-2">
      {/* Summary row */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <ReviewBadge mode={command.executionMode} />
              <span className={`text-[9px] px-1.5 py-0.5 border rounded font-semibold ${reviewOpt.color}`}>{reviewOpt.label}</span>
            </div>
            <div className="text-[11px] text-foreground font-mono truncate">{command.commandType || '—'}</div>
            <div className="text-[9px] text-blue-400 font-mono truncate">{command.targetUrl || '—'}</div>
          </div>
        </div>
        <div className="shrink-0 text-right space-y-1">
          <div className="text-[9px] text-muted-foreground/50 font-mono">{command.id?.slice(0, 12)}…</div>
          <div className={`text-[9px] font-semibold ${command.status === 'executed' ? 'text-primary' : command.status === 'failed' ? 'text-destructive' : 'text-amber-500'}`}>
            {command.status?.toUpperCase() || '—'}
          </div>
          <div className="text-[9px] text-muted-foreground/40">{fmtDate(command.executedAt)}</div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-4 space-y-4">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
            {[
              ['Command Type', command.commandType],
              ['Execution Mode', command.executionMode],
              ['Status', command.status?.toUpperCase()],
              ['Risk Level', command.riskLevel?.toUpperCase()],
              ['Approved By', command.approvedBy],
              ['Approved At', fmtDate(command.approvedAt)],
              ['Executed At', fmtDate(command.executedAt)],
              ['Created', fmtDate(command.created_date)],
              ['Updated', fmtDate(command.updated_date)],
            ].map(([k, v]) => (
              <div key={k} className="bg-secondary/30 border border-border/40 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">{k}</div>
                <div className="font-mono text-foreground/80 truncate">{v || '—'}</div>
              </div>
            ))}
            {command.targetUrl && (
              <div className="col-span-2 md:col-span-3 bg-secondary/30 border border-border/40 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Target URL</div>
                <div className="font-mono text-blue-400 break-all text-[9px]">{command.targetUrl}</div>
              </div>
            )}
            {(command.result?.summary || command.resultSummary) && (
              <div className="col-span-2 md:col-span-3 bg-secondary/30 border border-border/40 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Result Summary</div>
                <div className="font-mono text-foreground/70 text-[9px]">{command.result?.summary || command.resultSummary}</div>
              </div>
            )}
            {command.error && (
              <div className="col-span-2 md:col-span-3 bg-destructive/5 border border-destructive/20 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-destructive/50 mb-0.5">Error</div>
                <div className="font-mono text-destructive text-[9px] break-all">{command.error}</div>
              </div>
            )}
          </div>

          {/* Collapsible: Audit Log */}
          <div className="border border-border/30">
            <button
              type="button"
              onClick={() => setShowAudit(!showAudit)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              {showAudit ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Audit Log ({Array.isArray(command.auditLog) ? command.auditLog.length : 0} entries)
            </button>
            {showAudit && (
              <div className="border-t border-border/20 px-3 py-2 max-h-48 overflow-auto">
                {Array.isArray(command.auditLog) && command.auditLog.length > 0 ? (
                  command.auditLog.map((entry, i) => (
                    <div key={i} className="text-[8px] font-mono text-muted-foreground/60 py-0.5 border-b border-border/10 last:border-0">
                      <span className="text-muted-foreground/40 mr-2">{fmtDate(entry.timestamp)}</span>
                      <span className="text-foreground/60">{entry.eventType || JSON.stringify(entry)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[9px] text-muted-foreground/30">No audit entries</div>
                )}
              </div>
            )}
          </div>

          {/* Collapsible: Full JSON */}
          <div className="border border-border/30">
            <button
              type="button"
              onClick={() => setShowJson(!showJson)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              {showJson ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Full Command JSON
            </button>
            {showJson && (
              <div className="border-t border-border/20 px-3 py-2 max-h-64 overflow-auto">
                <pre className="text-[8px] font-mono text-muted-foreground/60 whitespace-pre-wrap break-words">
                  {JSON.stringify(command, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* ── Review Controls (local UI only — NOT persisted) ── */}
          <div className="border border-amber-500/20 bg-amber-500/5 p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Operator Review</span>
              <span className="text-[8px] text-amber-500/60 border border-amber-500/30 px-1.5 py-0.5 ml-auto">UI-ONLY · NOT PERSISTED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Review Status</label>
                <select
                  value={review.status}
                  onChange={e => onReviewChange(command.id, { ...review, status: e.target.value })}
                  className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50"
                >
                  {REVIEW_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Reviewed By</label>
                <input
                  type="text"
                  value={review.reviewedBy}
                  onChange={e => onReviewChange(command.id, { ...review, reviewedBy: e.target.value, reviewedAt: new Date().toISOString() })}
                  placeholder="operator email"
                  className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Review Note</label>
              <textarea
                value={review.reviewNote}
                onChange={e => onReviewChange(command.id, { ...review, reviewNote: e.target.value })}
                placeholder="Add operator review notes here..."
                rows={2}
                className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 resize-none"
              />
            </div>

            {review.reviewedAt && (
              <div className="text-[8px] text-muted-foreground/40 font-mono">
                Reviewed at: {fmtDate(review.reviewedAt)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LegacyExecutionReviewPanel() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  // Local-only review state — not persisted to DB
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const fetchLegacy = async () => {
      setLoading(true);
      try {
        const all = await base44.entities.OpenClawCommand.list('-created_date', 500);
        const legacy = all.filter(c => c.executionMode === 'REAL' || c.executionMode === 'LIVE');
        setCommands(legacy);
      } catch (err) {
        console.error('LegacyExecutionReviewPanel fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLegacy();
  }, []);

  const handleReviewChange = (id, review) => {
    setReviews(prev => ({ ...prev, [id]: review }));
  };

  const getReviewStatus = (id) => reviews[id]?.status || 'UNREVIEWED';

  const counters = {
    total: commands.length,
    unreviewed: commands.filter(c => getReviewStatus(c.id) === 'UNREVIEWED').length,
    safeHistorical: commands.filter(c => getReviewStatus(c.id) === 'REVIEWED_SAFE_HISTORICAL').length,
    policyException: commands.filter(c => getReviewStatus(c.id) === 'REVIEWED_POLICY_EXCEPTION').length,
    requiresInvestigation: commands.filter(c => getReviewStatus(c.id) === 'REVIEWED_REQUIRES_INVESTIGATION').length,
  };

  const filtered = commands.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'REAL') return c.executionMode === 'REAL';
    if (filter === 'LIVE') return c.executionMode === 'LIVE';
    return getReviewStatus(c.id) === filter;
  });

  return (
    <div className="space-y-4 font-mono">

      {/* Warning banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/30">
        <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-semibold text-destructive mb-0.5 uppercase tracking-wider">
            Legacy Execution Records — Audit Review Only
          </div>
          <div className="text-[10px] text-destructive/70">
            These records have <span className="font-semibold">executionMode = REAL or LIVE</span>. They are preserved for audit purposes.
            Review does not change execution facts, delete records, rerun commands, or enable live execution.
          </div>
        </div>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Legacy Total</div>
          <div className="text-[14px] font-semibold text-foreground">{counters.total}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2">
          <div className="text-[8px] uppercase tracking-widest text-amber-500/50 mb-1">Unreviewed</div>
          <div className="text-[14px] font-semibold text-amber-500">{counters.unreviewed}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2">
          <div className="text-[8px] uppercase tracking-widest text-primary/50 mb-1">Safe Historical</div>
          <div className="text-[14px] font-semibold text-primary">{counters.safeHistorical}</div>
        </div>
        <div className="bg-blue-400/5 border border-blue-400/20 px-3 py-2">
          <div className="text-[8px] uppercase tracking-widest text-blue-400/50 mb-1">Policy Exception</div>
          <div className="text-[14px] font-semibold text-blue-400">{counters.policyException}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2">
          <div className="text-[8px] uppercase tracking-widest text-destructive/50 mb-1">Requires Investigation</div>
          <div className="text-[14px] font-semibold text-destructive">{counters.requiresInvestigation}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[9px] border transition-colors whitespace-nowrap ${
              filter === f
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Records list */}
      <div>
        {loading ? (
          <div className="py-12 text-center text-[11px] text-muted-foreground/40">Loading legacy records…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-muted-foreground/40">
            {commands.length === 0
              ? 'No REAL or LIVE execution records found.'
              : `No records match filter: ${filter}`}
          </div>
        ) : (
          filtered.map(cmd => (
            <CommandReviewCard
              key={cmd.id}
              command={cmd}
              localReview={reviews[cmd.id]}
              onReviewChange={handleReviewChange}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/30 text-[9px] text-muted-foreground/50">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500/50" />
        <div>
          Legacy review preserves audit history. It does not modify execution facts, delete records, rerun commands, or enable live execution.
          Review status and notes are <span className="text-amber-500/70 font-semibold">local session only</span> and are not persisted to the database.
        </div>
      </div>
    </div>
  );
}