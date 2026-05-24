/**
 * ControlledWakeActivationReview
 * Final controlled review layer before any future backend wake activation route is considered.
 * NO activation. NO network request. NO token read. NO execution. NO dispatch.
 * Local-only review packet generation for audit planning only.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, AlertTriangle, Shield } from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';
import ControlledWakeEvidencePanel from '../components/controlled-wake-review/ControlledWakeEvidencePanel';
import ControlledWakeReviewForm from '../components/controlled-wake-review/ControlledWakeReviewForm';
import ControlledWakeReviewHistory from '../components/controlled-wake-review/ControlledWakeReviewHistory';
import ControlledWakeVerificationPanel from '../components/controlled-wake-review/ControlledWakeVerificationPanel';
import { FIXED_SAFETY_STATUSES, REVIEW_GUARDRAILS, loadReviewPackets } from '../components/controlled-wake-review/controlledWakeReviewContracts';

const LS_READINESS_KEY_PREFIX = 'VWAR-';

// Read the latest readiness evidence from localStorage (saved by WakeActivationForm)
function loadLatestReadinessEvidence() {
  try {
    // Try the session-style stored records first
    const raw = localStorage.getItem('wake_activation_readiness_history');
    if (raw) {
      const arr = JSON.parse(raw);
      if (arr?.length > 0) return arr[0];
    }
  } catch { /* ignore */ }
  return null;
}

const TABS = [
  { id: 'review',   label: 'Controlled Review' },
  { id: 'history',  label: 'Review History' },
  { id: 'verify',   label: 'Verification Report' },
];

const SAFETY_COLOR = (v) => {
  const red = ['NOT_SENT','PROHIBITED','NOT_ACTIVATED','NOT_EXECUTED','NOT_DISPATCHED','SERVER_SIDE_ONLY_NOT_READ','DISABLED'];
  return red.includes(v) ? 'text-destructive' : 'text-amber-400';
};

export default function ControlledWakeActivationReview() {
  const [activeTab, setActiveTab] = useState('review');
  // Load latest readiness evidence on mount — from localStorage or passed via session state
  const [evidence, setEvidence] = useState(() => loadLatestReadinessEvidence());
  const [packets, setPackets]   = useState(() => loadReviewPackets());

  const handleLoadEvidence = () => {
    const loaded = loadLatestReadinessEvidence();
    setEvidence(loaded || null);
  };

  const handlePacketGenerated = (pkt, allPackets) => {
    setPackets(allPackets);
    setActiveTab('history');
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
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              NETWORK_REQUEST: NOT_SENT
            </span>
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded-sm">
              ROUTE_MODE: CONTROLLED_REVIEW_ONLY
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

      {/* Guardrails */}
      <div className="border-b border-border/40 bg-card/60 px-6 py-2">
        <div className="flex items-center gap-3 flex-wrap text-[8px] font-mono">
          {REVIEW_GUARDRAILS.map(g => (
            <span key={g} className="text-destructive font-bold">⊘ {g}</span>
          ))}
        </div>
      </div>

      {/* Safety status chips */}
      <div className="border-b border-border/20 bg-secondary/10 px-6 py-1.5">
        <div className="flex items-center gap-3 flex-wrap text-[7px] font-mono">
          {Object.entries(FIXED_SAFETY_STATUSES).map(([k, v]) => (
            <span key={k} className="text-slate-500">
              {k}: <span className={`font-bold ${SAFETY_COLOR(v)}`}>{v}</span>
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
              {tab.id === 'history' && packets.length > 0 && (
                <span className="ml-1.5 px-1 py-0.5 bg-primary/20 text-primary text-[7px] rounded-sm">{packets.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-5">

        {/* ── Review tab ── */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {/* Load evidence row */}
            <div className="flex items-center justify-between">
              <div className="text-[8px] font-bold uppercase text-slate-400">
                Source Readiness Evidence
              </div>
              <button type="button" onClick={handleLoadEvidence}
                className="text-[8px] font-mono px-3 py-1.5 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded-sm transition-colors flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Reload from localStorage
              </button>
            </div>

            {/* Evidence display + requirements */}
            <ControlledWakeEvidencePanel record={evidence} />

            {/* Review form */}
            <div className="border border-border/40 bg-card rounded-sm p-4">
              <div className="text-[9px] font-bold uppercase text-slate-400 mb-3">
                Generate Controlled Wake Review Packet — No Activation
              </div>
              <ControlledWakeReviewForm
                record={evidence}
                onPacketGenerated={handlePacketGenerated}
              />
            </div>
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <ControlledWakeReviewHistory packets={packets} />
          </div>
        )}

        {/* ── Verification tab ── */}
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
  );
}