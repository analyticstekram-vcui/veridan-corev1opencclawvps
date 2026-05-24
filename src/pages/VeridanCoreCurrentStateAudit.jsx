/**
 * Veridan Core Current State Audit
 * Plain-English inventory of what exists, what's real, what's preview, what's disabled.
 * READ-ONLY audit page — no execution, no writes, no changes.
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';

// ── System & Module Definitions ──────────────────────────────────────────────

const SYSTEM_STATE = {
  mode: 'GOVERNANCE_PREVIEW_ONLY',
  executionEnabled: false,
  activationAllowed: false,
  dispatchAllowed: false,
  tokenExposure: 'BACKEND_SERVER_SIDE_ONLY',
  lastAuditDate: new Date().toISOString().split('T')[0],
};

const MODULES = [
  // ── Primary Operator Pages ──────────────────────────────────────────
  {
    moduleName: 'Wake Control Center',
    route: '/wake-control-center',
    purpose: 'Primary operator wake readiness flow — self-check, approval gate, controlled review preparation',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Generates readiness evidence records. Auto-sets REVIEW_READY if all safety checks pass.',
  },
  {
    moduleName: 'Controlled Wake Activation Review',
    route: '/controlled-wake-activation-review',
    purpose: 'Controlled review layer — loads readiness evidence, generates sign-off packets, sends notification-only POST to /hooks/wake',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Implements 4-card UI (Status, Notify, Task, Activity). Advanced tab for detailed review. Token stays server-side.',
  },
  {
    moduleName: 'OpenClaw Control Center',
    route: '/openclaw-control',
    purpose: 'Main OpenClaw task queue and monitoring — read-only operator dashboard',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Displays tasks from localStorage. No write, no execution, no dispatch.',
  },

  // ── Obsidian Vault Module ────────────────────────────────────────────
  {
    moduleName: 'Obsidian Workbench',
    route: '/obsidian-workbench-preview',
    purpose: 'Obsidian vault planning — proposes folder structures, SOPs, task queues without touching filesystem',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Preview-only. Saves plans to localStorage. No VPS bridge called.',
  },
  {
    moduleName: 'Obsidian Draft Review',
    route: '/obsidian-draft-review',
    purpose: 'Review markdown drafts from OpenClaw task bridge — approve/reject before any future vault write',
    status: 'ACTIVE',
    storage: 'localStorage (approved drafts)',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Reads OBSIDIAN_DRAFT_NOTE records. Stores approvals locally. No write executed.',
  },

  // ── OpenClaw Developer/Preview Pages ────────────────────────────────────
  {
    moduleName: 'Wake Backend Dry-Run',
    route: '/wake-backend-dry-run',
    purpose: '[DEV] Simulate backend wake-call sequences, generate dry-run evidence records',
    status: 'DEV_ONLY',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Preview-only simulation. No network request. No token read.',
  },
  {
    moduleName: 'Wake Activation Readiness Gate',
    route: '/wake-activation-readiness',
    purpose: '[DEV] Validate dry-run evidence, readiness checklist, operator approval gate',
    status: 'DEV_ONLY',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: '10-stage pipeline. Computes readiness decision. Locked NOT_ACTIVATED.',
  },
  {
    moduleName: 'Wake Dispatch Preview',
    route: '/wake-dispatch-preview',
    purpose: '[DEV] Preview wake notification gate — shows what would be sent without sending',
    status: 'DEV_ONLY',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Preview-only. No actual POST to /hooks/wake.',
  },
  {
    moduleName: 'OpenClaw Read-Only Command Center',
    route: '/openclaw-readonly-command-center',
    purpose: '[DEV] Read-only gateway monitoring, task preview, health probes',
    status: 'DEV_ONLY',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'GET-only access. No execution privileges. Simulated health checks.',
  },
  {
    moduleName: 'OpenClaw Monitoring',
    route: '/openclaw-monitoring',
    purpose: '[DEV] Gateway health checks, read-only diagnostics',
    status: 'DEV_ONLY',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'GET-only mode. No execution.',
  },

  // ── Trading & Finance Modules ──────────────────────────────────────────
  {
    moduleName: 'Trading Command Center',
    route: '/trading-command-center',
    purpose: 'Trading operations planning — paper-only readiness, risk rules, strategy registry',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Paper environment only. No live broker action. No credential exposure.',
  },
  {
    moduleName: 'TradingView MCP Bridge',
    route: '/tradingview-mcp-bridge',
    purpose: '[DEV] Preview TradingView MCP relay — chart commands, signal proposals',
    status: 'DEV_ONLY',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Preview relay path. No actual chart automation.',
  },

  // ── Credit & Business Modules ──────────────────────────────────────────
  {
    moduleName: 'Public Credit Command Center',
    route: '/public-credit-command-center',
    purpose: 'Credit profile planning — bureau monitoring, dispute tracking, credit goals',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Planning-only. No live bureau submissions.',
  },
  {
    moduleName: 'Business Formation Command Center',
    route: '/business-formation-command-center',
    purpose: 'Business entity planning — LLC structure, registered agent workflow, EIN readiness',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Planning-only. No live entity formation.',
  },

  // ── Audit & Governance Pages ───────────────────────────────────────────
  {
    moduleName: 'Audit / Evidence Dashboard',
    route: '/audit-evidence',
    purpose: 'Evidence vault — view dry-run records, proposal history, safety compliance',
    status: 'ACTIVE',
    storage: 'localStorage',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Read-only. Aggregates evidence from all modules.',
  },
  {
    moduleName: 'System Map',
    route: '/system-map',
    purpose: 'Visual diagram of Veridan Core architecture, module relationships, data flow',
    status: 'ACTIVE',
    storage: 'none',
    canExecute: false,
    touchesOpenClaw: false,
    touchesFilesystem: false,
    touchesBroker: false,
    touchesSecrets: false,
    notes: 'Read-only visual reference.',
  },
];

// ── Safety Claims ────────────────────────────────────────────────────────────

const SAFETY_CLAIMS = [
  { claim: 'No live execution of any OpenClaw commands', pass: true, evidence: 'All routes locked executionStatus: NOT_EXECUTED' },
  { claim: 'No broker trading actions possible', pass: true, evidence: 'Paper environment only, no live credentials exposed' },
  { claim: 'No money movement or transfers', pass: true, evidence: 'No payment/settlement routes enabled' },
  { claim: 'No filesystem writes (vault is preview-only)', pass: true, evidence: 'No VPS bridge active, Obsidian module is planning-only' },
  { claim: 'No browser automation', pass: true, evidence: 'Browser control disabled, read-only mode only' },
  { claim: 'No /hooks/agent endpoint calls', pass: true, evidence: 'Agent endpoint explicitly PROHIBITED' },
  { claim: 'Token never exposed in frontend', pass: true, evidence: 'Token stays server-side in backend functions, never sent to client' },
  { claim: 'No automatic dispatch to OpenClaw', pass: true, evidence: 'dispatchStatus locked NOT_DISPATCHED everywhere' },
  { claim: 'All state persists in localStorage only', pass: true, evidence: 'No database writes for operational state' },
  { claim: 'All critical features are preview/planning only', pass: true, evidence: 'Wake, Obsidian, Trading, Credit are planning stages' },
];

// ── Operator Summary ─────────────────────────────────────────────────────────

const OPERATOR_SUMMARY = {
  canDoToday: [
    'Plan and design Obsidian vault structures',
    'Build trading and credit profile strategies',
    'Review and approve draft records in preview mode',
    'Generate readiness evidence for wake activation (no actual activation)',
    'Monitor OpenClaw task queue and status',
    'Review all audit evidence and compliance records',
    'Plan business formation workflows',
  ],
  cannotDoYet: [
    'Execute any OpenClaw commands against live systems',
    'Write files to Obsidian vault (filesystem disabled)',
    'Place trades on any broker',
    'Submit credit disputes to bureaus',
    'Form business entities',
    'Send actual wake notifications to OpenClaw',
    'Execute any broker or payment operations',
  ],
  requiresFutureApproval: [
    'Enable /hooks/wake notification dispatch (requires full governance review)',
    'Activate browser automation (requires operator certification)',
    'Enable Obsidian vault filesystem writes (requires audit lock)',
    'Connect live broker credentials (requires security review)',
    'Enable automated execution workflows (requires multi-sig approval)',
  ],
};

// ── UI Components ────────────────────────────────────────────────────────────

function SafetyCheckRow({ claim, pass, evidence }) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-border/20 text-[8px] font-mono">
      {pass
        ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className={`font-bold ${pass ? 'text-slate-200' : 'text-destructive'}`}>{claim}</div>
        <div className="text-slate-500 mt-0.5">{evidence}</div>
      </div>
      <span className={`shrink-0 font-bold ml-2 ${pass ? 'text-primary' : 'text-destructive'}`}>{pass ? 'PASS' : 'FAIL'}</span>
    </div>
  );
}

function ModuleCard({ module }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = {
    ACTIVE: 'bg-primary/10 text-primary border-primary/30',
    PREVIEW_ONLY: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    DEV_ONLY: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    DISABLED: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  
  return (
    <div className="border border-border/40 rounded-sm bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0 text-left">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold text-slate-200">{module.moduleName}</div>
            <div className="text-[7px] text-slate-500 font-mono mt-1">{module.route}</div>
          </div>
          <span className={`px-2 py-1 text-[7px] font-bold uppercase rounded-sm border whitespace-nowrap ${statusColors[module.status]}`}>
            {module.status}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border/20 bg-secondary/5 px-4 py-3 space-y-2 text-[8px]">
          <div className="text-slate-400 leading-relaxed">{module.purpose}</div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="text-slate-500">storage: <span className="text-slate-300 font-mono">{module.storage}</span></div>
            <div className="text-slate-500">execute: <span className={module.canExecute ? 'text-destructive font-bold' : 'text-slate-300'}>
              {module.canExecute ? 'YES' : 'NO'}
            </span></div>
            <div className="text-slate-500">openClaw: <span className={module.touchesOpenClaw ? 'text-destructive font-bold' : 'text-slate-300'}>
              {module.touchesOpenClaw ? 'YES' : 'NO'}
            </span></div>
            <div className="text-slate-500">filesystem: <span className={module.touchesFilesystem ? 'text-destructive font-bold' : 'text-slate-300'}>
              {module.touchesFilesystem ? 'YES' : 'NO'}
            </span></div>
            <div className="text-slate-500">broker: <span className={module.touchesBroker ? 'text-destructive font-bold' : 'text-slate-300'}>
              {module.touchesBroker ? 'YES' : 'NO'}
            </span></div>
            <div className="text-slate-500">secrets: <span className={module.touchesSecrets ? 'text-destructive font-bold' : 'text-slate-300'}>
              {module.touchesSecrets ? 'YES' : 'NO'}
            </span></div>
          </div>
          {module.notes && (
            <div className="pt-2 text-slate-400 italic border-t border-border/20">
              {module.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VeridanCoreCurrentStateAudit() {
  const [activeTab, setActiveTab] = useState('system');
  
  const systemClaims = SAFETY_CLAIMS.filter(c => c.pass).length;
  const failedClaims = SAFETY_CLAIMS.filter(c => !c.pass).length;

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Audit & Compliance
            </div>
            <h1 className="text-lg font-bold text-foreground">Current State Audit</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Plain-English inventory of what exists, what's real, what's preview, what's disabled
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[8px] text-slate-500 mb-2">audit date</div>
            <div className="text-[10px] font-bold text-slate-300">{SYSTEM_STATE.lastAuditDate}</div>
          </div>
        </div>
      </div>

      {/* System Mode Banner */}
      <div className="border-b border-primary/30 bg-primary/5 px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Shield className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <div className="text-[9px] font-bold uppercase text-primary tracking-wide">System Mode</div>
            <div className="text-[8px] text-slate-400 mt-0.5">{SYSTEM_STATE.mode} · Execution Disabled · All Routes Locked</div>
          </div>
          <div className="text-[8px] font-mono">
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive font-bold rounded-sm">ACTIVATION: NOT_ACTIVATED</span>
            <span className="ml-2 px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive font-bold rounded-sm">EXECUTION: NOT_EXECUTED</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex">
          {[
            { id: 'system', label: 'System Mode' },
            { id: 'modules', label: 'Module Inventory' },
            { id: 'safety', label: 'Safety Claims' },
            { id: 'summary', label: 'Operator Summary' },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">

        {/* ── System Mode Tab ── */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="bg-card border border-border/40 rounded-sm p-5 space-y-3">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">Current System Configuration</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[8px] font-mono">
                <div className="border border-border/20 rounded-sm p-3">
                  <div className="text-slate-500">System Mode</div>
                  <div className="text-primary font-bold mt-1">{SYSTEM_STATE.mode}</div>
                </div>
                <div className="border border-border/20 rounded-sm p-3">
                  <div className="text-slate-500">Execution Status</div>
                  <div className="text-destructive font-bold mt-1">DISABLED</div>
                </div>
                <div className="border border-border/20 rounded-sm p-3">
                  <div className="text-slate-500">Activation Allowed</div>
                  <div className="text-destructive font-bold mt-1">FALSE</div>
                </div>
                <div className="border border-border/20 rounded-sm p-3">
                  <div className="text-slate-500">Dispatch Allowed</div>
                  <div className="text-destructive font-bold mt-1">FALSE</div>
                </div>
                <div className="border border-border/20 rounded-sm p-3 md:col-span-2">
                  <div className="text-slate-500">Token Storage</div>
                  <div className="text-primary font-bold mt-1">{SYSTEM_STATE.tokenExposure}</div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-amber-500/30 rounded-sm p-5">
              <div className="text-[9px] font-bold uppercase text-amber-500 mb-2">Operational Constraints</div>
              <div className="text-[8px] text-amber-400/80 leading-relaxed space-y-1">
                <p>This system is locked in governance preview mode. All critical operations are either disabled or require future approval gates.</p>
                <p>No live execution has ever been performed. All state persists in browser localStorage only.</p>
                <p>Operator workflows focus on planning, validation, and evidence generation — not actual execution.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Module Inventory Tab ── */}
        {activeTab === 'modules' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono mb-3">
              Total Modules: {MODULES.length} · Active: {MODULES.filter(m => m.status === 'ACTIVE').length} · Dev: {MODULES.filter(m => m.status === 'DEV_ONLY').length}
            </div>
            <div className="space-y-3">
              {MODULES.map((mod, i) => <ModuleCard key={i} module={mod} />)}
            </div>
          </div>
        )}

        {/* ── Safety Claims Tab ── */}
        {activeTab === 'safety' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-[8px] font-bold text-primary">{systemClaims} PASS</span>
              </div>
              {failedClaims > 0 && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-[8px] font-bold text-destructive">{failedClaims} FAIL</span>
                </div>
              )}
            </div>
            <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
              <div className="divide-y divide-border/20">
                {SAFETY_CLAIMS.map((sc, i) => <SafetyCheckRow key={i} {...sc} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── Operator Summary Tab ── */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Can Do Today */}
            <div className="bg-card border border-primary/30 rounded-sm p-5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div className="text-[9px] font-bold uppercase text-primary">What System Can Do Today</div>
              </div>
              <ul className="space-y-1.5 text-[8px] text-slate-300">
                {OPERATOR_SUMMARY.canDoToday.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cannot Do Yet */}
            <div className="bg-card border border-destructive/30 rounded-sm p-5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-destructive" />
                <div className="text-[9px] font-bold uppercase text-destructive">What System Cannot Do Yet</div>
              </div>
              <ul className="space-y-1.5 text-[8px] text-slate-300">
                {OPERATOR_SUMMARY.cannotDoYet.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-destructive font-bold mt-0.5">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requires Future Approval */}
            <div className="bg-card border border-amber-500/30 rounded-sm p-5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <div className="text-[9px] font-bold uppercase text-amber-500">Requires Future Approval Before Enabling</div>
              </div>
              <ul className="space-y-1.5 text-[8px] text-slate-300">
                {OPERATOR_SUMMARY.requiresFutureApproval.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Statement */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-sm p-5">
              <div className="text-[8px] text-slate-300 leading-relaxed space-y-2">
                <p className="font-bold text-slate-100">Audit Summary</p>
                <p>Veridan Core is in governance preview mode. The system accurately reflects what can and cannot be done today. All critical operations are intentionally disabled or locked in preview-only mode. Future activation requires formal approval, security review, and governance sign-off.</p>
                <p className="text-amber-400/80">No changes should be made to this system's safety constraints without explicit audit review and operator certification.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}