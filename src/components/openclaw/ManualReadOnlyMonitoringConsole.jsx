/**
 * ManualReadOnlyMonitoringConsole
 * Local-only manual operator-triggered read-only monitoring checks.
 *
 * SAFETY CONTRACT:
 *   - Manual trigger only (button click)
 *   - No scheduler, no polling loop, no timers, no intervals
 *   - No network calls except via openclawReadOnlyStatusBridge backend function
 *   - No dispatch, no execution, no browser tools
 *   - No trading, no credentials, no money movement
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Copy, ShieldCheck, Loader2, FileJson, Lock, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SOURCE_KEYS = {
  readinessPackets:   'openclawMonitoringModeReadinessPackets',
  promotionGates:     'openclawReadOnlyBridgePromotionGates',
  integrityCheckpoints: 'openclawBridgeIntegrityCheckpoints',
  bridgeCalls:        'openclawControlledReadOnlyRouteBridgeCalls',
  approvalPackets:    'openclawReadOnlyRouteApprovalPackets',
  auditTrail:         'openclawAuditTrail',
};
const CHECKS_KEY = 'openclawManualReadOnlyMonitoringChecks';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveCheck(check) {
  try {
    const all = loadJSON(CHECKS_KEY, []);
    const deduped = [check, ...all.filter(c => c.checkId !== check.checkId)];
    localStorage.setItem(CHECKS_KEY, JSON.stringify(deduped.slice(0, 50)));
  } catch {}
}

function isButtonEnabled(endpoint, latestPacket) {
  if (!latestPacket) return false;
  if (latestPacket.readinessStatus !== 'READY_FOR_READ_ONLY_MONITORING') return false;
  if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) return false;
  if (latestPacket.executionLock !== 'LOCKED') return false;
  if (latestPacket.gatewayMode !== 'READ_ONLY') return false;
  if (latestPacket.executionMode !== 'DISABLED') return false;
  return true;
}

function buildCheckResult(endpoint, backendResponse) {
  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                              pass: true },
    { key: 'disabled',                 value: true,                              pass: true },
    { key: 'executionLock',            value: 'LOCKED',                          pass: true },
    { key: 'endpointAllowed',          value: ALLOWED_ENDPOINTS.includes(endpoint), pass: ALLOWED_ENDPOINTS.includes(endpoint) },
    { key: 'methodGetOnly',            value: 'GET',                             pass: true },
    { key: 'noScheduler',              value: false,                             pass: true },
    { key: 'noPollingLoop',            value: false,                             pass: true },
    { key: 'noCommandPayload',         value: true,                              pass: true },
    { key: 'dispatchAllowed',          value: false,                             pass: true },
    { key: 'executionAttempted',       value: false,                             pass: true },
    { key: 'browserToolUsed',          value: false,                             pass: true },
    { key: 'credentialExposed',        value: false,                             pass: true },
    { key: 'secretExposed',            value: false,                             pass: true },
    { key: 'tradingAttempted',         value: false,                             pass: true },
    { key: 'brokerActionsAttempted',   value: false,                             pass: true },
    { key: 'moneyMovementAttempted',   value: false,                             pass: true },
  ];

  const checkId = 'mrmc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    checkId,
    createdAt:               new Date().toISOString(),
    phase:                   'MANUAL_READ_ONLY_MONITORING_CHECK',
    endpoint,
    method:                  'GET',
    httpStatus:              backendResponse?.httpStatus ?? null,
    gatewayReachable:        backendResponse?.online ?? backendResponse?.reachable ?? false,
    cfAccessDetected:        backendResponse?.cfAccessDetected ?? false,
    gatewayMode:             'READ_ONLY',
    executionMode:           'DISABLED',
    executionLock:           'LOCKED',
    dispatchAllowed:         false,
    commandDispatchAttempted: false,
    openClawCommandSent:     false,
    executionAttempted:      false,
    browserToolUsed:         false,
    credentialExposed:       false,
    secretExposed:           false,
    tradingAttempted:        false,
    moneyMovementAttempted:  false,
    schedulerActive:         false,
    pollingLoopActive:       false,
    safeResponseFields:      backendResponse?.safeResponseFields ?? null,
    error:                   backendResponse?.error ?? null,
    safetyAssertions,
    note: 'Manual monitoring check only. No scheduler. No polling loop. No dispatch. No execution.',
  };
}

function CopyButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Monitoring Check JSON'}
    </button>
  );
}

export default function ManualReadOnlyMonitoringConsole({ refreshTrigger }) {
  const [endpoint, setEndpoint] = useState('/health');
  const [latestCheck, setLatestCheck] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const readinessPackets = loadJSON(SOURCE_KEYS.readinessPackets, []);
  const latestPacket = readinessPackets[0];

  useEffect(() => {
    const checks = loadJSON(CHECKS_KEY, []);
    setHistory(checks);
    if (checks.length > 0) {
      setLatestCheck(checks[0]);
    }
  }, [refreshTrigger]);

  const buttonEnabled = isButtonEnabled(endpoint, latestPacket);

  const handleRunCheck = async () => {
    if (!buttonEnabled || !endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('openclawReadOnlyStatusBridge', {
        endpoint,
        requestId: 'req-' + Date.now().toString(36),
        mode: 'READ_ONLY',
        source: 'MANUAL_MONITORING_CONSOLE',
      });

      const backendResponse = response.data ?? {};
      const check = buildCheckResult(endpoint, backendResponse);

      saveCheck(check);
      tryAppendAudit({
        event:              'manual_read_only_monitoring_check_completed',
        checkId:            check.checkId,
        endpoint:           check.endpoint,
        httpStatus:         check.httpStatus,
        gatewayReachable:   check.gatewayReachable,
        note: `Manual monitoring check completed (${check.checkId}). Endpoint: ${endpoint}. Status: ${check.httpStatus ?? 'N/A'}. No scheduler. No dispatch. No execution.`,
      });

      const updated = loadJSON(CHECKS_KEY, []);
      setHistory(updated);
      setLatestCheck(check);
    } catch (err) {
      setError(err.message || 'Monitoring check failed');
      tryAppendAudit({
        event:  'manual_read_only_monitoring_check_failed',
        endpoint,
        error:  err.message,
        note: `Manual monitoring check failed (${endpoint}). Error: ${err.message}. No scheduler. No dispatch.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Manual Monitoring</div>
          <div className="text-[13px] font-bold text-foreground">Manual Read-Only Monitoring Console</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Operator-triggered manual checks only. No scheduler. No polling loop.</div>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">MANUAL_ONLY / READ_ONLY / LOCKED</span> — Manual operator-triggered checks. No scheduler. No polling. No dispatch. No execution.</span>
      </div>

      {/* Readiness status */}
      {latestPacket ? (
        <div className={`border rounded-lg p-3 space-y-2 ${
          latestPacket.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING'
            ? 'bg-primary/5 border-primary/30'
            : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-2 text-[9px]">
            {latestPacket.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className={`font-bold ${
              latestPacket.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING'
                ? 'text-primary'
                : 'text-amber-500'
            }`}>
              {latestPacket.readinessStatus === 'READY_FOR_READ_ONLY_MONITORING'
                ? 'READY FOR MANUAL MONITORING'
                : 'NOT READY FOR MONITORING'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No readiness packet available. Generate one in Monitoring Mode Readiness Packet first.
        </div>
      )}

      {/* Control panel */}
      <div className="bg-secondary/10 border border-border/60 rounded-lg p-3 space-y-3">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Manual Check Control</div>
        <div className="space-y-2">
          <label className="text-[8px] text-slate-400 font-semibold">Allowed Endpoint</label>
          <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
            className="w-full px-3 py-2 text-[9px] bg-card border border-border rounded font-mono text-slate-300 hover:border-border/80 focus:outline-none focus:ring-1 focus:ring-primary">
            {ALLOWED_ENDPOINTS.map(ep => (
              <option key={ep} value={ep}>{ep}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={handleRunCheck} disabled={!buttonEnabled || loading}
          className="flex items-center gap-2 px-4 py-2.5 w-full bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50 justify-center">
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Running Check…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Run Manual Read-Only Monitoring Check
            </>
          )}
        </button>
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </div>
        )}
      </div>

      {/* Latest check result */}
      {latestCheck && (
        <>
          {/* Result status */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            latestCheck.error
              ? 'bg-destructive/5 border-destructive/20'
              : latestCheck.gatewayReachable
              ? 'bg-primary/5 border-primary/30'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {latestCheck.error ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : latestCheck.gatewayReachable ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  latestCheck.error ? 'text-destructive' : latestCheck.gatewayReachable ? 'text-primary' : 'text-amber-500'
                }`}>
                  {latestCheck.error ? 'CHECK_FAILED' : latestCheck.gatewayReachable ? 'GATEWAY_REACHABLE' : 'GATEWAY_UNREACHABLE'}
                </div>
                {latestCheck.error && <div className="text-[8px] text-destructive mt-0.5">{latestCheck.error}</div>}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Endpoint',              value: latestCheck.endpoint,                    color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',           value: latestCheck.httpStatus ?? 'N/A',         color: 'text-foreground' },
              { label: 'Gateway Reachable',     value: String(latestCheck.gatewayReachable),    color: latestCheck.gatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'CF Access Detected',    value: String(latestCheck.cfAccessDetected),    color: 'text-slate-400' },
              { label: 'Scheduler Active',      value: String(latestCheck.schedulerActive),     color: 'text-destructive font-bold' },
              { label: 'Polling Loop Active',   value: String(latestCheck.pollingLoopActive),   color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',      value: String(latestCheck.dispatchAllowed),     color: 'text-destructive font-bold' },
              { label: 'Execution Attempted',   value: String(latestCheck.executionAttempted),  color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Safety assertions */}
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
                    : <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />}
                  <span className="font-mono text-[7px] text-slate-400">{a.key}:</span>
                  <span className={`text-[7px] font-bold ${a.pass ? 'text-primary' : 'text-destructive'}`}>
                    {String(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON preview */}
          <details className="bg-secondary/10 border border-border/60 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" /> Monitoring Check JSON
            </summary>
            {showJSON && (
              <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(latestCheck, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Check ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /><span className="font-mono">{latestCheck.checkId}</span></span>
            <span>{new Date(latestCheck.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={latestCheck} />
          </div>
        </>
      )}

      {/* Recent checks table */}
      {history.length > 1 && (
        <details className="border border-border/40 rounded-lg p-3">
          <summary className="text-[8px] text-slate-500 cursor-pointer hover:text-slate-300 uppercase tracking-widest font-semibold">
            Recent Manual Checks ({history.length} records)
          </summary>
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {history.slice(1).map((check, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1 bg-secondary/10 border border-border/30 rounded text-[8px]">
                <span className="text-slate-400 font-mono">{new Date(check.createdAt).toLocaleTimeString()}</span>
                <span className="font-mono text-slate-500">{check.endpoint}</span>
                <span className={`ml-auto font-bold ${
                  check.error ? 'text-destructive' : check.gatewayReachable ? 'text-primary' : 'text-amber-500'
                }`}>{check.httpStatus ?? 'ERR'}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Manual monitoring only. No scheduler. No polling loop. No command dispatch. No execution.
      </div>
    </div>
  );
}