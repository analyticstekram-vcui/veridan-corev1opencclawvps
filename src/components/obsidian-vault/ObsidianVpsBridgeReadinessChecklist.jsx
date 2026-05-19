/**
 * ObsidianVpsBridgeReadinessChecklist
 * VPS Bridge Readiness Checklist — 15 items grouped by category.
 * All items default to NOT_READY or REVIEW_REQUIRED.
 * Dry-run governance only. No execution, dispatch, filesystem writes, live mode.
 */

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const CHECKLIST_GROUPS = [
  {
    name: 'VPS Environment',
    description: 'VPS infrastructure and vault accessibility',
    items: [
      { id: 'vps-vault-root', name: 'Confirm vault root path exists on VPS', category: 'VPS Environment', defaultStatus: 'NOT_READY' },
      { id: 'vps-folder-map', name: 'Confirm allowed folder map exists', category: 'VPS Environment', defaultStatus: 'REVIEW_REQUIRED' },
    ],
  },
  {
    name: 'Bridge Service',
    description: 'Service deployment and network configuration',
    items: [
      { id: 'bridge-installed', name: 'Confirm bridge service is installed', category: 'Bridge Service', defaultStatus: 'NOT_READY' },
      { id: 'bridge-localhost', name: 'Confirm bridge service runs on localhost only', category: 'Bridge Service', defaultStatus: 'REVIEW_REQUIRED' },
    ],
  },
  {
    name: 'Security Controls',
    description: 'Access control and authentication',
    items: [
      { id: 'sec-access', name: 'Confirm Cloudflare Access or service token protection exists', category: 'Security Controls', defaultStatus: 'REVIEW_REQUIRED' },
      { id: 'sec-write-disabled', name: 'Confirm write endpoint is disabled by default', category: 'Security Controls', defaultStatus: 'NOT_READY' },
    ],
  },
  {
    name: 'Write Safety',
    description: 'File creation validation and constraints',
    items: [
      { id: 'safe-dryrun-first', name: 'Confirm dry-run endpoint works first', category: 'Write Safety', defaultStatus: 'REVIEW_REQUIRED' },
      { id: 'safe-markdown-only', name: 'Confirm markdown-only file extension enforcement', category: 'Write Safety', defaultStatus: 'NOT_READY' },
      { id: 'safe-path-traversal', name: 'Confirm path traversal blocking', category: 'Write Safety', defaultStatus: 'NOT_READY' },
      { id: 'safe-operator-approval', name: 'Confirm operator approval required', category: 'Write Safety', defaultStatus: 'REVIEW_REQUIRED' },
    ],
  },
  {
    name: 'Audit / Rollback',
    description: 'Audit logging and recovery capabilities',
    items: [
      { id: 'audit-log-created', name: 'Confirm audit log created before write', category: 'Audit / Rollback', defaultStatus: 'NOT_READY' },
      { id: 'audit-rollback-hash', name: 'Confirm rollback file/hash is generated', category: 'Audit / Rollback', defaultStatus: 'REVIEW_REQUIRED' },
      { id: 'audit-no-secrets', name: 'Confirm no secrets are accepted in content', category: 'Audit / Rollback', defaultStatus: 'NOT_READY' },
      { id: 'audit-no-shell', name: 'Confirm no shell execution exists', category: 'Audit / Rollback', defaultStatus: 'NOT_READY' },
      { id: 'audit-kill-switch', name: 'Confirm kill switch exists', category: 'Audit / Rollback', defaultStatus: 'REVIEW_REQUIRED' },
    ],
  },
];

const STATUS_CONFIG = {
  NOT_READY: {
    color: 'text-destructive',
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    icon: X,
    label: 'NOT_READY',
    description: 'Item is not yet ready for production',
  },
  REVIEW_REQUIRED: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    icon: AlertCircle,
    label: 'REVIEW_REQUIRED',
    description: 'Item requires operator review and verification',
  },
  READY: {
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    icon: CheckCircle2,
    label: 'READY',
    description: 'Item is ready for production',
  },
};

