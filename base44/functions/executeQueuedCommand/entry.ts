import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Process a queued execution item ───────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (req.method === 'GET') {
    return Response.json({ message: 'Use POST to execute a command' });
  }

  let body;
  try { body = await req.json(); } catch (_) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { queueId } = body;
  if (!queueId) {
    return Response.json({ error: 'queueId is required' }, { status: 400 });
  }

  try {
    // Fetch the queue entry
    const queueEntries = await base44.entities.ExecutionQueue.filter({ id: queueId });
    if (!queueEntries || queueEntries.length === 0) {
      return Response.json({ error: 'Queue entry not found' }, { status: 404 });
    }

    const entry = queueEntries[0];

    // Only allow transitions from QUEUED or READY
    if (!['QUEUED', 'READY'].includes(entry.status)) {
      return Response.json({
        error: `Cannot execute from status ${entry.status}. Must be QUEUED or READY.`,
      }, { status: 400 });
    }

    // Validate command type against schema enum
    const VALID_COMMAND_TYPES = ['CLICK_ELEMENT', 'TYPE_INTO_ELEMENT', 'READ_ELEMENT_TEXT'];
    if (!VALID_COMMAND_TYPES.includes(entry.commandType)) {
      const blockedAt = new Date().toISOString();
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'BLOCKED',
        error: `Unsupported command type: ${entry.commandType}. Valid types: ${VALID_COMMAND_TYPES.join(', ')}`,
        diagnosticsSummary: [`command_type_validation_failed: ${entry.commandType} not in schema enum`],
      });
      return Response.json({
        success: false,
        queueId,
        status: 'BLOCKED',
        error: `Unsupported command type: ${entry.commandType}`,
      }, { status: 400 });
    }

    // Validate required fields for TYPE_INTO_ELEMENT
    if (entry.commandType === 'TYPE_INTO_ELEMENT' && !entry.selector) {
      const blockedAt = new Date().toISOString();
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'BLOCKED',
        error: 'TYPE_INTO_ELEMENT requires selector field',
        diagnosticsSummary: ['validation_failed: selector missing for TYPE_INTO_ELEMENT'],
      });
      return Response.json({
        success: false,
        queueId,
        status: 'BLOCKED',
        error: 'TYPE_INTO_ELEMENT requires selector field',
      }, { status: 400 });
    }

    // Validate required fields for CLICK_ELEMENT
    if (entry.commandType === 'CLICK_ELEMENT' && !entry.selector) {
      const blockedAt = new Date().toISOString();
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'BLOCKED',
        error: 'CLICK_ELEMENT requires selector field',
        diagnosticsSummary: ['validation_failed: selector missing for CLICK_ELEMENT'],
      });
      return Response.json({
        success: false,
        queueId,
        status: 'BLOCKED',
        error: 'CLICK_ELEMENT requires selector field',
      }, { status: 400 });
    }

    // Update status to READY if still QUEUED
    if (entry.status === 'QUEUED') {
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'READY',
      });
    }

    // TODO: Call safe bridge with command details
    // For now, simulate execution
    const executedAt = new Date().toISOString();
    const resultSummary = `Executed ${entry.commandType} on ${entry.url}`;
    const diags = [
      `governance_mode: ${entry.governanceMode || 'SAFE_REQUIRES_APPROVAL'}`,
      `command_type: ${entry.commandType}`,
      `risk_tier: ${entry.riskTier || 'LOW'}`,
      'execution_simulated: REAL bridge integration pending',
    ];

    // Mark as EXECUTED
    await base44.entities.ExecutionQueue.update(queueId, {
      status: 'EXECUTED',
      executedAt,
      resultSummary,
      diagnosticsSummary: diags,
    });

    return Response.json({
      success: true,
      queueId,
      status: 'EXECUTED',
      executedAt,
      resultSummary,
      diagnostics: diags,
    });
  } catch (err) {
    // Mark as FAILED
    try {
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'FAILED',
        error: err.message,
        diagnosticsSummary: [`execution_error: ${err.message}`],
      });
    } catch (_) {}

    return Response.json({
      success: false,
      error: err.message,
      queueId,
    }, { status: 500 });
  }
});