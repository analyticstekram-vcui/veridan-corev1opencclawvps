# Execution Boundary — Veridan Core Prohibited Operations

## Overview

This document explicitly defines all systems and operations that are disabled in Veridan Core as of 2026-05-19. None of these operations are available at any layer of the application.

**Status**: All listed operations are PERMANENTLY DISABLED until explicit security review and approval.

---

## Trading System Boundary

### ❌ Live Trading Execution
- **Status**: DISABLED
- **Definition**: Real money trading on live broker accounts
- **Reason**: High financial risk. Requires broker integration, position management, order routing
- **Code Path**: BLOCKED at all levels
- **References**:
  - TradingStrategyRegistry: Planning only
  - TradingOperationsDashboard: Monitoring only
  - TradingCommandCenter: Planning only
- **To Enable**: Requires full governance review, security audit, broker integration testing, capital requirements

### ❌ Broker API Calls
- **Status**: DISABLED
- **Definition**: Any call to broker APIs (account creation, position querying, order placement, account closure)
- **Brokers Specifically Blocked**:
  - Tradovate
  - TradingView Pro
  - BloFin
  - Alpaca
  - Interactive Brokers
  - Any other broker
- **Reason**: Credential management, execution authority, financial liability
- **Code Path**: No fetch/API code exists
- **References**:
  - TradingPaperReadinessChecklist: Validates readiness, doesn't execute
  - TradingBrokerSandboxRequirements: Documents requirements, doesn't connect
- **To Enable**: Requires OAuth integration, security review, broker agreement

### ❌ Trading View MCP Integration
- **Status**: DISABLED
- **Definition**: Model Context Protocol calls to TradingView systems
- **Reason**: Real-time data access requires authentication and API quota
- **Code Path**: No MCP client code exists
- **References**:
  - TradingViewMcpReadinessPanel: Documents MCP planning, doesn't execute
- **To Enable**: Requires MCP client library, TradingView API key, integration testing

---

## Credit System Boundary

### ❌ Credit Bureau API Calls
- **Status**: DISABLED
- **Definition**: Any call to credit bureau APIs (Equifax, Experian, TransUnion, etc.)
- **Bureaus Specifically Blocked**:
  - Equifax
  - Experian
  - TransUnion
  - LendingTree
  - Credit Karma
  - Any other bureau
- **Reason**: Requires authentication, credit inquiry logging, compliance
- **Prohibited Operations**:
  - ❌ Query credit reports
  - ❌ File disputes
  - ❌ Report consumer activity
  - ❌ Freeze/unfreeze accounts
- **Code Path**: No fetch/API code exists
- **References**:
  - CreditProfilePlanning: Planning only
  - CreditDisputePlanner: Workflow planning only
  - BureauMonitoringChecklist: Checklist only
- **To Enable**: Requires bureau partnership, compliance review, API integration

### ❌ Credit Inquiry Submission
- **Status**: DISABLED
- **Definition**: Submitting credit inquiries that generate hard pulls
- **Reason**: Direct impact on credit score, requires authorization
- **Code Path**: BLOCKED
- **To Enable**: Requires audit trail, consent framework, bureau integration

### ❌ Dispute Filing
- **Status**: DISABLED
- **Definition**: Automated or manual dispute filing with credit bureaus
- **Reason**: Requires legal compliance, evidence tracking, bureau communication
- **Code Path**: No dispute filing code exists
- **References**:
  - CreditDisputePlanner: Documents dispute strategy only
- **To Enable**: Requires legal review, compliance framework, bureau API access

---

## Business Formation System Boundary

### ❌ Legal Filing
- **Status**: DISABLED
- **Definition**: Filing legal documents with state/federal authorities
- **Prohibited Operations**:
  - ❌ File articles of incorporation
  - ❌ File articles of organization (LLC)
  - ❌ File trust documents
  - ❌ File certificates
  - ❌ File any state/federal paperwork
