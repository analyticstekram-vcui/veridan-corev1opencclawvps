/**
 * BatchDraftReview
 * Batch approve and write multiple LOW-risk, allowlisted Obsidian drafts.
 * No API calls. No OpenClaw dispatch. No browser automation. No credentials.
 * All vault writes use the same obsidianWriteApprovedDraft backend function path.
 * Unapproved or non-LOW-risk drafts cannot be selected or written.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Square, FileUp, CheckCircle2, AlertCircle, Loader2, RefreshCw, Filter } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Must match ApprovedDraftWriteButton allowlist exactly
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

function isEligibleForApproval(d) {
  return (
    d.riskLevel === 'LOW' &&
    d.approvalStatus === 'PENDING_REVIEW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    d.dispatchStatus === 'NOT_DISPATCHED' &&
    d.targetFolder &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    d.draftType &&
    ELIGIBLE_DRAFT_TYPES.includes(d.draftType)
  );
}

function isEligibleForWrite(d) {
  return (
    d.approvalStatus === 'APPROVED' &&
    d.riskLevel === 'LOW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    d.targetFolder &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    !d.writtenAt  // not already written this session
  );
}

function applyFilter(drafts, filter) {
  switch (filter) {
    case 'Pending Review': return drafts.filter(d => d.approvalStatus === 'PENDING_REVIEW');
    case 'Approved': return drafts.filter(d => d.approvalStatus === 'APPROVED');
    case 'Ready To Write': return drafts.filter(d => isEligibleForWrite(d));
    case 'Written': return drafts.filter(d => d.writtenAt || d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY');
    default: return drafts;
  }
}

function statusBadge(d) {
  if (d.writtenAt || d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY')
    return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 rounded-sm">WRITTEN</span>;
  if (d.approvalStatus === 'APPROVED')
    return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 rounded-sm">APPROVED</span>;
  if (d.approvalStatus === 'PENDING_REVIEW')
    return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm">PENDING</span>;
  return <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase bg-secondary/30 text-slate-400 border border-border/20 rounded-sm">{d.approvalStatus}</span>;
}

export default function BatchDraftReview() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchMode, setBatchMode] = useState('approve'); // 'approve' | 'write'
  const [processing, setProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  const loadDrafts = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
      setDrafts(Array.isArray(stored) ? stored : []);
    } catch { setDrafts([]); }
    setSelectedIds(new Set());
    setBatchResult(null);
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const visible = applyFilter(drafts, filter);

  // Eligible set depends on current batch mode
  const eligibleIds = new Set(
    visible
      .filter(d => batchMode === 'approve' ? isEligibleForApproval(d) : isEligibleForWrite(d))
      .map(d => d.id)
  );

  const toggleOne = (id) => {
    if (!eligibleIds.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === eligibleIds.size && eligibleIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleIds));
    }
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
          skipped.push({ id: d.id, filename: d.filename, reason: 'Failed eligibility check' });
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

  // ── Batch Write ────────────────────────────────────────────────────────────
  const handleBatchWrite = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    setBatchResult(null);

    const toWrite = drafts.filter(d => selectedIds.has(d.id) && isEligibleForWrite(d));
    const skipped = drafts
      .filter(d => selectedIds.has(d.id) && !isEligibleForWrite(d))
      .map(d => ({ id: d.id, filename: d.filename, reason: buildSkipReason(d) }));

    let written = 0;
    const writeErrors = [];

    for (const draft of toWrite) {
      try {
        const response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft });

        if (response.data.success) {
          // Audit record — same shape as ApprovedDraftWriteButton
          const auditRecord = {
            ...response.data.auditRecord,
            draftId: draft.id || 'unknown',
            taskId: draft.taskId || 'unknown',
            filePath: response.data.filePath,
            folder: draft.targetFolder,
            writeStatus: 'COMPLETED_APPROVED_DRAFT_ONLY',
            filesystemWrite: 'COMPLETED_APPROVED_DRAFT_ONLY',
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

          // Mark draft as written in localStorage
          try {
            const stored = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
            const idx = stored.findIndex(d => d.id === draft.id);
            if (idx >= 0) {
              stored[idx].writtenAt = new Date().toISOString();
              stored[idx].filesystemWrite = 'COMPLETED_APPROVED_DRAFT_ONLY';
              localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(stored));
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

    setBatchResult({
      mode: 'write',
      selected: selectedIds.size,
      approved: 0,
      written,
      skipped: [...skipped, ...writeErrors],
    });
    loadDrafts();
    setProcessing(false);
  };

  function buildSkipReason(d) {
    if (d.approvalStatus !== 'APPROVED') return 'Not approved';
    if (d.riskLevel !== 'LOW') return 'Risk level not LOW';
    if (d.executionStatus !== 'NOT_EXECUTED') return 'Already executed';
    if (!APPROVED_FOLDERS.includes(d.targetFolder)) return 'Folder not in allowlist';
    if (d.writtenAt) return 'Already written';
    return 'Unknown';
  }

  const allEligibleSelected = eligibleIds.size > 0 && selectedIds.size === eligibleIds.size;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">Batch Draft Review</div>
          <div className="text-[7px] font-mono text-slate-500 mt-0.5">
            Select multiple LOW-risk drafts to approve or write at once
          </div>
        </div>
        <button type="button" onClick={loadDrafts}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase border border-border/30 text-slate-400 hover:text-slate-200 hover:border-border/60 rounded-sm transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Mode + filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[7px] text-slate-500 font-mono">Mode:</span>
        {(['approve', 'write']).map(m => (
          <button key={m} type="button" onClick={() => { setBatchMode(m); setSelectedIds(new Set()); setBatchResult(null); }}
            className={`px-3 py-1 text-[7px] font-bold uppercase rounded-sm border transition-colors ${
              batchMode === m ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/30 text-slate-400 hover:text-slate-200'
            }`}>
            {m === 'approve' ? 'Approve Drafts' : 'Write To Vault'}
          </button>
        ))}
        <span className="text-[7px] text-slate-500 font-mono ml-2">Filter:</span>
        {FILTERS.map(f => (
          <button key={f} type="button" onClick={() => { setFilter(f); setSelectedIds(new Set()); }}
            className={`px-3 py-1 text-[7px] font-bold uppercase rounded-sm border transition-colors ${
              filter === f ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border/30 text-slate-400 hover:text-slate-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="border border-border/30 rounded-sm p-4 text-center text-[8px] text-slate-500 font-mono">
          No drafts match this filter.
        </div>
      ) : (
        <div className="border border-border/30 rounded-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[28px_1fr_1fr_80px_90px_90px_90px_90px] gap-0 bg-secondary/30 border-b border-border/30 text-[7px] font-bold uppercase text-slate-500 tracking-widest">
            <div className="px-2 py-2 flex items-center justify-center">
              <button type="button" onClick={toggleAll} title="Toggle all eligible">
                {allEligibleSelected
                  ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  : <Square className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
            <div className="px-3 py-2">Filename</div>
            <div className="px-3 py-2">Folder</div>
            <div className="px-3 py-2">Risk</div>
            <div className="px-3 py-2">Approval</div>
            <div className="px-3 py-2">Exec</div>
            <div className="px-3 py-2">Dispatch</div>
            <div className="px-3 py-2">Write</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/20">
            {visible.map((d, i) => {
              const eligible = eligibleIds.has(d.id);
              const checked = selectedIds.has(d.id);
              return (
                <div
                  key={d.id || i}
                  onClick={() => toggleOne(d.id)}
                  className={`grid grid-cols-[28px_1fr_1fr_80px_90px_90px_90px_90px] gap-0 items-center text-[7px] font-mono transition-colors ${
                    eligible ? 'cursor-pointer hover:bg-secondary/20' : 'opacity-50 cursor-not-allowed'
                  } ${checked ? 'bg-primary/5' : ''}`}
                >
                  <div className="px-2 py-2.5 flex items-center justify-center">
                    {eligible
                      ? checked
                        ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        : <Square className="w-3.5 h-3.5 text-slate-500" />
                      : <Square className="w-3.5 h-3.5 text-slate-700" />
                    }
                  </div>
                  <div className="px-3 py-2.5 text-slate-300 truncate max-w-[180px]" title={d.filename}>{d.filename || '—'}</div>
                  <div className="px-3 py-2.5 text-slate-400 truncate max-w-[160px]" title={d.targetFolder}>{d.targetFolder || '—'}</div>
                  <div className="px-3 py-2.5">
                    <span className={d.riskLevel === 'LOW' ? 'text-primary' : 'text-amber-400'}>{d.riskLevel || '—'}</span>
                  </div>
                  <div className="px-3 py-2.5">{statusBadge(d)}</div>
                  <div className="px-3 py-2.5 text-slate-500">{d.executionStatus || '—'}</div>
                  <div className="px-3 py-2.5 text-slate-500">{d.dispatchStatus || '—'}</div>
                  <div className="px-3 py-2.5 text-slate-500">
                    {d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY'
                      ? <span className="text-primary">DONE</span>
                      : d.filesystemWrite || 'DISABLED'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection summary + action buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap border border-border/30 rounded-sm px-4 py-3 bg-card">
        <div className="text-[7px] font-mono text-slate-400 space-y-0.5">
          <div>{visible.length} shown · {eligibleIds.size} eligible · <span className="text-primary">{selectedIds.size} selected</span></div>
          {batchMode === 'approve' && (
            <div className="text-slate-500">Eligible = LOW risk + PENDING_REVIEW + NOT_EXECUTED + NOT_DISPATCHED + allowlisted folder</div>
          )}
          {batchMode === 'write' && (
            <div className="text-slate-500">Eligible = APPROVED + LOW risk + NOT_EXECUTED + allowlisted folder + not already written</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {batchMode === 'approve' && (
            <button
              type="button"
              onClick={handleBatchApprove}
              disabled={!someSelected || processing}
              className="flex items-center gap-2 px-4 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm transition-colors"
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve Selected LOW-Risk Drafts ({selectedIds.size})
            </button>
          )}
          {batchMode === 'write' && (
            <button
              type="button"
              onClick={handleBatchWrite}
              disabled={!someSelected || processing}
              className="flex items-center gap-2 px-4 py-2 text-[8px] font-bold uppercase tracking-widest border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm transition-colors"
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
              Write Selected Approved Drafts To Vault ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Batch result panel */}
      {batchResult && (
        <div className={`border rounded-sm p-4 space-y-3 ${
          batchResult.error ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'
        }`}>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
            Batch {batchResult.mode === 'approve' ? 'Approval' : 'Write'} Result
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Selected', value: batchResult.selected, color: 'text-slate-300' },
              { label: batchResult.mode === 'approve' ? 'Approved' : 'Written', value: batchResult.mode === 'approve' ? batchResult.approved : batchResult.written, color: 'text-primary' },
              { label: 'Skipped', value: batchResult.skipped.length, color: batchResult.skipped.length > 0 ? 'text-amber-400' : 'text-slate-400' },
              { label: 'Failed', value: batchResult.error ? 1 : 0, color: 'text-destructive' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card/50 border border-border/20 rounded-sm p-2.5 text-center">
                <div className="text-[7px] uppercase text-slate-500 mb-1">{label}</div>
                <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {batchResult.skipped.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7px] font-bold uppercase text-amber-400">Skipped Reasons</div>
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
            executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED · openclawCall: NOT_SENT · no credentials accessed
          </div>
        </div>
      )}
    </div>
  );
}