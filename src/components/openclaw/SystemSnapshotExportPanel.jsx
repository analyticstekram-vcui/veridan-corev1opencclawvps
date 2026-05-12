import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Copy, RefreshCw, Eye, EyeOff, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const REDACT_PATTERNS = ['token', 'key', 'secret', 'password', 'credential', 'auth', 'bearer', 'hmac', 'apikey'];

function redactValue(key, value) {
  if (typeof key !== 'string') return value;
  const lowerKey = key.toLowerCase();
  if (REDACT_PATTERNS.some(p => lowerKey.includes(p))) {
    return '[REDACTED]';
  }
  return value;
}

function redactObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      result[key] = redactObject(value);
    } else {
      result[key] = redactValue(key, value);
    }
  }
  return result;
}

async function generateSnapshot() {
  const timestamp = new Date().toISOString();
  const snapshot = {
    timestamp,
    version: '1.0',
    executionMode: 'SIMULATED',
    liveExecutionDisabled: true,
    
    // Fetch data from various entities
    gateway: {
      status: 'FETCHING...',
      url: '[REDACTED]',
      protected: true,
    },
    executionReadiness: {
      status: 'Checking...',
      checklistItems: 0,
    },
    safetyTests: {
      totalTests: 7,
      status: 'Unknown',
    },
    commandQueue: {
      totalQueued: 0,
      totalApproved: 0,
      totalPending: 0,
    },
    executedCommands: {
      totalExecuted: 0,
      totalFailed: 0,
      totalBlocked: 0,
    },
    workflowSummary: {
      totalWorkflows: 0,
      statusCounts: {},
    },
    policyRegistry: {
      totalPolicies: 9,
      allActive: true,
    },
    connectorHealth: {
      totalConnectors: 14,
      onlineReady: 0,
      offline: 0,
    },
    riskMatrix: {
      totalActions: 20,
      allowed: 0,
      readOnlyOnly: 0,
      simulatedOnly: 0,
      blocked: 0,
      forbidden: 0,
    },
    warnings: [],
  };

  try {
    // Fetch command data
    const commands = await base44.entities.OpenClawCommand.list('-created_date', 100);
    if (commands && Array.isArray(commands)) {
      snapshot.commandQueue.totalQueued = commands.filter(c => ['pending', 'draft'].includes(c.status)).length;
      snapshot.commandQueue.totalApproved = commands.filter(c => c.status === 'approved').length;
      snapshot.commandQueue.totalPending = commands.filter(c => c.status === 'pending').length;
      snapshot.executedCommands.totalExecuted = commands.filter(c => c.status === 'executed').length;
      snapshot.executedCommands.totalFailed = commands.filter(c => c.status === 'failed').length;
      snapshot.executedCommands.totalBlocked = commands.filter(c => c.status === 'blocked').length;
    }

    // Fetch workflow data
    const workflows = await base44.entities.OpenClawWorkflow.list('-created_date', 100);
    if (workflows && Array.isArray(workflows)) {
      snapshot.workflowSummary.totalWorkflows = workflows.length;
      snapshot.workflowSummary.statusCounts = workflows.reduce((acc, w) => {
        acc[w.status] = (acc[w.status] || 0) + 1;
        return acc;
      }, {});
    }
  } catch (e) {
    snapshot.warnings.push(`Data fetch failed: ${e.message}`);
  }

  // Add hardcoded summaries
  snapshot.riskMatrix = {
    totalActions: 20,
    allowed: 3,
    readOnlyOnly: 7,
    simulatedOnly: 1,
    blocked: 6,
    forbidden: 3,
  };

  snapshot.connectorHealth = {
    totalConnectors: 14,
    onlineReady: 10,
    offline: 0,
    warnings: 4,
  };

  // Determine overall status
  if (snapshot.warnings.length > 0) {
    snapshot.overallStatus = 'WARNING';
  } else if (snapshot.commandQueue.totalApproved === 0 && snapshot.executedCommands.totalExecuted === 0) {
    snapshot.overallStatus = 'NOT_READY';
  } else {
    snapshot.overallStatus = 'HEALTHY';
  }

  return redactObject(snapshot);
}

