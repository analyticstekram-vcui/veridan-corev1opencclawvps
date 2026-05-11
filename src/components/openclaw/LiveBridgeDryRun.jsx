import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Play, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const READ_ONLY_COMMANDS = [
  {
    id: 'system_status',
    name: 'system.status',
    description: 'Query OpenClaw bridge operational status',
  },
  {
    id: 'logs_fetch',
    name: 'logs.fetch',
    description: 'Fetch diagnostic logs from bridge',
  },
  {
    id: 'session_list',
    name: 'session.list',
    description: 'List active browser sessions',
  },
];

function CommandRow({ command, result, loading }) {
  const statusStyles = {
    PASS: 'bg-primary/5 border-primary/20 text-primary',
    FAIL: 'bg-destructive/5 border-destructive/20 text-destructive',
    UNKNOWN: 'bg-secondary/20 border-border text-muted-foreground',
  };

  const status = loading ? 'UNKNOWN' : (result?.passed ? 'PASS' : 'FAIL');
  const style = statusStyles[status] || statusStyles.UNKNOWN;

  return (
    <div className={`border border-border/30 px-3 py-2 rounded-sm ${style}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="shrink-0 mt-0.5">
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : result?.passed ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold">{command.name}</div>
            <div className="text-[9px] opacity-70">{command.description}</div>
            {result?.responseSummary && (
              <div className="text-[9px] mt-0.5 opacity-60 font-mono break-all">
                {result.responseSummary}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-sm ${style}`}>
            {status}
          </span>
          {result?.auditTraceId && (
            <span className="text-[8px] text-muted-foreground/50 font-mono">
              {result.auditTraceId.slice(0, 12)}...
            </span>
          )}
        </div>
      </div>
      {result?.timestamp && (
        <div className="text-[8px] text-muted-foreground/50 mt-1 ml-5">
          {format(new Date(result.timestamp), 'HH:mm:ss')}
        </div>
      )}
      {result?.error && (
        <div className="text-[9px] mt-1 ml-5 text-destructive font-mono break-all">
          Error: {result.error}
        </div>
      )}
    </div>
  );
}

export default function LiveBridgeDryRun() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState('UNKNOWN');

  const runDryRun = async () => {
    setLoading(true);
    const newResults = {};
    let passCount = 0;

    for (const cmd of READ_ONLY_COMMANDS) {
      try {
        const res = await base44.functions.invoke('openclawReadOnlyBridgeStatus', {
          command: cmd.name,
        });

        const passed = res.data?.ok === true && res.data?.status === 'PASS';
        if (passed) passCount++;

        newResults[cmd.id] = {
          passed,
          responseSummary: res.data?.reason || (passed ? 'Read-only command passed' : 'Command blocked'),
          auditTraceId: res.data?.traceId || null,
          timestamp: res.data?.timestamp || new Date().toISOString(),
          error: !passed ? res.data?.reason : null,
        };
      } catch (err) {
        newResults[cmd.id] = {
          passed: false,
          responseSummary: null,
          auditTraceId: null,
          timestamp: new Date().toISOString(),
          error: err.message || 'Request failed',
        };
      }
    }

    setResults(newResults);
    setBridgeStatus(passCount === READ_ONLY_COMMANDS.length ? 'READ_ONLY_BRIDGE_READY' : 'NOT_READY');
    setLoading(false);
  };

  const statusStyles = {
    READ_ONLY_BRIDGE_READY: 'bg-primary/10 border-primary/20 text-primary',
    NOT_READY: 'bg-destructive/10 border-destructive/20 text-destructive',
    UNKNOWN: 'bg-secondary/20 border-border text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Bridge Status Card */}
      <div className={`border rounded-sm p-4 ${statusStyles[bridgeStatus]}`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {bridgeStatus === 'READ_ONLY_BRIDGE_READY' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider">
                {bridgeStatus.replace(/_/g, ' ')}
              </div>
              <div className="text-[10px] opacity-70">
                {bridgeStatus === 'READ_ONLY_BRIDGE_READY' && 'All read-only commands passed. Bridge is operational.'}
                {bridgeStatus === 'NOT_READY' && 'One or more commands failed. Check errors below.'}
                {bridgeStatus === 'UNKNOWN' && 'Run tests to verify bridge connectivity.'}
              </div>
            </div>
          </div>
          <button
            onClick={runDryRun}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[9px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Testing...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Run Read-Only Bridge Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Commands Grid */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-3">
          Read-Only Commands ({Object.keys(results).length}/{READ_ONLY_COMMANDS.length})
        </div>
        <div className="grid grid-cols-1 gap-2">
          {READ_ONLY_COMMANDS.map(cmd => (
            <CommandRow
              key={cmd.id}
              command={cmd}
              result={results[cmd.id]}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-secondary/20 border border-border/30 px-4 py-2.5 rounded-sm">
        <div className="text-[9px] text-muted-foreground/70 leading-relaxed space-y-1">
          <div className="font-semibold uppercase tracking-wider text-foreground">Dry Run Notice</div>
          <div>• Only read-only commands (system.status, logs.fetch, session.list) are tested.</div>
          <div>• Execution mode remains SIMULATED. No mutations are permitted.</div>
          <div>• All commands are HMAC-signed and routed through governance approval.</div>
          <div>• Service tokens are never exposed to the client.</div>
          <div>• Live execution remains disabled regardless of test results.</div>
        </div>
      </div>
    </div>
  );
}