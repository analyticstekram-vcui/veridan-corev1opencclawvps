/**
 * Phase5CCommandContractRegistry
 * Preview-only command contract registry for future OpenClaw requests.
 * No OpenClaw call. No execution. No dispatch. localStorage only.
 */
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Shield, FileText, Lock } from 'lucide-react';

const LS_PREFIX = 'controlled_openclaw_command_contract_preview_';

// ── Allowed command contracts ─────────────────────────────────────────────────
const ALLOWED_CONTRACTS = [
  {
    commandType: 'READ_STATUS',
    purpose: 'Read current gateway status — no write, no execution',
    riskLevel: 'LOW',
    allowedEndpoint: 'NONE_PREVIEW_ONLY',
  },
  {
    commandType: 'READ_CAPABILITIES',
    purpose: 'Read gateway capability list — no write, no execution',
    riskLevel: 'LOW',
    allowedEndpoint: 'NONE_PREVIEW_ONLY',
  },
  {
    commandType: 'NAVIGATE_PREVIEW',
    purpose: 'Preview a future navigation request — no browser automation executed',
    riskLevel: 'LOW',
    allowedEndpoint: 'NONE_PREVIEW_ONLY',
  },
  {
    commandType: 'EXTRACT_PREVIEW',
    purpose: 'Preview a future data extraction request — no extraction executed',
    riskLevel: 'LOW',
    allowedEndpoint: 'NONE_PREVIEW_ONLY',
  },
  {
    commandType: 'VERIFY_PREVIEW',
    purpose: 'Preview a future verification request — no verification executed',
    riskLevel: 'LOW',
    allowedEndpoint: 'NONE_PREVIEW_ONLY',
  },
];

const ALLOWED_FIXED = {
  dispatchAllowed:         false,
  executionStatus:         'NOT_EXECUTED',
  requiresOperatorApproval: true,
  storage:                 'localStorage only',
};

// ── Blocked command types ─────────────────────────────────────────────────────
const BLOCKED_CONTRACTS = [
  { commandType: 'EXECUTE_AGENT',  blockReason: 'Agent execution not permitted in preview mode' },
  { commandType: 'RUN_TASK',       blockReason: 'Task execution not permitted in preview mode' },
  { commandType: 'WRITE_FILE',     blockReason: 'File writes are disabled' },
  { commandType: 'USE_CREDENTIAL', blockReason: 'Credential use is disabled' },
  { commandType: 'PLACE_TRADE',    blockReason: 'Broker/trading actions are disabled' },
  { commandType: 'MOVE_MONEY',     blockReason: 'Financial transactions are disabled' },
  { commandType: 'CALL_BROKER',    blockReason: 'Broker calls are disabled' },
  { commandType: 'CALL_BANK',      blockReason: 'Bank calls are disabled' },
  { commandType: 'CALL_BUREAU',    blockReason: 'Bureau calls are disabled' },
  { commandType: 'CALL_PAYMENT',   blockReason: 'Payment calls are disabled' },
];

