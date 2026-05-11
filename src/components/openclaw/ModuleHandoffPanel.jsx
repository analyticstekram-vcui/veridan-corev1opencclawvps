import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Clock, Lock, AlertTriangle, Zap } from 'lucide-react';

const HANDOFFS = [
  {
    id: 'trading',
    moduleName: 'Trading Module',
    status: 'PLANNED',
    description: 'Provide read-only market context and strategy state to trading operations.',
    allowedData: [
      'Read-only TradingView chart status',
      'Market signal metadata',
      'Strategy execution state',
      'Historical trade context',
      'Risk metrics summaries',
    ],
    blockedData: [
      'Order placement commands',
      'Broker login credentials',
      'Funds transfer authorization',
      'Live trading execution',
      'Leverage or margin adjustments',
    ],
    requiredGovernance: [
      'Paper trading adapter enabled',
      'Global kill switch activation',
      'Per-order execution limits',
      'Broker credential vault with HMAC signing',
      'Immutable audit traces for all orders',
    ],
    requiredConnectors: [
      'TradingView API (read-only)',
      'Broker API adapter (HMAC-gated)',
    ],
    auditRequirements: [
      'All market data fetch events',
      'Strategy state transitions',
      'Order approvals and rejections',
      'Execution results with timestamps',
    ],
    riskNotes: [
      'High risk — financial market exposure',
      'Requires multi-sig approval for live trading',
      'Broker credentials must never be exposed',
      'Rate limiting enforced per strategy',
    ],
    nextStep: 'Implement paper trading adapter and broker credential vault.',
  },
  {
    id: 'credit',
    moduleName: 'Credit Module',
    status: 'READY_FOR_READ_ONLY',
    description: 'Hand off read-only credit task status and monitoring alerts.',
    allowedData: [
      'Credit facility task status',
      'Document checklist completion',
      'Monitoring alert triggers',
      'Dispute workflow stage',
      'Payment schedule summaries',
      'Risk rating updates',
    ],
    blockedData: [
      'Credential capture',
      'Automatic dispute submission',
      'Paid account changes without approval',
      'Unilateral APR adjustments',
      'Borrower data modifications',
    ],
    requiredGovernance: [
      'Credit facility read-only approval',
      'Alert configuration governance',
      'Dispute escalation policies',
    ],
    requiredConnectors: [
      'Credit Facility entity reader',
      'CreditLedgerEvent listener',
    ],
    auditRequirements: [
      'All credit status reads',
      'Alert generation and delivery',
      'Dispute lifecycle events',
    ],
    riskNotes: [
      'Medium risk — financial exposure',
      'Borrower privacy must be protected',
      'Alert floods must be prevented',
    ],
    nextStep: 'Enable read-only credit module handoff. Configure alert policies.',
  },
  {
    id: 'business_formation',
    moduleName: 'Business Formation Module',
    status: 'PLANNED',
    description: 'Hand off checklist status and workflow stage to legal formation tracking.',
    allowedData: [
      'Formation checklist status',
      'Affiliate link activation status',
      'Registered agent workflow stage',
      'Document collection progress',
      'Compliance milestone tracking',
    ],
    blockedData: [
      'Payment submission',
      'Legal filing submission without human approval',
      'Automatic document signing',
      'Credential capture',
      'Unilateral state changes',
    ],
    requiredGovernance: [
      'Formation workflow approval gates',
      'Human-in-the-loop for filings',
      'Document review policies',
    ],
    requiredConnectors: [
      'Formation checklist entity reader',
      'Document management integration (optional)',
    ],
    auditRequirements: [
      'Workflow stage transitions',
      'Document collection milestones',
      'Approval checkpoints',
    ],
    riskNotes: [
      'Legal compliance required',
      'All filings must have human approval',
      'Regulatory deadlines must be tracked',
    ],
    nextStep: 'Design formation workflow governance. Implement milestone tracking.',
  },
  {
    id: 'banking',
    moduleName: 'Banking / Treasury Module',
    status: 'BLOCKED',
    description: 'Banking operations are currently blocked pending bank connector setup.',
    allowedData: [
      'Read-only balance status (after bank connector approval)',
      'Transaction history summaries',
      'Cash flow forecasts',
    ],
    blockedData: [
      'Transfers',
      'Payments',
      'Withdrawals',
      'Wire actions',
      'Credential display',
      'Account changes',
    ],
    requiredGovernance: [
      'Bank connector OAuth authorization',
      'Dual-control signing for transfers',
      'Treasury policy enforcement',
      'Transaction limits per user',
    ],
    requiredConnectors: [
      'Bank API connector (pending authorization)',
    ],
    auditRequirements: [
      'All balance queries',
      'Transfer approvals and rejections',
      'Wire confirmations',
      'Treasury policy violations',
    ],
    riskNotes: [
      'CRITICAL risk — financial institution exposure',
      'Requires bank-grade security',
      'PCI-DSS compliance required',
      'All transfers require executive approval',
    ],
    nextStep: 'Authorize bank connector. Implement dual-control policies.',
  },
  {
    id: 'alerts',
    moduleName: 'Alerts / Notification Module',
    status: 'READY_FOR_READ_ONLY',
    description: 'Send safety warnings and audit notifications to operators.',
    allowedData: [
      'System safety alerts',
      'Audit event notifications',
      'Governance warning messages',
      'Connector health notifications',
      'Rate limit warnings',
    ],
    blockedData: [
      'External spam',
      'Uncontrolled notification floods',
      'User PII in alerts',
      'Secrets in alert body',
      'Unauthenticated push endpoints',
    ],
    requiredGovernance: [
      'Alert rate limiting',
      'Alert severity classification',
      'Notification channel whitelisting',
    ],
    requiredConnectors: [
      'Internal alert service',
    ],
    auditRequirements: [
      'Alert generation logs',
      'Delivery confirmations',
      'Alert suppression events',
    ],
    riskNotes: [
      'Low risk — read-only notifications only',
      'Alert fatigue can mask critical warnings',
      'All alerts must be audited',
    ],
    nextStep: 'Enable alerts. Configure rate limits and channels.',
  },
  {
    id: 'obsidian',
    moduleName: 'Obsidian / Knowledge Base Handoff',
    status: 'READY_FOR_READ_ONLY',
    description: 'Export snapshots and documentation to Obsidian vault.',
    allowedData: [
      'Markdown system snapshots',
      'Runbook procedures and notes',
      'Audit summaries and timelines',
      'Module architecture maps',
      'Policy documentation',
      'Governance decision logs',
    ],
    blockedData: [
      'Raw API keys or secrets',
      'Credentials in any form',
      'Private documents without redaction',
      'Unredacted response payloads',
      'Broker login information',
    ],
    requiredGovernance: [
      'Knowledge base access policies',
      'Redaction verification',
      'Markdown export policies',
    ],
    requiredConnectors: [
      'Obsidian vault sync (optional)',
    ],
    auditRequirements: [
      'Export events and timestamps',
      'Redaction audits',
      'Vault access logs',
    ],
    riskNotes: [
      'Low risk — documentation only',
      'Redaction must be verified',
      'Knowledge base access should be restricted',
    ],
    nextStep: 'Enable Obsidian handoff. Configure redaction policies.',
  },
  {
    id: 'governance',
    moduleName: 'Governance Module',
    status: 'READY_FOR_READ_ONLY',
    description: 'Hand off policy state and approval lifecycle to governance system.',
    allowedData: [
      'Policy registry status',
      'Approval workflow state',
      'Risk assessment results',
      'Command lifecycle events',
      'Policy violation logs',
      'Governance audit traces',
    ],
    blockedData: [
      'Bypassing approval requirements',
      'Auto-approving high-risk actions',
      'Disabling governance checks',
      'Credential elevation',
      'Policy override without audit',
    ],
    requiredGovernance: [
      'Policy immutability enforcement',
      'No-bypass guarantees',
      'Multi-sig policy changes',
      'Audit trail integrity',
    ],
    requiredConnectors: [
      'Policy registry entity reader',
      'Governance event listener',
    ],
    auditRequirements: [
      'All policy changes',
      'Approval decisions',
      'Governance violations',
      'Risk assessments',
    ],
    riskNotes: [
      'Medium risk — governance engine controls all safety',
      'Policy changes must be immutable',
      'No approval shortcuts allowed',
    ],
    nextStep: 'Enable governance handoff. Verify immutability.',
  },
  {
    id: 'audit',
    moduleName: 'Audit Module',
    status: 'READY_FOR_READ_ONLY',
    description: 'Hand off audit traces and command results for compliance.',
    allowedData: [
      'Audit trace IDs and timestamps',
      'Command execution results',
      'Block reason codes',
      'Approval decision logs',
      'Risk tier assessments',
      'Execution mode status',
    ],
    blockedData: [
      'Editing historical records',
      'Deleting audit entries',
      'Retroactive risk downgrades',
      'Credential exposure',
      'Private operator notes',
    ],
    requiredGovernance: [
      'Audit log immutability',
      'Tamper detection',
      'Retention policies',
      'Access controls',
    ],
    requiredConnectors: [
      'Audit log entity reader',
      'Compliance reporting service (optional)',
    ],
    auditRequirements: [
      'Audit log access events',
      'Report generation logs',
      'Compliance submissions',
    ],
    riskNotes: [
      'Low risk — read-only compliance data',
      'Audit logs must be immutable',
      'All audit access must be logged',
      'Retention must meet regulatory requirements',
    ],
    nextStep: 'Enable audit handoff. Configure retention and access policies.',
  },
];

