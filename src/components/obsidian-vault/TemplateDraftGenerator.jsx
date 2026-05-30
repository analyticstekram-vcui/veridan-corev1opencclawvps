/**
 * TemplateDraftGenerator
 * Generates structured markdown drafts from local templates — NO API, NO OpenClaw dispatch.
 * All drafts go to veridan_obsidian_drafts with PENDING_REVIEW / NOT_EXECUTED / NOT_DISPATCHED.
 * Operator must approve in Draft Review before any vault write.
 */

import React, { useState } from 'react';
import { FileText, Layers, CheckCircle2 } from 'lucide-react';

// ── Allowlisted target folders ──────────────────────────────────────────────
const ALLOWLISTED_FOLDERS = [
  'Veridan Core/Veridan Core System',
  'Veridan Core/OpenClaw',
  'Veridan Core/Trading',
  'Veridan Core/Credit',
  'Veridan Core/Business Formation',
  'Veridan Core/Trust / Entities',
  'Veridan Core/SOPs',
  'Veridan Core/Daily Operations',
];

// ── Template registry ────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'openclaw_sop',
    label: 'OpenClaw SOP',
    folder: 'Veridan Core/OpenClaw',
    draftType: 'TEMPLATE_OPENCLAW_SOP',
    generate: (topic, purpose) => `# OpenClaw SOP: ${topic}

## Purpose
${purpose}

## Scope
This SOP applies to OpenClaw operator interactions within the Veridan Core system.

## Prerequisites
- Operator has APPROVED access in OpenClawAccessReview
- Gateway health check PASSED
- Risk tier confirmed: LOW or MEDIUM only

## Procedure Steps
1. **Initiate** — Submit read-only proposal via OpenClaw Command Proposal interface
2. **Validate** — Policy gate checks commandType, riskTier, and target
3. **Approve** — Operator reviews and approves in Command Approval Workflow Panel
4. **Execute** — Execution only after explicit approval; SIMULATED mode default
5. **Audit** — All actions logged to OpenClawSignerAudit and OpenClawBridgeDryRunAudit

## Approval Gates
- commandType must be in allowlist: READ, VERIFY, NAVIGATE_READ_ONLY, SNAPSHOT
- riskTier must be LOW or MEDIUM
- policyGate must return PASS before execution
- Human approval required before any non-simulated execution

## Rollback
- Set proposal status to DENIED
- No rollback needed for READ/VERIFY-only operations
- Log denial in reviewNote field

## Safety Constraints
- executionStatus: NOT_EXECUTED until explicitly approved
- dispatchStatus: NOT_DISPATCHED
- openclawCall: NOT_SENT
- filesystemWrite: DISABLED

## References
- OpenClawProposal entity
- OpenClawSignerAudit entity
- Veridan Core Baseline V1
`,
  },
  {
    id: 'daily_ops_sop',
    label: 'Daily Operations SOP',
    folder: 'Veridan Core/Daily Operations',
    draftType: 'TEMPLATE_DAILY_OPS_SOP',
    generate: (topic, purpose) => `# Daily Operations SOP: ${topic}

## Purpose
${purpose}

## Scope
Daily operator procedures for Veridan Core system management.

## Morning Checklist
- [ ] Review overnight alerts and task queue
- [ ] Confirm OpenClaw gateway health (read-only check)
- [ ] Review pending proposals in Draft Review
- [ ] Check audit log for any unexpected entries
- [ ] Confirm no unapproved executions

## Ongoing Monitoring
- [ ] Monitor task queue for new items
- [ ] Respond to approval requests within 4 hours
- [ ] Log any anomalies to audit evidence

## End of Day
- [ ] Review all completed tasks
- [ ] Export audit snapshot if any vault writes occurred
- [ ] Confirm execution states: all NOT_EXECUTED unless explicitly approved
- [ ] Clear non-approved draft queue if storage is approaching limit

## Escalation
- Any execution outside approved workflow → immediate review
- Gateway offline → do not retry; log and escalate
- Unexpected filesystemWrite → audit and freeze writes

## Safety Constraints
- All vault writes require APPROVED status + LOW risk
- No external API calls in daily ops
- No credential handling in this SOP
`,
  },
  {
    id: 'trading_sop',
    label: 'Trading SOP',
    folder: 'Veridan Core/Trading',
    draftType: 'TEMPLATE_TRADING_SOP',
    generate: (topic, purpose) => `# Trading SOP: ${topic}

## Purpose
${purpose}

## Scope
Paper / demo trading operations only. No live capital deployment without separate authorization.

## Signal Entry Protocol
1. Signal received via TradingView MCP alert intake
2. Signal validated against risk rules
3. Proposal created in Trading Command Center
4. Operator reviews signal quality and risk rating
5. Order staged (not executed) pending approval

## Position Limits
- Max per-trade risk: defined in TradingRiskRuleBuilder
- Max open positions: defined per strategy
- Loss threshold: defined in TradingRiskRuleBuilder
- Default environment: PAPER / DEMO only

## Trade Execution (Paper Only)
- Execute only after human approval
- Log all trade decisions in audit trail
- No live broker API access without vaulted credentials

## Position Management
- Monitor via TradingPaperReadinessDashboard
- Close positions at defined stop-loss or take-profit
- Log exit reason and result

## Exit Rules
- Stop-loss: mandatory
- Take-profit: optional but documented
- Time-based exit: optional

## Safety Constraints
- tradingModeAllowed: PAPER_ONLY until live approved
- Broker credentials: VAULT_PENDING / NOT_CONNECTED
- No live capital at risk
`,
  },
  {
    id: 'credit_sop',
    label: 'Credit SOP',
    folder: 'Veridan Core/Credit',
    draftType: 'TEMPLATE_CREDIT_SOP',
    generate: (topic, purpose) => `# Credit SOP: ${topic}

## Purpose
${purpose}

## Scope
Credit facility management and dispute tracking for Veridan Core entities.

## Origination
1. Identify credit need
2. Review existing facilities via Credit Ledger
3. Submit facility creation proposal
4. Operator approves via standard approval workflow
5. Record in CreditFacility entity

## Drawdown Protocol
1. Confirm available credit: availableCreditCents > 0
2. Create CreditLedgerEvent with eventType: draw
3. Update CreditFacility: currentBalanceCents, availableCreditCents
4. Log referenceId and sourceAccount

## Paydown Protocol
1. Confirm outstanding balance
2. Create CreditLedgerEvent with eventType: paydown
3. Update balances accordingly
4. Verify: balanceAfterCents is non-negative

## Dispute Handling
1. Document dispute details in Credit Profile Intake
2. Bureau monitoring checklist review
3. Dispute letter preparation via Credit Dispute Planner
4. Track resolution timeline

## Monitoring
- Review statement cycle dates
- Monitor dueDay for payment schedules
- Track riskRating changes

## Safety Constraints
- No live money movement without explicit approval
- All ledger events require approvalStatus: APPROVED
`,
  },
  {
    id: 'trust_entity_sop',
    label: 'Trust / Entity SOP',
    folder: 'Veridan Core/Trust / Entities',
    draftType: 'TEMPLATE_TRUST_ENTITY_SOP',
    generate: (topic, purpose) => `# Trust / Entity SOP: ${topic}

## Purpose
${purpose}

## Scope
Formation, management, and compliance for trust and LLC entities within the Veridan Core structure.

## Entity Formation Steps
1. Determine entity type: Trust, LLC, or S-Corp
2. Draft operating agreement / trust document
3. File with appropriate state
4. Obtain EIN from IRS
5. Open business banking account

## Trustee / Manager Duties
- Annual review of trust/operating agreement
- Distribution compliance per agreement terms
- Record keeping: all distributions and major decisions
- Tax filing compliance

## Beneficiary / Member Rights
- Documented in operating agreement / trust deed
- Distribution schedule defined and followed
- Voting rights as specified

## Asset Management
- All assets titled to entity
- No co-mingling with personal assets
- Annual asset review and documentation

## Compliance
- Annual state filings (Registered Agent)
- EIN maintenance
- Banking: business accounts only
- Insurance review annually

## Succession Planning
- Successor trustee / manager designated
- Transition procedure documented

## Safety Constraints
- No asset transfers without compliance review
- All entity documents stored in vault
`,
  },
  {
    id: 'system_governance',
    label: 'System Governance Note',
    folder: 'Veridan Core/Veridan Core System',
    draftType: 'TEMPLATE_SYSTEM_GOVERNANCE',
    generate: (topic, purpose) => `# System Governance Note: ${topic}

## Purpose
${purpose}

## Governance Scope
This note documents a governance decision, policy, or constraint within the Veridan Core system.

## Decision / Policy Statement
[Describe the governance decision or policy here]

## Rationale
[Why this decision was made]

## Affected Components
- [ ] OpenClaw
- [ ] Trading Module
- [ ] Credit Module
- [ ] Business Formation
- [ ] Trust / Entities
- [ ] Obsidian Vault
- [ ] Audit / Evidence

## Implementation Constraints
- Applies to all operators with access to affected components
- Human approval required before any changes
- Policy gate enforcement: YES
- Audit trail: REQUIRED

## Review Schedule
- Initial review date: ${new Date().toISOString().slice(0, 10)}
- Next review: quarterly
- Reviewer: assigned operator

## Baseline Lock Status
- Veridan Core Baseline V1: LOCKED
- executionStatus: NOT_EXECUTED
- Changes require new governance note

## References
- Veridan Core Baseline V1
- OpenClawGovernanceDashboard
- AuditEvidenceDashboard
`,
  },
  {
    id: 'audit_evidence',
    label: 'Audit / Evidence Note',
    folder: 'Veridan Core/Veridan Core System',
    draftType: 'TEMPLATE_AUDIT_EVIDENCE',
    generate: (topic, purpose) => `# Audit / Evidence Note: ${topic}

## Purpose
${purpose}

## Audit Event Details
- Date: ${new Date().toISOString().slice(0, 10)}
- Event Type: [describe event]
- Operator: [operator identifier]
- System: Veridan Core

## Evidence Summary
[Describe what was observed, logged, or verified]

## Source Records
| Record Type | ID | Status |
|---|---|---|
| Task | [taskId] | [status] |
| Draft | [draftId] | [status] |
| Write Audit | [auditId] | [status] |

## Verification Steps Completed
- [ ] Task metadata verified
- [ ] Approval status confirmed
- [ ] Execution status: NOT_EXECUTED
- [ ] Dispatch status: NOT_DISPATCHED
- [ ] No credentials accessed
- [ ] No external API calls made
- [ ] Vault write: approved only

## Findings
[Document findings here]

## Resolution / Next Steps
[Required actions or notes]

## Safety Attestation
- This audit note was generated locally — no API calls
- No live execution performed
- All states consistent with Baseline V1

## Audit Hash (manual)
[Operator inserts hash or reference after review]
`,
  },
];

