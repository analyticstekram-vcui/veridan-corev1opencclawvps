import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Risk / Allowlist config ────────────────────────────────────────────────
const RISK_MAP = {
  'system.status': 'low',
  'logs.fetch':    'low',
  'session.list':  'medium',
};
const APPROVALS_REQUIRED = { low: 1, medium: 2, high: Infinity }; // high = blocked

// ── Scope policy (default deny) ────────────────────────────────────────────
const SCOPE_ALLOWLIST = {
  vcm:           ['system.status', 'logs.fetch'],
  gfm_admin:     ['system.status', 'logs.fetch', 'session.list'],
  genesis_trust: ['system.status'],
};
const SCOPE_RATE_WINDOW_MS = 60_000;
const SCOPE_RATE_LIMIT     = 3; // per entity per minute
const scopeRateStore       = new Map(); // `${scope}:${userEmail}` → [timestamps]

function checkScopeRateLimit(scope, userEmail) {
  const key   = `${scope}:${userEmail}`;
  const now   = Date.now();
  const times = (scopeRateStore.get(key) || []).filter(t => now - t < SCOPE_RATE_WINDOW_MS);
  if (times.length >= SCOPE_RATE_LIMIT) return false;
  times.push(now);
  scopeRateStore.set(key, times);
  return true;
}

// ── Rate limiter (in-memory per isolate) ──────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT     = 5;
const rateStore      = new Map();
function checkRateLimit(key) {
  const now   = Date.now();
  const times = (rateStore.get(key) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_LIMIT) return false;
  times.push(now);
  rateStore.set(key, times);
  return true;
}

// ── Cooldown tracker (per commandId) ─────────────────────────────────────
const COOLDOWN_MS   = 10_000;
const cooldownStore = new Map();
function checkCooldown(commandId) {
  const last = cooldownStore.get(commandId);
  if (last && Date.now() - last < COOLDOWN_MS) return false;
  cooldownStore.set(commandId, Date.now());
  return true;
}

// ── Circuit breaker (in-memory) ───────────────────────────────────────────
const CB_WINDOW_MS  = 30_000;
const CB_THRESHOLD  = 3;
const failureStore  = { times: [] };
let   circuitOpen   = false;
function recordFailure() {
  const now = Date.now();
  failureStore.times = failureStore.times.filter(t => now - t < CB_WINDOW_MS);
  failureStore.times.push(now);
  if (failureStore.times.length >= CB_THRESHOLD) { circuitOpen = true; }
}
function resetFailures() { failureStore.times = []; circuitOpen = false; }

