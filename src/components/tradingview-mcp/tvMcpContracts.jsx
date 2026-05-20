/**
 * tvMcpContracts.js
 * Static governance configuration for the TradingView MCP Bridge.
 * Read-only mode. No trading. No broker. No credentials. No execution.
 */

export const BRIDGE_CONTRACT = {
  bridge: 'TRADINGVIEW_MCP_BRIDGE',
  mode: 'READ_ONLY',
  allowedCommands: ['status', 'quote', 'ohlcv', 'values', 'screenshot', 'ui-state', 'discover'],
  blockedCommands: ['trade', 'order', 'broker', 'login', 'credential', 'password', 'withdraw', 'deposit'],
  executionAllowed: false,
};

export const FIXED_STATUSES = {
  BRIDGE_MODE:        'READ_ONLY',
  EXECUTION:          'DISABLED',
  LIVE_TRADING:       'DISABLED',
  ORDER_PLACEMENT:    'DISABLED',
  BROKER_CONNECT:     'DISABLED',
  CREDENTIAL_STORAGE: 'DISABLED',
  FUND_MOVEMENT:      'DISABLED',
  MUTATION:           'DISABLED',
};

export const GUARDRAILS = [
  'Read-only mode — no mutation',
  'No trade or order placement',
  'No broker credentials',
  'No fund movement',
  'No live execution',
];

export const COMMANDS = [
  {
    id: 'status',
    label: 'Check Status',
    description: 'Returns MCP server status, CDP connection, API availability, chart symbol and resolution.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- status',
  },
  {
    id: 'quote',
    label: 'Get Quote',
    description: 'Returns current quote data for the active chart symbol.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- quote',
  },
  {
    id: 'ohlcv',
    label: 'Get OHLCV',
    description: 'Returns OHLCV candlestick data for the active chart.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- ohlcv',
  },
  {
    id: 'values',
    label: 'Get Indicator Values',
    description: 'Returns current indicator values loaded on the chart.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- values',
  },
  {
    id: 'screenshot',
    label: 'Capture Screenshot',
    description: 'Captures a screenshot of the current TradingView chart.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- screenshot',
  },
  {
    id: 'ui-state',
    label: 'Get UI State',
    description: 'Returns the current UI state of the TradingView browser window.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- ui-state',
  },
  {
    id: 'discover',
    label: 'Discover API Paths',
    description: 'Discovers available API paths and methods from the TradingView MCP server.',
    risk: 'SAFE_READ',
    cli: 'npm run tv -- discover',
  },
  {
    id: 'info',
    label: 'Info (Review Required)',
    description: 'Known issue: returns "evaluate is not defined". Classified REVIEW_REQUIRED, not bridge failure.',
    risk: 'REVIEW_REQUIRED',
    cli: 'npm run tv -- info',
    knownIssue: 'evaluate is not defined — upstream MCP CLI bug. Not a bridge failure.',
  },
];

export const RISK_META = {
  SAFE_READ: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    label: 'SAFE_READ',
  },
  REVIEW_REQUIRED: {
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    label: 'REVIEW_REQUIRED',
  },
  BLOCKED: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    label: 'BLOCKED',
  },
};

export const VERIFICATION_CHECKLIST = [
  { id: 'TVMCP-01', label: 'Module exists' },
  { id: 'TVMCP-02', label: 'Connection status panel exists' },
  { id: 'TVMCP-03', label: 'Command test panel exists' },
  { id: 'TVMCP-04', label: 'Result viewer exists' },
  { id: 'TVMCP-05', label: 'Local audit log exists' },
  { id: 'TVMCP-06', label: 'Blocked command list exists' },
  { id: 'TVMCP-07', label: 'Execution disabled' },
  { id: 'TVMCP-08', label: 'No credentials stored' },
  { id: 'TVMCP-09', label: 'No broker/order logic' },
  { id: 'TVMCP-10', label: 'Screenshot command supported' },
  { id: 'TVMCP-11', label: 'Quote command supported' },
  { id: 'TVMCP-12', label: 'OHLCV command supported' },
  { id: 'TVMCP-13', label: 'Indicator values command supported' },
  { id: 'TVMCP-14', label: 'Info command classified REVIEW_REQUIRED (evaluate error)' },
];

export const AUDIT_LOG_KEY = 'tvmcp_audit_log';

export function generateAuditId() {
  return `TVMCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function loadAuditLog() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAuditEntry(entry) {
  try {
    const existing = loadAuditLog();
    const updated = [entry, ...existing].slice(0, 200);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}