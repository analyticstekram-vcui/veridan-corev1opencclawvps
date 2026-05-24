import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  evaluateReadiness, generateEvidenceId, generateAuditHash, READINESS_CHECKS,
} from './wakeActivationContracts';

const PHASE_5A_PREFIX = 'phase5a_evidence_';
const LS_HISTORY_KEY  = 'wake_activation_readiness_history';

const VALID_APPROVAL_STATES = ['REVIEW_READY', 'APPROVED'];

function loadLatestDryRunEvidence() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PHASE_5A_PREFIX));
    if (keys.length === 0) return null;
    keys.sort().reverse();
    const latest = localStorage.getItem(keys[0]);
    return latest ? JSON.parse(latest) : null;
  } catch { return null; }
}

function saveReadinessRecord(record) {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(record);
    if (arr.length > 20) arr.length = 20;
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(arr));
  } catch { /* quota */ }
}

const DEFAULT_FORM = {
  dryRunDecision:        'SERVER_DRY_RUN_VALIDATED',
  localWakeTestStatus:   'HTTP_200_CONFIRMED',
  openClawServiceStatus: 'ACTIVE',
  tokenBoundaryStatus:   'SERVER_SIDE_ONLY',
  agentEndpointStatus:   'PROHIBITED',
  browserAutomationStatus: 'DISABLED',
  filesystemWriteStatus: 'DISABLED',
  brokerStatus:          'NOT_CONNECTED',
  auditLoggingStatus:    'PLANNED',
  killSwitchStatus:      'PLANNED',
  rollbackPlanStatus:    'PLANNED',
  operatorApprovalState: '',
};

const FIELD_DEFS = [
  { name: 'dryRunDecision',         label: 'Dry-Run Decision',          placeholder: 'SERVER_DRY_RUN_VALIDATED' },
  { name: 'localWakeTestStatus',    label: 'Local Wake Test Status',    placeholder: 'HTTP_200_CONFIRMED' },
  { name: 'openClawServiceStatus',  label: 'OpenClaw Service Status',   placeholder: 'ACTIVE' },
  { name: 'tokenBoundaryStatus',    label: 'Token Boundary Status',     placeholder: 'SERVER_SIDE_ONLY' },
  { name: 'agentEndpointStatus',    label: 'Agent Endpoint Status',     placeholder: 'PROHIBITED' },
  { name: 'browserAutomationStatus',label: 'Browser Automation Status', placeholder: 'DISABLED' },
  { name: 'filesystemWriteStatus',  label: 'Filesystem Write Status',   placeholder: 'DISABLED' },
  { name: 'brokerStatus',           label: 'Broker Status',             placeholder: 'NOT_CONNECTED' },
  { name: 'auditLoggingStatus',     label: 'Audit Logging Status',      placeholder: 'PLANNED or ENABLED' },
  { name: 'killSwitchStatus',       label: 'Kill Switch Status',        placeholder: 'DEFINED or PLANNED' },
  { name: 'rollbackPlanStatus',     label: 'Rollback Plan Status',      placeholder: 'DEFINED or PLANNED' },
  { name: 'operatorApprovalState',  label: 'Operator Approval State',   placeholder: 'REVIEW_READY or APPROVED', highlight: true },
];

