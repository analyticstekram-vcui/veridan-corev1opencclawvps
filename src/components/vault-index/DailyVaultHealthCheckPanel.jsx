/**
 * DailyVaultHealthCheckPanel
 * Safe read-only daily health check for the Obsidian vault system.
 *
 * Safety guarantees — this panel NEVER:
 * - Writes vault files
 * - Mutates backend entities (drafts, audits)
 * - Approves drafts
 * - Repairs metadata
 * - Calls OpenClaw
 * - Calls InvokeLLM
 * - Runs browser automation
 * - Accesses credentials
 * - Deletes records
 *
 * It ONLY reads: loadDraftsFromBackend, loadAuditsFromBackend, localStorage size checks.
 * Export is a local browser download only.
 */

import React, { useState, useCallback } from 'react';
import {
  Activity, RefreshCw, Download, CheckCircle2, AlertTriangle,
  XCircle, Shield, ChevronDown, ChevronRight, ShieldCheck,
  Database, HardDrive, FileText, AlertCircle, Clock,
} from 'lucide-react';
import { loadDraftsFromBackend, loadAuditsFromBackend } from '@/lib/obsidianDraftStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const CREDENTIAL_FIELDS = ['credentialRef', 'brokerKey', 'apiKey', 'token', 'secret', 'password'];
const LS_CACHE_KEYS = ['veridan_obsidian_drafts', 'veridan_obsidian_drafts_cache', 'veridan_obsidian_write_audits'];
const LS_WARN_BYTES = 400 * 1024;
const LS_FAIL_BYTES = 900 * 1024;

const VERIFICATIONS = [
  'No vault files written',
  'No backend entity mutations',
  'No draft approvals',
  'No metadata repair',
  'No OpenClaw dispatch',
  'No browser automation',
  'No credentials accessed',
  'No InvokeLLM calls',
  'Reads VeridanObsidianDraft entity only (list, read-only)',
  'Reads VeridanObsidianWriteAudit entity only (list, read-only)',
  'Export is local browser download — no backend write',
];

// ── Health check logic ────────────────────────────────────────────────────────

function checkLocalStorage() {
  try {
    let totalBytes = 0;
    let hasLargeContent = false;
    for (const key of LS_CACHE_KEYS) {
      const val = localStorage.getItem(key) || '';
      totalBytes += val.length;
      // Large content check: any single key over 100KB is suspicious
      if (val.length > 100 * 1024) hasLargeContent = true;
    }
    const kb = Math.round(totalBytes / 1024);
    if (totalBytes >= LS_FAIL_BYTES) return { status: 'FAIL', detail: `Cache ${kb}KB — exceeds safe limit`, kb, hasLargeContent };
    if (totalBytes >= LS_WARN_BYTES || hasLargeContent) return { status: 'WARN', detail: `Cache ${kb}KB — above threshold${hasLargeContent ? ' (large content detected)' : ''}`, kb, hasLargeContent };
    return { status: 'PASS', detail: `Cache ${kb}KB — within safe limits`, kb, hasLargeContent };
  } catch (e) {
    return { status: 'FAIL', detail: `localStorage unreadable: ${e?.message}`, kb: 0, hasLargeContent: false };
  }
}

