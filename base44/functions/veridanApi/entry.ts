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

// ─── Veridan VPS backend (OpenClaw bridge) ────────────────────────────────────
const VERIDAN_BACKEND = 'http://142.93.206.36:3001';

async function sendToVeridanBackend(command) {
  const start = Date.now();
  const res = await fetch(`${VERIDAN_BACKEND}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Veridan backend responded ${res.status}`);
  const data = await res.json();
  return { ...data, latencyMs: Date.now() - start };
}

// ─── Direct OpenClaw gateway health check (mirrors openclawStatus function) ──
const OPENCLAW_GATEWAY_URL = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'https://openclaw.veridancore.com';

async function checkOpenClawGateway() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(OPENCLAW_GATEWAY_URL, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'VeridanCore-HealthCheck/1.0' },
    });
    clearTimeout(timeout);
    const s = res.status;
    if (s === 200) {
      return { online: true, diagnostic: 'openclaw_online', diagnosticDetail: 'OpenClaw gateway returned HTTP 200 — fully online.', gatewayStatus: s };
    } else if (s === 302 || s === 301 || s === 307 || s === 308) {
      return { online: true, diagnostic: 'cloudflare_protected_reachable', diagnosticDetail: `OpenClaw gateway reachable — Cloudflare Access redirect (HTTP ${s}).`, gatewayStatus: s };
    } else if (s === 401 || s === 403) {
      return { online: true, diagnostic: 'cloudflare_protected_reachable', diagnosticDetail: `OpenClaw gateway reachable — Cloudflare Access enforced (HTTP ${s}).`, gatewayStatus: s };
    } else if (s >= 500) {
      return { online: false, diagnostic: 'gateway_error', diagnosticDetail: `OpenClaw gateway server error HTTP ${s}.`, gatewayStatus: s };
    } else {
      return { online: true, diagnostic: 'openclaw_online', diagnosticDetail: `OpenClaw gateway responded HTTP ${s}.`, gatewayStatus: s };
    }
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err?.name === 'AbortError';
    return {
      online: false,
      diagnostic: 'gateway_unreachable',
      diagnosticDetail: isTimeout ? 'Health check timed out after 8s.' : `OpenClaw gateway unreachable: ${err?.message || 'network error'}.`,
      gatewayStatus: null,
    };
  }
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
    const gatewayCheck = await checkOpenClawGateway();
    addLog({
      source: 'OPENCLAW',
      action: `Gateway check: ${gatewayCheck.diagnosticDetail}`,
      status: gatewayCheck.online ? 'OK' : 'ERROR',
    });
    return Response.json({
      ai: { online: true, model: 'veridan-llm' },
      openclaw: {
        online: gatewayCheck.online,
        diagnostic: gatewayCheck.diagnostic,
        diagnosticDetail: gatewayCheck.diagnosticDetail,
        gatewayStatus: gatewayCheck.gatewayStatus,
        latencyMs: null,
      },
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

    // Route command through Veridan VPS backend → OpenClaw bridge
    let openclawResult = null;
    let openclawConnected = false;
    try {
      const backendRes = await sendToVeridanBackend(command);
      openclawConnected = backendRes.openclawConnected === true;
      openclawResult = backendRes.openclawResponse || backendRes;
      addLog({ source: openclawConnected ? 'OPENCLAW' : 'SYSTEM', action: decision.action, status: 'OK', commandId });
    } catch (err) {
      addLog({ source: 'OPENCLAW', action: decision.action, status: 'ERROR', commandId });
      openclawResult = { note: err.message };
    }

    return Response.json({ ...decision, commandId, status: 'executed', result: openclawResult, openclawConnected });
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
      const backendRes = await sendToVeridanBackend(pending.command);
      openclawResult = backendRes.openclawResponse || backendRes;
      addLog({ source: backendRes.openclawConnected ? 'OPENCLAW' : 'SYSTEM', action: `Executed after approval: ${pending.decision.action}`, status: 'OK', commandId });
    } catch (err) {
      addLog({ source: 'OPENCLAW', action: `Execution failed: ${err.message}`, status: 'ERROR', commandId });
      openclawResult = { error: err.message };
    }

    return Response.json({ status: 'executed', commandId, result: openclawResult, decision: pending.decision });
  }

  return Response.json({ error: 'Unknown route' }, { status: 404 });
});