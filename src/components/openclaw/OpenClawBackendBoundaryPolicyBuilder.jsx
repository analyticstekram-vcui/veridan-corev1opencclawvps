/**
 * OpenClawBackendBoundaryPolicyBuilder — Phase 53
 * Browser-only policy builder defining Veridan Core's backend boundary
 * requirements before any future backend routes, mutation routes, or dispatch.
 * UI + localStorage read/export only. No backend routes. No execution. No dispatch.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, XCircle, Server } from 'lucide-react';

const SOURCE_KEY = 'openclawPhase52ExecutionPolicyBoundary';
const EXPORT_KEY = 'openclawPhase53BackendBoundaryPolicy';

const SAFETY_CLAIMS = [
  'Backend boundary policy only',
  'No backend routes added',
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
  'Planning and backend policy review only',
  'Browser-only export',
];

const POLICY_SECTIONS = [
  {
    id: 'route_allowlist',
    sectionName: 'A. Backend Route Allowlist Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks backend execution until enforced in backend route layer',
    rules: [
      'Backend routes must be explicitly allowlisted before use',
      'Read-only routes must be separated from mutation routes',
      'Unknown routes must be rejected',
      'Routes must declare allowed method, risk tier, and execution mode',
      'No route may bypass governance validation',
    ],
  },
  {
    id: 'mutation_route',
    sectionName: 'B. Mutation Route Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks backend execution until enforced in backend route layer',
    rules: [
      'Mutation routes remain disabled in this phase',
      'Mutation routes require separate approval before implementation',
      'Mutation routes must require operator approval',
      'Mutation routes must create pre-action and post-action evidence',
      'Mutation routes must never return secrets',
      'Mutation routes must support failure-state evidence',
    ],
  },
  {
    id: 'audit_logging',
    sectionName: 'C. Audit Logging Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks backend execution until enforced in backend route layer',
    rules: [
      'Every backend request must create an audit record',
      'Audit records must include timestamp, route, method, operator, and request status',
      'Audit records must never include secret values',
      'Failed backend requests must be logged',
      'Rejected backend requests must include rejection reasons',
    ],
  },
  {
    id: 'replay_protection',
    sectionName: 'D. Replay Protection Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks backend execution until enforced in backend route layer',
    rules: [
      'Requests must include unique request IDs',
      'Duplicate request IDs must be rejected',
      'Expired timestamps must be rejected',
      'Signed requests must use canonical payloads before execution mode',
      'Replay failures must create evidence records',
    ],
  },
  {
    id: 'error_handling',
    sectionName: 'E. Error Handling Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks backend execution until enforced in backend route layer',
    rules: [
      'Backend errors must return standardized statuses',
      'Authentication failures must return HOLD_FOR_AUTH_BOUNDARY',
      'Missing env keys must return HOLD_FOR_BACKEND_ENV',
      'Connectivity failures must return HOLD_FOR_GATEWAY_CONNECTIVITY',
      'Safety failures must return BLOCKED_BY_SAFETY_FAILURE',
    ],
  },
  {
    id: 'secret_boundary',
    sectionName: 'F. Backend Secret Boundary Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks backend execution until enforced in backend route layer',
    rules: [
      'Backend may read environment variables',
      'Backend must never return secret values',
      'Frontend may only receive presence/absence or redacted markers',
      'Export records must never include secrets',
      'Secret validation must be read-only unless separately approved',
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

export default function OpenClawBackendBoundaryPolicyBuilder() {
  const [sourcePresent, setSourcePresent] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastExportedAt, setLastExportedAt] = useState(null);

  useEffect(() => {
    setSourcePresent(loadKey(SOURCE_KEY) !== null);
  }, []);

  const handleExport = () => {
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_BACKEND_BOUNDARY_POLICY_PHASE_53',
      currentMode: 'BACKEND_POLICY_DESIGN_ONLY',
      sourceExecutionPolicyPresent: sourcePresent,
      backendPolicyStatus: 'DEFINED_FOR_PLANNING_ONLY',
      executionGate: 'CLOSED',
      nextAllowedMode: 'BACKEND_POLICY_REVIEW_ONLY',
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
    a.download = `phase53-backend-boundary-policy-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportedAt(new Date().toISOString());
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-sky-500/5 border border-sky-500/20 rounded-sm">
        <div className="text-[12px] font-bold uppercase tracking-wide text-sky-400 mb-1">
          Backend Boundary Policy Builder
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Phase 53 · Defines backend boundary requirements before any future backend routes, mutation routes,
          OpenClaw dispatch, broker API, bank API, credit bureau API, or sandbox execution work.
          This phase does not add backend routes or enable execution.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION GATE: CLOSED</span> — backendPolicyStatus is DEFINED_FOR_PLANNING_ONLY.
          No backend routes, fetch calls, or mutation logic are present here.
        </p>
      </div>

      {/* Missing source warning */}
      {!sourcePresent && (
        <div className="flex items-start gap-2 px-3 py-3 bg-destructive/5 border border-destructive/20 rounded-sm">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[9px] text-destructive/90">
            Phase 52 Execution Policy Boundary not found. Export Phase 52 before defining backend boundary policy.
          </p>
        </div>
      )}

      {/* Current Backend Posture */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Current Backend Posture</div>
        </div>
        <div className="p-3 grid grid-cols-1 gap-1.5">
          {[
            { label: 'currentMode',           value: 'BACKEND_POLICY_DESIGN_ONLY',    color: 'text-sky-400' },
            { label: 'sourceExecutionPolicy', value: SOURCE_KEY,                       color: 'text-blue-400' },
            { label: 'executionGate',         value: 'CLOSED',                         color: 'text-destructive' },
            { label: 'backendPolicyStatus',   value: 'DEFINED_FOR_PLANNING_ONLY',      color: 'text-amber-400' },
            { label: 'nextAllowedMode',       value: 'BACKEND_POLICY_REVIEW_ONLY',     color: 'text-amber-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{row.label}:</span>
              <span className={`text-[8px] font-bold font-mono truncate max-w-[60%] text-right ${row.color}`}>{row.value}</span>
            </div>
          ))}
          {[
            'backendRoutesEnabled',
            'backendMutationEnabled',
            'dispatchEnabled',
            'externalApiMutationEnabled',
            'liveExecutionEnabled',
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
                  <Server className="w-3.5 h-3.5 text-sky-400/70 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-200">{section.sectionName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] px-1.5 py-0.5 border border-sky-500/30 bg-sky-500/5 text-sky-400 rounded font-bold uppercase whitespace-nowrap">DEFINED · NOT ACTIVE</span>
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
                      <span className="text-sky-400/50 text-[9px] shrink-0 mt-0.5">·</span>
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
      <div className="px-4 py-3 bg-sky-500/5 border border-sky-500/20 rounded-sm space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-[10px] font-bold text-sky-400 uppercase">Backend Policy Summary</span>
        </div>
        {[
          { label: 'backendPolicyStatus', value: 'DEFINED_FOR_PLANNING_ONLY' },
          { label: 'executionGate',       value: 'CLOSED' },
          { label: 'nextAllowedMode',     value: 'BACKEND_POLICY_REVIEW_ONLY' },
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
            Export Backend Boundary Policy
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 space-y-0.5">
          <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
            snapshotType: VERIDAN_BACKEND_BOUNDARY_POLICY_PHASE_53 · Browser-local JSON only · No backend writes
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
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 53 Safety Claims</div>
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