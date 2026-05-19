/**
 * ObsidianVaultCommandCenter — Governed preview-only Obsidian vault control module.
 * No Obsidian API, no OpenClaw dispatch, no filesystem, no credential handling, no backend mutation.
 * Execution status: PREVIEW_ONLY / NOT_EXECUTED always.
 * Baseline v1 locked state preserved.
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import ObsidianVaultModuleStatusSummary from '../components/obsidian-vault/ObsidianVaultModuleStatusSummary';
import ObsidianVaultFolderMap from '../components/obsidian-vault/ObsidianVaultFolderMap';
import ObsidianNoteCreateBuilder from '../components/obsidian-vault/ObsidianNoteCreateBuilder';
import ObsidianNoteUpdateBuilder from '../components/obsidian-vault/ObsidianNoteUpdateBuilder';
import ObsidianOpenClawTaskQueue from '../components/obsidian-vault/ObsidianOpenClawTaskQueue';
import ObsidianOperatorApprovalQueue from '../components/obsidian-vault/ObsidianOperatorApprovalQueue';
import ObsidianEvidenceChainLog from '../components/obsidian-vault/ObsidianEvidenceChainLog';
import ObsidianVaultVerificationReport from '../components/obsidian-vault/ObsidianVaultVerificationReport';

const TABS = [
  { id: 'status',    label: 'Module Status' },
  { id: 'folders',   label: 'Vault Folder Map' },
  { id: 'create',    label: 'Note Create' },
  { id: 'update',    label: 'Note Update' },
  { id: 'oclaw',     label: 'OpenClaw Queue' },
  { id: 'approval',  label: 'Approval Queue' },
  { id: 'evidence',  label: 'Evidence Chain' },
  { id: 'verify',    label: 'Verification Report' },
];

export default function ObsidianVaultCommandCenter() {
  const [activeTab, setActiveTab] = useState('status');

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Obsidian Vault Control Module
            </div>
            <h1 className="text-lg font-bold text-foreground">Obsidian Vault Command Center</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Governed preview mode · Folder mapping · Note request builder · OpenClaw queue · Operator approval · Evidence chain
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
              GOVERNED PREVIEW
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
              EXECUTION DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* Safety strip */}
      <div className="border-b border-border/40 bg-card/60 px-6 py-2">
        <div className="flex items-center gap-4 flex-wrap text-[8px] font-mono">
          <span className="text-slate-500">Obsidian API: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">Filesystem: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">OpenClaw Dispatch: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">Browser Automation: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">Credential Handling: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">Backend Mutation: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">Execution Status: <span className="text-amber-400 font-bold">PREVIEW_ONLY</span></span>
          <span className="text-slate-500">Baseline: <span className="text-primary font-bold">V1_LOCKED</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'status'   && <ObsidianVaultModuleStatusSummary />}
        {activeTab === 'folders'  && <ObsidianVaultFolderMap />}
        {activeTab === 'create'   && <ObsidianNoteCreateBuilder />}
        {activeTab === 'update'   && <ObsidianNoteUpdateBuilder />}
        {activeTab === 'oclaw'    && <ObsidianOpenClawTaskQueue />}
        {activeTab === 'approval' && <ObsidianOperatorApprovalQueue />}
        {activeTab === 'evidence' && <ObsidianEvidenceChainLog />}
        {activeTab === 'verify'   && <ObsidianVaultVerificationReport />}
      </div>
    </div>
  );
}