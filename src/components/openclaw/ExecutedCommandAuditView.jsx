import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, Clock, Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const FILTER_OPTIONS = ['ALL', 'EXECUTED', 'BLOCKED', 'FAILED', 'READ_ONLY'];

const statusConfig = {
  executed: { icon: CheckCircle2, color: 'text-primary', label: 'Executed' },
  blocked:  { icon: XCircle, color: 'text-destructive', label: 'Blocked' },
  failed:   { icon: AlertTriangle, color: 'text-amber-500', label: 'Failed' },
};

function CommandRow({ command, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[command.status] || { icon: AlertTriangle, color: 'text-muted-foreground', label: command.status };
  const Icon = cfg.icon;

  const isReadOnly = ['system.status', 'logs.fetch', 'session.list'].includes(command.commandType);
  const isLegacyRealExecution = command.executionMode === 'REAL' || command.executionMode === 'LIVE';
  const blockReason = command.error || null;
  const auditTraceId = command.readOnlyBridgeTraceId || command.id?.slice(0, 12);
  const executedAtTime = command.executedAt ? format(new Date(command.executedAt), 'HH:mm:ss') : '—';

  return (
    <div key={index} className="border-b border-border/20 last:border-0">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="grid grid-cols-[20px_120px_80px_60px_70px_100px_auto] gap-2 items-center text-[10px] font-mono">
          <div className="text-muted-foreground/30">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
          <div className="text-blue-400 truncate">{command.commandType}</div>
          <div className={`text-[9px] px-1.5 py-0.5 border rounded-sm ${cfg.color}`}>
            {cfg.label.toUpperCase()}
          </div>
          <div className={`text-[9px] px-1.5 py-0.5 border rounded-sm ${command.riskLevel === 'low' ? 'text-primary border-primary/30' : 'text-amber-500 border-amber-500/30'}`}>
            {command.riskLevel?.toUpperCase() || '—'}
          </div>
          <div className={`text-[9px] px-1.5 py-0.5 border rounded-sm ${isLegacyRealExecution ? 'border-destructive/30 text-destructive bg-destructive/5' : 'border-border text-muted-foreground'}`}>
            {isLegacyRealExecution ? 'LEGACY_REAL' : (command.executionMode || 'SIMULATED')}
          </div>
          {isReadOnly && (
            <div className="text-[9px] px-1.5 py-0.5 border border-primary/30 text-primary bg-primary/5">
              READ_ONLY
            </div>
          )}
          {isLegacyRealExecution && (
            <div className="text-[9px] px-1.5 py-0.5 border border-destructive/30 text-destructive bg-destructive/5">
              LEGACY_REAL_EXECUTION_RECORD
            </div>
          )}
          <div className="text-muted-foreground/50 text-right text-[9px]">
            {executedAtTime}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-secondary/10 border-t border-border/20 px-4 py-3 space-y-3">
          {/* Legacy REAL execution warning */}
          {isLegacyRealExecution && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[9px] uppercase tracking-wider text-destructive/70 mb-0.5 font-semibold">LEGACY_REAL_EXECUTION_RECORD</div>
                <div className="text-[9px] text-destructive/80">
                  This command record has executionMode = {command.executionMode}. Current system policy is SIMULATED/READ_ONLY only. This record is preserved for audit purposes and will NOT be executed. Operator review required before production readiness can be considered.
                </div>
              </div>
            </div>
          )}

          {/* Block reason if blocked */}
          {blockReason && !isLegacyRealExecution && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/5 border border-destructive/20">
              <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[9px] uppercase tracking-wider text-destructive/60 mb-0.5">Block Reason</div>
                <div className="text-[10px] text-destructive/80 font-mono break-all">{blockReason}</div>
              </div>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Command Type</div>
              <div className="text-foreground font-mono">{command.commandType}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Status</div>
              <div className={`text-foreground font-mono ${cfg.color}`}>{command.status?.toUpperCase()}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Risk Tier</div>
              <div className="text-foreground font-mono">{command.riskLevel?.toUpperCase() || '—'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Execution Mode</div>
              <div className="text-foreground font-mono">{command.executionMode || 'SIMULATED'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Governance Mode</div>
              <div className="text-foreground font-mono">{command.governanceMode || 'SAFE_REQUIRES_APPROVAL'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Trace ID</div>
              <div className="text-muted-foreground/60 font-mono text-[9px] truncate">{auditTraceId}</div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Executed At</div>
              <div className="text-foreground font-mono text-[9px]">
                {command.executedAt ? format(new Date(command.executedAt), 'yyyy-MM-dd HH:mm:ss') : '—'}
              </div>
            </div>
            {command.approvedBy && (
              <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Approved By</div>
                <div className="text-foreground text-[9px]">{command.approvedBy}</div>
              </div>
            )}
          </div>

          {/* Response payload */}
          {command.result && (
            <div className="bg-secondary/30 border border-border px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Response Payload</div>
              <div className="bg-secondary/50 px-2 py-1.5 rounded border border-border/30 max-h-32 overflow-auto">
                <pre className="text-[9px] font-mono text-muted-foreground/70 whitespace-pre-wrap break-words">
                  {JSON.stringify(command.result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Full JSON */}
          <details className="text-[9px]">
            <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-widest text-[8px]">
              Full Command JSON
            </summary>
            <pre className="mt-2 bg-secondary/30 border border-border/30 px-2 py-1.5 overflow-auto max-h-48 text-muted-foreground/60 font-mono text-[8px] leading-tight">
              {JSON.stringify(command, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function ExecutedCommandAuditView() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [legacyRealCount, setLegacyRealCount] = useState(0);

  useEffect(() => {
    const fetchCommands = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.OpenClawCommand.list('-executedAt', 200);
        // Only show commands that have been executed or blocked
        const filtered = data.filter(c => c.executedAt && (c.status === 'executed' || c.status === 'blocked' || c.status === 'failed'));
        const legacy = data.filter(c => c.executionMode === 'REAL' || c.executionMode === 'LIVE');
        setCommands(filtered);
        setLegacyRealCount(legacy.length);
      } catch (err) {
        console.error('Failed to fetch commands:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommands();
  }, []);

  const isReadOnly = (cmd) => ['system.status', 'logs.fetch', 'session.list'].includes(cmd.commandType);

  const filtered = commands.filter(cmd => {
    if (filter === 'ALL') return true;
    if (filter === 'EXECUTED') return cmd.status === 'executed';
    if (filter === 'BLOCKED') return cmd.status === 'blocked';
    if (filter === 'FAILED') return cmd.status === 'failed';
    if (filter === 'READ_ONLY') return isReadOnly(cmd);
    return true;
  });

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Executed Command Audit</span>
          <span className="text-[9px] text-muted-foreground/30 ml-1">{filtered.length} shown</span>
        </div>
      </div>

      {/* Legacy REAL/LIVE warning banner */}
      {legacyRealCount > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-destructive/5 border-b border-destructive/20">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <div className="text-[9px] text-destructive/80">
            <span className="font-semibold">LEGACY_REAL_EXECUTION_RECORD:</span> {legacyRealCount} command{legacyRealCount !== 1 ? 's' : ''} found with REAL/LIVE execution mode. These are preserved for audit, will NOT be executed, and require operator review before production.
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/30 bg-secondary/10 overflow-x-auto">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1 text-[9px] border rounded whitespace-nowrap transition-colors ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="hidden lg:grid grid-cols-[20px_120px_80px_60px_70px_100px_auto] gap-2 px-4 py-2 bg-secondary/20 border-b border-border/30 text-[9px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
        <div />
        <div>Command Type</div>
        <div>Status</div>
        <div>Risk</div>
        <div>Mode</div>
        <div>Type</div>
        <div className="text-right">Executed At</div>
      </div>

      {/* Commands list */}
      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">No {filter.toLowerCase()} commands found</div>
        ) : (
          filtered.map((cmd, idx) => <CommandRow key={idx} command={cmd} index={idx} />)
        )}
      </div>

      {/* Footer info */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/30 bg-secondary/10 text-[9px] text-muted-foreground/40">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Read-only audit view. No modifications allowed.</span>
        </div>
      )}
    </div>
  );
}