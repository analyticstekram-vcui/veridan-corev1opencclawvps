/**
 * TvMcpRelayPathPreview
 * Phase 2: Shows exactly how Veridan Core will call the local TradingView MCP CLI.
 * Simulation/placeholder mode only. No real subprocess. No credentials.
 */
import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { RELAY_PATH, BRIDGE_CONTRACT, RESULT_NORMALIZATION_SCHEMA } from './tvMcpContracts';

const STEPS = Object.values(RELAY_PATH);

export default function TvMcpRelayPathPreview() {
  return (
    <div className="space-y-4">

      {/* Relay Path Card */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[9px] font-bold uppercase text-slate-300">Relay Path Preview</span>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[7px] font-bold rounded-sm">
              SIMULATION_ONLY
            </span>
            <span className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive text-[7px] font-bold rounded-sm">
              NOT_CONNECTED_TO_LIVE_BACKEND
            </span>
          </div>
        </div>

        {/* Relay metadata grid */}
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 border-b border-border/20">
          {[
            { label: 'Backend Endpoint',   value: BRIDGE_CONTRACT.backendEndpoint },
            { label: 'Local Command',       value: BRIDGE_CONTRACT.cliFormat },
            { label: 'Working Directory',   value: BRIDGE_CONTRACT.localPath },
            { label: 'Execution Mode',      value: BRIDGE_CONTRACT.executionMode },
            { label: 'Relay Status',        value: BRIDGE_CONTRACT.relayStatus, danger: true },
            { label: 'Phase',               value: BRIDGE_CONTRACT.phase },
          ].map(({ label, value, danger }) => (
            <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <div className="text-[7px] uppercase text-slate-500 mb-0.5 font-bold">{label}</div>
              <div className={`text-[8px] font-mono font-bold break-all ${danger ? 'text-destructive' : 'text-slate-300'}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Step-by-step flow */}
        <div className="p-3">
          <div className="text-[7px] uppercase text-slate-500 mb-2 font-bold">Step-by-step relay flow</div>
          <div className="flex flex-col gap-1">
            {STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-stretch gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-sm bg-primary/20 border border-primary/30 text-primary text-[7px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  {idx < STEPS.length - 1 && <div className="w-px flex-1 bg-border/30 my-0.5" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-foreground">{step.label}</span>
                    {idx < STEPS.length - 1 && <ArrowDown className="w-2.5 h-2.5 text-slate-600" />}
                  </div>
                  <div className="text-[7px] text-slate-500 font-mono mt-0.5">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance note */}
        <div className="px-4 py-2 border-t border-border/20 bg-amber-400/5">
          <div className="text-[7px] text-amber-400 font-mono">
            ⚠ Local relay agent not yet deployed. Steps 3–5 are simulated. No subprocess is spawned.
            Wire TRADINGVIEW_MCP_BRIDGE_URL + VERIDAN_BRIDGE_TOKEN secrets when agent is ready.
          </div>
        </div>
      </div>

      {/* Result Normalization Schema */}
      <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20">
          <span className="text-[9px] font-bold uppercase text-slate-300">Command Result Normalization Schema</span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {Object.entries(RESULT_NORMALIZATION_SCHEMA).map(([field, desc]) => (
            <div key={field} className="flex items-start gap-2 bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <span className="text-[8px] font-bold font-mono text-primary shrink-0 mt-0.5">{field}</span>
              <span className="text-[7px] text-slate-400 leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border/20">
          <div className="text-[7px] text-slate-500 font-mono">
            executionStatus is always <span className="text-destructive font-bold">NOT_EXECUTED</span> in simulation mode.
            reviewedByOperator defaults false until operator confirms in audit log.
          </div>
        </div>
      </div>
    </div>
  );
}