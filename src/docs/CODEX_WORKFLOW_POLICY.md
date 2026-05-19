# Codex Workflow Policy for Veridan Core

## Overview

This document defines how Codex integrates with Veridan Core for managed development, including task workflow, approval gates, and execution constraints.

## Core Principle

**Codex does not execute from Veridan Core.** All Codex tasks are drafted in Veridan Core (AI Command Center), manually reviewed by operators, and executed through external Codex systems.

---

## Workflow Lifecycle

### Phase 1: Operator Creates Proposed Action
**Location**: AI Command Center → Proposed Actions tab

**Operator Input:**
- Action title
- Source module
- Action type (Review, Plan, Refactor, Research, Prepare Offline Action, etc.)
- Priority level (Low, Medium, High, Critical)
- Risk level (Low, Medium, High, Critical)
- Proposed reason
- Expected outcome
- Target record reference (optional)
- Operator notes

**Output:**
- Proposed action record stored in localStorage
- Status: DRAFT

**Safety Gate:**
- If risk level is CRITICAL and operator tries to set status to APPROVED_FOR_PLANNING, status is automatically downgraded to NEEDS_REVIEW
- Operator must explicitly review CRITICAL items before approval

---

### Phase 2: Operator Creates Codex Task Draft
**Location**: AI Command Center → Codex Tasks tab

**Prerequisites:**
- Proposed action exists (optional reference)
- Operator has determined code changes are needed

**Operator Input:**
- Task title
- Source proposed action ID (optional link)
- Target repo (veridan-core, veridan-core-base44-export, openclaw-integration, docs-only, Not Decided)
- Target area (Trading, Public Credit, Business Formation, AI Command Center, OpenClaw Governance, Shared Components, Docs, Other)
- Task type (Refactor, Bug Fix, Create Component, Write Tests, Documentation, Repo Cleanup, Safety Review, Other)
- Task priority (Low, Medium, High, Critical)
- Task risk (Low, Medium, High, Critical)
- Codex instruction (what Codex should do)
- Preservation rules (what must be preserved)
- Forbidden actions (what Codex cannot do)
- Operator notes

**Output:**
- Codex task draft stored in localStorage
- Status: DRAFT

**Safety Gate:**
- Same CRITICAL risk downgrade applies
- CRITICAL Codex tasks are automatically moved to NEEDS_REVIEW

**Safety Claims Embedded:**
- No Codex execution
- No shell commands
- No GitHub calls
- No repo mutation (from app)
- No deployment
- No OpenClaw dispatch
- No external API mutation
- No credential handling
- Browser-only export

---

### Phase 3: Operator Reviews Codex Task
**Location**: AI Command Center → Operator Review tab

**Review Queue shows:**
- All Codex tasks with status NEEDS_REVIEW or APPROVED_FOR_MANUAL_CODEX_RUN
- Task title, repo, area, risk level, status

**Operator Actions:**
- Enter reviewer name
- Select decision: APPROVED, REJECTED, or NEEDS_CHANGES
- Add review note
- Save review record

**Output:**
- Operator review record created in localStorage
- Fields captured:
  - reviewId
  - reviewedAt (ISO timestamp)
  - reviewType: "CODEX_TASK_REVIEW"
  - sourceRecordId (Codex task ID)
  - sourceTitle
  - sourceStatus
  - reviewerName
  - reviewDecision (APPROVED, REJECTED, or NEEDS_CHANGES)
  - reviewNote
  - executionAllowed: false (always)
  - codexExecutionAllowed: false (always)
  - safetyClaims (embedded)

**Key Constraint:**
- executionAllowed is ALWAYS set to false
- codexExecutionAllowed is ALWAYS set to false
- This prevents automatic task execution from the app

---

### Phase 4: Manual Codex Implementation (External)

**Process:**
1. Operator takes approved Codex task review to external Codex system
2. Operator creates Codex task in external system with:
   - Task title
   - Target repo reference
   - Codex instructions
   - Preservation rules
   - Forbidden actions
   - Risk assessment
   - Operator approval evidence

3. Codex implements approved work in external environment

4. Operator verifies results match:
   - AGENTS.md rules
   - localStorage key preservation
   - Export format preservation
   - Safety claims maintenance
   - No execution logic added
   - No API/backend/credential logic added

**NO automatic dispatch from Veridan Core.**

---

### Phase 5: Operator Verification & Integration

