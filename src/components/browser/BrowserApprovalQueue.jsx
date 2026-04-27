import React from 'react';
import { ShieldAlert, ThumbsUp, ThumbsDown, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

const LABEL_COLORS = {
  login:               'text-amber-500 border-amber-500/30 bg-amber-500/5',
  submit_form:         'text-amber-500 border-amber-500/30 bg-amber-500/5',
  place_order:         'text-destructive border-destructive/30 bg-destructive/5',
  approve_transaction: 'text-destructive border-destructive/30 bg-destructive/5',
  send_message:        'text-blue-400 border-blue-400/30 bg-blue-400/5',
  delete_data:         'text-destructive border-destructive/30 bg-destructive/5',
};

const STATUS_ICON = {
  PENDING:  <Clock className="w-3 h-3 text-amber-500" />,
  APPROVED: <CheckCircle2 className="w-3 h-3 text-primary" />,
  DENIED:   <XCircle className="w-3 h-3 text-destructive" />,
};

function ApprovalCard({ item, onApprove, onDeny, actioning }) {
  const labelCls = LABEL_COLORS[item.label] || 'text-muted-foreground border-border';
  return (
    <div className="bg-card border border-border">
      <div className="flex items-start gap-3 px-4 py-3">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${labelCls}`}>
              {item.label.replace(/_/g, ' ')}
            </span>
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
              {STATUS_ICON[item.status]} {item.status}
            </span>
            <span className="text-[9px] text-muted-foreground/40 ml-auto">
              {item.requestedAt ? new Date(item.requestedAt).toLocaleTimeString() : ''}
            </span>
          </div>
          <div className="text-[11px] text-foreground/80 truncate">{item.command}</div>
          {item.requestedBy && (
            <div className="text-[9px] text-muted-foreground/40 mt-0.5">requested by: {item.requestedBy}</div>
          )}
          {item.resolvedBy && (
            <div className="text-[9px] text-muted-foreground/50 mt-0.5">
              {item.status.toLowerCase()} by: {item.resolvedBy}
            </div>
          )}
        </div>
        {item.status === 'PENDING' && (
          <div className="flex items-center gap-1.5 shrink-0">
            {actioning === item.actionId ? (
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : (
              <>
                <button
                  onClick={() => onApprove(item.actionId)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] hover:bg-primary/20 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => onDeny(item.actionId)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] hover:bg-destructive/20 transition-colors"
                >
                  <ThumbsDown className="w-3 h-3" /> Deny
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowserApprovalQueue({ queue, onApprove, onDeny, actioning }) {
  const pending  = queue.filter(q => q.status === 'PENDING');
  const resolved = queue.filter(q => q.status !== 'PENDING');

  return (
    <div className="bg-card border border-border font-mono">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Approval Queue</span>
        </div>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-500 uppercase tracking-wider">
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="divide-y divide-border/50 max-h-64 overflow-auto">
        {queue.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground/30">
            No actions pending approval
          </div>
        ) : (
          <>
            {pending.map(item => (
              <ApprovalCard key={item.actionId} item={item} onApprove={onApprove} onDeny={onDeny} actioning={actioning} />
            ))}
            {resolved.map(item => (
              <ApprovalCard key={item.actionId} item={item} onApprove={onApprove} onDeny={onDeny} actioning={actioning} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}