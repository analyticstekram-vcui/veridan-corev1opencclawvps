# Veridan Core Repo Baseline Export Checklist

**Purpose**: Comprehensive checklist for migrating Veridan Core Base44 app to GitHub/Codex-managed repository.

**Status**: Ready for Migration
**Export Date**: 2026-05-19
**Target Repository**: veridan-core (or approved variant)

---

## Section A: Required Source Areas

All source areas listed below must be included in the repository export.

### Core Application Files
```
src/App.jsx                          [CRITICAL - Route definitions]
src/index.html                       [CRITICAL - HTML entry point]
src/index.css                        [CRITICAL - Design tokens]
src/main.jsx                         [CRITICAL - App bootstrap]
src/tailwind.config.js               [CRITICAL - Tailwind theme]
```

### Pages Directory (All Planning-Only Pages)
```
src/pages/
├── Dashboard.jsx
├── GlobalCommandDashboard.jsx       [NEW - Global status aggregation]
├── VeridanCoreSystemMap.jsx
├── AiCommandCenter.jsx              [Planning-only task tracking]
├── TradingCommandCenter.jsx         [Planning-only trading strategy]
├── PublicCreditCommandCenter.jsx    [Planning-only credit strategy]
├── BusinessFormationCommandCenter.jsx [Planning-only business formation]
├── ControlRoom.jsx
├── OpenClawControl.jsx
├── BrowserControl.jsx
├── BrowserSession.jsx
├── BrowserSessionRecords.jsx
├── CommandQueue.jsx
├── CreditLedger.jsx
└── [All other pages - must preserve routes]
```

### Components Directory (All Planning-Only Components)
```
src/components/
├── navigation/                      [Navigation components]
│   ├── ModuleNav.jsx
│   └── [All navigation components]
├── openclaw/                        [OpenClaw governance (read-only)]
│   └── [All 50+ OpenClaw components]
├── trading/                         [Trading planning module]
│   ├── TradingStrategyRegistry.jsx
│   ├── TradingRiskRuleBuilder.jsx
│   ├── TradingPaperReadinessChecklist.jsx
│   ├── TradingBrokerSandboxRequirements.jsx
│   ├── TradingViewMcpReadinessPanel.jsx
│   ├── TradingOperationsDashboard.jsx
│   ├── TradingModuleStatusSummary.jsx
│   └── [All trading components]
├── public-credit/                  [Public credit planning module]
│   ├── CreditProfilePlanning.jsx
│   ├── CreditDisputePlanner.jsx
│   ├── BureauMonitoringChecklist.jsx
│   ├── CreditTradelineTracker.jsx
│   ├── CreditGoalPlanner.jsx
│   ├── PublicCreditModuleStatusSummary.jsx
│   └── [All credit components]
├── business-formation/             [Business formation planning module]
│   ├── BusinessEntityRegistry.jsx
│   ├── TrustLlcStructurePlanner.jsx
│   ├── RegisteredAgentWorkflow.jsx
│   ├── EinBankCreditReadiness.jsx
│   ├── AffiliateRevenuePlanner.jsx
│   ├── BusinessFormationModuleStatusSummary.jsx
│   └── [All business components]
├── ai-command-center/              [AI command center planning module]
│   ├── SystemBriefPanel.jsx
│   ├── ProposedActionsPanel.jsx
│   ├── CodexTasksPanel.jsx
│   ├── OpenClawTasksPanel.jsx
│   ├── OperatorReviewPanel.jsx
│   ├── AiCommandCenterModuleStatusSummary.jsx
│   └── [All AI command center components]
├── ui/                             [UI component library]
│   └── [All shadcn/ui components]
├── governance/                     [Governance & policy components]
├── audit/                          [Audit & evidence components]
├── browser/                        [Browser control components]
├── credit/                         [Credit domain components]
├── business/                       [Business domain components]
├── knowledge/                      [Knowledge vault components]
├── dashboard/                      [Dashboard components]
├── controlroom/                    [Control room components]
├── terminal/                       [Terminal components]
└── [All other component subdirectories]
```

