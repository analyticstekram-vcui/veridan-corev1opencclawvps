/**
 * BrowserObservationApprovalRulesPanel — Local-only Approval Rules
 * Translates policy matrix into explicit approval behavior.
 * Does NOT enable browser automation.
 * No backend calls, no OpenClaw calls, no fetch, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { CheckSquare, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Clock, XCircle } from 'lucide-react';

const MATRIX_KEY = 'openclawBrowserObservationPolicyMatrix';
const RULES_KEY  = 'openclawBrowserObservationApprovalRules';
const RULES_NAME = 'OPENCLAW_BROWSER_OBSERVATION_APPROVAL_RULES';
const APPROVAL_STATUS = 'LOCAL_ONLY_APPROVAL_RULES_READY';

const AUTO_APPROVED_RULES = [
  'Read page title',
  'Read current URL',
  'Detect page load status',
  'Detect selector presence',
  'Inspect visible text',
  'Capture DOM snapshot metadata',
  'Capture screenshot metadata only',
  'Record observation evidence',
];

const OPERATOR_REVIEW_RULES = [
  'Observe authenticated page state',
  'Observe financial dashboard',
  'Observe broker dashboard',
  'Observe account balances',
  'Observe transaction history',
  'Observe credit profile dashboard',
  'Observe business formation portal status',
];

const PROHIBITED_RULES = [
  'clicking',
  'typing',
  'form submission',
  'credential entry',
  'password entry',
  'API key entry',
  'file upload',
  'trading',
  'broker actions',
  'wallet actions',
  'money movement',
  'command dispatch',
  'autonomous browser control',
  'bypassing Cloudflare/login walls',
  'scraping protected data without authorization',
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

function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

const APPROVAL_CONFIG = {
  AUTO_APPROVED:     { label: 'Auto-Approved',      color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',     icon: CheckCircle2, badge: 'text-primary border-primary/30 bg-primary/5' },
  OPERATOR_REVIEW:   { label: 'Operator Review',    color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20', icon: Clock,        badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  PROHIBITED:        { label: 'Prohibited',         color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle,   badge: 'text-destructive border-destructive/30 bg-destructive/5' },
};

export default function BrowserObservationApprovalRulesPanel() {
  const [rules, setRules] = useState(() => loadJSON(RULES_KEY));
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const matrixPresent = !!localStorage.getItem(MATRIX_KEY);
    const r = {
      rulesName:                  RULES_NAME,
      generatedAt:                new Date().toISOString(),
      sourcePolicyMatrixPresent:  matrixPresent,
      autoApprovedRules:          AUTO_APPROVED_RULES,
      operatorReviewRules:        OPERATOR_REVIEW_RULES,
      prohibitedRules:            PROHIBITED_RULES,
      approvalStatus:             APPROVAL_STATUS,
      safetyAssertions:           SAFETY_ASSERTIONS,
    };
    try { localStorage.setItem(RULES_KEY, JSON.stringify(r, null, 2)); } catch {}
    setRules(r);
  };

  const handleCopy = () => {
    if (!rules) return;
    navigator.clipboard.writeText(JSON.stringify(rules, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(RULES_KEY); } catch {}
    setRules(null);
  };

  const sections = [
    { key: 'AUTO_APPROVED',   rules: AUTO_APPROVED_RULES },
    { key: 'OPERATOR_REVIEW', rules: OPERATOR_REVIEW_RULES },
    { key: 'PROHIBITED',      rules: PROHIBITED_RULES },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 15 · Browser Observation Approval Rules</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" /> Browser Observation Approval Rules
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only approval rules. Does not enable browser automation, execution, or dispatch.</div>
      </div>

      {/* Rules name chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">{RULES_NAME}</span>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2">
        {sections.map(({ key, rules: rulesList }) => {
          const cfg = APPROVAL_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`border rounded-lg px-3 py-2.5 ${cfg.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${cfg.color} shrink-0`} />
                <span className={`text-[8px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className={`text-[18px] font-bold ${cfg.color}`}>{rulesList.length}</div>
              <div className="text-[8px] text-slate-500">rules</div>
            </div>
          );
        })}
      </div>

      {/* Approval rules table */}
      {sections.map(({ key, rules: rulesList }) => {
        const cfg = APPROVAL_CONFIG[key];
        const Icon = cfg.icon;
        return (
          <div key={key} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${cfg.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
              <span className={`text-[9px] uppercase tracking-widest font-semibold ${cfg.color}`}>{cfg.label}</span>
              <span className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded border ${cfg.badge}`}>{rulesList.length}</span>
            </div>
            <ul className="divide-y divide-border/30">
              {rulesList.map((rule) => (
                <li key={rule} className="flex items-center gap-2.5 px-4 py-2">
                  <Icon className={`w-3 h-3 ${cfg.color} shrink-0`} />
                  <span className="text-[9px] text-slate-300">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

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
          <span className="font-bold">Approval rules are local-only.</span>{' '}
          Does not enable browser automation, execution, dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Generate Browser Observation Approval Rules
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!rules}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Approval Rules JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!rules}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Approval Rules
        </button>
      </div>

      {/* JSON preview */}
      {rules && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Approval Rules — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(rules.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(rules, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{RULES_KEY}</span></span>
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