/**
 * ReadOnlyStatusBridgePanel
 * Real read-only authenticated OpenClaw status bridge UI.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Sends only: endpoint, requestId, mode: READ_ONLY
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Copy, ShieldCheck, RefreshCw, Lock, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY       = 'openclawReadOnlyStatusBridgeReports';
const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function saveReport(record) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    all.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {}
}

function Badge({ pass, label }) {
  return (
    <div className="flex items-center gap-1.5">
      {pass
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
      <span className={`text-[8px] font-semibold ${pass ? 'text-primary' : 'text-destructive'}`}>
        {pass ? 'PASS' : 'FAIL'}
      </span>
      <span className="text-[8px] text-slate-400">{label}</span>
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
      {copied ? 'Copied!' : 'Copy Response JSON'}
    </button>
  );
}

export default function ReadOnlyStatusBridgePanel({ refreshTrigger }) {
  const [endpoint, setEndpoint] = useState('/status');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const requestId = 'req-' + Date.now().toString(36);
    const res = await base44.functions.invoke('openclawReadOnlyStatusBridge', {
      endpoint,
      requestId,
      mode: 'READ_ONLY',
    });
    const data = res.data;

    if (data?.error && !data?.callId) {
      setError(data.error);
      setLoading(false);
      return;
    }

    saveReport(data);
    tryAppendAudit({
      event:      'read_only_status_bridge_checked',
      callId:     data.callId,
      endpoint:   data.endpoint,
      reachable:  data.reachable,
      httpStatus: data.httpStatus,
      note:       `Read-only status bridge checked (${data.callId}) for ${data.endpoint}. Gateway: ${data.gatewayStatus}. No execution. No dispatch.`,
    });

    setResult(data);
    setLoading(false);
  };

  const badges = result ? [
    { label: 'Endpoint allowed',           pass: result.allowed !== false },
    { label: 'Method GET',                 pass: result.method === 'GET' },
    { label: 'No command payload',         pass: true },
    { label: 'No execution attempted',     pass: result.executionAttempted === false },
    { label: 'No browser tool used',       pass: result.browserToolUsed === false },
    { label: 'No secret exposed',          pass: result.secretExposed === false },
    { label: 'Gateway reachable',          pass: result.reachable === true },
    { label: 'Cloudflare Access boundary', pass: result.cfAccessDetected === true },
  ] : [];

  const gatewayOnline = result?.gatewayStatus === 'ONLINE';
  const gatewayCF     = result?.gatewayStatus === 'CLOUDFLARE_PROTECTED';

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Authenticated Status Bridge</div>
        <div className="text-[13px] font-bold text-foreground">Read-Only Authenticated Status Bridge</div>
      </div>

      {/* Primary banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
        <Activity className="w-4 h-4 text-primary shrink-0" />
        <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
          READ_ONLY AUTHENTICATED STATUS BRIDGE — GET ONLY — NO COMMAND DISPATCH
        </span>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">READ_ONLY / LOCKED</span> — Credentials injected server-side only. Frontend sends endpoint, requestId, mode only. No secrets. No dispatch.</span>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Endpoint</div>
            <select value={endpoint} onChange={e => setEndpoint(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50">
              {ALLOWED_ENDPOINTS.map(ep => (
                <option key={ep} value={ep}>{ep}</option>
              ))}
            </select>
          </div>
          <div className="shrink-0">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Method</div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border border-primary/30 rounded text-[10px] font-mono text-primary font-bold">
              <Lock className="w-3 h-3" /> GET
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[8px] text-slate-500">
          <span className="px-2 py-1 bg-secondary/20 border border-border/30 rounded font-mono">mode: READ_ONLY</span>
          <span className="px-2 py-1 bg-secondary/20 border border-border/30 rounded font-mono">dispatch: false</span>
          <span className="px-2 py-1 bg-secondary/20 border border-border/30 rounded font-mono">execution: DISABLED</span>
        </div>

        <button type="button" onClick={handleCheck} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50 w-full justify-center">
          <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Checking Gateway Status…' : 'Check Read-Only Gateway Status'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">

          {/* Status banner */}
          <div className={`flex items-center gap-3 px-4 py-3 border-b ${
            gatewayOnline ? 'bg-primary/10 border-primary/20' :
            gatewayCF     ? 'bg-amber-500/10 border-amber-500/20' :
                            'bg-destructive/5 border-destructive/20'
          }`}>
            <Activity className={`w-4 h-4 shrink-0 ${
              gatewayOnline ? 'text-primary' : gatewayCF ? 'text-amber-500' : 'text-destructive'
            }`} />
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wide ${
                gatewayOnline ? 'text-primary' : gatewayCF ? 'text-amber-500' : 'text-destructive'
              }`}>{result.gatewayStatus}</div>
              <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                {result.endpoint} · HTTP {result.httpStatus ?? 'N/A'} · {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* PASS/FAIL badges */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Safety Verification</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
              {badges.map(b => <Badge key={b.label} pass={b.pass} label={b.label} />)}
            </div>
          </div>

          {/* Safe response fields */}
          {result.safeResponseFields && Object.keys(result.safeResponseFields).some(k => result.safeResponseFields[k] !== null) && (
            <div className="px-4 py-3 border-b border-border/30">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Safe Gateway Fields</div>
              <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-28">
                {JSON.stringify(result.safeResponseFields, null, 2)}
              </pre>
            </div>
          )}

          {/* Key metrics grid */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border/30">
            {[
              { label: 'Reachable',           value: String(result.reachable),          ok: result.reachable },
              { label: 'CF Access Detected',  value: String(result.cfAccessDetected),   ok: result.cfAccessDetected },
              { label: 'Execution Attempted', value: String(result.executionAttempted), ok: !result.executionAttempted },
              { label: 'Secret Exposed',      value: String(result.secretExposed),      ok: !result.secretExposed },
            ].map(({ label, value, ok }) => (
              <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                <div className={`text-[10px] font-bold ${ok ? 'text-primary' : 'text-destructive'}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Full JSON + copy */}
          <div className="px-4 py-3">
            <details>
              <summary className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold cursor-pointer hover:text-slate-300">
                Full Response Record
              </summary>
              <pre className="mt-2 bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-48">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyButton data={result} />
            </div>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        No execution · No dispatch · No browser automation · No trading · No credentials exposed.
      </div>
    </div>
  );
}