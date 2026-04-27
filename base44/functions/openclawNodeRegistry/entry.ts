import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Routing logic ─────────────────────────────────────────────────────────
// Scores a node for a given step. Higher = better.
function scoreNode(node, step) {
  if (node.health === 'offline') return -Infinity;

  // Must support the capability
  const caps = node.capabilities || [];
  if (!caps.includes(step.capabilityId)) return -Infinity;

  // Must support the scope
  const scopes = node.scopes || [];
  if (step.entityScope && !scopes.includes(step.entityScope)) return -Infinity;

  let score = 0;
  if (node.health === 'healthy') score += 100;
  else if (node.health === 'degraded') score += 30;
  else score += 0; // unknown

  // Lower latency → higher score (cap at 2000ms)
  const lat = node.latencyMs ?? 999;
  score += Math.max(0, 100 - lat / 20);

  // Lower error rate → higher score
  const errRate = node.errorRate ?? 0;
  score -= errRate * 50;

  return score;
}

function routeStep(nodes, step) {
  let best = null;
  let bestScore = -Infinity;
  for (const n of nodes) {
    const s = scoreNode(n, step);
    if (s > bestScore) { bestScore = s; best = n; }
  }
  return best;
}

// ── Audit helper ──────────────────────────────────────────────────────────
async function sha256(obj) {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function appendAudit(base44, node, entry) {
  // Nodes don't have auditLog — we store events via LLM integration (fire & forget)
  // Just return the entry for caller use
  return { ...entry, hash: await sha256(entry) };
}

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── LIST ───────────────────────────────────────────────────────────────
    if (action === 'list') {
      const nodes = await base44.entities.OpenClawNode.list('-created_date', 100);
      return Response.json({ success: true, nodes });
    }

    // ── ADD ────────────────────────────────────────────────────────────────
    if (action === 'add') {
      const { nodeId, url, capabilities = [], scopes = [], notes = '' } = body;
      if (!nodeId || !url) return Response.json({ error: 'nodeId and url required' }, { status: 400 });

      const node = await base44.entities.OpenClawNode.create({
        nodeId, url, capabilities, scopes, notes,
        health: 'unknown', latencyMs: null, lastHealthCheck: null, errorRate: 0, requestCount: 0,
      });

      return Response.json({ success: true, node, event: 'OPENCLAW_NODE_ADDED' });
    }

    // ── REMOVE ─────────────────────────────────────────────────────────────
    if (action === 'remove') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      await base44.entities.OpenClawNode.delete(id);
      return Response.json({ success: true });
    }

    // ── HEALTH_CHECK ───────────────────────────────────────────────────────
    if (action === 'health_check') {
      const { id } = body;
      const nodes = id
        ? await base44.entities.OpenClawNode.filter({ id })
        : await base44.entities.OpenClawNode.list('-created_date', 100);

      const results = [];
      for (const node of nodes) {
        const t0 = Date.now();
        let health = 'offline';
        let latencyMs = null;

        try {
          const resp = await fetch(`${node.url}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          latencyMs = Date.now() - t0;
          if (resp.ok) health = 'healthy';
          else if (resp.status < 500) health = 'degraded';
          else health = 'offline';
        } catch {
          latencyMs = Date.now() - t0;
          health = 'offline';
        }

        const prevHealth = node.health;
        await base44.entities.OpenClawNode.update(node.id, {
          health,
          latencyMs,
          lastHealthCheck: new Date().toISOString(),
        });

        const changed = prevHealth !== health;
        results.push({
          nodeId: node.nodeId,
          id: node.id,
          health,
          latencyMs,
          changed,
          event: changed ? 'OPENCLAW_NODE_HEALTH_CHANGED' : null,
          prev: prevHealth,
        });
      }

      return Response.json({ success: true, results });
    }

    // ── ROUTE ──────────────────────────────────────────────────────────────
    // Given a step, return the best node to handle it
    if (action === 'route') {
      const { step } = body;
      if (!step) return Response.json({ error: 'step required' }, { status: 400 });

      const nodes = await base44.entities.OpenClawNode.list('-created_date', 100);
      const best = routeStep(nodes, step);

      if (!best) {
        return Response.json({ success: false, reason: 'No eligible node found for this step' }, { status: 404 });
      }

      // Increment request count
      await base44.entities.OpenClawNode.update(best.id, {
        requestCount: (best.requestCount || 0) + 1,
      });

      return Response.json({ success: true, node: best });
    }

    // ── UPDATE_METRICS ─────────────────────────────────────────────────────
    // Record a step result back against a node (latency, errorRate rolling update)
    if (action === 'update_metrics') {
      const { id, latencyMs, success: stepSuccess } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });

      const nodes = await base44.entities.OpenClawNode.filter({ id });
      const node = nodes[0];
      if (!node) return Response.json({ error: 'Node not found' }, { status: 404 });

      // Exponential moving average for latency (α=0.3)
      const alpha = 0.3;
      const prevLat = node.latencyMs ?? latencyMs;
      const newLat = Math.round(alpha * latencyMs + (1 - alpha) * prevLat);

      // EMA for error rate
      const prevErr = node.errorRate ?? 0;
      const newErr = parseFloat((alpha * (stepSuccess ? 0 : 1) + (1 - alpha) * prevErr).toFixed(4));

      await base44.entities.OpenClawNode.update(id, { latencyMs: newLat, errorRate: newErr });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});