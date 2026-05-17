/**
 * CredentialStorageContract
 * Read-only contract that defines how future Tradovate paper connector
 * credentials may be handled by backend-only systems. This must not collect,
 * display, store, or transmit any API keys.
 *
 * Does NOT:
 *   - Collect credentials
 *   - Display API keys
 *   - Store secrets
 *   - Connect to brokers
 *   - Call APIs / fetch / axios
 *   - Write localStorage
 *   - Access credentials
 *   - Move money
 *   - Dispatch events
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

function ContractItem({ label, type = 'allowed' }) {
  const typeColors = {
    allowed: 'text-primary border-primary/30 bg-primary/5',
    required: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
    prohibited: 'text-destructive border-destructive/30 bg-destructive/5',
  };
  const typeText = {
    allowed: 'ALLOWED',
    required: 'REQUIRED',
    prohibited: 'PROHIBITED',
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 last:border-0">
      <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded-sm ${typeColors[type]}`}>
        {typeText[type]}
      </span>
    </div>
  );
}

export default function CredentialStorageContract() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">CREDENTIAL STORAGE CONTRACT</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">draft · backend-only</span>
      </div>

      <div className="p-3 space-y-3">
        {/* 1. Contract Identity */}
        <ContractSection title="1. Contract Identity">
          <ContractField label="Contract Mode" value="CREDENTIAL_STORAGE_CONTRACT" />
          <ContractField label="Contract Status" value="DRAFT_ONLY" />
          <ContractField label="Credential Entry" value="DISABLED" />
          <ContractField label="API Key Collection" value="DISABLED" />
          <ContractField label="Secret Storage" value="NOT_CONFIGURED" />
          <ContractField label="Broker Connection" value="NOT_CONNECTED" />
          <ContractField label="Order Routing" value="DISABLED" />
        </ContractSection>

        {/* 2. Allowed Future Secret Locations */}
        <ContractSection title="2. Allowed Future Secret Locations">
          <ContractItem label="Backend environment variables" type="allowed" />
          <ContractItem label="Managed secrets vault" type="allowed" />
          <ContractItem label="Encrypted backend secret store" type="allowed" />
          <ContractItem label="Cloud provider secret manager" type="allowed" />
          <ContractItem label="Restricted server runtime" type="allowed" />
        </ContractSection>

        {/* 3. Required Secret Names / Presence Checks */}
        <ContractSection title="3. Required Secret Names / Presence Checks">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20">
            <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">Presence Checks Only</span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 border rounded-sm text-slate-400 border-slate-600/30 bg-slate-600/5">NAME ONLY</span>
          </div>
          <ContractItem label="TRADOVATE_PAPER_API_KEY" type="required" />
          <ContractItem label="TRADOVATE_PAPER_API_SECRET" type="required" />
          <ContractItem label="TRADOVATE_PAPER_ACCOUNT_ID" type="required" />
          <ContractItem label="TRADOVATE_PAPER_ENVIRONMENT" type="required" />
          <ContractItem label="TRADOVATE_PAPER_BASE_URL" type="required" />
        </ContractSection>

        {/* 4. Required Redaction Rules */}
        <ContractSection title="4. Required Redaction Rules">
          <ContractItem label="Secret values must never return to frontend" type="required" />
          <ContractItem label="Secret values must never be logged" type="required" />
          <ContractItem label="Secret values must never be exported" type="required" />
          <ContractItem label="Secret values must never enter localStorage" type="required" />
          <ContractItem label="Secret values must never enter downloadable JSON" type="required" />
          <ContractItem label="Secret values must be reported only as present/missing" type="required" />
          <ContractItem label="Error messages must not include secret values" type="required" />
        </ContractSection>

        {/* 5. Required Access Controls */}
        <ContractSection title="5. Required Access Controls">
          <ContractItem label="Backend-only access" type="required" />
          <ContractItem label="Least privilege keys" type="required" />
          <ContractItem label="Paper/sandbox keys only" type="required" />
          <ContractItem label="Manual operator approval before enabling connector" type="required" />
          <ContractItem label="Emergency revoke procedure" type="required" />
          <ContractItem label="Key rotation plan" type="required" />
          <ContractItem label="Audit log for secret access attempts" type="required" />
        </ContractSection>

        {/* 6. Prohibited Credential Behaviors */}
        <ContractSection title="6. Prohibited Credential Behaviors">
          <ContractItem label="API key input fields in UI" type="prohibited" />
          <ContractItem label="API key display in UI" type="prohibited" />
          <ContractItem label="API key storage in localStorage" type="prohibited" />
          <ContractItem label="API key storage in browser state" type="prohibited" />
          <ContractItem label="API key storage in Obsidian" type="prohibited" />
          <ContractItem label="API key export to JSON" type="prohibited" />
          <ContractItem label="API key logging" type="prohibited" />
          <ContractItem label="Live credential use" type="prohibited" />
          <ContractItem label="Unsupervised credential use" type="prohibited" />
        </ContractSection>

        {/* 7. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Validate credential storage contract before building backend secret presence checks.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No keys · No secrets · Backend-only · No values displayed
        </div>
      </div>
    </div>
  );
}