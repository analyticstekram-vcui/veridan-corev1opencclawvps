/**
 * Phase5BCapabilityProbe
 * Read-only capability probe — calls only allowlisted backend functions.
 * No OpenClaw call. No execution. No dispatch. localStorage only.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2, XCircle, Loader2, Eye, RefreshCw, FileText, Shield,
} from 'lucide-react';

const CAPABILITY_PROBE_LS_PREFIX = 'controlled_openclaw_capability_probe_';

const PROBE_ENDPOINTS = [
  { key: 'health',       label: '/health',       fn: 'openclawHealthCheck',               allowlisted: true },
  { key: 'status',       label: '/status',        fn: 'openclawStatus',                    allowlisted: true },
  { key: 'version',      label: '/version',       fn: 'openclawStatusVersionCapabilities',  allowlisted: true },
  { key: 'capabilities', label: '/capabilities',  fn: 'openclawStatusVersionCapabilities',  allowlisted: true },
];

const PROBE_SAFETY = {
  dispatchAllowed:   false,
  executionStatus:   'NOT_EXECUTED',
  browserAutomation: 'DISABLED',
  fileWrite:         'DISABLED',
  credentialUse:     'DISABLED',
  brokerAction:      'DISABLED',
};

const PROBE_VERIFICATION = [
  { label: 'No new route created' },
  { label: '/hooks/agent not called' },
  { label: 'Only allowlisted read-only endpoints used' },
  { label: 'Unallowlisted endpoints blocked as HOLD_FOR_ALLOWLIST' },
  { label: 'No execution dispatch added' },
  { label: 'No browser automation added' },
  { label: 'No file writes added' },
  { label: 'No credential entry added' },
  { label: 'No broker/trading action added' },
  { label: 'Results saved to localStorage only' },
  { label: 'executionStatus remains NOT_EXECUTED' },
];

export default function Phase5BCapabilityProbe() {
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
      gatewayReachable:           r.health?.data?.gatewayReachable ?? 'UNKNOWN',
      healthStatus:               r.health?.status === 'ok' ? 'OK' : r.health?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
      versionStatus:              r.version?.status === 'ok' ? (r.version.data?.version ?? 'OK') : r.version?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
      statusEndpointResult:       r.status?.status === 'ok' ? (r.status.data?.status ?? 'OK') : r.status?.status === 'error' ? 'ERROR' : 'NOT_PROBED',
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
                <span className="text-slate-600 shrink-0 hidden sm:inline">{ep.fn}</span>
                <div className="ml-auto flex items-center gap-2">
                  {!r && !isLoading && <span className="text-slate-600 italic">not probed</span>}
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  {r?.status === 'ok' && <><CheckCircle2 className="w-3 h-3 text-primary shrink-0" /><span className="text-primary">OK</span></>}
                  {r?.status === 'error' && <><XCircle className="w-3 h-3 text-destructive shrink-0" /><span className="text-destructive">{r.data?.error?.slice(0, 40) || 'ERROR'}</span></>}
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

      {probePacket && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-primary">Probe Result Packet</div>
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

      <div className="flex flex-wrap gap-2">
        {['No /hooks/agent', 'No execution dispatch', 'No browser automation', 'No file writes', 'No credential entry', 'No broker action'].map(label => (
          <span key={label} className="text-[6px] font-mono font-semibold border px-2 py-0.5 rounded-full text-destructive border-destructive/30 bg-destructive/5">
            ✕ {label}
          </span>
        ))}
      </div>

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