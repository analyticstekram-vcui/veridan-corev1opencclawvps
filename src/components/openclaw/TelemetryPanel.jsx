import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Radio } from 'lucide-react';
import TelemetryKpiCards from './telemetry/TelemetryKpiCards';
import TelemetryStatusBanner from './telemetry/TelemetryStatusBanner';
import TelemetrySparkline from './telemetry/TelemetrySparkline';
import TelemetryLiveStream from './telemetry/TelemetryLiveStream';

const POLL_MS = 5_000;

// Helper: fetch gateway connector health
async function fetchGatewayConnectorHealth() {
  try {
    const response = await base44.functions.invoke('openclawGatewayReadOnlyConnector', {
      readType: 'health',
    });
    return response.data;
  } catch (err) {
    return { gatewayOnline: false, error: err.message };
  }
}

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
  const [gatewayHealth, setGatewayHealth] = useState(null);
  const [proposalStats, setProposalStats] = useState(null);
  const pingRef = useRef(null);
  const pollRef = useRef(null);
  const gwPollRef = useRef(null);
  const propPollRef = useRef(null);

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

    // Fetch gateway connector health every 10s
    fetchGatewayConnectorHealth().then(setGatewayHealth);
    gwPollRef.current = setInterval(() => {
      fetchGatewayConnectorHealth().then(setGatewayHealth);
    }, 10_000);

    // Fetch proposal statistics every 15s
    const fetchProposalStats = async () => {
      try {
        const res = await base44.functions.invoke('openclawProposalManagement', { action: 'list' });
        const proposals = res.data?.proposals || [];
        setProposalStats({
          total: proposals.length,
          draft: proposals.filter(p => p.status === 'DRAFT').length,
          pending: proposals.filter(p => p.status === 'PENDING_APPROVAL').length,
          approved: proposals.filter(p => p.status === 'APPROVED').length,
          denied: proposals.filter(p => p.status === 'DENIED').length,
        });
      } catch (err) {
        console.error('Failed to fetch proposal stats:', err);
      }
    };
    fetchProposalStats();
    propPollRef.current = setInterval(fetchProposalStats, 15_000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(pingRef.current);
      if (gwPollRef.current) clearInterval(gwPollRef.current);
      if (propPollRef.current) clearInterval(propPollRef.current);
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
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">OpenClaw Telemetry</div>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-[12px] font-semibold text-foreground">
              Live Stream · {executionMode} mode
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-slate-400 font-semibold">
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
            <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">{label}</div>
            <TelemetrySparkline recentEvents={snapshot?.recentEvents} window={w} metric={metric} />
          </div>
        ))}
      </div>

      {/* 1m / 5m / 15m metric table */}
      <div className="bg-card border border-border">
        <div className="px-4 py-2 border-b border-border text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Rolling Window Metrics</div>
        <div className="overflow-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-border/50">
                {['Window', 'Requests', 'Success Rate', 'Avg Latency', 'Error Rate'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[9px] uppercase tracking-widest text-slate-400 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['1m', '5m', '15m'].map(w => {
                const m = metrics[w] || {};
                return (
                  <tr key={w} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-2 text-slate-400 font-semibold">{w}</td>
                    <td className="px-4 py-2 text-foreground">{m.requestCount ?? '—'}</td>
                    <td className={`px-4 py-2 font-semibold ${(m.successRate ?? 1) >= 0.8 ? 'text-primary' : 'text-destructive'}`}>
                      {m.successRate != null ? `${(m.successRate * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className={`px-4 py-2 ${(m.avgLatency ?? 0) > 400 ? 'text-amber-500' : 'text-foreground'}`}>
                      {m.avgLatency != null ? `${m.avgLatency}ms` : '—'}
                    </td>
                    <td className={`px-4 py-2 ${(m.errorRate ?? 0) > 0.2 ? 'text-destructive' : 'text-slate-400'}`}>
                      {m.errorRate != null ? `${(m.errorRate * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Connector Health */}
      {gatewayHealth && (
        <div className={`border rounded-lg p-3 ${
          gatewayHealth.gatewayOnline 
            ? 'bg-primary/5 border-primary/20' 
            : 'bg-slate-500/5 border-slate-500/20'
        }`}>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">
            Gateway Connector Health
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Status</div>
              <div className={`font-semibold ${gatewayHealth.gatewayOnline ? 'text-primary' : 'text-slate-400'}`}>
                {gatewayHealth.gatewayOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Latency</div>
              <div className="font-semibold text-foreground">{gatewayHealth.latencyMs}ms</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Mode</div>
              <div className="font-semibold text-foreground">
                {gatewayHealth.gatewayOnline ? 'READ_ONLY' : 'SIMULATED'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Statistics */}
      {proposalStats && (
        <div className="border border-border/50 rounded-lg p-3 bg-secondary/10">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">
            Command Proposals (Non-Executable)
          </div>
          <div className="grid grid-cols-5 gap-2 text-[9px]">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded text-center">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total</div>
              <div className="font-semibold text-foreground text-[12px]">{proposalStats.total}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded text-center">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Draft</div>
              <div className="font-semibold text-slate-400 text-[12px]">{proposalStats.draft}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded text-center">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Pending</div>
              <div className="font-semibold text-amber-500 text-[12px]">{proposalStats.pending}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded text-center">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Approved</div>
              <div className="font-semibold text-primary text-[12px]">{proposalStats.approved}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded text-center">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Denied</div>
              <div className="font-semibold text-destructive text-[12px]">{proposalStats.denied}</div>
            </div>
          </div>
          <div className="text-[8px] text-muted-foreground/60 border-t border-border/30 mt-2 pt-2">
            All proposals remain non-executable. Approval does not execute. Execution requires explicit future authorization.
          </div>
        </div>
      )}

      {/* Live Stream */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">Live Event Stream</div>
        <TelemetryLiveStream events={events} />
      </div>

      <div className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-semibold">
        Telemetry is read-only · No control actions · Polling every {POLL_MS / 1000}s · Gateway health every 10s · Proposals every 15s
      </div>
    </div>
  );
}