const LOG = (...args) => console.log('[OBSIDIAN_DRAFT_STORAGE]', ...args);
const LOG_ERR = (...args) => console.error('[OBSIDIAN_DRAFT_STORAGE]', ...args);
const MAX_CONTENT_BYTES = 200 * 1024;
const MAX_NON_APPROVED = 10;

function isApproved(d) {
  return d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT';
}

function compactAndSave(newDraft) {
  const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
  let drafts;
  try { drafts = JSON.parse(stored); if (!Array.isArray(drafts)) drafts = []; }
  catch { drafts = []; }

  const safeContent = newDraft.content.length > MAX_CONTENT_BYTES
    ? newDraft.content.slice(0, MAX_CONTENT_BYTES) + '\n\n[content trimmed]'
    : newDraft.content;
  const draft = { ...newDraft, content: safeContent };

  // Deduplicate: remove non-approved with same key before adding new one
  const key = `${draft.filename}||${draft.targetFolder}||${draft.draftType}`;
  const withoutDup = drafts.filter(d => {
    if (isApproved(d)) return true;
    const dk = `${d.filename}||${d.targetFolder}||${d.draftType}`;
    return dk !== key;
  });

  withoutDup.unshift(draft);

  // Separate and cap non-approved
  const approvedList = withoutDup.filter(d => isApproved(d));
  const pendingList = withoutDup.filter(d => !isApproved(d)).slice(0, MAX_NON_APPROVED);
  const compacted = [...approvedList, ...pendingList];

  LOG(`Saving draft ${draft.id} — ${approvedList.length} approved + ${pendingList.length} pending`);

  try {
    localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(compacted));
    return { ok: true };
  } catch (e1) {
    LOG_ERR('First save attempt failed:', e1);
    // Retry: strip content from old pending drafts
    const stripped = compacted.map(d =>
      (!isApproved(d) && d.id !== draft.id)
        ? { ...d, content: '[content removed to free storage]' }
        : d
    );
    try {
      localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(stripped));
      LOG('Saved after content stripping');
      return { ok: true };
    } catch (e2) {
      LOG_ERR('Retry save failed:', e2);
      return { ok: false };
    }
  }
}

