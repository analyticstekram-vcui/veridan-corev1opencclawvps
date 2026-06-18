/**
 * vaultAgentReportAdapter.js
 * Phase 3 — Veridan Core Integration
 *
 * Mock adapter for Vault Agent Phase 2 report data.
 * Source vault path (local, not accessible from browser):
 *   C:\Users\peter\OneDrive\Desktop\obsidians\veridans mind\00 Dashboard\
 *
 * Reports represented:
 *   - Daily Vault Brief.md
 *   - Weekly Governance Brief.md
 *   - Pending Approval Report.md
 *   - Review Cycle Report.md
 *   - OpenClaw Boundary Report.md
 *
 * TODO: When a backend bridge to the local vault is available, replace
 *       MOCK_REPORT_DATA below with a fetch to that bridge endpoint.
 *       The bridge must remain read-only and must not mutate any vault files.
 *
 * SAFETY:
 *   - READ_ONLY: no file writes, no mutations
 *   - NO_EXECUTION: no governance activation, no OpenClaw dispatch
 *   - REPORTING_ONLY: data presented as-is for operator review
 *   - NO_DISPATCH: dispatchStatus: NOT_DISPATCHED
 *   - NO_BROKER: no broker API calls
 *   - NO_BANKING: no banking API calls
 */

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — parsed from actual Phase 2 report output as of 2026-06-17
// Replace with live bridge data when vault path becomes accessible.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_REPORT_DATA = {
  // Source: Daily Vault Brief.md
  dailyBrief: {
    reportDate: '2026-06-17',
    sourceFile: '00 Dashboard/Daily Vault Brief.md',
    totalNotes: 70,
    totalWikiLinks: 1228,
    metadataDomains: 11,
    governanceMaturityScore: 94,
    governanceActivationScore: 86,
    governanceReadinessScore: 96,
    pendingApprovalsCount: 4,
    reviewsDueWithin7Days: 6,
    openExceptions: 0,
    openclawBoundaryStatus: 'Conditionally compliant for documentation-stage operation',
    openclawDocs: [
      'OpenClaw Index',
      'OpenClaw Architecture',
      'OpenClaw Runtime',
      'OpenClaw Monitoring SOP',
      'OpenClaw Incident Response SOP',
    ],
  },

  // Source: Pending Approval Report.md
  pendingApprovals: [
    {
      id: 'GOV-20260617-002',
      title: 'Governance Activation Matrix',
      status: 'Pending Approval',
      approver: 'Veridan Governance Authority',
    },
    {
      id: 'GOV-20260617-004',
      title: 'Governance Evidence Register',
      status: 'Pending Approval',
      approver: 'Veridan Governance Authority',
    },
    {
      id: 'GOV-20260617-006',
      title: 'Governance Charter',
      status: 'Pending Approval',
      approver: 'Veridan Governance Authority',
    },
    {
      id: 'GOV-20260617-008',
      title: 'Emergency Shutdown Policy',
      status: 'Pending Approval',
      approver: 'Veridan Governance Authority',
    },
  ],

  // Source: Review Cycle Report.md
  reviewsDue: [
    { title: 'Daily Vault Brief',       domain: 'dashboard',   dueDate: '2026-06-24' },
    { title: 'Pending Approval Report', domain: 'dashboard',   dueDate: '2026-06-24' },
    { title: 'Review Cycle Report',     domain: 'dashboard',   dueDate: '2026-06-24' },
    { title: 'Weekly Governance Brief', domain: 'dashboard',   dueDate: '2026-06-24' },
    { title: 'Exception Register',      domain: 'governance',  dueDate: '2026-06-24' },
    { title: 'Weekly Trading Review',   domain: 'operations',  dueDate: '2026-06-24' },
  ],

  // Source: OpenClaw Boundary Report.md
  openclawBoundary: {
    status: 'Conditionally compliant for documentation-stage operation',
    mode: 'DOCUMENTATION_ONLY',
    executionEnabled: false,
    dispatchEnabled: false,
    docs: [
      { title: 'OpenClaw Index',                path: 'OpenClaw/OpenClaw Index.md' },
      { title: 'OpenClaw Architecture',         path: 'OpenClaw/OpenClaw Architecture.md' },
      { title: 'OpenClaw Runtime',              path: 'OpenClaw/OpenClaw Runtime.md' },
      { title: 'OpenClaw Monitoring SOP',       path: 'OpenClaw/OpenClaw Monitoring SOP.md' },
      { title: 'OpenClaw Incident Response SOP',path: 'OpenClaw/OpenClaw Incident Response SOP.md' },
    ],
    note: 'OpenClaw remains in documentation-only mode. No execution or dispatch until explicitly approved by governance authority.',
  },

  // Source: Weekly Governance Brief.md
  weeklyGovernanceBrief: {
    reportDate: '2026-06-17',
    sourceFile: '00 Dashboard/Weekly Governance Brief.md',
    maturityScore: 94,
    activationScore: 86,
    readinessScore: 96,
    openExceptions: 0,
    weekSummary: 'Governance documentation is at high maturity. Activation score reflects remaining pending approvals. All critical policies drafted.',
  },

  // Source: Derived recommended actions across all reports
  recommendedActions: [
    'Complete pending governance approval decisions.',
    'Review documents due on 2026-06-24.',
    'Keep OpenClaw in documentation-only mode until explicitly approved.',
    'Normalize exception records into structured EXC blocks for automation.',
  ],

  // Adapter metadata
  adapterMeta: {
    mode: 'MOCK',
    // TODO: Change to 'LIVE' when vault bridge is connected
    dataAsOf: '2026-06-17',
    localVaultPath: 'C:\\Users\\peter\\OneDrive\\Desktop\\obsidians\\veridans mind',
    safetyMode: 'READ_ONLY',
    executionStatus: 'NOT_EXECUTED',
    dispatchStatus: 'NOT_DISPATCHED',
    openclawCall: 'NOT_SENT',
    brokerAccess: 'DISABLED',
    bankAccess: 'DISABLED',
  },
};

/**
 * getReportData()
 * Primary entry point. Returns MOCK_REPORT_DATA.
 * TODO: Replace body with a fetch call to the local vault bridge when available.
 * The bridge must be read-only and must verify no write or dispatch occurs.
 */
export function getReportData() {
  return MOCK_REPORT_DATA;
}

/**
 * getDaysUntil(dateStr)
 * Returns integer days until a date string (YYYY-MM-DD), relative to today.
 */
export function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}