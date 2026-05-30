/**
 * ApprovedDraftWriteButton
 * Button to write approved Obsidian drafts to vault.
 * Only enables when: APPROVED, LOW risk, NOT_EXECUTED, allowlisted folder.
 * Shows audit record on success.
 */

import React, { useState } from 'react';
import { FileUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

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

export default function ApprovedDraftWriteButton({ draft, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canWrite =
    draft &&
    draft.approvalStatus === 'APPROVED' &&
    draft.riskLevel === 'LOW' &&
    draft.executionStatus === 'NOT_EXECUTED' &&
    draft.targetFolder &&
    APPROVED_FOLDERS.includes(draft.targetFolder);

  const handleWrite = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('obsidianWriteApprovedDraft', {
        draft,
      });

      if (response.data.success) {
        // Save audit record
        const auditRecord = {
          ...response.data.auditRecord,
          draftId: draft.id || 'unknown',
          taskId: draft.taskId || 'unknown',
          filePath: response.data.filePath,
          folder: draft.targetFolder,
          writeStatus: 'COMPLETED_APPROVED_DRAFT_ONLY',
          executionStatus: 'NOT_EXECUTED',
          dispatchStatus: 'NOT_DISPATCHED',
          timestamp: new Date().toISOString(),
        };

        try {
          const audits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');
          audits.unshift(auditRecord);
          if (audits.length > 50) audits.length = 50;
          localStorage.setItem('veridan_obsidian_write_audits', JSON.stringify(audits));
        } catch { /* quota */ }

        setResult(response.data);
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.data.error || 'Write failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to write draft');
    } finally {
      setLoading(false);
    }
  };

  if (!draft) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleWrite}
        disabled={!canWrite || loading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors ${
          canWrite
            ? 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
            : 'bg-secondary/20 border border-border/30 text-slate-500 cursor-not-allowed'
        }`}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing…</>
          : <><FileUp className="w-4 h-4" /> Write Approved Draft to Vault</>}
      </button>

      {!canWrite && draft && (
        <div className="text-[8px] text-slate-500 space-y-0.5">
          {draft.approvalStatus !== 'APPROVED' && <div>✗ Draft not approved</div>}
          {draft.riskLevel !== 'LOW' && <div>✗ Risk level must be LOW</div>}
          {draft.executionStatus !== 'NOT_EXECUTED' && <div>✗ Draft already executed</div>}
          {!draft.targetFolder || !APPROVED_FOLDERS.includes(draft.targetFolder) && <div>✗ Target folder not approved</div>}
        </div>
      )}

      {result && (
        <div className="border border-primary/30 bg-primary/5 rounded-sm p-3 space-y-2">
          <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Draft Written Successfully
          </div>
          <div className="text-[8px] text-slate-400 space-y-1 font-mono">
            <div>filePath: <span className="text-primary">{result.filePath}</span></div>
            <div>auditId: <span className="text-primary">{result.auditRecord.auditId}</span></div>
            <div>filesystemWrite: <span className="text-primary">{result.auditRecord.filesystemWrite}</span></div>
            <div>executionStatus: <span className="text-destructive">{result.auditRecord.executionStatus}</span></div>
            <div>dispatchStatus: <span className="text-destructive">{result.auditRecord.dispatchStatus}</span></div>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-3 space-y-2">
          <div className="flex items-center gap-2 text-[9px] font-bold text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            Write Failed
          </div>
          <div className="text-[8px] text-slate-400">{error}</div>
        </div>
      )}
    </div>
  );
}