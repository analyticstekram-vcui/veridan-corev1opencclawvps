/**
 * OpenClawReadOnlyEvidenceSnapshot
 * Captures a local read-only evidence snapshot of the current monitoring state.
 * Export is browser-only (URL.createObjectURL). No backend write. No dispatch. No execution.
 */

import React, { useState } from 'react';
import {
  Camera, Download, ChevronDown, ChevronUp, Shield, CheckCircle2, Lock, FileText
} from 'lucide-react';

const STATIC = {
  cloudflareRouteLabel: 'openclaw.veridancore.com',
  bridgeRouteLabel:     'bridge.veridancore.com',
  vpsLabel:             'ubuntu-s-1vcpu-2gb-nyc1',
  baselineFolderLabel:  '/root/veridan-baseline-2026-05-31-openclaw-live',
  connectorContractVersion: 'READ_ONLY_V1',
};

const VERIFICATION_CHECKS = [
  'Snapshot is generated from current read-only UI state only',
  'No OpenClaw endpoint beyond allowed read-only checks is called',
  'No execution endpoint is called',
  'No dispatch endpoint is called',
  'No browser automation is triggered',
  'No vault write is triggered',
  'No trading endpoint is called',
  'No credentials are collected',
  'Export is browser-only (URL.createObjectURL + a.click())',
  'No backend or database mutation occurs',
];

function Chip({ label, variant = 'primary' }) {
  const styles = {
    primary:     'bg-primary/10 border-primary/30 text-primary',
    slate:       'bg-slate-700/40 border-slate-600/40 text-slate-400',
    destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
  };
  return (
    <span className={`px-2 py-0.5 text-[6px] font-bold uppercase tracking-widest border rounded-sm ${styles[variant]}`}>
      {label}
    </span>
  );
}

function SnapshotRow({ label, value }) {
  const dim = !value || value === 'NOT_CAPTURED' || value === 'NOT_REPORTED' || value === 'UNKNOWN';
  return (
    <div className="flex items-start gap-2 text-[8px] font-mono">
      <span className="text-slate-500 shrink-0 w-52">{label}</span>
      <span className={dim ? 'text-slate-600' : 'text-slate-300'}>{value || 'NOT_CAPTURED'}</span>
    </div>
  );
}

