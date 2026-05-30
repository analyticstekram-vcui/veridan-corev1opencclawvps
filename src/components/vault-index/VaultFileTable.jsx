import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS = {
  APPROVED: 'text-primary',
  NOT_EXECUTED: 'text-primary',
  NOT_DISPATCHED: 'text-primary',
  NOT_SENT: 'text-primary',
  COMPLETED_APPROVED_DRAFT_ONLY: 'text-primary',
  LOW: 'text-primary',
  PENDING_REVIEW: 'text-amber-400',
  FAILED: 'text-destructive',
};

function StatusCell({ value }) {
  const color = STATUS_COLORS[value] || 'text-slate-400';
  return <span className={`font-mono text-[7px] ${color}`}>{value || '—'}</span>;
}

function Th({ children, onClick, sorted }) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-left text-[7px] font-bold uppercase tracking-widest text-slate-500 border-b border-border/40 whitespace-nowrap select-none ${onClick ? 'cursor-pointer hover:text-slate-300' : ''}`}
    >
      <span className="flex items-center gap-1">
        {children}
        {sorted === 'asc' && <ChevronUp className="w-2.5 h-2.5" />}
        {sorted === 'desc' && <ChevronDown className="w-2.5 h-2.5" />}
      </span>
    </th>
  );
}

export default function VaultFileTable({ records, onSelectRecord }) {
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...records].sort((a, b) => {
    const av = a[sortKey] || '';
    const bv = b[sortKey] || '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const col = (key) => sortKey === key ? sortDir : null;

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">
          Written Files — {records.length} record{records.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[7px] font-mono text-slate-600">Click a row to inspect</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr>
              <Th onClick={() => handleSort('filename')} sorted={col('filename')}>Filename</Th>
              <Th onClick={() => handleSort('folder')} sorted={col('folder')}>Folder</Th>
              <Th>File Path</Th>
              <Th onClick={() => handleSort('source')} sorted={col('source')}>Source</Th>
              <Th onClick={() => handleSort('draftType')} sorted={col('draftType')}>Draft Type</Th>
              <Th>Risk</Th>
              <Th>Approval</Th>
              <Th>FS Write</Th>
              <Th>Exec Status</Th>
              <Th>Dispatch</Th>
              <Th onClick={() => handleSort('timestamp')} sorted={col('timestamp')}>Written At</Th>
              <Th>Audit ID</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={r.auditId + i}
                onClick={() => onSelectRecord(r)}
                className="border-b border-border/20 hover:bg-secondary/20 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 text-[8px] font-mono text-slate-200 whitespace-nowrap">{r.filename}</td>
                <td className="px-3 py-2 text-[7px] font-mono text-slate-400 whitespace-nowrap max-w-[160px] truncate">{r.folder}</td>
                <td className="px-3 py-2 text-[7px] font-mono text-slate-500 whitespace-nowrap max-w-[200px] truncate">{r.filePath}</td>
                <td className="px-3 py-2"><StatusCell value={r.source} /></td>
                <td className="px-3 py-2 text-[7px] font-mono text-slate-400 whitespace-nowrap">{r.draftType}</td>
                <td className="px-3 py-2"><StatusCell value={r.riskLevel} /></td>
                <td className="px-3 py-2"><StatusCell value={r.approvalStatus} /></td>
                <td className="px-3 py-2"><StatusCell value={r.filesystemWrite} /></td>
                <td className="px-3 py-2"><StatusCell value={r.executionStatus} /></td>
                <td className="px-3 py-2"><StatusCell value={r.dispatchStatus} /></td>
                <td className="px-3 py-2 text-[7px] font-mono text-slate-500 whitespace-nowrap">
                  {r.timestamp && r.timestamp !== '—'
                    ? new Date(r.timestamp).toLocaleString()
                    : '—'}
                </td>
                <td className="px-3 py-2 text-[7px] font-mono text-slate-600 whitespace-nowrap max-w-[120px] truncate">{r.auditId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}