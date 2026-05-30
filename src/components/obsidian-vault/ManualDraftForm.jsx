/**
 * ManualDraftForm
 * Creates a manual markdown draft in NO_API_LOCAL_ONLY mode.
 * Saves to veridan_obsidian_drafts with all safety fields set.
 */

import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { API_MODE_CONFIG } from '../../lib/apiMode';

const LOG = (...args) => console.log('[OBSIDIAN_DRAFT_STORAGE]', ...args);
const LOG_ERR = (...args) => console.error('[OBSIDIAN_DRAFT_STORAGE]', ...args);

const MAX_CONTENT_BYTES = 200 * 1024; // 200KB per draft
const MAX_NON_APPROVED_HISTORY = 10;

function isApprovedDraft(d) {
  return d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT';
}

function isReadyToWrite(d) {
  return isApprovedDraft(d) && d.riskLevel === 'LOW' && d.executionStatus === 'NOT_EXECUTED';
}

/**
 * Compact the draft list before saving:
 * - Preserve all approved / ready-to-write drafts
 * - For non-approved: keep only the newest per filename+folder+draftType key
 * - Limit non-approved history to MAX_NON_APPROVED_HISTORY total
 */
function compactDrafts(drafts) {
  const approved = drafts.filter(d => isApprovedDraft(d) || isReadyToWrite(d));
  const pending = drafts.filter(d => !isApprovedDraft(d));

  // Deduplicate pending — keep newest per key
  const seen = new Map();
  for (const d of pending) {
    const key = `${d.filename}||${d.targetFolder}||${d.draftType}`;
    if (!seen.has(key)) seen.set(key, d); // array is newest-first (unshifted), so first seen = newest
  }
  const dedupedPending = Array.from(seen.values()).slice(0, MAX_NON_APPROVED_HISTORY);

  LOG(`Compacted: ${approved.length} approved + ${dedupedPending.length} pending (was ${pending.length} pending)`);
  return [...approved, ...dedupedPending];
}

function trySetDrafts(drafts) {
  localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(drafts));
}

const ALLOWLISTED_FOLDERS = [
  'Veridan Core/Veridan Core System',
  'Veridan Core/OpenClaw',
  'Veridan Core/Trading',
  'Veridan Core/Credit',
  'Veridan Core/Business Formation',
  'Veridan Core/Trust / Entities',
  'Veridan Core/SOPs',
  'Veridan Core/Daily Operations',
];

export default function ManualDraftForm({ onDraftCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [targetFolder, setTargetFolder] = useState('');
  const [proposedFileName, setProposedFileName] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = () => {
    setError(null);

    if (!title || !targetFolder || !proposedFileName || !markdownContent) {
      setError('All fields are required.');
      return;
    }

    // Validate folder is allowlisted
    if (!ALLOWLISTED_FOLDERS.includes(targetFolder)) {
      setError('Target folder is not allowlisted.');
      return;
    }

    // Block path traversal
    if (proposedFileName.includes('..') || proposedFileName.includes('/') || proposedFileName.includes('\\')) {
      setError('Filename contains unsafe characters.');
      return;
    }

    // Ensure .md extension
    const filename = proposedFileName.endsWith('.md') ? proposedFileName : `${proposedFileName}.md`;

    const draft = {
      id: `DRAFT-${Date.now().toString(36).toUpperCase()}-MANUAL`,
      source: 'MANUAL_LOCAL_DRAFT',
      title,
      category,
      targetFolder,
      filename,
      content: markdownContent,
      draftType: 'MANUAL_MARKDOWN',
      riskLevel: 'LOW',
      approvalStatus: 'PENDING_REVIEW',
      approvalState: 'PENDING_REVIEW',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      filesystemWrite: 'DISABLED',
      openclawCall: 'NOT_SENT',
      apiMode: 'NO_API_LOCAL_ONLY',
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
      let drafts;
      try {
        drafts = JSON.parse(stored);
        if (!Array.isArray(drafts)) drafts = [];
      } catch {
        drafts = [];
      }

      // Trim content to 200KB max
      const safeContent =
        draft.content.length > MAX_CONTENT_BYTES
          ? draft.content.slice(0, MAX_CONTENT_BYTES) + '\n\n[content trimmed — exceeded 200KB limit]'
          : draft.content;
      const draftToSave = { ...draft, content: safeContent };

      // Add new draft at front, then compact
      drafts.unshift(draftToSave);
      const compacted = compactDrafts(drafts);

      // First save attempt
      let saveOk = false;
      try {
        trySetDrafts(compacted);
        saveOk = true;
        LOG(`Saved draft ${draftToSave.id} (${compacted.length} total)`);
      } catch (storageErr) {
        LOG_ERR('Manual draft localStorage save failed:', storageErr);
        // Retry: strip content from all non-ready pending drafts to free space
        const stripped = compacted.map(d =>
          (!isApprovedDraft(d) && d.id !== draftToSave.id)
            ? { ...d, content: '[content removed to free storage space]' }
            : d
        );
        try {
          trySetDrafts(stripped);
          saveOk = true;
          LOG(`Saved draft after stripping old content (${stripped.length} total)`);
        } catch (retryErr) {
          LOG_ERR('Manual draft localStorage save failed (retry):', retryErr);
          setError('Storage is full. Clear old non-approved drafts, shorten the markdown, or export evidence before saving.');
          return;
        }
      }

      if (saveOk) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setTitle('');
        setCategory('');
        setTargetFolder('');
        setProposedFileName('');
        setMarkdownContent('');
        setOpen(false);
        if (onDraftCreated) onDraftCreated(draftToSave);
      }
    } catch (err) {
      LOG_ERR('Manual draft localStorage save failed:', err);
      setError(`Failed to save draft: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="border border-primary/40 bg-primary/5 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            CREATE MANUAL MARKDOWN DRAFT
          </span>
        </div>
        <span className="text-[7px] font-mono text-primary/60">{open ? '▲ collapse' : '▼ expand'}</span>
      </button>

      {open && (
        <div className="border-t border-primary/20 bg-card p-5 space-y-4">
          <div className="text-[8px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-sm px-3 py-2">
            {API_MODE_CONFIG.disabledMessage}
          </div>

          {error && (
            <div className="text-[8px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          {saved && (
            <div className="text-[8px] font-mono text-primary bg-primary/10 border border-primary/30 rounded-sm px-3 py-2">
              ✓ Draft saved — go to Draft Review to approve and write
            </div>
          )}

          <div className="space-y-3">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Weekly Operations Review"
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g., SOPs"
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Target Folder */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Target Folder (allowlisted)</label>
              <select
                value={targetFolder}
                onChange={e => setTargetFolder(e.target.value)}
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 focus:outline-none focus:border-primary/40"
              >
                <option value="">— select folder —</option>
                {ALLOWLISTED_FOLDERS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Proposed Filename */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Filename (.md)</label>
              <input
                type="text"
                value={proposedFileName}
                onChange={e => setProposedFileName(e.target.value)}
                placeholder="e.g., weekly_ops_review"
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Markdown Content */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Markdown Content</label>
              <textarea
                value={markdownContent}
                onChange={e => setMarkdownContent(e.target.value)}
                placeholder="# Title&#10;## Section&#10;Content..."
                rows={8}
                className="w-full px-3 py-2 text-[9px] font-mono bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-y"
              />
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              <Plus className="w-4 h-4" /> Save Manual Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}