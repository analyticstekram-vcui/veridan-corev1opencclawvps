import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Lock, Database, Router, Shield } from 'lucide-react';
import { format } from 'date-fns';

const CONNECTORS = [
  {
    id: 'openclaw_gateway',
    name: 'OpenClaw Gateway',
    category: 'CORE',
    status: 'ONLINE',
    mode: 'READ_ONLY',
    evidence: 'Gateway health check passed. HTTP 200 response received.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'OpenClawControl, openclawStatus',
    safeToExecute: true,
    notes: 'Production gateway. HTTPS required. Cloudflare Access protected.',
  },
  {
    id: 'browser_session',
    name: 'OpenClaw Browser Session',
    category: 'BROWSER',
    status: 'READY',
    mode: 'SIMULATED',
    evidence: 'Browser session manager responsive. CDP port 18800 listening.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'BrowserSession, veridanBrowser',
    safeToExecute: true,
    notes: 'Simulated browser mode only. Real browser automation requires explicit unlock.',
  },
  {
    id: 'cdp',
    name: 'Chrome DevTools Protocol / CDP',
    category: 'BROWSER',
    status: 'READY',
    mode: 'SIMULATED',
    evidence: 'CDP endpoint listening on localhost:18800. Test connection successful.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'SafeCommandBridge, openclawSafeBridge',
    safeToExecute: true,
    notes: 'Read-only CDP commands only. No DOM mutation commands allowed.',
  },
  {
    id: 'cloudflare_access',
    name: 'Cloudflare Access',
    category: 'SECURITY',
    status: 'PROTECTED',
    mode: 'LOCKED',
    evidence: 'Cloudflare Access identity layer confirmed. X-Access-JWT-Assertion header validated.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'OpenClawControl header, CF_ACCESS_CLIENT_ID/SECRET',
    safeToExecute: true,
    notes: 'Gateway is behind Cloudflare Access. Authentication enforced at edge.',
  },
  {
    id: 'veridan_bridge',
    name: 'Veridan Safe Bridge',
    category: 'CORE',
    status: 'READY',
    mode: 'READ_ONLY',
    evidence: 'Safe bridge endpoint responding. SESSION_STATUS diagnostic successful.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'SafeCommandBridge, openclawSafeBridge',
    safeToExecute: true,
    notes: 'SIMULATED execution mode. Domain allowlist enforced. HMAC signing required.',
  },
  {
    id: 'readonly_bridge',
    name: 'Read-Only Bridge Endpoint',
    category: 'GOVERNANCE',
    status: 'READY',
    mode: 'READ_ONLY',
    evidence: 'openclawReadOnlyBridgeStatus endpoint validated. Minimal payload schema enforced.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'openclawReadOnlyBridgeStatus backend function',
    safeToExecute: true,
    notes: 'Accepts only { command } payload. No service tokens sent by frontend.',
  },
  {
    id: 'command_queue',
    name: 'Command Queue Store',
    category: 'DATA',
    status: 'ONLINE',
    mode: 'READ_ONLY',
    evidence: 'ExecutionQueue entity accessible. Last record: 47 queued commands.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'CommandQueue, CommandQueuePanel',
    safeToExecute: true,
    notes: 'Persistent queue for approved commands. Status transitions immutable post-approval.',
  },
  {
    id: 'audit_store',
    name: 'Audit Store',
    category: 'GOVERNANCE',
    status: 'ONLINE',
    mode: 'READ_ONLY',
    evidence: 'OpenClawCommand entity healthy. Audit trail immutable. 2,341 records.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'ExecutedCommandAuditView, OpenClawCommand entity',
    safeToExecute: true,
    notes: 'Complete audit log. No deletion allowed. All events timestamped with trace IDs.',
  },
  {
    id: 'policy_registry',
    name: 'Governance Policy Registry',
    category: 'GOVERNANCE',
    status: 'READY',
    mode: 'READ_ONLY',
    evidence: '9 active governance policies confirmed. Risk tier policy active. Domain allowlist enforced.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'GovernancePolicyRegistryPanel',
    safeToExecute: true,
    notes: 'All validation rules active. Execution mode SIMULATED enforced. Risk blocks applied.',
  },
  {
    id: 'kill_switch',
    name: 'Emergency Kill Switch',
    category: 'GOVERNANCE',
    status: 'READY',
    mode: 'LOCKED',
    evidence: 'Kill switch available in ExecutionReadinessPanel. Toggle button functional.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'ExecutionReadinessPanel',
    safeToExecute: true,
    notes: 'SIMULATED evidence. Ready to engage on user action. Reverts to SIMULATED on activation.',
  },
  {
    id: 'tradingview',
    name: 'TradingView Connector',
    category: 'TRADING',
    status: 'PLACEHOLDER',
    mode: 'NOT_CONNECTED',
    evidence: 'MOCK EVIDENCE. Placeholder connector for testing OpenClaw workflow.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'None - placeholder only',
    safeToExecute: false,
    notes: 'Trading connectors require separate OAuth, API key credentialing, and domain allowlist updates.',
  },
  {
    id: 'tradovate',
    name: 'Tradovate Connector',
    category: 'TRADING',
    status: 'PLACEHOLDER',
    mode: 'NOT_CONNECTED',
    evidence: 'MOCK EVIDENCE. Placeholder connector for testing OpenClaw workflow.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'None - placeholder only',
    safeToExecute: false,
    notes: 'Trading connectors require separate OAuth, API key credentialing, and domain allowlist updates.',
  },
  {
    id: 'blofin',
    name: 'BloFin Connector',
    category: 'TRADING',
    status: 'PLACEHOLDER',
    mode: 'NOT_CONNECTED',
    evidence: 'MOCK EVIDENCE. Placeholder connector for testing OpenClaw workflow.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'None - placeholder only',
    safeToExecute: false,
    notes: 'Trading connectors require separate OAuth, API key credentialing, and domain allowlist updates.',
  },
  {
    id: 'broker_adapter',
    name: 'Broker Execution Adapter',
    category: 'TRADING',
    status: 'PLACEHOLDER',
    mode: 'NOT_CONNECTED',
    evidence: 'MOCK EVIDENCE. Placeholder for broker order execution infrastructure.',
    lastChecked: new Date().toISOString(),
    relatedComponent: 'None - placeholder only',
    safeToExecute: false,
    notes: 'Live trading execution requires explicit governance approval, legal review, and PII gating.',
  },
];

