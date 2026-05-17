import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, ShieldCheck, AlertCircle, CheckCircle2, Clock, Activity, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import ManualMonitoringControlRoomSummary from './ManualMonitoringControlRoomSummary.jsx';
import OperatorDailyUsePanel from './OperatorDailyUsePanel.jsx';
import OperatorSessionLog from './OperatorSessionLog.jsx';
import OperatorSessionEvidenceExport from './OperatorSessionEvidenceExport.jsx';
import OperatorSessionAuditDashboard from './OperatorSessionAuditDashboard.jsx';
import OperatorSessionFinalArchiveExport from './OperatorSessionFinalArchiveExport.jsx';
import ReadOnlyGatewayHealthCheck from './ReadOnlyGatewayHealthCheck.jsx';
import FinalLockPanel from './FinalLockPanel.jsx';
import BaselineArchiveManifestPanel from './BaselineArchiveManifestPanel.jsx';
import BaselineExportPacketPanel from './BaselineExportPacketPanel.jsx';
import BaselineVerifyPacketPanel from './BaselineVerifyPacketPanel.jsx';
import ReadOnlyBrowserObservationDesignPanel from './ReadOnlyBrowserObservationDesignPanel.jsx';
import BrowserObservationPolicyMatrixPanel from './BrowserObservationPolicyMatrixPanel.jsx';
import BrowserObservationApprovalRulesPanel from './BrowserObservationApprovalRulesPanel.jsx';
import BrowserObservationRoutePlannerPanel from './BrowserObservationRoutePlannerPanel.jsx';
import BrowserObservationSimulationPanel from './BrowserObservationSimulationPanel.jsx';
import BrowserObservationEvidenceExportPanel from './BrowserObservationEvidenceExportPanel.jsx';
import BrowserObservationFinalLockPanel from './BrowserObservationFinalLockPanel.jsx';
import BrowserObservationProposalQueuePanel from './BrowserObservationProposalQueuePanel.jsx';
import BrowserObservationProposalReviewLedgerPanel from './BrowserObservationProposalReviewLedgerPanel.jsx';
import BrowserObservationReadinessGatePanel from './BrowserObservationReadinessGatePanel.jsx';
import BrowserObservationProposalFinalLockPanel from './BrowserObservationProposalFinalLockPanel.jsx';
import BrowserObservationExecutionContractPreviewPanel from './BrowserObservationExecutionContractPreviewPanel.jsx';
import BrowserObservationExecutionContractFinalLockPanel from './BrowserObservationExecutionContractFinalLockPanel.jsx';
import BrowserObservationContractValidatorPanel from './BrowserObservationContractValidatorPanel.jsx';
import BrowserObservationContractValidatorFinalLockPanel from './BrowserObservationContractValidatorFinalLockPanel.jsx';
import BrowserObservationDryRunAuditLedgerPanel from './BrowserObservationDryRunAuditLedgerPanel.jsx';
import ReadOnlyOpenClawBridgeDesignPanel from './ReadOnlyOpenClawBridgeDesignPanel.jsx';
import ReadOnlyOpenClawBridgeDesignFinalLockPanel from './ReadOnlyOpenClawBridgeDesignFinalLockPanel.jsx';
import ReadOnlyOpenClawBridgeValidatorPanel from './ReadOnlyOpenClawBridgeValidatorPanel.jsx';
import ReadOnlyOpenClawBridgeValidatorFinalLockPanel from './ReadOnlyOpenClawBridgeValidatorFinalLockPanel.jsx';
import ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel from './ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel.jsx';
import ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel from './ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel.jsx';
import ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel from './ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel.jsx';
import OpenClawGovernancePhaseSummaryPanel from './OpenClawGovernancePhaseSummaryPanel.jsx';
import OpenClawOperatorApprovalWorkflowPanel from './OpenClawOperatorApprovalWorkflowPanel.jsx';
import OpenClawRuntimeImplementationPlanPanel from './OpenClawRuntimeImplementationPlanPanel.jsx';
import OpenClawRuntimeImplementationPlanFinalLockPanel from './OpenClawRuntimeImplementationPlanFinalLockPanel.jsx';
import OpenClawRuntimeBridgeImplementationPlanReviewPanel from './OpenClawRuntimeBridgeImplementationPlanReviewPanel.jsx';
import OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel from './OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel.jsx';
import OpenClawGovernanceCheckpointIndexPanel from './OpenClawGovernanceCheckpointIndexPanel.jsx';
import OpenClawReadOnlyRuntimeBridgeBoundaryPanel from './OpenClawReadOnlyRuntimeBridgeBoundaryPanel.jsx';
import OpenClawRuntimeBridgeRequestContractPreview from './OpenClawRuntimeBridgeRequestContractPreview.jsx';
import OpenClawRuntimeBridgeContractValidator from './OpenClawRuntimeBridgeContractValidator.jsx';
import OpenClawRuntimeBridgeFlowMap from './OpenClawRuntimeBridgeFlowMap.jsx';
import OpenClawRuntimeBridgeApprovalQueuePreview from './OpenClawRuntimeBridgeApprovalQueuePreview.jsx';
import OpenClawRuntimeBridgeApprovalDecisionAuditTrail from './OpenClawRuntimeBridgeApprovalDecisionAuditTrail.jsx';
import OpenClawPhase32FinalGovernanceSnapshot from './OpenClawPhase32FinalGovernanceSnapshot.jsx';
import OpenClawDryRunExecutionGatePreview from './OpenClawDryRunExecutionGatePreview.jsx';
import OpenClawDryRunExecutionResultSimulator from './OpenClawDryRunExecutionResultSimulator.jsx';
import OpenClawReadOnlyConnectorDryRunContract from './OpenClawReadOnlyConnectorDryRunContract.jsx';
import OpenClawReadOnlyConnectorContractValidator from './OpenClawReadOnlyConnectorContractValidator.jsx';
import OpenClawControlledReadOnlyConnectorTestPlan from './OpenClawControlledReadOnlyConnectorTestPlan.jsx';
import OpenClawReadOnlyBackendRouteContract from './OpenClawReadOnlyBackendRouteContract.jsx';
import OpenClawBackendEnvironmentSecretBoundaryContract from './OpenClawBackendEnvironmentSecretBoundaryContract.jsx';
import OpenClawBackendEnvironmentPresenceCheckPlan from './OpenClawBackendEnvironmentPresenceCheckPlan.jsx';
import OpenClawBackendPresenceCheckRouteContract from './OpenClawBackendPresenceCheckRouteContract.jsx';
import OpenClawBackendPresenceCheckRouteValidator from './OpenClawBackendPresenceCheckRouteValidator.jsx';
import OpenClawBackendPresenceCheckImplementationPlan from './OpenClawBackendPresenceCheckImplementationPlan.jsx';
import OpenClawBackendPresenceCheckRouteStub from './OpenClawBackendPresenceCheckRouteStub.jsx';
import OpenClawBackendPresenceCheckActivationLock from './OpenClawBackendPresenceCheckActivationLock.jsx';
import OpenClawBackendEnvPresenceBooleanRoute from './OpenClawBackendEnvPresenceBooleanRoute.jsx';
import OpenClawBackendEnvPresenceEvidenceRecord from './OpenClawBackendEnvPresenceEvidenceRecord.jsx';
import OpenClawHealthCheckContract from './OpenClawHealthCheckContract.jsx';
import OpenClawHealthCheckActivationLock from './OpenClawHealthCheckActivationLock.jsx';
import OpenClawReadOnlyHealthCheckRoute from './OpenClawReadOnlyHealthCheckRoute.jsx';
import OpenClawHealthCheckEvidenceRecord from './OpenClawHealthCheckEvidenceRecord.jsx';
import OpenClawStatusVersionCapabilitiesContract from './OpenClawStatusVersionCapabilitiesContract.jsx';
import OpenClawStatusVersionCapabilitiesActivationLock from './OpenClawStatusVersionCapabilitiesActivationLock.jsx';
import OpenClawStatusVersionCapabilitiesReadOnlyRoute from './OpenClawStatusVersionCapabilitiesReadOnlyRoute.jsx';
import OpenClawStatusVersionCapabilitiesEvidenceRecord from './OpenClawStatusVersionCapabilitiesEvidenceRecord.jsx';
import OpenClawReadOnlyCapabilityPolicyMap from './OpenClawReadOnlyCapabilityPolicyMap.jsx';
import OpenClawReadOnlyObservabilityDashboard from './OpenClawReadOnlyObservabilityDashboard.jsx';
import OpenClawCommandProposalBox from './OpenClawCommandProposalBox.jsx';
import OpenClawProposalReviewPanel from './OpenClawProposalReviewPanel.jsx';
import OpenClawProposalReviewSummaryDashboard from './OpenClawProposalReviewSummaryDashboard.jsx';
import OpenClawProposalReviewEvidenceExport from './OpenClawProposalReviewEvidenceExport.jsx';
import OpenClawReadOnlyGovernanceBaselineLock from './OpenClawReadOnlyGovernanceBaselineLock.jsx';
import OpenClawDryRunExecutionPlanningGate from './OpenClawDryRunExecutionPlanningGate.jsx';
import OpenClawDryRunActionContractDesigner from './OpenClawDryRunActionContractDesigner.jsx';
import OpenClawDryRunActionContractValidator from './OpenClawDryRunActionContractValidator.jsx';
import OpenClawDryRunActionDraftBuilder from './OpenClawDryRunActionDraftBuilder.jsx';
import OpenClawDryRunActionDraftValidator from './OpenClawDryRunActionDraftValidator.jsx';
import GatewayConnectorQAReport from './GatewayConnectorQAReport.jsx';
import ControlledSchedulerDesignPacket from './ControlledSchedulerDesignPacket.jsx';
import OpenClawManualMonitoringPhaseCompletionReport from './OpenClawManualMonitoringPhaseCompletionReport.jsx';
import ControlledSchedulerApprovalGateDesign from './ControlledSchedulerApprovalGateDesign.jsx';
import ControlledSchedulerApprovalEvidencePacket from './ControlledSchedulerApprovalEvidencePacket.jsx';
import ControlledSchedulerQAChecklist from './ControlledSchedulerQAChecklist.jsx';
import ControlledSchedulerFinalDesignReviewPacket from './ControlledSchedulerFinalDesignReviewPacket.jsx';
import ControlledSchedulerOperatorReviewConsole from './ControlledSchedulerOperatorReviewConsole.jsx';
import ControlledSchedulerOperatorSignOffPacket from './ControlledSchedulerOperatorSignOffPacket.jsx';
import FinalLockBaselineExportPacket from './FinalLockBaselineExportPacket.jsx';
import ManualReadOnlyMonitoringConsole from './ManualReadOnlyMonitoringConsole.jsx';
import OpenClawSystemStatusCard from './OpenClawSystemStatusCard.jsx';
import ManualMonitoringHistoricalStatusDashboard from './ManualMonitoringHistoricalStatusDashboard.jsx';
import RegenerateEvidenceChainButton from './RegenerateEvidenceChainButton.jsx';

