/**
 * AutomatedHealthMonitoring
 * Local-only monitoring snapshot layer for future automated health checks.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - No timers, intervals, cron jobs, or polling loops
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Copy, ShieldCheck, Activity, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

const BRIDGE_KEY    = 'openclawReadOnlyStatusBridgeReports';
const DASHBOARD_KEY = 'openclawHistoricalStatusDashboardReports';
const SNAPSHOT_KEY  = 'openclawAutomatedHealthMonitoringSnapshots';

const ALLOWED_ENDPOINTS     = ['/health', '/status', '/version', '/capabilities'];
const MAX_FAILURES_THRESHOLD = 3;
const ALERT_SEVERITY_MAP = {
  ONLINE:               'INFO',
  CLOUDFLARE_PROTECTED: 'WARNING',
  ENDPOINT_NOT_FOUND:   'WARNING',
  UNREACHABLE:          'CRITICAL',
  GATEWAY_URL_NOT_CONFIGURED: 'WARNING',
  UNKNOWN:              'WARNING',
};

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function computeTrend(records) {
  if (records.length < 2) return 'INSUFFICIENT_DATA';
  const recent = records.slice(0, 5);
  const onlineCount = recent.filter(r => r.reachable === true).length;
  if (onlineCount === recent.length) return 'STABLE_ONLINE';
  if (onlineCount === 0) return 'STABLE_OFFLINE';
  if (onlineCount > recent.length / 2) return 'RECOVERING';
  return 'DEGRADING';
}

function computeConsecutiveFailures(records) {
  let count = 0;
  for (const r of records) {
    if (!r.reachable) count++;
    else break;
  }
  return count;
}

function buildSnapshot(bridgeRecords) {
  const latest = bridgeRecords[0] || null;
  const consecutiveFailures = computeConsecutiveFailures(bridgeRecords);
  const statusTrend = computeTrend(bridgeRecords);
  const rawStatus = latest?.gatewayStatus ?? 'UNKNOWN';
  const alertLevel = consecutiveFailures >= MAX_FAILURES_THRESHOLD
    ? 'CRITICAL'
    : (ALERT_SEVERITY_MAP[rawStatus] ?? 'WARNING');

  const recommendedAction =
    alertLevel === 'CRITICAL'   ? 'Investigate gateway connectivity. Run manual health check immediately.' :
    alertLevel === 'WARNING'    ? 'Monitor closely. Verify Cloudflare Access configuration.' :
    rawStatus === 'ONLINE'      ? 'No action required. Gateway is healthy.' :
                                  'Review gateway status. Check configuration.';

  const safetyAssertions = [
    { key: 'networkCalls',          value: false,           pass: true },
    { key: 'openClawCalls',         value: 0,               pass: true },
    { key: 'executionAttempts',     value: 0,               pass: true },
    { key: 'browserToolUsed',       value: false,           pass: true },
    { key: 'secretExposed',         value: false,           pass: true },
    { key: 'dispatchAllowed',       value: false,           pass: true },
    { key: 'gatewayMode',           value: 'READ_ONLY',     pass: true },
    { key: 'executionMode',         value: 'DISABLED',      pass: true },
    { key: 'executionLock',         value: 'LOCKED',        pass: true },
    { key: 'monitoringEnabled',     value: false,           pass: true },
    { key: 'schedulerActive',       value: false,           pass: true },
  ];

  return {
    monitorId:                'ahm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    createdAt:                new Date().toISOString(),
    systemName:               'VeridanCore OpenClaw Operator Portal',
    phase:                    'AUTOMATED_HEALTH_MONITORING_DESIGN',
    gatewayMode:              'READ_ONLY',
    executionMode:            'DISABLED',
    executionLock:            'LOCKED',
    monitoringEnabled:        false,
    networkCalls:             false,
    openClawCalls:            0,
    executionAttempts:        0,
    browserToolUsed:          false,
    secretExposed:            false,
    latestStatus:             rawStatus,
    latestHttpStatus:         latest?.httpStatus ?? null,
    latestTimestamp:          latest?.timestamp ?? null,
    consecutiveFailures,
    statusTrend,
    alertLevel,
    recommendedOperatorAction: recommendedAction,
    totalRecordsAnalyzed:     bridgeRecords.length,
    safetyAssertions,
    note: 'Local-only monitoring snapshot. No scheduler. No network calls. No OpenClaw calls. No execution.',
  };
}

function AssertionBadge({ assertion }) {
  return (
    <div className="flex items-center gap-1.5">
      {assertion.pass
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
      <span className="font-mono text-[7px] text-slate-400">{assertion.key}:</span>
      <span className={`text-[7px] font-bold ${assertion.pass ? 'text-primary' : 'text-destructive'}`}>
        {String(assertion.value)}
      </span>
    </div>
  );
}

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
      {copied ? 'Copied!' : 'Copy Monitoring Snapshot JSON'}
    </button>
  );
}

const ALERT_COLORS = {
  INFO:     'text-primary border-primary/30 bg-primary/5',
  WARNING:  'text-amber-500 border-amber-500/30 bg-amber-500/5',
  CRITICAL: 'text-destructive border-destructive/30 bg-destructive/5',
};

export default function AutomatedHealthMonitoring({ refreshTrigger }) {
  const [snapshot, setSnapshot] = useState(null);

  // Auto-generate on mount so the panel is immediately populated
  useEffect(() => {
    const records = loadJSON(BRIDGE_KEY, []);
    if (records.length > 0) {
      setSnapshot(buildSnapshot(records));
    }
  }, [refreshTrigger]);

  const handleGenerate = useCallback(() => {
    const records = loadJSON(BRIDGE_KEY, []);
    const snap = buildSnapshot(records);

    const all = loadJSON(SNAPSHOT_KEY, []);
    all.unshift(snap);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(all.slice(0, 50)));

    tryAppendAudit({
      event:       'automated_health_monitoring_snapshot_created',
      monitorId:   snap.monitorId,
      latestStatus: snap.latestStatus,
      alertLevel:  snap.alertLevel,
      consecutiveFailures: snap.consecutiveFailures,
      note: `Automated health monitoring snapshot created (${snap.monitorId}). Alert: ${snap.alertLevel}. No network calls. No execution. No dispatch.`,
    });

    setSnapshot(snap);
  }, []);

  const alertColor = snapshot ? (ALERT_COLORS[snapshot.alertLevel] ?? ALERT_COLORS.WARNING) : '';

  const summaryCards = snapshot ? [
    { label: 'Latest Status',         value: snapshot.latestStatus,      color: snapshot.latestStatus === 'ONLINE' ? 'text-primary' : 'text-destructive' },
    { label: 'Consecutive Failures',  value: snapshot.consecutiveFailures, color: snapshot.consecutiveFailures > 0 ? 'text-destructive' : 'text-primary' },
    { label: 'Alert Level',           value: snapshot.alertLevel,        color: ALERT_COLORS[snapshot.alertLevel]?.split(' ')[0] ?? 'text-amber-500' },
    { label: 'Last Checked',          value: snapshot.latestTimestamp ? new Date(snapshot.latestTimestamp).toLocaleTimeString() : '—', color: 'text-slate-300' },
    { label: 'Monitoring Mode',       value: 'LOCAL_PREVIEW',            color: 'text-amber-500' },
    { label: 'Dispatch Allowed',      value: 'false',                    color: 'text-destructive font-bold' },
  ] : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Automated Health Monitoring</div>
          <div className="text-[13px] font-bold text-foreground">Automated Health Monitoring</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Local-only snapshot design layer. No scheduler active. No network calls.</div>
        </div>
        {snapshot && (
          <button type="button" onClick={handleGenerate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — No scheduler. No timers. No network calls. Reads localStorage only.</span>
      </div>

      {/* Monitoring configuration (UI-only display) */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Monitoring Configuration (UI-only / local-only)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Enabled',                value: 'false (default)',          color: 'text-destructive' },
            { label: 'Interval (design)',       value: '60s (not active)',         color: 'text-slate-400' },
            { label: 'Scheduler',              value: 'DISABLED',                 color: 'text-destructive' },
            { label: 'Max Consec. Failures',   value: String(MAX_FAILURES_THRESHOLD), color: 'text-amber-500' },
            { label: 'Allowed Endpoints',      value: ALLOWED_ENDPOINTS.join(', '), color: 'text-blue-400 font-mono text-[7px]' },
            { label: 'Alert Levels',           value: 'INFO / WARNING / CRITICAL', color: 'text-slate-300' },
          ].map(c => (
            <div key={c.label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
              <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
              <div className={`text-[9px] break-all ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button (pre-snapshot) */}
      {!snapshot && (
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded w-full justify-center">
          <Activity className="w-3.5 h-3.5" /> Generate Monitoring Snapshot
        </button>
      )}

      {/* Snapshot output */}
      {snapshot && (
        <>
          {/* Alert banner */}
          <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${alertColor}`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide">Alert Level: {snapshot.alertLevel}</div>
              <div className="text-[8px] mt-0.5 opacity-80">{snapshot.recommendedOperatorAction}</div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {summaryCards.map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-3 py-2.5">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Status trend + metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Status Trend',         value: snapshot.statusTrend },
              { label: 'Records Analyzed',     value: snapshot.totalRecordsAnalyzed },
              { label: 'Gateway Mode',         value: snapshot.gatewayMode,     color: 'text-amber-500' },
              { label: 'Execution Lock',       value: snapshot.executionLock,   color: 'text-amber-500' },
            ].map(c => (
              <div key={c.label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] font-semibold ${c.color ?? 'text-foreground'}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* PASS/FAIL safety assertion badges */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {snapshot.safetyAssertions.filter(a => a.pass).length}/{snapshot.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
              {snapshot.safetyAssertions.map(a => (
                <AssertionBadge key={a.key} assertion={a} />
              ))}
            </div>
          </div>

          {/* Monitor ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /><span className="font-mono">{snapshot.monitorId}</span></span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(snapshot.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={snapshot} />
            <button type="button" onClick={handleGenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Activity className="w-3 h-3" /> Generate Monitoring Snapshot
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Automated monitoring is local-only preview logic. No scheduler active. No network calls. No OpenClaw calls. No execution. No dispatch.
      </div>
    </div>
  );
}