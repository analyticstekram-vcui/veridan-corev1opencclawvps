/**
 * CoreVaultPackGenerator
 * One-click local batch draft generator — NO API, NO OpenClaw dispatch, NO browser automation.
 * Generates 10 predefined Core Vault Pack drafts and saves them to veridan_obsidian_drafts.
 * All drafts require Draft Review approval before any vault write.
 */

import React, { useState } from 'react';
import { Package, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const LOG = (...args) => console.log('[OBSIDIAN_DRAFT_STORAGE]', ...args);
const LOG_ERR = (...args) => console.error('[OBSIDIAN_DRAFT_STORAGE]', ...args);

const MAX_NON_APPROVED = 10;

function isApproved(d) {
  return d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT';
}

// ── Core Vault Pack template definitions ────────────────────────────────────
const CORE_VAULT_PACK = [
  {
    id: 'cvp_system_overview',
    title: 'Veridan Core System Overview',
    filename: 'veridan_core_system_overview.md',
    category: 'system',
    targetFolder: 'Veridan Core/Veridan Core System',
    draftType: 'CVP_SYSTEM_OVERVIEW',
    content: `# Veridan Core System Overview

## Purpose
This document provides a structured overview of the Veridan Core system architecture, key components, and operational constraints.

## System Identity
- System Name: Veridan Core
- Operational Mode: NO_API_LOCAL_ONLY
- Baseline: V1 LOCKED
- Execution Status: NOT_EXECUTED (all operations require explicit approval)

## Key Components
| Component | Purpose | Status |
|---|---|---|
| OpenClaw | Controlled browser and command governance | READ_ONLY |
| Trading Module | Paper/demo trading operations | PAPER_ONLY |
| Credit Module | Credit facility and ledger management | LOCAL_ONLY |
| Business Formation | Entity and LLC planning | LOCAL_ONLY |
| Trust / Entities | Trust and entity governance | LOCAL_ONLY |
| Obsidian Vault | Controlled note and document management | APPROVAL_GATED |
| Audit / Evidence | Immutable audit trail and evidence chain | READ_ONLY |

## Integration Points
- OpenClaw Gateway: Read-only health checks only
- TradingView MCP: Signal intake, no execution
- Obsidian VPS Bridge: Dry-run only, no live writes without approval
- Broker APIs: NOT_CONNECTED until vaulted credentials approved

## Safety Boundaries
- No live money movement without explicit multi-step approval
- No credential exposure in any module
- No external API calls in NO_API_LOCAL_ONLY mode
- All vault writes require APPROVED + LOW risk + NOT_EXECUTED state
- Human operator review required before any state change

## Governance
- Veridan Core Baseline V1: LOCKED
- All changes require new governance note + approval cycle
- Audit trail: mandatory for all approved actions
`,
  },
  {
    id: 'cvp_openclaw_sop',
    title: 'OpenClaw Operating SOP',
    filename: 'openclaw_operating_sop.md',
    category: 'openclaw',
    targetFolder: 'Veridan Core/OpenClaw',
    draftType: 'CVP_OPENCLAW_SOP',
    content: `# OpenClaw Operating SOP

## Purpose
Standard operating procedure for all OpenClaw operator interactions within the Veridan Core governance framework.

## Prerequisites
- Operator has APPROVED entry in OpenClawAccessReview
- Gateway health check: PASSED (read-only)
- Risk tier confirmed before any proposal submission
- Baseline V1 LOCKED status confirmed

## Allowed Command Types
| Command | Risk Tier | Approval Required |
|---|---|---|
| READ | LOW | YES |
| VERIFY | LOW | YES |
| NAVIGATE_READ_ONLY | LOW | YES |
| SNAPSHOT | LOW | YES |
| EXPORT_LOG | LOW | YES |

## Prohibited Actions
- ❌ WRITE commands
- ❌ EXECUTE commands  
- ❌ Credential access
- ❌ Browser form submission
- ❌ Live trading dispatch

## Proposal Lifecycle
1. Operator submits proposal via OpenClaw Command Proposal interface
2. Policy gate validates: commandType, riskTier, target
3. HMAC signature applied via OpenClawBridgeSigner
4. Proposal enters PENDING_APPROVAL status
5. Second operator (or same if ALLOW_SELF_COSIGN=true) reviews and approves
6. Execution only after status = APPROVED
7. Audit record created in OpenClawSignerAudit

## Escalation
- Policy gate FAIL → do not submit; review commandType and target
- Gateway offline → log and wait; do not retry aggressively
- Unexpected EXECUTED status → freeze, audit, escalate immediately

## Safety Attestation
- executionStatus: NOT_EXECUTED until approved
- dispatchStatus: NOT_DISPATCHED
- openclawCall: NOT_SENT
- filesystemWrite: DISABLED
`,
  },
  {
    id: 'cvp_daily_ops_sop',
    title: 'Daily Operations SOP',
    filename: 'daily_operations_sop.md',
    category: 'operations',
    targetFolder: 'Veridan Core/Daily Operations',
    draftType: 'CVP_DAILY_OPS_SOP',
    content: `# Daily Operations SOP

## Purpose
Defines the daily operator routine for Veridan Core system management, monitoring, and governance compliance.

## Morning Routine (Start of Day)
- [ ] Review overnight alerts in task queue
- [ ] Check OpenClaw gateway health (read-only probe)
- [ ] Review pending drafts in Draft Review queue
- [ ] Confirm no unapproved executions in audit trail
- [ ] Check localStorage storage usage (clear non-approved if near quota)
- [ ] Review OpenClawAccessReview entries for expiring access

## Ongoing Monitoring (Throughout Day)
- [ ] Monitor task queue for new items
- [ ] Process approval requests within 4 hours
- [ ] Log anomalies to audit evidence immediately
- [ ] Confirm all new items have: riskLevel=LOW, executionStatus=NOT_EXECUTED

## Pre-Write Checklist (Before Any Vault Write)
- [ ] Draft status: APPROVED
- [ ] Risk level: LOW
- [ ] Execution status: NOT_EXECUTED
- [ ] Target folder: in approved allowlist
- [ ] Operator: confirmed authorized

## End of Day Routine
- [ ] Review all completed tasks
- [ ] Export audit snapshot if any vault writes occurred
- [ ] Confirm all execution states: NOT_EXECUTED unless explicitly approved
- [ ] Clear non-approved draft queue if storage is near limit
- [ ] Document any anomalies in daily log

## Escalation Protocol
| Situation | Action |
|---|---|
| Execution outside approved workflow | Immediate review + freeze writes |
| Gateway offline > 1 hour | Log + escalate to system owner |
| Unexpected filesystemWrite | Audit + freeze all writes |
| Storage quota exceeded | Clear non-approved drafts + export evidence |

## Constraints
- No external API calls in daily ops
- No credential handling
- All vault writes require full approval cycle
`,
  },
  {
    id: 'cvp_trading_sop',
    title: 'Trading Command SOP',
    filename: 'trading_command_sop.md',
    category: 'trading',
    targetFolder: 'Veridan Core/Trading',
    draftType: 'CVP_TRADING_SOP',
    content: `# Trading Command SOP

## Purpose
Defines the standard procedure for trading signal intake, review, and paper execution within Veridan Core.

## Current Trading Mode
- Environment: PAPER / DEMO only
- Live capital: NOT AUTHORIZED
- Broker credentials: VAULT_PENDING / NOT_CONNECTED
- Execution mode: SIMULATED

## Signal Intake Protocol
1. Signal received via TradingView MCP alert intake panel
2. Signal parsed: symbol, direction, price, strategy
3. Risk validation: checked against TradingRiskRuleBuilder rules
4. Proposal created with status: PENDING_REVIEW
5. Operator reviews in Trading Command Center
6. Order staged (paper) pending explicit approval
7. Paper execution logged in audit trail

## Risk Rules (Mandatory Before Any Execution)
- Max per-trade risk: defined in TradingRiskRuleBuilder
- Max concurrent open positions: defined per strategy
- Daily loss threshold: must not exceed configured limit
- Strategy must be registered in TradingStrategyRegistry

## Paper Trade Execution Steps
1. Confirm environment = PAPER
2. Confirm broker credentials NOT in live mode
3. Confirm risk rules pass
4. Get explicit operator approval
5. Execute in paper broker sandbox
6. Log result with tradeId, symbol, entry, direction, size

## Prohibited Actions
- ❌ Live order submission without vault credentials + multi-approval
- ❌ Credential access in trading module
- ❌ Bypassing risk rules
- ❌ Using real capital in paper mode

## Safety Constraints
- tradingModeAllowed: PAPER_ONLY
- Broker: NOT_CONNECTED for live
- All trade proposals: executionStatus=NOT_EXECUTED until approved
`,
  },
  {
    id: 'cvp_credit_sop',
    title: 'Credit Monitoring SOP',
    filename: 'credit_monitoring_sop.md',
    category: 'credit',
    targetFolder: 'Veridan Core/Credit',
    draftType: 'CVP_CREDIT_SOP',
    content: `# Credit Monitoring SOP

## Purpose
Defines procedures for monitoring credit facilities, managing ledger events, and tracking bureau activity.

## Credit Facility Monitoring
### Weekly Review
- [ ] Review all active facilities in Credit Ledger
- [ ] Confirm currentBalanceCents vs creditLimitCents
- [ ] Check for approaching dueDay payments
- [ ] Review any facilities with riskRating = HIGH or CRITICAL
- [ ] Check promoEndDate for expiring promotional rates

### Monthly Review  
- [ ] Statement reconciliation for each active facility
- [ ] Interest and fee verification
- [ ] Credit utilization calculation: currentBalance / creditLimit
- [ ] Update credit allocation projections

## Ledger Event Protocol
| Event Type | Required Fields | Approval |
|---|---|---|
| draw | creditFacilityId, amountCents, sourceAccount | YES |
| paydown | creditFacilityId, amountCents, destinationAccount | YES |
| fee | creditFacilityId, amountCents, description | YES |
| interest | creditFacilityId, amountCents | AUTO |
| adjustment | creditFacilityId, amountCents, description | YES |

## Bureau Monitoring Checklist
- [ ] Pull and review credit reports (scheduled)
- [ ] Check for new inquiries
- [ ] Review tradeline accuracy
- [ ] Log disputes via Credit Dispute Planner if needed
- [ ] Track dispute status and timeline

## Dispute Handling
1. Document dispute details
2. Create CreditDisputePlanner entry
3. Draft dispute letter
4. Submit to bureau (external, manual)
5. Track 30/60/90 day response timeline
6. Update bureau monitoring checklist on resolution

## Safety Constraints
- No money movement without explicit approval
- All CreditLedgerEvents require APPROVED status
- No external bureau API calls (manual process)
`,
  },
  {
    id: 'cvp_trust_entity_sop',
    title: 'Trust and Entity Governance SOP',
    filename: 'trust_entity_governance_sop.md',
    category: 'entities',
    targetFolder: 'Veridan Core/Trust / Entities',
    draftType: 'CVP_TRUST_ENTITY_SOP',
    content: `# Trust and Entity Governance SOP

## Purpose
Defines formation, management, compliance, and succession procedures for all trusts and entities within the Veridan Core structure.

## Entity Inventory
Document all active entities below:

| Entity Name | Type | State | EIN | Status |
|---|---|---|---|---|
| [Entity 1] | LLC | [State] | [EIN] | Active |
| [Entity 2] | Trust | [State] | [EIN] | Active |

## Formation Protocol
1. Determine optimal entity type (LLC, S-Corp, Trust)
2. Review state-specific requirements
3. Draft operating agreement / trust deed
4. File articles with state (Registered Agent required)
5. Obtain EIN from IRS Form SS-4
6. Open business banking account
7. Document all in vault under Trust / Entities folder

## Annual Compliance Checklist
- [ ] Annual report filed with state
- [ ] Registered agent confirmed and paid
- [ ] EIN still active (no dormant filing needed)
- [ ] Business banking accounts in good standing
- [ ] Insurance policies reviewed and current
- [ ] Operating agreement reviewed for necessary updates
- [ ] All distributions documented per agreement

## Asset Management Rules
- All assets must be titled to entity name
- No co-mingling with personal assets (ever)
- All significant transactions require board/trustee minutes
- Annual asset review and documentation required

## Banking and Finance
- Business accounts only for entity transactions
- All draws documented as distributions or loans
- Loan agreements required for any owner loans
- Regular reconciliation with accounting records

## Succession Planning
- Successor trustee/manager: [designate]
- Transition procedure: documented in vault
- Emergency contact: [designate]

## Safety Constraints
- No asset transfers without compliance review
- All entity documents stored in vault with audit trail
- No personal use of entity accounts
`,
  },
  {
    id: 'cvp_audit_evidence_sop',
    title: 'Audit and Evidence SOP',
    filename: 'audit_evidence_sop.md',
    category: 'system',
    targetFolder: 'Veridan Core/Veridan Core System',
    draftType: 'CVP_AUDIT_EVIDENCE_SOP',
    content: `# Audit and Evidence SOP

## Purpose
Defines the standard procedure for creating, maintaining, and exporting audit records and evidence chains within Veridan Core.

## Audit Record Types
| Record Type | Entity | Trigger |
|---|---|---|
| Vault write | OpenClawBridgeDryRunAudit | After approved draft write |
| Gateway probe | OpenClawGatewayConnectorLog | After health check |
| Signer audit | OpenClawSignerAudit | After HMAC signing |
| Legacy review | OpenClawLegacyReview | Manual review of old commands |
| Access review | OpenClawAccessReview | Operator access events |

## Evidence Creation Protocol
1. Action occurs (approved vault write, gateway probe, etc.)
2. Audit record created immediately in corresponding entity
3. Record includes: operatorId, timestamp, actionType, result
4. No secrets, tokens, or credentials in any audit record
5. Audit record is immutable after creation

## Evidence Chain Verification
- Export audit chain snapshot via Audit Evidence Dashboard
- Verify: all write audits have corresponding approval records
- Verify: no execution status changes without approval
- Verify: no credentials appear in any audit record
- Verify: filesystemWrite values are consistent with approval state

## Monthly Audit Review
- [ ] Export all audit records from current month
- [ ] Verify evidence chain integrity
- [ ] Review for any anomalies or policy exceptions
- [ ] Document findings in this vault
- [ ] Escalate any policy violations immediately

## Evidence Export Protocol
1. Navigate to Audit Evidence Dashboard
2. Select export format (JSON snapshot)
3. Save to local evidence archive
4. Log export in this SOP's export log

## Export Log
| Date | Exported By | Record Count | Notes |
|---|---|---|---|
| [date] | [operator] | [count] | Initial export |

## Safety Constraints
- Audit records are read-only after creation
- No deletion of audit records without governance review
- Export only to local storage; no external transmission
- All audit records: secretExposed = false (hardcoded)
`,
  },
  {
    id: 'cvp_vault_folder_map',
    title: 'Vault Folder Map',
    filename: 'vault_folder_map.md',
    category: 'system',
    targetFolder: 'Veridan Core/Veridan Core System',
    draftType: 'CVP_VAULT_FOLDER_MAP',
    content: `# Vault Folder Map

## Purpose
Documents the approved folder structure for the Veridan Core Obsidian vault and the allowed write targets.

## Approved Vault Structure
\`\`\`
Veridan Core/
├── Veridan Core System/       ← System docs, governance notes, overview
├── OpenClaw/                  ← OpenClaw SOPs, bridge guides, proposals
├── Trading/                   ← Trading SOPs, risk rules, strategy docs
├── Credit/                    ← Credit facility docs, monitoring SOPs
├── Business Formation/        ← Entity plans, LLC/Corp docs
├── Trust / Entities/          ← Trust deeds, operating agreements, governance
├── SOPs/                      ← General SOPs not covered above
└── Daily Operations/          ← Daily checklists, operator logs
\`\`\`

## Allowlisted Write Targets
The following folders are approved for controlled vault writes:

| Folder Path | Purpose | Risk Level |
|---|---|---|
| Veridan Core/Veridan Core System | System and governance docs | LOW |
| Veridan Core/OpenClaw | OpenClaw operational docs | LOW |
| Veridan Core/Trading | Trading docs and SOPs | LOW |
| Veridan Core/Credit | Credit management docs | LOW |
| Veridan Core/Business Formation | Entity formation docs | LOW |
| Veridan Core/Trust / Entities | Trust and entity docs | LOW |
| Veridan Core/SOPs | General SOPs | LOW |
| Veridan Core/Daily Operations | Daily logs and checklists | LOW |

## Blocked Paths
- Any path containing: \`../\`, \`./\`, \`\\\`
- Any path outside \`Veridan Core/\`
- Any path to system files or credentials
- Any filename matching: \`.env\`, \`.credentials\`, \`*.key\`, \`*.pem\`

## Write Governance Rules
1. Target folder must be in allowlist above
2. Draft must have approvalStatus: APPROVED
3. Draft must have riskLevel: LOW
4. Draft must have executionStatus: NOT_EXECUTED
5. Operator must confirm write in Draft Review panel
6. Audit record created after every write

## Notes
- This folder map is subject to governance review before changes
- New folders require a governance note + approval cycle
- Vault folder map last reviewed: current session
`,
  },
  {
    id: 'cvp_safety_boundary_rules',
    title: 'Safety Boundary Rules',
    filename: 'safety_boundary_rules.md',
    category: 'system',
    targetFolder: 'Veridan Core/Veridan Core System',
    draftType: 'CVP_SAFETY_BOUNDARY_RULES',
    content: `# Safety Boundary Rules

## Purpose
Defines the non-negotiable safety constraints for the Veridan Core system. These rules cannot be overridden without a full governance review and new baseline.

## Current Baseline
- Veridan Core Baseline V1: **LOCKED**
- Effective date: Initial deployment
- Last review: Current session

## Absolute Prohibitions (NEVER)
| Rule | Reason |
|---|---|
| No live money movement without multi-step approval | Capital protection |
| No credential storage in localStorage or frontend code | Security |
| No API calls in NO_API_LOCAL_ONLY mode | Credit conservation |
| No browser automation without approved proposal | Governance |
| No vault writes without APPROVED + LOW risk | Data integrity |
| No external dispatch without HMAC-signed approved proposal | Security |
| No OpenClaw execution without policy gate PASS | Governance |
| No deletion of audit records | Immutability |

## Execution State Rules
All system objects must maintain these states unless explicitly changed through approval workflow:

\`\`\`
executionStatus:  NOT_EXECUTED
dispatchStatus:   NOT_DISPATCHED
openclawCall:     NOT_SENT
filesystemWrite:  DISABLED
\`\`\`

## Approval Gate Requirements
Every state change from the above defaults requires:
1. Proposal creation with full metadata
2. Policy gate validation: PASS
3. Risk assessment: LOW or MEDIUM only
4. Human operator review and explicit approval
5. Audit record creation

## Credential Rules
- No credentials in any frontend code
- No credentials in localStorage
- No credentials in audit records (secretExposed: false hardcoded)
- Live credentials: vault only (AWS Secrets Manager or equivalent)
- Paper/demo credentials: VAULT_PENDING status until fully vaulted

## API Credit Conservation Rules (NO_API_LOCAL_ONLY)
- InvokeLLM: DISABLED
- GenerateImage: DISABLED
- SendEmail: DISABLED
- OpenClaw GPT calls: DISABLED
- All base44.integrations calls: DISABLED
- Local template generation: ENABLED (no credits)
- LocalStorage operations: ENABLED (no credits)

## Violation Response
1. Immediate freeze of affected module
2. Audit all recent actions
3. Document violation in Audit Evidence
4. Do not resume until root cause identified and resolved
`,
  },
  {
    id: 'cvp_approval_workflow',
    title: 'Operator Approval Workflow',
    filename: 'operator_approval_workflow.md',
    category: 'system',
    targetFolder: 'Veridan Core/Veridan Core System',
    draftType: 'CVP_APPROVAL_WORKFLOW',
    content: `# Operator Approval Workflow

## Purpose
Defines the end-to-end approval process for all Veridan Core actions that require explicit operator authorization.

## Workflow Overview
\`\`\`
[Draft Created] → [Pending Review] → [Operator Review] → [Approved/Denied] → [Execute/Discard]
\`\`\`

## Draft Creation Sources
| Source | Description |
|---|---|
| TEMPLATE_GENERATOR | Single template from TemplateDraftGenerator |
| LOCAL_TEMPLATE_BATCH | Batch from CoreVaultPackGenerator |
| MANUAL_LOCAL_DRAFT | Manual markdown from ManualDraftForm |
| OBSIDIAN_WORKBENCH | Legacy task creation workflow |

## Step 1: Draft Created
- Draft saved to veridan_obsidian_drafts (localStorage)
- approvalStatus: PENDING_REVIEW
- riskLevel: LOW
- executionStatus: NOT_EXECUTED
- dispatchStatus: NOT_DISPATCHED

## Step 2: Draft Review
- Operator navigates to Obsidian Draft Review page
- Reviews: title, targetFolder, content, riskLevel
- Verifies: no credentials, no external calls, folder is allowlisted

## Step 3: Approval Decision
### To Approve:
- Click "Approve Draft" button
- Confirm approvalStatus changes to: APPROVED
- Confirm riskLevel remains: LOW
- Confirm executionStatus remains: NOT_EXECUTED

### To Deny:
- Click "Deny" or do not approve
- Draft remains in PENDING_REVIEW or is removed
- No vault write occurs

## Step 4: Vault Write (After Approval Only)
- Button "Write Approved Draft to Vault" becomes active
- Required conditions: APPROVED + LOW + NOT_EXECUTED + allowlisted folder
- Write executes via obsidianWriteApprovedDraft backend function
- Audit record created in veridan_obsidian_write_audits

## Step 5: Post-Write Audit
- Audit record saved with: draftId, taskId, filePath, auditHash
- filesystemWrite: COMPLETED_APPROVED_DRAFT_ONLY
- executionStatus: NOT_EXECUTED (unchanged — write ≠ execution)
- dispatchStatus: NOT_DISPATCHED (unchanged)

## Approval Requirements Matrix
| Condition | Required Value |
|---|---|
| approvalStatus | APPROVED |
| riskLevel | LOW |
| executionStatus | NOT_EXECUTED |
| targetFolder | In allowlist |
| dispatchStatus | NOT_DISPATCHED |

## Escalation
- Any write attempt without APPROVED status → blocked automatically
- Any attempt to set executionStatus ≠ NOT_EXECUTED without governance → freeze
- Audit all write attempts regardless of outcome
`,
  },
];

// ── Storage helpers ──────────────────────────────────────────────────────────
function saveBatchToLocalStorage(drafts) {
  const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
  let existing;
  try { existing = JSON.parse(stored); if (!Array.isArray(existing)) existing = []; }
  catch { existing = []; }

  // Approved drafts are always preserved
  const approvedDrafts = existing.filter(d => isApproved(d));
  const pendingDrafts = existing.filter(d => !isApproved(d));

  // For each new draft, remove any matching non-approved duplicate (same filename+folder+draftType)
  const newDraftKeys = new Set(drafts.map(d => `${d.filename}||${d.targetFolder}||${d.draftType}`));
  const filteredPending = pendingDrafts.filter(d => {
    const key = `${d.filename}||${d.targetFolder}||${d.draftType}`;
    return !newDraftKeys.has(key);
  });

  // Merge: new batch first, then old pending (capped), then approved
  const merged = [...drafts, ...filteredPending];
  const cappedPending = merged.slice(0, MAX_NON_APPROVED);
  const final = [...approvedDrafts, ...cappedPending];

  LOG(`Batch save: ${drafts.length} new + ${approvedDrafts.length} approved preserved. Total: ${final.length}`);

  try {
    localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(final));
    return { ok: true };
  } catch (e1) {
    LOG_ERR('Batch save failed (attempt 1):', e1);
    // Retry: strip content from old non-batch pending drafts
    const stripped = final.map(d =>
      (!isApproved(d) && !newDraftKeys.has(`${d.filename}||${d.targetFolder}||${d.draftType}`))
        ? { ...d, content: '[content removed to free storage]' }
        : d
    );
    try {
      localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(stripped));
      LOG('Batch saved after stripping old content');
      return { ok: true };
    } catch (e2) {
      LOG_ERR('Batch save failed (attempt 2):', e2);
      return { ok: false };
    }
  }
}

