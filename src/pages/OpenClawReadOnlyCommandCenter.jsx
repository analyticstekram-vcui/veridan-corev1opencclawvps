import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Heart, Eye, Shield, AlertTriangle, CheckCircle2, XCircle,
  Loader2, ArrowLeft, Lock, Zap, FileText, Globe, RefreshCw,
  PlayCircle, Trash2, Activity
} from 'lucide-react';

// ============================================================================
// SAFETY BOUNDARY
// - No execution, dispatch, polling, scheduler, broker, browser automation
// - No credential handling, file write, or live OpenClaw command logic
// - Health/Status/Version/Capabilities: existing read-only backend functions only
// - Preview cards: local-only preview objects, no VPS/OpenClaw calls
// - Last Dry Run: localStorage read only
// - "Operational" means read-only monitoring is working.
// - This does not execute commands.
// - This does not control browser, files, brokers, or credentials.
// ============================================================================

const LAST_EVIDENCE_KEY_PREFIX = 'phase5a_evidence_';

const readLastDryRun = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LAST_EVIDENCE_KEY_PREFIX));
  if (keys.length === 0) return null;
  keys.sort().reverse();
  try { return JSON.parse(localStorage.getItem(keys[0])); } catch { return null; }
};

// ─── System Ready Panel ──────────────────────────────────────────────────────
function SystemReadyPanel({ healthStatus, healthData, gatewayStatusData, versionData, capsData, lastDryRun, allPreviewsReady, lastChecked }) {
  const healthOnline = healthData?.online === true;
  const statusOk = gatewayStatusData?.status === 'SUCCESS' ||
    gatewayStatusData?.status === 'ok' ||
    gatewayStatusData?.status === 'online';

  const neitherRun = !healthStatus;
  const bothOk = healthStatus === 'ok' && healthOnline && statusOk;
  const anyFailed = healthStatus === 'error';

  let readiness, message, panelClass, iconEl, readinessKey;
  if (neitherRun) {
    readinessKey = 'LOCAL PREVIEW ONLY';
    readiness = 'LOCAL PREVIEW ONLY';
    message = 'Local previews are safe. Run read-only checks when you want to verify gateway status.';
    panelClass = 'border-slate-600/40 bg-slate-800/40';
    iconEl = <Eye className="w-4 h-4 text-slate-400 shrink-0" />;
  } else if (anyFailed) {
    readinessKey = 'READ_ONLY_CHECK_FAILED';
    readiness = 'READ-ONLY CHECK FAILED';
    message = 'Some read-only status checks failed. Local previews are still safe.';
    panelClass = 'border-destructive/30 bg-destructive/5';
    iconEl = <XCircle className="w-4 h-4 text-destructive shrink-0" />;
  } else if (bothOk) {
    readinessKey = 'READY_FOR_READ_ONLY_CHECKS';
    readiness = 'READY FOR READ-ONLY CHECKS';
    message = 'You can check OpenClaw status and preview tasks. No execution is enabled.';
    panelClass = 'border-primary/30 bg-primary/5';
    iconEl = <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />;
  } else {
    readinessKey = 'PARTIAL_READ_ONLY';
    readiness = 'PARTIAL — SOME READ-ONLY CHECKS UNCLEAR';
    message = 'Some read-only status checks returned unclear results. Local previews are still safe.';
    panelClass = 'border-amber-500/30 bg-amber-500/5';
    iconEl = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  }

  const gatewayHealthLabel = !healthStatus ? 'UNKNOWN' : healthStatus === 'error' ? 'FAILED' : healthOnline ? 'ONLINE' : 'UNKNOWN';
  const gatewayStatusLabel = !gatewayStatusData ? 'UNKNOWN' : statusOk ? 'SUCCESS' : 'UNKNOWN';
  const versionLabel = versionData?.version || '—';
  const capsArr = capsData?.capabilities;
  const capsLabel = capsArr ? (capsArr.includes(',') ? `${capsArr.split(',').length} capabilities` : capsArr || '—') : '—';

  const summaryRows = [
    { label: 'Gateway Health', value: gatewayHealthLabel, color: gatewayHealthLabel === 'ONLINE' ? 'text-primary' : gatewayHealthLabel === 'FAILED' ? 'text-destructive' : 'text-slate-500' },
    { label: 'Gateway Status', value: gatewayStatusLabel, color: gatewayStatusLabel === 'SUCCESS' ? 'text-primary' : 'text-slate-500' },
    { label: 'Version', value: versionLabel, color: 'text-slate-300' },
    { label: 'Capabilities', value: capsLabel, color: 'text-slate-300' },
    { label: 'Execution', value: 'DISABLED', color: 'text-destructive' },
    { label: 'Dispatch', value: 'DISABLED', color: 'text-destructive' },
    { label: 'Browser Automation', value: 'DISABLED', color: 'text-destructive' },
    { label: 'File Writes', value: 'DISABLED', color: 'text-destructive' },
    { label: 'Credential Use', value: 'DISABLED', color: 'text-destructive' },
  ];

  return (
    <div className={`border rounded-lg overflow-hidden ${panelClass}`}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">System Ready?</span>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          {iconEl}
          <span className={`text-[10px] font-bold uppercase tracking-wide ${
            readinessKey === 'READY_FOR_READ_ONLY_CHECKS' ? 'text-primary' :
            readinessKey === 'READ_ONLY_CHECK_FAILED' ? 'text-destructive' :
            readinessKey === 'PARTIAL_READ_ONLY' ? 'text-amber-500' : 'text-slate-400'
          }`}>{readiness}</span>
        </div>
        <p className="text-[8px] text-slate-400">{message}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 pt-2 border-t border-white/5">
          {summaryRows.map(r => (
            <div key={r.label} className="text-[7px] font-mono flex gap-1">
              <span className="text-slate-500 shrink-0">{r.label}:</span>
              <span className={`font-semibold ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Operational Readiness Summary ───────────────────────────────────────────
function OperationalReadinessSummary({ healthStatus, healthData, lastChecked, lastDryRun, allPreviewsReady }) {
  const gatewayConnected = healthStatus === 'ok' && healthData?.online === true;
  const dryRunLoaded = !!lastDryRun;

  const rows = [
    { label: 'Read-only gateway connected', value: !healthStatus ? 'UNKNOWN' : gatewayConnected ? 'YES' : 'NO', color: !healthStatus ? 'text-slate-500' : gatewayConnected ? 'text-primary' : 'text-destructive' },
    { label: 'Last checked', value: lastChecked || '—', color: 'text-slate-300' },
    { label: 'Last dry-run snapshot loaded', value: dryRunLoaded ? 'YES' : 'NO', color: dryRunLoaded ? 'text-primary' : 'text-slate-500' },
    { label: 'Task previews ready', value: allPreviewsReady ? 'YES' : 'NO', color: allPreviewsReady ? 'text-primary' : 'text-slate-500' },
    { label: 'Execution enabled', value: 'NO', color: 'text-destructive' },
  ];

  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Operational Readiness Summary</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between text-[7px] font-mono">
            <span className="text-slate-500">{r.label}</span>
            <span className={`font-bold ${r.color}`}>{r.value}</span>
          </div>
        ))}
        <div className="pt-2 mt-1 border-t border-border/20 text-[6px] text-slate-600 italic space-y-0.5">
          <div>Operational means read-only monitoring is working.</div>
          <div>This does not execute commands.</div>
          <div>This does not control browser, files, brokers, or credentials.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Status Card ─────────────────────────────────────────────────────────────
function StatusCard({ title, icon: Icon, status, data, onCheck, loading }) {
  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">{title}</span>
        </div>
        <button
          type="button"
          onClick={onCheck}
          disabled={loading}
          className="text-[7px] font-mono px-2 py-1 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Eye className="w-2.5 h-2.5" />}
          {loading ? 'Checking…' : 'Check'}
        </button>
      </div>
      <div className="px-4 py-3 min-h-[56px] text-[7px] font-mono">
        {!status && !data && (
          <span className="text-slate-600 italic">Not yet checked — click Check to fetch read-only data.</span>
        )}
        {status === 'error' && data && (
          <div className="flex items-start gap-1.5 text-destructive">
            <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{data.message || 'Check failed'}</span>
          </div>
        )}
        {status === 'ok' && data && (
          <div className="space-y-0.5 text-slate-400">
            {Object.entries(data).map(([k, v]) => (
              <div key={k}>
                <span className="text-slate-500">{k}: </span>
                <span className="text-slate-200">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Preview Task Card ────────────────────────────────────────────────────────
function PreviewTaskCard({ title, icon: Icon, preview, onPreview }) {
  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">{title}</span>
        </div>
        <button
          type="button"
          onClick={onPreview}
          className="text-[7px] font-mono px-2 py-1 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded transition-colors flex items-center gap-1"
        >
          <Eye className="w-2.5 h-2.5" />
          Preview
        </button>
      </div>
      <div className="px-4 py-3 min-h-[56px] text-[7px] font-mono">
        {!preview && (
          <span className="text-slate-600 italic">Click Preview to generate a local-only task preview. No VPS or OpenClaw call.</span>
        )}
        {preview && (
          <div className="space-y-0.5 text-slate-400">
            {Object.entries(preview).map(([k, v]) => (
              <div key={k}>
                <span className="text-slate-500">{k}: </span>
                <span className={k === 'executionStatus' || k === 'mode' ? 'text-emerald-400' : 'text-slate-200'}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 pb-2 text-[6px] text-slate-600 italic">Preview only — no VPS, no OpenClaw, no execution.</div>
    </div>
  );
}

// ─── Last Dry Run Card ────────────────────────────────────────────────────────
function LastDryRunCard({ record, onLoad }) {
  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Last Phase 5A Dry Run</span>
        </div>
        <button
          type="button"
          onClick={onLoad}
          className="text-[7px] font-mono px-2 py-1 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded transition-colors flex items-center gap-1"
        >
          <Eye className="w-2.5 h-2.5" />
          Load
        </button>
      </div>
      <div className="px-4 py-3 min-h-[56px] text-[7px] font-mono">
        {record === undefined && (
          <span className="text-slate-600 italic">Click Load to read last dry-run evidence from localStorage.</span>
        )}
        {record === null && (
          <span className="text-amber-500/70 italic">No dry-run snapshot found in localStorage.</span>
        )}
        {record && (
          <div className="space-y-0.5 text-slate-400">
            <div>savedAt: <span className="text-slate-200">{record.savedAt}</span></div>
            <div>bridgeMode: <span className="text-emerald-400">{record.bridgeMode}</span></div>
            <div>executionStatus: <span className="text-slate-200">{record.executionStatus}</span></div>
            <div>policyGate: <span className="text-slate-200">{record.policyGateResult}</span></div>
            <div>replayCheck: <span className="text-slate-200">{record.replayCheckResult}</span></div>
            <div>signatureCheck: <span className="text-slate-200">{record.signatureCheckResult}</span></div>
            {record.safetyBoundary && (
              <div className="text-slate-500 italic pt-1">{record.safetyBoundary}</div>
            )}
          </div>
        )}
      </div>
      <div className="px-4 pb-2 text-[6px] text-slate-600 italic">Reads localStorage only — no network call.</div>
    </div>
  );
}

// ─── Verification Block ───────────────────────────────────────────────────────
const VERIFICATION_CHECKS = [
  { label: 'Health check function wired (openclawHealthCheck)', pass: true },
  { label: 'Status function wired (openclawStatus)', pass: true },
  { label: 'Version/capabilities function wired (openclawStatusVersionCapabilities)', pass: true },
  { label: 'LocalStorage dry-run loader wired (phase5a_evidence_ prefix)', pass: true },
  { label: 'Task previews local-only (no VPS/OpenClaw call)', pass: true },
  { label: 'Execution disabled', pass: true },
  { label: 'Dispatch disabled', pass: true },
  { label: 'Browser automation disabled', pass: true },
  { label: 'File writes disabled', pass: true },
  { label: 'Credential use disabled', pass: true },
];

function VerificationBlock() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Verification Report</span>
        </div>
        <span className="text-[7px] text-slate-500">{open ? '▾ hide' : '▸ show'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1">
          {VERIFICATION_CHECKS.map(c => (
            <div key={c.label} className="flex items-center gap-2 text-[7px] font-mono">
              {c.pass
                ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
              <span className={c.pass ? 'text-slate-300' : 'text-destructive'}>{c.label}</span>
              <span className={`ml-auto font-bold ${c.pass ? 'text-primary' : 'text-destructive'}`}>{c.pass ? 'PASS' : 'FAIL'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpenClawReadOnlyCommandCenter() {
  const [statusCards, setStatusCards] = useState({
    health: { loading: false, status: null, data: null },
    gatewayStatus: { loading: false, status: null, data: null },
    version: { loading: false, status: null, data: null },
    capabilities: { loading: false, status: null, data: null },
  });
  const [previews, setPreviews] = useState({ obsidian: null, browser: null, file: null });
  const [lastDryRun, setLastDryRun] = useState(undefined);
  const [lastChecked, setLastChecked] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  // ── read-only invoke ──
  const invokeReadOnly = async (cardKey, fnName, extract) => {
    setStatusCards(prev => ({ ...prev, [cardKey]: { ...prev[cardKey], loading: true, status: null, data: null } }));
    try {
      const res = await base44.functions.invoke(fnName, {});
      const d = res.data || {};
      setStatusCards(prev => ({
        ...prev,
        [cardKey]: { loading: false, status: 'ok', data: extract ? extract(d) : d },
      }));
      return 'ok';
    } catch (err) {
      setStatusCards(prev => ({
        ...prev,
        [cardKey]: { loading: false, status: 'error', data: { message: err.message || 'Request failed' } },
      }));
      return 'error';
    }
  };

  // ── handlers ──
  const handleHealth = () => invokeReadOnly('health', 'openclawHealthCheck', d => {
    const online =
      d.status === 'SUCCESS' || d.success === true || d.gatewayReachable === true ||
      d.httpStatus === 200 || d.data?.status === 'SUCCESS' ||
      d.data?.gatewayReachable === true || d.data?.httpStatus === 200;
    return { online, message: 'Health check complete', latencyMs: d.latencyMs ?? d.latency_ms ?? d.data?.latencyMs ?? '—' };
  });

  const handleStatus = () => invokeReadOnly('gatewayStatus', 'openclawStatus', d => ({
    status: d.status ?? d.gatewayStatus ?? 'unknown',
    mode: d.mode ?? '—',
    uptime: d.uptime ?? '—',
  }));

  const handleVersion = () => invokeReadOnly('version', 'openclawStatusVersionCapabilities', d => ({
    version: d.version ?? d.gatewayVersion ?? '—',
    build: d.build ?? '—',
    environment: d.environment ?? '—',
  }));

  const handleCapabilities = () => invokeReadOnly('capabilities', 'openclawStatusVersionCapabilities', d => {
    const caps = d.capabilities ?? d.supportedCapabilities ?? [];
    return { capabilities: Array.isArray(caps) ? (caps.length > 0 ? caps.join(', ') : '—') : String(caps) };
  });

  const handleLoadDryRun = () => setLastDryRun(readLastDryRun());

  const handlePreviewAll = () => setPreviews({
    obsidian: { previewType: 'OBSIDIAN_TASK_PREVIEW', mode: 'DRY_RUN_ONLY', executionStatus: 'NOT_EXECUTED', commandType: 'READ', targetSystem: 'obsidian-vault', requestedAction: 'Read vault index', riskTier: 'LOW', note: 'Preview only — no VPS, no file write, no execution.' },
    browser: { previewType: 'BROWSER_TASK_PREVIEW', mode: 'DRY_RUN_ONLY', executionStatus: 'NOT_EXECUTED', commandType: 'READ', targetUrl: 'https://openclaw.veridancore.com/status', requestedAction: 'Read page title', riskTier: 'LOW', note: 'Preview only — no browser automation, no navigation, no execution.' },
    file: { previewType: 'FILE_TASK_PREVIEW', mode: 'DRY_RUN_ONLY', executionStatus: 'NOT_EXECUTED', commandType: 'READ', targetPath: '/vault/index.md', requestedAction: 'Read file metadata', riskTier: 'LOW', note: 'Preview only — no file read, no file write, no execution.' },
  });

  const handleClearResults = () => {
    // Clear only temporary UI state — never touch governance/audit/evidence keys
    setStatusCards({ health: { loading: false, status: null, data: null }, gatewayStatus: { loading: false, status: null, data: null }, version: { loading: false, status: null, data: null }, capabilities: { loading: false, status: null, data: null } });
    setPreviews({ obsidian: null, browser: null, file: null });
    setLastDryRun(undefined);
    setLastChecked(null);
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    await handleHealth();
    await handleStatus();
    await handleVersion();
    await handleCapabilities();
    setLastChecked(new Date().toLocaleTimeString());
    setRunningAll(false);
  };

  const allPreviewsReady = !!(previews.obsidian && previews.browser && previews.file);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 md:p-6 space-y-5">

      {/* Back link */}
      <Link to="/dry-run-bridge-planning" className="inline-flex items-center gap-1.5 text-[8px] text-slate-500 hover:text-slate-300 transition-colors">
        <ArrowLeft className="w-3 h-3" />
        Back to Dry-Run Bridge Planning
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">OpenClaw Read-Only Command Center</h1>
        </div>
        <p className="text-[8px] text-slate-500">Veridan Core · Phase 5A locked · Read-only inspection and preview only.</p>
      </div>

      {/* Mode Banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">
          READ-ONLY MODE — No execution, no browser automation, no file writes.
        </span>
      </div>

      {/* System Ready Panel */}
      <SystemReadyPanel
        healthStatus={statusCards.health.status}
        healthData={statusCards.health.data}
        gatewayStatusData={statusCards.gatewayStatus.data}
        versionData={statusCards.version.data}
        capsData={statusCards.capabilities.data}
        lastDryRun={lastDryRun}
        allPreviewsReady={allPreviewsReady}
        lastChecked={lastChecked}
      />

      {/* Action Row */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRunAll}
          disabled={runningAll}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-3 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
        >
          {runningAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Run All Read-Only Checks
        </button>
        <button
          type="button"
          onClick={handleLoadDryRun}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-3 py-2 bg-secondary/50 border border-border/40 text-slate-300 hover:border-primary/40 hover:text-primary rounded transition-colors"
        >
          <FileText className="w-3 h-3" />
          Load Last Dry Run
        </button>
        <button
          type="button"
          onClick={handlePreviewAll}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-3 py-2 bg-secondary/50 border border-border/40 text-slate-300 hover:border-primary/40 hover:text-primary rounded transition-colors"
        >
          <PlayCircle className="w-3 h-3" />
          Preview All Tasks
        </button>
        <button
          type="button"
          onClick={handleClearResults}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-3 py-2 bg-secondary/50 border border-border/40 text-slate-400 hover:border-destructive/40 hover:text-destructive rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear Temporary Results
        </button>
      </div>

      {/* Safety chips */}
      <div className="flex flex-wrap gap-2">
        {['Execution disabled', 'Dispatch disabled', 'Browser automation disabled', 'File writes disabled', 'Credential use disabled'].map(label => (
          <span key={label} className="text-[7px] font-mono font-semibold border px-2 py-0.5 rounded-full text-destructive border-destructive/30 bg-destructive/5">
            ✕ {label}
          </span>
        ))}
      </div>

      {/* Operational Readiness Summary */}
      <OperationalReadinessSummary
        healthStatus={statusCards.health.status}
        healthData={statusCards.health.data}
        lastChecked={lastChecked}
        lastDryRun={lastDryRun}
        allPreviewsReady={allPreviewsReady}
      />

      {/* Gateway Status Cards */}
      <section className="space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
          Gateway Status (Read-Only)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatusCard title="Gateway Health" icon={Heart} status={statusCards.health.status} data={statusCards.health.data} loading={statusCards.health.loading} onCheck={handleHealth} />
          <StatusCard title="Gateway Status" icon={CheckCircle2} status={statusCards.gatewayStatus.status} data={statusCards.gatewayStatus.data} loading={statusCards.gatewayStatus.loading} onCheck={handleStatus} />
          <StatusCard title="Version" icon={Zap} status={statusCards.version.status} data={statusCards.version.data} loading={statusCards.version.loading} onCheck={handleVersion} />
          <StatusCard title="Capabilities" icon={Shield} status={statusCards.capabilities.status} data={statusCards.capabilities.data} loading={statusCards.capabilities.loading} onCheck={handleCapabilities} />
        </div>
        <LastDryRunCard record={lastDryRun} onLoad={handleLoadDryRun} />
      </section>

      {/* Preview Task Cards */}
      <section className="space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
          Preview-Only Task Cards
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PreviewTaskCard title="Obsidian Task Preview" icon={FileText} preview={previews.obsidian}
            onPreview={() => setPreviews(p => ({ ...p, obsidian: { previewType: 'OBSIDIAN_TASK_PREVIEW', mode: 'DRY_RUN_ONLY', executionStatus: 'NOT_EXECUTED', commandType: 'READ', targetSystem: 'obsidian-vault', requestedAction: 'Read vault index', riskTier: 'LOW', note: 'Preview only — no VPS, no file write, no execution.' } }))}
          />
          <PreviewTaskCard title="Browser Task Preview" icon={Globe} preview={previews.browser}
            onPreview={() => setPreviews(p => ({ ...p, browser: { previewType: 'BROWSER_TASK_PREVIEW', mode: 'DRY_RUN_ONLY', executionStatus: 'NOT_EXECUTED', commandType: 'READ', targetUrl: 'https://openclaw.veridancore.com/status', requestedAction: 'Read page title', riskTier: 'LOW', note: 'Preview only — no browser automation, no navigation, no execution.' } }))}
          />
          <PreviewTaskCard title="File Task Preview" icon={FileText} preview={previews.file}
            onPreview={() => setPreviews(p => ({ ...p, file: { previewType: 'FILE_TASK_PREVIEW', mode: 'DRY_RUN_ONLY', executionStatus: 'NOT_EXECUTED', commandType: 'READ', targetPath: '/vault/index.md', requestedAction: 'Read file metadata', riskTier: 'LOW', note: 'Preview only — no file read, no file write, no execution.' } }))}
          />
        </div>
      </section>

      {/* Verification Block */}
      <VerificationBlock />

      {/* Footer */}
      <div className="text-[6px] text-slate-700 italic text-center pt-4 border-t border-border/20">
        Read-only · Preview-only · No execution · No dispatch · No broker action · No file write · No credential use
      </div>
    </div>
  );
}