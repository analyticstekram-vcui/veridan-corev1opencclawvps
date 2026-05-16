/**
 * ReadOnlyRouteSimulation
 * Local-only simulation layer over planned read-only routes.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, ShieldCheck, RefreshCw, FlaskConical } from 'lucide-react';
import ReadOnlyRouteSimulationEvidenceExport from './ReadOnlyRouteSimulationEvidenceExport.jsx';

const SOURCE_KEYS = {
  routePlans:      'openclawReadOnlyRoutePlans',
  approvalRules:   'openclawCapabilityApprovalRules',
  policyReports:   'openclawCapabilityPolicyMatrixReports',
  evidenceExports: 'openclawCapabilityEvidenceExports',
  bridgeReports:   'openclawReadOnlyStatusBridgeReports',
  auditTrail:      'openclawAuditTrail',
};
const SIM_KEY = 'openclawReadOnlyRouteSimulations';

// Safe endpoints / route types that may be simulated
const SAFE_ENDPOINTS = new Set([
  '/health',
  '/status',
  '/version',
  '/capabilities',
  'READ_ONLY_GENERIC_ROUTE',
  'VERIFY_ONLY_ROUTE',
  'SNAPSHOT_ONLY_ROUTE',
]);

// Keywords that force a block regardless of route plan status
const BLOCK_KEYWORDS = [
  'TRADE', 'EXEC', 'DISPATCH', 'COMMAND', 'WRITE', 'DELETE', 'MUTATE',
  'CREDENTIAL', 'AUTH_WRITE', 'ORDER', 'MONEY', 'PAYMENT', 'BROKER',
  'DEPLOY', 'RUN', 'SUBMIT', 'POST', 'PUT', 'PATCH', 'WALLET', 'BROKER',
];

const EXPECTED_SHAPE_MAP = {
  '/health':                { status: 'string', uptime: 'number', version: 'string' },
  '/status':                { state: 'string', mode: 'string', capabilities: 'array' },
  '/version':               { version: 'string', buildDate: 'string' },
  '/capabilities':          { capabilities: 'array' },
  'READ_ONLY_GENERIC_ROUTE':{ data: 'object', readOnly: true },
  'VERIFY_ONLY_ROUTE':      { verified: 'boolean', checksum: 'string' },
  'SNAPSHOT_ONLY_ROUTE':    { snapshot: 'object', timestamp: 'string' },
};

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveSim(sim) {
  try {
    const all = loadJSON(SIM_KEY, []);
    const deduped = [sim, ...all.filter(s => s.simId !== sim.simId)];
    localStorage.setItem(SIM_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function isBlockedByKeyword(str) {
  const upper = String(str).toUpperCase();
  return BLOCK_KEYWORDS.some(kw => upper.includes(kw));
}

function simulateRoute(route) {
  const endpoint = route.endpoint ?? '';
  const method   = route.method ?? '';
  const approval = route.approvalRequirement ?? 'BLOCK';

  // Hard block conditions
  if (approval === 'BLOCK')                    return { status: 'BLOCKED_SIMULATION', blockedReason: 'Approval requirement is BLOCK' };
  if (method !== 'GET')                        return { status: 'BLOCKED_SIMULATION', blockedReason: 'Only GET method routes may be simulated' };
  if (!SAFE_ENDPOINTS.has(endpoint))           return { status: 'BLOCKED_SIMULATION', blockedReason: 'Endpoint not in safe simulation set' };
  if (isBlockedByKeyword(endpoint))            return { status: 'BLOCKED_SIMULATION', blockedReason: 'Blocked keyword detected in endpoint' };
  if (isBlockedByKeyword(route.capability))    return { status: 'BLOCKED_SIMULATION', blockedReason: 'Blocked keyword detected in capability' };
  if (approval === 'REQUIRE_OPERATOR_REVIEW')  return { status: 'REVIEW_REQUIRED_SIMULATION', blockedReason: 'Operator review required before simulation' };

  return { status: 'SIMULATED_READ_ONLY', blockedReason: null };
}

function buildSimulation() {
  const routePlans  = loadJSON(SOURCE_KEYS.routePlans, []);
  const latestPlan  = routePlans[0] ?? null;
  const routes      = latestPlan?.routes ?? [];

  const simulations = routes.map((route, idx) => {
    const { status, blockedReason } = simulateRoute(route);
    const endpoint = route.endpoint ?? '';
    const safetyImpact =
      status === 'SIMULATED_READ_ONLY'        ? 'NONE' :
      status === 'REVIEW_REQUIRED_SIMULATION' ? 'LOW'  : 'BLOCKED';

    const reason =
      status === 'SIMULATED_READ_ONLY'
        ? `Safe read-only route simulated — no dispatch, no execution (${endpoint})`
        : status === 'REVIEW_REQUIRED_SIMULATION'
        ? 'Route requires operator review before simulation can proceed'
        : `Simulation blocked — ${blockedReason}`;

    return {
      simulationId:        `sim-${idx + 1}-${String(route.capability).toLowerCase()}`,
      createdAt:           new Date().toISOString(),
      routeId:             route.routeId ?? `route-${idx + 1}`,
      capability:          route.capability,
      endpoint,
      method:              route.method ?? 'BLOCKED',
      routeType:           route.routeType ?? 'UNKNOWN',
      approvalRequirement: route.approvalRequirement ?? 'BLOCK',
      simulationStatus:    status,
      dispatchAllowed:     false,
      executionAttempted:  false,
      openClawCommandSent: false,
      networkCalls:        false,
      browserToolUsed:     false,
      secretExposed:       false,
      expectedResponseShape: status === 'SIMULATED_READ_ONLY' ? (EXPECTED_SHAPE_MAP[endpoint] ?? null) : null,
      blockedReason:       blockedReason ?? null,
      reason,
      safetyImpact,
    };
  });

  const simCount     = simulations.filter(s => s.simulationStatus === 'SIMULATED_READ_ONLY').length;
  const blockedCount = simulations.filter(s => s.simulationStatus === 'BLOCKED_SIMULATION').length;
  const reviewCount  = simulations.filter(s => s.simulationStatus === 'REVIEW_REQUIRED_SIMULATION').length;

  const simId = 'rrs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    simId,
    createdAt:             new Date().toISOString(),
    phase:                 'READ_ONLY_ROUTE_SIMULATION',
    sourcePlanId:          latestPlan?.planId ?? null,
    totalSimulations:      simulations.length,
    simulatedReadOnlyRoutes: simCount,
    blockedSimulations:    blockedCount,
    reviewRequiredRoutes:  reviewCount,
    dispatchAllowed:       false,
    executionAttempted:    false,
    openClawCalls:         0,
    networkCalls:          false,
    secretExposed:         false,
    simulations,
    note: 'Local-only route simulation. No network calls. No OpenClaw calls. No dispatch. No execution.',
  };
}

// ── Style maps ────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  SIMULATED_READ_ONLY:        { color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',         icon: CheckCircle2,  short: 'SIMULATED' },
  REVIEW_REQUIRED_SIMULATION: { color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',     icon: AlertTriangle, short: 'REVIEW' },
  BLOCKED_SIMULATION:         { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCKED' },
};

const FILTERS = ['ALL', 'SIMULATED_READ_ONLY', 'REVIEW_REQUIRED', 'BLOCKED'];

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
      {copied ? 'Copied!' : 'Copy Simulation JSON'}
    </button>
  );
}

export default function ReadOnlyRouteSimulation({ refreshTrigger }) {
  const [sim,    setSim]    = useState(null);
  const [filter, setFilter] = useState('ALL');

  const generate = useCallback(() => {
    const s = buildSimulation();
    saveSim(s);
    tryAppendAudit({
      event:                  'read_only_route_simulation_generated',
      simId:                  s.simId,
      totalSimulations:       s.totalSimulations,
      simulatedReadOnlyRoutes: s.simulatedReadOnlyRoutes,
      blockedSimulations:     s.blockedSimulations,
      executionAttempted:     false,
      openClawCalls:          0,
      networkCalls:           false,
      secretExposed:          false,
      note: `Read-only route simulation generated (${s.simId}). ${s.simulatedReadOnlyRoutes} simulated, ${s.blockedSimulations} blocked. No execution. No dispatch.`,
    });
    setSim(s);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  const filtered = sim ? sim.simulations.filter(s => {
    if (filter === 'SIMULATED_READ_ONLY') return s.simulationStatus === 'SIMULATED_READ_ONLY';
    if (filter === 'REVIEW_REQUIRED')     return s.simulationStatus === 'REVIEW_REQUIRED_SIMULATION';
    if (filter === 'BLOCKED')             return s.simulationStatus === 'BLOCKED_SIMULATION';
    return true;
  }) : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Read-Only Route Simulation</div>
          <div className="text-[13px] font-bold text-foreground">Read-Only Route Simulation</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Simulates planned read-only routes locally. No network calls. No dispatch. No execution.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Simulations are local-only. No network. No OpenClaw. No dispatch. No execution.</span>
      </div>

      {sim && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Total',           value: sim.totalSimulations,        color: 'text-foreground' },
              { label: 'Simulated (RO)',  value: sim.simulatedReadOnlyRoutes, color: 'text-primary font-bold' },
              { label: 'Review Required', value: sim.reviewRequiredRoutes,    color: sim.reviewRequiredRoutes > 0 ? 'text-amber-400' : 'text-slate-500' },
              { label: 'Blocked',         value: sim.blockedSimulations,      color: sim.blockedSimulations > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Dispatch',        value: String(sim.dispatchAllowed), color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',  value: String(sim.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'OC Calls',        value: sim.openClawCalls,           color: 'text-destructive font-bold' },
              { label: 'Network Calls',   value: String(sim.networkCalls),    color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[8px] font-bold rounded border transition-colors ${
                  filter === f
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-secondary/20 border-border text-slate-400 hover:bg-secondary/40'
                }`}>
                {f}
              </button>
            ))}
            <span className="ml-auto text-[8px] text-slate-500">{filtered.length} simulation{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Simulation table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Route Simulations — {sim.simulations.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Capability', 'Endpoint', 'Method', 'Status', 'Dispatch', 'Network', 'Safety', 'Reason / Blocked Reason'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const style = STATUS_STYLE[s.simulationStatus] ?? STATUS_STYLE.BLOCKED_SIMULATION;
                    const Icon  = style.icon;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono font-bold text-foreground whitespace-nowrap">{s.capability}</td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          <span className={s.simulationStatus === 'SIMULATED_READ_ONLY' ? 'text-blue-400' : 'text-slate-500'}>
                            {s.endpoint}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={s.method === 'GET' ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                            {s.method}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold flex items-center gap-1 w-fit ${style.bg} ${style.color}`}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            {style.short}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-destructive font-bold">{String(s.dispatchAllowed)}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-destructive font-bold">{String(s.networkCalls)}</span>
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap text-[7px] font-semibold ${
                          s.safetyImpact === 'NONE'    ? 'text-primary' :
                          s.safetyImpact === 'LOW'     ? 'text-amber-400' :
                          s.safetyImpact === 'BLOCKED' ? 'text-slate-500' : 'text-destructive'
                        }`}>{s.safetyImpact}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-[220px]">
                          {s.blockedReason
                            ? <span><span className="text-destructive font-semibold">BLOCKED: </span>{s.blockedReason}</span>
                            : s.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Source plan + Sim ID */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span>Sim ID: <span className="font-mono">{sim.simId}</span></span>
            {sim.sourcePlanId && <span>Source Plan: <span className="font-mono">{sim.sourcePlanId}</span></span>}
            <span>{new Date(sim.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={sim} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FlaskConical className="w-3 h-3" /> Generate Simulation
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Route simulation is local-only. No dispatch. No execution. No OpenClaw calls. No network calls.
      </div>

      {/* ── Read-Only Route Simulation Evidence Export ── */}
      <div className="border-t border-border/40 pt-4">
        <ReadOnlyRouteSimulationEvidenceExport refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}