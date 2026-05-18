/**
 * BaselineEvidenceConsolidation
 * UI-only display of approved governance baselines.
 * Local-only export via browser download (no backend, no API, no database writes).
 *
 * Does NOT:
 *   - Make backend calls
 *   - Call APIs
 *   - Write to database
 *   - Execute OpenClaw commands
 *   - Use SafeBridge
 *   - Use MCP execution
 *   - Use browser automation
 *   - Access TradingView, broker, bank, credit bureau, payment, credential systems
 *   - Parse or upload files
 *   - Use AI indexing
 */

import React, { useState } from 'react';
import { Download, FileJson, CheckCircle2, Shield, Calendar } from 'lucide-react';

// Baseline data (UI-only, no runtime fetches)
const APPROVED_BASELINES = [
  {
    id: 'NAV_DASHBOARD_CONSISTENCY_BASELINE',
    name: 'Navigation Dashboard Consistency Baseline',
    status: 'APPROVED',
    timestamp: '2026-05-18T00:00:00Z',
    readiness: 'GOVERNANCE_PREVIEW_MODE',
    category: 'Structural Safety',
    safety: 'All dashboard modules verified for read-only safety, no execution logic, no prohibited integrations.',
    modules: ['System Map', 'Trading Operations', 'Credit Public', 'Business Operations', 'Control Room', 'OpenClaw Governance'],
    filePath: 'docs/baselines/NAV_DASHBOARD_CONSISTENCY_BASELINE.json',
  },
  {
    id: 'READ_ONLY_MONITORING_HARDENING_BASELINE',
    name: 'Read-Only Monitoring Hardening Baseline',
    status: 'APPROVED',
    timestamp: '2026-05-18T00:00:00Z',
    readiness: 'READY_FOR_READ_ONLY_STATUS_MONITORING',
    category: 'Monitoring Safety',
    safety: 'OpenClaw monitoring restricted to read-only status checks. Manual button-triggered only. No secrets displayed.',
    modules: ['OpenClaw Status', 'Gateway Health Checks', 'Control Room Gateway Tab'],
    filePath: 'docs/baselines/READ_ONLY_MONITORING_HARDENING_BASELINE.json',
  },
  {
    id: 'SYSTEM_MAP_BASELINE',
    name: 'System Map Baseline',
    status: 'APPROVED',
    timestamp: '2026-05-18T00:00:00Z',
    readiness: 'READY',
    category: 'Architecture Visibility',
    safety: 'System map shows module modes, readiness gates, and operator action plans. Planning-only interface.',
    modules: ['Control Room', 'Trading Operations', 'Credit Public', 'Business Operations', 'Knowledge Vault', 'OpenClaw Governance', 'Audit/Evidence'],
    filePath: 'components/ui/veridan-core-system-map',
  },
  {
    id: 'MODULE_READINESS_BASELINE',
    name: 'Module Readiness Baseline',
    status: 'APPROVED',
    timestamp: '2026-05-18T00:00:00Z',
    readiness: 'READY',
    category: 'Readiness Tracking',
    safety: 'Readiness matrices and gates for all modules. Governs progression to next execution phases.',
    modules: ['All Dashboard Modules', 'Readiness Matrix', 'Gate Progression'],
    filePath: 'components/ui/veridan-core-system-map',
  },
  {
    id: 'GATEWAY_HEALTH_READONLY_BASELINE',
    name: 'Gateway Health Read-Only Baseline',
    status: 'APPROVED',
    timestamp: '2026-05-18T00:00:00Z',
    readiness: 'READY_FOR_MONITORING',
    category: 'Gateway Diagnostics',
    safety: 'Gateway health checks via openclawHealthCheck and openclawStatusVersionCapabilities. Manual trigger only. No execution.',
    modules: ['OpenClaw Gateway Health Panel', 'Control Room Gateway Tab'],
    filePath: 'components/terminal/OpenClawGatewayHealthPanel',
  },
];

