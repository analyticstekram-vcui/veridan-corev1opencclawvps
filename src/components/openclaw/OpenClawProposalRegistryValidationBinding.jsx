/**
 * OpenClawProposalRegistryValidationBinding
 * Phase 44 — Proposal to Registry Validation Binding for Veridan Core
 * UI + localStorage + browser-only export only.
 *
 * Does NOT:
 *   - Make backend / fetch / OpenClaw / SafeBridge / MCP calls
 *   - Call broker / bank / bureau / payment systems
 *   - Handle credentials
 *   - Execute browser automation
 *   - Use API mutation logic
 *   - Use timers / polling / schedulers
 */

import React, { useState } from 'react';
import { AlertCircle, Download, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const REGISTRY_LS_KEY  = 'openclawPhase43UnifiedCommandRegistrySnapshot';
const RECORDS_LS_KEY   = 'openclawPhase44ProposalRegistryValidationRecords';
const MAX_RECORDS      = 50;

const SAFETY_CLAIMS = [
  'Proposal validation only',
  'No live execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'No OpenClaw command dispatch',
  'No backend mutation',
  'Browser-only export',
];

const RISK_ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function loadRegistry() {
  try {
    const raw = localStorage.getItem(REGISTRY_LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_LS_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // Storage quota — skip silently
  }
}

function validateProposal(proposal, registry) {
  const rejectionReasons = [];
  const commands = registry?.commands || [];

  const match = commands.find(c => c.commandType === proposal.commandType);

  // Rule 1: commandType must exist in registry
  if (!match) {
    rejectionReasons.push(`commandType "${proposal.commandType}" not found in Phase 43 registry.`);
  }

  // Rule 2: requestedMode must match registry currentMode
  if (match && proposal.requestedMode !== match.currentMode) {
    rejectionReasons.push(`requestedMode "${proposal.requestedMode}" does not match registry currentMode "${match.currentMode}".`);
  }

  // Rule 3: requestedRiskTier must not exceed registry riskTier
  if (match) {
    const proposedRisk = RISK_ORDER[proposal.requestedRiskTier] ?? 99;
    const registryRisk = RISK_ORDER[match.riskTier] ?? 0;
    if (proposedRisk > registryRisk) {
      rejectionReasons.push(`requestedRiskTier "${proposal.requestedRiskTier}" exceeds registry riskTier "${match.riskTier}".`);
    }
  }

  // Rule 4: if registry approvalRequired is true, approvalRequested must be true
  if (match && match.approvalRequired === true && proposal.approvalRequested !== true) {
    rejectionReasons.push(`Registry requires approvalRequired=true but approvalRequested is false.`);
  }

  // Rule 5: blocked execution commands are always rejected
  if (match && match.commandGroup === 'BLOCKED_EXECUTION') {
    rejectionReasons.push(`commandGroup is BLOCKED_EXECUTION. This command cannot be proposed, previewed, or executed under any circumstances.`);
  }

  const registryMatch      = !!match;
  const isBlocked          = match?.commandGroup === 'BLOCKED_EXECUTION';
  const approvedForReview  = rejectionReasons.length === 0 && !isBlocked;
  const approvedForDryRun  = approvedForReview && match?.currentMode === 'DRY_RUN_ONLY';

  return {
    validationId: `phase44-val-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    validatedAt: new Date().toISOString(),
    proposalId: proposal.proposalId,
    commandType: proposal.commandType,
    registryMatch,
    approvedForReview,
    approvedForDryRun,
    executionAllowed: false,
    executionNote: 'Execution remains disabled. Proposal may only proceed as preview, governance, or dry-run record.',
    rejectionReasons,
    operatorNote: proposal.operatorNote || '',
    safetyClaims: SAFETY_CLAIMS,
    registrySnapshot: match ? {
      commandGroup: match.commandGroup,
      currentMode: match.currentMode,
      riskTier: match.riskTier,
      approvalRequired: match.approvalRequired,
    } : null,
  };
}

const EMPTY_FORM = {
  proposalId: '',
  commandType: '',
  requestedMode: '',
  requestedRiskTier: 'LOW',
  approvalRequested: true,
  operatorNote: '',
};

export default function OpenClawProposalRegistryValidationBinding() {
  const registry = loadRegistry();
  const [form, setForm] = useState(EMPTY_FORM);
  const [lastResult, setLastResult] = useState(null);
  const [records, setRecords] = useState(() => loadRecords());

  const commands = registry?.commands || [];
  const commandTypes = commands.map(c => c.commandType);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-fill mode and risk from registry when commandType changes
      if (field === 'commandType') {
        const match = commands.find(c => c.commandType === value);
        if (match) {
          next.requestedMode    = match.currentMode;
          next.requestedRiskTier = match.riskTier;
          next.approvalRequested = match.approvalRequired;
        }
      }
      return next;
    });
  };

  const handleValidate = () => {
    const result = validateProposal(form, registry);
    const updated = [result, ...records].slice(0, MAX_RECORDS);
    setLastResult(result);
    setRecords(updated);
    saveRecords(updated);
  };

  const handleExport = () => {
    const snapshot = {
      snapshotType: 'VERIDAN_PROPOSAL_REGISTRY_VALIDATION_PHASE_44',
      generatedAt: new Date().toISOString(),
      totalRecords: records.length,
      validationRecords: records,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-proposal-registry-validation-phase44-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    setRecords([]);
    try { localStorage.removeItem(RECORDS_LS_KEY); } catch {}
  };

  // ── No registry snapshot ──
  if (!registry) {
    return (
      <div className="flex items-start gap-3 px-4 py-4 bg-amber-500/5 border border-amber-500/30 rounded-sm font-mono">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-400">
          Phase 43 command registry snapshot not found. Export the registry snapshot before validating proposals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono">

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/30 rounded-sm">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-400 leading-relaxed">
          <span className="font-bold">Phase 44 — Proposal Registry Validation Binding</span> — Binds proposed actions to the Phase 43 registry. No live execution. No backend calls.
        </p>
      </div>

      {/* Registry Source Confirmation */}
      <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm text-[9px]">
        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        <span className="text-primary/80">Phase 43 registry loaded — <span className="font-bold">{commands.length} commands</span> available for validation.</span>
      </div>

      {/* Proposal Test Form */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Proposal Test Form</div>
        </div>
        <div className="p-4 space-y-3">

          {/* proposalId */}
          <div>
            <label className="block text-[8px] uppercase text-slate-500 mb-1">Proposal ID</label>
            <input
              type="text"
              value={form.proposalId}
              onChange={e => handleChange('proposalId', e.target.value)}
              placeholder="e.g. proposal-001"
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border/40 rounded-sm text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* commandType */}
          <div>
            <label className="block text-[8px] uppercase text-slate-500 mb-1">Command Type</label>
            <select
              value={form.commandType}
              onChange={e => handleChange('commandType', e.target.value)}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border/40 rounded-sm text-[10px] text-slate-200 focus:outline-none focus:border-primary/40"
            >
              <option value="">-- Select Command Type --</option>
              {commandTypes.map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>

          {/* requestedMode */}
          <div>
            <label className="block text-[8px] uppercase text-slate-500 mb-1">Requested Mode</label>
            <select
              value={form.requestedMode}
              onChange={e => handleChange('requestedMode', e.target.value)}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border/40 rounded-sm text-[10px] text-slate-200 focus:outline-none focus:border-primary/40"
            >
              <option value="">-- Select Mode --</option>
              <option value="READ_ONLY">READ_ONLY</option>
              <option value="DRY_RUN_ONLY">DRY_RUN_ONLY</option>
              <option value="BLOCKED_EXECUTION">BLOCKED_EXECUTION</option>
            </select>
          </div>

          {/* requestedRiskTier */}
          <div>
            <label className="block text-[8px] uppercase text-slate-500 mb-1">Requested Risk Tier</label>
            <select
              value={form.requestedRiskTier}
              onChange={e => handleChange('requestedRiskTier', e.target.value)}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border/40 rounded-sm text-[10px] text-slate-200 focus:outline-none focus:border-primary/40"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* approvalRequested */}
          <div className="flex items-center gap-3">
            <label className="text-[8px] uppercase text-slate-500">Approval Requested</label>
            <button
              type="button"
              onClick={() => handleChange('approvalRequested', !form.approvalRequested)}
              className={`px-3 py-1 border rounded-sm text-[9px] font-bold transition-colors ${
                form.approvalRequested
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-secondary/40 border-border/40 text-slate-400'
              }`}
            >
              {form.approvalRequested ? 'TRUE' : 'FALSE'}
            </button>
          </div>

          {/* operatorNote */}
          <div>
            <label className="block text-[8px] uppercase text-slate-500 mb-1">Operator Note</label>
            <textarea
              value={form.operatorNote}
              onChange={e => handleChange('operatorNote', e.target.value)}
              placeholder="Optional note..."
              rows={2}
              className="w-full px-3 py-1.5 bg-secondary/40 border border-border/40 rounded-sm text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-none"
            />
          </div>

          {/* Validate Button */}
          <button
            type="button"
            onClick={handleValidate}
            disabled={!form.proposalId || !form.commandType || !form.requestedMode}
            className="w-full py-2.5 bg-primary/10 border border-primary/40 text-primary font-bold text-[11px] uppercase rounded-sm hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Validate Proposal Against Registry
          </button>
        </div>
      </div>

      {/* Last Validation Result */}
      {lastResult && (
        <div className={`bg-card border rounded-sm overflow-hidden ${lastResult.approvedForReview ? 'border-primary/30' : 'border-destructive/30'}`}>
          <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${lastResult.approvedForReview ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
            {lastResult.approvedForReview
              ? <CheckCircle2 className="w-4 h-4 text-primary" />
              : <XCircle className="w-4 h-4 text-destructive" />}
            <div className={`text-[10px] font-bold uppercase ${lastResult.approvedForReview ? 'text-primary' : 'text-destructive'}`}>
              {lastResult.approvedForReview ? 'VALIDATION PASSED' : 'VALIDATION REJECTED'}
            </div>
          </div>
          <div className="p-4 space-y-2">
            {/* Key fields */}
            {[
              { k: 'Validation ID',        v: lastResult.validationId },
              { k: 'Validated At',         v: new Date(lastResult.validatedAt).toLocaleString() },
              { k: 'Proposal ID',          v: lastResult.proposalId },
              { k: 'Command Type',         v: lastResult.commandType },
              { k: 'Registry Match',       v: String(lastResult.registryMatch) },
              { k: 'Approved For Review',  v: String(lastResult.approvedForReview) },
              { k: 'Approved For Dry-Run', v: String(lastResult.approvedForDryRun) },
              { k: 'Execution Allowed',    v: 'false', vc: 'text-destructive font-bold' },
            ].map(({ k, v, vc }) => (
              <div key={k} className="flex items-start justify-between gap-2 px-3 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                <span className="text-[8px] text-slate-500 uppercase shrink-0">{k}</span>
                <span className={`text-[9px] font-mono text-right ${vc || 'text-slate-200'}`}>{v}</span>
              </div>
            ))}

            {/* Execution Note */}
            <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-sm">
              <div className="text-[8px] uppercase text-amber-500 font-bold mb-0.5">Execution Note</div>
              <p className="text-[9px] text-amber-400">{lastResult.executionNote}</p>
            </div>

            {/* Rejection Reasons */}
            {lastResult.rejectionReasons.length > 0 && (
              <div className="space-y-1">
                <div className="text-[8px] uppercase text-destructive font-bold">Rejection Reasons</div>
                {lastResult.rejectionReasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/20 rounded-sm">
                    <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <span className="text-[9px] text-slate-300">{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Table */}
      {records.length > 0 && (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Validation History <span className="text-slate-500 font-normal">({records.length}/{MAX_RECORDS})</span>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-2 py-0.5 border border-border/40 text-slate-400 hover:text-slate-300 text-[8px] uppercase rounded-sm transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Header */}
          <div className="hidden md:grid grid-cols-8 gap-1 px-4 py-2 bg-secondary/20 border-b border-border/30 text-[7px] uppercase tracking-wider text-slate-600">
            <span className="col-span-2">Validated At</span>
            <span>Proposal ID</span>
            <span>Command Type</span>
            <span>Match</span>
            <span>Review</span>
            <span>Dry-Run</span>
            <span>Rejections</span>
          </div>

          <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
            {records.map((rec) => (
              <div key={rec.validationId} className="grid grid-cols-1 md:grid-cols-8 gap-1 px-4 py-2 text-[8px] hover:bg-secondary/10 transition-colors">
                <span className="col-span-2 text-slate-400 font-mono">{new Date(rec.validatedAt).toLocaleString()}</span>
                <span className="text-slate-300 truncate">{rec.proposalId}</span>
                <span className="text-slate-300 font-mono truncate">{rec.commandType}</span>
                <span className={rec.registryMatch ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                  {rec.registryMatch ? 'YES' : 'NO'}
                </span>
                <span className={rec.approvedForReview ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                  {rec.approvedForReview ? 'PASS' : 'FAIL'}
                </span>
                <span className={rec.approvedForDryRun ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                  {rec.approvedForDryRun ? 'YES' : 'NO'}
                </span>
                <span className={rec.rejectionReasons?.length > 0 ? 'text-destructive font-bold' : 'text-slate-500'}>
                  {rec.rejectionReasons?.length ?? 0}
                </span>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-border/30 text-[8px] text-slate-600 italic">
            Memory + localStorage · Last {MAX_RECORDS} records · executionAllowed: false for all records
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Proposal Registry Validation Records
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] text-muted-foreground/60 text-center italic">
          Browser-local JSON export only · No backend writes · No API calls · No execution
        </div>
      </div>

      {/* Safety Footer */}
      <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-sm text-[8px] text-primary/70">
        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
        <span>Phase 44 — executionAllowed is false for every validation result. No live execution. No backend calls. No broker/bank/bureau/credential logic.</span>
      </div>
    </div>
  );
}