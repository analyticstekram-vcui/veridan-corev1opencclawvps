/**
 * AiCommandCenter — Planning-only AI command center.
 * No AI runtime calls, no Codex execution, no OpenClaw dispatch, no external API mutation.
 * localStorage-only. No backend mutation. No credential handling.
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
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

const WHAT_THIS_MEANS =
  'The AI Command Center can organize briefs, proposed actions, Codex task requests, OpenClaw task plans, and operator review records. It cannot call AI runtimes, execute Codex tasks, dispatch OpenClaw commands, automate browsers, mutate external systems, or handle credentials.';

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

      {/* AI Command Center Current Status */}
      <div className="border-b border-border bg-card px-6 py-4 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">AI Command Center Current Status</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Planning-only status · No AI runtime · No Codex execution · No credential storage</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { label: 'Module Mode',                  value: 'PLANNING_ONLY',  color: 'text-amber-400' },
            { label: 'AI Runtime Calls',             value: 'DISABLED',       color: 'text-destructive' },
            { label: 'OpenAI API Calls',             value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Codex Execution',              value: 'DISABLED',       color: 'text-destructive' },
            { label: 'OpenClaw Dispatch',            value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Browser Automation',           value: 'DISABLED',       color: 'text-destructive' },
            { label: 'External API Mutation',        value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Credential Handling',          value: 'DISABLED',       color: 'text-destructive' },
            { label: 'Backend Mutation',             value: 'DISABLED',       color: 'text-destructive' },
          ].map(item => (
            <div key={item.label}
              className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[9px] text-slate-400">{item.label}:</span>
              <span className={`text-[8px] font-bold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-sm">
          <div className="text-[9px] font-bold uppercase text-primary mb-2">What This Means</div>
          <p className="text-[8px] text-slate-300 leading-relaxed">{WHAT_THIS_MEANS}</p>
        </div>

        <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-[8px] text-amber-400/80">
          Planning only · No AI runtime calls · No Codex execution · No OpenClaw dispatch · No credential storage · No backend mutation
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
        {activeTab === 'brief'    && <SystemBriefPanel />}
        {activeTab === 'proposed' && <ProposedActionsPanel />}
        {activeTab === 'codex'    && <CodexTasksPanel />}
        {activeTab === 'openclaw' && <OpenClawTasksPanel />}
        {activeTab === 'review'   && <OperatorReviewPanel />}
      </div>
    </div>
  );
}