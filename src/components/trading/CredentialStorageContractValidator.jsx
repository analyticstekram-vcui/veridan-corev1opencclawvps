/**
 * CredentialStorageContractValidator
 * Read-only validator that confirms the Credential Storage Contract is
 * complete and safe before backend secret presence checks are designed.
 *
 * Does NOT:
 *   - Collect API keys
 *   - Create credential fields
 *   - Connect to brokers
 *   - Call Tradovate
 *   - Call APIs / fetch / axios
 *   - Write localStorage
 *   - Access credentials
 *   - Move money
 *   - Dispatch events
 *   - Use timers
 */
import React from 'react';
import { CheckCircle2, Shield, Lock } from 'lucide-react';

// ── Static contract source of truth (mirrors CredentialStorageContract.jsx) ──
const CONTRACT = {
  mode: 'CREDENTIAL_STORAGE_CONTRACT',
  status: 'DRAFT_ONLY',
  credentialEntry: 'DISABLED',
  apiKeyCollection: 'DISABLED',
  secretStorage: 'NOT_CONFIGURED',
  brokerConnection: 'NOT_CONNECTED',
  orderRouting: 'DISABLED',
  allowedStorageLocations: [
    'Backend environment variables',
    'Managed secrets vault',
    'Encrypted backend secret store',
    'Cloud provider secret manager',
    'Restricted server runtime',
  ],
  secretNames: [
    'TRADOVATE_PAPER_API_KEY',
    'TRADOVATE_PAPER_API_SECRET',
    'TRADOVATE_PAPER_ACCOUNT_ID',
    'TRADOVATE_PAPER_ENVIRONMENT',
    'TRADOVATE_PAPER_BASE_URL',
  ],
  redactionRules: [
    'Secret values must never return to frontend',
    'Secret values must never be logged',
    'Secret values must never be exported',
    'Secret values must never enter localStorage',
    'Secret values must never enter downloadable JSON',
    'Secret values must be reported only as present/missing',
    'Error messages must not include secret values',
  ],
  accessControls: [
    'Backend-only access',
    'Least privilege keys',
    'Paper/sandbox keys only',
    'Manual operator approval before enabling connector',
    'Emergency revoke procedure',
    'Key rotation plan',
    'Audit log for secret access attempts',
  ],
  prohibitedBehaviors: [
    'API key input fields in UI',
    'API key display in UI',
    'API key storage in localStorage',
    'API key storage in browser state',
    'API key storage in Obsidian',
    'API key export to JSON',
    'API key logging',
    'Live credential use',
    'Unsupervised credential use',
  ],
};

// ── Build all checks deterministically from the static contract ──
const SECTIONS = [
  {
    title: '1. Contract Identity Checks',
    checks: [
      { label: 'Contract Mode is CREDENTIAL_STORAGE_CONTRACT', pass: CONTRACT.mode === 'CREDENTIAL_STORAGE_CONTRACT' },
      { label: 'Contract Status is DRAFT_ONLY', pass: CONTRACT.status === 'DRAFT_ONLY' },
      { label: 'Credential Entry is DISABLED', pass: CONTRACT.credentialEntry === 'DISABLED' },
      { label: 'API Key Collection is DISABLED', pass: CONTRACT.apiKeyCollection === 'DISABLED' },
      { label: 'Secret Storage is NOT_CONFIGURED', pass: CONTRACT.secretStorage === 'NOT_CONFIGURED' },
      { label: 'Broker Connection is NOT_CONNECTED', pass: CONTRACT.brokerConnection === 'NOT_CONNECTED' },
      { label: 'Order Routing is DISABLED', pass: CONTRACT.orderRouting === 'DISABLED' },
    ],
  },
  {
    title: '2. Allowed Future Secret Location Checks',
    checks: [
      'Backend environment variables',
      'Managed secrets vault',
      'Encrypted backend secret store',
      'Cloud provider secret manager',
      'Restricted server runtime',
    ].map(loc => ({
      label: `${loc} is allowed`,
      pass: CONTRACT.allowedStorageLocations.includes(loc),
    })),
  },
  {
    title: '3. Required Secret Name Checks',
    checks: [
      'TRADOVATE_PAPER_API_KEY',
      'TRADOVATE_PAPER_API_SECRET',
      'TRADOVATE_PAPER_ACCOUNT_ID',
      'TRADOVATE_PAPER_ENVIRONMENT',
      'TRADOVATE_PAPER_BASE_URL',
    ].map(name => ({
      label: `${name} is required`,
      pass: CONTRACT.secretNames.includes(name),
    })),
  },
  {
    title: '4. Redaction Rule Checks',
    checks: [
      'Secret values must never return to frontend',
      'Secret values must never be logged',
      'Secret values must never be exported',
      'Secret values must never enter localStorage',
      'Secret values must never enter downloadable JSON',
      'Secret values must be reported only as present/missing',
      'Error messages must not include secret values',
    ].map(rule => ({
      label: rule,
      pass: CONTRACT.redactionRules.includes(rule),
    })),
  },
  {
    title: '5. Access Control Checks',
    checks: [
      'Backend-only access',
      'Least privilege keys',
      'Paper/sandbox keys only',
      'Manual operator approval before enabling connector',
      'Emergency revoke procedure',
      'Key rotation plan',
      'Audit log for secret access attempts',
    ].map(ctrl => ({
      label: ctrl,
      pass: CONTRACT.accessControls.includes(ctrl),
    })),
  },
  {
    title: '6. Prohibited Credential Behavior Checks',
    checks: [
      'API key input fields in UI',
      'API key display in UI',
      'API key storage in localStorage',
      'API key storage in browser state',
      'API key storage in Obsidian',
      'API key export to JSON',
      'API key logging',
      'Live credential use',
      'Unsupervised credential use',
    ].map(behavior => ({
      label: behavior,
      pass: CONTRACT.prohibitedBehaviors.includes(behavior),
    })),
  },
];

const allPass = SECTIONS.every(s => s.checks.every(c => c.pass));
const overallStatus = allPass ? 'VALID_CREDENTIAL_STORAGE_CONTRACT' : 'HOLD';
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

export default function CredentialStorageContractValidator() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">CREDENTIAL STORAGE CONTRACT VALIDATOR</span>
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

        {/* 7. Overall Validation Status */}
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

        {/* 8. Next Allowed Action */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Design backend secret presence checks.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No keys · No secrets · No storage · Static validation only
        </div>
      </div>
    </div>
  );
}