/**
 * ReadOnlyRoutePlanner
 * Local-only route planning layer over approved read-only capabilities.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, ShieldCheck, RefreshCw, Map } from 'lucide-react';

const SOURCE_KEYS = {
  approvalRules:   'openclawCapabilityApprovalRules',
  policyReports:   'openclawCapabilityPolicyMatrixReports',
  evidenceExports: 'openclawCapabilityEvidenceExports',
  bridgeReports:   'openclawReadOnlyStatusBridgeReports',
  auditTrail:      'openclawAuditTrail',
};
const PLAN_KEY = 'openclawReadOnlyRoutePlans';

// ── Route mapping ─────────────────────────────────────────────────────────────
const ENDPOINT_MAP = {
  HEALTH:       '/health',
  STATUS:       '/status',
  VERSION:      '/version',
  CAPABILITIES: '/capabilities',
  READ:         'READ_ONLY_GENERIC_ROUTE',
  VERIFY:       'VERIFY_ONLY_ROUTE',
  SNAPSHOT:     'SNAPSHOT_ONLY_ROUTE',
};

const ROUTE_TYPE_MAP = {
  HEALTH:       'GATEWAY_HEALTH_CHECK',
  STATUS:       'GATEWAY_STATUS_READ',
  VERSION:      'GATEWAY_VERSION_READ',
  CAPABILITIES: 'GATEWAY_CAPABILITY_READ',
  READ:         'READ_ONLY_GENERIC',
  VERIFY:       'VERIFY_ONLY',
  SNAPSHOT:     'SNAPSHOT_ONLY',
};

const REASON_MAP = {
  HEALTH:       'Safe health check endpoint — auto-allowed, no execution',
  STATUS:       'Safe status read endpoint — auto-allowed, no execution',
  VERSION:      'Safe version read endpoint — auto-allowed, no execution',
  CAPABILITIES: 'Safe capabilities read endpoint — auto-allowed, no execution',
  READ:         'Generic read-only route — auto-allowed, no mutation',
  VERIFY:       'Verification-only route — auto-allowed, no execution',
  SNAPSHOT:     'Snapshot-only route — auto-allowed, no execution',
};

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function savePlan(plan) {
  try {
    const all = loadJSON(PLAN_KEY, []);
    const deduped = [plan, ...all.filter(p => p.planId !== plan.planId)];
    localStorage.setItem(PLAN_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function routeStatusFor(approvalReq) {
  if (approvalReq === 'AUTO_ALLOW_READ_ONLY')   return 'PLANNED_READ_ONLY';
  if (approvalReq === 'REQUIRE_OPERATOR_REVIEW') return 'REVIEW_REQUIRED';
  return 'BLOCKED';
}

function buildPlan() {
  // Pull rules from latest approval rules record
  const approvalRecords = loadJSON(SOURCE_KEYS.approvalRules, []);
  const latestRules     = approvalRecords[0]?.rules ?? [];

  // Fall back to policy matrix rows
  let sourceRules = latestRules;
  if (!sourceRules.length) {
    const policyReports = loadJSON(SOURCE_KEYS.policyReports, []);
    sourceRules = (policyReports[0]?.policyRows ?? []).map(r => ({
      capability:          r.capability,
      classification:      r.classification,
      approvalRequirement: r.classification === 'ALLOWED_READ_ONLY' ? 'AUTO_ALLOW_READ_ONLY'
        : r.classification === 'REVIEW_REQUIRED' ? 'REQUIRE_OPERATOR_REVIEW' : 'BLOCK',
    }));
  }

  const routes = sourceRules.map((rule, idx) => {
    const cap      = String(rule.capability).toUpperCase();
    const approval = rule.approvalRequirement ?? 'BLOCK';
    const status   = routeStatusFor(approval);
    const endpoint = ENDPOINT_MAP[cap] ?? null;
    const routeType = ROUTE_TYPE_MAP[cap] ?? 'UNKNOWN_ROUTE';
    const reason   = REASON_MAP[cap] ?? (
      status === 'BLOCKED' ? 'Capability blocked — no route planned' :
      status === 'REVIEW_REQUIRED' ? 'Operator review required before route can be used' :
      'Route planned but endpoint unknown'
    );

    return {
      routeId:              `route-${idx + 1}-${cap.toLowerCase()}`,
      createdAt:            new Date().toISOString(),
      capability:           cap,
      classification:       rule.classification ?? 'UNKNOWN_BLOCKED_BY_DEFAULT',
      approvalRequirement:  approval,
      routeStatus:          status,
      routeType,
      endpoint:             endpoint ?? 'NO_ROUTE_ASSIGNED',
      method:               status === 'PLANNED_READ_ONLY' ? 'GET' : 'BLOCKED',
      dispatchAllowed:      false,
      executionAttempted:   false,
      openClawCommandSent:  false,
      reason,
      safetyImpact:         status === 'PLANNED_READ_ONLY' ? 'NONE' :
                            status === 'REVIEW_REQUIRED'   ? 'LOW'  : 'BLOCKED',
    };
  });

  const plannedCount  = routes.filter(r => r.routeStatus === 'PLANNED_READ_ONLY').length;
  const blockedCount  = routes.filter(r => r.routeStatus === 'BLOCKED').length;
  const reviewCount   = routes.filter(r => r.routeStatus === 'REVIEW_REQUIRED').length;

  const planId = 'rp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    planId,
    createdAt:             new Date().toISOString(),
    phase:                 'READ_ONLY_ROUTE_PLANNER',
    totalRoutes:           routes.length,
    plannedReadOnlyRoutes: plannedCount,
    blockedRoutes:         blockedCount,
    reviewRoutes:          reviewCount,
    dispatchAllowed:       false,
    executionAttempted:    false,
    openClawCalls:         0,
    networkCalls:          false,
    secretExposed:         false,
    routes,
    note: 'Local-only route plan. No network calls. No OpenClaw calls. No dispatch. No execution.',
  };
}

// ── Style maps ────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  PLANNED_READ_ONLY: { color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',         icon: CheckCircle2,  short: 'PLANNED' },
  REVIEW_REQUIRED:   { color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',     icon: AlertTriangle, short: 'REVIEW' },
  BLOCKED:           { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCKED' },
};

const FILTERS = ['ALL', 'PLANNED_READ_ONLY', 'REVIEW_REQUIRED', 'BLOCKED'];

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
      {copied ? 'Copied!' : 'Copy Route Plan JSON'}
    </button>
  );
}

export default function ReadOnlyRoutePlanner({ refreshTrigger }) {
  const [plan,   setPlan]   = useState(null);
  const [filter, setFilter] = useState('ALL');

  const generate = useCallback(() => {
    const p = buildPlan();
    savePlan(p);
    tryAppendAudit({
      event:                'read_only_route_plan_generated',
      planId:               p.planId,
      totalRoutes:          p.totalRoutes,
      plannedReadOnlyRoutes: p.plannedReadOnlyRoutes,
      blockedRoutes:        p.blockedRoutes,
      executionAttempted:   false,
      openClawCalls:        0,
      networkCalls:         false,
      secretExposed:        false,
      note: `Read-only route plan generated (${p.planId}). ${p.plannedReadOnlyRoutes} planned, ${p.blockedRoutes} blocked. No execution. No dispatch.`,
    });
    setPlan(p);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  const filtered = plan ? plan.routes.filter(r => {
    if (filter === 'PLANNED_READ_ONLY') return r.routeStatus === 'PLANNED_READ_ONLY';
    if (filter === 'REVIEW_REQUIRED')   return r.routeStatus === 'REVIEW_REQUIRED';
    if (filter === 'BLOCKED')           return r.routeStatus === 'BLOCKED';
    return true;
  }) : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Read-Only Route Planner</div>
          <div className="text-[13px] font-bold text-foreground">Read-Only Route Planner</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Converts approved read-only capabilities into safe planned routes. Routes are not dispatched.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Routes are planned only. No network calls. No dispatch. No execution.</span>
      </div>

      {plan && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { label: 'Total Routes',    value: plan.totalRoutes,           color: 'text-foreground' },
              { label: 'Planned (RO)',    value: plan.plannedReadOnlyRoutes, color: 'text-primary font-bold' },
              { label: 'Review Required', value: plan.reviewRoutes,          color: plan.reviewRoutes > 0 ? 'text-amber-400' : 'text-slate-500' },
              { label: 'Blocked',         value: plan.blockedRoutes,         color: plan.blockedRoutes > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Dispatch Allowed',value: String(plan.dispatchAllowed), color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',  value: String(plan.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'OC Calls',        value: plan.openClawCalls,         color: 'text-destructive font-bold' },
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
            <span className="ml-auto text-[8px] text-slate-500">{filtered.length} route{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Route table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
              <Map className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Route Plan — {plan.routes.length} routes
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Capability', 'Route Status', 'Route Type', 'Endpoint', 'Method', 'Dispatch', 'Safety Impact', 'Reason'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((route, i) => {
                    const style = STATUS_STYLE[route.routeStatus] ?? STATUS_STYLE.BLOCKED;
                    const Icon  = style.icon;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono font-bold text-foreground whitespace-nowrap">{route.capability}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold flex items-center gap-1 w-fit ${style.bg} ${style.color}`}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            {style.short}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap font-mono text-[7px]">{route.routeType}</td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          <span className={route.routeStatus === 'PLANNED_READ_ONLY' ? 'text-blue-400' : 'text-slate-500'}>
                            {route.endpoint}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={route.method === 'GET' ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                            {route.method}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-destructive font-bold">{String(route.dispatchAllowed)}</span>
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap text-[7px] font-semibold ${
                          route.safetyImpact === 'NONE'    ? 'text-primary' :
                          route.safetyImpact === 'LOW'     ? 'text-amber-400' :
                          route.safetyImpact === 'BLOCKED' ? 'text-slate-500' : 'text-destructive'
                        }`}>{route.safetyImpact}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-[200px]">{route.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="font-mono">{plan.planId}</span>
            <span>{new Date(plan.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={plan} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Map className="w-3 h-3" /> Generate Route Plan
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Route planner is local-only. No dispatch. No execution. No OpenClaw calls.
      </div>
    </div>
  );
}