/**
 * BatchDraftReview
 * Batch approve and write multiple LOW-risk, allowlisted Obsidian drafts.
 * No API calls. No OpenClaw dispatch. No browser automation. No credentials.
 * All vault writes reuse the obsidianWriteApprovedDraft backend function.
 * Unapproved / non-LOW / non-allowlisted drafts are blocked at every gate.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Square, FileUp, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, SkipForward,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Constants ────────────────────────────────────────────────────────────────

// Must match ApprovedDraftWriteButton + obsidianWriteApprovedDraft allowlist exactly
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

const ELIGIBLE_DRAFT_TYPES = [
  'MANUAL_MARKDOWN',
  'TEMPLATE_OPENCLAW_SOP',
  'TEMPLATE_DAILY_OPS_SOP',
  'TEMPLATE_TRADING_SOP',
  'TEMPLATE_CREDIT_SOP',
  'TEMPLATE_TRUST_ENTITY_SOP',
  'TEMPLATE_SYSTEM_GOVERNANCE',
  'TEMPLATE_AUDIT_EVIDENCE',
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
];

const FILTERS = ['All', 'Pending Review', 'Approved', 'Ready To Write', 'Written'];

// ── Eligibility helpers ───────────────────────────────────────────────────────

function isEligibleForApproval(d) {
  return (
    d.riskLevel === 'LOW' &&
    d.approvalStatus === 'PENDING_REVIEW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    d.dispatchStatus === 'NOT_DISPATCHED' &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    ELIGIBLE_DRAFT_TYPES.includes(d.draftType)
  );
}

function isAlreadyWritten(d) {
  return d.writtenAt || d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY';
}

function isEligibleForWrite(d, allowOverwrite = false) {
  if (!allowOverwrite && isAlreadyWritten(d)) return false;
  return (
    d.approvalStatus === 'APPROVED' &&
    d.riskLevel === 'LOW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    APPROVED_FOLDERS.includes(d.targetFolder)
  );
}

function buildSkipReason(d) {
  if (d.approvalStatus !== 'APPROVED') return 'Not approved';
  if (d.riskLevel !== 'LOW') return 'Risk level not LOW';
  if (d.executionStatus !== 'NOT_EXECUTED') return 'Already executed';
  if (!APPROVED_FOLDERS.includes(d.targetFolder)) return 'Folder not in allowlist';
  if (isAlreadyWritten(d)) return 'Already written — skipped';
  return 'Unknown';
}

function applyFilter(drafts, filter) {
  switch (filter) {
    case 'Pending Review': return drafts.filter(d => d.approvalStatus === 'PENDING_REVIEW');
    case 'Approved': return drafts.filter(d => d.approvalStatus === 'APPROVED' && !isAlreadyWritten(d));
    case 'Ready To Write': return drafts.filter(d => isEligibleForWrite(d));
    case 'Written': return drafts.filter(d => isAlreadyWritten(d));
    default: return drafts;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ d }) {
  if (isAlreadyWritten(d))
    return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 rounded-sm">WRITTEN</span>;
  if (d.approvalStatus === 'APPROVED')
    return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 rounded-sm">APPROVED</span>;
  if (d.approvalStatus === 'PENDING_REVIEW')
    return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm">PENDING</span>;
  return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-secondary/30 text-slate-400 border border-border/20 rounded-sm">{d.approvalStatus}</span>;
}

function StatusSummary({ drafts }) {
  const total = drafts.length;
  const pending = drafts.filter(d => d.approvalStatus === 'PENDING_REVIEW').length;
  const approved = drafts.filter(d => d.approvalStatus === 'APPROVED' && !isAlreadyWritten(d)).length;
  const readyToWrite = drafts.filter(d => isEligibleForWrite(d)).length;
  const written = drafts.filter(d => isAlreadyWritten(d)).length;
  const failed = drafts.filter(d => d.writeError).length;

  const items = [
    { label: 'Total', value: total, color: 'text-slate-300' },
    { label: 'Pending Review', value: pending, color: 'text-amber-400' },
    { label: 'Approved', value: approved, color: 'text-primary' },
    { label: 'Ready to Write', value: readyToWrite, color: 'text-primary' },
    { label: 'Written', value: written, color: 'text-primary' },
    { label: 'Failed Writes', value: failed, color: failed > 0 ? 'text-destructive' : 'text-slate-500' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-card border border-border/30 rounded-sm p-2 text-center">
          <div className="text-[6px] uppercase text-slate-500 mb-0.5">{label}</div>
          <div className={`text-base font-mono font-bold ${color}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BatchDraftReview() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchMode, setBatchMode] = useState('approve'); // 'approve' | 'write'
  const [processing, setProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  const [overwriteConfirmPending, setOverwriteConfirmPending] = useState(false);

  const loadDrafts = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
      setDrafts(Array.isArray(stored) ? stored : []);
    } catch { setDrafts([]); }
    setSelectedIds(new Set());
    setBatchResult(null);
    setOverwriteConfirmPending(false);
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const visible = applyFilter(drafts, filter);

  const eligibleIds = new Set(
    visible
      .filter(d => batchMode === 'approve'
        ? isEligibleForApproval(d)
        : isEligibleForWrite(d, allowOverwrite))
      .map(d => d.id)
  );

  // ── Selection helpers ──────────────────────────────────────────────────────

  const toggleOne = (id) => {
    if (!eligibleIds.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllEligible = () => setSelectedIds(new Set(eligibleIds));
  const clearSelection = () => setSelectedIds(new Set());

  const toggleAll = () => {
    eligibleIds.size > 0 && selectedIds.size === eligibleIds.size
      ? clearSelection()
      : selectAllEligible();
  };

  // ── Batch Approve ──────────────────────────────────────────────────────────
  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    setBatchResult(null);

    try {
      const stored = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
      let approved = 0;
      const skipped = [];

      for (const d of stored) {
        if (!selectedIds.has(d.id)) continue;
        if (!isEligibleForApproval(d)) {
          skipped.push({ id: d.id, filename: d.filename, reason: 'Failed eligibility check at write time' });
          continue;
        }
        d.approvalStatus = 'APPROVED';
        d.approvalState = 'APPROVED_DRAFT';
        d.approvedAt = new Date().toISOString();
        approved++;
      }

      localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(stored));
      setBatchResult({ mode: 'approve', selected: selectedIds.size, approved, written: 0, skipped });
      loadDrafts();
    } catch (err) {
      setBatchResult({ mode: 'approve', selected: selectedIds.size, approved: 0, written: 0, skipped: [], error: err.message });
    } finally {
      setProcessing(false);
    }
  };

  // ── Core write logic (shared by selected + write-all) ─────────────────────
  const executeWrite = async (idsToWrite) => {
    const allDrafts = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
    const toWrite = allDrafts.filter(d => idsToWrite.has(d.id) && isEligibleForWrite(d, allowOverwrite));
    const skipped = allDrafts
      .filter(d => idsToWrite.has(d.id) && !isEligibleForWrite(d, allowOverwrite))
      .map(d => ({ id: d.id, filename: d.filename, reason: buildSkipReason(d) }));

    let written = 0;
    const writeErrors = [];

    for (const draft of toWrite) {
      try {
        const response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft });

        if (response.data.success) {
          const auditRecord = {
            ...response.data.auditRecord,
            auditId: response.data.auditRecord?.auditId || `AUDIT-${Date.now().toString(36).toUpperCase()}-BATCH`,
            draftId: draft.id || 'unknown',
            taskId: draft.taskId || 'unknown',
            filename: draft.filename,
            folder: draft.targetFolder,
            filePath: response.data.filePath,
            timestamp: new Date().toISOString(),
            filesystemWrite: 'COMPLETED_APPROVED_DRAFT_ONLY',
            writeStatus: 'COMPLETED_APPROVED_DRAFT_ONLY',
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

          // Mark draft as written
          try {
            const current = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
            const idx = current.findIndex(x => x.id === draft.id);
            if (idx >= 0) {
              current[idx].writtenAt = new Date().toISOString();
              current[idx].filesystemWrite = 'COMPLETED_APPROVED_DRAFT_ONLY';
              localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(current));
            }
          } catch { /* quota */ }

          written++;
        } else {
          skipped.push({ id: draft.id, filename: draft.filename, reason: response.data.error || 'Write returned failure' });
        }
      } catch (err) {
        writeErrors.push({ id: draft.id, filename: draft.filename, reason: err.message });
      }
    }

    return { written, skipped: [...skipped, ...writeErrors] };
  };

  // ── Write Selected ─────────────────────────────────────────────────────────
  const handleBatchWrite = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    setBatchResult(null);
    const { written, skipped } = await executeWrite(selectedIds);
    setBatchResult({ mode: 'write', selected: selectedIds.size, approved: 0, written, skipped });
    loadDrafts();
    setProcessing(false);
  };

  // ── Write All Approved Eligible ────────────────────────────────────────────
  const handleWriteAllApproved = async () => {
    setProcessing(true);
    setBatchResult(null);
    const allDrafts = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
    const allEligibleIds = new Set(
      allDrafts.filter(d => isEligibleForWrite(d, allowOverwrite)).map(d => d.id)
    );
    if (allEligibleIds.size === 0) {
      setBatchResult({ mode: 'write-all', selected: 0, approved: 0, written: 0, skipped: [{ filename: 'N/A', reason: 'No eligible approved drafts found' }] });
      setProcessing(false);
      return;
    }
    const { written, skipped } = await executeWrite(allEligibleIds);
    setBatchResult({ mode: 'write-all', selected: allEligibleIds.size, approved: 0, written, skipped });
    loadDrafts();
    setProcessing(false);
  };

  const allEligibleSelected = eligibleIds.size > 0 && selectedIds.size === eligibleIds.size;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-4">

      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">Batch Draft Review</div>
          <div className="text-[7px] font-mono text-slate-500 mt-0.5">
            Select LOW-risk drafts to approve or write at once · no API · no dispatch · no credentials
          </div>
        </div>
        <button type="button" onClick={loadDrafts}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase border border-border/30 text-slate-400 hover:text-slate-200 hover:border-border/60 rounded-sm transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Status summary */}
      <StatusSummary drafts={drafts} />

      {/* Mode + filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[7px] text-slate-500 font-mono">Mode:</span>
        {[['approve', 'Approve Drafts'], ['write', 'Write To Vault']].map(([m, label]) => (
          <button key={m} type="button"
            onClick={() => { setBatchMode(m); setSelectedIds(new Set()); setBatchResult(null); setAllowOverwrite(false); }}
            className={`px-3 py-1 text-[7px] font-bold uppercase rounded-sm border transition-colors ${
              batchMode === m ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/30 text-slate-400 hover:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
        <span className="text-[7px] text-slate-500 font-mono ml-2">Filter:</span>
        {FILTERS.map(f => (
          <button key={f} type="button"
            onClick={() => { setFilter(f); setSelectedIds(new Set()); }}
            className={`px-3 py-1 text-[7px] font-bold uppercase rounded-sm border transition-colors ${
              filter === f ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border/30 text-slate-400 hover:text-slate-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Overwrite toggle (write mode only) */}
      {batchMode === 'write' && (
        <div className="flex items-center gap-2">
          {!overwriteConfirmPending ? (
            <button type="button"
              onClick={() => setOverwriteConfirmPending(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-[7px] font-mono border border-border/30 text-slate-500 hover:text-amber-400 hover:border-amber-500/30 rounded-sm transition-colors">
              <SkipForward className="w-3 h-3" />
              {allowOverwrite ? '✓ Overwrite enabled — click to disable' : 'Enable overwrite for already-written drafts'}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-amber-500/30 bg-amber-500/5 rounded-sm">
              <span className="text-[7px] text-amber-400 font-mono">Confirm: allow overwrite of already-written files?</span>
              <button type="button" onClick={() => { setAllowOverwrite(true); setOverwriteConfirmPending(false); }}
                className="px-2 py-0.5 text-[7px] font-bold uppercase border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-sm">Yes</button>
              <button type="button" onClick={() => setOverwriteConfirmPending(false)}
                className="px-2 py-0.5 text-[7px] font-bold uppercase border border-border/30 text-slate-400 hover:text-slate-200 rounded-sm">No</button>
            </div>
          )}
          {allowOverwrite && (
            <button type="button" onClick={() => setAllowOverwrite(false)}
              className="text-[6px] font-mono text-slate-500 hover:text-slate-300 underline">disable overwrite</button>
          )}
        </div>
      )}

      {/* Table */}
      {visible.length === 0 ? (
        <div className="border border-border/30 rounded-sm p-4 text-center text-[8px] text-slate-500 font-mono">
          No drafts match this filter.
        </div>
      ) : (
        <div className="border border-border/30 rounded-sm overflow-x-auto">
          <table className="w-full text-[7px] font-mono">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/30 text-slate-500 uppercase tracking-widest">
                <th className="px-2 py-2 w-8">
                  <button type="button" onClick={toggleAll} title="Toggle all eligible">
                    {allEligibleSelected
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      : <Square className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </th>
                <th className="px-3 py-2 text-left">Filename</th>
                <th className="px-3 py-2 text-left">Folder</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Risk</th>
                <th className="px-3 py-2 text-left">Approval</th>
                <th className="px-3 py-2 text-left">Exec</th>
                <th className="px-3 py-2 text-left">Dispatch</th>
                <th className="px-3 py-2 text-left">Write</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {visible.map((d, i) => {
                const eligible = eligibleIds.has(d.id);
                const checked = selectedIds.has(d.id);
                return (
                  <tr
                    key={d.id || i}
                    onClick={() => toggleOne(d.id)}
                    className={`transition-colors ${eligible ? 'cursor-pointer hover:bg-secondary/20' : 'opacity-40 cursor-not-allowed'} ${checked ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-2 py-2 text-center">
                      {eligible
                        ? checked
                          ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                          : <Square className="w-3.5 h-3.5 text-slate-500" />
                        : <Square className="w-3.5 h-3.5 text-slate-700" />
                      }
                    </td>
                    <td className="px-3 py-2 text-slate-300 max-w-[140px] truncate" title={d.filename}>{d.filename || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-[150px] truncate" title={d.targetFolder}>{d.targetFolder || '—'}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[100px] truncate" title={d.draftType}>{d.draftType || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={d.riskLevel === 'LOW' ? 'text-primary' : 'text-amber-400'}>{d.riskLevel || '—'}</span>
                    </td>
                    <td className="px-3 py-2"><StatusBadge d={d} /></td>
                    <td className="px-3 py-2 text-slate-500">{d.executionStatus || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{d.dispatchStatus || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {isAlreadyWritten(d)
                        ? <span className="text-primary">DONE</span>
                        : <span>{d.filesystemWrite || 'DISABLED'}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action bar */}
      <div className="border border-border/30 rounded-sm px-4 py-3 bg-card space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Selection controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={selectAllEligible}
              disabled={eligibleIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase border border-border/30 text-slate-400 hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm transition-colors">
              <CheckSquare className="w-3 h-3" /> Select All Eligible ({eligibleIds.size})
            </button>
            <button type="button" onClick={clearSelection}
              disabled={!someSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase border border-border/30 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm transition-colors">
              Clear
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {batchMode === 'approve' && (
              <button type="button" onClick={handleBatchApprove}
                disabled={!someSelected || processing}
                className="flex items-center gap-2 px-4 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm transition-colors">
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve Selected ({selectedIds.size})
              </button>
            )}
            {batchMode === 'write' && (
              <>
                <button type="button" onClick={handleBatchWrite}
                  disabled={!someSelected || processing}
                  className="flex items-center gap-2 px-4 py-2 text-[8px] font-bold uppercase tracking-widest border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm transition-colors">
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                  Write Selected ({selectedIds.size})
                </button>
                <button type="button" onClick={handleWriteAllApproved}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm transition-colors">
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                  Write All Approved Eligible
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-[6px] font-mono text-slate-600">
          {batchMode === 'approve'
            ? 'Eligible = LOW + PENDING_REVIEW + NOT_EXECUTED + NOT_DISPATCHED + allowlisted folder + accepted type'
            : `Eligible = APPROVED + LOW + NOT_EXECUTED + allowlisted folder${allowOverwrite ? '' : ' + not already written'}`}
        </div>
      </div>

      {/* Batch result panel */}
      {batchResult && (
        <div className={`border rounded-sm p-4 space-y-3 ${batchResult.error ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
            Batch {batchResult.mode === 'approve' ? 'Approval' : 'Write'} Result
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Selected', value: batchResult.selected, color: 'text-slate-300' },
              { label: batchResult.mode === 'approve' ? 'Approved' : 'Written', value: batchResult.mode === 'approve' ? batchResult.approved : batchResult.written, color: 'text-primary' },
              { label: 'Skipped / Already Written', value: batchResult.skipped.length, color: batchResult.skipped.length > 0 ? 'text-amber-400' : 'text-slate-400' },
              { label: 'Errors', value: batchResult.error ? 1 : 0, color: batchResult.error ? 'text-destructive' : 'text-slate-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card/50 border border-border/20 rounded-sm p-2.5 text-center">
                <div className="text-[6px] uppercase text-slate-500 mb-1">{label}</div>
                <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {batchResult.skipped.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7px] font-bold uppercase text-amber-400">Skipped / Already Written</div>
              {batchResult.skipped.map((s, i) => (
                <div key={i} className="text-[7px] font-mono text-slate-400">
                  <span className="text-slate-300">{s.filename || s.id}</span> — {s.reason}
                </div>
              ))}
            </div>
          )}

          {batchResult.error && (
            <div className="text-[7px] font-mono text-destructive">{batchResult.error}</div>
          )}

          <div className="text-[6px] font-mono text-slate-600 pt-1 border-t border-border/20">
            executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT · no credentials accessed · no API calls made
          </div>
        </div>
      )}
    </div>
  );
}