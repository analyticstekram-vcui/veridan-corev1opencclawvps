import React from 'react';
import { Files, FolderOpen, Clock, AlertCircle, Wifi } from 'lucide-react';

function Card({ icon: IconComp, label, value, color = 'text-primary', sub }) {
  return (
    <div className="border border-border/40 bg-card rounded-sm p-4 space-y-1">
      <div className="flex items-center gap-1.5 text-[7px] uppercase font-bold text-slate-500 tracking-widest">
        <IconComp className="w-3 h-3" /> {label}
      </div>
      <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[7px] font-mono text-slate-600 truncate">{sub}</div>}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
export default function VaultIndexSummaryCards({ records, uniqueFolders, lastWritten }) {
  const failedCount = records.filter(r =>
    r.filesystemWrite && r.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY'
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card icon={Files} label="Total Written Files" value={records.length} />
      <Card icon={FolderOpen} label="Unique Folders" value={uniqueFolders.length} />
      <Card
        icon={Clock}
        label="Last Written"
        value={lastWritten ? new Date(lastWritten).toLocaleDateString() : '—'}
        sub={lastWritten ? new Date(lastWritten).toLocaleTimeString() : 'No files yet'}
        color="text-accent"
      />
      <Card
        icon={AlertCircle}
        label="Failed Writes"
        value={failedCount}
        color={failedCount > 0 ? 'text-destructive' : 'text-slate-500'}
        sub={failedCount > 0 ? 'Check audit log' : 'None recorded'}
      />
      <Card
        icon={Wifi}
        label="OpenClaw Calls"
        value="NOT_SENT"
        color="text-slate-500"
        sub="Always disabled"
      />
    </div>
  );
}