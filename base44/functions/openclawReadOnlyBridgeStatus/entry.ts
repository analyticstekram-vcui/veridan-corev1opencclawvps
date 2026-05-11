import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Read-only command allowlist ──────────────────────────────────────────
const READ_ONLY_ALLOWLIST = {
  'system.status': { description: 'Query OpenClaw bridge operational status' },
  'logs.fetch':    { description: 'Fetch diagnostic logs from bridge' },
  'session.list':  { description: 'List active browser sessions' },
};

// ── Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized', status: 'BLOCKED', mode: 'SIMULATED' }, { status: 401 });

    const { command } = await req.json();
    if (!command) {
      return Response.json({
        ok: false,
        status: 'BLOCKED',
        reason: 'command parameter required',
        mode: 'SIMULATED',
        traceId: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    }

    // ── Check allowlist ─────────────────────────────────────────────────
    if (!READ_ONLY_ALLOWLIST[command]) {
      return Response.json({
        ok: false,
        status: 'BLOCKED',
        command,
        reason: `Command '${command}' is not in the read-only allowlist`,
        mode: 'SIMULATED',
        traceId: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    }

    // ── Simulate command execution (no mutations, no live execution) ──────
    await new Promise(r => setTimeout(r, 100));

    return Response.json({
      ok: true,
      status: 'PASS',
      command,
      mode: 'SIMULATED',
      traceId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      data: {},
    }, { status: 200 });

  } catch (error) {
    return Response.json({
      ok: false,
      status: 'BLOCKED',
      reason: error.message,
      mode: 'SIMULATED',
      traceId: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
});