/**
 * DryRunBridgePlanning
 * Plans and documents dry-run bridge behavior without execution.
 * UI-only planning and documentation page.
 *
 * Does NOT:
 *   - Execute any commands
 *   - Make backend calls
 *   - Call APIs
 *   - Write to database
 *   - Execute OpenClaw commands
 *   - Use SafeBridge
 *   - Use MCP execution
 *   - Use browser automation
 *   - Access TradingView, broker, bank, credit bureau, payment, credential systems
 *   - Upload or parse files
 *   - Use AI indexing
 */

import React from 'react';
import { AlertCircle, Download, Lock, CheckCircle2, XCircle } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { Link } from 'react-router-dom';

const ALLOWED_COMMAND_TYPES = ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'];

const FORBIDDEN_COMMAND_TYPES = [
  'CLICK',
  'TYPE',
  'SUBMIT',
  'TRADE',
  'TRANSFER',
  'LOGIN',
  'UPLOAD',
  'DELETE',
  'MODIFY',
  'EXECUTE',
];

const VALIDATION_GATES = [
  'Command type allowlist',
  'Risk tier check',
  'Target system check',
  'Duplicate request check',
  'Approval status check',
  'Forbidden keyword check',
  'Execution lock check',
];

const REQUEST_SHAPE_PREVIEW = {
  requestId: 'req-dry-run-001',
  commandType: 'READ',
  targetSystem: 'gateway',
  requestedAction: 'Read health status',
  riskTier: 'LOW',
  approvalStatus: 'PENDING_APPROVAL',
  executionMode: 'DRY_RUN_ONLY',
  executionStatus: 'NOT_EXECUTED',
};

const SAFETY_BOUNDARY_CLAIMS = [
  'No OpenClaw command execution',
  'No SafeBridge activation',
  'No MCP tool usage',
  'No browser automation',
  'No trading or broker connections',
  'No banking integrations',
  'No credit bureau access',
  'No payment processing',
  'No credential storage',
  'No document upload or parsing',
  'No AI indexing',
  'No backend writes',
  'No database writes',
];

export default function DryRunBridgePlanning() {
  const handleExport = () => {
    const snapshot = {
      snapshotType: 'DRY_RUN_BRIDGE_PLANNING_SNAPSHOT',
      generatedAt: new Date().toISOString(),
      allowedCommandTypes: ALLOWED_COMMAND_TYPES,
      forbiddenCommandTypes: FORBIDDEN_COMMAND_TYPES,
      requestShapePreview: REQUEST_SHAPE_PREVIEW,
      validationGates: VALIDATION_GATES,
      safetyBoundary: SAFETY_BOUNDARY_CLAIMS,
      executionStatus: 'NOT_EXECUTED',
      purpose: 'Dry-run bridge validates proposed actions without executing them.',
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dry-run-bridge-planning-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="bg-background font-mono">
      {/* Module Navigation */}
      <ModuleNav />

      {/* Title Bar */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-[14px] font-bold tracking-wide text-slate-100">Dry-Run Bridge Planning</h1>
              <p className="text-[9px] text-slate-300 mt-0.5">Governance Planning · Simulation Only · No Execution</p>
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 text-[9px] border border-border text-slate-300 hover:text-slate-100 hover:bg-secondary/50 transition-colors rounded font-semibold whitespace-nowrap">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/5 border-b-2 border-amber-500/30 px-6 py-4">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[12px] font-bold text-amber-600 mb-1 uppercase tracking-wide">Planning Only — No Execution</div>
            <p className="text-[10px] text-amber-600/90">
              This page plans simulated bridge behavior only. It does not execute commands.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Section A: Purpose */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">A. Purpose</h2>
            </div>
            <div className="p-4">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                The dry-run bridge validates proposed actions without executing them. It provides a safe mechanism to preview command behavior, test approval workflows, and verify policy gates before enabling actual execution.
              </p>
            </div>
          </div>

          {/* Section B: Allowed Dry-Run Command Types */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">B. Allowed Dry-Run Command Types</h2>
            </div>
            <div className="p-4 space-y-2">
              {ALLOWED_COMMAND_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Forbidden Command Types */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">C. Forbidden Command Types</h2>
            </div>
            <div className="p-4 space-y-2">
              {FORBIDDEN_COMMAND_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Request Shape Preview */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">D. Dry-Run Request Shape Preview</h2>
            </div>
            <div className="p-4">
              <pre className="bg-secondary/50 border border-border/40 px-3 py-2.5 rounded-sm text-[9px] text-blue-400 font-mono overflow-x-auto">
                {JSON.stringify(REQUEST_SHAPE_PREVIEW, null, 2)}
              </pre>
            </div>
          </div>

          {/* Section E: Validation Gates */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">E. Validation Gates Preview</h2>
            </div>
            <div className="p-4 space-y-2">
              {VALIDATION_GATES.map((gate) => (
                <div key={gate} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-[10px] text-slate-300">{gate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section F: Safety Boundary */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">F. Safety Boundary</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                This page does not call OpenClaw, SafeBridge, MCP, browsers, brokers, banks, bureaus, payments, credential stores, upload systems, parsers, AI indexes, backend writes, or database writes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {SAFETY_BOUNDARY_CLAIMS.map((claim) => (
                  <div key={claim} className="flex items-start gap-2 text-[9px]">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span className="text-slate-300">{claim}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
              <h2 className="text-[11px] font-mono font-bold uppercase text-primary">Export Planning Snapshot</h2>
            </div>
            <div className="p-4 flex justify-center">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-semibold text-[11px] font-mono uppercase"
              >
                <Download className="w-4 h-4" />
                Export Dry-Run Bridge Planning Snapshot
              </button>
            </div>
            <div className="px-4 py-2.5 bg-secondary/20 border-t border-border/40 text-[8px] font-mono text-muted-foreground/60 text-center italic">
              Browser-local JSON export only · No backend, API, or database writes
            </div>
          </div>

          {/* Footer */}
          <div className="text-[9px] font-mono text-muted-foreground/60 text-center mt-8 pb-4">
            This planning page is part of the Veridan Core governance framework. Updates to dry-run bridge design must be approved before implementation.
          </div>
        </div>
      </div>
    </div>
  );
}