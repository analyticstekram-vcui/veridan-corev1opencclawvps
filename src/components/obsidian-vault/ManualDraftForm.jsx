/**
 * ManualDraftForm
 * Creates a manual markdown draft in NO_API_LOCAL_ONLY mode.
 * Saves to veridan_obsidian_drafts with all safety fields set.
 */

import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { API_MODE_CONFIG } from '../../lib/apiMode';

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

      // Remove old duplicate non-approved manual drafts with same filename + folder + draftType
      // Preserve approved drafts regardless
      drafts = drafts.filter(d => {
        const isDuplicate =
          d.filename === draft.filename &&
          d.targetFolder === draft.targetFolder &&
          d.draftType === draft.draftType &&
          d.source === 'MANUAL_LOCAL_DRAFT';
        const isApproved =
          d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT';
        return !(isDuplicate && !isApproved);
      });

      // Trim content to 200KB max to avoid QuotaExceededError
      const MAX_CONTENT_BYTES = 200 * 1024;
      const safeContent =
        draft.content.length > MAX_CONTENT_BYTES
          ? draft.content.slice(0, MAX_CONTENT_BYTES) + '\n\n[content trimmed — exceeded 200KB limit]'
          : draft.content;
      const draftToSave = { ...draft, content: safeContent };

      drafts.unshift(draftToSave);
      if (drafts.length > 50) drafts.length = 50;

      try {
        localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(drafts));
      } catch (storageErr) {
        console.error('Manual draft localStorage save failed:', storageErr);
        setError(`Storage save failed: ${storageErr.message || 'QuotaExceededError'}. Try shortening the content or clearing old drafts.`);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // Reset
      setTitle('');
      setCategory('');
      setTargetFolder('');
      setProposedFileName('');
      setMarkdownContent('');
      setOpen(false);

      if (onDraftCreated) onDraftCreated(draftToSave);
    } catch (err) {
      console.error('Manual draft localStorage save failed:', err);
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