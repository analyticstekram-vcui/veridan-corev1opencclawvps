/**
 * BaselineArchiveVerification
 * Verifies the latest baseline archive from localStorage.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback } from 'react';
import { BadgeCheck, CheckCircle2, AlertTriangle, XCircle, Copy, RefreshCw, ShieldCheck } from 'lucide-react';

const ARCHIVE_KEY  = 'openclawBaselineArchiveExports';
const VERIFY_KEY   = 'openclawBaselineArchiveVerificationReports';

function safeLoad(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [p];
  } catch { return []; }
}

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function placeholderVerifyHash(archiveId, reportId) {
  const s = archiveId + reportId;
  const h1 = simpleHash(s);
  const h2 = simpleHash(h1 + s);
  return `verify-${h1}${h2}`;
}

// ── Verification checks ───────────────────────────────────────────────────────
function runChecks(arc) {
  const checks = [
    { label: 'archiveId present',                    pass: !!arc.archiveId,                                      warn: false },
    { label: 'createdAt present',                    pass: !!arc.createdAt,                                      warn: false },
    { label: 'archiveType is PREVIEW_ONLY_BASELINE_ARCHIVE', pass: arc.archiveType === 'PREVIEW_ONLY_BASELINE_ARCHIVE', warn: false },
    { label: 'baselineStatus is LOCKED',             pass: arc.baselineStatus === 'LOCKED',                      warn: false },
    { label: 'gatewayMode is READ_ONLY',             pass: arc.gatewayMode === 'READ_ONLY',                      warn: false },
    { label: 'executionMode is DISABLED',            pass: arc.executionMode === 'DISABLED',                     warn: false },
    { label: 'openClawCalls === 0',                  pass: arc.openClawCalls === 0,                              warn: false },
    { label: 'executionAttempts === 0',              pass: arc.executionAttempts === 0,                          warn: false },
    { label: 'networkCalls === false',               pass: arc.networkCalls === false,                           warn: false },
    { label: 'browserAutomationUsed === false',      pass: arc.browserAutomationUsed === false,                  warn: false },
    { label: 'credentialsAccessed === false',        pass: arc.credentialsAccessed === false,                    warn: false },
    { label: 'tradingDisabled === true',             pass: arc.tradingDisabled === true,                         warn: false },
    { label: 'moneyMovementDisabled === true',       pass: arc.moneyMovementDisabled === true,                   warn: false },
    { label: 'sourcesIncluded present',              pass: Array.isArray(arc.sourcesIncluded) && arc.sourcesIncluded.length > 0, warn: false },
    { label: 'sourceCounts present',                 pass: !!arc.sourceCounts && typeof arc.sourceCounts === 'object', warn: false },
    { label: 'safetyAssertions present',             pass: Array.isArray(arc.safetyAssertions) && arc.safetyAssertions.length > 0, warn: false },
    { label: 'safetyAssertions all pass',            pass: Array.isArray(arc.safetyAssertions) && arc.safetyAssertions.every(a => a.pass !== false), warn: true },
    { label: 'archiveHash present (PLACEHOLDER)',    pass: typeof arc.archiveHash === 'string' && arc.archiveHash.startsWith('archive-'), warn: false },
  ];

  const fails  = checks.filter(c => !c.pass && !c.warn);
  const warns  = checks.filter(c => !c.pass && c.warn);
  return { checks, fails, warns };
}

function computeStatus(arc, fails, warns) {
  if (!arc) return 'NO_ARCHIVE_FOUND';
  if (fails.length > 0) return 'VERIFICATION_FAILED';
  if (warns.length > 0) return 'VERIFIED_WITH_WARNINGS';
  return 'VERIFIED_LOCKED_BASELINE';
}

const STATUS_CFG = {
  VERIFIED_LOCKED_BASELINE: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         label: 'VERIFIED_LOCKED_BASELINE' },
  VERIFIED_WITH_WARNINGS:   { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     label: 'VERIFIED_WITH_WARNINGS' },
  VERIFICATION_FAILED:      { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'VERIFICATION_FAILED' },
  NO_ARCHIVE_FOUND:         { color: 'text-slate-400',   bg: 'bg-secondary/10 border-border',          label: 'NO_ARCHIVE_FOUND' },
};

const CHECK_BADGE = {
  PASS: 'text-primary border-primary/30 bg-primary/5',
  WARN: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  FAIL: 'text-destructive border-destructive/30 bg-destructive/5',
};

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Verification JSON'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BaselineArchiveVerification({ refreshTrigger }) {
  const [result, setResult] = useState(null);

  const handleVerify = useCallback(() => {
    const archives = safeLoad(ARCHIVE_KEY).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latest = archives[0] || null;

    if (!latest) {
      setResult({ status: 'NO_ARCHIVE_FOUND', archive: null, checks: [], report: null });
      return;
    }

    const { checks, fails, warns } = runChecks(latest);
    const status = computeStatus(latest, fails, warns);
    const reportId = 'avr-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const verifyHash = placeholderVerifyHash(latest.archiveId, reportId);

    const report = {
      reportId,
      createdAt:            now,
      verifyHash,
      verifiedArchiveId:    latest.archiveId,
      verifiedArchiveCreatedAt: latest.createdAt,
      verificationStatus:   status,
      checksTotal:          checks.length,
      checksPassed:         checks.filter(c => c.pass).length,
      checksFailed:         fails.length,
      checksWarned:         warns.length,
      safetyAssertionFailures: Array.isArray(latest.safetyAssertions)
        ? latest.safetyAssertions.filter(a => a.pass === false).length
        : 0,
      sourcesIncluded:      latest.sourcesIncluded || [],
      openClawCalls:        latest.openClawCalls ?? 0,
      executionAttempts:    latest.executionAttempts ?? 0,
      networkCalls:         latest.networkCalls ?? false,
      checks,
      mode:                 'PREVIEW_ONLY',
      gatewayMode:          'READ_ONLY',
      executionLock:        'LOCKED',
      note:                 'Archive verification is local-only. No OpenClaw calls. No execution. No network calls. No dispatch.',
    };

    // Persist
    try {
      const all = JSON.parse(localStorage.getItem(VERIFY_KEY) || '[]');
      all.unshift(report);
      localStorage.setItem(VERIFY_KEY, JSON.stringify(all.slice(0, 20)));
    } catch {}

    tryAppendAudit({
      event:        'baseline_archive_verification_completed',
      reportId,
      status,
      archiveId:    latest.archiveId,
      checksPassed: report.checksPassed,
      checksFailed: fails.length,
      note: `Baseline archive verification completed (${reportId}). Status: ${status}. ${report.checksPassed}/${checks.length} checks passed. No execution. No network calls.`,
    });

    setResult({ status, archive: latest, checks, report });
  }, []);

  const cfg = result ? (STATUS_CFG[result.status] || STATUS_CFG.NO_ARCHIVE_FOUND) : null;

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Archive Verification</div>
          <div className="text-[13px] font-bold text-foreground">Baseline Archive Verification</div>
        </div>
        <button type="button" onClick={handleVerify}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Re-Verify
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — localStorage only. No network calls. No OpenClaw. No execution. No credentials.</span>
      </div>

      {/* Verify button (pre-run) */}
      {!result && (
        <button type="button" onClick={handleVerify}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded w-full justify-center">
          <BadgeCheck className="w-4 h-4" /> Verify Latest Archive
        </button>
      )}

      {/* Post-verification */}
      {result && cfg && (
        <>
          {/* Status banner */}
          <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${cfg.bg}`}>
            <BadgeCheck className={`w-4 h-4 shrink-0 ${cfg.color}`} />
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Verification Status</div>
              <div className={`text-[14px] font-bold uppercase ${cfg.color}`}>{cfg.label}</div>
            </div>
            {result.report && (
              <span className="text-[7px] text-slate-600 font-mono">{new Date(result.report.createdAt).toLocaleString()}</span>
            )}
          </div>

          {/* Confirmation banner for verified */}
          {result.status === 'VERIFIED_LOCKED_BASELINE' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[11px] font-bold text-primary uppercase tracking-wide">
                BASELINE ARCHIVE VERIFIED — locked preview-only state confirmed.
              </div>
            </div>
          )}

          {/* No archive found */}
          {result.status === 'NO_ARCHIVE_FOUND' && (
            <div className="flex items-start gap-2 px-3 py-2 bg-secondary/10 border border-border rounded text-[9px] text-slate-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              No baseline archive found. Generate one using Baseline Archive Export above.
            </div>
          )}

          {/* Summary cards */}
          {result.archive && result.report && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Archive ID',               value: result.archive.archiveId?.slice(0, 16) + '…', color: 'text-slate-300 font-mono text-[8px]' },
                { label: 'Archive Created',          value: new Date(result.archive.createdAt).toLocaleString(), color: 'text-slate-300 text-[8px]' },
                { label: 'Sources Included',         value: result.report.sourcesIncluded.length,        color: 'text-blue-400 font-bold' },
                { label: 'Safety Assertion Failures',value: result.report.safetyAssertionFailures,        color: result.report.safetyAssertionFailures > 0 ? 'text-destructive font-bold' : 'text-primary font-bold' },
                { label: 'OpenClaw Calls',           value: result.report.openClawCalls,                  color: 'text-destructive font-bold' },
                { label: 'Execution Attempts',       value: result.report.executionAttempts,              color: 'text-destructive font-bold' },
                { label: 'Network Calls',            value: String(result.report.networkCalls),           color: 'text-destructive font-bold' },
                { label: 'Checks Passed',            value: `${result.report.checksPassed} / ${result.report.checksTotal}`, color: result.report.checksFailed > 0 ? 'text-destructive font-bold' : 'text-primary font-bold' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                  <div className={`text-[10px] ${color}`}>{String(value)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Verification checks */}
          {result.checks.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-secondary/10 border-b border-border">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  Checks ({result.report?.checksPassed}/{result.report?.checksTotal} PASS)
                </span>
              </div>
              <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
                {result.checks.map((c, i) => {
                  const badgeStatus = c.pass ? 'PASS' : c.warn ? 'WARN' : 'FAIL';
                  const Icon = c.pass ? CheckCircle2 : c.warn ? AlertTriangle : XCircle;
                  const iconColor = c.pass ? 'text-primary' : c.warn ? 'text-amber-500' : 'text-destructive';
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      <span className="text-[8px] text-slate-600 font-mono w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                      <span className="text-[9px] text-foreground/90 flex-1">{c.label}</span>
                      <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase shrink-0 ${CHECK_BADGE[badgeStatus]}`}>
                        {badgeStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {result.report && <CopyButton data={result.report} />}
            <button type="button" onClick={handleVerify}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <BadgeCheck className="w-3 h-3" /> Verify Latest Archive
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Archive verification is local-only · No OpenClaw calls · No execution · No network calls · No dispatch.
      </div>
    </div>
  );
}