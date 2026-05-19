# Codex Development Rules for Veridan Core

## Overview
This document defines rules, boundaries, and approved capabilities for Codex-managed development of Veridan Core Base44 app.

## Approved Codex Capabilities

### UI Development
- ✅ Refactor existing UI components
- ✅ Create new planning-only UI components
- ✅ Improve component organization and maintainability
- ✅ Update styling with Tailwind CSS
- ✅ Create responsive layouts
- ✅ Add new form inputs or data display components

### Documentation & Testing
- ✅ Write and improve documentation
- ✅ Create test files for components
- ✅ Document component APIs
- ✅ Create implementation guides

### Code Quality
- ✅ Refactor existing code for clarity
- ✅ Improve code organization
- ✅ Fix bugs in planning logic
- ✅ Add error handling for browser-side operations

## Prohibited Codex Capabilities

### Execution & Automation
- ❌ Add execution logic
- ❌ Add automated task runners
- ❌ Add timers, intervals, or polling
- ❌ Add scheduler logic
- ❌ Implement automation frameworks

### Backend & APIs
- ❌ Create backend routes
- ❌ Add fetch/HTTP calls
- ❌ Add OpenAI API calls
- ❌ Add external API integrations (except documented read-only historical data)
- ❌ Add database mutation logic
- ❌ Add credential submission routes

### System Integration
- ❌ Add shell command execution
- ❌ Add GitHub API calls or mutations
- ❌ Add deployment logic
- ❌ Add Codex self-execution
- ❌ Add OpenClaw dispatch
- ❌ Add MCP (Model Context Protocol) calls
- ❌ Add browser automation execution

### External Service Mutations
- ❌ Broker API calls (trading, account creation, order placement)
- ❌ Bank API calls (account opening, transfers)
- ❌ Credit bureau API calls (dispute filing, reporting)
- ❌ Legal filing services
- ❌ Payment processing
- ❌ Email sending (except documentation)
- ❌ SMS sending
- ❌ Webhook callbacks to external systems

### Security & Credentials
- ❌ Add password fields
- ❌ Add API key input fields
- ❌ Add credential handling
- ❌ Add secret storage in localStorage
- ❌ Add secret submission to backend
- ❌ Expose environment variables

## localStorage Preservation Rules

### Protected Keys (Must Not Modify)
Codex must preserve the following localStorage keys exactly as defined:

**Module Status Snapshots:**
- `veridanTradingModuleStatusSnapshot`
- `veridanPublicCreditModuleStatusSnapshot`
- `veridanBusinessFormationModuleStatusSnapshot`
- `veridanAiCommandCenterModuleStatusSnapshot`
- `veridanGlobalCommandDashboardStatusSnapshot`

**OpenClaw Governance:**
- `openclawGovernanceDryRunChainCheckpointLockPhases43To49`
- `openclawPhase50ExecutionReadinessBoundaryMap`
- `openclawPhase51SecurityBoundaryPolicy`
- `openclawPhase52ExecutionPolicyBoundary`
- `openclawPhase53BackendBoundaryPolicy`

**AI Command Center:**
- `veridanAiProposedActions`
- `veridanAiCodexTaskDrafts`
- `veridanAiOpenClawTaskPlans`
- `veridanAiOperatorReviewRecords`

**Trading Module:**
- `veridanTradingModuleStatusSnapshot`
- `veridanTradingStrategyRegistry`
- `veridanTradingRiskRules`
- `veridanTradingBrokerSandboxChecklist`
- `veridanTradingPaperReadinessChecklist`
- `veridanTradingViewMcpReadiness`

**Public Credit Module:**
- `veridanPublicCreditModuleStatusSnapshot`
- `veridanCreditProfilePlans`
- `veridanCreditDisputePlans`
- `veridanBureauMonitoringChecklist`
- `veridanCreditTradelineTracker`
- `veridanCreditGoalPlans`

**Business Formation Module:**
- `veridanBusinessFormationModuleStatusSnapshot`
- `veridanBusinessEntityRegistry`
- `veridanTrustLlcStructurePlans`
- `veridanRegisteredAgentWorkflows`
- `veridanEinBankCreditReadiness`
- `veridanAffiliateRevenuePlans`

### Export Format Preservation
Codex must preserve all JSON export formats exactly, including:
- `snapshotType` field values
- `safetyClaims` arrays
- Safety disclaimer fields
- Execution boundary status fields
- Timestamp formats

## Safety Claims Preservation

All Codex-created or modified components must maintain existing safetyClaims arrays. Examples:
- Planning-only operations
- No execution
- No external API mutation
- No credential handling
- No backend mutation
- Browser-only export

When Codex adds new components, it must include appropriate safetyClaims.

## Codex Task Workflow

1. **Proposal Phase**: Operator creates proposed action in AI Command Center
2. **Draft Phase**: If action requires code work, operator creates Codex task draft (in AI Command Center or directly)
3. **Review Phase**: Operator reviews Codex task and approves or rejects
4. **Implementation Phase**: Codex implements approved tasks (NOT directly from Veridan Core app)
5. **Verification Phase**: Operator verifies results match safety boundaries

**Note**: Codex does not run from Veridan Core yet. Task execution is manual or through external Codex system.

## File Structure Rules

### Do Not Modify Without Explicit Approval
- App.jsx (route definitions)
- tailwind.config.js (theme tokens)
- index.css (CSS variables and base styles)
- entities/ (entity schemas)
- functions/ (backend functions)

### Safe to Create/Modify
- pages/ (planning-only pages)
- components/ (planning-only components)
- docs/ (documentation)
- utils/ (utility functions for planning logic)
- hooks/ (custom React hooks)
- lib/ (planning libraries, NOT authentication or backend)

## Verification Checklist for Codex Changes

Before submitting a Codex task, verify:

- [ ] No new execution logic added
- [ ] No fetch/HTTP calls added (except in documented examples)
- [ ] No new backend routes referenced
- [ ] No OpenAI API calls added
- [ ] No credential fields or handling added
- [ ] No shell command logic added
- [ ] No GitHub API calls added
- [ ] No OpenClaw dispatch logic added
- [ ] No MCP tool calls added
- [ ] No browser automation logic added
- [ ] All localStorage keys preserved
- [ ] Export formats unchanged
- [ ] safetyClaims arrays maintained
- [ ] UI only (React components, Tailwind CSS)
- [ ] No timers, intervals, or polling
- [ ] No database mutation
- [ ] No external service API calls (except read-only historical data)
- [ ] All components are planning-only

## Examples of Approved Work

✅ Refactor TaskForm component for better UX
✅ Create new CreditProfilePlanner component
✅ Add unit tests for validation functions
✅ Improve documentation with examples
✅ Reorganize components folder structure
✅ Update styling for consistency
✅ Fix bug in localStorage read logic
✅ Create new planning-only dashboard

## Examples of Prohibited Work

❌ Add broker API integration
❌ Create backend route for payment processing
❌ Add OpenAI API call to summarize data
❌ Implement task scheduler
❌ Add GitHub webhook receiver
❌ Create shell command executor
❌ Add credential input field
❌ Implement OpenClaw task dispatcher
❌ Add MCP tool integration
❌ Create browser automation controller

---

**Last Updated**: 2026-05-19
**Policy Version**: 1.0
**Status**: Active