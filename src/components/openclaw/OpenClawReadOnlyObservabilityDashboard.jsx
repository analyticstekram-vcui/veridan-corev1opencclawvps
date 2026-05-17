/**
 * OpenClawReadOnlyObservabilityDashboard
 * Practical read-only dashboard summarising the current OpenClaw integration state
 * from existing governance chain localStorage outputs.
 * No network calls, no backend calls, no secrets, no execution.
 */
import React, { useState, useMemo } from 'react';
import { RefreshCw, Copy, CheckCircle2, ShieldCheck, Activity, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

// ── Storage keys (read-only) ──────────────────────────────────────────────────
const KEYS = {
  health50:   'openclawPhase50OpenClawReadOnlyHealthCheckResults',
  health51:   'openclawPhase51HealthCheckEvidenceRecords',
  svc54:      'openclawPhase54StatusVersionCapabilitiesReadOnlyResults',
  svc55:      'openclawPhase55StatusVersionCapabilitiesEvidenceRecords',
  policy56:   'openclawPhase56ReadOnlyCapabilityPolicyMaps',
};

// ── Safe JSON loader ──────────────────────────────────────────────────────────
function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ── Flatten helpers ───────────────────────────────────────────────────────────
// Phase 50: flat array of { recordId, invokedAt, result: {...} }
function getLatestPhase50(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0];
}

// Phase 51: array of batches { evidenceRecords: [...] }
function getLatestPhase51Record(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const records = data.flatMap(b => b.evidenceRecords || []);
  return records.length > 0 ? records[0] : null;
}

// Phase 54: flat array of { recordId, invokedAt, result: {...} }
function getLatestPhase54(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0];
}

// Phase 55: array of batches { evidenceRecords: [...] }
function getLatestPhase55Record(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const records = data.flatMap(b => b.evidenceRecords || []);
  return records.length > 0 ? records[0] : null;
}

// Phase 56: array of batches { policyMaps: [...] }
function getLatestPhase56Map(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const maps = data.flatMap(b => b.policyMaps || []);
  return maps.length > 0 ? maps[0] : null;
}

