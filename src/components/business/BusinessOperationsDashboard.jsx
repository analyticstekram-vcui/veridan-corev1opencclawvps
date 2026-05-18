/**
 * BusinessOperationsDashboard
 * Read-only planning dashboard for Veridan Core business operations.
 * No bank connections, no payment processing, no client data.
 *
 * Does NOT:
 *   - Connect to banks
 *   - Process payments
 *   - Collect client data
 *   - Execute automation
 *   - Call APIs
 *   - Write localStorage
 *   - Use timers
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, AlertCircle, Briefcase, TrendingUp, Users, Settings, Home } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';
import BusinessOperationsIntakeStructure from './BusinessOperationsIntakeStructure';
import LocalOnlyBusinessTaskTrackerPreview from './LocalOnlyBusinessTaskTrackerPreview';
import LocalOnlyBusinessTaskTracker from './LocalOnlyBusinessTaskTracker';

function StatusBadge({ label, value, type = 'neutral' }) {
  const colors = {
    neutral: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
    disabled: 'text-destructive border-destructive/30 bg-destructive/5',
    preview: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
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
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function EntityCard({ name, status }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-secondary/20 border border-border/30 rounded-sm">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-primary shrink-0" />
        <span className="text-[10px] font-mono text-foreground">{name}</span>
      </div>
      <span className="text-[8px] font-mono px-2 py-1 border border-border/40 rounded-sm text-muted-foreground/70">
        {status}
      </span>
    </div>
  );
}

function TrackerItem({ title, description }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
      <div>
        <div className="text-[9px] font-mono font-bold text-foreground">{title}</div>
        <div className="text-[8px] font-mono text-muted-foreground/70">{description}</div>
      </div>
    </div>
  );
}

export default function BusinessOperationsDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNav />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Briefcase className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-mono font-bold text-slate-100">Business Operations Dashboard</h1>
            </div>
            <p className="text-[13px] font-mono text-slate-300">
              Read-only planning and visibility for Veridan Core income-producing operations
            </p>
          </div>
          <Link to="/" className="px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5 h-fit">
            <Home className="w-3 h-3" />
            Home
          </Link>
        </div>

        <SafetyStatusCard
          title="Business Operations Safety Summary"
          statuses={[
            { label: 'Mode', value: 'PLANNING_ONLY', type: 'preview' },
            { label: 'Entity Formation', value: 'NOT_CONNECTED', type: 'neutral' },
            { label: 'Registered Agent Integration', value: 'DISABLED', type: 'disabled' },
            { label: 'Business Bank Integration', value: 'DISABLED', type: 'disabled' },
            { label: 'Payment Processing', value: 'DISABLED', type: 'disabled' },
            { label: 'Client Data Entry', value: 'DISABLED', type: 'disabled' },
            { label: 'Credential Entry', value: 'DISABLED', type: 'disabled' },
            { label: 'Document Upload', value: 'DISABLED', type: 'disabled' },
          ]}
          disclaimer="This module is for planning and structure only. It does not form companies, connect to registered agents, open bank accounts, process payments, collect client data, store credentials, or upload documents."
        />

        <OperatorNextActionCard
          title="Operator Next Action"
          summaryTitle="Review business operations structure before adding workflows."
          summaryText="Verify that all planned business entities, revenue streams, and operational safeguards are properly documented and reviewed."
          checklist={[
            'Review entity formation sections',
            'Review registered agent integration plan',
            'Confirm no company formation submission exists',
            'Confirm no payment processing exists',
            'Confirm no credential entry exists',
          ]}
          note="Checklist is local and resets on page refresh."
        />

        <BaselineCard
          title="Business Operations Baseline"
          rows={[
            { label: 'Baseline Name', value: 'Business Operations Planning Baseline' },
            { label: 'Baseline Status', value: 'APPROVED', valueClassName: 'text-primary' },
            { label: 'Mode', value: 'PLANNING_ONLY', valueClassName: 'text-amber-500' },
            { label: 'Entity Formation', value: 'NOT_CONNECTED', valueClassName: 'text-destructive' },
            { label: 'Registered Agent Integration', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Business Bank Integration', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Payment Processing', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Client Data Entry', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Credential Entry', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Document Upload', value: 'DISABLED', valueClassName: 'text-destructive' },
          ]}
          disclaimer="This baseline confirms the Business Operations module is approved for planning and structure review only."
        >
          <SnapshotExportButton
            snapshot={{
              snapshotType: 'BUSINESS_OPERATIONS_PLANNING_BASELINE',
              baselineName: 'Business Operations Planning Baseline',
              baselineStatus: 'APPROVED',
              mode: 'PLANNING_ONLY',
              entityFormation: 'NOT_CONNECTED',
              registeredAgentIntegration: 'DISABLED',
              businessBankIntegration: 'DISABLED',
              paymentProcessing: 'DISABLED',
              clientDataEntry: 'DISABLED',
              credentialEntry: 'DISABLED',
              documentUpload: 'DISABLED',
              generatedAt: new Date().toISOString(),
              safetyClaims: [
                'No company formation submission',
                'No registered agent API connection',
                'No bank integration',
                'No payment processing',
                'No client data collection',
                'No credential entry',
                'No document upload',
                'Planning-only baseline mode',
              ],
            }}
            filenamePrefix="business-operations-baseline-snapshot"
            label="Export Business Operations Snapshot"
          />
        </BaselineCard>

        {/* 1. Business Workflow Categories */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Business Workflow Categories</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Planning structure for eight business operation category types, showing safe-now capabilities, blocked items, and next development steps.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              {
                name: 'Entity Planning',
                purpose: 'Business entity structure, registration, and governance planning',
                safeNow: ['Entity strategy', 'Structure documentation', 'Governance design'],
                blocked: ['Entity formation submission', 'Live registration', 'Filing automation'],
                nextStep: 'Finalize entity structure and registration strategy',
              },
              {
                name: 'Operating Agreements',
                purpose: 'Operating agreements and governance documents for entities',
                safeNow: ['Agreement templates', 'Terms documentation', 'Governance rules'],
                blocked: ['Document generation', 'Signature collection', 'Filing submission'],
                nextStep: 'Design operating agreement framework and approval process',
              },
              {
                name: 'Business Credit Planning',
                purpose: 'Business credit monitoring and facility planning',
                safeNow: ['Credit strategy', 'Facility planning', 'Monitoring design'],
                blocked: ['Credit bureau connection', 'Live credit monitoring', 'Bureau reporting'],
                nextStep: 'Define business credit integration requirements',
              },
              {
                name: 'Vendor / Tradeline Planning',
                purpose: 'Vendor partnerships and tradeline affiliate management',
                safeNow: ['Vendor strategy', 'Relationship planning', 'Integration design'],
                blocked: ['Vendor connections', 'Live integrations', 'Automated routing'],
                nextStep: 'Finalize vendor integration contracts and safety gates',
              },
              {
                name: 'Banking Readiness',
                purpose: 'Banking infrastructure and account readiness planning',
                safeNow: ['Bank selection', 'Account planning', 'Requirements definition'],
                blocked: ['Bank connections', 'Account opening', 'Transaction processing'],
                nextStep: 'Design banking integration contracts before connection',
              },
              {
                name: 'Payment Processing Planning',
                purpose: 'Payment processing system requirements and integration design',
                safeNow: ['Processor selection', 'Requirements design', 'Integration planning'],
                blocked: ['Processor connections', 'Live transactions', 'Money movement'],
                nextStep: 'Define payment processing contracts and safety gates',
              },
              {
                name: 'Compliance / Records',
                purpose: 'Compliance documentation and business record management',
                safeNow: ['Compliance mapping', 'Records planning', 'Audit trail design'],
                blocked: ['Auto-reporting', 'External submission', 'Authority filing'],
                nextStep: 'Establish compliance framework and record retention policy',
              },
              {
                name: 'Future Operational Automation',
                purpose: 'Reserved for automation capabilities when governance approved',
                safeNow: ['Automation planning', 'Workflow design', 'Integration mapping'],
                blocked: ['Live automation', 'Process execution', 'System integration'],
                nextStep: 'Define operational automation requirements before activation',
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
                disclaimer="UI-only planning category; no execution or backend logic enabled."
              />
            ))}
          </div>
        </div>

        {/* 2. Business Readiness Matrix */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Business Readiness Matrix</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Readiness summary for each business workflow category, showing current mode, safe capabilities, blocked capabilities, and next development step.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              { name: 'Entity Planning', mode: 'UI_ONLY' },
              { name: 'Operating Agreements', mode: 'UI_ONLY' },
              { name: 'Business Credit Planning', mode: 'UI_ONLY' },
              { name: 'Vendor / Tradeline Planning', mode: 'UI_ONLY' },
              { name: 'Banking Readiness', mode: 'UI_ONLY' },
              { name: 'Payment Processing Planning', mode: 'UI_ONLY' },
              { name: 'Compliance / Records', mode: 'UI_ONLY' },
              { name: 'Future Operational Automation', mode: 'FUTURE_PHASE' },
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

        {/* 3. Business Readiness Gate */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Business Readiness Gate</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Gate status for each business workflow category showing current mode, readiness level, and the blocking gate before the next phase can proceed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              { name: 'Entity Planning', readiness: 'PARTIAL', gate: 'Complete entity structure documentation and governance approval' },
              { name: 'Operating Agreements', readiness: 'PARTIAL', gate: 'Finalize operating agreement templates before document generation' },
              { name: 'Business Credit Planning', readiness: 'PARTIAL', gate: 'Define business credit integration requirements before bureau connection' },
              { name: 'Vendor / Tradeline Planning', readiness: 'PARTIAL', gate: 'Complete vendor integration contracts and safety gates' },
              { name: 'Banking Readiness', readiness: 'PARTIAL', gate: 'Design banking integration architecture before bank connection' },
              { name: 'Payment Processing Planning', readiness: 'PARTIAL', gate: 'Define payment processing contracts and safety gates before activation' },
              { name: 'Compliance / Records', readiness: 'PARTIAL', gate: 'Establish compliance framework and record retention policy' },
              { name: 'Future Operational Automation', readiness: 'BLOCKED', gate: 'Define operational automation requirements and governance approval' },
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
            {/* Safe Now Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                <h3 className="text-[12px] font-mono font-bold uppercase text-emerald-400">Safe Now</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Plan business entity structure and registration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Design operating agreements and governance documents</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Plan business credit and tradeline integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Design banking and payment processing infrastructure</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Plan business operations governance framework</span>
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
                    <span>Business entity formation and registration submission</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Bank connections and account opening</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Payment processing and money movement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Client data collection and intake workflows</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Automated business operations and live execution</span>
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
                    <span>Finalize entity structure documentation and governance approval</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Design operating agreement templates and workflow</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Complete banking and payment processing integration architecture</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Define business operations governance contracts and approval gates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Establish compliance framework and record retention policy</span>
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
                    <span>Submitting business entity formation and registration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Activating bank connections and account operations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Enabling payment processing and money movement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Activating business operations automation and execution</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Enabling client data intake and external integrations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* 1. Operations Mode */}
          <DashboardSection
            title="1. Operations Mode"
            description="Current status of business operations functionality"
          >
            <div className="space-y-2">
              <StatusBadge label="Operations Mode" value="PLANNING_ONLY" type="neutral" />
              <StatusBadge label="Revenue Tracking" value="PREVIEW_ONLY" type="preview" />
              <StatusBadge label="Client Intake" value="DISABLED" type="disabled" />
              <StatusBadge label="Payment Processing" value="DISABLED" type="disabled" />
              <StatusBadge label="Automation Execution" value="DISABLED" type="disabled" />
              <StatusBadge label="AI Operator" value="PREVIEW_ONLY" type="preview" />
            </div>
          </DashboardSection>

          {/* 2. Entity / Business Portfolio */}
          <DashboardSection
            title="2. Entity / Business Portfolio"
            description="Veridan Core operating entities and planned ventures"
          >
            <div className="space-y-2">
              <EntityCard name="Tekram Analytics" status="PLANNING" />
              <EntityCard name="MetaEdge Capital" status="PLANNING" />
              <EntityCard name="Credit Repair Operation" status="PLANNING" />
              <EntityCard name="Tradeline Vendor Operation" status="PLANNING" />
              <EntityCard name="Wyoming Agent Affiliate Operation" status="PLANNING" />
              <EntityCard name="Future Operating Entities" status="ROADMAP" />
            </div>
          </DashboardSection>

          {/* 3. Revenue Systems */}
          <DashboardSection
            title="3. Revenue Systems"
            description="Planned income streams and tracking areas"
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">Trading signal revenue</div>
                  <div className="text-[8px] font-mono text-muted-foreground/70">MNQ futures strategy sales — Status: PLANNING</div>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">Credit repair revenue</div>
                  <div className="text-[8px] font-mono text-muted-foreground/70">Dispute service offerings — Status: PLANNING</div>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">Tradeline revenue</div>
                  <div className="text-[8px] font-mono text-muted-foreground/70">Authorized user referrals — Status: PLANNING</div>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">Business formation affiliate revenue</div>
                  <div className="text-[8px] font-mono text-muted-foreground/70">Entity setup and filing referrals — Status: PLANNING</div>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">Consulting / AI systems revenue</div>
                  <div className="text-[8px] font-mono text-muted-foreground/70">Custom AI operator development — Status: PLANNING</div>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-2.5 bg-secondary/20 border border-border/30 rounded-sm opacity-60">
                <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">Real estate income tracking</div>
                  <div className="text-[8px] font-mono text-muted-foreground/70">Property portfolio management — Status: FUTURE</div>
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* 4. Operations Tracker */}
          <DashboardSection
            title="4. Operations Tracker"
            description="Planned areas for business tracking and oversight"
          >
            <div className="space-y-0">
              <TrackerItem 
                title="Active projects" 
                description="Current initiatives and development status"
              />
              <TrackerItem 
                title="Pending setup tasks" 
                description="Entity formation and operational onboarding"
              />
              <TrackerItem 
                title="Compliance reminders" 
                description="Tax, legal, and regulatory obligations"
              />
              <TrackerItem 
                title="Client pipeline (later)" 
                description="When client intake is enabled"
              />
              <TrackerItem 
                title="Vendor relationships" 
                description="Affiliate partners and service providers"
              />
              <TrackerItem 
                title="Monthly revenue snapshot" 
                description="Income tracking across all operations"
              />
              <TrackerItem 
                title="AI operator notes" 
                description="Operational observations and recommendations"
              />
            </div>
          </DashboardSection>

          {/* 5. Safety Rules */}
          <DashboardSection
            title="5. Safety Rules"
            description="Current constraints and prohibitions for this phase"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No client data entry yet</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No payment collection yet</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No bank connection</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No tax filing</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No legal document generation</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No automated outreach</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span>No live business execution</span>
              </div>
            </div>
          </DashboardSection>

          {/* 6. Next Allowed Action */}
          <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
              <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build business operations intake structure.</div>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[9px] font-mono text-muted-foreground/70">
            <p className="font-bold mb-1">About Business Operations Dashboard</p>
            <p>This dashboard provides planning visibility and organization for Veridan Core's income-producing business operations. No bank connections, payment processing, client data entry, or live business execution are enabled at this phase. This is a read-only planning tool for operator coordination and roadmap visibility only.</p>
          </div>
        </div>

        {/* Business Operations Intake Structure */}
        <BusinessOperationsIntakeStructure />

        {/* Local-Only Business Task Tracker Preview */}
        <LocalOnlyBusinessTaskTrackerPreview />

        {/* Local-Only Business Task Tracker */}
        <LocalOnlyBusinessTaskTracker />
        </div>
      </div>
    </div>
  );
}