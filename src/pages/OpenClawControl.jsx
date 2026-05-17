import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Terminal, RefreshCw, ExternalLink, Copy, ShieldCheck, Clock, Wifi, WifiOff, List, Monitor, ChevronDown, ChevronRight, Settings, AlertTriangle, Home } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
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
import SafeBridgeContractPreview from '@/components/openclaw/SafeBridgeContractPreview';
import Phase1DryRunAuditLog from '@/components/openclaw/Phase1DryRunAuditLog';
import Phase2PolicyTestCases from '@/components/openclaw/Phase2PolicyTestCases';
import ProductionReadinessChecklistPanel from '@/components/openclaw/ProductionReadinessChecklistPanel';
import BrowserReadActionsPanel from '@/components/openclaw/BrowserReadActionsPanel';
import InteractiveRiskMapPanel from '@/components/openclaw/InteractiveRiskMapPanel';
import UnifiedOpenClawOverviewPanel from '@/components/openclaw/UnifiedOpenClawOverviewPanel';
import LegacyExecutionReviewPanel from '@/components/openclaw/LegacyExecutionReviewPanel';
import RolePermissionMatrixPanel from '@/components/openclaw/RolePermissionMatrixPanel';
import UserAccessReviewPanel from '@/components/openclaw/UserAccessReviewPanel';
import SystemVerificationPanel from '@/components/openclaw/SystemVerificationPanel';
import CommandAuditTrailPanel from '@/components/openclaw/CommandAuditTrailPanel';
import SessionTimeoutPanel from '@/components/openclaw/SessionTimeoutPanel';
import SecretVaultRegistryPanel from '@/components/openclaw/SecretVaultRegistryPanel';
import BrokerCredentialVaultPanel from '@/components/openclaw/BrokerCredentialVaultPanel';
import BackendSecretEnforcementPanel from '@/components/openclaw/BackendSecretEnforcementPanel';
import OpenClawCommandProposalQueue from '@/components/openclaw/OpenClawCommandProposalQueue';
import OpenClawGatewayConnectorPanel from '@/components/openclaw/OpenClawGatewayConnectorPanel';
import ProposalReviewPacketExporter from '@/components/openclaw/ProposalReviewPacketExporter';
import ProposalReviewPacketVerifier from '@/components/openclaw/ProposalReviewPacketVerifier';
import AuditEvidenceVault from '@/components/openclaw/AuditEvidenceVault';
import VaultExportVerification from '@/components/openclaw/VaultExportVerification';
import FinalDeploymentLock from '@/components/openclaw/FinalDeploymentLock';
import OpenClawBaselineArchive from '@/components/openclaw/OpenClawBaselineArchive';
import OpenClawControlTower from '@/components/openclaw/OpenClawControlTower';
import OperatorDashboard from '@/components/openclaw/OperatorDashboard';
import PersistentHeader from '@/components/navigation/PersistentHeader';
import BackToDashboard from '@/components/navigation/BackToDashboard';
import PortalStatusSummary from '@/components/openclaw/PortalStatusSummary';
import MonitoringPlaceholderPanel from '@/components/openclaw/MonitoringPlaceholderPanel';

