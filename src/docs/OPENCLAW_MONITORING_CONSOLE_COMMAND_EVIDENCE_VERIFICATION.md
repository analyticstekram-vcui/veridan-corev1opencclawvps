# OpenClaw Monitoring Console — Command Evidence Verification Report

**Date:** 2026-05-23  
**Component:** `components/openclaw/ManualReadOnlyMonitoringConsole`  
**Source Pattern:** `components/tradingview-mcp-monitor/TvMcpMonitoringConsole`  
**Status:** COMPLETE (Display-Only, Read-Only, No Execution)

## Migration Summary

The completed command evidence resolution pattern from the TradingView MCP Monitoring Console has been mirrored into the main OpenClaw Monitoring Console. All logic is display-only and read-only. No execution, fetch, polling, or dispatch was added.

---

## Features Verified as Complete

### 1. lastCommand, lastCommandSource, lastCommandAt from Same Resolver Winner ✓
- **What:** `resolveCommandEvidence()` scans stored check records sorted newest-first.
- **How:** Iterates the sorted list and returns the first record whose `endpoint`/`command` passes `isValidCommand()`.
- **Fields resolved together:**
  - `lastCommand` — raw endpoint/command value from the winning record
  - `lastCommandSource` — always `CHECKS_KEY` (the monitoring checks store)
  - `lastCommandAt` — `createdAt` timestamp from the same winning record
- **Verification:** All three fields come from a single winning candidate; they cannot diverge.

### 2. Friendly Label and Raw Command Both Display ✓
- **What:** `formatCommandLabel(winCmd)` produces a human-readable label; `winCmd` is the preserved raw value.
- **Resolver Winner block fields:**
  - `command` → friendly label (e.g., "Health Check", "Status Check")
  - `raw` → unmodified original value (e.g., "/health", "/status")
- **Verification:** Both rendered in separate tiles; raw value never mutated.

### 3. Coherence Badge and Reason Render Correctly ✓
- **What:** `getCommandEvidenceCoherence(cmdEvidence)` and `getCommandEvidenceCoherenceReason(cmdEvidence)`.
- **Badge values:** COHERENT · REVIEW · NONE
  - **COHERENT** — cmd + source + timestamp all present
  - **NONE** — no evidence at all
  - **REVIEW** — partial evidence (missing source or timestamp)
- **Badge styles:**
  - COHERENT → green primary
  - REVIEW → amber
  - NONE → slate/muted
- **Reason** displayed as `title` attribute on badge and as Row 1 detail in verification block.
- **Verification:** Badge and reason are computed from `cmdEvidence` state only; no fetch.

### 4. Coverage Summary Counts Valid/Ignored Using Same `isValidCommand` ✓
- **What:** Event Source Coverage block counts all stored checks and classifies each candidate.
- **How:**
  - `coverageCmds` = `allChecks.map(c => c.endpoint ?? c.command ?? c.lastCommand ?? null)`
  - `validCount` = count where `isValidCommand(cmd) === true`
  - `ignoredCount` = `coverageCmds.length - validCount`
- **`isValidCommand`:** Rejects `null`, empty, `"unknown"`, `"n/a"`, `"null"`, `"undefined"`. Accepts all other non-empty strings.
- **Verification:** Same helper used for coverage counts, resolver winner selection, and rank computation.

### 5. Resolver Winner Display Matches Resolved Evidence ✓
- **What:** The Resolver Winner sub-block reads directly from `cmdEvidence` state, which is set by `resolveCommandEvidence()`.
- **Fields shown:**
  - `command` — label
  - `raw` — raw command
  - `source` — friendly name ("monitoring_checks")
  - `timestamp` — local time
  - `validRank` — 1-based rank among valid command-bearing candidates
  - `overallRank` — 1-based rank among all sorted candidates (including invalid)
  - `sort` — "newest-first"
  - `totalSorted` — total candidate count
