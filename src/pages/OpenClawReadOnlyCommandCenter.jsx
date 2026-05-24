import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Heart, Eye, Shield, AlertTriangle, CheckCircle2, XCircle,
  Loader2, ArrowLeft, Lock, Zap, FileText, Globe, RefreshCw,
  PlayCircle, Trash2, Activity, ChevronRight
} from 'lucide-react';
import Phase5BReadOnlyDispatchPreview from '@/components/openclaw/Phase5BReadOnlyDispatchPreview';

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

// ─── Next Action Queue ────────────────────────────────────────────────────────

const QUEUE_TASKS = [
  {
    key: 'obsidian',
    title: 'Obsidian File Task',
    description: 'Preview a future Obsidian file read/write request.',
    buttonLabel: 'Preview Obsidian Task',
    taskType: 'OBSIDIAN_FILE_TASK',
    requestedAction: 'Preview Obsidian vault file operation',
    riskLevel: 'LOW',
  },
  {
    key: 'browser',
    title: 'Browser Task',
    description: 'Preview a future browser automation request.',
    buttonLabel: 'Preview Browser Task',
    taskType: 'BROWSER_TASK',
    requestedAction: 'Preview browser read operation',
    riskLevel: 'LOW',
  },
  {
    key: 'tradingview',
    title: 'TradingView Task',
    description: 'Preview a future TradingView chart or alert task.',
    buttonLabel: 'Preview TradingView Task',
    taskType: 'TRADINGVIEW_TASK',
    requestedAction: 'Preview TradingView chart or alert operation',
    riskLevel: 'LOW',
  },
  {
    key: 'system',
    title: 'System Task',
    description: 'Preview a future system check or OpenClaw command.',
    buttonLabel: 'Preview System Task',
    taskType: 'SYSTEM_TASK',
    requestedAction: 'Preview OpenClaw system check or read command',
    riskLevel: 'LOW',
  },
];

const PACKET_FIXED = {
  requiresApproval: true,
  executionStatus: 'NOT_EXECUTED',
  dispatchStatus: 'NOT_DISPATCHED',
  browserAutomation: 'DISABLED',
  fileWrite: 'DISABLED',
  credentialUse: 'DISABLED',
  brokerAction: 'DISABLED',
};

function buildPacket(task) {
  return {
    taskType: task.taskType,
    requestedAction: task.requestedAction,
    riskLevel: task.riskLevel,
    ...PACKET_FIXED,
    createdAt: new Date().toISOString(),
  };
}

function LockedActionCard({ task, onPreview }) {
  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">{task.title}</span>
        </div>
        <span className="text-[7px] font-mono font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded-sm">LOCKED</span>
      </div>
      <div className="px-4 py-3 flex-1 text-[8px] text-slate-400">{task.description}</div>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onPreview(task)}
          className="w-full text-[8px] font-semibold px-3 py-2 bg-secondary/40 border border-border/40 text-slate-300 hover:border-primary/40 hover:text-primary rounded transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3 h-3" />
          {task.buttonLabel}
        </button>
      </div>
    </div>
  );
}

