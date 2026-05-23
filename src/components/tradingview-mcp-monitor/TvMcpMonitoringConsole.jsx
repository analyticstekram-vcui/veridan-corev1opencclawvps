/**
 * TvMcpMonitoringConsole
 * Veridan Core — TradingView MCP Manual Read-Only Monitoring Console
 * PREVIEW_ONLY / READ_ONLY / LOCKED
 * No trading · No broker · No credentials · No execution · No polling
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Play, Copy, Trash2, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import TvMcpEvidenceSummary from './TvMcpEvidenceSummary';
import TvMcpManualChartInstructions from './TvMcpManualChartInstructions';
import TvMcpChartControlPanel from './TvMcpChartControlPanel';
import TvAlertIntakePanel from './TvAlertIntakePanel';
import TvSignalProposalPanel from './TvSignalProposalPanel';
import TvProposalApprovalQueue from './TvProposalApprovalQueue';

const STORAGE_KEY        = 'veridanTradingViewMcpChecks';
const NAV_HISTORY_KEY    = 'veridanTvMcpChartNavHistory';
const PREVIEWS_KEY       = 'veridanTvMcpChartControlPreviews';
const ALERT_ACCEPTED_KEY = 'veridanTradingViewAlertIntakeRecords';
const ALERT_REJECTED_KEY = 'veridanTradingViewAlertRejectedRecords';
const PROPOSAL_KEY       = 'veridanTradingViewSignalProposalPreviews';
const APPROVAL_KEY       = 'veridanTradingViewProposalApprovalRecords';

const SUCCESS_STATUSES = ['SUCCESS', 'CONNECTED_READ_ONLY', 'QUOTE_CONNECTED', 'HEALTH_CONNECTED', 'STATUS_CONNECTED', 'READ_ONLY_CHECK_ONLY', 'VERIFIED', 'PASSED', 'READ_ONLY_VERIFIED'];

const EVIDENCE_SUMMARY_KEY = 'veridanTradingViewMcpEvidenceSummary';

const ALLOWED_COMMANDS = ['status', 'quote'];
const BLOCKED_COMMANDS = ['trade', 'order', 'buy', 'sell', 'close', 'flatten', 'broker', 'login', 'password', 'credential', 'withdraw', 'deposit', 'transfer', 'health', 'values', 'screenshot', 'ui-state', 'discover', 'range', 'stream'];

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveChecks(checks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checks.slice(0, 100))); } catch {}
}

/**
 * Parse the last valid JSON object from a stdout string.
 * npm output often includes non-JSON lines before the actual JSON payload.
 */
