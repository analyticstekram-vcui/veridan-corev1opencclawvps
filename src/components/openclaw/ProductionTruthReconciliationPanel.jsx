/**
 * ProductionTruthReconciliationPanel
 * Reconciles checklist records (OpenClawProductionChecklistReview) against review notes.
 * Separates items into: Verified Safe, Preview/UI Only, Blocked From Production, Status Conflicts.
 * Flags COMPLETE items whose reviewNote contains contradiction phrases.
 * UI-only governance/audit clarity. No execution, no dispatch, no live mode, no credentials.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertTriangle, Ban, AlertCircle, RefreshCw, Eye } from 'lucide-react';

// ─── Static checklist definitions (source of truth from ProductionReadinessChecklistPanel) ─

const CHECKLIST_ITEMS = [
  { name: 'Cloudflare Access enabled', category: 'Security', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'No secrets in frontend code', category: 'Security', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Role-based access control (RBAC)', category: 'Security', status: 'PARTIAL', priority: 'HIGH' },
  { name: 'Session timeout policy', category: 'Security', status: 'NOT_STARTED', priority: 'MEDIUM' },
  { name: 'API keys stored server-side only', category: 'Secrets Management', status: 'PARTIAL', priority: 'CRITICAL' },
  { name: 'Broker credentials vaulted', category: 'Secrets Management', status: 'NOT_STARTED', priority: 'CRITICAL' },
  { name: 'OpenAI API key not rendered in UI', category: 'Secrets Management', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'HMAC signing verified for broker requests', category: 'Secrets Management', status: 'PARTIAL', priority: 'CRITICAL' },
  { name: 'Cloudflare Access policy configured', category: 'Cloudflare / Access Protection', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'X-Frame-Options header set to DENY', category: 'Cloudflare / Access Protection', status: 'COMPLETE', priority: 'HIGH' },
  { name: 'Safety tests 7/7 passing', category: 'Backend Validation', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Read-only bridge passing', category: 'Backend Validation', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Mutation commands blocked', category: 'Backend Validation', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Live mode disabled by default', category: 'Backend Validation', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Trace IDs generated for all operations', category: 'Audit / Logging', status: 'COMPLETE', priority: 'HIGH' },
  { name: 'Executed command audit view', category: 'Audit / Logging', status: 'COMPLETE', priority: 'HIGH' },
  { name: 'Immutable audit store', category: 'Audit / Logging', status: 'PARTIAL', priority: 'CRITICAL' },
  { name: 'Export snapshots to Markdown/JSON', category: 'Audit / Logging', status: 'COMPLETE', priority: 'MEDIUM' },
  { name: 'Manual approval workflow', category: 'Governance Approval', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Multi-signature approval', category: 'Governance Approval', status: 'NOT_STARTED', priority: 'CRITICAL' },
  { name: 'Risk matrix visible and enforced', category: 'Governance Approval', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Policy registry visible and immutable', category: 'Governance Approval', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Emergency stop UI button', category: 'Kill Switch / Emergency Controls', status: 'COMPLETE', priority: 'CRITICAL' },
  { name: 'Backend-enforced kill switch', category: 'Kill Switch / Emergency Controls', status: 'PARTIAL', priority: 'CRITICAL' },
  { name: 'Kill switch tested against execution endpoint', category: 'Kill Switch / Emergency Controls', status: 'PARTIAL', priority: 'CRITICAL' },
  { name: 'System status read command', category: 'Read-Only Bridge', status: 'COMPLETE', priority: 'HIGH' },
  { name: 'Logs fetch command', category: 'Read-Only Bridge', status: 'COMPLETE', priority: 'MEDIUM' },
  { name: 'Session list command', category: 'Read-Only Bridge', status: 'COMPLETE', priority: 'MEDIUM' },
  { name: 'Browser read actions (read_page_text, read_title)', category: 'Browser Action Bridge', status: 'NOT_STARTED', priority: 'MEDIUM' },
  { name: 'Screenshot capture', category: 'Browser Action Bridge', status: 'NOT_STARTED', priority: 'MEDIUM' },
  { name: 'Click/type/navigation actions', category: 'Browser Action Bridge', status: 'BLOCKED', priority: 'HIGH' },
  { name: 'DOM selector validation', category: 'Browser Action Bridge', status: 'PARTIAL', priority: 'MEDIUM' },
  { name: 'TradingView read-only connector', category: 'Trading / Broker Bridge', status: 'PARTIAL', priority: 'HIGH' },
  { name: 'Paper trading adapter', category: 'Trading / Broker Bridge', status: 'NOT_STARTED', priority: 'CRITICAL' },
  { name: 'Broker credential vault', category: 'Trading / Broker Bridge', status: 'NOT_STARTED', priority: 'CRITICAL' },
  { name: 'Live order execution', category: 'Trading / Broker Bridge', status: 'BLOCKED', priority: 'CRITICAL' },
  { name: 'Bank read-only connector', category: 'Banking / Treasury Bridge', status: 'NOT_STARTED', priority: 'HIGH' },
  { name: 'Payment/transfer execution', category: 'Banking / Treasury Bridge', status: 'BLOCKED', priority: 'CRITICAL' },
  { name: 'Treasury approval flow', category: 'Banking / Treasury Bridge', status: 'NOT_STARTED', priority: 'CRITICAL' },
  { name: 'Simulation scenarios (10/10)', category: 'Testing / QA', status: 'COMPLETE', priority: 'HIGH' },
  { name: 'Regression test suite', category: 'Testing / QA', status: 'PARTIAL', priority: 'MEDIUM' },
  { name: 'Error boundary tests', category: 'Testing / QA', status: 'NOT_STARTED', priority: 'MEDIUM' },
  { name: 'Permission escalation tests', category: 'Testing / QA', status: 'NOT_STARTED', priority: 'CRITICAL' },
  { name: 'Operator runbook', category: 'Documentation / Runbooks', status: 'COMPLETE', priority: 'HIGH' },
  { name: 'Snapshot export process', category: 'Documentation / Runbooks', status: 'COMPLETE', priority: 'MEDIUM' },
  { name: 'Obsidian export process', category: 'Documentation / Runbooks', status: 'PARTIAL', priority: 'LOW' },
  { name: 'Deployment SOP', category: 'Documentation / Runbooks', status: 'PARTIAL', priority: 'HIGH' },
];

// Phrases that contradict a COMPLETE reviewStatus
const CONFLICT_PHRASES = [
  'not implemented',
  'still required',
  'blocked',
  'must be tested',
  'do not store',
  'audit is still required',
  'backend audit is still required',
  'not yet',
  'needs to be',
  'not done',
  'not complete',
  'incomplete',
  'pending',
  'todo',
  'to do',
];

function containsConflictPhrase(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  return CONFLICT_PHRASES.find(p => lower.includes(p)) || null;
}

// Classify each item given its checklist definition + saved review record
function classifyItem(def, review) {
  const effectiveStatus = review?.reviewStatus || def.status;
  const reviewNote = review?.reviewNote || '';

  // STATUS_CONFLICT: reviewStatus is COMPLETE but note contradicts it
  if (effectiveStatus === 'COMPLETE') {
    const conflict = containsConflictPhrase(reviewNote);
    if (conflict) {
      return { bucket: 'STATUS_CONFLICT', reason: `reviewStatus=COMPLETE but note contains "${conflict}"`, effectiveStatus };
    }
  }

  // BLOCKED_FROM_PRODUCTION: BLOCKED status, or CRITICAL NOT_STARTED
  if (
    effectiveStatus === 'BLOCKED' ||
    def.status === 'BLOCKED' ||
    (def.priority === 'CRITICAL' && (effectiveStatus === 'NOT_STARTED' || effectiveStatus === 'PARTIAL'))
  ) {
    return { bucket: 'BLOCKED_FROM_PRODUCTION', reason: `${effectiveStatus} · Priority: ${def.priority}`, effectiveStatus };
  }

  // PREVIEW_UI_ONLY: items with no backend evidence (partial with no review saved, or UI-only-named items)
  if (
    effectiveStatus === 'PARTIAL' ||
    effectiveStatus === 'NOT_STARTED'
  ) {
    return { bucket: 'PREVIEW_UI_ONLY', reason: `${effectiveStatus} — not yet verified in production`, effectiveStatus };
  }

  // VERIFIED_SAFE: COMPLETE with no conflict
  if (effectiveStatus === 'COMPLETE') {
    return { bucket: 'VERIFIED_SAFE', reason: review ? 'Operator-reviewed COMPLETE' : 'Checklist COMPLETE', effectiveStatus };
  }

  return { bucket: 'PREVIEW_UI_ONLY', reason: effectiveStatus, effectiveStatus };
}

const BUCKET_CONFIG = {
  VERIFIED_SAFE: {
    label: 'Verified Safe',
    icon: CheckCircle2,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/5',
    borderClass: 'border-primary/20',
    headerBg: 'bg-primary/10',
    description: 'reviewStatus=COMPLETE with no contradicting phrases in review notes.',
  },
  PREVIEW_UI_ONLY: {
    label: 'Preview / UI Only',
    icon: Eye,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-amber-500/20',
    headerBg: 'bg-amber-500/10',
    description: 'PARTIAL or NOT_STARTED — not verified for production. UI/preview state only.',
  },
  BLOCKED_FROM_PRODUCTION: {
    label: 'Blocked From Production',
    icon: Ban,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/5',
    borderClass: 'border-destructive/20',
    headerBg: 'bg-destructive/10',
    description: 'BLOCKED status or CRITICAL items that are unstarted/partial.',
  },
  STATUS_CONFLICT: {
    label: 'Status Conflicts',
    icon: AlertCircle,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/5',
    borderClass: 'border-orange-500/20',
    headerBg: 'bg-orange-500/10',
    description: 'reviewStatus=COMPLETE but reviewNote contains contradiction phrases. Requires operator re-review.',
  },
};

const PRIORITY_COLOR = {
  CRITICAL: 'text-destructive',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-slate-400',
};

function BucketSection({ bucketKey, items }) {
  const cfg = BUCKET_CONFIG[bucketKey];
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(bucketKey === 'STATUS_CONFLICT'); // conflicts expanded by default

  if (items.length === 0) return (
    <div className={`border ${cfg.borderClass} rounded-sm overflow-hidden`}>
      <div className={`${cfg.headerBg} px-4 py-2.5 flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${cfg.colorClass}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.colorClass}`}>{cfg.label}</span>
        <span className="ml-auto text-[8px] font-mono text-slate-500">0 items</span>
      </div>
    </div>
  );

  return (
    <div className={`border ${cfg.borderClass} rounded-sm overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={`w-full ${cfg.headerBg} px-4 py-2.5 flex items-center gap-2 hover:opacity-90 transition-opacity`}
      >
        <Icon className={`w-4 h-4 ${cfg.colorClass} shrink-0`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.colorClass}`}>{cfg.label}</span>
        <span className={`text-[8px] font-mono border px-1.5 py-0.5 rounded-sm ml-1 ${cfg.borderClass} ${cfg.colorClass}`}>{items.length}</span>
        <span className={`ml-2 text-[8px] ${cfg.colorClass} opacity-60`}>{cfg.description}</span>
        <span className="ml-auto text-[8px] text-slate-500">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className={`${cfg.bgClass} divide-y divide-border/10`}>
          {items.map((item, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-semibold text-foreground">{item.def.name}</span>
                  <span className={`text-[7px] font-bold ${PRIORITY_COLOR[item.def.priority]}`}>{item.def.priority}</span>
                  <span className="text-[7px] text-slate-500 border border-border/30 px-1 rounded-sm">{item.def.category}</span>
                </div>
                <div className={`text-[8px] mt-0.5 font-mono ${cfg.colorClass} opacity-80`}>{item.classification.reason}</div>
                {item.review?.reviewNote && (
                  <div className="text-[7px] text-slate-500 mt-0.5 italic truncate">Note: {item.review.reviewNote}</div>
                )}
                {item.review?.reviewer && (
                  <div className="text-[7px] text-slate-600">Reviewed by: {item.review.reviewer}</div>
                )}
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 border rounded-sm shrink-0 ${cfg.borderClass} ${cfg.colorClass}`}>
                {item.classification.effectiveStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductionTruthReconciliationPanel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState(null);

  const load = async () => {
    setLoading(true);
    const recs = await base44.entities.OpenClawProductionChecklistReview.list('-reviewedAt', 500);
    setReviews(recs);
    setLastLoaded(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Build a name→review map
  const reviewMap = {};
  for (const r of reviews) {
    if (r.checklistItemName) reviewMap[r.checklistItemName] = r;
  }

  // Classify every checklist item
  const classified = CHECKLIST_ITEMS.map(def => ({
    def,
    review: reviewMap[def.name] || null,
    classification: classifyItem(def, reviewMap[def.name] || null),
  }));

  // Group into buckets
  const buckets = {
    VERIFIED_SAFE: classified.filter(c => c.classification.bucket === 'VERIFIED_SAFE'),
    PREVIEW_UI_ONLY: classified.filter(c => c.classification.bucket === 'PREVIEW_UI_ONLY'),
    BLOCKED_FROM_PRODUCTION: classified.filter(c => c.classification.bucket === 'BLOCKED_FROM_PRODUCTION'),
    STATUS_CONFLICT: classified.filter(c => c.classification.bucket === 'STATUS_CONFLICT'),
  };

  const totalConflicts = buckets.STATUS_CONFLICT.length;
  const totalBlocked = buckets.BLOCKED_FROM_PRODUCTION.length;
  const totalVerified = buckets.VERIFIED_SAFE.length;
  const totalPreview = buckets.PREVIEW_UI_ONLY.length;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-[16px] font-mono font-bold text-foreground">Production Truth Reconciliation</h2>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">
            Reconciles checklist records against review notes · Flags status conflicts · UI-only governance clarity · No execution · No dispatch
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border/40 text-slate-400 text-[9px] font-mono hover:text-slate-200 hover:border-border/80 transition-colors rounded-sm disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Safety banner */}
      <div className="bg-secondary/20 border border-border/40 rounded-sm px-3 py-2 text-[8px] font-mono text-slate-500 flex flex-wrap gap-3">
        <span>Execution: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>OpenClaw Dispatch: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>Broker Actions: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>Payment Actions: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>Credential Handling: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>Filesystem Writes: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>Live Mode: <span className="text-destructive font-bold">DISABLED</span></span>
        <span>Mode: <span className="text-amber-400 font-bold">GOVERNANCE_AUDIT_ONLY</span></span>
      </div>

      {/* Conflict detection note */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-sm px-3 py-2 text-[8px] text-slate-400">
        <span className="text-orange-400 font-bold">Conflict detection: </span>
        Items marked COMPLETE where reviewNote contains:
        <span className="text-orange-300 font-mono ml-1">
          {CONFLICT_PHRASES.slice(0, 8).map((p, i) => (
            <span key={p}>{i > 0 && ' · '}"{p}"</span>
          ))}
          {CONFLICT_PHRASES.length > 8 && <span> · +{CONFLICT_PHRASES.length - 8} more</span>}
        </span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { key: 'VERIFIED_SAFE',           count: totalVerified, label: 'Verified Safe',          color: 'text-primary',      bg: 'bg-primary/5',       border: 'border-primary/20' },
          { key: 'PREVIEW_UI_ONLY',         count: totalPreview,  label: 'Preview / UI Only',       color: 'text-amber-400',    bg: 'bg-amber-500/5',     border: 'border-amber-500/20' },
          { key: 'BLOCKED_FROM_PRODUCTION', count: totalBlocked,  label: 'Blocked From Production', color: 'text-destructive',  bg: 'bg-destructive/5',   border: 'border-destructive/20' },
          { key: 'STATUS_CONFLICT',         count: totalConflicts,label: 'Status Conflicts',         color: 'text-orange-400',   bg: 'bg-orange-500/5',    border: 'border-orange-500/20' },
        ].map(s => (
          <div key={s.key} className={`${s.bg} border ${s.border} rounded-sm px-3 py-2.5 text-center`}>
            <div className={`text-[20px] font-bold font-mono ${s.color}`}>{s.count}</div>
            <div className={`text-[7px] font-bold uppercase ${s.color} opacity-70 mt-0.5`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overall truthfulness banner */}
      {totalConflicts === 0 && totalBlocked === 0 ? (
        <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[9px] font-mono text-primary">No status conflicts detected. All COMPLETE items have consistent review notes.</span>
        </div>
      ) : totalConflicts > 0 ? (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-sm px-4 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div className="text-[9px] font-mono text-orange-400">
            <span className="font-bold">{totalConflicts} status conflict{totalConflicts > 1 ? 's' : ''} detected.</span>
            {' '}These items are marked COMPLETE but have review notes suggesting they are not complete.
            Operator re-review required in Production Readiness Checklist.
          </div>
        </div>
      ) : (
        <div className="bg-destructive/5 border border-destructive/20 rounded-sm px-4 py-2.5 flex items-center gap-2">
          <Ban className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-[9px] font-mono text-destructive">{totalBlocked} item{totalBlocked > 1 ? 's' : ''} blocked from production.</span>
        </div>
      )}

      {/* Last loaded */}
      {lastLoaded && (
        <div className="text-[7px] text-slate-600 font-mono text-right">
          Last reconciled: {lastLoaded.toLocaleString()} · {reviews.length} review record{reviews.length !== 1 ? 's' : ''} loaded from database
        </div>
      )}

      {/* Bucket sections — STATUS_CONFLICT first for visibility */}
      {['STATUS_CONFLICT', 'BLOCKED_FROM_PRODUCTION', 'PREVIEW_UI_ONLY', 'VERIFIED_SAFE'].map(key => (
        <BucketSection key={key} bucketKey={key} items={buckets[key]} />
      ))}

      {/* Footer disclaimer */}
      <div className="bg-card border border-border/30 rounded-sm px-4 py-3 text-[8px] font-mono text-slate-500 leading-relaxed">
        This panel reads <span className="text-slate-300">OpenClawProductionChecklistReview</span> records and the static checklist definition. It does not write, modify, or delete any records.
        It does not enable execution, dispatch commands, handle credentials, perform broker actions, process payments, write to the filesystem, or activate live mode.
        Conflict detection is heuristic — operator judgment is required for final review decisions.
        This is a governance audit clarity tool only.
      </div>
    </div>
  );
}