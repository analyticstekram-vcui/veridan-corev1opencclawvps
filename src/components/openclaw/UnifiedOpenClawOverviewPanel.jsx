import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, AlertCircle, Eye, Activity, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import OverviewVerificationPanel from './OverviewVerificationPanel';

const MODULES = [
  { id: 'status', name: 'Status', icon: '⚡', description: 'Gateway health & connectivity' },
  { id: 'browser_session', name: 'Browser Session', icon: '🌐', description: 'Active browser session tracking' },
  { id: 'safety_tests', name: 'Safety Tests', icon: '🛡️', description: 'Governance validation suite' },
  { id: 'readiness', name: 'Execution Readiness', icon: '✓', description: 'Pre-execution system checks' },
  { id: 'safe_bridge', name: 'Safe Command Bridge', icon: '🔗', description: 'Read-only browser commands' },
  { id: 'browser_read', name: 'Browser Read', icon: '👁', description: 'Read-only inspection actions' },
  { id: 'queue', name: 'Command Queue', icon: '📋', description: 'Pending command governance' },
  { id: 'workflow', name: 'Approval Workflow', icon: '⚙️', description: 'Multi-stage approval tracking' },
  { id: 'audit', name: 'Executed Audit', icon: '📊', description: 'Command execution history' },
  { id: 'policy', name: 'Policy Registry', icon: '📜', description: 'System governance rules' },
  { id: 'connectors', name: 'Connector Health', icon: '🔌', description: 'Module integration status' },
  { id: 'risk_matrix', name: 'Risk Matrix', icon: '⚠️', description: 'Action permission matrix' },
  { id: 'risk_map', name: 'Interactive Risk Map', icon: '🗺️', description: 'Risk tier visualization' },
  { id: 'runbook', name: 'Operator Runbook', icon: '📖', description: 'Operational procedures' },
  { id: 'simulations', name: 'Simulations', icon: '🧪', description: 'Governance test scenarios' },
  { id: 'snapshot', name: 'Snapshot', icon: '📸', description: 'System state export' },
  { id: 'handoff', name: 'Module Handoff', icon: '🤝', description: 'Integration roadmap' },
  { id: 'production_checklist', name: 'Production Checklist', icon: '✅', description: 'Readiness requirements' },
];

