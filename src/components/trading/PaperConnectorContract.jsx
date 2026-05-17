/**
 * PaperConnectorContract
 * Read-only contract that defines the allowed shape and safety boundaries
 * for a future Tradovate paper/simulation connector.
 *
 * Does NOT:
 *   - Connect to Tradovate
 *   - Use API keys
 *   - Place orders
 *   - Execute trades
 *   - Call APIs / fetch / axios
 *   - Write localStorage
 *   - Access credentials
 *   - Move money
 *   - Dispatch events
 *   - Use timers
 */
import React from 'react';
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';

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

function CapabilityItem({ label, status = 'future' }) {
  const statusColors = {
    allowed: 'text-primary border-primary/30 bg-primary/5',
    future: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
  };
  const statusText = {
    allowed: 'ALLOWED',
    future: 'FUTURE',
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 last:border-0">
      <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded-sm ${statusColors[status]}`}>
        {statusText[status]}
      </span>
    </div>
  );
}

function SafetyBoundary({ label, value }) {
  const isFalse = value === false;
  const isTrue = value === true;
  const cls = isTrue
    ? 'text-primary border-primary/30 bg-primary/5'
    : 'text-destructive border-destructive/30 bg-destructive/5';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${cls}`}>
      <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{label}</span>
      <span className="text-[10px] font-mono font-bold flex-1">{String(value).toUpperCase()}</span>
    </div>
  );
}

export default function PaperConnectorContract() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">PAPER CONNECTOR CONTRACT</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">draft · read-only</span>
      </div>

      <div className="p-3 space-y-3">
        {/* 1. Connector Contract Identity */}
        <ContractSection title="1. Connector Contract Identity">
          <ContractField label="Contract Mode" value="PAPER_CONNECTOR_CONTRACT" />
          <ContractField label="Contract Status" value="DRAFT_ONLY" />
          <ContractField label="Broker Target" value="Tradovate Paper / Simulation" />
          <ContractField label="Live Broker" value="DISABLED" />
          <ContractField label="Paper Broker" value="NOT_CONNECTED" />
          <ContractField label="Order Routing" value="DISABLED" />
          <ContractField label="Credential Entry" value="DISABLED" />
        </ContractSection>

        {/* 2. Allowed Future Connector Capabilities */}
        <ContractSection title="2. Allowed Future Connector Capabilities">
          <CapabilityItem label="READ_ACCOUNT_STATUS_PAPER" status="allowed" />
          <CapabilityItem label="READ_POSITIONS_PAPER" status="allowed" />
          <CapabilityItem label="READ_ORDERS_PAPER" status="allowed" />
          <CapabilityItem label="READ_MARKET_DATA_PAPER" status="allowed" />
          <CapabilityItem label="SUBMIT_PAPER_ORDER_AFTER_APPROVAL" status="allowed" />
          <CapabilityItem label="CANCEL_PAPER_ORDER_AFTER_APPROVAL" status="allowed" />
          <CapabilityItem label="READ_PAPER_FILL_STATUS" status="allowed" />
          <CapabilityItem label="READ_PAPER_PNL" status="allowed" />
        </ContractSection>

        {/* 3. Required Future Connector Fields */}
        <ContractSection title="3. Required Future Connector Fields">
          <ContractField label="connectorId" value="string (unique identifier)" />
          <ContractField label="createdAt" value="ISO datetime" />
          <ContractField label="brokerTarget" value="'Tradovate Paper'" />
          <ContractField label="environmentMode" value="'SANDBOX'" />
          <ContractField label="authMode" value="'OAuth' or 'API_Key_Vault'" />
          <ContractField label="allowedEndpoints" value="array of safe endpoints" />
          <ContractField label="prohibitedEndpoints" value="array of live endpoints" />
          <ContractField label="accountScope" value="paper account only" />
          <ContractField label="marketScope" value="paper market data" />
          <ContractField label="orderScope" value="paper orders only" />
          <ContractField label="approvalRequired" value="true" />
          <ContractField label="emergencyDisable" value="boolean flag" />
          <ContractField label="auditTags" value="array of tracking tags" />
          <ContractField label="nonLiveGuarantee" value="'PAPER_TRADING_ONLY'" />
        </ContractSection>

        {/* 4. Required Safety Boundaries */}
        <ContractSection title="4. Required Safety Boundaries">
          <SafetyBoundary label="liveTradingAllowed" value={false} />
          <SafetyBoundary label="realMoneyOrdersAllowed" value={false} />
          <SafetyBoundary label="credentialEntryInUiAllowed" value={false} />
          <SafetyBoundary label="autoExecutionAllowed" value={false} />
          <SafetyBoundary label="unsupervisedTradingAllowed" value={false} />
          <SafetyBoundary label="moneyMovementAllowed" value={false} />
          <SafetyBoundary label="paperOrdersRequireApproval" value={true} />
          <SafetyBoundary label="emergencyDisableRequired" value={true} />
        </ContractSection>

        {/* 5. Prohibited Connector Capabilities */}
        <ContractSection title="5. Prohibited Connector Capabilities">
          <ContractField label="LIVE_ORDER_ROUTING" value="❌ BANNED" type="banned" />
          <ContractField label="REAL_MONEY_TRADE" value="❌ BANNED" type="banned" />
          <ContractField label="LIVE_ACCOUNT_ACCESS" value="❌ BANNED" type="banned" />
          <ContractField label="CREDENTIAL_ENTRY_UI" value="❌ BANNED" type="banned" />
          <ContractField label="API_KEY_DISPLAY" value="❌ BANNED" type="banned" />
          <ContractField label="API_KEY_LOCAL_STORAGE" value="❌ BANNED" type="banned" />
          <ContractField label="UNSUPERVISED_AUTOMATION" value="❌ BANNED" type="banned" />
          <ContractField label="AUTO_RETRY_ORDERS" value="❌ BANNED" type="banned" />
          <ContractField label="MONEY_MOVEMENT" value="❌ BANNED" type="banned" />
          <ContractField label="WITHDRAWAL" value="❌ BANNED" type="banned" />
          <ContractField label="BANK_TRANSFER" value="❌ BANNED" type="banned" />
        </ContractSection>

        {/* 6. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Validate paper connector contract before designing connector storage and API-key policy.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No brokers · No APIs · No credentials · Paper only · Static contract
        </div>
      </div>
    </div>
  );
}