/**
 * ApprovalWorkflowPlanning
 * Plans and documents approval workflow behavior without execution.
 * UI-only planning and documentation page.
 *
 * Does NOT:
 *   - Execute approvals or transitions
 *   - Save workflow state
 *   - Call APIs
 *   - Write to database
 *   - Dispatch requests
 *   - Use OpenClaw, SafeBridge, MCP, browser automation
 *   - Access brokers, banks, bureaus, payments, credentials
 *   - Upload or parse files
 *   - Use AI indexing
 */

import React from 'react';
import { AlertCircle, Download } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { Link } from 'react-router-dom';

const APPROVAL_STATUS_MODEL = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'DENIED',
  'NEEDS_REVISION',
  'EXPIRED',
];

const ALLOWED_STATUS_TRANSITIONS = [
  'DRAFT → PENDING_APPROVAL',
  'PENDING_APPROVAL → APPROVED',
  'PENDING_APPROVAL → DENIED',
  'PENDING_APPROVAL → NEEDS_REVISION',
  'NEEDS_REVISION → DRAFT',
  'APPROVED → EXPIRED',
];

const FORBIDDEN_STATUS_TRANSITIONS = [
  'DRAFT → APPROVED',
  'DENIED → APPROVED',
  'EXPIRED → APPROVED',
  'APPROVED → EXECUTED',
  'PENDING_APPROVAL → EXECUTED',
];

const APPROVAL_REQUIREMENTS_PREVIEW = [
  'operatorId required',
  'reviewerId required for approval/denial',
  'reviewNote required for denial',
  'approval expires after configured time window',
  'approved requests remain non-executing',
  'executionStatus must remain NOT_EXECUTED',
];

const SAFETY_BOUNDARY_CLAIMS = [
  'No OpenClaw dispatch',
  'No SafeBridge dispatch',
  'No MCP tool calls',
  'No browser automation',
  'No broker/trading execution',
  'No bank/payment execution',
  'No credential storage',
  'No database writes',
  'No persistence',
  'No execution',
];

export default function ApprovalWorkflowPlanning() {
  const handleExport = () => {
    const snapshot = {
      snapshotType: 'APPROVAL_WORKFLOW_PLANNING_SNAPSHOT',
      generatedAt: new Date().toISOString(),
      approvalStatusModel: APPROVAL_STATUS_MODEL,
      allowedStatusTransitions: ALLOWED_STATUS_TRANSITIONS,
      forbiddenStatusTransitions: FORBIDDEN_STATUS_TRANSITIONS,
      approvalRequirementsPreview: APPROVAL_REQUIREMENTS_PREVIEW,
      safetyBoundary: SAFETY_BOUNDARY_CLAIMS,
      implementationStatus: 'PLANNING_ONLY',
      note: 'This is a planning snapshot only. No approval workflow logic, execution, or persistence exists yet.',
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approval-workflow-planning-${Date.now()}.json`;
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
            <div className="w-5 h-5 bg-primary/10 border border-primary/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold tracking-wide text-slate-100">Approval Workflow Planning</h1>
              <p className="text-[9px] text-slate-300 mt-0.5">Planning Only · Not Implemented · No Execution</p>
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
              This page defines future approval workflow rules only. It does not approve, save, send, execute, or dispatch requests.
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
                Approval workflow planning defines how future dry-run requests move through review states. It establishes allowed status transitions, approval requirements, and safety constraints to guide future implementation.
              </p>
            </div>
          </div>

          {/* Section B: Approval Status Model */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">B. Approval Status Model</h2>
            </div>
            <div className="p-4 space-y-2">
              {APPROVAL_STATUS_MODEL.map((status) => (
                <div key={status} className="px-3 py-2 bg-secondary/50 border border-border/30 rounded-sm">
                  <div className="text-[9px] font-mono text-blue-400">{status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Allowed Status Transitions */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">C. Allowed Status Transitions</h2>
            </div>
            <div className="p-4 space-y-2">
              {ALLOWED_STATUS_TRANSITIONS.map((transition) => (
                <div key={transition} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
                  <span className="text-emerald-400 shrink-0 font-bold">→</span>
                  <span className="text-[9px] font-mono text-slate-300">{transition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Forbidden Status Transitions */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">D. Forbidden Status Transitions</h2>
            </div>
            <div className="p-4 space-y-2">
              {FORBIDDEN_STATUS_TRANSITIONS.map((transition) => (
                <div key={transition} className="flex items-center gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm">
                  <span className="text-destructive/70 shrink-0 font-bold">✕</span>
                  <span className="text-[9px] font-mono text-slate-300">{transition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Approval Requirements Preview */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">E. Approval Requirements Preview</h2>
            </div>
            <div className="p-4 space-y-2">
              {APPROVAL_REQUIREMENTS_PREVIEW.map((req) => (
                <div key={req} className="flex items-start gap-2 px-3 py-2 bg-secondary/30 border border-border/40 rounded-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                  <span className="text-[9px] text-slate-300">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section F: Safety Boundary */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">F. Safety Boundary</h2>
            </div>
            <div className="p-4 space-y-2">
              {SAFETY_BOUNDARY_CLAIMS.map((claim) => (
                <div key={claim} className="flex items-start gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/20 rounded-sm">
                  <span className="text-destructive/70 shrink-0 mt-0.5 font-bold">✕</span>
                  <span className="text-[9px] text-slate-300">{claim}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section G: Export */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-semibold text-[11px] font-mono uppercase"
              >
                <Download className="w-4 h-4" />
                Export Approval Workflow Planning Snapshot
              </button>
            </div>
            <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] font-mono text-muted-foreground/60 text-center italic">
              Browser-local JSON export only · No backend or database writes
            </div>
          </div>

          {/* Footer */}
          <div className="text-[9px] font-mono text-muted-foreground/60 text-center mt-8 pb-4">
            This approval workflow planning is part of the Veridan Core governance framework. Updates must be approved before implementation.
          </div>
        </div>
      </div>
    </div>
  );
}