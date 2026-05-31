/**
 * VaultWriteBridgeDryRunPanel
 * Dry-run proposal builder for vault writes. NEVER writes anything.
 *
 * Safety guarantee — this panel NEVER:
 *   - Writes vault files
 *   - Mutates backend entities
 *   - Calls OpenClaw / InvokeLLM / browser automation
 *   - Collects credentials or secrets
 *   - Makes network calls outside existing app services
 *
 * It ONLY builds a validated proposal JSON in component state.
 * Export is local browser download only.
 */

import React, { useState, useCallback } from 'react';
import {
  FlaskConical, Shield, CheckCircle2, AlertTriangle, XCircle,
  Download, RefreshCw, ChevronDown, ChevronRight, ShieldCheck,
  Send, ClipboardList,
} from 'lucide-react';

// ── Allowlist ─────────────────────────────────────────────────────────────────

export const VAULT_WRITE_ALLOWED_FOLDERS = [
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

const VERIFICATIONS = [
  'No vault writes — this panel builds proposals only',
  'No backend entity mutations',
  'No OpenClaw dispatch',
  'No InvokeLLM calls',
  'No browser automation',
  'No credentials or secrets collected',
  'Folder must be in hardcoded allowlist',
  'Path traversal blocked (../, ..\\\\, encoded)',
  'Absolute paths blocked',
  '.md extension enforced',
  'Secret/credential content patterns blocked',
  'Export is local browser download — no backend write',
  'operatorApprovalRequired: true in every proposal',
  'executionEligible: false in every proposal',
];

// ── Validation ────────────────────────────────────────────────────────────────

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,             // OpenAI-style sk- keys
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i,
  /password\s*[:=]\s*\S+/i,
  /api[_-]?key\s*[:=]\s*\S+/i,
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/i,
  /secret\s*[:=]\s*\S+/i,
  /token\s*[:=]\s*\S+/i,
  /mnemonic|seed phrase|recovery phrase/i,
  /private[_-]?key\s*[:=]/i,
  /Authorization:\s*Bearer/i,
];

function validateProposal({ action, folder, filename, content }) {
  const checks = [];
  let valid = true;

  // Action check
  if (!SUPPORTED_ACTIONS.includes(action)) {
    checks.push({ id: 'action', status: 'FAIL', message: `Unsupported action "${action}". Allowed: ${SUPPORTED_ACTIONS.join(', ')}` });
    valid = false;
  } else {
    checks.push({ id: 'action', status: 'PASS', message: `Action "${action}" is supported` });
  }

  // Folder allowlist
  if (!VAULT_WRITE_ALLOWED_FOLDERS.includes(folder)) {
    checks.push({ id: 'folder', status: 'FAIL', message: `Folder "${folder}" is not in the allowlist` });
    valid = false;
  } else {
    checks.push({ id: 'folder', status: 'PASS', message: `Folder "${folder}" is in the allowlist` });
  }

  // Empty filename
  const trimmedFilename = (filename || '').trim();
  if (!trimmedFilename) {
    checks.push({ id: 'filename_empty', status: 'FAIL', message: 'Filename must not be empty' });
    valid = false;
  } else {
    checks.push({ id: 'filename_empty', status: 'PASS', message: 'Filename is not empty' });
  }

  // Absolute path
  if (/^[/\\]/.test(trimmedFilename) || /^[A-Za-z]:/.test(trimmedFilename)) {
    checks.push({ id: 'absolute_path', status: 'FAIL', message: 'Absolute paths are not permitted' });
    valid = false;
  } else {
    checks.push({ id: 'absolute_path', status: 'PASS', message: 'Not an absolute path' });
  }

  // Path traversal
  const traversalPatterns = [
    /\.\.[/\\]/,
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
    /%252e/i,
    /\/\//,
    /\\\\/,
  ];
  const hasTraversal = traversalPatterns.some(p => p.test(trimmedFilename));
  if (hasTraversal) {
    checks.push({ id: 'traversal', status: 'FAIL', message: 'Path traversal pattern detected in filename' });
    valid = false;
  } else {
    checks.push({ id: 'traversal', status: 'PASS', message: 'No path traversal patterns' });
  }

  // .md extension only
  const normalizedName = trimmedFilename.replace(/\\/g, '/').split('/').pop();
  if (normalizedName && !normalizedName.endsWith('.md')) {
    checks.push({ id: 'extension', status: 'FAIL', message: 'Only .md files are permitted' });
    valid = false;
  } else if (normalizedName) {
    checks.push({ id: 'extension', status: 'PASS', message: '.md extension confirmed' });
  }

  // Secret / credential content check
  const contentStr = content || '';
  const secretHit = SECRET_PATTERNS.find(p => p.test(contentStr));
  if (secretHit) {
    checks.push({ id: 'secret_content', status: 'FAIL', message: 'Content appears to contain a secret, API key, token, or credential' });
    valid = false;
  } else {
    checks.push({ id: 'secret_content', status: 'PASS', message: 'No credential or secret patterns detected in content' });
  }

  // Large content warning
  if (contentStr.length > 50000) {
    checks.push({ id: 'content_size', status: 'WARN', message: `Content is large (${Math.round(contentStr.length / 1024)}KB). Consider splitting.` });
  } else {
    checks.push({ id: 'content_size', status: 'PASS', message: `Content size OK (${contentStr.length} chars)` });
  }

  // Action-specific warnings
  if (action === 'update_note') {
    checks.push({ id: 'update_warn', status: 'WARN', message: 'update_note: verify this file exists in the vault before execution' });
  }
  if (action === 'append_note') {
    checks.push({ id: 'append_warn', status: 'WARN', message: 'append_note: verify the target file exists in the vault before execution' });
  }

  const hasWarn = checks.some(c => c.status === 'WARN');
  const validationStatus = !valid ? 'FAIL' : hasWarn ? 'WARN' : 'PASS';

  return { checks, validationStatus, valid };
}

