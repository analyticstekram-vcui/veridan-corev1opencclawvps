import React from 'react';
import { SafetyStatusCard, BaselineCard, OperatorNextActionCard } from '@/components/ui/planning-cards';

const moduleStatusStyles = {
  UI_ONLY: 'planning',
  GOVERNED: 'preview',
  READ_ONLY: 'neutral',
  FUTURE_PHASE: 'disabled',
};

const systemModules = [
  {
    name: 'Control Room',
    purpose: 'Supervisory operations, governance visibility, and high-level operator coordination.',
    mode: 'GOVERNED',
    safety: 'Operator-facing oversight only; control room cannot execute commands or activate automation.',
    nextAction: 'Use this map to confirm control room visibility remains governed and review module safety states.',
    actionDetail: 'Treat the Control Room as the central governance dashboard, not an execution interface.',
    checklist: ['Verify the Control Room remains governance-only and no command execution paths are enabled.'],
  },
  {
    name: 'Trading Operations',
    purpose: 'Trading workflow planning, market strategy review, and operator trade readiness assessment.',
    mode: 'UI_ONLY',
    safety: 'Trading operations are UI-only planning and cannot connect to brokers, markets, or execution engines.',
    nextAction: 'Keep trading operations in planning mode until governance approves live market integration.',
    actionDetail: 'Ensure trading workflows remain disconnected from brokers and do not expose live order placement.',
    checklist: ['Confirm trading operations are UI-only and no broker or execution connections are active.'],
  },
  {
    name: 'Business Operations',
    purpose: 'Business planning, entity support, and operational readiness coordination.',
    mode: 'UI_ONLY',
    safety: 'Business operations are currently a planning surface without live payments, banking, or execution.',
    nextAction: 'Review business planning guardrails before enabling live operational workflows.',
    actionDetail: 'Keep business coordination workflows UI-only and disconnect any payment or banking flows.',
    checklist: ['Confirm business operations are UI-only and no execution or banking integrations are enabled.'],
  },
  {
    name: 'Public Credit',
    purpose: 'Public credit planning, borrower review, and safe credit delivery design.',
    mode: 'UI_ONLY',
    safety: 'Public credit is a planning environment only; no credit bureau, bank, or dispute workflows are active.',
    nextAction: 'Verify public credit stays UI-only until credit governance and safety reviews are complete.',
    actionDetail: 'Do not enable bureau connectors, credit pulls, or live loan workflows from this map.',
    checklist: ['Confirm public credit remains UI-only and disconnected from bureaus and banking systems.'],
  },
  {
    name: 'Knowledge Vault',
    purpose: 'Stored guidance, procedures, and governance reference material for operators.',
    mode: 'READ_ONLY',
    safety: 'Read-only knowledge access only; no document uploads, private credential storage, or AI indexing.',
    nextAction: 'Review knowledge resources and maintain read-only access boundaries.',
    actionDetail: 'Keep reference material accessible without enabling document ingestion or AI indexing workflows.',
    checklist: ['Confirm Knowledge Vault remains read-only and does not allow uploads or indexing.'],
  },
  {
    name: 'OpenClaw Governance',
    purpose: 'OpenClaw monitoring, health visibility, and governance review for core workflows.',
    mode: 'GOVERNED',
    safety: 'OpenClaw oversight only; no execution bridge or command dispatch is permitted here.',
    nextAction: 'Use governed OpenClaw status visibility to review system health without switching to execution mode.',
    actionDetail: 'Keep OpenClaw connections under review and avoid activating any execution bridges or command flows.',
    checklist: ['Confirm OpenClaw governance remains monitoring-only and execution pathways are blocked.'],
  },
  {
    name: 'Audit / Evidence',
    purpose: 'Audit visibility, baseline evidence tracking, and compliance review support.',
    mode: 'READ_ONLY',
    safety: 'Evidence and audit tracking are read-only and do not trigger external collection or reporting workflows.',
    nextAction: 'Preserve audit evidence visibility and review baseline compliance before any operational changes.',
    actionDetail: 'Keep audit state accessible without introducing external evidence collection or enforcement logic.',
    checklist: ['Confirm audit and evidence tracking remain read-only and do not start external workflows.'],
  },
  {
    name: 'Future Execution Layer',
    purpose: 'Planned execution capabilities for a future phase of the Veridan Core architecture.',
    mode: 'FUTURE_PHASE',
    safety: 'Execution layer remains conceptual and disabled for the current operator-facing system.',
    nextAction: 'Track this layer as future scope only; do not treat it as an active system component.',
    actionDetail: 'Keep the execution layer conceptual until governance confirms safe implementation details.',
    checklist: ['Confirm the Future Execution Layer remains a planned phase and is not enabled in the current UI.'],
  },
];

export default function VeridanCoreSystemMap() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-8 space-y-4">
            <div>
              <h1 className="text-3xl font-mono font-bold text-slate-100">Veridan Core System Map</h1>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Operator-facing system map showing modules, current mode, safety state, and next allowed actions.
              </p>
            </div>
            <SafetyStatusCard
              title="Veridan Core System Safety Summary"
              statuses={systemModules.map((module) => ({
                label: module.name,
                value: module.mode,
                type: moduleStatusStyles[module.mode] ?? 'neutral',
              }))}
              disclaimer="This map is UI-only and summarizes the current safe modes for Veridan Core modules. No backends or execution paths are active."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {systemModules.map((module) => (
              <BaselineCard
                key={module.name}
                title={module.name}
                rows={[
                  { label: 'Purpose', value: module.purpose },
                  { label: 'Current Mode', value: module.mode, valueClassName: 'text-amber-500' },
                  { label: 'Safety Status', value: module.safety, valueClassName: 'text-slate-300' },
                ]}
                disclaimer={module.nextAction}
              >
                <OperatorNextActionCard
                  title="Next Allowed Action"
                  summaryTitle={module.nextAction}
                  summaryText={module.actionDetail}
                  checklist={module.checklist}
                  note="UI-only map guidance only."
                />
              </BaselineCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
