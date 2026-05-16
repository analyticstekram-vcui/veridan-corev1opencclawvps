/**
 * EvidenceChainVerifier
 * Tamper-evident local evidence chain verifier — localStorage only.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Link2, CheckCircle2, AlertTriangle, XCircle, Copy, RefreshCw, ShieldCheck } from 'lucide-react';

// ── localStorage keys ──────────────────────────────────────────────────────────
const SOURCES = {
  evidence:    { key: 'openclawFinalNonExecutionLockEvidence',       type: 'FINAL_LOCK_EVIDENCE' },
  alertReports:{ key: 'openclawGatewayAlertReports',                 type: 'ALERT_REPORT' },
  timelines:   { key: 'openclawProposalLifecycleTimelineReports',    type: 'LIFECYCLE_TIMELINE' },
  exports:     { key: 'openclawAuditReportExports',                  type: 'AUDIT_EXPORT' },
  healthChecks:{ key: 'openclawReadOnlyGatewayHealthChecks',         type: 'HEALTH_CHECK' },
  inspector:   { key: 'openclawGatewayResponseInspector',            type: 'RESPONSE_INSPECT' },
  packets:     { key: 'openclawProposalPackets',                     type: 'PROPOSAL_PACKET' },
  signed:      { key: 'openclawSignedBridgeRequestPreviews',         type: 'SIGNED_PREVIEW' },
  dryRunAudits:{ key: 'openclawDryRunAudits',                        type: 'DRY_RUN_AUDIT' },
  auditEvents: { key: 'openclawAuditEvents',                         type: 'AUDIT_EVENT' },
};
const VERIFY_KEY = 'openclawEvidenceChainVerificationReports';

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

// ── Stable id extractor ────────────────────────────────────────────────────────
function stableId(rec, type) {
  return rec.evidenceId || rec.reportId || rec.exportId || rec.checkId ||
         rec.signedRequestId || rec.dryRunAuditId || rec.packetId ||
         rec.id || rec.auditId || `${type}-${rec.createdAt || rec.generatedAt || rec.timestamp || Math.random()}`;
}

function stableTs(rec) {
  return rec.createdAt || rec.generatedAt || rec.timestamp || rec.loadedAt || null;
}

// ── Simple deterministic hash from string ─────────────────────────────────────
function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function placeholderChainHash(records) {
  const canonical = records
    .map(r => `${r._stableId}|${r._type}|${r._ts || ''}`)
    .join('::');
  // Multi-pass for longer placeholder
  const h1 = simpleHash(canonical);
  const h2 = simpleHash(canonical + h1);
  const h3 = simpleHash(h1 + h2 + canonical.length);
  const h4 = simpleHash(h2 + h3);
  return `phash-${h1}${h2}${h3}${h4}`;
}

// ── Per-record safety evaluation ───────────────────────────────────────────────
function evaluateRecord(rec) {
  const violations = [];
  if (rec.executionAttempted === true)           violations.push('executionAttempted === true');
  if ((rec.openClawCalls ?? 0) > 0)              violations.push(`openClawCalls = ${rec.openClawCalls}`);
  if (rec.networkCalls === true)                 violations.push('networkCalls === true');
  if (rec.secretExposed === true)                violations.push('secretExposed === true');
  if (rec.allowedForDispatch === true)           violations.push('allowedForDispatch === true');
  if (rec.dispatchAttempted === true)            violations.push('dispatchAttempted === true');
  if (rec.browserAutomationUsed === true)        violations.push('browserAutomationUsed === true');

  if (violations.length > 0) return { status: 'FAIL', violations };

  const warns = [];
  if (!rec.createdAt && !rec.generatedAt && !rec.timestamp && !rec.loadedAt)
    warns.push('missing timestamp');
  if (rec.mode && rec.mode !== 'PREVIEW_ONLY')
    warns.push(`mode is ${rec.mode}, expected PREVIEW_ONLY`);

  if (warns.length > 0) return { status: 'WARN', violations: warns };
  return { status: 'PASS', violations: [] };
}

// ── Build chain ────────────────────────────────────────────────────────────────
function buildChain() {
  const all = [];
  const seenIds = new Set();
  let duplicates = 0;
  let missingTs = 0;
  const sourcesDiscovered = [];

  for (const [srcKey, { key, type }] of Object.entries(SOURCES)) {
    const records = safeLoad(key);
    if (records.length > 0) sourcesDiscovered.push(srcKey);
    for (const rec of records) {
      const sid = stableId(rec, type);
      if (seenIds.has(sid)) { duplicates++; continue; }
      seenIds.add(sid);
      const ts = stableTs(rec);
      if (!ts) missingTs++;
      all.push({ _stableId: sid, _type: type, _source: srcKey, _ts: ts, ...rec });
    }
  }

  all.sort((a, b) => new Date(a._ts || 0) - new Date(b._ts || 0));

  // Safety counters
  let execAttempted = 0, openClawCalls = 0, networkCalls = 0, secretExposed = 0;
  for (const r of all) {
    if (r.executionAttempted === true)  execAttempted++;
    if ((r.openClawCalls ?? 0) > 0)    openClawCalls++;
    if (r.networkCalls === true)        networkCalls++;
    if (r.secretExposed === true)       secretExposed++;
  }

  const overallFail = execAttempted > 0 || openClawCalls > 0 || networkCalls > 0 || secretExposed > 0;
  const overallStatus = overallFail ? 'FAIL' : 'PASS';

  return { all, duplicates, missingTs, sourcesDiscovered, execAttempted, openClawCalls, networkCalls, secretExposed, overallStatus };
}

// ── Badge ──────────────────────────────────────────────────────────────────────
const BADGE = {
  PASS: 'text-primary border-primary/30 bg-primary/5',
  WARN: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  FAIL: 'text-destructive border-destructive/30 bg-destructive/5',
};

function StatusBadge({ status }) {
  return <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase shrink-0 ${BADGE[status] || BADGE.WARN}`}>{status}</span>;
}

// ── Chain record row ───────────────────────────────────────────────────────────
function ChainRow({ rec, idx }) {
  const [open, setOpen] = useState(false);
  const eval_ = evaluateRecord(rec);
  const col = eval_.status === 'PASS' ? 'text-primary' : eval_.status === 'WARN' ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="border-b border-border/20 last:border-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/20 transition-colors text-left">
        <span className="text-[8px] text-slate-600 font-mono w-6 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-bold ${col}`}>{rec._type}</span>
            <span className="text-[7px] text-slate-500 font-mono bg-secondary/30 px-1 rounded">{rec._source}</span>
            <span className="text-[7px] text-slate-600 font-mono truncate max-w-[120px]">{rec._stableId}</span>
          </div>
        </div>
        <span className="text-[7px] text-slate-600 font-mono shrink-0 hidden sm:block">
          {rec._ts ? new Date(rec._ts).toLocaleString() : '—'}
        </span>
        <StatusBadge status={eval_.status} />
      </button>
      {open && (
        <div className="px-10 pb-3 space-y-1.5 text-[8px] text-slate-500">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
            <span>Source: <span className="text-slate-300">{rec._source}</span></span>
            <span>Type: <span className="text-slate-300">{rec._type}</span></span>
            <span>Safety Mode: <span className="text-primary font-semibold">{rec.safetyMode || rec.mode || 'PREVIEW_ONLY'}</span></span>
            <span>Exec Attempted: <span className={rec.executionAttempted ? 'text-destructive font-bold' : 'text-primary font-bold'}>{String(rec.executionAttempted ?? false)}</span></span>
            <span>OpenClaw Calls: <span className="text-destructive font-bold">{rec.openClawCalls ?? 0}</span></span>
            <span>Network Calls: <span className="text-destructive font-bold">{String(rec.networkCalls ?? false)}</span></span>
            <span>Secret Exposed: <span className="text-destructive font-bold">{String(rec.secretExposed ?? false)}</span></span>
            {rec.auditRecordId && <span className="col-span-2">Audit ID: <span className="font-mono text-slate-400">{rec.auditRecordId}</span></span>}
            {rec.signaturePlaceholder && <span className="col-span-2">Sig: <span className="font-mono text-slate-400 text-[7px]">{rec.signaturePlaceholder}</span></span>}
            {rec.canonicalPayloadHash && <span className="col-span-2">Hash: <span className="font-mono text-slate-400 text-[7px]">{rec.canonicalPayloadHash}</span></span>}
          </div>
          {eval_.violations.length > 0 && (
            <div className="space-y-0.5 mt-1">
              {eval_.violations.map((v, i) => (
                <div key={i} className={`flex items-center gap-1.5 ${eval_.status === 'FAIL' ? 'text-destructive' : 'text-amber-500'}`}>
                  {eval_.status === 'FAIL' ? <XCircle className="w-2.5 h-2.5 shrink-0" /> : <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Chain Verification JSON'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function EvidenceChainVerifier({ refreshTrigger }) {
  const [chain,       setChain]       = useState(null);
  const [report,      setReport]      = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const verify = useCallback(() => {
    const result = buildChain();
    const chainHash = placeholderChainHash(result.all);
    const now = new Date().toISOString();
    const reportId = 'ecv-' + Date.now().toString(36);

    const newReport = {
      reportId,
      generatedAt:            now,
      mode:                   'PREVIEW_ONLY',
      gatewayMode:            'READ_ONLY',
      executionLock:          'LOCKED',
      executionAttempted:     false,
      openClawCalls:          0,
      networkCalls:           false,
      credentialAccess:       false,
      dispatchAttempted:      false,
      chainHash,
      chainHashType:          'PLACEHOLDER_LOCAL_CHAIN_HASH',
      chainHashNote:          'Non-cryptographic placeholder hash computed from stable IDs + types + timestamps only. Not dispatchable. Not a real HMAC.',
      overallStatus:          result.overallStatus,
      summary: {
        totalEvidenceRecords:     result.all.length,
        sourcesDiscovered:        result.sourcesDiscovered,
        duplicateRecordsIgnored:  result.duplicates,
        missingTimestampRecords:  result.missingTs,
        executionAttemptedCount:  result.execAttempted,
        openClawCallsCount:       result.openClawCalls,
        networkCallsCount:        result.networkCalls,
        secretExposedCount:       result.secretExposed,
      },
      records: result.all.map(r => ({
        stableId:      r._stableId,
        type:          r._type,
        source:        r._source,
        timestamp:     r._ts,
        safetyMode:    r.safetyMode || r.mode || 'PREVIEW_ONLY',
        executionAttempted: r.executionAttempted ?? false,
        openClawCalls: r.openClawCalls ?? 0,
        networkCalls:  r.networkCalls ?? false,
        secretExposed: r.secretExposed ?? false,
        auditId:       r.auditRecordId || r.evidenceId || null,
        status:        evaluateRecord(r).status,
      })),
    };

    // Persist (dedup by reportId)
    try {
      const all = JSON.parse(localStorage.getItem(VERIFY_KEY) || '[]');
      if (!all.find(r => r.reportId === reportId)) {
        all.unshift(newReport);
        localStorage.setItem(VERIFY_KEY, JSON.stringify(all.slice(0, 20)));
      }
    } catch {}

    tryAppendAudit({
      event:       'evidence_chain_verification_report_generated',
      reportId,
      overallStatus: result.overallStatus,
      totalRecords:  result.all.length,
      chainHash,
      note: `Evidence chain verification generated (${reportId}). Status: ${result.overallStatus}. ${result.all.length} records. No execution. No network calls.`,
    });

    setChain(result);
    setReport(newReport);
    setGeneratedAt(now);
  }, []);

  useEffect(() => { verify(); }, [verify, refreshTrigger]);

  if (!chain || !report) return null;

  const { summary } = report;
  const overallColor = report.overallStatus === 'PASS' ? 'text-primary' : 'text-destructive';
  const overallBg    = report.overallStatus === 'PASS' ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20';

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Evidence Chain</div>
          <div className="text-[13px] font-bold text-foreground">Tamper-Evident Evidence Chain Verifier</div>
        </div>
        <button type="button" onClick={verify}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh Chain Verification
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — localStorage only. No network calls. No OpenClaw. No execution. No credentials.</span>
      </div>

      {/* Overall status */}
      <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${overallBg}`}>
        <Link2 className={`w-4 h-4 shrink-0 ${overallColor}`} />
        <div className="flex-1">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Overall Chain Status</div>
          <div className={`text-[15px] font-bold uppercase ${overallColor}`}>{report.overallStatus}</div>
        </div>
        {generatedAt && <span className="text-[7px] text-slate-600 font-mono">{new Date(generatedAt).toLocaleString()}</span>}
      </div>

      {/* Chain hash */}
      <div className="bg-secondary/20 border border-border rounded px-3 py-2.5 space-y-1">
        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Chain Hash</div>
        <div className="font-mono text-[10px] text-amber-500 break-all">{report.chainHash}</div>
        <div className="text-[7px] text-slate-600 italic">{report.chainHashNote}</div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Evidence Records',    value: summary.totalEvidenceRecords,    color: 'text-foreground',  bg: 'bg-secondary/20 border-border' },
          { label: 'Sources Discovered',        value: summary.sourcesDiscovered.length, color: 'text-blue-400',   bg: 'bg-blue-400/5 border-blue-400/20' },
          { label: 'Duplicates Ignored',        value: summary.duplicateRecordsIgnored, color: 'text-slate-400',   bg: 'bg-secondary/10 border-border' },
          { label: 'Missing Timestamps',        value: summary.missingTimestampRecords, color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Exec Attempted Count',      value: summary.executionAttemptedCount, color: summary.executionAttemptedCount > 0 ? 'text-destructive' : 'text-primary', bg: summary.executionAttemptedCount > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20' },
          { label: 'OpenClaw Calls Count',      value: summary.openClawCallsCount,      color: summary.openClawCallsCount > 0 ? 'text-destructive' : 'text-primary',      bg: summary.openClawCallsCount > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20' },
          { label: 'Network Calls Count',       value: summary.networkCallsCount,       color: summary.networkCallsCount > 0 ? 'text-destructive' : 'text-primary',       bg: summary.networkCallsCount > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20' },
          { label: 'Secret Exposed Count',      value: summary.secretExposedCount,      color: summary.secretExposedCount > 0 ? 'text-destructive' : 'text-primary',      bg: summary.secretExposedCount > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded px-2 py-1.5 ${bg}`}>
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
            <div className={`text-[13px] font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sources discovered */}
      <div className="flex flex-wrap gap-1.5">
        {summary.sourcesDiscovered.map(s => (
          <span key={s} className="px-2 py-1 text-[8px] font-mono border border-primary/20 bg-primary/5 text-primary rounded font-bold">{s}</span>
        ))}
        {summary.sourcesDiscovered.length === 0 && (
          <span className="text-[9px] text-slate-500 italic">No evidence sources found in localStorage yet.</span>
        )}
      </div>

      {/* Chain record list */}
      {chain.all.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Evidence Chain ({chain.all.length} records)</span>
            <span className="ml-auto text-[7px] text-slate-600 uppercase tracking-widest font-mono">Chronological · Read-only</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {chain.all.map((rec, i) => <ChainRow key={rec._stableId} rec={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Actions */}
      <CopyButton data={report} />

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        READ_ONLY · PREVIEW_ONLY · No network calls · No OpenClaw calls · No execution · No credential access · No dispatch · localStorage only.
      </div>
    </div>
  );
}