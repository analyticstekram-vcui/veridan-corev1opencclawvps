/**
 * McpTradingViewPreview
 * MCP TradingView Visual Confirmation Preview
 * Governance-only · Simulated-only · Preview-only
 * No TradingView connection · No execution · No order creation
 */
import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import McpArchitectureFlow from '../components/mcp-tradingview/McpArchitectureFlow';
import McpAlertInputForm from '../components/mcp-tradingview/McpAlertInputForm';
import McpResultPanel from '../components/mcp-tradingview/McpResultPanel';
import McpHistoryTable from '../components/mcp-tradingview/McpHistoryTable';
import McpDetailDrawer from '../components/mcp-tradingview/McpDetailDrawer';
import { FIXED_STATUSES, GUARDRAILS } from '../components/mcp-tradingview/mcpTradingViewContracts';

const TABS = [
  { id: 'architecture', label: 'Architecture Flow' },
  { id: 'generator',    label: 'Preview Generator' },
  { id: 'history',      label: 'Preview History' },
];

const STATUS_COLORS = {
  SIMULATED_ONLY:          'text-amber-400',
  PREVIEW_ONLY:            'text-amber-400',
  DISABLED:                'text-destructive',
  DISABLED_UNTIL_APPROVED: 'text-destructive',
  NO_ORDER_CREATED:        'text-destructive',
  NOT_EXECUTED:            'text-destructive',
};

export default function McpTradingViewPreview() {
  const [activeTab,    setActiveTab]    = useState('architecture');
  const [latestResult, setLatestResult] = useState(null);
  const [history,      setHistory]      = useState([]);
  const [selected,     setSelected]     = useState(null);

  const handleResult = (result) => {
    setLatestResult(result);
    setHistory(prev => [result, ...prev]);
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Trading Module
            </div>
            <h1 className="text-lg font-bold text-foreground">MCP TradingView Visual Confirmation Preview</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Visual-confirmation contract and audit layer only · EMA 2/25/200 + MACD · MNQ 5m workflow
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">
              SIMULATED_ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              NO_ORDER_CREATED
            </span>
          </div>
        </div>
      </div>

      {/* Guardrails */}
      <div className="border-b border-border/40 bg-card/60 px-6 py-2">
        <div className="flex items-center gap-4 flex-wrap text-[8px] font-mono">
          {GUARDRAILS.map(g => (
            <span key={g} className="text-destructive font-bold">⊘ {g}</span>
          ))}
        </div>
      </div>

      {/* Status strip */}
      <div className="border-b border-border/20 bg-secondary/10 px-6 py-1.5">
        <div className="flex items-center gap-4 flex-wrap text-[7px] font-mono">
          {Object.entries(FIXED_STATUSES).map(([k, v]) => (
            <span key={k} className="text-slate-500">
              {k}: <span className={`font-bold ${STATUS_COLORS[v] || 'text-slate-300'}`}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
              {tab.id === 'history' && history.length > 0 && (
                <span className="ml-1.5 px-1 py-0.5 bg-primary/20 text-primary text-[7px] rounded-sm">{history.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">

        {/* Architecture tab */}
        {activeTab === 'architecture' && (
          <div className="space-y-4">
            <div className="bg-card border border-border/40 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                10-Stage Pipeline Architecture — TradingView → Paper Trade Proposal
              </div>
              <McpArchitectureFlow />
            </div>

            {/* Sample MNQ workflow card */}
            <div className="bg-card border border-amber-500/30 rounded-sm p-4 space-y-3">
              <div className="text-[9px] font-bold uppercase text-amber-400">
                Sample MNQ 5m Workflow — EMA 2/25/200 + MACD
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[8px]">
                <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
                  <div className="font-bold text-foreground">Signal Conditions</div>
                  <div className="text-slate-400 space-y-0.5">
                    <div>• EMA 2 crossing above EMA 25</div>
                    <div>• EMA 25 above EMA 200 (trend filter)</div>
                    <div>• Price above all three EMAs</div>
                    <div>• MACD histogram positive + above zero</div>
                    <div>• Volume above 20-period average</div>
                  </div>
                </div>
                <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
                  <div className="font-bold text-foreground">MCP Tool Schema</div>
                  <div className="text-slate-400 space-y-0.5">
                    <div>• tradingview.alert.receive</div>
                    <div>• tradingview.chart.open.preview</div>
                    <div>• tradingview.visual.checklist</div>
                    <div>• tradingview.signal.score</div>
                    <div>• openclaw.wake.preview</div>
                  </div>
                </div>
                <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
                  <div className="font-bold text-foreground">Governance Constraints</div>
                  <div className="text-slate-400 space-y-0.5">
                    <div className="text-destructive">• NO_ORDER_CREATED</div>
                    <div className="text-destructive">• NOT_EXECUTED</div>
                    <div className="text-destructive">• BROKER: NOT_CONNECTED</div>
                    <div className="text-amber-400">• APPROVAL: REQUIRED</div>
                    <div className="text-amber-400">• MODE: SIMULATED_ONLY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generator tab */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="bg-card border border-border/40 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">Mock Alert Input — Local Validation Only</div>
              <McpAlertInputForm onResult={handleResult} />
            </div>
            {latestResult && (
              <div>
                <div className="text-[8px] font-bold uppercase text-slate-400 mb-3">Latest Preview Result</div>
                <McpResultPanel result={latestResult} />
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono">
              {history.length} preview runs this session · All locked NOT_EXECUTED / NO_ORDER_CREATED
            </div>
            <McpHistoryTable runs={history} onSelect={setSelected} />
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && <McpDetailDrawer result={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}