/**
 * AuditEvidenceDashboard
 * Read-only governance planning dashboard for audit and evidence management.
 * Organizes baseline snapshots, operator approvals, module status changes, and verification records.
 * Future: Will connect to persistent audit store with approval gates.
 *
 * Does NOT:
 *   - Write to database, audit logs, or persistent storage
 *   - Call external APIs, backends, brokers, credit systems
 *   - Collect credentials, handle file uploads, parse documents
 *   - Connect to MCP, OpenClaw execution, TradingView, broker, bank, or credit bureau
 *   - Enable execution logging, AI indexing, or automated evidence collection
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Lock, Info, Home } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';

const evidenceCategories = [
  {
    name: 'Baseline Snapshots',
    purpose: 'UI-only governance baselines exported from dashboards',
    safeNow: ['Export snapshots', 'Review baseline data', 'Download JSON records'],
    blocked: ['Persistent storage', 'Automated export', 'Baseline sync'],
    nextStep: 'Design audit record lifecycle and retention policy',
  },
  {
    name: 'Operator Approvals',
    purpose: 'Planning records of operator decisions and governance reviews',
    safeNow: ['View approval history', 'Review decisions', 'Document reasoning'],
    blocked: ['Approval enforcement', 'Auto-approval workflows', 'Signature validation'],
    nextStep: 'Define approval workflow contracts and signature requirements',
  },
  {
    name: 'Module Status Changes',
    purpose: 'Governance records tracking module configuration and feature state changes',
    safeNow: ['Review status logs', 'Track configuration', 'View change history'],
    blocked: ['Auto-detection', 'Automated logging', 'Change enforcement'],
    nextStep: 'Establish module state tracking and change notification system',
  },
  {
    name: 'Blocked Actions',
    purpose: 'Documentation of operations prevented by safety constraints',
    safeNow: ['Review blocked logs', 'Understand constraints', 'Plan remediation'],
    blocked: ['Constraint enforcement', 'Automatic blocking', 'Execution gates'],
    nextStep: 'Design constraint documentation and remediation tracking',
  },
  {
    name: 'Build Verification Reports',
    purpose: 'Evidence records from build validation and deployment verification',
    safeNow: ['Review verification results', 'Track build status', 'View reports'],
    blocked: ['Automated verification', 'Live deployment tracking', 'CI/CD hooks'],
    nextStep: 'Define build verification checklist and report schema',
  },
  {
    name: 'Git / Deployment Records',
    purpose: 'Documentation of source code changes and deployment history',
    safeNow: ['Review commit history', 'Track deployments', 'Reference sources'],
    blocked: ['Git integration', 'Automated sync', 'Deployment automation'],
    nextStep: 'Design Git integration and deployment tracking framework',
  },
  {
    name: 'OpenClaw Health Evidence',
    purpose: 'Read-only gateway health checks and connectivity logs',
    safeNow: ['View health snapshots', 'Review connectivity logs', 'Document status'],
    blocked: ['Automated health checks', 'Health enforcement', 'Execution gates'],
    nextStep: 'Establish periodic health check documentation and archiving',
  },
  {
    name: 'Future Execution Logs',
    purpose: 'Reserved for execution evidence when live operations are enabled',
    safeNow: ['Plan log structure', 'Design schemas', 'Document requirements'],
    blocked: ['Live execution', 'Log collection', 'Execution tracking'],
    nextStep: 'Define execution log schema and retention policy before enabling',
  },
];

function EvidenceCategoryCard({ category }) {
  return (
    <BaselineCard
      title={category.name}
      rows={[
        { label: 'Purpose', value: category.purpose },
        { label: 'Safe Now', value: category.safeNow.join(' · '), valueClassName: 'text-emerald-400' },
        { label: 'Blocked Until Later', value: category.blocked.join(' · '), valueClassName: 'text-destructive/70' },
        { label: 'Next Step', value: category.nextStep, valueClassName: 'text-amber-400' },
      ]}
      disclaimer="UI-only planning category; no persistent storage, automated collection, or backend integration enabled."
    />
  );
}

export default function AuditEvidenceDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNav />
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-mono font-bold text-slate-100">Audit / Evidence Dashboard</h1>
              </div>
              <p className="text-[13px] font-mono text-slate-300">
                UI-only governance planning for baseline snapshots, operator approvals, and verification records
              </p>
              <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-slate-400">
                <Lock className="w-3 h-3" />
                Read-only reference · No persistent storage · Future audit framework
              </div>
            </div>
            <Link to="/" className="px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5 h-fit">
              <Home className="w-3 h-3" />
              Home
            </Link>
          </div>

          {/* 1. Audit / Evidence Safety Summary */}
          <SafetyStatusCard
            title="Audit / Evidence Safety Summary"
            statuses={[
              { label: 'Current Mode', value: 'READ_ONLY', type: 'preview' },
              { label: 'Evidence Export', value: 'UI_ONLY', type: 'preview' },
              { label: 'Baseline Records', value: 'UI_ONLY', type: 'preview' },
              { label: 'Operator Approvals', value: 'PLANNING_ONLY', type: 'planning' },
              { label: 'Backend Audit Store', value: 'DISABLED', type: 'disabled' },
              { label: 'Execution Logs', value: 'DISABLED', type: 'disabled' },
            ]}
            disclaimer="This module provides read-only reference for governance planning only. No persistent audit storage, automated logging, backend integration, or execution tracking is enabled."
          />

          {/* 2. Operator Next Action */}
          <OperatorNextActionCard
            title="Operator Next Action"
            summaryTitle="Review Evidence Categories and Design Audit Framework"
            summaryText="Verify audit/evidence structure, governance categories, and safety constraints before persistent storage and automated collection features are enabled."
            checklist={[
              'Review evidence categories',
              'Review governance structure',
              'Confirm no persistent storage exists',
              'Confirm no automated collection exists',
              'Confirm no backend audit integration exists',
            ]}
            note="Checklist is local and resets on page refresh."
          />

          {/* 3. Baseline Details */}
          <BaselineCard
            title="Audit / Evidence Safety Summary (Detailed)"
            rows={[
              { label: 'Current Mode', value: 'READ_ONLY', valueClassName: 'text-amber-500' },
              { label: 'Evidence Export', value: 'UI_ONLY', valueClassName: 'text-amber-500' },
              { label: 'Baseline Records', value: 'UI_ONLY', valueClassName: 'text-amber-500' },
              { label: 'Operator Approvals', value: 'PLANNING_ONLY', valueClassName: 'text-amber-500' },
              { label: 'Persistent Audit Store', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Automated Collection', value: 'DISABLED', valueClassName: 'text-destructive' },
              { label: 'Execution Logging', value: 'DISABLED', valueClassName: 'text-destructive' },
            ]}
            disclaimer="Audit/Evidence Dashboard is read-only reference material only. No persistent storage, automated logging, execution tracking, or backend integration are enabled."
          >
            <SnapshotExportButton
              snapshot={{
                snapshotType: 'AUDIT_EVIDENCE_PLANNING_BASELINE',
                baselineName: 'Audit / Evidence Planning Baseline',
                baselineStatus: 'APPROVED',
                mode: 'READ_ONLY',
                currentMode: 'READ_ONLY',
                evidenceExport: 'UI_ONLY',
                baselineRecords: 'UI_ONLY',
                operatorApprovals: 'PLANNING_ONLY',
                persistentAuditStore: 'DISABLED',
                automatedCollection: 'DISABLED',
                executionLogging: 'DISABLED',
                generatedAt: new Date().toISOString(),
                safetyClaims: [
                  'Read-only reference only',
                  'No persistent storage',
                  'No automated logging',
                  'No backend audit integration',
                  'No execution tracking',
                  'No credential storage',
                  'Planning/governance baseline mode',
                ],
              }}
              filenamePrefix="audit-evidence-baseline-snapshot"
              label="Export Baseline Snapshot"
            />
          </BaselineCard>

          {/* 4. Evidence Categories Section */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Evidence Categories</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Planning structure for eight evidence category types, showing safe-now capabilities, blocked items, and next development steps.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {evidenceCategories.map((category) => (
                <EvidenceCategoryCard key={category.name} category={category} />
              ))}
            </div>
          </div>

          {/* 5. Audit / Evidence Readiness Matrix */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Audit / Evidence Readiness Matrix</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Readiness summary for each evidence category, showing current mode, safe capabilities, blocked capabilities, and next development step.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {evidenceCategories.map((category) => (
                <BaselineCard
                  key={`matrix-${category.name}`}
                  title={category.name}
                  rows={[
                    { label: 'Current Mode', value: 'READ_ONLY', valueClassName: 'text-amber-500' },
                    { label: 'Safe Now', value: category.safeNow.join(' · '), valueClassName: 'text-emerald-400' },
                    { label: 'Blocked Until Later', value: category.blocked.join(' · '), valueClassName: 'text-destructive/70' },
                    { label: 'Next Step', value: category.nextStep, valueClassName: 'text-slate-300' },
                  ]}
                  disclaimer="UI-only readiness planning; no execution or backend logic enabled."
                />
              ))}
            </div>
          </div>

          {/* 6. Audit / Evidence Readiness Gate */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-mono font-bold text-slate-100">Audit / Evidence Readiness Gate</h2>
              <p className="mt-2 text-[13px] font-mono text-slate-300">
                Gate status for each evidence category showing current mode, readiness level, and the blocking gate before the next phase can proceed.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {evidenceCategories.map((category) => {
                const readinessStatus = category.name === 'Future Execution Logs' ? 'BLOCKED' : 'PARTIAL';
                const blockingGate = category.name === 'Future Execution Logs'
                  ? 'Define execution log schema and implement live operation gates'
                  : 'Design persistent audit store and approval workflow before live collection';

                return (
                  <BaselineCard
                    key={`gate-${category.name}`}
                    title={category.name}
                    rows={[
                      { label: 'Current Mode', value: 'READ_ONLY', valueClassName: 'text-amber-500' },
                      { label: 'Readiness', value: readinessStatus, valueClassName: readinessStatus === 'BLOCKED' ? 'text-destructive' : 'text-amber-400' },
                      { label: 'Blocking Gate', value: blockingGate, valueClassName: 'text-slate-300' },
                    ]}
                    disclaimer="UI-only gate guidance; no backend or execution logic is enabled."
                  />
                );
              })}
            </div>
          </div>

          {/* 7. Operator Action Plan */}
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
                      <span>Export baseline snapshots to JSON files</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>View evidence categories and readiness status</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Review operator approval records and decisions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Document module status changes and blocked actions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>Plan audit framework structure and governance</span>
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
                      <span>Persistent audit database storage</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Automated evidence collection and logging</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Approval workflow enforcement and signature validation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Execution logging and trace collection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                      <span>Automated compliance reporting and external submission</span>
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
                      <span>Finalize evidence categories and audit framework design</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Design persistent audit store schema and retention policy</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Define approval workflow contracts and signature requirements</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Build automated evidence collection with governance gates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      <span>Establish compliance reporting and audit archiving framework</span>
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
                      <span>Enabling persistent audit database and record storage</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Activating automated evidence collection and logging</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Enforcing approval workflows and digital signatures</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Collecting execution logs and operational traces</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                      <span>Enabling automated compliance reporting and audit submission</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-[9px] font-mono text-muted-foreground/70">
              <p className="font-bold mb-1">About the Audit / Evidence Dashboard</p>
              <p>This dashboard is a read-only reference for Veridan Core's audit and evidence governance planning. It organizes operational records across baseline snapshots, operator approvals, module changes, and verification reports. In future phases, persistent audit storage, automated collection, and approval workflows will be enabled with explicit governance approval.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}