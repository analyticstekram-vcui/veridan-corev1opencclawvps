/**
 * OpenClawEvidenceArchiveSection
 * Extracted Evidence Archive tab content from OpenClawGatewayConnectorPanel.
 * Stabilization refactor — no behavior changes, no new features.
 * UI-only · browser-only · localStorage-only · no execution.
 */

import React from 'react';
import OpenClawReadOnlyObservabilityDashboard from './OpenClawReadOnlyObservabilityDashboard.jsx';
import OpenClawOperatorFlowDashboard from './OpenClawOperatorFlowDashboard.jsx';
import OpenClawOperatorGuideCard from './OpenClawOperatorGuideCard.jsx';
import OpenClawCommandProposalBox from './OpenClawCommandProposalBox.jsx';
import OpenClawProposalReviewPanel from './OpenClawProposalReviewPanel.jsx';
import OpenClawProposalReviewSummaryDashboard from './OpenClawProposalReviewSummaryDashboard.jsx';
import OpenClawProposalReviewEvidenceExport from './OpenClawProposalReviewEvidenceExport.jsx';
import OpenClawReadOnlyGovernanceBaselineLock from './OpenClawReadOnlyGovernanceBaselineLock.jsx';
import OpenClawDryRunExecutionPlanningGate from './OpenClawDryRunExecutionPlanningGate.jsx';
import OpenClawDryRunActionContractDesigner from './OpenClawDryRunActionContractDesigner.jsx';
import OpenClawDryRunActionContractValidator from './OpenClawDryRunActionContractValidator.jsx';
import OpenClawDryRunActionDraftBuilder from './OpenClawDryRunActionDraftBuilder.jsx';
import OpenClawDryRunActionDraftValidator from './OpenClawDryRunActionDraftValidator.jsx';
import OpenClawDryRunSimulationPreview from './OpenClawDryRunSimulationPreview.jsx';
import OpenClawDryRunSimulationPreviewValidator from './OpenClawDryRunSimulationPreviewValidator.jsx';
import OpenClawDryRunResultPackager from './OpenClawDryRunResultPackager.jsx';
import OpenClawUnifiedCommandContractRegistry from './OpenClawUnifiedCommandContractRegistry.jsx';
import OpenClawProposalRegistryValidationBinding from './OpenClawProposalRegistryValidationBinding.jsx';
import OpenClawDryRunValidatorIntakeBinding from './OpenClawDryRunValidatorIntakeBinding.jsx';
import OpenClawDryRunIntakeValidatorRecordBinding from './OpenClawDryRunIntakeValidatorRecordBinding.jsx';
import OpenClawValidatorRecordReviewDecisionGate from './OpenClawValidatorRecordReviewDecisionGate.jsx';
import OpenClawApprovedReviewDryRunResultPackageBuilder from './OpenClawApprovedReviewDryRunResultPackageBuilder.jsx';
import OpenClawGovernancePhaseSummaryPanel from './OpenClawGovernancePhaseSummaryPanel.jsx';
import OpenClawGovernanceCheckpointIndexPanel from './OpenClawGovernanceCheckpointIndexPanel.jsx';
import OpenClawRuntimeBridgeFlowMap from './OpenClawRuntimeBridgeFlowMap.jsx';
import OpenClawPhase32FinalGovernanceSnapshot from './OpenClawPhase32FinalGovernanceSnapshot.jsx';
import OpenClawDryRunExecutionGatePreview from './OpenClawDryRunExecutionGatePreview.jsx';
import OpenClawDryRunExecutionResultSimulator from './OpenClawDryRunExecutionResultSimulator.jsx';
import OpenClawReadOnlyConnectorDryRunContract from './OpenClawReadOnlyConnectorDryRunContract.jsx';
import OpenClawReadOnlyConnectorContractValidator from './OpenClawReadOnlyConnectorContractValidator.jsx';
import OpenClawControlledReadOnlyConnectorTestPlan from './OpenClawControlledReadOnlyConnectorTestPlan.jsx';
import OpenClawReadOnlyBackendRouteContract from './OpenClawReadOnlyBackendRouteContract.jsx';
import OpenClawBackendEnvironmentSecretBoundaryContract from './OpenClawBackendEnvironmentSecretBoundaryContract.jsx';
import OpenClawBackendEnvironmentPresenceCheckPlan from './OpenClawBackendEnvironmentPresenceCheckPlan.jsx';
import OpenClawBackendPresenceCheckRouteContract from './OpenClawBackendPresenceCheckRouteContract.jsx';
import OpenClawBackendPresenceCheckRouteValidator from './OpenClawBackendPresenceCheckRouteValidator.jsx';
import OpenClawBackendPresenceCheckImplementationPlan from './OpenClawBackendPresenceCheckImplementationPlan.jsx';
import OpenClawBackendPresenceCheckRouteStub from './OpenClawBackendPresenceCheckRouteStub.jsx';
import OpenClawBackendPresenceCheckActivationLock from './OpenClawBackendPresenceCheckActivationLock.jsx';
import OpenClawBackendEnvPresenceBooleanRoute from './OpenClawBackendEnvPresenceBooleanRoute.jsx';
import OpenClawBackendEnvPresenceEvidenceRecord from './OpenClawBackendEnvPresenceEvidenceRecord.jsx';
import OpenClawHealthCheckContract from './OpenClawHealthCheckContract.jsx';
import OpenClawHealthCheckActivationLock from './OpenClawHealthCheckActivationLock.jsx';
import OpenClawReadOnlyHealthCheckRoute from './OpenClawReadOnlyHealthCheckRoute.jsx';
import OpenClawHealthCheckEvidenceRecord from './OpenClawHealthCheckEvidenceRecord.jsx';
import OpenClawStatusVersionCapabilitiesContract from './OpenClawStatusVersionCapabilitiesContract.jsx';
import OpenClawStatusVersionCapabilitiesActivationLock from './OpenClawStatusVersionCapabilitiesActivationLock.jsx';
import OpenClawStatusVersionCapabilitiesReadOnlyRoute from './OpenClawStatusVersionCapabilitiesReadOnlyRoute.jsx';
import OpenClawStatusVersionCapabilitiesEvidenceRecord from './OpenClawStatusVersionCapabilitiesEvidenceRecord.jsx';
import OpenClawReadOnlyCapabilityPolicyMap from './OpenClawReadOnlyCapabilityPolicyMap.jsx';
import OpenClawReadOnlyRuntimeBridgeBoundaryPanel from './OpenClawReadOnlyRuntimeBridgeBoundaryPanel.jsx';
import OpenClawRuntimeBridgeRequestContractPreview from './OpenClawRuntimeBridgeRequestContractPreview.jsx';
import OpenClawRuntimeBridgeContractValidator from './OpenClawRuntimeBridgeContractValidator.jsx';
import OpenClawRuntimeBridgeApprovalQueuePreview from './OpenClawRuntimeBridgeApprovalQueuePreview.jsx';
import OpenClawRuntimeBridgeApprovalDecisionAuditTrail from './OpenClawRuntimeBridgeApprovalDecisionAuditTrail.jsx';
import OpenClawOperatorApprovalWorkflowPanel from './OpenClawOperatorApprovalWorkflowPanel.jsx';
import OpenClawRuntimeImplementationPlanPanel from './OpenClawRuntimeImplementationPlanPanel.jsx';
import OpenClawRuntimeImplementationPlanFinalLockPanel from './OpenClawRuntimeImplementationPlanFinalLockPanel.jsx';
import OpenClawRuntimeBridgeImplementationPlanReviewPanel from './OpenClawRuntimeBridgeImplementationPlanReviewPanel.jsx';
import OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel from './OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel.jsx';
import FinalLockPanel from './FinalLockPanel.jsx';
import BaselineArchiveManifestPanel from './BaselineArchiveManifestPanel.jsx';
import BaselineExportPacketPanel from './BaselineExportPacketPanel.jsx';
import BaselineVerifyPacketPanel from './BaselineVerifyPacketPanel.jsx';
import ReadOnlyBrowserObservationDesignPanel from './ReadOnlyBrowserObservationDesignPanel.jsx';
import BrowserObservationPolicyMatrixPanel from './BrowserObservationPolicyMatrixPanel.jsx';
import BrowserObservationApprovalRulesPanel from './BrowserObservationApprovalRulesPanel.jsx';
import BrowserObservationRoutePlannerPanel from './BrowserObservationRoutePlannerPanel.jsx';
import BrowserObservationSimulationPanel from './BrowserObservationSimulationPanel.jsx';
import BrowserObservationEvidenceExportPanel from './BrowserObservationEvidenceExportPanel.jsx';
import BrowserObservationFinalLockPanel from './BrowserObservationFinalLockPanel.jsx';
import BrowserObservationProposalQueuePanel from './BrowserObservationProposalQueuePanel.jsx';
import BrowserObservationProposalReviewLedgerPanel from './BrowserObservationProposalReviewLedgerPanel.jsx';
import BrowserObservationReadinessGatePanel from './BrowserObservationReadinessGatePanel.jsx';
import BrowserObservationProposalFinalLockPanel from './BrowserObservationProposalFinalLockPanel.jsx';
import BrowserObservationExecutionContractPreviewPanel from './BrowserObservationExecutionContractPreviewPanel.jsx';
import BrowserObservationExecutionContractFinalLockPanel from './BrowserObservationExecutionContractFinalLockPanel.jsx';
import BrowserObservationContractValidatorPanel from './BrowserObservationContractValidatorPanel.jsx';
import BrowserObservationContractValidatorFinalLockPanel from './BrowserObservationContractValidatorFinalLockPanel.jsx';
import BrowserObservationDryRunAuditLedgerPanel from './BrowserObservationDryRunAuditLedgerPanel.jsx';
import ReadOnlyOpenClawBridgeDesignPanel from './ReadOnlyOpenClawBridgeDesignPanel.jsx';
import ReadOnlyOpenClawBridgeDesignFinalLockPanel from './ReadOnlyOpenClawBridgeDesignFinalLockPanel.jsx';
import ReadOnlyOpenClawBridgeValidatorPanel from './ReadOnlyOpenClawBridgeValidatorPanel.jsx';
import ReadOnlyOpenClawBridgeValidatorFinalLockPanel from './ReadOnlyOpenClawBridgeValidatorFinalLockPanel.jsx';
import ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel from './ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel.jsx';
import ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel from './ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel.jsx';
import ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel from './ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel.jsx';

