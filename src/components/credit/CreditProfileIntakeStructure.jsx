/**
 * CreditProfileIntakeStructure
 * Read-only structure showing planned credit profile intake fields.
 * Not an intake form. No real data collection.
 *
 * Does NOT:
 *   - Collect client data
 *   - Create input fields
 *   - Call credit bureaus
 *   - Call banks
 *   - Call backends
 *   - Write localStorage
 *   - Upload files
 *   - Collect credentials
 */
import React from 'react';
import { CheckCircle2, Lock, AlertCircle } from 'lucide-react';

function StatusBadge({ label, value, type = 'neutral' }) {
  const colors = {
    neutral: 'text-slate-400 border-slate-600/30 bg-slate-600/5',
    disabled: 'text-destructive border-destructive/30 bg-destructive/5',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${colors[type]}`}>
      <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{label}</span>
      <span className="text-[10px] font-mono font-bold flex-1">{value}</span>
    </div>
  );
}

function FieldItem({ label }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5 px-2 bg-secondary/20 border border-border/30 rounded-sm">
      <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
      <span>{label}</span>
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

export default function CreditProfileIntakeStructure() {
  return (
    <div className="mt-8 pt-8 border-t border-border/40">
      <div className="mb-6">
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2">Credit Profile Intake Structure</h2>
        <p className="text-[13px] font-mono text-muted-foreground/70">
          Read-only structure showing planned intake fields for personal and business credit profiles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Intake Mode */}
        <DashboardSection
          title="1. Intake Mode"
          description="Current status of intake functionality"
        >
          <StatusBadge label="Intake Mode" value="STRUCTURE_ONLY" type="neutral" />
          <StatusBadge label="Data Entry" value="DISABLED" type="disabled" />
          <StatusBadge label="Client Data Collection" value="DISABLED" type="disabled" />
          <StatusBadge label="Credit Bureau Connection" value="DISABLED" type="disabled" />
          <StatusBadge label="Dispute Submission" value="DISABLED" type="disabled" />
        </DashboardSection>

        {/* 2. Personal Credit Profile Fields */}
        <DashboardSection
          title="2. Personal Credit Profile Fields"
          description="Planned fields for personal credit tracking"
        >
          <FieldItem label="Full legal name" />
          <FieldItem label="Date of birth" />
          <FieldItem label="Current address" />
          <FieldItem label="Previous addresses" />
          <FieldItem label="Credit bureaus monitored" />
          <FieldItem label="Score snapshot" />
          <FieldItem label="Negative item inventory" />
          <FieldItem label="Inquiry inventory" />
          <FieldItem label="Utilization snapshot" />
          <FieldItem label="Open account inventory" />
        </DashboardSection>

        {/* 3. Business Credit Profile Fields */}
        <DashboardSection
          title="3. Business Credit Profile Fields"
          description="Planned fields for business credit tracking"
        >
          <FieldItem label="Legal business name" />
          <FieldItem label="EIN" />
          <FieldItem label="Entity type" />
          <FieldItem label="State of formation" />
          <FieldItem label="Business address" />
          <FieldItem label="D-U-N-S number" />
          <FieldItem label="Business bank account status" />
          <FieldItem label="Vendor account inventory" />
          <FieldItem label="Business tradeline inventory" />
          <FieldItem label="Funding readiness status" />
        </DashboardSection>

        {/* 4. Dispute Tracker Fields */}
        <DashboardSection
          title="4. Dispute Tracker Fields"
          description="Planned fields for dispute management"
        >
          <FieldItem label="Dispute item" />
          <FieldItem label="Bureau" />
          <FieldItem label="Reason" />
          <FieldItem label="Evidence needed" />
          <FieldItem label="Draft status" />
          <FieldItem label="Manual review status" />
          <FieldItem label="Submission status" />
          <FieldItem label="Response deadline" />
          <FieldItem label="Bureau response" />
          <FieldItem label="Follow-up action" />
        </DashboardSection>

        {/* 5. Safety Rules */}
        <DashboardSection
          title="5. Safety Rules"
          description="Constraints and prohibitions for this phase"
        >
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No real client data entry yet</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No credential fields</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No bureau login</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No automatic dispute submission</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No backend storage</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No localStorage writes</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
            <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
            <span>No file upload</span>
          </div>
        </DashboardSection>

        {/* 6. Next Allowed Action */}
        <div className="lg:col-span-2 flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build local-only dispute tracker preview.</div>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-[9px] font-mono text-muted-foreground/70">
          <p className="font-bold mb-1">About the Intake Structure</p>
          <p>This structure documents the planned fields for personal and business credit profiles, as well as dispute tracking. No actual data is collected, stored, or transmitted. This is for planning and visibility only. When intake forms are built later, they will follow this structure and include comprehensive safety gates.</p>
        </div>
      </div>
    </div>
  );
}