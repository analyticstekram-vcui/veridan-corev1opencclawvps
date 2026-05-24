import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Heart, Eye, Shield, AlertTriangle, CheckCircle2, XCircle,
  Loader2, ArrowLeft, Lock, Zap, FileText, Globe
} from 'lucide-react';

// ============================================================================
// SAFETY BOUNDARY
// - No execution, dispatch, polling, scheduler, broker, browser automation
// - No credential handling, file write, or live OpenClaw command logic
// - Health/Status/Version/Capabilities: existing read-only backend functions only
// - Preview cards: local-only preview objects, no VPS/OpenClaw calls
// - Last Dry Run: localStorage read only
// ============================================================================

const SAFETY_CHIPS = [
  { label: 'Execution disabled', color: 'text-destructive border-destructive/30 bg-destructive/5' },
  { label: 'Dispatch disabled', color: 'text-destructive border-destructive/30 bg-destructive/5' },
  { label: 'Browser automation disabled', color: 'text-destructive border-destructive/30 bg-destructive/5' },
  { label: 'File writes disabled', color: 'text-destructive border-destructive/30 bg-destructive/5' },
  { label: 'Credential use disabled', color: 'text-destructive border-destructive/30 bg-destructive/5' },
];

const LAST_EVIDENCE_KEY_PREFIX = 'phase5a_evidence_';

const readLastDryRun = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LAST_EVIDENCE_KEY_PREFIX));
  if (keys.length === 0) return null;
  keys.sort().reverse();
  try { return JSON.parse(localStorage.getItem(keys[0])); } catch { return null; }
};

// ─── System Ready Panel ──────────────────────────────────────────────────────
const QUICK_FACTS = [
  { label: 'Execution', value: 'Disabled' },
  { label: 'Dispatch', value: 'Disabled' },
  { label: 'File Writes', value: 'Disabled' },
  { label: 'Browser Automation', value: 'Disabled' },
  { label: 'Credential Use', value: 'Disabled' },
];

