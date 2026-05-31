/**
 * obsidianDraftStore.js
 * Centralized backend-backed storage for Obsidian drafts and write audits.
 *
 * Primary storage: Base44 entities (VeridanObsidianDraft, VeridanObsidianWriteAudit)
 * localStorage: lightweight UI cache only (no large content stored)
 *
 * Safety guarantees:
 * - No OpenClaw dispatch
 * - No browser automation
 * - No credentials
 * - No InvokeLLM / external API
 * - All safety states preserved (NOT_EXECUTED, NOT_DISPATCHED, NOT_SENT)
 */

import { base44 } from '@/api/base44Client';

// ── Draft Store ──────────────────────────────────────────────────────────────

/**
 * Save a batch of drafts to the backend entity store.
 * Upserts by (filename + targetFolder + draftType) — no duplicates.
 */
export async function saveDraftsToBackend(drafts) {
  const results = { saved: 0, skipped: 0, failed: [] };

  // Load existing to detect duplicates
  let existing = [];
  try {
    existing = await base44.entities.VeridanObsidianDraft.list('-created_date', 100);
  } catch { /* proceed with empty */ }

  const existingKeys = new Set(
    existing.map(d => `${d.filename}||${d.targetFolder}||${d.draftType}`)
  );

  for (const draft of drafts) {
    const key = `${draft.filename}||${draft.targetFolder}||${draft.draftType}`;
    if (existingKeys.has(key)) {
      // Update existing record's approval/write state instead of duplicating
      const match = existing.find(d =>
        d.filename === draft.filename &&
        d.targetFolder === draft.targetFolder &&
        d.draftType === draft.draftType
      );
      if (match && (match.approvalStatus === 'PENDING_REVIEW' || !match.approvalStatus)) {
        // Re-save as fresh pending draft (reset state for regeneration)
        try {
          await base44.entities.VeridanObsidianDraft.update(match.id, {
            approvalStatus: 'PENDING_REVIEW',
            approvalState: 'PENDING_REVIEW',
            executionStatus: 'NOT_EXECUTED',
            dispatchStatus: 'NOT_DISPATCHED',
            openclawCall: 'NOT_SENT',
            filesystemWrite: 'DISABLED',
            filePath: null,
            writtenAt: null,
            autoApprovedBy: null,
            approvedAt: null,
            content: draft.content,
          });
          results.saved++;
        } catch (e) {
          results.failed.push({ filename: draft.filename, reason: e.message });
        }
      } else {
        results.skipped++;
      }
      continue;
    }

    try {
      await base44.entities.VeridanObsidianDraft.create({
        draftId: draft.id,
        source: draft.source,
        title: draft.title || draft.filename,
        filename: draft.filename,
        category: draft.category || '',
        targetFolder: draft.targetFolder,
        content: draft.content,
        draftType: draft.draftType,
        templateId: draft.templateId || '',
        riskLevel: draft.riskLevel || 'LOW',
        approvalStatus: draft.approvalStatus || 'PENDING_REVIEW',
        approvalState: draft.approvalState || 'PENDING_REVIEW',
        executionStatus: draft.executionStatus || 'NOT_EXECUTED',
        dispatchStatus: draft.dispatchStatus || 'NOT_DISPATCHED',
        openclawCall: draft.openclawCall || 'NOT_SENT',
        filesystemWrite: draft.filesystemWrite || 'DISABLED',
        apiMode: draft.apiMode || 'NO_API_LOCAL_ONLY',
      });
      results.saved++;
      existingKeys.add(key);
    } catch (e) {
      results.failed.push({ filename: draft.filename, reason: e.message });
    }
  }

  return results;
}

/**
 * Load all drafts from backend.
 */
export async function loadDraftsFromBackend(limit = 100) {
  try {
    return await base44.entities.VeridanObsidianDraft.list('-created_date', limit);
  } catch {
    return [];
  }
}

/**
 * Auto-approve eligible CORE_VAULT_PACK drafts in backend.
 * Returns count of approved drafts.
 */
export async function autoApproveCVPDrafts(APPROVED_FOLDERS, ALLOWED_CVP_DRAFT_TYPES) {
  let approved = 0;
  let skipped = 0;

  const drafts = await loadDraftsFromBackend(100);
  const pending = drafts.filter(d =>
    d.source === 'CORE_VAULT_PACK' &&
    d.riskLevel === 'LOW' &&
    d.approvalStatus === 'PENDING_REVIEW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    d.dispatchStatus === 'NOT_DISPATCHED' &&
    d.openclawCall === 'NOT_SENT' &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    ALLOWED_CVP_DRAFT_TYPES.includes(d.draftType) &&
    !d.credentialRef && !d.brokerKey && !d.apiKey
  );

  for (const draft of pending) {
    try {
      await base44.entities.VeridanObsidianDraft.update(draft.id, {
        approvalStatus: 'APPROVED',
        approvalState: 'APPROVED_DRAFT',
        approvedAt: new Date().toISOString(),
        autoApprovedBy: 'GOVERNED_VAULT_PACK_WORKFLOW',
      });
      approved++;
    } catch {
      skipped++;
    }
  }

  return { approved, skipped };
}

