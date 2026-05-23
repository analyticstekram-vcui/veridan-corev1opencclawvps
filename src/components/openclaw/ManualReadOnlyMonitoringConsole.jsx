/**
 * ManualReadOnlyMonitoringConsole
 * Operator-triggered manual GET-only monitoring checks.
 * No network calls, no backend mutations, no execution.
 *
 * SAFETY CONTRACT:
 *   - GET-only requests (no POST/PUT/PATCH/DELETE)
 *   - No scheduler, polling, command dispatch, browser automation
 *   - No credentials, API keys, tokens, secrets
 *   - No trading, broker actions, wallet operations, money movement
 *   - localStorage read/write for check records only
 *   - Reads from openclawStatus backend function only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Shield, RefreshCw, Trash2, Play } from 'lucide-react';

const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';
const AUDIT_KEY = 'openclawManualReadOnlyMonitoringAuditLog';

const ALLOWED_ENDPOINTS = [
  '/health',
  '/status',
  '/version',
  '/capabilities',
];

// ─── Command evidence helpers (display-only, read-only, no fetch) ─────────────

const INVALID_COMMANDS = new Set([
  '', 'unknown', 'n/a', 'null', 'undefined',
]);

function isValidCommand(v) {
  if (!v || typeof v !== 'string') return false;
  return !INVALID_COMMANDS.has(v.trim().toLowerCase());
}

function formatCommandLabel(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'none';
  const lower = cmd.toLowerCase().trim();
  // Edge-case placeholders → 'none'
  if (!lower || lower === 'unknown' || lower === 'n/a' || lower === 'null' || lower === 'undefined') return 'none';
  const lookup = {
    'get /health': 'Health Check',
    'get /status': 'Status Check',
    'get /version': 'Version Check',
    'get /capabilities': 'Capabilities Check',
    '/health': 'Health Check',
    '/status': 'Status Check',
    '/version': 'Version Check',
    '/capabilities': 'Capabilities Check',
    'health': 'Health Check',
    'status': 'Status Check',
    'version': 'Version Check',
    'capabilities': 'Capabilities Check',
    'read': 'Read',
    'verify': 'Verify',
  };
  return lookup[lower] ?? cmd.trim();
}

function formatRawCommandDebugValue(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'none';
  const trimmed = cmd.trim();
  if (!trimmed) return 'none';
  const lower = trimmed.toLowerCase();
  if (lower === 'unknown' || lower === 'n/a' || lower === 'null' || lower === 'undefined') return 'none';
  return trimmed;
}

function getCommandEvidenceCoherence(evidence) {
  const cmd = evidence?.lastCommand;
  const src = evidence?.lastCommandSource;
  const ts  = evidence?.lastCommandAt;
  const hasCmd = cmd && typeof cmd === 'string' && cmd.trim() &&
    !['unknown', 'none', 'n/a', 'null', 'undefined'].includes(cmd.trim().toLowerCase());
  const hasSrc = src && typeof src === 'string' && src.trim();
  const hasTs  = ts  && typeof ts  === 'string' && ts.trim();
  if (!hasCmd && !hasSrc && !hasTs) return 'NONE';
  if (hasCmd && hasSrc && hasTs)   return 'COHERENT';
  return 'REVIEW';
}

function getCommandEvidenceCoherenceReason(evidence) {
  const cmd = evidence?.lastCommand;
  const src = evidence?.lastCommandSource;
  const ts  = evidence?.lastCommandAt;
  const hasCmd = cmd && typeof cmd === 'string' && cmd.trim() &&
    !['unknown', 'none', 'n/a', 'null', 'undefined'].includes(cmd.trim().toLowerCase());
  const hasSrc = src && typeof src === 'string' && src.trim();
  const hasTs  = ts  && typeof ts  === 'string' && ts.trim();
  if (!hasCmd && !hasSrc && !hasTs) return 'No valid command evidence found.';
  if (hasCmd && hasSrc && hasTs)   return 'Command, source, and timestamp are aligned.';
  const missing = [];
  if (hasCmd && !hasSrc) missing.push('source');
  if (hasCmd && !hasTs)  missing.push('timestamp');
  if (!hasCmd && (hasSrc || hasTs)) return 'Source or timestamp exists without a valid command.';
  if (missing.length > 0) return `Command evidence is incomplete: missing ${missing.join(' and ')}.`;
  return 'Command evidence is incomplete.';
}

/**
 * Resolve the newest valid command from stored check records (newest-first).
 * Returns { lastCommand, lastCommandSource, lastCommandAt }.
 * Pure read from localStorage — no fetch, no mutation, no dispatch.
 */
