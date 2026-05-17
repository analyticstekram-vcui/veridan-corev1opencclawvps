/**
 * PaperConnectorEnvironmentReadinessContract
 * Static read-only contract defining required environment readiness before
 * designing Tradovate paper connector test.
 *
 * Does NOT:
 *   - Collect credentials
 *   - Call Tradovate
 *   - Connect to brokers
 *   - Place orders
 *   - Move money
 *   - Write localStorage
 *   - Use timers
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

function ConditionItem({ label }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1">
      <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function ProhibitionItem({ label }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1">
      <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function PaperConnectorEnvironmentReadinessContract() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">ENVIRONMENT READINESS CONTRACT</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">draft · read-only</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1. Environment Readiness Identity */}
        <ContractSection title="1. Environment Readiness Identity">
          <ContractField label="Contract Mode" value="PAPER_CONNECTOR_ENVIRONMENT_READINESS_CONTRACT" />
          <ContractField label="Contract Status" value="DRAFT_ONLY" />
          <ContractField label="Broker Target" value="Tradovate Paper / Simulation" />
          <ContractField label="Secret Presence Check" value="REQUIRED" />
          <ContractField label="Secret Values Returned" value="FALSE" />
          <ContractField label="Broker Connection" value="NOT_CONNECTED" />
          <ContractField label="Order Routing" value="DISABLED" />
          <ContractField label="Execution" value="DISABLED" />
        </ContractSection>

        {/* 2. Required Environment Conditions */}
        <ContractSection title="2. Required Environment Conditions">
          <ConditionItem label="Tradovate paper secret presence check exists" />
          <ConditionItem label="Secret presence response validator exists" />
          <ConditionItem label="All required secret names are defined" />
          <ConditionItem label="Secret values are redacted" />
          <ConditionItem label="Missing keys are reported by name only" />
          <ConditionItem label="Backend auth required" />
          <ConditionItem label="Frontend has no credential inputs" />
          <ConditionItem label="No localStorage secret writes" />
          <ConditionItem label="No broker connection attempted" />
        </ContractSection>

        {/* 3. Required Backend Safety Conditions */}
        <ContractSection title="3. Required Backend Safety Conditions">
          <ConditionItem label="Backend returns present/missing only" />
          <ConditionItem label="Backend never returns process.env values" />
          <ConditionItem label="Backend never logs secret values" />
          <ConditionItem label="Backend never calls Tradovate API during presence check" />
          <ConditionItem label="Backend never submits orders" />
          <ConditionItem label="Backend never opens account/session connection" />
          <ConditionItem label="Backend never moves money" />
          <ConditionItem label="Backend safety flags are explicit" />
        </ContractSection>

        {/* 4. Required Frontend Safety Conditions */}
        <ContractSection title="4. Required Frontend Safety Conditions">
          <ConditionItem label="UI displays present/missing only" />
          <ConditionItem label="UI displays REDACTED_NEVER_RETURNED only" />
          <ConditionItem label="UI stores result in component state only" />
          <ConditionItem label="UI has no API key inputs" />
          <ConditionItem label="UI has no credential form" />
          <ConditionItem label="UI has no execution buttons" />
          <ConditionItem label="UI has no order buttons" />
          <ConditionItem label="UI has no money movement controls" />
        </ContractSection>

        {/* 5. Prohibited Until Connector Test Phase */}
        <ContractSection title="5. Prohibited Until Connector Test Phase">
          <ProhibitionItem label="Tradovate auth request" />
          <ProhibitionItem label="Tradovate account connection" />
          <ProhibitionItem label="Tradovate market data request" />
          <ProhibitionItem label="Tradovate order endpoint call" />
          <ProhibitionItem label="Paper order placement" />
          <ProhibitionItem label="Live order placement" />
          <ProhibitionItem label="Credential input fields" />
          <ProhibitionItem label="Secret value display" />
          <ProhibitionItem label="Automated trading" />
        </ContractSection>

        {/* 6. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Validate environment readiness contract before designing read-only account status connector test.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No brokers · No credentials · No APIs · Contract definition only
        </div>
      </div>
    </div>
  );
}