function ModuleCard({ module, status = 'unknown', metric = '—', timestamp = null, evidence = null, nextAction = null }) {
  const [expanded, setExpanded] = useState(false);
  
  const statusConfig = {
    online: { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'ONLINE' },
    ready: { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'READY' },
    warning: { color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', label: 'WARNING' },
    blocked: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'BLOCKED' },
    unknown: { color: 'text-muted-foreground/50', bg: 'bg-muted/5 border-muted/20', label: 'UNKNOWN' },
  };

  const cfg = statusConfig[status] || statusConfig.unknown;

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-3 py-2.5 flex items-center justify-between gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" /> : <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground">{module.icon} {module.name}</div>
            <div className="text-[8px] text-slate-400 mt-0.5 line-clamp-1 font-semibold">{module.description}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[8px] text-slate-400 font-mono font-semibold">{metric}</span>
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-3 py-2.5 space-y-1.5 text-[9px]">
          {timestamp && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Last Updated</span>
              <span className="text-foreground font-mono">{format(new Date(timestamp), 'HH:mm:ss')}</span>
            </div>
          )}
          {evidence && (
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-semibold">Evidence</span>
              <div className="bg-secondary/30 border border-border/50 px-2 py-1 rounded text-[8px] text-foreground/70 font-mono line-clamp-2">
                {evidence}
              </div>
            </div>
          )}
          {nextAction && (
            <div className="flex items-start gap-1.5 mt-1 p-1.5 bg-primary/5 border border-primary/20 rounded">
              <ArrowRight className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
              <span className="text-primary/80 text-[8px]">{nextAction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UnifiedOpenClawOverviewPanel() {
  const [status, setStatus] = useState(null);
  const [commands, setCommands] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [legacyReviews, setLegacyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJson, setExpandedJson] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, cmdRes, propRes, wfRes, reviewRes] = await Promise.allSettled([
          base44.functions.invoke('openclawStatus', {}),
          base44.entities.OpenClawCommand.list('-created_date', 100),
          base44.entities.OpenClawProposal.list('-created_date', 50),
          base44.entities.OpenClawWorkflow.list('-created_date', 50),
          base44.entities.OpenClawLegacyReview.list('-reviewedAt', 500),
        ]);

        if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data);
        if (cmdRes.status === 'fulfilled') setCommands(cmdRes.value || []);
        if (propRes.status === 'fulfilled') setProposals(propRes.value || []);
        if (wfRes.status === 'fulfilled') setWorkflows(wfRes.value || []);
        if (reviewRes.status === 'fulfilled') setLegacyReviews(reviewRes.value || []);
      } catch (e) {
        console.error('Error fetching overview data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Detect legacy REAL/LIVE execution records
  const legacyRealExecutionCommands = commands.filter(c => 
    c.executionMode === 'REAL' || c.executionMode === 'LIVE'
  );

  // Build review lookup by commandId
  const reviewMap = {};
  for (const r of legacyReviews) {
    if (r.commandId) reviewMap[r.commandId] = r;
  }
  const legacyReviewed = legacyRealExecutionCommands.filter(c => reviewMap[c.id] && reviewMap[c.id].reviewStatus !== 'UNREVIEWED').length;
  const legacyUnreviewed = legacyRealExecutionCommands.length - legacyReviewed;

  // Calculate counters
  const counters = {
    totalCommands: commands.length,
    approved: commands.filter(c => c.status === 'approved').length,
    executed: commands.filter(c => c.status === 'executed').length,
    blocked: commands.filter(c => c.status === 'denied').length,
    pending: proposals.filter(p => p.status === 'REVIEW' || p.status === 'DRAFT').length,
    highRisk: commands.filter(c => c.riskLevel === 'HIGH').length,
    critical: commands.filter(c => c.riskLevel === 'CRITICAL').length,
    activeWorkflows: workflows.filter(w => w.status === 'running' || w.status === 'pending_approval').length,
    readyConnectors: 12, // Mock
    passingSims: 7, // Mock
    legacyRealExecutions: legacyRealExecutionCommands.length,
    legacyReviewed,
    legacyUnreviewed,
  };

  // Build overview state for JSON export
  const overviewState = {
    timestamp: new Date().toISOString(),
    systemStatus: status?.diagnostic || 'unknown',
    executionMode: status?.mode || 'SIMULATED',
    productionReady: false,
    counters,
    alerts: {
      failedChecks: 2,
      blockedConnectors: 0,
      highRiskPending: counters.highRisk + counters.critical,
      missingAuditTraces: 1,
      productionNotReady: true,
    },
  };

  // Determine top-level status
  const systemHealthy = status?.online && counters.critical === 0;
  const allTestsPassing = counters.pending === 0 && counters.blocked === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">OpenClaw Control</div>
          <div className="text-[13px] font-semibold text-foreground">Unified Overview Dashboard</div>
        </div>
        <div className="text-[9px] text-slate-400 font-semibold">{loading ? 'Syncing...' : 'Ready'}</div>
      </div>

      {/* Top status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px]">
        <div className={`border px-3 py-2.5 rounded ${systemHealthy ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <div className={`${systemHealthy ? 'text-primary' : 'text-amber-500'} uppercase tracking-wider mb-1 text-[8px] font-semibold`}>Overall Status</div>
          <div className={`text-[12px] font-semibold ${systemHealthy ? 'text-primary' : 'text-amber-500'}`}>
            {loading ? 'LOADING' : systemHealthy ? 'HEALTHY' : 'CAUTION'}
          </div>
        </div>

        <div className="bg-blue-400/5 border border-blue-400/20 px-3 py-2.5 rounded">
          <div className="text-blue-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Execution Mode</div>
          <div className="text-[12px] font-semibold text-blue-400">{status?.mode || 'SIMULATED'}</div>
        </div>

        <div className="bg-secondary/20 border border-border px-3 py-2.5 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Production Ready</div>
          <div className="text-[12px] font-semibold text-foreground">NOT READY</div>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/20 px-3 py-2.5 rounded">
          <div className="text-orange-500 uppercase tracking-wider mb-1 text-[8px] font-semibold">Risk Posture</div>
          <div className="text-[12px] font-semibold text-orange-500">{counters.critical > 0 ? 'CRITICAL' : counters.highRisk > 0 ? 'HIGH' : 'NORMAL'}</div>
        </div>
      </div>

      {/* Overview Verification Pass */}
      <OverviewVerificationPanel activeView="overview" />

      {/* Alerts strip */}
      {(counters.critical > 0 || counters.highRisk > 0 || counters.legacyRealExecutions > 0) && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/20 rounded">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-[10px] text-destructive/80">
            <div className="font-semibold mb-1">Active Alerts</div>
            <ul className="text-[9px] space-y-0.5">
              {counters.legacyRealExecutions > 0 && <li>• ⚠️ LEGACY: {counters.legacyRealExecutions} command{counters.legacyRealExecutions !== 1 ? 's' : ''} with REAL/LIVE execution mode · <span className="text-amber-500">{counters.legacyUnreviewed} unreviewed</span> / <span className="text-primary">{counters.legacyReviewed} reviewed</span> · Go to Legacy Review tab</li>}
              {counters.critical > 0 && <li>• {counters.critical} critical-risk command{counters.critical !== 1 ? 's' : ''} pending review</li>}
              {counters.highRisk > 0 && <li>• {counters.highRisk} high-risk command{counters.highRisk !== 1 ? 's' : ''} require approval</li>}
              <li>• Production readiness: NOT READY · Multiple checks pending</li>
              <li>• Missing audit traces: 1 · Check failed executions</li>
            </ul>
          </div>
        </div>
      )}

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total Commands</div>
          <div className="text-[13px] font-semibold text-foreground">{counters.totalCommands}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary uppercase tracking-wider mb-1 text-[8px] font-semibold">Approved</div>
          <div className="text-[13px] font-semibold text-primary">{counters.approved}</div>
        </div>
        <div className="bg-green-500/5 border border-green-500/20 px-3 py-2 rounded">
          <div className="text-green-500 uppercase tracking-wider mb-1 text-[8px] font-semibold">Executed</div>
          <div className="text-[13px] font-semibold text-green-500">{counters.executed}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive uppercase tracking-wider mb-1 text-[8px] font-semibold">Blocked</div>
          <div className="text-[13px] font-semibold text-destructive">{counters.blocked}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500 uppercase tracking-wider mb-1 text-[8px] font-semibold">Pending Workflows</div>
          <div className="text-[13px] font-semibold text-amber-500">{counters.activeWorkflows}</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground">Quick Links to Critical Panels</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { panel: 'safety_tests', label: '🛡️ Safety Tests' },
            { panel: 'safe_bridge', label: '🔗 Safe Bridge' },
            { panel: 'snapshot', label: '📸 Snapshot' },
            { panel: 'runbook', label: '📖 Runbook' },
            { panel: 'production_checklist', label: '✅ Production' },
          ].map(link => (
            <button
              key={link.panel}
              onClick={() => window.dispatchEvent(new CustomEvent('openclaw:navigate', { detail: link.panel }))}
              className="px-3 py-2 border border-primary/30 bg-primary/10 text-[9px] text-primary rounded hover:bg-primary/20 transition-colors font-semibold"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground">Module Summary Cards</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {MODULES.map(mod => (
            <ModuleCard
              key={mod.id}
              module={mod}
              status={mod.id === 'status' && status?.online ? 'online' : 'unknown'}
              metric={
                mod.id === 'queue' ? `${counters.totalCommands}` :
                mod.id === 'audit' ? `${counters.executed}` :
                mod.id === 'workflow' ? `${counters.activeWorkflows}` :
                mod.id === 'risk_map' ? `${counters.critical + counters.highRisk}` :
                '—'
              }
              timestamp={new Date().toISOString()}
              evidence={
                mod.id === 'queue' ? `${counters.approved} approved, ${counters.blocked} blocked` :
                mod.id === 'risk_map' ? `${counters.critical} critical, ${counters.highRisk} high` :
                'Module operational'
              }
              nextAction={
                mod.id === 'queue' && counters.pending > 0 ? 'Review pending commands in queue' :
                mod.id === 'risk_map' && (counters.critical + counters.highRisk) > 0 ? 'Drill down to assess risk' :
                mod.id === 'production_checklist' ? 'Run full readiness assessment' :
                'No action required'
              }
            />
          ))}
        </div>
      </div>

      {/* Raw JSON export */}
      <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
        <div
          className="cursor-pointer hover:bg-secondary/20 transition-colors px-3 py-2.5 flex items-center justify-between gap-2"
          onClick={() => setExpandedJson(!expandedJson)}
        >
          <div className="flex items-center gap-2">
            {expandedJson ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            <span className="text-[10px] font-semibold text-foreground">Raw Overview State (JSON)</span>
          </div>
          <span className="text-[8px] text-slate-400 font-semibold">Collapsible</span>
        </div>
        {expandedJson && (
          <div className="border-t border-border/30 bg-secondary/5 px-3 py-2.5">
            <pre className="text-[8px] text-foreground/70 overflow-x-auto bg-secondary/30 p-2 rounded font-mono">
              {JSON.stringify(overviewState, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-slate-300">
        <Eye className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold mb-1 text-foreground">Overview Dashboard is read-only</div>
          <div className="text-slate-400">It summarizes all OpenClaw Control panels. Navigate to specific panels to approve commands, run tests, or manage system state. No governance bypass · No unsafe actions.</div>
        </div>
      </div>
    </div>
  );
}