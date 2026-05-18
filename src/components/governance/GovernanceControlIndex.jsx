/**
 * GovernanceControlIndex
 * Landing index for governance, audit, evidence, and baseline pages.
 * UI-only navigation and index cards.
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

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Archive, BarChart3, Map, Cpu, Lock, Eye, Workflow } from 'lucide-react';

const GOVERNANCE_PAGES = [
  {
    id: 'governance_queue',
    name: 'Governance Queue',
    purpose: 'Review and approve/deny proposed actions.',
    mode: 'Governed',
    modeColor: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    icon: CheckCircle2,
    path: '/openclaw-control?section=governance-queue',
    note: 'OpenClaw Control → Approval Workflow tab (auto-selected)',
  },
  {
    id: 'audit_evidence',
    name: 'Audit / Evidence',
    purpose: 'Review audit records, evidence records, and proof exports.',
    mode: 'Read-Only',
    modeColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    icon: FileText,
    path: '/audit-evidence',
    note: 'Full audit and evidence dashboard',
  },
  {
    id: 'baselines',
    name: 'Baselines',
    purpose: 'Review approved baseline records and export local baseline manifests.',
    mode: 'UI-Only',
    modeColor: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    icon: Archive,
    path: '/baseline-evidence',
    note: 'Baseline consolidation and export',
  },
  {
    id: 'system_verify',
    name: 'System Verify',
    purpose: 'Check local readiness, lock state, and consistency before future execution phases.',
    mode: 'Preview',
    modeColor: 'text-slate-300 border-slate-300/30 bg-slate-300/5',
    icon: BarChart3,
    path: '/openclaw-control?section=system-verify',
    note: 'OpenClaw Control → System Verify tab (auto-selected)',
  },
  {
    id: 'dry_run_bridge',
    name: 'Dry-Run Bridge',
    purpose: 'Plan simulated bridge request rules before any execution layer is enabled.',
    mode: 'Planning',
    modeColor: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    icon: Workflow,
    path: '/dry-run-bridge-planning',
    note: 'Dry-run bridge planning and validation gates',
  },
  {
    id: 'backend_contract',
    name: 'Backend Contract',
    purpose: 'Define the future dry-run backend endpoint contract before implementation.',
    mode: 'Planning',
    modeColor: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    icon: FileText,
    path: '/dry-run-backend-contract',
    note: 'Backend contract planning and request/response shapes',
  },
  {
    id: 'system_map',
    name: 'System Map',
    purpose: 'Understand how Veridan Core modules connect.',
    mode: 'UI-Only',
    modeColor: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    icon: Map,
    path: '/system-map',
    note: 'Module architecture and readiness',
  },
  {
    id: 'openclaw_monitoring',
    name: 'OpenClaw Monitoring',
    purpose: 'Read-only gateway status and evidence checks only.',
    mode: 'Read-Only',
    modeColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    icon: Eye,
    path: '/openclaw-control?section=monitoring',
    note: 'OpenClaw Control → OpenClaw Health tab (auto-selected)',
  },
];

export default function GovernanceControlIndex() {
  return (
    <div className="border-b border-border bg-card px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-[14px] font-mono font-bold uppercase text-slate-100 tracking-wide">Governance Control Index</h2>
        </div>

        {/* Description */}
        <p className="text-[10px] font-mono text-muted-foreground/70 mb-4">
          Navigate to governance, audit, evidence, baseline, and system verification pages. All sections are UI-only with no backend execution or API calls.
        </p>

        {/* Index Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {GOVERNANCE_PAGES.map(({ id, name, purpose, mode, modeColor, icon: Icon, path, note }) => (
            <Link
              key={id}
              to={path}
              className="flex flex-col gap-3 px-4 py-3 bg-secondary/30 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors rounded-sm group"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <h3 className="text-[11px] font-mono font-bold text-slate-100 group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                </div>
                <span className={`px-2 py-1 text-[7px] font-mono font-bold uppercase rounded-sm border shrink-0 ${modeColor}`}>
                  {mode}
                </span>
              </div>

              {/* Purpose */}
              <p className="text-[9px] text-slate-300 leading-relaxed">{purpose}</p>

              {/* Note */}
              <div className="text-[8px] font-mono text-muted-foreground/60 italic pt-1 border-t border-border/20">
                {note}
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Safety Note */}
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/70">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>
            UI-only governance index · No backend calls · No API integration · No database writes · All pages are read-only, preview, or governed modes
          </span>
        </div>
      </div>
    </div>
  );
}