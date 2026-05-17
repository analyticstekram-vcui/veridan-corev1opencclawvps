/**
 * TradingOperationsDashboard
 * Read-only planning interface for trading operations.
 * Visibility and planning only. No broker connection, TradingView, market data, paper trading, or live execution.
 *
 * Does NOT:
 *   - Call broker APIs
 *   - Call TradingView
 *   - Fetch market data
 *   - Execute paper trades
 *   - Execute live trades
 *   - Submit orders
 *   - Store API keys
 *   - Move money
 *   - Call backends
 *   - Write localStorage
 *   - Use timers
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Lock, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';

function StatusBadge({ label, value, type = 'neutral' }) {
  const colors = {
    neutral: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
    disabled: 'text-destructive border-destructive/30 bg-destructive/5',
    planning: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${colors[type]}`}>
      <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{label}</span>
      <span className="text-[10px] font-mono font-bold flex-1">{value}</span>
    </div>
  );
}

function DashboardSection({ title, description, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h3 className="text-[11px] font-mono font-bold uppercase text-slate-100">{title}</h3>
        <p className="text-[9px] font-mono text-slate-400 mt-1">{description}</p>
      </div>
      <div className="p-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function CreditItemCard({ label }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5 px-2 bg-secondary/20 border border-border/30 rounded-sm">
      <CheckCircle2 className="w-3 h-3 text-primary/60 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function TradingOperationsDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNav />
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-mono font-bold text-slate-100">Trading Operations</h1>
            </div>
            <p className="text-[13px] font-mono text-slate-300">
              Read-only planning and structure for trading strategy, broker integration, and order management
            </p>
            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-slate-400">
              <Lock className="w-3 h-3" />
              Planning mode · No broker connection yet · No execution
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5 h-fit">
            <Home className="w-3 h-3" />
            Home
          </Link>
        </div>

        {/* Trading Operations Safety Summary Card */}
        <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Trading Operations Safety Summary</h2>
          </div>
          <div className="p-4 space-y-2">
            <StatusBadge label="Mode" value="PLANNING_ONLY" type="planning" />
            <StatusBadge label="Broker Connection" value="NOT_CONNECTED" type="neutral" />
            <StatusBadge label="TradingView Integration" value="DISABLED" type="disabled" />
            <StatusBadge label="Market Data Feed" value="DISABLED" type="disabled" />
            <StatusBadge label="Paper Trading" value="DISABLED" type="disabled" />
            <StatusBadge label="Live Trading" value="DISABLED" type="disabled" />
            <StatusBadge label="Order Execution" value="DISABLED" type="disabled" />
            <StatusBadge label="API Key Entry" value="DISABLED" type="disabled" />
            <StatusBadge label="Money Movement" value="DISABLED" type="disabled" />
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3 mt-3">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                This module is for planning and structure only. It does not connect to brokers, read live market data, place paper trades, place live trades, submit orders, store API keys, or move money.
              </p>
            </div>
          </div>
        </div>

        {/* Operator Next Action Card */}
        <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Operator Next Action</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
              <p className="text-[11px] font-mono font-bold text-primary mb-2">Review trading operations structure before enabling paper trading workflows.</p>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Verify that broker connection plan, TradingView integration, and paper trading requirements are properly documented and reviewed.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-[9px] font-mono font-semibold uppercase text-muted-foreground/70 mb-2">Action Checklist</div>
              <button type="button" className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Review broker connection plan</span>
              </button>
              <button type="button" className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Review TradingView chart plan</span>
              </button>
              <button type="button" className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Review paper trading requirements</span>
              </button>
              <button type="button" className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Confirm no broker connection exists</span>
              </button>
              <button type="button" className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Confirm no order execution exists</span>
              </button>
              <button type="button" className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full">
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Confirm no API key entry exists</span>
              </button>
              <div className="text-[8px] font-mono text-muted-foreground/50 mt-3">
                Checklist is local and resets on page refresh.
              </div>
            </div>
          </div>
        </div>

        {/* Trading Operations Baseline Card */}
        <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Trading Operations Baseline</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Baseline Name</span>
                <span className="text-[10px] font-mono font-bold text-slate-300">Trading Operations Planning Baseline</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Baseline Status</span>
                <span className="text-[10px] font-mono font-bold text-primary">APPROVED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Mode</span>
                <span className="text-[10px] font-mono font-bold text-amber-500">PLANNING_ONLY</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Broker Connection</span>
                <span className="text-[10px] font-mono font-bold text-destructive">NOT_CONNECTED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">TradingView Integration</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Market Data Feed</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Paper Trading</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Live Trading</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Order Execution</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">API Key Entry</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Money Movement</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                This baseline confirms the Trading Operations module is approved for planning and structure review only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const snapshot = {
                  snapshotType: "TRADING_OPERATIONS_PLANNING_BASELINE",
                  baselineName: "Trading Operations Planning Baseline",
                  baselineStatus: "APPROVED",
                  mode: "PLANNING_ONLY",
                  brokerConnection: "NOT_CONNECTED",
                  tradingViewIntegration: "DISABLED",
                  marketDataFeed: "DISABLED",
                  paperTrading: "DISABLED",
                  liveTrading: "DISABLED",
                  orderExecution: "DISABLED",
                  apiKeyEntry: "DISABLED",
                  moneyMovement: "DISABLED",
                  generatedAt: new Date().toISOString(),
                  safetyClaims: [
                    "No broker connection",
                    "No TradingView integration",
                    "No market data feed",
                    "No paper trading",
                    "No live trading",
                    "No order execution",
                    "No API key entry",
                    "No money movement",
                    "Planning-only baseline mode",
                  ],
                };
                const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trading-operations-baseline-snapshot-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 text-[10px] font-mono font-bold border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-sm"
            >
              Export Trading Operations Snapshot
            </button>
          </div>
        </div>

        {/* Grid of sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Trading Strategy */}
          <DashboardSection
            title="1. Trading Strategy"
            description="Current trading strategy and market focus"
          >
            <CreditItemCard label="Market: MNQ (Micro Nasdaq Futures)" />
            <CreditItemCard label="Strategy: 2 / 25 / 200 + MACD zero-line" />
            <CreditItemCard label="Risk limits: $500 max daily loss, $1000 max gain" />
            <CreditItemCard label="Session: New York RTH only" />
            <CreditItemCard label="Planned timeframes and entry/exit rules" />
          </DashboardSection>

          {/* 2. Broker Integration */}
          <DashboardSection
            title="2. Broker Integration Plan"
            description="Planned broker and connection requirements"
          >
            <CreditItemCard label="Broker: Tradovate (planned)" />
            <CreditItemCard label="Connection: API integration planning" />
            <CreditItemCard label="Account type: Paper trading first" />
            <CreditItemCard label="Order submission: Manual review required" />
            <CreditItemCard label="No live execution until approved" />
          </DashboardSection>

          {/* 3. Market Data */}
          <DashboardSection
            title="3. Market Data & Charting"
            description="Data sources and visualization tools"
          >
            <CreditItemCard label="Market data provider: Not connected yet" />
            <CreditItemCard label="TradingView integration: Not connected yet" />
            <CreditItemCard label="Real-time quotes: Planning mode" />
            <CreditItemCard label="Historical data: Planning mode" />
            <CreditItemCard label="Chart analysis: Manual preparation" />
          </DashboardSection>

          {/* 4. Paper Trading Setup */}
          <DashboardSection
            title="4. Paper Trading Setup"
            description="Sandbox and simulation environment"
          >
            <CreditItemCard label="Paper account: Not created yet" />
            <CreditItemCard label="Virtual balance: Planning only" />
            <CreditItemCard label="Trade simulation: Ready for implementation" />
            <CreditItemCard label="Order flow simulation: Planned" />
            <CreditItemCard label="P&L tracking: Structure planned" />
          </DashboardSection>

          {/* 5. Order Management */}
          <DashboardSection
            title="5. Order Management & Execution"
            description="Order placement and tracking infrastructure"
          >
            <CreditItemCard label="Order types: Market, limit, stop orders" />
            <CreditItemCard label="Order validation: Rules-based pre-check" />
            <CreditItemCard label="Execution confirmation: Manual approval required" />
            <CreditItemCard label="Order tracking: Planned logging system" />
            <CreditItemCard label="Risk controls: Position size, daily loss limits" />
          </DashboardSection>

          {/* 6. Safety Rules */}
          <DashboardSection
            title="6. Safety & Compliance Rules"
            description="Constraints and prohibitions for this phase"
          >
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2 border border-destructive/30 rounded-sm bg-destructive/5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No broker connection yet</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2 border border-destructive/30 rounded-sm bg-destructive/5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No API key entry</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2 border border-destructive/30 rounded-sm bg-destructive/5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No paper trading execution</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2 border border-destructive/30 rounded-sm bg-destructive/5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No live trading</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2 border border-destructive/30 rounded-sm bg-destructive/5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No money movement</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2 border border-destructive/30 rounded-sm bg-destructive/5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No TradingView connection</span>
            </div>
          </DashboardSection>

          {/* 7. Next Allowed Action */}
          <div className="lg:col-span-2 flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
              <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build trading strategy structure and paper trading simulation framework.</div>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[9px] font-mono text-muted-foreground/70">
            <p className="font-bold mb-1">About Trading Operations</p>
            <p>This dashboard provides read-only visibility into the planning and structure of Veridan Core's trading operations. It is for planning and visibility only. No brokers are connected, no API keys are stored, and no trades (paper or live) are executed. All trading actions require manual operator approval and are disabled until explicitly enabled.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}