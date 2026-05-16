/**
 * ReadOnlyBrowserObservationDesignPanel — Phase 15
 * Preview-only design panel for future browser observation.
 * Does NOT enable browser execution.
 * No backend calls, no OpenClaw calls, no fetch, no automation.
 */
import React, { useState } from 'react';
import { Eye, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

const DESIGN_KEY   = 'openclawReadOnlyBrowserObservationDesignPacket';
const DESIGN_SCOPE = 'READ_ONLY_BROWSER_OBSERVATION_DESIGN_ONLY';

const ALLOWED_ACTIONS = [
  'Read page title',
  'Read current URL',
  'Capture DOM snapshot metadata',
  'Inspect visible text',
  'Detect page load status',
  'Detect selector presence',
  'Capture screenshot metadata only',
  'Record observation evidence',
];

const PROHIBITED_ACTIONS = [
  'clicking',
  'typing',
  'form submission',
  'credential entry',
  'file upload',
  'trading',
  'broker actions',
  'money movement',
  'wallet actions',
  'command dispatch',
  'autonomous browser control',
  'bypassing Cloudflare or login walls',
];

const PACKET_SHAPE = {
  observationId:            '<generated-uuid>',
  createdAt:                '<iso-timestamp>',
  targetUrl:                '<approved-url>',
  observationType:          '<READ_PAGE_TITLE | READ_URL | DOM_SNAPSHOT | INSPECT_TEXT | LOAD_STATUS | SELECTOR_DETECT | SCREENSHOT_METADATA | RECORD_EVIDENCE>',
  allowedReadOnlyFields:    ALLOWED_ACTIONS,
  prohibitedActions:        PROHIBITED_ACTIONS,
  executionAllowed:         false,
  dispatchAllowed:          false,
  browserMutationAllowed:   false,
  credentialEntryAllowed:   false,
  safetyMode:               'PREVIEW_ONLY',
};

const SAFETY_ASSERTIONS = {
  previewOnly:          true,
  readOnly:             true,
  noClick:              true,
  noTyping:             true,
  noFormSubmit:         true,
  noCredentialEntry:    true,
  noTrading:            true,
  noBrokerActions:      true,
  noWalletActions:      true,
  noMoneyMovement:      true,
  noCommandDispatch:    true,
  noAutonomousControl:  true,
};

function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export default function ReadOnlyBrowserObservationDesignPanel() {
  const [packet, setPacket] = useState(() => loadJSON(DESIGN_KEY));
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const p = {
      designScope:       DESIGN_SCOPE,
      generatedAt:       new Date().toISOString(),
      phase:             'PHASE_15_READ_ONLY_BROWSER_OBSERVATION_DESIGN',
      allowedFutureObservationActions: ALLOWED_ACTIONS,
      prohibitedActions: PROHIBITED_ACTIONS,
      proposedObservationPacketShape:  PACKET_SHAPE,
      safetyAssertions:  SAFETY_ASSERTIONS,
      note: 'Design packet only. Does not enable browser execution, dispatch, automation, credentials, trading, or money movement.',
    };
    try { localStorage.setItem(DESIGN_KEY, JSON.stringify(p, null, 2)); } catch {}
    setPacket(p);
  };

  const handleCopy = () => {
    if (!packet) return;
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(DESIGN_KEY); } catch {}
    setPacket(null);
  };

  const assertionEntries = Object.entries(SAFETY_ASSERTIONS);
  const passCount = assertionEntries.filter(([, v]) => v).length;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 15 · Read-Only Browser Observation Design</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Read-Only Browser Observation Design Panel
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Preview-only design. Does not enable browser execution, automation, or dispatch.</div>
      </div>

      {/* Design scope chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">{DESIGN_SCOPE}</span>
      </div>

      {/* Allowed + Prohibited side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Allowed */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-primary/5 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">Allowed Future Observation Actions</span>
          </div>
          <ul className="divide-y divide-border/30">
            {ALLOWED_ACTIONS.map((a) => (
              <li key={a} className="flex items-center gap-2 px-4 py-2">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[9px] text-slate-300">{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prohibited */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-destructive/5 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-destructive font-semibold">Prohibited Actions</span>
          </div>
          <ul className="divide-y divide-border/30">
            {PROHIBITED_ACTIONS.map((a) => (
              <li key={a} className="flex items-center gap-2 px-4 py-2">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] text-slate-300">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Proposed packet shape */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Proposed Observation Packet Shape</span>
        </div>
        <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
          {JSON.stringify(PACKET_SHAPE, null, 2)}
        </pre>
      </div>

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Safety Assertions — {passCount}/{assertionEntries.length} PASS</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-y divide-border/20">
          {assertionEntries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 px-4 py-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{key}: <span className="text-primary font-bold">{String(value)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Design packet only.</span>{' '}
          Does not enable browser execution, automation, dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <Eye className="w-3.5 h-3.5" />
          Generate Observation Design Packet
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!packet}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Observation Design JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!packet}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Observation Design
        </button>
      </div>

      {/* JSON preview */}
      {packet && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Observation Design Packet — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(packet.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(packet, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{DESIGN_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only design. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch.
      </div>
    </div>
  );
}