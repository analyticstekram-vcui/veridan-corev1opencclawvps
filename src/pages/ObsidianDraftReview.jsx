/**
 * ObsidianDraftReview
 * Review and approve Obsidian drafts before writing to vault.
 * Only approved, LOW-risk drafts can be written.
 * No execution, no OpenClaw calls, no broker/bank/bureau/credential access, no browser automation.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, ArrowLeft, FolderOpen } from 'lucide-react';
import ModuleNav from '../components/navigation/ModuleNav';
import ApprovedDraftWriteButton from '../components/obsidian-vault/ApprovedDraftWriteButton';
import BatchDraftReview from '../components/obsidian-vault/BatchDraftReview';

function DraftCard({ draft, onApprove }) {
  const [expanded, setExpanded] = useState(false);
  const isApproved = draft.approvalStatus === 'APPROVED' || draft.approvalState === 'APPROVED_DRAFT';
  const isPendingReview = draft.approvalStatus === 'PENDING_REVIEW' || draft.approvalState === 'PENDING_REVIEW';
  const isLowRisk = draft.riskLevel === 'LOW';
  const canWrite = isApproved && isLowRisk && draft.executionStatus === 'NOT_EXECUTED';
  const isManual = draft.source === 'MANUAL_LOCAL_DRAFT';

  const statusColor = isApproved ? 'text-primary' : isPendingReview ? 'text-amber-400' : 'text-slate-500';

  const handleManualApprove = () => {
    try {
      const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
      const drafts = JSON.parse(stored);
      const idx = drafts.findIndex(d => d.id === draft.id);
      if (idx >= 0) {
        drafts[idx].approvalStatus = 'APPROVED';
        drafts[idx].approvalState = 'APPROVED_DRAFT';
        drafts[idx].approvedAt = new Date().toISOString();
        localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(drafts));
      }
      if (onApprove) onApprove();
    } catch { /* ignore */ }
  };

  return (
    <div className="border border-border/40 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 p-4 bg-card hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <h3 className="text-[10px] font-bold uppercase text-slate-200 tracking-widest">{draft.filename}</h3>
            {isManual && <span className="px-1.5 py-0.5 text-[6px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm">MANUAL</span>}
          </div>
          <div className="text-[8px] text-slate-500 space-x-2 flex flex-wrap">
            <span className={`font-bold ${statusColor}`}>{draft.approvalStatus || draft.approvalState}</span>
            <span>·</span>
            <span className={isLowRisk ? 'text-primary' : 'text-amber-400'}>{draft.riskLevel} risk</span>
            <span>·</span>
            <span className="text-destructive">{draft.executionStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canWrite && <CheckCircle2 className="w-4 h-4 text-primary" />}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/10 p-4 space-y-4">
          <div className="space-y-2">
            <div className="text-[8px] font-bold uppercase text-slate-400">Details</div>
            <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-slate-400">
              <div>
                <span className="text-slate-500">type:</span> {draft.draftType}
              </div>
              <div>
                <span className="text-slate-500">folder:</span> {draft.targetFolder}
              </div>
              <div>
                <span className="text-slate-500">size:</span> {draft.content ? draft.content.length : 0} bytes
              </div>
              <div>
                <span className="text-slate-500">approval:</span> {draft.approvalStatus}
              </div>
            </div>
          </div>

          {draft.content && (
            <div className="space-y-2">
              <div className="text-[8px] font-bold uppercase text-slate-400">Preview</div>
              <div className="bg-card border border-border/30 rounded-sm p-2.5 max-h-48 overflow-auto">
                <pre className="text-[7px] font-mono text-slate-400 whitespace-pre-wrap break-words">
                  {draft.content.slice(0, 500)}
                  {draft.content.length > 500 && '...'}
                </pre>
              </div>
            </div>
          )}

          {/* Manual draft approval button */}
          {isPendingReview && isManual && (
            <div>
              <div className="text-[7px] font-mono text-amber-400 mb-2">
                source: {draft.source} · awaiting operator approval
              </div>
              <button
                type="button"
                onClick={handleManualApprove}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Draft
              </button>
            </div>
          )}

          {/* Write button for approved drafts */}
          {canWrite && (
            <div>
              <ApprovedDraftWriteButton draft={draft} onSuccess={onApprove} />
              <div className="mt-2">
                <Link
                  to="/vault-file-index"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-mono font-bold border border-border/40 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 rounded-sm transition-colors"
                >
                  <FolderOpen className="w-3 h-3" /> Open in Index
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftLoadingState() {
  return (
    <div className="border border-border/40 rounded-sm p-6 text-center space-y-3">
      <FileText className="w-8 h-8 text-slate-500 mx-auto" />
      <div className="text-[10px] font-mono text-slate-400">
        No drafts in queue. Create an Obsidian task plan to generate drafts.
      </div>
      <Link
        to="/obsidian-workbench-preview"
        className="inline-flex items-center gap-1.5 text-[8px] font-bold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-sm transition-colors"
      >
        Go to Obsidian Workbench →
      </Link>
    </div>
  );
}

export default function ObsidianDraftReview() {
  const [drafts, setDrafts] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
      const loaded = JSON.parse(stored);
      setDrafts(loaded);
      setApprovedCount(loaded.filter(d => d.approvalStatus === 'APPROVED').length);
    } catch { /* ignore */ }
  };

  const handleApprove = () => {
    loadDrafts();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/obsidian-workbench-preview"
              className="inline-flex items-center gap-1 text-[7px] text-slate-500 hover:text-slate-300 mb-2 transition-colors"
            >
              <ArrowLeft className="w-2.5 h-2.5" /> Back to Obsidian Workbench
            </Link>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Knowledge Management
            </div>
            <h1 className="text-lg font-bold text-foreground">Obsidian Draft Review</h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Review and approve drafts before writing to vault
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Link
              to="/vault-file-index"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-mono font-bold border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors"
            >
              <FolderOpen className="w-3 h-3" /> Open in Index
            </Link>
            <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold uppercase rounded-sm">
              {drafts.length} drafts
            </span>
            <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold uppercase rounded-sm">
              {approvedCount} approved
            </span>
            <span className="px-2 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-[8px] font-bold uppercase rounded-sm">
              NO_EXECUTION
            </span>
          </div>
        </div>
      </div>

      {/* Safety banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-2 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide">
          APPROVED DRAFTS ONLY — LOW RISK · NOT EXECUTED · ALLOWLISTED FOLDERS ONLY
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5">

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border/40 rounded-sm p-4">
            <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Total Drafts</div>
            <div className="text-2xl font-mono font-bold text-slate-200">{drafts.length}</div>
          </div>
          <div className="bg-card border border-border/40 rounded-sm p-4">
            <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Approved</div>
            <div className="text-2xl font-mono font-bold text-primary">{approvedCount}</div>
          </div>
          <div className="bg-card border border-border/40 rounded-sm p-4">
            <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Ready to Write</div>
            <div className="text-2xl font-mono font-bold text-primary">
              {drafts.filter(d => d.approvalStatus === 'APPROVED' && d.riskLevel === 'LOW' && d.executionStatus === 'NOT_EXECUTED').length}
            </div>
          </div>
        </div>

        {/* ── Batch Review Section ── */}
        <BatchDraftReview />

        {/* Drafts list or empty state */}
        <div>
          <div className="text-[9px] uppercase font-bold text-slate-400 mb-3 tracking-widest">Individual Draft Queue</div>
          {drafts.length === 0 ? (
            <DraftLoadingState />
          ) : (
            <div className="space-y-3">
              {drafts.map((draft, i) => (
                <DraftCard key={draft.id || i} draft={draft} onApprove={handleApprove} />
              ))}
            </div>
          )}
        </div>

        {/* Safety boundaries */}
        <div className="border border-border/40 rounded-sm p-4 space-y-3 bg-secondary/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-[9px] font-bold uppercase text-amber-400">Safety Boundaries</div>
          </div>
          <div className="text-[8px] text-slate-400 space-y-1 font-mono">
            <div>✓ Only APPROVED drafts can be written</div>
            <div>✓ Only LOW risk drafts are allowed</div>
            <div>✓ Only allowlisted vault folders: drafts, task-plans, approval-queues, audit-logs, governance, evidence</div>
            <div>✓ Path traversal and hidden files blocked</div>
            <div>✗ Broker, bank, bureau integrations: DISABLED</div>
            <div>✗ Credential storage: DISABLED</div>
            <div>✗ Browser automation: DISABLED</div>
            <div>✗ Live execution: DISABLED</div>
          </div>
        </div>

      </div>
    </div>
  );
}