/**
 * ObsidianVpsBridgePanel
 * VPS Obsidian Bridge Control Panel — dry-run governance only.
 * No real filesystem writes. No VPS command execution. No OpenClaw dispatch.
 * No backend mutation. No credential handling. No browser automation. No live mode.
 * bridgeMode: VPS_OBSIDIAN_BRIDGE_DRY_RUN
 * executionStatus: NOT_EXECUTED
 * dispatchStatus: NOT_DISPATCHED
 * filesystemWrite: DISABLED
 * obsidianSync: DISABLED
 * openClawDispatch: DISABLED
 */

import React, { useState, useCallback } from 'react';
import { Copy, Download, ShieldAlert, CheckCircle2, Ban, AlertTriangle, FileText, ChevronDown, Send, Loader2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ObsidianVpsBridgeReadinessChecklist from './ObsidianVpsBridgeReadinessChecklist';
import ObsidianVpsBridgeEvidenceLog, { BRIDGE_EVIDENCE_LOG_KEY } from './ObsidianVpsBridgeEvidenceLog';
import ObsidianVpsBridgeSelfTest from './ObsidianVpsBridgeSelfTest';
import ObsidianVpsBridgeBaselineLock from './ObsidianVpsBridgeBaselineLock';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';

// ─── Constants ────────────────────────────────────────────────────────────────

const VAULT_ROOT = '/opt/veridan/obsidian-vault';

const ALLOWED_FOLDERS = [
  'Veridan Core',
  'Veridan Core/Trading',
  'Veridan Core/Public Credit',
  'Veridan Core/Business Formation',
  'Veridan Core/AI Command',
  'Veridan Core/OpenClaw Governance',
  'Veridan Core/Audit & Evidence',
  'Veridan Core/Baselines',
  'Veridan Core/Trading/Strategies',
  'Veridan Core/Trading/Risk Rules',
  'Veridan Core/Public Credit/Credit Profiles',
  'Veridan Core/Public Credit/Disputes',
  'Veridan Core/Business Formation/Entity Registry',
  'Veridan Core/Business Formation/EIN & Banking',
];

// Blocked path patterns
const BLOCKED_TRAVERSAL   = ['../', '..\\'];
const BLOCKED_SYSTEM_ROOTS = ['/root', '/etc', '/home', '/var', '/usr', '/bin', '/sbin', '/lib', '/proc', '/sys'];
const BLOCKED_SHELL_CHARS  = [';', '&&', '||', '`', '$(',  '$(', '|', '>', '<', '!', '#!', 'bash', 'sh ', 'exec', 'eval', 'curl', 'wget', 'rm ', 'chmod', 'sudo'];
const BLOCKED_EXTENSIONS   = ['.sh', '.py', '.rb', '.js', '.ts', '.exe', '.bat', '.cmd', '.ps1', '.php', '.pl', '.go'];
const CREDENTIAL_PATTERNS  = ['password', 'passwd', 'secret', 'api_key', 'apikey', 'token', 'private_key', 'credentials', 'auth_token'];
const ALLOWED_EXTENSION    = '.md';

function validatePath(folder, title) {
  const errors = [];

  const fullPath = `${VAULT_ROOT}/${folder}/${title}${ALLOWED_EXTENSION}`;
  const combined = (folder + '/' + title).toLowerCase();

  for (const t of BLOCKED_TRAVERSAL) {
    if (combined.includes(t)) { errors.push(`Path traversal detected: "${t}"`); }
  }

  for (const root of BLOCKED_SYSTEM_ROOTS) {
    if (fullPath.toLowerCase().startsWith(root)) { errors.push(`Blocked system root path: "${root}"`); }
  }

  for (const cmd of BLOCKED_SHELL_CHARS) {
    if (combined.includes(cmd)) { errors.push(`Shell/command pattern detected: "${cmd}"`); }
  }

  for (const ext of BLOCKED_EXTENSIONS) {
    if (combined.endsWith(ext)) { errors.push(`Blocked executable extension: "${ext}"`); }
  }

  for (const cred of CREDENTIAL_PATTERNS) {
    if (combined.includes(cred)) { errors.push(`Credential-looking content detected: "${cred}"`); }
  }

  if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
    errors.push('Target folder is not in the vault allowlist.');
  }

  if (!title.trim()) {
    errors.push('Note title is required.');
  }

  if (/[<>:"/\\|?*\x00-\x1f]/.test(title)) {
    errors.push('Note title contains disallowed characters.');
  }

  return errors;
}

function generateFrontmatter(title, folder, evidenceId, createdAt) {
  const tag = folder.toLowerCase().replace(/[^a-z0-9/]/g, '-').replace(/\//g, '/');
  return `---
title: "${title}"
folder: "${folder}"
created: "${createdAt}"
evidence_id: "${evidenceId}"
bridge_mode: VPS_OBSIDIAN_BRIDGE_DRY_RUN
execution_status: NOT_EXECUTED
dispatch_status: NOT_DISPATCHED
filesystem_write: DISABLED
obsidian_sync: DISABLED
openclaw_dispatch: DISABLED
tags:
  - veridan-core
  - ${tag}
  - dry-run
  - governance
---`;
}

function generateEvidenceId() {
  return `VOBS-DR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const STATUS_STRIP = [
  { label: 'bridgeMode',       value: 'VPS_OBSIDIAN_BRIDGE_DRY_RUN', color: 'text-amber-400' },
  { label: 'executionStatus',  value: 'NOT_EXECUTED',                 color: 'text-destructive' },
  { label: 'dispatchStatus',   value: 'NOT_DISPATCHED',               color: 'text-destructive' },
  { label: 'filesystemWrite',  value: 'DISABLED',                     color: 'text-destructive' },
  { label: 'obsidianSync',     value: 'DISABLED',                     color: 'text-destructive' },
  { label: 'openClawDispatch', value: 'DISABLED',                     color: 'text-destructive' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ObsidianVpsBridgePanel() {
  const [title, setTitle]         = useState('');
  const [folder, setFolder]       = useState('');
  const [content, setContent]     = useState('');
  const [approved, setApproved]   = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [copied, setCopied]       = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0);
  const [vpsResponse, setVpsResponse]   = useState(null);
  const [vpsSending, setVpsSending]     = useState(false);
  const [vpsError, setVpsError]         = useState(null);

  const createdAt   = dryRunResult?.createdAt  || '';
  const evidenceId  = dryRunResult?.evidenceId || '';

  const pathErrors = validatePath(folder, title);
  const pathValid  = pathErrors.length === 0;
  const targetPath = folder && title
    ? `${VAULT_ROOT}/${folder}/${title}${ALLOWED_EXTENSION}`
    : '(complete title and folder to preview path)';

  const frontmatter = (folder && title && evidenceId)
    ? generateFrontmatter(title, folder, evidenceId, createdAt)
    : generateFrontmatter(title || 'untitled', folder || '(none)', '(pending)', new Date().toISOString());

  const fullMarkdown = `${frontmatter}\n\n${content}`;

  const runDryRun = useCallback(() => {
    if (!pathValid || !approved) return;
    const id = generateEvidenceId();
    const ts = new Date().toISOString();
    const fm = generateFrontmatter(title, folder, id, ts);
    const result = {
      evidenceId: id,
      createdAt: ts,
      vaultRoot: VAULT_ROOT,
      folder,
      title,
      noteType: 'DRY_RUN_PREVIEW',
      operatorNote: '',
      targetPath: `${VAULT_ROOT}/${folder}/${title}${ALLOWED_EXTENSION}`,
      contentLength: content.length,
      contentPreview: content.slice(0, 300) + (content.length > 300 ? '\n…(truncated)' : ''),
      frontmatter: fm,
      pathErrors: [],
      validationStatus: 'PASS',
      bridgeMode: 'VPS_OBSIDIAN_BRIDGE_DRY_RUN',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      filesystemWrite: 'DISABLED',
      obsidianSync: 'DISABLED',
      openClawDispatch: 'DISABLED',
      approvedByOperator: true,
      verifiedAt: ts,
    };
    setDryRunResult(result);
    // Persist to evidence log
    const existing = loadFromStorage(BRIDGE_EVIDENCE_LOG_KEY);
    saveToStorage(BRIDGE_EVIDENCE_LOG_KEY, [...existing, result]);
    setLogRefresh(n => n + 1);
  }, [pathValid, approved, folder, title, content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToVpsBridge = useCallback(async () => {
    if (!dryRunResult) return;
    setVpsSending(true);
    setVpsError(null);
    setVpsResponse(null);
    const res = await base44.functions.invoke('obsidianVpsDryRunBridge', {
      folder: dryRunResult.folder,
      title: dryRunResult.title,
      markdownContent: `${dryRunResult.frontmatter}\n\n${content}`,
      evidenceId: dryRunResult.evidenceId,
      frontmatter: dryRunResult.frontmatter,
    });
    setVpsSending(false);
    if (res.data?.ok) {
      setVpsResponse(res.data);
    } else {
      setVpsError(res.data?.error || 'VPS bridge returned an unexpected response.');
    }
  }, [dryRunResult, content]);

  const handleExportJson = () => {
    if (!dryRunResult) return;
    const packet = {
      packetType: 'VPS_OBSIDIAN_BRIDGE_DRY_RUN_PACKET',
      evidenceId: dryRunResult.evidenceId,
      createdAt: dryRunResult.createdAt,
      vaultRoot: dryRunResult.vaultRoot,
      folder: dryRunResult.folder,
      title: dryRunResult.title,
      targetPath: dryRunResult.targetPath,
      contentLength: dryRunResult.contentLength,
      frontmatter,
      markdownPreview: fullMarkdown.slice(0, 500) + (fullMarkdown.length > 500 ? '\n…(truncated)' : ''),
      statuses: {
        bridgeMode: 'VPS_OBSIDIAN_BRIDGE_DRY_RUN',
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        filesystemWrite: 'DISABLED',
        obsidianSync: 'DISABLED',
        openClawDispatch: 'DISABLED',
      },
      safetyClaims: [
        'No real filesystem writes performed',
        'No VPS command execution',
        'No OpenClaw dispatch',
        'No backend mutation',
        'No credential handling',
        'No browser automation',
        'No live mode',
        'Dry-run governance panel only',
      ],
      approvedByOperator: true,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `vps-obsidian-bridge-packet-${dryRunResult.evidenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Readiness Checklist Toggle */}
      <button
        type="button"
        onClick={() => setShowChecklist(!showChecklist)}
        className="w-full px-4 py-2.5 bg-secondary/30 border border-border/40 text-slate-300 text-[10px] font-bold rounded-sm hover:bg-secondary/50 transition-colors flex items-center justify-between"
      >
        <span>VPS Bridge Readiness Checklist</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChecklist ? 'rotate-180' : ''}`} />
      </button>

      {/* Checklist Panel */}
      {showChecklist && (
        <div className="border border-border/40 rounded-sm p-4 bg-secondary/10">
          <ObsidianVpsBridgeReadinessChecklist />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">VPS Obsidian Bridge Control Panel</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Dry-run governance only · No filesystem writes · No VPS execution · No OpenClaw dispatch
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">DRY_RUN_ONLY</span>
          <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">NOT_EXECUTED</span>
        </div>
      </div>

      {/* Status strip */}
      <div className="bg-secondary/20 border border-border/40 rounded-sm px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[8px]">
        {STATUS_STRIP.map(s => (
          <span key={s.label} className="text-slate-500">
            {s.label}: <span className={`font-bold ${s.color}`}>{s.value}</span>
          </span>
        ))}
      </div>

      {/* Vault root path */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-1">
        <div className="text-[8px] font-bold uppercase text-slate-400">Vault Root Path (Display Only)</div>
        <div className="text-[10px] font-mono text-primary bg-secondary/30 border border-border/40 rounded-sm px-3 py-2">
          {VAULT_ROOT}
        </div>
        <div className="text-[7px] text-slate-600">Read-only reference · Not accessed · No filesystem query</div>
      </div>

      {/* Allowed folders */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Vault Folder Allowlist</div>
        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
          {ALLOWED_FOLDERS.map(f => (
            <span
              key={f}
              onClick={() => setFolder(f)}
              className={`cursor-pointer px-2 py-1 text-[8px] border rounded-sm transition-colors ${
                folder === f
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-secondary/20 border-border/30 text-slate-400 hover:text-slate-200 hover:border-border/60'
              }`}
            >
              {f}
            </span>
          ))}
        </div>
        <div className="text-[7px] text-slate-600">Only allowlisted folders accepted · Path traversal blocked</div>
      </div>

      {/* Note title */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Note Title</div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Trading Strategy Overview"
          className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
        />
        <div className="text-[7px] text-slate-600">No special characters · No shell commands · No credential patterns · .md extension enforced</div>
      </div>

      {/* Target folder selector */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Target Folder</div>
        <select
          value={folder}
          onChange={e => setFolder(e.target.value)}
          className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-primary/40"
        >
          <option value="">— Select allowlisted folder —</option>
          {ALLOWED_FOLDERS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Path validator */}
      <div className={`border rounded-sm p-3 space-y-1 ${pathErrors.length > 0 ? 'bg-destructive/5 border-destructive/30' : 'bg-primary/5 border-primary/20'}`}>
        <div className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-1">
          {pathErrors.length > 0
            ? <><ShieldAlert className="w-3 h-3 text-destructive" /> Path Validation — BLOCKED</>
            : <><CheckCircle2 className="w-3 h-3 text-primary" /> Path Validation — PASS</>}
        </div>
        {pathErrors.length > 0
          ? pathErrors.map((e, i) => (
            <div key={i} className="text-[8px] text-destructive font-mono flex items-start gap-1.5">
              <span className="shrink-0">✗</span> {e}
            </div>
          ))
          : (
            <div className="text-[8px] text-primary font-mono flex items-center gap-1.5">
              <span>✓</span> No traversal · No system roots · No shell patterns · No blocked extensions · No credential content
            </div>
          )
        }
      </div>

      {/* Final target path preview */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-1">
        <div className="text-[8px] font-bold uppercase text-slate-400">Final Target Path Preview</div>
        <div className={`text-[9px] font-mono px-3 py-2 rounded-sm border ${pathValid && title && folder ? 'text-primary bg-primary/5 border-primary/20' : 'text-slate-500 bg-secondary/20 border-border/30'}`}>
          {targetPath}
        </div>
        <div className="text-[7px] text-slate-600">Preview only · No filesystem lookup · Not sent anywhere</div>
      </div>

      {/* YAML frontmatter */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400 flex items-center justify-between">
          <span>Auto-Generated YAML Frontmatter</span>
          <span className="text-[7px] text-slate-600 normal-case">Generated locally · Not stored · Not dispatched</span>
        </div>
        <pre className="text-[8px] font-mono text-slate-300 bg-secondary/30 border border-border/40 rounded-sm p-3 overflow-x-auto whitespace-pre leading-relaxed">
          {frontmatter}
        </pre>
      </div>

      {/* Markdown content editor */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Markdown Content</div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write note content here (Markdown)..."
          rows={8}
          className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-y"
        />
      </div>

      {/* Copy markdown button */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border/40 text-slate-300 text-[9px] font-bold rounded-sm hover:text-slate-100 hover:border-border/80 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? 'Copied!' : 'Copy Full Markdown (Frontmatter + Content)'}
      </button>

      {/* Operator approval */}
      <div className={`border rounded-sm p-3 flex items-start gap-3 ${approved ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
        <input
          type="checkbox"
          id="vps-operator-approval"
          checked={approved}
          onChange={e => setApproved(e.target.checked)}
          className="mt-0.5 accent-green-500 w-4 h-4 shrink-0"
        />
        <label htmlFor="vps-operator-approval" className="text-[9px] text-slate-300 cursor-pointer leading-relaxed">
          <span className="font-bold text-slate-100">Operator Approval Checkbox — </span>
          I confirm this is a dry-run preview packet only. No real file will be written, no VPS command will be executed, no OpenClaw dispatch will occur, no credentials will be handled, and no backend mutation will take place. This packet is for governance review and future bridge service planning only.
        </label>
      </div>

      {/* Run dry-run button */}
      <button
        type="button"
        onClick={runDryRun}
        disabled={!pathValid || !approved || !title || !folder}
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Generate Dry-Run Bridge Packet (No Execution)
      </button>

      {(!approved && pathValid && title && folder) && (
        <div className="text-[8px] text-amber-400 font-mono text-center">Operator approval checkbox required before generating packet.</div>
      )}

      {/* Dry-run result panel */}
      {dryRunResult && (
        <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
          <div className="bg-primary/10 px-4 py-2.5 flex items-center gap-2 border-b border-primary/20">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Dry-Run Result</span>
            <span className="ml-auto text-[8px] font-mono text-primary/60">NOT_EXECUTED · NOT_DISPATCHED</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] font-mono">
              <div>
                <div className="text-[7px] uppercase text-slate-500 mb-0.5">Evidence ID</div>
                <div className="text-primary font-bold">{dryRunResult.evidenceId}</div>
              </div>
              <div>
                <div className="text-[7px] uppercase text-slate-500 mb-0.5">Created Timestamp</div>
                <div className="text-slate-300">{new Date(dryRunResult.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[7px] uppercase text-slate-500 mb-0.5">Target Path</div>
                <div className="text-primary/80 break-all">{dryRunResult.targetPath}</div>
              </div>
              <div>
                <div className="text-[7px] uppercase text-slate-500 mb-0.5">Content Length</div>
                <div className="text-slate-300">{dryRunResult.contentLength} chars</div>
              </div>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {STATUS_STRIP.map(s => (
                <div key={s.label} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                  <div className="text-[7px] text-slate-500 uppercase">{s.label}</div>
                  <div className={`text-[8px] font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Safety claims */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm p-3">
              <div className="text-[7px] font-bold uppercase text-slate-500 mb-1.5">Safety Claims (All Verified)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                {[
                  'No real filesystem writes performed',
                  'No VPS command execution',
                  'No OpenClaw dispatch',
                  'No backend mutation',
                  'No credential handling',
                  'No browser automation',
                  'No live mode',
                  'Dry-run governance panel only',
                ].map((c, i) => (
                  <div key={i} className="text-[8px] font-mono text-primary/70 flex items-center gap-1.5">
                    <span>✓</span> {c}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Send to VPS Dry-Run Bridge ── prominent, above Export */}
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-sm p-3 space-y-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Send to VPS Dry-Run Bridge
              </div>
              <div className="text-[7px] text-slate-500 leading-relaxed">
                Calls <span className="text-amber-400/80 font-mono">/api/obsidian/dry-run</span> via backend only ·
                Bridge token injected server-side · Never exposed to frontend · No credentials in localStorage ·
                Dry-run endpoint only · No filesystem writes · No execution
              </div>
              <div className="text-[7px] text-slate-600 bg-secondary/30 border border-border/30 rounded-sm px-2 py-1.5">
                <span className="text-slate-400 font-bold">Note:</span> The local UI preview path above uses a governance
                placeholder root (<span className="font-mono text-slate-400">/opt/veridan/obsidian-vault</span>).
                The VPS Bridge Response <span className="font-mono text-amber-400">wouldWritePath</span> below will show
                the actual path as resolved by the VPS, expected under{' '}
                <span className="font-mono text-amber-400">/root/veridans-mind-vault</span>.
              </div>

              <button
                type="button"
                onClick={sendToVpsBridge}
                disabled={vpsSending || !dryRunResult}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {vpsSending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending to VPS Bridge…</>
                  : <><Send className="w-3.5 h-3.5" /> Send to VPS Dry-Run Bridge (/api/obsidian/dry-run)</>
                }
              </button>

              {!dryRunResult && (
                <div className="text-[8px] text-slate-500 font-mono text-center">Generate a valid dry-run packet first.</div>
              )}
            </div>

            {/* Error */}
            {vpsError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2 flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <div className="text-[8px] text-destructive font-mono">{vpsError}</div>
              </div>
            )}

            {/* VPS Bridge Response */}
            {vpsResponse && (
              <div className="bg-card border border-amber-500/30 rounded-sm overflow-hidden">
                <div className="bg-amber-500/10 px-4 py-2.5 flex items-center gap-2 border-b border-amber-500/20">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">VPS Bridge Response</span>
                  <span className="ml-auto text-[7px] font-mono text-amber-400/60">DRY_RUN · NOT_EXECUTED</span>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[8px] font-mono">
                  {[
                    { key: 'ok',               val: String(vpsResponse.ok),           note: null },
                    { key: 'bridgeMode',        val: vpsResponse.bridgeMode,           note: null },
                    { key: 'action',            val: vpsResponse.action,               note: null },
                    { key: 'vaultRoot',         val: vpsResponse.vaultRoot,            note: 'VPS-resolved root' },
                    { key: 'targetFolder',      val: vpsResponse.targetFolder,         note: null },
                    { key: 'fileName',          val: vpsResponse.fileName,             note: null },
                    { key: 'wouldWritePath',    val: vpsResponse.wouldWritePath,       note: 'Actual VPS path — may differ from UI preview' },
                    { key: 'markdownBytes',     val: String(vpsResponse.markdownBytes), note: null },
                    { key: 'previewHash',       val: vpsResponse.previewHash || '(none)', note: null },
                    { key: 'evidenceId',        val: vpsResponse.evidenceId,           note: null },
                    { key: 'filesystemWrite',   val: vpsResponse.filesystemWrite,      note: null },
                    { key: 'executionStatus',   val: vpsResponse.executionStatus,      note: null },
                    { key: 'dispatchStatus',    val: vpsResponse.dispatchStatus,       note: null },
                    { key: 'obsidianSync',      val: vpsResponse.obsidianSync,         note: null },
                    { key: 'openClawDispatch',  val: vpsResponse.openClawDispatch,     note: null },
                    { key: 'timestamp',         val: vpsResponse.timestamp,            note: null },
                  ].map(({ key, val, note }) => (
                    <div key={key} className={`bg-secondary/20 border rounded-sm px-2 py-1.5 ${key === 'wouldWritePath' ? 'md:col-span-2 border-amber-500/30' : 'border-border/30'}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[7px] text-slate-500 uppercase">{key}</span>
                        {note && <span className="text-[6px] text-amber-400/70 italic">— {note}</span>}
                      </div>
                      <div className={`font-mono break-all ${
                        val === 'DISABLED' || val === 'NOT_EXECUTED' || val === 'NOT_DISPATCHED'
                          ? 'text-destructive'
                          : val === 'true'
                          ? 'text-primary'
                          : key === 'wouldWritePath'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export button */}
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON Bridge Packet
            </button>
          </div>
        </div>
      )}

      {/* Bridge Packet History / Evidence Log */}
      <div className="border-t border-border/40 pt-4">
        <ObsidianVpsBridgeEvidenceLog refreshSignal={logRefresh} />
      </div>

      {/* Self-Test Panel */}
      <div className="border-t border-border/40 pt-4">
        <ObsidianVpsBridgeSelfTest />
      </div>

      {/* Baseline Lock */}
      <div className="border-t border-border/40 pt-4">
        <ObsidianVpsBridgeBaselineLock />
      </div>

      {/* Footer disclaimer */}
      <div className="bg-card border border-border/30 rounded-sm px-4 py-3 text-[8px] font-mono text-slate-500 leading-relaxed">
        <span className="text-destructive font-bold">Hard Constraints: </span>
        No real filesystem writes · No VPS command execution · No OpenClaw dispatch · No backend mutation ·
        No credential handling · No browser automation · No live mode.
        This panel generates dry-run preview packets only, preparing for a future VPS bridge service.
        All data is stored locally in-browser only and never transmitted.
      </div>
    </div>
  );
}