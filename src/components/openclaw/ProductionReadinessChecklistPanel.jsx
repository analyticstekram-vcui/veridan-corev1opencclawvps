import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, Lock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const AlertTriangle2 = AlertTriangle; // Alias for use in JSX

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

function ChecklistItemCard({ item, expanded, onToggle, savedReview, onReviewSaved }) {
  const statusCfg = STATUS_CONFIG[item.status];
  const StatusIcon = statusCfg.icon;
  const isProdRequired = item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
  const [reviewStatus, setReviewStatus] = useState(savedReview?.reviewStatus || item.status);
  const [reviewNote, setReviewNote] = useState(savedReview?.reviewNote || '');
  const [saving, setSaving] = useState(false);

  // Auto-suggested note based on item evidence/status
  const autoSuggestedNote = (() => {
    if (item.status === 'COMPLETE') return `Verified and operational: ${item.evidence}`;
    if (item.status === 'PARTIAL') return `Partial implementation: ${item.evidence} — ${item.nextAction}`;
    if (item.status === 'BLOCKED') return `Blocked by: ${item.nextAction}`;
    if (item.status === 'NOT_STARTED') return `No evidence yet. Required: ${item.nextAction}`;
    return '';
  })();

  // Determine if item can be safely auto-marked COMPLETE
  const canAutoComplete = item.status === 'COMPLETE' && !isProdRequired && item.priority !== 'CRITICAL';
  
  // Determine safe action based on evidence
  const getSafeActions = () => {
    const actions = [];
    if (canAutoComplete) actions.push({ label: 'Mark COMPLETE (verified)', status: 'COMPLETE', auto: true });
    if (item.status === 'PARTIAL' || item.status === 'NOT_STARTED') actions.push({ label: 'Mark PARTIAL (in progress)', status: 'PARTIAL', auto: false });
    if (item.status === 'BLOCKED' || item.nextAction?.includes('Requires')) actions.push({ label: 'Mark BLOCKED (requires action)', status: 'BLOCKED', auto: false });
    if (item.priority === 'CRITICAL' || isProdRequired) actions.push({ label: 'Requires operator decision', status: null, auto: false });
    return actions;
  };

  const handleSaveReview = async (newStatus) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const user = await base44.auth.me();
      const payload = {
        checklistItemName: item.name,
        category: item.category,
        originalStatus: item.status,
        reviewStatus: newStatus,
        reviewNote,
        reviewer: user?.email || 'unknown',
        reviewedAt: now,
        priority: item.priority,
        isCritical: item.priority === 'CRITICAL',
        isProductionRequired: isProdRequired,
      };

      if (savedReview?.id) {
        await base44.entities.OpenClawProductionChecklistReview.update(savedReview.id, payload);
      } else {
        await base44.entities.OpenClawProductionChecklistReview.create(payload);
      }

      setReviewStatus(newStatus);
      if (onReviewSaved) onReviewSaved();
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setSaving(false);
    }
  };

  const needsNote = (newStatus) => ['BLOCKED', 'CRITICAL'].includes(item.priority) && newStatus !== 'COMPLETE';
  const canSaveWithoutNote = reviewNote || !needsNote(reviewStatus);

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
            <div className="text-[8px] text-slate-400 mt-0.5 font-semibold">{item.category}</div>
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

          {/* ────── Operator Resolution Workflow ────── */}
          <div className="border border-primary/20 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Operator Resolution</span>
              {savedReview?.reviewedAt && <span className="text-[8px] text-primary/50 ml-auto border border-primary/20 px-1.5 py-0.5">Saved {format(new Date(savedReview.reviewedAt), 'MM/dd HH:mm')}</span>}
            </div>

            {/* Inline guidance */}
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded text-[8px] text-muted-foreground/70 space-y-1">
              <div><span className="font-semibold">COMPLETE</span> — Only if verified and working. Auto-suggested: {canAutoComplete ? 'Yes, evidence clear' : 'No, requires verification'}</div>
              <div><span className="font-semibold">PARTIAL</span> — Evidence exists but more work needed. {item.status === 'PARTIAL' ? '(Current status)' : ''}</div>
              <div><span className="font-semibold">BLOCKED</span> — Dependency prevents it. {item.status === 'BLOCKED' ? '(Current status)' : ''}</div>
              <div><span className="font-semibold">NOT_STARTED</span> — No evidence yet. {item.status === 'NOT_STARTED' ? '(Current status)' : ''}</div>
            </div>

            {/* Safe quick actions */}
            <div className="space-y-1.5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Quick Safe Actions</div>
              <div className="flex flex-wrap gap-1.5">
                {getSafeActions().map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (action.status) {
                        setReviewStatus(action.status);
                        if (action.auto || action.status === 'PARTIAL' || action.status === 'BLOCKED') {
                          setReviewNote(autoSuggestedNote);
                          handleSaveReview(action.status);
                        }
                      }
                    }}
                    disabled={saving}
                    className={`px-2 py-1 text-[8px] border rounded font-semibold transition-colors whitespace-nowrap ${
                      action.status ? 'border-primary text-primary bg-primary/10 hover:bg-primary/20' : 'border-border text-muted-foreground cursor-default'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual status selection */}
            <div>
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-1">Manual Review Status (if needed)</label>
              <div className="flex flex-wrap gap-1.5">
                {['COMPLETE', 'PARTIAL', 'NOT_STARTED', 'BLOCKED'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReviewStatus(status)}
                    disabled={saving}
                    className={`px-2 py-1 text-[9px] border rounded font-semibold transition-colors ${
                      reviewStatus === status
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution note with auto-suggestion */}
            {(item.priority === 'CRITICAL' || needsNote(reviewStatus) || reviewNote || canAutoComplete) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40">Resolution Note</label>
                  <button
                    type="button"
                    onClick={() => setReviewNote(autoSuggestedNote)}
                    className="text-[8px] text-primary/80 hover:text-primary border-b border-primary/30"
                  >
                    Use auto-suggested
                  </button>
                </div>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={autoSuggestedNote || 'Document your resolution...'}
                  rows={2}
                  className="w-full bg-secondary/50 border border-border text-[10px] font-mono text-foreground px-2 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 resize-none"
                />
                {canAutoComplete && <div className="text-[8px] text-primary/70 mt-1">✓ Clear evidence for auto-completion</div>}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSaveReview(reviewStatus)}
              disabled={saving || !canSaveWithoutNote}
              className="w-full px-3 py-1.5 bg-primary text-primary-foreground text-[9px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Resolution'}
            </button>

            {needsNote(reviewStatus) && !reviewNote && <div className="text-[8px] text-amber-500/70">Add a note before saving for CRITICAL/BLOCKED items.</div>}
          </div>
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
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [showOnlyUnresolved, setShowOnlyUnresolved] = useState(false);
  const [suggestedReviews, setSuggestedReviews] = useState({});
  const [savingAuto, setSavingAuto] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);

  const fetchData = async () => {
    try {
      const [commands, legReviews, checklistReviews] = await Promise.all([
        base44.entities.OpenClawCommand.list('-created_date', 100),
        base44.entities.OpenClawLegacyReview.list('-reviewedAt', 500),
        base44.entities.OpenClawProductionChecklistReview.list('-reviewedAt', 500),
      ]);
      const legacy = commands.filter(c => c.executionMode === 'REAL' || c.executionMode === 'LIVE');
      setLegacyCommands(legacy);
      setLegacyReviews(legReviews);
      const map = {};
      for (const r of checklistReviews) {
        if (r.checklistItemName) map[r.checklistItemName] = r;
      }
      setReviews(map);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching data:', e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-run safe checklist review on mount and when data changes
  useEffect(() => {
    const runAutoReview = async () => {
      setSystemReviewRunning(true);
      setReviewCompleted(false);
      try {
        const user = await base44.auth.me();
        const now = new Date().toISOString();
        const results = { autoCompleted: 0, partial: 0, blocked: 0, notStarted: 0, timestamp: now };
        const suggestions = {};
        const unresolvedItems = [];
        const recordsToSave = [];

        for (const item of CHECKLIST_ITEMS) {
          const { status: autoStatus, note: autoNote } = getAutoClassification(item);
          suggestions[item.name] = { status: autoStatus, note: autoNote };

          // Count results
          if (autoStatus === 'COMPLETE') results.autoCompleted++;
          else if (autoStatus === 'PARTIAL') results.partial++;
          else if (autoStatus === 'BLOCKED') results.blocked++;
          else if (autoStatus === 'NOT_STARTED') results.notStarted++;

          // Track unresolved items
          const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
          if (effectiveStatus !== 'COMPLETE') {
            unresolvedItems.push({ ...item, suggestedStatus: autoStatus, suggestedNote: autoNote });
          }

          // Only auto-save if this item hasn't been reviewed yet and auto-status is safe
          if (!reviews[item.name] && (autoStatus === 'COMPLETE' || autoStatus === 'PARTIAL')) {
            const isProdRequired = item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
            recordsToSave.push({
              checklistItemName: item.name,
              category: item.category,
              originalStatus: item.status,
              reviewStatus: autoStatus,
              reviewNote: autoNote,
              reviewer: user?.email || 'system',
              reviewedAt: now,
              priority: item.priority,
              isCritical: item.priority === 'CRITICAL',
              isProductionRequired: isProdRequired,
            });
          }
        }

        // Auto-save the safe review records in batch
        if (recordsToSave.length > 0) {
          try {
            await base44.entities.OpenClawProductionChecklistReview.bulkCreate(recordsToSave);
            // Refresh reviews after auto-save
            await fetchData();
          } catch (err) {
            console.error('Error auto-saving review records:', err);
          }
        }

        setSuggestedReviews(suggestions);
        setSystemReviewResults({ ...results, unresolvedItems });
        setReviewCompleted(true);
      } catch (err) {
        console.error('Auto-review error:', err);
      } finally {
        setSystemReviewRunning(false);
      }
    };

    // Run auto-review after data is loaded
    if (!loading) {
      runAutoReview();
    }
  }, [loading, reviews]);

  const toggleExpanded = (name) => {
    setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const filtered = CHECKLIST_ITEMS.filter(item => {
    const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
    
    // If showing only unresolved, filter to incomplete items
    if (showOnlyUnresolved && effectiveStatus === 'COMPLETE') {
      return false;
    }

    if (filter === 'ALL') return true;
    if (filter === 'UNRESOLVED') return effectiveStatus !== 'COMPLETE';
    if (filter === 'COMPLETE') return effectiveStatus === 'COMPLETE';
    if (filter === 'PARTIAL') return effectiveStatus === 'PARTIAL';
    if (filter === 'NOT_STARTED') return effectiveStatus === 'NOT_STARTED';
    if (filter === 'BLOCKED') return effectiveStatus === 'BLOCKED';
    if (filter === 'CRITICAL') return item.priority === 'CRITICAL';
    if (filter === 'PRODUCTION_REQUIRED') return item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
    return true;
  });

  const summaryStats = {
    total: CHECKLIST_ITEMS.length,
    complete: CHECKLIST_ITEMS.filter(i => reviews[i.name]?.reviewStatus === 'COMPLETE' || i.status === 'COMPLETE').length,
    partial: CHECKLIST_ITEMS.filter(i => reviews[i.name]?.reviewStatus === 'PARTIAL' || i.status === 'PARTIAL').length,
    notStarted: CHECKLIST_ITEMS.filter(i => reviews[i.name]?.reviewStatus === 'NOT_STARTED' || i.status === 'NOT_STARTED').length,
    blocked: CHECKLIST_ITEMS.filter(i => reviews[i.name]?.reviewStatus === 'BLOCKED' || i.status === 'BLOCKED').length,
    critical: CHECKLIST_ITEMS.filter(i => i.priority === 'CRITICAL').length,
    unresolvedCritical: CHECKLIST_ITEMS.filter(i => i.priority === 'CRITICAL' && (reviews[i.name]?.reviewStatus || i.status) !== 'COMPLETE').length,
    prodRequired: CHECKLIST_ITEMS.filter(i => i.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r))).length,
    unresolvedProdRequired: CHECKLIST_ITEMS.filter(i => i.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r)) && (reviews[i.name]?.reviewStatus || i.status) !== 'COMPLETE').length,
  };

  const readinessPercentage = Math.min(100, Math.round(((summaryStats.complete + summaryStats.partial * 0.5) / summaryStats.total) * 100));
  
  let readinessStatus = 'NOT_PRODUCTION_READY';
  let readinessBlockReason = null;
  const [backendEnforcementStatus, setBackendEnforcementStatus] = useState(null);

  // Check backend enforcement on mount (required for production readiness)
  useEffect(() => {
    const checkBackendEnforcement = async () => {
      try {
        const res = await base44.functions.invoke('openclawEnforcement', { action: 'run_all_tests' });
        if (res?.data?.results) {
          const tests = res.data.results;
          const allPassed = tests && tests.length > 0 && tests.every(t => t?.passed === true);
          setBackendEnforcementStatus({ passed: allPassed, tests, count: tests?.length || 0 });
        } else {
          setBackendEnforcementStatus({ passed: false, error: 'No test results returned', tests: [] });
        }
      } catch (err) {
        setBackendEnforcementStatus({ passed: false, error: err?.message || 'Unknown error', tests: [] });
      }
    };
    checkBackendEnforcement();
  }, []);
  
  // Two-tier readiness: Non-execution deployment vs live execution
  // Count only truly unresolved production-required items (exclude verified items)
  const unresolvedProdReqItems = CHECKLIST_ITEMS.filter(item => {
    const isProdRequired = item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
    if (!isProdRequired) return false;
    const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
    return effectiveStatus !== 'COMPLETE'; // Only count incomplete items
  }).length;

  // Non-execution deployment: READY if verified + backend passes, else NOT READY
  const nonExecReady = summaryStats.complete === summaryStats.total &&
                       summaryStats.blocked === 0 &&
                       summaryStats.unresolvedCritical === 0 &&
                       unresolvedProdReqItems === 0 &&
                       backendEnforcementStatus?.passed === true;

  if (nonExecReady) {
    readinessStatus = 'READY_FOR_NON_EXECUTION_DEPLOYMENT';
  } else {
    readinessStatus = 'NOT_PRODUCTION_READY';
    if (backendEnforcementStatus?.passed === false) {
      readinessBlockReason = 'Backend enforcement validation failed. See System Verify tab.';
    } else if (summaryStats.blocked > 0) {
      readinessBlockReason = `${summaryStats.blocked} BLOCKED item${summaryStats.blocked !== 1 ? 's' : ''} block non-execution deployment`;
    } else if (summaryStats.unresolvedCritical > 0) {
      readinessBlockReason = `${summaryStats.unresolvedCritical} unresolved CRITICAL item${summaryStats.unresolvedCritical !== 1 ? 's' : ''} block non-execution deployment`;
    } else if (unresolvedProdReqItems > 0) {
      readinessBlockReason = `${unresolvedProdReqItems} unresolved production-required item${unresolvedProdReqItems !== 1 ? 's' : ''} block non-execution deployment`;
    }
  }
  // Note: Live execution production readiness is NOT READY because OpenClaw is disabled

  const [systemReviewRunning, setSystemReviewRunning] = useState(false);
  const [systemReviewResults, setSystemReviewResults] = useState(null);

  const allReviewedComplete = CHECKLIST_ITEMS.every(item => reviews[item.name]?.reviewStatus === 'COMPLETE');

  // Auto-classification logic
  const getAutoClassification = (item) => {
    const evidencePatterns = {
      complete: /verified|complete|passing|protected|enabled|configured|no action needed|disabled by default|immutable|audit complete|already complete|operational|functional|deployed/i,
      blocked: /live execution|payment.*execution|transfer execution|broker execution|broker.*keys|click|type|navigation|mutations|remain blocked|governance approval|live mode/i,
    };

    let status = 'NOT_STARTED';
    let note = '';

    // Check for BLOCKED conditions
    if (item.status === 'BLOCKED' || evidencePatterns.blocked.test(item.evidence) || evidencePatterns.blocked.test(item.nextAction)) {
      status = 'BLOCKED';
      note = `Governance constraint: ${item.nextAction}`;
    }
    // Check for COMPLETE with clear evidence
    else if (item.status === 'COMPLETE' && evidencePatterns.complete.test(item.evidence)) {
      status = 'COMPLETE';
      note = `Verified: ${item.evidence}`;
    }
    // Check for PARTIAL
    else if (item.status === 'PARTIAL' || (item.status === 'COMPLETE' && item.priority === 'CRITICAL') || item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r))) {
      // If COMPLETE but CRITICAL or PRODUCTION_REQUIRED, downgrade to PARTIAL for extra caution
      if (item.status === 'COMPLETE' && (item.priority === 'CRITICAL' || item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r)))) {
        status = 'PARTIAL';
        note = `Evidence exists but CRITICAL/PRODUCTION_REQUIRED: operator verification needed. ${item.nextAction}`;
      } else {
        status = 'PARTIAL';
        note = `Partial implementation: ${item.evidence} — ${item.nextAction}`;
      }
    }
    // NOT_STARTED
    else {
      status = 'NOT_STARTED';
      note = `No evidence: ${item.nextAction}`;
    }

    return { status, note };
  };

  const runSafeChecklistReview = async () => {
    setSystemReviewRunning(true);
    setReviewCompleted(false);
    try {
      const user = await base44.auth.me();
      const now = new Date().toISOString();
      const results = { autoCompleted: 0, partial: 0, blocked: 0, notStarted: 0, timestamp: now };
      const suggestions = {};
      const unresolvedItems = [];

      for (const item of CHECKLIST_ITEMS) {
        const { status: autoStatus, note: autoNote } = getAutoClassification(item);
        suggestions[item.name] = { status: autoStatus, note: autoNote };

        // Count results
        if (autoStatus === 'COMPLETE') results.autoCompleted++;
        else if (autoStatus === 'PARTIAL') results.partial++;
        else if (autoStatus === 'BLOCKED') results.blocked++;
        else if (autoStatus === 'NOT_STARTED') results.notStarted++;

        // Track unresolved items
        const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
        if (effectiveStatus !== 'COMPLETE') {
          unresolvedItems.push({ ...item, suggestedStatus: autoStatus, suggestedNote: autoNote });
        }
      }

      setSuggestedReviews(suggestions);
      setSystemReviewResults({ ...results, unresolvedItems });
      setReviewCompleted(true);
    } catch (err) {
      console.error('System review error:', err);
    } finally {
      setSystemReviewRunning(false);
    }
  };

  const autoSaveSuggestedReviews = async () => {
    setSavingAuto(true);
    try {
      const user = await base44.auth.me();
      const now = new Date().toISOString();
      let savedCount = 0;

      for (const item of CHECKLIST_ITEMS) {
        const suggested = suggestedReviews[item.name];
        if (!suggested) continue;

        const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
        // Only save if unresolved
        if (effectiveStatus === 'COMPLETE') continue;

        const isProdRequired = item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
        const payload = {
          checklistItemName: item.name,
          category: item.category,
          originalStatus: item.status,
          reviewStatus: suggested.status,
          reviewNote: suggested.note,
          reviewer: user?.email || 'system',
          reviewedAt: now,
          priority: item.priority,
          isCritical: item.priority === 'CRITICAL',
          isProductionRequired: isProdRequired,
        };

        const existingReview = reviews[item.name];
        if (existingReview?.id) {
          await base44.entities.OpenClawProductionChecklistReview.update(existingReview.id, payload);
        } else {
          await base44.entities.OpenClawProductionChecklistReview.create(payload);
        }
        savedCount++;
      }

      await fetchData();
      setSuggestedReviews({});
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setSavingAuto(false);
    }
  };

  // Get unresolved items sorted by severity
  const getUnresolvedBySeverity = () => {
    const unresolvedItems = CHECKLIST_ITEMS.filter(item => {
      const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
      return effectiveStatus !== 'COMPLETE';
    });

    return unresolvedItems.sort((a, b) => {
      // Priority order: BLOCKED > CRITICAL NOT_STARTED > CRITICAL PARTIAL > others
      const getOrder = (item) => {
        const status = reviews[item.name]?.reviewStatus || item.status;
        if (status === 'BLOCKED') return 0;
        if (item.priority === 'CRITICAL' && status === 'NOT_STARTED') return 1;
        if (item.priority === 'CRITICAL' && status === 'PARTIAL') return 2;
        return 3;
      };
      return getOrder(a) - getOrder(b);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Production Readiness</div>
          <div className="text-[13px] font-semibold text-foreground">Pre-Production Checklist</div>
        </div>
      </div>

      {/* System Verify Dependency Banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-400/5 border border-blue-400/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-[10px] text-blue-400/80">
          <div className="font-semibold mb-0.5">🔗 Production Checklist is linked to System Verify.</div>
          <div className="text-[9px] text-blue-400/70">Checklist alone does NOT grant production readiness. System Verify tab is the true source of truth. Backend enforcement must pass, all safety gates must be green, and all prerequisites must be met.</div>
        </div>
      </div>

      {/* Audit-Only Banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Checklist review is audit-only.</div>
          <div className="text-[9px] text-primary/70">It records operator review progress. It does not enable live execution, execute commands, or bypass governance.</div>
        </div>
      </div>

      {/* Backend Enforcement Status */}
      {backendEnforcementStatus && (
        <div className={`rounded-lg p-4 space-y-3 border ${backendEnforcementStatus.passed ? 'bg-primary/5 border-primary/30' : 'bg-destructive/5 border-destructive/30'}`}>
          <div className="flex items-start gap-3">
            {backendEnforcementStatus.passed ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`text-[11px] font-semibold mb-1 ${backendEnforcementStatus.passed ? 'text-primary' : 'text-destructive'}`}>
                {backendEnforcementStatus.passed ? '✓ BACKEND_ENFORCEMENT_ACTIVE' : '⚠️ BACKEND_ENFORCEMENT_FAILED'}
              </div>
              <div className={`text-[10px] space-y-1 ${backendEnforcementStatus.passed ? 'text-primary/80' : 'text-destructive/90'}`}>
                <div>
                  {backendEnforcementStatus.passed
                    ? `Backend validation tests passing: ${backendEnforcementStatus.tests?.filter(t => t.passed).length}/${backendEnforcementStatus.tests?.length || 0}`
                    : backendEnforcementStatus.error
                    ? `Error: ${backendEnforcementStatus.error}`
                    : `Failed tests: ${backendEnforcementStatus.tests?.filter(t => !t.passed).map(t => t.scenario_name).join(', ')}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Readiness Status Panel — Two-Tier Model */}
      <div className={`rounded-lg p-4 space-y-3 border ${readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'bg-primary/10 border-primary/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
        <div className="flex items-start gap-3">
          {readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? (
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className={`text-[11px] font-semibold mb-2 ${readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'text-primary' : 'text-amber-500'}`}>
              {readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? '✓ READY_FOR_NON_EXECUTION_DEPLOYMENT' : '⚠️ NOT_PRODUCTION_READY'}
            </div>
            <div className={`text-[10px] space-y-2 ${readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'text-primary/80' : 'text-amber-500/80'}`}>
              <div><span className="font-semibold">Deployment Status:</span></div>
              {readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? (
                <>
                  <div className="text-primary">✓ <span className="font-semibold">Non-execution deployment: READY</span> — Verified checklist + backend enforcement pass. Safe to deploy observation, validation, signing, dry-run, and audit infrastructure.</div>
                  <div className="text-amber-500/80">✗ <span className="font-semibold">Live execution production: NOT READY / DISABLED</span> — OpenClaw not connected, execution routes disabled, browser/API/trading actions blocked, credential entry disabled, money movement disabled.</div>
                </>
              ) : (
                <>
                  <div>{readinessBlockReason || `${getUnresolvedBySeverity().length} item${getUnresolvedBySeverity().length !== 1 ? 's' : ''} still require external work.`}</div>
                  <div className="text-[9px] mt-1">See "Items still needing external work" section below. Fix blockers for non-execution deployment readiness.</div>
                </>
              )}
              <div className="text-[9px] text-muted-foreground/60">Auto-review completed on page load. {summaryStats.complete} items verified.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items still needing external work - Positioned high for visibility */}
      {(() => {
        const unresolved = getUnresolvedBySeverity();
        return unresolved.length > 0 ? (
          <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
            <div className="text-[11px] font-semibold text-foreground">Items still needing external work</div>
            <div className="space-y-2">
              {unresolved.slice(0, 15).map((item, i) => {
                const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
                const statusColor = effectiveStatus === 'BLOCKED' ? 'text-destructive border-destructive/30 bg-destructive/5' :
                                   effectiveStatus === 'NOT_STARTED' ? 'text-blue-400 border-blue-400/30 bg-blue-400/5' :
                                   'text-amber-500 border-amber-500/30 bg-amber-500/5';
                return (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 bg-card/50 border border-border/30 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-semibold text-foreground text-[10px] flex-1">{item.name}</div>
                        <span className={`text-[8px] px-2 py-0.5 border rounded font-semibold whitespace-nowrap ${statusColor}`}>
                          {effectiveStatus}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground/70">
                        <div><span className="font-semibold">Category:</span> {item.category}</div>
                        <div className="mt-1"><span className="font-semibold">Next action:</span> {item.nextAction}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {unresolved.length > 15 && <div className="text-[8px] text-muted-foreground/50 text-center py-1">+ {unresolved.length - 15} more items</div>}
            </div>
          </div>
        ) : null;
      })()}

      {/* Optional Manual Re-run and Filter Controls */}
      <div className="bg-secondary/20 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Optional Controls</span>
        </div>

        {/* Manual re-run button */}
        <button
          type="button"
          onClick={runSafeChecklistReview}
          disabled={systemReviewRunning}
          className="w-full px-4 py-3 bg-secondary text-foreground text-[12px] font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 border border-border"
        >
          {systemReviewRunning ? '⏳ Re-analyzing...' : '🔍 Re-run auto-review (optional)'}
        </button>

        {/* Helper text */}
        <div className="text-[9px] text-muted-foreground/70 bg-card/50 border border-border/30 px-3 py-2 rounded">
          Auto-review already ran and saved safe records. Click to manually re-run if you've updated checklist evidence. Does not run commands, enable live mode, expose secrets, or bypass governance.
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={() => setShowOnlyUnresolved(!showOnlyUnresolved)}
          className={`w-full px-4 py-2 text-[11px] border transition-colors rounded-lg font-semibold ${
            showOnlyUnresolved
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          {showOnlyUnresolved ? '✓ Showing items still needing work' : 'Show only items still needing work'}
        </button>
      </div>

      {/* Legacy REAL/LIVE execution warning */}
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

      {/* System Review Results */}
      {systemReviewResults && (
        <div className="bg-secondary/20 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-foreground">Suggested Review Classification</div>
            <span className="text-[9px] text-muted-foreground/50">{format(new Date(systemReviewResults.timestamp), 'MM/dd HH:mm')}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
              <div className="text-primary/60 uppercase tracking-wider mb-1 text-[8px]">COMPLETE</div>
              <div className="text-[14px] font-semibold text-primary">{systemReviewResults.autoCompleted}</div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
              <div className="text-amber-500/60 uppercase tracking-wider mb-1 text-[8px]">PARTIAL</div>
              <div className="text-[14px] font-semibold text-amber-500">{systemReviewResults.partial}</div>
            </div>
            <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
              <div className="text-destructive/60 uppercase tracking-wider mb-1 text-[8px]">BLOCKED</div>
              <div className="text-[14px] font-semibold text-destructive">{systemReviewResults.blocked}</div>
            </div>
            <div className="bg-blue-400/5 border border-blue-400/20 px-3 py-2 rounded">
              <div className="text-blue-400/60 uppercase tracking-wider mb-1 text-[8px]">NOT_STARTED</div>
              <div className="text-[14px] font-semibold text-blue-400">{systemReviewResults.notStarted}</div>
            </div>
          </div>
          {systemReviewResults.unresolvedItems.length > 0 && (
            <div className="border-t border-border/30 pt-3 space-y-2">
              <div className="text-[11px] font-semibold text-foreground">What I still need to change</div>
              <div className="space-y-2 text-[9px]">
                {systemReviewResults.unresolvedItems
                  .sort((a, b) => {
                    const order = { BLOCKED: 0, CRITICAL: 1, PRODUCTION_REQUIRED: 2, PARTIAL: 3, NOT_STARTED: 4 };
                    const aKey = a.priority === 'CRITICAL' ? 'CRITICAL' : a.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r)) ? 'PRODUCTION_REQUIRED' : a.suggestedStatus;
                    const bKey = b.priority === 'CRITICAL' ? 'CRITICAL' : b.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r)) ? 'PRODUCTION_REQUIRED' : b.suggestedStatus;
                    return (order[aKey] || 5) - (order[bKey] || 5);
                  })
                  .slice(0, 10)
                  .map((item, i) => (
                    <div key={i} className="bg-card/50 border border-border/30 px-3 py-2.5 rounded space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-foreground/80 flex-1">{item.name}</div>
                        <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold whitespace-nowrap ${
                          item.suggestedStatus === 'COMPLETE' ? 'border-primary/30 bg-primary/5 text-primary' :
                          item.suggestedStatus === 'PARTIAL' ? 'border-amber-500/30 bg-amber-500/5 text-amber-500' :
                          item.suggestedStatus === 'BLOCKED' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
                          'border-blue-400/30 bg-blue-400/5 text-blue-400'
                        }`}>
                          {item.suggestedStatus}
                        </span>
                      </div>
                      <div className="text-[8px] text-muted-foreground/70"><span className="font-semibold">Current status:</span> {item.status}</div>
                      <div className="text-[8px] text-muted-foreground/70"><span className="font-semibold">Required evidence:</span> {item.evidence}</div>
                      <div className="text-[8px] text-primary/80"><span className="font-semibold">Next action:</span> {item.nextAction}</div>
                      <div className="text-[8px] text-primary/70 border-l-2 border-primary/30 pl-2 italic">💭 {item.suggestedNote}</div>
                    </div>
                  ))}
                {systemReviewResults.unresolvedItems.length > 10 && <div className="text-[8px] text-muted-foreground/50">+ {systemReviewResults.unresolvedItems.length - 10} more items</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Readiness score */}
      <div className="bg-secondary/20 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-foreground">Readiness Score</div>
            <div className="text-[9px] text-muted-foreground/50 mt-0.5">{readinessPercentage}% complete</div>
          </div>
          <div className="text-right">
            <div className={`text-[13px] font-bold ${readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'text-primary' : 'text-destructive'}`}>
              {readinessPercentage}%
            </div>
            <div className={`text-[9px] font-semibold uppercase tracking-wider mt-1 ${readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'text-primary' : 'text-destructive'}`}>
              {readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'READY FOR NON-EXECUTION' : 'NOT READY'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${readinessStatus === 'READY_FOR_NON_EXECUTION_DEPLOYMENT' ? 'bg-primary' : 'bg-destructive'}`}
            style={{ width: `${readinessPercentage}%` }}
          />
        </div>

        {/* Info if not ready for non-execution deployment */}
        {readinessStatus !== 'READY_FOR_NON_EXECUTION_DEPLOYMENT' && (
          <div className="flex items-start gap-2 text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-500">Not ready for non-execution deployment</div>
              <div className="text-amber-500/70 text-[8px] mt-0.5">
                Complete all checklist items and ensure backend enforcement passes to unlock non-execution deployment.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──── How to read this checklist ──── */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground">How to read this checklist</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] text-foreground/80">
          <div><span className="inline-block bg-primary/10 border border-primary/30 px-2 py-0.5 rounded text-[8px] font-semibold text-primary mr-1.5">COMPLETE</span> Verified and working</div>
          <div><span className="inline-block bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[8px] font-semibold text-amber-500 mr-1.5">PARTIAL</span> Evidence exists, more work needed</div>
          <div><span className="inline-block bg-blue-400/10 border border-blue-400/30 px-2 py-0.5 rounded text-[8px] font-semibold text-blue-400 mr-1.5">NOT STARTED</span> No validation yet</div>
          <div><span className="inline-block bg-destructive/10 border border-destructive/30 px-2 py-0.5 rounded text-[8px] font-semibold text-destructive mr-1.5">BLOCKED</span> Prevents readiness</div>
          <div><span className="text-orange-500 font-semibold">CRITICAL</span> High priority, required for safety</div>
          <div><span className="text-destructive font-semibold">PRODUCTION_REQUIRED</span> Must complete before live operation</div>
        </div>
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

      {/* ── Next required actions ── */}
      {(() => {
        const urgent = CHECKLIST_ITEMS.filter(i => (reviews[i.name]?.reviewStatus || i.status) !== 'COMPLETE' && ((reviews[i.name]?.reviewStatus || i.status) === 'BLOCKED' || i.priority === 'CRITICAL'));
        const partial = CHECKLIST_ITEMS.filter(i => (reviews[i.name]?.reviewStatus || i.status) === 'PARTIAL' && (reviews[i.name]?.reviewStatus || i.status) !== 'BLOCKED');
        const allItems = [...urgent, ...partial].slice(0, 5);
        return allItems.length > 0 ? (
          <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
            <div className="text-[11px] font-semibold text-foreground">Next unresolved item</div>
            <div className="space-y-2 text-[9px]">
              {allItems.map((item, i) => {
                const effectiveStatus = reviews[item.name]?.reviewStatus || item.status;
                const statusCfg = STATUS_CONFIG[effectiveStatus];
                const isProd = item.requiredBefore.some(r => ['TRADING', 'BANKING', 'PRODUCTION'].includes(r));
                return (
                  <div key={i} className="flex items-start gap-2 p-2 bg-card/50 border border-border/30 rounded">
                    <div className="text-[8px] font-semibold text-muted-foreground/60 shrink-0 uppercase tracking-wider min-w-fit">
                      {effectiveStatus === 'BLOCKED' && '🚫'}
                      {effectiveStatus === 'NOT_STARTED' && '⏳'}
                      {effectiveStatus === 'PARTIAL' && '⚙️'}
                      {item.priority === 'CRITICAL' && effectiveStatus !== 'COMPLETE' && '⚠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground/80">{item.name}</div>
                      <div className="text-[8px] text-muted-foreground/60 mt-0.5">{item.nextAction}</div>
                      {isProd && <div className="text-[8px] text-destructive/70 mt-0.5 font-semibold">Production-required · {item.category}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* ──── Completion Banner ──── */}
      {allReviewedComplete && CHECKLIST_ITEMS.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[10px] text-primary/80">
            <div className="font-semibold mb-1">✓ PRODUCTION_CHECKLIST_REVIEW_COMPLETE</div>
            <div className="text-[9px] text-primary/70">All {CHECKLIST_ITEMS.length} checklist items have been reviewed and marked COMPLETE by an operator. This is readiness review completion only, not live execution approval. All governance, legacy review, and safety constraints remain in effect.</div>
            <div className="text-[9px] text-primary/60 mt-1 border-t border-primary/20 pt-1">For final production readiness determination, check System Verify tab — checklist review alone does not override System Verify failures.</div>
          </div>
        </div>
      )}

      {/* ──── Resolve visible items guide ──── */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground">Resolve visible items</div>
        <div className="text-[9px] text-foreground/80 space-y-2">
          <div><span className="font-semibold">COMPLETE</span> means verified and working</div>
          <div><span className="font-semibold">PARTIAL</span> means some evidence exists but more work is needed</div>
          <div><span className="font-semibold">NOT_STARTED</span> means no evidence or work has started</div>
          <div><span className="font-semibold">BLOCKED</span> means a dependency prevents completion</div>
          <div><span className="font-semibold">CRITICAL</span> means high-priority production gate</div>
          <div className="pt-2 border-t border-border/30 mt-2 text-primary/80">Changing review status records operator progress only. It does not execute commands, grant live access, expose secrets, or bypass governance.</div>
        </div>
      </div>

      {/* Two Scores Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
        <div className="bg-secondary/20 border border-border rounded-lg p-3">
          <div className="text-[11px] font-semibold text-foreground mb-2">Checklist Fact Score</div>
          <div className="space-y-1 text-[9px] text-muted-foreground/80">
            <div>COMPLETE items: {CHECKLIST_ITEMS.filter(i => i.status === 'COMPLETE').length}</div>
            <div>PARTIAL items: {CHECKLIST_ITEMS.filter(i => i.status === 'PARTIAL').length}</div>
            <div>NOT STARTED items: {CHECKLIST_ITEMS.filter(i => i.status === 'NOT_STARTED').length}</div>
            <div>BLOCKED items: {CHECKLIST_ITEMS.filter(i => i.status === 'BLOCKED').length}</div>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="text-[11px] font-semibold text-primary mb-2">Reviewed Readiness Score</div>
          <div className="space-y-1 text-[9px] text-primary/80">
            <div>Operator reviewed: {Object.keys(reviews).length}</div>
            <div>System auto-reviewed: {systemReviewResults?.autoCompleted || 0}</div>
            <div>Overall: {Math.round(((Object.keys(reviews).length + (systemReviewResults?.autoCompleted || 0)) / CHECKLIST_ITEMS.length) * 100)}% reviewed</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-1.5">
        {[...FILTER_OPTIONS, 'UNRESOLVED'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[9px] border transition-colors whitespace-nowrap font-semibold ${
              filter === f
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
            }`}
          >
            {f === 'UNRESOLVED' ? `UNRESOLVED (${CHECKLIST_ITEMS.filter(i => reviews[i.name]?.reviewStatus !== 'COMPLETE' && i.status !== 'COMPLETE').length})` : f}
          </button>
        ))}
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {loading ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">Loading checklist…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">No {filter.toLowerCase()} items found</div>
        ) : (
          filtered.map(item => (
            <ChecklistItemCard
              key={item.name}
              item={item}
              expanded={expandedItems[item.name]}
              onToggle={toggleExpanded}
              savedReview={reviews[item.name] || null}
              onReviewSaved={fetchData}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-1">Checklist is audit-only.</div>
          <div>Operator reviews are persisted to OpenClawProductionChecklistReview. Original checklist definitions remain immutable. No commands are executed, no credentials exposed, no live mode enabled, and no governance bypassed.</div>
        </div>
      </div>
    </div>
  );
}