/**
 * OpenClawUnifiedCommandContractRegistry
 * Phase 43 — Unified Command Contract Registry for Veridan Core
 * UI + localStorage + browser-only export only.
 *
 * Does NOT:
 *   - Make backend calls
 *   - Make fetch calls
 *   - Call OpenClaw / SafeBridge / MCP
 *   - Call broker / bank / bureau / payment systems
 *   - Handle credentials
 *   - Use browser automation execution
 *   - Use API mutation logic
 *   - Use timers / polling / schedulers
 */

import React, { useState } from 'react';
import { AlertCircle, Download, ShieldCheck } from 'lucide-react';

const LS_KEY = 'openclawPhase43UnifiedCommandRegistrySnapshot';

const REGISTRY = [
  // ── SAFE READ / OBSERVE ──
  {
    commandType: 'READ_STATUS',
    commandGroup: 'SAFE_READ_OBSERVE',
    currentMode: 'READ_ONLY',
    riskTier: 'LOW',
    approvalRequired: false,
    executionAllowed: false,
    reason: 'Read-only gateway status poll. No mutation.',
  },
  {
    commandType: 'READ_PAGE_TEXT',
    commandGroup: 'SAFE_READ_OBSERVE',
    currentMode: 'READ_ONLY',
    riskTier: 'LOW',
    approvalRequired: false,
    executionAllowed: false,
    reason: 'Reads visible page text only. No form submission or navigation.',
  },
  {
    commandType: 'EXTRACT_VISIBLE_TEXT',
    commandGroup: 'SAFE_READ_OBSERVE',
    currentMode: 'READ_ONLY',
    riskTier: 'LOW',
    approvalRequired: false,
    executionAllowed: false,
    reason: 'Extracts rendered text. No DOM mutation.',
  },
  {
    commandType: 'VERIFY_UI_STATE',
    commandGroup: 'SAFE_READ_OBSERVE',
    currentMode: 'READ_ONLY',
    riskTier: 'LOW',
    approvalRequired: false,
    executionAllowed: false,
    reason: 'Checks UI element presence only. No interaction.',
  },
  {
    commandType: 'CHECK_GATEWAY_HEALTH',
    commandGroup: 'SAFE_READ_OBSERVE',
    currentMode: 'READ_ONLY',
    riskTier: 'LOW',
    approvalRequired: false,
    executionAllowed: false,
    reason: 'Read-only health check against gateway. No side effects.',
  },
  {
    commandType: 'CHECK_BACKEND_ENV_PRESENCE',
    commandGroup: 'SAFE_READ_OBSERVE',
    currentMode: 'READ_ONLY',
    riskTier: 'LOW',
    approvalRequired: false,
    executionAllowed: false,
    reason: 'Boolean presence check for env secrets. Returns true/false only.',
  },

  // ── DRY-RUN PLANNING ──
  {
    commandType: 'NAVIGATE_BROWSER_DRY_RUN',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'MEDIUM',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Navigation simulated locally only. No actual browser navigation.',
  },
  {
    commandType: 'CLICK_ELEMENT_DRY_RUN',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'MEDIUM',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Click action modeled as dry-run preview. Never dispatched.',
  },
  {
    commandType: 'TYPE_TEXT_DRY_RUN',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'MEDIUM',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Text input simulated in planning only. No actual keystroke dispatch.',
  },
  {
    commandType: 'SUBMIT_FORM_DRY_RUN',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'MEDIUM',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Form submission modeled only. No real submission sent.',
  },
  {
    commandType: 'OPEN_URL_DRY_RUN',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'MEDIUM',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'URL open intent captured for planning. No live navigation.',
  },
  {
    commandType: 'CREATE_PROPOSAL',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'LOW',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Creates a local proposal record for review. No execution.',
  },
  {
    commandType: 'VALIDATE_PROPOSAL',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'LOW',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Validates proposal contract locally. No backend call.',
  },
  {
    commandType: 'SIMULATE_ACTION',
    commandGroup: 'DRY_RUN_PLANNING',
    currentMode: 'DRY_RUN_ONLY',
    riskTier: 'LOW',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Action simulated for preview only. Result is local state only.',
  },

  // ── BLOCKED EXECUTION ──
  {
    commandType: 'PLACE_LIVE_TRADE',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Live broker order placement. Permanently blocked until live execution gate approved.',
  },
  {
    commandType: 'MODIFY_LIVE_ORDER',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Modifying a live order on broker. Blocked.',
  },
  {
    commandType: 'CANCEL_LIVE_ORDER',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Canceling a live order. Blocked until execution gate approved.',
  },
  {
    commandType: 'MOVE_MONEY',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Bank or payment transfer. Permanently blocked.',
  },
  {
    commandType: 'ENTER_CREDENTIALS',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Credential entry into any system. Permanently blocked.',
  },
  {
    commandType: 'SUBMIT_CREDIT_DISPUTE',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'HIGH',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Credit bureau dispute submission. Blocked.',
  },
  {
    commandType: 'FILE_UCC_DOCUMENT',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'HIGH',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Legal document filing. Blocked.',
  },
  {
    commandType: 'SEND_CLIENT_EMAIL',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'HIGH',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'External email sending. Blocked.',
  },
  {
    commandType: 'EXECUTE_BROWSER_ACTION',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Any live browser mutation action. Blocked until approved.',
  },
  {
    commandType: 'CALL_EXTERNAL_API_MUTATION',
    commandGroup: 'BLOCKED_EXECUTION',
    currentMode: 'BLOCKED_EXECUTION',
    riskTier: 'CRITICAL',
    approvalRequired: true,
    executionAllowed: false,
    reason: 'Any external API POST/PUT/DELETE. Blocked.',
  },
];

