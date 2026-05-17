/**
 * TradingPaperContract
 * Read-only contract definition for paper-trading setup.
 * Defines the allowed shape, rules, and prohibited capabilities.
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
import { CheckCircle2, Lock, AlertCircle } from 'lucide-react';

function ContractField({ label, value, type = 'normal' }) {
  const isBan = type === 'banned';
  const cls = isBan
    ? 'text-destructive border-destructive/30 bg-destructive/5'
    : 'text-slate-400 border-slate-600/30 bg-slate-600/5';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${cls}`}>
      <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{label}</span>
      <span className="text-[10px] font-mono font-bold flex-1">{value}</span>
      {isBan && <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}
    </div>
  );
}

function ContractSection({ title, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
        <span className="text-[9px] font-mono font-bold uppercase text-slate-300">{title}</span>
      </div>
      <div className="p-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

export default function TradingPaperContract() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">PAPER TRADING CONTRACT</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">draft · read-only</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1. Contract Mode */}
        <ContractSection title="1. Contract Mode">
          <ContractField label="Contract Mode" value="PAPER_TRADING_CONTRACT" />
          <ContractField label="Contract Status" value="DRAFT_ONLY" />
          <ContractField label="Live Trading" value="DISABLED" />
          <ContractField label="Broker Orders" value="DISABLED" />
          <ContractField label="Money Movement" value="DISABLED" />
          <ContractField label="Credential Entry" value="DISABLED" />
        </ContractSection>

        {/* 2. Market Contract */}
        <ContractSection title="2. Market Contract">
          <ContractField label="Market" value="MNQ" />
          <ContractField label="Asset Class" value="Futures" />
          <ContractField label="Exchange" value="CME / Micro Nasdaq Futures" />
          <ContractField label="Contract Size" value="1 MNQ placeholder" />
          <ContractField label="Tick Size" value="0.25" />
          <ContractField label="Dollar Per Point" value="$2.00" />
          <ContractField label="Dollar Per Tick" value="$0.50" />
        </ContractSection>

        {/* 3. Strategy Contract */}
        <ContractSection title="3. Strategy Contract">
          <ContractField label="Strategy" value="2 / 25 / 200 + MACD Zero-Line" />
          <ContractField label="Trend Filter" value="EMA 200" />
          <ContractField label="Fast EMA" value="2" />
          <ContractField label="Medium EMA" value="25" />
          <ContractField label="Slow EMA" value="200" />
          <ContractField label="Momentum Filter" value="MACD zero-line confirmation" />
          <ContractField label="Session" value="New York RTH" />
          <ContractField label="Direction" value="Long and Short" />
        </ContractSection>

        {/* 4. Risk Contract */}
        <ContractSection title="4. Risk Contract">
          <ContractField label="Max Daily Loss" value="$500" />
          <ContractField label="Max Daily Profit" value="$1,000" />
          <ContractField label="Max Daily Trades" value="3" />
          <ContractField label="Stop Loss" value="75 points" />
          <ContractField label="Take Profit" value="150 points" />
          <ContractField label="Trailing Stop" value="50 points" />
          <ContractField label="Max Contracts" value="1 MNQ" />
        </ContractSection>

        {/* 5. Prohibited Capabilities */}
        <ContractSection title="5. Prohibited Capabilities">
          <ContractField label="LIVE_TRADE" value="❌ BANNED" type="banned" />
          <ContractField label="BROKER_ORDER" value="❌ BANNED" type="banned" />
          <ContractField label="REAL_MONEY_ORDER" value="❌ BANNED" type="banned" />
          <ContractField label="BANK_TRANSFER" value="❌ BANNED" type="banned" />
          <ContractField label="CRYPTO_TRANSFER" value="❌ BANNED" type="banned" />
          <ContractField label="CREDENTIAL_ENTRY" value="❌ BANNED" type="banned" />
          <ContractField label="API_KEY_STORAGE" value="❌ BANNED" type="banned" />
          <ContractField label="AUTO_EXECUTION" value="❌ BANNED" type="banned" />
          <ContractField label="UNSUPERVISED_TRADING" value="❌ BANNED" type="banned" />
        </ContractSection>

        {/* 6. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Validate paper-trading contract before designing a sandbox connector.</div>
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