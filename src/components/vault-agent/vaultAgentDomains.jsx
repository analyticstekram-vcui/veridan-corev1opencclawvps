/**
 * vaultAgentDomains.js
 * Static definition of all expected knowledge domains and their required documents.
 * Read-only. No execution. No API calls. No Obsidian writes.
 */

export const KNOWLEDGE_DOMAINS = [
  {
    domain: 'Governance',
    priority: 'CRITICAL',
    expectedDocs: [
      { title: 'Governance Charter', path: 'Veridan Core/Governance/governance_charter.md', priority: 'CRITICAL' },
      { title: 'Authority Chain', path: 'Veridan Core/Governance/authority_chain.md', priority: 'CRITICAL' },
      { title: 'Approval Policy', path: 'Veridan Core/Governance/approval_policy.md', priority: 'CRITICAL' },
      { title: 'Risk Policy', path: 'Veridan Core/Governance/risk_policy.md', priority: 'HIGH' },
      { title: 'Emergency Shutdown Policy', path: 'Veridan Core/Governance/emergency_shutdown_policy.md', priority: 'CRITICAL' },
      { title: 'Capital Allocation Policy', path: 'Veridan Core/Governance/capital_allocation_policy.md', priority: 'HIGH' },
    ],
  },
  {
    domain: 'Trust',
    priority: 'CRITICAL',
    expectedDocs: [
      { title: 'Genesis Family Trust Overview', path: 'Veridan Core/Trust - Entities/genesis_family_trust_overview.md', priority: 'CRITICAL' },
      { title: 'Trust Asset Schedule', path: 'Veridan Core/Trust - Entities/trust_asset_schedule.md', priority: 'CRITICAL' },
      { title: 'Trust Banking SOP', path: 'Veridan Core/Trust - Entities/trust_banking_sop.md', priority: 'HIGH' },
      { title: 'Trust Investment Policy', path: 'Veridan Core/Trust - Entities/trust_investment_policy.md', priority: 'HIGH' },
      { title: 'Trust Distribution Policy', path: 'Veridan Core/Trust - Entities/trust_distribution_policy.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'LLCs',
    priority: 'HIGH',
    expectedDocs: [
      { title: 'GFM Administrative Services LLC', path: 'Veridan Core/Trust - Entities/gfm_administrative_services_llc.md', priority: 'HIGH' },
      { title: 'Veridan Capital Management LLC', path: 'Veridan Core/Trust - Entities/veridan_capital_management_llc.md', priority: 'HIGH' },
      { title: 'Tekram Analytics LLC', path: 'Veridan Core/Trust - Entities/tekram_analytics_llc.md', priority: 'MEDIUM' },
      { title: 'MetaEdge Capital LLC', path: 'Veridan Core/Trust - Entities/metaedge_capital_llc.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'Trading',
    priority: 'HIGH',
    expectedDocs: [
      { title: 'MNQ Master Playbook', path: 'Veridan Core/Trading/mnq_master_playbook.md', priority: 'CRITICAL' },
      { title: 'Lucid Trading Playbook', path: 'Veridan Core/Trading/lucid_trading_playbook.md', priority: 'HIGH' },
      { title: 'Risk Management Rules', path: 'Veridan Core/Trading/risk_management_rules.md', priority: 'CRITICAL' },
      { title: 'TradingView Workflow', path: 'Veridan Core/Trading/tradingview_workflow.md', priority: 'HIGH' },
      { title: 'Tradovate Workflow', path: 'Veridan Core/Trading/tradovate_workflow.md', priority: 'HIGH' },
      { title: 'Daily Trading SOP', path: 'Veridan Core/Trading/daily_trading_sop.md', priority: 'HIGH' },
      { title: 'Weekly Trading Review', path: 'Veridan Core/Trading/weekly_trading_review.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'Credit',
    priority: 'HIGH',
    expectedDocs: [
      { title: 'Personal Credit Strategy', path: 'Veridan Core/Credit/personal_credit_strategy.md', priority: 'HIGH' },
      { title: 'Business Credit Strategy', path: 'Veridan Core/Credit/business_credit_strategy.md', priority: 'HIGH' },
      { title: 'Funding Readiness Checklist', path: 'Veridan Core/Credit/funding_readiness_checklist.md', priority: 'HIGH' },
      { title: 'Credit Utilization Rules', path: 'Veridan Core/Credit/credit_utilization_rules.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'Banking',
    priority: 'HIGH',
    expectedDocs: [
      { title: 'Cash Management Policy', path: 'Veridan Core/Banking/cash_management_policy.md', priority: 'HIGH' },
      { title: 'Reserve Policy', path: 'Veridan Core/Banking/reserve_policy.md', priority: 'HIGH' },
      { title: 'Capital Routing Policy', path: 'Veridan Core/Banking/capital_routing_policy.md', priority: 'HIGH' },
      { title: 'Bank Account Registry', path: 'Veridan Core/Banking/bank_account_registry.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'OpenClaw',
    priority: 'MEDIUM',
    expectedDocs: [
      { title: 'OpenClaw Architecture', path: 'Veridan Core/OpenClaw/openclaw_architecture.md', priority: 'HIGH' },
      { title: 'OpenClaw Safety Boundaries', path: 'Veridan Core/OpenClaw/openclaw_safety_boundaries.md', priority: 'CRITICAL' },
      { title: 'OpenClaw SOP', path: 'Veridan Core/OpenClaw/openclaw_sop.md', priority: 'HIGH' },
    ],
  },
  {
    domain: 'Veridan Core Architecture',
    priority: 'HIGH',
    expectedDocs: [
      { title: 'Veridan Architecture Overview', path: 'Veridan Core/Veridan Core System/veridan_architecture_overview.md', priority: 'CRITICAL' },
      { title: 'Obsidian Architecture', path: 'Veridan Core/Veridan Core System/obsidian_architecture.md', priority: 'HIGH' },
      { title: 'Connector Registry', path: 'Veridan Core/Veridan Core System/connector_registry.md', priority: 'MEDIUM' },
      { title: 'Security Boundary Map', path: 'Veridan Core/Veridan Core System/security_boundary_map.md', priority: 'CRITICAL' },
    ],
  },
  {
    domain: 'SOPs',
    priority: 'MEDIUM',
    expectedDocs: [
      { title: 'Daily Operations SOP', path: 'Veridan Core/Daily Operations/daily_operations_sop.md', priority: 'HIGH' },
      { title: 'Audit Evidence SOP', path: 'Veridan Core/Audit Evidence/audit_evidence_sop.md', priority: 'HIGH' },
    ],
  },
  {
    domain: 'Insurance',
    priority: 'MEDIUM',
    expectedDocs: [
      { title: 'Insurance Coverage Overview', path: 'Veridan Core/Insurance/insurance_coverage_overview.md', priority: 'MEDIUM' },
      { title: 'Policy Registry', path: 'Veridan Core/Insurance/policy_registry.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'Real Estate',
    priority: 'MEDIUM',
    expectedDocs: [
      { title: 'Real Estate Strategy', path: 'Veridan Core/Real Estate/real_estate_strategy.md', priority: 'MEDIUM' },
      { title: 'Property Acquisition Criteria', path: 'Veridan Core/Real Estate/property_acquisition_criteria.md', priority: 'MEDIUM' },
    ],
  },
  {
    domain: 'Crypto',
    priority: 'MEDIUM',
    expectedDocs: [
      { title: 'Crypto Asset Policy', path: 'Veridan Core/Crypto/crypto_asset_policy.md', priority: 'MEDIUM' },
      { title: 'Crypto Custody SOP', path: 'Veridan Core/Crypto/crypto_custody_sop.md', priority: 'MEDIUM' },
    ],
  },
];

export const TOTAL_EXPECTED_DOCS = KNOWLEDGE_DOMAINS.reduce((acc, d) => acc + d.expectedDocs.length, 0);

export const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function computeDomainCoverage(drafts, audits) {
  const writtenPaths = new Set([
    ...audits.filter(a => a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').map(a => (a.filePath || '').toLowerCase()),
    ...drafts.filter(d => d.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').map(d => (d.filePath || '').toLowerCase()),
  ]);

  const approvedPaths = new Set([
    ...drafts.filter(d => d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT').map(d => (d.filePath || d.filename || '').toLowerCase()),
  ]);

  const allKnownTitles = new Set([
    ...drafts.map(d => (d.title || d.filename || '').toLowerCase()),
    ...audits.map(a => (a.filename || '').toLowerCase()),
  ]);

  return KNOWLEDGE_DOMAINS.map(domain => {
    const results = domain.expectedDocs.map(doc => {
      const pathLower = doc.path.toLowerCase();
      const titleLower = doc.title.toLowerCase();
      const filenameLower = doc.path.split('/').pop().toLowerCase();

      const isWritten = writtenPaths.has(pathLower) ||
        [...writtenPaths].some(p => p.includes(filenameLower));
      const isApproved = isWritten || approvedPaths.has(pathLower) ||
        [...approvedPaths].some(p => p.includes(filenameLower));
      const isKnown = isApproved ||
        [...allKnownTitles].some(t => t.includes(titleLower.split(' ')[0]) && titleLower.split(' ').length > 1);

      return {
        ...doc,
        status: isWritten ? 'WRITTEN' : isApproved ? 'APPROVED' : isKnown ? 'DRAFT_EXISTS' : 'MISSING',
      };
    });

    const written = results.filter(r => r.status === 'WRITTEN').length;
    const approved = results.filter(r => r.status === 'APPROVED').length;
    const draftExists = results.filter(r => r.status === 'DRAFT_EXISTS').length;
    const missing = results.filter(r => r.status === 'MISSING').length;
    const total = results.length;
    const coveragePct = Math.round(((written + approved * 0.7 + draftExists * 0.3) / total) * 100);

    return {
      domain: domain.domain,
      priority: domain.priority,
      total,
      written,
      approved,
      draftExists,
      missing,
      coveragePct,
      docs: results,
    };
  });
}

export function computeHealthScore(stats) {
  const { totalDrafts, writtenDrafts, approvedDrafts, pendingDrafts, failedWrites, duplicateCandidates, coveragePct } = stats;
  if (totalDrafts === 0 && coveragePct === 0) return 10;

  let score = 100;
  // Coverage is 50% of score
  score = (coveragePct * 0.5);
  // Written docs add up to 30 pts
  const writeRatio = totalDrafts > 0 ? writtenDrafts / Math.max(totalDrafts, 1) : 0;
  score += writeRatio * 30;
  // Pending adds small bonus (they exist)
  score += Math.min(pendingDrafts * 0.5, 5);
  // Failed writes subtract
  score -= failedWrites * 3;
  // Duplicates subtract slightly
  score -= duplicateCandidates * 1;
  return Math.min(100, Math.max(0, Math.round(score)));
}