/**
 * TvMcpChartControlPanel
 * Phase 5 — Governed Chart Control
 * Step 1: Generate Preview (local only, no relay call)
 * Step 2: Approve Chart Switch Preview (local evidence)
 * Step 3: Execute Governed Chart Navigation (calls tradingViewMcpNavigateChart)
 *
 * No trading. No broker. No credentials. No money movement.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FilePlus, CheckCircle2, XCircle, Shield, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';

const PREVIEW_STORAGE_KEY  = 'veridanTvMcpChartControlPreviews';
const NAV_STORAGE_KEY      = 'veridanTvMcpChartNavHistory';

const CHART_TYPES = ['candlestick', 'bars', 'line'];
const TIMEFRAMES  = ['1', '5', '15', '30', '60', '240', 'D', 'W'];

function loadFromStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveToStorage(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(0, 50))); } catch {}
}

function buildPreview({ symbol, timeframe, chartType, reason, operatorNote, currentSymbol }) {
  return {
    previewId:          'cpv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
    createdAt:          new Date().toISOString(),
    currentSymbol:      currentSymbol || 'UNKNOWN',
    requestedSymbol:    symbol.trim().toUpperCase(),
    requestedTimeframe: timeframe,
    chartType,
    reason:             reason.trim(),
    operatorNote:       operatorNote.trim(),
    executionStatus:    'PREVIEW_ONLY',
    dispatchAllowed:    false,
    tradingAllowed:     false,
    brokerConnection:   'DISABLED',
    moneyMovement:      'DISABLED',
    credentialAccess:   'DISABLED',
    approvalStatus:     'PENDING',
    approvedAt:         null,
  };
}

export default function TvMcpChartControlPanel({ checks }) {
  const [symbol,       setSymbol]       = useState('');
  const [timeframe,    setTimeframe]    = useState('240');
  const [chartType,    setChartType]    = useState('candlestick');
  const [reason,       setReason]       = useState('');
  const [operatorNote, setOperatorNote] = useState('');
  const [preview,      setPreview]      = useState(null);
  const [previews,     setPreviews]     = useState(() => loadFromStorage(PREVIEW_STORAGE_KEY));
  const [navLoading,   setNavLoading]   = useState(false);
  const [navResult,    setNavResult]    = useState(null);
  const [navHistory,   setNavHistory]   = useState(() => loadFromStorage(NAV_STORAGE_KEY));

  // Current symbol from latest successful status check
  const currentSymbol = checks?.find(c => c.command === 'status' && c.status === 'SUCCESS')?.chartSymbol ?? null;

  const generatePreview = () => {
    if (!symbol.trim()) return;
    setNavResult(null);
    const p = buildPreview({ symbol, timeframe, chartType, reason, operatorNote, currentSymbol });
    setPreview(p);
  };

  const approvePreview = () => {
    if (!preview) return;
    const approved = { ...preview, approvalStatus: 'LOCALLY_APPROVED', approvedAt: new Date().toISOString() };
    setPreview(approved);
    const updated = [approved, ...previews];
    setPreviews(updated);
    saveToStorage(PREVIEW_STORAGE_KEY, updated);
  };

  const executeNavigation = async () => {
    if (!preview || preview.approvalStatus !== 'LOCALLY_APPROVED' || navLoading) return;
    setNavLoading(true);
    setNavResult(null);
    try {
      const res = await base44.functions.invoke('tradingViewMcpNavigateChart', {
        symbol:          preview.requestedSymbol,
        timeframe:       preview.requestedTimeframe,
        chartType:       preview.chartType,
        operatorReason:  preview.reason || 'Operator-approved chart navigation',
        operatorNote:    preview.operatorNote || '',
        operatorApproval: true,
      });
      const result = res.data || {};
      const record = {
        ...result,
        previewId:   preview.previewId,
        invokedAt:   new Date().toISOString(),
      };
      setNavResult(record);
      const updated = [record, ...navHistory];
      setNavHistory(updated);
      saveToStorage(NAV_STORAGE_KEY, updated);
    } catch (err) {
      setNavResult({
        status: 'HOLD_FOR_MCP_RELAY',
        error: err.message || 'Backend error',
        executionStatus: 'BROWSER_NAVIGATION_ONLY',
        tradingAttempted: false,
        brokerActionsAttempted: false,
        moneyMovementAttempted: false,
        credentialExposed: false,
        liveTrading: 'DISABLED',
        brokerConnection: 'DISABLED',
        riskClass: 'SAFE_BROWSER_NAVIGATION',
        operatorApproval: true,
        invokedAt: new Date().toISOString(),
      });
    } finally {
      setNavLoading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setNavResult(null);
    setSymbol('');
    setReason('');
    setOperatorNote('');
  };

  const inputCls = 'w-full px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50';
  const labelCls = 'text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1 block';

  const navSuccess = ['SUCCESS', 'CONNECTED_READ_ONLY', 'QUOTE_CONNECTED'].includes(navResult?.status);

  return (
    <div className="bg-card border border-amber-500/20 rounded-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[9px] font-bold uppercase text-amber-400">Phase 5 — Governed Chart Navigation</span>
        <span className="ml-auto text-[7px] font-mono text-destructive font-bold">BROWSER_NAVIGATION_ONLY · NO TRADING</span>
      </div>

      {/* Safety notice */}
      <div className="px-4 py-2 border-b border-border/20 text-[8px] text-slate-500 leading-relaxed">
        <span className="text-amber-400 font-bold">NOT trading. NOT broker execution. Does NOT place orders. Does NOT access credentials. Does NOT move money.</span>
        {' '}This only changes the TradingView browser chart symbol/timeframe view via the local relay.
        Requires operator approval before execution.
      </div>

      {/* Current symbol context */}
      <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10">
        <span className="text-[7px] uppercase text-slate-500 font-bold">Current Chart Symbol (from last status check): </span>
        <span className="text-[9px] font-mono font-bold text-primary">{currentSymbol ?? 'N/A — run a status check first'}</span>
      </div>

      {/* Step indicators */}
      <div className="px-4 py-2 border-b border-border/20 flex items-center gap-3 text-[7px] font-mono">
        {[
          { n: '1', label: 'Generate Preview', done: !!preview },
          { n: '2', label: 'Approve Preview',  done: preview?.approvalStatus === 'LOCALLY_APPROVED' },
          { n: '3', label: 'Execute Navigation', done: !!navResult && navSuccess },
          { n: '4', label: 'Re-run Status + Quote', done: false },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <span className="text-slate-700">→</span>}
            <span className={s.done ? 'text-primary font-bold' : 'text-slate-500'}>
              {s.done ? '✓' : s.n}. {s.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Form */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Symbol *</label>
            <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)}
              placeholder="e.g. CME_MINI_DL:MNQH2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Timeframe *</label>
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
            <label className={labelCls}>Reason *</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Shift to 4H for session review" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Operator Note</label>
          <input type="text" value={operatorNote} onChange={e => setOperatorNote(e.target.value)}
            placeholder="Optional governance note" className={inputCls} />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={generatePreview} disabled={!symbol.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded-sm hover:bg-amber-500/20 disabled:opacity-40 transition-colors">
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

      {/* Preview record + approval + execution */}
      {preview && (
        <div className="border-t border-amber-500/20 p-4 space-y-3">
          <div className="text-[8px] font-bold uppercase text-amber-400">Preview Record</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Current Symbol',   value: preview.currentSymbol,           cls: 'text-slate-300' },
              { label: 'Requested Symbol', value: preview.requestedSymbol,         cls: 'text-primary font-bold' },
              { label: 'Requested TF',     value: preview.requestedTimeframe,      cls: 'text-primary font-bold' },
              { label: 'Chart Type',       value: preview.chartType,               cls: 'text-slate-300' },
              { label: 'executionStatus',  value: preview.executionStatus,         cls: 'text-amber-400 font-bold' },
              { label: 'dispatchAllowed',  value: String(preview.dispatchAllowed), cls: 'text-destructive font-bold' },
              { label: 'tradingAllowed',   value: String(preview.tradingAllowed),  cls: 'text-destructive font-bold' },
              { label: 'brokerConnection', value: preview.brokerConnection,        cls: 'text-destructive font-bold' },
              { label: 'moneyMovement',    value: preview.moneyMovement,           cls: 'text-destructive font-bold' },
              { label: 'credentialAccess', value: preview.credentialAccess,        cls: 'text-destructive font-bold' },
              { label: 'approvalStatus',   value: preview.approvalStatus,
                cls: preview.approvalStatus === 'LOCALLY_APPROVED' ? 'text-primary font-bold' : 'text-amber-400 font-bold' },
              { label: 'previewId',        value: preview.previewId,               cls: 'text-slate-500 text-[7px]' },
            ].map(f => (
              <div key={f.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{f.label}</div>
                <div className={`text-[8px] font-mono break-all ${f.cls}`}>{f.value}</div>
              </div>
            ))}
          </div>

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

          {/* Step 2: Approve */}
          {preview.approvalStatus === 'PENDING' && (
            <button type="button" onClick={approvePreview}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 transition-colors">
              <CheckCircle2 className="w-3 h-3" /> Approve Chart Switch Preview
            </button>
          )}

          {preview.approvalStatus === 'LOCALLY_APPROVED' && !navResult && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-primary font-bold">
                Locally approved at {new Date(preview.approvedAt).toLocaleString()} — preview evidence stored.
              </span>
            </div>
          )}

          {/* Step 3: Execute */}
          {preview.approvalStatus === 'LOCALLY_APPROVED' && !navResult && (
            <button type="button" onClick={executeNavigation} disabled={navLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 transition-colors">
              {navLoading
                ? <><RefreshCw className="w-3 h-3 animate-spin" /> Running Verification…</>
                : <><Navigation className="w-3 h-3" /> Run Read-Only Chart Verification</>}
            </button>
          )}

          {/* Navigation result */}
          {navResult && (
            <div className={`border rounded-sm p-3 space-y-3 ${navSuccess ? 'border-primary/30 bg-primary/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-center gap-2">
                {navSuccess
                  ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className={`text-[10px] font-bold font-mono ${navSuccess ? 'text-primary' : 'text-amber-400'}`}>
                  {navResult.status}
                </span>
                <span className="ml-auto text-[7px] font-mono text-slate-500">{navResult.auditId}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'executionStatus',        value: navResult.executionStatus,                cls: 'text-amber-400 font-bold' },
                  { label: 'riskClass',               value: navResult.riskClass,                     cls: 'text-primary font-bold' },
                  { label: 'tradingAttempted',        value: String(navResult.tradingAttempted),       cls: 'text-destructive font-bold' },
                  { label: 'brokerActionsAttempted',  value: String(navResult.brokerActionsAttempted), cls: 'text-destructive font-bold' },
                  { label: 'moneyMovementAttempted',  value: String(navResult.moneyMovementAttempted), cls: 'text-destructive font-bold' },
                  { label: 'credentialExposed',       value: String(navResult.credentialExposed),      cls: 'text-destructive font-bold' },
                  { label: 'liveTrading',             value: navResult.liveTrading,                    cls: 'text-destructive font-bold' },
                  { label: 'brokerConnection',        value: navResult.brokerConnection,               cls: 'text-destructive font-bold' },
                ].map(f => (
                  <div key={f.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
                    <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{f.label}</div>
                    <div className={`text-[8px] font-mono break-all ${f.cls}`}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Sub-step results */}
              {(navResult.healthOk !== undefined || navResult.statusOk !== undefined || navResult.quoteOk !== undefined) && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '/health',               ok: navResult.healthOk },
                    { label: '/relay?command=status', ok: navResult.statusOk },
                    { label: '/relay?command=quote',  ok: navResult.quoteOk  },
                  ].map(s => (
                    <span key={s.label} className={`text-[7px] font-mono px-2 py-1 rounded-sm border ${s.ok ? 'border-primary/30 bg-primary/5 text-primary' : 'border-amber-500/30 bg-amber-500/5 text-amber-400'}`}>
                      {s.ok ? '✓' : '⚠'} {s.label}
                    </span>
                  ))}
                </div>
              )}

              {navResult.chartSymbol && (
                <div className="text-[8px] font-mono text-primary px-2 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
                  Chart symbol confirmed: <span className="font-bold">{navResult.chartSymbol}</span>
                  {navResult.chartResolution && <span className="ml-2 text-slate-400">· TF: {navResult.chartResolution}</span>}
                </div>
              )}

              {navResult.error && (
                <div className="text-[8px] text-amber-400 font-mono px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                  {navResult.error}
                </div>
              )}

              {navSuccess && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-sm">
                  <Navigation className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="text-[8px] text-primary leading-relaxed">
                    <span className="font-bold">Verification complete.</span> Status and Quote checks passed.
                    To change the chart on VPS, perform the change manually in the TradingView browser, then run another verification here to capture fresh evidence.
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-[7px] text-slate-600 font-mono">
            Preview key: {PREVIEW_STORAGE_KEY} · Nav history key: {NAV_STORAGE_KEY} · Nav records: {navHistory.length}
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 text-[7px] text-slate-600 font-mono">
        <Shield className="w-2.5 h-2.5 text-amber-500/60 shrink-0" />
        BROWSER_NAVIGATION_ONLY · riskClass: SAFE_BROWSER_NAVIGATION · No trade · No broker · No credential · No money movement
      </div>
    </div>
  );
}