export default function TemplateDraftGenerator({ onDraftCreated }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [topic, setTopic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetFolder, setTargetFolder] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const template = TEMPLATES.find(t => t.id === selectedTemplate);

  // When a template is picked, auto-fill its default folder
  const handleSelectTemplate = (id) => {
    const t = TEMPLATES.find(x => x.id === id);
    setSelectedTemplate(id);
    setTargetFolder(t ? t.folder : '');
    setError(null);
    setSuccess(false);
  };

  const handleGenerate = () => {
    setError(null);
    if (!template || !topic.trim() || !purpose.trim()) {
      setError('Select a template and fill in Topic and Purpose.');
      return;
    }
    if (!ALLOWLISTED_FOLDERS.includes(targetFolder)) {
      setError('Target folder is not allowlisted.');
      return;
    }

    const filename = `${topic.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')}.md`;
    const content = template.generate(topic.trim(), purpose.trim());

    const draft = {
      id: `DRAFT-${Date.now().toString(36).toUpperCase()}-TPL`,
      source: 'TEMPLATE_GENERATOR',
      title: `${template.label}: ${topic.trim()}`,
      category: template.id,
      targetFolder,
      filename,
      content,
      draftType: template.draftType,
      riskLevel: 'LOW',
      approvalStatus: 'PENDING_REVIEW',
      approvalState: 'PENDING_REVIEW',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      filesystemWrite: 'DISABLED',
      openclawCall: 'NOT_SENT',
      apiMode: 'NO_API_LOCAL_ONLY',
      templateId: template.id,
      createdAt: new Date().toISOString(),
    };

    const result = compactAndSave(draft);
    if (!result.ok) {
      setError('Storage is full. Clear old non-approved drafts, shorten the markdown, or export evidence before saving.');
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setTopic('');
    setPurpose('');
    if (onDraftCreated) onDraftCreated(draft);
  };

  return (
    <div className="border border-primary/50 bg-primary/5 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Create From Template
        </span>
        <span className="ml-auto px-2 py-0.5 text-[6px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 rounded-sm">
          LOCAL ONLY · NO API
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Template selector */}
        <div className="space-y-2">
          <label className="text-[8px] font-bold uppercase text-slate-400">Draft Template</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t.id)}
                className={`p-3 text-left rounded-sm border transition-colors ${
                  selectedTemplate === t.id
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border/30 bg-card hover:bg-secondary/20 text-slate-400'
                }`}
              >
                <div className="text-[8px] font-bold">{t.label}</div>
                <div className="text-[7px] text-slate-500 mt-0.5 font-mono truncate">{t.folder}</div>
              </button>
            ))}
          </div>
        </div>

        {template && (
          <>
            {/* Target folder — pre-filled, can override */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Target Folder (allowlisted)</label>
              <select
                value={targetFolder}
                onChange={e => setTargetFolder(e.target.value)}
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 focus:outline-none focus:border-primary/40"
              >
                <option value="">— select —</option>
                {ALLOWLISTED_FOLDERS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Topic / Title</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Weekly Bridge Review"
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Purpose */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400">Purpose (one sentence)</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g., Document the weekly bridge review process for OpenClaw"
                className="w-full px-3 py-2 text-[9px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Preview filename */}
            {topic && (
              <div className="text-[7px] font-mono text-slate-500">
                → <span className="text-slate-400">{targetFolder || '...'}</span>
                {' / '}
                <span className="text-primary">
                  {topic.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || 'untitled'}.md
                </span>
              </div>
            )}

            {error && (
              <div className="text-[8px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-[8px] font-mono text-primary bg-primary/10 border border-primary/30 rounded-sm px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Local template draft created. Review and approve before writing to vault.
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!topic.trim() || !purpose.trim() || !targetFolder}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              <FileText className="w-4 h-4" /> Create From Template
            </button>
          </>
        )}
      </div>
    </div>
  );
}