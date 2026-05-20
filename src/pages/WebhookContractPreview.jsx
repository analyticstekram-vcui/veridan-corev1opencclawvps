/**
 * WebhookContractPreview
 * Governance-only webhook contract preview module.
 * No live execution. No OpenClaw dispatch. No credential exposure. No filesystem writes.
 * executionStatus: NOT_EXECUTED · dispatchStatus: NOT_DISPATCHED
 */

import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import WebhookContractCard from '../components/webhook-preview/WebhookContractCard';
import WebhookPreviewForm from '../components/webhook-preview/WebhookPreviewForm';
import WebhookPreviewHistoryTable from '../components/webhook-preview/WebhookPreviewHistoryTable';
import WebhookPreviewDetailDrawer from '../components/webhook-preview/WebhookPreviewDetailDrawer';
import { CONTRACT_REGISTRY } from '../components/webhook-preview/webhookContracts';

const GUARDRAILS = [
  'Preview only — no dispatch',
  'Filesystem write disabled',
  'OpenClaw dispatch disabled',
  'External webhook exposure disabled',
  'Agent/API usage disabled',
];

const TABS = [
  { id: 'contracts', label: 'Contract Registry' },
  { id: 'generator', label: 'Payload Preview Generator' },
  { id: 'history',   label: 'Preview History' },
];

export default function WebhookContractPreview() {
  const [activeTab,    setActiveTab]    = useState('contracts');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [previewHistory, setPreviewHistory] = useState([]);

  const handleGenerated = (packet) => {
    setPreviewHistory(prev => [packet, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Governance Module
            </div>
            <h1 className="text-lg font-bold text-foreground">Webhook Contract Preview</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Contract/audit layer only · Approved future event types · No live execution · No dispatch
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">
              GOVERNANCE PREVIEW
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              EXECUTION DISABLED
            </span>
          </div>
        </div>
      </div>

      {/* Guardrail strip */}
      <div className="border-b border-border/40 bg-card/60 px-6 py-2">
        <div className="flex items-center gap-4 flex-wrap text-[8px] font-mono">
          {GUARDRAILS.map(g => (
            <span key={g} className="text-destructive font-bold">⊘ {g}</span>
          ))}
        </div>
      </div>

      {/* Status strip */}
      <div className="border-b border-border/20 bg-secondary/10 px-6 py-1.5">
        <div className="flex items-center gap-4 flex-wrap text-[7px] font-mono">
          <span className="text-slate-500">executionStatus: <span className="text-destructive font-bold">NOT_EXECUTED</span></span>
          <span className="text-slate-500">dispatchStatus: <span className="text-destructive font-bold">NOT_DISPATCHED</span></span>
          <span className="text-slate-500">networkRequest: <span className="text-destructive font-bold">NOT_SENT</span></span>
          <span className="text-slate-500">filesystemWrite: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">openClawDispatch: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">externalWebhookExposure: <span className="text-destructive font-bold">DISABLED</span></span>
          <span className="text-slate-500">contracts: <span className="text-primary font-bold">{CONTRACT_REGISTRY.length}</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0">
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
              {tab.id === 'history' && previewHistory.length > 0 && (
                <span className="ml-1.5 px-1 py-0.5 bg-primary/20 text-primary text-[7px] rounded-sm">{previewHistory.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-4">

        {/* Contract Registry */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono">
              {CONTRACT_REGISTRY.length} approved future event contracts · Click any card to view full detail
            </div>
            {CONTRACT_REGISTRY.map(c => (
              <WebhookContractCard key={c.eventType} contract={c} onSelect={setSelectedEvent} />
            ))}
          </div>
        )}

        {/* Generator */}
        {activeTab === 'generator' && (
          <WebhookPreviewForm onGenerated={(packet) => { handleGenerated(packet); }} />
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono">
              {previewHistory.length} preview packets generated this session · All statuses locked NOT_EXECUTED / NOT_DISPATCHED
            </div>
            <WebhookPreviewHistoryTable events={previewHistory} onSelect={setSelectedEvent} />
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedEvent && (
        <WebhookPreviewDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}