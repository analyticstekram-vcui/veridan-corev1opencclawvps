/**
 * ObsidianVaultModuleStatusSummary — Module status overview.
 * Reads 5 localStorage keys, shows counts and safety status.
 * No Obsidian API, no OpenClaw dispatch, no filesystem, no credential, no backend logic.
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
  FOLDER_MAP: 'veridanObsidianVaultFolderMap',
  NOTE_CREATES: 'veridanObsidianNoteCreateRequests',
  NOTE_UPDATES: 'veridanObsidianNoteUpdateRequests',
  OCLAW_TASKS: 'veridanObsidianOpenClawTaskQueue',
  APPROVALS: 'veridanObsidianApprovalDecisions',
};

const STATUS_SNAPSHOT_KEY = 'veridanObsidianVaultModuleStatusSnapshot';

const WHAT_THIS_MEANS = 'The Obsidian Vault Control Module can preview vault folder maps, queue note creation and update requests in governed preview mode, plan OpenClaw task queues, process operator approvals, and maintain an evidence chain log. It cannot write files to Obsidian, dispatch OpenClaw, call external APIs, handle credentials, execute browser automation, or mutate backend systems. All outputs are PREVIEW_ONLY or NOT_EXECUTED.';

const SAFETY_CLAIMS = [
  'Obsidian Vault module status only',
  'Governed preview mode',
  'No Obsidian API calls',
  'No filesystem writes',
  'No OpenClaw dispatch',
  'No browser automation',
  'No credential handling',
  'No external API mutation',
  'No backend mutation',
  'Execution status always PREVIEW_ONLY or NOT_EXECUTED',
  'Blocked task types enforced at UI level',
  'Browser-only export',
  'Baseline v1 locked state preserved',
];

export default function ObsidianVaultModuleStatusSummary() {
  const [folders, setFolders] = useState([]);
  const [creates, setCreates] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [oclawTasks, setOclawTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    setFolders(loadFromStorage(STORAGE_KEYS.FOLDER_MAP));
    setCreates(loadFromStorage(STORAGE_KEYS.NOTE_CREATES));
    setUpdates(loadFromStorage(STORAGE_KEYS.NOTE_UPDATES));
    setOclawTasks(loadFromStorage(STORAGE_KEYS.OCLAW_TASKS));
    setApprovals(loadFromStorage(STORAGE_KEYS.APPROVALS));
  }, []);

  const counts = {
    totalFolders: folders.length,
    totalNoteCreateRequests: creates.length,
    noteCreatePending: creates.filter(r => r.approvalStatus === 'PENDING_REVIEW').length,
    totalNoteUpdateRequests: updates.length,
    noteUpdatePending: updates.filter(r => r.approvalStatus === 'PENDING_REVIEW').length,
    totalOpenClawTasks: oclawTasks.length,
    openClawTasksApproved: oclawTasks.filter(t => t.approvalStatus === 'APPROVED_PREVIEW').length,
    totalApprovalDecisions: approvals.length,
    approvalsGranted: approvals.filter(a => a.decision === 'APPROVED_PREVIEW').length,
    approvalsDenied: approvals.filter(a => a.decision === 'DENIED').length,
  };

  const safetyStatus = {
    'Vault module mode': 'GOVERNED_PREVIEW',
    'Obsidian API calls': 'DISABLED',
    'Filesystem writes': 'DISABLED',
    'OpenClaw dispatch': 'DISABLED',
    'Browser automation': 'DISABLED',
    'Credential handling': 'DISABLED',
    'External API mutation': 'DISABLED',
    'Backend mutation': 'DISABLED',
    'Execution status': 'PREVIEW_ONLY_OR_NOT_EXECUTED',
    'Baseline v1 state': 'LOCKED',
  };

  const handleExport = () => {
    exportSnapshotAndSave({
      snapshotType: 'VERIDAN_OBSIDIAN_VAULT_MODULE_STATUS',
      data: { counts, safetyStatus },
      filename: 'veridan-obsidian-vault-module-status',
      safetyClaims: SAFETY_CLAIMS,
      storageKey: STATUS_SNAPSHOT_KEY,
    });
  };

  return (
    <div className="space-y-4 font-mono">
      <SummaryCardHeader
        title="Obsidian Vault Control Module Status"
        subtitle="Governed preview mode · No Obsidian API · No OpenClaw dispatch · No filesystem writes"
        onExport={handleExport}
      />

      <SummaryCountsGrid
        title="Module Counts"
        items={[
          { label: 'Total Folders Mapped', value: counts.totalFolders, color: 'text-primary' },
          { label: 'Note Create Requests', value: counts.totalNoteCreateRequests, color: 'text-primary' },
          { label: 'Create Requests Pending', value: counts.noteCreatePending, color: 'text-amber-400' },
          { label: 'Note Update Requests', value: counts.totalNoteUpdateRequests, color: 'text-primary' },
          { label: 'Update Requests Pending', value: counts.noteUpdatePending, color: 'text-amber-400' },
          { label: 'OpenClaw Tasks Queued', value: counts.totalOpenClawTasks, color: 'text-primary' },
          { label: 'OpenClaw Tasks Approved Preview', value: counts.openClawTasksApproved, color: 'text-primary' },
          { label: 'Total Approval Decisions', value: counts.totalApprovalDecisions, color: 'text-primary' },
          { label: 'Approvals Granted', value: counts.approvalsGranted, color: 'text-primary' },
          { label: 'Approvals Denied', value: counts.approvalsDenied, color: 'text-destructive' },
        ]}
      />

      <SummarySafetyStatusGrid
        title="Safety Status"
        items={Object.entries(safetyStatus).map(([label, value]) => ({
          label,
          value,
          color: value === 'GOVERNED_PREVIEW' ? 'text-amber-400'
            : value === 'LOCKED' ? 'text-primary'
            : value === 'PREVIEW_ONLY_OR_NOT_EXECUTED' ? 'text-amber-400'
            : 'text-destructive',
        }))}
      />

      <SummaryWhatThisMeans text={WHAT_THIS_MEANS} />
      <SummarySafetyClaimsFooter claims={SAFETY_CLAIMS} />
    </div>
  );
}