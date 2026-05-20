/**
 * webhookContracts.js
 * Static registry of approved future webhook event contracts.
 * Governance/audit layer only — no live dispatch, no execution.
 */

export const APPROVAL_STATES = ['NOT_REQUESTED', 'REQUIRED', 'APPROVED', 'REJECTED'];
export const RISK_LEVELS      = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const CONTRACT_REGISTRY = [
  {
    eventType: 'OPENCLAW_WAKE_ONLY',
    description: 'Wakes the OpenClaw gateway from idle state. Read-only signal. No command execution.',
    riskLevel: 'LOW',
    allowedRoute: '/hooks/wake-preview',
    destinationSystem: 'OpenClaw Gateway',
    approvalState: 'REQUIRED',
    samplePayload: {
      event: 'OPENCLAW_WAKE_ONLY',
      triggeredBy: 'operator@veridancore.com',
      wakeMode: 'IDLE_PING',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
    },
    nextStepRecommendation: 'Obtain operator approval. Add HMAC signing before any live route is opened.',
  },
  {
    eventType: 'OBSIDIAN_TASK_DRY_RUN',
    description: 'Triggers a dry-run preview task for Obsidian vault note creation. No filesystem writes.',
    riskLevel: 'MEDIUM',
    allowedRoute: '/api/webhooks/preview/obsidian-task',
    destinationSystem: 'Obsidian Bridge',
    approvalState: 'REQUIRED',
    samplePayload: {
      event: 'OBSIDIAN_TASK_DRY_RUN',
      folder: 'Veridan Core/Baselines',
      title: 'Sample Note Title',
      markdownBytes: 0,
      bridgeMode: 'VPS_OBSIDIAN_BRIDGE_DRY_RUN',
      executionStatus: 'NOT_EXECUTED',
      filesystemWrite: 'DISABLED',
    },
    nextStepRecommendation: 'Validate dry-run bridge is stable. Require audit log gate before enabling route.',
  },
  {
    eventType: 'GMAIL_EVENT_PREVIEW',
    description: 'Previews an inbound Gmail event structure for future read-only monitoring. No email sending.',
    riskLevel: 'MEDIUM',
    allowedRoute: '/api/webhooks/preview/gmail-event',
    destinationSystem: 'Gmail Preview',
    approvalState: 'NOT_REQUESTED',
    samplePayload: {
      event: 'GMAIL_EVENT_PREVIEW',
      from: 'sender@example.com',
      subject: '(sample subject)',
      snippet: '(no content stored)',
      readOnly: true,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
    },
    nextStepRecommendation: 'Define read-only Gmail connector scope before requesting approval.',
  },
  {
    eventType: 'TRADINGVIEW_ALERT_PREVIEW',
    description: 'Previews a TradingView alert payload structure for future paper-trading integration. No trade execution.',
    riskLevel: 'HIGH',
    allowedRoute: '/api/webhooks/preview/tradingview-alert',
    destinationSystem: 'TradingView Preview',
    approvalState: 'NOT_REQUESTED',
    samplePayload: {
      event: 'TRADINGVIEW_ALERT_PREVIEW',
      ticker: 'SAMPLE',
      action: 'PREVIEW_ONLY',
      price: 0,
      tradeExecution: 'DISABLED',
      liveMode: 'DISABLED',
      executionStatus: 'NOT_EXECUTED',
    },
    nextStepRecommendation: 'Paper trading contract required. CRITICAL risk — multi-sig approval required before any route is opened.',
  },
  {
    eventType: 'GOVERNANCE_APPROVAL_EVENT',
    description: 'Signals a governance approval or denial decision into the audit ledger. Read-only ledger write only.',
    riskLevel: 'LOW',
    allowedRoute: '/api/webhooks/preview/governance-approval',
    destinationSystem: 'Governance Ledger',
    approvalState: 'APPROVED',
    samplePayload: {
      event: 'GOVERNANCE_APPROVAL_EVENT',
      decisionType: 'APPROVE',
      targetId: '(proposal-id)',
      decidedBy: 'operator@veridancore.com',
      auditOnly: true,
      executionStatus: 'NOT_EXECUTED',
    },
    nextStepRecommendation: 'Route approved for audit ledger writes only. No command dispatch.',
  },
  {
    eventType: 'DAILY_BRIEF_EVENT',
    description: 'Queues a daily operator brief summary for review. No external send. Preview queue only.',
    riskLevel: 'LOW',
    allowedRoute: '/api/webhooks/preview/daily-brief',
    destinationSystem: 'Daily Brief Queue',
    approvalState: 'REQUIRED',
    samplePayload: {
      event: 'DAILY_BRIEF_EVENT',
      briefDate: new Date().toISOString().slice(0, 10),
      queueMode: 'PREVIEW_ONLY',
      externalSend: 'DISABLED',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
    },
    nextStepRecommendation: 'Define brief queue storage contract before requesting approval.',
  },
];

export const RISK_COLORS = {
  LOW:      { text: 'text-primary',     bg: 'bg-primary/10',      border: 'border-primary/30' },
  MEDIUM:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',    border: 'border-amber-500/30' },
  HIGH:     { text: 'text-orange-400',  bg: 'bg-orange-500/10',   border: 'border-orange-500/30' },
  CRITICAL: { text: 'text-destructive', bg: 'bg-destructive/10',  border: 'border-destructive/30' },
};

export const APPROVAL_COLORS = {
  NOT_REQUESTED: 'text-slate-400',
  REQUIRED:      'text-amber-400',
  APPROVED:      'text-primary',
  REJECTED:      'text-destructive',
};