// ── HMAC signing ──────────────────────────────────────────────────────────
async function hmacSign(secret, timestamp, commandText) {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}:${commandText}`));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Hash-chained audit append ──────────────────────────────────────────────
async function hashEntry(entry) {
  const data = new TextEncoder().encode(JSON.stringify(entry));
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function appendAudit(base44, command, entry) {
  const log      = Array.isArray(command.auditLog) ? command.auditLog : [];
  const prevHash = log.length > 0 ? (log[log.length - 1].hash || 'genesis') : 'genesis';
  const newEntry = { ...entry, prevHash };
  newEntry.hash  = await hashEntry(newEntry);
  await base44.entities.OpenClawCommand.update(command.id, { auditLog: [...log, newEntry] });
  return newEntry.hash;
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
    const reject = async (status, eventType, reason) => {
      recordFailure();
      await appendAudit(base44, command, { ...auditBase, eventType, reason });
      if (circuitOpen) {
        await appendAudit(base44, { ...command, auditLog: [...(command.auditLog || []) ] }, {
          ...auditBase, eventType: 'OPENCLAW_CIRCUIT_BREAKER_TRIGGERED',
          reason: `${CB_THRESHOLD} failures in ${CB_WINDOW_MS / 1000}s`,
        });
      }
      return Response.json({ success: false, blocked: true, reason, eventType, circuitOpen }, { status });
    };

    // ── 1. Emergency kill switch ───────────────────────────────────────────
    if (executionPaused || circuitOpen) {
      const evt = circuitOpen ? 'OPENCLAW_CIRCUIT_BREAKER_TRIGGERED' : 'OPENCLAW_EXECUTION_BLOCKED_GLOBAL';
      const why = circuitOpen ? 'Circuit breaker open — too many failures' : 'Emergency kill switch active';
      await appendAudit(base44, command, { ...auditBase, eventType: evt, reason: why });
      return Response.json({ success: false, blocked: true, reason: why, eventType: evt, circuitOpen }, { status: 503 });
    }

    // ── 2. Must be approved ────────────────────────────────────────────────
    if (command.status !== 'approved') {
      return reject(422, 'OPENCLAW_EXECUTION_REJECTED', `Status is '${command.status}', must be 'approved'`);
    }

    // ── 3. Scope guard (default deny) ─────────────────────────────────────
    const cmdText    = command.commandText?.trim();
    const entityScope = command.entityScope;
    if (!entityScope) {
      await appendAudit(base44, command, { ...auditBase, eventType: 'OPENCLAW_SCOPE_BLOCKED', reason: 'No entityScope set on command' });
      return Response.json({ success: false, blocked: true, reason: 'Command has no entityScope — blocked by default deny policy.', eventType: 'OPENCLAW_SCOPE_BLOCKED' }, { status: 403 });
    }
    const scopeAllowed = SCOPE_ALLOWLIST[entityScope] || [];
    if (!scopeAllowed.includes(cmdText)) {
      await appendAudit(base44, command, { ...auditBase, eventType: 'OPENCLAW_SCOPE_BLOCKED', reason: `'${cmdText}' not permitted under scope '${entityScope}'`, entityScope });
      return Response.json({ success: false, blocked: true, reason: `'${cmdText}' is not permitted under scope '${entityScope}'. Allowed: ${scopeAllowed.join(', ') || 'none'}.`, eventType: 'OPENCLAW_SCOPE_BLOCKED' }, { status: 403 });
    }
    if (!checkScopeRateLimit(entityScope, user.email)) {
      await appendAudit(base44, command, { ...auditBase, eventType: 'OPENCLAW_SCOPE_BLOCKED', reason: `Scope rate limit hit: ${SCOPE_RATE_LIMIT}/min for '${entityScope}'`, entityScope });
      return Response.json({ success: false, blocked: true, reason: `Scope rate limit exceeded: max ${SCOPE_RATE_LIMIT} commands/min under '${entityScope}'.`, eventType: 'OPENCLAW_SCOPE_BLOCKED' }, { status: 429 });
    }

    // ── 4. Allowlist + risk check ──────────────────────────────────────────
    const riskLevel = RISK_MAP[cmdText];
    if (!riskLevel) {
      return reject(403, 'OPENCLAW_EXECUTION_REJECTED', `'${cmdText}' is not in the global allowlist`);
    }
    if (riskLevel === 'high' || !APPROVALS_REQUIRED[riskLevel]) {
      return reject(403, 'OPENCLAW_EXECUTION_REJECTED', `HIGH risk commands are blocked pending policy`);
    }

    // ── 5. Multi-sig: check approvers array ───────────────────────────────
    const approvers      = Array.isArray(command.approvers) ? command.approvers : [];
    const uniqueApprovers = [...new Set(approvers)];
    const required       = APPROVALS_REQUIRED[riskLevel];

    if (uniqueApprovers.length < required) {
      await appendAudit(base44, command, {
        ...auditBase, eventType: 'OPENCLAW_MULTISIG_PENDING',
        reason: `Need ${required} approvers, have ${uniqueApprovers.length}`,
        approvers: uniqueApprovers,
      });
      return Response.json({
        success: false,
        multisigPending: true,
        required,
        current: uniqueApprovers.length,
        approvers: uniqueApprovers,
        reason: `MEDIUM risk requires ${required} distinct approvers. Have: ${uniqueApprovers.length}.`,
        eventType: 'OPENCLAW_MULTISIG_PENDING',
      }, { status: 202 });
    }

    // Multi-sig complete
    await appendAudit(base44, command, {
      ...auditBase, eventType: 'OPENCLAW_MULTISIG_COMPLETE',
      approvers: uniqueApprovers,
    });

    // ── 6. Global rate limit ───────────────────────────────────────────────
    if (!checkRateLimit(user.email)) {
      return reject(429, 'OPENCLAW_EXECUTION_REJECTED', 'Rate limit exceeded: max 5 commands/minute');
    }

    // ── 7. Cooldown ───────────────────────────────────────────────────────
    if (!checkCooldown(commandId)) {
      await appendAudit(base44, command, {
        ...auditBase, eventType: 'OPENCLAW_COOLDOWN_BLOCKED',
        reason: `Command cooldown active (${COOLDOWN_MS / 1000}s)`,
      });
      return Response.json({
        success: false, blocked: true,
        reason: `Command is in cooldown. Wait ${COOLDOWN_MS / 1000}s between executions.`,
        eventType: 'OPENCLAW_COOLDOWN_BLOCKED',
      }, { status: 429 });
    }

    // ── 8. LIVE execution path ─────────────────────────────────────────────
    if (executionMode === 'LIVE') {
      const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');
      const secret     = Deno.env.get('OPENCLAW_PROD_KEY') || Deno.env.get('OPENCLAW_DEV_KEY') || 'veridan-dev-secret';
      const timestamp  = Date.now().toString();
      const signature  = await hmacSign(secret, timestamp, cmdText);

      let liveResult = null;
      const fetchStart = Date.now();
      try {
        const resp = await fetch(`${gatewayUrl}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-veridan-signature': signature,
            'x-veridan-timestamp': timestamp,
            'x-veridan-mode': 'LIVE',
          },
          body: JSON.stringify({ command: cmdText, commandId }),
          signal: AbortSignal.timeout(8000),
        });
        liveResult = { status: resp.status, body: await resp.text(), latency: Date.now() - fetchStart };
      } catch (fetchErr) {
        recordFailure();
        await appendAudit(base44, command, {
          ...auditBase, eventType: 'OPENCLAW_EXECUTION_FALLBACK',
          reason: `Live fetch failed: ${fetchErr.message}`,
        });
        liveResult = null;
      }

      if (liveResult) {
        resetFailures();
        const result = { success: true, simulated: false, latency: liveResult.latency, timestamp: auditBase.timestamp, response: liveResult.body, riskLevel };
        await appendAudit(base44, command, { ...auditBase, eventType: 'OPENCLAW_EXECUTION_LIVE', result });
        await base44.entities.OpenClawCommand.update(commandId, { status: 'executed' });
        return Response.json({ success: true, result });
      }
      // Gateway unreachable → fall through to simulated
    }

    // ── 9. Simulated execution ────────────────────────────────────────────
    const simStart = Date.now();
    await new Promise(r => setTimeout(r, 200));
    const latency   = Date.now() - simStart;
    const timestamp = new Date().toISOString();
    const result    = { success: true, simulated: true, latency, timestamp, commandId, commandText: cmdText, riskLevel, executedBy: user.email };

    const evt = executionMode === 'LIVE' ? 'OPENCLAW_EXECUTION_FALLBACK' : 'OPENCLAW_EXECUTION_SIMULATED';
    await appendAudit(base44, command, { ...auditBase, eventType: evt, result });
    await base44.entities.OpenClawCommand.update(commandId, { status: 'executed' });

    return Response.json({ success: true, result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});