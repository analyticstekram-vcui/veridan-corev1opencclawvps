/**
 * OpenClawGatewayConnectorContract
 * READ-ONLY display of the enforced connector contract for the OpenClaw Gateway.
 * No dispatch · No execution · No vault write · No trading · No browser automation · No credentials.
 */

import React, { useState } from 'react';
import {
  Shield, CheckCircle2, XCircle, ChevronDown, ChevronUp, Lock, FileText
} from 'lucide-react';

const ALLOWED_ENDPOINTS = ['/health', '/models', '/agents', '/commands'];

const BLOCKED_ENDPOINTS = [
  { path: '/execute',      reason: 'Execution blocked — EXECUTION_DISABLED' },
  { path: '/dispatch',     reason: 'Dispatch blocked — NO_DISPATCH_AUTHORITY' },
  { path: '/browser',      reason: 'Browser automation blocked — BROWSER_AUTOMATION_DISABLED' },
  { path: '/trade',        reason: 'Trading blocked — TRADING_DISABLED' },
  { path: '/vault/write',  reason: 'Vault write blocked — VAULT_WRITE_DISABLED' },
  { path: '/filesystem',   reason: 'Filesystem access blocked — FILESYSTEM_DISABLED' },
  { path: '/credentials',  reason: 'Credential access blocked — CREDENTIALS_DISABLED' },
];

const CONTRACT_FIELDS = [
  { label: 'gatewayUrlConfigured',     value: 'YES (OPENCLAW_GATEWAY_URL env var)' },
  { label: 'requestMode',              value: 'MANUAL_ONLY' },
  { label: 'executionMode',            value: 'DISABLED' },
  { label: 'browserAutomationMode',    value: 'DISABLED' },
  { label: 'vaultWriteMode',           value: 'DISABLED' },
  { label: 'tradingMode',              value: 'DISABLED' },
];

const VERIFICATION_CHECKS = [
  'Only read-only endpoints are allowed (/health, /models, /agents, /commands)',
  'Execution endpoints are blocked (/execute)',
  'Browser automation endpoints are blocked (/browser)',
  'Trading endpoints are blocked (/trade)',
  'Vault write endpoints are blocked (/vault/write)',
  'Filesystem endpoints are blocked (/filesystem)',
  'Credential endpoints are blocked (/credentials)',
  'Manual refresh only — no auto-polling, no scheduled loop',
  'No dispatch function exists in this panel or its backend route',
  'No backend mutation occurs — all calls are GET read-only',
];

function SectionHeader({ children }) {
  return (
    <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">{children}</div>
  );
}

function ContractRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 text-[8px] font-mono">
      <span className="text-slate-500 shrink-0 w-52">{label}</span>
      <span className={`break-all ${value === 'DISABLED' ? 'text-destructive/70' : 'text-primary/80'}`}>{value}</span>
    </div>
  );
}

export default function OpenClawGatewayConnectorContract() {
  const [showVerification, setShowVerification] = useState(false);

  return (
    <div className="border border-border/50 bg-card rounded-sm overflow-hidden font-mono">

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">
          READ-ONLY CONNECTOR CONTRACT — NO EXECUTION AUTHORITY
        </span>
        <span className="ml-auto px-2 py-0.5 text-[6px] font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-400 rounded-sm">
          CONTRACT_ENFORCED
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">
          OpenClaw Gateway Connector Contract
        </span>
      </div>

      <div className="p-4 space-y-4">

        {/* Contract fields */}
        <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-1.5">
          <SectionHeader>Contract Fields</SectionHeader>
          {CONTRACT_FIELDS.map(({ label, value }) => (
            <ContractRow key={label} label={label} value={value} />
          ))}
        </div>

        {/* Allowed endpoints */}
        <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
          <SectionHeader>Allowed Read-Only Endpoints</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {ALLOWED_ENDPOINTS.map(ep => (
              <div key={ep} className="flex items-center gap-1.5 px-2 py-1 border border-primary/30 bg-primary/10 rounded-sm">
                <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="text-[7px] font-mono font-bold text-primary">{ep}</span>
                <span className="text-[6px] font-mono text-primary/60">GET · READ_ONLY</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked endpoints */}
        <div className="border border-destructive/20 bg-destructive/5 rounded-sm p-3 space-y-1.5">
          <SectionHeader>Blocked Endpoints</SectionHeader>
          <div className="space-y-1">
            {BLOCKED_ENDPOINTS.map(({ path, reason }) => (
              <div key={path} className="flex items-start gap-2 text-[7px] font-mono">
                <XCircle className="w-2.5 h-2.5 text-destructive shrink-0 mt-0.5" />
                <span className="text-destructive font-bold w-32 shrink-0">{path}</span>
                <span className="text-slate-500">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verification */}
        <div className="border border-border/30 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5" />
              Safety Verification Checks ({VERIFICATION_CHECKS.length})
            </div>
            {showVerification ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showVerification && (
            <div className="px-3 pb-3 pt-1 space-y-1 border-t border-border/20 bg-background/30">
              {VERIFICATION_CHECKS.map((check, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                  {check}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[6px] font-mono text-slate-600 space-y-0.5 border-t border-border/20 pt-2">
          <div>contractVersion: READ_ONLY_V1 · enforced: YES · dispatchAuthority: NONE · mutationAllowed: FALSE</div>
          <div>allowedMethods: GET · blockedMethods: POST, PUT, DELETE, PATCH · credentialAccess: DISABLED</div>
        </div>

      </div>
    </div>
  );
}