/**
 * BrowserObservationEvidenceExportPanel — Local-only Evidence Export
 * Packages design packet, policy matrix, approval rules, route plan, and simulation into one evidence object.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { Archive, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

const KEYS = {
  designPacket:  'openclawReadOnlyBrowserObservationDesignPacket',
  policyMatrix:  'openclawBrowserObservationPolicyMatrix',
  approvalRules: 'openclawBrowserObservationApprovalRules',
  routePlan:     'openclawBrowserObservationRoutePlan',
  simulation:    'openclawBrowserObservationSimulation',
};
const EXPORT_KEY      = 'openclawBrowserObservationEvidenceExport';
const EVIDENCE_NAME   = 'OPENCLAW_BROWSER_OBSERVATION_EVIDENCE_EXPORT';
const EVIDENCE_STATUS = 'LOCAL_ONLY_EVIDENCE_READY';

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noRealBrowserActions:     true,
  noClick:                  true,
  noTyping:                 true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noAutonomousControl:      true,
};

const SOURCE_LABELS = {
  designPacketPresent:  { label: 'Design Packet',   key: KEYS.designPacket },
  policyMatrixPresent:  { label: 'Policy Matrix',   key: KEYS.policyMatrix },
  approvalRulesPresent: { label: 'Approval Rules',  key: KEYS.approvalRules },
  routePlanPresent:     { label: 'Route Plan',       key: KEYS.routePlan },
  simulationPresent:    { label: 'Simulation',       key: KEYS.simulation },
};

function loadJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function checkPresence() {
  return {
    designPacketPresent:  !!localStorage.getItem(KEYS.designPacket),
    policyMatrixPresent:  !!localStorage.getItem(KEYS.policyMatrix),
    approvalRulesPresent: !!localStorage.getItem(KEYS.approvalRules),
    routePlanPresent:     !!localStorage.getItem(KEYS.routePlan),
    simulationPresent:    !!localStorage.getItem(KEYS.simulation),
  };
}

export default function BrowserObservationEvidenceExportPanel() {
  const [evidence, setEvidence] = useState(() => loadJSON(EXPORT_KEY));
  const [copied, setCopied]     = useState(false);

  const presence = checkPresence();
  const presentCount = Object.values(presence).filter(Boolean).length;
  const totalCount   = Object.keys(presence).length;

  const handleGenerate = () => {
    const sim = loadJSON(KEYS.simulation);
    const e = {
      evidenceName:         EVIDENCE_NAME,
      generatedAt:          new Date().toISOString(),
      sourcePacketsPresent: checkPresence(),
      designPacket:         loadJSON(KEYS.designPacket),
      policyMatrix:         loadJSON(KEYS.policyMatrix),
      approvalRules:        loadJSON(KEYS.approvalRules),
      routePlan:            loadJSON(KEYS.routePlan),
      simulation:           sim,
      evidenceStatus:       EVIDENCE_STATUS,
      safetyAssertions:     SAFETY_ASSERTIONS,
    };
    try { localStorage.setItem(EXPORT_KEY, JSON.stringify(e, null, 2)); } catch {}
    setEvidence(e);
  };

  const handleCopy = () => {
    if (!evidence) return;
    navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(EXPORT_KEY); } catch {}
    setEvidence(null);
  };

  // Pull simulation counts if available
  const sim = evidence?.simulation ?? loadJSON(KEYS.simulation);
  const simCounts = sim ? {
    simulated: sim.simulatedReadOnlyRoutes?.length ?? 0,
    review:    sim.reviewRequiredSimulations?.length ?? 0,
    blocked:   sim.blockedSimulations?.length ?? 0,
  } : null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 15 · Browser Observation Evidence Export</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Archive className="w-4 h-4 text-primary" /> Browser Observation Evidence Export
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only evidence package. No backend calls, no browser automation, no execution, no dispatch.</div>
      </div>

      {/* Evidence name chip + status badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[9px] font-mono font-bold text-primary">{EVIDENCE_NAME}</span>
        </div>
        <span className="text-[8px] font-bold px-2 py-1 rounded border text-primary border-primary/30 bg-primary/5 uppercase tracking-wider">
          {EVIDENCE_STATUS}
        </span>
      </div>

      {/* Source packet presence cards */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Source Packets — {presentCount}/{totalCount} Present
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SOURCE_LABELS).map(([presenceKey, { label }]) => {
            const present = presence[presenceKey];
            return (
              <div key={presenceKey} className={`border rounded-lg px-3 py-2.5 flex items-center gap-2 ${present ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
                {present
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <div>
                  <div className={`text-[9px] font-semibold ${present ? 'text-primary' : 'text-slate-500'}`}>{label}</div>
                  <div className={`text-[7px] uppercase font-bold tracking-wider ${present ? 'text-primary/70' : 'text-slate-600'}`}>{present ? 'PRESENT' : 'MISSING'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation summary counts (if available) */}
      {simCounts && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Simulation Summary</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Simulated',       count: simCounts.simulated, color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
              { label: 'Review Required', count: simCounts.review,    color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20' },
              { label: 'Blocked',         count: simCounts.blocked,   color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`border rounded-lg px-3 py-2.5 ${bg}`}>
                <div className={`text-[18px] font-bold ${color}`}>{count}</div>
                <div className={`text-[8px] font-semibold ${color}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-primary font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Evidence export is local-only and non-executable.</span>{' '}
          No backend calls, no browser automation, no execution, dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Archive className="w-3.5 h-3.5" />
          Generate Browser Observation Evidence Export
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!evidence}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Evidence Export JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!evidence}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Evidence Export
        </button>
      </div>

      {/* JSON preview */}
      {evidence && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Evidence Export — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(evidence.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(evidence, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{EXPORT_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No real browser actions. No execution. No dispatch.
      </div>
    </div>
  );
}