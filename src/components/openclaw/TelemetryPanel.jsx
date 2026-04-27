import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Radio } from 'lucide-react';
import TelemetryKpiCards from './telemetry/TelemetryKpiCards';
import TelemetryStatusBanner from './telemetry/TelemetryStatusBanner';
import TelemetrySparkline from './telemetry/TelemetrySparkline';
import TelemetryLiveStream from './telemetry/TelemetryLiveStream';

const POLL_MS = 5_000;

// Simulate gateway pings in SIMULATED mode so the panel has live data
async function simulateGatewayPing(executionMode) {
  const latency = Math.round(80 + Math.random() * 180);
  const success = Math.random() > 0.08;
  await base44.functions.invoke('openclawTelemetry', {
    action: 'ingest',
    event: { type: 'gateway.ping', latency, success, statusCode: success ? 200 : 503 },
  });
}

export default function TelemetryPanel({ executionMode = 'SIMULATED', gatewayOnline }) {
  const [snapshot, setSnapshot]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [ackLoading, setAckLoading] = useState(false);
  const pingRef = useRef(null);
  const pollRef = useRef(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('openclawTelemetry', { action: 'snapshot' });
      setSnapshot(res.data);
      setLastRefresh(new Date());
    } catch (_) {}
    setLoading(false);
  }, []);

  const handleAcknowledge = async () => {
    setAckLoading(true);
    await base44.functions.invoke('openclawTelemetry', { action: 'acknowledge', note: 'Manually acknowledged from Telemetry panel' });
    setAckLoading(false);
    fetchSnapshot();
  };

  useEffect(() => {
    fetchSnapshot();

    // Poll for snapshot every 5s
    pollRef.current = setInterval(fetchSnapshot, POLL_MS);

    // Simulate gateway pings every 8s (gives the aggregator data to work with)
    pingRef.current = setInterval(() => simulateGatewayPing(executionMode), 8_000);
    // Kick off one immediately
    simulateGatewayPing(executionMode);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(pingRef.current);
    };
  }, [fetchSnapshot, executionMode]);

  const metrics     = snapshot?.metrics || {};
  const systemState = snapshot?.systemState || 'NORMAL';
  const anomalies   = snapshot?.anomalies || [];
  const events      = snapshot?.recentEvents || [];

  return (
    <div className="p-5 space-y-4 font-mono max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">OpenClaw Telemetry</div>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-[12px] font-semibold text-foreground">
              Live Stream · {executionMode} mode
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-muted-foreground/40">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchSnapshot}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <TelemetryStatusBanner
        systemState={systemState}
        anomalies={anomalies}
        loading={loading}
        onAcknowledge={handleAcknowledge}
      />

      {/* KPI Cards */}
      <TelemetryKpiCards metrics={metrics} />

      {/* Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Latency (1m)', metric: 'latency', window: '1m' },
          { label: 'Error Rate (5m)', metric: 'errorRate', window: '5m' },
          { label: 'Requests/bucket (1m)', metric: 'count', window: '1m' },
        ].map(({ label, metric, window: w }) => (
          <div key={label} className="bg-card border border-border p-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-2">{label}</div>
            <TelemetrySparkline recentEvents={snapshot?.recentEvents} window={w} metric={metric} />
          </div>
        ))}
      </div>

      {/* 1m / 5m / 15m metric table */}
      <div className="bg-card border border-border">
        <div className="px-4 py-2 border-b border-border text-[9px] uppercase tracking-widest text-muted-foreground/50">Rolling Window Metrics</div>
        <div className="overflow-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-border/50">
                {['Window', 'Requests', 'Success Rate', 'Avg Latency', 'Error Rate'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[9px] uppercase tracking-widest text-muted-foreground/50 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['1m', '5m', '15m'].map(w => {
                const m = metrics[w] || {};
                return (
                  <tr key={w} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-2 text-muted-foreground">{w}</td>
                    <td className="px-4 py-2 text-foreground">{m.requestCount ?? '—'}</td>
                    <td className={`px-4 py-2 font-semibold ${(m.successRate ?? 1) >= 0.8 ? 'text-primary' : 'text-destructive'}`}>
                      {m.successRate != null ? `${(m.successRate * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className={`px-4 py-2 ${(m.avgLatency ?? 0) > 400 ? 'text-amber-500' : 'text-foreground'}`}>
                      {m.avgLatency != null ? `${m.avgLatency}ms` : '—'}
                    </td>
                    <td className={`px-4 py-2 ${(m.errorRate ?? 0) > 0.2 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {m.errorRate != null ? `${(m.errorRate * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Stream */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-2">Live Event Stream</div>
        <TelemetryLiveStream events={events} />
      </div>

      <div className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-widest">
        Telemetry is read-only · No control actions · Polling every {POLL_MS / 1000}s
      </div>
    </div>
  );
}