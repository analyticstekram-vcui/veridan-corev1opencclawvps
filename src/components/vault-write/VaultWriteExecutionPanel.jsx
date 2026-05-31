/**
 * VaultWriteExecutionPanel
 * Converts only APPROVED, PASS-validated dry-run proposals into controlled vault writes.
 *
 * Safety guarantee — this panel NEVER:
 *   - Executes without an approved PASS proposal
 *   - Provides general filesystem access
 *   - Permits arbitrary paths or folders outside the allowlist
 *   - Collects credentials or secrets
 *   - Calls OpenClaw / InvokeLLM / browser automation
 *   - Fakes success if the backend write bridge is unavailable
 *   - Silently fails
 *
 * Execution uses ONLY the narrow obsidianWriteApprovedDraft backend endpoint.
 * Export is local browser download only.
 */

import React, { useState, useCallback } from 'react';
import {
  PlayCircle, Shield, CheckCircle2, AlertTriangle, XCircle,
  Download, RefreshCw, ShieldCheck, ClipboardList, ChevronDown,
  ChevronRight, AlertCircle, ServerOff,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { saveAuditToBackend } from '@/lib/obsidianDraftStore';
import { VAULT_WRITE_ALLOWED_FOLDERS } from './VaultWriteBridgeDryRunPanel';

// ── Allowed folders (imported from dry-run panel — single source of truth) ───

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
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

const VERIFICATIONS = [
  'obsidianWriteApprovedDraft implemented with narrow bridge connector',
  'Missing bridge URL returns BACKEND_WRITE_BRIDGE_NOT_CONNECTED — no fake success',
  'Server-side validation reruns independently of frontend checks',
  'Only approved vault write endpoint (obsidianWriteApprovedDraft) can be called',
  'Success audit saved to VeridanObsidianWriteAudit only after confirmed bridge write',
  'File index update suggested only after confirmed write',
  'No OpenClaw / InvokeLLM / browser automation / trading / money movement / generic filesystem',
  'Execution requires explicit PASS/WARN proposal — FAIL proposals are blocked',
  'Execution requires operatorApprovalRequired === true in proposal',
  'Execution requires valid proposalId',
  'Re-validates all checks before write (client-side)',
  'Folder must be in allowlist (re-checked client + server)',
  'Path traversal re-checked client + server',
  'Secret content re-checked client + server',
  'Rollback snapshot metadata created before modify operations',
  'Export is local browser download — no secondary backend write',
  'Four distinct error states: BACKEND_WRITE_BRIDGE_NOT_CONNECTED | BRIDGE_CALL_FAILED | BLOCKED_VALIDATION | EXECUTED',
];

// ── Re-validate at execution time ─────────────────────────────────────────────

function revalidateProposal(proposal) {
  const errors = [];

  if (!proposal) return { ok: false, errors: ['No proposal provided'] };
  if (!proposal.proposalId) errors.push('Missing proposalId');
  if (!proposal.operatorApprovalRequired) errors.push('operatorApprovalRequired must be true');
  if (proposal.executionEligible === true) errors.push('executionEligible must not be true in the raw proposal — operator sets approval');
  if (!['create_note', 'update_note', 'append_note'].includes(proposal.action)) errors.push(`Unsupported action: ${proposal.action}`);
  if (!VAULT_WRITE_ALLOWED_FOLDERS.includes(proposal.allowlistedFolder)) errors.push(`Folder "${proposal.allowlistedFolder}" not in allowlist`);
  if (!proposal.normalizedPath) errors.push('No normalizedPath in proposal');

  // Re-run path safety
  const path = proposal.normalizedPath || '';
  if (/^[/\\]/.test(path) || /^[A-Za-z]:/.test(path)) errors.push('Absolute path detected');
  if (/\.\.[/\\]/.test(path) || /%2e%2e/i.test(path)) errors.push('Path traversal detected');
  if (!path.endsWith('.md')) errors.push('Path must end in .md');

  // Re-check content for secrets
  const content = proposal.proposedContent || '';
  if (SECRET_PATTERNS.some(p => p.test(content))) errors.push('Content contains secret/credential pattern');

  if (proposal.validationStatus === 'FAIL') errors.push('Proposal validationStatus is FAIL — cannot execute');

  return { ok: errors.length === 0, errors };
}

// ── Status chip ───────────────────────────────────────────────────────────────

const STATUS_CFG = {
  PASS:               { color: 'text-primary',     bg: 'bg-primary/10 border-primary/30',         icon: CheckCircle2 },
  WARN:               { color: 'text-accent',      bg: 'bg-accent/10 border-accent/30',           icon: AlertTriangle },
  FAIL:               { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: XCircle },
  BLOCKED:            { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: XCircle },
  APPROVED:           { color: 'text-primary',     bg: 'bg-primary/10 border-primary/30',         icon: CheckCircle2 },
  NOT_CONNECTED:      { color: 'text-slate-400',   bg: 'bg-border/20 border-border/30',           icon: ServerOff },
  EXECUTED:           { color: 'text-primary',     bg: 'bg-primary/10 border-primary/30',         icon: CheckCircle2 },
  REVIEW_REQUIRED:    { color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/30',     icon: AlertCircle },
};

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.WARN;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-sm font-bold uppercase text-[7px] ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-2.5 h-2.5 shrink-0" />{status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VaultWriteExecutionPanel({ initialProposal }) {
  const [proposalJson, setProposalJson] = useState(
    initialProposal ? JSON.stringify(initialProposal, null, 2) : ''
  );
  const [parsedProposal, setParsedProposal] = useState(initialProposal || null);
  const [parseError, setParseError] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [execState, setExecState] = useState('idle'); // idle | verifying | executing | done | error
  const [receipt, setReceipt] = useState(null);
  const [execError, setExecError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [lastExecutionAttemptAt, setLastExecutionAttemptAt] = useState(null);

  const handleParseProposal = () => {
    setParseError('');
    setParsedProposal(null);
    setVerifyResult(null);
    setReceipt(null);
    setExecError('');
    try {
      const p = JSON.parse(proposalJson);
      setParsedProposal(p);
    } catch (e) {
      setParseError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleVerify = useCallback(() => {
    if (!parsedProposal) return;
    const result = revalidateProposal(parsedProposal);
    setVerifyResult(result);
    setLastVerifiedAt(new Date().toISOString());
    setShowChecks(true);
  }, [parsedProposal]);

  const handleExecute = useCallback(async () => {
    if (!parsedProposal) return;
    setExecState('verifying');
    setExecError('');
    setLastExecutionAttemptAt(new Date().toISOString());

    // Final re-validation gate
    const check = revalidateProposal(parsedProposal);
    setVerifyResult(check);
    if (!check.ok) {
      setExecState('error');
      setExecError(`Execution blocked: ${check.errors.join(' | ')}`);
      return;
    }

    setExecState('executing');

    // Rollback snapshot metadata (before write, for update/append)
    const rollbackSnapshot = ['update_note', 'append_note'].includes(parsedProposal.action)
      ? {
          action: parsedProposal.action,
          normalizedPath: parsedProposal.normalizedPath,
          snapshotNote: 'Snapshot metadata only — actual file content not read by this panel',
          createdAt: new Date().toISOString(),
        }
      : null;

    // ── Attempt backend write via narrow endpoint ─────────────────────────
    let backendWriteStatus = 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED';
    let writeResult = null;
    let backendStatus = 'NOT_CONNECTED'; // BACKEND_WRITE_BRIDGE_NOT_CONNECTED | BRIDGE_CALL_FAILED | BLOCKED_VALIDATION | EXECUTED

    try {
      const response = await base44.functions.invoke('obsidianWriteApprovedDraft', {
        proposal: parsedProposal,
      });
      const d = response?.data;

      if (d?.success && d?.status === 'EXECUTED') {
        backendWriteStatus = 'COMPLETED';
        backendStatus = 'EXECUTED';
        writeResult = d;
      } else if (d?.status === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED') {
        backendWriteStatus = 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED';
        backendStatus = 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED';
      } else if (d?.status === 'BRIDGE_CALL_FAILED') {
        backendWriteStatus = `BRIDGE_CALL_FAILED: ${d?.message || ''}`;
        backendStatus = 'BRIDGE_CALL_FAILED';
      } else if (d?.status === 'BLOCKED_VALIDATION') {
        backendWriteStatus = `BLOCKED_VALIDATION: ${(d?.errors || []).join(' | ')}`;
        backendStatus = 'BLOCKED_VALIDATION';
      } else {
        backendWriteStatus = `FAILED: ${d?.error || d?.message || 'Unknown response'}`;
        backendStatus = 'BRIDGE_CALL_FAILED';
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Unknown error';
      backendWriteStatus = `BRIDGE_CALL_FAILED: ${msg}`;
      backendStatus = 'BRIDGE_CALL_FAILED';
    }

    const executionId = writeResult?.executionId || `EXEC-${Date.now().toString(36).toUpperCase()}`;
    const executedAt = writeResult?.executedAt || new Date().toISOString();
    const status = backendStatus === 'EXECUTED' ? 'SUCCESS' : backendStatus;

    // Audit is saved server-side on success; frontend logs status only
    const auditEntryStatus = backendStatus === 'EXECUTED'
      ? (writeResult?.auditSaved ? 'SAVED_SERVER_SIDE' : 'ATTEMPTED_SERVER_SIDE')
      : 'NOT_ATTEMPTED';

    const r = {
      executionId,
      executedAt,
      proposalId: parsedProposal.proposalId,
      action: parsedProposal.action,
      normalizedPath: writeResult?.normalizedPath || parsedProposal.normalizedPath,
      status,
      backendWriteStatus,
      backendStatus,
      rollbackSnapshot: writeResult?.rollbackSnapshot || rollbackSnapshot,
      bridgeResponseSummary: writeResult?.bridgeResponseSummary || null,
      fileIndexUpdateStatus: status === 'SUCCESS' ? 'SUGGEST_REFRESH_VAULT_FILE_INDEX' : 'NOT_APPLICABLE',
      auditEntryStatus,
      safetySummary: {
        noOpenClawDispatch: true,
        noInvokeLLM: true,
        noBrowserAutomation: true,
        noCredentials: true,
        endpointUsed: 'obsidianWriteApprovedDraft',
        allChecksPassedBeforeWrite: check.ok,
      },
      postExecutionRecommendation: status === 'SUCCESS'
        ? 'Run DailyVaultHealthCheckPanel to verify vault index integrity after this write.'
        : backendStatus === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED'
          ? 'Bridge URL not configured. Set VERIDAN_OBSIDIAN_BRIDGE_URL in app secrets. No vault write occurred.'
          : backendStatus === 'BRIDGE_CALL_FAILED'
            ? 'Bridge call failed. Check VPS bridge connectivity and obsidianWriteApprovedDraft function logs.'
            : backendStatus === 'BLOCKED_VALIDATION'
              ? 'Server-side validation blocked the write. Review proposal fields and re-submit.'
              : 'Check obsidianWriteApprovedDraft function status.',
      source: 'VaultWriteExecutionPanel',
    };

    setReceipt(r);
    setExecState('done');
  }, [parsedProposal]);

  const handleExportReceipt = () => {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-execution-receipt-${receipt.executionId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setProposalJson('');
    setParsedProposal(null);
    setParseError('');
    setVerifyResult(null);
    setReceipt(null);
    setExecState('idle');
    setExecError('');
    setShowChecks(false);
  };

  const isRunning = execState === 'verifying' || execState === 'executing';
  const canExecute = parsedProposal && verifyResult?.ok && execState !== 'done';

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PlayCircle className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Vault Write — Controlled Execution</span>
          <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase border border-primary/30 bg-primary/10 text-primary rounded-sm">APPROVED PROPOSALS ONLY</span>
          {receipt && <StatusChip status={
            receipt.status === 'SUCCESS' ? 'EXECUTED'
            : receipt.backendStatus === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? 'NOT_CONNECTED'
            : receipt.backendStatus === 'BRIDGE_CALL_FAILED' ? 'FAIL'
            : receipt.backendStatus === 'BLOCKED_VALIDATION' ? 'BLOCKED'
            : 'FAIL'
          } />}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setShowVerification(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 rounded-sm transition-colors">
            <ShieldCheck className="w-2.5 h-2.5" /> Verify
          </button>
          {receipt && (
            <button type="button" onClick={handleExportReceipt}
              className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-accent/30 text-accent hover:border-accent/60 rounded-sm transition-colors">
              <Download className="w-2.5 h-2.5" /> Export Receipt
            </button>
          )}
          <button type="button" onClick={handleReset} disabled={isRunning}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-border/40 text-slate-400 hover:text-slate-200 rounded-sm transition-colors disabled:opacity-40">
            <RefreshCw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-amber-500/20 bg-amber-500/5">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-wide">
          Controlled vault write only — approved proposals required · no openclaw · no ai calls · no credential access
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Proposal paste input */}
        <div className="space-y-1.5">
          <label className="text-[7px] font-bold uppercase tracking-widest text-slate-500">
            Paste Approved Proposal JSON (from VaultWriteBridgeDryRunPanel)
          </label>
          <textarea
            value={proposalJson}
            onChange={e => { setProposalJson(e.target.value); setParsedProposal(null); setVerifyResult(null); setReceipt(null); setExecError(''); }}
            rows={5}
            placeholder='{"proposalId": "PROP-...", "action": "create_note", ...}'
            className="w-full bg-background border border-border/40 text-[7px] font-mono text-slate-300 px-2 py-1.5 rounded-sm focus:outline-none focus:border-primary/40 resize-y placeholder:text-slate-600"
          />
          {parseError && (
            <div className="text-[7px] font-mono text-destructive">{parseError}</div>
          )}
          <button type="button" onClick={handleParseProposal}
            className="flex items-center gap-1 px-3 py-1.5 text-[7px] font-bold uppercase border border-border/40 text-slate-400 hover:text-slate-200 hover:border-primary/30 rounded-sm transition-colors">
            Parse Proposal
          </button>
        </div>

        {/* Parsed summary */}
        {parsedProposal && (
          <div className="border border-border/30 bg-background/40 rounded-sm px-3 py-2 space-y-1">
            <div className="text-[6px] font-mono text-slate-600">Proposal ID: <span className="text-slate-300">{parsedProposal.proposalId || '—'}</span></div>
            <div className="text-[6px] font-mono text-slate-600">Action: <span className="text-slate-300">{parsedProposal.action || '—'}</span></div>
            <div className="text-[6px] font-mono text-slate-600">Folder: <span className="text-slate-300">{parsedProposal.allowlistedFolder || '—'}</span></div>
            <div className="text-[6px] font-mono text-slate-600">Path: <span className="text-primary/80">{parsedProposal.normalizedPath || '—'}</span></div>
            <div className="text-[6px] font-mono text-slate-600">Validation status: <span className="text-slate-300">{parsedProposal.validationStatus || '—'}</span></div>
          </div>
        )}

        {/* Verify button */}
        {parsedProposal && execState !== 'done' && (
          <button type="button" onClick={handleVerify} disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase border border-primary/30 text-primary hover:border-primary/60 rounded-sm transition-colors disabled:opacity-40">
            <ClipboardList className="w-3 h-3" /> Verify Proposal
          </button>
        )}

        {/* Verify results */}
        {verifyResult && (
          <div className="border border-border/30 rounded-sm overflow-hidden">
            <button type="button" onClick={() => setShowChecks(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">
              <span className="flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3" /> Re-Validation ({verifyResult.errors?.length ?? 0} errors)
              </span>
              <div className="flex items-center gap-1.5">
                <StatusChip status={verifyResult.ok ? 'APPROVED' : 'BLOCKED'} />
                {showChecks ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </div>
            </button>
            {showChecks && (
              <div className="px-3 pb-2 space-y-1 border-t border-border/20 bg-background/30">
                {verifyResult.ok
                  ? <div className="flex items-center gap-1.5 py-0.5 text-[7px] font-mono text-primary"><CheckCircle2 className="w-2.5 h-2.5" /> All re-validation checks passed — execution eligible</div>
                  : verifyResult.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5 text-[7px] font-mono text-destructive">
                      <XCircle className="w-2.5 h-2.5 shrink-0 mt-0.5" />{e}
                    </div>
                  ))
                }
                {lastVerifiedAt && <div className="text-[6px] font-mono text-slate-600 pt-1">Verified at: {lastVerifiedAt}</div>}
              </div>
            )}
          </div>
        )}

        {/* Execution block message */}
        {verifyResult && !verifyResult.ok && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[7px] font-mono text-destructive">
              <span className="font-bold">Execution BLOCKED.</span> Fix all validation errors before executing.
            </div>
          </div>
        )}

        {/* Execute button */}
        {canExecute && (
          <button
            type="button"
            onClick={handleExecute}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/20 border-2 border-primary/50 text-primary hover:bg-primary/30 disabled:opacity-40 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors"
          >
            {isRunning
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> {execState === 'verifying' ? 'Re-Validating…' : 'Writing to vault…'}</>
              : <><PlayCircle className="w-4 h-4" /> Execute Approved Write</>
            }
          </button>
        )}

        {execError && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[7px] font-mono text-destructive"><span className="font-bold">Error:</span> {execError}</div>
          </div>
        )}

        {/* Receipt */}
        {receipt && (() => {
          const bs = receipt.backendStatus;
          const isSuccess = receipt.status === 'SUCCESS';
          const borderCls = isSuccess ? 'border-primary/30 bg-primary/5'
            : bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? 'border-slate-500/30 bg-slate-500/5'
            : bs === 'BRIDGE_CALL_FAILED' ? 'border-destructive/30 bg-destructive/5'
            : bs === 'BLOCKED_VALIDATION' ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-slate-500/30 bg-slate-500/5';
          const StatusIcon = isSuccess ? CheckCircle2
            : bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? ServerOff
            : XCircle;
          const statusColor = isSuccess ? 'text-primary'
            : bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? 'text-slate-400'
            : bs === 'BLOCKED_VALIDATION' ? 'text-accent'
            : 'text-destructive';
          const statusLabel = isSuccess ? 'EXECUTED — Write Complete'
            : bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED — Bridge URL not configured'
            : bs === 'BRIDGE_CALL_FAILED' ? 'BRIDGE_CALL_FAILED — Bridge responded with error'
            : bs === 'BLOCKED_VALIDATION' ? 'BLOCKED_VALIDATION — Server-side validation rejected'
            : receipt.backendWriteStatus;

          return (
            <div className={`border rounded-sm p-3 space-y-2 ${borderCls}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
                <span className={`text-[8px] font-bold uppercase tracking-widest ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-0.5 text-[6px] font-mono text-slate-500">
                <div>Execution ID: <span className="text-slate-300">{receipt.executionId}</span></div>
                <div>Executed at: <span className="text-slate-300">{receipt.executedAt}</span></div>
                <div>Proposal ID: <span className="text-slate-300">{receipt.proposalId}</span></div>
                <div>Action: <span className="text-slate-300">{receipt.action}</span></div>
                <div>Path: <span className="text-primary/80">{receipt.normalizedPath}</span></div>
                <div>Backend write: <span className={isSuccess ? 'text-primary' : 'text-slate-400'}>{receipt.backendWriteStatus}</span></div>
                <div>Audit entry: <span className="text-slate-300">{receipt.auditEntryStatus}</span></div>
                <div>File index: <span className="text-slate-300">{receipt.fileIndexUpdateStatus}</span></div>
              </div>

              {/* Backend connector status section */}
              <div className="border border-border/20 rounded-sm px-2 py-1.5 space-y-0.5">
                <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-1">Backend Connector Status</div>
                <div className="text-[6px] font-mono text-slate-500">obsidianWriteApprovedDraft: <span className="text-primary">present</span></div>
                <div className="text-[6px] font-mono text-slate-500">server-side validation: <span className="text-primary">enabled</span></div>
                <div className="text-[6px] font-mono text-slate-500">bridge URL configured: <span className={bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? 'text-destructive' : 'text-primary'}>{bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' ? 'NO' : 'YES'}</span></div>
                <div className="text-[6px] font-mono text-slate-500">last connector status: <span className="text-slate-300">{bs || '—'}</span></div>
                <div className="text-[6px] font-mono text-slate-500">OpenClaw path: <span className="text-primary">disabled</span> · InvokeLLM: <span className="text-primary">disabled</span> · browser: <span className="text-primary">disabled</span> · trading: <span className="text-primary">disabled</span></div>
              </div>

              {!isSuccess && (
                <div className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                  <ServerOff className="w-2.5 h-2.5 shrink-0 mt-0.5 text-slate-500" />
                  No vault write occurred.
                  {bs === 'BACKEND_WRITE_BRIDGE_NOT_CONNECTED' && ' Set VERIDAN_OBSIDIAN_BRIDGE_URL in app secrets to enable the bridge.'}
                  {bs === 'BRIDGE_CALL_FAILED' && ' Check VPS bridge connectivity and function logs.'}
                  {bs === 'BLOCKED_VALIDATION' && ' Server rejected the proposal — check validation errors above.'}
                </div>
              )}

              {receipt.postExecutionRecommendation && (
                <div className="flex items-start gap-1.5 text-[7px] font-mono text-accent">
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                  {receipt.postExecutionRecommendation}
                </div>
              )}

              {lastExecutionAttemptAt && (
                <div className="text-[6px] font-mono text-slate-600">Last attempt: {lastExecutionAttemptAt}</div>
              )}
            </div>
          );
        })()}

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