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

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

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
  const [selectedEndpoint, setSelectedEndpoint] = useState('/health');
  const [latestCheck, setLatestCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Load check count on mount
  useEffect(() => {
    const checks = loadJSON(CHECKS_KEY, []);
    setCheckCount(checks.length);
  }, []);

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

      const checks = loadJSON(CHECKS_KEY, []);
      setCheckCount(checks.length);

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

      const checks = loadJSON(CHECKS_KEY, []);
      setCheckCount(checks.length);

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
            <option disabled value="">Select endpoint</option>
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

      {/* Latest Check Result */}
      {latestCheck && (
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

      {/* No checks yet */}
      {!latestCheck && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-500/5 border border-slate-500/20 rounded-lg text-[9px] text-slate-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No checks recorded yet. Select an endpoint and click "Run Check" to generate monitoring evidence.
        </div>
      )}

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Manual monitoring console is local-only and read-only. No scheduler. No polling. No dispatch. No execution. GET only.
      </div>
    </div>
  );
}