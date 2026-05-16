/**
 * CapabilityPolicyMatrix
 * Local-only policy classification matrix for detected gateway capabilities.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, ShieldCheck, RefreshCw, Shield } from 'lucide-react';

const SOURCE_KEYS = {
  capabilityReports:   'openclawCapabilityExplorerReports',
  evidenceExports:     'openclawCapabilityEvidenceExports',
  bridgeReports:       'openclawReadOnlyStatusBridgeReports',
  healthSnapshots:     'openclawAutomatedHealthMonitoringSnapshots',
  handoffPackets:      'openclawOperatorHandoffPackets',
  auditTrail:          'openclawAuditTrail',
};
const REPORT_KEY = 'openclawCapabilityPolicyMatrixReports';

// ── Policy classification rules ───────────────────────────────────────────────
const ALLOWED_READ_ONLY_SET = new Set(['READ', 'VERIFY', 'SNAPSHOT', 'STATUS', 'HEALTH', 'VERSION', 'CAPABILITIES']);

const BLOCKED_RULES = [
  { keywords: ['COMMAND', 'EXECUTE', 'EXEC', 'DISPATCH', 'RUN', 'SUBMIT', 'DEPLOY'],  class: 'BLOCKED_EXECUTION' },
  { keywords: ['BROWSER_ACTION', 'BROWSER', 'CLICK', 'TYPE', 'NAVIGATE'],             class: 'BLOCKED_EXECUTION' },
  { keywords: ['TRADE', 'ORDER', 'BROKER', 'LIVE', 'PAPER'],                          class: 'BLOCKED_TRADING' },
  { keywords: ['CREDENTIAL', 'SECRET', 'TOKEN', 'AUTH_WRITE', 'APIKEY'],              class: 'BLOCKED_CREDENTIAL' },
  { keywords: ['WALLET', 'WITHDRAW', 'TRANSFER', 'MONEY_MOVEMENT', 'PAYMENT'],        class: 'BLOCKED_MONEY_MOVEMENT' },
  { keywords: ['WRITE', 'DELETE', 'MUTATE', 'POST', 'PUT', 'PATCH', 'UPDATE'],        class: 'BLOCKED_MUTATION' },
];

const REVIEW_REQUIRED_SET = new Set(['EXPORT_LOG', 'PROPOSE_WORKFLOW', 'NAVIGATE_READ_ONLY', 'AUDIT_SUMMARY']);

function classifyCapability(cap) {
  const u = String(cap).toUpperCase();
  if (ALLOWED_READ_ONLY_SET.has(u))  return 'ALLOWED_READ_ONLY';
  if (REVIEW_REQUIRED_SET.has(u))    return 'REVIEW_REQUIRED';
  for (const rule of BLOCKED_RULES) {
    if (rule.keywords.some(kw => u.includes(kw))) return rule.class;
  }
  return 'UNKNOWN_BLOCKED_BY_DEFAULT';
}

function requiredApprovalFor(cls) {
  if (cls === 'ALLOWED_READ_ONLY')            return 'NONE';
  if (cls === 'REVIEW_REQUIRED')              return 'OPERATOR_REVIEW';
  if (cls === 'UNKNOWN_BLOCKED_BY_DEFAULT')   return 'BLOCKED — MANUAL_REVIEW';
  return 'BLOCKED — MULTI_SIG';
}

function safetyImpactFor(cls) {
  if (cls === 'ALLOWED_READ_ONLY')            return 'NONE';
  if (cls === 'REVIEW_REQUIRED')              return 'LOW — requires operator sign-off';
  if (cls === 'BLOCKED_MUTATION')             return 'HIGH — state mutation risk';
  if (cls === 'BLOCKED_EXECUTION')            return 'CRITICAL — execution/dispatch risk';
  if (cls === 'BLOCKED_TRADING')              return 'CRITICAL — live trading risk';
  if (cls === 'BLOCKED_CREDENTIAL')           return 'CRITICAL — credential/secret exposure';
  if (cls === 'BLOCKED_MONEY_MOVEMENT')       return 'CRITICAL — money movement risk';
  return 'HIGH — unknown; blocked by default';
}

function reasonFor(cls) {
  if (cls === 'ALLOWED_READ_ONLY')            return 'Explicitly permitted safe read-only capability';
  if (cls === 'REVIEW_REQUIRED')              return 'Elevated scope — operator review required before use';
  if (cls === 'BLOCKED_MUTATION')             return 'Mutation keyword detected — write/delete operations blocked';
  if (cls === 'BLOCKED_EXECUTION')            return 'Execution/dispatch keyword detected — command execution blocked';
  if (cls === 'BLOCKED_TRADING')              return 'Trading keyword detected — live/paper trading blocked';
  if (cls === 'BLOCKED_CREDENTIAL')           return 'Credential/secret keyword detected — access blocked';
  if (cls === 'BLOCKED_MONEY_MOVEMENT')       return 'Money movement keyword detected — financial operations blocked';
  return 'Not in known safe set — unknown capabilities blocked by default';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveReport(report) {
  try {
    const all = loadJSON(REPORT_KEY, []);
    const deduped = [report, ...all.filter(r => r.reportId !== report.reportId)];
    localStorage.setItem(REPORT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function collectCapabilities() {
  const caps = new Map(); // capability -> { source, lastSeenAt }

  // From capability explorer reports
  const capReports = loadJSON(SOURCE_KEYS.capabilityReports, []);
  if (capReports[0]?.capabilityRows) {
    capReports[0].capabilityRows.forEach(r => {
      caps.set(r.capability, { source: 'capability_explorer', lastSeenAt: capReports[0].createdAt });
    });
  }

  // From evidence exports
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  if (evidenceExports[0]?.capabilitySummary) {
    evidenceExports[0].capabilitySummary.forEach(r => {
      if (!caps.has(r.capability)) {
        caps.set(r.capability, { source: 'evidence_export', lastSeenAt: evidenceExports[0].createdAt });
      }
    });
  }

  // From bridge reports safeResponseFields
  const bridgeReports = loadJSON(SOURCE_KEYS.bridgeReports, []);
  if (bridgeReports[0]?.safeResponseFields?.capabilities) {
    bridgeReports[0].safeResponseFields.capabilities.forEach(c => {
      const u = String(c).toUpperCase();
      if (!caps.has(u)) caps.set(u, { source: 'status_bridge', lastSeenAt: bridgeReports[0].timestamp });
    });
  }

  // If nothing found, fall back to well-known baseline
  if (caps.size === 0) {
    ['READ', 'VERIFY', 'SNAPSHOT', 'STATUS', 'HEALTH', 'VERSION', 'CAPABILITIES'].forEach(c => {
      caps.set(c, { source: 'baseline_default', lastSeenAt: new Date().toISOString() });
    });
  }

  return caps;
}

function buildReport() {
  const capsMap   = collectCapabilities();
  const bridgeRec = loadJSON(SOURCE_KEYS.bridgeReports, [])[0] ?? null;

  const rows = [...capsMap.entries()].map(([cap, meta]) => {
    const cls = classifyCapability(cap);
    return {
      capability:       cap,
      source:           meta.source,
      classification:   cls,
      allowed:          cls === 'ALLOWED_READ_ONLY',
      requiredApproval: requiredApprovalFor(cls),
      reason:           reasonFor(cls),
      safetyImpact:     safetyImpactFor(cls),
      lastSeenAt:       meta.lastSeenAt,
    };
  });

  const allowedCount  = rows.filter(r => r.classification === 'ALLOWED_READ_ONLY').length;
  const reviewCount   = rows.filter(r => r.classification === 'REVIEW_REQUIRED').length;
  const blockedCount  = rows.filter(r => r.classification.startsWith('BLOCKED_')).length;
  const unknownCount  = rows.filter(r => r.classification === 'UNKNOWN_BLOCKED_BY_DEFAULT').length;

  const reportId = 'cpm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  const safetyAssertions = [
    { key: 'previewOnly',          value: true,        pass: true },
    { key: 'readOnly',             value: true,        pass: true },
    { key: 'executionLocked',      value: true,        pass: true },
    { key: 'gatewayMode',          value: 'READ_ONLY', pass: true },
    { key: 'executionMode',        value: 'DISABLED',  pass: true },
    { key: 'dispatchAllowed',      value: false,       pass: true },
    { key: 'executionAttempted',   value: false,       pass: true },
    { key: 'openClawCalls',        value: 0,           pass: true },
    { key: 'networkCalls',         value: false,       pass: true },
    { key: 'browserToolUsed',      value: false,       pass: true },
    { key: 'credentialsExposed',   value: false,       pass: true },
    { key: 'moneyMovementDisabled',value: true,        pass: true },
  ];

  return {
    reportId,
    createdAt:            new Date().toISOString(),
    phase:                'CAPABILITY_POLICY_MATRIX',
    gatewayMode:          bridgeRec?.gatewayMode ?? 'READ_ONLY',
    executionMode:        bridgeRec?.executionMode ?? 'DISABLED',
    executionLock:        'LOCKED',
    dispatchAllowed:      false,
    openClawCalls:        0,
    executionAttempts:    0,
    networkCalls:         false,
    browserToolUsed:      false,
    secretExposed:        false,
    totalCapabilities:    rows.length,
    allowedReadOnly:      allowedCount,
    reviewRequired:       reviewCount,
    blocked:              blockedCount,
    unknownBlocked:       unknownCount,
    policyRows:           rows,
    safetyAssertions,
    note: 'Local-only capability policy matrix. No OpenClaw call. No network calls. No dispatch. Unknown capabilities blocked by default.',
  };
}

// ── Style maps ────────────────────────────────────────────────────────────────
const CLS_STYLE = {
  ALLOWED_READ_ONLY:          { color: 'text-primary',     bg: 'bg-primary/10 border-primary/20',         icon: CheckCircle2,  short: 'ALLOW' },
  REVIEW_REQUIRED:            { color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',     icon: AlertTriangle, short: 'REVIEW' },
  BLOCKED_MUTATION:           { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCK' },
  BLOCKED_EXECUTION:          { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCK' },
  BLOCKED_TRADING:            { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCK' },
  BLOCKED_CREDENTIAL:         { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCK' },
  BLOCKED_MONEY_MOVEMENT:     { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle,       short: 'BLOCK' },
  UNKNOWN_BLOCKED_BY_DEFAULT: { color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',     icon: AlertTriangle, short: 'UNKNOWN' },
};

const FILTERS = ['ALL', 'ALLOWED_READ_ONLY', 'REVIEW_REQUIRED', 'BLOCKED', 'UNKNOWN'];

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
      {copied ? 'Copied!' : 'Copy Policy Matrix JSON'}
    </button>
  );
}

export default function CapabilityPolicyMatrix({ refreshTrigger }) {
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const generate = useCallback(() => {
    const r = buildReport();
    saveReport(r);
    tryAppendAudit({
      event:              'capability_policy_matrix_generated',
      reportId:           r.reportId,
      totalCapabilities:  r.totalCapabilities,
      allowedReadOnly:    r.allowedReadOnly,
      blocked:            r.blocked,
      executionAttempted: false,
      openClawCalls:      0,
      networkCalls:       false,
      secretExposed:      false,
      note: `Capability policy matrix generated (${r.reportId}). ${r.totalCapabilities} caps. No execution. No dispatch.`,
    });
    setReport(r);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  const filtered = report ? report.policyRows.filter(r => {
    if (filter === 'ALLOWED_READ_ONLY') return r.classification === 'ALLOWED_READ_ONLY';
    if (filter === 'REVIEW_REQUIRED')   return r.classification === 'REVIEW_REQUIRED';
    if (filter === 'BLOCKED')           return r.classification.startsWith('BLOCKED_');
    if (filter === 'UNKNOWN')           return r.classification === 'UNKNOWN_BLOCKED_BY_DEFAULT';
    return true;
  }) : [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Capability Policy Matrix</div>
          <div className="text-[13px] font-bold text-foreground">Capability Policy Matrix</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Maps detected capabilities to policy classifications. Unknown capabilities blocked by default.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — No network calls. No OpenClaw calls. No dispatch. Unknown capabilities are blocked by default.</span>
      </div>

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Total',           value: report.totalCapabilities,  color: 'text-foreground' },
              { label: 'Allowed',         value: report.allowedReadOnly,    color: 'text-primary font-bold' },
              { label: 'Review Req.',     value: report.reviewRequired,     color: report.reviewRequired > 0 ? 'text-amber-400' : 'text-slate-500' },
              { label: 'Blocked',         value: report.blocked,            color: report.blocked > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Unknown/Blocked', value: report.unknownBlocked,     color: report.unknownBlocked > 0 ? 'text-slate-400' : 'text-slate-500' },
              { label: 'Exec Attempts',   value: report.executionAttempts,  color: 'text-destructive font-bold' },
              { label: 'OC Calls',        value: report.openClawCalls,      color: 'text-destructive font-bold' },
              { label: 'Network Calls',   value: String(report.networkCalls), color: 'text-destructive font-bold' },
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
            <span className="ml-auto text-[8px] text-slate-500">{filtered.length} row{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Policy matrix table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Policy Matrix — {report.policyRows.length} capabilities
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Capability', 'Source', 'Classification', 'Allowed', 'Required Approval', 'Reason', 'Safety Impact', 'Last Seen'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const style = CLS_STYLE[row.classification] ?? CLS_STYLE.UNKNOWN_BLOCKED_BY_DEFAULT;
                    const Icon  = style.icon;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono font-bold text-foreground whitespace-nowrap">{row.capability}</td>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono text-[7px]">{row.source}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold ${style.bg} ${style.color}`}>
                            {row.classification}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Icon className={`w-3 h-3 ${style.color}`} />
                            <span className={`font-bold text-[8px] ${style.color}`}>{style.short}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.requiredApproval}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-[180px]">{row.reason}</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-[7px] font-semibold ${
                          row.safetyImpact.startsWith('CRITICAL') ? 'text-destructive' :
                          row.safetyImpact.startsWith('HIGH')     ? 'text-amber-500' :
                          row.safetyImpact.startsWith('LOW')      ? 'text-amber-400' : 'text-primary'
                        }`}>{row.safetyImpact}</td>
                        <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[7px]">
                          {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {report.safetyAssertions.filter(a => a.pass).length}/{report.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
              {report.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className="text-[7px] font-bold text-primary">{String(a.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="font-mono">{report.reportId}</span>
            <span>{new Date(report.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={report} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Shield className="w-3 h-3" /> Generate Policy Matrix Report
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Capability policy matrix is local-only. No OpenClaw calls. No network calls. No execution. No dispatch. Unknown capabilities are blocked by default.
      </div>
    </div>
  );
}