- **Reason**: Legal liability, compliance, requires authorized signatory
- **Code Path**: No filing code exists
- **References**:
  - BusinessEntityRegistry: Entity tracking only
  - TrustLlcStructurePlanner: Structure planning only
- **To Enable**: Requires legal counsel, compliance framework, state filing APIs

### ❌ EIN Submission
- **Status**: DISABLED
- **Definition**: Submitting Employer Identification Number (EIN) applications to IRS
- **Reason**: Tax authority submission, requires authenticated filing
- **Code Path**: No IRS API code exists
- **References**:
  - EinBankCreditReadiness: Readiness checklist only
- **To Enable**: Requires IRS e-file integration, authentication, tax compliance

### ❌ Bank Account Opening
- **Status**: DISABLED
- **Definition**: Creating new bank accounts for entities
- **Prohibited Operations**:
  - ❌ Open business checking account
  - ❌ Open business savings account
  - ❌ Open credit line with bank
  - ❌ Apply for business loans
- **Reason**: Banking relationship requires in-person verification, requires business tax ID
- **Code Path**: No banking API code exists
- **References**:
  - RegisteredAgentWorkflow: Workflow planning only
  - EinBankCreditReadiness: Readiness checklist only
- **To Enable**: Requires bank partnership, identity verification, compliance review

### ❌ Document Submission to State/Federal
- **Status**: DISABLED
- **Definition**: Submitting any documents to government authorities
- **Reason**: Legal liability, compliance, requires proper authorization
- **Code Path**: No government API code exists
- **To Enable**: Requires legal framework, government API access, compliance audit

---

## Payment System Boundary

### ❌ Payment Processing
- **Status**: DISABLED
- **Definition**: Processing payments, transfers, or financial transactions
- **Prohibited Operations**:
  - ❌ Process credit card payments
  - ❌ Process ACH transfers
  - ❌ Process wire transfers
  - ❌ Process cryptocurrency transactions
  - ❌ Process any currency exchange
- **Reason**: Financial liability, requires payment processor integration, PCI compliance
- **Code Path**: No payment processor integration exists
- **References**:
  - CreditFacility: Facility tracking only (no transactions)
  - CreditLedgerEvent: Event tracking only (no actual transfers)
  - AffiliateRevenuePlanner: Revenue planning only (no actual transfers)
- **To Enable**: Requires payment processor (Stripe, PayPal, etc.), PCI audit, financial compliance

### ❌ Bank Transfer Execution
- **Status**: DISABLED
- **Definition**: Executing transfers between accounts
- **Reason**: Direct account access, requires banking credentials
- **Code Path**: No banking integration exists
- **To Enable**: Requires bank API integration, account authentication, transaction monitoring

---

## AI & Codex System Boundary

### ❌ Codex Execution from App
- **Status**: DISABLED
- **Definition**: Executing Codex tasks automatically from Veridan Core
- **Reason**: Codex operates in external environment; app is planning-only
- **Code Path**: No Codex dispatch code exists
- **References**:
  - CodexTasksPanel: Draft creation and tracking only
  - OperatorReviewPanel: Review tracking only (executionAllowed = false)
- **To Enable**: Requires explicit approval, separate governance review, external execution model

### ❌ AI Runtime Calls
- **Status**: DISABLED
- **Definition**: Calling OpenAI, Gemini, Claude, or other AI runtime APIs
- **Reason**: API access, cost management, prompt injection risk
- **Code Path**: No AI runtime calls in app
- **To Enable**: Requires API key management, cost controls, prompt validation

### ❌ OpenAI API Calls
- **Status**: DISABLED
- **Definition**: Specific prohibition on OpenAI API integration
- **Reason**: Authentication, API key exposure risk, cost
- **Code Path**: No OpenAI integration exists
- **References**: No OpenAI client library imported
- **To Enable**: Requires OpenAI API key setup, rate limiting, usage monitoring

---

## OpenClaw System Boundary

