/**
 * DryRunBackendContractPlanning
 * Defines the future dry-run backend endpoint contract without implementation.
 * UI-only planning and documentation page.
 *
 * Does NOT:
 *   - Create backend routes
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
 *   - Make outbound network calls
 */

import React from 'react';
import { AlertCircle, Download } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { Link } from 'react-router-dom';

const PROPOSED_ENDPOINT_CONTRACT = {
  method: 'POST',
  path: '/api/dry-run/bridge/preview',
  mode: 'DRY_RUN_ONLY',
  executionStatus: 'NOT_EXECUTED',
  persistence: 'NONE',
  outboundCalls: 'NONE',
};

const REQUEST_BODY_FIELDS = [
  'requestId',
  'createdAt',
  'operatorId',
  'commandType',
  'targetSystem',
  'requestedAction',
  'requestedTarget',
  'riskTier',
  'approvalStatus',
  'executionMode',
  'executionStatus',
  'validationStatus',
  'denialReason',
  'auditRequired',
];

const RESPONSE_BODY_FIELDS = {
  accepted: 'boolean',
  requestId: 'string',
  dryRunId: 'string',
  receivedAt: 'string (ISO timestamp)',
  validationStatus: 'string (PASS | FAIL)',
  decision: 'string (ACCEPTED | REJECTED)',
  denialReason: 'string | null',
  executionStatus: 'string (always NOT_EXECUTED)',
  outboundCallsMade: 'boolean (always false)',
  persistenceWritten: 'boolean (always false)',
};

const SERVER_SIDE_VALIDATION_PLAN = [
  {
    name: 'Required fields check',
    description: 'Verify all 14 required fields present',
  },
  {
    name: 'Enum allowlist check',
    description: 'Validate command type, risk tier, approval status against allowlists',
  },
  {
    name: 'Forbidden command block',
    description: 'Block CLICK, TYPE, SUBMIT, TRADE, TRANSFER, LOGIN, UPLOAD, DELETE, MODIFY, EXECUTE',
  },
  {
    name: 'Risk tier check',
    description: 'Allow LOW and MEDIUM only, reject HIGH and CRITICAL',
  },
  {
    name: 'Execution mode lock',
    description: 'Enforce executionMode equals DRY_RUN_ONLY',
  },
  {
    name: 'Execution status lock',
    description: 'Enforce executionStatus equals NOT_EXECUTED',
  },
  {
    name: 'Approval status check',
    description: 'Validate approval status is in valid enum',
  },
  {
    name: 'Sensitive target block',
    description: 'Block targets containing /login, /admin, /secret, /password, /token, /api-key, /credential',
  },
  {
    name: 'Forbidden keyword block',
    description: 'Block requestedAction and requestedTarget containing /execute, /run, /trade, /transfer, etc.',
  },
  {
    name: 'Duplicate requestId strategy',
    description: 'Check for duplicate requestId across stored dry-run requests (future implementation)',
  },
];

const FORBIDDEN_BACKEND_BEHAVIOR = [
  'No OpenClaw calls',
  'No SafeBridge calls',
  'No MCP calls',
  'No browser automation',
  'No broker/trading calls',
  'No bank/payment calls',
  'No bureau calls',
  'No credential storage',
  'No upload/parsing workflows',
  'No database writes',
  'No persistence',
  'No outbound network calls',
];

