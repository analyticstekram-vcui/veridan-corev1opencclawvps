/**
 * ControlledWakeActivationReview
 * Normal view: four summary cards (Status, Notify, Task Preview, Activity).
 * Advanced section: all existing detailed tabs, collapsed by default.
 * No activation. No network request. No token read. No execution. No dispatch.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, AlertTriangle, ChevronDown, ChevronUp,
  Activity, Bell, ClipboardList, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';
import ControlledWakeEvidencePanel from '../components/controlled-wake-review/ControlledWakeEvidencePanel';
import ControlledWakeReviewForm from '../components/controlled-wake-review/ControlledWakeReviewForm';
import ControlledWakeReviewHistory from '../components/controlled-wake-review/ControlledWakeReviewHistory';
import ControlledWakeVerificationPanel from '../components/controlled-wake-review/ControlledWakeVerificationPanel';
import { FIXED_SAFETY_STATUSES, REVIEW_GUARDRAILS, loadReviewPackets } from '../components/controlled-wake-review/controlledWakeReviewContracts';
import ControlledWakeSendPanel from '../components/controlled-wake-review/ControlledWakeSendPanel';
import FullWakeReadinessOrchestrator from '../components/wake-activation/FullWakeReadinessOrchestrator';

// ── helpers ──────────────────────────────────────────────────────────────────

function loadLatestReadinessEvidence() {
  try {
    const raw = localStorage.getItem('wake_activation_readiness_history');
    if (raw) {
      const arr = JSON.parse(raw);
      if (arr?.length > 0) return arr[0];
    }
  } catch { /* ignore */ }
  return null;
}

const SAFETY_COLOR = (v) => {
  const red = ['NOT_SENT','PROHIBITED','NOT_ACTIVATED','NOT_EXECUTED','NOT_DISPATCHED','SERVER_SIDE_ONLY_NOT_READ','DISABLED'];
  return red.includes(v) ? 'text-destructive' : 'text-amber-400';
};

const ADVANCED_TABS = [
  { id: 'review',  label: 'Controlled Review' },
  { id: 'send',    label: 'Send Wake Notification' },
  { id: 'history', label: 'Review History' },
  { id: 'verify',  label: 'Verification Report' },
];

// ── Summary cards ─────────────────────────────────────────────────────────────

