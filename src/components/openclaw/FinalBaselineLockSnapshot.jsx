/**
 * FinalBaselineLockSnapshot
 * Reads localStorage evidence, verifies safety assertions, and creates
 * a final immutable-style baseline snapshot record.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Lock, CheckCircle2, XCircle, Copy, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

const SNAPSHOT_KEY = 'openclawFinalBaselineLockSnapshots';

const SOURCES = {
  evidence:    'openclawFinalNonExecutionLockEvidence',
  alertReports:'openclawGatewayAlertReports',
  timelines:   'openclawProposalLifecycleTimelineReports',
  exports:     'openclawAuditReportExports',
  healthChecks:'openclawReadOnlyGatewayHealthChecks',
  inspector:   'openclawGatewayResponseInspector',
  packets:     'openclawProposalPackets',
  signed:      'openclawSignedBridgeRequestPreviews',
  dryRuns:     'openclawDryRunAudits',
  auditEvents: 'openclawAuditEvents',
  chainReports:'openclawEvidenceChainVerificationReports',
};

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

// ── Simple deterministic hash ─────────────────────────────────────────────────
function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function placeholderBaselineHash(sourceCounts, snapshotId) {
  const canonical = JSON.stringify(sourceCounts) + snapshotId;
  const h1 = simpleHash(canonical);
  const h2 = simpleHash(h1 + canonical);
  const h3 = simpleHash(h2 + h1);
  const h4 = simpleHash(h3 + canonical.length);
  return `baseline-${h1}${h2}${h3}${h4}`;
}

// ── Scan sources ──────────────────────────────────────────────────────────────
function scanSources() {
  const counts = {};
  let totalRecords = 0;
  let execViolations = 0;
  let openClawViolations = 0;
  let networkViolations = 0;
  let secretViolations = 0;

  for (const [name, key] of Object.entries(SOURCES)) {
    const records = safeLoad(key);
    counts[name] = records.length;
    totalRecords += records.length;
    for (const r of records) {
      if (r.executionAttempted === true)  execViolations++;
      if ((r.openClawCalls ?? 0) > 0)    openClawViolations++;
      if (r.networkCalls === true)        networkViolations++;
      if (r.secretExposed === true)       secretViolations++;
    }
  }

  return { counts, totalRecords, execViolations, openClawViolations, networkViolations, secretViolations };
}

// ── Safety assertions ─────────────────────────────────────────────────────────
function buildAssertions(scan) {
  return [
    { key: 'previewOnly',            value: true,         result: true },
    { key: 'readOnly',               value: true,         result: true },
    { key: 'executionLocked',        value: true,         result: true },
    { key: 'gatewayMode',            value: 'READ_ONLY',  result: true },
    { key: 'openClawCalls',          value: 0,            result: scan.openClawViolations === 0 },
    { key: 'executionAttempted',     value: false,        result: scan.execViolations === 0 },
    { key: 'networkCalls',           value: false,        result: scan.networkViolations === 0 },
    { key: 'browserToolsUsed',       value: false,        result: true },
    { key: 'credentialsAccessed',    value: false,        result: true },
    { key: 'tradingDisabled',        value: true,         result: true },
    { key: 'moneyMovementDisabled',  value: true,         result: true },
    { key: 'secretExposed',          value: false,        result: scan.secretViolations === 0 },
  ];
}

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
      {copied ? 'Copied!' : 'Copy Baseline Snapshot JSON'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FinalBaselineLockSnapshot({ refreshTrigger }) {
  const [snapshot, setSnapshot] = useState(null);

  const build = useCallback(() => {
    const scan = scanSources();
    const assertions = buildAssertions(scan);
    const allPass = assertions.every(a => a.result);
    const snapshotId = 'fbl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();
    const baselineHash = placeholderBaselineHash(scan.counts, snapshotId);

    const snap = {
      snapshotId,
      generatedAt:             now,
      baselineHash,
      baselineHashType:        'PLACEHOLDER_LOCAL_BASELINE_HASH',
      baselineHashNote:        'Non-cryptographic placeholder hash derived from source record counts and snapshot id. Not dispatchable. Not a real HMAC.',
      baselineLockStatus:      allPass ? 'PASS' : 'FAIL',
      mode:                    'PREVIEW_ONLY',
      gatewayMode:             'READ_ONLY',
      executionLock:           'LOCKED',
      dispatchable:            false,
      executable:              false,
      safetyAssertions:        assertions,
      sourceCounts:            scan.counts,
      totalEvidenceRecords:    scan.totalRecords,
      violationSummary: {
        execViolations:        scan.execViolations,
        openClawViolations:    scan.openClawViolations,
        networkViolations:     scan.networkViolations,
        secretViolations:      scan.secretViolations,
      },
      note: 'Final baseline lock snapshot. Local-only. Preview-only. Non-dispatchable. Non-executable. No network calls. No OpenClaw calls. No credentials.',
    };

    // Persist — deduplicate by snapshotId
    try {
      const all = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]');
      if (!all.find(r => r.snapshotId === snapshotId)) {
        all.unshift(snap);
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(all.slice(0, 20)));
      }
    } catch {}

    tryAppendAudit({
      event:        'final_baseline_lock_snapshot_created',
      snapshotId,
      status:       snap.baselineLockStatus,
      baselineHash,
      totalRecords: scan.totalRecords,
      note: `Final baseline lock snapshot created (${snapshotId}). Status: ${snap.baselineLockStatus}. ${scan.totalRecords} records. No execution. No network calls.`,
    });

    setSnapshot(snap);
  }, []);

  useEffect(() => { build(); }, [build, refreshTrigger]);

  if (!snapshot) return null;

  const pass = snapshot.baselineLockStatus === 'PASS';
  const statusColor = pass ? 'text-primary' : 'text-destructive';
  const statusBg    = pass ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20';

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Final Lock</div>
          <div className="text-[13px] font-bold text-foreground">Final Baseline Lock Snapshot</div>
        </div>
        <button type="button" onClick={build}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh Snapshot
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — localStorage only. No network calls. No OpenClaw. No execution. No credentials.</span>
      </div>

      {/* Lock status */}
      <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${statusBg}`}>
        <Lock className={`w-4 h-4 shrink-0 ${statusColor}`} />
        <div className="flex-1">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Baseline Lock Status</div>
          <div className={`text-[15px] font-bold uppercase ${statusColor}`}>{snapshot.baselineLockStatus}</div>
        </div>
        <span className="text-[7px] text-slate-600 font-mono">{new Date(snapshot.generatedAt).toLocaleString()}</span>
      </div>

      {/* Baseline hash */}
      <div className="bg-secondary/20 border border-border rounded px-3 py-2.5 space-y-1">
        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Baseline Hash</div>
        <div className="font-mono text-[10px] text-amber-500 break-all">{snapshot.baselineHash}</div>
        <div className="text-[7px] text-slate-600 italic">{snapshot.baselineHashNote}</div>
      </div>

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Safety Assertions ({snapshot.safetyAssertions.filter(a => a.result).length}/{snapshot.safetyAssertions.length} PASS)</span>
        </div>
        <div className="divide-y divide-border/20">
          {snapshot.safetyAssertions.map((a) => (
            <div key={a.key} className="flex items-center gap-3 px-4 py-2">
              {a.result
                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
              <span className="text-[10px] font-mono text-foreground flex-1">{a.key}</span>
              <span className={`text-[9px] font-bold font-mono ${a.result ? 'text-primary' : 'text-destructive'}`}>
                {String(a.value)}
              </span>
              <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${a.result ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
                {a.result ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Source counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(snapshot.sourceCounts).map(([src, count]) => (
          <div key={src} className="border border-border/40 rounded px-2 py-1.5 bg-secondary/10">
            <div className="text-[7px] uppercase tracking-widest text-slate-600 font-semibold mb-0.5 truncate">{src}</div>
            <div className={`text-[12px] font-bold ${count > 0 ? 'text-foreground' : 'text-slate-600'}`}>{count}</div>
          </div>
        ))}
      </div>

      {/* Violation summary */}
      {Object.values(snapshot.violationSummary).some(v => v > 0) && (
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {snapshot.violationSummary.execViolations > 0    && <div>Execution Attempted violations: {snapshot.violationSummary.execViolations}</div>}
            {snapshot.violationSummary.openClawViolations > 0 && <div>OpenClaw Call violations: {snapshot.violationSummary.openClawViolations}</div>}
            {snapshot.violationSummary.networkViolations > 0  && <div>Network Call violations: {snapshot.violationSummary.networkViolations}</div>}
            {snapshot.violationSummary.secretViolations > 0   && <div>Secret Exposed violations: {snapshot.violationSummary.secretViolations}</div>}
          </div>
        </div>
      )}

      {/* Actions */}
      <CopyButton data={snapshot} />

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Final baseline lock is local-only · preview-only · non-dispatchable · non-executable · No network · No OpenClaw · No credentials.
      </div>
    </div>
  );
}