### Documentation Directory
```
src/docs/
├── AGENTS.md                        [Codex development rules - CRITICAL]
├── VERIDAN_CORE_CHECKPOINT.md       [System checkpoint - CRITICAL]
├── CODEX_WORKFLOW_POLICY.md         [Codex workflow - CRITICAL]
├── EXECUTION_BOUNDARY.md            [Execution boundaries - CRITICAL]
├── REPO_BASELINE_EXPORT_CHECKLIST.md [This file]
├── CODEX_SETUP_PACK_VERIFICATION.md [Setup verification]
├── baselines/                       [Baseline reference files]
│   ├── NAV_DASHBOARD_CONSISTENCY_BASELINE.json
│   ├── READ_ONLY_MONITORING_HARDENING_BASELINE.json
│   └── [All baseline files]
└── [All other documentation]
```

### Library & Utility Files
```
src/lib/
├── AuthContext.jsx
├── PageNotFound.jsx
├── query-client.js
├── utils.js
├── proposalStore.js
├── openclawVerification.js
├── rbac.js
├── app-params.js
├── vps-safe-command-bridge.md
└── [All utility files]
```

### API & Utils
```
src/api/
├── base44Client.js                 [Base44 SDK client]
└── [All API client files]

src/utils/
└── [All utility functions]

src/hooks/
└── [All custom React hooks]
```

### Configuration Files
```
tailwind.config.js                  [Tailwind configuration]
index.css                           [Global styles and CSS variables]
package.json                        [Dependencies - review only]
vite.config.js                      [Vite configuration]
```

### Root Documentation Files
```
AGENTS.md                           [Codex rules - TOP LEVEL]
```

---

## Section B: Required Routes To Preserve

These routes MUST be preserved exactly as defined in App.jsx.

```javascript
// Core Navigation
GET /                               → Dashboard (home)
GET /global-command-dashboard       → GlobalCommandDashboard (NEW - status aggregation)

// Major Command Centers
GET /trading-command-center         → TradingCommandCenter (planning-only)
GET /public-credit-command-center   → PublicCreditCommandCenter (planning-only)
GET /business-formation-command-center → BusinessFormationCommandCenter (planning-only)
GET /ai-command-center              → AiCommandCenter (planning-only task tracking)

// Monitoring & Governance
GET /openclaw-governance            → OpenClawGovernanceDashboard (read-only)
GET /openclaw-control               → OpenClawControl (monitoring)

// Operational Dashboards
GET /credit-ledger                  → CreditLedger
GET /browser-control                → BrowserControl
GET /command-queue                  → CommandQueue
GET /browser-session                → BrowserSession
GET /browser-session-records        → BrowserSessionRecords
GET /control-room                   → ControlRoom
GET /knowledge-vault                → VeridanKnowledgeVaultDashboard
GET /credit-public-side             → CreditPublicSideDashboard
GET /business-operations            → BusinessOperationsDashboard
GET /trading-operations             → TradingOperationsDashboard
GET /system-map                     → VeridanCoreSystemMap
GET /audit-evidence                 → AuditEvidenceDashboard

// Planning & Governance
GET /baseline-evidence              → BaselineEvidenceConsolidation
GET /dry-run-bridge-planning        → DryRunBridgePlanning
GET /dry-run-backend-contract       → DryRunBackendContractPlanning
GET /approval-workflow-planning     → ApprovalWorkflowPlanning

// Catch-all
GET *                               → PageNotFound (404 handler)
```

### Route Preservation Rules
- ✅ All route paths must be identical
- ✅ All page components must be imported and mapped correctly
- ✅ All route definitions must preserve query parameter handling
- ✅ No new routes without explicit approval
- ✅ No route removal without approval
- ✅ No route parameter changes

---

## Section C: Required localStorage Keys To Preserve

**Total Keys Protected**: 40+

All localStorage keys below must be preserved exactly. No key names can be modified.

