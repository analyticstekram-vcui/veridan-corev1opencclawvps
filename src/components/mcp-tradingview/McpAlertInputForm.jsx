/**
 * McpAlertInputForm
 * Mock alert input form — local validation only.
 * No network requests. No webhook exposure. No credential storage.
 */
import React, { useState } from 'react';
import {
  TIMEFRAMES, SIDES, SESSIONS, CHECKLIST_ITEMS, MCP_TRACE_STEPS,
  SAMPLE_MNQ_PAYLOAD, computeSignalScore, scoreToRiskLevel, scoreToBand,
  generatePreviewId, generateAuditHash,
} from './mcpTradingViewContracts';

const EMPTY_FORM = {
  symbol: '', timeframe: '5m', side: 'LONG', signalName: '',
  price: '', barTime: '', strategyVersion: '', rawMessage: '',
  sessionName: 'US_REGULAR', screenshotReference: '',
};

function buildInitialChecklist() {
  return Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, false]));
}

function buildMcpTrace(formData, checklist, score, riskLevel, previewId, auditHash) {
  const now = new Date().toISOString();
  return MCP_TRACE_STEPS.map((step, idx) => ({
    step: step.step,
    label: step.label,
    status: 'SIMULATED',
    executionStatus: 'NOT_EXECUTED',
    inputSnapshot: idx === 0 ? { ...formData } : null,
    checklistSnapshot: idx === 4 ? { ...checklist } : null,
    scoreSnapshot: idx === 5 ? score : null,
    riskSnapshot: idx === 6 ? { riskLevel, passed: riskLevel !== 'CRITICAL' } : null,
    proposalSnapshot: idx === 7 ? {
      previewId, symbol: formData.symbol, side: formData.side,
      tradeStatus: 'NO_ORDER_CREATED', executionStatus: 'NOT_EXECUTED',
    } : null,
    openclawSnapshot: idx === 8 ? { wakeMode: 'PREVIEW_ONLY', dispatch: 'DISABLED' } : null,
    timestamp: now,
    auditHash: idx === MCP_TRACE_STEPS.length - 1 ? auditHash : null,
  }));
}

