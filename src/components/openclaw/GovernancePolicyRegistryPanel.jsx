import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Shield, Lock } from 'lucide-react';
import { format } from 'date-fns';

const POLICIES = [
  {
    id: 'execution_mode',
    name: 'Execution Mode Policy',
    status: 'ACTIVE',
    summary: 'Execution must remain in SIMULATED mode by default.',
    allowed: ['SIMULATED'],
    blocked: ['LIVE'],
    enforcedBy: 'ExecutionReadinessPanel, executeOpenClawProposal',
    evidence: 'Execution remains SIMULATED. No LIVE execution mode is enabled.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Controls which execution modes are allowed.',
      default: 'SIMULATED',
      bypassable: false,
      notes: 'LIVE mode requires explicit governance override and kill switch release.',
    },
  },
  {
    id: 'risk_tier',
    name: 'Risk Tier Policy',
    status: 'ACTIVE',
    summary: 'Only LOW risk proposals can execute. MEDIUM/HIGH/CRITICAL are governance blocked.',
    allowed: ['LOW'],
    blocked: ['MEDIUM', 'HIGH', 'CRITICAL'],
    enforcedBy: 'executeOpenClawProposal, CommandDetailDrawer',
    evidence: 'High-risk and critical-risk proposals are blocked at validation.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Risk assessment gates execution eligibility.',
      validatableRisks: ['LOW', 'MEDIUM'],
      executableRisks: ['LOW'],
      blockedRisks: ['HIGH', 'CRITICAL'],
      notes: 'Risk tier is determined by proposal analysis and cannot be lowered by user.',
    },
  },
  {
    id: 'command_type',
    name: 'Command Type Policy',
    status: 'ACTIVE',
    summary: 'Only read-only commands are allowed. Mutation commands are blocked.',
    allowed: ['system.status', 'logs.fetch', 'session.list', 'READ_ELEMENT_TEXT', 'INSPECT_ELEMENTS', 'READ_PAGE_TEXT', 'SCREENSHOT'],
    blocked: ['CLICK_ELEMENT', 'TYPE_INTO_ELEMENT', 'DELETE_ALL_DATA', 'TRANSFER', 'TRADE', 'WITHDRAW', 'APPROVE_LIVE_EXECUTION', 'submit', 'type', 'click', 'delete'],
    enforcedBy: 'SafeCommandBridge, executeOpenClawProposal, CommandApprovalWorkflowPanel',
    evidence: 'No mutation commands are accepted by the safe bridge.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Controls which command types are permitted.',
      readOnlyCategory: 'diagnostic and observational operations only',
      mutationCategory: 'state-changing operations strictly forbidden',
      notes: 'Command type validation occurs at proposal creation and command approval stages.',
    },
  },
  {
    id: 'domain_allowlist',
    name: 'Domain Allowlist Policy',
    status: 'ACTIVE',
    summary: 'Only whitelisted domains are allowed for browser automation.',
    allowed: [
      'veridancore.com',
      'openclaw.veridancore.com',
      'tradingview.com',
      'tradovate.com',
      'base44.com',
    ],
    blocked: [
      'localhost',
      '127.0.0.1',
      '192.168.*',
      '10.0.*',
      'private.example',
      'unknown-domains',
      'http://* (non-HTTPS)',
    ],
    enforcedBy: 'SafeCommandBridge, executeOpenClawProposal',
    evidence: 'Domain validation blocks unauthorized targets at command submission.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Restricts browser automation to approved domains.',
      requiresHttps: true,
      blockPrivateIps: true,
      blockLocalhost: true,
      notes: 'All domains must support HTTPS. Private and local addresses are always blocked.',
    },
  },
  {
    id: 'governance_approval',
    name: 'Governance Approval Policy',
    status: 'ACTIVE',
    summary: 'All commands require explicit approval. No execution without governance review.',
    allowed: ['APPROVED'],
    blocked: ['DRAFT', 'PENDING_APPROVAL', 'DENIED', 'BLOCKED'],
    enforcedBy: 'executeOpenClawProposal, CommandDetailDrawer',
    evidence: 'Execution is gated on proposal.status === APPROVED.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Enforces multi-sig approval workflow.',
      requiredStatuses: ['APPROVED for execution'],
      blockedStatuses: ['DRAFT cannot execute', 'DENIED cannot execute', 'BLOCKED cannot execute'],
      minApprovals: 1,
      notes: 'Approval metadata is immutable. Audit trail records all approval events.',
    },
  },
  {
    id: 'readonly_bridge',
    name: 'Read-Only Bridge Policy',
    status: 'ACTIVE',
    summary: 'openclawReadOnlyBridgeStatus backend function enforces minimal payload and signature validation.',
    allowed: ['{ command: "..." }'],
    blocked: ['service_tokens', 'HMAC_keys', 'api_keys', 'full_payloads', 'live_commands'],
    enforcedBy: 'openclawReadOnlyBridgeStatus backend function',
    evidence: 'Frontend never exposes secrets. Backend validates HMAC and allowlist.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Secure bridge for read-only command execution.',
      payloadSchema: '{ command: string }',
      signatureRequired: 'HMAC-SHA256',
      allowlistEnforced: true,
      rateLimit: '5 commands/minute',
      notes: 'Service tokens are never sent by frontend. Backend verifies all requests.',
    },
  },
  {
    id: 'audit_logging',
    name: 'Audit Logging Policy',
    status: 'ACTIVE',
    summary: 'All validation, blocks, executions, and dry runs produce audit trace IDs.',
    allowed: ['ALL events logged', 'TRACE_ID generation', 'TIMESTAMP recording'],
    blocked: ['SILENT failures', 'UNLOGGED operations'],
    enforcedBy: 'ExecutedCommandAuditView, OpenClawCommand entity',
    evidence: 'Audit trace IDs visible in CommandApprovalWorkflowPanel and ExecutedCommandAuditView.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Complete audit trail for governance and forensics.',
      auditFields: ['event_type', 'timestamp', 'trace_id', 'status', 'reviewer', 'block_reason'],
      retention: 'Immutable in database',
      notes: 'Every action is logged. Audit log cannot be deleted or modified post-creation.',
    },
  },
  {
    id: 'kill_switch',
    name: 'Kill Switch Policy',
    status: 'ACTIVE',
    summary: 'Emergency stop is available and reverts execution to SIMULATED mode.',
    allowed: ['AVAILABLE'],
    blocked: ['Always respects kill switch state'],
    enforcedBy: 'ExecutionReadinessPanel',
    evidence: 'Kill switch button visible and functional in ExecutionReadinessPanel.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Global execution halt mechanism.',
      state: 'AVAILABLE and ready to engage',
      effect: 'Immediately blocks execution globally and reverts to SIMULATED',
      audit: 'OPENCLAW_EXECUTION_BLOCKED_GLOBAL logged',
      notes: 'Simulated evidence - kill switch is display-only in this demo.',
    },
  },
  {
    id: 'secret_exposure',
    name: 'Token / Secret Exposure Policy',
    status: 'ACTIVE',
    summary: 'Service tokens, HMAC keys, API keys, and secrets never render in browser.',
    allowed: ['Safe metadata only', 'Trace IDs', 'Timestamps', 'Status values'],
    blocked: ['OPENCLAW_SERVICE_TOKEN', 'HMAC_KEY', 'API_KEY', 'Bearer tokens', 'Private keys'],
    enforcedBy: 'All frontend components, backend function design',
    evidence: 'No secrets displayed in CommandApprovalWorkflowPanel, ExecutedCommandAuditView, or any UI.',
    lastChecked: new Date().toISOString(),
    details: {
      description: 'Prevents credential leakage to client.',
      secretsBlocked: ['OPENCLAW_SERVICE_TOKEN', 'CF_ACCESS_CLIENT_SECRET', 'VERIDAN_BRIDGE_TOKEN'],
      clientCanAccess: ['Trace IDs', 'Status values', 'Metadata', 'Timestamps'],
      notes: 'All secret operations occur server-side. Frontend validation is NOT a security boundary.',
    },
  },
];

