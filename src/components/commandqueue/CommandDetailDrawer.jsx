import React from 'react';
import { X, Clock, User, Globe, Zap, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/commandQueue';

function Field({ label, value, mono, color }) {
  return (
    <div className="bg-secondary/30 border border-border px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">{label}</div>
      <div className={`text-[11px] ${mono ? 'font-mono' : ''} ${color || 'text-foreground'} break-all`}>{value || '—'}</div>
    </div>
  );
}

function AuditEntry({ entry }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      <div className="text-[9px] font-mono text-muted-foreground/40 w-[130px] shrink-0 mt-0.5">
        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
      </div>
      <div className="flex-1">
        <div className="text-[10px] text-foreground font-mono">{entry.event}</div>
        {entry.actor && <div className="text-[9px] text-muted-foreground/50">{entry.actor}</div>}
      </div>
    </div>
  );
}

export default function CommandDetailDrawer({ command, currentUser, onClose, onApprove, onDeny, onExecute, onExecuteReadOnly, onRetry }) {
  if (!command) return null;
  const cfg = STATUS_CONFIG[command.status] || STATUS_CONFIG.draft;
  const auditLog = Array.isArray(command.auditLog) ? command.auditLog : [];

  const READ_ONLY_COMMANDS = ['system.status', 'logs.fetch', 'session.list'];
  const isReadOnly = READ_ONLY_COMMANDS.includes(command.commandType);
  const isLowRisk = command.riskLevel === 'low';
  const isSimulated = command.executionMode === 'SIMULATED';

  const canApprove  = command.status === 'pending';
  const canExecute  = command.status === 'approved';
  const canExecuteReadOnly = command.status === 'approved' && isReadOnly && isLowRisk && isSimulated;
  const canRetry    = command.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[480px] bg-card border-l border-border flex flex-col h-full font-mono overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-[12px] font-semibold text-foreground truncate max-w-[280px]">
              {command.commandType || 'Command'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status badge */}
        <div className={`mx-5 mt-4 px-3 py-2 border flex items-center gap-2 ${cfg.border} ${cfg.bg}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
          {command.executionMode && command.status === 'executed' && (
            <span className={`ml-auto text-[9px] px-2 py-0.5 border ${command.executionMode === 'REAL' ? 'border-primary/30 text-primary bg-primary/5' : 'border-amber-500/30 text-amber-400 bg-amber-500/5'}`}>
              {command.executionMode}
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Core fields */}
          <div className="space-y-1.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Command Details</div>
            <Field label="Command ID"    value={command.commandId}    mono />
            <Field label="Command Type"  value={command.commandType}  mono />
            <Field label="Target URL"    value={command.targetUrl}    mono color="text-blue-400" />
            <Field label="Risk Level"    value={command.riskLevel} />
            <Field label="Requested By"  value={command.requestedBy} />
            <Field label="Created"       value={command.created_date ? new Date(command.created_date).toLocaleString() : null} mono />
            {command.approvedBy && <Field label="Approved By"  value={command.approvedBy} />}
            {command.approvedAt && <Field label="Approved At"  value={new Date(command.approvedAt).toLocaleString()} mono />}
            {command.executedAt && <Field label="Executed At"  value={new Date(command.executedAt).toLocaleString()} mono />}
            {command.notes && <Field label="Notes" value={command.notes} />}
          </div>

          {/* Execution result */}
          {command.result && (
            <div className="space-y-1.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Execution Result</div>
              {command.result.pageTitle && (
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Page Title</div>
                  <div className="text-[11px] text-foreground">{command.result.pageTitle}</div>
                  {command.isMockTitle && (
                    <div className="mt-1.5 flex items-start gap-1.5 px-2 py-1.5 bg-amber-500/5 border border-amber-500/20">
                      <span className="text-amber-500 text-[9px] mt-0.5">⚠</span>
                      <span className="text-[10px] text-amber-400/80 leading-relaxed">
                        Bridge connected, but VPS browser automation is not yet returning real page title.
                      </span>
                    </div>
                  )}
                </div>
              )}
              {command.result.screenshotUrl && (
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">Screenshot</div>
                  <img src={command.result.screenshotUrl} alt="Screenshot" className="w-full rounded border border-border/50" />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {command.error && (
            <div className="bg-destructive/5 border border-destructive/20 px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">Error</div>
              <div className="text-[11px] text-destructive font-mono break-all">{command.error}</div>
            </div>
          )}

          {/* Diagnostics */}
          {Array.isArray(command.diagnostics) && command.diagnostics.length > 0 && (
            <div className="bg-secondary/30 border border-border px-3 py-2 space-y-0.5">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1.5">Diagnostics</div>
              {command.diagnostics.map((d, i) => {
                const ok   = d.includes(': YES') || d.includes(': REAL') || d.includes('executed');
                const fail = d.includes('FAILED') || d.includes('command_failed') || d.includes('SIMULATED') || d.includes('exception');
                return (
                  <div key={i} className={`text-[10px] font-mono ${fail ? 'text-amber-400' : ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                    › {d}
                  </div>
                );
              })}
            </div>
          )}

          {/* Audit Log */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">
              Audit Trail ({auditLog.length})
            </div>
            {auditLog.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/30 py-2">No audit entries</div>
            ) : (
              <div className="bg-secondary/20 border border-border px-3">
                {auditLog.map((e, i) => <AuditEntry key={i} entry={e} />)}
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        {(canApprove || canExecute || canExecuteReadOnly || canRetry) && (
          <div className="shrink-0 border-t border-border px-5 py-3.5 flex items-center gap-2">
            {canApprove && (
              <>
                <button onClick={() => onDeny(command)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 text-destructive text-[10px] hover:bg-destructive/10 transition-colors">
                  <XCircle className="w-3 h-3" /> Deny
                </button>
                <button onClick={() => onApprove(command)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors">
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </button>
              </>
            )}
            {canExecute && !canExecuteReadOnly && (
              <button onClick={() => onExecute(command)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors">
                <Zap className="w-3 h-3" /> Execute
              </button>
            )}
            {canExecuteReadOnly && (
              <button onClick={() => onExecuteReadOnly(command)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors">
                <Zap className="w-3 h-3" /> Execute Read-Only
              </button>
            )}
            {canRetry && (
              <button onClick={() => onRetry(command)}
                className="flex items-center gap-1.5 px-4 py-1.5 border border-amber-500/30 text-amber-400 text-[10px] hover:bg-amber-500/10 transition-colors">
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}