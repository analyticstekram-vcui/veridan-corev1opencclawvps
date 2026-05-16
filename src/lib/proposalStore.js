/**
 * proposalStore.js
 * Shared localStorage-backed store for Safe Command Test proposals and audit entries.
 * All mutations are local-only. No OpenClaw calls. No execution.
 */

const PROPOSALS_KEY = 'veridancore_proposals_v1';
const AUDIT_KEY     = 'veridancore_audit_v1';

// ── Helpers ────────────────────────────────────────────────────────────────────
function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

// ── Policy keywords that force BLOCKED_BY_POLICY ──────────────────────────────
const POLICY_BLOCK_PATTERNS = [
  /credential|password|apikey|api.?key|secret.?key/i,
  /broker|tradovate|alpaca|blofin|binance|coinbase|kraken|bybit/i,
  /bank|chase\.com|wellsfargo|citibank|bankofamerica/i,
  /wallet|private.?key|seed.?phrase|metamask|ledger/i,
  /execute.?trade|place.?order|market.?order|limit.?order/i,
  /login|signin|sign-in/i,
];

function checkPolicyBlock(proposal) {
  const haystack = [proposal.target, proposal.purpose, proposal.expectedResult, proposal.commandType]
    .filter(Boolean).join(' ');
  return POLICY_BLOCK_PATTERNS.some(re => re.test(haystack));
}

// ── Audit append ──────────────────────────────────────────────────────────────
export function appendAudit(entry) {
  const log = load(AUDIT_KEY);
  const updated = [{ ...entry, timestamp: new Date().toISOString() }, ...log].slice(0, 200);
  save(AUDIT_KEY, updated);
  return updated;
}

// ── Proposal reads ────────────────────────────────────────────────────────────
export function loadProposals() {
  return load(PROPOSALS_KEY);
}

export function loadAudit() {
  return load(AUDIT_KEY);
}

// ── Create proposal ───────────────────────────────────────────────────────────
export function createProposal(proposal) {
  const proposals = load(PROPOSALS_KEY);
  proposals.unshift(proposal);
  save(PROPOSALS_KEY, proposals.slice(0, 500));

  appendAudit({
    event:       'proposal_created',
    proposalId:  proposal.id,
    commandType: proposal.commandType,
    target:      proposal.target,
    status:      proposal.status,
    note:        'Proposal created — no execution attempted.',
  });

  return proposals;
}

// ── State transitions ─────────────────────────────────────────────────────────

/** DRAFT → PENDING_APPROVAL */
export function submitForApproval(proposalId) {
  const proposals = load(PROPOSALS_KEY);
  const updated = proposals.map(p => {
    if (p.id !== proposalId) return p;
    if (p.status !== 'DRAFT') return p;
    return { ...p, status: 'PENDING_APPROVAL', submittedAt: new Date().toISOString() };
  });
  save(PROPOSALS_KEY, updated);

  appendAudit({ event: 'submitted_for_approval', proposalId, note: 'Moved to PENDING_APPROVAL.' });
  return updated;
}

/** PENDING_APPROVAL → APPROVED */
export function approveProposal(proposalId, reviewedBy, reviewNote) {
  const proposals = load(PROPOSALS_KEY);

  const proposal = proposals.find(p => p.id === proposalId);
  if (!proposal) return { error: 'Proposal not found', proposals };
  if (proposal.status !== 'PENDING_APPROVAL') return { error: 'Not in PENDING_APPROVAL', proposals };
  if (proposal.riskTier === 'HIGH') return { error: 'HIGH risk proposals cannot be approved.', proposals };
  if (proposal.blockedReasons?.length) return { error: 'Proposals with blocked reasons cannot be approved.', proposals };
  if (checkPolicyBlock(proposal)) {
    // Force BLOCKED_BY_POLICY
    const blocked = proposals.map(p => p.id !== proposalId ? p : {
      ...p,
      status:             'DENIED',
      governanceDecision: 'BLOCKED_BY_POLICY',
      reviewedBy, reviewNote,
      reviewedAt: new Date().toISOString(),
    });
    save(PROPOSALS_KEY, blocked);
    appendAudit({ event: 'blocked_preview', proposalId, reviewedBy, note: 'BLOCKED_BY_POLICY — policy keyword detected.' });
    return { error: 'BLOCKED_BY_POLICY — policy keyword detected.', proposals: blocked };
  }

  const updated = proposals.map(p => p.id !== proposalId ? p : {
    ...p,
    status:             'APPROVED',
    governanceDecision: 'APPROVED_FOR_PREVIEW_QUEUE',
    reviewedBy, reviewNote,
    reviewedAt: new Date().toISOString(),
  });
  save(PROPOSALS_KEY, updated);
  appendAudit({ event: 'proposal_approved', proposalId, reviewedBy, note: 'Approved for preview queue only — not execution.' });
  return { proposals: updated };
}

/** PENDING_APPROVAL → DENIED */
export function denyProposal(proposalId, reviewedBy, reviewNote) {
  const proposals = load(PROPOSALS_KEY);
  const updated = proposals.map(p => p.id !== proposalId ? p : {
    ...p,
    status:             'DENIED',
    governanceDecision: 'DENIED_BY_OPERATOR',
    reviewedBy, reviewNote,
    reviewedAt: new Date().toISOString(),
  });
  save(PROPOSALS_KEY, updated);
  appendAudit({ event: 'proposal_denied', proposalId, reviewedBy, note: reviewNote || 'Denied by operator.' });
  return { proposals: updated };
}

/** APPROVED → QUEUED_PREVIEW */
export function queuePreview(proposalId) {
  const proposals = load(PROPOSALS_KEY);
  const updated = proposals.map(p => p.id !== proposalId ? p : {
    ...p,
    status:       'QUEUED_PREVIEW',
    queuedAt:     new Date().toISOString(),
  });
  save(PROPOSALS_KEY, updated);
  appendAudit({ event: 'queued_preview', proposalId, note: 'Queued for preview — no execution.' });
  return updated;
}

/** QUEUED_PREVIEW → BLOCKED_PREVIEW */
export function blockPreview(proposalId, reason) {
  const proposals = load(PROPOSALS_KEY);
  const updated = proposals.map(p => p.id !== proposalId ? p : {
    ...p,
    status:        'BLOCKED_PREVIEW',
    blockedAt:     new Date().toISOString(),
    blockNote:     reason || 'Blocked during preview queue review.',
  });
  save(PROPOSALS_KEY, updated);
  appendAudit({ event: 'blocked_preview', proposalId, note: reason || 'Blocked in preview queue.' });
  return updated;
}