- **No winner state:** Displays "No resolver winner." when `isValidCommand(winCmd)` is false.
- **Verification:** Winner display is gated on `isValidCommand()`; resolver and display share the same state.

### 6. Verification Block Renders PASS/REVIEW States ✓
- **What:** Command Evidence Verification block — four rows.
- **Rows:**

| Row | Label | PASS Condition | REVIEW Condition |
|-----|-------|---------------|-----------------|
| 1 | Resolver Coherence | COHERENT or NONE | REVIEW state |
| 2 | Raw Preservation | raw field accessible or no command claimed | label claims cmd but raw absent |
| 3 | Label Safety | `formatCommandLabel(null/unknown/"") === "none"` | edge-case mismatch |
| 4 | Execution Boundary | Always PASS | N/A |

- **Styling:** PASS → green primary; REVIEW → amber.
- **Verification:** Row 4 (Execution Boundary) is always PASS — non-negotiable safety guarantee.

### 7. Verification Document Created ✓
- **This file:** `docs/OPENCLAW_MONITORING_CONSOLE_COMMAND_EVIDENCE_VERIFICATION.md`

### 8. No Execution/Dispatch Behavior Added ✓
- ✓ `resolveCommandEvidence()` — pure localStorage read, no fetch
- ✓ `isValidCommand()` — pure string check, no side effects
- ✓ `formatCommandLabel()` — pure lookup, no side effects
- ✓ `formatRawCommandDebugValue()` — pure string transform, no side effects
- ✓ `getCommandEvidenceCoherence()` — pure field presence check, no side effects
- ✓ `getCommandEvidenceCoherenceReason()` — pure string derivation, no side effects
- ✓ Rank computation — pure in-memory array traversal of already-loaded data
- ✓ No `fetch()`, no `base44.functions.invoke()`, no `setTimeout/setInterval`, no WebSocket

---

## Data Flow

```
localStorage[CHECKS_KEY]
       │
       ▼
loadStoredChecks() → sort newest-first
       │
       ├──▶ resolveCommandEvidence() → { lastCommand, lastCommandSource, lastCommandAt }
       │           │
       │           ▼
       │     cmdEvidence state (React)
       │           │
       │    ┌──────┴──────────────────────┐
       │    ▼                             ▼
       │  Event Source Coverage      Command Evidence Verification
       │  (coverage counts,          (coherence badge, reason,
       │   resolver winner,           raw preservation, label
       │   validRank, overallRank)    safety, execution boundary)
       │
       └──▶ isValidCommand() — shared filter for coverage + resolver + rank
```

---

## Display-Only Constraints (All Verified)

- ✓ No fetch calls
- ✓ No polling
- ✓ No OpenClaw execution
- ✓ No broker connection
- ✓ No scheduler or dispatcher
- ✓ No mutation of stored records
- ✓ No state modification beyond React display state
- ✓ No unrelated UI changes
- ✓ Existing safety assertions and check record structure untouched

---

## Files Changed

| File | Change Type |
|------|-------------|
| `components/openclaw/ManualReadOnlyMonitoringConsole` | Added evidence helpers + state + Event Source Coverage + Resolver Winner + Command Evidence Verification blocks |
| `docs/OPENCLAW_MONITORING_CONSOLE_COMMAND_EVIDENCE_VERIFICATION.md` | Created (this file) |

---

## Verification Checklist

| # | Check | Result |
|---|-------|--------|
| 1 | lastCommand, source, timestamp from same resolver winner | ✓ PASS |
| 2 | Friendly label and raw command both display | ✓ PASS |
| 3 | Coherence badge and reason render correctly | ✓ PASS |
| 4 | Coverage summary uses same `isValidCommand` helper | ✓ PASS |
| 5 | Resolver winner display matches resolved evidence | ✓ PASS |
| 6 | Verification block renders PASS/REVIEW states | ✓ PASS |
| 7 | Verification document created | ✓ PASS |
| 8 | No execution/dispatch behavior added | ✓ PASS |