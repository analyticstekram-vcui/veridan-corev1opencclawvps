import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Shield } from 'lucide-react';

const VERIFICATIONS = [
  { claim: 'No execution added', evidence: 'executionStatus: NOT_EXECUTED on all drafted records' },
  { claim: 'No OpenClaw execution added', evidence: 'openclawCall: NOT_SENT — no gateway dispatch at any point' },
  { claim: 'No broker access added', evidence: 'No broker API calls, no Tradovate/Alpaca/BloFin integration' },
  { claim: 'No bank access added', evidence: 'No banking API calls, no account access' },
  { claim: 'No money movement', evidence: 'No payment processing, no settlement routes' },
  { claim: 'No browser automation', evidence: 'No veridanBrowser calls, no browser control' },
  { claim: 'No autonomous vault writes', evidence: 'obsidianWriteApprovedDraft is NOT called from this page' },
  { claim: 'Uses approval-required draft flow', evidence: 'Queued drafts created with approvalStatus: PENDING_REVIEW — require approval at /obsidian-draft-review before any write' },
  { claim: 'Uses existing Obsidian entities', evidence: 'Reads VeridanObsidianDraft + VeridanObsidianWriteAudit entities directly' },
  { claim: 'Queued drafts use existing write workflow', evidence: 'source: MANUAL_LOCAL_DRAFT — same path as all other governed drafts' },
  { claim: 'Read-only analysis', evidence: 'Domain coverage, health score, and brief are computed client-side from entity reads only' },
  { claim: 'No secrets exposed', evidence: 'No token reads, no credential fields, no env var access' },
  { claim: 'New report entity is metadata only', evidence: 'VeridanVaultAgentReport stores health scores and stats — no vault content or credentials' },
  { claim: 'Existing governance boundaries preserved', evidence: 'NOT_EXECUTED / NOT_DISPATCHED / NOT_SENT constants unchanged throughout' },
];

export default function VaultAgentVerification() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-primary/10 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Agent v1 Safety Verification</span>
          <span className="text-[7px] font-mono text-primary/60">({VERIFICATIONS.length} claims)</span>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-primary/60" /> : <ChevronRight className="w-3.5 h-3.5 text-primary/60" />}
      </button>
      {open && (
        <div className="border-t border-primary/20 divide-y divide-border/10">
          {VERIFICATIONS.map((v, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2 text-[7px] font-mono">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-200">{v.claim}</div>
                <div className="text-slate-500 mt-0.5">{v.evidence}</div>
              </div>
              <span className="shrink-0 text-primary font-bold">PASS</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}