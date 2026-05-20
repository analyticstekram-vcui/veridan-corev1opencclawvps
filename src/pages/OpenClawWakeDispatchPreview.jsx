/**
 * OpenClawWakeDispatchPreview
 * OpenClaw Wake Dispatch Preview Gate
 * Governance-only · Preview-only · No live dispatch · No /hooks/wake call · No /hooks/agent call
 */
import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import WakeDispatchFlowStages from '../components/wake-dispatch/WakeDispatchFlowStages';
import WakeDispatchForm from '../components/wake-dispatch/WakeDispatchForm';
import WakeDispatchResultPanel from '../components/wake-dispatch/WakeDispatchResultPanel';
import WakeDispatchHistoryTable from '../components/wake-dispatch/WakeDispatchHistoryTable';
import WakeDispatchDetailDrawer from '../components/wake-dispatch/WakeDispatchDetailDrawer';
import { FIXED_STATUSES, GUARDRAILS } from '../components/wake-dispatch/wakeDispatchContracts';

const TABS = [
  { id: 'flow',      label: 'Pipeline Flow' },
  { id: 'generator', label: 'Preview Generator' },
  { id: 'history',   label: 'Preview History' },
];

const STATUS_LABEL_COLORS = {
  PREVIEW_ONLY:            'text-amber-400',
  LOCAL_ONLY_127_0_0_1:    'text-amber-400',
  DISABLED:                'text-destructive',
  HIDDEN_SERVER_SIDE_ONLY: 'text-destructive',
  NOT_SENT:                'text-destructive',
  NOT_EXECUTED:            'text-destructive',
  NOT_DISPATCHED:          'text-destructive',
  NO_ORDER_CREATED:        'text-destructive',
  NOT_CONNECTED:           'text-destructive',
};

export default function OpenClawWakeDispatchPreview() {
  const [activeTab,    setActiveTab]    = useState('flow');
  const [latestResult, setLatestResult] = useState(null);
  const [history,      setHistory]      = useState([]);
  const [selected,     setSelected]     = useState(null);

  const handleResult = (result) => {
    setLatestResult(result);
    setHistory(prev => [result, ...prev]);
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · OpenClaw Governance
            </div>
            <h1 className="text-lg font-bold text-foreground">OpenClaw Wake Dispatch Preview Gate</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Approved preview event → backend safety gate → local /hooks/wake payload → audit record · No live dispatch
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">
              DISPATCH_MODE: PREVIEW_ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              OPENCLAW_WAKE_CALL: DISABLED
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              NETWORK_REQUEST: NOT_SENT
            </span>
          </div>
        </div>
      </div>

      {/* Guardrails */}
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
          {Object.entries(FIXED_STATUSES).map(([k, v]) => (
            <span key={k} className="text-slate-500">
              {k}: <span className={`font-bold ${STATUS_LABEL_COLORS[v] || 'text-slate-300'}`}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
              {tab.id === 'history' && history.length > 0 && (
                <span className="ml-1.5 px-1 py-0.5 bg-primary/20 text-primary text-[7px] rounded-sm">{history.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">

        {/* Pipeline Flow tab */}
        {activeTab === 'flow' && (
          <div className="space-y-4">
            <div className="bg-card border border-border/40 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                8-Stage Wake Dispatch Preview Pipeline
              </div>
              <WakeDispatchFlowStages />
            </div>

            {/* Token boundary callout */}
            <div className="bg-card border border-purple-500/30 rounded-sm p-4 space-y-2">
              <div className="text-[9px] font-bold uppercase text-purple-400">🔒 Token Handling Boundary Contract</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[8px]">
                <div className="bg-secondary/20 border border-border/30 rounded-sm p-2 space-y-1">
                  <div className="font-bold text-foreground">What is stored</div>
                  <div className="text-slate-400">OPENCLAW_SERVICE_TOKEN is stored in App Secrets environment variable only. Never in localStorage, sessionStorage, or any entity field.</div>
                </div>
                <div className="bg-secondary/20 border border-border/30 rounded-sm p-2 space-y-1">
                  <div className="font-bold text-foreground">What is injected</div>
                  <div className="text-slate-400">Token is injected server-side by backend functions only. The frontend never receives or displays the token value.</div>
                </div>
                <div className="bg-secondary/20 border border-border/30 rounded-sm p-2 space-y-1">
                  <div className="font-bold text-foreground">Current phase</div>
                  <div className="text-destructive font-bold">TOKEN_VISIBILITY: HIDDEN_SERVER_SIDE_ONLY</div>
                  <div className="text-slate-400">No backend function calls the /hooks/wake endpoint in this preview phase.</div>
                </div>
              </div>
            </div>

            {/* Endpoint contract */}
            <div className="bg-card border border-border/40 rounded-sm p-4 space-y-2">
              <div className="text-[9px] font-bold uppercase text-slate-400">OpenClaw Endpoint Contract</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[8px]">
                {[
                  { label: '/hooks/wake',  status: 'DISABLED', note: 'Will send notification-only payload when enabled. Not called in this phase.' },
                  { label: '/hooks/agent', status: 'PROHIBITED', note: 'Agent endpoint is prohibited in this phase. Not called. No agentic execution.' },
                ].map(({ label, status, note }) => (
                  <div key={label} className="bg-destructive/5 border border-destructive/20 rounded-sm p-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold font-mono text-foreground">{label}</span>
                      <span className="px-1.5 py-0.5 bg-destructive/20 border border-destructive/30 text-destructive text-[7px] font-bold rounded-sm">{status}</span>
                    </div>
                    <div className="text-[7px] text-slate-400">{note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generator tab */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="bg-card border border-border/40 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                Local Wake Dispatch Preview Generator
              </div>
              <WakeDispatchForm onResult={handleResult} />
            </div>
            {latestResult && (
              <div className="bg-card border border-border/40 rounded-sm p-4">
                <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">Latest Preview Result</div>
                <WakeDispatchResultPanel result={latestResult} />
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono">
              {history.length} preview records this session · All locked NOT_EXECUTED / NOT_DISPATCHED / NO_ORDER_CREATED
            </div>
            <WakeDispatchHistoryTable history={history} onSelect={setSelected} />
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && <WakeDispatchDetailDrawer result={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}