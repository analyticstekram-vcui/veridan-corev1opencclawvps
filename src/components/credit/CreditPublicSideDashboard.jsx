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

        {/* Public Credit Safety Summary Card */}
        <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Public Credit Safety Summary</h2>
          </div>
          <div className="p-4 space-y-2">
            <StatusBadge label="Mode" value="PLANNING_ONLY" type="planning" />
            <StatusBadge label="Bureau Login" value="NOT_CONNECTED" type="neutral" />
            <StatusBadge label="Credit Pull" value="DISABLED" type="disabled" />
            <StatusBadge label="Dispute Automation" value="DISABLED" type="disabled" />
            <StatusBadge label="Funding Applications" value="DISABLED" type="disabled" />
            <StatusBadge label="Credential Entry" value="DISABLED" type="disabled" />
            <StatusBadge label="Client Data Entry" value="DISABLED" type="disabled" />
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3 mt-3">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                This module is for planning and structure only. It does not connect to credit bureaus, collect client data, submit disputes, pull credit, or apply for funding.
              </p>
            </div>
          </div>
        </div>

        {/* Operator Next Action Card */}
        <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Operator Next Action</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
              <p className="text-[11px] font-mono font-bold text-primary mb-2">Build credit profile intake structure and dispute tracker.</p>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Set up the foundational planning structure for personal and business credit tracking before enabling any bureau connections or client data entry.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-[9px] font-mono font-semibold uppercase text-muted-foreground/70 mb-2">Action Checklist</div>
              <button
                type="button"
                className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full"
              >
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Review personal credit sections</span>
              </button>
              <button
                type="button"
                className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full"
              >
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Review business credit sections</span>
              </button>
              <button
                type="button"
                className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full"
              >
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Confirm no bureau login exists</span>
              </button>
              <button
                type="button"
                className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full"
              >
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Confirm no credential entry exists</span>
              </button>
              <button
                type="button"
                className="flex items-start gap-2 hover:opacity-80 transition-opacity text-left w-full"
              >
                <span className="text-primary font-bold mt-0.5 shrink-0">☐</span>
                <span className="text-[10px] text-slate-300">Confirm no automatic dispute submission exists</span>
              </button>
              <div className="text-[8px] font-mono text-muted-foreground/50 mt-3">
                Checklist is local and resets on page refresh.
              </div>
            </div>
          </div>
        </div>

        {/* Public Credit Baseline Card */}
        <div className="mb-6 bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Public Credit Baseline</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Baseline Name</span>
                <span className="text-[10px] font-mono font-bold text-slate-300">Public Credit Planning Baseline</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Baseline Status</span>
                <span className="text-[10px] font-mono font-bold text-primary">APPROVED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Mode</span>
                <span className="text-[10px] font-mono font-bold text-amber-500">PLANNING_ONLY</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Intake Blueprint</span>
                <span className="text-[10px] font-mono font-bold text-slate-300">READ_ONLY</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Dispute Tracker Blueprint</span>
                <span className="text-[10px] font-mono font-bold text-slate-300">READ_ONLY</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Bureau Login</span>
                <span className="text-[10px] font-mono font-bold text-destructive">NOT_CONNECTED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Credit Pull</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Dispute Automation</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Credential Entry</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Client Data Entry</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/70">Document Upload</span>
                <span className="text-[10px] font-mono font-bold text-destructive">DISABLED</span>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                This baseline confirms the Public Credit module is approved for planning and structure review only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const snapshot = {
                  snapshotType: "PUBLIC_CREDIT_PLANNING_BASELINE",
                  baselineName: "Public Credit Planning Baseline",
                  baselineStatus: "APPROVED",
                  mode: "PLANNING_ONLY",
                  intakeBlueprint: "READ_ONLY",
                  disputeTrackerBlueprint: "READ_ONLY",
                  bureauLogin: "NOT_CONNECTED",
                  creditPull: "DISABLED",
                  disputeAutomation: "DISABLED",
                  credentialEntry: "DISABLED",
                  clientDataEntry: "DISABLED",
                  documentUpload: "DISABLED",
                  generatedAt: new Date().toISOString(),
                  safetyClaims: [
                    "No bureau login",
                    "No credit pull",
                    "No dispute submission",
                    "No credential entry",
                    "No client data collection",
                    "No document upload",
                    "Planning-only blueprint mode",
                  ],
                };
                const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `public-credit-baseline-snapshot-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 text-[10px] font-mono font-bold border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-sm"
            >
              Export Credit Module Snapshot
            </button>
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