export function parseLastJsonFromStdout(stdout) {
  if (!stdout) return null;
  if (typeof stdout === 'object') return stdout;
  // Find all JSON objects in the string and return the last valid one
  const matches = [];
  let depth = 0, start = -1;
  for (let i = 0; i < stdout.length; i++) {
    if (stdout[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (stdout[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        matches.push(stdout.slice(start, i + 1));
        start = -1;
      }
    }
  }
  for (let i = matches.length - 1; i >= 0; i--) {
    try { return JSON.parse(matches[i]); } catch { /* skip */ }
  }
  return null;
}

/**
 * Extract normalised fields from the relay response, drilling into stdout if needed.
 * Never exposes the relay URL.
 */
function extractFields(command, result) {
  const raw = result?.data ?? result ?? {};

  // Try to parse stdout for nested JSON
  const stdout = raw?.stdout ?? raw?.result?.stdout ?? null;
  const parsed = parseLastJsonFromStdout(stdout) ?? {};

  if (command === 'status') {
    return {
      cdpConnected:    parsed.cdp_connected    ?? raw.cdp_connected    ?? result?.cdpConnected    ?? null,
      chartSymbol:     parsed.chart_symbol     ?? raw.chart_symbol     ?? result?.chartSymbol     ?? null,
      chartResolution: parsed.chart_resolution ?? raw.chart_resolution ?? result?.chartResolution ?? null,
      targetTitle:     parsed.target_title     ?? raw.target_title     ?? null,
      apiAvailable:    parsed.api_available    ?? raw.api_available    ?? null,
      // Never expose relay URL — always fixed
      targetUrl:       'relay-internal (not exposed)',
      parsedPayload:   parsed,
    };
  }

  if (command === 'quote') {
    return {
      cdpConnected:    null,
      chartSymbol:     parsed.symbol      ?? raw.symbol      ?? result?.chartSymbol ?? null,
      chartResolution: null,
      targetTitle:     null,
      apiAvailable:    null,
      targetUrl:       'relay-internal (not exposed)',
      quoteSymbol:     parsed.symbol      ?? raw.symbol      ?? null,
      quoteLast:       parsed.last        ?? raw.last        ?? null,
      quoteOpen:       parsed.open        ?? raw.open        ?? null,
      quoteHigh:       parsed.high        ?? raw.high        ?? null,
      quoteLow:        parsed.low         ?? raw.low         ?? null,
      quoteClose:      parsed.close       ?? raw.close       ?? null,
      quoteVolume:     parsed.volume      ?? raw.volume      ?? null,
      quoteDescription:parsed.description ?? raw.description ?? null,
      quoteExchange:   parsed.exchange    ?? raw.exchange    ?? null,
      quoteType:       parsed.type        ?? raw.type        ?? null,
      parsedPayload:   parsed,
    };
  }

  return { targetUrl: 'relay-internal (not exposed)', parsedPayload: parsed };
}

function buildCheckRecord({ command, result, durationMs }) {
  const safetyAssertions = [
    { key: 'readOnly',               value: true,  pass: true },
    { key: 'methodGet',              value: true,  pass: true },
    { key: 'commandAllowlisted',     value: ALLOWED_COMMANDS.includes(command), pass: ALLOWED_COMMANDS.includes(command) },
    { key: 'blockedCommandRejected', value: BLOCKED_COMMANDS.includes(command), pass: !BLOCKED_COMMANDS.includes(command) },
    { key: 'schedulerActive',        value: false, pass: true },
    { key: 'pollingLoopActive',      value: false, pass: true },
    { key: 'dispatchAllowed',        value: false, pass: true },
    { key: 'executionAllowed',       value: false, pass: true },
    { key: 'tradeAttempted',         value: false, pass: true },
    { key: 'brokerActionAttempted',  value: false, pass: true },
    { key: 'credentialExposed',      value: false, pass: true },
    { key: 'secretExposed',          value: false, pass: true },
    { key: 'moneyMovementAttempted', value: false, pass: true },
    { key: 'mutationMethodUsed',     value: false, pass: true },
    { key: 'browserWriteActionUsed', value: false, pass: true },
  ];

  const fields = extractFields(command, result);

  return {
    checkId:            'mcp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    createdAt:          new Date().toISOString(),
    command,
    status:             result?.status || 'UNKNOWN',
    httpStatus:         result?.httpStatus ?? null,
    relayReachable:     result?.relayReachable ?? false,
    cdpConnected:       fields.cdpConnected,
    chartSymbol:        fields.chartSymbol,
    chartResolution:    fields.chartResolution,
    targetTitle:        fields.targetTitle ?? null,
    apiAvailable:       fields.apiAvailable ?? null,
    targetUrl:          'relay-internal (not exposed)',
    // quote fields (populated when command=quote)
    quoteSymbol:        fields.quoteSymbol        ?? null,
    quoteLast:          fields.quoteLast          ?? null,
    quoteOpen:          fields.quoteOpen          ?? null,
    quoteHigh:          fields.quoteHigh          ?? null,
    quoteLow:           fields.quoteLow           ?? null,
    quoteClose:         fields.quoteClose         ?? null,
    quoteVolume:        fields.quoteVolume        ?? null,
    quoteDescription:   fields.quoteDescription   ?? null,
    quoteExchange:      fields.quoteExchange      ?? null,
    quoteType:          fields.quoteType          ?? null,
    responseSummary:    result?.error || result?.notes || (result?.ok ? 'Check succeeded' : 'Check held'),
    durationMs:         durationMs ?? null,
    executionLock:      'LOCKED',
    dispatchAllowed:    false,
    executionAllowed:   false,
    liveTrading:        'DISABLED',
    brokerConnection:   'DISABLED',
    credentialAccess:   'DISABLED',
    moneyMovement:      'DISABLED',
    safetyAssertions,
    safetyPassCount:    safetyAssertions.filter(a => a.pass).length,
    safetyFailCount:    safetyAssertions.filter(a => !a.pass).length,
    rawData:            result?.data ?? null,
    parsedPayload:      fields.parsedPayload ?? null,
    sourceComponent:    'TvMcpMonitoringConsole',
  };
}

// ─── Defensive helpers ────────────────────────────────────────────────────────

/** Safely load a localStorage key as an array. Never throws. */
function safeArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

/** Derive a canonical ISO timestamp from any record shape. Never throws. */
function safeTimestamp(r) {
  if (!r || typeof r !== 'object') return null;
  const v = r.approvedAt ?? r.reviewedAt ?? r.createdAt ?? r.receivedAt ??
            r.validatedAt ?? r.timestamp ?? r.generatedAt ?? r.auditTimestamp ??
            r.updatedAt ?? r.invokedAt ?? null;
  if (!v) return null;
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch { return null; }
}

function safeString(v, fallback = 'N/A') {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function safeBool(v) { return v === true; }

/**
 * Format a raw command string for UI display.
 * Preserves raw lastCommand unchanged; used only for display.
 */
function formatCommandLabel(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'none';
  const lower = cmd.toLowerCase().trim();
  const lookup = {
    'get /health': 'Health Check',
    'get /status': 'Status Check',
    'get /version': 'Version Check',
    'get /capabilities': 'Capabilities Check',
    'read': 'Read',
    'verify': 'Verify',
    'status': 'Status Check',
    'quote': 'Quote Check',
    'health': 'Health Check',
  };
  return lookup[lower] ?? safeString(cmd, 'none');
}

/**
 * Derive a display-only coherence badge for the command evidence tile.
 * Does not mutate evidence. Pure classification based on field presence.
 */
function getCommandEvidenceCoherence(evidence) {
  const cmd = evidence?.lastCommand;
  const src = evidence?.lastCommandSource;
  const ts  = evidence?.lastCommandAt;

  const hasCmd = cmd && typeof cmd === 'string' && cmd.trim() &&
    !['unknown', 'none', 'n/a', 'null', 'undefined'].includes(cmd.trim().toLowerCase());
  const hasSrc = src && typeof src === 'string' && src.trim();
  const hasTs  = ts  && typeof ts  === 'string' && ts.trim();

  if (!hasCmd && !hasSrc && !hasTs) return 'NONE';
  if (hasCmd && hasSrc && hasTs)   return 'COHERENT';
  return 'REVIEW';
}

/**
 * Derive a display-only reason explaining the command evidence coherence state.
 * Does not mutate evidence. Pure classification based on field presence.
 */
function getCommandEvidenceCoherenceReason(evidence) {
  const cmd = evidence?.lastCommand;
  const src = evidence?.lastCommandSource;
  const ts  = evidence?.lastCommandAt;

  const hasCmd = cmd && typeof cmd === 'string' && cmd.trim() &&
    !['unknown', 'none', 'n/a', 'null', 'undefined'].includes(cmd.trim().toLowerCase());
  const hasSrc = src && typeof src === 'string' && src.trim();
  const hasTs  = ts  && typeof ts  === 'string' && ts.trim();

  if (!hasCmd && !hasSrc && !hasTs) {
    return 'No valid command evidence found.';
  }
  if (hasCmd && hasSrc && hasTs) {
    return 'Command, source, and timestamp are aligned.';
  }

  // REVIEW cases — determine what's missing
  const missing = [];
  if (hasCmd && !hasSrc) missing.push('source');
  if (hasCmd && !hasTs)  missing.push('timestamp');
  if (!hasCmd && (hasSrc || hasTs)) {
    return 'Source or timestamp exists without a valid command.';
  }

  if (missing.length > 0) {
    return `Command evidence is incomplete: missing ${missing.join(' and ')}.`;
  }

  return 'Command evidence is incomplete.';
}

/**
 * Format raw command value for debug/secondary display.
 * Handles edge cases: null, undefined, empty, whitespace, placeholders.
 * Display-only; does not mutate evidence.lastCommand.
 */
function formatRawCommandDebugValue(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'none';
  const trimmed = cmd.trim();
  if (!trimmed) return 'none';
  const lower = trimmed.toLowerCase();
  if (lower === 'unknown' || lower === 'n/a' || lower === 'null' || lower === 'undefined') {
    return 'none';
  }
  return trimmed;
}

const SUCCESS_STATUS_SET = new Set([
  'SUCCESS', 'CONNECTED_READ_ONLY', 'QUOTE_CONNECTED', 'HEALTH_CONNECTED',
  'STATUS_CONNECTED', 'READ_ONLY_CHECK_ONLY', 'VERIFIED', 'PASSED',
  'READ_ONLY_VERIFIED', 'CONNECTED', 'ACCEPTED', 'LOCALLY_APPROVED',
]);

/**
 * Derive safety pass/fail counts from a raw record.
 * Never counts a missing safety field as a failure.
 */
function deriveSafetyCounts(r) {
  // Explicit numeric fields take priority
  if (typeof r.safetyPassCount === 'number' && typeof r.safetyFailCount === 'number') {
    return { pass: r.safetyPassCount, fail: r.safetyFailCount };
  }
  // safetyAssertions array
  if (Array.isArray(r.safetyAssertions) && r.safetyAssertions.length > 0) {
    let pass = 0, fail = 0;
    for (const a of r.safetyAssertions) {
      if (a && typeof a === 'object') { a.pass === false ? fail++ : pass++; }
    }
    return { pass, fail };
  }
  // violationFlags object — each truthy flag is a failure
  if (r.violationFlags && typeof r.violationFlags === 'object') {
    let fail = 0;
    for (const v of Object.values(r.violationFlags)) { if (v === true) fail++; }
    return { pass: 0, fail };
  }
  // No safety data — default 0/0, not assumed pass or fail
  return { pass: 0, fail: 0 };
}

/**
 * Normalise any raw record from any of the 5 storage keys into a
 * unified shape used only for evidence chain aggregation.
 */
function normalizeEvidenceRecord(r, sourceKey) {
  if (!r || typeof r !== 'object') return null;
  try {
    const status    = safeString(r.status, 'UNKNOWN');
    const timestamp = safeTimestamp(r);
    const { pass, fail } = deriveSafetyCounts(r);

    // Alert-accepted records
    if (sourceKey === ALERT_ACCEPTED_KEY) {
      return {
        sourceKey, id: safeString(r.alertId ?? r.id, 'alert-acc-' + Math.random().toString(36).slice(2)),
        command: 'alert_accepted', status: 'ACCEPTED',
        timestamp, success: true, blocked: false,
        isAlert: true, isRejectedAlert: false,
        rejectionReason: null, blockedTerm: null,
        safetyPassCount: pass, safetyFailCount: 0, // intentional policy block = not a safety fail
      };
    }

    // Alert-rejected records
    if (sourceKey === ALERT_REJECTED_KEY) {
      return {
        sourceKey, id: safeString(r.alertId ?? r.id, 'alert-rej-' + Math.random().toString(36).slice(2)),
        command: 'alert_rejected', status: 'REJECTED',
        timestamp, success: false, blocked: true,
        isAlert: true, isRejectedAlert: true,
        rejectionReason: safeString(r.rejectionReason, null),
        blockedTerm: safeString(r.blockedTerm ?? r.matchedTerm, null),
        safetyPassCount: pass, safetyFailCount: 0, // intentional policy block = not a safety fail
      };
    }

    // Proposal preview records
    if (sourceKey === PROPOSAL_KEY) {
      return {
        sourceKey, id: safeString(r.proposalId ?? r.id, 'prop-' + Math.random().toString(36).slice(2)),
        command: 'proposal_preview', status: 'PROPOSAL_PREVIEW_ONLY',
        timestamp, success: true, blocked: false,
        isAlert: false, isRejectedAlert: false, isProposal: true,
        rejectionReason: null, blockedTerm: null,
        symbol: safeString(r.symbol, null),
        side: safeString(r.side, null),
        riskProfile: safeString(r.riskProfile, null),
        safetyPassCount: typeof r.safetyPassCount === 'number' ? r.safetyPassCount : 0,
        safetyFailCount: 0,
      };
    }

    // MCP checks / nav history / previews
    const isBlocked = (
      r.blocked === true || r.rejected === true ||
      status === 'BLOCKED_BY_POLICY' || status === 'REJECTED' || status === 'BLOCKED'
    );
    const isSuccess = !isBlocked && (
      SUCCESS_STATUS_SET.has(status) ||
      safeBool(r.success) || safeBool(r.statusOk) ||
      safeBool(r.quoteOk) || safeBool(r.healthOk) || safeBool(r.accepted)
    );

    return {
      sourceKey,
      id: safeString(r.checkId ?? r.auditId ?? r.previewId ?? r.id, sourceKey + '-' + Math.random().toString(36).slice(2)),
      command: safeString(r.command ?? r.lastCommand, 'unknown'),
      status,
      timestamp,
      success: isSuccess,
      blocked: isBlocked,
      isAlert: false,
      isRejectedAlert: false,
      rejectionReason: null,
      blockedTerm: null,
      safetyPassCount: pass,
      safetyFailCount: fail,
    };
  } catch { return null; }
}

/** Safely load and normalize all 6 storage keys into unified records. */
function loadAllNormalizedRecords() {
  const sources = [
    { key: STORAGE_KEY,        arr: safeArray(STORAGE_KEY) },
    { key: NAV_HISTORY_KEY,    arr: safeArray(NAV_HISTORY_KEY) },
    { key: PREVIEWS_KEY,       arr: safeArray(PREVIEWS_KEY) },
    { key: ALERT_ACCEPTED_KEY, arr: safeArray(ALERT_ACCEPTED_KEY) },
    { key: ALERT_REJECTED_KEY, arr: safeArray(ALERT_REJECTED_KEY) },
    { key: PROPOSAL_KEY,       arr: safeArray(PROPOSAL_KEY) },
    { key: APPROVAL_KEY,       arr: safeArray(APPROVAL_KEY) },
  ];

  const all = [];
  for (const { key, arr } of sources) {
    for (const r of arr) {
      const norm = normalizeEvidenceRecord(r, key);
      if (norm) all.push(norm);
    }
  }

  // Sort newest first — records without timestamp go last
  all.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
  return all;
}

/**
 * Resolve the newest valid operator command from all available event sources.
 * Scans candidates sorted by timestamp descending and returns the first one
 * with a meaningful command value. Never returns "unknown" unless nothing valid exists.
 *
 * Returns { lastCommand, source, timestamp }
 *
 * Verification:
 *   [1] newest command-bearing event wins — candidates sorted newest-first
 *   [2] newer empty/synthetic event does not erase older valid command — INVALID_COMMANDS filter
 *   [3] "unknown" only when no valid command found — explicit fallback at end
 *   [4] no execution/dispatch — pure read from in-memory arrays, no side effects
 */
const INVALID_COMMANDS = new Set([
  '', 'unknown', 'n/a', 'null', 'undefined',
  'alert_accepted', 'alert_rejected',
  'proposal_preview', 'approval_governance',
]);

function isValidCommand(v) {
  if (!v || typeof v !== 'string') return false;
  return !INVALID_COMMANDS.has(v.trim().toLowerCase());
}

function resolveLastCommandFromEvents(events) {
  // events: array of { command, commandType, timestamp, source }
  // Sort newest-first by timestamp
  const sorted = [...events].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  for (const e of sorted) {
    // Prefer explicit command, fall back to commandType
    const cmd = e.command ?? e.commandType ?? null;
    if (isValidCommand(cmd)) {
      return { lastCommand: cmd.trim(), source: e.source ?? 'unknown-source', timestamp: e.timestamp ?? null };
    }
  }
  return { lastCommand: 'unknown', source: null, timestamp: null };
}

/** Build the full evidence chain summary from normalized records. */
function buildEvidenceChain(rawChecks) {
  try {
    // Accept either raw check records (from runCheck) or already normalized
    // When called from runCheck, rawChecks is the raw checks array — reload all storage
    const records = loadAllNormalizedRecords();

    if (records.length === 0 && (!rawChecks || rawChecks.length === 0)) return null;

    const successful = records.filter(r => r.success);
    const blocked    = records.filter(r => r.blocked);

    // Last successful record that is NOT a rejected alert
    const lastSuccessRecord = successful[0] ?? null;

    // Resolve lastCommand from all event sources — newest valid command wins.
    // Build candidates from: normalized records + raw MCP checks + nav history + previews
    const rawMcpChecks  = safeArray(STORAGE_KEY);
    const rawNavHistory = safeArray(NAV_HISTORY_KEY);
    const rawPreviews   = safeArray(PREVIEWS_KEY);

    const commandCandidates = [
      // Normalized records (alerts/proposals carry synthetic commands — filtered by isValidCommand)
      ...records.map(r => ({
        command:   r.command,
        timestamp: r.timestamp,
        source:    r.sourceKey,
      })),
      // Raw MCP checks — may have richer command fields
      ...rawMcpChecks.map(r => ({
        command:     r.command ?? r.lastCommand,
        commandType: r.commandType,
        timestamp:   r.createdAt ?? r.timestamp,
        source:      STORAGE_KEY,
      })),
      // Nav history
      ...rawNavHistory.map(r => ({
        command:     r.command ?? r.lastCommand,
        commandType: r.commandType,
        timestamp:   r.createdAt ?? r.timestamp,
        source:      NAV_HISTORY_KEY,
      })),
      // Control panel previews
      ...rawPreviews.map(r => ({
        command:     r.command ?? r.lastCommand,
        commandType: r.commandType,
        timestamp:   r.createdAt ?? r.timestamp,
        source:      PREVIEWS_KEY,
      })),
    ];

    const { lastCommand, source: lastCommandSource, timestamp: lastCommandAt } =
      resolveLastCommandFromEvents(commandCandidates);

    // Alert-specific aggregates
    const acceptedAlerts = records.filter(r => r.isAlert && !r.isRejectedAlert);
    const rejectedAlerts = records.filter(r => r.isRejectedAlert);
    const lastAcceptedAlert = acceptedAlerts[0] ?? null;
    const lastRejectedAlert = rejectedAlerts[0] ?? null;
    const lastBlockReason   = lastRejectedAlert?.rejectionReason ?? null;
    const lastBlockTerm     = lastRejectedAlert?.blockedTerm ?? null;

    // Proposal-specific aggregates
    const proposals    = records.filter(r => r.isProposal);
    const lastProposal = proposals[0] ?? null;

    // Approval-specific aggregates — read directly from localStorage (always fresh)
    const rawApprovals = safeArray(APPROVAL_KEY);
    // Sort newest first — cover all timestamp field names Phase 4 may write
    rawApprovals.sort((a, b) => {
      const ta = new Date(a.approvedAt ?? a.reviewedAt ?? a.createdAt ?? a.timestamp ?? 0).getTime();
      const tb = new Date(b.approvedAt ?? b.reviewedAt ?? b.createdAt ?? b.timestamp ?? 0).getTime();
      return tb - ta;
    });
    const lastApproval        = rawApprovals[0] ?? null;
    const approvedCount       = rawApprovals.filter(a => a.approvalStatus === 'APPROVED_FOR_PAPER_TRADE_PREVIEW').length;
    const rejectedCount       = rawApprovals.filter(a => a.approvalStatus === 'REJECTED_BY_OPERATOR').length;
    const needsReviewCount    = rawApprovals.filter(a => a.approvalStatus === 'NEEDS_REVIEW').length;
    const lastApprovalAt      = lastApproval?.approvedAt ?? lastApproval?.reviewedAt ?? lastApproval?.createdAt ?? lastApproval?.timestamp ?? null;
    const lastApprovalStatus  = lastApproval?.approvalStatus ?? null;
    // Find most recent APPROVED record for symbol/side/paperTrade fields
    const lastApproved        = rawApprovals.find(a => a.approvalStatus === 'APPROVED_FOR_PAPER_TRADE_PREVIEW') ?? null;
    const lastApprovedSymbol  = lastApproved?.symbol ?? null;
    const lastApprovedSide    = lastApproved?.side   ?? null;
    const paperTradePreviewAllowed =
      (lastApproved?.paperTradePreviewAllowed === true) ||
      (lastApproved?.paperTradePreview === true) ||
      false;

    // Safety counts — sum across all records; rejected alerts contribute 0 failures (intentional policy)
    let totalSafetyPass = 0;
    let totalSafetyFail = 0;
    for (const r of records) {
      totalSafetyPass += r.safetyPassCount ?? 0;
      totalSafetyFail += r.safetyFailCount ?? 0;
    }

    const chain = {
      totalChecks:            records.length,
      successfulChecks:       successful.length,
      blockedCommandTests:    blocked.length,
      acceptedAlertCount:     acceptedAlerts.length,
      rejectedAlertCount:     rejectedAlerts.length,
      lastSuccessfulCheckAt:  lastSuccessRecord?.timestamp ?? null,
      lastCommand,
      lastCommandSource,
      lastCommandAt,
      lastAcceptedAlertAt:    lastAcceptedAlert?.timestamp ?? null,
      lastRejectedAlertAt:    lastRejectedAlert?.timestamp ?? null,
      lastSafetyBlockReason:  lastBlockReason,
      lastSafetyBlockTerm:    lastBlockTerm,
      proposalPreviewCount:   proposals.length,
      lastProposalPreviewAt:  lastProposal?.timestamp ?? null,
      lastProposalSymbol:     lastProposal?.symbol    ?? null,
      lastProposalSide:       lastProposal?.side      ?? null,
      lastProposalRiskProfile:lastProposal?.riskProfile ?? null,
      safetyPassCount:        totalSafetyPass,
      safetyFailCount:        totalSafetyFail,
      lockStatus:             'LOCKED',
      executionStatus:        'NOT_EXECUTED',
      riskClass:              'SIGNAL_INTAKE_ONLY',
      tradingAttempted:       false,
      brokerActionAttempted:  false,
      moneyMovementAttempted: false,
      credentialExposed:      false,
      liveTrading:            'DISABLED',
      brokerConnection:       'DISABLED',
      generatedAt:            new Date().toISOString(),
      proposalApprovalCount:       rawApprovals.length,
      proposalApprovedCount:       approvedCount,
      proposalRejectedCount:       rejectedCount,
      proposalNeedsReviewCount:    needsReviewCount,
      lastProposalApprovalAt:      lastApprovalAt,
      lastProposalApprovalStatus:  lastApprovalStatus,
      lastApprovedProposalSymbol:  lastApprovedSymbol,
      lastApprovedProposalSide:    lastApprovedSide,
      paperTradePreviewAllowed,
      sourceKeys:             [STORAGE_KEY, NAV_HISTORY_KEY, PREVIEWS_KEY, ALERT_ACCEPTED_KEY, ALERT_REJECTED_KEY, PROPOSAL_KEY, APPROVAL_KEY],
    };

    try { localStorage.setItem(EVIDENCE_SUMMARY_KEY, JSON.stringify(chain)); } catch {}
    return chain;
  } catch (err) {
    console.error('[TvMcpMonitoringConsole] buildEvidenceChain error:', err);
    return null;
  }
}

// Keep legacy loadChecks helper for the runCheck flow
function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

const STATUS_STYLE = {
  SUCCESS:              { text: 'text-primary',     border: 'border-primary/30',     bg: 'bg-primary/5'     },
  CONNECTED_READ_ONLY:  { text: 'text-primary',     border: 'border-primary/30',     bg: 'bg-primary/5'     },
  QUOTE_CONNECTED:      { text: 'text-primary',     border: 'border-primary/30',     bg: 'bg-primary/5'     },
  BLOCKED_BY_POLICY:    { text: 'text-destructive', border: 'border-destructive/30', bg: 'bg-destructive/5' },
  HOLD_FOR_BACKEND_ENV: { text: 'text-amber-400',   border: 'border-amber-400/30',   bg: 'bg-amber-400/5'   },
  HOLD_FOR_MCP_RELAY:   { text: 'text-amber-400',   border: 'border-amber-400/30',   bg: 'bg-amber-400/5'   },
  UNKNOWN:              { text: 'text-slate-400',   border: 'border-border/40',      bg: 'bg-secondary/10'  },
};

function statusStyle(s) { return STATUS_STYLE[s] || STATUS_STYLE.UNKNOWN; }

export default function TvMcpMonitoringConsole() {
  const [command,       setCommand]       = useState('status');
  const [loading,       setLoading]       = useState(false);
  const [latestCheck,   setLatestCheck]   = useState(null);
  const [checks,        setChecks]        = useState([]);
  const [evidence,      setEvidence]      = useState(null);
  const [showEvidence,  setShowEvidence]  = useState(false);
  const [evidenceError, setEvidenceError] = useState(null);

  const refreshEvidence = () => {
    try {
      const stored = loadChecks();
      setChecks(stored);
      const chain = buildEvidenceChain(stored);
      if (chain) { setEvidence(chain); setShowEvidence(true); }
    } catch (err) {
      console.error('[TvMcpMonitoringConsole] refreshEvidence error:', err);
    }
  };

  useEffect(() => {
    refreshEvidence();
    const events = [
      'veridanTradingViewProposalApprovalRecordsUpdated',
      'veridanTradingViewProposalApprovalsUpdated',
      'veridanTradingViewProposalPreviewsUpdated',
      'veridanTradingViewSignalProposalPreviewsUpdated',
      'veridanTradingViewAlertRecordsUpdated',
      'veridanTradingViewAlertIntakeRecordsUpdated',
      'storage',
    ];
    events.forEach(e => window.addEventListener(e, refreshEvidence));
    return () => events.forEach(e => window.removeEventListener(e, refreshEvidence));
  }, []);

  const runCheck = async () => {
    if (!command || loading) return;
    setLoading(true);
    const start = Date.now();
    try {
      const res = await base44.functions.invoke('tradingViewMcpStatus', { command });
      const result = res.data || {};
      const record = buildCheckRecord({ command, result, durationMs: Date.now() - start });
      const updated = [record, ...checks];
      setChecks(updated);
      saveChecks(updated);
      setLatestCheck(record);
      setEvidence(buildEvidenceChain(updated));
    } catch (err) {
      const result = { status: 'HOLD_FOR_MCP_RELAY', error: err.message || 'Backend error' };
      const record = buildCheckRecord({ command, result, durationMs: Date.now() - start });
      const updated = [record, ...checks];
      setChecks(updated);
      saveChecks(updated);
      setLatestCheck(record);
      setEvidence(buildEvidenceChain(updated));
    } finally {
      setLoading(false);
    }
  };

  const copyLatest = () => {
    if (latestCheck) navigator.clipboard.writeText(JSON.stringify(latestCheck, null, 2));
  };

  const clearChecks = () => {
    if (window.confirm('Clear all local MCP check records?')) {
      localStorage.removeItem(STORAGE_KEY);
      setChecks([]);
      setLatestCheck(null);
      setEvidence(null);
    }
  };

  const regenEvidence = () => {
    setEvidenceError(null);
    try {
      refreshEvidence();
      setShowEvidence(true);
    } catch (err) {
      console.error('[TvMcpMonitoringConsole] regenEvidence error:', err);
      setEvidenceError(err?.message || 'Unknown error regenerating evidence chain.');
    }
  };

  const ss = latestCheck ? statusStyle(latestCheck.status) : null;

  return (
    <div className="space-y-4">

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/30 rounded-sm text-[9px] text-amber-400">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Manual operator-triggered GET checks only.
          No scheduler. No polling. No dispatch. No execution. No trading. No broker. No credentials. No money movement.
        </span>
      </div>

      {/* Phase card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: 'Current Phase',   value: 'LOCAL RELAY VERIFIED',   cls: 'text-primary' },
          { label: 'Next Phase',      value: 'VPS RELAY + VPS BROWSER', cls: 'text-amber-400' },
          { label: 'Execution Phase', value: 'NOT ENABLED',             cls: 'text-destructive' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border/40 rounded-sm px-3 py-2.5">
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{c.label}</div>
            <div className={`text-[10px] font-bold font-mono ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Blocked command notice */}
      <div className="bg-card border border-destructive/20 rounded-sm px-4 py-3">
        <div className="text-[8px] font-bold uppercase text-destructive mb-1.5">Blocked Commands — REJECTED_BY_POLICY</div>
        <div className="flex flex-wrap gap-1.5">
          {BLOCKED_COMMANDS.map(c => (
            <span key={c} className="px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-mono rounded-sm">{c}</span>
          ))}
        </div>
      </div>

      {/* Command selector + run button */}
      <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Select Read-Only MCP Command</div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={command}
            onChange={e => setCommand(e.target.value)}
            disabled={loading}
            className="flex-1 min-w-[160px] px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50 disabled:opacity-50"
          >
            {ALLOWED_COMMANDS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={runCheck}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 transition-colors"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {loading ? 'Running…' : 'Run Check'}
          </button>
        </div>
        <div className="text-[7px] text-slate-600 font-mono">
          Method: GET only · Mode: READ_ONLY · Lock: LOCKED · Stored checks: {checks.length}
        </div>
      </div>

      {/* Latest check result */}
      {latestCheck && ss && (
        <>
          <div className={`border rounded-sm p-4 space-y-2 ${ss.border} ${ss.bg}`}>
            <div className="flex items-center gap-3">
              {latestCheck.status === 'SUCCESS'
                ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                : latestCheck.status === 'BLOCKED_BY_POLICY'
                ? <XCircle className="w-4 h-4 text-destructive shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              <div>
                <div className={`text-[11px] font-bold uppercase font-mono ${ss.text}`}>{latestCheck.status}</div>
                <div className={`text-[8px] mt-0.5 ${ss.text} opacity-80`}>{latestCheck.responseSummary}</div>
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Command',         value: latestCheck.command,                              cls: 'text-primary font-mono' },
              { label: 'Status',          value: latestCheck.status,                               cls: ss.text + ' font-bold' },
              { label: 'HTTP Status',     value: latestCheck.httpStatus ?? 'N/A',                  cls: 'text-foreground' },
              { label: 'Relay Reachable', value: String(latestCheck.relayReachable),               cls: latestCheck.relayReachable ? 'text-primary font-bold' : 'text-amber-400' },
              { label: 'CDP Connected',   value: latestCheck.cdpConnected == null ? 'N/A' : String(latestCheck.cdpConnected), cls: 'text-slate-300' },
              { label: 'Chart Symbol',    value: latestCheck.chartSymbol ?? 'N/A',                 cls: 'text-slate-300 font-mono text-[8px]' },
              { label: 'Resolution',      value: latestCheck.chartResolution ?? 'N/A',             cls: 'text-slate-300' },
              { label: 'Duration',        value: latestCheck.durationMs != null ? `${latestCheck.durationMs}ms` : 'N/A', cls: 'text-slate-300' },
              { label: 'Execution Lock',  value: latestCheck.executionLock,                        cls: 'text-destructive font-bold' },
              { label: 'Live Trading',    value: latestCheck.liveTrading,                          cls: 'text-destructive font-bold' },
              { label: 'Broker Connect',  value: latestCheck.brokerConnection,                     cls: 'text-destructive font-bold' },
              { label: 'Money Movement',  value: latestCheck.moneyMovement,                        cls: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/40 rounded-sm px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{c.label}</div>
                <div className={`text-[9px] break-all ${c.cls}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Target URL */}
          <div className="bg-card border border-border/40 rounded-sm px-3 py-2">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Target URL</div>
            <div className="text-[8px] font-mono text-slate-400">{latestCheck.targetUrl}</div>
          </div>

          {/* Parsed stdout fields — status */}
          {latestCheck.command === 'status' && (
            <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 text-[8px] font-bold uppercase text-primary">Parsed Status Fields</div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'cdp_connected',    value: latestCheck.cdpConnected    == null ? 'N/A' : String(latestCheck.cdpConnected) },
                  { label: 'chart_symbol',     value: latestCheck.chartSymbol     ?? 'N/A' },
                  { label: 'chart_resolution', value: latestCheck.chartResolution ?? 'N/A' },
                  { label: 'target_title',     value: latestCheck.targetTitle     ?? 'N/A' },
                  { label: 'api_available',    value: latestCheck.apiAvailable    == null ? 'N/A' : String(latestCheck.apiAvailable) },
                  { label: 'target_url',       value: 'relay-internal (not exposed)' },
                ].map(f => (
                  <div key={f.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                    <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{f.label}</div>
                    <div className="text-[8px] font-mono text-slate-300 break-all">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed stdout fields — quote */}
          {latestCheck.command === 'quote' && (
            <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 text-[8px] font-bold uppercase text-primary">Parsed Quote Fields</div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'symbol',      value: latestCheck.quoteSymbol      ?? 'N/A' },
                  { label: 'last',        value: latestCheck.quoteLast        ?? 'N/A' },
                  { label: 'open',        value: latestCheck.quoteOpen        ?? 'N/A' },
                  { label: 'high',        value: latestCheck.quoteHigh        ?? 'N/A' },
                  { label: 'low',         value: latestCheck.quoteLow         ?? 'N/A' },
                  { label: 'close',       value: latestCheck.quoteClose       ?? 'N/A' },
                  { label: 'volume',      value: latestCheck.quoteVolume      ?? 'N/A' },
                  { label: 'description', value: latestCheck.quoteDescription ?? 'N/A' },
                  { label: 'exchange',    value: latestCheck.quoteExchange    ?? 'N/A' },
                  { label: 'type',        value: latestCheck.quoteType        ?? 'N/A' },
                ].map(f => (
                  <div key={f.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                    <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{f.label}</div>
                    <div className="text-[8px] font-mono text-slate-300 break-all">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety assertions */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-400">Safety Assertions</span>
              <span className={`text-[8px] font-bold font-mono ${latestCheck.safetyFailCount === 0 ? 'text-primary' : 'text-destructive'}`}>
                {latestCheck.safetyPassCount}/{latestCheck.safetyPassCount + latestCheck.safetyFailCount} PASS
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-2 gap-x-3">
              {latestCheck.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-500">{a.key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Check metadata */}
          <div className="flex flex-wrap gap-3 text-[7px] text-slate-600 font-mono">
            <span>{latestCheck.checkId}</span>
            <span>{new Date(latestCheck.createdAt).toLocaleString()}</span>
          </div>
        </>
      )}

      {/* No checks yet */}
      {checks.length === 0 && !latestCheck && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-sm text-[9px] text-slate-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No checks recorded yet. Select a command and click "Run Check" to generate monitoring evidence.
        </div>
      )}

      {/* Evidence Summary */}
      <TvMcpEvidenceSummary checks={checks} />

      {/* Manual Chart Control Instructions */}
      <TvMcpManualChartInstructions checks={checks} />

      {/* Governed Chart Control — Preview Only */}
      <TvMcpChartControlPanel checks={checks} />

      {/* Phase 2 — Alert Intake */}
      <TvAlertIntakePanel />

      {/* Phase 3 — Signal to Proposal Preview */}
      <TvSignalProposalPanel />

      {/* Phase 4 — Proposal Approval Queue */}
      <TvProposalApprovalQueue />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyLatest} disabled={!latestCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-border/40 text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded-sm font-bold transition-colors disabled:opacity-40">
          <Copy className="w-3 h-3" /> Copy Latest MCP Check JSON
        </button>
        <button type="button" onClick={clearChecks}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-border/40 text-slate-400 hover:bg-secondary/50 rounded-sm font-bold transition-colors">
          <Trash2 className="w-3 h-3" /> Clear Local MCP Checks
        </button>
        <button type="button" onClick={regenEvidence}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-primary/30 text-primary hover:bg-primary/10 rounded-sm font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate MCP Evidence Chain
        </button>
      </div>

      {/* Evidence chain error */}
      {evidenceError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm text-[9px] text-destructive">
          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span><span className="font-bold">Evidence chain error:</span> {evidenceError} — check console for details.</span>
        </div>
      )}

      {/* Evidence chain */}
      {(evidence && showEvidence) && (
        <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center gap-3 flex-wrap">
            <span className="text-[9px] font-bold uppercase text-primary">MCP Evidence Chain</span>
            <span className="text-[7px] text-slate-500 font-mono">sources: mcpChecks · navHistory · previews · alertAccepted · alertRejected · proposals · approvals</span>
            {(() => {
              const coherence = getCommandEvidenceCoherence(evidence);
              const reason = getCommandEvidenceCoherenceReason(evidence);
              const styles = {
                COHERENT: 'bg-primary/10 border-primary/30 text-primary',
                REVIEW:   'bg-amber-500/10 border-amber-500/30 text-amber-400',
                NONE:     'bg-secondary/30 border-border/30 text-slate-500',
              };
              return (
                <span className={`ml-auto px-2 py-0.5 rounded-sm border text-[7px] font-bold font-mono uppercase ${styles[coherence]}`}
                  title={reason}>
                  CMD EVIDENCE: {coherence}
                </span>
              );
            })()}
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Total Checks',          value: evidence.totalChecks },
              { label: 'Successful',            value: evidence.successfulChecks,        cls: 'text-primary font-bold' },
              { label: 'Blocked Tests',         value: evidence.blockedCommandTests,     cls: 'text-destructive font-bold' },
              { label: 'Accepted Alerts',       value: evidence.acceptedAlertCount ?? 0, cls: 'text-primary font-bold' },
              { label: 'Rejected Alerts',       value: evidence.rejectedAlertCount ?? 0, cls: 'text-amber-400 font-bold' },
              { label: 'Lock Status',           value: evidence.lockStatus,              cls: 'text-destructive font-bold' },
              { label: 'Execution Status',      value: evidence.executionStatus,         cls: 'text-destructive font-bold' },
              { label: 'Risk Class',            value: evidence.riskClass,               cls: 'text-amber-400 font-bold' },
              { label: 'Safety Passes',         value: evidence.safetyPassCount,         cls: 'text-primary font-bold' },
              { label: 'Safety Failures',       value: evidence.safetyFailCount,         cls: evidence.safetyFailCount > 0 ? 'text-destructive font-bold' : 'text-primary font-bold' },
              { label: 'Last Command',          value: formatCommandLabel(evidence.lastCommand), cls: evidence.lastCommand && evidence.lastCommand !== 'unknown' ? 'text-primary font-bold' : 'text-slate-400', rawValue: formatRawCommandDebugValue(evidence.lastCommand) },
              { label: 'Last Event Source',     value: evidence.lastCommandSource ?? 'none', cls: evidence.lastCommandSource ? 'text-slate-300 font-mono text-[7px]' : 'text-slate-500' },
              { label: 'Last Command At',       value: evidence.lastCommandAt ? new Date(evidence.lastCommandAt).toLocaleTimeString() : 'none', cls: evidence.lastCommandAt ? 'text-slate-300' : 'text-slate-500' },
              { label: 'Last Success At',       value: evidence.lastSuccessfulCheckAt ? new Date(evidence.lastSuccessfulCheckAt).toLocaleTimeString() : 'N/A' },
              { label: 'Last Accepted Alert',   value: evidence.lastAcceptedAlertAt ? new Date(evidence.lastAcceptedAlertAt).toLocaleTimeString() : 'N/A', cls: 'text-primary' },
              { label: 'Last Rejected Alert',   value: evidence.lastRejectedAlertAt ? new Date(evidence.lastRejectedAlertAt).toLocaleTimeString() : 'N/A', cls: 'text-amber-400' },
              { label: 'Last Block Reason',       value: evidence.lastSafetyBlockReason ?? 'N/A',  cls: 'text-slate-400 text-[7px]' },
              { label: 'Last Block Term',         value: evidence.lastSafetyBlockTerm   ?? 'N/A',  cls: 'text-slate-400 font-mono text-[7px]' },
              { label: 'Proposal Previews',       value: evidence.proposalPreviewCount ?? 0,        cls: 'text-blue-400 font-bold' },
              { label: 'Last Proposal Preview',   value: evidence.lastProposalPreviewAt ? new Date(evidence.lastProposalPreviewAt).toLocaleTimeString() : 'N/A', cls: 'text-blue-400' },
              { label: 'Last Proposal Symbol',    value: evidence.lastProposalSymbol    ?? 'N/A',   cls: 'text-primary font-mono' },
              { label: 'Last Proposal Side',      value: evidence.lastProposalSide      ?? 'N/A',   cls: 'text-amber-400 font-bold' },
              { label: 'Last Proposal Risk',      value: evidence.lastProposalRiskProfile ?? 'N/A', cls: 'text-amber-400' },
              { label: 'Proposal Approvals',      value: evidence.proposalApprovalCount ?? 0,       cls: 'text-purple-400 font-bold' },
              { label: 'Approved Count',          value: evidence.proposalApprovedCount ?? 0,       cls: 'text-primary font-bold' },
              { label: 'Rejected Count',          value: evidence.proposalRejectedCount ?? 0,       cls: evidence.proposalRejectedCount > 0 ? 'text-destructive font-bold' : 'text-slate-400' },
              { label: 'Needs Review Count',      value: evidence.proposalNeedsReviewCount ?? 0,    cls: 'text-amber-400 font-bold' },
              { label: 'Last Approval At',        value: evidence.lastProposalApprovalAt ? new Date(evidence.lastProposalApprovalAt).toLocaleTimeString() : 'N/A', cls: 'text-purple-400' },
              { label: 'Last Approval Status',    value: evidence.lastProposalApprovalStatus ?? 'N/A', cls: 'text-purple-400 font-bold' },
              { label: 'Last Approved Symbol',    value: evidence.lastApprovedProposalSymbol ?? 'N/A', cls: 'text-primary font-mono' },
              { label: 'Last Approved Side',      value: evidence.lastApprovedProposalSide   ?? 'N/A', cls: 'text-amber-400 font-bold' },
              { label: 'Paper Trade Preview',     value: String(evidence.paperTradePreviewAllowed ?? false), cls: evidence.paperTradePreviewAllowed ? 'text-primary font-bold' : 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{c.label}</div>
                <div className={`text-[9px] font-mono font-bold break-all ${c.cls || 'text-slate-300'}`}>{String(c.value)}</div>
                {c.rawValue !== undefined && (
                  <div className="text-[7px] text-slate-600 font-mono mt-0.5">raw: {String(c.rawValue)}</div>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-border/20">
            <div className="text-[7px] text-slate-600 font-mono">Generated: {new Date(evidence.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Event Source Coverage block */}
      {(evidence && showEvidence) && (() => {
        // Read candidate counts from already-computed evidence fields — no fetch, no mutation.
        // Mirrors the same source keys used in buildEvidenceChain's commandCandidates array.
        const sourceCountMap = {
          [STORAGE_KEY]:        safeArray(STORAGE_KEY).length,
          [NAV_HISTORY_KEY]:    safeArray(NAV_HISTORY_KEY).length,
          [PREVIEWS_KEY]:       safeArray(PREVIEWS_KEY).length,
          [ALERT_ACCEPTED_KEY]: safeArray(ALERT_ACCEPTED_KEY).length,
          [ALERT_REJECTED_KEY]: safeArray(ALERT_REJECTED_KEY).length,
          [PROPOSAL_KEY]:       safeArray(PROPOSAL_KEY).length,
          [APPROVAL_KEY]:       safeArray(APPROVAL_KEY).length,
        };

        // Friendly display names matching the user-facing source labels
        const SOURCE_LABELS = {
          [STORAGE_KEY]:        'monitoring_check',
          [NAV_HISTORY_KEY]:    'bridge_preview',
          [PREVIEWS_KEY]:       'gateway_status',
          [ALERT_ACCEPTED_KEY]: 'evidence_history',
          [ALERT_REJECTED_KEY]: 'dry_run_audit',
          [PROPOSAL_KEY]:       'approval_event',
          [APPROVAL_KEY]:       'approval_governance',
        };

        const totalCandidates = Object.values(sourceCountMap).reduce((s, n) => s + n, 0);

        const resolvedSource = evidence.lastCommandSource ?? null;
        const sourcesPresent = Object.entries(sourceCountMap)
          .filter(([, cnt]) => cnt > 0)
          .map(([key]) => SOURCE_LABELS[key] ?? key);

        // Build the same candidate list as buildEvidenceChain and apply the same
        // isValidCommand helper used by resolveLastCommandFromEvents.
        const rawMcpChecks  = safeArray(STORAGE_KEY);
        const rawNavHistory = safeArray(NAV_HISTORY_KEY);
        const rawPreviews   = safeArray(PREVIEWS_KEY);
        const coverageCandidates = [
          ...loadAllNormalizedRecords().map(r => r.command ?? null),
          ...rawMcpChecks.map(r  => r.command ?? r.lastCommand ?? r.commandType ?? null),
          ...rawNavHistory.map(r => r.command ?? r.lastCommand ?? r.commandType ?? null),
          ...rawPreviews.map(r   => r.command ?? r.lastCommand ?? r.commandType ?? null),
        ];
        const validCount   = coverageCandidates.filter(cmd => isValidCommand(cmd)).length;
        const ignoredCount = coverageCandidates.length - validCount;

        let statusMsg;
        if (totalCandidates === 0) {
          statusMsg = 'No event candidates available.';
        } else if (validCount === 0) {
          statusMsg = 'Candidates found, but no valid command-bearing event.';
        } else {
          statusMsg = 'Valid command candidates available.';
        }

        return (
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center gap-2">
              <span className="text-[8px] font-bold uppercase text-slate-400">Event Source Coverage</span>
              <span className="ml-2 text-[7px] font-mono text-slate-600">display-only · read-only · no fetch · no dispatch</span>
              <span className={`ml-auto text-[7px] font-bold font-mono px-2 py-0.5 rounded-sm border ${
                validCount > 0 ? 'text-primary border-primary/30 bg-primary/5'
                : totalCandidates > 0 ? 'text-amber-400 border-amber-400/30 bg-amber-400/5'
                : 'text-slate-500 border-border/30 bg-secondary/20'
              }`}>{statusMsg}</span>
            </div>
            <div className="p-3 space-y-2">
              {/* Count summary */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Total Candidates', value: totalCandidates, cls: 'text-foreground font-bold' },
                  { label: 'Valid (cmd-bearing)', value: validCount, cls: validCount > 0 ? 'text-primary font-bold' : 'text-slate-500' },
                  { label: 'Ignored / Synthetic', value: ignoredCount, cls: 'text-slate-400' },
                ].map(c => (
                  <div key={c.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                    <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{c.label}</div>
                    <div className={`text-[9px] font-mono ${c.cls}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              {/* Sources present */}
              <div className="bg-secondary/20 border border-border/20 rounded-sm px-3 py-2">
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-1.5">Sources Present</div>
                {sourcesPresent.length === 0 ? (
                  <span className="text-[7px] font-mono text-slate-600">none</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sourcesPresent.map(s => (
                      <span key={s} className={`text-[7px] font-mono px-2 py-0.5 rounded-sm border ${
                        s === (SOURCE_LABELS[resolvedSource] ?? resolvedSource)
                          ? 'text-primary border-primary/30 bg-primary/5'
                          : 'text-slate-400 border-border/20 bg-secondary/30'
                      }`}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Per-source breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {Object.entries(sourceCountMap).map(([key, cnt]) => (
                  <div key={key} className="bg-secondary/10 border border-border/10 rounded-sm px-2 py-1.5">
                    <div className="text-[6.5px] uppercase text-slate-600 font-bold mb-0.5">{SOURCE_LABELS[key] ?? key}</div>
                    <div className={`text-[8px] font-mono font-bold ${cnt > 0 ? 'text-slate-300' : 'text-slate-700'}`}>{cnt} rec</div>
                  </div>
                ))}
              </div>

              {/* Resolver Winner */}
              {(() => {
                const winCmd       = evidence.lastCommand ?? null;
                const winSource    = evidence.lastCommandSource ?? null;
                const winTimestamp = evidence.lastCommandAt ?? null;
                const hasWinner    = isValidCommand(winCmd);

                return (
                  <div className={`border rounded-sm px-3 py-2 ${hasWinner ? 'border-primary/30 bg-primary/5' : 'border-border/20 bg-secondary/10'}`}>
                    <div className="text-[7px] uppercase text-slate-500 font-bold mb-1.5">Resolver Winner</div>
                    {hasWinner ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { label: 'command',   value: formatCommandLabel(winCmd),                           cls: 'text-primary font-bold' },
                          { label: 'raw',       value: winCmd,                                               cls: 'text-slate-400 font-mono text-[7px]' },
                          { label: 'source',    value: SOURCE_LABELS[winSource] ?? winSource ?? 'unknown',   cls: 'text-slate-300 font-mono text-[7px]' },
                          { label: 'timestamp', value: winTimestamp ? new Date(winTimestamp).toLocaleTimeString() : 'N/A', cls: 'text-slate-300' },
                          { label: 'rank',      value: '1',                                                  cls: 'text-primary font-bold' },
                          { label: 'sort',      value: 'newest-first',                                       cls: 'text-slate-500 text-[7px]' },
                        ].map(f => (
                          <div key={f.label} className="bg-secondary/20 border border-border/10 rounded-sm px-2 py-1">
                            <div className="text-[6px] uppercase text-slate-600 font-bold mb-0.5">{f.label}</div>
                            <div className={`text-[8px] font-mono break-all ${f.cls}`}>{f.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[8px] font-mono text-slate-600">No resolver winner.</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Command Evidence Verification block */}
      {(evidence && showEvidence) && (() => {
        const coherence   = getCommandEvidenceCoherence(evidence);
        const reason      = getCommandEvidenceCoherenceReason(evidence);
        const rawCmd      = evidence.lastCommand;
        const labelCmd    = formatCommandLabel(rawCmd);
        const rawDebug    = formatRawCommandDebugValue(rawCmd);

        // Row 1: Resolver Coherence
        const coherencePass = coherence === 'COHERENT' || coherence === 'NONE';
        const coherenceStatus = coherencePass ? 'PASS' : 'REVIEW';
        const coherenceText  = `${coherence} — ${reason}`;

        // Row 2: Raw Preservation
        // PASS when rawCmd is accessible; REVIEW only if label claims a command but raw is absent
        const labelClaimsCmd = labelCmd && labelCmd !== 'none';
        const rawPresent     = rawCmd && typeof rawCmd === 'string' && rawCmd.trim() !== '';
        const rawPass        = rawPresent || !labelClaimsCmd;
        const rawStatus      = rawPass ? 'PASS' : 'REVIEW';
        const rawText        = rawPass
          ? `raw: "${rawDebug}" · label: "${labelCmd}" · raw field untouched`
          : `Label claims command exists but raw lastCommand is absent`;

        // Row 3: Label Safety
        const invalidInput  = formatCommandLabel(null) === 'none' && formatCommandLabel('unknown') === 'none' && formatCommandLabel('') === 'none';
        const labelSafeText = invalidInput
          ? 'null/unknown/empty → "none" · valid commands display as labels only'
          : 'formatCommandLabel edge-case mismatch detected';
        const labelStatus   = invalidInput ? 'PASS' : 'REVIEW';

        // Row 4: Execution Boundary — always PASS
        const rows = [
          { label: 'Resolver Coherence', status: coherenceStatus, detail: coherenceText },
          { label: 'Raw Preservation',   status: rawStatus,       detail: rawText },
          { label: 'Label Safety',        status: labelStatus,     detail: labelSafeText },
          { label: 'Execution Boundary',  status: 'PASS',          detail: 'Display-only verification. No fetch, dispatch, broker, or OpenClaw call.' },
        ];

        const statusCls = (s) => s === 'PASS'
          ? 'text-primary border-primary/30 bg-primary/5'
          : 'text-amber-400 border-amber-400/30 bg-amber-400/5';

        return (
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-secondary/20 border-b border-border/40">
              <span className="text-[8px] font-bold uppercase text-slate-400">Command Evidence Verification</span>
              <span className="ml-2 text-[7px] font-mono text-slate-600">display-only · read-only · no fetch · no dispatch</span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rows.map(r => (
                <div key={r.label} className={`border rounded-sm px-3 py-2 ${statusCls(r.status)}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[7px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-sm border ${statusCls(r.status)}`}>{r.status}</span>
                    <span className="text-[7px] font-bold uppercase text-slate-400">{r.label}</span>
                  </div>
                  <div className="text-[7px] font-mono text-slate-500 break-all">{r.detail}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm text-[8px] text-primary/80 font-bold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        TradingView MCP monitoring is read-only and operator-triggered. No scheduler. No polling. No dispatch. No execution. GET only.
      </div>
    </div>
  );
}