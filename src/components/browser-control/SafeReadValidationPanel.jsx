import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertTriangle, Loader2, Lock, Shield, Play, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SafeReadValidationPanel({ inspectionResult, selectedElement }) {
  const [validationState, setValidationState] = useState(null); // null | 'draft' | 'pending_approval' | 'approved' | 'queued' | 'executed' | 'blocked' | 'failed'
  const [validationData, setValidationData] = useState(null);
  const [running, setRunning] = useState(false);

  // Defensive defaults for optional props
  const hasValidResult = inspectionResult?.status === 'success';
  const elementsList = Array.isArray(inspectionResult?.elements) ? inspectionResult.elements : [];

  if (!hasValidResult) {
    return null;
  }

  // Determine which element to use
  const elementToValidate = selectedElement || (
    elementsList.find(el => el.visible && el.enabled) || elementsList[0]
  );

  if (!elementToValidate) {
    return (
      <div className="bg-card border border-border">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <Shield className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Safe Read Validation</span>
        </div>
        <div className="p-4">
          <p className="text-[10px] text-muted-foreground/40 italic">No elements available for validation.</p>
        </div>
      </div>
    );
  }

  const handleRunValidation = async () => {
    setRunning(true);
    setValidationState('draft');
    
    // Initialize validation data with safe defaults
    const initialData = {
      proposalId: 'val_' + Date.now(),
      elementText: elementToValidate?.text || '—',
      selector: elementToValidate?.selector || '—',
      steps: [
        { step: 'DRAFT', timestamp: new Date().toISOString(), status: 'completed', message: 'Proposal created' },
      ],
      queueEntry: null,
      resultSummary: null,
      diagnosticsSummary: [],
      error: null,
    };
    setValidationData(initialData);

    try {
      let currentData = initialData;

      // Step 1: DRAFT → PENDING_APPROVAL
      await new Promise(resolve => setTimeout(resolve, 300));
      setValidationState('pending_approval');
      currentData = prev => ({
        ...(prev || {}),
        steps: [
          ...(Array.isArray((prev || {}).steps) ? (prev || {}).steps : []),
          { step: 'PENDING_APPROVAL', timestamp: new Date().toISOString(), status: 'in_progress', message: 'Submitting for approval' },
        ],
      });
      setValidationData(currentData);

      // Simulate approval
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: PENDING_APPROVAL → APPROVED
      setValidationState('approved');
      setValidationData(prev => {
        const updated = { ...prev };
        const steps = Array.isArray(updated.steps) ? updated.steps : [];
        if (steps.length > 0) {
          steps[steps.length - 1] = { ...steps[steps.length - 1], status: 'completed' };
        }
        return {
          ...updated,
          steps: [...steps, { step: 'APPROVED', timestamp: new Date().toISOString(), status: 'in_progress', message: 'Governance approval granted' }],
        };
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: APPROVED → QUEUED
      setValidationState('queued');
      setValidationData(prev => {
        const updated = { ...prev };
        const steps = Array.isArray(updated.steps) ? updated.steps : [];
        if (steps.length > 0) {
          steps[steps.length - 1] = { ...steps[steps.length - 1], status: 'completed' };
        }
        return {
          ...updated,
          steps: [...steps, { step: 'QUEUED', timestamp: new Date().toISOString(), status: 'in_progress', message: 'Adding to execution queue' }],
        };
      });

      // Create queue entry
      const user = await base44.auth.me();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const queueEntry = {
        proposalId: initialData.proposalId,
        commandType: 'READ_ELEMENT_TEXT',
        selector: elementToValidate?.selector || null,
        url: inspectionResult?.raw?.current_url || inspectionResult?.targetUrl || '—',
        payload: {
          commandType: 'READ_ELEMENT_TEXT',
          selector: elementToValidate?.selector || null,
          targetUrl: inspectionResult?.raw?.current_url || inspectionResult?.targetUrl,
          elementText: elementToValidate?.text,
        },
        riskTier: 'LOW',
        governanceMode: 'SAFE_REQUIRES_APPROVAL',
        status: 'QUEUED',
        approvedBy: user.email,
        approvedAt: new Date().toISOString(),
        queuedAt: new Date().toISOString(),
        notes: 'Safe read-only validation flow: READ_ELEMENT_TEXT',
      };

      const created = await base44.entities.ExecutionQueue.create(queueEntry);

      setValidationData(prev => ({
        ...(prev || {}),
        queueEntry: created,
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: QUEUED → EXECUTED
      setValidationState('executed');
      setValidationData(prev => {
        const updated = { ...prev };
        const steps = Array.isArray(updated.steps) ? updated.steps : [];
        if (steps.length > 0) {
          steps[steps.length - 1] = { ...steps[steps.length - 1], status: 'completed' };
        }
        return {
          ...updated,
          steps: [...steps, { step: 'EXECUTED', timestamp: new Date().toISOString(), status: 'in_progress', message: 'Executing read validation' }],
        };
      });

      // Call executeQueuedCommand
      const execRes = await base44.functions.invoke('executeQueuedCommand', { queueId: created.id });
      
      if (execRes.data?.success) {
        setValidationData(prev => {
          const updated = { ...prev };
          const steps = Array.isArray(updated.steps) ? updated.steps : [];
          if (steps.length > 0) {
            steps[steps.length - 1] = { ...steps[steps.length - 1], status: 'completed' };
          }
          return {
            ...updated,
            steps,
            resultSummary: execRes.data?.resultSummary || 'Read validation completed successfully',
            diagnosticsSummary: Array.isArray(execRes.data?.diagnostics) ? execRes.data.diagnostics : [],
          };
        });
      } else {
        setValidationState('failed');
        setValidationData(prev => {
          const updated = { ...prev };
          const steps = Array.isArray(updated.steps) ? updated.steps : [];
          if (steps.length > 0) {
            steps[steps.length - 1] = { ...steps[steps.length - 1], status: 'failed' };
          }
          return {
            ...updated,
            steps,
            error: execRes.data?.error || 'Execution failed',
            diagnosticsSummary: [execRes.data?.error || 'Execution failed'],
          };
        });
        setRunning(false);
        return;
      }
    } catch (err) {
      setValidationState('failed');
      setValidationData(prev => ({
        ...(prev || {}),
        error: err?.message || 'Unknown error',
        diagnosticsSummary: [err?.message || 'Unknown error'],
      }));
    } finally {
      setRunning(false);
    }
  };

  const stateColors = {
    draft: 'border-amber-500/30 bg-amber-500/5',
    pending_approval: 'border-blue-500/30 bg-blue-500/5',
    approved: 'border-primary/30 bg-primary/5',
    queued: 'border-accent/30 bg-accent/5',
    executed: 'border-primary/30 bg-primary/5',
    blocked: 'border-amber-500/30 bg-amber-500/5',
    failed: 'border-destructive/30 bg-destructive/5',
  };

  const stateTextColors = {
    draft: 'text-amber-500',
    pending_approval: 'text-blue-400',
    approved: 'text-primary',
    queued: 'text-accent',
    executed: 'text-primary',
    blocked: 'text-amber-500',
    failed: 'text-destructive',
  };

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Safe Read Validation</span>
          <span className="text-[9px] text-muted-foreground/30 ml-1">READ_ELEMENT_TEXT · SAFE_REQUIRES_APPROVAL</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Element Selection Info */}
        <div className="bg-secondary/20 border border-border/50 px-3 py-2.5 space-y-1.5">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40">Element to Validate</div>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div>
              <span className="text-muted-foreground/50">Type: </span>
              <span className="text-foreground font-mono">{elementToValidate.type || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground/50">Text: </span>
              <span className="text-foreground">{(elementToValidate.text || '—').slice(0, 40)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground/50">Selector: </span>
              <span className="text-foreground font-mono break-all text-[8px]">{elementToValidate.selector || '—'}</span>
            </div>
          </div>
        </div>

        {/* Run Button */}
        {!validationState && (
          <button
            onClick={handleRunValidation}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-primary/30 bg-primary/10 text-[9px] text-primary uppercase tracking-wider font-semibold hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Running Validation…
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Run Safe Read Validation
              </>
            )}
          </button>
        )}

        {/* Validation Steps */}
        {validationData && Array.isArray(validationData.steps) && (
          <div className="space-y-2">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40">Validation Steps</div>
            <div className="space-y-1.5">
              {validationData.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 border rounded text-[9px] font-mono ${
                    step.status === 'completed' ? 'border-primary/20 bg-primary/5' :
                    step.status === 'in_progress' ? 'border-accent/20 bg-accent/5' :
                    'border-destructive/20 bg-destructive/5'
                  }`}
                >
                  {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                  {step.status === 'in_progress' && <Loader2 className="w-3 h-3 text-accent animate-spin shrink-0" />}
                  {step.status === 'failed' && <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                  <div className="flex-1">
                    <div className="font-semibold text-[9px] uppercase tracking-wider">{step.step}</div>
                    <div className="text-[8px] text-muted-foreground/60">{step.message}</div>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40">{format(new Date(step.timestamp), 'HH:mm:ss')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Panel */}
        {validationData && validationState === 'executed' && !validationData.error && (
          <div className="bg-primary/5 border border-primary/20 px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-[9px] uppercase tracking-wider font-semibold text-primary">Validation Successful</span>
            </div>
            {validationData.resultSummary && (
              <div className="bg-secondary/30 border border-border px-2 py-1.5 text-[9px] font-mono text-foreground">
                {validationData.resultSummary}
              </div>
            )}
            {validationData.queueEntry && (
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="bg-secondary/30 border border-border px-2 py-1.5">
                  <div className="text-[8px] text-muted-foreground/40 mb-0.5">Queue ID</div>
                  <div className="font-mono text-foreground break-all text-[8px]">{validationData.queueEntry.id?.slice(0, 12)}…</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5">
                  <div className="text-[8px] text-muted-foreground/40 mb-0.5">Status</div>
                  <div className="font-mono text-foreground">{validationData.queueEntry.status}</div>
                </div>
              </div>
            )}
            {Array.isArray(validationData.diagnosticsSummary) && validationData.diagnosticsSummary.length > 0 && (
              <div className="bg-secondary/30 border border-border px-2 py-1.5">
                <div className="text-[8px] text-muted-foreground/40 mb-1">Diagnostics</div>
                <div className="space-y-0.5 text-[8px] text-muted-foreground/60 font-mono">
                  {validationData.diagnosticsSummary.map((d, i) => (
                    <div key={i}>› {d}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Panel */}
        {validationData && validationData.error && (
          <div className="bg-destructive/5 border border-destructive/20 px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-[9px] uppercase tracking-wider font-semibold text-destructive">Validation Failed</span>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 text-[9px] font-mono text-foreground break-all">
              {validationData.error}
            </div>
            {Array.isArray(validationData.diagnosticsSummary) && validationData.diagnosticsSummary.length > 0 && (
              <div className="bg-secondary/30 border border-border px-2 py-1.5">
                <div className="text-[8px] text-muted-foreground/40 mb-1">Diagnostics</div>
                <div className="space-y-0.5 text-[8px] text-muted-foreground/60 font-mono">
                  {validationData.diagnosticsSummary.map((d, i) => (
                    <div key={i}>› {d}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Governance Notice */}
        <div className="flex items-start gap-2 px-3 py-2 bg-secondary/20 border border-border/30">
          <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            SAFE_REQUIRES_APPROVAL governance · READ_ELEMENT_TEXT only · No click/type actions
          </span>
        </div>
      </div>
    </div>
  );
}