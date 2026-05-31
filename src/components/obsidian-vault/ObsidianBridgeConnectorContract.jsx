/**
 * ObsidianBridgeConnectorContract
 * READ-ONLY display of the governed boundary for the Obsidian bridge connector.
 * No vault write · No dispatch · No mutation · No credentials · No InvokeLLM
 */

import React, { useState } from 'react';
import {
  Shield, CheckCircle2, XCircle, Lock, ChevronDown, ChevronUp,
  FileText, AlertTriangle,
} from 'lucide-react';

const BRIDGE_SECRET_NAME = 'VERIDAN_BRIDGE_URL';
const BRIDGE_TOKEN_SECRET = 'VERIDAN_BRIDGE_TOKEN';

const CONTRACT = {
  bridgeUrlSecretName:            BRIDGE_SECRET_NAME,
  bridgeTokenSecretName:          BRIDGE_TOKEN_SECRET,
  requestMode:                    'MANUAL_ONLY',
  healthCheckMode:                'READ_ONLY',
  dryRunMode:                     'ENABLED',
  controlledWriteMode:            'DISABLED_UNTIL_OPERATOR_APPROVED',
  executionMode:                  'DISABLED_BY_DEFAULT',
  vaultWriteMode:                 'GOVERNED_ONLY',
};

const ALLOWED_READ_ENDPOINTS = [
  { endpoint: '/health',  purpose: 'Bridge liveness check — returns JSON ok/status' },
  { endpoint: '/',        purpose: 'Root response check — may return HTML or JSON' },
  { endpoint: '/status',  purpose: 'Extended status if available — read-only' },
];

const ALLOWED_WRITE_ENDPOINT = {
  endpoint: '/obsidian/write-approved-draft',
  purpose:  'Controlled vault write — ONLY with operator-approved proposal, passes server-side validation gate',
  gate:     'Requires approved proposalId · riskLevel LOW · allowlisted folder · no secret content · draftType validated',
};

const BLOCKED_ENDPOINTS = [
  { endpoint: '/execute',           reason: 'Execution not permitted — no arbitrary command execution' },
  { endpoint: '/dispatch',          reason: 'OpenClaw dispatch blocked at all times from this connector' },
  { endpoint: '/browser',           reason: 'Browser automation blocked — not in scope for vault writes' },
  { endpoint: '/trade',             reason: 'Trading blocked — unrelated to vault write scope' },
  { endpoint: '/filesystem/raw',    reason: 'Raw filesystem access blocked — all paths must be allowlisted' },
  { endpoint: '/credentials',       reason: 'Credential endpoints blocked — no secret collection' },
  { endpoint: '/delete',            reason: 'Delete operations blocked — vault content is immutable from this panel' },
  { endpoint: '/shell',             reason: 'Shell execution blocked — no remote code execution' },
  { endpoint: '/openclaw/dispatch', reason: 'OpenClaw dispatch blocked — separate governed system' },
];

