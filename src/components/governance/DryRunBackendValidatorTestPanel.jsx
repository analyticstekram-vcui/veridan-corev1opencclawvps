/**
 * DryRunBackendValidatorTestPanel
 * Tests the dry-run validator in isolation.
 * UI-only staging component with no API wiring.
 *
 * Does NOT:
 *   - Call fetch or axios
 *   - Make API calls
 *   - Call backends
 *   - Write to database
 *   - Execute any commands
 *   - Persist requests
 *   - Make outbound network calls
 *   - Use OpenClaw, SafeBridge, MCP, browsers, brokers, banks, bureaus, payments, credentials, uploads, parsers, AI indexing, or persistence systems
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DryRunBackendValidatorTestPanel() {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h2 className="text-[11px] font-mono font-bold uppercase text-slate-100">I. Dry-Run Backend Validator Test Panel</h2>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/5 border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Test Panel Only</div>
            <p className="text-[9px] text-amber-600/90">
              This panel tests the dry-run validator only. It does not execute commands, persist requests, or make outbound calls.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Endpoint Reference */}
        <div className="px-3 py-2.5 bg-secondary/30 border border-border/40 rounded-sm">
          <div className="text-[9px] font-mono font-semibold text-slate-300 mb-1">Intended Endpoint</div>
          <div className="text-[10px] font-mono text-blue-400">POST /api/dry-run/bridge/preview</div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            className="px-4 py-2.5 bg-secondary/30 border border-border/40 text-slate-400 rounded-sm font-semibold text-[10px] font-mono uppercase cursor-not-allowed opacity-50"
          >
            Test Valid Dry-Run Request
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-2.5 bg-secondary/30 border border-border/40 text-slate-400 rounded-sm font-semibold text-[10px] font-mono uppercase cursor-not-allowed opacity-50"
          >
            Test Rejected Dry-Run Request
          </button>
        </div>

        {/* Staging Note */}
        <div className="px-3 py-2.5 bg-slate-500/5 border border-slate-500/20 rounded-sm">
          <div className="text-[9px] font-mono font-semibold text-slate-400 mb-1 uppercase">Staging Status</div>
          <p className="text-[10px] text-slate-400">
            Endpoint wiring is not active yet. This component is staged for review before API connection.
          </p>
        </div>
      </div>
    </div>
  );
}