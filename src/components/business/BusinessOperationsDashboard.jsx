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
import { CheckCircle2, Lock, AlertCircle, Briefcase, TrendingUp, Users, Settings } from 'lucide-react';
import BusinessOperationsIntakeStructure from './BusinessOperationsIntakeStructure';

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
        <h3 className="text-[11px] font-mono font-bold uppercase text-foreground">{title}</h3>
        <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">{description}</p>
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-mono font-bold text-foreground">Business Operations Dashboard</h1>
          </div>
          <p className="text-[13px] font-mono text-muted-foreground/70">
            Read-only planning and visibility for Veridan Core income-producing operations
          </p>
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
      </div>
    </div>
  );
}