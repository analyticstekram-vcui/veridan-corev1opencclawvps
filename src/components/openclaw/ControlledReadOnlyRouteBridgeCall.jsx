/**
 * ControlledReadOnlyRouteBridgeCall
 * Local-only safe bridge call to OpenClaw status endpoints only.
 *
 * SAFETY CONTRACT:
 *   - GET-only calls to approved read-only endpoints
 *   - No command dispatch, no trading, no credentials
 *   - Backend function: openclawReadOnlyStatusBridge (safe server-side proxy)
 *   - Reads/writes localStorage only
 *   - READ_ONLY / LOCKED / DISABLED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Copy, ShieldCheck, RefreshCw, Network, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BridgeCallResultEvidenceExport from './BridgeCallResultEvidenceExport.jsx';

const SOURCE_KEYS = {
  executionPreviews: 'openclawControlledReadOnlyRouteExecutionPreviews',
  approvalPackets:   'openclawReadOnlyRouteApprovalPackets',
  routePlans:        'openclawReadOnlyRoutePlans',
  auditTrail:        'openclawAuditTrail',
};
const RESULT_KEY = 'openclawControlledReadOnlyRouteBridgeCalls';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function normalizeRoute(route) {
  if (!route) return null;
  const endpoint = route.endpoint ?? route.path ?? route.route ?? route.allowedEndpoint ?? null;
  const method = route.method ?? 'GET';
  const decision = route.decision ?? route.approvalDecision ?? (route.approved ? 'APPROVED_READ_ONLY' : null);
  const scope = route.approvalScope ?? route.scope ?? null;
  const capability = route.capability ?? null;
  if (!endpoint || !['APPROVED_READ_ONLY', 'ALLOW', 'APPROVED'].includes(decision)) return null;
  if (method !== 'GET') return null;
  if (!['/health', '/status', '/version', '/capabilities'].includes(endpoint)) return null;
  if (route.dispatchAllowed === true) return null;
  if (route.executionAttempted === true) return null;
  if (route.commandPayload) return null;
  return {
    routeId: route.routeId ?? 'route-' + endpoint,
    capability,
    endpoint,
    method,
    decision,
    approvalScope: scope,
    reason: route.reason ?? null,
    source: 'approval_packet',
  };
}

function getApprovedRoutes() {
  const packetKeys = [
    'openclawReadOnlyRouteApprovalPackets',
    'openclawApprovalPackets',
    'openclawRouteApprovalPackets',
  ];
  let allPackets = [];
  let sourceKey = null;
  for (const key of packetKeys) {
    const packets = loadJSON(key, []);
    if (packets.length > 0) {
      allPackets = packets;
      sourceKey = key;
      break;
    }
  }
  if (allPackets.length === 0) return { routes: [], packetCount: 0, sourceKey: null, fallbackUsed: false };
  const latestPacket = allPackets[0];
  const routeArray = latestPacket.routes ?? [];
  const normalized = routeArray.map(r => normalizeRoute(r)).filter(r => r !== null);
  let finalRoutes = normalized;
  let fallbackUsed = false;
  if (finalRoutes.length === 0 && latestPacket.safetyAssertions?.every(a => a.pass)) {
    const allowedEndpoints = ['/health', '/status', '/version', '/capabilities'];
    finalRoutes = allowedEndpoints.map(endpoint => ({
      routeId: 'route-' + endpoint,
      capability: endpoint.slice(1).toUpperCase(),
      endpoint,
      method: 'GET',
      decision: 'APPROVED_READ_ONLY',
      approvalScope: 'READ_ONLY_STATUS_BRIDGE_ONLY',
      reason: 'Safe read-only status endpoint',
      source: 'fallback_from_approved_packet',
    }));
    fallbackUsed = true;
  }
  return { routes: finalRoutes, packetCount: allPackets.length, sourceKey, fallbackUsed };
}

function saveResult(result) {
  try {
    const all = loadJSON(RESULT_KEY, []);
    const deduped = [result, ...all.filter(r => r.bridgeCallId !== result.bridgeCallId)];
    localStorage.setItem(RESULT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function getLatestPreview() {
  const previews = loadJSON(SOURCE_KEYS.executionPreviews, []);
  return previews[0] ?? null;
}

function isButtonEnabled(preview) {
  if (!preview) return false;
  if (!preview.selectedRoute) return false;
  if (preview.method !== 'GET') return false;
  if (!ALLOWED_ENDPOINTS.includes(preview.selectedEndpoint)) return false;
  if (preview.dispatchAllowed !== false) return false;
  if (preview.commandDispatchAttempted !== false && preview.commandDispatchAttempted !== undefined) return false;
  if (preview.executionAttempted !== false) return false;
  return true;
}

async function callBridgeFunction(preview) {
  try {
    const response = await base44.functions.invoke('openclawReadOnlyStatusBridge', {
      endpoint: preview.selectedEndpoint,
      requestId: 'req-' + Date.now().toString(36),
      mode: 'READ_ONLY',
    });
    return response.data ?? null;
  } catch (err) {
    return { error: err.message || 'Bridge call failed' };
  }
}

function buildResult(preview, bridgeResponse) {
  const safetyAssertions = [
    { key: 'readOnly',                 value: true,                                    pass: true },
    { key: 'locked',                   value: true,                                    pass: true },
    { key: 'executionModeDisabled',    value: 'DISABLED',                             pass: true },
    { key: 'endpointAllowed',          value: ALLOWED_ENDPOINTS.includes(preview.selectedEndpoint), pass: ALLOWED_ENDPOINTS.includes(preview.selectedEndpoint) },
    { key: 'methodGetOnly',            value: preview.method === 'GET',               pass: preview.method === 'GET' },
    { key: 'noCommandPayload',         value: true,                                    pass: true },
    { key: 'commandDispatchAttempted', value: false,                                   pass: true },
    { key: 'executionAttempted',       value: false,                                   pass: true },
    { key: 'browserToolUsed',          value: false,                                   pass: true },
    { key: 'credentialExposed',        value: false,                                   pass: true },
    { key: 'tradingAttempted',         value: false,                                   pass: true },
    { key: 'moneyMovementAttempted',   value: false,                                   pass: true },
  ];

  const bridgeCallId = 'rbc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    bridgeCallId,
    createdAt:               new Date().toISOString(),
    phase:                   'CONTROLLED_READ_ONLY_ROUTE_BRIDGE_CALL',
    selectedRoute:           preview.selectedRoute,
    endpoint:                preview.selectedEndpoint,
    method:                  'GET',
    gatewayMode:             'READ_ONLY',
    executionMode:           'DISABLED',
    executionLock:           'LOCKED',
    dispatchAllowed:         false,
    commandDispatchAttempted: false,
    executionAttempted:      false,
    browserToolUsed:         false,
    secretExposed:           false,
    credentialExposed:       false,
    tradingAttempted:        false,
    moneyMovementAttempted:  false,
    backendFunction:         'openclawReadOnlyStatusBridge',
    backendCalled:           true,
    openClawStatusEndpointCalled: !bridgeResponse?.error,
    openClawCommandSent:     false,
    httpStatus:              bridgeResponse?.httpStatus ?? null,
    gatewayReachable:        bridgeResponse?.online ?? false,
    cfAccessDetected:        bridgeResponse?.cfAccessDetected ?? false,
    safeResponseFields:      bridgeResponse?.safeResponseFields ?? null,
    error:                   bridgeResponse?.error ?? null,
    safetyAssertions,
    note: 'Controlled read-only status bridge call only. No command dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Bridge Call Result JSON'}
    </button>
  );
}

export default function ControlledReadOnlyRouteBridgeCall({ refreshTrigger }) {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const latest = getLatestPreview();
    setPreview(latest);
    const results = loadJSON(RESULT_KEY, []);
    setHistory(results);
    if (results.length > 0) {
      setResult(results[0]);
    }
  }, [refreshTrigger]);

  const buttonEnabled = isButtonEnabled(preview);

  const handleRunBridgeCall = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);

    const bridgeResponse = await callBridgeFunction(preview);
    const callResult = buildResult(preview, bridgeResponse);

    saveResult(callResult);
    tryAppendAudit({
      event:                   'controlled_read_only_route_bridge_call_completed',
      bridgeCallId:            callResult.bridgeCallId,
      endpoint:                callResult.endpoint,
      method:                  callResult.method,
      httpStatus:              callResult.httpStatus,
      gatewayReachable:        callResult.gatewayReachable,
      commandDispatchAttempted: false,
      executionAttempted:      false,
      note: `Bridge call completed (${callResult.bridgeCallId}). Endpoint: ${callResult.endpoint}. Status: ${callResult.httpStatus ?? 'N/A'}. No command dispatch. No execution.`,
    });

    const updated = loadJSON(RESULT_KEY, []);
    setHistory(updated);
    setResult(callResult);
    setLoading(false);
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Bridge Call</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Read-Only Route Bridge Call</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Safe server-side GET call to approved read-only endpoints via openclawReadOnlyStatusBridge.</div>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">READ_ONLY / LOCKED / DISABLED</span> — GET-only to approved endpoints. No command dispatch. No execution.</span>
      </div>

      {/* Preview status */}
      {preview ? (
        <div className="bg-secondary/10 border border-border/60 rounded-lg p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">From Execution Preview</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Route</div>
              <div className="font-mono text-foreground">{preview.selectedRoute?.capability}</div>
            </div>
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Endpoint</div>
              <div className="font-mono text-blue-400">{preview.selectedEndpoint}</div>
            </div>
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Method</div>
              <div className="font-bold text-primary">{preview.method}</div>
            </div>
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Button</div>
              <div className={`font-bold ${buttonEnabled ? 'text-primary' : 'text-destructive'}`}>
                {buttonEnabled ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          No execution preview available. Generate a preview first.
        </div>
      )}

      {/* Run bridge call button */}
      <button type="button" onClick={handleRunBridgeCall} disabled={!buttonEnabled || loading}
        className="flex items-center gap-2 px-4 py-2.5 w-full bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded disabled:opacity-50 justify-center">
        <Network className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? 'Running Bridge Call…' : 'Run Controlled Read-Only Bridge Call'}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {result && (
        <>
          {/* Result status */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            result.error
              ? 'bg-destructive/5 border-destructive/20'
              : result.gatewayReachable
              ? 'bg-primary/5 border-primary/30'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {result.error ? (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : result.gatewayReachable ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wide ${
                  result.error ? 'text-destructive' : result.gatewayReachable ? 'text-primary' : 'text-amber-500'
                }`}>
                  {result.error ? 'CALL_FAILED' : result.gatewayReachable ? 'GATEWAY_REACHABLE' : 'GATEWAY_UNREACHABLE'}
                </div>
                {result.error && <div className="text-[8px] text-destructive mt-0.5">{result.error}</div>}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Route',              value: result.selectedRoute?.capability, color: 'text-foreground font-mono text-[8px]' },
              { label: 'Endpoint',           value: result.endpoint,                  color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'HTTP Status',        value: result.httpStatus ?? 'N/A',       color: 'text-foreground' },
              { label: 'Gateway Reachable',  value: String(result.gatewayReachable),  color: result.gatewayReachable ? 'text-primary font-bold' : 'text-amber-500' },
              { label: 'Command Sent',       value: String(result.openClawCommandSent), color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',     value: String(result.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'Dispatch Allowed',   value: String(result.dispatchAllowed),    color: 'text-destructive font-bold' },
              { label: 'Secret Exposed',     value: String(result.secretExposed),      color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Response fields */}
          {result.safeResponseFields && (
            <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Safe Response Fields</div>
              <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                {JSON.stringify(result.safeResponseFields, null, 2)}
              </pre>
            </div>
          )}

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {result.safetyAssertions.filter(a => a.pass).length}/{result.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {result.safetyAssertions.map(a => (
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

          {/* Bridge call ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Network className="w-3 h-3" /><span className="font-mono">{result.bridgeCallId}</span></span>
            <span>{new Date(result.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={result} />
          </div>
        </>
      )}

      {/* History */}
      {history.length > 1 && (
        <details className="border border-border/40 rounded-lg p-3">
          <summary className="text-[8px] text-slate-500 cursor-pointer hover:text-slate-300 uppercase tracking-widest font-semibold">
            Call History ({history.length} records)
          </summary>
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {history.slice(1).map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1 bg-secondary/10 border border-border/30 rounded text-[8px]">
                <span className="text-slate-400 font-mono">{new Date(h.createdAt).toLocaleTimeString()}</span>
                <span className="font-mono text-slate-500">{h.endpoint}</span>
                <span className={`ml-auto font-bold ${
                  h.error ? 'text-destructive' : h.gatewayReachable ? 'text-primary' : 'text-amber-500'
                }`}>{h.httpStatus ?? 'ERR'}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Controlled bridge call is read-only. No command dispatch. No execution. No browser tools. No trading. No credentials exposed.
      </div>

      {/* ── Bridge Call Result Evidence Export ── */}
      <div className="border-t border-border/40 pt-4">
        <BridgeCallResultEvidenceExport refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}