export default function ObsidianVpsBridgeReadinessChecklist() {
  // Initialize state from all items
  const allItems = CHECKLIST_GROUPS.flatMap(g => g.items);
  const [statuses, setStatuses] = useState(
    Object.fromEntries(allItems.map(item => [item.id, item.defaultStatus]))
  );

  const toggleStatus = (itemId) => {
    const currentStatus = statuses[itemId];
    const statusCycle = ['NOT_READY', 'REVIEW_REQUIRED', 'READY'];
    const nextIdx = (statusCycle.indexOf(currentStatus) + 1) % statusCycle.length;
    setStatuses(prev => ({
      ...prev,
      [itemId]: statusCycle[nextIdx],
    }));
  };

  const readyCount = Object.values(statuses).filter(s => s === 'READY').length;
  const reviewCount = Object.values(statuses).filter(s => s === 'REVIEW_REQUIRED').length;
  const notReadyCount = Object.values(statuses).filter(s => s === 'NOT_READY').length;
  const totalCount = allItems.length;

  const readinessPercent = Math.round((readyCount / totalCount) * 100);
  const overallStatus = readyCount === totalCount ? 'FULLY_READY' : readyCount >= 10 ? 'MOSTLY_READY' : 'NEEDS_WORK';

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[9px] font-bold uppercase text-slate-300 tracking-widest">VPS Bridge Readiness Checklist</div>
          <div className="text-[8px] text-slate-600 mt-0.5">
            15 items across 5 categories · Governance review only · No execution · No dispatch
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[18px] font-bold text-primary">{readinessPercent}%</div>
          <div className="text-[8px] text-slate-500">{readyCount}/{totalCount} ready</div>
        </div>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`border rounded-sm px-3 py-2 text-center ${STATUS_CONFIG.READY.bg} ${STATUS_CONFIG.READY.border}`}>
          <div className={`text-[14px] font-bold ${STATUS_CONFIG.READY.color}`}>{readyCount}</div>
          <div className={`text-[7px] font-bold uppercase ${STATUS_CONFIG.READY.color}`}>Ready</div>
        </div>
        <div className={`border rounded-sm px-3 py-2 text-center ${STATUS_CONFIG.REVIEW_REQUIRED.bg} ${STATUS_CONFIG.REVIEW_REQUIRED.border}`}>
          <div className={`text-[14px] font-bold ${STATUS_CONFIG.REVIEW_REQUIRED.color}`}>{reviewCount}</div>
          <div className={`text-[7px] font-bold uppercase ${STATUS_CONFIG.REVIEW_REQUIRED.color}`}>Review</div>
        </div>
        <div className={`border rounded-sm px-3 py-2 text-center ${STATUS_CONFIG.NOT_READY.bg} ${STATUS_CONFIG.NOT_READY.border}`}>
          <div className={`text-[14px] font-bold ${STATUS_CONFIG.NOT_READY.color}`}>{notReadyCount}</div>
          <div className={`text-[7px] font-bold uppercase ${STATUS_CONFIG.NOT_READY.color}`}>Not Ready</div>
        </div>
      </div>

      {/* Overall readiness */}
      <div className={`border rounded-sm px-4 py-3 ${
        overallStatus === 'FULLY_READY' ? 'bg-primary/5 border-primary/20' :
        overallStatus === 'MOSTLY_READY' ? 'bg-amber-500/5 border-amber-500/20' :
        'bg-destructive/5 border-destructive/20'
      }`}>
        <div className={`text-[9px] font-bold uppercase ${
          overallStatus === 'FULLY_READY' ? 'text-primary' :
          overallStatus === 'MOSTLY_READY' ? 'text-amber-400' :
          'text-destructive'
        }`}>
          Overall Status: {overallStatus}
        </div>
        <div className="text-[8px] text-slate-400 mt-1">
          {overallStatus === 'FULLY_READY'
            ? 'All items verified ready. VPS bridge service is ready for controlled testing.'
            : overallStatus === 'MOSTLY_READY'
            ? 'Most items are ready. Complete review items before enabling bridge service.'
            : 'Multiple items require work. Bridge service is not ready for deployment.'}
        </div>
      </div>

      {/* Checklist groups */}
      <div className="space-y-4">
        {CHECKLIST_GROUPS.map(group => (
          <div key={group.name} className="bg-card border border-border/40 rounded-sm overflow-hidden">

            {/* Group header */}
            <div className="bg-secondary/30 border-b border-border/40 px-4 py-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-100 tracking-widest">{group.name}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{group.description}</div>
            </div>

            {/* Group items */}
            <div className="divide-y divide-border/20">
              {group.items.map(item => {
                const status = statuses[item.id];
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleStatus(item.id)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/20 transition-colors text-left ${config.bg}`}
                  >
                    {/* Status icon */}
                    <div className="pt-0.5 shrink-0">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-semibold text-slate-200">{item.name}</div>
                      <div className={`text-[8px] font-mono mt-0.5 ${config.color}`}>{config.label}</div>
                    </div>

                    {/* Status badge */}
                    <div className={`px-2 py-1 border rounded-sm text-[7px] font-bold uppercase shrink-0 ${config.bg} ${config.border} ${config.color}`}>
                      {config.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Safety constraints footer */}
      <div className="bg-card border border-border/30 rounded-sm px-4 py-3 text-[8px] font-mono text-slate-500 leading-relaxed">
        <span className="text-destructive font-bold">Hard Constraints: </span>
        No execution enabled · No dispatch enabled · No filesystem writes · No Obsidian sync ·
        No browser automation · No credential handling · No live mode.
        This checklist is for governance review only. Actual bridge service deployment requires separate governance approval.
      </div>

      {/* Interaction hint */}
      <div className="text-[8px] text-slate-600 font-mono text-center">
        Click any item to cycle through: NOT_READY → REVIEW_REQUIRED → READY
      </div>
    </div>
  );
}