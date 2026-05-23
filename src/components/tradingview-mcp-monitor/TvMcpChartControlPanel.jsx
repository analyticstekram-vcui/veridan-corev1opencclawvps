/**
 * TvMcpChartControlPanel
 * Governed Chart Control — Preview Only
 * Operator enters symbol/timeframe to generate a local preview record.
 * No execution. No dispatch. No broker. No trading. No credentials. No money movement.
 * Approval only stores local evidence — it does NOT send any command.
 */
import React, { useState } from 'react';
import { FilePlus, CheckCircle2, XCircle, Shield } from 'lucide-react';

const PREVIEW_STORAGE_KEY = 'veridanTvMcpChartControlPreviews';

const CHART_TYPES = ['candlestick', 'bar', 'line', 'area', 'heikin_ashi', 'hollow_candle'];
const TIMEFRAMES  = ['1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W'];

function loadPreviews() {
  try { return JSON.parse(localStorage.getItem(PREVIEW_STORAGE_KEY) || '[]'); } catch { return []; }
}
function savePreviews(list) {
  try { localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(list.slice(0, 50))); } catch {}
}

function buildPreview({ symbol, timeframe, chartType, reason, operatorNote, currentSymbol }) {
  return {
    previewId:        'cpv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
    createdAt:        new Date().toISOString(),
    currentSymbol:    currentSymbol || 'UNKNOWN',
    requestedSymbol:  symbol.trim().toUpperCase(),
    requestedTimeframe: timeframe,
    chartType:        chartType,
    reason:           reason.trim(),
    operatorNote:     operatorNote.trim(),
    executionStatus:  'PREVIEW_ONLY',
    dispatchAllowed:  false,
    tradingAllowed:   false,
    brokerConnection: 'DISABLED',
    moneyMovement:    'DISABLED',
    credentialAccess: 'DISABLED',
    approvalStatus:   'PENDING',
    approvedAt:       null,
  };
}

