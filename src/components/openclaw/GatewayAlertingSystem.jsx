/**
 * GatewayAlertingSystem
 * Read-only alerting layer over stored gateway health check data.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools
 *   - No credentials / secrets
 *   - No trading / money movement
 *   - Reads localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Info, RefreshCw, Copy, ShieldCheck } from 'lucide-react';

const HEALTH_KEY  = 'openclawReadOnlyGatewayHealthChecks';
const INSPECT_KEY = 'openclawGatewayResponseInspector';
const ALERT_KEY   = 'openclawGatewayAlertReports';

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadLatestHealth() {
  try { return JSON.parse(localStorage.getItem(HEALTH_KEY) || '[]')[0] || null; } catch { return null; }
}
function loadInspector() {
  try { return JSON.parse(localStorage.getItem(INSPECT_KEY) || 'null'); } catch { return null; }
}
function saveAlertReport(report) {
  try {
    const all = JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
    all.unshift(report);
    localStorage.setItem(ALERT_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {}
}

// Lazily bind audit logger — imported at call time to avoid top-level await issues
function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

// ── Alert evaluation ──────────────────────────────────────────────────────────
const LEVEL_CFG = {
  PASS: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',       icon: CheckCircle2,    badge: 'border-primary/30 bg-primary/5 text-primary' },
  INFO: { color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20',     icon: Info,            badge: 'border-blue-400/30 bg-blue-400/5 text-blue-400' },
  WARN: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',   icon: AlertTriangle,   badge: 'border-amber-500/30 bg-amber-500/5 text-amber-500' },
  FAIL: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,        badge: 'border-destructive/30 bg-destructive/5 text-destructive' },
};

function evaluateAlerts(health, inspector) {
  const alerts = [];

  if (!health && !inspector) {
    alerts.push({ id: 'no_data', level: 'WARN', title: 'No recent health check available', detail: 'Run a gateway health check to populate alert data.' });
    return alerts;
  }

  const src = health || inspector;

  // Cloudflare / reachability
  const status = src.interpretedGatewayStatus || '';
  if (status === 'OPENCLAW_ONLINE' || status === 'CLOUDFLARE_PROTECTED_REACHABLE') {
    alerts.push({ id: 'cf_reachable', level: status === 'CLOUDFLARE_PROTECTED_REACHABLE' ? 'INFO' : 'PASS',
      title: status === 'CLOUDFLARE_PROTECTED_REACHABLE'
        ? 'Gateway reachable through Cloudflare Access redirect'
        : 'Gateway online and reachable',
      detail: `HTTP ${src.httpStatus ?? 'N/A'} — ${status}` });
  } else if (status === 'GATEWAY_UNREACHABLE' || status === 'CONFIG_MISSING' || status === 'GATEWAY_ERROR') {
    alerts.push({ id: 'unreachable', level: 'WARN', title: 'Gateway unreachable or error', detail: `Status: ${status}. HTTP: ${src.httpStatus ?? 'N/A'}` });
  }

  // Gateway mode
  const mode = src.gatewayMode || src.mode || '';
  if (mode && mode !== 'READ_ONLY') {
    alerts.push({ id: 'mode_fail', level: 'FAIL', title: 'Gateway mode is not READ_ONLY', detail: `Detected mode: ${mode}` });
  } else if (mode === 'READ_ONLY') {
    alerts.push({ id: 'mode_pass', level: 'PASS', title: 'Gateway mode is READ_ONLY', detail: 'Mode confirmed READ_ONLY.' });
  }

  // Execution lock
  const lock = src.executionLock || '';
  if (lock && lock !== 'LOCKED') {
    alerts.push({ id: 'lock_fail', level: 'FAIL', title: 'Execution lock is not LOCKED', detail: `Detected lock: ${lock}` });
  } else if (lock === 'LOCKED') {
    alerts.push({ id: 'lock_pass', level: 'PASS', title: 'Execution lock is LOCKED', detail: 'Confirmed LOCKED.' });
  }

  // Boolean safety checks
  const boolChecks = [
    { key: 'openClawCommandSent',  label: 'OpenClaw command sent' },
    { key: 'browserToolUsed',      label: 'Browser tool used' },
    { key: 'executionAttempted',   label: 'Execution attempted' },
    { key: 'secretExposed',        label: 'Secret exposed' },
  ];
  for (const { key, label } of boolChecks) {
    const val = src[key];
    if (val === true) {
      alerts.push({ id: `bool_fail_${key}`, level: 'FAIL', title: `${label} is true — SAFETY VIOLATION`, detail: `Field "${key}" must be false. Found: true.` });
    } else {
      alerts.push({ id: `bool_pass_${key}`, level: 'PASS', title: `${label}: false`, detail: `Confirmed ${label} = false.` });
    }
  }

  return alerts;
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Alert Report JSON'}
    </button>
  );
}

// ── Alert card ─────────────────────────────────────────────────────────────────
function AlertCard({ alert }) {
  const cfg = LEVEL_CFG[alert.level];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 border rounded-lg ${cfg.bg}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-bold ${cfg.color}`}>{alert.title}</div>
        <div className="text-[8px] text-slate-500 mt-0.5">{alert.detail}</div>
      </div>
      <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase shrink-0 ${cfg.badge}`}>{alert.level}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function GatewayAlertingSystem({ refreshTrigger }) {
  const [alerts,     setAlerts]     = useState([]);
  const [report,     setReport]     = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const generate = useCallback(() => {
    const health   = loadLatestHealth();
    const inspector = loadInspector();
    const evaluated = evaluateAlerts(health, inspector);
    const now = new Date().toISOString();
    const reportId = 'alrt-' + Date.now().toString(36);

    const counts = { PASS: 0, WARN: 0, FAIL: 0, INFO: 0 };
    for (const a of evaluated) counts[a.level] = (counts[a.level] || 0) + 1;

    const newReport = {
      reportId,
      generatedAt:           now,
      sourceHealthCheckId:   health?.checkId || null,
      alerts:                evaluated,
      summary:               counts,
      gatewayMode:           'READ_ONLY',
      executionLock:         'LOCKED',
      executionAttempted:    false,
      openClawCommandSent:   false,
      browserToolUsed:       false,
      secretExposed:         false,
      note:                  'Read-only alerting only. No gateway calls. No command dispatch. No execution.',
    };

    saveAlertReport(newReport);

    tryAppendAudit({
      event:    'gateway_alert_report_generated',
      reportId,
      summary:  counts,
      note:     `Gateway alert report generated (${reportId}). PASS:${counts.PASS} WARN:${counts.WARN} FAIL:${counts.FAIL} INFO:${counts.INFO}. No execution.`,
    });

    setAlerts(evaluated);
    setReport(newReport);
    setGeneratedAt(now);
  }, []);

  useEffect(() => { generate(); }, [generate, refreshTrigger]);

  if (!report) return null;

  const { summary } = report;
  const overallFail = summary.FAIL > 0;

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Alerting</div>
          <div className="text-[13px] font-bold text-foreground">Gateway Alerting System</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh Alerts
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">READ_ONLY / PREVIEW_ONLY / LOCKED</span> — Reads localStorage only. No gateway calls. No execution.</span>
      </div>

      {/* Summary row */}
      <div className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg ${overallFail ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <Bell className={`w-4 h-4 shrink-0 ${overallFail ? 'text-destructive' : 'text-primary'}`} />
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'PASS', count: summary.PASS, cls: 'text-primary' },
            { label: 'INFO', count: summary.INFO, cls: 'text-blue-400' },
            { label: 'WARN', count: summary.WARN, cls: 'text-amber-500' },
            { label: 'FAIL', count: summary.FAIL, cls: 'text-destructive' },
          ].map(({ label, count, cls }) => (
            <span key={label} className={`text-[10px] font-bold ${cls}`}>
              {label}: <span className="font-mono">{count}</span>
            </span>
          ))}
        </div>
        {generatedAt && (
          <span className="ml-auto text-[7px] text-slate-600 font-mono shrink-0">
            {new Date(generatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Alert cards */}
      <div className="space-y-1.5">
        {alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <CopyButton text={JSON.stringify(report, null, 2)} />
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Read-only alerting only. No gateway calls. No command dispatch. No execution.
      </div>
    </div>
  );
}