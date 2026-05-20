/**
 * TvMcpRelayWiringTab
 * Phase 3: Local Relay Wiring documentation and preview.
 * READ_ONLY · EXECUTION_DISABLED · No broker · No credentials · No orders.
 */
import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Server, Terminal, Play, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { RELAY_WIRING_CONTRACT, RELAY_WIRING_AUDIT_KEY, generateAuditId } from './tvMcpContracts';

function loadWiringLog() {
  try { return JSON.parse(localStorage.getItem(RELAY_WIRING_AUDIT_KEY) || '[]'); } catch { return []; }
}
function saveWiringEntry(entry) {
  try {
    const prev = loadWiringLog();
    localStorage.setItem(RELAY_WIRING_AUDIT_KEY, JSON.stringify([entry, ...prev].slice(0, 200)));
  } catch {}
}

export default function TvMcpRelayWiringTab() {
  const [selected, setSelected] = useState('status');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [log,      setLog]      = useState(() => loadWiringLog());

  const runPreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('tradingViewMcpBridge', { command: selected, phase: 3 });
      const data = res.data;

      const entry = {
        auditId:            data.auditId || generateAuditId(),
        command:            selected,
        executionStatus:    'NOT_EXECUTED',
        relayMode:          'LOCAL_TERMINAL_RELAY_PREVIEW',
        riskClass:          'SAFE_READ',
        success:            data.ok !== false,
        source:             'tradingview-mcp',
        rawResult:          data.data || null,
        normalizedResult:   data.normalizedData || data.data || null,
        reviewedByOperator: false,
        timestamp:          data.timestamp || new Date().toISOString(),
      };

      setResult(entry);
      saveWiringEntry(entry);
      setLog(prev => [entry, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Safety banner */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/30 rounded-sm px-4 py-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[8px] text-amber-300 leading-relaxed">
          <span className="font-bold">Phase 3 Relay Wiring — READ_ONLY · EXECUTION_DISABLED.</span>{' '}
          Documents and previews the local terminal relay path from Veridan Core to the local Windows tradingview-mcp process.
          Does not execute terminal commands, place trades, create alerts, modify charts, access broker accounts, or handle credentials.
        </p>
      </div>

      {/* PM2 Process Card */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase text-slate-300">Local MCP Process — PM2</span>
          <span className="ml-auto px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">
            TVMCP-23
          </span>
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Process Name',      value: RELAY_WIRING_CONTRACT.processName,       accent: true },
            { label: 'PM2 Status',        value: RELAY_WIRING_CONTRACT.pm2Status,          accent: true },
            { label: 'Working Directory', value: RELAY_WIRING_CONTRACT.workingDirectory },
            { label: 'Launch Command',    value: RELAY_WIRING_CONTRACT.launchCommand },
            { label: 'Test Pattern',      value: RELAY_WIRING_CONTRACT.testCommandPattern },
            { label: 'Relay Status',      value: RELAY_WIRING_CONTRACT.relayStatus,        amber: true },
            { label: 'Bridge Mode',       value: RELAY_WIRING_CONTRACT.bridgeMode,         amber: true },
            { label: 'Execution',         value: RELAY_WIRING_CONTRACT.executionStatus,    danger: true },
            { label: 'Audit Key',         value: RELAY_WIRING_AUDIT_KEY },
          ].map(({ label, value, accent, danger, amber }) => (
            <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <div className="text-[7px] uppercase text-slate-500 mb-0.5 font-bold">{label}</div>
              <div className={`text-[8px] font-mono font-bold break-all ${
                danger ? 'text-destructive' : amber ? 'text-amber-400' : accent ? 'text-primary' : 'text-slate-300'
              }`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Relay Path Flow */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase text-slate-300">Relay Path Flow</span>
        </div>
        <div className="p-3">
          <div className="flex flex-col gap-0">
            {[
              { step: 1, label: 'Veridan Core UI',     detail: 'Operator selects safe command from allowlist' },
              { step: 2, label: 'Backend Validation',  detail: 'tradingViewMcpBridge — allowlist check + risk classification' },
              { step: 3, label: 'Command Allowlist',   detail: `Only: ${RELAY_WIRING_CONTRACT.allowedCommands.join(', ')}` },
              { step: 4, label: 'Risk Classification', detail: 'SAFE_READ enforced · REVIEW_REQUIRED if info-type · BLOCKED if forbidden' },
              { step: 5, label: 'Normalized Envelope', detail: 'auditId · executionStatus: NOT_EXECUTED · relayMode: LOCAL_TERMINAL_RELAY_PREVIEW' },
              { step: 6, label: 'localStorage Write',  detail: `Key: ${RELAY_WIRING_AUDIT_KEY}` },
              { step: 7, label: 'Result Viewer Update',detail: 'UI receives normalized result — no raw subprocess output exposed' },
            ].map(({ step, label, detail }, idx, arr) => (
              <div key={step} className="flex items-stretch gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-sm bg-primary/20 border border-primary/30 text-primary text-[7px] font-bold flex items-center justify-center shrink-0">{step}</div>
                  {idx < arr.length - 1 && <div className="w-px flex-1 bg-border/30 my-0.5" />}
                </div>
                <div className="flex-1 pb-1.5">
                  <div className="text-[9px] font-bold text-foreground">{label}</div>
                  <div className="text-[7px] text-slate-500 font-mono mt-0.5">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-border/20 bg-amber-500/5">
          <div className="text-[7px] text-amber-400 font-mono">
            ⚠ Steps 3–7 are preview-only. No subprocess is spawned. Local relay agent not yet deployed — TVMCP-29.
          </div>
        </div>
      </div>

      {/* Allowed vs Blocked */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-primary/20 bg-primary/5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase text-primary">Allowed Safe Commands</span>
            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">TVMCP-24</span>
          </div>
          <div className="p-3 space-y-1">
            {RELAY_WIRING_CONTRACT.allowedCommands.map(c => (
              <div key={c} className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/20 border border-border/20 rounded-sm">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[8px] font-mono text-slate-300">{c}</span>
                <span className="ml-auto text-[6px] text-slate-600 font-mono">npm run tv -- {c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-destructive/20 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-destructive/20 bg-destructive/5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase text-destructive">Blocked Commands</span>
            <span className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-bold rounded-sm">TVMCP-26–28</span>
          </div>
          <div className="p-3 space-y-1 max-h-52 overflow-y-auto">
            {RELAY_WIRING_CONTRACT.blockedCommands.map(c => (
              <div key={c} className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/20 border border-border/20 rounded-sm">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[8px] font-mono text-slate-400">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Tester */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[9px] font-bold uppercase text-slate-300">Relay Preview Tester</span>
          <span className="ml-2 text-[7px] text-destructive font-mono">preview-only · no subprocess · TVMCP-29</span>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="bg-secondary border border-border/40 text-foreground text-[9px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-primary/50"
            >
              {RELAY_WIRING_CONTRACT.allowedCommands.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={runPreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run Preview
            </button>
            <span className="text-[7px] text-slate-600 font-mono">npm run tv -- {selected}</span>
          </div>

          {result && (
            <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-2">
              <div className="flex items-center gap-3 flex-wrap text-[7px] font-mono">
                <span className="text-slate-400">executionStatus: <span className="text-slate-300 font-bold">{result.executionStatus}</span></span>
                <span className="text-slate-400">relayMode: <span className="text-amber-400 font-bold">{result.relayMode}</span></span>
                <span className="text-slate-400">riskClass: <span className="text-primary font-bold">{result.riskClass}</span></span>
                <span className="text-slate-400">source: <span className="text-slate-300">{result.source}</span></span>
              </div>
              <div className="text-[7px] uppercase text-slate-500 font-bold">Normalized Response — TVMCP-30</div>
              <pre className="text-[8px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({
  auditId:            result.auditId,
  command:            result.command,
  executionStatus:    result.executionStatus,
  relayMode:          result.relayMode,
  riskClass:          result.riskClass,
  success:            result.success,
  source:             result.source,
  rawResult:          result.rawResult,
  normalizedResult:   result.normalizedResult,
  reviewedByOperator: result.reviewedByOperator,
  timestamp:          result.timestamp,
}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-300">Relay Wiring Audit Log</span>
            <span className="ml-2 text-[7px] text-slate-500 font-mono">key: {RELAY_WIRING_AUDIT_KEY}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] font-bold rounded-sm">{log.length} entries</span>
            {log.length > 0 && (
              <button type="button" onClick={() => { localStorage.removeItem(RELAY_WIRING_AUDIT_KEY); setLog([]); }}
                className="text-[7px] text-slate-500 hover:text-slate-300 border border-border/30 px-2 py-1 rounded-sm transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>
        {log.length === 0 ? (
          <div className="px-4 py-6 text-center text-[8px] text-slate-600 font-mono">No relay wiring previews run yet</div>
        ) : (
          <div className="divide-y divide-border/20 max-h-48 overflow-y-auto">
            {log.map((e, i) => (
              <div key={e.auditId || i} className="px-4 py-2 flex items-center gap-3 flex-wrap text-[7px] font-mono hover:bg-secondary/10">
                <span className="text-slate-600">{new Date(e.timestamp).toLocaleTimeString()}</span>
                <span className="text-slate-300 font-bold">{e.command}</span>
                <span className="text-slate-400">{e.executionStatus}</span>
                <span className="text-primary">{e.riskClass}</span>
                <span className="text-slate-600 ml-auto">{e.auditId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Normalized Response Shape */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase text-slate-300">Normalized Response Shape — TVMCP-30</span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {Object.entries(RELAY_WIRING_CONTRACT.normalizedResponseShape).map(([field, desc]) => (
            <div key={field} className="flex items-start gap-2 bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <span className="text-[8px] font-bold font-mono text-primary shrink-0">{field}</span>
              <span className="text-[7px] text-slate-400 leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Checks */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20">
          <span className="text-[9px] font-bold uppercase text-slate-300">Phase 3 Relay Wiring Verification — TVMCP-23 to TVMCP-30</span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {RELAY_WIRING_CONTRACT.verificationChecks.map(item => (
            <div key={item.id} className="flex items-center gap-2 bg-secondary/20 border border-primary/20 rounded-sm px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[7px] font-bold text-primary font-mono">{item.id}</span>
              <span className="text-[8px] text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="px-4 pb-3">
          <div className="text-[7px] text-primary font-mono">✓ All {RELAY_WIRING_CONTRACT.verificationChecks.length} Phase 3 relay wiring checks documented</div>
        </div>
      </div>

    </div>
  );
}