function StatusCard({ evidence, packets }) {
  const ready = evidence?.allPass === true && evidence?.decision === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW';
  const approval = evidence?.form?.operatorApprovalState || '—';
  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-300">
        <Shield className="w-3.5 h-3.5 text-primary" /> System Status
      </div>
      <div className="space-y-1 text-[8px] font-mono">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-bold rounded-sm">NOT_ACTIVATED</span>
          <span className="text-slate-500">activation status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${ready ? 'text-primary' : 'text-amber-400'}`}>{ready ? 'READY' : 'NOT READY'}</span>
          <span className="text-slate-500">readiness gate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300">{approval}</span>
          <span className="text-slate-500">operator approval</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold">{packets.length}</span>
          <span className="text-slate-500">review packets</span>
        </div>
      </div>
    </div>
  );
}

function NotifyCard({ evidence, onOpenSend }) {
  const approval = evidence?.form?.operatorApprovalState;
  const sendReady = evidence?.allPass === true &&
    evidence?.decision === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW' &&
    evidence?.activationStatus === 'NOT_ACTIVATED' &&
    ['APPROVED', 'REVIEW_READY'].includes(approval);
  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-300">
        <Bell className="w-3.5 h-3.5 text-amber-400" /> Notify
      </div>
      <div className="text-[8px] text-slate-400 leading-relaxed">
        Send a notification-only POST to <span className="text-primary font-bold">/hooks/wake</span>. Token stays server-side. No execution.
      </div>
      <div className="flex items-center gap-1.5 text-[7px] font-mono">
        {sendReady
          ? <><CheckCircle2 className="w-2.5 h-2.5 text-primary" /><span className="text-primary">Evidence gate satisfied</span></>
          : <><XCircle className="w-2.5 h-2.5 text-amber-400" /><span className="text-amber-400">Evidence not ready — see Advanced</span></>}
      </div>
      <button type="button" onClick={onOpenSend}
        className={`w-full py-2 text-[8px] font-bold uppercase rounded-sm border transition-colors ${
          sendReady
            ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
            : 'bg-secondary/20 border-border/30 text-slate-500 hover:text-slate-300'
        }`}>
        Open Send Panel →
      </button>
    </div>
  );
}

function TaskPreviewCard({ evidence }) {
  const checks = evidence?.validationResults || {};
  const passed = Object.values(checks).filter(Boolean).length;
  const total  = Object.keys(checks).length || 0;
  const decision = evidence?.decision || '—';
  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-300">
        <ClipboardList className="w-3.5 h-3.5 text-blue-400" /> Task Preview
      </div>
      <div className="space-y-1.5 text-[8px] font-mono">
        <div>
          <span className="text-slate-500">evidenceId: </span>
          <span className="text-primary">{evidence?.evidenceId || '(none loaded)'}</span>
        </div>
        <div>
          <span className="text-slate-500">checks: </span>
          <span className={passed === 16 ? 'text-primary font-bold' : 'text-amber-400 font-bold'}>{total > 0 ? `${passed}/${total}` : '—'}</span>
        </div>
        <div className="text-slate-500 text-[7px] break-all">
          decision: <span className={decision.startsWith('READY') ? 'text-primary' : 'text-amber-400'}>{decision.replace('READY_FOR_', '').slice(0, 36)}</span>
        </div>
        <div>
          <span className="text-slate-500">createdAt: </span>
          <span className="text-slate-300">{evidence?.createdAt ? evidence.createdAt.slice(0, 19).replace('T', ' ') : '—'}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ packets }) {
  const latest = packets.slice(0, 3);
  return (
    <div className="bg-card border border-border/40 rounded-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-300">
        <Activity className="w-3.5 h-3.5 text-chart-3" /> Activity
      </div>
      {latest.length === 0
        ? <div className="text-[8px] text-slate-500 font-mono">No review packets yet this session.</div>
        : (
          <div className="space-y-1.5">
            {latest.map((p, i) => (
              <div key={p.reviewId || i} className="flex items-center gap-2 text-[7px] font-mono">
                <span className={`px-1.5 py-0.5 border rounded-sm font-bold ${
                  p.decision === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW'
                    ? 'text-primary border-primary/20 bg-primary/5'
                    : 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                }`}>
                  {p.decision?.replace('READY_FOR_', '').slice(0, 20) || 'PACKET'}
                </span>
                <span className="text-slate-500">{p.generatedAt ? new Date(p.generatedAt).toLocaleTimeString() : '—'}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ControlledWakeActivationReview() {
  const [evidence, setEvidence]     = useState(() => loadLatestReadinessEvidence());
  const [packets,  setPackets]      = useState(() => loadReviewPackets());
  const [advanced, setAdvanced]     = useState(false);
  const [activeTab, setActiveTab]   = useState('review');

  const handleLoadEvidence = () => setEvidence(loadLatestReadinessEvidence());

  const handleOrchestratorEvidence = (rec) => {
    setEvidence(rec);
    setActiveTab('review');
  };

  const handlePacketGenerated = (pkt, allPackets) => {
    setPackets(allPackets);
    setActiveTab('history');
  };

  const openSend = () => {
    setAdvanced(true);
    setActiveTab('send');
    setTimeout(() => document.getElementById('advanced-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link to="/wake-activation-readiness"
              className="inline-flex items-center gap-1 text-[7px] text-slate-500 hover:text-slate-300 mb-2 transition-colors">
              <ArrowLeft className="w-2.5 h-2.5" /> Back to Wake Activation Readiness Gate
            </Link>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · OpenClaw Governance
            </div>
            <h1 className="text-lg font-bold text-foreground">Controlled Wake Activation Review</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Reviews readiness evidence and generates final operator sign-off packet. No activation performed.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              ACTIVATION_STATUS: NOT_ACTIVATED
            </span>
            <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold uppercase rounded-sm">
              WAKE_ROUTE: /hooks/wake ONLY
            </span>
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">
              ROUTE_MODE: CONTROLLED_WAKE_NOTIFICATION
            </span>
          </div>
        </div>
      </div>

      {/* Mode banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2.5 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">
          CONTROLLED_REVIEW_ONLY — NO ACTIVATION PERFORMED
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">

        {/* ── Four summary cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard evidence={evidence} packets={packets} />
          <NotifyCard evidence={evidence} onOpenSend={openSend} />
          <TaskPreviewCard evidence={evidence} />
          <ActivityCard packets={packets} />
        </div>

        {/* Reload evidence shortcut */}
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={handleLoadEvidence}
            className="flex items-center gap-1.5 text-[8px] font-mono px-3 py-1.5 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded-sm transition-colors">
            <RefreshCw className="w-3 h-3" /> Reload Evidence from localStorage
          </button>
          {evidence && (
            <span className="text-[7px] text-slate-500 font-mono">
              Loaded: <span className="text-primary">{evidence.evidenceId}</span>
            </span>
          )}
        </div>

        {/* Orchestrator — shown prominently when evidence is missing */}
        {!evidence && (
          <div className="border border-primary/20 bg-card rounded-sm p-4 space-y-2">
            <div className="text-[9px] font-bold uppercase text-primary mb-1">No Readiness Evidence Loaded</div>
            <div className="text-[8px] text-slate-400 mb-3">
              Run the full wake readiness check to generate and load evidence automatically.
            </div>
            <FullWakeReadinessOrchestrator onEvidenceGenerated={handleOrchestratorEvidence} />
          </div>
        )}

        {/* ── Advanced section ───────────────────────────────────────────── */}
        <div id="advanced-section" className="border border-border/40 rounded-sm overflow-hidden">
          <button type="button" onClick={() => setAdvanced(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-card hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Advanced</span>
              <span className="text-[7px] text-slate-500 font-mono">— detailed review, send panel, history, verification</span>
            </div>
            {advanced
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {advanced && (
            <div className="border-t border-border/40 bg-card">
              {/* Guardrails */}
              <div className="border-b border-border/30 bg-card/60 px-5 py-2">
                <div className="flex items-center gap-3 flex-wrap text-[8px] font-mono">
                  {REVIEW_GUARDRAILS.map(g => (
                    <span key={g} className="text-destructive font-bold">⊘ {g}</span>
                  ))}
                </div>
              </div>

              {/* Safety status chips */}
              <div className="border-b border-border/20 bg-secondary/10 px-5 py-1.5">
                <div className="flex items-center gap-3 flex-wrap text-[7px] font-mono">
                  {Object.entries(FIXED_SAFETY_STATUSES).map(([k, v]) => (
                    <span key={k} className="text-slate-500">
                      {k}: <span className={`font-bold ${SAFETY_COLOR(v)}`}>{v}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-border/30 px-5">
                <div className="flex">
                  {ADVANCED_TABS.map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}>
                      {tab.label}
                      {tab.id === 'history' && packets.length > 0 && (
                        <span className="ml-1.5 px-1 py-0.5 bg-primary/20 text-primary text-[7px] rounded-sm">{packets.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="p-5 space-y-4">

                {activeTab === 'review' && (
                  <div className="space-y-4">
                    <ControlledWakeEvidencePanel record={evidence} />
                    <div className="border border-border/40 bg-card rounded-sm p-4">
                      <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                        Generate Controlled Wake Review Packet — No Activation
                      </div>
                      <ControlledWakeReviewForm record={evidence} onPacketGenerated={handlePacketGenerated} />
                    </div>
                  </div>
                )}

                {activeTab === 'send' && (
                  <div className="border border-border/40 bg-card rounded-sm p-4">
                    <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                      Send Controlled Wake Notification — Notification Only, No Execution
                    </div>
                    <ControlledWakeSendPanel evidence={evidence} />
                  </div>
                )}

                {activeTab === 'history' && (
                  <ControlledWakeReviewHistory packets={packets} />
                )}

                {activeTab === 'verify' && (
                  <div className="space-y-3">
                    <ControlledWakeVerificationPanel />
                    <div className="border border-border/40 bg-card rounded-sm p-4 text-[8px] text-slate-400 space-y-2 leading-relaxed">
                      <div className="font-bold text-slate-300 uppercase text-[9px]">Module Boundary Statement</div>
                      <p>This page is the final controlled review layer before any future backend wake activation route is considered.</p>
                      <p>It reviews readiness evidence records and generates a local-only operator sign-off packet for audit purposes.</p>
                      <p className="text-amber-400/80 font-bold">Even when all requirements pass — this page does not activate anything. No network request is made. No token is read. No OpenClaw endpoint is contacted. No execution occurs.</p>
                      <p>Any future live activation must be implemented as a separate, independently reviewed backend route with full operator approval, audit logging, and kill-switch readiness.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}