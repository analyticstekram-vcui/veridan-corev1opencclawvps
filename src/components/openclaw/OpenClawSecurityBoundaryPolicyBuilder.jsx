/**
 * OpenClawSecurityBoundaryPolicyBuilder — Phase 51
 * Browser-only policy builder defining Veridan Core's security boundary
 * requirements before any future sandbox/execution integration.
 * UI + localStorage read/export only. No execution. No dispatch. No credentials.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, XCircle, ShieldAlert } from 'lucide-react';

const SOURCE_KEY = 'openclawPhase50ExecutionReadinessBoundaryMap';
const EXPORT_KEY = 'openclawPhase51SecurityBoundaryPolicy';

const SAFETY_CLAIMS = [
  'Security boundary policy only',
  'No live execution',
  'No dispatch',
  'No backend mutation',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'No secret storage in frontend',
  'Planning and policy review only',
  'Browser-only export',
];

const POLICY_SECTIONS = [
  {
    id: 'secret_storage',
    sectionName: 'A. Secret Storage Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/security layer',
    rules: [
      'Secrets must never be stored in localStorage',
      'Secrets must never be shown in frontend UI',
      'Secrets must be stored only in backend environment variables or approved secret manager',
      'Frontend may only display presence/absence of required secrets',
      'Secret values must never be included in exports',
    ],
  },
  {
    id: 'credential_handling',
    sectionName: 'B. Credential Handling Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/security layer',
    rules: [
      'User credentials must not be typed into Veridan Core UI during governance mode',
      'Credential entry remains disabled until separate credential vault design exists',
      'Browser automation cannot enter passwords during this phase',
      'No stored usernames/passwords in localStorage',
      'No credential export allowed',
    ],
  },
  {
    id: 'backend_environment',
    sectionName: 'C. Backend Environment Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/security layer',
    rules: [
      'Backend env keys must be presence-checked only',
      'Backend must never return secret values',
      'Missing env keys must produce HOLD_FOR_BACKEND_ENV status',
      'Env checks must be read-only',
      'Mutation routes remain blocked',
    ],
  },
  {
    id: 'cloudflare_access',
    sectionName: 'D. Cloudflare Access Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/security layer',
    rules: [
      'OpenClaw gateway must remain behind Cloudflare Access',
      'Service token values must remain backend-only',
      'Frontend must not store Cloudflare Access secrets',
      'Access failures must produce HOLD_FOR_AUTH_BOUNDARY status',
      'Bypass/insecure auth is not allowed for production',
    ],
  },
  {
    id: 'operator_authentication',
    sectionName: 'E. Operator Authentication Policy',
    policyStatus: 'DEFINED_NOT_ACTIVE_FOR_EXECUTION',
    executionImpact: 'Blocks execution until enforced in backend/security layer',
    rules: [
      'Operator identity must be captured for approvals',
      'High-risk actions require explicit operator approval',
      'Approval records must include timestamp and reviewer/operator name',
      'No anonymous execution approvals allowed',
      'Role-based access rules must be defined before execution mode',
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

export default function OpenClawSecurityBoundaryPolicyBuilder() {
  const [sourcePresent, setSourcePresent] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastExportedAt, setLastExportedAt] = useState(null);

  useEffect(() => {
    setSourcePresent(loadKey(SOURCE_KEY) !== null);
  }, []);

  const handleExport = () => {
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_SECURITY_BOUNDARY_POLICY_PHASE_51',
      currentMode: 'SECURITY_POLICY_DESIGN_ONLY',
      sourceBoundaryMapPresent: sourcePresent,
      securityPolicyStatus: 'DEFINED_FOR_PLANNING_ONLY',
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
    a.download = `phase51-security-boundary-policy-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportedAt(new Date().toISOString());
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-sm">
        <div className="text-[12px] font-bold uppercase tracking-wide text-rose-400 mb-1">
          Security Boundary Policy Builder
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Phase 51 · Defines security boundary requirements before any future sandbox, backend, OpenClaw dispatch,
          browser automation, API credential, broker, bank, or credit bureau integration.
          This phase does not enable execution.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION GATE: CLOSED</span> — securityPolicyStatus is DEFINED_FOR_PLANNING_ONLY.
          No secrets, credentials, or execution logic are handled here.
        </p>
      </div>

      {/* Missing source warning */}
      {!sourcePresent && (
        <div className="flex items-start gap-2 px-3 py-3 bg-destructive/5 border border-destructive/20 rounded-sm">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[9px] text-destructive/90">
            Phase 50 Execution Readiness Boundary Map not found. Export Phase 50 before defining security boundary policy.
          </p>
        </div>
      )}

      {/* Current Security Posture */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Current Security Posture</div>
        </div>
        <div className="p-3 grid grid-cols-1 gap-1.5">
          {[
            { label: 'currentMode',               value: 'SECURITY_POLICY_DESIGN_ONLY',               color: 'text-rose-400' },
            { label: 'sourceBoundaryMap',          value: SOURCE_KEY,                                  color: 'text-blue-400' },
            { label: 'executionGate',              value: 'CLOSED',                                    color: 'text-destructive' },
            { label: 'securityPolicyStatus',       value: 'DEFINED_FOR_PLANNING_ONLY',                 color: 'text-amber-400' },
            { label: 'nextAllowedMode',            value: 'POLICY_REVIEW_ONLY',                        color: 'text-amber-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{row.label}:</span>
              <span className={`text-[8px] font-bold font-mono truncate max-w-[60%] text-right ${row.color}`}>{row.value}</span>
            </div>
          ))}
          {[
            'liveExecutionEnabled',
            'dispatchEnabled',
            'credentialHandlingEnabled',
            'backendMutationEnabled',
            'externalApiMutationEnabled',
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
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400/70 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-200">{section.sectionName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] px-1.5 py-0.5 border border-rose-500/30 bg-rose-500/5 text-rose-400 rounded font-bold uppercase whitespace-nowrap">DEFINED · NOT ACTIVE</span>
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
                      <span className="text-rose-400/50 text-[9px] shrink-0 mt-0.5">·</span>
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
      <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-sm space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-[10px] font-bold text-rose-400 uppercase">Security Policy Summary</span>
        </div>
        {[
          { label: 'securityPolicyStatus', value: 'DEFINED_FOR_PLANNING_ONLY' },
          { label: 'executionGate',        value: 'CLOSED' },
          { label: 'nextAllowedMode',      value: 'POLICY_REVIEW_ONLY' },
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
            Export Security Boundary Policy
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 space-y-0.5">
          <div className="text-[8px] font-mono text-muted-foreground/60 text-center italic">
            snapshotType: VERIDAN_SECURITY_BOUNDARY_POLICY_PHASE_51 · Browser-local JSON only · No backend writes
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
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 51 Safety Claims</div>
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