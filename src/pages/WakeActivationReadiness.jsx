/**
 * WakeActivationReadiness
 * OpenClaw Wake Activation Readiness Gate — governance/audit planning only.
 * No activation. No network requests. No OpenClaw contact. No secret read. No execution.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ModuleNav from '../components/navigation/ModuleNav';
import WakeActivationFlowStages from '../components/wake-activation/WakeActivationFlowStages';
import WakeActivationForm from '../components/wake-activation/WakeActivationForm';
import WakeActivationHistoryTable from '../components/wake-activation/WakeActivationHistoryTable';
import WakeActivationDetailDrawer from '../components/wake-activation/WakeActivationDetailDrawer';
import { FIXED_STATUSES, GUARDRAILS, DECISION_META } from '../components/wake-activation/wakeActivationContracts';
import FullWakeReadinessOrchestrator from '../components/wake-activation/FullWakeReadinessOrchestrator';

const TABS = [
  { id: 'flow',     label: 'Readiness Pipeline' },
  { id: 'checker',  label: 'Readiness Checker' },
  { id: 'history',  label: 'Readiness History' },
];

const STATUS_COLOR = (v) => {
  const blocked = [
    'NOT_ACTIVATED','BLOCKED_PENDING_OPERATOR_APPROVAL','NOT_SENT','PROHIBITED',
    'NOT_READ_IN_READINESS_CHECK','HIDDEN_SERVER_SIDE_ONLY','DISABLED',
    'NOT_CONNECTED','NOT_EXECUTED','NOT_DISPATCHED',
  ];
  if (blocked.includes(v)) return 'text-destructive';
  return 'text-amber-400';
};

export default function WakeActivationReadiness() {
  const [activeTab,          setActiveTab]          = useState('flow');
  const [history,            setHistory]            = useState([]);
  const [selected,           setSelected]           = useState(null);
  const [orchestratorResult, setOrchestratorResult] = useState(null);
  const [latestRecord,       setLatestRecord]       = useState(null);

  const handleResult = (record) => {
    setHistory(prev => [record, ...prev]);
    setLatestRecord(record);
  };

  const handleOrchestratorEvidence = (rec) => {
    setHistory(prev => [rec, ...prev]);
    setOrchestratorResult(rec);
    setLatestRecord(rec);
  };

  const wakeCallReady = latestRecord?.allPass === true &&
    ['REVIEW_READY', 'APPROVED'].includes(String(latestRecord?.approvalState || '').trim().toUpperCase());

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
            <h1 className="text-lg font-bold text-foreground">OpenClaw Wake Activation Readiness Gate</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Dry-run evidence → readiness checklist → operator approval gate → activation remains blocked → audit record
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              ACTIVATION_STATUS: NOT_ACTIVATED
            </span>
            <span className={`px-2 py-1 border text-[8px] font-bold uppercase rounded-sm ${
              wakeCallReady
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              WAKE_CALL: {wakeCallReady ? 'READY_FOR_CONTROLLED_WAKE_REVIEW' : 'BLOCKED_PENDING_OPERATOR_APPROVAL'}
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              ROUTE_MODE: READINESS_CHECK_ONLY
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
        <div className="flex items-center gap-3 flex-wrap text-[7px] font-mono">
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

        {/* ── Readiness Pipeline tab ── */}
        {activeTab === 'flow' && (
          <div className="space-y-4">

            {/* Self-check orchestrator */}
            <div className="bg-card border border-primary/20 rounded-sm p-4 space-y-2">
              <div className="text-[9px] font-bold uppercase text-primary mb-1">
                Self-Check Orchestration
              </div>
              <div className="text-[8px] text-slate-400 mb-3">
                Runs the full readiness sequence automatically in preview/safe mode. No activation. No execution.
              </div>
              <FullWakeReadinessOrchestrator onEvidenceGenerated={handleOrchestratorEvidence} />
            </div>

            <div className="bg-card border border-border/40 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                10-Stage Wake Activation Readiness Pipeline
              </div>
              <WakeActivationFlowStages />
            </div>

            {/* Decision outcomes reference */}
            <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
              <div className="text-[9px] font-bold uppercase text-slate-400">Possible Activation Decision Outcomes</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { d: 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW', note: 'All 16 checks pass. Proceed to controlled review. No live dispatch performed.' },
                  { d: 'BLOCKED_NO_DRY_RUN_EVIDENCE',    note: 'Backend dry-run record with SERVER_DRY_RUN_VALIDATED required.' },
                  { d: 'BLOCKED_NO_LOCAL_WAKE_EVIDENCE',  note: 'Local /hooks/wake test (HTTP 200) evidence required.' },
                  { d: 'BLOCKED_AGENT_ENDPOINT_RISK',     note: '/hooks/agent endpoint must remain PROHIBITED.' },
                  { d: 'BLOCKED_EXECUTION_SURFACE_ACTIVE',note: 'Browser, filesystem, and broker must all be disabled/not connected.' },
                  { d: 'BLOCKED_NO_KILL_SWITCH',          note: 'Kill switch and rollback plan must be defined or planned.' },
                  { d: 'BLOCKED_NO_OPERATOR_APPROVAL',    note: 'Operator approval state must be REVIEW_READY or APPROVED.' },
                ].map(({ d, note }) => {
                  const dm = DECISION_META[d];
                  return (
                    <div key={d} className={`border rounded-sm p-3 space-y-1 ${dm?.border} ${dm?.bg}`}>
                      <div className={`text-[8px] font-bold font-mono ${dm?.text}`}>{d}</div>
                      <div className={`text-[7px] ${dm?.text} opacity-60`}>{note}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module purpose */}
            <div className="bg-card border border-amber-500/30 rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-amber-400 mb-2">Module Purpose</div>
              <div className="text-[8px] text-slate-400 leading-relaxed space-y-1">
                <p>This page determines whether Veridan Core is ready to move from dry-run validation toward a future controlled local OpenClaw wake notification.</p>
                <p>It aggregates evidence from prior dry-run records, local wake endpoint tests, service health checks, and operator governance state to compute a readiness decision.</p>
                <p className="text-amber-400/80 font-bold">Even when all 16 checks pass and the decision is READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW — this page does not activate anything. No network request is made. No token is read. No OpenClaw endpoint is contacted.</p>
                <div className="pt-2">
                  <Link to="/controlled-wake-activation-review"
                    className="inline-flex items-center gap-1.5 text-[8px] text-primary font-bold border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-sm transition-colors">
                    → Proceed to Controlled Wake Activation Review (next layer)
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Readiness Checker tab ── */}
        {activeTab === 'checker' && (
          <div className="bg-card border border-border/40 rounded-sm p-4">
            <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
              Wake Activation Readiness Checker — No Activation Performed
            </div>
            <WakeActivationForm onResult={handleResult} orchestratorResult={orchestratorResult} />
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[8px] text-slate-500 font-mono">
              {history.length} readiness records this session · All locked NOT_ACTIVATED / OPENCLAW_WAKE: NOT_SENT
            </div>
            <WakeActivationHistoryTable history={history} onSelect={setSelected} />
          </div>
        )}
      </div>

      {selected && <WakeActivationDetailDrawer record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}