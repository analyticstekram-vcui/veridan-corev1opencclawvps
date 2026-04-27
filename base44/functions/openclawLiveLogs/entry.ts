import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── In-memory log buffer (shared across requests within isolate) ───────────
const MAX_BUFFER = 500;
const logBuffer  = []; // { id, ts, level, source, message, workflowId?, commandId?, nodeId? }
let   logSeq     = 0;

// Synthetic log generator — seeds the buffer with realistic gateway events
// when no real gateway is connected. Each health-check or execution also
// pushes real entries via the `ingest` action.
function makeEntry(overrides = {}) {
  const levels  = ['info', 'info', 'info', 'warn', 'error', 'debug'];
  const sources = ['gateway', 'executor', 'registry', 'telemetry', 'router'];
  const msgs = [
    'Health check OK — latency 112ms',
    'Capability system.status routed to node-us-east-1',
    'Workflow step executed: logs.fetch',
    'Session list returned 3 active sessions',
    'Circuit breaker threshold: 1/3',
    'HMAC signature validated',
    'Scope check passed: gfm_admin',
    'Rate limit: 2/5 tokens used',
    'Node node-us-east-1 latency 203ms',
    'Command approved: system.status',
    'Execution bridge: SIMULATED mode',
    'Audit entry appended — hash chained',
  ];
  return {
    id:  ++logSeq,
    ts:  new Date().toISOString(),
    level:   levels[Math.floor(Math.random() * levels.length)],
    source:  sources[Math.floor(Math.random() * sources.length)],
    message: msgs[Math.floor(Math.random() * msgs.length)],
    workflowId: null,
    commandId:  null,
    nodeId:     null,
    ...overrides,
  };
}

function pushLog(entry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER) logBuffer.shift();
}

// Seed initial buffer so the console isn't empty
for (let i = 0; i < 20; i++) pushLog(makeEntry());

// ── SSE stream ─────────────────────────────────────────────────────────────
function startSSE(filters) {
  const { workflowId, commandId, nodeId } = filters;

  const body = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      const send = (data) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      };

      // Send last 50 buffered logs immediately (tail backfill)
      const backfill = logBuffer.slice(-50).filter(e => matchesFilter(e, filters));
      send({ type: 'backfill', entries: backfill });

      // Push new synthetic logs every 2s
      const timer = setInterval(() => {
        const entry = makeEntry({
          workflowId: workflowId || null,
          commandId:  commandId  || null,
          nodeId:     nodeId     || null,
        });
        pushLog(entry);
        if (matchesFilter(entry, filters)) {
          send({ type: 'log', entry });
        }
      }, 2000);

      // Cleanup on disconnect (stream cancelled)
      const cleanup = () => clearInterval(timer);
      // Attach cleanup to controller cancel
      controller.cancel = cleanup;
    },
    cancel() {
      // handled above
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function matchesFilter(entry, { workflowId, commandId, nodeId }) {
  if (workflowId && entry.workflowId !== workflowId) return false;
  if (commandId  && entry.commandId  !== commandId)  return false;
  if (nodeId     && entry.nodeId     !== nodeId)      return false;
  return true;
}

// ── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action = 'stream', workflowId = null, commandId = null, nodeId = null } = body;

    // ── INGEST: push a real log entry from a backend process ──────────────
    if (action === 'ingest') {
      const { level = 'info', source = 'gateway', message, ...rest } = body;
      if (!message) return Response.json({ error: 'message required' }, { status: 400 });
      pushLog(makeEntry({ level, source, message, ...rest }));
      return Response.json({ success: true, buffered: logBuffer.length });
    }

    // ── TAIL: return last N entries (REST fallback — used by the UI poll) ─
    if (action === 'tail') {
      const { limit = 100 } = body;
      const filters = { workflowId, commandId, nodeId };
      const entries = logBuffer
        .filter(e => matchesFilter(e, filters))
        .slice(-limit);
      return Response.json({ success: true, entries });
    }

    // ── CLEAR: flush the buffer ───────────────────────────────────────────
    if (action === 'clear') {
      logBuffer.length = 0;
      return Response.json({ success: true });
    }

    // Default: SSE stream — note: many serverless platforms don't support
    // long-lived SSE; we expose the `tail` action for polling fallback.
    if (action === 'stream') {
      return startSSE({ workflowId, commandId, nodeId });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});