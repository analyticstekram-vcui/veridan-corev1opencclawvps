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

    try {
      // 1. Load all CORE_VAULT_PACK drafts
      const allDrafts = await base44.entities.VeridanObsidianDraft.list('-created_date', 500);
      const cvpDrafts = allDrafts.filter(d => d.source === 'CORE_VAULT_PACK');

      // 2. Group by runId (drafts without runId get a synthetic key based on created_date bucket)
      const groups = {};
      for (const d of cvpDrafts) {
        const key = d.runId || `no-runid-${d.created_date?.slice(0, 13) || 'unknown'}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
      }

      // 3. Score each run: a "complete" run has exactly 10 drafts all with filesystemWrite = COMPLETED_APPROVED_DRAFT_ONLY
      //    Pick the most recent complete run as the one to preserve.
      //    "Most recent" = highest created_date among drafts in that group.
      let bestRunId = null;
      let bestRunTs = '';
      let bestWrittenCount = 0;

      for (const [key, drafts] of Object.entries(groups)) {
        const written = drafts.filter(d => d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').length;
        if (written === 10 && drafts.length === 10) {
          const newestTs = drafts.map(d => d.created_date || '').sort().reverse()[0] || '';
          if (newestTs > bestRunTs) {
            bestRunTs = newestTs;
            bestRunId = key;
            bestWrittenCount = written;
          }
        }
      }

      // 4. If no perfect run found, preserve the group with the highest written count (most recent tiebreak)
      if (!bestRunId) {
        let bestScore = -1;
        for (const [key, drafts] of Object.entries(groups)) {
          const written = drafts.filter(d => d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').length;
          const newestTs = drafts.map(d => d.created_date || '').sort().reverse()[0] || '';
          if (written > bestScore || (written === bestScore && newestTs > bestRunTs)) {
            bestScore = written;
            bestRunTs = newestTs;
            bestRunId = key;
            bestWrittenCount = written;
          }
        }
      }

      // 5. Archive all CVP drafts NOT in the preserved run
      const draftsToArchive = cvpDrafts.filter(d => {
        const key = d.runId || `no-runid-${d.created_date?.slice(0, 13) || 'unknown'}`;
        return key !== bestRunId;
      });

      let archivedDrafts = 0;
      for (const d of draftsToArchive) {
        try {
          await base44.entities.VeridanObsidianDraft.update(d.id, { archived: true });
          archivedDrafts++;
        } catch { /* skip individual failures */ }
      }

      // 6. Load all audits, find those matching archived draft IDs or with matching runId
      const archivedDraftIds = new Set(draftsToArchive.map(d => d.draftId || d.id));
      const archivedBackendIds = new Set(draftsToArchive.map(d => d.id));

      const allAudits = await base44.entities.VeridanObsidianWriteAudit.list('-created_date', 500);
      const auditsToArchive = allAudits.filter(a => {
        if (a.source !== 'VAULT_WRITE_BRIDGE' && a.source !== 'CORE_VAULT_PACK') return false;
        // Match by draftId field
        if (a.draftId && (archivedDraftIds.has(a.draftId) || archivedBackendIds.has(a.draftId))) return true;
        return false;
      });

      let archivedAudits = 0;
      for (const a of auditsToArchive) {
        try {
          await base44.entities.VeridanObsidianWriteAudit.update(a.id, { archived: true });
          archivedAudits++;
        } catch { /* skip */ }
      }

      setResult({
        preservedRunId: bestRunId || 'none',
        preservedWrittenCount: bestWrittenCount,
        archivedDrafts,
        archivedAudits,
        totalCvpDrafts: cvpDrafts.length,
        totalRuns: Object.keys(groups).length,
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
            <div>Preserved Run: <span className="text-primary font-bold break-all">{result.preservedRunId}</span></div>
            <div>Preserved Written: <span className="text-primary font-bold">{result.preservedWrittenCount}</span></div>
            <div>Total CVP Drafts: <span className="text-slate-300">{result.totalCvpDrafts}</span></div>
            <div>Total Runs Found: <span className="text-slate-300">{result.totalRuns}</span></div>
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