// ── Build dashboard state from localStorage ───────────────────────────────────
function buildDashboardState() {
  const raw50  = loadJSON(KEYS.health50,  []);
  const raw51  = loadJSON(KEYS.health51,  []);
  const raw54  = loadJSON(KEYS.svc54,     []);
  const raw55  = loadJSON(KEYS.svc55,     []);
  const raw56  = loadJSON(KEYS.policy56,  []);

  const h50 = getLatestPhase50(raw50);
  const h51 = getLatestPhase51Record(raw51);
  const s54 = getLatestPhase54(raw54);
  const s55 = getLatestPhase55Record(raw55);
  const p56 = getLatestPhase56Map(raw56);

  // ── Health ──
  const healthStatus   = h50?.result?.openClawHealthStatus ?? h51?.healthStatus ?? 'NOT_CHECKED';
  const healthReachable = h50?.result?.openClawReachable ?? h51?.gatewayReachable ?? null;
  const healthHttp     = h50?.result?.httpStatus ?? h51?.httpStatus ?? null;
  const healthTs       = h50?.invokedAt ?? h51?.generatedAt ?? null;
  const healthEvidTs   = h51?.generatedAt ?? null;

  // ── SVC summaries ──
  const statusS  = s55?.statusSummary       ?? s54?.result?.openClawStatusSummary       ?? null;
  const versionS = s55?.versionSummary      ?? s54?.result?.openClawVersionSummary      ?? null;
  const capabS   = s55?.capabilitiesSummary ?? s54?.result?.openClawCapabilitiesSummary ?? null;
  const svcTs    = s54?.invokedAt ?? null;
  const svcEvidTs = s55?.generatedAt ?? null;
  const policyTs  = p56?.generatedAt ?? null;

  // ── Overall reachability ──
  let reachability = 'UNKNOWN';
  if (healthReachable === true || statusS?.reachable === true) reachability = 'REACHABLE';
  else if (healthReachable === false && statusS?.reachable === false) reachability = 'UNREACHABLE';

  // ── Endpoint statuses ──
  const endpoints = [
    {
      path: '/health',
      method: 'GET',
      reachable: healthReachable,
      httpStatus: healthHttp,
      responseBodyReturned: false,
      source: h50 || h51 ? 'Phase 50/51' : null,
    },
    {
      path: '/status',
      method: 'GET',
      reachable: statusS?.reachable ?? null,
      httpStatus: statusS?.httpStatus ?? null,
      responseBodyReturned: false,
      source: s54 || s55 ? 'Phase 54/55' : null,
    },
    {
      path: '/version',
      method: 'GET',
      reachable: versionS?.reachable ?? null,
      httpStatus: versionS?.httpStatus ?? null,
      responseBodyReturned: false,
      source: s54 || s55 ? 'Phase 54/55' : null,
    },
    {
      path: '/capabilities',
      method: 'GET',
      reachable: capabS?.reachable ?? null,
      httpStatus: capabS?.httpStatus ?? null,
      responseBodyReturned: false,
      source: s54 || s55 ? 'Phase 54/55' : null,
    },
  ];

  // ── Policy ──
  const allowedCaps  = p56?.allowedReadOnlyCapabilities  ?? ['HEALTH_CHECK', 'STATUS_READ', 'VERSION_READ', 'CAPABILITIES_READ'];
  const blockedCaps  = p56?.blockedCapabilities          ?? ['COMMAND_DISPATCH', 'ACTION_EXECUTION', 'BROKER_CONNECTOR', 'WALLET_ACTION', 'CREDENTIAL_ENTRY', 'AUTOMATION_ENGINE', 'SCHEDULED_RUNNER', 'REPEATING_CHECK', 'VALUE_TRANSFER', 'SECRET_VALUE_ACCESS', 'RAW_RESPONSE_BODY_EXPOSURE'];

  // ── Completeness status ──
  const hasHealth  = Boolean(h50 || h51);
  const hasSvc     = Boolean(s54 || s55);
  const hasPolicy  = Boolean(p56);
  let observabilityStatus;
  if (hasHealth && hasSvc && hasPolicy) {
    observabilityStatus = 'FULL';
  } else if (hasHealth || hasSvc) {
    observabilityStatus = 'PARTIAL';
  } else {
    observabilityStatus = 'NONE';
  }

  return {
    healthStatus, healthReachable, healthHttp, healthTs, healthEvidTs,
    reachability, statusS, versionS, capabS, svcTs, svcEvidTs, policyTs,
    endpoints, allowedCaps, blockedCaps, observabilityStatus,
    hasHealth, hasSvc, hasPolicy,
  };
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function fmtTs(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function ReachBadge({ val }) {
  if (val === true)  return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">REACHABLE</span>;
  if (val === false) return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">UNREACHABLE</span>;
  return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border text-slate-400 border-slate-500/30 bg-slate-500/5">UNKNOWN</span>;
}

function StatusChip({ label, color }) {
  const colors = {
    green:  'text-primary border-primary/30 bg-primary/5',
    red:    'text-destructive border-destructive/30 bg-destructive/5',
    amber:  'text-amber-500 border-amber-500/30 bg-amber-500/5',
    slate:  'text-slate-400 border-slate-500/30 bg-slate-500/5',
  };
  return (
    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${colors[color] || colors.slate}`}>
      {label}
    </span>
  );
}

function healthColor(s) {
  if (s === 'HEALTHY') return 'green';
  if (s === 'UNHEALTHY') return 'red';
  if (s === 'NOT_CHECKED') return 'slate';
  return 'amber';
}

function reachColor(s) {
  if (s === 'REACHABLE') return 'green';
  if (s === 'UNREACHABLE') return 'red';
  return 'slate';
}

function endpointOkColor(ep) {
  if (ep.source === null) return 'slate';
  if (ep.reachable === true) return 'green';
  if (ep.reachable === false) return 'red';
  return 'amber';
}

function endpointLabel(ep) {
  if (ep.source === null) return 'UNKNOWN';
  if (ep.reachable === true) return 'OK';
  if (ep.reachable === false) return 'FAIL';
  return 'UNKNOWN';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OpenClawReadOnlyObservabilityDashboard() {
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  const state = useMemo(() => buildDashboardState(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => setTick(t => t + 1);

  const handleCopy = () => {
    const summary = {
      generatedAt: new Date().toISOString(),
      safetyMode: 'READ_ONLY_LOCKED',
      healthStatus: state.healthStatus,
      reachability: state.reachability,
      observabilityStatus: state.observabilityStatus,
      endpoints: state.endpoints.map(ep => ({
        path: ep.path,
        method: ep.method,
        reachable: ep.reachable,
        httpStatus: ep.httpStatus,
        responseBodyReturned: false,
        source: ep.source,
      })),
      latestTimestamps: {
        healthCheck: state.healthTs,
        healthEvidence: state.healthEvidTs,
        svcCheck: state.svcTs,
        svcEvidence: state.svcEvidTs,
        policyMap: state.policyTs,
      },
      allowedCapabilities: state.allowedCaps,
      blockedCapabilities: state.blockedCaps,
    };
    try {
      navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const { healthStatus, reachability, statusS, versionS, capabS,
          healthTs, healthEvidTs, svcTs, svcEvidTs, policyTs,
          endpoints, allowedCaps, blockedCaps,
          observabilityStatus, hasHealth, hasSvc, hasPolicy } = state;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">OpenClaw Integration</div>
          <div className="text-[15px] font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> OpenClaw Read-Only Observability Dashboard
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Live view of governance chain outputs. No network calls. Read-only.</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard View
          </button>
          <button type="button" onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-primary/40 text-primary hover:bg-primary/10 rounded font-bold transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Dashboard Summary JSON'}
          </button>
        </div>
      </div>

      {/* ── Plain-English status block ── */}
      {observabilityStatus === 'FULL' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-primary">OpenClaw read-only observability is available — health, status, version, capabilities, and policy map all present.</span>
        </div>
      )}
      {observabilityStatus === 'PARTIAL' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-[10px] font-semibold text-amber-500">OpenClaw observability is partially available — run missing phase checks to complete the chain.</span>
        </div>
      )}
      {observabilityStatus === 'NONE' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-lg">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[10px] font-semibold text-slate-400">OpenClaw observability has not been checked yet — run Phase 50 health check and Phase 54 SVC check first.</span>
        </div>
      )}

      {/* ── Top summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: 'OpenClaw Health',       chip: healthStatus === 'NOT_CHECKED' ? 'NOT CHECKED' : healthStatus, color: healthColor(healthStatus) },
          { label: 'Reachability',           chip: reachability,                                                   color: reachColor(reachability) },
          { label: '/status Endpoint',       chip: endpointLabel(endpoints[1]),                                    color: endpointOkColor(endpoints[1]) },
          { label: '/version Endpoint',      chip: endpointLabel(endpoints[2]),                                    color: endpointOkColor(endpoints[2]) },
          { label: '/capabilities Endpoint', chip: endpointLabel(endpoints[3]),                                    color: endpointOkColor(endpoints[3]) },
          { label: 'Safety Mode',            chip: 'READ_ONLY_LOCKED',                                             color: 'green' },
        ].map(({ label, chip, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-3 py-3">
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">{label}</div>
            <StatusChip label={chip} color={color} />
          </div>
        ))}
      </div>

      {/* ── Timestamps ── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Evidence Timestamps</span>
        </div>
        <div className="divide-y divide-border/20">
          {[
            ['Health check (Phase 50)',          healthTs],
            ['Health evidence (Phase 51)',        healthEvidTs],
            ['Status/Version/Capabilities check (Phase 54)', svcTs],
            ['SVC evidence (Phase 55)',           svcEvidTs],
            ['Policy map (Phase 56)',             policyTs],
          ].map(([label, ts]) => (
            <div key={label} className="flex items-center justify-between px-4 py-2 text-[8px]">
              <span className="text-slate-400">{label}</span>
              <span className={`font-mono ${ts ? 'text-primary' : 'text-slate-600'}`}>{fmtTs(ts)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Endpoint table ── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Endpoint Status Table</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead className="bg-secondary/10 border-b border-border/30">
              <tr>
                {['Endpoint', 'Method', 'Reachable', 'HTTP Status', 'Body Returned', 'Safety'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {endpoints.map(ep => (
                <tr key={ep.path} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-primary font-bold">{ep.path}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{ep.method}</td>
                  <td className="px-3 py-2.5"><ReachBadge val={ep.reachable} /></td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{ep.httpStatus ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[8px] font-bold text-primary">false</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">READ_ONLY</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Policy summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-primary/20 rounded-lg p-3">
          <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
            Allowed Capabilities ({allowedCaps.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allowedCaps.map(c => (
              <span key={c} className="text-[8px] font-mono px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded">{c}</span>
            ))}
          </div>
        </div>
        <div className="bg-card border border-destructive/20 rounded-lg p-3">
          <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
            Blocked Capabilities ({blockedCaps.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {blockedCaps.map(c => (
              <span key={c} className="text-[7px] font-mono px-2 py-0.5 bg-destructive/5 border border-destructive/20 text-destructive rounded">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data source presence indicators ── */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Governance Chain Data Presence</div>
        <div className="flex flex-wrap gap-2">
          {[
            ['Phase 50 Health Check',       hasHealth],
            ['Phase 51 Health Evidence',    Boolean(healthEvidTs)],
            ['Phase 54 SVC Check',          hasSvc],
            ['Phase 55 SVC Evidence',       Boolean(svcEvidTs)],
            ['Phase 56 Policy Map',         hasPolicy],
          ].map(([label, present]) => (
            <div key={label} className="flex items-center gap-1.5 text-[8px]">
              {present
                ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                : <XCircle className="w-3 h-3 text-slate-600 shrink-0" />}
              <span className={present ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Safety footer ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Read-only dashboard. All data sourced from localStorage governance chain outputs. No fetch, no backend calls, no secret values, no raw response bodies, no execution.
      </div>
    </div>
  );
}