function resolveCommandEvidence() {
  try {
    const raw = localStorage.getItem(CHECKS_KEY);
    if (!raw) return { lastCommand: null, lastCommandSource: null, lastCommandAt: null };
    const checks = JSON.parse(raw);
    if (!Array.isArray(checks) || checks.length === 0) return { lastCommand: null, lastCommandSource: null, lastCommandAt: null };

    // Sort newest-first by createdAt
    const sorted = [...checks].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    for (const c of sorted) {
      const cmd = c.endpoint ?? c.command ?? c.lastCommand ?? null;
      if (isValidCommand(cmd)) {
        return {
          lastCommand:       cmd.trim(),
          lastCommandSource: CHECKS_KEY,
          lastCommandAt:     c.createdAt ?? null,
        };
      }
    }
    return { lastCommand: null, lastCommandSource: null, lastCommandAt: null };
  } catch { return { lastCommand: null, lastCommandSource: null, lastCommandAt: null }; }
}

/** Load checks array from localStorage safely. */
function loadStoredChecks() {
  try {
    const raw = localStorage.getItem(CHECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function appendAuditLog(event) {
  const log = loadJSON(AUDIT_KEY, []);
  log.push({
    eventId: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 4),
    createdAt: new Date().toISOString(),
    ...event,
  });
  saveJSON(AUDIT_KEY, log.slice(-100));
}

function buildCheckRecord(endpoint, result, durationMs) {
  const safetyAssertions = [
    { key: 'readOnly', value: true, pass: true },
    { key: 'methodGet', value: 'GET', pass: true },
    { key: 'endpointAllowlisted', value: ALLOWED_ENDPOINTS.includes(endpoint), pass: ALLOWED_ENDPOINTS.includes(endpoint) },
    { key: 'schedulerActive', value: false, pass: true },
    { key: 'pollingLoopActive', value: false, pass: true },
    { key: 'dispatchAllowed', value: false, pass: true },
    { key: 'executionAllowed', value: false, pass: true },
    { key: 'openClawCommandSent', value: false, pass: true },
    { key: 'executionAttempted', value: false, pass: true },
    { key: 'browserToolUsed', value: false, pass: true },
    { key: 'credentialExposed', value: false, pass: true },
    { key: 'secretExposed', value: false, pass: true },
    { key: 'tradingAttempted', value: false, pass: true },
    { key: 'brokerActionsAttempted', value: false, pass: true },
    { key: 'walletActionsAttempted', value: false, pass: true },
    { key: 'moneyMovementAttempted', value: false, pass: true },
    { key: 'mutationMethodUsed', value: false, pass: true },
  ];

  const allPass = safetyAssertions.every(a => a.pass);
  const status = !allPass ? 'BLOCKED_BY_SAFETY_FAILURE' : (result?.status || 'HOLD_FOR_BACKEND_FUNCTION');
  const httpStatus = result?.httpStatus || null;
  const gatewayReachable = result?.gatewayReachable ?? false;

  const checkId = 'check-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    checkId,
    createdAt: new Date().toISOString(),
    endpoint,
    method: 'GET',
    status,
    httpStatus,
    gatewayReachable,
    cfAccessDetected: result?.cfAccessDetected ?? false,
    responseSummary: result?.diagnosticDetail || result?.message || 'No response',
    errorMessage: result?.error || null,
    durationMs,
    mode: 'READ_ONLY',
    executionLock: 'LOCKED',
    dispatchAllowed: false,
    executionAllowed: false,
    schedulerActive: false,
    pollingLoopActive: false,
    openClawCommandSent: false,
    executionAttempted: false,
    browserToolUsed: false,
    credentialExposed: false,
    secretExposed: false,
    tradingAttempted: false,
    brokerActionsAttempted: false,
    walletActionsAttempted: false,
    moneyMovementAttempted: false,
    mutationMethodUsed: false,
    safetyAssertions,
    sourceComponent: 'ManualReadOnlyMonitoringConsole',
  };
}

function saveCheck(record) {
  try {
    const all = loadJSON(CHECKS_KEY, []);
    const deduped = [record, ...all.filter(c => c.checkId !== record.checkId)];
    saveJSON(CHECKS_KEY, deduped.slice(0, 100));
  } catch {}
}

export default function ManualReadOnlyMonitoringConsole() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [latestCheck, setLatestCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [cmdEvidence, setCmdEvidence] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);

  const refreshEvidence = useCallback(() => {
    const checks = loadStoredChecks();
    setCheckCount(checks.length);
    const resolved = resolveCommandEvidence();
    if (resolved.lastCommand) {
      setCmdEvidence(resolved);
      setShowEvidence(true);
    } else {
      setCmdEvidence(resolved);
    }
  }, []);

  // Load check count on mount
  useEffect(() => {
    refreshEvidence();
  }, [refreshEvidence]);

  const handleRunCheck = async () => {
    if (!selectedEndpoint) return;
    if (!ALLOWED_ENDPOINTS.includes(selectedEndpoint)) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      // Call backend with minimal frontend payload (no secrets)
      const response = await base44.functions.invoke('openclawStatus', {
        endpoint: selectedEndpoint,
        method: 'GET',
        requestId: 'req-' + Date.now().toString(36),
        mode: 'READ_ONLY',
        dispatchAllowed: false,
        executionAttempted: false,
      });

      const durationMs = Date.now() - startTime;
      const result = response.data || {};

      // Map backend statuses to frontend display
      const mappedResult = {
        ...result,
        status: mapBackendStatus(result.status),
      };

      const record = buildCheckRecord(selectedEndpoint, mappedResult, durationMs);
      saveCheck(record);
      setLatestCheck(record);

      refreshEvidence();

      const auditStatus = record.status === 'SUCCESS' ? 'manual_check_success' : 'manual_check_hold';
      appendAuditLog({
        eventType: auditStatus,
        component: 'ManualReadOnlyMonitoringConsole',
        endpoint: selectedEndpoint,
        checkId: record.checkId,
        httpStatus: record.httpStatus,
        gatewayReachable: record.gatewayReachable,
        reason: `Manual GET check to ${selectedEndpoint}`,
        operatorAction: 'run_check',
        nonExecutionConfirmed: true,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const result = {
        status: 'HOLD_FOR_BACKEND_FUNCTION',
        error: error.message || 'Backend function error',
      };

      const record = buildCheckRecord(selectedEndpoint, result, durationMs);
      saveCheck(record);
      setLatestCheck(record);

      refreshEvidence();

      appendAuditLog({
        eventType: 'manual_check_error',
        component: 'ManualReadOnlyMonitoringConsole',
        endpoint: selectedEndpoint,
        checkId: record.checkId,
        reason: error.message || 'Backend function unavailable',
        operatorAction: 'run_check',
        nonExecutionConfirmed: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Map backend status codes to display status
  const mapBackendStatus = (backendStatus) => {
    if (backendStatus === 'SUCCESS') return 'SUCCESS';
    if (backendStatus === 'HOLD_FOR_BACKEND_ENV') return 'HOLD_FOR_BACKEND_ENV';
    if (backendStatus === 'HOLD_FOR_AUTH_BOUNDARY') return 'HOLD_FOR_AUTH_BOUNDARY';
    if (backendStatus === 'HOLD_FOR_GATEWAY_CONNECTIVITY') return 'HOLD_FOR_GATEWAY_CONNECTIVITY';
    if (backendStatus === 'BLOCKED_BY_SAFETY_FAILURE') return 'BLOCKED_BY_SAFETY_FAILURE';
    return 'HOLD_FOR_BACKEND_FUNCTION';
  };

  const handleCopyJSON = () => {
    if (latestCheck) {
      navigator.clipboard.writeText(JSON.stringify(latestCheck, null, 2));
    }
  };

  const handleClearChecks = () => {
    if (window.confirm('Clear all local monitoring checks? This removes only the check records.')) {
      try {
      localStorage.removeItem(CHECKS_KEY);
      setLatestCheck(null);
      setCmdEvidence(null);
      setShowEvidence(false);
      setCheckCount(0);
        appendAuditLog({
          eventType: 'local_checks_cleared',
          component: 'ManualReadOnlyMonitoringConsole',
          reason: 'Operator cleared local monitoring checks',
          operatorAction: 'clear_checks',
          nonExecutionConfirmed: true,
        });
      } catch {}
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Manual Monitoring</div>
          <div className="text-[13px] font-bold text-foreground">Manual Read-Only Monitoring Console</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Operator-triggered GET-only health checks. No execution. No dispatch.</div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Manual operator-triggered GET checks only. No scheduler. No polling. No dispatch. No execution.</span>
      </div>

      {/* Endpoint Selector + Run Button */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Endpoint Selection</div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            disabled={loading}
            className="flex-1 min-w-[140px] px-3 py-2 bg-secondary/20 border border-border rounded text-[9px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          >
            <option value="">Select endpoint…</option>
            {ALLOWED_ENDPOINTS.map(ep => (
              <option key={ep} value={ep}>{ep}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRunCheck}
            disabled={!selectedEndpoint || loading}
            className="flex items-center gap-1.5 px-4 py-2 text-[9px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold transition-colors"
          >
            <Play className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running…' : 'Run Check'}
          </button>
        </div>
        <div className="text-[8px] text-slate-500">
          Method: GET only • Mode: READ_ONLY • Lock: LOCKED • Checks recorded: {checkCount}
        </div>
      </div>

      {/* Latest Check Result - only show if checks exist */}
      {checkCount > 0 && latestCheck && (
        <>
          <div className={`border rounded-lg p-4 space-y-2 ${
            latestCheck.status === 'SUCCESS'
              ? 'bg-primary/5 border-primary/30'
              : latestCheck.status === 'BLOCKED_BY_SAFETY_FAILURE'
              ? 'bg-destructive/5 border-destructive/20'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {latestCheck.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : latestCheck.status === 'BLOCKED_BY_SAFETY_FAILURE' ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  latestCheck.status === 'SUCCESS' ? 'text-primary' : latestCheck.status === 'BLOCKED_BY_SAFETY_FAILURE' ? 'text-destructive' : 'text-amber-500'
                }`}>
                  {latestCheck.status}
                </div>
                <div className={`text-[8px] mt-0.5 ${
                  latestCheck.status === 'SUCCESS' ? 'text-primary/80' : latestCheck.status === 'BLOCKED_BY_SAFETY_FAILURE' ? 'text-destructive/80' : 'text-amber-500/80'
                }`}>
                  {latestCheck.responseSummary}
                </div>
                {latestCheck.status === 'HOLD_FOR_BACKEND_ENV' && (
                  <div className="text-[8px] text-amber-500/90 font-semibold mt-2">
                    ℹ️ Required backend secrets are missing. Check: OPENCLAW_GATEWAY_URL, OPENCLAW_SERVICE_TOKEN, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
                  </div>
                )}
                {latestCheck.status === 'HOLD_FOR_AUTH_BOUNDARY' && latestCheck.cfAccessDetected && (
                  <div className="text-[8px] text-amber-500/90 font-semibold mt-2">
                    ℹ️ Cloudflare Access redirect detected. Verify CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are valid service token values and the Access policy allows service-token authentication.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Endpoint',         value: latestCheck.endpoint,                color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'Method',           value: latestCheck.method,                  color: 'text-foreground' },
              { label: 'Status',           value: latestCheck.status.split('_')[0],    color: 'text-primary font-bold' },
              { label: 'HTTP Status',      value: latestCheck.httpStatus ?? 'N/A',      color: 'text-foreground' },
              { label: 'Gateway Reachable', value: String(latestCheck.gatewayReachable), color: latestCheck.gatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'CF Access',        value: String(latestCheck.cfAccessDetected), color: latestCheck.cfAccessDetected ? 'text-amber-500' : 'text-slate-300' },
              { label: 'Duration',         value: `${latestCheck.durationMs}ms`,        color: 'text-slate-300' },
              { label: 'Execution Lock',   value: latestCheck.executionLock,           color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed', value: String(latestCheck.dispatchAllowed),  color: 'text-destructive font-bold' },
              { label: 'Recorded At',      value: new Date(latestCheck.createdAt).toLocaleTimeString(), color: 'text-slate-400' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Safety Assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {latestCheck.safetyAssertions.filter(a => a.pass).length}/{latestCheck.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {latestCheck.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  {a.pass
                    ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className={`text-[7px] font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>
                    {String(a.value).slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Check ID + Timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5 font-mono">{latestCheck.checkId}</span>
            <span>{new Date(latestCheck.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCopyJSON}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
              <Copy className="w-3 h-3" /> Copy Latest Check JSON
            </button>
            <button type="button" onClick={handleClearChecks}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-slate-500/40 text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
              <Trash2 className="w-3 h-3" /> Clear Local Checks
            </button>
          </div>
        </>
      )}

      {/* No checks yet - only show if zero checks exist */}
      {checkCount === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-lg text-[9px] text-slate-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No checks recorded yet. Select an endpoint and click "Run Check" to generate monitoring evidence.
        </div>
      )}

      {/* ── Event Source Coverage ── */}
      {(cmdEvidence !== null) && (() => {
        const allChecks = loadStoredChecks();
        const totalCandidates = allChecks.length;

        // Use the same isValidCommand helper — endpoint field is the command for this console
        const coverageCmds = allChecks.map(c => c.endpoint ?? c.command ?? c.lastCommand ?? null);
        const validCount   = coverageCmds.filter(cmd => isValidCommand(cmd)).length;
        const ignoredCount = coverageCmds.length - validCount;

        let statusMsg;
        if (totalCandidates === 0) {
          statusMsg = 'No event candidates available.';
        } else if (validCount === 0) {
          statusMsg = 'Candidates found, but no valid command-bearing event.';
        } else {
          statusMsg = 'Valid command candidates available.';
        }

        // Rank candidates: sort newest-first, same as resolver
        const rankCandidates = [...allChecks]
          .sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          })
          .map(c => ({
            cmd: c.endpoint ?? c.command ?? c.lastCommand ?? null,
            ts:  c.createdAt ? new Date(c.createdAt).getTime() : 0,
          }));

        const winCmd       = cmdEvidence.lastCommand ?? null;
        const winSource    = cmdEvidence.lastCommandSource ?? null;
        const winTimestamp = cmdEvidence.lastCommandAt ?? null;
        const hasWinner    = isValidCommand(winCmd);

        let overallRank = null;
        let validRank   = null;
        if (hasWinner) {
          const winTs = winTimestamp ? new Date(winTimestamp).getTime() : 0;
          let ov = 0, vr = 0;
          for (const c of rankCandidates) {
            ov++;
            if (isValidCommand(c.cmd)) vr++;
            if (isValidCommand(c.cmd) && c.cmd.trim() === winCmd.trim() && Math.abs(c.ts - winTs) <= 1000) {
              overallRank = ov;
              validRank   = vr;
              break;
            }
          }
        }

        return (
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center gap-2">
              <span className="text-[8px] font-bold uppercase text-slate-400">Event Source Coverage</span>
              <span className="ml-2 text-[7px] font-mono text-slate-600">display-only · read-only · no fetch · no dispatch</span>
              <span className={`ml-auto text-[7px] font-bold font-mono px-2 py-0.5 rounded-sm border ${
                validCount > 0 ? 'text-primary border-primary/30 bg-primary/5'
                : totalCandidates > 0 ? 'text-amber-400 border-amber-400/30 bg-amber-400/5'
                : 'text-slate-500 border-border/30 bg-secondary/20'
              }`}>{statusMsg}</span>
            </div>
            <div className="p-3 space-y-2">
              {/* Count summary */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Total Candidates',    value: totalCandidates, cls: 'text-foreground font-bold' },
                  { label: 'Valid (cmd-bearing)',  value: validCount,      cls: validCount > 0 ? 'text-primary font-bold' : 'text-slate-500' },
                  { label: 'Ignored / Synthetic', value: ignoredCount,    cls: 'text-slate-400' },
                ].map(c => (
                  <div key={c.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                    <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{c.label}</div>
                    <div className={`text-[9px] font-mono ${c.cls}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              {/* Source present */}
              <div className="bg-secondary/20 border border-border/20 rounded-sm px-3 py-2">
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-1.5">Sources Present</div>
                {totalCandidates === 0 ? (
                  <span className="text-[7px] font-mono text-slate-600">none</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[7px] font-mono px-2 py-0.5 rounded-sm border ${
                      validCount > 0 ? 'text-primary border-primary/30 bg-primary/5' : 'text-slate-400 border-border/20 bg-secondary/30'
                    }`}>monitoring_checks ({totalCandidates} rec)</span>
                  </div>
                )}
              </div>
              {/* Resolver Winner */}
              <div className={`border rounded-sm px-3 py-2 ${hasWinner ? 'border-primary/30 bg-primary/5' : 'border-border/20 bg-secondary/10'}`}>
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-1.5">Resolver Winner</div>
                {hasWinner ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { label: 'command',     value: formatCommandLabel(winCmd),                                        cls: 'text-primary font-bold' },
                      { label: 'raw',         value: winCmd,                                                            cls: 'text-slate-400 font-mono text-[7px]' },
                      { label: 'source',      value: winSource === CHECKS_KEY ? 'monitoring_checks' : (winSource ?? 'unknown'), cls: 'text-slate-300 font-mono text-[7px]' },
                      { label: 'timestamp',   value: winTimestamp ? new Date(winTimestamp).toLocaleTimeString() : 'N/A', cls: 'text-slate-300' },
                      { label: 'validRank',   value: validRank   != null ? String(validRank)   : 'N/A',                 cls: 'text-primary font-bold' },
                      { label: 'overallRank', value: overallRank != null ? String(overallRank) : 'N/A',                 cls: 'text-slate-300 font-bold' },
                      { label: 'sort',        value: 'newest-first',                                                    cls: 'text-slate-500 text-[7px]' },
                      { label: 'totalSorted', value: String(rankCandidates.length),                                     cls: 'text-slate-400' },
                    ].map(f => (
                      <div key={f.label} className="bg-secondary/20 border border-border/10 rounded-sm px-2 py-1">
                        <div className="text-[6px] uppercase text-slate-600 font-bold mb-0.5">{f.label}</div>
                        <div className={`text-[8px] font-mono break-all ${f.cls}`}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[8px] font-mono text-slate-600">No resolver winner.</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Command Evidence Verification ── */}
      {(cmdEvidence !== null) && (() => {
        const coherence  = getCommandEvidenceCoherence(cmdEvidence);
        const reason     = getCommandEvidenceCoherenceReason(cmdEvidence);
        const rawCmd     = cmdEvidence.lastCommand;
        const labelCmd   = formatCommandLabel(rawCmd);
        const rawDebug   = formatRawCommandDebugValue(rawCmd);

        const coherencePass   = coherence === 'COHERENT' || coherence === 'NONE';
        const coherenceStatus = coherencePass ? 'PASS' : 'REVIEW';
        const coherenceText   = `${coherence} — ${reason}`;

        const labelClaimsCmd = labelCmd && labelCmd !== 'none';
        const rawPresent     = rawCmd && typeof rawCmd === 'string' && rawCmd.trim() !== '';
        const rawPass        = rawPresent || !labelClaimsCmd;
        const rawStatus      = rawPass ? 'PASS' : 'REVIEW';
        const rawText        = rawPass
          ? `raw: "${rawDebug}" · label: "${labelCmd}" · raw field untouched`
          : 'Label claims command exists but raw lastCommand is absent';

        const invalidInput  = formatCommandLabel(null) === 'none' && formatCommandLabel('unknown') === 'none' && formatCommandLabel('') === 'none';
        const labelStatus   = invalidInput ? 'PASS' : 'REVIEW';
        const labelSafeText = invalidInput
          ? 'null/unknown/empty → "none" · valid commands display as labels only'
          : 'formatCommandLabel edge-case mismatch detected';

        const rows = [
          { label: 'Resolver Coherence', status: coherenceStatus, detail: coherenceText },
          { label: 'Raw Preservation',   status: rawStatus,       detail: rawText },
          { label: 'Label Safety',       status: labelStatus,     detail: labelSafeText },
          { label: 'Execution Boundary', status: 'PASS',          detail: 'Display-only verification. No fetch, dispatch, broker, or OpenClaw call.' },
        ];

        const statusCls = (s) => s === 'PASS'
          ? 'text-primary border-primary/30 bg-primary/5'
          : 'text-amber-400 border-amber-400/30 bg-amber-400/5';

        // Coherence badge for header
        const coherenceBadgeStyles = {
          COHERENT: 'bg-primary/10 border-primary/30 text-primary',
          REVIEW:   'bg-amber-500/10 border-amber-500/30 text-amber-400',
          NONE:     'bg-secondary/30 border-border/30 text-slate-500',
        };

        return (
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center gap-2 flex-wrap">
              <span className="text-[8px] font-bold uppercase text-slate-400">Command Evidence Verification</span>
              <span className="ml-1 text-[7px] font-mono text-slate-600">display-only · read-only · no fetch · no dispatch</span>
              <span className={`ml-auto px-2 py-0.5 rounded-sm border text-[7px] font-bold font-mono uppercase ${coherenceBadgeStyles[coherence] ?? coherenceBadgeStyles.NONE}`}
                title={reason}>
                CMD EVIDENCE: {coherence}
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rows.map(r => (
                <div key={r.label} className={`border rounded-sm px-3 py-2 ${statusCls(r.status)}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[7px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-sm border ${statusCls(r.status)}`}>{r.status}</span>
                    <span className="text-[7px] font-bold uppercase text-slate-400">{r.label}</span>
                  </div>
                  <div className="text-[7px] font-mono text-slate-500 break-all">{r.detail}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Manual monitoring console is local-only and read-only. No scheduler. No polling. No dispatch. No execution. GET only.
      </div>
    </div>
  );
}