**Operator Verifies:**
- [ ] Code changes match approved task
- [ ] All AGENTS.md rules followed
- [ ] No execution logic added
- [ ] No backend routes added
- [ ] No fetch/API calls added
- [ ] No credential fields added
- [ ] localStorage keys preserved
- [ ] Export formats unchanged
- [ ] safetyClaims maintained
- [ ] Tests pass (if test task)
- [ ] Documentation updated

**Integration Process:**
- Operator merges approved changes into appropriate branch
- Operator updates module status snapshot in localStorage if needed
- Operator documents work in operator notes

---

## Codex Task Types

### 1. Refactor Component
**Constraints:**
- Preserve React component structure
- Maintain all props and state
- Keep event handlers functional
- Preserve localStorage access
- Don't change UI significantly

**Examples:**
- Split large component into smaller components
- Extract custom hooks
- Improve variable naming
- Reduce component depth

---

### 2. Bug Fix
**Constraints:**
- Fix only identified bug
- Don't introduce new features
- Maintain existing API
- Don't change localStorage keys
- Preserve all safety claims

**Examples:**
- Fix localStorage read/write error
- Fix state update bug
- Fix form validation
- Fix export formatting

---

### 3. Create Component
**Constraints:**
- Planning-only functionality
- No execution logic
- No API calls
- No credential handling
- Must use existing patterns
- Must include safetyClaims

**Examples:**
- New dashboard component
- New planning form
- New status display
- New export utility

---

### 4. Write Tests
**Constraints:**
- Unit tests only
- No integration tests with external systems
- Test planning logic and UI components
- Don't test API calls or execution logic

**Examples:**
- Component rendering tests
- localStorage read/write tests
- Form validation tests
- Data export formatting tests

---

### 5. Documentation
**Constraints:**
- No execution examples
- No API integration guides
- Document planning workflows
- Explain safety boundaries
- Include examples of approved/prohibited work

**Examples:**
- Component API documentation
- Feature usage guides
- Architecture explanations
- Codex rule examples

---

### 6. Repo Cleanup
**Constraints:**
- Don't delete any core files
- Preserve all entities/functions
- Don't modify App.jsx routes without approval
- Organize existing code

**Examples:**
- Remove unused imports
- Consolidate similar components
- Organize folder structure
- Update README

---

### 7. Safety Review
**Constraints:**
- Document potential risks
- Suggest mitigations (not implement)
- Don't modify code
- Report findings only

**Examples:**
- Audit localStorage usage
- Review data flows
- Check for credential exposure
- Verify safety claims accuracy

---

## Forbidden Codex Actions (App-Level)

These actions are prohibited at the app level and cannot be done by Codex from Veridan Core:

### No Shell Commands
- ❌ Cannot execute `npm run build`
- ❌ Cannot run Git commands
- ❌ Cannot execute bash/zsh scripts
- ❌ Cannot call system utilities

**Why**: Shell commands are external to the app and would require separate approval.

---

### No GitHub Mutations
- ❌ Cannot create branches
- ❌ Cannot push commits
- ❌ Cannot create pull requests
- ❌ Cannot merge code
- ❌ Cannot trigger CI/CD

**Why**: GitHub operations happen in external system; must be tracked separately.

---

### No Deployment
- ❌ Cannot deploy to production
- ❌ Cannot trigger build process
- ❌ Cannot update live environment
- ❌ Cannot release new versions

**Why**: Deployment requires security review and external approval.

---

### No App-Level Codex Execution
- ❌ Codex tasks are NOT executed by the app
- ❌ No backend route for Codex dispatch
- ❌ No webhook receiver for Codex callbacks
- ❌ No automated task runner in app

**Why**: Veridan Core is planning-only. Codex runs externally.

---

## Approval Workflow Diagram

```
┌─────────────────────┐
│  Proposed Action    │
│  (AI Command Center)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Codex Task Draft   │
│  (AI Command Center)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Operator Review    │
│  (AI Command Center)│
└──────────┬──────────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
┌──────────┐ ┌─────────┐
│ APPROVED │ │REJECTED │
└────┬─────┘ └─────────┘
     │
     ▼
┌─────────────────────┐
│ External Codex      │
│ Implementation      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Operator Verifies   │
│ Results             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Integrate Changes   │
│ Update Snapshots    │
└─────────────────────┘
```

---

## Critical Safety Gates

