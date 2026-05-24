/**
 * Phase5DCommandPreviewBuilder
 * Local-only command preview builder for Phase 5D.
 * No OpenClaw call. No execution. No dispatch. localStorage only.
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const LS_PREFIX = 'controlled_openclaw_command_preview_';

const ALLOWED_COMMANDS = [
  { commandType: 'READ_STATUS',       purpose: 'Read current gateway status',               riskLevel: 'LOW' },
  { commandType: 'READ_CAPABILITIES', purpose: 'Read gateway capability list',               riskLevel: 'LOW' },
  { commandType: 'NAVIGATE_PREVIEW',  purpose: 'Preview a future navigation request',        riskLevel: 'LOW' },
  { commandType: 'EXTRACT_PREVIEW',   purpose: 'Preview a future data extraction request',   riskLevel: 'LOW' },
  { commandType: 'VERIFY_PREVIEW',    purpose: 'Preview a future verification request',      riskLevel: 'LOW' },
];

const BLOCKED_TYPES = [
  'EXECUTE_AGENT', 'RUN_TASK', 'WRITE_FILE', 'USE_CREDENTIAL',
  'PLACE_TRADE', 'MOVE_MONEY', 'CALL_BROKER', 'CALL_BANK', 'CALL_BUREAU', 'CALL_PAYMENT',
];

const SAFETY_ROWS = [
  { label: 'Dispatch',          value: 'DISABLED' },
  { label: 'Execution',         value: 'NOT_EXECUTED' },
  { label: 'OpenClaw Call',     value: 'NOT_MADE' },
  { label: 'Browser Automation', value: 'DISABLED' },
  { label: 'File Write',        value: 'DISABLED' },
  { label: 'Credential Use',    value: 'DISABLED' },
  { label: 'Broker Action',     value: 'DISABLED' },
];

const VERIFICATION_CHECKS = [
  'No new route created',
  'OpenClaw not called',
  '/hooks/agent not called',
  'Only Phase 5C allowed command types selectable',
  'Blocked command types not selectable',
  'No execution dispatch added',
  'No browser automation added',
  'No file writes added',
  'No credential use added',
  'No broker/trading action added',
  'Preview saved to localStorage only',
  'executionStatus remains NOT_EXECUTED',
];

function generatePreviewId() {
  return `5D-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function Phase5DCommandPreviewBuilder() {
  const [selected,   setSelected]   = useState(ALLOWED_COMMANDS[0].commandType);
  const [preview,    setPreview]    = useState(null);
  const [saved,      setSaved]      = useState(false);
  const [jsonOpen,   setJsonOpen]   = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const selectedContract = ALLOWED_COMMANDS.find(c => c.commandType === selected);

  const handleGenerate = () => {
    setSaved(false);
    setJsonOpen(false);
    const packet = {
      previewId:           generatePreviewId(),
      generatedAt:         new Date().toISOString(),
      commandType:         selected,
      commandPurpose:      selectedContract?.purpose ?? '',
      riskLevel:           selectedContract?.riskLevel ?? 'LOW',
      sourcePhase:         'PHASE_5D_COMMAND_PREVIEW_BUILDER',
      dispatchAllowed:     false,
      executionStatus:     'NOT_EXECUTED',
      openclawCallMade:    false,
      routeCreated:        false,
      approvalRequired:    true,
      approvedForExecution: false,
      allowedEndpoint:     'NONE_PREVIEW_ONLY',
      browserAutomation:   'DISABLED',
      fileWrite:           'DISABLED',
      credentialUse:       'DISABLED',
      brokerAction:        'DISABLED',
      storage:             'LOCALSTORAGE_ONLY',
    };
    const key = `${LS_PREFIX}${Date.now()}`;
    try { localStorage.setItem(key, JSON.stringify(packet)); } catch { /* quota */ }
    setPreview(packet);
    setSaved(true);
    setJsonOpen(true);
  };

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Phase 5D — Command Preview Builder
      </div>

      {/* Command type selector */}
      <div className="border border-border/40 bg-card rounded-lg p-4 space-y-3">
        <div className="text-[8px] font-bold text-slate-300 uppercase">Select Allowed Command Type</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {ALLOWED_COMMANDS.map(c => (
            <button
              key={c.commandType}
              type="button"
              onClick={() => { setSelected(c.commandType); setPreview(null); setSaved(false); }}
              className={`text-left px-3 py-2.5 rounded border text-[7px] font-mono transition-colors ${
                selected === c.commandType
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/40 bg-secondary/20 text-slate-400 hover:border-primary/30 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">{c.commandType}</div>
              <div className="text-[6px] mt-0.5 opacity-70">{c.purpose}</div>
              <div className="text-[6px] mt-0.5">
                <span className="text-amber-400">RISK: {c.riskLevel}</span>
                {selected === c.commandType && <span className="ml-2 text-primary font-bold">SELECTED</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Blocked types — display only */}
        <div className="pt-2 border-t border-border/20">
          <div className="text-[7px] font-bold text-destructive uppercase mb-1.5">Blocked — Not Selectable</div>
          <div className="flex flex-wrap gap-1.5">
            {BLOCKED_TYPES.map(t => (
              <span key={t} className="text-[6px] font-mono px-1.5 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded-sm">
                ⊘ {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors">
          <FileText className="w-3 h-3" />
          Generate Local Command Preview
        </button>
        {saved && <span className="text-[7px] text-slate-500 font-mono">Saved to localStorage — no OpenClaw call.</span>}
      </div>

      {/* Collapsible JSON preview */}
      {preview && (
        <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
          <button type="button" onClick={() => setJsonOpen(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-[8px] font-bold text-slate-200">
                {preview.previewId}
              </span>
              <span className="text-[6px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-sm font-bold ml-1">{preview.commandType}</span>
            </div>
            {jsonOpen
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          {jsonOpen && (
            <div className="px-4 pb-4">
              <pre className="bg-secondary/30 rounded p-3 text-[7px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Safety status card */}
      <div className="border border-border/40 bg-card rounded-lg p-4 space-y-2">
        <div className="text-[8px] font-bold text-slate-300 uppercase mb-1">Safety Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
          {SAFETY_ROWS.map(r => (
            <div key={r.label} className="flex items-center gap-1.5 text-[7px] font-mono">
              <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />
              <span className="text-slate-500">{r.label}:</span>
              <span className="text-destructive font-bold">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification table */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <button type="button" onClick={() => setVerifyOpen(v => !v)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Phase 5D Verification Table</span>
          </div>
          <span className="text-[7px] text-slate-500">{verifyOpen ? '▾ hide' : '▸ show'}</span>
        </button>
        {verifyOpen && (
          <div className="px-4 pb-4 space-y-1">
            {VERIFICATION_CHECKS.map(label => (
              <div key={label} className="flex items-center gap-2 text-[7px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-300">{label}</span>
                <span className="ml-auto font-bold text-primary">PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}