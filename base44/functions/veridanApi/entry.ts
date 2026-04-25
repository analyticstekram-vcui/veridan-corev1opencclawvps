import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── In-memory store ─────────────────────────────────────────────────────────
const logs = [];
const pendingCommands = new Map();

function timeStr() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addLog({ source, action, status, commandId = null }) {
  logs.unshift({ time: timeStr(), timestamp: new Date().toISOString(), source, action, status, commandId });
  if (logs.length > 200) logs.pop();
}

// ─── OpenClaw helpers ─────────────────────────────────────────────────────────
const OPENCLAW_BASE = 'http://localhost:18789';

async function pingOpenClaw() {
  const start = Date.now();
  const res = await fetch(`${OPENCLAW_BASE}/health`, { signal: AbortSignal.timeout(3000) });
  return { online: res.ok, latencyMs: Date.now() - start };
}

async function sendToOpenClaw(command, context) {
  const res = await fetch(`${OPENCLAW_BASE}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: command, context }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`OpenClaw responded ${res.status}`);
  return res.json();
}

// ─── AI Interpretation ────────────────────────────────────────────────────────
async function interpretCommand(base44, command) {
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the Veridan Core AI security layer. Interpret the following user command and return a structured JSON decision.

Command: "${command}"

Return:
- action: short machine-readable action name (e.g. "credit_audit", "dispute_tradeline", "vault_sync", "status_check")
- requiresApproval: true if the action modifies external data, submits disputes, sends communications, or carries financial/legal risk; false for read-only queries
- riskLevel: "low" for read-only queries, "medium" for internal changes, "high" for external submissions or irreversible actions
- summary: 1-2 sentence human-readable explanation of what this command will do and what system will execute it

Only return raw JSON.`,
    response_json_schema: {
      type: 'object',
      properties: {
        action: { type: 'string' },
        requiresApproval: { type: 'boolean' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        summary: { type: 'string' },
      },
      required: ['action', 'requiresApproval', 'riskLevel', 'summary'],
    },
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  let body = {};
  try {
    body = await req.json();
  } catch (_) { /* GET-like calls may have no body */ }

  const route = body._route || 'status';

  // ── status ─────────────────────────────────────────────────────────────────
  if (route === 'status') {
    let openclawStatus = { online: false, latencyMs: null };
    try { openclawStatus = await pingOpenClaw(); } catch (_) { /* offline */ }
    addLog({ source: 'SYSTEM', action: 'Status check', status: 'OK' });
    return Response.json({
      ai: { online: true, model: 'veridan-llm' },
      openclaw: openclawStatus,
      vault: { linked: true, name: 'VRD-PRIMARY' },
      timestamp: new Date().toISOString(),
    });
  }

  // ── logs ───────────────────────────────────────────────────────────────────
  if (route === 'logs') {
    return Response.json({ logs });
  }

  // ── command ────────────────────────────────────────────────────────────────
  if (route === 'command') {
    const { command } = body;
    if (!command?.trim()) return Response.json({ error: 'command is required' }, { status: 400 });

    addLog({ source: 'USER', action: command, status: 'RECEIVED' });

    let decision;
    try {
      decision = await interpretCommand(base44, command);
    } catch (err) {
      addLog({ source: 'AI', action: 'Interpretation failed', status: 'ERROR' });
      return Response.json({ error: 'AI interpretation failed: ' + err.message }, { status: 500 });
    }

    addLog({
      source: 'AI',
      action: `Decision: ${decision.action} [risk=${decision.riskLevel}]`,
      status: decision.requiresApproval ? 'PENDING' : 'OK',
    });

    const commandId = crypto.randomUUID();

    if (decision.requiresApproval) {
      pendingCommands.set(commandId, { command, decision, createdAt: new Date().toISOString() });
      addLog({ source: 'AI-CMD', action: `Staged for approval: ${decision.action}`, status: 'PENDING', commandId });
      return Response.json({ ...decision, commandId, status: 'pending_approval' });
    }

    // Low risk — attempt OpenClaw execution
    let openclawResult = null;
    try {
      openclawResult = await sendToOpenClaw(command, decision);
      addLog({ source: 'OPENCLAW', action: `Executed: ${decision.action}`, status: 'OK', commandId });
    } catch (_) {
      addLog({ source: 'OPENCLAW', action: `Skipped (offline): ${decision.action}`, status: 'SKIPPED', commandId });
      openclawResult = { note: 'OpenClaw offline — decision returned without execution' };
    }

    return Response.json({ ...decision, commandId, status: 'executed', result: openclawResult });
  }

  // ── approve ────────────────────────────────────────────────────────────────
  if (route === 'approve') {
    const { commandId, approved } = body;
    if (!commandId) return Response.json({ error: 'commandId is required' }, { status: 400 });

    const pending = pendingCommands.get(commandId);
    if (!pending) return Response.json({ error: 'Command not found or already resolved' }, { status: 404 });

    pendingCommands.delete(commandId);

    if (!approved) {
      addLog({ source: 'USER', action: `Denied: ${pending.decision.action}`, status: 'DENIED', commandId });
      return Response.json({ status: 'denied', commandId });
    }

    addLog({ source: 'USER', action: `Approved: ${pending.decision.action}`, status: 'APPROVED', commandId });

    let openclawResult = null;
    try {
      openclawResult = await sendToOpenClaw(pending.command, pending.decision);
      addLog({ source: 'OPENCLAW', action: `Executed after approval: ${pending.decision.action}`, status: 'OK', commandId });
    } catch (err) {
      addLog({ source: 'OPENCLAW', action: `Execution failed: ${err.message}`, status: 'ERROR', commandId });
      openclawResult = { error: err.message };
    }

    return Response.json({ status: 'executed', commandId, result: openclawResult, decision: pending.decision });
  }

  return Response.json({ error: 'Unknown route' }, { status: 404 });
});