### Gate 1: CRITICAL Risk Downgrade
- If task has CRITICAL risk AND operator tries to approve directly
- Status is automatically downgraded to NEEDS_REVIEW
- Operator must explicitly review and provide justification

### Gate 2: Execution Prevention
- executionAllowed field is HARDCODED to false in all reviews
- codexExecutionAllowed field is HARDCODED to false in all reviews
- No pathway for app-level Codex execution

### Gate 3: localStorage Preservation
- All 30+ protected localStorage keys are read-only
- Export functions preserve all key-value pairs
- No migration or transformation allowed without approval

### Gate 4: Boundary Enforcement
- AGENTS.md rules are normative
- All Codex work must comply
- Operator verification step checks compliance

---

## Codex Task Status Lifecycle

```
DRAFT
  ↓
NEEDS_REVIEW (automatic if risk=CRITICAL)
  ├─→ APPROVED_FOR_MANUAL_CODEX_RUN (if approved)
  ├─→ REJECTED (if rejected)
  └─→ NEEDS_REVIEW (if changes requested)

APPROVED_FOR_MANUAL_CODEX_RUN
  ↓
[External Codex Implementation]
  ↓
[Operator Verification]
  ↓
[Integration Complete]
```

---

## Operator Responsibilities

### Before Creating Codex Task
- [ ] Understand what code changes are needed
- [ ] Ensure no execution logic is required
- [ ] Check AGENTS.md for approval
- [ ] Document reason and expected outcome

### During Codex Task Creation
- [ ] Specify clear instructions
- [ ] List all preservation rules
- [ ] Specify all forbidden actions
- [ ] Provide target repo and area
- [ ] Set appropriate risk level

### During Codex Task Review
- [ ] Verify task matches proposed action
- [ ] Check risk level is appropriate
- [ ] Review preservation rules
- [ ] Document review decision
- [ ] Provide clear feedback

### After Codex Implementation
- [ ] Verify code changes match approved task
- [ ] Check AGENTS.md compliance
- [ ] Test functionality
- [ ] Verify localStorage keys preserved
- [ ] Update module snapshots if needed
- [ ] Document integration

---

## Example Codex Workflow

### Example 1: Refactor Trading Strategy Component

**Step 1: Create Proposed Action**
- Title: "Improve Trading Strategy Form UX"
- Type: Refactor
- Priority: Medium
- Risk: Low
- Expected Outcome: Cleaner code, better validation
- Status: DRAFT → APPROVED_FOR_PLANNING

**Step 2: Create Codex Task Draft**
- Title: "Refactor TradingStrategyRegistry Component"
- Source Proposed Action: Link to step 1
- Target Repo: veridan-core
- Target Area: Trading
- Task Type: Refactor
- Priority: Medium
- Risk: Low
- Instructions: "Split large component into smaller sub-components, extract custom hook for form state"
- Preservation Rules: "Maintain all localStorage keys, preserve form validation logic, keep event handlers"
- Forbidden Actions: "Don't add API calls, don't change UI layout, don't modify data structure"
- Status: DRAFT

**Step 3: Operator Reviews**
- Reviewer: operator@example.com
- Decision: APPROVED
- Note: "Clear refactoring task. UI changes improve UX without functional impact."
- executionAllowed: false
- codexExecutionAllowed: false

**Step 4: External Codex Implements**
- Takes approved task to external Codex
- Codex refactors component
- Creates unit tests
- Verifies localStorage keys unchanged

**Step 5: Operator Verifies & Integrates**
- Checks code changes match task
- Runs tests
- Verifies localStorage keys
- Merges to development branch
- Updates trading module snapshot

---

## Questions & Escalation

**Question**: "Can Codex add new routes?"
**Answer**: Not without explicit approval. Contact operator for route review.

**Question**: "Can Codex add API calls?"
**Answer**: No. API calls are prohibited per AGENTS.md.

**Question**: "Can Codex add OpenAI API integration?"
**Answer**: No. AI runtime calls are prohibited.

**Question**: "Can Codex fix a bug that requires backend changes?"
**Answer**: No. Split into separate task tracked separately. Backend changes need full governance review.

**Question**: "What if Codex finds a critical security issue?"
**Answer**: Create urgent proposed action with CRITICAL priority. Operator escalates separately.

---

**Last Updated**: 2026-05-19
**Policy Version**: 1.0
**Status**: Active