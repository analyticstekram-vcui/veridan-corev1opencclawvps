/**
 * BusinessOperationsIntakeStructure
 * Read-only structure showing planned business operations intake fields.
 * Not a real intake form. No data collection, no storage.
 *
 * Does NOT:
 *   - Collect client data
 *   - Process payments
 *   - Connect to banks
 *   - Submit tax/legal documents
 *   - Execute automation
 *   - Call APIs
 *   - Write localStorage
 *   - Use timers
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

function FieldGroup({ title, fields }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] font-mono font-bold text-foreground uppercase mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((field, idx) => (
          <div key={idx} className="px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm">
            <div className="text-[8px] font-mono text-muted-foreground/70">{field}</div>
          </div>
        ))}
      </div>
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

export default function BusinessOperationsIntakeStructure() {
  const entityFields = [
    'Business name',
    'Entity type',
    'State of formation',
    'EIN status',
    'Operating role',
    'Revenue model',
    'Bank account status',
    'Compliance status',
    'Owner / manager role',
    'AI operator scope',
  ];

  const revenueFields = [
    'Revenue stream',
    'Business unit',
    'Monthly target',
    'Current monthly revenue',
    'Payment processor status',
    'Invoice status',
    'Expense category',
    'Profit margin estimate',
    'Tax reserve estimate',
    'Reinvestment priority',
  ];

  const operationsTaskFields = [
    'Task title',
    'Business unit',
    'Priority',
    'Status',
    'Due date',
    'Owner',
    'Dependency',
    'Compliance impact',
    'Revenue impact',
    'AI operator note',
  ];

  return (
    <div className="mt-12 pt-12 border-t border-border/40">
      <div className="mb-6">
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2">Business Operations Intake Structure</h2>
        <p className="text-[13px] font-mono text-muted-foreground/70">
          Read-only structure showing planned business operations data fields
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1. Intake Mode */}
        <DashboardSection
          title="1. Intake Mode"
          description="Current status of business operations intake functionality"
        >
          <div className="space-y-2">
            <StatusBadge label="Intake Mode" value="STRUCTURE_ONLY" type="neutral" />
            <StatusBadge label="Data Entry" value="DISABLED" type="disabled" />
            <StatusBadge label="Client Data Collection" value="DISABLED" type="disabled" />
            <StatusBadge label="Payment Collection" value="DISABLED" type="disabled" />
            <StatusBadge label="Bank Connection" value="DISABLED" type="disabled" />
            <StatusBadge label="Automation Execution" value="DISABLED" type="disabled" />
          </div>
        </DashboardSection>

        {/* 2. Entity / Business Fields */}
        <DashboardSection
          title="2. Entity / Business Fields"
          description="Planned fields for business entity and operational information"
        >
          <FieldGroup title="When Enabled:" fields={entityFields} />
          <div className="mt-3 text-[9px] font-mono text-muted-foreground/60">
            <p>
              <strong>Note:</strong> These fields define the structure for tracking business entity metadata, compliance status, and operational roles. No data entry is enabled at this phase.
            </p>
          </div>
        </DashboardSection>

        {/* 3. Revenue Tracking Fields */}
        <DashboardSection
          title="3. Revenue Tracking Fields"
          description="Planned fields for revenue monitoring across business units"
        >
          <FieldGroup title="When Enabled:" fields={revenueFields} />
          <div className="mt-3 text-[9px] font-mono text-muted-foreground/60">
            <p>
              <strong>Note:</strong> These fields enable tracking of revenue streams, financial targets, and profit estimation. Payment processing and bank connections are not enabled yet.
            </p>
          </div>
        </DashboardSection>

        {/* 4. Operations Task Fields */}
        <DashboardSection
          title="4. Operations Task Fields"
          description="Planned fields for business operations task management and tracking"
        >
          <FieldGroup title="When Enabled:" fields={operationsTaskFields} />
          <div className="mt-3 text-[9px] font-mono text-muted-foreground/60">
            <p>
              <strong>Note:</strong> These fields support operational planning, dependency management, and AI operator coordination. No automated outreach or legal/tax filing is enabled yet.
            </p>
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
              <span>No real client data entry yet</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No payment information</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No bank credentials</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No legal filing submission</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No tax filing</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No automated outreach</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No backend storage</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No localStorage writes</span>
            </div>
          </div>
        </DashboardSection>

        {/* 6. Next Allowed Action */}
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build local-only business task tracker preview.</div>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-[9px] font-mono text-muted-foreground/70">
          <p className="font-bold mb-1">About the Intake Structure</p>
          <p>This structure defines the planned data fields and information categories for business operations intake. No data entry, payment processing, bank connections, or legal/tax filing are enabled at this phase. This is a read-only roadmap for understanding what will eventually be tracked when the full intake system is built.</p>
        </div>
      </div>
    </div>
  );
}