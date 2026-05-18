import React, { useState } from 'react';
import { SafetyStatusCard, BaselineCard, OperatorNextActionCard } from '@/components/ui/planning-cards';

const moduleStatusStyles = {
  UI_ONLY: 'planning',
  GOVERNED: 'preview',
  READ_ONLY: 'neutral',
  FUTURE_PHASE: 'disabled',
};

const modeColorMap = {
  READ_ONLY: 'bg-slate-700/70 text-slate-100',
  UI_ONLY: 'bg-amber-500/20 text-amber-300',
  GOVERNED: 'bg-cyan-500/20 text-cyan-300',
  FUTURE_PHASE: 'bg-slate-600/20 text-slate-300',
};

const systemModules = [
  {
    name: 'Control Room',
    purpose: 'Supervisory operations, governance visibility, and high-level operator coordination.',
    mode: 'GOVERNED',
    readiness: 'READY',
    blockingGate: 'Maintain governance-only oversight before any execution control is added.',
    safety: 'Operator-facing oversight only; control room cannot execute commands or activate automation.',
    safeNow: ['Supervised visibility', 'Governance review', 'Status summaries'],
    blockedCapabilities: ['Command execution', 'Automated workflows', 'Live automation control'],
    nextStep: 'Validate governance boundaries and confirm control room remains a monitoring surface.',
    nextAction: 'Use this map to confirm control room visibility remains governed and review module safety states.',
    actionDetail: 'Treat the Control Room as the central governance dashboard, not an execution interface.',
    checklist: ['Verify the Control Room remains governance-only and no command execution paths are enabled.'],
  },
  {
    name: 'Trading Operations',
    purpose: 'Trading workflow planning, market strategy review, and operator trade readiness assessment.',
    mode: 'UI_ONLY',
    readiness: 'PARTIAL',
    blockingGate: 'Complete governance review before enabling broker or execution capabilities.',
    safety: 'Trading operations are UI-only planning and cannot connect to brokers, markets, or execution engines.',
    safeNow: ['Strategy review', 'Trade scenario planning', 'Operator readiness checks'],
    blockedCapabilities: ['Broker connections', 'Live orders', 'Market execution'],
    nextStep: 'Keep trading operations in planning mode until governance approves live market integration.',
    nextAction: 'Keep trading operations in planning mode until governance approves live market integration.',
    actionDetail: 'Ensure trading workflows remain disconnected from brokers and do not expose live order placement.',
    checklist: ['Confirm trading operations are UI-only and no broker or execution connections are active.'],
  },
  {
    name: 'Business Operations',
    purpose: 'Business planning, entity support, and operational readiness coordination.',
    mode: 'UI_ONLY',
    readiness: 'PARTIAL',
    blockingGate: 'Establish safe business workflows before activating payments or banking integrations.',
    safety: 'Business operations are currently a planning surface without live payments, banking, or execution.',
    safeNow: ['Operational planning', 'Policy review', 'Entity coordination'],
    blockedCapabilities: ['Payment processing', 'Bank integration', 'Live operational commands'],
    nextStep: 'Review business planning guardrails before enabling live operational workflows.',
    nextAction: 'Review business planning guardrails before enabling live operational workflows.',
    actionDetail: 'Keep business coordination workflows UI-only and disconnect any payment or banking flows.',
    checklist: ['Confirm business operations are UI-only and no execution or banking integrations are enabled.'],
  },
  {
    name: 'Public Credit',
    purpose: 'Public credit planning, borrower review, and safe credit delivery design.',
    mode: 'UI_ONLY',
    readiness: 'PARTIAL',
    blockingGate: 'Confirm credit governance before enabling bureau access or loan issuance.',
    safety: 'Public credit is a planning environment only; no credit bureau, bank, or dispute workflows are active.',
    safeNow: ['Credit policy review', 'Borrower scenario planning', 'Governance alignment'],
    blockedCapabilities: ['Credit bureau access', 'Bank transfers', 'Live loan issuance'],
    nextStep: 'Verify public credit stays UI-only until credit governance and safety reviews are complete.',
    nextAction: 'Verify public credit stays UI-only until credit governance and safety reviews are complete.',
    actionDetail: 'Do not enable bureau connectors, credit pulls, or live loan workflows from this map.',
    checklist: ['Confirm public credit remains UI-only and disconnected from bureaus and banking systems.'],
  },
  {
    name: 'Knowledge Vault',
    purpose: 'Stored guidance, procedures, and governance knowledge storage for operators.',
    mode: 'READ_ONLY',
    readiness: 'READY',
    blockingGate: 'Maintain read-only access until document and indexing workflows are fully defined.',
    safety: 'Read-only knowledge access only; no document uploads, private credential storage, or AI indexing.',
    safeNow: ['Policy review', 'Standard operating procedures', 'Governance references'],
    blockedCapabilities: ['Document uploads', 'Credential storage', 'AI indexing'],
    nextStep: 'Review knowledge resources and maintain read-only access boundaries.',
    nextAction: 'Review knowledge resources and maintain read-only access boundaries.',
    actionDetail: 'Keep reference material accessible without enabling document ingestion or AI indexing workflows.',
    checklist: ['Confirm Knowledge Vault remains read-only and does not allow uploads or indexing.'],
  },
  {
    name: 'OpenClaw Governance',
    purpose: 'OpenClaw monitoring, health visibility, and governance review for core workflows.',
    mode: 'GOVERNED',
    readiness: 'READY',
    blockingGate: 'Keep OpenClaw under governance review until execution bridges are approved separately.',
    safety: 'OpenClaw oversight only; no execution bridge or command dispatch is permitted here.',
    safeNow: ['Health monitoring', 'Governance status review', 'Operator alerts'],
    blockedCapabilities: ['Command dispatch', 'Execution control', 'Automation activation'],
    nextStep: 'Use governed OpenClaw status visibility to review system health without switching to execution mode.',
    nextAction: 'Use governed OpenClaw status visibility to review system health without switching to execution mode.',
    actionDetail: 'Keep OpenClaw connections under review and avoid activating any execution bridges or command flows.',
    checklist: ['Confirm OpenClaw governance remains monitoring-only and execution pathways are blocked.'],
  },
  {
    name: 'Audit / Evidence',
    purpose: 'Audit visibility, baseline evidence tracking, and compliance review support.',
    mode: 'READ_ONLY',
    readiness: 'READY',
    blockingGate: 'Preserve audit visibility and do not enable active evidence collection workflows yet.',
    safety: 'Evidence and audit tracking are read-only and do not trigger external collection or reporting workflows.',
    safeNow: ['Baseline evidence review', 'Audit status visibility', 'Compliance summaries'],
    blockedCapabilities: ['External evidence capture', 'Automated reporting', 'Enforcement triggers'],
    nextStep: 'Preserve audit evidence visibility and review baseline compliance before any operational changes.',
    nextAction: 'Preserve audit evidence visibility and review baseline compliance before any operational changes.',
    actionDetail: 'Keep audit state accessible without introducing external evidence collection or enforcement logic.',
    checklist: ['Confirm audit and evidence tracking remain read-only and do not start external workflows.'],
  },
  {
    name: 'Future Execution Layer',
    purpose: 'Planned execution capabilities for a future phase of the Veridan Core architecture.',
    mode: 'FUTURE_PHASE',
    readiness: 'BLOCKED',
    blockingGate: 'Define safe execution architecture and governance approval before activation.',
    safety: 'Execution layer remains conceptual and disabled for the current operator-facing system.',
    safeNow: ['Concept review', 'Future architecture planning', 'Governance scoping'],
    blockedCapabilities: ['Live execution', 'Automation orchestration', 'Runtime command flow'],
    nextStep: 'Track this layer as future scope only; do not treat it as an active system component.',
    nextAction: 'Track this layer as future scope only; do not treat it as an active system component.',
    actionDetail: 'Keep the execution layer conceptual until governance confirms safe implementation details.',
    checklist: ['Confirm the Future Execution Layer remains a planned phase and is not enabled in the current UI.'],
  },
];

