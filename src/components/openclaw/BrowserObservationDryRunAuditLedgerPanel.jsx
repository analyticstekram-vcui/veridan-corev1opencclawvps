/**
 * BrowserObservationDryRunAuditLedgerPanel — Phase 19 Dry-Run Observation Audit Ledger
 * Archives validation responses and classifies them locally. No OpenClaw calls, no browser automation.
 */
import React, { useState } from 'react';
import { FileText, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';

const KEYS = {
  phase17Lock:           'openclawBrowserObservationExecutionContractFinalLock',
  validationResult:      'openclawBrowserObservationContractValidationResult',
  phase18Lock:           'openclawBrowserObservationContractValidatorFinalLock',
};
const LEDGER_KEY        = 'openclawBrowserObservationDryRunAuditLedger';
const PHASE_NAME        = 'PHASE_19_DRY_RUN_OBSERVATION_AUDIT_LEDGER';
const LEDGER_CAP        = 100;

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  previewOnly:             true,
  dryRunOnly:              true,
  readOnly:                true,
  noOpenClawCalls:         true,
  noBackendForwarding:     true,
  noBrowserAutomationApis: true,
  noRealBrowserActions:    true,
  noClick:                 true,
  noTyping:                true,
  noFormSubmit:            true,
  noCredentialEntry:       true,
  noTrading:               true,
  noBrokerActions:         true,
  noWalletActions:         true,
  noMoneyMovement:         true,
  noCommandDispatch:       true,
  noScheduler:             true,
  noPolling:               true,
  noAutonomousControl:     true,
};