// Tab groups for organized navigation
const TAB_GROUPS = {
  daily_ops: {
    label: 'Daily Ops',
    tabs: [
      { id: 'control_tower', label: '🏛️ Control Tower' },
      { id: 'gateway_connector', label: '🔌 Gateway Connector' },
      { id: 'proposal_queue', label: '✉️ Proposal Queue' },
      { id: 'telemetry', label: '📊 Telemetry' },
      { id: 'status', label: '📡 Status' },
    ],
  },
  governance: {
    label: 'Governance',
    tabs: [
      { id: 'system_verify', label: '✓ System Verify' },
      { id: 'audit_trail', label: '🔐 Audit Trail' },
      { id: 'approval_workflow', label: 'Approval Workflow' },
      { id: 'policy_registry', label: 'Policy Registry' },
      { id: 'rbac_matrix', label: '🔐 RBAC Matrix' },
      { id: 'access_review', label: 'Access Review' },
    ],
  },
  security: {
    label: 'Security',
    tabs: [
      { id: 'safety_tests', label: '🛡️ Safety Tests' },
      { id: 'readiness_gate', label: '🔐 Readiness Gate' },
      { id: 'secret_vault', label: '🔐 Secret Vault' },
      { id: 'broker_vault', label: '💰 Broker Vault' },
      { id: 'secret_enforcement', label: '🔒 Secret Enforcement' },
      { id: 'session_timeout', label: '⏱️ Session Timeout' },
    ],
  },
  evidence: {
    label: 'Evidence',
    tabs: [
      { id: 'evidence_vault', label: '🗄️ Evidence Vault' },
      { id: 'vault_export', label: '🧾 Vault Export' },
      { id: 'final_lock', label: '🔐 Final Lock' },
      { id: 'baseline_archive', label: '🧷 Baseline Archive' },
      { id: 'export_packet', label: '📦 Export Packet' },
      { id: 'verify_packet', label: '🔎 Verify Packet' },
    ],
  },
  monitoring: {
    label: 'Monitoring',
    tabs: [
      { id: 'monitoring_setup',       label: '👁️ Monitoring Setup' },
      { id: 'watch_rules',            label: '📋 Watch Rules' },
      { id: 'alert_routes',           label: '🔔 Alert Routes' },
      { id: 'tradingview_signals',    label: '📈 TradingView Signals' },
      { id: 'openclaw_health',        label: '💚 OpenClaw Health' },
    ],
  },
  diagnostics: {
    label: 'Diagnostics',
    tabs: [
      { id: 'logs', label: 'Live Logs' },
      { id: 'nodes', label: 'Node Registry' },
      { id: 'workflows', label: 'Workflows' },
      { id: 'connectors', label: 'Connectors' },
    ],
  },
  advanced_audit: {
    label: 'Advanced Audit Tools',
    isToggleable: true,
    tabs: [
      { id: 'overview', label: '📊 Overview' },
      { id: 'bridge_contract', label: '📋 Bridge Contract' },
      { id: 'bridge_audit', label: '📊 Bridge Audit Log' },
      { id: 'phase2_tests', label: '🧪 Phase 2 Tests' },
      { id: 'safe_bridge', label: '⚡ Safe Command Test' },
      { id: 'runbook', label: 'Runbook' },
      { id: 'simulations', label: 'Simulations' },
      { id: 'snapshot', label: 'Snapshot' },
      { id: 'handoff', label: 'Handoff' },
      { id: 'production_checklist', label: 'Production Checklist' },
      { id: 'browser_read', label: 'Browser Read' },
      { id: 'risk_matrix', label: 'Risk Matrix' },
      { id: 'risk_map', label: 'Risk Map' },
      { id: 'audit', label: 'Executed Commands' },
      { id: 'readiness', label: 'Execution Readiness' },
      { id: 'legacy_review', label: '⚠️ Legacy Review' },
    ],
  },
};

