import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ChevronDown, ChevronRight, ShieldAlert, Eye, Save, CheckCircle2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const REVIEW_OPTIONS = [
  { value: 'UNREVIEWED', label: 'Unreviewed', color: 'text-amber-500 border-amber-500/40 bg-amber-500/10' },
  { value: 'REVIEWED_SAFE_HISTORICAL', label: 'Safe Historical', color: 'text-primary border-primary/40 bg-primary/10' },
  { value: 'REVIEWED_POLICY_EXCEPTION', label: 'Policy Exception', color: 'text-blue-400 border-blue-400/40 bg-blue-400/10' },
  { value: 'REVIEWED_REQUIRES_INVESTIGATION', label: 'Requires Investigation', color: 'text-destructive border-destructive/40 bg-destructive/10' },
];

// Only the 3 actionable review statuses (excludes UNREVIEWED)
const ACTIONABLE_REVIEW_OPTIONS = REVIEW_OPTIONS.filter(o => o.value !== 'UNREVIEWED');

const FILTERS = ['ALL', 'UNREVIEWED', 'REVIEWED_SAFE_HISTORICAL', 'REVIEWED_POLICY_EXCEPTION', 'REVIEWED_REQUIRES_INVESTIGATION', 'REAL', 'LIVE'];

// Redact sensitive fields from a snapshot object
const SENSITIVE_PATTERN = /token|key|secret|password|credential|auth|bearer|hmac/i;