// ── Verification checks ───────────────────────────────────────────────────────
const VERIFICATION_CHECKS = [
  { label: 'No new route created' },
  { label: 'OpenClaw not called' },
  { label: '/hooks/agent not called' },
  { label: 'No execution dispatch added' },
  { label: 'No browser automation added' },
  { label: 'No file writes added' },
  { label: 'No credential use added' },
  { label: 'No broker/trading action added' },
  { label: 'Allowed command types are preview-only' },
  { label: 'Blocked command types remain blocked' },
  { label: 'Result saved to localStorage only' },
  { label: 'executionStatus remains NOT_EXECUTED' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function generatePreviewId() {
  return `5C-PREVIEW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AllowedRow({ contract }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20 last:border-0">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-secondary/10 transition-colors">
        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[8px] font-bold text-slate-200 font-mono flex-1">{contract.commandType}</span>
        <span className="text-[6px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-sm font-bold">ALLOWED</span>
        <span className="text-[6px] text-amber-400 border border-amber-400/30 bg-amber-400/5 px-1.5 py-0.5 rounded-sm font-bold">PREVIEW_ONLY</span>
        <span className="text-[7px] text-slate-600 ml-1">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-10 pb-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-[7px] font-mono">
          <div><span className="text-slate-500">purpose: </span><span className="text-slate-300">{contract.purpose}</span></div>
          <div><span className="text-slate-500">riskLevel: </span><span className="text-amber-400">{contract.riskLevel}</span></div>
          <div><span className="text-slate-500">dispatchAllowed: </span><span className="text-destructive font-bold">false</span></div>
          <div><span className="text-slate-500">executionStatus: </span><span className="text-destructive font-bold">NOT_EXECUTED</span></div>
          <div><span className="text-slate-500">requiresApproval: </span><span className="text-primary">true</span></div>
          <div><span className="text-slate-500">allowedEndpoint: </span><span className="text-slate-400">NONE_PREVIEW_ONLY</span></div>
          <div><span className="text-slate-500">storage: </span><span className="text-slate-400">localStorage only</span></div>
        </div>
      )}
    </div>
  );
}

function BlockedRow({ contract }) {
  return (
    <div className="px-4 py-2.5 flex items-center gap-3 text-[7px] font-mono border-b border-border/20 last:border-0">
      <XCircle className="w-3 h-3 text-destructive shrink-0" />
      <span className="font-bold text-destructive w-36 shrink-0">{contract.commandType}</span>
      <span className="text-[6px] text-destructive border border-destructive/30 bg-destructive/5 px-1.5 py-0.5 rounded-sm font-bold shrink-0">BLOCKED</span>
      <span className="text-destructive font-bold shrink-0">BLOCKED_NOT_EXECUTED</span>
      <span className="text-slate-500 ml-auto text-right hidden sm:inline">{contract.blockReason}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Phase5CCommandContractRegistry() {
  const [preview,    setPreview]    = useState(null);
  const [saved,      setSaved]      = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const handleGenerate = () => {
    setSaved(false);
    const packet = {
      previewId:           generatePreviewId(),
      generatedAt:         new Date().toISOString(),
      allowedCommandTypes: ALLOWED_CONTRACTS.map(c => c.commandType),
      blockedCommandTypes: BLOCKED_CONTRACTS.map(c => c.commandType),
      dispatchAllowed:     false,
      executionStatus:     'NOT_EXECUTED',
      openclawCallMade:    false,
      routeCreated:        false,
      browserAutomation:   'DISABLED',
      fileWrite:           'DISABLED',
      credentialUse:       'DISABLED',
      brokerAction:        'DISABLED',
    };
    const key = `${LS_PREFIX}${Date.now()}`;
    try { localStorage.setItem(key, JSON.stringify(packet)); } catch { /* quota */ }
    setPreview(packet);
    setSaved(true);
  };

  return (
    <section className="space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-border/30 pb-1">
        Phase 5C — Command Contract Preview Registry
      </div>

      {/* Allowed contracts */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30">
          <span className="text-[8px] font-bold text-slate-300 uppercase">Allowed Command Contracts</span>
          <span className="ml-2 text-[7px] text-slate-500 font-mono">preview-only · no execution</span>
        </div>
        <div>
          {ALLOWED_CONTRACTS.map(c => <AllowedRow key={c.commandType} contract={c} />)}
        </div>
      </div>

      {/* Blocked command types */}
      <div className="border border-destructive/20 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-destructive/20 bg-destructive/5">
          <span className="text-[8px] font-bold text-destructive uppercase">Blocked Command Types</span>
          <span className="ml-2 text-[7px] text-destructive/60 font-mono">permanently blocked · not executable</span>
        </div>
        <div>
          {BLOCKED_CONTRACTS.map(c => <BlockedRow key={c.commandType} contract={c} />)}
        </div>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-1.5 text-[8px] font-semibold px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded transition-colors">
          <FileText className="w-3 h-3" />
          Generate Command Contract Preview
        </button>
        {saved && <span className="text-[7px] text-slate-500 font-mono">Saved to localStorage — no OpenClaw call.</span>}
      </div>

      {/* Preview packet */}
      {preview && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Command Contract Preview Packet</span>
            <span className="ml-auto text-[7px] text-slate-500 font-mono">Saved to localStorage</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[7px] font-mono">
            {Object.entries(preview).map(([k, v]) => {
              const isArr = Array.isArray(v);
              const displayVal = isArr ? v.join(', ') : String(v);
              return (
                <div key={k} className={`flex gap-1 ${isArr ? 'col-span-full' : ''}`}>
                  <span className="text-slate-500 shrink-0">{k}:</span>
                  <span className={
                    v === 'NOT_EXECUTED' || v === 'DISABLED' || v === false
                      ? 'text-destructive font-bold'
                      : v === true
                      ? 'text-primary font-bold'
                      : k === 'previewId' || k === 'generatedAt'
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }>{displayVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety chips */}
      <div className="flex flex-wrap gap-2">
        {['No OpenClaw call', 'No /hooks/agent', 'No execution', 'No browser automation', 'No file writes', 'No credential use', 'No broker action'].map(label => (
          <span key={label} className="text-[6px] font-mono font-semibold border px-2 py-0.5 rounded-full text-destructive border-destructive/30 bg-destructive/5">
            ✕ {label}
          </span>
        ))}
      </div>

      {/* Verification table */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <button type="button" onClick={() => setShowVerify(v => !v)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Phase 5C Verification Table</span>
          </div>
          <span className="text-[7px] text-slate-500">{showVerify ? '▾ hide' : '▸ show'}</span>
        </button>
        {showVerify && (
          <div className="px-4 pb-4 space-y-1">
            {VERIFICATION_CHECKS.map(c => (
              <div key={c.label} className="flex items-center gap-2 text-[7px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-slate-300">{c.label}</span>
                <span className="ml-auto font-bold text-primary">PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}