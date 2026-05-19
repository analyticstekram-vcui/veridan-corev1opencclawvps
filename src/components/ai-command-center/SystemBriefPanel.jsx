/**
 * SystemBriefPanel — Cross-module localStorage status aggregator.
 * Reads 8 localStorage keys from Veridan modules and OpenClaw governance.
 * No AI runtime, OpenAI API, Codex, OpenClaw dispatch, or external API calls.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, RotateCcw } from 'lucide-react';

const STORAGE_KEYS = {
  TRADING: 'veridanTradingModuleStatusSnapshot',
  PUBLIC_CREDIT: 'veridanPublicCreditModuleStatusSnapshot',
  BUSINESS_FORMATION: 'veridanBusinessFormationModuleStatusSnapshot',
  OPENCLAW_CHECKPOINT: 'openclawGovernanceDryRunChainCheckpointLockPhases43To49',
  EXECUTION_READINESS: 'openclawPhase50ExecutionReadinessBoundaryMap',
  SECURITY_POLICY: 'openclawPhase51SecurityBoundaryPolicy',
  EXECUTION_POLICY: 'openclawPhase52ExecutionPolicyBoundary',
  BACKEND_POLICY: 'openclawPhase53BackendBoundaryPolicy',
};

const SAFETY_CLAIMS = [
  'System brief only',
  'LocalStorage snapshot summary only',
  'No AI runtime calls',
  'No OpenAI API calls',
  'No Codex execution',
  'No OpenClaw dispatch',
  'No MCP calls',
  'No browser automation',
  'No external API mutation',
  'No credential handling',
  'No backend mutation',
  'Browser-only export',
];

const SYSTEM_MODE_ROWS = [
  { label: 'Overall Mode', value: 'PLANNING_ONLY' },
  { label: 'Governance Chain', value: 'LOCKED_EXECUTION_DISABLED' },
  { label: 'Execution Readiness', value: 'NOT_READY_FOR_EXECUTION' },
  { label: 'AI Runtime Calls', value: 'DISABLED' },
  { label: 'OpenAI API Calls', value: 'DISABLED' },
  { label: 'Codex Execution', value: 'DISABLED' },
  { label: 'OpenClaw Dispatch', value: 'DISABLED' },
  { label: 'Backend Mutation', value: 'DISABLED' },
  { label: 'External API Mutation', value: 'DISABLED' },
  { label: 'Credential Handling', value: 'DISABLED' },
];

export default function SystemBriefPanel() {
  const [snapshotPresence, setSnapshotPresence] = useState({});

  useEffect(() => {
    loadSnapshotPresence();
  }, []);

  const loadSnapshotPresence = () => {
    const presence = {
      trading: !!localStorage.getItem(STORAGE_KEYS.TRADING),
      publicCredit: !!localStorage.getItem(STORAGE_KEYS.PUBLIC_CREDIT),
      businessFormation: !!localStorage.getItem(STORAGE_KEYS.BUSINESS_FORMATION),
      openclawCheckpoint: !!localStorage.getItem(STORAGE_KEYS.OPENCLAW_CHECKPOINT),
      executionReadiness: !!localStorage.getItem(STORAGE_KEYS.EXECUTION_READINESS),
      securityPolicy: !!localStorage.getItem(STORAGE_KEYS.SECURITY_POLICY),
      executionPolicy: !!localStorage.getItem(STORAGE_KEYS.EXECUTION_POLICY),
      backendPolicy: !!localStorage.getItem(STORAGE_KEYS.BACKEND_POLICY),
    };
    setSnapshotPresence(presence);
  };

  const handleExport = () => {
    const briefData = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AI_COMMAND_CENTER_SYSTEM_BRIEF',
      snapshotPresence: {
        'Trading module status snapshot present': snapshotPresence.trading,
        'Public credit module status snapshot present': snapshotPresence.publicCredit,
        'Business formation module status snapshot present': snapshotPresence.businessFormation,
        'OpenClaw governance checkpoint present': snapshotPresence.openclawCheckpoint,
        'Execution readiness map present': snapshotPresence.executionReadiness,
        'Security policy present': snapshotPresence.securityPolicy,
        'Execution policy present': snapshotPresence.executionPolicy,
        'Backend policy present': snapshotPresence.backendPolicy,
      },
      systemMode: Object.fromEntries(
        SYSTEM_MODE_ROWS.map(row => [row.label, row.value])
      ),
      safetyClaims: SAFETY_CLAIMS,
    };

    // Store in localStorage
    try {
      localStorage.setItem(
        'veridanAiCommandCenterSystemBriefSnapshot',
        JSON.stringify(briefData)
      );
    } catch (e) {
      console.error('Failed to store brief snapshot:', e);
    }

    // Export JSON
    const blob = new Blob([JSON.stringify(briefData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-system-brief-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">System Brief</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Cross-module status aggregation · No AI runtime · No external APIs</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSnapshotPresence}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm"
          >
            <RotateCcw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm"
          >
            <Download className="w-3 h-3" /> Export Brief
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No AI runtime calls, API integration, Codex execution, OpenClaw dispatch, or external API mutation.</div>
          <div className="text-[8px] text-destructive/70">No AI runtime · No OpenAI API · No Codex · No OpenClaw · No external API mutation · No credential storage</div>
        </div>
      </div>

      {/* Module Snapshot Presence Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Module Snapshot Presence</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { label: 'Trading module status snapshot present', value: snapshotPresence.trading },
            { label: 'Public credit module status snapshot present', value: snapshotPresence.publicCredit },
            { label: 'Business formation module status snapshot present', value: snapshotPresence.businessFormation },
            { label: 'OpenClaw governance checkpoint present', value: snapshotPresence.openclawCheckpoint },
            { label: 'Execution readiness map present', value: snapshotPresence.executionReadiness },
            { label: 'Security policy present', value: snapshotPresence.securityPolicy },
            { label: 'Execution policy present', value: snapshotPresence.executionPolicy },
            { label: 'Backend policy present', value: snapshotPresence.backendPolicy },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className={`text-[8px] font-bold font-mono ${item.value ? 'text-primary' : 'text-slate-500'}`}>
                {item.value ? 'true' : 'false'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Mode Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">System Mode</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SYSTEM_MODE_ROWS.map(row => (
            <div key={row.label} className="flex items-center justify-between px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{row.label}:</span>
              <span className="text-[8px] font-bold font-mono text-destructive">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What This Means Section */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">What This Means</div>
        <div className="text-[8px] text-slate-400 leading-relaxed">
          Veridan Core can summarize module status from existing localStorage snapshots. It cannot call AI runtimes, execute Codex tasks, dispatch OpenClaw commands, mutate backend systems, contact external APIs, or handle credentials.
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>

    </div>
  );
}