/**
 * Load approved, eligible-to-write drafts from backend.
 */
export async function loadEligibleForWrite(APPROVED_FOLDERS) {
  const drafts = await loadDraftsFromBackend(100);
  return drafts.filter(d =>
    d.approvalStatus === 'APPROVED' &&
    d.riskLevel === 'LOW' &&
    d.executionStatus === 'NOT_EXECUTED' &&
    APPROVED_FOLDERS.includes(d.targetFolder) &&
    d.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY'
  );
}

/**
 * Mark a draft as written in the backend.
 */
export async function markDraftWritten(backendId, filePath) {
  await base44.entities.VeridanObsidianDraft.update(backendId, {
    filesystemWrite: 'COMPLETED_APPROVED_DRAFT_ONLY',
    filePath,
    writtenAt: new Date().toISOString(),
  });
}

// ── Audit Store ──────────────────────────────────────────────────────────────

/**
 * Save a write audit record to the backend entity store.
 */
export async function saveAuditToBackend(auditRecord) {
  try {
    await base44.entities.VeridanObsidianWriteAudit.create({
      auditId: auditRecord.auditId || `AUDIT-${Date.now().toString(36).toUpperCase()}`,
      draftId: auditRecord.draftId || '',
      taskId: auditRecord.taskId || '',
      filename: auditRecord.filename || '',
      folder: auditRecord.folder || auditRecord.targetFolder || '',
      filePath: auditRecord.filePath || '',
      source: auditRecord.source || '',
      draftType: auditRecord.draftType || '',
      riskLevel: auditRecord.riskLevel || 'LOW',
      approvalStatus: auditRecord.approvalStatus || 'APPROVED',
      filesystemWrite: auditRecord.filesystemWrite || 'COMPLETED_APPROVED_DRAFT_ONLY',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      openclawCall: 'NOT_SENT',
      timestamp: auditRecord.timestamp || new Date().toISOString(),
      contentHash: auditRecord.contentHash || '',
      writeMode: auditRecord.writeMode || 'APPROVED_DRAFT_ONLY',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Load audit records from backend.
 */
export async function loadAuditsFromBackend(limit = 100) {
  try {
    return await base44.entities.VeridanObsidianWriteAudit.list('-created_date', limit);
  } catch {
    return [];
  }
}

// ── localStorage Cleanup ─────────────────────────────────────────────────────

/**
 * Clear ONLY obsolete localStorage cache entries.
 * NEVER deletes backend entity records, approved drafts, or write audit entities.
 * NEVER mutates executionStatus, dispatchStatus, or openclawCall.
 * Safe to call from UI at any time.
 * Returns { removed, kept }.
 */
export function clearLocalCacheOnly() {
  let removed = 0;
  let kept = 0;

  // 1. Remove the heavyweight drafts cache (content already in backend)
  try {
    const raw = localStorage.getItem('veridan_obsidian_drafts_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      removed += Array.isArray(parsed) ? parsed.length : 1;
      localStorage.removeItem('veridan_obsidian_drafts_cache');
    }
  } catch { /* ignore */ }

  // 2. Trim write audit cache — keep at most 5 most recent refs (no content stored)
  try {
    const raw = localStorage.getItem('veridan_obsidian_write_audits');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const trimmed = parsed.slice(0, 5);
        removed += parsed.length - trimmed.length;
        kept += trimmed.length;
        localStorage.setItem('veridan_obsidian_write_audits', JSON.stringify(trimmed));
      }
    }
  } catch { /* ignore */ }

  // 3. Run standard cleanup on non-approved drafts in localStorage
  const r = cleanupObsoleteLocalDrafts();
  removed += r.removed ?? 0;

  return { removed, kept };
}

/**
 * On app load: remove only obsolete non-approved localStorage drafts.
 * Never deletes approved drafts, audit records, or written file index.
 */
export function cleanupObsoleteLocalDrafts() {
  try {
    const raw = localStorage.getItem('veridan_obsidian_drafts');
    if (!raw) return { removed: 0 };
    const drafts = JSON.parse(raw);
    if (!Array.isArray(drafts)) {
      localStorage.removeItem('veridan_obsidian_drafts');
      return { removed: 0 };
    }
    // Keep only approved drafts in localStorage (as lightweight references, no large content)
    const approved = drafts
      .filter(d => d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT')
      .map(d => ({
        // Strip heavy content from approved localStorage entries too — backend has authoritative copy
        id: d.id, draftId: d.draftId, filename: d.filename, targetFolder: d.targetFolder,
        draftType: d.draftType, approvalStatus: d.approvalStatus, riskLevel: d.riskLevel,
        executionStatus: d.executionStatus, filesystemWrite: d.filesystemWrite,
        filePath: d.filePath, source: d.source,
      }));
    const removed = drafts.length - approved.length;
    localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(approved));
    return { removed };
  } catch {
    return { removed: 0 };
  }
}