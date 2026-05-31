/**
 * obsidianWriteApprovedDraft
 * Narrow, governed vault write connector.
 *
 * Safety boundaries (enforced server-side — never trust frontend):
 * - Accepts only: create_note, update_note, append_note
 * - Folder must be in hardcoded APPROVED_FOLDERS allowlist
 * - Path traversal, absolute paths, encoded traversal blocked
 * - Only .md extensions allowed
 * - Secret/credential content patterns blocked
 * - safetySummary flags re-checked server-side
 * - No InvokeLLM · No OpenClaw · No browser automation · No trading
 * - No generic filesystem access · No credential storage
 * - If VERIDAN_OBSIDIAN_BRIDGE_URL is not configured → returns BACKEND_WRITE_BRIDGE_NOT_CONNECTED, no fake success
 * - Audit record written to VeridanObsidianWriteAudit only after confirmed bridge success
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Allowlist (must match frontend exactly) ───────────────────────────────────

const APPROVED_FOLDERS = [
  'drafts',
  'task-plans',
  'approval-queues',
  'audit-logs',
  'governance',
  'evidence',
  'Veridan Core/Veridan Core System',
  'Veridan Core/OpenClaw',
  'Veridan Core/Trading',
  'Veridan Core/Credit',
  'Veridan Core/Business Formation',
  'Veridan Core/Trust / Entities',
  'Veridan Core/SOPs',
  'Veridan Core/Daily Operations',
  'Veridan Core/Audit Evidence',
  'Veridan Core/Governance',
  'Veridan Core/System Map',
];

const SUPPORTED_ACTIONS = ['create_note', 'update_note', 'append_note'];

// ── Secret/credential content patterns ───────────────────────────────────────

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i,
  /password\s*[:=]\s*\S+/i,
  /api[_-]?key\s*[:=]\s*\S+/i,
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/i,
  /secret\s*[:=]\s*\S+/i,
  /access[_-]?token\s*[:=]\s*\S+/i,
  /refresh[_-]?token\s*[:=]\s*\S+/i,
  /mnemonic|seed phrase|recovery phrase/i,
  /private[_-]?key\s*[:=]/i,
  /Authorization:\s*Bearer/i,
];

// ── Server-side validation ────────────────────────────────────────────────────

function validateRequest(body) {
  const errors = [];

  // Support both proposal-shape (from VaultWriteExecutionPanel) and draft-shape (from CoreVaultPackWorkflow / SafeTestWritePanel)
  // Proposal shape: { proposal: {...} }
  // Draft shape: { draft: {...}, operatorApproval?: boolean }
  const proposal = body.proposal || null;
  const draft = body.draft || null;

  if (proposal) {
    return validateProposalShape(proposal, errors);
  } else if (draft) {
    // Enforce operatorApproval gate when present
    if (body.operatorApproval === false) {
      errors.push('OPERATOR_APPROVAL_REQUIRED: operatorApproval must be true');
      return { errors, normalized: null };
    }
    return validateDraftShape(draft, errors);
  } else {
    errors.push('REQUEST_INVALID: must provide either "proposal" or "draft" in request body');
    return { errors, normalized: null };
  }
}

function validateProposalShape(p, errors) {
  if (!p.proposalId) errors.push('PROPOSAL_INVALID: proposalId is required');
  if (!SUPPORTED_ACTIONS.includes(p.action)) {
    errors.push(`ACTION_INVALID: "${p.action}" not in [${SUPPORTED_ACTIONS.join(', ')}]`);
  }
  if (!p.validationStatus || !['PASS', 'WARN'].includes(p.validationStatus)) {
    errors.push(`VALIDATION_STATUS_REJECTED: "${p.validationStatus}" — only PASS or WARN proposals may be executed`);
  }

  const folder = (p.allowlistedFolder || '').trim();
  if (!folder || !APPROVED_FOLDERS.includes(folder)) {
    errors.push(`FOLDER_NOT_ALLOWLISTED: "${folder}" is not in the approved folder list`);
  }

  const normalizedPath = (p.normalizedPath || '').trim();
  validatePath(normalizedPath, errors);

  const relativePath = (p.relativePath || '').trim();
  const expectedPath = folder && relativePath ? `${folder}/${relativePath.replace(/^\/+/, '')}` : null;
  if (expectedPath && normalizedPath && normalizedPath !== expectedPath) {
    errors.push(`PATH_MISMATCH: normalizedPath "${normalizedPath}" does not match folder+relativePath "${expectedPath}"`);
  }

  const content = p.proposedContent || '';
  if (typeof content !== 'string') errors.push('CONTENT_INVALID: proposedContent must be a string');
  validateContent(content, errors);

  // Re-check safetySummary flags
  const ss = p.safetySummary || {};
  if (ss.noCredentials === false) errors.push('SAFETY_FLAG_VIOLATION: safetySummary.noCredentials is false');
  if (ss.noOpenClawDispatch === false) errors.push('SAFETY_FLAG_VIOLATION: safetySummary.noOpenClawDispatch is false');
  if (ss.noInvokeLLM === false) errors.push('SAFETY_FLAG_VIOLATION: safetySummary.noInvokeLLM is false');
  if (ss.noBrowserAutomation === false) errors.push('SAFETY_FLAG_VIOLATION: safetySummary.noBrowserAutomation is false');

  if (errors.length > 0) return { errors, normalized: null };

  return {
    errors,
    normalized: {
      proposalId: p.proposalId,
      action: p.action,
      folder,
      normalizedPath,
      relativePath,
      content,
      appendMode: p.appendMode || false,
      source: 'PROPOSAL_SHAPE',
    },
  };
}

function validateDraftShape(d, errors) {
  // Normalize fileName → filename (VPS sends fileName, legacy sends filename)
  if (!d.filename && d.fileName) d.filename = d.fileName;

  // SAFE_TEST_WRITE source skips approvalStatus check (operatorApproval gate used instead)
  if (d.source !== 'SAFE_TEST_WRITE' && d.approvalStatus !== 'APPROVED') {
    errors.push(`APPROVAL_REQUIRED: approvalStatus is "${d.approvalStatus}", must be APPROVED`);
  }
  if (d.riskLevel !== 'LOW') {
    errors.push(`RISK_LEVEL_TOO_HIGH: riskLevel is "${d.riskLevel}", only LOW is allowed`);
  }
  if (d.executionStatus !== 'NOT_EXECUTED') {
    errors.push(`ALREADY_EXECUTED: executionStatus is "${d.executionStatus}"`);
  }

  const ALLOWED_DRAFT_TYPES = [
    'MANUAL_MARKDOWN', 'MANUAL_LOCAL_DRAFT',
    'TEMPLATE_OPENCLAW_SOP', 'TEMPLATE_DAILY_OPS_SOP', 'TEMPLATE_TRADING_SOP',
    'TEMPLATE_CREDIT_SOP', 'TEMPLATE_TRUST_ENTITY_SOP', 'TEMPLATE_SYSTEM_GOVERNANCE',
    'TEMPLATE_AUDIT_EVIDENCE', 'TEMPLATE_DRAFT', 'BATCH_TEMPLATE_DRAFT',
    'CVP_SYSTEM_OVERVIEW', 'CVP_OPENCLAW_SOP', 'CVP_DAILY_OPS_SOP',
    'CVP_TRADING_SOP', 'CVP_CREDIT_SOP', 'CVP_TRUST_ENTITY_SOP',
    'CVP_AUDIT_EVIDENCE_SOP', 'CVP_VAULT_FOLDER_MAP', 'CVP_SAFETY_BOUNDARY_RULES',
    'CVP_APPROVAL_WORKFLOW', 'CORE_VAULT_PACK',
    'VAULT_BRIDGE_CREATE_NOTE', 'VAULT_BRIDGE_UPDATE_NOTE', 'VAULT_BRIDGE_APPEND_NOTE',
    'task_plan', 'approval_queue', 'audit_log', 'governance_doc',
  ];
  if (!d.draftType || !ALLOWED_DRAFT_TYPES.includes(d.draftType)) {
    errors.push(`DRAFT_TYPE_NOT_ALLOWED: "${d.draftType}"`);
  }

  const folder = (d.targetFolder || '').trim();
  if (!folder || !APPROVED_FOLDERS.includes(folder)) {
    errors.push(`FOLDER_NOT_ALLOWLISTED: "${folder}"`);
  }

  const filename = (d.filename || '').trim();
  if (!filename) {
    errors.push('FILENAME_INVALID: filename is missing or empty');
  } else {
    validatePath(filename, errors);
  }

  const content = d.content || '';
  if (!content || typeof content !== 'string' || content.trim() === '') {
    errors.push('CONTENT_EMPTY: content is missing or empty');
  }
  validateContent(content, errors);

  if (errors.length > 0) return { errors, normalized: null };

  const normalizedPath = `${folder}/${filename}`;
  return {
    errors,
    normalized: {
      proposalId: d.draftId || `DRAFT-${Date.now().toString(36).toUpperCase()}`,
      action: 'create_note',
      folder,
      normalizedPath,
      relativePath: filename,
      content,
      appendMode: false,
      source: 'DRAFT_SHAPE',
    },
  };
}

function validatePath(path, errors) {
  if (!path) { errors.push('PATH_INVALID: path is missing'); return; }
  // Absolute paths
  if (/^[/\\]/.test(path) || /^[A-Za-z]:/.test(path) || /^file:\/\//i.test(path) || /^~/.test(path)) {
    errors.push(`PATH_INVALID: absolute path not permitted: "${path}"`);
  }
  // Traversal
  if (/\.\.[/\\]/.test(path) || /\.\.\//.test(path) || /\.\.$/.test(path) || /%2e%2e/i.test(path) || /%252e/i.test(path) || /\/\//.test(path)) {
    errors.push(`PATH_INVALID: path traversal detected: "${path}"`);
  }
  // Must end in .md
  if (!path.endsWith('.md') && !path.endsWith('.markdown')) {
    errors.push(`PATH_INVALID: only .md files permitted, got: "${path}"`);
  }
}

function validateContent(content, errors) {
  if (content && content.length > 1_000_000) {
    errors.push('CONTENT_TOO_LARGE: content exceeds 1MB limit');
  }
  if (content && SECRET_PATTERNS.some(p => p.test(content))) {
    errors.push('CONTENT_REJECTED: content appears to contain a secret, API key, token, or credential');
  }
}

// ── Simple non-cryptographic hash for audit trail ─────────────────────────────

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 10000); i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);

  // Auth check
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── Server-side validation ────────────────────────────────────────────────
  const { errors, normalized } = validateRequest(body);

  if (errors.length > 0) {
    return Response.json({
      success: false,
      status: 'BLOCKED_VALIDATION',
      backendWriteStatus: 'BLOCKED_VALIDATION',
      message: 'Server-side validation failed. No vault write occurred.',
      errors,
    }, { status: 400 });
  }

  // ── Bridge URL check ──────────────────────────────────────────────────────
  const bridgeUrl = (Deno.env.get('VERIDAN_OBSIDIAN_BRIDGE_URL') || '').trim();
  const bridgeConfigured = bridgeUrl.length > 0 && (
    bridgeUrl.startsWith('https://') ||
    bridgeUrl.startsWith('http://localhost') ||
    bridgeUrl.startsWith('http://127.0.0.1') ||
    bridgeUrl.startsWith('http://10.') ||
    bridgeUrl.startsWith('http://192.168.') ||
    bridgeUrl.startsWith('http://172.')
  );

  if (!bridgeConfigured) {
    return Response.json({
      success: false,
      status: 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED',
      backendWriteStatus: 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED',
      message: 'No vault write occurred. Bridge URL (VERIDAN_OBSIDIAN_BRIDGE_URL) is not configured or is not a valid HTTPS/private URL.',
      bridgeConfigured: false,
      proposalId: normalized.proposalId,
      action: normalized.action,
      normalizedPath: normalized.normalizedPath,
      safetySummary: {
        noOpenClawDispatch: true,
        noInvokeLLM: true,
        noBrowserAutomation: true,
        noCredentials: true,
        serverSideValidationPassed: true,
        bridgeUrlConfigured: false,
      },
    }, { status: 200 }); // 200 so the frontend can read the structured response
  }

  // ── Outbound bridge call ──────────────────────────────────────────────────
  const executionId = `EXEC-${Date.now().toString(36).toUpperCase()}-SRV`;
  const executedAt = new Date().toISOString();

  const bridgePayload = {
    executionId,
    executedAt,
    proposalId: normalized.proposalId,
    action: normalized.action,
    targetFolder: normalized.folder,
    allowlistedFolder: normalized.folder,
    relativePath: normalized.relativePath,
    fileName: normalized.relativePath.split('/').pop(),
    normalizedPath: normalized.normalizedPath,
    appendMode: normalized.appendMode,
    content: normalized.content,
    contentHash: simpleHash(normalized.content),
    operatorApproval: true,
    safetySummary: {
      noOpenClawDispatch: true,
      noInvokeLLM: true,
      noBrowserAutomation: true,
      noCredentials: true,
      serverSideValidationPassed: true,
      bridgeUrlConfigured: true,
    },
  };

  let bridgeResponseSummary = null;
  let bridgeSuccess = false;
  let bridgeError = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const bridgeToken = (Deno.env.get('VERIDAN_BRIDGE_TOKEN') || '').trim();

    const bridgeRes = await fetch(`${bridgeUrl}/vault/write-approved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bridgeToken ? { 'Authorization': `Bearer ${bridgeToken}` } : {}),
      },
      body: JSON.stringify(bridgePayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const rawBody = await bridgeRes.text();
    let bridgeData;
    try { bridgeData = JSON.parse(rawBody); } catch { bridgeData = { raw: rawBody }; }

    if (bridgeRes.ok) {
      bridgeSuccess = bridgeData?.success !== false;
      bridgeResponseSummary = {
        httpStatus: bridgeRes.status,
        bridgeSuccess,
        message: bridgeData?.message || bridgeData?.status || 'Bridge responded OK',
        filePath: bridgeData?.filePath || normalized.normalizedPath,
      };
    } else {
      bridgeError = `Bridge returned HTTP ${bridgeRes.status}: ${bridgeData?.error || bridgeData?.message || rawBody.slice(0, 300)}`;
      bridgeResponseSummary = {
        httpStatus: bridgeRes.status,
        bridgeSuccess: false,
        message: bridgeError,
        upstreamBody: bridgeData,
      };
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      bridgeError = 'Bridge call timed out after 15s';
    } else {
      bridgeError = e?.message || 'Bridge call failed';
    }
    bridgeResponseSummary = { httpStatus: null, bridgeSuccess: false, message: bridgeError };
  }

  // ── On failure: return explicit failure, no audit ─────────────────────────
  if (!bridgeSuccess) {
    return Response.json({
      success: false,
      status: 'BRIDGE_CALL_FAILED',
      backendWriteStatus: `BRIDGE_CALL_FAILED: ${bridgeError}`,
      message: `Bridge call failed. No vault write confirmed. ${bridgeError}`,
      executionId,
      executedAt,
      proposalId: normalized.proposalId,
      action: normalized.action,
      normalizedPath: normalized.normalizedPath,
      bridgeResponseSummary,
      safetySummary: bridgePayload.safetySummary,
    }, { status: 502 });
  }

  // ── On success: write audit record ────────────────────────────────────────
  const filePath = bridgeResponseSummary?.filePath || normalized.normalizedPath;
  let auditSaved = false;
  try {
    await base44.asServiceRole.entities.VeridanObsidianWriteAudit.create({
      auditId: `AUDIT-${executionId}`,
      draftId: normalized.proposalId,
      filename: normalized.relativePath.split('/').pop(),
      folder: normalized.folder,
      filePath,
      source: 'VAULT_WRITE_BRIDGE',
      draftType: `VAULT_BRIDGE_${normalized.action.toUpperCase()}`,
      riskLevel: 'LOW',
      approvalStatus: 'APPROVED',
      filesystemWrite: 'COMPLETED_APPROVED_DRAFT_ONLY',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      openclawCall: 'NOT_SENT',
      timestamp: executedAt,
      contentHash: simpleHash(normalized.content),
      writeMode: 'GOVERNED_VAULT_WRITE_BRIDGE',
    });
    auditSaved = true;
  } catch { /* audit failure does not invalidate the write — log separately */ }

  const rollbackSnapshot = ['update_note', 'append_note'].includes(normalized.action)
    ? {
        action: normalized.action,
        normalizedPath: normalized.normalizedPath,
        snapshotNote: 'Metadata snapshot only — prior file content was on VPS bridge',
        createdAt: executedAt,
      }
    : null;

  return Response.json({
    success: true,
    status: 'EXECUTED',
    backendWriteStatus: 'COMPLETED',
    message: 'Vault write confirmed by bridge. Run DailyVaultHealthCheckPanel to verify index integrity.',
    executionId,
    executedAt,
    proposalId: normalized.proposalId,
    action: normalized.action,
    normalizedPath: filePath,
    rollbackSnapshot,
    bridgeResponseSummary,
    auditSaved,
    fileIndexUpdateStatus: 'SUGGEST_REFRESH_VAULT_FILE_INDEX',
    safetySummary: bridgePayload.safetySummary,
  }, { status: 200 });
});