### Trading Module (6 keys)
```javascript
veridanTradingModuleStatusSnapshot          // Module status snapshot
veridanTradingStrategyRegistry              // Trading strategies
veridanTradingRiskRules                     // Risk rules
veridanTradingBrokerSandboxChecklist        // Sandbox readiness
veridanTradingPaperReadinessChecklist       // Paper trading readiness
veridanTradingViewMcpReadiness              // MCP integration planning
```

### Public Credit Module (6 keys)
```javascript
veridanPublicCreditModuleStatusSnapshot     // Module status snapshot
veridanCreditProfilePlans                   // Credit profile plans
veridanCreditDisputePlans                   // Dispute strategies
veridanBureauMonitoringChecklist            // Bureau monitoring plans
veridanCreditTradelineTracker               // Tradeline tracking
veridanCreditGoalPlans                      // Credit goal planning
```

### Business Formation Module (6 keys)
```javascript
veridanBusinessFormationModuleStatusSnapshot // Module status snapshot
veridanBusinessEntityRegistry               // Entity registry
veridanTrustLlcStructurePlans              // Structure planning
veridanRegisteredAgentWorkflows             // Registered agent workflows
veridanEinBankCreditReadiness               // Readiness tracking
veridanAffiliateRevenuePlans                // Revenue planning
```

### AI Command Center (5 keys)
```javascript
veridanAiCommandCenterSystemBriefSnapshot   // System brief
veridanAiProposedActions                    // Proposed actions
veridanAiCodexTaskDrafts                    // Codex task drafts
veridanAiOpenClawTaskPlans                  // OpenClaw task plans
veridanAiOperatorReviewRecords              // Operator reviews
```

### Global Command Dashboard (1 key)
```javascript
veridanGlobalCommandDashboardStatusSnapshot // Global status snapshot
```

### OpenClaw Governance (5 keys)
```javascript
openclawGovernanceDryRunChainCheckpointLockPhases43To49 // Governance phases 43-49
openclawPhase50ExecutionReadinessBoundaryMap            // Execution readiness
openclawPhase51SecurityBoundaryPolicy                   // Security policy
openclawPhase52ExecutionPolicyBoundary                  // Execution policy
openclawPhase53BackendBoundaryPolicy                    // Backend policy
```

### Key Preservation Rules
- ✅ All key names must be preserved exactly
- ✅ No key name modifications or aliases
- ✅ No key consolidation or merging
- ✅ No key splitting or decomposition
- ✅ All data in all keys must be preserved
- ✅ localStorage write patterns must be identical
- ✅ localStorage read patterns must be identical

---

## Section D: Required Export Snapshot Types To Preserve

All snapshotType values below must be preserved exactly in export functions.

### Trading Module
```javascript
"snapshotType": "VERIDAN_TRADING_MODULE_STATUS_SNAPSHOT"
"snapshotType": "VERIDAN_TRADING_STRATEGY_REGISTRY"
"snapshotType": "VERIDAN_TRADING_RISK_RULES"
"snapshotType": "VERIDAN_TRADING_BROKER_SANDBOX_READINESS"
```

### Public Credit Module
```javascript
"snapshotType": "VERIDAN_PUBLIC_CREDIT_MODULE_STATUS_SNAPSHOT"
"snapshotType": "VERIDAN_CREDIT_PROFILE_PLANS"
"snapshotType": "VERIDAN_CREDIT_DISPUTE_PLANS"
"snapshotType": "VERIDAN_BUREAU_MONITORING_CHECKLIST"
"snapshotType": "VERIDAN_CREDIT_TRADELINE_TRACKER"
"snapshotType": "VERIDAN_CREDIT_GOAL_PLANS"
```

### Business Formation Module
```javascript
"snapshotType": "VERIDAN_BUSINESS_FORMATION_MODULE_STATUS_SNAPSHOT"
"snapshotType": "VERIDAN_BUSINESS_ENTITY_REGISTRY"
"snapshotType": "VERIDAN_TRUST_LLC_STRUCTURE_PLANS"
"snapshotType": "VERIDAN_REGISTERED_AGENT_WORKFLOWS"
"snapshotType": "VERIDAN_EIN_BANK_CREDIT_READINESS"
"snapshotType": "VERIDAN_AFFILIATE_REVENUE_PLANS"
```