const GROUP_LABELS = {
  SAFE_READ_OBSERVE: { label: 'Safe Read / Observe', color: 'text-primary', bg: 'bg-primary/5 border-primary/20', badge: 'border-primary/30 bg-primary/5 text-primary' },
  DRY_RUN_PLANNING:  { label: 'Dry-Run Planning',    color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', badge: 'border-amber-400/30 bg-amber-400/5 text-amber-400' },
  BLOCKED_EXECUTION: { label: 'Blocked Execution',   color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', badge: 'border-destructive/30 bg-destructive/5 text-destructive' },
};

const RISK_BADGE = {
  LOW:      'border-primary/30 bg-primary/5 text-primary',
  MEDIUM:   'border-amber-400/30 bg-amber-400/5 text-amber-400',
  HIGH:     'border-orange-500/30 bg-orange-500/5 text-orange-400',
  CRITICAL: 'border-destructive/30 bg-destructive/5 text-destructive',
};

const safeReadCount    = REGISTRY.filter(r => r.commandGroup === 'SAFE_READ_OBSERVE').length;
const dryRunCount      = REGISTRY.filter(r => r.commandGroup === 'DRY_RUN_PLANNING').length;
const blockedCount     = REGISTRY.filter(r => r.commandGroup === 'BLOCKED_EXECUTION').length;

export default function OpenClawUnifiedCommandContractRegistry() {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const snapshot = {
      snapshotType: 'VERIDAN_COMMAND_CONTRACT_REGISTRY_PHASE_43',
      generatedAt: new Date().toISOString(),
      summary: {
        totalCommands: REGISTRY.length,
        readOnlyCommands: safeReadCount,
        dryRunCommands: dryRunCount,
        blockedExecutionCommands: blockedCount,
        liveExecutionEnabled: false,
      },
      commands: REGISTRY,
      safetyClaims: [
        'No live execution enabled',
        'No broker calls',
        'No bank calls',
        'No credit bureau calls',
        'No credential handling',
        'No backend mutation required',
        'Browser-only export',
      ],
    };

    try {
      localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage quota — skip silently
    }

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-command-contract-registry-phase43-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const groups = ['SAFE_READ_OBSERVE', 'DRY_RUN_PLANNING', 'BLOCKED_EXECUTION'];

  return (
    <div className="space-y-4 font-mono">

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/30 rounded-sm">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-400 leading-relaxed">
          <span className="font-bold">Unified Command Registry</span> — This registry defines what Veridan Core may propose, validate, simulate, or block. Live execution remains disabled.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Registry Summary</div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: 'Total Commands',            value: REGISTRY.length,  color: 'text-slate-100' },
            { label: 'Read-Only Commands',         value: safeReadCount,    color: 'text-primary' },
            { label: 'Dry-Run Commands',           value: dryRunCount,      color: 'text-amber-400' },
            { label: 'Blocked Execution Commands', value: blockedCount,     color: 'text-destructive' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-3 py-2 bg-secondary/30 border border-border/30 rounded-sm">
              <div className="text-[8px] uppercase text-slate-500 mb-1">{label}</div>
              <div className={`text-[16px] font-bold ${color}`}>{value}</div>
            </div>
          ))}
          <div className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm">
            <div className="text-[8px] uppercase text-slate-500 mb-1">Live Execution Enabled</div>
            <div className="text-[16px] font-bold text-destructive">false</div>
          </div>
        </div>
      </div>

      {/* Registry Table by Group */}
      {groups.map((groupKey) => {
        const cfg = GROUP_LABELS[groupKey];
        const rows = REGISTRY.filter(r => r.commandGroup === groupKey);
        return (
          <div key={groupKey} className={`bg-card border rounded-sm overflow-hidden ${cfg.bg}`}>
            <div className={`px-4 py-2.5 border-b ${cfg.bg}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{rows.length} command{rows.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 bg-secondary/20 border-b border-border/30 text-[8px] uppercase tracking-wider text-slate-500">
              <span className="col-span-2">Command Type</span>
              <span>Mode</span>
              <span>Risk</span>
              <span>Approval Req</span>
              <span>Execution</span>
              <span className="col-span-1">Reason</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/20">
              {rows.map((row) => (
                <div key={row.commandType} className="grid grid-cols-1 md:grid-cols-7 gap-1 md:gap-2 px-4 py-2.5 text-[9px] hover:bg-secondary/10 transition-colors">
                  {/* commandType */}
                  <div className="col-span-2 font-bold text-slate-100 font-mono">{row.commandType}</div>

                  {/* mode */}
                  <div>
                    <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold uppercase ${cfg.badge}`}>
                      {row.currentMode}
                    </span>
                  </div>

                  {/* riskTier */}
                  <div>
                    <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold uppercase ${RISK_BADGE[row.riskTier]}`}>
                      {row.riskTier}
                    </span>
                  </div>

                  {/* approvalRequired */}
                  <div className={`text-[9px] font-semibold ${row.approvalRequired ? 'text-amber-400' : 'text-slate-500'}`}>
                    {row.approvalRequired ? 'YES' : 'NO'}
                  </div>

                  {/* executionAllowed */}
                  <div className="text-destructive font-bold text-[9px]">
                    false
                  </div>

                  {/* reason */}
                  <div className="text-slate-400 text-[8px] leading-relaxed col-span-1">
                    {row.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Export Button */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase"
          >
            <Download className="w-4 h-4" />
            Export Command Registry Snapshot
          </button>
        </div>
        {exported && (
          <div className="px-4 py-2 bg-primary/5 border-t border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 text-[9px] text-primary">
              <ShieldCheck className="w-3 h-3" />
              Snapshot exported and saved to localStorage key: <span className="font-mono font-bold">{LS_KEY}</span>
            </div>
          </div>
        )}
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] text-muted-foreground/60 text-center italic">
          Browser-local JSON export only · No backend writes · No API calls · No execution
        </div>
      </div>

      {/* Safety Footer */}
      <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-sm text-[8px] text-primary/70">
        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Phase 43 — UI-only registry. executionAllowed is false for all {REGISTRY.length} commands. Live execution remains disabled.
        </span>
      </div>
    </div>
  );
}