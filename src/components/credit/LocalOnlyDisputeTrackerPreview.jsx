/**
 * LocalOnlyDisputeTrackerPreview
 * Read-only preview of planned dispute tracker workflow.
 * Sample/placeholder data only. No real data, no storage, no submission.
 *
 * Does NOT:
 *   - Collect client data
 *   - Store data
 *   - Submit disputes
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

const sampleDisputes = [
  {
    itemId: 'SAMPLE-001',
    bureau: 'Experian',
    accountType: 'Collection',
    issueCategory: 'Validate ownership',
    evidenceNeeded: 'Proof of identity needed',
    draftStatus: 'Draft only',
    reviewStatus: 'Not reviewed',
    submissionStatus: 'Not submitted',
    deadline: 'Not scheduled',
    followUp: 'Gather evidence',
  },
  {
    itemId: 'SAMPLE-002',
    bureau: 'Equifax',
    accountType: 'Late Payment',
    issueCategory: 'Verify reporting accuracy',
    evidenceNeeded: 'Payment history needed',
    draftStatus: 'Draft only',
    reviewStatus: 'Not reviewed',
    submissionStatus: 'Not submitted',
    deadline: 'Not scheduled',
    followUp: 'Review account history',
  },
  {
    itemId: 'SAMPLE-003',
    bureau: 'TransUnion',
    accountType: 'Inquiry',
    issueCategory: 'Verify permissible purpose',
    evidenceNeeded: 'Inquiry letter needed',
    draftStatus: 'Draft only',
    reviewStatus: 'Not reviewed',
    submissionStatus: 'Not submitted',
    deadline: 'Not scheduled',
    followUp: 'Prepare draft letter',
  },
];

export default function LocalOnlyDisputeTrackerPreview() {
  return (
    <div className="mt-8 pt-8 border-t border-border/40">
      <div className="mb-6">
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2">Local-Only Dispute Tracker Preview</h2>
        <p className="text-[13px] font-mono text-muted-foreground/70">
          Read-only preview of planned dispute workflow using sample data only
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1. Tracker Mode */}
        <DashboardSection
          title="1. Tracker Mode"
          description="Current status of dispute tracker functionality"
        >
          <div className="space-y-2">
            <StatusBadge label="Tracker Mode" value="PREVIEW_ONLY" type="neutral" />
            <StatusBadge label="Real Client Data" value="DISABLED" type="disabled" />
            <StatusBadge label="Bureau Submission" value="DISABLED" type="disabled" />
            <StatusBadge label="Backend Storage" value="DISABLED" type="disabled" />
            <StatusBadge label="Evidence Upload" value="DISABLED" type="disabled" />
          </div>
        </DashboardSection>

        {/* 2. Sample Dispute Workflow */}
        <DashboardSection
          title="2. Sample Dispute Workflow"
          description="Placeholder rows showing planned columns and workflow"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[8px] font-mono">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Item ID</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Bureau</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Account / Item</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Issue Category</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Evidence</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Draft</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Review</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Submission</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Deadline</th>
                  <th className="text-left px-2 py-2 text-muted-foreground/70 font-bold">Follow-Up</th>
                </tr>
              </thead>
              <tbody>
                {sampleDisputes.map((dispute, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.itemId}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.bureau}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.accountType}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.issueCategory}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.evidenceNeeded}</td>
                    <td className="text-left px-2 py-2 text-amber-500">{dispute.draftStatus}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.reviewStatus}</td>
                    <td className="text-left px-2 py-2 text-destructive/70">{dispute.submissionStatus}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.deadline}</td>
                    <td className="text-left px-2 py-2 text-slate-400">{dispute.followUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[9px] font-mono text-muted-foreground/60">
            <p>
              <strong>Sample data only:</strong> These are placeholder rows showing the planned dispute workflow structure. No real client data is displayed.
            </p>
          </div>
        </DashboardSection>

        {/* 3. Workflow Rules */}
        <DashboardSection
          title="3. Workflow Rules"
          description="Constraints and procedures for dispute management"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Draft disputes only</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Evidence required before review</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Manual approval required before future submission</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Bureau response tracking later</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No automatic dispute submission</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/80 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>No client data stored in this preview</span>
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
              <span>No real names</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No SSNs</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No DOBs</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No addresses</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No account numbers</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No document uploads</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No bureau logins</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 py-1.5">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <span>No submission buttons</span>
            </div>
          </div>
        </DashboardSection>

        {/* 5. Next Allowed Action */}
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Next Allowed Action</div>
            <div className="text-[10px] font-mono text-amber-500 font-bold leading-snug">Build dispute tracker contract before enabling local draft creation.</div>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-[9px] font-mono text-muted-foreground/70">
          <p className="font-bold mb-1">About the Dispute Tracker Preview</p>
          <p>This preview shows the planned structure of the dispute tracking workflow using sample/placeholder data only. No real client data is stored, displayed, or transmitted. This is a read-only visualization for planning purposes. When the actual dispute tracker is built, it will include comprehensive safety gates, manual review requirements, and evidence management before any future bureau submission.</p>
        </div>
      </div>
    </div>
  );
}