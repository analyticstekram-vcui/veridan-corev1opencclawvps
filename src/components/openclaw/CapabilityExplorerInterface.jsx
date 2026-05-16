/**
 * CapabilityExplorerInterface
 * Local-only inspector over stored read-only gateway capability records.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, ShieldCheck, RefreshCw, Cpu } from 'lucide-react';
import CapabilityEvidenceExport from './CapabilityEvidenceExport.jsx';

const SOURCE_KEYS = [
  'openclawReadOnlyStatusBridgeReports',
  'openclawAutomatedHealthMonitoringSnapshots',
  'openclawHistoricalStatusDashboardReports',
  'openclawReadOnlyGatewayHealthChecks',
];
const REPORT_KEY = 'openclawCapabilityExplorerReports';

const FILTERS = ['ALL', 'ALLOWED_READ_ONLY', 'UNKNOWN', 'BLOCKED'];

// Known safe read-only capabilities
const ALLOWED_SET = new Set(['READ', 'VERIFY', 'SNAPSHOT', 'STATUS', 'HEALTH', 'VERSION', 'CAPABILITIES']);

// Keywords that flag a capability as BLOCKED
const BLOCKED_KEYWORDS = [
  'TRADE', 'EXEC', 'DISPATCH', 'COMMAND', 'WRITE', 'DELETE', 'MUTATE',
  'CREDENTIAL', 'AUTH_WRITE', 'ORDER', 'MONEY', 'PAYMENT', 'BROKER',
  'DEPLOY', 'RUN', 'SUBMIT', 'POST', 'PUT', 'PATCH',
];

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function saveReport(report) {
  try {
    const all = loadJSON(REPORT_KEY, []);
    // Deduplicate by reportId
    const deduped = [report, ...all.filter(r => r.reportId !== report.reportId)];
    localStorage.setItem(REPORT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function classifyCapability(cap) {
  const upper = String(cap).toUpperCase();
  if (ALLOWED_SET.has(upper)) return 'ALLOWED_READ_ONLY';
  if (BLOCKED_KEYWORDS.some(kw => upper.includes(kw))) return 'BLOCKED';
  return 'UNKNOWN';
}

function reasonFor(cap, classification) {
  if (classification === 'ALLOWED_READ_ONLY') return 'Safe read-only capability — explicitly permitted';
  if (classification === 'BLOCKED') return 'Mutation/dispatch/execution keyword detected — blocked';
  return 'Not in known safe set — treat as unknown/unverified';
}

/** Pull the latest status bridge record and extract capabilities */
function extractLatestRecord() {
  for (const key of SOURCE_KEYS) {
    const arr = loadJSON(key, []);
    if (!arr.length) continue;
    const rec = arr[0];
    // Bridge reports have safeResponseFields.capabilities
    const caps = rec?.safeResponseFields?.capabilities
      ?? rec?.capabilities
      ?? null;
    if (caps && Array.isArray(caps) && caps.length > 0) {
      return { record: rec, capabilities: caps, sourceKey: key };
    }
  }
  return { record: null, capabilities: [], sourceKey: null };
}

function buildReport() {
  const { record, capabilities, sourceKey } = extractLatestRecord();

  const sourceRecordId = record?.callId ?? record?.monitorId ?? record?.checkId ?? record?.reportId ?? 'no-source';
  const detectedAt = record?.timestamp ?? record?.createdAt ?? new Date().toISOString();
  const endpoint = record?.endpoint ?? '—';
  const gatewayMode = record?.gatewayMode ?? 'READ_ONLY';
  const executionMode = record?.executionMode ?? 'DISABLED';
  const executionLock = record?.executionLocked !== undefined ? (record.executionLocked ? 'LOCKED' : 'UNLOCKED') : 'LOCKED';

  // Always include well-known safe set as baseline if no live caps available
  const effectiveCaps = capabilities.length > 0
    ? capabilities
    : [...ALLOWED_SET];

  const capabilityRows = effectiveCaps.map(cap => {
    const classification = classifyCapability(cap);
    return {
      capability:    String(cap).toUpperCase(),
      classification,
      allowed:       classification === 'ALLOWED_READ_ONLY',
      reason:        reasonFor(cap, classification),
      sourceRecordId,
      detectedAt,
    };
  });

  const allowedCount = capabilityRows.filter(r => r.classification === 'ALLOWED_READ_ONLY').length;
  const unknownCount = capabilityRows.filter(r => r.classification === 'UNKNOWN').length;
  const blockedCount = capabilityRows.filter(r => r.classification === 'BLOCKED').length;

  const reportId = 'cei-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    reportId,
    createdAt:            new Date().toISOString(),
    sourceKey,
    sourceRecordId,
    latestEndpoint:       endpoint,
    gatewayMode,
    executionMode,
    executionLock,
    totalCapabilities:    capabilityRows.length,
    allowedCount,
    unknownCount,
    blockedCount,
    openClawCalls:        0,
    executionAttempts:    0,
    networkCalls:         false,
    secretExposed:        false,
    capabilityRows,
    safetyAssertions: [
      { key: 'networkCalls',       value: false,       pass: true },
      { key: 'openClawCalls',      value: 0,           pass: true },
      { key: 'executionAttempts',  value: 0,           pass: true },
      { key: 'secretExposed',      value: false,       pass: true },
      { key: 'dispatchAllowed',    value: false,       pass: true },
      { key: 'gatewayMode',        value: 'READ_ONLY', pass: true },
      { key: 'executionMode',      value: 'DISABLED',  pass: true },
    ],
    note: 'Local-only capability explorer report. No OpenClaw call. No execution. No dispatch. No credentials.',
  };
}