export default function VeridanCoreSystemMap() {
  const [selectedModuleName, setSelectedModuleName] = useState('Control Room');
  const selectedModule = systemModules.find((module) => module.name === selectedModuleName) || systemModules[0];

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
            {systemModules.map((module) => {
              const isSelected = module.name === selectedModuleName;
              return (
                <button
                  key={module.name}
                  type="button"
                  onClick={() => setSelectedModuleName(module.name)}
                  className={`text-left rounded-sm border px-4 py-4 transition-colors ${isSelected ? 'border-primary/60 bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-100">{module.name}</h2>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{module.purpose}</p>
                    </div>
                    <span className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded ${modeColorMap[module.mode] || modeColorMap['UI_ONLY']}`}>
                      {module.mode}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <BaselineCard
              title={`${selectedModule.name} Module Detail`}
              rows={[
                { label: 'Purpose', value: selectedModule.purpose },
                { label: 'Current Status', value: selectedModule.mode, valueClassName: 'text-amber-500' },
                {
                  label: 'Safe-Now Capabilities',
                  value: selectedModule.safeNow.join(' · '),
                  valueClassName: 'text-slate-300',
                },
                {
                  label: 'Blocked Capabilities',
                  value: selectedModule.blockedCapabilities.join(' · '),
                  valueClassName: 'text-slate-300',
                },
              ]}
              disclaimer={selectedModule.safety}
            />

            <OperatorNextActionCard
              title="Next Development Step"
              summaryTitle={selectedModule.nextStep}
              summaryText={selectedModule.actionDetail}
              checklist={selectedModule.checklist}
              note="UI-only module guidance only."
            />
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Module Readiness Matrix</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Readiness summary for each Veridan Core module, showing current mode, safe capabilities, blocked capabilities, and next development step.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {systemModules.map((module) => (
                <BaselineCard
                  key={module.name}
                  title={module.name}
                  rows={[
                    { label: 'Current Mode', value: module.mode, valueClassName: 'text-amber-500' },
                    { label: 'Safe Now', value: module.safeNow.join(' · '), valueClassName: 'text-slate-300' },
                    { label: 'Blocked Until Later', value: module.blockedCapabilities.join(' · '), valueClassName: 'text-slate-300' },
                    { label: 'Next Step', value: module.nextStep, valueClassName: 'text-slate-300' },
                  ]}
                  disclaimer={module.safety}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Module Readiness Gate</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Gate status for each module showing current mode, readiness level, and the blocking gate before the next phase can proceed.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {systemModules.map((module) => (
                <BaselineCard
                  key={`${module.name}-gate`}
                  title={module.name}
                  rows={[
                    { label: 'Current Mode', value: module.mode, valueClassName: 'text-amber-500' },
                    { label: 'Readiness', value: module.readiness, valueClassName: module.readiness === 'READY' ? 'text-emerald-400' : module.readiness === 'PARTIAL' ? 'text-amber-400' : 'text-destructive' },
                    { label: 'Blocking Gate', value: module.blockingGate, valueClassName: 'text-slate-300' },
                  ]}
                  disclaimer="UI-only readiness gate guidance; no backend or execution logic is enabled."
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Operator Action Plan</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Summary of what operators can do now, what is blocked, what to build next, and what requires governance approval.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Safe Now Card */}
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-emerald-400">Safe Now</h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Review Control Room governance visibility</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Access Knowledge Vault reference materials</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Monitor OpenClaw health and status</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Review audit and evidence baselines</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Plan trading, business, and credit workflows</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocked Until Later Card */}
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-destructive/80">Blocked Until Later</h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Broker connections and live trading</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>TradingView webhook and chart integration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Credit bureau, bank, and payment connections</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Command execution and automation dispatch</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Document upload and AI indexing</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Build Step Card */}
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-amber-400">Next Build Step</h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Finalize governance review and baseline approval</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Define safe integration paths for each module</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Build read-only gateway bridges for monitoring</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Establish operator approval workflows</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Test safety gates and execution blocks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requires Governance Approval Card */}
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-cyan-400">Requires Governance Approval</h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Enabling paper trading for any strategy</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Connecting to live brokers and markets</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Activating payment and banking integrations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Expanding command execution authority</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Enabling any document or credential storage</span>
                    </div>
                  </div>
                </div>
                </div>
                </div>
                </div>
                </div>
                </div>
                </div>
                );
                }