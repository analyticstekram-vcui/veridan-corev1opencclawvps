import React from 'react';
import { Shield, BotMessageSquare } from 'lucide-react';

const STATUS_ROWS = [
  { label: 'Agent Mode', value: 'GOVERNANCE_ASSISTED', color: 'text-primary' },
  { label: 'Execution Status', value: 'NOT_EXECUTED', color: 'text-destructive' },
  { label: 'Dispatch Status', value: 'NOT_DISPATCHED', color: 'text-destructive' },
  { label: 'OpenClaw Access', value: 'DISABLED', color: 'text-destructive' },
  { label: 'Broker Access', value: 'DISABLED', color: 'text-destructive' },
  { label: 'Bank Access', value: 'DISABLED', color: 'text-destructive' },
  { label: 'Money Movement', value: 'DISABLED', color: 'text-destructive' },
  { label: 'Obsidian Write Access', value: 'APPROVAL_REQUIRED', color: 'text-amber-400' },
  { label: 'Draft Creation', value: 'APPROVAL_REQUIRED', color: 'text-amber-400' },
  { label: 'Analysis Mode', value: 'READ_ONLY', color: 'text-primary' },
];

export default function VaultAgentStatusCard() {
  return (
    <div className="border border-primary/30 bg-primary/5 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20 bg-primary/10">
        <BotMessageSquare className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Veridan Vault Agent v1 — Status</span>
        <div className="ml-auto flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 text-[7px] font-bold uppercase border border-primary/30 bg-primary/10 text-primary rounded-sm">GOVERNANCE_ASSISTED</span>
          <span className="px-2 py-0.5 text-[7px] font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-400 rounded-sm">APPROVAL_REQUIRED</span>
          <span className="px-2 py-0.5 text-[7px] font-bold uppercase border border-destructive/30 bg-destructive/10 text-destructive rounded-sm">NOT_EXECUTED</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-border/20">
        {STATUS_ROWS.map(({ label, value, color }) => (
          <div key={label} className="px-3 py-2.5 bg-card/80 space-y-0.5">
            <div className="text-[7px] font-mono text-slate-500 uppercase tracking-wide">{label}</div>
            <div className={`text-[8px] font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 px-4 py-2 bg-card/60 border-t border-border/20">
        <Shield className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[7px] font-mono text-slate-500">
          This agent reads VeridanObsidianDraft and VeridanObsidianWriteAudit entities. Any draft it creates enters the existing approval/write workflow.
          It cannot write to Obsidian, dispatch to OpenClaw, access brokers, access banks, or execute any commands autonomously.
        </p>
      </div>
    </div>
  );
}