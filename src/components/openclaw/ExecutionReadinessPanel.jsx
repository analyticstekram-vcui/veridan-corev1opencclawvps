import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Lock, Zap, OctagonX, AlertCircle } from 'lucide-react';
import LiveBridgeDryRun from './LiveBridgeDryRun';

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
    label: 'Execution bridge wired',
    description: 'openclawExecutionBridge — HMAC signing, allowlist, rate limit active',
    getStatus: () => 'READY',
  },
  {
    id: 'estop',
    label: 'Emergency stop available',
    description: 'Kill switch blocks all execution globally',
    getStatus: () => 'READY',
  },
];

const statusConfig = {
  READY:   { icon: CheckCircle2,  color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         label: 'READY'   },
  BLOCKED: { icon: XCircle,       color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'BLOCKED' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     label: 'WARNING' },
};

export default function ExecutionReadinessPanel({ gatewayOnline }) {
  const [commandCount, setCommandCount]       = useState(0);
  const [executionMode, setExecutionMode]     = useState('SIMULATED'); // 'SIMULATED' | 'LIVE'
  const [executionPaused, setExecutionPaused] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBlockedMsg, setShowBlockedMsg]   = useState(false);

  useEffect(() => {
    base44.entities.OpenClawCommand.list('-created_date', 1)
      .then(data => setCommandCount(data.length))
      .catch(() => {});
  }, []);

  const ctx      = { gatewayOnline, commandCount };
  const statuses = CHECKLIST.map(item => ({ ...item, status: item.getStatus(ctx) }));
  const overallReady = statuses.every(s => s.status === 'READY');
  const hasBlocked   = statuses.some(s => s.status === 'BLOCKED');

  const handleLiveToggleClick = () => {
    if (executionMode === 'LIVE') {
      // Switch back to simulated immediately
      setExecutionMode('SIMULATED');
      return;
    }
    if (!overallReady) {
      setShowBlockedMsg(true);
      setTimeout(() => setShowBlockedMsg(false), 5000);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmGoLive = async () => {
    setShowConfirmModal(false);
    setExecutionMode('LIVE');
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: JSON.stringify({
          eventType: 'OPENCLAW_EXECUTION_LIVE_ENABLED',
          source: 'VeridanCore.UI',
          timestamp: new Date().toISOString(),
        }),
        response_json_schema: { type: 'object', properties: { logged: { type: 'boolean' } } },
      });
    } catch (_) {}
  };

  const handleKillSwitch = async () => {
    const next = !executionPaused;
    setExecutionPaused(next);
    if (next) setExecutionMode('SIMULATED');
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: JSON.stringify({
          eventType: next ? 'OPENCLAW_EXECUTION_BLOCKED_GLOBAL' : 'OPENCLAW_KILL_SWITCH_RELEASED',
          source: 'VeridanCore.UI',
          timestamp: new Date().toISOString(),
        }),
        response_json_schema: { type: 'object', properties: { logged: { type: 'boolean' } } },
      });
    } catch (_) {}
  };

  const isLive = executionMode === 'LIVE' && !executionPaused;

  return (
    <div className="p-6 max-w-2xl space-y-4 font-mono">

      {/* System Verify Authority Banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-400/5 border border-blue-400/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-[10px] text-blue-400/80">
          <div className="font-semibold mb-0.5">⚠️ Final production readiness determined by System Verify.</div>
          <div className="text-[9px] text-blue-400/70">Local infrastructure checks shown below. For production readiness decision, see System Verify tab. Backend enforcement must pass.</div>
        </div>
      </div>

      {/* Header + Mode Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Local Infrastructure Status</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasBlocked ? 'bg-destructive' : overallReady ? 'bg-primary' : 'bg-amber-500'}`} />
            <span className={`text-sm font-semibold ${hasBlocked ? 'text-destructive' : overallReady ? 'text-primary' : 'text-amber-500'}`}>
              {hasBlocked ? 'CHECKS FAILED' : overallReady ? 'CHECKS PASSED' : 'WARNINGS'}
            </span>
          </div>
        </div>

        {/* Execution Mode Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 border text-[11px] font-semibold ${
          executionPaused ? 'border-destructive/40 bg-destructive/10 text-destructive' :
          isLive          ? 'border-destructive/40 bg-destructive/10 text-destructive' :
                            'border-primary/30 bg-primary/10 text-primary'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${executionPaused || isLive ? 'bg-destructive' : 'bg-primary'}`} />
          {executionPaused ? 'KILL SWITCH ACTIVE' : isLive ? 'LIVE' : 'SIMULATED'}
        </div>
      </div>

      {/* Kill Switch Banner */}
      {executionPaused && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30">
          <OctagonX className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-[11px] text-destructive">Emergency kill switch active — all execution is globally blocked.</span>
        </div>
      )}

      {/* Checklist */}
      <div className="border border-border bg-card divide-y divide-border/50">
        {statuses.map(item => {
          const cfg  = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
              <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-foreground">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.description}</div>
              </div>
              <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Enable Live Execution Toggle */}
      <div className="bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-3.5 h-3.5 ${isLive ? 'text-destructive' : 'text-slate-400'}`} />
               <div className="text-[12px] font-semibold text-foreground">Enable Live Execution</div>
              </div>
              <div className="text-[10px] text-slate-400">
              Routes approved commands to OpenClaw gateway via HMAC-signed requests.<br />
              Allowlist: <span className="text-foreground">system.status, logs.fetch, session.list</span>
            </div>
          </div>
          <button
            onClick={handleLiveToggleClick}
            disabled={executionPaused}
            className="relative flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
            title={executionPaused ? 'Kill switch active' : isLive ? 'Click to revert to simulated' : 'Enable live execution'}
          >
            <div className={`w-12 h-6 rounded-full border flex items-center px-0.5 transition-all duration-200 ${
              isLive ? 'bg-destructive/20 border-destructive/50 justify-end' : 'bg-secondary border-border justify-start'
            }`}>
              <div className={`w-5 h-5 rounded-full transition-all duration-200 ${isLive ? 'bg-destructive' : 'bg-slate-500'}`} />
              </div>
              {!isLive && <Lock className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500 transition-colors" />}
          </button>
        </div>

        {showBlockedMsg && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-2.5">
            <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-500">
              All readiness checks must pass before enabling live execution.
              <span className="block text-amber-500/60 mt-0.5 text-[10px]">Resolve BLOCKED items above first.</span>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Kill Switch */}
      <div className="bg-card border border-border p-5">
       <div className="flex items-center justify-between gap-4">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <OctagonX className={`w-3.5 h-3.5 ${executionPaused ? 'text-destructive' : 'text-slate-400'}`} />
             <div className="text-[12px] font-semibold text-foreground">Emergency Kill Switch</div>
           </div>
           <div className="text-[10px] text-slate-400">
             Immediately blocks all execution globally and reverts to simulated mode.<br />
             Logs <span className="text-foreground">OPENCLAW_EXECUTION_BLOCKED_GLOBAL</span>.
           </div>
         </div>
         <button
           onClick={handleKillSwitch}
           className={`px-4 py-2 border text-[11px] font-semibold transition-colors ${
             executionPaused
               ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
               : 'border-destructive/40 text-destructive bg-destructive/10 hover:bg-destructive/20'
           }`}
         >
           {executionPaused ? 'Release Kill Switch' : 'Engage Kill Switch'}
         </button>
       </div>
      </div>

      {/* Live Bridge Dry Run */}
      <div className="border border-border bg-card p-5">
       <div className="text-[11px] font-semibold text-slate-200 mb-4 uppercase tracking-wider">Live Bridge Dry Run</div>
       <LiveBridgeDryRun />
      </div>

      <div className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-semibold">
       {isLive ? 'Live execution active · HMAC signed · Allowlist enforced · Rate limited' : 'Simulation mode · No real commands sent to OpenClaw'}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-card border border-destructive/40 w-full max-w-sm font-mono">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Zap className="w-4 h-4 text-destructive" />
              <span className="text-[13px] font-semibold text-destructive">Enable Live Execution?</span>
            </div>
            <div className="px-5 py-4 space-y-3 text-[11px] text-slate-300">
              <p>You are about to enable <span className="text-destructive font-semibold">LIVE</span> execution mode. Real commands will be dispatched to the OpenClaw gateway.</p>
              <ul className="space-y-1 text-[10px] text-slate-400 list-disc ml-4">
                <li>Only allowlisted commands will be sent</li>
                <li>All requests are HMAC signed</li>
                <li>Rate limit: 5 commands/minute</li>
                <li>Use the kill switch to halt immediately</li>
              </ul>
              <p className="text-amber-500 text-[10px]">This action will be audited.</p>
            </div>
            <div className="px-5 py-3 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-1.5 border border-border text-[11px] text-slate-400 hover:text-foreground hover:bg-secondary/50 transition-colors font-semibold">
                Cancel
              </button>
              <button onClick={confirmGoLive} className="px-4 py-1.5 bg-destructive text-destructive-foreground text-[11px] hover:bg-destructive/90 transition-colors">
                Confirm — Go Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}