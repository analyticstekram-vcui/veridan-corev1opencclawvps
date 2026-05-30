/**
 * CoreVaultPackGenerator
 * One-click local batch draft generator — NO API, NO OpenClaw dispatch, NO browser automation.
 * Generates Core Vault Pack drafts from shared templates (cvpTemplates.js).
 * All drafts require Draft Review approval before any vault write.
 */

import React, { useState } from 'react';
import { Package, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CORE_VAULT_PACK_TEMPLATES, buildDrafts } from './cvpTemplates';
import { saveDraftsToBackend } from '@/lib/obsidianDraftStore';

const LOG = (...args) => console.log('[OBSIDIAN_DRAFT_STORAGE]', ...args);
const LOG_ERR = (...args) => console.error('[OBSIDIAN_DRAFT_STORAGE]', ...args);

const MAX_NON_APPROVED = 10;

function isApproved(d) {
  return d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT';
}

function saveBatchToLocalStorage(drafts) {
  const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
  let existing;
  try { existing = JSON.parse(stored); if (!Array.isArray(existing)) existing = []; }
  catch { existing = []; }

  const approvedDrafts = existing.filter(d => isApproved(d));
  const pendingDrafts = existing.filter(d => !isApproved(d));

  const newDraftKeys = new Set(drafts.map(d => `${d.filename}||${d.targetFolder}||${d.draftType}`));
  const filteredPending = pendingDrafts.filter(d => {
    const key = `${d.filename}||${d.targetFolder}||${d.draftType}`;
    return !newDraftKeys.has(key);
  });

  const merged = [...drafts, ...filteredPending];
  const cappedPending = merged.slice(0, MAX_NON_APPROVED);
  const final = [...approvedDrafts, ...cappedPending];

  LOG(`Batch save: ${drafts.length} new + ${approvedDrafts.length} approved preserved. Total: ${final.length}`);

  try {
    localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(final));
    return { ok: true };
  } catch (e1) {
    LOG_ERR('Batch save failed (attempt 1):', e1);
    const stripped = final.map(d =>
      (!isApproved(d) && !newDraftKeys.has(`${d.filename}||${d.targetFolder}||${d.draftType}`))
        ? { ...d, content: '[content removed to free storage]' }
        : d
    );
    try {
      localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(stripped));
      LOG('Batch saved after stripping old content');
      return { ok: true };
    } catch (e2) {
      LOG_ERR('Batch save failed (attempt 2):', e2);
      return { ok: false };
    }
  }
}

export default function CoreVaultPackGenerator({ onBatchCreated }) {
  const [status, setStatus] = useState('idle'); // idle | generating | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount] = useState(0);

  const handleGenerate = async () => {
    setStatus('generating');
    setErrorMsg('');

    const now = new Date().toISOString();
    const drafts = buildDrafts(now);

    // Primary: backend storage
    const result = await saveDraftsToBackend(drafts);

    // Best-effort localStorage cache (non-blocking, content stripped)
    try {
      const cacheEntries = drafts.map(d => ({
        id: d.id, filename: d.filename, targetFolder: d.targetFolder,
        draftType: d.draftType, approvalStatus: d.approvalStatus,
        riskLevel: d.riskLevel, executionStatus: d.executionStatus,
        source: d.source,
      }));
      localStorage.setItem('veridan_obsidian_drafts_cache', JSON.stringify(cacheEntries));
    } catch { /* quota — cache not critical */ }

    setCount(drafts.length);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 6000);
    if (onBatchCreated) onBatchCreated(drafts.length);
  };

  return (
    <div className="border border-accent/40 bg-accent/5 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-accent/20">
        <Package className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
          Generate Core Vault Pack
        </span>
        <span className="ml-auto px-2 py-0.5 text-[6px] font-bold uppercase bg-accent/10 text-accent border border-accent/20 rounded-sm">
          {CORE_VAULT_PACK_TEMPLATES.length} DRAFTS · LOCAL ONLY · NO API
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CORE_VAULT_PACK_TEMPLATES.map((tpl, i) => (
            <div key={tpl.id} className="flex items-start gap-2 px-3 py-2 bg-card/50 border border-border/30 rounded-sm">
              <span className="text-[7px] font-mono text-accent/60 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="text-[8px] font-bold text-slate-300">{tpl.title}</div>
                <div className="text-[6px] font-mono text-slate-500 truncate">{tpl.targetFolder}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[7px] font-mono text-slate-500 border-t border-border/20 pt-3">
          All drafts saved with <span className="text-primary">PENDING_REVIEW</span> status.
          Vault write requires approval in Draft Review.
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-primary bg-primary/10 border border-primary/30 rounded-sm px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {count} drafts created. Go to Draft Review to approve, or use One-Click Governed Vault Pack above.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
        >
          {status === 'generating'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Package className="w-4 h-4" /> Generate Core Vault Pack</>
          }
        </button>
      </div>
    </div>
  );
}