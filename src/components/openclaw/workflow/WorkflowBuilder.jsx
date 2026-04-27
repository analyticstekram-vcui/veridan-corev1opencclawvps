import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import WorkflowStepBuilder from './WorkflowStepBuilder';
import { validateParams, CAPABILITY_MAP } from '@/lib/capabilityRegistry';

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

function newStep(index) {
  return { stepId: `step_${index + 1}`, capabilityId: '', entityScope: '', riskLevel: 'medium', params: {}, onFailure: 'STOP', timeoutMs: 5000, dependsOn: [] };
}

export default function WorkflowBuilder({ currentUser, onCreated, onCancel, initialName = '', initialDescription = '', initialSteps = null }) {
  const [name, setName]             = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [steps, setSteps]           = useState(initialSteps ?? [newStep(0)]);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState([]);

  const addStep = () => setSteps(s => [...s, newStep(s.length)]);
  const removeStep = (i) => setSteps(s => s.filter((_, idx) => idx !== i));
  const updateStep = (i, step) => setSteps(s => s.map((st, idx) => idx === i ? step : st));

  const validate = () => {
    const errs = [];
    if (!name.trim()) errs.push('Workflow name is required.');
    if (steps.length === 0) errs.push('At least one step is required.');
    const stepIds = new Set();
    steps.forEach((step, i) => {
      if (!step.stepId?.trim()) errs.push(`Step ${i + 1}: Step ID is required.`);
      if (stepIds.has(step.stepId)) errs.push(`Step ${i + 1}: Duplicate Step ID '${step.stepId}'.`);
      stepIds.add(step.stepId);
      if (!step.capabilityId) errs.push(`Step ${i + 1}: Capability is required.`);
      if (!step.entityScope) errs.push(`Step ${i + 1}: Entity scope is required.`);
      const cap = CAPABILITY_MAP[step.capabilityId];
      if (cap) {
        const paramErrors = validateParams(cap, step.params || {});
        paramErrors.forEach(e => errs.push(`Step ${i + 1} (${cap.name}): ${e}`));
        if (cap.riskLevel === 'high') errs.push(`Step ${i + 1}: HIGH risk capability '${step.capabilityId}' is blocked.`);
      }
    });
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    const res = await base44.functions.invoke('openclawWorkflowEngine', {
      action: 'create',
      name: name.trim(),
      description: description.trim(),
      steps,
    });
    setSubmitting(false);
    if (res.data?.success) onCreated(res.data.workflow);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Name + Description */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Workflow Name<span className="text-destructive">*</span></label>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Login & Capture Session" autoFocus />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Description</label>
          <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this workflow do?" />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Steps ({steps.length})</div>
          <button onClick={addStep} className="flex items-center gap-1 px-2.5 py-1 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <Plus className="w-3 h-3" /> Add Step
          </button>
        </div>
        {steps.map((step, i) => (
          <WorkflowStepBuilder key={i} step={step} index={i} allSteps={steps} onChange={s => updateStep(i, s)} onRemove={() => removeStep(i)} />
        ))}
      </div>

      {/* Preview */}
      <div>
        <button type="button" onClick={() => setShowPreview(v => !v)} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors">
          {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showPreview ? 'Hide' : 'Preview'} workflow plan
        </button>
        {showPreview && (
          <pre className="mt-2 px-3 py-2 bg-background border border-border text-[10px] text-muted-foreground overflow-auto max-h-48">
            {JSON.stringify({ name, description, steps }, null, 2)}
          </pre>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1 bg-destructive/5 border border-destructive/20 p-3">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-destructive">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {e}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <button onClick={onCancel} className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50">
          {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Submit for Governance Review
        </button>
      </div>
    </div>
  );
}