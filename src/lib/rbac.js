/**
 * RBAC Role and Permission Definitions for OpenClaw Control
 * Veridan Core — User Access Control Framework
 */

export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  AUDITOR: 'AUDITOR',
  READ_ONLY: 'READ_ONLY',
};

export const PERMISSIONS = {
  canViewOpenClaw: 'canViewOpenClaw',
  canRunReadOnlyTests: 'canRunReadOnlyTests',
  canApproveCommands: 'canApproveCommands',
  canReviewChecklist: 'canReviewChecklist',
  canViewAudit: 'canViewAudit',
  canManageConnectors: 'canManageConnectors',
  canUseLiveExecution: 'canUseLiveExecution', // Always false for now
};

/**
 * Role-to-Permissions mapping
 * Defines what permissions each role grants
 */
export const ROLE_PERMISSIONS = {
  OWNER: [
    PERMISSIONS.canViewOpenClaw,
    PERMISSIONS.canRunReadOnlyTests,
    PERMISSIONS.canApproveCommands,
    PERMISSIONS.canReviewChecklist,
    PERMISSIONS.canViewAudit,
    PERMISSIONS.canManageConnectors,
    // canUseLiveExecution is intentionally NOT included — always disabled
  ],
  ADMIN: [
    PERMISSIONS.canViewOpenClaw,
    PERMISSIONS.canRunReadOnlyTests,
    PERMISSIONS.canApproveCommands,
    PERMISSIONS.canReviewChecklist,
    PERMISSIONS.canViewAudit,
    PERMISSIONS.canManageConnectors,
    // canUseLiveExecution is intentionally NOT included — always disabled
  ],
  OPERATOR: [
    PERMISSIONS.canViewOpenClaw,
    PERMISSIONS.canRunReadOnlyTests,
    PERMISSIONS.canApproveCommands,
    PERMISSIONS.canReviewChecklist,
    PERMISSIONS.canViewAudit,
    // No canManageConnectors
    // No canUseLiveExecution
  ],
  AUDITOR: [
    PERMISSIONS.canViewOpenClaw,
    PERMISSIONS.canViewAudit,
    PERMISSIONS.canReviewChecklist,
    // No canRunReadOnlyTests, canApproveCommands, canManageConnectors
    // No canUseLiveExecution
  ],
  READ_ONLY: [
    PERMISSIONS.canViewOpenClaw,
    PERMISSIONS.canViewAudit,
    PERMISSIONS.canReviewChecklist,
    // Only view-only permissions
    // No canRunReadOnlyTests, canApproveCommands, canManageConnectors
    // No canUseLiveExecution
  ],
};

/**
 * Role descriptions and access levels
 */
export const ROLE_METADATA = {
  OWNER: {
    displayName: 'Owner',
    description: 'Full access to all OpenClaw Control panels and features (except live execution, which remains disabled)',
    tier: 5,
    allowedPanels: ['overview', 'status', 'safe_bridge', 'safety_tests', 'readiness_gate', 'approval_workflow', 'policy_registry', 'connectors', 'risk_matrix', 'runbook', 'simulations', 'snapshot', 'handoff', 'production_checklist', 'browser_read', 'risk_map', 'audit', 'workflows', 'nodes', 'logs', 'readiness', 'telemetry', 'legacy_review'],
  },
  ADMIN: {
    displayName: 'Admin',
    description: 'Configure system, manage approval workflows, review checklists, and approve commands (cannot enable live execution)',
    tier: 4,
    allowedPanels: ['overview', 'status', 'safe_bridge', 'safety_tests', 'readiness_gate', 'approval_workflow', 'policy_registry', 'connectors', 'risk_matrix', 'runbook', 'simulations', 'snapshot', 'production_checklist', 'browser_read', 'risk_map', 'audit', 'workflows', 'telemetry', 'legacy_review'],
  },
  OPERATOR: {
    displayName: 'Operator',
    description: 'Run safe read-only simulations, review checklists, approve commands, and view system status',
    tier: 3,
    allowedPanels: ['overview', 'status', 'safe_bridge', 'safety_tests', 'readiness_gate', 'approval_workflow', 'production_checklist', 'browser_read', 'audit', 'logs', 'legacy_review'],
  },
  AUDITOR: {
    displayName: 'Auditor',
    description: 'View audit logs, execution history, legacy reviews, and production checklist progress (read-only)',
    tier: 2,
    allowedPanels: ['overview', 'status', 'audit', 'production_checklist', 'legacy_review', 'snapshot', 'logs'],
  },
  READ_ONLY: {
    displayName: 'Read-Only',
    description: 'View system status, audit logs, checklist progress, and snapshots (no execution or approval)',
    tier: 1,
    allowedPanels: ['overview', 'status', 'audit', 'production_checklist', 'snapshot', 'logs'],
  },
};

/**
 * Check if a user with a given role has a specific permission
 */
export function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a given role
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user can access a specific panel
 */
export function canAccessPanel(role, panelId) {
  if (!role || !ROLE_METADATA[role]) return false;
  return ROLE_METADATA[role].allowedPanels.includes(panelId);
}

/**
 * Get access tier for comparison (higher = more access)
 */
export function getAccessTier(role) {
  return ROLE_METADATA[role]?.tier || 0;
}