export default function BaselineEvidenceConsolidation() {
  const [expandedId, setExpandedId] = useState(null);

  const handleExport = (baseline) => {
    const exportData = {
      exportType: 'BASELINE_EVIDENCE_SNAPSHOT',
      baseline: baseline.id,
      name: baseline.name,
      status: baseline.status,
      timestamp: baseline.timestamp,
      readiness: baseline.readiness,
      category: baseline.category,
      safety: baseline.safety,
      modules: baseline.modules,
      generatedAt: new Date().toISOString(),
      note: 'Local browser-only export. No backend or database writes.',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseline.id}-evidence-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryColors = {
    'Structural Safety': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    'Monitoring Safety': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    'Architecture Visibility': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    'Readiness Tracking': 'text-primary border-primary/30 bg-primary/5',
    'Gateway Diagnostics': 'text-slate-300 border-slate-300/30 bg-slate-300/5',
  };

  const categoryClass = (category) => categoryColors[category] || categoryColors['Structural Safety'];

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-mono font-bold text-slate-100">Evidence & Baseline Export Consolidation</h1>
          <p className="text-[13px] font-mono text-slate-300">
            Approved governance baselines with local-only export functionality. No backend calls, API, or database writes.
          </p>
        </div>

        {/* Safety Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[10px] font-mono text-primary/80 space-y-1">
            <div className="font-bold">UI-Only Evidence Consolidation</div>
            <div>Local browser-only exports via download button. No backend calls, API integration, database writes, or execution logic.</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card border border-border/50 rounded-sm p-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Total Baselines</div>
            <div className="text-2xl font-mono font-bold text-primary">{APPROVED_BASELINES.length}</div>
          </div>
          <div className="bg-card border border-border/50 rounded-sm p-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Approval Status</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">All Approved</div>
          </div>
          <div className="bg-card border border-border/50 rounded-sm p-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Export Format</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">JSON Snapshot</div>
          </div>
        </div>

        {/* Baselines List */}
        <div className="space-y-3">
          {APPROVED_BASELINES.map((baseline) => {
            const isExpanded = expandedId === baseline.id;
            return (
              <div
                key={baseline.id}
                className="bg-card border border-border/50 rounded-sm overflow-hidden transition-colors hover:border-border/80"
              >
                {/* Header / Title Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : baseline.id)}
                  className="w-full px-4 py-3 flex items-start justify-between gap-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-[12px] font-mono font-bold text-slate-100">{baseline.name}</h3>
                    </div>
                    <div className="text-[9px] text-muted-foreground/70 font-mono">{baseline.id}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-1 text-[8px] font-mono font-bold uppercase rounded border ${categoryClass(baseline.category)}`}>
                      {baseline.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-primary">{baseline.status}</span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    <div className="border-t border-border/30 px-4 py-3 space-y-3">
                      {/* Metadata Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Timestamp</div>
                          <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground/40" />
                            {new Date(baseline.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Readiness</div>
                          <div className="text-[10px] font-mono text-primary font-bold">{baseline.readiness}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Source Location</div>
                          <div className="text-[10px] font-mono text-slate-400">{baseline.filePath}</div>
                        </div>
                      </div>

                      {/* Safety Summary */}
                      <div>
                        <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1.5">Safety Summary</div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">{baseline.safety}</p>
                      </div>

                      {/* Modules */}
                      <div>
                        <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1.5">Verified Modules</div>
                        <div className="flex flex-wrap gap-1.5">
                          {baseline.modules.map((mod) => (
                            <span
                              key={mod}
                              className="px-2 py-1 text-[9px] font-mono bg-secondary/50 border border-border/40 text-slate-300 rounded-sm"
                            >
                              {mod}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Export Button */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleExport(baseline)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-sm"
                        >
                          <Download className="w-3 h-3" />
                          Export Snapshot
                        </button>
                        <span className="text-[8px] font-mono text-muted-foreground/50">Local JSON download</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Export Manifest */}
        <div className="bg-card border border-border/50 rounded-sm p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FileJson className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">Export Manifest</h2>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
            All baselines are exported locally via browser download. Each export includes baseline metadata, readiness state, safety summary, and verified modules. No backend calls, API integration, or database writes occur during export.
          </p>
          <button
            type="button"
            onClick={() => {
              const manifest = {
                exportType: 'BASELINE_EVIDENCE_MANIFEST',
                timestamp: new Date().toISOString(),
                totalBaselines: APPROVED_BASELINES.length,
                baselines: APPROVED_BASELINES.map((b) => ({
                  id: b.id,
                  name: b.name,
                  status: b.status,
                  readiness: b.readiness,
                  category: b.category,
                  timestamp: b.timestamp,
                })),
                note: 'Consolidated baseline manifest for governance audit. Local browser-only export. No backend integration.',
              };
              const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `baseline-evidence-manifest-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-sm"
          >
            <Download className="w-3 h-3" />
            Export Full Manifest
          </button>
        </div>

        {/* Safety Footer */}
        <div className="text-[9px] font-mono text-muted-foreground/50 text-center uppercase tracking-wider">
          UI-only consolidation · No backend calls · No API integration · No database writes · Local export only
        </div>
      </div>
    </div>
  );
}