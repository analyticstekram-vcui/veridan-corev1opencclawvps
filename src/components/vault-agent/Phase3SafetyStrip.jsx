import React from 'react';
import { Shield } from 'lucide-react';

const BADGES = [
  { label: 'READ_ONLY',        color: 'text-primary border-primary/30 bg-primary/10' },
  { label: 'REPORTING_ONLY',   color: 'text-primary border-primary/30 bg-primary/10' },
  { label: 'NO_EXECUTION',     color: 'text-destructive border-destructive/30 bg-destructive/10' },
  { label: 'OPENCLAW_DISABLED',color: 'text-destructive border-destructive/30 bg-destructive/10' },
  { label: 'BROKER_DISABLED',  color: 'text-destructive border-destructive/30 bg-destructive/10' },
  { label: 'BANKING_DISABLED', color: 'text-destructive border-destructive/30 bg-destructive/10' },
];

export default function Phase3SafetyStrip({ adapterMode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border border-amber-500/20 bg-amber-500/5 rounded-sm">
      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-[7px] font-bold uppercase tracking-widest text-amber-500 mb-1.5">
          Phase 3 — Read-Only Reporting · Vault Agent Core Integration
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BADGES.map(b => (
            <span key={b.label} className={`px-2 py-0.5 text-[6px] font-bold uppercase border rounded-sm font-mono ${b.color}`}>
              {b.label}
            </span>
          ))}
          {adapterMode && (
            <span className={`px-2 py-0.5 text-[6px] font-bold uppercase border rounded-sm font-mono ${
              adapterMode === 'MOCK'
                ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                : 'text-primary border-primary/30 bg-primary/10'
            }`}>
              DATA_SOURCE: {adapterMode}
            </span>
          )}
        </div>
        <p className="text-[7px] font-mono text-slate-500 mt-1.5 leading-relaxed">
          This panel presents read-only data from Vault Agent Phase 2 report outputs.
          No governance documents are activated. No OpenClaw dispatch occurs. No trading, banking, or broker actions are triggered.
          No mutations are made to the local vault or backend entities from this view.
        </p>
      </div>
    </div>
  );
}