export default function CoreVaultPackGenerator({ onBatchCreated }) {
  const [status, setStatus] = useState('idle'); // idle | generating | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount] = useState(0);

  const handleGenerate = () => {
    setStatus('generating');
    setErrorMsg('');

    const now = new Date().toISOString();
    const drafts = CORE_VAULT_PACK.map((tpl, i) => ({
      id: `DRAFT-${Date.now().toString(36).toUpperCase()}-CVP${i.toString().padStart(2, '0')}`,
      source: 'LOCAL_TEMPLATE_BATCH',
      title: tpl.title,
      filename: tpl.filename,
      category: tpl.category,
      targetFolder: tpl.targetFolder,
      content: tpl.content,
      draftType: tpl.draftType,
      templateId: tpl.id,
      riskLevel: 'LOW',
      approvalStatus: 'PENDING_REVIEW',
      approvalState: 'PENDING_REVIEW',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      openclawCall: 'NOT_SENT',
      filesystemWrite: 'DISABLED',
      apiMode: 'NO_API_LOCAL_ONLY',
      createdAt: now,
      updatedAt: now,
    }));

    const result = saveBatchToLocalStorage(drafts);

    if (result.ok) {
      setCount(drafts.length);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 6000);
      if (onBatchCreated) onBatchCreated(drafts.length);
    } else {
      setErrorMsg('Storage is full. Clear old non-approved drafts, shorten the markdown, or export evidence before saving.');
      setStatus('error');
    }
  };

  return (
    <div className="border border-accent/40 bg-accent/5 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-accent/20">
        <Package className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
          Generate Core Vault Pack
        </span>
        <span className="ml-auto px-2 py-0.5 text-[6px] font-bold uppercase bg-accent/10 text-accent border border-accent/20 rounded-sm">
          {CORE_VAULT_PACK.length} DRAFTS · LOCAL ONLY · NO API
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Draft list preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CORE_VAULT_PACK.map((tpl, i) => (
            <div key={tpl.id} className="flex items-start gap-2 px-3 py-2 bg-card/50 border border-border/30 rounded-sm">
              <span className="text-[7px] font-mono text-accent/60 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="text-[8px] font-bold text-slate-300">{tpl.title}</div>
                <div className="text-[6px] font-mono text-slate-500 truncate">{tpl.targetFolder}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Safety note */}
        <div className="text-[7px] font-mono text-slate-500 border-t border-border/20 pt-3">
          All drafts saved to <span className="text-slate-400">veridan_obsidian_drafts</span> with{' '}
          <span className="text-primary">PENDING_REVIEW</span> status.
          Vault write requires approval in Draft Review.
        </div>

        {/* Status messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-primary bg-primary/10 border border-primary/30 rounded-sm px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {count} Core Vault Pack drafts created. Go to Draft Review to approve before writing to vault.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
        >
          {status === 'generating'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Package className="w-4 h-4" /> Generate Core Vault Pack</>
          }
        </button>
      </div>
    </div>
  );
}