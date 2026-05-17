/**
 * PaperConnectorContractValidator
 * Read-only validator that confirms the Paper Connector Contract is safe
 * and complete before designing connector storage and API-key policy.
 *
 * Does NOT:
 *   - Connect to Tradovate
 *   - Use API keys
 *   - Place paper orders
 *   - Place live orders
 *   - Execute trades
 *   - Call APIs / fetch / axios
 *   - Write localStorage
 *   - Access credentials
 *   - Move money
 *   - Dispatch events
 *   - Use timers
 */
import React from 'react';
import { CheckCircle2, Shield, Lock } from 'lucide-react';

// ── Static contract source of truth (mirrors PaperConnectorContract.jsx) ──
const CONTRACT = {
  mode: 'PAPER_CONNECTOR_CONTRACT',
  status: 'DRAFT_ONLY',
  brokerTarget: 'Tradovate Paper / Simulation',
  liveBroker: 'DISABLED',
  paperBroker: 'NOT_CONNECTED',
  orderRouting: 'DISABLED',
  credentialEntry: 'DISABLED',
  allowedCapabilities: [
    'READ_ACCOUNT_STATUS_PAPER',
    'READ_POSITIONS_PAPER',
    'READ_ORDERS_PAPER',
    'READ_MARKET_DATA_PAPER',
    'SUBMIT_PAPER_ORDER_AFTER_APPROVAL',
    'CANCEL_PAPER_ORDER_AFTER_APPROVAL',
    'READ_PAPER_FILL_STATUS',
    'READ_PAPER_PNL',
  ],
  requiredFields: [
    'connectorId',
    'createdAt',
    'brokerTarget',
    'environmentMode',
    'authMode',
    'allowedEndpoints',
    'prohibitedEndpoints',
    'accountScope',
    'marketScope',
    'orderScope',
    'approvalRequired',
    'emergencyDisable',
    'auditTags',
    'nonLiveGuarantee',
  ],
  safetyBoundaries: {
    liveTradingAllowed: false,
    realMoneyOrdersAllowed: false,
    credentialEntryInUiAllowed: false,
    autoExecutionAllowed: false,
    unsupervisedTradingAllowed: false,
    moneyMovementAllowed: false,
    paperOrdersRequireApproval: true,
    emergencyDisableRequired: true,
  },
  prohibitedCapabilities: [
    'LIVE_ORDER_ROUTING',
    'REAL_MONEY_TRADE',
    'LIVE_ACCOUNT_ACCESS',
    'CREDENTIAL_ENTRY_UI',
    'API_KEY_DISPLAY',
    'API_KEY_LOCAL_STORAGE',
    'UNSUPERVISED_AUTOMATION',
    'AUTO_RETRY_ORDERS',
    'MONEY_MOVEMENT',
    'WITHDRAWAL',
    'BANK_TRANSFER',
  ],
};

// ── Build all checks deterministically from the static contract ──
const SECTIONS = [
  {
    title: '1. Connector Identity Checks',
    checks: [
      { label: 'Contract Mode is PAPER_CONNECTOR_CONTRACT', pass: CONTRACT.mode === 'PAPER_CONNECTOR_CONTRACT' },
      { label: 'Contract Status is DRAFT_ONLY', pass: CONTRACT.status === 'DRAFT_ONLY' },
      { label: 'Broker Target is Tradovate Paper / Simulation', pass: CONTRACT.brokerTarget === 'Tradovate Paper / Simulation' },
      { label: 'Live Broker is DISABLED', pass: CONTRACT.liveBroker === 'DISABLED' },
      { label: 'Paper Broker is NOT_CONNECTED', pass: CONTRACT.paperBroker === 'NOT_CONNECTED' },
      { label: 'Order Routing is DISABLED', pass: CONTRACT.orderRouting === 'DISABLED' },
      { label: 'Credential Entry is DISABLED', pass: CONTRACT.credentialEntry === 'DISABLED' },
    ],
  },
  {
    title: '2. Allowed Capability Checks',
    checks: [
      'READ_ACCOUNT_STATUS_PAPER',
      'READ_POSITIONS_PAPER',
      'READ_ORDERS_PAPER',
      'READ_MARKET_DATA_PAPER',
      'SUBMIT_PAPER_ORDER_AFTER_APPROVAL',
      'CANCEL_PAPER_ORDER_AFTER_APPROVAL',
      'READ_PAPER_FILL_STATUS',
      'READ_PAPER_PNL',
    ].map(cap => ({
      label: `${cap} is allowed`,
      pass: CONTRACT.allowedCapabilities.includes(cap),
    })),
  },
  {
    title: '3. Required Field Checks',
    checks: [
      'connectorId',
      'createdAt',
      'brokerTarget',
      'environmentMode',
      'authMode',
      'allowedEndpoints',
      'prohibitedEndpoints',
      'accountScope',
      'marketScope',
      'orderScope',
      'approvalRequired',
      'emergencyDisable',
      'auditTags',
      'nonLiveGuarantee',
    ].map(field => ({
      label: `${field} is required`,
      pass: CONTRACT.requiredFields.includes(field),
    })),
  },
  {
    title: '4. Safety Boundary Checks',
    checks: [
      { label: 'liveTradingAllowed is false', pass: CONTRACT.safetyBoundaries.liveTradingAllowed === false },
      { label: 'realMoneyOrdersAllowed is false', pass: CONTRACT.safetyBoundaries.realMoneyOrdersAllowed === false },
      { label: 'credentialEntryInUiAllowed is false', pass: CONTRACT.safetyBoundaries.credentialEntryInUiAllowed === false },
      { label: 'autoExecutionAllowed is false', pass: CONTRACT.safetyBoundaries.autoExecutionAllowed === false },
      { label: 'unsupervisedTradingAllowed is false', pass: CONTRACT.safetyBoundaries.unsupervisedTradingAllowed === false },
      { label: 'moneyMovementAllowed is false', pass: CONTRACT.safetyBoundaries.moneyMovementAllowed === false },
      { label: 'paperOrdersRequireApproval is true', pass: CONTRACT.safetyBoundaries.paperOrdersRequireApproval === true },
      { label: 'emergencyDisableRequired is true', pass: CONTRACT.safetyBoundaries.emergencyDisableRequired === true },
    ],
  },
  {
    title: '5. Prohibited Capability Checks',
    checks: [
      'LIVE_ORDER_ROUTING',
      'REAL_MONEY_TRADE',
      'LIVE_ACCOUNT_ACCESS',
      'CREDENTIAL_ENTRY_UI',
      'API_KEY_DISPLAY',
      'API_KEY_LOCAL_STORAGE',
      'UNSUPERVISED_AUTOMATION',
      'AUTO_RETRY_ORDERS',
      'MONEY_MOVEMENT',
      'WITHDRAWAL',
      'BANK_TRANSFER',
    ].map(cap => ({
      label: `${cap} is prohibited`,
      pass: CONTRACT.prohibitedCapabilities.includes(cap),
    })),
  },
];

const allPass = SECTIONS.every(s => s.checks.every(c => c.pass));
const overallStatus = allPass ? 'VALID_CONNECTOR_CONTRACT' : 'HOLD';
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

export default function PaperConnectorContractValidator() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-mono text-muted-foreground">CONTRACT VALIDATOR</span>
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
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Design connector storage and API-key policy.</div>
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · No brokers · No trades · No execution · No APIs · Static validation only
        </div>
      </div>
    </div>
  );
}