export default function WakeActivationForm({ onResult, orchestratorResult }) {
  const [formData, setFormData]   = useState({ ...DEFAULT_FORM });
  const [loading,  setLoading]    = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // Auto-populate from dry-run evidence on mount
  useEffect(() => {
    const evidence = loadLatestDryRunEvidence();
    if (evidence) {
      setFormData(prev => ({
        ...prev,
        dryRunDecision: evidence.bridgeMode === 'DRY_RUN_ONLY' || evidence.snapshotType?.includes('PHASE_5A')
          ? 'SERVER_DRY_RUN_VALIDATED'
          : prev.dryRunDecision,
        auditLoggingStatus: 'PLANNED',
        killSwitchStatus:   'PLANNED',
        rollbackPlanStatus: 'PLANNED',
      }));
    }
  }, []);

  // Sync non-approval fields when orchestrator generates new evidence (never override operator input)
  useEffect(() => {
    if (!orchestratorResult) return;
    const f = orchestratorResult.form || {};
    setFormData(prev => ({
      ...prev,
      dryRunDecision:         f.dryRunDecision         || prev.dryRunDecision,
      localWakeTestStatus:    f.localWakeTestStatus     || prev.localWakeTestStatus,
      openClawServiceStatus:  f.openClawServiceStatus   || prev.openClawServiceStatus,
      tokenBoundaryStatus:    f.tokenBoundaryStatus     || prev.tokenBoundaryStatus,
      agentEndpointStatus:    f.agentEndpointStatus     || prev.agentEndpointStatus,
      browserAutomationStatus:f.browserAutomationStatus || prev.browserAutomationStatus,
      filesystemWriteStatus:  f.filesystemWriteStatus   || prev.filesystemWriteStatus,
      brokerStatus:           f.brokerStatus            || prev.brokerStatus,
      auditLoggingStatus:     f.auditLoggingStatus      || prev.auditLoggingStatus,
      killSwitchStatus:       f.killSwitchStatus        || prev.killSwitchStatus,
      rollbackPlanStatus:     f.rollbackPlanStatus      || prev.rollbackPlanStatus,
      // Only set approval from orchestrator if operator hasn't typed anything yet
      operatorApprovalState: prev.operatorApprovalState
        || (VALID_APPROVAL_STATES.includes(f.operatorApprovalState) ? f.operatorApprovalState : prev.operatorApprovalState),
    }));
  }, [orchestratorResult]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      // Normalise the approval state — trim whitespace and uppercase
      const approvalRaw   = (formData.operatorApprovalState || '').trim().toUpperCase();
      const approvalValid = VALID_APPROVAL_STATES.includes(approvalRaw);
      const approvalFinal = approvalRaw || 'PENDING';

      // Build the canonical form object that evaluateReadiness expects
      const canonicalForm = {
        ...formData,
        operatorApprovalState: approvalFinal,
      };

      const { checks, allPass, decision } = evaluateReadiness(canonicalForm);

      const checksPassed = Object.values(checks).filter(Boolean).length;
      const checksTotal  = READINESS_CHECKS.length;

      const ts         = new Date().toISOString();
      const evidenceId = generateEvidenceId();
      const auditHash  = generateAuditHash(canonicalForm, evidenceId, ts);

      const record = {
        evidenceId,
        auditHash,
        generatedAt:      ts,
        createdAt:        ts,
        allPass,
        decision,
        activationStatus: 'NOT_ACTIVATED',
        executionStatus:  'NOT_EXECUTED',
        dispatchStatus:   'NOT_DISPATCHED',
        validationResults: checks,
        checksPassed,
        checksTotal,
        approvalState:    approvalFinal,
        form:             canonicalForm,
      };

      saveReadinessRecord(record);
      setSubmitted(record);
      onResult(record);
    } finally {
      setLoading(false);
    }
  };

  const approvalInput = (formData.operatorApprovalState || '').trim().toUpperCase();
  const approvalOk    = VALID_APPROVAL_STATES.includes(approvalInput);

  return (
    <div className="space-y-4">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          {FIELD_DEFS.map(field => (
            <div key={field.name}>
              <label className={`text-[8px] font-bold uppercase mb-1 block ${field.highlight ? 'text-amber-400' : 'text-slate-400'}`}>
                {field.label}
                {field.highlight && <span className="ml-1 text-amber-500">← required for 16/16</span>}
              </label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className={`w-full bg-secondary/40 border rounded-sm px-3 py-2 text-[8px] font-mono text-foreground focus:outline-none transition-colors ${
                  field.highlight
                    ? approvalOk
                      ? 'border-primary/60 focus:border-primary'
                      : 'border-amber-500/50 focus:border-amber-400'
                    : 'border-border/40 focus:border-primary/40'
                }`}
              />
              {field.highlight && !approvalOk && formData.operatorApprovalState && (
                <div className="text-[7px] text-amber-400 mt-0.5 font-mono">
                  Must be REVIEW_READY or APPROVED to pass check 16/16
                </div>
              )}
              {field.highlight && approvalOk && (
                <div className="text-[7px] text-primary mt-0.5 font-mono">✓ Valid — check 16/16 will PASS</div>
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-wide mt-2"
          >
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin mr-2" />Generating…</>
              : 'Generate Readiness Record'}
          </Button>
        </form>
      ) : (
        <div className={`border rounded-sm p-4 space-y-3 ${submitted.allPass ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <div className="flex items-center gap-2">
            {submitted.allPass
              ? <CheckCircle2 className="w-4 h-4 text-primary" />
              : <XCircle className="w-4 h-4 text-amber-400" />}
            <span className={`text-[9px] font-bold uppercase ${submitted.allPass ? 'text-primary' : 'text-amber-400'}`}>
              {submitted.allPass ? 'Readiness Record Generated — READY' : 'Readiness Record Generated — HOLD'}
            </span>
          </div>
          <div className="space-y-1 text-[8px] font-mono text-slate-400">
            <div><span className="text-slate-500">evidenceId: </span><span className="text-primary font-bold">{submitted.evidenceId}</span></div>
            <div><span className="text-slate-500">decision: </span><span className={submitted.allPass ? 'text-primary' : 'text-amber-400'}>{submitted.decision}</span></div>
            <div><span className="text-slate-500">checks: </span><span className="text-primary">{submitted.checksPassed}/{submitted.checksTotal}</span></div>
            <div><span className="text-slate-500">approval: </span><span className={submitted.allPass ? 'text-primary' : 'text-amber-400'}>{submitted.approvalState}</span></div>
            <div><span className="text-slate-500">activationStatus: </span><span className="text-destructive">NOT_ACTIVATED</span></div>
            <div><span className="text-slate-500">executionStatus: </span><span className="text-destructive">NOT_EXECUTED</span></div>
          </div>
          <Button onClick={() => setSubmitted(null)} variant="outline" className="w-full text-[8px]">
            Generate Another Record
          </Button>
        </div>
      )}
    </div>
  );
}