export default function McpAlertInputForm({ onResult }) {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [checklist, setChecklist] = useState(buildInitialChecklist());
  const [errors, setErrors]       = useState({});

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadSample = () => {
    setForm({ ...SAMPLE_MNQ_PAYLOAD, price: String(SAMPLE_MNQ_PAYLOAD.price) });
    setChecklist(Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, true])));
  };

  const validate = () => {
    const e = {};
    if (!form.symbol.trim())        e.symbol        = 'Symbol required';
    if (!form.signalName.trim())     e.signalName    = 'Signal name required';
    if (!form.price || isNaN(+form.price)) e.price  = 'Valid price required';
    if (!form.barTime.trim())        e.barTime       = 'Bar time required';
    if (!form.strategyVersion.trim()) e.strategyVersion = 'Strategy version required';
    if (!form.rawMessage.trim())     e.rawMessage    = 'Raw message required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const previewId   = generatePreviewId();
    const score       = computeSignalScore(checklist);
    const riskLevel   = scoreToRiskLevel(score.score);
    const scoreBand   = scoreToBand(score.score);
    const auditHash   = generateAuditHash(form, score.score);
    const mcpTrace    = buildMcpTrace(form, checklist, score, riskLevel, previewId, auditHash);

    const result = {
      previewId,
      createdAt: new Date().toISOString(),
      payload: { ...form, price: +form.price },
      checklist: { ...checklist },
      score,
      riskLevel,
      scoreBand,
      auditHash,
      mcpTrace,
      approvalState: 'PENDING',
      tradeStatus: 'NO_ORDER_CREATED',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      nextStepRecommendation: score.score >= 7
        ? 'Score sufficient for operator review. Requires manual approval before any future dispatch.'
        : 'Score below threshold. Review checklist and signal conditions before re-submission.',
    };

    onResult(result);
  };

  const inputCls = (key) =>
    `w-full bg-secondary/30 border rounded-sm px-3 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 ${
      errors[key] ? 'border-destructive/50' : 'border-border/40'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono">
      {/* Sample loader */}
      <div className="flex items-center justify-between">
        <div className="text-[8px] text-slate-500">Local validation only · No network requests · No webhook exposure</div>
        <button
          type="button"
          onClick={loadSample}
          className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold rounded-sm hover:bg-amber-500/20 transition-colors"
        >
          Load MNQ 5m Sample
        </button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Symbol *</label>
          <input type="text" value={form.symbol} onChange={e => setField('symbol', e.target.value)}
            placeholder="MNQ1!" className={inputCls('symbol')} />
          {errors.symbol && <div className="text-[7px] text-destructive mt-0.5">{errors.symbol}</div>}
        </div>
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Timeframe *</label>
          <select value={form.timeframe} onChange={e => setField('timeframe', e.target.value)}
            className={inputCls()}>
            {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Side *</label>
          <select value={form.side} onChange={e => setField('side', e.target.value)}
            className={inputCls()}>
            {SIDES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Session *</label>
          <select value={form.sessionName} onChange={e => setField('sessionName', e.target.value)}
            className={inputCls()}>
            {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Signal Name *</label>
          <input type="text" value={form.signalName} onChange={e => setField('signalName', e.target.value)}
            placeholder="EMA_2_25_200_MACD_BULL" className={inputCls('signalName')} />
          {errors.signalName && <div className="text-[7px] text-destructive mt-0.5">{errors.signalName}</div>}
        </div>
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Price *</label>
          <input type="number" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)}
            placeholder="18450.25" className={inputCls('price')} />
          {errors.price && <div className="text-[7px] text-destructive mt-0.5">{errors.price}</div>}
        </div>
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Bar Time *</label>
          <input type="text" value={form.barTime} onChange={e => setField('barTime', e.target.value)}
            placeholder="2026-05-20T14:35:00Z" className={inputCls('barTime')} />
          {errors.barTime && <div className="text-[7px] text-destructive mt-0.5">{errors.barTime}</div>}
        </div>
        <div>
          <label className="block text-[7px] uppercase text-slate-500 mb-1">Strategy Version *</label>
          <input type="text" value={form.strategyVersion} onChange={e => setField('strategyVersion', e.target.value)}
            placeholder="v1.2.0" className={inputCls('strategyVersion')} />
          {errors.strategyVersion && <div className="text-[7px] text-destructive mt-0.5">{errors.strategyVersion}</div>}
        </div>
      </div>

      {/* Raw message */}
      <div>
        <label className="block text-[7px] uppercase text-slate-500 mb-1">Raw Message *</label>
        <input type="text" value={form.rawMessage} onChange={e => setField('rawMessage', e.target.value)}
          placeholder="MNQ1! 5m EMA2>EMA25>EMA200 MACD+HIST>0 LONG @ 18450.25"
          className={inputCls('rawMessage')} />
        {errors.rawMessage && <div className="text-[7px] text-destructive mt-0.5">{errors.rawMessage}</div>}
      </div>

      {/* Screenshot reference (optional) */}
      <div>
        <label className="block text-[7px] uppercase text-slate-500 mb-1">Screenshot Reference <span className="normal-case text-slate-600">(optional text only)</span></label>
        <input type="text" value={form.screenshotReference} onChange={e => setField('screenshotReference', e.target.value)}
          placeholder="mnq_5m_20260520_1435_ema_macd_long"
          className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40" />
        <div className="text-[7px] text-slate-600 mt-0.5">Text identifier only · No file upload · No image storage</div>
      </div>

      {/* Visual checklist */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">
          Visual Setup Checklist — EMA 2/25/200 + MACD
          <span className="ml-2 text-slate-600 normal-case">({Object.values(checklist).filter(Boolean).length}/{CHECKLIST_ITEMS.length} passed)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {CHECKLIST_ITEMS.map(item => (
            <label key={item.key} className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!checklist[item.key]}
                onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                className="mt-0.5 accent-green-500 w-3.5 h-3.5 shrink-0"
              />
              <span className={`text-[8px] leading-relaxed transition-colors ${checklist[item.key] ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.label(form.side)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 transition-colors"
      >
        Generate MCP Visual Confirmation Preview (Local Only)
      </button>
      <div className="text-[7px] font-mono text-slate-600 text-center">
        Local validation only · No network requests · No TradingView connection · No execution · NOT_EXECUTED
      </div>
    </form>
  );
}