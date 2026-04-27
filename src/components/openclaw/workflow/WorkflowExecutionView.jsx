import React from 'react';
import { CheckCircle2, XCircle, Loader2, Clock, SkipForward, RotateCcw } from 'lucide-react';

const STATUS_CONFIG = {
  SUCCESS:     { icon: CheckCircle2, color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
  FAILED:      { icon: XCircle,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  SKIPPED:     { icon: SkipForward,  color: 'text-muted-foreground', bg: 'bg-secondary/30 border-border' },
  NO_ROLLBACK: { icon: RotateCcw,    color: 'text-muted-foreground', bg: 'bg-secondary/30 border-border' },
  running:     { icon: Loader2,      color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20', spin: true },
};

function StepRow({ step, result, index }) {
  const status = result?.status || 'pending';
  const cfg = STATUS_CONFIG[status] || { icon: Clock, color: 'text-muted-foreground/40', bg: 'bg-secondary/20 border-border/50' };
  const Icon = cfg.icon;

  return (
    <div className={`border ${cfg.bg} p-3 font-mono`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 shrink-0 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/50">#{index + 1}</span>
            <span className="text-[11px] text-foreground">{step.stepId}</span>
            <span className="text-[9px] text-muted-foreground/40">·</span>
            <code className="text-[10px] text-muted-foreground/70">{step.capabilityId}</code>
            {result?.simulated && <span className="text-[9px] text-amber-500/70 uppercase tracking-wider">sim</span>}
          </div>
          {result?.error && <div className="mt-0.5 text-[10px] text-destructive">{result.error}</div>}
          {result?.reason && <div className="mt-0.5 text-[10px] text-muted-foreground/50">{result.reason}</div>}
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-[10px] font-semibold uppercase ${cfg.color}`}>{status}</div>
          {result?.latency != null && <div className="text-[9px] text-muted-foreground/40">{result.latency}ms</div>}
        </div>
      </div>

      {/* Expand params */}
      {step.params && Object.keys(step.params).length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-0.5 pl-7">
          {Object.entries(step.params).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1 text-[10px]">
              <span className="text-muted-foreground/40">{k}:</span>
              <span className="text-muted-foreground/70 truncate font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expected vs Actual */}
      {result?.response && (
        <div className="mt-2 pl-7 flex gap-4 text-[10px]">
          <div className="text-muted-foreground/40">Expected: <span className="text-muted-foreground/70">SUCCESS</span></div>
          <div className="text-muted-foreground/40">Actual: <span className={cfg.color}>{status}</span></div>
          {result.scope && <div className="text-muted-foreground/40">Scope: <span className="text-foreground">{result.scope}</span></div>}
        </div>
      )}
    </div>
  );
}

export default function WorkflowExecutionView({ workflow, execResults }) {
  const results = execResults || workflow?.executionResults || [];
  const resultMap = Object.fromEntries(results.map(r => [r.stepId, r]));
  const steps = workflow?.steps || [];

  const completed = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  return (
    <div className="space-y-2 font-mono">
      {/* Summary */}
      <div className="flex items-center gap-4 px-3 py-2 bg-secondary/30 border border-border text-[10px]">
        <span className="text-muted-foreground/60">Steps: <span className="text-foreground">{steps.length}</span></span>
        <span className="text-muted-foreground/60">Completed: <span className="text-primary">{completed}</span></span>
        {failed > 0 && <span className="text-muted-foreground/60">Failed: <span className="text-destructive">{failed}</span></span>}
        <span className="text-muted-foreground/60">Mode: <span className={workflow?.executionMode === 'LIVE' ? 'text-destructive' : 'text-amber-500'}>{workflow?.executionMode || 'SIMULATED'}</span></span>
      </div>

      {/* Step Timeline */}
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <StepRow key={step.stepId} step={step} result={resultMap[step.stepId]} index={i} />
        ))}
      </div>

      {/* Rollback log */}
      {workflow?.rollbackLog?.length > 0 && (
        <div className="mt-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Rollback Log</div>
          {workflow.rollbackLog.map((rb, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 border border-border/50 text-[10px] text-muted-foreground/70">
              <RotateCcw className="w-3 h-3 shrink-0 text-amber-500" />
              <span>{rb.stepId}</span>
              <span>·</span>
              <span className={rb.status === 'SUCCESS' ? 'text-primary' : 'text-destructive'}>{rb.status}</span>
              {rb.note && <span className="text-muted-foreground/40">· {rb.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}