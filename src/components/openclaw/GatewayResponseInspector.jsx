/**
 * GatewayResponseInspector
 * Displays the latest health check response in an inspector-style panel.
 *
 * SAFETY CONTRACT:
 *   - READ_ONLY / PREVIEW_ONLY / LOCKED
 *   - No command execution
 *   - No browser automation
 *   - No credentials
 *   - No OpenClaw execution endpoints
 *   - Reads from localStorage only — no network calls
 */
import React, { useState, useEffect } from 'react';
import { Search, Copy, CheckCircle2, ShieldCheck, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

const HEALTH_KEY    = 'openclawReadOnlyGatewayHealthChecks';
const INSPECT_KEY   = 'openclawGatewayResponseInspector';

const STATUS_COLOR = {
  OPENCLAW_ONLINE:                'text-primary',
  CLOUDFLARE_PROTECTED_REACHABLE: 'text-amber-500',
  GATEWAY_UNREACHABLE:            'text-destructive',
  GATEWAY_ERROR:                  'text-destructive',
  CONFIG_MISSING:                 'text-slate-400',
};

function loadLatest() {
  try {
    const checks = JSON.parse(localStorage.getItem(HEALTH_KEY) || '[]');
    return checks[0] || null;
  } catch { return null; }
}

function loadPersisted() {
  try { return JSON.parse(localStorage.getItem(INSPECT_KEY) || 'null'); } catch { return null; }
}

function persist(record) {
  localStorage.setItem(INSPECT_KEY, JSON.stringify(record));
}

function CopyButton({ text, label = 'Copy Response JSON' }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function Field({ label, value, valueClass = 'text-foreground font-semibold' }) {
  return (
    <div className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
      <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className={`text-[9px] break-all ${valueClass}`}>{String(value ?? 'N/A')}</div>
    </div>
  );
}

export default function GatewayResponseInspector({ refreshTrigger }) {
  const [record,      setRecord]      = useState(null);
  const [rawExpanded, setRawExpanded] = useState(false);

  const load = () => {
    const latest = loadLatest();
    if (latest) {
      persist(latest);
      setRecord(latest);
    } else {
      const saved = loadPersisted();
      if (saved) setRecord(saved);
    }
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  if (!record) {
    return (
      <div className="px-3 py-4 bg-secondary/10 border border-border/30 rounded-lg text-center">
        <Search className="w-4 h-4 text-slate-600 mx-auto mb-1" />
        <div className="text-[9px] text-slate-500">No health check response yet — run a health check above.</div>
      </div>
    );
  }

  const statusColor = STATUS_COLOR[record.interpretedGatewayStatus] || 'text-slate-400';
  const redirectDetected = record.httpStatus === 302 || record.httpStatus === 301 || record.httpStatus === 307 || record.httpStatus === 308;

  // Build the inspector snapshot — what gets persisted / copied
  const inspectorSnapshot = {
    inspectedAt:              new Date().toISOString(),
    sourceCheckId:            record.checkId || null,
    endpointChecked:          record.endpointChecked,
    httpStatus:               record.httpStatus ?? null,
    gatewayStatus:            record.interpretedGatewayStatus,
    cfAccessDetected:         record.cfAccessDetected,
    redirectDetected,
    methodUsed:               'GET',
    timestamp:                record.timestamp,
    mode:                     record.gatewayMode || 'READ_ONLY',
    executionAttempted:       false,
    openClawCallAttempted:    false,
    secretExposed:            false,
    auditEventId:             record.checkId || null,
    gatewayMode:              'READ_ONLY',
    executionLock:            'LOCKED',
    note:                     'Read-only gateway response inspection only. No execution. No credentials. No browser tools.',
  };

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Response Inspector</div>
          <div className="text-[13px] font-bold text-foreground">Gateway Response Inspector</div>
        </div>
        <button type="button" onClick={load}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">READ_ONLY / PREVIEW_ONLY / LOCKED</span> — Inspection only. Reads from localStorage. No network calls. No execution.</span>
      </div>

      {/* Inspector fields grid */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-3">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Response Fields</div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Endpoint Checked"         value={record.endpointChecked}              valueClass="text-blue-400 font-mono text-[8px] break-all" />
          <Field label="HTTP Status"               value={record.httpStatus ?? 'N/A'}          valueClass={record.httpStatus === 200 ? 'text-primary font-bold' : 'text-amber-500 font-bold'} />
          <Field label="Gateway Status"            value={record.interpretedGatewayStatus}     valueClass={`font-bold ${statusColor}`} />
          <Field label="CF Access Detected"        value={record.cfAccessDetected ? 'YES' : 'NO'} valueClass={record.cfAccessDetected ? 'text-amber-500 font-bold' : 'text-slate-400'} />
          <Field label="Redirect Detected"         value={redirectDetected ? 'YES' : 'NO'}    valueClass={redirectDetected ? 'text-amber-500 font-bold' : 'text-slate-400'} />
          <Field label="Method Used"               value="GET"                                 valueClass="text-primary font-bold" />
          <Field label="Timestamp"                 value={new Date(record.timestamp).toLocaleString()} valueClass="text-slate-300 font-mono text-[8px]" />
          <Field label="Mode"                      value={record.gatewayMode || 'READ_ONLY'}  valueClass="text-amber-500 font-bold" />
          <Field label="Execution Attempted"       value="false"                               valueClass="text-destructive font-bold" />
          <Field label="OpenClaw Call Attempted"   value="false"                               valueClass="text-destructive font-bold" />
          <Field label="Secret Exposed"            value="false"                               valueClass="text-destructive font-bold" />
          <Field label="Audit Event ID"            value={record.checkId || 'N/A'}             valueClass="text-slate-300 font-mono text-[8px]" />
        </div>

        {/* Diagnostic detail */}
        {record.diagnosticDetail && (
          <div className="px-3 py-2 bg-secondary/30 border border-border/40 rounded text-[8px] text-slate-400">
            <span className="text-[7px] uppercase tracking-widest text-slate-600 font-semibold block mb-0.5">Diagnostic Detail</span>
            {record.diagnosticDetail}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <CopyButton text={JSON.stringify(inspectorSnapshot, null, 2)} />
        </div>

        {/* Collapsible Raw Response JSON */}
        <div className="border border-border/40 rounded overflow-hidden">
          <button type="button"
            onClick={() => setRawExpanded(e => !e)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/20 hover:bg-secondary/30 transition-colors text-left">
            {rawExpanded
              ? <ChevronDown  className="w-3 h-3 text-slate-400 shrink-0" />
              : <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Raw Response JSON</span>
            <span className="ml-auto text-[7px] text-slate-600">read-only</span>
          </button>
          {rawExpanded && (
            <div className="bg-black/20 border-t border-border/30 p-2">
              <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Read-only gateway response inspection only. No execution. No credentials. No browser tools.
      </div>
    </div>
  );
}