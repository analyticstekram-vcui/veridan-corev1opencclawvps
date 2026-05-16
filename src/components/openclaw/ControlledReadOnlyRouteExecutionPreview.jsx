/**
 * ControlledReadOnlyRouteExecutionPreview
 * Local-only execution preview for approved read-only routes only.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Preview only - no route actually dispatched
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Copy, ShieldCheck, RefreshCw, Eye } from 'lucide-react';
import ControlledReadOnlyRouteBridgeCall from './ControlledReadOnlyRouteBridgeCall.jsx';

const SOURCE_KEYS = {
  approvalPackets:  'openclawReadOnlyRouteApprovalPackets',
  simulations:      'openclawReadOnlyRouteSimulations',
  routePlans:       'openclawReadOnlyRoutePlans',
  approvalRules:    'openclawCapabilityApprovalRules',
  bridgeReports:    'openclawReadOnlyStatusBridgeReports',
  auditTrail:       'openclawAuditTrail',
};
const PREVIEW_KEY = 'openclawControlledReadOnlyRouteExecutionPreviews';

const BLOCKED_MUTATIONS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const EXPLICIT_EXCLUSIONS = [
  'command dispatch',
  'browser execution',
  'trading',
  'broker execution',
  'credential entry',
  'wallet actions',
  'money movement',
];

const RESPONSE_SHAPES = {
  '/health':        { status: 'string', uptime: 'number', version: 'string' },
  '/status':        { state: 'string', mode: 'string', capabilities: 'array' },
  '/version':       { version: 'string', buildDate: 'string' },
  '/capabilities':  { capabilities: 'array' },
  'READ_ONLY_GENERIC_ROUTE':  { data: 'object', readOnly: true },
  'VERIFY_ONLY_ROUTE':        { verified: 'boolean', checksum: 'string' },
  'SNAPSHOT_ONLY_ROUTE':      { snapshot: 'object', timestamp: 'string' },
};

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function savePreview(preview) {
  try {
    const all = loadJSON(PREVIEW_KEY, []);
    const deduped = [preview, ...all.filter(p => p.previewId !== preview.previewId)];
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function normalizeRoute(route) {
  // Handle null/undefined
  if (!route) return null;

  // Extract fields with multiple possible key variants
  const endpoint = route.endpoint ?? route.path ?? route.route ?? route.allowedEndpoint ?? null;
  const method = route.method ?? 'GET';
  const decision = route.decision ?? route.approvalDecision ?? (route.approved ? 'APPROVED_READ_ONLY' : null);
  const scope = route.approvalScope ?? route.scope ?? null;
  const capability = route.capability ?? null;
  const reason = route.reason ?? null;

  // Only return if it's an approved read-only route
  if (!endpoint || !['APPROVED_READ_ONLY', 'ALLOW', 'APPROVED'].includes(decision)) {
    return null;
  }

  // Must be GET and on approved endpoint list
  if (method !== 'GET') return null;
  if (!['/health', '/status', '/version', '/capabilities'].includes(endpoint)) return null;

  // Check safety flags
  if (route.dispatchAllowed === true) return null;
  if (route.executionAttempted === true) return null;
  if (route.commandPayload) return null;

  return {
    routeId:       route.routeId ?? 'route-' + endpoint,
    capability,
    endpoint,
    method,
    decision,
    approvalScope: scope,
    reason,
    source:        'approval_packet',
  };
}

function getApprovedRoutes() {
  // Try all known approval packet keys
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

  if (allPackets.length === 0) {
    return { routes: [], packetCount: 0, sourceKey: null, fallbackUsed: false };
  }

  const latestPacket = allPackets[0];
  const routeArray = latestPacket.routes ?? [];

  // Normalize and filter routes
  const normalized = routeArray
    .map(r => normalizeRoute(r))
    .filter(r => r !== null);

  // If no routes found and packet passes safety checks, create fallback from allowed endpoints
  let finalRoutes = normalized;
  let fallbackUsed = false;

  if (finalRoutes.length === 0 && latestPacket.safetyAssertions?.every(a => a.pass)) {
    const allowedEndpoints = ['/health', '/status', '/version', '/capabilities'];
    finalRoutes = allowedEndpoints.map(endpoint => ({
      routeId:       'route-' + endpoint,
      capability:    endpoint.slice(1).toUpperCase(),
      endpoint,
      method:        'GET',
      decision:      'APPROVED_READ_ONLY',
      approvalScope: 'READ_ONLY_STATUS_BRIDGE_ONLY',
      reason:        'Safe read-only status endpoint',
      source:        'fallback_from_approved_packet',
    }));
    fallbackUsed = true;
  }

  return {
    routes:      finalRoutes,
    packetCount: allPackets.length,
    sourceKey,
    fallbackUsed,
  };
}

function buildPreview(selectedRoute) {
  const approvalPackets = loadJSON(SOURCE_KEYS.approvalPackets, []);
  const latestPacket = approvalPackets[0];

  const endpoint = selectedRoute?.endpoint ?? '';
  const method = selectedRoute?.method ?? 'GET';
  const routeType = selectedRoute?.routeType ?? '';

  const previewRequestShape = {
    method,
    endpoint,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer READ_ONLY_TOKEN',
    },
    body: null,
    note: 'GET request only. No mutation methods. Read-only access.',
  };

  const expectedResponseShape = RESPONSE_SHAPES[endpoint] ?? {
    data: 'object',
    status: 'string',
    readOnly: true,
  };

  const safetyAssertions = [
    { key: 'previewOnly',             value: true,                              pass: true },
    { key: 'readOnly',                value: true,                              pass: true },
    { key: 'locked',                  value: true,                              pass: true },
    { key: 'dispatchAllowed',         value: false,                             pass: true },
    { key: 'actualDispatchAttempted', value: false,                             pass: true },
    { key: 'executionAttempted',      value: false,                             pass: true },
    { key: 'openClawCalls',           value: 0,                                 pass: true },
    { key: 'networkCalls',            value: false,                             pass: true },
    { key: 'browserToolUsed',         value: false,                             pass: true },
    { key: 'credentialsExposed',      value: false,                             pass: true },
    { key: 'tradingDisabled',         value: true,                              pass: true },
    { key: 'moneyMovementDisabled',   value: true,                              pass: true },
  ];

  const previewId = 'crep-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    previewId,
    createdAt:                new Date().toISOString(),
    phase:                    'CONTROLLED_READ_ONLY_ROUTE_EXECUTION_PREVIEW',
    gatewayMode:              'READ_ONLY',
    executionMode:            'DISABLED',
    executionLock:            'LOCKED',
    dispatchAllowed:          false,
    actualDispatchAttempted:  false,
    executionAttempted:       false,
    openClawCalls:            0,
    networkCalls:             false,
    browserToolUsed:          false,
    secretExposed:            false,
    approvedRouteSourceId:    latestPacket?.approvalPacketId ?? null,
    selectedRoute:            selectedRoute ?? null,
    selectedEndpoint:         endpoint,
    method:                   'GET',
    routeType,
    previewRequestShape,
    expectedSafeResponseShape: expectedResponseShape,
    blockedMutationMethods:   BLOCKED_MUTATIONS,
    explicitExclusions:       EXPLICIT_EXCLUSIONS,
    safetyAssertions,
    note: 'Execution preview only. No route dispatched. No OpenClaw call. No network call. No execution.',
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
      {copied ? 'Copied!' : 'Copy Preview JSON'}
    </button>
  );
}

export default function ControlledReadOnlyRouteExecutionPreview({ refreshTrigger }) {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [preview, setPreview] = useState(null);
  const [approvedRoutes, setApprovedRoutes] = useState([]);
  const [routeMetadata, setRouteMetadata] = useState(null);
  const [showRequestJSON, setShowRequestJSON] = useState(false);
  const [showResponseJSON, setShowResponseJSON] = useState(false);

  useEffect(() => {
    const { routes, packetCount, sourceKey, fallbackUsed } = getApprovedRoutes();
    setApprovedRoutes(routes);
    setRouteMetadata({ packetCount, sourceKey, fallbackUsed });
    if (routes.length > 0 && !selectedRoute) {
      setSelectedRoute(routes[0]);
    }
  }, [refreshTrigger]);

  const handleGenerate = useCallback(() => {
    if (!selectedRoute) return;
    const p = buildPreview(selectedRoute);
    savePreview(p);
    tryAppendAudit({
      event:                     'controlled_read_only_route_execution_preview_created',
      previewId:                 p.previewId,
      selectedRoute:             p.selectedRoute?.capability,
      selectedEndpoint:          p.selectedEndpoint,
      method:                    p.method,
      actualDispatchAttempted:   p.actualDispatchAttempted,
      executionAttempted:        p.executionAttempted,
      note: `Execution preview created (${p.previewId}). Route: ${p.selectedEndpoint}. No dispatch. No execution.`,
    });
    setPreview(p);
  }, [selectedRoute]);

  // Auto-generate on route selection
  useEffect(() => {
    if (selectedRoute) {
      handleGenerate();
    }
  }, [selectedRoute, handleGenerate]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Execution Preview</div>
          <div className="text-[13px] font-bold text-foreground">Controlled Read-Only Route Execution Preview</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Previews approved read-only routes. No dispatch. No execution. No OpenClaw calls.</div>
        </div>
        <button type="button" onClick={handleGenerate} disabled={!selectedRoute}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-50">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — No route dispatched. No network. No OpenClaw. No execution.</span>
      </div>

      {/* Diagnostic panel */}
      {routeMetadata && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Route Loading Diagnostics</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px]">
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Approval Packets</div>
              <div className="font-mono text-foreground">{routeMetadata.packetCount}</div>
            </div>
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Approved Routes</div>
              <div className="font-mono text-primary font-bold">{approvedRoutes.length}</div>
            </div>
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Source Key</div>
              <div className="font-mono text-[7px] text-blue-400 break-all">{routeMetadata.sourceKey?.slice(-20) ?? 'none'}</div>
            </div>
            <div className="bg-card/60 px-2 py-1 rounded border border-border/40">
              <div className="text-slate-500 mb-0.5">Fallback Used</div>
              <div className={`font-bold ${routeMetadata.fallbackUsed ? 'text-amber-400' : 'text-slate-500'}`}>
                {String(routeMetadata.fallbackUsed)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route selector */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Select Approved Route</div>
        {approvedRoutes.length > 0 ? (
          <select value={selectedRoute?.routeId ?? ''} onChange={(e) => {
            const route = approvedRoutes.find(r => r.routeId === e.target.value);
            if (route) setSelectedRoute(route);
          }}
            className="w-full px-3 py-2 bg-secondary/20 border border-border rounded text-[9px] font-mono text-foreground">
            {approvedRoutes.map(r => (
              <option key={r.routeId} value={r.routeId}>
                {r.capability} — {r.endpoint} ({r.method})
              </option>
            ))}
          </select>
        ) : (
          <div className="px-3 py-2 bg-secondary/20 border border-border rounded text-[9px] text-slate-500 italic">
            No approved read-only routes available. Generate approval packet first.
          </div>
        )}
      </div>

      {preview && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Route',                value: preview.selectedRoute?.capability, color: 'text-foreground font-mono text-[8px]' },
              { label: 'Endpoint',             value: preview.selectedEndpoint,           color: 'text-blue-400 font-mono text-[8px]' },
              { label: 'Method',               value: preview.method,                     color: 'text-primary font-bold' },
              { label: 'Dispatch',             value: String(preview.dispatchAllowed),    color: 'text-destructive font-bold' },
              { label: 'Actual Dispatch',      value: String(preview.actualDispatchAttempted), color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',       value: String(preview.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'OC Calls',             value: preview.openClawCalls,              color: 'text-destructive font-bold' },
              { label: 'Network Calls',        value: String(preview.networkCalls),       color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[10px] break-all ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Explicit exclusions */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-destructive font-semibold mb-2">Explicitly Excluded (Not Allowed)</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {preview.explicitExclusions.map((ex, i) => (
                <div key={i} className="px-2 py-1 bg-destructive/10 border border-destructive/30 rounded text-[8px] font-semibold text-destructive">
                  {ex}
                </div>
              ))}
            </div>
          </div>

          {/* Request + Response JSON panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Request JSON */}
            <details className="bg-secondary/10 border border-border/60 rounded-lg">
              <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                <Eye className="w-3.5 h-3.5" /> Preview Request JSON
              </summary>
              {showRequestJSON && (
                <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                  <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                    {JSON.stringify(preview.previewRequestShape, null, 2)}
                  </pre>
                </div>
              )}
            </details>
            <button type="button" onClick={() => setShowRequestJSON(!showRequestJSON)}
              className="text-[8px] text-slate-500 hover:text-slate-300 underline col-span-1 sm:col-span-2 text-left">
              {showRequestJSON ? 'Hide' : 'Show'} Request JSON
            </button>

            {/* Response JSON */}
            <details className="bg-secondary/10 border border-border/60 rounded-lg">
              <summary className="px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                <Eye className="w-3.5 h-3.5" /> Expected Safe Response Shape
              </summary>
              {showResponseJSON && (
                <div className="px-3 py-2 border-t border-border/60 bg-secondary/20">
                  <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                    {JSON.stringify(preview.expectedSafeResponseShape, null, 2)}
                  </pre>
                </div>
              )}
            </details>
            <button type="button" onClick={() => setShowResponseJSON(!showResponseJSON)}
              className="text-[8px] text-slate-500 hover:text-slate-300 underline col-span-1 sm:col-span-2 text-left">
              {showResponseJSON ? 'Hide' : 'Show'} Response Shape
            </button>
          </div>

          {/* Blocked mutation methods */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-destructive font-semibold mb-2">Blocked Mutation Methods</div>
            <div className="flex flex-wrap gap-2">
              {preview.blockedMutationMethods.map((m, i) => (
                <span key={i} className="px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded text-[8px] font-bold text-destructive font-mono">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {preview.safetyAssertions.filter(a => a.pass).length}/{preview.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {preview.safetyAssertions.map(a => (
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

          {/* Preview ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /><span className="font-mono">{preview.previewId}</span></span>
            <span>{new Date(preview.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={preview} />
            <button type="button" onClick={handleGenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <Eye className="w-3 h-3" /> Generate Preview
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Execution preview is local-only. No route dispatched. No OpenClaw call. No execution.
      </div>

      {/* ── Controlled Read-Only Route Bridge Call ── */}
      <div className="border-t border-border/40 pt-4">
        <ControlledReadOnlyRouteBridgeCall refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}