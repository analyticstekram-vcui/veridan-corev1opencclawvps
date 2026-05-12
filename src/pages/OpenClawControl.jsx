import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Terminal, RefreshCw, ExternalLink, Copy, ShieldCheck, Clock, Wifi, WifiOff, List, Monitor } from 'lucide-react';
import SafeCommandBridge from '@/components/openclaw/SafeCommandBridge';
import CommandQueuePanel from '@/components/openclaw/CommandQueuePanel';
import ExecutionReadinessPanel from '@/components/openclaw/ExecutionReadinessPanel';
import TelemetryPanel from '@/components/openclaw/TelemetryPanel';
import WorkflowPanel from '@/components/openclaw/WorkflowPanel';
import NodeRegistryPanel from '@/components/openclaw/NodeRegistryPanel';
import LiveLogsPanel from '@/components/openclaw/LiveLogsPanel';
import ExecutionSafetyTests from '@/components/openclaw/ExecutionSafetyTests';
import ExecutionReadinessGate from '@/components/openclaw/ExecutionReadinessGate';
import ExecutedCommandAuditView from '@/components/openclaw/ExecutedCommandAuditView';
import CommandApprovalWorkflowPanel from '@/components/openclaw/CommandApprovalWorkflowPanel';
import GovernancePolicyRegistryPanel from '@/components/openclaw/GovernancePolicyRegistryPanel';
import ConnectorHealthMatrixPanel from '@/components/openclaw/ConnectorHealthMatrixPanel';
import RiskPermissionMatrixPanel from '@/components/openclaw/RiskPermissionMatrixPanel';
import OperatorRunbookPanel from '@/components/openclaw/OperatorRunbookPanel';
import SimulationScenarioTesterPanel from '@/components/openclaw/SimulationScenarioTesterPanel';
import SystemSnapshotExportPanel from '@/components/openclaw/SystemSnapshotExportPanel';
import ModuleHandoffPanel from '@/components/openclaw/ModuleHandoffPanel';
import ProductionReadinessChecklistPanel from '@/components/openclaw/ProductionReadinessChecklistPanel';
import BrowserReadActionsPanel from '@/components/openclaw/BrowserReadActionsPanel';
import InteractiveRiskMapPanel from '@/components/openclaw/InteractiveRiskMapPanel';
import UnifiedOpenClawOverviewPanel from '@/components/openclaw/UnifiedOpenClawOverviewPanel';

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'status', label: 'Status' },
  { id: 'safe_bridge', label: '⚡ Safe Command Test' },
  { id: 'safety_tests', label: '🛡️ Safety Tests' },
  { id: 'readiness_gate', label: '🔐 Readiness Gate' },
  { id: 'approval_workflow', label: 'Approval Workflow' },
  { id: 'policy_registry', label: 'Policy Registry' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'risk_matrix', label: 'Risk Matrix' },
  { id: 'runbook', label: 'Runbook' },
  { id: 'simulations', label: 'Simulations' },
  { id: 'snapshot', label: 'Snapshot' },
  { id: 'handoff', label: 'Handoff' },
  { id: 'production_checklist', label: 'Production Checklist' },
  { id: 'browser_read', label: 'Browser Read' },
  { id: 'risk_map', label: 'Risk Map' },
  { id: 'audit', label: 'Executed Commands' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'nodes', label: 'Node Registry' },
  { id: 'logs', label: 'Live Logs' },
  { id: 'readiness', label: 'Execution Readiness' },
  { id: 'telemetry', label: 'Telemetry' },
];

