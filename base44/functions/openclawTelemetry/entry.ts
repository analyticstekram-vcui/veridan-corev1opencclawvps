import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Rolling metric windows (in-memory per isolate) ─────────────────────────
const WINDOWS = { '1m': 60_000, '5m': 300_000, '15m': 900_000 };

// Each event: { ts, success, latency, type }
const eventLog = [];
let circuitTrips = []; // timestamps of circuit breaker trips
let baseline = { avgLatency: 200, requestRate: 2 }; // seed baselines

function pruneLog() {
  const cutoff = Date.now() - WINDOWS['15m'];
  while (eventLog.length && eventLog[0].ts < cutoff) eventLog.shift();
  circuitTrips = circuitTrips.filter(t => Date.now() - t < WINDOWS['5m']);
}

function windowMetrics(windowMs) {
  const cutoff = Date.now() - windowMs;
  const slice  = eventLog.filter(e => e.ts >= cutoff);
  if (!slice.length) return { requestCount: 0, successRate: 1, avgLatency: 0, errorRate: 0 };
  const successes  = slice.filter(e => e.success).length;
  const withLatency = slice.filter(e => e.latency != null);
  return {
    requestCount: slice.length,
    successRate:  parseFloat((successes / slice.length).toFixed(3)),
    avgLatency:   withLatency.length ? Math.round(withLatency.reduce((a, e) => a + e.latency, 0) / withLatency.length) : 0,
    errorRate:    parseFloat(((slice.length - successes) / slice.length).toFixed(3)),
  };
}

function detectAnomalies(metrics1m, metrics5m) {
  const anomalies = [];
  const trips5m   = circuitTrips.filter(t => Date.now() - t < WINDOWS['5m']).length;

  if (metrics1m.avgLatency > baseline.avgLatency * 2 && metrics1m.requestCount > 0) {
    anomalies.push({ type: 'OPENCLAW_ANOMALY_WARNING', rule: 'latency_spike', detail: `Avg latency ${metrics1m.avgLatency}ms > 2x baseline ${baseline.avgLatency}ms` });
  }
  if (metrics1m.errorRate > 0.2 && metrics1m.requestCount >= 3) {
    anomalies.push({ type: 'OPENCLAW_ANOMALY_WARNING', rule: 'error_rate', detail: `Error rate ${(metrics1m.errorRate * 100).toFixed(1)}% > 20% threshold (1m)` });
  }
  if (trips5m >= 2) {
    anomalies.push({ type: 'OPENCLAW_ANOMALY_BLOCKED', rule: 'circuit_breaker', detail: `${trips5m} circuit breaker trips in 5m — auto-pause triggered` });
  }
  if (metrics1m.requestCount > baseline.requestRate * 3 && baseline.requestRate > 0) {
    anomalies.push({ type: 'OPENCLAW_ANOMALY_WARNING', rule: 'request_spike', detail: `Request spike: ${metrics1m.requestCount}/min > 3x baseline ${baseline.requestRate}/min` });
  }
  return anomalies;
}

function updateBaseline(metrics15m) {
  if (metrics15m.requestCount > 5) {
    baseline.avgLatency  = Math.round(metrics15m.avgLatency * 0.8 + baseline.avgLatency * 0.2);
    baseline.requestRate = Math.round((metrics15m.requestCount / 15) * 0.8 + baseline.requestRate * 0.2);
  }
}

// ── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, event } = body;

    pruneLog();

    // ── Ingest a telemetry event ──────────────────────────────────────────
    if (action === 'ingest') {
      const { type, latency, success, code, message, commandId } = event || {};
      const ts = Date.now();

      const entry = { ts, type, success: success !== false, latency: latency ?? null, commandId };
      eventLog.push(entry);

      if (type === 'circuit_breaker_trip') circuitTrips.push(ts);

      // Compute metrics
      const m1m  = windowMetrics(WINDOWS['1m']);
      const m5m  = windowMetrics(WINDOWS['5m']);
      const m15m = windowMetrics(WINDOWS['15m']);
      updateBaseline(m15m);

      const anomalies = detectAnomalies(m1m, m5m);
      const autoPause = anomalies.some(a => a.type === 'OPENCLAW_ANOMALY_BLOCKED');
      const systemState = autoPause ? 'BLOCKED' : anomalies.length > 0 ? 'WARNING' : 'NORMAL';

      // Persist anomalies to a recent command's audit log if relevant
      if (anomalies.length > 0 && commandId) {
        try {
          const cmds = await base44.asServiceRole.entities.OpenClawCommand.filter({ id: commandId });
          if (cmds[0]) {
            const existing = Array.isArray(cmds[0].auditLog) ? cmds[0].auditLog : [];
            const newEntries = anomalies.map(a => ({
              ...a, timestamp: new Date().toISOString(), triggeredBy: 'telemetry_engine',
              autoPause: a.type === 'OPENCLAW_ANOMALY_BLOCKED',
            }));
            await base44.asServiceRole.entities.OpenClawCommand.update(commandId, {
              auditLog: [...existing, ...newEntries],
            });
          }
        } catch (_) { /* non-blocking */ }
      }

      return Response.json({ ok: true, systemState, anomalies, metrics: { '1m': m1m, '5m': m5m, '15m': m15m }, baseline });
    }

    // ── Pull current metrics snapshot ─────────────────────────────────────
    if (action === 'snapshot') {
      const m1m  = windowMetrics(WINDOWS['1m']);
      const m5m  = windowMetrics(WINDOWS['5m']);
      const m15m = windowMetrics(WINDOWS['15m']);
      const anomalies  = detectAnomalies(m1m, m5m);
      const autoPause  = anomalies.some(a => a.type === 'OPENCLAW_ANOMALY_BLOCKED');
      const systemState = autoPause ? 'BLOCKED' : anomalies.length > 0 ? 'WARNING' : 'NORMAL';

      // Return last 50 events for the live stream panel
      const recentEvents = eventLog.slice(-50).reverse().map(e => ({
        ...e,
        tsIso: new Date(e.ts).toISOString(),
      }));

      return Response.json({
        ok: true, systemState, anomalies,
        metrics: { '1m': m1m, '5m': m5m, '15m': m15m },
        baseline, recentEvents,
        circuitTrips5m: circuitTrips.filter(t => Date.now() - t < WINDOWS['5m']).length,
      });
    }

    // ── Acknowledge warning (audit log only) ───────────────────────────────
    if (action === 'acknowledge') {
      const { commandId: ackId, note } = body;
      if (ackId) {
        try {
          const cmds = await base44.asServiceRole.entities.OpenClawCommand.filter({ id: ackId });
          if (cmds[0]) {
            const existing = Array.isArray(cmds[0].auditLog) ? cmds[0].auditLog : [];
            await base44.asServiceRole.entities.OpenClawCommand.update(ackId, {
              auditLog: [...existing, {
                eventType: 'OPENCLAW_ANOMALY_ACKNOWLEDGED',
                acknowledgedBy: user.email,
                note: note || '',
                timestamp: new Date().toISOString(),
              }],
            });
          }
        } catch (_) { /* non-blocking */ }
      }
      return Response.json({ ok: true, acknowledged: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});