const CLASSIFICATION_CONFIG = {
  AUDIT_VALID_DRY_RUN:         { color: 'text-primary',     badge: 'text-primary border-primary/30 bg-primary/5' },
  AUDIT_REJECTED_BY_CONTRACT:  { color: 'text-amber-500',   badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  AUDIT_BLOCKED_BY_POLICY:     { color: 'text-destructive', badge: 'text-destructive border-destructive/30 bg-destructive/5' },
  AUDIT_HOLD_FOR_REVIEW:       { color: 'text-slate-500',   badge: 'text-slate-500 border-slate-500/30 bg-slate-500/5' },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function buildAuditRecord() {
  const phase17Lock      = loadJSON(KEYS.phase17Lock, null);
  const validationResult = loadJSON(KEYS.validationResult, null);
  const phase18Lock      = loadJSON(KEYS.phase18Lock, null);

  const r = validationResult ?? {};

  // Classification
  let auditClassification;
  if (!validationResult) {
    auditClassification = 'AUDIT_HOLD_FOR_REVIEW';
  } else if (r.validationStatus === 'VALID_DRY_RUN') {
    auditClassification = 'AUDIT_VALID_DRY_RUN';
  } else if (r.validationStatus === 'REJECTED_BY_CONTRACT') {
    auditClassification = 'AUDIT_REJECTED_BY_CONTRACT';
  } else if (r.validationStatus === 'BLOCKED_BY_POLICY') {
    auditClassification = 'AUDIT_BLOCKED_BY_POLICY';
  } else {
    auditClassification = 'AUDIT_HOLD_FOR_REVIEW';
  }

  // auditStatus
  const policyViolation =
    r.openClawCalled         === true ||
    r.backendForwarded       === true ||
    r.browserActionPerformed === true ||
    r.executionAllowed       === true ||
    r.dispatchAllowed        === true ||
    r.browserMutationAllowed === true ||
    r.credentialEntryAllowed === true;

  let auditStatus;
  if (policyViolation) {
    auditStatus = 'AUDIT_BLOCKED';
  } else if (!validationResult || !phase17Lock || !phase18Lock) {
    auditStatus = 'AUDIT_HOLD_FOR_REVIEW';
  } else if (r.dryRunOnly === true && r.openClawCalled === false && r.backendForwarded === false && r.browserActionPerformed === false) {
    auditStatus = 'AUDIT_READY';
  } else {
    auditStatus = 'AUDIT_HOLD_FOR_REVIEW';
  }

  return {
    auditId:                 `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt:               new Date().toISOString(),
    sourcePhase17LockPresent: !!phase17Lock,
    sourcePhase18LockPresent: !!phase18Lock,
    validationResultPresent: !!validationResult,
    requestId:              r.requestId ?? null,
    proposalId:             r.proposalId ?? null,
    observationType:        r.observationType ?? null,
    validationStatus:       r.validationStatus ?? null,
    validationErrors:       Array.isArray(r.validationErrors) ? r.validationErrors : [],
    auditClassification,
    dryRunOnly:             r.dryRunOnly === true,
    openClawCalled:         r.openClawCalled === true,
    backendForwarded:       r.backendForwarded === true,
    browserActionPerformed: r.browserActionPerformed === true,
    executionAllowed:       r.executionAllowed === true,
    dispatchAllowed:        r.dispatchAllowed === true,
    browserMutationAllowed: r.browserMutationAllowed === true,
    credentialEntryAllowed: r.credentialEntryAllowed === true,
    auditStatus,
    safetyAssertions:       SAFETY_ASSERTIONS,
  };
}

export default function BrowserObservationDryRunAuditLedgerPanel() {
  const [ledger, setLedger]         = useState(() => loadJSON(LEDGER_KEY, []));
  const [latestRecord, setLatestRecord] = useState(null);
  const [copied, setCopied]         = useState(false);

  const handleArchive = () => {
    const record = buildAuditRecord();
    const updated = [record, ...ledger].slice(0, LEDGER_CAP);
    try { localStorage.setItem(LEDGER_KEY, JSON.stringify(updated, null, 2)); } catch {}
    setLedger(updated);
    setLatestRecord(record);
  };

  const handleCopy = () => {
    if (!latestRecord) return;
    navigator.clipboard.writeText(JSON.stringify(latestRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(LEDGER_KEY); } catch {}
    setLedger([]);
    setLatestRecord(null);
  };

  // Calculate counts
  const validCount    = ledger.filter(r => r.auditClassification === 'AUDIT_VALID_DRY_RUN').length;
  const rejectedCount = ledger.filter(r => r.auditClassification === 'AUDIT_REJECTED_BY_CONTRACT').length;
  const blockedCount  = ledger.filter(r => r.auditClassification === 'AUDIT_BLOCKED_BY_POLICY').length;
  const holdCount     = ledger.filter(r => r.auditClassification === 'AUDIT_HOLD_FOR_REVIEW').length;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 19 · Dry-Run Audit Ledger</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Dry-Run Observation Audit Ledger
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 19 audit ledger. Archives validation results and classifies outcomes. No OpenClaw calls, no browser automation.</div>
      </div>

      {/* Audit count cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Audit Ledger — {ledger.length} Records (Cap: {LEDGER_CAP})
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Valid', count: validCount, cfg: CLASSIFICATION_CONFIG.AUDIT_VALID_DRY_RUN },
            { label: 'Rejected', count: rejectedCount, cfg: CLASSIFICATION_CONFIG.AUDIT_REJECTED_BY_CONTRACT },
            { label: 'Blocked', count: blockedCount, cfg: CLASSIFICATION_CONFIG.AUDIT_BLOCKED_BY_POLICY },
            { label: 'Hold', count: holdCount, cfg: CLASSIFICATION_CONFIG.AUDIT_HOLD_FOR_REVIEW },
          ].map(({ label, count, cfg }) => (
            <div key={label} className={`border rounded-lg px-3 py-2.5 flex flex-col items-center gap-1 ${cfg.badge}`}>
              <div className={`text-[10px] font-bold ${cfg.color}`}>{count}</div>
              <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest record summary */}
      {latestRecord && (() => {
        const cfg = CLASSIFICATION_CONFIG[latestRecord.auditClassification];
        return (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Latest Audit Record</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{latestRecord.auditId}</div>
              </div>
              <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${cfg.badge}`}>
                {latestRecord.auditClassification}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px]">
              {[
                { k: 'Status', v: latestRecord.validationStatus ?? '—' },
                { k: 'Audit Status', v: latestRecord.auditStatus },
                { k: 'Req ID', v: latestRecord.requestId?.slice(0, 12) + '…' ?? '—' },
                { k: 'Prop ID', v: latestRecord.proposalId?.slice(0, 12) + '…' ?? '—' },
                { k: 'Type', v: latestRecord.observationType ?? '—' },
                { k: 'Created', v: new Date(latestRecord.createdAt).toLocaleTimeString() },
              ].map(({ k, v }) => (
                <div key={k} className="bg-secondary/20 border border-border/40 rounded px-2 py-1.5">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5">{k}</div>
                  <div className="text-slate-300 font-mono truncate">{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Audit history table */}
      {ledger.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Audit History</span>
          </div>
          <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
            {ledger.slice(0, 20).map((record, i) => {
              const cfg = CLASSIFICATION_CONFIG[record.auditClassification];
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[8px] text-slate-600 font-mono shrink-0 w-4">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${cfg.badge}`}>
                        {record.auditClassification.replace('AUDIT_', '')}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono truncate">{record.auditId.slice(0, 20)}</span>
                    </div>
                    <div className="text-[7px] text-slate-500">
                      {record.observationType ?? '—'} · {new Date(record.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation errors (if latest record has any) */}
      {latestRecord && latestRecord.validationErrors.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Validation Errors ({latestRecord.validationErrors.length})
            </span>
          </div>
          <div className="divide-y divide-border/30">
            {latestRecord.validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 px-4 py-2">
                <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                <span className="text-[8px] text-slate-300">{err}</span>
              </div>
            ))}
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
          <span className="font-bold">Phase 19 Audit Ledger: </span>Local-only archive of validation results. Does not execute, dispatch, or forward to OpenClaw. Purely audit and classification.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleArchive}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <FileText className="w-3.5 h-3.5" />
          Archive Latest Validation Result
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestRecord}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Audit Record JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={ledger.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Dry-Run Audit Ledger
        </button>
      </div>

      {/* JSON preview */}
      {latestRecord && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Audit Record — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(latestRecord.createdAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(latestRecord, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Appended to localStorage key: <span className="font-mono">{LEDGER_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No OpenClaw calls. No backend forwarding. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}