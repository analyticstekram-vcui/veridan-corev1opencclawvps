/**
 * OpenClaw Capability Registry
 * Single source of truth for all permitted capabilities.
 * Backend mirror is in functions/openclawExecutionBridge.js
 */

export const CAPABILITY_REGISTRY = [
  {
    id: 'system.status',
    name: 'System Status',
    description: 'Query the current health and operational status of the OpenClaw gateway.',
    commandType: 'query',
    riskLevel: 'low',
    requiredScopes: ['vcm', 'gfm_admin', 'genesis_trust'],
    parameters: [],
  },
  {
    id: 'logs.fetch',
    name: 'Fetch Logs',
    description: 'Retrieve recent log entries from the OpenClaw gateway.',
    commandType: 'query',
    riskLevel: 'low',
    requiredScopes: ['vcm', 'gfm_admin'],
    parameters: [
      { key: 'limit', label: 'Limit', type: 'number', required: false, default: 50, description: 'Max log lines to return (1–500)' },
      { key: 'level', label: 'Log Level', type: 'select', required: false, default: 'info', options: ['debug', 'info', 'warn', 'error'], description: 'Minimum severity level' },
    ],
  },
  {
    id: 'session.list',
    name: 'List Sessions',
    description: 'List active browser sessions managed by OpenClaw.',
    commandType: 'query',
    riskLevel: 'medium',
    requiredScopes: ['gfm_admin'],
    parameters: [],
  },
  {
    id: 'browser.open',
    name: 'Open Browser',
    description: 'Open a new browser session navigating to a URL.',
    commandType: 'action',
    riskLevel: 'medium',
    requiredScopes: ['gfm_admin'],
    parameters: [
      { key: 'url', label: 'URL', type: 'text', required: true, description: 'Target URL to open (must start with https://)' },
      { key: 'headless', label: 'Headless', type: 'boolean', required: false, default: true, description: 'Run in headless mode' },
    ],
  },
  {
    id: 'browser.click',
    name: 'Browser Click',
    description: 'Click a DOM element within an active browser session.',
    commandType: 'action',
    riskLevel: 'medium',
    requiredScopes: ['gfm_admin'],
    parameters: [
      { key: 'sessionId', label: 'Session ID', type: 'text', required: true, description: 'Active session identifier' },
      { key: 'selector', label: 'CSS Selector', type: 'text', required: true, description: 'CSS selector of the element to click' },
    ],
  },
  {
    id: 'browser.type',
    name: 'Browser Type',
    description: 'Type text into a DOM element within an active browser session.',
    commandType: 'action',
    riskLevel: 'medium',
    requiredScopes: ['gfm_admin'],
    parameters: [
      { key: 'sessionId', label: 'Session ID', type: 'text', required: true, description: 'Active session identifier' },
      { key: 'selector', label: 'CSS Selector', type: 'text', required: true, description: 'CSS selector of the input element' },
      { key: 'value', label: 'Text Value', type: 'text', required: true, description: 'Text to type (sensitive values will be redacted in audit log)' },
    ],
  },
  {
    id: 'workflow.run',
    name: 'Run Workflow',
    description: 'Trigger a named automation workflow in OpenClaw.',
    commandType: 'action',
    riskLevel: 'high',
    requiredScopes: [],
    parameters: [
      { key: 'workflowId', label: 'Workflow ID', type: 'text', required: true, description: 'Registered workflow identifier' },
      { key: 'payload', label: 'Payload (JSON)', type: 'json', required: false, description: 'Optional JSON payload passed to the workflow' },
    ],
  },
];

// Map by id for O(1) lookup
export const CAPABILITY_MAP = Object.fromEntries(CAPABILITY_REGISTRY.map(c => [c.id, c]));

// Sanitize parameters for audit log — redact sensitive keys
const SENSITIVE_KEYS = ['value', 'password', 'token', 'secret', 'key'];
export function sanitizeParams(params) {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) =>
      SENSITIVE_KEYS.includes(k.toLowerCase()) ? [k, '[REDACTED]'] : [k, v]
    )
  );
}

// Validate params against capability schema — returns array of error strings
export function validateParams(capability, params) {
  const errors = [];
  for (const p of capability.parameters) {
    if (p.required && (params[p.key] === undefined || params[p.key] === '')) {
      errors.push(`'${p.label}' is required.`);
    }
    if (p.type === 'number' && params[p.key] !== undefined && params[p.key] !== '') {
      const n = Number(params[p.key]);
      if (isNaN(n)) errors.push(`'${p.label}' must be a number.`);
    }
    if (p.type === 'json' && params[p.key]) {
      try { JSON.parse(params[p.key]); } catch { errors.push(`'${p.label}' must be valid JSON.`); }
    }
  }
  return errors;
}