/**
 * OrphanManualLinkPanel
 * Lets an operator manually link a skipped orphan audit to a draft.
 *
 * SAFE — only writes to VeridanObsidianWriteAudit:
 *   draftId, reconciliationStatus, reconciledAt,
 *   reconciliationConfidence, reconciliationMethod="MANUAL_OPERATOR_LINK"
 *
 * NEVER:
 *   - Writes vault files
 *   - Calls OpenClaw
 *   - Modifies executionStatus / dispatchStatus / openclawCall
 *   - Modifies credential fields, draft content, fileName, targetFolder, source
 */

import React, { useState } from 'react';
import { Link2, CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Fields that must NEVER be written
const BLOCKED_FIELDS = [
  'executionStatus', 'dispatchStatus', 'openclawCall',
  'credentialRef', 'brokerKey', 'apiKey', 'token', 'secret', 'password',
  'content', 'fileName', 'filename', 'targetFolder', 'source',
];

function DebugField({ label, value, missing }) {
  return (
    <div className="flex gap-1 py-0.5">
      <span className="text-slate-600 shrink-0 w-28 text-[6px]">{label}</span>
      <span className={`text-[6px] font-mono break-all ${missing ? 'text-destructive/70 italic' : 'text-slate-400'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function SingleOrphanLinker({ row, drafts, auditEntityId, onLinked }) {
  const d = row.debug || {};
  const [open, setOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const selectedDraft = drafts.find(dr => (dr.draftId || dr.id) === selectedDraftId);

  const handleConfirm = () => {
    if (!selectedDraftId) return;
    setConfirming(true);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedDraftId || !auditEntityId) {
      setError('Missing audit entity ID or selected draft.');
      return;
    }

    // Double-check we're not writing blocked fields
    const patch = {
      draftId: selectedDraftId,
      reconciliationStatus: 'RECONCILED',
      reconciledAt: new Date().toISOString(),
      reconciliationConfidence: 'MANUAL',
      reconciliationMethod: 'MANUAL_OPERATOR_LINK',
    };

    // Paranoia: verify no blocked field leaked in
    for (const f of BLOCKED_FIELDS) {
      if (f in patch) {
        setError(`BLOCKED: patch contains prohibited field "${f}"`);
        setConfirming(false);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      await base44.entities.VeridanObsidianWriteAudit.update(auditEntityId, patch);
      setSaved(true);
      setConfirming(false);
      if (onLinked) onLinked(auditEntityId, selectedDraftId);
    } catch (e) {
      setError(e?.message || 'Save failed');
    }
    setSaving(false);
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-sm">
        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[7px] font-mono text-primary">
          Linked → <span className="font-bold">{selectedDraftId}</span> · method: MANUAL_OPERATOR_LINK
        </span>
      </div>
    );
  }

  return (
    <div className="border border-amber-500/20 bg-background/40 rounded-sm overflow-hidden">
      {/* Audit summary header */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-amber-500/5 transition-colors text-left">
        <div className="min-w-0 flex-1">
          <div className="text-[7px] font-bold text-amber-300 truncate">
            {d.auditId || row.auditId || 'unknown audit'}
          </div>
          <div className="text-[6px] font-mono text-slate-600 mt-0.5 truncate">
            {d.auditFilePath || [d.auditFolder, d.auditFilename].filter(Boolean).join('/') || 'no path'}
            {d.bestScore != null && (
              <span className="ml-2 text-amber-500/70">best score: {d.bestScore}pts</span>
            )}
          </div>
        </div>
        {open ? <ChevronDown className="w-3 h-3 text-amber-500/50 shrink-0" /> : <ChevronRight className="w-3 h-3 text-amber-500/50 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-amber-500/15 p-3 space-y-3">
          {/* Audit fields */}
          <div className="bg-background/60 border border-amber-500/20 rounded-sm p-2">
            <div className="text-[6px] font-bold text-amber-400 uppercase tracking-widest mb-1">Orphan Audit Fields</div>
            <DebugField label="auditId" value={d.auditId} />
            <DebugField label="entity id" value={d.auditEntityId} />
            <DebugField label="filePath" value={d.auditFilePath} missing={!d.auditFilePath} />
            <DebugField label="folder" value={d.auditFolder} missing={!d.auditFolder} />
            <DebugField label="filename" value={d.auditFilename} missing={!d.auditFilename} />
            <DebugField label="source" value={d.auditSource} />
            <DebugField label="timestamp" value={d.auditTimestamp} />
          </div>

          {/* Draft selector */}
          {!confirming && !saving && (
            <div className="space-y-2">
              <div className="text-[7px] font-bold text-slate-400">Select matching draft:</div>
              <select
                value={selectedDraftId}
                onChange={e => setSelectedDraftId(e.target.value)}
                className="w-full bg-background border border-border/40 text-slate-300 text-[7px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-primary/50"
              >
                <option value="">— choose a draft —</option>
                {drafts.map(dr => {
                  const id = dr.draftId || dr.id;
                  const label = [dr.filename, dr.targetFolder, dr.draftType].filter(Boolean).join(' · ');
                  return <option key={id} value={id}>{label} [{id.slice(0, 12)}…]</option>;
                })}
              </select>

              {/* Preview selected draft */}
              {selectedDraft && (
                <div className="bg-primary/5 border border-primary/20 rounded-sm p-2 space-y-0.5">
                  <div className="text-[6px] font-bold text-primary uppercase tracking-widest mb-1">Selected Draft Preview</div>
                  <DebugField label="draftId" value={selectedDraft.draftId || selectedDraft.id} />
                  <DebugField label="filename" value={selectedDraft.filename} />
                  <DebugField label="targetFolder" value={selectedDraft.targetFolder} />
                  <DebugField label="filePath" value={selectedDraft.filePath} />
                  <DebugField label="source" value={selectedDraft.source} />
                  <DebugField label="draftType" value={selectedDraft.draftType} />
                  <DebugField label="approvalStatus" value={selectedDraft.approvalStatus} />
                </div>
              )}

              <button type="button"
                onClick={handleConfirm}
                disabled={!selectedDraftId}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase tracking-widest border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 disabled:opacity-30 rounded-sm transition-colors">
                <Link2 className="w-3 h-3" /> Link This Draft
              </button>
            </div>
          )}

          {/* Confirmation gate */}
          {confirming && !saving && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 rounded-sm">
                <Clock className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[7px] font-mono text-amber-300 space-y-0.5">
                  <div className="font-bold">Confirm manual link?</div>
                  <div>Audit <span className="text-amber-200">{d.auditId || auditEntityId}</span></div>
                  <div>→ Draft <span className="text-primary">{selectedDraftId}</span></div>
                  <div className="text-amber-500/70 text-[6px] mt-1">
                    Only writes: draftId · reconciliationStatus · reconciledAt · reconciliationConfidence · reconciliationMethod=MANUAL_OPERATOR_LINK
                  </div>
                  <div className="text-destructive/60 text-[6px]">
                    No vault files · no OpenClaw · executionStatus/dispatchStatus/openclawCall untouched
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase tracking-widest border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors">
                  <CheckCircle2 className="w-3 h-3" /> Confirm Save Link
                </button>
                <button type="button" onClick={() => setConfirming(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase tracking-widest border border-border/40 text-slate-400 hover:text-slate-200 rounded-sm transition-colors">
                  <XCircle className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Saving indicator */}
          {saving && (
            <div className="text-[7px] font-mono text-primary flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border border-primary border-t-transparent rounded-full animate-spin" />
              Saving manual link…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-2 py-1.5 bg-destructive/10 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <span className="text-[6px] font-mono text-destructive">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrphanManualLinkPanel({ log, drafts, onAnyLinked }) {
  const skipped = log.filter(r => r.status === 'NO_MATCH');
  const [expanded, setExpanded] = useState(true);
  const [linkedCount, setLinkedCount] = useState(0);

  if (!skipped.length || !drafts?.length) return null;

  const handleLinked = (auditEntityId, draftId) => {
    setLinkedCount(c => c + 1);
    if (onAnyLinked) onAnyLinked();
  };

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Link2 className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[7px] font-bold text-primary uppercase tracking-wide">
            Manual Link — {skipped.length} skipped orphan{skipped.length !== 1 ? 's' : ''}
          </span>
          {linkedCount > 0 && (
            <span className="px-1.5 py-0.5 text-[6px] font-bold bg-primary/20 border border-primary/30 text-primary rounded-sm">
              {linkedCount} linked
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-3 h-3 text-primary/50" /> : <ChevronRight className="w-3 h-3 text-primary/50" />}
      </button>

      {expanded && (
        <div className="border-t border-primary/20 p-3 space-y-2">
          {/* Safety notice */}
          <div className="text-[6px] font-mono text-slate-600 bg-background/40 border border-border/20 rounded-sm px-2 py-1.5 space-y-0.5">
            <div className="font-bold text-slate-500 uppercase text-[5px] tracking-widest">Safety constraints</div>
            <div>Writes only: draftId · reconciliationStatus · reconciledAt · reconciliationConfidence · reconciliationMethod=MANUAL_OPERATOR_LINK</div>
            <div className="text-destructive/50">Blocked: vault files · OpenClaw · executionStatus · dispatchStatus · openclawCall · credentials · content · fileName · targetFolder · source</div>
          </div>

          {skipped.map((row, i) => (
            <SingleOrphanLinker
              key={row.debug?.auditEntityId || row.auditId || i}
              row={row}
              drafts={drafts}
              auditEntityId={row.debug?.auditEntityId}
              onLinked={handleLinked}
            />
          ))}
        </div>
      )}
    </div>
  );
}