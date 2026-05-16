/**
 * OpenClawOperatorApprovalWorkflowPanel — Phase 24 Operator Approval Workflow
 * Local-only approval workflow for planning purposes only. No runtime bridge activation.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { CheckCircle2, Copy, Trash2, ShieldCheck, AlertTriangle, Clock, FileCheck } from 'lucide-react';

const RECORDS_KEY  = 'openclawOperatorApprovalWorkflowRecords';
const MAX_RECORDS  = 100;
const FINAL_WARNING = 'This Phase 24 approval workflow is local-only and for planning purposes only. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, execution, credentials, trading, wallet actions, money movement, dispatch, scheduler, polling, or external forwarding. All approvals are LOCAL_OPERATOR and planning-only.';

const SAFETY_ASSERTIONS = {
  localOnly:              true,
  previewOnly:            true,
  planningOnly:           true,
  readOnly:               true,
  runtimeBridgeDisabled:  true,
  noOpenClawCalls:        true,
  noBrowserAutomationApis: true,
  noRealBrowserActions:   true,
  noClick:                true,
  noTyping:               true,
  noCredentialEntry:      true,
  noTrading:              true,
  noBrokerActions:        true,
  noWalletActions:        true,
  noMoneyMovement:        true,
  noCommandDispatch:      true,
  noScheduler:            true,
  noPolling:              true,
};

const APPROVAL_SCOPES = [
  { value: 'CONTINUE_DESIGN_ONLY', label: 'Continue Design Only' },
  { value: 'PREPARE_RUNTIME_IMPLEMENTATION_PLAN', label: 'Prepare Runtime Implementation Plan' },
  { value: 'REVIEW_BRIDGE_RISK_BOUNDARIES', label: 'Review Bridge Risk Boundaries' },
  { value: 'HOLD_ALL_RUNTIME_WORK', label: 'Hold All Runtime Work' },
  { value: 'BLOCK_RUNTIME_WORK', label: 'Block Runtime Work' },
];

const DECISION_OPTIONS = {
  CONTINUE_DESIGN_ONLY: ['APPROVED_FOR_PLANNING_ONLY', 'HOLD_FOR_REVIEW'],
  PREPARE_RUNTIME_IMPLEMENTATION_PLAN: ['APPROVED_FOR_PLANNING_ONLY', 'HOLD_FOR_REVIEW'],
  REVIEW_BRIDGE_RISK_BOUNDARIES: ['HOLD_FOR_REVIEW', 'APPROVED_FOR_PLANNING_ONLY'],
  HOLD_ALL_RUNTIME_WORK: ['HOLD_FOR_REVIEW'],
  BLOCK_RUNTIME_WORK: ['BLOCKED_BY_OPERATOR'],
};

const RISK_TIER_MAP = {
  CONTINUE_DESIGN_ONLY: 'LOW',
  REVIEW_BRIDGE_RISK_BOUNDARIES: 'MEDIUM',
  PREPARE_RUNTIME_IMPLEMENTATION_PLAN: 'HIGH',
  HOLD_ALL_RUNTIME_WORK: 'MEDIUM',
  BLOCK_RUNTIME_WORK: 'BLOCKED',
};

const NEXT_STEP_MAP = {
  APPROVED_FOR_PLANNING_ONLY: 'PLANNING_ONLY_NEXT_STEP_ALLOWED',
  HOLD_FOR_REVIEW: 'NO_NEXT_STEP_UNTIL_REVIEW',
  BLOCKED_BY_OPERATOR: 'STOP_ALL_RUNTIME_PLANNING',
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function generateApprovalRecord(scope, decision, note, sourceLocks) {
  return {
    approvalId:                               `APR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt:                                new Date().toISOString(),
    approvedBy:                               'LOCAL_OPERATOR',
    approvalScope:                            scope,
    approvalDecision:                         decision,
    approvalNote:                             note,
    sourceGovernanceSummaryPresent:           sourceLocks.summaryPresent,
    sourceRuntimeReadinessLockPresent:        sourceLocks.readinessLockPresent,
    sourceBridgeDesignLockPresent:            sourceLocks.designLockPresent,
    sourceBridgeValidatorLockPresent:         sourceLocks.validatorLockPresent,
    sourceBridgeAuditLedgerPresent:           sourceLocks.auditLedgerPresent,
    riskTier:                                 RISK_TIER_MAP[scope] ?? 'UNKNOWN',
    allowedNextStep:                          NEXT_STEP_MAP[decision] ?? 'UNKNOWN',
    runtimeBridgeActivationAllowed:           false,
    openClawCallAllowed:                      false,
    browserAutomationAllowed:                 false,
    executionAllowed:                         false,
    dispatchAllowed:                          false,
    credentialEntryAllowed:                   false,
    tradingAllowed:                           false,
    walletActionAllowed:                      false,
    moneyMovementAllowed:                     false,
    safetyAssertions:                         SAFETY_ASSERTIONS,
    finalWarning:                             FINAL_WARNING,
  };
}

export default function OpenClawOperatorApprovalWorkflowPanel() {
  const [records, setRecords] = useState(() => loadJSON(RECORDS_KEY, []));
  const [scope, setScope] = useState('');
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Load source locks
  const summary = loadJSON('openclawGovernancePhase14To23Summary', null);
  const readinessLock = loadJSON('openclawReadOnlyOpenClawRuntimeBridgeReadinessFinalLock', null);
  const designLock = loadJSON('openclawReadOnlyOpenClawBridgeDesignFinalLock', null);
  const validatorLock = loadJSON('openclawReadOnlyOpenClawBridgeValidatorFinalLock', null);
  const auditLedger = loadJSON('openclawReadOnlyOpenClawBridgeDryRunAuditLedger', []);

  const sourceLocks = {
    summaryPresent: !!summary,
    readinessLockPresent: !!readinessLock,
    designLockPresent: !!designLock,
    validatorLockPresent: !!validatorLock,
    auditLedgerPresent: Array.isArray(auditLedger) && auditLedger.length > 0,
  };

  const allSourcesPresent = Object.values(sourceLocks).every(Boolean);
  const decisionOptions = scope ? DECISION_OPTIONS[scope] ?? [] : [];
  const latestRecord = records.length > 0 ? records[0] : null;

  const handleCreateApproval = () => {
    if (!scope || !decision || !note.trim()) return;
    
    const newRecord = generateApprovalRecord(scope, decision, note, sourceLocks);
    const updated = [newRecord, ...records].slice(0, MAX_RECORDS);
    
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(updated)); } catch {}
    setRecords(updated);
    
    // Reset form
    setScope('');
    setDecision('');
    setNote('');
  };

  const handleCopy = () => {
    if (!latestRecord) return;
    navigator.clipboard.writeText(JSON.stringify(latestRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (!confirm('Clear all approval records? This cannot be undone.')) return;
    try { localStorage.removeItem(RECORDS_KEY); } catch {}
    setRecords([]);
  };

  const riskColor = latestRecord?.riskTier === 'HIGH'
    ? 'text-destructive border-destructive/30 bg-destructive/5'
    : latestRecord?.riskTier === 'MEDIUM'
      ? 'text-amber-500 border-amber-500/30 bg-amber-500/5'
      : latestRecord?.riskTier === 'LOW'
        ? 'text-primary border-primary/30 bg-primary/5'
        : 'text-slate-400 border-slate-500/30 bg-slate-500/5';

  const decisionColor = latestRecord?.approvalDecision === 'APPROVED_FOR_PLANNING_ONLY'
    ? 'text-primary border-primary/30 bg-primary/5'
    : latestRecord?.approvalDecision === 'BLOCKED_BY_OPERATOR'
      ? 'text-destructive border-destructive/30 bg-destructive/5'
      : 'text-amber-500 border-amber-500/30 bg-amber-500/5';

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 24 · Operator Approval Workflow</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" /> Operator Approval Workflow
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 24 approval workflow for planning purposes only. Operator decisions do not activate runtime bridge or authorize execution.</div>
      </div>

      {/* Source lock presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Lock Packets — {Object.values(sourceLocks).filter(Boolean).length}/5 Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Governance Summary', present: sourceLocks.summaryPresent },
            { label: 'Runtime Readiness Lock', present: sourceLocks.readinessLockPresent },
            { label: 'Bridge Design Lock', present: sourceLocks.designLockPresent },
            { label: 'Bridge Validator Lock', present: sourceLocks.validatorLockPresent },
            { label: 'Bridge Audit Ledger', present: sourceLocks.auditLedgerPresent },
          ].map(({ label, present }) => (
            <div key={label} className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${present ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
              {present
                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                : <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              <div>
                <div className={`text-[9px] font-semibold ${present ? 'text-primary' : 'text-slate-500'}`}>{label}</div>
                <div className={`text-[7px] uppercase font-bold tracking-wider ${present ? 'text-primary/70' : 'text-slate-600'}`}>{present ? 'PRESENT' : 'MISSING'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval form */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Create Operator Approval</div>
        
        {/* Approval scope dropdown */}
        <div>
          <label className="block text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Approval Scope</label>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setDecision(''); // Reset decision when scope changes
            }}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-[10px] text-foreground font-semibold"
          >
            <option value="">— Select Scope —</option>
            {APPROVAL_SCOPES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Approval decision dropdown (filtered by scope) */}
        <div>
          <label className="block text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Approval Decision</label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            disabled={!scope || decisionOptions.length === 0}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-[10px] text-foreground font-semibold disabled:opacity-50"
          >
            <option value="">— Select Decision —</option>
            {decisionOptions.map(d => (
              <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Approval note textarea */}
        <div>
          <label className="block text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Approval Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Operator notes for this approval decision..."
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-[9px] text-foreground placeholder-slate-600 font-mono resize-none h-20"
          />
        </div>

        {/* Risk tier & next step preview */}
        {scope && decision && (
          <div className="grid grid-cols-2 gap-2">
            <div className={`border rounded-lg px-3 py-2.5 ${scope ? `${RISK_TIER_MAP[scope] === 'HIGH' ? 'text-destructive border-destructive/30 bg-destructive/5' : RISK_TIER_MAP[scope] === 'MEDIUM' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : 'text-primary border-primary/30 bg-primary/5'}` : 'text-slate-400 border-slate-500/30 bg-slate-500/5'}`}>
              <div className="text-[8px] uppercase tracking-widest font-semibold mb-0.5">Risk Tier</div>
              <div className="text-[11px] font-bold">{RISK_TIER_MAP[scope] ?? '—'}</div>
            </div>
            <div className="border rounded-lg px-3 py-2.5 text-primary border-primary/30 bg-primary/5">
              <div className="text-[8px] uppercase tracking-widest font-semibold mb-0.5">Next Step Allowed</div>
              <div className="text-[10px] font-bold">{NEXT_STEP_MAP[decision]?.replace(/_/g, ' ') ?? '—'}</div>
            </div>
          </div>
        )}

        {/* Create button */}
        <button
          type="button"
          onClick={handleCreateApproval}
          disabled={!scope || !decision || !note.trim() || !allSourcesPresent}
          className="w-full px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-40"
        >
          Create Operator Approval Record
        </button>
      </div>

      {/* Latest approval summary */}
      {latestRecord && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Latest Approval</div>
              <div className="text-[11px] font-bold text-foreground mt-0.5">{latestRecord.approvalScope.replace(/_/g, ' ')}</div>
              <div className="text-[8px] font-mono text-slate-500 mt-1">{latestRecord.approvalId}</div>
            </div>
            <div className="space-y-1">
              <span className={`text-[8px] font-bold px-2 py-1 rounded border inline-block ${decisionColor}`}>
                {latestRecord.approvalDecision.replace(/_/g, ' ')}
              </span>
              <div className={`text-[8px] font-bold px-2 py-1 rounded border inline-block ${riskColor}`}>
                {latestRecord.riskTier}
              </div>
            </div>
          </div>
          <div className="bg-secondary/10 border border-border/30 rounded px-3 py-2 text-[8px] text-slate-300 max-h-20 overflow-y-auto">
            {latestRecord.approvalNote}
          </div>
          <div className="text-[8px] text-slate-500 font-mono">
            {new Date(latestRecord.createdAt).toLocaleString()}
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
          onClick={handleCopy}
          disabled={!latestRecord}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Approval JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={records.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Approval Records
        </button>
      </div>

      {/* Approval history table */}
      {records.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Approval History — {records.length} Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Scope</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Decision</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Risk</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Next Step</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.slice(0, 10).map((record, i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-1.5 text-slate-500 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-1.5 text-slate-300">{record.approvalScope.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-1.5 text-slate-300 font-mono text-[7px]">{record.approvalDecision}</td>
                    <td className="px-3 py-1.5">
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${
                        record.riskTier === 'HIGH' ? 'text-destructive border-destructive/30 bg-destructive/5' :
                        record.riskTier === 'MEDIUM' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' :
                        record.riskTier === 'LOW' ? 'text-primary border-primary/30 bg-primary/5' :
                        'text-slate-400 border-slate-500/30 bg-slate-500/5'
                      }`}>{record.riskTier}</span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-300 text-[7px]">{record.allowedNextStep.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-1.5 text-slate-500 text-[7px]">{new Date(record.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length > 10 && (
            <div className="px-4 py-2 bg-secondary/10 border-t border-border/30 text-[8px] text-slate-500">
              Showing 10 of {records.length} records. Newest first.
            </div>
          )}
        </div>
      )}

      {/* Latest approval JSON preview */}
      {latestRecord && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Approval Record — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestRecord.createdAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestRecord, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{RECORDS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Planning-only. All approvals are LOCAL_OPERATOR. No OpenClaw calls, no runtime bridge activation, no execution, no dispatch, no credentials, no trading, no wallet actions, no money movement.
      </div>
    </div>
  );
}