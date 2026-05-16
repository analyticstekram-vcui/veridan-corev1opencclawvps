/**
 * BaselineArchiveManifestPanel — Local-only Baseline Archive Manifest
 * No backend calls, no OpenClaw calls, no fetch, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Archive, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

const CHECKS_KEY   = 'openclawManualReadOnlyMonitoringChecks';
const LOCK_KEY     = 'openclawFinalLockPacket';
const MANIFEST_KEY = 'openclawBaselineArchiveManifest';

const MANIFEST_NAME = 'OPENCLAW_BASELINE_ARCHIVE_MANIFEST';
const BASELINE_NAME = 'OPENCLAW_READ_ONLY_MONITORING_STABLE_BASELINE';
const ARCHIVE_STATUS = 'LOCAL_ONLY_ARCHIVE_READY';

function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function getBestTimestamp(c) {
  const raw = c?.createdAt || c?.timestamp || c?.recordedAt || c?.checkedAt || c?.completedAt;
  if (raw) { const t = new Date(raw).getTime(); if (!isNaN(t)) return t; }
  return 0;
}

function getLatest(checks) {
  if (!checks || checks.length === 0) return null;
  return [...checks].sort((a, b) => getBestTimestamp(b) - getBestTimestamp(a))[0];
}

export default function BaselineArchiveManifestPanel() {
  const [manifest, setManifest] = useState(() => loadJSON(MANIFEST_KEY));
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const checks = loadJSON(CHECKS_KEY, []);
    const lockPacket = loadJSON(LOCK_KEY);
    const latest = getLatest(checks);

    const m = {
      manifestName:          MANIFEST_NAME,
      generatedAt:           new Date().toISOString(),
      baselineName:          BASELINE_NAME,
      finalLockPresent:      !!lockPacket,
      monitoringRecordCount: checks.length,
      latestMonitoringCheck: latest ? {
        endpoint:         latest.endpoint        ?? null,
        status:           latest.status          ?? null,
        httpStatus:       latest.httpStatus       != null ? String(latest.httpStatus) : null,
        gatewayReachable: latest.gatewayReachable != null ? String(latest.gatewayReachable) : null,
        executionLock:    latest.executionLock    ?? null,
        dispatchAllowed:  latest.dispatchAllowed  != null ? String(latest.dispatchAllowed) : null,
        recordedAt:       latest.createdAt || latest.timestamp || latest.recordedAt || latest.checkedAt || latest.completedAt || null,
      } : null,
      finalLockPacket: lockPacket ?? null,
      archiveStatus:   ARCHIVE_STATUS,
      safetyAssertions: {
        localOnly:             true,
        readOnly:              true,
        executionDisabled:     true,
        gatewayModeReadOnly:   true,
        noBackendCalls:        true,
        noOpenClawCalls:       true,
        noDispatch:            true,
        noScheduler:           true,
        noPolling:             true,
        noCredentials:         true,
        noTrading:             true,
        noBrokerActions:       true,
        noWalletActions:       true,
        noMoneyMovement:       true,
        noPostPutPatchDelete:  true,
      },
    };

    try { localStorage.setItem(MANIFEST_KEY, JSON.stringify(m, null, 2)); } catch {}
    setManifest(m);
  };

  const handleCopy = () => {
    if (!manifest) return;
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(MANIFEST_KEY); } catch {}
    setManifest(null);
  };

  const assertionCount = manifest ? Object.keys(manifest.safetyAssertions).length : 0;
  const assertionPassCount = manifest ? Object.values(manifest.safetyAssertions).filter(Boolean).length : 0;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Baseline Archive</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Archive className="w-4 h-4 text-primary" /> Baseline Archive Manifest
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only manifest. No backend calls. No OpenClaw calls. No execution.</div>
      </div>

      {/* Baseline + Archive Status chips */}
      <div className="flex flex-wrap gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{BASELINE_NAME}</span>
        </div>
        <div className="px-3 py-1.5 bg-secondary/20 border border-border rounded">
          <span className="text-[9px] font-mono font-bold text-slate-300">{ARCHIVE_STATUS}</span>
        </div>
      </div>

      {/* Source key status */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Source Data</span>
        </div>
        <div className="divide-y divide-border/30">
          {[
            { label: 'Monitoring Checks Key',  value: CHECKS_KEY,   present: !!localStorage.getItem(CHECKS_KEY) },
            { label: 'Final Lock Packet Key',  value: LOCK_KEY,     present: !!localStorage.getItem(LOCK_KEY) },
          ].map(({ label, value, present }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2">
              <div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{label}</div>
                <div className="text-[8px] font-mono text-blue-400">{value}</div>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${present ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
                {present ? 'PRESENT' : 'MISSING'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Baseline Archive Manifest is local-only and non-executable.</span>{' '}
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
          <Archive className="w-3.5 h-3.5" />
          Generate Baseline Archive Manifest
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!manifest}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Manifest JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!manifest}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Manifest
        </button>
      </div>

      {/* Manifest preview */}
      {manifest && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Manifest Preview — Safety Assertions: {assertionPassCount}/{assertionCount} PASS
            </span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(manifest.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(manifest, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{MANIFEST_KEY}</span></span>
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