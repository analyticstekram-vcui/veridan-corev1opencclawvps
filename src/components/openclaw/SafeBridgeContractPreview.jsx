import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight, Shield, Lock } from 'lucide-react';

const REQUEST_SCHEMA = {
  requestId: { type: 'string', description: 'Unique bridge request identifier', required: true },
  proposalId: { type: 'string', description: 'Reference to OpenClawProposal ID', required: true },
  bundleHash: { type: 'string', description: 'SHA-256 hash of proposal bundle', required: true },
  commandType: { type: 'string', description: 'Browser command type', required: true },
  targetUrl: { type: 'string', description: 'HTTPS target URL only', required: true },
  selector: { type: 'string', description: 'CSS selector for target element', required: false },
  inputText: { type: 'string', description: 'Text input for TYPE commands', required: false },
  reason: { type: 'string', description: 'Justification for command', required: true },
  riskTier: { type: 'string', description: 'LOW, MEDIUM, HIGH, CRITICAL', required: true },
  approvalStatus: { type: 'string', description: 'Must be APPROVED', required: true },
  validationResult: { type: 'string', description: 'Must be PASS', required: true },
  executionEligibility: { type: 'string', description: 'Must be ELIGIBLE_PREVIEW', required: true },
  proposedBy: { type: 'string', description: 'Email of proposer', required: true },
  approvedBy: { type: 'string', description: 'Email of approver', required: true },
  proposedAt: { type: 'ISO-8601', description: 'Proposal creation timestamp', required: true },
  approvedAt: { type: 'ISO-8601', description: 'Approval timestamp', required: true },
  expirationAt: { type: 'ISO-8601', description: 'Approval expiration timestamp', required: true },
  governanceMode: { type: 'string', description: 'Must be SAFE_REQUIRES_APPROVAL', required: true },
  dryRun: { type: 'boolean', description: 'Must be true (no live execution)', required: true },
  liveExecution: { type: 'boolean', description: 'Must be false', required: true },
};

const RESPONSE_SCHEMA = {
  requestId: { type: 'string', description: 'Echo of request ID' },
  accepted: { type: 'boolean', description: 'Request accepted by bridge' },
  rejectedReason: { type: 'string', description: 'Reason if rejected' },
  bridgeMode: { type: 'string', description: 'SAFE_PREVIEW or SAFE_READ_ONLY' },
  executionStatus: { type: 'string', description: 'PENDING, RUNNING, COMPLETED, FAILED' },
  dryRun: { type: 'boolean', description: 'Echoes request dryRun value' },
  auditId: { type: 'string', description: 'Audit trail identifier' },
  receivedAt: { type: 'ISO-8601', description: 'Bridge receipt timestamp' },
  processedAt: { type: 'ISO-8601', description: 'Processing completion timestamp' },
  resultSummary: { type: 'string', description: 'Safe summary of execution result' },
};

const VALIDATION_RULES = [
  { field: 'requestId', rule: 'Required, non-empty UUID' },
  { field: 'proposalId', rule: 'Required, must exist in OpenClawProposal' },
  { field: 'bundleHash', rule: 'Required, valid SHA-256 hex string' },
  { field: 'commandType', rule: 'Required, must be READ, NAVIGATE, EXTRACT, or VERIFY' },
  { field: 'targetUrl', rule: 'Required, must start with https://', critical: true },
  { field: 'approvalStatus', rule: 'Required, must equal APPROVED', critical: true },
  { field: 'validationResult', rule: 'Required, must equal PASS', critical: true },
  { field: 'executionEligibility', rule: 'Required, must equal ELIGIBLE_PREVIEW', critical: true },
  { field: 'governanceMode', rule: 'Required, must equal SAFE_REQUIRES_APPROVAL', critical: true },
  { field: 'dryRun', rule: 'Required, must be true (no live execution)', critical: true },
  { field: 'liveExecution', rule: 'Required, must be false (no live execution)', critical: true },
  { field: 'expirationAt', rule: 'Required, must be in future (not expired)', critical: true },
];

const EXAMPLE_VALID_REQUEST = {
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  proposalId: '1715592000001',
  bundleHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f',
  commandType: 'READ',
  targetUrl: 'https://tradingview.com/chart',
  selector: '.title-text',
  inputText: null,
  reason: 'Read current page title to verify navigation',
  riskTier: 'LOW',
  approvalStatus: 'APPROVED',
  validationResult: 'PASS',
  executionEligibility: 'ELIGIBLE_PREVIEW',
  proposedBy: 'operator@veridancore.com',
  approvedBy: 'admin@veridancore.com',
  proposedAt: '2026-05-13T10:30:00Z',
  approvedAt: '2026-05-13T10:35:00Z',
  expirationAt: '2026-05-14T10:35:00Z',
  governanceMode: 'SAFE_REQUIRES_APPROVAL',
  dryRun: true,
  liveExecution: false,
};

