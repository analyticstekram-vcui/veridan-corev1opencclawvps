/**
 * TradingPaperReadinessDashboard
 * Read-only dashboard showing whether Veridan Core is ready for paper-trading setup.
 *
 * Does NOT:
 *   - Connect to brokers
 *   - Place trades
 *   - Execute strategy logic
 *   - Call APIs
 *   - Write localStorage
 *   - Access credentials
 *   - Move money
 *   - Dispatch events
 */
import React from 'react';
import { CheckCircle2, AlertCircle, Shield, TrendingUp, Lock } from 'lucide-react';

function StatusBadge({ label, value, ok }) {
  const cls = ok ? 'text-primary border-primary/30 bg-primary/5' : 'text-slate-500 border-slate-600/30 bg-slate-600/5';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${cls}`}>
      <span className="text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className="text-[10px] font-mono font-bold">{value}</span>
    </div>
  );
}

function ReadinessItem({ label, status }) {
  const isPass = status === 'PASS';
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 last:border-0">
      {isPass
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        : <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />}
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className={`text-[8px] font-bold px-1.5 py-0.5 border rounded-sm ${isPass ? 'text-primary border-primary/30 bg-primary/5' : 'text-slate-500 border-slate-600/30'}`}>
        {status}
      </span>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
        <span className="text-[9px] font-mono font-bold uppercase text-slate-300">{title}</span>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

export default function TradingPaperReadinessDashboard() {
  // Static configuration — no API calls, no writes
  const tradingMode = {
    current: 'PLANNING_ONLY',
    liveTrading: 'DISABLED',
    paperTrading: 'NOT_STARTED',
    brokerOrders: 'DISABLED',
    moneyMovement: 'DISABLED',
  };

  const strategyProfile = {
    market: 'MNQ',
    name: '2 / 25 / 200 + MACD Zero-Line',
    trendFilter: 'EMA 200',
    entryLogic: 'EMA 2 / EMA 25 alignment + MACD zero-line confirmation',
    session: 'New York RTH',
    direction: 'Long and Short, configurable later',
  };

  const riskControls = {
    maxDailyLoss: '$500',
    maxDailyProfit: '$1,000',
    maxDailyTrades: '3',
    stopLoss: '75 points',
    takeProfit: '150 points',
    trailingStop: '50 points',
    contractSize: '1 MNQ',
  };

  const readinessItems = [
    { label: 'Strategy profile defined', status: 'PASS' },
    { label: 'Risk controls defined', status: 'PASS' },
    { label: 'Broker connection not enabled', status: 'PASS' },
    { label: 'Live trading disabled', status: 'PASS' },
    { label: 'Paper trading not started', status: 'PASS' },
    { label: 'No API keys stored in UI', status: 'PASS' },
    { label: 'No order execution route connected', status: 'PASS' },
    { label: 'No money movement connected', status: 'PASS' },
  ];

  const nextAction = 'Define paper-trading contract and broker sandbox requirements.';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">PAPER TRADING READINESS</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">read-only · planning only</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1. Trading Mode Status */}
        <SectionCard title="1. Trading Mode Status">
          <div className="p-3 space-y-1.5">
            <StatusBadge label="Current Mode" value={tradingMode.current} ok={true} />
            <StatusBadge label="Live Trading" value={tradingMode.liveTrading} ok={true} />
            <StatusBadge label="Paper Trading" value={tradingMode.paperTrading} ok={true} />
            <StatusBadge label="Broker Orders" value={tradingMode.brokerOrders} ok={true} />
            <StatusBadge label="Money Movement" value={tradingMode.moneyMovement} ok={true} />
          </div>
        </SectionCard>

        {/* 2. Strategy Profile */}
        <SectionCard title="2. Strategy Profile">
          <div className="p-3 space-y-1.5">
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Market</div>
              <div className="text-[10px] font-mono text-foreground">{strategyProfile.market}</div>
            </div>
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Strategy Name</div>
              <div className="text-[10px] font-mono text-foreground">{strategyProfile.name}</div>
            </div>
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Trend Filter</div>
              <div className="text-[10px] font-mono text-foreground">{strategyProfile.trendFilter}</div>
            </div>
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Entry Logic</div>
              <div className="text-[10px] font-mono text-foreground leading-tight">{strategyProfile.entryLogic}</div>
            </div>
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Session</div>
              <div className="text-[10px] font-mono text-foreground">{strategyProfile.session}</div>
            </div>
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Direction</div>
              <div className="text-[10px] font-mono text-foreground">{strategyProfile.direction}</div>
            </div>
          </div>
        </SectionCard>

        {/* 3. Risk Controls */}
        <SectionCard title="3. Risk Controls">
          <div className="p-3 space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Max Daily Loss</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.maxDailyLoss}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Max Daily Profit</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.maxDailyProfit}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Max Daily Trades</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.maxDailyTrades}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Stop Loss</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.stopLoss}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Take Profit</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.takeProfit}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Trailing Stop</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.trailingStop}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Contract Size</div>
                <div className="text-[10px] font-mono text-foreground">{riskControls.contractSize}</div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 4. Readiness Checklist */}
        <SectionCard title="4. Readiness Checklist">
          <div>
            {readinessItems.map((item, i) => (
              <ReadinessItem key={i} label={item.label} status={item.status} />
            ))}
          </div>
        </SectionCard>

        {/* 5. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
          <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-primary font-bold leading-snug">{nextAction}</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No brokers · No trades · No execution · No money movement · No APIs
        </div>
      </div>
    </div>
  );
}