function normalizePath(folder, filename) {
  const clean = filename.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  return `${folder}/${clean}`;
}

// ── Status chip ───────────────────────────────────────────────────────────────

const STATUS_CFG = {
  PASS:    { color: 'text-primary',     bg: 'bg-primary/10 border-primary/30',         icon: CheckCircle2 },
  WARN:    { color: 'text-accent',      bg: 'bg-accent/10 border-accent/30',           icon: AlertTriangle },
  FAIL:    { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: XCircle },
  BLOCKED: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: XCircle },
};

function StatusChip({ status, small = false }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.WARN;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-sm font-bold uppercase ${small ? 'text-[6px]' : 'text-[7px]'} ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-2.5 h-2.5 shrink-0" />{status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VaultWriteBridgeDryRunPanel({ onProposalQueued }) {
  const [action, setAction] = useState('create_note');
  const [folder, setFolder] = useState(VAULT_WRITE_ALLOWED_FOLDERS[0]);
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [proposal, setProposal] = useState(null);
  const [lastDryRunAt, setLastDryRunAt] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [queuedProposal, setQueuedProposal] = useState(null);

  const handleBuildDryRun = useCallback(() => {
    const { checks, validationStatus, valid } = validateProposal({ action, folder, filename, content });
    const normalizedPath = valid ? normalizePath(folder, filename) : null;
    const relativePath = filename.trim();

    const p = {
      proposalId: `PROP-${Date.now().toString(36).toUpperCase()}-DRY`,
      generatedAt: new Date().toISOString(),
      action,
      allowlistedFolder: folder,
      relativePath,
      normalizedPath,
      proposedContent: content,
      appendMode: action === 'append_note',
      validationStatus,
      validationChecks: checks,
      diffPreview: valid
        ? `--- (vault: ${normalizedPath})\n+++ (proposed)\n${content.slice(0, 800)}${content.length > 800 ? '\n…[truncated]' : ''}`
        : null,
      safetySummary: {
        noVaultWrite: true,
        noOpenClawDispatch: true,
        noInvokeLLM: true,
        noBrowserAutomation: true,
        noCredentials: true,
        folderAllowlisted: VAULT_WRITE_ALLOWED_FOLDERS.includes(folder),
      },
      operatorApprovalRequired: true,
      executionEligible: false,
      source: 'VaultWriteBridgeDryRunPanel',
    };

    setProposal(p);
    setLastDryRunAt(new Date().toISOString());
    setShowChecks(true);
    setQueuedProposal(null);
  }, [action, folder, filename, content]);

  const handleQueueForApproval = () => {
    if (!proposal || proposal.validationStatus === 'FAIL') return;
    const queued = { ...proposal, queuedAt: new Date().toISOString() };
    setQueuedProposal(queued);
    if (onProposalQueued) onProposalQueued(queued);
  };

  const handleExport = () => {
    if (!proposal) return;
    const blob = new Blob([JSON.stringify(proposal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-write-proposal-${proposal.proposalId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setProposal(null);
    setQueuedProposal(null);
    setShowChecks(false);
  };

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Vault Write Bridge — Dry Run</span>
          <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase border border-blue-400/30 bg-blue-400/10 text-blue-400 rounded-sm">DRY-RUN ONLY</span>
          {proposal && <StatusChip status={proposal.validationStatus} />}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setShowVerification(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 rounded-sm transition-colors">
            <ShieldCheck className="w-2.5 h-2.5" /> Verify
          </button>
          {proposal && (
            <button type="button" onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-accent/30 text-accent hover:border-accent/60 rounded-sm transition-colors">
              <Download className="w-2.5 h-2.5" /> Export JSON
            </button>
          )}
          <button type="button" onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-border/40 text-slate-400 hover:text-slate-200 rounded-sm transition-colors">
            <RefreshCw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-blue-400/20 bg-blue-400/5">
        <Shield className="w-3 h-3 text-blue-400 shrink-0" />
        <span className="text-[7px] font-bold text-blue-400 uppercase tracking-wide">
          Dry-run only — no vault writes · no openclaw dispatch · no ai calls · no credential access
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Form */}
        <div className="grid grid-cols-1 gap-2.5">

          {/* Action */}
          <div className="space-y-1">
            <label className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Action</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-background border border-border/40 text-[8px] font-mono text-slate-300 px-2 py-1.5 rounded-sm focus:outline-none focus:border-primary/40"
            >
              {SUPPORTED_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Folder */}
          <div className="space-y-1">
            <label className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Target Folder (allowlisted only)</label>
            <select
              value={folder}
              onChange={e => setFolder(e.target.value)}
              className="w-full bg-background border border-border/40 text-[8px] font-mono text-slate-300 px-2 py-1.5 rounded-sm focus:outline-none focus:border-primary/40"
            >
              {VAULT_WRITE_ALLOWED_FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Filename */}
          <div className="space-y-1">
            <label className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Filename (relative, .md only)</label>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="my-note.md"
              className="w-full bg-background border border-border/40 text-[8px] font-mono text-slate-300 px-2 py-1.5 rounded-sm focus:outline-none focus:border-primary/40 placeholder:text-slate-600"
            />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <label className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Content (Markdown)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              placeholder="# Note Title&#10;&#10;Content here..."
              className="w-full bg-background border border-border/40 text-[8px] font-mono text-slate-300 px-2 py-1.5 rounded-sm focus:outline-none focus:border-primary/40 resize-y placeholder:text-slate-600"
            />
            <div className="text-[6px] font-mono text-slate-600">{content.length} chars</div>
          </div>
        </div>

        {/* Build button */}
        <button
          type="button"
          onClick={handleBuildDryRun}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-400/15 border border-blue-400/40 text-blue-400 hover:bg-blue-400/25 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" /> Build Dry Run
        </button>

        {/* Results */}
        {proposal && (
          <>
            {/* Proposal ID + path */}
            <div className="border border-border/30 bg-background/40 rounded-sm px-3 py-2 space-y-1">
              <div className="text-[6px] font-mono text-slate-600">Proposal ID: <span className="text-slate-400">{proposal.proposalId}</span></div>
              <div className="text-[6px] font-mono text-slate-600">Generated: <span className="text-slate-400">{proposal.generatedAt}</span></div>
              {proposal.normalizedPath && (
                <div className="text-[6px] font-mono text-slate-600">Normalized path: <span className="text-primary/80">{proposal.normalizedPath}</span></div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[6px] font-mono text-slate-600">executionEligible:</span>
                <span className="text-[6px] font-bold text-destructive">false</span>
                <span className="text-[6px] font-mono text-slate-600">operatorApprovalRequired:</span>
                <span className="text-[6px] font-bold text-accent">true</span>
              </div>
            </div>

            {/* Validation checks */}
            <div className="border border-border/30 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowChecks(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-3 h-3" /> Validation Checks ({proposal.validationChecks.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusChip status={proposal.validationStatus} />
                  {showChecks ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
              </button>
              {showChecks && (
                <div className="px-3 pb-2 space-y-1 border-t border-border/20 bg-background/30">
                  {proposal.validationChecks.map((c, i) => {
                    const cfg = STATUS_CFG[c.status] || STATUS_CFG.WARN;
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className="flex items-start gap-1.5 py-0.5">
                        <Icon className={`w-2.5 h-2.5 shrink-0 mt-0.5 ${cfg.color}`} />
                        <span className={`text-[7px] font-mono ${cfg.color}`}>{c.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Diff preview */}
            {proposal.diffPreview && (
              <div className="space-y-1">
                <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Content Preview</div>
                <pre className="bg-background/60 border border-border/30 rounded-sm p-2 text-[7px] font-mono text-slate-400 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {proposal.diffPreview}
                </pre>
              </div>
            )}

            {/* Queue for approval button */}
            {proposal.validationStatus !== 'FAIL' && !queuedProposal && (
              <button
                type="button"
                onClick={handleQueueForApproval}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Queue for Approval
              </button>
            )}

            {proposal.validationStatus === 'FAIL' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[7px] font-mono text-destructive">Proposal blocked — fix validation failures before queuing</span>
              </div>
            )}

            {queuedProposal && (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-sm">
                <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                <div className="text-[7px] font-mono text-accent">
                  Proposal queued at {queuedProposal.queuedAt} · ID: {queuedProposal.proposalId}
                  <span className="ml-2 text-slate-500">Pass to VaultWriteExecutionPanel for controlled execution.</span>
                </div>
              </div>
            )}
          </>
        )}

        {lastDryRunAt && (
          <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2">
            Last dry run: {lastDryRunAt}
          </div>
        )}

        {/* Verification */}
        {showVerification && (
          <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
            <div className="text-[7px] font-bold uppercase tracking-widest text-primary/80 mb-2">Safety Verification</div>
            {VERIFICATIONS.map((v, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                {v}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}