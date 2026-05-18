/**
 * CurrentCapabilitiesBoundary
 * Displays what the system can and cannot do in current build phase.
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
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const CAN_DO_NOW = [
  'Display governance and safety status',
  'Navigate to audit, evidence, baseline, system map, and monitoring pages',
  'Export local baseline JSON manifests',
  'Review local-only readiness and verification records',
  'Show read-only OpenClaw monitoring sections',
  'Organize proof records before execution phases',
];

const CANNOT_DO_YET = [
  'Execute OpenClaw commands',
  'Run SafeBridge actions',
  'Use MCP tools',
  'Automate browser actions',
  'Place trades',
  'Move money',
  'Pull credit bureau data',
  'Store credentials',
  'Upload or parse documents',
  'Write to backend or database',
];

export default function CurrentCapabilitiesBoundary() {
  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-cyan-500" />
          <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide">Current Capabilities Boundary</h2>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Can Do Now Column */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-[11px] font-mono font-bold uppercase text-emerald-400 tracking-wide">Can Do Now</h3>
            </div>
            <ul className="space-y-2">
              {CAN_DO_NOW.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-400 text-[9px] mt-0.5 shrink-0">✓</span>
                  <span className="text-[10px] text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cannot Do Yet Column */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
              <h3 className="text-[11px] font-mono font-bold uppercase text-destructive/80 tracking-wide">Cannot Do Yet</h3>
            </div>
            <ul className="space-y-2">
              {CANNOT_DO_YET.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-destructive/70 text-[9px] mt-0.5 shrink-0">✕</span>
                  <span className="text-[10px] text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm px-4 py-3">
          <div className="text-[9px] font-mono font-bold uppercase text-amber-400/80 mb-1">Execution Approval Gates</div>
          <p className="text-[10px] font-mono text-slate-300">
            Execution remains disabled until the governed bridge, credential vault, approval policy, dry-run test harness, and rollback plan are separately approved.
          </p>
        </div>
      </div>
    </div>
  );
}