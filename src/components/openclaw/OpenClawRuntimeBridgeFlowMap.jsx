/**
 * OpenClawRuntimeBridgeFlowMap — Plain English Operator View
 * Shows the Runtime Bridge flow from Phase 26 to Future phases.
 * Explanation-only UI. No execution logic.
 */
import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Lock, ArrowDown, ShieldCheck } from 'lucide-react';

const PHASES = [
  {
    phase: 26,
    title: 'Final Lock Packet',
    plainEnglish: 'Seals the runtime implementation plan review. Confirms all decisions are approved and no live actions are enabled.',
    built: true,
    required: true,
    storageKey: 'openclawRuntimeBridgeImplementationPlanReviewFinalLock',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 27,
    title: 'Governance Checkpoint',
    plainEnglish: 'Single source of truth for governance completion. Verifies phases 14–26 are done. Required before phase 28.',
    built: true,
    required: true,
    storageKey: 'openclawGovernanceCheckpointIndex',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 28,
    title: 'Runtime Bridge Boundary',
    plainEnglish: 'Defines the first permitted read-only observation boundary. Preparation only. No bridge activation or execution.',
    built: true,
    required: true,
    storageKey: 'openclawReadOnlyRuntimeBridgeBoundaryDefinition',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 29,
    title: 'Runtime Bridge Request Contract',
    plainEnglish: 'Shows what a future runtime bridge request will look like. You can generate sample contracts to understand the structure.',
    built: true,
    required: false,
    storageKey: 'openclawPhase29RuntimeBridgeRequestContracts',
    safetyStatus: 'PREVIEW_ONLY',
    safetyColor: 'text-amber-500',
  },
  {
    phase: 30,
    title: 'Runtime Bridge Contract Validator',
    plainEnglish: 'Validates Phase 29 contracts against safety rules. Confirms contracts are locked and ready for approval (no execution yet).',
    built: true,
    required: false,
    storageKey: 'openclawPhase30RuntimeBridgeContractValidationResults',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 31,
    title: 'Runtime Bridge Approval Queue',
    plainEnglish: 'Converts Phase 30 PASS validation results into local-only approval queue items. Operators can approve or deny each contract (approval is local-only, no execution).',
    built: true,
    required: false,
    storageKey: 'openclawPhase31RuntimeBridgeApprovalQueuePreview',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 32,
    title: 'Runtime Bridge Approval Decision Audit Trail',
    plainEnglish: 'Records APPROVED/DENIED decisions from Phase 31 into a local-only immutable audit trail. All decisions marked NOT_EXECUTED with executionAllowed=false.',
    built: true,
    required: false,
    storageKey: 'openclawPhase32RuntimeBridgeApprovalDecisionAuditTrail',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 33,
    title: 'Dry-Run Execution Gate Preview',
    plainEnglish: 'Simulates an execution gate for approved requests without executing anything. Validates all Phase 32 governance locks are in place before simulation.',
    built: true,
    required: false,
    storageKey: 'openclawPhase33DryRunExecutionGateResults',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 34,
    title: 'Dry-Run Execution Result Simulator',
    plainEnglish: 'Generates local-only simulated execution results from Phase 33 PASS checks. Shows what would happen in a dry-run without any live action.',
    built: true,
    required: false,
    storageKey: 'openclawPhase34DryRunExecutionSimulationResults',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 35,
    title: 'OpenClaw Read-Only Connector Dry-Run Contract',
    plainEnglish: 'Defines local-only dry-run contracts for future OpenClaw read-only connector requests. Specifies allowed (read-only) and blocked (execution) actions.',
    built: true,
    required: false,
    storageKey: 'openclawPhase35ReadOnlyConnectorDryRunContracts',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 36,
    title: 'Read-Only Connector Contract Validator',
    plainEnglish: 'Validates Phase 35 OpenClaw read-only connector contracts locally before any future controlled read-only connector test.',
    built: true,
    required: false,
    storageKey: 'openclawPhase36ReadOnlyConnectorContractValidationResults',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 37,
    title: 'Controlled Read-Only Connector Test Plan',
    plainEnglish: 'Creates local-only test plans for future controlled read-only connector checks. Defines allowed endpoints, methods, and safety constraints.',
    built: true,
    required: false,
    storageKey: 'openclawPhase37ControlledReadOnlyConnectorTestPlans',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 38,
    title: 'Read-Only Backend Route Contract',
    plainEnglish: 'Defines local-only backend route contracts for future controlled read-only connector checks. Specifies server-side proxy routes and safety constraints.',
    built: true,
    required: false,
    storageKey: 'openclawPhase38ReadOnlyBackendRouteContracts',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 39,
    title: 'Backend Environment & Secret Boundary Contract',
    plainEnglish: 'Defines backend environment and secret boundary for future controlled read-only checks. Specifies required environment keys and prohibits secret value exposure.',
    built: true,
    required: false,
    storageKey: 'openclawPhase39BackendEnvironmentSecretBoundaryContracts',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 40,
    title: 'Backend Environment Presence Check Plan',
    plainEnglish: 'Creates a plan for how a future backend will check environment key presence without reading or exposing secret values. Results only return boolean presence, never secret values.',
    built: true,
    required: false,
    storageKey: 'openclawPhase40BackendEnvironmentPresenceCheckPlans',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 41,
    title: 'Backend Presence Check Route Contract',
    plainEnglish: 'Defines the local-only contract for a future backend route that checks required environment key presence without returning secret values. No process.env access, no secret reading.',
    built: true,
    required: false,
    storageKey: 'openclawPhase41BackendPresenceCheckRouteContracts',
    safetyStatus: 'LOCKED',
    safetyColor: 'text-primary',
  },
  {
    phase: 'FUTURE',
    title: 'Live Execution Gate',
    plainEnglish: 'Future phase: Final authorization gate for live execution. Operator confirms intent. Still subject to all safety constraints.',
    built: false,
    required: false,
    storageKey: null,
    safetyStatus: 'FUTURE',
    safetyColor: 'text-slate-500',
  },
];

