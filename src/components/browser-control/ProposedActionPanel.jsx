import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, Lock, Clock } from 'lucide-react';

const COMMAND_TYPES = [
  { id: 'CLICK_ELEMENT',       label: 'Click Element' },
  { id: 'TYPE_INTO_ELEMENT',   label: 'Type Into Element' },
  { id: 'READ_ELEMENT_TEXT',   label: 'Read Element Text' },
];

function FieldCard({ label, value, mono = false }) {
  return (
    <div className="bg-secondary/30 border border-border px-3 py-2">
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">{label}</div>
      <div className={`text-[11px] ${mono ? 'font-mono' : ''} text-foreground break-all`}>{value || '—'}</div>
    </div>
  );
}

export default function ProposedActionPanel({ selectedElement, targetUrl, onSaveProposal, onClear }) {
  const [commandType, setCommandType] = useState('CLICK_ELEMENT');

  if (!selectedElement) return null;

  const proposal = {
    proposalId:       'draft_' + Date.now(),
    commandType,
    selector:         selectedElement.selector || '—',
    elementText:      selectedElement.text || '—',
    tag:              selectedElement.tag || selectedElement.type || '—',
    href:             selectedElement.href || null,
    targetUrl:        targetUrl || '—',
    riskTier:         'LOW',
    governanceMode:   'SAFE_REQUIRES_APPROVAL',
    requiresApproval: true,
    status:           'DRAFT',
    source:           'BROWSER_SESSION',
    executionAllowed: false,
    createdAt:        new Date().toISOString(),
  };

  const handleSave = () => {
    onSaveProposal(proposal);
  };

  return (
    <div className="bg-card border border-accent/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] uppercase tracking-widest text-accent font-semibold">Proposed Action (Draft)</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1 border border-border text-[9px] text-muted-foreground uppercase tracking-wider hover:bg-secondary/50 transition-colors"
        >
          <X className="w-2.5 h-2.5" /> Clear
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Command Type Selection */}
        <div>
          <label className="text-[8px] uppercase tracking-widest text-muted-foreground/40 block mb-2">Command Type</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMAND_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCommandType(id)}
                className={`px-2.5 py-1 border text-[9px] uppercase tracking-wider transition-colors font-semibold ${
                  commandType === id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          <FieldCard label="Proposal ID" value={proposal.proposalId} mono />
          <FieldCard label="Status" value={proposal.status} />
          <FieldCard label="Command Type" value={proposal.commandType} />
          <FieldCard label="Risk Tier" value={proposal.riskTier} />
          <FieldCard label="Governance Mode" value={proposal.governanceMode} />
          <FieldCard label="Requires Approval" value={String(proposal.requiresApproval)} />
          <FieldCard label="Element Tag" value={proposal.elementTag} />
          <FieldCard label="Element Text" value={proposal.elementText.slice(0, 60)} />
          <div className="col-span-2">
            <FieldCard label="Selector" value={proposal.selector} mono />
          </div>
          <div className="col-span-2">
            <FieldCard label="Target URL" value={proposal.targetUrl} mono />
          </div>
          <div className="col-span-2">
            <FieldCard label="Created At" value={proposal.createdAt} mono />
          </div>
        </div>

        {/* Approval Warning */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-500/80 leading-relaxed">
            Proposal only. No browser action will execute until backend approval routing is added.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-accent/50 bg-accent/10 text-[9px] text-accent uppercase tracking-wider font-semibold hover:bg-accent/20 transition-colors"
          >
            <Clock className="w-3 h-3" /> Save Proposal
          </button>
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-primary/20 bg-primary/5 text-[9px] text-primary uppercase tracking-wider font-semibold opacity-40 cursor-not-allowed"
          >
            <CheckCircle2 className="w-3 h-3" /> Approve
          </button>
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-destructive/20 bg-destructive/5 text-[9px] text-destructive uppercase tracking-wider font-semibold opacity-40 cursor-not-allowed"
          >
            <X className="w-3 h-3" /> Deny
          </button>
        </div>

        {/* Info notice */}
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border border-border/30">
          <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Approve/Deny buttons coming soon
          </span>
        </div>
      </div>
    </div>
  );
}