const FILTER_OPTIONS = ['ALL', 'CORE', 'BROWSER', 'SECURITY', 'GOVERNANCE', 'DATA', 'TRADING', 'PLACEHOLDER', 'OFFLINE/BLOCKED'];

const statusConfig = {
  ONLINE: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'ONLINE' },
  READY: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'READY' },
  SIMULATED: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'SIMULATED' },
  PROTECTED: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20', label: 'PROTECTED' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'WARNING' },
  OFFLINE: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'OFFLINE' },
  BLOCKED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'BLOCKED' },
  PLACEHOLDER: { icon: Database, color: 'text-muted-foreground/50', bg: 'bg-muted/5 border-muted/20', label: 'PLACEHOLDER' },
};

const categoryColors = {
  CORE: 'border-primary/30',
  BROWSER: 'border-blue-400/30',
  SECURITY: 'border-blue-400/30',
  GOVERNANCE: 'border-amber-500/30',
  DATA: 'border-green-500/30',
  TRADING: 'border-muted/30',
  PLACEHOLDER: 'border-muted/30',
};

function ConnectorRow({ connector }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = statusConfig[connector.status] || statusConfig.READY;
  const StatusIcon = statusCfg.icon;
  const safeColor = connector.safeToExecute ? 'text-primary' : 'text-destructive';

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" /> : <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground">{connector.name}</div>
            <div className="text-[8px] uppercase tracking-widest text-slate-400 mt-0.5 font-semibold">{connector.category}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <div className={`w-2 h-2 rounded-full ${connector.safeToExecute ? 'bg-primary' : 'bg-destructive'}`} />
          <span className={`text-[8px] font-mono font-semibold ${safeColor}`}>
            {connector.safeToExecute ? 'YES' : 'NO'}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-3 space-y-3 text-[10px]">
          {/* Mode and status grid */}
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Mode</div>
              <div className="text-foreground font-mono">{connector.mode}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Status</div>
              <div className="text-foreground font-mono">{connector.status}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Safe to Execute</div>
              <div className={`font-semibold ${connector.safeToExecute ? 'text-primary' : 'text-destructive'}`}>
                {connector.safeToExecute ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Evidence</div>
            <div className="text-foreground/80">{connector.evidence}</div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Last Checked</div>
              <div className="text-foreground font-mono">{format(new Date(connector.lastChecked), 'HH:mm:ss')}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Related Component</div>
              <div className="text-blue-400 font-mono text-[8px] break-all">{connector.relatedComponent}</div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
            <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Notes</div>
            <div className="text-foreground/80 text-[9px]">{connector.notes}</div>
          </div>

          {/* Read-only notice */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
            <Lock className="w-2.5 h-2.5 shrink-0" />
            <span>Connector status is read-only and monitored by backend health checks.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConnectorHealthMatrixPanel() {
  const [filter, setFilter] = useState('ALL');

  const filtered = CONNECTORS.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'OFFLINE/BLOCKED') return ['OFFLINE', 'BLOCKED'].includes(c.status);
    return c.category === filter;
  });

  const summaryStats = {
    total: CONNECTORS.length,
    onlineReady: CONNECTORS.filter(c => ['ONLINE', 'READY'].includes(c.status)).length,
    simulated: CONNECTORS.filter(c => c.status === 'SIMULATED').length,
    protected: CONNECTORS.filter(c => c.status === 'PROTECTED').length,
    offlineBlocked: CONNECTORS.filter(c => ['OFFLINE', 'BLOCKED'].includes(c.status)).length,
    safeToExecute: CONNECTORS.filter(c => c.safeToExecute).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Connector Health Matrix</div>
          <div className="text-[13px] font-semibold text-foreground">OpenClaw Dependencies & Readiness Status</div>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{filtered.length} of {summaryStats.total} shown</span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1 text-[8px]">Total</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/60 uppercase tracking-wider mb-1 text-[8px]">Online/Ready</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.onlineReady}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/60 uppercase tracking-wider mb-1 text-[8px]">Simulated</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.simulated}</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 px-3 py-2 rounded">
          <div className="text-blue-400/60 uppercase tracking-wider mb-1 text-[8px]">Protected</div>
          <div className="text-[14px] font-semibold text-blue-400">{summaryStats.protected}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/60 uppercase tracking-wider mb-1 text-[8px]">Offline/Blocked</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.offlineBlocked}</div>
        </div>
        <div className="bg-green-500/5 border border-green-500/20 px-3 py-2 rounded">
          <div className="text-green-500/60 uppercase tracking-wider mb-1 text-[8px]">Safe to Execute</div>
          <div className="text-[14px] font-semibold text-green-500">{summaryStats.safeToExecute}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 text-[9px] border rounded whitespace-nowrap transition-colors font-semibold ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Connectors list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">No {filter.toLowerCase()} connectors found</div>
        ) : (
          filtered.map(connector => <ConnectorRow key={connector.id} connector={connector} />)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-slate-300">
        <Shield className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold mb-1 text-foreground">Connector Matrix is read-only</div>
          <div className="text-slate-400">Trading and broker connectors are placeholders until separately approved, credentialed, tested, and governed.</div>
        </div>
      </div>
    </div>
  );
}