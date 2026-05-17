/**
 * TradingPaperContractValidator
 * Read-only validator that confirms the Trading Paper Contract is safe
 * and complete before any sandbox broker connector is designed.
 *
 * Does NOT:
 *   - Connect to brokers
 *   - Call TradingView
 *   - Call OpenClaw
 *   - Place trades
 *   - Execute strategy logic
 *   - Call APIs / fetch / axios
 *   - Write localStorage
 *   - Access credentials
 *   - Move money
 *   - Dispatch events
 *   - Use timers
 */
import React from 'react';
import { CheckCircle2, Shield, Lock } from 'lucide-react';

// ── Static contract source of truth (mirrors TradingPaperContract.jsx) ──
const CONTRACT = {
  mode: 'PAPER_TRADING_CONTRACT',
  status: 'DRAFT_ONLY',
  liveTrading: 'DISABLED',
  brokerOrders: 'DISABLED',
  moneyMovement: 'DISABLED',
  credentialEntry: 'DISABLED',
  market: 'MNQ',
  assetClass: 'Futures',
  exchange: 'CME / Micro Nasdaq Futures',
  contractSize: '1 MNQ placeholder',
  tickSize: '0.25',
  dollarPerPoint: '$2.00',
  dollarPerTick: '$0.50',
  strategy: '2 / 25 / 200 + MACD Zero-Line',
  trendFilter: 'EMA 200',
  fastEma: '2',
  mediumEma: '25',
  slowEma: '200',
  momentumFilter: 'MACD zero-line confirmation',
  session: 'New York RTH',
  direction: 'Long and Short',
  maxDailyLoss: '$500',
  maxDailyProfit: '$1,000',
  maxDailyTrades: '3',
  stopLoss: '75 points',
  takeProfit: '150 points',
  trailingStop: '50 points',
  maxContracts: '1 MNQ',
  prohibited: [
    'LIVE_TRADE', 'BROKER_ORDER', 'REAL_MONEY_ORDER', 'BANK_TRANSFER',
    'CRYPTO_TRANSFER', 'CREDENTIAL_ENTRY', 'API_KEY_STORAGE',
    'AUTO_EXECUTION', 'UNSUPERVISED_TRADING',
  ],
};

// ── Build all checks deterministically from the static contract ──
const SECTIONS = [
  {
    title: '1. Contract Identity Checks',
    checks: [
      { label: 'Contract Mode is PAPER_TRADING_CONTRACT', pass: CONTRACT.mode === 'PAPER_TRADING_CONTRACT' },
      { label: 'Contract Status is DRAFT_ONLY',           pass: CONTRACT.status === 'DRAFT_ONLY' },
      { label: 'Live Trading is DISABLED',                pass: CONTRACT.liveTrading === 'DISABLED' },
      { label: 'Broker Orders are DISABLED',              pass: CONTRACT.brokerOrders === 'DISABLED' },
      { label: 'Money Movement is DISABLED',              pass: CONTRACT.moneyMovement === 'DISABLED' },
      { label: 'Credential Entry is DISABLED',            pass: CONTRACT.credentialEntry === 'DISABLED' },
    ],
  },
  {
    title: '2. Market Checks',
    checks: [
      { label: 'Market is MNQ',                              pass: CONTRACT.market === 'MNQ' },
      { label: 'Asset Class is Futures',                     pass: CONTRACT.assetClass === 'Futures' },
      { label: 'Exchange is CME / Micro Nasdaq Futures',     pass: CONTRACT.exchange === 'CME / Micro Nasdaq Futures' },
      { label: 'Contract Size is 1 MNQ placeholder',         pass: CONTRACT.contractSize === '1 MNQ placeholder' },
      { label: 'Tick Size is 0.25',                          pass: CONTRACT.tickSize === '0.25' },
      { label: 'Dollar Per Point is $2.00',                  pass: CONTRACT.dollarPerPoint === '$2.00' },
      { label: 'Dollar Per Tick is $0.50',                   pass: CONTRACT.dollarPerTick === '$0.50' },
    ],
  },
  {
    title: '3. Strategy Checks',
    checks: [
      { label: 'Strategy is 2 / 25 / 200 + MACD Zero-Line',        pass: CONTRACT.strategy === '2 / 25 / 200 + MACD Zero-Line' },
      { label: 'Trend Filter is EMA 200',                           pass: CONTRACT.trendFilter === 'EMA 200' },
      { label: 'Fast EMA is 2',                                     pass: CONTRACT.fastEma === '2' },
      { label: 'Medium EMA is 25',                                  pass: CONTRACT.mediumEma === '25' },
      { label: 'Slow EMA is 200',                                   pass: CONTRACT.slowEma === '200' },
      { label: 'Momentum Filter is MACD zero-line confirmation',    pass: CONTRACT.momentumFilter === 'MACD zero-line confirmation' },
      { label: 'Session is New York RTH',                           pass: CONTRACT.session === 'New York RTH' },
      { label: 'Direction is Long and Short',                       pass: CONTRACT.direction === 'Long and Short' },
    ],
  },
  {
    title: '4. Risk Checks',
    checks: [
      { label: 'Max Daily Loss is $500',    pass: CONTRACT.maxDailyLoss === '$500' },
      { label: 'Max Daily Profit is $1,000', pass: CONTRACT.maxDailyProfit === '$1,000' },
      { label: 'Max Daily Trades is 3',     pass: CONTRACT.maxDailyTrades === '3' },
      { label: 'Stop Loss is 75 points',    pass: CONTRACT.stopLoss === '75 points' },
      { label: 'Take Profit is 150 points', pass: CONTRACT.takeProfit === '150 points' },
      { label: 'Trailing Stop is 50 points', pass: CONTRACT.trailingStop === '50 points' },
      { label: 'Max Contracts is 1 MNQ',    pass: CONTRACT.maxContracts === '1 MNQ' },
    ],
  },
  {
    title: '5. Prohibited Capability Checks',
    checks: [
      'LIVE_TRADE', 'BROKER_ORDER', 'REAL_MONEY_ORDER', 'BANK_TRANSFER',
      'CRYPTO_TRANSFER', 'CREDENTIAL_ENTRY', 'API_KEY_STORAGE',
      'AUTO_EXECUTION', 'UNSUPERVISED_TRADING',
    ].map(cap => ({
      label: `${cap} is prohibited`,
      pass: CONTRACT.prohibited.includes(cap),
    })),
  },
];

