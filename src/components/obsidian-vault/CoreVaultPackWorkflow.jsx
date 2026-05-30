/**
 * CoreVaultPackWorkflow
 * True one-click governed vault pack workflow.
 * RUN GOVERNED VAULT PACK button: Generate → Auto-Approve (CORE_VAULT_PACK only) → Write All
 *
 * Auto-approval gate requires ALL of:
 *   - source === "CORE_VAULT_PACK"
 *   - riskLevel === "LOW"
 *   - targetFolder in APPROVED_FOLDERS
 *   - draftType in ALLOWED_DRAFT_TYPES
 *   - executionStatus === "NOT_EXECUTED"
 *   - dispatchStatus === "NOT_DISPATCHED"
 *   - openclawCall === "NOT_SENT"
 *
 * Manual / custom / imported drafts are NEVER auto-approved.
 * Backend obsidianWriteApprovedDraft still hard-gates every write.
 * No API calls. No InvokeLLM. No OpenClaw dispatch. No browser automation. No credentials.
 */

import React, { useState, useCallback } from 'react';
import { Zap, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CoreVaultPackGenerator from './CoreVaultPackGenerator';
import { buildDrafts } from './cvpTemplates';

// Must match obsidianWriteApprovedDraft backend allowlist exactly
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

// Only hardcoded CVP template types may be auto-approved
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
  'MANUAL_MARKDOWN', // also allowed by backend
];

// A draft is "already written" ONLY when both conditions are true
function isAlreadyWritten(d) {
  return d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' && !!d.filePath;
}

// Auto-approval gate: ONLY CORE_VAULT_PACK source drafts qualify
function isAutoApprovable(d) {
  return (
    d.source === 'CORE_VAULT_PACK' &&
    d.riskLevel === 'LOW' &&
    d.approvalStatus === 'PENDING_REVIEW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    d.dispatchStatus === 'NOT_DISPATCHED' &&
    d.openclawCall === 'NOT_SENT' &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    ALLOWED_CVP_DRAFT_TYPES.includes(d.draftType) &&
    !d.credentialRef &&
    !d.brokerKey &&
    !d.apiKey
  );
}

// Write eligibility: APPROVED + LOW + NOT_EXECUTED + allowlisted + not already written
function isEligibleForWrite(d) {
  return (
    d.approvalStatus === 'APPROVED' &&
    d.riskLevel === 'LOW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    !isAlreadyWritten(d)
  );
}

