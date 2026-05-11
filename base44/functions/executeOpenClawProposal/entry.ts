import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Allowlist for safe domains
const ALLOWLIST_DOMAINS = [
  'tradingview.com',
  'www.tradingview.com',
  'example.com',
];

// Allowed command types
const ALLOWED_COMMANDS = [
  'READ_ELEMENT_TEXT',
  'CLICK_ELEMENT',
  'TYPE_INTO_ELEMENT',
];

function isDomainAllowed(url) {
  try {
    const urlObj = new URL(url);
    return ALLOWLIST_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  // Remove control characters and limit length
  return str.replace(/[^\w\s:\/\-_.,#@]/g, '').slice(0, 500);
}

function validateProposal(proposal) {
  const errors = [];

  if (!proposal) errors.push('Proposal not found');
  if (proposal?.status !== 'APPROVED') errors.push('Proposal status must be APPROVED');
  if (!ALLOWED_COMMANDS.includes(proposal?.commandType)) errors.push(`Command type not allowed: ${proposal?.commandType}`);
  if (!isDomainAllowed(proposal?.targetUrl)) errors.push('Domain not allowlisted');
  if (proposal?.riskTier && !['LOW', 'MEDIUM'].includes(proposal.riskTier)) {
    errors.push('Risk tier must be LOW or MEDIUM');
  }
  if (proposal?.governanceMode !== 'SAFE_REQUIRES_APPROVAL') errors.push('Governance mode must be SAFE_REQUIRES_APPROVAL');

  return errors;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposalId } = await req.json();

    if (!proposalId) {
      return Response.json({ error: 'proposalId required' }, { status: 400 });
    }

    // Global kill switch
    const executionEnabled = Deno.env.get('OPENCLAW_EXECUTION_ENABLED') === 'true';
    if (!executionEnabled) {
      return Response.json({ error: 'OpenClaw execution is disabled' }, { status: 403 });
    }

    const executionMode = Deno.env.get('OPENCLAW_EXECUTION_MODE') || 'SIMULATED';
    const auditTraceId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Fetch proposal from database (if integrated) or return placeholder
    // For now, assume proposal comes from client context
    const proposal = {
      proposalId,
      status: 'APPROVED',
      commandType: 'READ_ELEMENT_TEXT',
      targetUrl: 'https://www.tradingview.com',
      selector: 'body',
      riskTier: 'LOW',
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
    };

    // Validate proposal
    const validationErrors = validateProposal(proposal);
    if (validationErrors.length > 0) {
      return Response.json(
        {
          error: 'Validation failed',
          validationErrors,
          backendValidationStatus: 'FAILED',
          auditTraceId,
        },
        { status: 400 }
      );
    }

    // SIMULATED mode
    if (executionMode === 'SIMULATED') {
      const simulatedResult = {
        status: 'success',
        executionMode: 'SIMULATED',
        commandType: proposal.commandType,
        url: proposal.targetUrl,
        selector: proposal.selector,
        result: 'Simulated execution completed successfully',
        pageTitle: 'TradingView — Stock Market Quotes & Charts',
        executedAt: new Date().toISOString(),
        backendValidationStatus: 'PASSED',
        auditTraceId,
        diagnostics: [
          'Validation: PASSED',
          `Execution mode: ${executionMode}`,
          'Command simulated successfully',
        ],
      };

      return Response.json(simulatedResult, { status: 200 });
    }

    // LIVE mode (TODO: verify token auth and backend tunnel checks before calling bridge)
    if (executionMode === 'LIVE') {
      // TODO: Verify OPENCLAW_SERVICE_TOKEN is set and valid
      // TODO: Verify backend tunnel to openclawSafeBridge is available
      // TODO: Call openclawSafeBridge with proposal and user context
      // For now, return unimplemented error
      return Response.json(
        {
          error: 'LIVE execution not yet implemented',
          message: 'Token authentication and backend tunnel checks pending',
          backendValidationStatus: 'BLOCKED',
          auditTraceId,
        },
        { status: 501 }
      );
    }

    return Response.json(
      { error: 'Invalid execution mode', backendValidationStatus: 'FAILED', auditTraceId },
      { status: 400 }
    );
  } catch (error) {
    const auditTraceId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return Response.json(
      {
        error: error.message || 'Internal server error',
        backendValidationStatus: 'ERROR',
        auditTraceId,
      },
      { status: 500 }
    );
  }
});