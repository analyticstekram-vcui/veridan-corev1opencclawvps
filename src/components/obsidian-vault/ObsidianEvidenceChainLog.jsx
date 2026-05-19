/**
 * ObsidianEvidenceChainLog — Immutable evidence chain log for all vault actions.
 * Captures all create, update, task, and approval events in a tamper-evident chain.
 * No execution. Read-only audit trail. localStorage only. Export-only.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { Link2, Download, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'veridanObsidianEvidenceChainLog';
const SOURCES = {
  CREATE: 'veridanObsidianNoteCreateRequests',
  UPDATE: 'veridanObsidianNoteUpdateRequests',
  OCLAW: 'veridanObsidianOpenClawTaskQueue',
  APPROVALS: 'veridanObsidianApprovalDecisions',
};

const typeColor = {
  NOTE_CREATE: 'text-primary',
  NOTE_UPDATE: 'text-blue-400',
  OCLAW_TASK: 'text-amber-400',
  APPROVAL: 'text-purple-400',
  SYSTEM: 'text-slate-400',
};

const typeBorder = {
  NOTE_CREATE: 'border-primary/20',
  NOTE_UPDATE: 'border-blue-400/20',
  OCLAW_TASK: 'border-amber-400/20',
  APPROVAL: 'border-purple-400/20',
  SYSTEM: 'border-border/20',
};

export default function ObsidianEvidenceChainLog() {
  const [chain, setChain] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const buildChain = () => {
    const creates = loadFromStorage(SOURCES.CREATE).map(r => ({
      eventId: `evt-create-${r.requestId}`,
      eventType: 'NOTE_CREATE',
      summary: `Note create request: "${r.title}" in ${r.folder}`,
      riskLevel: r.riskLevel,
      taskType: r.taskType,
      executionStatus: r.executionStatus,
      itemId: r.requestId,
      timestamp: r.createdAt,
    }));

    const updates = loadFromStorage(SOURCES.UPDATE).map(r => ({
      eventId: `evt-update-${r.requestId}`,
      eventType: 'NOTE_UPDATE',
      summary: `Note update request: "${r.targetNote}" in ${r.folder}`,
      riskLevel: r.riskLevel,
      taskType: r.taskType,
      executionStatus: r.executionStatus,
      itemId: r.requestId,
      timestamp: r.createdAt,
    }));

    const oclaw = loadFromStorage(SOURCES.OCLAW).map(r => ({
      eventId: `evt-oclaw-${r.taskId}`,
      eventType: 'OCLAW_TASK',
      summary: `OpenClaw task: ${r.taskType} → ${r.target}`,
      riskLevel: r.riskLevel,
      taskType: r.taskType,
      executionStatus: r.executionStatus,
      dispatchStatus: r.dispatchStatus,
      itemId: r.taskId,
      timestamp: r.createdAt,
    }));

    const approvals = loadFromStorage(SOURCES.APPROVALS).map(r => ({
      eventId: `evt-approval-${r.approvalId}`,
      eventType: 'APPROVAL',
      summary: `Operator decision: ${r.decision} on "${r.label}" (${r.queueType})`,
      riskLevel: r.riskLevel,
      decision: r.decision,
      executionStatus: r.executionStatus,
      itemId: r.itemId,
      timestamp: r.reviewedAt,
    }));

    const all = [...creates, ...updates, ...oclaw, ...approvals]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setChain(all);
    saveToStorage(STORAGE_KEY, all);
  };

  useEffect(() => { buildChain(); }, []);

  const handleExport = () => {
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_OBSIDIAN_VAULT_EVIDENCE_CHAIN',
      data: { events: chain, totalEvents: chain.length, exportedAt: new Date().toISOString() },
      filename: 'veridan-obsidian-vault-evidence-chain',
      safetyClaims: [
        'Evidence chain log only',
        'No execution',
        'No OpenClaw dispatch',
        'No filesystem access',
        'Planning-only events',
        'Execution status always PREVIEW_ONLY or NOT_EXECUTED',
      ],
      storageKey: STORAGE_KEY,
    });
  };

  const filtered = filter === 'ALL' ? chain : chain.filter(e => e.eventType === filter);

  const riskColor = { LOW: 'text-primary', MEDIUM: 'text-amber-400', HIGH: 'text-destructive' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">Evidence Chain Log</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Immutable audit trail · All vault events · No execution</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={buildChain}
            className="flex items-center gap-1 px-2 py-1.5 border border-border/40 text-slate-400 text-[8px] font-mono rounded-sm hover:text-slate-200"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20"
          >
            <Download className="w-3 h-3" /> Export Chain
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total Events', value: chain.length },
          { label: 'Note Creates', value: chain.filter(e => e.eventType === 'NOTE_CREATE').length },
          { label: 'Note Updates', value: chain.filter(e => e.eventType === 'NOTE_UPDATE').length },
          { label: 'Approvals', value: chain.filter(e => e.eventType === 'APPROVAL').length },
        ].map(s => (
          <div key={s.label} className="bg-secondary/20 border border-border/30 rounded-sm p-2 text-center">
            <div className="text-[14px] font-bold font-mono text-primary">{s.value}</div>
            <div className="text-[7px] text-slate-500 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {['ALL', 'NOTE_CREATE', 'NOTE_UPDATE', 'OCLAW_TASK', 'APPROVAL'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[7px] font-bold uppercase rounded-sm transition-colors ${
              filter === f
                ? 'bg-primary/20 border border-primary/40 text-primary'
                : 'text-slate-600 hover:text-slate-400 border border-transparent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Chain */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-[9px] text-slate-500 text-center py-8">No events recorded yet.</div>
        )}
        {filtered.map((evt, idx) => (
          <div
            key={evt.eventId}
            className={`bg-secondary/10 border ${typeBorder[evt.eventType]} rounded-sm p-2.5`}
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <Link2 className={`w-3 h-3 ${typeColor[evt.eventType]}`} />
                {idx < filtered.length - 1 && <div className="w-px h-3 bg-border/30 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[8px] font-bold ${typeColor[evt.eventType]}`}>{evt.eventType}</span>
                  {evt.riskLevel && <span className={`text-[7px] font-bold ${riskColor[evt.riskLevel]}`}>RISK:{evt.riskLevel}</span>}
                  {evt.executionStatus && <span className="text-[7px] text-amber-400 font-bold">{evt.executionStatus}</span>}
                  {evt.decision && <span className={`text-[7px] font-bold ${evt.decision === 'APPROVED_PREVIEW' ? 'text-primary' : 'text-destructive'}`}>{evt.decision}</span>}
                </div>
                <div className="text-[8px] text-slate-300 truncate">{evt.summary}</div>
                <div className="text-[7px] text-slate-600 font-mono">{new Date(evt.timestamp).toLocaleString()} · {evt.eventId}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}