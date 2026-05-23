/**
 * TvMcpManualChartInstructions
 * Instructions and guidance for manual chart control in VPS TradingView browser.
 * Read-only. No automated chart switching. No execution.
 */
import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';

export default function TvMcpManualChartInstructions({ checks }) {
  const [expandChecklist, setExpandChecklist] = useState(false);

  // Find latest successful status and quote checks
  const lastStatusCheck = checks?.find(c => c.command === 'status' && c.status === 'SUCCESS') ?? null;
  const lastQuoteCheck  = checks?.find(c => c.command === 'quote'  && c.status === 'SUCCESS') ?? null;

  // Pull pre-parsed fields stored on the record (set by TvMcpMonitoringConsole's extractFields)
  const currentSymbol      = lastStatusCheck?.chartSymbol    ?? lastQuoteCheck?.quoteSymbol   ?? null;
  const currentResolution  = lastStatusCheck?.chartResolution                                 ?? null;
  const lastQuotePrice     = lastQuoteCheck?.quoteLast                                        ?? null;
  const lastQuoteTime      = lastQuoteCheck?.createdAt ? new Date(lastQuoteCheck.createdAt).toLocaleString() : null;
  const lastChartTitle     = lastStatusCheck?.targetTitle                                     ?? null;

  const checklist = [
    { step: 1, task: 'Open TradingView VPS browser session' },
    { step: 2, task: 'Change symbol/timeframe manually in the chart' },
    { step: 3, task: 'Run status check to verify new symbol and resolution' },
    { step: 4, task: 'Run quote check to get current price data' },
    { step: 5, task: 'Export evidence JSON to verify all parsed fields' },
  ];

  return (
    <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[9px] font-bold uppercase text-primary">Manual Chart Control Instructions</span>
      </div>

      {/* Explanation */}
      <div className="px-4 py-3 border-b border-border/20 text-[8px] text-slate-400 leading-relaxed space-y-1">
        <p>
          <span className="font-bold text-slate-300">Chart changes are performed manually</span> in the VPS TradingView browser session.
          You control the symbol and timeframe directly in the UI. After changing the chart,
          use the <span className="text-primary font-bold">status</span> and <span className="text-primary font-bold">quote</span> checks
          to verify the new chart configuration and fetch live price data.
        </p>
        <p className="text-slate-500 italic">
          No automated chart switching is performed by this monitoring console. All changes are manual.
        </p>
      </div>

      {/* Current chart state */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current Chart State (from last checks)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Symbol',       value: currentSymbol      ?? 'N/A', cls: 'text-primary font-bold' },
            { label: 'Resolution',   value: currentResolution  ?? 'N/A', cls: 'text-slate-300' },
            { label: 'Last Quote',   value: lastQuotePrice     ?? 'N/A', cls: 'text-primary font-bold' },
            { label: 'Quote Time',   value: lastQuoteTime      ?? 'N/A', cls: 'text-slate-400' },
            { label: 'Chart Title',  value: lastChartTitle     ?? 'N/A', cls: 'text-slate-400' },
            { label: 'Mode',         value: 'READ_ONLY',                 cls: 'text-amber-400 font-bold' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
              <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{label}</div>
              <div className={`text-[8px] break-all font-mono leading-snug ${cls}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setExpandChecklist(!expandChecklist)}
          className="flex items-center gap-2 mb-2 text-[8px] font-bold uppercase text-slate-400 hover:text-slate-300 transition-colors"
        >
          <span className="text-slate-500">{expandChecklist ? '▼' : '▶'}</span>
          Workflow Checklist ({checklist.length} steps)
        </button>

        {expandChecklist && (
          <div className="space-y-1.5 mt-2 pl-1 border-l border-primary/20">
            {checklist.map(({ step, task }) => (
              <div key={step} className="flex items-start gap-2.5 text-[8px]">
                <Circle className="w-3 h-3 text-primary/40 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  <span className="font-bold text-primary">{step}.</span> {task}
                </span>
              </div>
            ))}
          </div>
        )}

        {!expandChecklist && (
          <div className="text-[7px] text-slate-600 italic">Click to expand checklist</div>
        )}
      </div>

      {/* Safety footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 text-[7px] text-slate-600 font-mono">
        <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
        All chart control is manual. Status and quote checks are read-only GET operations. No automated switching. No execution.
      </div>
    </div>
  );
}