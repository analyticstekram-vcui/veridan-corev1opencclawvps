import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Shield, Zap } from 'lucide-react';
import { format } from 'date-fns';

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'READY_TO_EXECUTE', 'EXECUTED', 'BLOCKED', 'FAILED'];

const stageBadgeConfig = {
  DRAFT: { color: 'bg-secondary/10 border-border text-muted-foreground', label: 'Draft' },
  PENDING_APPROVAL: { color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Pending Review' },
  APPROVED: { color: 'bg-primary/10 border-primary/30 text-primary', label: 'Approved' },
  DENIED: { color: 'bg-destructive/10 border-destructive/30 text-destructive', label: 'Denied' },
  READY_TO_EXECUTE: { color: 'bg-primary/10 border-primary/30 text-primary', label: 'Ready' },
  EXECUTED: { color: 'bg-primary/10 border-primary/30 text-primary', label: 'Executed' },
  BLOCKED: { color: 'bg-destructive/10 border-destructive/30 text-destructive', label: 'Blocked' },
  FAILED: { color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Failed' },
};

const stageIcons = {
  1: { icon: CheckCircle2, label: 'Proposal Created', color: 'text-primary' },
  2: { icon: Shield, label: 'Governance Review', color: 'text-primary' },
  3: { icon: CheckCircle2, label: 'Command Created', color: 'text-primary' },
  4: { icon: Zap, label: 'Read-Only Bridge', color: 'text-primary' },
  5: { icon: Clock, label: 'Audit Recorded', color: 'text-primary' },
};

function WorkflowCard({ proposal, command, index }) {
  const [expanded, setExpanded] = useState(false);

  // Determine overall workflow status
  const getWorkflowStatus = () => {
    if (command?.status === 'blocked') return 'BLOCKED';
    if (command?.status === 'failed') return 'FAILED';
    if (command?.status === 'executed') return 'EXECUTED';
    if (command?.status === 'approved') return 'READY_TO_EXECUTE';
    if (proposal?.status === 'APPROVED') return 'APPROVED';
    if (proposal?.status === 'REVIEW') return 'PENDING_APPROVAL';
    if (proposal?.status === 'DENIED') return 'DENIED';
    return proposal?.status || 'DRAFT';
  };

  const workflowStatus = getWorkflowStatus();
  const statusCfg = stageBadgeConfig[workflowStatus] || stageBadgeConfig.DRAFT;

  const isReadOnly = command?.commandType && ['system.status', 'logs.fetch', 'session.list'].includes(command.commandType);
  const blockReason = command?.error || null;
  const auditTraceId = command?.readOnlyBridgeTraceId || command?.id?.slice(0, 12) || '—';

  // Determine which stages are complete
  const stageComplete = {
    1: !!proposal,
    2: proposal?.status === 'APPROVED' || proposal?.status === 'DENIED' || proposal?.reviewedBy,
    3: !!command,
    4: command?.status === 'executed' || command?.status === 'blocked',
    5: command?.executedAt,
  };

  return (
    <div key={index} className="bg-secondary/20 border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="cursor-pointer hover:bg-secondary/30 transition-colors px-4 py-3 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
          
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground truncate">
              {command?.commandType || proposal?.proposalId || 'Workflow'}
            </div>
            <div className="text-[9px] text-muted-foreground/60 mt-0.5">
              Proposal: {proposal?.proposalId?.slice(0, 12) || '—'} · Command: {command?.commandId?.slice(0, 12) || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isReadOnly && (
            <span className="text-[8px] px-1.5 py-0.5 border border-primary/30 text-primary bg-primary/5 rounded">
              READ_ONLY
            </span>
          )}
          <span className={`text-[9px] px-2 py-0.5 border rounded ${statusCfg.color}`}>
            {statusCfg.label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/10 px-4 py-4 space-y-4">
          {/* Workflow stages */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-3">Workflow Stages</div>
            <div className="space-y-2">
              {Object.entries(stageIcons).map(([stageNum, stageInfo]) => {
                const Icon = stageInfo.icon;
                const isComplete = stageComplete[stageNum];
                return (
                  <div key={stageNum} className="flex items-center gap-3">
                    <Icon className={`w-3 h-3 shrink-0 ${isComplete ? stageInfo.color : 'text-muted-foreground/30'}`} />
                    <div className={`text-[10px] ${isComplete ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {stageInfo.label}
                    </div>
                    {isComplete && <div className="text-[8px] text-primary ml-auto">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block reason if blocked */}
          {blockReason && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/5 border border-destructive/20 rounded">
              <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[9px] uppercase tracking-wider text-destructive/60 mb-0.5">Block Reason</div>
                <div className="text-[10px] text-destructive/80 font-mono break-all">{blockReason}</div>
              </div>
            </div>
          )}

          {/* Proposal details */}
          {proposal && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Proposal Details</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Proposal ID</div>
                  <div className="text-foreground font-mono text-[9px] truncate">{proposal.proposalId}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Status</div>
                  <div className="text-foreground font-mono text-[9px]">{proposal.status}</div>
                </div>
                {proposal.createdBy && (
                  <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Created By</div>
                    <div className="text-foreground text-[9px]">{proposal.createdBy}</div>
                  </div>
                )}
                {proposal.reviewedBy && (
                  <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Reviewed By</div>
                    <div className="text-foreground text-[9px]">{proposal.reviewedBy}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Command details */}
          {command && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Command Details</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Command ID</div>
                  <div className="text-foreground font-mono text-[9px] truncate">{command.commandId}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Command Type</div>
                  <div className="text-blue-400 font-mono text-[9px]">{command.commandType}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Risk Tier</div>
                  <div className={`font-mono text-[9px] ${command.riskLevel === 'low' ? 'text-primary' : 'text-amber-500'}`}>
                    {command.riskLevel?.toUpperCase() || '—'}
                  </div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Governance Mode</div>
                  <div className="text-foreground font-mono text-[9px]">{command.governanceMode || 'SAFE_REQUIRES_APPROVAL'}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Execution Mode</div>
                  <div className="text-foreground font-mono text-[9px]">{command.executionMode || 'SIMULATED'}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Command Status</div>
                  <div className="text-foreground font-mono text-[9px]">{command.status}</div>
                </div>
                {command.targetUrl && (
                  <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Target URL</div>
                    <div className="text-blue-400 font-mono text-[9px] break-all">{command.targetUrl}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Timeline</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {proposal?.created_date && (
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Proposal Created</div>
                  <div className="text-foreground font-mono text-[9px]">{format(new Date(proposal.created_date), 'HH:mm:ss')}</div>
                </div>
              )}
              {command?.approvedAt && (
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Approved At</div>
                  <div className="text-foreground font-mono text-[9px]">{format(new Date(command.approvedAt), 'HH:mm:ss')}</div>
                </div>
              )}
              {command?.executedAt && (
                <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Executed At</div>
                  <div className="text-foreground font-mono text-[9px]">{format(new Date(command.executedAt), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Audit trace and response */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Audit Trace ID</div>
              <div className="text-muted-foreground/60 font-mono text-[9px] truncate">{auditTraceId}</div>
            </div>
          </div>

          {/* Response payload */}
          {command?.result && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Response Payload</div>
              <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                <pre className="text-[8px] font-mono text-muted-foreground/70 whitespace-pre-wrap break-words max-h-32 overflow-auto">
                  {JSON.stringify(command.result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Full JSON */}
          <details className="text-[9px]">
            <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-widest text-[8px]">
              Full Workflow JSON
            </summary>
            <pre className="mt-2 bg-secondary/30 border border-border/30 px-2 py-1.5 overflow-auto max-h-48 text-muted-foreground/60 font-mono text-[8px] leading-tight rounded">
              {JSON.stringify({ proposal, command }, null, 2)}
            </pre>
          </details>

          {/* Read-only notice */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
            <Shield className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[9px] text-primary/80">Read-only audit view. No modifications allowed.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommandApprovalWorkflowPanel() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      try {
        const [proposals, commands] = await Promise.all([
          base44.entities.OpenClawProposal.list('-created_date', 100),
          base44.entities.OpenClawCommand.list('-created_date', 100),
        ]);

        // Build workflows by matching proposals to commands
        const workflowMap = new Map();
        proposals.forEach(p => {
          if (p.proposalId) {
            const existing = workflowMap.get(p.proposalId) || {};
            workflowMap.set(p.proposalId, { ...existing, proposal: p });
          }
        });

        commands.forEach(c => {
          if (c.commandId) {
            const existing = workflowMap.get(c.commandId) || {};
            workflowMap.set(c.commandId, { ...existing, command: c });
          }
        });

        // Also include commands that might reference proposals
        commands.forEach(c => {
          const relatedProposal = proposals.find(p => p.proposalId === c.proposalId || p.convertedWorkflowId === c.commandId);
          if (relatedProposal && c.commandId) {
            workflowMap.set(c.commandId, { proposal: relatedProposal, command: c });
          }
        });

        setWorkflows(Array.from(workflowMap.values()).reverse());
      } catch (err) {
        console.error('Failed to fetch workflows:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, []);

  const getWorkflowStatus = (workflow) => {
    const { command, proposal } = workflow;
    if (command?.status === 'blocked') return 'BLOCKED';
    if (command?.status === 'failed') return 'FAILED';
    if (command?.status === 'executed') return 'EXECUTED';
    if (command?.status === 'approved') return 'READY_TO_EXECUTE';
    if (proposal?.status === 'APPROVED') return 'APPROVED';
    if (proposal?.status === 'REVIEW' || proposal?.status === 'MULTISIG_PENDING') return 'PENDING';
    if (proposal?.status === 'DENIED') return 'FAILED';
    return 'PENDING';
  };

  const filtered = workflows.filter(w => {
    const status = getWorkflowStatus(w);
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return status === 'PENDING';
    if (filter === 'APPROVED') return status === 'APPROVED';
    if (filter === 'READY_TO_EXECUTE') return status === 'READY_TO_EXECUTE';
    if (filter === 'EXECUTED') return status === 'EXECUTED';
    if (filter === 'BLOCKED') return status === 'BLOCKED';
    if (filter === 'FAILED') return status === 'FAILED';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Command Approval Workflow</div>
          <div className="text-[13px] font-semibold text-foreground">Full Lifecycle: Proposal → Review → Command → Execution → Audit</div>
        </div>
        <span className="text-[9px] text-muted-foreground/30">{filtered.length} shown</span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 text-[9px] border rounded whitespace-nowrap transition-colors ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Workflows */}
      <div className="space-y-3">
        {loading ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">Loading workflows...</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">No {filter.toLowerCase()} workflows found</div>
        ) : (
          filtered.map((workflow, idx) => <WorkflowCard key={idx} proposal={workflow.proposal} command={workflow.command} index={idx} />)
        )}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
          <Shield className="w-3 h-3 shrink-0" />
          Read-only audit view. No governance bypass. Execution buttons only for approved LOW risk SIMULATED read-only commands.
        </div>
      )}
    </div>
  );
}