const STATUS_CONFIG = {
  'READY_FOR_READ_ONLY': { label: 'READY', color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
  'PLANNED': { label: 'PLANNED', color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
  'BLOCKED': { label: 'BLOCKED', color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  'NOT_CONNECTED': { label: 'NOT CONNECTED', color: 'text-muted-foreground', bg: 'bg-muted/5 border-muted/20' },
};

const STATUS_ICONS = {
  'READY_FOR_READ_ONLY': <CheckCircle2 className="w-4 h-4" />,
  'PLANNED': <Clock className="w-4 h-4" />,
  'BLOCKED': <Lock className="w-4 h-4" />,
  'NOT_CONNECTED': <AlertTriangle className="w-4 h-4" />,
};

const FILTER_OPTIONS = ['ALL', 'READY_FOR_READ_ONLY', 'PLANNED', 'BLOCKED', 'NOT_CONNECTED'];

function ModuleCard({ handoff, onToggle, expanded }) {
  const cfg = STATUS_CONFIG[handoff.status];

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => onToggle(handoff.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground">{handoff.moduleName}</div>
            <div className="text-[8px] text-muted-foreground/50 mt-0.5 line-clamp-1">{handoff.description}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
            {STATUS_ICONS[handoff.status]}
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-3 space-y-3 text-[10px]">
          {/* Allowed data */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-primary/80 font-semibold mb-1">✓ Allowed Data</div>
            <ul className="space-y-0.5 text-[9px] text-foreground/80">
              {handoff.allowedData.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Blocked data */}
          <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-destructive/80 font-semibold mb-1">✗ Blocked Data</div>
            <ul className="space-y-0.5 text-[9px] text-destructive/80">
              {handoff.blockedData.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-destructive mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Governance required */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-amber-500/80 font-semibold mb-1">Governance Required</div>
            <ul className="space-y-0.5 text-[9px] text-foreground/80">
              {handoff.requiredGovernance.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required connectors */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-blue-400/80 font-semibold mb-1">Required Connectors</div>
            <ul className="space-y-0.5 text-[9px] text-foreground/80">
              {handoff.requiredConnectors.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Audit requirements */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-primary/80 font-semibold mb-1">Audit Requirements</div>
            <ul className="space-y-0.5 text-[9px] text-foreground/80">
              {handoff.auditRequirements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk notes */}
          <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-amber-500/80 font-semibold mb-1">Risk Notes</div>
            <ul className="space-y-0.5 text-[9px] text-amber-500/80">
              {handoff.riskNotes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Zap className="w-2.5 h-2.5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next step */}
          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-primary/80 font-semibold mb-1">Next Implementation Step</div>
            <div className="text-[9px] text-foreground/80">{handoff.nextStep}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModuleHandoffPanel() {
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState({});

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = HANDOFFS.filter(h => {
    if (filter === 'ALL') return true;
    return h.status === filter;
  });

  const summaryStats = {
    total: HANDOFFS.length,
    ready: HANDOFFS.filter(h => h.status === 'READY_FOR_READ_ONLY').length,
    planned: HANDOFFS.filter(h => h.status === 'PLANNED').length,
    blocked: HANDOFFS.filter(h => h.status === 'BLOCKED').length,
    notConnected: HANDOFFS.filter(h => h.status === 'NOT_CONNECTED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Module Handoff Status</div>
          <div className="text-[13px] font-semibold text-foreground">Integration Roadmap · Veridan Core Modules</div>
        </div>
        <span className="text-[9px] text-muted-foreground/30">{filtered.length} of {summaryStats.total} shown</span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1 text-[8px]">Total</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/60 uppercase tracking-wider mb-1 text-[8px]">Ready</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.ready}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/60 uppercase tracking-wider mb-1 text-[8px]">Planned</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.planned}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/60 uppercase tracking-wider mb-1 text-[8px]">Blocked</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.blocked}</div>
        </div>
        <div className="bg-muted/5 border border-muted/20 px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1 text-[8px]">Not Connected</div>
          <div className="text-[14px] font-semibold text-muted-foreground">{summaryStats.notConnected}</div>
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
            {opt.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Handoff cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">No {filter.toLowerCase()} handoffs found</div>
        ) : (
          filtered.map(handoff => (
            <ModuleCard
              key={handoff.id}
              handoff={handoff}
              onToggle={toggleExpanded}
              expanded={expanded[handoff.id]}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-1">Module handoffs describe permitted future integrations only</div>
          <div>They do not activate connectors or enable live execution. All handoffs require explicit approval and governance enforcement.</div>
        </div>
      </div>
    </div>
  );
}