export default function TvMcpChartControlPanel({ checks }) {
  const [symbol,       setSymbol]       = useState('');
  const [timeframe,    setTimeframe]    = useState('240');
  const [chartType,    setChartType]    = useState('candlestick');
  const [reason,       setReason]       = useState('');
  const [operatorNote, setOperatorNote] = useState('');
  const [preview,      setPreview]      = useState(null);
  const [previews,     setPreviews]     = useState(() => loadPreviews());

  // Current symbol from latest successful status check
  const currentSymbol = checks?.find(c => c.command === 'status' && c.status === 'SUCCESS')?.chartSymbol ?? null;

  const generatePreview = () => {
    if (!symbol.trim()) return;
    const p = buildPreview({ symbol, timeframe, chartType, reason, operatorNote, currentSymbol });
    setPreview(p);
  };

  const approvePreview = () => {
    if (!preview) return;
    const approved = { ...preview, approvalStatus: 'LOCALLY_APPROVED', approvedAt: new Date().toISOString() };
    setPreview(approved);
    const updated = [approved, ...previews];
    setPreviews(updated);
    savePreviews(updated);
  };

  const clearPreview = () => {
    setPreview(null);
    setSymbol('');
    setReason('');
    setOperatorNote('');
  };

  const inputCls = 'w-full px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50';
  const labelCls = 'text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1 block';

  return (
    <div className="bg-card border border-amber-500/20 rounded-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[9px] font-bold uppercase text-amber-400">Governed Chart Control</span>
        <span className="ml-auto text-[7px] font-mono text-destructive font-bold">PREVIEW_ONLY · NO EXECUTION</span>
      </div>

      {/* Safety notice */}
      <div className="px-4 py-2 border-b border-border/20 text-[8px] text-slate-500 leading-relaxed">
        Enter a symbol and timeframe to generate a <span className="text-amber-400 font-bold">local preview record</span>.
        No command is sent to the relay. No broker order, trade, credential request, or money movement is triggered.
        Chart changes must be performed <span className="font-bold text-slate-300">manually</span> in the VPS TradingView browser.
      </div>

      {/* Current symbol context */}
      <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10">
        <span className="text-[7px] uppercase text-slate-500 font-bold">Current Chart Symbol (from last status check): </span>
        <span className="text-[9px] font-mono font-bold text-primary">{currentSymbol ?? 'N/A — run a status check first'}</span>
      </div>

      {/* Form */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Symbol *</label>
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="e.g. CME_MINI_DL:MNQH2026"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Timeframe</label>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className={inputCls}>
              {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Chart Type</label>
            <select value={chartType} onChange={e => setChartType(e.target.value)} className={inputCls}>
              {CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Shift to 4H for session review"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Operator Note</label>
          <input
            type="text"
            value={operatorNote}
            onChange={e => setOperatorNote(e.target.value)}
            placeholder="Optional governance note"
            className={inputCls}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={generatePreview}
            disabled={!symbol.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded-sm hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
          >
            <FilePlus className="w-3 h-3" /> Generate Preview
          </button>
          {preview && (
            <button type="button" onClick={clearPreview}
              className="flex items-center gap-1.5 px-3 py-2 border border-border/40 text-slate-400 text-[9px] font-bold rounded-sm hover:bg-secondary/50 transition-colors">
              <XCircle className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Preview record */}
      {preview && (
        <div className="border-t border-amber-500/20 p-4 space-y-3">
          <div className="text-[8px] font-bold uppercase text-amber-400 mb-1">Preview Record</div>

          {/* Safety fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Current Symbol',     value: preview.currentSymbol,        cls: 'text-slate-300' },
              { label: 'Requested Symbol',   value: preview.requestedSymbol,      cls: 'text-primary font-bold' },
              { label: 'Requested TF',       value: preview.requestedTimeframe,   cls: 'text-primary font-bold' },
              { label: 'Chart Type',         value: preview.chartType,            cls: 'text-slate-300' },
              { label: 'executionStatus',    value: preview.executionStatus,      cls: 'text-amber-400 font-bold' },
              { label: 'dispatchAllowed',    value: String(preview.dispatchAllowed), cls: 'text-destructive font-bold' },
              { label: 'tradingAllowed',     value: String(preview.tradingAllowed),  cls: 'text-destructive font-bold' },
              { label: 'brokerConnection',   value: preview.brokerConnection,     cls: 'text-destructive font-bold' },
              { label: 'moneyMovement',      value: preview.moneyMovement,        cls: 'text-destructive font-bold' },
              { label: 'credentialAccess',   value: preview.credentialAccess,     cls: 'text-destructive font-bold' },
              { label: 'approvalStatus',     value: preview.approvalStatus,
                cls: preview.approvalStatus === 'LOCALLY_APPROVED' ? 'text-primary font-bold' : 'text-amber-400 font-bold' },
              { label: 'previewId',          value: preview.previewId,            cls: 'text-slate-500 text-[7px]' },
            ].map(f => (
              <div key={f.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{f.label}</div>
                <div className={`text-[8px] font-mono break-all ${f.cls}`}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Reason / note */}
          {(preview.reason || preview.operatorNote) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {preview.reason && (
                <div className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                  <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Reason</div>
                  <div className="text-[8px] text-slate-300">{preview.reason}</div>
                </div>
              )}
              {preview.operatorNote && (
                <div className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                  <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Operator Note</div>
                  <div className="text-[8px] text-slate-300">{preview.operatorNote}</div>
                </div>
              )}
            </div>
          )}

          {/* Approve button */}
          {preview.approvalStatus === 'PENDING' && (
            <button
              type="button"
              onClick={approvePreview}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" /> Approve Chart Switch Preview
            </button>
          )}

          {preview.approvalStatus === 'LOCALLY_APPROVED' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-primary font-bold">
                Locally approved at {new Date(preview.approvedAt).toLocaleString()} — stored as local evidence only. No command sent.
              </span>
            </div>
          )}

          <div className="text-[7px] text-slate-600 font-mono">
            Generated: {new Date(preview.createdAt).toLocaleString()} · Storage key: {PREVIEW_STORAGE_KEY} · Records stored: {previews.length}
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 text-[7px] text-slate-600 font-mono">
        <Shield className="w-2.5 h-2.5 text-amber-500/60 shrink-0" />
        Approval stores local evidence only. No relay call. No broker order. No trade. No credential. No money movement.
      </div>
    </div>
  );
}