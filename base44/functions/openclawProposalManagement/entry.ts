import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

const VALID_COMMAND_TYPES = ['READ', 'VERIFY', 'NAVIGATE_READ_ONLY', 'SNAPSHOT', 'EXPORT_LOG', 'PROPOSE_WORKFLOW'];
const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED', 'EXPIRED'];

// Create a new proposal (always starts as DRAFT)
const createProposal = async (base44, user, data) => {
  if (!VALID_COMMAND_TYPES.includes(data.commandType)) {
    throw new Error(`Invalid commandType: ${data.commandType}`);
  }

  const proposal = {
    requestId: uuidv4(),
    proposedBy: user.email || 'unknown',
    commandType: data.commandType,
    target: data.target || 'gateway',
    selector: data.selector || null,
    url: data.url || null,
    payloadPreview: data.payloadPreview || {},
    riskTier: data.riskTier || 'LOW',
    policyGate: data.policyGate || 'PASS',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNote: null,
    expiresAt: null,
    auditTraceId: `trace-${uuidv4()}`,
  };

  const created = await base44.asServiceRole.entities.OpenClawProposal.create(proposal);

  // Log to audit trail
  await base44.asServiceRole.entities.CommandAuditTrailPanel.create({
    eventType: 'PROPOSAL_CREATED',
    eventId: `audit-${uuidv4()}`,
    proposalId: created.id,
    operatorEmail: user.email || 'unknown',
    message: `Proposal created: ${data.commandType} on ${data.target}`,
    details: {
      commandType: data.commandType,
      target: data.target,
      riskTier: data.riskTier,
      policyGate: data.policyGate,
    },
    timestamp: new Date().toISOString(),
    severity: 'INFO',
  }).catch(() => {}); // Don't fail if audit log fails

  return created;
};

// Update proposal status (DRAFT → PENDING_APPROVAL, PENDING_APPROVAL → APPROVED/DENIED)
const updateProposalStatus = async (base44, user, proposalId, newStatus, reviewNote = '') => {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const proposal = await base44.asServiceRole.entities.OpenClawProposal.get(proposalId);
  if (!proposal) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  const updatedProposal = {
    ...proposal,
    status: newStatus,
    reviewedAt: ['APPROVED', 'DENIED'].includes(newStatus) ? new Date().toISOString() : proposal.reviewedAt,
    reviewedBy: ['APPROVED', 'DENIED'].includes(newStatus) ? (user.email || 'unknown') : proposal.reviewedBy,
    reviewNote: reviewNote || proposal.reviewNote,
  };

  const result = await base44.asServiceRole.entities.OpenClawProposal.update(proposalId, updatedProposal);

  // Log to audit trail
  const eventType = newStatus === 'APPROVED' ? 'PROPOSAL_APPROVED' : newStatus === 'DENIED' ? 'PROPOSAL_DENIED' : 'PROPOSAL_STATUS_CHANGED';
  await base44.asServiceRole.entities.CommandAuditTrailPanel.create({
    eventType,
    eventId: `audit-${uuidv4()}`,
    proposalId: proposalId,
    operatorEmail: user.email || 'unknown',
    message: `Proposal ${newStatus}: ${proposal.commandType}`,
    details: {
      previousStatus: proposal.status,
      newStatus,
      reviewNote,
    },
    timestamp: new Date().toISOString(),
    severity: eventType === 'PROPOSAL_APPROVED' ? 'INFO' : eventType === 'PROPOSAL_DENIED' ? 'WARNING' : 'INFO',
  }).catch(() => {}); // Don't fail if audit log fails

  // IMPORTANT: Approval does not execute
  // The proposal remains non-executable until a future execution phase explicitly enables it
  if (newStatus === 'APPROVED') {
    console.log(`[APPROVAL DOES NOT EXECUTE] Proposal ${proposalId} approved but will not execute. Execution must be explicitly enabled in a future phase.`);
  }

  return result;
};

// Get all proposals
const listProposals = async (base44, sort = '-createdAt', limit = 50) => {
  return await base44.asServiceRole.entities.OpenClawProposal.list(sort, limit);
};

// Get proposals by status
const getProposalsByStatus = async (base44, status, sort = '-createdAt', limit = 50) => {
  return await base44.asServiceRole.entities.OpenClawProposal.filter({ status }, sort, limit);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || 'list';

    // CREATE: Create a new proposal
    if (action === 'create') {
      const proposal = await createProposal(base44, user, body.data || {});
      return Response.json({
        success: true,
        proposal,
        message: 'Proposal created in DRAFT status. Approval does not execute.',
      });
    }

    // UPDATE_STATUS: Change proposal status
    if (action === 'update_status') {
      const proposal = await updateProposalStatus(base44, user, body.proposalId, body.newStatus, body.reviewNote);
      return Response.json({
        success: true,
        proposal,
        message: `Proposal status updated to ${body.newStatus}. Approval does not execute.`,
      });
    }

    // LIST: Get all proposals
    if (action === 'list') {
      const proposals = await listProposals(base44, body.sort || '-createdAt', body.limit || 50);
      return Response.json({
        success: true,
        proposals,
        count: proposals.length,
      });
    }

    // LIST_BY_STATUS: Get proposals by status
    if (action === 'list_by_status') {
      const proposals = await getProposalsByStatus(base44, body.status, body.sort || '-createdAt', body.limit || 50);
      return Response.json({
        success: true,
        proposals,
        status: body.status,
        count: proposals.length,
      });
    }

    // GET: Get single proposal
    if (action === 'get') {
      const proposal = await base44.asServiceRole.entities.OpenClawProposal.get(body.proposalId);
      return Response.json({
        success: true,
        proposal,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Proposal management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});