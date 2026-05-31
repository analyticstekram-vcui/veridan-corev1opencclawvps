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
  const alreadyWritten = [];
  const failed = [];

  for (const draft of toWrite) {
    // Build a shape compatible with obsidianWriteApprovedDraft
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

    let response;
    try {
      response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft: draftPayload });
    } catch (invokeErr) {
      const backendErrors = invokeErr?.response?.data?.errors;
      const backendError = invokeErr?.response?.data?.error;
      const reason = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.join(' | ')
        : (backendError || invokeErr.message || 'Backend error');
      failed.push({ id: draft.id || draft.draftId, filename: draft.filename, reason });
      continue;
    }

    if (response.data.success) {
      const filePath = response.data.filePath;

      // Build audit record
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

      // Save audit to backend (primary) + localStorage (cache)
      await saveAuditToBackend(auditRecord);
      try {
        const audits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');
        // Strip content from cache entry
        const cacheEntry = { ...auditRecord };
        delete cacheEntry.content;
        audits.unshift(cacheEntry);
        if (audits.length > 20) audits.length = 20; // Keep cache small
        localStorage.setItem('veridan_obsidian_write_audits', JSON.stringify(audits));
      } catch { /* quota — cache not critical, backend has authoritative copy */ }

      // Mark draft written in backend
      if (draft.id) {
        await markDraftWritten(draft.id, filePath).catch(() => {});
      }

      written++;
    } else {
      failed.push({ id: draft.id || draft.draftId, filename: draft.filename, reason: response.data.error || 'Write returned failure' });
    }
  }

  return { written, alreadyWritten, failed };
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

    try {
      console.log('[CVP Workflow] Starting governed vault pack workflow');

      // ── Phase 1: Generate ────────────────────────────────────────────────────
      console.log('[CVP Workflow] Phase 1: Generating drafts');
      const now = new Date().toISOString();
      const freshDrafts = buildDrafts(now);
      const generated = freshDrafts.length;
      console.log(`[CVP Workflow] Generated ${generated} drafts`);
      if (generated === 0) throw new Error('No drafts generated');

      // ── Phase 2: Save to backend ─────────────────────────────────────────────
      console.log('[CVP Workflow] Phase 2: Saving to backend');
      setCurrentPhase('Saving');
      const saveResult = await saveDraftsToBackend(freshDrafts);
      if (!saveResult || typeof saveResult.saved !== 'number') {
        throw new Error('saveDraftsToBackend returned invalid result: ' + JSON.stringify(saveResult));
      }
      const savedCount = saveResult.saved;
      const saveErrors = saveResult.failed || [];
      console.log(`[CVP Workflow] Saved ${savedCount}/${generated} drafts to backend`, saveResult);
      
      // Log any save failures for debugging
      if (saveErrors.length > 0) {
        console.error('[CVP Workflow] Save failures:', saveErrors);
      }
      
      // VALIDATION: Stop if nothing saved
      if (savedCount === 0) {
        const errorDetail = saveErrors.length > 0
          ? `All saves failed: ${saveErrors[0]?.reason || 'unknown error'}`
          : 'No drafts were saved to backend';
        throw new Error(`STOPPED: Generated drafts did not save to backend — ${errorDetail}`);
      }

      // ── Phase 3: Auto-Approve (backend, CORE_VAULT_PACK source only) ─────────
      console.log('[CVP Workflow] Phase 3: Auto-approving');
      setCurrentPhase('Auto-Approving');
      const approveResult = await autoApproveCVPDrafts(APPROVED_FOLDERS, ALLOWED_CVP_DRAFT_TYPES);
      if (!approveResult || typeof approveResult.approved !== 'number') {
        throw new Error('autoApproveCVPDrafts returned invalid result: ' + JSON.stringify(approveResult));
      }
      const autoApproved = approveResult.approved;
      console.log(`[CVP Workflow] Auto-approved ${autoApproved} drafts`);
      
      // VALIDATION: Stop if nothing approved
      if (autoApproved === 0) {
        throw new Error('STOPPED: Saved drafts were not approved');
      }

      // ── Phase 4: Load eligible approved drafts from backend ──────────────────
      console.log('[CVP Workflow] Phase 4: Loading eligible drafts');
      setCurrentPhase('Writing');
      const toWrite = await loadEligibleForWrite(APPROVED_FOLDERS);
      if (!Array.isArray(toWrite)) {
        throw new Error('loadEligibleForWrite returned invalid result: ' + JSON.stringify(toWrite));
      }
      const cvpToWrite = toWrite.filter(d => d.source === 'CORE_VAULT_PACK');
      console.log(`[CVP Workflow] Loaded ${toWrite.length} total eligible drafts, ${cvpToWrite.length} are CORE_VAULT_PACK`);

      // Count already-written CVP drafts (have filePath set, filesystemWrite = COMPLETED)
      const alreadyWrittenCount = toWrite.filter(d =>
        d.source === 'CORE_VAULT_PACK' &&
        d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY'
      ).length;

      // ── Phase 5: Write ────────────────────────────────────────────────────────
      console.log(`[CVP Workflow] Phase 5: Writing ${cvpToWrite.length} drafts`);
      const writeResult = await executeWrites(cvpToWrite);
      if (!writeResult || typeof writeResult.written !== 'number') {
        throw new Error('executeWrites returned invalid result: ' + JSON.stringify(writeResult));
      }
      const { written, failed } = writeResult;
      console.log(`[CVP Workflow] Written ${written} drafts, ${failed?.length || 0} failed`);
      
      // VALIDATION: Stop if nothing written
      if (written === 0) {
        throw new Error('STOPPED: Approved drafts were not written');
      }

      const finalSummary = {
        generated,
        savedToBackend: savedCount,
        autoApproved,
        written,
        alreadyWritten: alreadyWrittenCount,
        failed: failed || [],
        writtenFilenames: cvpToWrite
          .filter((_, i) => !failed?.find(f => f.filename === cvpToWrite[i]?.filename))
          .map(d => d.filename),
      };
      
      console.log('[CVP Workflow] Workflow complete:', finalSummary);
      setSummary(finalSummary);
      setCurrentPhase('Complete');
      setRunStatus('done');
    } catch (err) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[CVP Workflow] Workflow failed:', errorMsg, err);
      setErrorMsg(errorMsg);
      setCurrentPhase('Failed');
      setRunStatus('done');
    }
  };

  // ── Retry failed writes ───────────────────────────────────────────────────
  const handleRetryFailed = async () => {
    if (!summary?.failed?.length) return;
    setRunStatus('running');
    setCurrentPhase('Writing');

    const failedFilenames = new Set(summary.failed.map(f => f.filename));
    const eligible = await loadEligibleForWrite(APPROVED_FOLDERS);
    const toRetry = eligible.filter(d => failedFilenames.has(d.filename));
    const { written, failed } = await executeWrites(toRetry);

    setSummary(prev => ({
      ...prev,
      written: (prev.written || 0) + written,
      failed: failed || [],
    }));
    setCurrentPhase('Complete');
    setRunStatus('done');
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
            <div className={`text-[8px] font-bold ${currentPhase === 'Complete' ? 'text-primary' : 'text-destructive'}`}>
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
              if (summary.written > 0) statusMsg = 'Complete';
              else if (summary.autoApproved > 0) statusMsg = 'Saved';
              else if (summary.savedToBackend > 0) statusMsg = 'Saved';
              
              return (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Vault Pack {statusMsg}
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
                  <div className="font-bold">❌ Failed (retriable): {summary.failed.length}</div>
                  {summary.failed.map((s, i) => (
                    <div key={i} className="ml-2 text-destructive/70">— {s.filename}: {s.reason}</div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 disabled:opacity-40 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry {summary.failed.length} Failed Write(s)
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