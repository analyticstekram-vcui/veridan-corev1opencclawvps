/**
 * TvMcpPhase3RelayWiring
 * Phase 3: Local Relay Wiring — simulation/contract only.
 * No OS execution. No trading. No broker. No credentials. No orders.
 */
import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Play, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PHASE3_CONTRACT, PHASE3_AUDIT_LOG_KEY, generateAuditId } from './tvMcpContracts';

function loadPhase3Log() {
  try { return JSON.parse(localStorage.getItem(PHASE3_AUDIT_LOG_KEY) || '[]'); } catch { return []; }
}
function savePhase3Entry(entry) {
  try {
    const prev = loadPhase3Log();
    localStorage.setItem(PHASE3_AUDIT_LOG_KEY, JSON.stringify([entry, ...prev].slice(0, 200)));
  } catch {}
}

const STATUS_COLOR = {
  NOT_EXECUTED:          'text-slate-400',
  REJECTED_NOT_EXECUTED: 'text-destructive',
  READY_FOR_LOCAL_RELAY: 'text-primary',
  REVIEW_REQUIRED:       'text-amber-400',
};

export default function TvMcpPhase3RelayWiring() {
  const [selected,  setSelected]  = useState('status');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [log,       setLog]       = useState(() => loadPhase3Log());

  const runRelay = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('tradingViewMcpBridge', {
        command: selected,
        phase: 3,
      });
      const data = res.data;
      const entry = {
        auditId:            data.auditId || generateAuditId(),
        requestId:          `REQ-${Date.now().toString(36).toUpperCase()}`,
        command:            selected,
        commandArgs:        null,
        allowed:            data.allowed !== false,
        riskClass:          data.riskClass || data.risk || 'SAFE_READ',
        executionStatus:    data.executionStatus || 'NOT_EXECUTED',
        resultStatus:       data.ok ? 'SUCCESS' : 'REJECTED',
        reviewedByOperator: false,
        timestamp:          data.timestamp || new Date().toISOString(),
        normalizedData:     data.normalizedData || null,
        rawPreview:         data.data || null,
        error:              data.error || null,
        notes:              data.notes || null,
      };
      setResult(entry);
      savePhase3Entry(entry);
      setLog(prev => [entry, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Phase 3 warning banner */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/30 rounded-sm px-4 py-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[8px] text-amber-300 leading-relaxed">
          <span className="font-bold">Phase 3 prepares the relay wiring only.</span>{' '}
          It does not execute terminal commands, place trades, create alerts, modify charts, or access broker accounts.
          All results are simulated. executionStatus will never be <span className="font-bold text-destructive">EXECUTED</span>.
        </p>
      </div>

      {/* Bridge mode + status */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[9px] font-bold uppercase text-slate-300">Phase 3 — Relay Wiring Contract</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/30 text-primary text-[7px] font-bold rounded-sm">
              {PHASE3_CONTRACT.bridgeMode}
            </span>
            <span className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive text-[7px] font-bold rounded-sm">
              EXECUTION: {PHASE3_CONTRACT.executionStatus}
            </span>
          </div>
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Bridge Mode',      value: PHASE3_CONTRACT.bridgeMode },
            { label: 'Execution Status', value: PHASE3_CONTRACT.executionStatus, danger: true },
            { label: 'Phase',            value: PHASE3_CONTRACT.phase },
            { label: 'Local Path',       value: PHASE3_CONTRACT.localPath },
            { label: 'CLI Format',       value: PHASE3_CONTRACT.cliFormat },
            { label: 'Audit Key',        value: PHASE3_AUDIT_LOG_KEY },
          ].map(({ label, value, danger }) => (
            <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <div className="text-[7px] uppercase text-slate-500 mb-0.5 font-bold">{label}</div>
              <div className={`text-[8px] font-mono font-bold break-all ${danger ? 'text-destructive' : 'text-slate-300'}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Allowed + Blocked commands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Allowed */}
        <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-primary/20 bg-primary/5">
            <span className="text-[9px] font-bold uppercase text-primary">Allowed Commands — TVMCP-24</span>
          </div>
          <div className="p-3 space-y-1">
            {PHASE3_CONTRACT.allowedCommands.map(c => (
              <div key={c} className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/20 border border-border/20 rounded-sm">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] font-mono text-slate-300">{c}</span>
                {PHASE3_CONTRACT.reviewRequired.includes(c) && (
                  <span className="ml-auto px-1 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[6px] font-bold rounded-sm">REVIEW_REQUIRED</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-card border border-destructive/20 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-destructive/20 bg-destructive/5">
            <span className="text-[9px] font-bold uppercase text-destructive">Blocked Commands — TVMCP-25</span>
          </div>
          <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
            {PHASE3_CONTRACT.blockedCommands.map(c => (
              <div key={c} className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/20 border border-border/20 rounded-sm">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[8px] font-mono text-slate-400">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relay simulation tester */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20">
          <span className="text-[9px] font-bold uppercase text-slate-300">Relay Simulation Tester</span>
          <span className="ml-2 text-[7px] text-destructive font-mono">no subprocess · no execution · simulation only</span>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="bg-secondary border border-border/40 text-foreground text-[9px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-primary/50"
            >
              {PHASE3_CONTRACT.allowedCommands.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={runRelay}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run Relay Simulation
            </button>
            <span className="text-[7px] text-slate-600 font-mono">
              cli: npm run tv -- {selected}
            </span>
          </div>

          {result && (
            <div className="space-y-2">
              {/* Status row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[9px] font-bold font-mono ${STATUS_COLOR[result.executionStatus] || 'text-slate-400'}`}>
                  executionStatus: {result.executionStatus}
                </span>
                <span className="text-[8px] text-slate-500 font-mono">riskClass: <span className="text-slate-300">{result.riskClass}</span></span>
                <span className="text-[8px] text-slate-500 font-mono">allowed: <span className={result.allowed ? 'text-primary' : 'text-destructive'}>{String(result.allowed)}</span></span>
                <span className="text-[8px] text-slate-500 font-mono">auditId: <span className="text-slate-400">{result.auditId}</span></span>
              </div>

              {/* Normalized result */}
              <div className="bg-secondary/20 border border-border/30 rounded-sm p-3">
                <div className="text-[7px] uppercase text-slate-500 mb-1.5 font-bold">Normalized Result Envelope — TVMCP-31</div>
                <pre className="text-[8px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({
  auditId:            result.auditId,
  requestId:          result.requestId,
  command:            result.command,
  commandArgs:        result.commandArgs,
  allowed:            result.allowed,
  riskClass:          result.riskClass,
  executionStatus:    result.executionStatus,
  resultStatus:       result.resultStatus,
  reviewedByOperator: result.reviewedByOperator,
  timestamp:          result.timestamp,
  normalizedData:     result.normalizedData,
  rawPreview:         result.rawPreview,
  error:              result.error,
  notes:              result.notes,
}, null, 2)}
                </pre>
              </div>

              {result.executionStatus === 'REVIEW_REQUIRED' && (
                <div className="flex items-start gap-2 bg-amber-400/5 border border-amber-400/20 rounded-sm px-3 py-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[7px] text-amber-300">TVMCP-29: info command remains REVIEW_REQUIRED. Upstream MCP CLI bug — evaluate is not defined.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phase 3 audit log */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-300">Phase 3 Relay Audit Log</span>
            <span className="ml-2 text-[7px] text-slate-500 font-mono">key: {PHASE3_AUDIT_LOG_KEY}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">
              {log.length} entries — TVMCP-30
            </span>
            {log.length > 0 && (
              <button
                type="button"
                onClick={() => { localStorage.removeItem(PHASE3_AUDIT_LOG_KEY); setLog([]); }}
                className="text-[7px] text-slate-500 hover:text-slate-300 border border-border/30 px-2 py-1 rounded-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {log.length === 0 ? (
          <div className="px-4 py-6 text-center text-[8px] text-slate-600 font-mono">
            No Phase 3 relay simulations run yet
          </div>
        ) : (
          <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={entry.auditId || i} className="px-4 py-2.5 flex items-center gap-3 flex-wrap text-[7px] font-mono hover:bg-secondary/10">
                <span className="text-slate-600">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="text-slate-300 font-bold">{entry.command}</span>
                <span className={`font-bold ${STATUS_COLOR[entry.executionStatus] || 'text-slate-400'}`}>{entry.executionStatus}</span>
                <span className="text-slate-500">{entry.riskClass}</span>
                <span className="text-slate-600 ml-auto">{entry.auditId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Normalized schema reference */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20">
          <span className="text-[9px] font-bold uppercase text-slate-300">Normalized Relay Result Schema — TVMCP-31</span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {Object.entries(PHASE3_CONTRACT.normalizedSchema).map(([field, desc]) => (
            <div key={field} className="flex items-start gap-2 bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <span className="text-[8px] font-bold font-mono text-primary shrink-0 mt-0.5">{field}</span>
              <span className="text-[7px] text-slate-400 leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border/20 bg-destructive/5">
          <div className="text-[7px] text-destructive font-mono font-bold">
            TVMCP-27: executionStatus will never be "EXECUTED" in Phase 3. Valid values: NOT_EXECUTED · REJECTED_NOT_EXECUTED · READY_FOR_LOCAL_RELAY · REVIEW_REQUIRED
          </div>
        </div>
      </div>

    </div>
  );
}