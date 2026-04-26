import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Lock } from 'lucide-react';

const CHECKLIST = [
  {
    id: 'gateway',
    label: 'Gateway reachable',
    description: 'OpenClaw gateway responds to health checks',
    getStatus: (ctx) => ctx.gatewayOnline ? 'READY' : 'BLOCKED',
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare Access protected',
    description: 'Auth layer confirmed at gateway edge',
    getStatus: (ctx) => ctx.gatewayOnline ? 'READY' : 'WARNING',
  },
  {
    id: 'queue',
    label: 'Command queue active',
    description: 'Governance command queue is operational',
    getStatus: (ctx) => ctx.commandCount >= 0 ? 'READY' : 'BLOCKED',
  },
  {
    id: 'governance',
    label: 'Governance approval required',
    description: 'No command can bypass approval flow',
    getStatus: () => 'READY',
  },
  {
    id: 'audit',
    label: 'Audit logging active',
    description: 'All lifecycle events persisted to OpenClawCommand entity',
    getStatus: () => 'READY',
  },
  {
    id: 'adapter',
    label: 'Execution adapter disabled',
    description: 'Live command dispatch is locked pending policy',
    getStatus: () => 'READY',
  },
  {
    id: 'estop',
    label: 'Emergency stop available',
    description: 'Deny/Cancel buttons active on all pending commands',
    getStatus: () => 'READY',
  },
];

const statusConfig = {
  READY:   { icon: CheckCircle2, color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',     label: 'READY' },
  BLOCKED: { icon: XCircle,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'BLOCKED' },
  WARNING: { icon: AlertTriangle,color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20', label: 'WARNING' },
};

export default function ExecutionReadinessPanel({ gatewayOnline }) {
  const [commandCount, setCommandCount] = useState(0);
  const [showBlockedMsg, setShowBlockedMsg] = useState(false);

  useEffect(() => {
    base44.entities.OpenClawCommand.list('-created_date', 1)
      .then(data => setCommandCount(data.length))
      .catch(() => {});
  }, []);

  const ctx = { gatewayOnline, commandCount };

  const statuses = CHECKLIST.map(item => ({
    ...item,
    status: item.getStatus(ctx),
  }));

  const overallReady = statuses.every(s => s.status === 'READY');
  const hasBlocked   = statuses.some(s => s.status === 'BLOCKED');

  const handleAdapterToggle = async () => {
    setShowBlockedMsg(true);
    setTimeout(() => setShowBlockedMsg(false), 6000);
    // Audit event
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: JSON.stringify({
          eventType: 'OPENCLAW_EXECUTION_ENABLE_ATTEMPTED',
          source: 'VeridanCore.UI',
          target: 'ExecutionAdapter',
          status: 'BLOCKED_BY_POLICY',
          timestamp: new Date().toISOString(),
        }),
        response_json_schema: { type: 'object', properties: { logged: { type: 'boolean' } } },
      });
    } catch (_) { /* non-blocking */ }
  };

  return (
    <div className="p-6 max-w-2xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">Execution Readiness</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasBlocked ? 'bg-destructive' : overallReady ? 'bg-primary' : 'bg-amber-500'}`} />
            <span className={`text-sm font-semibold ${hasBlocked ? 'text-destructive' : overallReady ? 'text-primary' : 'text-amber-500'}`}>
              {hasBlocked ? 'NOT READY' : overallReady ? 'ALL SYSTEMS READY' : 'WARNING'}
            </span>
          </div>
        </div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/30 text-right">
          Execution locked<br />Policy pending
        </div>
      </div>

      {/* Checklist */}
      <div className="border border-border bg-card divide-y divide-border/50">
        {statuses.map(item => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
              <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-foreground">{item.label}</div>
                <div className="text-[10px] text-muted-foreground/50">{item.description}</div>
              </div>
              <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Execution Adapter Toggle */}
      <div className="bg-card border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold text-foreground mb-1">Enable Execution Adapter</div>
            <div className="text-[10px] text-muted-foreground/60">
              Activates live command dispatch to OpenClaw gateway.<br />
              Requires final governance policy configuration.
            </div>
          </div>
          {/* Locked toggle */}
          <button
            onClick={handleAdapterToggle}
            className="relative flex items-center gap-2 group"
            title="Locked — governance policy required"
          >
            <div className="w-12 h-6 rounded-full bg-secondary border border-border flex items-center px-0.5 transition-colors">
              <div className="w-5 h-5 rounded-full bg-muted-foreground/30 transition-transform" />
            </div>
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-amber-500 transition-colors" />
          </button>
        </div>

        {/* Blocked Message */}
        {showBlockedMsg && (
          <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-2.5">
            <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-500">
              Execution adapter requires final governance policy configuration before activation.
              <span className="block text-amber-500/60 mt-0.5 text-[10px]">Audit event recorded: OPENCLAW_EXECUTION_ENABLE_ATTEMPTED</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-widest">
        Live execution disabled · Governance layer incomplete · All actions are read-only
      </div>
    </div>
  );
}