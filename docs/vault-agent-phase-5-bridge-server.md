# Vault Agent Phase 5 Local Read-Only Bridge Server

## Purpose

This local bridge lets Veridan Core read live Vault Agent dashboard report data from the Obsidian vault without granting write access, execution access, broker access, banking access, or governance activation capability.

## Endpoint

```text
GET http://127.0.0.1:57445/vault-agent/reports
```

Self-verification endpoint:

```text
GET http://127.0.0.1:57445/vault-agent/verify
```

## Fixed Vault Path

```text
C:\Users\peter\OneDrive\Desktop\obsidians\veridans mind
```

The bridge does not accept user-provided file paths.

## Approved Files

The bridge reads only these markdown files:

- `00 Dashboard/Daily Vault Brief.md`
- `00 Dashboard/Weekly Governance Brief.md`
- `00 Dashboard/Pending Approval Report.md`
- `00 Dashboard/Review Cycle Report.md`
- `00 Dashboard/OpenClaw Boundary Report.md`

## Run Instructions

From the Veridan Core repository:

```bash
npm run vault-agent:bridge
```

Expected startup line:

```text
Vault Agent bridge server listening at http://127.0.0.1:57445/vault-agent/reports
Mode: LIVE_READ_ONLY · GET_ONLY · LOCALHOST_ONLY · NO_WRITES · NO_EXECUTION
```

## Verification Commands

Reports endpoint:

```bash
curl http://127.0.0.1:57445/vault-agent/reports
```

Verifier endpoint:

```bash
curl http://127.0.0.1:57445/vault-agent/verify
```

Non-GET rejection example:

```bash
curl -X POST http://127.0.0.1:57445/vault-agent/reports
```

Expected result: HTTP `405` with `allowedMethods: ["GET"]`.

## Safety Boundary

The bridge is designed with these controls:

- Binds only to `127.0.0.1`
- Allows GET only
- Reads only the fixed vault path
- Reads only approved markdown report files
- Does not write files
- Does not modify Obsidian notes
- Does not use Base44 writes
- Does not write to a database
- Does not activate governance documents
- Does not mutate approvals, evidence, or exceptions
- Does not execute OpenClaw
- Does not access brokers
- Does not access banking systems
- Does not start schedulers or automations
- Does not call external APIs

## Response Shape

The response includes the required Phase 5 top-level fields:

- `mode: LIVE_READ_ONLY`
- `source: obsidian_vault`
- `readOnly: true`
- `writesEnabled: false`
- `executionEnabled: false`
- `openclawEnabled: false`
- `brokerEnabled: false`
- `bankingEnabled: false`
- `tradingEnabled: false`
- `notes`
- `links`
- `pendingApprovalsTotal`
- `dueWithin7Days`
- `openExceptions`
- `governanceReadiness`
- `governanceActivation`
- `vaultHealthScore`
- `freshnessScore`
- `freshnessStatus`
- `generatedAt`
- `lastRefreshTime`

It also includes the existing nested dashboard shape consumed by Veridan Core:

- `dailyBrief`
- `weeklyGovernanceBrief`
- `pendingApprovals`
- `reviewsDue`
- `openclawBoundary`
- `monitoring`
- `adapterMeta`

## Client Consumption

The existing Veridan Core Phase 5 client adapter will attempt:

```text
http://127.0.0.1:57445/vault-agent/reports
```

If the bridge is unavailable or the payload fails safety verification, the UI remains in `MOCK_FALLBACK` mode.
