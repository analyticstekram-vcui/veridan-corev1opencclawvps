/**
 * ReadOnlyBridgeStubPanel
 * Frontend for the read-only backend bridge stub.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState } from 'react';
import { CheckCircle2, Copy, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STUB_KEY        = 'openclawReadOnlyBridgeStubResults';
const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function saveStubResult(record) {
  try {
    const all = JSON.parse(localStorage.getItem(STUB_KEY) || '[]');
    all.unshift(record);
    localStorage.setItem(STUB_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {}
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
      {copied ? 'Copied!' : 'Copy Stub JSON'}
    </button>
  );
}

export default function ReadOnlyBridgeStubPanel({ refreshTrigger }) {
  const [endpoint,  setEndpoint]  = useState('/status');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await base44.functions.invoke('openclawReadOnlyBridgeStub', { endpoint });
    const data = res.data;

    saveStubResult(data);
    tryAppendAudit({
      event:    'read_only_bridge_stub_generated',
      stubId:   data.stubId,
      endpoint: data.endpointRequested,
      allowed:  data.allowed,
      note:     `Read-only bridge stub generated (${data.stubId}) for ${data.endpointRequested}. No OpenClaw call. No execution.`,
    });

    setResult(data);
    setLoading(false);
  };

  const SAFETY_FIELDS = result ? [
    { label: 'Dispatch Allowed',     value: String(result.dispatchAllowed),     ok: result.dispatchAllowed === false },
    { label: 'Execution Attempted',  value: String(result.executionAttempted),  ok: result.executionAttempted === false },
    { label: 'OpenClaw Cmd Sent',    value: String(result.openClawCommandSent), ok: result.openClawCommandSent === false },
    { label: 'Browser Tool Used',    value: String(result.browserToolUsed),     ok: result.browserToolUsed === false },
    { label: 'Secret Exposed',       value: String(result.secretExposed),       ok: result.secretExposed === false },
    { label: 'Gateway Mode',         value: result.gatewayMode,                 ok: result.gatewayMode === 'READ_ONLY' },
    { label: 'Execution Mode',       value: result.executionMode,               ok: result.executionMode === 'DISABLED' },
    { label: 'Execution Lock',       value: result.executionLock,               ok: result.executionLock === 'LOCKED' },
  ] : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Backend Bridge Stub</div>
        <div className="text-[13px] font-bold text-foreground">Read-Only Backend Bridge Stub</div>
        <div className="text-[9px] text-slate-500 mt-0.5">
          Calls the backend stub function — no real OpenClaw call, no dispatch, no execution.
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Stub responses only. No OpenClaw calls. No execution. No credentials exposed.</span>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Endpoint selector */}
          <div className="flex-1 min-w-[160px]">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Endpoint</div>
            <select value={endpoint} onChange={e => setEndpoint(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/40 border border-border rounded text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50">
              {ALLOWED_ENDPOINTS.map(ep => (
                <option key={ep} value={ep}>{ep}</option>
              ))}
            </select>
          </div>

          {/* Method — locked */}
          <div className="shrink-0">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Method</div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border border-primary/30 rounded text-[10px] font-mono text-primary font-bold">
              <Lock className="w-3 h-3" /> GET
            </div>
          </div>
        </div>

        <button type="button" onClick={handleGenerate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50 w-full justify-center">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating Stub Response…' : 'Generate Stub Response'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-card border border-primary/20 rounded-lg overflow-hidden space-y-0">

          {/* Confirmation banner */}
          <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border-b border-primary/20">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-wide">
                STUB RESPONSE GENERATED — no OpenClaw call, no execution.
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5 font-mono">{result.stubId}</div>
            </div>
          </div>

          {/* Safety fields grid */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAFETY_FIELDS.map(({ label, value, ok }) => (
              <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                <div className={`text-[10px] font-bold ${ok ? 'text-primary' : 'text-destructive'}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Preview response shape */}
          <div className="px-4 pb-3 space-y-1.5">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Preview Response Shape</div>
            <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-32">
              {JSON.stringify(result.previewResponseShape, null, 2)}
            </pre>
          </div>

          {/* Full JSON + copy */}
          <div className="px-4 pb-3 space-y-1.5">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Full Stub Record</div>
            <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
            <div className="flex flex-wrap gap-2 mt-1">
              <CopyButton data={result} />
            </div>
          </div>

          {/* Note */}
          <div className="px-4 pb-3 text-[8px] text-slate-500 italic">{result.note}</div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Stub only · No OpenClaw call · No network call to gateway · No execution · No dispatch · No credentials.
      </div>
    </div>
  );
}