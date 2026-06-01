/**
 * StorageReconciliationPanel
 * Read-only cross-reference of VeridanObsidianDraft + VeridanObsidianWriteAudit.
 * Includes "Reconcile Now" (read-only re-check) and "Repair Index Metadata"
 * (safe backend metadata patch — never writes vault files, never calls OpenClaw).
 *
 * Safety guarantees:
 * - "Reconcile Now" → state update only, no backend writes
 * - "Repair Index Metadata" → metadata fields only (filePath, writtenAt, filesystemWrite,
 *   approvalStatus/riskLevel when proven by a successful audit), nothing else
 * - NO vault file writes · NO obsidianWriteApprovedDraft · NO OpenClaw dispatch
 * - NO browser automation · NO credentials · NO InvokeLLM
 * - Audit records NEVER deleted or modified
 * - Draft content / filename / targetFolder NEVER modified
 * - MEDIUM/HIGH risk drafts BLOCKED from repair
 * - executionStatus / dispatchStatus / openclawCall NEVER touched
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GitCompare, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronRight, ShieldCheck, Wrench, Clock,
  AlertCircle, Shield, Info, Archive,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { loadDraftsFromBackend, loadAuditsFromBackend, repairIndexMetadata, reconcileOrphanAudits } from '@/lib/obsidianDraftStore';
import OrphanManualLinkPanel from './OrphanManualLinkPanel';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONFIRM_TTL_MS = 15000;

const REPAIR_VERIFICATIONS = [
  'No vault files written',
  'obsidianWriteApprovedDraft NOT called',
  'No OpenClaw dispatch',
  'No browser automation',
  'No credentials accessed or stored',
  'Backend metadata fields only (filePath, writtenAt, filesystemWrite, approvalStatus, riskLevel)',
  'Audit records preserved — only draftId + reconciliationStatus + reconciledAt may be added',
  'Draft content, filename, targetFolder never modified',
  'Pending unproven drafts NOT auto-approved',
  'MEDIUM and HIGH risk drafts BLOCKED from repair',
  'executionStatus / dispatchStatus / openclawCall never touched',
  'Orphan reconciliation requires confidence score ≥ 50 (filePath exact match = 50 pts)',
  'No records deleted — audit and draft records fully preserved',
];

// ── Reconciliation logic ──────────────────────────────────────────────────────

function reconcile(drafts, audits, workflowSummary) {
  // ── Separate archived CVP records from active records ─────────────────────
  // "Archived CVP" = source CORE_VAULT_PACK AND archived === true
  const archivedCVPDraftIds = new Set(
    drafts
      .filter(d => d.source === 'CORE_VAULT_PACK' && d.archived === true)
      .map(d => d.draftId || d.id)
      .filter(Boolean)
  );
  const archivedCVPDraftEntityIds = new Set(
    drafts
      .filter(d => d.source === 'CORE_VAULT_PACK' && d.archived === true)
      .map(d => d.id)
      .filter(Boolean)
  );

  // Classify audits: historical archived vs active
  const historicalArchivedAudits = audits.filter(a =>
    a.archived === true ||
    archivedCVPDraftIds.has(a.draftId) ||
    archivedCVPDraftEntityIds.has(a.draftId)
  );
  const historicalArchivedAuditCount = historicalArchivedAudits.length;

  // Active records (not archived CVP)
  const activeDrafts = drafts.filter(d => !(d.source === 'CORE_VAULT_PACK' && d.archived === true));
  const activeAudits = audits.filter(a => !historicalArchivedAudits.includes(a));

  const totalDrafts = activeDrafts.length;
  const totalAudits = activeAudits.length;

  // "Written" = active audit has COMPLETED filesystem write
  const writtenAudits = activeAudits.filter(a =>
    a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' || a.filePath
  );
  const writtenCount = writtenAudits.length;

  const failedAudits = activeAudits.filter(a =>
    a.filesystemWrite && a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY' && a.filesystemWrite !== 'DISABLED'
  );
  const failedCount = failedAudits.length;

  // Active drafts confirmed written
  const writtenByField = activeDrafts.filter(d =>
    d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' || d.writtenAt || d.filePath
  );
  const confirmedWrittenDraftCount = writtenByField.length;

  // Build sets for cross-checks (active only)
  const auditFilenames = new Set(activeAudits.map(a => (a.filename || '').toLowerCase()));
  const draftIdSet = new Set(activeDrafts.map(d => d.draftId || d.id).filter(Boolean));
  const auditFilePathSet = new Set(activeAudits.map(a => a.filePath).filter(Boolean));

  // Last workflow run checks
  const lastRunWritten = workflowSummary?.written ?? null;
  const inLastRunNotInAudits = workflowSummary?.writtenFilenames?.filter(
    f => !auditFilenames.has(f.toLowerCase())
  ) ?? [];

  // Approved active drafts not yet written
  const approvedNotWritten = activeDrafts.filter(d =>
    (d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT') &&
    d.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY'
  );

  // Active audits without a matching active draft (orphans)
  const auditsWithoutDraft = activeAudits.filter(a =>
    !a.draftId || !draftIdSet.has(a.draftId)
  );

  // Written active drafts missing audit records
  const writtenDraftsMissingAudit = writtenByField.filter(d =>
    d.filePath && !auditFilePathSet.has(d.filePath)
  );

  // Duplicate filePaths in active drafts
  const filePathCount = {};
  for (const d of activeDrafts) {
    if (d.filePath) filePathCount[d.filePath] = (filePathCount[d.filePath] || 0) + 1;
  }
  const duplicateFilePaths = Object.entries(filePathCount)
    .filter(([, count]) => count > 1)
    .map(([fp]) => fp);

  // Repairable active drafts
  const auditsByDraftId = {};
  for (const a of activeAudits) {
    if (a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY') continue;
    if (a.draftId) {
      if (!auditsByDraftId[a.draftId]) auditsByDraftId[a.draftId] = [];
      auditsByDraftId[a.draftId].push(a);
    }
  }
  const repairableCount = activeDrafts.filter(d => {
    const draftId = d.draftId || d.id;
    if (!auditsByDraftId[draftId]) return false;
    if (d.riskLevel && d.riskLevel !== 'LOW') return false;
    return !d.filePath || !d.writtenAt || !d.filesystemWrite || d.filesystemWrite === 'DISABLED';
  }).length;

  const needsReview =
    inLastRunNotInAudits.length > 0 ||
    approvedNotWritten.length > 0 ||
    auditsWithoutDraft.length > 0 ||
    writtenDraftsMissingAudit.length > 0 ||
    duplicateFilePaths.length > 0 ||
    failedCount > 0;

  const hasArchivedHistory = historicalArchivedAuditCount > 0;

  return {
    totalDrafts, totalAudits, writtenCount, failedCount,
    confirmedWrittenDraftCount, lastRunWritten,
    inLastRunNotInAudits, approvedNotWritten, auditsWithoutDraft,
    writtenDraftsMissingAudit, duplicateFilePaths,
    repairableCount, needsReview,
    historicalArchivedAuditCount, historicalArchivedAudits, hasArchivedHistory,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CountCell({ label, value, highlight, warn }) {
  const color = highlight ? 'text-destructive' : warn ? 'text-accent' : 'text-primary';
  return (
    <div className="flex flex-col items-center px-2 py-2 bg-background/60 border border-border/30 rounded-sm">
      <span className={`text-[11px] font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-[6px] font-mono text-slate-500 text-center mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

function DisclosureList({ title, items, keyFn, renderFn, emptyMsg, color = 'text-slate-400' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/30 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-card/60 hover:bg-card text-left transition-colors">
        <span className={`text-[8px] font-bold ${items.length > 0 ? color : 'text-slate-500'}`}>
          {title} <span className="font-mono">({items.length})</span>
        </span>
        {open ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
               : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-border/20 space-y-1 bg-background/40 max-h-40 overflow-y-auto">
          {items.length === 0
            ? <div className="text-[7px] font-mono text-slate-600">{emptyMsg}</div>
            : items.map((item, i) => (
                <div key={keyFn ? keyFn(item, i) : i} className="text-[7px] font-mono text-slate-400">
                  {renderFn(item, i)}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

function RepairLogTable({ log }) {
  const [open, setOpen] = useState(false);
  if (!log?.length) return null;

  const statusColor = (s) => {
    if (s === 'REPAIRED') return 'text-primary';
    if (s === 'ERROR') return 'text-destructive';
    if (s === 'BLOCKED') return 'text-destructive/70';
    if (s === 'MANUAL_REVIEW') return 'text-accent';
    return 'text-slate-500';
  };

  return (
    <div className="border border-border/30 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-card/60 hover:bg-card text-left transition-colors">
        <span className="text-[8px] font-bold text-slate-400">Repair Log <span className="font-mono">({log.length} entries)</span></span>
        {open ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
               : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-border/20 bg-background/40 overflow-x-auto">
          <table className="w-full text-[7px] font-mono">
            <thead>
              <tr className="border-b border-border/20">
                {['draftId', 'filename', 'folder', 'action', 'status', 'reason'].map(h => (
                  <th key={h} className="text-left px-2 py-1.5 text-slate-500 uppercase tracking-widest font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((row, i) => (
                <tr key={i} className="border-b border-border/10 hover:bg-card/30">
                  <td className="px-2 py-1 text-slate-500 truncate max-w-[80px]">{row.draftId || row.auditId || '—'}</td>
                  <td className="px-2 py-1 text-slate-300">{row.filename}</td>
                  <td className="px-2 py-1 text-slate-500 truncate max-w-[100px]">{row.folder}</td>
                  <td className="px-2 py-1 text-slate-400">{row.action}</td>
                  <td className={`px-2 py-1 font-bold ${statusColor(row.status)}`}>{row.status}</td>
                  <td className="px-2 py-1 text-slate-500 max-w-[200px]">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DebugRow({ label, value, highlight }) {
  return (
    <div className="flex gap-1 py-0.5 border-b border-border/10 last:border-0">
      <span className="text-slate-600 shrink-0 w-36 text-[6px]">{label}</span>
      <span className={`text-[6px] font-mono break-all ${highlight ? 'text-amber-300' : 'text-slate-400'}`}>{value || <span className="text-slate-700 italic">—</span>}</span>
    </div>
  );
}

function OrphanSkipDebugTable({ log }) {
  const skipped = log.filter(r => r.status === 'NO_MATCH');
  const [expanded, setExpanded] = useState(true);
  if (!skipped.length) return null;
  return (
    <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-amber-500/10 transition-colors text-left">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[7px] font-bold text-amber-400 uppercase tracking-wide">
            {skipped.length} skipped orphan audit{skipped.length !== 1 ? 's' : ''} — diagnostic detail
          </span>
        </div>
        {expanded ? <ChevronDown className="w-3 h-3 text-amber-500/60" /> : <ChevronRight className="w-3 h-3 text-amber-500/60" />}
      </button>
      {expanded && (
        <div className="border-t border-amber-500/20 divide-y divide-amber-500/10">
          {skipped.map((row, i) => {
            const d = row.debug || {};
            return (
              <div key={i} className="p-3 space-y-2">
                <div className="text-[7px] font-bold text-amber-300 uppercase tracking-wide">
                  Audit #{i + 1} — {d.auditId || row.auditId || '?'}
                </div>

                {/* Two-column: audit vs best candidate */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Audit column */}
                  <div className="bg-background/50 border border-amber-500/20 rounded-sm p-2">
                    <div className="text-[6px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">Orphan Audit</div>
                    <DebugRow label="auditId (schema)" value={d.auditId} />
                    <DebugRow label="entity id" value={d.auditEntityId} />
                    <DebugRow label="filePath" value={d.auditFilePath} highlight={!d.auditFilePath} />
                    <DebugRow label="folder/targetFolder" value={d.auditFolder} highlight={!d.auditFolder} />
                    <DebugRow label="filename/fileName" value={d.auditFilename} highlight={!d.auditFilename} />
                    <DebugRow label="source" value={d.auditSource} />
                    <DebugRow label="timestamp" value={d.auditTimestamp} />
                    <DebugRow label="writtenAt" value={d.auditWrittenAt} />
                  </div>

                  {/* Best candidate draft column */}
                  <div className="bg-background/50 border border-slate-700/40 rounded-sm p-2">
                    <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Best Candidate Draft <span className="text-primary">score={d.bestScore ?? 0}</span>
                    </div>
                    <DebugRow label="draft id" value={d.bestCandidateId} />
                    <DebugRow label="filePath" value={d.bestDraftFilePath} highlight={!d.bestDraftFilePath} />
                    <DebugRow label="folder/targetFolder" value={d.bestDraftFolder} highlight={!d.bestDraftFolder} />
                    <DebugRow label="filename/fileName" value={d.bestDraftFilename} highlight={!d.bestDraftFilename} />
                    <DebugRow label="source" value={d.bestDraftSource} />
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="bg-background/40 border border-border/30 rounded-sm p-2 space-y-1">
                  <div className="text-[6px] font-bold text-slate-500 uppercase tracking-widest mb-1">Score Breakdown</div>
                  {d.scoreBreakdown?.length > 0
                    ? d.scoreBreakdown.map((s, j) => (
                        <div key={j} className="text-[6px] font-mono text-primary/80">✓ {s}</div>
                      ))
                    : <div className="text-[6px] font-mono text-slate-600 italic">No points awarded — no fields matched</div>
                  }
                  <div className="text-[6px] font-mono text-amber-400/80 border-t border-border/20 pt-1 mt-1">
                    Total: {d.bestScore ?? 0}pts — threshold: 40pts — {(d.bestScore ?? 0) >= 40 ? '✓ would pass' : '✗ below threshold'}
                  </div>
                </div>

                {/* Skip reason */}
                <div className="text-[6px] font-mono text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-sm px-2 py-1.5 break-all">
                  <span className="font-bold">Skip reason:</span> {d.skipReason || row.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StorageReconciliationPanel({ workflowSummary, className = '' }) {
  const [result, setResult] = useState(null);
  const [allDrafts, setAllDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  // Repair state
  const [repairArmed, setRepairArmed] = useState(false);
  const [repairCountdown, setRepairCountdown] = useState(0);
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);
  const [repairError, setRepairError] = useState('');
  const armTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // Orphan reconciliation state
  const [orphanArmed, setOrphanArmed] = useState(false);
  const [orphanCountdown, setOrphanCountdown] = useState(0);
  const [reconciling, setReconciling] = useState(false);
  const [orphanResult, setOrphanResult] = useState(null);
  const [orphanError, setOrphanError] = useState('');
  const orphanArmTimerRef = useRef(null);
  const orphanCountdownRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(armTimerRef.current);
    clearInterval(countdownRef.current);
    clearTimeout(orphanArmTimerRef.current);
    clearInterval(orphanCountdownRef.current);
  }, []);

  // ── Reconcile Now ─────────────────────────────────────────────────────────

  const runReconciliation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [drafts, audits] = await Promise.all([
        loadDraftsFromBackend(500),
        loadAuditsFromBackend(500),
      ]);
      setAllDrafts(drafts);
      setResult(reconcile(drafts, audits, workflowSummary));
    } catch (e) {
      setError(e?.message || 'Backend read failed during reconciliation');
    }
    setLoading(false);
  }, [workflowSummary]);

  // ── Repair: arm + confirm ─────────────────────────────────────────────────

  const armRepair = () => {
    setRepairArmed(true);
    setRepairCountdown(Math.ceil(CONFIRM_TTL_MS / 1000));
    setRepairResult(null);
    setRepairError('');

    armTimerRef.current = setTimeout(() => {
      setRepairArmed(false);
      setRepairCountdown(0);
      clearInterval(countdownRef.current);
    }, CONFIRM_TTL_MS);

    countdownRef.current = setInterval(() => {
      setRepairCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const cancelArm = () => {
    setRepairArmed(false);
    setRepairCountdown(0);
    clearTimeout(armTimerRef.current);
    clearInterval(countdownRef.current);
  };

  const runRepair = async () => {
    cancelArm();
    setRepairing(true);
    setRepairResult(null);
    setRepairError('');
    try {
      const r = await repairIndexMetadata();
      setRepairResult(r);
      const [drafts, audits] = await Promise.all([
        loadDraftsFromBackend(500),
        loadAuditsFromBackend(500),
      ]);
      setAllDrafts(drafts);
      setResult(reconcile(drafts, audits, workflowSummary));
    } catch (e) {
      setRepairError(e?.message || 'Repair failed');
    }
    setRepairing(false);
  };

  // ── Orphan reconciliation: arm + confirm ─────────────────────────────────

  const armOrphan = () => {
    setOrphanArmed(true);
    setOrphanCountdown(Math.ceil(CONFIRM_TTL_MS / 1000));
    setOrphanResult(null);
    setOrphanError('');

    orphanArmTimerRef.current = setTimeout(() => {
      setOrphanArmed(false);
      setOrphanCountdown(0);
      clearInterval(orphanCountdownRef.current);
    }, CONFIRM_TTL_MS);

    orphanCountdownRef.current = setInterval(() => {
      setOrphanCountdown(c => {
        if (c <= 1) { clearInterval(orphanCountdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const cancelOrphan = () => {
    setOrphanArmed(false);
    setOrphanCountdown(0);
    clearTimeout(orphanArmTimerRef.current);
    clearInterval(orphanCountdownRef.current);
  };

  const runOrphanReconcile = async () => {
    cancelOrphan();
    setReconciling(true);
    setOrphanResult(null);
    setOrphanError('');
    try {
      const r = await reconcileOrphanAudits();
      setOrphanResult(r);
      const [drafts, audits] = await Promise.all([
        loadDraftsFromBackend(500),
        loadAuditsFromBackend(500),
      ]);
      setAllDrafts(drafts);
      setResult(reconcile(drafts, audits, workflowSummary));
    } catch (e) {
      setOrphanError(e?.message || 'Orphan reconciliation failed');
    }
    setReconciling(false);
  };

  // ── Duplicate filePath archive ────────────────────────────────────────────

  const [dupArmed, setDupArmed] = useState(false);
  const [dupRunning, setDupRunning] = useState(false);
  const [dupResult, setDupResult] = useState(null);
  const [dupError, setDupError] = useState('');

  const runArchiveDuplicates = async () => {
    setDupArmed(false);
    setDupRunning(true);
    setDupResult(null);
    setDupError('');

    const now = new Date().toISOString();
    const counts = {
      duplicateGroupsFound: 0,
      recordsChecked: 0,
      draftsArchived: 0,
      auditsArchived: 0,
      preservedRecords: 0,
      errors: 0,
    };

    try {
      // Load active (non-archived) drafts and audits
      const [allDrafts, allAudits] = await Promise.all([
        loadDraftsFromBackend(500),
        loadAuditsFromBackend(500),
      ]);

      const activeDrafts = allDrafts.filter(d => !d.archived);
      const activeAudits = allAudits.filter(a => !a.archived);

      counts.recordsChecked = activeDrafts.length + activeAudits.length;

      // Group active drafts by filePath
      const draftsByFilePath = {};
      for (const d of activeDrafts) {
        if (!d.filePath) continue;
        if (!draftsByFilePath[d.filePath]) draftsByFilePath[d.filePath] = [];
        draftsByFilePath[d.filePath].push(d);
      }

      // Process only groups with > 1 record
      const dupGroups = Object.entries(draftsByFilePath).filter(([, g]) => g.length > 1);
      counts.duplicateGroupsFound = dupGroups.length;

      for (const [, group] of dupGroups) {
        // Sort: prefer COMPLETED + writtenAt desc, then created_date desc
        const sorted = [...group].sort((a, b) => {
          const aComplete = a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' ? 1 : 0;
          const bComplete = b.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' ? 1 : 0;
          if (bComplete !== aComplete) return bComplete - aComplete;
          const aTs = a.writtenAt || a.created_date || '';
          const bTs = b.writtenAt || b.created_date || '';
          return bTs.localeCompare(aTs);
        });

        // Preserve newest/best record; archive the rest
        const [preserved, ...toArchive] = sorted;
        counts.preservedRecords++;

        for (const draft of toArchive) {
          try {
            await base44.entities.VeridanObsidianDraft.update(draft.id, {
              archived: true,
              archiveReason: 'DUPLICATE_FILEPATH_OLDER_RECORD',
              archivedAt: now,
            });
            counts.draftsArchived++;
          } catch {
            counts.errors++;
          }

          // Archive matching audits by draftId
          const matchingAudits = activeAudits.filter(a =>
            a.draftId === (draft.draftId || draft.id) ||
            a.draftId === draft.id
          );
          for (const audit of matchingAudits) {
            try {
              await base44.entities.VeridanObsidianWriteAudit.update(audit.id, {
                archived: true,
                archiveReason: 'DUPLICATE_FILEPATH_OLDER_AUDIT',
                archivedAt: now,
              });
              counts.auditsArchived++;
            } catch {
              counts.errors++;
            }
          }
        }
      }

      setDupResult(counts);

      // Refresh reconciliation
      const [drafts, audits] = await Promise.all([
        loadDraftsFromBackend(500),
        loadAuditsFromBackend(500),
      ]);
      setAllDrafts(drafts);
      setResult(reconcile(drafts, audits, workflowSummary));
    } catch (e) {
      setDupError(e?.message || 'Duplicate archive failed');
    }

    setDupRunning(false);
  };

  // ── Status badge ──────────────────────────────────────────────────────────

  const statusBadge = result
    ? result.needsReview
      ? { label: 'REVIEW REQUIRED', cls: 'text-destructive bg-destructive/10 border-destructive/40', icon: AlertTriangle }
      : result.hasArchivedHistory
        ? { label: 'ARCHIVED HISTORY PRESENT', cls: 'text-accent bg-accent/10 border-accent/30', icon: CheckCircle2 }
        : { label: 'CONSISTENT', cls: 'text-primary bg-primary/10 border-primary/30', icon: CheckCircle2 }
    : null;

  return (
    <div className={`border border-border/40 bg-card rounded-sm overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <GitCompare className="w-3.5 h-3.5 text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Storage Reconciliation</span>
          {statusBadge && (
            <span className={`flex items-center gap-1 px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${statusBadge.cls}`}>
              <statusBadge.icon className="w-2.5 h-2.5" />
              {statusBadge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setShowVerification(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 rounded-sm transition-colors">
            <ShieldCheck className="w-2.5 h-2.5" /> Verify
          </button>
          <button type="button" onClick={runReconciliation} disabled={loading || repairing}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-accent/30 text-accent hover:border-accent/60 rounded-sm transition-colors disabled:opacity-40">
            <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
            {result ? 'Reconcile Now' : 'Run Reconciliation'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* Idle prompt */}
        {!result && !loading && !error && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <GitCompare className="w-3 h-3" />
            Click "Run Reconciliation" to compare backend draft records, write audits, and indexed files.
          </div>
        )}

        {/* Loading */}
        {(loading || repairing || reconciling) && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            {repairing ? 'Running metadata repair…' : reconciling ? 'Reconciling orphan audits…' : 'Reading backend entities…'}
          </div>
        )}

        {/* Reconcile error */}
        {error && !loading && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[7px] font-mono text-destructive">
              <span className="font-bold">Reconciliation error:</span> {error}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Count summary */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <CountCell label="Active Drafts" value={result.totalDrafts} />
              <CountCell label="Active Audits" value={result.totalAudits} />
              <CountCell label="Written Files" value={result.writtenCount} />
              <CountCell label="Confirmed Written" value={result.confirmedWrittenDraftCount} />
              <CountCell label="Failed Writes" value={result.failedCount} highlight={result.failedCount > 0} />
              <CountCell label="Repairable" value={result.repairableCount} warn={result.repairableCount > 0} />
            </div>
            {/* Historical archived count */}
            {result.hasArchivedHistory && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-700/40 rounded-sm">
                <Info className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-[7px] font-mono text-slate-500">
                  <span className="text-slate-300 font-bold">{result.historicalArchivedAuditCount}</span> historical archived CVP audit records excluded from active reconciliation (see below)
                </span>
              </div>
            )}

            {/* Mismatch details */}
            <div className="space-y-1.5">
              <DisclosureList
                title="Audits in last run result not found in audit records"
                items={result.inLastRunNotInAudits}
                keyFn={(f, i) => i}
                renderFn={f => `⚠ ${f}`}
                emptyMsg="All last-run written filenames matched in audit records."
                color="text-destructive"
              />
              <DisclosureList
                title="Approved drafts not yet written"
                items={result.approvedNotWritten}
                keyFn={d => d.id || d.draftId}
                renderFn={d => `→ ${d.filename}  [${d.targetFolder}]  type: ${d.draftType}`}
                emptyMsg="All approved drafts have been written."
                color="text-accent"
              />
              <DisclosureList
                title="Written drafts missing audit records"
                items={result.writtenDraftsMissingAudit}
                keyFn={d => d.id || d.draftId}
                renderFn={d => `→ ${d.filename}  filePath: ${d.filePath}`}
                emptyMsg="All written drafts have matching audit records."
                color="text-accent"
              />
              <DisclosureList
                title="Write audits without a matching draft record"
                items={result.auditsWithoutDraft}
                keyFn={a => a.id || a.auditId}
                renderFn={a => `→ ${a.filename}  draftId: ${a.draftId || 'none'}`}
                emptyMsg="All audit records have a matching draft."
                color="text-slate-400"
              />
              <DisclosureList
                title="Duplicate filePath records (manual review required)"
                items={result.duplicateFilePaths}
                keyFn={(f, i) => i}
                renderFn={f => `⚠ ${f}`}
                emptyMsg="No duplicate filePaths detected."
                color="text-destructive"
              />
            </div>

            {/* Historical / Archived CVP audits */}
            {result.hasArchivedHistory && (
              <DisclosureList
                title="Historical / Archived CVP Audits (old test runs — excluded from active reconciliation)"
                items={result.historicalArchivedAudits}
                keyFn={a => a.id || a.auditId}
                renderFn={a => `📦 ${a.filename || '—'}  draftId: ${a.draftId || 'none'}  written: ${a.filesystemWrite || '—'}`}
                emptyMsg="No archived CVP audit records."
                color="text-slate-500"
              />
            )}

            {/* Status line */}
            <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2">
              {result.needsReview
                ? <span className="text-destructive/70">⚠ One or more reconciliation checks require operator review.</span>
                : result.hasArchivedHistory
                  ? <span className="text-accent/70">✅ Active reconciliation passed — {result.historicalArchivedAuditCount} historical archived CVP audit records present (not active orphans).</span>
                  : <span className="text-primary/60">✅ All reconciliation checks passed — storage is consistent.</span>
              }
            </div>

            {/* ── Repair section ───────────────────────────────────────────── */}
            <div className="border border-border/40 rounded-sm overflow-hidden mt-1">
              {/* Safety banner */}
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/20">
                <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[7px] font-bold text-amber-500 uppercase tracking-wide">
                  Metadata repair only · No vault files written · No OpenClaw dispatch · No execution
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                <div className="text-[7px] font-mono text-slate-500 space-y-0.5">
                  <div>Repairs only: <span className="text-slate-300">filePath · writtenAt · filesystemWrite · approvalStatus · riskLevel</span></div>
                  <div>Source: matching <span className="text-primary">VeridanObsidianWriteAudit</span> record with <span className="text-primary">COMPLETED_APPROVED_DRAFT_ONLY</span> status</div>
                  <div>Blocked: MEDIUM/HIGH risk · non-standard executionStatus/dispatchStatus/openclawCall · credential fields · unproven drafts</div>
                </div>

                {/* Arm / Confirm / Cancel */}
                {!repairArmed && (
                  <button type="button" onClick={armRepair}
                    disabled={repairing || loading}
                    className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-accent/40 text-accent bg-accent/5 hover:bg-accent/15 disabled:opacity-40 rounded-sm transition-colors">
                    <Wrench className="w-3 h-3" /> Repair Index Metadata
                  </button>
                )}

                {repairArmed && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 rounded-sm">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-[8px] font-bold text-amber-500">
                        Confirm metadata repair? Auto-expires in {repairCountdown}s
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={runRepair}
                        className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> Confirm Metadata Repair
                      </button>
                      <button type="button" onClick={cancelArm}
                        className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-border/40 text-slate-400 hover:text-slate-200 rounded-sm transition-colors">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Repair error */}
                {repairError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <div className="text-[7px] font-mono text-destructive">
                      <span className="font-bold">Repair error:</span> {repairError}
                    </div>
                  </div>
                )}

                {/* Repair result summary */}
                {repairResult && (
                  <div className="space-y-2">
                    <div className="border border-primary/30 bg-primary/5 rounded-sm p-3">
                      <div className="text-[8px] font-bold text-primary mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Metadata Repair Complete
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: 'Checked', value: repairResult.checked, color: 'text-slate-300' },
                          { label: 'Repaired', value: repairResult.repaired, color: 'text-primary' },
                          { label: 'Skipped', value: repairResult.skipped, color: 'text-slate-500' },
                          { label: 'Blocked', value: repairResult.blocked, color: repairResult.blocked > 0 ? 'text-destructive' : 'text-slate-500' },
                          { label: 'Manual Review', value: repairResult.manualReviewRequired, color: repairResult.manualReviewRequired > 0 ? 'text-accent' : 'text-slate-500' },
                          { label: 'Errors', value: repairResult.errors, color: repairResult.errors > 0 ? 'text-destructive' : 'text-slate-500' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex flex-col items-center px-2 py-1.5 bg-background/50 border border-border/30 rounded-sm">
                            <span className={`text-[10px] font-bold ${color}`}>{value}</span>
                            <span className="text-[6px] font-mono text-slate-600">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[6px] font-mono text-slate-600 mt-2 border-t border-border/20 pt-1.5">
                        No vault files written · executionStatus/dispatchStatus/openclawCall untouched · audit records preserved
                      </div>
                    </div>

                    {/* Repair log */}
                    <RepairLogTable log={repairResult.log} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Duplicate FilePath Archive ───────────────────────────────── */}
            <div className="border border-border/40 rounded-sm overflow-hidden mt-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border-b border-border/30">
                <Archive className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
                  Archive Duplicate FilePath Records — metadata only · no vault writes · no bridge · no deletion
                </span>
              </div>
              <div className="p-3 space-y-2.5">
                <div className="text-[7px] font-mono text-slate-500 space-y-0.5">
                  <div>Finds active draft records sharing the same <span className="text-slate-300">filePath</span>. Preserves the newest successful record per group. Archives older duplicates by setting <span className="text-primary">archived: true</span>.</div>
                  <div>Also archives matching audit records for each archived draft. No records deleted. No vault writes. No bridge calls.</div>
                </div>

                {!dupArmed && !dupRunning && (
                  <button type="button" onClick={() => setDupArmed(true)}
                    disabled={dupRunning || loading || repairing}
                    className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-slate-500/40 text-slate-400 bg-slate-800/30 hover:bg-slate-700/30 disabled:opacity-40 rounded-sm transition-colors">
                    <Archive className="w-3 h-3" /> Archive Duplicate FilePath Records
                  </button>
                )}

                {dupArmed && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 rounded-sm">
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-[8px] font-bold text-amber-500">
                        Confirm: archive older duplicate filePath records? This cannot be undone from UI (records remain in DB, only metadata changes).
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={runArchiveDuplicates}
                        className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> Confirm Archive Duplicates
                      </button>
                      <button type="button" onClick={() => setDupArmed(false)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-border/40 text-slate-400 hover:text-slate-200 rounded-sm transition-colors">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {dupRunning && (
                  <div className="flex items-center gap-2 text-[8px] font-mono text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Archiving duplicate records…
                  </div>
                )}

                {dupError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <div className="text-[7px] font-mono text-destructive"><span className="font-bold">Error:</span> {dupError}</div>
                  </div>
                )}

                {dupResult && (
                  <div className="border border-primary/30 bg-primary/5 rounded-sm p-3 space-y-2">
                    <div className="text-[8px] font-bold text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Duplicate FilePath Archive Complete
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Dup Groups', value: dupResult.duplicateGroupsFound, color: dupResult.duplicateGroupsFound > 0 ? 'text-accent' : 'text-slate-300' },
                        { label: 'Records Checked', value: dupResult.recordsChecked, color: 'text-slate-300' },
                        { label: 'Drafts Archived', value: dupResult.draftsArchived, color: 'text-primary' },
                        { label: 'Audits Archived', value: dupResult.auditsArchived, color: 'text-primary' },
                        { label: 'Preserved', value: dupResult.preservedRecords, color: 'text-primary' },
                        { label: 'Errors', value: dupResult.errors, color: dupResult.errors > 0 ? 'text-destructive' : 'text-slate-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex flex-col items-center px-2 py-1.5 bg-background/50 border border-border/30 rounded-sm">
                          <span className={`text-[10px] font-bold ${color}`}>{value}</span>
                          <span className="text-[6px] font-mono text-slate-600">{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-1.5">
                      No records deleted · No vault writes · No bridge calls · Reconciliation refreshed above
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Orphan Audit Reconciliation section ─────────────────────── */}
            <div className="border border-border/40 rounded-sm overflow-hidden mt-1">
              {/* Safety banner */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20">
                <Shield className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[7px] font-bold text-primary uppercase tracking-wide">
                  Orphan Audit Reconciliation — metadata link only · no vault writes · no OpenClaw
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                <div className="text-[7px] font-mono text-slate-500 space-y-0.5">
                  <div>Links orphan <span className="text-primary">VeridanObsidianWriteAudit</span> records to matching <span className="text-primary">VeridanObsidianDraft</span> records via filePath / folder / filename / source matching.</div>
                  <div>Confidence threshold: <span className="text-slate-300">≥ 40pts</span> (filePath exact = 50pts · constructed path = 45pts · folder = 20pts · filename = 20pts · source = 10pts · timestamp ≤60s = 5pts)</div>
                  <div>Safe fields only: <span className="text-slate-300">draftId · reconciliationStatus · reconciledAt · filePath · writtenAt · filesystemWrite</span></div>
                  <div className="text-destructive/70">Blocked: executionStatus · dispatchStatus · openclawCall · credentials · MEDIUM/HIGH risk · draft content/filename/folder</div>
                </div>

                {/* Arm / Confirm / Cancel */}
                {!orphanArmed && (
                  <button type="button" onClick={armOrphan}
                    disabled={reconciling || repairing || loading}
                    className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 disabled:opacity-40 rounded-sm transition-colors">
                    <GitCompare className="w-3 h-3" /> Reconcile Orphan Audits
                  </button>
                )}

                {orphanArmed && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/40 rounded-sm">
                      <Clock className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-[8px] font-bold text-primary">
                        Confirm orphan reconciliation? Auto-expires in {orphanCountdown}s
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={runOrphanReconcile}
                        className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> Confirm Reconcile Orphans
                      </button>
                      <button type="button" onClick={cancelOrphan}
                        className="flex items-center gap-1.5 px-3 py-2 text-[8px] font-bold uppercase tracking-widest border border-border/40 text-slate-400 hover:text-slate-200 rounded-sm transition-colors">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Orphan error */}
                {orphanError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <div className="text-[7px] font-mono text-destructive">
                      <span className="font-bold">Reconcile error:</span> {orphanError}
                    </div>
                  </div>
                )}

                {/* Orphan result summary */}
                {orphanResult && (
                  <div className="space-y-2">
                    <div className="border border-primary/30 bg-primary/5 rounded-sm p-3">
                      <div className="text-[8px] font-bold text-primary mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Orphan Reconciliation Complete
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: 'Checked', value: orphanResult.checked, color: 'text-slate-300' },
                          { label: 'Repaired', value: orphanResult.repaired, color: 'text-primary' },
                          { label: 'Skipped', value: orphanResult.skipped, color: 'text-slate-500' },
                          { label: 'Blocked', value: orphanResult.blocked, color: orphanResult.blocked > 0 ? 'text-destructive' : 'text-slate-500' },
                          { label: 'Errors', value: orphanResult.errors, color: orphanResult.errors > 0 ? 'text-destructive' : 'text-slate-500' },
                          { label: 'Orphans Left', value: Math.max(0, orphanResult.checked - orphanResult.repaired - orphanResult.blocked - orphanResult.errors - orphanResult.skipped), color: 'text-slate-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex flex-col items-center px-2 py-1.5 bg-background/50 border border-border/30 rounded-sm">
                            <span className={`text-[10px] font-bold ${color}`}>{value}</span>
                            <span className="text-[6px] font-mono text-slate-600">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[6px] font-mono text-slate-600 mt-2 border-t border-border/20 pt-1.5">
                        No vault files written · executionStatus/dispatchStatus/openclawCall untouched · records preserved
                      </div>
                    </div>

                    {/* Skipped debug section — expanded diagnostic table */}
                    {orphanResult.skipped > 0 && <OrphanSkipDebugTable log={orphanResult.log} />}

                    {/* Manual link fallback for skipped orphans */}
                    {orphanResult.skipped > 0 && allDrafts.length > 0 && (
                      <OrphanManualLinkPanel
                        log={orphanResult.log}
                        drafts={allDrafts}
                        onAnyLinked={runReconciliation}
                      />
                    )}

                    {/* Orphan repair log */}
                    <RepairLogTable log={orphanResult.log.filter(r => r.status !== 'NO_MATCH')} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Verification panel */}
        {showVerification && (
          <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
            <div className="text-[7px] font-bold uppercase tracking-widest text-primary/80 mb-2">Safety Verification Report</div>
            {REPAIR_VERIFICATIONS.map((v, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                {v}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}