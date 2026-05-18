/**
 * OpenClawGovernanceDashboard
 * Read-only governance planning interface for OpenClaw AI gateway.
 * Visibility and planning only. No execution, no browser automation, no credential handling.
 *
 * Does NOT:
 *   - Execute commands
 *   - Automate browser actions
 *   - Call backends
 *   - Handle credentials or secrets
 *   - Submit disputes or applications
 *   - Connect to external services
 *   - Use timers or polling
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Lock, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';

export default function OpenClawGovernanceDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNav />
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Radio className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-mono font-bold text-slate-100">OpenClaw Governance</h1>
              </div>
              <p className="text-[13px] font-mono text-slate-300">
                Read-only planning and governance structure for OpenClaw AI gateway operations
              </p>
              <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-slate-400">
                <Lock className="w-3 h-3" />
                Planning mode · No execution · No automation
              </div>
            </div>
            <Link to="/" className="px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5 h-fit">
              <Home className="w-3 h-3" />
              Home
            </Link>
          </div>

          <SafetyStatusCard
            title="OpenClaw Governance Safety Summary"
            statuses={[
              { label: 'Mode', value: 'PLANNING_ONLY', type: 'planning' },
              { label: 'Command Execution', value: 'DISABLED', type: 'disabled' },
              { label: 'Browser Automation', value: 'DISABLED', type: 'disabled' },
              { label: 'Gateway Polling', value: 'DISABLED', type: 'disabled' },
              { label: 'Credential Handling', value: 'DISABLED', type: 'disabled' },
              { label: 'Bridge Execution', value: 'DISABLED', type: 'disabled' },
              { label: 'Secret Exposure', value: 'PROHIBITED', type: 'disabled' },
            ]}
            disclaimer="This module is for planning and structure only. It does not execute commands, automate browsers, call backends, handle credentials, or activate bridges."
          />

          <OperatorNextActionCard
            title="Operator Next Action"
            summaryTitle="Review OpenClaw governance structure before enabling execution phases."
            summaryText="Verify that gateway monitoring, command proposal governance, bridge preview planning, and execution approval workflows are properly documented and reviewed."
            checklist={[
              'Review gateway health monitoring structure',
              'Review read-only status check design',
              'Review Cloudflare Access boundary definition',
              'Confirm no command execution exists',
              'Confirm no browser automation exists',
              'Confirm no credential storage exists',
            ]}
            note="Checklist is local and resets on page refresh."
          />

          <BaselineCard
            title="OpenClaw Governance Baseline"
            rows={[
              { label: 'Baseline Name', value: 'OpenClaw Governance Planning Baseline' },
              { label: 'Baseline Status', value: 'APPROVED', valueClassName: 'text-primary' },
              { label: 'Mode', value: 'PLANNING_ONLY', valueClassName: 'text-amber-500' },
              { label: 'Command Execution', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Browser Automation', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Gateway Polling', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Bridge Preview', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Credential Handling', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Secret Exposure', value: 'PROHIBITED', valueClassName: 'text-destructive' },
            ]}
            disclaimer="This baseline confirms the OpenClaw Governance module is approved for planning and structure review only."
          >
            <SnapshotExportButton
              snapshot={{
                snapshotType: 'OPENCLAW_GOVERNANCE_PLANNING_BASELINE',
                baselineName: 'OpenClaw Governance Planning Baseline',
                baselineStatus: 'APPROVED',
                mode: 'PLANNING_ONLY',
                commandExecution: 'DISABLED',
                browserAutomation: 'DISABLED',
                gatewayPolling: 'DISABLED',
                bridgePreview: 'DISABLED',
                credentialHandling: 'DISABLED',
                secretExposure: 'PROHIBITED',
                generatedAt: new Date().toISOString(),
                safetyClaims: [
                  'No command execution',
                  'No browser automation',
                  'No gateway polling',
                  'No bridge execution',
                  'No credential handling',
                  'No secret exposure',
                  'Planning-only baseline mode',
                ],
              }}
              filenamePrefix="openclaw-governance-baseline-snapshot"
              label="Export Governance Baseline Snapshot"
            />
          </BaselineCard>

          {/* 1. OpenClaw Governance Workflow Categories */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">OpenClaw Governance Workflow Categories</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Planning structure for eight governance workflow category types, showing safe-now capabilities, blocked items, and next development steps.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[
                {
                  name: 'Gateway Health Monitoring',
                  purpose: 'OpenClaw gateway health checks, status diagnostics, and connectivity monitoring design',
                  safeNow: ['Health check design', 'Diagnostic planning', 'Monitoring structure'],
                  blocked: ['Live gateway polling', 'Automated health checks', 'Alert triggers'],
                  nextStep: 'Complete gateway health monitoring architecture and readiness contract',
                },
                {
                  name: 'Read-Only Status Checks',
                  purpose: 'Safe read-only status endpoints and version capability checks design',
                  safeNow: ['Status check planning', 'Capability mapping', 'Read-only design'],
                  blocked: ['Live status polling', 'Automated checks', 'External API calls'],
                  nextStep: 'Define read-only status check contracts and governance gates',
                },
                {
                  name: 'Cloudflare Access Boundary',
                  purpose: 'Cloudflare Access protection, token validation, and boundary enforcement design',
                  safeNow: ['Boundary design', 'Token validation rules', 'Access control planning'],
                  blocked: ['Live token validation', 'Automated boundary enforcement', 'Access escalation'],
                  nextStep: 'Establish Cloudflare Access boundary contracts and validation rules',
                },
                {
                  name: 'Environment Key Presence Checks',
                  purpose: 'Backend environment variable presence verification design (no value exposure)',
                  safeNow: ['Presence check design', 'Boolean result planning', 'Safety constraints'],
                  blocked: ['Value exposure', 'Secret reading', 'Key material access'],
                  nextStep: 'Define environment key presence check contracts and safety gates',
                },
                {
                  name: 'Evidence Chain Review',
                  purpose: 'Audit trail, evidence capture, and governance audit log design',
                  safeNow: ['Evidence design', 'Audit trail planning', 'Snapshot structure'],
                  blocked: ['Automated evidence collection', 'Private data capture', 'Auto-submission'],
                  nextStep: 'Design evidence chain architecture and retention policies',
                },
                {
                  name: 'Command Proposal Governance',
                  purpose: 'Command proposal workflow, approval gates, and operator review design',
                  safeNow: ['Proposal workflow design', 'Approval criteria', 'Review gates planning'],
                  blocked: ['Auto-approval', 'Command execution', 'Direct gateway calls'],
                  nextStep: 'Finalize command proposal governance contracts and approval workflows',
                },
                {
                  name: 'Bridge Preview / Dry-Run Planning',
                  purpose: 'Bridge preview and dry-run execution design for safe pre-execution validation',
                  safeNow: ['Preview design', 'Dry-run planning', 'Validation structure'],
                  blocked: ['Live bridge execution', 'Real command submission', 'Actual automation'],
                  nextStep: 'Complete bridge preview and dry-run contracts before activation',
                },
                {
                  name: 'Future Execution Activation',
                  purpose: 'Reserved for execution capabilities when all governance gates are approved',
                  safeNow: ['Execution planning', 'Activation design', 'Safety framework'],
                  blocked: ['Live command execution', 'Browser automation', 'Real gateway calls'],
                  nextStep: 'Define execution activation requirements and governance approval',
                },
              ].map((category) => (
                <BaselineCard
                  key={category.name}
                  title={category.name}
                  rows={[
                    { label: 'Purpose', value: category.purpose },
                    { label: 'Safe Now', value: category.safeNow.join(' · '), valueClassName: 'text-emerald-400' },
                    { label: 'Blocked Until Later', value: category.blocked.join(' · '), valueClassName: 'text-destructive/70' },
                    { label: 'Next Step', value: category.nextStep, valueClassName: 'text-amber-400' },
                  ]}
                  disclaimer="UI-only planning category; no execution, polling, or backend logic enabled."
                />
              ))}
            </div>
          </div>

          {/* 2. OpenClaw Governance Readiness Matrix */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">OpenClaw Governance Readiness Matrix</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Readiness summary for each governance workflow category, showing current mode and readiness level.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[
                { name: 'Gateway Health Monitoring', mode: 'UI_ONLY' },
                { name: 'Read-Only Status Checks', mode: 'UI_ONLY' },
                { name: 'Cloudflare Access Boundary', mode: 'UI_ONLY' },
                { name: 'Environment Key Presence Checks', mode: 'UI_ONLY' },
                { name: 'Evidence Chain Review', mode: 'UI_ONLY' },
                { name: 'Command Proposal Governance', mode: 'UI_ONLY' },
                { name: 'Bridge Preview / Dry-Run Planning', mode: 'UI_ONLY' },
                { name: 'Future Execution Activation', mode: 'FUTURE_PHASE' },
              ].map((item) => (
                <BaselineCard
                  key={`matrix-${item.name}`}
                  title={item.name}
                  rows={[
                    { label: 'Current Mode', value: item.mode, valueClassName: 'text-amber-500' },
                    { label: 'Readiness', value: item.mode === 'FUTURE_PHASE' ? 'BLOCKED' : 'PARTIAL', valueClassName: item.mode === 'FUTURE_PHASE' ? 'text-destructive' : 'text-amber-400' },
                  ]}
                  disclaimer="UI-only readiness planning; no execution or backend logic enabled."
                />
              ))}
            </div>
          </div>

          {/* 3. OpenClaw Governance Readiness Gate */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">OpenClaw Governance Readiness Gate</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Gate status for each governance workflow category showing readiness level and blocking gates.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[
                { name: 'Gateway Health Monitoring', readiness: 'PARTIAL', gate: 'Complete gateway health monitoring architecture before polling activation' },
                { name: 'Read-Only Status Checks', readiness: 'PARTIAL', gate: 'Define read-only status check contracts and governance gates' },
                { name: 'Cloudflare Access Boundary', readiness: 'PARTIAL', gate: 'Establish Cloudflare Access boundary enforcement before activation' },
                { name: 'Environment Key Presence Checks', readiness: 'PARTIAL', gate: 'Define environment key presence checks with safety constraints' },
                { name: 'Evidence Chain Review', readiness: 'PARTIAL', gate: 'Design evidence chain architecture and retention policies' },
                { name: 'Command Proposal Governance', readiness: 'PARTIAL', gate: 'Finalize command proposal governance contracts and approval workflows' },
                { name: 'Bridge Preview / Dry-Run Planning', readiness: 'PARTIAL', gate: 'Complete bridge preview and dry-run contracts before execution' },
                { name: 'Future Execution Activation', readiness: 'BLOCKED', gate: 'Define execution activation requirements and governance approval before activation' },
              ].map((item) => (
                <BaselineCard
                  key={`gate-${item.name}`}
                  title={item.name}
                  rows={[
                    { label: 'Current Mode', value: 'UI_ONLY', valueClassName: 'text-amber-500' },
                    { label: 'Readiness', value: item.readiness, valueClassName: item.readiness === 'BLOCKED' ? 'text-destructive' : 'text-amber-400' },
                    { label: 'Blocking Gate', value: item.gate, valueClassName: 'text-slate-300' },
                  ]}
                  disclaimer="UI-only gate guidance; no backend or execution logic is enabled."
                />
              ))}
            </div>
          </div>

          {/* 4. Operator Action Plan */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Operator Action Plan</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Summary of what operators can do now, what is blocked, what to build next, and what requires governance approval.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-emerald-400">Safe Now</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Review gateway health monitoring structure', 'Plan read-only status check design', 'Design Cloudflare Access boundaries', 'Plan evidence chain and audit logging', 'Design command proposal governance and approval workflows'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-emerald-400 shrink-0 mt-0.5">✓</span><span>{item}</span></div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-destructive/80">Blocked Until Later</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Live gateway polling and monitoring', 'Command execution and automation', 'Browser automation and control', 'Bridge execution and real submissions', 'Credential handling and secret exposure'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-destructive/70 shrink-0 mt-0.5">✕</span><span>{item}</span></div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-amber-400">Next Build Step</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Complete gateway health monitoring architecture', 'Define read-only status check contracts', 'Establish Cloudflare Access boundary enforcement', 'Design evidence chain retention policies', 'Finalize command proposal approval workflows'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">→</span><span>{item}</span></div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20">
                  <h3 className="text-[12px] font-mono font-bold uppercase text-cyan-400">Requires Governance Approval</h3>
                </div>
                <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                  {['Enabling gateway polling and live monitoring', 'Activating command proposal execution', 'Enabling bridge preview and dry-run execution', 'Activating browser automation and control', 'Enabling live execution and gateway calls'].map((item) => (
                    <div key={item} className="flex items-start gap-2"><span className="text-cyan-400 shrink-0 mt-0.5">◇</span><span>{item}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info footer */}
          <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-[9px] font-mono text-muted-foreground/70">
              <p className="font-bold mb-1">About OpenClaw Governance</p>
              <p>This dashboard provides read-only visibility into the planning and governance structure of Veridan Core's OpenClaw AI gateway. It is for planning and visibility only. No commands are executed, no browsers are automated, and no credentials are handled. All operations require manual operator approval and are disabled until explicitly enabled through governance approval.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}