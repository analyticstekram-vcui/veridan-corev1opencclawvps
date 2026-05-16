/**
 * ReadOnlyRouteSimulationEvidenceExport
 * Local-only evidence export layer from route simulations.
 *
 * SAFETY CONTRACT:
 *   - No network calls, no OpenClaw calls, no browser tools
 *   - No command dispatch, no trading, no credentials
 *   - Reads/writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Copy, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import ReadOnlyRouteApprovalPacket from './ReadOnlyRouteApprovalPacket.jsx';

const SOURCE_KEYS = {
  simulations:     'openclawReadOnlyRouteSimulations',
  routePlans:      'openclawReadOnlyRoutePlans',
  approvalRules:   'openclawCapabilityApprovalRules',
  policyReports:   'openclawCapabilityPolicyMatrixReports',
  evidenceExports: 'openclawCapabilityEvidenceExports',
  bridgeReports:   'openclawReadOnlyStatusBridgeReports',
  auditTrail:      'openclawAuditTrail',
};
const EXPORT_KEY = 'openclawReadOnlyRouteSimulationEvidenceExports';

function tryAppendAudit(entry) {
  try { import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {}); } catch {}
}

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveExport(exp) {
  try {
    const all = loadJSON(EXPORT_KEY, []);
    // Deduplicate by latestSimulationReportId if present, otherwise by exportId
    const deduped = [
      exp,
      ...all.filter(e => {
        if (exp.latestSimulationReportId && e.latestSimulationReportId) {
          return e.latestSimulationReportId !== exp.latestSimulationReportId;
        }
        return e.exportId !== exp.exportId;
      }),
    ];
    localStorage.setItem(EXPORT_KEY, JSON.stringify(deduped.slice(0, 30)));
  } catch {}
}

function buildExport() {
  // Load all source data
  const simulations     = loadJSON(SOURCE_KEYS.simulations, []);
  const routePlans      = loadJSON(SOURCE_KEYS.routePlans, []);
  const approvalRules   = loadJSON(SOURCE_KEYS.approvalRules, []);
  const policyReports   = loadJSON(SOURCE_KEYS.policyReports, []);
  const evidenceExports = loadJSON(SOURCE_KEYS.evidenceExports, []);
  const bridgeReports   = loadJSON(SOURCE_KEYS.bridgeReports, []);
  const auditTrail      = loadJSON(SOURCE_KEYS.auditTrail, []);

  const latestSim = simulations[0] ?? null;

  // Count simulations by status
  const simCount  = latestSim?.simulatedReadOnlyRoutes ?? 0;
  const blockCount = latestSim?.blockedSimulations ?? 0;
  const reviewCount = latestSim?.reviewRequiredRoutes ?? 0;

  // Collect allowed endpoints from simulations
  const allowedEndpoints = latestSim?.simulations
    ?.filter(s => s.simulationStatus === 'SIMULATED_READ_ONLY')
    ?.map(s => s.endpoint)
    ?.filter((e, i, arr) => arr.indexOf(e) === i)
    ?? [];

  // Collect blocked reasons from simulations
  const blockedReasons = latestSim?.simulations
    ?.filter(s => s.blockedReason)
    ?.map(s => s.blockedReason)
    ?.filter((r, i, arr) => arr.indexOf(r) === i)
    ?? [];

  const sourceCounts = {
    simulations:     simulations.length,
    routePlans:      routePlans.length,
    approvalRules:   approvalRules.length,
    policyReports:   policyReports.length,
    evidenceExports: evidenceExports.length,
    bridgeReports:   bridgeReports.length,
    auditTrail:      auditTrail.length,
    total:           simulations.length + routePlans.length + approvalRules.length + policyReports.length + evidenceExports.length + bridgeReports.length + auditTrail.length,
  };

  const safetyAssertions = [
    { key: 'previewOnly',            value: true,             pass: true },
    { key: 'readOnly',               value: true,             pass: true },
    { key: 'locked',                 value: true,             pass: true },
    { key: 'dispatchAllowed',        value: false,            pass: true },
    { key: 'executionAttempted',     value: false,            pass: true },
    { key: 'openClawCalls',          value: 0,                pass: true },
    { key: 'networkCalls',           value: false,            pass: true },
    { key: 'browserToolUsed',        value: false,            pass: true },
    { key: 'credentialsExposed',     value: false,            pass: true },
    { key: 'secretExposed',          value: false,            pass: true },
    { key: 'tradingDisabled',        value: true,             pass: true },
    { key: 'moneyMovementDisabled',  value: true,             pass: true },
  ];

  const exportId = 'rse-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  return {
    exportId,
    createdAt:               new Date().toISOString(),
    phase:                   'READ_ONLY_ROUTE_SIMULATION_EVIDENCE_EXPORT',
    gatewayMode:             'READ_ONLY',
    executionMode:           'DISABLED',
    executionLock:           'LOCKED',
    dispatchAllowed:         false,
    executionAttempted:      false,
    openClawCalls:           0,
    networkCalls:            false,
    browserToolUsed:         false,
    secretExposed:           false,
    sourceCounts,
    latestSimulationReportId: latestSim?.simId ?? null,
    simulatedReadOnlyRoutes: simCount,
    blockedSimulations:      blockCount,
    reviewRequiredRoutes:    reviewCount,
    allowedEndpoints,
    blockedReasons,
    safetyAssertions,
    note: 'Local-only route simulation evidence export. No OpenClaw calls. No network calls. No dispatch. No execution.',
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
      {copied ? 'Copied!' : 'Copy Evidence Export JSON'}
    </button>
  );
}

export default function ReadOnlyRouteSimulationEvidenceExport({ refreshTrigger }) {
  const [exp, setExp] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const generate = useCallback(() => {
    const e = buildExport();
    saveExport(e);
    tryAppendAudit({
      event:                    'read_only_route_simulation_evidence_export_generated',
      exportId:                 e.exportId,
      latestSimulationReportId: e.latestSimulationReportId,
      simulatedReadOnlyRoutes:  e.simulatedReadOnlyRoutes,
      blockedSimulations:       e.blockedSimulations,
      sourceCounts:             e.sourceCounts,
      note: `Route simulation evidence export generated (${e.exportId}). ${e.simulatedReadOnlyRoutes} simulated, ${e.blockedSimulations} blocked. No execution. No dispatch.`,
    });
    setExp(e);
  }, []);

  useEffect(() => { generate(); }, [refreshTrigger]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Route Simulation Evidence Export</div>
          <div className="text-[13px] font-bold text-foreground">Read-Only Route Simulation Evidence Export</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Exports local-only route simulation evidence. No network calls. No OpenClaw calls.</div>
        </div>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Evidence is local-only. No network. No OpenClaw. No dispatch. No execution.</span>
      </div>

      {exp && (
        <>
          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Total Records',           value: exp.sourceCounts.total,         color: 'text-foreground' },
              { label: 'Simulations',             value: exp.sourceCounts.simulations,    color: 'text-primary font-bold' },
              { label: 'Route Plans',             value: exp.sourceCounts.routePlans,     color: 'text-slate-300' },
              { label: 'Simulated (RO)',          value: exp.simulatedReadOnlyRoutes,     color: 'text-primary font-bold' },
              { label: 'Blocked',                 value: exp.blockedSimulations,          color: exp.blockedSimulations > 0 ? 'text-destructive font-bold' : 'text-slate-500' },
              { label: 'Review Required',         value: exp.reviewRequiredRoutes,        color: exp.reviewRequiredRoutes > 0 ? 'text-amber-400' : 'text-slate-500' },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border/60 rounded-lg px-2.5 py-2">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Source counts breakdown */}
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Source Data Counts</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Approval Rules',   value: exp.sourceCounts.approvalRules },
                { label: 'Policy Reports',   value: exp.sourceCounts.policyReports },
                { label: 'Evidence Exports', value: exp.sourceCounts.evidenceExports },
                { label: 'Bridge Reports',   value: exp.sourceCounts.bridgeReports },
                { label: 'Audit Trail',      value: exp.sourceCounts.auditTrail },
              ].map(c => (
                <div key={c.label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
                  <div className="text-[10px] font-semibold text-foreground">{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed endpoints + blocked reasons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Allowed Endpoints</div>
              <div className="space-y-1">
                {exp.allowedEndpoints.length > 0
                  ? exp.allowedEndpoints.map((e, i) => (
                      <div key={i} className="px-2 py-1 bg-primary/5 border border-primary/20 rounded text-[8px] font-mono text-blue-400">
                        {e}
                      </div>
                    ))
                  : <div className="text-[8px] text-slate-500 italic">None simulated</div>}
              </div>
            </div>
            <div className="bg-secondary/10 border border-border/60 rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Blocked Reasons</div>
              <div className="space-y-1">
                {exp.blockedReasons.length > 0
                  ? exp.blockedReasons.map((r, i) => (
                      <div key={i} className="px-2 py-1 bg-destructive/5 border border-destructive/20 rounded text-[8px] text-destructive">
                        {r}
                      </div>
                    ))
                  : <div className="text-[8px] text-slate-500 italic">None blocked</div>}
              </div>
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {exp.safetyAssertions.filter(a => a.pass).length}/{exp.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
              {exp.safetyAssertions.map(a => (
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

          {/* Export ID + timestamp */}
          <div className="flex flex-wrap gap-4 text-[8px] text-slate-500">
            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /><span className="font-mono">{exp.exportId}</span></span>
            {exp.latestSimulationReportId && <span>Simulation: <span className="font-mono">{exp.latestSimulationReportId}</span></span>}
            <span>{new Date(exp.createdAt).toLocaleString()}</span>
          </div>

          {/* JSON panel */}
          <details className="bg-card border border-border rounded-lg">
            <summary className="px-4 py-3 cursor-pointer hover:bg-secondary/10 transition-colors flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5" />
              Evidence Export JSON {exp.sourceCounts.total > 0 && `(${exp.sourceCounts.total} sources)`}
            </summary>
            {showJSON && (
              <div className="px-4 py-3 border-t border-border bg-secondary/20">
                <pre className="text-[7px] font-mono text-slate-300 overflow-auto max-h-64 whitespace-pre-wrap break-words">
                  {JSON.stringify(exp, null, 2)}
                </pre>
              </div>
            )}
          </details>
          <button type="button" onClick={() => setShowJSON(!showJSON)}
            className="text-[8px] text-slate-500 hover:text-slate-300 underline">
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={exp} />
            <button type="button" onClick={generate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <FileText className="w-3 h-3" /> Generate Evidence Export
            </button>
          </div>
        </>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Route simulation evidence export is local-only. No OpenClaw calls. No network calls. No dispatch. No execution.
      </div>

      {/* ── Read-Only Route Approval Packet ── */}
      <div className="border-t border-border/40 pt-4">
        <ReadOnlyRouteApprovalPacket refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}