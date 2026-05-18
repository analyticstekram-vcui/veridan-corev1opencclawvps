/**
 * TradingOperationsDashboard
 * Read-only planning interface for trading operations.
 * Visibility and planning only. No broker connection, TradingView, market data, paper trading, or live execution.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Lock, Home, AlertCircle } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';

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

          {/* Workflow Categories */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Trading Workflow Categories</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Planning structure for eight trading workflow category types, showing safe-now capabilities, blocked items, and next development steps.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[
                { name: 'Strategy Review', purpose: 'Review and validate trading strategy, entry/exit rules, and risk parameters', safeNow: ['Strategy documentation', 'Rule validation', 'Risk assessment'], blocked: ['Live execution', 'Automated trading', 'Order placement'], nextStep: 'Finalize trading strategy documentation and approval process' },
                { name: 'Paper Trading', purpose: 'Sandbox simulation environment for strategy testing and operator readiness', safeNow: ['Trading simulation', 'Risk tracking', 'P&L journal'], blocked: ['Live orders', 'Broker connection', 'Money movement'], nextStep: 'Design paper trading simulation framework and approval gates' },
                { name: 'Risk Controls', purpose: 'Risk management rules, position sizing, and loss limits', safeNow: ['Risk rule documentation', 'Limit definition', 'Compliance review'], blocked: ['Automated enforcement', 'Real-time limits', 'Execution gates'], nextStep: 'Define risk control schema and enforcement mechanisms' },
                { name: 'Market Data Planning', purpose: 'Data sources and real-time quote requirements for trading', safeNow: ['Data requirements definition', 'Provider selection', 'Schema design'], blocked: ['Live market feeds', 'Real-time quotes', 'Data streaming'], nextStep: 'Design market data integration architecture' },
                { name: 'TradingView Chart Planning', purpose: 'TradingView webhook integration and signal validation planning', safeNow: ['Webhook schema design', 'Signal validation rules', 'Integration planning'], blocked: ['Webhook endpoint', 'Live signal intake', 'Strategy alerts'], nextStep: 'Finalize webhook schema and signal validation requirements' },
                { name: 'Broker Integration Planning', purpose: 'Broker API integration design and requirements specification', safeNow: ['Integration planning', 'API specification', 'Auth design'], blocked: ['Broker connection', 'Paper orders', 'Live orders'], nextStep: 'Design broker integration contracts and safety gates' },
                { name: 'OpenClaw Trade Governance', purpose: 'Governance framework for AI-assisted trade management and approvals', safeNow: ['Governance design', 'Approval workflow', 'Audit planning'], blocked: ['Trade execution', 'Automated trading', 'Order routing'], nextStep: 'Define OpenClaw governance contracts and execution gates' },
                { name: 'Future Live Execution', purpose: 'Reserved for live trading capabilities when fully approved', safeNow: ['Architecture planning', 'Safety framework', 'Governance design'], blocked: ['Live order placement', 'Broker execution', 'Money movement'], nextStep: 'Define live execution safety requirements before activation' },
              ].map((category) => (
                <BaselineCard
                  key={category.name}
                  title={category.name}
                  rows={[
                    { label: 'Purpose', value: category.purpose },
                    { label: 'Safe Now', value: category.safeNow.join(' · '), valueClassName: 'text-emerald-400' },
                    { label: 'Blocked Until Later', value: category.blocked.join(' · '), valueClassName: 'text-destructive/70' },
                    { label: 'Next Step', value: category.nextStep, valueClassName: 'text-amber-400' },
                  ]}
                  disclaimer="UI-only planning category; no execution or backend logic enabled."
                />
              ))}
            </div>
          </div>

          {/* Readiness Matrix */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Trading Readiness Matrix</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Readiness summary for each trading workflow category.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[
                { name: 'Strategy Review', mode: 'READ_ONLY' },
                { name: 'Paper Trading', mode: 'UI_ONLY' },
                { name: 'Risk Controls', mode: 'UI_ONLY' },
                { name: 'Market Data Planning', mode: 'UI_ONLY' },
                { name: 'TradingView Chart Planning', mode: 'UI_ONLY' },
                { name: 'Broker Integration Planning', mode: 'UI_ONLY' },
                { name: 'OpenClaw Trade Governance', mode: 'UI_ONLY' },
                { name: 'Future Live Execution', mode: 'FUTURE_PHASE' },
              ].map((item) => (
                <BaselineCard
                  key={`matrix-${item.name}`}
                  title={item.name}
                  rows={[
                    { label: 'Current Mode', value: item.mode, valueClassName: 'text-amber-500' },
                    { label: 'Readiness', value: item.mode === 'FUTURE_PHASE' ? 'BLOCKED' : 'PARTIAL', valueClassName: item.mode === 'FUTURE_PHASE' ? 'text-destructive' : 'text-amber-400' },
                  ]}
                  disclaimer="UI-only readiness planning; no execution or backend logic enabled."
                />
              ))}
            </div>
          </div>

          {/* Readiness Gate */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Trading Readiness Gate</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Gate status for each trading workflow category.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[
                { name: 'Strategy Review', readiness: 'READY', gate: 'Strategy documentation complete and operator approved' },
                { name: 'Paper Trading', readiness: 'PARTIAL', gate: 'Design paper trading simulation framework before activation' },
                { name: 'Risk Controls', readiness: 'PARTIAL', gate: 'Define risk control schema and enforcement mechanisms' },
                { name: 'Market Data Planning', readiness: 'PARTIAL', gate: 'Complete market data integration architecture design' },
                { name: 'TradingView Chart Planning', readiness: 'PARTIAL', gate: 'Finalize webhook schema and signal validation before webhook intake' },
                { name: 'Broker Integration Planning', readiness: 'BLOCKED', gate: 'Design broker integration contracts and complete API specification' },
                { name: 'OpenClaw Trade Governance', readiness: 'BLOCKED', gate: 'Define execution governance contracts before automation' },
                { name: 'Future Live Execution', readiness: 'BLOCKED', gate: 'Define live execution safety requirements and governance approval' },
              ].map((item) => (
                <BaselineCard
                  key={`gate-${item.name}`}
                  title={item.name}
                  rows={[
                    { label: 'Current Mode', value: item.readiness === 'READY' ? 'READ_ONLY' : 'UI_ONLY', valueClassName: 'text-amber-500' },
                    { label: 'Readiness', value: item.readiness, valueClassName: item.readiness === 'READY' ? 'text-emerald-400' : item.readiness === 'BLOCKED' ? 'text-destructive' : 'text-amber-400' },
                    { label: 'Blocking Gate', value: item.gate, valueClassName: 'text-slate-300' },
                  ]}
                  disclaimer="UI-only gate guidance; no backend or execution logic is enabled."
                />
              ))}
            </div>
          </div>

          {/* Operator Action Plan */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Operator Action Plan</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Summary of what operators can do now, what is blocked, what to build next, and what requires governance approval.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-emerald-400">Safe Now</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Review trading strategy and rules', 'View risk control documentation', 'Plan market data integration', 'Design TradingView webhook schema', 'Plan trading governance framework'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-emerald-400 shrink-0 mt-0.5">✓</span><span>{item}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-destructive/80">Blocked Until Later</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Broker connection and API integration', 'TradingView webhook endpoint and live signals', 'Paper trading execution and order submission', 'Live trading and money movement', 'API key entry and credential storage'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-destructive/70 shrink-0 mt-0.5">✕</span><span>{item}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-amber-400">Next Build Step</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Finalize trading strategy documentation and approval process', 'Design paper trading simulation framework and gates', 'Complete broker integration contract and API specification', 'Define trading governance contracts and execution gates', 'Establish approval workflow for paper and live trading'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">→</span><span>{item}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-cyan-400">Requires Governance Approval</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Enabling paper trading simulation execution', 'Activating broker connection and API integration', 'Enabling TradingView webhook and live signal intake', 'Expanding trading automation and OpenClaw control', 'Enabling live trading and money movement'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-cyan-400 shrink-0 mt-0.5">◇</span><span>{item}</span></div>
                  ))}
                </div>
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