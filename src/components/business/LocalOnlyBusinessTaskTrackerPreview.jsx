/**
 * LocalOnlyBusinessTaskTrackerPreview
 * Read-only preview of planned business task tracker workflow.
 * Sample/placeholder data only. No real data, no storage, no execution.
 *
 * Does NOT:
 *   - Collect client data
 *   - Store task data
 *   - Execute tasks
 *   - Assign tasks automatically
 *   - Call payment APIs
 *   - Call credit bureaus
 *   - Call backends
 *   - Accept file uploads
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

const sampleTasks = [
  {
    taskId: 'TASK-001',
    businessUnit: 'Tekram Analytics',
    taskTitle: 'Define trading signal offer',
    priority: 'High',
    status: 'Planning',
    dueWindow: 'This week',
    dependency: 'Strategy rules',
    revenueImpact: 'Medium',
    complianceImpact: 'Low',
    operatorNote: 'Draft offer structure',
  },
  {
    taskId: 'TASK-002',
    businessUnit: 'Credit Repair Operation',
    taskTitle: 'Map dispute workflow',
    priority: 'High',
    status: 'Planning',
    dueWindow: 'This week',
    dependency: 'Credit rules',
    revenueImpact: 'Medium',
    complianceImpact: 'Medium',
    operatorNote: 'Keep manual review required',
  },
  {
    taskId: 'TASK-003',
    businessUnit: 'Tradeline Vendor Operation',
    taskTitle: 'Define vendor package',
    priority: 'Medium',
    status: 'Planning',
    dueWindow: 'Next week',
    dependency: 'Compliance notes',
    revenueImpact: 'High',
    complianceImpact: 'Medium',
    operatorNote: 'No client intake yet',
  },
  {
    taskId: 'TASK-004',
    businessUnit: 'Wyoming Agent Affiliate Operation',
    taskTitle: 'Map affiliate funnel',
    priority: 'Medium',
    status: 'Planning',
    dueWindow: 'Next week',
    dependency: 'Partner terms',
    revenueImpact: 'Medium',
    complianceImpact: 'Low',
    operatorNote: 'No payment collection yet',
  },
];

export default function LocalOnlyBusinessTaskTrackerPreview() {
  return (
    <div className="mt-8 pt-8 border-t border-border/40">
      <div className="mb-6">
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2">Local-Only Business Task Tracker Preview</h2>
        <p className="text-[13px] font-mono text-muted-foreground/70">
          Read-only preview of planned business operations task workflow using sample data only
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1. Tracker Mode */}
        <DashboardSection
          title="1. Tracker Mode"
          description="Current status of business task tracker functionality"
        >
          <div className="space-y-2">
            <StatusBadge label="Tracker Mode" value="PREVIEW_ONLY" type="neutral" />
            <StatusBadge label="Real Business Data" value="DISABLED" type="disabled" />
            <StatusBadge label="Client Data" value="DISABLED" type="disabled" />
            <StatusBadge label="Backend Storage" value="DISABLED" type="disabled" />
            <StatusBadge label="Automation Execution" value="DISABLED" type="disabled" />
            <StatusBadge label="Payment Actions" value="DISABLED" type="disabled" />
          </div>
        </DashboardSection>

        {/* 2. Sample Task Workflow */}
        <DashboardSection
          title="2. Sample Task Workflow"
          description="Placeholder rows showing planned columns and task structure"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[8px] font-mono">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Task ID</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Business Unit</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Task Title</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Priority</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Status</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Due</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Dependency</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Revenue</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Compliance</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">AI Note</th>
                </tr>
              </thead>
              <tbody>
                {sampleTasks.map((task, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="text-left px-2 py-2 text-slate-400">{task.taskId}</td>
                    <td className="text-left px-2 py-2 text-slate-400 text-[7px]">{task.businessUnit}</td>
                    <td className="text-left px-2 py-2 text-slate-400 text-[7px]">{task.taskTitle}</td>
                    <td className="text-left px-2 py-2 text-amber-500">{task.priority}</td>
                    <td className="text-left px-2 py-2 text-amber-500">{task.status}</td>
                    <td className="text-left px-2 py-2 text-slate-400 text-[7px]">{task.dueWindow}</td>
                    <td className="text-left px-2 py-2 text-slate-400 text-[7px]">{task.dependency}</td>
                    <td className="text-left px-2 py-2 text-primary">{task.revenueImpact}</td>
                    <td className="text-left px-2 py-2 text-primary">{task.complianceImpact}</td>
                    <td className="text-left px-2 py-2 text-slate-400 text-[7px]">{task.operatorNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[9px] font-mono text-muted-foreground/60">
            <p>
              <strong>Sample data only:</strong> These are placeholder rows showing the planned business task workflow structure. No real business data is displayed.
            </p>
          </div>
        </DashboardSection>

        {/* 3. Workflow Rules */}
        <DashboardSection
          title="3. Workflow Rules"
          description="Constraints and procedures for business task management"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Planning tasks only</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No automatic assignment</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No automated outreach</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No payment actions</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No client data collection</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No legal/tax filing actions</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Manual operator review required before future execution</span>
            </div>
          </div>
        </DashboardSection>

        {/* 4. Safety Rules */}
        <DashboardSection
          title="4. Safety Rules"
          description="Prohibitions and constraints for this phase"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No real client names</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No payment info</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No bank details</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No credentials</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No legal filings</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No tax submissions</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No outbound messages</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No automation execution</span>
            </div>
          </div>
        </DashboardSection>

        {/* 5. Next Allowed Action */}
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build business operations task tracker contract before enabling local task creation.</div>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-[9px] font-mono text-muted-foreground/70">
          <p className="font-bold mb-1">About the Business Task Tracker Preview</p>
          <p>This preview shows the planned structure of the business operations task tracking system using sample/placeholder data only. No real business data is stored, displayed, or transmitted. This is a read-only visualization for planning purposes. When the actual task tracker is built, it will include comprehensive safety gates, manual operator approval, and compliance tracking before any future automated execution.</p>
        </div>
      </div>
    </div>
  );
}