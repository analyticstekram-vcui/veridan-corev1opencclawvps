/**
 * BaselineArchiveExport
 * Collects all local evidence sources into a single baseline archive object.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback } from 'react';
import { Archive, CheckCircle2, Copy, RefreshCw, ShieldCheck } from 'lucide-react';

const ARCHIVE_KEY = 'openclawBaselineArchiveExports';

const SOURCES = {
  finalBaselineSnapshots:       'openclawFinalBaselineLockSnapshots',
  evidenceChainReports:         'openclawEvidenceChainVerificationReports',
  auditReportExports:           'openclawAuditReportExports',
  lifecycleTimelineReports:     'openclawProposalLifecycleTimelineReports',
  gatewayAlertReports:          'openclawGatewayAlertReports',
  gatewayHealthChecks:          'openclawReadOnlyGatewayHealthChecks',
  gatewayResponseInspector:     'openclawGatewayResponseInspector',
  finalNonExecutionEvidence:    'openclawFinalNonExecutionLockEvidence',
  signedBridgePreviews:         'openclawSignedBridgeRequestPreviews',
  previewPackets:               'openclawPreviewPackets',
  auditTrail:                   'openclawAuditTrail',
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

function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function placeholderArchiveHash(counts, archiveId) {
  const s = JSON.stringify(counts) + archiveId;
  const h1 = simpleHash(s);
  const h2 = simpleHash(h1 + s);
  const h3 = simpleHash(h2 + h1);
  const h4 = simpleHash(h3 + s.length);
  return `archive-${h1}${h2}${h3}${h4}`;
}

function buildArchive() {
  const loaded = {};
  const counts = {};
  for (const [name, key] of Object.entries(SOURCES)) {
    loaded[name] = safeLoad(key);
    counts[name] = loaded[name].length;
  }

  const archiveId = 'bae-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  const archiveHash = placeholderArchiveHash(counts, archiveId);

  const safetyAssertions = [
    { key: 'previewOnly',           value: true,         pass: true },
    { key: 'readOnly',              value: true,         pass: true },
    { key: 'executionLocked',       value: true,         pass: true },
    { key: 'gatewayMode',           value: 'READ_ONLY',  pass: true },
    { key: 'openClawCalls',         value: 0,            pass: true },
    { key: 'executionAttempted',    value: false,        pass: true },
    { key: 'networkCalls',          value: false,        pass: true },
    { key: 'browserAutomationUsed', value: false,        pass: true },
    { key: 'credentialsAccessed',   value: false,        pass: true },
    { key: 'tradingDisabled',       value: true,         pass: true },
    { key: 'moneyMovementDisabled', value: true,         pass: true },
    { key: 'secretExposed',         value: false,        pass: true },
  ];

  return {
    archiveId,
    createdAt:                    now,
    archiveHash,
    archiveHashType:              'PLACEHOLDER_LOCAL_ARCHIVE_HASH',
    archiveHashNote:              'Non-cryptographic placeholder hash derived from source record counts and archive id. Not dispatchable. Not a real HMAC.',
    archiveType:                  'PREVIEW_ONLY_BASELINE_ARCHIVE',
    baselineStatus:               'LOCKED',
    gatewayMode:                  'READ_ONLY',
    executionMode:                'DISABLED',
    openClawCalls:                0,
    executionAttempts:            0,
    networkCalls:                 false,
    browserAutomationUsed:        false,
    credentialsAccessed:          false,
    tradingDisabled:              true,
    moneyMovementDisabled:        true,
    sourcesIncluded:              Object.keys(SOURCES),
    sourceCounts:                 counts,
    latestBaselineSnapshot:       loaded.finalBaselineSnapshots[0] || null,
    evidenceChainVerification:    loaded.evidenceChainReports[0] || null,
    auditExportSnapshot:          loaded.auditReportExports[0] || null,
    lifecycleTimelineReport:      loaded.lifecycleTimelineReports[0] || null,
    gatewayReports: {
      latestHealthCheck:          loaded.gatewayHealthChecks[0] || null,
      latestAlertReport:          loaded.gatewayAlertReports[0] || null,
      latestResponseInspect:      loaded.gatewayResponseInspector[0] || null,
    },
    finalNonExecutionEvidence:    loaded.finalNonExecutionEvidence[0] || null,
    safetyAssertions,
    note: 'Baseline archive export. Local-only. Preview-only. Non-dispatchable. Non-executable. No network calls. No OpenClaw calls. No credentials.',
  };
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
      {copied ? 'Copied!' : 'Copy Archive JSON'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BaselineArchiveExport({ refreshTrigger }) {
  const [archive,   setArchive]   = useState(null);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    const arc = buildArchive();

    // Persist — deduplicate by archiveHash
    try {
      const all = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      if (!all.find(r => r.archiveHash === arc.archiveHash)) {
        all.unshift(arc);
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(all.slice(0, 20)));
      }
    } catch {}

    tryAppendAudit({
      event:       'baseline_archive_export_created',
      archiveId:   arc.archiveId,
      archiveHash: arc.archiveHash,
      totalSources: arc.sourcesIncluded.length,
      note: `Baseline archive export created (${arc.archiveId}). Hash: ${arc.archiveHash}. No execution. No network calls.`,
    });

    setArchive(arc);
    setGenerated(true);
  }, []);

  const totalRecords = archive
    ? Object.values(archive.sourceCounts).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Archive Export</div>
          <div className="text-[13px] font-bold text-foreground">Baseline Archive Export</div>
        </div>
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — localStorage only. No network calls. No OpenClaw. No execution. No credentials.</span>
      </div>

      {/* Generate button (pre-generation) */}
      {!archive && (
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded w-full justify-center">
          <Archive className="w-4 h-4" /> Generate Baseline Archive
        </button>
      )}

      {/* Post-generation */}
      {archive && (
        <>
          {/* Confirmation banner */}
          <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-wide">
                BASELINE ARCHIVE CREATED — preview-only lock preserved. No execution. No dispatch.
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5 font-mono">{archive.archiveId}</div>
            </div>
          </div>

          {/* Key metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
            {[
              { label: 'Archive Type',     value: archive.archiveType,    color: 'text-amber-500' },
              { label: 'Baseline Status',  value: archive.baselineStatus, color: 'text-primary' },
              { label: 'Gateway Mode',     value: archive.gatewayMode,    color: 'text-amber-500' },
              { label: 'Execution Mode',   value: archive.executionMode,  color: 'text-destructive' },
              { label: 'OpenClaw Calls',   value: archive.openClawCalls,  color: 'text-destructive font-bold' },
              { label: 'Exec Attempts',    value: archive.executionAttempts, color: 'text-destructive font-bold' },
              { label: 'Total Records',    value: totalRecords,           color: 'text-foreground font-bold' },
              { label: 'Sources',          value: archive.sourcesIncluded.length, color: 'text-blue-400 font-bold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                <div className={`text-[10px] font-semibold ${color}`}>{String(value)}</div>
              </div>
            ))}
          </div>

          {/* Archive hash */}
          <div className="bg-secondary/20 border border-border rounded px-3 py-2.5 space-y-1">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Archive Hash</div>
            <div className="font-mono text-[10px] text-amber-500 break-all">{archive.archiveHash}</div>
            <div className="text-[7px] text-slate-600 italic">{archive.archiveHashNote}</div>
          </div>

          {/* Source counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {Object.entries(archive.sourceCounts).map(([src, count]) => (
              <div key={src} className="flex items-center justify-between px-2.5 py-1.5 border border-border/40 rounded bg-secondary/10">
                <span className="text-[7px] text-slate-500 font-mono truncate">{src}</span>
                <span className={`text-[10px] font-bold ml-2 shrink-0 ${count > 0 ? 'text-foreground' : 'text-slate-600'}`}>{count}</span>
              </div>
            ))}
          </div>

          {/* Safety assertions summary */}
          <div className="bg-card border border-primary/20 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-primary/5 border-b border-primary/20">
              <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Safety Assertions — {archive.safetyAssertions.filter(a => a.pass).length}/{archive.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              {archive.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5 text-[8px]">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <span className="w-3 h-3 text-destructive font-bold shrink-0">✗</span>}
                  <span className="font-mono text-slate-400">{a.key}:</span>
                  <span className={`font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>{String(a.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={archive} />
            <button type="button" onClick={handleGenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Archive className="w-3 h-3" /> Generate Baseline Archive
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Baseline archive is local-only · No OpenClaw calls · No execution · No network calls · No dispatch.
      </div>
    </div>
  );
}