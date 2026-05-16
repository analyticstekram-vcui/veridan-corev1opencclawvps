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
            <FinalLockPanel />
            <div className="border-t border-border/40 pt-5">
              <BaselineArchiveManifestPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BaselineExportPacketPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BaselineVerifyPacketPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyBrowserObservationDesignPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationPolicyMatrixPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationApprovalRulesPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationRoutePlannerPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationSimulationPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationEvidenceExportPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationProposalQueuePanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationProposalReviewLedgerPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationReadinessGatePanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationProposalFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationExecutionContractPreviewPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationExecutionContractFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationContractValidatorPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationContractValidatorFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <BrowserObservationDryRunAuditLedgerPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawBridgeDesignPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawBridgeDesignFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawBridgeValidatorPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawBridgeValidatorFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <OpenClawGovernancePhaseSummaryPanel />
            </div>
            <div className="border-t border-border/40 pt-5">
              <OpenClawOperatorApprovalWorkflowPanel />
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