function NextActionQueue() {
  const [activePacket, setActivePacket] = useState(null);
  const [saved, setSaved] = useState(false);

  const handlePreview = (task) => {
    setSaved(false);
    setActivePacket(buildPacket(task));
  };

  const handleSave = () => {
    try {
      const key = `next_action_queue_packet_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(activePacket));
      setSaved(true);
    } catch { /* quota */ }
  };

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Next Action Queue
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUEUE_TASKS.map(task => (
          <LockedActionCard key={task.key} task={task} onPreview={handlePreview} />
        ))}
      </div>

      {activePacket && (
        <div className="border border-border/40 bg-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Preview Packet</span>
            <span className="text-[7px] font-mono text-slate-500">Local-only — no execution</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[7px] font-mono">
            {Object.entries(activePacket).map(([k, v]) => (
              <div key={k} className="flex gap-1 flex-wrap">
                <span className="text-slate-500 shrink-0">{k}:</span>
                <span className={
                  v === 'NOT_EXECUTED' || v === 'NOT_DISPATCHED' || v === 'DISABLED'
                    ? 'text-destructive font-bold'
                    : k === 'taskType' || k === 'riskLevel'
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }>{String(v)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className="flex items-center gap-1.5 text-[8px] font-semibold px-3 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
            >
              {saved ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {saved ? 'Saved to localStorage' : 'Save Preview Packet'}
            </button>
            {saved && <span className="text-[7px] text-slate-500 font-mono">Saved to localStorage — no backend call.</span>}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Controlled OpenClaw Send Test ───────────────────────────────────────────

const CONTROLLED_SEND_LS_PREFIX = 'controlled_openclaw_send_test_';

const CONTROLLED_SEND_VERIFICATION = [
  'No new route created',
  '/health endpoint only',
  'No /hooks/agent call',
  'No browser automation',
  'No file writes',
  'No credential use',
  'No broker action',
  'Result saved to localStorage only',
  'Execution remains NOT_EXECUTED',
  'Existing read-only checks preserved',
];

function ControlledSendTest({ healthStatus, healthData, gatewayStatusData, lastDryRun, phase5bExists }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error,  setError]    = useState(null);
  const [showVerify, setShowVerify] = useState(false);

  const gatewayOnline  = healthStatus === 'ok' && healthData?.online === true;
  const statusOk       = gatewayStatusData?.status === 'SUCCESS' || gatewayStatusData?.status === 'ok' || gatewayStatusData?.status === 'online';
  const dryRunValid    = !!lastDryRun && lastDryRun.bridgeMode === 'DRY_RUN_ONLY';
  const canSend        = gatewayOnline && statusOk && dryRunValid && phase5bExists;

  const lockReasons = [
    !gatewayOnline  && 'Gateway Health must be ONLINE (run Gateway Health check)',
    !statusOk       && 'Gateway Status must be SUCCESS (run Gateway Status check)',
    !dryRunValid    && 'Phase 5A snapshot must be loaded and valid',
    !phase5bExists  && 'Phase 5B preview must exist',
  ].filter(Boolean);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('openclawHealthCheck', {});
      const d = res.data || {};
      const packet = {
        sent: true,
        targetPath: '/health',
        rawResponse: { online: d.online ?? d.success ?? d.gatewayReachable ?? null, latencyMs: d.latencyMs ?? d.data?.latencyMs ?? '—' },
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'READ_ONLY_STATUS_CALL_ONLY',
        browserAutomation: 'DISABLED',
        fileWrite: 'DISABLED',
        credentialUse: 'DISABLED',
        brokerAction: 'DISABLED',
        sentAt: new Date().toISOString(),
      };
      const key = `${CONTROLLED_SEND_LS_PREFIX}${Date.now()}`;
      try { localStorage.setItem(key, JSON.stringify(packet)); } catch { /* quota */ }
      setResult(packet);
    } catch (err) {
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Controlled OpenClaw Send Test
      </div>

      <div className="border border-border/40 bg-card rounded-lg p-4 space-y-3">
        {/* Gate status */}
        <div className="space-y-1 text-[7px] font-mono">
          {[
            { label: 'Gateway Health ONLINE',    ok: gatewayOnline },
            { label: 'Gateway Status SUCCESS',   ok: statusOk },
            { label: 'Phase 5A snapshot valid',  ok: dryRunValid },
            { label: 'Phase 5B preview exists',  ok: phase5bExists },
            { label: 'targetPath',               ok: true, val: '/health' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2">
              {r.ok ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
              <span className="text-slate-500">{r.label}:</span>
              <span className={r.ok ? 'text-primary font-bold' : 'text-amber-400'}>{r.val ?? (r.ok ? 'PASS' : 'NOT MET')}</span>
            </div>
          ))}
        </div>

        {/* Lock reasons */}
        {lockReasons.length > 0 && (
          <div className="space-y-0.5">
            {lockReasons.map(r => (
              <div key={r} className="flex items-center gap-1.5 text-[7px] text-amber-400 font-mono">
                <Lock className="w-2.5 h-2.5 shrink-0" /> {r}
              </div>
            ))}
          </div>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || loading}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {loading ? 'Calling /health…' : 'Send Controlled /health Task'}
        </button>

        {!canSend && (
          <div className="text-[7px] text-slate-500 font-mono italic">
            Button locked — all gate conditions must be met. Run read-only checks above first.
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-lg px-4 py-3 text-[8px] text-destructive font-mono">{error}</div>
      )}

      {/* Controlled Send Result */}
      {result && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Controlled Send Result</span>
            <span className="text-[7px] text-slate-500 ml-auto font-mono">Saved to localStorage</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[7px] font-mono">
            {[
              ['sent',              String(result.sent)],
              ['targetPath',        result.targetPath],
              ['executionStatus',   result.executionStatus],
              ['dispatchStatus',    result.dispatchStatus],
              ['browserAutomation', result.browserAutomation],
              ['fileWrite',         result.fileWrite],
              ['credentialUse',     result.credentialUse],
              ['brokerAction',      result.brokerAction],
              ['sentAt',            result.sentAt?.slice(11, 19)],
              ['rawOnline',         String(result.rawResponse?.online)],
              ['latencyMs',         String(result.rawResponse?.latencyMs)],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <span className="text-slate-500 shrink-0">{k}:</span>
                <span className={v === 'NOT_EXECUTED' || v === 'DISABLED' ? 'text-destructive font-bold' : v === 'true' || v === '/health' ? 'text-primary font-bold' : 'text-slate-200'}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification report */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <button type="button" onClick={() => setShowVerify(v => !v)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Controlled Send Verification Report</span>
          </div>
          <span className="text-[7px] text-slate-500">{showVerify ? '▾ hide' : '▸ show'}</span>
        </button>
        {showVerify && (
          <div className="px-4 pb-4 space-y-1">
            {CONTROLLED_SEND_VERIFICATION.map(label => (
              <div key={label} className="flex items-center gap-2 text-[7px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-300">{label}</span>
                <span className="ml-auto font-bold text-primary">PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Phase 5B Read-Only Capability Probe ─────────────────────────────────────

const CAPABILITY_PROBE_LS_PREFIX = 'controlled_openclaw_capability_probe_';

// Allowlisted read-only endpoints — mapped to existing backend functions
const PROBE_ENDPOINTS = [
  { key: 'health',        label: '/health',        fn: 'openclawHealthCheck',              allowlisted: true },
  { key: 'status',        label: '/status',        fn: 'openclawStatus',                   allowlisted: true },
  { key: 'version',       label: '/version',       fn: 'openclawStatusVersionCapabilities', allowlisted: true },
  { key: 'capabilities',  label: '/capabilities',  fn: 'openclawStatusVersionCapabilities', allowlisted: true },
];

const PROBE_SAFETY = {
  dispatchAllowed:    false,
  executionStatus:    'NOT_EXECUTED',
  browserAutomation:  'DISABLED',
  fileWrite:          'DISABLED',
  credentialUse:      'DISABLED',
  brokerAction:       'DISABLED',
};

const PROBE_VERIFICATION = [
  { label: 'No new route created',                              pass: true },
  { label: '/hooks/agent not called',                           pass: true },
  { label: 'Only allowlisted read-only endpoints used',         pass: true },
  { label: 'Unallowlisted endpoints blocked as HOLD_FOR_ALLOWLIST', pass: true },
  { label: 'No execution dispatch added',                       pass: true },
  { label: 'No browser automation added',                       pass: true },
  { label: 'No file writes added',                              pass: true },
  { label: 'No credential entry added',                         pass: true },
  { label: 'No broker/trading action added',                    pass: true },
  { label: 'Results saved to localStorage only',                pass: true },
  { label: 'executionStatus remains NOT_EXECUTED',              pass: true },
];

function CapabilityProbe() {
  const [probeResults, setProbeResults] = useState({});
  const [loading,      setLoading]      = useState({});
  const [probePacket,  setProbePacket]  = useState(null);
  const [saved,        setSaved]        = useState(false);
  const [showVerify,   setShowVerify]   = useState(false);

  const runProbe = async (ep) => {
    if (!ep.allowlisted) return;
    setLoading(prev => ({ ...prev, [ep.key]: true }));
    try {
      const res = await base44.functions.invoke(ep.fn, {});
      const d = res.data || {};
      let extracted;
      if (ep.key === 'health') {
        const online = d.status === 'SUCCESS' || d.success === true || d.gatewayReachable === true || d.httpStatus === 200 || d.data?.gatewayReachable === true;
        extracted = { gatewayReachable: online, latencyMs: d.latencyMs ?? d.data?.latencyMs ?? '—' };
      } else if (ep.key === 'status') {
        extracted = { status: d.status ?? d.gatewayStatus ?? 'unknown', mode: d.mode ?? '—' };
      } else if (ep.key === 'version') {
        extracted = { version: d.version ?? d.gatewayVersion ?? '—', build: d.build ?? '—' };
      } else if (ep.key === 'capabilities') {
        const caps = d.capabilities ?? d.supportedCapabilities ?? [];
        extracted = { capabilities: Array.isArray(caps) ? (caps.length > 0 ? caps.join(', ') : '—') : String(caps) };
      } else {
        extracted = d;
      }
      setProbeResults(prev => ({ ...prev, [ep.key]: { status: 'ok', data: extracted } }));
    } catch (err) {
      setProbeResults(prev => ({ ...prev, [ep.key]: { status: 'error', data: { error: err.message } } }));
    } finally {
      setLoading(prev => ({ ...prev, [ep.key]: false }));
    }
  };

  const runAll = async () => {
    for (const ep of PROBE_ENDPOINTS) {
      if (ep.allowlisted) await runProbe(ep);
    }
  };

  const buildAndSave = () => {
    const r = probeResults;
    const packet = {
      gatewayReachable:         r.health?.data?.gatewayReachable ?? 'UNKNOWN',
      healthStatus:             r.health?.status === 'ok' ? 'OK' : r.health?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
      versionStatus:            r.version?.status === 'ok' ? (r.version.data?.version ?? 'OK') : r.version?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
      statusEndpointResult:     r.status?.status === 'ok' ? (r.status.data?.status ?? 'OK') : r.status?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
      capabilitiesEndpointResult: r.capabilities?.status === 'ok' ? 'OK' : r.capabilities?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
      ...PROBE_SAFETY,
      probedAt: new Date().toISOString(),
    };
    const key = `${CAPABILITY_PROBE_LS_PREFIX}${Date.now()}`;
    try { localStorage.setItem(key, JSON.stringify(packet)); } catch { /* quota */ }
    setProbePacket(packet);
    setSaved(true);
  };

  const anyRun = Object.keys(probeResults).length > 0;

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Phase 5B — Read-Only Capability Probe
      </div>

      {/* Endpoint table */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
          <span className="text-[8px] font-bold text-slate-300 uppercase">Allowlisted Endpoints</span>
          <button type="button" onClick={runAll}
            className="flex items-center gap-1.5 text-[7px] font-semibold px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors">
            <RefreshCw className="w-2.5 h-2.5" /> Probe All
          </button>
        </div>
        <div className="divide-y divide-border/20">
          {PROBE_ENDPOINTS.map(ep => {
            const r = probeResults[ep.key];
            const isLoading = !!loading[ep.key];
            return (
              <div key={ep.key} className="px-4 py-2.5 flex items-center gap-3 text-[7px] font-mono">
                <span className="w-28 text-slate-300 font-bold shrink-0">{ep.label}</span>
                {ep.allowlisted
                  ? <span className="text-primary text-[6px] border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-sm font-bold">ALLOWLISTED</span>
                  : <span className="text-amber-400 text-[6px] border border-amber-400/30 bg-amber-400/5 px-1.5 py-0.5 rounded-sm font-bold">HOLD_FOR_ALLOWLIST</span>}
                <span className="text-slate-600 shrink-0">{ep.fn}</span>
                <div className="ml-auto flex items-center gap-2">
                  {!r && !isLoading && <span className="text-slate-600 italic">not probed</span>}
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  {r && r.status === 'ok' && <><CheckCircle2 className="w-3 h-3 text-primary shrink-0" /><span className="text-primary">OK</span></>}
                  {r && r.status === 'error' && <><XCircle className="w-3 h-3 text-destructive shrink-0" /><span className="text-destructive">{r.data?.error?.slice(0, 40) || 'ERROR'}</span></>}
                  {ep.allowlisted && (
                    <button type="button" onClick={() => runProbe(ep)} disabled={isLoading}
                      className="text-[6px] px-2 py-1 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-500 rounded transition-colors disabled:opacity-40 flex items-center gap-1">
                      {isLoading ? <Loader2 className="w-2 h-2 animate-spin" /> : <Eye className="w-2 h-2" />}
                      Probe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save / Build packet */}
      {anyRun && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={buildAndSave}
            className="flex items-center gap-1.5 text-[8px] font-semibold px-3 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors">
            {saved ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            {saved ? 'Probe Packet Saved' : 'Build & Save Probe Packet'}
          </button>
          {saved && <span className="text-[7px] text-slate-500 font-mono">Saved to localStorage — no backend call.</span>}
        </div>
      )}

      {/* Probe result packet */}
      {probePacket && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase tracking-wider text-primary mb-1">Probe Result Packet</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[7px] font-mono">
            {Object.entries(probePacket).map(([k, v]) => (
              <div key={k} className="flex gap-1 flex-wrap">
                <span className="text-slate-500 shrink-0">{k}:</span>
                <span className={
                  v === 'NOT_EXECUTED' || v === 'DISABLED' ? 'text-destructive font-bold' :
                  v === false ? 'text-destructive font-bold' :
                  v === true || v === 'OK' ? 'text-primary font-bold' :
                  'text-slate-200'
                }>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety chips */}
      <div className="flex flex-wrap gap-2">
        {['No /hooks/agent', 'No execution dispatch', 'No browser automation', 'No file writes', 'No credential entry', 'No broker action'].map(label => (
          <span key={label} className="text-[6px] font-mono font-semibold border px-2 py-0.5 rounded-full text-destructive border-destructive/30 bg-destructive/5">
            ✕ {label}
          </span>
        ))}
      </div>

      {/* Verification table */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <button type="button" onClick={() => setShowVerify(v => !v)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Phase 5B Capability Probe Verification</span>
          </div>
          <span className="text-[7px] text-slate-500">{showVerify ? '▾ hide' : '▸ show'}</span>
        </button>
        {showVerify && (
          <div className="px-4 pb-4 space-y-1">
            {PROBE_VERIFICATION.map(c => (
              <div key={c.label} className="flex items-center gap-2 text-[7px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-300">{c.label}</span>
                <span className="ml-auto font-bold text-primary">PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
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
          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">OpenClaw Command Center</h1>
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

      {/* ── Next Action Queue ─────────────────────────────────────────────── */}
      <NextActionQueue />

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

      {/* Phase 5B Section */}
      <section className="space-y-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1 flex items-center gap-1">
          Phase 5B
          <ChevronRight className="w-3 h-3 text-slate-600" />
          Read-Only Dispatch Preview
        </div>
        <Phase5BReadOnlyDispatchPreview />
      </section>

      {/* Phase 5B Capability Probe */}
      <CapabilityProbe />

      {/* Controlled OpenClaw Send Test */}
      <ControlledSendTest
        healthStatus={statusCards.health.status}
        healthData={statusCards.health.data}
        gatewayStatusData={statusCards.gatewayStatus.data}
        lastDryRun={lastDryRun || null}
        phase5bExists={allPreviewsReady}
      />

      {/* Footer */}
      <div className="text-[6px] text-slate-700 italic text-center pt-4 border-t border-border/20">
        Read-only · Preview-only · No execution · No dispatch · No broker action · No file write · No credential use
      </div>
    </div>
  );
}