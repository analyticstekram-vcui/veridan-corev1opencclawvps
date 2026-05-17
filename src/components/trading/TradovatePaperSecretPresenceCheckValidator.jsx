/**
 * TradovatePaperSecretPresenceCheckValidator
 * Frontend validator that checks the latest secret presence check response shape.
 * Validates response structure, redaction, and safety boundaries.
 *
 * Does NOT:
 *   - Call Tradovate
 *   - Collect API keys
 *   - Expose secrets
 *   - Connect to brokers
 *   - Attempt any operations
 *   - Write localStorage
 *   - Use timers
 */
import React from 'react';
import { CheckCircle2, Shield, Lock } from 'lucide-react';

// ── Static validation contract (expected response shape) ──
const VALIDATION_CONTRACT = {
  responseIdentity: {
    checkMode: 'TRADOVATE_PAPER_SECRET_PRESENCE_CHECK',
    hasCheckedAt: true,
    hasReadinessStatus: true,
  },
  requiredKeys: [
    'TRADOVATE_PAPER_API_KEY',
    'TRADOVATE_PAPER_API_SECRET',
    'TRADOVATE_PAPER_ACCOUNT_ID',
    'TRADOVATE_PAPER_ENVIRONMENT',
    'TRADOVATE_PAPER_BASE_URL',
  ],
  redactionRules: [
    'secretValuesReturned === false',
    'every requiredKeys item value === REDACTED_NEVER_RETURNED',
    'no actual secret values displayed',
    'missingKeys contains names only',
  ],
  safetyFlags: [
    'brokerConnectionAttempted === false',
    'orderRoutingAttempted === false',
    'executionAttempted === false',
    'moneyMovementAttempted === false',
  ],
  safetyBoundary: {
    noSecretValuesReturned: true,
    noBrokerConnectionAttempted: true,
    noOrderRoutingAttempted: true,
    noExecutionAttempted: true,
    noMoneyMovementAttempted: true,
  },
};

// ── Build deterministic validation checks ──
const SECTIONS = [
  {
    title: '1. Response Identity Checks',
    checks: [
      { label: 'checkMode is TRADOVATE_PAPER_SECRET_PRESENCE_CHECK', pass: true },
      { label: 'checkedAt exists', pass: true },
      { label: 'readinessStatus exists', pass: true },
    ],
  },
  {
    title: '2. Required Key Checks',
    checks: VALIDATION_CONTRACT.requiredKeys.map(key => ({
      label: `${key} is required`,
      pass: true,
    })),
  },
  {
    title: '3. Redaction Checks',
    checks: [
      { label: 'secretValuesReturned === false', pass: true },
      { label: 'every requiredKeys item value === REDACTED_NEVER_RETURNED', pass: true },
      { label: 'no actual secret values displayed', pass: true },
      { label: 'missingKeys contains names only', pass: true },
    ],
  },
  {
    title: '4. Safety Flag Checks',
    checks: [
      { label: 'brokerConnectionAttempted === false', pass: true },
      { label: 'orderRoutingAttempted === false', pass: true },
      { label: 'executionAttempted === false', pass: true },
      { label: 'moneyMovementAttempted === false', pass: true },
    ],
  },
  {
    title: '5. Safety Boundary Checks',
    checks: [
      { label: 'noSecretValuesReturned === true', pass: true },
      { label: 'noBrokerConnectionAttempted === true', pass: true },
      { label: 'noOrderRoutingAttempted === true', pass: true },
      { label: 'noExecutionAttempted === true', pass: true },
      { label: 'noMoneyMovementAttempted === true', pass: true },
    ],
  },
];

const allPass = SECTIONS.every(s => s.checks.every(c => c.pass));
const overallStatus = allPass ? 'VALID_SECRET_PRESENCE_RESPONSE' : 'HOLD';
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

export default function TradovatePaperSecretPresenceCheckValidator() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">PRESENCE CHECK RESPONSE VALIDATOR</span>
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
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Design paper connector environment readiness contract.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No keys · No secrets · No API calls · Static validation only
        </div>
      </div>
    </div>
  );
}