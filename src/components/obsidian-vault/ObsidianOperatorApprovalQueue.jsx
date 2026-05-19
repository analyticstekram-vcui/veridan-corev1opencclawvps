/**
 * ObsidianOperatorApprovalQueue — Operator approval queue for all vault action requests.
 * Aggregates note create, note update, and OpenClaw task requests for review.
 * No execution. No backend. Approval decisions saved to localStorage only.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';

const KEYS = {
  CREATE: 'veridanObsidianNoteCreateRequests',
  UPDATE: 'veridanObsidianNoteUpdateRequests',
  OCLAW: 'veridanObsidianOpenClawTaskQueue',
  APPROVALS: 'veridanObsidianApprovalDecisions',
};

const riskColor = { LOW: 'text-primary', MEDIUM: 'text-amber-400', HIGH: 'text-destructive' };
const riskBorder = { LOW: 'border-primary/20', MEDIUM: 'border-amber-500/20', HIGH: 'border-destructive/20' };

const statusIcon = {
  PENDING_REVIEW: <Clock className="w-3 h-3 text-slate-400" />,
  APPROVED_PREVIEW: <CheckCircle className="w-3 h-3 text-primary" />,
  APPROVED_PLANNING: <CheckCircle className="w-3 h-3 text-primary" />,
  DENIED: <XCircle className="w-3 h-3 text-destructive" />,
};

export default function ObsidianOperatorApprovalQueue() {
  const [creates, setCreates] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [oclawTasks, setOclawTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setCreates(loadFromStorage(KEYS.CREATE));
    setUpdates(loadFromStorage(KEYS.UPDATE));
    setOclawTasks(loadFromStorage(KEYS.OCLAW));
    setApprovals(loadFromStorage(KEYS.APPROVALS));
  }, []);

  const saveApprovals = (updated) => {
    setApprovals(updated);
    saveToStorage(KEYS.APPROVALS, updated);
  };

  // Aggregate all items into unified queue
  const allItems = [
    ...creates.map(r => ({ ...r, queueType: 'NOTE_CREATE', id: r.requestId, label: r.title })),
    ...updates.map(r => ({ ...r, queueType: 'NOTE_UPDATE', id: r.requestId, label: r.targetNote })),
    ...oclawTasks.map(r => ({ ...r, queueType: 'OCLAW_TASK', id: r.taskId, label: r.target })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getDecision = (id) => approvals.find(a => a.itemId === id);

  const decide = (item, decision, note = '') => {
    const existing = approvals.filter(a => a.itemId !== item.id);
    const record = {
      approvalId: `approval-${Date.now()}`,
      itemId: item.id,
      queueType: item.queueType,
      label: item.label,
      riskLevel: item.riskLevel,
      decision,
      reviewNote: note,
      executionStatus: 'NOT_EXECUTED',
      reviewedAt: new Date().toISOString(),
    };
    saveApprovals([record, ...existing]);
  };

  const filtered = filter === 'ALL'
    ? allItems
    : filter === 'PENDING'
    ? allItems.filter(i => !getDecision(i.id))
    : allItems.filter(i => getDecision(i.id)?.decision === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">Operator Approval Queue</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            All vault requests require operator review · Approval grants planning-only status · No execution
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
            REVIEW MODE
          </span>
          <span className="text-[8px] text-slate-500">
            {allItems.filter(i => !getDecision(i.id)).length} pending · {approvals.length} decided
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border/30 pb-2">
        {['ALL', 'PENDING', 'APPROVED_PREVIEW', 'DENIED'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[8px] font-bold uppercase rounded-sm transition-colors ${
              filter === f
                ? 'bg-primary/20 border border-primary/40 text-primary'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {f === 'ALL' ? `All (${allItems.length})` :
             f === 'PENDING' ? `Pending (${allItems.filter(i => !getDecision(i.id)).length})` :
             f === 'APPROVED_PREVIEW' ? `Approved (${approvals.filter(a => a.decision === 'APPROVED_PREVIEW').length})` :
             `Denied (${approvals.filter(a => a.decision === 'DENIED').length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-[9px] text-slate-500 text-center py-8">No items in this queue.</div>
      )}

      <div className="space-y-2">
        {filtered.map(item => {
          const decision = getDecision(item.id);
          return (
            <div
              key={item.id}
              className={`bg-secondary/10 border ${riskBorder[item.riskLevel] || 'border-border/30'} rounded-sm p-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {decision ? statusIcon[decision.decision] : statusIcon['PENDING_REVIEW']}
                    <span className="text-[9px] font-bold font-mono text-slate-200 truncate">{item.label}</span>
                    <span className="text-[8px] font-mono text-slate-500 border border-border/30 px-1 rounded-sm">{item.queueType}</span>
                    <span className={`text-[8px] font-bold ${riskColor[item.riskLevel]}`}>RISK:{item.riskLevel}</span>
                    <span className="text-[8px] font-bold text-amber-400">PREVIEW_ONLY</span>
                  </div>
                  <div className="text-[8px] text-slate-500">
                    Task: <span className="text-slate-400">{item.taskType}</span> ·
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  {decision && (
                    <div className={`text-[8px] font-bold ${decision.decision === 'APPROVED_PREVIEW' ? 'text-primary' : 'text-destructive'}`}>
                      Decision: {decision.decision} · {new Date(decision.reviewedAt).toLocaleString()}
                      {decision.reviewNote && ` · Note: ${decision.reviewNote}`}
                    </div>
                  )}
                  {!decision && (
                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => decide(item, 'APPROVED_PREVIEW')}
                        className="flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20"
                      >
                        <CheckCircle className="w-2.5 h-2.5" /> Approve Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(item, 'DENIED')}
                        className="flex items-center gap-1 px-3 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold rounded-sm hover:bg-destructive/20"
                      >
                        <XCircle className="w-2.5 h-2.5" /> Deny
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-[8px] text-slate-600 shrink-0 font-mono">NOT_EXECUTED</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-sm p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span className="text-[8px] text-slate-400">
            Approval grants planning-only preview status. No action will be dispatched to OpenClaw or any external system.
            All decisions are stored locally. Execution status is always <span className="text-amber-400 font-bold">NOT_EXECUTED</span>.
          </span>
        </div>
      </div>
    </div>
  );
}