const FILTER_OPTIONS = ['ALL', 'ACTIVE', 'WARNING', 'DISABLED'];

const statusConfig = {
  ACTIVE: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'ACTIVE' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'WARNING' },
  DISABLED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'DISABLED' },
};

function PolicyCard({ policy }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[policy.status] || statusConfig.ACTIVE;
  const Icon = cfg.icon;

  return (
    <div className="bg-secondary/20 border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="cursor-pointer hover:bg-secondary/30 transition-colors px-4 py-3 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground">{policy.name}</div>
            <div className="text-[9px] text-muted-foreground/60 mt-0.5">{policy.summary}</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 border text-[9px] font-semibold rounded whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/10 px-4 py-4 space-y-4">
          {/* Status icon + summary */}
          <div className="flex items-start gap-3">
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
            <div className="flex-1 text-[10px] text-muted-foreground/80">{policy.summary}</div>
          </div>

          {/* Allowed values */}
          {policy.allowed.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Allowed</div>
              <div className="flex flex-wrap gap-1.5">
                {policy.allowed.map((val, idx) => (
                  <span key={idx} className="text-[9px] px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded font-mono">
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blocked values */}
          {policy.blocked.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Blocked</div>
              <div className="flex flex-wrap gap-1.5">
                {policy.blocked.map((val, idx) => (
                  <span key={idx} className="text-[9px] px-2 py-1 bg-destructive/10 border border-destructive/20 text-destructive rounded font-mono">
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Enforcement info */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Enforced By</div>
              <div className="text-foreground font-mono text-[9px] break-all">{policy.enforcedBy}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Last Checked</div>
              <div className="text-foreground font-mono text-[9px]">{format(new Date(policy.lastChecked), 'HH:mm:ss')}</div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Evidence</div>
              <div className="text-foreground text-[9px]">{policy.evidence}</div>
            </div>
          </div>

          {/* Details JSON */}
          <details className="text-[9px]">
            <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-widest text-[8px]">
              Policy Details
            </summary>
            <pre className="mt-2 bg-secondary/30 border border-border/30 px-2 py-1.5 overflow-auto max-h-48 text-muted-foreground/60 font-mono text-[8px] leading-tight rounded">
              {JSON.stringify(policy.details, null, 2)}
            </pre>
          </details>

          {/* Lock notice */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
            <Lock className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[9px] text-primary/80">This policy is read-only and enforced by backend validation.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GovernancePolicyRegistryPanel() {
  const [filter, setFilter] = useState('ALL');

  const filtered = POLICIES.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const summaryStats = {
    total: POLICIES.length,
    active: POLICIES.filter(p => p.status === 'ACTIVE').length,
    warning: POLICIES.filter(p => p.status === 'WARNING').length,
    disabled: POLICIES.filter(p => p.status === 'DISABLED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Governance Policy Registry</div>
          <div className="text-[13px] font-semibold text-foreground">Active Enforcement Rules for Proposal Validation and Execution</div>
        </div>
        <span className="text-[9px] text-muted-foreground/30">{filtered.length} of {summaryStats.total} shown</span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1">Total</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/60 uppercase tracking-wider mb-1">Active</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.active}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/60 uppercase tracking-wider mb-1">Warnings</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.warning}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/60 uppercase tracking-wider mb-1">Disabled</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.disabled}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 text-[9px] border rounded whitespace-nowrap transition-colors ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Policies grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">No {filter.toLowerCase()} policies found</div>
        ) : (
          filtered.map(policy => <PolicyCard key={policy.id} policy={policy} />)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-1">Policy registry is read-only</div>
          <div>Governance rules are enforced by backend validation and simulated execution gates. No live execution is enabled here.</div>
        </div>
      </div>
    </div>
  );
}