### ❌ OpenClaw Dispatch
- **Status**: DISABLED
- **Definition**: Dispatching commands to OpenClaw gateway for execution
- **Reason**: OpenClaw governance locked, execution phase not ready
- **Code Path**: No dispatch code exists (dry-run/preview only)
- **References**:
  - OpenClawGovernanceDashboard: Read-only governance view
  - All OpenClaw functions: Validation, preview, and dry-run only
  - openclawBridgePreview: Preview endpoint only
  - openclawBridgeDryRun: Dry-run endpoint only
- **Safety Gates**:
  - Phase 50 (Execution Readiness): NOT_READY
  - Execution mode: SIMULATED (not LIVE)
  - All commands auto-blocked at validation layer
- **To Enable**: Requires explicit security review, phase gate completion, governance approval

### ❌ MCP Calls
- **Status**: DISABLED
- **Definition**: Calling Model Context Protocol tools or integrations
- **Reason**: External tool execution, requires authentication
- **Code Path**: No MCP client code exists
- **References**:
  - TradingViewMcpReadinessPanel: Planning only
- **To Enable**: Requires MCP client library, tool authentication, integration testing

---

## Browser System Boundary

### ❌ Browser Automation Execution
- **Status**: DISABLED
- **Definition**: Automating browser interactions (clicking, typing, navigation)
- **Reason**: High-risk capability, requires approval for each use case
- **Code Path**: Browser components are planning/proposal only
- **References**:
  - BrowserObservationProposalQueuePanel: Proposal tracking only
  - BrowserObservationContractValidatorPanel: Validation only
  - executeQueuedCommand: Blocked at validation layer
- **Safety Gates**:
  - All commands auto-rejected or blocked
  - No execution endpoint exists
  - Preview-only mode active
- **To Enable**: Requires use case approval, safety review, execution enablement

---

## Credential System Boundary

### ❌ Credential Handling
- **Status**: DISABLED
- **Definition**: Storing, retrieving, or using user credentials (passwords, API keys, tokens)
- **Prohibited Operations**:
  - ❌ Store passwords in localStorage
  - ❌ Store API keys in localStorage
  - ❌ Store tokens in localStorage
  - ❌ Store session secrets
  - ❌ Retrieve credentials from user input
  - ❌ Submit credentials to backend
  - ❌ Log credentials
- **Code Path**: No credential input fields exist
- **References**:
  - No password input components
  - No API key input components
  - No token storage code
- **Vault Provider**: None (secrets managed by Base44 platform only)
- **To Enable**: Requires secure credential vault, encryption framework, compliance audit

### ❌ API Key Exposure
- **Status**: DISABLED
- **Definition**: Exposing API keys in frontend code or localStorage
- **Code Path**: No API keys in code
- **Existing Secrets**: Stored by Base44 platform, not in app code
- **To Enable**: Requires secure secret management integration

### ❌ Password Field Implementation
- **Status**: DISABLED
- **Definition**: Creating password input fields in the app
- **Code Path**: No password input components exist
- **To Enable**: Requires password security review, encryption framework

---

## Backend System Boundary

### ❌ Backend Mutation Routes
- **Status**: DISABLED
- **Definition**: Routes that modify backend data or state
- **Existing Endpoints**: Read-only or simulation only
- **Blocked Operations**:
  - ❌ Database INSERT
  - ❌ Database UPDATE
  - ❌ Database DELETE
  - ❌ Entity creation endpoints
  - ❌ Entity mutation endpoints
- **Code Path**: No mutation code in backend functions
- **References**: All functions are GET/read-only or dry-run simulation
- **To Enable**: Requires full governance review, mutation policy, audit logging

### ❌ Database Writes
- **Status**: DISABLED
- **Definition**: Writing any data to backend database
- **Reason**: Data integrity, execution authority, audit trail requirements
- **Code Path**: No database write code in functions
- **References**:
  - All functions use localStorage for state management
  - No base44.entities.create/update/delete calls from functions
