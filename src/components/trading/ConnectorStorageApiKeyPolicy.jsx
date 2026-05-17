/**
 * ConnectorStorageApiKeyPolicy
 * Read-only policy panel that defines where future Tradovate paper connector
 * credentials may be stored, where they must never be stored, and what must
 * happen before any credential or API-key handling is built.
 *
 * Does NOT:
 *   - Accept credentials
 *   - Accept API keys
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
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';

function PolicyField({ label, value, type = 'normal' }) {
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

function PolicySection({ title, children }) {
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

function PolicyItem({ label, status = 'future', type = 'allowed' }) {
  const statusColors = {
    allowed: 'text-primary border-primary/30 bg-primary/5',
    prohibited: 'text-destructive border-destructive/30 bg-destructive/5',
    future: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
  };
  const statusText = {
    allowed: 'ALLOWED',
    prohibited: 'PROHIBITED',
    future: 'REQUIRED',
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 last:border-0">
      <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded-sm ${statusColors[type]}`}>
        {statusText[type]}
      </span>
    </div>
  );
}

export default function ConnectorStorageApiKeyPolicy() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">STORAGE & API-KEY POLICY</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">future · planning</span>
      </div>

      <div className="p-3 space-y-3">
        {/* 1. Policy Mode */}
        <PolicySection title="1. Policy Mode">
          <PolicyField label="Policy Mode" value="CONNECTOR_STORAGE_API_KEY_POLICY" />
          <PolicyField label="Policy Status" value="DRAFT_ONLY" />
          <PolicyField label="Credential Entry" value="DISABLED" />
          <PolicyField label="API Key Storage" value="NOT_CONFIGURED" />
          <PolicyField label="Broker Connection" value="NOT_CONNECTED" />
          <PolicyField label="Order Routing" value="DISABLED" />
        </PolicySection>

        {/* 2. Allowed Future Storage Locations */}
        <PolicySection title="2. Allowed Future Storage Locations">
          <PolicyItem label="Server-side environment variables" type="allowed" />
          <PolicyItem label="Managed secrets vault" type="allowed" />
          <PolicyItem label="Encrypted backend secret store" type="allowed" />
          <PolicyItem label="Cloud provider secret manager" type="allowed" />
          <PolicyItem label="Restricted backend runtime only" type="allowed" />
        </PolicySection>

        {/* 3. Prohibited Storage Locations */}
        <PolicySection title="3. Prohibited Storage Locations">
          <PolicyItem label="Frontend React state" type="prohibited" />
          <PolicyItem label="localStorage" type="prohibited" />
          <PolicyItem label="sessionStorage" type="prohibited" />
          <PolicyItem label="IndexedDB" type="prohibited" />
          <PolicyItem label="Browser cookies" type="prohibited" />
          <PolicyItem label="URL query strings" type="prohibited" />
          <PolicyItem label="Console logs" type="prohibited" />
          <PolicyItem label="Downloaded JSON exports" type="prohibited" />
          <PolicyItem label="Plain text notes" type="prohibited" />
          <PolicyItem label="Obsidian vault" type="prohibited" />
          <PolicyItem label="Client-visible config files" type="prohibited" />
        </PolicySection>

        {/* 4. Required Future Credential Rules */}
        <PolicySection title="4. Required Future Credential Rules">
          <PolicyItem label="No API key input fields in UI" type="future" />
          <PolicyItem label="No secret values returned to frontend" type="future" />
          <PolicyItem label="Presence checks only" type="future" />
          <PolicyItem label="Backend-only secret access" type="future" />
          <PolicyItem label="Least privilege API keys" type="future" />
          <PolicyItem label="Paper/sandbox keys before live keys" type="future" />
          <PolicyItem label="Key rotation plan required" type="future" />
          <PolicyItem label="Emergency revoke procedure required" type="future" />
          <PolicyItem label="Audit logging required for credential access attempts" type="future" />
        </PolicySection>

        {/* 5. Required Before Any Key Handling */}
        <PolicySection title="5. Required Before Any Key Handling">
          <PolicyItem label="Credential storage contract" type="future" />
          <PolicyItem label="Credential storage validator" type="future" />
          <PolicyItem label="Backend secret presence check" type="future" />
          <PolicyItem label="Secret redaction test" type="future" />
          <PolicyItem label="Access policy review" type="future" />
          <PolicyItem label="Manual operator approval" type="future" />
          <PolicyItem label="Emergency disable switch" type="future" />
        </PolicySection>

        {/* 6. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Validate storage and API-key policy before building any credential handling.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No secrets · No keys · No storage · Backend policy only
        </div>
      </div>
    </div>
  );
}