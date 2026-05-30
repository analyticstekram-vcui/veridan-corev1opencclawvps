/**
 * CoreVaultPackWorkflow
 * One-click panel: Generate → Approve All → Write All for the Core Vault Pack.
 * No API calls. No OpenClaw dispatch. No browser automation. No credentials.
 * All writes reuse the existing obsidianWriteApprovedDraft backend path.
 */

import React, { useState, useCallback } from 'react';
import { Package, CheckCircle2, FileUp, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CoreVaultPackGenerator from './CoreVaultPackGenerator';

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
];

function isEligibleForApproval(d) {
  return (
    d.riskLevel === 'LOW' &&
    d.approvalStatus === 'PENDING_REVIEW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    d.dispatchStatus === 'NOT_DISPATCHED' &&
    APPROVED_FOLDERS.includes(d.targetFolder)
  );
}

function isEligibleForWrite(d) {
  return (
    d.approvalStatus === 'APPROVED' &&
    d.riskLevel === 'LOW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    !(d.writtenAt || d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY')
  );
}

function loadDraftsFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export default function CoreVaultPackWorkflow() {
  const [step, setStep] = useState('idle'); // idle | approving | approved | writing | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const refresh = useCallback(() => {
    setStep('idle');
    setResult(null);
    setErrorMsg('');
  }, []);

  // ── Step: Approve all eligible CVP drafts ──────────────────────────────────
  const handleApproveAll = () => {
    setStep('approving');
    setErrorMsg('');

    try {
      const drafts = loadDraftsFromStorage();
      let approved = 0;
      const skipped = [];

      for (const d of drafts) {
        if (!isEligibleForApproval(d)) {
          if (d.source === 'LOCAL_TEMPLATE_BATCH' || d.draftType?.startsWith('CVP_')) {
            skipped.push(d.filename || d.id);
          }
          continue;
        }
        d.approvalStatus = 'APPROVED';
        d.approvalState = 'APPROVED_DRAFT';
        d.approvedAt = new Date().toISOString();
        approved++;
      }

      localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(drafts));
      setResult(prev => ({ ...(prev || {}), approved, approveSkipped: skipped }));
      setStep('approved');
    } catch (err) {
      setErrorMsg(`Approval failed: ${err.message}`);
      setStep('error');
    }
  };

  // ── Step: Write all eligible approved CVP drafts ───────────────────────────
  const handleWriteAll = async () => {
    setStep('writing');
    setErrorMsg('');

    const drafts = loadDraftsFromStorage();
    const toWrite = drafts.filter(d => isEligibleForWrite(d));
    let written = 0;
    const skipped = [];

    for (const draft of toWrite) {
      try {
        const response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft });

        if (response.data.success) {
          const auditRecord = {
            ...response.data.auditRecord,
            auditId: response.data.auditRecord?.auditId || `AUDIT-${Date.now().toString(36).toUpperCase()}-CVP`,
            draftId: draft.id || 'unknown',
            filename: draft.filename,
            folder: draft.targetFolder,
            filePath: response.data.filePath,
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

          // Mark written
          try {
            const current = loadDraftsFromStorage();
            const idx = current.findIndex(x => x.id === draft.id);
            if (idx >= 0) {
              current[idx].writtenAt = new Date().toISOString();
              current[idx].filesystemWrite = 'COMPLETED_APPROVED_DRAFT_ONLY';
              localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(current));
            }
          } catch { /* quota */ }

          written++;
        } else {
          skipped.push({ filename: draft.filename, reason: response.data.error || 'Write returned failure' });
        }
      } catch (err) {
        skipped.push({ filename: draft.filename, reason: err.message });
      }
    }

    setResult(prev => ({ ...(prev || {}), written, writeSkipped: skipped, total: toWrite.length }));
    setStep('done');
  };

  // ── Derived counts ─────────────────────────────────────────────────────────
  const drafts = loadDraftsFromStorage();
  const pendingCount = drafts.filter(d => isEligibleForApproval(d)).length;
  const approvedCount = drafts.filter(d => isEligibleForWrite(d)).length;
  const writtenCount = drafts.filter(d => d.writtenAt || d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').length;

  return (
    <div className="border border-primary/40 bg-primary/5 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20">
        <Package className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Core Vault Pack Workflow
        </span>
        <span className="ml-auto px-2 py-0.5 text-[6px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 rounded-sm">
          LOCAL ONLY · NO API · NO DISPATCH
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* Flow visualizer */}
        <div className="flex items-center gap-1.5 flex-wrap text-[7px] font-mono text-slate-500">
          {[
            { label: 'Generate', done: writtenCount > 0 || approvedCount > 0 || pendingCount > 0 },
            { label: 'Approve All', done: approvedCount > 0 || writtenCount > 0 },
            { label: 'Write All', done: writtenCount > 0 },
          ].map(({ label, done }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span className={`px-2 py-1 rounded-sm border ${done ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/30 text-slate-500'}`}>
                {done && '✓ '}{label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Live status */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Pending Approval', value: pendingCount, color: 'text-amber-400' },
            { label: 'Ready to Write', value: approvedCount, color: 'text-primary' },
            { label: 'Written', value: writtenCount, color: 'text-primary' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border/30 rounded-sm p-2 text-center">
              <div className="text-[6px] uppercase text-slate-500 mb-0.5">{label}</div>
              <div className={`text-base font-mono font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Generate */}
        <div className="space-y-1">
          <div className="text-[7px] font-bold uppercase text-slate-400 tracking-widest">Step 1 — Generate Drafts</div>
          <CoreVaultPackGenerator onBatchCreated={() => {}} />
        </div>

        {/* Step 2: Approve All */}
        <div className="space-y-1">
          <div className="text-[7px] font-bold uppercase text-slate-400 tracking-widest">Step 2 — Approve All Eligible LOW-Risk Drafts</div>
          <button
            type="button"
            onClick={handleApproveAll}
            disabled={step === 'approving' || step === 'writing' || pendingCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            {step === 'approving'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</>
              : <><CheckCircle2 className="w-4 h-4" /> Approve All Eligible LOW-Risk Drafts ({pendingCount} pending)</>}
          </button>
          {(step === 'approved' || step === 'done') && result?.approved !== undefined && (
            <div className="text-[7px] font-mono text-primary">
              ✓ {result.approved} draft(s) approved
              {result.approveSkipped?.length > 0 && ` · ${result.approveSkipped.length} skipped (not eligible)`}
            </div>
          )}
        </div>

        {/* Step 3: Write All */}
        <div className="space-y-1">
          <div className="text-[7px] font-bold uppercase text-slate-400 tracking-widest">Step 3 — Write All Approved Drafts to Vault</div>
          <button
            type="button"
            onClick={handleWriteAll}
            disabled={step === 'approving' || step === 'writing' || approvedCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            {step === 'writing'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing to vault…</>
              : <><FileUp className="w-4 h-4" /> Write All Approved Eligible Drafts ({approvedCount} ready)</>}
          </button>
        </div>

        {/* Done result */}
        {step === 'done' && result && (
          <div className="border border-primary/30 bg-primary/5 rounded-sm p-3 space-y-2">
            <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vault Pack Written
            </div>
            <div className="text-[7px] font-mono text-slate-400 space-y-0.5">
              <div>Written: <span className="text-primary">{result.written}</span></div>
              {result.writeSkipped?.length > 0 && (
                <div>Skipped: <span className="text-amber-400">{result.writeSkipped.length}</span>
                  {result.writeSkipped.map((s, i) => (
                    <div key={i} className="ml-2 text-slate-500">— {s.filename}: {s.reason}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-1">
              executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT
            </div>
            <button type="button" onClick={refresh}
              className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline">Reset workflow</button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
          </div>
        )}

        <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2">
          All steps: localStorage only · obsidianWriteApprovedDraft backend · no API credits · no credentials · no OpenClaw dispatch
        </div>
      </div>
    </div>
  );
}