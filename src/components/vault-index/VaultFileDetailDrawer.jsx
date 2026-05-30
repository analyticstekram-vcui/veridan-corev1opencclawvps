import React from 'react';
import { X, FileText } from 'lucide-react';

const ROW_FIELDS = [
  ['filename', 'Filename'],
  ['folder', 'Folder'],
  ['filePath', 'File Path'],
  ['auditId', 'Audit ID'],
  ['draftId', 'Draft ID'],
  ['timestamp', 'Written At'],
  ['filesystemWrite', 'Filesystem Write'],
  ['executionStatus', 'Execution Status'],
  ['dispatchStatus', 'Dispatch Status'],
  ['openclawCall', 'OpenClaw Call'],
  ['source', 'Source'],
  ['draftType', 'Draft Type'],
  ['riskLevel', 'Risk Level'],
  ['approvalStatus', 'Approval Status'],
];

const SAFE_GREEN = ['NOT_EXECUTED', 'NOT_DISPATCHED', 'NOT_SENT', 'COMPLETED_APPROVED_DRAFT_ONLY', 'APPROVED', 'LOW'];
const WARN_AMBER = ['PENDING_REVIEW'];

function valueColor(v) {
  if (!v || v === '—') return 'text-slate-500';
  if (SAFE_GREEN.includes(v)) return 'text-primary';
  if (WARN_AMBER.includes(v)) return 'text-amber-400';
  return 'text-slate-300';
}

export default function VaultFileDetailDrawer({ record, onClose }) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <div>
              <div className="text-[9px] font-bold text-foreground truncate max-w-[300px]">{record.filename}</div>
              <div className="text-[7px] font-mono text-slate-500">Vault file record — read only</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Field table */}
          <div className="space-y-0.5">
            {ROW_FIELDS.map(([key, label]) => (
              <div key={key} className="flex items-start gap-2 py-1.5 border-b border-border/20">
                <span className="w-36 shrink-0 text-[7px] font-bold uppercase text-slate-500 tracking-wide mt-0.5">{label}</span>
                <span className={`text-[8px] font-mono break-all ${valueColor(record[key])}`}>
                  {record[key] && record[key] !== '—' && key === 'timestamp'
                    ? (() => { try { return new Date(record[key]).toLocaleString(); } catch { return record[key]; } })()
                    : record[key] || '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Content preview */}
          {record.contentPreview && (
            <div className="space-y-1.5">
              <div className="text-[7px] font-bold uppercase text-slate-500 tracking-widest">
                Draft Content Preview (first 400 chars)
              </div>
              <pre className="text-[7px] font-mono text-slate-400 bg-secondary/20 border border-border/30 rounded-sm p-3 whitespace-pre-wrap overflow-auto max-h-48">
                {record.contentPreview}
              </pre>
            </div>
          )}

          {/* Safety notice */}
          <div className="text-[7px] font-mono text-slate-600 bg-card border border-border/30 rounded-sm p-3 space-y-0.5">
            <div className="font-bold text-slate-500 uppercase text-[6px] tracking-widest mb-1">Safety State</div>
            <div>executionStatus: <span className="text-primary">{record.executionStatus}</span></div>
            <div>dispatchStatus: <span className="text-primary">{record.dispatchStatus}</span></div>
            <div>openclawCall: <span className="text-primary">{record.openclawCall}</span></div>
            <div className="text-slate-600 mt-1">This record is read-only. No mutation performed.</div>
          </div>
        </div>
      </div>
    </div>
  );
}