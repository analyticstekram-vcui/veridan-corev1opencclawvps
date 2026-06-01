/**
 * CoreVaultPackWorkflow
 * True one-click governed vault pack workflow.
 * PRIMARY STORAGE: Base44 backend entities (VeridanObsidianDraft, VeridanObsidianWriteAudit)
 * localStorage: lightweight UI state cache only — no large draft content stored
 *
 * Safety gates:
 *   - source === "CORE_VAULT_PACK"
 *   - riskLevel === "LOW"
 *   - executionStatus === "NOT_EXECUTED"
 *   - dispatchStatus === "NOT_DISPATCHED"
 *   - openclawCall === "NOT_SENT"
 *   - targetFolder in APPROVED_FOLDERS
 *   - draftType in ALLOWED_CVP_DRAFT_TYPES
 *   - no credentials
 *   - no OpenClaw dispatch
 *   - no InvokeLLM
 *   - no browser automation
 *   - vault write: obsidianWriteApprovedDraft backend only
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, Shield, FolderOpen, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  saveDraftsToBackend,
  autoApproveCVPDrafts,
  loadEligibleForWrite,
  markDraftWritten,
  saveAuditToBackend,
} from '@/lib/obsidianDraftStore';
import { buildDrafts } from './cvpTemplates';

const APPROVED_FOLDERS = [
  'drafts', 'task-plans', 'approval-queues', 'audit-logs', 'governance', 'evidence',
  'Veridan Core/Veridan Core System',
  'Veridan Core/OpenClaw',
  'Veridan Core/Trading',
  'Veridan Core/Credit',
  'Veridan Core/Business Formation',
  'Veridan Core/Trust / Entities',
  'Veridan Core/SOPs',
  'Veridan Core/Daily Operations',
  'Veridan Core/Audit Evidence',
  'Veridan Core/Governance',
  'Veridan Core/System Map',
];

const ALLOWED_CVP_DRAFT_TYPES = [
  'CVP_SYSTEM_OVERVIEW',
  'CVP_OPENCLAW_SOP',
  'CVP_DAILY_OPS_SOP',
  'CVP_TRADING_SOP',
  'CVP_CREDIT_SOP',
  'CVP_TRUST_ENTITY_SOP',
  'CVP_AUDIT_EVIDENCE_SOP',
  'CVP_VAULT_FOLDER_MAP',
  'CVP_SAFETY_BOUNDARY_RULES',
  'CVP_APPROVAL_WORKFLOW',
  'MANUAL_MARKDOWN',
];

// ── Shared write executor ────────────────────────────────────────────────────
async function executeWrites(toWrite) {
  let written = 0;
  const failed = [];

  for (const draft of toWrite) {
    const draftPayload = {
      id: draft.id || draft.draftId,
      draftId: draft.draftId || draft.id,
      source: draft.source,
      title: draft.title,
      filename: draft.filename,
      category: draft.category,
      targetFolder: draft.targetFolder,
      content: draft.content,
      draftType: draft.draftType,
      riskLevel: draft.riskLevel || 'LOW',
      approvalStatus: draft.approvalStatus || 'APPROVED',
      approvalState: draft.approvalState || 'APPROVED_DRAFT',
      executionStatus: draft.executionStatus || 'NOT_EXECUTED',
      dispatchStatus: draft.dispatchStatus || 'NOT_DISPATCHED',
      openclawCall: draft.openclawCall || 'NOT_SENT',
      filesystemWrite: draft.filesystemWrite || 'DISABLED',
    };

    console.log(`[CVP Write] Attempting: ${draft.filename} | folder: ${draft.targetFolder} | contentLen: ${(draft.content || '').length} | payload:`, JSON.stringify({ ...draftPayload, content: `[${(draftPayload.content || '').length} chars]` }));

    let response;
    try {
      response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft: draftPayload });
    } catch (invokeErr) {
      const rawData = invokeErr?.response?.data;
      const httpStatus = invokeErr?.response?.status;
      // Prefer the structured error fields from the 502 response body
      const upstreamSummary = rawData?.bridgeResponseSummary;
      const upstreamRaw = upstreamSummary?.upstreamRaw || upstreamSummary?.upstreamBody;
      const backendMsg = rawData?.message || rawData?.backendWriteStatus || '';
      const backendErrors = rawData?.errors;
      const backendError = rawData?.error;
      const baseReason = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.join(' | ')
        : (backendMsg || backendError || invokeErr.message || 'Backend error');
      const upstreamDetail = upstreamRaw
        ? ` | upstream: ${typeof upstreamRaw === 'string' ? upstreamRaw.slice(0, 400) : JSON.stringify(upstreamRaw).slice(0, 400)}`
        : '';
      const reason = `${httpStatus ? `[${httpStatus}] ` : ''}${baseReason}${upstreamDetail}`;
      console.error(`[CVP Write] FAILED: ${draft.filename} | status: ${httpStatus} | reason: ${baseReason} | upstreamSummary:`, upstreamSummary, '| fullResponse:', rawData);
      failed.push({ id: draft.id || draft.draftId, filename: draft.filename, reason, bridgeSummary: upstreamSummary });
      continue;
    }

    if (response.data.success) {
      const filePath = response.data.filePath;
      console.log(`[CVP Write] SUCCESS: ${draft.filename} → ${filePath}`);

      const auditRecord = {
        ...response.data.auditRecord,
        auditId: response.data.auditRecord?.auditId || `AUDIT-${Date.now().toString(36).toUpperCase()}-CVP`,
        draftId: draft.id || draft.draftId || 'unknown',
        filename: draft.filename,
        folder: draft.targetFolder,
        filePath,
        source: draft.source,
        draftType: draft.draftType,
        timestamp: new Date().toISOString(),
        filesystemWrite: 'COMPLETED_APPROVED_DRAFT_ONLY',
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        openclawCall: 'NOT_SENT',
        approvalStatus: 'APPROVED',
        riskLevel: 'LOW',
      };

      await saveAuditToBackend(auditRecord);
      try {
        const audits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');
        const cacheEntry = { ...auditRecord };
        delete cacheEntry.content;
        audits.unshift(cacheEntry);
        if (audits.length > 20) audits.length = 20;
        localStorage.setItem('veridan_obsidian_write_audits', JSON.stringify(audits));
      } catch { /* quota — cache not critical */ }

      if (draft.id) {
        await markDraftWritten(draft.id, filePath).catch(() => {});
      }

      written++;
    } else {
      const reason = response.data.error || 'Write returned failure';
      console.error(`[CVP Write] FAILED (non-success response): ${draft.filename} | reason: ${reason} | fullResponse:`, response.data);
      failed.push({ id: draft.id || draft.draftId, filename: draft.filename, reason });
    }
  }

  return { written, failed };
}