function snapshotToMarkdown(snapshot) {
  const md = [];
  md.push(`# OpenClaw Control System Snapshot\n`);
  md.push(`**Generated:** ${format(new Date(snapshot.timestamp), 'PPpp')}`);
  md.push(`**Status:** ${snapshot.overallStatus}`);
  md.push(`**Execution Mode:** SIMULATED (Live execution disabled)\n`);

  md.push(`## Gateway\n`);
  md.push(`- Status: ${snapshot.gateway.status}`);
  md.push(`- Protected: ${snapshot.gateway.protected ? 'Yes' : 'No'}\n`);

  md.push(`## Execution Readiness\n`);
  md.push(`- Status: ${snapshot.executionReadiness.status}`);
  md.push(`- Checklist Items: ${snapshot.executionReadiness.checklistItems}\n`);

  md.push(`## Safety Tests\n`);
  md.push(`- Total Tests: ${snapshot.safetyTests.totalTests}`);
  md.push(`- Status: ${snapshot.safetyTests.status}\n`);

  md.push(`## Command Queue\n`);
  md.push(`- Queued: ${snapshot.commandQueue.totalQueued}`);
  md.push(`- Approved: ${snapshot.commandQueue.totalApproved}`);
  md.push(`- Pending: ${snapshot.commandQueue.totalPending}\n`);

  md.push(`## Executed Commands\n`);
  md.push(`- Executed: ${snapshot.executedCommands.totalExecuted}`);
  md.push(`- Failed: ${snapshot.executedCommands.totalFailed}`);
  md.push(`- Blocked: ${snapshot.executedCommands.totalBlocked}\n`);

  md.push(`## Workflows\n`);
  md.push(`- Total: ${snapshot.workflowSummary.totalWorkflows}`);
  md.push(`- Status Distribution: ${JSON.stringify(snapshot.workflowSummary.statusCounts)}\n`);

  md.push(`## Risk Matrix\n`);
  md.push(`- Total Actions: ${snapshot.riskMatrix.totalActions}`);
  md.push(`- Allowed: ${snapshot.riskMatrix.allowed}`);
  md.push(`- Read-Only Only: ${snapshot.riskMatrix.readOnlyOnly}`);
  md.push(`- Simulated Only: ${snapshot.riskMatrix.simulatedOnly}`);
  md.push(`- Blocked: ${snapshot.riskMatrix.blocked}`);
  md.push(`- Forbidden: ${snapshot.riskMatrix.forbidden}\n`);

  md.push(`## Connector Health\n`);
  md.push(`- Total Connectors: ${snapshot.connectorHealth.totalConnectors}`);
  md.push(`- Online/Ready: ${snapshot.connectorHealth.onlineReady}`);
  md.push(`- Offline: ${snapshot.connectorHealth.offline}`);
  md.push(`- Warnings: ${snapshot.connectorHealth.warnings || 0}\n`);

  md.push(`## Policy Registry\n`);
  md.push(`- Total Policies: ${snapshot.policyRegistry.totalPolicies}`);
  md.push(`- All Active: ${snapshot.policyRegistry.allActive ? 'Yes' : 'No'}\n`);

  if (snapshot.warnings && snapshot.warnings.length > 0) {
    md.push(`## Warnings\n`);
    snapshot.warnings.forEach(w => md.push(`- ${w}`));
    md.push('');
  }

  md.push(`---\n`);
  md.push(`*Snapshot generated by OpenClaw Control. Execution remains SIMULATED.*`);

  return md.join('\n');
}

export default function SystemSnapshotExportPanel() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateSnapshot = async () => {
    setLoading(true);
    try {
      const snap = await generateSnapshot();
      setSnapshot(snap);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!snapshot) return;
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-snapshot-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    if (!snapshot) return;
    const md = snapshotToMarkdown(snapshot);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-snapshot-${format(new Date(), 'yyyyMMdd-HHmmss')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    if (!snapshot) return;
    const md = snapshotToMarkdown(snapshot);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    HEALTHY: { icon: CheckCircle2, color: 'text-primary', label: 'HEALTHY' },
    WARNING: { icon: AlertTriangle, color: 'text-amber-500', label: 'WARNING' },
    NOT_READY: { icon: AlertCircle, color: 'text-destructive', label: 'NOT READY' },
  };

  const cfg = snapshot ? statusConfig[snapshot.overallStatus] || statusConfig.NOT_READY : statusConfig.NOT_READY;
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">System Snapshot / Export</div>
          <div className="text-[13px] font-semibold text-foreground">OpenClaw Control State Export</div>
        </div>
      </div>

      {/* Current status card */}
      {snapshot && (
        <div className="bg-secondary/20 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
              <div>
                <div className="text-[11px] font-semibold text-foreground">System Status</div>
                <div className={`text-[9px] uppercase tracking-wider font-semibold ${cfg.color} mt-0.5`}>{cfg.label}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Last Snapshot</div>
              <div className="text-[10px] font-mono text-foreground mt-0.5">{format(new Date(snapshot.timestamp), 'HH:mm:ss')}</div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Commands</div>
              <div className="text-[12px] font-semibold text-foreground">{snapshot.commandQueue.totalApproved}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Executed</div>
              <div className="text-[12px] font-semibold text-primary">{snapshot.executedCommands.totalExecuted}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Workflows</div>
              <div className="text-[12px] font-semibold text-foreground">{snapshot.workflowSummary.totalWorkflows}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">Connectors</div>
              <div className="text-[12px] font-semibold text-primary">{snapshot.connectorHealth.onlineReady}/{snapshot.connectorHealth.totalConnectors}</div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors rounded"
            >
              <Download className="w-3 h-3" /> JSON
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors rounded"
            >
              <Download className="w-3 h-3" /> Markdown
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-[10px] text-green-400 hover:bg-green-500/20 transition-colors rounded"
            >
              <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy MD'}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateSnapshot}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {loading ? 'Generating...' : 'Generate Snapshot'}
        </button>
      </div>

      {/* Raw JSON toggle */}
      {snapshot && (
        <div className="space-y-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 transition-colors rounded font-semibold"
          >
            {showRawJson ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showRawJson ? 'Hide' : 'Show'} Raw JSON
          </button>

          {showRawJson && (
            <div className="bg-secondary/30 border border-border rounded-lg p-3 overflow-x-auto">
              <pre className="text-[8px] text-foreground/70 font-mono">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Markdown preview */}
      {snapshot && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Markdown Preview</div>
          <div className="bg-secondary/20 border border-border rounded-lg p-4 text-[9px] text-foreground/80 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
            {snapshotToMarkdown(snapshot)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-slate-300">
        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold mb-1 text-foreground">Snapshot exports safe operational metadata only</div>
          <div className="text-slate-400">Secrets, credentials, tokens, and sensitive keys are redacted. All exports mark execution as SIMULATED.</div>
        </div>
      </div>
    </div>
  );
}