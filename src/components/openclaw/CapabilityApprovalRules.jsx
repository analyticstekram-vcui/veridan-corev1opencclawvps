/**
 * CapabilityApprovalRules
 * Local-only approval rule records derived from capability policy classifications.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, ShieldCheck, RefreshCw, Lock } from 'lucide-react';

const SOURCE_KEYS = {
  policyReports:     'openclawCapabilityPolicyMatrixReports',
  evidenceExports:   'openclawCapabilityEvidenceExports',
  capabilityReports: 'openclawCapabilityExplorerReports',
  handoffPackets:    'openclawOperatorHandoffPackets',
  auditTrail:        'openclawAuditTrail',
};
const RULES_KEY = 'openclawCapabilityApprovalRules';

const APPROVAL_MAP = {
  ALLOWED_READ_ONLY:          'AUTO_ALLOW_READ_ONLY',
  REVIEW_REQUIRED:            'REQUIRE_OPERATOR_REVIEW',
  BLOCKED_MUTATION:           'BLOCK',
  BLOCKED_EXECUTION:          'BLOCK',
  BLOCKED_TRADING:            'BLOCK',
  BLOCKED_CREDENTIAL:         'BLOCK',
  BLOCKED_MONEY_MOVEMENT:     'BLOCK',
  UNKNOWN_BLOCKED_BY_DEFAULT: 'BLOCK',
};

const POLICY_ACTION_MAP = {
  ALLOWED_READ_ONLY:          'PERMIT',
  REVIEW_REQUIRED:            'HOLD_FOR_REVIEW',
  BLOCKED_MUTATION:           'DENY — mutation operations not permitted',
  BLOCKED_EXECUTION:          'DENY — execution/dispatch not permitted',
  BLOCKED_TRADING:            'DENY — trading operations not permitted',
  BLOCKED_CREDENTIAL:         'DENY — credential/secret access not permitted',
  BLOCKED_MONEY_MOVEMENT:     'DENY — money movement not permitted',
  UNKNOWN_BLOCKED_BY_DEFAULT: 'DENY — unknown capabilities blocked by default',
};

const SAFETY_IMPACT_MAP = {
  ALLOWED_READ_ONLY:          'NONE',
  REVIEW_REQUIRED:            'LOW',
  BLOCKED_MUTATION:           'HIGH',
  BLOCKED_EXECUTION:          'CRITICAL',
  BLOCKED_TRADING:            'CRITICAL',
  BLOCKED_CREDENTIAL:         'CRITICAL',
  BLOCKED_MONEY_MOVEMENT:     'CRITICAL',
  UNKNOWN_BLOCKED_BY_DEFAULT: 'HIGH',
};

const REASON_MAP = {
  ALLOWED_READ_ONLY:          'Safe read-only capability — auto-permitted without approval',
  REVIEW_REQUIRED:            'Elevated scope — operator must review and approve before use',
  BLOCKED_MUTATION:           'Write/delete/mutate operations are not permitted in read-only mode',
  BLOCKED_EXECUTION:          'Execution and dispatch operations are locked and not permitted',
  BLOCKED_TRADING:            'Trading operations are disabled — no live or paper trading allowed',
  BLOCKED_CREDENTIAL:         'Credential and secret access is prohibited — zero-trust enforced',
  BLOCKED_MONEY_MOVEMENT:     'Money movement operations are prohibited — financial safety enforced',
  UNKNOWN_BLOCKED_BY_DEFAULT: 'Capability not in known safe set — blocked by default per zero-trust policy',
};

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveRules(record) {
  try {
    const all = loadJSON(RULES_KEY, []);
    const deduped = [record, ...all.filter(r => r.rulesId !== record.rulesId)];
    localStorage.setItem(RULES_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildRules() {
  // Pull rows from latest policy matrix report
  const policyReports = loadJSON(SOURCE_KEYS.policyReports, []);
  const latestPolicy  = policyReports[0] ?? null;
  let policyRows      = latestPolicy?.policyRows ?? [];

  // Fall back to capability explorer report
  if (!policyRows.length) {
    const capReports = loadJSON(SOURCE_KEYS.capabilityReports, []);
    policyRows = (capReports[0]?.capabilityRows ?? []).map(r => ({
      capability:     r.capability,
      classification: r.classification,
      source:         'capability_explorer',
      lastSeenAt:     capReports[0].createdAt,
    }));
  }

  // Fall back to evidence export
  if (!policyRows.length) {
    const evidence = loadJSON(SOURCE_KEYS.evidenceExports, []);
    policyRows = (evidence[0]?.capabilitySummary ?? []).map(r => ({
      capability:     r.capability,
      classification: r.classification,
      source:         'evidence_export',
      lastSeenAt:     evidence[0].createdAt,
    }));
  }

  const rules = policyRows.map((row, idx) => {
    const cls = row.classification ?? 'UNKNOWN_BLOCKED_BY_DEFAULT';
    return {
      ruleId:              `rule-${idx + 1}-${row.capability.toLowerCase()}`,
      createdAt:           new Date().toISOString(),
      capability:          row.capability,
      classification:      cls,
      allowed:             cls === 'ALLOWED_READ_ONLY',
      approvalRequirement: APPROVAL_MAP[cls]       ?? 'BLOCK',
      policyAction:        POLICY_ACTION_MAP[cls]  ?? 'DENY — unrecognised classification',
      reason:              REASON_MAP[cls]         ?? 'Unknown classification — denied by default',
      safetyImpact:        SAFETY_IMPACT_MAP[cls]  ?? 'HIGH',
    };
  });

  const autoAllowed    = rules.filter(r => r.approvalRequirement === 'AUTO_ALLOW_READ_ONLY').length;
  const reviewRequired = rules.filter(r => r.approvalRequirement === 'REQUIRE_OPERATOR_REVIEW').length;
  const blocked        = rules.filter(r => r.approvalRequirement === 'BLOCK' && r.classification !== 'UNKNOWN_BLOCKED_BY_DEFAULT').length;
  const unknownBlocked = rules.filter(r => r.classification === 'UNKNOWN_BLOCKED_BY_DEFAULT').length;

  const rulesId = 'car-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    rulesId,
    createdAt:          new Date().toISOString(),
    phase:              'CAPABILITY_APPROVAL_RULES',
    totalRules:         rules.length,
    autoAllowedReadOnly: autoAllowed,
    reviewRequired,
    blockedRules:       blocked,
    unknownBlocked,
    dispatchAllowed:    false,
    executionAttempted: false,
    openClawCalls:      0,
    networkCalls:       false,
    secretExposed:      false,
    rules,
    note: 'Local-only capability approval rules. No network calls. No OpenClaw calls. No dispatch. Unknown capabilities blocked by default.',
  };
}

// ── Style maps ────────────────────────────────────────────────────────────────
const APPROVAL_STYLE = {
  AUTO_ALLOW_READ_ONLY:     { color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',         icon: CheckCircle2,  short: 'AUTO_ALLOW' },
  REQUIRE_OPERATOR_REVIEW:  { color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',     icon: AlertTriangle, short: 'REVIEW' },
  BLOCK:                    { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCK' },
};

const IMPACT_COLOR = {
  NONE:     'text-primary',
  LOW:      'text-amber-400',
  HIGH:     'text-amber-500',
  CRITICAL: 'text-destructive font-bold',
};

const FILTERS = ['ALL', 'AUTO_ALLOW_READ_ONLY', 'REQUIRE_OPERATOR_REVIEW', 'BLOCKED'];

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
      {copied ? 'Copied!' : 'Copy Approval Rules JSON'}
    </button>
  );
}

export default function CapabilityApprovalRules({ refreshTrigger }) {
  const [record, setRecord] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const generate = useCallback(() => {
    const r = buildRules();
    saveRules(r);
    tryAppendAudit({
      event:              'capability_approval_rules_generated',
      rulesId:            r.rulesId,
      totalRules:         r.totalRules,
      autoAllowedReadOnly: r.autoAllowedReadOnly,
      blockedRules:       r.blockedRules,
      executionAttempted: false,
      openClawCalls:      0,
      networkCalls:       false,
      secretExposed:      false,
      note: `Capability approval rules generated (${r.rulesId}). ${r.totalRules} rules. No execution. No dispatch.`,
    });
    setRecord(r);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  const filtered = record ? record.rules.filter(r => {
    if (filter === 'AUTO_ALLOW_READ_ONLY')    return r.approvalRequirement === 'AUTO_ALLOW_READ_ONLY';
    if (filter === 'REQUIRE_OPERATOR_REVIEW') return r.approvalRequirement === 'REQUIRE_OPERATOR_REVIEW';
    if (filter === 'BLOCKED')                 return r.approvalRequirement === 'BLOCK';
    return true;
  }) : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Capability Approval Rules</div>
          <div className="text-[13px] font-bold text-foreground">Read-Only Capability Approval Rules</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Explicit approval rules derived from policy classifications. Unknown capabilities blocked by default.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — No network calls. No OpenClaw calls. No dispatch. No execution. Reads localStorage only.</span>
      </div>

      {record && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Total Rules',       value: record.totalRules,          color: 'text-foreground' },
              { label: 'Auto Allowed',      value: record.autoAllowedReadOnly, color: 'text-primary font-bold' },
              { label: 'Review Required',   value: record.reviewRequired,      color: record.reviewRequired > 0 ? 'text-amber-400' : 'text-slate-500' },
              { label: 'Blocked',           value: record.blockedRules,        color: record.blockedRules > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Unknown/Blocked',   value: record.unknownBlocked,      color: record.unknownBlocked > 0 ? 'text-slate-400' : 'text-slate-500' },
              { label: 'Dispatch Allowed',  value: String(record.dispatchAllowed),  color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',    value: String(record.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'OC Calls',          value: record.openClawCalls,       color: 'text-destructive font-bold' },
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
            <span className="ml-auto text-[8px] text-slate-500">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Rules table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Approval Rules — {record.rules.length} rules
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Rule ID', 'Capability', 'Classification', 'Approval', 'Policy Action', 'Reason', 'Safety Impact'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rule, i) => {
                    const style = APPROVAL_STYLE[rule.approvalRequirement] ?? APPROVAL_STYLE.BLOCK;
                    const Icon  = style.icon;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[7px]">{rule.ruleId}</td>
                        <td className="px-3 py-2 font-mono font-bold text-foreground whitespace-nowrap">{rule.capability}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`text-[7px] font-semibold ${style.color}`}>{rule.classification}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold flex items-center gap-1 w-fit ${style.bg} ${style.color}`}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            {style.short}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[160px] truncate">{rule.policyAction}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-[200px]">{rule.reason}</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-[7px] font-semibold ${IMPACT_COLOR[rule.safetyImpact] ?? 'text-slate-400'}`}>
                          {rule.safetyImpact}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rules ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="font-mono">{record.rulesId}</span>
            <span>{new Date(record.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={record} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Lock className="w-3 h-3" /> Generate Approval Rules
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Capability approval rules are local-only. No dispatch. No execution. No OpenClaw calls.
      </div>
    </div>
  );
}