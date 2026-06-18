/**
 * vaultAgentBridgeVerifier.js
 * Phase 5 — Live Read-Only Bridge Verification
 *
 * This module validates the browser-side bridge boundary before any live
 * Vault Agent payload is accepted by Veridan Core.
 *
 * SAFETY:
 * - GET only
 * - localhost only
 * - reporting data only
 * - no write, mutation, execution, broker, banking, or activation signals
 */

const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const DISABLED_VALUES = new Set([
  false,
  'false',
  'FALSE',
  'disabled',
  'DISABLED',
  'not_executed',
  'NOT_EXECUTED',
  'not_sent',
  'NOT_SENT',
  'not_dispatched',
  'NOT_DISPATCHED',
  'read_only',
  'READ_ONLY',
  'reporting_only',
  'REPORTING_ONLY',
  'documentation_only',
  'DOCUMENTATION_ONLY',
]);

const REQUIRED_SAFETY_META = {
  safetyMode: 'READ_ONLY',
  executionStatus: 'NOT_EXECUTED',
  dispatchStatus: 'NOT_DISPATCHED',
  openclawCall: 'NOT_SENT',
  brokerAccess: 'DISABLED',
  bankAccess: 'DISABLED',
};

const FORBIDDEN_ACTION_KEYS = new Set([
  'writeenabled',
  'canwrite',
  'vaultwriteenabled',
  'entitywriteenabled',
  'databasewriteenabled',
  'databasewrites',
  'dbwrite',
  'mutationenabled',
  'mutationsenabled',
  'createenabled',
  'updateenabled',
  'deleteenabled',
  'removeenabled',
  'approveenabled',
  'approvalmutation',
  'activateenabled',
  'activationenabled',
  'governanceactivation',
  'executeenabled',
  'executionenabled',
  'dispatchenabled',
  'tradingenabled',
  'brokeraccess',
  'bankaccess',
  'bankingaccess',
  'openclawexecution',
  'schedulerenabled',
  'automationenabled',
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDisabledValue(value) {
  if (value === undefined || value === null || value === '') return true;
  return DISABLED_VALUES.has(value);
}

function hasUnsafeSignal(value) {
  if (Array.isArray(value)) {
    return value.some(entry => hasUnsafeSignal(entry));
  }

  if (!isPlainObject(value)) return false;

  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = key.toLowerCase();

    if (FORBIDDEN_ACTION_KEYS.has(normalizedKey) && !isDisabledValue(child)) {
      return true;
    }

    return hasUnsafeSignal(child);
  });
}

export const DEFAULT_VAULT_AGENT_BRIDGE_URL = 'http://127.0.0.1:57445/vault-agent/reports';

export function getVaultAgentBridgeUrl() {
  const configuredUrl = import.meta?.env?.VITE_VAULT_AGENT_BRIDGE_URL;
  return configuredUrl || DEFAULT_VAULT_AGENT_BRIDGE_URL;
}

export function verifyBridgeRequest(url, method = 'GET') {
  if (method !== 'GET') {
    return { ok: false, reason: 'BRIDGE_REJECTED_METHOD_NOT_GET' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'BRIDGE_REJECTED_INVALID_URL' };
  }

  if (parsed.protocol !== 'http:') {
    return { ok: false, reason: 'BRIDGE_REJECTED_PROTOCOL_NOT_HTTP' };
  }

  if (!LOCALHOSTS.has(parsed.hostname)) {
    return { ok: false, reason: 'BRIDGE_REJECTED_NON_LOCALHOST' };
  }

  if (!parsed.pathname.startsWith('/vault-agent/')) {
    return { ok: false, reason: 'BRIDGE_REJECTED_INVALID_PATH' };
  }

  return { ok: true, reason: 'BRIDGE_REQUEST_VERIFIED', url: parsed.toString() };
}

export function verifyBridgePayload(payload) {
  if (!isPlainObject(payload)) {
    return { ok: false, reason: 'BRIDGE_REJECTED_PAYLOAD_NOT_OBJECT' };
  }

  const requiredSections = [
    'dailyBrief',
    'pendingApprovals',
    'reviewsDue',
    'openclawBoundary',
    'weeklyGovernanceBrief',
    'recommendedActions',
    'monitoring',
    'adapterMeta',
  ];

  const missingSection = requiredSections.find(section => !(section in payload));
  if (missingSection) {
    return { ok: false, reason: `BRIDGE_REJECTED_MISSING_${missingSection.toUpperCase()}` };
  }

  if (hasUnsafeSignal(payload)) {
    return { ok: false, reason: 'BRIDGE_REJECTED_UNSAFE_SIGNAL' };
  }

  const meta = payload.adapterMeta || {};
  for (const [key, expected] of Object.entries(REQUIRED_SAFETY_META)) {
    if (meta[key] !== expected) {
      return { ok: false, reason: `BRIDGE_REJECTED_META_${key.toUpperCase()}` };
    }
  }

  const daily = payload.dailyBrief || {};
  const monitoring = payload.monitoring || {};
  const openclaw = payload.openclawBoundary || {};

  const numericChecks = [
    ['dailyBrief.totalNotes', daily.totalNotes],
    ['dailyBrief.totalWikiLinks', daily.totalWikiLinks],
    ['dailyBrief.pendingApprovalsCount', daily.pendingApprovalsCount],
    ['dailyBrief.reviewsDueWithin7Days', daily.reviewsDueWithin7Days],
    ['dailyBrief.openExceptions', daily.openExceptions],
    ['monitoring.healthScore', monitoring.healthScore],
    ['monitoring.freshnessScore', monitoring.freshnessScore],
  ];

  const badNumber = numericChecks.find(([, number]) => typeof number !== 'number' || Number.isNaN(number));
  if (badNumber) {
    return { ok: false, reason: `BRIDGE_REJECTED_INVALID_NUMBER_${badNumber[0]}` };
  }

  if (openclaw.executionEnabled !== false || openclaw.dispatchEnabled !== false) {
    return { ok: false, reason: 'BRIDGE_REJECTED_OPENCLAW_ENABLED' };
  }

  const openclawMonitor = monitoring.openclawMonitor || {};
  if (openclawMonitor.executionEnabled !== false || openclawMonitor.dispatchEnabled !== false) {
    return { ok: false, reason: 'BRIDGE_REJECTED_OPENCLAW_MONITOR_ENABLED' };
  }

  return { ok: true, reason: 'BRIDGE_PAYLOAD_VERIFIED' };
}

export function buildBridgeStatus({ mode, request, payload, error }) {
  return {
    mode,
    endpoint: request?.url || getVaultAgentBridgeUrl(),
    requestStatus: request?.reason || 'BRIDGE_REQUEST_NOT_ATTEMPTED',
    payloadStatus: payload?.reason || 'BRIDGE_PAYLOAD_NOT_USED',
    fallbackActive: mode !== 'LIVE_READ_ONLY',
    error: error || null,
    safety: {
      getOnly: true,
      localhostOnly: true,
      noWrites: true,
      noDatabaseMutations: true,
      noOpenClawExecution: true,
      noBrokerAccess: true,
      noBankingAccess: true,
      noGovernanceActivation: true,
    },
  };
}
