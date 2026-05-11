import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Lock, Zap } from 'lucide-react';

const ACTIONS = [
  {
    id: 'system_status',
    name: 'system.status',
    category: 'CORE',
    riskTier: 'LOW',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'ALLOWED',
    reason: 'Read-only diagnostic. Querying system state poses no mutation risk.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Safe execution in both SIMULATED and READ_ONLY modes. No approval bypass.',
  },
  {
    id: 'logs_fetch',
    name: 'logs.fetch',
    category: 'CORE',
    riskTier: 'LOW',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'ALLOWED',
    reason: 'Read-only observation. Fetching logs does not modify state.',
    relatedPolicy: 'Command Type Policy, Audit Logging Policy',
    notes: 'Safe execution. Audit trace logged for all fetch operations.',
  },
  {
    id: 'session_list',
    name: 'session.list',
    category: 'CORE',
    riskTier: 'LOW',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'ALLOWED',
    reason: 'Read-only enumeration. Listing sessions poses no mutation risk.',
    relatedPolicy: 'Command Type Policy, Read-Only Bridge Policy',
    notes: 'Safe execution. Allowed through openclawReadOnlyBridgeStatus.',
  },
  {
    id: 'browser_read',
    name: 'browser.read',
    category: 'BROWSER',
    riskTier: 'LOW',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'READ_ONLY_ONLY',
    reason: 'Read element text from DOM. Safe in SIMULATED and READ_ONLY. Requires governance review.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Allowed only after approval. LIVE mode globally disabled.',
  },
  {
    id: 'browser_screenshot',
    name: 'browser.screenshot',
    category: 'BROWSER',
    riskTier: 'LOW',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'READ_ONLY_ONLY',
    reason: 'Capture visual state. No DOM mutation. Safe in simulated and read-only modes.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Requires governance approval. No live execution.',
  },
  {
    id: 'browser_navigate',
    name: 'browser.navigate',
    category: 'BROWSER',
    riskTier: 'MEDIUM',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'BLOCKED',
    reason: 'Navigation command blocked pending separate safety review and domain allowlist expansion.',
    relatedPolicy: 'Domain Allowlist Policy, Risk Tier Policy',
    notes: 'Requires explicit governance override. Use safe_bridge for approved navigation.',
  },
  {
    id: 'browser_click',
    name: 'browser.click',
    category: 'BROWSER',
    riskTier: 'MEDIUM',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'BLOCKED',
    reason: 'Click command blocked. State-changing action requires separate safety governance.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Mutation command. Blocked to prevent accidental state changes.',
  },
  {
    id: 'browser_type',
    name: 'browser.type',
    category: 'BROWSER',
    riskTier: 'MEDIUM',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'BLOCKED',
    reason: 'Type command blocked. Input mutation requires separate approval flow.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Mutation command. Blocked to prevent unauthorized data entry.',
  },
  {
    id: 'form_submit',
    name: 'form.submit',
    category: 'BROWSER',
    riskTier: 'HIGH',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'BLOCKED',
    reason: 'Form submission blocked. High-risk state-changing operation.',
    relatedPolicy: 'Risk Tier Policy, Command Type Policy',
    notes: 'Strictly blocked. No form submission allowed.',
  },
  {
    id: 'data_export',
    name: 'data.export',
    category: 'DATA',
    riskTier: 'MEDIUM',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'READ_ONLY_ONLY',
    reason: 'Export operation is read-only and poses no mutation risk.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Safe execution after approval. Requires audit trail.',
  },
  {
    id: 'file_download',
    name: 'file.download',
    category: 'DATA',
    riskTier: 'MEDIUM',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'READ_ONLY_ONLY',
    reason: 'File download is read-only. No state mutation.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Safe execution after approval. Logged in audit trail.',
  },
  {
    id: 'api_webhook_call',
    name: 'api.webhook.call',
    category: 'SECURITY',
    riskTier: 'HIGH',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'BLOCKED',
    reason: 'Webhook calls blocked. External API mutations require separate governance.',
    relatedPolicy: 'Risk Tier Policy, Token / Secret Exposure Policy',
    notes: 'Blocked to prevent unintended external state changes.',
  },
  {
    id: 'trading_signal_read',
    name: 'trading.signal.read',
    category: 'TRADING',
    riskTier: 'MEDIUM',
    allowedSimulated: true,
    allowedReadOnly: true,
    allowedLive: false,
    approvalRequired: true,
    permission: 'READ_ONLY_ONLY',
    reason: 'Trading signal read is observational. No execution or ordering.',
    relatedPolicy: 'Command Type Policy, Risk Tier Policy',
    notes: 'Safe execution after approval. Read-only trading intelligence.',
  },
  {
    id: 'trading_order_preview',
    name: 'trading.order.preview',
    category: 'TRADING',
    riskTier: 'HIGH',
    allowedSimulated: true,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'SIMULATED_ONLY',
    reason: 'Order preview allowed in SIMULATED mode for testing. No real execution.',
    relatedPolicy: 'Execution Mode Policy, Risk Tier Policy',
    notes: 'SIMULATED mode only. Real orders blocked.',
  },
  {
    id: 'trading_order_place',
    name: 'trading.order.place',
    category: 'TRADING',
    riskTier: 'CRITICAL',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'FORBIDDEN',
    reason: 'Live trading order placement is globally forbidden from UI.',
    relatedPolicy: 'Execution Mode Policy, Risk Tier Policy',
    notes: 'Requires live broker integration, separate legal approval, PII gating.',
  },
  {
    id: 'funds_transfer',
    name: 'funds.transfer',
    category: 'TRADING',
    riskTier: 'CRITICAL',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'FORBIDDEN',
    reason: 'Fund transfers are globally forbidden. Requires separate broker integration.',
    relatedPolicy: 'Risk Tier Policy, Governance Approval Policy',
    notes: 'Blocked. No fund movement allowed from this interface.',
  },
  {
    id: 'broker_withdraw',
    name: 'broker.withdraw',
    category: 'TRADING',
    riskTier: 'CRITICAL',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'FORBIDDEN',
    reason: 'Broker withdrawal is globally forbidden.',
    relatedPolicy: 'Risk Tier Policy, Governance Approval Policy',
    notes: 'Blocked. No fund withdrawal allowed.',
  },
  {
    id: 'credential_read',
    name: 'credential.read',
    category: 'SECURITY',
    riskTier: 'CRITICAL',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'FORBIDDEN',
    reason: 'Credential reads are forbidden. Secrets never rendered to client.',
    relatedPolicy: 'Token / Secret Exposure Policy',
    notes: 'Strictly forbidden. No credentials ever exposed.',
  },
  {
    id: 'secret_render',
    name: 'secret.render',
    category: 'SECURITY',
    riskTier: 'CRITICAL',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'FORBIDDEN',
    reason: 'Secret rendering is forbidden. Tokens and keys never exposed to browser.',
    relatedPolicy: 'Token / Secret Exposure Policy',
    notes: 'Strictly forbidden. Backend-only operations.',
  },
  {
    id: 'live_execution_enable',
    name: 'live.execution.enable',
    category: 'GOVERNANCE',
    riskTier: 'CRITICAL',
    allowedSimulated: false,
    allowedReadOnly: false,
    allowedLive: false,
    approvalRequired: true,
    permission: 'FORBIDDEN',
    reason: 'Live execution is globally blocked from UI.',
    relatedPolicy: 'Execution Mode Policy, Kill Switch Policy',
    notes: 'LIVE mode disabled. All execution is SIMULATED.',
  },
];

