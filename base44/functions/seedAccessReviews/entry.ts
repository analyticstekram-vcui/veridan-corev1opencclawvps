import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Default seed reviews for role-based access control
const SEED_REVIEWS = [
  {
    userEmail: 'owner@openclaw.local',
    assignedRole: 'OWNER',
    grantedPermissions: [
      'canViewOpenClaw',
      'canRunReadOnlyTests',
      'canApproveCommands',
      'canReviewChecklist',
      'canViewAudit',
      'canManageConnectors',
    ],
    reviewStatus: 'APPROVED',
    reviewNotes: 'Default OWNER role — full platform access (excluding disabled live execution)',
  },
  {
    userEmail: 'admin@openclaw.local',
    assignedRole: 'ADMIN',
    grantedPermissions: [
      'canViewOpenClaw',
      'canRunReadOnlyTests',
      'canApproveCommands',
      'canReviewChecklist',
      'canViewAudit',
      'canManageConnectors',
    ],
    reviewStatus: 'APPROVED',
    reviewNotes: 'Default ADMIN role — governance and connector management',
  },
  {
    userEmail: 'operator@openclaw.local',
    assignedRole: 'OPERATOR',
    grantedPermissions: [
      'canViewOpenClaw',
      'canRunReadOnlyTests',
      'canApproveCommands',
      'canReviewChecklist',
      'canViewAudit',
    ],
    reviewStatus: 'APPROVED',
    reviewNotes: 'Default OPERATOR role — can approve commands and run read-only tests',
  },
  {
    userEmail: 'auditor@openclaw.local',
    assignedRole: 'AUDITOR',
    grantedPermissions: [
      'canViewOpenClaw',
      'canViewAudit',
    ],
    reviewStatus: 'APPROVED',
    reviewNotes: 'Default AUDITOR role — audit access only, no execution',
  },
  {
    userEmail: 'readonly@openclaw.local',
    assignedRole: 'READ_ONLY',
    grantedPermissions: [
      'canViewOpenClaw',
    ],
    reviewStatus: 'APPROVED',
    reviewNotes: 'Default READ_ONLY role — system monitoring and status visibility only',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if seed reviews already exist
    const existingReviews = await base44.asServiceRole.entities.OpenClawAccessReview.list('-created_date', 100);
    const seedEmails = SEED_REVIEWS.map(r => r.userEmail);
    const alreadySeeded = existingReviews.filter(r => seedEmails.includes(r.userEmail));

    if (alreadySeeded.length > 0) {
      return Response.json({
        status: 'already_seeded',
        message: `${alreadySeeded.length} seed reviews already exist`,
        existing: alreadySeeded.map(r => ({ email: r.userEmail, role: r.assignedRole })),
      });
    }

    // Create seed reviews
    const nowISO = new Date().toISOString();
    const seedPayloads = SEED_REVIEWS.map(review => ({
      ...review,
      reviewedBy: user.email,
      reviewedAt: nowISO,
    }));

    await base44.asServiceRole.entities.OpenClawAccessReview.bulkCreate(seedPayloads);

    return Response.json({
      status: 'success',
      message: `Created ${SEED_REVIEWS.length} seed access reviews`,
      created: SEED_REVIEWS.map(r => ({
        email: r.userEmail,
        role: r.assignedRole,
        status: r.reviewStatus,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error.message, status: 'error' },
      { status: 500 }
    );
  }
});