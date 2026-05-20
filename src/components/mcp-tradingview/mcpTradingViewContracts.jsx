/**
 * mcpTradingViewContracts.js
 * Static governance contracts and constants for the MCP TradingView Visual Confirmation Preview.
 * No live connection. No execution. No credentials.
 */

export const FIXED_STATUSES = {
  MCP_STATUS:              'SIMULATED_ONLY',
  WEBHOOK_STATUS:          'PREVIEW_ONLY',
  TRADINGVIEW_CONNECTION:  'DISABLED',
  CHART_CHECK:             'PREVIEW_ONLY',
  OPENCLAW_BROWSER:        'DISABLED_UNTIL_APPROVED',
  OPENCLAW_DISPATCH:       'DISABLED',
  AGENT_API_USAGE:         'DISABLED',
  TRADE_STATUS:            'NO_ORDER_CREATED',
  EXECUTION_STATUS:        'NOT_EXECUTED',
};

export const GUARDRAILS = [
  'TradingView connection disabled',
  'MCP tools are schema previews only',
  'No browser automation active',
  'No OpenClaw agent/API usage',
  'No broker connected',
  'No order creation',
  'Operator approval required before any future dispatch',
];

export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1D'];
export const SIDES = ['LONG', 'SHORT'];
export const SESSIONS = ['US_REGULAR', 'US_EXTENDED', 'OVERNIGHT', 'PRE_MARKET', 'ASIA', 'LONDON'];
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const APPROVAL_STATES = ['PENDING', 'APPROVED', 'DENIED'];
export const SCORE_BANDS = ['0-3', '4-5', '6-7', '8-9', '10'];

export const RISK_COLORS = {
  LOW:      { text: 'text-primary',     bg: 'bg-primary/10',     border: 'border-primary/30' },
  MEDIUM:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  HIGH:     { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  CRITICAL: { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

export const SCORE_COLORS = {
  '0-3': 'text-destructive',
  '4-5': 'text-orange-400',
  '6-7': 'text-amber-400',
  '8-9': 'text-primary',
  '10':  'text-primary',
};

export const CHECKLIST_ITEMS = [
  { key: 'ema2_side',        label: (side) => side === 'LONG' ? 'EMA 2 above EMA 25' : 'EMA 2 below EMA 25' },
  { key: 'ema25_200',        label: (side) => side === 'LONG' ? 'EMA 25 above EMA 200' : 'EMA 25 below EMA 200' },
  { key: 'price_ema200',     label: (side) => side === 'LONG' ? 'Price above EMA 200' : 'Price below EMA 200' },
  { key: 'macd_dir',         label: (side) => side === 'LONG' ? 'MACD bullish direction / above zero' : 'MACD bearish direction / below zero' },
  { key: 'candle_close',     label: () => 'Candle close confirmation present' },
  { key: 'volume_confirm',   label: () => 'Volume confirmation above baseline' },
  { key: 'no_chop',          label: () => 'Chop/range condition clear' },
  { key: 'session_filter',   label: () => 'Session filter passed' },
  { key: 'news_clear',       label: () => 'News / high-volatility block clear' },
  { key: 'dup_alert_clear',  label: () => 'Duplicate alert window clear' },
];

export const MCP_TRACE_STEPS = [
  { step: 'tradingview.alert.receive',           label: 'Alert Receive',              color: 'text-primary' },
  { step: 'tradingview.alert.validate',          label: 'Alert Validate',             color: 'text-primary' },
  { step: 'tradingview.chart.open.preview',      label: 'Chart Open Preview',         color: 'text-amber-400' },
  { step: 'tradingview.chart.screenshot.preview',label: 'Screenshot Preview',         color: 'text-amber-400' },
  { step: 'tradingview.visual.checklist.evaluate',label: 'Visual Checklist Evaluate', color: 'text-amber-400' },
  { step: 'tradingview.signal.score',            label: 'Signal Score',               color: 'text-amber-400' },
  { step: 'veridan.risk.validate',               label: 'Risk Validate',              color: 'text-chart-3' },
  { step: 'veridan.proposal.create',             label: 'Proposal Create',            color: 'text-chart-3' },
  { step: 'openclaw.wake.preview',               label: 'OpenClaw Wake Preview',      color: 'text-chart-4' },
];

export const ARCHITECTURE_STAGES = [
  { id: 1, label: 'TradingView Alert Trigger',       icon: '📡', system: 'TradingView',     note: 'DISABLED — Simulated only' },
  { id: 2, label: 'Veridan Webhook Receiver Preview', icon: '🔌', system: 'Veridan Core',    note: 'PREVIEW_ONLY — No URL exposed' },
  { id: 3, label: 'MCP Protocol Validation',          icon: '🔬', system: 'MCP Layer',       note: 'SIMULATED_ONLY — Schema preview' },
  { id: 4, label: 'Chart Open / Screenshot Preview',  icon: '📊', system: 'Browser (Future)',note: 'DISABLED_UNTIL_APPROVED' },
  { id: 5, label: 'Visual Setup Checklist',           icon: '✅', system: 'Veridan Core',    note: 'LOCAL_EVALUATION' },
  { id: 6, label: 'Signal Confluence Score',          icon: '📈', system: 'Scoring Engine',  note: 'SIMULATED_ONLY' },
  { id: 7, label: 'Risk Gate',                        icon: '🛡️', system: 'Risk Policy',     note: 'LOCAL_VALIDATION' },
  { id: 8, label: 'OpenClaw Wake-Only Preview',       icon: '⚙️', system: 'OpenClaw',        note: 'DISABLED_UNTIL_APPROVED' },
  { id: 9, label: 'Operator Approval',               icon: '👤', system: 'Operator',         note: 'REQUIRED' },
  { id: 10, label: 'Paper Trade Proposal Preview',   icon: '📋', system: 'Proposal Engine',  note: 'NOT_EXECUTED · NO_ORDER_CREATED' },
];

export const SAMPLE_MNQ_PAYLOAD = {
  symbol:          'MNQ1!',
  timeframe:       '5m',
  side:            'LONG',
  signalName:      'EMA_2_25_200_MACD_BULL',
  price:           18450.25,
  barTime:         '2026-05-20T14:35:00Z',
  strategyVersion: 'v1.2.0',
  rawMessage:      'MNQ1! 5m EMA2>EMA25>EMA200 MACD+HIST>0 LONG @ 18450.25',
  sessionName:     'US_REGULAR',
  screenshotReference: 'mnq_5m_20260520_1435_ema_macd_long',
};

export function computeSignalScore(checklist) {
  const passed = Object.values(checklist).filter(Boolean).length;
  const total  = CHECKLIST_ITEMS.length;
  return { passed, total, score: Math.round((passed / total) * 10) };
}

export function scoreToRiskLevel(score) {
  if (score >= 8) return 'LOW';
  if (score >= 6) return 'MEDIUM';
  if (score >= 4) return 'HIGH';
  return 'CRITICAL';
}

export function scoreToBand(score) {
  if (score >= 10) return '10';
  if (score >= 8)  return '8-9';
  if (score >= 6)  return '6-7';
  if (score >= 4)  return '4-5';
  return '0-3';
}

export function generatePreviewId() {
  return `VTVCPM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateAuditHash(payload, score) {
  const str = JSON.stringify({ payload, score, ts: Date.now() });
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
  return `VTVC-AH-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}