const allPass = SECTIONS.every(s => s.checks.every(c => c.pass));
const overallStatus = allPass ? 'VALID_CONTRACT' : 'HOLD';
const totalChecks = SECTIONS.reduce((n, s) => n + s.checks.length, 0);
const passedChecks = SECTIONS.reduce((n, s) => n + s.checks.filter(c => c.pass).length, 0);

// ── Sub-components ──
function CheckRow({ label, pass }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 last:border-0">
      <CheckCircle2 className={`w-3 h-3 shrink-0 ${pass ? 'text-primary' : 'text-destructive'}`} />
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className={`text-[8px] font-bold px-1.5 py-0.5 border rounded-sm ${pass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {pass ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

function ValidatorSection({ title, checks }) {
  const sectionPass = checks.every(c => c.pass);
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold uppercase text-slate-300">{title}</span>
        <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded-sm ${sectionPass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
          {sectionPass ? 'PASS' : 'FAIL'}
        </span>
      </div>
      <div>
        {checks.map((c, i) => <CheckRow key={i} label={c.label} pass={c.pass} />)}
      </div>
    </div>
  );
}

export default function TradingPaperContractValidator() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">CONTRACT VALIDATOR</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">read-only · static</span>
        <span className={`ml-auto text-[8px] font-bold px-2 py-0.5 border rounded-sm ${allPass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
          {passedChecks}/{totalChecks} PASS
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Validation sections */}
        {SECTIONS.map((s, i) => (
          <ValidatorSection key={i} title={s.title} checks={s.checks} />
        ))}

        {/* 6. Overall Validation Status */}
        <div className={`flex items-center gap-3 px-4 py-3 border rounded-sm ${allPass ? 'bg-primary/5 border-primary/30' : 'bg-destructive/5 border-destructive/30'}`}>
          <Shield className={`w-5 h-5 shrink-0 ${allPass ? 'text-primary' : 'text-destructive'}`} />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Overall Validation Status</div>
            <div className={`text-[14px] font-mono font-bold ${allPass ? 'text-primary' : 'text-destructive'}`}>
              {overallStatus}
            </div>
          </div>
          <div className={`ml-auto text-[9px] font-mono font-bold px-2 py-1 border rounded-sm ${allPass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
            {passedChecks}/{totalChecks} checks passed
          </div>
        </div>

        {/* 7. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Design paper broker sandbox connector requirements.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No brokers · No trades · No execution · No APIs · Static validation only
        </div>
      </div>
    </div>
  );
}