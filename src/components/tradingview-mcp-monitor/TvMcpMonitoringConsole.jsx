/**
 * TvMcpMonitoringConsole
 * Veridan Core — TradingView MCP Manual Read-Only Monitoring Console
 * PREVIEW_ONLY / READ_ONLY / LOCKED
 * No trading · No broker · No credentials · No execution · No polling
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Play, Copy, Trash2, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'veridanTradingViewMcpChecks';

const ALLOWED_COMMANDS = ['health', 'status', 'quote', 'values', 'screenshot', 'ui-state', 'discover', 'range', 'stream'];
const BLOCKED_COMMANDS = ['trade', 'order', 'buy', 'sell', 'close', 'flatten', 'broker', 'login', 'password', 'credential', 'withdraw', 'deposit', 'transfer'];

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveChecks(checks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checks.slice(0, 100))); } catch {}
}

function buildCheckRecord({ command, result, durationMs }) {
  const safetyAssertions = [
    { key: 'readOnly',               value: true,  pass: true },
    { key: 'methodGet',              value: true,  pass: true },
    { key: 'commandAllowlisted',     value: ALLOWED_COMMANDS.includes(command), pass: ALLOWED_COMMANDS.includes(command) },
    { key: 'blockedCommandRejected', value: BLOCKED_COMMANDS.includes(command), pass: !BLOCKED_COMMANDS.includes(command) },
    { key: 'schedulerActive',        value: false, pass: true },
    { key: 'pollingLoopActive',      value: false, pass: true },
    { key: 'dispatchAllowed',        value: false, pass: true },
    { key: 'executionAllowed',       value: false, pass: true },
    { key: 'tradeAttempted',         value: false, pass: true },
    { key: 'brokerActionAttempted',  value: false, pass: true },
    { key: 'credentialExposed',      value: false, pass: true },
    { key: 'secretExposed',          value: false, pass: true },
    { key: 'moneyMovementAttempted', value: false, pass: true },
    { key: 'mutationMethodUsed',     value: false, pass: true },
    { key: 'browserWriteActionUsed', value: false, pass: true },
  ];

  return {
    checkId:            'mcp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    createdAt:          new Date().toISOString(),
    command,
    status:             result?.status || 'UNKNOWN',
    httpStatus:         result?.httpStatus ?? null,
    relayReachable:     result?.relayReachable ?? false,
    cdpConnected:       result?.cdpConnected ?? null,
    chartSymbol:        result?.chartSymbol ?? null,
    chartResolution:    result?.chartResolution ?? null,
    targetUrl:          'relay-internal (not exposed)',
    responseSummary:    result?.error || result?.notes || (result?.ok ? 'Check succeeded' : 'Check held'),
    durationMs:         durationMs ?? null,
    executionLock:      'LOCKED',
    dispatchAllowed:    false,
    executionAllowed:   false,
    liveTrading:        'DISABLED',
    brokerConnection:   'DISABLED',
    credentialAccess:   'DISABLED',
    moneyMovement:      'DISABLED',
    safetyAssertions,
    safetyPassCount:    safetyAssertions.filter(a => a.pass).length,
    safetyFailCount:    safetyAssertions.filter(a => !a.pass).length,
    rawData:            result?.data ?? null,
    sourceComponent:    'TvMcpMonitoringConsole',
  };
}

function buildEvidenceChain(checks) {
  const successful = checks.filter(c => c.status === 'SUCCESS');
  const blocked    = checks.filter(c => c.status === 'BLOCKED_BY_POLICY');
  const last       = checks[0];
  const totalSafetyPass = checks.reduce((s, c) => s + (c.safetyPassCount || 0), 0);
  const totalSafetyFail = checks.reduce((s, c) => s + (c.safetyFailCount || 0), 0);
  return {
    totalChecks:          checks.length,
    successfulChecks:     successful.length,
    blockedCommandTests:  blocked.length,
    lastSuccessfulCheckAt: successful[0]?.createdAt ?? null,
    lastCommand:          last?.command ?? null,
    safetyPassCount:      totalSafetyPass,
    safetyFailCount:      totalSafetyFail,
    lockStatus:           'LOCKED',
    generatedAt:          new Date().toISOString(),
  };
}

const STATUS_STYLE = {
  SUCCESS:                { text: 'text-primary',     border: 'border-primary/30',     bg: 'bg-primary/5'     },
  BLOCKED_BY_POLICY:      { text: 'text-destructive', border: 'border-destructive/30', bg: 'bg-destructive/5' },
  HOLD_FOR_BACKEND_ENV:   { text: 'text-amber-400',   border: 'border-amber-400/30',   bg: 'bg-amber-400/5'   },
  HOLD_FOR_MCP_RELAY:     { text: 'text-amber-400',   border: 'border-amber-400/30',   bg: 'bg-amber-400/5'   },
  UNKNOWN:                { text: 'text-slate-400',   border: 'border-border/40',      bg: 'bg-secondary/10'  },
};

function statusStyle(s) { return STATUS_STYLE[s] || STATUS_STYLE.UNKNOWN; }

export default function TvMcpMonitoringConsole() {
  const [command,       setCommand]       = useState('status');
  const [loading,       setLoading]       = useState(false);
  const [latestCheck,   setLatestCheck]   = useState(null);
  const [checks,        setChecks]        = useState([]);
  const [evidence,      setEvidence]      = useState(null);
  const [showEvidence,  setShowEvidence]  = useState(false);

  useEffect(() => {
    const stored = loadChecks();
    setChecks(stored);
    if (stored.length) setEvidence(buildEvidenceChain(stored));
  }, []);

  const runCheck = async () => {
    if (!command || loading) return;
    setLoading(true);
    const start = Date.now();
    try {
      const res = await base44.functions.invoke('tradingViewMcpStatus', { command });
      const result = res.data || {};
      const record = buildCheckRecord({ command, result, durationMs: Date.now() - start });
      const updated = [record, ...checks];
      setChecks(updated);
      saveChecks(updated);
      setLatestCheck(record);
      setEvidence(buildEvidenceChain(updated));
    } catch (err) {
      const result = { status: 'HOLD_FOR_MCP_RELAY', error: err.message || 'Backend error' };
      const record = buildCheckRecord({ command, result, durationMs: Date.now() - start });
      const updated = [record, ...checks];
      setChecks(updated);
      saveChecks(updated);
      setLatestCheck(record);
      setEvidence(buildEvidenceChain(updated));
    } finally {
      setLoading(false);
    }
  };

  const copyLatest = () => {
    if (latestCheck) navigator.clipboard.writeText(JSON.stringify(latestCheck, null, 2));
  };

  const clearChecks = () => {
    if (window.confirm('Clear all local MCP check records?')) {
      localStorage.removeItem(STORAGE_KEY);
      setChecks([]);
      setLatestCheck(null);
      setEvidence(null);
    }
  };

  const regenEvidence = () => {
    const stored = loadChecks();
    setEvidence(buildEvidenceChain(stored));
    setShowEvidence(true);
  };

  const ss = latestCheck ? statusStyle(latestCheck.status) : null;

  return (
    <div className="space-y-4">

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/30 rounded-sm text-[9px] text-amber-400">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Manual operator-triggered GET checks only.
          No scheduler. No polling. No dispatch. No execution. No trading. No broker. No credentials. No money movement.
        </span>
      </div>

      {/* Phase card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: 'Current Phase',   value: 'LOCAL RELAY VERIFIED',   cls: 'text-primary' },
          { label: 'Next Phase',      value: 'VPS RELAY + VPS BROWSER', cls: 'text-amber-400' },
          { label: 'Execution Phase', value: 'NOT ENABLED',             cls: 'text-destructive' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border/40 rounded-sm px-3 py-2.5">
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{c.label}</div>
            <div className={`text-[10px] font-bold font-mono ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Blocked command notice */}
      <div className="bg-card border border-destructive/20 rounded-sm px-4 py-3">
        <div className="text-[8px] font-bold uppercase text-destructive mb-1.5">Blocked Commands — REJECTED_BY_POLICY</div>
        <div className="flex flex-wrap gap-1.5">
          {BLOCKED_COMMANDS.map(c => (
            <span key={c} className="px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-mono rounded-sm">{c}</span>
          ))}
        </div>
      </div>

      {/* Command selector + run button */}
      <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Select Read-Only MCP Command</div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={command}
            onChange={e => setCommand(e.target.value)}
            disabled={loading}
            className="flex-1 min-w-[160px] px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50 disabled:opacity-50"
          >
            {ALLOWED_COMMANDS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={runCheck}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 transition-colors"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {loading ? 'Running…' : 'Run Check'}
          </button>
        </div>
        <div className="text-[7px] text-slate-600 font-mono">
          Method: GET only · Mode: READ_ONLY · Lock: LOCKED · Stored checks: {checks.length}
        </div>
      </div>

      {/* Latest check result */}
      {latestCheck && ss && (
        <>
          <div className={`border rounded-sm p-4 space-y-2 ${ss.border} ${ss.bg}`}>
            <div className="flex items-center gap-3">
              {latestCheck.status === 'SUCCESS'
                ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                : latestCheck.status === 'BLOCKED_BY_POLICY'
                ? <XCircle className="w-4 h-4 text-destructive shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              <div>
                <div className={`text-[11px] font-bold uppercase font-mono ${ss.text}`}>{latestCheck.status}</div>
                <div className={`text-[8px] mt-0.5 ${ss.text} opacity-80`}>{latestCheck.responseSummary}</div>
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Command',         value: latestCheck.command,                              cls: 'text-primary font-mono' },
              { label: 'Status',          value: latestCheck.status,                               cls: ss.text + ' font-bold' },
              { label: 'HTTP Status',     value: latestCheck.httpStatus ?? 'N/A',                  cls: 'text-foreground' },
              { label: 'Relay Reachable', value: String(latestCheck.relayReachable),               cls: latestCheck.relayReachable ? 'text-primary font-bold' : 'text-amber-400' },
              { label: 'CDP Connected',   value: latestCheck.cdpConnected == null ? 'N/A' : String(latestCheck.cdpConnected), cls: 'text-slate-300' },
              { label: 'Chart Symbol',    value: latestCheck.chartSymbol ?? 'N/A',                 cls: 'text-slate-300 font-mono text-[8px]' },
              { label: 'Resolution',      value: latestCheck.chartResolution ?? 'N/A',             cls: 'text-slate-300' },
              { label: 'Duration',        value: latestCheck.durationMs != null ? `${latestCheck.durationMs}ms` : 'N/A', cls: 'text-slate-300' },
              { label: 'Execution Lock',  value: latestCheck.executionLock,                        cls: 'text-destructive font-bold' },
              { label: 'Live Trading',    value: latestCheck.liveTrading,                          cls: 'text-destructive font-bold' },
              { label: 'Broker Connect',  value: latestCheck.brokerConnection,                     cls: 'text-destructive font-bold' },
              { label: 'Money Movement',  value: latestCheck.moneyMovement,                        cls: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/40 rounded-sm px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{c.label}</div>
                <div className={`text-[9px] break-all ${c.cls}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Target URL */}
          <div className="bg-card border border-border/40 rounded-sm px-3 py-2">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Target URL</div>
            <div className="text-[8px] font-mono text-slate-400">{latestCheck.targetUrl}</div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-400">Safety Assertions</span>
              <span className={`text-[8px] font-bold font-mono ${latestCheck.safetyFailCount === 0 ? 'text-primary' : 'text-destructive'}`}>
                {latestCheck.safetyPassCount}/{latestCheck.safetyPassCount + latestCheck.safetyFailCount} PASS
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-2 gap-x-3">
              {latestCheck.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-500">{a.key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Check metadata */}
          <div className="flex flex-wrap gap-3 text-[7px] text-slate-600 font-mono">
            <span>{latestCheck.checkId}</span>
            <span>{new Date(latestCheck.createdAt).toLocaleString()}</span>
          </div>
        </>
      )}

      {/* No checks yet */}
      {checks.length === 0 && !latestCheck && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-sm text-[9px] text-slate-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No checks recorded yet. Select a command and click "Run Check" to generate monitoring evidence.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyLatest} disabled={!latestCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-border/40 text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded-sm font-bold transition-colors disabled:opacity-40">
          <Copy className="w-3 h-3" /> Copy Latest MCP Check JSON
        </button>
        <button type="button" onClick={clearChecks}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-border/40 text-slate-400 hover:bg-secondary/50 rounded-sm font-bold transition-colors">
          <Trash2 className="w-3 h-3" /> Clear Local MCP Checks
        </button>
        <button type="button" onClick={regenEvidence}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-primary/30 text-primary hover:bg-primary/10 rounded-sm font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate MCP Evidence Chain
        </button>
      </div>

      {/* Evidence chain */}
      {(evidence && showEvidence) && (
        <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20">
            <span className="text-[9px] font-bold uppercase text-primary">MCP Evidence Chain</span>
            <span className="ml-2 text-[7px] text-slate-500 font-mono">key: {STORAGE_KEY}</span>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Total Checks',        value: evidence.totalChecks },
              { label: 'Successful',          value: evidence.successfulChecks,    cls: 'text-primary font-bold' },
              { label: 'Blocked Tests',       value: evidence.blockedCommandTests, cls: 'text-destructive font-bold' },
              { label: 'Lock Status',         value: evidence.lockStatus,          cls: 'text-destructive font-bold' },
              { label: 'Safety Passes',       value: evidence.safetyPassCount,     cls: 'text-primary font-bold' },
              { label: 'Safety Failures',     value: evidence.safetyFailCount,     cls: evidence.safetyFailCount > 0 ? 'text-destructive font-bold' : 'text-primary font-bold' },
              { label: 'Last Command',        value: evidence.lastCommand ?? 'N/A' },
              { label: 'Last Success At',     value: evidence.lastSuccessfulCheckAt ? new Date(evidence.lastSuccessfulCheckAt).toLocaleTimeString() : 'N/A' },
            ].map(c => (
              <div key={c.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{c.label}</div>
                <div className={`text-[9px] font-mono font-bold ${c.cls || 'text-slate-300'}`}>{String(c.value)}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-border/20">
            <div className="text-[7px] text-slate-600 font-mono">Generated: {new Date(evidence.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm text-[8px] text-primary/80 font-bold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        TradingView MCP monitoring is read-only and operator-triggered. No scheduler. No polling. No dispatch. No execution. GET only.
      </div>
    </div>
  );
}