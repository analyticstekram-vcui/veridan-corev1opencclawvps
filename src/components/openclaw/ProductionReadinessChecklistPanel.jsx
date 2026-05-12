import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, Lock, AlertTriangle } from 'lucide-react';

const CHECKLIST_ITEMS = [
  // Security
  {
    category: 'Security',
    name: 'Cloudflare Access enabled',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'Gateway protected by CF Access',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Cloudflare Access protects all gateway endpoints.',
  },
  {
    category: 'Security',
    name: 'No secrets in frontend code',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'Code audit passed',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'All secrets stored server-side in environment variables.',
  },
  {
    category: 'Security',
    name: 'Role-based access control (RBAC)',
    status: 'PARTIAL',
    priority: 'HIGH',
    evidence: 'Basic admin/user roles exist',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement fine-grained role model (Operator/Governor/Auditor).',
    notes: 'Current roles: admin, user. Need operator-specific roles.',
  },
  {
    category: 'Security',
    name: 'Session timeout policy',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    evidence: 'No timeout enforced',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement 15-minute idle session timeout with re-auth.',
    notes: 'Critical for financial operation security.',
  },

  // Secrets Management
  {
    category: 'Secrets Management',
    name: 'API keys stored server-side only',
    status: 'PARTIAL',
    priority: 'CRITICAL',
    evidence: 'API keys in environment variables',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Audit all backend functions for secret exposure.',
    notes: 'Some keys may be exposed in logs or error messages.',
  },
  {
    category: 'Secrets Management',
    name: 'Broker credentials vaulted',
    status: 'NOT_STARTED',
    priority: 'CRITICAL',
    evidence: 'No vault implemented',
    requiredBefore: ['TRADING', 'PRODUCTION'],
    owner: 'External Provider',
    nextAction: 'Implement broker credential vault with HMAC signing.',
    notes: 'Must use encrypted vault for broker API keys.',
  },
  {
    category: 'Secrets Management',
    name: 'OpenAI API key not rendered in UI',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'API key never sent to frontend',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'All LLM calls made server-side.',
  },
  {
    category: 'Secrets Management',
    name: 'HMAC signing verified for broker requests',
    status: 'PARTIAL',
    priority: 'CRITICAL',
    evidence: 'HMAC adapter exists but not tested',
    requiredBefore: ['TRADING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Test HMAC signing against broker sandbox.',
    notes: 'All broker API requests must be HMAC-signed.',
  },

  // Cloudflare / Access Protection
  {
    category: 'Cloudflare / Access Protection',
    name: 'Cloudflare Access policy configured',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'CF_ACCESS_CLIENT_ID and SECRET set',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Operator',
    nextAction: 'Verified. No action needed.',
    notes: 'All OpenClaw endpoints require CF Access token.',
  },
  {
    category: 'Cloudflare / Access Protection',
    name: 'X-Frame-Options header set to DENY',
    status: 'COMPLETE',
    priority: 'HIGH',
    evidence: 'Gateway enforces X-Frame-Options: DENY',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Prevents clickjacking attacks.',
  },

  // Backend Validation
  {
    category: 'Backend Validation',
    name: 'Safety tests 7/7 passing',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'All simulation scenarios pass',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Governance blocks, risk tiers, and domain allowlists all enforced.',
  },
  {
    category: 'Backend Validation',
    name: 'Read-only bridge passing',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'openclawReadOnlyBridgeStatus functional',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'system.status, logs.fetch, session.list all working.',
  },
  {
    category: 'Backend Validation',
    name: 'Mutation commands blocked',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'Click, type, navigation commands rejected',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'No mutation allowed in SIMULATED mode.',
  },
  {
    category: 'Backend Validation',
    name: 'Live mode disabled by default',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'Execution mode always SIMULATED on startup',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Live execution requires multi-sig approval and kill switch disengagement.',
  },

  // Audit / Logging
  {
    category: 'Audit / Logging',
    name: 'Trace IDs generated for all operations',
    status: 'COMPLETE',
    priority: 'HIGH',
    evidence: 'All commands have auditTraceId',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Trace IDs enable full audit trail reconstruction.',
  },
  {
    category: 'Audit / Logging',
    name: 'Executed command audit view',
    status: 'COMPLETE',
    priority: 'HIGH',
    evidence: 'ExecutedCommandAuditView component deployed',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Operators can review all command history and block reasons.',
  },
  {
    category: 'Audit / Logging',
    name: 'Immutable audit store',
    status: 'PARTIAL',
    priority: 'CRITICAL',
    evidence: 'Audit entries stored but not write-protected',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Add database-level write protection to audit logs.',
    notes: 'Audit logs must be append-only and tamper-evident.',
  },
  {
    category: 'Audit / Logging',
    name: 'Export snapshots to Markdown/JSON',
    status: 'COMPLETE',
    priority: 'MEDIUM',
    evidence: 'SystemSnapshotExportPanel fully functional',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Snapshots auto-redact secrets and mark execution as SIMULATED.',
  },

  // Governance Approval
  {
    category: 'Governance Approval',
    name: 'Manual approval workflow',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'CommandApprovalWorkflowPanel deployed',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'All commands require explicit operator approval before execution.',
  },
  {
    category: 'Governance Approval',
    name: 'Multi-signature approval',
    status: 'NOT_STARTED',
    priority: 'CRITICAL',
    evidence: 'No multi-sig implemented',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement multi-sig requirement for HIGH/CRITICAL risk commands.',
    notes: 'Trading and banking operations require 2+ approvals.',
  },
  {
    category: 'Governance Approval',
    name: 'Risk matrix visible and enforced',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'RiskPermissionMatrixPanel shows 20 actions',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Risk tiers enforced at validation layer.',
  },
  {
    category: 'Governance Approval',
    name: 'Policy registry visible and immutable',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'GovernancePolicyRegistryPanel deployed',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: '9 core policies documented and read-only.',
  },

  // Kill Switch / Emergency Controls
  {
    category: 'Kill Switch / Emergency Controls',
    name: 'Emergency stop UI button',
    status: 'COMPLETE',
    priority: 'CRITICAL',
    evidence: 'Kill Switch button in ExecutionReadinessPanel',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'One-click global execution halt available on main panel.',
  },
  {
    category: 'Kill Switch / Emergency Controls',
    name: 'Backend-enforced kill switch',
    status: 'PARTIAL',
    priority: 'CRITICAL',
    evidence: 'Kill switch gates execution but not fully tested',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Add server-side kill switch flag and test against live endpoint.',
    notes: 'UI kill switch must have backend enforcement.',
  },
  {
    category: 'Kill Switch / Emergency Controls',
    name: 'Kill switch tested against execution endpoint',
    status: 'PARTIAL',
    priority: 'CRITICAL',
    evidence: 'Tested in simulation only',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Test kill switch against live execution adapter.',
    notes: 'Must stop all commands mid-flight if triggered.',
  },

  // Read-Only Bridge
  {
    category: 'Read-Only Bridge',
    name: 'System status read command',
    status: 'COMPLETE',
    priority: 'HIGH',
    evidence: 'system.status endpoint working',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Returns gateway status, version, and health.',
  },
  {
    category: 'Read-Only Bridge',
    name: 'Logs fetch command',
    status: 'COMPLETE',
    priority: 'MEDIUM',
    evidence: 'openclawLiveLogs functional',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Real-time log streaming implemented.',
  },
  {
    category: 'Read-Only Bridge',
    name: 'Session list command',
    status: 'COMPLETE',
    priority: 'MEDIUM',
    evidence: 'Browser sessions can be queried',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Lists active browser automation sessions.',
  },

  // Browser Action Bridge
  {
    category: 'Browser Action Bridge',
    name: 'Browser read actions (read_page_text, read_title)',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    evidence: 'SafeCommandBridge has skeleton',
    requiredBefore: ['BROWSER_ACTIONS', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement read_page_text and read_title CDP commands.',
    notes: 'Read-only browser inspection without DOM mutation.',
  },
  {
    category: 'Browser Action Bridge',
    name: 'Screenshot capture',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    evidence: 'No screenshot implementation',
    requiredBefore: ['BROWSER_ACTIONS', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement screenshot via Chrome DevTools Protocol.',
    notes: 'Must truncate large images for storage.',
  },
  {
    category: 'Browser Action Bridge',
    name: 'Click/type/navigation actions',
    status: 'BLOCKED',
    priority: 'HIGH',
    evidence: 'Mutation commands explicitly forbidden',
    requiredBefore: ['PRODUCTION'],
    owner: 'Governance',
    nextAction: 'Design and approve browser mutation policy before implementing.',
    notes: 'Requires governance board approval and kill switch testing.',
  },
  {
    category: 'Browser Action Bridge',
    name: 'DOM selector validation',
    status: 'PARTIAL',
    priority: 'MEDIUM',
    evidence: 'Basic inspection exists',
    requiredBefore: ['BROWSER_ACTIONS', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Enhance selector validation with CSS/XPath support.',
    notes: 'Must prevent invalid or dangerous selectors.',
  },

  // Trading / Broker Bridge
  {
    category: 'Trading / Broker Bridge',
    name: 'TradingView read-only connector',
    status: 'PARTIAL',
    priority: 'HIGH',
    evidence: 'Connector skeleton exists',
    requiredBefore: ['TRADING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement TradingView API integration (read-only).',
    notes: 'Must support chart context and signal metadata.',
  },
  {
    category: 'Trading / Broker Bridge',
    name: 'Paper trading adapter',
    status: 'NOT_STARTED',
    priority: 'CRITICAL',
    evidence: 'No adapter implemented',
    requiredBefore: ['TRADING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Build paper trading layer before live broker connection.',
    notes: 'All trading must start in paper mode with simulated orders.',
  },
  {
    category: 'Trading / Broker Bridge',
    name: 'Broker credential vault',
    status: 'NOT_STARTED',
    priority: 'CRITICAL',
    evidence: 'No vault implemented',
    requiredBefore: ['TRADING', 'PRODUCTION'],
    owner: 'External Provider',
    nextAction: 'Implement encrypted broker credential vault with HSM.',
    notes: 'Broker keys must never be stored in plaintext.',
  },
  {
    category: 'Trading / Broker Bridge',
    name: 'Live order execution',
    status: 'BLOCKED',
    priority: 'CRITICAL',
    evidence: 'Live trading explicitly forbidden',
    requiredBefore: ['PRODUCTION'],
    owner: 'Governance',
    nextAction: 'Governance board must approve live trading policy.',
    notes: 'Requires paper trading validation, insurance, and daily limits.',
  },

  // Banking / Treasury Bridge
  {
    category: 'Banking / Treasury Bridge',
    name: 'Bank read-only connector',
    status: 'NOT_STARTED',
    priority: 'HIGH',
    evidence: 'No connector implemented',
    requiredBefore: ['BANKING', 'PRODUCTION'],
    owner: 'External Provider',
    nextAction: 'Authorize bank connector (read-only balance queries only).',
    notes: 'Requires bank OAuth approval.',
  },
  {
    category: 'Banking / Treasury Bridge',
    name: 'Payment/transfer execution',
    status: 'BLOCKED',
    priority: 'CRITICAL',
    evidence: 'Transfers explicitly forbidden',
    requiredBefore: ['PRODUCTION'],
    owner: 'Governance',
    nextAction: 'Governance board must design transfer approval policy.',
    notes: 'All transfers require dual-sig and executive approval.',
  },
  {
    category: 'Banking / Treasury Bridge',
    name: 'Treasury approval flow',
    status: 'NOT_STARTED',
    priority: 'CRITICAL',
    evidence: 'No approval workflow',
    requiredBefore: ['BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Build treasury-specific approval gates.',
    notes: 'CFO approval required for transfers > $10k.',
  },

  // Testing / QA
  {
    category: 'Testing / QA',
    name: 'Simulation scenarios (10/10)',
    status: 'COMPLETE',
    priority: 'HIGH',
    evidence: 'SimulationScenarioTesterPanel fully deployed',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'All governance and safety scenarios tested and passing.',
  },
  {
    category: 'Testing / QA',
    name: 'Regression test suite',
    status: 'PARTIAL',
    priority: 'MEDIUM',
    evidence: 'Safety tests exist but not comprehensive',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Expand regression tests to cover all edge cases.',
    notes: 'Must include permission escalation and bypass attempts.',
  },
  {
    category: 'Testing / QA',
    name: 'Error boundary tests',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    evidence: 'No error tests',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Implement error handling and recovery tests.',
    notes: 'System must gracefully handle network failures and timeouts.',
  },
  {
    category: 'Testing / QA',
    name: 'Permission escalation tests',
    status: 'NOT_STARTED',
    priority: 'CRITICAL',
    evidence: 'No escalation tests',
    requiredBefore: ['TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Test for privilege escalation vulnerabilities.',
    notes: 'Verify that users cannot bypass approval gates.',
  },

  // Documentation / Runbooks
  {
    category: 'Documentation / Runbooks',
    name: 'Operator runbook',
    status: 'COMPLETE',
    priority: 'HIGH',
    evidence: 'OperatorRunbookPanel deployed',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'Covers startup, emergencies, and troubleshooting.',
  },
  {
    category: 'Documentation / Runbooks',
    name: 'Snapshot export process',
    status: 'COMPLETE',
    priority: 'MEDIUM',
    evidence: 'SystemSnapshotExportPanel fully functional',
    requiredBefore: ['READ_ONLY', 'BROWSER_ACTIONS', 'TRADING', 'BANKING', 'PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Verified. No action needed.',
    notes: 'JSON/Markdown export with auto-redaction.',
  },
  {
    category: 'Documentation / Runbooks',
    name: 'Obsidian export process',
    status: 'PARTIAL',
    priority: 'LOW',
    evidence: 'Export capability exists',
    requiredBefore: ['PRODUCTION'],
    owner: 'Operator',
    nextAction: 'Document Obsidian vault sync process.',
    notes: 'Optional but recommended for knowledge base.',
  },
  {
    category: 'Documentation / Runbooks',
    name: 'Deployment SOP',
    status: 'PARTIAL',
    priority: 'HIGH',
    evidence: 'Deployment process documented but incomplete',
    requiredBefore: ['PRODUCTION'],
    owner: 'Developer',
    nextAction: 'Finalize deployment SOP with rollback procedures.',
    notes: 'Must include disaster recovery steps.',
  },
];

const STATUS_CONFIG = {
  'COMPLETE': { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'COMPLETE' },
  'PARTIAL': { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'PARTIAL' },
  'NOT_STARTED': { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/5 border-muted/20', label: 'NOT STARTED' },
  'BLOCKED': { icon: Lock, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'BLOCKED' },
};

const PRIORITY_COLORS = {
  'LOW': 'text-blue-400',
  'MEDIUM': 'text-amber-500',
  'HIGH': 'text-orange-500',
  'CRITICAL': 'text-destructive',
};

const FILTER_OPTIONS = ['ALL', 'COMPLETE', 'PARTIAL', 'NOT_STARTED', 'BLOCKED', 'CRITICAL', 'PRODUCTION_REQUIRED'];

function ChecklistItemCard({ item, expanded, onToggle }) {
  const statusCfg = STATUS_CONFIG[item.status];
  const StatusIcon = statusCfg.icon;
  const isProdRequired = item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-2.5 flex items-center justify-between gap-3"
        onClick={() => onToggle(item.name)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground">{item.name}</div>
            <div className="text-[8px] text-muted-foreground/50 mt-0.5">{item.category}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${PRIORITY_COLORS[item.priority]}`}>
            {item.priority}
          </span>
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color}`}>
            {<StatusIcon className="w-3 h-3" />}
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-2.5 space-y-2 text-[9px]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Evidence</div>
              <div className="text-[8px] text-foreground/80">{item.evidence}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Owner</div>
              <div className="text-[8px] text-foreground/80 font-semibold">{item.owner}</div>
            </div>
          </div>

          <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
            <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Required Before</div>
            <div className="flex flex-wrap gap-1">
              {item.requiredBefore.map(req => (
                <span key={req} className={`text-[7px] px-1 py-0.5 border rounded ${isProdRequired ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-primary/30 bg-primary/5 text-primary'}`}>
                  {req}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
            <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Next Action</div>
            <div className="text-[8px] text-foreground/80">{item.nextAction}</div>
          </div>

          {item.notes && (
            <div className="bg-amber-500/5 border border-amber-500/20 px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-amber-500/50 mb-1">Notes</div>
              <div className="text-[8px] text-amber-500/80">{item.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductionReadinessChecklistPanel() {
  const [filter, setFilter] = useState('ALL');
  const [expandedItems, setExpandedItems] = useState({});
  const [legacyCommands, setLegacyCommands] = useState([]);
  const [legacyReviews, setLegacyReviews] = useState([]);

  // Detect legacy REAL/LIVE execution commands and their reviews
  React.useEffect(() => {
    const fetchCommands = async () => {
      try {
        const [commands, reviews] = await Promise.all([
          base44.entities.OpenClawCommand.list('-created_date', 100),
          base44.entities.OpenClawLegacyReview.list('-reviewedAt', 500),
        ]);
        const legacy = commands.filter(c => c.executionMode === 'REAL' || c.executionMode === 'LIVE');
        setLegacyCommands(legacy);
        setLegacyReviews(reviews);
      } catch (e) {
        console.error('Error fetching legacy commands:', e);
      }
    };
    fetchCommands();
  }, []);

  const toggleExpanded = (name) => {
    setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const filtered = CHECKLIST_ITEMS.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETE') return item.status === 'COMPLETE';
    if (filter === 'PARTIAL') return item.status === 'PARTIAL';
    if (filter === 'NOT_STARTED') return item.status === 'NOT_STARTED';
    if (filter === 'BLOCKED') return item.status === 'BLOCKED';
    if (filter === 'CRITICAL') return item.priority === 'CRITICAL';
    if (filter === 'PRODUCTION_REQUIRED') return item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
    return true;
  });

  const summaryStats = {
    total: CHECKLIST_ITEMS.length,
    complete: CHECKLIST_ITEMS.filter(i => i.status === 'COMPLETE').length,
    partial: CHECKLIST_ITEMS.filter(i => i.status === 'PARTIAL').length,
    notStarted: CHECKLIST_ITEMS.filter(i => i.status === 'NOT_STARTED').length,
    blocked: CHECKLIST_ITEMS.filter(i => i.status === 'BLOCKED').length,
    critical: CHECKLIST_ITEMS.filter(i => i.priority === 'CRITICAL').length,
  };

  const readinessPercentage = Math.round(((summaryStats.complete + summaryStats.partial * 0.5) / summaryStats.total) * 100);
  
  let readinessStatus = 'NOT_PRODUCTION_READY';
  if (summaryStats.complete === summaryStats.total) {
    readinessStatus = 'PRODUCTION_READY';
  } else if (summaryStats.blocked === 0 && summaryStats.notStarted === 0 && readinessPercentage >= 80) {
    readinessStatus = 'READ_ONLY_READY';
  } else if (summaryStats.blocked === 0 && readinessPercentage >= 60) {
    readinessStatus = 'BROWSER_ACTIONS_PENDING';
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Production Readiness</div>
          <div className="text-[13px] font-semibold text-foreground">Pre-Production Checklist</div>
        </div>
      </div>

      {/* Legacy REAL/LIVE execution warning — adapts based on review completion */}
      {legacyCommands.length > 0 && (() => {
        const reviewMap = {};
        for (const r of legacyReviews) { if (r.commandId) reviewMap[r.commandId] = r; }
        const unreviewed = legacyCommands.filter(c => !reviewMap[c.id] || reviewMap[c.id].reviewStatus === 'UNREVIEWED').length;
        const reviewed = legacyCommands.length - unreviewed;
        const allReviewed = unreviewed === 0;

        return allReviewed ? (
          <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-[10px] text-primary/80">
              <div className="font-semibold mb-1">✓ LEGACY RECORDS — HISTORICAL AUDIT COMPLETE</div>
              <div className="text-[9px] text-primary/70 mb-1">
                All {legacyCommands.length} legacy REAL/LIVE record{legacyCommands.length !== 1 ? 's' : ''} have been reviewed and classified. Original records are preserved and unmodified.
              </div>
              <div className="text-[9px] text-primary/60">Check Legacy Review tab for classification details. This notice is informational only.</div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-[10px] text-destructive">
              <div className="font-semibold mb-1">⚠️ LEGACY_REAL_EXECUTION_RECORD — REVIEW REQUIRED</div>
              <div className="text-[9px] text-destructive/90 mb-2">
                {legacyCommands.length} command{legacyCommands.length !== 1 ? 's' : ''} with executionMode = REAL or LIVE ·
                <span className="font-semibold"> {unreviewed} unreviewed</span>{reviewed > 0 ? ` · ${reviewed} reviewed` : ''}.
              </div>
              <ul className="text-[9px] space-y-1 text-destructive/80 ml-4 list-disc">
                <li>These records are NOT deleted or hidden</li>
                <li>They will NOT be executed</li>
                <li>Operator review is REQUIRED in the Legacy Review tab before production readiness</li>
              </ul>
            </div>
          </div>
        );
      })()}

      {/* Readiness score */}
      <div className="bg-secondary/20 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-foreground">Readiness Score</div>
            <div className="text-[9px] text-muted-foreground/50 mt-0.5">{readinessPercentage}% complete</div>
          </div>
          <div className="text-right">
            <div className={`text-[13px] font-bold ${readinessStatus === 'PRODUCTION_READY' ? 'text-primary' : readinessStatus === 'READ_ONLY_READY' ? 'text-amber-500' : 'text-destructive'}`}>
              {readinessPercentage}%
            </div>
            <div className={`text-[9px] font-semibold uppercase tracking-wider mt-1 ${readinessStatus === 'PRODUCTION_READY' ? 'text-primary' : readinessStatus === 'READ_ONLY_READY' ? 'text-amber-500' : 'text-destructive'}`}>
              {readinessStatus.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${readinessStatus === 'PRODUCTION_READY' ? 'bg-primary' : readinessStatus === 'READ_ONLY_READY' ? 'bg-amber-500' : 'bg-destructive'}`}
            style={{ width: `${readinessPercentage}%` }}
          />
        </div>

        {/* Warning if not production ready */}
        {readinessStatus !== 'PRODUCTION_READY' && (
          <div className="flex items-start gap-2 text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-500">Not production ready</div>
              <div className="text-amber-500/70 text-[8px] mt-0.5">
                {readinessStatus === 'READ_ONLY_READY' && 'READ_ONLY mode is safe. Trading/banking blocked.'}
                {readinessStatus === 'BROWSER_ACTIONS_PENDING' && 'Complete critical items before enabling mutations.'}
                {readinessStatus === 'NOT_PRODUCTION_READY' && 'Complete checklist items to reach production readiness.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1 text-[8px]">Total</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/60 uppercase tracking-wider mb-1 text-[8px]">Complete</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.complete}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/60 uppercase tracking-wider mb-1 text-[8px]">Partial</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.partial}</div>
        </div>
        <div className="bg-blue-400/5 border border-blue-400/20 px-3 py-2 rounded">
          <div className="text-blue-400/60 uppercase tracking-wider mb-1 text-[8px]">Not Started</div>
          <div className="text-[14px] font-semibold text-blue-400">{summaryStats.notStarted}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/60 uppercase tracking-wider mb-1 text-[8px]">Blocked</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.blocked}</div>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/20 px-3 py-2 rounded">
          <div className="text-orange-500/60 uppercase tracking-wider mb-1 text-[8px]">Critical</div>
          <div className="text-[14px] font-semibold text-orange-500">{summaryStats.critical}</div>
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

      {/* Checklist items */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">No {filter.toLowerCase()} items found</div>
        ) : (
          filtered.map(item => (
            <ChecklistItemCard
              key={item.name}
              item={item}
              expanded={expandedItems[item.name]}
              onToggle={toggleExpanded}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-1">Checklist is read-only. It tracks readiness only.</div>
          <div>It does not enable production execution. READ_ONLY_READY ≠ PRODUCTION_READY. Complete all critical items before live execution.</div>
        </div>
      </div>
    </div>
  );
}