// Deduplicate failed list by filename (keep last occurrence)
function deduplicateFailed(failedList) {
  const seen = new Map();
  for (const f of failedList) {
    seen.set(f.filename, f);
  }
  return Array.from(seen.values());
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CoreVaultPackWorkflow() {
  const [runStatus, setRunStatus] = useState('idle'); // idle | running | done | error
  const [currentPhase, setCurrentPhase] = useState(''); // Generating | Saving | Auto-Approving | Writing | Complete | Failed
  const [summary, setSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const reset = useCallback(() => {
    setRunStatus('idle');
    setCurrentPhase('');
    setSummary(null);
    setErrorMsg('');
  }, []);

  // ── ONE-CLICK: Generate → Save to Backend → Auto-Approve → Write ──────────
  const handleRunGoverned = async () => {
    setRunStatus('running');
    setCurrentPhase('Generating');
    setSummary(null);
    setErrorMsg('');

    // Single tracking object for all phases
    const runResult = { generated: 0, savedToBackend: 0, autoApproved: 0, written: 0, failed: [], alreadyWritten: 0, writtenFilenames: [] };

    try {
      console.log('[CVP Workflow] Starting governed vault pack workflow');

      // ── Pre-flight: Delete stale CVP drafts with wrong targetFolder ──────────
      console.log('[CVP Workflow] Pre-flight: Deleting stale CVP drafts with wrong targetFolder');
      try {
        const allDrafts = await base44.entities.VeridanObsidianDraft.list('-created_date', 200);
        const stale = allDrafts.filter(d =>
          d.source === 'CORE_VAULT_PACK' &&
          d.targetFolder !== 'Veridan Core/Veridan Core System' &&
          d.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY'
        );
        for (const d of stale) {
          await base44.entities.VeridanObsidianDraft.delete(d.id).catch(() => {});
        }
        console.log(`[CVP Workflow] Pre-flight: deleted ${stale.length} stale drafts`);
      } catch (e) {
        console.warn('[CVP Workflow] Pre-flight stale cleanup failed (non-fatal):', e?.message);
      }

      // ── Phase 1: Generate ────────────────────────────────────────────────────
      console.log('[CVP Workflow] Phase 1: Generating drafts');
      const now = new Date().toISOString();
      const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
      const generatedDrafts = buildDrafts(now).map(d => ({ ...d, runId }));
      runResult.generated = generatedDrafts.length;
      console.log(`[CVP Workflow] Generated ${runResult.generated} drafts`);
      if (runResult.generated === 0) throw new Error('No drafts generated from cvpTemplates');
      
      // Update UI with generated count immediately
      setSummary({ ...runResult });

      // ── Phase 2: Save to backend ─────────────────────────────────────────────
      console.log('[CVP Workflow] Phase 2: Saving to backend');
      setCurrentPhase('Saving');
      const saveResult = await saveDraftsToBackend(generatedDrafts);
      if (!saveResult || typeof saveResult.saved !== 'number') {
        throw new Error('saveDraftsToBackend returned invalid result: ' + JSON.stringify(saveResult));
      }
      runResult.savedToBackend = saveResult.saved;
      const saveErrors = saveResult.failed || [];
      console.log(`[CVP Workflow] Saved ${runResult.savedToBackend}/${runResult.generated} drafts to backend`, saveResult);
      
      // Log any save failures for debugging
      if (saveErrors.length > 0) {
        console.error('[CVP Workflow] Save failures:', saveErrors);
      }
      
      // VALIDATION: Stop if nothing saved
      if (runResult.savedToBackend === 0) {
        const errorDetail = saveErrors.length > 0
          ? `All saves failed: ${saveErrors[0]?.reason || 'unknown error'}`
          : 'No drafts were saved to backend';
        throw new Error(`STOPPED: Generated drafts did not save to backend — ${errorDetail}`);
      }
      
      setSummary({ ...runResult });

      // ── Phase 3: Auto-Approve (backend, CORE_VAULT_PACK source only) ─────────
      console.log('[CVP Workflow] Phase 3: Auto-approving');
      setCurrentPhase('Auto-Approving');
      const approveResult = await autoApproveCVPDrafts(APPROVED_FOLDERS, ALLOWED_CVP_DRAFT_TYPES);
      if (!approveResult || typeof approveResult.approved !== 'number') {
        throw new Error('autoApproveCVPDrafts returned invalid result: ' + JSON.stringify(approveResult));
      }
      runResult.autoApproved = approveResult.approved;
      console.log(`[CVP Workflow] Auto-approved ${runResult.autoApproved} drafts`);
      
      // VALIDATION: Stop if nothing approved
      if (runResult.autoApproved === 0) {
        throw new Error('STOPPED: Saved drafts were not approved');
      }
      
      setSummary({ ...runResult });

      // ── Phase 4: Load eligible approved drafts from backend ──────────────────
      console.log('[CVP Workflow] Phase 4: Loading eligible drafts');
      setCurrentPhase('Writing');
      const toWrite = await loadEligibleForWrite(APPROVED_FOLDERS);
      if (!Array.isArray(toWrite)) {
        throw new Error('loadEligibleForWrite returned invalid result: ' + JSON.stringify(toWrite));
      }
      // Only write drafts from THIS run (by runId), not stale approved records from prior runs
      const cvpToWrite = toWrite.filter(d => d.source === 'CORE_VAULT_PACK' && d.runId === runId);
      console.log(`[CVP Workflow] Loaded ${toWrite.length} total eligible drafts, ${cvpToWrite.length} are CORE_VAULT_PACK`);

      // Count already-written CVP drafts (have filePath set, filesystemWrite = COMPLETED)
      runResult.alreadyWritten = toWrite.filter(d =>
        d.source === 'CORE_VAULT_PACK' &&
        d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY'
      ).length;

      // ── Phase 5: Write ────────────────────────────────────────────────────────
      console.log(`[CVP Workflow] Phase 5: Writing ${cvpToWrite.length} drafts`);
      const writeResult = await executeWrites(cvpToWrite);
      if (!writeResult || typeof writeResult.written !== 'number') {
        throw new Error('executeWrites returned invalid result: ' + JSON.stringify(writeResult));
      }
      runResult.written = writeResult.written;
      runResult.failed = deduplicateFailed(writeResult.failed || []);
      console.log(`[CVP Workflow] Written ${runResult.written} drafts, ${runResult.failed?.length || 0} failed`);
      
      // VALIDATION: Stop if nothing written
      if (runResult.written === 0) {
        throw new Error('STOPPED: Approved drafts were not written');
      }
      
      runResult.writtenFilenames = cvpToWrite
        .filter((_, i) => !runResult.failed?.find(f => f.filename === cvpToWrite[i]?.filename))
        .map(d => d.filename);
      
      console.log('[CVP Workflow] Workflow complete:', runResult);
      setSummary(runResult);
      // PARTIAL if some failed, COMPLETE only if all succeeded
      const finalPhase = runResult.failed.length > 0 ? 'Partial' : 'Complete';
      setCurrentPhase(finalPhase);
      setRunStatus('done');
    } catch (err) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[CVP Workflow] Workflow failed:', errorMsg, err);
      setErrorMsg(errorMsg);
      setSummary(runResult); // Always show progress so far
      setCurrentPhase('Failed');
      setRunStatus('done');
    }
  };

  // ── Retry all failed writes (uses existing approved backend records, no new generation) ──
  const handleRetryFailed = async () => {
    if (!summary?.failed?.length) return;
    setRunStatus('running');
    setCurrentPhase('Writing');

    // Reset failed list before retry so failures don't accumulate
    const failedFilenames = new Set(summary.failed.map(f => f.filename));
    const eligible = await loadEligibleForWrite(APPROVED_FOLDERS);
    const toRetry = eligible.filter(d => failedFilenames.has(d.filename));

    console.log(`[CVP Retry] Retrying ${toRetry.length} drafts from backend:`, toRetry.map(d => d.filename));
    const { written, failed } = await executeWrites(toRetry);

    const uniqueFailed = deduplicateFailed(failed);
    const newWritten = (summary.written || 0) + written;
    const finalPhase = uniqueFailed.length === 0 ? 'Complete' : written > 0 ? 'Partial' : 'Failed';

    setSummary(prev => ({
      ...prev,
      written: newWritten,
      failed: uniqueFailed,
    }));
    setCurrentPhase(finalPhase);
    setRunStatus('done');
  };

  // ── Retry a single failed file ─────────────────────────────────────────────
  const handleRetrySingle = async (filename) => {
    setRunStatus('running');
    setCurrentPhase('Writing');

    const eligible = await loadEligibleForWrite(APPROVED_FOLDERS);
    const toRetry = eligible.filter(d => d.filename === filename);

    console.log(`[CVP Retry Single] Retrying: ${filename}`, toRetry);
    const { written, failed } = await executeWrites(toRetry);

    setSummary(prev => {
      // Remove this filename from failed list, add back only if it failed again
      const remainingFailed = deduplicateFailed([
        ...(prev.failed || []).filter(f => f.filename !== filename),
        ...failed,
      ]);
      const newWritten = (prev.written || 0) + written;
      const finalPhase = remainingFailed.length === 0 ? 'Complete' : newWritten > 0 ? 'Partial' : 'Failed';
      setCurrentPhase(finalPhase);
      return { ...prev, written: newWritten, failed: remainingFailed };
    });

    setRunStatus('done');
  };

  // ── Single-file diagnostic test (no new generation, uses existing approved backend record) ──
  const [diagResult, setDiagResult] = useState(null);
  const [diagRunning, setDiagRunning] = useState(false);

  const handleDiagnosticTest = async () => {
    setDiagRunning(true);
    setDiagResult(null);
    const TARGET = 'trust_entity_governance_sop.md';
    console.log(`[CVP Diag] Starting single-file diagnostic for: ${TARGET}`);
    try {
      const eligible = await loadEligibleForWrite(APPROVED_FOLDERS);
      const match = eligible.find(d => d.filename === TARGET);
      if (!match) {
        setDiagResult({ ok: false, msg: `No approved eligible draft found for "${TARGET}". Run the full workflow first to generate+approve it.` });
        setDiagRunning(false);
        return;
      }
      console.log(`[CVP Diag] Found draft: id=${match.id} folder=${match.targetFolder} contentLen=${(match.content||'').length}`);
      const { written, failed } = await executeWrites([match]);
      if (written > 0) {
        setDiagResult({ ok: true, msg: `✅ SUCCESS: ${TARGET} written to vault.` });
      } else {
        const f = failed[0];
        setDiagResult({ ok: false, msg: f?.reason || 'Write failed with no reason', bridgeSummary: f?.bridgeSummary });
      }
    } catch (e) {
      setDiagResult({ ok: false, msg: e?.message || 'Diagnostic failed' });
    }
    setDiagRunning(false);
  };

  const isRunning = runStatus === 'running';

  return (
    <div className="border-2 border-primary/60 bg-primary/5 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-primary/10">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
          One-Click Governed Vault Pack
        </span>
        <span className="ml-auto flex items-center gap-1 px-2 py-0.5 text-[6px] font-bold uppercase bg-primary/20 text-primary border border-primary/30 rounded-sm">
          <Database className="w-2.5 h-2.5" /> BACKEND STORAGE · NO API · NO DISPATCH
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* Flow visualizer */}
        <div className="flex items-center gap-1.5 flex-wrap text-[7px] font-mono text-slate-500">
          {[
            'Generate',
            'Save to Backend',
            'Auto-Approve',
            'Write to Vault',
          ].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span className="px-2 py-1 rounded-sm border border-border/30 text-slate-500">
                {label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Storage mode notice */}
        <div className="text-[7px] font-mono text-slate-500 bg-card border border-primary/20 rounded-sm px-3 py-2 space-y-0.5">
          <div className="font-bold text-primary/70 uppercase text-[6px] tracking-widest mb-1">Storage Mode: Backend-Backed</div>
          <div>✅ Drafts → <span className="text-slate-300">VeridanObsidianDraft entity (Base44 backend)</span></div>
          <div>✅ Audits → <span className="text-slate-300">VeridanObsidianWriteAudit entity (Base44 backend)</span></div>
          <div>✅ localStorage → <span className="text-slate-300">lightweight cache only (no large content)</span></div>
          <div>❌ <span className="text-slate-500">localStorage capacity no longer limits draft generation</span></div>
        </div>

        {/* Auto-approval gate notice */}
        <div className="text-[7px] font-mono text-slate-500 bg-card border border-border/30 rounded-sm px-3 py-2 space-y-0.5">
          <div className="font-bold text-slate-400 uppercase text-[6px] tracking-widest mb-1">Auto-Approval Gate</div>
          <div>✅ source === "CORE_VAULT_PACK" · riskLevel === "LOW" · executionStatus === "NOT_EXECUTED"</div>
          <div>✅ targetFolder in allowlist · draftType in CVP types · no credential fields</div>
          <div>❌ Manual / imported / AI / browser drafts → never auto-approved</div>
        </div>

        {/* DIAGNOSTIC TEST BUTTON */}
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm p-3 space-y-2">
          <div className="text-[7px] font-bold uppercase text-amber-500 tracking-widest">Single-File Diagnostic — trust_entity_governance_sop.md</div>
          <div className="text-[6px] font-mono text-slate-500">Uses existing approved backend draft only. No new generation.</div>
          <button
            type="button"
            onClick={handleDiagnosticTest}
            disabled={diagRunning || isRunning}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
          >
            {diagRunning ? <><Loader2 className="w-3 h-3 animate-spin" /> Testing…</> : '▶ Test Write: trust_entity_governance_sop.md'}
          </button>
          {diagResult && (
            <div className={`text-[7px] font-mono rounded-sm px-2 py-2 space-y-1 border ${diagResult.ok ? 'text-primary bg-primary/5 border-primary/30' : 'text-destructive bg-destructive/5 border-destructive/30'}`}>
              <div className="font-bold break-all">{diagResult.msg}</div>
              {diagResult.bridgeSummary && (
                <pre className="text-[6px] text-slate-400 whitespace-pre-wrap break-all overflow-auto max-h-32">{JSON.stringify(diagResult.bridgeSummary, null, 2)}</pre>
              )}
            </div>
          )}
        </div>

        {/* PRIMARY BUTTON */}
         <button
           type="button"
           onClick={handleRunGoverned}
           disabled={isRunning}
           className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/25 border-2 border-primary/60 text-primary hover:bg-primary/35 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm font-bold text-[11px] uppercase tracking-widest transition-colors"
         >
           {isRunning
             ? <><Loader2 className="w-4 h-4 animate-spin" /> {currentPhase}</>
             : <><Zap className="w-4 h-4" /> Run Governed Vault Pack</>}
         </button>

         {/* Debug line */}
         <div className="text-[6px] font-mono text-slate-600 text-center">
           {summary ? `gen:${summary.generated} saved:${summary.savedToBackend} appr:${summary.autoApproved} writ:${summary.written}${errorMsg ? ` err: ${errorMsg.split(' — ')[1]?.slice(0, 60) || ''}` : ''}` : ''}
         </div>

        {/* Live status phase + counts */}
        {runStatus === 'running' && (
          <div className="space-y-1.5">
            <div className="text-[8px] font-bold text-primary text-center">
              Phase: {currentPhase}
            </div>
          </div>
        )}

        {runStatus === 'done' && (
          <div className="space-y-2 text-center">
            {/* Phase indicator */}
            <div className={`text-[8px] font-bold ${currentPhase === 'Complete' ? 'text-primary' : currentPhase === 'Partial' ? 'text-accent' : 'text-destructive'}`}>
              Phase: {currentPhase}
            </div>

            {/* Counts display */}
            <div className="text-[7px] font-mono text-slate-400 space-y-0.5">
              <div>Generated: <span className="text-slate-200">{summary?.generated || 0}</span></div>
              <div>Saved: <span className="text-slate-200">{summary?.savedToBackend || 0}</span></div>
              <div>Approved: <span className="text-slate-200">{summary?.autoApproved || 0}</span></div>
              <div>Written: <span className="text-slate-200">{summary?.written || 0}</span></div>
              {summary?.failed?.length > 0 && (
                <div>Failed: <span className="text-destructive">{summary.failed.length}</span></div>
              )}
            </div>

            {/* Error message if failed */}
            {errorMsg && (
              <div className="text-[7px] font-mono text-destructive/90 bg-destructive/10 border border-destructive/30 rounded-sm px-2 py-1.5">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Result summary */}
        {runStatus === 'done' && summary && (
          <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-3">
            {/* Status message based on actual counts */}
            {(() => {
              let statusMsg = 'Generated Only';
              if (summary.written > 0 && (!summary.failed || summary.failed.length === 0)) statusMsg = 'Complete';
              else if (summary.written > 0 && summary.failed?.length > 0) statusMsg = 'Partial';
              else if (summary.failed?.length > 0 && summary.written === 0) statusMsg = 'Failed';
              else if (summary.autoApproved > 0) statusMsg = 'Saved';
              else if (summary.savedToBackend > 0) statusMsg = 'Saved';
              
              const statusColor = statusMsg === 'Complete' ? 'text-primary' : statusMsg === 'Partial' ? 'text-accent' : 'text-destructive';
              const StatusIcon = statusMsg === 'Complete' ? CheckCircle2 : AlertCircle;

              return (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className={`flex items-center gap-2 text-[9px] font-bold ${statusColor}`}>
                    <StatusIcon className="w-3.5 h-3.5" /> Vault Pack {statusMsg}
                  </div>
                  {summary.written > 0 && (
                    <Link
                      to="/vault-file-index"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-mono font-bold border border-primary/40 text-primary bg-primary/15 hover:bg-primary/25 rounded-sm transition-colors"
                    >
                      <FolderOpen className="w-3 h-3" /> View Written Files
                    </Link>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[8px] font-mono">
              <div>📦 Generated: <span className="text-primary font-bold">{summary.generated}</span></div>
              <div>💾 Saved to backend: <span className="text-primary font-bold">{summary.savedToBackend}</span></div>
              <div>✅ Auto-Approved: <span className="text-primary font-bold">{summary.autoApproved}</span></div>
              <div>✍️ Written: <span className="text-primary font-bold">{summary.written}</span></div>
              {summary.failed?.length > 0 && (
                <div>❌ Failed: <span className="text-destructive font-bold">{summary.failed.length}</span></div>
              )}
            </div>

            {/* Failed */}
            {summary.failed?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[7px] font-mono text-destructive space-y-0.5">
                  <div className="font-bold">❌ Failed (unique): {summary.failed.length}</div>
                  {summary.failed.map((s, i) => (
                    <div key={i} className="ml-2 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-destructive/70 break-all">— {s.filename}: {s.reason}</span>
                        <button
                          type="button"
                          onClick={() => handleRetrySingle(s.filename)}
                          disabled={isRunning}
                          className="shrink-0 px-2 py-0.5 text-[6px] font-bold uppercase border border-destructive/30 text-destructive/80 hover:bg-destructive/10 disabled:opacity-40 rounded-sm transition-colors"
                        >
                          <RefreshCw className="w-2 h-2 inline mr-0.5" />Retry
                        </button>
                      </div>
                      {s.bridgeSummary && (
                        <pre className="text-[6px] font-mono text-slate-500 bg-background/60 border border-border/20 rounded-sm px-2 py-1 whitespace-pre-wrap break-all overflow-auto max-h-24">{JSON.stringify(s.bridgeSummary, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 disabled:opacity-40 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry All {summary.failed.length} Failed
                </button>
              </div>
            )}

            <button type="button" onClick={reset}
              className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline">
              Reset workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );
}