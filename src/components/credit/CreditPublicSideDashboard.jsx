/**
 * CreditPublicSideDashboard
 * Read-only dashboard for Veridan Core's public-side credit system.
 * Visibility and planning only. No bureau connection, disputes, or execution.
 *
 * Does NOT:
 *   - Call credit bureaus
 *   - Submit disputes
 *   - Collect client data
 *   - Collect credentials
 *   - Connect to banks
 *   - Pull credit
 *   - Call backends
 *   - Write localStorage
 *   - Use timers
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Lock, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';
import CreditProfileIntakeStructure from './CreditProfileIntakeStructure';
import LocalOnlyDisputeTrackerPreview from './LocalOnlyDisputeTrackerPreview';

function StatusBadge({ label, value, type = 'neutral' }) {
  const colors = {
    neutral: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
    disabled: 'text-destructive border-destructive/30 bg-destructive/5',
    planning: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${colors[type]}`}>
      <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{label}</span>
      <span className="text-[10px] font-mono font-bold flex-1">{value}</span>
    </div>
  );
}

function DashboardSection({ title, description, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h3 className="text-[11px] font-mono font-bold uppercase text-slate-100">{title}</h3>
        <p className="text-[9px] font-mono text-slate-400 mt-1">{description}</p>
      </div>
      <div className="p-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function CreditItemCard({ label }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5 px-2 bg-secondary/20 border border-border/30 rounded-sm">
      <CheckCircle2 className="w-3 h-3 text-primary/60 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function CreditPublicSideDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNav />
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-mono font-bold text-slate-100">Credit / Public Side</h1>
            </div>
            <p className="text-[13px] font-mono text-slate-300">
              Read-only visibility and planning for personal and business credit systems
            </p>
            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-slate-400">
              <Lock className="w-3 h-3" />
              Planning mode · No bureau connection yet · No execution
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5 h-fit">
            <Home className="w-3 h-3" />
            Home
          </Link>
        </div>

        <SafetyStatusCard
          title="Public Credit Safety Summary"
          statuses={[
            { label: 'Mode', value: 'PLANNING_ONLY', type: 'planning' },
            { label: 'Bureau Login', value: 'NOT_CONNECTED', type: 'neutral' },
            { label: 'Credit Pull', value: 'DISABLED', type: 'disabled' },
            { label: 'Dispute Automation', value: 'DISABLED', type: 'disabled' },
            { label: 'Funding Applications', value: 'DISABLED', type: 'disabled' },
            { label: 'Credential Entry', value: 'DISABLED', type: 'disabled' },
            { label: 'Client Data Entry', value: 'DISABLED', type: 'disabled' },
          ]}
          disclaimer="This module is for planning and structure only. It does not connect to credit bureaus, collect client data, submit disputes, pull credit, or apply for funding."
        />

        <OperatorNextActionCard
          title="Operator Next Action"
          summaryTitle="Build credit profile intake structure and dispute tracker."
          summaryText="Set up the foundational planning structure for personal and business credit tracking before enabling any bureau connections or client data entry."
          checklist={[
            'Review personal credit sections',
            'Review business credit sections',
            'Confirm no bureau login exists',
            'Confirm no credential entry exists',
            'Confirm no automatic dispute submission exists',
          ]}
          note="Checklist is local and resets on page refresh."
        />

        <BaselineCard
          title="Public Credit Baseline"
          rows={[
            { label: 'Baseline Name', value: 'Public Credit Planning Baseline' },
            { label: 'Baseline Status', value: 'APPROVED', valueClassName: 'text-primary' },
            { label: 'Mode', value: 'PLANNING_ONLY', valueClassName: 'text-amber-500' },
            { label: 'Intake Blueprint', value: 'READ_ONLY', valueClassName: 'text-slate-300' },
            { label: 'Dispute Tracker Blueprint', value: 'READ_ONLY', valueClassName: 'text-slate-300' },
            { label: 'Bureau Login', value: 'NOT_CONNECTED', valueClassName: 'text-destructive' },
            { label: 'Credit Pull', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Dispute Automation', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Credential Entry', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Client Data Entry', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Document Upload', value: 'DISABLED', valueClassName: 'text-destructive' },
          ]}
          disclaimer="This baseline confirms the Public Credit module is approved for planning and structure review only."
        >
          <SnapshotExportButton
            snapshot={{
              snapshotType: 'PUBLIC_CREDIT_PLANNING_BASELINE',
              baselineName: 'Public Credit Planning Baseline',
              baselineStatus: 'APPROVED',
              mode: 'PLANNING_ONLY',
              intakeBlueprint: 'READ_ONLY',
              disputeTrackerBlueprint: 'READ_ONLY',
              bureauLogin: 'NOT_CONNECTED',
              creditPull: 'DISABLED',
              disputeAutomation: 'DISABLED',
              credentialEntry: 'DISABLED',
              clientDataEntry: 'DISABLED',
              documentUpload: 'DISABLED',
              generatedAt: new Date().toISOString(),
              safetyClaims: [
                'No bureau login',
                'No credit pull',
                'No dispute submission',
                'No credential entry',
                'No client data collection',
                'No document upload',
                'Planning-only blueprint mode',
              ],
            }}
            filenamePrefix="public-credit-baseline-snapshot"
            label="Export Credit Module Snapshot"
          />
        </BaselineCard>

        {/* 1. Public Credit Workflow Categories */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Public Credit Workflow Categories</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Planning structure for eight credit workflow category types, showing safe-now capabilities, blocked items, and next development steps.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              {
                name: 'Credit Profile Review',
                purpose: 'Personal credit profile structure, monitoring planning, and score tracking',
                safeNow: ['Profile documentation', 'Score tracking design', 'Negative item inventory'],
                blocked: ['Bureau connection', 'Live credit pull', 'Automated monitoring'],
                nextStep: 'Finalize credit profile intake structure and documentation',
              },
              {
                name: 'Credit Monitoring Planning',
                purpose: 'Credit monitoring integration design and data feed requirements',
                safeNow: ['Provider selection', 'Monitoring design', 'Alert requirements'],
                blocked: ['Bureau connection', 'Live monitoring feed', 'Automated alerts'],
                nextStep: 'Design credit monitoring integration architecture',
              },
              {
                name: 'Dispute Workflow Planning',
                purpose: 'Dispute management workflow, letter templates, and tracking design',
                safeNow: ['Workflow design', 'Letter templates', 'Tracking structure'],
                blocked: ['Dispute submission', 'Letter sending', 'Bureau communication'],
                nextStep: 'Finalize dispute workflow contracts and approval gates',
              },
              {
                name: 'Creditor / Bureau Communication',
                purpose: 'Communication protocols, letter generation templates, and bureau interaction design',
                safeNow: ['Protocol design', 'Template library', 'Communication planning'],
                blocked: ['Live bureau contact', 'Automated letter sending', 'Direct bureau submission'],
                nextStep: 'Define communication protocols and approval requirements',
              },
              {
                name: 'Credit Builder Planning',
                purpose: 'Credit building strategy, score improvement planning, and timeline',
                safeNow: ['Strategy documentation', 'Improvement planning', 'Timeline design'],
                blocked: ['Account opening', 'Trade application', 'Creditor contact'],
                nextStep: 'Design credit builder program requirements and safety gates',
              },
              {
                name: 'Tradeline Planning',
                purpose: 'Tradeline management, vendor account planning, and account authorization design',
                safeNow: ['Tradeline strategy', 'Vendor planning', 'Account design'],
                blocked: ['Account connections', 'Live tradelines', 'Automated vendor reporting'],
                nextStep: 'Define tradeline integration and account management requirements',
              },
              {
                name: 'Compliance / Documentation',
                purpose: 'Regulatory compliance framework, audit trails, and documentation management',
                safeNow: ['Compliance planning', 'Audit design', 'Documentation structure'],
                blocked: ['Automated compliance checks', 'Document upload', 'Regulatory submission'],
                nextStep: 'Establish compliance framework and audit log requirements',
              },
              {
                name: 'Future Credit Automation',
                purpose: 'Reserved for credit automation capabilities when governance approved',
                safeNow: ['Automation planning', 'Workflow design', 'Integration mapping'],
                blocked: ['Live automation', 'Bureau automation', 'Automated disputes'],
                nextStep: 'Define credit automation requirements before activation',
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
                disclaimer="UI-only planning category; no execution, bureau connection, or backend logic enabled."
              />
            ))}
          </div>
        </div>

        {/* 2. Public Credit Readiness Matrix */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Public Credit Readiness Matrix</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Readiness summary for each credit workflow category, showing current mode, readiness level, and safe capabilities.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              { name: 'Credit Profile Review', mode: 'UI_ONLY' },
              { name: 'Credit Monitoring Planning', mode: 'UI_ONLY' },
              { name: 'Dispute Workflow Planning', mode: 'UI_ONLY' },
              { name: 'Creditor / Bureau Communication', mode: 'UI_ONLY' },
              { name: 'Credit Builder Planning', mode: 'UI_ONLY' },
              { name: 'Tradeline Planning', mode: 'UI_ONLY' },
              { name: 'Compliance / Documentation', mode: 'UI_ONLY' },
              { name: 'Future Credit Automation', mode: 'FUTURE_PHASE' },
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

        {/* 3. Public Credit Readiness Gate */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Public Credit Readiness Gate</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Gate status for each credit workflow category showing current mode, readiness level, and the blocking gate before the next phase can proceed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              { name: 'Credit Profile Review', readiness: 'PARTIAL', gate: 'Complete credit profile intake structure before bureau connection' },
              { name: 'Credit Monitoring Planning', readiness: 'PARTIAL', gate: 'Design monitoring integration architecture before bureau connection' },
              { name: 'Dispute Workflow Planning', readiness: 'PARTIAL', gate: 'Finalize dispute workflow contracts and approval gates before submission' },
              { name: 'Creditor / Bureau Communication', readiness: 'PARTIAL', gate: 'Define communication protocols and approval requirements before contact' },
              { name: 'Credit Builder Planning', readiness: 'PARTIAL', gate: 'Define credit builder program requirements and governance approval' },
              { name: 'Tradeline Planning', readiness: 'PARTIAL', gate: 'Define tradeline integration and account management requirements' },
              { name: 'Compliance / Documentation', readiness: 'PARTIAL', gate: 'Establish compliance framework and audit log requirements' },
              { name: 'Future Credit Automation', readiness: 'BLOCKED', gate: 'Define credit automation requirements and governance approval before activation' },
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
                {['Review credit profile structure and monitoring requirements', 'Plan dispute workflow and letter templates', 'Design credit builder program and tradeline strategy', 'Plan business credit profile and D-U-N-S requirements', 'Design borrower review framework and governance gates'].map((item) => (
                  <div key={item} className="flex items-start gap-2"><span className="text-emerald-400 shrink-0 mt-0.5">✓</span><span>{item}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[12px] font-mono font-bold uppercase text-destructive/80">Blocked Until Later</h3>
              </div>
              <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                {['Bureau connections and live credit monitoring', 'Dispute submission and letter sending', 'Credit pulls and hard inquiry triggers', 'Funding applications and loan processing', 'Client data collection and intake forms'].map((item) => (
                  <div key={item} className="flex items-start gap-2"><span className="text-destructive/70 shrink-0 mt-0.5">✕</span><span>{item}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                <h3 className="text-[12px] font-mono font-bold uppercase text-amber-400">Next Build Step</h3>
              </div>
              <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                {['Finalize credit profile intake structure and governance approval', 'Complete dispute workflow contracts and approval gates', 'Design credit monitoring integration architecture', 'Define business credit profile requirements documentation', 'Establish borrower review workflow and governance framework'].map((item) => (
                  <div key={item} className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">→</span><span>{item}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20">
                <h3 className="text-[12px] font-mono font-bold uppercase text-cyan-400">Requires Governance Approval</h3>
              </div>
              <div className="p-4 space-y-1.5 text-[10px] font-mono text-slate-300">
                {['Enabling bureau connections and live credit monitoring', 'Activating dispute submission and automated letter sending', 'Enabling funding applications and loan processing', 'Activating credit automation and bureau reporting', 'Enabling client data intake and credential storage'].map((item) => (
                  <div key={item} className="flex items-start gap-2"><span className="text-cyan-400 shrink-0 mt-0.5">◇</span><span>{item}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid of sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Public Credit Status */}
          <DashboardSection
            title="1. Public Credit Status"
            description="Current status of credit monitoring and automation systems"
          >
            <StatusBadge label="Personal Credit Monitoring" value="NOT_CONNECTED" type="neutral" />
            <StatusBadge label="Business Credit Monitoring" value="NOT_CONNECTED" type="neutral" />
            <StatusBadge label="Dispute Automation" value="DISABLED" type="disabled" />
            <StatusBadge label="Funding Applications" value="DISABLED" type="disabled" />
            <StatusBadge label="Tradeline Tracking" value="PLANNING" type="planning" />
          </DashboardSection>

          {/* 2. Personal Credit */}
          <DashboardSection
            title="2. Personal Credit"
            description="Components for personal credit monitoring and management"
          >
            <CreditItemCard label="Credit report monitoring" />
            <CreditItemCard label="Score tracking" />
            <CreditItemCard label="Negative item inventory" />
            <CreditItemCard label="Dispute tracker" />
            <CreditItemCard label="Inquiry tracker" />
            <CreditItemCard label="Utilization tracker" />
          </DashboardSection>

          {/* 3. Business Credit */}
          <DashboardSection
            title="3. Business Credit"
            description="Components for business credit profile and readiness"
          >
            <CreditItemCard label="Business profile setup" />
            <CreditItemCard label="D-U-N-S / business identifiers" />
            <CreditItemCard label="Business bank account readiness" />
            <CreditItemCard label="Net-30 vendor readiness" />
            <CreditItemCard label="Business tradeline tracker" />
            <CreditItemCard label="Funding readiness" />
          </DashboardSection>

          {/* 4. Dispute Management */}
          <DashboardSection
            title="4. Dispute Management"
            description="Manual dispute tracking and evidence management"
          >
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
              <span>Draft disputes only</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
              <span>Manual review required</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
              <span>No automatic submission</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
              <span>Evidence required</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
              <span>Bureau response tracking (later)</span>
            </div>
          </DashboardSection>

          {/* 5. Tradeline / Funding Readiness */}
          <DashboardSection
            title="5. Tradeline / Funding Readiness"
            description="Planning and sequencing for credit building and funding"
          >
            <StatusBadge label="Authorized user tradelines" value="PLANNING" type="planning" />
            <StatusBadge label="Business primary tradelines" value="PLANNING" type="planning" />
            <StatusBadge label="Vendor accounts" value="PLANNING" type="planning" />
            <StatusBadge label="Funding sequence" value="NOT_STARTED" type="neutral" />
            <StatusBadge label="Lender readiness" value="NOT_STARTED" type="neutral" />
          </DashboardSection>

          {/* 6. Safety Rules */}
          <DashboardSection
            title="6. Safety & Compliance Rules"
            description="Constraints and prohibitions for this phase"
          >
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No bureau login yet</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No credential entry</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No automatic dispute filing</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No funding applications submitted</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No bank connection</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No credit pull</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No client data entry yet</span>
            </div>
          </DashboardSection>

          {/* 7. Next Allowed Action */}
          <div className="lg:col-span-2 flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
              <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build credit profile intake structure and dispute tracker.</div>
            </div>
          </div>
        </div>

        {/* Credit Profile Intake Blueprint Section */}
        <div className="mt-8 mb-8 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Credit Profile Intake Blueprint</h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">Read-only blueprint of future intake fields. No client data is collected, saved, submitted, or transmitted.</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Personal Credit Profile Blueprint */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Personal Credit Profile Blueprint</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Full legal name</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Date of birth</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Current address</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Previous addresses</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Credit monitoring provider</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Current score range</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Negative item inventory</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Inquiry inventory</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Utilization summary</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Dispute status</span>
                </div>
              </div>
            </div>

            {/* Business Credit Profile Blueprint */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Business Credit Profile Blueprint</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Legal business name</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>EIN status</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Entity type</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Formation state</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Business address</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Business phone</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Business email</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>D-U-N-S status</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Business bank account readiness</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Vendor tradeline readiness</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Funding readiness</span>
                </div>
              </div>
            </div>

            {/* Safety Constraints */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[10px] font-mono font-bold uppercase text-destructive/80">Safety Constraints</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No form inputs</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No client data collection</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No credit pull</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No bureau login</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No dispute submission</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No funding application submission</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No credential storage</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Tracker Blueprint Section */}
        <div className="mt-8 mb-8 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Dispute Tracker Blueprint</h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">Read-only blueprint for future dispute tracking. No disputes are created, submitted, mailed, or transmitted.</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Planned Dispute Item Fields */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Planned Dispute Item Fields</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Creditor / Furnisher</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Bureau reporting item</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Account number masked</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Negative item type</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Reported balance</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Date opened</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Last reported date</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Dispute reason</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Evidence needed</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Letter round</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Response deadline</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>Current status</span>
                </div>
              </div>
            </div>

            {/* Planned Dispute Statuses */}
            <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-secondary/40 border-b border-border/30">
                <h3 className="text-[10px] font-mono font-bold uppercase text-slate-100">Planned Dispute Statuses</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>NOT_STARTED</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>NEEDS_REVIEW</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>EVIDENCE_REQUIRED</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>READY_FOR_DRAFT</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>DRAFT_ONLY</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>SENT_MANUALLY</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>RESPONSE_PENDING</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>RESOLVED</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/70 py-1.5 px-2 bg-secondary/10 border border-border/20 rounded-sm">
                  <span>ESCALATION_REVIEW</span>
                </div>
              </div>
            </div>

            {/* Safety Constraints */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-sm overflow-hidden">
              <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[10px] font-mono font-bold uppercase text-destructive/80">Safety Constraints</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No dispute submission</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No automatic letter sending</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No bureau connection</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No client data collection</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No credential entry</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No document upload yet</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>No legal claims generated automatically</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[9px] font-mono text-muted-foreground/70">
            <p className="font-bold mb-1">About the Public Side Credit System</p>
            <p>This dashboard provides read-only visibility into the planning and readiness of Veridan Core's personal and business credit systems. It is for planning and visibility only. No credit bureaus are connected, no credentials are collected, and no applications or disputes are submitted. Manual review is required for all actions.</p>
          </div>
        </div>

        {/* Credit Profile Intake Structure */}
        <CreditProfileIntakeStructure />

        {/* Local-Only Dispute Tracker Preview */}
        <LocalOnlyDisputeTrackerPreview />
        </div>
      </div>
    </div>
  );
}