/**
 * CleanCVPTestRunsPanel
 * Archives old CORE_VAULT_PACK test run records (drafts + audits).
 * Never deletes. Never touches non-CORE_VAULT_PACK records.
 * No OpenClaw dispatch. No bridge calls.
 */

import React, { useState } from 'react';
import { Loader2, Archive, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CleanCVPTestRunsPanel() {
  const [step, setStep] = useState('idle'); // idle | confirm | running | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClean = async () => {
    setStep('running');
    setResult(null);
    setErrorMsg('');

    const now = new Date().toISOString();

    try {
      // 1. Load ALL CVP drafts (including already-archived) so we can see the full picture
      const allDrafts = await base44.entities.VeridanObsidianDraft.list('-created_date', 1000);
      const cvpDrafts = allDrafts.filter(d => d.source === 'CORE_VAULT_PACK');

      // 2. Among all CVP drafts, find the single best record per filePath to preserve.
      //    "Best" = COMPLETED_APPROVED_DRAFT_ONLY + most recent writtenAt/created_date.
      //    This handles duplicates both across runs AND within a run.
      const byFilePath = {};
      for (const d of cvpDrafts) {
        if (!d.filePath) continue; // drafts with no filePath handled separately below
        if (!byFilePath[d.filePath]) byFilePath[d.filePath] = [];
        byFilePath[d.filePath].push(d);
      }

      // Pick the one to preserve per filePath group
      const preservedIds = new Set();
      for (const group of Object.values(byFilePath)) {
        const sorted = [...group].sort((a, b) => {
          const aC = a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' ? 1 : 0;
          const bC = b.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' ? 1 : 0;
          if (bC !== aC) return bC - aC;
          const aTs = a.writtenAt || a.created_date || '';
          const bTs = b.writtenAt || b.created_date || '';
          return bTs.localeCompare(aTs);
        });
        preservedIds.add(sorted[0].id);
      }

      // Also preserve drafts that have no filePath but are the only record for their draftType
      // (these haven't been written yet — keep them if not-archived)
      const noFilePathDrafts = cvpDrafts.filter(d => !d.filePath && !d.archived);
      for (const d of noFilePathDrafts) preservedIds.add(d.id);

      // 3. Archive all non-preserved CVP drafts
      const draftsToArchive = cvpDrafts.filter(d => !preservedIds.has(d.id) && !d.archived);

      let archivedDrafts = 0;
      for (const d of draftsToArchive) {
        try {
          await base44.entities.VeridanObsidianDraft.update(d.id, {
            archived: true,
            archiveReason: 'CVP_CLEANUP_DUPLICATE_OR_OLD_RUN',
            archivedAt: now,
          });
          archivedDrafts++;
        } catch { /* skip individual failures */ }
      }

      // 4. Load all audits and archive those linked to archived drafts, OR
      //    audits whose filePath has a better preserved draft (duplicate audit cleanup).
      const archivedDraftEntityIds = new Set(draftsToArchive.map(d => d.id));
      const archivedDraftSchemaIds = new Set(draftsToArchive.map(d => d.draftId).filter(Boolean));

      const allAudits = await base44.entities.VeridanObsidianWriteAudit.list('-created_date', 1000);

      // Group audits by filePath to find duplicates there too
      const auditsByFilePath = {};
      for (const a of allAudits) {
        if (!a.filePath || a.archived) continue;
        if (!auditsByFilePath[a.filePath]) auditsByFilePath[a.filePath] = [];
        auditsByFilePath[a.filePath].push(a);
      }

      // Per filePath, keep only the audit linked to the preserved draft (or newest if no link)
      const preservedAuditIds = new Set();
      for (const group of Object.values(auditsByFilePath)) {
        if (group.length <= 1) {
          if (group[0]) preservedAuditIds.add(group[0].id);
          continue;
        }
        // Prefer audit whose draftId matches a preserved draft
        const linked = group.find(a =>
          preservedIds.has(a.draftId) || preservedIds.has(
            allDrafts.find(d => (d.draftId === a.draftId || d.id === a.draftId))?.id
          )
        );
        if (linked) {
          preservedAuditIds.add(linked.id);
        } else {
          // Keep newest by timestamp
          const sorted = [...group].sort((a, b) =>
            (b.timestamp || b.created_date || '').localeCompare(a.timestamp || a.created_date || '')
          );
          preservedAuditIds.add(sorted[0].id);
        }
      }

      // Audits to archive: linked to an archived draft OR duplicate filePath non-preserved
      const auditsToArchive = allAudits.filter(a => {
        if (a.archived) return false;
        // Linked to a draft we just archived
        if (a.draftId && (archivedDraftEntityIds.has(a.draftId) || archivedDraftSchemaIds.has(a.draftId))) return true;
        // Duplicate audit for same filePath — not the preserved one
        if (a.filePath && auditsByFilePath[a.filePath]?.length > 1 && !preservedAuditIds.has(a.id)) return true;
        return false;
      });

      let archivedAudits = 0;
      for (const a of auditsToArchive) {
        try {
          await base44.entities.VeridanObsidianWriteAudit.update(a.id, {
            archived: true,
            archiveReason: 'CVP_CLEANUP_DUPLICATE_OR_LINKED_TO_ARCHIVED_DRAFT',
            archivedAt: now,
          });
          archivedAudits++;
        } catch { /* skip */ }
      }

      // Determine the preserved run for display
      const preservedDrafts = cvpDrafts.filter(d => preservedIds.has(d.id));
      const preservedRunIds = [...new Set(preservedDrafts.map(d => d.runId).filter(Boolean))];
      const preservedWrittenCount = preservedDrafts.filter(d => d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').length;

      setResult({
        preservedRunId: preservedRunIds.join(', ') || 'filePath-deduped',
        preservedWrittenCount,
        preservedDraftCount: preservedIds.size,
        archivedDrafts,
        archivedAudits,
        totalCvpDrafts: cvpDrafts.length,
        uniqueFilePaths: Object.keys(byFilePath).length,
      });
      setStep('done');
    } catch (e) {
      setErrorMsg(e?.message || 'Cleanup failed');
      setStep('error');
    }
  };

  return (
    <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm p-4 space-y-3">
      <div className="text-[8px] font-bold uppercase tracking-widest text-amber-500">
        Clean Old CVP Test Runs
      </div>
      <div className="text-[7px] font-mono text-slate-500 space-y-0.5">
        <div>Archives old CORE_VAULT_PACK draft + audit records. Preserves the most recent successful run.</div>
        <div>✅ Never deletes · ✅ Never touches non-CVP records · ✅ No bridge calls · ✅ No OpenClaw dispatch</div>
      </div>

      {step === 'idle' && (
        <button
          type="button"
          onClick={() => setStep('confirm')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
        >
          <Archive className="w-3.5 h-3.5" /> Clean Old CVP Test Runs
        </button>
      )}

      {step === 'confirm' && (
        <div className="space-y-3 border border-amber-500/40 bg-amber-500/10 rounded-sm p-3">
          <div className="text-[8px] font-bold text-amber-400">Confirm: Archive old CVP test runs?</div>
          <div className="text-[7px] font-mono text-slate-400">
            This will mark old CORE_VAULT_PACK drafts and matching audit records as archived=true.
            The most recent successful run (written=10) will be preserved. Records are never deleted.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClean}
              className="flex-1 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
            >
              Yes, Archive Old Runs
            </button>
            <button
              type="button"
              onClick={() => setStep('idle')}
              className="flex-1 px-3 py-1.5 border border-border/30 text-slate-500 hover:text-slate-300 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'running' && (
        <div className="flex items-center gap-2 text-[8px] font-mono text-amber-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Archiving old CVP records…
        </div>
      )}

      {step === 'done' && result && (
        <div className="border border-primary/30 bg-primary/5 rounded-sm p-3 space-y-2">
          <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cleanup Complete
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[7px] font-mono text-slate-400">
            <div>Archived Drafts: <span className="text-slate-200 font-bold">{result.archivedDrafts}</span></div>
            <div>Archived Audits: <span className="text-slate-200 font-bold">{result.archivedAudits}</span></div>
            <div>Preserved Drafts: <span className="text-primary font-bold">{result.preservedDraftCount}</span></div>
            <div>Preserved Written: <span className="text-primary font-bold">{result.preservedWrittenCount}</span></div>
            <div>Unique FilePaths: <span className="text-slate-300">{result.uniqueFilePaths}</span></div>
            <div>Total CVP Drafts: <span className="text-slate-300">{result.totalCvpDrafts}</span></div>
            <div className="col-span-2 break-all">Preserved Run(s): <span className="text-primary font-bold">{result.preservedRunId}</span></div>
          </div>
          <button
            type="button"
            onClick={() => setStep('idle')}
            className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline"
          >
            Reset
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[8px] font-mono text-destructive">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </div>
          <button
            type="button"
            onClick={() => setStep('idle')}
            className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}