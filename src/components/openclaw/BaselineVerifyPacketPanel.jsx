/**
 * BaselineVerifyPacketPanel — Local-only Verification Packet
 * Checks consistency between monitoring checks, final lock, archive manifest, and export packet.
 * No backend calls, no OpenClaw calls, no fetch, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { ClipboardCheck, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

const CHECKS_KEY   = 'openclawManualReadOnlyMonitoringChecks';
const LOCK_KEY     = 'openclawFinalLockPacket';
const MANIFEST_KEY = 'openclawBaselineArchiveManifest';
const EXPORT_KEY   = 'openclawReadOnlyMonitoringExportPacket';
const VERIFY_KEY   = 'openclawReadOnlyMonitoringVerifyPacket';

const VERIFY_NAME   = 'OPENCLAW_READ_ONLY_MONITORING_VERIFY_PACKET';
const BASELINE_NAME = 'OPENCLAW_READ_ONLY_MONITORING_STABLE_BASELINE';

function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function norm(val) { return String(val ?? '').trim().toUpperCase(); }
function isFalse(val) { return val === false || String(val).toLowerCase() === 'false'; }

function buildChecks(checks, lock, manifest, exportPkt) {
  const latest = checks && checks.length > 0 ? checks[0] : null;

  return {
    monitoringRecordsPresent:    Array.isArray(checks) && checks.length > 0,
    finalLockPresent:            !!lock,
    archiveManifestPresent:      !!manifest,
    exportPacketPresent:         !!exportPkt,
    baselineNamesMatch: (
      norm(lock?.baselineName) === norm(BASELINE_NAME) &&
      norm(manifest?.baselineName) === norm(BASELINE_NAME) &&
      norm(exportPkt?.baselineName) === norm(BASELINE_NAME)
    ),
    executionDisabled: (
      lock?.safetyAssertions?.executionDisabled === true &&
      manifest?.safetyAssertions?.executionDisabled === true &&
      exportPkt?.safetyAssertions?.executionDisabled === true
    ),
    gatewayModeReadOnly: (
      norm(lock?.gatewayMode) === 'READ_ONLY' &&
      manifest?.safetyAssertions?.gatewayModeReadOnly === true &&
      exportPkt?.safetyAssertions?.gatewayModeReadOnly === true
    ),
    approvalStatusNonExecutable:
      norm(lock?.approvalStatus) === 'PREVIEW_ONLY_NOT_EXECUTABLE',
    exportStatusReady:
      norm(exportPkt?.exportStatus) === 'LOCAL_ONLY_EXPORT_READY',
    archiveStatusReady:
      norm(manifest?.archiveStatus) === 'LOCAL_ONLY_ARCHIVE_READY',
  };
}

export default function BaselineVerifyPacketPanel() {
  const [verifyPacket, setVerifyPacket] = useState(() => loadJSON(VERIFY_KEY));
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const checks   = loadJSON(CHECKS_KEY, []);
    const lock     = loadJSON(LOCK_KEY);
    const manifest = loadJSON(MANIFEST_KEY);
    const exportPkt = loadJSON(EXPORT_KEY);

    const checkResults = buildChecks(checks, lock, manifest, exportPkt);
    const allPass = Object.values(checkResults).every(Boolean);

    const p = {
      verifyName:         VERIFY_NAME,
      generatedAt:        new Date().toISOString(),
      baselineName:       BASELINE_NAME,
      checks:             checkResults,
      verificationStatus: allPass ? 'VERIFIED' : 'HOLD_FOR_REVIEW',
      safetyAssertions: {
        localOnly:            true,
        readOnly:             true,
        executionDisabled:    true,
        gatewayModeReadOnly:  true,
        noBackendCalls:       true,
        noOpenClawCalls:      true,
        noDispatch:           true,
        noScheduler:          true,
        noPolling:            true,
        noCredentials:        true,
        noTrading:            true,
        noBrokerActions:      true,
        noWalletActions:      true,
        noMoneyMovement:      true,
        noPostPutPatchDelete: true,
      },
    };

    try { localStorage.setItem(VERIFY_KEY, JSON.stringify(p, null, 2)); } catch {}
    setVerifyPacket(p);
  };

  const handleCopy = () => {
    if (!verifyPacket) return;
    navigator.clipboard.writeText(JSON.stringify(verifyPacket, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(VERIFY_KEY); } catch {}
    setVerifyPacket(null);
  };

  const checkEntries = verifyPacket ? Object.entries(verifyPacket.checks) : [];
  const passCount = checkEntries.filter(([, v]) => v).length;
  const isVerified = verifyPacket?.verificationStatus === 'VERIFIED';

  const CHECK_LABELS = {
    monitoringRecordsPresent:    'Monitoring Records Present',
    finalLockPresent:            'Final Lock Packet Present',
    archiveManifestPresent:      'Archive Manifest Present',
    exportPacketPresent:         'Export Packet Present',
    baselineNamesMatch:          'Baseline Names Match Across All Packets',
    executionDisabled:           'Execution Disabled (All Packets)',
    gatewayModeReadOnly:         'Gateway Mode READ_ONLY (All Packets)',
    approvalStatusNonExecutable: 'Approval Status PREVIEW_ONLY_NOT_EXECUTABLE',
    exportStatusReady:           'Export Status LOCAL_ONLY_EXPORT_READY',
    archiveStatusReady:          'Archive Status LOCAL_ONLY_ARCHIVE_READY',
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Verify Packet</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" /> Baseline Verify Packet
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Consistency check across all baseline evidence packets. Local-only. No backend calls. No execution.</div>
      </div>

      {/* Baseline chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">{BASELINE_NAME}</span>
      </div>

      {/* Verification status badge — shown after generation */}
      {verifyPacket && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
          isVerified
            ? 'bg-primary/5 border-primary/30'
            : 'bg-amber-500/5 border-amber-500/30'
        }`}>
          {isVerified
            ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          }
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${isVerified ? 'text-primary' : 'text-amber-500'}`}>
              {verifyPacket.verificationStatus}
            </div>
            <div className="text-[8px] text-slate-500">{passCount}/{checkEntries.length} checks passed</div>
          </div>
        </div>
      )}

      {/* Check results table */}
      {verifyPacket && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Consistency Checks</span>
          </div>
          <div className="divide-y divide-border/30">
            {checkEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between px-4 py-2">
                <span className="text-[9px] text-slate-300">{CHECK_LABELS[key] || key}</span>
                <div className="flex items-center gap-1.5">
                  {value
                    ? <CheckCircle2 className="w-3 h-3 text-primary" />
                    : <XCircle className="w-3 h-3 text-amber-500" />
                  }
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                    value
                      ? 'text-primary border-primary/30 bg-primary/5'
                      : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
                  }`}>
                    {value ? 'PASS' : 'HOLD'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Verify Packet is local-only and non-executable.</span>{' '}
          It does not authorize automation, trading, credentials, browser control, or money movement.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Generate Verify Packet
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!verifyPacket}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Verify Packet JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!verifyPacket}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Verify Packet
        </button>
      </div>

      {/* JSON preview */}
      {verifyPacket && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Verify Packet — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(verifyPacket.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(verifyPacket, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{VERIFY_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No scheduler. No polling. No dispatch. No execution. No backend calls. No OpenClaw calls.
      </div>
    </div>
  );
}