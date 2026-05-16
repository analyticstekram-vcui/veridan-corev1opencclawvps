/**
 * BrowserObservationReadinessGatePanel — Local-only Readiness Gate (Phase 16)
 * Evaluates proposals and review ledger records to produce a readiness decision.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { BarChart2, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const KEYS = {
  finalLock: 'openclawBrowserObservationFinalLock',
  proposals: 'openclawBrowserObservationProposals',
  ledger:    'openclawBrowserObservationProposalReviewLedger',
};
const GATE_KEY    = 'openclawBrowserObservationReadinessGate';
const GATE_NAME   = 'OPENCLAW_BROWSER_OBSERVATION_READINESS_GATE';
const PHASE_NAME  = 'PHASE_16_BROWSER_OBSERVATION_PROPOSAL_QUEUE';
const FINAL_WARNING = 'This readiness gate is local-only and non-executable. It does not authorize browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or backend calls.';

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
  noFormSubmit:             true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noScheduler:              true,
  noPolling:                true,
  noAutonomousControl:      true,
};

const CHECK_LABELS = {
  finalLockPresent:                 'Final lock present',
  proposalsPresent:                 'Proposals present',
  reviewLedgerPresent:              'Review ledger present',
  noBlockedProposalApproved:        'No BLOCKED proposal approved as design',
  deniedPolicyForBlockedProposals:  'All BLOCKED proposals denied by policy',
  allReviewsNonExecutable:          'All reviews non-executable',
  executionDisabled:                'Execution disabled',
  dispatchDisabled:                 'Dispatch disabled',
  browserMutationDisabled:          'Browser mutation disabled',
  credentialEntryDisabled:          'Credential entry disabled',
};

const DECISION_CONFIG = {
  READY_FOR_DESIGN_REVIEW: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         badge: 'text-primary border-primary/30 bg-primary/5',             icon: CheckCircle2 },
  HOLD_FOR_REVIEW:         { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5',       icon: Clock },
  BLOCKED_BY_POLICY:       { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'text-destructive border-destructive/30 bg-destructive/5',  icon: XCircle },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function runEvaluation() {
  const finalLock = loadJSON(KEYS.finalLock, null);
  const proposals = loadJSON(KEYS.proposals, []);
  const ledger    = loadJSON(KEYS.ledger, []);

  const approvedDesignCount  = ledger.filter(r => r.reviewDecision === 'APPROVED_FOR_DESIGN').length;
  const heldReviewCount      = ledger.filter(r => r.reviewDecision === 'HELD_FOR_REVIEW').length;
  const deniedPolicyCount    = ledger.filter(r => r.reviewDecision === 'DENIED_BY_POLICY').length;
  const blockedProposalCount = proposals.filter(p => p.proposalStatus === 'BLOCKED_BY_POLICY').length;

  const blockedApprovedAsDesign = ledger.some(r => {
    const proposal = proposals.find(p => p.proposalId === r.proposalId);
    return proposal?.proposalStatus === 'BLOCKED_BY_POLICY' && r.reviewDecision === 'APPROVED_FOR_DESIGN';
  });

  const blockedProposalsAllDenied = proposals
    .filter(p => p.proposalStatus === 'BLOCKED_BY_POLICY')
    .every(p => ledger.some(r => r.proposalId === p.proposalId && r.reviewDecision === 'DENIED_BY_POLICY'));

  const anyUnsafeReview = ledger.some(r =>
    r.executionAllowed === true ||
    r.dispatchAllowed === true ||
    r.browserMutationAllowed === true ||
    r.credentialEntryAllowed === true
  );

  const readinessChecks = {
    finalLockPresent:                 !!finalLock,
    proposalsPresent:                 proposals.length > 0,
    reviewLedgerPresent:              ledger.length > 0,
    noBlockedProposalApproved:        !blockedApprovedAsDesign,
    deniedPolicyForBlockedProposals:  blockedProposalCount === 0 || blockedProposalsAllDenied,
    allReviewsNonExecutable:          !anyUnsafeReview,
    executionDisabled:                true,
    dispatchDisabled:                 true,
    browserMutationDisabled:          true,
    credentialEntryDisabled:          true,
  };

  const allChecksPass = Object.values(readinessChecks).every(Boolean);

  let readinessDecision;
  if (blockedApprovedAsDesign || anyUnsafeReview) {
    readinessDecision = 'BLOCKED_BY_POLICY';
  } else if (allChecksPass && approvedDesignCount >= 1) {
    readinessDecision = 'READY_FOR_DESIGN_REVIEW';
  } else {
    readinessDecision = 'HOLD_FOR_REVIEW';
  }

  return {
    gateName:               GATE_NAME,
    generatedAt:            new Date().toISOString(),
    phaseName:              PHASE_NAME,
    sourceFinalLockPresent: !!finalLock,
    proposalCount:          proposals.length,
    reviewCount:            ledger.length,
    approvedDesignCount,
    heldReviewCount,
    deniedPolicyCount,
    blockedProposalCount,
    readinessChecks,
    readinessDecision,
    safetyAssertions:       SAFETY_ASSERTIONS,
    finalWarning:           FINAL_WARNING,
  };
}

export default function BrowserObservationReadinessGatePanel() {
  const [gate, setGate]     = useState(() => loadJSON(GATE_KEY, null));
  const [copied, setCopied] = useState(false);

  const handleEvaluate = () => {
    const result = runEvaluation();
    try { localStorage.setItem(GATE_KEY, JSON.stringify(result, null, 2)); } catch {}
    setGate(result);
  };

  const handleCopy = () => {
    if (!gate) return;
    navigator.clipboard.writeText(JSON.stringify(gate, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(GATE_KEY); } catch {}
    setGate(null);
  };

  const decisionCfg      = gate ? (DECISION_CONFIG[gate.readinessDecision] ?? DECISION_CONFIG.HOLD_FOR_REVIEW) : null;
  const checksPassCount  = gate ? Object.values(gate.readinessChecks).filter(Boolean).length : null;
  const checksTotal      = gate ? Object.keys(gate.readinessChecks).length : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 16 · Browser Observation Readiness Gate</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" /> Browser Observation Readiness Gate
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only readiness evaluation. No execution, no automation, no dispatch, no backend calls.</div>
      </div>

      {/* Gate name chip + decision badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{GATE_NAME}</span>
        </div>
        {gate && (
          <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${decisionCfg?.badge}`}>
            {gate.readinessDecision}
          </span>
        )}
      </div>

      {/* Count cards */}
      {gate && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Proposals',     count: gate.proposalCount,       color: 'text-slate-300',   bg: 'bg-secondary/10 border-border/40' },
            { label: 'Reviews',       count: gate.reviewCount,         color: 'text-slate-300',   bg: 'bg-secondary/10 border-border/40' },
            { label: 'Approved',      count: gate.approvedDesignCount, color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
            { label: 'Held',          count: gate.heldReviewCount,     color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
            { label: 'Denied',        count: gate.deniedPolicyCount,   color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
            { label: 'Blk Props',     count: gate.blockedProposalCount,color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`border rounded-lg px-3 py-2 ${bg}`}>
              <div className={`text-[16px] font-bold ${color}`}>{count}</div>
              <div className={`text-[8px] font-semibold ${color}`}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Decision badge (large) */}
      {gate && decisionCfg && (() => {
        const DecIcon = decisionCfg.icon;
        return (
          <div className={`border rounded-lg p-4 flex items-center gap-3 ${decisionCfg.bg}`}>
            <DecIcon className={`w-5 h-5 ${decisionCfg.color} shrink-0`} />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Readiness Decision</div>
              <div className={`text-[14px] font-bold uppercase tracking-wide mt-0.5 ${decisionCfg.color}`}>
                {gate.readinessDecision}
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5 font-mono">{gate.phaseName}</div>
            </div>
          </div>
        );
      })()}

      {/* Readiness checks */}
      {gate && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Readiness Checks</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
              checksPassCount === checksTotal
                ? 'text-primary border-primary/30 bg-primary/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            }`}>{checksPassCount}/{checksTotal} PASS</span>
          </div>
          <div className="divide-y divide-border/30">
            {Object.entries(gate.readinessChecks).map(([key, value]) => {
              const isBlocked = !value && gate.readinessDecision === 'BLOCKED_BY_POLICY';
              const StatusIcon  = value ? CheckCircle2 : isBlocked ? XCircle : Clock;
              const statusColor = value ? 'text-primary' : isBlocked ? 'text-destructive' : 'text-amber-500';
              const badgeClass  = value
                ? 'text-primary border-primary/30 bg-primary/5'
                : isBlocked
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5';
              const badgeLabel  = value ? 'PASS' : isBlocked ? 'BLOCKED' : 'HOLD';
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                  <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusColor}`} />
                  <span className="text-[9px] text-slate-300 flex-1">{CHECK_LABELS[key] ?? key}</span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>{badgeLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-primary font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Final warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Final Warning: </span>{FINAL_WARNING}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleEvaluate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Evaluate Browser Observation Readiness
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!gate}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Readiness Gate JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!gate}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Readiness Gate
        </button>
      </div>

      {/* JSON preview */}
      {gate && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Readiness Gate — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(gate.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(gate, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{GATE_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}