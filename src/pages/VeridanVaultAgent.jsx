/**
 * VeridanVaultAgent — Phase 3 Read-Only Core Integration
 *
 * SAFETY BOUNDARY:
 * - READ_ONLY: No entity writes, no mutations, no draft creation
 * - REPORTING_ONLY: Displays Phase 2 report data via mock adapter
 * - NO_EXECUTION: No governance activation, no dispatch, no OpenClaw
 * - NO_BROKER: No trading, no banking, no broker API access
 *
 * This page does NOT import base44 SDK. No entity operations are reachable.
 */

import React from 'react';
import { BotMessageSquare } from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';
import CoreReportsDashboard from '../components/vault-agent/CoreReportsDashboard';

const SAFETY_BADGES = [
  { label: 'READ_ONLY',         cls: 'border-primary/30 bg-primary/10 text-primary' },
  { label: 'REPORTING_ONLY',    cls: 'border-primary/30 bg-primary/10 text-primary' },
  { label: 'NO_EXECUTION',      cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
  { label: 'OPENCLAW_DISABLED', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
  { label: 'BROKER_DISABLED',   cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
  { label: 'BANKING_DISABLED',  cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
];

export default function VeridanVaultAgent() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Knowledge Management
            </div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BotMessageSquare className="w-5 h-5 text-primary" />
              Veridan Vault Agent
              <span className="text-[8px] font-mono text-slate-500 font-normal">Phase 3 · Core Integration</span>
            </h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Governance-safe read-only reporting · Phase 2 report integration · No writes · No execution
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SAFETY_BADGES.map(b => (
                <span key={b.label} className={`px-2 py-0.5 text-[7px] font-bold uppercase border rounded-sm ${b.cls}`}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-mono text-slate-600">Core Reports · Default View</span>
          </div>
        </div>
      </div>

      {/* Content — Phase 3 read-only only */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <CoreReportsDashboard />
      </div>
    </div>
  );
}