/**
 * CurrentBuildStateCard
 * Displays the current build phase, mode, and system state.
 * UI-only informational card.
 *
 * Does NOT:
 *   - Make backend calls
 *   - Call APIs
 *   - Write to database
 *   - Execute OpenClaw commands
 *   - Use SafeBridge
 *   - Use MCP execution
 *   - Use browser automation
 *   - Access TradingView, broker, bank, credit bureau, payment, credential systems
 *   - Parse or upload files
 *   - Use AI indexing
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

const STATE_ITEMS = [
  { label: 'Phase', value: 'Governance / Baseline / Evidence Locking' },
  { label: 'Mode', value: 'Preview + Read-Only' },
  { label: 'Execution', value: 'Disabled' },
  { label: 'OpenClaw', value: 'Monitoring Only' },
  { label: 'SafeBridge', value: 'Not Active' },
  { label: 'MCP', value: 'Not Active' },
  { label: 'Backend Writes', value: 'Disabled' },
  { label: 'Database Writes', value: 'Disabled' },
  { label: 'Browser Automation', value: 'Disabled' },
  { label: 'Trading / Broker / Bank / Bureau APIs', value: 'Disabled' },
];

export default function CurrentBuildStateCard() {
  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide">Current Build State</h2>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          {STATE_ITEMS.map(({ label, value }) => (
            <div
              key={label}
              className="px-3 py-2 bg-secondary/30 border border-border/40 rounded-sm"
            >
              <div className="text-[8px] font-mono uppercase text-muted-foreground/70 mb-1">{label}</div>
              <div className="text-[10px] font-mono font-semibold text-slate-200">{value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm px-4 py-3">
          <p className="text-[10px] font-mono text-slate-300 leading-relaxed">
            Veridan Core is currently in governance and evidence-locking mode. It can review, organize, and export proof records, but it cannot execute live actions.
          </p>
        </div>

        {/* Next Safe Action */}
        <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
          <div className="text-[9px] font-mono font-bold uppercase text-primary/80 mb-1">Next Safe Action</div>
          <p className="text-[10px] font-mono text-slate-300">
            Continue UI clarity, evidence consolidation, and read-only verification before any execution bridge is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}