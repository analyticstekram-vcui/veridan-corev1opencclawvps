/**
 * ObsidianNoteUpdateBuilder — Note update request builder.
 * Builds a governed preview-only note update request.
 * No Obsidian API, no filesystem writes, no backend dispatch.
 * Execution status: PREVIEW_ONLY / NOT_EXECUTED always.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { FileEdit, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'veridanObsidianNoteUpdateRequests';
const FOLDER_KEY = 'veridanObsidianVaultFolderMap';

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const ALLOWED_TASK_TYPES = ['UPDATE_NOTE_PREVIEW', 'SUMMARIZE', 'VERIFY', 'RESEARCH'];

const riskColor = { LOW: 'text-primary', MEDIUM: 'text-amber-400', HIGH: 'text-destructive' };
const riskBorder = { LOW: 'border-primary/30', MEDIUM: 'border-amber-500/30', HIGH: 'border-destructive/30' };

export default function ObsidianNoteUpdateBuilder() {
  const [folders, setFolders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    targetNote: '',
    folder: '',
    taskType: 'UPDATE_NOTE_PREVIEW',
    updateSection: '',
    proposedChangeSummary: '',
    riskLevel: 'LOW',
    rationale: '',
  });

  useEffect(() => {
    setFolders(loadFromStorage(FOLDER_KEY));
    setRequests(loadFromStorage(STORAGE_KEY));
  }, []);

  const save = (updated) => {
    setRequests(updated);
    saveToStorage(STORAGE_KEY, updated);
  };

  const submit = () => {
    if (!form.targetNote.trim()) return;
    const record = {
      requestId: `note-update-${Date.now()}`,
      requestType: 'NOTE_UPDATE_PREVIEW',
      taskType: form.taskType,
      targetNote: form.targetNote.trim(),
      folder: form.folder || '(root)',
      updateSection: form.updateSection.trim(),
      proposedChangeSummary: form.proposedChangeSummary.trim(),
      riskLevel: form.riskLevel,
      rationale: form.rationale.trim(),
      executionStatus: 'PREVIEW_ONLY',
      approvalStatus: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
    };
    save([record, ...requests]);
    setForm({ targetNote: '', folder: '', taskType: 'UPDATE_NOTE_PREVIEW', updateSection: '', proposedChangeSummary: '', riskLevel: 'LOW', rationale: '' });
  };

  const remove = (id) => save(requests.filter(r => r.requestId !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">Note Update Request Builder</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Preview-only · No files modified · Operator approval required</div>
        </div>
        <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
          PREVIEW_ONLY
        </span>
      </div>

      {/* Builder Form */}
      <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
        <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Build Note Update Request</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Target Note Name *</label>
            <input
              type="text"
              placeholder="e.g. Trading Strategy Overview..."
              value={form.targetNote}
              onChange={e => setForm(p => ({ ...p, targetNote: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Folder Location</label>
            <select
              value={form.folder}
              onChange={e => setForm(p => ({ ...p, folder: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              <option value="">(root)</option>
              {folders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Task Type</label>
            <select
              value={form.taskType}
              onChange={e => setForm(p => ({ ...p, taskType: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              {ALLOWED_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Risk Level</label>
            <select
              value={form.riskLevel}
              onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Section to Update (optional)</label>
          <input
            type="text"
            placeholder="e.g. ## Status, ## Risk Rules..."
            value={form.updateSection}
            onChange={e => setForm(p => ({ ...p, updateSection: e.target.value }))}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Proposed Change Summary (no secrets or credentials)</label>
          <textarea
            placeholder="Describe the proposed update..."
            value={form.proposedChangeSummary}
            onChange={e => setForm(p => ({ ...p, proposedChangeSummary: e.target.value }))}
            rows={3}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Rationale</label>
          <input
            type="text"
            placeholder="Why is this update needed?"
            value={form.rationale}
            onChange={e => setForm(p => ({ ...p, rationale: e.target.value }))}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[8px] text-slate-500">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Execution status locked to <span className="text-amber-400 font-bold ml-1">PREVIEW_ONLY</span>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!form.targetNote.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileEdit className="w-3 h-3" /> Queue Request
          </button>
        </div>
      </div>

      {/* Queued Requests */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <div className="text-[8px] font-bold uppercase text-slate-400">Queued Note Update Requests ({requests.length})</div>
          {requests.map(r => (
            <div key={r.requestId} className={`bg-secondary/10 border ${riskBorder[r.riskLevel]} rounded-sm p-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-mono text-slate-200">{r.targetNote}</span>
                    <span className={`text-[8px] font-bold ${riskColor[r.riskLevel]}`}>RISK:{r.riskLevel}</span>
                    <span className="text-[8px] font-bold text-amber-400">{r.executionStatus}</span>
                    <span className="text-[8px] text-slate-500">{r.taskType}</span>
                  </div>
                  <div className="text-[8px] text-slate-500">
                    Folder: <span className="text-slate-400">{r.folder}</span> ·
                    {r.updateSection && <> Section: <span className="text-slate-400">{r.updateSection}</span> · </>}
                    Status: <span className="text-slate-400">{r.approvalStatus}</span> ·
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                  {r.proposedChangeSummary && (
                    <div className="text-[8px] text-slate-500 truncate">Change: {r.proposedChangeSummary}</div>
                  )}
                </div>
                <button type="button" onClick={() => remove(r.requestId)} className="text-destructive/50 hover:text-destructive shrink-0 text-[8px]">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}