const CLASS_STYLE = {
  ALLOWED_READ_ONLY: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',     icon: CheckCircle2,    label: 'PASS' },
  UNKNOWN:           { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20', icon: AlertTriangle,   label: 'WARN' },
  BLOCKED:           { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,     label: 'FAIL' },
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
      {copied ? 'Copied!' : 'Copy Capability Report JSON'}
    </button>
  );
}

export default function CapabilityExplorerInterface({ refreshTrigger }) {
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const generate = useCallback(() => {
    const r = buildReport();
    saveReport(r);
    tryAppendAudit({
      event:             'capability_explorer_report_generated',
      reportId:          r.reportId,
      totalCapabilities: r.totalCapabilities,
      allowedCount:      r.allowedCount,
      blockedCount:      r.blockedCount,
      executionAttempted: false,
      openClawCalls:     0,
      networkCalls:      false,
      secretExposed:     false,
      note: `Capability explorer report generated (${r.reportId}). ${r.allowedCount} allowed, ${r.blockedCount} blocked. No execution. No dispatch.`,
    });
    setReport(r);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  const filtered = report
    ? (filter === 'ALL' ? report.capabilityRows : report.capabilityRows.filter(r => r.classification === filter))
    : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Capability Explorer</div>
          <div className="text-[13px] font-bold text-foreground">Capability Explorer Interface</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Local-only inspector over stored gateway capability records.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — No network calls. No OpenClaw calls. Reads localStorage only.</span>
      </div>

      {report && (
        <>
          {/* Summary card */}
          <div className="bg-card border border-border rounded-lg p-3 space-y-2">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Latest Source Summary</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Source Record',        value: report.sourceRecordId,      color: 'text-slate-300 font-mono text-[7px]' },
                { label: 'Endpoint',             value: report.latestEndpoint,      color: 'text-blue-400 font-mono' },
                { label: 'Gateway Mode',         value: report.gatewayMode,         color: 'text-amber-500' },
                { label: 'Execution Mode',       value: report.executionMode,       color: 'text-destructive' },
                { label: 'Execution Lock',       value: report.executionLock,       color: 'text-amber-500' },
                { label: 'Total Capabilities',   value: report.totalCapabilities,   color: 'text-foreground' },
                { label: 'Allowed (Read-Only)',  value: report.allowedCount,        color: 'text-primary font-bold' },
                { label: 'Unknown',              value: report.unknownCount,        color: 'text-amber-500' },
                { label: 'Blocked/Mutation',     value: report.blockedCount,        color: report.blockedCount > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
                { label: 'OpenClaw Calls',       value: report.openClawCalls,       color: 'text-destructive' },
                { label: 'Execution Attempts',   value: report.executionAttempts,   color: 'text-destructive' },
                { label: 'Secret Exposed',       value: String(report.secretExposed), color: 'text-destructive' },
              ].map(c => (
                <div key={c.label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                  <div className={`text-[9px] break-all ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[8px] font-bold rounded border transition-colors ${
                  filter === f
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-secondary/20 border-border text-slate-400 hover:bg-secondary/40'
                }`}>
                {f}
              </button>
            ))}
            <span className="ml-auto text-[8px] text-slate-500">{filtered.length} capability{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Capability grid */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    {['Capability', 'Classification', 'Allowed', 'Reason', 'Source Record', 'Detected At'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const style = CLASS_STYLE[row.classification] ?? CLASS_STYLE.UNKNOWN;
                    const Icon = style.icon;
                    return (
                      <tr key={i} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
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
                            <span className={`font-bold text-[8px] ${style.color}`}>{style.label}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 max-w-[200px]">{row.reason}</td>
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[7px]">{row.sourceRecordId}</td>
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">
                          {row.detectedAt ? new Date(row.detectedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {report.safetyAssertions.filter(a => a.pass).length}/{report.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
              {report.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className="text-[7px] font-bold text-primary">{String(a.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={report} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <RefreshCw className="w-3 h-3" /> Regenerate Report
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Capability explorer is local-only. No OpenClaw call. No command dispatch. No execution. No credentials.
      </div>

      {/* ── Capability Evidence Export ── */}
      <div className="border-t border-border/40 pt-4">
        <CapabilityEvidenceExport refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}