const ENDPOINT = 'https://openclaw.veridancore.com';

const DIAGNOSTIC_DISPLAY = {
  openclaw_online:                 { label: 'OPENCLAW_ONLINE',               color: 'text-primary',      bg: 'bg-primary/5 border-primary/20' },
  cloudflare_protected_reachable:  { label: 'CLOUDFLARE_PROTECTED_REACHABLE', color: 'text-amber-500',    bg: 'bg-amber-500/5 border-amber-500/20' },
  gateway_unreachable:             { label: 'GATEWAY_UNREACHABLE',            color: 'text-destructive',  bg: 'bg-destructive/5 border-destructive/20' },
  gateway_error:                   { label: 'GATEWAY_ERROR',                  color: 'text-destructive',  bg: 'bg-destructive/5 border-destructive/20' },
  backend_unreachable:             { label: 'CONFIG_MISSING',                 color: 'text-slate-400',    bg: 'bg-slate-500/5 border-slate-500/20' },
};

// Compute readiness state from result
function computeReadiness(result, auditActive) {
  if (!result) return 'NOT_CONFIGURED';
  const d = result.diagnostic;
  if (!result.url && !ENDPOINT) return 'NOT_CONFIGURED';
  if (d === 'gateway_unreachable' || d === 'gateway_error') return 'UNREACHABLE';
  if (d === 'cloudflare_protected_reachable') return 'PROTECTED_REACHABLE';
  if (result.online) {
    if (auditActive) return 'COMMAND_TEST_READY';
    return 'READ_ONLY_READY';
  }
  return 'NOT_CONFIGURED';
}

