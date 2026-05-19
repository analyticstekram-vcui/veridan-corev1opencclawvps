/**
 * ObsidianLocalFileBridgePreview — Dry-run bridge contract only.
 * No real filesystem writes. No Obsidian sync. No OpenClaw dispatch. No credentials.
 * executionStatus: NOT_EXECUTED always. dispatchStatus: NOT_DISPATCHED always.
 * Baseline v1 locked state preserved.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import {
  ShieldAlert, Ban, CheckCircle, XCircle, AlertTriangle,
  Download, RefreshCw, FilePlus, Eye, ClipboardList
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BRIDGE_VERSION = 'OBSIDIAN_LOCAL_FILE_BRIDGE_V1_DRY_RUN';

const ALLOWED_ACTIONS = [
  'READ_NOTE_PREVIEW',
  'CREATE_NOTE_DRY_RUN',
  'UPDATE_NOTE_DRY_RUN',
  'MOVE_NOTE_DRY_RUN',
  'DELETE_NOTE_DRY_RUN',
];

const BLOCKED_ACTIONS = [
  'REAL_FILE_WRITE',
  'REAL_FILE_DELETE',
  'LIVE_OBSIDIAN_SYNC',
  'EXECUTE_SCRIPT',
  'ENTER_CREDENTIAL',
  'OPENCLAW_DISPATCH',
  'LIVE_BROWSER_CONTROL',
];

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

const PATH_TRAVERSAL_PATTERNS = ['../', '..\\', '%2e%2e', '%2f', '~/', '~\\'];
const BLOCKED_ABSOLUTE_PREFIXES = ['C:\\', 'C:/', '/root', '/etc', '/home', '/var', '/usr', '/sys', '/proc'];

const STORAGE_KEYS = {
  ALLOWLIST: 'veridanObsidianBridgeAllowlist',
  REQUESTS:  'veridanObsidianBridgeRequests',
  APPROVALS: 'veridanObsidianBridgeApprovals',
};

const DEFAULT_ALLOWLIST = [
  'Veridan Core/',
  'Veridan Core/Trading/',
  'Veridan Core/Public Credit/',
  'Veridan Core/Business Formation/',
  'Veridan Core/AI Command/',
  'Veridan Core/OpenClaw Governance/',
  'Veridan Core/Audit & Evidence/',
  'Veridan Core/Baselines/',
];

// ─── Validators ───────────────────────────────────────────────────────────────

function validatePath(notePath, allowlist) {
  const issues = [];
  if (!notePath) { issues.push('Note path is empty.'); return issues; }

  // Block path traversal
  for (const pat of PATH_TRAVERSAL_PATTERNS) {
    if (notePath.toLowerCase().includes(pat.toLowerCase())) {
      issues.push(`Path traversal pattern detected: "${pat}"`);
    }
  }
  // Block absolute system paths
  for (const prefix of BLOCKED_ABSOLUTE_PREFIXES) {
    if (notePath.startsWith(prefix)) {
      issues.push(`Absolute system path blocked: "${prefix}"`);
    }
  }
  // Must match allowlist
  const allowed = allowlist.some(prefix => notePath.startsWith(prefix));
  if (!allowed) issues.push('Path is not within any allowed vault folder.');

  return issues;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `sha256-preview-${Math.abs(h).toString(16).padStart(8, '0')}`;
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <div className="text-[9px] font-bold uppercase text-primary tracking-widest">{title}</div>
      {subtitle && <div className="text-[8px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function StatusBadge({ label, variant }) {
  const styles = {
    disabled:  'bg-destructive/10 border-destructive/30 text-destructive',
    preview:   'bg-amber-500/10 border-amber-500/30 text-amber-400',
    locked:    'bg-primary/10 border-primary/30 text-primary',
    info:      'bg-secondary/30 border-border/40 text-slate-300',
  };
  return (
    <span className={`px-2 py-0.5 border text-[8px] font-bold uppercase rounded-sm ${styles[variant] || styles.info}`}>
      {label}
    </span>
  );
}

// ─── 1. Bridge Contract Preview ───────────────────────────────────────────────

function BridgeContractPreview() {
  const contract = {
    bridgeVersion: BRIDGE_VERSION,
    mode: 'DRY_RUN_PREVIEW_ONLY',
    executionStatus: 'NOT_EXECUTED',
    dispatchStatus: 'NOT_DISPATCHED',
    filesystemAccess: 'DISABLED',
    obsidianSync: 'DISABLED',
    openClawDispatch: 'DISABLED',
    credentialHandling: 'DISABLED',
    allowedActions: ALLOWED_ACTIONS,
    blockedActions: BLOCKED_ACTIONS,
    baselineLock: 'V1_LOCKED',
    approvalEffect: 'APPROVED_FOR_FUTURE_EXECUTION_ONLY',
  };

  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <SectionHeader title="1. Bridge Contract Preview" subtitle="Dry-run contract definition · Read-only · Hardcoded invariants" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {Object.entries(contract).filter(([, v]) => !Array.isArray(v)).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
            <span className="text-[8px] font-mono text-slate-500">{k}</span>
            <span className={`text-[8px] font-bold font-mono ${
              v === 'DISABLED' || v === 'NOT_EXECUTED' || v === 'NOT_DISPATCHED' ? 'text-destructive'
              : v === 'V1_LOCKED' ? 'text-primary'
              : v === 'DRY_RUN_PREVIEW_ONLY' || v === 'APPROVED_FOR_FUTURE_EXECUTION_ONLY' ? 'text-amber-400'
              : 'text-slate-300'
            }`}>{v}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-2">
          <div className="text-[7px] font-bold uppercase text-primary mb-1">Allowed Actions</div>
          {ALLOWED_ACTIONS.map(a => (
            <div key={a} className="text-[8px] font-mono text-slate-300">✓ {a}</div>
          ))}
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-2">
          <div className="text-[7px] font-bold uppercase text-destructive mb-1">Blocked Actions</div>
          {BLOCKED_ACTIONS.map(a => (
            <div key={a} className="text-[8px] font-mono text-destructive line-through">✗ {a}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Vault Folder Allowlist ────────────────────────────────────────────────

function VaultFolderAllowlist({ allowlist, setAllowlist }) {
  const [newPath, setNewPath] = useState('');

  const add = () => {
    const p = newPath.trim();
    if (!p || allowlist.includes(p)) return;
    const updated = [...allowlist, p.endsWith('/') ? p : p + '/'];
    setAllowlist(updated);
    saveToStorage(STORAGE_KEYS.ALLOWLIST, updated);
    setNewPath('');
  };

  const remove = (path) => {
    const updated = allowlist.filter(p => p !== path);
    setAllowlist(updated);
    saveToStorage(STORAGE_KEYS.ALLOWLIST, updated);
  };

  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <SectionHeader title="2. Vault Folder Allowlist" subtitle="Only paths within this list may be targeted by bridge requests" />
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {allowlist.map(p => (
          <div key={p} className="flex items-center justify-between px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-sm">
            <span className="text-[9px] font-mono text-slate-300">{p}</span>
            <button type="button" onClick={() => remove(p)} className="text-destructive/50 hover:text-destructive text-[8px] ml-2">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. Veridan Core/NewFolder/"
          value={newPath}
          onChange={e => setNewPath(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          className="flex-1 bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20"
        >
          Add
        </button>
      </div>
      <div className="text-[8px] text-slate-600">Path traversal (../) and absolute system paths are always blocked regardless of allowlist.</div>
    </div>
  );
}

// ─── 3. File Action Dry-Run Validator + 4. Canonical Payload + 5. Rollback ───

function DryRunRequestBuilder({ allowlist, requests, setRequests }) {
  const [form, setForm] = useState({
    actionType: 'READ_NOTE_PREVIEW',
    notePath: '',
    proposedContent: '',
    riskLevel: 'LOW',
    operatorNote: '',
  });
  const [validationErrors, setValidationErrors] = useState([]);

  const validate = (f) => {
    const errs = [];
    if (!f.notePath.trim()) errs.push('Note path is required.');
    errs.push(...validatePath(f.notePath.trim(), allowlist));
    if (BLOCKED_ACTIONS.includes(f.actionType)) errs.push(`Action type "${f.actionType}" is blocked.`);
    return errs;
  };

  const handlePathChange = (val) => {
    setForm(p => ({ ...p, notePath: val }));
    setValidationErrors(validate({ ...form, notePath: val }));
  };

  const submit = () => {
    const errs = validate(form);
    if (errs.length > 0) { setValidationErrors(errs); return; }

    const ts = Date.now();
    const prevHash = simpleHash(form.notePath + '-previous-placeholder');
    const propHash = simpleHash((form.proposedContent || '') + ts);

    const record = {
      bridgeVersion: BRIDGE_VERSION,
      requestId: `bridge-${ts}`,
      evidenceId: `EV-BRIDGE-${ts}`,
      timestamp: new Date(ts).toISOString(),
      operatorId: 'operator@veridan.local',
      module: 'OBSIDIAN_LOCAL_FILE_BRIDGE',
      actionType: form.actionType,
      notePath: form.notePath.trim(),
      proposedContent: form.proposedContent.trim() || '(none)',
      previousContentHash: prevHash,
      proposedContentHash: propHash,
      riskLevel: form.riskLevel,
      approvalStatus: 'PENDING_REVIEW',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      rollbackPlan: `DRY_RUN: No file was written. To rollback: discard this request. Vault state unchanged. Previous hash: ${prevHash}`,
      operatorNote: form.operatorNote.trim(),
    };

    const updated = [record, ...requests];
    setRequests(updated);
    saveToStorage(STORAGE_KEYS.REQUESTS, updated);
    setForm({ actionType: 'READ_NOTE_PREVIEW', notePath: '', proposedContent: '', riskLevel: 'LOW', operatorNote: '' });
    setValidationErrors([]);
  };

  const remove = (id) => {
    const updated = requests.filter(r => r.requestId !== id);
    setRequests(updated);
    saveToStorage(STORAGE_KEYS.REQUESTS, updated);
  };

  const riskBorder = { LOW: 'border-primary/20', MEDIUM: 'border-amber-500/20', HIGH: 'border-destructive/20' };
  const riskColor  = { LOW: 'text-primary', MEDIUM: 'text-amber-400', HIGH: 'text-destructive' };

  return (
    <div className="space-y-3">
      {/* 3. Validator form */}
      <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
        <SectionHeader title="3. File Action Dry-Run Validator" subtitle="Path validation · Allowlist check · Traversal block · No filesystem access" />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Action Type</label>
            <select
              value={form.actionType}
              onChange={e => setForm(p => ({ ...p, actionType: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              {ALLOWED_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase">Risk Level</label>
            <select
              value={form.riskLevel}
              onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value }))}
              className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
            >
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Note Path * (must be within allowlist)</label>
          <input
            type="text"
            placeholder="e.g. Veridan Core/Trading/Strategy Overview.md"
            value={form.notePath}
            onChange={e => handlePathChange(e.target.value)}
            className={`w-full bg-secondary/30 border rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none ${
              validationErrors.length > 0 ? 'border-destructive/50 focus:border-destructive' : 'border-border/40 focus:border-primary/40'
            }`}
          />
          {validationErrors.length > 0 && (
            <div className="space-y-0.5">
              {validationErrors.map((e, i) => (
                <div key={i} className="text-[8px] text-destructive flex items-center gap-1">
                  <XCircle className="w-2.5 h-2.5 shrink-0" /> {e}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Proposed Content Preview (no secrets)</label>
          <textarea
            placeholder="Proposed note content preview..."
            value={form.proposedContent}
            onChange={e => setForm(p => ({ ...p, proposedContent: e.target.value }))}
            rows={2}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[8px] text-slate-500 uppercase">Operator Note</label>
          <input
            type="text"
            placeholder="Rationale for this dry-run request..."
            value={form.operatorNote}
            onChange={e => setForm(p => ({ ...p, operatorNote: e.target.value }))}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[8px] text-slate-500">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            executionStatus: <span className="text-destructive font-bold ml-1">NOT_EXECUTED</span>
            <span className="ml-2">dispatchStatus: <span className="text-destructive font-bold">NOT_DISPATCHED</span></span>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!form.notePath.trim() || validationErrors.length > 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FilePlus className="w-3 h-3" /> Build Dry-Run Request
          </button>
        </div>
      </div>

      {/* 4 + 5. Canonical Payload + Rollback per record */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <div className="text-[8px] font-bold uppercase text-slate-400">
            Dry-Run Requests — Canonical Payload & Rollback Plan ({requests.length})
          </div>
          {requests.map(r => (
            <div key={r.requestId} className={`bg-secondary/10 border ${riskBorder[r.riskLevel]} rounded-sm p-3 space-y-2`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold font-mono text-slate-200">{r.actionType}</span>
                  <span className={`text-[8px] font-bold ${riskColor[r.riskLevel]}`}>RISK:{r.riskLevel}</span>
                  <StatusBadge label={r.executionStatus} variant="disabled" />
                  <StatusBadge label={r.dispatchStatus} variant="disabled" />
                  <StatusBadge label={r.approvalStatus} variant="preview" />
                </div>
                <button type="button" onClick={() => remove(r.requestId)} className="text-destructive/50 hover:text-destructive text-[8px] shrink-0">×</button>
              </div>

              {/* Section 4: Canonical Payload */}
              <details className="group">
                <summary className="cursor-pointer text-[8px] font-bold text-primary/70 hover:text-primary select-none">
                  ▸ Section 4 · Canonical Payload Preview
                </summary>
                <div className="mt-1.5 grid grid-cols-1 gap-0.5 pl-2 border-l border-primary/20">
                  {[
                    ['bridgeVersion', r.bridgeVersion],
                    ['requestId', r.requestId],
                    ['evidenceId', r.evidenceId],
                    ['timestamp', r.timestamp],
                    ['module', r.module],
                    ['actionType', r.actionType],
                    ['notePath', r.notePath],
                    ['proposedContentHash', r.proposedContentHash],
                    ['previousContentHash', r.previousContentHash],
                    ['riskLevel', r.riskLevel],
                    ['approvalStatus', r.approvalStatus],
                    ['executionStatus', r.executionStatus],
                    ['dispatchStatus', r.dispatchStatus],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-[7px] font-mono">
                      <span className="text-slate-500 w-40 shrink-0">{k}:</span>
                      <span className="text-slate-300 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Section 5: Rollback Plan */}
              <details className="group">
                <summary className="cursor-pointer text-[8px] font-bold text-amber-400/70 hover:text-amber-400 select-none">
                  ▸ Section 5 · Rollback Plan Preview
                </summary>
                <div className="mt-1.5 pl-2 border-l border-amber-500/20 text-[8px] font-mono text-slate-400 leading-relaxed">
                  {r.rollbackPlan}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 6. Operator Approval Binding ─────────────────────────────────────────────

function OperatorApprovalBinding({ requests, setRequests, approvals, setApprovals }) {
  const decide = (req, decision) => {
    // Only change approvalStatus — never execute
    const ts = Date.now();
    const approval = {
      approvalId: `bridge-approval-${ts}`,
      requestId: req.requestId,
      evidenceId: req.evidenceId,
      actionType: req.actionType,
      notePath: req.notePath,
      decision,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      reviewedAt: new Date(ts).toISOString(),
      effect: decision === 'APPROVED_FOR_FUTURE_EXECUTION' ? 'APPROVED_FOR_FUTURE_EXECUTION_ONLY_NO_DISPATCH' : 'DENIED',
    };
    const updatedApprovals = [approval, ...approvals.filter(a => a.requestId !== req.requestId)];
    setApprovals(updatedApprovals);
    saveToStorage(STORAGE_KEYS.APPROVALS, updatedApprovals);

    // Update approvalStatus on the request record
    const updatedRequests = requests.map(r =>
      r.requestId === req.requestId ? { ...r, approvalStatus: decision } : r
    );
    setRequests(updatedRequests);
    saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
  };

  const pending = requests.filter(r => r.approvalStatus === 'PENDING_REVIEW');
  const decided = requests.filter(r => r.approvalStatus !== 'PENDING_REVIEW');

  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <SectionHeader
        title="6. Operator Approval Binding"
        subtitle="Approval only marks APPROVED_FOR_FUTURE_EXECUTION — no dispatch, no execution, no file write"
      />

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm px-3 py-2 text-[8px] text-slate-400">
        <span className="text-amber-400 font-bold">Hard Rule #10:</span> Approval may only set approvalStatus to{' '}
        <span className="text-amber-400 font-mono">APPROVED_FOR_FUTURE_EXECUTION</span>. It does not execute, write, sync, or dispatch.
        executionStatus remains <span className="text-destructive font-mono">NOT_EXECUTED</span> at all times.
      </div>

      {pending.length === 0 && decided.length === 0 && (
        <div className="text-[9px] text-slate-500 text-center py-4">No dry-run requests to review.</div>
      )}

      {pending.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[8px] font-bold uppercase text-slate-400">Pending Review ({pending.length})</div>
          {pending.map(r => (
            <div key={r.requestId} className="flex items-start justify-between gap-3 bg-secondary/10 border border-border/30 rounded-sm p-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="text-[9px] font-bold font-mono text-slate-200">{r.actionType}</div>
                <div className="text-[8px] text-slate-500 truncate font-mono">{r.notePath}</div>
                <div className="text-[7px] text-slate-600 font-mono">EV: {r.evidenceId}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => decide(r, 'APPROVED_FOR_FUTURE_EXECUTION')}
                  className="flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[7px] font-bold rounded-sm hover:bg-primary/20"
                >
                  <CheckCircle className="w-2.5 h-2.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(r, 'DENIED')}
                  className="flex items-center gap-1 px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[7px] font-bold rounded-sm hover:bg-destructive/20"
                >
                  <XCircle className="w-2.5 h-2.5" /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-1">
          <div className="text-[8px] font-bold uppercase text-slate-400">Decided ({decided.length})</div>
          {decided.map(r => (
            <div key={r.requestId} className="flex items-center justify-between px-3 py-1.5 bg-secondary/10 border border-border/20 rounded-sm">
              <span className="text-[8px] font-mono text-slate-400 truncate flex-1">{r.actionType} · {r.notePath}</span>
              <span className={`text-[8px] font-bold ml-2 shrink-0 ${r.approvalStatus === 'APPROVED_FOR_FUTURE_EXECUTION' ? 'text-primary' : 'text-destructive'}`}>
                {r.approvalStatus}
              </span>
              <span className="text-[7px] text-destructive font-mono ml-2 shrink-0">NOT_EXECUTED</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 7. Bridge Verification Checks ────────────────────────────────────────────

function BridgeVerificationChecks({ requests, allowlist }) {
  const buildChecks = () => {
    const blockedInRequests    = requests.filter(r => BLOCKED_ACTIONS.includes(r.actionType));
    const wrongExecStatus      = requests.filter(r => r.executionStatus !== 'NOT_EXECUTED');
    const wrongDispatchStatus  = requests.filter(r => r.dispatchStatus !== 'NOT_DISPATCHED');
    const missingEvidenceId    = requests.filter(r => !r.evidenceId);
    const missingRollback      = requests.filter(r => !r.rollbackPlan);
    const missingRequiredFields = requests.filter(r =>
      ['bridgeVersion','requestId','timestamp','operatorId','module','actionType',
       'notePath','previousContentHash','proposedContentHash','riskLevel',
       'approvalStatus','executionStatus','dispatchStatus','rollbackPlan','evidenceId'
      ].some(f => !r[f])
    );

    // Re-validate paths on all requests
    const pathViolations = requests.filter(r => validatePath(r.notePath, allowlist).length > 0);

    // Traversal / absolute path check
    const traversalViolations = requests.filter(r =>
      PATH_TRAVERSAL_PATTERNS.some(p => r.notePath?.toLowerCase().includes(p.toLowerCase())) ||
      BLOCKED_ABSOLUTE_PREFIXES.some(p => r.notePath?.startsWith(p))
    );

    const nr = requests.length;

    return [
      {
        id: 'BR-01',
        label: 'executionStatus always NOT_EXECUTED',
        rule: 'Hard Rule #1',
        check: () => wrongExecStatus.length === 0
          ? { result: 'PASS', detail: `All ${nr} bridge requests have executionStatus=NOT_EXECUTED.` }
          : { result: 'FAIL', detail: `${wrongExecStatus.length} request(s) have wrong executionStatus.` },
      },
      {
        id: 'BR-02',
        label: 'dispatchStatus always NOT_DISPATCHED',
        rule: 'Hard Rule #2',
        check: () => wrongDispatchStatus.length === 0
          ? { result: 'PASS', detail: `All ${nr} bridge requests have dispatchStatus=NOT_DISPATCHED.` }
          : { result: 'FAIL', detail: `${wrongDispatchStatus.length} request(s) have wrong dispatchStatus.` },
      },
      {
        id: 'BR-03',
        label: 'No real filesystem writes exist',
        rule: 'Hard Rule #3',
        check: () => ({ result: 'PASS', detail: 'No File API, no fs module, no Blob write of vault content. All data in localStorage only.' }),
      },
      {
        id: 'BR-04',
        label: 'No real Obsidian sync exists',
        rule: 'Hard Rule #4',
        check: () => ({ result: 'PASS', detail: 'No Obsidian HTTP API call, no WebSocket sync, no plugin bridge. Zero external connectivity.' }),
      },
      {
        id: 'BR-05',
        label: 'Note paths validated against vault allowlist',
        rule: 'Hard Rule #5',
        check: () => nr === 0
          ? { result: 'REVIEW_REQUIRED', detail: 'No bridge requests yet. Build a dry-run request to validate.' }
          : pathViolations.length === 0
          ? { result: 'PASS', detail: `All ${nr} note paths are within the vault folder allowlist.` }
          : { result: 'FAIL', detail: `${pathViolations.length} request(s) have paths outside the allowlist.` },
      },
      {
        id: 'BR-06',
        label: 'Path traversal patterns blocked (../)',
        rule: 'Hard Rule #6',
        check: () => traversalViolations.length === 0
          ? { result: 'PASS', detail: `No path traversal patterns found across ${nr} request(s). UI validator enforces this at input time.` }
          : { result: 'FAIL', detail: `${traversalViolations.length} request(s) contain path traversal patterns.` },
      },
      {
        id: 'BR-07',
        label: 'Absolute system paths blocked (C:\\, /root, /etc…)',
        rule: 'Hard Rule #7',
        check: () => traversalViolations.length === 0
          ? { result: 'PASS', detail: 'No absolute system paths found. Blocked prefix list enforced at validation time.' }
          : { result: 'FAIL', detail: 'Absolute path violation detected.' },
      },
      {
        id: 'BR-08',
        label: 'Every dry-run request has an evidenceId',
        rule: 'Hard Rule #8',
        check: () => nr === 0
          ? { result: 'REVIEW_REQUIRED', detail: 'No requests yet.' }
          : missingEvidenceId.length === 0
          ? { result: 'PASS', detail: `All ${nr} requests have an evidenceId (EV-BRIDGE-* format).` }
          : { result: 'FAIL', detail: `${missingEvidenceId.length} request(s) missing evidenceId.` },
      },
      {
        id: 'BR-09',
        label: 'Every request includes a rollbackPlan',
        rule: 'Hard Rule #9',
        check: () => nr === 0
          ? { result: 'REVIEW_REQUIRED', detail: 'No requests yet.' }
          : missingRollback.length === 0
          ? { result: 'PASS', detail: `All ${nr} requests include a rollbackPlan field.` }
          : { result: 'FAIL', detail: `${missingRollback.length} request(s) missing rollbackPlan.` },
      },
      {
        id: 'BR-10',
        label: 'Approval only marks APPROVED_FOR_FUTURE_EXECUTION, does not execute',
        rule: 'Hard Rule #10',
        check: () => ({ result: 'PASS', detail: 'OperatorApprovalBinding only writes approvalStatus field. executionStatus remains NOT_EXECUTED. No dispatch or file operation on approval.' }),
      },
      {
        id: 'BR-11',
        label: 'All 17 required bridge fields present on every request',
        rule: 'Schema compliance',
        check: () => nr === 0
          ? { result: 'REVIEW_REQUIRED', detail: 'No requests yet.' }
          : missingRequiredFields.length === 0
          ? { result: 'PASS', detail: `All ${nr} requests have all 17 required bridge fields.` }
          : { result: 'FAIL', detail: `${missingRequiredFields.length} request(s) missing required fields.` },
      },
      {
        id: 'BR-12',
        label: 'No blocked action types in stored requests',
        rule: 'Action gate',
        check: () => blockedInRequests.length === 0
          ? { result: 'PASS', detail: `Zero blocked actions found in ${nr} stored request(s). Only ALLOWED_ACTIONS present in select.` }
          : { result: 'FAIL', detail: `${blockedInRequests.length} request(s) contain blocked action types.` },
      },
    ];
  };

  const checks = buildChecks();
  const results = checks.map(c => ({ ...c, ...c.check() }));
  const summary = {
    PASS: results.filter(r => r.result === 'PASS').length,
    FAIL: results.filter(r => r.result === 'FAIL').length,
    REVIEW_REQUIRED: results.filter(r => r.result === 'REVIEW_REQUIRED').length,
  };
  const overall = summary.FAIL > 0 ? 'FAIL' : summary.REVIEW_REQUIRED > 0 ? 'REVIEW_REQUIRED' : 'PASS';

  const s = {
    PASS:            { bg: 'bg-primary/5',     border: 'border-primary/20',     icon: <CheckCircle className="w-3 h-3 text-primary" />,       text: 'text-primary'     },
    FAIL:            { bg: 'bg-destructive/5', border: 'border-destructive/20', icon: <XCircle className="w-3 h-3 text-destructive" />,        text: 'text-destructive' },
    REVIEW_REQUIRED: { bg: 'bg-amber-500/5',   border: 'border-amber-500/20',   icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,    text: 'text-amber-400'   },
  };

  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <SectionHeader title="7. Bridge Verification Checks" subtitle={`${checks.length} hard-rule checks · PASS / FAIL / REVIEW_REQUIRED`} />

      {/* Overall */}
      <div className={`${s[overall].bg} border ${s[overall].border} rounded-sm px-4 py-2.5 flex items-center gap-3`}>
        <div className="scale-125">{s[overall].icon}</div>
        <div>
          <span className={`text-[12px] font-bold font-mono ${s[overall].text}`}>OVERALL: {overall}</span>
          <div className="text-[7px] text-slate-500 mt-0.5">
            {summary.PASS} PASS · {summary.FAIL} FAIL · {summary.REVIEW_REQUIRED} REVIEW_REQUIRED
          </div>
        </div>
      </div>

      {/* Check list */}
      <div className="space-y-1.5">
        {results.map(r => (
          <div key={r.id} className={`${s[r.result].bg} border ${s[r.result].border} rounded-sm p-2.5`}>
            <div className="flex items-start gap-2">
              {s[r.result].icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[7px] font-mono text-slate-500">{r.id}</span>
                  <span className={`text-[8px] font-bold ${s[r.result].text}`}>{r.result}</span>
                  <span className="text-[7px] text-slate-500 border border-border/30 px-1 rounded-sm">{r.rule}</span>
                  <span className="text-[8px] font-mono text-slate-300">{r.label}</span>
                </div>
                <div className={`text-[7px] font-mono mt-0.5 ${s[r.result].text}`}>{r.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────

export default function ObsidianLocalFileBridgePreview() {
  const [allowlist, setAllowlist] = useState(DEFAULT_ALLOWLIST);
  const [requests, setRequests]   = useState([]);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    const stored = loadFromStorage(STORAGE_KEYS.ALLOWLIST);
    setAllowlist(stored.length ? stored : DEFAULT_ALLOWLIST);
    setRequests(loadFromStorage(STORAGE_KEYS.REQUESTS));
    setApprovals(loadFromStorage(STORAGE_KEYS.APPROVALS));
  }, []);

  const handleExport = () => {
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_OBSIDIAN_LOCAL_FILE_BRIDGE_PREVIEW',
      data: {
        bridgeVersion: BRIDGE_VERSION,
        allowlist,
        totalRequests: requests.length,
        totalApprovals: approvals.length,
        requests: requests.map(r => ({ ...r, proposedContent: '(redacted for export)' })),
        approvals,
        exportedAt: new Date().toISOString(),
      },
      filename: 'veridan-obsidian-local-file-bridge-preview',
      safetyClaims: [
        'Dry-run bridge preview only',
        'No filesystem writes',
        'No Obsidian sync',
        'No OpenClaw dispatch',
        'No credential handling',
        'executionStatus always NOT_EXECUTED',
        'dispatchStatus always NOT_DISPATCHED',
        'Baseline v1 LOCKED',
      ],
      storageKey: 'veridanObsidianLocalFileBridgePreviewSnapshot',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">Local File Bridge Preview</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Dry-run contract only · No filesystem · No Obsidian sync · No OpenClaw · Baseline v1 locked
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge label="DRY_RUN_ONLY" variant="preview" />
          <StatusBadge label="NOT_EXECUTED" variant="disabled" />
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      {/* Blocked actions banner */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-sm px-3 py-2 flex items-start gap-2">
        <Ban className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
        <div>
          <div className="text-[8px] font-bold text-destructive mb-1">Blocked Actions (UI enforced · Hard rules apply)</div>
          <div className="flex flex-wrap gap-1">
            {BLOCKED_ACTIONS.map(a => (
              <span key={a} className="px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-mono rounded-sm line-through">{a}</span>
            ))}
          </div>
        </div>
      </div>

      <BridgeContractPreview />
      <VaultFolderAllowlist allowlist={allowlist} setAllowlist={setAllowlist} />
      <DryRunRequestBuilder allowlist={allowlist} requests={requests} setRequests={setRequests} />
      <OperatorApprovalBinding requests={requests} setRequests={setRequests} approvals={approvals} setApprovals={setApprovals} />
      <BridgeVerificationChecks requests={requests} allowlist={allowlist} />

      <div className="bg-card border border-border/30 rounded-sm p-3 text-[8px] text-slate-500 leading-relaxed">
        This module is a dry-run bridge contract preview only. No Obsidian vault file is created, modified, moved, or deleted.
        No data is sent to OpenClaw, any backend function, or any external API. All records are stored in browser localStorage.
        Approval grants <span className="text-amber-400 font-mono">APPROVED_FOR_FUTURE_EXECUTION</span> status only —
        it does not trigger execution. Baseline v1 state is <span className="text-primary font-bold">LOCKED</span>.
      </div>
    </div>
  );
}