- **To Enable**: Requires mutation policy, change log, security audit

### ❌ External Service Integration
- **Status**: DISABLED
- **Definition**: Integrating with third-party services beyond read-only data
- **Blocked Services**:
  - ❌ Stripe (payment processing)
  - ❌ Twilio (SMS/calls)
  - ❌ SendGrid (email)
  - ❌ Slack (posting to channels)
  - ❌ GitHub (webhook receivers, mutations)
  - ❌ Any broker API
  - ❌ Any bank API
  - ❌ Any credit bureau API
- **Code Path**: No third-party integrations exist
- **To Enable**: Requires integration policy, security review, API credentials

---

## Deployment & Release Boundary

### ❌ Deployment from App
- **Status**: DISABLED
- **Definition**: Deploying app changes from within the app
- **Code Path**: No deployment code exists
- **To Enable**: Requires CI/CD integration, deployment approvals

### ❌ Shell Command Execution
- **Status**: DISABLED
- **Definition**: Executing shell commands from within the app
- **Prohibited Commands**:
  - ❌ npm run build
  - ❌ git commands
  - ❌ npm publish
  - ❌ Any bash/zsh/powershell commands
- **Code Path**: No shell execution code exists
- **To Enable**: Requires system access controls, command whitelisting

### ❌ GitHub Integration (Mutations)
- **Status**: DISABLED
- **Definition**: Mutating GitHub repositories from the app
- **Prohibited Operations**:
  - ❌ Create branches
  - ❌ Push commits
  - ❌ Create pull requests
  - ❌ Merge pull requests
  - ❌ Create releases
  - ❌ Delete branches
- **Code Path**: No GitHub mutation code exists
- **To Enable**: Requires GitHub API integration, access controls, approval gates

---

## Verification Checklist

Verify these operation boundaries are enforced:

**Trading System**
- [ ] No broker API calls in code
- [ ] No trading execution logic
- [ ] No order placement code
- [ ] No account creation code
- [ ] No real money transfer code

**Credit System**
- [ ] No credit bureau API calls
- [ ] No dispute filing code
- [ ] No credit inquiry submission code
- [ ] No account freeze/unfreeze code

**Business Formation**
- [ ] No legal filing code
- [ ] No EIN submission code
- [ ] No bank account creation code
- [ ] No state filing code

**Payment System**
- [ ] No payment processor integration
- [ ] No bank transfer code
- [ ] No cryptocurrency code
- [ ] No currency exchange code

**AI & Codex**
- [ ] No Codex dispatch code
- [ ] No OpenAI API calls
- [ ] No AI runtime integration
- [ ] No automated Codex execution

**OpenClaw**
- [ ] No OpenClaw dispatch logic
- [ ] No MCP client code
- [ ] Phase 50 shows NOT_READY
- [ ] All commands blocked at validation

**Browser**
- [ ] No automated browser execution
- [ ] No DOM manipulation code
- [ ] No tab control code
- [ ] Preview/proposal only

**Credentials**
- [ ] No password input fields
- [ ] No API key input fields
- [ ] No credential storage code
- [ ] No secret submission code

**Backend**
- [ ] No database mutation code
- [ ] No external service mutations
- [ ] No third-party API integration
- [ ] No webhook receivers (except read-only)

**Deployment**
- [ ] No shell command execution
- [ ] No GitHub mutation code
- [ ] No deployment logic
- [ ] No release automation

---

## Escalation Process

**Question**: "Can we enable X operation?"

**Process**:
1. Create proposed action in AI Command Center
2. Document business case and risk assessment
3. Create OpenClaw task plan with detailed requirements
4. Operator reviews and escalates
5. Full governance review required
6. Security audit required
7. Policy update required
8. Explicit approval required
9. Implementation phased and monitored

---

**Last Updated**: 2026-05-19
**Boundary Version**: 1.0
**Status**: LOCKED
**Ready for Codex**: Yes
**Ready for Execution**: No