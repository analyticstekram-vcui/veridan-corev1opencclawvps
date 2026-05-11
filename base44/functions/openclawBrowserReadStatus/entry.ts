import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ACTIONS = [
  'page.url.read',
  'page.title.read',
  'browser.read',
  'dom.text.extract',
  'element.inspect.snapshot',
  'browser.screenshot.metadata',
];

function generateTraceId() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function executeAction(action, selector) {
  const traceId = generateTraceId();
  const timestamp = new Date().toISOString();

  // Simulated read-only responses
  const responses = {
    'page.url.read': {
      ok: true,
      status: 'PASS',
      action: 'page.url.read',
      mode: 'SIMULATED',
      riskTier: 'LOW',
      traceId,
      timestamp,
      result: {
        url: 'https://www.tradingview.com/chart/AAPL',
        protocol: 'https',
        hostname: 'www.tradingview.com',
        pathname: '/chart/AAPL',
      },
    },
    'page.title.read': {
      ok: true,
      status: 'PASS',
      action: 'page.title.read',
      mode: 'SIMULATED',
      riskTier: 'LOW',
      traceId,
      timestamp,
      result: {
        title: 'TradingView Chart - Apple Inc. (AAPL)',
      },
    },
    'browser.read': {
      ok: true,
      status: 'PASS',
      action: 'browser.read',
      mode: 'SIMULATED',
      riskTier: 'LOW',
      traceId,
      timestamp,
      result: {
        sessionId: `session-${traceId}`,
        isActive: true,
        currentUrl: 'https://www.tradingview.com/chart/AAPL',
        pageTitle: 'TradingView Chart - Apple Inc. (AAPL)',
        viewportWidth: 1920,
        viewportHeight: 1080,
      },
    },
    'dom.text.extract': {
      ok: true,
      status: 'PASS',
      action: 'dom.text.extract',
      mode: 'SIMULATED',
      riskTier: 'LOW',
      traceId,
      timestamp,
      result: {
        visibleTextLength: 2847,
        textSnapshot: '[Truncated] TradingView Chart - Apple Inc... (full text extraction limited to 1000 chars)',
        elementCount: 156,
        headings: ['TradingView', 'Chart Details', 'Market Data'],
      },
    },
    'element.inspect.snapshot': {
      ok: true,
      status: 'PASS',
      action: 'element.inspect.snapshot',
      mode: 'SIMULATED',
      riskTier: 'LOW',
      traceId,
      timestamp,
      result: {
        selector: selector || '[unspecified]',
        found: selector ? true : false,
        tagName: selector ? 'div' : null,
        className: selector ? 'chart-container' : null,
        attributes: selector ? { 'data-chart-id': 'aapl-1d' } : null,
        innerText: selector ? '[Chart widget content]' : null,
        boundingBox: selector ? { x: 0, y: 100, width: 1920, height: 980 } : null,
      },
    },
    'browser.screenshot.metadata': {
      ok: true,
      status: 'PASS',
      action: 'browser.screenshot.metadata',
      mode: 'SIMULATED',
      riskTier: 'LOW',
      traceId,
      timestamp,
      result: {
        screenshotTaken: true,
        timestamp,
        dimensions: { width: 1920, height: 1080 },
        format: 'png',
        sizeMB: 0.523,
        url: '[Screenshot stored in secure storage - URL redacted]',
      },
    },
  };

  return responses[action] || {
    ok: false,
    status: 'BLOCKED',
    action,
    mode: 'SIMULATED',
    riskTier: 'LOW',
    traceId,
    timestamp,
    error: `Action "${action}" not in allowlist`,
    errorCategory: 'ACTION_NOT_ALLOWED',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, selector } = body;

    // Validate action is in allowlist
    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return Response.json({
        ok: false,
        status: 'BLOCKED',
        action: action || 'unknown',
        mode: 'SIMULATED',
        riskTier: 'LOW',
        traceId: `audit-${Date.now()}-blocked`,
        timestamp: new Date().toISOString(),
        error: `Action "${action}" not allowed`,
        errorCategory: 'ACTION_NOT_ALLOWED',
        allowedActions: ALLOWED_ACTIONS,
      });
    }

    // Execute the read action
    const result = await executeAction(action, selector);

    return Response.json(result);
  } catch (error) {
    return Response.json({
      error: error.message,
      status: 'ERROR',
    }, { status: 500 });
  }
});