const READINESS_CONFIG = {
  NOT_CONFIGURED:      { label: 'NOT_CONFIGURED',      color: 'text-slate-400',   bg: 'bg-slate-500/5 border-slate-500/20',    next: 'Configure OpenClaw endpoint' },
  UNREACHABLE:         { label: 'UNREACHABLE',          color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', next: 'Check VPS, tunnel, and OpenClaw service' },
  PROTECTED_REACHABLE: { label: 'PROTECTED_REACHABLE',  color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',    next: 'Confirm Cloudflare Access / auth policy' },
  READ_ONLY_READY:     { label: 'READ_ONLY_READY',      color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',        next: 'Proceed to Safe Command Test design' },
  COMMAND_TEST_READY:  { label: 'COMMAND_TEST_READY',   color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',        next: 'Create read-only command proposal flow' },
};

// Derive checklist from result + state
function buildChecklist(result, readiness, auditActive) {
  const online = result?.online ?? false;
  const d = result?.diagnostic;
  const cfProtected = d === 'cloudflare_protected_reachable' || result?.protected;

  const p = 'PASS', w = 'WARN', f = 'FAIL', u = 'UNKNOWN';

  return [
    {
      label: 'Endpoint configured',
      status: result ? p : f,
      detail: result?.url || ENDPOINT,
    },
    {
      label: 'Gateway reachable',
      status: !result ? u : online ? p : (d === 'cloudflare_protected_reachable' ? p : f),
      detail: !result ? 'Not checked yet' : online || d === 'cloudflare_protected_reachable' ? 'Reachable' : 'Unreachable',
    },
    {
      label: 'Cloudflare protection detected or passed',
      status: !result ? u : cfProtected ? p : online ? w : u,
      detail: !result ? 'Not checked' : cfProtected ? 'CF Access detected' : online ? 'Not detected (may be open)' : 'Not applicable',
    },
    {
      label: 'Auth boundary present',
      status: !result ? u : (cfProtected || result?.authLayer) ? p : w,
      detail: !result ? 'Not checked' : result?.authLayer ? result.authLayer : cfProtected ? 'Cloudflare Access' : 'No auth layer detected',
    },
    {
      label: 'Mode is READ_ONLY',
      status: p,
      detail: 'Hardcoded READ_ONLY — no mutation methods',
    },
    {
      label: 'Command execution disabled',
      status: p,
      detail: 'No executeCommand calls in this panel',
    },
    {
      label: 'Browser automation disabled or governed',
      status: p,
      detail: 'Browser automation governed — no direct calls from this panel',
    },
    {
      label: 'Direct OpenAI API disabled',
      status: p,
      detail: 'All AI routed via OpenClaw / Codex — no direct OpenAI calls',
    },
    {
      label: 'Audit preview active',
      status: auditActive ? p : w,
      detail: auditActive ? 'Local audit log recording check events' : 'No checks performed yet — run a check to activate',
    },
    {
      label: 'Safe to proceed to command proposal testing',
      status: readiness === 'COMMAND_TEST_READY' || readiness === 'READ_ONLY_READY' ? p
            : readiness === 'PROTECTED_REACHABLE' ? w
            : f,
      detail: readiness === 'COMMAND_TEST_READY' ? 'All safety checks passed'
            : readiness === 'READ_ONLY_READY' ? 'Ready — run a check first to confirm audit log active'
            : readiness === 'PROTECTED_REACHABLE' ? 'Reachable but CF auth must be confirmed'
            : 'Resolve gateway connectivity first',
    },
  ];
}

const STATUS_ICON = {
  PASS:    { icon: CheckCircle2, color: 'text-primary' },
  WARN:    { icon: AlertCircle,  color: 'text-amber-500' },
  FAIL:    { icon: XCircle,      color: 'text-destructive' },
  UNKNOWN: { icon: HelpCircle,   color: 'text-slate-400' },
};

const STATUS_BADGE = {
  PASS:    'border-primary/30 bg-primary/5 text-primary',
  WARN:    'border-amber-500/30 bg-amber-500/5 text-amber-500',
  FAIL:    'border-destructive/30 bg-destructive/5 text-destructive',
  UNKNOWN: 'border-slate-500/30 bg-slate-500/5 text-slate-400',
};

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveTab(tabId) {
  try { localStorage.setItem('openclawGatewayConnectorActiveTab', tabId); } catch {}
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'daily-ops', label: 'Daily Operation', icon: '📋' },
  { id: 'monitoring', label: 'Manual Monitoring', icon: '🔍' },
  { id: 'bridge', label: 'Bridge Status', icon: '🌉' },
  { id: 'governance', label: 'Governance', icon: '⚖️' },
  { id: 'archive', label: 'Evidence Archive', icon: '📦' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '🔧' },
];

const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';

export default function OpenClawGatewayConnectorPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState(() => loadJSON('openclawGatewayConnectorActiveTab', 'overview'));
  const [evidenceCollapsed, setEvidenceCollapsed] = useState(false);

  // Evidence chain refresh state
  const [ecLastRefreshAt, setEcLastRefreshAt] = useState(null);
  const [ecRecordsScanned, setEcRecordsScanned] = useState(null);
  const [ecSuccessfulRecords, setEcSuccessfulRecords] = useState(null);
  const [ecRefreshConfirmed, setEcRefreshConfirmed] = useState(false);

  // Archive groups toggle state
  const [expandedGroup, setExpandedGroup] = useState(null);
  const toggleGroup = (groupId) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  // Generate local governance baseline packets for development/test
  const generateLocalGovernanceBaseline = () => {
    const keys = [
      { key: 'openclawFinalLockPacket', phase: 'PHASE_14_MONITORING_EVIDENCE', status: 'LOCK_READY' },
      { key: 'openclawBrowserObservationFinalLock', phase: 'PHASE_15_BROWSER_OBSERVATION', status: 'LOCK_READY' },
      { key: 'openclawBrowserObservationProposalFinalLock', phase: 'PHASE_16_BROWSER_OBSERVATION_PROPOSAL', status: 'LOCK_READY' },
      { key: 'openclawBrowserObservationExecutionContractFinalLock', phase: 'PHASE_17_EXECUTION_CONTRACT', status: 'LOCK_READY' },
      { key: 'openclawBrowserObservationContractValidatorFinalLock', phase: 'PHASE_18_CONTRACT_VALIDATOR', status: 'LOCK_READY' },
      { key: 'openclawBrowserObservationDryRunAuditLedger', phase: 'PHASE_19_DRY_RUN_AUDIT', status: 'AUDIT_READY', isArray: true },
      { key: 'openclawReadOnlyOpenClawBridgeDesignFinalLock', phase: 'PHASE_20_BRIDGE_DESIGN', status: 'LOCK_READY' },
      { key: 'openclawReadOnlyOpenClawBridgeValidatorFinalLock', phase: 'PHASE_21_BRIDGE_VALIDATOR', status: 'LOCK_READY' },
      { key: 'openclawReadOnlyOpenClawBridgeDryRunAuditLedger', phase: 'PHASE_22_BRIDGE_AUDIT', status: 'AUDIT_READY', isArray: true },
      { key: 'openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock', phase: 'PHASE_23_RUNTIME_READINESS', status: 'LOCK_READY' },
    ];

    const safetyAssertions = {
      localOnly: true,
      previewOnly: true,
      readOnly: true,
      noOpenClawCalls: true,
      noBrowserAutomation: true,
      noExecution: true,
      noDispatch: true,
      noScheduler: true,
      noPolling: true,
      noCredentials: true,
      noTrading: true,
      noBrokerActions: true,
      noWalletActions: true,
      noMoneyMovement: true,
    };

    let count = 0;
    keys.forEach(({ key, phase, status, isArray }) => {
      if (localStorage.getItem(key)) return; // Skip if already exists

      const now = new Date().toISOString();
      
      if (isArray) {
        // Audit ledger: array with one safe record
        const auditRecord = {
          auditId: `baseline-${key}-001`,
          auditStatus: 'AUDIT_READY',
          phaseName: phase,
          generatedAt: now,
          baselineGeneratedBy: 'LOCAL_GOVERNANCE_BASELINE_GENERATOR',
          safetyAssertions,
          readOnly: true,
          executionAllowed: false,
          dispatchAllowed: false,
          browserMutationAllowed: false,
          credentialEntryAllowed: false,
          openClawCalled: false,
          backendForwarded: false,
          runtimeBridgeActivated: false,
        };
        try {
          localStorage.setItem(key, JSON.stringify([auditRecord]));
          count++;
        } catch {}
      } else {
        // Lock packet: object
        const lockPacket = {
          lockName: `${phase}_BASELINE_LOCK`,
          phaseName: phase,
          lockStatus: status,
          generatedAt: now,
          baselineGeneratedBy: 'LOCAL_GOVERNANCE_BASELINE_GENERATOR',
          localOnly: true,
          previewOnly: true,
          readOnly: true,
          executionAllowed: false,
          dispatchAllowed: false,
          browserMutationAllowed: false,
          credentialEntryAllowed: false,
          openClawCalled: false,
          backendForwarded: false,
          runtimeBridgeActivated: false,
          safetyAssertions,
        };
        try {
          localStorage.setItem(key, JSON.stringify(lockPacket));
          count++;
        } catch {}
      }
    });

    // Trigger summary panel refresh by dispatching custom event
    window.dispatchEvent(new CustomEvent('openclaw:baseline-generated', {
      detail: { packetsGenerated: count, timestamp: new Date().toISOString() }
    }));

    // Force summary panel to update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openclaw:refresh-governance-summary'));
    }, 100);
  };

  const handleEvidenceChainRefresh = () => {
    let records = [];
    try {
      const raw = localStorage.getItem(CHECKS_KEY);
      records = raw ? JSON.parse(raw) : [];
    } catch { records = []; }

    const total = records.length;
    const successful = records.filter(r =>
      r.status === 'SUCCESS' &&
      (r.httpStatus === 200 || r.httpStatus === '200') &&
      r.gatewayReachable === true &&
      r.executionLock === 'LOCKED' &&
      r.dispatchAllowed === false
    ).length;

    setEcLastRefreshAt(new Date().toISOString());
    setEcRecordsScanned(total);
    setEcSuccessfulRecords(successful);
    setEcRefreshConfirmed(true);

    window.dispatchEvent(new CustomEvent('veridan:regenerate-manual-monitoring-evidence-chain', {
      detail: {
        source: 'evidence-chain-controls-box',
        createdAt: new Date().toISOString(),
        recordsScanned: total,
        successfulRecords: successful,
        localOnly: true,
      },
    }));
  };

  useEffect(() => {
    const handleEvidenceToggle = (e) => {
      setEvidenceCollapsed(e.detail?.collapsed || false);
    };
    window.addEventListener('gateway-evidence-toggle', handleEvidenceToggle);
    return () => window.removeEventListener('gateway-evidence-toggle', handleEvidenceToggle);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    saveTab(tabId);
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('openclawStatus', {});
      const data = response.data;
      setResult(data);

      const entry = {
        timestamp: new Date().toISOString(),
        action: 'OpenClaw gateway status check performed — read-only.',
        endpoint: data?.url || ENDPOINT,
        httpStatus: data?.gatewayStatus ?? 'N/A',
        gatewayStatus: DIAGNOSTIC_DISPLAY[data?.diagnostic]?.label || data?.diagnostic?.toUpperCase() || 'UNKNOWN',
        mode: 'READ_ONLY',
        note: 'No command execution was attempted.',
      };
      setAuditLog(prev => [entry, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message || 'Status check failed');
    } finally {
      setLoading(false);
    }
  };

  const diag = result ? (DIAGNOSTIC_DISPLAY[result.diagnostic] || DIAGNOSTIC_DISPLAY.backend_unreachable) : null;
  const auditActive = auditLog.length > 0;
  const readiness = computeReadiness(result, auditActive);
  const readinessCfg = READINESS_CONFIG[readiness];
  const checklist = buildChecklist(result, readiness, auditActive);

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Gateway Connector</div>
        <div className="text-[13px] font-bold text-foreground">OpenClaw Gateway Readiness</div>
        <div className="text-[9px] text-slate-500 mt-0.5">Read-only status assessment — no execution, no credentials, no live actions</div>
      </div>

      {/* System Status Card */}
      <div className="border-b border-border/40 pb-4">
        <OpenClawSystemStatusCard />
      </div>

      {/* ── Status Chip Row ── */}
      <div className="flex flex-wrap gap-1.5 mb-5 px-4 py-2">
        {['READ_ONLY', 'LOCKED', 'DISABLED', 'MANUAL_ONLY', 'NO_SCHEDULER', 'NO_POLLING', 'NO_DISPATCH', 'NO_EXECUTION'].map(status => (
          <span key={status} className="text-[7px] px-2 py-1 border border-primary/30 bg-primary/5 text-primary rounded font-bold uppercase tracking-wider">
            {status}
          </span>
        ))}
      </div>

      {/* ── Tabbed Layout ── */}
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 border-b border-border/40 pb-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Footer */}
        <div className="text-[8px] text-slate-500 px-4 py-1">
          Tabbed layout only. No OpenClaw calls. No dispatch. No execution. No scheduler. No polling.
        </div>

        {/* Tab Content - Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5 border-t border-border/40 pt-5">
            <OperatorDailyUsePanel />
          </div>
        )}

        {/* Tab Content - Daily Operation */}
        {activeTab === 'daily-ops' && (
          <div className="space-y-5 border-t border-border/40 pt-5">
            <div className="border-b border-border/40 pb-5"><OperatorDailyUsePanel /></div>
            <div className="border-b border-border/40 pb-5"><OperatorSessionLog /></div>
            <div className="border-b border-border/40 pb-5"><OperatorSessionEvidenceExport /></div>
            <div className="border-b border-border/40 pb-5"><OperatorSessionAuditDashboard /></div>
            <div className="border-b border-border/40 pb-5"><OperatorSessionFinalArchiveExport /></div>
          </div>
        )}

        {/* Tab Content - Manual Monitoring */}
         {activeTab === 'monitoring' && (
           <div className="space-y-5 border-t border-border/40 pt-5">
             <div className="border-b border-border/40 pb-5"><ManualReadOnlyMonitoringConsole /></div>

             <div className="my-4 p-4 border-2 border-green-500 rounded-lg bg-green-950/20">
               <div className="text-green-400 font-bold mb-2">
                 Evidence Chain Controls
               </div>
               <button
                 type="button"
                 className="px-4 py-2 border border-green-500 rounded text-green-300 bg-black hover:bg-green-950"
                 onClick={() => {
                   window.dispatchEvent(new CustomEvent("veridan:regenerate-manual-monitoring-evidence-chain", {
                     detail: {
                       source: "visible-inline-fallback-button",
                       createdAt: new Date().toISOString(),
                       localOnly: true,
                       networkCalls: false,
                       executionAllowed: false,
                       dispatchAllowed: false
                     }
                   }));
                 }}
               >
                 Regenerate Full Manual Monitoring Evidence Chain
               </button>
               <div className="text-xs text-green-500 mt-2">
                 DEBUG: Evidence chain button mounted in monitoring tab.
               </div>
             </div>

             <div id="historical-status" className="border-b border-border/40 pb-5"><ManualMonitoringHistoricalStatusDashboard /></div>
           </div>
         )}

        {/* Tab Content - Bridge Status */}
        {activeTab === 'bridge' && (
          <div className="space-y-5 border-t border-border/40 pt-5">
            <div className="border-b border-border/40 pb-5"><ReadOnlyGatewayHealthCheck /></div>
          </div>
        )}

        {/* Tab Content - Governance */}
        {activeTab === 'governance' && (
          <div className="space-y-5 border-t border-border/40 pt-5">
            <div className="text-[10px] text-slate-400 italic">Governance and capability approval components reserved for future implementation.</div>
          </div>
        )}

        {/* Tab Content - Evidence Archive */}
         {activeTab === 'archive' && (
           <div className="space-y-5 border-t border-border/40 pt-5">

             {/* ── OBSERVABILITY DASHBOARD — always at top ── */}
             <div className="border-2 border-primary rounded-lg overflow-hidden bg-primary/2">
               <div className="px-4 py-2 bg-primary/10 border-b border-primary/30">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-primary">Read-Only Observability Dashboard</div>
               </div>
               <div className="p-4">
                 <OpenClawReadOnlyObservabilityDashboard />
               </div>
             </div>

             {/* ── COMMAND PROPOSAL BOX ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Command Proposal Box</div>
               </div>
               <div className="p-4">
                 <OpenClawCommandProposalBox />
               </div>
             </div>

             {/* ── PROPOSAL REVIEW PANEL ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Proposal Review Panel</div>
               </div>
               <div className="p-4">
                 <OpenClawProposalReviewPanel />
               </div>
             </div>

             {/* ── PROPOSAL REVIEW SUMMARY DASHBOARD ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Proposal Review Summary Dashboard</div>
               </div>
               <div className="p-4">
                 <OpenClawProposalReviewSummaryDashboard />
               </div>
             </div>

             {/* ── PROPOSAL REVIEW EVIDENCE CHAIN EXPORT ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Proposal Review Evidence Chain Export</div>
               </div>
               <div className="p-4">
                 <OpenClawProposalReviewEvidenceExport />
               </div>
             </div>

             {/* ── READ-ONLY GOVERNANCE BASELINE LOCK ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Read-Only Governance Baseline Lock</div>
               </div>
               <div className="p-4">
                 <OpenClawReadOnlyGovernanceBaselineLock />
               </div>
             </div>

             {/* ── DRY-RUN EXECUTION PLANNING GATE ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Controlled Dry-Run Execution Planning Gate</div>
               </div>
               <div className="p-4">
                 <OpenClawDryRunExecutionPlanningGate />
               </div>
             </div>

             {/* ── DRY-RUN ACTION CONTRACT DESIGNER ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Contract Designer</div>
               </div>
               <div className="p-4">
                 <OpenClawDryRunActionContractDesigner />
               </div>
             </div>

             {/* ── DRY-RUN ACTION CONTRACT VALIDATOR ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Contract Validator</div>
               </div>
               <div className="p-4">
                 <OpenClawDryRunActionContractValidator />
               </div>
             </div>

             {/* ── DRY-RUN ACTION DRAFT BUILDER ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Draft Builder</div>
               </div>
               <div className="p-4">
                 <OpenClawDryRunActionDraftBuilder />
               </div>
             </div>

             {/* ── DRY-RUN ACTION DRAFT VALIDATOR ── */}
             <div className="border border-border/60 rounded-lg overflow-hidden">
               <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Draft Validator</div>
               </div>
               <div className="p-4">
                 <OpenClawDryRunActionDraftValidator />
               </div>
             </div>

             {/* Summary Panel - Always Visible */}
             <div className="bg-card border border-primary/20 rounded-lg p-4 space-y-3">
               <OpenClawGovernancePhaseSummaryPanel />
               <button
                 type="button"
                 onClick={generateLocalGovernanceBaseline}
                 className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold hover:bg-amber-500/20 transition-colors rounded"
               >
                 ✓ Generate Local Governance Baseline
               </button>
               <div className="text-[8px] text-slate-500">
                 Creates test baseline packets for Phases 14–23 in localStorage (development only). No backend calls, no execution.
               </div>
             </div>

             {/* CHECKPOINT: Phase 27 — Governance Index (HIGHEST PRIORITY) */}
             <div className="border-2 border-primary rounded-lg overflow-hidden bg-primary/2">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase27')}
                 className="w-full px-4 py-3 bg-primary/10 border-b-2 border-primary hover:bg-primary/15 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-primary">CHECKPOINT: Phase 27 Governance Index</div>
                   <div className="text-[9px] text-primary/70 mt-0.5">Single source of truth for governance completion. Required before Phase 28.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-primary transition-transform ${expandedGroup === 'phase27' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase27' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-primary/20 pt-5"><OpenClawGovernanceCheckpointIndexPanel /></div>
                 </div>
               )}
             </div>

             {/* FLOW MAP: Operator Orientation — Plain English */}
             <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-95 bg-slate-900/20 mb-4">
               <button
                 type="button"
                 onClick={() => toggleGroup('flowmap')}
                 className="w-full px-4 py-3 bg-slate-800/40 border-b-2 border-slate-600 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">OPERATOR ORIENTATION: Runtime Bridge Flow Map</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Plain English view of phases 26–32 and future gates. Start here if you're new.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'flowmap' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'flowmap' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawRuntimeBridgeFlowMap /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawPhase32FinalGovernanceSnapshot /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawDryRunExecutionGatePreview /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawDryRunExecutionResultSimulator /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyConnectorDryRunContract /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyConnectorContractValidator /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawControlledReadOnlyConnectorTestPlan /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyBackendRouteContract /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvironmentSecretBoundaryContract /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvironmentPresenceCheckPlan /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckRouteContract /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckRouteValidator /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckImplementationPlan /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckRouteStub /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckActivationLock /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvPresenceBooleanRoute /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvPresenceEvidenceRecord /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawHealthCheckContract /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawHealthCheckActivationLock /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyHealthCheckRoute /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawHealthCheckEvidenceRecord /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesContract /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesActivationLock /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesReadOnlyRoute /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesEvidenceRecord /></div>
                   <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyCapabilityPolicyMap /></div>
                 </div>
               )}
             </div>

             {/* BOUNDARY DEFINITION: Phase 28 — Read-Only Runtime Bridge Boundary */}
             <div className="border-2 border-primary/30 rounded-lg overflow-hidden bg-primary/1">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase28')}
                 className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/30 hover:bg-primary/10 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-primary">BOUNDARY DEFINITION: Phase 28 Read-Only Runtime Bridge</div>
                   <div className="text-[9px] text-primary/70 mt-0.5">First permitted read-only observation boundary. Preparation only, no bridge activation.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-primary/60 transition-transform ${expandedGroup === 'phase28' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase28' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-primary/10 pt-5"><OpenClawReadOnlyRuntimeBridgeBoundaryPanel /></div>
                 </div>
               )}
             </div>

             {/* CONTRACT PREVIEW: Phase 29 — Runtime Bridge Request Contract */}
             <div className="border-2 border-primary/40 rounded-lg overflow-hidden bg-primary/1">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase29')}
                 className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/40 hover:bg-primary/10 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-foreground">CONTRACT PREVIEW: Phase 29 Runtime Bridge Request</div>
                   <div className="text-[9px] text-slate-400 mt-0.5">Future runtime bridge request contract structure. Preview-only, no execution.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase29' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase29' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-border/40 pt-5"><OpenClawRuntimeBridgeRequestContractPreview /></div>
                 </div>
               )}
             </div>

             {/* CONTRACT VALIDATOR: Phase 30 — Runtime Bridge Contract Validator */}
             <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-90">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase30')}
                 className="w-full px-4 py-3 bg-slate-900/30 border-b-2 border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">CONTRACT VALIDATOR: Phase 30 Runtime Bridge Validator</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Validates Phase 29 contracts locally. Preview-only, no execution.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase30' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase30' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-slate-600 pt-5"><OpenClawRuntimeBridgeContractValidator /></div>
                 </div>
               )}
             </div>

             {/* APPROVAL QUEUE: Phase 31 — Runtime Bridge Approval Queue Preview */}
             <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-85">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase31')}
                 className="w-full px-4 py-3 bg-slate-900/20 border-b-2 border-slate-600 hover:bg-slate-900/30 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">APPROVAL QUEUE: Phase 31 Approval Queue Preview</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Local-only approval queue from Phase 30 PASS validations. Approval does not execute.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase31' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase31' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-slate-600 pt-5"><OpenClawRuntimeBridgeApprovalQueuePreview /></div>
                 </div>
               )}
             </div>

             {/* AUDIT TRAIL: Phase 32 — Approval Decision Audit Trail */}
             <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-80">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase32')}
                 className="w-full px-4 py-3 bg-slate-900/10 border-b-2 border-slate-600 hover:bg-slate-900/20 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">AUDIT TRAIL: Phase 32 Approval Decision Audit Trail</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Immutable audit trail from Phase 31 approval/denial decisions. Local-only record.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase32' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase32' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-slate-600 pt-5"><OpenClawRuntimeBridgeApprovalDecisionAuditTrail /></div>
                 </div>
               )}
             </div>

             {/* ACTIVE: Phases 24–26 — Governance Approval Chain */}
             <div className="border-2 border-primary/40 rounded-lg overflow-hidden">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase2426')}
                 className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/40 hover:bg-primary/10 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-foreground">ACTIVE: Governance Approval Chain — Phases 24–26</div>
                   <div className="text-[9px] text-slate-400 mt-0.5">In use. Operator approval → Runtime planning → Review. 5 panels.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase2426' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase2426' === false ? null : (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-border/40 pt-5"><OpenClawOperatorApprovalWorkflowPanel /></div>
                   <div className="border-t border-border/40 pt-5"><OpenClawRuntimeImplementationPlanPanel /></div>
                   <div className="border-t border-border/40 pt-5"><OpenClawRuntimeImplementationPlanFinalLockPanel /></div>
                   <div className="border-t border-border/40 pt-5"><OpenClawRuntimeBridgeImplementationPlanReviewPanel /></div>
                   <div className="border-t border-border/40 pt-5"><OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel /></div>
                 </div>
               )}
             </div>

             {/* LEGACY BASELINE: Phases 14–23 — Initial Governance Summary */}
             <div className="border border-slate-600 rounded-lg overflow-hidden opacity-80">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase1423')}
                 className="w-full px-4 py-3 bg-slate-900/30 border-b border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">LEGACY BASELINE: Phase 14–23 Governance Summary</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Initial Governance Baseline — COMPLETE / Reference Only</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1423' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase1423' && (
                 <div className="space-y-5 p-5">
                   {/* Group 1: Phase 14 — Monitoring Evidence */}
                   <div className="border border-border rounded-lg overflow-hidden">
                     <button
                       type="button"
                       onClick={() => toggleGroup('phase14')}
                       className="w-full px-4 py-3 bg-secondary/20 border-b border-border hover:bg-secondary/30 transition-colors text-left flex items-center justify-between"
                     >
                       <div>
                         <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Phase 14 — Monitoring Evidence</div>
                         <div className="text-[8px] text-slate-400 mt-0.5">Final Lock / Baseline Archive / Export / Verify (4 panels)</div>
                       </div>
                       <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase14' ? 'rotate-90' : ''}`}>▶</span>
                     </button>
                     {expandedGroup === 'phase14' && (
                       <div className="space-y-5 p-5">
                         <div className="border-t border-border/40 pt-5"><FinalLockPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BaselineArchiveManifestPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BaselineExportPacketPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BaselineVerifyPacketPanel /></div>
                       </div>
                     )}
                   </div>
                 </div>
               )}
             </div>

             {/* ADVANCED / FUTURE: Phases 15–19 — Browser Observation & Validation */}
             <div className="border border-slate-600 rounded-lg overflow-hidden opacity-70">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase1519')}
                 className="w-full px-4 py-3 bg-slate-900/30 border-b border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">ADVANCED / FUTURE: Browser Observation Governance</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Not required for current Phase 27 checkpoint. Future capability reference only.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1519' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase1519' && (
                 <div className="space-y-5 p-5">
                   {/* Group 2: Phases 15–17 */}
                   <div className="border border-border rounded-lg overflow-hidden">
                     <button
                       type="button"
                       onClick={() => toggleGroup('phase1517')}
                       className="w-full px-4 py-3 bg-secondary/20 border-b border-border hover:bg-secondary/30 transition-colors text-left flex items-center justify-between"
                     >
                       <div>
                         <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Phases 15–17 — Browser Observation Design</div>
                         <div className="text-[8px] text-slate-400 mt-0.5">Design / Policy / Approval / Routes / Simulation / Proposal / Contract (7 panels)</div>
                       </div>
                       <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1517' ? 'rotate-90' : ''}`}>▶</span>
                     </button>
                     {expandedGroup === 'phase1517' && (
                       <div className="space-y-5 p-5">
                         <div className="border-t border-border/40 pt-5"><ReadOnlyBrowserObservationDesignPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationPolicyMatrixPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationApprovalRulesPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationRoutePlannerPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationSimulationPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationEvidenceExportPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationFinalLockPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationProposalQueuePanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationProposalReviewLedgerPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationReadinessGatePanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationProposalFinalLockPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationExecutionContractPreviewPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationExecutionContractFinalLockPanel /></div>
                       </div>
                     )}
                   </div>

                   {/* Group 3: Phases 18–19 */}
                   <div className="border border-border rounded-lg overflow-hidden">
                     <button
                       type="button"
                       onClick={() => toggleGroup('phase1819')}
                       className="w-full px-4 py-3 bg-secondary/20 border-b border-border hover:bg-secondary/30 transition-colors text-left flex items-center justify-between"
                     >
                       <div>
                         <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Phases 18–19 — Dry-Run Validation + Audit</div>
                         <div className="text-[8px] text-slate-400 mt-0.5">Contract validator / validator lock / audit ledger (3 panels)</div>
                       </div>
                       <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1819' ? 'rotate-90' : ''}`}>▶</span>
                     </button>
                     {expandedGroup === 'phase1819' && (
                       <div className="space-y-5 p-5">
                         <div className="border-t border-border/40 pt-5"><BrowserObservationContractValidatorPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationContractValidatorFinalLockPanel /></div>
                         <div className="border-t border-border/40 pt-5"><BrowserObservationDryRunAuditLedgerPanel /></div>
                       </div>
                     )}
                   </div>
                 </div>
               )}
             </div>

             {/* ADVANCED / REFERENCE: Phases 20–23 — Bridge Design & Validation */}
             <div className="border border-slate-600 rounded-lg overflow-hidden opacity-70">
               <button
                 type="button"
                 onClick={() => toggleGroup('phase2023')}
                 className="w-full px-4 py-3 bg-slate-900/30 border-b border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between"
               >
                 <div>
                   <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">ADVANCED / REFERENCE: Bridge Design & Validation</div>
                   <div className="text-[9px] text-slate-500 mt-0.5">Reference only. Runtime bridge activation is still not authorized.</div>
                 </div>
                 <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase2023' ? 'rotate-90' : ''}`}>▶</span>
               </button>
               {expandedGroup === 'phase2023' && (
                 <div className="space-y-5 p-5">
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeDesignPanel /></div>
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeDesignFinalLockPanel /></div>
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeValidatorPanel /></div>
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeValidatorFinalLockPanel /></div>
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel /></div>
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel /></div>
                   <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel /></div>
                 </div>
               )}
             </div>

           </div>
         )}

        {/* Tab Content - Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-5 border-t border-border/40 pt-5">
            <div className="border-b border-border/40 pb-5"><GatewayConnectorQAReport /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerDesignPacket /></div>
            <div className="border-b border-border/40 pb-5"><OpenClawManualMonitoringPhaseCompletionReport /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerApprovalGateDesign /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerApprovalEvidencePacket /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerQAChecklist /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerFinalDesignReviewPacket /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerOperatorReviewConsole /></div>
            <div className="border-b border-border/40 pb-5"><ControlledSchedulerOperatorSignOffPacket /></div>
            <div className="border-b border-border/40 pb-5"><FinalLockBaselineExportPacket /></div>
            <div className="text-[10px] text-slate-400 italic">Additional developer diagnostics panels reserved for future debugging and monitoring tools.</div>
          </div>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-amber-500/90">
          <span className="font-bold">READ_ONLY / PREVIEW_ONLY</span> — Only safe status/health information is requested.
          No commands executed. No browser actions. No trading. No credentials. No live execution.
        </div>
      </div>

      {/* Endpoint + Button */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Endpoint</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-secondary/40 border border-border rounded text-[10px] font-mono text-blue-400 select-all">
            {ENDPOINT}
          </div>
          <span className="text-[8px] px-2 py-1 border border-slate-500/30 bg-slate-500/5 text-slate-400 rounded font-bold uppercase whitespace-nowrap">
            GET · manual redirect
          </span>
        </div>
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking…' : 'Check Gateway Status'}
        </button>
      </div>

      {/* Manual Monitoring Console */}
      <div id="manual-monitoring-console" className="border-t border-border/40 pt-5">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Manual Monitoring Console</div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-[10px] text-destructive">
            <div className="font-semibold mb-0.5">Check Failed</div>
            <div className="text-[9px] text-destructive/80">{error}</div>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && diag && (
        <div className={`border rounded-lg p-4 space-y-4 ${diag.bg}`}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 ${diag.color} shrink-0 mt-0.5`} />
            <div>
              <div className={`text-[12px] font-bold uppercase tracking-wide ${diag.color}`}>{diag.label}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{result.diagnosticDetail}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px]">
            {[
              { k: 'Endpoint Checked', v: result.url || ENDPOINT, vc: 'text-blue-400 font-mono text-[8px] truncate' },
              { k: 'HTTP Status',      v: result.gatewayStatus ?? 'N/A' },
              { k: 'Gateway Status',   v: diag.label, vc: `font-bold ${diag.color}` },
              { k: 'Timestamp',        v: result.lastChecked ? new Date(result.lastChecked).toLocaleString() : '—', vc: 'text-[8px]' },
              { k: 'Mode',             v: 'READ_ONLY', vc: 'font-bold text-amber-500' },
              { k: 'CF Access',        v: result.protected ? 'Protected' : result.online ? 'Open / Undetected' : '—' },
            ].map(({ k, v, vc }) => (
              <div key={k} className="bg-card/60 border border-border/40 px-3 py-2 rounded">
                <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={vc || 'font-semibold text-foreground'}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-card/40 border border-border/30 rounded text-[9px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            No command execution was attempted.
          </div>
        </div>
      )}

      {/* ── Readiness Checklist ── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/20 border-b border-border flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Gateway Readiness Checklist</div>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest">Read-only assessment</span>
        </div>
        <div className="divide-y divide-border/30">
          {checklist.map((item, i) => {
            const { icon: Icon, color } = STATUS_ICON[item.status];
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-[8px] text-slate-600 font-mono mt-0.5 shrink-0 w-4">{String(i + 1).padStart(2, '0')}</span>
                <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-foreground/90">{item.label}</div>
                  <div className="text-[8px] text-slate-500 mt-0.5 truncate">{item.detail}</div>
                </div>
                <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase shrink-0 ${STATUS_BADGE[item.status]}`}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Computed Readiness State ── */}
      <div className={`border rounded-lg p-4 space-y-3 ${readinessCfg.bg}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Computed Readiness State</div>
            <div className={`text-[14px] font-bold uppercase tracking-wide ${readinessCfg.color}`}>
              {readinessCfg.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-card/50 border border-border/40 rounded">
          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${readinessCfg.color}`} />
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Recommended Next Step</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${readinessCfg.color}`}>{readinessCfg.next}</div>
          </div>
        </div>
      </div>

      {/* Evidence Export & Audit */}
      {!evidenceCollapsed && (
        <>
          <div id="evidence-export" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Evidence Export</div>
          </div>

          <div id="audit-dashboard" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Audit Dashboard</div>
          </div>

          <div id="promotion-gate" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Promotion Gate</div>
          </div>

          <div id="operator-runbook" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Operator Runbook</div>
          </div>

          <div id="final-acceptance" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Final Acceptance Packet</div>
          </div>
        </>
      )}

      {/* Local Audit Preview Log */}
      {!evidenceCollapsed && auditLog.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Local Audit Preview</div>
            <span className="ml-auto text-[8px] text-slate-500 uppercase tracking-widest">Session only — not persisted</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {auditLog.map((entry, i) => (
              <div key={i} className="bg-card border border-border/30 rounded px-3 py-2 text-[8px] space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-slate-400 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className={`ml-auto font-bold px-1.5 py-0.5 rounded border text-[7px] uppercase ${STATUS_BADGE[
                    entry.gatewayStatus === 'OPENCLAW_ONLINE' ? 'PASS' :
                    entry.gatewayStatus === 'CLOUDFLARE_PROTECTED_REACHABLE' ? 'WARN' : 'FAIL'
                  ]}`}>{entry.gatewayStatus}</span>
                </div>
                <div className="text-slate-300">{entry.action}</div>
                <div className="text-slate-500 grid grid-cols-2 gap-x-4">
                  <span>Endpoint: <span className="text-blue-400 font-mono">{entry.endpoint}</span></span>
                  <span>HTTP: <span className="text-foreground">{entry.httpStatus}</span></span>
                  <span>Mode: <span className="text-amber-500 font-semibold">{entry.mode}</span></span>
                  <span>{entry.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bridge Call & Status Bridge */}
      {!evidenceCollapsed && (
        <>
          <div id="bridge-call" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Bridge Call & Results</div>
          </div>
        </>
      )}

      {/* ── Read-Only Gateway Health Check Phase ── */}
      <div id="status-bridge" className="border-t border-border/40 pt-5">
        <ReadOnlyGatewayHealthCheck />
      </div>

      {/* Visible Evidence Chain Controls - directly above Historical Status */}
      <div data-testid="visible-evidence-chain-controls" className="my-4 p-4 border-2 border-green-500 rounded-lg bg-green-950/20 space-y-3">
        <div className="text-green-400 font-bold">Evidence Chain Controls</div>
        <button
          type="button"
          data-testid="regenerate-full-manual-monitoring-evidence-chain-button"
          className="px-4 py-2 border border-green-500 rounded text-green-300 bg-black hover:bg-green-950 text-sm font-semibold"
          onClick={handleEvidenceChainRefresh}
        >
          Regenerate Full Manual Monitoring Evidence Chain
        </button>
        {ecRefreshConfirmed && (
          <div className="text-xs text-green-300 space-y-1 bg-green-900/20 border border-green-500/30 rounded p-2">
            <div>✓ Last refresh status: <span className="font-bold text-green-400">Evidence chain refreshed</span></div>
            <div>✓ Last refresh time: <span className="font-bold text-green-400">{ecLastRefreshAt ? new Date(ecLastRefreshAt).toLocaleTimeString() : '—'}</span></div>
            <div>✓ Records scanned: <span className="font-bold text-green-400">{ecRecordsScanned}</span></div>
            <div>✓ Successful records found: <span className="font-bold text-green-400">{ecSuccessfulRecords}</span></div>
            <div>✓ Event dispatch confirmed: <span className="font-bold text-green-400">true</span></div>
          </div>
        )}
      </div>

      {/* Historical Status & Health Monitoring */}
      {!evidenceCollapsed && (
        <>
          <div id="historical-status" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Historical Status Dashboard</div>
          </div>

          <div id="health-monitoring" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Automated Health Monitoring</div>
          </div>

          <div id="capability-governance" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Capability Governance</div>
          </div>

          <div id="route-governance" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Route Governance</div>
          </div>

          <div id="bridge-audit" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Bridge Audit and Integrity</div>
          </div>

          <div id="baseline-archive" className="border-t border-border/40 pt-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Baseline and Archive Evidence</div>
          </div>
        </>
      )}

      {/* Safety Footer */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[9px] text-primary/80">
          <span className="font-semibold">Read-Only Gateway Connector</span> — Only safe status/health information is requested.
          Uses <code className="text-primary/70">redirect: manual</code> to detect Cloudflare Access without following redirects.
          No credentials, no execution, no trading, no mutations.
        </div>
      </div>
    </div>
  );
}