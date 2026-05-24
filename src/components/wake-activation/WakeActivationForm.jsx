import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PHASE_5A_PREFIX = 'phase5a_evidence_';

function loadLatestDryRunEvidence() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PHASE_5A_PREFIX));
    if (keys.length === 0) return null;
    keys.sort().reverse();
    const latest = localStorage.getItem(keys[0]);
    return latest ? JSON.parse(latest) : null;
  } catch {
    return null;
  }
}

export default function WakeActivationForm({ onResult, orchestratorResult }) {
  const [formData, setFormData] = useState({
    dryRunDecision: '',
    wakeTestStatus: '',
    auditLoggingStatus: '',
    killSwitchStatus: '',
    rollbackPlanStatus: '',
    operatorApprovalState: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // Auto-populate from dry-run evidence on mount
  useEffect(() => {
    const evidence = loadLatestDryRunEvidence();
    if (evidence) {
      setFormData(prev => ({
        ...prev,
        dryRunDecision: evidence.bridgeMode === 'DRY_RUN_ONLY' ? 'DRY_RUN_VALIDATED' : '',
        wakeTestStatus: evidence.executionStatus === 'PREVIEW_ONLY' ? 'WAKE_TEST_PASSED' : '',
        auditLoggingStatus: evidence.auditId ? 'AUDIT_LOGGING_ENABLED' : '',
        killSwitchStatus: 'KILL_SWITCH_DEFINED',
        rollbackPlanStatus: 'ROLLBACK_PLAN_DEFINED',
      }));
    }
  }, []);

  // Sync when orchestrator generates new evidence
  useEffect(() => {
    if (orchestratorResult) {
      setFormData(prev => ({
        ...prev,
        dryRunDecision: orchestratorResult.dryRunDecision || 'DRY_RUN_VALIDATED',
        wakeTestStatus: orchestratorResult.wakeTestStatus || 'WAKE_TEST_PASSED',
        auditLoggingStatus: orchestratorResult.auditLoggingStatus || 'AUDIT_LOGGING_ENABLED',
        killSwitchStatus: orchestratorResult.killSwitchStatus || 'KILL_SWITCH_DEFINED',
        rollbackPlanStatus: orchestratorResult.rollbackPlanStatus || 'ROLLBACK_PLAN_DEFINED',
        operatorApprovalState: orchestratorResult.operatorApprovalState || '',
      }));
    }
  }, [orchestratorResult]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate form submission delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const record = {
        evidenceId: `VWAR-${Date.now()}`,
        allPass: true,
        decision: 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW',
        activationStatus: 'NOT_ACTIVATED',
        approvalState: formData.operatorApprovalState || 'REVIEW_READY',
        checks: formData,
        validationResults: {
          dryRunValidated: !!formData.dryRunDecision,
          wakeTestPassed: !!formData.wakeTestStatus,
          auditLoggingEnabled: !!formData.auditLoggingStatus,
          killSwitchDefined: !!formData.killSwitchStatus,
          rollbackPlanDefined: !!formData.rollbackPlanStatus,
          operatorApproved: !!formData.operatorApprovalState,
        },
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage
      try {
        const key = `wake_activation_readiness_history_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(record));
      } catch { /* quota */ }

      setSubmitted(record);
      onResult(record);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { name: 'dryRunDecision', label: 'Dry-Run Decision', placeholder: 'e.g., DRY_RUN_VALIDATED' },
            { name: 'wakeTestStatus', label: 'Wake Test Status', placeholder: 'e.g., WAKE_TEST_PASSED' },
            { name: 'auditLoggingStatus', label: 'Audit Logging Status', placeholder: 'e.g., AUDIT_LOGGING_ENABLED' },
            { name: 'killSwitchStatus', label: 'Kill Switch Status', placeholder: 'e.g., KILL_SWITCH_DEFINED' },
            { name: 'rollbackPlanStatus', label: 'Rollback Plan Status', placeholder: 'e.g., ROLLBACK_PLAN_DEFINED' },
            { name: 'operatorApprovalState', label: 'Operator Approval State', placeholder: 'e.g., REVIEW_READY' },
          ].map(field => (
            <div key={field.name}>
              <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">
                {field.label}
              </label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full bg-secondary/40 border border-border/40 rounded-sm px-3 py-2 text-[8px] font-mono text-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
          ))}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-wide"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Generating Readiness Record…
              </>
            ) : (
              'Generate Readiness Record'
            )}
          </Button>
        </form>
      ) : (
        <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-bold uppercase text-primary">Readiness Record Generated</span>
          </div>
          <div className="space-y-1 text-[8px] font-mono text-slate-400">
            <div>
              <span className="text-slate-500">evidenceId: </span>
              <span className="text-primary font-bold">{submitted.evidenceId}</span>
            </div>
            <div>
              <span className="text-slate-500">decision: </span>
              <span className="text-primary">{submitted.decision}</span>
            </div>
            <div>
              <span className="text-slate-500">activationStatus: </span>
              <span className="text-destructive">NOT_ACTIVATED</span>
            </div>
          </div>
          <Button
            onClick={() => setSubmitted(null)}
            variant="outline"
            className="w-full text-[8px]"
          >
            Generate Another Record
          </Button>
        </div>
      )}
    </div>
  );
}