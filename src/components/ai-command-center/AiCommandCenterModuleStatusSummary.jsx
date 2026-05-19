/**
 * AiCommandCenterModuleStatusSummary — Module status overview.
 * Reads 5 localStorage keys, shows counts and safety status.
 * No AI runtime, Codex, shell, GitHub, OpenClaw, MCP, browser, API, credential, or backend logic.
 */

import React, { useState, useEffect } from 'react';
import { exportSnapshotAndSave } from '../../utils/exportSnapshot';
import { loadFromStorage } from '../../utils/localStorageManager';
import SummaryCardHeader from '../ui/SummaryCardHeader';
import SummaryCountsGrid from '../ui/SummaryCountsGrid';
import SummarySafetyStatusGrid from '../ui/SummarySafetyStatusGrid';
import SummaryWhatThisMeans from '../ui/SummaryWhatThisMeans';
import SummarySafetyClaimsFooter from '../ui/SummarySafetyClaimsFooter';

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

export default function AiCommandCenterModuleStatusSummary() {
  const [systemBriefPresent, setSystemBriefPresent] = useState(false);
  const [proposedActions, setProposedActions] = useState([]);
  const [codexTasks, setCodexTasks] = useState([]);
  const [openClawTasks, setOpenClawTasks] = useState([]);
  const [operatorReviews, setOperatorReviews] = useState([]);

  useEffect(() => {
    setSystemBriefPresent(!!localStorage.getItem(STORAGE_KEYS.SYSTEM_BRIEF));
    setProposedActions(loadFromStorage(STORAGE_KEYS.PROPOSED_ACTIONS));
    setCodexTasks(loadFromStorage(STORAGE_KEYS.CODEX_TASKS));
    setOpenClawTasks(loadFromStorage(STORAGE_KEYS.OPENCLAW_TASKS));
    setOperatorReviews(loadFromStorage(STORAGE_KEYS.OPERATOR_REVIEWS));
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
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_AI_COMMAND_CENTER_MODULE_STATUS',
      data: {
        counts,
        safetyStatus,
      },
      filename: 'veridan-ai-command-center-module-status',
      safetyClaims: SAFETY_CLAIMS,
      storageKey: STATUS_SNAPSHOT_KEY,
    });
  };

  return (
    <div className="space-y-4 font-mono">
      <SummaryCardHeader
        title="AI Command Center Module Current Status"
        subtitle="Planning-only status · No AI runtime · No Codex execution · No credential storage"
        onExport={handleExport}
      />

      <SummaryCountsGrid
        title="Module Counts"
        items={[
          { label: 'System Brief Present', value: counts.systemBriefPresent, color: 'text-primary' },
          { label: 'Total Proposed Actions', value: counts.totalProposedActions, color: 'text-primary' },
          { label: 'Proposed Actions Needing Review', value: counts.proposedActionsNeedingReview, color: 'text-primary' },
          { label: 'Proposed Actions Approved', value: counts.proposedActionsApproved, color: 'text-primary' },
          { label: 'Total Codex Task Drafts', value: counts.totalCodexTasks, color: 'text-primary' },
          { label: 'Codex Tasks Approved', value: counts.codexTasksApproved, color: 'text-primary' },
          { label: 'Total OpenClaw Task Plans', value: counts.totalOpenClawTasks, color: 'text-primary' },
          { label: 'OpenClaw Tasks Approved', value: counts.openClawTasksApproved, color: 'text-primary' },
          { label: 'Total Operator Reviews', value: counts.totalOperatorReviews, color: 'text-primary' },
          { label: 'Operator Reviews Approved', value: counts.operatorReviewsApproved, color: 'text-primary' },
          { label: 'Operator Reviews Rejected', value: counts.operatorReviewsRejected, color: 'text-primary' },
          { label: 'Operator Reviews Needs Changes', value: counts.operatorReviewsNeedsChanges, color: 'text-primary' },
        ]}
      />

      <SummarySafetyStatusGrid
        title="Safety Status"
        items={Object.entries(safetyStatus).map(([label, value]) => ({
          label,
          value,
          color: value === 'PLANNING_ONLY' ? 'text-amber-400' : 'text-destructive',
        }))}
      />

      <SummaryWhatThisMeans text={WHAT_THIS_MEANS} />
      <SummarySafetyClaimsFooter claims={SAFETY_CLAIMS} />
    </div>
  );
}