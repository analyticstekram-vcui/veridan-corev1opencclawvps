/**
 * WebhookContractCard
 * Displays a single webhook contract definition.
 * Read-only — no dispatch, no execution.
 */

import React from 'react';
import { RISK_COLORS, APPROVAL_COLORS } from './webhookContracts';

export default function WebhookContractCard({ contract, onSelect }) {
  const risk     = RISK_COLORS[contract.riskLevel]     || RISK_COLORS.LOW;
  const approval = APPROVAL_COLORS[contract.approvalState] || 'text-slate-400';

  return (
    <div
      className="bg-card border border-border/40 rounded-sm hover:border-border/70 transition-colors cursor-pointer"
      onClick={() => onSelect(contract)}
    >
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-foreground font-mono">{contract.eventType}</span>
        <span className={`ml-auto px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${risk.text} ${risk.bg} ${risk.border}`}>
          {contract.riskLevel}
        </span>
        <span className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm border-border/30 bg-secondary/20 ${approval}`}>
          {contract.approvalState}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2 text-[8px] font-mono">
        <div className="text-slate-400 leading-relaxed">{contract.description}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pt-1">
          <div><span className="text-slate-500">route: </span><span className="text-primary/80">{contract.allowedRoute}</span></div>
          <div><span className="text-slate-500">destination: </span><span className="text-slate-300">{contract.destinationSystem}</span></div>
          <div><span className="text-slate-500">executionStatus: </span><span className="text-destructive font-bold">NOT_EXECUTED</span></div>
          <div><span className="text-slate-500">dispatchStatus: </span><span className="text-destructive font-bold">NOT_DISPATCHED</span></div>
        </div>
      </div>
    </div>
  );
}