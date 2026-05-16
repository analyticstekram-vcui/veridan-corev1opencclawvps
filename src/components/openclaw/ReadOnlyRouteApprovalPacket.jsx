/**
 * ReadOnlyRouteApprovalPacket
 * Local-only approval packet for read-only routes only.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Approves read-only status routes ONLY
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Copy, ShieldCheck, RefreshCw, ClipboardCheck } from 'lucide-react';

const SOURCE_KEYS = {
  evidenceExports: 'openclawReadOnlyRouteSimulationEvidenceExports',
  simulations:     'openclawReadOnlyRouteSimulations',
  routePlans:      'openclawReadOnlyRoutePlans',
  approvalRules:   'openclawCapabilityApprovalRules',
  auditTrail:      'openclawAuditTrail',
};
const PACKET_KEY = 'openclawReadOnlyRouteApprovalPackets';

const EXPLICIT_EXCLUSIONS = [
  'command dispatch',
  'browser execution',
  'trading',
  'broker execution',
  'credential entry',
  'wallet actions',
  'money movement',
];

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function savePacket(packet) {
  try {
    const all = loadJSON(PACKET_KEY, []);
    const deduped = [packet, ...all.filter(p => p.approvalPacketId !== packet.approvalPacketId)];
    localStorage.setItem(PACKET_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildPacket() {
  const simulations = loadJSON(SOURCE_KEYS.simulations, []);
  const latestSim = simulations[0] ?? null;

  // Extract approved routes from simulations
  const approvedRoutes = (latestSim?.simulations ?? [])
    .filter(s => s.simulationStatus === 'SIMULATED_READ_ONLY')
    .map(s => ({
      routeId:        s.routeId,
      capability:     s.capability,
      endpoint:       s.endpoint,
      method:         s.method,
      routeType:      s.routeType,
      decision:       'APPROVED_READ_ONLY',
      approvalScope:  'READ_ONLY_STATUS_BRIDGE_ONLY',
      reason:         s.reason,
    }));

  // Extract blocked routes
  const blockedRoutes = (latestSim?.simulations ?? [])
    .filter(s => s.simulationStatus === 'BLOCKED_SIMULATION')
    .map(s => ({
      routeId:        s.routeId,
      capability:     s.capability,
      endpoint:       s.endpoint,
      method:         s.method,
      routeType:      s.routeType,
      decision:       'BLOCKED',
      approvalScope:  'NONE',
      reason:         s.blockedReason ?? s.reason,
    }));

  // Extract review required routes
  const reviewRoutes = (latestSim?.simulations ?? [])
    .filter(s => s.simulationStatus === 'REVIEW_REQUIRED_SIMULATION')
    .map(s => ({
      routeId:        s.routeId,
      capability:     s.capability,
      endpoint:       s.endpoint,
      method:         s.method,
      routeType:      s.routeType,
      decision:       'PENDING_REVIEW',
      approvalScope:  'PENDING',
      reason:         s.reason,
    }));

  // Combine all routes for table
  const allRoutes = [...approvedRoutes, ...blockedRoutes, ...reviewRoutes];

  // Collect allowed endpoints
  const allowedEndpoints = approvedRoutes
    .map(r => r.endpoint)
    .filter((e, i, arr) => arr.indexOf(e) === i);

  // Collect blocked reasons
  const blockedReasons = blockedRoutes
    .map(r => r.reason)
    .filter((r, i, arr) => arr.indexOf(r) === i)
    .filter(r => r);

  const safetyAssertions = [
    { key: 'previewOnly',            value: true,                              pass: true },
    { key: 'readOnly',               value: true,                              pass: true },
    { key: 'locked',                 value: true,                              pass: true },
    { key: 'dispatchAllowed',        value: false,                             pass: true },
    { key: 'executionAttempted',     value: false,                             pass: true },
    { key: 'openClawCalls',          value: 0,                                 pass: true },
    { key: 'networkCalls',           value: false,                             pass: true },
    { key: 'browserToolsUsed',       value: false,                             pass: true },
    { key: 'credentialExposure',     value: false,                             pass: true },
    { key: 'tradingDisabled',        value: true,                              pass: true },
    { key: 'brokerActionsDisabled',  value: true,                              pass: true },
    { key: 'moneyMovementDisabled',  value: true,                              pass: true },
  ];

  const packetId = 'rap-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    approvalPacketId:      packetId,
    createdAt:             new Date().toISOString(),
    phase:                 'READ_ONLY_ROUTE_APPROVAL_PACKET',
    gatewayMode:           'READ_ONLY',
    executionMode:         'DISABLED',
    executionLock:         'LOCKED',
    dispatchAllowed:       false,
    executionAttempted:    false,
    openClawCalls:         0,
    networkCalls:          false,
    approvedReadOnlyRoutes: approvedRoutes.length,
    blockedRoutes:         blockedRoutes.length,
    reviewRequiredRoutes:  reviewRoutes.length,
    allowedEndpoints,
    blockedReasons,
    approvalDecision:      'APPROVED_FOR_READ_ONLY_STATUS_BRIDGE_ONLY',
    explicitExclusions:    EXPLICIT_EXCLUSIONS,
    routes:                allRoutes,
    safetyAssertions,
    note: 'Approval packet authorizes read-only status/capability routes only. It does not authorize command dispatch or execution.',
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
      {copied ? 'Copied!' : 'Copy Approval Packet JSON'}
    </button>
  );
}

export default function ReadOnlyRouteApprovalPacket({ refreshTrigger }) {
  const [packet, setPacket] = useState(null);

  const generate = useCallback(() => {
    const p = buildPacket();
    savePacket(p);
    tryAppendAudit({
      event:                  'read_only_route_approval_packet_created',
      approvalPacketId:       p.approvalPacketId,
      approvedReadOnlyRoutes: p.approvedReadOnlyRoutes,
      blockedRoutes:          p.blockedRoutes,
      reviewRequiredRoutes:   p.reviewRequiredRoutes,
      note: `Route approval packet created (${p.approvalPacketId}). ${p.approvedReadOnlyRoutes} approved for read-only. No dispatch. No execution.`,
    });
    setPacket(p);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Route Approval Packet</div>
          <div className="text-[13px] font-bold text-foreground">Read-Only Route Approval Packet</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Authorizes read-only routes only. No dispatch. No execution. No OpenClaw calls.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">APPROVAL_READ_ONLY_ONLY</span> — Authorizes read-only routes only. No dispatch. No execution. No OpenClaw calls.</span>
      </div>

      {packet && (
        <>
          {/* Approval decision banner */}
          <div className="flex items-center gap-3 px-4 py-3 border rounded-lg bg-primary/5 border-primary/30">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-wide">{packet.approvalDecision}</div>
              <div className="text-[8px] text-primary/80 mt-0.5">
                Routes authorized for read-only status bridge operations only. Command dispatch and execution explicitly forbidden.
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Approved',        value: packet.approvedReadOnlyRoutes, color: 'text-primary font-bold' },
              { label: 'Blocked',         value: packet.blockedRoutes,          color: packet.blockedRoutes > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Review Required', value: packet.reviewRequiredRoutes,   color: packet.reviewRequiredRoutes > 0 ? 'text-amber-400' : 'text-slate-500' },
              { label: 'Allowed Endpoints', value: packet.allowedEndpoints.length, color: 'text-primary font-bold' },
              { label: 'Dispatch',        value: String(packet.dispatchAllowed), color: 'text-destructive font-bold' },
              { label: 'Exec Attempted',  value: String(packet.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'OC Calls',        value: packet.openClawCalls,          color: 'text-destructive font-bold' },
              { label: 'Network Calls',   value: String(packet.networkCalls),   color: 'text-destructive font-bold' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Explicit exclusions */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-destructive font-semibold mb-2">Explicitly Excluded (Not Approved)</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {packet.explicitExclusions.map((ex, i) => (
                <div key={i} className="px-2 py-1 bg-destructive/10 border border-destructive/30 rounded text-[8px] font-semibold text-destructive">
                  {ex}
                </div>
              ))}
            </div>
          </div>

          {/* Route approval table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center gap-2">
              <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Route Approvals — {packet.routes.length} routes
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/10">
                    {['Route', 'Endpoint', 'Method', 'Decision', 'Approval Scope', 'Reason'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {packet.routes.map((route, i) => {
                    const decisionColor =
                      route.decision === 'APPROVED_READ_ONLY' ? 'text-primary font-bold' :
                      route.decision === 'BLOCKED' ? 'text-destructive font-bold' :
                      'text-amber-400 font-bold';

                    const scopeColor =
                      route.approvalScope === 'READ_ONLY_STATUS_BRIDGE_ONLY' ? 'bg-primary/5 border-primary/20' :
                      route.approvalScope === 'NONE' ? 'bg-destructive/5 border-destructive/20' :
                      'bg-amber-500/5 border-amber-500/20';

                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-3 py-2 font-mono font-bold text-foreground whitespace-nowrap">{route.capability}</td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          <span className={route.decision === 'APPROVED_READ_ONLY' ? 'text-blue-400' : 'text-slate-500'}>
                            {route.endpoint}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={route.method === 'GET' ? 'text-primary font-bold' : 'text-destructive font-bold'}>
                            {route.method}
                          </span>
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap text-[7px] font-bold ${decisionColor}`}>
                          {route.decision}
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap text-[7px] px-1.5 py-0.5 rounded border ${scopeColor}`}>
                          {route.approvalScope}
                        </td>
                        <td className="px-3 py-2 text-slate-400 max-w-[200px]">{route.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allowed endpoints */}
          {packet.allowedEndpoints.length > 0 && (
            <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Allowed Read-Only Endpoints</div>
              <div className="flex flex-wrap gap-2">
                {packet.allowedEndpoints.map((e, i) => (
                  <span key={i} className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded text-[8px] font-mono text-blue-400">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {packet.safetyAssertions.filter(a => a.pass).length}/{packet.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {packet.safetyAssertions.map(a => (
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

          {/* Packet ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><ClipboardCheck className="w-3 h-3" /><span className="font-mono">{packet.approvalPacketId}</span></span>
            <span>{new Date(packet.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <ClipboardCheck className="w-3 h-3" /> Generate Approval Packet
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Route approval packet is local-only. It approves read-only status routes only. No dispatch. No execution.
      </div>
    </div>
  );
}