function runHealthChecks(drafts, audits, draftsError, auditsError) {
  const checks = {};

  // A. Backend Storage
  if (draftsError || auditsError) {
    checks.backendStorage = { status: 'FAIL', detail: `Load error — drafts: ${draftsError || 'ok'} · audits: ${auditsError || 'ok'}` };
  } else if (drafts.length === 0 || audits.length === 0) {
    checks.backendStorage = { status: 'WARN', detail: `Drafts: ${drafts.length} · Audits: ${audits.length} — one or both are empty` };
  } else {
    checks.backendStorage = { status: 'PASS', detail: `Drafts: ${drafts.length} · Audits: ${audits.length}` };
  }

  // Written audits
  const writtenAudits = audits.filter(a => a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY');
  const failedAudits = audits.filter(a =>
    a.filesystemWrite && a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY' && a.filesystemWrite !== 'DISABLED'
  );

  // B. Written File Index
  if (draftsError || auditsError) {
    checks.writtenFileIndex = { status: 'FAIL', detail: 'Cannot check — backend load failed' };
  } else {
    const missingFilePath = writtenAudits.filter(a => !a.filePath);
    if (missingFilePath.length > 0) {
      checks.writtenFileIndex = { status: 'WARN', detail: `${missingFilePath.length} written audit(s) missing filePath`, missing: missingFilePath };
    } else {
      checks.writtenFileIndex = { status: 'PASS', detail: `${writtenAudits.length} written file(s) — all have filePath` };
    }
  }

  // C. Draft/Audit Reconciliation
  const draftIdSet = new Set(drafts.map(d => d.draftId || d.id).filter(Boolean));
  const auditDraftIdSet = new Set(audits.map(a => a.draftId).filter(Boolean));
  const orphanAudits = audits.filter(a => a.draftId && !draftIdSet.has(a.draftId));
  const filePathCount = {};
  for (const d of drafts) { if (d.filePath) filePathCount[d.filePath] = (filePathCount[d.filePath] || 0) + 1; }
  const duplicateFilePaths = Object.entries(filePathCount).filter(([, c]) => c > 1).map(([fp]) => fp);
  const auditsByDraftId = {};
  for (const a of audits) {
    if (a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY') continue;
    if (a.draftId) { if (!auditsByDraftId[a.draftId]) auditsByDraftId[a.draftId] = []; auditsByDraftId[a.draftId].push(a); }
  }
  const repairableCount = drafts.filter(d => {
    const id = d.draftId || d.id;
    if (!auditsByDraftId[id]) return false;
    if (d.riskLevel && d.riskLevel !== 'LOW') return false;
    return !d.filePath || !d.writtenAt || !d.filesystemWrite || d.filesystemWrite === 'DISABLED';
  }).length;

  if (duplicateFilePaths.length > 0 || orphanAudits.length > 0) {
    checks.reconciliation = { status: 'REVIEW_REQUIRED', detail: `Duplicates: ${duplicateFilePaths.length} · Orphan audits: ${orphanAudits.length}`, duplicateFilePaths, orphanAudits, repairableCount };
  } else if (repairableCount > 0) {
    checks.reconciliation = { status: 'WARN', detail: `${repairableCount} draft(s) have repairable metadata mismatch`, repairableCount };
  } else {
    checks.reconciliation = { status: 'PASS', detail: 'No missing audits, no orphans, no duplicates, no metadata mismatch' };
  }

  // D. Failed Writes
  if (failedAudits.length > 0) {
    checks.failedWrites = { status: 'WARN', detail: `${failedAudits.length} failed write audit(s) found`, failed: failedAudits };
  } else {
    checks.failedWrites = { status: 'PASS', detail: 'No failed write records detected' };
  }

  // E. Safety State
  const allRecords = [...drafts, ...audits];
  const safetyViolations = allRecords.filter(r =>
    (r.executionStatus && r.executionStatus !== 'NOT_EXECUTED') ||
    (r.dispatchStatus && r.dispatchStatus !== 'NOT_DISPATCHED') ||
    (r.openclawCall && r.openclawCall !== 'NOT_SENT')
  );
  if (safetyViolations.length > 0) {
    checks.safetyState = { status: 'FAIL', detail: `${safetyViolations.length} record(s) violate safety state`, violations: safetyViolations.slice(0, 10) };
  } else {
    checks.safetyState = { status: 'PASS', detail: 'All records: executionStatus NOT_EXECUTED · dispatchStatus NOT_DISPATCHED · openclawCall NOT_SENT' };
  }

  // F. Credential Safety
  const credentialHits = allRecords.filter(r => CREDENTIAL_FIELDS.some(f => r[f]));
  if (credentialHits.length > 0) {
    checks.credentialSafety = { status: 'FAIL', detail: `${credentialHits.length} record(s) contain credential fields` };
  } else {
    checks.credentialSafety = { status: 'PASS', detail: 'No credential fields detected in any record' };
  }

  // G. Local Cache
  checks.localCache = checkLocalStorage();

  // Compute score & overall
  const statusWeight = { PASS: 100, WARN: 60, REVIEW_REQUIRED: 40, FAIL: 0 };
  const keys = Object.keys(checks);
  const score = Math.round(keys.reduce((sum, k) => sum + (statusWeight[checks[k].status] ?? 0), 0) / keys.length);

  const hasAnyFail = keys.some(k => checks[k].status === 'FAIL');
  const hasReview = keys.some(k => checks[k].status === 'REVIEW_REQUIRED');
  const hasWarn = keys.some(k => checks[k].status === 'WARN');
  const overallStatus = hasAnyFail ? 'FAIL' : hasReview ? 'REVIEW_REQUIRED' : hasWarn ? 'WARN' : 'PASS';

  // Recommendations
  const recommendations = [];
  if (overallStatus === 'PASS') recommendations.push('Vault index is healthy. No action required.');
  if (checks.reconciliation?.repairableCount > 0) recommendations.push('Run Repair Index Metadata after review.');
  if (checks.failedWrites?.status === 'WARN') recommendations.push('Review failed writes and retry eligible drafts.');
  if (checks.reconciliation?.duplicateFilePaths?.length > 0) recommendations.push('Manual review required before repair — duplicate file paths detected.');
  if (checks.localCache?.status !== 'PASS') recommendations.push('Clear local cache only; backend records are preserved.');
  if (checks.safetyState?.status === 'FAIL') recommendations.push('URGENT: Safety state violation detected. Review all records immediately.');
  if (checks.credentialSafety?.status === 'FAIL') recommendations.push('URGENT: Credential fields detected in records. Investigate immediately.');

  const counts = {
    totalDrafts: drafts.length,
    totalAudits: audits.length,
    writtenFiles: writtenAudits.length,
    failedWrites: failedAudits.length,
    orphanAudits: orphanAudits.length,
    duplicateFilePaths: duplicateFilePaths.length,
    repairableMetadata: repairableCount,
    openclawCalls: allRecords.filter(r => r.openclawCall && r.openclawCall !== 'NOT_SENT').length,
    cacheKb: checks.localCache?.kb ?? 0,
  };

  return { checks, score, overallStatus, counts, recommendations, failedAudits, duplicateFilePaths };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PASS:            { label: 'PASS',            color: 'text-primary',     bg: 'bg-primary/10 border-primary/30',     icon: CheckCircle2 },
  WARN:            { label: 'WARN',            color: 'text-accent',      bg: 'bg-accent/10 border-accent/30',       icon: AlertTriangle },
  REVIEW_REQUIRED: { label: 'REVIEW',          color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/30', icon: AlertCircle },
  FAIL:            { label: 'FAIL',            color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: XCircle },
};

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.WARN;
  const Icon = cfg.icon;
  const textSize = size === 'lg' ? 'text-[10px]' : 'text-[7px]';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-sm font-bold uppercase ${textSize} ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-2.5 h-2.5 shrink-0" />
      {cfg.label}
    </span>
  );
}

function CheckCard({ label, check, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[check?.status] || STATUS_CONFIG.WARN;
  const hasDetail = check?.violations?.length || check?.missing?.length || check?.failed?.length || check?.duplicateFilePaths?.length;

  return (
    <div className={`border rounded-sm overflow-hidden ${cfg.bg}`}>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${hasDetail ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={hasDetail ? () => setOpen(v => !v) : undefined}
      >
        <Icon className={`w-3 h-3 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-[8px] font-bold uppercase tracking-widest ${cfg.color}`}>{label}</div>
          <div className="text-[7px] font-mono text-slate-400 mt-0.5 truncate">{check?.detail ?? '—'}</div>
        </div>
        <StatusBadge status={check?.status} />
        {hasDetail && (open
          ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />)}
      </div>
      {open && hasDetail && (
        <div className="px-3 pb-2 space-y-0.5 border-t border-border/20 bg-background/30 max-h-32 overflow-y-auto">
          {(check.violations || check.missing || check.failed || []).slice(0, 10).map((r, i) => (
            <div key={i} className="text-[6px] font-mono text-slate-500">
              — {r.filename || r.filePath || JSON.stringify(r).slice(0, 80)}
            </div>
          ))}
          {(check.duplicateFilePaths || []).map((fp, i) => (
            <div key={i} className="text-[6px] font-mono text-slate-500">⚠ dup: {fp}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DailyVaultHealthCheckPanel({ className = '' }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCheckAt, setLastCheckAt] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    setError('');

    let drafts = [], audits = [], draftsError = '', auditsError = '';
    try { drafts = await loadDraftsFromBackend(500); } catch (e) { draftsError = e?.message || 'Load failed'; }
    try { audits = await loadAuditsFromBackend(500); } catch (e) { auditsError = e?.message || 'Load failed'; }

    if (draftsError && auditsError) {
      setError(`Backend unreachable — drafts: ${draftsError} · audits: ${auditsError}`);
      setLoading(false);
      return;
    }

    const r = runHealthChecks(drafts, audits, draftsError, auditsError);
    setResult(r);
    setLastCheckAt(new Date().toISOString());
    setLoading(false);
  }, []);

  const handleExport = () => {
    if (!result) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      overallStatus: result.overallStatus,
      healthScore: result.score,
      counts: result.counts,
      checks: Object.fromEntries(
        Object.entries(result.checks).map(([k, v]) => [k, { status: v.status, detail: v.detail }])
      ),
      reconciliationSummary: {
        orphanAudits: result.checks.reconciliation?.orphanAudits?.length ?? 0,
        duplicateFilePaths: result.duplicateFilePaths ?? [],
        repairableMetadata: result.checks.reconciliation?.repairableCount ?? 0,
      },
      safetySummary: {
        safetyState: result.checks.safetyState?.status,
        credentialSafety: result.checks.credentialSafety?.status,
        openclawCallsFound: result.counts.openclawCalls,
      },
      failedWrites: result.failedAudits?.map(a => ({ filename: a.filename, filePath: a.filePath, filesystemWrite: a.filesystemWrite })) ?? [],
      recommendations: result.recommendations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-vault-health-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const overallCfg = result ? STATUS_CONFIG[result.overallStatus] : null;

  return (
    <div className={`border border-border/40 bg-card rounded-sm overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Daily Vault Sync / Health Check</span>
          {result && overallCfg && (
            <StatusBadge status={result.overallStatus} size="sm" />
          )}
          {result && (
            <span className="text-[7px] font-mono text-slate-500">
              Score: <span className={overallCfg?.color}>{result.score}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setShowVerification(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 rounded-sm transition-colors">
            <ShieldCheck className="w-2.5 h-2.5" /> Verify
          </button>
          {result && (
            <button type="button" onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-accent/30 text-accent hover:border-accent/60 rounded-sm transition-colors">
              <Download className="w-2.5 h-2.5" /> Export JSON
            </button>
          )}
          <button type="button" onClick={runHealthCheck} disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-primary/40 text-primary hover:border-primary/70 rounded-sm transition-colors disabled:opacity-40">
            <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
            {result ? 'Refresh' : 'Run Health Check'}
          </button>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-amber-500/20 bg-amber-500/5">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-wide">
          Read-only health check — no vault writes · no openclaw dispatch · no ai calls · no credential access
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Idle */}
        {!result && !loading && !error && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Click "Run Health Check" to verify backend storage, write audits, reconciliation, and cache health.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> Running health checks…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[7px] font-mono text-destructive"><span className="font-bold">Health check error:</span> {error}</div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Score bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[7px] font-mono">
                <span className="text-slate-500">Health Score</span>
                <span className={`font-bold ${overallCfg?.color}`}>{result.score}%</span>
              </div>
              <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${result.score >= 80 ? 'bg-primary' : result.score >= 50 ? 'bg-accent' : 'bg-destructive'}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            {/* Quick count strip */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Drafts', value: result.counts.totalDrafts },
                { label: 'Audits', value: result.counts.totalAudits },
                { label: 'Written', value: result.counts.writtenFiles },
                { label: 'Failed', value: result.counts.failedWrites, warn: result.counts.failedWrites > 0 },
              ].map(({ label, value, warn }) => (
                <div key={label} className="flex flex-col items-center px-2 py-1.5 bg-background/50 border border-border/30 rounded-sm">
                  <span className={`text-[11px] font-bold ${warn ? 'text-destructive' : 'text-primary'}`}>{value}</span>
                  <span className="text-[6px] font-mono text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            {/* Check cards */}
            <div className="space-y-1.5">
              <CheckCard label="Backend Storage" check={result.checks.backendStorage} icon={Database} />
              <CheckCard label="Written File Index" check={result.checks.writtenFileIndex} icon={FileText} />
              <CheckCard label="Draft / Audit Reconciliation" check={result.checks.reconciliation} icon={Activity} />
              <CheckCard label="Failed Writes" check={result.checks.failedWrites} icon={AlertCircle} />
              <CheckCard label="Safety State" check={result.checks.safetyState} icon={Shield} />
              <CheckCard label="Credential Safety" check={result.checks.credentialSafety} icon={ShieldCheck} />
              <CheckCard label="Local Cache" check={result.checks.localCache} icon={HardDrive} />
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="border border-border/30 rounded-sm p-3 space-y-1.5">
                <div className="text-[7px] font-bold uppercase tracking-widest text-slate-400 mb-1">Recommendations</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                    <span className={result.overallStatus === 'PASS' ? 'text-primary' : 'text-accent'}>→</span>
                    {r}
                  </div>
                ))}
              </div>
            )}

            {/* Next check + last check */}
            <div className="flex items-center gap-3 flex-wrap text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2">
              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Last check: {lastCheckAt}</span>
              <span>Next suggested: {result.counts.writtenFiles > 0 ? 'Tomorrow or after next vault write' : 'After first vault write'}</span>
            </div>

            {/* OpenClaw calls count */}
            <div className={`text-[6px] font-mono ${result.counts.openclawCalls > 0 ? 'text-destructive' : 'text-slate-600'}`}>
              OpenClaw calls in records: {result.counts.openclawCalls} (should be 0) ·
              executionStatus NOT_EXECUTED · dispatchStatus NOT_DISPATCHED · openclawCall NOT_SENT
            </div>
          </>
        )}

        {/* Verification panel */}
        {showVerification && (
          <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
            <div className="text-[7px] font-bold uppercase tracking-widest text-primary/80 mb-2">Safety Verification Report</div>
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