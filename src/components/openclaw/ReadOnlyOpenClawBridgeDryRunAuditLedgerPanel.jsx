/**
 * ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel — Phase 22 Audit Ledger
 * Archives bridge validation responses and classifies them locally.
 * No OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { FileText, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock, Archive } from 'lucide-react';

const KEYS = {
  phase20Lock:       'openclawReadOnlyOpenClawBridgeDesignFinalLock',
  phase21Lock:       'openclawReadOnlyOpenClawBridgeValidatorFinalLock',
  validationResult:  'openclawReadOnlyOpenClawBridgeValidationResult',
};
const LEDGER_KEY     = 'openclawReadOnlyOpenClawBridgeDryRunAuditLedger';
const MAX_RECORDS    = 100;
const FINAL_WARNING  = 'This Phase 22 audit ledger is local-only and non-executable. It archives bridge dry-run validation results only. It does not authorize OpenClaw calls, runtime bridge activation, browser automation, clicking, typing, credentials, trading, broker actions, wallet actions, money movement, command dispatch, scheduler, polling, or external forwarding.';

const SAFETY_ASSERTIONS = {
  localOnly:               true,
  previewOnly:             true,
  dryRunOnly:              true,
  readOnly:                true,
  noOpenClawCalls:         true,
  noRuntimeBridge:         true,
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
  AUDIT_VALID_BRIDGE_DRY_RUN:        { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
  AUDIT_REJECTED_BY_BRIDGE_CONTRACT: { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
  AUDIT_BLOCKED_BY_POLICY:           { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  AUDIT_HOLD_FOR_REVIEW:             { color: 'text-slate-400',   bg: 'bg-slate-500/5 border-slate-500/20' },
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function classifyValidation(valStatus) {
  switch (valStatus) {
    case 'VALID_BRIDGE_DRY_RUN':
      return 'AUDIT_VALID_BRIDGE_DRY_RUN';
    case 'REJECTED_BY_BRIDGE_CONTRACT':
      return 'AUDIT_REJECTED_BY_BRIDGE_CONTRACT';
    case 'BLOCKED_BY_POLICY':
      return 'AUDIT_BLOCKED_BY_POLICY';
    default:
      return 'AUDIT_HOLD_FOR_REVIEW';
  }
}

function computeAuditStatus(r) {
  const missing  = !r.validationResultPresent;
  const noLocks  = !r.sourcePhase20LockPresent || !r.sourcePhase21LockPresent;
  const unsafe   =
    r.openClawCalled        === true ||
    r.backendForwarded      === true ||
    r.browserActionPerformed=== true ||
    r.runtimeBridgeActivated=== true ||
    r.executionAllowed      === true ||
    r.dispatchAllowed       === true ||
    r.browserMutationAllowed=== true ||
    r.credentialEntryAllowed=== true;

  if (unsafe) return 'AUDIT_BLOCKED';
  if (missing || noLocks) return 'AUDIT_HOLD_FOR_REVIEW';
  if (r.validationResultPresent && r.dryRunOnly === true && !unsafe) return 'AUDIT_READY';
  return 'AUDIT_HOLD_FOR_REVIEW';
}

function buildAuditRecord(valResult) {
  const r = valResult ?? {};
  const phase20Lock = !!localStorage.getItem(KEYS.phase20Lock);
  const phase21Lock = !!localStorage.getItem(KEYS.phase21Lock);

  return {
    auditId:                   `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt:                 new Date().toISOString(),
    sourcePhase20LockPresent:  phase20Lock,
    sourcePhase21LockPresent:  phase21Lock,
    validationResultPresent:   !!valResult,
    bridgeValidationId:        r.bridgeValidationId ?? null,
    bridgeRequestId:           r.bridgeRequestId ?? null,
    requestId:                 r.requestId ?? null,
    proposalId:                r.proposalId ?? null,
    observationType:           r.observationType ?? null,
    validationStatus:          r.validationStatus ?? null,
    validationErrors:          r.validationErrors ?? [],
    auditClassification:       valResult ? classifyValidation(r.validationStatus) : 'AUDIT_HOLD_FOR_REVIEW',
    dryRunOnly:                r.dryRunOnly === true,
    openClawCalled:            r.openClawCalled === true,
    backendForwarded:          r.backendForwarded === true,
    browserActionPerformed:    r.browserActionPerformed === true,
    runtimeBridgeActivated:    r.runtimeBridgeActivated === true,
    executionAllowed:          r.executionAllowed === true,
    dispatchAllowed:           r.dispatchAllowed === true,
    browserMutationAllowed:    r.browserMutationAllowed === true,
    credentialEntryAllowed:    r.credentialEntryAllowed === true,
    auditStatus:               null, // computed below
    safetyAssertions:          SAFETY_ASSERTIONS,
  };
}

export default function ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel() {
  const [ledger, setLedger]     = useState(() => loadJSON(LEDGER_KEY, []));
  const [copied, setCopied]     = useState(false);

  const valResult = loadJSON(KEYS.validationResult, null);
  const latestRecord = ledger.length > 0 ? ledger[0] : null;

  // Recompute audit status for display
  const computedLatestStatus = latestRecord ? computeAuditStatus(latestRecord) : null;

  const handleArchive = () => {
    if (!valResult) return;
    const newRecord = buildAuditRecord(valResult);
    newRecord.auditStatus = computeAuditStatus(newRecord);
    const updated = [newRecord, ...ledger].slice(0, MAX_RECORDS);
    try { localStorage.setItem(LEDGER_KEY, JSON.stringify(updated)); } catch {}
    setLedger(updated);
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
  };

  // Count by classification
  const validCount    = ledger.filter(r => r.auditClassification === 'AUDIT_VALID_BRIDGE_DRY_RUN').length;
  const rejectedCount = ledger.filter(r => r.auditClassification === 'AUDIT_REJECTED_BY_BRIDGE_CONTRACT').length;
  const blockedCount  = ledger.filter(r => r.auditClassification === 'AUDIT_BLOCKED_BY_POLICY').length;
  const holdCount     = ledger.filter(r => r.auditClassification === 'AUDIT_HOLD_FOR_REVIEW').length;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 22 · Bridge Dry-Run Audit Ledger</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Bridge Dry-Run Audit Ledger
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only Phase 22 audit ledger. Archives bridge validation responses and classifies them. Newest first. Max 100 records. No OpenClaw calls, no browser automation, no execution.</div>
      </div>

      {/* Ledger status chip */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <Archive className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">PHASE_22_DRY_RUN_AUDIT_LEDGER</span>
        </div>
        <span className="text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-wider text-primary border-primary/30 bg-primary/5">
          {ledger.length} Records
        </span>
      </div>

      {/* Classification count cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Audit Classifications — {ledger.length} Total
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Valid', count: validCount, color: 'text-primary border-primary/30 bg-primary/5' },
            { label: 'Rejected', count: rejectedCount, color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
            { label: 'Blocked', count: blockedCount, color: 'text-destructive border-destructive/30 bg-destructive/5' },
            { label: 'Hold', count: holdCount, color: 'text-slate-400 border-slate-500/30 bg-slate-500/5' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`border rounded-lg px-3 py-2.5 ${color}`}>
              <div className="text-[9px] font-semibold">{label}</div>
              <div className="text-[14px] font-bold mt-0.5">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest audit summary */}
      {latestRecord && (() => {
        const cfgData = CLASSIFICATION_CONFIG[latestRecord.auditClassification] ?? CLASSIFICATION_CONFIG.AUDIT_HOLD_FOR_REVIEW;
        return (
          <div className={`border rounded-lg p-4 space-y-3 ${cfgData.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Latest Audit Record</div>
                <div className={`text-[12px] font-bold uppercase tracking-wide mt-0.5 ${cfgData.color}`}>{latestRecord.auditClassification}</div>
                <div className="text-[8px] text-slate-500 mt-1 font-mono">{latestRecord.auditId}</div>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${cfgData.color.replace('text-', 'text-').replace('border-', 'border-')}`}>
                {computedLatestStatus || latestRecord.auditStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
              {[
                { k: 'Bridge Request ID', v: latestRecord.bridgeRequestId, vc: 'text-blue-400 font-mono text-[7px] truncate' },
                { k: 'Observation Type', v: latestRecord.observationType ?? '—' },
                { k: 'Validation Status', v: latestRecord.validationStatus ?? '—' },
                { k: 'Timestamp', v: new Date(latestRecord.createdAt).toLocaleString(), vc: 'text-[7px]' },
              ].map(({ k, v, vc }) => (
                <div key={k} className="bg-card/60 border border-border/40 px-2 py-1.5 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                  <div className={vc || 'font-semibold text-foreground'}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Safety flags grid — latest record */}
      {latestRecord && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Safety Flags — Latest Record</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { k: 'dryRunOnly',              v: latestRecord.dryRunOnly },
              { k: 'openClawCalled',          v: latestRecord.openClawCalled },
              { k: 'backendForwarded',        v: latestRecord.backendForwarded },
              { k: 'browserActionPerformed',  v: latestRecord.browserActionPerformed },
              { k: 'runtimeBridgeActivated',  v: latestRecord.runtimeBridgeActivated },
              { k: 'executionAllowed',        v: latestRecord.executionAllowed },
              { k: 'dispatchAllowed',         v: latestRecord.dispatchAllowed },
              { k: 'browserMutationAllowed',  v: latestRecord.browserMutationAllowed },
              { k: 'credentialEntryAllowed',  v: latestRecord.credentialEntryAllowed },
            ].map(({ k, v }) => (
              <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
                {v === false ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                <span className="text-[8px] text-slate-300 font-mono">{k}: <span className={`font-bold ${v === false ? 'text-primary' : 'text-destructive'}`}>{String(v)}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation errors — latest record */}
      {latestRecord && latestRecord.validationErrors?.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Validation Errors ({latestRecord.validationErrors.length})</span>
          </div>
          <div className="divide-y divide-border/30">
            {latestRecord.validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                <span className="text-[8px] text-slate-300">{err}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit history table — all records */}
      {ledger.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Audit History — {ledger.length} Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Classification</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Validation Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {ledger.slice(0, 10).map((record, i) => {
                  const cfgData = CLASSIFICATION_CONFIG[record.auditClassification] ?? CLASSIFICATION_CONFIG.AUDIT_HOLD_FOR_REVIEW;
                  const status = computeAuditStatus(record);
                  return (
                    <tr key={i} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-1.5 text-slate-500 font-mono">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-3 py-1.5 text-slate-400 font-mono">{new Date(record.createdAt).toLocaleTimeString()}</td>
                      <td className={`px-3 py-1.5 font-semibold ${cfgData.color}`}>{record.auditClassification.replace('AUDIT_', '')}</td>
                      <td className="px-3 py-1.5 text-slate-300">{record.validationStatus ?? '—'}</td>
                      <td className={`px-3 py-1.5 font-bold ${status === 'AUDIT_READY' ? 'text-primary' : status === 'AUDIT_BLOCKED' ? 'text-destructive' : 'text-amber-500'}`}>{status.replace('AUDIT_', '')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ledger.length > 10 && (
            <div className="px-4 py-2 bg-secondary/10 border-t border-border/30 text-[8px] text-slate-500">
              Showing 10 of {ledger.length} records. Scroll for more.
            </div>
          )}
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
          onClick={handleArchive}
          disabled={!valResult}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50"
        >
          <Archive className="w-3.5 h-3.5" />
          Archive Latest Bridge Validation Result
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latestRecord}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Bridge Audit Record JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={ledger.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Bridge Dry-Run Audit Ledger
        </button>
      </div>

      {/* JSON preview — latest record */}
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
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{LEDGER_KEY}</span></span>
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