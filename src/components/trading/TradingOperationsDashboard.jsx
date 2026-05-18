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
import { TrendingUp, Lock, CheckCircle2, Home, AlertCircle } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';

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

        <SafetyStatusCard
          title="Trading Operations Safety Summary"
          statuses={[
            { label: 'Mode', value: 'PLANNING_ONLY', type: 'planning' },
            { label: 'Broker Connection', value: 'NOT_CONNECTED', type: 'neutral' },
            { label: 'TradingView Integration', value: 'DISABLED', type: 'disabled' },
            { label: 'Market Data Feed', value: 'DISABLED', type: 'disabled' },
            { label: 'Paper Trading', value: 'DISABLED', type: 'disabled' },
            { label: 'Live Trading', value: 'DISABLED', type: 'disabled' },
            { label: 'Order Execution', value: 'DISABLED', type: 'disabled' },
            { label: 'API Key Entry', value: 'DISABLED', type: 'disabled' },
            { label: 'Money Movement', value: 'DISABLED', type: 'disabled' },
          ]}
          disclaimer="This module is for planning and structure only. It does not connect to brokers, read live market data, place paper trades, place live trades, submit orders, store API keys, or move money."
        />

        <OperatorNextActionCard
          title="Operator Next Action"
          summaryTitle="Review trading operations structure before enabling paper trading workflows."
          summaryText="Verify that broker connection plan, TradingView integration, and paper trading requirements are properly documented and reviewed."
          checklist={[
            'Review broker connection plan',
            'Review TradingView chart plan',
            'Review paper trading requirements',
            'Confirm no broker connection exists',
            'Confirm no order execution exists',
            'Confirm no API key entry exists',
          ]}
          note="Checklist is local and resets on page refresh."
        />

        <BaselineCard
          title="Trading Operations Baseline"
          rows={[
            { label: 'Baseline Name', value: 'Trading Operations Planning Baseline' },
            { label: 'Baseline Status', value: 'APPROVED', valueClassName: 'text-primary' },
            { label: 'Mode', value: 'PLANNING_ONLY', valueClassName: 'text-amber-500' },
            { label: 'Broker Connection', value: 'NOT_CONNECTED', valueClassName: 'text-destructive' },
            { label: 'TradingView Integration', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Market Data Feed', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Paper Trading', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Live Trading', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Order Execution', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'API Key Entry', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Money Movement', value: 'DISABLED', valueClassName: 'text-destructive' },
          ]}
          disclaimer="This baseline confirms the Trading Operations module is approved for planning and structure review only."
        >
          <SnapshotExportButton
            snapshot={{
              snapshotType: 'TRADING_OPERATIONS_PLANNING_BASELINE',
              baselineName: 'Trading Operations Planning Baseline',
              baselineStatus: 'APPROVED',
              mode: 'PLANNING_ONLY',
              brokerConnection: 'NOT_CONNECTED',
              tradingViewIntegration: 'DISABLED',
              marketDataFeed: 'DISABLED',
              paperTrading: 'DISABLED',
              liveTrading: 'DISABLED',
              orderExecution: 'DISABLED',
              apiKeyEntry: 'DISABLED',
              moneyMovement: 'DISABLED',
              generatedAt: new Date().toISOString(),
              safetyClaims: [
                'No broker connection',
                'No TradingView integration',
                'No market data feed',
                'No paper trading',
                'No live trading',
                'No order execution',
                'No API key entry',
                'No money movement',
                'Planning-only baseline mode',
              ],
            }}
            filenamePrefix="trading-operations-baseline-snapshot"
            label="Export Trading Operations Snapshot"
          />
        </BaselineCard>

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

        {/* TradingView Webhook Requirements Draft */}
        <div className="mt-8 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">TradingView Webhook Requirements Draft</h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">This draft defines requirements for future TradingView webhook intake. It does not create a webhook endpoint, receive live alerts, connect to TradingView, or execute trades.</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Signal Schema Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Signal Schema</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">signalId</span>
                    <span className="text-slate-300">Unique identifier (UUID)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">generatedAt</span>
                    <span className="text-slate-300">ISO timestamp</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">source</span>
                    <span className="text-slate-300">TRADINGVIEW (fixed)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">symbol</span>
                    <span className="text-slate-300">MNQ, NQ, ES, etc.</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">timeframe</span>
                    <span className="text-slate-300">5m, 15m, 1h, 1d, etc.</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">strategyName</span>
                    <span className="text-slate-300">2 / 25 / 200 + MACD, etc.</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">signalType</span>
                    <span className="text-slate-300">ENTRY, EXIT, STOPOUT, etc.</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">direction</span>
                    <span className="text-slate-300">LONG, SHORT, FLAT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">entryReference</span>
                    <span className="text-slate-300">Price level (not executed)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">stopLossReference</span>
                    <span className="text-slate-300">SL price level</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">takeProfitReference</span>
                    <span className="text-slate-300">TP price level</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">riskLabel</span>
                    <span className="text-slate-300">LOW, MEDIUM, HIGH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">notes</span>
                    <span className="text-slate-300">Optional context</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Rules Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Validation Rules</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Require unique signalId</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Require source === TRADINGVIEW</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Require allowed symbol list (MNQ, NQ, ES)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Require allowed timeframe list (5m, 15m, 1h, 1d)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Require signalType from approved enum</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Require direction from LONG / SHORT / FLAT</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Reject missing risk data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Reject duplicate signalId</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Reject unsupported strategyName</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Gates Card */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[10px] font-mono font-bold uppercase text-destructive/80">Safety Gates</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Webhook Endpoint</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">NOT_CREATED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">TradingView Connection</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Broker Connection</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Paper Trading</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Live Trading</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Order Execution</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">API Key Entry</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Money Movement</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Future Flow */}
            <div className="bg-slate-700/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-700/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-300">Future Flow (Planning Only)</h3>
              </div>
              <div className="p-3">
                <div className="text-[8px] font-mono text-slate-300 space-y-1 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>TradingView Alert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Webhook Intake (Future)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Signal Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Local AI Request Draft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Operator Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Paper Trading Gate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Execution Gate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-slate-700/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-700/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-300">Webhook Requirements Status</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Requirements Draft</span>
                  <span className="text-[8px] font-mono font-bold text-primary">APPROVED_FOR_PLANNING</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Execution Approval</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">NOT_GRANTED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">External Connections</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Planning-Only Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
              <p className="text-[9px] font-mono text-slate-300 leading-relaxed">
                This webhook requirements draft is planning and documentation only. No webhook endpoint is created, no TradingView integration is active, no broker or market data calls are made, no trading logic is executed, and no external systems are connected.
              </p>
            </div>
          </div>
        </div>

        {/* Signal Validation Requirements Draft */}
        <div className="mt-8 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Signal Validation Requirements Draft</h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">This draft defines how future TradingView signals should be validated before becoming local AI request drafts. It does not validate live signals, receive webhooks, connect to TradingView, or execute trades.</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Required Signal Fields Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Required Signal Fields</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">signalId</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">source</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">symbol</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">timeframe</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">strategyName</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">signalType</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">direction</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">generatedAt</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">riskLabel</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">entryReference</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">stopLossReference</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">takeProfitReference</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allowed Values Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Allowed Values</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">source</span>
                    <span className="text-slate-300">TRADINGVIEW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">direction</span>
                    <span className="text-slate-300">LONG, SHORT, FLAT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">signalType</span>
                    <span className="text-slate-300">ENTRY, EXIT, ALERT, WARNING</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">riskLabel</span>
                    <span className="text-slate-300">LOW, MEDIUM, HIGH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">status</span>
                    <span className="text-slate-300">DRAFT_ONLY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Rules Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Rejection Rules</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Missing signalId</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Duplicate signalId</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Unsupported source</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Unsupported symbol</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Unsupported timeframe</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Missing risk label</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Missing strategy name</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Invalid direction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Invalid signal type</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Any execution request included</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Output Card */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[10px] font-mono font-bold uppercase text-destructive/80">Safety Output</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Validated Signal Output</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">LOCAL_DRAFT_ONLY</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Execution Approval</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">NOT_GRANTED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Broker Routing</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Market Data Lookup</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm col-span-2">
                  <span className="text-[8px] font-mono text-muted-foreground/70">External Connections</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-slate-700/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-700/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-300">Validation Requirements Status</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Requirements Draft</span>
                  <span className="text-[8px] font-mono font-bold text-primary">APPROVED_FOR_PLANNING</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Live Validation</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Backend Route</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">NOT_CREATED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">External Calls</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Planning-Only Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
              <p className="text-[9px] font-mono text-slate-300 leading-relaxed">
                This signal validation requirements draft is planning and documentation only. No validation functions are created, no webhooks are processed, no TradingView integration is active, no broker or market data lookups occur, and no execution is triggered.
              </p>
            </div>
          </div>
        </div>

        {/* Paper Trading Requirements Draft */}
        <div className="mt-8 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Paper Trading Requirements Draft</h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">This draft defines what must exist before paper trading can be enabled. It does not place paper trades, connect to brokers, call market data, submit orders, or execute strategies.</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Paper Trading Preconditions Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Paper Trading Preconditions</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Master baseline approved</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Trading Operations baseline approved</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>TradingView webhook requirements approved for planning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Signal validation requirements approved for planning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Risk engine requirements defined</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Broker sandbox selected</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>API key vault design approved</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Operator review gate active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Paper Trade Fields Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Required Paper Trade Fields</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">paperTradeId</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">sourceSignalId</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">symbol</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">direction</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">entryPriceReference</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">stopLossReference</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">takeProfitReference</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">positionSize</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">riskAmount</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">strategyName</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">status</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">createdAt</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Paper Trade Statuses Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Paper Trade Statuses</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">DRAFT_ONLY</span>
                    <span className="text-slate-400">Initial state</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">READY_FOR_REVIEW</span>
                    <span className="text-slate-400">Pending operator review</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">APPROVED_FOR_PAPER</span>
                    <span className="text-primary">Operator approved</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">REJECTED</span>
                    <span className="text-destructive">Operator rejected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">SIMULATED</span>
                    <span className="text-slate-400">Paper simulation run</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">CLOSED</span>
                    <span className="text-slate-400">Paper trade closed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">ERROR_REVIEW</span>
                    <span className="text-destructive">Error occurred</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Controls Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Risk Controls</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[8px] font-mono text-slate-300 space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Max daily paper loss required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Max daily paper profit required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Max trades per day required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Max position size required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Stop loss required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Take profit required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>No live order routing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Human review required</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Gates Card */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[10px] font-mono font-bold uppercase text-destructive/80">Safety Gates</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Broker Connection</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Market Data Feed</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Paper Order Submission</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Live Trading</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Order Execution</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">API Key Entry</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm col-span-2">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Money Movement</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Future Flow */}
            <div className="bg-slate-700/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-700/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-300">Future Flow (Planning Only)</h3>
              </div>
              <div className="p-3">
                <div className="text-[8px] font-mono text-slate-300 space-y-1 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Validated Signal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Paper Trade Draft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Operator Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Paper Approval Gate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Paper Simulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Paper Journal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Reconciliation Review</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-slate-700/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-700/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-300">Paper Trading Requirements Status</h3>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Requirements Draft</span>
                  <span className="text-[8px] font-mono font-bold text-primary">APPROVED_FOR_PLANNING</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Paper Trading</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Backend Route</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">NOT_CREATED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">External Calls</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Execution Approval</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">NOT_GRANTED</span>
                </div>
              </div>
            </div>

            {/* Planning-Only Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
              <p className="text-[9px] font-mono text-slate-300 leading-relaxed">
                This paper trading requirements draft is planning and documentation only. No paper trading functions are created, no broker connections are established, no market data feeds are activated, no paper orders are submitted, and no trading logic is executed.
              </p>
            </div>
          </div>
        </div>

        {/* MCP + TradingView Planning Blueprint Section */}
        <div className="mt-8 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">MCP + TradingView Planning Blueprint</h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">This blueprint defines future MCP and TradingView integration paths. No MCP server, TradingView widget, webhook, broker connection, market data feed, paper trading, or live trading is enabled.</p>
          </div>
          <div className="p-4 space-y-4">
            {/* MCP Planning Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">MCP Planning</h3>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">MCP Status</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">PLANNED / DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">OpenClaw Tool Bridge</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">PLANNED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Approved Tool Registry</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">REQUIRED_BEFORE_USE</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">External Tool Calls</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-secondary/30 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Human Review</span>
                  <span className="text-[8px] font-mono font-bold text-slate-300">REQUIRED</span>
                </div>
              </div>
            </div>

            {/* TradingView Planning Card */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">TradingView Planning</h3>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">TradingView Widget</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">PLANNED / DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Webhook Intake</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">PLANNED / DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Alert Signal Schema</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">REQUIRED_BEFORE_USE</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-700/10 border border-border/20 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Chart Context</span>
                  <span className="text-[8px] font-mono font-bold text-amber-500">READ_ONLY_FUTURE</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Strategy Alerts</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Trading Safety Gate Card */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[10px] font-mono font-bold uppercase text-destructive/80">Trading Safety Gate</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Broker Connection</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Market Data</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Paper Trading</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Live Trading</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Order Execution</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm">
                  <span className="text-[8px] font-mono text-muted-foreground/70">API Key Entry</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-destructive/5 border border-destructive/30 rounded-sm col-span-2">
                  <span className="text-[8px] font-mono text-muted-foreground/70">Money Movement</span>
                  <span className="text-[8px] font-mono font-bold text-destructive">DISABLED</span>
                </div>
              </div>
            </div>

            {/* Future Integration Flow */}
            <div className="bg-slate-700/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-700/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-300">Future Integration Flow</h3>
              </div>
              <div className="p-3">
                <div className="text-[8px] font-mono text-slate-300 space-y-1 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>TradingView Alert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Signal Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Local Draft Proposal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Operator Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Paper Trading Gate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Live Trading Gate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Planning-Only Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
              <p className="text-[9px] font-mono text-slate-300 leading-relaxed">
                This blueprint is planning and documentation only. No MCP server, TradingView integration, broker connection, market data, trading logic, or money movement is implemented or executed.
              </p>
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