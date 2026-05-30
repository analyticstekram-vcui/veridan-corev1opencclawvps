/**
 * cvpTemplates.js
 * Single source of truth for Core Vault Pack template definitions.
 * Used by both CoreVaultPackGenerator and CoreVaultPackWorkflow.
 * NO API calls. NO OpenClaw dispatch. NO credentials. Local templates only.
 */

export const CORE_VAULT_PACK_TEMPLATES = [
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
- [ ] EIN still active
- [ ] Business banking accounts in good standing
- [ ] Insurance policies reviewed and current
- [ ] Operating agreement reviewed for necessary updates
- [ ] All distributions documented per agreement

## Asset Management Rules
- All assets must be titled to entity name
- No co-mingling with personal assets (ever)
- All significant transactions require board/trustee minutes
- Annual asset review and documentation required

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
| Vault write | veridan_obsidian_write_audits | After approved draft write |
| Gateway probe | OpenClawGatewayConnectorLog | After health check |
| Signer audit | OpenClawSignerAudit | After HMAC signing |
| Legacy review | OpenClawLegacyReview | Manual review of old commands |
| Access review | OpenClawAccessReview | Operator access events |

## Evidence Creation Protocol
1. Action occurs (approved vault write, gateway probe, etc.)
2. Audit record created immediately
3. Record includes: operatorId, timestamp, actionType, result
4. No secrets, tokens, or credentials in any audit record
5. Audit record is immutable after creation

## Monthly Audit Review
- [ ] Export all audit records from current month
- [ ] Verify evidence chain integrity
- [ ] Review for any anomalies or policy exceptions
- [ ] Document findings in this vault
- [ ] Escalate any policy violations immediately

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

## Approved Vault Structure
\`\`\`
Veridan Core/
├── Veridan Core System/
├── OpenClaw/
├── Trading/
├── Credit/
├── Business Formation/
├── Trust / Entities/
├── SOPs/
└── Daily Operations/
\`\`\`

## Allowlisted Write Targets
| Folder Path | Risk Level |
|---|---|
| Veridan Core/Veridan Core System | LOW |
| Veridan Core/OpenClaw | LOW |
| Veridan Core/Trading | LOW |
| Veridan Core/Credit | LOW |
| Veridan Core/Business Formation | LOW |
| Veridan Core/Trust / Entities | LOW |
| Veridan Core/SOPs | LOW |
| Veridan Core/Daily Operations | LOW |

## Write Governance Rules
1. Target folder must be in allowlist
2. approvalStatus: APPROVED
3. riskLevel: LOW
4. executionStatus: NOT_EXECUTED
5. Audit record created after every write
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

## Absolute Prohibitions (NEVER)
| Rule | Reason |
|---|---|
| No live money movement without multi-step approval | Capital protection |
| No credential storage in localStorage or frontend code | Security |
| No API calls in NO_API_LOCAL_ONLY mode | Credit conservation |
| No browser automation without approved proposal | Governance |
| No vault writes without APPROVED + LOW risk | Data integrity |
| No external dispatch without HMAC-signed approved proposal | Security |
| No deletion of audit records | Immutability |

## Execution State Defaults
\`\`\`
executionStatus:  NOT_EXECUTED
dispatchStatus:   NOT_DISPATCHED
openclawCall:     NOT_SENT
filesystemWrite:  DISABLED
\`\`\`

## API Credit Conservation (NO_API_LOCAL_ONLY)
- InvokeLLM: DISABLED
- GenerateImage: DISABLED
- SendEmail: DISABLED
- Local template generation: ENABLED (no credits)
- LocalStorage operations: ENABLED (no credits)
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

## Workflow Overview
\`\`\`
[Draft Created] → [Pending Review] → [Operator Review] → [Approved/Denied] → [Execute/Discard]
\`\`\`

## Step 1: Draft Created
- approvalStatus: PENDING_REVIEW
- riskLevel: LOW
- executionStatus: NOT_EXECUTED
- dispatchStatus: NOT_DISPATCHED

## Step 2: Draft Review
- Review: title, targetFolder, content, riskLevel
- Verify: no credentials, no external calls, folder is allowlisted

## Step 3: Approval Decision
- Approve → approvalStatus: APPROVED, riskLevel remains LOW, executionStatus remains NOT_EXECUTED
- Deny → draft stays PENDING_REVIEW or removed, no vault write occurs

## Step 4: Vault Write (After Approval Only)
- Required: APPROVED + LOW + NOT_EXECUTED + allowlisted folder
- Write via obsidianWriteApprovedDraft backend function
- Audit record created in veridan_obsidian_write_audits

## Step 5: Post-Write Audit
- filesystemWrite: COMPLETED_APPROVED_DRAFT_ONLY
- executionStatus: NOT_EXECUTED (unchanged)
- dispatchStatus: NOT_DISPATCHED (unchanged)
`,
  },
];

/**
 * Build draft objects from templates with fresh IDs and timestamps.
 * source is set to "CORE_VAULT_PACK" so the governed workflow can gate auto-approval.
 */
export function buildDrafts(now) {
  return CORE_VAULT_PACK_TEMPLATES.map((tpl, i) => ({
    id: `DRAFT-${Date.now().toString(36).toUpperCase()}-CVP${i.toString().padStart(2, '0')}`,
    source: 'CORE_VAULT_PACK',
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
}