function redactSnapshot(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSnapshot);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_PATTERN.test(k)) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redactSnapshot(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function buildSnapshot(command) {
  const safe = {
    commandId: command.id,
    commandType: command.commandType,
    executionMode: command.executionMode,
    status: command.status,
    riskLevel: command.riskLevel,
    targetUrl: command.targetUrl,
    approvedBy: command.approvedBy,
    approvedAt: command.approvedAt,
    executedAt: command.executedAt,
    created_date: command.created_date,
    resultSummary: command.result?.summary || command.resultSummary || null,
    error: command.error || null,
    auditLogLength: Array.isArray(command.auditLog) ? command.auditLog.length : 0,
  };
  return redactSnapshot(safe);
}

function ReviewBadge({ mode }) {
  if (mode === 'REAL') return (
    <span className="text-[9px] px-1.5 py-0.5 border border-destructive/50 bg-destructive/10 text-destructive font-semibold uppercase tracking-wider">
      LEGACY_REAL
    </span>
  );
  if (mode === 'LIVE') return (
    <span className="text-[9px] px-1.5 py-0.5 border border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold uppercase tracking-wider">
      LEGACY_LIVE
    </span>
  );
  return null;
}

function CommandReviewCard({ command, savedReview, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(savedReview?.reviewStatus || 'UNREVIEWED');
  const [reviewer, setReviewer] = useState(savedReview?.reviewer || '');
  const [reviewNote, setReviewNote] = useState(savedReview?.reviewNote || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync if savedReview changes from parent
  useEffect(() => {
    if (savedReview) {
      setReviewStatus(savedReview.reviewStatus || 'UNREVIEWED');
      setReviewer(savedReview.reviewer || '');
      setReviewNote(savedReview.reviewNote || '');
    }
  }, [savedReview?.id]);

  const reviewOpt = REVIEW_OPTIONS.find(r => r.value === reviewStatus) || REVIEW_OPTIONS[0];

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'yyyy-MM-dd HH:mm:ss'); } catch { return d; }
  };

  const handleSave = async (overrideStatus) => {
    const statusToSave = overrideStatus || reviewStatus;
    if (!statusToSave || statusToSave === 'UNREVIEWED') return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        commandId: command.id,
        legacyRecordId: command.id,
        executionMode: command.executionMode,
        commandType: command.commandType,
        originalStatus: command.status,
        reviewStatus: statusToSave,
        reviewer,
        reviewNote,
        reviewedAt: now,
        auditTraceId: command.id?.slice(0, 12),
        sourceSnapshot: buildSnapshot(command),
      };

      if (savedReview?.id) {
        await base44.entities.OpenClawLegacyReview.update(savedReview.id, payload);
      } else {
        payload.createdAt = now;
        await base44.entities.OpenClawLegacyReview.create(payload);
      }

      if (overrideStatus) setReviewStatus(overrideStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = reviewStatus !== (savedReview?.reviewStatus || 'UNREVIEWED') ||
                  reviewer !== (savedReview?.reviewer || '') ||
                  reviewNote !== (savedReview?.reviewNote || '');

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
              {savedReview?.reviewedAt && (
                <span className="text-[8px] text-primary/60 border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-mono">
                  ✓ saved {fmtDate(savedReview.reviewedAt).slice(0, 10)}
                  {savedReview.reviewer ? ` · ${savedReview.reviewer}` : ''}
                </span>
              )}
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
            {command.error && (
              <div className="col-span-2 md:col-span-3 bg-destructive/5 border border-destructive/20 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-destructive/50 mb-0.5">Error</div>
                <div className="font-mono text-destructive text-[9px] break-all">{command.error}</div>
              </div>
            )}
          </div>

          {/* Collapsible: Audit Log */}
          <div className="border border-border/30">
            <button type="button" onClick={() => setShowAudit(!showAudit)}
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
                      <span className="text-muted-foreground/40 mr-2">{entry.timestamp ? format(new Date(entry.timestamp), 'HH:mm:ss') : '—'}</span>
                      <span className="text-foreground/60">{entry.eventType || JSON.stringify(entry)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[9px] text-muted-foreground/30">No audit entries</div>
                )}
              </div>
            )}
          </div>

          {/* Collapsible: Full JSON (redacted snapshot) */}
          <div className="border border-border/30">
            <button type="button" onClick={() => setShowJson(!showJson)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              {showJson ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Safe Metadata Snapshot (Redacted)
            </button>
            {showJson && (
              <div className="border-t border-border/20 px-3 py-2 max-h-64 overflow-auto">
                <div className="text-[8px] text-amber-500/60 mb-1">Sensitive fields (token/key/secret/password/credential/auth/bearer/hmac) are redacted.</div>
                <pre className="text-[8px] font-mono text-muted-foreground/60 whitespace-pre-wrap break-words">
                  {JSON.stringify(buildSnapshot(command), null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* ── Review Controls — persisted to OpenClawLegacyReview ── */}
          <div className="border border-primary/20 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Operator Review</span>
              <span className="text-[8px] text-primary/50 border border-primary/20 px-1.5 py-0.5 ml-auto">PERSISTED · AUDIT-ONLY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Review Status</label>
                <select
                  value={reviewStatus === 'UNREVIEWED' ? '' : reviewStatus}
                  onChange={e => setReviewStatus(e.target.value)}
                  className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50"
                >
                  <option value="" disabled>— select classification —</option>
                  {ACTIONABLE_REVIEW_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Reviewer</label>
                <input
                  type="text"
                  value={reviewer}
                  onChange={e => setReviewer(e.target.value)}
                  placeholder="operator email or identifier"
                  className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Review Note</label>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add operator review rationale..."
                rows={2}
                className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 resize-none"
              />
            </div>

            {savedReview?.reviewedAt && (
              <div className="text-[8px] text-muted-foreground/40 font-mono">
                Last saved: {fmtDate(savedReview.reviewedAt)} {savedReview.reviewer ? `by ${savedReview.reviewer}` : ''}
              </div>
            )}

            {/* Quick-classify buttons — set status AND persist in one action */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {ACTIONABLE_REVIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(opt.value)}
                  className={`px-2.5 py-1 text-[9px] border transition-colors disabled:opacity-50 ${reviewStatus === opt.value && savedReview?.reviewStatus === opt.value ? opt.color : 'border-border text-muted-foreground hover:bg-secondary/50'}`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || reviewStatus === 'UNREVIEWED'}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[9px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Review'}
              </button>
            </div>
            {reviewStatus === 'UNREVIEWED' && (
              <div className="text-[8px] text-amber-500/70 mt-1">Select a classification above before saving.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LegacyExecutionReviewPanel() {
  const [commands, setCommands] = useState([]);
  const [savedReviews, setSavedReviews] = useState({}); // keyed by commandId
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allCmds, allReviews] = await Promise.all([
        base44.entities.OpenClawCommand.list('-created_date', 500),
        base44.entities.OpenClawLegacyReview.list('-reviewedAt', 500),
      ]);
      const legacy = allCmds.filter(c => c.executionMode === 'REAL' || c.executionMode === 'LIVE');
      setCommands(legacy);
      // Build lookup by commandId (latest review wins)
      const reviewMap = {};
      for (const r of allReviews) {
        if (r.commandId) reviewMap[r.commandId] = r;
      }
      setSavedReviews(reviewMap);
    } catch (err) {
      console.error('LegacyExecutionReviewPanel fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getReviewStatus = (id) => savedReviews[id]?.reviewStatus || 'UNREVIEWED';

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

      {/* ── Completion banner (shown when all reviewed) ── */}
      {!loading && counters.total > 0 && counters.unreviewed === 0 && (
        <div className="border border-primary/50 bg-primary/10 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">LEGACY_REVIEW_COMPLETE</span>
          </div>
          <div className="text-[10px] text-primary/80">
            All {counters.total} legacy record{counters.total !== 1 ? 's' : ''} have been classified and saved to <span className="font-semibold">OpenClawLegacyReview</span>.
            Original command records are preserved and unmodified. You may now proceed to the Production Checklist.
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('openclaw:navigate', { detail: 'production_checklist' }))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[9px] font-semibold hover:bg-primary/90 transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            Go to Production Checklist
          </button>
        </div>
      )}

      {/* ── Next Action block ── */}
      {(loading || counters.unreviewed > 0) && (
        <div className="border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
          <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">Next Operational Step</div>
          <ol className="space-y-1 text-[10px] text-foreground/80 list-none">
            <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">1.</span> Expand each legacy record below to inspect its payload, audit log, and execution metadata.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">2.</span> Use the quick-classify buttons (<span className="text-primary">Safe Historical</span>, <span className="text-blue-400">Policy Exception</span>, <span className="text-destructive">Requires Investigation</span>) or the dropdown to select a classification.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">3.</span> Add a reviewer identifier and note, then click <span className="text-foreground font-semibold">Save Review</span>. The review is persisted to <span className="text-primary">OpenClawLegacyReview</span> — the original <span className="text-foreground">OpenClawCommand</span> record is never modified.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">4.</span> Once all {counters.total} record{counters.total !== 1 ? 's' : ''} show a saved classification, the <span className="text-foreground font-semibold">LEGACY_REVIEW_COMPLETE</span> banner will appear and you can proceed to Production Checklist.</li>
          </ol>
          <div className="text-[9px] text-amber-500/70 border-t border-primary/20 pt-2 mt-1">
            {counters.unreviewed} of {counters.total} record{counters.total !== 1 ? 's' : ''} still unreviewed
          </div>
        </div>
      )}

      {/* Warning banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/30">
        <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-semibold text-destructive mb-0.5 uppercase tracking-wider">
            Legacy Execution Records — Audit Review Only
          </div>
          <div className="text-[10px] text-destructive/70">
            These records have <span className="font-semibold">executionMode = REAL or LIVE</span>. They are preserved for audit.
            Review does not change execution facts, delete records, rerun commands, or enable live execution.
          </div>
        </div>
      </div>

      {/* Latest review timestamp */}
      {Object.values(savedReviews).length > 0 && (() => {
        const latest = Object.values(savedReviews).reduce((a, b) =>
          (a.reviewedAt || '') > (b.reviewedAt || '') ? a : b
        );
        return latest?.reviewedAt ? (
          <div className="text-[9px] text-primary/60 font-mono border border-primary/20 bg-primary/5 px-3 py-1.5">
            ✓ Latest review saved: {format(new Date(latest.reviewedAt), 'yyyy-MM-dd HH:mm:ss')}
            {latest.reviewer ? ` · by ${latest.reviewer}` : ''}
            {` · ${counters.total - counters.unreviewed} of ${counters.total} classified`}
          </div>
        ) : null;
      })()}

      {/* Summary counters (from saved reviews) */}
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
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[9px] border transition-colors whitespace-nowrap font-semibold ${
              filter === f
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Records list */}
      <div>
        {loading ? (
          <div className="py-12 text-center text-[11px] text-slate-400 font-semibold">Loading legacy records…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-slate-400 font-semibold">
            {commands.length === 0 ? 'No REAL or LIVE execution records found.' : `No records match filter: ${filter}`}
          </div>
        ) : (
          filtered.map(cmd => (
            <CommandReviewCard
              key={cmd.id}
              command={cmd}
              savedReview={savedReviews[cmd.id] || null}
              onSaved={fetchData}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/30 text-[9px] text-slate-400 font-semibold">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
        <div>
          Reviews are saved to <span className="text-primary font-semibold">OpenClawLegacyReview</span>. Original <span className="text-slate-300">OpenClawCommand</span> records are never modified.
          No command rerun, deletion, live execution, or governance bypass.
        </div>
      </div>
    </div>
  );
}