const FILTER_OPTIONS = ['ALL', 'ALLOWED', 'READ_ONLY_ONLY', 'SIMULATED_ONLY', 'BLOCKED', 'FORBIDDEN', 'TRADING', 'BROWSER', 'SECURITY'];

const permissionConfig = {
  ALLOWED: { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'ALLOWED' },
  READ_ONLY_ONLY: { color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20', label: 'READ-ONLY ONLY' },
  SIMULATED_ONLY: { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'SIMULATED ONLY' },
  BLOCKED: { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'BLOCKED' },
  FORBIDDEN: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'FORBIDDEN' },
};

function ActionRow({ action }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = permissionConfig[action.permission];

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold font-mono text-foreground">{action.name}</div>
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mt-0.5">{action.category}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className={`text-[8px] px-1.5 py-0.5 border rounded ${action.riskTier === 'LOW' ? 'border-primary/30 text-primary bg-primary/5' : action.riskTier === 'MEDIUM' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-destructive/30 text-destructive bg-destructive/5'}`}>
            {action.riskTier}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-3 space-y-3 text-[10px]">
          {/* Mode support grid */}
          <div className="grid grid-cols-4 gap-2 text-[9px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Simulated</div>
              <div className={`font-semibold ${action.allowedSimulated ? 'text-primary' : 'text-destructive'}`}>
                {action.allowedSimulated ? 'YES' : 'NO'}
              </div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Read-Only</div>
              <div className={`font-semibold ${action.allowedReadOnly ? 'text-blue-400' : 'text-destructive'}`}>
                {action.allowedReadOnly ? 'YES' : 'NO'}
              </div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Live</div>
              <div className="text-destructive font-semibold">NO</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Approval</div>
              <div className={`font-semibold ${action.approvalRequired ? 'text-amber-500' : 'text-primary'}`}>
                {action.approvalRequired ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* Reason and related policy */}
          <div className="space-y-2">
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Reason</div>
              <div className="text-foreground/80">{action.reason}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Related Policy</div>
              <div className="text-blue-400 text-[9px]">{action.relatedPolicy}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Safe Execution Notes</div>
              <div className="text-foreground/80 text-[9px]">{action.notes}</div>
            </div>
          </div>

          {/* Read-only notice */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
            <Lock className="w-2.5 h-2.5 shrink-0" />
            <span>This permission is read-only. Governance enforced by backend.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiskPermissionMatrixPanel() {
  const [filter, setFilter] = useState('ALL');

  const filtered = ACTIONS.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'ALLOWED') return a.permission === 'ALLOWED';
    if (filter === 'READ_ONLY_ONLY') return a.permission === 'READ_ONLY_ONLY';
    if (filter === 'SIMULATED_ONLY') return a.permission === 'SIMULATED_ONLY';
    if (filter === 'BLOCKED') return a.permission === 'BLOCKED';
    if (filter === 'FORBIDDEN') return a.permission === 'FORBIDDEN';
    if (filter === 'TRADING') return a.category === 'TRADING';
    if (filter === 'BROWSER') return a.category === 'BROWSER';
    if (filter === 'SECURITY') return a.category === 'SECURITY';
    return true;
  });

  const summaryStats = {
    total: ACTIONS.length,
    allowed: ACTIONS.filter(a => a.permission === 'ALLOWED').length,
    readOnlyOnly: ACTIONS.filter(a => a.permission === 'READ_ONLY_ONLY').length,
    simulatedOnly: ACTIONS.filter(a => a.permission === 'SIMULATED_ONLY').length,
    blocked: ACTIONS.filter(a => a.permission === 'BLOCKED').length,
    forbidden: ACTIONS.filter(a => a.permission === 'FORBIDDEN').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Risk & Permission Matrix</div>
          <div className="text-[13px] font-semibold text-foreground">Action Permissions by Risk Tier & Execution Mode</div>
        </div>
        <span className="text-[9px] text-muted-foreground/30">{filtered.length} of {summaryStats.total} shown</span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1 text-[8px]">Total</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/60 uppercase tracking-wider mb-1 text-[8px]">Allowed</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.allowed}</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 px-3 py-2 rounded">
          <div className="text-blue-400/60 uppercase tracking-wider mb-1 text-[8px]">Read-Only Only</div>
          <div className="text-[14px] font-semibold text-blue-400">{summaryStats.readOnlyOnly}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/60 uppercase tracking-wider mb-1 text-[8px]">Simulated Only</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.simulatedOnly}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/60 uppercase tracking-wider mb-1 text-[8px]">Blocked</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.blocked}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/60 uppercase tracking-wider mb-1 text-[8px]">Forbidden</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.forbidden}</div>
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

      {/* Actions list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">No {filter.toLowerCase()} actions found</div>
        ) : (
          filtered.map(action => <ActionRow key={action.id} action={action} />)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
        <Zap className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-1">Risk Matrix is read-only</div>
          <div>It describes permissions only; it does not grant permissions or execute commands. LIVE mode is globally disabled.</div>
        </div>
      </div>
    </div>
  );
}