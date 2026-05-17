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
import { CreditCard, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
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
        <h3 className="text-[11px] font-mono font-bold uppercase text-foreground">{title}</h3>
        <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">{description}</p>
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-mono font-bold text-foreground">Credit / Public Side</h1>
          </div>
          <p className="text-[13px] font-mono text-muted-foreground/70">
            Read-only visibility and planning for personal and business credit systems
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-muted-foreground/50">
            <Lock className="w-3 h-3" />
            Planning mode · No bureau connection yet · No execution
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
  );
}