export default function OpenClawControl() {
  const [activeView, setActiveView] = useState('control_tower');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [showAdvancedAudit, setShowAdvancedAudit] = useState(false);
  const [operatorMode, setOperatorMode] = useState('SIMPLE');
  const intervalRef = useRef(null);

  // Listen for navigation events dispatched by child panels (e.g. quick links in Overview)
  useEffect(() => {
    const handler = (e) => {
      setActiveView(e.detail);
    };
    window.addEventListener('openclaw:navigate', handler);
    return () => window.removeEventListener('openclaw:navigate', handler);
  }, []);

  const handleTabClick = useCallback((id) => {
    setActiveView(id);
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="bg-background font-mono">

      {/* Module Navigation */}
      <ModuleNav />

      {/* ── Persistent Header ── */}
      <PersistentHeader currentPage="Control Tower" />

      {/* ── Title bar with description ── */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 20 }} className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Terminal className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-[14px] font-bold tracking-wide text-slate-100">VeridanCore AI Operator Portal</h1>
            <p className="text-[9px] text-slate-300">OpenClaw Governed Control Panel · PREVIEW_ONLY · Execution locked until explicitly authorized by policy</p>
          </div>
          <Link to="/" className="px-3 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5">
            <Home className="w-3 h-3" />
            Home
          </Link>
          <Link to="/control-room" className="px-3 py-1.5 text-[9px] border border-border text-slate-300 hover:text-slate-100 hover:bg-secondary/50 transition-colors rounded font-semibold whitespace-nowrap">
            Control Room →
          </Link>
        </div>
      </div>

      {/* ── Status Summary Card ── */}
      <PortalStatusSummary gatewayOnline={online} loading={loading} operatorMode={operatorMode} />

      {/* ── Safety Boundary Banner ── */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 15 }} className="bg-amber-500/5 border-b-2 border-amber-500/30 px-6 py-4">
        <div className="flex items-start gap-4 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[12px] font-bold text-amber-600 mb-1 uppercase tracking-wide">PREVIEW / GOVERNED MODE</div>
            <p className="text-[10px] text-amber-600/90">OpenClaw cannot execute live actions from this screen. All actions require explicit approval, audit logging, and backend policy authorization.</p>
          </div>
        </div>
        
        {/* Status Chips */}
        <div className="flex flex-wrap gap-2">
          <div className="px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded text-[9px] font-semibold text-destructive uppercase tracking-wider">
            ✗ Live Execution: Disabled
          </div>
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-semibold text-amber-600 uppercase tracking-wider">
            ⚙ Browser Automation: Governed
          </div>
          <div className="px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded text-[9px] font-semibold text-destructive uppercase tracking-wider">
            ✗ API Trading: Disabled
          </div>
          <div className="px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded text-[9px] font-semibold text-destructive uppercase tracking-wider">
            ✗ Credential Entry: Disabled
          </div>
          <div className="px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded text-[9px] font-semibold text-destructive uppercase tracking-wider">
            ✗ Money Movement: Disabled
          </div>
        </div>
      </div>

      {/* ── Tab strip ── organized by groups with Operator Mode toggle */}
      <div
        style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}
        className="border-b border-border bg-card px-2 py-2 space-y-2"
      >
        {/* Header: Operator Mode Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <div className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Operator Mode</div>
          </div>
          <div className="flex gap-1">
            {['SIMPLE', 'ADVANCED'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setOperatorMode(mode)}
                className={`px-2.5 py-1 text-[9px] border font-semibold transition-colors ${
                  operatorMode === mode
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* External page links */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Link
            to="/command-queue"
            className="px-3 py-1.5 text-[11px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <List className="w-3 h-3" /> Command Queue
          </Link>
          <Link
            to="/browser-session"
            className="px-3 py-1.5 text-[11px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Monitor className="w-3 h-3" /> Browser Session
          </Link>
        </div>

        {/* Tab groups - filtered by Operator Mode */}
        {Object.entries(TAB_GROUPS).map(([groupKey, group]) => {
          // In SIMPLE mode, hide Diagnostics, Monitoring, and Advanced Audit Tools
          if (operatorMode === 'SIMPLE' && (groupKey === 'diagnostics' || groupKey === 'monitoring' || groupKey === 'advanced_audit')) {
            return null;
          }

          const isExpanded = groupKey !== 'advanced_audit' || showAdvancedAudit;
          return (
            <div key={groupKey}>
              {group.isToggleable ? (
                <button
                  type="button"
                  onClick={() => setShowAdvancedAudit(!showAdvancedAudit)}
                  className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mb-1.5"
                >
                  {showAdvancedAudit ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {group.label}
                </button>
              ) : (
                <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-1.5">{group.label}</div>
              )}
              {isExpanded && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {group.tabs.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTabClick(id)}
                      className={`px-3 py-1.5 text-[11px] border transition-colors whitespace-nowrap font-semibold ${
                        activeView === id
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Panel area ── scrollable, fills remaining height */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }} className="bg-background">

        {activeView === 'control_tower' && (
          <div className="p-6"><OperatorDashboard /></div>
        )}

        {activeView === 'gateway_connector' && (
          <div className="p-6"><OpenClawGatewayConnectorPanel /></div>
        )}

        {activeView === 'proposal_queue' && (
          <div className="flex flex-col h-full">
            <div className="shrink-0"><BackToDashboard /></div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="p-6"><OpenClawCommandProposalQueue /></div>
          </div>
        )}

        {activeView === 'system_verify' && (
          <div className="p-6"><SystemVerificationPanel /></div>
        )}

        {activeView === 'audit_trail' && (
          <div className="flex flex-col h-full">
            <div className="shrink-0"><BackToDashboard /></div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="p-6"><CommandAuditTrailPanel /></div>
          </div>
        )}

        {activeView === 'overview' && (
          <div className="p-6"><UnifiedOpenClawOverviewPanel /></div>
        )}

        {activeView === 'bridge_contract' && (
          <div className="p-6"><SafeBridgeContractPreview /></div>
        )}

        {activeView === 'bridge_audit' && (
          <div className="p-6"><Phase1DryRunAuditLog /></div>
        )}

        {activeView === 'phase2_tests' && (
          <div className="p-6"><Phase2PolicyTestCases /></div>
        )}

        {activeView === 'safe_bridge' && (
          <div style={{ height: '100%' }} className="flex flex-col">
            <div className="shrink-0"><BackToDashboard /></div>
            <div style={{ flex: 1, overflowY: 'auto' }}><SafeCommandBridge /></div>
          </div>
        )}

        {activeView === 'safety_tests' && (
          <div className="p-6"><ExecutionSafetyTests /></div>
        )}

        {activeView === 'readiness_gate' && (
          <div className="p-6"><ExecutionReadinessGate /></div>
        )}

        {activeView === 'approval_workflow' && (
          <div className="flex flex-col h-full">
            <div className="shrink-0"><BackToDashboard /></div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="p-6"><CommandApprovalWorkflowPanel /></div>
          </div>
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

        {activeView === 'legacy_review' && (
          <div className="p-6"><LegacyExecutionReviewPanel /></div>
        )}

        {activeView === 'rbac_matrix' && (
          <div className="p-6"><RolePermissionMatrixPanel /></div>
        )}

        {activeView === 'access_review' && (
          <div className="p-6"><UserAccessReviewPanel /></div>
        )}

        {activeView === 'session_timeout' && (
          <div className="p-6"><SessionTimeoutPanel /></div>
        )}

        {activeView === 'secret_vault' && (
          <div className="p-6"><SecretVaultRegistryPanel /></div>
        )}

        {activeView === 'broker_vault' && (
          <div className="p-6"><BrokerCredentialVaultPanel /></div>
        )}

        {activeView === 'secret_enforcement' && (
          <div className="p-6"><BackendSecretEnforcementPanel /></div>
        )}

        {activeView === 'export_packet' && (
          <div className="p-6"><ProposalReviewPacketExporter /></div>
        )}

        {activeView === 'verify_packet' && (
          <div className="p-6"><ProposalReviewPacketVerifier /></div>
        )}

        {activeView === 'evidence_vault' && (
          <div className="p-6"><AuditEvidenceVault /></div>
        )}

        {activeView === 'vault_export' && (
          <div className="p-6"><VaultExportVerification /></div>
        )}

        {activeView === 'final_lock' && (
          <div className="p-6"><FinalDeploymentLock /></div>
        )}

        {activeView === 'baseline_archive' && (
          <div className="p-6"><OpenClawBaselineArchive /></div>
        )}

        {['monitoring_setup', 'watch_rules', 'alert_routes', 'tradingview_signals', 'openclaw_health'].includes(activeView) && (
          <div className="p-6"><MonitoringPlaceholderPanel tabId={activeView} /></div>
        )}

        {activeView === 'status' && (
          <div className="p-6 max-w-4xl space-y-6">
            {/* System Status Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-border"></div>
                <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3">System Status</h2>
                <div className="h-px flex-1 bg-border"></div>
              </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">System Status</span>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-border text-[10px] text-slate-400 hover:text-slate-200 hover:bg-secondary/50 transition-colors font-semibold"
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
                  backend_unreachable: { bg: 'bg-secondary/50 border-border', text: 'text-slate-300', label: '— Backend Unreachable' },
                };
                const cfg = diagMap[status.diagnostic] || diagMap.backend_unreachable;
                return (
                  <div className={`mb-4 px-3 py-2.5 border ${cfg.bg}`}>
                    <div className={`text-[11px] font-semibold font-mono mb-0.5 ${cfg.text}`}>{cfg.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{status.diagnosticDetail}</div>
                  </div>
                );
              })()}

              <div className="mb-4">
                <label className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1 font-semibold">Gateway URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border text-[11px] text-blue-400 font-mono truncate select-all">
                    {status?.url || 'https://openclaw.veridancore.com'}
                  </div>
                  <button type="button" onClick={handleCopy} className="px-2.5 py-1.5 border border-border text-[10px] text-slate-400 hover:text-slate-200 hover:bg-secondary/50 transition-colors font-semibold">
                    <Copy className="w-3 h-3" />
                  </button>
                  {copied && <span className="text-[10px] text-primary font-semibold">Copied!</span>}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1 font-semibold">WebSocket URL</label>
                <div className="px-3 py-1.5 bg-secondary/50 border border-border text-[11px] text-blue-400 font-mono truncate">
                  {status?.wsUrl || 'wss://openclaw.veridancore.com'}
                </div>
              </div>

              {status?.lastChecked && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-4 font-semibold">
                  <Clock className="w-3 h-3" />
                  Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                </div>
              )}

              <div className="mb-3">
                <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">Veridan Safe Bridge · SESSION_STATUS</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Bridge</div>
                    <div className={bridgeStatus?.status === 'success' ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                      {bridgeStatus?.status === 'success' ? 'Connected' : bridgeStatus?.status || '—'}
                    </div>
                  </div>
                  <div className="bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Session Active</div>
                    <div className={bridgeStatus?.raw?.session_active ? 'text-primary font-semibold' : 'text-slate-300 font-semibold'}>
                      {bridgeStatus?.raw?.session_active !== undefined ? String(bridgeStatus.raw.session_active) : '—'}
                    </div>
                  </div>
                  <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Current URL</div>
                    <div className="text-blue-400 font-mono truncate">{bridgeStatus?.raw?.current_url || bridgeStatus?.targetUrl || '—'}</div>
                  </div>
                  {bridgeStatus?.error && (
                    <div className="col-span-2 bg-destructive/5 border border-destructive/20 px-3 py-2">
                      <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Error</div>
                      <div className="text-destructive font-mono text-[10px] break-all">{bridgeStatus.error}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5 text-[10px]">
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">OpenClaw Gateway</div>
                  <div className={online ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>{online ? 'Reachable' : 'Unreachable'}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">CF Access</div>
                  <div className={status?.protected ? 'text-amber-400 font-semibold' : 'text-slate-400 font-semibold'}>
                    {status?.protected ? 'Protected (expected)' : online ? 'Open' : '—'}
                  </div>
                </div>
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Browser Automation</div>
                  <div className="text-primary font-semibold">Operational</div>
                </div>
                <div className="bg-secondary/30 border border-border px-3 py-2">
                  <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">OpenClaw Version</div>
                  <div className="text-slate-200 font-mono">{status?.version || '2026.5.2'}</div>
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

            </div>

            {/* Safety & Security Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-border"></div>
                <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3">Safety & Security</h2>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              
              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 px-4 py-3 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-semibold text-amber-500 mb-0.5">Protected by Cloudflare Access</div>
                  <div className="text-[10px] text-slate-300">
                    Authentication is enforced at the gateway layer. This panel does not bypass or store Cloudflare credentials. X-Frame-Options: DENY is set at the gateway.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 px-4 py-3 rounded-lg">
                <Terminal className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-300 font-mono">
                  Stable backend baseline saved at <span className="text-primary font-semibold">/root/VERIDAN_OPENCLAW_STABLE_BASELINE.md</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-semibold">
              Status polling every 15 seconds · Read-only mode
            </div>
          </div>
        )}

      </div>
    </div>
  );
}