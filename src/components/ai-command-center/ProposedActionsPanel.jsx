/**
 * ProposedActionsPanel — localStorage-only proposed action tracker.
 * Reads 4 localStorage keys, stores proposed actions, automatic safety evaluation.
 * No AI runtime, Codex, OpenClaw dispatch, or external API calls.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download } from 'lucide-react';

const STORAGE_KEYS = {
  SYSTEM_BRIEF: 'veridanAiCommandCenterSystemBriefSnapshot',
  TRADING: 'veridanTradingModuleStatusSnapshot',
  PUBLIC_CREDIT: 'veridanPublicCreditModuleStatusSnapshot',
  BUSINESS_FORMATION: 'veridanBusinessFormationModuleStatusSnapshot',
};

const PROPOSED_ACTIONS_KEY = 'veridanAiProposedActions';
const MAX_RECORDS = 100;

const SOURCE_MODULES = [
  'Trading',
  'Public Credit',
  'Business Formation',
  'OpenClaw Governance',
  'AI Command Center',
  'System',
];

const ACTION_TYPES = [
  'Review',
  'Plan',
  'Refactor',
  'Research',
  'Prepare Offline Action',
  'Create Codex Task Draft',
  'Create OpenClaw Task Draft',
  'Other',
];

const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const ACTION_STATUSES = ['DRAFT', 'NEEDS_REVIEW', 'APPROVED_FOR_PLANNING', 'REJECTED', 'DISABLED'];

const STATUS_COLORS = {
  'DRAFT': 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'NEEDS_REVIEW': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'APPROVED_FOR_PLANNING': 'text-primary border-primary/30 bg-primary/5',
  'REJECTED': 'text-destructive border-destructive/30 bg-destructive/5',
  'DISABLED': 'text-slate-500 border-slate-500/30 bg-slate-500/5',
};

const RISK_COLORS = {
  'Low': 'text-emerald-400',
  'Medium': 'text-amber-400',
  'High': 'text-orange-400',
  'Critical': 'text-destructive',
};

const SAFETY_CLAIMS = [
  'Proposed actions only',
  'No AI runtime calls',
  'No Codex execution',
  'No OpenClaw dispatch',
  'No MCP calls',
  'No browser automation',
  'No external API mutation',
  'No backend mutation',
  'No credential handling',
  'Browser-only export',
];

const BLANK = {
  actionTitle: '',
  sourceModule: 'System',
  actionType: 'Review',
  priorityLevel: 'Medium',
  riskLevel: 'Low',
  proposedReason: '',
  expectedOutcome: '',
  targetRecordReference: '',
  actionStatus: 'DRAFT',
  operatorNotes: '',
};

function loadActions() {
  try { return JSON.parse(localStorage.getItem(PROPOSED_ACTIONS_KEY) || '[]'); } catch { return []; }
}

function saveActions(actions) {
  try { localStorage.setItem(PROPOSED_ACTIONS_KEY, JSON.stringify(actions)); } catch {}
}

function evaluateAction(form) {
  const isCriticalWithApproval =
    form.riskLevel === 'Critical' && form.actionStatus === 'APPROVED_FOR_PLANNING';

  const finalStatus = isCriticalWithApproval ? 'NEEDS_REVIEW' : form.actionStatus;
  const warning = isCriticalWithApproval
    ? 'CRITICAL risk proposed actions require separate operator review and cannot be directly approved for planning.'
    : null;

  return { finalStatus, warning };
}

export default function ProposedActionsPanel() {
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setActions(loadActions());
  }, []);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    if (!form.actionTitle.trim()) return;

    const { finalStatus, warning } = evaluateAction(form);

    const record = {
      ...form,
      actionStatus: finalStatus,
      actionWarning: warning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...actions].slice(0, MAX_RECORDS);
    setActions(updated);
    saveActions(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = actions.filter(a => a.id !== id);
    setActions(updated);
    saveActions(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AI_PROPOSED_ACTIONS',
      proposedActions: actions,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-proposed-actions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total: actions.length,
    draft: actions.filter(a => a.actionStatus === 'DRAFT').length,
    needsReview: actions.filter(a => a.actionStatus === 'NEEDS_REVIEW').length,
    approved: actions.filter(a => a.actionStatus === 'APPROVED_FOR_PLANNING').length,
    rejected: actions.filter(a => a.actionStatus === 'REJECTED').length,
    disabled: actions.filter(a => a.actionStatus === 'DISABLED').length,
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Proposed Actions</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only action tracker · No execution · No dispatch</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Action'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. Proposed actions do not execute, dispatch, call APIs, or mutate systems.</div>
          <div className="text-[8px] text-destructive/70">No AI runtime · No Codex execution · No OpenClaw dispatch · No external API mutation · No credential storage</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Proposed Actions Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
          {[
            { label: 'Total', value: counts.total, color: 'text-slate-200' },
            { label: 'Draft', value: counts.draft, color: 'text-slate-400' },
            { label: 'Needs Review', value: counts.needsReview, color: 'text-amber-400' },
            { label: 'Approved', value: counts.approved, color: 'text-primary' },
            { label: 'Rejected', value: counts.rejected, color: 'text-destructive' },
            { label: 'Disabled', value: counts.disabled, color: 'text-slate-500' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {[
            { label: 'AI Runtime Calls', value: 'DISABLED' },
            { label: 'Codex Execution', value: 'DISABLED' },
            { label: 'OpenClaw Dispatch', value: 'DISABLED' },
            { label: 'External API Mutation', value: 'DISABLED' },
            { label: 'Backend Mutation', value: 'DISABLED' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[8px] font-bold font-mono text-destructive">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-4">
          <div className="text-[9px] font-bold uppercase text-slate-300">New Proposed Action</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Action Title *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.actionTitle}
                onChange={e => set('actionTitle', e.target.value)}
                placeholder="e.g. Review Trading Module Status Snapshot"
              />
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Source Module</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.sourceModule} onChange={e => set('sourceModule', e.target.value)}>
                {SOURCE_MODULES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Action Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.actionType} onChange={e => set('actionType', e.target.value)}>
                {ACTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Priority Level</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.priorityLevel} onChange={e => set('priorityLevel', e.target.value)}>
                {PRIORITY_LEVELS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Risk Level</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}>
                {RISK_LEVELS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Action Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.actionStatus} onChange={e => set('actionStatus', e.target.value)}>
                {ACTION_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Proposed Reason</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.proposedReason}
                onChange={e => set('proposedReason', e.target.value)}
                placeholder="Why is this action proposed?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Expected Outcome</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.expectedOutcome}
                onChange={e => set('expectedOutcome', e.target.value)}
                placeholder="What is the expected outcome?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Target Record Reference (optional)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.targetRecordReference}
                onChange={e => set('targetRecordReference', e.target.value)}
                placeholder="e.g. EntityId, WorkflowId, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Operator Notes</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.operatorNotes}
                onChange={e => set('operatorNotes', e.target.value)}
                placeholder="Additional planning notes"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.actionTitle.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save Proposed Action
          </button>
        </div>
      )}

      {/* Actions Table */}
      {actions.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No proposed actions yet. Click "+ New Action" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Proposed Actions</div>
            <div className="text-[8px] text-slate-500">{actions.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Title', 'Source', 'Type', 'Priority', 'Risk', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {actions.map(a => (
                  <tr key={a.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{a.actionTitle}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[100px] truncate">{a.sourceModule}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[110px] truncate">{a.actionType}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{a.priorityLevel}</td>
                    <td className={`px-3 py-2 whitespace-nowrap font-bold ${RISK_COLORS[a.riskLevel] || 'text-slate-400'}`}>{a.riskLevel}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[a.actionStatus] || ''}`}>
                        {a.actionStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {a.actionWarning && (
                        <AlertTriangle className="w-3 h-3 text-amber-400" title={a.actionWarning} />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleRemove(a.id)}
                        className="text-[7px] text-destructive/50 hover:text-destructive transition-colors">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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