export default function OpenClawEvidenceArchiveSection({ expandedGroup, toggleGroup, generateLocalGovernanceBaseline }) {
  return (
    <div className="space-y-5 border-t border-border/40 pt-5">

      {/* ── OBSERVABILITY DASHBOARD — always at top ── */}
      <div className="border-2 border-primary rounded-lg overflow-hidden bg-primary/2">
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/30">
          <div className="text-[10px] uppercase tracking-widest font-bold text-primary">Read-Only Observability Dashboard</div>
        </div>
        <div className="p-4">
          <OpenClawReadOnlyObservabilityDashboard />
        </div>
      </div>

      {/* ── OPERATOR FLOW DASHBOARD ── */}
      <div className="border-2 border-primary/30 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20">
          <div className="text-[10px] uppercase tracking-widest font-bold text-primary">Operator Flow Dashboard</div>
        </div>
        <div className="p-4">
          <OpenClawOperatorFlowDashboard />
        </div>
      </div>

      {/* ── OPERATOR GUIDE CARD ── */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border/40">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Operator Guide</div>
        </div>
        <div className="p-4">
          <OpenClawOperatorGuideCard />
        </div>
      </div>

      {/* ── Proposal + Review ── */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('proposal_review')}
          className="w-full px-4 py-3 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Proposal + Review</div>
            <div className="text-[9px] text-slate-400 mt-1">Create, review, approve, deny, or request changes for local command proposals.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ml-3 shrink-0 ${expandedGroup === 'proposal_review' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'proposal_review' && (
          <div className="space-y-3 p-4">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Command Proposal Box</div></div>
              <div className="p-3"><OpenClawCommandProposalBox /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Proposal Review Panel</div></div>
              <div className="p-3"><OpenClawProposalReviewPanel /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Proposal Review Summary Dashboard</div></div>
              <div className="p-3"><OpenClawProposalReviewSummaryDashboard /></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Evidence + Baseline ── */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('evidence_baseline')}
          className="w-full px-4 py-3 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Evidence + Baseline</div>
            <div className="text-[9px] text-slate-400 mt-1">Export proof records and lock the verified read-only baseline.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ml-3 shrink-0 ${expandedGroup === 'evidence_baseline' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'evidence_baseline' && (
          <div className="space-y-3 p-4">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Proposal Review Evidence Chain Export</div></div>
              <div className="p-3"><OpenClawProposalReviewEvidenceExport /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Read-Only Governance Baseline Lock</div></div>
              <div className="p-3"><OpenClawReadOnlyGovernanceBaselineLock /></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dry-Run Planning ── */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('dryrun_planning')}
          className="w-full px-4 py-3 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Planning</div>
            <div className="text-[9px] text-slate-400 mt-1">Prepare and validate the contract rules for future dry-run actions.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ml-3 shrink-0 ${expandedGroup === 'dryrun_planning' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'dryrun_planning' && (
          <div className="space-y-3 p-4">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Controlled Dry-Run Execution Planning Gate</div></div>
              <div className="p-3"><OpenClawDryRunExecutionPlanningGate /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Contract Designer</div></div>
              <div className="p-3"><OpenClawDryRunActionContractDesigner /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Contract Validator</div></div>
              <div className="p-3"><OpenClawDryRunActionContractValidator /></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Draft + Simulation ── */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('draft_simulation')}
          className="w-full px-4 py-3 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Draft + Simulation</div>
            <div className="text-[9px] text-slate-400 mt-1">Create, validate, and preview local-only dry-run action records.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ml-3 shrink-0 ${expandedGroup === 'draft_simulation' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'draft_simulation' && (
          <div className="space-y-3 p-4">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Draft Builder</div></div>
              <div className="p-3"><OpenClawDryRunActionDraftBuilder /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Action Draft Validator</div></div>
              <div className="p-3"><OpenClawDryRunActionDraftValidator /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Simulation Preview</div></div>
              <div className="p-3"><OpenClawDryRunSimulationPreview /></div>
            </div>
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Simulation Preview Validator</div></div>
              <div className="p-3"><OpenClawDryRunSimulationPreviewValidator /></div>
            </div>
          </div>
        )}
      </div>

      {/* ── GOVERNANCE DRY-RUN CHAIN STATUS SUMMARY ── */}
       <div className="border-2 border-primary rounded-lg overflow-hidden bg-primary/2">
         <div className="px-4 py-3 bg-primary/10 border-b-2 border-primary">
           <div className="text-[12px] font-bold uppercase tracking-wide text-primary mb-0.5">Governance Dry-Run Chain Status</div>
           <div className="text-[9px] text-primary/70">Complete execution-disabled governance pipeline: Phases 43–48</div>
         </div>
         <div className="p-4 space-y-2">
           {[
             { num: '43', name: 'Command Registry', key: 'openclawPhase43UnifiedCommandRegistrySnapshot', role: 'Defines all allowed/blocked command types', status: 'Registry only — no execution' },
             { num: '44', name: 'Proposal Registry Validation', key: 'openclawPhase44ProposalRegistryValidationRecords', role: 'Validates proposals against registry', status: 'Validation only — no execution' },
             { num: '45', name: 'Dry-Run Intake', key: 'openclawPhase45DryRunValidatorIntakeRecords', role: 'Prepares validated proposals for dry-run', status: 'Intake only — no execution' },
             { num: '46', name: 'Validator Record', key: 'openclawPhase46DryRunValidatorRecords', role: 'Formal validator record binding', status: 'Validator record only — no execution' },
             { num: '47', name: 'Operator Review Decision', key: 'openclawPhase47ValidatorReviewDecisions', role: 'Operator approval/rejection gate', status: 'Review decision only — no execution' },
             { num: '48', name: 'Dry-Run Result Package', key: 'openclawPhase48DryRunResultPackages', role: 'Builds result artifacts from approved reviews', status: 'Result package only — no execution' },
           ].map(phase => (
             <div key={phase.num} className="px-3 py-2 border border-primary/20 rounded-sm bg-card hover:bg-card/80 transition-colors">
               <div className="flex items-start justify-between gap-3 mb-1">
                 <div className="flex-1">
                   <div className="text-[10px] font-bold text-primary">Phase {phase.num} · {phase.name}</div>
                   <div className="text-[8px] text-slate-400 mt-0.5">{phase.role}</div>
                 </div>
                 <span className="text-[7px] px-2 py-0.5 border border-primary/30 bg-primary/5 text-primary rounded font-bold uppercase whitespace-nowrap">{phase.status}</span>
               </div>
               <div className="text-[7px] text-blue-400 font-mono">{phase.key}</div>
             </div>
           ))}
           <div className="mt-3 pt-3 border-t border-primary/20 space-y-1.5">
             <div className="flex items-center justify-between px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
               <span className="text-[9px] font-bold text-primary">Live Execution:</span>
               <span className="text-[8px] px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded font-bold uppercase">DISABLED</span>
             </div>
             <div className="flex items-center justify-between px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
               <span className="text-[9px] font-bold text-primary">Dispatch:</span>
               <span className="text-[8px] px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded font-bold uppercase">DISABLED</span>
             </div>
             <div className="flex items-center justify-between px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
               <span className="text-[9px] font-bold text-primary">Backend Mutation:</span>
               <span className="text-[8px] px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive rounded font-bold uppercase">DISABLED</span>
             </div>
           </div>
         </div>
       </div>

       {/* ── PHASE 43: Unified Command Contract Registry ── */}
       <div className="border-2 border-primary/40 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase43_registry')}
          className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/40 hover:bg-primary/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary">PHASE 43: Unified Command Contract Registry</div>
            <div className="text-[9px] text-primary/70 mt-0.5">Centralizes all allowed, dry-run, and blocked commands. Read-only · No execution.</div>
          </div>
          <span className={`text-[10px] font-bold text-primary/60 transition-transform ${expandedGroup === 'phase43_registry' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase43_registry' && (
          <div className="p-4"><OpenClawUnifiedCommandContractRegistry /></div>
        )}
      </div>

      {/* ── PHASE 44: Proposal Registry Validation Binding ── */}
      <div className="border-2 border-amber-500/30 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase44_binding')}
          className="w-full px-4 py-3 bg-amber-500/5 border-b-2 border-amber-500/30 hover:bg-amber-500/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-amber-400">PHASE 44: Proposal Registry Validation Binding</div>
            <div className="text-[9px] text-amber-400/70 mt-0.5">Validates proposals against Phase 43 registry. No execution · No backend calls.</div>
          </div>
          <span className={`text-[10px] font-bold text-amber-400/60 transition-transform ${expandedGroup === 'phase44_binding' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase44_binding' && (
          <div className="p-4"><OpenClawProposalRegistryValidationBinding /></div>
        )}
      </div>

      {/* ── PHASE 45: Dry-Run Validator Intake Binding ── */}
      <div className="border-2 border-cyan-500/30 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase45_intake')}
          className="w-full px-4 py-3 bg-cyan-500/5 border-b-2 border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-cyan-400">PHASE 45: Dry-Run Validator Intake Binding</div>
            <div className="text-[9px] text-cyan-400/70 mt-0.5">Binds Phase 44 validated proposals to dry-run intake. No execution · No backend calls.</div>
          </div>
          <span className={`text-[10px] font-bold text-cyan-400/60 transition-transform ${expandedGroup === 'phase45_intake' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase45_intake' && (
          <div className="p-4"><OpenClawDryRunValidatorIntakeBinding /></div>
        )}
      </div>

      {/* ── PHASE 46: Dry-Run Intake → Validator Record Binding ── */}
      <div className="border-2 border-violet-500/30 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase46_validator_binding')}
          className="w-full px-4 py-3 bg-violet-500/5 border-b-2 border-violet-500/30 hover:bg-violet-500/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-violet-400">PHASE 46: Dry-Run Intake → Validator Record Binding</div>
            <div className="text-[9px] text-violet-400/70 mt-0.5">Binds Phase 45 intake records to validator record structure. No execution · No dispatch.</div>
          </div>
          <span className={`text-[10px] font-bold text-violet-400/60 transition-transform ${expandedGroup === 'phase46_validator_binding' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase46_validator_binding' && (
          <div className="p-4"><OpenClawDryRunIntakeValidatorRecordBinding /></div>
        )}
      </div>

      {/* ── PHASE 47: Validator Record Review and Decision Gate ── */}
      <div className="border-2 border-rose-500/30 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase47_review_gate')}
          className="w-full px-4 py-3 bg-rose-500/5 border-b-2 border-rose-500/30 hover:bg-rose-500/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-rose-400">PHASE 47: Validator Record Review and Decision Gate</div>
            <div className="text-[9px] text-rose-400/70 mt-0.5">Operator review gate for Phase 46 validator records. No execution · No dispatch.</div>
          </div>
          <span className={`text-[10px] font-bold text-rose-400/60 transition-transform ${expandedGroup === 'phase47_review_gate' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase47_review_gate' && (
          <div className="p-4"><OpenClawValidatorRecordReviewDecisionGate /></div>
        )}
      </div>

      {/* ── PHASE 48: Approved Review → Dry-Run Result Package Builder ── */}
      <div className="border-2 border-emerald-500/30 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase48_result_package_builder')}
          className="w-full px-4 py-3 bg-emerald-500/5 border-b-2 border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-emerald-400">PHASE 48: Approved Review → Dry-Run Result Package Builder</div>
            <div className="text-[9px] text-emerald-400/70 mt-0.5">Builds result packages from approved Phase 47 reviews. No execution · No dispatch.</div>
          </div>
          <span className={`text-[10px] font-bold text-emerald-400/60 transition-transform ${expandedGroup === 'phase48_result_package_builder' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase48_result_package_builder' && (
          <div className="p-4"><OpenClawApprovedReviewDryRunResultPackageBuilder /></div>
        )}
      </div>

      {/* ── Result Package ── */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('result_package')}
          className="w-full px-4 py-3 bg-secondary/20 border-b border-border/40 hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Result Package</div>
            <div className="text-[9px] text-slate-400 mt-1">Package the validated preview into a local dry-run result artifact.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ml-3 shrink-0 ${expandedGroup === 'result_package' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'result_package' && (
          <div className="space-y-3 p-4">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-secondary/10 border-b border-border/40"><div className="text-[9px] uppercase tracking-widest font-bold text-slate-300">Dry-Run Result Packager</div></div>
              <div className="p-3"><OpenClawDryRunResultPackager /></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Governance Phase Summary + Baseline Generator ── */}
      <div className="bg-card border border-primary/20 rounded-lg p-4 space-y-3">
        <OpenClawGovernancePhaseSummaryPanel />
        <button type="button" onClick={generateLocalGovernanceBaseline}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold hover:bg-amber-500/20 transition-colors rounded">
          ✓ Generate Local Governance Baseline
        </button>
        <div className="text-[8px] text-slate-500">
          Creates test baseline packets for Phases 14–23 in localStorage (development only). No backend calls, no execution.
        </div>
      </div>

      {/* ── Phase 27: Governance Index ── */}
      <div className="border-2 border-primary rounded-lg overflow-hidden bg-primary/2">
        <button type="button" onClick={() => toggleGroup('phase27')}
          className="w-full px-4 py-3 bg-primary/10 border-b-2 border-primary hover:bg-primary/15 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary">CHECKPOINT: Phase 27 Governance Index</div>
            <div className="text-[9px] text-primary/70 mt-0.5">Single source of truth for governance completion. Required before Phase 28.</div>
          </div>
          <span className={`text-[10px] font-bold text-primary transition-transform ${expandedGroup === 'phase27' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase27' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-primary/20 pt-5"><OpenClawGovernanceCheckpointIndexPanel /></div>
          </div>
        )}
      </div>

      {/* ── Flow Map: Phases 26–32 ── */}
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-95 bg-slate-900/20 mb-4">
        <button type="button" onClick={() => toggleGroup('flowmap')}
          className="w-full px-4 py-3 bg-slate-800/40 border-b-2 border-slate-600 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">OPERATOR ORIENTATION: Runtime Bridge Flow Map</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Plain English view of phases 26–32 and future gates. Start here if you're new.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'flowmap' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'flowmap' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-slate-600/40 pt-5"><OpenClawRuntimeBridgeFlowMap /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawPhase32FinalGovernanceSnapshot /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawDryRunExecutionGatePreview /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawDryRunExecutionResultSimulator /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyConnectorDryRunContract /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyConnectorContractValidator /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawControlledReadOnlyConnectorTestPlan /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyBackendRouteContract /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvironmentSecretBoundaryContract /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvironmentPresenceCheckPlan /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckRouteContract /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckRouteValidator /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckImplementationPlan /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckRouteStub /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendPresenceCheckActivationLock /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvPresenceBooleanRoute /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawBackendEnvPresenceEvidenceRecord /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawHealthCheckContract /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawHealthCheckActivationLock /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyHealthCheckRoute /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawHealthCheckEvidenceRecord /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesContract /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesActivationLock /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesReadOnlyRoute /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawStatusVersionCapabilitiesEvidenceRecord /></div>
            <div className="border-t border-slate-600/40 pt-5"><OpenClawReadOnlyCapabilityPolicyMap /></div>
          </div>
        )}
      </div>

      {/* ── Phase 28: Read-Only Runtime Bridge Boundary ── */}
      <div className="border-2 border-primary/30 rounded-lg overflow-hidden bg-primary/1">
        <button type="button" onClick={() => toggleGroup('phase28')}
          className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/30 hover:bg-primary/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary">BOUNDARY DEFINITION: Phase 28 Read-Only Runtime Bridge</div>
            <div className="text-[9px] text-primary/70 mt-0.5">First permitted read-only observation boundary. Preparation only, no bridge activation.</div>
          </div>
          <span className={`text-[10px] font-bold text-primary/60 transition-transform ${expandedGroup === 'phase28' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase28' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-primary/10 pt-5"><OpenClawReadOnlyRuntimeBridgeBoundaryPanel /></div>
          </div>
        )}
      </div>

      {/* ── Phase 29: Runtime Bridge Request Contract ── */}
      <div className="border-2 border-primary/40 rounded-lg overflow-hidden bg-primary/1">
        <button type="button" onClick={() => toggleGroup('phase29')}
          className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/40 hover:bg-primary/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-foreground">CONTRACT PREVIEW: Phase 29 Runtime Bridge Request</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Future runtime bridge request contract structure. Preview-only, no execution.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase29' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase29' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-border/40 pt-5"><OpenClawRuntimeBridgeRequestContractPreview /></div>
          </div>
        )}
      </div>

      {/* ── Phase 30: Runtime Bridge Contract Validator ── */}
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-90">
        <button type="button" onClick={() => toggleGroup('phase30')}
          className="w-full px-4 py-3 bg-slate-900/30 border-b-2 border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">CONTRACT VALIDATOR: Phase 30 Runtime Bridge Validator</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Validates Phase 29 contracts locally. Preview-only, no execution.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase30' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase30' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-slate-600 pt-5"><OpenClawRuntimeBridgeContractValidator /></div>
          </div>
        )}
      </div>

      {/* ── Phase 31: Approval Queue Preview ── */}
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-85">
        <button type="button" onClick={() => toggleGroup('phase31')}
          className="w-full px-4 py-3 bg-slate-900/20 border-b-2 border-slate-600 hover:bg-slate-900/30 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">APPROVAL QUEUE: Phase 31 Approval Queue Preview</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Local-only approval queue from Phase 30 PASS validations. Approval does not execute.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase31' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase31' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-slate-600 pt-5"><OpenClawRuntimeBridgeApprovalQueuePreview /></div>
          </div>
        )}
      </div>

      {/* ── Phase 32: Approval Decision Audit Trail ── */}
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden opacity-80">
        <button type="button" onClick={() => toggleGroup('phase32')}
          className="w-full px-4 py-3 bg-slate-900/10 border-b-2 border-slate-600 hover:bg-slate-900/20 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">AUDIT TRAIL: Phase 32 Approval Decision Audit Trail</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Immutable audit trail from Phase 31 approval/denial decisions. Local-only record.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase32' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase32' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-slate-600 pt-5"><OpenClawRuntimeBridgeApprovalDecisionAuditTrail /></div>
          </div>
        )}
      </div>

      {/* ── Phases 24–26: Governance Approval Chain ── */}
      <div className="border-2 border-primary/40 rounded-lg overflow-hidden">
        <button type="button" onClick={() => toggleGroup('phase2426')}
          className="w-full px-4 py-3 bg-primary/5 border-b-2 border-primary/40 hover:bg-primary/10 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-foreground">ACTIVE: Governance Approval Chain — Phases 24–26</div>
            <div className="text-[9px] text-slate-400 mt-0.5">In use. Operator approval → Runtime planning → Review. 5 panels.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase2426' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase2426' === false ? null : (
          <div className="space-y-5 p-5">
            <div className="border-t border-border/40 pt-5"><OpenClawOperatorApprovalWorkflowPanel /></div>
            <div className="border-t border-border/40 pt-5"><OpenClawRuntimeImplementationPlanPanel /></div>
            <div className="border-t border-border/40 pt-5"><OpenClawRuntimeImplementationPlanFinalLockPanel /></div>
            <div className="border-t border-border/40 pt-5"><OpenClawRuntimeBridgeImplementationPlanReviewPanel /></div>
            <div className="border-t border-border/40 pt-5"><OpenClawRuntimeBridgeImplementationPlanReviewFinalLockPanel /></div>
          </div>
        )}
      </div>

      {/* ── Legacy Baseline: Phases 14–23 ── */}
      <div className="border border-slate-600 rounded-lg overflow-hidden opacity-80">
        <button type="button" onClick={() => toggleGroup('phase1423')}
          className="w-full px-4 py-3 bg-slate-900/30 border-b border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">LEGACY BASELINE: Phase 14–23 Governance Summary</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Initial Governance Baseline — COMPLETE / Reference Only</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1423' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase1423' && (
          <div className="space-y-5 p-5">
            <div className="border border-border rounded-lg overflow-hidden">
              <button type="button" onClick={() => toggleGroup('phase14')}
                className="w-full px-4 py-3 bg-secondary/20 border-b border-border hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Phase 14 — Monitoring Evidence</div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Final Lock / Baseline Archive / Export / Verify (4 panels)</div>
                </div>
                <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase14' ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedGroup === 'phase14' && (
                <div className="space-y-5 p-5">
                  <div className="border-t border-border/40 pt-5"><FinalLockPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BaselineArchiveManifestPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BaselineExportPacketPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BaselineVerifyPacketPanel /></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Browser Observation Governance (Phases 15–19) ── */}
      <div className="border border-slate-600 rounded-lg overflow-hidden opacity-70">
        <button type="button" onClick={() => toggleGroup('phase1519')}
          className="w-full px-4 py-3 bg-slate-900/30 border-b border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">ADVANCED / FUTURE: Browser Observation Governance</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Not required for current Phase 27 checkpoint. Future capability reference only.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1519' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase1519' && (
          <div className="space-y-5 p-5">
            <div className="border border-border rounded-lg overflow-hidden">
              <button type="button" onClick={() => toggleGroup('phase1517')}
                className="w-full px-4 py-3 bg-secondary/20 border-b border-border hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Phases 15–17 — Browser Observation Design</div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Design / Policy / Approval / Routes / Simulation / Proposal / Contract (7 panels)</div>
                </div>
                <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1517' ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedGroup === 'phase1517' && (
                <div className="space-y-5 p-5">
                  <div className="border-t border-border/40 pt-5"><ReadOnlyBrowserObservationDesignPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationPolicyMatrixPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationApprovalRulesPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationRoutePlannerPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationSimulationPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationEvidenceExportPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationFinalLockPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationProposalQueuePanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationProposalReviewLedgerPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationReadinessGatePanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationProposalFinalLockPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationExecutionContractPreviewPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationExecutionContractFinalLockPanel /></div>
                </div>
              )}
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <button type="button" onClick={() => toggleGroup('phase1819')}
                className="w-full px-4 py-3 bg-secondary/20 border-b border-border hover:bg-secondary/30 transition-colors text-left flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Phases 18–19 — Dry-Run Validation + Audit</div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Contract validator / validator lock / audit ledger (3 panels)</div>
                </div>
                <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase1819' ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedGroup === 'phase1819' && (
                <div className="space-y-5 p-5">
                  <div className="border-t border-border/40 pt-5"><BrowserObservationContractValidatorPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationContractValidatorFinalLockPanel /></div>
                  <div className="border-t border-border/40 pt-5"><BrowserObservationDryRunAuditLedgerPanel /></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bridge Design & Validation (Phases 20–23) ── */}
      <div className="border border-slate-600 rounded-lg overflow-hidden opacity-70">
        <button type="button" onClick={() => toggleGroup('phase2023')}
          className="w-full px-4 py-3 bg-slate-900/30 border-b border-slate-600 hover:bg-slate-900/40 transition-colors text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-300">ADVANCED / REFERENCE: Bridge Design & Validation</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Reference only. Runtime bridge activation is still not authorized.</div>
          </div>
          <span className={`text-[10px] font-bold text-slate-400 transition-transform ${expandedGroup === 'phase2023' ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expandedGroup === 'phase2023' && (
          <div className="space-y-5 p-5">
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeDesignPanel /></div>
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeDesignFinalLockPanel /></div>
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeValidatorPanel /></div>
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeValidatorFinalLockPanel /></div>
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawBridgeDryRunAuditLedgerPanel /></div>
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawRuntimeBridgeReadinessGatePanel /></div>
            <div className="border-t border-border/40 pt-5"><ReadOnlyOpenClawRuntimeBridgeReadinessFinalLockPanel /></div>
          </div>
        )}
      </div>

    </div>
  );
}