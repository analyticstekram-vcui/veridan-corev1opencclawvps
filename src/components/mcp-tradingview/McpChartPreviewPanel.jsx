/**
 * McpChartPreviewPanel
 * Mock chart preview panel — does NOT connect to TradingView.
 * Placeholder chart context only. PREVIEW_PLACEHOLDER.
 */
import React from 'react';
import { BarChart2, Camera, AlertTriangle } from 'lucide-react';

const PLACEHOLDER_INDICATORS = [
  { name: 'EMA 2',   color: '#22c55e', note: 'Fast EMA — entry signal line' },
  { name: 'EMA 25',  color: '#f59e0b', note: 'Mid EMA — trend confirmation' },
  { name: 'EMA 200', color: '#6366f1', note: 'Slow EMA — macro trend bias' },
  { name: 'MACD',    color: '#38bdf8', note: 'Momentum / zero-line filter' },
  { name: 'Volume',  color: '#94a3b8', note: 'Volume confirmation baseline' },
];

export default function McpChartPreviewPanel({ payload }) {
  const symbol    = payload?.symbol    || '—';
  const timeframe = payload?.timeframe || '—';
  const side      = payload?.side      || '—';
  const price     = payload?.price     || '—';

  return (
    <div className="bg-card border border-amber-500/30 rounded-sm overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-amber-500/10 px-4 py-2.5 flex items-center gap-2 border-b border-amber-500/20">
        <BarChart2 className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Chart Preview Panel</span>
        <span className="ml-auto text-[7px] font-mono text-amber-400/60">PREVIEW_PLACEHOLDER · NOT_CONNECTED</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Disclaimer */}
        <div className="bg-destructive/5 border border-destructive/30 rounded-sm px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <div className="text-[8px] text-destructive leading-relaxed">
            Real chart visual confirmation requires an approved browser/MCP connection in a later phase.
            This panel shows a placeholder context only. No TradingView connection is active.
            No screenshot is captured. No chart data is fetched.
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8px]">
          {[
            { k: 'Symbol',              v: symbol },
            { k: 'Timeframe',           v: timeframe },
            { k: 'Side',                v: side, color: side === 'LONG' ? 'text-primary' : 'text-destructive' },
            { k: 'Price at Alert',      v: price },
            { k: 'Chart Connection',    v: 'DISABLED',          color: 'text-destructive font-bold' },
            { k: 'Screenshot Status',   v: 'PREVIEW_PLACEHOLDER', color: 'text-amber-400 font-bold' },
            { k: 'Browser Automation',  v: 'NOT_ACTIVE',        color: 'text-destructive font-bold' },
            { k: 'MCP Chart Tool',      v: 'SCHEMA_ONLY',       color: 'text-amber-400 font-bold' },
          ].map(({ k, v, color }) => (
            <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
              <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
              <div className={`font-mono ${color || 'text-slate-300'}`}>{String(v)}</div>
            </div>
          ))}
        </div>

        {/* Placeholder chart canvas */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm overflow-hidden">
          <div className="bg-secondary/30 px-3 py-1.5 border-b border-border/20 flex items-center gap-2">
            <span className="text-[8px] font-bold text-foreground">{symbol} / {timeframe}</span>
            {PLACEHOLDER_INDICATORS.map(ind => (
              <span key={ind.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: ind.color }} />
                <span className="text-[7px] text-slate-400">{ind.name}</span>
              </span>
            ))}
          </div>

          {/* Fake chart area */}
          <div className="relative h-44 flex items-center justify-center bg-[#0d1117]">
            <svg viewBox="0 0 400 120" className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
              {/* Grid lines */}
              {[20, 40, 60, 80, 100].map(y => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#334155" strokeWidth="0.5" />
              ))}
              {[50, 100, 150, 200, 250, 300, 350].map(x => (
                <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#334155" strokeWidth="0.5" />
              ))}
              {/* EMA 200 (purple) */}
              <polyline points="0,80 50,75 100,72 150,70 200,68 250,66 300,65 350,63 400,62"
                stroke="#6366f1" strokeWidth="1.5" fill="none" />
              {/* EMA 25 (amber) */}
              <polyline points="0,70 50,65 100,60 150,58 200,55 250,52 300,50 350,48 400,45"
                stroke="#f59e0b" strokeWidth="1.5" fill="none" />
              {/* EMA 2 (green) */}
              <polyline points="0,65 50,55 100,50 150,45 200,42 250,38 300,35 350,32 400,30"
                stroke="#22c55e" strokeWidth="1.5" fill="none" />
              {/* Candles (placeholder) */}
              {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map((x, i) => (
                <g key={x}>
                  <rect x={x - 4} y={50 - i * 2} width="8" height={12 + i} fill={i % 3 === 0 ? '#ef4444' : '#22c55e'} opacity="0.7" />
                  <line x1={x} y1={48 - i * 2} x2={x} y2={64 + i} stroke={i % 3 === 0 ? '#ef4444' : '#22c55e'} strokeWidth="1" opacity="0.7" />
                </g>
              ))}
            </svg>
            <div className="relative z-10 text-center space-y-1">
              <Camera className="w-6 h-6 text-slate-600 mx-auto" />
              <div className="text-[8px] font-bold text-slate-500">PREVIEW_PLACEHOLDER</div>
              <div className="text-[7px] text-slate-600">No TradingView connection active</div>
            </div>
          </div>

          {/* Indicator legend */}
          <div className="border-t border-border/20 px-3 py-2 flex flex-wrap gap-3">
            {PLACEHOLDER_INDICATORS.map(ind => (
              <div key={ind.name} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ background: ind.color }} />
                <span className="text-[7px] text-slate-500">{ind.name}</span>
                <span className="text-[6px] text-slate-600">— {ind.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MACD placeholder */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm p-3">
          <div className="text-[7px] uppercase text-slate-500 mb-2">MACD Placeholder (schema preview)</div>
          <div className="h-10 bg-[#0d1117] rounded-sm flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 400 40" className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="400" y2="20" stroke="#334155" strokeWidth="0.5" />
              <polyline points="0,20 40,18 80,15 120,12 160,10 200,8 240,7 280,5 320,4 360,3 400,2"
                stroke="#38bdf8" strokeWidth="1" fill="none" />
              {[20,60,100,140,180,220,260,300,340,380].map((x, i) => (
                <rect key={x} x={x-3} y={20 - (i+1)*1.5} width="6" height={(i+1)*1.5} fill="#22c55e" opacity="0.5" />
              ))}
            </svg>
            <span className="relative text-[7px] text-slate-600 font-mono">MACD · SCHEMA_PREVIEW · NOT_CONNECTED</span>
          </div>
        </div>

        <div className="text-[7px] font-mono text-slate-600 text-center">
          All chart data above is illustrative placeholder only · No TradingView API called · No screenshot captured
        </div>
      </div>
    </div>
  );
}