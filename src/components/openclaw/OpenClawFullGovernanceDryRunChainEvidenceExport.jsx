/**
 * OpenClawFullGovernanceDryRunChainEvidenceExport — Phase 49
 * Collects all Phase 43–48 localStorage records into one full governance
 * dry-run chain evidence package for export.
 * UI + localStorage read/export only · No execution · No dispatch · Browser-only.
 */

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const PHASE_KEYS = {
  phase43: 'openclawPhase43UnifiedCommandRegistrySnapshot',
  phase44: 'openclawPhase44ProposalRegistryValidationRecords',
  phase45: 'openclawPhase45DryRunValidatorIntakeRecords',
  phase46: 'openclawPhase46DryRunValidatorRecords',
  phase47: 'openclawPhase47ValidatorReviewDecisions',
  phase48: 'openclawPhase48DryRunResultPackages',
};

const EXPORT_KEY = 'openclawPhase49FullGovernanceDryRunChainEvidenceExport';

const SAFETY_CLAIMS = [
  'Full governance dry-run chain evidence only',
  'No live execution',
  'No dispatch',
  'No backend mutation',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'Browser-only export',
];

function loadKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function countRecords(val) {
  if (val === null) return 0;
  if (Array.isArray(val)) return val.length;
  if (typeof val === 'object') return 1;
  return 0;
}

function buildSummary() {
  const p43 = loadKey(PHASE_KEYS.phase43);
  const p44 = loadKey(PHASE_KEYS.phase44);
  const p45 = loadKey(PHASE_KEYS.phase45);
  const p46 = loadKey(PHASE_KEYS.phase46);
  const p47 = loadKey(PHASE_KEYS.phase47);
  const p48 = loadKey(PHASE_KEYS.phase48);

  return {
    raw: { p43, p44, p45, p46, p47, p48 },
    phase43Present: p43 !== null,
    phase44RecordCount: countRecords(p44),
    phase45RecordCount: countRecords(p45),
    phase46RecordCount: countRecords(p46),
    phase47RecordCount: countRecords(p47),
    phase48RecordCount: countRecords(p48),
  };
}

export default function OpenClawFullGovernanceDryRunChainEvidenceExport() {
  const [summary, setSummary] = useState(null);
  const [lastExportedAt, setLastExportedAt] = useState(null);

  const refresh = () => setSummary(buildSummary());

  useEffect(() => { refresh(); }, []);

  const handleExport = () => {
    const s = summary || buildSummary();

    const chainIntegritySummary = {
      phase43Present: s.phase43Present,
      phase44RecordCount: s.phase44RecordCount,
      phase45RecordCount: s.phase45RecordCount,
      phase46RecordCount: s.phase46RecordCount,
      phase47RecordCount: s.phase47RecordCount,
      phase48RecordCount: s.phase48RecordCount,
      allExecutionDisabled: true,
      allDispatchDisabled: true,
      backendMutationDisabled: true,
    };

    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_FULL_GOVERNANCE_DRY_RUN_CHAIN_EVIDENCE_PHASE_49',
      chainStatus: 'EXECUTION_DISABLED',
      liveExecutionEnabled: false,
      dispatchEnabled: false,
      backendMutationEnabled: false,
      phase43CommandRegistrySnapshot: s.raw.p43,
      phase44ProposalRegistryValidationRecords: s.raw.p44,
      phase45DryRunValidatorIntakeRecords: s.raw.p45,
      phase46DryRunValidatorRecords: s.raw.p46,
      phase47ValidatorReviewDecisions: s.raw.p47,
      phase48DryRunResultPackages: s.raw.p48,
      chainIntegritySummary,
      safetyClaims: SAFETY_CLAIMS,
    };

    try {
      localStorage.setItem(EXPORT_KEY, JSON.stringify(exportPackage));
    } catch {}

    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase49-full-governance-dry-run-chain-evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportedAt(new Date().toISOString());
  };

  const s = summary;

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
        <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-400 mb-1">
          Phase 49 · Full Governance Dry-Run Chain Evidence Export
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Collects all Phase 43–48 localStorage records into one full chain evidence package.
          Browser-only · Read-only sources · No execution · No dispatch.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION LOCKED</span> — Phase 43–48 records are read as
          evidence sources only. No records are modified, created, or dispatched.
        </p>
      </div>

      {/* Chain Evidence Summary */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase text-slate-200">Chain Evidence Summary</div>
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/40 border border-border/40 text-slate-300 hover:text-slate-100 hover:bg-secondary/60 transition-colors rounded-sm text-[8px] font-bold uppercase"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Chain Evidence Summary
          </button>
        </div>

        {s && (
          <div className="divide-y divide-border/20">
            {/* Phase rows */}
            {[
              { label: 'Phase 43 registry snapshot found', value: s.phase43Present ? 'true' : 'false', pass: s.phase43Present, key: PHASE_KEYS.phase43 },
              { label: 'Phase 44 validation record count', value: String(s.phase44RecordCount), pass: s.phase44RecordCount > 0, key: PHASE_KEYS.phase44 },
              { label: 'Phase 45 intake record count',     value: String(s.phase45RecordCount), pass: s.phase45RecordCount > 0, key: PHASE_KEYS.phase45 },
              { label: 'Phase 46 validator record count',  value: String(s.phase46RecordCount), pass: s.phase46RecordCount > 0, key: PHASE_KEYS.phase46 },
              { label: 'Phase 47 review decision count',   value: String(s.phase47RecordCount), pass: s.phase47RecordCount > 0, key: PHASE_KEYS.phase47 },
              { label: 'Phase 48 result package count',    value: String(s.phase48RecordCount), pass: s.phase48RecordCount > 0, key: PHASE_KEYS.phase48 },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/10">
                {row.pass
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold text-slate-200">{row.label}</div>
                  <div className="text-[7px] text-blue-400 font-mono truncate">{row.key}</div>
                </div>
                <span className={`text-[9px] font-bold ${row.pass ? 'text-primary' : 'text-slate-500'}`}>
                  {row.value}
                </span>
              </div>
            ))}

            {/* Execution status rows */}
            {[
              { label: 'Live execution', value: 'DISABLED' },
              { label: 'Dispatch',       value: 'DISABLED' },
              { label: 'Backend mutation', value: 'DISABLED' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="flex-1 text-[9px] font-semibold text-slate-200">{row.label}</div>
                <span className="text-[8px] px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded font-bold uppercase">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase"
          >
            <Download className="w-4 h-4" />
            Export Full Governance Dry-Run Chain Evidence
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 space-y-0.5">
          <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
            snapshotType: VERIDAN_FULL_GOVERNANCE_DRY_RUN_CHAIN_EVIDENCE_PHASE_49 · Browser-local JSON export only · No backend writes
          </div>
          <div className="text-[8px] font-mono text-blue-400/60 text-center">
            Also stores to: {EXPORT_KEY}
          </div>
          {lastExportedAt && (
            <div className="text-[8px] font-mono text-primary/70 text-center">
              ✓ Last exported: {new Date(lastExportedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 49 Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(claim => (
            <span key={claim} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">
              {claim}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}