function getIcon(phase) {
  if (phase.built) return <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />;
  if (phase.required) return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Clock className="w-4 h-4 text-slate-500 shrink-0" />;
}

function getStatusBadgeColor(safetyStatus) {
  if (safetyStatus === 'LOCKED') return 'text-primary border-primary/30 bg-primary/5';
  if (safetyStatus === 'PREVIEW_ONLY') return 'text-amber-500 border-amber-500/30 bg-amber-500/5';
  return 'text-slate-500 border-slate-500/30 bg-slate-500/5';
}

export default function OpenClawRuntimeBridgeFlowMap() {
  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Operator Orientation</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Runtime Bridge Flow Map
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Plain English view of phases 26–41 and future gates. How it all connects.</div>
      </div>

      {/* Current position badge */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
        <div>
          <div className="text-[8px] uppercase tracking-widest text-primary font-semibold">Current Build Position</div>
          <div className="text-[10px] text-primary mt-0.5">Phase 41 Complete — Backend Presence Check Route Contract Installed</div>
        </div>
      </div>

      {/* Flow phases */}
      <div className="space-y-2">
        {PHASES.map((phase, idx) => (
          <div key={idx}>
            {/* Phase card */}
            <div className={`border rounded-lg p-4 ${phase.built ? 'bg-card border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
              {/* Phase header */}
              <div className="flex items-start gap-3 mb-3">
                {getIcon(phase)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      {typeof phase.phase === 'number' ? `Phase ${phase.phase}` : phase.phase}
                    </div>
                    <span className={`text-[7px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusBadgeColor(phase.safetyStatus)}`}>
                      {phase.safetyStatus}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-foreground">{phase.title}</div>
                </div>
              </div>

              {/* Plain English description */}
              <div className="text-[9px] text-slate-300 mb-3 pl-7">{phase.plainEnglish}</div>

              {/* Status grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-7 text-[8px]">
                <div className="bg-secondary/50 rounded px-2 py-1.5">
                  <div className="text-slate-500 mb-0.5">Built</div>
                  <div className={`font-bold ${phase.built ? 'text-primary' : 'text-slate-500'}`}>
                    {phase.built ? 'YES' : 'PLANNED'}
                  </div>
                </div>
                <div className="bg-secondary/50 rounded px-2 py-1.5">
                  <div className="text-slate-500 mb-0.5">Required</div>
                  <div className={`font-bold ${phase.required ? 'text-primary' : 'text-slate-500'}`}>
                    {phase.required ? 'YES' : 'OPTIONAL'}
                  </div>
                </div>
                {phase.storageKey && (
                  <div className="bg-secondary/50 rounded px-2 py-1.5 col-span-2 sm:col-span-1">
                    <div className="text-slate-500 mb-0.5">Storage</div>
                    <div className="text-primary font-mono text-[7px] break-words truncate" title={phase.storageKey}>
                      {phase.storageKey.substring(0, 20)}…
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow connector */}
            {idx < PHASES.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Safety summary box */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          Nothing in this flow executes trades, moves money, enters credentials, calls APIs, or dispatches OpenClaw commands. This flow only explains and verifies the governance chain.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No fetch() or axios calls</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No backend function invocations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No OpenClaw calls or bridge dispatch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No trading, credentials, or wallet actions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No scheduler, polling, or browser automation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Local-only explanation and governance chain display</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Legend</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Built & Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Built & Required</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-primary shrink-0" />
            <span>Safety Locked</span>
          </div>
        </div>
      </div>

    </div>
  );
}