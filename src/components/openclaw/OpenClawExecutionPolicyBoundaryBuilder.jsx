/**
 * OpenClawExecutionPolicyBoundaryBuilder — Phase 52
 * Browser-only policy builder defining Veridan Core's execution policy
 * requirements before any future sandbox/dispatch/mutation work.
 * UI + localStorage read/export only. No execution. No dispatch.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, XCircle, ShieldOff } from 'lucide-react';

const SOURCE_KEY = 'openclawPhase51SecurityBoundaryPolicy';
const EXPORT_KEY = 'openclawPhase52ExecutionPolicyBoundary';

const SAFETY_CLAIMS = [
  'Execution policy boundary only',
  'No live execution',
  'No dispatch',
  'No backend mutation',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'No API mutation',
  'Planning and policy review only',
  'Browser-only export',
];

const POLICY_SECTIONS = [
  {
    id: 'command_allowlist',
    sectionName: 'A. Command Execution Allowlist Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/policy layer',
    rules: [
      'Execution-capable commands must be explicitly allowlisted before use',
      'Read-only commands remain separate from mutation commands',
      'Dry-run commands cannot automatically become execution commands',
      'Unknown command types must be rejected',
      'Blocked execution commands remain blocked until separate approval and implementation',
    ],
  },
  {
    id: 'high_risk_blocklist',
    sectionName: 'B. High-Risk Command Blocklist Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/policy layer',
    rules: [
      'Money movement remains blocked',
      'Credential entry remains blocked',
      'Live trading remains blocked',
      'Credit bureau submissions remain blocked',
      'Legal filing/UCC filing remains blocked',
      'External API mutation remains blocked until execution policy is enforced',
    ],
  },
  {
    id: 'approval_threshold',
    sectionName: 'C. Approval Threshold Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/policy layer',
    rules: [
      'LOW risk may allow preview-only handling',
      'MEDIUM risk requires operator review before dry-run package',
      'HIGH risk requires explicit operator approval and evidence package',
      'CRITICAL risk remains blocked in this phase',
      'No automated approval for execution mode',
    ],
  },
  {
    id: 'kill_switch_rollback',
    sectionName: 'D. Kill Switch / Rollback Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/policy layer',
    rules: [
      'Global execution kill switch must exist before any execution mode',
      'Per-module disable switches must exist',
      'Failed validation must stop action flow',
      'Failed dispatch must create evidence record',
      'Rollback/recovery policy must be defined before mutation routes',
    ],
  },
  {
    id: 'rate_limits',
    sectionName: 'E. Rate Limit / Guardrail Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/policy layer',
    rules: [
      'Max actions per session must be defined',
      'Max actions per module must be defined',
      'Cooldown periods must be defined',
      'Repeated failures must lock the action path',
      'Rate limits must apply before dispatch',
    ],
  },
  {
    id: 'execution_evidence',
    sectionName: 'F. Execution Evidence Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/policy layer',
    rules: [
      'Every execution-capable action must create pre-action evidence',
      'Every dispatch attempt must create dispatch evidence',
      'Every result must create post-action evidence',
      'Rejected actions must create rejection evidence',
      'Evidence exports must never include secrets',
    ],
  },
];

function loadKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function OpenClawExecutionPolicyBoundaryBuilder() {
  const [sourcePresent, setSourcePresent] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastExportedAt, setLastExportedAt] = useState(null);

  useEffect(() => {
    setSourcePresent(loadKey(SOURCE_KEY) !== null);
  }, []);

  const handleExport = () => {
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_EXECUTION_POLICY_BOUNDARY_PHASE_52',
      currentMode: 'EXECUTION_POLICY_DESIGN_ONLY',
      sourceSecurityPolicyPresent: sourcePresent,
      executionPolicyStatus: 'DEFINED_FOR_PLANNING_ONLY',
      executionGate: 'CLOSED',
      nextAllowedMode: 'POLICY_REVIEW_ONLY',
      policySections: POLICY_SECTIONS.map(s => ({
        sectionName: s.sectionName,
        policyStatus: s.policyStatus,
        executionImpact: s.executionImpact,
        rules: s.rules,
      })),
      safetyClaims: SAFETY_CLAIMS,
    };

    try { localStorage.setItem(EXPORT_KEY, JSON.stringify(exportPackage)); } catch {}

    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase52-execution-policy-boundary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportedAt(new Date().toISOString());
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-orange-500/5 border border-orange-500/20 rounded-sm">
        <div className="text-[12px] font-bold uppercase tracking-wide text-orange-400 mb-1">
          Execution Policy Boundary Builder
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Phase 52 · Defines execution policy requirements before any future sandbox, paper trading,
          OpenClaw dispatch, browser automation, or API mutation work.
          This phase does not enable execution.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION GATE: CLOSED</span> — executionPolicyStatus is DEFINED_FOR_PLANNING_ONLY.
          No execution, dispatch, or API mutation logic is present here.
        </p>
      </div>

      {/* Missing source warning */}
      {!sourcePresent && (
        <div className="flex items-start gap-2 px-3 py-3 bg-destructive/5 border border-destructive/20 rounded-sm">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[9px] text-destructive/90">
            Phase 51 Security Boundary Policy not found. Export Phase 51 before defining execution policy.
          </p>
        </div>
      )}

      {/* Current Execution Posture */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Current Execution Posture</div>
        </div>
        <div className="p-3 grid grid-cols-1 gap-1.5">
          {[
            { label: 'currentMode',            value: 'EXECUTION_POLICY_DESIGN_ONLY', color: 'text-orange-400' },
            { label: 'sourceSecurityPolicy',   value: SOURCE_KEY,                     color: 'text-blue-400' },
            { label: 'executionGate',          value: 'CLOSED',                       color: 'text-destructive' },
            { label: 'executionPolicyStatus',  value: 'DEFINED_FOR_PLANNING_ONLY',    color: 'text-amber-400' },
            { label: 'nextAllowedMode',        value: 'POLICY_REVIEW_ONLY',           color: 'text-amber-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{row.label}:</span>
              <span className={`text-[8px] font-bold font-mono truncate max-w-[60%] text-right ${row.color}`}>{row.value}</span>
            </div>
          ))}
          {[
            'liveExecutionEnabled',
            'dispatchEnabled',
            'backendMutationEnabled',
            'externalApiMutationEnabled',
            'browserAutomationExecutionEnabled',
          ].map(label => (
            <div key={label} className="flex items-center justify-between gap-3 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{label}:</span>
              <span className="text-[8px] px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded font-bold uppercase">false</span>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Sections */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Policy Sections</div>
          <div className="text-[8px] text-slate-500 mt-0.5">All sections status: DEFINED_NOT_ACTIVE_FOR_EXECUTION</div>
        </div>
        <div className="divide-y divide-border/20">
          {POLICY_SECTIONS.map(section => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <ShieldOff className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-200">{section.sectionName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] px-1.5 py-0.5 border border-orange-500/30 bg-orange-500/5 text-orange-400 rounded font-bold uppercase whitespace-nowrap">DEFINED · NOT ACTIVE</span>
                  <span className={`text-[9px] text-slate-400 transition-transform ${expandedSection === section.id ? 'rotate-90' : ''}`}>▶</span>
                </div>
              </button>
              {expandedSection === section.id && (
                <div className="px-4 pb-3 space-y-1.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
                    <AlertCircle className="w-3 h-3 text-amber-500/70 shrink-0" />
                    <span className="text-[8px] text-amber-400/80 italic">{section.executionImpact}</span>
                  </div>
                  {section.rules.map(rule => (
                    <div key={rule} className="flex items-start gap-2 px-3 py-1.5 bg-secondary/10 border border-border/20 rounded-sm">
                      <span className="text-orange-400/50 text-[9px] shrink-0 mt-0.5">·</span>
                      <span className="text-[8px] text-slate-400 leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-orange-500/5 border border-orange-500/20 rounded-sm space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <ShieldOff className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="text-[10px] font-bold text-orange-400 uppercase">Execution Policy Summary</span>
        </div>
        {[
          { label: 'executionPolicyStatus', value: 'DEFINED_FOR_PLANNING_ONLY' },
          { label: 'executionGate',         value: 'CLOSED' },
          { label: 'nextAllowedMode',       value: 'POLICY_REVIEW_ONLY' },
        ].map(row => (
          <div key={row.label} className="flex items-center gap-2 text-[8px] pl-5">
            <span className="text-slate-500">{row.label}:</span>
            <span className="text-slate-300 font-mono font-bold">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase"
          >
            <Download className="w-4 h-4" />
            Export Execution Policy Boundary
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 space-y-0.5">
          <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
            snapshotType: VERIDAN_EXECUTION_POLICY_BOUNDARY_PHASE_52 · Browser-local JSON only · No backend writes
          </div>
          <div className="text-[8px] font-mono text-blue-400/60 text-center">
            Stores to: {EXPORT_KEY}
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
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 52 Safety Claims</div>
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