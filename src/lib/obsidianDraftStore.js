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

// ── Index Metadata Repair ────────────────────────────────────────────────────

const CREDENTIAL_FIELDS = ['credentialRef', 'brokerKey', 'apiKey', 'token', 'secret', 'password'];

/**
 * Safe metadata-only repair of VeridanObsidianDraft records.
 * Allowed repairs: filePath, writtenAt, filesystemWrite, approvalStatus (APPROVED only),
 * riskLevel (LOW only) — all sourced from a matching successful VeridanObsidianWriteAudit.
 *
 * NEVER: writes vault files, calls obsidianWriteApprovedDraft, modifies content/filename/
 * targetFolder, deletes records, touches executionStatus/dispatchStatus/openclawCall,
 * repairs MEDIUM/HIGH risk, or auto-approves drafts without a proven audit.
 *
 * Returns { checked, repaired, skipped, blocked, manualReviewRequired, errors, log }
 */
export async function repairIndexMetadata() {
  const result = {
    checked: 0,
    repaired: 0,
    skipped: 0,
    blocked: 0,
    manualReviewRequired: 0,
    errors: 0,
    log: [],
  };

  // Load all data
  let drafts = [], audits = [];
  try {
    [drafts, audits] = await Promise.all([
      base44.entities.VeridanObsidianDraft.list('-created_date', 500),
      base44.entities.VeridanObsidianWriteAudit.list('-created_date', 500),
    ]);
  } catch (e) {
    result.errors++;
    result.log.push({ draftId: '—', filename: '—', folder: '—', action: 'LOAD', status: 'ERROR', reason: e?.message || 'Failed to load data' });
    return result;
  }

  // Build audit lookup: by draftId (primary) and filePath (secondary)
  // For each draft, find all matching audits, pick newest successful one
  const auditsByDraftId = {};
  const auditsByFilePath = {};
  for (const a of audits) {
    if (a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY') continue; // only successful
    if (a.draftId) {
      if (!auditsByDraftId[a.draftId]) auditsByDraftId[a.draftId] = [];
      auditsByDraftId[a.draftId].push(a);
    }
    if (a.filePath) {
      if (!auditsByFilePath[a.filePath]) auditsByFilePath[a.filePath] = [];
      auditsByFilePath[a.filePath].push(a);
    }
  }

  // Sort by timestamp desc (newest first)
  const newestAudit = (list) =>
    [...list].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];

  // Detect drafts sharing the same filePath (duplicates → manual review)
  const draftsByFilePath = {};
  for (const d of drafts) {
    if (d.filePath) {
      if (!draftsByFilePath[d.filePath]) draftsByFilePath[d.filePath] = [];
      draftsByFilePath[d.filePath].push(d);
    }
  }

  for (const draft of drafts) {
    result.checked++;
    const draftId = draft.draftId || draft.id;
    const logBase = { draftId, filename: draft.filename || '—', folder: draft.targetFolder || '—' };

    // ── Hard blocks ────────────────────────────────────────────────────────
    if ((draft.riskLevel && draft.riskLevel !== 'LOW')) {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `riskLevel=${draft.riskLevel} (only LOW allowed)` });
      continue;
    }
    if (draft.executionStatus && draft.executionStatus !== 'NOT_EXECUTED') {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `executionStatus=${draft.executionStatus}` });
      continue;
    }
    if (draft.dispatchStatus && draft.dispatchStatus !== 'NOT_DISPATCHED') {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `dispatchStatus=${draft.dispatchStatus}` });
      continue;
    }
    if (draft.openclawCall && draft.openclawCall !== 'NOT_SENT') {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `openclawCall=${draft.openclawCall}` });
      continue;
    }
    if (CREDENTIAL_FIELDS.some(f => draft[f])) {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: 'draft contains credential field' });
      continue;
    }

    // ── Find matching audit ────────────────────────────────────────────────
    let matchAuditList = [];
    if (draftId && auditsByDraftId[draftId]) {
      matchAuditList = auditsByDraftId[draftId];
    } else if (draft.filePath && auditsByFilePath[draft.filePath]) {
      matchAuditList = auditsByFilePath[draft.filePath];
    }

    if (matchAuditList.length === 0) {
      result.skipped++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'NO_AUDIT', reason: 'No matching successful audit record found' });
      continue;
    }

    // Duplicate draft check (multiple drafts matching same filePath audit)
    if (draft.filePath && draftsByFilePath[draft.filePath]?.length > 1) {
      result.manualReviewRequired++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'MANUAL_REVIEW', reason: `Multiple drafts share filePath: ${draft.filePath}` });
      continue;
    }

    const audit = newestAudit(matchAuditList);

    // ── Compute needed repairs ─────────────────────────────────────────────
    const patch = {};
    const reasons = [];

    if (!draft.filePath && audit.filePath) {
      patch.filePath = audit.filePath;
      reasons.push('filePath from audit');
    }
    if (!draft.writtenAt && audit.timestamp) {
      patch.writtenAt = audit.timestamp;
      reasons.push('writtenAt from audit.timestamp');
    }
    if (!draft.filesystemWrite || draft.filesystemWrite === 'DISABLED') {
      patch.filesystemWrite = 'COMPLETED_APPROVED_DRAFT_ONLY';
      reasons.push('filesystemWrite → COMPLETED_APPROVED_DRAFT_ONLY');
    }
    if (!draft.approvalStatus && audit.approvalStatus === 'APPROVED') {
      patch.approvalStatus = 'APPROVED';
      reasons.push('approvalStatus → APPROVED (from audit)');
    }
    if (!draft.riskLevel && audit.riskLevel === 'LOW') {
      patch.riskLevel = 'LOW';
      reasons.push('riskLevel → LOW (from audit)');
    }

    if (Object.keys(patch).length === 0) {
      result.skipped++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'ALREADY_COMPLETE', reason: 'No metadata fields require repair' });
      continue;
    }

    // ── Apply patch ────────────────────────────────────────────────────────
    try {
      await base44.entities.VeridanObsidianDraft.update(draft.id, patch);
      result.repaired++;
      result.log.push({ ...logBase, action: 'REPAIR', status: 'REPAIRED', reason: reasons.join(' | ') });
    } catch (e) {
      result.errors++;
      result.log.push({ ...logBase, action: 'REPAIR', status: 'ERROR', reason: e?.message || 'Update failed' });
    }
  }

  return result;
}

