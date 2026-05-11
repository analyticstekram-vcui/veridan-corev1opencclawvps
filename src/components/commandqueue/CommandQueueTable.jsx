import React from 'react';
import { Loader2, ChevronRight, CheckCircle2, XCircle, Zap, RotateCcw } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/commandQueue';

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[9px] uppercase tracking-wider ${cfg.border} ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level }) {
  const colors = {
    low:      'text-primary/70 border-primary/20',
    medium:   'text-amber-400 border-amber-400/20',
    high:     'text-destructive border-destructive/20',
    critical: 'text-destructive font-bold border-destructive/40',
  };
  return (
    <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${colors[level] || colors.low}`}>
      {level || 'low'}
    </span>
  );
}

export default function CommandQueueTable({ commands, loading, onSelect, onApprove, onDeny, onExecute, onRetry, actionLoading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[11px] text-muted-foreground/30">
        No commands in this queue
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2 border-b border-border/50 text-[9px] text-muted-foreground/30 uppercase tracking-wider">
        <div>Command Type</div>
        <div>Target URL</div>
        <div>Risk</div>
        <div>Status</div>
        <div>Requested By</div>
        <div>Actions</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {commands.map(cmd => {
          const loading = actionLoading?.[cmd.id];
          return (
            <div key={cmd.id}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 hover:bg-secondary/20 transition-colors items-center cursor-pointer"
              onClick={() => onSelect(cmd)}
            >
              <div className="text-[11px] font-mono text-foreground truncate">{cmd.commandType}</div>
              <div className="text-[11px] font-mono text-blue-400 truncate">{cmd.targetUrl}</div>
              <div><RiskBadge level={cmd.riskLevel} /></div>
              <div><StatusBadge status={cmd.status} /></div>
              <div className="text-[10px] text-muted-foreground/60 truncate">{cmd.requestedBy}</div>

              {/* Inline actions */}
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {cmd.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onDeny(cmd)}
                      disabled={!!loading}
                      title="Deny"
                      className="p-1.5 border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                    >
                      {loading === 'deny' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onApprove(cmd)}
                      disabled={!!loading}
                      title="Approve"
                      className="p-1.5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                    >
                      {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  </>
                )}
                {cmd.status === 'approved' && (
                  <button
                    onClick={() => onExecute(cmd)}
                    disabled={!!loading}
                    title="Execute"
                    className="p-1.5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                  >
                    {loading === 'execute' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  </button>
                )}
                {cmd.status === 'failed' && (
                  <button
                    onClick={() => onRetry(cmd)}
                    disabled={!!loading}
                    title="Retry"
                    className="p-1.5 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                  >
                    {loading === 'retry' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  </button>
                )}
                <ChevronRight className="w-3 h-3 text-muted-foreground/30 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}