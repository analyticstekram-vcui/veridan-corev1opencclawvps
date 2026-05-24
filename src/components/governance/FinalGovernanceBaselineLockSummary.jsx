/**
 * FinalGovernanceBaselineLockSummary
 * Displays final governance baseline lock status and enables local-only export.
 * UI-only informational card with browser-local JSON export.
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
import { Lock, Download } from 'lucide-react';

const STATUS_ROWS = [
  { label: 'Governance Index', value: 'Complete' },
  { label: 'Current Build State Card', value: 'Complete' },
  { label: 'Current Capabilities Boundary', value: 'Complete' },
  { label: 'Baseline Evidence Export', value: 'Complete' },
  { label: 'Audit / Evidence Navigation', value: 'Complete' },
  { label: 'OpenClaw Monitoring Routing', value: 'Complete' },
  { label: 'System Map Navigation', value: 'Complete' },
  { label: 'Execution Boundary', value: 'Locked' },
  { label: 'Backend Writes', value: 'Disabled' },
  { label: 'Database Writes', value: 'Disabled' },
];

const FORBIDDEN_CLAIMS = [
  'No OpenClaw execution enabled',
  'No SafeBridge activation',
  'No MCP tool execution',
  'No browser automation',
  'No trading or broker connections',
  'No banking integrations',
  'No credit bureau access',
  'No payment processing',
  'No credential storage',
  'No document upload or parsing',
  'No AI indexing layers',
  'No backend writes enabled',
  'No database writes enabled',
];

export default function FinalGovernanceBaselineLockSummary() {
  const handleExport = () => {
    const snapshot = {
      snapshotType: 'FINAL_GOVERNANCE_BASELINE_LOCK',
      generatedAt: new Date().toISOString(),
      phase: 'Governance / Preview Operations / AI Task Planning',
      mode: 'Preview + Read-Only',
      statusRows: STATUS_ROWS.map(({ label, value }) => ({ label, value })),
      executionBoundary: 'Locked — No execution until separate approval',
      nextPhaseReadiness: 'Ready for task planning, preview bridge, and draft review — not live execution',
      forbiddenLogicClaims: FORBIDDEN_CLAIMS,
      summary: 'This baseline confirms Veridan Core is in preview operations mode with task planning and OpenClaw preview bridge active, while execution, file writes, browser automation, trading, banking, bureau, payment, and credential storage remain disabled.',
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `final-governance-baseline-lock-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide">Final Governance Baseline Lock Summary</h2>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          {STATUS_ROWS.map(({ label, value }) => (
            <div
              key={label}
              className="px-3 py-2 bg-secondary/30 border border-border/40 rounded-sm"
            >
              <div className="text-[8px] font-mono uppercase text-muted-foreground/70 mb-1">{label}</div>
              <div className="text-[10px] font-mono font-semibold text-slate-200">{value}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
          <p className="text-[10px] font-mono text-slate-300 leading-relaxed">
            This baseline confirms Veridan Core is in preview operations mode with task planning and OpenClaw preview bridge active, while execution, file writes, browser automation, trading, banking, bureau, payment, and credential storage remain disabled.
          </p>
        </div>

        {/* Next Phase Readiness */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm px-4 py-3">
          <div className="text-[9px] font-mono font-bold uppercase text-amber-400/80 mb-1">Next Phase Readiness</div>
          <p className="text-[10px] font-mono text-slate-300">
            Ready for task planning, preview bridge, and draft review — not live execution.
          </p>
        </div>

        {/* Forbidden Logic Claims */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-sm px-4 py-3">
          <div className="text-[9px] font-mono font-bold uppercase text-destructive/80 mb-2">Forbidden Logic (Verified Disabled)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {FORBIDDEN_CLAIMS.map((claim) => (
              <div key={claim} className="flex items-start gap-1.5 text-[9px] text-slate-300">
                <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                <span>{claim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-semibold text-[11px] font-mono uppercase"
          >
            <Download className="w-4 h-4" />
            Export Final Governance Baseline Lock
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
          Browser-local JSON export only · No backend, API, or database writes · Local Blob + URL.createObjectURL
        </div>
      </div>
    </div>
  );
}