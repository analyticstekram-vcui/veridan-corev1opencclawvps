/**
 * ConnectorStorageApiKeyPolicyValidator
 * Read-only validator that confirms the Connector Storage and API-Key Policy
 * is complete and safe before any credential handling is designed.
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
import { CheckCircle2, Shield, Lock } from 'lucide-react';

// ── Static policy source of truth (mirrors ConnectorStorageApiKeyPolicy.jsx) ──
const POLICY = {
  mode: 'CONNECTOR_STORAGE_API_KEY_POLICY',
  status: 'DRAFT_ONLY',
  credentialEntry: 'DISABLED',
  apiKeyStorage: 'NOT_CONFIGURED',
  brokerConnection: 'NOT_CONNECTED',
  orderRouting: 'DISABLED',
  allowedStorageLocations: [
    'Server-side environment variables',
    'Managed secrets vault',
    'Encrypted backend secret store',
    'Cloud provider secret manager',
    'Restricted backend runtime only',
  ],
  prohibitedStorageLocations: [
    'Frontend React state',
    'localStorage',
    'sessionStorage',
    'IndexedDB',
    'Browser cookies',
    'URL query strings',
    'Console logs',
    'Downloaded JSON exports',
    'Plain text notes',
    'Obsidian vault',
    'Client-visible config files',
  ],
  credentialRules: [
    'No API key input fields in UI',
    'No secret values returned to frontend',
    'Presence checks only',
    'Backend-only secret access',
    'Least privilege API keys',
    'Paper/sandbox keys before live keys',
    'Key rotation plan required',
    'Emergency revoke procedure required',
    'Audit logging required for credential access attempts',
  ],
  requiredBeforeKeyHandling: [
    'Credential storage contract',
    'Credential storage validator',
    'Backend secret presence check',
    'Secret redaction test',
    'Access policy review',
    'Manual operator approval',
    'Emergency disable switch',
  ],
};

// ── Build all checks deterministically from the static policy ──
const SECTIONS = [
  {
    title: '1. Policy Identity Checks',
    checks: [
      { label: 'Policy Mode is CONNECTOR_STORAGE_API_KEY_POLICY', pass: POLICY.mode === 'CONNECTOR_STORAGE_API_KEY_POLICY' },
      { label: 'Policy Status is DRAFT_ONLY', pass: POLICY.status === 'DRAFT_ONLY' },
      { label: 'Credential Entry is DISABLED', pass: POLICY.credentialEntry === 'DISABLED' },
      { label: 'API Key Storage is NOT_CONFIGURED', pass: POLICY.apiKeyStorage === 'NOT_CONFIGURED' },
      { label: 'Broker Connection is NOT_CONNECTED', pass: POLICY.brokerConnection === 'NOT_CONNECTED' },
      { label: 'Order Routing is DISABLED', pass: POLICY.orderRouting === 'DISABLED' },
    ],
  },
  {
    title: '2. Allowed Storage Checks',
    checks: [
      'Server-side environment variables',
      'Managed secrets vault',
      'Encrypted backend secret store',
      'Cloud provider secret manager',
      'Restricted backend runtime only',
    ].map(loc => ({
      label: `${loc} is allowed`,
      pass: POLICY.allowedStorageLocations.includes(loc),
    })),
  },
  {
    title: '3. Prohibited Storage Checks',
    checks: [
      'Frontend React state',
      'localStorage',
      'sessionStorage',
      'IndexedDB',
      'Browser cookies',
      'URL query strings',
      'Console logs',
      'Downloaded JSON exports',
      'Plain text notes',
      'Obsidian vault',
      'Client-visible config files',
    ].map(loc => ({
      label: `${loc} is prohibited`,
      pass: POLICY.prohibitedStorageLocations.includes(loc),
    })),
  },
  {
    title: '4. Credential Rule Checks',
    checks: [
      'No API key input fields in UI',
      'No secret values returned to frontend',
      'Presence checks only',
      'Backend-only secret access',
      'Least privilege API keys',
      'Paper/sandbox keys before live keys',
      'Key rotation plan required',
      'Emergency revoke procedure required',
      'Audit logging required for credential access attempts',
    ].map(rule => ({
      label: rule,
      pass: POLICY.credentialRules.includes(rule),
    })),
  },
  {
    title: '5. Required Before Key Handling Checks',
    checks: [
      'Credential storage contract',
      'Credential storage validator',
      'Backend secret presence check',
      'Secret redaction test',
      'Access policy review',
      'Manual operator approval',
      'Emergency disable switch',
    ].map(req => ({
      label: req,
      pass: POLICY.requiredBeforeKeyHandling.includes(req),
    })),
  },
];

const allPass = SECTIONS.every(s => s.checks.every(c => c.pass));
const overallStatus = allPass ? 'VALID_STORAGE_POLICY' : 'HOLD';
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

export default function ConnectorStorageApiKeyPolicyValidator() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">STORAGE POLICY VALIDATOR</span>
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
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Design credential storage contract and backend secret presence checks.</div>
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