import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Terminal, User, AlertTriangle, Clock, Shield, Zap, Loader2, CheckCircle2, Package } from 'lucide-react';
import MultiSigApprovalBar from './MultiSigApprovalBar';
import ScopeBadge, { isScopePermitted } from './ScopeBadge';
import { CAPABILITY_MAP } from '@/lib/capabilityRegistry';

const riskColors = {
  low: 'text-primary border-primary/30 bg-primary/5',
  medium: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  high: 'text-orange-500 border-orange-500/30 bg-orange-500/5',
  critical: 'text-destructive border-destructive/30 bg-destructive/5',
};

const statusColors = {
  pending:   'text-amber-500 bg-amber-500/10 border-amber-500/30',
  approved:  'text-primary bg-primary/10 border-primary/30',
  denied:    'text-destructive bg-destructive/10 border-destructive/30',
  executed:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  failed:    'text-destructive bg-destructive/10 border-destructive/30',
  cancelled: 'text-muted-foreground bg-secondary/60 border-border',
};

export default function CommandPreviewCard({ command, onApprove, onDeny, onCancel, onExecuted, executionMode = 'SIMULATED', executionPaused = false, currentUser }) {
  const isPending    = command.status === 'pending';
  const isApproved   = command.status === 'approved';
  const isLive       = executionMode === 'LIVE' && !executionPaused;
  const scopeOk      = isScopePermitted(command.entityScope, command.commandText);
  const scopeBlocked = isApproved && !scopeOk;
  const capability   = command.capabilityId ? CAPABILITY_MAP[command.capabilityId] : null;
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState(null);

  const handleExecute = async () => {
    setExecuting(true);
    setExecResult(null);
    const res = await base44.functions.invoke('openclawExecutionBridge', {
      commandId: command.id,
      executionMode,
      executionPaused,
    });
    setExecuting(false);
    if (res.data?.result) {
      setExecResult(res.data.result);
      if (onExecuted) onExecuted();
    }
  };

  return (
    <div className="bg-card border border-border font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Command Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <ScopeBadge entityScope={command.entityScope} commandText={command.commandText} />
          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${statusColors[command.status] || ''}`}>
            {command.status}
          </span>
        </div>
      </div>

      {/* Capability + Command */}
      <div className="px-4 py-3 border-b border-border/50 bg-secondary/20 space-y-2">
        {capability && (
          <div className="flex items-center gap-2">
            <Package className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/70">{capability.name}</span>
            <span className="text-[9px] text-muted-foreground/30">·</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40">{capability.commandType}</span>
          </div>
        )}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Command</div>
          <code className="text-[12px] text-foreground break-all">{command.commandText}</code>
        </div>
        {command.parameters && Object.keys(command.parameters).length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Parameters</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {Object.entries(command.parameters).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-muted-foreground/50">{k}:</span>
                  <span className="text-foreground font-mono truncate">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* Multi-sig bar */}
      <MultiSigApprovalBar command={command} currentUser={currentUser} onUpdated={onExecuted} />

      {/* Notes */}
      {command.notes && (
        <div className="px-4 py-2.5 border-b border-border/50 text-[11px] text-muted-foreground/70 italic">
          {command.notes}
        </div>
      )}

      {/* Execution Result Panel */}
      {execResult && (
        <div className="px-4 py-3 border-b border-blue-400/20 bg-blue-400/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase tracking-widest text-blue-400">Simulated Execution Result</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-[11px]">
            <div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Status</div>
              <div className="text-primary font-semibold">SUCCESS</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Latency</div>
              <div className="text-foreground">{execResult.latency}ms</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Mode</div>
              <div className="text-amber-500">SIMULATED</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground/50">
            {new Date(execResult.timestamp).toLocaleString()} · {execResult.simulated ? 'No real command sent to OpenClaw' : 'Live dispatch to OpenClaw gateway'}
          </div>
        </div>
      )}

      {/* Governance Warning */}
      <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[10px] text-amber-500/80">
          {isApproved
            ? 'Approved · Simulation mode only · No live dispatch to OpenClaw'
            : 'Governance approval required before execution · Live commands disabled'}
        </span>
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => onApprove(command)} className="flex-1 py-1.5 bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors">
            Approve
          </button>
          <button onClick={() => onDeny(command)} className="flex-1 py-1.5 bg-destructive/10 border border-destructive/30 text-destructive text-[11px] hover:bg-destructive/20 transition-colors">
            Deny
          </button>
          <button onClick={() => onCancel(command)} className="px-4 py-1.5 border border-border text-muted-foreground text-[11px] hover:text-foreground hover:bg-secondary/50 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {isApproved && !execResult && scopeBlocked && (
        <div className="px-4 py-3 bg-destructive/5 border-t border-destructive/20 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-[10px] text-destructive font-mono">
            SCOPE BLOCKED — <code>{command.commandText}</code> is not permitted under scope <code>{command.entityScope || 'unset'}</code>
          </span>
        </div>
      )}

      {isApproved && !execResult && !scopeBlocked && (
        <div className="px-4 py-3">
          <button
            onClick={handleExecute}
            disabled={executing || executionPaused}
            className={`flex items-center gap-2 w-full justify-center py-2 border text-[11px] transition-colors disabled:opacity-50 ${
              isLive
                ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
            }`}
          >
            {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {executing
              ? (isLive ? 'Executing...' : 'Simulating...')
              : (isLive ? 'Execute (LIVE)' : 'Execute (Simulated)')}
          </button>
        </div>
      )}
    </div>
  );
}