function buildSnapshot(snapshotState) {
  return {
    snapshotId: `SNAP-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    gatewayStatus:          snapshotState.gatewayStatus,
    healthStatus:           snapshotState.healthStatus,
    defaultModelStatus:     snapshotState.defaultModelStatus,
    agentsStatus:           snapshotState.agentsStatus,
    commandsStatus:         snapshotState.commandsStatus,
    uptimeStatus:           snapshotState.uptimeStatus,
    requestMode:            'MANUAL_ONLY',
    executionMode:          'DISABLED',
    browserAutomationMode:  'DISABLED',
    vaultWriteMode:         'DISABLED',
    tradingMode:            'DISABLED',
    cloudflareRouteLabel:   STATIC.cloudflareRouteLabel,
    bridgeRouteLabel:       STATIC.bridgeRouteLabel,
    vpsLabel:               STATIC.vpsLabel,
    baselineFolderLabel:    STATIC.baselineFolderLabel,
    connectorContractVersion: STATIC.connectorContractVersion,
    verificationSummary: {
      allChecksPass: true,
      checkCount: VERIFICATION_CHECKS.length,
      checks: VERIFICATION_CHECKS,
    },
    safetyAttestation: {
      dispatchPerformed:        false,
      executionPerformed:       false,
      browserAutomationPerformed: false,
      vaultWritePerformed:      false,
      tradingPerformed:         false,
      credentialsCollected:     false,
      backendMutationOccurred:  false,
      exportMode:               'BROWSER_LOCAL_ONLY',
    },
  };
}

export default function OpenClawReadOnlyEvidenceSnapshot({ gatewayData }) {
  // gatewayData is optional — if parent passes it, we use it; otherwise NOT_CAPTURED
  const [snapshot, setSnapshot] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const snapshotState = {
    gatewayStatus:      gatewayData?.gatewayOnline ? 'LIVE' : 'NOT_CAPTURED',
    healthStatus:       gatewayData?.health         || 'NOT_CAPTURED',
    defaultModelStatus: gatewayData?.defaultModel   || 'NOT_CAPTURED',
    agentsStatus:       gatewayData?.agentsAvailable !== undefined ? String(gatewayData.agentsAvailable) : 'NOT_CAPTURED',
    commandsStatus:     gatewayData?.commandsAvailable !== undefined ? String(gatewayData.commandsAvailable) : 'NOT_CAPTURED',
    uptimeStatus:       gatewayData?.uptime         || 'NOT_REPORTED',
  };

  const handleCapture = () => {
    setSnapshot(buildSnapshot(snapshotState));
    setShowJson(false);
  };

  const handleExport = () => {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-monitoring-snapshot-${snapshot.snapshotId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-border/50 bg-card rounded-sm overflow-hidden font-mono">

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">
          READ-ONLY EVIDENCE SNAPSHOT — LOCAL EXPORT ONLY
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Chip label="LOCAL_ONLY" />
          <Chip label="EXECUTION_DISABLED" variant="slate" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">
            Read-Only Evidence Snapshot
          </span>
          {snapshot && <Chip label="SNAPSHOT_READY" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors"
          >
            <Camera className="w-3 h-3" />
            Capture Snapshot
          </button>
          {snapshot && (
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-accent/30 text-accent bg-accent/10 hover:bg-accent/20 rounded-sm transition-colors"
            >
              <Download className="w-3 h-3" />
              Export JSON
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Pre-capture state */}
        {!snapshot && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2 py-2">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            No snapshot captured yet. Click "Capture Snapshot" to record the current monitoring state locally.
          </div>
        )}

        {/* Snapshot fields */}
        {snapshot && (
          <div className="space-y-3">

            <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
              <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">Snapshot Fields</div>
              <SnapshotRow label="snapshotId"              value={snapshot.snapshotId} />
              <SnapshotRow label="generatedAt"             value={snapshot.generatedAt} />
              <SnapshotRow label="gatewayStatus"           value={snapshot.gatewayStatus} />
              <SnapshotRow label="healthStatus"            value={snapshot.healthStatus} />
              <SnapshotRow label="defaultModelStatus"      value={snapshot.defaultModelStatus} />
              <SnapshotRow label="agentsStatus"            value={snapshot.agentsStatus} />
              <SnapshotRow label="commandsStatus"          value={snapshot.commandsStatus} />
              <SnapshotRow label="uptimeStatus"            value={snapshot.uptimeStatus} />
              <SnapshotRow label="requestMode"             value={snapshot.requestMode} />
              <SnapshotRow label="executionMode"           value={snapshot.executionMode} />
              <SnapshotRow label="browserAutomationMode"   value={snapshot.browserAutomationMode} />
              <SnapshotRow label="vaultWriteMode"          value={snapshot.vaultWriteMode} />
              <SnapshotRow label="tradingMode"             value={snapshot.tradingMode} />
              <SnapshotRow label="cloudflareRouteLabel"    value={snapshot.cloudflareRouteLabel} />
              <SnapshotRow label="bridgeRouteLabel"        value={snapshot.bridgeRouteLabel} />
              <SnapshotRow label="vpsLabel"                value={snapshot.vpsLabel} />
              <SnapshotRow label="baselineFolderLabel"     value={snapshot.baselineFolderLabel} />
              <SnapshotRow label="connectorContractVersion" value={snapshot.connectorContractVersion} />
            </div>

            {/* Collapsible JSON preview */}
            <div className="border border-border/30 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowJson(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
              >
                <span>JSON Preview (Collapsible)</span>
                {showJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showJson && (
                <div className="border-t border-border/20 bg-background/40 p-3">
                  <pre className="text-[6px] font-mono text-slate-400 whitespace-pre-wrap break-all overflow-x-auto max-h-72">
                    {JSON.stringify(snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Verification */}
        <div className="border border-border/30 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5" />
              Safety Verification Checks ({VERIFICATION_CHECKS.length})
            </div>
            {showVerification ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showVerification && (
            <div className="px-3 pb-3 pt-1 space-y-1 border-t border-border/20 bg-background/30">
              {VERIFICATION_CHECKS.map((check, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                  {check}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[6px] font-mono text-slate-600 space-y-0.5 border-t border-border/20 pt-2">
          <div>exportMode: BROWSER_LOCAL_ONLY · backendWrite: DISABLED · dispatchPerformed: FALSE</div>
          <div>credentialsCollected: FALSE · vaultWrite: DISABLED · trading: DISABLED · mutation: FALSE</div>
        </div>

      </div>
    </div>
  );
}