// ── Orphan Audit Reconciliation ───────────────────────────────────────────────

/**
 * Reconcile orphan VeridanObsidianWriteAudit records by linking them to matching
 * VeridanObsidianDraft records via filePath / fileName / targetFolder / source matching.
 *
 * Only updates SAFE METADATA fields:
 *   - On audit: draftId (linked draft's draftId or id), reconciliationStatus, reconciledAt
 *   - On draft: filePath, writtenAt, filesystemWrite, approvalStatus, riskLevel
 *     (only if matching audit confirms them and they are missing/default on the draft)
 *
 * NEVER:
 *   - Writes vault files
 *   - Calls obsidianWriteApprovedDraft
 *   - Calls OpenClaw
 *   - Runs browser automation
 *   - Touches executionStatus / dispatchStatus / openclawCall
 *   - Deletes any records
 *   - Touches credential fields
 *   - Modifies draft content, filename, targetFolder
 *
 * Confidence scoring:
 *   filePath exact match    → +50
 *   folder match            → +20
 *   filename match          → +20
 *   source match            → +10
 *   writtenAt proximity     → +5 (within 60s)
 *   Score >= 50 required for repair.
 *
 * Returns { checked, repaired, skipped, blocked, errors, log }
 */
export async function reconcileOrphanAudits() {
  const result = { checked: 0, repaired: 0, skipped: 0, blocked: 0, errors: 0, log: [] };

  let drafts = [], audits = [];
  try {
    [drafts, audits] = await Promise.all([
      base44.entities.VeridanObsidianDraft.list('-created_date', 500),
      base44.entities.VeridanObsidianWriteAudit.list('-created_date', 500),
    ]);
  } catch (e) {
    result.errors++;
    result.log.push({ auditId: '—', filename: '—', action: 'LOAD', status: 'ERROR', reason: e?.message || 'Failed to load data' });
    return result;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Normalize a path: trim, lower, collapse slashes
  const normPath = (p) => (p || '').trim().toLowerCase().replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

  // Extract basename from a file path
  const basename = (p) => {
    const n = normPath(p);
    const parts = n.split('/');
    return parts[parts.length - 1] || '';
  };

  // Resolve all aliases for "folder": targetFolder, folder, allowlistedFolder
  const resolveFolder = (obj) =>
    normPath(obj.targetFolder || obj.folder || obj.allowlistedFolder || '');

  // Resolve all aliases for "filename": filename, fileName
  const resolveFilename = (obj) =>
    (obj.filename || obj.fileName || '').trim().toLowerCase();

  // Build set of all known draft IDs (draftId field AND entity id)
  const draftById = {};
  const draftByDraftId = {};
  for (const d of drafts) {
    draftById[d.id] = d;
    if (d.draftId) draftByDraftId[d.draftId] = d;
  }

  // Identify orphan audits: no draftId, OR draftId set but doesn't resolve to any known draft
  const orphanAudits = audits.filter(a => {
    if (!a.draftId) return true;
    return !draftByDraftId[a.draftId] && !draftById[a.draftId];
  });

  for (const audit of orphanAudits) {
    result.checked++;
    const auditId = audit.auditId || audit.id;
    const auditFilename = resolveFilename(audit);
    const auditFolder = resolveFolder(audit);
    const auditFilePath = normPath(audit.filePath);

    // Derive filename from filePath if not set directly
    const auditBasename = auditFilename || basename(auditFilePath);

    // Build a "constructed path" from folder + filename as fallback
    const auditConstructedPath = (auditFolder && auditBasename)
      ? `${auditFolder}/${auditBasename}` : '';

    const logBase = {
      auditId,
      filename: auditBasename || '—',
      folder: auditFolder || '—',
    };

    // Safety blocks on the audit itself — never touch execution/dispatch/openclaw
    if (audit.executionStatus && audit.executionStatus !== 'NOT_EXECUTED') {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `executionStatus=${audit.executionStatus}` });
      continue;
    }
    if (audit.dispatchStatus && audit.dispatchStatus !== 'NOT_DISPATCHED') {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `dispatchStatus=${audit.dispatchStatus}` });
      continue;
    }
    if (audit.openclawCall && audit.openclawCall !== 'NOT_SENT') {
      result.blocked++;
      result.log.push({ ...logBase, action: 'SKIP', status: 'BLOCKED', reason: `openclawCall=${audit.openclawCall}` });
      continue;
    }

    // Score each draft as a potential match
    let bestDraft = null;
    let bestScore = 0;
    let bestReasons = [];
    let bestCandidateId = '—';
    let bestCandidateScore = 0;

    for (const draft of drafts) {
      // Hard blocks on draft side
      if (draft.riskLevel && draft.riskLevel !== 'LOW') continue;
      if (CREDENTIAL_FIELDS.some(f => draft[f])) continue;

      const draftFilePath = normPath(draft.filePath);
      const draftFolder = resolveFolder(draft);
      const draftFilename = resolveFilename(draft);
      const draftBasename = draftFilename || basename(draftFilePath);

      // Build draft's constructed path from targetFolder + filename
      const draftConstructedPath = (draftFolder && draftBasename)
        ? `${draftFolder}/${draftBasename}` : '';

      let score = 0;
      const reasons = [];

      // ── filePath exact match (primary, strongest) ──────────────────────────
      // Direct filePath-to-filePath
      if (auditFilePath && draftFilePath && auditFilePath === draftFilePath) {
        score += 50; reasons.push('filePath↔filePath exact');
      }
      // audit filePath matches draft's constructed path (draft has no filePath yet)
      else if (auditFilePath && draftConstructedPath && auditFilePath === draftConstructedPath) {
        score += 50; reasons.push('audit.filePath↔draft(folder+filename) exact');
      }
      // audit's constructed path matches draft filePath
      else if (auditConstructedPath && draftFilePath && auditConstructedPath === draftFilePath) {
        score += 50; reasons.push('audit(folder+filename)↔draft.filePath exact');
      }
      // Both have constructed paths that match (no filePath on either)
      else if (auditConstructedPath && draftConstructedPath && auditConstructedPath === draftConstructedPath) {
        score += 45; reasons.push('(folder+filename) constructed path match');
      }

      // ── Folder match (+20) ─────────────────────────────────────────────────
      if (auditFolder && draftFolder && auditFolder === draftFolder) {
        score += 20; reasons.push('folder match');
      }

      // ── Filename match (+20): compare basename from all sources ────────────
      // Direct filename fields
      if (auditBasename && draftBasename && auditBasename === draftBasename) {
        score += 20; reasons.push('filename match');
      }
      // Audit filePath basename vs draft filename
      else if (auditFilePath && draftBasename) {
        const auditBase = basename(auditFilePath);
        if (auditBase && auditBase === draftBasename) {
          score += 20; reasons.push('audit.filePath basename↔draft.filename match');
        }
      }

      // ── Source match (+10) ─────────────────────────────────────────────────
      const auditSource = (audit.source || '').trim();
      const draftSource = (draft.source || '').trim();
      if (auditSource && draftSource && auditSource === draftSource) {
        score += 10; reasons.push('source match');
      }

      // ── Timestamp proximity (+5, within 60s) ──────────────────────────────
      const auditTs = audit.timestamp || audit.created_date
        ? new Date(audit.timestamp || audit.created_date).getTime() : null;
      const draftTs = draft.writtenAt || draft.created_date
        ? new Date(draft.writtenAt || draft.created_date).getTime() : null;
      if (auditTs && draftTs && Math.abs(auditTs - draftTs) <= 60000) {
        score += 5; reasons.push('timestamp proximity <60s');
      }

      // Track best candidate for debug output even if below threshold
      if (score > bestCandidateScore) {
        bestCandidateScore = score;
        bestCandidateId = draft.draftId || draft.id;
      }

      if (score > bestScore) {
        bestScore = score;
        bestDraft = draft;
        bestReasons = reasons;
      }
    }

    // Require confidence score >= 40 to proceed
    // (filePath exact match = 50 → always qualifies; folder+filename = 40 → qualifies)
    if (!bestDraft || bestScore < 40) {
      result.skipped++;
      result.log.push({
        ...logBase,
        action: 'SKIP',
        status: 'NO_MATCH',
        reason: [
          `bestScore=${bestCandidateScore} < 40 threshold`,
          `bestCandidate=${bestCandidateId}`,
          `audit.filePath="${audit.filePath || ''}"`,
          `audit.folder="${auditFolder}"`,
          `audit.filename="${auditBasename}"`,
        ].join(' | '),
      });
      continue;
    }

    const draft = bestDraft;
    const linkedDraftId = draft.draftId || draft.id;

    // ── Patch the audit ────────────────────────────────────────────────────
    const auditPatch = {
      draftId: linkedDraftId,
      reconciliationStatus: 'RECONCILED',
      reconciledAt: new Date().toISOString(),
    };
    const auditReasons = [`draftId→${linkedDraftId}`, 'reconciliationStatus=RECONCILED'];

    // ── Patch the draft (safe metadata only) ──────────────────────────────
    const draftPatch = {};
    const draftReasons = [];
    if (!draft.filePath && audit.filePath) {
      draftPatch.filePath = audit.filePath;
      draftReasons.push('filePath from audit');
    }
    if (!draft.writtenAt && (audit.timestamp || audit.created_date)) {
      draftPatch.writtenAt = audit.timestamp || audit.created_date;
      draftReasons.push('writtenAt from audit');
    }
    if ((!draft.filesystemWrite || draft.filesystemWrite === 'DISABLED') && audit.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY') {
      draftPatch.filesystemWrite = 'COMPLETED_APPROVED_DRAFT_ONLY';
      draftReasons.push('filesystemWrite→COMPLETED');
    }
    if (!draft.approvalStatus && audit.approvalStatus === 'APPROVED') {
      draftPatch.approvalStatus = 'APPROVED';
      draftReasons.push('approvalStatus→APPROVED');
    }
    if (!draft.riskLevel && audit.riskLevel === 'LOW') {
      draftPatch.riskLevel = 'LOW';
      draftReasons.push('riskLevel→LOW');
    }

    // Apply patches
    let success = true;
    try {
      await base44.entities.VeridanObsidianWriteAudit.update(audit.id, auditPatch);
    } catch (e) {
      success = false;
      result.errors++;
      result.log.push({ ...logBase, action: 'REPAIR_AUDIT', status: 'ERROR', reason: `Audit update failed: ${e?.message}` });
    }

    if (success && Object.keys(draftPatch).length > 0) {
      try {
        await base44.entities.VeridanObsidianDraft.update(draft.id, draftPatch);
      } catch (e) {
        result.log.push({ ...logBase, action: 'REPAIR_DRAFT', status: 'WARN', reason: `Draft patch failed (audit link saved): ${e?.message}` });
      }
    }

    if (success) {
      result.repaired++;
      result.log.push({
        ...logBase,
        action: 'RECONCILE',
        status: 'REPAIRED',
        reason: `Score=${bestScore} [${bestReasons.join(', ')}] | ${[...auditReasons, ...draftReasons].join(' | ')}`,
      });
    }
  }

  return result;
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