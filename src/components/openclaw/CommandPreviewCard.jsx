import React from 'react';
import { Terminal, User, AlertTriangle, Clock, Shield } from 'lucide-react';

const riskColors = {
  low: 'text-primary border-primary/30 bg-primary/5',
  medium: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  high: 'text-orange-500 border-orange-500/30 bg-orange-500/5',
  critical: 'text-destructive border-destructive/30 bg-destructive/5',
};

const statusColors = {
  pending: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  approved: 'text-primary bg-primary/10 border-primary/30',
  denied: 'text-destructive bg-destructive/10 border-destructive/30',
  executed: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  failed: 'text-destructive bg-destructive/10 border-destructive/30',
  cancelled: 'text-muted-foreground bg-secondary/60 border-border',
};

export default function CommandPreviewCard({ command, onApprove, onDeny, onCancel }) {
  const isPending = command.status === 'pending';

  return (
    <div className="bg-card border border-border font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Command Preview</span>
        </div>
        <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${statusColors[command.status] || ''}`}>
          {command.status}
        </span>
      </div>

      {/* Command Text */}
      <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Command</div>
        <code className="text-[12px] text-foreground break-all">{command.commandText}</code>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-0 border-b border-border/50">
        <div className="px-4 py-2.5 border-r border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Target</span>
          </div>
          <div className="text-[11px] text-foreground">{command.target || 'OpenClaw Gateway'}</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <User className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Requested By</span>
          </div>
          <div className="text-[11px] text-foreground truncate">{command.requestedBy || '—'}</div>
        </div>
        <div className="px-4 py-2.5 border-r border-border/50 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Risk Level</span>
          </div>
          <span className={`text-[11px] font-semibold capitalize ${riskColors[command.riskLevel]?.split(' ')[0] || 'text-foreground'}`}>
            {command.riskLevel}
          </span>
        </div>
        <div className="px-4 py-2.5 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Requested</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {command.created_date ? new Date(command.created_date).toLocaleString() : '—'}
          </div>
        </div>
      </div>

      {/* Notes */}
      {command.notes && (
        <div className="px-4 py-2.5 border-b border-border/50 text-[11px] text-muted-foreground/70 italic">
          {command.notes}
        </div>
      )}

      {/* Governance Warning */}
      <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[10px] text-amber-500/80">Governance approval required before execution · Live commands disabled</span>
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => onApprove(command)}
            className="flex-1 py-1.5 bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onDeny(command)}
            className="flex-1 py-1.5 bg-destructive/10 border border-destructive/30 text-destructive text-[11px] hover:bg-destructive/20 transition-colors"
          >
            Deny
          </button>
          <button
            onClick={() => onCancel(command)}
            className="px-4 py-1.5 border border-border text-muted-foreground text-[11px] hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}