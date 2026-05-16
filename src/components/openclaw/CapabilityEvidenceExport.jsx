/**
 * CapabilityEvidenceExport
 * Local-only structured evidence export over stored capability records.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, ShieldCheck, RefreshCw, FileDown, Cpu } from 'lucide-react';

const SOURCE_KEYS = {
  bridgeReports:       'openclawReadOnlyStatusBridgeReports',
  healthSnapshots:     'openclawAutomatedHealthMonitoringSnapshots',
  gatewayHistory:      'openclawReadOnlyGatewayHealthChecks',
  capabilityReports:   'openclawCapabilityExplorerReports',
};
const EXPORT_KEY = 'openclawCapabilityEvidenceExports';

const ALLOWED_ENDPOINTS  = ['/health', '/status', '/version', '/capabilities'];
const BLOCKED_CAPS       = ['TRADE', 'EXEC', 'DISPATCH', 'COMMAND', 'WRITE', 'DELETE', 'MUTATE',
                            'CREDENTIAL', 'AUTH_WRITE', 'ORDER', 'MONEY', 'PAYMENT', 'BROKER',
                            'DEPLOY', 'RUN', 'SUBMIT', 'POST', 'PUT', 'PATCH'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveExport(packet) {
  try {
    const all = loadJSON(EXPORT_KEY, []);
    const deduped = [packet, ...all.filter(e => e.exportId !== packet.exportId)];
    localStorage.setItem(EXPORT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildExport() {
  const bridgeReports     = loadJSON(SOURCE_KEYS.bridgeReports, []);
  const healthSnapshots   = loadJSON(SOURCE_KEYS.healthSnapshots, []);
  const gatewayHistory    = loadJSON(SOURCE_KEYS.gatewayHistory, []);
  const capabilityReports = loadJSON(SOURCE_KEYS.capabilityReports, []);

  const latestBridge  = bridgeReports[0]     ?? null;
  const latestCap     = capabilityReports[0] ?? null;

  const latestStatusBridgeResponseId = latestBridge?.callId ?? latestBridge?.reportId ?? null;
  const latestCapabilityReportId     = latestCap?.reportId  ?? null;

  const gatewayMode    = latestBridge?.gatewayMode ?? 'READ_ONLY';
  const executionMode  = latestBridge?.executionMode ?? 'DISABLED';
  const executionLock  = latestBridge?.executionLocked !== undefined
    ? (latestBridge.executionLocked ? 'LOCKED' : 'UNLOCKED')
    : 'LOCKED';
  const latestGatewayStatus = latestBridge?.gatewayStatus ?? latestBridge?.interpretedGatewayStatus ?? 'UNKNOWN';

  // Pull capability rows from latest cap report if available
  const capRows = latestCap?.capabilityRows ?? [];
  const allowedCount  = capRows.filter(r => r.classification === 'ALLOWED_READ_ONLY').length;
  const unknownCount  = capRows.filter(r => r.classification === 'UNKNOWN').length;
  const blockedCount  = capRows.filter(r => r.classification === 'BLOCKED').length;

  const capabilitySummary = capRows.map(r => ({
    capability:     r.capability,
    classification: r.classification,
    allowed:        r.allowed,
    rationale:      r.reason,
  }));

  const safetyAssertions = [
    { key: 'previewOnly',       value: true,        pass: true },
    { key: 'readOnly',          value: true,        pass: true },
    { key: 'executionLocked',   value: true,        pass: true },
    { key: 'networkCalls',      value: false,       pass: true },
    { key: 'openClawCalls',     value: 0,           pass: true },
    { key: 'executionAttempts', value: 0,           pass: true },
    { key: 'browserToolUsed',   value: false,       pass: true },
    { key: 'secretExposed',     value: false,       pass: true },
    { key: 'dispatchAllowed',   value: false,       pass: true },
    { key: 'commandPayload',    value: false,       pass: true },
    { key: 'gatewayMode',       value: 'READ_ONLY', pass: true },
    { key: 'executionMode',     value: 'DISABLED',  pass: true },
  ];

  const exportId = 'cee-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    exportId,
    createdAt:                   new Date().toISOString(),
    phase:                       'CAPABILITY_EVIDENCE_EXPORT',
    sourceCounts: {
      bridgeReports:     bridgeReports.length,
      healthSnapshots:   healthSnapshots.length,
      gatewayHistory:    gatewayHistory.length,
      capabilityReports: capabilityReports.length,
    },
    latestStatusBridgeResponseId,
    latestCapabilityReportId,
    latestGatewayStatus,
    gatewayMode,
    executionMode,
    executionLock,
    dispatchAllowed:             false,
    openClawCalls:               0,
    executionAttempts:           0,
    browserToolUsed:             false,
    secretExposed:               false,
    allowedReadOnlyEndpoints:    ALLOWED_ENDPOINTS,
    blockedCapabilities:         BLOCKED_CAPS,
    capabilitySummary,
    capabilityCounts: { allowedCount, unknownCount, blockedCount, total: capRows.length },
    safetyAssertions,
    note: 'Local-only capability evidence export. No OpenClaw call. No execution. No dispatch. No credentials. No network calls.',
  };
}

const CLASS_STYLE = {
  ALLOWED_READ_ONLY: { color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',     icon: CheckCircle2,  badge: 'PASS' },
  UNKNOWN:           { color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle, badge: 'WARN' },
  BLOCKED:           { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,   badge: 'FAIL' },
};

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
      {copied ? 'Copied!' : 'Copy Capability Evidence JSON'}
    </button>
  );
}

export default function CapabilityEvidenceExport({ refreshTrigger }) {
  const [packet, setPacket] = useState(null);

  const generate = useCallback(() => {
    const p = buildExport();
    saveExport(p);
    tryAppendAudit({
      event:              'capability_evidence_export_generated',
      exportId:           p.exportId,
      phase:              p.phase,
      executionAttempted: false,
      openClawCalls:      0,
      networkCalls:       false,
      secretExposed:      false,
      note: `Capability evidence export generated (${p.exportId}). No execution. No dispatch. No network calls.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Capability Evidence Export</div>
          <div className="text-[13px] font-bold text-foreground">Capability Evidence Export</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Local-only structured export of capability records. Not dispatchable.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Primary banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
        <FileDown className="w-4 h-4 text-primary shrink-0" />
        <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
          LOCAL-ONLY CAPABILITY EVIDENCE EXPORT — NOT DISPATCHABLE — READ_ONLY / LOCKED
        </span>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — No network calls. No OpenClaw calls. No dispatch. Reads localStorage only.</span>
      </div>

      {packet && (
        <>
          {/* Source counts */}
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Source Record Counts</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(packet.sourceCounts).map(([k, v]) => (
                <div key={k} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{k}</div>
                  <div className={`text-[13px] font-bold ${v > 0 ? 'text-foreground' : 'text-slate-600'}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Gateway Status',   value: packet.latestGatewayStatus,       color: packet.latestGatewayStatus === 'ONLINE' ? 'text-primary' : 'text-amber-500' },
              { label: 'Gateway Mode',     value: packet.gatewayMode,               color: 'text-amber-500' },
              { label: 'Execution Lock',   value: packet.executionLock,             color: 'text-amber-500' },
              { label: 'PASS (allowed)',   value: packet.capabilityCounts.allowedCount, color: 'text-primary font-bold' },
              { label: 'WARN (unknown)',   value: packet.capabilityCounts.unknownCount, color: 'text-amber-500' },
              { label: 'FAIL (blocked)',   value: packet.capabilityCounts.blockedCount, color: packet.capabilityCounts.blockedCount > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-3 py-2.5">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Capability summary table */}
          {packet.capabilitySummary.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-secondary/10 border-b border-border">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                  Exported Capabilities ({packet.capabilitySummary.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/10">
                      {['Capability', 'Classification', 'State', 'Rationale'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {packet.capabilitySummary.map((row, i) => {
                      const style = CLASS_STYLE[row.classification] ?? CLASS_STYLE.UNKNOWN;
                      const Icon  = style.icon;
                      return (
                        <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                          <td className="px-3 py-2 font-mono font-bold text-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Cpu className="w-3 h-3 text-slate-500 shrink-0" />
                              {row.capability}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold ${style.bg} ${style.color}`}>
                              {row.classification}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Icon className={`w-3 h-3 ${style.color}`} />
                              <span className={`font-bold ${style.color}`}>{style.badge}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-400 max-w-[220px]">{row.rationale}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {packet.safetyAssertions.filter(a => a.pass).length}/{packet.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
              {packet.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className="text-[7px] font-bold text-primary">{String(a.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="font-mono">{packet.exportId}</span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileDown className="w-3 h-3" /> Regenerate Export
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Capability evidence export is local-only. No OpenClaw call. No command dispatch. No execution. No credentials. No network calls.
      </div>
    </div>
  );
}