import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

export default function TelemetrySparkline({ recentEvents, window: windowLabel = '1m', metric = 'latency' }) {
  const windowMs = windowLabel === '5m' ? 300_000 : 60_000;

  const data = useMemo(() => {
    const cutoff = Date.now() - windowMs;
    const bucketMs = windowLabel === '5m' ? 30_000 : 6_000;
    const filtered = (recentEvents || []).filter(e => e.ts >= cutoff);
    if (!filtered.length) return [];

    const buckets = {};
    filtered.forEach(e => {
      const bucket = Math.floor(e.ts / bucketMs) * bucketMs;
      if (!buckets[bucket]) buckets[bucket] = { latencies: [], errors: 0, total: 0 };
      if (e.latency != null) buckets[bucket].latencies.push(e.latency);
      if (!e.success) buckets[bucket].errors++;
      buckets[bucket].total++;
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a - b)
      .map(([ts, b]) => ({
        ts: parseInt(ts),
        latency: b.latencies.length ? Math.round(b.latencies.reduce((a, v) => a + v, 0) / b.latencies.length) : 0,
        errorRate: b.total > 0 ? parseFloat(((b.errors / b.total) * 100).toFixed(1)) : 0,
        count: b.total,
      }));
  }, [recentEvents, windowMs, windowLabel]);

  const metricKey = metric === 'errorRate' ? 'errorRate' : metric === 'count' ? 'count' : 'latency';
  const color = metric === 'errorRate' ? '#ef4444' : metric === 'count' ? '#3b82f6' : '#22c55e';
  const unit  = metric === 'errorRate' ? '%' : metric === 'count' ? '' : 'ms';

  if (!data.length) {
    return (
      <div className="h-16 flex items-center justify-center text-[10px] font-mono text-muted-foreground/30">
        No data in {windowLabel}
      </div>
    );
  }

  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            content={({ active, payload }) => active && payload?.length ? (
              <div className="bg-popover border border-border px-2 py-1 text-[10px] font-mono">
                {payload[0]?.value}{unit}
              </div>
            ) : null}
          />
          <Line type="monotone" dataKey={metricKey} stroke={color} dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}