### AI Command Center
```javascript
"snapshotType": "VERIDAN_AI_COMMAND_CENTER_SYSTEM_BRIEF"
"snapshotType": "VERIDAN_AI_PROPOSED_ACTIONS"
"snapshotType": "VERIDAN_AI_CODEX_TASK_DRAFTS"
"snapshotType": "VERIDAN_AI_OPENCLAW_TASK_PLANS"
"snapshotType": "VERIDAN_AI_OPERATOR_REVIEW_RECORDS"
```

### Global Command Dashboard
```javascript
"snapshotType": "VERIDAN_GLOBAL_COMMAND_DASHBOARD_STATUS"
```

### OpenClaw Governance
```javascript
"snapshotType": "VERIDAN_OPENCLAW_GOVERNANCE_DRY_RUN_CHAIN_CHECKPOINT"
"snapshotType": "VERIDAN_OPENCLAW_EXECUTION_READINESS_BOUNDARY"
"snapshotType": "VERIDAN_OPENCLAW_SECURITY_BOUNDARY_POLICY"
"snapshotType": "VERIDAN_OPENCLAW_EXECUTION_POLICY_BOUNDARY"
"snapshotType": "VERIDAN_OPENCLAW_BACKEND_BOUNDARY_POLICY"
```

### Codex Setup Pack
```javascript
"snapshotType": "VERIDAN_CODEX_SETUP_PACK_VERIFICATION"
"snapshotType": "VERIDAN_AI_COMMAND_CENTER_SYSTEM_BRIEF"  // Duplicate - also used by system brief
```

### Export Format Preservation Rules
- ✅ All snapshotType values must be preserved exactly
- ✅ No snapshotType renaming
- ✅ No snapshotType consolidation
- ✅ All export JSON structures must be preserved
- ✅ All export field names must be preserved
- ✅ All export data types must be preserved

---

## Section E: Migration Rules

Rules that MUST be followed when migrating code to external repository.

### Rule 1: localStorage Key Preservation
- ✅ All 40+ localStorage keys must keep exact same names
- ✅ No abbreviations
- ✅ No renaming for consistency
- ✅ All write operations must use same keys
- ✅ All read operations must use same keys
- ✅ All import/export operations must reference same keys

**Verification**: Grep entire codebase for localStorage key usage. All keys must exactly match Section C above.

### Rule 2: Export Snapshot Type Preservation
- ✅ All snapshotType values must match Section D exactly
- ✅ No snapshotType modifications
- ✅ All export functions must use same snapshotType values
- ✅ All import validations must accept same snapshotType values

**Verification**: Grep for "snapshotType": All values must match Section D.

### Rule 3: safetyClaims Array Preservation
- ✅ All safetyClaims arrays must be preserved in exports
- ✅ All safety claim strings must be identical
- ✅ No safety claim removal
- ✅ No safety claim modification
- ✅ No safety claim reordering (optional but preserve if possible)

**Examples of Protected Claims**:
```javascript
"Planning-only operations"
"No execution"
"No external API mutation"
"No credential handling"
"No backend mutation"
"Browser-only export"
```

### Rule 4: Disabled Execution Status Preservation
- ✅ All DISABLED status fields must remain DISABLED
- ✅ All status rows showing "DISABLED" must be preserved
- ✅ All execution boundary fields must match Section D
- ✅ No status field changes without approval

**Examples**:
```javascript
"Trading execution": "DISABLED"
"Broker API calls": "DISABLED"
"Credit bureau API calls": "DISABLED"
"OpenClaw dispatch": "DISABLED"
"Codex execution": "DISABLED"
```

### Rule 5: Planning-Only Language Preservation
- ✅ All "planning-only" text must be preserved
- ✅ All "no execution" disclaimers must be preserved
- ✅ All safety warnings must be preserved
- ✅ All boundary disclaimers must be preserved
- ✅ UI labels referencing planning/execution must not change