export default function OpenClawControl() {
  const [activeView, setActiveView] = useState('overview');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const intervalRef = useRef(null);

  // Listen for navigation events dispatched by child panels (e.g. quick links in Overview)
  useEffect(() => {
    const handler = (e) => {
      console.log('TAB NAVIGATE EVENT', e.detail);
      setActiveView(e.detail);
    };
    window.addEventListener('openclaw:navigate', handler);
    return () => window.removeEventListener('openclaw:navigate', handler);
  }, []);

  const handleTabClick = useCallback((id) => {
    console.log('TAB CLICKED', id);
    setActiveView(id);
    console.log('ACTIVE TAB', id);
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, bridgeRes] = await Promise.allSettled([
        base44.functions.invoke('openclawStatus', {}),
        base44.functions.invoke('openclawSafeBridge', {
          commandType: 'SESSION_STATUS',
          targetUrl: 'https://www.tradingview.com',
          operator: 'VeridanCore',
        }),
      ]);
      setStatus(statusRes.status === 'fulfilled' ? statusRes.value.data : null);
      setBridgeStatus(bridgeRes.status === 'fulfilled' ? bridgeRes.value.data : { status: 'failed', error: 'Bridge unreachable' });
    } catch (_) {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 15000);
    base44.auth.me().then(setCurrentUser).catch(() => {});
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleOpen = async () => {
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: JSON.stringify({
          eventType: 'OPENCLAW_PANEL_OPENED',
          source: 'VeridanCore.UI',
          target: 'OpenClawGateway',
          status: 'USER_INITIATED',
          timestamp: new Date().toISOString(),
        }),
        response_json_schema: { type: 'object', properties: { logged: { type: 'boolean' } } },
      });
    } catch (_) {}
    window.open(status?.url || 'https://openclaw.veridancore.com', '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(status?.url || 'https://openclaw.veridancore.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const online = status?.online;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }} className="bg-background font-mono">

      {/* ── Title bar ── */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 20 }} className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wider text-foreground">OPENCLAW CONTROL</h1>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Gateway monitor · Governance queue · Veridan Core</p>
        </div>
      </div>

      {/* ── Tab strip ── horizontally scrollable, never clipped, above content */}
      <div
        style={{ flexShrink: 0, position: 'relative', zIndex: 10, overflowX: 'auto', overflowY: 'visible' }}
        className="border-b border-border bg-card"
      >
        <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', width: 'max-content' }}>
          {/* External links */}
          <Link
            to="/command-queue"
            style={{ flexShrink: 0 }}
            className="px-3 py-1.5 text-[11px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <List className="w-3 h-3" /> Command Queue
          </Link>
          <Link
            to="/browser-session"
            style={{ flexShrink: 0 }}
            className="px-3 py-1.5 text-[11px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Monitor className="w-3 h-3" /> Browser Session
          </Link>

          {/* Tab buttons */}
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              style={{ flexShrink: 0, cursor: 'pointer' }}
              onClick={() => handleTabClick(id)}
              className={`px-3 py-1.5 text-[11px] border transition-colors whitespace-nowrap ${
                activeView === id
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Panel area ── scrollable, fills remaining height */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>

        {activeView === 'overview' && (
          <div className="p-6"><UnifiedOpenClawOverviewPanel /></div>
        )}

        {activeView === 'safe_bridge' && (
          <div style={{ height: '100%' }}><SafeCommandBridge /></div>
        )}

        {activeView === 'safety_tests' && (
          <div className="p-6"><ExecutionSafetyTests /></div>
        )}

        {activeView === 'readiness_gate' && (
          <div className="p-6"><ExecutionReadinessGate /></div>
        )}

        {activeView === 'approval_workflow' && (
          <div className="p-6"><CommandApprovalWorkflowPanel /></div>
        )}

        {activeView === 'policy_registry' && (
          <div className="p-6"><GovernancePolicyRegistryPanel /></div>
        )}

        {activeView === 'connectors' && (
          <div className="p-6"><ConnectorHealthMatrixPanel /></div>
        )}

        {activeView === 'risk_matrix' && (
          <div className="p-6"><RiskPermissionMatrixPanel /></div>
        )}

        {activeView === 'runbook' && (
          <div className="p-6"><OperatorRunbookPanel /></div>
        )}

        {activeView === 'simulations' && (
          <div className="p-6"><SimulationScenarioTesterPanel /></div>
        )}

        {activeView === 'snapshot' && (
          <div className="p-6"><SystemSnapshotExportPanel /></div>
        )}

        {activeView === 'handoff' && (
          <div className="p-6"><ModuleHandoffPanel /></div>
        )}

        {activeView === 'production_checklist' && (
          <div className="p-6"><ProductionReadinessChecklistPanel /></div>
        )}

        {activeView === 'browser_read' && (
          <div className="p-6"><BrowserReadActionsPanel /></div>
        )}

        {activeView === 'risk_map' && (
          <div className="p-6"><InteractiveRiskMapPanel /></div>
        )}

        {activeView === 'audit' && (
          <div className="p-6"><ExecutedCommandAuditView /></div>
        )}

        {activeView === 'queue' && (
          <div style={{ height: '100%' }}><CommandQueuePanel currentUser={currentUser} /></div>
        )}

        {activeView === 'workflows' && (
          <div style={{ height: '100%' }}><WorkflowPanel currentUser={currentUser} executionMode="SIMULATED" executionPaused={false} /></div>
        )}

        {activeView === 'nodes' && (
          <div className="p-6"><NodeRegistryPanel /></div>
        )}

        {activeView === 'logs' && (
          <div style={{ height: '100%' }}><LiveLogsPanel /></div>
        )}

        {activeView === 'readiness' && (
          <div className="p-6"><ExecutionReadinessPanel gatewayOnline={status?.online} /></div>
        )}

        {activeView === 'telemetry' && (
          <div className="p-6"><TelemetryPanel executionMode="SIMULATED" gatewayOnline={status?.online} /></div>
        )}

        {activeView === 'status' && (
          <div className="p-6 max-w-2xl space-y-4">
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Gateway Status</span>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[13px] text-amber-500">CHECKING...</span>
                  </div>
                ) : online ? (
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-semibold text-primary">ONLINE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-destructive" />
                    <span className="text-[13px] font-semibold text-destructive">OFFLINE</span>
                  </div>
                )}
                {status?.gatewayStatus && !loading && (
                  <span className="text-[10px] font-mono text-muted-foreground/50 border border-border px-2 py-0.5">
                    HTTP {status.gatewayStatus}
                  </span>
                )}
              </div>

              {!loading && status?.diagnostic && (() => {
                const diagMap = {
                  openclaw_online: { bg: 'bg-primary/5 border-primary/20', text: 'text-primary', label: '✓ OpenClaw Online' },
                  cloudflare_protected_reachable: { bg: 'bg-amber-500/5 border-amber-500/20', text: 'text-amber-400', label: '⚡ Cloudflare Access Protected · Reachable' },
                  gateway_unreachable: { bg: 'bg-destructive/5 border-destructive/20', text: 'text-destructive', label: '✗ OpenClaw Gateway Unreachable' },
                  gateway_error: { bg: 'bg-destructive/5 border-destructive/20', text: 'text-destructive', label: '✗ Gateway Server Error' },
                  backend_unreachable: { bg: 'bg-secondary/50 border-border', text: 'text-muted-foreground', label: '— Backend Unreachable' },
                };
                const cfg = diagMap[status.diagnostic] || diagMap.backend_unreachable;
                return (
                  <div className={`mb-4 px-3 py-2.5 border ${cfg.bg}`}>
                    <div className={`text-[11px] font-semibold font-mono mb-0.5 ${cfg.text}`}>{cfg.label}</div>
                    <div className="text-[10px] text-muted-foreground/60 font-mono">{status.diagnosticDetail}</div>
                  </div>
                );
              })()}

              <div className="mb-4">
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Gateway URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border text-[11px] text-blue-400 font-mono truncate select-all">
                    {status?.url || 'https://openclaw.veridancore.com'}
                  </div>
                  <button type="button" onClick={handleCopy} className="px-2.5 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                  {copied && <span className="text-[10px] text-primary">Copied!</span>}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">WebSocket URL</label>
                <div className="px-3 py-1.5 bg-secondary/50 border border-border text-[11px] text-blue-400/70 font-mono truncate">
                  {status?.wsUrl || 'wss://openclaw.veridancore.com'}
                </div>
              </div>

              {status?.lastChecked && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-4">
                  <Clock className="w-3 h-3" />
                  Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                </div>
              )}

              <div className="mb-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Veridan Safe Bridge · SESSION_STATUS</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Bridge</div>
                    <div className={bridgeStatus?.status === 'success' ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                      {bridgeStatus?.status === 'success' ? 'Connected' : bridgeStatus?.status || '—'}
                    </div>
                  </div>
                  <div className="bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Session Active</div>
                    <div className={bridgeStatus?.raw?.session_active ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                      {bridgeStatus?.raw?.session_active !== undefined ? String(bridgeStatus.raw.session_active) : '—'}
                    </div>
                  </div>
                  <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Current URL</div>
                    <div className="text-blue-400 font-mono truncate">{bridgeStatus?.raw?.current_url || bridgeStatus?.targetUrl || '—'}</div>
                  </div>
                  {bridgeStatus?.error && (
                    <div className="col-span-2 bg-destructive/5 border border-destructive/20 px-3 py-2">
                      <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Error</div>
                      <div className="text-destructive font-mono text-[10px] break-all">{bridgeStatus.error}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5 text-[10px]">
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">OpenClaw Gateway</div>
                  <div className={online ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>{online ? 'Reachable' : 'Unreachable'}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">CF Access</div>
                  <div className={status?.protected ? 'text-amber-400 font-semibold' : 'text-muted-foreground/50'}>
                    {status?.protected ? 'Protected (expected)' : online ? 'Open' : '—'}
                  </div>
                </div>
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Browser Automation</div>
                  <div className="text-primary font-semibold">Operational</div>
                </div>
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">OpenClaw Version</div>
                  <div className="text-foreground font-mono">{status?.version || '2026.5.2'}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpen}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open OpenClaw Control
              </button>
            </div>

            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-semibold text-amber-500 mb-0.5">Protected by Cloudflare Access</div>
                <div className="text-[10px] text-muted-foreground/70">
                  Authentication is enforced at the gateway layer. This panel does not bypass or store Cloudflare credentials. X-Frame-Options: DENY is set at the gateway.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 px-4 py-3">
              <Terminal className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-muted-foreground/70 font-mono">
                Stable backend baseline saved at <span className="text-primary">/root/VERIDAN_OPENCLAW_STABLE_BASELINE.md</span>
              </div>
            </div>

            <div className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-widest">
              Status polling every 15 seconds · Read-only mode
            </div>
          </div>
        )}

      </div>
    </div>
  );
}