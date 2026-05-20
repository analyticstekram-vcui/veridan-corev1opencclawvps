/**
 * tvMcpContracts.js
 * Static governance configuration for the TradingView MCP Bridge.
 * Phase 2: Local Relay Simulation
 * Read-only mode. No trading. No broker. No credentials. No execution.
 */

export const BRIDGE_CONTRACT = {
  bridge: 'TRADINGVIEW_MCP_BRIDGE',
  phase: 'PHASE_2_LOCAL_RELAY_SIMULATION',
  mode: 'READ_ONLY',
  allowedCommands: ['status', 'quote', 'ohlcv', 'values', 'screenshot', 'ui-state', 'discover'],
  blockedCommands: ['trade', 'order', 'broker', 'login', 'credential', 'password', 'withdraw', 'deposit'],
  executionAllowed: false,
  relayStatus: 'NOT_CONNECTED_TO_LIVE_BACKEND',
  localPath: 'C:\\Users\\peter\\tradingview-mcp',
  cliFormat: 'npm run tv -- <command>',
  backendEndpoint: 'tradingViewMcpBridge',
  executionMode: 'LOCAL_OPERATOR_ONLY',
};

export const RELAY_PATH = {
  step1: { label: 'Veridan Core UI',      detail: 'User selects command in TradingView MCP Bridge panel' },
  step2: { label: 'Backend Endpoint',     detail: 'tradingViewMcpBridge (Deno serverless function)' },
  step3: { label: 'Local Relay Agent',    detail: 'HTTP relay agent on local machine (not yet wired)' },
  step4: { label: 'CLI Execution',        detail: 'npm run tv -- <command> in C:\\Users\\peter\\tradingview-mcp' },
  step5: { label: 'MCP Server',           detail: 'Local TradingView MCP server via CDP' },
  step6: { label: 'Response Normalizer',  detail: 'Normalizes stdout → structured JSON payload' },
  step7: { label: 'Audit Log',            detail: 'Stored in localStorage key: tradingViewMcpBridgeRelayAudit' },
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

/** Manually verified terminal results from local MCP CLI runs */
export const KNOWN_MCP_RESULTS = [
  {
    command: 'status',
    riskClass: 'SAFE_READ',
    verified: true,
    summary: 'success true, cdp_connected true, api_available true',
    detail: {
      success: true,
      cdp_connected: true,
      api_available: true,
      chart_symbol: 'CME_MINI_DL:MNQH2026',
      chart_resolution: '240',
    },
    note: 'MCP server online, CDP bridge active, chart loaded.',
  },
  {
    command: 'quote',
    riskClass: 'SAFE_READ',
    verified: true,
    summary: 'success true, symbol CME_MINI_DL:MNQH2026',
    detail: {
      success: true,
      symbol: 'CME_MINI_DL:MNQH2026',
      price: '<live_value>',
      change: '<live_value>',
    },
    note: 'Quote data returned from active chart. Price value is live — shown as placeholder here.',
  },
  {
    command: 'screenshot',
    riskClass: 'SAFE_READ',
    verified: true,
    summary: 'success true, file saved locally',
    detail: {
      success: true,
      filePath: 'C:\\Users\\peter\\tradingview-mcp\\screenshots\\<timestamp>.png',
      savedLocally: true,
    },
    note: 'Screenshot saved to local disk. No image data transmitted to cloud.',
  },
  {
    command: 'values',
    riskClass: 'SAFE_READ',
    verified: true,
    summary: 'success true, study values detected',
    detail: {
      success: true,
      indicators: ['EMA_2', 'EMA_25', 'EMA_200', 'MACD'],
      valuesDetected: true,
    },
    note: 'Indicator values read from active chart. EMA/MACD configuration confirmed.',
  },
  {
    command: 'info',
    riskClass: 'REVIEW_REQUIRED',
    verified: true,
    summary: 'REVIEW_REQUIRED — evaluate is not defined',
    detail: {
      success: false,
      error: 'evaluate is not defined',
      classification: 'REVIEW_REQUIRED',
    },
    note: 'Upstream MCP CLI bug. Not a bridge failure. Classified REVIEW_REQUIRED by governance policy.',
  },
];

/** Normalized result shape contract */
export const RESULT_NORMALIZATION_SCHEMA = {
  success:            'boolean — true if command ran without error',
  command:            'string — command name (e.g. status, quote)',
  symbol:             'string | null — active chart symbol if available',
  resolution:         'string | null — chart resolution if available',
  timestamp:          'ISO8601 string — when response was generated',
  payload:            'object — raw command output from MCP CLI',
  riskClass:          'SAFE_READ | REVIEW_REQUIRED | BLOCKED',
  executionStatus:    'NOT_EXECUTED — always fixed in simulation mode',
  auditId:            'string — unique TVMCP-XXXXX-YYY identifier',
  reviewedByOperator: 'boolean — true after operator confirms result in audit log',
};

export const VERIFICATION_CHECKLIST = [
  // Phase 1 — existing checks
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
  // Phase 2 — relay simulation checks
  { id: 'TVMCP-15', label: 'Relay remains simulation only — no live subprocess' },
  { id: 'TVMCP-16', label: 'No broker commands in relay path' },
  { id: 'TVMCP-17', label: 'No trade placement in relay simulation' },
  { id: 'TVMCP-18', label: 'No credentials requested or stored at any relay stage' },
  { id: 'TVMCP-19', label: 'Command allowlist enforced in backend and relay adapter' },
  { id: 'TVMCP-20', label: 'Manual terminal proof captured — status/quote/screenshot/values verified' },
  { id: 'TVMCP-21', label: 'Info error classified REVIEW_REQUIRED in relay normalizer' },
  { id: 'TVMCP-22', label: 'Chart intelligence ready for read-only Veridan Core ingestion' },
];

export const AUDIT_LOG_KEY = 'tradingViewMcpBridgeRelayAudit';

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