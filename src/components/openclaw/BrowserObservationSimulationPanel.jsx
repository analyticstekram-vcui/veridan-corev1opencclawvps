/**
 * BrowserObservationSimulationPanel — Local-only Simulation Panel
 * Simulates allowed read-only observation routes without browser automation APIs or real browser actions.
 * No backend calls, no OpenClaw calls, no fetch, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { FlaskConical, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Clock, XCircle } from 'lucide-react';

const ROUTE_PLAN_KEY  = 'openclawBrowserObservationRoutePlan';
const SIMULATION_KEY  = 'openclawBrowserObservationSimulation';
const SIMULATION_NAME = 'OPENCLAW_BROWSER_OBSERVATION_SIMULATION';
const SIMULATION_STATUS = 'LOCAL_ONLY_SIMULATION_READY';

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noRealBrowserActions:     true,
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

const RESULT_SHAPES = {
  PAGE_TITLE_READ:             { title: '[simulated page title]' },
  CURRENT_URL_READ:            { url: '[simulated current url]' },
  PAGE_LOAD_STATUS_READ:       { loadStatus: 'SIMULATED_LOADED' },
  SELECTOR_PRESENCE_READ:      { selector: '[simulated selector]', present: true },
  VISIBLE_TEXT_READ:           { visibleTextSummary: '[simulated visible text summary]' },
  DOM_SNAPSHOT_METADATA_READ:  { nodeCount: 0, metadataOnly: true },
  SCREENSHOT_METADATA_READ:    { screenshotMetadataOnly: true, imageCaptured: false },
  OBSERVATION_EVIDENCE_RECORD: { evidenceRecorded: true, localOnly: true },
};

// Fallback planned routes if no localStorage plan exists
const FALLBACK_PLANNED = [
  { routeId: 'PAGE_TITLE_READ',             action: 'Read page title' },
  { routeId: 'CURRENT_URL_READ',            action: 'Read current URL' },
  { routeId: 'PAGE_LOAD_STATUS_READ',       action: 'Detect page load status' },
  { routeId: 'SELECTOR_PRESENCE_READ',      action: 'Detect selector presence' },
  { routeId: 'VISIBLE_TEXT_READ',           action: 'Inspect visible text' },
  { routeId: 'DOM_SNAPSHOT_METADATA_READ',  action: 'Capture DOM snapshot metadata' },
  { routeId: 'SCREENSHOT_METADATA_READ',    action: 'Capture screenshot metadata only' },
  { routeId: 'OBSERVATION_EVIDENCE_RECORD', action: 'Record observation evidence' },
];

const FALLBACK_REVIEW = [
  { routeId: 'AUTHENTICATED_PAGE_STATE_OBSERVE',  action: 'Observe authenticated page state' },
  { routeId: 'FINANCIAL_DASHBOARD_OBSERVE',        action: 'Observe financial dashboard' },
  { routeId: 'BROKER_DASHBOARD_OBSERVE',           action: 'Observe broker dashboard' },
  { routeId: 'ACCOUNT_BALANCE_OBSERVE',            action: 'Observe account balances' },
  { routeId: 'TRANSACTION_HISTORY_OBSERVE',        action: 'Observe transaction history' },
  { routeId: 'CREDIT_PROFILE_DASHBOARD_OBSERVE',  action: 'Observe credit profile dashboard' },
  { routeId: 'BUSINESS_FORMATION_PORTAL_OBSERVE', action: 'Observe business formation portal status' },
];

const FALLBACK_BLOCKED = [
  { routeId: 'CLICK_ACTION',                       action: 'clicking' },
  { routeId: 'TYPE_ACTION',                        action: 'typing' },
  { routeId: 'FORM_SUBMISSION',                    action: 'form submission' },
  { routeId: 'CREDENTIAL_ENTRY',                   action: 'credential entry' },
  { routeId: 'PASSWORD_ENTRY',                     action: 'password entry' },
  { routeId: 'API_KEY_ENTRY',                      action: 'API key entry' },
  { routeId: 'FILE_UPLOAD',                        action: 'file upload' },
  { routeId: 'TRADE_ACTION',                       action: 'trading' },
  { routeId: 'BROKER_ACTION',                      action: 'broker actions' },
  { routeId: 'WALLET_ACTION',                      action: 'wallet actions' },
  { routeId: 'MONEY_MOVEMENT',                     action: 'money movement' },
  { routeId: 'COMMAND_DISPATCH',                   action: 'command dispatch' },
  { routeId: 'AUTONOMOUS_BROWSER_CONTROL',         action: 'autonomous browser control' },
  { routeId: 'CLOUDFLARE_OR_LOGIN_BYPASS',         action: 'bypassing Cloudflare/login walls' },
  { routeId: 'UNAUTHORIZED_PROTECTED_DATA_SCRAPE', action: 'scraping protected data without authorization' },
];

function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

const CLASS_CONFIG = {
  SIMULATED: { label: 'Simulated Read-Only', color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         icon: CheckCircle2, badge: 'text-primary border-primary/30 bg-primary/5' },
  REVIEW:    { label: 'Review Required',     color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: Clock,        badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  BLOCKED:   { label: 'Blocked',             color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,      badge: 'text-destructive border-destructive/30 bg-destructive/5' },
};

export default function BrowserObservationSimulationPanel() {
  const [simulation, setSimulation] = useState(() => loadJSON(SIMULATION_KEY));
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const routePlan = loadJSON(ROUTE_PLAN_KEY);
    const planPresent = !!routePlan;

    const plannedSource = routePlan?.plannedReadOnlyRoutes ?? FALLBACK_PLANNED;
    const reviewSource  = routePlan?.reviewRequiredRoutes  ?? FALLBACK_REVIEW;
    const blockedSource = routePlan?.blockedRoutes         ?? FALLBACK_BLOCKED;

    const simulatedReadOnlyRoutes = plannedSource.map(r => ({
      simulationId:              `SIM_${r.routeId}`,
      sourceRouteId:             r.routeId,
      action:                    r.action,
      classification:            'SIMULATED_READ_ONLY',
      simulated:                 true,
      realBrowserActionPerformed: false,
      backendCalled:             false,
      openClawCalled:            false,
      executionAllowed:          false,
      dispatchAllowed:           false,
      browserMutationAllowed:    false,
      simulatedResultShape:      RESULT_SHAPES[r.routeId] ?? {},
    }));

    const reviewRequiredSimulations = reviewSource.map(r => ({
      simulationId:          `SIM_REVIEW_${r.routeId}`,
      sourceRouteId:         r.routeId,
      action:                r.action,
      classification:        'REVIEW_REQUIRED',
      simulated:             false,
      requiresOperatorReview: true,
      executionAllowed:      false,
      dispatchAllowed:       false,
    }));

    const blockedSimulations = blockedSource.map(r => ({
      simulationId:     `SIM_BLOCKED_${r.routeId}`,
      sourceRouteId:    r.routeId,
      action:           r.action,
      classification:   'PROHIBITED',
      simulated:        false,
      blocked:          true,
      executionAllowed: false,
      dispatchAllowed:  false,
    }));

    const s = {
      simulationName:            SIMULATION_NAME,
      generatedAt:               new Date().toISOString(),
      sourceRoutePlanPresent:    planPresent,
      simulatedReadOnlyRoutes,
      reviewRequiredSimulations,
      blockedSimulations,
      simulationStatus:          SIMULATION_STATUS,
      safetyAssertions:          SAFETY_ASSERTIONS,
    };

    try { localStorage.setItem(SIMULATION_KEY, JSON.stringify(s, null, 2)); } catch {}
    setSimulation(s);
  };

  const handleCopy = () => {
    if (!simulation) return;
    navigator.clipboard.writeText(JSON.stringify(simulation, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(SIMULATION_KEY); } catch {}
    setSimulation(null);
  };

  const sections = simulation ? [
    { key: 'SIMULATED', items: simulation.simulatedReadOnlyRoutes,    count: simulation.simulatedReadOnlyRoutes.length },
    { key: 'REVIEW',    items: simulation.reviewRequiredSimulations,  count: simulation.reviewRequiredSimulations.length },
    { key: 'BLOCKED',   items: simulation.blockedSimulations,         count: simulation.blockedSimulations.length },
  ] : [
    { key: 'SIMULATED', items: FALLBACK_PLANNED,  count: FALLBACK_PLANNED.length },
    { key: 'REVIEW',    items: FALLBACK_REVIEW,   count: FALLBACK_REVIEW.length },
    { key: 'BLOCKED',   items: FALLBACK_BLOCKED,  count: FALLBACK_BLOCKED.length },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 15 · Browser Observation Simulation</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Browser Observation Simulation
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only simulation. No real browser actions. No browser automation APIs. No execution. No dispatch.</div>
      </div>

      {/* Simulation name chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">{SIMULATION_NAME}</span>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2">
        {sections.map(({ key, count }) => {
          const cfg = CLASS_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`border rounded-lg px-3 py-2.5 ${cfg.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${cfg.color} shrink-0`} />
                <span className={`text-[8px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className={`text-[18px] font-bold ${cfg.color}`}>{count}</div>
              <div className="text-[8px] text-slate-500">simulations</div>
            </div>
          );
        })}
      </div>

      {/* Simulated result shapes (read-only routes only) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-primary/5 border-b border-border flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[9px] uppercase tracking-widest font-semibold text-primary">Simulated Read-Only Routes</span>
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">{FALLBACK_PLANNED.length}</span>
        </div>
        <div className="divide-y divide-border/30">
          {FALLBACK_PLANNED.map(r => (
            <div key={r.routeId} className="px-4 py-2.5 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[9px] text-slate-300">{r.action}</span>
                <span className="ml-auto text-[7px] font-mono text-slate-500">{r.routeId}</span>
              </div>
              <div className="ml-5 px-2 py-1 bg-secondary/30 rounded text-[8px] font-mono text-slate-400">
                {JSON.stringify(RESULT_SHAPES[r.routeId] ?? {})}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Required */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-amber-500/5 border-b border-border flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[9px] uppercase tracking-widest font-semibold text-amber-500">Review Required — Not Simulated</span>
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded border text-amber-500 border-amber-500/30 bg-amber-500/5">{FALLBACK_REVIEW.length}</span>
        </div>
        <ul className="divide-y divide-border/30">
          {FALLBACK_REVIEW.map(r => (
            <li key={r.routeId} className="flex items-center gap-2.5 px-4 py-2">
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="text-[9px] text-slate-300">{r.action}</span>
              <span className="ml-auto text-[7px] font-mono text-slate-500">{r.routeId}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Blocked */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-destructive/5 border-b border-border flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-[9px] uppercase tracking-widest font-semibold text-destructive">Blocked — Not Simulated</span>
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">{FALLBACK_BLOCKED.length}</span>
        </div>
        <ul className="divide-y divide-border/30">
          {FALLBACK_BLOCKED.map(r => (
            <li key={r.routeId} className="flex items-center gap-2.5 px-4 py-2">
              <XCircle className="w-3 h-3 text-destructive shrink-0" />
              <span className="text-[9px] text-slate-300">{r.action}</span>
              <span className="ml-auto text-[7px] font-mono text-slate-500">{r.routeId}</span>
            </li>
          ))}
        </ul>
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
          <span className="font-bold">Simulation is local-only and non-executable.</span>{' '}
          No real browser actions are performed. No automation APIs used. No execution, dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Generate Browser Observation Simulation
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!simulation}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Simulation JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!simulation}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Simulation
        </button>
      </div>

      {/* JSON preview */}
      {simulation && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Simulation — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(simulation.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(simulation, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{SIMULATION_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No real browser actions. No execution. No dispatch.
      </div>
    </div>
  );
}