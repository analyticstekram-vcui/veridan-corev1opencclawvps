/**
 * OperatorReviewPanel — localStorage-only operator review dashboard.
 * Reads 3 localStorage keys, creates separate review records, no source mutations.
 * No execution, Codex, OpenClaw dispatch, MCP, browser automation, or external APIs.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEYS = {
  PROPOSED_ACTIONS: 'veridanAiProposedActions',
  CODEX_TASKS: 'veridanAiCodexTaskDrafts',
  OPENCLAW_TASKS: 'veridanAiOpenClawTaskPlans',
};

const REVIEW_RECORDS_KEY = 'veridanAiOperatorReviewRecords';
const MAX_RECORDS = 100;

const REVIEW_TYPES = {
  PROPOSED_ACTION: 'PROPOSED_ACTION_REVIEW',
  CODEX_TASK: 'CODEX_TASK_REVIEW',
  OPENCLAW_TASK: 'OPENCLAW_TASK_REVIEW',
};

const REVIEW_DECISIONS = ['APPROVED', 'REJECTED', 'NEEDS_CHANGES'];

const DECISION_COLORS = {
  'APPROVED': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  'REJECTED': 'text-destructive border-destructive/30 bg-destructive/5',
  'NEEDS_CHANGES': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
};

const SAFETY_CLAIMS = [
  'Operator review records only',
  'No live execution',
  'No Codex execution',
  'No OpenClaw dispatch',
  'No MCP calls',
  'No browser automation',
  'No external API mutation',
  'No backend mutation',
  'No credential handling',
  'Browser-only export',
];

function loadProposedActions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROPOSED_ACTIONS) || '[]'); } catch { return []; }
}

function loadCodexTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CODEX_TASKS) || '[]'); } catch { return []; }
}

function loadOpenClawTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.OPENCLAW_TASKS) || '[]'); } catch { return []; }
}

function loadReviewRecords() {
  try { return JSON.parse(localStorage.getItem(REVIEW_RECORDS_KEY) || '[]'); } catch { return []; }
}

function saveReviewRecords(records) {
  try { localStorage.setItem(REVIEW_RECORDS_KEY, JSON.stringify(records)); } catch {}
}

export default function OperatorReviewPanel() {
  const [proposedActions, setProposedActions] = useState([]);
  const [codexTasks, setCodexTasks] = useState([]);
  const [openClawTasks, setOpenClawTasks] = useState([]);
  const [reviewRecords, setReviewRecords] = useState([]);

  const [expandedSections, setExpandedSections] = useState({
    proposed: true,
    codex: true,
    openclaw: true,
    history: true,
  });

  const [reviewForms, setReviewForms] = useState({
    proposed: {},
    codex: {},
    openclaw: {},
  });

  useEffect(() => {
    setProposedActions(loadProposedActions());
    setCodexTasks(loadCodexTasks());
    setOpenClawTasks(loadOpenClawTasks());
    setReviewRecords(loadReviewRecords());
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const setFormField = (type, recordId, field, value) => {
    setReviewForms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [recordId]: {
          ...(prev[type][recordId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const saveReview = (recordId, recordTitle, currentStatus, reviewType) => {
    const form = reviewForms[reviewType === REVIEW_TYPES.PROPOSED_ACTION ? 'proposed' : reviewType === REVIEW_TYPES.CODEX_TASK ? 'codex' : 'openclaw'][recordId];

    if (!form?.reviewerName?.trim() || !form?.reviewDecision) return;

    const review = {
      reviewId: Date.now().toString(),
      reviewedAt: new Date().toISOString(),
      reviewType,
      sourceRecordId: recordId,
      sourceTitle: recordTitle,
      sourceStatus: currentStatus,
      reviewerName: form.reviewerName,
      reviewDecision: form.reviewDecision,
      reviewNote: form.reviewNote || '',
      executionAllowed: false,
      dispatchAllowed: false,
      codexExecutionAllowed: false,
      openClawDispatchAllowed: false,
      backendMutationAllowed: false,
      safetyClaims: SAFETY_CLAIMS,
    };

    const updated = [review, ...reviewRecords].slice(0, MAX_RECORDS);
    setReviewRecords(updated);
    saveReviewRecords(updated);

    // Clear form
    setReviewForms(prev => ({
      ...prev,
      [reviewType === REVIEW_TYPES.PROPOSED_ACTION ? 'proposed' : reviewType === REVIEW_TYPES.CODEX_TASK ? 'codex' : 'openclaw']: {
        ...prev[reviewType === REVIEW_TYPES.PROPOSED_ACTION ? 'proposed' : reviewType === REVIEW_TYPES.CODEX_TASK ? 'codex' : 'openclaw'],
        [recordId]: {},
      },
    }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AI_OPERATOR_REVIEW_RECORDS',
      operatorReviewRecords: reviewRecords,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-operator-reviews-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reviewableProposedActions = proposedActions.filter(a =>
    ['NEEDS_REVIEW', 'APPROVED_FOR_PLANNING'].includes(a.actionStatus)
  );

  const reviewableCodexTasks = codexTasks.filter(t =>
    ['NEEDS_REVIEW', 'APPROVED_FOR_MANUAL_CODEX_RUN'].includes(t.taskStatus)
  );

  const reviewableOpenClawTasks = openClawTasks.filter(t =>
    ['NEEDS_REVIEW', 'APPROVED_FOR_PLANNING'].includes(t.taskStatus)
  );

  const counts = {
    total: reviewRecords.length,
    proposedActionReviews: reviewRecords.filter(r => r.reviewType === REVIEW_TYPES.PROPOSED_ACTION).length,
    codexTaskReviews: reviewRecords.filter(r => r.reviewType === REVIEW_TYPES.CODEX_TASK).length,
    openClawTaskReviews: reviewRecords.filter(r => r.reviewType === REVIEW_TYPES.OPENCLAW_TASK).length,
    approved: reviewRecords.filter(r => r.reviewDecision === 'APPROVED').length,
    rejected: reviewRecords.filter(r => r.reviewDecision === 'REJECTED').length,
    needsChanges: reviewRecords.filter(r => r.reviewDecision === 'NEEDS_CHANGES').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Operator Review Dashboard</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only review records · No execution · No mutation</div>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
          <Download className="w-3 h-3" /> Export Reviews
        </button>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. Reviews do not execute actions, run Codex, dispatch OpenClaw, or mutate systems.</div>
          <div className="text-[8px] text-destructive/70">No execution · No Codex · No OpenClaw · No MCP · No browser automation · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Review Records Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total', value: counts.total, color: 'text-slate-200' },
            { label: 'Approved', value: counts.approved, color: 'text-emerald-400' },
            { label: 'Rejected', value: counts.rejected, color: 'text-destructive' },
            { label: 'Needs Changes', value: counts.needsChanges, color: 'text-amber-400' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {[
            { label: 'Proposed Action Reviews', value: counts.proposedActionReviews },
            { label: 'Codex Task Reviews', value: counts.codexTaskReviews },
            { label: 'OpenClaw Task Reviews', value: counts.openClawTaskReviews },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[8px] font-bold font-mono text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed Actions Review Queue */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <button
          onClick={() => toggleSection('proposed')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold uppercase text-slate-300">Proposed Actions Review Queue</div>
            <span className="text-[8px] font-mono bg-secondary/40 px-1.5 py-0.5 rounded text-primary">{reviewableProposedActions.length}</span>
          </div>
          {expandedSections.proposed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.proposed && (
          <div className="p-4 space-y-4">
            {reviewableProposedActions.length === 0 ? (
              <div className="text-[8px] text-slate-500">No proposed actions pending review.</div>
            ) : (
              reviewableProposedActions.map(action => (
                <div key={action.id} className="border border-border/40 bg-secondary/10 rounded-sm p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold text-slate-200">{action.actionTitle}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Status: {action.actionStatus} · Risk: {action.riskLevel}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                      placeholder="Reviewer name"
                      value={reviewForms.proposed[action.id]?.reviewerName || ''}
                      onChange={e => setFormField('proposed', action.id, 'reviewerName', e.target.value)}
                    />
                    <select className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                      value={reviewForms.proposed[action.id]?.reviewDecision || ''} 
                      onChange={e => setFormField('proposed', action.id, 'reviewDecision', e.target.value)}>
                      <option value="">— Decision —</option>
                      {REVIEW_DECISIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input
                      className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                      placeholder="Review note"
                      value={reviewForms.proposed[action.id]?.reviewNote || ''}
                      onChange={e => setFormField('proposed', action.id, 'reviewNote', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => saveReview(action.id, action.actionTitle, action.actionStatus, REVIEW_TYPES.PROPOSED_ACTION)}
                    disabled={!reviewForms.proposed[action.id]?.reviewerName?.trim() || !reviewForms.proposed[action.id]?.reviewDecision}
                    className="w-full px-3 py-1.5 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
                    Save Proposed Action Review
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Codex Task Draft Review Queue */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <button
          onClick={() => toggleSection('codex')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold uppercase text-slate-300">Codex Task Draft Review Queue</div>
            <span className="text-[8px] font-mono bg-secondary/40 px-1.5 py-0.5 rounded text-primary">{reviewableCodexTasks.length}</span>
          </div>
          {expandedSections.codex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.codex && (
          <div className="p-4 space-y-4">
            {reviewableCodexTasks.length === 0 ? (
              <div className="text-[8px] text-slate-500">No Codex task drafts pending review.</div>
            ) : (
              reviewableCodexTasks.map(task => (
                <div key={task.id} className="border border-border/40 bg-secondary/10 rounded-sm p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold text-slate-200">{task.taskTitle}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Repo: {task.targetRepo} · Risk: {task.taskRisk}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                      placeholder="Reviewer name"
                      value={reviewForms.codex[task.id]?.reviewerName || ''}
                      onChange={e => setFormField('codex', task.id, 'reviewerName', e.target.value)}
                    />
                    <select className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                      value={reviewForms.codex[task.id]?.reviewDecision || ''} 
                      onChange={e => setFormField('codex', task.id, 'reviewDecision', e.target.value)}>
                      <option value="">— Decision —</option>
                      {REVIEW_DECISIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input
                      className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                      placeholder="Review note"
                      value={reviewForms.codex[task.id]?.reviewNote || ''}
                      onChange={e => setFormField('codex', task.id, 'reviewNote', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => saveReview(task.id, task.taskTitle, task.taskStatus, REVIEW_TYPES.CODEX_TASK)}
                    disabled={!reviewForms.codex[task.id]?.reviewerName?.trim() || !reviewForms.codex[task.id]?.reviewDecision}
                    className="w-full px-3 py-1.5 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
                    Save Codex Task Review
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* OpenClaw Task Plan Review Queue */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <button
          onClick={() => toggleSection('openclaw')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold uppercase text-slate-300">OpenClaw Task Plan Review Queue</div>
            <span className="text-[8px] font-mono bg-secondary/40 px-1.5 py-0.5 rounded text-primary">{reviewableOpenClawTasks.length}</span>
          </div>
          {expandedSections.openclaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.openclaw && (
          <div className="p-4 space-y-4">
            {reviewableOpenClawTasks.length === 0 ? (
              <div className="text-[8px] text-slate-500">No OpenClaw task plans pending review.</div>
            ) : (
              reviewableOpenClawTasks.map(task => (
                <div key={task.id} className="border border-border/40 bg-secondary/10 rounded-sm p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold text-slate-200">{task.taskTitle}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Type: {task.openClawTaskType} · Risk: {task.taskRisk}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                      placeholder="Reviewer name"
                      value={reviewForms.openclaw[task.id]?.reviewerName || ''}
                      onChange={e => setFormField('openclaw', task.id, 'reviewerName', e.target.value)}
                    />
                    <select className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                      value={reviewForms.openclaw[task.id]?.reviewDecision || ''} 
                      onChange={e => setFormField('openclaw', task.id, 'reviewDecision', e.target.value)}>
                      <option value="">— Decision —</option>
                      {REVIEW_DECISIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input
                      className="bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                      placeholder="Review note"
                      value={reviewForms.openclaw[task.id]?.reviewNote || ''}
                      onChange={e => setFormField('openclaw', task.id, 'reviewNote', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => saveReview(task.id, task.taskTitle, task.taskStatus, REVIEW_TYPES.OPENCLAW_TASK)}
                    disabled={!reviewForms.openclaw[task.id]?.reviewerName?.trim() || !reviewForms.openclaw[task.id]?.reviewDecision}
                    className="w-full px-3 py-1.5 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
                    Save OpenClaw Task Review
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Review History */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <button
          onClick={() => toggleSection('history')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold uppercase text-slate-300">Review History</div>
            <span className="text-[8px] font-mono bg-secondary/40 px-1.5 py-0.5 rounded text-primary">{reviewRecords.length}</span>
          </div>
          {expandedSections.history ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.history && (
          <div className="overflow-x-auto">
            {reviewRecords.length === 0 ? (
              <div className="px-4 py-8 text-center text-[8px] text-slate-500">No review records yet.</div>
            ) : (
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Reviewed At', 'Type', 'Title', 'Reviewer', 'Decision', 'Execution', 'Codex', 'OpenClaw'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {reviewRecords.map(review => (
                    <tr key={review.reviewId} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(review.reviewedAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-primary/80 whitespace-nowrap text-[7px]">{review.reviewType.split('_')[0]}</td>
                      <td className="px-3 py-2 text-slate-200 whitespace-nowrap max-w-[150px] truncate font-bold">{review.sourceTitle}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{review.reviewerName}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${DECISION_COLORS[review.reviewDecision] || ''}`}>
                          {review.reviewDecision}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-destructive font-bold text-[7px] whitespace-nowrap">{review.executionAllowed ? 'ENABLED' : 'DISABLED'}</td>
                      <td className="px-3 py-2 text-destructive font-bold text-[7px] whitespace-nowrap">{review.codexExecutionAllowed ? 'ENABLED' : 'DISABLED'}</td>
                      <td className="px-3 py-2 text-destructive font-bold text-[7px] whitespace-nowrap">{review.openClawDispatchAllowed ? 'ENABLED' : 'DISABLED'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>

    </div>
  );
}