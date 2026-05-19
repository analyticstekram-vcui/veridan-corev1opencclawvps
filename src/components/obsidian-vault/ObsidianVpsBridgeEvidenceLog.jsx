/**
 * ObsidianVpsBridgeEvidenceLog
 * Bridge Packet History / Evidence Log — localStorage only.
 * Records all generated dry-run bridge packets. No execution, no dispatch,
 * no filesystem writes, no VPS commands, no Obsidian sync, no credential handling.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { Download, Copy, Trash2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

export const BRIDGE_EVIDENCE_LOG_KEY = 'veridanObsidianVpsBridgeEvidenceLog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(value) {
  if (!value) return 'text-slate-500';
  if (['DISABLED', 'NOT_EXECUTED', 'NOT_DISPATCHED'].includes(value)) return 'text-destructive';
  if (value === 'PASS') return 'text-primary';
  if (value === 'DRY_RUN_ONLY') return 'text-amber-400';
  if (value === 'APPROVED_BY_OPERATOR') return 'text-primary';
  return 'text-slate-400';
}

function approvalColor(approved) {
  if (approved === true) return 'text-primary';
  if (approved === false) return 'text-destructive';
  return 'text-slate-500';
}

function approvalLabel(approved) {
  if (approved === true) return 'APPROVED_BY_OPERATOR';
  if (approved === false) return 'NOT_APPROVED';
  return 'UNKNOWN';
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function EvidenceRecordCard({ record }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `vps-bridge-packet-${record.evidenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const md = record.frontmatter
      ? `${record.frontmatter}\n\n${record.contentPreview || ''}`
      : `# ${record.title}\n\nEvidence ID: ${record.evidenceId}\nTarget: ${record.targetPath}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">

      {/* Collapsed header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        }
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0.5">
          <div>
            <span className="text-[8px] text-primary font-bold font-mono">{record.evidenceId}</span>
          </div>
          <div className="truncate">
            <span className="text-[8px] text-slate-300 font-mono">{record.title || '(untitled)'}</span>
          </div>
          <div className="text-right">
            <span className="text-[7px] text-slate-500 font-mono">{new Date(record.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <span className={`text-[7px] font-bold uppercase px-2 py-1 border rounded-sm shrink-0 ${
          record.validationStatus === 'PASS'
            ? 'bg-primary/5 border-primary/20 text-primary'
            : 'bg-destructive/5 border-destructive/20 text-destructive'
        }`}>
          {record.validationStatus || 'UNKNOWN'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-3">

          {/* Fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[8px] font-mono">
            {[
              { label: 'Evidence ID',        value: record.evidenceId },
              { label: 'Created Timestamp',  value: new Date(record.createdAt).toLocaleString() },
              { label: 'Note Title',         value: record.title },
              { label: 'Target Folder',      value: record.folder },
              { label: 'Final Target Path',  value: record.targetPath },
              { label: 'Note Type',          value: record.noteType || 'DRY_RUN_PREVIEW' },
              { label: 'Operator Note',      value: record.operatorNote || '(none)' },
            ].map(f => (
              <div key={f.label} className="space-y-0.5">
                <div className="text-[7px] text-slate-500 uppercase">{f.label}</div>
                <div className="text-slate-200 break-all">{f.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Status badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'validationStatus',  value: record.validationStatus },
              { label: 'approvalStatus',    value: approvalLabel(record.approvedByOperator) },
              { label: 'executionStatus',   value: record.executionStatus },
              { label: 'dispatchStatus',    value: record.dispatchStatus },
              { label: 'filesystemWrite',   value: record.filesystemWrite },
              { label: 'bridgeMode',        value: record.bridgeMode },
            ].map(s => (
              <div key={s.label} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[7px] text-slate-500 uppercase">{s.label}</div>
                <div className={`text-[8px] font-bold ${statusColor(s.value)}`}>{s.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border/40 text-slate-300 text-[8px] font-bold rounded-sm hover:text-slate-100 hover:border-border/70 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
            >
              <Download className="w-3 h-3" />
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ObsidianVpsBridgeEvidenceLog({ refreshSignal }) {
  const [records, setRecords] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = () => {
    const stored = loadFromStorage(BRIDGE_EVIDENCE_LOG_KEY);
    setRecords([...stored].reverse()); // newest first
  };

  useEffect(() => { load(); }, [refreshSignal]);

  const handleClearAll = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    saveToStorage(BRIDGE_EVIDENCE_LOG_KEY, []);
    setRecords([]);
    setConfirmClear(false);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[9px] font-bold uppercase text-slate-300 tracking-widest">Bridge Packet History / Evidence Log</div>
          <div className="text-[8px] text-slate-600 mt-0.5">
            localStorage only · {records.length} record{records.length !== 1 ? 's' : ''} · No backend · No dispatch
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="px-2 py-1.5 border border-border/40 text-slate-400 text-[8px] font-mono rounded-sm hover:text-slate-200 transition-colors"
          >
            Refresh
          </button>
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-[8px] font-bold rounded-sm transition-colors ${
                confirmClear
                  ? 'bg-destructive/20 border-destructive/50 text-destructive'
                  : 'border-border/40 text-slate-500 hover:text-destructive hover:border-destructive/30'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              {confirmClear ? 'Click again to confirm clear' : 'Clear History'}
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {records.length === 0 && (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/30 rounded-sm bg-secondary/10">
          No bridge packets recorded yet.<br />
          <span className="text-[8px] text-slate-600">Generate a dry-run packet above to begin the evidence log.</span>
        </div>
      )}

      {/* Records */}
      <div className="space-y-2">
        {records.map(record => (
          <EvidenceRecordCard key={record.evidenceId} record={record} />
        ))}
      </div>

      {/* Hard constraints */}
      {records.length > 0 && (
        <div className="bg-card border border-border/30 rounded-sm px-4 py-3 text-[8px] font-mono text-slate-500 leading-relaxed">
          <span className="text-destructive font-bold">Hard Constraints: </span>
          localStorage only · No backend mutation · No filesystem writes · No VPS execution ·
          No Obsidian sync · No OpenClaw dispatch · No credential handling · No browser automation · No live mode.
        </div>
      )}
    </div>
  );
}