const EXAMPLE_REJECTED_RESPONSE = {
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  accepted: false,
  rejectedReason: 'Validation failed: executionEligibility must be ELIGIBLE_PREVIEW, got REVIEW_REQUIRED',
  bridgeMode: null,
  executionStatus: null,
  dryRun: true,
  auditId: null,
  receivedAt: '2026-05-13T10:36:00Z',
  processedAt: '2026-05-13T10:36:01Z',
  resultSummary: 'Request rejected at validation gate. See rejectedReason for details.',
};

function SchemaTable({ schema, title }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">{title}</div>
      <div className="border border-border/50 rounded overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead className="border-b border-border/30 bg-secondary/10">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Field</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Description</th>
              {title.includes('Request') && <th className="text-center px-3 py-2 font-semibold text-foreground">Required</th>}
            </tr>
          </thead>
          <tbody>
            {Object.entries(schema).map(([field, info]) => (
              <tr key={field} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                <td className="px-3 py-2 font-mono text-foreground">{field}</td>
                <td className="px-3 py-2 text-slate-400">{info.type}</td>
                <td className="px-3 py-2 text-slate-400">{info.description}</td>
                {title.includes('Request') && (
                  <td className="px-3 py-2 text-center">
                    {info.required ? (
                      <CheckCircle2 className="w-3 h-3 text-primary mx-auto" />
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidationRule({ rule }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2 border rounded text-[9px] ${
      rule.critical ? 'bg-destructive/5 border-destructive/20' : 'bg-card/50 border-border/30'
    }`}>
      <div className={`shrink-0 mt-0.5 ${rule.critical ? 'text-destructive' : 'text-primary'}`}>
        {rule.critical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      </div>
      <div className="flex-1">
        <span className={`font-semibold ${rule.critical ? 'text-destructive' : 'text-primary'}`}>{rule.field}:</span>
        <span className="text-slate-400 ml-2">{rule.rule}</span>
      </div>
    </div>
  );
}

function JSONExample({ title, data, rejected = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded bg-card/30 overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <div className="flex items-center gap-2">
            {rejected ? (
              <XCircle className="w-3.5 h-3.5 text-destructive" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="text-[10px] font-semibold text-foreground">{title}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/50 px-4 py-3">
          <pre className="text-[8px] font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SafeBridgeContractPreview() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Future Integration</div>
          <div className="text-[13px] font-semibold text-foreground">Safe Bridge Contract Preview</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-500/80">
          <div className="font-semibold mb-0.5">This is a contract preview only.</div>
          <div className="text-[9px] text-amber-500/70">It does not call OpenClaw or execute actions. This defines the future request/response interface for the Safe Bridge when backend integration is enabled.</div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-1">Safe Bridge Contract</div>
          <div className="text-[9px] text-primary/70 space-y-0.5">
            <p>The Safe Bridge will accept approved, eligible proposals and execute them in SAFE_PREVIEW mode only.</p>
            <p className="mt-1">All requests are validated against the contract rules below. Violations trigger immediate rejection.</p>
            <p className="mt-1">Live execution is permanently disabled—dryRun=true and liveExecution=false are enforced.</p>
          </div>
        </div>
      </div>

      {/* Request Schema */}
      <SchemaTable schema={REQUEST_SCHEMA} title="Request Schema" />

      {/* Response Schema */}
      <SchemaTable schema={RESPONSE_SCHEMA} title="Response Schema" />

      {/* Validation Rules */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Contract Validation Rules</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {VALIDATION_RULES.map((rule, idx) => (
            <ValidationRule key={idx} rule={rule} />
          ))}
        </div>
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Request/Response Examples</div>
        <div className="space-y-2">
          <JSONExample title="✓ Valid Request (ELIGIBLE_PREVIEW)" data={EXAMPLE_VALID_REQUEST} />
          <JSONExample title="✗ Rejected Response (Validation Failed)" data={EXAMPLE_REJECTED_RESPONSE} rejected />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Gateway Mode</div>
          <div className="text-foreground font-semibold">SAFE_PREVIEW</div>
        </div>
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Dry Run</div>
          <div className="text-foreground font-semibold">true (always)</div>
        </div>
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Live Execution</div>
          <div className="text-destructive font-semibold">false (blocked)</div>
        </div>
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Allowed Commands</div>
          <div className="text-foreground font-semibold">READ, NAVIGATE, EXTRACT, VERIFY</div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <Lock className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Contract is locked and read-only.</div>
          <div className="text-[8px] text-slate-400">All fields, validation rules, and examples are hardcoded governance definitions. Future backend bridge will use this exact contract for request validation and response formatting.</div>
        </div>
      </div>
    </div>
  );
}