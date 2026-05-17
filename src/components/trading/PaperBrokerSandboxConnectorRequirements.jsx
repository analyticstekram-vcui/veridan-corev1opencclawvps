/**
 * PaperBrokerSandboxConnectorRequirements
 * Read-only requirements panel that defines what a future paper broker
 * sandbox connector must require before any broker integration exists.
 *
 * Does NOT:
 *   - Connect to brokers
 *   - Call Tradovate
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
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';

function RequirementField({ label, value, type = 'normal' }) {
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

function RequirementSection({ title, children }) {
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

function RequirementItem({ label, status = 'future' }) {
  const statusColors = {
    future: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
    required: 'text-primary border-primary/30 bg-primary/5',
    blocked: 'text-destructive border-destructive/30 bg-destructive/5',
  };
  const statusText = {
    future: 'FUTURE',
    required: 'REQUIRED',
    blocked: 'BLOCKED',
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

export default function PaperBrokerSandboxConnectorRequirements() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">SANDBOX CONNECTOR REQUIREMENTS</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">future · planning</span>
      </div>

      <div className="p-3 space-y-3">
        {/* 1. Connector Mode */}
        <RequirementSection title="1. Connector Mode">
          <RequirementField label="Connector Mode" value="SANDBOX_REQUIREMENTS_ONLY" />
          <RequirementField label="Broker Target" value="Tradovate Paper / Simulation" />
          <RequirementField label="Live Broker Connection" value="DISABLED" />
          <RequirementField label="Paper Broker Connection" value="NOT_CONNECTED" />
          <RequirementField label="Order Routing" value="DISABLED" />
          <RequirementField label="Credential Entry" value="DISABLED" />
        </RequirementSection>

        {/* 2. Required Future Inputs */}
        <RequirementSection title="2. Required Future Inputs">
          <RequirementItem label="Tradovate sandbox account confirmed" status="future" />
          <RequirementItem label="Tradovate API documentation reviewed" status="future" />
          <RequirementItem label="Paper trading API endpoint identified" status="future" />
          <RequirementItem label="Market data permission requirements identified" status="future" />
          <RequirementItem label="Order placement endpoint identified for future sandbox only" status="future" />
          <RequirementItem label="Account status endpoint identified for future read-only checks" status="future" />
          <RequirementItem label="Position endpoint identified for future read-only checks" status="future" />
          <RequirementItem label="Order status endpoint identified for future read-only checks" status="future" />
        </RequirementSection>

        {/* 3. Required Safety Gates Before Connection */}
        <RequirementSection title="3. Required Safety Gates Before Connection">
          <RequirementItem label="Paper connector contract" status="required" />
          <RequirementItem label="Paper connector validator" status="required" />
          <RequirementItem label="API key storage policy" status="required" />
          <RequirementItem label="Credential vault decision" status="required" />
          <RequirementItem label="Read-only account status test" status="required" />
          <RequirementItem label="Paper order dry-run test" status="required" />
          <RequirementItem label="Manual operator approval gate" status="required" />
          <RequirementItem label="Emergency disable switch" status="required" />
        </RequirementSection>

        {/* 4. Prohibited Until Later */}
        <RequirementSection title="4. Prohibited Until Later">
          <RequirementItem label="Live Tradovate credentials" status="blocked" />
          <RequirementItem label="Real-money order routing" status="blocked" />
          <RequirementItem label="Auto order placement" status="blocked" />
          <RequirementItem label="Unsupervised strategy execution" status="blocked" />
          <RequirementItem label="Credential entry in UI" status="blocked" />
          <RequirementItem label="Money movement" status="blocked" />
          <RequirementItem label="Live futures trading" status="blocked" />
        </RequirementSection>

        {/* 5. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Design paper connector contract.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No brokers · No APIs · No credentials · Future planning only
        </div>
      </div>
    </div>
  );
}