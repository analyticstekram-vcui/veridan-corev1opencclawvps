/**
 * AiCommandCenter — Planning-only AI command center.
 * No AI runtime calls, no Codex execution, no OpenClaw dispatch, no external API mutation.
 * localStorage-only. No backend mutation. No credential handling.
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import AiCommandCenterModuleStatusSummary from '../components/ai-command-center/AiCommandCenterModuleStatusSummary';
import SystemBriefPanel from '../components/ai-command-center/SystemBriefPanel';
import ProposedActionsPanel from '../components/ai-command-center/ProposedActionsPanel';
import CodexTasksPanel from '../components/ai-command-center/CodexTasksPanel';
import OpenClawTasksPanel from '../components/ai-command-center/OpenClawTasksPanel';
import OperatorReviewPanel from '../components/ai-command-center/OperatorReviewPanel';

const TABS = [
  { id: 'brief',    label: 'System Brief' },
  { id: 'proposed', label: 'Proposed Actions' },
  { id: 'codex',    label: 'Codex Tasks' },
  { id: 'openclaw', label: 'OpenClaw Tasks' },
  { id: 'review',   label: 'Operator Review' },
];

export default function AiCommandCenter() {
  const [activeTab, setActiveTab] = useState('brief');

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · AI Command Center
            </div>
            <h1 className="text-lg font-bold text-foreground">AI Command Center</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Planning-only module · System briefs · Proposed actions · Codex & OpenClaw tasks · Operator review
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
              PLANNING ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded">
              AI RUNTIME DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* AI Command Center Module Status Summary */}
      <div className="border-b border-border bg-card px-6 py-4">
        <AiCommandCenterModuleStatusSummary />
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
        {activeTab === 'brief'    && <SystemBriefPanel />}
        {activeTab === 'proposed' && <ProposedActionsPanel />}
        {activeTab === 'codex'    && <CodexTasksPanel />}
        {activeTab === 'openclaw' && <OpenClawTasksPanel />}
        {activeTab === 'review'   && <OperatorReviewPanel />}
      </div>
    </div>
  );
}