function loadDrafts() {
  try {
    const raw = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function saveDrafts(drafts) {
  localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(drafts));
}

// ── Shared write executor ────────────────────────────────────────────────────
async function executeWrites(toWrite) {
  let written = 0;
  const alreadyWritten = [];
  const failed = [];

  for (const draft of toWrite) {
    if (isAlreadyWritten(draft)) {
      alreadyWritten.push({ filename: draft.filename, reason: 'filesystemWrite + filePath already set' });
      continue;
    }

    let response;
    try {
      response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft });
    } catch (invokeErr) {
      // 400/500 — DO NOT mark draft as written; remains retryable
      const backendErrors = invokeErr?.response?.data?.errors;
      const backendError = invokeErr?.response?.data?.error;
      const reason = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.join(' | ')
        : (backendError || invokeErr.message || 'Backend error');
      failed.push({ id: draft.id, filename: draft.filename, reason });
      continue;
    }

    if (response.data.success) {
      const filePath = response.data.filePath;

      // Audit record
      const auditRecord = {
        ...response.data.auditRecord,
        auditId: response.data.auditRecord?.auditId || `AUDIT-${Date.now().toString(36).toUpperCase()}-CVP`,
        draftId: draft.id || 'unknown',
        filename: draft.filename,
        folder: draft.targetFolder,
        filePath,
        timestamp: new Date().toISOString(),
        filesystemWrite: 'COMPLETED_APPROVED_DRAFT_ONLY',
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        openclawCall: 'NOT_SENT',
        approvalStatus: 'APPROVED',
        riskLevel: 'LOW',
      };
      try {
        const audits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');
        audits.unshift(auditRecord);
        if (audits.length > 50) audits.length = 50;
        localStorage.setItem('veridan_obsidian_write_audits', JSON.stringify(audits));
      } catch { /* quota */ }

      // Mark written in storage — set BOTH filesystemWrite AND filePath (required by isAlreadyWritten)
      try {
        const current = loadDrafts();
        const idx = current.findIndex(x => x.id === draft.id);
        if (idx >= 0) {
          current[idx].writtenAt = new Date().toISOString();
          current[idx].filesystemWrite = 'COMPLETED_APPROVED_DRAFT_ONLY';
          current[idx].filePath = filePath;
          saveDrafts(current);
        }
      } catch { /* quota */ }

      written++;
    } else {
      // Backend success=false — retriable, do NOT mark as written
      failed.push({ id: draft.id, filename: draft.filename, reason: response.data.error || 'Write returned failure' });
    }
  }

  return { written, alreadyWritten, failed };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CoreVaultPackWorkflow() {
  const [runStatus, setRunStatus] = useState('idle'); // idle | running | done | error
  const [summary, setSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const reset = useCallback(() => {
    setRunStatus('idle');
    setSummary(null);
    setErrorMsg('');
  }, []);

  // ── ONE-CLICK: Generate → Auto-Approve → Write ───────────────────────────
  const handleRunGoverned = async () => {
    setRunStatus('running');
    setSummary(null);
    setErrorMsg('');

    // ── Phase 1: Generate ────────────────────────────────────────────────────
    const now = new Date().toISOString();
    const freshDrafts = buildDrafts(now);

    // Save generated drafts (preserve existing approved drafts)
    const existing = loadDrafts();
    const approvedExisting = existing.filter(d => d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT');
    const pendingExisting = existing.filter(d => d.approvalStatus !== 'APPROVED' && d.approvalState !== 'APPROVED_DRAFT');

    const newKeys = new Set(freshDrafts.map(d => `${d.filename}||${d.targetFolder}||${d.draftType}`));
    const filteredPending = pendingExisting.filter(d => {
      const key = `${d.filename}||${d.targetFolder}||${d.draftType}`;
      return !newKeys.has(key);
    });

    const merged = [...approvedExisting, ...freshDrafts, ...filteredPending.slice(0, 5)];
    try { saveDrafts(merged); } catch { /* quota — continue */ }

    const generated = freshDrafts.length;

    // ── Phase 2: Auto-Approve (CORE_VAULT_PACK source only) ─────────────────
    const draftsAfterGen = loadDrafts();
    let autoApproved = 0;
    let skippedApproval = 0;

    for (const d of draftsAfterGen) {
      if (!isAutoApprovable(d)) {
        // Count only CVP drafts that were skipped (not unrelated manual drafts)
        if (d.source === 'CORE_VAULT_PACK' && d.approvalStatus === 'PENDING_REVIEW') skippedApproval++;
        continue;
      }
      d.approvalStatus = 'APPROVED';
      d.approvalState = 'APPROVED_DRAFT';
      d.approvedAt = new Date().toISOString();
      d.autoApprovedBy = 'GOVERNED_VAULT_PACK_WORKFLOW';
      autoApproved++;
    }

    try { saveDrafts(draftsAfterGen); } catch { /* quota */ }

    // ── Phase 3: Write all eligible approved CVP drafts ──────────────────────
    const draftsToWrite = loadDrafts().filter(d =>
      isEligibleForWrite(d) && d.source === 'CORE_VAULT_PACK'
    );
    const alreadyWrittenBefore = loadDrafts().filter(d =>
      isAlreadyWritten(d) && d.source === 'CORE_VAULT_PACK'
    ).length;

    const { written, alreadyWritten, failed } = await executeWrites(draftsToWrite);

    setSummary({
      generated,
      autoApproved,
      skippedApproval,
      written,
      alreadyWritten: alreadyWritten.length + alreadyWrittenBefore,
      alreadyWrittenDetails: alreadyWritten,
      failed,
    });
    setRunStatus('done');
  };

  // ── Retry failed writes ───────────────────────────────────────────────────
  const handleRetryFailed = async () => {
    if (!summary?.failed?.length) return;
    setRunStatus('running');

    const failedIds = new Set(summary.failed.map(f => f.id));
    const toRetry = loadDrafts().filter(d => failedIds.has(d.id) && isEligibleForWrite(d));
    const { written, alreadyWritten, failed } = await executeWrites(toRetry);

    setSummary(prev => ({
      ...prev,
      written: (prev.written || 0) + written,
      alreadyWritten: (prev.alreadyWritten || 0) + alreadyWritten.length,
      failed,
    }));
    setRunStatus('done');
  };

  // ── Derived live counts ───────────────────────────────────────────────────
  const drafts = loadDrafts();
  const cvpDrafts = drafts.filter(d => d.source === 'CORE_VAULT_PACK');
  const alreadyWrittenCount = cvpDrafts.filter(d => isAlreadyWritten(d)).length;
  const pendingCount = cvpDrafts.filter(d => d.approvalStatus === 'PENDING_REVIEW').length;
  const approvedCount = cvpDrafts.filter(d => isEligibleForWrite(d)).length;

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
          <Shield className="w-2.5 h-2.5" /> LOCAL · NO API · NO DISPATCH
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* Flow visualizer */}
        <div className="flex items-center gap-1.5 flex-wrap text-[7px] font-mono text-slate-500">
          {[
            { label: 'Generate', done: cvpDrafts.length > 0 },
            { label: 'Auto-Approve', done: approvedCount > 0 || alreadyWrittenCount > 0 },
            { label: 'Write to Vault', done: alreadyWrittenCount > 0 },
          ].map(({ label, done }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span className={`px-2 py-1 rounded-sm border ${done ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border/30 text-slate-500'}`}>
                {done && '✓ '}{label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Live status counters */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Pending Approval', value: pendingCount, color: 'text-amber-400' },
            { label: 'Ready to Write', value: approvedCount, color: 'text-primary' },
            { label: 'Written', value: alreadyWrittenCount, color: 'text-primary' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border/30 rounded-sm p-2 text-center">
              <div className="text-[6px] uppercase text-slate-500 mb-0.5">{label}</div>
              <div className={`text-base font-mono font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Auto-approval gate notice */}
        <div className="text-[7px] font-mono text-slate-500 bg-card border border-border/30 rounded-sm px-3 py-2 space-y-0.5">
          <div className="font-bold text-slate-400 uppercase text-[6px] tracking-widest mb-1">Auto-Approval Gate</div>
          <div>✅ <span className="text-slate-300">source === "CORE_VAULT_PACK"</span> · riskLevel === "LOW" · executionStatus === "NOT_EXECUTED"</div>
          <div>✅ targetFolder in allowlist · draftType in CVP allowed types · no credential fields</div>
          <div>❌ <span className="text-slate-400">Manual / imported / AI-generated / browser drafts → never auto-approved</span></div>
        </div>

        {/* PRIMARY BUTTON */}
        <button
          type="button"
          onClick={handleRunGoverned}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/25 border-2 border-primary/60 text-primary hover:bg-primary/35 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm font-bold text-[11px] uppercase tracking-widest transition-colors"
        >
          {isRunning
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Governed Vault Pack…</>
            : <><Zap className="w-4 h-4" /> Run Governed Vault Pack</>}
        </button>

        {/* Result summary */}
        {runStatus === 'done' && summary && (
          <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-3">
            <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" /> Governed Vault Pack Complete
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[8px] font-mono">
              <div>📦 Generated: <span className="text-primary font-bold">{summary.generated}</span></div>
              <div>✅ Auto-Approved: <span className="text-primary font-bold">{summary.autoApproved}</span></div>
              <div>✍️ Written: <span className="text-primary font-bold">{summary.written}</span></div>
              <div>⏭ Skipped (written): <span className="text-slate-400">{summary.alreadyWritten}</span></div>
            </div>

            {/* Skipped details */}
            {summary.alreadyWrittenDetails?.length > 0 && (
              <div className="text-[7px] font-mono text-slate-500 space-y-0.5">
                <div className="text-slate-400 font-bold">Already written (skipped):</div>
                {summary.alreadyWrittenDetails.map((s, i) => (
                  <div key={i} className="ml-2">— {s.filename}</div>
                ))}
              </div>
            )}

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

            <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2">
              executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT · no API credits used
            </div>
            <button type="button" onClick={reset}
              className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline">
              Reset workflow
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Separator: manual step-by-step below */}
        <div className="border-t border-border/30 pt-3">
          <div className="text-[7px] font-bold uppercase text-slate-500 tracking-widest mb-2">
            Or run steps individually:
          </div>
          <CoreVaultPackGenerator onBatchCreated={() => {}} />
        </div>

        <div className="text-[6px] font-mono text-slate-600">
          All steps: localStorage only · obsidianWriteApprovedDraft backend · no API credits · no credentials · no OpenClaw dispatch
        </div>
      </div>
    </div>
  );
}