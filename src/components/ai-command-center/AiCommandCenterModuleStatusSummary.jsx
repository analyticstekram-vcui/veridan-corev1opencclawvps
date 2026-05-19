/**
 * AiCommandCenterModuleStatusSummary — Module status overview.
 * Reads 5 localStorage keys, shows counts and safety status.
 * No AI runtime, Codex, shell, GitHub, OpenClaw, MCP, browser, API, credential, or backend logic.
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const STORAGE_KEYS = {
  SYSTEM_BRIEF: 'veridanAiCommandCenterSystemBriefSnapshot',
  PROPOSED_ACTIONS: 'veridanAiProposedActions',
  CODEX_TASKS: 'veridanAiCodexTaskDrafts',
  OPENCLAW_TASKS: 'veridanAiOpenClawTaskPlans',
  OPERATOR_REVIEWS: 'veridanAiOperatorReviewRecords',
};

const STATUS_SNAPSHOT_KEY = 'veridanAiCommandCenterModuleStatusSnapshot';

const WHAT_THIS_MEANS = 'The AI Command Center can summarize system status, track proposed actions, draft Codex tasks, draft OpenClaw task plans, and record operator reviews. It cannot call AI runtimes, run Codex, execute shell commands, mutate GitHub repositories, dispatch OpenClaw, call MCP tools, automate browsers, mutate external systems, handle credentials, or mutate backend systems.';

const SAFETY_CLAIMS = [
  'AI Command Center module status only',
  'Planning-only',
  'No AI runtime calls',
  'No OpenAI API calls',
  'No Codex execution',
  'No shell commands',
  'No GitHub mutation',
  'No OpenClaw dispatch',
  'No MCP calls',
  'No browser automation',
  'No external API mutation',
  'No credential handling',
  'No backend mutation',
  'Browser-only export',
];

function loadData(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function AiCommandCenterModuleStatusSummary() {
  const [systemBriefPresent, setSystemBriefPresent] = useState(false);
  const [proposedActions, setProposedActions] = useState([]);
  const [codexTasks, setCodexTasks] = useState([]);
  const [openClawTasks, setOpenClawTasks] = useState([]);
  const [operatorReviews, setOperatorReviews] = useState([]);

  useEffect(() => {
    setSystemBriefPresent(!!localStorage.getItem(STORAGE_KEYS.SYSTEM_BRIEF));
    setProposedActions(loadData(STORAGE_KEYS.PROPOSED_ACTIONS));
    setCodexTasks(loadData(STORAGE_KEYS.CODEX_TASKS));
    setOpenClawTasks(loadData(STORAGE_KEYS.OPENCLAW_TASKS));
    setOperatorReviews(loadData(STORAGE_KEYS.OPERATOR_REVIEWS));
  }, []);

  const counts = {
    systemBriefPresent: systemBriefPresent ? 'true' : 'false',
    totalProposedActions: proposedActions.length,
    proposedActionsNeedingReview: proposedActions.filter(a => a.actionStatus === 'NEEDS_REVIEW').length,
    proposedActionsApproved: proposedActions.filter(a => a.actionStatus === 'APPROVED_FOR_PLANNING').length,
    totalCodexTasks: codexTasks.length,
    codexTasksApproved: codexTasks.filter(t => t.taskStatus === 'APPROVED_FOR_MANUAL_CODEX_RUN').length,
    totalOpenClawTasks: openClawTasks.length,
    openClawTasksApproved: openClawTasks.filter(t => t.taskStatus === 'APPROVED_FOR_PLANNING').length,
    totalOperatorReviews: operatorReviews.length,
    operatorReviewsApproved: operatorReviews.filter(r => r.reviewDecision === 'APPROVED').length,
    operatorReviewsRejected: operatorReviews.filter(r => r.reviewDecision === 'REJECTED').length,
    operatorReviewsNeedsChanges: operatorReviews.filter(r => r.reviewDecision === 'NEEDS_CHANGES').length,
  };

  const safetyStatus = {
    'AI Command Center mode': 'PLANNING_ONLY',
    'AI runtime calls': 'DISABLED',
    'OpenAI API calls': 'DISABLED',
    'Codex execution': 'DISABLED',
    'Shell commands': 'DISABLED',
    'GitHub mutation': 'DISABLED',
    'OpenClaw dispatch': 'DISABLED',
    'MCP calls': 'DISABLED',
    'Browser automation': 'DISABLED',
    'External API mutation': 'DISABLED',
    'Credential handling': 'DISABLED',
    'Backend mutation': 'DISABLED',
  };

  const handleExport = () => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_AI_COMMAND_CENTER_MODULE_STATUS',
      counts,
      safetyStatus,
      safetyClaims: SAFETY_CLAIMS,
    };

    // Store in localStorage
    try {
      localStorage.setItem(STATUS_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.error('Failed to store status snapshot:', e);
    }

    // Export JSON
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-ai-command-center-module-status-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header and Export */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">AI Command Center Module Current Status</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only status · No AI runtime · No Codex execution · No credential storage</div>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
          <Download className="w-3 h-3" /> Export Status
        </button>
      </div>

      {/* Counts Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Module Counts</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { label: 'System Brief Present', value: counts.systemBriefPresent },
            { label: 'Total Proposed Actions', value: counts.totalProposedActions },
            { label: 'Proposed Actions Needing Review', value: counts.proposedActionsNeedingReview },
            { label: 'Proposed Actions Approved', value: counts.proposedActionsApproved },
            { label: 'Total Codex Task Drafts', value: counts.totalCodexTasks },
            { label: 'Codex Tasks Approved', value: counts.codexTasksApproved },
            { label: 'Total OpenClaw Task Plans', value: counts.totalOpenClawTasks },
            { label: 'OpenClaw Tasks Approved', value: counts.openClawTasksApproved },
            { label: 'Total Operator Reviews', value: counts.totalOperatorReviews },
            { label: 'Operator Reviews Approved', value: counts.operatorReviewsApproved },
            { label: 'Operator Reviews Rejected', value: counts.operatorReviewsRejected },
            { label: 'Operator Reviews Needs Changes', value: counts.operatorReviewsNeedsChanges },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[14px] font-bold font-mono text-primary">{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Status Grid */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">Safety Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(safetyStatus).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{label}:</span>
              <span className={`text-[8px] font-bold font-mono ${value === 'PLANNING_ONLY' ? 'text-amber-400' : 'text-destructive'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What This Means */}
      <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-sm">
        <div className="text-[9px] font-bold uppercase text-primary mb-2">What This Means</div>
        <p className="text-[8px] text-slate-300 leading-relaxed">{WHAT_THIS_MEANS}</p>
      </div>

      {/* Safety Claims */}
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