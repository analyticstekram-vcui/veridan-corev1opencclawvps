/**
 * BrowserObservationRoutePlannerPanel — Local-only Route Planner
 * Converts approved observation actions into non-executable route plans.
 * Does NOT call browser automation APIs.
 * No backend calls, no OpenClaw calls, no fetch, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Map, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Clock, XCircle } from 'lucide-react';

const APPROVAL_KEY = 'openclawBrowserObservationApprovalRules';
const PLAN_KEY     = 'openclawBrowserObservationRoutePlan';
const PLANNER_NAME = 'OPENCLAW_BROWSER_OBSERVATION_ROUTE_PLANNER';
const PLANNER_STATUS = 'LOCAL_ONLY_ROUTE_PLANNER_READY';

const PLANNED_ROUTES = [
  { routeId: 'PAGE_TITLE_READ',             action: 'Read page title',                  safetyImpact: 'none' },
  { routeId: 'CURRENT_URL_READ',            action: 'Read current URL',                 safetyImpact: 'none' },
  { routeId: 'PAGE_LOAD_STATUS_READ',       action: 'Detect page load status',          safetyImpact: 'none' },
  { routeId: 'SELECTOR_PRESENCE_READ',      action: 'Detect selector presence',         safetyImpact: 'none' },
  { routeId: 'VISIBLE_TEXT_READ',           action: 'Inspect visible text',             safetyImpact: 'none' },
  { routeId: 'DOM_SNAPSHOT_METADATA_READ',  action: 'Capture DOM snapshot metadata',    safetyImpact: 'none' },
  { routeId: 'SCREENSHOT_METADATA_READ',    action: 'Capture screenshot metadata only', safetyImpact: 'none' },
  { routeId: 'OBSERVATION_EVIDENCE_RECORD', action: 'Record observation evidence',      safetyImpact: 'none' },
];

const REVIEW_REQUIRED_ROUTES = [
  { routeId: 'AUTHENTICATED_PAGE_STATE_OBSERVE',    action: 'Observe authenticated page state',           safetyImpact: 'medium' },
  { routeId: 'FINANCIAL_DASHBOARD_OBSERVE',         action: 'Observe financial dashboard',                safetyImpact: 'medium' },
  { routeId: 'BROKER_DASHBOARD_OBSERVE',            action: 'Observe broker dashboard',                   safetyImpact: 'medium' },
  { routeId: 'ACCOUNT_BALANCE_OBSERVE',             action: 'Observe account balances',                   safetyImpact: 'medium' },
  { routeId: 'TRANSACTION_HISTORY_OBSERVE',         action: 'Observe transaction history',                safetyImpact: 'medium' },
  { routeId: 'CREDIT_PROFILE_DASHBOARD_OBSERVE',    action: 'Observe credit profile dashboard',           safetyImpact: 'medium' },
  { routeId: 'BUSINESS_FORMATION_PORTAL_OBSERVE',   action: 'Observe business formation portal status',   safetyImpact: 'medium' },
];

const BLOCKED_ROUTES = [
  { routeId: 'CLICK_ACTION',                       action: 'clicking',                                   safetyImpact: 'critical' },
  { routeId: 'TYPE_ACTION',                        action: 'typing',                                     safetyImpact: 'critical' },
  { routeId: 'FORM_SUBMISSION',                    action: 'form submission',                            safetyImpact: 'critical' },
  { routeId: 'CREDENTIAL_ENTRY',                   action: 'credential entry',                           safetyImpact: 'critical' },
  { routeId: 'PASSWORD_ENTRY',                     action: 'password entry',                             safetyImpact: 'critical' },
  { routeId: 'API_KEY_ENTRY',                      action: 'API key entry',                              safetyImpact: 'critical' },
  { routeId: 'FILE_UPLOAD',                        action: 'file upload',                                safetyImpact: 'high' },
  { routeId: 'TRADE_ACTION',                       action: 'trading',                                    safetyImpact: 'critical' },
  { routeId: 'BROKER_ACTION',                      action: 'broker actions',                             safetyImpact: 'critical' },
  { routeId: 'WALLET_ACTION',                      action: 'wallet actions',                             safetyImpact: 'critical' },
  { routeId: 'MONEY_MOVEMENT',                     action: 'money movement',                             safetyImpact: 'critical' },
  { routeId: 'COMMAND_DISPATCH',                   action: 'command dispatch',                           safetyImpact: 'critical' },
  { routeId: 'AUTONOMOUS_BROWSER_CONTROL',         action: 'autonomous browser control',                 safetyImpact: 'critical' },
  { routeId: 'CLOUDFLARE_OR_LOGIN_BYPASS',         action: 'bypassing Cloudflare/login walls',           safetyImpact: 'critical' },
  { routeId: 'UNAUTHORIZED_PROTECTED_DATA_SCRAPE', action: 'scraping protected data without authorization', safetyImpact: 'critical' },
];

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noClick:                  true,
  noTyping:                 true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noAutonomousControl:      true,
};

function buildRouteObjects(routes, routeType, classification, allowed, requiresOperatorReview) {
  return routes.map(r => ({
    routeId:                r.routeId,
    action:                 r.action,
    routeType,
    classification,
    allowed,
    requiresOperatorReview,
    executionAllowed:       false,
    dispatchAllowed:        false,
    browserMutationAllowed: false,
    safetyImpact:           r.safetyImpact,
  }));
}

function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

const CLASS_CONFIG = {
  PLANNED:  { label: 'Planned Read-Only',    color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',     icon: CheckCircle2, badge: 'text-primary border-primary/30 bg-primary/5' },
  REVIEW:   { label: 'Review Required',      color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20', icon: Clock,        badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  BLOCKED:  { label: 'Blocked',              color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,  badge: 'text-destructive border-destructive/30 bg-destructive/5' },
};

const SAFETY_IMPACT_COLOR = {
  none:     'text-primary',
  medium:   'text-amber-500',
  high:     'text-orange-500',
  critical: 'text-destructive',
};

export default function BrowserObservationRoutePlannerPanel() {
  const [plan, setPlan] = useState(() => loadJSON(PLAN_KEY));
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const approvalPresent = !!localStorage.getItem(APPROVAL_KEY);
    const p = {
      plannerName:                PLANNER_NAME,
      generatedAt:                new Date().toISOString(),
      sourceApprovalRulesPresent: approvalPresent,
      plannedReadOnlyRoutes:      buildRouteObjects(PLANNED_ROUTES,         'READ_ONLY', 'PLANNED',         true,  false),
      reviewRequiredRoutes:       buildRouteObjects(REVIEW_REQUIRED_ROUTES, 'OBSERVE',   'REVIEW_REQUIRED', false, true),
      blockedRoutes:              buildRouteObjects(BLOCKED_ROUTES,         'BLOCKED',   'PROHIBITED',      false, false),
      plannerStatus:              PLANNER_STATUS,
      safetyAssertions:           SAFETY_ASSERTIONS,
    };
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(p, null, 2)); } catch {}
    setPlan(p);
  };

  const handleCopy = () => {
    if (!plan) return;
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(PLAN_KEY); } catch {}
    setPlan(null);
  };

  const sections = [
    { key: 'PLANNED', routes: PLANNED_ROUTES,         routeType: 'READ_ONLY', classification: 'PLANNED',         allowed: true,  review: false },
    { key: 'REVIEW',  routes: REVIEW_REQUIRED_ROUTES, routeType: 'OBSERVE',   classification: 'REVIEW_REQUIRED', allowed: false, review: true  },
    { key: 'BLOCKED', routes: BLOCKED_ROUTES,          routeType: 'BLOCKED',   classification: 'PROHIBITED',      allowed: false, review: false },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 15 · Browser Observation Route Planner</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" /> Browser Observation Route Planner
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only route planner. Does not call browser automation APIs, execute routes, or dispatch commands.</div>
      </div>

      {/* Planner name chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">{PLANNER_NAME}</span>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2">
        {sections.map(({ key, routes }) => {
          const cfg = CLASS_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`border rounded-lg px-3 py-2.5 ${cfg.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${cfg.color} shrink-0`} />
                <span className={`text-[8px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className={`text-[18px] font-bold ${cfg.color}`}>{routes.length}</div>
              <div className="text-[8px] text-slate-500">routes</div>
            </div>
          );
        })}
      </div>

      {/* Route tables */}
      {sections.map(({ key, routes }) => {
        const cfg = CLASS_CONFIG[key];
        const Icon = cfg.icon;
        return (
          <div key={key} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${cfg.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
              <span className={`text-[9px] uppercase tracking-widest font-semibold ${cfg.color}`}>{cfg.label}</span>
              <span className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded border ${cfg.badge}`}>{routes.length}</span>
            </div>
            <div className="divide-y divide-border/30">
              {routes.map((r) => (
                <div key={r.routeId} className="flex items-start gap-2.5 px-4 py-2">
                  <Icon className={`w-3 h-3 ${cfg.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-slate-300">{r.action}</div>
                    <div className="text-[8px] font-mono text-slate-500 mt-0.5">{r.routeId}</div>
                  </div>
                  <span className={`text-[7px] font-bold uppercase shrink-0 ${SAFETY_IMPACT_COLOR[r.safetyImpact] || 'text-slate-400'}`}>
                    {r.safetyImpact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Route object fields note */}
      <div className="bg-secondary/10 border border-border/40 rounded px-4 py-3">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Each Route Object Contains</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[8px] font-mono text-slate-400">
          {['routeId', 'action', 'routeType', 'classification', 'allowed', 'requiresOperatorReview',
            'executionAllowed: false', 'dispatchAllowed: false', 'browserMutationAllowed: false', 'safetyImpact'].map(f => (
            <div key={f} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{key}: <span className="text-primary font-bold">{String(value)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Route plan is local-only and non-executable.</span>{' '}
          Does not enable browser automation, command dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Map className="w-3.5 h-3.5" />
          Generate Browser Observation Route Plan
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!plan}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Route Plan JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!plan}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Route Plan
        </button>
      </div>

      {/* JSON preview */}
      {plan && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Route Plan — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(plan.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(plan, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{PLAN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch.
      </div>
    </div>
  );
}