export default function DryRunBackendContractPlanning() {
  const handleExportContract = () => {
    const contractSnapshot = {
      snapshotType: 'DRY_RUN_BACKEND_CONTRACT_PLANNING_SNAPSHOT',
      generatedAt: new Date().toISOString(),
      proposedEndpointContract: PROPOSED_ENDPOINT_CONTRACT,
      requestBodyContract: {
        description: '14 required fields for dry-run bridge request',
        fields: REQUEST_BODY_FIELDS,
      },
      responseBodyContract: {
        description: 'Dry-run backend response (never executes)',
        fields: RESPONSE_BODY_FIELDS,
      },
      serverSideValidationPlan: SERVER_SIDE_VALIDATION_PLAN,
      forbiddenBackendBehavior: FORBIDDEN_BACKEND_BEHAVIOR,
      implementationStatus: 'NOT_IMPLEMENTED',
      note: 'This is a planning snapshot only. No backend route, logic, or execution exists yet.',
    };

    const blob = new Blob([JSON.stringify(contractSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dry-run-backend-contract-${Date.now()}.json`;
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
              <h1 className="text-[14px] font-bold tracking-wide text-slate-100">Dry-Run Backend Contract Planning</h1>
              <p className="text-[9px] text-slate-300 mt-0.5">Planning Only · Not Implemented · No Backend Routes</p>
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
            <div className="text-[12px] font-bold text-amber-600 mb-1 uppercase tracking-wide">Planning Only — Not Implemented</div>
            <p className="text-[10px] text-amber-600/90">
              This page defines a future backend dry-run contract only. It does not create backend routes, call APIs, validate requests server-side, store data, or execute commands.
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
                This page defines the future dry-run backend endpoint contract before implementation. It documents the proposed request/response shapes, server-side validation rules, and explicitly forbidden behaviors to guide backend development while maintaining safety constraints.
              </p>
            </div>
          </div>

          {/* Section B: Proposed Endpoint Contract */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">B. Proposed Endpoint Contract</h2>
            </div>
            <div className="p-4">
              <pre className="bg-secondary/50 border border-border/40 px-3 py-2.5 rounded-sm text-[9px] text-blue-400 font-mono overflow-x-auto">
                {JSON.stringify(PROPOSED_ENDPOINT_CONTRACT, null, 2)}
              </pre>
            </div>
          </div>

          {/* Section C: Request Body Contract */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">C. Request Body Contract</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-slate-300 mb-3">
                14 required fields for dry-run bridge requests:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {REQUEST_BODY_FIELDS.map((field) => (
                  <div key={field} className="px-2 py-1 bg-secondary/50 border border-border/30 rounded-sm">
                    <div className="text-[9px] font-mono text-blue-400">{field}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section D: Response Body Contract */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">D. Response Body Contract</h2>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(RESPONSE_BODY_FIELDS).map(([field, type]) => (
                <div key={field} className="flex items-center justify-between px-3 py-2 bg-secondary/30 border border-border/40 rounded-sm">
                  <span className="text-[9px] font-mono text-blue-400">{field}</span>
                  <span className="text-[8px] font-mono text-slate-400">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Server-Side Validation Plan */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">E. Server-Side Validation Plan</h2>
            </div>
            <div className="p-4 space-y-2">
              {SERVER_SIDE_VALIDATION_PLAN.map((validation, idx) => (
                <div key={idx} className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
                  <div className="text-[9px] font-mono font-semibold text-slate-100 mb-1">{idx + 1}. {validation.name}</div>
                  <p className="text-[8px] text-slate-400">{validation.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section F: Explicitly Forbidden Backend Behavior */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">F. Explicitly Forbidden Backend Behavior</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {FORBIDDEN_BACKEND_BEHAVIOR.map((behavior) => (
                  <div key={behavior} className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/20 rounded-sm">
                    <span className="text-destructive/70 shrink-0 font-bold">✕</span>
                    <span className="text-[9px] text-slate-300">{behavior}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section G: Export */}
          <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
              <button
                type="button"
                onClick={handleExportContract}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-semibold text-[11px] font-mono uppercase"
              >
                <Download className="w-4 h-4" />
                Export Dry-Run Backend Contract Snapshot
              </button>
            </div>
            <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] font-mono text-muted-foreground/60 text-center italic">
              Browser-local JSON export only · No backend or database writes
            </div>
          </div>

          {/* Footer */}
          <div className="text-[9px] font-mono text-muted-foreground/60 text-center mt-8 pb-4">
            This backend contract is a planning document only. Implementation must follow all safety constraints and pass governance review.
          </div>
        </div>
      </div>
    </div>
  );
}