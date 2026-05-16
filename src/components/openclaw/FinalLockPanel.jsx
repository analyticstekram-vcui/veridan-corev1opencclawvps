/**
 * FinalLockPanel — Phase 14: Evidence Export + Final Lock
 * Preview-only. Local-only. No backend calls, no OpenClaw calls, no execution.
 */
import React, { useState } from 'react';
import { Lock, FileJson, Copy, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';
const LOCK_KEY   = 'openclawFinalLockPacket';
const BASELINE   = 'OPENCLAW_READ_ONLY_MONITORING_STABLE_BASELINE';

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(CHECKS_KEY) || '[]'); } catch { return []; }
}

function norm(val) { return String(val ?? '').trim().toUpperCase(); }
function isTrue(val) { return val === true || String(val).toLowerCase() === 'true'; }
function isFalse(val) { return val === false || String(val).toLowerCase() === 'false'; }

function getBestTimestamp(c) {
  const raw = c.createdAt || c.timestamp || c.recordedAt || c.checkedAt || c.completedAt;
  if (raw) { const t = new Date(raw).getTime(); if (!isNaN(t)) return t; }
  return 0;
}

function getLatest(checks) {
  if (!checks || checks.length === 0) return null;
  return [...checks].sort((a, b) => getBestTimestamp(b) - getBestTimestamp(a))[0];
}

function getTimestamp(c) {
  return c?.createdAt || c?.timestamp || c?.recordedAt || c?.checkedAt || c?.completedAt || null;
}

export default function FinalLockPanel() {
  const [packet, setPacket] = useState(null);
  const [copied, setCopied] = useState(false);

  const checks = loadChecks();
  const c = getLatest(checks);

  const handleGenerate = () => {
    const ts = getTimestamp(c);
    const p = {
      baselineName:        BASELINE,
      generatedAt:         new Date().toISOString(),
      monitoringRecordCount: checks.length,
      latestCheck: c ? {
        endpoint:        c.endpoint       ?? null,
        status:          c.status         ?? null,
        httpStatus:      c.httpStatus      != null ? String(c.httpStatus) : null,
        gatewayReachable: c.gatewayReachable != null ? String(c.gatewayReachable) : null,
        executionLock:   c.executionLock   ?? null,
        dispatchAllowed: c.dispatchAllowed  != null ? String(c.dispatchAllowed) : null,
        recordedAt:      ts,
      } : null,
      safetyAssertions: {
        readOnly:                   true,
        executionLock:              'LOCKED',
        dispatchAllowed:            false,
        schedulerActive:            false,
        pollingLoopActive:          false,
        tradingAttempted:           false,
        brokerActionsAttempted:     false,
        walletActionsBlocked:       true,
        moneyMovementBlocked:       true,
        mutationEndpointsBlocked:   true,
        credentialExposed:          false,
        browserAutomationBlocked:   true,
        openClawCommandSent:        false,
        executionAttempted:         false,
        secretExposed:              false,
      },
      executionStatus:  'DISABLED',
      gatewayMode:      'READ_ONLY',
      approvalStatus:   'PREVIEW_ONLY_NOT_EXECUTABLE',
      note: 'Final Lock Packet is local-only and non-executable. It does not authorize automation, trading, credentials, browser control, or money movement.',
    };

    try { localStorage.setItem(LOCK_KEY, JSON.stringify(p, null, 2)); } catch {}
    setPacket(p);
  };

  const handleCopy = () => {
    if (!packet) return;
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ts = c ? getTimestamp(c) : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 14 · Evidence Export + Final Lock</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" /> Final Lock Panel
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only preview. No execution. No backend calls. No OpenClaw calls.</div>
      </div>

      {/* Baseline name */}
      <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
        <div>
          <div className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold">Baseline</div>
          <div className="text-[10px] font-mono font-bold text-primary">{BASELINE}</div>
        </div>
      </div>

      {/* Current monitoring snapshot */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Current Monitoring Snapshot</span>
        </div>
        <div className="divide-y divide-border/30">
          {[
            { label: 'Total Records',       value: String(checks.length),                                            vc: 'text-primary font-bold' },
            { label: 'Latest Endpoint',     value: c?.endpoint            ?? '—',                                    vc: 'text-blue-400 font-mono text-[9px]' },
            { label: 'Latest Status',       value: c?.status              ?? '—',                                    vc: 'text-foreground' },
            { label: 'Latest HTTP Status',  value: c?.httpStatus           != null ? String(c.httpStatus)  : '—',    vc: 'text-foreground' },
            { label: 'Gateway Reachable',   value: c?.gatewayReachable     != null ? String(c.gatewayReachable) : '—', vc: isTrue(c?.gatewayReachable) ? 'text-primary' : 'text-amber-500' },
            { label: 'Execution Lock',      value: c?.executionLock        ?? '—',                                    vc: norm(c?.executionLock) === 'LOCKED' ? 'text-destructive font-bold' : 'text-amber-500' },
            { label: 'Dispatch Allowed',    value: c?.dispatchAllowed       != null ? String(c.dispatchAllowed) : '—', vc: isFalse(c?.dispatchAllowed) ? 'text-primary' : 'text-destructive' },
            { label: 'Recorded At',         value: ts ? new Date(ts).toLocaleString() : '—',                         vc: 'text-slate-300 text-[9px]' },
          ].map(({ label, value, vc }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
              <span className={`text-[10px] font-mono ${vc}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Final Lock Packet is local-only and non-executable.</span>{' '}
          It does not authorize automation, trading, credentials, browser control, or money movement.
        </p>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded"
      >
        <FileJson className="w-3.5 h-3.5" />
        Generate Final Lock Packet
      </button>

      {/* Packet preview */}
      {packet && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Final Lock Packet — Preview</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-[8px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(packet, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{LOCK_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <Lock className="w-3 h-3 shrink-0" />
        Local-only. No scheduler. No polling. No dispatch. No execution. No backend calls. No OpenClaw calls.
      </div>
    </div>
  );
}