**Examples**:
```
"Planning-only module"
"No execution logic"
"Planning only. Codex tasks do not execute Codex..."
"Planning-only interface"
"Read-only monitoring"
"Dry-run only (not live)"
```

### Rule 6: Route Preservation
- ✅ All routes in Section B must be preserved exactly
- ✅ No route path changes
- ✅ No route removal
- ✅ No route consolidation
- ✅ No route parameter modifications
- ✅ App.jsx route definitions must be identical

**Verification**: Check App.jsx routes match Section B exactly.

### Rule 7: Tab Label Preservation
- ✅ All tab labels must be preserved exactly
- ✅ AI Command Center tabs: System Brief, Proposed Actions, Codex Tasks, OpenClaw Tasks, Operator Review
- ✅ All tab order must be preserved
- ✅ All tab functionality must be preserved

### Rule 8: Button Label Preservation
- ✅ All button labels must be preserved unless explicitly approved by operator
- ✅ Export button labels (must contain "Export")
- ✅ Add/Create button labels
- ✅ Save button labels
- ✅ Cancel button labels
- ✅ Review/Approve/Reject button labels

---

## Section F: Prohibited Migration Changes

These changes are FORBIDDEN. Any deviation requires explicit operator approval and security review.

### Execution & Automation
- ❌ Do not add execution logic
- ❌ Do not add task runners
- ❌ Do not add schedulers
- ❌ Do not add timers
- ❌ Do not add polling
- ❌ Do not add automated dispatchers

### Backend & Database
- ❌ Do not add backend routes
- ❌ Do not add database mutation code
- ❌ Do not add data submission endpoints
- ❌ Do not add webhook receivers (except read-only)
- ❌ Do not add batch processing

### API & Integration
- ❌ Do not add fetch calls
- ❌ Do not add HTTP client code
- ❌ Do not add broker API calls
- ❌ Do not add bank API calls
- ❌ Do not add credit bureau API calls
- ❌ Do not add legal filing APIs
- ❌ Do not add payment processing
- ❌ Do not add email sending
- ❌ Do not add SMS sending
- ❌ Do not add external service integration

### Codex & OpenClaw
- ❌ Do not add Codex dispatch logic
- ❌ Do not add Codex task runners
- ❌ Do not add Codex execution
- ❌ Do not add OpenClaw dispatch
- ❌ Do not add OpenClaw execution
- ❌ Do not add MCP tool calls

### Browser & Automation
- ❌ Do not add browser automation
- ❌ Do not add DOM manipulation logic
- ❌ Do not add page navigation logic
- ❌ Do not add click/type automation

### Credentials & Secrets
- ❌ Do not add credential input fields
- ❌ Do not add password input fields
- ❌ Do not add API key input fields
- ❌ Do not add secret submission code
- ❌ Do not add credential storage code
- ❌ Do not expose environment variables

### Workflow Changes
- ❌ Do not modify approval workflow
- ❌ Do not remove review gates
- ❌ Do not remove safety checks
- ❌ Do not modify CRITICAL risk handling
- ❌ Do not bypass operator review

---

## Section G: Codex First Task After Repo Import

**CRITICAL TASK**: After importing Veridan Core repository, the FIRST Codex task must be:

### Task Title
"Audit Veridan Core for UI Patterns, Components, and Logic Duplication"

