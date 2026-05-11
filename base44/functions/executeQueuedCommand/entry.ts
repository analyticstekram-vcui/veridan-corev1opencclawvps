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

    // Update status to READY
    if (entry.status === 'QUEUED') {
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'READY',
      });
    }

    // TODO: Call safe bridge with command details
    // For now, simulate execution
    const executedAt = new Date().toISOString();
    const resultSummary = `Executed ${entry.commandType} on ${entry.url}`;

    // Mark as EXECUTED
    await base44.entities.ExecutionQueue.update(queueId, {
      status: 'EXECUTED',
      executedAt,
      resultSummary,
      diagnosticsSummary: ['execution_simulated: REAL bridge integration pending'],
    });

    return Response.json({
      success: true,
      queueId,
      status: 'EXECUTED',
      executedAt,
      resultSummary,
    });
  } catch (err) {
    // Mark as FAILED
    try {
      await base44.entities.ExecutionQueue.update(queueId, {
        status: 'FAILED',
        error: err.message,
        diagnosticsSummary: [err.message],
      });
    } catch (_) {}

    return Response.json({
      error: err.message,
      queueId,
    }, { status: 500 });
  }
});