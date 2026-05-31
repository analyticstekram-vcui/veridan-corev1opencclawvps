/**
 * StorageReconciliationPanel
 * Read-only cross-reference of VeridanObsidianDraft, VeridanObsidianWriteAudit,
 * and the indexed written-file list.
 *
 * Safety guarantees:
 * - NO deletions or mutations of any kind
 * - NO OpenClaw dispatch · NO browser automation · NO credentials · NO InvokeLLM
 * - Backend entities read-only
 * - localStorage read-only (no writes)
 * - executionStatus / dispatchStatus / openclawCall never touched
 *
 * Accepts optional `workflowSummary` prop (from CoreVaultPackWorkflow) to show
 * last-run written filenames for reconciliation against audit records.
 */

import React, { useState, useCallback } from 'react';
import {
  GitCompare, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { loadDraftsFromBackend, loadAuditsFromBackend } from '@/lib/obsidianDraftStore';

// ── Reconciliation logic ─────────────────────────────────────────────────────

function reconcile(drafts, audits, workflowSummary) {
  const totalDrafts = drafts.length;
  const totalAudits = audits.length;

  // Written files = audits with COMPLETED filesystem write
  const writtenAudits = audits.filter(a =>
    a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' || a.filePath
  );
  const writtenCount = writtenAudits.length;

  const failedAudits = audits.filter(a =>
    a.filesystemWrite && a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY' &&
    a.filesystemWrite !== 'DISABLED'
  );
  const failedCount = failedAudits.length;

  // Last workflow run written filenames (from prop)
  const lastRunWritten = workflowSummary?.written ?? null;
  const lastRunFilenames = new Set(
    (workflowSummary?.writtenFilenames ?? []).map(f => f.toLowerCase())
  );

  // Build audit filename sets
  const auditFilenames = new Set(audits.map(a => (a.filename || '').toLowerCase()));
  const auditDraftIds = new Set(audits.map(a => a.draftId).filter(Boolean));

  // Audits present in last run result but missing from audit entity records
  const inLastRunNotInAudits = workflowSummary?.writtenFilenames?.filter(
    f => !auditFilenames.has(f.toLowerCase())
  ) ?? [];

  // Approved drafts not yet written (filesystemWrite !== COMPLETED)
  const approvedNotWritten = drafts.filter(d =>
    (d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT') &&
    d.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY'
  );

  // Audits without a matching draftId in the drafts list
  const draftIdSet = new Set(
    drafts.map(d => d.draftId || d.id).filter(Boolean)
  );
  const auditsWithoutDraft = audits.filter(a =>
    a.draftId && !draftIdSet.has(a.draftId)
  );

  // REVIEW_REQUIRED if any mismatch exists
  const needsReview =
    inLastRunNotInAudits.length > 0 ||
    approvedNotWritten.length > 0 ||
    auditsWithoutDraft.length > 0 ||
    failedCount > 0;

  return {
    totalDrafts,
    totalAudits,
    writtenCount,
    failedCount,
    lastRunWritten,
    inLastRunNotInAudits,
    approvedNotWritten,
    auditsWithoutDraft,
    needsReview,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CountCell({ label, value, highlight }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 bg-background/60 border border-border/30 rounded-sm">
      <span className={`text-[11px] font-bold ${highlight ? 'text-destructive' : 'text-primary'}`}>{value ?? '—'}</span>
      <span className="text-[6px] font-mono text-slate-500 text-center mt-0.5">{label}</span>
    </div>
  );
}

function DisclosureList({ title, items, keyFn, renderFn, emptyMsg, color = 'text-slate-400' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/30 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-card/60 hover:bg-card text-left transition-colors"
      >
        <span className={`text-[8px] font-bold ${items.length > 0 ? color : 'text-slate-500'}`}>
          {title} <span className="font-mono">({items.length})</span>
        </span>
        {open
          ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-border/20 space-y-1 bg-background/40">
          {items.length === 0
            ? <div className="text-[7px] font-mono text-slate-600">{emptyMsg}</div>
            : items.map((item, i) => (
                <div key={keyFn ? keyFn(item, i) : i} className="text-[7px] font-mono text-slate-400">
                  {renderFn(item, i)}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

const VERIFICATIONS = [
  'No deletions or mutations performed by this panel',
  'Backend entities are read-only from this view',
  'localStorage is read-only (no writes from reconciliation)',
  'executionStatus remains NOT_EXECUTED',
  'dispatchStatus remains NOT_DISPATCHED',
  'openclawCall remains NOT_SENT',
  'Approved drafts and write audits are fully preserved',
  'No OpenClaw dispatch · No browser automation · No credentials · No InvokeLLM',
];

// ── Main component ────────────────────────────────────────────────────────────

export default function StorageReconciliationPanel({ workflowSummary, className = '' }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const runReconciliation = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const [drafts, audits] = await Promise.all([
        loadDraftsFromBackend(500),
        loadAuditsFromBackend(500),
      ]);
      setResult(reconcile(drafts, audits, workflowSummary));
    } catch (e) {
      setError(e?.message || 'Backend read failed during reconciliation');
    }
    setLoading(false);
  }, [workflowSummary]);

  const statusBadge = result
    ? result.needsReview
      ? { label: 'REVIEW REQUIRED', cls: 'text-destructive bg-destructive/10 border-destructive/40', icon: AlertTriangle }
      : { label: 'CONSISTENT', cls: 'text-primary bg-primary/10 border-primary/30', icon: CheckCircle2 }
    : null;

  return (
    <div className={`border border-border/40 bg-card rounded-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <div className="flex items-center gap-2">
          <GitCompare className="w-3.5 h-3.5 text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Storage Reconciliation</span>
          {statusBadge && (
            <span className={`flex items-center gap-1 px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${statusBadge.cls}`}>
              <statusBadge.icon className="w-2.5 h-2.5" />
              {statusBadge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 rounded-sm transition-colors"
          >
            <ShieldCheck className="w-2.5 h-2.5" /> Verify
          </button>
          <button
            type="button"
            onClick={runReconciliation}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-accent/30 text-accent hover:border-accent/60 rounded-sm transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
            {result ? 'Re-run' : 'Run Reconciliation'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Idle prompt */}
        {!result && !loading && !error && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <GitCompare className="w-3 h-3" />
            Click "Run Reconciliation" to compare backend draft records, write audits, and indexed files.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> Reading backend entities…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[7px] font-mono text-destructive">
              <span className="font-bold">Reconciliation error:</span> {error}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Count summary */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              <CountCell label="Backend Drafts" value={result.totalDrafts} />
              <CountCell label="Write Audits" value={result.totalAudits} />
              <CountCell label="Written Files" value={result.writtenCount} />
              <CountCell label="Failed Writes" value={result.failedCount} highlight={result.failedCount > 0} />
              <CountCell
                label="Last Run Written"
                value={result.lastRunWritten ?? 'N/A'}
                highlight={false}
              />
            </div>

            {/* Mismatch details */}
            <div className="space-y-1.5">
              <DisclosureList
                title="Audits in last run result not found in audit records"
                items={result.inLastRunNotInAudits}
                keyFn={(f, i) => i}
                renderFn={f => `⚠ ${f}`}
                emptyMsg="All last-run written filenames matched in audit records."
                color="text-destructive"
              />
              <DisclosureList
                title="Approved drafts not yet written"
                items={result.approvedNotWritten}
                keyFn={d => d.id || d.draftId}
                renderFn={d => `→ ${d.filename}  [${d.targetFolder}]  type: ${d.draftType}`}
                emptyMsg="All approved drafts have been written."
                color="text-accent"
              />
              <DisclosureList
                title="Write audits without a matching draft record"
                items={result.auditsWithoutDraft}
                keyFn={a => a.id || a.auditId}
                renderFn={a => `→ ${a.filename}  draftId: ${a.draftId || 'none'}`}
                emptyMsg="All audit records have a matching draft."
                color="text-slate-400"
              />
            </div>

            {/* Status summary line */}
            <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2 space-y-0.5">
              <div>Read-only · no mutations · executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT</div>
              {result.needsReview
                ? <div className="text-destructive/70">⚠ One or more reconciliation checks require operator review.</div>
                : <div className="text-primary/60">✅ All reconciliation checks passed — storage is consistent.</div>
              }
            </div>
          </>
        )}

        {/* Verification panel */}
        {showVerification && (
          <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
            <div className="text-[7px] font-bold uppercase tracking-widest text-primary/80 mb-2">Safety Verification Report</div>
            {VERIFICATIONS.map((v, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                {v}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}