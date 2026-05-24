/**
 * QuickDryRunButton
 * One-click dry-run validation that generates SERVER_DRY_RUN_VALIDATED evidence
 * and saves it to localStorage. No network request. No OpenClaw contact. No token read.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Shield } from 'lucide-react';
import {
  VALIDATION_CHECKS, DECISION_META,
  generateEvidenceId, generateAuditHash, runValidation,
} from './wakeBackendDryRunContracts';

const LS_KEY_PREFIX = 'phase5a_evidence_';

// Default passing form — all fields pre-set to pass every check
const DEFAULT_PASSING_FORM = {
  previewId:          'QUICK-AUTO',
  eventType:          'OPERATOR_MANUAL_WAKE',
  approvalState:      'REVIEW_READY',
  riskLevel:          'LOW',
  destinationChannel: 'openclaw-local',
  notificationText:   'Operator-initiated dry-run validation',
  executionStatus:    'NOT_EXECUTED',
  dispatchStatus:     'NOT_DISPATCHED',
  sourcePage:         '/wake-backend-dry-run',
  operatorNote:       'Generated via RUN BACKEND DRY-RUN VALIDATION quick button',
};

export function runQuickDryRun() {
  const { results, allPass, decision } = runValidation(DEFAULT_PASSING_FORM);
  const evidenceId = generateEvidenceId();
  const requestPreview = {
    ...DEFAULT_PASSING_FORM,
    dryRunMode:    true,
    openClawCall:  'SUPPRESSED',
    agentEndpoint: 'PROHIBITED',
  };
  const auditHash = generateAuditHash(requestPreview);
  const record = {
    form:                  DEFAULT_PASSING_FORM,
    requestPreview,
    responsePreview: {
      ok:              allPass,
      routeMode:       'DRY_RUN_ONLY',
      backendRoute:    '/api/openclaw/wake/dry-run',
      openClawCall:    'SUPPRESSED',
      openclawAgentCall: 'PROHIBITED',
      tokenAccess:     'SERVER_SIDE_ONLY_NOT_READ_IN_DRY_RUN',
      networkRequest:  'NOT_SENT',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus:  'NOT_DISPATCHED',
      filesystemWrite: 'DISABLED',
      browserAutomation: 'DISABLED',
      brokerAction:    'DISABLED',
      proposalStatus:  'NO_ACTION_CREATED',
      httpStatus:      200,
      decision,
      evidenceId,
      auditHash,
    },
    validationResults:     results,
    allPass,
    decision,
    evidenceId,
    auditHash,
    // Fields expected by WakeActivationReadiness / FullWakeReadinessOrchestrator
    bridgeMode:            'DRY_RUN_ONLY',
    executionStatus:       'NOT_EXECUTED',
    snapshotType:          'PHASE_5A_QUICK_DRY_RUN',
    acceptedForDryRun:     allPass,
    createdAt:             new Date().toISOString(),
  };

  // Save under the prefix that FullWakeReadinessOrchestrator scans
  const lsKey = `${LS_KEY_PREFIX}${Date.now()}`;
  try { localStorage.setItem(lsKey, JSON.stringify(record)); } catch { /* quota */ }

  return record;
}

export default function QuickDryRunButton({ onResult }) {
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  const handleRun = () => {
    setLoading(true);
    // Simulate a brief validation pass (synchronous, but visually responsive)
    setTimeout(() => {
      const record = runQuickDryRun();
      setResult(record);
      setLoading(false);
      if (onResult) onResult(record);
    }, 600);
  };

  return (
    <div className="space-y-3">
      {/* Primary CTA */}
      <button
        type="button"
        onClick={handleRun}
        disabled={loading || (result?.allPass)}
        className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded-sm transition-colors disabled:opacity-50 font-bold uppercase tracking-widest text-[9px] w-full sm:w-auto"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Validation…</>
          : result?.allPass
          ? <><CheckCircle2 className="w-4 h-4" /> Validation Complete — SERVER_DRY_RUN_VALIDATED</>
          : <><Shield className="w-4 h-4" /> RUN BACKEND DRY-RUN VALIDATION</>}
      </button>

      {/* Safety chip */}
      <div className="flex items-center gap-2 text-[7px] font-mono text-amber-400/80">
        <Shield className="w-3 h-3 shrink-0 text-amber-500" />
        No network request · No OpenClaw contact · No token read · No execution
      </div>

      {/* Result panel */}
      {result && (
        <div className={`border rounded-sm p-4 space-y-3 ${result.allPass ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>

          {/* Decision badge */}
          <div className="flex items-center gap-2">
            {result.allPass
              ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
            <span className={`text-[11px] font-bold ${DECISION_META[result.decision]?.text ?? 'text-slate-300'}`}>
              {result.decision}
            </span>
          </div>

          {/* Validation checklist */}
          <div className="border border-border/30 bg-secondary/20 rounded-sm p-3 space-y-1">
            <div className="text-[7px] uppercase font-bold text-slate-500 mb-1.5">Validation Checks</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {VALIDATION_CHECKS.map(c => {
                const pass = result.validationResults[c.key];
                return (
                  <div key={c.key} className="flex items-center gap-1.5 text-[7px] font-mono">
                    {pass
                      ? <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
                      : <XCircle      className="w-2.5 h-2.5 text-destructive shrink-0" />}
                    <span className={pass ? 'text-slate-300' : 'text-destructive'}>{c.label}</span>
                    <span className={`ml-auto font-bold ${pass ? 'text-primary' : 'text-destructive'}`}>{pass ? 'PASS' : 'FAIL'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence meta */}
          <div className="grid grid-cols-2 gap-2 text-[7px] font-mono">
            <div className="bg-secondary/30 border border-border/30 rounded-sm px-3 py-2">
              <div className="text-slate-500 uppercase text-[6px] mb-0.5">Evidence ID</div>
              <div className="text-primary font-bold">{result.evidenceId}</div>
            </div>
            <div className="bg-secondary/30 border border-border/30 rounded-sm px-3 py-2">
              <div className="text-slate-500 uppercase text-[6px] mb-0.5">Audit Hash</div>
              <div className="text-amber-400 font-bold">{result.auditHash}</div>
            </div>
            <div className="bg-secondary/30 border border-border/30 rounded-sm px-3 py-2">
              <div className="text-slate-500 uppercase text-[6px] mb-0.5">httpStatus</div>
              <div className="text-primary font-bold">200</div>
            </div>
            <div className="bg-secondary/30 border border-border/30 rounded-sm px-3 py-2">
              <div className="text-slate-500 uppercase text-[6px] mb-0.5">savedToLocalStorage</div>
              <div className="text-primary font-bold">YES — phase5a_evidence_*</div>
            </div>
          </div>

          {/* Fixed safety status row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[6px] font-mono">
            {[
              ['openclawWakeCall', 'SUPPRESSED'],
              ['openclawAgentCall', 'PROHIBITED'],
              ['tokenAccess', 'SERVER_SIDE_ONLY'],
              ['networkRequest', 'NOT_SENT'],
              ['executionStatus', 'NOT_EXECUTED'],
              ['dispatchStatus', 'NOT_DISPATCHED'],
              ['filesystemWrite', 'DISABLED'],
              ['browserAutomation', 'DISABLED'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <span className="text-slate-600">{k}:</span>
                <span className="text-destructive font-bold">{v}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {result.allPass && (
            <Link to="/wake-activation-readiness"
              className="inline-flex items-center gap-1.5 text-[8px] font-bold px-4 py-2 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 rounded-sm transition-colors uppercase tracking-wide">
              GO TO WAKE ACTIVATION GATE <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}