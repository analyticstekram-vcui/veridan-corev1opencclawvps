import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { commandId } = await req.json();
    if (!commandId) return Response.json({ error: 'commandId required' }, { status: 400 });

    // --- prepareCommand ---
    const commands = await base44.entities.OpenClawCommand.filter({ id: commandId });
    const command = commands[0];
    if (!command) return Response.json({ error: 'Command not found' }, { status: 404 });

    // --- validateCommand ---
    if (command.status !== 'approved') {
      // Audit: blocked
      const auditLog = Array.isArray(command.auditLog) ? command.auditLog : [];
      await base44.entities.OpenClawCommand.update(commandId, {
        auditLog: [...auditLog, {
          eventType: 'OPENCLAW_EXECUTION_BLOCKED',
          reason: `Command status is '${command.status}', must be 'approved'`,
          triggeredBy: user.email,
          timestamp: new Date().toISOString(),
        }],
      });
      return Response.json({
        success: false,
        blocked: true,
        reason: `Command must be in 'approved' state. Current: '${command.status}'`,
        eventType: 'OPENCLAW_EXECUTION_BLOCKED',
      }, { status: 422 });
    }

    // --- simulateExecution (200ms delay, no real HTTP) ---
    const simStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 200));
    const latency = Date.now() - simStart;
    const timestamp = new Date().toISOString();

    const result = {
      success: true,
      simulated: true,
      latency,
      timestamp,
      commandId,
      commandText: command.commandText,
      target: command.target || 'OpenClaw Gateway',
      executedBy: user.email,
    };

    // --- logExecutionResult + update status ---
    const auditLog = Array.isArray(command.auditLog) ? command.auditLog : [];
    await base44.entities.OpenClawCommand.update(commandId, {
      status: 'executed',
      notes: (command.notes ? command.notes + '\n' : '') +
        `[SIMULATED] Executed at ${timestamp} · latency ${latency}ms · by ${user.email}`,
      auditLog: [...auditLog, {
        eventType: 'OPENCLAW_EXECUTION_SIMULATED',
        result,
        triggeredBy: user.email,
        timestamp,
      }],
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});