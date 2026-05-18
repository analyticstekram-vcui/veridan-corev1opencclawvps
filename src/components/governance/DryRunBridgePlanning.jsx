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

const CONTRACT_REQUIRED_FIELDS = [
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

const CONTRACT_ALLOWED_VALUES = {
  commandType: ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'],
  riskTier: ['LOW', 'MEDIUM'],
  approvalStatus: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED'],
  executionMode: ['DRY_RUN_ONLY'],
  executionStatus: ['NOT_EXECUTED'],
  validationStatus: ['NOT_VALIDATED', 'PASSED', 'FAILED'],
};

const CONTRACT_FORBIDDEN_VALUES = {
  commandType: ['CLICK', 'TYPE', 'SUBMIT', 'TRADE', 'TRANSFER', 'LOGIN', 'UPLOAD', 'DELETE', 'MODIFY', 'EXECUTE'],
  riskTier: ['HIGH', 'CRITICAL'],
  executionMode: ['LIVE', 'PAPER_EXECUTION', 'REAL_EXECUTION'],
  executionStatus: ['EXECUTED', 'PARTIALLY_EXECUTED'],
};

const SAMPLE_VALID_CONTRACT = {
  requestId: 'req-dry-run-gateway-001',
  createdAt: '2026-05-18T10:30:00Z',
  operatorId: 'operator@veridan.com',
  commandType: 'READ',
  targetSystem: 'gateway',
  requestedAction: 'Read health status',
  requestedTarget: '/api/health',
  riskTier: 'LOW',
  approvalStatus: 'PENDING_APPROVAL',
  executionMode: 'DRY_RUN_ONLY',
  executionStatus: 'NOT_EXECUTED',
  validationStatus: 'NOT_VALIDATED',
  denialReason: null,
  auditRequired: true,
};

const VALIDATION_RULES_MATRIX = [
  {
    name: 'Required fields present',
    description: 'All 14 required contract fields must be present',
    passCondition: 'All fields exist and non-null',
    failResult: 'REJECTED_MISSING_FIELD',
  },
  {
    name: 'commandType is allowlisted',
    description: 'commandType must be READ, NAVIGATE, EXTRACT, or VERIFY',
    passCondition: 'commandType ∈ [READ, NAVIGATE, EXTRACT, VERIFY]',
    failResult: 'REJECTED_FORBIDDEN_COMMAND',
  },
  {
    name: 'commandType is not forbidden',
    description: 'commandType must not be CLICK, TYPE, SUBMIT, TRADE, etc.',
    passCondition: 'commandType ∉ forbidden list',
    failResult: 'REJECTED_FORBIDDEN_COMMAND',
  },
  {
    name: 'riskTier is LOW or MEDIUM only',
    description: 'riskTier must be LOW or MEDIUM, never HIGH or CRITICAL',
    passCondition: 'riskTier ∈ [LOW, MEDIUM]',
    failResult: 'REJECTED_HIGH_RISK',
  },
  {
    name: 'approvalStatus is valid',
    description: 'approvalStatus must be DRAFT, PENDING_APPROVAL, APPROVED, or DENIED',
    passCondition: 'approvalStatus ∈ valid enum',
    failResult: 'REJECTED_INVALID_STATUS',
  },
  {
    name: 'executionMode equals DRY_RUN_ONLY',
    description: 'executionMode must be DRY_RUN_ONLY, never LIVE or PAPER_EXECUTION',
    passCondition: 'executionMode === "DRY_RUN_ONLY"',
    failResult: 'REJECTED_EXECUTION_MODE',
  },
  {
    name: 'executionStatus equals NOT_EXECUTED',
    description: 'executionStatus must be NOT_EXECUTED, never EXECUTED or PARTIALLY_EXECUTED',
    passCondition: 'executionStatus === "NOT_EXECUTED"',
    failResult: 'REJECTED_ALREADY_EXECUTED',
  },
  {
    name: 'validationStatus is valid',
    description: 'validationStatus must be NOT_VALIDATED, PASSED, or FAILED',
    passCondition: 'validationStatus ∈ [NOT_VALIDATED, PASSED, FAILED]',
    failResult: 'REJECTED_INVALID_STATUS',
  },
  {
    name: 'auditRequired is true',
    description: 'auditRequired must always be true for dry-run requests',
    passCondition: 'auditRequired === true',
    failResult: 'REJECTED_AUDIT_DISABLED',
  },
  {
    name: 'targetSystem is declared',
    description: 'targetSystem must be specified (gateway, browser, etc.)',
    passCondition: 'targetSystem is non-empty string',
    failResult: 'REJECTED_MISSING_FIELD',
  },
  {
    name: 'requestedAction is plain-language only',
    description: 'requestedAction must be human-readable, no code or commands',
    passCondition: 'requestedAction matches plain-language pattern',
    failResult: 'REJECTED_INVALID_ACTION',
  },
  {
    name: 'requestedTarget is non-sensitive',
    description: 'requestedTarget must not contain /login, /admin, /secret, etc.',
    passCondition: 'requestedTarget ∉ sensitive keywords',
    failResult: 'REJECTED_SENSITIVE_TARGET',
  },
  {
    name: 'denialReason required when FAILED',
    description: 'If validationStatus is FAILED, denialReason must be populated',
    passCondition: 'FAILED → denialReason not null; otherwise optional',
    failResult: 'REJECTED_MISSING_DENIAL_REASON',
  },
  {
    name: 'duplicate requestId blocked',
    description: 'requestId must be unique across all dry-run requests',
    passCondition: 'requestId has never been submitted before',
    failResult: 'REJECTED_DUPLICATE_REQUEST',
  },
  {
    name: 'forbidden keywords blocked',
    description: 'requestedAction and requestedTarget must not contain /execute, /run, /trade, /transfer, etc.',
    passCondition: 'No forbidden keywords detected',
    failResult: 'REJECTED_FORBIDDEN_KEYWORD',
  },
];

const FAIL_RESULT_CODES = [
  'REJECTED_MISSING_FIELD',
  'REJECTED_FORBIDDEN_COMMAND',
  'REJECTED_HIGH_RISK',
  'REJECTED_EXECUTION_MODE',
  'REJECTED_ALREADY_EXECUTED',
  'REJECTED_DUPLICATE_REQUEST',
  'REJECTED_SENSITIVE_TARGET',
  'REJECTED_FORBIDDEN_KEYWORD',
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
      contractRequiredFields: CONTRACT_REQUIRED_FIELDS,
      contractAllowedValues: CONTRACT_ALLOWED_VALUES,
      contractForbiddenValues: CONTRACT_FORBIDDEN_VALUES,
      sampleValidContract: SAMPLE_VALID_CONTRACT,
      validationRulesMatrix: VALIDATION_RULES_MATRIX,
      failResultCodes: FAIL_RESULT_CODES,
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

          {/* Section G: Dry-Run Bridge Contract Preview */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">G. Dry-Run Bridge Contract Preview</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Required Fields */}
              <div>
                <h3 className="text-[10px] font-mono font-semibold text-slate-200 mb-2 uppercase">Required Fields</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {CONTRACT_REQUIRED_FIELDS.map((field) => (
                    <div key={field} className="px-2 py-1 bg-secondary/50 border border-border/30 rounded-sm">
                      <div className="text-[9px] font-mono text-blue-400">{field}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allowed Values */}
              <div>
                <h3 className="text-[10px] font-mono font-semibold text-slate-200 mb-2 uppercase">Allowed Values</h3>
                <div className="space-y-2">
                  {Object.entries(CONTRACT_ALLOWED_VALUES).map(([field, values]) => (
                    <div key={field} className="px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
                      <div className="text-[9px] font-mono font-semibold text-emerald-400 mb-1">{field}</div>
                      <div className="flex flex-wrap gap-1">
                        {values.map((val) => (
                          <span key={val} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[8px] font-mono text-emerald-300">
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forbidden Values */}
              <div>
                <h3 className="text-[10px] font-mono font-semibold text-slate-200 mb-2 uppercase">Forbidden Values</h3>
                <div className="space-y-2">
                  {Object.entries(CONTRACT_FORBIDDEN_VALUES).map(([field, values]) => (
                    <div key={field} className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm">
                      <div className="text-[9px] font-mono font-semibold text-destructive/80 mb-1">{field}</div>
                      <div className="flex flex-wrap gap-1">
                        {values.map((val) => (
                          <span key={val} className="px-2 py-0.5 bg-destructive/10 border border-destructive/30 rounded text-[8px] font-mono text-destructive/70">
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Valid Contract */}
              <div>
                <h3 className="text-[10px] font-mono font-semibold text-slate-200 mb-2 uppercase">Sample Valid Contract</h3>
                <pre className="bg-secondary/50 border border-border/40 px-3 py-2.5 rounded-sm text-[8px] text-blue-400 font-mono overflow-x-auto">
                  {JSON.stringify(SAMPLE_VALID_CONTRACT, null, 2)}
                </pre>
              </div>

              {/* Warning Note */}
              <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 rounded-sm">
                <div className="text-[8px] font-mono font-bold text-amber-400/80 mb-1 uppercase">Preview Only</div>
                <p className="text-[9px] text-slate-300">
                  This is a contract preview only. It does not create, send, validate, approve, or execute bridge requests.
                </p>
              </div>
              </div>
              </div>

              {/* Section H: Dry-Run Bridge Validation Rules Matrix */}
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">H. Dry-Run Bridge Validation Rules Matrix</h2>
              </div>
              <div className="p-4 space-y-4">
              {/* Validation Rules Table */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {VALIDATION_RULES_MATRIX.map((rule, idx) => (
                  <div key={idx} className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="text-[9px] font-mono font-semibold text-slate-100">{idx + 1}. {rule.name}</div>
                        <p className="text-[8px] text-slate-400 mt-0.5">{rule.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="px-2 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
                        <div className="text-[7px] font-mono font-bold text-emerald-400 mb-0.5 uppercase">Pass</div>
                        <div className="text-[8px] font-mono text-slate-300">{rule.passCondition}</div>
                      </div>
                      <div className="px-2 py-1.5 bg-destructive/5 border border-destructive/20 rounded-sm">
                        <div className="text-[7px] font-mono font-bold text-destructive/80 mb-0.5 uppercase">Fail</div>
                        <div className="text-[8px] font-mono text-slate-300">{rule.failResult}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fail Result Codes */}
              <div className="bg-secondary/50 border border-border/40 px-3 py-2.5 rounded-sm">
                <h3 className="text-[9px] font-mono font-semibold text-slate-200 mb-2 uppercase">Fail Result Codes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {FAIL_RESULT_CODES.map((code) => (
                    <div key={code} className="px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-sm">
                      <div className="text-[8px] font-mono text-destructive/80">{code}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning Note */}
              <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 rounded-sm">
                <div className="text-[8px] font-mono font-bold text-amber-400/80 mb-1 uppercase">Documentation Only</div>
                <p className="text-[9px] text-slate-300">
                  This matrix documents future validation logic only. It does not validate, approve, send, or execute requests.
                </p>
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