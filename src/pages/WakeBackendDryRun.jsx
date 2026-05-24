/**
 * WakeBackendDryRun
 * OpenClaw Wake Backend Dry-Run Route — governance/audit planning only.
 * No network requests. No OpenClaw contact. No secret exposure. No external service activation.
 */
import React, { useState } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import WakeBackendPipelineFlow from '../components/wake-backend-dry-run/WakeBackendPipelineFlow';
import WakeBackendDryRunForm from '../components/wake-backend-dry-run/WakeBackendDryRunForm';
import WakeBackendHistoryTable from '../components/wake-backend-dry-run/WakeBackendHistoryTable';
import WakeBackendDetailDrawer from '../components/wake-backend-dry-run/WakeBackendDetailDrawer';
import { FIXED_STATUSES, GUARDRAILS } from '../components/wake-backend-dry-run/wakeBackendDryRunContracts';
import QuickDryRunButton from '../components/wake-backend-dry-run/QuickDryRunButton';

const TABS = [
  { id: 'flow',    label: 'Pipeline Flow' },
  { id: 'builder', label: 'Dry-Run Builder' },
  { id: 'history', label: 'Validation History' },
];

const STATUS_COLOR = (v) => {
  if (['SUPPRESSED','PROHIBITED','DISABLED','NOT_SENT','NOT_EXECUTED','NOT_DISPATCHED','NO_ACTION_CREATED','NOT_CONNECTED'].includes(v)) return 'text-destructive';
  if (v.startsWith('/api')) return 'text-primary';
  return 'text-amber-400';
};

export default function WakeBackendDryRun() {
  const [activeTab, setActiveTab] = useState('flow');
  const [history,   setHistory]   = useState([]);
  const [selected,  setSelected]  = useState(null);

  const handleResult = (record) => {
    setHistory(prev => [record, ...prev]);
    setActiveTab('history');
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
            <h1 className="text-lg font-bold text-foreground">OpenClaw Wake Backend Dry-Run Route</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Backend validation path simulation · Preview packet → server-side safety gate → dry-run response → audit record
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">
              ROUTE_MODE: DRY_RUN_ONLY
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              OPENCLAW_WAKE_CALL: SUPPRESSED
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              NETWORK_REQUEST: NOT_SENT
            </span>
          </div>
        </div>
      </div>

      {/* Guardrails */}
      <div className="border-b border-border/40 bg-card/60 px-6 py-2">
        <div className="flex items-center gap-3 flex-wrap text-[8px] font-mono">
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
              {k}: <span className={`font-bold ${STATUS_COLOR(v)}`}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex">
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

        {/* ── Quick action — always visible at top ── */}
        <div className="bg-card border border-primary/20 rounded-sm p-4 space-y-2">
          <div className="text-[9px] font-bold uppercase text-primary mb-1">Quick Validation</div>
          <div className="text-[8px] text-slate-400 mb-3">
            Generates a <span className="text-primary font-bold">SERVER_DRY_RUN_VALIDATED</span> evidence record instantly and saves it to localStorage for Wake Activation Gate.
          </div>
          <QuickDryRunButton onResult={handleResult} />
        </div>

        {activeTab === 'flow' && (
          <div className="space-y-4">
            <div className="bg-card border border-border/40 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                8-Stage Backend Dry-Run Validation Pipeline
              </div>
              <WakeBackendPipelineFlow />
            </div>

            {/* Route contract */}
            <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
              <div className="text-[9px] font-bold uppercase text-slate-400">Backend Route Contract</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[8px]">
                {[
                  {
                    label: 'POST /api/openclaw/wake/dry-run',
                    status: 'DRY_RUN_ONLY',
                    color: 'border-primary/30 bg-primary/5 text-primary',
                    note:  'Validates preview packet server-side. No OpenClaw call made. Returns structured dry-run response with evidenceId and auditHash.',
                  },
                  {
                    label: 'POST /hooks/wake',
                    status: 'SUPPRESSED',
                    color: 'border-destructive/30 bg-destructive/5 text-destructive',
                    note:  'OpenClaw wake endpoint. Suppressed in dry-run phase. Will only be enabled after full promotion approval workflow is completed.',
                  },
                  {
                    label: 'POST /hooks/agent',
                    status: 'PROHIBITED',
                    color: 'border-destructive/30 bg-destructive/5 text-destructive',
                    note:  'Agent endpoint. Prohibited in all current phases. Not referenced, not called, not planned for near-term activation.',
                  },
                  {
                    label: 'OPENCLAW_SERVICE_TOKEN',
                    status: 'NOT_READ_IN_DRY_RUN',
                    color: 'border-rose-400/30 bg-rose-400/5 text-rose-400',
                    note:  'Token is stored in App Secrets. In dry-run mode: not read, not injected, not exposed. Token access is reserved for live route promotion only.',
                  },
                ].map(({ label, status, color, note }) => (
                  <div key={label} className={`border rounded-sm p-3 space-y-1 ${color}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold font-mono">{label}</span>
                      <span className="px-1.5 py-0.5 border border-current bg-current/10 text-[7px] font-bold rounded-sm opacity-80">{status}</span>
                    </div>
                    <div className="text-[7px] opacity-60">{note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purpose callout */}
            <div className="bg-card border border-amber-500/30 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-amber-400 mb-2">Module Purpose</div>
              <div className="text-[8px] text-slate-400 leading-relaxed space-y-1">
                <p>This page models the future server-side validation path that a wake dispatch preview packet would follow before any live OpenClaw interaction is permitted.</p>
                <p>It proves that all 13 server-side validation checks can be evaluated locally, that the dry-run response shape is fully specified, and that every decision outcome is traceable to an evidence record.</p>
                <p className="text-amber-400/80">No network requests are made. No secrets are read. No external services are contacted. This is purely a UI simulation and audit planning module.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="bg-card border border-border/40 rounded-sm p-4">
            <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
              Backend Dry-Run Request Builder — Local Simulation Only
            </div>
            <WakeBackendDryRunForm onResult={handleResult} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono">
              {history.length} dry-run validation records this session · All locked NOT_EXECUTED / NOT_DISPATCHED / OPENCLAW_WAKE: SUPPRESSED
            </div>
            <WakeBackendHistoryTable history={history} onSelect={setSelected} />
          </div>
        )}
      </div>

      {selected && <WakeBackendDetailDrawer record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}