const CHIPS = [
  { label: 'READ_ONLY_HEALTH',           cls: 'text-primary border-primary/30 bg-primary/10' },
  { label: 'DRY_RUN_ENABLED',            cls: 'text-primary border-primary/20 bg-primary/5' },
  { label: 'CONTROLLED_WRITE_GOVERNED',  cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  { label: 'EXECUTION_DISABLED',         cls: 'text-slate-400 border-slate-600/30 bg-slate-700/30' },
  { label: 'VAULT_WRITE_RESTRICTED',     cls: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
];

const VERIFICATION_CHECKS = [
  'Health checks are read-only — no mutation on /health, /, /status',
  'Dry-run remains local/proposal-only — no vault file created',
  'Controlled write is disabled unless operator approval exists (proposalId required)',
  'obsidianWriteApprovedDraft is NOT called by this contract panel',
  'Raw filesystem access is blocked (/filesystem/raw)',
  'Delete operations are blocked (/delete)',
  'OpenClaw dispatch is blocked (/dispatch, /openclaw/dispatch)',
  'Browser automation is blocked (/browser)',
  'Trading is blocked (/trade)',
  'Credentials are blocked (/credentials)',
  'Secret name VERIDAN_BRIDGE_URL is consistent across health and write connector',
  'Missing bridge URL fails closed — no request dispatched',
];

function ContractRow({ label, value, valueClass = 'text-slate-300' }) {
  return (
    <div className="flex items-start gap-2 text-[7px] font-mono py-0.5">
      <span className="text-slate-600 shrink-0 w-52">{label}</span>
      <span className={`break-all ${valueClass}`}>{value}</span>
    </div>
  );
}

function EndpointRow({ endpoint, note, noteClass = 'text-slate-500' }) {
  return (
    <div className="flex items-start gap-3 py-1 border-b border-border/10 last:border-0">
      <code className="text-[7px] font-mono text-primary/80 shrink-0 w-52">{endpoint}</code>
      <span className={`text-[6px] font-mono ${noteClass}`}>{note}</span>
    </div>
  );
}

export default function ObsidianBridgeConnectorContract() {
  const [showVerification, setShowVerification] = useState(false);

  return (
    <div className="border border-border/50 bg-card rounded-sm overflow-hidden font-mono">

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 flex-wrap gap-y-1">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">
          OBSIDIAN BRIDGE CONNECTOR CONTRACT — GOVERNED WRITE ONLY
        </span>
      </div>

      {/* Header + chips */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 flex-wrap gap-y-2">
        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Bridge Connector Contract</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {CHIPS.map(c => (
            <span key={c.label} className={`px-2 py-0.5 text-[6px] font-bold uppercase tracking-widest border rounded-sm ${c.cls}`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Contract fields */}
        <div className="border border-border/30 bg-background/50 rounded-sm p-3 space-y-0.5">
          <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-2">Contract Fields</div>
          <ContractRow label="bridgeUrlSecretName"       value={CONTRACT.bridgeUrlSecretName}       valueClass="text-accent/80" />
          <ContractRow label="bridgeTokenSecretName"     value={CONTRACT.bridgeTokenSecretName}     valueClass="text-accent/80" />
          <ContractRow label="requestMode"               value={CONTRACT.requestMode}               valueClass="text-primary" />
          <ContractRow label="healthCheckMode"           value={CONTRACT.healthCheckMode}           valueClass="text-primary" />
          <ContractRow label="dryRunMode"                value={CONTRACT.dryRunMode}                valueClass="text-primary" />
          <ContractRow label="controlledWriteMode"       value={CONTRACT.controlledWriteMode}       valueClass="text-amber-400" />
          <ContractRow label="executionMode"             value={CONTRACT.executionMode}             valueClass="text-slate-500" />
          <ContractRow label="vaultWriteMode"            value={CONTRACT.vaultWriteMode}            valueClass="text-amber-400" />
        </div>

        {/* Allowed read-only endpoints */}
        <div className="border border-primary/20 bg-primary/5 rounded-sm p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-primary">Allowed Read-Only Endpoints</span>
          </div>
          {ALLOWED_READ_ENDPOINTS.map(({ endpoint, purpose }) => (
            <EndpointRow key={endpoint} endpoint={endpoint} note={purpose} noteClass="text-slate-500" />
          ))}
        </div>

        {/* Allowed controlled-write endpoint */}
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-sm p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-amber-400">Allowed Controlled-Write Endpoint</span>
            <span className="ml-auto px-1.5 py-0.5 text-[6px] font-bold uppercase border border-amber-500/30 text-amber-500 rounded-sm">OPERATOR APPROVAL REQUIRED</span>
          </div>
          <EndpointRow
            endpoint={ALLOWED_WRITE_ENDPOINT.endpoint}
            note={`${ALLOWED_WRITE_ENDPOINT.purpose} | Gate: ${ALLOWED_WRITE_ENDPOINT.gate}`}
            noteClass="text-amber-400/60"
          />
        </div>

        {/* Blocked endpoints */}
        <div className="border border-destructive/20 bg-destructive/5 rounded-sm p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-3 h-3 text-destructive" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-destructive">Blocked Endpoints</span>
          </div>
          {BLOCKED_ENDPOINTS.map(({ endpoint, reason }) => (
            <EndpointRow key={endpoint} endpoint={endpoint} note={reason} noteClass="text-destructive/50" />
          ))}
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
          <div>contractType: READ_ONLY_DISPLAY · vaultWrite: GOVERNED_ONLY · mutation: NONE_IN_THIS_PANEL</div>
          <div>secretConsistency: VERIDAN_BRIDGE_URL used by health + write connector · failClosed: TRUE</div>
        </div>

      </div>
    </div>
  );
}