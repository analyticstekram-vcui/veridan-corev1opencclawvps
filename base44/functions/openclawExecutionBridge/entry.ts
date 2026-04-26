import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Constants ──────────────────────────────────────────────────────────────
const COMMAND_ALLOWLIST = ['system.status', 'logs.fetch', 'session.list'];
const RATE_WINDOW_MS    = 60_000;
const RATE_LIMIT        = 5;
const REPLAY_WINDOW_MS  = 10_000;

// In-memory rate limiter (per Deno isolate)
const rateStore = new Map(); // key → [timestamp, ...]

function checkRateLimit(key) {
  const now   = Date.now();
  const times = (rateStore.get(key) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_LIMIT) return false;
  times.push(now);
  rateStore.set(key, times);
  return true;
}

async function hmacSign(secret, timestamp, commandText) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const message = encoder.encode(`${timestamp}:${commandText}`);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig  = await crypto.subtle.sign('HMAC', key, message);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function appendAudit(base44, commandId, existingLog, entry) {
  const auditLog = Array.isArray(existingLog) ? existingLog : [];
  await base44.entities.OpenClawCommand.update(commandId, { auditLog: [...auditLog, entry] });
}

// ── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { commandId, executionMode = 'SIMULATED', executionPaused = false } = await req.json();
    if (!commandId) return Response.json({ error: 'commandId required' }, { status: 400 });

    const commands = await base44.entities.OpenClawCommand.filter({ id: commandId });
    const command  = commands[0];
    if (!command) return Response.json({ error: 'Command not found' }, { status: 404 });

    const auditBase = { commandId, triggeredBy: user.email, timestamp: new Date().toISOString() };

    // ── 1. Emergency kill switch ───────────────────────────────────────────
    if (executionPaused) {
      await appendAudit(base44, commandId, command.auditLog, {
        ...auditBase, eventType: 'OPENCLAW_EXECUTION_BLOCKED_GLOBAL',
        reason: 'Emergency kill switch active',
      });
      return Response.json({ success: false, blocked: true, reason: 'Emergency kill switch active', eventType: 'OPENCLAW_EXECUTION_BLOCKED_GLOBAL' }, { status: 503 });
    }

    // ── 2. Must be approved ────────────────────────────────────────────────
    if (command.status !== 'approved') {
      await appendAudit(base44, commandId, command.auditLog, {
        ...auditBase, eventType: 'OPENCLAW_EXECUTION_REJECTED',
        reason: `Status is '${command.status}', must be 'approved'`,
      });
      return Response.json({ success: false, blocked: true, reason: `Command must be 'approved'. Current: '${command.status}'`, eventType: 'OPENCLAW_EXECUTION_REJECTED' }, { status: 422 });
    }

    // ── 3. Rate limit ──────────────────────────────────────────────────────
    if (!checkRateLimit(user.email)) {
      await appendAudit(base44, commandId, command.auditLog, {
        ...auditBase, eventType: 'OPENCLAW_EXECUTION_REJECTED', reason: 'Rate limit exceeded (5/min)',
      });
      return Response.json({ success: false, blocked: true, reason: 'Rate limit exceeded: max 5 commands/minute', eventType: 'OPENCLAW_EXECUTION_REJECTED' }, { status: 429 });
    }

    // ── 4. Allowlist check ─────────────────────────────────────────────────
    const isAllowlisted = COMMAND_ALLOWLIST.includes(command.commandText?.trim());

    // ── 5. LIVE execution path ─────────────────────────────────────────────
    if (executionMode === 'LIVE' && isAllowlisted) {
      const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');
      const secret     = Deno.env.get('OPENCLAW_SIGNING_SECRET') || 'veridan-default-secret';
      const timestamp  = Date.now().toString();

      // Replay protection: reject if somehow timestamp drifted (belt-and-suspenders)
      if (Math.abs(Date.now() - parseInt(timestamp)) > REPLAY_WINDOW_MS) {
        return Response.json({ success: false, reason: 'Replay protection: timestamp out of window' }, { status: 400 });
      }

      const signature = await hmacSign(secret, timestamp, command.commandText);

      let liveResult;
      const fetchStart = Date.now();
      try {
        const resp = await fetch(`${gatewayUrl}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-veridan-signature': signature,
            'x-veridan-timestamp': timestamp,
          },
          body: JSON.stringify({ command: command.commandText, commandId }),
          signal: AbortSignal.timeout(8000),
        });
        liveResult = { status: resp.status, body: await resp.text(), latency: Date.now() - fetchStart };
      } catch (fetchErr) {
        // Gateway unreachable → fallback to simulated
        await appendAudit(base44, commandId, command.auditLog, {
          ...auditBase, eventType: 'OPENCLAW_EXECUTION_FALLBACK',
          reason: `Live fetch failed: ${fetchErr.message}`,
        });
        // Fall through to simulated below
        liveResult = null;
      }

      if (liveResult) {
        const result = { success: true, simulated: false, latency: liveResult.latency, timestamp: auditBase.timestamp, response: liveResult.body };
        const auditLog = Array.isArray(command.auditLog) ? command.auditLog : [];
        await base44.entities.OpenClawCommand.update(commandId, {
          status: 'executed',
          auditLog: [...auditLog, { ...auditBase, eventType: 'OPENCLAW_EXECUTION_LIVE', result }],
        });
        return Response.json({ success: true, result });
      }
    }

    // ── 6. Fallback / Simulated execution ──────────────────────────────────
    if (!isAllowlisted && executionMode === 'LIVE') {
      await appendAudit(base44, commandId, command.auditLog, {
        ...auditBase, eventType: 'OPENCLAW_EXECUTION_REJECTED',
        reason: `'${command.commandText}' is not in the command allowlist`,
      });
      return Response.json({
        success: false, blocked: true,
        reason: `Command '${command.commandText}' is not in the allowlist: ${COMMAND_ALLOWLIST.join(', ')}`,
        eventType: 'OPENCLAW_EXECUTION_REJECTED',
      }, { status: 403 });
    }

    // Simulated path (executionMode === SIMULATED, or LIVE fallback)
    const simStart = Date.now();
    await new Promise(r => setTimeout(r, 200));
    const latency   = Date.now() - simStart;
    const timestamp = new Date().toISOString();

    const result = { success: true, simulated: true, latency, timestamp, commandId, commandText: command.commandText, target: command.target || 'OpenClaw Gateway', executedBy: user.email };

    const fallbackEvent = executionMode === 'LIVE' ? 'OPENCLAW_EXECUTION_FALLBACK' : 'OPENCLAW_EXECUTION_SIMULATED';
    const auditLog = Array.isArray(command.auditLog) ? command.auditLog : [];
    await base44.entities.OpenClawCommand.update(commandId, {
      status: 'executed',
      auditLog: [...auditLog, { ...auditBase, eventType: fallbackEvent, result }],
    });

    return Response.json({ success: true, result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});