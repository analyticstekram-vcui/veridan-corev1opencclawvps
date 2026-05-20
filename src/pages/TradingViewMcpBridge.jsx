/**
 * TradingViewMcpBridge
 * Veridan Core — TradingView MCP Bridge
 * Governed read-only mode. No trading. No broker. No credentials. No execution.
 * Local project: C:\Users\peter\tradingview-mcp  |  CLI: npm run tv -- <command>
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ModuleNav from '../components/navigation/ModuleNav';
import TvMcpConnectionStatus from '../components/tradingview-mcp/TvMcpConnectionStatus';
import TvMcpCommandPanel from '../components/tradingview-mcp/TvMcpCommandPanel';
import TvMcpResultViewer from '../components/tradingview-mcp/TvMcpResultViewer';
import TvMcpBridgeContract from '../components/tradingview-mcp/TvMcpBridgeContract';
import TvMcpAuditLog from '../components/tradingview-mcp/TvMcpAuditLog';
import TvMcpVerificationChecklist from '../components/tradingview-mcp/TvMcpVerificationChecklist';
import TvMcpRelayPathPreview from '../components/tradingview-mcp/TvMcpRelayPathPreview';
import TvMcpKnownResults from '../components/tradingview-mcp/TvMcpKnownResults';
import TvMcpPhase3RelayWiring from '../components/tradingview-mcp/TvMcpPhase3RelayWiring';
import TvMcpRelayWiringTab from '../components/tradingview-mcp/TvMcpRelayWiringTab';
import { FIXED_STATUSES, GUARDRAILS, generateAuditId, loadAuditLog, saveAuditEntry } from '../components/tradingview-mcp/tvMcpContracts';
import { ShieldAlert } from 'lucide-react';

const TABS = [
  { id: 'bridge',       label: 'Bridge Panel' },
  { id: 'relay',        label: 'Relay Adapter' },
  { id: 'results',      label: 'Known Results' },
  { id: 'phase3',       label: 'Phase 3 Sim' },
  { id: 'relaywiring',  label: 'Relay Wiring' },
  { id: 'contract',     label: 'Bridge Contract' },
  { id: 'audit',        label: 'Audit Log' },
  { id: 'verify',       label: 'Verification' },
];

export default function TradingViewMcpBridge() {
  const [activeTab,      setActiveTab]      = useState('bridge');
  const [statusResult,   setStatusResult]   = useState(null);
  const [latestResult,   setLatestResult]   = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [activeCommand,  setActiveCommand]  = useState(null);
  const [auditLog,       setAuditLog]       = useState([]);

  useEffect(() => {
    setAuditLog(loadAuditLog());
  }, []);

  const runCommand = async (cmd) => {
    setLoading(true);
    setActiveCommand(cmd.id);
    try {
      const res = await base44.functions.invoke('tradingViewMcpBridge', { command: cmd.id });
      const result = { ...res.data, _cmdMeta: cmd };
      setLatestResult(result);
      if (cmd.id === 'status') setStatusResult(result);

      // Save audit entry
      const entry = {
        auditId:         generateAuditId(),
        timestamp:       result.timestamp || new Date().toISOString(),
        command:         cmd.id,
        ok:              result.ok,
        risk:            result.risk || cmd.risk,
        symbol:          result.data?.chart_symbol || result.data?.symbol || null,
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus:  'NOT_DISPATCHED',
        isDryRun:        result.isDryRun || false,
        knownIssue:      result.knownIssue || null,
      };
      saveAuditEntry(entry);
      setAuditLog(prev => [entry, ...prev]);

    } finally {
      setLoading(false);
      setActiveCommand(null);
    }
  };

  const handleClearAudit = () => {
    localStorage.removeItem('tvmcp_audit_log');
    setAuditLog([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Safety boundary banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-3 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-400 leading-relaxed">
          <span className="font-bold">TradingView MCP Bridge is running in governed read-only mode.</span>{' '}
          It can inspect charts, quotes, candles, indicators, UI state, and screenshots.
          It <span className="font-bold text-destructive">cannot</span> place trades, enter broker credentials, move funds, or execute live orders.
        </p>
      </div>

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Trading Module
            </div>
            <h1 className="text-lg font-bold text-foreground">TradingView MCP Bridge</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Phase 2 + 3 · C:\Users\peter\tradingview-mcp · npm run tv -- &lt;command&gt; · READ_ONLY
            </p>
            <p className="text-[7px] text-slate-600 font-mono mt-0.5">
              phase3AuditLog: tradingViewMcpPhase3RelayAudit · relay: LOCAL_TERMINAL_RELAY_PREVIEW
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold uppercase rounded-sm">
              BRIDGE_MODE: READ_ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              EXECUTION: DISABLED
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              LIVE_TRADING: DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* Guardrails */}
      <div className="border-b border-border/40 bg-card/60 px-6 py-2">
        <div className="flex items-center gap-3 flex-wrap text-[8px] font-mono">
          {GUARDRAILS.map(g => (
            <span key={g} className="text-destructive font-bold">⊘ {g}</span>
          ))}
        </div>
      </div>

      {/* Status strip */}
      <div className="border-b border-border/20 bg-secondary/10 px-6 py-1.5">
        <div className="flex items-center gap-3 flex-wrap text-[7px] font-mono">
          {Object.entries(FIXED_STATUSES).map(([k, v]) => (
            <span key={k} className="text-slate-500">
              {k}: <span className={`font-bold ${v === 'DISABLED' ? 'text-destructive' : 'text-amber-400'}`}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
              {tab.id === 'audit' && auditLog.length > 0 && (
                <span className="ml-1.5 px-1 py-0.5 bg-primary/20 text-primary text-[7px] rounded-sm">{auditLog.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-5">

        {activeTab === 'bridge' && (
          <>
            <TvMcpConnectionStatus
              status={statusResult}
              loading={loading && activeCommand === 'status'}
              onRefresh={() => runCommand({ id: 'status', risk: 'SAFE_READ' })}
            />
            <TvMcpCommandPanel
              onCommand={runCommand}
              loading={loading}
              activeCommand={activeCommand}
            />
            <div>
              <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Result Viewer</div>
              <TvMcpResultViewer result={latestResult} />
            </div>
          </>
        )}

        {activeTab === 'relay' && <TvMcpRelayPathPreview />}

        {activeTab === 'results' && <TvMcpKnownResults />}

        {activeTab === 'phase3' && <TvMcpPhase3RelayWiring />}

        {activeTab === 'relaywiring' && <TvMcpRelayWiringTab />}

        {activeTab === 'contract' && <TvMcpBridgeContract />}

        {activeTab === 'audit' && (
          <TvMcpAuditLog entries={auditLog} onClear={handleClearAudit} />
        )}

        {activeTab === 'verify' && <TvMcpVerificationChecklist />}
      </div>
    </div>
  );
}