### Task Instructions
```
Execute a comprehensive code audit of Veridan Core with these objectives:

1. UI Pattern Duplication
   - Identify repeated UI patterns (summary cards, status displays, etc.)
   - Find components that could share common patterns
   - Document shared patterns and variations

2. Oversized Component Analysis
   - Identify components larger than 400 lines
   - Evaluate splitability
   - Suggest sub-component extraction

3. Repeated Export Logic
   - Find duplicate JSON export functions
   - Identify common export patterns
   - Suggest shared export utility

4. Repeated localStorage Utilities
   - Find duplicate localStorage read/write functions
   - Identify common localStorage patterns
   - Suggest shared utility library

5. Summary Card Duplication
   - Count summary card implementations
   - Identify styling/layout duplications
   - Suggest shared summary card component

6. Form Input Duplication
   - Find repeated form patterns
   - Identify common validation logic
   - Suggest form utilities library

7. Status Display Duplication
   - Find repeated status row patterns
   - Identify repeated badge/tag patterns
   - Suggest status display components

### Output Requirements
Return a REFACTOR PLAN ONLY. Do not make any code changes.

Refactor plan must include:
- List of duplicated patterns with file references
- Suggested shared components/utilities
- Estimated refactoring effort (hours)
- Impact assessment (which components would benefit)
- Risk assessment (refactoring risk level)
- Implementation order (which refactorings first)

### Critical Constraint
DO NOT EDIT ANY FILES until this plan is approved by operator.
```

### Task Preservation Rules
- ✅ This task must be created as Codex task draft in AI Command Center
- ✅ Operator must review and approve before implementation
- ✅ Task must output refactor plan ONLY (no code changes)
- ✅ Operator must approve plan before Codex proceeds with refactoring
- ✅ All refactorings must preserve localStorage keys
- ✅ All refactorings must preserve export formats
- ✅ All refactorings must preserve safetyClaims
- ✅ All refactorings must preserve routes
- ✅ All refactorings must preserve planning-only language
- ✅ No execution logic can be added during refactoring

---

## Migration Checklist

Use this checklist to verify repo baseline export is complete.

### Pre-Export Verification
- [ ] All source areas identified (Section A)
- [ ] All routes documented (Section B)
- [ ] All localStorage keys listed (Section C)
- [ ] All snapshot types documented (Section D)
- [ ] Migration rules reviewed (Section E)
- [ ] Prohibited changes understood (Section F)
- [ ] Codex first task prepared (Section G)

### Export Execution
- [ ] Clone/create target repository
- [ ] Copy all files from Section A
- [ ] Verify App.jsx routes match Section B
- [ ] Verify package.json dependencies correct
- [ ] Verify configuration files present
- [ ] Verify all documentation files present
- [ ] Create initial GitHub branch
- [ ] Set up initial CI/CD (if applicable)

### Post-Export Verification
- [ ] All routes resolve correctly
- [ ] All components render without error
- [ ] localStorage read/write functions work
- [ ] Export snapshot functions work
- [ ] All safetyClaims present in exports
- [ ] All disabled status rows present
- [ ] Planning-only language present
- [ ] No execution logic detected
- [ ] No API calls detected
- [ ] No credential handling detected

### Codex Integration
- [ ] AGENTS.md reviewed
- [ ] CODEX_WORKFLOW_POLICY.md reviewed
- [ ] EXECUTION_BOUNDARY.md reviewed
- [ ] First audit task created
- [ ] Operator approval obtained
- [ ] Refactor plan received
- [ ] Operator approves refactor plan
- [ ] Codex refactoring begins

---

## Important Notes

### Preservation is Critical
This baseline export represents a complete, safe, planning-only state. Every preserved element serves a purpose:
- localStorage keys maintain app state
- Routes maintain navigation
- Export formats maintain data portability
- safetyClaims maintain safety documentation
- Disabled status fields maintain execution boundaries

### No Modifications Without Approval
Any change to items in Sections A-D requires explicit operator approval and may trigger security review.

### Codex Workflow
Codex work begins with the audit task (Section G). All subsequent refactoring:
1. Must preserve items in Sections A-D
2. Must follow AGENTS.md rules
3. Must comply with CODEX_WORKFLOW_POLICY.md
4. Must respect EXECUTION_BOUNDARY.md
5. Must maintain planning-only nature
6. Must preserve all safetyClaims

### Questions?
If unclear about any requirement, escalate to operator before proceeding.

---

**Checklist Status**: ✅ READY FOR MIGRATION
**Export Date**: 2026-05-19
**Target Repo**: veridan-core
**Codex Ready**: YES (after audit task completion)