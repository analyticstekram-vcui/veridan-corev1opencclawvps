import React from 'react';

const statusStyles = {
  neutral: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
  disabled: 'text-destructive border-destructive/30 bg-destructive/5',
  planning: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  preview: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
};

export function SafetyStatusCard({ title, statuses, disclaimer, children }) {
  return (
    <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">{title}</h2>
      </div>
      <div className="p-4 space-y-2">
        {statuses.map(({ label, value, type = 'neutral' }, index) => (
          <div
            key={`${label}-${index}`}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${statusStyles[type] ?? statusStyles.neutral}`}>
            <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{label}</span>
            <span className="text-[10px] font-mono font-bold flex-1">{value}</span>
          </div>
        ))}
        {disclaimer ? (
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3 mt-3">
            <p className="text-[10px] text-slate-300 leading-relaxed">{disclaimer}</p>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function OperatorNextActionCard({ title, summaryTitle, summaryText, checklist, note }) {
  return (
    <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">{title}</h2>
      </div>
      <div className="p-4 space-y-3">
        <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
          <p className="text-[11px] font-mono font-bold text-primary mb-2">{summaryTitle}</p>
          <p className="text-[10px] text-slate-300 leading-relaxed">{summaryText}</p>
        </div>
        <div className="space-y-1.5">
          <div className="text-[9px] font-mono font-semibold uppercase text-muted-foreground/70 mb-2">Action Checklist</div>
          {checklist.map((item, idx) => (
            <button
              key={`${item}-${idx}`}
              type="button"
              className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
              <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
              <span className="text-[10px] text-slate-300">{item}</span>
            </button>
          ))}
          {note ? (
            <div className="text-[8px] font-mono text-muted-foreground/50 mt-3">{note}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function BaselineCard({ title, rows, disclaimer, children }) {
  return (
    <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">{title}</h2>
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          {rows.map(({ label, value, valueClassName = 'text-slate-300' }, idx) => (
            <div
              key={`${label}-${idx}`}
              className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/70">{label}</span>
              <span className={`text-[10px] font-mono font-bold ${valueClassName}`}>{value}</span>
            </div>
          ))}
        </div>
        {disclaimer ? (
          <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
            <p className="text-[10px] text-slate-300 leading-relaxed">{disclaimer}</p>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function SnapshotExportButton({ snapshot, filenamePrefix, label = 'Export Snapshot', className = '' }) {
  const handleClick = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = filenamePrefix?.endsWith('.json')
      ? filenamePrefix
      : `${filenamePrefix}-${Date.now()}.json`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-4 py-2 text-[10px] font-mono font-bold border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-sm ${className}`}
    >
      {label}
    </button>
  );
}