function SystemReadyPanel({ healthStatus, gatewayStatus }) {
  const neitherRun = !healthStatus && !gatewayStatus;
  const bothOk = healthStatus === 'ok' && gatewayStatus === 'ok';
  const anyFailed = healthStatus === 'error' || gatewayStatus === 'error';

  let readiness, message, panelClass, iconEl;

  if (neitherRun) {
    readiness = 'LOCAL PREVIEW ONLY';
    message = 'Local previews are safe. Run read-only checks when you want to verify gateway status.';
    panelClass = 'border-slate-600/40 bg-slate-800/40';
    iconEl = <Eye className="w-4 h-4 text-slate-400 shrink-0" />;
  } else if (bothOk) {
    readiness = 'READY FOR READ-ONLY CHECKS';
    message = 'You can check OpenClaw status and preview tasks. No execution is enabled.';
    panelClass = 'border-primary/30 bg-primary/5';
    iconEl = <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />;
  } else {
    readiness = 'PARTIAL — SOME READ-ONLY CHECKS FAILED';
    message = 'Some read-only status checks failed. Local previews are still safe.';
    panelClass = 'border-amber-500/30 bg-amber-500/5';
    iconEl = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${panelClass}`}>
      <div className="px-4 py-3 border-b border-current/10 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">System Ready?</span>
      </div>
      <div className="px-4 py-4 space-y-3">
        {/* Readiness badge */}
        <div className="flex items-center gap-2">
          {iconEl}
          <span className={`text-[10px] font-bold uppercase tracking-wide ${
            neitherRun ? 'text-slate-400' : bothOk ? 'text-primary' : 'text-amber-500'
          }`}>
            {readiness}
          </span>
        </div>
        {/* Plain-language message */}
        <p className="text-[8px] text-slate-400">{message}</p>
        {/* Quick facts */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-current/10">
          {QUICK_FACTS.map(f => (
            <div key={f.label} className="text-[7px] font-mono">
              <span className="text-slate-500">{f.label}: </span>
              <span className="text-destructive font-semibold">{f.value}</span>
            </div>
          ))}
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
          <span className="text-slate-600 italic">Click Preview to generate a local-only task preview object. No VPS or OpenClaw call.</span>
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
function LastDryRunCard() {
  const [record, setRecord] = useState(undefined);

  const load = () => {
    const r = readLastDryRun();
    setRecord(r);
  };

  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Last Phase 5A Dry Run</span>
        </div>
        <button
          type="button"
          onClick={load}
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
          <span className="text-amber-500/70 italic">No dry-run evidence found in localStorage.</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpenClawReadOnlyCommandCenter() {
  const [statusCards, setStatusCards] = useState({
    health: { loading: false, status: null, data: null },
    gatewayStatus: { loading: false, status: null, data: null },
    version: { loading: false, status: null, data: null },
    capabilities: { loading: false, status: null, data: null },
  });

  const [previews, setPreviews] = useState({
    obsidian: null,
    browser: null,
    file: null,
  });

  const invokeReadOnly = async (cardKey, fnName, extract) => {
    setStatusCards(prev => ({ ...prev, [cardKey]: { ...prev[cardKey], loading: true, status: null, data: null } }));
    try {
      const res = await base44.functions.invoke(fnName, {});
      const d = res.data || {};
      setStatusCards(prev => ({
        ...prev,
        [cardKey]: { loading: false, status: 'ok', data: extract ? extract(d) : d },
      }));
    } catch (err) {
      setStatusCards(prev => ({
        ...prev,
        [cardKey]: { loading: false, status: 'error', data: { message: err.message || 'Request failed' } },
      }));
    }
  };

  const handleHealth = () => invokeReadOnly('health', 'openclawHealthCheck', d => ({
    online: d.online ?? d.success ?? d.status ?? 'unknown',
    message: d.message || d.status || 'Health check complete',
    latencyMs: d.latencyMs ?? d.latency_ms ?? '—',
  }));

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
    return { capabilities: Array.isArray(caps) ? caps.join(', ') : JSON.stringify(caps) };
  });

  const handleObsidianPreview = () => setPreviews(prev => ({
    ...prev,
    obsidian: {
      previewType: 'OBSIDIAN_TASK_PREVIEW',
      mode: 'DRY_RUN_ONLY',
      executionStatus: 'NOT_EXECUTED',
      commandType: 'READ',
      targetSystem: 'obsidian-vault',
      requestedAction: 'Read vault index',
      riskTier: 'LOW',
      note: 'Preview only — no VPS bridge call, no file write, no execution.',
    },
  }));

  const handleBrowserPreview = () => setPreviews(prev => ({
    ...prev,
    browser: {
      previewType: 'BROWSER_TASK_PREVIEW',
      mode: 'DRY_RUN_ONLY',
      executionStatus: 'NOT_EXECUTED',
      commandType: 'READ',
      targetUrl: 'https://openclaw.veridancore.com/status',
      requestedAction: 'Read page title',
      riskTier: 'LOW',
      note: 'Preview only — no browser automation, no navigation, no execution.',
    },
  }));

  const handleFilePreview = () => setPreviews(prev => ({
    ...prev,
    file: {
      previewType: 'FILE_TASK_PREVIEW',
      mode: 'DRY_RUN_ONLY',
      executionStatus: 'NOT_EXECUTED',
      commandType: 'READ',
      targetPath: '/vault/index.md',
      requestedAction: 'Read file metadata',
      riskTier: 'LOW',
      note: 'Preview only — no file read, no file write, no execution.',
    },
  }));

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 md:p-6 space-y-6">

      {/* Back link */}
      <div>
        <Link
          to="/dry-run-bridge-planning"
          className="inline-flex items-center gap-1.5 text-[8px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Dry-Run Bridge Planning
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
            OpenClaw Read-Only Command Center
          </h1>
        </div>
        <p className="text-[8px] text-slate-500">
          Veridan Core · Phase 5A locked · Read-only inspection and preview only.
        </p>
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
        gatewayStatus={statusCards.gatewayStatus.status}
      />

      {/* Safety Chips */}
      <div className="flex flex-wrap gap-2">
        {SAFETY_CHIPS.map(chip => (
          <span
            key={chip.label}
            className={`text-[7px] font-mono font-semibold border px-2 py-0.5 rounded-full ${chip.color}`}
          >
            ✕ {chip.label}
          </span>
        ))}
      </div>

      {/* Status Cards */}
      <section className="space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
          Gateway Status (Read-Only)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatusCard
            title="Gateway Health"
            icon={Heart}
            status={statusCards.health.status}
            data={statusCards.health.data}
            loading={statusCards.health.loading}
            onCheck={handleHealth}
          />
          <StatusCard
            title="Gateway Status"
            icon={CheckCircle2}
            status={statusCards.gatewayStatus.status}
            data={statusCards.gatewayStatus.data}
            loading={statusCards.gatewayStatus.loading}
            onCheck={handleStatus}
          />
          <StatusCard
            title="Version"
            icon={Zap}
            status={statusCards.version.status}
            data={statusCards.version.data}
            loading={statusCards.version.loading}
            onCheck={handleVersion}
          />
          <StatusCard
            title="Capabilities"
            icon={Shield}
            status={statusCards.capabilities.status}
            data={statusCards.capabilities.data}
            loading={statusCards.capabilities.loading}
            onCheck={handleCapabilities}
          />
        </div>

        {/* Last Dry Run */}
        <LastDryRunCard />
      </section>

      {/* Preview Task Cards */}
      <section className="space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
          Preview-Only Task Cards
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PreviewTaskCard
            title="Obsidian Task Preview"
            icon={FileText}
            preview={previews.obsidian}
            onPreview={handleObsidianPreview}
          />
          <PreviewTaskCard
            title="Browser Task Preview"
            icon={Globe}
            preview={previews.browser}
            onPreview={handleBrowserPreview}
          />
          <PreviewTaskCard
            title="File Task Preview"
            icon={FileText}
            preview={previews.file}
            onPreview={handleFilePreview}
          />
        </div>
      </section>

      {/* Footer */}
      <div className="text-[6px] text-slate-700 italic text-center pt-4 border-t border-border/20">
        Read-only · Preview-only · No execution · No dispatch · No broker action · No file write · No credential use
      </div>
    </div>
  );
}